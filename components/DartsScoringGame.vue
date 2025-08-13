<template>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <!-- Scoreboard (Left Side) -->
        <div class="bg-white rounded-lg shadow-md p-4 md:p-6">
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
                                            <span>Turn {{ turn.turnNumber }}: {{ turn.score }} pts</span>
                                            <span v-if="turn.throws.some(t => t.isBust)" class="ml-2 text-red-600 font-bold text-xs">(BUST)</span>
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
                        <div class="grid grid-cols-3 gap-4 mb-2 h-14">
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
                        <div class="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
                            <button
                                v-for="n in 20"
                                :key="n"
                                @click="addThrow(n, selectedMultiplier as 'single' | 'double' | 'triple')"
                                class="p-3 bg-gray-200 hover:bg-gray-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed text-lg font-medium touch-manipulation"
                                style="min-height: 48px;"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                {{ n }}
                            </button>
                        </div>
                        
                        <!-- Bull and Special Throws -->
                        <div class="grid grid-cols-3 gap-2 mb-4">
                            <button
                                @click="addThrow(25, 'single')"
                                class="p-3 bg-yellow-200 hover:bg-yellow-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
                                style="min-height: 48px;"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                <!-- TODO Translate -->
                                25
                            </button>
                            <button
                                @click="addThrow(25, 'double')"
                                class="p-3 bg-red-200 hover:bg-red-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
                                style="min-height: 48px;"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                <!-- TODO Translate -->
                                Bull
                            </button>
                            <button
                                @click="addThrow(0, 'single')"
                                class="p-3 bg-gray-200 hover:bg-gray-300 text-center rounded disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
                                style="min-height: 48px;"
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
                            class="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium touch-manipulation"
                            style="min-height: 52px;"
                        >
                            <!-- TODO Translate -->
                            Undo
                        </button>
                        <button
                            @click="submitIndividualThrows"
                            :disabled="currentThrows.length === 0 || isLoading"
                            class="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium touch-manipulation"
                            style="min-height: 52px;"
                        >
                            <!-- TODO Translate -->
                            {{ isLoading ? 'Submitting...' : (currentThrows.length === 3 ? 'Submit Turn' : 'Submit') }}
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

    <!-- Game Transition Modal -->
    <GameTransitionModal
        :show="showTransitionModal"
        :is-game-win="isGameWin"
        :is-set-win="isSetWin"
        :leg-number="completedLegNumber || currentGame?.currentLeg || 1"
        :set-number="completedSetNumber || currentGame?.currentSet || 1"
        :winner-id="legWinner || currentGame?.winner || ''"
        :players="currentGame?.players || []"
        :tournament-id="tournamentId"
        @close="handleTransitionModalClose"
    />

    <!-- Forfeit Win Modal -->
    <ForfeitWinModal
        :show="showForfeitWinModal"
        :winner-id="forfeitWinnerId || ''"
        :abandoned-by="forfeitAbandonedBy || ''"
        :players="currentGame?.players || []"
        @close="handleForfeitModalClose"
    />
</template>

<script setup lang="ts">
import { useDartsScoring } from '~/composables/useDartsScoring'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import type { DartThrow } from '~/stores/game'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

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

// Get tournament ID from current game
const tournamentId = computed(() => {
    return currentGame.value?.tournamentId || undefined
})

// Local state
const inputMethod = ref<'total' | 'individual'>('individual')
const totalScoreInput = ref<number>(0)
const selectedMultiplier = ref<string>('single')
const isLoading = ref(false)
const expandedHistory = ref<Record<string, boolean>>({})

// Transition modal state
const showTransitionModal = ref(false)
const isGameWin = ref(false)
const isSetWin = ref(false)
const legWinner = ref<string | null>(null)
const completedLegNumber = ref<number | null>(null)
const completedSetNumber = ref<number | null>(null)
const router = useRouter()

// Forfeit win modal state
const showForfeitWinModal = ref(false)
const forfeitWinnerId = ref<string | null>(null)
const forfeitAbandonedBy = ref<string | null>(null)

// Import modal components
import GameTransitionModal from '~/components/modals/GameTransitionModal.vue'
import ForfeitWinModal from '~/components/modals/ForfeitWinModal.vue'

// Reactive state from composables
const { 
    currentThrows, 
    totalScore, 
    addThrow, 
    removeLastThrow, 
    clearThrows,
    isValidScore,
    isBustScore,
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
            // Check for immediate leg win
            setTimeout(() => checkForLegWin(), 100)
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
            message: 'Invalid score' 
        })
        return
    }
    
    // Check if this is a bust situation
    const isBust = isBustScore(throwsTotal, remainingScore.value, currentThrows.value)
    let throwsToSubmit = [...currentThrows.value]
    
    if (isBust) {
        // For bust situations, we submit the throws but with a total score of 0
        // This records the attempt but doesn't change the player's score
        throwsToSubmit = currentThrows.value.map((dart, index) => ({
            ...dart,
            // Mark the turn as a bust by setting all dart scores to 0
            // but keep the original throw values for recording purposes
            score: 0,
            isBust: true
        }))
        
        // Show bust message
        toast.addMessage({ 
            type: 'warning', 
            message: 'Bust! Turn ends with no score change.' 
        })
    }
    
    try {
        isLoading.value = true
        
        if (recordThrow) {
            await recordThrow(throwsToSubmit)
            clearThrows()
            // Check for immediate leg win (only if not bust)
            if (!isBust) {
                setTimeout(() => checkForLegWin(), 100)
            }
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

// Transition modal handler
const handleTransitionModalClose = () => {
    // Always just reset state - let the modal handle navigation for game wins
    resetLegWinner()
}

// Forfeit modal handler
const handleForfeitModalClose = () => {
    console.log('🏆 Closing forfeit win modal')
    showForfeitWinModal.value = false
    forfeitWinnerId.value = null
    forfeitAbandonedBy.value = null
}

// Reset leg winner when modal closes or new leg starts
const resetLegWinner = () => {
    console.log('🔄 Resetting leg winner state - previous state:', {
        legWinner: legWinner.value,
        isGameWin: isGameWin.value,
        isSetWin: isSetWin.value,
        showModal: showTransitionModal.value
    })
    legWinner.value = null
    isGameWin.value = false
    isSetWin.value = false
    showTransitionModal.value = false
    completedLegNumber.value = null
    completedSetNumber.value = null
}

// Watch for leg changes to reset the winner state
watch(() => currentGame.value?.currentLeg, (newLeg, oldLeg) => {
    if (newLeg && oldLeg && newLeg !== oldLeg) {
        console.log('Leg changed from', oldLeg, 'to', newLeg, '- resetting winner state')
        // Small delay to allow the transition modal to show first
        setTimeout(() => {
            if (!showTransitionModal.value) {
                resetLegWinner()
            }
        }, 100)
    }
})

// Track previous leg and set values to detect changes
const previousLeg = ref<number | null>(null)
const previousSet = ref<number | null>(null)
const previousStatus = ref<string | null>(null)

// Watch for leg/game win conditions
watch([
    () => currentGame.value?.currentLeg,
    () => currentGame.value?.currentSet,
    () => currentGame.value?.status,
    () => currentGame.value?.winner
], ([newLeg, newSet, newStatus, newWinner], [oldLeg, oldSet, oldStatus, oldWinner]) => {
    console.log('🎮 Game state change detected:', {
        leg: { old: oldLeg, new: newLeg },
        set: { old: oldSet, new: newSet },
        status: { old: oldStatus, new: newStatus },
        winner: { old: oldWinner, new: newWinner },
        modalAlreadyShowing: showTransitionModal.value
    })

    // First initialization - just store values
    if (previousLeg.value === null && currentGame.value) {
        previousLeg.value = currentGame.value.currentLeg || 1
        previousSet.value = currentGame.value.currentSet || 1
        previousStatus.value = currentGame.value.status
        console.log('Initial game state stored:', { leg: previousLeg.value, set: previousSet.value })
        return
    }
    
    // Game finished with a winner
    if (newStatus === 'finished' && newWinner) {
        console.log('🏆 GAME FINISHED - Triggering game win modal:', newWinner)
        legWinner.value = newWinner
        isGameWin.value = true
        isSetWin.value = false
        showTransitionModal.value = true
        console.log('Modal state set:', { show: showTransitionModal.value, gameWin: isGameWin.value, winner: legWinner.value })
        return
    }
    
    // Leg change (leg increment means a leg was won)
    if (newLeg && previousLeg.value !== null && newLeg > previousLeg.value) {
        console.log('Leg won detected:', { previous: previousLeg.value, current: newLeg })
        
        // Store which leg was just completed
        completedLegNumber.value = previousLeg.value
        
        // Find the player with the most legs in this set
        let playerWithMostLegs = null
        if (currentGame.value?.players && currentGame.value.players.length > 0) {
            playerWithMostLegs = [...currentGame.value.players].sort((a, b) => b.legs - a.legs)[0]
            console.log('Player with most legs:', playerWithMostLegs?.name, 'legs:', playerWithMostLegs?.legs)
        }
        
        if (playerWithMostLegs && !showTransitionModal.value) {
            console.log('Triggering leg transition modal for:', playerWithMostLegs.name, 'completed leg:', completedLegNumber.value)
            legWinner.value = playerWithMostLegs.id
            isGameWin.value = false
            showTransitionModal.value = true
        }
    }
    
    // Set change (set increment means a set was won)
    if (newSet && previousSet.value && newSet > previousSet.value) {
        console.log('🎯 SET WON detected:', { previous: previousSet.value, current: newSet })
        
        // Store which set was just completed
        completedSetNumber.value = previousSet.value
        
        // Find the player with the most sets
        let playerWithMostSets = null
        if (currentGame.value?.players && currentGame.value.players.length > 0) {
            playerWithMostSets = [...currentGame.value.players].sort((a, b) => b.sets - a.sets)[0]
            console.log('Player with most sets:', playerWithMostSets?.name, 'sets:', playerWithMostSets?.sets)
        }
            
        if (playerWithMostSets && !showTransitionModal.value) {
            console.log('🎯 Triggering SET transition modal for:', playerWithMostSets.name, 'completed set:', completedSetNumber.value)
            legWinner.value = playerWithMostSets.id
            isGameWin.value = false
            isSetWin.value = true
            showTransitionModal.value = true
            console.log('SET Modal state set:', { show: showTransitionModal.value, setWin: isSetWin.value, winner: legWinner.value })
        }
    }
    
    // Update previous values
    if (currentGame.value) {
        previousLeg.value = currentGame.value.currentLeg || 1
        previousSet.value = currentGame.value.currentSet || 1
        previousStatus.value = currentGame.value.status
    }
})

// Also watch for direct player checkout (when score reaches exactly 0)
// This helps catch leg wins even if the Firestore data hasn't been updated yet
watch(() => currentGame.value?.players, (newPlayers, oldPlayers) => {
    // Skip if modal is already showing or no players
    if (showTransitionModal.value || !newPlayers || isGameWin.value) return
    
    console.log('Players updated:', newPlayers?.map(p => ({ name: p.name, score: p.currentScore, legs: p.legs })))
    
    const playerWithZeroScore = newPlayers.find(player => player.currentScore === 0)
    if (playerWithZeroScore) {
        console.log('Direct checkout detected:', playerWithZeroScore.name)
        
        // Check if this is a new zero score (compare with old players)
        const oldPlayer = oldPlayers?.find(p => p.id === playerWithZeroScore.id)
        const isNewCheckout = !oldPlayer || oldPlayer.currentScore > 0
        
        // Also check if legs count increased for this player
        const legsIncreased = oldPlayer && playerWithZeroScore.legs > oldPlayer.legs
        
        if ((isNewCheckout || legsIncreased) && !legWinner.value) {
            // The completed leg is the one they just won (their current legs count)
            const justCompletedLeg = playerWithZeroScore.legs
            console.log('Triggering leg win modal for:', playerWithZeroScore.name, 'completed leg:', justCompletedLeg)
            legWinner.value = playerWithZeroScore.id
            isGameWin.value = false
            completedLegNumber.value = justCompletedLeg
            showTransitionModal.value = true
        }
    }
}, { deep: true })

// Enhanced leg win detection - trigger modal immediately when any player reaches 0
const checkForLegWin = () => {
    if (!currentGame.value?.players || showTransitionModal.value) return
    
    const winningPlayer = currentGame.value.players.find(player => player.currentScore === 0)
    if (winningPlayer && !legWinner.value) {
        console.log('Immediate leg win detected for:', winningPlayer.name, 'current leg:', currentGame.value?.currentLeg)
        legWinner.value = winningPlayer.id
        isGameWin.value = false
        completedLegNumber.value = currentGame.value?.currentLeg || 1
        showTransitionModal.value = true
    }
}

// Also watch for game data changes to detect immediate wins
watch(() => currentGame.value, (newGame) => {
    if (newGame) {
        checkForLegWin()
    }
}, { deep: true })

// Aggressive leg win detection - check every time game state changes
watch(() => currentGame.value, () => {
    if (!currentGame.value || showTransitionModal.value) return
    
    // Use a small delay to let all updates settle
    setTimeout(() => {
        if (!showTransitionModal.value) {
            checkForLegWin()
        }
    }, 200)
}, { deep: true })

// Debug function to manually trigger modal (development only)
const triggerDebugModal = () => {
    if (currentGame.value?.players && currentGame.value.players.length > 0) {
        console.log('Manually triggering debug modal')
        legWinner.value = currentGame.value.players[0].id
        isGameWin.value = false
        completedLegNumber.value = currentGame.value.currentLeg || 1
        showTransitionModal.value = true
    }
}

// Watchers
watch(() => props.gameId, (newGameId) => {
    if (newGameId) {
        clearThrows()
        totalScoreInput.value = 0
    }
})

// Watch for game abandonment to show forfeit win modal
watch(() => currentGame.value?.abandonedBy, (abandonedBy, previousAbandonedBy) => {
    if (!abandonedBy || previousAbandonedBy === abandonedBy) return
    
    const authStore = useAuthStore()
    const currentUserId = authStore.currentUser?.id
    
    if (!currentUserId || !currentGame.value) return
    
    // Only show forfeit modal if the current user is NOT the one who abandoned
    // and there are exactly 2 players (multiplayer game)
    if (abandonedBy !== currentUserId && currentGame.value.players?.length === 2) {
        console.log('🏆 Opponent abandoned game, showing forfeit win modal', {
            abandonedBy,
            currentUserId,
            players: currentGame.value.players?.map(p => ({ id: p.id, name: p.name }))
        })
        
        // Find the winner (the player who didn't abandon)
        const winner = currentGame.value.players.find(p => p.id !== abandonedBy)
        
        if (winner) {
            forfeitWinnerId.value = winner.id
            forfeitAbandonedBy.value = abandonedBy
            showForfeitWinModal.value = true
        }
    }
})

// Watch for changes in players' legs count to detect leg wins
watch(() => currentGame.value?.players?.map(p => ({ id: p.id, legs: p.legs })), (newLegsData, oldLegsData) => {
    if (!newLegsData || !oldLegsData || showTransitionModal.value) return
    
    // Find player whose legs count increased
    for (let i = 0; i < newLegsData.length; i++) {
        const newPlayerData = newLegsData[i]
        const oldPlayerData = oldLegsData.find(p => p.id === newPlayerData.id)
        
        if (oldPlayerData && newPlayerData.legs > oldPlayerData.legs) {
            // This player just won a leg!
            const winningPlayer = currentGame.value?.players.find(p => p.id === newPlayerData.id)
            if (winningPlayer && !legWinner.value) {
                console.log('Leg win detected via legs count change:', winningPlayer.name, 'won leg', newPlayerData.legs)
                legWinner.value = winningPlayer.id
                isGameWin.value = false
                isSetWin.value = false // This is a leg win, not a set win
                completedLegNumber.value = newPlayerData.legs // The leg number they just completed
                showTransitionModal.value = true
                break
            }
        }
    }
}, { deep: true })

// Watch for changes in players' sets count to detect set wins
watch(() => currentGame.value?.players?.map(p => ({ id: p.id, sets: p.sets })), (newSetsData, oldSetsData) => {
    if (!newSetsData || !oldSetsData || showTransitionModal.value) return
    
    // Find player whose sets count increased
    for (let i = 0; i < newSetsData.length; i++) {
        const newPlayerData = newSetsData[i]
        const oldPlayerData = oldSetsData.find(p => p.id === newPlayerData.id)
        
        if (oldPlayerData && newPlayerData.sets > oldPlayerData.sets) {
            // This player just won a set!
            const winningPlayer = currentGame.value?.players.find(p => p.id === newPlayerData.id)
            if (winningPlayer && !legWinner.value) {
                console.log('Set win detected via sets count change:', winningPlayer.name, 'won set', newPlayerData.sets)
                legWinner.value = winningPlayer.id
                isGameWin.value = false
                isSetWin.value = true
                completedSetNumber.value = newPlayerData.sets // The set number they just completed
                showTransitionModal.value = true
                break
            }
        }
    }
}, { deep: true })
</script>
