import { defineStore } from 'pinia'

interface Action {
    label: string
    callback: () => void
    icon?: string
    iconPosition?: string
    color: string
    showCountdown?: Boolean
}

export interface Notification {
    id?: string
    images?: Array<string>
    icon?: string
    iconStyle?: string
    message: string
    type: string
    info?: string
    visible?: Boolean
    timer?: number
    forwardAction?: Action | null
    undoAction?: Action | null
}

interface State {
    messages: Array<Notification>
}

const timeout = 400
const defaultTimer = 3000

/**
 * Defines a store for managing notifications.
 */
export const useNotificationStore = defineStore('notification', {
    state: (): State => ({
        messages: [],
    }),
    actions: {
        /**
         * Adds a new message to the notification store.
         * @param options - The notification options.
         * @param clearAll - Whether to clear all existing messages before adding the new message. Default is false.
         */
        addMessage(options: Notification, clearAll = false) {
            if (clearAll) {
                this.clearAll()
            }
            this.messages.push({
                id: Math.random().toString(36).substr(2, 9),
                message: options.message,
                images: options.images ?? [],
                icon: options.icon,
                iconStyle: options.iconStyle,
                type: options.type ?? 'info',
                info: options.info ?? '',
                timer: options.timer ?? defaultTimer,
                visible: false,
                forwardAction: options.forwardAction ?? null,
                undoAction: options.undoAction ?? null,
            })
        },
        /**
         * Gets the index of a message by its ID.
         * @param id - The ID of the message.
         * @returns The index of the message, or -1 if not found.
         */
        getIndexById(id: String) {
            return this.messages.findIndex((message) => message.id === id)
        },
        /**
         * Clears a message from the notification store.
         * @param id - The ID of the message to clear.
         * @param instant - Whether to clear the message instantly without delay. Default is false.
         */
        clearMessage(id: String, instant = false) {
            if (this.getIndexById(id) !== -1) {
                this.messages[this.getIndexById(id)].visible = false
                setTimeout(
                    () => {
                        this.messages.splice(this.getIndexById(id), 1)
                    },
                    instant ? 0 : timeout
                )
            }
        },
        /**
         * Clears all messages from the notification store.
         */
        clearAll() {
            const activeList = JSON.parse(JSON.stringify(this.messages))
            for (let i = 0; i < activeList.length; i++) {
                this.clearMessage(activeList[i].id, true)
            }
        },
    },
})
