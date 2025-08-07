// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from "firebase/auth"
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics"
import { getMessaging, onMessage } from 'firebase/messaging'


export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig().public.firebaseConfig
    
    // Validate required configuration
    if (!config.apiKey || !config.projectId) {
        console.error('Missing required Firebase client configuration:')
        console.error('- API Key:', !!config.apiKey)
        console.error('- Project ID:', !!config.projectId)
        throw new Error('Missing required Firebase client environment variables')
    }
    
    const firebaseConfig = {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        measurementId: config.measurementId
    };

    // Check if Firebase is already initialized
    let app;
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized on client-side for project:', config.projectId);
    } else {
        app = getApps()[0];
        console.log('✅ Using existing Firebase instance on client-side');
    }

    const analytics = getAnalytics(app)
    const auth = getAuth(app)
    const firestore = getFirestore(app)
    const messaging = getMessaging(app)

    onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // ...
        // Show a notification or handle the message as needed
    });


    nuxtApp.vueApp.provide('auth', auth)
    nuxtApp.provide('auth', auth)

    nuxtApp.vueApp.provide('firestore', firestore)
    nuxtApp.provide('firestore', firestore)

    nuxtApp.vueApp.provide('messaging', messaging)
    nuxtApp.provide('messaging', messaging)
    
})
