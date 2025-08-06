<template>
    <div class="w-full">
        <div class="relative">
            <input 
                ref="input"
                :id="id"
                :value="modelValue"
                :type="type" 
                :name="name" 
                :placeholder="placeholder"
                :readonly="readonly"
                :required="required"
                :autofocus="autofocus"
                :autocomplete="autocomplete ? 'on' : 'off'"
                @input="update"
                @change="update"
                @blur="$emit('blur', $event)"
                class="border px-2 py-1 pr-11 w-full h-[48px] focus:outline-none focus:border-b-2 placeholder-gray-300 rounded-md" 
                :class="computedClass"
            />
            <p v-if="prefix" class="absolute inset-y-0 left-0 flex items-center pl-3.5">
                {{ prefix }}
            </p>
            <UiIcon v-if="modelValue !== ''" @click="clear" name="close" size="text-xl" class="cursor-pointer right-0 absolute flex items-center inset-y-0 pr-3.5"/>
        </div>
        <UiIcon v-if="icon" :name="icon"/>
        <div v-if="message" class="text-red-600 text-xs mt-1">{{ message }}</div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useFormStore } from '@/stores/form';

const props = defineProps({
    id: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        required: true
    },
    modelValue: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'text'
    },
    placeholder: {
        type: String,
        required: true
    },
    required: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        default: ''
    },
    autocomplete: {
        type: Boolean,
        default: false
    },
    isDate: {
        type: Boolean,
        default: false
    },
    autofocus: {
        type: Boolean,
        default: false
    },
    inputClass: {
        type: String,
        default: ''
    },
    prefix: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: ''
    },
    prefixPadding: {
        type: String,
        default: 'md'
    },
    readonly: {
        type: Boolean,
        default: false
    }
})

const formStore = useFormStore();
const emit = defineEmits(['update:modelValue', 'onError', 'blur']);

const input = ref<HTMLInputElement | null>(null);

const prefixPaddingSizes = {
    sm: 'pl-8',
    md: 'pl-10',
    lg: 'pl-20'
}

const inputPadding = computed(() => {
    if (!props.prefix) return '';
    return prefixPaddingSizes[props.prefixPadding as keyof typeof prefixPaddingSizes]
})
const computedClass = computed(() => {
    return [
        inputPadding.value, 
        props.message ? 'border-red-600 bg-red-100' : 'border-grey-900',
        props.inputClass
    ]
})

const update = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.value ?? '');
    formStore.removeError(props.name);
}

const clear = () => {
    emit('update:modelValue', '');
    formStore.removeError(props.name);
    input.value?.focus();
}

</script>