import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore'
import type { FirestoreUser } from '~/types/user'
import { generateUsername } from '~/types/user'

interface UserResponse {
  success: boolean;
  user?: FirestoreUser;
  message?: string;
}

export const useUserAPI = () => {
  const currentUser = ref<FirestoreUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Get Firestore instance
  const getFirestore = () => {
    const { $firestore } = useNuxtApp()
    if (!$firestore) {
      throw new Error('Firestore not initialized')
    }
    return $firestore
  }

  // Get current Firebase Auth user
  const getCurrentAuthUser = () => {
    const { $auth } = useNuxtApp()
    if (!$auth?.currentUser) {
      throw new Error('User not authenticated')
    }
    return $auth.currentUser
  }

  // Create or update user in Firestore
  const createUser = async (userData: { firstName: string; lastName: string; email: string }): Promise<UserResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const firestore = getFirestore()
      const authUser = getCurrentAuthUser()
      
      // Generate username if not provided
      const username = generateUsername(userData.firstName)
      
      const userDoc: Omit<FirestoreUser, 'id'> = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username,
        email: userData.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        friends: [],
        gameStats: {
          gamesPlayed: 0,
          gamesWon: 0,
          averageScore: 0,
          highestScore: 0,
          highestCheckout: 0
        }
      }

      // Create user document with the auth user's UID
      await setDoc(doc(firestore, 'users', authUser.uid), userDoc)
      
      const newUser: FirestoreUser = {
        id: authUser.uid,
        ...userDoc
      }
      
      currentUser.value = newUser
      
      return {
        success: true,
        user: newUser
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to create user'
      return {
        success: false,
        message: error.value || 'Failed to create user'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Get current user's details
  const getCurrentUser = async (): Promise<UserResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const firestore = getFirestore()
      const authUser = getCurrentAuthUser()
      
      const userDocRef = doc(firestore, 'users', authUser.uid)
      const userSnapshot = await getDoc(userDocRef)
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data()
        const user: FirestoreUser = {
          id: authUser.uid,
          ...userData,
          // Convert Firestore timestamps to Date objects
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date()
        } as FirestoreUser
        
        currentUser.value = user
        
        return {
          success: true,
          user
        }
      } else {
        error.value = 'User not found'
        currentUser.value = null
        return {
          success: false,
          message: 'User not found'
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to get user'
      return {
        success: false,
        message: error.value || 'Failed to get user'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Clear the current user data (e.g., on logout)
  const clearCurrentUser = () => {
    currentUser.value = null
  }

  // Update user profile
  const updateProfile = async (userData: { firstName: string; lastName: string; username: string }): Promise<UserResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const firestore = getFirestore()
      const authUser = getCurrentAuthUser()
      
      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        updatedAt: new Date()
      }

      const userDocRef = doc(firestore, 'users', authUser.uid)
      await updateDoc(userDocRef, updateData)
      
      // Get updated user data
      const updatedResponse = await getCurrentUser()
      
      return updatedResponse
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile'
      return {
        success: false,
        message: error.value || 'Failed to update profile'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Check username availability
  const checkUsernameAvailability = async (username: string): Promise<{available: boolean; message: string}> => {
    try {
      const firestore = getFirestore()
      const authUser = getCurrentAuthUser()
      
      // Query for users with this username, excluding current user
      const usersQuery = query(
        collection(firestore, 'users'),
        where('username', '==', username)
      )
      
      const querySnapshot = await getDocs(usersQuery)
      
      // Check if any other user has this username
      const isAvailable = querySnapshot.empty || 
        (querySnapshot.size === 1 && querySnapshot.docs[0].id === authUser.uid)
      
      return {
        available: isAvailable,
        message: isAvailable ? 'Username is available' : 'Username is already taken'
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to check username availability'
      throw err
    }
  }

  return {
    currentUser: readonly(currentUser),
    isLoading: readonly(isLoading),
    error: readonly(error),
    createUser,
    getCurrentUser,
    updateProfile,
    checkUsernameAvailability,
    clearCurrentUser
  }
}
