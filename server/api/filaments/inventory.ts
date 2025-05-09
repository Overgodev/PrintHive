import { getDetailedFilamentInventory } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const inventory = await getDetailedFilamentInventory();
    return inventory;
  } catch (err: any) {
    console.error('Failed to load filament inventory:', err);
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to load filament inventory',
      data: err.message || err
    }));
  }
});
