// Global middleware for authentication and route handling
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return
  
  // Only handle authentication for protected routes
  if (to.path.startsWith('/game/') || to.path.startsWith('/account') || to.path.startsWith('/analytics')) {
    // Check if user is authenticated
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      // Construct the URL with query params for redirect after login
      const authUrl = '/auth?' + new URLSearchParams({
        redirect: to.fullPath
      }).toString()
      
      return navigateTo(authUrl, { 
        replace: true 
      })
    }
  }
})
