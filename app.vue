<template>
  <div>
    <!-- Global loading overlay -->
    <UiLoadingFullScreenLoader v-if="isLoading" message="Loading..." />
    
    <NuxtLayout />
    <ToastNotifications />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useLoadingStore } from '~/stores/loading'
import { computed } from 'vue'

const loadingStore = useLoadingStore()
const isLoading = computed(() => loadingStore.isLoading && !loadingStore.initialAuthCheckDone)
</script>

<style>
/* Ensure dark theme is applied globally */
html, body {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
