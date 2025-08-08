<template>
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4 md:py-6">
        <div class="flex items-center">
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Darts Platform</h1>
        </div>
        
        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
          >
            <span class="sr-only">Open main menu</span>
            <!-- Icon when menu is closed -->
            <svg v-if="!isMobileMenuOpen" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <!-- Icon when menu is open -->
            <svg v-else class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Mobile menu dropdown -->
        <div v-if="isMobileMenuOpen" class="absolute top-16 left-0 right-0 z-10 bg-white shadow-md p-4 border-t md:hidden">
          <div class="flex flex-col space-y-3">
            <NuxtLink 
              to="/"
              class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium block"
              @click="isMobileMenuOpen = false"
            >
              <!-- TODO Translate -->
              Home
            </NuxtLink>
            <NuxtLink 
              to="/analytics"
              class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium block"
              @click="isMobileMenuOpen = false"
            >
              <!-- TODO Translate -->
              Analytics
            </NuxtLink>
            
            <!-- Authentication -->
            <div v-if="authStore.isAuthenticated" class="border-t border-gray-200 pt-3">
              <NuxtLink 
                to="/account"
                class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium block"
                @click="isMobileMenuOpen = false"
              >
                <!-- TODO Translate -->
                Account
              </NuxtLink>
              <button
                @click="handleLogout"
                class="w-full text-left bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-base font-medium mt-2"
              >
                <!-- TODO Translate -->
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <!-- Desktop navigation -->
        <div class="hidden md:flex items-center space-x-4">
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
            <button
              @click="handleLogout"
              class="bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md hover:bg-red-700 text-sm font-medium"
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
import { useLoadingStore } from '~/stores/loading'

const authStore = useAuthStore()
const userStore = useUserStore()
const loadingStore = useLoadingStore()
const router = useRouter()
const isMobileMenuOpen = ref(false)

// Computed properties to handle user display
const userIsLoaded = computed(() => {
  return loadingStore.initialAuthCheckDone && 
         !loadingStore.isLoading &&
         authStore.isAuthenticated &&
         (!!userStore.user?.firstName || !!authStore.currentUser?.name)
})

const getUserDisplayName = computed(() => {
  return userStore.user?.firstName || authStore.currentUser?.name || 'User'
})

const handleLogout = async () => {
  const { success } = await authStore.logout()
  if (success) {
    router.push('/auth')
  }
  isMobileMenuOpen.value = false
}
</script>
