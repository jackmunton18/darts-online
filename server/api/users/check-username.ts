import { defineEventHandler, createError, getQuery } from 'h3'
import { admin, initializeAdmin } from '~/server/plugins/firebase-admin.server'

export default defineEventHandler(async (event) => {
  try {
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

    // Get username from query parameters
    const query = getQuery(event)
    const username = query.username as string

    if (!username) {
      throw createError({
        statusCode: 400,
        message: 'Username is required',
      })
    }

    // Validate username format (alphanumeric, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      return {
        available: false,
        message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
      }
    }

    const db = admin.firestore()
    
    // Check if username is already taken - use simple query to avoid index requirement
    const usernameQuery = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get()
    
    // If no user found with this username, it's available
    if (usernameQuery.empty) {
      return {
        available: true,
        message: 'Username is available'
      }
    }
    
    // If a user is found, check if it's the current user
    const existingUserDoc = usernameQuery.docs[0]
    const existingUserId = existingUserDoc.id
    
    // If the existing user is the current user, username is "available" (unchanged)
    if (existingUserId === userId) {
      return {
        available: true,
        message: 'Username is available'
      }
    }
    
    // Otherwise, username is taken by another user
    return {
      available: false,
      message: 'Username is already taken'
    }
    
  } catch (error: any) {
    console.error('Error checking username availability:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'An error occurred checking username availability'
    })
  }
})
