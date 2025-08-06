<template>
    <div>
        <input class="invisible absolute" :name="name" :value="active" :id="name" />
        <div class="w-full group relative" ref="dropdown">
            <div  
                tabindex="0"
                class="px-3 py-2 h-[58px] border cursor-pointer w-full text-base flex items-center justify-between bg-white rounded-md" 
                @click="isFocused = !isFocused"
                @keydown.space="isFocused = !isFocused"
                :class="computedClass"
            >
                <span>
                    {{ selectedOptions || placeholder }}
                </span>
                <UiIcon name="expand_more" size="text-2xl" color="text-grey-900" />
            </div>
            <ul v-if="isFocused" class="absolute top-full left-0 w-full border border-grey-900 z-10">
                <li 
                    v-for="(option, index) in options" 
                    @focus="isFocused = true"
                    @blur="index === options.length - 1 ? isFocused = false : null"
                    tabindex="0"
                    :key="option.value" 
                    class="bg-white hover:bg-grey-200 focus:bg-grey-200 px-3 py-2 flex items-center justify-between"
                    @click="selectOption(option)"
                    @keydown.space="selectOption(option)"
                >

                    <span>
                        {{ option.name }}
                    </span>
                    <span v-if="selectedOptions.includes(option.name)">
                        <UiIcon name="check"/>
                    </span>
                </li>
            </ul>
        </div>
        <div v-if="message" class="text-red-600 text-xs mt-1">{{ message }}</div>
    </div>
</template>

<script lang="ts" setup>

interface Option {
    value: string;
    name: string;
}

const props = defineProps({
    id: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        required: true
    },
    placeholder: {
        type: String,
        required: true
    },
    options: {
        type: Array as PropType<Option[]>,
        required: true
    },
    modelValue: {
        type: Array,
        default: []
    },
    message: {
        type: String,
        default: ''
    },
    maxSelections: {
        type: Number,
        default: 1
    },
});

const computedClass = computed(() => {
    return [
        active.value.length === 0  ? 'text-cta-placeholder' : 'text-black', 
        isFocused.value ? 'border-b-2' : '',
        props.message ? 'border-red-600 bg-red-100' : 'border-grey-900'
    ]
})

const emit = defineEmits(['update:modelValue']);

// dropdown node ref
const dropdown = ref<HTMLDivElement | null>(null)

const active = ref<any[]>([]);

// Map selected values to option names for display
const selectedOptions = computed(() => {
    if (active.value.length === 0) return '';
    const mapped = active.value.map((value: string) => {
        const option = props.options.find((option: Option) => option.value === value);
        return option?.name;
    });
    return mapped.join(', ');
});

if (props.modelValue) {
    active.value = [...props.modelValue]
}

const isFocused = ref(false);

const selectOption = (option: Option) => {
    // if already selected, remove it
    if (Array.isArray(active.value) && active.value.includes(option.value)) {
        active.value = active.value.filter((item: string) => item !== option.value);
        emit('update:modelValue', active.value);
        return;
    }

    if (props.maxSelections > 1 && active.value.length < props.maxSelections) {
        // If this select allows for multiple selections and isn't at limit, add to array
        active.value.push(option.value);
    } else if (props.maxSelections > 1){
        // If this select allows for multiple selections and is at limit, replace the last selection with the new selection
        active.value.pop();
        active.value.push(option.value);
    } else {
        // If this select only allows for one selection, replace the array with the new selection
        active.value = [option.value];
    }
    if (props.maxSelections === active.value.length) {
        isFocused.value = false;
    }
    emit('update:modelValue', active.value);
}

const hideOptions = (element: any ) => {
    if (element && dropdown.value && !dropdown.value.contains(element.target)) {
        isFocused.value = false;
    }
}

onMounted(() => {
    window.addEventListener('click', hideOptions)
})

onBeforeMount(() =>{
    window.removeEventListener('click', hideOptions)

})
</script>