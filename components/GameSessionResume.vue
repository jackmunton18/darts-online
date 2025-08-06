<template>
    <div v-if="hasActiveSession && latestSession" class="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-medium text-yellow-800">
                <!-- TODO Translate -->
                Active Game Session
            </h3>
            <span 
                class="px-2 py-1 text-xs rounded-full"
                :class="{
                    'bg-green-100 text-green-800': latestSession.status === 'playing',
                    'bg-blue-100 text-blue-800': latestSession.status === 'waiting',
                }"
            >
                {{ latestSession.status === 'playing' ? 'In Progress' : 'Waiting' }}
            </span>
        </div>
        
        <div class="mb-3">
            <div class="text-sm text-gray-600 mb-1">
                <!-- TODO Translate -->
                Game Code
            </div>
            <div class="font-mono bg-white p-2 rounded border border-gray-200 text-center">
                {{ latestSession.gameCode }}
            </div>
        </div>
        
        <div class="mb-3">
            <div class="text-sm text-gray-600 mb-1">
                <!-- TODO Translate -->
                Your Role
            </div>
            <div class="font-medium">
                {{ formatRole(latestSession.role) }}
                <span v-if="latestSession.playerName" class="text-sm text-gray-600">
                    ({{ latestSession.playerName }})
                </span>
            </div>
        </div>
        
        <div class="text-sm text-gray-600 mb-3">
            <!-- TODO Translate -->
            Last active {{ formatTimeAgo(latestSession.timestamp) }}
        </div>
        
        <div class="flex space-x-2">
            <button
                @click="handleReconnect"
                :disabled="isReconnecting"
                class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                <!-- TODO Translate -->
                {{ isReconnecting ? 'Reconnecting...' : 'Resume Game' }}
            </button>
            
            <button
                @click="handleDismiss"
                class="flex-shrink-0 border border-gray-300 bg-white text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
            >
                <!-- TODO Translate -->
                Dismiss
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useGamePersistence } from '~/composables/useGamePersistence'
import { formatDistanceToNow } from 'date-fns'

const { 
    hasActiveSession,
    latestSession,
    isReconnecting,
    reconnectToGame,
    removeGameSession
} = useGamePersistence()

// Format role for display
const formatRole = (role: string): string => {
    switch (role) {
        case 'host': return 'Game Host'
        case 'player': return 'Player'
        case 'spectator': return 'Spectator'
        default: return role
    }
}

// Format timestamp as relative time
const formatTimeAgo = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

// Handle reconnect button click
const handleReconnect = async () => {
    if (latestSession.value) {
        await reconnectToGame(latestSession.value.gameId)
    }
}

// Handle dismiss button click
const handleDismiss = () => {
    if (latestSession.value) {
        removeGameSession(latestSession.value.gameId)
    }
}
</script>
