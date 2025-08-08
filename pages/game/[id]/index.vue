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
                <div class="flex space-x-3">
                    <!-- Abandon Game Button (only show for active players in playing games) -->
                    <button 
                        v-if="currentGame && currentGame.status === 'playing' && isCurrentUserPlaying"
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        @click="showAbandonConfirm = true"
                    >
                        <!-- TODO Translate -->
                        Abandon Game
                    </button>
                    <button 
                        class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                        @click="navigateToHome"
                    >
                        <!-- TODO Translate -->
                        Back to Games
                    </button>
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
            <!-- Game Lobby (Only show when waiting) -->
            <div v-if="currentGame.status === 'waiting'" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div class="bg-white rounded-lg shadow-md p-4 md:p-6">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4">Game Lobby</h3>
                    
                    <div class="bg-gray-100 p-3 md:p-4 rounded-lg mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                        <!-- TODO Translate -->
                        <div class="font-medium text-center sm:text-left">Game Code: <span class="text-blue-600 font-bold tracking-wider">{{ currentGame.gameCode }}</span></div>
                        <button 
                            @click="copyGameCode" 
                            class="w-full sm:w-auto text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded touch-manipulation"
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
                    
                    <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                            v-if="isHost"
                            @click="handleStartGame"
                            :disabled="isLoading || currentGame.players.length < 2"
                            class="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium touch-manipulation"
                            style="min-height: 52px;"
                        >
                            <!-- TODO Translate -->
                            {{ isLoading ? 'Starting...' : currentGame.players.length < 2 ? `Waiting for players` : 'Start Game' }}
                        </button>
                        <button
                            @click="handleLeaveGame"
                            :disabled="isLoading"
                            class="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium touch-manipulation"
                            style="min-height: 52px;"
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
            
            <!-- Scoring Component (show when playing or just finished to allow modal to appear) - Full width layout -->
            <DartsScoringGame v-if="currentGame.status === 'playing' || currentGame.status === 'finished'" :key="gameId" />
        </div>
        
        <!-- Abandon Game Confirmation Modal -->
        <div v-if="showAbandonConfirm" class="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div class="absolute inset-0 bg-black bg-opacity-50" @click="showAbandonConfirm = false"></div>
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10">
                <div class="p-6">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4 text-gray-900">Abandon Game?</h3>
                    <p class="text-gray-600 mb-6">
                        <!-- TODO Translate -->
                        Are you sure you want to abandon this game? Your opponent will be awarded the win and the game will end immediately. This action cannot be undone.
                    </p>
                    
                    <div class="flex space-x-4">
                        <button
                            @click="showAbandonConfirm = false"
                            class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
                            :disabled="isAbandoning"
                        >
                            <!-- TODO Translate -->
                            Cancel
                        </button>
                        <button
                            @click="handleAbandonGame"
                            class="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium"
                            :disabled="isAbandoning"
                        >
                            <!-- TODO Translate -->
                            {{ isAbandoning ? 'Abandoning...' : 'Yes, Abandon Game' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import { useGamePersistence } from '~/composables/useGamePersistence'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'
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
    unsubscribeFromGame,
    abandonGame
} = useFirebaseDartsGame()

const isLoading = ref(true)
const isNavigatingAway = ref(false)
const showAbandonConfirm = ref(false)
const isAbandoning = ref(false)

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

const handleAbandonGame = async () => {
    if (!currentGame.value || !gameId.value) {
        return
    }

    try {
        isAbandoning.value = true
        
        const authStore = useAuthStore()
        
        if (!authStore.currentUser) {
            throw new Error('User not authenticated')
        }

        if (!abandonGame) {
            throw new Error('Abandon game function not available')
        }

        const result = await abandonGame(gameId.value, authStore.currentUser.id)
        
        if (result.success) {
            toast.addMessage({
                type: 'warning',
                message: 'You have abandoned the game. Your opponent has been awarded the win.'
            })
            
            // Close the modal
            showAbandonConfirm.value = false
            
            // Navigate to analytics page after a brief delay
            setTimeout(() => {
                router.push(`/game/${gameId.value}/analytics`)
            }, 1500)
        } else {
            throw new Error('Failed to abandon game')
        }
    } catch (error) {
        console.error('Error abandoning game:', error)
        toast.addMessage({
            type: 'error',
            message: 'Failed to abandon the game. Please try again.'
        })
    } finally {
        isAbandoning.value = false
    }
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
        // Don't navigate automatically - let the DartsScoringGame modal handle this
        console.log('Game finished, modal should appear in DartsScoringGame component')
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
