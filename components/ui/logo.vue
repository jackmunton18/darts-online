<template>
    <div class="flex items-end gap-4">
        <img src="/src/logo.svg" alt="Darts Logo" :class="imageSize" />
        <div class="capitalize">
            <p :class="['font-bold', fontSize, 'mb-2']">Adam Long</p>
            <p :class="['font-light',fontSize]">Pro Darts</p>
        </div>
    </div>
</template>

<script setup lang="ts">
// Basic logo component
const props = defineProps({
    size: {
        type: String,
        default: 'md'
    },
});

const imageSize = computed(() => {
    return {
        'h-8 w-8': props.size === 'sm',
        'h-10 w-10': props.size === 'md',
        'h-16 w-16': props.size === 'lg',
    };
});

const fontSize = computed(() => {
    return {
        'text-md leading-3': props.size === 'sm',
        'text-lg': props.size === 'md',
        'text-xl leading-4': props.size === 'lg',
    };
});

</script>
