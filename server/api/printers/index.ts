import { Request, Response } from 'express';
import { getPrinterStatus } from '../../utils/db';

export default async (req: Request, res: Response) => {
  try {
    const printers = await getPrinterStatus();
    res.status(200).json(printers);
  } catch (error) {
    console.error('API error fetching printer status:', error);
    res.status(500).json({ error: 'Failed to fetch printer status' });
  }
};