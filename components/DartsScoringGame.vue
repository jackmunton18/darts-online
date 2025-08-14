<template>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <!-- Scoreboard (Left Side) -->
        <div class="rounded-lg shadow-md p-4 md:p-6" style="background-color: var(--bg-primary); color: var(--text-primary)">
            <!-- TODO Translate -->
            <h3 class="text-lg font-semibold mb-4" style="color: var(--text-accent)">Scoreboard</h3>
            
            <div v-if="currentGame" class="space-y-4">
                <!-- Current Turn Info -->
                <div class="p-3 rounded-lg border" style="background-color: var(--bg-accent-primary); border-color: var(--border-accent)">
                    <div class="text-center">
                        <!-- TODO Translate -->
                        <div class="text-sm" style="color: var(--text-accent)">Current Player</div>
                        <div class="font-bold text-lg" style="color: var(--text-primary)">{{ currentPlayer?.name || 'Unknown' }}</div>
                        <div class="text-xs" style="color: var(--text-accent-light)">Set {{ currentGame.currentSet }} • Leg {{ currentGame.currentLeg }}</div>
                    </div>
                </div>
                
                <!-- Players Scores -->
                <div class="space-y-3">
                    <div 
                        v-for="player in currentGame.players" 
                        :key="player.id"
                        class="p-4 rounded-lg border-2 transition-all"
                        :style="[
                            player.id === currentPlayer?.id 
                                ? { borderColor: 'var(--border-accent)', backgroundColor: 'var(--bg-active)' } 
                                : { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }
                        ]"
                    >
                        <div class="flex justify-between items-center mb-2">
                            <div class="font-medium" style="color: var(--text-primary)">{{ player.name }}</div>
                            <div class="text-xs px-2 py-1 rounded" style="background-color: var(--bg-secondary); color: var(--text-accent)">
                                <!-- TODO Translate -->
                                {{ player.id === currentGame.hostId ? 'Host' : 'Player' }}
                            </div>
                        </div>
                        
                        <!-- Current Score -->
                        <div class="text-center mb-3">
                            <div class="text-2xl font-bold" :style="player.currentScore <= 170 ? 'color: var(--text-success)' : 'color: var(--text-primary)'">
                                {{ player.currentScore }}
                            </div>
                            <div class="text-xs" style="color: var(--text-secondary)">
                                <!-- TODO Translate -->
                                Remaining
                            </div>
                        </div>
                        
                        <!-- Sets and Legs -->
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div class="text-center">
                                <div class="font-medium" style="color: var(--text-primary)">{{ player.sets }}</div>
                                <!-- TODO Translate -->
                                <div class="text-xs" style="color: var(--text-secondary)">Sets</div>
                            </div>
                            <div class="text-center">
                                <div class="font-medium" style="color: var(--text-primary)">{{ player.legs }}</div>
                                <!-- TODO Translate -->
                                <div class="text-xs" style="color: var(--text-secondary)">Legs</div>
                            </div>
                        </div>
                        
                        <!-- Stats -->
                        <div class="grid grid-cols-3 gap-2 text-xs mt-2 pt-2 border-t" style="color: var(--text-secondary); border-color: var(--border-primary)">
                            <div class="text-center">
                                <div class="font-medium" style="color: var(--text-accent)">{{ player.averagePerTurn.toFixed(1) }}</div>
                                <!-- TODO Translate -->
                                <div>Avg</div>
                            </div>
                            <div class="text-center">
                                <div class="font-medium" style="color: var(--text-accent)">{{ player.totalTurns }}</div>
                                <!-- TODO Translate -->
                                <div>Turns</div>
                            </div>
                            <div class="text-center">
                                <div class="font-medium" style="color: var(--text-accent)">{{ player.checkoutPercentage.toFixed(0) }}%</div>
                                <!-- TODO Translate -->
                                <div>Checkout</div>
                            </div>
                        </div>
                        
                        <!-- Shot History -->
                        <div class="mt-3 pt-3 border-t" style="border-color: var(--border-primary)" v-if="getPlayerTurns(player.id).length > 0">
                            <div class="flex justify-between items-center mb-2">
                                <div class="text-xs font-medium" style="color: var(--text-secondary)">
                                    <!-- TODO Translate -->
                                    Recent Turns
                                </div>
                                <button
                                    @click="toggleShotHistory(player.id)"
                                    class="text-xs hover:text-blue-300"
                                    style="color: var(--text-accent)"
                                >
                                    {{ expandedHistory[player.id] ? 'Hide' : 'Show All' }}
                                </button>
                            </div>
                            <div class="space-y-1">
                                <div 
                                    v-for="(turn, index) in getDisplayedTurns(player.id)" 
                                    :key="turn.turnNumber"
                                    class="text-xs p-2 rounded"
                                    style="background-color: var(--bg-secondary)"
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
        <div class="rounded-lg shadow-md p-6" style="background-color: var(--bg-primary); color: var(--text-primary)">
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold" style="color: var(--text-accent)">
                        {{ isCurrentUserPlaying ? 'Score Input' : 'Game in Progress' }}
                    </h3>
                    
                    <div 
                        v-if="currentGame && remainingScore <= 170" 
                        class="text-sm px-3 py-1 rounded-full"
                        style="background-color: var(--bg-success-light); color: var(--text-success)"
                    >
                        <!-- TODO Translate -->
                        Checkout Range!
                    </div>
                </div>
                
                <!-- Turn Restriction Notice -->
                <div v-if="!isCurrentPlayerTurn && isCurrentUserPlaying" class="mb-4 p-3 rounded-lg border" style="background-color: var(--bg-warning-light); border-color: var(--border-warning); color: var(--text-warning)">
                    <!-- TODO Translate -->
                    <p>It's not your turn. Wait for {{ currentPlayer?.name || 'the other player' }} to complete their turn.</p>
                </div>
                
                <!-- Current Turn Progress -->
                <div v-if="isCurrentPlayerTurn && currentGame" class="mb-4 p-3 rounded-lg border" style="background-color: var(--bg-accent-primary); border-color: var(--border-accent); color: var(--text-accent-light)">
                    <!-- TODO Translate -->
                    <div class="flex justify-between items-center">
                        <span>Your Turn - Throws: {{ currentGame.currentTurnThrows || 0 }}/3</span>
                        <span class="text-sm">
                            {{ 3 - (currentGame.currentTurnThrows || 0) }} throws remaining
                        </span>
                    </div>
                </div>
                
                
                <!-- Spectator Notice -->
                <div v-if="!isCurrentUserPlaying" class="mb-4 p-3 rounded-lg border" style="background-color: var(--bg-warning-light); border-color: var(--border-warning); color: var(--text-warning)">
                    <!-- TODO Translate -->
                    <p>You are spectating this game. Only players can submit scores.</p>
                </div>
                
                <!-- Input Method Toggle (only for current player) -->
                <div v-if="isCurrentPlayerTurn" class="flex space-x-4 mb-4">
                    <button
                        @click="inputMethod = 'total'"
                        class="px-4 py-2 rounded-md font-medium toggle-button"
                        :class="{ 'active': inputMethod === 'total' }"
                    >
                        <!-- TODO Translate -->
                        Total Score
                    </button>
                    <button
                        @click="inputMethod = 'individual'"
                        class="px-4 py-2 rounded-md font-medium toggle-button"
                        :class="{ 'active': inputMethod === 'individual' }"
                    >
                        <!-- TODO Translate -->
                        Individual Throws
                    </button>
                </div>

                <!-- Total Score Input -->
                <div v-if="inputMethod === 'total' && isCurrentPlayerTurn" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-info)">
                            <!-- TODO Translate -->
                            Total Score for Turn
                        </label>
                        <input
                            v-model.number="totalScoreInput"
                            type="number"
                            min="0"
                            :max="remainingScore"
                            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--bg-input); color: var(--text-primary); border-color: var(--border-primary);"
                            placeholder="Enter total score"
                        />
                    </div>
                    <button
                        @click="submitTotalScore"
                        :disabled="!isValidTotalScore || isLoading"
                        class="w-full py-2 px-4 rounded-md score-submit-button"
                        :class="{ 'disabled': !isValidTotalScore || isLoading }"
                    >
                        <!-- TODO Translate -->
                        {{ isLoading ? 'Submitting...' : 'Submit Score' }}
                    </button>
                </div>

                <!-- Individual Throws Input -->
                <div v-if="inputMethod === 'individual' && isCurrentPlayerTurn" class="space-y-4">
                    <div class="bg-gray-700 p-3 rounded-lg">
                        <div class="grid grid-cols-3 gap-4 mb-2 h-14">
                            <div v-for="(dartThrow, index) in currentThrows" :key="index" class="bg-gray-600 p-2 border border-gray-500 rounded text-center">
                                <div class="font-bold text-white">{{ formatThrow(dartThrow) }}</div>
                                <div class="text-xs text-blue-200">{{ dartThrow.score }} points</div>
                            </div>
                            <div v-for="i in (remainingThrowsInTurn)" :key="`empty-${i}`" class="bg-gray-800 p-2 border border-dashed border-gray-600 rounded text-center">
                                <div class="text-gray-400 text-sm">
                                    <!-- TODO Translate -->
                                    Throw {{ (currentGame?.currentTurnThrows || 0) + currentThrows.length + i }}
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-right text-sm text-white">
                            <!-- TODO Translate -->
                            Total: <span class="font-bold text-blue-300">{{ totalScore }}</span>
                            <span class="text-gray-300 ml-2">
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
                                class="flex-1 py-2 rounded-md text-center multiplier-button"
                                :class="{ 'active': selectedMultiplier === multiplier }"
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
                                class="p-3 text-center rounded text-lg font-medium touch-manipulation number-grid-button"
                                :class="{ 'disabled': remainingThrowsInTurn <= 0 }"
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
                                class="p-3 text-center rounded text-sm sm:text-base touch-manipulation special-button bulls-outer"
                                :class="{ 'disabled': remainingThrowsInTurn <= 0 }"
                                style="min-height: 48px;"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                <!-- TODO Translate -->
                                25
                            </button>
                            <button
                                @click="addThrow(25, 'double')"
                                class="p-3 text-center rounded text-sm sm:text-base touch-manipulation special-button bulls-eye"
                                :class="{ 'disabled': remainingThrowsInTurn <= 0 }"
                                style="min-height: 48px;"
                                :disabled="remainingThrowsInTurn <= 0"
                            >
                                <!-- TODO Translate -->
                                Bull
                            </button>
                            <button
                                @click="addThrow(0, 'single')"
                                class="p-3 text-center rounded text-sm sm:text-base touch-manipulation special-button miss"
                                :class="{ 'disabled': remainingThrowsInTurn <= 0 }"
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
                            class="flex-1 py-3 px-4 rounded-md text-base font-medium touch-manipulation action-button warning"
                            :class="{ 'disabled': currentThrows.length === 0 }"
                            style="min-height: 52px;"
                        >
                            <!-- TODO Translate -->
                            Undo
                        </button>
                        <button
                            @click="submitIndividualThrows"
                            :disabled="currentThrows.length === 0 || isLoading"
                            class="flex-1 py-3 px-4 rounded-md text-base font-medium touch-manipulation action-button success"
                            :class="{ 'disabled': currentThrows.length === 0 || isLoading }"
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
                    <h4 class="text-md font-medium mb-2" style="color: var(--text-info)">Checkout Suggestions</h4>
                    <div class="p-3 rounded-lg border checkout-suggestions-container">
                        <div v-if="checkoutSuggestions.length === 0" class="text-sm" style="color: var(--text-secondary)">
                            <!-- TODO Translate -->
                            No checkout suggestions available
                        </div>
                        <ul v-else>
                            <li v-for="(suggestion, index) in checkoutSuggestions" :key="index" class="mb-2 last:mb-0">
                                <div class="flex space-x-2">
                                    <span 
                                        v-for="(dart, i) in suggestion" 
                                        :key="i"
                                        class="px-2 py-1 rounded text-sm checkout-suggestion-item"
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
                    <h4 class="text-md font-medium mb-2" style="color: var(--text-info)">Best Scoring Options</h4>
                    <div class="p-3 rounded-lg border scoring-options-container">
                        <div class="grid grid-cols-5 gap-2">
                            <div 
                                v-for="option in bestScoringOptions" 
                                :key="`${option.multiplier}-${option.value}`"
                                class="p-2 border rounded text-center scoring-option-item"
                            >
                                <div class="font-medium text-sm" style="color: var(--text-primary)">{{ option.label }}</div>
                                <div class="text-xs" style="color: var(--text-accent-light)">{{ option.score }} points</div>
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
    if (dartThrow.value === 25 && dartThrow.multiplier === 'double') return 'Bull'
    
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
        
        // More intelligently distribute the score across three darts
        let remainingScore = score
        
        // First dart - try to use highest possible score
        if (remainingScore >= 60) {
            // Triple 20
            throws.push({
                value: 20,
                multiplier: 'triple',
                score: 60,
                timestamp: new Date().toISOString()
            })
            remainingScore -= 60
        } else if (remainingScore >= 50) {
            // Bullseye
            throws.push({
                value: 25,
                multiplier: 'double',
                score: 50,
                timestamp: new Date().toISOString()
            })
            remainingScore -= 50
        } else if (remainingScore >= 40) {
            // Double 20
            throws.push({
                value: 20,
                multiplier: 'double',
                score: 40,
                timestamp: new Date().toISOString()
            })
            remainingScore -= 40
        } else if (remainingScore >= 20) {
            // Single 20
            throws.push({
                value: 20,
                multiplier: 'single',
                score: 20,
                timestamp: new Date().toISOString()
            })
            remainingScore -= 20
        } else {
            // Use remaining score
            throws.push({
                value: remainingScore,
                multiplier: 'single',
                score: remainingScore,
                timestamp: new Date().toISOString()
            })
            remainingScore = 0
        }
        
        // Second dart
        if (remainingScore >= 60) {
            throws.push({
                value: 20,
                multiplier: 'triple',
                score: 60,
                timestamp: new Date().toISOString()
            })
            remainingScore -= 60
        } else if (remainingScore >= 50) {
            throws.push({
                value: 25,
                multiplier: 'double',
                score: 50,
                timestamp: new Date().toISOString()
            })
            remainingScore -= 50
        } else if (remainingScore > 0) {
            // Use best multiplier for remaining score
            const value = Math.min(20, remainingScore)
            throws.push({
                value: value,
                multiplier: 'single',
                score: value,
                timestamp: new Date().toISOString()
            })
            remainingScore -= value
        } else {
            // No score left, add a miss
            throws.push({
                value: 0,
                multiplier: 'single',
                score: 0,
                timestamp: new Date().toISOString()
            })
        }
        
        // Third dart
        if (remainingScore > 0) {
            throws.push({
                value: Math.min(20, remainingScore),
                multiplier: 'single',
                score: Math.min(20, remainingScore),
                timestamp: new Date().toISOString()
            })
        } else {
            // No score left, add a miss
            throws.push({
                value: 0,
                multiplier: 'single',
                score: 0,
                timestamp: new Date().toISOString()
            })
        }
        
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

<style>
:root {
    /* Background Colors */
    --bg-primary: theme('colors.gray.800');
    --bg-secondary: theme('colors.gray.700');
    --bg-tertiary: theme('colors.gray.600');
    --bg-input: theme('colors.gray.700');
    --bg-success: theme('colors.green.700');
    --bg-danger: theme('colors.red.700');
    --bg-warning: theme('colors.yellow.700');
    --bg-info: theme('colors.blue.700');
    --bg-active: theme('colors.gray.700');
    --bg-accent-primary: theme('colors.blue.900');
    --bg-accent-secondary: theme('colors.blue.800');
    
    /* Button Colors */
    --bg-button: theme('colors.gray.700');
    --bg-button-hover: theme('colors.gray.600');
    --bg-button-active: theme('colors.blue.600');
    --bg-button-success: theme('colors.green.700');
    --bg-button-success-hover: theme('colors.green.600');
    --bg-button-danger: theme('colors.red.700');
    --bg-button-danger-hover: theme('colors.red.600');
    --bg-button-warning: theme('colors.yellow.700');
    --bg-button-warning-hover: theme('colors.yellow.600');
    
    /* Text Colors */
    --text-primary: theme('colors.white');
    --text-secondary: theme('colors.gray.300');
    --text-muted: theme('colors.gray.400');
    --text-success: theme('colors.green.400');
    --text-danger: theme('colors.red.400');
    --text-warning: theme('colors.yellow.400');
    --text-info: theme('colors.blue.400');
    --text-accent: theme('colors.blue.300');
    --text-accent-light: theme('colors.blue.200');
    
    /* Border Colors */
    --border-primary: theme('colors.gray.600');
    --border-secondary: theme('colors.gray.500');
    --border-success: theme('colors.green.600');
    --border-danger: theme('colors.red.600');
    --border-warning: theme('colors.yellow.600');
    --border-info: theme('colors.blue.600');
    --border-accent: theme('colors.blue.500');
}

.toggle-button {
    background-color: var(--bg-button);
    color: var(--text-secondary);
}

.toggle-button:hover {
    background-color: var(--bg-button-hover);
}

.toggle-button.active {
    background-color: var(--bg-button-active);
    color: var(--text-primary);
}

.score-submit-button {
    background-color: var(--bg-button-success);
    color: var(--text-primary);
}

.score-submit-button:hover {
    background-color: var(--bg-button-success-hover);
}

.score-submit-button.disabled {
    background-color: var(--bg-tertiary);
    color: var(--text-muted);
    cursor: not-allowed;
}

.number-pad-button {
    background-color: var(--bg-button);
    color: var(--text-primary);
    font-weight: bold;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 1.25rem;
    line-height: 1.75rem;
}

.number-pad-default:hover {
    background-color: var(--bg-button-hover);
}

.number-pad-clear {
    background-color: var(--bg-danger);
}

.number-pad-clear:hover {
    background-color: theme('colors.red.600');
}

.number-pad-submit {
    background-color: var(--bg-success);
}

.number-pad-submit:hover {
    background-color: theme('colors.green.600');
}

.multiplier-button {
    background-color: var(--bg-button);
    color: var(--text-secondary);
}

.multiplier-button:hover {
    background-color: var(--bg-button-hover);
}

.multiplier-button.active {
    background-color: var(--bg-button-active);
    color: var(--text-primary);
}

.number-grid-button {
    background-color: var(--bg-button);
    color: var(--text-primary);
}

.number-grid-button:hover {
    background-color: var(--bg-button-hover);
}

.number-grid-button.disabled {
    background-color: theme('colors.gray.900');
    color: theme('colors.gray.600');
    cursor: not-allowed;
}

.special-button {
    cursor: pointer;
}

.special-button.disabled {
    background-color: theme('colors.gray.900') !important;
    color: theme('colors.gray.600') !important;
    cursor: not-allowed;
}

.bulls-outer {
    background-color: var(--bg-button-warning);
    color: theme('colors.yellow.200');
}

.bulls-outer:hover {
    background-color: var(--bg-button-warning-hover);
}

.bulls-eye {
    background-color: var(--bg-button-danger);
    color: theme('colors.red.200');
}

.bulls-eye:hover {
    background-color: var(--bg-button-danger-hover);
}

.miss {
    background-color: var(--bg-button);
    color: var(--text-primary);
}

.miss:hover {
    background-color: var(--bg-button-hover);
}

.action-button {
    color: var(--text-primary);
}

.action-button.success {
    background-color: var(--bg-button-success);
}

.action-button.success:hover {
    background-color: var(--bg-button-success-hover);
}

.action-button.warning {
    background-color: var(--bg-button-warning);
}

.action-button.warning:hover {
    background-color: var(--bg-button-warning-hover);
}

.action-button.disabled {
    background-color: var(--bg-tertiary);
    color: var(--text-muted);
    cursor: not-allowed;
}

.checkout-suggestions-container {
    background-color: var(--bg-accent-primary);
    border-color: var(--border-info);
}

.checkout-suggestion-item {
    background-color: var(--bg-accent-secondary);
    color: var(--text-accent-light);
}

.scoring-options-container {
    background-color: var(--bg-secondary);
    border-color: var(--border-primary);
}

.scoring-option-item {
    background-color: var(--bg-primary);
    border-color: var(--border-primary);
}
</style>