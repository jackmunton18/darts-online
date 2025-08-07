<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white shadow-md rounded-lg p-4 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Game Analytics</h1>
            <div class="flex justify-between items-center">
                <p class="text-gray-700 mb-2">
                    <!-- TODO Translate -->
                    <span v-if="currentGame">Game Code: <span class="font-medium">{{ currentGame.gameCode }}</span></span>
                </p>
                <button 
                    class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                    @click="navigateBackToGame"
                >
                    <!-- TODO Translate -->
                    Back to Game
                </button>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="!currentGame" class="bg-white shadow-md rounded-lg p-6 mb-6">
            <!-- TODO Translate -->
            <h2 class="text-lg font-semibold mb-4">Game Not Found</h2>
            <p class="text-gray-700 mb-4">The game session you're looking for could not be found.</p>
            <button 
                class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                @click="navigateToHome"
            >
                <!-- TODO Translate -->
                Return to Games
            </button>
        </div>

        <div v-else>
            <!-- Game Analytics Component -->
            <GameAnalytics 
                :game="normalizedGame"
                :game-history="turns"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import { useNotificationStore } from '~/stores/notification'

// Get route and router for navigation
const route = useRoute()
const router = useRouter()
const toast = useNotificationStore()

// Get the game ID from the route params
const gameId = computed(() => route.params.id as string)

// Firebase darts game service
const { 
    currentGame,
    turns,
    subscribeToGame,
    unsubscribeFromGame
} = useFirebaseDartsGame()

const normalizedGame = computed(() => {
    if (!currentGame.value) return null
    return {
        ...currentGame.value,
        finishedAt: currentGame.value.finishedAt && typeof currentGame.value.finishedAt !== 'string'
            ? currentGame.value.finishedAt.toString()
            : currentGame.value.finishedAt,
        createdAt: currentGame.value.createdAt && typeof currentGame.value.createdAt !== 'string'
            ? currentGame.value.createdAt.toString()
            : currentGame.value.createdAt
    }
})

const isLoading = ref(true)
const isNavigatingAway = ref(false)

// Navigate back to game
const navigateBackToGame = () => {
    isNavigatingAway.value = true
    router.push(`/game/${gameId.value}`)
}

// Navigate to games list
const navigateToHome = () => {
    isNavigatingAway.value = true
    router.push('/')
}

// Subscribe to the game when mounted
onMounted(async () => {
    if (!gameId.value) {
        toast.addMessage({
            type: 'error',
            message: 'Invalid game ID'
        })
        isLoading.value = false
        return
    }
    
    try {
        if (typeof subscribeToGame === 'function') {
            await subscribeToGame(gameId.value)
            
            // Add a small delay to ensure data is loaded
            setTimeout(() => {
                if (!currentGame.value) {
                    toast.addMessage({
                        type: 'error',
                        message: 'Game data could not be loaded. Please try again.'
                    })
                }
                isLoading.value = false
            }, 1500)
        } else {
            throw new Error('Game subscription function not available')
        }
    } catch (error) {
        console.error('Failed to subscribe to game:', error)
        toast.addMessage({
            type: 'error',
            message: 'Failed to load game'
        })
        isLoading.value = false
    }
})

// Clean up subscriptions when unmounting
onBeforeUnmount(() => {
    if (!isNavigatingAway.value && typeof unsubscribeFromGame === 'function') {
        unsubscribeFromGame()
    }
})
</script>
