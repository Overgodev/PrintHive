// server/api/maintenance/tasks.ts
import { db } from '../../utils/db';

/**
 * Interface for maintenance task data
 */
interface MaintenanceTask {
  task_id: number;
  printer_id: number;
  printer_name: string;
  description: string;
  due_date: string;
  status: string;
}

/**
 * Get maintenance tasks from database
 */
export default defineEventHandler(async (event) => {
  try {
    // Query database for upcoming and recent maintenance tasks
    const [tasks] = await db.query<MaintenanceTask[]>(`
      SELECT 
        m.task_id,
        m.printer_id,
        p.printer_name,
        m.description,
        m.due_date,
        m.status
      FROM maintenance_task m
      JOIN printer p ON m.printer_id = p.printer_id
      WHERE 
        m.due_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND m.due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY 
        CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END,
        m.due_date ASC
      LIMIT 10
    `);
    
    if (!tasks || tasks.length === 0) {
      return { 
        statusCode: 404, 
        body: { error: 'No maintenance tasks found' } 
      };
    }
    
    return tasks;
    
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    return { 
      statusCode: 500, 
      body: { error: 'Failed to fetch maintenance tasks' } 
    };
  }
});