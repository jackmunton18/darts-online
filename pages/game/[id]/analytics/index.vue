<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white shadow-md rounded-lg p-6 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Game Analytics</h1>
            
            <div v-if="currentGame" class="space-y-4">
                <!-- Game Info Row -->
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div class="text-sm text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Game Code:</span> {{ currentGame.gameCode }}
                        </div>
                        <div v-if="gameDate" class="text-sm text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Date:</span> {{ gameDate }}
                        </div>
                    </div>
                    <div v-if="gameDuration" class="text-sm text-gray-600">
                        <!-- TODO Translate -->
                        <span class="font-medium">Duration:</span> {{ gameDuration }}
                    </div>
                </div>
                
                <!-- Players and Score Row -->
                <div v-if="currentGame.players && currentGame.players.length >= 2" class="border-t pt-4">
                    <div class="flex items-center justify-between">
                        <!-- Player 1 -->
                        <div class="flex-1">
                            <div class="text-lg font-semibold text-gray-900">{{ currentGame.players[0].name }}</div>
                            <div class="text-sm text-gray-600">{{ currentGame.gameType }}</div>
                        </div>
                        
                        <!-- Score Display -->
                        <div class="px-6">
                            <div class="text-center">
                                <!-- TODO Translate -->
                                <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Legs</div>
                                <div class="text-2xl font-bold">
                                    {{ currentGame.players[0].legs }} - {{ currentGame.players[1].legs }}
                                </div>
                                <div v-if="currentGame.setsToWin > 1" class="text-xs text-gray-500 mt-1">
                                    <!-- TODO Translate -->
                                    Sets: {{ currentGame.players[0].sets }} - {{ currentGame.players[1].sets }}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Player 2 -->
                        <div class="flex-1 text-right">
                            <div class="text-lg font-semibold text-gray-900">{{ currentGame.players[1].name }}</div>
                            <div class="text-sm text-gray-600">{{ getGameResult() }}</div>
                        </div>
                    </div>
                </div>
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
import formatDate from '~/utils/formatDate'

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
            ? currentGame.value.finishedAt.toDate().toLocaleString()
            : currentGame.value.finishedAt,
        createdAt: currentGame.value.createdAt && typeof currentGame.value.createdAt !== 'string'
            ? currentGame.value.createdAt.toDate().toLocaleString()
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

// Additional computed properties for the enhanced header
const gameDate = computed(() => {
    if (!currentGame.value?.createdAt) return null
    
    const date = currentGame.value.createdAt.toDate ? 
        currentGame.value.createdAt.toDate() : 
        new Date(currentGame.value.createdAt as any)
    
    return formatDate(date.toISOString())
})

const gameDuration = computed(() => {
    if (!currentGame.value?.createdAt || !currentGame.value?.finishedAt) return null
    
    const startTime = currentGame.value.createdAt.toDate ? 
        currentGame.value.createdAt.toDate() : 
        new Date(currentGame.value.createdAt as any)
        
    const endTime = currentGame.value.finishedAt.toDate ? 
        currentGame.value.finishedAt.toDate() : 
        new Date(currentGame.value.finishedAt as any)
    
    const durationMs = endTime.getTime() - startTime.getTime()
    const minutes = Math.floor(durationMs / (1000 * 60))
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`
    } else {
        return `${seconds}s`
    }
})

// Get game result text
const getGameResult = () => {
    if (!currentGame.value || currentGame.value.status !== 'finished' || currentGame.value.players.length < 2) {
        return 'In Progress'
    }
    
    const [player1, player2] = currentGame.value.players
    
    // Determine winner based on sets (or legs if sets = 1)
    let winner = null
    if (currentGame.value.setsToWin > 1) {
        // Multi-set game
        if (player1.sets > player2.sets) {
            winner = player1
        } else if (player2.sets > player1.sets) {
            winner = player2
        }
    } else {
        // Single set game, winner determined by legs
        if (player1.legs > player2.legs) {
            winner = player1
        } else if (player2.legs > player1.legs) {
            winner = player2
        }
    }
    
    if (winner) {
        // TODO Translate
        return `${winner.name} Wins`
    } else if (currentGame.value.abandonedBy) {
        // TODO Translate
        return 'Game Abandoned'
    } else {
        // TODO Translate
        return 'Draw'
    }
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
