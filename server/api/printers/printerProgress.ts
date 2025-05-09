// printerProgress.ts
import { Request, Response } from 'express';
import axios from 'axios';
import { db } from '../../utils/db'; // Import your existing database module

/**
 * API endpoint that retrieves printer progress directly from Moonraker APIs
 * Gets printer information from database and queries each printer's Moonraker instance
 */
export async function getPrinterProgress(req: Request, res: Response) {
  try {
    // Fetch printer information from your MySQL database
    const [printers] = await db.query(`
      SELECT 
        printer_id,
        printer_name,
        ip_address
      FROM 
        printer
      WHERE 
        status != 'disabled'
    `);
    
    if (!Array.isArray(printers) || printers.length === 0) {
      return res.status(404).json({ error: 'No printers found' });
    }
    
    // Create a list of promises to query each printer's Moonraker API
    const progressPromises = printers.map(async (printer: any) => {
      try {
        // Build the Moonraker API URL using the printer's IP address
        // Moonraker typically runs on port 7125 or 80, adjust as needed
        const moonrakerUrl = `http://${printer.ip_address}/printer/objects/query?print_stats&extruder&heater_bed`;
        
        // Set a timeout to avoid waiting too long for unresponsive printers
        const response = await axios.get(moonrakerUrl, { timeout: 3000 });
        
        // Extract relevant information from Moonraker's response
        const printerData = response.data?.result?.status || {};
        
        return {
          printer_id: printer.printer_id,
          printer_name: printer.printer_name,
          print_stats: {
            state: printerData.print_stats?.state || 'unknown',
            filename: printerData.print_stats?.filename || '',
            progress: printerData.print_stats?.progress || 0
          },
          extruder: {
            temperature: printerData.extruder?.temperature || 0,
            target: printerData.extruder?.target || 0
          },
          heater_bed: {
            temperature: printerData.heater_bed?.temperature || 0,
            target: printerData.heater_bed?.target || 0
          },
          // Add filament information from your database
          filaments: [] // You'll populate this in the next step
        };
      } catch (error) {
        console.error(`Error fetching data from printer ${printer.printer_name} (${printer.ip_address}):`, error);
        
        // Return offline status for printers that couldn't be reached
        return {
          printer_id: printer.printer_id,
          printer_name: printer.printer_name,
          print_stats: {
            state: 'offline',
            filename: '',
            progress: 0
          },
          extruder: {
            temperature: 0,
            target: 0
          },
          heater_bed: {
            temperature: 0,
            target: 0
          },
          filaments: []
        };
      }
    });
    
    // Wait for all printer API queries to complete
    const printerResults = await Promise.allSettled(progressPromises);
    
    // Process the results, handling both successful and failed queries
    const printerProgress = printerResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    // Now fetch filament information for each printer
    const printersWithFilament = await Promise.all(
      printerProgress.map(async (printer) => {
        try {
          // Query database for current filament information
          const [filaments] = await db.query(`
            SELECT 
              f.color,
              f.material as type,
              f.hex_code,
              ROUND((f.remaining_weight / f.weight) * 100) as level
            FROM 
              filament f
            JOIN 
              printer p ON p.current_spool = f.stock_id
            WHERE 
              p.printer_id = ?
          `, [printer.printer_id]);
          
          if (Array.isArray(filaments) && filaments.length > 0) {
            return {
              ...printer,
              filaments: filaments.map((f: any) => ({
                type: f.type,
                color: f.color,
                level: f.level,
                hex_code: f.hex_code
              }))
            };
          }
          
          return printer;
        } catch (error) {
          console.error(`Error fetching filament data for printer ${printer.printer_name}:`, error);
          return printer;
        }
      })
    );
    
    // Return the consolidated printer status information
    res.json(printersWithFilament);
    
  } catch (error) {
    console.error('Failed to fetch printer progress:', error);
    res.status(500).json({ error: 'Failed to fetch printer progress' });
  }
}

// For testing purposes - mock data when Moonraker is unavailable
export function getMockPrinterProgress(req: Request, res: Response) {
  // Generate random printer states for testing
  const states = ['printing', 'idle', 'paused', 'error', 'offline'];
  const filamentTypes = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon'];
  const filamentColors = ['Red', 'Blue', 'Green', 'Black', 'White'];
  
  const mockPrinters = [
    {
      printer_id: 1,
      printer_name: 'Ender 3 Pro',
      print_stats: {
        state: states[Math.floor(Math.random() * 3)], // More likely to be printing/idle/paused
        filename: 'benchy.gcode',
        progress: Math.random()
      },
      extruder: {
        temperature: Math.random() * 200 + 20,
        target: 210
      },
      heater_bed: {
        temperature: Math.random() * 60 + 20,
        target: 60
      },
      filaments: [
        {
          type: filamentTypes[Math.floor(Math.random() * filamentTypes.length)],
          color: filamentColors[Math.floor(Math.random() * filamentColors.length)],
          level: Math.floor(Math.random() * 100),
          hex_code: '#FF0000'
        }
      ]
    },
    {
      printer_id: 2,
      printer_name: 'Voron 0.1',
      print_stats: {
        state: 'printing',
        filename: 'calibration_cube.gcode',
        progress: Math.random()
      },
      extruder: {
        temperature: 240 + (Math.random() * 10),
        target: 245
      },
      heater_bed: {
        temperature: 95 + (Math.random() * 5),
        target: 100
      },
      filaments: [
        {
          type: 'ABS',
          color: 'Black',
          level: 72,
          hex_code: '#000000'
        }
      ]
    },
    {
      printer_id: 3,
      printer_name: 'Prusa i3 MK3S',
      print_stats: {
        state: 'idle',
        filename: '',
        progress: 0
      },
      extruder: {
        temperature: 25 + (Math.random() * 5),
        target: 0
      },
      heater_bed: {
        temperature: 24 + (Math.random() * 3),
        target: 0
      },
      filaments: [
        {
          type: 'PETG',
          color: 'Blue',
          level: 45,
          hex_code: '#0000FF'
        }
      ]
    }
  ];
  
  res.json(mockPrinters);
}

// Add these routes to your Express app:
// app.get('/api/printers/progress', getPrinterProgress);
// app.get('/api/printers/progress-mock', getMockPrinterProgress);