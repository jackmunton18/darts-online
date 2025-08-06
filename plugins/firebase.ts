// This plugin serves as a placeholder for conditional Firebase functionality
// Server-side Firebase is handled by ~/server/plugins/firebase-admin.server.ts
// Client-side Firebase is handled by ~/plugins/firebase.client.ts

export default defineNuxtPlugin(() => {
  // This plugin doesn't need to do anything
  // It's just here to prevent warnings about empty plugins
  return {
    provide: {
      // No providers needed
    }
  }
})