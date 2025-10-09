<script setup>
import { ref, reactive, onBeforeMount } from 'vue';

/** Icône caméra+ */
const CameraIcon = {
  name: 'CameraIcon',
  props: { class: String },
  template: `
    <svg :class="class" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor"
        d="M7.5 6h2.1l1.2-1.6c.28-.37.71-.6 1.18-.6h2.24c.47 0 .9.23 1.18.6L16.6 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5zm4.5 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/>
      <path fill="currentColor" d="M20.5 6.5h-1v-1a.75.75 0 1 0-1.5 0v1h-1a.75.75 0 1 0 0 1.5h1v1a.75.75 0 1 0 1.5 0v-1h1a.75.75 0 0 0 0-1.5z"/>
    </svg>`
}
</script>
<template>
    <div class="add-image">
        <!-- Aucune image -->
        <button v-if="images.length === 0" type="button" class="empty-add-btn" @click="trigger()">
            <CameraIcon class="icon-camera" />
            <span class="add-text">Ajouter une image</span>
        </button>
    </div>
</template>
<style scoped>
</style>