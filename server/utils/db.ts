import mysql from 'mysql2/promise';
import { Database } from './db.d';

// Create a function to initialize the database
const initDatabase = async (): Promise<Database> => {
  try {
    // Create the pool
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'printhivedb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test the connection
    try {
      await pool.query('SELECT 1');
      console.log('Database connected successfully');
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
    
    // Cast the pool to your Database interface
    return pool as unknown as Database;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Declare db with a default value that will be populated once the init function completes
let db: Database = {
  query: async () => { throw new Error('Database not initialized'); },
  execute: async () => { throw new Error('Database not initialized'); }
};

// Initialize the database immediately
initDatabase()
  .then(connection => {
    db = connection;
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });


// Function to get filament stock information
export const getFilamentStock = async () => {
  try {
    interface FilamentRow {
      id: number;
      name: string;
      color: string;
      type: string;
      stock_percentage: number;
      hex_code: string;
      remaining_weight: number;
      weight: number;
      diameter: number;
    }
    
    const [rows] = await db.query<FilamentRow[]>(`
      SELECT 
        f.stock_id as id,
        f.material as name,
        f.color,
        f.material as type,
        ROUND((f.remaining_weight / f.weight) * 100) as stock_percentage,
        f.hex_code,
        f.remaining_weight,
        f.weight,
        f.diameter
      FROM 
        filament f
      ORDER BY 
        f.material ASC, f.color ASC
    `);
    
    // Rest of the function remains the same
    return rows.map(row => ({
      id: row.id,
      name: `${row.name} ${row.color}`,
      color: row.color,
      type: row.type,
      stock: row.stock_percentage,
      inStock: row.stock_percentage > 30
    }));
  } catch (error) {
    console.error('Error fetching filament stock:', error);
    throw error;
  }
};

// Function to get printer status with current filament levels
export const getPrinterStatus = async () => {
  try {
    // Define an interface for the printer data structure
    interface PrinterRow {
      id: number;
      name: string;
      status: string;
      ip_address: string;
      current_spool: number | null;
      last_used: Date | null;
    }
    
    // First get all printers with proper type annotation
    const [printers] = await db.query<PrinterRow[]>(`
      SELECT 
        p.printer_id as id,
        p.printer_name as name,
        p.status,
        p.ip_address,
        p.current_spool,
        p.last_used
      FROM 
        printer p
      ORDER BY 
        p.printer_name ASC
    `);
    
    // For each printer, get its current filament information
    const printersWithFilaments = await Promise.all(printers.map(async (printer) => {
      // Define interface for filament data
      interface FilamentRow {
        color: string;
        hex_code: string;
        level: number;
      }
      
      // Get the current filament loaded in the printer
      if (printer.current_spool) {
        const [filaments] = await db.query<FilamentRow[]>(`
          SELECT 
            f.color,
            f.hex_code,
            ROUND((f.remaining_weight / f.weight) * 100) as level
          FROM 
            filament f
          WHERE 
            f.stock_id = ?
        `, [printer.current_spool]);
        
        return {
          ...printer,
          filaments: filaments.length > 0 ? filaments : [{ color: 'none', level: 0 }]
        };
      } else {
        return {
          ...printer,
          filaments: [{ color: 'none', level: 0 }]
        };
      }
    }));
    
    return printersWithFilaments;
  } catch (error) {
    console.error('Error fetching printer status:', error);
    throw error;
  }
};

// Function to get maintenance information based on printer parts
export const getMaintenanceTasks = async () => {
  try {
    // Define interface for maintenance task rows
    interface MaintenanceTaskRow {
      printer_id: number;
      printer_name: string;
      part_id: number;
      part_name: string;
      task_category: string;
      wear_level: number;
      max_wear_limit: number;
      status: 'pending' | 'ok';
      estimated_date: Date;
    }
    
    const [rows] = await db.query<MaintenanceTaskRow[]>(`
      SELECT 
        pp.printer_id,
        p.printer_name,
        pt.part_id,
        pt.part_name,
        pt.category as task_category,
        pp.wear_level,
        pp.max_wear_limit,
        CASE 
          WHEN pp.wear_level > pp.warning_threshold THEN 'pending'
          ELSE 'ok'
        END as status,
        DATE_ADD(NOW(), INTERVAL (pp.max_wear_limit - pp.wear_level) DAY) as estimated_date
      FROM 
        printer_part_usage pp
      JOIN 
        printer_parts pt ON pp.part_id = pt.part_id
      JOIN 
        printer p ON pp.printer_id = p.printer_id
      WHERE 
        pp.wear_level > pp.warning_threshold
      ORDER BY 
        pp.wear_level / pp.max_wear_limit DESC
    `);
    
    // Format the result to match your frontend expectations
    return rows.map(row => ({
      id: row.part_id,
      description: `${row.part_name} Replacement`,
      printer: row.printer_name,
      date: row.estimated_date,
      status: row.status
    }));
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    throw error;
  }
};

// Function to get recent print jobs
export const getRecentPrintJobs = async (days = 7) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pq.job_id,
        pq.job_name,
        p.printer_name,
        f.material,
        f.color,
        pq.created_at,
        pq.started_at,
        pq.completed_at,
        pq.status,
        TIMESTAMPDIFF(MINUTE, pq.started_at, IFNULL(pq.completed_at, NOW())) as duration_minutes
      FROM 
        print_queue pq
      JOIN 
        printer p ON pq.printer_id = p.printer_id
      JOIN 
        filament f ON pq.filament_id = f.stock_id
      WHERE 
        pq.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY 
        pq.created_at DESC
    `, [days]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching recent print jobs:', error);
    throw error;
  }
};

// Function to get filament usage stats
export const getFilamentUsageStats = async (months = 3) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(fuh.start_time, '%Y-%m') as month,
        f.material,
        f.color,
        SUM(fuh.used_weight) as total_used
      FROM 
        filament_usage_history fuh
      JOIN 
        filament f ON fuh.stock_id = f.stock_id
      WHERE 
        fuh.start_time >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY 
        DATE_FORMAT(fuh.start_time, '%Y-%m'), f.material, f.color
      ORDER BY 
        month ASC, total_used DESC
    `, [months]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching filament usage stats:', error);
    throw error;
  }
};

interface FilamentRow {
  id: number;
  name: string;
  color: string;
  type: string;
  stock_percentage: number;
  hex_code: string | null;
  remaining_weight: number;
  weight: number;
  diameter: number;
}

interface FilamentInventoryItem {
  filament_id: number;
  name: string;
  color: string;
  type: string;
  stock_percentage: number;
  hex_code?: string;
  inStock: boolean;
}

export const getDetailedFilamentInventory = async (): Promise<FilamentInventoryItem[]> => {
  try {
    const [rows] = await db.query<FilamentRow[]>(`
      SELECT 
        f.stock_id as id,
        CONCAT(f.material, ' ', f.color) as name,
        f.color,
        f.material as type,
        ROUND((f.remaining_weight / f.weight) * 100) as stock_percentage,
        f.hex_code,
        f.remaining_weight,
        f.weight,
        f.diameter
      FROM 
        filament f
      ORDER BY 
        stock_percentage ASC,
        f.material ASC, 
        f.color ASC
    `);
    
    // Make sure rows is an array (TypeScript safety)
    if (!Array.isArray(rows)) {
      console.error('Expected array of rows but got:', typeof rows);
      return [];
    }
    
    // Map rows to the expected format
    return rows.map(row => ({
      filament_id: row.id,
      name: row.name,
      color: row.color,
      type: row.type,
      stock_percentage: row.stock_percentage,
      hex_code: row.hex_code || getColorHexCode(row.color),
      inStock: row.stock_percentage > 30
    }));
  } catch (error) {
    console.error('Error fetching filament stock:', error);
    throw error;
  }
};

// Helper function to get color hex code
function getColorHexCode(color: string): string {
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'gray': '#808080',
    'grey': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'transparent': 'rgba(255, 255, 255, 0.3)',
    'natural': '#F5F5DC',
  };
  
  const lowerColor = color.toLowerCase();
  return colorMap[lowerColor] || '#777777';
}

export { db };