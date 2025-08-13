<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white shadow-md rounded-lg p-4 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Darts Games</h1>
            <p class="text-gray-700 mb-2">
                <!-- TODO Translate -->
                Create a game session or join an existing one with a game code. Track scores in real-time and compete with friends!
            </p>
            
            <div v-if="error" class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
                <p>{{ errorMessage }}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <button 
                @click="navigateToVersus"
                class="w-full bg-blue-600 text-white py-12 px-4 rounded-md hover:bg-blue-700 text-base font-medium touch-manipulation flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                style="min-height: 52px;"
            >
                <!-- TODO Translate -->
                Versus Mode
            </button>
            <button 
                @click="navigateToTournament"
                class="w-full bg-green-600 text-white py-12 px-4 rounded-md hover:bg-green-700 text-base font-medium touch-manipulation flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                style="min-height: 52px;"
            >
                <!-- TODO Translate -->
                Tournament Mode
            </button>
            <!-- Quick Actions -->
            <!-- <div class="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
                
                <div class="space-y-4">
                    
                    <div class="text-center text-sm text-gray-500">
                        Start a new match or join with a game code
                    </div>
                </div>
            </div> -->

            <!-- Active Games List -->
            <div class="bg-white rounded-lg shadow-md p-4 md:p-6 max-h-[600px] home-panels overflow-auto">
                <!-- TODO Translate -->
                <h3 class="text-lg font-semibold mb-4">My Active Games</h3>

                <div v-if="isLoading" class="flex justify-center py-6">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
                
                <div v-else-if="activeGames.length === 0" class="text-center py-6 text-gray-500">
                    <!-- TODO Translate -->
                    <p>No active games found.</p>
                    <p class="text-sm mt-2">Create a game or join one with a game code to get started!</p>
                </div>
                
                <div v-else class="space-y-4">
                    <div 
                        v-for="game in activeGames" 
                        :key="game.gameId" 
                        class="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition cursor-pointer touch-manipulation"
                        @click="navigateToGame(game.gameId)"
                    >
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                            <div>
                                <div class="font-medium text-base">
                                    <!-- TODO Translate -->
                                    Game Code: <span class="text-blue-600">{{ game.gameCode }}</span>
                                </div>
                                <div class="text-sm text-gray-500 mt-1">
                                    <!-- TODO Translate -->
                                    Role: {{ formatRole(game.role) }}
                                </div>
                                <div class="text-sm text-gray-500">
                                    <!-- TODO Translate -->
                                    Status: 
                                    <span :class="{
                                        'text-yellow-600': game.status === 'waiting',
                                        'text-green-600': game.status === 'playing',
                                        'text-red-600': game.status === 'finished'
                                    }">
                                        {{ formatStatus(game.status) }}
                                    </span>
                                </div>
                                <div class="text-sm text-gray-500">
                                    Created {{ formatRelativeTime(game.timestamp) }}
                                </div>
                            </div>
                            <button 
                                class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
                                @click.stop="navigateToGame(game.gameId)"
                            >
                                <!-- TODO Translate -->
                                {{ game.status === 'waiting' ? 'Join Lobby' : 'Continue Game' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Finished Games List -->
            <div class="bg-white rounded-lg shadow-md p-4 md:p-6 max-h-[600px] home-panels overflow-auto">
                <!-- TODO Translate -->
                <h3 class="text-lg font-semibold mb-4">Recent Finished Games</h3>

                <div v-if="isLoadingFinished" class="flex justify-center py-6">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
                
                <div v-else-if="finishedGames.length === 0" class="text-center py-6 text-gray-500">
                    <!-- TODO Translate -->
                    <p>No finished games found.</p>
                    <p class="text-sm mt-2">Your completed games will appear here.</p>
                </div>
                
                <div v-else class="space-y-4">
                    <div 
                        v-for="game in finishedGames" 
                        :key="game.gameId" 
                        class="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition cursor-pointer touch-manipulation"
                        @click="navigateToGameAnalytics(game.gameId)"
                    >
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div class="flex-1">
                                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                    <div class="font-medium">
                                        <!-- TODO Translate -->
                                        Game Code: <span class="text-gray-600">{{ game.gameCode }}</span>
                                    </div>
                                    <button 
                                        class="bg-gray-500 text-white py-1 px-3 rounded text-xs hover:bg-gray-600"
                                        @click.stop="navigateToGameAnalytics(game.gameId)"
                                    >
                                        <!-- TODO Translate -->
                                        Analytics
                                    </button>
                                </div>
                                
                                <!-- Game Details -->
                                <div class="space-y-1 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">
                                            <!-- TODO Translate -->
                                            Opponent:
                                        </span>
                                        <span class="font-medium">{{ getOpponentName(game) }}</span>
                                    </div>
                                    
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">
                                            <!-- TODO Translate -->
                                            Result:
                                        </span>
                                        <span :class="getResultColor(game)">{{ getGameResult(game) }}</span>
                                    </div>
                                    
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">
                                            <!-- TODO Translate -->
                                            Final Score:
                                        </span>
                                        <span class="font-medium">{{ getFinalScore(game) }}</span>
                                    </div>
                                    
                                    
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">
                                            <!-- TODO Translate -->
                                            Role:
                                        </span>
                                        <span>{{ formatRole(game.role) }}</span>
                                    </div>
                                    
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">
                                            <!-- TODO Translate -->
                                            Finished:
                                        </span>
                                        <span>{{ formatRelativeTime(game.timestamp) }}</span>
                                    </div>
                                </div>
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
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'
import { formatDistanceToNow } from 'date-fns'
import { collection, query, where, getDocs } from 'firebase/firestore'

// Get the router, route, and notification store
const router = useRouter()
const route = useRoute()
const toast = useNotificationStore()

// Check if there was an error redirected from middleware
const error = route.query.error
const redirectPath = route.query.path as string || ''

// State for handling redirects
const isRedirecting = ref(false)
const redirectError = ref('')

// Generate appropriate error message
const errorMessage = computed(() => {
    if (isRedirecting.value) {
        return 'Attempting to reconnect to your game session...'
    }
    
    if (redirectError.value) {
        return redirectError.value
    }
    
    if (error === 'direct-access' && redirectPath) {
        return `The page ${redirectPath} cannot be accessed directly in static mode. We'll try to reconnect you.`
    }
    
    return 'An error occurred while accessing the games.'
})

const isLoading = ref(true)
const isLoadingFinished = ref(true)
const apiGames = ref<any[]>([])
const finishedApiGames = ref<any[]>([])

// Combine local storage games and API games
const activeGames = computed(() => {
    // Only use API games now that Firebase Admin is working
    return apiGames.value.map(game => ({
        gameId: game.id,
        gameCode: game.gameCode,
        status: game.status,
        role: game.role,
        timestamp: new Date(game.createdAt).getTime()
    })).filter(session => session.status !== 'finished')
})

const finishedGames = computed(() => {
    // Get finished games directly from finishedApiGames
    return finishedApiGames.value.map(game => ({
        gameId: game.id,
        gameCode: game.gameCode,
        status: game.status,
        role: game.role || 'player', // Default to player if role is not defined
        timestamp: new Date(game.createdAt).getTime(),
        finishedAt: game.finishedAt ? new Date(game.finishedAt).getTime() : null,
        players: game.players || [],
        hostId: game.hostId,
        winner: game.winner,
        abandonedBy: game.abandonedBy
    }))
      .sort((a, b) => (b.finishedAt || b.timestamp) - (a.finishedAt || a.timestamp)) // Sort by finish time or creation time
      .slice(0, 10) // Show only the 10 most recent finished games
})

// Navigate to a specific game
const navigateToGame = async (gameId: string) => {
    try {
        // Navigate directly to the game page - the game page will handle subscription
        router.push(`/game/${gameId}`)
    } catch (err) {
        toast.addMessage({
            type: 'error',
            message: 'Failed to navigate to game'
        })
    }
}

// Navigate to versus page
const navigateToVersus = () => {
    router.push('/versus')
}

// Navigate to tournament page
const navigateToTournament = () => {
    router.push('/tournament')
}

// Navigate to game analytics
const navigateToGameAnalytics = async (gameId: string) => {
    try {
        // Navigate to the analytics page for the finished game
        router.push(`/game/${gameId}/analytics`)
    } catch (err) {
        toast.addMessage({
            type: 'error',
            message: 'Failed to navigate to analytics'
        })
    }
}

// Format helpers
const formatRole = (role: string): string => {
    if (role === 'host') return 'Host'
    if (role === 'player') return 'Player'
    return 'Spectator'
}

const formatStatus = (status: string): string => {
    if (status === 'waiting') return 'Waiting'
    if (status === 'playing') return 'In Progress'
    return 'Finished'
}

const formatRelativeTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

// Helper functions for finished games display
const getOpponentName = (game: any): string => {
    const authStore = useAuthStore()
    const currentUserId = authStore.currentUser?.id
    
    if (!game.players || game.players.length < 2) {
        return 'No opponent'
    }

    
    // Find the opponent (the player who is not the current user)
    const opponent = game.players.find((player: any) => player.id !== currentUserId)
    console.log(opponent)
    return opponent ? (opponent.name || 'Unknown Player') : 'Unknown'
}

const getGameResult = (game: any): string => {
    const authStore = useAuthStore()
    const currentUserId = authStore.currentUser?.id
    
    if (game.abandonedBy) {
        if (game.abandonedBy === currentUserId) {
            return 'Abandoned (You)'
        } else {
            return 'Won (Opponent abandoned)'
        }
    }
    
    if (game.winner) {
        if (game.winner === currentUserId) {
            return 'Won'
        } else {
            return 'Lost'
        }
    }
    
    return 'Unknown'
}

const getResultColor = (game: any): string => {
    const authStore = useAuthStore()
    const currentUserId = authStore.currentUser?.id
    
    if (game.abandonedBy) {
        if (game.abandonedBy === currentUserId) {
            return 'text-red-600 font-medium' // Abandoned by user
        } else {
            return 'text-green-600 font-medium' // Won due to opponent abandoning
        }
    }
    
    if (game.winner) {
        if (game.winner === currentUserId) {
            return 'text-green-600 font-medium' // Won
        } else {
            return 'text-red-600 font-medium' // Lost
        }
    }
    
    return 'text-gray-600'
}

const getFinalScore = (game: any): string => {
    const authStore = useAuthStore()
    const currentUserId = authStore.currentUser?.id
    
    if (!game.players || game.players.length < 2) {
        return 'N/A'
    }
    
    const currentUserPlayer = game.players.find((player: any) => player.id === currentUserId)
    const opponent = game.players.find((player: any) => player.id !== currentUserId)
    
    if (!currentUserPlayer || !opponent) {
        return 'N/A'
    }
    
    return `${currentUserPlayer.sets}-${opponent.sets}`
}

const getAbandonedByName = (game: any): string => {
    const authStore = useAuthStore()
    const currentUserId = authStore.currentUser?.id
    
    if (!game.abandonedBy) {
        return ''
    }
    
    if (game.abandonedBy === currentUserId) {
        return 'You'
    }
    
    const abandonedPlayer = game.players?.find((player: any) => player.id === game.abandonedBy)
    return abandonedPlayer ? abandonedPlayer.name : 'Unknown'
}

// Function to fetch games from API
const fetchActiveGames = async () => {
    try {
        isLoading.value = true
        
        // Try to fetch from API if user is logged in
        const authStore = useAuthStore()
        // console.log('Auth store state:', {
        //     isAuthenticated: authStore.isAuthenticated,
        //     user: authStore.user
        // })
        
        if (authStore.isAuthenticated) {
            try {
                // Get current user's active games directly from Firestore
                const { $firestore } = useNuxtApp()
                if ($firestore && authStore.currentUser) {
                    const userId = authStore.currentUser.id
                    
                    // Query for active games (we'll filter client-side for user participation)
                    const activeGamesQuery = query(
                        collection($firestore, 'games'),
                        where('status', 'in', ['waiting', 'playing'])
                    )
                    
                    const gamesSnapshot = await getDocs(activeGamesQuery)
                    const allActiveGames = gamesSnapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                        finishedAt: doc.data().finishedAt?.toDate?.() || null
                    }))
                    
                    // Filter games where user is a player or spectator
                    const fetchedApiGames = allActiveGames.filter((game: any) => {
                        const isPlayer = game.players?.some((player: any) => player.id === userId)
                        const isSpectator = game.spectators?.includes(userId)
                        const isHost = game.hostId === userId
                        return isPlayer || isSpectator || isHost
                    })
                    
                    // Set the apiGames ref
                    apiGames.value = fetchedApiGames || []
                } else {
                    apiGames.value = []
                }
            } catch (apiError) {
                console.error('Firestore fetch error:', apiError)
                apiGames.value = []
            }
        } else {
            // console.log('User not authenticated, no games to fetch')
            apiGames.value = []
        }
    } catch (error) {
        console.error('Error fetching games:', error)
    } finally {
        isLoading.value = false
    }
}

// Function to fetch finished games
const fetchFinishedGames = async () => {
    try {
        isLoadingFinished.value = true
        
        const authStore = useAuthStore()
        
        if (authStore.isAuthenticated) {
            try {
                // Get current user's finished games directly from Firestore
                const { $firestore } = useNuxtApp()
                if ($firestore && authStore.currentUser) {
                    const userId = authStore.currentUser.id
                    
                    // Query for finished games, ordered by finishedAt
                    const finishedGamesQuery = query(
                        collection($firestore, 'games'),
                        where('status', '==', 'finished'),
                        // We'll filter for the current user's games client side
                    )
                    
                    const gamesSnapshot = await getDocs(finishedGamesQuery)
                    const allFinishedGames = gamesSnapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                        finishedAt: doc.data().finishedAt?.toDate?.() || null
                    }))
                    
                    // Filter games where user is a player or host
                    const fetchedFinishedGames = allFinishedGames.filter((game: any) => {
                        const isPlayer = game.players?.some((player: any) => player.id === userId)
                        const isHost = game.hostId === userId
                        return isPlayer || isHost
                    })
                    
                    // Set the finishedApiGames ref
                    finishedApiGames.value = fetchedFinishedGames || []
                } else {
                    finishedApiGames.value = []
                }
            } catch (apiError) {
                console.error('Firestore fetch error:', apiError)
                finishedApiGames.value = []
            }
        } else {
            finishedApiGames.value = []
        }
    } catch (error) {
        console.error('Error fetching finished games:', error)
    } finally {
        isLoadingFinished.value = false
    }
}

// Handle redirected game URLs
const handleGameRedirect = async (path: string) => {
    // Extract game ID from path (format: /game/ID or /game/ID/analytics)
    const gameIdMatch = path.match(/\/game\/([^\/]+)/)
    if (!gameIdMatch || !gameIdMatch[1]) return
    
    const gameId = gameIdMatch[1]
    isRedirecting.value = true
    
    try {
        // Import the game persistence composable
        const { loadActiveSessions } = useGamePersistence()
        loadActiveSessions()
        
        // Use the Firebase Darts Game composable to reconnect
        const dartsGame = useFirebaseDartsGame()
        
        if (typeof dartsGame.subscribeToGame !== 'function') {
            throw new Error('Game service not properly initialized')
        }
        
        // Subscribe to the game
        await dartsGame.subscribeToGame(gameId)
        
        // Use small delay to ensure subscriptions are active
        setTimeout(() => {
            // If analytics path, go to analytics
            if (path.includes('/analytics')) {
                router.push(`/game/${gameId}/analytics`)
            } else {
                router.push(`/game/${gameId}`)
            }
        }, 500)
    } catch (err) {
        console.error('Failed to reconnect to game:', err)
        redirectError.value = `Failed to reconnect to game session: ${err instanceof Error ? err.message : 'Unknown error'}`
    } finally {
        isRedirecting.value = false
    }
}

// Load active games on mount
onMounted(async () => {
    // Handle direct game URL redirect
    if (error === 'direct-access' && redirectPath) {
        handleGameRedirect(redirectPath)
    }
    
    // Handle reconnect requests from the 404 page
    if (route.query.reconnect === 'true') {
        fetchActiveGames()
    }
    
    // Load games
    fetchActiveGames()
    fetchFinishedGames()
})
</script>
