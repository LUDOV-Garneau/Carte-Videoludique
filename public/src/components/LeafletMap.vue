<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import { reverseGeocode } from '../utils/geocode.js'
import AddMarqueurPanel from './AddMarqueurPanel.vue'
import { useMarqueurStore } from '../stores/useMarqueur.js'

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

const marqueurStore = useMarqueurStore()

const mapEl = ref(null)
let map
let controlAjoutMarqueur
let btnAjoutMarqueur

const longitude = ref('')
const latitude = ref('')
const panelOpen = ref(false)
const imageWindowOpen = ref(false)
const marqueurs = ref([]);
const selectedMarqueur = ref(null);
const currentMarqueur = ref(null);
const currentAdresse = ref('');

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
  currentAdresse.value = ''
}

function openImageWindow() {
  imageWindowOpen.value = true;
}

function closeImageWindow() {
  imageWindowOpen.value = false;
}

async function handleMarqueurAdded() {
	await afficherMarqueurs();
	closePanel();
}

function handlelocateFromAddress({ lat, lng }) {
	if (currentMarqueur.value) {
		map.removeLayer(currentMarqueur.value);
		currentMarqueur.value = null;
	}

	currentMarqueur.value = L.marker({lat, lng})
		.addTo(map)
		.bindPopup('Adresse localisée')
		.openPopup();

	latitude.value = lat.toFixed(5);
	longitude.value = lng.toFixed(5);

	map.setView({lat, lng}, 15);
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

        const marqueur = L.marker([lat, lng]);
        if (properties.status === 'pending') marqueur.setOpacity(0.5);
        marqueur.addTo(map);

        marqueur.properties = properties;
        marqueur.comments = comments;

        marqueur.on('click', (e) => {
          selectedMarqueur.value = marqueur;

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
  openImageWindow,
  closeImageWindow,
  afficherMarqueurs,

  latitude,
  longitude,
  marqueurs,
  currentMarqueur,
  selectedMarqueur,
  imageWindowOpen,
  map,
});

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
 *  - Met à jour les champs `latitude`, `longitude`.
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

		latitude.value = lat.toFixed(5);
		longitude.value = lng.toFixed(5);

		currentMarqueur.value = L.marker([lat, lng])
			.addTo(map)
			.bindPopup(`Proposition<br>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
			.openPopup();

		map.setView([lat, lng], 18);

		try {
		const { address } = await reverseGeocode(lat, lng)
		const ligne = [
			address.house_number, address.road,
			address.city || address.town || address.village,
			address.state, address.postcode, address.country
		].filter(Boolean).join(', ')
		currentAdresse.value = ligne;
		} catch (err) {
		console.error(err)
		currentAdresse.value = '';
		}
	});
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
  
	<!-- Composant panel d'ajout de marqueur -->
	<AddMarqueurPanel
		:is-open="panelOpen"
		:coordinates="{ lat: latitude, lng: longitude }"
		:adresse="currentAdresse"
		@close="closePanel"
		@marqueur-added="handleMarqueurAdded"
		@locate-address="handlelocateFromAddress"
	/>
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
