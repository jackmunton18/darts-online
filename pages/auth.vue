<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <!-- Left column: Auth forms -->
    <div class="w-full md:w-1/2 bg-dark-tertiary p-8 flex items-center overflow-y-auto h-screen">
      <div class="max-w-md mx-auto w-full py-12">

        <div class="flex items-center justify-center">
          <UiLogo size="lg"/>
        </div>
        <!-- TODO Translate -->
        <h2 class="mt-6 text-center text-3xl font-extrabold">
          {{ isSignup ? 'Create your account' : 'Sign in to your account' }}
        </h2>
        <!-- TODO Translate -->
        <p class="mt-2 text-center text-sm text-secondary">
          {{ isSignup ? 'Already have an account?' : "Don't have an account?" }}
          <button
            @click="isSignup = !isSignup"
            class="font-medium text-accent hover:underline"
          >
            {{ isSignup ? 'Sign in' : 'Sign up' }}
          </button>
        </p>
      
        <div class="mt-8">
          <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Name fields (only for signup) -->
          <div v-if="isSignup" class="grid grid-cols-2 gap-3">
            <div>
              <label for="firstName" class="block text-sm font-medium">
                <!-- TODO Translate -->
                First Name
              </label>
              <div class="mt-1">
                <input
                  id="firstName"
                  v-model="form.firstName"
                  name="firstName"
                  type="text"
                  required
                  class="input-dark appearance-none block w-full px-3 py-2 rounded-md placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
                  placeholder="First name"
                />
              </div>
            </div>
            <div>
              <label for="lastName" class="block text-sm font-medium">
                <!-- TODO Translate -->
                Last Name
              </label>
              <div class="mt-1">
                <input
                  id="lastName"
                  v-model="form.lastName"
                  name="lastName"
                  type="text"
                  required
                  class="input-dark appearance-none block w-full px-3 py-2 rounded-md placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium">
              <!-- TODO Translate -->
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="input-dark appearance-none block w-full px-3 py-2 rounded-md placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <!-- Password field -->
          <div>
            <label for="password" class="block text-sm font-medium">
              <!-- TODO Translate -->
              Password
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="input-dark appearance-none block w-full px-3 py-2 rounded-md placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <!-- Confirm Password field (only for signup) -->
          <div v-if="isSignup">
            <label for="confirmPassword" class="block text-sm font-medium">
              <!-- TODO Translate -->
              Confirm Password
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="input-dark appearance-none block w-full px-3 py-2 rounded-md placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <!-- Error message -->
          <div v-if="error" class="text-danger text-sm text-center py-2">
            {{ error }}
          </div>

          <!-- Submit button -->
          <div>
            <button
              type="submit"
              :disabled="!isFormValid || isLoading"
              class="w-full flex justify-center py-3 px-4 btn-success rounded-md shadow-sm text-sm font-medium disabled:bg-button-disabled disabled:text-disabled disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSignup ? 'Creating account...' : 'Signing in...' }}
              </span>
              <span v-else>
                {{ isSignup ? 'Create account' : 'Sign in' }}
              </span>
            </button>
          </div>
        </form>

          <!-- Divider -->
          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-primary" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-dark-tertiary text-secondary">Or continue with</span>
              </div>
            </div>

            <!-- Social login buttons (placeholder for future implementation) -->
            <div class="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                class="w-full inline-flex justify-center py-2 px-4 border border-border-primary rounded-md bg-dark-secondary text-sm font-medium text-secondary hover:bg-dark-tertiary"
              >
                <span class="sr-only">Sign in with Google</span>
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right column: Image placeholder -->
    <div class="hidden md:block w-1/2 bg-dark-secondary relative h-screen">
      <img class="absolute inset-0 w-full h-full object-cover object-top" src="/src/comp.png" alt="Darts Image">
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useLoadingStore } from '~/stores/loading'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSignup = ref(false)
const error = ref('')

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isFormValid = computed(() => {
  if (isSignup.value) {
    return form.value.firstName.length > 0 && 
           form.value.lastName.length > 0 &&
           form.value.email.length > 0 && 
           form.value.password.length >= 6 && 
           form.value.password === form.value.confirmPassword
  } else {
    return form.value.email.length > 0 && form.value.password.length > 0
  }
})

const isLoading = computed(() => authStore.isLoading)

// Import loading store
const loadingStore = useLoadingStore()

// Check if user is already authenticated on component mount
onMounted(async () => {
  // Wait for the initial auth check to complete
  if (!loadingStore.initialAuthCheckDone) {
    // Don't do anything yet, middleware will handle redirect if needed
    return
  }
  
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  error.value = ''

  try {
    if (isSignup.value) {
      // Handle signup - combine first and last name for the auth store
      const fullName = `${form.value.firstName} ${form.value.lastName}`.trim()
      const { success, error: authError } = await authStore.register(
        form.value.email,
        form.value.password,
        fullName
      )
      
      if (success) {
        router.push('/')
      } else {
        // Handle Firebase-specific error messages
        error.value = getFirebaseErrorMessage(authError || 'Registration failed')
      }
    } else {
      // Handle login
      const { success, error: authError } = await authStore.login(
        form.value.email,
        form.value.password
      )
      
      if (success) {
        // Check if there's a redirect parameter
        const redirect = route.query.redirect as string
        if (redirect && redirect.startsWith('/game/')) {
          // Extract game ID for direct navigation
          const gameIdMatch = redirect.match(/\/game\/([^\/]+)/)
          if (gameIdMatch && gameIdMatch[1]) {
            // Try to navigate to the game
            router.push(redirect)
          } else {
            router.push('/')
          }
        } else {
          router.push('/')
        }
      } else {
        // Handle Firebase-specific error messages
        error.value = getFirebaseErrorMessage(authError || 'Login failed')
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  }
}

// Helper function to convert Firebase error codes to user-friendly messages
const getFirebaseErrorMessage = (errorMessage: string): string => {
  if (errorMessage.includes('auth/user-not-found')) {
    return 'No account found with this email address'
  } else if (errorMessage.includes('auth/wrong-password')) {
    return 'Incorrect password'
  } else if (errorMessage.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists'
  } else if (errorMessage.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters'
  } else if (errorMessage.includes('auth/invalid-email')) {
    return 'Please enter a valid email address'
  } else if (errorMessage.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later'
  } else {
    return errorMessage
  }
}

// Reset form when switching modes
const resetForm = () => {
  form.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
  error.value = ''
}

// Watch for mode changes and reset form
watch(isSignup, resetForm)
</script>