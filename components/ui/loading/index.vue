<template>
    <div>
        <svg v-if="type === 'spinner'"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            class="!overflow-visible">
            <circle stroke-linecap="round" cx="32" cy="32" r="32" stroke-width="4" fill="none" stroke="#E5E7EB" stroke-dasharray="100" stroke-dashoffset="0" stroke-mitterlimit="0" transform="rotate(-90 ) translate(-64 0)"/>
            <circle class="downloadingDial" stroke-linecap="round"  cx="32" cy="32" r="32" stroke-width="4" fill="none" stroke="#fbbf27" stroke-dasharray="100" stroke-dashoffset='100' stroke-mitterlimit="0" transform="rotate(-90 ) translate(-64 0)"/>
        </svg>
    </div>
    
</template>
<script lang="ts" setup>
const props = defineProps({
    type: {
        type: String,
        default: 'spinner',
        validator: (value: string) => {
            return ['spinner', 'audio', 'dots'].includes(value)
        },
    },
})
</script>

<style lang="scss" scoped>
@keyframes spin {
    0% {
        stroke-dashoffset: 100;
    }
    100% {
        stroke-dashoffset: -100;
    }
}
@keyframes Wave {
    from {
        height: 0;
    }
    to {
        height: 100%;
    }
}
@keyframes Dots {
    from {
        opacity: 0.4;
        scale: 0.9;
    }
    to {
        opacity: 1;
        scale: 1.1;
    }
}
.downloadingDial {
    animation: spin 1s linear infinite;
}
.wave {
    animation: Wave 0.4s infinite alternate-reverse;
}
.dots {
    animation: Dots 0.4s infinite alternate-reverse;
}
</style>
