import { defineStore } from 'pinia'
import { getImages } from '~/api/content'

interface State {
    images: Array<any>,
    connectedToFirebase: boolean,
}
export const useImageStore = defineStore('image', {
    state: (): State => ({
        images: [],
        connectedToFirebase: false,
    }),
    actions: {
        setImages(images: Array<any>) {
            this.images = images
        }
    },
})