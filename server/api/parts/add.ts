import { sendError } from 'h3'
import { db } from '~/server/utils/db'
import type { ResultSetHeader } from 'mysql2'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Start transaction
    await db.execute('START TRANSACTION')
    
    // Calculate total value
    const totalValue = Number(body.quantity || 0) * Number(body.unit_price || 0)
    
    // Insert into printer_parts
    const [partResult] = await db.execute<ResultSetHeader>(`
      INSERT INTO printer_parts (
        part_name, category, brand, sku, unit, supplier, notes, 
        image_url, stock_quantity, unit_price, total_value, 
        warning_threshold, wear_level, max_wear_limit, hex_code, compatible_with
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      body.name,
      body.category,
      body.brand || null,
      body.sku || null,
      body.unit || 'pcs',
      body.supplier || null,
      body.notes || null,
      body.image_url || null,
      body.quantity || 0,
      body.unit_price || 0,
      totalValue,
      body.minimum_stock || 5,
      0, // Initial wear level
      body.max_wear_limit || 1000,
      body.hex_code || null,
      body.compatible_with || null
    ])
    
    const partId = partResult.insertId
    
    // Insert printer compatibility (printer_part_usage)
    if (body.compatible_printers && body.compatible_printers.length > 0) {
      for (const printerId of body.compatible_printers) {
        await db.execute(`
          INSERT INTO printer_part_usage (printer_id, part_id, quantity_used, wear_usage)
          VALUES (?, ?, 0, 0)
        `, [printerId, partId])
      }
    }
    
    // Commit transaction
    await db.execute('COMMIT')
    
    return { success: true, part_id: partId }
  } catch (error) {
    // Rollback on error
    await db.execute('ROLLBACK')
    console.error('Error adding part:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to add part'
    }))
  }
})