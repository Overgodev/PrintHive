import { Request, Response } from 'express';
import { getRecentPrintJobs } from '../../utils/db';

export default async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const jobs = await getRecentPrintJobs(days);
    res.status(200).json(jobs);
  } catch (error) {
    console.error('API error fetching print jobs:', error);
    res.status(500).json({ error: 'Failed to fetch print jobs' });
  }
};