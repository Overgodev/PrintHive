// In server/middleware/printer-status-updater.ts

import axios from 'axios';

let updateInterval: NodeJS.Timeout | null = null;

async function updatePrinters(): Promise<void> {
  try {
    // Replace the relative URL with an absolute URL
    // You need to specify the full URL including your server's host and port
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Or whatever your server URL is
    await axios.get(`${baseUrl}/api/printers/update-status`);
    console.log('Printers updated successfully');
  } catch (error) {
    console.error('Error updating printers:', error);
  }
}

export default defineEventHandler((event) => {
  if (!updateInterval) {
    updateInterval = setInterval(() => {
      updatePrinters()
        .catch(err => console.error('Error in scheduled printer update:', err));
    }, 30000);
    
    console.log('Printer status update scheduler initialized');
  }
  
  return;
});