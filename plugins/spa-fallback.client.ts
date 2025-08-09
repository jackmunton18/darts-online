// Client-side plugin to handle SPA fallback routing
export default defineNuxtPlugin(() => {
  // This plugin runs only on the client side to handle direct access to dynamic routes
  
  if (process.client) {
    // Listen for navigation errors and handle them gracefully
    const router = useRouter()
    
    router.beforeEach((to, from, next) => {
      // Allow all routes to proceed normally in SPA mode
      next()
    })
    
    // Handle any routing errors
    router.onError((error) => {
      console.warn('Router error caught:', error)
      // Don't redirect automatically, let the catch-all route handle it
    })
  }
})
