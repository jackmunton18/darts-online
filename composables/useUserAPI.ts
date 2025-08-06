import type { FirestoreUser } from '~/types/user'

interface UserResponse {
  success: boolean;
  user?: FirestoreUser;
  message?: string;
}

export const useUserAPI = () => {
  // Use authStore to get ID token instead of direct Firebase access
  const authStore = useAuthStore()
  const currentUser = ref<FirestoreUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Get the current user's ID token
  const getIdToken = async (): Promise<string> => {
    try {
      return await authStore.getIdToken()
    } catch (err) {
      throw new Error('User not authenticated')
    }
  }

  // Create or update user in Firestore
  const createUser = async (userData: { firstName: string; lastName: string; email: string }) => {
    isLoading.value = true
    error.value = null

    try {
      const idToken = await getIdToken()
      
      const response = await $fetch<UserResponse>('/api/users/create', {
        method: 'POST',
        body: userData,
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      
      if (response.success && response.user) {
        currentUser.value = response.user
      }
      
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get current user's details
  const getCurrentUser = async () => {
    isLoading.value = true
    error.value = null

    try {
      const idToken = await getIdToken()
      
      const response = await $fetch<UserResponse>('/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      
      if (response.success && response.user) {
        currentUser.value = response.user
      }
      
      return response
    } catch (err: any) {
      // If the user is not found, it might be a new user that hasn't been created yet
      if (err.response?.status === 404) {
        error.value = 'User not found'
        currentUser.value = null
        return { success: false, message: 'User not found' }
      }
      
      error.value = err.message || 'Failed to get user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Clear the current user data (e.g., on logout)
  const clearCurrentUser = () => {
    currentUser.value = null
  }

  // Update user profile
  const updateProfile = async (userData: { firstName: string; lastName: string; username: string }) => {
    isLoading.value = true
    error.value = null

    try {
      const idToken = await getIdToken()
      
      const response = await $fetch<UserResponse>('/api/users/update', {
        method: 'POST',
        body: userData,
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      
      if (response.success && response.user) {
        currentUser.value = response.user
      }
      
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    try {
      const idToken = await getIdToken()
      
      const response = await $fetch<{available: boolean; message: string}>('/api/users/check-username', {
        method: 'GET',
        query: { username },
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      
      return response
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
