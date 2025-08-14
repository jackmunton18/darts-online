<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="card">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Game Session</h1>
            <div class="flex justify-between items-center">
                <p class="text-secondary mb-2">
                    <!-- TODO Translate -->
                    <span v-if="currentGame">Game Code: <span class="font-medium">{{ currentGame.gameCode }}</span></span>
                </p>
                <div class="flex space-x-3">
                    <!-- Abandon Game Button (only show for active players in playing games) -->
                    <button 
                        v-if="currentGame && currentGame.status === 'playing' && isCurrentUserPlaying"
                        class="danger-button"
                        @click="showAbandonConfirm = true"
                    >
                        <!-- TODO Translate -->
                        Abandon Game
                    </button>
                    <button 
                        class="secondary-button"
                        @click="navigateToHome"
                    >
                        <!-- TODO Translate -->
                        Back to Games
                    </button>
                </div>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 loading-spinner"></div>
        </div>

        <div v-else-if="!currentGame" class="card">
            <!-- TODO Translate -->
            <h2 class="text-lg font-semibold mb-4">Game Not Found</h2>
            <p class="text-secondary mb-4">The game session you're looking for could not be found.</p>
            <button 
                class="primary-button"
                @click="navigateToHome"
            >
                <!-- TODO Translate -->
                Return to Games
            </button>
        </div>

        <div v-else>
            <!-- Game Lobby (Only show when waiting) -->
            <div v-if="currentGame.status === 'waiting'" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div class="card">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4">Game Lobby</h3>
                    
                    <div class="game-code-container p-3 md:p-4 rounded-lg mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                        <!-- TODO Translate -->
                        <div class="font-medium text-center sm:text-left">Game Code: <span class="game-code font-bold tracking-wider">{{ currentGame.gameCode }}</span></div>
                        <button 
                            @click="copyGameCode" 
                            class="copy-button w-full sm:w-auto text-sm px-4 py-2 rounded touch-manipulation"
                        >
                            <!-- TODO Translate -->
                            Copy
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <!-- TODO Translate -->
                        <h4 class="text-md font-medium mb-2">Players ({{ currentGame.players.length }}/2)</h4>
                        <ul class="player-list rounded-lg">
                            <li v-for="player in currentGame.players" :key="player.id" class="p-3 flex items-center">
                                <span class="flex-1">{{ getPlayerDisplayName(player) }}</span>
                                <span v-if="player.id === currentGame.hostId" class="host-badge px-2 py-1 text-xs rounded">
                                    <!-- TODO Translate -->
                                    Host
                                </span>
                            </li>
                            <!-- Show placeholder for missing player -->
                            <li v-if="currentGame.players.length < 2" class="p-3 waiting-text italic">
                                <!-- TODO Translate -->
                                Waiting for another player to join...
                            </li>
                        </ul>
                    </div>
                    
                    <div class="mb-4" v-if="currentGame.spectators && currentGame.spectators.length > 0">
                        <!-- TODO Translate -->
                        <h4 class="text-md font-medium mb-2">Spectators</h4>
                        <ul class="spectator-list rounded-lg">
                            <li v-for="spectatorId in currentGame.spectators" :key="spectatorId" class="p-3">
                                <span class="spectator-text">{{ getSpectatorName(spectatorId) }}</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                            v-if="isHost"
                            @click="handleStartGame"
                            :disabled="isLoading || currentGame.players.length < 2"
                            class="flex-1 start-game-button text-base font-medium touch-manipulation"
                            :class="{ 'disabled': isLoading || currentGame.players.length < 2 }"
                            style="min-height: 52px;"
                        >
                            <!-- TODO Translate -->
                            {{ isLoading ? 'Starting...' : currentGame.players.length < 2 ? `Waiting for players` : 'Start Game' }}
                        </button>
                        <button
                            @click="handleLeaveGame"
                            :disabled="isLoading"
                            class="flex-1 leave-game-button text-base font-medium touch-manipulation"
                            :class="{ 'disabled': isLoading }"
                            style="min-height: 52px;"
                        >
                            <!-- TODO Translate -->
                            {{ isLoading ? 'Leaving...' : 'Leave Game' }}
                        </button>
                    </div>
                </div>
                
                <!-- Game History and Analytics (Only show in waiting room if we have turns) -->
                <div v-if="turns.length > 0" class="card">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4">Game History</h3>
                    
                    <div class="max-h-96 overflow-y-auto">
                        <table class="min-w-full table-history">
                            <thead class="table-header">
                                <tr>
                                    <!-- TODO Translate -->
                                    <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Score</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Throws</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Remaining</th>
                                </tr>
                            </thead>
                            <tbody class="table-body">
                                <tr v-for="turn in turns" :key="`${turn.playerId}-${turn.timestamp}`" class="table-row">
                                    <td class="px-4 py-2 whitespace-nowrap">
                                        {{ getPlayerName(turn.playerId) }}
                                    </td>
                                    <td class="px-4 py-2 whitespace-nowrap font-medium">
                                        {{ turn.score }}
                                    </td>
                                    <td class="px-4 py-2">
                                        <div class="flex space-x-1">
                                            <span 
                                                v-for="(dart, i) in turn.throws" 
                                                :key="i"
                                                class="px-2 py-1 text-xs dart-throw rounded"
                                            >
                                                {{ formatThrow(dart) }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-2 whitespace-nowrap">
                                        {{ turn.remainingScore }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Scoring Component (show when playing or just finished to allow modal to appear) - Full width layout -->
            <DartsScoringGame v-if="currentGame.status === 'playing' || currentGame.status === 'finished'" :key="gameId" />
        </div>
        
        <!-- Abandon Game Confirmation Modal -->
        <div v-if="showAbandonConfirm" class="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div class="modal-overlay absolute inset-0" @click="showAbandonConfirm = false"></div>
            <div class="modal-container w-full max-w-md relative z-10">
                <div class="p-6">
                    <!-- TODO Translate -->
                    <h3 class="text-lg font-semibold mb-4">Abandon Game?</h3>
                    <p class="modal-text mb-6">
                        <!-- TODO Translate -->
                        Are you sure you want to abandon this game? Your opponent will be awarded the win and the game will end immediately. This action cannot be undone.
                    </p>
                    
                    <div class="flex space-x-4">
                        <button
                            @click="showAbandonConfirm = false"
                            class="flex-1 cancel-button py-2 px-4 rounded-md font-medium"
                            :disabled="isAbandoning"
                            :class="{ 'disabled': isAbandoning }"
                        >
                            <!-- TODO Translate -->
                            Cancel
                        </button>
                        <button
                            @click="handleAbandonGame"
                            class="flex-1 confirm-danger-button py-2 px-4 rounded-md font-medium"
                            :disabled="isAbandoning"
                            :class="{ 'disabled': isAbandoning }"
                        >
                            <!-- TODO Translate -->
                            {{ isAbandoning ? 'Abandoning...' : 'Yes, Abandon Game' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useFirebaseDartsGame } from '~/composables/useFirebaseDartsGame'
import { useGamePersistence } from '~/composables/useGamePersistence'
import { useNotificationStore } from '~/stores/notification'
import { useAuthStore } from '~/stores/auth'
import type { DartThrow, Turn } from '~/stores/game'
import type { FirebaseGame } from '~/composables/useFirebaseDartsGame'

// Get route for parameters
const route = useRoute()
const toast = useNotificationStore()

// Get the game ID from the route params
const gameId = computed(() => route.params.id as string)

// Firebase darts game service
const { 
    currentGame,
    turns,
    isHost,
    isCurrentUserPlaying,
    subscribeToGame,
    leaveGame,
    startGame,
    unsubscribeFromGame,
    abandonGame
} = useFirebaseDartsGame()

const isLoading = ref(true)
const isNavigatingAway = ref(false)
const showAbandonConfirm = ref(false)
const isAbandoning = ref(false)

// Game persistence service
const { 
    saveGameSession
} = useGamePersistence()

// Navigate back to appropriate page
const navigateToHome = () => {
    isNavigatingAway.value = true
    
    // If this is a tournament game, navigate back to the tournament lobby
    if (currentGame.value && currentGame.value.tournamentId) {
        navigateTo(`/tournament/${currentGame.value.tournamentId}`)
    } else {
        // Regular game, navigate to home
        navigateTo('/')
    }
}

// Navigate to analytics for this game
const navigateToGameAnalytics = () => {
    isNavigatingAway.value = true
    navigateTo(`/game/${gameId.value}/analytics`)
}

// Handle game actions
const handleStartGame = async () => {
    try {
        isLoading.value = true
        await startGame()
    } catch (err: any) {
        toast.addMessage({
            type: 'error',
            message: err.message || 'Failed to start game'
        })
    } finally {
        isLoading.value = false
    }
}

const handleLeaveGame = async () => {
    try {
        isLoading.value = true
        await leaveGame()
        navigateToHome()
    } catch (err: any) {
        toast.addMessage({
            type: 'error',
            message: err.message || 'Failed to leave game'
        })
        isLoading.value = false
    }
}

const copyGameCode = () => {
    if (!currentGame.value?.gameCode) return
    
    navigator.clipboard.writeText(currentGame.value.gameCode)
        .then(() => {
            toast.addMessage({
                type: 'success',
                message: 'Game code copied to clipboard!'
            })
        })
        .catch((err) => {
            console.error('Failed to copy game code:', err)
            toast.addMessage({
                type: 'error',
                message: 'Failed to copy game code'
            })
        })
}

const handleAbandonGame = async () => {
    if (!currentGame.value || !gameId.value) {
        return
    }

    try {
        isAbandoning.value = true
        
        const authStore = useAuthStore()
        
        if (!authStore.currentUser) {
            throw new Error('User not authenticated')
        }

        if (!abandonGame) {
            throw new Error('Abandon game function not available')
        }

        const result = await abandonGame(gameId.value, authStore.currentUser.id)
        
        if (result.success) {
            toast.addMessage({
                type: 'warning',
                message: 'You have abandoned the game. Your opponent has been awarded the win.'
            })
            
            // Close the modal
            showAbandonConfirm.value = false
            
            // Navigate to analytics page after a brief delay
            setTimeout(() => {
                navigateTo(`/game/${gameId.value}/analytics`)
            }, 1500)
        } else {
            throw new Error('Failed to abandon game')
        }
    } catch (error) {
        console.error('Error abandoning game:', error)
        toast.addMessage({
            type: 'error',
            message: 'Failed to abandon the game. Please try again.'
        })
    } finally {
        isAbandoning.value = false
    }
}

// Methods
const getPlayerDisplayName = (player: any): string => {
    // For new games, player.name should already contain the Firestore username
    // For legacy games, player.name might be split email username
    return player?.name || 'Unknown Player'
}

const getPlayerName = (playerId: string): string => {
    const player = currentGame.value?.players.find((p) => p.id === playerId)
    return getPlayerDisplayName(player)
}

const getSpectatorName = (spectatorId: string): string => {
    // TODO: In a future version, fetch Firestore username for spectators
    // For now, just show a shorter ID since we don't store spectator names in the game doc
    const shortId = spectatorId.substring(0, 8)
    return `Spectator (${shortId})`
}

const formatThrow = (dartThrow: DartThrow): string => {
    if (dartThrow.value === 0) return 'Miss'
    if (dartThrow.value === 25 && dartThrow.multiplier === 'single') return 'Outer Bull'
    if (dartThrow.value === 25 && dartThrow.multiplier === 'double') return 'Bull'
    
    const prefix = 
        dartThrow.multiplier === 'single' ? 'S' : 
        dartThrow.multiplier === 'double' ? 'D' : 'T'
    
    return `${prefix}${dartThrow.value}`
}

// Watch for game status changes
watch(() => currentGame.value?.status, (newStatus, oldStatus) => {
    if (newStatus === 'finished' && oldStatus === 'playing') {
        // Don't navigate automatically - let the DartsScoringGame modal handle this
        console.log('Game finished, modal should appear in DartsScoringGame component')
    }
})

// Subscribe to the game when mounted
onMounted(async () => {
    if (!gameId.value) {
        toast.addMessage({
            type: 'error',
            message: 'Invalid game ID'
        })
        isLoading.value = false
        return
    }
    
    try {
        if (typeof subscribeToGame === 'function') {
            await subscribeToGame(gameId.value)
            
            // Check if game is already finished and redirect to analytics
            if (currentGame.value && currentGame.value.status === 'finished') {
                toast.addMessage({
                    type: 'info',
                    message: 'This game has already finished. Redirecting to analytics...'
                })
                setTimeout(() => {
                    navigateTo(`/game/${gameId.value}/analytics`)
                }, 1500)
            }
            
            // Save this session to local storage for resuming later
            if (currentGame.value) {
                saveGameSession()
            }
        } else {
            throw new Error('Game subscription function not available')
        }
    } catch (error) {
        console.error('Failed to subscribe to game:', error)
        toast.addMessage({
            type: 'error',
            message: 'Failed to load game'
        })
    } finally {
        isLoading.value = false
    }
})

// Clean up properly when leaving
onBeforeUnmount(() => {
    if (!isNavigatingAway.value) {
        if (typeof leaveGame === 'function') {
            leaveGame()
        } else if (typeof unsubscribeFromGame === 'function') {
            unsubscribeFromGame()
        }
    }
})
</script>

<style>
/* Define dart theme colors first */
:root {
    /* Dart Theme Colors */
    --dart-green: #01ac5a;        /* Dartboard green */
    --dart-red: #e61e26;          /* Dartboard red */
    --dart-black: #161616;        /* Dartboard black */
    --dart-cream: #f5e7d0;        /* Dartboard cream/tan */
    --dart-blue: #0072bb;         /* Accent blue */
    --dart-gold: #ffd700;         /* Gold accent */
    
    /* Background Colors - Dart Theme */
    --bg-primary: #0a0f0d;        /* Main background (very dark green-black) */
    --bg-secondary: #111a16;      /* Secondary background (slightly lighter) */
    --bg-tertiary: #1a2922;       /* Tertiary background (for cards, etc) */
    --bg-input: #0a0f0d;          /* Input field background */
    --bg-success: var(--dart-green); /* Success background (green) */
    --bg-danger: var(--dart-red);    /* Danger background (red) */
    --bg-warning: #bb8009;        /* Warning background (amber) */
    --bg-info: var(--dart-blue);     /* Info background (blue) */
    --bg-active: #243830;         /* Active element background */
    --bg-accent-primary: #01ac5a20; /* Primary accent with transparency */
    --bg-accent-secondary: #01ac5a30; /* Secondary accent with transparency */
    --bg-table-header: #111a16;   /* Table header background */
    --bg-table-row-hover: #1a2922; /* Table row hover */
    --bg-modal-overlay: rgba(0, 0, 0, 0.7); /* Modal overlay */
    
    /* Button Colors */
    --bg-button-primary: var(--dart-green);  /* Primary button */
    --bg-button-primary-hover: #02c467;      /* Primary button hover */
    --bg-button-secondary: #1a2922;          /* Secondary button */
    --bg-button-secondary-hover: #243830;    /* Secondary button hover */
    --bg-button-success: var(--dart-green);  /* Success button */
    --bg-button-success-hover: #02c467;      /* Success button hover */
    --bg-button-danger: var(--dart-red);     /* Danger button */
    --bg-button-danger-hover: #fd3c44;       /* Danger button hover */
    --bg-button-warning: #bb8009;            /* Warning button */
    --bg-button-warning-hover: #dca315;      /* Warning button hover */
    --bg-button-disabled: #37433e;           /* Disabled button */
    
    /* Text Colors */
    --text-primary: #e2e8e5;      /* Primary text */
    --text-secondary: #9baca4;    /* Secondary text */
    --text-muted: #6e7d77;        /* Muted text */
    --text-light: #f5f9f7;        /* Light text (for dark backgrounds) */
    --text-accent: #01c065;       /* Accent text (green) */
    --text-success: #07dd74;      /* Success text */
    --text-danger: #ff5a60;       /* Danger text */
    --text-warning: #ffd75c;      /* Warning text */
    --text-info: #4c9ed9;         /* Info text */
    --text-disabled: #6e7d77;     /* Disabled text */
    --text-highlight: var(--dart-gold); /* Highlighted text */
    
    /* Border Colors */
    --border-primary: #273e33;    /* Primary border */
    --border-secondary: #1a2922;  /* Secondary border */
    --border-success: var(--dart-green); /* Success border */
    --border-danger: var(--dart-red);    /* Danger border */
    --border-warning: #bb8009;    /* Warning border */
    --border-info: var(--dart-blue);     /* Info border */
    --border-accent: var(--dart-green);  /* Accent border */
    --border-highlight: var(--dart-gold); /* Highlight border */
}

/* Global Theme Base - Dark by Default */
html, body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    margin: 0;
    padding: 0;
    background-image: 
        radial-gradient(circle at 10% 20%, rgba(1, 172, 90, 0.03) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(230, 30, 38, 0.03) 0%, transparent 20%);
}

/* Keeping dark-theme class for backward compatibility */
.dark-theme {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    background-image: 
        radial-gradient(circle at 10% 20%, rgba(1, 172, 90, 0.03) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(230, 30, 38, 0.03) 0%, transparent 20%);
}

/* Card and Container Styles */
.card {
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-left: 3px solid var(--dart-green);
    border-radius: 0.5rem;
    box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
    position: relative;
}

/* Button Styles */
.primary-button {
    background-color: var(--bg-button-primary);
    color: var(--text-light);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
}

.primary-button:hover {
    background-color: var(--bg-button-primary-hover);
}

.secondary-button {
    background-color: var(--bg-button-secondary);
    color: var(--text-light);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    border: 1px solid var(--border-primary);
}

.secondary-button:hover {
    background-color: var(--bg-button-secondary-hover);
}

.danger-button {
    background-color: var(--bg-button-danger);
    color: var(--text-light);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.danger-button:hover {
    background-color: var(--bg-button-danger-hover);
}

.start-game-button {
    background-color: var(--bg-button-success);
    color: var(--text-light);
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
}

.start-game-button:hover {
    background-color: var(--bg-button-success-hover);
}

.leave-game-button {
    background-color: var(--bg-button-danger);
    color: var(--text-light);
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
}

.leave-game-button:hover {
    background-color: var(--bg-button-danger-hover);
}

.copy-button {
    background-color: var(--bg-button-secondary);
}

.copy-button:hover {
    background-color: var(--bg-button-secondary-hover);
}

.cancel-button {
    background-color: var(--bg-button-secondary);
    color: var(--text-light);
    border: 1px solid var(--border-primary);
}

.cancel-button:hover {
    background-color: var(--bg-button-secondary-hover);
}

.confirm-danger-button {
    background-color: var(--bg-button-danger);
    color: var(--text-light);
}

.confirm-danger-button:hover {
    background-color: var(--bg-button-danger-hover);
}

.disabled, button:disabled {
    background-color: var(--bg-button-disabled) !important;
    color: var(--text-disabled) !important;
    cursor: not-allowed;
}

/* Game lobby styles */
.game-code-container {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-primary);
}

.game-code {
    color: var(--text-highlight);
    text-shadow: 0 0 3px rgba(255, 215, 0, 0.3);
    letter-spacing: 1px;
}

.player-list, .spectator-list {
    background-color: var(--bg-secondary);
    border-color: var(--border-primary);
    border-width: 1px;
    border-style: solid;
    overflow: hidden;
    border-radius: 0.375rem;
}

.player-list > li, .spectator-list > li {
    border-bottom: 1px solid var(--border-primary);
}

.player-list > li:last-child, .spectator-list > li:last-child {
    border-bottom: none;
}

.player-list > li:hover, .spectator-list > li:hover {
    background-color: var(--bg-tertiary);
}

.host-badge {
    background-color: var(--bg-accent-secondary);
    color: var(--text-accent);
    border: 1px solid var(--border-info);
}

.waiting-text {
    color: var(--text-muted);
}

.spectator-text {
    color: var(--text-secondary);
}

/* Table styles */
.table-history {
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 0.375rem;
    overflow: hidden;
}

.table-header {
    background-color: var(--bg-table-header);
}

.table-header th {
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-primary);
    padding: 0.75rem 1rem;
}

.table-body {
    background-color: var(--bg-secondary);
}

.table-row {
    border-bottom: 1px solid var(--border-primary);
}

.table-row:hover {
    background-color: var(--bg-table-row-hover);
}

.dart-throw {
    background-color: var(--bg-tertiary);
    color: var(--text-accent);
    border: 1px solid var(--border-primary);
}

/* Modal styles */
.modal-overlay {
    background-color: var(--bg-modal-overlay);
    backdrop-filter: blur(3px);
}

.modal-container {
    background-color: var(--bg-tertiary);
    border-radius: 0.5rem;
    border: 1px solid var(--border-primary);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.modal-text {
    color: var(--text-secondary);
}

/* Loading spinner */
.loading-spinner {
    border-color: var(--border-info);
    box-shadow: 0 0 10px rgba(31, 111, 235, 0.3);
}

/* Global theme enhancements */
h1, h2, h3, h4 {
    color: var(--text-light);
}

.text-secondary {
    color: var(--text-secondary);
}

.copy-button {
    color: var(--text-primary);
}

.primary-button, 
.danger-button, 
.start-game-button, 
.leave-game-button, 
.confirm-danger-button {
    box-shadow: 0 0 2px rgba(240, 246, 252, 0.1);
}

/* Keep dark-theme class styles for backward compatibility */
.dark-theme h1, .dark-theme h2, .dark-theme h3, .dark-theme h4 {
    color: var(--text-light);
}

.dark-theme .text-secondary {
    color: var(--text-secondary);
}

.dark-theme .copy-button {
    color: var(--text-primary);
}

.dark-theme .primary-button, 
.dark-theme .danger-button, 
.dark-theme .start-game-button, 
.dark-theme .leave-game-button, 
.dark-theme .confirm-danger-button {
    box-shadow: 0 0 2px rgba(240, 246, 252, 0.1);
}

/* Add subtle glow effects to important elements */
.game-code {
    text-shadow: 0 0 5px rgba(88, 166, 255, 0.5);
}

.host-badge {
    text-shadow: 0 0 2px rgba(88, 166, 255, 0.3);
}

.primary-button:hover, 
.danger-button:hover, 
.start-game-button:hover, 
.leave-game-button:hover, 
.confirm-danger-button:hover {
    box-shadow: 0 0 5px rgba(240, 246, 252, 0.2);
    transform: translateY(-1px);
    transition: all 0.2s ease;
}
</style>
