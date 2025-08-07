import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let admin: App | null = null

export async function initializeAdmin(): Promise<void> {
  if (admin && getApps().length > 0) {
    return
  }

  try {
    // Use runtime config in Nuxt context, fallback to process.env
    let projectId: string
    let privateKey: string
    let clientEmail: string

    try {
      const config = useRuntimeConfig()
      projectId = config.firebaseProjectId
      privateKey = config.firebasePrivateKey
      clientEmail = config.firebaseClientEmail
    } catch (e) {
      // Fallback to process.env when not in Nuxt context
      projectId = process.env.FIREBASE_PROJECT_ID!
      privateKey = process.env.FIREBASE_PRIVATE_KEY!
      clientEmail = process.env.FIREBASE_CLIENT_EMAIL!
    }

    // Validate required environment variables
    if (!projectId || !privateKey || !clientEmail) {
      console.error('Missing Firebase Admin environment variables:')
      console.error('- FIREBASE_PROJECT_ID:', !!projectId)
      console.error('- FIREBASE_PRIVATE_KEY:', !!privateKey)
      console.error('- FIREBASE_CLIENT_EMAIL:', !!clientEmail)
      throw new Error('Missing required Firebase Admin environment variables')
    }

    const serviceAccount: ServiceAccount = {
      projectId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail,
    }

    admin = initializeApp({
      credential: cert(serviceAccount),
      projectId
    })

    console.log('✅ Firebase Admin initialized successfully for project:', projectId)
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error)
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