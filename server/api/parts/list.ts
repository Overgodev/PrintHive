import { sendError } from 'h3'
import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get all printers for compatibility selection
    const [printers] = await db.query(`
      SELECT printer_id as id, printer_name as name
      FROM printer
      ORDER BY printer_name
    `)
    
    return printers
  } catch (error) {
    console.error('Error fetching printer list:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch printer list'
    }))
  }
})