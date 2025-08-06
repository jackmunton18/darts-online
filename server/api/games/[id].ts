import { defineEventHandler, createError } from 'h3'
import { admin, initializeAdmin } from '../../plugins/firebase-admin.server'

// Define interface for game data
interface GameData {
  status: string;
  gameCode: string;
  createdAt: any; // Use 'any' to avoid issues during static generation
  finishedAt?: any;
}

export default defineEventHandler(async (event) => {
  // During static generation, return mock data
  if (process.env.prerender) {
    return {
      id: 'mock-id',
      status: 'not-available-during-prerender',
      gameCode: 'STATIC',
      createdAt: new Date(),
      finishedAt: null
    }
  }

  try {
    const id = event.context.params?.id

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Game ID is required',
      })
    }

    // Use the existing Firebase Admin instance or initialize if needed
    if (!admin) {
      await initializeAdmin()
    }
    
    if (!admin || admin.apps.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'Firebase Admin is not initialized',
      })
    }

    const db = admin.firestore()
    const gameRef = db.collection('dartsGames').doc(id)
    const gameSnap = await gameRef.get()

    if (!gameSnap.exists) {
      throw createError({
        statusCode: 404,
        message: 'Game not found',
      })
    }

    // Return minimal game data to check status
    const gameData = gameSnap.data() as GameData
    return {
      id: gameSnap.id,
      status: gameData.status,
      gameCode: gameData.gameCode,
      createdAt: gameData.createdAt.toDate(),
      finishedAt: gameData.finishedAt ? gameData.finishedAt.toDate() : null
    }
  } catch (error: any) {
    console.error('Error fetching game:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch game',
    })
  }
})
