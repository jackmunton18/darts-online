import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FirestoreUser } from '~/types/user'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<FirestoreUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // User API composable
  const userAPI = useUserAPI()

  // Computed
  const isProfileComplete = computed(() => {
    if (!user.value) return false
    return !!(user.value.firstName && user.value.lastName && user.value.username)
  })

  // Actions
  const fetchUser = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await userAPI.getCurrentUser()
      
      if (response.success && response.user) {
        user.value = response.user
        return true
      }
      
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  const createOrUpdateUser = async (userData: { firstName: string; lastName: string; email: string }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await userAPI.createUser(userData)
      
      if (response.success && response.user) {
        user.value = response.user
        return true
      }
      
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to create or update user'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  const updateProfile = async (profileData: { firstName: string; lastName: string; username: string }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await userAPI.updateProfile(profileData)
      
      if (response.success && response.user) {
        user.value = response.user
        return true
      }
      
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  const checkUsernameAvailability = async (username: string) => {
    try {
      error.value = null
      
      const response = await userAPI.checkUsernameAvailability(username)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to check username availability'
      throw err
    }
  }
  
  const updateGameStats = async () => {
    try {
      error.value = null
      
      const response = await userAPI.updateGameStats()
      
      if (response.success && response.user) {
        user.value = response.user
        return true
      }
      
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to update game statistics'
      return false
    }
  }
  
  const clearUser = () => {
    user.value = null
    error.value = null
    userAPI.clearCurrentUser()
  }

  return {
    // State
    user,
    isLoading,
    error,
    
    // Computed
    isProfileComplete,
    
    // Actions
    fetchUser,
    createOrUpdateUser,
    updateProfile,
    checkUsernameAvailability,
    updateGameStats,
    clearUser
  }
})
