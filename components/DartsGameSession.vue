<template>
    <div class="bg-white rounded-lg shadow-md p-6">
        <div v-if="!currentGame && !inGamePage" class="mb-6">
            <!-- TODO Translate -->
            <h3 class="text-lg font-semibold mb-4">Create or Join a Game</h3>
            
            <div class="flex space-x-4 mb-6">
                <button
                    @click="activeTab = 'create'"
                    :class="[
                        'px-4 py-2 rounded-md font-medium',
                        activeTab === 'create'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    ]"
                >
                    <!-- TODO Translate -->
                    Create Game
                </button>
                <button
                    @click="activeTab = 'join'"
                    :class="[
                        'px-4 py-2 rounded-md font-medium',
                        activeTab === 'join'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    ]"
                >
                    <!-- TODO Translate -->
                    Join Game
                </button>
            </div>
            
            <!-- Create Game Form -->
            <div v-if="activeTab === 'create'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <!-- TODO Translate -->
                        Game Type
                    </label>
                    <select
                        v-model="gameConfig.gameType"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="501">501</option>
                        <option value="301">301</option>
                        <option value="101">101</option>
                        <option value="cricket">Cricket</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <!-- TODO Translate -->
                        Starting Score
                    </label>
                    <input
                        v-model.number="gameConfig.startingScore"
                        type="number"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <!-- TODO Translate -->
                        Legs to Win Set
                    </label>
                    <input
                        v-model.number="gameConfig.legsToWin"
                        type="number"
                        min="1"
                        max="10"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <!-- TODO Translate -->
                        Sets to Win Match
                    </label>
                    <input
                        v-model.number="gameConfig.setsToWin"
                        type="number"
                        min="1"
                        max="10"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <button
                    @click="handleCreateGame"
                    :disabled="isLoading"
                    class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <!-- TODO Translate -->
                    {{ isLoading ? 'Creating...' : 'Create Game' }}
                </button>
            </div>
            
            <!-- Join Game Form -->
            <div v-if="activeTab === 'join'" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <!-- TODO Translate -->
                        Game Code
                    </label>
                    <input
                        v-model="gameCode"
                        type="text"
                        maxlength="6"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        placeholder="Enter 6-character code"
                    />
                </div>
                
                <div class="flex space-x-4">
                    <button
                        @click="handleJoinGame('player')"
                        :disabled="isLoading || !gameCode"
                        class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <!-- TODO Translate -->
                        {{ isLoading ? 'Joining...' : 'Join as Player' }}
                    </button>
                    <button
                        @click="handleJoinGame('spectator')"
                        :disabled="isLoading || !gameCode"
                        class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <!-- TODO Translate -->
                        {{ isLoading ? 'Joining...' : 'Spectate Game' }}
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Game Lobby -->
        <div v-else-if="currentGame && currentGame.status === 'waiting'" class="mb-6">
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
                <h4 class="text-md font-medium mb-2">Players</h4>
                <ul class="bg-gray-50 rounded-lg divide-y divide-gray-200">
                    <li v-for="player in currentGame.players" :key="player.id" class="p-3 flex items-center">
                        <span class="flex-1">{{ player.name }}</span>
                        <span v-if="player.id === currentGame.hostId" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            <!-- TODO Translate -->
                            Host
                        </span>
                    </li>
                </ul>
            </div>
            
            <div class="mb-4" v-if="currentGame.spectators.length > 0">
                <!-- TODO Translate -->
                <h4 class="text-md font-medium mb-2">Spectators</h4>
                <div class="text-gray-600">{{ currentGame.spectators.length }} watching</div>
            </div>
            
            <div class="flex space-x-4">
                <button
                    v-if="isHost"
                    @click="handleStartGame"
                    :disabled="isLoading || currentGame.players.length < 1"
                    class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <!-- TODO Translate -->
                    {{ isLoading ? 'Starting...' : 'Start Game' }}
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
        
        <!-- Active Game -->
        <div v-else-if="currentGame && currentGame.status === 'playing'" class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold">Active Game</h3>
                    <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        <!-- TODO Translate -->
                        {{ isCurrentUserPlaying ? 'Playing' : 'Spectating' }}
                    </span>
                </div>
                
                <!-- Only show abandon option for active players -->
                <div v-if="isCurrentUserPlaying && !isLoading">
                    <button 
                        @click="handleAbandonGame"
                        class="text-xs px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 rounded hover:bg-red-200"
                    >
                        <!-- TODO Translate -->
                        Abandon Game
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <!-- TODO Translate -->
                    <div class="text-sm text-gray-500 mb-1">Current Leg</div>
                    <div class="text-lg font-semibold">{{ currentGame.currentLeg }}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <!-- TODO Translate -->
                    <div class="text-sm text-gray-500 mb-1">Current Set</div>
                    <div class="text-lg font-semibold">{{ currentGame.currentSet }}</div>
                </div>
            </div>
            
            <!-- Players List -->
            <div class="mb-4">
                <!-- TODO Translate -->
                <h4 class="text-md font-medium mb-2">Players</h4>
                <ul class="bg-gray-50 rounded-lg divide-y divide-gray-200">
                    <li 
                        v-for="(player, index) in currentGame.players" 
                        :key="player.id" 
                        :class="[
                            'p-3',
                            index === currentGame.currentPlayerIndex ? 'bg-yellow-50 border border-yellow-300 rounded' : ''
                        ]"
                    >
                        <div class="flex justify-between mb-1">
                            <span class="font-medium">{{ player.name }}</span>
                            <span class="text-lg font-bold">{{ player.currentScore }}</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Sets: {{ player.sets }}/{{ currentGame.setsToWin }}</span>
                            <span>Legs: {{ player.legs }}/{{ currentGame.legsToWin }}</span>
                            <span>Avg: {{ player.averagePerTurn.toFixed(1) }}</span>
                        </div>
                    </li>
                </ul>
            </div>
            
            <!-- Current Player -->
            <div v-if="currentPlayer" class="mb-6">
                <!-- TODO Translate -->
                <h4 class="text-md font-medium mb-2">Current Turn: {{ currentPlayer.name }}</h4>
                
                <div v-if="isCurrentPlayerTurn && isCurrentUserPlaying" class="bg-green-50 p-4 rounded-lg border border-green-200">
                    <!-- TODO Translate -->
                    <div class="text-center text-green-800 mb-2">Your Turn!</div>
                    
                    <!-- Checkout suggestions if score is <= 170 -->
                    <div v-if="currentPlayer.currentScore <= 170" class="mb-4">
                        <div class="text-sm font-medium text-gray-700 mb-2">
                            <!-- TODO Translate -->
                            Checkout Suggestions
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <div 
                                v-for="(suggestion, i) in checkoutSuggestions" 
                                :key="i"
                                class="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                            >
                                {{ suggestion.join(' → ') }}
                            </div>
                            <div v-if="checkoutSuggestions.length === 0" class="text-sm text-gray-500">
                                <!-- TODO Translate -->
                                No checkout available
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Leave Game Button -->
            <button
                @click="handleLeaveGame"
                class="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
                <!-- TODO Translate -->
                Leave Game
            </button>
        </div>
        
        <!-- Finished Game -->
        <div v-else-if="currentGame && currentGame.status === 'finished'" class="mb-6">
            <!-- TODO Translate -->
            <h3 class="text-lg font-semibold mb-4">Game Finished</h3>
            
            <!-- Winner -->
            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
                <!-- TODO Translate -->
                <h4 class="text-md font-medium mb-2">Winner</h4>
                <div class="text-xl font-bold text-center py-2">
                    {{ getWinner?.name || 'Unknown' }}
                </div>
            </div>
            
            <!-- Player Stats -->
            <div class="mb-6">
                <!-- TODO Translate -->
                <h4 class="text-md font-medium mb-4">Final Stats</h4>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <!-- TODO Translate -->
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High Score</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High Checkout</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">100+</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="player in currentGame.players" :key="player.id">
                                <td class="px-4 py-2 whitespace-nowrap">{{ player.name }}</td>
                                <td class="px-4 py-2 whitespace-nowrap">{{ (player.averagePerTurn || 0).toFixed(1) }}</td>
                                <td class="px-4 py-2 whitespace-nowrap">{{ player.highestTurn || 0 }}</td>
                                <td class="px-4 py-2 whitespace-nowrap">{{ player.highestCheckout || '-' }}</td>
                                <td class="px-4 py-2 whitespace-nowrap">{{ player.throwsOver100 || 0 }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <button
                @click="handleLeaveGame"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
                <!-- TODO Translate -->
                Exit to Lobby
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import { useGamePersistence } from '~/composables/useGamePersistence'
import { useDartsScoring } from '~/composables/useDartsScoring'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Setup router and route
const router = useRouter()
const route = useRoute()

// Detect if the component is being used in a game page
const inGamePage = computed(() => route.path.includes('/game/'))

// Reactive state
const activeTab = ref('create')
const gameCode = ref('')
const isLoading = ref(false)

// Game configuration
const gameConfig = ref({
    gameType: '501',
    startingScore: 501,
    legsToWin: 3,
    setsToWin: 1
})

// Firebase darts game service
const { 
    currentGame, 
    isHost, 
    currentPlayer,
    isCurrentUserPlaying,
    createGame, 
    joinGame, 
    startGame,
    leaveGame,
    gameId,
    abandonGame
} = useFirebaseDartsGame()

// Game persistence service
const { 
    saveGameSession,
    removeGameSession,
    hasActiveSession,
    latestSession,
    reconnectToGame
} = useGamePersistence()

// Darts scoring service for checkout suggestions
const dartsScoring = useDartsScoring()
const toast = useNotificationStore()
const authStore = useAuthStore()

// Computed properties
const checkoutSuggestions = computed(() => {
    if (!currentPlayer.value || currentPlayer.value.currentScore > 170) return []
    return dartsScoring.getCheckoutSuggestions(currentPlayer.value.currentScore)
})

const isCurrentPlayerTurn = computed(() => {
    if (!currentGame.value || !currentPlayer.value) return false
    return currentPlayer.value.id === authStore.currentUser?.id
})

const getWinner = computed(() => {
    if (!currentGame.value) return null
    
    // If winner ID is stored in the game object, use it
    if (currentGame.value.winner) {
        return currentGame.value.players.find(p => p.id === currentGame.value!.winner)
    }
    
    // Fall back to computing the winner based on sets if winner ID is not available
    return currentGame.value.players.find(p => p.sets >= currentGame.value!.setsToWin)
})

// Methods
const handleCreateGame = async () => {
    try {
        isLoading.value = true
        const result: any = await createGame(gameConfig.value)
        
        if (result.error) {
            toast.addMessage({ 
                type: 'error', 
                message: result.error
            })
        } else if (result.gameId) {
            // Game is created, saveGameSession will be called by the composable
            
            // Navigate to the game page
            router.push(`/game/${result.gameId}`)
        }
    } catch (err: any) {
        toast.addMessage({ 
            type: 'error', 
            message: err.message || 'Failed to create game'
        })
    } finally {
        isLoading.value = false
    }
}

const handleJoinGame = async (role: 'player' | 'spectator' = 'player') => {
    // Validate game code
    if (!gameCode.value) {
        toast.addMessage({ 
            type: 'error', 
            message: 'Please enter a game code'
        })
        return
    }
    
    // Ensure game code is valid format (e.g., alphanumeric and proper length)
    const cleanCode = gameCode.value.toUpperCase().trim()
    if (!/^[A-Z0-9]{6}$/.test(cleanCode)) {
        toast.addMessage({ 
            type: 'error', 
            message: 'Invalid game code format. Should be 6 characters.'
        })
        return
    }
    
    try {
        isLoading.value = true
        
        if (typeof joinGame !== 'function') {
            throw new Error('Game service not properly initialized')
        }
        
        const result = await joinGame(cleanCode, role)
        
        if (result && typeof result === 'object' && 'error' in result && result.error) {
            toast.addMessage({ 
                type: 'error', 
                message: result.error
            })
        } else if (result && typeof result === 'object' && 'gameId' in result && result.gameId) {
            // Navigate to the game page
            router.push(`/game/${result.gameId}`)
        }
    } catch (err: any) {
        toast.addMessage({ 
            type: 'error', 
            message: err.message || 'Failed to join game'
        })
    } finally {
        isLoading.value = false
    }
}

const handleStartGame = async () => {
    try {
        isLoading.value = true
        const success = await startGame()
        
        // If we're still on the home page, navigate to the game page
        if (success && gameId.value) {
            router.push(`/game/${gameId.value}`)
        }
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
        const gameIdToRemove = gameId.value
        await leaveGame()
        
        // Remove from active sessions if the game was finished
        if (currentGame.value?.status === 'finished' && gameIdToRemove) {
            removeGameSession(gameIdToRemove)
        }
    } catch (err: any) {
        toast.addMessage({ 
            type: 'error', 
            message: err.message || 'Failed to leave game'
        })
    } finally {
        isLoading.value = false
    }
}

// Handle game abandonment
const handleAbandonGame = async () => {
    if (!currentGame.value || !authStore.currentUser) {
        return
    }

    try {
        isLoading.value = true
        // Confirm abandonment with user
        const confirmed = confirm('Are you sure you want to abandon this game? You will forfeit the game to your opponent.')
        
        if (!confirmed) {
            isLoading.value = false
            return
        }

        // Use the imported abandonGame method with non-null assertion
        const result = await abandonGame!(currentGame.value.id, authStore.currentUser!.id)
        
        if (result.success) {
            // Add notification
            // TODO Translate
            toast.addMessage({
                type: 'warning',
                message: 'You have abandoned the game. Your opponent has been awarded the win.'
            })
            
            // Navigate to analytics page
            navigateTo(`/game/${currentGame.value.id}/analytics`)
        } else {
            throw new Error('Failed to abandon game')
        }
    } catch (error) {
        console.error('Error abandoning game:', error)
        // TODO Translate
        toast.addMessage({
            type: 'error',
            message: 'Failed to abandon the game. Please try again.'
        })
    } finally {
        isLoading.value = false
    }
}

const copyGameCode = () => {
    if (currentGame.value?.gameCode) {
        navigator.clipboard.writeText(currentGame.value.gameCode)
        toast.addMessage({ 
            type: 'success', 
            message: 'Game code copied to clipboard'
        })
    }
}

// Save game session whenever the game state changes
watch(() => currentGame.value?.status, (newStatus) => {
    if (currentGame.value && gameId.value) {
        saveGameSession()
    }
})

// Initialize session management
onMounted(() => {
    // Save session when navigating away
    window.addEventListener('beforeunload', () => {
        if (currentGame.value && gameId.value) {
            saveGameSession()
        }
    })
})
</script>
