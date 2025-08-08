import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

export interface Player {
  id: string
  name: string
  currentScore: number
  legs: number
  sets: number
  totalThrows: number
  totalScore: number
  averagePerTurn: number
  throwsOver100: number
  doublesHit: number
  triplesHit: number
  singlesHit: number
  bullsHit: number
  checkoutAttempts: number
  successfulCheckouts: number
  highestCheckout: number
  highestTurn: number
  totalTurns: number
  checkoutPercentage: number
}

export interface GameState {
  id: string
  gameCode: string
  status: 'waiting' | 'playing' | 'finished'
  gameType: string
  legsToWin: number
  setsToWin: number
  currentPlayerIndex: number
  currentLeg: number
  currentSet: number
  players: Player[]
  totalThrows: number
  totalTurns: number
  currentTurnThrows: number // Track throws made in current turn (0-3)
  gameDuration?: number
  finishedAt?: string
  createdAt: string
  winner?: string // ID of the player who won the game
  hostId: string // ID of player who created the game
  spectators?: string[] // Array of spectator user IDs
  abandonedBy?: string // ID of the player who abandoned the game
  
  // Enhanced tracking data
  legsData?: { [legId: string]: LegData } // Mapping of leg IDs to leg data
  setsData?: { [setId: string]: SetData } // Mapping of set IDs to set data
  currentLegData?: LegData // Current leg's detailed data
  currentSetData?: SetData // Current set's detailed data
}

export interface Turn {
  playerId: string
  score: number
  throws: DartThrow[]
  remainingScore: number
  timestamp: string
  leg: number
  set: number
  turnNumber: number
}

export interface DartThrow {
  value: number
  multiplier: 'single' | 'double' | 'triple'
  score: number
  timestamp: string
  isBust?: boolean  // Optional flag to indicate if this dart was part of a bust turn
}

export interface LegData {
  legNumber: number
  setNumber: number
  startPlayerId: string          // ID of player who started the leg
  winningPlayerId?: string       // ID of player who won the leg
  startTimestamp: string         // When the leg started
  endTimestamp?: string          // When the leg ended
  totalThrows: number            // Total darts thrown in this leg
  throws: {                      // Detailed throw history for the leg
    playerId: string             // ID of the player who threw
    dartsThrown: DartThrow[]     // Array of individual darts thrown
    score: number                // Total score for this turn
    remainingScore: number       // Score remaining after throw
    timestamp: string            // When the throw was made
    turnNumber: number           // Sequential turn number in the leg
  }[]
  playerStats: {                 // Per-player statistics for this leg
    [playerId: string]: {
      dartsThrown: number        // Total darts thrown by this player in this leg
      totalScore: number         // Total score for this player in the leg
      turns: number              // Number of turns taken
      averagePerTurn: number     // Average score per turn
      highestScore: number       // Highest score in a single turn
      checkoutAttempts: number   // Number of checkout attempts
      checkoutSuccess: boolean   // Whether player successfully checked out
      checkoutScore?: number     // Score of successful checkout if applicable
    }
  }
}

export interface SetData {
  setNumber: number
  winningPlayerId?: string       // ID of player who won the set
  startTimestamp: string         // When the set started
  endTimestamp?: string          // When the set ended
  legs: number[]                 // IDs or references to legs in this set
  playerStats: {                 // Per-player statistics for this set
    [playerId: string]: {
      legsWon: number
      totalThrows: number
      totalScore: number
      averagePerTurn: number
    }
  }
}

export interface PlayerAnalytics {
  totalGames: number
  totalWins: number
  totalThrows: number
  totalScore: number
  averagePerTurn: number
  throwsOver100: number
  doublesHit: number
  triplesHit: number
  singlesHit: number
  bullsHit: number
  checkoutAttempts: number
  successfulCheckouts: number
  checkoutPercentage: number
  highestCheckout: number
  highestTurn: number
  averageGameDuration: number
}

export const useGameStore = defineStore('game', () => {
  const currentGame = ref<GameState | null>(null)
  const gameHistory = ref<Turn[]>([])
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  // Computed properties
  const currentPlayer = computed(() => {
    if (!currentGame.value || currentGame.value.players.length === 0) return null
    return currentGame.value.players[currentGame.value.currentPlayerIndex]
  })

  const remainingScore = computed(() => {
    return currentPlayer.value?.currentScore || 0
  })

  const gameStatus = computed(() => {
    return currentGame.value?.status || 'waiting'
  })

  const isGameFinished = computed(() => {
    return currentGame.value?.status === 'finished'
  })

  // Actions
  const createGame = async (gameConfig: { gameType: string; legsToWin: number; setsToWin: number }) => {
    try {
      isLoading.value = true
      error.value = null

      const gameCode = Math.random().toString().slice(2, 8)
      const game: GameState = {
        id: `game_${Date.now()}`,
        gameCode,
        status: 'waiting',
        gameType: gameConfig.gameType,
        legsToWin: gameConfig.legsToWin,
        setsToWin: gameConfig.setsToWin,
        currentPlayerIndex: 0,
        currentLeg: 1,
        currentSet: 1,
        players: [],
        totalThrows: 0,
        totalTurns: 0,
        currentTurnThrows: 0,
        createdAt: new Date().toISOString(),
        hostId: '', // Set hostId when player joins
        spectators: [] // Initialize spectators array
      }

      currentGame.value = game
      gameHistory.value = []
      
      return { game, error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create game'
      return { game: null, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const joinGame = async (gameCode: string, playerId: string, playerName: string, role: 'player' | 'spectator') => {
    try {
      if (!currentGame.value || currentGame.value.gameCode !== gameCode) {
        throw new Error('Game not found')
      }

      const existingPlayer = currentGame.value.players.find(p => p.id === playerId)
      if (existingPlayer) {
        return { player: existingPlayer, error: null }
      }

      const player: Player = {
        id: playerId,
        name: playerName,
        currentScore: 501,
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

      currentGame.value.players.push(player)
      
      // Set hostId if it's the first player
      if (currentGame.value.players.length === 1) {
        currentGame.value.hostId = playerId
      }
      
      return { player, error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to join game'
      return { player: null, error: error.value }
    }
  }

  const submitScore = async (score: number, throws?: DartThrow[]) => {
    try {
      if (!currentGame.value || !currentPlayer.value) {
        throw new Error('No active game or player')
      }

      const player = currentPlayer.value
      const newScore = player.currentScore - score

      // Check for bust
      if (newScore < 0 || (newScore === 1)) {
        // Bust - score stays the same
        const turn: Turn = {
          playerId: player.id,
          score: 0,
          throws: throws || [],
          remainingScore: player.currentScore,
          timestamp: new Date().toISOString(),
          leg: currentGame.value.currentLeg,
          set: currentGame.value.currentSet,
          turnNumber: currentGame.value.totalTurns + 1
        }
        gameHistory.value.push(turn)
        currentGame.value.totalTurns++
        return { success: true, error: null }
      }

      // Update player score
      player.currentScore = newScore
      player.totalScore += score
      player.totalTurns++
      player.averagePerTurn = player.totalScore / player.totalTurns

      // Update analytics
      if (throws) {
        player.totalThrows += throws.length
        currentGame.value.totalThrows += throws.length

        throws.forEach(dartThrow => {
          switch (dartThrow.multiplier) {
            case 'single':
              player.singlesHit++
              break
            case 'double':
              player.doublesHit++
              break
            case 'triple':
              player.triplesHit++
              break
          }

          if (dartThrow.value === 25) {
            player.bullsHit++
          }
        })

        if (score > 100) {
          player.throwsOver100++
        }

        if (score > player.highestTurn) {
          player.highestTurn = score
        }
      }

      // Check for checkout
      if (newScore === 0) {
        player.checkoutAttempts++
        player.successfulCheckouts++
        player.highestCheckout = Math.max(player.highestCheckout, score)
        player.checkoutPercentage = (player.successfulCheckouts / player.checkoutAttempts) * 100

        // Check for leg win
        player.legs++
        if (player.legs >= currentGame.value.legsToWin) {
          player.sets++
          if (player.sets >= currentGame.value.setsToWin) {
            // Game won
            currentGame.value.status = 'finished'
            currentGame.value.finishedAt = new Date().toISOString()
            currentGame.value.gameDuration = Date.now() - new Date(currentGame.value.createdAt).getTime()
            currentGame.value.winner = player.id // Set winner ID
          } else {
            // New set
            currentGame.value.currentSet++
            currentGame.value.currentLeg = 1
            // Reset scores for new set
            currentGame.value.players.forEach(p => {
              p.currentScore = 501
            })
          }
        } else {
          // New leg
          currentGame.value.currentLeg++
          // Reset scores for new leg
          currentGame.value.players.forEach(p => {
            p.currentScore = 501
          })
        }
      } else if (newScore <= 170) {
        // Potential checkout opportunity
        player.checkoutAttempts++
      }

      // Record turn
      const turn: Turn = {
        playerId: player.id,
        score,
        throws: throws || [],
        remainingScore: player.currentScore,
        timestamp: new Date().toISOString(),
        leg: currentGame.value.currentLeg,
        set: currentGame.value.currentSet,
        turnNumber: currentGame.value.totalTurns + 1
      }
      gameHistory.value.push(turn)
      currentGame.value.totalTurns++

      // Move to next player if game not finished
      if (currentGame.value.status !== 'finished') {
        currentGame.value.currentPlayerIndex = (currentGame.value.currentPlayerIndex + 1) % currentGame.value.players.length
      }

      return { success: true, error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit score'
      return { success: false, error: error.value }
    }
  }

  const resetGame = () => {
    currentGame.value = null
    gameHistory.value = []
    error.value = null
  }

  return {
    // State
    currentGame: readonly(currentGame),
    gameHistory: readonly(gameHistory),
    error: readonly(error),
    isLoading: readonly(isLoading),

    // Computed
    currentPlayer,
    remainingScore,
    gameStatus,
    isGameFinished,

    // Actions
    createGame,
    joinGame,
    submitScore,
    resetGame
  }
})