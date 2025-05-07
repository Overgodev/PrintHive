// server/api/filaments/reorder.ts
import { defineEventHandler, readBody } from 'h3'; // Import readBody from h3
import { db } from '../../utils/db';

/**
 * Interface for the request body
 */
interface ReorderFilamentRequest {
  filament_id: number;
}

/**
 * Interface for filament data
 */
interface Filament {
  filament_id: number;
  name: string;
  color: string;
  type: string;
}

/**
 * Interface for query result with insertId
 */
interface QueryResult {
  insertId?: number;
  affectedRows?: number;
}

/**
 * Create a reorder request for a filament
 */
export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const body = await readBody<ReorderFilamentRequest>(event);
    
    if (!body || !body.filament_id) {
      return { 
        statusCode: 400, 
        body: { error: 'Missing filament_id in request body' } 
      };
    }
    
    // First, get filament details
    const [filaments] = await db.query<Filament[]>(`
      SELECT 
        filament_id,
        CONCAT(color, ' ', type) AS name,
        color,
        type
      FROM filament
      WHERE filament_id = ?
    `, [body.filament_id]);
    
    if (!filaments || filaments.length === 0) {
      return { 
        statusCode: 404, 
        body: { error: 'Filament not found' } 
      };
    }
    
    const filament = filaments[0];
    
    // Create a reorder record in the database
    const [result] = await db.query<QueryResult>(`
      INSERT INTO filament_order (
        filament_id,
        requested_at,
        requested_by,
        status,
        quantity,
        notes
      ) VALUES (?, NOW(), ?, 'pending', 1, ?)
    `, [
      filament.filament_id,
      event.context.user?.user_id || null,
      `Automatic reorder via dashboard for ${filament.name}`
    ]);
    
    if (!result || result.insertId === undefined) {
      throw new Error('Failed to create reorder record');
    }
    
    // Return success response
    return { 
      statusCode: 200, 
      body: { 
        message: `Reorder request created for ${filament.name}`,
        order_id: result.insertId
      } 
    };
    
  } catch (error) {
    console.error('Error reordering filament:', error);
    return { 
      statusCode: 500, 
      body: { error: 'Failed to reorder filament' } 
    };
  }
});