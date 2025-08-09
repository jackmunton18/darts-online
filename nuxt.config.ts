// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    // Public keys (exposed to the client-side) - all Firebase config becomes public in static mode
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
  
  // Static generation configuration for SPA
  nitro: {
    preset: 'static'
  },
  
  ssr: false, // Enable SPA mode
  
  experimental: {
    payloadExtraction: false // Required for dynamic routes in static mode
  },
  
  // Generate static pages with fallback for dynamic routes
  generate: {
    fallback: '200.html' // This creates a fallback page for dynamic routes
  },
  
  // Optimize client bundle with code splitting
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            // Split vendor libraries
            if (id.includes('d3')) {
              return 'd3'
            }
            if (id.includes('firebase')) {
              return 'firebase'
            }
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          }
        }
      }
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
