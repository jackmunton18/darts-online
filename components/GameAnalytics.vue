<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-2xl font-bold mb-6">Game Analytics</h3>
    
    <!-- Game Result Banner (if finished) -->
    <div v-if="props.game && props.game.status === 'finished'" 
         class="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
      <div class="flex justify-between items-center">
        <div>
          <!-- TODO Translate -->
          <h4 class="font-semibold text-gray-800">Game Result</h4>
          <p class="text-lg mt-1">
            <span class="font-bold">Winner: </span>
            {{ getWinnerName }}
          </p>
          <!-- Show abandonment info if applicable -->
          <p v-if="props.game.abandonedBy" class="text-red-600 text-sm mt-2">
            <!-- TODO Translate -->
            This game was abandoned by {{ getAbandonedByName }}
          </p>
        </div>
        <div class="text-yellow-800 font-bold text-xl">
          <!-- TODO Translate -->
          GAME OVER
        </div>
      </div>
    </div>
    
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id as TabId"
          :class="[
            'py-2 px-1 border-b-2 font-medium text-sm',
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Game Overview Tab -->
    <div v-if="activeTab === 'game'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-900">Total Throws</h4>
          <p class="text-2xl font-bold text-blue-600">{{ gameAnalytics.totalThrows }}</p>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-900">Total Turns</h4>
          <p class="text-2xl font-bold text-green-600">{{ gameAnalytics.totalTurns }}</p>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-900">Game Duration</h4>
          <p class="text-2xl font-bold text-purple-600">{{ formatDuration(gameAnalytics.gameDuration) }}</p>
        </div>
      </div>

      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold mb-2">Game Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Game Type:</span>
            <span class="font-medium ml-2">{{ gameAnalytics.gameType }}</span>
          </div>
          <div>
            <span class="text-gray-600">Legs to Win:</span>
            <span class="font-medium ml-2">{{ gameAnalytics.legsToWin }}</span>
          </div>
          <div>
            <span class="text-gray-600">Sets to Win:</span>
            <span class="font-medium ml-2">{{ gameAnalytics.setsToWin }}</span>
          </div>
          <div>
            <span class="text-gray-600">Finished At:</span>
            <span class="font-medium ml-2">{{ formatTime(gameAnalytics.finishedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Stats Tab -->
    <div v-if="activeTab === 'players'" class="space-y-6">
      <div
        v-for="player in gameAnalytics.players"
        :key="player.id"
        class="bg-gray-50 p-4 rounded-lg"
      >
        <h4 class="font-semibold mb-4">{{ player.name }}</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Total Score:</span>
            <span class="font-medium ml-2">{{ player.totalScore }}</span>
          </div>
          <div>
            <span class="text-gray-600">Average per Turn:</span>
            <span class="font-medium ml-2">{{ player.averagePerTurn.toFixed(1) }}</span>
          </div>
          <div>
            <span class="text-gray-600">Throws over 100:</span>
            <span class="font-medium ml-2">{{ player.throwsOver100 }}</span>
          </div>
          <div>
            <span class="text-gray-600">Highest Turn:</span>
            <span class="font-medium ml-2">{{ player.highestTurn }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leg Details Tab -->
    <div v-if="activeTab === 'legs'" class="space-y-6">
      <!-- No leg data message -->
      <div v-if="!hasLegData" class="bg-gray-50 p-6 rounded-lg text-center">
        <!-- TODO Translate -->
        <p class="text-gray-500">No detailed leg data available for this game.</p>
      </div>
      
      <!-- With leg data -->
      <div v-else>
        <!-- Set navigation -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button 
            v-for="setNum in totalSets" 
            :key="`set-${setNum}`"
            @click="selectedSet = setNum"
            class="px-3 py-1.5 rounded-md text-sm font-medium"
            :class="selectedSet === setNum ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'"
          >
            <!-- TODO Translate -->
            Set {{ setNum }}
          </button>
        </div>
        
        <!-- Set Summary -->
        <div v-if="selectedSetData" class="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 class="font-semibold mb-2">
            <!-- TODO Translate -->
            Set {{ selectedSet }} Summary
          </h4>
          <div class="grid grid-cols-2 gap-4 mt-3">
            <div>
              <!-- TODO Translate -->
              <p class="text-sm text-gray-600">Winner:</p>
              <p class="font-medium">{{ getPlayerNameById(selectedSetData.winningPlayerId) || 'N/A' }}</p>
            </div>
            <div>
              <!-- TODO Translate -->
              <p class="text-sm text-gray-600">Legs:</p>
              <p class="font-medium">{{ selectedSetData.legs.length }}</p>
            </div>
            <div>
              <!-- TODO Translate -->
              <p class="text-sm text-gray-600">Started:</p>
              <p class="font-medium">{{ formatTime(selectedSetData.startTimestamp) }}</p>
            </div>
            <div>
              <!-- TODO Translate -->
              <p class="text-sm text-gray-600">Ended:</p>
              <p class="font-medium">{{ selectedSetData.endTimestamp ? formatTime(selectedSetData.endTimestamp) : 'In progress' }}</p>
            </div>
          </div>
          
          <!-- Player stats for this set -->
          <h5 class="font-medium mt-4 mb-2">
            <!-- TODO Translate -->
            Player Performance
          </h5>
          <div class="space-y-3">
            <div v-for="(stats, playerId) in selectedSetData.playerStats" :key="playerId" class="bg-white p-3 rounded-md">
              <div class="flex justify-between items-center">
                <span class="font-medium">{{ getPlayerNameById(String(playerId)) }}</span>
                <span class="text-sm px-2 py-0.5 rounded-full" 
                  :class="stats.legsWon > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                  {{ stats.legsWon }} leg(s) won
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <span class="text-gray-600">Throws:</span>
                  <span class="font-medium ml-1">{{ stats.totalThrows }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Total Score:</span>
                  <span class="font-medium ml-1">{{ stats.totalScore }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Avg/Turn:</span>
                  <span class="font-medium ml-1">{{ stats.averagePerTurn.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Leg List -->
        <div v-if="legsForSelectedSet.length > 0">
          <h4 class="font-medium mb-3">
            <!-- TODO Translate -->
            Leg Details
          </h4>
          <div class="space-y-4">
            <div 
              v-for="leg in legsForSelectedSet" 
              :key="leg.legId" 
              class="border border-gray-200 rounded-lg overflow-hidden"
            >
              <!-- Leg header -->
              <div class="bg-gray-100 p-3 flex items-center justify-between">
                <div>
                  <!-- TODO Translate -->
                  <span class="font-medium">Leg {{ leg.data.legNumber }}</span>
                  <span class="text-sm text-gray-600 ml-2">
                    {{ formatTime(leg.data.startTimestamp) }}
                  </span>
                </div>
                <div>
                  <span 
                    v-if="leg.data.winningPlayerId"
                    class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                  >
                    <!-- TODO Translate -->
                    Won by {{ getPlayerNameById(leg.data.winningPlayerId) }}
                  </span>
                  <span v-else class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                    <!-- TODO Translate -->
                    In progress
                  </span>
                </div>
              </div>
              
              <!-- Leg content -->
              <div class="p-3">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- General leg info -->
                  <div>
                    <div class="mb-2">
                      <!-- TODO Translate -->
                      <span class="text-sm text-gray-600">Started by:</span>
                      <span class="ml-1 font-medium">{{ getPlayerNameById(leg.data.startPlayerId) }}</span>
                    </div>
                    <div class="mb-2">
                      <!-- TODO Translate -->
                      <span class="text-sm text-gray-600">Total throws:</span>
                      <span class="ml-1 font-medium">{{ leg.data.totalThrows }}</span>
                    </div>
                    <div v-if="leg.data.endTimestamp">
                      <!-- TODO Translate -->
                      <span class="text-sm text-gray-600">Duration:</span>
                      <span class="ml-1 font-medium">
                        {{ getLegDuration(leg.data.startTimestamp, leg.data.endTimestamp) }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Player stats for this leg -->
                  <div>
                    <h5 class="text-sm font-medium mb-2">
                      <!-- TODO Translate -->
                      Player Statistics
                    </h5>
                    <div v-for="(stats, playerId) in leg.data.playerStats" :key="playerId" class="mb-2 p-2 bg-gray-50 rounded">
                      <div class="flex justify-between">
                        <span class="font-medium">{{ getPlayerNameById(String(playerId)) }}</span>
                        <span v-if="stats.checkoutSuccess" class="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          Checkout: {{ stats.checkoutScore }}
                        </span>
                      </div>
                      <div class="grid grid-cols-2 gap-1 mt-1 text-xs">
                        <div>
                          <span class="text-gray-600">Darts:</span>
                          <span class="font-medium ml-1">{{ stats.dartsThrown }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600">Score:</span>
                          <span class="font-medium ml-1">{{ stats.totalScore }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600">Turns:</span>
                          <span class="font-medium ml-1">{{ stats.turns }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600">Avg:</span>
                          <span class="font-medium ml-1">{{ stats.averagePerTurn.toFixed(1) }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600">Highest:</span>
                          <span class="font-medium ml-1">{{ stats.highestScore }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600">Checkout Attempts:</span>
                          <span class="font-medium ml-1">{{ stats.checkoutAttempts }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Detailed throw history for this leg -->
                <div v-if="leg.data.throws && leg.data.throws.length > 0" class="mt-4">
                  <h5 class="text-sm font-medium mb-2">
                    <!-- TODO Translate -->
                    Throw History
                  </h5>
                  <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                      <thead>
                        <tr class="bg-gray-100">
                          <!-- TODO Translate -->
                          <th class="py-2 px-3 text-left">Turn</th>
                          <th class="py-2 px-3 text-left">Player</th>
                          <th class="py-2 px-3 text-left">Darts</th>
                          <th class="py-2 px-3 text-right">Score</th>
                          <th class="py-2 px-3 text-right">Remaining</th>
                          <th class="py-2 px-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(turn, index) in leg.data.throws" :key="index" 
                            class="border-b border-gray-100" 
                            :class="{'bg-green-50': turn.remainingScore === 0}">
                          <td class="py-2 px-3">{{ turn.turnNumber }}</td>
                          <td class="py-2 px-3">{{ getPlayerNameById(turn.playerId) }}</td>
                          <td class="py-2 px-3">
                            <span v-for="(dart, dIndex) in turn.dartsThrown" :key="dIndex" class="mr-1">
                              {{ dart.multiplier === 'single' ? '' : 
                                 dart.multiplier === 'double' ? 'D' : 
                                 dart.multiplier === 'triple' ? 'T' : '' }}{{ dart.value }}
                            </span>
                          </td>
                          <td class="py-2 px-3 text-right">{{ turn.score }}</td>
                          <td class="py-2 px-3 text-right">{{ turn.remainingScore }}</td>
                          <td class="py-2 px-3 text-right">{{ formatTime(turn.timestamp) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bg-gray-50 p-4 rounded-lg text-center">
          <!-- TODO Translate -->
          <p class="text-gray-500">No legs found for this set.</p>
        </div>
      </div>
    </div>
    
    <!-- Throw Analysis Tab -->
    <div v-if="activeTab === 'throws'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-4">Throw Distribution</h4>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span>Singles:</span>
              <span class="font-medium">{{ gameAnalytics.totalSingles }} ({{ getThrowPercentage(gameAnalytics.totalSingles, gameAnalytics.totalThrows) }}%)</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" :style="{ width: getThrowPercentage(gameAnalytics.totalSingles, gameAnalytics.totalThrows) + '%' }"></div>
            </div>
            
            <div class="flex justify-between items-center">
              <span>Doubles:</span>
              <span class="font-medium">{{ gameAnalytics.totalDoubles }} ({{ getThrowPercentage(gameAnalytics.totalDoubles, gameAnalytics.totalThrows) }}%)</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-green-600 h-2 rounded-full" :style="{ width: getThrowPercentage(gameAnalytics.totalDoubles, gameAnalytics.totalThrows) + '%' }"></div>
            </div>
            
            <div class="flex justify-between items-center">
              <span>Triples:</span>
              <span class="font-medium">{{ gameAnalytics.totalTriples }} ({{ getThrowPercentage(gameAnalytics.totalTriples, gameAnalytics.totalThrows) }}%)</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-yellow-600 h-2 rounded-full" :style="{ width: getThrowPercentage(gameAnalytics.totalTriples, gameAnalytics.totalThrows) + '%' }"></div>
            </div>
            
            <div class="flex justify-between items-center">
              <span>Bulls:</span>
              <span class="font-medium">{{ gameAnalytics.totalBulls }} ({{ getThrowPercentage(gameAnalytics.totalBulls, gameAnalytics.totalThrows) }}%)</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-red-600 h-2 rounded-full" :style="{ width: getThrowPercentage(gameAnalytics.totalBulls, gameAnalytics.totalThrows) + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-4">Performance Stats</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Total Throws:</span>
              <span class="font-medium">{{ gameAnalytics.totalThrows }}</span>
            </div>
            <div class="flex justify-between">
              <span>Throws over 100:</span>
              <span class="font-medium">{{ gameAnalytics.totalThrowsOver100 }}</span>
            </div>
            <div class="flex justify-between">
              <span>Average per Turn:</span>
              <span class="font-medium">{{ gameAnalytics.averagePerTurn.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Checkouts Tab -->
    <div v-if="activeTab === 'checkouts'" class="space-y-6">
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold mb-4">Checkout Statistics</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span class="text-gray-600">Total Attempts:</span>
            <span class="font-medium ml-2">{{ gameAnalytics.totalCheckoutAttempts }}</span>
          </div>
          <div>
            <span class="text-gray-600">Successful:</span>
            <span class="font-medium ml-2">{{ gameAnalytics.totalSuccessfulCheckouts }}</span>
          </div>
          <div>
            <span class="text-gray-600">Success Rate:</span>
            <span class="font-medium ml-2">{{ gameAnalytics.checkoutSuccessRate.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <div v-if="gameAnalytics.highestCheckout > 0" class="bg-yellow-50 p-4 rounded-lg">
        <h4 class="font-semibold text-yellow-800 mb-2">Highest Checkout</h4>
        <p class="text-2xl font-bold text-yellow-600">{{ gameAnalytics.highestCheckout }}</p>
      </div>
      
      <div v-if="gameAnalytics.fastestCheckout" class="bg-green-50 p-4 rounded-lg">
        <h4 class="font-semibold text-green-800 mb-2">Fastest Checkout</h4>
        <p class="text-2xl font-bold text-green-600">{{ gameAnalytics.fastestCheckout }} darts</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GameState, Turn } from '~/stores/game'

interface Props {
  game: GameState | null
  gameHistory: Turn[]
}

const props = defineProps<Props>()

// Define tab types
type TabId = 'game' | 'players' | 'throws' | 'checkouts' | 'legs';

// Computed properties
const activeTab = ref<TabId>('game')

const getWinnerName = computed(() => {
  if (!props.game || props.game.status !== 'finished') {
    return 'N/A'
  }
  
  // If winner ID is stored directly in game object
  if (props.game.winner && typeof props.game.winner === 'string') {
    // Type assertion to help TypeScript understand we've already checked props.game isn't null
    const game = props.game as any;
    const winnerPlayer = game.players.find((p: any) => p.id === game.winner);
    return winnerPlayer ? winnerPlayer.name : 'Unknown';
  }
  
  // Fall back to computing winner from sets
  const winnerByScore = [...props.game.players].sort((a, b) => b.sets - a.sets)[0]
  return winnerByScore ? winnerByScore.name : 'Unknown'
})

// Get the name of the player who abandoned the game
const getAbandonedByName = computed(() => {
  if (!props.game || !props.game.abandonedBy) {
    return 'Unknown'
  }
  
  const game = props.game as any
  const player = game.players.find((p: any) => p.id === game.abandonedBy)
  return player ? player.name : 'Unknown'
})

const tabs = [
  { id: 'game' as TabId, name: 'Game Overview' },
  { id: 'players' as TabId, name: 'Player Stats' },
  { id: 'throws' as TabId, name: 'Throw Analysis' },
  { id: 'legs' as TabId, name: 'Leg Details' },
  { id: 'checkouts' as TabId, name: 'Checkouts' }
]

const gameAnalytics = computed(() => {
  if (!props.game || !props.gameHistory.length) {
    return {
      totalThrows: 0,
      totalTurns: 0,
      gameDuration: 0,
      gameType: '',
      legsToWin: 0,
      setsToWin: 0,
      finishedAt: '',
      players: [],
      totalSingles: 0,
      totalDoubles: 0,
      totalTriples: 0,
      totalBulls: 0,
      totalThrowsOver100: 0,
      averagePerTurn: 0,
      totalCheckoutAttempts: 0,
      totalSuccessfulCheckouts: 0,
      checkoutSuccessRate: 0,
      highestCheckout: 0
    }
  }

  const game = props.game
  const history = props.gameHistory

  // Calculate totals
  const totalThrows = game.totalThrows
  const totalTurns = game.totalTurns
  const gameDuration = game.gameDuration || 0

  // Calculate throw distribution
  let totalSingles = 0
  let totalDoubles = 0
  let totalTriples = 0
  let totalBulls = 0
  let totalThrowsOver100 = 0
  let totalCheckoutAttempts = 0
  let totalSuccessfulCheckouts = 0
  let highestCheckout = 0
  let fastestCheckout = Number.MAX_VALUE // Track fastest checkout (fewest darts)

  history.forEach(turn => {
    if (turn.throws) {
      turn.throws.forEach(dartThrow => {
        switch (dartThrow.multiplier) {
          case 'single':
            totalSingles++
            break
          case 'double':
            totalDoubles++
            break
          case 'triple':
            totalTriples++
            break
        }

        if (dartThrow.value === 25) {
          totalBulls++
        }
      })
    }

    if (turn.score > 100) {
      totalThrowsOver100++
    }

    if (turn.remainingScore <= 170 && turn.remainingScore > 0) {
      totalCheckoutAttempts++
    }

    if (turn.remainingScore === 0 && turn.score > 0) {
      totalSuccessfulCheckouts++
      highestCheckout = Math.max(highestCheckout, turn.score)
    }
  })

  // Calculate fastest checkout from leg data (total darts used to complete a leg)
  if (game.legsData) {
    Object.values(game.legsData).forEach((legData: any) => {
      // Check each player's leg stats for successful checkouts
      Object.values(legData.playerStats || {}).forEach((playerStats: any) => {
        if (playerStats.checkoutSuccess && playerStats.dartsThrown) {
          const totalDartsUsed = playerStats.dartsThrown
          if (totalDartsUsed < fastestCheckout) {
            fastestCheckout = totalDartsUsed
          }
        }
      })
    })
  }

  const averagePerTurn = totalTurns > 0 ? history.reduce((sum, turn) => sum + turn.score, 0) / totalTurns : 0
  const checkoutSuccessRate = totalCheckoutAttempts > 0 ? (totalSuccessfulCheckouts / totalCheckoutAttempts) * 100 : 0

  return {
    totalThrows,
    totalTurns,
    gameDuration,
    gameType: game.gameType,
    legsToWin: game.legsToWin,
    setsToWin: game.setsToWin,
    finishedAt: game.finishedAt || '',
    players: game.players,
    totalSingles,
    totalDoubles,
    totalTriples,
    totalBulls,
    totalThrowsOver100,
    averagePerTurn,
    totalCheckoutAttempts,
    totalSuccessfulCheckouts,
    checkoutSuccessRate,
    highestCheckout,
    fastestCheckout: fastestCheckout !== Number.MAX_VALUE ? fastestCheckout : null
  }
})

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const getThrowPercentage = (count: number, total: number) => {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

// New computed properties and methods for leg analytics
const hasLegData = computed(() => {
  return props.game && props.game.setsData && Object.keys(props.game.setsData).length > 0
})

const totalSets = computed(() => {
  if (!hasLegData.value || !props.game) return 0
  
  // Find the highest set number from the setsData keys
  const setIds = Object.keys(props.game.setsData || {})
  if (setIds.length === 0) return 0
  
  return Math.max(...setIds.map(setId => {
    // Extract set number from key like "set_1"
    const setNumber = parseInt(setId.split('_')[1])
    return isNaN(setNumber) ? 0 : setNumber
  }))
})

const selectedSet = ref<number>(1)

const selectedSetData = computed(() => {
  if (!hasLegData.value || !props.game) {
    return null
  }
  
  const setId = `set_${selectedSet.value}`
  return props.game.setsData?.[setId] || null
})

const legsForSelectedSet = computed(() => {
  if (!hasLegData.value || !selectedSetData.value || !props.game) {
    return []
  }
  
  const legData: { legId: string; data: any }[] = []
  
  // Get legs for the selected set
  selectedSetData.value.legs.forEach((legId) => {
    const legIdStr = String(legId);
    if (props.game?.legsData?.[legIdStr]) {
      legData.push({
        legId: legIdStr,
        data: props.game.legsData[legIdStr]
      })
    }
  })
  
  return legData
})

const getPlayerNameById = (playerId: string | undefined) => {
  if (!playerId) return 'Unknown'
  const player = props.game?.players.find(p => p.id === playerId)
  return player ? player.name : 'Unknown'
}

const getLegDuration = (startTimestamp: string, endTimestamp: string) => {
  const start = new Date(startTimestamp).getTime()
  const end = new Date(endTimestamp).getTime()
  const duration = end - start
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}
</script>