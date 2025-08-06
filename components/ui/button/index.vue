<template>
    <button class="cursor-pointer sm:w-max inline-flex items-center justify-center rounded-lg h-12" :class="computedClass" :type="buttonType">
        <UiIcon 
            v-if="icon && iconPosition === 'left'" 
            :name="icon" 
            size="text-2xl" 
            class="leading-none mr-2"
        />
        <span v-if="label" class="text-base">
            {{ label }}
        </span>
        <UiIcon 
            v-if="icon && iconPosition === 'right'" 
            :name="icon" 
            size="text-2xl" 
            class="leading-none ml-2"
        />
        <UiIcon 
            v-if="icon && iconPosition === 'center'" 
            :name="icon" 
            size="text-2xl" 
            class="leading-none" />
        
    </button>
</template>

<script lang="ts">

export default {
    props: {
        color: {
            type: String,
            default: 'orange'
        },
        label: {
            type: String,
            default: ''
        },
        size: {
            type: String,
            default: 'stretch'
        },
        type: {
            type: String,
            default: 'button'
        },
        disabled: {
            type: Boolean,
            default: false
        },
        icon: {
            type: String,
            default: ''
        },
        iconPosition: {
            type: String,
            default: 'left'
        },
        vertPadding: {
            type: String,
            default: 'py-3'
        }

    },
    setup(props: any) {
        const theme = computed(()=> {
            const grey = !props.disabled ? 'bg-black hover:bg-grey-900 focus:bg-grey-900 active:bg-neutral-500 text-white' : 'bg-neutral-400 text-white pointer-events-none'
            switch (props.color) {
                case 'grey':
                    return grey
                case 'light':
                    return !props.disabled ? 'border border-black bg-white hover:bg-grey-200 focus:bg-grey-200 text-grey-900' : 'bg-white text-grey-900 pointer-events-none'
                case 'orange':
                        return !props.disabled ? 'bg-amber-400 hover:bg-amber-200 focus:bg-amber-200 text-black' : 'bg-amber-200 text-white pointer-events-none'
                case 'danger':
                    return !props.disabled ? 'bg-white border border-red-800 hover:bg-red-200 focus:bg-grey-200 text-red-800' : 'bg-red-100 text-grey-900 pointer-events-none'
                case 'delete':
                    return !props.disabled ? 'bg-red-800 border border-red-800 hover:bg-red-200 focus:bg-grey-200 text-white' : 'bg-red-700 text-white pointer-events-none'
                default:
                    return grey
            }

        })
        const computedClass = computed(() => {
            return [
                theme.value,
                props.size === 'stretch' ? 'w-full' : 'w-max',
                props.label === '' ? 'px-3' : 'px-6',
                props.vertPadding,
            ]
        })
        const buttonType = computed(() => {
            return props.type
        })
        return {
            computedClass,
            buttonType
        }
    }
}
</script>