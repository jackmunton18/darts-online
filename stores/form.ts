import { defineStore } from 'pinia'

interface Error {
    field: string;
    message: string;
}
interface State {
    errors: Error[];
}

const defaultState: State = {
    errors: [],
}

export const isDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateValid = !isNaN(date.getTime());
    if (dateValid) {
        // check if date is at least 18 years ago
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        if (date <= minDate) {
            return true
        }
        return 'We do not accept application from people under 18 years old.'
    }
    return false
}
export const validateEmail = (email: string) => {
    return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};


const defaultError = "This field is required";
const selectError = "You can't proceed without selecting an option";



export const useFormStore = defineStore('formStore', {
    state: () :State => ({ ...defaultState }),
    getters: {
    },
    actions: {
        createError(field: string, message: string) {
            this.errors.push({ field, message })
        },
        removeError(field: string) {
            this.errors = this.errors.filter((error: Error) => error.field !== field)
        },
        resetAll() {
            this.errors = defaultState.errors;
        }
    }
})

