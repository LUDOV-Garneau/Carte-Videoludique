<script setup>
import { ref, reactive, onBeforeMount } from 'vue';

const images = reactive([]);

function trigger() {

}
function onPick(event) {

}
</script>
<template>
    <div class="add-image">
        <!-- Aucune image -->
        <button v-if="images.length === 0" type="button" class="add-btn" @click="trigger()">
            <svg class="camera-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor"
                    d="M7.5 6h2.1l1.2-1.6c.28-.37.71-.6 1.18-.6h2.24c.47 0 .9.23 1.18.6L16.6 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5zm4.5 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/>
                <path fill="currentColor" d="M20.5 6.5h-1v-1a.75.75 0 1 0-1.5 0v1h-1a.75.75 0 1 0 0 1.5h1v1a.75.75 0 1 0 1.5 0v-1h1a.75.75 0 0 0 0-1.5z"/>
            </svg>
            <span class="add-text">Ajouter une image</span>
        </button>

        <!-- Avec images -->
        <div v-else class="tiles">
            <button type="button" class="tile add-btn-tile" @click="trigger()">
                <svg class="camera-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor"
                        d="M7.5 6h2.1l1.2-1.6c.28-.37.71-.6 1.18-.6h2.24c.47 0 .9.23 1.18.6L16.6 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5zm4.5 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/>
                    <path fill="currentColor" d="M20.5 6.5h-1v-1a.75.75 0 1 0-1.5 0v1h-1a.75.75 0 1 0 0 1.5h1v1a.75.75 0 1 0 1.5 0v-1h1a.75.75 0 0 0 0-1.5z"/>
                </svg>
            </button>
        </div>

        <input type="file" class="hidden" accept="image/*" multiple @change="onPick" />

        
    </div>
</template>
<style scoped>
    .hidden {
        display: none;
    }
    
    /* Pas d'images */
    .add-btn{
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
    .add-btn:hover { background: #4CAF50; color: white; }

    .add-btn .camera-icon { margin-right: 8px; }

    /* Avec images */

</style>