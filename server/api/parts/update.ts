import { sendError } from 'h3'
import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Start transaction
    await db.execute('START TRANSACTION')
    
    // Calculate total value
    const totalValue = Number(body.quantity || 0) * Number(body.unit_price || 0)
    
    // Update printer_parts
    await db.execute(`
      UPDATE printer_parts
      SET 
        part_name = ?, 
        category = ?, 
        brand = ?, 
        sku = ?, 
        unit = ?, 
        supplier = ?, 
        notes = ?,
        image_url = ?,
        stock_quantity = ?, 
        unit_price = ?, 
        total_value = ?,
        warning_threshold = ?, 
        hex_code = ?,
        compatible_with = ?,
        last_updated = NOW()
      WHERE part_id = ?
    `, [
      body.name,
      body.category,
      body.brand || null,
      body.sku || null,
      body.unit || 'pcs',
      body.supplier || null,
      body.notes || null,
      body.image_url || null,
      body.quantity,
      body.unit_price,
      totalValue,
      body.minimum_stock,
      body.hex_code || null,
      body.compatible_with || null,
      body.part_id
    ])
    
    // Update printer compatibility
    // First, delete existing compatibility
    await db.execute('DELETE FROM printer_part_usage WHERE part_id = ?', [body.part_id])
    
    // Then insert new compatibility
    if (body.compatible_printers && body.compatible_printers.length > 0) {
      for (const printerId of body.compatible_printers) {
        await db.execute(`
          INSERT INTO printer_part_usage (printer_id, part_id, quantity_used, wear_usage)
          VALUES (?, ?, 0, 0)
        `, [printerId, body.part_id])
      }
    }
    
    // Commit transaction
    await db.execute('COMMIT')
    
    return { success: true }
  } catch (error) {
    // Rollback on error
    await db.execute('ROLLBACK')
    console.error('Error updating part:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to update part'
    }))
  }
})