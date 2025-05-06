import { updateAllPrinters } from '../api/printers/update-status';

let updateInterval: NodeJS.Timeout | null = null;

export default defineEventHandler((event) => {
  // Only set up the interval once when the server starts
  if (!updateInterval) {
    // Run the update every 30 seconds (adjust as needed)
    updateInterval = setInterval(() => {
      updateAllPrinters()
        .catch(err => console.error('Error in scheduled printer update:', err));
    }, 30000);
    
    console.log('Printer status update scheduler initialized');
  }
});