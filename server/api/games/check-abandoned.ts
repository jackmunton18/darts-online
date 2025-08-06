import { defineEventHandler, getRouterParam, createError } from 'h3'
import { admin } from '../../plugins/firebase-admin.server'

// This server middleware checks for game abandonment
// It should be called when game status is changed to finished
export default defineEventHandler(async (event) => {
  try {
    // Process all game status updates and check for potential abandonment
    const db = admin.firestore()
    
    // Get recently updated games that are finished but may have been abandoned
    const gamesRef = db.collection('dartsGames')
    const recentFinishedGames = await gamesRef
      .where('status', '==', 'finished')
      .where('winner', '==', null) // No winner indicates potential abandonment
      .orderBy('finishedAt', 'desc')
      .limit(10)
      .get()
    
    // Process each game
    const updatePromises: Promise<any>[] = []
    
    recentFinishedGames.forEach((doc: any) => {
      const gameData = doc.data()
      
      // Skip games that already have abandonment info
      if (gameData.abandonedBy) return
      
      // Check if the game was abandoned (no player reached the required sets)
      const allPlayers = gameData.players || []
      const noWinner = !allPlayers.some((p: any) => p.sets >= gameData.setsToWin)
      
      if (noWinner) {
        console.log(`Game ${doc.id} appears to be abandoned, adding abandonment info`)
        
        // Since we don't know who abandoned it, we'll set winner to the player with most sets
        // Sort players by sets won (descending)
        const sortedPlayers = [...allPlayers].sort((a, b) => b.sets - a.sets)
        const winner = sortedPlayers[0]
        const loser = sortedPlayers[1]
        
        // Assume the player with fewer sets abandoned the game
        const abandonedBy = loser ? loser.id : null
        
        // Update the game with abandonment info
        if (winner && abandonedBy) {
          updatePromises.push(doc.ref.update({
            winner: winner.id,
            abandonedBy: abandonedBy
          }))
        }
      }
    })
    
    // Wait for all updates to complete
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }
    
    return {
      success: true,
      message: `Checked ${recentFinishedGames.size} games, updated ${updatePromises.length} with abandonment info`
    }
  } catch (error: any) {
    console.error('Error processing potential abandoned games:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to process abandoned games'
    })
  }
})
