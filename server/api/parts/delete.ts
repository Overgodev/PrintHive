import { sendError } from 'h3'
import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Start transaction
    await db.execute('START TRANSACTION')
    
    // Delete from printer_compatibility
    await db.execute('DELETE FROM printer_compatibility WHERE part_id = ?', [body.part_id])
    
    // Delete from part_inventory
    await db.execute('DELETE FROM part_inventory WHERE part_id = ?', [body.part_id])
    
    // Delete from printer_parts_usage
    await db.execute('DELETE FROM printer_part_usage WHERE part_id = ?', [body.part_id])
    
    // Delete from printer_parts
    await db.execute('DELETE FROM printer_parts WHERE part_id = ?', [body.part_id])
    
    // Commit transaction
    await db.execute('COMMIT')
    
    return { success: true }
  } catch (error) {
    // Rollback on error
    await db.execute('ROLLBACK')
    console.error('Error deleting part:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to delete part'
    }))
  }
})