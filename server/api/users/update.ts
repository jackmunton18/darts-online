import { defineEventHandler, createError, readBody } from 'h3'
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

    // Get request body
    const body = await readBody(event)
    const { firstName, lastName, username } = body

    if (!firstName || !lastName || !username) {
      throw createError({
        statusCode: 400,
        message: 'First name, last name, and username are required',
      })
    }

    const db = admin.firestore()
    const userRef = db.collection('users').doc(userId)
    
    // Check if the user exists
    const userDoc = await userRef.get()
    
    if (!userDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }
    
    const currentUserData = userDoc.data()!
    
    // Check if username is being changed and if it's available
    if (username !== currentUserData.username) {
      // Check if username is already taken - use simple query to avoid index requirement
      const usernameQuery = await db.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get()
      
      // If username exists and it's not the current user, it's taken
      if (!usernameQuery.empty) {
        const existingUserDoc = usernameQuery.docs[0]
        const existingUserId = existingUserDoc.id
        
        if (existingUserId !== userId) {
          throw createError({
            statusCode: 409,
            message: 'Username is already taken',
          })
        }
      }
    }
    
    // Update the user document
    const updateData = {
      firstName,
      lastName,
      username,
      updatedAt: new Date()
    }
    
    await userRef.update(updateData)
    
    // Get the updated user data
    const updatedUserDoc = await userRef.get()
    const updatedUser = { id: userId, ...updatedUserDoc.data() }
    
    return {
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    }
    
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'An error occurred updating the profile'
    })
  }
})
