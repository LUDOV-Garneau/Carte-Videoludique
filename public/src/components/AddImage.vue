<template>
    <div class="add-image">
        <!-- Pas d'image -->
        <label v-if="images.length === 0" 
        class="dropzone" 
        @dragover.prevent="dragOver=true" 
        @dragleave.prevent="dragOver=false" 
        @drop.prevent="onDrop">
            <input ref="fileInput" type="file" class="hidden-input" accept="image/*" multiple @change="onFileInput" />
            <div class="inner-dropzone" :class="{ 'drag-over': dragOver}" @click="triggerFileDialog">
                <svg aria-hidden="true" width="56" height="56" viewBox="0 0 24 24">
                    <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
                </svg>
                <div class="dropzone-title">Ajouter des images</div>
                <div class="dropzone-subtitle">Glisser-déposer, coller ou cliquer</div>
            </div>
        </label>
        <!-- Avec images -->
        <div v-else class="grid">
            <div class="viewer" @click="openLightbox(selectedIndex)" role="button" :aria-label="'voir l\'image' + selectedIndex + 1">
                <img :src="images[selectedIndex].url" :alt="'Image ' + (selectedIndex + 1)" />
                <button class="btn-remove" type="button" @click.stop="removeAt(selectedIndex)" :aria-label="'Supprimer l\'image '">
                    x
                </button>
            </div>

            <div class="side">
                <button class="add-btn" type="button" @click="triggerFileDialog" title="Ajouter des images">
                    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
                        <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>

            <div class="thumbnails" @dragover.prevent>
                <div v-for="(img, index) in images" 
                :key="img.id" 
                class="thumbnail" 
                :class="{ active: index === selectedIndex }"
                @click="selectedIndex = index">
                    <img :src="img.url" :alt="'Vignette ' + (i+1)" />
                    <button type="button" class="thumb-remove" @click.stop="removeAt(i)" aria-label="Supprimer">
                        ×
                    </button>
                </div>
            </div>
        </div>

        <!-- Input masqué -->
        <input ref="fileInput" type="file" class="hidden-input" accept="image/*" multiple @change="onFileInput" />
        
        <!-- Lightbox -->
        <div v-if="lightboxOpen" class="lightbox" @click.self="closeLightbox" tabindex="0">
            <button class="lb-close" @click="closeLightbox" aria-label="Fermer">x</button>
            <button class="lb-nav left" @click.stop="previous" aria-label="Suivante">◀</button>
            <img class="lb-image" :src="images[lightboxIndex].url" :alt="'Image ' + (lightboxIndex + 1)" />
            <button class="lb-nav right" @click.stop="next" aria-label="Précédente">▶</button>
            <div class="lb-dots">
                <button v-for="(img, index) in images" :key="'dot-'+img.id"
                :class="{ dot:true, active:index===lightboxIndex }"
                @click.stop="lightboxIndex = index"
                :aria-label="'Aller à l’image ' + (index+1)"></button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, watch } from 'vue';

/**
 * v-model usage:
 *   v-model="files"   // returns File[] à envoyer à l’API
 * Props:
 *   initialUrls?: string[]  // si tu as déjà des images (édition d’un marqueur)
 */
const props = defineProps({
    modelValue: { type: Array, default: () => [] }, // File[]
    initialUrls: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'change'])

const fileInput = ref(null);
const dragOver = ref(false);
const selectedIndex = ref(0);

let dragIndex = null

const images = reactive([])
props.initialUrls.forEach((url, index) => {
    images.push({ id: 'ext-' + index + '-' + Date.now(), url: url, file: null, isExternal: true})
})

watch(() => props.modelValue, (files) => {

}, { deep: true})

function triggerFileDialog() {
    fileInput.value?.click();
}

function onFileInput(event) {
    const files = Array.from(event.target.files || [])
    addFiles(files)
    event.target.value = ''; // reset
}

function onDrop(event) {
    dragOver.value = false;
    const dt = event.dataTransfer;
    if (!dt) return;
    const files = Array.from(dt.files || []).filter(f => f.type.startsWith('image/'))
    addFiles(files)
}

function addFiles(files) {
    const newFiles = []
    files.forEach((file) => {
        const url = URL.createObjectURL(file)
        images.push({ id: 'file-' + cryptoRandom(), url, file, isExternal: false})
        newFiles.push(file)
    })
    // mettre à jour le v-model
    const allFiles = images.filter(img => img.file).map(img => img.file)
    emit('update:modelValue', allFiles)
    emit('change', allFiles)
    if (images.length > 0 && selectedIndex.value < 0) selectedIndex.value = 0
}

function removeAt(index) {
    const removed = images.splice(index, 1)[0]
    if (removed && removed.file && removed.url && !removed.isExternal) URL.revokeObjectURL(removed.url)
    if (selectedIndex.value >= images.length) selectedIndex.value = images.length - 1
    const allFiles = images.filter(img => img.file).map(img => img.file)
    emit('update:modelValue', allFiles)
    emit('change', allFiles)
}

function cryptoRandom() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/* LightBox */
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
function openLightbox(index) {
    lightboxIndex.value = index
    lightboxOpen.value = true
    setTimeout(() => {
        const el = document.querySelector('.lightbox')
        el && el.focus()
    }, 0)
}
function closeLightbox() { lightboxOpen.value = false }
function previous() { lightboxIndex.value = (lightboxIndex.value - 1 + images.length) % images.length }
function next() { lightboxIndex.value = (lightboxIndex.value + 1) % images.length }

function onKeydown(event) {
    if (!lightboxOpen.value) return
    if (event.key === 'Escape') closeLightbox()
    else if (event.key === 'ArrowLeft') previous()
    else if (event.key === 'ArrowRight') next()
}
document.addEventListener('keydown', onKeydown)

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    images.forEach(img => {
        if(img.file && img.url && !img.isExternal) URL.revokeObjectURL(img.url)
    })
})
</script>

<style scoped>
.add-image {
    display: block;
    width: 100%;
    --radius: 14px;
    --border: 1px solid rgba(255,255,255,0.18);
    --bg: rgba(255,255,255,0.04);
    --bg-hover: rgba(255,255,255,0.08);
}

/* Dropzone (vide) */
.dropzone {
    display: block;
    cursor: pointer;
}
.hidden-input {
    display: none;
}
.inner-dropzone {
    border: var(--border);
    border-radius: var(--radius);
    background-color: var(--bg);
    padding: 28px 20px;
    text-align: center;
    transition: background .15s ease, border-color .15s ease, transform .05s ease;
    user-select: none;
}
.inner-dropzone:hover {
    background-color: var(--bg-hover);
}
.inner-dropzone.drag-over {
    border-color: #00bdff;
    transform: scale(0.998);
}
.inner-dropzone svg { opacity: .9; }
.dropzone-title { 
    margin-top: 6px; 
    font-weight: 600; 
    font-size: 15px;
}
.dropzone-subtitle {
    margin-top: 2px; 
    font-size: 12px; 
    opacity: .8;
}

/* Avec images */
.grid {
    display: grid;
    grid-template-columns: 3fr 1fr; /* ~75 / 25 */
    gap: 14px;
}
.viewer {
    position: relative;
    border: var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    background: #0b0b0c;
    min-height: 240px;
    cursor: zoom-in;
}
.viewer img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #0b0b0c;
}
.btn-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,.55);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    font-size: 16px;
    line-height: 26px;
    cursor: pointer;
}
.btn-remove:hover { background: rgba(0,0,0,.75); }

.side {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.add-btn {
    width: 100%;
    border: var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    padding: 10px 0;
    cursor: pointer;
}
.add-btn:hover { background: var(--bg-hover); }
.add-btn svg { vertical-align: middle; }

.thumbnails {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-height: 280px;
    overflow: auto;
    padding-right: 4px;
}
.thumbnail {
    position: relative;
    width: calc(50% - 4px);
    aspect-ratio: 1 / 1;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.15);
    cursor: pointer;
    transition: transform .06s ease;
}
.thumbnail:hover { transform: translateY(-1px); }
.thumbnail.active {
    outline: 2px solid #00bdff;
    outline-offset: 0;
}
.thumbnail img {
    width: 100%; height: 100%; object-fit: cover; display: block;
}
.thumb-remove {
    position: absolute; top: 4px; right: 4px;
    background: rgba(0,0,0,.55);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff; width: 22px; height: 22px; border-radius: 999px;
    line-height: 20px; font-size: 14px; cursor: pointer;
}
.thumb-remove:hover { background: rgba(0,0,0,.75); }

/* Lightbox */
.lightbox {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.92);
    display: grid; place-items: center;
    z-index: 9999;
    outline: none;
}
.lb-image { max-width: 90vw; max-height: 82vh; object-fit: contain; }
.lb-close, .lb-nav {
    position: absolute;
    background: rgba(0,0,0,.5);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff;
    cursor: pointer;
}
.lb-close {
    top: 14px; right: 16px;
    width: 36px; height: 36px; border-radius: 999px; font-size: 22px; line-height: 34px;
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
}
.dot.active { background: #fff; }
@media (max-width: 760px) {
    .grid { grid-template-columns: 1fr; }
    .thumb { width: calc(25% - 6px); }
}
</style>