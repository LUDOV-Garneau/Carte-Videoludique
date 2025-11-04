<script setup>
import { onMounted, onUnmounted, ref, isRef } from 'vue'
import * as utils from '../utils/utils.js'
import * as cloudinary from '../utils/cloudinary.js'
import { reverseGeocode, geocodeAddress } from '../utils/geocode.js'
import AddImage from './AddImage.vue'
import L from 'leaflet'
import { useMarqueursStore } from '../stores/useMarqueur.js'

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

const files = ref([]);

const marqueurStore = useMarqueursStore()

const mapEl = ref(null)
let map
let controlAjoutMarqueur
let btnAjoutMarqueur
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
const longitude = ref('')
const latitude = ref('')
const panelOpen = ref(false)
const imageWindowOpen = ref(false)
const marqueurs = ref([]);
const selectedMarqueur = ref(null);
const currentMarqueur = ref(null);
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
  images: [],
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
  const container = map?.getContainer?.()
  if(container?.style) container.style.cursor = 'crosshair'
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none'
}

function closePanel() {
  panelOpen.value = false
  const container = map?.getContainer?.()
  if (container?.style) container.style.cursor = 'grab'
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = ''
  if (currentMarqueur.value) {
    map.removeLayer(currentMarqueur.value)
    currentMarqueur.value = null
  }
  latitude.value = ''
  longitude.value = ''
  form.value.lat = ''
  form.value.lng = ''
  
}

function openImageWindow() {
  imageWindowOpen.value = true;
}

function closeImageWindow() {
  imageWindowOpen.value = false;
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
  if (form.value.email && !utils.isValidEmail(form.value.email)) {
    formErrors.value.email = 'Le courriel n’est pas valide.'
    isValid = false
  }
  return isValid
}

/**
 * Envoie de façon asynchrone le contenu du formulaire au serveur pour créer un nouveau marqueur.
 *
 * La fonction :
 *  - Valide le formulaire via {@link validateForm}.
 *  - Envoie une requête POST vers l’API du site "Carte-Vidéoludique" à travers {marqueurStore}.
 *  - Ferme le panneau en cas de succès.
 *  - Journalise et relance l’erreur en cas d’échec.
 *
 * @async
 * @function sendRequest
 * @returns {Promise<void>} Ne retourne rien, mais effectue des effets de bord (envoi HTTP, fermeture du panneau).
 * @throws {Error} Si la requête réseau échoue ou si la réponse du serveur contient une erreur.
 */
async function sendRequest() {
  try {
    if (validateForm()) {
      if (files.value.length > 0) {
        form.value.images = await cloudinary.uploadMultipleImages(files.value);
        console.log("images uploadées :", JSON.parse(JSON.stringify(form.value.images)));
      }
      
      const created = await marqueurStore.ajouterMarqueur(form.value);

      console.log("Marqueur ajouté avec succès :", created);
      await afficherMarqueurs();
      closePanel();
    }
  } catch (err) {
     if (form.value.images.length) {
      try { await cloudinary.cleanupImages(form.value.images.map(img => img.publicId)); }
      catch (e) { console.warn('Rollback Cloudinary a échoué :', e); }
    }
    console.error('sendRequest error:', err);
    throw err;
  }    
}

/**
 * Localise une adresse saisie dans le formulaire sur la carte Leaflet.
 *
 * Cette fonction utilise `geocodeAddress()` pour convertir l’adresse textuelle
 * en coordonnées GPS, puis :
 *  - ajoute un marqueur à l’emplacement correspondant,
 *  - met à jour les champs de latitude et longitude du formulaire,
 *  - centre et zoome la carte sur cette position.
 *
 * Si un marqueur précédent existe déjà, il est supprimé avant d’ajouter le nouveau.
 *
 * ⚠️ Remarques :
 * - Si aucune adresse n’est saisie ou trouvée, la fonction ne fait rien.
 * - En cas d’erreur de géocodage, un message est inscrit dans `formErrors.value.adresse`.
 *
 * @async
 * @function locateFromAddress
 * @returns {Promise<void>}
 * Ne retourne rien, mais met à jour la carte et le formulaire associés.
 * @throws {Error} En cas d’erreur réseau ou si l’API de géocodage échoue.
 *
 * @example
 * // Suppose que form.value.adresse = "350 rue des Lilas Ouest, Québec"
 * await locateFromAddress();
 * // → Ajoute un marqueur à la position correspondante et centre la carte.
 */
async function locateFromAddress() {
  const q = form.value.adresse
  if (!q) return
  try {
    const pos = await geocodeAddress(q)
    if (!pos) return

    if (currentMarqueur.value) {
      map.removeLayer(currentMarqueur.value)
      currentMarqueur.value = null
    }

    const { lat, lng } = pos
    currentMarqueur.value = L.marker([lat, lng])
      .addTo(map)
      .bindPopup('Adresse localisée')
      .openPopup()

    latitude.value  = lat.toFixed(5)
    longitude.value = lng.toFixed(5)
    form.value.lat  = Number(latitude.value)
    form.value.lng  = Number(longitude.value)

    map.setView([lat, lng], 15)
  } catch (e) {
    console.error(e)
    formErrors.value.adresse = 'Adresse introuvable.'
  }
}

async function afficherMarqueurs() {
  try {
    await marqueurStore.getMarqueurs();

    marqueurs.value.forEach(marqueur => {
      map.removeLayer(marqueur);
    });
    marqueurs.value = [];

    marqueurStore.marqueurs.forEach(marqueurData => {
      if (marqueurData.geometry && marqueurData.geometry.coordinates) {
        const [lng, lat] = marqueurData.geometry.coordinates;
        const properties = marqueurData.properties;
        const comments = marqueurData.comments || [];

        const marqueur = L.marker([lat, lng]).addTo(map);

        marqueur.properties = properties;
        marqueur.comments = comments;

        marqueur.on('click', (e) => {
          selectedMarqueur.value = marqueur;
          console.log('Marqueur cliqué :', selectedMarqueur.value);
          console.log("properties: ", selectedMarqueur.value.properties.titre);

          openImageWindow();
          
          map.setView([lat, lng], Math.max(map.getZoom(), 15));
        });

        marqueurs.value.push(marqueur);
      }
    });
  } catch (err) {
    console.error('afficherMarqueurs error:', err);
  }
}

defineExpose({
  locateFromAddress,
  sendRequest,
  validateForm,
  openImageWindow,
  closeImageWindow,
  afficherMarqueurs,

  form,
  formErrors,
  latitude,
  longitude,
  marqueurs,
  currentMarqueur,
  selectedMarqueur,
  imageWindowOpen,
  map,
  files,
})

/**
 * Initialise la carte Leaflet et la centre sur Montréal.
 *
 * Cette fonction crée une instance de carte Leaflet, associée à l’élément DOM `mapEl`,
 * avec le zoom activé et une vue initiale centrée sur Montréal (45.5017, -73.5673).
 *
 * @function initMap
 * @returns {void}
 */
function initMap() {
  map = L.map(mapEl.value, { zoomControl: true, zoomAnimation: false }).setView([45.5017, -73.5673], 12)
}

/**
 * Ajoute la couche de tuiles (fond de carte) à la carte Leaflet.
 *
 * Utilise les tuiles « light_all » de CARTO basées sur OpenStreetMap.
 * Fournit un maximum de zoom de 19 et affiche les attributions nécessaires.
 *
 * @function addTileLayer
 * @returns {void}
 */
function addTileLayer() {
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd'
  }).addTo(map)
}

/**
 * Configure le comportement du clic sur la carte.
 *
 * Lorsqu’un clic se produit :
 *  - Si le panneau est ouvert, place un marqueur à l’endroit cliqué.
 *  - Supprime tout marqueur précédent.
 *  - Met à jour les champs `latitude`, `longitude`, `form.lat`, `form.lng`.
 *  - Fait une géocodification inverse pour remplir `form.adresse`.
 *
 * @async
 * @function setupMapClickHandler
 * @returns {Promise<void>} Promise résolue lorsque le gestionnaire de clic est attaché.
 */
function setupMapClickHandler() {
  map.on('click', async (e) => {
    if (!panelOpen.value) return

    const { lat, lng } = e.latlng
    if (currentMarqueur.value) map.removeLayer(currentMarqueur.value)

    latitude.value = lat.toFixed(5)
    longitude.value = lng.toFixed(5)
    form.value.lat = Number(latitude.value)
    form.value.lng = Number(longitude.value)

    currentMarqueur.value = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`Proposition<br>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      .openPopup()

    map.setView([lat, lng], 18);

    try {
      const { address } = await reverseGeocode(lat, lng)
      const ligne = [
        address.house_number, address.road,
        address.city || address.town || address.village,
        address.state, address.postcode, address.country
      ].filter(Boolean).join(', ')
      form.value.adresse = ligne
    } catch (err) {
      console.error(err)
      formErrors.value.adresse = 'Impossible de récupérer l’adresse.'
    }
  })
}

/**
 * Ajoute un contrôle personnalisé à la carte Leaflet pour permettre
 * l’ouverture du panneau d’ajout de marqueur.
 *
 * Le contrôle est placé en haut à droite de la carte.
 * Il crée un bouton « + Ajouter un marqueur » qui appelle `openPanel()`
 * lorsqu’on clique dessus.
 *
 * @function addCustomControl
 * @returns {void}
 */
function addCustomControl() {
  const ControlAjoutMarqueur = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-custom')
      btnAjoutMarqueur = container

      const btn = L.DomUtil.create('a', 'btn-ajout-marqueur', container)
      btn.href = '#'
      btn.title = 'Ajouter un marqueur'
      btn.textContent = 'Ajouter un marqueur'
      btn.setAttribute('role', 'button')
      btn.setAttribute('aria-label', 'Ajouter un marqueur')
      btn.innerHTML = '<span aria-hidden="true"> + </span><span class="sr-only">Ajouter un marqueur</span>'

      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        openPanel()
      })

      return container
    }
  })

  controlAjoutMarqueur = new ControlAjoutMarqueur()
  map.addControl(controlAjoutMarqueur)
}

/**
 * Configure les raccourcis clavier globaux liés à la carte.
 *
 * Actuellement, la touche **Échap (Escape)** permet de fermer le panneau
 * si celui-ci est ouvert. Le listener est stocké sur l’objet `map`
 * afin de pouvoir être retiré lors du démontage du composant (`onUnmounted`).
 *
 * @function setupKeyboardShortcuts
 * @returns {void}
 */
function setupKeyboardShortcuts() {
  const onKey = (e) => {
    if (e.key === 'Escape' && panelOpen.value) closePanel()
  }
  window.addEventListener('keydown', onKey)
  map.__onKey = onKey
}

onMounted(async() => {
  initMap()
  addTileLayer()
  setupMapClickHandler()
  addCustomControl()
  setupKeyboardShortcuts()
  await afficherMarqueurs();
});

onUnmounted(() => {
  if (map) {
    if (controlAjoutMarqueur) map.removeControl(controlAjoutMarqueur)
    if (map.__onKey) window.removeEventListener('keydown', map.__onKey)
    map.remove()
  }
});
</script>

<template>
  <div class="map" ref="mapEl"></div>
  
  <!-- Petite fenêtre d'image -->
  <transition name="image-window-fade">
    <div
      v-if="imageWindowOpen"
      class="image-window"
      @click.self="closeImageWindow"
    >
      <div class="image-window__content">
        <button class="image-window__close" @click="closeImageWindow" aria-label="Fermer">
          ×
        </button>
        
        <div v-if="selectedMarqueur && selectedMarqueur.properties">
          <div class="image-window__header">
            <h4>{{ selectedMarqueur.properties.titre }}</h4>
            <p class="image-window__type">{{ selectedMarqueur.properties.type }}</p>
          </div>

          <div class="image-window__images" v-if="selectedMarqueur.properties.images && selectedMarqueur.properties.images.length > 0">
            <img
              v-for="(image, index) in selectedMarqueur.properties.images"
              :key="index"
              :src="image.url"
              :alt="`Image ${index + 1} de ${selectedMarqueur.properties.titre}`"
              class="image-window__image"
              @load="$event.target.style.opacity = '1'"
            />
          </div>
          
          <div v-else class="image-window__no-image">
            <p>Aucune image disponible pour ce marqueur</p>
          </div>
        </div>
        
        <div v-else class="image-window__no-image">
          <p>Données du marqueur non disponibles</p>
        </div>
      </div>
    </div>
  </transition>
  
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
            <input type="number" id="lng" v-model.number="form.lng" placeholder="Longitude" inputmode="decimal" min="-180" max="180" step="any" class="form-inputText"/>
            <span class="error" v-if="formErrors.lng">{{ formErrors.lng }}</span>
          </div>
          <div class="form-group">
            <label for="lat">Latitude</label>
            <input type="number" id="lat" v-model.number="form.lat" placeholder="Latitude" inputmode="decimal" min="-90" max="90" step="any" class="form-inputText"/>
            <span class="error" v-if="formErrors.lat">{{ formErrors.lat }}</span>
          </div>
          <div class="form-group">
            <label for="adresse">Adresse</label>
            <input type="text" id="adresse" v-model.trim="form.adresse" placeholder="123 Rue Saint-Jean, Québec, QC, Canada" class="form-inputText"/>
            <span class="error" v-if="formErrors.adresse">{{ formErrors.adresse }}</span>
            <button type="button" class="btn-locate" @click="locateFromAddress">Localiser</button>
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
            <label for="nom">Votre nom</label>
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
          <div class="form-group">
            <label for="image">Photo du lieu</label>
            <p>Des photos utiles</p>
            <AddImage v-model="files"/>
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

/* ---------- Petite fenêtre d'image ---------- */
.image-window {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.image-window__content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  position: relative;
  padding: 20px;
}

.image-window__close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f44336;
  color: white;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-window__close:hover {
  background: #d32f2f;
}

.image-window__header {
  margin-bottom: 15px;
  padding-right: 40px;
}

.image-window__header h4 {
  margin: 0 0 5px 0;
  color: #4CAF50;
  font-size: 18px;
  font-weight: 600;
}

.image-window__type {
  margin: 0;
  color: #666;
  font-size: 14px;
  font-style: italic;
}

.image-window__images {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.image-window__image {
  width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: zoom-in;
}

.image-window__image:hover {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

.image-window__no-image {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.image-window__no-image p {
  margin: 0;
  font-style: italic;
}

/* Transition pour la fenêtre d'image */
.image-window-fade-enter-active,
.image-window-fade-leave-active {
  transition: opacity 0.3s ease;
}

.image-window-fade-enter-from,
.image-window-fade-leave-to {
  opacity: 0;
}

.image-window-fade-enter-active .image-window__content,
.image-window-fade-leave-active .image-window__content {
  transition: transform 0.3s ease;
}

.image-window-fade-enter-from .image-window__content,
.image-window-fade-leave-to .image-window__content {
  transform: scale(0.8);
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
.btn-locate {
  background-color: white;
  color: #4CAF50;
  padding: 8px;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 12px;
}
.btn-locate:hover {
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

</style>
