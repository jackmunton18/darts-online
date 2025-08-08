<template>
  <div class="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <h1 class="text-6xl font-extrabold text-red-500">404</h1>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">Page Not Found</h2>
        <p class="mt-2 text-lg text-gray-600">
          The page you're looking for doesn't exist or may have been moved.
        </p>
      </div>
      
      <div class="mt-8">
        <div v-if="isAuthenticated" class="space-y-4">
          <p class="text-gray-600">Here are some helpful links:</p>
          <div class="flex justify-center space-x-4">
            <NuxtLink 
              to="/" 
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Home
            </NuxtLink>
            <button 
              @click="tryReconnectToGame" 
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              :disabled="isReconnecting"
            >
              {{ isReconnecting ? 'Reconnecting...' : 'Try to reconnect' }}
            </button>
          </div>
        </div>
        
        <div v-else class="space-y-4">
          <p class="text-gray-600">Please sign in to continue:</p>
          <NuxtLink 
            to="/auth" 
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useGameStore } from '~/stores/game'
import { useRouter } from 'vue-router'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'

const router = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isReconnecting = ref(false)

const tryReconnectToGame = async () => {
  isReconnecting.value = true
  try {
    // Just redirect to home page, which will handle reconnection if possible
    router.push('/?redirect=404&reconnect=true')
  } catch (error) {
    console.error('Error navigating:', error)
    router.push('/')
  } finally {
    isReconnecting.value = false
  }
}
</script>
