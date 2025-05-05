import mysql from 'mysql2/promise';
import { Database } from './db.d';

// Create a function to initialize the database
const initDatabase = async (): Promise<Database> => {
  try {
    // Create the pool with proper typing
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
    
    // Return the pool as our database interface
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

export { db };