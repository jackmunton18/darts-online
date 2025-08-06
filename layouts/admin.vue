
<template>
    <div class="p-4 py-8 pb-12 mx-auto max-w-7xl">
        <div class="flex items-center justify-between relative">
            <div>
                <h1 class="mb-3">Admin Center</h1>
                <div class="flex items-center gap-3 cursor-pointer mb-8" @click="returnToAdminHome">
                    <UiIcon name="arrow_back"/>
                    <p>Return to Admin Home</p>
                </div>
            </div>
            <UiButton icon="preview" iconPosition="center" color="light" class="absolute top-0 right-0" @click="preview"/>
        </div>
        <NuxtPage />
        <UiNotification />
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const returnToAdminHome = () => {
    router.push('/admin');
}
const preview = () => {
    router.push('/');
}
</script>