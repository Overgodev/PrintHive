import { defineEventHandler } from 'h3'
// We'll use the existing getFilamentStock function that's already in your codebase
import { getFilamentStock } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get filaments from the existing database utility function
    const filaments = await getFilamentStock()
    
    // Return as JSON response
    return filaments
  } catch (error) {
    console.error('API error fetching filament stock:', error)
    return {
      statusCode: 500,
      error: 'Failed to fetch filament stock'
    }
  }
})