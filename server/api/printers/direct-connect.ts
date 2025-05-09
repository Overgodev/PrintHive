// server/api/printers/direct-connect.ts
import axios from 'axios';
import { db } from '../../utils/db';

/**
 * Interface for Moonraker printer status response
 */
interface MoonrakerPrinterStatus {
  state: string;
  print_stats: {
    state: string;
    filename: string;
    total_duration: number;
    print_duration: number;
    filament_used: number;
    progress: number;
    time_remaining?: number; // Using undefined instead of null
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

/**
 * Interface for printer data in our database
 */
interface Printer {
  printer_id: number;
  printer_name: string;
  ip_address: string | null;
  api_key: string | null;
  status?: string;
  print_stats?: any;
  extruder?: any;
  heater_bed?: any;
  filaments?: FilamentData[];
}

/**
 * Interface for filament data
 */
interface FilamentData {
  filament_id: number;
  color: string;
  type: string;
  spool_length: number;
  spool_used: number;
  level: number;
}

/**
 * Interface for query result with insertId
 */
interface QueryResult {
  insertId?: number;
  affectedRows?: number;
}

/**
 * Fetch printer status directly from Moonraker API
 */
async function fetchMoonrakerStatus(printerIp: string, port: number = 7125, apiKey?: string): Promise<MoonrakerPrinterStatus> {
  try {
    console.log(`Connecting to printer at ${printerIp}:${port}`);
    
    // Configure headers with API key if provided
    const config = apiKey ? {
      headers: {
        'X-Api-Key': apiKey
      }
    } : {};
    
    // Query Moonraker API for printer data
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
 * Fetch filament data for a printer using the current_spool field
 */
async function fetchFilaments(printerId: number): Promise<FilamentData[]> {
  try {
    // Directly query using the current_spool field in the printer table
    const [currentFilaments] = await db.query(`
      SELECT 
        f.stock_id AS filament_id,
        f.color,
        f.material AS type,
        f.weight AS spool_length,
        (f.weight - f.remaining_weight) AS spool_used,
        ROUND((f.remaining_weight / f.weight) * 100) AS level
      FROM printer p
      JOIN filament f ON p.current_spool = f.stock_id
      WHERE p.printer_id = ? AND p.current_spool IS NOT NULL
    `, [printerId]);
    
    // Check if we found any filament data
    if (!Array.isArray(currentFilaments) || currentFilaments.length === 0) {
      //console.log(`No current spool found for printer ID ${printerId}`);
      return [];
    }
    
    return currentFilaments;
  } catch (error) {
    //console.error(`Error fetching filaments for printer ID ${printerId}:`, error);
    // Just log the error instead of throwing it, and return an empty array
    // This prevents the error from breaking the API response
    return []; 
  }
}

/**
 * Format time remaining in seconds to human readable format
 * Returns undefined instead of null to match TypeScript requirements
 */
function calculateTimeRemaining(printStats: any): number | undefined {
  if (!printStats || printStats.progress === undefined || printStats.print_duration === undefined) {
    return undefined;
  }
  
  // If progress is 0, we can't calculate time remaining
  if (printStats.progress === 0) {
    return undefined;
  }
  
  // Calculate remaining time (total estimated time - time spent)
  const totalEstimatedTime = printStats.print_duration / printStats.progress;
  const timeRemaining = totalEstimatedTime - printStats.print_duration;
  
  return Math.round(timeRemaining);
}

/**
 * Map Moonraker printer state to application state format
 */
function mapPrinterState(moonrakerState: string): string {
  const state = moonrakerState.toLowerCase();

  if (['printing', 'resuming', 'sdcard_printing'].includes(state)) return 'printing';
  if (['paused', 'pausing'].includes(state)) return 'paused';
  if (['ready', 'standby', 'complete', 'idle'].includes(state)) return 'idle';
  if (['cancelled'].includes(state)) return 'cancelled'; // Optional: distinguish cancelled vs idle
  if (['error', 'shutdown', 'shutdown_by_mcu', 'emergency_shutdown', 'halt', 'config_error', 'firmware_restart', 'mcu_lost', 'klippy_disconnect', 'klippy_shutdown'].includes(state)) return 'error';
  if (['startup', 'initializing', 'connecting', 'starting'].includes(state)) return 'starting';
  if (['cooling'].includes(state)) return 'cooling';
  if (['maintenance', 'calibrating', 'homing', 'leveling', 'meshing'].includes(state)) return 'maintenance';

  return 'offline';
}


/**
 * Get printer data with direct Moonraker connection
 */
export default defineEventHandler(async (event) => {
  try {
    // Check if a specific printer ID was requested
    const url = event.node.req.url;
    const printerIdMatch = url?.match(/\/direct-connect\/(\d+)$/);
    const specificPrinterId = printerIdMatch ? parseInt(printerIdMatch[1]) : null;
    
    // Get printer configurations from database
    interface PrinterRow {
      printer_id: number;
      printer_name: string;
      ip_address: string | null;
      api_key: string | null;
    }
    
    let query = `
      SELECT 
        printer_id,
        printer_name,
        ip_address,
        api_key
      FROM printer
      WHERE ip_address IS NOT NULL
    `;
    
    // If specific printer requested, filter by ID
    const params = [];
    if (specificPrinterId) {
      query += ' AND printer_id = ?';
      params.push(specificPrinterId);
    }
    
    const [printers] = await db.query<PrinterRow[]>(query, params);

    if (!printers || printers.length === 0) {
      return { 
        statusCode: 404, 
        body: { error: 'No printers found with IP addresses' } 
      };
    }
    
    console.log(`Found ${printers.length} printers to connect to`);
    
    // Create array to store printer data
    const printerData: Printer[] = [];
    
    // Connect to each printer
    for (const printer of printers) {
      try {
        if (!printer.ip_address) {
          console.log(`Skipping printer ${printer.printer_name} - no IP address`);
          
          // Add offline printer to the list
          printerData.push({
            printer_id: printer.printer_id,
            printer_name: printer.printer_name,
            ip_address: null,
            api_key: null,
            print_stats: {
              state: 'offline',
              filename: '',
              progress: undefined // Use undefined instead of null
            },
            extruder: {
              temperature: 0
            },
            heater_bed: {
              temperature: 0
            },
            filaments: [] // Empty array instead of undefined
          });
          
          continue;
        }
        
        // Get printer status from Moonraker
        const status = await fetchMoonrakerStatus(
          printer.ip_address,
          7125,
          printer.api_key || undefined
        );
        
        // Calculate time remaining if not provided by Moonraker
        if (status.print_stats && status.print_stats.time_remaining === undefined) {
          status.print_stats.time_remaining = calculateTimeRemaining(status.print_stats);
        }
        
        // Get filament data for this printer - this now properly handles errors
        const filaments = await fetchFilaments(printer.printer_id);
        console.log(`Retrieved ${filaments.length} filaments for printer ${printer.printer_name}`);
        
        // Map Moonraker state to our application state format
        const originalState = status.print_stats.state;
        (status.print_stats as any).cancelled = originalState === 'cancelled';
        status.print_stats.state = mapPrinterState(originalState);

        
        // Add printer to the data array
        printerData.push({
          printer_id: printer.printer_id,
          printer_name: printer.printer_name,
          ip_address: printer.ip_address,
          api_key: printer.api_key,
          print_stats: status.print_stats,
          extruder: status.extruder,
          heater_bed: status.heater_bed,
          filaments: filaments // This is now properly handled
        });
        
      } catch (error) {
        console.error(`Error connecting to printer ${printer.printer_name}:`, error);
        
        // Add offline printer to the list
        printerData.push({
          printer_id: printer.printer_id,
          printer_name: printer.printer_name,
          ip_address: printer.ip_address,
          api_key: printer.api_key,
          print_stats: {
            state: 'offline',
            filename: '',
            progress: undefined // Use undefined instead of null
          },
          extruder: {
            temperature: 0
          },
          heater_bed: {
            temperature: 0
          },
          filaments: [] // Empty array instead of undefined
        });
      }
    }
    
    // Return single printer object if specific ID was requested
    if (specificPrinterId && printerData.length === 1) {
      return printerData[0];
    }
    
    return printerData;
    
  } catch (error) {
    console.error('Error in direct-connect API:', error);
    return { 
      statusCode: 500, 
      body: { error: 'Failed to connect to printers' } 
    };
  }
});