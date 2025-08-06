<template>
    <div v-show="active" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div class="bg-black/70 fixed inset-0" @click="close"></div>
        <div class="bg-white rounded-lg w-full max-w-lg relative">
            <div class="flex items-center justify-between border-b p-4" v-if="!hideHeader">
                <h2 class="text-lg font-semibold">{{title}}</h2>
                <p v-if="description" class="text-gray-700 mt-3">{{description}}</p>
                <UiIcon 
                    v-if="canClose"
                    @click="close"
                    name="close"
                    size="2xl"
                    class="cursor-pointer"
                />
            </div>
            <div class="p-4 max-h-[70vh] overflow-auto">
                <slot name="default"></slot>
            </div>
            <div v-if="$slots.controls" class="flex items-center justify-end p-4 border-t gap-2">
                <slot name="controls"></slot>
            </div>
        </div>
        
    </div>
</template>
<script lang="ts" setup>
const props = defineProps({
    active: {
        type: Boolean,
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    canClose: {
        type: Boolean,
        default: true
    },
    hideHeader: {
        type: Boolean,
        default: false
    }
})
const emits: any = defineEmits(['close'])
const close = () => {
    emits('close')
}
</script>