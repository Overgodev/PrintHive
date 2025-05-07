// In server/middleware/printer-status-updater.ts

// Import axios for making HTTP requests instead of trying to import the function
import axios from 'axios';

// Declare updateInterval variable
let updateInterval: NodeJS.Timeout | null = null;

// Create a function to update printers by calling the API endpoint
async function updatePrinters(): Promise<void> {
  try {
    // This calls your API endpoint
    await axios.get('/api/printers/update-status');
    console.log('Printers updated successfully');
  } catch (error) {
    console.error('Error updating printers:', error);
  }
}

// Make sure you're exporting the default function correctly
export default defineEventHandler((event) => {
  // Only set up the interval once when the server starts
  if (!updateInterval) {
    // Run the update every 30 seconds (adjust as needed)
    updateInterval = setInterval(() => {
      updatePrinters()
        .catch(err => console.error('Error in scheduled printer update:', err));
    }, 30000);
    
    console.log('Printer status update scheduler initialized');
  }
  
  // Middleware should return something or allow the request to continue
  return;
});