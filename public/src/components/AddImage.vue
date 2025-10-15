<script setup>
import { ref, reactive, onBeforeMount, watch } from 'vue';

const props = defineProps({
    modelValue: { type: Array, default: () => [] }, // File[]
    initialUrls: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue', 'change']);

const images = reactive([]);
const fileInput = ref(null);

// Normaliser les images initiales
props.initialUrls.forEach((url, index) => {
    images.push({ id: 'ext-' + index + '-' + Date.now(), url, file: null, isExternal: true });
});

watch(() => props.modelValue, (files) => {

}, { deep: true});

function pick() {
    fileInput.value?.click();
}
function onPick(event) {
    console.log(event);
    const files = Array.from(event.target.files || []);
    addFiles(files);
    event.target.value = '';
}

function addFiles(files) {
    const newFiles = [];
    files.forEach((file) => {
        const url = URL.createObjectURL(file);
        images.push({ id: 'file-' + cryptoRandom(), url, file, isExternal: false });
        newFiles.push(file);
    });
    const allFiles = images.filter(img => img.file).map(img => img.file);
    emit('update:modelValue', allFiles);
    emit('change', allFiles);
}

function removeAt(index) {
    const removed = images.splice(index, 1)[0];
    if (removed && removed.file && removed.url && !removed.isExternal) URL.revokeObjectURL(removed.url);
    const allFiles = images.filter(img => img.file).map(img => img.file);
    emit('update:modelValue', allFiles);
    emit('change', allFiles);
}

function cryptoRandom() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function open(index) {

}

onBeforeMount(() => {
    images.forEach((image) => {
        if (image.file && image.url && !image.isExternal) {
            URL.revokeObjectURL(image.url);
        }
    })
});
</script>
<template>
    <div class="add-image">
        <!-- Aucune image -->
        <button v-if="images.length === 0" type="button" class="btn-add" @click="pick()">
            <svg class="camera-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor"
                    d="M7.5 6h2.1l1.2-1.6c.28-.37.71-.6 1.18-.6h2.24c.47 0 .9.23 1.18.6L16.6 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5zm4.5 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/>
                <path fill="currentColor" d="M20.5 6.5h-1v-1a.75.75 0 1 0-1.5 0v1h-1a.75.75 0 1 0 0 1.5h1v1a.75.75 0 1 0 1.5 0v-1h1a.75.75 0 0 0 0-1.5z"/>
            </svg>
            <span class="add-text">Ajouter une image</span>
        </button>

        <!-- Avec images -->
        <div v-else class="tiles">
            <!-- tuile d'ajout -->
            <button type="button" class="tile btn-add-tile" @click="pick()">
                <svg class="camera-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor"
                        d="M7.5 6h2.1l1.2-1.6c.28-.37.71-.6 1.18-.6h2.24c.47 0 .9.23 1.18.6L16.6 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5zm4.5 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/>
                    <path fill="currentColor" d="M20.5 6.5h-1v-1a.75.75 0 1 0-1.5 0v1h-1a.75.75 0 1 0 0 1.5h1v1a.75.75 0 1 0 1.5 0v-1h1a.75.75 0 0 0 0-1.5z"/>
                </svg>
            </button>

            <!-- tuiles d'images -->
            <div v-for="(image, index) in images" :key="image.id" class="tile thumbnail" @click="open(index)">
                <img :src="image.url" :alt="'Image ' + (index + 1)" />
                <button type="button" class="btn-delete" @click.stop="removeAt(index)" aria-label="Supprimer">✕</button>
            </div>
        </div>

        <input ref="fileInput" type="file" class="hidden" accept="image/*" multiple @change="onPick" />


    </div>
</template>
<style scoped>
    .hidden {
        display: none;
    }
    
    /* Pas d'images */
    .btn-add{
        display: inline-flex; 
        align-items: center; 
        padding: 8px 14px;
        border: 1px solid #4CAF50; 
        color: #4CAF50; 
        background: white;
        border-radius: 999px; font-weight: 600; cursor: pointer;
        box-shadow: 0 1px 0 rgba(0,0,0,.02);
        transition: all .3s ease;
    }
    .btn-add:hover { background: #4CAF50; color: white; }

    .btn-add .camera-icon { margin-right: 8px; }

    /* Avec images */
    .tiles {
        display: flex;
        gap: 8px;
        max-height: 280px;
        overflow: auto;
        flex-wrap: wrap;
        padding-right: 4px;
    }

    .tile {
        position: relative;
        width: calc(33.33% - 6px);
        aspect-ratio: 1 / 1;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, .15);
        overflow: hidden;
        transition: all .3 ease;
    }
    .tile:hover {
        transform: translateY(-1px);
    }
    .tile.active {
        outline: 2px solid #00bdff;
        outline-offset: 0;
    }

    .btn-add-tile {
        color: #1e40af;
        cursor: pointer;
    }
    .btn-add-tile:hover { 
        background-color: #f3f6fc;
        border-color: #d7def0;
    }

    .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        cursor: zoom-in;
    }
    .btn-delete {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background-color: rgba(0, 0, 0, .55);
        border: 1px solid rgba(255,255,255,.2);
        color: white;
        font-size: 14px;
        line-height: 20px;
        padding-right: 10px;
        cursor: pointer;
    }
    .btn-delete:hover {
        background-color: rgba(0, 0, 0, .75);
    }
</style>