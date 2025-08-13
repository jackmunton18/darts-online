import type { Timestamp } from 'firebase/firestore'

export interface Tournament {
  id: string
  code: string // 6-character join code
  createdBy: string // host player ID
  createdAt: Timestamp
  updatedAt: Timestamp
  status: 'waiting' | 'ready' | 'active' | 'completed'
  
  // Game Settings (inherited from versus)
  gameType: '501' | '301' | '701'
  legsToWin: number
  setsToWin: number
  
  // Tournament Settings
  mode: 'bracket' | 'group'
  maxPlayers: 4 | 8 | 16
  currentPlayerCount: number
  
  // Bonus Points Settings
  bonusPoints: {
    enable180s: boolean
    enable170s: boolean // "big fish"
    enableBullCheckout: boolean
    points180: number // default 2
    points170: number // default 2
    pointsBullCheckout: number // default 1
  }
  enableThirdPlace: boolean
  
  // Tournament Progress
  players: TournamentPlayer[]
  currentRound: number
  totalRounds?: number // calculated based on mode
  
  // Bracket/Group Data
  brackets?: BracketMatch[]
  groupStandings?: GroupStanding[]
  games: string[] // Array of game IDs
  completedGames: string[] // Array of completed game IDs
  
  // Round data for group tournaments
  rounds?: {
    [roundKey: string]: {
      pairings: RoundPairing[]
      completed: boolean
    }
  }
  
  // Current round status
  roundInProgress: boolean
  allPlayersReady: boolean
  
  // Spinner state for real-time sync
  spinnerState?: {
    isSpinning: boolean
    spinType: 'pairing' | 'home-side' | 'idle'
    roundNumber?: number
    result?: any // Host-calculated result that all players should see
  }
}

export interface TournamentPlayer {
  id: string
  name: string
  isReady: boolean
  isHost: boolean
  
  // Tournament Stats
  points: number // For group mode
  gamesWon: number
  gamesLost: number
  legsWon: number
  legsLost: number
  bonusPoints: number
  
  // Position for bracket mode
  bracketPosition?: number
  eliminated?: boolean
}

export interface BracketMatch {
  id: string
  round: number
  position: string // 'semi1', 'semi2', 'final', 'third-place', etc.
  player1Id: string
  player2Id: string
  winnerId?: string
  loserId?: string
  gameId?: string
  completed: boolean
  
  // Home side determination
  homePlayerId: string // who starts first
}

export interface GroupStanding {
  playerId: string
  playerName: string
  points: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  legsWon: number
  legsLost: number
  legDifference: number
  bonusPoints: number
  
  // Detailed bonus breakdown
  total180s: number
  total170s: number
  totalBullCheckouts: number
}

export interface TournamentSettings {
  gameType: '501' | '301' | '701'
  legsToWin: number
  setsToWin: number
  mode: 'bracket' | 'group'
  maxPlayers: 4 | 8 | 16
  enableThirdPlace: boolean
  bonusPoints: {
    enable180s: boolean
    enable170s: boolean
    enableBullCheckout: boolean
    points180: number
    points170: number
    pointsBullCheckout: number
  }
}

export interface RoundPairing {
  player1Id: string
  player2Id: string
  player1Name: string
  player2Name: string
  homePlayerId: string // who starts first
  roundNumber: number
}

export interface TournamentGameResult {
  gameId: string
  tournamentId: string
  winnerId: string
  loserId: string
  winnerLegs: number
  loserLegs: number
  winnerSets: number
  loserSets: number
  
  // Bonus points earned
  winner180s: number
  loser180s: number
  winner170s: number
  loser170s: number
  winnerBullCheckouts: number
  loserBullCheckouts: number
  
  // Point awards
  winnerPoints: number // 3 for win, +bonus
  loserPoints: number // 0 or 1 if won at least one leg, +bonus
  
  // Timestamp for sorting and tracking when the result was recorded
  timestamp?: any // Using any for Firestore timestamp compatibility
}
