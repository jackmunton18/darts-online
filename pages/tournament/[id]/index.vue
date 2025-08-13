<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <!-- Tournament Header -->
        <div class="bg-white shadow-md rounded-lg p-6 mb-6">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <!-- TODO Translate -->
                    <h1 class="text-2xl font-bold mb-2">Tournament Lobby</h1>
                    <div v-if="currentTournament" class="space-y-1">
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Mode:</span> 
                            {{ currentTournament.mode.charAt(0).toUpperCase() + currentTournament.mode.slice(1) }}
                            • {{ currentTournament.gameType }}
                            • {{ currentTournament.legsToWin }} legs
                            • {{ currentTournament.setsToWin }} sets
                        </p>
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Players:</span> 
                            {{ currentTournament.currentPlayerCount }}/{{ currentTournament.maxPlayers }}
                        </p>
                        <div class="flex items-center space-x-2">
                            <!-- TODO Translate -->
                            <span class="font-medium text-gray-600">Status:</span>
                            <span 
                                :class="getTournamentStatusClass(currentTournament.status)"
                                class="px-2 py-1 text-xs rounded-full"
                            >
                                {{ getTournamentStatusText(currentTournament.status) }}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-3">
                    <button 
                        @click="navigateHome"
                        class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                    >
                        <!-- TODO Translate -->
                        Back to Tournaments
                    </button>
                    
                    <button 
                        v-if="currentTournament?.status === 'active'"
                        @click="viewBracket"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                        <!-- TODO Translate -->
                        View {{ currentTournament.mode === 'bracket' ? 'Bracket' : 'Leaderboard' }}
                    </button>
                    
                    <!-- Debug Button (development only) -->
                    <button 
                        v-if="currentTournament?.players && currentTournament.players.length >= 2"
                        @click="showDebugSpinner = true"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                        🔧 Debug Spinner
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <!-- TODO Translate -->
            <h3 class="text-red-800 font-medium mb-2">Error</h3>
            <p class="text-red-700">{{ error }}</p>
            <button 
                @click="navigateHome"
                class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
            >
                <!-- TODO Translate -->
                Back to Tournaments
            </button>
        </div>

        <!-- Tournament Content -->
        <div v-else-if="currentTournament" class="space-y-6">
            
            <!-- Tournament Code (Waiting Status) -->
            <div v-if="currentTournament.status === 'waiting'" class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="text-center">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold text-blue-800 mb-2">Tournament Code</h3>
                    <div class="flex items-center justify-center space-x-4 mb-4">
                        <span class="text-3xl font-mono font-bold text-blue-900 bg-white px-4 py-2 rounded border">
                            {{ currentTournament.code }}
                        </span>
                        <button
                            @click="copyTournamentCode"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            <!-- TODO Translate -->
                            Copy Code
                        </button>
                    </div>
                    <p class="text-blue-700 text-sm">
                        <!-- TODO Translate -->
                        Share this code with other players to join the tournament
                    </p>
                </div>
            </div>

            <!-- Players List -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-bold mb-4">Players</h2>
                
                <div class="space-y-3">
                    <div 
                        v-for="player in currentTournament.players" 
                        :key="player.id"
                        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                        <div class="flex items-center space-x-3">
                            <div 
                                :class="player.isReady ? 'bg-green-500' : 'bg-gray-400'"
                                class="w-3 h-3 rounded-full"
                            ></div>
                            <span class="font-medium">{{ player.name }}</span>
                            <span v-if="player.isHost" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                <!-- TODO Translate -->
                                Host
                            </span>
                            <span v-if="player.id === currentPlayer?.id" class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                <!-- TODO Translate -->
                                You
                            </span>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <span 
                                :class="player.isReady ? 'text-green-600' : 'text-gray-500'"
                                class="text-sm"
                            >
                                {{ player.isReady ? 'Ready' : 'Not Ready' }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Empty Player Slots -->
                    <div 
                        v-for="slot in emptySlots" 
                        :key="`empty-${slot}`"
                        class="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
                    >
                        <span class="text-gray-500 italic">
                            <!-- TODO Translate -->
                            Waiting for player...
                        </span>
                    </div>
                </div>
            </div>

            <!-- Tournament Settings Display -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-bold mb-4">Tournament Settings</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Game Settings -->
                    <div>
                        <!-- TODO Translate -->
                        <h3 class="font-semibold mb-3">Game Settings</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Game Type:</span>
                                <span class="font-medium">{{ currentTournament.gameType }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Legs to Win:</span>
                                <span class="font-medium">{{ currentTournament.legsToWin }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Sets to Win:</span>
                                <span class="font-medium">{{ currentTournament.setsToWin }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Bonus Points -->
                    <div>
                        <!-- TODO Translate -->
                        <h3 class="font-semibold mb-3">Bonus Points</h3>
                        <div class="space-y-2 text-sm">
                            <div v-if="currentTournament.bonusPoints.enable180s" class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>180s:</span>
                                <span class="font-medium">{{ currentTournament.bonusPoints.points180 }} points</span>
                            </div>
                            <div v-if="currentTournament.bonusPoints.enable170s" class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>170s (Big Fish):</span>
                                <span class="font-medium">{{ currentTournament.bonusPoints.points170 }} points</span>
                            </div>
                            <div v-if="currentTournament.bonusPoints.enableBullCheckout" class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Bull Checkout:</span>
                                <span class="font-medium">{{ currentTournament.bonusPoints.pointsBullCheckout }} point</span>
                            </div>
                            <div v-if="!hasAnyBonusPoints" class="text-gray-500 italic">
                                <!-- TODO Translate -->
                                No bonus points enabled
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tournament Mode Info -->
                <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div v-if="currentTournament.mode === 'bracket'">
                        <!-- TODO Translate -->
                        <h4 class="font-medium mb-2">Bracket Tournament</h4>
                        <p class="text-sm text-gray-600">
                            <!-- TODO Translate -->
                            Single elimination knockout format. Winners advance to the next round.
                            <span v-if="currentTournament.enableThirdPlace">Includes third place playoff.</span>
                        </p>
                    </div>
                    <div v-else>
                        <!-- TODO Translate -->
                        <h4 class="font-medium mb-2">Group Tournament</h4>
                        <p class="text-sm text-gray-600">
                            <!-- TODO Translate -->
                            Round-robin format where each player plays every other player once. 
                            3 points for a win, 1 point for losing with at least one leg won.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div v-if="currentTournament.status === 'waiting'" class="bg-white rounded-lg shadow-md p-6">
                <div class="flex flex-col sm:flex-row gap-4">
                    <!-- Ready Button -->
                    <button
                        v-if="currentPlayer"
                        @click="toggleReady"
                        :class="currentPlayer.isReady 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-green-600 hover:bg-green-700'"
                        class="flex-1 text-white py-3 px-6 rounded-md font-medium"
                        :disabled="isUpdatingReady"
                    >
                        <!-- TODO Translate -->
                        {{ isUpdatingReady ? 'Updating...' : (currentPlayer.isReady ? 'Cancel Ready' : 'Ready Up') }}
                    </button>

                    <!-- Start Tournament Button (Host Only) -->
                    <button
                        v-if="isHost && canStartTournament"
                        @click="handleStartTournament"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-medium"
                        :disabled="isStarting"
                    >
                        <!-- TODO Translate -->
                        {{ isStarting ? 'Starting...' : 'Start Tournament' }}
                    </button>

                    <!-- Cannot Start Messages -->
                    <div v-else-if="isHost" class="flex-1 bg-gray-200 text-gray-600 py-3 px-6 rounded-md text-center">
                        <span v-if="currentTournament.currentPlayerCount < 2" class="text-sm">
                            <!-- TODO Translate -->
                            Need at least 2 players to start
                        </span>
                        <span v-else-if="!currentTournament.allPlayersReady" class="text-sm">
                            <!-- TODO Translate -->
                            Waiting for all players to be ready
                        </span>
                    </div>
                </div>

                <!-- Ready Status Summary -->
                <div v-if="currentTournament.players.length > 1" class="mt-4 text-center">
                    <p class="text-sm text-gray-600">
                        <!-- TODO Translate -->
                        {{ readyPlayersCount }}/{{ currentTournament.players.length }} players ready
                    </p>
                </div>
            </div>

            <!-- Active Tournament Info -->
            <div v-else-if="currentTournament.status === 'active'" class="space-y-6">
                <!-- Tournament Status -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <!-- TODO Translate -->
                    <h2 class="text-xl font-bold mb-4">Tournament In Progress</h2>
                    
                    <div class="p-4 bg-blue-50 rounded-lg mb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <!-- TODO Translate -->
                                <h4 class="font-medium text-blue-900">Current Round: {{ currentTournament.currentRound || 1 }}</h4>
                                <p class="text-blue-700 text-sm">
                                    {{ currentTournament.mode === 'bracket' ? 'Elimination Round' : 'Group Stage' }}
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-blue-700">
                                    <!-- TODO Translate -->
                                    {{ getActiveGamesCount() }} / {{ getCurrentRoundPairings().length }} games active
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            @click="viewBracket"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
                        >
                            <!-- TODO Translate -->
                            View {{ currentTournament.mode === 'bracket' ? 'Bracket' : 'Leaderboard' }}
                        </button>
                        <button 
                            @click="viewCurrentGames"
                            class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md"
                        >
                            <!-- TODO Translate -->
                            View Active Games ({{ getCurrentRoundPairings().filter((p: any) => p.gameId).length }})
                        </button>
                    </div>
                </div>

                <!-- Spin Wheel for Round Start (Visible to All Players) -->
                <div v-if="showSpinWheel" class="bg-white rounded-lg shadow-md p-6">
                    <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <!-- TODO Translate -->
                        <h4 class="font-medium text-purple-900 mb-3">Round {{ currentTournament.currentRound || 1 }} Setup</h4>
                        
                        <!-- Spin Wheel Component -->
                        <SpinWheel
                            v-if="spinMode !== 'idle'"
                            :players="currentRoundPlayers"
                            :spin-type="spinMode"
                            :round-number="currentTournament.currentRound || 1"
                            :pre-calculated-result="spinnerResult"
                            @result="handleSpinComplete"
                            @close="handleSpinClose"
                        />
                        
                        <!-- Host Controls -->
                        <div v-if="isHost && spinMode === 'idle'" class="flex gap-2 flex-wrap">
                            <button 
                                v-if="!pairingsGenerated"
                                @click="spinForPairings"
                                :disabled="isSpinning"
                                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                            >
                                <!-- TODO Translate -->
                                {{ getRemainingPlayersCount() === 2 ? 'Spin for Home Side' : 'Spin for Pairings' }}
                            </button>
                            <button 
                                v-if="pairingsGenerated && !allHomeSidesDecided && getRemainingPlayersCount() > 2"
                                @click="spinForHomeSide"
                                :disabled="isSpinning"
                                class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                            >
                                <!-- TODO Translate -->
                                Spin for Home Side
                            </button>
                            <button 
                                v-if="pairingsGenerated && (allHomeSidesDecided || getRemainingPlayersCount() === 2)"
                                @click="createRoundGames"
                                :disabled="isCreatingGames"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                            >
                                <!-- TODO Translate -->
                                {{ isCreatingGames ? 'Creating Games...' : 'Create Round Games' }}
                            </button>
                        </div>
                        
                        <!-- Non-Host Message -->
                        <div v-else-if="!isHost" class="text-center text-gray-600">
                            <!-- TODO Translate -->
                            <p v-if="spinMode !== 'idle'">{{ getSpinMessage() }}</p>
                            <p v-else-if="!pairingsGenerated">Waiting for host to start round setup...</p>
                            <div v-else class="text-green-700">
                                <!-- TODO Translate -->
                                <p>Round setup complete! Check your match below.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Round Pairings Display -->
                <div v-if="getCurrentRoundPairings().length > 0" class="bg-white rounded-lg shadow-md p-6">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4">Round {{ currentTournament.currentRound || 1 }} Matches</h3>
                    <div class="space-y-3">
                        <div 
                            v-for="(pairing, index) in getCurrentRoundPairings()" 
                            :key="`${pairing.player1Id}-${pairing.player2Id}`"
                            class="p-4 border rounded-lg"
                            :class="{
                                'bg-gray-50 border-gray-200': !pairing.gameId,
                                'bg-green-50 border-green-200': pairing.gameId && !isGameCompleted(pairing.gameId),
                                'bg-blue-50 border-blue-200': pairing.gameId && isGameCompleted(pairing.gameId)
                            }"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <span class="font-medium">
                                        {{ getPlayerName(pairing.player1Id) }} vs {{ getPlayerName(pairing.player2Id) }}
                                    </span>
                                    <span v-if="pairing.homeSidePlayerId" class="text-sm text-blue-600">
                                        ({{ getPlayerName(pairing.homeSidePlayerId) }} starts)
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span 
                                        :class="{
                                            'text-gray-500': !pairing.gameId,
                                            'text-green-600': pairing.gameId && !isGameCompleted(pairing.gameId),
                                            'text-blue-600': pairing.gameId && isGameCompleted(pairing.gameId)
                                        }"
                                        class="text-sm"
                                    >
                                        {{ !pairing.gameId ? 'Waiting' : 
                                           isGameCompleted(pairing.gameId) ? 'Completed' : 'Game Active' }}
                                    </span>
                                    
                                    <!-- Game Action Buttons -->
                                    <div v-if="pairing.gameId && !isGameCompleted(pairing.gameId)" class="flex space-x-2">
                                        <button 
                                            v-if="isCurrentPlayerInPairing(pairing)"
                                            @click="joinPlayerGameById(pairing.gameId)"
                                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            <!-- TODO Translate -->
                                            Join Game
                                        </button>
                                        <button 
                                            v-else
                                            @click="spectateGame(pairing.gameId)"
                                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            <!-- TODO Translate -->
                                            Spectate
                                        </button>
                                    </div>
                                    <!-- View Results button for completed games -->
                                    <div v-else-if="pairing.gameId && isGameCompleted(pairing.gameId)" class="flex space-x-2">
                                        <button 
                                            @click="viewGameResults(pairing.gameId)"
                                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            <!-- TODO Translate -->
                                            View Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Round Ready-Up Section (shows after games are created) -->
                    <div v-if="roundGamesCreated && !canStartRoundGames" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="font-medium text-yellow-800 mb-3">Round Ready Check</h4>
                        <p class="text-sm text-yellow-700 mb-4">
                            <!-- TODO Translate -->
                            Games will automatically start when {{ Math.ceil(totalPlayersInRound * 0.75) }} or more players are ready ({{ playersReadyForRoundCount }}/{{ totalPlayersInRound }} ready)
                        </p>
                        
                        <div class="flex flex-col sm:flex-row gap-3">
                            <button
                                @click="toggleReadyForRound"
                                :class="isCurrentPlayerReadyForRound 
                                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                                    : 'bg-green-600 hover:bg-green-700'"
                                class="text-white py-2 px-4 rounded-md text-sm"
                            >
                                <!-- TODO Translate -->
                                {{ isCurrentPlayerReadyForRound ? 'Cancel Ready' : 'Ready for Round' }}
                            </button>
                        </div>
                        
                        <!-- Ready players list -->
                        <div class="mt-3">
                            <p class="text-xs text-yellow-600">
                                <!-- TODO Translate -->
                                Ready players: {{ Array.from(playersReadyForRound).map(id => getPlayerName(id)).join(', ') || 'None' }}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Auto-start message -->
                    <div v-if="canStartRoundGames" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="font-medium text-green-800 mb-2">Round Starting!</h4>
                        <p class="text-sm text-green-700">
                            <!-- TODO Translate -->
                            Enough players are ready. Games will start automatically...
                        </p>
                    </div>
                </div>
            </div>

            <!-- Completed Tournament -->
            <div v-else-if="currentTournament.status === 'completed'" class="bg-white rounded-lg shadow-md p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-bold mb-4">Tournament Completed</h2>
                <p class="text-gray-600 mb-4">
                    <!-- TODO Translate -->
                    This tournament has finished. View the final results below.
                </p>
                <button 
                    @click="viewBracket"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
                >
                    <!-- TODO Translate -->
                    View Final {{ currentTournament.mode === 'bracket' ? 'Bracket' : 'Leaderboard' }}
                </button>
            </div>
        </div>

        <!-- Debug Spinner Modal -->
        <DebugSpinWheel 
            v-if="showDebugSpinner"
            :players="currentTournament?.players ? [...currentTournament.players] : []"
            spin-type="pairing"
            :round-number="currentTournament?.currentRound || 1"
            @close="showDebugSpinner = false"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, navigateTo } from 'nuxt/app'
import { getFirestore, doc, updateDoc, Timestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import { useTournament } from '~/composables/useTournament'
import SpinWheel from '~/components/SpinWheel.vue'
import DebugSpinWheel from '~/components/DebugSpinWheel.vue'

// Page setup
definePageMeta({
    layout: 'default'
})

// Route and params
const route = useRoute()
const tournamentId = computed(() => route.params.id as string)

// Stores and composables
const authStore = useAuthStore()
const toast = useNotificationStore()
const { createGame, joinGameById } = useFirebaseDartsGame()
const { 
    currentTournament, 
    isLoading, 
    error, 
    isHost, 
    currentPlayer, 
    canStartTournament,
    subscribeToTournament,
    setPlayerReady,
    startTournament,
    startSpinnerWithResult,
    stopSpinnerForAll,
    getTournament
} = useTournament()

// Local state
const isUpdatingReady = ref(false)
const isStarting = ref(false)
const isCreatingGames = ref(false)
const pairingsGenerated = ref(false)
const currentRoundPairings = ref<any[]>([])
const showDebugSpinner = ref(false)
const roundGamesCreated = ref(false)
const playersReadyForRound = ref<Set<string>>(new Set())
const allRoundGamesCompleted = ref(false)
const tournamentGameResults = ref<any[]>([])
let unsubscribe: (() => void) | null = null

// Load tournament and set up subscription on mount
onMounted(async () => {
    try {
        const id = tournamentId.value
        if (!id) {
            console.error('No tournament ID provided')
            return
        }

        // Load the tournament initially using getTournament which updates the composable state
        await getTournament(id)

        // Load tournament game results
        await loadTournamentGameResults()

        // Set up real-time subscription
        unsubscribe = subscribeToTournament(id)
    } catch (err) {
        console.error('Error loading tournament:', err)
        // Error will be handled by the composable
    }
})

// Clean up subscription on unmount
onBeforeUnmount(() => {
    if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
    }
})

// Helper methods (defined early to avoid circular dependencies)
const getCurrentRoundPairings = () => {
    if (!currentTournament.value) return []
    
    // First check if we have local cached pairings (host only)
    if (currentRoundPairings.value.length > 0) {
        return currentRoundPairings.value
    }
    
    // For bracket mode, get from tournament document
    if (currentTournament.value.mode === 'bracket') {
        const brackets = currentTournament.value.brackets
        if (brackets && brackets.length > 0) {
            const round = currentTournament.value.currentRound || 1
            return brackets.filter(b => b.round === round)
        }
    }
    
    // For group mode, check tournament document for round pairings
    if (currentTournament.value.mode === 'group') {
        const currentRound = currentTournament.value.currentRound || 1
        const roundKey = `round${currentRound}`
        
        // Check if the tournament document has pairings for this round
        if (currentTournament.value.rounds && currentTournament.value.rounds[roundKey]) {
            const roundData = currentTournament.value.rounds[roundKey]
            if (roundData.pairings && Array.isArray(roundData.pairings)) {
                // Update local cache so we don't lose the pairings
                currentRoundPairings.value = roundData.pairings
                return roundData.pairings
            }
        }
    }
    
    return []
}

// Computed properties
const emptySlots = computed(() => {
    if (!currentTournament.value) return []
    const empty = currentTournament.value.maxPlayers - currentTournament.value.currentPlayerCount
    return Array.from({ length: empty }, (_, i) => i)
})

const readyPlayersCount = computed(() => {
    if (!currentTournament.value) return 0
    return currentTournament.value.players.filter(p => p.isReady).length
})

const hasAnyBonusPoints = computed(() => {
    if (!currentTournament.value) return false
    const bonus = currentTournament.value.bonusPoints
    return bonus.enable180s || bonus.enable170s || bonus.enableBullCheckout
})

// New computed properties for tournament features
const showSpinWheel = computed(() => {
    if (!currentTournament.value || currentTournament.value.status !== 'active') return false
    
    // Show spin wheel if:
    // 1. Host is currently spinning, OR
    // 2. No pairings have been generated yet AND host hasn't started round setup, OR  
    // 3. Host needs to create games (pairings exist but games haven't been created)
    const pairings = getCurrentRoundPairings()
    const isSpinnerActive = spinMode.value !== 'idle'
    const hasPairings = pairings.length > 0
    const hasGames = pairings.length > 0 && pairings.every((p: any) => p.gameId)
    
    // For host: show if spinner is active, no pairings yet, or pairings exist but games not created
    if (isHost.value) {
        return isSpinnerActive || !hasPairings || (hasPairings && !hasGames)
    }
    
    // For non-host: only show if spinner is active (they're watching the spin)
    return isSpinnerActive
})

const currentRoundPlayers = computed(() => {
    if (!currentTournament.value) return []
    return [...currentTournament.value.players] // Create a mutable copy
})

const allHomeSidesDecided = computed(() => {
    const pairings = getCurrentRoundPairings()
    return pairings.every((p: any) => p.homeSidePlayerId)
})

// Function to check if a game is completed
const isGameCompleted = (gameId: string) => {
    if (!currentTournament.value || !gameId) return false
    
    // Check if the game ID is in the completedGames array
    return currentTournament.value.completedGames?.includes(gameId) || false
}

// Round ready-up logic (after games are created)
const playersReadyForRoundCount = computed(() => {
    return playersReadyForRound.value.size
})

const totalPlayersInRound = computed(() => {
    if (!currentTournament.value) return 0
    return currentTournament.value.players.length
})

const canStartRoundGames = computed(() => {
    const readyThreshold = Math.ceil(totalPlayersInRound.value * 0.75) // 75% threshold
    return playersReadyForRoundCount.value >= readyThreshold && roundGamesCreated.value
})

const isCurrentPlayerReadyForRound = computed(() => {
    return currentPlayer.value ? playersReadyForRound.value.has(currentPlayer.value.id) : false
})

// Sync spinner state with tournament document
const isSpinning = computed(() => {
    return currentTournament.value?.spinnerState?.isSpinning ?? false
})

const spinMode = computed(() => {
    return currentTournament.value?.spinnerState?.spinType ?? 'idle'
})

const spinnerResult = computed(() => {
    return currentTournament.value?.spinnerState?.result ?? null
})

const currentPlayerGameId = computed(() => {
    if (!currentPlayer.value || !currentTournament.value) {
        console.log('🔍 No current player or tournament for game ID check')
        return null
    }
    
    const pairings = getCurrentRoundPairings()
    console.log('🔍 Checking pairings for current player:', { 
        playerId: currentPlayer.value.id, 
        playerName: currentPlayer.value.name,
        pairings: pairings.map(p => ({ 
            player1: p.player1Id, 
            player2: p.player2Id, 
            gameId: p.gameId 
        }))
    })
    
    const playerPairing = pairings.find((pairing: any) => 
        pairing.player1Id === currentPlayer.value!.id || 
        pairing.player2Id === currentPlayer.value!.id
    )
    
    const gameId = playerPairing?.gameId || null
    console.log('🔍 Found game ID for current player:', gameId)
    
    return gameId
})

// Watch for new games and auto-redirect current player
watch(() => currentPlayerGameId.value, async (newGameId, oldGameId) => {
    if (newGameId && newGameId !== oldGameId && currentTournament.value?.status === 'active') {
        console.log(`🎮 Auto-joining and redirecting player to game: ${newGameId}`)
        
        // Show notification to user
        toast.addMessage({ 
            type: 'info', 
            message: 'Your tournament game is ready! Joining...' 
        })
        
        try {
            // Automatically join the tournament game as a player
            if (joinGameById) {
                console.log(`🔗 Attempting to join game ${newGameId} as player...`)
                const joinResult = await joinGameById(newGameId, 'player')
                
                console.log(`🎯 Join result:`, joinResult)
                
                if (joinResult && joinResult.success) {
                    console.log(`✅ Successfully joined tournament game: ${newGameId}`)
                    toast.addMessage({ 
                        type: 'success', 
                        message: 'Successfully joined tournament game! Redirecting...' 
                    })
                    
                    // Navigate to the game after successful join
                    setTimeout(() => {
                        navigateTo(`/game/${newGameId}`)
                    }, 1500)
                } else {
                    console.error('❌ Failed to join tournament game:', joinResult)
                    const errorMsg = joinResult?.error || 'Unknown error'
                    
                    // Check if it's because the user is already in the game
                    if (errorMsg.includes('already') || errorMsg.includes('exists')) {
                        console.log(`ℹ️ Player already in game, just redirecting...`)
                        toast.addMessage({ 
                            type: 'success', 
                            message: 'Joining your tournament game...' 
                        })
                        
                        setTimeout(() => {
                            navigateTo(`/game/${newGameId}`)
                        }, 1000)
                    } else {
                        toast.addMessage({ 
                            type: 'warning', 
                            message: `Could not auto-join: ${errorMsg}. Redirecting to game page...` 
                        })
                        
                        // Still navigate to the game page so they can join manually
                        setTimeout(() => {
                            navigateTo(`/game/${newGameId}`)
                        }, 2000)
                    }
                }
            } else {
                console.log(`⚠️ joinGameById function not available, just redirecting...`)
                
                toast.addMessage({ 
                    type: 'info', 
                    message: 'Redirecting to tournament game...' 
                })
                
                // Fallback: just navigate to the game page
                setTimeout(() => {
                    navigateTo(`/game/${newGameId}`)
                }, 1000)
            }
        } catch (error) {
            console.error('💥 Exception during auto-join:', error)
            toast.addMessage({ 
                type: 'warning', 
                message: 'Error joining game automatically. Redirecting to game page...' 
            })
            
            // Still navigate to the game page so they can join manually
            setTimeout(() => {
                navigateTo(`/game/${newGameId}`)
            }, 2000)
        }
    }
}, { immediate: false })

// Also watch for pairings being generated to update local state
watch(() => currentTournament.value?.spinnerState?.isSpinning, (isSpinning, wasSpinning) => {
    // When spinner stops, log the event for debugging
    if (wasSpinning && !isSpinning && currentTournament.value) {
        console.log('🎯 Spinner stopped, current pairings:', currentRoundPairings.value)
    }
}, { immediate: false })

// Watch for tournament updates to sync pairings for non-host players
watch(() => currentTournament.value?.rounds, (newRounds) => {
    if (!newRounds || !currentTournament.value) return
    
    const currentRound = currentTournament.value.currentRound || 1
    const roundKey = `round${currentRound}`
    
    // If there are new pairings in the tournament document, update local state
    if (newRounds[roundKey]?.pairings && newRounds[roundKey].pairings.length > 0) {
        const tournamentPairings = newRounds[roundKey].pairings
        
        // Only update if we don't already have these pairings
        if (JSON.stringify(currentRoundPairings.value) !== JSON.stringify(tournamentPairings)) {
            console.log('🔄 Syncing pairings from tournament document:', tournamentPairings)
            currentRoundPairings.value = [...tournamentPairings] // Create a mutable copy
            pairingsGenerated.value = true
            
            // Check if any pairing has games created
            const hasGames = tournamentPairings.some((p: any) => p.gameId)
            if (hasGames) {
                roundGamesCreated.value = true
            }
        }
    }
}, { deep: true, immediate: true })

// Watch for completed games changes to reload results
watch(() => currentTournament.value?.completedGames, async (newCompletedGames) => {
    if (newCompletedGames && newCompletedGames.length > 0) {
        await loadTournamentGameResults()
    }
}, { immediate: false })

// Methods
const navigateHome = () => {
    navigateTo('/tournament')
}

const viewBracket = () => {
    if (currentTournament.value?.mode === 'bracket') {
        navigateTo(`/tournament/${tournamentId.value}/bracket`)
    } else {
        navigateTo(`/tournament/${tournamentId.value}/leaderboard`)
    }
}

const viewCurrentGames = () => {
    // Scroll to the active games section if it exists
    const activeGames = getCurrentRoundPairings().filter((p: any) => p.gameId)
    if (activeGames.length > 0) {
        // Scroll to the active games list
        const activeGamesElement = document.querySelector('.active-games-section')
        if (activeGamesElement) {
            activeGamesElement.scrollIntoView({ behavior: 'smooth' })
        }
        toast.addMessage({ 
            type: 'info', 
            message: `${activeGames.length} active games found` 
        })
    } else {
        toast.addMessage({ 
            type: 'info', 
            message: 'No active games in this round' 
        })
    }
}

const copyTournamentCode = async () => {
    if (!currentTournament.value?.code) return
    
    try {
        await navigator.clipboard.writeText(currentTournament.value.code)
        toast.addMessage({ type: 'success', message: 'Tournament code copied to clipboard!' })
    } catch (error) {
        console.error('Failed to copy code:', error)
        toast.addMessage({ type: 'error', message: 'Failed to copy code' })
    }
}

const toggleReady = async () => {
    if (!currentPlayer.value || isUpdatingReady.value) return
    
    isUpdatingReady.value = true
    try {
        await setPlayerReady(tournamentId.value, !currentPlayer.value.isReady)
        toast.addMessage({ 
            type: 'success', 
            message: currentPlayer.value.isReady ? 'You are now ready!' : 'Ready status cancelled' 
        })
    } catch (error) {
        console.error('Error updating ready status:', error)
        toast.addMessage({ type: 'error', message: 'Failed to update ready status' })
    } finally {
        isUpdatingReady.value = false
    }
}

const toggleReadyForRound = () => {
    if (!currentPlayer.value) return
    
    const playerId = currentPlayer.value.id
    if (playersReadyForRound.value.has(playerId)) {
        playersReadyForRound.value.delete(playerId)
        toast.addMessage({ type: 'info', message: 'Ready status cancelled' })
    } else {
        playersReadyForRound.value.add(playerId)
        toast.addMessage({ type: 'success', message: 'You are ready for the round!' })
    }
}

const handleStartTournament = async () => {
    if (!isHost.value || !canStartTournament.value || isStarting.value) return
    
    isStarting.value = true
    try {
        await startTournament(tournamentId.value)
        toast.addMessage({ type: 'success', message: 'Tournament started!' })
    } catch (error) {
        console.error('Error starting tournament:', error)
        toast.addMessage({ type: 'error', message: 'Failed to start tournament' })
    } finally {
        isStarting.value = false
    }
}

const getTournamentStatusClass = (status: string) => {
    switch (status) {
        case 'waiting': return 'bg-yellow-100 text-yellow-800'
        case 'active': return 'bg-green-100 text-green-800'
        case 'completed': return 'bg-blue-100 text-blue-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

const getTournamentStatusText = (status: string) => {
    switch (status) {
        case 'waiting': return 'Waiting for Players'
        case 'active': return 'In Progress'
        case 'completed': return 'Completed'
        default: return 'Unknown'
    }
}

// Spin wheel methods
const spinForPairings = async () => {
    if (!isHost.value) return
    
    try {
        // Special case: if only 2 players, create the pairing directly and spin for home side
        if (getRemainingPlayersCount() === 2) {
            const players = currentTournament.value!.players
            const pairing = {
                player1Id: players[0].id,
                player2Id: players[1].id,
                player1Name: players[0].name,
                player2Name: players[1].name,
                homePlayerId: null, // Will be determined by spin
                roundNumber: currentTournament.value!.currentRound || 1
            }
            
            currentRoundPairings.value = [pairing]
            pairingsGenerated.value = true
            
            // Now spin for home side immediately with pre-calculated result
            await startSpinnerWithResult(tournamentId.value, 'home-side', currentTournament.value!.currentRound || 1)
        } else {
            // Normal case: spin for pairings with pre-calculated result
            const result = await startSpinnerWithResult(tournamentId.value, 'pairing', currentTournament.value!.currentRound || 1)
            console.log('🎯 Host calculated pairing result:', result)
        }
    } catch (error) {
        console.error('Error starting pairing spin:', error)
        toast.addMessage({ type: 'error', message: 'Failed to start pairing spin' })
    }
}

const spinForHomeSide = async () => {
    if (!isHost.value) return
    
    try {
        const result = await startSpinnerWithResult(tournamentId.value, 'home-side', currentTournament.value!.currentRound || 1)
        console.log('🎯 Host calculated home side result:', result)
    } catch (error) {
        console.error('Error starting home side spin:', error)
        toast.addMessage({ type: 'error', message: 'Failed to start home side spin' })
    }
}

const handleSpinComplete = async (result: any) => {
    console.log('🎯 Spin completed with result:', result)
    
    // For the host, the result should already be stored in Firestore by startSpinnerWithResult
    // For non-hosts, they get the result from Firestore via spinnerResult computed property
    
    if (spinMode.value === 'pairing') {
        // Use the result from Firestore (should be the same as the local result for host)
        const finalResult = spinnerResult.value || result
        currentRoundPairings.value = finalResult
        pairingsGenerated.value = true
        
        // Save pairings to tournament document so all players can see them
        try {
            await savePairingsToTournament(tournamentId.value, finalResult)
            toast.addMessage({ type: 'success', message: 'Round pairings generated!' })
        } catch (error) {
            console.error('Error saving pairings:', error)
            toast.addMessage({ type: 'error', message: 'Failed to save pairings' })
        }
    } else if (spinMode.value === 'home-side') {
        // Use the result from Firestore (should be the same as the local result for host)
        const finalResult = spinnerResult.value || result
        
        // Update home side for current pairing that needs it
        const pairingIndex = currentRoundPairings.value.findIndex(p => !p.homeSidePlayerId)
        if (pairingIndex >= 0) {
            currentRoundPairings.value[pairingIndex].homeSidePlayerId = finalResult.id
            
            // Save updated pairings to tournament document
            try {
                await savePairingsToTournament(tournamentId.value, currentRoundPairings.value)
                toast.addMessage({ type: 'success', message: `${finalResult.name} will start first!` })
            } catch (error) {
                console.error('Error saving pairings:', error)
                toast.addMessage({ type: 'error', message: 'Failed to save pairings' })
            }
        }
    }
}

const handleSpinClose = async () => {
    try {
        // Add a delay before stopping spinner to give users time to see the result
        setTimeout(async () => {
            await stopSpinnerForAll(tournamentId.value)
        }, 3000) // 3 second delay
    } catch (error) {
        console.error('Error stopping spinner:', error)
    }
}

const getSpinMessage = () => {
    if (spinMode.value === 'pairing') {
        // TODO Translate
        return 'Host is determining round pairings...'
    } else if (spinMode.value === 'home-side') {
        // TODO Translate
        return 'Host is determining who starts first...'
    }
    // TODO Translate
    return 'Waiting for host...'
}

// Game creation and management
const createRoundGames = async () => {
    if (!isHost.value || !currentTournament.value || isCreatingGames.value) return
    
    isCreatingGames.value = true
    try {
        const gameIds: string[] = []
        const updatedPairings = [...currentRoundPairings.value]
        
        for (let i = 0; i < updatedPairings.length; i++) {
            const pairing = updatedPairings[i]
            if (pairing.gameId) continue // Skip if game already exists
            
            const player1 = currentTournament.value.players.find(p => p.id === pairing.player1Id)
            const player2 = currentTournament.value.players.find(p => p.id === pairing.player2Id)
            
            if (!player1 || !player2) continue
            
            console.log(`🎯 Creating game for pairing:`, {
                player1: player1.name,
                player2: player2.name,
                gameType: currentTournament.value.gameType,
                legsToWin: currentTournament.value.legsToWin,
                setsToWin: currentTournament.value.setsToWin,
                tournamentId: tournamentId.value
            })
            
            // Create game with tournament context
            try {
                const gameResult = await createGame({
                    gameType: currentTournament.value.gameType,
                    legsToWin: currentTournament.value.legsToWin,
                    setsToWin: currentTournament.value.setsToWin,
                    startingScore: 501, // Default score for most dart games
                    tournamentId: tournamentId.value,
                    skipGameCode: true // Tournament games don't need codes
                })
                
                console.log(`🎯 Game creation result:`, gameResult)
                
                // The createGame function returns { gameId, gameCode, error? }
                if (gameResult && typeof gameResult === 'object' && gameResult.gameId) {
                    // Success - game created
                    const gameId = gameResult.gameId
                    updatedPairings[i].gameId = gameId
                    gameIds.push(gameId)
                    
                    console.log(`🎯 Game ${gameId} created for ${player1.name} vs ${player2.name}`)
                    
                    // Automatically add both players to the game if it's a tournament game
                    if (gameId && joinGameById) {
                        try {
                            // Note: For tournament games, we'll let players join manually
                            // This is because we can't control which user account joins first
                            console.log(`🎯 Game ${gameId} ready for players to join`)
                        } catch (joinError) {
                            console.error('Error with game setup:', joinError)
                        }
                    }
                    
                    toast.addMessage({ 
                        type: 'success', 
                        message: `Game created: ${getPlayerName(pairing.player1Id)} vs ${getPlayerName(pairing.player2Id)}` 
                    })
                } else if (gameResult && typeof gameResult === 'object' && gameResult.error) {
                    // Error returned from createGame function
                    console.error('Game creation failed:', gameResult.error)
                    toast.addMessage({ 
                        type: 'error', 
                        message: `Failed to create game for ${getPlayerName(pairing.player1Id)} vs ${getPlayerName(pairing.player2Id)}: ${gameResult.error}` 
                    })
                } else {
                    // Unexpected response format
                    console.error('Unexpected game creation response:', gameResult)
                    toast.addMessage({ 
                        type: 'error', 
                        message: `Failed to create game for ${getPlayerName(pairing.player1Id)} vs ${getPlayerName(pairing.player2Id)}: Invalid response` 
                    })
                }
            } catch (gameError) {
                console.error('Exception during game creation:', gameError)
                toast.addMessage({ 
                    type: 'error', 
                    message: `Error creating game for ${getPlayerName(pairing.player1Id)} vs ${getPlayerName(pairing.player2Id)}: ${gameError instanceof Error ? gameError.message : 'Unknown error'}` 
                })
            }
        }
        
        // Update the tournament document with the new pairings
        if (gameIds.length > 0) {
            await updateTournamentPairings(tournamentId.value, updatedPairings)
            toast.addMessage({ type: 'success', message: 'Round games created successfully!' })
            
            // Mark round games as created
            roundGamesCreated.value = true
            
            // Reset ready status for new round
            playersReadyForRound.value.clear()
        }
        
        // Auto-navigate current player to their game if they have one
        await navigateToPlayerGame()
        
    } catch (error) {
        console.error('Error creating round games:', error)
        toast.addMessage({ type: 'error', message: 'Failed to create some games' })
    } finally {     
        isCreatingGames.value = false
    }
}

// Helper methods
const getActiveGamesCount = () => {
    const pairings = getCurrentRoundPairings()
    return pairings.filter((p: any) => p.gameId).length
}

const getPlayerName = (playerId: string) => {
    if (!currentTournament.value) return 'Unknown Player'
    const player = currentTournament.value.players.find(p => p.id === playerId)
    return player?.name || 'Unknown Player'
}

const isCurrentPlayerInPairing = (pairing: any) => {
    if (!currentPlayer.value) return false
    return pairing.player1Id === currentPlayer.value.id || pairing.player2Id === currentPlayer.value.id
}

const joinPlayerGameById = async (gameId: string) => {
    if (!joinGameById) return
    
    try {
        const result = await joinGameById(gameId, 'player')
        if (result?.success) {
            navigateTo(`/game/${gameId}`)
        } else {
            toast.addMessage({ type: 'error', message: result?.error || 'Failed to join game' })
        }
    } catch (error) {
        console.error('Error joining game:', error)
        toast.addMessage({ type: 'error', message: 'Error joining game' })
    }
}

const spectateGame = (gameId: string) => {
    navigateTo(`/game/${gameId}?spectate=true`)
}

const viewGameResults = (gameId: string) => {
    navigateTo(`/game/${gameId}/analytics`)
}

const getRemainingPlayersCount = () => {
    if (!currentTournament.value) return 0
    return currentTournament.value.players.length
}

const savePairingsToTournament = async (tournamentId: string, pairings: any[]) => {
    if (!currentTournament.value) return
    
    try {
        const db = getFirestore()
        const currentRound = currentTournament.value.currentRound || 1
        const roundKey = `round${currentRound}`
        
        await updateDoc(doc(db, 'tournaments', tournamentId), {
            [`rounds.${roundKey}.pairings`]: pairings,
            updatedAt: Timestamp.now()
        })
    } catch (error) {
        console.error('Error saving pairings to tournament:', error)
    }
}

const updateTournamentPairings = async (tournamentId: string, updatedPairings: any[]) => {
    return savePairingsToTournament(tournamentId, updatedPairings)
}

const navigateToPlayerGame = async () => {
    const gameId = currentPlayerGameId.value
    if (gameId) {
        navigateTo(`/game/${gameId}`)
    }
}

const formatGameScore = (result: any) => {
    // If only one set was played, show leg score
    if (result.winnerSets === 1 && result.loserSets === 0) {
        // TODO Translate
        return `Legs: ${result.winnerLegs} - ${result.loserLegs}`
    }
    // If multiple sets were played, show set score
    // TODO Translate
    return `Sets: ${result.winnerSets} - ${result.loserSets}`
}

const loadTournamentGameResults = async () => {
    if (!currentTournament.value || !currentTournament.value.completedGames.length) {
        tournamentGameResults.value = []
        return
    }

    try {
        const db = getFirestore()
        const resultsCollection = collection(db, 'tournament_results')
        // Query without orderBy to avoid index requirement
        const q = query(
            resultsCollection, 
            where('tournamentId', '==', currentTournament.value.id)
        )
        
        const snapshot = await getDocs(q)
        const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        
        // Sort the results client-side instead of using Firestore orderBy
        tournamentGameResults.value = results.sort((a, b) => 
            ((b as any).winnerPoints || 0) - ((a as any).winnerPoints || 0))
    } catch (error) {
        console.error('Error loading tournament game results:', error)
        tournamentGameResults.value = []
    }
}

// Methods
</script>