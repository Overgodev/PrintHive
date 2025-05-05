import { Request, Response } from 'express';
import { getFilamentUsageStats } from '../../utils/db';

export default async (req: Request, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 3;
    const stats = await getFilamentUsageStats(months);
    res.status(200).json(stats);
  } catch (error) {
    console.error('API error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
};