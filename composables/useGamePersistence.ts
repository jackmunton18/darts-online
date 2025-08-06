import { ref, computed, watch, onMounted } from 'vue'
import { useFirebaseDartsGame } from './useFirebaseDartsGame'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

interface StoredGameSession {
  gameId: string
  gameCode: string
  status: string
  role: 'player' | 'spectator' | 'host'
  timestamp: number
  playerName?: string
}

export const useGamePersistence = () => {
  const dartsGame = useFirebaseDartsGame()
  const toast = useNotificationStore()
  const authStore = useAuthStore()
  const router = useRouter()

  const activeSessions = ref<StoredGameSession[]>([])
  const isReconnecting = ref(false)
  const hasActiveSession = ref(false)
  const latestSession = ref<StoredGameSession | null>(null)
  
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

        // Find most recent active game that's not finished
        const activeGame = activeSessions.value
          .filter(s => s.status !== 'finished')
          .sort((a, b) => b.timestamp - a.timestamp)[0]
          
        hasActiveSession.value = !!activeGame
        latestSession.value = activeGame || null
      }
    } catch (err) {
      console.error('Error loading active sessions:', err)
      activeSessions.value = []
      hasActiveSession.value = false
      latestSession.value = null
    }
  }

  // Save current game to active sessions
  const saveGameSession = () => {
    if (process.server || !dartsGame.gameId.value || !dartsGame.currentGame.value || !authStore.currentUser) {
      console.log('Cannot save game session: missing data', {
        server: process.server,
        gameId: dartsGame.gameId.value,
        game: !!dartsGame.currentGame.value,
        user: !!authStore.currentUser
      })
      return
    }
    
    try {
      loadActiveSessions()
      
      // Determine user's role in the game
      let role: 'player' | 'spectator' | 'host' = 'spectator'
      if (dartsGame.isHost.value) {
        role = 'host'
      } else if (dartsGame.isCurrentUserPlaying.value) {
        role = 'player'
      }
      
      // Check if this game session already exists
      const existingSessionIndex = activeSessions.value.findIndex(s => s.gameId === dartsGame.gameId.value)
      
      const player = dartsGame.currentGame.value.players.find((p: any) => p.id === authStore.currentUser?.id)
      
      console.log('Saving game session', {
        gameId: dartsGame.gameId.value,
        gameCode: dartsGame.currentGame.value.gameCode,
        status: dartsGame.currentGame.value.status,
        role
      })
      
      const session: StoredGameSession = {
        gameId: dartsGame.gameId.value!,
        gameCode: dartsGame.currentGame.value.gameCode,
        status: dartsGame.currentGame.value.status,
        role,
        timestamp: Date.now(),
        playerName: player?.name
      }
      
      // Update or add session
      if (existingSessionIndex >= 0) {
        activeSessions.value[existingSessionIndex] = session
      } else {
        activeSessions.value.push(session)
      }
      
      // Save to localStorage
      localStorage.setItem('darts_active_sessions', JSON.stringify(activeSessions.value))
      
      // Update reactive state
      hasActiveSession.value = session.status !== 'finished'
      if (hasActiveSession.value) {
        latestSession.value = session
      }
    } catch (err) {
      console.error('Error saving game session:', err)
    }
  }

  // Remove a game session
  const removeGameSession = (sessionGameId: string) => {
    if (process.server) return
    
    try {
      loadActiveSessions()
      activeSessions.value = activeSessions.value.filter(s => s.gameId !== sessionGameId)
      localStorage.setItem('darts_active_sessions', JSON.stringify(activeSessions.value))
      
      // Update reactive state
      const activeGame = activeSessions.value
        .filter(s => s.status !== 'finished')
        .sort((a, b) => b.timestamp - a.timestamp)[0]
        
      hasActiveSession.value = !!activeGame
      latestSession.value = activeGame || null
    } catch (err) {
      console.error('Error removing game session:', err)
    }
  }

  // Reconnect to an active game session
  const reconnectToGame = async (sessionGameId: string) => {
    try {
      if (!authStore.currentUser) {
        // Instead of throwing, redirect to login
        router.push('/login')
        toast.addMessage({ 
          type: 'warning', 
          message: 'Please login to reconnect to your game' 
        })
        return false
      }

      isReconnecting.value = true
      
      // Try to find the game in Firebase
      let gameData: any
      try {
        const gameRef = await fetch(`/api/games/${sessionGameId}`)
        
        // Check if the request was successful
        if (!gameRef.ok) {
          removeGameSession(sessionGameId)
          throw new Error(`Failed to fetch game: ${gameRef.status} ${gameRef.statusText}`)
        }
        
        gameData = await gameRef.json()
        
        if (!gameData || gameData.error) {
          removeGameSession(sessionGameId)
          throw new Error('Game not found or has expired')
        }
        
        // If game is finished, remove from active sessions
        if (gameData.status === 'finished') {
          removeGameSession(sessionGameId)
          throw new Error('Game has already finished')
        }
      } catch (fetchErr) {
        removeGameSession(sessionGameId)
        throw new Error(`Failed to reconnect: ${fetchErr instanceof Error ? fetchErr.message : 'Network error'}`)
      }
      
      // Subscribe to the game
      if (typeof dartsGame.subscribeToGame === 'function') {
        await dartsGame.subscribeToGame(sessionGameId)
      } else {
        throw new Error('Game service not properly initialized')
      }
      
      // Navigate to the game page if not already there
      if (sessionGameId && !router.currentRoute.value.path.includes(`/game/${sessionGameId}`)) {
        router.push(`/game/${sessionGameId}`)
      }
      
      toast.addMessage({ 
        type: 'success', 
        message: 'Reconnected to game' 
      })
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reconnect to game'
      toast.addMessage({ type: 'error', message })
      return false
    } finally {
      isReconnecting.value = false
    }
  }

  // Set up watchers
  watch(() => dartsGame.currentGame.value?.status, (newStatus, oldStatus) => {
    if (newStatus && dartsGame.gameId.value) {
      // Game state changed, update storage
      saveGameSession()
      
      // If game finished, clean up
      if (newStatus === 'finished') {
        setTimeout(() => {
          removeGameSession(dartsGame.gameId.value!)
        }, 2000)
      }
    }
  })
  
  // When leaving game, save session
  watch(() => dartsGame.gameId.value, (newId, oldId) => {
    // Store the current game status before it gets nulled out
    const wasFinished = dartsGame.currentGame.value?.status === 'finished'
    
    // If we're leaving a game that wasn't finished, save the session
    if (!newId && oldId && !wasFinished) {
      // User left an active game, save session
      saveGameSession()
    }
  })
  
  // On component mount, check for active sessions
  onMounted(() => {
    if (!process.server) {
      loadActiveSessions()
    }
  })
  
  // Before page unload, save current game state
  if (!process.server) {
    window.addEventListener('beforeunload', () => {
      if (dartsGame.currentGame.value && dartsGame.gameId.value) {
        saveGameSession()
      }
    })
  }

  return {
    activeSessions,
    hasActiveSession,
    latestSession,
    isReconnecting,
    loadActiveSessions,
    saveGameSession,
    removeGameSession,
    reconnectToGame
  }
}
