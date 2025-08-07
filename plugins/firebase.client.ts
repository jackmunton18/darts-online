import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  // Skip Firebase initialization during prerender/static build
  if (process.server || typeof window === 'undefined') {
    return
  }

  // Validate Firebase configuration
  const firebaseConfig = config.public.firebaseConfig as any
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.error('Firebase configuration is missing or incomplete')
    return
  }

  try {
    // Initialize Firebase
    const app: FirebaseApp = initializeApp(firebaseConfig)
    const auth: Auth = getAuth(app)
    const firestore: Firestore = getFirestore(app)

    return {
      provide: {
        firebase: app,
        auth,
        firestore
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error)
    return
  }
})