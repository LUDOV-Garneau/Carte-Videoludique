<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from "vue-router";
import { isValidEmail } from '../utils.js'
import L from 'leaflet'


// (Fix des icônes avec Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const router = useRouter()

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
let controlAdmin

const TYPES = [
  'Écoles et instituts de formation',
  'Développement et édition de jeux',
  'Boutiques spécialisées',
  'Magasins à grande surface',
  'Friperies, marchés aux puces et d\'occasion',
  'Dépanneurs et marchés',
  'Clubs vidéo',
  'Arcades et salles de jeux',
  'Organismes et institutions',
  'Autres',
]

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
  error: '',
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
  formErrors.value = {
    lng: '',
    lat: '',
    titre: '',
    description: '',
    type: '',
    nom: '',
    email: '',
    souvenir: '',
    adresse: '',
  }
  // Vérif coordonnées complètes
  if (!form.value.lng && form.value.lat || form.value.lng && !form.value.lat) {
    formErrors.value.lng = 'La longitude et la latitude doivent être toutes les deux remplies ou laissées vides.'
    formErrors.value.lat = 'La longitude et la latitude doivent être toutes les deux remplies ou laissées vides.'
    isValid = false
  }
  // Vérif que minimum adresse ou coordonnées
  if (!form.value.adresse && (!form.value.lng && !form.value.lat)) {
    formErrors.value.error = 'Il faut fournir une adresse ou des coordonnées (longitude et latitude).'
    isValid = false
  }
  // Vérif titre requis
  if (!form.value.titre) {
    formErrors.value.titre = 'Le titre est requis.'
    isValid = false
  }
  // Vérif description requise
  if (!form.value.description) {
    formErrors.value.description = 'La description est requise.'
    isValid = false
  }
  // Vérif email si rempli
  if (form.value.email && !isValidEmail(form.value.email)) {
    formErrors.value.email = 'Le courriel n’est pas valide.'
    isValid = false
  }
  return isValid
}

async function sendRequest() {
  try {
    if (validateForm()) {
      const response = await fetch("https://carte-videoludique.vercel.app/marqueurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.value)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l’envoi du marqueur.");
      }
      const responseData = await response.json();
      console.log("Marqueur ajouté avec succès :", responseData);
      closePanel();
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function goToAdmin() {
  router.push('/admin')
}

onMounted(() => {
  // Centre par défaut (Montréal) — ajuste selon ton besoin
  map = L.map(mapEl.value, { zoomControl: true }).setView([45.5017, -73.5673], 12)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd'
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
  const ControlAdmin = L.Control.extend({
    options : { position: 'topleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-custom')
      const btn = L.DomUtil.create('a', 'btn-admin', container)
      btn.href = '#'
      btn.title = 'Admin'
      btn.textContent = 'Admin'
      btn.setAttribute('role', 'button')
      btn.setAttribute('aria-label', 'Admin')
      btn.innerHTML = '<span aria-hidden="true"> ⚙ </span><span class="sr-only">Admin</span>';

      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)

      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        goToAdmin()
      })
      return container
    }
  })
  controlAdmin = new ControlAdmin()
  controlAjoutMarqueur = new ControlAjoutMarqueur()
  map.addControl(controlAjoutMarqueur)
  map.addControl(controlAdmin)

  // ESC pour fermer
  const onKey = (e) => { if (e.key === 'Escape' && panelOpen.value) closePanel() }
  window.addEventListener('keydown', onKey)
  map.__onKey = onKey
})

onUnmounted(() => {
  if (map) {
    if (controlAjoutMarqueur) map.removeControl(controlAjoutMarqueur)
    if (controlAdmin) map.removeControl(controlAdmin)
    if (map.__onKey) window.removeEventListener('keydown', map.__onKey)
    map.remove()
  }
})
</script>

<template>
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
            <input type="number" id="lng" v-model.trim.number="form.lng" placeholder="Longitude" inputmode="decimal" min="-180" max="180" class="form-inputText"/>
            <span class="error" v-if="formErrors.lng">{{ formErrors.lng }}</span>
          </div>
          <div class="form-group">
            <label for="lat">Latitude</label>
            <input type="number" id="lat" v-model.trim.number="form.lat" placeholder="Latitude" inputmode="decimal" min="-90" max="90" class="form-inputText"/>
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
            <select id="type" v-model="form.type" class="form-select">
              <option value="" selected>Aucun</option>
              <option v-for="type in TYPES" :key="type" :value="type">{{ type }}</option>
            </select>
            <span class="error" v-if="formErrors.type">{{ formErrors.type }}</span>
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
          <div class="form-group form-submit">
            <span class="error" v-if="formErrors.error">{{ formErrors.error }}</span>
            <button type="submit" class="btn-submit">Envoyer</button>
          </div>
        </form>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
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
  padding: 12px 12px 0 12px;
  overflow: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Formulaire */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-weight: 600;
  margin-bottom: 4px;
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
.form-select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}
.error {
  color: #D8000C;
  font-size: 13px;
  margin-top: 4px;
}
.btn-submit {
  background-color: white;
  color: #4CAF50;
  padding: 10px;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 12px;
}
.btn-submit:hover {
  background-color: #4CAF50;
  color: white;
}
.form-submit {
  position: sticky;
  bottom: 0;
  background: #f2f2f2;
  padding: 12px 0;
  margin-top: auto;
  border-top: 1px solid #ddd;
}


/* Transition simple (fade + léger slide) */
.panel-fade-enter-active,
.panel-fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.panel-fade-enter-from,
.panel-fade-leave-to { opacity: 0; transform: translateX(8px); }
.panel.left.panel-fade-enter-from,
.panel.left.panel-fade-leave-to { transform: translateX(-8px); }

/* ---------- Contrôle Leaflet custom ---------- */
:deep(.btn-ajout-marqueur) {
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

:deep(.btn-admin) {
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
:deep(.btn-admin:hover) {
  background-color: #4CAF50;
  color: white;
}
</style>
