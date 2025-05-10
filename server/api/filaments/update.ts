// server/api/filaments/update.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../utils/db'
import { ResultSetHeader } from 'mysql2'

interface UpdateFilamentRequest {
  stock_id: number;
  material?: string;
  color?: string;
  diameter?: number;
  weight?: number;
  remaining_weight?: number;
  nozzle_temp?: number;
  bed_temp?: number;
  hex_code?: string;
  manufacturer?: string;
  price?: number;
}

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
  }
  
  const lowerColor = color.toLowerCase()
  return colorMap[lowerColor] || '#777777'
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<UpdateFilamentRequest>(event)
    
    if (!body || !body.stock_id) {
      return {
        statusCode: 400,
        error: 'Missing stock_id in request body'
      }
    }
    
    // Get current filament data
    const [filaments] = await db.query(`
      SELECT * FROM filament WHERE stock_id = ?
    `, [body.stock_id])
    
    if (!Array.isArray(filaments) || filaments.length === 0) {
      return {
        statusCode: 404,
        error: 'Filament not found'
      }
    }
    
    const currentFilament = filaments[0]
    
    // Update hex_code if color is being changed
    if (body.color && body.color !== currentFilament.color) {
      body.hex_code = getColorHexCode(body.color)
    }
    
    // Build dynamic update query
    const updateFields = []
    const updateValues = []
    
    if (body.material !== undefined) {
      updateFields.push('material = ?')
      updateValues.push(body.material)
    }
    if (body.color !== undefined) {
      updateFields.push('color = ?')
      updateValues.push(body.color)
    }
    if (body.diameter !== undefined) {
      updateFields.push('diameter = ?')
      updateValues.push(body.diameter)
    }
    if (body.weight !== undefined) {
      updateFields.push('weight = ?')
      updateValues.push(body.weight)
    }
    if (body.remaining_weight !== undefined) {
      updateFields.push('remaining_weight = ?')
      updateValues.push(body.remaining_weight)
    }
    if (body.nozzle_temp !== undefined) {
      updateFields.push('nozzle_temp = ?')
      updateValues.push(body.nozzle_temp)
    }
    if (body.bed_temp !== undefined) {
      updateFields.push('bed_temp = ?')
      updateValues.push(body.bed_temp)
    }
    if (body.hex_code !== undefined) {
      updateFields.push('hex_code = ?')
      updateValues.push(body.hex_code)
    }
    if (body.manufacturer !== undefined) {
      updateFields.push('manufacturer = ?')
      updateValues.push(body.manufacturer)
    }
    if (body.price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(body.price)
    }
    
    // Always update last_updated timestamp
    updateFields.push('last_updated = NOW()')
    
    if (updateFields.length === 1) {
      return {
        statusCode: 400,
        error: 'No fields to update'
      }
    }
    
    // Execute update - Type the result properly
    updateValues.push(body.stock_id)
    const query = `UPDATE filament SET ${updateFields.join(', ')} WHERE stock_id = ?`
    
    const [result] = await db.query<ResultSetHeader>(query, updateValues)
    
    // Check if update was successful
    if (!result || result.affectedRows !== 1) {
      throw new Error('Failed to update filament')
    }
    
    // Get updated filament details
    const [updatedFilaments] = await db.query(`
      SELECT 
        stock_id,
        material,
        color,
        diameter,
        weight,
        remaining_weight,
        current_printer,
        hex_code,
        nozzle_temp,
        bed_temp,
        manufacturer,
        price,
        last_updated
      FROM 
        filament
      WHERE 
        stock_id = ?
    `, [body.stock_id])
    
    if (!Array.isArray(updatedFilaments) || updatedFilaments.length === 0) {
      throw new Error('Failed to retrieve updated filament details')
    }
    
    return {
      success: true,
      filament: updatedFilaments[0],
      message: 'Filament updated successfully'
    }
    
  } catch (error) {
    console.error('Error updating filament:', error)
    return {
      statusCode: 500,
      error: 'Failed to update filament'
    }
  }
})