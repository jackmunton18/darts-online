import { defineEventHandler } from 'h3'

// This endpoint will trigger a check for abandoned games
// Can be called by a cron job or manually
export default defineEventHandler(async (event) => {
  try {
    // Call the check-abandoned endpoint
    const response = await $fetch('/api/games/check-abandoned', {
      method: 'POST'
    })
    
    return {
      success: true,
      message: 'Abandoned games check completed',
      details: response
    }
  } catch (error) {
    console.error('Error running abandoned games check:', error)
    return {
      success: false,
      message: 'Failed to check for abandoned games',
      error: String(error)
    }
  }
})
