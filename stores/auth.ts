import { defineStore } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser,
  type Auth
} from 'firebase/auth'
import { useNotificationStore } from '~/stores/notification'

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)

  // Get Firebase auth instance
  const getAuth = (): Auth => {
    if (process.server) {
      throw new Error('Firebase Auth can only be used on the client side.')
    }
    
    const { $auth } = useNuxtApp()
    if (!$auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.')
    }
    return $auth as Auth
  }

  // Convert Firebase user to our User interface
  const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'User',
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
    }
  }

  // Actions
  const login = async (email: string, password: string) => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      user.value = convertFirebaseUser(firebaseUser)

      return { success: true, error: null }
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getAuth()
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Create user in our Firestore collection
      if (firebaseUser) {
        // Create a user document in Firestore
        try {
          // Split name into first and last name
          const nameParts = name.trim().split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

          // Get ID token for API call
          const idToken = await firebaseUser.getIdToken()
          
          console.log('Attempting to create Firestore user document...', { firstName, lastName, email })
          
          // Create the user in Firestore using our API
          const response = await $fetch('/api/users/create', {
            method: 'POST',
            body: { firstName, lastName, email },
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          })
          
          console.log('Firestore user creation response:', response)
        } catch (userCreateErr) {
          console.error('Failed to create user document in Firestore:', userCreateErr)
          
          // Add a toast notification to make this visible to the user
          const toast = useNotificationStore()
          toast.addMessage({
            type: 'error',
            message: 'Warning: User profile could not be created. Some features may not work properly.'
          })
          
          // We continue even if the Firestore user creation fails
          // The user is still created in Firebase Auth
        }
      }
      
      user.value = convertFirebaseUser(firebaseUser)

      return { success: true, error: null }
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getAuth()
      await signOut(auth)
      user.value = null
      
      // Also clear user store if we're in the browser
      if (process.client) {
        const userStore = useUserStore()
        userStore.clearUser()
      }

      return { success: true, error: null }
    } catch (err: any) {
      error.value = err.message || 'Logout failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const checkAuth = async () => {
    try {
      isLoading.value = true
      error.value = null

      const auth = getAuth()
      
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            user.value = convertFirebaseUser(firebaseUser)
          } else {
            user.value = null
          }
          unsubscribe()
          resolve({ success: true, error: null })
        })
      })
    } catch (err: any) {
      error.value = err.message || 'Auth check failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Restore user from saved data
  const restoreUser = (savedUser: User) => {
    if (!user.value && savedUser && savedUser.id) {
      user.value = savedUser
      return true
    }
    return false
  }

  // Watch for user changes and save to localStorage (for persistence across page reloads)
  watch(user, (newUser) => {
    if (process.client) {
      if (newUser) {
        localStorage.setItem('darts_user', JSON.stringify(newUser))
      } else {
        localStorage.removeItem('darts_user')
      }
    }
  })

  // Get the ID token for the current user
  const getIdToken = async (): Promise<string> => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('No user is signed in')
      }
      
      return await currentUser.getIdToken(true)
    } catch (err) {
      console.error('Error getting ID token:', err)
      throw err
    }
  }
  
  return {
    // State
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    isAuthenticated,
    currentUser,

    // Actions
    login,
    register,
    logout,
    checkAuth,
    restoreUser,
    getIdToken
  }
})