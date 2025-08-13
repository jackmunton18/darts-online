<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div class="absolute inset-0 bg-black bg-opacity-75" @click="handleClose"></div>
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden transform transition-all"
        :class="{ 'animate-bounce-once': animateBounce }"
      >
        <!-- Header with win type -->
        <div 
          class="p-4 text-center text-white font-bold text-xl"
          :class="isGameWin ? 'bg-yellow-600' : isSetWin ? 'bg-purple-600' : 'bg-green-600'"
        >
          <div class="flex justify-between items-center">
            <div class="w-8"></div>
            <div>
              <!-- TODO: Translate -->
              {{ isGameWin ? 'GAME OVER!' : isSetWin ? `SET ${setNumber} COMPLETE!` : `LEG ${legNumber} COMPLETE!` }}
            </div>
            <div class="w-8 text-right">
              <span v-if="countdown > 0" class="text-base font-normal opacity-80">{{ countdown }}</span>
            </div>
          </div>
        </div>

        <!-- Winner section -->
        <div class="p-6">
          <div class="text-center mb-6">
            <!-- TODO: Translate -->
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white">
              {{ winnerName }} {{ isGameWin ? 'Wins the Game!' : isSetWin ? 'Wins the Set!' : 'Wins the Leg!' }}
            </h3>
            <p class="text-gray-700 dark:text-gray-200 mt-2 font-medium">
              {{ isGameWin ? 'Final Score' : 'Current Score' }}
            </p>
          </div>

          <!-- Player scores -->
          <div class="space-y-4">
            <div v-for="player in players" :key="player.id" 
              class="p-4 rounded-lg border-2 transition-all text-white" 
              :class="[
                player.id === winnerId 
                  ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-40 shadow-md' 
                  : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
              ]"
            >
              <div class="flex justify-between items-center">
                <div class="font-bold text-gray-800 dark:text-white">{{ player.name }}</div>
                
                <div class="flex items-center">
                  <span class="text-sm mr-2 text-gray-700 dark:text-gray-200">
                    Sets: {{ player.sets }} | Legs: {{ player.legs }}
                  </span>
                  <span 
                    v-if="player.id === winnerId"
                    class="flex items-center justify-center bg-yellow-600 text-white rounded-full w-6 h-6"
                  >
                    <span class="icon-trophy">🏆</span>
                  </span>
                </div>
              </div>
              
              <!-- Score details -->
              <div class="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div class="bg-white dark:bg-gray-800 p-2 rounded text-center shadow-sm">
                  <!-- Display 0 for the winner, or actual score for others -->
                  <div class="font-medium text-gray-800 dark:text-white">
                    {{ player.id === winnerId ? 0 : player.currentScore }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-300">Remaining</div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-2 rounded text-center shadow-sm">
                  <div class="font-medium text-gray-800 dark:text-white">{{ player.averagePerTurn.toFixed(1) }}</div>
                  <div class="text-xs text-gray-600 dark:text-gray-300">Average</div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-2 rounded text-center shadow-sm">
                  <div class="font-medium text-gray-800 dark:text-white">{{ player.highestTurn || 0 }}</div>
                  <div class="text-xs text-gray-600 dark:text-gray-300">Highest</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="mt-6">
            <!-- Tournament Game - Show two buttons -->
            <div v-if="isGameWin && isTournamentGame" class="flex flex-col sm:flex-row gap-3">
              <button 
                @click="goToAnalytics"
                class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-medium touch-manipulation shadow-md"
                style="min-height: 48px;"
              >
                <!-- TODO: Translate -->
                View Analytics
              </button>
              <button 
                @click="returnToTournament"
                class="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-base font-medium touch-manipulation shadow-md"
                style="min-height: 48px;"
              >
                <!-- TODO: Translate -->
                Return to Tournament
              </button>
            </div>
            
            <!-- Regular Game - Single button -->
            <div v-else class="text-center">
              <button 
                @click="handleClose"
                class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-medium touch-manipulation shadow-md"
                style="min-height: 48px;"
              >
                <!-- TODO: Translate -->
                {{ isGameWin ? 'View Detailed Analytics' : isSetWin ? 'Continue to Next Set' : 'Continue to Next Leg' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import type { Player } from '~/stores/game'

interface Props {
  show: boolean
  isGameWin: boolean
  isSetWin?: boolean
  legNumber: number
  setNumber?: number
  winnerId: string
  players: Player[]
  autoCloseDelay?: number
  tournamentId?: string // If present, this is a tournament game
}

const props = withDefaults(defineProps<Props>(), {
  autoCloseDelay: 3, // Default 3 second delay
  isSetWin: false,
  setNumber: 1
})

const emit = defineEmits<{
  close: []
}>()

const countdown = ref(props.autoCloseDelay)
const animateBounce = ref(true)
let countdownTimer: NodeJS.Timeout | null = null

// Find the winner name
const winnerName = computed(() => {
  const winner = props.players.find(player => player.id === props.winnerId)
  return winner ? winner.name : 'Unknown Player'
})

// Check if this is a tournament game
const isTournamentGame = computed(() => {
  return !!props.tournamentId
})

// Handle closing the modal
const handleClose = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  // For tournament games, don't auto-navigate - let user choose
  if (props.isGameWin && isTournamentGame.value) {
    emit('close')
    return
  }
  
  // For regular games, navigate to analytics on game win
  if (props.isGameWin) {
    const route = useRoute()
    const gameId = route.params.id
    if (gameId) {
      navigateTo(`/game/${gameId}/analytics`)
    }
  }
  
  emit('close')
}

// Handle navigation to analytics
const goToAnalytics = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  const route = useRoute()
  const gameId = route.params.id
  if (gameId) {
    navigateTo(`/game/${gameId}/analytics`)
  }
  
  emit('close')
}

// Handle navigation back to tournament
const returnToTournament = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  if (props.tournamentId) {
    navigateTo(`/tournament/${props.tournamentId}`)
  }
  
  emit('close')
}

// Start countdown when shown
watch(() => props.show, (newValue) => {
  console.log('🎯 Modal show changed:', newValue, {
    isGameWin: props.isGameWin,
    isSetWin: props.isSetWin,
    legNumber: props.legNumber,
    setNumber: props.setNumber,
    winnerId: props.winnerId,
    playersCount: props.players.length
  })
  
  if (newValue) {
    animateBounce.value = true
    
    // Only start countdown for leg wins, not game wins
    if (!props.isGameWin) {
      countdown.value = props.autoCloseDelay
      startCountdown()
    } else {
      // For game wins, don't show countdown - user must manually close
      countdown.value = 0
    }
    
    // Reset bounce animation after 1s
    setTimeout(() => {
      animateBounce.value = false
    }, 1000)
  }
})

// Start the countdown timer
const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  
  // Don't start countdown for game wins - user must manually proceed
  if (props.isGameWin) {
    return
  }
  
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      handleClose()
    }
  }, 1000)
}

// Clean up on unmount
onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-bounce-once {
  animation: bounce 0.6s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
