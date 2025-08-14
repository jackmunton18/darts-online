<template>
  <div class="panel-dark p-6">
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
    <div class="border-b border-gray-200 mb-4 md:mb-6">
      <nav class="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto pb-1">
        <!-- Game overview tab -->
        <button
          @click="activeTab = 'game'"
          :class="[
            'py-2 px-3 sm:px-4 border-b-2 font-medium text-sm whitespace-nowrap touch-manipulation',
            activeTab === 'game'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <!-- TODO Translate -->
          Game Overview
        </button>
        
        <!-- Player tabs -->
        <button
          v-for="player in props.game?.players || []"
          :key="player.id"
          @click="activeTab = player.id as TabId"
          :class="[
            'py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap',
            activeTab === player.id
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ player.name }}
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

    <!-- Player Stats Tabs - Each player has their own tab now -->
    <div v-if="props.game?.players?.find(p => p.id === activeTab)" class="space-y-6">
      <div v-if="selectedPlayer" class="space-y-6">
        <div class="bg-gray-50 p-6 rounded-lg">
          <h4 class="font-semibold mb-6 text-lg">{{ selectedPlayer.name }}'s Statistics</h4>
          
          <!-- Overview Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-3 rounded-lg text-center">
              <h5 class="text-sm text-blue-700">Average</h5>
              <p class="text-2xl font-bold text-blue-600">{{ selectedPlayer.averagePerTurn?.toFixed(1) || '0.0' }}</p>
            </div>
            <div class="bg-green-50 p-3 rounded-lg text-center">
              <h5 class="text-sm text-green-700">Highest Turn</h5>
              <p class="text-2xl font-bold text-green-600">{{ selectedPlayer.highestTurn || 0 }}</p>
            </div>
            <div class="bg-purple-50 p-3 rounded-lg text-center">
              <h5 class="text-sm text-purple-700">Sets Won</h5>
              <p class="text-2xl font-bold text-purple-600">{{ selectedPlayer.sets || 0 }}</p>
            </div>
            <div class="bg-yellow-50 p-3 rounded-lg text-center">
              <h5 class="text-sm text-yellow-700">Legs Won</h5>
              <p class="text-2xl font-bold text-yellow-600">{{ selectedPlayer.legs || 0 }}</p>
            </div>
          </div>
          
          <!-- Player Section Tabs -->
          <div class="mb-4 border-b border-gray-200">
            <nav class="-mb-px flex space-x-4 overflow-x-auto pb-1">
              <button
                v-for="section in ['overview', 'throws', 'checkouts', 'legs']"
                :key="section"
                @click="playerSubSection = section"
                :class="[
                  'py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap',
                  playerSubSection === section
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                {{ getSectionName(section) }}
              </button>
            </nav>
          </div>
          
          <!-- Player Overview Section -->
          <div v-if="playerSubSection === 'overview'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Scoring Stats</h5>
              <ul class="space-y-2">
                <li class="flex justify-between">
                  <span class="text-gray-600">Total Score:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.totalScore) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Throws over 100:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.throwsOver100) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Total Turns:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.totalTurns) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Starting Score:</span>
                  <span class="font-medium">{{ props.game?.players[0]?.currentScore || 501 }}</span>
                </li>
              </ul>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Checkout Stats</h5>
              <ul class="space-y-2">
                <li class="flex justify-between">
                  <span class="text-gray-600">Checkout Attempts:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.checkoutAttempts) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Successful Checkouts:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.successfulCheckouts) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Checkout %:</span>
                  <span class="font-medium">{{ formatPercentage(selectedPlayer?.checkoutPercentage) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Highest Checkout:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.highestCheckout) }}</span>
                </li>
              </ul>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Throw Accuracy</h5>
              <ul class="space-y-2">
                <li class="flex justify-between">
                  <span class="text-gray-600">Singles Hit:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.singlesHit) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Doubles Hit:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.doublesHit) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Triples Hit:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.triplesHit) }}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-gray-600">Bulls Hit:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.bullsHit) }}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <!-- Player Throw Analysis Section -->
          <div v-else-if="playerSubSection === 'throws'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Throw Distribution</h5>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span>Singles:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.singlesHit) }} ({{ calculatePercentage(selectedPlayer?.singlesHit, selectedPlayer?.totalThrows) }}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" :style="{ width: calculatePercentage(selectedPlayer?.singlesHit, selectedPlayer?.totalThrows) + '%' }"></div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span>Doubles:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.doublesHit) }} ({{ calculatePercentage(selectedPlayer?.doublesHit, selectedPlayer?.totalThrows) }}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-green-600 h-2 rounded-full" :style="{ width: calculatePercentage(selectedPlayer?.doublesHit, selectedPlayer?.totalThrows) + '%' }"></div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span>Triples:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.triplesHit) }} ({{ calculatePercentage(selectedPlayer?.triplesHit, selectedPlayer?.totalThrows) }}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-red-600 h-2 rounded-full" :style="{ width: calculatePercentage(selectedPlayer?.triplesHit, selectedPlayer?.totalThrows) + '%' }"></div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span>Bulls:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.bullsHit) }} ({{ calculatePercentage(selectedPlayer?.bullsHit, selectedPlayer?.totalThrows) }}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-yellow-600 h-2 rounded-full" :style="{ width: calculatePercentage(selectedPlayer?.bullsHit, selectedPlayer?.totalThrows) + '%' }"></div>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Performance Stats</h5>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span>Average Score Per Turn:</span>
                  <span class="font-medium">{{ formatDecimal(selectedPlayer?.averagePerTurn) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Total 180s:</span>
                  <span class="font-medium">{{ formatNumber(getPlayerScoreCount(selectedPlayer?.id, 180)) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Total 140+:</span>
                  <span class="font-medium">{{ formatNumber(getPlayerScoreAboveCount(selectedPlayer?.id, 140)) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Total 100+:</span>
                  <span class="font-medium">{{ formatNumber(getPlayerScoreAboveCount(selectedPlayer?.id, 100)) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Highest Turn Score:</span>
                  <span class="font-medium">{{ formatNumber(selectedPlayer?.highestTurn) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Player Checkouts Section -->
          <div v-else-if="playerSubSection === 'checkouts'" class="grid grid-cols-1 gap-4">
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Checkout Performance</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Attempts</span>
                  <span class="text-xl font-bold">{{ formatNumber(selectedPlayer?.checkoutAttempts) }}</span>
                </div>
                <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Success</span>
                  <span class="text-xl font-bold text-green-600">{{ formatNumber(selectedPlayer?.successfulCheckouts) }}</span>
                </div>
                <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Success Rate</span>
                  <span class="text-xl font-bold">{{ formatPercentage(selectedPlayer?.checkoutPercentage) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="selectedPlayer?.highestCheckout" class="bg-yellow-50 p-4 rounded-lg">
              <h5 class="font-medium mb-3 text-yellow-800">Highest Checkout</h5>
              <p class="text-2xl font-bold text-yellow-600">{{ formatNumber(selectedPlayer?.highestCheckout) }}</p>
            </div>

            <!-- Additional checkout info -->
            <div v-if="props.gameHistory && props.gameHistory.length" class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Recent Checkout Attempts</h5>
              <div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-2 sm:px-3 py-2 text-left">Turn</th>
                      <th class="px-2 sm:px-3 py-2 text-left">Score</th>
                      <th class="px-2 sm:px-3 py-2 text-left">Darts</th>
                      <th class="px-2 sm:px-3 py-2 text-left">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(turn, index) in getPlayerCheckoutAttempts(selectedPlayer?.id)" :key="index" class="border-b">
                      <td class="px-2 sm:px-3 py-2">{{ turn.turnNumber || index + 1 }}</td>
                      <td class="px-2 sm:px-3 py-2">{{ turn.score }}</td>
                      <td class="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <span v-for="(dart, dIndex) in turn.throws" :key="dIndex" class="mr-1">
                          {{ formatDart(dart) }}
                        </span>
                      </td>
                      <td class="px-2 sm:px-3 py-2">
                        <span v-if="turn.remainingScore === 0" class="text-green-600 font-medium">Success</span>
                        <span v-else class="text-red-600 font-medium">Failed</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Player Legs Section -->
          <div v-else-if="playerSubSection === 'legs'" class="grid grid-cols-1 gap-4">
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Leg Performance</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Legs Won</span>
                  <span class="text-xl font-bold text-green-600">{{ formatNumber(selectedPlayer?.legs) }}</span>
                </div>
                <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Sets Won</span>
                  <span class="text-xl font-bold text-blue-600">{{ formatNumber(selectedPlayer?.sets) }}</span>
                </div>
                <div class="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Win Rate</span>
                  <span class="text-xl font-bold">{{ getPlayerWinRate(selectedPlayer?.id) }}%</span>
                </div>
              </div>
            </div>
            
            <div v-if="hasLegDetails(selectedPlayer?.id)" class="bg-white p-4 rounded-lg shadow-sm">
              <h5 class="font-medium mb-3 text-gray-700">Legs Won</h5>
              <div class="space-y-2">
                <div v-for="(leg, index) in getPlayerWonLegs(selectedPlayer?.id)" :key="index" class="p-3 bg-gray-50 rounded-lg">
                  <div class="flex justify-between">
                    <span>Set {{ leg.setNumber }}, Leg {{ leg.legNumber }}</span>
                    <span class="text-sm text-gray-600">{{ formatTime(leg.endTimestamp) }}</span>
                  </div>
                  <div class="mt-2 text-sm flex justify-between">
                    <div>
                      <span class="text-gray-600">Turns:</span>
                      <span class="font-medium ml-1">{{ leg.playerStats?.[selectedPlayer?.id]?.turns || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Darts:</span>
                      <span class="font-medium ml-1">{{ leg.playerStats?.[selectedPlayer?.id]?.dartsThrown || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Avg:</span>
                      <span class="font-medium ml-1">{{ formatDecimal(leg.playerStats?.[selectedPlayer?.id]?.averagePerTurn) }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="!getPlayerWonLegs(selectedPlayer?.id).length" class="text-center py-3">
                  <p class="text-gray-500">No legs won yet</p>
                </div>
              </div>
            </div>
            
            <div v-else class="bg-gray-100 p-4 rounded-lg text-center">
              <p class="text-gray-600">No leg data available for this player.</p>
            </div>
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
                  <div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table class="min-w-full text-xs">
                      <thead>
                        <tr class="bg-gray-100">
                          <!-- TODO Translate -->
                          <th class="py-2 px-1 sm:px-3 text-left">Turn</th>
                          <th class="py-2 px-1 sm:px-3 text-left">Player</th>
                          <th class="py-2 px-1 sm:px-3 text-left">Darts</th>
                          <th class="py-2 px-1 sm:px-3 text-right">Score</th>
                          <th class="py-2 px-1 sm:px-3 text-right">Left</th>
                          <th class="hidden sm:table-cell py-2 px-1 sm:px-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(turn, index) in leg.data.throws" :key="index" 
                            class="border-b border-gray-100" 
                            :class="{'bg-green-50': turn.remainingScore === 0}">
                          <td class="py-2 px-1 sm:px-3">{{ turn.turnNumber }}</td>
                          <td class="py-2 px-1 sm:px-3 whitespace-nowrap">{{ getPlayerNameById(turn.playerId).split(' ')[0] }}</td>
                          <td class="py-2 px-1 sm:px-3 whitespace-nowrap">
                            <span v-for="(dart, dIndex) in turn.dartsThrown" :key="dIndex" class="mr-1">
                              {{ dart.multiplier === 'single' ? '' : 
                                 dart.multiplier === 'double' ? 'D' : 
                                 dart.multiplier === 'triple' ? 'T' : '' }}{{ dart.value }}
                            </span>
                          </td>
                          <td class="py-2 px-1 sm:px-3 text-right">{{ turn.score }}</td>
                          <td class="py-2 px-1 sm:px-3 text-right">{{ turn.remainingScore }}</td>
                          <td class="hidden sm:table-cell py-2 px-1 sm:px-3 text-right">{{ formatTime(turn.timestamp) }}</td>
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
import { ref, computed, watch, onMounted } from 'vue'
import type { GameState, Turn, DartThrow } from '~/stores/game'

interface Props {
  game: GameState | null
  gameHistory: Turn[]
}

const props = defineProps<Props>()

// Define TabId type to handle both string literal 'game' and player IDs
type TabId = 'game' | 'legs' | 'throws' | string

// Reactive state
const activeTab = ref<TabId>('game')
const selectedPlayerId = ref<string>('')

// Computed property to get the selected player
const selectedPlayer = computed(() => {
  if (!props.game || typeof activeTab.value === 'undefined' || activeTab.value === 'game' || activeTab.value === 'legs' || activeTab.value === 'throws') {
    return null
  }
  
  const player = props.game.players.find(p => p.id === activeTab.value)
  return player || null
})

// Generate tabs dynamically including player-specific tabs
const tabs = computed(() => {
  const baseTabs = [
    { id: 'game' as TabId, name: 'Game Overview' }
  ]
  
  // Add player-specific tabs if game data is available
  if (props.game?.players?.length) {
    props.game.players.forEach(player => {
      baseTabs.push({
        id: player.id as TabId,
        name: player.name
      })
    })
  }
  
  return baseTabs
})

// Watch for active tab changes to set the selected player
watch(() => activeTab.value, (newTab) => {
  if (props.game?.players?.find(p => p.id === newTab)) {
    // If the active tab is a player ID, set the selected player
    selectedPlayerId.value = newTab
  }
})

// Initialize selected player and set first player tab when component mounts
onMounted(() => {
  if (props.game?.players?.length) {
    // Set the first player as default
    selectedPlayerId.value = props.game.players[0].id
    
    // If no game data is loaded yet, default to the game overview tab
    if (!props.gameHistory || !props.gameHistory.length) {
      activeTab.value = 'game'
    } else {
      // Otherwise, show the first player's stats by default
      activeTab.value = props.game.players[0].id as TabId
    }
  }
})

// Computed properties
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

// The tabs are now defined as a computed property above

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
  
  // Calculate game duration properly
  let gameDuration = 0
  if (game.finishedAt && game.createdAt) {
    const finishedTime = (game.finishedAt as any)?.toDate ? (game.finishedAt as any).toDate() : new Date(game.finishedAt as any)
    const createdTime = (game.createdAt as any)?.toDate ? (game.createdAt as any).toDate() : new Date(game.createdAt as any)
    gameDuration = Math.round((finishedTime.getTime() - createdTime.getTime()) / (1000 * 60)) // Convert to minutes
  }

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

    // Calculate the score at the start of this turn
    const initialScore = turn.remainingScore + turn.score
    
    // Count checkout attempts - any turn where the starting score was ≤ 170
    if (initialScore >= 2 && initialScore <= 170) {
      totalCheckoutAttempts++
    }
    
    // Count successful checkouts
    if (turn.remainingScore === 0) {
      // In standard darts rules, a checkout must end with a double
      const lastDart = turn.throws && turn.throws.length > 0 ? turn.throws[turn.throws.length - 1] : null
      if (lastDart && lastDart.multiplier === 'double') {
        totalSuccessfulCheckouts++
        highestCheckout = Math.max(highestCheckout, turn.score)
      }
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
  
  // Also check individual turns for fastest checkout
  history.forEach(turn => {
    if (turn.remainingScore === 0 && turn.throws && turn.throws.length > 0) {
      // Check if it ended with a double (valid checkout)
      const lastDart = turn.throws[turn.throws.length - 1]
      if (lastDart && lastDart.multiplier === 'double') {
        const dartsUsedInTurn = turn.throws.length
        if (dartsUsedInTurn < fastestCheckout) {
          fastestCheckout = dartsUsedInTurn
        }
      }
    }
  })

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

// Add player sub-section control
const playerSubSection = ref<string>('overview')

// Helper method to get section names
const getSectionName = (section: string): string => {
  const sectionNames: Record<string, string> = {
    'overview': 'Overview',
    'throws': 'Throw Analysis',
    'checkouts': 'Checkouts',
    'legs': 'Leg Details'
  }
  return sectionNames[section] || section
}

// Formatting helper functions
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0'
  return value.toString()
}

const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0.0%'
  return `${value.toFixed(1)}%`
}

const formatDecimal = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0.0'
  return value.toFixed(1)
}

// Helper to get the count directly from player stats
const getPlayerStatValue = (playerId: string | undefined, stat: string): number => {
  if (!playerId || !props.game) return 0
  const player = props.game.players.find(p => p.id === playerId)
  if (!player) return 0
  
  // Use a type-safe approach to access player properties
  switch(stat) {
    case 'totalScore': return player.totalScore || 0;
    case 'throwsOver100': return player.throwsOver100 || 0;
    case 'totalTurns': return player.totalTurns || 0;
    case 'legs': return player.legs || 0;
    case 'sets': return player.sets || 0;
    case 'highestCheckout': return player.highestCheckout || 0;
    case 'highestTurn': return player.highestTurn || 0;
    case 'checkoutAttempts': return player.checkoutAttempts || 0;
    case 'successfulCheckouts': return player.successfulCheckouts || 0;
    case 'singlesHit': return player.singlesHit || 0;
    case 'doublesHit': return player.doublesHit || 0;
    case 'triplesHit': return player.triplesHit || 0;
    case 'bullsHit': return player.bullsHit || 0;
    default: return 0;
  }
}

// Player-specific statistics methods
const getPlayerThrowCount = (playerId: string | undefined, multiplier: 'single' | 'double' | 'triple'): number => {
  if (!props.gameHistory || !props.gameHistory.length || !playerId) return 0
  
  // Filter turns for this player and count throws with the specified multiplier
  return props.gameHistory
    .filter(turn => turn.playerId === playerId)
    .reduce((count, turn) => {
      if (!turn.throws) return count
      return count + turn.throws.filter(t => t.multiplier === multiplier).length
    }, 0)
}

const getPlayerTotalThrows = (playerId: string): number => {
  if (!props.gameHistory || !props.gameHistory.length) return 0
  
  // Count all throws for this player
  return props.gameHistory
    .filter(turn => turn.playerId === playerId)
    .reduce((count, turn) => {
      if (!turn.throws) return count
      return count + turn.throws.length
    }, 0)
}

const getPlayerThrowPercentage = (playerId: string, multiplier: 'single' | 'double' | 'triple'): number => {
  const totalThrows = getPlayerTotalThrows(playerId)
  const multiplierThrows = getPlayerThrowCount(playerId, multiplier)
  return totalThrows > 0 ? Math.round((multiplierThrows / totalThrows) * 100) : 0
}

const getPlayerBullCount = (playerId: string): number => {
  if (!props.gameHistory || !props.gameHistory.length) return 0
  
  // Count bull throws (value 25)
  return props.gameHistory
    .filter(turn => turn.playerId === playerId)
    .reduce((count, turn) => {
      if (!turn.throws) return count
      return count + turn.throws.filter(t => t.value === 25).length
    }, 0)
}

const getPlayerBullPercentage = (playerId: string): number => {
  const totalThrows = getPlayerTotalThrows(playerId)
  const bullThrows = getPlayerBullCount(playerId)
  return totalThrows > 0 ? Math.round((bullThrows / totalThrows) * 100) : 0
}

const getPlayerScoreCount = (playerId: string, exactScore: number): number => {
  if (!props.gameHistory || !props.gameHistory.length) return 0
  
  // Count turns with exactly the specified score
  return props.gameHistory
    .filter(turn => turn.playerId === playerId && turn.score === exactScore)
    .length
}

const getPlayerScoreAboveCount = (playerId: string, minScore: number): number => {
  if (!props.gameHistory || !props.gameHistory.length) return 0
  
  // Count turns with score above or equal to minScore
  return props.gameHistory
    .filter(turn => turn.playerId === playerId && turn.score >= minScore)
    .length
}

const getPlayerWinRate = (playerId: string): number => {
  if (!props.game) return 0
  
  const player = props.game.players.find(p => p.id === playerId)
  if (!player) return 0
  
  const legsWon = player.legs || 0
  const totalLegs = props.game.currentLeg - 1 + props.game.currentSet - 1
  
  return totalLegs > 0 ? Math.round((legsWon / totalLegs) * 100) : 0
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
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

// Format a dart throw for display
const formatDart = (dart: DartThrow): string => {
  if (!dart) return ''
  
  const prefix = 
    dart.multiplier === 'double' ? 'D' :
    dart.multiplier === 'triple' ? 'T' :
    ''
  
  return `${prefix}${dart.value}`
}

// Get checkout attempts for a specific player
const getPlayerCheckoutAttempts = (playerId: string | undefined): any[] => {
  if (!props.gameHistory || !props.gameHistory.length || !playerId) return []
  
  return props.gameHistory
    .filter(turn => {
      if (turn.playerId !== playerId) return false
      
      // Calculate score at the start of the turn
      const initialScore = turn.remainingScore + turn.score
      
      // Count the turn as a checkout attempt if the initial score was ≤ 170 and ≥ 2
      return initialScore >= 2 && initialScore <= 170
    })
    .slice(0, 10) // Limit to 10 most recent attempts
}

// Check if a player has any leg details
const hasLegDetails = (playerId: string | undefined): boolean => {
  if (!props.game || !props.game.legsData || !playerId) return false
  
  // Check if the player has won any legs
  return Object.values(props.game.legsData).some(
    leg => leg.winningPlayerId === playerId
  )
}

// Get legs won by a specific player
const getPlayerWonLegs = (playerId: string | undefined): any[] => {
  if (!props.game || !props.game.legsData || !playerId) return []
  
  const wonLegs = []
  for (const [legId, legData] of Object.entries(props.game.legsData)) {
    if (legData.winningPlayerId === playerId) {
      wonLegs.push({
        ...legData,
        legId
      })
    }
  }
  
  return wonLegs.sort((a, b) => {
    // Sort by set number first, then leg number
    if (a.setNumber !== b.setNumber) {
      return a.setNumber - b.setNumber
    }
    return a.legNumber - b.legNumber
  })
}

// Helper to calculate percentages safely
const calculatePercentage = (value: number | undefined | null, total: number | undefined | null): number => {
  if (!value || !total || total <= 0) return 0
  return Math.round((value / total) * 100)
}
</script>