import { sendError } from 'h3'
import { db } from '~/server/utils/db'

interface PartDetails {
  part_name: string;
  current_stock: number;
  minimum_stock: number;
  supplier: string | null;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Get part details for reorder
    const [partDetailsRows] = await db.query<PartDetails[]>(`
      SELECT pp.part_name, pi.current_stock, pi.minimum_stock, pi.supplier
      FROM printer_parts pp
      JOIN part_inventory pi ON pp.part_id = pi.part_id
      WHERE pp.part_id = ?
    `, [body.part_id])
    
    if (!partDetailsRows.length) {
      throw new Error('Part not found')
    }
    
    const part = partDetailsRows[0]
    
    // Create reorder request
    await db.execute(`
      INSERT INTO reorder_requests (part_id, requested_quantity, supplier, status, requested_by, requested_at)
      VALUES (?, ?, ?, 'pending', ?, NOW())
    `, [
      body.part_id,
      Math.max(10, part.minimum_stock * 2), // Default to minimum stock * 2
      part.supplier,
      1 // TODO: use actual user ID from session
    ])
    
    return { success: true }
  } catch (error) {
    console.error('Error creating reorder request:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create reorder request'
    }))
  }
})