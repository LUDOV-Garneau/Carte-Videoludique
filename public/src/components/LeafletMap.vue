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
let btnAjoutMarqueur

const panelOpen = ref(false)
const panelSide = ref('right')

function openPanel() {
  panelOpen.value = true
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none'
}

function closePanel() {
  panelOpen.value = false
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = ''
}

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
      btnAjoutMarqueur = container;
      
      const btn = L.DomUtil.create('a', 'btn-ajout-marqueur', container)
      btn.href = '#'
      btn.title = 'Ajouter un marqueur'
      btn.textContent = 'Ajouter un marqueur'
      btn.setAttribute('role', 'button')
      btn.setAttribute('aria-label', 'Ajouter un marqueur')
      btn.innerHTML = '<span aria-hidden="true"> + </span><span class="sr-only">Ajouter un marqueur</span>';

      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)

      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        console.log('Clique sur le bouton affiche le formulaire d’ajout de marqueur')
        openPanel()
      })
      return container
    }
  })
  controlAjoutMarqueur = new ControlAjoutMarqueur()
  map.addControl(controlAjoutMarqueur)

  // ESC pour fermer
  const onKey = (e) => { if (e.key === 'Escape' && panelOpen.value) closePanel() }
  window.addEventListener('keydown', onKey)
  map.__onKey = onKey
})

onUnmounted(() => {
  if (map) {
    if (controlAjoutMarqueur) map.removeControl(controlAjoutMarqueur)
    if (map.__onKey) window.removeEventListener('keydown', map.__onKey)
    map.remove()
  }
})
</script>

<template>
  <div class="map-wrap">
    <div class="map" ref="mapEl"></div>
    <!-- Panneau overlay -->
    <transition name="panel-fade">
      <aside
        v-if="panelOpen"
        class="panel"
        :class="panelSide"
        role="dialog"
        aria-label="Ajouter un lieu"
      >
        <header class="panel__header">
          <h3>Ajouter un lieu</h3>
          <button class="panel__close" @click="closePanel" aria-label="Fermer">
            ×
          </button>
        </header>

        <div class="panel__body">
          <!-- Placeholders pour ressembler à l’image -->
          <form class="fake-form">
            <label>Latitude :</label>
            <input disabled placeholder="" />
            <label>Longitude :</label>
            <input disabled placeholder="" />
            <label>Nom du lieu :</label>
            <input disabled placeholder="" />
            <label>Adresse :</label>
            <input disabled placeholder="" />
            <label>Description :</label>
            <textarea disabled rows="3"></textarea>
            <label>Anecdote lié à ce lieu</label>
            <textarea disabled rows="3"></textarea>
            <label>Nom :</label>
            <input disabled placeholder="" />
            <label>Votre adresse courriel :</label>
            <input disabled placeholder="" />
            <button type="button" disabled class="send">Envoyer</button>
          </form>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100vh; /* plein écran */
  background: #111;
}
.map {
  position: absolute;
  inset: 0;
}

/* ---------- Panneau ---------- */
.panel {
  position: absolute;
  top: 12px;
  bottom: 12px;
  width: 320px;            /* ajuste selon besoin */
  background: #f2f2f2;
  color: #111;
  border: 2px solid #673ab7; /* contour mauve comme sur l’image */
  border-radius: 4px;
  z-index: 1000;           /* au-dessus des contrôles Leaflet */
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}
.panel.right { right: 12px; }
.panel.left  { left: 12px; }

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-weight: 700;
  border-bottom: 1px solid #ddd;
}
.panel__header h3 {
  margin: 0;
  font-size: 16px;
}
.panel__close {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid #4CAF50;
  background: white;
  color: #4CAF50;
  line-height: 22px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.panel__close:hover {
  background: #4CAF50;
  color: white;
}
.panel__body {
  padding: 12px;
  overflow: auto;
}

/* Imitation visuelle du formulaire de l’image */
.fake-form {
  display: grid;
  row-gap: 10px;
}
.fake-form label {
  font-size: 14px;
}
.fake-form input,
.fake-form textarea {
  width: 100%;
  background: #c7c7c7;
  border: none;
  border-radius: 8px;
  height: 32px;
  padding: 6px 10px;
}
.fake-form textarea { height: auto; padding-top: 8px; }
.fake-form .send {
  margin-top: 6px;
  align-self: start;
  background: #e5e5e5;
  border: 1px solid #bbb;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: not-allowed;
}

/* Transition simple (fade + léger slide) */
.panel-fade-enter-active,
.panel-fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.panel-fade-enter-from,
.panel-fade-leave-to { opacity: 0; transform: translateX(8px); }
.panel.left.panel-fade-enter-from,
.panel.left.panel-fade-leave-to { transform: translateX(-8px); }

/* ---------- Contrôle Leaflet custom ---------- */
.leaflet-control-custom {

}
.leaflet-control-custom .btn-ajout-marqueur {
  background-color: white;
  border: 2px solid #4CAF50;
  color: #4CAF50;
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.btn-ajout-marqueur:hover {
  background-color: #4CAF50;
  color: white;
}

</style>
