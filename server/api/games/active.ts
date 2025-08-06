import { defineEventHandler, createError } from 'h3'
import { admin, initializeAdmin } from '../../plugins/firebase-admin.server'

// Define interfaces
interface Player {
  id: string;
  name: string;
  currentScore: number;
  legs: number;
  sets: number;
}

interface GameData {
  gameCode: string;
  status: string;
  createdAt: any;
  finishedAt?: any;
  players?: Player[];
  hostId: string;
  winner?: string;
  abandonedBy?: string;
}

interface ActiveGame {
  id: string;
  gameCode: string;
  status: string;
  role: 'host' | 'player' | 'spectator';
  createdAt: Date;
  finishedAt?: Date;
  players?: Player[];
  hostId: string;
  winner?: string;
  abandonedBy?: string;
}

export default defineEventHandler(async (event) => {
  // During static generation, return empty array
  if (process.env.prerender) {
    return []
  }

  try {
    // Use the existing Firebase Admin instance or initialize if needed
    if (!admin) {
      await initializeAdmin()
    }
    
    if (!admin || admin.apps.length === 0) {
      throw createError({
        statusCode: 503,
        message: 'Firebase Admin is not available. Please configure Firebase service account credentials.',
      })
    }

    // Get the current user ID from the request
    const authHeader = event.req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(token)
    const userId = decodedToken.uid

    // Query games where this user is a player or spectator
    const db = admin.firestore()
    const gamesCollection = db.collection('dartsGames')

    // Find games where user is host
    const hostQuery = gamesCollection
      .where('hostId', '==', userId)
    
    const hostGames = await hostQuery.get()

    // Find games where user is a player
    // We can't use array-contains with complex objects directly
    // Instead, we'll get all games and filter for players
    const allGamesQuery = gamesCollection
    
    const allGames = await allGamesQuery.get()
    const playerGames = allGames.docs.filter((doc: any) => {
      const gameData = doc.data()
      return gameData.players && 
             Array.isArray(gameData.players) && 
             gameData.players.some((player: any) => player.id === userId)
    })

    // Find games where user is a spectator
    const spectatorQuery = gamesCollection
      .where('spectators', 'array-contains', userId)
    
    const spectatorGames = await spectatorQuery.get()

    // Combine all games
    const allUserGames: ActiveGame[] = []

    hostGames.forEach((doc: any) => {
      const game = doc.data() as GameData
      allUserGames.push({
        id: doc.id,
        gameCode: game.gameCode,
        status: game.status,
        role: 'host',
        createdAt: game.createdAt.toDate(),
        finishedAt: game.finishedAt ? game.finishedAt.toDate() : undefined,
        players: game.players || [],
        hostId: game.hostId,
        winner: game.winner,
        abandonedBy: game.abandonedBy
      })
    })

    playerGames.forEach((doc: any) => {
      const game = doc.data() as GameData
      if (!allUserGames.some((g: ActiveGame) => g.id === doc.id)) {
        allUserGames.push({
          id: doc.id,
          gameCode: game.gameCode,
          status: game.status,
          role: 'player',
          createdAt: game.createdAt.toDate(),
          finishedAt: game.finishedAt ? game.finishedAt.toDate() : undefined,
          players: game.players || [],
          hostId: game.hostId,
          winner: game.winner,
          abandonedBy: game.abandonedBy
        })
      }
    })

    spectatorGames.forEach((doc: any) => {
      const game = doc.data() as GameData
      if (!allUserGames.some((g: ActiveGame) => g.id === doc.id)) {
        allUserGames.push({
          id: doc.id,
          gameCode: game.gameCode,
          status: game.status,
          role: 'spectator',
          createdAt: game.createdAt.toDate(),
          finishedAt: game.finishedAt ? game.finishedAt.toDate() : undefined,
          players: game.players || [],
          hostId: game.hostId,
          winner: game.winner,
          abandonedBy: game.abandonedBy
        })
      }
    })

    return allUserGames
  } catch (error: any) {
    console.error('Error fetching active games:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch active games',
    })
  }
})
