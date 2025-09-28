<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { isValidEmail } from '../utils.js'
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
const form = ref({
  lng: '',
  lat: '',
  titre: '',
  description: '',
  type: '',
  nom: '',
  email: '',
  souvenir: '',
  adresse: '',
})
const formErrors = ref({
  lng: '',
  lat: '',
  titre: '',
  description: '',
  type: '',
  nom: '',
  email: '',
  souvenir: '',
  adresse: '',
})

function openPanel() {
  panelOpen.value = true
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none'
}

function closePanel() {
  panelOpen.value = false
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = ''
}

function validateForm() {
  let isValid = true

}

async function sendRequest() {

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
          <form class="form" @submit.prevent="sendRequest">
            <div class="form-group">
              <label for="lng">Longitude</label>
              <input type="text" id="lng" v-model.trim.number="form.lng" placeholder="Longitude" class="form-inputText"/>
              <span class="error" v-if="formErrors.lng">{{ formErrors.lng }}</span>
            </div>
            <div class="form-group">
              <label for="lat">Latitude</label>
              <input type="text" id="lat" v-model.trim.number="form.lat" placeholder="Latitude" class="form-inputText"/>
              <span class="error" v-if="formErrors.lat">{{ formErrors.lat }}</span>
            </div>
            <div class="form-group">
              <label for="adresse">Adresse</label>
              <input type="text" id="adresse" v-model.trim="form.adresse" placeholder="Adresse" class="form-inputText"/>
              <span class="error" v-if="formErrors.adresse">{{ formErrors.adresse }}</span>
            </div>
            <div class="form-group">
              <label for="titre">Titre <span class="required">*</span></label>
              <input type="text" id="titre" v-model.trim="form.titre" placeholder="Titre" class="form-inputText"/>
              <span class="error" v-if="formErrors.titre">{{ formErrors.titre }}</span>
            </div>
            <div class="form-group">
              <label for="type">Type</label>
            </div>
            <div class="form-group">
              <label for="description">Description <span class="required">*</span></label>
              <input type="text" id="description" v-model.trim="form.description" placeholder="Description" class="form-inputText"/>
              <span class="error" v-if="formErrors.description">{{ formErrors.description }}</span>
            </div>
            <div class="form-group">
              <label for="nom">Nom</label>
              <input type="text" id="nom" v-model.trim="form.nom" placeholder="Nom" class="form-inputText"/>
              <span class="error" v-if="formErrors.nom">{{ formErrors.nom }}</span>
            </div>
            <div class="form-group">
              <label for="email">Courriel</label>
              <input type="email" id="email" v-model.trim="form.email" placeholder="Courriel" class="form-inputText"/>
              <span class="error" v-if="formErrors.email">{{ formErrors.email }}</span>
            </div>
            <div class="form-group">
              <label for="souvenir">Souvenir</label>
              <textarea id="souvenir" v-model.trim="form.souvenir" placeholder="Souvenir" class="form-textarea" rows="5"></textarea>
              <span class="error" v-if="formErrors.souvenir">{{ formErrors.souvenir }}</span>
            </div>
          </form>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100vh;
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
  width: 320px;
  background: #f2f2f2;
  color: #111;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  right: 12px;
}

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

/* Formulaire */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-group {
  display: flex;
  flex-direction: column;
}

.form-inputText {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  resize: none;
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
:deep(.leaflet-control-custom .btn-ajout-marqueur) {
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
:deep(.btn-ajout-marqueur:hover) {
  background-color: #4CAF50;
  color: white;
}

</style>
