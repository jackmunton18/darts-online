import { defineEventHandler, readBody, createError } from 'h3'
import { admin, initializeAdmin } from '../../plugins/firebase-admin.server'

interface Player {
  id: string
  name: string
  currentScore: number
  legs: number
  sets: number
  totalThrows: number
  totalScore: number
  averagePerTurn: number
  throwsOver100: number
  doublesHit: number
  triplesHit: number
  singlesHit: number
  bullsHit: number
  checkoutAttempts: number
  successfulCheckouts: number
  highestCheckout: number
  highestTurn: number
  totalTurns: number
  checkoutPercentage: number
}

interface GameData {
  gameCode: string
  status: string
  players: Player[]
  spectators: string[]
  hostId: string
}

export default defineEventHandler(async (event) => {
  // During static generation, return mock data
  if (process.env.prerender) {
    return {
      success: true,
      gameId: 'mock-id',
      message: 'Game joined successfully (static)'
    }
  }

  try {
    // Get request body with game code and role
    const { gameCode, role = 'player' } = await readBody(event)

    if (!gameCode) {
      throw createError({
        statusCode: 400,
        message: 'Game code is required'
      })
    }

    // Get the current user ID from the request
    const authHeader = event.req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    // Use the existing Firebase Admin instance or initialize if needed
    if (!admin) {
      await initializeAdmin()
    }
    
    if (!admin || admin.apps.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'Firebase Admin is not initialized'
      })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(token)
    const userId = decodedToken.uid

    // Get user info from Firestore users collection
    const db = admin.firestore()
    const userDoc = await db.collection('users').doc(userId).get()
    
    let userName = 'Unknown Player'
    if (userDoc.exists) {
      const userData = userDoc.data()
      userName = userData?.username || userData?.firstName || 'Unknown Player'
    } else {
      // Fallback to Firebase auth if no Firestore user exists
      const userRecord = await admin.auth().getUser(userId)
      userName = userRecord.displayName || 'Unknown Player'
    }
    
    // Find game with matching code
    const gamesRef = db.collection('dartsGames')
    const querySnapshot = await gamesRef.where('gameCode', '==', gameCode).get()

    if (querySnapshot.empty) {
      throw createError({
        statusCode: 404,
        message: 'Game not found'
      })
    }

    const gameDoc = querySnapshot.docs[0]
    const gameData = gameDoc.data() as GameData
    const gameId = gameDoc.id
    
    // Check if game is finished
    if (gameData.status === 'finished') {
      throw createError({
        statusCode: 400,
        message: 'Game has already finished'
      })
    }
    
    // Join as player or spectator
    if (role === 'player' && gameData.status === 'waiting') {
      // Check if user is already in the game
      const isAlreadyPlayer = gameData.players.some((p: Player) => p.id === userId)
      
      if (!isAlreadyPlayer) {
        // Check if game already has 2 players (maximum limit)
        if (gameData.players.length >= 2) {
          throw createError({
            statusCode: 400,
            message: 'Game is full. Maximum 2 players allowed.'
          })
        }
        
        // Create new player object
        const newPlayer = {
          id: userId,
          name: userName || `Player ${gameData.players.length + 1}`,
          currentScore: 501, // Default starting score
          legs: 0,
          sets: 0,
          totalThrows: 0,
          totalScore: 0,
          averagePerTurn: 0,
          throwsOver100: 0,
          doublesHit: 0,
          triplesHit: 0,
          singlesHit: 0,
          bullsHit: 0,
          checkoutAttempts: 0,
          successfulCheckouts: 0,
          highestCheckout: 0,
          highestTurn: 0,
          totalTurns: 0,
          checkoutPercentage: 0
        }

        // Add the player to the game
        await gameDoc.ref.update({
          players: [...gameData.players, newPlayer]
        })
        
        return {
          success: true,
          gameId,
          message: 'Joined game as player'
        }
      } else {
        return {
          success: true,
          gameId,
          message: 'Already in game as player'
        }
      }
    } else {
      // Join as spectator if not already a player
      const isAlreadyPlayer = gameData.players.some((p: Player) => p.id === userId)
      const isAlreadySpectator = gameData.spectators.includes(userId)
      
      if (!isAlreadyPlayer && !isAlreadySpectator) {
        await gameDoc.ref.update({
          spectators: [...gameData.spectators, userId]
        })
        
        return {
          success: true,
          gameId,
          message: 'Now spectating game'
        }
      } else if (isAlreadyPlayer) {
        return {
          success: true,
          gameId,
          message: 'Already in game as player'
        }
      } else {
        return {
          success: true,
          gameId,
          message: 'Already spectating game'
        }
      }
    }
  } catch (error: any) {
    console.error('Error joining game:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to join game'
    })
  }
})
