import { sendError } from 'h3'
import { db } from '~/server/utils/db'

interface ActivityRow {
  type: string;
  description: string;
  details: string;
  timestamp: Date;
}

export default defineEventHandler(async (event) => {
  try {
    // Get recent part activity
    const [activities] = await db.query<ActivityRow[]>(`
      SELECT 'stock_adjustment' as type, 
             CONCAT('Stock adjusted: ', pp.part_name) as description,
             CONCAT(psh.adjustment_type, ' ', ABS(psh.quantity), ' - ', psh.reason) as details,
             psh.created_at as timestamp
      FROM part_stock_history psh
      JOIN printer_parts pp ON psh.part_id = pp.part_id
      WHERE psh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 'low_stock' as type,
             CONCAT('Low stock alert: ', pp.part_name) as description,
             CONCAT('Current: ', pi.current_stock, ', Minimum: ', pi.minimum_stock) as details,
             NOW() as timestamp
      FROM part_inventory pi
      JOIN printer_parts pp ON pi.part_id = pp.part_id
      WHERE pi.current_stock <= pi.minimum_stock
      
      UNION ALL
      
      SELECT 'reorder' as type,
             CONCAT('Reorder placed: ', pp.part_name) as description,
             CONCAT('Ordered ', rr.requested_quantity, ' from ', COALESCE(rr.supplier, 'Unknown Supplier')) as details,
             rr.requested_at as timestamp
      FROM reorder_requests rr
      JOIN printer_parts pp ON rr.part_id = pp.part_id
      WHERE rr.requested_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      ORDER BY timestamp DESC
      LIMIT 10
    `)
    
    // Format activities
    const formattedActivities = activities.map((activity: ActivityRow, index: number) => ({
      id: index + 1,
      type: activity.type,
      description: activity.description,
      details: activity.details,
      timestamp: activity.timestamp
    }))
    
    return formattedActivities
  } catch (error) {
    console.error('Error fetching part activity:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch part activity'
    }))
  }
})


