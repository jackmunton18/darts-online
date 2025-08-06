<template>
    <div
        class="p-6 relative border mb-1 duration-300 transition-all ease-in-out bg-white w-96 max-w-full rounded-xl overflow-hidden"
        :class="notification.visible ? 'opacity-100 translate-x-0' : ' opacity-0 translate-x-100'"
    >
        <UiIcon 
            name="close"
            size="2xl"
            @click="hideNotification"
            class="absolute top-4 right-4 cursor-pointer"
        />

        <!-- Images -->
        <div class="flex items-center mb-2 gap-3" v-if="notification.images || notification.icon">
            <div 
                v-if="notification.images && notification.images.length > 0"
                class="flex items-center flex-nowrap"
            >
                <div
                    v-for="image in notification.images"
                    :key="image"
                    class="rounded-full bg-semantic-info-bg h-10 w-10 bg-cover bg-center flex items-center justify-between -mr-3"
                    :style="{ backgroundImage : 'url(' + image + ')' }"
                ></div>
            </div>
            <div
                v-if="notification.icon"
                class="flex items-center justify-center flex-nowrap w-10 h-10 rounded-full" 
                :class="iconClasses"
            >
                <UiIcon 
                    :name="notification.icon"
                    size="2xl"
                />
            </div>
        </div>

        <!-- Text -->
        <p class="text-md font-semibold">{{ notification.message }}</p>
        <p v-if="notification.info" class="text-md font-normal mt-2">{{ notification.info }}</p>

        <!-- Actions -->
        <div 
            v-if="notification.forwardAction || notification.undoAction"
            class="mt-4 flex items-center justify-end gap-2"
        >
            <UiButton 
                v-if="notification.undoAction"
                :label="notification.undoAction.label"
                :color="notification.undoAction.color"
                @click="actionClick(notification.undoAction.callback)"
            >
                <template 
                    v-if="notification.undoAction.icon && notification.undoAction.iconPosition === 'left'"
                    v-slot:prepend
                >
                    <UiIcon 
                        :name="notification.undoAction.icon"
                        size="xl"
                    />
                </template>
                <template
                    v-if="notification.undoAction.showCountdown"
                    v-slot:append
                >
                    span &nbsp;{{ timerText }}
                </template>
            </UiButton>
            <UiButton 
                v-if="notification.forwardAction"
                :label="notification.forwardAction.label"
                :color="notification.forwardAction.color"
                @click="actionClick(notification.forwardAction.callback)"
            >
                <template 
                    v-if="notification.forwardAction.icon && notification.forwardAction.iconPosition === 'left'"
                    v-slot:prepend
                >
                    <UiIcon 
                        :name="notification.forwardAction.icon"
                        size="xl"
                    />
                </template>
                <template
                    v-if="notification.forwardAction.icon"
                    v-slot:append
                >
                    <UiIcon
                        :name="notification.forwardAction.icon"
                        size="xl" 
                    />
                </template>
            </UiButton>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'
import type { Notification } from '~/stores/notification'
const props = defineProps({
    notification: {
        type: Object as () => Notification,
        required: true
    }
})
const notificationStore = useNotificationStore()
const classList = ref('w-full')
const hideNotification = () => {
    const id = props.notification.id
    if (id) {
        notificationStore.clearMessage(id)
    }
}
const timer = ref(props.notification.timer ?? 0)

const timerText = computed(() => {
    return `(${Math.floor(timer.value / 1000)}s)`
})

const actionClick = (callback: () => void) => {
    hideNotification()
    callback()
}

const iconClasses = computed(() => {
    return `text-${props.notification.iconStyle}`
})

onMounted(() => {
    setInterval(() => {
        if (timer.value > 0) {
            timer.value -= 1000
        }
    }, 1000)
    setTimeout(function () {
        props.notification.visible = true
        if (props.notification.timer !== 0) classList.value = 'w-0'
    }, 1)
    if (props.notification.timer !== 0) {
        setTimeout(function () {
            const id = props.notification.id
            if (id) {
                notificationStore.clearMessage(id)
            }
        }, props.notification.timer)
    }
})
</script>