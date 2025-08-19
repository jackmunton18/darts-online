<template>
    <div class="max-w-4xl mx-auto px-4 py-6">
        <!-- Back button -->
        <div class="mb-4">
            <button 
                @click="goBack"
                class="inline-flex items-center px-3 py-2 text-sm font-medium secondary-button"
            >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <!-- TODO Translate -->
                Back to Dashboard
            </button>
        </div>

        <div class="panel-dark shadow-md rounded-lg p-4 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Create or Join Game</h1>
            <p class="text-secondary mb-2">
                <!-- TODO Translate -->
                Set up a new darts match or join an existing game with a game code. Challenge friends and track your performance in real-time!
            </p>
        </div>

        <!-- Game Session Component -->
        <DartsGameSession />
    </div>
</template>

<script setup lang="ts">
// Set page meta for SEO and navigation
definePageMeta({
    title: 'Create or Join Game - Adam Long Pro Darts',
    description: 'Create a new darts game or join an existing match with a game code'
})

// Router for navigation
const router = useRouter()

// Navigation function
const goBack = () => {
    router.back()
}
</script>
