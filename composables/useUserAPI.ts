import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore'
import type { FirestoreUser } from '~/types/user'
import { generateUsername } from '~/types/user'

interface UserResponse {
  success: boolean;
  user?: FirestoreUser;
  message?: string;
}

interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  winPercentage: number;
  averageScore: number;
  highestScore: number;
  highestCheckout: number;
  fastestCheckout: number; // Fewest darts for a checkout
  total180s: number;
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
          winPercentage: 0,
          averageScore: 0,
          highestScore: 0,
          highestCheckout: 0,
          fastestCheckout: 0,
          total180s: 0
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

  // Get game statistics from user document
  const calculateGameStats = async (userId: string): Promise<GameStats> => {
    try {
      const firestore = getFirestore()
      
      // Get user document which contains the aggregated game stats
      const userDocRef = doc(firestore, 'users', userId)
      const userSnapshot = await getDoc(userDocRef)
      
      if (!userSnapshot.exists()) {
        return {
          gamesPlayed: 0,
          gamesWon: 0,
          winPercentage: 0,
          averageScore: 0,
          highestScore: 0,
          highestCheckout: 0,
          fastestCheckout: 0,
          total180s: 0
        }
      }
      
      const userData = userSnapshot.data()
      const gameStats = userData.gameStats || {
        gamesPlayed: 0,
        gamesWon: 0,
        winPercentage: 0,
        averageScore: 0,
        highestScore: 0,
        highestCheckout: 0,
        fastestCheckout: 0,
        total180s: 0
      }
      
      return gameStats
    } catch (err: any) {
      // Return default stats on error
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        winPercentage: 0,
        averageScore: 0,
        highestScore: 0,
        highestCheckout: 0,
        fastestCheckout: 0,
        total180s: 0
      }
    }
  }

  // Update user's game statistics
  const updateGameStats = async (userId?: string): Promise<UserResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const firestore = getFirestore()
      const authUser = getCurrentAuthUser()
      const targetUserId = userId || authUser.uid
      
      // Calculate new stats from games
      const newStats = await calculateGameStats(targetUserId)
      
      // Update user document
      const userDocRef = doc(firestore, 'users', targetUserId)
      await updateDoc(userDocRef, {
        gameStats: newStats,
        updatedAt: new Date()
      })
      
      // If updating current user, refresh their data
      if (targetUserId === authUser.uid) {
        const updatedResponse = await getCurrentUser()
        return updatedResponse
      }
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to update game statistics'
      return {
        success: false,
        message: error.value || 'Failed to update game statistics'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Update user's game statistics when a game is completed
  const updateUserStatsAfterGame = async (userId: string, gameStats: {
    won: boolean,
    totalScore: number,
    totalTurns: number,
    highestTurn: number,
    highestCheckout?: number,
    fastestCheckout?: number, // in number of darts
    total180s?: number // number of 180s in this game
  }): Promise<boolean> => {
    console.log('Updating user stats after game for user:', userId, 'with stats:', gameStats)
    try {
      const firestore = getFirestore()
      const userDocRef = doc(firestore, 'users', userId)
      
      // Get current user stats
      const userSnapshot = await getDoc(userDocRef)
      if (!userSnapshot.exists()) {
        return false
      }
      
      const userData = userSnapshot.data()
      const currentStats = userData.gameStats || {
        gamesPlayed: 0,
        gamesWon: 0,
        winPercentage: 0,
        averageScore: 0,
        highestScore: 0,
        highestCheckout: 0,
        fastestCheckout: 0,
        total180s: 0
      }
      
      // Calculate new aggregated stats
      const newGamesPlayed = currentStats.gamesPlayed + 1
      const newGamesWon = currentStats.gamesWon + (gameStats.won ? 1 : 0)
      const newWinPercentage = (newGamesWon / newGamesPlayed) * 100
      
      // Calculate new average score (weighted average)
      const totalPreviousScore = currentStats.averageScore * currentStats.gamesPlayed
      const newTotalScore = totalPreviousScore + (gameStats.totalScore / gameStats.totalTurns)
      const newAverageScore = newTotalScore / newGamesPlayed
      
      // Update highest score
      const newHighestScore = Math.max(currentStats.highestScore, gameStats.highestTurn)
      
      // Update highest checkout
      const newHighestCheckout = gameStats.highestCheckout 
        ? Math.max(currentStats.highestCheckout, gameStats.highestCheckout)
        : currentStats.highestCheckout
      
      // Update fastest checkout (lowest number of darts)
      let newFastestCheckout = currentStats.fastestCheckout
      if (gameStats.fastestCheckout) {
        if (currentStats.fastestCheckout === 0) {
          newFastestCheckout = gameStats.fastestCheckout
        } else {
          newFastestCheckout = Math.min(currentStats.fastestCheckout, gameStats.fastestCheckout)
        }
      }
      
      // Update total 180s
      const newTotal180s = currentStats.total180s + (gameStats.total180s || 0)
      
      const updatedStats = {
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        winPercentage: newWinPercentage,
        averageScore: newAverageScore,
        highestScore: newHighestScore,
        highestCheckout: newHighestCheckout,
        fastestCheckout: newFastestCheckout,
        total180s: newTotal180s
      }
      
      // Update user document
      await updateDoc(userDocRef, {
        gameStats: updatedStats,
        updatedAt: new Date()
      })
      
      return true
    } catch (err: any) {
      return false
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
    clearCurrentUser,
    updateGameStats,
    updateUserStatsAfterGame
  }
}
