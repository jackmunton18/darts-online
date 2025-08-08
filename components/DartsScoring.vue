<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-4">Score Input</h3>
      
      <!-- Input Method Toggle -->
      <div class="flex w-full space-x-2 mb-4">
        <button
          @click="inputMethod = 'total'"
          :class="[
            'flex-1 px-3 py-3 rounded-md font-medium touch-manipulation',
            inputMethod === 'total'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
          style="min-height: 48px;"
        >
          Total Score
        </button>
        <button
          @click="inputMethod = 'individual'"
          :class="[
            'flex-1 px-3 py-3 rounded-md font-medium touch-manipulation',
            inputMethod === 'individual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
          style="min-height: 48px;"
        >
          Individual
        </button>
      </div>

      <!-- Total Score Input -->
      <div v-if="inputMethod === 'total'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Total Score for Turn
          </label>
          <input
            v-model.number="totalScoreInput"
            type="number"
            min="0"
            :max="remainingScore"
            class="w-full px-3 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="min-height: 48px;"
            placeholder="Enter total score"
          />
        </div>
        <button
          @click="submitTotalScore"
          :disabled="!isValidTotalScore"
          class="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg touch-manipulation"
          style="min-height: 54px;"
        >
          Submit Score
        </button>
      </div>

      <!-- Individual Throws Input -->
      <div v-if="inputMethod === 'individual'" class="space-y-4">
        <!-- Current Throws Display -->
        <div v-if="currentThrows.length > 0" class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium mb-2">Current Throws:</h4>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(dartThrow, index) in currentThrows"
              :key="index"
              class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {{ getThrowLabel(dartThrow) }} ({{ dartThrow.score }})
            </div>
          </div>
          <div class="mt-2 text-lg font-semibold">
            Total: {{ totalScore }}
          </div>
          <button
            @click="removeLastThrow"
            :disabled="currentThrows.length === 0"
            class="mt-2 text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400"
          >
            Remove Last Throw
          </button>
        </div>

        <!-- Multiplier Toggle Buttons -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Multiplier</label>
          <div class="flex w-full space-x-2">
            <button
              @click="selectedMultiplier = 'single'"
              :class="[
                'flex-1 px-2 sm:px-4 py-3 rounded-md font-medium touch-manipulation text-base',
                selectedMultiplier === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
              style="min-height: 48px;"
            >
              Single
            </button>
            <button
              @click="selectedMultiplier = 'double'"
              :class="[
                'flex-1 px-2 sm:px-4 py-3 rounded-md font-medium touch-manipulation text-base',
                selectedMultiplier === 'double'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
              style="min-height: 48px;"
            >
              Double
            </button>
            <button
              @click="selectedMultiplier = 'triple'"
              :class="[
                'flex-1 px-2 sm:px-4 py-3 rounded-md font-medium touch-manipulation text-base',
                selectedMultiplier === 'triple'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
              style="min-height: 48px;"
            >
              Triple
            </button>
          </div>
        </div>

        <!-- Number Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Number</label>
          <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
            <!-- Numbers 0-20 -->
            <button
              v-for="num in 21"
              :key="num - 1"
              @click="addThrow(num - 1, selectedMultiplier)"
              :disabled="!canAddThrow(num - 1, selectedMultiplier) || currentThrows.length >= 3"
              class="p-2 md:p-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-lg touch-manipulation"
              style="min-height: 48px;"
            >
              {{ num - 1 }}
            </button>
            
            <!-- Outer Bull (25) -->
            <button
              @click="addThrow(25, 'single')"
              :disabled="!canAddThrow(25, 'single') || currentThrows.length >= 3"
              class="p-2 md:p-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm md:text-base touch-manipulation"
              style="min-height: 48px;"
            >
              25
            </button>
            
            <!-- Double Bull (25 double) -->
            <button
              @click="addThrow(25, 'double')"
              :disabled="!canAddThrow(25, 'double') || currentThrows.length >= 3"
              class="p-2 md:p-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm md:text-base touch-manipulation"
              style="min-height: 48px;"
            >
              Bull
            </button>
          </div>
        </div>

        <!-- Throw Counter -->
        <div class="text-center text-sm text-gray-600">
          {{ currentThrows.length }}/3 throws
        </div>

        <!-- Submit Individual Throws -->
        <button
          @click="submitIndividualThrows"
          :disabled="currentThrows.length === 0"
          class="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg touch-manipulation"
          style="min-height: 54px;"
        >
          Submit Throws ({{ totalScore }})
        </button>
      </div>
    </div>

    <!-- Checkout Suggestions -->
    <div v-if="remainingScore <= 170 && remainingScore > 0" class="mt-6">
      <h4 class="font-medium mb-2">Checkout Suggestions:</h4>
      <div class="space-y-2">
        <div
          v-for="(suggestion, index) in checkoutSuggestions"
          :key="index"
          class="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
        >
          <div class="font-medium text-yellow-800">
            Option {{ index + 1 }}:
          </div>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-for="(dartThrow, dartIndex) in suggestion"
              :key="dartIndex"
              class="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm font-medium"
            >
              {{ dartThrow }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Best Scoring Options -->
    <div v-if="remainingScore > 0 && bestScoringOptions.length > 0" class="mt-6">
      <h4 class="font-medium mb-2">Best Scoring Options:</h4>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button
          v-for="option in bestScoringOptions"
          :key="`${option.value}-${option.multiplier}`"
          @click="handleAddThrow(option)"
          :disabled="!canAddThrowOption(option)"
          class="p-2 border border-green-300 rounded-lg text-center hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <div class="font-medium text-green-800">{{ option.label }}</div>
          <div class="text-sm text-green-600">{{ option.score }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDartsScoring } from '~/composables/useDartsScoring'
import type { DartThrow } from '~/stores/game'

interface Props {
  remainingScore: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  scoreSubmitted: [score: number, throws?: DartThrow[]]
}>()

const {
  currentThrows,
  totalScore,
  scoringOptions,
  addThrow,
  removeLastThrow,
  clearThrows,
  getScoringOptions,
  getCheckoutSuggestions,
  getBestScoringOptions
} = useDartsScoring()

const inputMethod = ref<'total' | 'individual'>('total')
const totalScoreInput = ref<number>(0)
const selectedMultiplier = ref<'single' | 'double' | 'triple'>('single')

// Computed properties
const isValidTotalScore = computed(() => {
  return totalScoreInput.value >= 0 && 
         totalScoreInput.value <= props.remainingScore && 
         totalScoreInput.value !== 1
})

const availableScoringOptions = computed(() => {
  return getScoringOptions(props.remainingScore - totalScore.value)
})

const checkoutSuggestions = computed(() => {
  return getCheckoutSuggestions(props.remainingScore)
})

const bestScoringOptions = computed(() => {
  return getBestScoringOptions(props.remainingScore - totalScore.value)
})

// Methods
const canAddThrow = (value: number, multiplier: 'single' | 'double' | 'triple') => {
  const score = multiplier === 'single' ? value : multiplier === 'double' ? value * 2 : value * 3
  const potentialScore = totalScore.value + score
  return potentialScore <= props.remainingScore && potentialScore !== 1
}

const canAddThrowOption = (option: any) => {
  const multiplier = option.multiplier as 'single' | 'double' | 'triple'
  return canAddThrow(option.value, multiplier)
}

const handleAddThrow = (option: any) => {
  const multiplier = option.multiplier as 'single' | 'double' | 'triple'
  addThrow(option.value, multiplier)
}

const getThrowLabel = (dartThrow: DartThrow) => {
  const { value, multiplier } = dartThrow
  if (value === 0) return 'Miss'
  if (value === 25) {
    return multiplier === 'double' ? 'Bullseye' : 'Outer Bull'
  }
  const prefix = multiplier === 'single' ? 'S' : multiplier === 'double' ? 'D' : 'T'
  return `${prefix}${value}`
}

const submitTotalScore = () => {
  if (isValidTotalScore.value) {
    emit('scoreSubmitted', totalScoreInput.value)
    totalScoreInput.value = 0
  }
}

const submitIndividualThrows = () => {
  if (currentThrows.value.length > 0) {
    emit('scoreSubmitted', totalScore.value, [...currentThrows.value])
    clearThrows()
  }
}

// Watch for remaining score changes and clear throws if needed
watch(() => props.remainingScore, (newScore: number) => {
  if (newScore === 0) {
    clearThrows()
    totalScoreInput.value = 0
  }
})
</script> 