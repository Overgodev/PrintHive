// server/api/filaments/delete.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../utils/db'
import { ResultSetHeader } from 'mysql2'

interface DeleteFilamentRequest {
  stock_id: number;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<DeleteFilamentRequest>(event)
    
    if (!body || !body.stock_id) {
      return { 
        statusCode: 400, 
        error: 'Missing stock_id in request body'
      }
    }
    
    // First, check if filament exists
    const [filaments] = await db.query(`
      SELECT 
        stock_id,
        material,
        color
      FROM 
        filament
      WHERE 
        stock_id = ?
    `, [body.stock_id])
    
    if (!Array.isArray(filaments) || filaments.length === 0) {
      return { 
        statusCode: 404, 
        error: 'Filament not found'
      }
    }
    
    const filament = filaments[0]
    
    // Delete the filament - Type the result properly
    const [result] = await db.query<ResultSetHeader>(`
      DELETE FROM filament
      WHERE stock_id = ?
    `, [body.stock_id])
    
    // Now TypeScript knows that result has affectedRows property
    if (!result || result.affectedRows !== 1) {
      throw new Error('Failed to delete filament')
    }
    
    return { 
      success: true,
      stock_id: body.stock_id,
      message: `Successfully deleted ${filament.material} ${filament.color}`
    }
    
  } catch (error) {
    console.error('Error deleting filament:', error)
    return { 
      statusCode: 500, 
      error: 'Failed to delete filament'
    }
  }
})