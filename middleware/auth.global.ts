import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useLoadingStore } from '~/stores/loading'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server side
  if (process.server) return
  
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const loadingStore = useLoadingStore()
  
  // Only perform initial auth check once
  if (!loadingStore.initialAuthCheckDone) {
    loadingStore.setLoading(true)
    
    try {
      // Check saved user in localStorage
      const savedUser = localStorage.getItem('darts_user')
      
      if (savedUser) {
        // Verify the user is still valid by checking auth state
        await authStore.checkAuth()
        
        // If authenticated, fetch user data from Firestore
        if (authStore.isAuthenticated) {
          await userStore.fetchUser().catch(err => {
            console.error('Failed to fetch user data:', err)
          })
        }
      }
    } catch (error) {
      console.error('Failed to restore authentication:', error)
    } finally {
      // Mark initial auth check as done and stop loading
      loadingStore.setInitialAuthCheckDone(true)
      loadingStore.setLoading(false)
    }
  }
  
  // If user is trying to access /auth but is already authenticated, redirect to home
  if (to.path === '/auth' && authStore.isAuthenticated) {
    return navigateTo('/')
  }
  
  // Allow unauthenticated access to auth page
  if (to.path === '/auth') return
  
  // For all other routes, require authentication
  if (!authStore.isAuthenticated) {
    return navigateTo('/auth')
  }
})
