import { sendError } from 'h3'
import { db } from '~/server/utils/db'

interface StockRow {
  stock_quantity: number;
  unit_price: number;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Start transaction
    await db.execute('START TRANSACTION')
    
    // Get current stock and unit price
    const [currentStockRows] = await db.query<StockRow[]>(
      'SELECT stock_quantity, unit_price FROM printer_parts WHERE part_id = ?',
      [body.part_id]
    )
    
    if (!currentStockRows.length) {
      throw new Error('Part not found')
    }
    
    const currentStock = currentStockRows[0].stock_quantity
    const unitPrice = currentStockRows[0].unit_price
    
    // Calculate new stock based on adjustment type
    let newStock: number
    switch (body.adjustment_type) {
      case 'add':
        newStock = currentStock + Number(body.quantity)
        break
      case 'remove':
        newStock = Math.max(0, currentStock - Number(body.quantity))
        break
      case 'set':
        newStock = Number(body.quantity)
        break
      default:
        throw new Error('Invalid adjustment type')
    }
    
    // Calculate new total value
    const newTotalValue = newStock * unitPrice
    
    // Update stock
    await db.execute(`
      UPDATE printer_parts
      SET stock_quantity = ?, total_value = ?, last_updated = NOW()
      WHERE part_id = ?
    `, [newStock, newTotalValue, body.part_id])
    
    // Record in history if you have a history table
    // You can create a part_stock_history table for this
    
    // Commit transaction
    await db.execute('COMMIT')
    
    return { success: true, new_stock: newStock, new_total_value: newTotalValue }
  } catch (error) {
    // Rollback on error
    await db.execute('ROLLBACK')
    console.error('Error adjusting stock:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to adjust stock'
    }))
  }
})