import { ref, computed, onBeforeUnmount, watch } from 'vue'
import {
  collection, doc, addDoc, getDoc, getFirestore, updateDoc, onSnapshot,
  query, where, getDocs, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { useNuxtApp } from '#app'
import type { Player, GameState, Turn, DartThrow } from '~/stores/game'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useRouter, useRoute } from 'vue-router'


export interface FirebaseGame extends Omit<GameState, 'createdAt' | 'finishedAt'> {
  createdAt: Timestamp
  finishedAt?: Timestamp
  hostId: string
  spectators: string[]
}

interface StoredGameSession {
  gameId: string
  gameCode: string
  status: string
  role: 'player' | 'spectator' | 'host'
  timestamp: number
}

// Global state (singleton pattern)
const globalCurrentGame = ref<FirebaseGame | null>(null)
const globalGameId = ref<string | null>(null)
const globalTurns = ref<Turn[]>([])
const globalIsLoading = ref(false)
const globalError = ref<string | null>(null)
const globalUnsubscribeGame = ref<(() => void) | null>(null)
const globalUnsubscribeTurns = ref<(() => void) | null>(null)
const globalIsNavigatingAway = ref(false)
const globalActiveSessions = ref<StoredGameSession[]>([])
const globalIsReconnecting = ref(false)

export const useFirebaseDartsGame = () => {
  // Check if we're on the client side before accessing Firebase
  if (process.server) {
    // Return minimal state for SSR
    return {
      currentGame: ref<FirebaseGame | null>(null),
      gameId: ref<string | null>(null),
      turns: ref<Turn[]>([]),
      isLoading: ref(false),
      error: ref<string | null>(null),
      isHost: computed(() => false),
      isCurrentUserPlaying: computed(() => false),
      currentPlayer: computed(() => null),
      gameStats: computed(() => null),
      createGame: () => Promise.resolve(''),
      joinGame: () => Promise.resolve(false),
      leaveGame: () => Promise.resolve(),
      addSpectator: () => Promise.resolve(),
      startGame: () => Promise.resolve(),
      endGame: () => Promise.resolve(),
      addTurn: () => Promise.resolve(),
      loadActiveGames: () => Promise.resolve(),
      loadActiveSessions: () => Promise.resolve()
    }
  }

  const { $firestore } = useNuxtApp()
  const db = getFirestore()
  const toast = useNotificationStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  // Use global state instead of local refs
  const currentGame = globalCurrentGame
  const gameId = globalGameId
  const turns = globalTurns
  const isLoading = globalIsLoading
  const error = globalError
  const unsubscribeGame = globalUnsubscribeGame
  const unsubscribeTurns = globalUnsubscribeTurns
  const isNavigatingAway = globalIsNavigatingAway
  const activeSessions = globalActiveSessions
  const isReconnecting = globalIsReconnecting

  // Computed properties
  const isHost = computed(() => {
    if (!currentGame.value || !authStore.currentUser) return false
    return currentGame.value.hostId === authStore.currentUser.id
  })

  const currentPlayer = computed(() => {
    if (!currentGame.value || currentGame.value.players.length === 0) return null
    return currentGame.value.players[currentGame.value.currentPlayerIndex]
  })

  const isCurrentUserPlaying = computed(() => {
    if (!currentGame.value || !authStore.currentUser) return false
    return currentGame.value.players.some(p => p.id === authStore.currentUser?.id)
  })

  const isSpectating = computed(() => {
    if (!currentGame.value || !authStore.currentUser) return false
    return currentGame.value.spectators.includes(authStore.currentUser.id) && 
      !currentGame.value.players.some(p => p.id === authStore.currentUser?.id)
  })

  // Generate a unique game code
  const generateGameCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Create a new game
  const createGame = async (gameConfig: { 
    gameType: string; 
    legsToWin: number; 
    setsToWin: number;
    startingScore: number;
  }) => {
    try {
      if (!authStore.currentUser) {
        throw new Error('User not authenticated')
      }

      isLoading.value = true
      error.value = null

      const gameCode = generateGameCode()
      
      const initialPlayer: Player = {
        id: authStore.currentUser.id,
        name: userStore.user?.username || userStore.user?.firstName || authStore.currentUser.name || 'Player 1',
        currentScore: gameConfig.startingScore || 501,
        legs: 0,
        sets: 0,
        totalThrows: 0,
        totalScore: 0,
        averagePerTurn: 0,
        throwsOver100: 0,
        doublesHit: 0,
        triplesHit: 0,
        singlesHit: 0,
        bullsHit: 0,
        checkoutAttempts: 0,
        successfulCheckouts: 0,
        highestCheckout: 0,
        highestTurn: 0,
        totalTurns: 0,
        checkoutPercentage: 0
      }

      const gameData: Omit<FirebaseGame, 'id'> = {
        gameCode,
        status: 'waiting',
        gameType: gameConfig.gameType,
        legsToWin: gameConfig.legsToWin,
        setsToWin: gameConfig.setsToWin,
        currentPlayerIndex: 0,
        currentLeg: 1,
        currentSet: 1,
        players: [initialPlayer],
        hostId: authStore.currentUser.id,
        spectators: [],
        totalThrows: 0,
        totalTurns: 0,
        currentTurnThrows: 0,
        createdAt: serverTimestamp() as Timestamp
      }

      const gamesCollection = collection(db, 'dartsGames')
      const docRef = await addDoc(gamesCollection, gameData)
      
      gameId.value = docRef.id
      
      // Start listening for game updates
      subscribeToGame(docRef.id)
      
      toast.addMessage({ 
        type: 'success', 
        message: 'Game created successfully' 
      })
      
      return { gameId: docRef.id, gameCode }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create game'
      error.value = message
      toast.addMessage({ 
        type: 'error', 
        message 
      })
      return { gameId: null, gameCode: null, error: message }
    } finally {
      isLoading.value = false
    }
  }

  // Join a game by code
  const joinGame = async (gameCode: string, role: 'player' | 'spectator' = 'player') => {
    try {
      if (!authStore.currentUser) {
        throw new Error('User not authenticated')
      }

      isLoading.value = true
      error.value = null

      // Use server API to join game (avoids Firestore permission issues)
      const token = await authStore.getIdToken()
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameCode, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join game')
      }

      if (!data.gameId) {
        throw new Error('Invalid response from server')
      }

      // Subscribe to the game
      gameId.value = data.gameId
      subscribeToGame(data.gameId)

      toast.addMessage({ 
        type: 'success', 
        message: data.message || (role === 'player' ? 'Joined game as player' : 'Now spectating game')
      })

      return { gameId: data.gameId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join game'
      error.value = message
      toast.addMessage({ type: 'error', message })
      return { gameId: null, error: message }
    } finally {
      isLoading.value = false
    }
  }

  // Start the game (host only)
  const startGame = async () => {
    try {
      if (!gameId.value || !isHost.value) {
        throw new Error('Not authorized to start game')
      }

      if (!currentGame.value || currentGame.value.players.length < 2) {
        throw new Error('Cannot start game without 2 players')
      }

      isLoading.value = true
      error.value = null

      const gameRef = doc(db, 'dartsGames', gameId.value)
      
      // Initialize the first leg and set data
      const now = new Date().toISOString()
      
      // Initialize set player stats
      const setPlayerStats: Record<string, any> = {}
      currentGame.value.players.forEach(p => {
        setPlayerStats[p.id] = {
          legsWon: 0,
          totalThrows: 0,
          totalScore: 0,
          averagePerTurn: 0
        }
      })
      
      const firstSetData = {
        setNumber: 1,
        startTimestamp: now,
        legs: [],
        playerStats: setPlayerStats
      }
      
      // Initialize leg player stats
      const legPlayerStats: Record<string, any> = {}
      currentGame.value.players.forEach(p => {
        legPlayerStats[p.id] = {
          dartsThrown: 0,
          totalScore: 0,
          turns: 0,
          averagePerTurn: 0,
          highestScore: 0,
          checkoutAttempts: 0,
          checkoutSuccess: false
        }
      })
      
      // Initialize first leg data
      const firstLegData = {
        legNumber: 1,
        setNumber: 1,
        startPlayerId: currentGame.value.players[0].id, // First player starts the first leg
        startTimestamp: now,
        totalThrows: 0,
        playerStats: legPlayerStats
      }
      
      // Update the game document
      await updateDoc(gameRef, {
        status: 'playing',
        currentLegData: firstLegData,
        currentSetData: firstSetData,
        legsData: {},
        setsData: {}
      })
      
      toast.addMessage({ 
        type: 'success', 
        message: 'Game started' 
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game'
      error.value = message
      toast.addMessage({ type: 'error', message })
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Record a throw for the current player
  const recordThrow = async (dartThrows: DartThrow[]) => {
    try {
      if (!gameId.value || !currentGame.value || !currentPlayer.value) {
        throw new Error('No active game')
      }

      // Only allow the current player or host to record throws
      if (!isHost.value && currentPlayer.value.id !== authStore.currentUser?.id) {
        throw new Error('Not your turn')
      }

      isLoading.value = true
      error.value = null

      // Debug logging
      console.log('Recording throw via API:', {
        gameId: gameId.value,
        playerId: currentPlayer.value.id,
        dartThrows
      })
      
      // Use server API to record throw (avoids Firestore permission issues)
      const token = await authStore.getIdToken()
      const response = await fetch(`/api/games/${gameId.value}/record-throw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dartThrows })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record throw')
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record throw'
      error.value = message
      toast.addMessage({ type: 'error', message })
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  // Leave the game
  const leaveGame = async () => {
    try {
      if (!gameId.value || !currentGame.value) {
        throw new Error('No active game')
      }

      isLoading.value = true
      error.value = null
      
      const gameRef = doc(db, 'dartsGames', gameId.value)
      
      if (isHost.value) {
        // If host leaves, end the game
        await updateDoc(gameRef, {
          status: 'finished',
          finishedAt: serverTimestamp()
        })
      } else if (isCurrentUserPlaying.value) {
        // Remove player from the game
        const updatedPlayers = currentGame.value.players
          .filter(p => p.id !== authStore.currentUser?.id)
        
        await updateDoc(gameRef, { players: updatedPlayers })
      } else if (isSpectating.value) {
        // Remove from spectators
        const updatedSpectators = currentGame.value.spectators
          .filter(id => id !== authStore.currentUser?.id)
        
        await updateDoc(gameRef, { spectators: updatedSpectators })
      }
      
      unsubscribeFromGame()
      gameId.value = null
      currentGame.value = null
      
      toast.addMessage({ 
        type: 'info', 
        message: 'Left the game' 
      })
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave game'
      error.value = message
      toast.addMessage({ type: 'error', message })
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Subscribe to game updates
  const subscribeToGame = (id: string) => {
    // Unsubscribe from any previous subscriptions
    unsubscribeFromGame()
    
    gameId.value = id
    
    // Listen for game document updates
    const gameRef = doc(db, 'dartsGames', id)
    unsubscribeGame.value = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        currentGame.value = { 
          ...snapshot.data() as FirebaseGame,
          id: snapshot.id 
        }
      } else {
        error.value = 'Game not found'
        currentGame.value = null
        gameId.value = null
      }
    }, (err) => {
      error.value = err.message
      toast.addMessage({ 
        type: 'error', 
        message: `Error getting game updates: ${err.message}` 
      })
    })
    
    // Listen for turn history
    const turnsCollection = collection(db, 'dartsGames', id, 'turns')
    const turnsQuery = query(turnsCollection)
    unsubscribeTurns.value = onSnapshot(turnsQuery, (snapshot) => {
      const turnsList: Turn[] = []
      snapshot.forEach(doc => {
        turnsList.push(doc.data() as Turn)
      })
      
      // Sort turns by timestamp
      turns.value = turnsList.sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      })
    })
  }

  // Unsubscribe from game updates
  const unsubscribeFromGame = () => {
    if (unsubscribeGame.value) {
      unsubscribeGame.value()
      unsubscribeGame.value = null
    }
    
    if (unsubscribeTurns.value) {
      unsubscribeTurns.value()
      unsubscribeTurns.value = null
    }
  }

  // Load active sessions from localStorage
  const loadActiveSessions = () => {
    if (process.server) return
    
    try {
      const storedSessions = localStorage.getItem('darts_active_sessions')
      if (storedSessions) {
        activeSessions.value = JSON.parse(storedSessions)
        
        // Clean up sessions older than 48 hours
        const now = Date.now()
        const TWO_DAYS_MS = 48 * 60 * 60 * 1000
        activeSessions.value = activeSessions.value.filter(session => {
          return now - session.timestamp < TWO_DAYS_MS
        })
        
        // Save filtered list back to localStorage
        localStorage.setItem('darts_active_sessions', JSON.stringify(activeSessions.value))
      }
    } catch (err) {
      console.error('Error loading active sessions:', err)
    }
  }

  // Save current game to active sessions
  const saveGameSession = () => {
    if (process.server || !currentGame.value || !authStore.currentUser) return
    
    try {
      loadActiveSessions()
      
      // Determine user's role in the game
      let role: 'player' | 'spectator' | 'host' = 'spectator'
      if (isHost.value) {
        role = 'host'
      } else if (isCurrentUserPlaying.value) {
        role = 'player'
      }
      
      // Check if this game session already exists
      const existingSessionIndex = activeSessions.value.findIndex(s => s.gameId === gameId.value)
      
      const session: StoredGameSession = {
        gameId: gameId.value!,
        gameCode: currentGame.value.gameCode,
        status: currentGame.value.status,
        role,
        timestamp: Date.now()
      }
      
      // Update or add session
      if (existingSessionIndex >= 0) {
        activeSessions.value[existingSessionIndex] = session
      } else {
        activeSessions.value.push(session)
      }
      
      // Save to localStorage
      localStorage.setItem('darts_active_sessions', JSON.stringify(activeSessions.value))
    } catch (err) {
      console.error('Error saving game session:', err)
    }
  }

  // Remove a game session
  const removeGameSession = (sessionGameId: string) => {
    
  }

  /**
   * Abandon a game, marking it as finished and setting the winner to the other player
   */
  interface AbandonGameResponse {
    success: boolean;
    message: string;
    gameId: string;
    abandonedBy: string;
    winner: string | null;
  }
  
  const abandonGame = async (gameId: string, userId: string) => {
    try {
      const response = await $fetch<AbandonGameResponse>(`/api/games/${gameId}/abandon`, {
        method: 'POST',
        body: { userId }
      })
      
      if (response.success) {
        // If this is the current game, update its status locally
        if (currentGame.value && currentGame.value.id === gameId) {
          currentGame.value.status = 'finished'
          currentGame.value.abandonedBy = userId
          currentGame.value.winner = response.winner || undefined
          
          if (response.winner) {
            // Update the player stats for display
            const winningPlayer = currentGame.value.players.find(p => p.id === response.winner)
            if (winningPlayer) {
              winningPlayer.sets = currentGame.value.setsToWin
            }
          }
        }
        
        return {
          success: true,
          gameId: response.gameId
        }
      } else {
        throw new Error('Failed to abandon game')
      }
    } catch (error) {
      console.error('Error abandoning game:', error)
      throw new Error('Failed to abandon game')
    }
  }
  
  // Cleanup on unmount
  onBeforeUnmount(() => {
    unsubscribeFromGame()
  })

  // Return all the reactive properties and methods
  return {
    // Reactive state
    currentGame,
    gameId,
    turns,
    isLoading,
    error,
    
    // Computed properties
    isHost,
    currentPlayer,
    isCurrentUserPlaying,
    isSpectating,
    
    // Methods
    createGame,
    joinGame,
    startGame,
    recordThrow,
    leaveGame,
    subscribeToGame,
    unsubscribeFromGame,
    abandonGame
  }
}
