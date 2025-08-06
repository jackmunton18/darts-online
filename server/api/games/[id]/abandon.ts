import { defineEventHandler, getRouterParam, createError, getQuery, readBody } from 'h3'
import { admin } from '../../../plugins/firebase-admin.server'

export default defineEventHandler(async (event) => {
  try {
    const gameId = getRouterParam(event, 'id')
    const { userId } = await readBody(event)
    
    if (!gameId) {
      throw createError({
        statusCode: 400,
        message: 'Game ID is required'
      })
    }
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }
    
    const db = admin.firestore()
    const gameRef = db.collection('dartsGames').doc(gameId)
    const gameDoc = await gameRef.get()
    
    if (!gameDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Game not found'
      })
    }
    
    const gameData = gameDoc.data() as any
    
    // If game is already finished, don't allow abandonment
    if (gameData.status === 'finished') {
      throw createError({
        statusCode: 400,
        message: 'Game is already finished'
      })
    }
    
    // Validate that the abandoning user is a player in the game
    const isPlayer = gameData.players.some((player: any) => player.id === userId)
    if (!isPlayer) {
      throw createError({
        statusCode: 403,
        message: 'Only players can abandon a game'
      })
    }
    
    // Mark game as finished and abandoned
    const otherPlayer = gameData.players.find((player: any) => player.id !== userId)
    
    // If there's only one player, there's no winner
    const winner = otherPlayer ? otherPlayer.id : null
    
    await gameRef.update({
      status: 'finished',
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      abandonedBy: userId,
      winner: winner,
      gameDuration: gameData.createdAt ? 
        admin.firestore.FieldValue.serverTimestamp().toMillis() - gameData.createdAt.toMillis() : 0
    })
    
    return {
      success: true,
      message: 'Game marked as abandoned',
      gameId,
      abandonedBy: userId,
      winner
    }
  } catch (error: any) {
    console.error('Error abandoning game:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to abandon game'
    })
  }
})
