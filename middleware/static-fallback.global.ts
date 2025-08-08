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
        // Construct the URL with query params
        const authUrl = '/auth?' + new URLSearchParams({
          redirect: to.fullPath // Save the full path for redirect after login
        }).toString()
        
        return navigateTo(authUrl, { 
          replace: true 
        })
      } else {
        // Extract game ID and view type for better handling
        const pathParts = to.path.split('/')
        const gameId = pathParts[2] || ''
        const view = pathParts[3] || ''
        
        // Redirect to home page with context
        return navigateTo('/?' + new URLSearchParams({
          error: 'direct-access',
          path: to.path,
          gameId,
          view,
          timestamp: Date.now().toString() // Add timestamp to prevent caching issues
        }).toString(), { 
          replace: true 
        })
      }
    }
  }
})
