<template>
    <div class="grid transition-all duration-300" :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
        <div class="overflow-hidden">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps({
    open: {
        type: Boolean,
        default: false
    }
})
</script>