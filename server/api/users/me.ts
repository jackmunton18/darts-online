import { defineEventHandler, createError } from 'h3'
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

    // Get the user document from Firestore
    const db = admin.firestore()
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()
    
    if (!userDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }
    
    // Return the user data
    return {
      success: true,
      user: { id: userId, ...userDoc.data() }
    }
    
  } catch (error: any) {
    console.error('Error fetching user:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'An error occurred fetching the user'
    })
  }
})
