
<template>
  <div>
    <Header />
    <main class="pt-16">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Check authentication on app load
onMounted(async () => {
  await authStore.checkAuth()
  
  // If user is authenticated and on auth page, redirect to home
  if (authStore.isAuthenticated && route.path === '/auth') {
    router.push('/')
  }
})
</script> 