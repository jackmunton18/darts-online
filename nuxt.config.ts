// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (only available on the server-side)
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebaseClientId: process.env.FIREBASE_CLIENT_ID,
    firebaseAuthUri: process.env.FIREBASE_AUTH_URI,
    firebaseTokenUri: process.env.FIREBASE_TOKEN_URI,
    
    // Public keys (exposed to the client-side)
    public: {
      firebaseConfig: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
        // measurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      }
    }
  },
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  css: ['~/assets/css/main.scss'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  
  // Add hooks for prerender
  hooks: {
    'nitro:config': (nitroConfig) => {
      // Set environment variable for prerender
      if (nitroConfig.dev !== true && (nitroConfig.prerender?.routes || []).length > 0) {
        process.env.prerender = 'true'
      }
    }
  },
  
  // Configure nitro for Netlify deployment
  nitro: {
    preset: 'netlify',
    experimental: {
      wasm: true
    },
    prerender: {
      // Exclude dynamic routes from prerendering
      ignore: [
        '/game/**',
        '/api/**'
      ]
    }
  },

  modules: ["@pinia/nuxt", '@samk-dev/nuxt-vcalendar', 'vue3-carousel-nuxt'],
  app: {
    head: {
      title: 'Darts',
      meta: [
        { charset: 'utf-8' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Darts' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'msapplication-navbutton-color', content: '#ffffff' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'msapplication-starturl', content: '/' },
        {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no',
        },

        {
            hid: 'description',
            name: 'description',
            content:
                "Darts counter.",
        },
      ],

      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/adam.png' },
      ],
    }
  },
})