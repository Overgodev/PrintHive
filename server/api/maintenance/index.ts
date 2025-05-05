import { Request, Response } from 'express';
import { getMaintenanceTasks } from '../../utils/db';

export default async (req: Request, res: Response) => {
  try {
    const tasks = await getMaintenanceTasks();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('API error fetching maintenance tasks:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance tasks' });
  }
};