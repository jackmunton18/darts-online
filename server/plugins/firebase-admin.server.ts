import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let admin: App | null = null

export async function initializeAdmin(): Promise<void> {
  if (admin && getApps().length > 0) {
    return
  }

  try {
    // Try to get runtime config (works in Nuxt context)
    let config: any = null
    try {
      config = useRuntimeConfig?.()
    } catch (e) {
      // Not in Nuxt context, use process.env directly
    }
    
    // Check if running in production (Netlify) or development
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (isProduction || !config) {
      // In production or outside Nuxt context, use environment variables
      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      }

      admin = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      })
    } else {
      // In development with runtime config available
      try {
        const serviceAccount = await import('../config/firebase-service-account.json')
        admin = initializeApp({
          credential: cert(serviceAccount.default as ServiceAccount),
          projectId: serviceAccount.default.project_id
        })
      } catch (error) {
        console.error('Failed to load service account file, falling back to runtime config:', error)
        // Fallback to runtime config
        const serviceAccount: ServiceAccount = {
          projectId: config.firebaseProjectId,
          privateKey: config.firebasePrivateKey?.replace(/\\n/g, '\n'),
          clientEmail: config.firebaseClientEmail,
        }

        admin = initializeApp({
          credential: cert(serviceAccount),
          projectId: config.firebaseProjectId
        })
      }
    }

    console.log('Firebase Admin initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    throw error
  }
}

// Nitro plugin interface - this must be the default export
export default defineNitroPlugin(async (nitroApp) => {
  try {
    await initializeAdmin()
  } catch (error) {
    console.error('Failed to initialize Firebase Admin in Nitro plugin:', error)
  }
})

export { admin }
export const db = () => getFirestore(admin!)
export const auth = () => getAuth(admin!)