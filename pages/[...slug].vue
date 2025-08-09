<template>
    <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white shadow-md rounded-lg p-4 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Page Not Found</h1>
            <p class="text-gray-700 mb-4">
                <!-- TODO Translate -->
                The page you're looking for doesn't exist or has been moved.
            </p>
            <div class="flex space-x-4">
                <button 
                    @click="goHome"
                    class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    <!-- TODO Translate -->
                    Go Home
                </button>
                <button 
                    @click="goBack"
                    class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                    <!-- TODO Translate -->
                    Go Back
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// This is a catch-all route for client-side navigation in static mode
// It will handle any routes that weren't pre-rendered during build
const route = useRoute()

// Navigation functions
const goHome = () => {
    navigateTo('/')
}

const goBack = () => {
    // Use browser's back functionality
    if (process.client && window.history.length > 1) {
        window.history.back()
    } else {
        navigateTo('/')
    }
}

// If this is a game route, redirect appropriately
onMounted(() => {
    const path = route.path
    
    // Check if this is a game route that should be handled by the game page
    if (path.startsWith('/game/') && path.split('/').length >= 3) {
        // Let the client-side router handle this
        const gameId = path.split('/')[2]
        if (gameId && gameId.length > 10) { // Basic validation
            // This should work in client-side navigation
            return
        }
    }
    
    // For any other unmatched routes, we'll show the 404 page
    console.log('Unmatched route:', path)
})
</script>
