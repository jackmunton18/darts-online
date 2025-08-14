<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <!-- Header Section -->
        <div class="panel-dark shadow-md rounded-lg p-6 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-3xl font-bold mb-4">Tournaments</h1>
            <p class="text-gray-700 mb-4">
                <!-- TODO Translate -->
                Compete against multiple players in bracket or group tournaments. 
                Challenge your skills in round-robin groups or knockout brackets with up to 16 players.
            </p>
            
            <!-- Tournament Mode Description -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div class="info-box-dark blue">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-2">🏆 Bracket Mode</h3>
                    <p class="text-sm">
                        <!-- TODO Translate -->
                        Classic knockout tournament. Win or go home! Semi-finals, finals, and optional third-place playoff.
                        Perfect for 4, 8, or 16 players.
                    </p>
                </div>
                <div class="info-box-dark green">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-2">🎯 Group Mode</h3>
                    <p class="text-sm">
                        <!-- TODO Translate -->
                        Round-robin format where everyone plays everyone. 3 points for a win, 1 point for losing 
                        with at least one leg won. Top players advance to final.
                    </p>
                </div>
            </div>
        </div>

        <!-- Action Buttons Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Create Tournament -->
            <div class="panel-dark rounded-lg shadow-md p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-bold mb-4">Create Tournament</h2>
                <p class="text-gray-600 mb-4">
                    <!-- TODO Translate -->
                    Start a new tournament and invite other players to join.
                </p>
                <button 
                    @click="showCreateModal = true"
                    class="w-full btn-primary py-3 px-6 rounded-md font-medium"
                >
                    <!-- TODO Translate -->
                    Create New Tournament
                </button>
            </div>

            <!-- Join Tournament -->
            <div class="panel-dark rounded-lg shadow-md p-6">
                <!-- TODO Translate -->
                <h2 class="text-xl font-bold mb-4">Join Tournament</h2>
                <p class="text-gray-600 mb-4">
                    <!-- TODO Translate -->
                    Enter a tournament code to join an existing tournament.
                </p>
                <div class="space-y-3">
                    <input
                        v-model="joinCode"
                        type="text"
                        placeholder="Enter tournament code"
                        class="input-dark w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        maxlength="6"
                        @input="formatJoinCode"
                    >
                    <button 
                        @click="handleJoinTournament"
                        :disabled="!joinCode || joinCode.length !== 6 || isJoining"
                        class="w-full btn-success py-3 px-6 rounded-md font-medium"
                    >
                        <!-- TODO Translate -->
                        {{ isJoining ? 'Joining...' : 'Join Tournament' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Previous Tournaments Section -->
        <div class="panel-dark rounded-lg shadow-md p-6">
            <!-- TODO Translate -->
            <h2 class="text-xl font-bold mb-4">Your Tournament History</h2>
            
            <div v-if="isLoadingHistory" class="flex justify-center py-6">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            
            <div v-else-if="tournamentHistory.length === 0" class="text-center py-6 text-gray-500">
                <!-- TODO Translate -->
                <p>No tournament history yet. Create or join your first tournament!</p>
            </div>
            
            <div v-else class="space-y-4">
                <div 
                    v-for="tournament in tournamentHistory" 
                    :key="tournament.id"
                    class="border border-gray-200 rounded-lg p-4 hover:bg-dark-tertiary"
                >
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-semibold">
                                {{ tournament.mode.charAt(0).toUpperCase() + tournament.mode.slice(1) }} Tournament
                            </h3>
                            <p class="text-sm text-gray-600">
                                {{ tournament.gameType }} • {{ tournament.players.length }} players
                                • {{ new Date(tournament.createdAt.toDate()).toLocaleDateString() }}
                            </p>
                            <div class="mt-2">
                                <span 
                                    :class="getTournamentStatusClass(tournament.status)"
                                    class="inline-block px-2 py-1 text-xs rounded-full"
                                >
                                    {{ tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1) }}
                                </span>
                            </div>
                        </div>
                        <div class="text-right">
                            <p v-if="tournament.status === 'completed'" class="text-sm font-medium">
                                {{ getTournamentResult(tournament) }}
                            </p>
                            <button 
                                @click="viewTournament(tournament.id)"
                                class="mt-2 hover:underline text-sm" style="color: var(--text-accent)"
                            >
                                <!-- TODO Translate -->
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Tournament Modal -->
        <div v-if="showCreateModal" class="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div class="absolute inset-0 bg-black bg-opacity-50" @click="showCreateModal = false"></div>
            <div class="modal-dark rounded-lg shadow-xl w-full max-w-2xl relative z-10 max-h-screen overflow-y-auto">
                <div class="p-6">
                    <!-- TODO Translate -->
                    <h3 class="text-xl font-semibold mb-6">Create New Tournament</h3>
                    
                    <form @submit.prevent="handleCreateTournament" class="space-y-6">
                        <!-- Game Settings -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <!-- TODO Translate -->
                                <label class="block text-sm font-medium mb-2">Game Type</label>
                                <select v-model="createForm.gameType" class="input-dark w-full px-3 py-2 rounded-md">
                                    <option value="501">501</option>
                                    <option value="301">301</option>
                                    <option value="701">701</option>
                                </select>
                            </div>
                            <div>
                                <!-- TODO Translate -->
                                <label class="block text-sm font-medium mb-2">Legs to Win</label>
                                <select v-model="createForm.legsToWin" class="input-dark w-full px-3 py-2 rounded-md">
                                    <option :value="1">1</option>
                                    <option :value="3">3</option>
                                    <option :value="5">5</option>
                                </select>
                            </div>
                            <div>
                                <!-- TODO Translate -->
                                <label class="block text-sm font-medium mb-2">Sets to Win</label>
                                <select v-model="createForm.setsToWin" class="input-dark w-full px-3 py-2 rounded-md">
                                    <option :value="1">1</option>
                                    <option :value="2">2</option>
                                    <option :value="3">3</option>
                                </select>
                            </div>
                        </div>

                        <!-- Tournament Settings -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <!-- TODO Translate -->
                                <label class="block text-sm font-medium mb-2">Tournament Mode</label>
                                <select v-model="createForm.mode" class="input-dark w-full px-3 py-2 rounded-md">
                                    <option value="bracket">Bracket (Knockout)</option>
                                    <option value="group">Group (Round Robin)</option>
                                </select>
                            </div>
                            <div>
                                <!-- TODO Translate -->
                                <label class="block text-sm font-medium mb-2">Max Players</label>
                                <select v-model="createForm.maxPlayers" class="input-dark w-full px-3 py-2 rounded-md">
                                    <option :value="4">4 Players</option>
                                    <option :value="8">8 Players</option>
                                    <option :value="16">16 Players</option>
                                </select>
                            </div>
                        </div>

                        <!-- Bonus Points Settings -->
                        <div class="border border-primary rounded-lg p-4 bg-dark-secondary">
                            <!-- TODO Translate -->
                            <h4 class="font-medium mb-3">Bonus Points</h4>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <label class="flex items-center">
                                        <input 
                                            v-model="createForm.bonusPoints.enable180s" 
                                            type="checkbox" 
                                            class="mr-2"
                                        >
                                        <!-- TODO Translate -->
                                        <span>180s</span>
                                    </label>
                                    <input 
                                        v-if="createForm.bonusPoints.enable180s"
                                        v-model.number="createForm.bonusPoints.points180"
                                        type="number"
                                        min="1"
                                        max="5"
                                        class="input-dark w-16 px-2 py-1 rounded text-center"
                                    >
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="flex items-center">
                                        <input 
                                            v-model="createForm.bonusPoints.enable170s" 
                                            type="checkbox" 
                                            class="mr-2"
                                        >
                                        <!-- TODO Translate -->
                                        <span>170s (Big Fish)</span>
                                    </label>
                                    <input 
                                        v-if="createForm.bonusPoints.enable170s"
                                        v-model.number="createForm.bonusPoints.points170"
                                        type="number"
                                        min="1"
                                        max="5"
                                        class="input-dark w-16 px-2 py-1 rounded text-center"
                                    >
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="flex items-center">
                                        <input 
                                            v-model="createForm.bonusPoints.enableBullCheckout" 
                                            type="checkbox" 
                                            class="mr-2"
                                        >
                                        <!-- TODO Translate -->
                                        <span>Bull Checkout</span>
                                    </label>
                                    <input 
                                        v-if="createForm.bonusPoints.enableBullCheckout"
                                        v-model.number="createForm.bonusPoints.pointsBullCheckout"
                                        type="number"
                                        min="1"
                                        max="5"
                                        class="input-dark w-16 px-2 py-1 rounded text-center"
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Third Place Playoff (Bracket only) -->
                        <div v-if="createForm.mode === 'bracket'" class="flex items-center">
                            <input 
                                v-model="createForm.enableThirdPlace" 
                                type="checkbox" 
                                id="thirdPlace"
                                class="mr-2"
                            >
                            <label for="thirdPlace" class="text-sm font-medium">
                                <!-- TODO Translate -->
                                Enable third place playoff
                            </label>
                        </div>

                        <!-- Modal Actions -->
                        <div class="flex space-x-4 pt-6 border-t">
                            <button
                                type="button"
                                @click="showCreateModal = false"
                                class="flex-1 btn-secondary py-2 px-4 rounded-md"
                                :disabled="isCreating"
                            >
                                <!-- TODO Translate -->
                                Cancel
                            </button>
                            <button
                                type="submit"
                                class="flex-1 btn-primary py-2 px-4 rounded-md"
                                :disabled="isCreating"
                            >
                                <!-- TODO Translate -->
                                {{ isCreating ? 'Creating...' : 'Create Tournament' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Tournament, TournamentSettings } from '~/types/tournament'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'

// Store access
const authStore = useAuthStore()
const toast = useNotificationStore()

// State
const showCreateModal = ref(false)
const joinCode = ref('')
const isJoining = ref(false)
const isCreating = ref(false)
const isLoadingHistory = ref(true)
const tournamentHistory = ref<Tournament[]>([])

// Create form data
const createForm = ref<TournamentSettings>({
    gameType: '501',
    legsToWin: 3,
    setsToWin: 1,
    mode: 'bracket',
    maxPlayers: 4,
    enableThirdPlace: true,
    bonusPoints: {
        enable180s: true,
        enable170s: true,
        enableBullCheckout: true,
        points180: 2,
        points170: 2,
        pointsBullCheckout: 1
    }
})

// TODO: Import tournament composable when created
const { createTournament, joinTournament } = useTournament()

// Methods
const formatJoinCode = () => {
    // Format join code to uppercase and limit to 6 characters
    joinCode.value = joinCode.value.toUpperCase().slice(0, 6)
}

const handleJoinTournament = async () => {
    if (!joinCode.value || joinCode.value.length !== 6) return
    
    try {
        isJoining.value = true
        const tournament = await joinTournament(joinCode.value)
        await navigateTo(`/tournament/${tournament.id}`)
    } catch (error) {
        console.error('Error joining tournament:', error)
        toast.addMessage({ type: 'error', message: 'Failed to join tournament. Please check the code and try again.' })
    } finally {
        isJoining.value = false
    }
}

const handleCreateTournament = async () => {
    try {
        isCreating.value = true
        const tournament = await createTournament(createForm.value)
        showCreateModal.value = false
        await navigateTo(`/tournament/${tournament.id}`)
    } catch (error) {
        console.error('Error creating tournament:', error)
        toast.addMessage({ type: 'error', message: 'Failed to create tournament. Please try again.' })
    } finally {
        isCreating.value = false
    }
}

const viewTournament = (tournamentId: string) => {
    navigateTo(`/tournament/${tournamentId}`)
}

const getTournamentStatusClass = (status: string) => {
    switch (status) {
        case 'completed':
            return 'bg-success bg-opacity-20 text-success'
        case 'active':
            return 'bg-info bg-opacity-20 text-info'
        case 'waiting':
            return 'bg-warning bg-opacity-20 text-warning'
        default:
            return 'bg-dark-tertiary text-secondary'
    }
}

const getTournamentResult = (tournament: Tournament) => {
    // TODO: Implement tournament result calculation
    const userPlayer = tournament.players.find(p => p.id === authStore.currentUser?.id)
    if (!userPlayer) return 'Spectated'
    
    // Placeholder logic
    return 'Result TBD'
}

const loadTournamentHistory = async () => {
    try {
        isLoadingHistory.value = true
        // TODO: Load user's tournament history from Firestore
        // For now, empty array
        tournamentHistory.value = []
    } catch (error) {
        console.error('Error loading tournament history:', error)
    } finally {
        isLoadingHistory.value = false
    }
}

// Lifecycle
onMounted(() => {
    loadTournamentHistory()
})
</script>
