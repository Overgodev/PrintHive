// File path: server/api/printers/update-status.ts

import axios from 'axios';
import { db } from '../../utils/db';

interface MoonrakerPrinterStatus {
  state: string;
  print_stats: {
    state: string;
    filename: string;
    total_duration: number;
    print_duration: number;
    filament_used: number;
    progress: number;
  };
  extruder: {
    temperature: number;
    target: number;
  };
  heater_bed: {
    temperature: number;
    target: number;
  };
}

interface PrinterUpdateData {
  printerId: number;
  status: string;
  currentJob?: string | null;
  progress?: number | null;
  extruderTemp?: number | null;
  bedTemp?: number | null;
}



/**
 * Updates the printer status in the database
 */
async function updatePrinterStatus(printerData: PrinterUpdateData): Promise<void> {
  try {
    // Update the printer status in the database
    await db.query(`
      UPDATE printer
      SET 
        status = ?,
        current_job = ?,
        progress = ?,
        extruder_temp = ?,
        bed_temp = ?,
        last_updated = NOW()
      WHERE printer_id = ?
    `, [
      printerData.status,
      printerData.currentJob || null,
      printerData.progress || null,
      printerData.extruderTemp || null,
      printerData.bedTemp || null,
      printerData.printerId
    ]);
    
    console.log(`Updated status for printer ID ${printerData.printerId} to ${printerData.status}`);
  } catch (error) {
    console.error(`Error updating printer status for printer ID ${printerData.printerId}:`, error);
    throw error;
  }
}

/**
 * Gets printer status from Moonraker API
 */
async function fetchMoonrakerStatus(printerIp: string, port: number = 7125, apiKey?: string): Promise<MoonrakerPrinterStatus> {
  try {
    console.log(`Attempting to connect to printer at ${printerIp}:${port}`);
    
    // Configure headers with API key if provided
    const config = apiKey ? {
      headers: {
        'X-Api-Key': apiKey
      }
    } : {};
    
    const response = await axios.get(
      `http://${printerIp}:${port}/printer/objects/query?print_stats&extruder&heater_bed`, 
      config
    );
    
    if (response.data && response.data.result && response.data.result.status) {
      return response.data.result.status;
    } else {
      throw new Error('Invalid response format from Moonraker API');
    }
  } catch (error) {
    console.error(`Error fetching status from printer at ${printerIp}:`, error);
    throw error;
  }
}

/**
 * Maps Moonraker printer state to your database status format
 */
function mapPrinterState(moonrakerState: string): string {
  // Log the incoming state for debugging
  console.log(`Mapping Moonraker state: "${moonrakerState}"`);
  
  switch (moonrakerState.toLowerCase()) {
    // Standard Operational States
    case 'printing':
    case 'resuming':
    case 'sdcard_printing':
      return 'busy';
      
    case 'paused':
      return 'paused';
      
    case 'ready':
    case 'standby':
    case 'printing_cancelled':
    case 'manual_step':
    case 'complete':  
      return 'idle';
      
    case 'startup':
    case 'firmware_restarting':
      return 'starting';
      
    // Error & Halt States
    case 'error':
    case 'shutdown':
    case 'halt':
    case 'config_error':
      return 'error';
      
    // Default case for any unhandled states
    default:
      console.log(`Unhandled printer state: "${moonrakerState}" - defaulting to offline`);
      return 'offline';
  }
}

/**
 * Update print job status if a job is active
 */
async function updatePrintJobStatus(printerId: number, filename: string, printStats: any): Promise<void> {
  try {
    // Define the expected job structure
    interface JobRow {
      job_id: number;
    }
    
    // Properly type the query result
    const [jobs] = await db.query<JobRow[]>(`
      SELECT job_id
      FROM print_queue
      WHERE printer_id = ? AND job_name = ? AND status = 'printing'
      ORDER BY started_at DESC
      LIMIT 1
    `, [printerId, filename]);
    
    if (jobs && jobs.length > 0) {
      const jobId = jobs[0].job_id;
      
      // Update the job progress
      await db.query(`
        UPDATE print_queue
        SET 
          progress = ?,
          filament_used = ?,
          last_updated = NOW()
        WHERE job_id = ?
      `, [
        printStats.progress * 100,
        printStats.filament_used,
        jobId
      ]);
      
      console.log(`Updated job status for job ID ${jobId}`);
    }
  } catch (error) {
    console.error('Error updating print job status:', error);
  }
}

/**
 * Main function to update all printers
 */
async function updateAllPrinters(): Promise<void> {
  try {
    interface PrinterRow {
      printer_id: number;
      printer_name: string;
      ip_address: string | null;
      api_key: string | null;  // Added api_key field
    }
    
    const [printers] = await db.query<PrinterRow[]>(`
      SELECT 
        printer_id,
        printer_name,
        ip_address,
        api_key
      FROM printer
      WHERE ip_address IS NOT NULL
    `);

    console.log(`Found ${printers.length} printers to update`);
    
    for (const printer of printers) {
      try {
        if (!printer.ip_address) {
          console.log(`Skipping printer ${printer.printer_name} - no IP address`);
          continue;
        }
      
        // Pass the API key if available
        const status = await fetchMoonrakerStatus(
          printer.ip_address,
          7125,  // default port
          printer.api_key || undefined
        );
      
        // Prepare data for database update
        const updateData: PrinterUpdateData = {
          printerId: printer.printer_id,
          status: mapPrinterState(status.print_stats.state),
          currentJob: status.print_stats.filename || null, // Explicitly use null
          progress: status.print_stats.progress !== undefined ? status.print_stats.progress * 100 : null,
          extruderTemp: status.extruder?.temperature || null,
          bedTemp: status.heater_bed?.temperature || null
        };
        
        // Update the database
        await updatePrinterStatus(updateData);
        
        // If printer is printing, update the print job status too
        if (status.print_stats.state === 'printing' && status.print_stats.filename) {
          await updatePrintJobStatus(printer.printer_id, status.print_stats.filename, status.print_stats);
        }
        
      } catch (error) {
        console.error(`Error updating printer ${printer.printer_name}:`, error);
      }
    }
    
    console.log('Printer status update completed');
  } catch (error) {
    console.error('Error updating printer statuses:', error);
    throw error;
  }
}

// Create an API handler for Nuxt
export default defineEventHandler(async (event) => {
  try {
    await updateAllPrinters();
    return { success: true, message: 'Printer statuses updated successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to update printer statuses', error: String(error) };
  }
});