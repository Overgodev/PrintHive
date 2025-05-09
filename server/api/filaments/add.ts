// server/api/filaments/add.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../utils/db'

/**
 * Interface for the request body
 */
interface AddFilamentRequest {
  name: string;
  type: string;
  color: string;
  diameter: number;
  spool_weight: number;
  stock_percentage: number;
  manufacturer?: string;
  price?: number;
}

/**
 * Interface for query result with insertId
 */
interface QueryResult {
  insertId?: number;
  affectedRows?: number;
}

/**
 * Helper function to get color hex code from color name
 */
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
    // Get request body using h3's readBody
    const body = await readBody<AddFilamentRequest>(event)
    
    if (
      !body || 
      !body.name || 
      !body.color || 
      typeof body.diameter !== 'number' || 
      typeof body.spool_weight !== 'number' || 
      typeof body.stock_percentage !== 'number'
    ) {
      return {
        statusCode: 400,
        error: 'Missing or invalid required parameters'
      }
    }
    
    // Get the material type
    const type = body.type || body.name.split(' ')[0] || 'PLA'
    
    // Calculate remaining weight based on percentage
    const remainingWeight = (body.spool_weight * body.stock_percentage) / 100
    
    // Get hex code for the color
    const hexCode = getColorHexCode(body.color)
    
    // Insert the new filament
    const [result] = await db.query<QueryResult>(`
      INSERT INTO filament (
        material,
        color,
        diameter,
        weight,
        remaining_weight,
        manufacturer,
        price,
        hex_code,
        created_at,
        last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      type,
      body.color,
      body.diameter,
      body.spool_weight,
      remainingWeight,
      body.manufacturer || null,
      body.price || null,
      hexCode
    ])
    
    // Type guard for result
    if (!result || typeof result !== 'object' || !('insertId' in result)) {
      throw new Error('Failed to add new filament')
    }
    
    // Get the newly added filament
    const [filaments] = await db.query(`
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
    `, [result.insertId])
    
    // Type guard
    if (!Array.isArray(filaments) || filaments.length === 0) {
      throw new Error('Failed to retrieve added filament details')
    }
    
    // Return success response
    return {
      success: true,
      filament: filaments[0],
      message: 'Filament added successfully'
    }
    
  } catch (error) {
    console.error('Error adding new filament:', error)
    return {
      statusCode: 500,
      error: 'Failed to add new filament'
    }
  }
})