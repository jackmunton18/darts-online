<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div class="absolute inset-0 bg-black bg-opacity-75" @click="handleClose"></div>
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden transform transition-all"
        :class="{ 'animate-bounce-once': animateBounce }"
      >
        <!-- Header with forfeit win type -->
        <div 
          class="p-4 text-center text-white font-bold text-xl bg-orange-600"
        >
          <div class="flex justify-between items-center">
            <div class="w-8"></div>
            <div>
              <!-- TODO: Translate -->
              WIN BY FORFEIT!
            </div>
            <div class="w-8 text-right">
              <span class="text-2xl">🏆</span>
            </div>
          </div>
        </div>

        <!-- Winner section -->
        <div class="p-6">
          <div class="text-center mb-6">
            <!-- TODO: Translate -->
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white">
              {{ winnerName }} Wins!
            </h3>
            <p class="text-gray-700 dark:text-gray-200 mt-2 font-medium">
              Your opponent has abandoned the game
            </p>
          </div>

          <!-- Forfeit info card -->
          <div class="bg-orange-50 dark:bg-orange-900 dark:bg-opacity-40 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
            <div class="flex items-center justify-center mb-3">
              <span class="text-4xl">⚠️</span>
            </div>
            <div class="text-center">
              <p class="text-orange-800 dark:text-orange-200 font-medium">
                {{ opponentName }} has left the game
              </p>
              <p class="text-orange-700 dark:text-orange-300 text-sm mt-1">
                You are awarded the victory by forfeit
              </p>
            </div>
          </div>

          <!-- Game status at time of forfeit -->
          <div class="space-y-4 mb-6">
            <div class="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
              Game Status When Forfeited
            </div>
            
            <div v-for="player in players" :key="player.id" 
              class="p-4 rounded-lg border-2 transition-all" 
              :class="[
                player.id === winnerId 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-40 shadow-md' 
                  : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
              ]"
            >
              <div class="flex justify-between items-center">
                <div class="font-bold text-gray-800 dark:text-white">
                  {{ player.name }}
                  <span v-if="player.id === abandonedBy" class="text-red-600 text-sm ml-2">(Abandoned)</span>
                  <span v-if="player.id === winnerId" class="text-green-600 text-sm ml-2">(Winner)</span>
                </div>
                
                <div class="flex items-center">
                  <span class="text-sm mr-2 text-gray-700 dark:text-gray-200">
                    Sets: {{ player.sets }} | Legs: {{ player.legs }}
                  </span>
                  <span 
                    v-if="player.id === winnerId"
                    class="flex items-center justify-center bg-green-600 text-white rounded-full w-6 h-6"
                  >
                    <span class="icon-trophy">🏆</span>
                  </span>
                </div>
              </div>
              
              <!-- Score details -->
              <div class="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div class="bg-white dark:bg-gray-800 p-2 rounded text-center shadow-sm">
                  <div class="font-medium text-gray-800 dark:text-white">{{ player.currentScore }}</div>
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

          <!-- Action button -->
          <div class="text-center">
            <button 
              @click="handleClose"
              class="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-base font-medium touch-manipulation shadow-md"
              style="min-height: 48px;"
            >
              <!-- TODO: Translate -->
              Continue to Game Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { Player } from '~/stores/game'

interface Props {
  show: boolean
  winnerId: string
  abandonedBy: string
  players: Player[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const animateBounce = ref(true)

// Find the winner name
const winnerName = computed(() => {
  const winner = props.players.find(player => player.id === props.winnerId)
  return winner ? winner.name : 'Unknown Player'
})

// Find the opponent (abandoned player) name
const opponentName = computed(() => {
  const opponent = props.players.find(player => player.id === props.abandonedBy)
  return opponent ? opponent.name : 'Unknown Player'
})

// Handle closing the modal
const handleClose = () => {
  // Navigate to analytics
  const route = useRoute()
  const gameId = route.params.id
  if (gameId) {
    navigateTo(`/game/${gameId}/analytics`)
  }
  
  emit('close')
}

// Handle modal show
watch(() => props.show, (newValue) => {
  console.log('🏆 Forfeit Win Modal show changed:', newValue, {
    winnerId: props.winnerId,
    abandonedBy: props.abandonedBy,
    playersCount: props.players.length
  })
  
  if (newValue) {
    animateBounce.value = true
    
    // Reset bounce animation after 1s
    setTimeout(() => {
      animateBounce.value = false
    }, 1000)
  }
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
