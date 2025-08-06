<template>
    
    <div :class="expanded
        ? 'fixed w-screen h-screen top-0 left-0 z-50 cursor-zoom-out bg-black'
        : 'bg-white aspect-[4/5] rounded-sm w-32 border p-2 pb-6 relative cursor-zoom-in box-border -mr-2 shrink-0'" 
        :style="`transform: rotate(${rotation}deg)`">
        <img class="h-full w-full " :class="expanded ? 'object-contain' : 'object-cover'" :src="image.url" :key="image.name" />
        <!-- <UiIcon v-if="expanded" name="close" class="absolute top-0 right-0 m-2 cursor-pointer text-white" size="2xl"/> -->
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    image: {
        type: Object,
        required: true
    }
});
const expanded = ref<boolean>(false);

const rotation = computed(() => {
    // Randomly rotate the image between -20 and 20 degrees
    const rotation = Math.floor(Math.random() * 30) - 15;
    return expanded.value ? 0 : rotation
})
</script>