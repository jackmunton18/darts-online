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
const route = useRoute()

// Navigation functions
const goHome = () => {
    navigateTo('/')
}

const goBack = () => {
    // Use browser's back functionality if available, otherwise go home
    if (process.client && window.history.length > 1) {
        window.history.back()
    } else {
        navigateTo('/')
    }
}

// Client-side route handling
onMounted(() => {
    if (process.client) {
        const path = route.path
        
        // If this is a game route, try to handle it with the Vue router
        if (path.startsWith('/game/')) {
            // Log for debugging
            console.log('Handling game route client-side:', path)
            
            // Let the client-side router handle game routes naturally
            // The SPA will resolve the route through the normal routing mechanism
            return
        }
        
        // For other unmatched routes, show 404
        console.log('Unmatched route (showing 404):', path)
    }
})
</script>
