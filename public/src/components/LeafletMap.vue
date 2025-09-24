<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'

// (Fix des icônes avec Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const mapEl = ref(null)
let map
let controlAjoutMarqueur

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

  const ControlAjoutMarqueur = L.Control.extend({
    options : { position: 'topright'},
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-custom')
      
      const btn = L.DomUtil.create('a', 'btn-ajout-marqueur', container)
      btn.href = '#'
      btn.title = 'Ajouter un marqueur'
      btn.textContent = 'Ajouter un marqueur'
      btn.setAttribute('role', 'button')
      btn.setAttribute('aria-label', 'Ajouter un marqueur')
      // btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>'
      btn.innerHTML = '<span aria-hidden="true">+</span><span class="sr-only">Ajouter un marqueur</span>';

      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)

      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        console.log('Clique sur le bouton affiche le formulaire d’ajout de marqueur')
      })
      return container
    }
  })
  controlAjoutMarqueur = new ControlAjoutMarqueur()
  map.addControl(controlAjoutMarqueur)
})

onUnmounted(() => {
  if (map) {
    if (controlAjoutMarqueur) map.removeControl(controlAjoutMarqueur)
    map.remove()
  }
})
</script>

<template>
  <div class="map" ref="mapEl" />
</template>

<style>
.map {
  width: 100%;
  /* 100vh si tu veux plein écran, sinon fixe une hauteur : */
  height: 100vh;
}

</style>
