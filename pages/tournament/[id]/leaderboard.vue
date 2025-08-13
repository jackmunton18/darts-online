<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <!-- Header -->
        <div class="bg-white shadow-md rounded-lg p-6 mb-6">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <!-- TODO Translate -->
                    <h1 class="text-2xl font-bold mb-2">Group Tournament Leaderboard</h1>
                    <div v-if="currentTournament" class="space-y-1">
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Tournament:</span> 
                            Group Stage • {{ currentTournament.gameType }}
                        </p>
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            <span class="font-medium">Progress:</span> 
                            {{ completedMatches }} / {{ totalMatches }} matches completed
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

        <!-- Leaderboard Content -->
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
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <!-- TODO Translate -->
                        <div class="text-2xl font-bold text-blue-600">{{ currentTournament.players.length }}</div>
                        <div class="text-sm text-gray-600">Players</div>
                    </div>
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <!-- TODO Translate -->
                        <div class="text-2xl font-bold text-green-600">{{ completedMatches }}</div>
                        <div class="text-sm text-gray-600">Completed</div>
                    </div>
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <!-- TODO Translate -->
                        <div class="text-2xl font-bold text-orange-600">{{ activeMatches }}</div>
                        <div class="text-sm text-gray-600">Active</div>
                    </div>
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <!-- TODO Translate -->
                        <div class="text-2xl font-bold text-gray-600">{{ totalMatches }}</div>
                        <div class="text-sm text-gray-600">Total Matches</div>
                    </div>
                </div>
            </div>

            <!-- Leaderboard Table -->
            <div class="bg-white shadow-md rounded-lg overflow-hidden">
                <!-- TODO Translate -->
                <div class="px-6 py-4 bg-gray-50 border-b">
                    <h2 class="text-xl font-semibold">Standings</h2>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <!-- TODO Translate -->
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Position
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Player
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Points
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Played
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Won
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lost
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Legs W/L
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leg Diff
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bonus
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr 
                                v-for="(standing, index) in sortedStandings" 
                                :key="standing.playerId"
                                :class="getRowClass(index)"
                            >
                                <!-- Position -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <span 
                                            :class="getPositionClass(index)"
                                            class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                                        >
                                            {{ index + 1 }}
                                        </span>
                                        <span v-if="index === 0" class="ml-2 text-lg">🏆</span>
                                        <span v-else-if="index === 1" class="ml-2 text-lg">🥈</span>
                                        <span v-else-if="index === 2" class="ml-2 text-lg">🥉</span>
                                    </div>
                                </td>
                                
                                <!-- Player -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="font-medium text-gray-900">
                                        {{ standing.playerName }}
                                    </div>
                                </td>
                                
                                <!-- Points -->
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-lg font-bold text-blue-600">
                                        {{ standing.points }}
                                    </span>
                                </td>
                                
                                <!-- Games Played -->
                                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                                    {{ standing.gamesPlayed }}
                                </td>
                                
                                <!-- Games Won -->
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-green-600 font-medium">
                                        {{ standing.gamesWon }}
                                    </span>
                                </td>
                                
                                <!-- Games Lost -->
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-red-600 font-medium">
                                        {{ standing.gamesLost }}
                                    </span>
                                </td>
                                
                                <!-- Legs W/L -->
                                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                                    {{ standing.legsWon }} / {{ standing.legsLost }}
                                </td>
                                
                                <!-- Leg Difference -->
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span 
                                        :class="standing.legDifference >= 0 ? 'text-green-600' : 'text-red-600'"
                                        class="font-medium"
                                    >
                                        {{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}
                                    </span>
                                </td>
                                
                                <!-- Bonus Points -->
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-purple-600 font-medium">
                                        {{ standing.bonusPoints }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Bonus Points Breakdown -->
            <div v-if="hasAnyBonusPoints" class="bg-white shadow-md rounded-lg p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-semibold mb-4">Bonus Points Breakdown</h2>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <!-- TODO Translate -->
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Player
                                </th>
                                <th v-if="currentTournament.bonusPoints.enable180s" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    180s
                                </th>
                                <th v-if="currentTournament.bonusPoints.enable170s" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    170s
                                </th>
                                <th v-if="currentTournament.bonusPoints.enableBullCheckout" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bull Checkouts
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Bonus
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="standing in sortedStandings" :key="`bonus-${standing.playerId}`">
                                <!-- Player -->
                                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {{ standing.playerName }}
                                </td>
                                
                                <!-- 180s -->
                                <td v-if="currentTournament.bonusPoints.enable180s" class="px-6 py-4 whitespace-nowrap text-center">
                                    <div class="text-lg font-semibold">{{ standing.total180s }}</div>
                                    <div class="text-xs text-gray-500">
                                        ({{ standing.total180s * currentTournament.bonusPoints.points180 }} pts)
                                    </div>
                                </td>
                                
                                <!-- 170s -->
                                <td v-if="currentTournament.bonusPoints.enable170s" class="px-6 py-4 whitespace-nowrap text-center">
                                    <div class="text-lg font-semibold">{{ standing.total170s }}</div>
                                    <div class="text-xs text-gray-500">
                                        ({{ standing.total170s * currentTournament.bonusPoints.points170 }} pts)
                                    </div>
                                </td>
                                
                                <!-- Bull Checkouts -->
                                <td v-if="currentTournament.bonusPoints.enableBullCheckout" class="px-6 py-4 whitespace-nowrap text-center">
                                    <div class="text-lg font-semibold">{{ standing.totalBullCheckouts }}</div>
                                    <div class="text-xs text-gray-500">
                                        ({{ standing.totalBullCheckouts * currentTournament.bonusPoints.pointsBullCheckout }} pts)
                                    </div>
                                </td>
                                
                                <!-- Total Bonus -->
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-lg font-bold text-purple-600">
                                        {{ standing.bonusPoints }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Match Schedule -->
            <div class="bg-white shadow-md rounded-lg p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-semibold mb-4">Match Schedule</h2>
                
                <div class="space-y-3">
                    <div 
                        v-for="(match, index) in allMatches" 
                        :key="`match-${index}`"
                        class="flex items-center justify-between p-4 border rounded-lg"
                        :class="getMatchStatusClass(match)"
                    >
                        <div class="flex items-center space-x-4">
                            <span class="font-medium">{{ getPlayerName(match.player1Id) }}</span>
                            <span class="text-gray-500">vs</span>
                            <span class="font-medium">{{ getPlayerName(match.player2Id) }}</span>
                        </div>
                        
                        <div class="flex items-center space-x-3">
                            <span 
                                :class="getMatchStatusTextClass(match)"
                                class="text-sm font-medium"
                            >
                                {{ getMatchStatusText(match) }}
                            </span>
                            
                            <button 
                                v-if="match.gameId && !match.completed"
                                @click="spectateGame(match.gameId)"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            >
                                <!-- TODO Translate -->
                                Spectate
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useTournament } from '~/composables/useTournament'
import { useNotificationStore } from '~/stores/notification'
import type { GroupStanding, TournamentPlayer } from '~/types/tournament'
import { getFirestore, collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'

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
const tournamentResults = ref<any[]>([])
const gamesByPlayers = ref<Record<string, any>>({})
const localStandings = ref<GroupStanding[]>([])

// Load data when component is mounted
onMounted(async () => {
    if (tournamentId.value) {
        unsubscribe = subscribeToTournament(tournamentId.value)
        await loadTournamentResults()
    }
})

// Clean up subscription when component is unmounted
onBeforeUnmount(() => {
    if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
    }
})

// Watch for changes to the tournament data to reload results
watch(currentTournament, async (newTournament) => {
    if (newTournament) {
        // Update local standings with the base tournament data
        if (newTournament.groupStandings) {
            localStandings.value = JSON.parse(JSON.stringify(newTournament.groupStandings))
        }
        
        // If there are completed games, load the tournament results
        if (newTournament.completedGames?.length) {
            await loadTournamentResults()
        }
    }
}, { deep: true })

// Load tournament results
const loadTournamentResults = async () => {
    if (!currentTournament.value || !currentTournament.value.completedGames?.length) {
        tournamentResults.value = []
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
        
        tournamentResults.value = results
        
        // Update standings with tournament results data
        updateStandingsWithResults(results)
        
        // Now load the game data
        await loadGameData()
    } catch (error) {
        console.error('Error loading tournament results:', error)
    }
}

// Load game data to associate with players
const loadGameData = async () => {
    if (!currentTournament.value) return
    
    const gameIds = [
        ...(currentTournament.value.games || []),
        ...(currentTournament.value.completedGames || [])
    ]
    
    if (!gameIds.length) return
    
    try {
        const db = getFirestore()
        const gamesMap: Record<string, any> = {}
        const playerPairingsMap: Record<string, any> = {}
        
        // Get all games
        const promises = gameIds.map(gameId => 
            getDoc(doc(db, 'games', gameId))
                .then((docSnap: any) => {
                    if (docSnap.exists()) {
                        const game: any = { id: docSnap.id, ...docSnap.data() }
                        gamesMap[docSnap.id] = game
                        
                        // If the game has players, create a mapping
                        if (game.players && Array.isArray(game.players) && game.players.length >= 2) {
                            const p1 = game.players[0]?.id
                            const p2 = game.players[1]?.id
                            if (p1 && p2) {
                                playerPairingsMap[`${p1}-${p2}`] = game
                                playerPairingsMap[`${p2}-${p1}`] = game
                            }
                        }
                    }
                })
        )
        
        await Promise.all(promises)
        gamesByPlayers.value = playerPairingsMap
    } catch (error) {
        console.error('Error loading game data:', error)
    }
}

// Computed properties
const sortedStandings = computed(() => {
    // Use local standings if available, otherwise fall back to tournament data
    const standings = localStandings.value.length > 0 
        ? localStandings.value 
        : (currentTournament.value?.groupStandings || [])
    
    // Sort by points (descending), then by leg difference (descending), then by legs won (descending)
    return [...standings].sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points
        if (a.legDifference !== b.legDifference) return b.legDifference - a.legDifference
        return b.legsWon - a.legsWon
    })
})

const allMatches = computed(() => {
    if (!currentTournament.value) return []
    
    const players = currentTournament.value.players
    const matches = []
    
    // Get the tournament's games and completed games arrays
    const activeGames = currentTournament.value.games || []
    const completedGames = currentTournament.value.completedGames || []
    
    // Get tournament results to find winners
    const results = tournamentResults.value || []
    
    // Generate all possible matches for group stage
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const player1Id = players[i].id
            const player2Id = players[j].id
            
            // Find if there's a game for this pairing
            const game = gamesByPlayers.value[`${player1Id}-${player2Id}`] || 
                         gamesByPlayers.value[`${player2Id}-${player1Id}`]
            
            const match = {
                player1Id: player1Id,
                player2Id: player2Id,
                gameId: game?.id || null,
                completed: game?.id ? completedGames.includes(game.id) : false,
                winnerId: null as string | null
            }
            
            // Find the winner if the game is completed
            if (match.completed && match.gameId) {
                const result = results.find(r => r.gameId === match.gameId)
                if (result) {
                    match.winnerId = result.winnerId
                }
            }
            
            matches.push(match)
        }
    }
    
    return matches
})

const totalMatches = computed(() => allMatches.value.length)

const completedMatches = computed(() => {
    return allMatches.value.filter(match => match.completed).length
})

const activeMatches = computed(() => {
    return allMatches.value.filter(match => match.gameId && !match.completed).length
})

const hasAnyBonusPoints = computed(() => {
    if (!currentTournament.value) return false
    const bonus = currentTournament.value.bonusPoints
    return bonus.enable180s || bonus.enable170s || bonus.enableBullCheckout
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
    return player?.name || 'Unknown Player'
}

const getRowClass = (index: number): string => {
    if (index === 0) {
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100'
    } else if (index === 1) {
        return 'bg-gradient-to-r from-gray-50 to-gray-100'
    } else if (index === 2) {
        return 'bg-gradient-to-r from-orange-50 to-orange-100'
    }
    return ''
}

const getPositionClass = (index: number): string => {
    if (index === 0) {
        return 'bg-yellow-500 text-white'
    } else if (index === 1) {
        return 'bg-gray-500 text-white'
    } else if (index === 2) {
        return 'bg-orange-500 text-white'
    }
    return 'bg-gray-200 text-gray-700'
}

const getMatchStatusClass = (match: any): string => {
    if (match.completed) {
        return 'bg-green-50 border-green-200'
    } else if (match.gameId) {
        return 'bg-blue-50 border-blue-200'
    } else {
        return 'bg-gray-50 border-gray-200'
    }
}

const getMatchStatusTextClass = (match: any): string => {
    if (match.completed) {
        return 'text-green-600'
    } else if (match.gameId) {
        return 'text-blue-600'
    } else {
        return 'text-gray-500'
    }
}

const getMatchStatusText = (match: any): string => {
    if (match.completed) {
        return 'Completed'
    } else if (match.gameId) {
        return 'In Progress'
    } else {
        return 'Scheduled'
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

// Function to update standings with tournament results
const updateStandingsWithResults = (results: any[]) => {
    if (!currentTournament.value || !currentTournament.value.groupStandings || !results.length) return
    
    // Store reference to the current tournament to avoid null checks everywhere
    const tournament = currentTournament.value
    
    // Create a deep copy of the group standings to modify
    const updatedStandings = JSON.parse(JSON.stringify(tournament.groupStandings))
    
    // Create a map of player IDs to their standings for quicker access
    const standingsMap: Record<string, any> = {}
    
    // Reset all player stats to ensure we're not double-counting
    updatedStandings.forEach((standing: GroupStanding) => {
        standingsMap[standing.playerId] = standing
        
        // Reset all stats
        standing.points = 0
        standing.gamesPlayed = 0
        standing.gamesWon = 0
        standing.gamesLost = 0
        standing.legsWon = 0
        standing.legsLost = 0
        standing.bonusPoints = 0
        standing.total180s = 0
        standing.total170s = 0 
        standing.totalBullCheckouts = 0
    })
    
    console.log(`Processing ${results.length} tournament results...`)
    
    // Process each tournament result to rebuild all stats
    results.forEach(result => {
        if (!result.winnerId || !result.loserId) {
            console.warn('⚠️ Skipping tournament result missing winner or loser ID:', result)
            return
        }
        
        // Update winner stats
        if (result.winnerId && standingsMap[result.winnerId]) {
            const winnerStanding = standingsMap[result.winnerId]
            
            // Basic game stats
            winnerStanding.gamesPlayed++
            winnerStanding.gamesWon++
            
            // Legs stats
            if (typeof result.winnerLegs === 'number') {
                winnerStanding.legsWon += result.winnerLegs
            }
            if (typeof result.loserLegs === 'number') {
                winnerStanding.legsLost += result.loserLegs
            }
            
            // Add win points (3 points for a win)
            const winPoints = 3
            winnerStanding.points += winPoints
            
            // Bonus points
            let bonusPoints = 0
            
            // Update 180s
            if (result.winner180s) {
                winnerStanding.total180s += result.winner180s
                if (tournament.bonusPoints?.points180) {
                    bonusPoints += result.winner180s * tournament.bonusPoints.points180
                }
            }
            
            // Update 170s
            if (result.winner170s) {
                winnerStanding.total170s += result.winner170s
                if (tournament.bonusPoints?.points170) {
                    bonusPoints += result.winner170s * tournament.bonusPoints.points170
                }
            }
            
            // Update bull checkouts
            if (result.winnerBullCheckouts) {
                winnerStanding.totalBullCheckouts += result.winnerBullCheckouts
                if (tournament.bonusPoints?.pointsBullCheckout) {
                    bonusPoints += result.winnerBullCheckouts * tournament.bonusPoints.pointsBullCheckout
                }
            }
            
            // Add bonus points to total
            winnerStanding.bonusPoints += bonusPoints
            winnerStanding.points += bonusPoints
        }
        
        // Update loser stats
        if (result.loserId && standingsMap[result.loserId]) {
            const loserStanding = standingsMap[result.loserId]
            
            // Basic game stats
            loserStanding.gamesPlayed++
            loserStanding.gamesLost++
            
            // Legs stats
            if (typeof result.loserLegs === 'number') {
                loserStanding.legsWon += result.loserLegs
            }
            if (typeof result.winnerLegs === 'number') {
                loserStanding.legsLost += result.winnerLegs
            }
            
            // Add loser points (1 point if they won at least one leg)
            if (result.loserLegs > 0) {
                loserStanding.points += 1
            }
            
            // Bonus points
            let bonusPoints = 0
            
            // Update 180s
            if (result.loser180s) {
                loserStanding.total180s += result.loser180s
                if (tournament.bonusPoints?.points180) {
                    bonusPoints += result.loser180s * tournament.bonusPoints.points180
                }
            }
            
            // Update 170s
            if (result.loser170s) {
                loserStanding.total170s += result.loser170s
                if (tournament.bonusPoints?.points170) {
                    bonusPoints += result.loser170s * tournament.bonusPoints.points170
                }
            }
            
            // Update bull checkouts
            if (result.loserBullCheckouts) {
                loserStanding.totalBullCheckouts += result.loserBullCheckouts
                if (tournament.bonusPoints?.pointsBullCheckout) {
                    bonusPoints += result.loserBullCheckouts * tournament.bonusPoints.pointsBullCheckout
                }
            }
            
            // Add bonus points to total
            loserStanding.bonusPoints += bonusPoints
            loserStanding.points += bonusPoints
        }
    })
    
    // Update the leg difference for all standings
    updatedStandings.forEach((standing: GroupStanding) => {
        standing.legDifference = standing.legsWon - standing.legsLost
    })
    
    // Update our local standings ref with the updated data
    localStandings.value = updatedStandings
    
    console.log('📊 Updated standings with tournament results:', updatedStandings)
}
</script>
