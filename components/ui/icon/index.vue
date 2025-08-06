<template>
    <div 
        :style="settings"
        class="flex item-center justify-center"
        @click="click"
        >
        <span class="material-symbols-outlined" :class="[size, color]">
            {{ name }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps({
    name: {
        type: String,
        required: true
    },
    size: {
        type: String,
        default: 'text-base'
    },
    color: {
        type: String,
        default: ''
    },
    fill: {
        type: Boolean,
        default: false
    },
})
const emits = defineEmits(['click'])
const settings = computed(() => {
    const setting =
        "font-variation-settings: 'FILL' " +
        (props.fill ? '1' : '0') +
        ", 'wght' 400, 'GRAD' 0, 'opsz' 48;'"
    return setting
})
const click= () => {
    emits('click')
}
</script>