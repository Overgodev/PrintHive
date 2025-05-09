// server/api/filaments/reorder.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../utils/db'

/**
 * Interface for the request body
 */
interface ReorderFilamentRequest {
  filament_id: number;
}

/**
 * Interface for query result with insertId
 */
interface QueryResult {
  insertId?: number;
  affectedRows?: number;
}

export default defineEventHandler(async (event) => {
  try {
    // Get request body using h3's readBody
    const body = await readBody<ReorderFilamentRequest>(event)
    
    if (!body || !body.filament_id) {
      return { 
        statusCode: 400, 
        error: 'Missing filament_id in request body'
      }
    }
    
    // First, get filament details
    const [filaments] = await db.query(`
      SELECT 
        stock_id as id,
        CONCAT(material, ' ', color) as name,
        color,
        material as type
      FROM 
        filament
      WHERE 
        stock_id = ?
    `, [body.filament_id])
    
    // Type guard to check if filaments is an array
    if (!Array.isArray(filaments) || filaments.length === 0) {
      return { 
        statusCode: 404, 
        error: 'Filament not found'
      }
    }
    
    const filament = filaments[0]
    
    // Get user ID from event context if available
    // In Nuxt/H3, we don't use req.session, but we can get user info from event.context
    // If you have auth implemented, you might have access to something like:
    // const userId = event.context.user?.id || null
    const userId = null
    
    // Create a reorder record
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
      filament.id,
      userId,
      `Automatic reorder via dashboard for ${filament.name}`
    ])
    
    // Type guard for result
    if (!result || typeof result !== 'object' || !('insertId' in result)) {
      throw new Error('Failed to create reorder record')
    }
    
    // For demo purposes, reset the filament to full stock
    await db.query(`
      UPDATE filament
      SET 
        remaining_weight = weight,
        last_updated = NOW()
      WHERE 
        stock_id = ?
    `, [body.filament_id])
    
    // Return success response
    return { 
      success: true,
      filament_id: body.filament_id,
      order_id: result.insertId,
      message: `Reorder request created for ${filament.name}`
    }
    
  } catch (error) {
    console.error('Error reordering filament:', error)
    return { 
      statusCode: 500, 
      error: 'Failed to reorder filament'
    }
  }
})