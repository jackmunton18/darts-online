<template>
    <div class="debug-spin-wheel-container">
        <!-- Always visible for debugging -->
        <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                
                <!-- Debug Info -->
                <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 class="font-bold text-yellow-800 mb-2">DEBUG INFO</h4>
                    <div class="text-sm text-yellow-700 space-y-1">
                        <div>Spin Type: {{ spinType }}</div>
                        <div>Players Count: {{ players.length }}</div>
                        <div>Is Spinning: {{ isSpinning }}</div>
                        <div>Show Result: {{ showResult }}</div>
                        <div>Current Rotation: {{ currentRotation }}deg</div>
                    </div>
                </div>

                <!-- Spinning Phase -->
                <div v-if="!showResult" class="text-center">
                    <!-- TODO Translate -->
                    <h3 class="text-xl font-bold mb-6">{{ spinTitle }}</h3>
                    
                    <!-- Spin Wheel SVG -->
                    <div class="relative mx-auto mb-6" style="width: 280px; height: 280px;">
                        <svg 
                            width="280" 
                            height="280" 
                            viewBox="0 0 280 280"
                            class="transform transition-transform ease-out"
                            :class="{ 'duration-[3000ms]': isSpinning }"
                            :style="{ transform: `rotate(${currentRotation}deg)` }"
                        >
                            <!-- Wheel segments -->
                            <g v-for="(player, index) in players" :key="player.id">
                                <path
                                    :d="getSegmentPath(index, players.length)"
                                    :fill="getSegmentColor(index)"
                                    stroke="white"
                                    stroke-width="2"
                                />
                                <text
                                    :x="getTextX(index, players.length)"
                                    :y="getTextY(index, players.length)"
                                    :transform="getTextRotation(index, players.length)"
                                    class="text-white font-medium text-sm"
                                    text-anchor="middle"
                                    dominant-baseline="middle"
                                >
                                    {{ player.name }}
                                </text>
                            </g>
                        </svg>
                        
                        <!-- Pointer -->
                        <div class="absolute top-2 left-1/2 transform -translate-x-1/2">
                            <div class="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-red-600"></div>
                        </div>
                    </div>
                    
                    <!-- Debug Controls -->
                    <div class="space-y-3">
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            Debug Mode: Spinning to determine {{ spinType }}...
                        </p>
                        
                        <div class="flex gap-2 justify-center">
                            <button 
                                @click="startSpin"
                                :disabled="isSpinning"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                            >
                                <!-- TODO Translate -->
                                {{ isSpinning ? 'Spinning...' : 'Start Spin' }}
                            </button>
                            
                            <button 
                                @click="stopSpin"
                                :disabled="!isSpinning"
                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                            >
                                <!-- TODO Translate -->
                                Stop Spin
                            </button>
                            
                            <button 
                                @click="resetSpin"
                                class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                            >
                                <!-- TODO Translate -->
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Result Phase -->
                <div v-else class="text-center">
                    <!-- TODO Translate -->
                    <h3 class="text-xl font-bold mb-6">{{ resultTitle }}</h3>
                    
                    <div v-if="spinType === 'pairing'" class="space-y-4">
                        <div 
                            v-for="pairing in resultPairings" 
                            :key="`${pairing.player1Id}-${pairing.player2Id}`"
                            class="bg-gray-50 p-4 rounded-lg"
                        >
                            <div class="flex items-center justify-center space-x-4">
                                <span class="font-medium">{{ pairing.player1Name }}</span>
                                <span class="text-gray-500">vs</span>
                                <span class="font-medium">{{ pairing.player2Name }}</span>
                            </div>
                            <div class="text-sm text-gray-600 mt-2">
                                <!-- TODO Translate -->
                                {{ getHomePlayerName(pairing) }} starts first
                            </div>
                        </div>
                    </div>
                    
                    <div v-else-if="spinType === 'home-side'" class="bg-blue-50 p-4 rounded-lg">
                        <p class="text-lg font-medium text-blue-800">
                            {{ selectedPlayer?.name }}
                        </p>
                        <p class="text-sm text-blue-600 mt-1">
                            <!-- TODO Translate -->
                            Will start first in this game
                        </p>
                    </div>

                    <div class="flex gap-2 justify-center mt-6">
                        <button 
                            @click="handleConfirm"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                        >
                            <!-- TODO Translate -->
                            Continue
                        </button>
                        
                        <button 
                            @click="resetSpin"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
                        >
                            <!-- TODO Translate -->
                            Try Again
                        </button>
                    </div>
                </div>

                <!-- Close Button -->
                <button 
                    @click="$emit('close')"
                    class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TournamentPlayer, RoundPairing } from '~/types/tournament'

// Props
interface Props {
    players: TournamentPlayer[]
    spinType: 'pairing' | 'home-side'
    roundNumber?: number
    existingPairing?: { player1: TournamentPlayer; player2: TournamentPlayer }
}

const props = defineProps<Props>()

// Emits
interface Emits {
    result: [pairings: RoundPairing[]] | [homePlayer: TournamentPlayer]
    close: []
}

const emit = defineEmits<Emits>()

// State
const isSpinning = ref(false)
const showResult = ref(false)
const currentRotation = ref(0)
const selectedPlayer = ref<TournamentPlayer | null>(null)
const resultPairings = ref<RoundPairing[]>([])

// Computed
const spinTitle = computed(() => {
    if (props.spinType === 'pairing') {
        // TODO Translate
        return `Round ${props.roundNumber || 1} Pairings (DEBUG)`
    } else {
        // TODO Translate
        return 'Determining Starting Player (DEBUG)'
    }
})

const resultTitle = computed(() => {
    if (props.spinType === 'pairing') {
        // TODO Translate
        return `Round ${props.roundNumber || 1} Matchups`
    } else {
        // TODO Translate
        return 'Starting Player Selected'
    }
})

// Methods
const startSpin = () => {
    console.log('DEBUG: Starting spin with players:', props.players)
    isSpinning.value = true
    showResult.value = false
    
    // Random rotation (multiple full rotations plus final position)
    const spins = 5 + Math.random() * 3 // 5-8 full rotations
    const finalPosition = Math.random() * 360
    const newRotation = spins * 360 + finalPosition
    
    console.log('DEBUG: Setting rotation to:', newRotation)
    currentRotation.value = newRotation
    
    // Auto-stop after 3 seconds for debugging (but don't timeout)
    setTimeout(() => {
        console.log('DEBUG: Spin animation should be complete')
        // Don't auto-calculate result in debug mode
    }, 3000)
}

const stopSpin = () => {
    console.log('DEBUG: Manually stopping spin')
    isSpinning.value = false
    calculateResult(currentRotation.value % 360)
    showResult.value = true
}

const resetSpin = () => {
    console.log('DEBUG: Resetting spin')
    isSpinning.value = false
    showResult.value = false
    currentRotation.value = 0
    selectedPlayer.value = null
    resultPairings.value = []
}

const calculateResult = (finalRotation: number) => {
    console.log('DEBUG: Calculating result for rotation:', finalRotation)
    
    if (props.spinType === 'pairing') {
        // Generate round pairings
        resultPairings.value = generateRoundPairings()
        console.log('DEBUG: Generated pairings:', resultPairings.value)
    } else {
        // Select starting player based on wheel position
        const segmentAngle = 360 / props.players.length
        const normalizedRotation = (360 - (finalRotation % 360)) % 360
        const selectedIndex = Math.floor(normalizedRotation / segmentAngle)
        selectedPlayer.value = props.players[selectedIndex] || props.players[0]
        console.log('DEBUG: Selected player:', selectedPlayer.value)
    }
}

const generateRoundPairings = (): RoundPairing[] => {
    const players = [...props.players]
    const pairings: RoundPairing[] = []
    
    console.log('DEBUG: Generating pairings from players:', players)
    
    // If we have an existing pairing (for home-side determination)
    if (props.existingPairing) {
        const homePlayerId = selectedPlayer.value?.id || 
            (Math.random() < 0.5 ? props.existingPairing.player1.id : props.existingPairing.player2.id)
        
        return [{
            player1Id: props.existingPairing.player1.id,
            player2Id: props.existingPairing.player2.id,
            player1Name: props.existingPairing.player1.name,
            player2Name: props.existingPairing.player2.name,
            homePlayerId,
            roundNumber: props.roundNumber || 1
        }]
    }
    
    // Shuffle players for random pairing
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]]
    }
    
    // Create pairings
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            const homePlayerId = Math.random() < 0.5 ? players[i].id : players[i + 1].id
            
            pairings.push({
                player1Id: players[i].id,
                player2Id: players[i + 1].id,
                player1Name: players[i].name,
                player2Name: players[i + 1].name,
                homePlayerId,
                roundNumber: props.roundNumber || 1
            })
        }
    }
    
    return pairings
}

const handleConfirm = () => {
    if (props.spinType === 'pairing') {
        emit('result', resultPairings.value)
    } else if (selectedPlayer.value) {
        emit('result', selectedPlayer.value)
    }
    emit('close')
}

const getHomePlayerName = (pairing: RoundPairing): string => {
    return pairing.homePlayerId === pairing.player1Id ? pairing.player1Name : pairing.player2Name
}

// SVG helper methods
const getSegmentPath = (index: number, totalSegments: number): string => {
    const angle = (360 / totalSegments) * Math.PI / 180
    const startAngle = index * angle
    const endAngle = (index + 1) * angle
    
    const radius = 130
    const centerX = 140
    const centerY = 140
    
    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)
    
    const largeArcFlag = angle > Math.PI ? 1 : 0
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
}

const getSegmentColor = (index: number): string => {
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ]
    return colors[index % colors.length]
}

const getTextX = (index: number, totalSegments: number): number => {
    const angle = (360 / totalSegments) * (index + 0.5) * Math.PI / 180
    const radius = 85
    const centerX = 140
    return centerX + radius * Math.cos(angle)
}

const getTextY = (index: number, totalSegments: number): number => {
    const angle = (360 / totalSegments) * (index + 0.5) * Math.PI / 180
    const radius = 85
    const centerY = 140
    return centerY + radius * Math.sin(angle)
}

const getTextRotation = (index: number, totalSegments: number): string => {
    const angle = (360 / totalSegments) * (index + 0.5)
    const textAngle = angle > 90 && angle < 270 ? angle + 180 : angle
    const x = getTextX(index, totalSegments)
    const y = getTextY(index, totalSegments)
    return `rotate(${textAngle} ${x} ${y})`
}

// Debug: Log when component mounts
onMounted(() => {
    console.log('DEBUG: DebugSpinWheel mounted with props:', props)
    console.log('DEBUG: Players:', props.players)
    console.log('DEBUG: Spin type:', props.spinType)
})
</script>

<style scoped>
.debug-spin-wheel-container {
    position: relative;
}

/* Ensure smooth spinning animation */
svg {
    will-change: transform;
}

/* Debug styles */
.absolute {
    position: absolute;
}
</style>
