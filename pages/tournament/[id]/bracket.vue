<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <!-- Header -->
        <div class="bg-white shadow-md rounded-lg p-6 mb-6">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <!-- TODO Translate -->
                    <h1 class="text-2xl font-bold mb-2">Tournament Bracket</h1>
                    <div v-if="currentTournament" class="space-y-1">
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Tournament:</span> 
                            {{ currentTournament.mode.charAt(0).toUpperCase() + currentTournament.mode.slice(1) }}
                            • {{ currentTournament.gameType }}
                        </p>
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Round:</span> 
                            {{ currentTournament.currentRound || 1 }} / {{ totalRounds }}
                        </p>
                    </div>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-3">
                    <button 
                        @click="navigateToLobby"
                        class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                    >
                        <!-- TODO Translate -->
                        Back to Lobby
                    </button>
                    
                    <button 
                        v-if="currentTournament?.status === 'completed'"
                        @click="viewAnalytics"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                        <!-- TODO Translate -->
                        View Analytics
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
        </div>

        <!-- Bracket Content -->
        <div v-else-if="currentTournament" class="space-y-6">
            
            <!-- Tournament Status -->
            <div class="bg-white shadow-md rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <!-- TODO Translate -->
                    <h2 class="text-xl font-semibold">Tournament Status</h2>
                    <span 
                        :class="getTournamentStatusClass(currentTournament.status)"
                        class="px-3 py-1 text-sm rounded-full"
                    >
                        {{ getTournamentStatusText(currentTournament.status) }}
                    </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <!-- TODO Translate -->
                        <div class="text-2xl font-bold text-blue-600">{{ currentTournament.players.length }}</div>
                        <div class="text-sm text-gray-600">Players</div>
                    </div>
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <!-- TODO Translate -->
                        <div class="text-2xl font-bold text-green-600">{{ currentTournament.currentRound || 1 }}</div>
                        <div class="text-sm text-gray-600">Current Round</div>
                    </div>
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <!-- TODO Translate -->
                        <div class="text-2xl font-bold text-purple-600">{{ completedMatches }} / {{ totalMatches }}</div>
                        <div class="text-sm text-gray-600">Matches Completed</div>
                    </div>
                </div>
            </div>

            <!-- Bracket Visualization -->
            <div class="bg-white shadow-md rounded-lg p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-semibold mb-6">Bracket Tree</h2>
                
                <div class="overflow-x-auto">
                    <div class="min-w-max">
                        <!-- Bracket rounds display -->
                        <div v-for="(round, roundIndex) in bracketRounds" :key="roundIndex" class="mb-8">
                            <!-- TODO Translate -->
                            <h3 class="text-lg font-medium mb-4 text-center">
                                {{ getRoundName(roundIndex + 1) }}
                            </h3>
                            
                            <div class="flex justify-center gap-8">
                                <div 
                                    v-for="(match, matchIndex) in round" 
                                    :key="match.id"
                                    class="relative"
                                >
                                    <!-- Match Card -->
                                    <div 
                                        class="border rounded-lg p-4 min-w-64"
                                        :class="getMatchCardClass(match)"
                                    >
                                        <!-- Match Header -->
                                        <div class="text-center mb-3">
                                            <span class="text-sm text-gray-500">{{ match.position }}</span>
                                        </div>
                                        
                                        <!-- Players -->
                                        <div class="space-y-2">
                                            <!-- Player 1 -->
                                            <div 
                                                class="flex items-center justify-between p-2 rounded"
                                                :class="getPlayerClass(match, match.player1Id)"
                                            >
                                                <span class="font-medium">
                                                    {{ getPlayerName(match.player1Id) }}
                                                </span>
                                                <span v-if="match.winnerId === match.player1Id" class="text-green-600 font-bold">
                                                    <!-- TODO Translate -->
                                                    Winner
                                                </span>
                                            </div>
                                            
                                            <!-- VS Divider -->
                                            <div class="text-center text-gray-400 text-sm">vs</div>
                                            
                                            <!-- Player 2 -->
                                            <div 
                                                class="flex items-center justify-between p-2 rounded"
                                                :class="getPlayerClass(match, match.player2Id)"
                                            >
                                                <span class="font-medium">
                                                    {{ getPlayerName(match.player2Id) }}
                                                </span>
                                                <span v-if="match.winnerId === match.player2Id" class="text-green-600 font-bold">
                                                    <!-- TODO Translate -->
                                                    Winner
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <!-- Match Status -->
                                        <div class="mt-3 text-center">
                                            <div v-if="match.completed" class="text-green-600 text-sm font-medium">
                                                <!-- TODO Translate -->
                                                Completed
                                            </div>
                                            <div v-else-if="match.gameId" class="space-y-2">
                                                <div class="text-blue-600 text-sm font-medium">
                                                    <!-- TODO Translate -->
                                                    In Progress
                                                </div>
                                                <button 
                                                    @click="spectateGame(match.gameId!)"
                                                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                                >
                                                    <!-- TODO Translate -->
                                                    Spectate
                                                </button>
                                            </div>
                                            <div v-else class="text-gray-500 text-sm">
                                                <!-- TODO Translate -->
                                                Waiting
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Connector lines (if not final round) -->
                                    <div v-if="roundIndex < bracketRounds.length - 1" class="absolute top-1/2 -right-4 w-8 h-px bg-gray-300"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Third Place Match (if enabled) -->
            <div v-if="currentTournament.enableThirdPlace && thirdPlaceMatch" class="bg-white shadow-md rounded-lg p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-semibold mb-4">Third Place Playoff</h2>
                
                <div class="max-w-md mx-auto">
                    <div 
                        class="border rounded-lg p-4"
                        :class="getMatchCardClass(thirdPlaceMatch)"
                    >
                        <!-- Players -->
                        <div class="space-y-2">
                            <!-- Player 1 -->
                            <div 
                                class="flex items-center justify-between p-2 rounded"
                                :class="getPlayerClass(thirdPlaceMatch, thirdPlaceMatch.player1Id)"
                            >
                                <span class="font-medium">
                                    {{ getPlayerName(thirdPlaceMatch.player1Id) }}
                                </span>
                                <span v-if="thirdPlaceMatch.winnerId === thirdPlaceMatch.player1Id" class="text-bronze-600 font-bold">
                                    <!-- TODO Translate -->
                                    3rd Place
                                </span>
                            </div>
                            
                            <!-- VS Divider -->
                            <div class="text-center text-gray-400 text-sm">vs</div>
                            
                            <!-- Player 2 -->
                            <div 
                                class="flex items-center justify-between p-2 rounded"
                                :class="getPlayerClass(thirdPlaceMatch, thirdPlaceMatch.player2Id)"
                            >
                                <span class="font-medium">
                                    {{ getPlayerName(thirdPlaceMatch.player2Id) }}
                                </span>
                                <span v-if="thirdPlaceMatch.winnerId === thirdPlaceMatch.player2Id" class="text-bronze-600 font-bold">
                                    <!-- TODO Translate -->
                                    3rd Place
                                </span>
                            </div>
                        </div>
                        
                        <!-- Match Status -->
                        <div class="mt-3 text-center">
                            <div v-if="thirdPlaceMatch.completed" class="text-green-600 text-sm font-medium">
                                <!-- TODO Translate -->
                                Completed
                            </div>
                            <div v-else-if="thirdPlaceMatch.gameId" class="space-y-2">
                                <div class="text-blue-600 text-sm font-medium">
                                    <!-- TODO Translate -->
                                    In Progress
                                </div>
                                <button 
                                    @click="spectateGame(thirdPlaceMatch.gameId!)"
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                >
                                    <!-- TODO Translate -->
                                    Spectate
                                </button>
                            </div>
                            <div v-else class="text-gray-500 text-sm">
                                <!-- TODO Translate -->
                                Waiting
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tournament Results (if completed) -->
            <div v-if="currentTournament.status === 'completed'" class="bg-white shadow-md rounded-lg p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-semibold mb-4">Final Results</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Winner -->
                    <div v-if="tournamentWinner" class="text-center p-6 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300">
                        <div class="text-4xl mb-2">🏆</div>
                        <!-- TODO Translate -->
                        <div class="text-lg font-bold text-yellow-800">Champion</div>
                        <div class="text-xl font-semibold">{{ tournamentWinner.name }}</div>
                    </div>
                    
                    <!-- Runner-up -->
                    <div v-if="runnerUp" class="text-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300">
                        <div class="text-4xl mb-2">🥈</div>
                        <!-- TODO Translate -->
                        <div class="text-lg font-bold text-gray-700">Runner-up</div>
                        <div class="text-xl font-semibold">{{ runnerUp.name }}</div>
                    </div>
                    
                    <!-- Third Place -->
                    <div v-if="thirdPlace" class="text-center p-6 bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
                        <div class="text-4xl mb-2">🥉</div>
                        <!-- TODO Translate -->
                        <div class="text-lg font-bold text-orange-700">Third Place</div>
                        <div class="text-xl font-semibold">{{ thirdPlace.name }}</div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { useTournament } from '~/composables/useTournament'
import { useNotificationStore } from '~/stores/notification'
import type { BracketMatch, TournamentPlayer } from '~/types/tournament'

// Get route params
const route = useRoute()
const tournamentId = computed(() => route.params.id as string)

// Stores and composables
const toast = useNotificationStore()
const { 
    currentTournament, 
    isLoading, 
    error, 
    subscribeToTournament
} = useTournament()

// Local state
let unsubscribe: (() => void) | null = null

// Computed properties
const totalRounds = computed(() => {
    if (!currentTournament.value) return 0
    const playerCount = currentTournament.value.players.length
    return Math.ceil(Math.log2(playerCount))
})

const bracketRounds = computed(() => {
    if (!currentTournament.value?.brackets) return []
    
    const rounds: BracketMatch[][] = []
    const totalRoundsCount = totalRounds.value
    
    for (let i = 1; i <= totalRoundsCount; i++) {
        const roundMatches = currentTournament.value.brackets.filter(match => match.round === i)
        if (roundMatches.length > 0) {
            rounds.push(roundMatches)
        }
    }
    
    return rounds
})

const totalMatches = computed(() => {
    if (!currentTournament.value?.brackets) return 0
    return currentTournament.value.brackets.length
})

const completedMatches = computed(() => {
    if (!currentTournament.value?.brackets) return 0
    return currentTournament.value.brackets.filter(match => match.completed).length
})

const thirdPlaceMatch = computed(() => {
    if (!currentTournament.value?.brackets || !currentTournament.value.enableThirdPlace) return null
    return currentTournament.value.brackets.find(match => match.position === 'third-place')
})

const tournamentWinner = computed(() => {
    if (!currentTournament.value?.brackets) return null
    const finalMatch = currentTournament.value.brackets.find(match => match.position === 'final')
    if (finalMatch?.winnerId) {
        return currentTournament.value.players.find(p => p.id === finalMatch.winnerId)
    }
    return null
})

const runnerUp = computed(() => {
    if (!currentTournament.value?.brackets) return null
    const finalMatch = currentTournament.value.brackets.find(match => match.position === 'final')
    if (finalMatch?.loserId) {
        return currentTournament.value.players.find(p => p.id === finalMatch.loserId)
    }
    return null
})

const thirdPlace = computed(() => {
    if (!thirdPlaceMatch.value?.winnerId) return null
    return currentTournament.value?.players.find(p => p.id === thirdPlaceMatch.value!.winnerId)
})

// Methods
const navigateToLobby = () => {
    navigateTo(`/tournament/${tournamentId.value}`)
}

const viewAnalytics = () => {
    navigateTo(`/tournament/${tournamentId.value}/analytics`)
}

const spectateGame = (gameId: string) => {
    navigateTo(`/game/${gameId}`)
}

const getPlayerName = (playerId: string): string => {
    const player = currentTournament.value?.players.find(p => p.id === playerId)
    return player?.name || 'TBD'
}

const getRoundName = (roundNumber: number): string => {
    const totalRoundsCount = totalRounds.value
    
    if (roundNumber === totalRoundsCount) {
        return 'Final'
    } else if (roundNumber === totalRoundsCount - 1) {
        return 'Semi-Final'
    } else if (roundNumber === totalRoundsCount - 2) {
        return 'Quarter-Final'
    } else {
        return `Round ${roundNumber}`
    }
}

const getMatchCardClass = (match: BracketMatch): string => {
    if (match.completed) {
        return 'bg-green-50 border-green-200'
    } else if (match.gameId) {
        return 'bg-blue-50 border-blue-200'
    } else {
        return 'bg-gray-50 border-gray-200'
    }
}

const getPlayerClass = (match: BracketMatch, playerId: string): string => {
    if (match.winnerId === playerId) {
        return 'bg-green-100 text-green-800'
    } else if (match.loserId === playerId) {
        return 'bg-red-100 text-red-800'
    } else {
        return 'bg-white'
    }
}

const getTournamentStatusClass = (status: string): string => {
    switch (status) {
        case 'waiting':
            return 'bg-yellow-100 text-yellow-800'
        case 'active':
            return 'bg-blue-100 text-blue-800'
        case 'completed':
            return 'bg-green-100 text-green-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

const getTournamentStatusText = (status: string): string => {
    switch (status) {
        case 'waiting':
            return 'Waiting for Players'
        case 'active':
            return 'In Progress'
        case 'completed':
            return 'Completed'
        default:
            return status
    }
}

// Lifecycle
onMounted(() => {
    // Subscribe to tournament updates
    unsubscribe = subscribeToTournament(tournamentId.value)
})

onBeforeUnmount(() => {
    // Clean up subscription
    if (unsubscribe) {
        unsubscribe()
    }
})
</script>

<style scoped>
.text-bronze-600 {
    color: #cd7f32;
}
</style>
