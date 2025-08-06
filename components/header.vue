<template>
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div class="flex items-center">
          <h1 class="text-3xl font-bold text-gray-900">Darts Platform</h1>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Navigation Links -->
          <NuxtLink 
            to="/"
            class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            <!-- TODO Translate -->
            Home
          </NuxtLink>
          <NuxtLink 
            to="/analytics"
            class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            <!-- TODO Translate -->
            Analytics
          </NuxtLink>
          
          <!-- Authentication -->
          <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4">
            <NuxtLink 
              to="/account"
              class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <!-- TODO Translate -->
              Account
            </NuxtLink>
            <span class="text-sm text-gray-700">
              Welcome, {{ userStore.user?.firstName || authStore.currentUser?.name }}
            </span>
            <button
              @click="handleLogout"
              class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Logout
            </button>
          </div>
          <div v-else class="flex items-center space-x-4">
            <NuxtLink
              to="/auth"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Login
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'

const authStore = useAuthStore()
const userStore = useUserStore()
const router = useRouter()

const handleLogout = async () => {
  const { success } = await authStore.logout()
  if (success) {
    router.push('/auth')
  }
}
</script>
