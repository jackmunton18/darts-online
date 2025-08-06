<template>

    <div class="fixed right-4 bottom-4 z-[99999]">
        <UiNotificationItem 
            v-for="notification in messages"
            :key="notification.id"
            :notification="notification">
        </UiNotificationItem>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useNotificationStore } from '~/stores/notification'

const notificationStore = useNotificationStore()
const messages = computed(() => {
    return notificationStore.messages
})
</script>
