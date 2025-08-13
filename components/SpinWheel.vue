<template>
    <div class="spin-wheel-container">
        <!-- Background overlay -->
        <div v-if="isSpinning || showResult" class="fixed inset-0 bg-black bg-opacity-75 z-50">
            <div class="min-h-screen flex items-center justify-center p-4">
                <div class="bg-white rounded-lg p-8 max-w-md w-full">
                    
                    <!-- Spinning Phase -->
                    <div v-if="isSpinning && !showResult" class="text-center">
                        <!-- TODO Translate -->
                        <h3 class="text-xl font-bold mb-6">{{ spinTitle }}</h3>
                        
                        <!-- Spin Wheel SVG -->
                        <div class="relative mx-auto mb-6" style="width: 280px; height: 280px;">
                            <svg 
                                width="280" 
                                height="280" 
                                viewBox="0 0 280 280"
                                class="wheel-svg"
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
                        
                        <p class="text-gray-600">
                            <!-- TODO Translate -->
                            Spinning to determine {{ spinType }}...
                        </p>
                    </div>

                    <!-- Result Phase -->
                    <div v-else-if="showResult" class="text-center">
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

                        <button 
                            @click="handleConfirm"
                            class="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                        >
                            <!-- TODO Translate -->
                            Continue
                        </button>
                    </div>
                </div>
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
    preCalculatedResult?: any // Host provides the result, component just animates
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

// Methods (defined before lifecycle hooks to avoid TDZ issues)
const startSpin = async () => {
    // Prevent multiple spins from starting
    if (hasStartedSpin.value) {
        console.log('🎯 SpinWheel: Spin already in progress, ignoring additional spin request')
        return
    }
    
    hasStartedSpin.value = true
    isSpinning.value = true
    
    // Ensure DOM is updated and wheel is rendered at 0 degrees first
    await nextTick()
    
    // Small delay to ensure the initial state is rendered
    setTimeout(async () => {
        // Pick a random angle between 0-360 for the final result
        const targetAngle = Math.random() * 360
        
        // Add multiple full rotations for visual effect (3000 degrees = 8.33 full rotations)
        const totalRotation = 3000 + targetAngle
        
        console.log(`🎯 SpinWheel: Starting spin, target angle: ${targetAngle}°, total rotation: ${totalRotation}°`)
        
        // Set the target rotation - this triggers the CSS animation
        currentRotation.value = totalRotation
        
        // After spin completes, use the pre-calculated result (don't calculate locally)
        setTimeout(() => {
            console.log(`🎯 SpinWheel: Spin complete, using pre-calculated result`)
            
            // Only use pre-calculated result from host - no local calculation
            if (props.preCalculatedResult) {
                if (props.spinType === 'pairing') {
                    resultPairings.value = props.preCalculatedResult
                } else {
                    selectedPlayer.value = props.preCalculatedResult
                }
            } else {
                console.warn('⚠️ No pre-calculated result provided! This should not happen.')
                // Emergency fallback - but this should never be reached
                if (props.spinType === 'pairing') {
                    resultPairings.value = generateRoundPairings()
                } else {
                    selectedPlayer.value = props.players[0] || null
                }
            }
            
            showResult.value = true
        }, 3000) // Match the CSS transition duration
    }, 100) // Small delay to ensure initial render
}

const generateRoundPairings = (): RoundPairing[] => {
    const players = [...props.players]
    const pairings: RoundPairing[] = []
    
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
    
    // Create pairings from shuffled players
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            const player1 = players[i]
            const player2 = players[i + 1]
            // Randomly assign home side using sector-based calculation 
            const homeAngle = Math.random() * 360
            const homePlayerId = homeAngle < 180 ? player1.id : player2.id
            
            pairings.push({
                player1Id: player1.id,
                player2Id: player2.id,
                player1Name: player1.name,
                player2Name: player2.name,
                homePlayerId,
                roundNumber: props.roundNumber || 1
            })
        }
    }
    
    return pairings
}

const emitResult = () => {
    if (props.spinType === 'pairing') {
        emit('result', resultPairings.value)
    } else {
        emit('result', selectedPlayer.value!)
    }
}

const close = () => {
    emit('close')
}

// Auto-start spin when component mounts or when pre-calculated result is available
onMounted(() => {
    // Small delay to ensure component is fully rendered
    setTimeout(() => {
        startSpin()
    }, 200)
})

// Watch for pre-calculated result changes (for non-host players getting result from Firestore)
watch(() => props.preCalculatedResult, (newResult) => {
    if (newResult && !showResult.value && !isSpinning.value) {
        console.log('🎯 Pre-calculated result received, starting spin animation:', newResult)
        startSpin()
    }
}, { immediate: true })

// Computed
const spinTitle = computed(() => {
    if (props.spinType === 'pairing') {
        // TODO Translate
        return `Round ${props.roundNumber || 1} Pairings`
    } else {
        // TODO Translate
        return 'Determining Starting Player'
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
// const startSpin = async () => {
//     isSpinning.value = true
    
//     // Ensure DOM is updated and wheel is rendered at 0 degrees first
//     await nextTick()
    
//     // Small delay to ensure the initial state is rendered
//     setTimeout(async () => {
//         // Pick a random angle between 0-360 for the final result
//         const targetAngle = Math.random() * 360
        
//         // Add multiple full rotations for visual effect (3000 degrees = 8.33 full rotations)
//         const totalRotation = 3000 + targetAngle
        
//         console.log(`🎯 SpinWheel: Starting spin, target angle: ${targetAngle}°, total rotation: ${totalRotation}°`)
        
//         // Set the target rotation - this triggers the CSS animation
//         currentRotation.value = totalRotation
        
//         // After spin completes, use the pre-calculated result (don't calculate locally)
//         setTimeout(() => {
//             console.log(`🎯 SpinWheel: Spin complete, using pre-calculated result`)
            
//             // Only use pre-calculated result from host - no local calculation
//             if (props.preCalculatedResult) {
//                 if (props.spinType === 'pairing') {
//                     resultPairings.value = props.preCalculatedResult
//                 } else {
//                     selectedPlayer.value = props.preCalculatedResult
//                 }
//             } else {
//                 console.warn('⚠️ No pre-calculated result provided! This should not happen.')
//                 // Emergency fallback - but this should never be reached
//                 if (props.spinType === 'pairing') {
//                     resultPairings.value = generateRoundPairings()
//                 } else {
//                     selectedPlayer.value = props.players[0] || null
//                 }
//             }
            
//             showResult.value = true
//         }, 3000) // Match the CSS transition duration
//     }, 100) // Small delay to ensure initial render
// }

// const generateRoundPairings = (): RoundPairing[] => {
//     const players = [...props.players]
//     const pairings: RoundPairing[] = []
    
//     // If we have an existing pairing (for home-side determination)
//     if (props.existingPairing) {
//         const homePlayerId = selectedPlayer.value?.id || 
//             (Math.random() < 0.5 ? props.existingPairing.player1.id : props.existingPairing.player2.id)
        
//         return [{
//             player1Id: props.existingPairing.player1.id,
//             player2Id: props.existingPairing.player2.id,
//             player1Name: props.existingPairing.player1.name,
//             player2Name: props.existingPairing.player2.name,
//             homePlayerId,
//             roundNumber: props.roundNumber || 1
//         }]
//     }
    
//     // Shuffle players for random pairing
//     for (let i = players.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [players[i], players[j]] = [players[j], players[i]]
//     }
    
//     // Create pairings from shuffled players
//     for (let i = 0; i < players.length; i += 2) {
//         if (i + 1 < players.length) {
//             const player1 = players[i]
//             const player2 = players[i + 1]
//             // Randomly assign home side using sector-based calculation 
//             const homeAngle = Math.random() * 360
//             const homePlayerId = homeAngle < 180 ? player1.id : player2.id
            
//             pairings.push({
//                 player1Id: player1.id,
//                 player2Id: player2.id,
//                 player1Name: player1.name,
//                 player2Name: player2.name,
//                 homePlayerId,
//                 roundNumber: props.roundNumber || 1
//             })
//         }
//     }
    
//     return pairings
// }

const handleConfirm = () => {
    if (props.spinType === 'pairing') {
        emit('result', resultPairings.value)
    } else {
        if (selectedPlayer.value) {
            emit('result', selectedPlayer.value)
        }
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
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
        '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
    ]
    return colors[index % colors.length]
}

const getTextX = (index: number, totalSegments: number): number => {
    const angle = ((360 / totalSegments) * (index + 0.5)) * Math.PI / 180
    const radius = 85
    return 140 + radius * Math.cos(angle)
}

const getTextY = (index: number, totalSegments: number): number => {
    const angle = ((360 / totalSegments) * (index + 0.5)) * Math.PI / 180
    const radius = 85
    return 140 + radius * Math.sin(angle)
}

const getTextRotation = (index: number, totalSegments: number): string => {
    const angle = (360 / totalSegments) * (index + 0.5)
    const textAngle = angle > 90 && angle < 270 ? angle + 180 : angle
    const x = getTextX(index, totalSegments)
    const y = getTextY(index, totalSegments)
    return `rotate(${textAngle} ${x} ${y})`
}

// Setup a flag to prevent multiple spins
const hasStartedSpin = ref(false)

// Auto-start spin when component mounts
onMounted(async () => {
    console.log('🎯 SpinWheel: Component mounted, preparing to spin...')
    
    // Ensure the component is fully rendered before starting spin
    await nextTick()
    
    // Only start the spin if it hasn't been started yet
    if (!hasStartedSpin.value) {
        // Small delay to show the wheel in its initial state before spinning
        setTimeout(() => {
            console.log('🎯 SpinWheel: Starting spin sequence...')
            startSpin()
        }, 500)
    }
})
</script>

<style scoped>
.spin-wheel-container {
    position: relative;
}

/* Ensure smooth spinning animation */
.wheel-svg {
    will-change: transform;
    transition: transform 3000ms cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* Make sure the transition is applied */
svg {
    transform-origin: center center;
}
</style>
