// server/api/filaments/stock.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../utils/db'

/**
 * Interface for the request body
 */
interface UpdateStockRequest {
  filament_id: number;
  stock_percentage: number;
}

export default defineEventHandler(async (event) => {
  try {
    // Get request body using h3's readBody
    const body = await readBody<UpdateStockRequest>(event)
    
    if (!body || typeof body.filament_id !== 'number' || typeof body.stock_percentage !== 'number') {
      return {
        statusCode: 400,
        error: 'Missing or invalid required parameters: filament_id and stock_percentage'
      }
    }
    
    // Validate stock percentage
    if (body.stock_percentage < 0 || body.stock_percentage > 100) {
      return {
        statusCode: 400,
        error: 'stock_percentage must be a number between 0 and 100'
      }
    }
    
    // Get the current filament details to calculate new weight
    const [filaments] = await db.query(`
      SELECT 
        stock_id as id,
        weight
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
    
    // Calculate new remaining weight based on percentage
    const newRemainingWeight = (filament.weight * body.stock_percentage) / 100
    
    // Update the filament stock in the database
    await db.query(`
      UPDATE filament
      SET 
        remaining_weight = ?,
        last_updated = NOW()
      WHERE 
        stock_id = ?
    `, [newRemainingWeight, body.filament_id])
    
    // Get updated filament details
    const [updatedFilaments] = await db.query(`
      SELECT 
        stock_id as filament_id,
        CONCAT(material, ' ', color) as name,
        color,
        material as type,
        ROUND((remaining_weight / weight) * 100) as stock_percentage,
        hex_code,
        remaining_weight,
        weight as spool_weight,
        diameter,
        manufacturer,
        price,
        last_updated
      FROM 
        filament
      WHERE 
        stock_id = ?
    `, [body.filament_id])
    
    // Type guard
    if (!Array.isArray(updatedFilaments) || updatedFilaments.length === 0) {
      throw new Error('Failed to retrieve updated filament details')
    }
    
    // Return success response
    return {
      success: true,
      filament: updatedFilaments[0]
    }
    
  } catch (error) {
    console.error('Error updating filament stock:', error)
    return {
      statusCode: 500,
      error: 'Failed to update filament stock'
    }
  }
})