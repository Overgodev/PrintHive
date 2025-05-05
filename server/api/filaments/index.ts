import { Request, Response } from 'express';
import { getFilamentStock } from '../../utils/db';

export default async (req: Request, res: Response) => {
  try {
    const filaments = await getFilamentStock();
    res.status(200).json(filaments);
  } catch (error) {
    console.error('API error fetching filament stock:', error);
    res.status(500).json({ error: 'Failed to fetch filament stock' });
  }
};