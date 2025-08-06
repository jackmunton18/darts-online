import { defineEventHandler, createError, readBody } from 'h3'
import { admin, initializeAdmin } from '~/server/plugins/firebase-admin.server'
import type { FirestoreUser } from '~/types/user'
import { generateUsername } from '~/types/user'

export default defineEventHandler(async (event) => {
  try {
    console.log('User creation API called')
    
    // Use the existing Firebase Admin instance or initialize if needed
    if (!admin) {
      console.log('Initializing Firebase Admin...')
      await initializeAdmin()
    }
    
    if (!admin || admin.apps.length === 0) {
      console.error('Firebase Admin is not initialized')
      throw createError({
        statusCode: 500,
        message: 'Firebase Admin is not initialized',
      })
    }

    console.log('Firebase Admin is ready')

    // Get the current user ID from the request
    const authHeader = event.req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header')
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('Verifying Firebase token...')
    const decodedToken = await admin.auth().verifyIdToken(token)
    const userId = decodedToken.uid
    console.log('Token verified for user:', userId)

    // Get request body
    const body = await readBody(event)
    const { firstName, lastName, email } = body
    console.log('Request body:', { firstName, lastName, email })

    if (!firstName || !lastName || !email) {
      console.error('Missing required fields:', { firstName, lastName, email })
      throw createError({
        statusCode: 400,
        message: 'First name, last name, and email are required',
      })
    }

    const db = admin.firestore()
    const userRef = db.collection('users').doc(userId)
    
    // Check if the user already exists
    const userDoc = await userRef.get()
    
    if (userDoc.exists) {
      // User exists, return the existing data
      return {
        success: true,
        user: { id: userId, ...userDoc.data() },
        message: 'User already exists'
      }
    }
    
    // Create a new user document
    const username = generateUsername(firstName)
    const now = new Date()
    
    const userData: FirestoreUser = {
      id: userId,
      firstName,
      lastName,
      username,
      email,
      createdAt: now,
      updatedAt: now,
      friends: [],
      gameStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        averageScore: 0,
        highestScore: 0,
        highestCheckout: 0
      }
    }
    
    await userRef.set(userData)
    
    return {
      success: true,
      user: userData,
      message: 'User created successfully'
    }
    
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'An error occurred creating the user'
    })
  }
})
