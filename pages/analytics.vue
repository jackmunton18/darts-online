<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white shadow-md rounded-lg p-4 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">
                {{ userStore.user ? `${userStore.user.firstName}'s Darts Analytics` : 'Darts Analytics' }}
            </h1>
            <p class="text-gray-700 mb-2">
                <!-- TODO Translate -->
                View your game history and performance statistics.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- Key Performance Stats -->
            <div v-for="(stat, index) in keyStats" :key="index" class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-sm text-gray-500 uppercase mb-1">{{ stat.label }}</h3>
                <div class="text-2xl font-bold">{{ stat.value }}</div>
                <p v-if="stat.change !== undefined" class="text-sm mt-1" :class="stat.change >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ stat.change >= 0 ? '+' : '' }}{{ stat.change }}% from last week
                </p>
            </div>
        </div>

        <!-- Game History -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <!-- TODO Translate -->
            <h2 class="text-xl font-bold mb-4">Recent Games</h2>
            
            <div v-if="isLoading" class="flex justify-center py-6">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            
            <div v-else-if="recentGames.length === 0" class="text-center py-6 text-gray-500">
                <!-- TODO Translate -->
                No game history available.
            </div>
            
            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <!-- TODO Translate -->
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game Type</th>
                            <!-- TODO Translate -->
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High Score</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="game in recentGames" :key="game.id" class="hover:bg-gray-50">
                            <td class="px-4 py-3 whitespace-nowrap">
                                {{ formatDate(game.createdAt) }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                {{ game.gameType }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                {{ getOpponentName(game) }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                <span 
                                    :class="getGameResultClass(game)"
                                    class="px-2 py-1 text-xs rounded-full"
                                >
                                    {{ getGameResult(game) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                {{ getUserGameAverage(game).toFixed(1) }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                {{ getUserHighScore(game) }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                <button @click="viewGameDetails(game.id)" class="text-blue-600 hover:underline">
                                    <!-- TODO Translate -->
                                    Details
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Performance Chart -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <!-- TODO Translate -->
            <h2 class="text-xl font-bold mb-4">Performance Trends</h2>
            
            <div v-if="isLoading" class="flex justify-center py-6">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            
            <div v-else-if="averages.length === 0" class="text-center py-6 text-gray-500">
                <!-- TODO Translate -->
                Not enough data to display performance trends.
            </div>
            
            <div v-else>
                <!-- TODO Translate -->
                <p class="text-gray-500 mb-6">
                    Your average score per turn over recent games. Trend shows 
                    {{ detailedAnalytics.improvementTrend >= 0 ? 'improvement' : 'decline' }} of 
                    {{ Math.abs(detailedAnalytics.improvementTrend) }}% over time.
                </p>
                
                <!-- Performance Summary Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="text-sm text-blue-600 font-medium">Overall Average</h4>
                        <p class="text-2xl font-bold text-blue-800">{{ detailedAnalytics.overallAverage.toFixed(1) }}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="text-sm text-green-600 font-medium">Best Average</h4>
                        <p class="text-2xl font-bold text-green-800">{{ detailedAnalytics.bestAverage.toFixed(1) }}</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="text-sm text-purple-600 font-medium">Recent Form</h4>
                        <div class="flex space-x-1 mt-1">
                            <span 
                                v-for="(result, index) in detailedAnalytics.recentForm" 
                                :key="index"
                                :class="result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-gray-500'"
                                class="w-6 h-6 rounded text-white text-xs flex items-center justify-center font-bold"
                            >
                                {{ result }}
                            </span>
                        </div>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="text-sm text-yellow-600 font-medium">Preferred Game</h4>
                        <p class="text-lg font-bold text-yellow-800">{{ detailedAnalytics.mostFrequentGameType }}</p>
                    </div>
                </div>

                <!-- Simple Chart Visualization -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <!-- TODO Translate -->
                    <h4 class="font-medium mb-4">Average Score Trend</h4>
                    <div class="space-y-2">
                        <div 
                            v-for="(data, index) in averages.slice(-8)" 
                            :key="index"
                            class="flex items-center justify-between"
                        >
                            <span class="text-sm text-gray-600 w-20">{{ data.date }}</span>
                            <div class="flex-1 mx-4">
                                <div class="bg-gray-200 rounded-full h-2">
                                    <div 
                                        class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${Math.min((data.average / Math.max(...averages.map(a => a.average))) * 100, 100)}%` }"
                                    ></div>
                                </div>
                            </div>
                            <span class="text-sm font-medium w-12 text-right">{{ data.average.toFixed(1) }}</span>
                            <span v-if="data.games && data.games > 1" class="text-xs text-gray-500 ml-2">({{ data.games }}g)</span>
                        </div>
                    </div>
                </div>

                <!-- Additional Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="font-medium mb-3">Game Statistics</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Total Games:</span>
                                <span class="font-medium">{{ detailedAnalytics.totalGames }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Wins:</span>
                                <span class="font-medium text-green-600">{{ detailedAnalytics.totalWins }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Losses:</span>
                                <span class="font-medium text-red-600">{{ detailedAnalytics.totalLosses }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Avg Duration:</span>
                                <span class="font-medium">{{ detailedAnalytics.averageGameDuration }}m</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-4 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="font-medium mb-3">Throwing Statistics</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Total Throws:</span>
                                <span class="font-medium">{{ detailedAnalytics.totalThrows.toLocaleString() }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Total Turns:</span>
                                <span class="font-medium">{{ detailedAnalytics.totalTurns.toLocaleString() }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Best Game:</span>
                                <span class="font-medium">{{ detailedAnalytics.bestAverage.toFixed(1) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Worst Game:</span>
                                <span class="font-medium">{{ detailedAnalytics.worstAverage.toFixed(1) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-4 rounded-lg">
                        <!-- TODO Translate -->
                        <h4 class="font-medium mb-3">Progress Indicators</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Improvement:</span>
                                <span 
                                    :class="detailedAnalytics.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'"
                                    class="font-medium"
                                >
                                    {{ detailedAnalytics.improvementTrend >= 0 ? '+' : '' }}{{ detailedAnalytics.improvementTrend }}%
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Highest Checkout:</span>
                                <span class="font-medium">{{ detailedAnalytics.highestCheckout || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Fastest Checkout:</span>
                                <span class="font-medium">{{ detailedAnalytics.fastestCheckout ? detailedAnalytics.fastestCheckout + ' darts' : '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <!-- TODO Translate -->
                                <span>Games This Week:</span>
                                <span class="font-medium">{{ keyStats.find(s => s.label === 'Games Played')?.change || 0 }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, query, where, orderBy, limit, getDocs, getFirestore } from 'firebase/firestore'
import { useNuxtApp } from '#app'
import type { FirebaseGame } from '~/composables/useFirebaseDartsGame'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useNotificationStore } from '~/stores/notification'

const authStore = useAuthStore()
const userStore = useUserStore()
const toast = useNotificationStore()

// State
const recentGames = ref<FirebaseGame[]>([])
const allUserGames = ref<FirebaseGame[]>([]) // Store all games for trend analysis
const isLoading = ref(true)
const averages = ref<{date: string; average: number; games?: number; winRate?: number}[]>([])

// Helper function to get week boundaries
const getWeekBoundaries = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of week (Saturday)
    end.setHours(23, 59, 59, 999)
    
    return { start, end }
}

// Helper function to filter games by date range
const filterGamesByDateRange = (games: FirebaseGame[], start: Date, end: Date) => {
    return games.filter(game => {
        if (!game.finishedAt) return false
        const gameDate = game.finishedAt.toDate ? game.finishedAt.toDate() : new Date(game.finishedAt as any)
        return gameDate >= start && gameDate <= end
    })
}

// Calculate analytics for a set of games
const calculateAnalyticsForGames = (games: FirebaseGame[]) => {
    let totalAverage = 0
    let totalWins = 0
    let highestAverage = 0
    let highestCheckout = 0
    let totalCheckouts = 0
    let successfulCheckouts = 0
    let total180s = 0
    let totalHighFinishes = 0 // 100+ checkouts
    let fastestCheckout = Number.MAX_VALUE // Track fastest checkout (fewest darts)
    let fastestCheckoutDarts = 0 // Number of darts used in fastest checkout

    games.forEach(game => {
        const userPlayer = game.players.find(p => p.id === authStore.currentUser?.id)
        if (userPlayer) {
            totalAverage += userPlayer.averagePerTurn || 0
            
            if (userPlayer.averagePerTurn > highestAverage) {
                highestAverage = userPlayer.averagePerTurn
            }
            
            if (userPlayer.highestCheckout > highestCheckout) {
                highestCheckout = userPlayer.highestCheckout
            }
            
            // Check for fastest checkout if we have detailed leg data
            if (game.legsData) {
                Object.values(game.legsData).forEach(legData => {
                    // Check if this player won the leg (successful checkout)
                    if (legData.winningPlayerId === userPlayer.id) {
                        const playerLegStats = legData.playerStats[userPlayer.id]
                        // If this was a successful checkout, count total darts used in the leg
                        if (playerLegStats && playerLegStats.checkoutSuccess) {
                            const totalDartsUsed = playerLegStats.dartsThrown
                            if (totalDartsUsed && (totalDartsUsed < fastestCheckout || fastestCheckout === Number.MAX_VALUE)) {
                                fastestCheckout = totalDartsUsed
                                fastestCheckoutDarts = totalDartsUsed
                            }
                        }
                    }
                })
            }

            // Count checkouts
            totalCheckouts += userPlayer.checkoutAttempts || 0
            successfulCheckouts += userPlayer.successfulCheckouts || 0

            // Count 180s (assuming this is tracked in player stats)
            if (userPlayer.throwsOver100) {
                // This is an approximation - we'd need actual 180 tracking
                total180s += Math.floor(userPlayer.throwsOver100 * 0.1) // Rough estimate
            }

            // Count high finishes (100+ checkouts)
            if (userPlayer.highestCheckout >= 100) {
                totalHighFinishes++
            }
            
            // Check if user is the winner
            if (game.status === 'finished') {
                const winner = [...game.players].sort((a, b) => b.sets - a.sets)[0]
                if (winner && winner.id === userPlayer.id) {
                    totalWins++
                }
            }
        }
    })

    return {
        gamesPlayed: games.length,
        averageScore: games.length > 0 ? totalAverage / games.length : 0,
        winRate: games.length > 0 ? (totalWins / games.length) * 100 : 0,
        wins: totalWins,
        highestAverage,
        highestCheckout,
        checkoutPercentage: totalCheckouts > 0 ? (successfulCheckouts / totalCheckouts) * 100 : 0,
        total180s,
        totalHighFinishes,
        fastestCheckout: fastestCheckout !== Number.MAX_VALUE ? fastestCheckoutDarts : null
    }
}

// Computed analytics with trend calculations
const keyStats = computed(() => {
    if (allUserGames.value.length === 0) {
        return [
            { label: 'Games Played', value: 0, change: undefined },
            { label: 'Win Rate', value: '0.0%', change: undefined },
            { label: 'Average Score', value: '0.0', change: undefined },
            { label: 'Highest Checkout', value: '-', change: undefined },
            { label: 'Fastest Checkout', value: '-', change: undefined }
        ]
    }

    const now = new Date()
    const currentWeek = getWeekBoundaries(now)
    const lastWeekStart = new Date(currentWeek.start)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(currentWeek.end)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)
    
    // Get games for current and previous week
    const currentWeekGames = filterGamesByDateRange(allUserGames.value, currentWeek.start, currentWeek.end)
    const lastWeekGames = filterGamesByDateRange(allUserGames.value, lastWeekStart, lastWeekEnd)
    
    // Calculate analytics for both periods
    const currentStats = calculateAnalyticsForGames(currentWeekGames)
    const lastWeekStats = calculateAnalyticsForGames(lastWeekGames)
    const allTimeStats = calculateAnalyticsForGames(allUserGames.value)

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Number(((current - previous) / previous * 100).toFixed(1))
    }

    return [
        {
            label: 'Games Played',
            value: allTimeStats.gamesPlayed,
            change: calculateChange(currentStats.gamesPlayed, lastWeekStats.gamesPlayed)
        },
        {
            label: 'Win Rate',
            value: `${allTimeStats.winRate.toFixed(1)}%`,
            change: calculateChange(currentStats.winRate, lastWeekStats.winRate)
        },
        {
            label: 'Average Score',
            value: allTimeStats.averageScore.toFixed(1),
            change: calculateChange(currentStats.averageScore, lastWeekStats.averageScore)
        },
        {
            label: 'Highest Checkout',
            value: allTimeStats.highestCheckout ? allTimeStats.highestCheckout.toString() : '-',
            change: undefined
        },
        {
            label: 'Fastest Checkout',
            value: allTimeStats.fastestCheckout ? `${allTimeStats.fastestCheckout} darts` : '-',
            change: undefined
        }
    ]
})

// Additional computed analytics for detailed insights
const detailedAnalytics = computed(() => {
    if (allUserGames.value.length === 0) {
        return {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            averageGameDuration: 0,
            totalThrows: 0,
            totalTurns: 0,
            overallAverage: 0,
            bestAverage: 0,
            worstAverage: 0,
            highestCheckout: 0,
            fastestCheckout: null,
            mostFrequentGameType: 'N/A',
            recentForm: [] as string[], // Last 5 games: W/L
            improvementTrend: 0 // Percentage improvement over time
        }
    }

    const stats = calculateAnalyticsForGames(allUserGames.value)
    let totalDuration = 0
    let totalThrows = 0
    let totalTurns = 0
    let bestAverage = 0
    let worstAverage = Number.MAX_VALUE
    const gameTypes: { [key: string]: number } = {}
    const recentForm: string[] = []
    const averagesOverTime: number[] = []

    allUserGames.value.forEach((game, index) => {
        const userPlayer = game.players.find(p => p.id === authStore.currentUser?.id)
        if (userPlayer) {
            // Game duration
            if (game.gameDuration) {
                totalDuration += game.gameDuration
            }

            // Throws and turns
            totalThrows += userPlayer.totalThrows || 0
            totalTurns += userPlayer.totalTurns || 0

            // Best/worst averages
            if (userPlayer.averagePerTurn > bestAverage) {
                bestAverage = userPlayer.averagePerTurn
            }
            if (userPlayer.averagePerTurn < worstAverage && userPlayer.averagePerTurn > 0) {
                worstAverage = userPlayer.averagePerTurn
            }

            // Game types
            gameTypes[game.gameType] = (gameTypes[game.gameType] || 0) + 1

            // Recent form (last 5 games)
            if (index < 5) {
                const result = getGameResult(game)
                recentForm.push(result === 'Win' ? 'W' : result === 'Loss' ? 'L' : 'D')
            }

            // Averages over time for improvement calculation
            averagesOverTime.push(userPlayer.averagePerTurn || 0)
        }
    })

    // Calculate improvement trend (compare first half vs second half of games)
    let improvementTrend = 0
    if (averagesOverTime.length >= 4) {
        const firstHalf = averagesOverTime.slice(0, Math.floor(averagesOverTime.length / 2))
        const secondHalf = averagesOverTime.slice(Math.floor(averagesOverTime.length / 2))
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        
        if (firstAvg > 0) {
            improvementTrend = ((secondAvg - firstAvg) / firstAvg) * 100
        }
    }

    const mostFrequentGameType = Object.keys(gameTypes).reduce((a, b) => 
        gameTypes[a] > gameTypes[b] ? a : b, 'N/A'
    )

    return {
        totalGames: allUserGames.value.length,
        totalWins: stats.wins,
        totalLosses: allUserGames.value.length - stats.wins,
        averageGameDuration: totalDuration > 0 ? Math.round(totalDuration / allUserGames.value.length / 60000) : 0, // minutes
        totalThrows,
        totalTurns,
        overallAverage: stats.averageScore,
        bestAverage,
        worstAverage: worstAverage === Number.MAX_VALUE ? 0 : worstAverage,
        highestCheckout: stats.highestCheckout,
        fastestCheckout: stats.fastestCheckout || null,
        mostFrequentGameType,
        recentForm,
        improvementTrend: Number(improvementTrend.toFixed(1))
    }
})

// Methods
const loadUserGames = async () => {
    if (!authStore.currentUser) {
        isLoading.value = false
        return
    }
    
    try {
        isLoading.value = true

        const db = getFirestore()
        
        // Query for finished games ordered by finishedAt
        // We'll need to filter client-side since Firestore doesn't support 
        // array-contains queries with other filters efficiently
        const gamesRef = collection(db, 'dartsGames')
        const q = query(
            gamesRef,
            where('status', '==', 'finished'),
            orderBy('finishedAt', 'desc'),
            limit(100) // Get more games for better trend analysis
        )
        
        const querySnapshot = await getDocs(q)
        const allGames: FirebaseGame[] = []
        const recentGamesLimit = 10
        let recentGamesCount = 0
        
        querySnapshot.forEach(doc => {
            const gameData = doc.data() as Omit<FirebaseGame, 'id'>
            
            // Only include games where the user was a player
            const isUserPlayer = gameData.players.some(p => p.id === authStore.currentUser?.id)
            if (isUserPlayer) {
                const game = {
                    ...gameData,
                    id: doc.id
                }
                
                // Add to all games for analytics
                allGames.push(game)
                
                // Add to recent games if under limit
                if (recentGamesCount < recentGamesLimit) {
                    recentGamesCount++
                }
            }
        })
        
        // Store all games for trend analysis
        allUserGames.value = allGames
        
        // Store recent games for display
        recentGames.value = allGames.slice(0, recentGamesLimit)
        
        // Generate performance trend data
        generatePerformanceTrend(allGames)
    } catch (error) {
        console.error('Error loading games:', error)
        // TODO Translate
        toast.addMessage({
            type: 'error',
            message: 'Failed to load game history. Please try again.'
        })
    } finally {
        isLoading.value = false
    }
}

const generatePerformanceTrend = (games: FirebaseGame[]) => {
    const trend: {date: string; average: number; games: number; winRate: number}[] = []
    
    // Sort games by date (oldest first)
    const sortedGames = [...games].sort((a, b) => {
        const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any)
        const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any)
        return dateA.getTime() - dateB.getTime()
    })
    
    // Group games by week for better trend visualization
    const weeklyData = new Map<string, FirebaseGame[]>()
    
    sortedGames.forEach(game => {
        const gameDate = game.createdAt.toDate ? game.createdAt.toDate() : new Date(game.createdAt as any)
        const week = getWeekBoundaries(gameDate)
        const weekKey = week.start.toISOString().split('T')[0] // Use start of week as key
        
        if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, [])
        }
        weeklyData.get(weekKey)!.push(game)
    })
    
    // Calculate weekly statistics
    weeklyData.forEach((weekGames, weekKey) => {
        const weekStats = calculateAnalyticsForGames(weekGames)
        
        trend.push({
            date: new Date(weekKey).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }),
            average: weekStats.averageScore,
            games: weekStats.gamesPlayed,
            winRate: weekStats.winRate
        })
    })
    
    // If we have fewer than 8 weeks of data, supplement with individual games
    if (trend.length < 8 && sortedGames.length > 0) {
        const individualTrend: typeof trend = []
        
        sortedGames.slice(-10).forEach(game => {
            const userPlayer = game.players.find(p => p.id === authStore.currentUser?.id)
            if (userPlayer) {
                const isWin = (() => {
                    if (game.status !== 'finished') return false
                    
                    // If winner ID is stored, use it directly
                    if (game.winner) {
                        return game.winner === userPlayer.id
                    }
                    
                    // Otherwise compute from player sets
                    const winner = [...game.players].sort((a, b) => b.sets - a.sets)[0]
                    return winner && winner.id === userPlayer.id
                })()
                
                individualTrend.push({
                    date: formatDate(game.createdAt),
                    average: userPlayer.averagePerTurn || 0,
                    games: 1,
                    winRate: isWin ? 100 : 0
                })
            }
        })
        
        averages.value = individualTrend
    } else {
        averages.value = trend
    }
}

const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
}

const getGameResult = (game: FirebaseGame) => {
    if (game.status !== 'finished') return 'Unfinished'
    
    const userPlayer = game.players.find(p => p.id === authStore.currentUser?.id)
    if (!userPlayer) return 'N/A'
    
    // If winner ID is stored, use it directly
    if (game.winner) {
        return game.winner === userPlayer.id ? 'Win' : 'Loss'
    }
    
    // Otherwise find the player with the most sets
    const winner = [...game.players].sort((a, b) => b.sets - a.sets)[0]
    
    return winner.id === userPlayer.id ? 'Win' : 'Loss'
}

const getGameResultClass = (game: FirebaseGame) => {
    const result = getGameResult(game)
    if (result === 'Win') return 'bg-green-100 text-green-800'
    if (result === 'Loss') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
}

const getUserGameAverage = (game: FirebaseGame) => {
    const userPlayer = game.players.find(p => p.id === authStore.currentUser?.id)
    return userPlayer?.averagePerTurn || 0
}

const getUserHighScore = (game: FirebaseGame) => {
    const userPlayer = game.players.find(p => p.id === authStore.currentUser?.id)
    return userPlayer?.highestTurn || 0
}

const getOpponentName = (game: FirebaseGame) => {
    if (game.players.length < 2) return 'N/A'
    
    const userPlayer = game.players.find(p => p.id === authStore.currentUser?.id)
    if (!userPlayer) return 'N/A'
    
    // Find the opponent (assuming 2-player game)
    const opponent = game.players.find(p => p.id !== authStore.currentUser?.id)
    if (!opponent) return 'N/A'
    
    // Return the player name
    // Note: For new games created after the Firestore user system, 
    // player.name will contain the Firestore username.
    // For legacy games, it may still contain email-based usernames.
    return opponent.name || 'Unknown Player'
}

const viewGameDetails = (gameId: string) => {
    // Navigate to game details page
    navigateTo(`/game/${gameId}/analytics`)
}

// Lifecycle
onMounted(() => {
    loadUserGames()
})
</script>
