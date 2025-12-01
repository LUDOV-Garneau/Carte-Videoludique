<script setup>
import { computed, onUnmounted, watch } from 'vue';
import { useBodyScroll } from '../composables/useBodyScroll.js';

const props = defineProps({
    images: {
        type: Array,
        required: true
    },
    currentIndex: {
        type: Number,
        default: 0
    },
    
});
const emits = defineEmits(['close', 'update:currentIndex']);

const lightboxIndex = computed({
    get: () => props.currentIndex,
    set: (value) => emits('update:currentIndex', value)
});
const canDisplayLightbox = computed(() => {
    return props.images && props.images.length > 0;
});

// Utilisation du composable pour gérer le scroll
const { lockScrollWhen } = useBodyScroll();

function previous(event) { 
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    lightboxIndex.value = (lightboxIndex.value - 1 + props.images.length) % props.images.length; 
}
function next(event) { 
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    lightboxIndex.value = (lightboxIndex.value + 1) % props.images.length; 
}

function close() {
    emits('close');
}



// Écouter les touches clavier (Échap pour fermer)
function handleKeydown(event) {
    if (event.key === 'Escape') {
        close();
    }
    if (event.key === 'ArrowLeft') {
        previous();
    }
    if (event.key === 'ArrowRight') {
        next();
    }
}

// Auto-gestion du scroll avec le composable
lockScrollWhen(canDisplayLightbox);

// Gestion des événements clavier
watch(canDisplayLightbox, (isVisible) => {
    if (isVisible) {
        document.addEventListener('keydown', handleKeydown);
    } else {
        document.removeEventListener('keydown', handleKeydown);
    }
}, { immediate: true });

// Nettoyage lors de la destruction
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});
</script>
<template>
<div class="lightbox" v-if="canDisplayLightbox" @click.self="close" tabindex="0">
    <button class="lb-close" @click="close" aria-label="Fermer">x</button>
    <button class="lb-nav left" @click="previous" aria-label="Suivante">&lt;</button>
    <img class="lb-image" :src="images[lightboxIndex].url" :alt="'Image ' + (lightboxIndex + 1)" />
    <button class="lb-nav right" @click="next" aria-label="Précédente">&gt;</button>
    <div class="lb-dots">
        <button v-for="(img, index) in images" :key="'dot-'+img.id"
        :class="{ dot:true, active:index===lightboxIndex }"
        @click.stop="lightboxIndex = index"
        :aria-label="'Aller à l’image ' + (index+1)"></button>
    </div>
</div>
</template>
<style scoped>
/* Lightbox */
.lightbox {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.92);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    outline: none;
}
.lb-image { 
    max-width: 90vw; 
    max-height: 82vh;
    object-fit: contain;
    position: relative;
    z-index: 1;
}
.lb-close, .lb-nav {
    position: absolute;
    background: rgba(0,0,0,.5);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff;
    cursor: pointer;
    padding: 0px;
}
.lb-close {
    top: 14px; right: 16px;
    width: 36px; height: 36px; border-radius: 999px; font-size: 22px;
}
.lb-nav.left, .lb-nav.right {
    top: 50%; transform: translateY(-50%);
    width: 42px; height: 42px; border-radius: 999px; font-size: 28px; line-height: 38px;
}
.lb-nav.left { left: 20px; }
.lb-nav.right { right: 20px; }
.lb-dots {
    position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 8px;
}
.dot {
    width: 8px; height: 8px; border-radius: 999px;
    background: rgba(255,255,255,.35);
    border: none;
    transition: all .3s ease;
}
.dot.active {
    background: white;
}
</style>