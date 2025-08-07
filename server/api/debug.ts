export default defineEventHandler(async (event) => {
  return {
    message: 'Debug endpoint working',
    url: event.node.req.url,
    method: event.node.req.method,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    firebaseConfigExists: !!process.env.FIREBASE_PROJECT_ID,
    publicFirebaseConfigExists: !!process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID
  }
})
