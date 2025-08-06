// Global middleware to redirect users when hitting static pages that should be dynamic
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return
  
  // If we're in a static export and trying to access game-related dynamic routes
  if (process.env.NODE_ENV === 'production') {
    if (to.path.startsWith('/game/')) {
      // Check if user is authenticated before redirecting
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        return navigateTo('/login', { replace: true })
      } else {
        // Redirect to home page instead
        return navigateTo('/?' + new URLSearchParams({
          error: 'direct-access',
          path: to.path
        }).toString(), { 
          replace: true 
        })
      }
    }
  }
})
