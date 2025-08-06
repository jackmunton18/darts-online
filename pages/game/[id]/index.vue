<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white shadow-md rounded-lg p-4 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Game Session</h1>
            <div class="flex justify-between items-center">
                <p class="text-gray-700 mb-2">
                    <!-- TODO Translate -->
                    <span v-if="currentGame">Game Code: <span class="font-medium">{{ currentGame.gameCode }}</span></span>
                </p>
                <button 
                    class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                    @click="navigateToHome"
                >
                    <!-- TODO Translate -->
                    Back to Games
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
            <!-- Game Lobby (Only show when waiting) -->
            <div v-if="currentGame.status === 'waiting'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4">Game Lobby</h3>
                    
                    <div class="bg-gray-100 p-4 rounded-lg mb-4 flex justify-between items-center">
                        <!-- TODO Translate -->
                        <div class="font-medium">Game Code: <span class="text-blue-600 font-bold">{{ currentGame.gameCode }}</span></div>
                        <button 
                            @click="copyGameCode" 
                            class="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                        >
                            <!-- TODO Translate -->
                            Copy
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <!-- TODO Translate -->
                        <h4 class="text-md font-medium mb-2">Players ({{ currentGame.players.length }}/2)</h4>
                        <ul class="bg-gray-50 rounded-lg divide-y divide-gray-200">
                            <li v-for="player in currentGame.players" :key="player.id" class="p-3 flex items-center">
                                <span class="flex-1">{{ getPlayerDisplayName(player) }}</span>
                                <span v-if="player.id === currentGame.hostId" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    <!-- TODO Translate -->
                                    Host
                                </span>
                            </li>
                            <!-- Show placeholder for missing player -->
                            <li v-if="currentGame.players.length < 2" class="p-3 text-gray-500 italic">
                                <!-- TODO Translate -->
                                Waiting for another player to join...
                            </li>
                        </ul>
                    </div>
                    
                    <div class="mb-4" v-if="currentGame.spectators && currentGame.spectators.length > 0">
                        <!-- TODO Translate -->
                        <h4 class="text-md font-medium mb-2">Spectators</h4>
                        <ul class="bg-gray-50 rounded-lg divide-y divide-gray-200">
                            <li v-for="spectatorId in currentGame.spectators" :key="spectatorId" class="p-3">
                                <span class="text-gray-600">{{ getSpectatorName(spectatorId) }}</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button
                            v-if="isHost"
                            @click="handleStartGame"
                            :disabled="isLoading || currentGame.players.length < 2"
                            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <!-- TODO Translate -->
                            {{ isLoading ? 'Starting...' : currentGame.players.length < 2 ? `Waiting for ${2 - currentGame.players.length} more player(s)` : 'Start Game' }}
                        </button>
                        <button
                            @click="handleLeaveGame"
                            :disabled="isLoading"
                            class="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <!-- TODO Translate -->
                            {{ isLoading ? 'Leaving...' : 'Leave Game' }}
                        </button>
                    </div>
                </div>
                
                <!-- Game History and Analytics (Only show in waiting room if we have turns) -->
                <div v-if="turns.length > 0" class="bg-white rounded-lg shadow-md p-6">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4">Game History</h3>
                    
                    <div class="max-h-96 overflow-y-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <!-- TODO Translate -->
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Throws</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="turn in turns" :key="`${turn.playerId}-${turn.timestamp}`" class="hover:bg-gray-50">
                                    <td class="px-4 py-2 whitespace-nowrap">
                                        {{ getPlayerName(turn.playerId) }}
                                    </td>
                                    <td class="px-4 py-2 whitespace-nowrap font-medium">
                                        {{ turn.score }}
                                    </td>
                                    <td class="px-4 py-2">
                                        <div class="flex space-x-1">
                                            <span 
                                                v-for="(dart, i) in turn.throws" 
                                                :key="i"
                                                class="px-2 py-1 text-xs bg-gray-100 rounded"
                                            >
                                                {{ formatThrow(dart) }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-2 whitespace-nowrap">
                                        {{ turn.remainingScore }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Scoring Component (Only show when playing) - Full width layout -->
            <DartsScoringGame v-if="currentGame.status === 'playing'" :key="gameId" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import { useGamePersistence } from '~/composables/useGamePersistence'
import { useNotificationStore } from '~/stores/notification'
import type { DartThrow, Turn } from '~/stores/game'
import type { FirebaseGame } from '~/composables/useFirebaseDartsGame'

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
    isHost,
    isCurrentUserPlaying,
    subscribeToGame,
    leaveGame,
    startGame,
    unsubscribeFromGame
} = useFirebaseDartsGame()

const isLoading = ref(true)
const isNavigatingAway = ref(false)

// Game persistence service
const { 
    saveGameSession
} = useGamePersistence()

// Navigate back to home games list
const navigateToHome = () => {
    isNavigatingAway.value = true
    router.push('/')
}

// Navigate to analytics for this game
const navigateToGameAnalytics = () => {
    isNavigatingAway.value = true
    router.push(`/game/${gameId.value}/analytics`)
}

// Handle game actions
const handleStartGame = async () => {
    try {
        isLoading.value = true
        await startGame()
    } catch (err: any) {
        toast.addMessage({
            type: 'error',
            message: err.message || 'Failed to start game'
        })
    } finally {
        isLoading.value = false
    }
}

const handleLeaveGame = async () => {
    try {
        isLoading.value = true
        await leaveGame()
        navigateToHome()
    } catch (err: any) {
        toast.addMessage({
            type: 'error',
            message: err.message || 'Failed to leave game'
        })
        isLoading.value = false
    }
}

const copyGameCode = () => {
    if (!currentGame.value?.gameCode) return
    
    navigator.clipboard.writeText(currentGame.value.gameCode)
        .then(() => {
            toast.addMessage({
                type: 'success',
                message: 'Game code copied to clipboard!'
            })
        })
        .catch((err) => {
            console.error('Failed to copy game code:', err)
            toast.addMessage({
                type: 'error',
                message: 'Failed to copy game code'
            })
        })
}

// Methods
const getPlayerDisplayName = (player: any): string => {
    // For new games, player.name should already contain the Firestore username
    // For legacy games, player.name might be split email username
    return player?.name || 'Unknown Player'
}

const getPlayerName = (playerId: string): string => {
    const player = currentGame.value?.players.find((p) => p.id === playerId)
    return getPlayerDisplayName(player)
}

const getSpectatorName = (spectatorId: string): string => {
    // TODO: In a future version, fetch Firestore username for spectators
    // For now, just show a shorter ID since we don't store spectator names in the game doc
    const shortId = spectatorId.substring(0, 8)
    return `Spectator (${shortId})`
}

const formatThrow = (dartThrow: DartThrow): string => {
    if (dartThrow.value === 0) return 'Miss'
    if (dartThrow.value === 25 && dartThrow.multiplier === 'single') return 'Outer Bull'
    if (dartThrow.value === 25 && dartThrow.multiplier === 'double') return 'Inner Bull'
    
    const prefix = 
        dartThrow.multiplier === 'single' ? 'S' : 
        dartThrow.multiplier === 'double' ? 'D' : 'T'
    
    return `${prefix}${dartThrow.value}`
}

// Watch for game status changes
watch(() => currentGame.value?.status, (newStatus, oldStatus) => {
    if (newStatus === 'finished' && oldStatus === 'playing') {
        toast.addMessage({
            type: 'success',
            message: 'Game has finished!'
        })
        
        // Redirect to analytics page after a short delay to allow the user to see the success message
        setTimeout(() => {
            navigateTo(`/game/${route.params.id}/analytics`)
        }, 1500)
    }
})

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
            
            // Check if game is already finished and redirect to analytics
            if (currentGame.value && currentGame.value.status === 'finished') {
                toast.addMessage({
                    type: 'info',
                    message: 'This game has already finished. Redirecting to analytics...'
                })
                setTimeout(() => {
                    navigateTo(`/game/${gameId.value}/analytics`)
                }, 1500)
            }
            
            // Save this session to local storage for resuming later
            if (currentGame.value) {
                saveGameSession()
            }
        } else {
            throw new Error('Game subscription function not available')
        }
    } catch (error) {
        console.error('Failed to subscribe to game:', error)
        toast.addMessage({
            type: 'error',
            message: 'Failed to load game'
        })
    } finally {
        isLoading.value = false
    }
})

// Clean up properly when leaving
onBeforeUnmount(() => {
    if (!isNavigatingAway.value) {
        if (typeof leaveGame === 'function') {
            leaveGame()
        } else if (typeof unsubscribeFromGame === 'function') {
            unsubscribeFromGame()
        }
    }
})
</script>
