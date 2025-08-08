<template>
    <div class="max-w-4xl mx-auto px-4 py-6">
        <!-- Page Header -->
        <div class="bg-white shadow-md rounded-lg p-4 mb-6">
            <!-- TODO Translate -->
            <h1 class="text-2xl font-bold mb-4">Account Settings</h1>
            <p class="text-gray-700 mb-2">
                <!-- TODO Translate -->
                Manage your profile information and account preferences.
            </p>
        </div>

        <!-- Profile Information Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <!-- TODO Translate -->
            <h2 class="text-xl font-bold mb-4">Profile Information</h2>
            
            <div v-if="isLoading" class="flex justify-center py-6">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            
            <form v-else @submit.prevent="updateProfile" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- First Name -->
                    <div>
                        <!-- TODO Translate -->
                        <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            id="firstName"
                            v-model="form.firstName"
                            type="text"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your first name"
                        />
                    </div>

                    <!-- Last Name -->
                    <div>
                        <!-- TODO Translate -->
                        <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            id="lastName"
                            v-model="form.lastName"
                            type="text"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your last name"
                        />
                    </div>
                </div>

                <!-- Username -->
                <div>
                    <!-- TODO Translate -->
                    <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                        Username
                    </label>
                    <div class="relative">
                        <input
                            id="username"
                            v-model="form.username"
                            type="text"
                            required
                            :class="[
                                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-blue-500',
                                isUsernameAvailable === false ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            ]"
                            placeholder="Enter your username"
                            @input="checkUsernameAvailability"
                        />
                        <div v-if="isCheckingUsername" class="absolute right-3 top-2.5">
                            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    </div>
                    <p v-if="isUsernameAvailable === false" class="mt-1 text-sm text-red-600">
                        <!-- TODO Translate -->
                        This username is already taken
                    </p>
                    <p v-else-if="isUsernameAvailable === true" class="mt-1 text-sm text-green-600">
                        <!-- TODO Translate -->
                        Username is available
                    </p>
                    <p v-if="form.username.trim() && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())" class="mt-1 text-sm text-red-600">
                        <!-- TODO Translate -->
                        Username must be 3-20 characters long and contain only letters, numbers, and underscores
                    </p>
                    <p class="mt-1 text-sm text-gray-500">
                        <!-- TODO Translate -->
                        Your username will be visible to other players
                    </p>
                </div>

                <!-- Email (Read-only) -->
                <div>
                    <!-- TODO Translate -->
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        id="email"
                        v-model="form.email"
                        type="email"
                        readonly
                        class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p class="mt-1 text-sm text-gray-500">
                        <!-- TODO Translate -->
                        Email address cannot be changed
                    </p>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p class="text-sm text-red-600">{{ error }}</p>
                </div>

                <!-- Success Message -->
                <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p class="text-sm text-green-600">{{ successMessage }}</p>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end space-x-4">
                    <button
                        type="button"
                        @click="resetForm"
                        :disabled="isSaving"
                        class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <!-- TODO Translate -->
                        Reset
                    </button>
                    <button
                        type="submit"
                        :disabled="!isFormValid || !hasChanges || isSaving || isUsernameAvailable === false"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span v-if="isSaving" class="flex items-center">
                            <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            <!-- TODO Translate -->
                            Saving...
                        </span>
                        <span v-else>
                            <!-- TODO Translate -->
                            Save Changes
                        </span>
                    </button>
                </div>
            </form>
        </div>

        <!-- Account Actions Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <!-- TODO Translate -->
            <h2 class="text-xl font-bold mb-4">Account Actions</h2>
            
            <div class="space-y-4">
                <!-- Sign Out -->
                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                        <!-- TODO Translate -->
                        <h3 class="font-medium text-gray-900">Sign Out</h3>
                        <p class="text-sm text-gray-500">Sign out of your account</p>
                    </div>
                    <button
                        @click="signOut"
                        :disabled="isSigningOut"
                        class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span v-if="isSigningOut">
                            <!-- TODO Translate -->
                            Signing out...
                        </span>
                        <span v-else>
                            <!-- TODO Translate -->
                            Sign Out
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const authStore = useAuthStore()
const toast = useNotificationStore()

// Form state
const form = ref({
    firstName: '',
    lastName: '',
    username: '',
    email: ''
})

// Component state
const isLoading = ref(true)
const isSaving = ref(false)
const isSigningOut = ref(false)
const error = ref('')
const successMessage = ref('')
const isCheckingUsername = ref(false)
const isUsernameAvailable = ref<boolean | null>(null)
const originalUsername = ref('')

// Debounce timer for username checking
let usernameCheckTimer: NodeJS.Timeout | null = null

// Computed
const isFormValid = computed(() => {
    // Check basic form validation
    const basicValidation = form.value.firstName.trim().length > 0 &&
           form.value.lastName.trim().length > 0 &&
           form.value.username.trim().length > 0 &&
           form.value.email.trim().length > 0
    
    // Check username format (3-20 characters, alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    const validUsername = usernameRegex.test(form.value.username.trim())
    
    return basicValidation && validUsername
})

const hasChanges = computed(() => {
    if (!userStore.user) return false
    
    return form.value.firstName !== userStore.user.firstName ||
           form.value.lastName !== userStore.user.lastName ||
           form.value.username !== userStore.user.username
})

// Methods
const loadUserData = async () => {
    isLoading.value = true
    error.value = ''
    
    try {
        // Fetch user data if not already loaded
        if (!userStore.user) {
            await userStore.fetchUser()
        }
        
        if (userStore.user) {
            form.value = {
                firstName: userStore.user.firstName,
                lastName: userStore.user.lastName,
                username: userStore.user.username,
                email: userStore.user.email
            }
            originalUsername.value = userStore.user.username
        }
    } catch (err: any) {
        error.value = err.message || 'Failed to load user data'
    } finally {
        isLoading.value = false
    }
}

const checkUsernameAvailability = async () => {
    // Clear previous timer
    if (usernameCheckTimer) {
        clearTimeout(usernameCheckTimer)
    }
    
    // Reset state
    isUsernameAvailable.value = null
    
    // Don't check if username hasn't changed or is empty
    if (!form.value.username.trim() || form.value.username === originalUsername.value) {
        return
    }
    
    // Don't check if username format is invalid
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(form.value.username.trim())) {
        return
    }
    
    // Debounce the check
    usernameCheckTimer = setTimeout(async () => {
        isCheckingUsername.value = true
        
        try {
            const response = await userStore.checkUsernameAvailability(form.value.username)
            isUsernameAvailable.value = response.available
        } catch (err) {
            // Failed to check username availability
            isUsernameAvailable.value = null
        } finally {
            isCheckingUsername.value = false
        }
    }, 500)
}

const updateProfile = async () => {
    if (!isFormValid.value || !hasChanges.value) return
    
    isSaving.value = true
    error.value = ''
    successMessage.value = ''
    
    try {
        // Call actual API to update user profile
        const success = await userStore.updateProfile({
            firstName: form.value.firstName,
            lastName: form.value.lastName,
            username: form.value.username
        })
        
        if (success) {
            originalUsername.value = form.value.username
            isUsernameAvailable.value = null
            
            // TODO Translate
            successMessage.value = 'Profile updated successfully!'
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                successMessage.value = ''
            }, 3000)
        } else {
            error.value = userStore.error || 'Failed to update profile'
        }
        
    } catch (err: any) {
        error.value = err.message || 'Failed to update profile'
    } finally {
        isSaving.value = false
    }
}

const resetForm = () => {
    if (userStore.user) {
        form.value = {
            firstName: userStore.user.firstName,
            lastName: userStore.user.lastName,
            username: userStore.user.username,
            email: userStore.user.email
        }
        isUsernameAvailable.value = null
        error.value = ''
        successMessage.value = ''
    }
}

const signOut = async () => {
    isSigningOut.value = true
    
    try {
        await authStore.logout()
        
        // TODO Translate
        toast.addMessage({
            type: 'success',
            message: 'Signed out successfully'
        })
        
        // Redirect to auth page
        await navigateTo('/auth')
    } catch (err: any) {
        // TODO Translate
        toast.addMessage({
            type: 'error',
            message: err.message || 'Failed to sign out'
        })
    } finally {
        isSigningOut.value = false
    }
}


// Watch for user changes
watch(() => userStore.user, (newUser) => {
    if (newUser && !isLoading.value) {
        form.value = {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            username: newUser.username,
            email: newUser.email
        }
        originalUsername.value = newUser.username
    }
}, { immediate: true })

// Lifecycle
onMounted(() => {
    loadUserData()
})
</script>
