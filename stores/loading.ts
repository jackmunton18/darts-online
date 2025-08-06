import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  // State
  const isLoading = ref(false)
  const initialAuthCheckDone = ref(false)
  
  // Actions
  const setLoading = (value: boolean) => {
    isLoading.value = value
  }
  
  const setInitialAuthCheckDone = (value: boolean) => {
    initialAuthCheckDone.value = value
  }
  
  return {
    // State
    isLoading,
    initialAuthCheckDone,
    
    // Actions
    setLoading,
    setInitialAuthCheckDone
  }
})
