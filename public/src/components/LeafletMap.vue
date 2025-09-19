<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'

// (Fix des icônes avec Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const mapEl = ref(null)
let map

onMounted(() => {
  // Centre par défaut (Montréal) — ajuste selon ton besoin
  map = L.map(mapEl.value, { zoomControl: true }).setView([45.5017, -73.5673], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
  }).addTo(map)

  // Marqueur d’exemple
  L.marker([45.5017, -73.5673]).addTo(map).bindPopup('Hello Leaflet + Vue!')

  // Ajout rapide de marqueurs au clic (MVP)
  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`Proposition<br>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
  })
})

onUnmounted(() => {
  if (map) map.remove()
})
</script>

<template>
  <div class="map-container" ref="mapEl" />
</template>

<style scoped>
.map-container {
  width: 100%;
  /* 100vh si tu veux plein écran, sinon fixe une hauteur : */
  height: 100vh;
}
</style>
