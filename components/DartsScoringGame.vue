<template>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Scoreboard (Left Side) -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <!-- TODO Translate -->
            <h3 class="text-lg font-semibold mb-4">Scoreboard</h3>
            
            <div v-if="currentGame" class="space-y-4">
                <!-- Current Turn Info -->
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div class="text-center">
                        <!-- TODO Translate -->
                        <div class="text-sm text-gray-600">Current Player</div>
                        <div class="font-bold text-lg">{{ currentPlayer?.name || 'Unknown' }}</div>
                        <div class="text-xs text-gray-500">Set {{ currentGame.currentSet }} • Leg {{ currentGame.currentLeg }}</div>
                    </div>
                </div>
                
                <!-- Players Scores -->
                <div class="space-y-3">
                    <div 
                        v-for="player in currentGame.players" 
                        :key="player.id"
                        :class="[
                            'p-4 rounded-lg border-2 transition-all',
                            player.id === currentPlayer?.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 bg-gray-50'
                        ]"
                    >
                        <div class="flex justify-between items-center mb-2">
                            <div class="font-medium">{{ player.name }}</div>
                            <div class="text-xs px-2 py-1 bg-gray-200 rounded">
                                <!-- TODO Translate -->
                                {{ player.id === currentGame.hostId ? 'Host' : 'Player' }}
                            </div>
                        </div>
                        
                        <!-- Current Score -->
                        <div class="text-center mb-3">
                            <div class="text-2xl font-bold" :class="player.currentScore <= 170 ? 'text-green-600' : 'text-gray-900'">
                                {{ player.currentScore }}
                            </div>
                            <div class="text-xs text-gray-500">
                                <!-- TODO Translate -->
                                Remaining
                            </div>
                        </div>
                        
                        <!-- Sets and Legs -->
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div class="text-center">
                                <div class="font-medium">{{ player.sets }}</div>
                                <!-- TODO Translate -->
                                <div class="text-xs text-gray-500">Sets</div>
                            </div>
                            <div class="text-center">
                                <div class="font-medium">{{ player.legs }}</div>
                                <!-- TODO Translate -->
                                <div class="text-xs text-gray-500">Legs</div>
                            </div>
                        </div>
                        
                        <!-- Stats -->
                        <div class="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                            <div class="text-center">
                                <div class="font-medium text-gray-700">{{ player.averagePerTurn.toFixed(1) }}</div>
                                <!-- TODO Translate -->
                                <div>Avg</div>
                            </div>
                            <div class="text-center">
                                <div class="font-medium text-gray-700">{{ player.totalTurns }}</div>
                                <!-- TODO Translate -->
                                <div>Turns</div>
                            </div>
                            <div class="text-center">
                                <div class="font-medium text-gray-700">{{ player.checkoutPercentage.toFixed(0) }}%</div>
                                <!-- TODO Translate -->
                                <div>Checkout</div>
                            </div>
                        </div>
                        
                        <!-- Shot History -->
                        <div class="mt-3 pt-3 border-t border-gray-200" v-if="getPlayerTurns(player.id).length > 0">
                            <div class="flex justify-between items-center mb-2">
                                <div class="text-xs font-medium text-gray-600">
                                    <!-- TODO Translate -->
                                    Recent Turns
                                </div>
                                <button
                                    @click="toggleShotHistory(player.id)"
                                    class="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    {{ expandedHistory[player.id] ? 'Hide' : 'Show All' }}
                                </button>
                            </div>
                            <div class="space-y-1">
                                <div 
                                    v-for="(turn, index) in getDisplayedTurns(player.id)" 
                                    :key="turn.turnNumber"
                                    class="text-xs bg-gray-50 p-2 rounded"
                                >
                                    <div class="flex justify-between items-center">
                                        <div class="font-medium">
                                            Turn {{ turn.turnNumber }}: {{ turn.score }} pts
                                        </div>
                                        <div class="text-gray-500">
                                            → {{ turn.remainingScore }}
                                        </div>
                                    </div>
                                    <div class="mt-1 text-gray-600" v-if="turn.throws.length > 0">
                                        {{ formatTurnThrows(turn.throws) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Input Panel (Right Side) -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold">
                        {{ isCurrentUserPlaying ? 'Score Input' : 'Game in Progress' }}
                    </h3>
                    
                    <div 
                        v-if="currentGame && remainingScore <= 170" 
                        class="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                    >
                        <!-- TODO Translate -->
                        Checkout Range!
                    </div>
                </div>
                
                <!-- Turn Restriction Notice -->
                <div v-if="!isCurrentPlayerTurn && isCurrentUserPlaying" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
                    <!-- TODO Translate -->
                    <p>It's not your turn. Wait for {{ currentPlayer?.name || 'the other player' }} to complete their turn.</p>
                </div>
                
                <!-- Current Turn Progress -->
                <div v-if="isCurrentPlayerTurn && currentGame" class="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
                    <!-- TODO Translate -->
                    <div class="flex justify-between items-center">
                        <span>Your Turn - Throws: {{ currentGame.currentTurnThrows || 0 }}/3</span>
                        <span class="text-sm">
                            {{ 3 - (currentGame.currentTurnThrows || 0) }} throws remaining
                        </span>
                    </div>
                </div>
                
                <!-- Spectator Notice -->
                <div v-if="!isCurrentUserPlaying" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
                    <!-- TODO Translate -->
                    <p>You are spectating this game. Only players can submit scores.</p>
                </div>
                
                <!-- Input Method Toggle (only for current player) -->
                <div v-if="isCurrentPlayerTurn" class="flex space-x-4 mb-4">
                    <button
                        @click="inputMethod = 'total'"
                        :class="[
                            'px-4 py-2 rounded-md font-medium',
                            inputMethod === 'total'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        ]"
                    >
                        <!-- TODO Translate -->
                        Total Score
                    </button>
                    <button
                        @click="inputMethod = 'individual'"
                        :class="[
                            'px-4 py-2 rounded-md font-medium',
                            inputMethod === 'individual'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        ]"
                    >
                        <!-- TODO Translate -->
                        Individual Throws
                    </button>
                </div>

                <!-- Total Score Input -->
                <div v-if="inputMethod === 'total' && isCurrentPlayerTurn" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <!-- TODO Translate -->
                            Total Score for Turn
                        </label>
                        <input
                            v-model.number="totalScoreInput"
                            type="number"
                            min="0"
                            :max="remainingScore"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter total score"
                        />
                    </div>
                    <button
                        @click="submitTotalScore"
                        :disabled="!isValidTotalScore || isLoading"
                        class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <!-- TODO Translate -->
                        {{ isLoading ? 'Submitting...' : 'Submit Score' }}
                    </button>
                </div>

                <!-- Individual Throws Input -->
                <div v-if="inputMethod === 'individual' && isCurrentPlayerTurn" class="space-y-4">
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="grid grid-cols-3 gap-4 mb-2">
                            <div v-for="(dartThrow, index) in currentThrows" :key="index" class="bg-white p-2 border border-gray-200 rounded text-center">
                                <div class="font-bold">{{ formatThrow(dartThrow) }}</div>
                                <div class="text-xs text-gray-500">{{ dartThrow.score }} points</div>
                            </div>
                            <div v-for="i in (remainingThrowsInTurn)" :key="`empty-${i}`" class="bg-gray-100 p-2 border border-dashed border-gray-200 rounded text-center">
                                <div class="text-gray-400 text-sm">
                                    <!-- TODO Translate -->
                                    Throw {{ (currentGame?.currentTurnThrows || 0) + currentThrows.length + i }}
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-right text-sm">
                            <!-- TODO Translate -->
                            Total: <span class="font-bold">{{ totalScore }}</span>
                            <span class="text-gray-500 ml-2">
                                ({{ remainingThrowsInTurn }} throws left)
                            </span>
                        </div>
                    </div>
                    
                    <!-- Dart board or number selection UI -->
                    <div class="mb-4">
                        <!-- TODO Translate -->
                        <h4 class="text-sm font-medium text-gray-700 mb-2">Select Your Throw</h4>
                        
                        <!-- Multiplier Selection -->
                        <div class="flex space-x-2 mb-4">
                            <button
                                v-for="multiplier in ['single', 'double', 'triple']"
                                :key="multiplier"
                                @click="selectedMultiplier = multiplier"
                                :class="[
                                    'flex-1 py-2 rounded-md text-center',
                                    selectedMultiplier === multiplier
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                ]"
                            >
                                {{ multiplier.charAt(0).toUpperCase() + multiplier.slice(1) }}
                            </button>
                        </div>
                        
                        <!-- Number Selection - Grid -->
                        <div class="grid grid-cols-5 gap-2 mb-4">
                            <button
                                v-for="n in 20"
                                :key="n"
                                @click="addThrow(n, selectedMultiplier as 'single' | 'double' | 'triple')"
                                class="p-2 bg-gray-200 hover:bg-gray-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                {{ n }}
                            </button>
                        </div>
                        
                        <!-- Bull and Special Throws -->
                        <div class="grid grid-cols-3 gap-2 mb-4">
                            <button
                                @click="addThrow(25, 'single')"
                                class="p-2 bg-yellow-200 hover:bg-yellow-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                <!-- TODO Translate -->
                                Outer Bull (25)
                            </button>
                            <button
                                @click="addThrow(25, 'double')"
                                class="p-2 bg-red-200 hover:bg-red-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                <!-- TODO Translate -->
                                Inner Bull (50)
                            </button>
                            <button
                                @click="addThrow(0, 'single')"
                                class="p-2 bg-gray-200 hover:bg-gray-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                <!-- TODO Translate -->
                                Miss
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button
                            @click="removeLastThrow"
                            :disabled="currentThrows.length === 0"
                            class="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <!-- TODO Translate -->
                            Undo
                        </button>
                        <button
                            @click="submitIndividualThrows"
                            :disabled="currentThrows.length === 0 || isLoading"
                            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <!-- TODO Translate -->
                            {{ isLoading ? 'Submitting...' : (currentThrows.length === 3 ? 'Submit Turn' : 'Submit Partial Turn') }}
                        </button>
                    </div>
                </div>
                
                <!-- Checkout suggestions -->
                <div v-if="remainingScore <= 170 && isCurrentPlayerTurn" class="mt-4">
                    <!-- TODO Translate -->
                    <h4 class="text-md font-medium mb-2">Checkout Suggestions</h4>
                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div v-if="checkoutSuggestions.length === 0" class="text-gray-500 text-sm">
                            <!-- TODO Translate -->
                            No checkout suggestions available
                        </div>
                        <ul v-else>
                            <li v-for="(suggestion, index) in checkoutSuggestions" :key="index" class="mb-2 last:mb-0">
                                <div class="flex space-x-2">
                                    <span 
                                        v-for="(dart, i) in suggestion" 
                                        :key="i"
                                        class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                    >
                                        {{ dart }}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Top 5 scoring options if not in checkout range -->
                <div v-else-if="remainingScore > 170 && isCurrentPlayerTurn" class="mt-4">
                    <!-- TODO Translate -->
                    <h4 class="text-md font-medium mb-2">Best Scoring Options</h4>
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div class="grid grid-cols-5 gap-2">
                            <div 
                                v-for="option in bestScoringOptions" 
                                :key="`${option.multiplier}-${option.value}`"
                                class="p-2 bg-white border border-gray-200 rounded text-center"
                            >
                                <div class="font-medium text-sm">{{ option.label }}</div>
                                <div class="text-xs text-gray-500">{{ option.score }} points</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDartsScoring } from '~/composables/useDartsScoring'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import type { DartThrow } from '~/stores/game'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'

// Props
const props = defineProps({
    gameId: {
        type: String,
        default: null
    }
})

// Services
const dartsScoring = useDartsScoring()
const { 
    currentGame, 
    currentPlayer, 
    isCurrentUserPlaying,
    recordThrow,
    isLoading: isGameLoading,
    turns
} = useFirebaseDartsGame()
const toast = useNotificationStore()
const authStore = useAuthStore()

// Local state
const inputMethod = ref<'total' | 'individual'>('individual')
const totalScoreInput = ref<number>(0)
const selectedMultiplier = ref<string>('single')
const isLoading = ref(false)
const expandedHistory = ref<Record<string, boolean>>({})

// Reactive state from composables
const { 
    currentThrows, 
    totalScore, 
    addThrow, 
    removeLastThrow, 
    clearThrows,
    isValidScore,
    getBestScoringOptions,
    getCheckoutSuggestions
} = dartsScoring

// Computed properties
const remainingScore = computed(() => {
    return currentPlayer.value?.currentScore || 0
})

const remainingThrowsInTurn = computed(() => {
    const currentTurnThrows = currentGame.value?.currentTurnThrows || 0
    const pendingThrows = currentThrows.value.length
    return Math.max(0, 3 - currentTurnThrows - pendingThrows)
})

const isValidTotalScore = computed(() => {
    return isValidScore(totalScoreInput.value, remainingScore.value)
})

const checkoutSuggestions = computed(() => {
    return getCheckoutSuggestions(remainingScore.value)
})

const bestScoringOptions = computed(() => {
    return getBestScoringOptions(remainingScore.value)
})

const isCurrentPlayerTurn = computed(() => {
    if (!currentGame.value || !currentPlayer.value || !authStore.currentUser) return false
    return currentPlayer.value.id === authStore.currentUser.id
})

const isUserAllowedToScore = computed(() => {
    // Only the current player can score (removed host override for fair play)
    return isCurrentPlayerTurn.value
})

// Methods
const formatThrow = (dartThrow: DartThrow) => {
    if (dartThrow.value === 0) return 'Miss'
    if (dartThrow.value === 25 && dartThrow.multiplier === 'single') return 'Outer Bull'
    if (dartThrow.value === 25 && dartThrow.multiplier === 'double') return 'Inner Bull'
    
    const prefix = 
        dartThrow.multiplier === 'single' ? 'S' : 
        dartThrow.multiplier === 'double' ? 'D' : 'T'
    
    return `${prefix}${dartThrow.value}`
}

const submitTotalScore = async () => {
    if (!isCurrentPlayerTurn.value) {
        toast.addMessage({ 
            type: 'error', 
            message: 'Not your turn' 
        })
        return
    }
    
    if (!isValidTotalScore.value) {
        toast.addMessage({ 
            type: 'error', 
            message: 'Invalid score' 
        })
        return
    }
    
    try {
        isLoading.value = true
        
        // Create three generic throws that add up to the total
        const score = totalScoreInput.value
        const throws: DartThrow[] = []
        
        // For simplicity, we'll create generic throws to represent the total
        // This could be improved with more accurate throw representation
        throws.push({
            value: Math.min(20, Math.floor(score / 3)),
            multiplier: 'single',
            score: Math.min(20, Math.floor(score / 3)),
            timestamp: new Date().toISOString()
        })
        
        throws.push({
            value: Math.min(20, Math.floor(score / 3)),
            multiplier: 'single',
            score: Math.min(20, Math.floor(score / 3)),
            timestamp: new Date().toISOString()
        })
        
        const remaining = score - throws[0].score - throws[1].score
        throws.push({
            value: Math.min(20, remaining),
            multiplier: 'single',
            score: Math.min(20, remaining),
            timestamp: new Date().toISOString()
        })
        
        if (recordThrow) {
            await recordThrow(throws)
            totalScoreInput.value = 0
        } else {
            throw new Error('Record throw function is not available')
        }
    } catch (err: any) {
        toast.addMessage({ 
            type: 'error', 
            message: err.message || 'Failed to submit score' 
        })
    } finally {
        isLoading.value = false
    }
}

const submitIndividualThrows = async () => {
    if (!isCurrentPlayerTurn.value) {
        toast.addMessage({ 
            type: 'error', 
            message: 'Not your turn' 
        })
        return
    }
    
    if (currentThrows.value.length === 0) {
        toast.addMessage({ 
            type: 'error', 
            message: 'No throws to submit' 
        })
        return
    }
    
    // Check if the score is valid for the current player's remaining score
    const throwsTotal = currentThrows.value.reduce((sum, t) => sum + t.score, 0)
    if (!isValidScore(throwsTotal, remainingScore.value)) {
        toast.addMessage({ 
            type: 'error', 
            message: 'Invalid score for current situation' 
        })
        return
    }
    
    try {
        isLoading.value = true
        
        if (recordThrow) {
            await recordThrow([...currentThrows.value])
            clearThrows()
        } else {
            throw new Error('Record throw function is not available')
        }
    } catch (err: any) {
        toast.addMessage({ 
            type: 'error', 
            message: err.message || 'Failed to submit throws' 
        })
    } finally {
        isLoading.value = false
    }
}

// Shot history functions
const getPlayerTurns = (playerId: string) => {
    if (!turns.value) return []
    return turns.value
        .filter(turn => turn.playerId === playerId)
        .sort((a, b) => b.turnNumber - a.turnNumber) // Most recent first
}

const getDisplayedTurns = (playerId: string) => {
    const playerTurns = getPlayerTurns(playerId)
    if (expandedHistory.value[playerId]) {
        return playerTurns
    }
    return playerTurns.slice(0, 3) // Show only last 3 turns by default
}

const toggleShotHistory = (playerId: string) => {
    expandedHistory.value[playerId] = !expandedHistory.value[playerId]
}

const formatTurnThrows = (throws: DartThrow[]) => {
    if (!throws || throws.length === 0) return 'No throws recorded'
    return throws.map(dartThrow => formatThrow(dartThrow)).join(', ')
}

// Watchers
watch(() => props.gameId, (newGameId) => {
    if (newGameId) {
        clearThrows()
        totalScoreInput.value = 0
    }
})
</script>
