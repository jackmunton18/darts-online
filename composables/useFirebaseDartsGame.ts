import { ref, computed, onBeforeUnmount, watch } from 'vue'
import {
  collection, doc, addDoc, getDoc, getFirestore, updateDoc, onSnapshot,
  query, where, getDocs, serverTimestamp, Timestamp, deleteDoc
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
  legStarterIndices?: number[] // Array of player indices that should start legs in order
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
  
  // Use the Firestore instance from our plugin
  if (!$firestore) {
    throw new Error('Firestore not initialized')
  }
  
  const db = $firestore
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

      // Clear any existing game state before creating a new game
      unsubscribeFromGame()

      isLoading.value = true
      error.value = null

      // Ensure user data is loaded for proper display name
      if (!userStore.user) {
        await userStore.fetchUser()
      }
      
      // Debug logging to identify username issues
      console.log('User data for game creation:', {
        username: userStore.user?.username,
        firstName: userStore.user?.firstName,
        lastName: userStore.user?.lastName,
        authName: authStore.currentUser.name,
        authEmail: authStore.currentUser.email
      })

      const gameCode = generateGameCode()
      
      const initialPlayer: Player = {
        id: authStore.currentUser.id,
        name: userStore.user?.username || 
              (userStore.user?.firstName ? `${userStore.user.firstName} ${userStore.user.lastName || ''}`.trim() : null) ||
              authStore.currentUser.email?.split('@')[0] ||
              'Player 1',
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
        // Initialize with alternating player indices for leg starters
        // Will be populated with all player indices once all players join
        legStarterIndices: [0],
        createdAt: serverTimestamp() as Timestamp
      }

      const gamesCollection = collection(db, 'games')
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

      // Clear any existing game state before joining a new game
      unsubscribeFromGame()

      isLoading.value = true
      error.value = null

      // Find game by code using Firestore query
      const gamesQuery = query(
        collection(db, 'games'),
        where('gameCode', '==', gameCode.toUpperCase()),
        where('status', '==', 'waiting')
      )
      
      const gamesSnapshot = await getDocs(gamesQuery)
      
      if (gamesSnapshot.empty) {
        throw new Error('Game not found or already in progress')
      }
      
      const gameDoc = gamesSnapshot.docs[0]
      const gameData = gameDoc.data() as FirebaseGame
      const foundGameId = gameDoc.id
      
      // Check if user is already in the game
      const userId = authStore.currentUser.id
      const isAlreadyPlayer = gameData.players.some(p => p.id === userId)
      const isAlreadySpectator = gameData.spectators?.includes(userId)
      
      if (isAlreadyPlayer || isAlreadySpectator) {
        // User is already in the game, just subscribe to it
        gameId.value = foundGameId
        await subscribeToGame(foundGameId)
        
        // Store session
        saveGameSession()
        
        return { gameId: foundGameId, success: true }
      }
      
      // Get user data from Firestore for proper display name
      const userStore = useUserStore()
      if (!userStore.user) {
        await userStore.fetchUser()
      }
      
      // Debug logging to identify username issues
      console.log('User data for game joining:', {
        username: userStore.user?.username,
        firstName: userStore.user?.firstName,
        lastName: userStore.user?.lastName,
        authName: authStore.currentUser.name,
        authEmail: authStore.currentUser.email
      })
      
      // Use preferred username from user profile if available
      const displayName = userStore.user?.username || 
                          (userStore.user?.firstName ? `${userStore.user.firstName} ${userStore.user.lastName || ''}`.trim() : null) ||
                          authStore.currentUser.email?.split('@')[0] ||
                          'Player'
      
      // Add user to the game
      if (role === 'player') {
        if (gameData.players.length >= 4) { // Assuming max 4 players for darts
          throw new Error('Game is full')
        }
        
        // Add as player
        const newPlayer = {
          id: userId,
          name: displayName,
          currentScore: 501, // Standard starting score for 501 darts
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
        
        // Get the current player index in the updated players array
        const playerIndex = gameData.players.length
        
        // Update leg starter indices to include the new player
        const existingIndices = gameData.legStarterIndices || []
        const updatedIndices = [...new Set([...existingIndices, playerIndex])]
        
        // Sort the indices to ensure consistent order
        updatedIndices.sort()
        
        await updateDoc(doc(db, 'games', foundGameId), {
          players: [...gameData.players, newPlayer],
          // Update leg starter indices to include all players
          legStarterIndices: updatedIndices,
          updatedAt: serverTimestamp()
        })
      } else {
        // Add as spectator
        const spectators = gameData.spectators || []
        await updateDoc(doc(db, 'games', foundGameId), {
          spectators: [...spectators, userId],
          updatedAt: serverTimestamp()
        })
      }

      gameId.value = foundGameId
      await subscribeToGame(foundGameId)
      
      // Store session
      saveGameSession()
      
      // Add success notification
      toast.addMessage({
        type: 'success',
        message: role === 'player' ? 'Joined game as player' : 'Now spectating game'
      })

      return { gameId: foundGameId, success: true }
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

      const gameRef = doc(db, 'games', gameId.value)
      
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

  // Helper function to check if a player had a potential checkout
  const hasCheckoutAttempt = (dartThrows: DartThrow[], remainingScore: number): boolean => {
    // A checkout attempt should be counted when:
    // 1. The player's score before the throw is ≤ 170 (maximum possible checkout)
    // 2. The player's score is theoretically possible to checkout (exists in common checkouts)
    
    if (!dartThrows || dartThrows.length === 0) return false
    
    // Calculate score before this turn
    const scoreBeforeTurn = remainingScore + dartThrows.reduce((sum, dart) => sum + dart.score, 0)
    
    // Check if the score before this turn was in checkout range (≤ 170)
    if (scoreBeforeTurn > 170) return false
    
    // Check if the score is a valid checkout score (referring to useDartsScoring commonCheckouts)
    // Common checkout scores are all scores from 2 to 170 that can be checked out
    // For simplicity, we'll consider any score <= 170 and >= 2 as a potential checkout
    return scoreBeforeTurn >= 2 && scoreBeforeTurn <= 170
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

      // Calculate total score for this turn
      const totalScore = dartThrows.reduce((sum, dart) => sum + dart.score, 0)
      
      // Create turn object
      const newTurn: Turn = {
        playerId: currentPlayer.value.id,
        score: totalScore,
        throws: dartThrows,
        remainingScore: currentPlayer.value.currentScore - totalScore,
        timestamp: new Date().toISOString(),
        leg: currentGame.value.currentLeg,
        set: currentGame.value.currentSet,
        turnNumber: globalTurns.value.length + 1
      }

      // Add turn to Firestore turns collection
      await addDoc(collection(db, 'games', gameId.value, 'turns'), newTurn)

      // Update player's score and stats
      let gameFinished = false
      let legCompleted = false
      let setCompleted = false
      let winnerPlayerId: string | null = null
      let currentSet = currentGame.value.currentSet
      let currentLeg = currentGame.value.currentLeg
      let currentStatus = currentGame.value.status
      
      // Use 'let' instead of 'const' to allow reassignment when game is finished
      let updatedPlayers = currentGame.value.players.map(player => {
        if (player.id === currentPlayer.value!.id) {
          // Calculate new score
          const newScore = Math.max(0, player.currentScore - totalScore)
          
          // Basic stats update
          const updatedPlayer = {
            ...player,
            currentScore: newScore,
            totalThrows: player.totalThrows + dartThrows.length,
            totalScore: player.totalScore + totalScore,
            totalTurns: player.totalTurns + 1,
            averagePerTurn: ((player.totalScore + totalScore) / (player.totalTurns + 1)),
            highestTurn: Math.max(player.highestTurn, totalScore)
          }
          
          // Count singles, doubles, triples, and bulls
          dartThrows.forEach(dart => {
            if (dart.multiplier === 'double') {
              updatedPlayer.doublesHit = (updatedPlayer.doublesHit || 0) + 1
            } else if (dart.multiplier === 'triple') {
              updatedPlayer.triplesHit = (updatedPlayer.triplesHit || 0) + 1
            } else if (dart.multiplier === 'single') {
              updatedPlayer.singlesHit = (updatedPlayer.singlesHit || 0) + 1
              // Bulls are counted separately (both single and double bulls)
              if (dart.value === 25) {
                updatedPlayer.bullsHit = (updatedPlayer.bullsHit || 0) + 1
              }
            }
          })
          
          // Update throwsOver100 counter
          if (totalScore > 100) {
            updatedPlayer.throwsOver100 = (updatedPlayer.throwsOver100 || 0) + 1
          }
          
          // Check for checkout (when player reaches exactly 0)
          if (newScore === 0) {
            // In standard darts rules, a checkout must end with a double
            const lastDart = dartThrows[dartThrows.length - 1]
            const validCheckout = lastDart && lastDart.multiplier === 'double'
            
            // Count the successful checkout
            if (validCheckout) {
              updatedPlayer.successfulCheckouts = (updatedPlayer.successfulCheckouts || 0) + 1
              updatedPlayer.highestCheckout = Math.max(updatedPlayer.highestCheckout || 0, totalScore)
            }
            
            // This turn is considered a checkout attempt regardless of if it was successful
            // because the player started with a score that was theoretically checkable
            updatedPlayer.checkoutAttempts = (updatedPlayer.checkoutAttempts || 0) + 1
            
            updatedPlayer.checkoutPercentage = 
              updatedPlayer.checkoutAttempts > 0 ? 
              ((updatedPlayer.successfulCheckouts || 0) / updatedPlayer.checkoutAttempts) * 100 : 0
            
            // Player wins the leg
            legCompleted = true
            updatedPlayer.legs = (updatedPlayer.legs || 0) + 1
            
            // Check for set win
            if (updatedPlayer.legs >= (currentGame.value?.legsToWin || 3)) { // Default to 3 if not set
              setCompleted = true
              updatedPlayer.sets = (updatedPlayer.sets || 0) + 1
              
              // Check for game win
              if (updatedPlayer.sets >= (currentGame.value?.setsToWin || 1)) { // Default to 1 if not set
                gameFinished = true
                winnerPlayerId = player.id
                currentStatus = 'finished'
              } else {
                // New set
                currentSet++
                currentLeg = 1
              }
            } else {
              // Just a new leg in the same set
              currentLeg++
            }
          } else if (hasCheckoutAttempt(dartThrows, newScore)) {
            // Count as a checkout attempt if the player started with a score that was theoretically checkable
            updatedPlayer.checkoutAttempts = (updatedPlayer.checkoutAttempts || 0) + 1
          }
          
          return updatedPlayer
        }
        return player
      })

      // Store the index of the player who won the leg if applicable
      let legWinnerIndex = -1
      if (legCompleted && winnerPlayerId) {
        legWinnerIndex = currentGame.value.players.findIndex(p => p.id === winnerPlayerId)
      }
      
      // If leg was completed but game is not finished, reset all players' scores for the next leg
      if (legCompleted && !gameFinished) {
        updatedPlayers.forEach(player => {
          player.currentScore = 501 // Reset to starting score
        })
      }
      
      // If game is finished, make sure all player data is preserved for analytics
      if (gameFinished) {
        // Make sure we keep ALL players in the game document, not just the current player
        // This ensures all players appear in analytics after game completion
        const allPlayers = [...currentGame.value.players]
        
        // Make sure all player stats are preserved and correctly calculated
        updatedPlayers = allPlayers.map(player => {
          // Find the updated player if it exists in the updatedPlayers array
          const updatedPlayer = updatedPlayers.find(p => p.id === player.id) || player
          
          // Preserve the 'leftGame' flag if it was previously set
          if ((player as any).leftGame) {
            Object.assign(updatedPlayer, { leftGame: true, leftAt: (player as any).leftAt })
          }
          
          // Ensure these fields exist and have proper values for analytics
          updatedPlayer.checkoutAttempts = updatedPlayer.checkoutAttempts || 0
          updatedPlayer.successfulCheckouts = updatedPlayer.successfulCheckouts || 0
          updatedPlayer.highestCheckout = updatedPlayer.highestCheckout || 0
          updatedPlayer.checkoutPercentage = updatedPlayer.checkoutAttempts > 0 ? 
            ((updatedPlayer.successfulCheckouts / updatedPlayer.checkoutAttempts) * 100) : 0
          
          // Keep other analytics-related fields
          updatedPlayer.totalThrows = updatedPlayer.totalThrows || 0
          updatedPlayer.totalScore = updatedPlayer.totalScore || 0
          updatedPlayer.totalTurns = updatedPlayer.totalTurns || 0
          updatedPlayer.averagePerTurn = updatedPlayer.totalTurns > 0 ? 
            (updatedPlayer.totalScore / updatedPlayer.totalTurns) : 0
          updatedPlayer.highestTurn = updatedPlayer.highestTurn || 0
          
          // Ensure throw type counts exist
          updatedPlayer.singlesHit = updatedPlayer.singlesHit || 0
          updatedPlayer.doublesHit = updatedPlayer.doublesHit || 0
          updatedPlayer.triplesHit = updatedPlayer.triplesHit || 0
          updatedPlayer.bullsHit = updatedPlayer.bullsHit || 0
          updatedPlayer.throwsOver100 = updatedPlayer.throwsOver100 || 0
          
          return updatedPlayer
        })
      }

      // Determine next player based on whether a leg was completed
      let nextPlayerIndex: number
      
      if (legCompleted) {
        // For a new leg, we alternate starting players by using the leg number
        // In standard darts rules, players take turns starting legs
        
        // Get the player indices array - if not defined, create default using player count
        const legStarterIndices = currentGame.value.legStarterIndices || 
                                Array.from({ length: currentGame.value.players.length }, (_, i) => i)
        
        // The leg number determines who starts (1-indexed, so subtract 1 for 0-indexed array)
        // We use modulo to cycle through all players
        nextPlayerIndex = legStarterIndices[(currentLeg - 1) % legStarterIndices.length]
      } else {
        // For normal turn progression, just go to the next player in the rotation
        nextPlayerIndex = (currentGame.value.currentPlayerIndex + 1) % currentGame.value.players.length
      }

      // Prepare update data
      const updateData: any = {
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        totalThrows: currentGame.value.totalThrows + dartThrows.length,
        totalTurns: currentGame.value.totalTurns + 1,
        currentTurnThrows: 0, // Reset for next player
        updatedAt: serverTimestamp()
      }
      
      // If a leg was completed, save the leg history
      if (legCompleted) {
        // Create a timestamp to use for this update
        const now = new Date().toISOString()
        
        // Get current leg data (or initialize if missing)
        const currentLegData = currentGame.value.currentLegData || {
          legNumber: currentGame.value.currentLeg,
          setNumber: currentGame.value.currentSet,
          startTimestamp: now,
          totalThrows: 0,
          playerStats: {} as Record<string, any>
        }
        
        // Get the current player's existing leg stats (if any)
        const currentPlayerLegStats = currentLegData.playerStats[currentPlayer.value!.id] || {
          dartsThrown: 0,
          totalScore: 0,
          turns: 0,
          averagePerTurn: 0,
          highestScore: 0,
          checkoutAttempts: 0,
          checkoutSuccess: false
        }
        
        // Update the current leg stats with this turn's data
        const updatedPlayerLegStats = {
          ...currentPlayerLegStats,
          dartsThrown: currentPlayerLegStats.dartsThrown + dartThrows.length,
          totalScore: currentPlayerLegStats.totalScore + totalScore,
          turns: currentPlayerLegStats.turns + 1,
          averagePerTurn: (currentPlayerLegStats.totalScore + totalScore) / (currentPlayerLegStats.turns + 1),
          highestScore: Math.max(currentPlayerLegStats.highestScore, totalScore),
          checkoutAttempts: currentPlayerLegStats.checkoutAttempts + 
                           (hasCheckoutAttempt(dartThrows, updatedPlayers.find(p => p.id === currentPlayer.value!.id)?.currentScore || 0) ? 1 : 0),
          checkoutSuccess: winnerPlayerId === currentPlayer.value!.id,
          singlesHit: currentPlayerLegStats.singlesHit + dartThrows.filter(dart => dart.multiplier === 'single').length,
          doublesHit: currentPlayerLegStats.doublesHit + dartThrows.filter(dart => dart.multiplier === 'double').length,
          triplesHit: currentPlayerLegStats.triplesHit + dartThrows.filter(dart => dart.multiplier === 'triple').length,
          bullsHit: currentPlayerLegStats.bullsHit + dartThrows.filter(dart => dart.value === 25).length,
          throwsOver100: currentPlayerLegStats.throwsOver100 + (totalScore > 100 ? 1 : 0)
        }
        
        // Update the leg data with the updated player stats
        const updatedLegData = {
          ...currentLegData,
          totalThrows: currentLegData.totalThrows + dartThrows.length,
          playerStats: {
            ...currentLegData.playerStats,
            [currentPlayer.value!.id]: updatedPlayerLegStats
          }
        }
        
        // Set end timestamp for completed leg
        const completedLegData = {
          ...updatedLegData,
          endTimestamp: now,
          winnerId: winnerPlayerId,
          winningPlayerId: winnerPlayerId,
          playerStats: updatedLegData.playerStats
        }
        
        // Create a unique key for this leg in the legsData object
        // Use set number and leg number for easy retrieval
        const legKey = `${currentGame.value.currentSet}_${currentGame.value.currentLeg}`
        
        // Update legsData with this completed leg
        // We need to merge with any existing legsData
        const existingLegsData = currentGame.value.legsData || {}
        updateData.legsData = {
          ...existingLegsData,
          [legKey]: completedLegData
        }
        
        // If a set was completed, update the set history as well
        if (setCompleted) {
          const currentSetData = currentGame.value.currentSetData || {
            setNumber: currentGame.value.currentSet,
            startTimestamp: currentLegData.startTimestamp || now,
            playerStats: {}
          }
          
          // Create completed set data
          const completedSetData = {
            ...currentSetData,
            endTimestamp: now,
            winnerId: winnerPlayerId,
            legs: Object.keys(updateData.legsData)
              .filter(key => key.startsWith(`${currentGame.value?.currentSet || 1}_`))
              .map(key => updateData.legsData[key]),
            // Create set-level player stats
            playerStats: currentGame.value.players.reduce((stats: Record<string, any>, player) => {
              const playerData = updatedPlayers.find(p => p.id === player.id) || player
              
              stats[player.id] = {
                legsWon: player.id === winnerPlayerId ? (playerData.legs || 0) : 0,
                totalThrows: playerData.totalThrows || 0,
                totalScore: playerData.totalScore || 0,
                averagePerTurn: playerData.averagePerTurn || 0,
                checkoutPercentage: playerData.checkoutPercentage || 0
              }
              return stats
            }, {})
          }
          
          // Create a unique key for this set
          const setKey = `${currentGame.value.currentSet}`
          
          // Update setsData with this completed set
          const existingSetsData = currentGame.value.setsData || {}
          updateData.setsData = {
            ...existingSetsData,
            [setKey]: completedSetData
          }
          
          // Initialize data for the next set if the game isn't over
          if (!gameFinished) {
            // Create new set data for the next set
            const newSetData = {
              setNumber: currentSet,
              startTimestamp: now,
              playerStats: currentGame.value.players.reduce((stats: Record<string, any>, player) => {
                stats[player.id] = {
                  legsWon: 0,
                  totalThrows: 0,
                  totalScore: 0,
                  averagePerTurn: 0
                }
                return stats
              }, {})
            }
            
            updateData.currentSetData = newSetData
          }
        }
        
        // Initialize data for the next leg if the game isn't over
        if (!gameFinished) {
          // Create new leg data for the next leg
          const newLegData = {
            legNumber: currentLeg,
            setNumber: currentSet,
            startPlayerId: updatedPlayers[nextPlayerIndex].id,
            startTimestamp: now,
            totalThrows: 0,
            playerStats: currentGame.value.players.reduce((stats: Record<string, any>, player) => {
              stats[player.id] = {
                dartsThrown: 0,
                totalScore: 0,
                turns: 0,
                averagePerTurn: 0,
                highestScore: 0,
                checkoutAttempts: 0,
                checkoutSuccess: false
              }
              return stats
            }, {})
          }
          
          updateData.currentLegData = newLegData
        }
        
        // Update leg and set numbers
        updateData.currentLeg = currentLeg
        if (setCompleted) {
          updateData.currentSet = currentSet
        }
      } else {
        // If leg is not completed, still update the current leg data with this turn
        const currentLegData = currentGame.value.currentLegData || {
          legNumber: currentGame.value.currentLeg,
          setNumber: currentGame.value.currentSet,
          startTimestamp: new Date().toISOString(),
          totalThrows: 0,
          playerStats: {} as Record<string, any>
        }
        
        // Get the current player's existing leg stats (if any)
        const currentPlayerLegStats = currentLegData.playerStats[currentPlayer.value!.id] || {
          dartsThrown: 0,
          totalScore: 0,
          turns: 0,
          averagePerTurn: 0,
          highestScore: 0,
          checkoutAttempts: 0,
          checkoutSuccess: false,
          singlesHit: 0,
          doublesHit: 0,
          triplesHit: 0,
          bullsHit: 0,
          throwsOver100: 0
        }
        
        // Update the current leg stats with this turn's data
        const updatedPlayerLegStats = {
          ...currentPlayerLegStats,
          dartsThrown: currentPlayerLegStats.dartsThrown + dartThrows.length,
          totalScore: currentPlayerLegStats.totalScore + totalScore,
          turns: currentPlayerLegStats.turns + 1,
          averagePerTurn: (currentPlayerLegStats.totalScore + totalScore) / (currentPlayerLegStats.turns + 1),
          highestScore: Math.max(currentPlayerLegStats.highestScore, totalScore),
          checkoutAttempts: currentPlayerLegStats.checkoutAttempts + 
                           (hasCheckoutAttempt(dartThrows, updatedPlayers.find(p => p.id === currentPlayer.value!.id)?.currentScore || 0) ? 1 : 0),
          checkoutSuccess: false, // Leg not completed yet
          singlesHit: currentPlayerLegStats.singlesHit + dartThrows.filter(dart => dart.multiplier === 'single').length,
          doublesHit: currentPlayerLegStats.doublesHit + dartThrows.filter(dart => dart.multiplier === 'double').length,
          triplesHit: currentPlayerLegStats.triplesHit + dartThrows.filter(dart => dart.multiplier === 'triple').length,
          bullsHit: currentPlayerLegStats.bullsHit + dartThrows.filter(dart => dart.value === 25).length,
          throwsOver100: currentPlayerLegStats.throwsOver100 + (totalScore > 100 ? 1 : 0)
        }
        
        // Update the current leg data
        updateData.currentLegData = {
          ...currentLegData,
          totalThrows: currentLegData.totalThrows + dartThrows.length,
          playerStats: {
            ...currentLegData.playerStats,
            [currentPlayer.value!.id]: updatedPlayerLegStats
          }
        }
      }
      
      // If game is finished, make sure all history is properly saved
      if (gameFinished) {
        updateData.status = 'finished'
        updateData.finishedAt = serverTimestamp()
        updateData.winner = winnerPlayerId
        
        // Update user statistics for all players
        const { updateUserStatsAfterGame } = useUserAPI()
        
        for (const player of updatedPlayers) {
          try {
            // Calculate fastest checkout for this player from leg data
            let fastestCheckout: number | undefined = undefined
            let highestCheckout = 0
            
            // Look through all legs for checkout data
            if (currentGame.value.legsData) {
              for (const legKey in currentGame.value.legsData) {
                const legData = currentGame.value.legsData[legKey]
                const playerLegStats = legData.playerStats?.[player.id]
                
                if (playerLegStats && playerLegStats.checkoutSuccess) {
                  // If player successfully finished this leg, use total darts thrown in the leg
                  const totalDartsInLeg = playerLegStats.dartsThrown || 0
                  
                  if (totalDartsInLeg > 0 && (fastestCheckout === undefined || totalDartsInLeg < fastestCheckout)) {
                    fastestCheckout = totalDartsInLeg
                  }
                }
              }
            }
            
            // Use highest checkout from player data
            if (player.highestCheckout && player.highestCheckout > 0) {
              highestCheckout = player.highestCheckout
            }
            
            // Calculate 180s for this player from turns data
            const total180s = calculate180sForPlayer(player.id, turns.value)
            
            // Update user stats
            await updateUserStatsAfterGame(player.id, {
              won: player.id === winnerPlayerId,
              totalScore: player.totalScore || 0,
              totalTurns: player.totalTurns || 1, // Avoid division by zero
              highestTurn: player.highestTurn || 0,
              highestCheckout: highestCheckout > 0 ? highestCheckout : undefined,
              fastestCheckout: fastestCheckout,
              total180s: total180s
            })
          } catch (statsError) {
            // Don't let stats update failures prevent game completion
          }
        }
      }

      // Update game state
      await updateDoc(doc(db, 'games', gameId.value), updateData)

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
      
      const gameRef = doc(db, 'games', gameId.value)
      
      // Check if game is already finished - don't modify player data for finished games
      if (currentGame.value.status === 'finished') {
        // Just unsubscribe without modifying the game data
      } else if (currentGame.value.status === 'waiting') {
        // If anyone leaves during waiting phase, check if the game should be deleted
        if (currentGame.value.players.length <= 1) {
          // Only one player left (or less), delete the game since it never started
          // This prevents empty games from cluttering the database and analytics
          await deleteDoc(gameRef)
        } else if (isHost.value) {
          // Host is leaving but there are other players, delete since host is required
          await deleteDoc(gameRef)
        } else {
          // Non-host player leaving, just remove them from the game
          const updatedPlayers = currentGame.value.players.filter(p => p.id !== authStore.currentUser?.id)
          await updateDoc(gameRef, { players: updatedPlayers })
        }
      } else if (isCurrentUserPlaying.value && currentGame.value.status === 'playing') {
        // For active games, don't automatically abandon - just mark as left
        // The game can continue if the other player is still active
        const updatedPlayers = currentGame.value.players.map(p => {
          if (p.id === authStore.currentUser?.id) {
            // Mark this player as having left the game (but not abandoned)
            return { ...p, leftGame: true, leftAt: new Date().toISOString() }
          }
          return p
        })
        
        await updateDoc(gameRef, { 
          players: updatedPlayers
          // Do NOT set abandonedBy here - only set it when explicitly abandoning
        })
      } else if (isSpectating.value) {
        // Remove from spectators - this is fine since spectators don't affect game history
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
    const gameRef = doc(db, 'games', id)
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
    const turnsCollection = collection(db, 'games', id, 'turns')
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
    
    // Clear game state to prevent stale data issues
    currentGame.value = null
    gameId.value = null
    turns.value = []
    error.value = null
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
      // Error loading active sessions
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
      // Error saving game session
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
      if (!gameId || !userId) {
        throw new Error('Game ID and User ID are required')
      }

      // Get the current game to determine winner
      const gameDoc = await getDoc(doc(db, 'games', gameId))
      if (!gameDoc.exists()) {
        throw new Error('Game not found')
      }

      const gameData = gameDoc.data() as FirebaseGame
      
      // Determine the winner (other player if it's a 2-player game)
      let winner: string | null = null
      if (gameData.players.length === 2) {
        const otherPlayer = gameData.players.find(p => p.id !== userId)
        winner = otherPlayer?.id || null
      }

      // Prepare game update data
      const gameUpdate: any = {
        status: 'finished',
        abandonedBy: userId,
        winner,
        finishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      // If there's a winner, update their stats to reflect the win
      if (winner) {
        const updatedPlayers = [...gameData.players]
        const winnerIndex = updatedPlayers.findIndex(p => p.id === winner)
        
        if (winnerIndex !== -1) {
          // Give the winner full sets to reflect the win
          updatedPlayers[winnerIndex] = {
            ...updatedPlayers[winnerIndex],
            sets: gameData.setsToWin
          }
          
          // Make sure all player stats are properly preserved for analytics
          updatedPlayers.forEach(player => {
            // Ensure these fields exist and have proper values for analytics
            player.checkoutAttempts = player.checkoutAttempts || 0
            player.successfulCheckouts = player.successfulCheckouts || 0
            player.highestCheckout = player.highestCheckout || 0
            player.checkoutPercentage = player.successfulCheckouts > 0 ? 
              ((player.successfulCheckouts / player.checkoutAttempts) * 100) : 0
            
            // Keep other analytics-related fields
            player.totalThrows = player.totalThrows || 0
            player.totalScore = player.totalScore || 0
            player.totalTurns = player.totalTurns || 0
            player.averagePerTurn = player.totalScore > 0 && player.totalTurns > 0 ? 
              (player.totalScore / player.totalTurns) : 0
            player.highestTurn = player.highestTurn || 0
          })
          
          gameUpdate.players = updatedPlayers
        }
      }
      
      // Update the game with abandonment info
      await updateDoc(doc(db, 'games', gameId), gameUpdate)
      
      // Update user statistics for all players when game is abandoned
      const { updateUserStatsAfterGame } = useUserAPI()
      
      const playersToUpdate = gameUpdate.players || gameData.players
      for (const player of playersToUpdate) {
        try {
          // For abandoned games, calculate basic stats
          let highestCheckout = 0
          if (player.highestCheckout && player.highestCheckout > 0) {
            highestCheckout = player.highestCheckout
          }
          
          // Calculate 180s for this player from turns data
          const total180s = calculate180sForPlayer(player.id, turns.value)
          
          // Update user stats - winner gets a win, abandoner gets a loss
          await updateUserStatsAfterGame(player.id, {
            won: player.id === winner,
            totalScore: player.totalScore || 0,
            totalTurns: Math.max(player.totalTurns || 1, 1), // Ensure at least 1 to avoid division by zero
            highestTurn: player.highestTurn || 0,
            highestCheckout: highestCheckout > 0 ? highestCheckout : undefined,
            fastestCheckout: undefined, // No reliable checkout data for abandoned games
            total180s: total180s
          })
        } catch (statsError) {
          // Don't let stats update failures prevent game abandonment
        }
      }

      // If this is the current game, update its status locally
      if (currentGame.value && currentGame.value.id === gameId) {
        currentGame.value.status = 'finished'
        currentGame.value.abandonedBy = userId
        currentGame.value.winner = winner || undefined
        
        if (winner) {
          // Update the player stats for display
          const winningPlayer = currentGame.value.players.find(p => p.id === winner)
          if (winningPlayer) {
            winningPlayer.sets = currentGame.value.setsToWin
          }
        }
      }

      return {
        success: true,
        gameId,
        abandonedBy: userId,
        winner
      }
    } catch (error) {
      throw new Error('Failed to abandon game')
    }
  }
  
  // Cleanup on unmount
  onBeforeUnmount(() => {
    unsubscribeFromGame()
  })

  // Helper function to calculate number of 180s for a player from turns data
  const calculate180sForPlayer = (playerId: string, turnsData: Turn[]): number => {
    let count180s = 0
    
    // Filter turns for this player and check each turn's score
    const playerTurns = turnsData.filter(turn => turn.playerId === playerId)
    
    for (const turn of playerTurns) {
      // A 180 is when the turn score equals 180 (maximum possible score with 3 darts)
      if (turn.score === 180) {
        count180s++
      }
    }
    
    return count180s
  }

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
