<template>
    <div class="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
        <div class="flex flex-col items-center">
            <!-- TODO Translate -->
            <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p v-if="message" class="text-gray-700 text-lg font-medium">{{ message }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    message?: string
}>();
</script>
