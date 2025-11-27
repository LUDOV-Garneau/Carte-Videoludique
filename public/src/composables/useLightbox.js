import { ref } from 'vue';

export function useLightbox() {
    const isOpen = ref(false);
    const currentIndex = ref(0);
    const images = ref([]);

    function openLightbox(imageArray, startIndex = 0) {
        images.value = imageArray || [];
        currentIndex.value = startIndex;
        isOpen.value = true;
    }

    function closeLightbox() {
        isOpen.value = false;
        currentIndex.value = 0;
        images.value = [];
    }

    return {
        // État
        isOpen,
        currentIndex,
        images,
        
        // Actions
        openLightbox,
        closeLightbox
    };
}