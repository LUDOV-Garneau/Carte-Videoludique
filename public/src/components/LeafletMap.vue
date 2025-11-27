<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import { reverseGeocode, isAddressInQuebecProvince } from '../utils/geocode.js'
import AddMarqueurPanel from './AddMarqueurPanel.vue'
import MarqueurPanel from './MarqueurPanel.vue'
import { useMarqueurStore } from '../stores/useMarqueur.js'

import 'leaflet.fullscreen'
import 'leaflet.fullscreen/Control.FullScreen.css'

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
const createPanelOpen = ref(false);
const infoPanelOpen = ref(false);
const marqueurs = ref([]);
const selectedMarqueur = ref(null);
const currentMarqueur = ref(null);
const currentAdresse = ref('');

const QUEBEC_BOUND = L.latLngBounds(
  [40, -90],
  [63, -50]   
)

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
  map = L.map(mapEl.value, { 
    center: [52.5, -71.0],
    zoom: 5,               
    minZoom: 5,            
    maxZoom: 19,

    zoomControl: true,
    zoomAnimation: false,
    maxBounds: QUEBEC_BOUND,
    maxBoundsViscosity: 1.0,

    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 'topleft', 
      title: 'Plein écran',
      titleCancel: 'Quitter le plein écran'
    }
    
  })
  .setView([52.5, -71.0], 5);
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
    noWrap: true,
    bounds: QUEBEC_BOUND,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd'
  }).addTo(map)
}

/**
 * Centre la carte sur les coordonnées spécifiées avec une animation fluide.
 *
 * @function focusOn
 * @param {number} lat - Latitude du point à centrer.
 * @param {number} lng - Longitude du point à centrer.
 * @param {number} [zoom=16] - Niveau de zoom optionnel (par défaut 16).
 * @returns {void}
 */
function focusOn(lat, lng) {
  if (!map) return
  map.flyTo([lat, lng], 16)
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
		if (!createPanelOpen.value) return

		const { lat, lng } = e.latlng
		if (currentMarqueur.value) map.removeLayer(currentMarqueur.value)

		latitude.value = lat.toFixed(5);
		longitude.value = lng.toFixed(5);

    currentMarqueur.value = L.marker([lat, lng])
			.addTo(map)
			.bindPopup(`Proposition<br>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
			.openPopup();
		map.setView([lat, lng], 18);

		verifyAdressInQuebec(lat, lng)
	});
}

/**
 * Cette fonction vérifie si l'adresse est dans la province de Québec.
 * Si oui, elle ajoute le marqueur sur la carte
 * Sinon, elle retire le marqueur et affiche un message à l'utilisateur
 * 
 * @param lat La coordonnée de latitude du marqueur
 * @param lng La coordonnée de longitude du marqueur
 */
async function verifyAdressInQuebec(lat, lng) {
  try {
    const result = await reverseGeocode({lat, lng});
    const addr = result.address;

    if (!addr) {
      if (currentMarqueur.value) {
        map.removeLayer(currentMarqueur.value);
        currentMarqueur.value = null;
      }
      currentAdresse.value = '';
      alert('Impossible de déterminer une adresse.');
      closeCreatePanel();
      return;
    }

    if (!isAddressInQuebecProvince(addr)) {
      if (currentMarqueur.value) {
        map.removeLayer(currentMarqueur.value);
        currentMarqueur.value = null;
      }
      currentAdresse.value = '';
      map.setView([lat, lng], 5);
      alert("L'adresse doit être située dans la province de Québec, Canada.");
      closeCreatePanel();
      return;
    }

    const quartier = addr.suburb || addr.city_district;
    const ville =
      addr.city || addr.town || addr.village || addr.municipality;

    const ligne = [
      addr.house_number,
      addr.road,
      quartier, 
      ville,
      addr.state,
      addr.postcode,
      addr.country,
    ]
      .filter(Boolean)
      .join(', ');

    currentAdresse.value = ligne;

  } catch (err) {
    console.error(err);
    if (currentMarqueur.value) {
      map.removeLayer(currentMarqueur.value);
      currentMarqueur.value = null;
    }
    currentAdresse.value = '';
    alert("Erreur lors de la vérification de l'adresse.");
    closeCreatePanel();
  }
}

/**
 * Affiche tous les marqueurs sur la carte Leaflet.
 *
 * Cette fonction :
 *  - Récupère la liste des marqueurs depuis le store (`marqueurStore`),
 *  - Supprime les anciens marqueurs de la carte,
 *  - Crée et ajoute un nouveau `L.marker` pour chaque entrée de données,
 *  - Configure l'opacité selon le statut (`pending` = semi-transparent),
 *  - Attache un événement de clic sur chaque marqueur pour :
 *      → le définir comme marqueur sélectionné (`selectedMarqueur`),
 *      → charger ses données détaillées via `marqueurStore.getMarqueur(id)`,
 *      → ouvrir le panneau d'information (`openInfoPanel()`),
 *      → et recentrer la carte sur le marqueur.
 * 
 * @async
 * @function afficherMarqueurs
 * @returns {Promise<void>} Promesse résolue lorsque les marqueurs sont affichés.
 * 
 */
async function afficherMarqueurs() {
  try {
    await marqueurStore.getMarqueurs();
    marqueurs.value.forEach(marqueur => {
      map.removeLayer(marqueur);
    });
    marqueurs.value = [];

    marqueurStore.marqueurs.forEach(marqueurData => {
      if (marqueurData.geometry && marqueurData.geometry.coordinates) {
        const [lat, lng] = marqueurData.geometry.coordinates;
        const properties = marqueurData.properties;

        const marqueur = L.marker([lat, lng]);
        if (properties.status === 'pending') marqueur.setOpacity(0.5);
        marqueur.addTo(map);

        marqueur.properties = properties;

        marqueur.on('click', (e) => {
          selectedMarqueur.value = marqueur;
          marqueurStore.getMarqueur(marqueurData.properties.id);
          openInfoPanel();

          map.setView([lat, lng], Math.max(map.getZoom(), 15));
        });

        marqueurs.value.push(marqueur);
      }
    });
    console.log(map.Marker);
  } catch (err) {
    console.error('afficherMarqueurs error:', err);
  }
}

/**
 * Ouvre le panneau d'ajout d'un marqueur
 */
function openCreatePanel() {
  createPanelOpen.value = true
  const container = map?.getContainer?.()
  if(container?.style) container.style.cursor = 'crosshair'
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none'
}

/**
 * Ferme le panneau d'ajout d'un marqueur 
 * et efface le contenu des champs si nécéssaire
 */
function closeCreatePanel() {
  createPanelOpen.value = false
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

/**
 * Ouvre le panneau d'information d'un marqueur.
 * Ferme le panneau d'ajout s'il est ouvert et masque le bouton d'ajout.
 */
function openInfoPanel() {
  if (createPanelOpen.value) closeCreatePanel();
  infoPanelOpen.value = true;
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none';
}

/**
 * Ferme le panneau d'information d'un marqueur.
 * Réinitialise la sélection et réaffiche le bouton d'ajout.
 */
function closeInfoPanel() {
  infoPanelOpen.value = false;
  selectedMarqueur.value = null;
  marqueurStore.marqueurActif = null;
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = '';
}

/**
 * Gère la mise à jour de la carte après l'ajout d'un marqueur.
 * Recharge les marqueurs, nettoie le marqueur temporaire
 * et ferme le panneau d'ajout.
 */
async function handleMarqueurAdded() {
	await afficherMarqueurs();
	closeCreatePanel();
}

/**
 * Gère la mise à jour de la carte après la suppréssion d'un marqueur.
 * Recharge les marqueurs, nettoie le marqueur temporaire
 * et ferme le panneau d'ajout.
 */
async function handleMarqueurDeleted() {
  await afficherMarqueurs();
  closeInfoPanel();
}

/**
 * Localise une adresse sur la carte à partir de ses coordonnées.
 * Supprime l'ancien marqueur, ajoute le nouveau et recadre la carte.
 * @param {{ lat: number, lng: number }} coords
 */
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
        openCreatePanel()
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
    if (e.key === 'Escape' && createPanelOpen.value) closeCreatePanel()
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

defineExpose({
  afficherMarqueurs,
  handlelocateFromAddress,

  latitude,
  longitude,
  marqueurs,
  currentMarqueur,
  selectedMarqueur,
  map,
  focusOn
});
</script>


<template>

  <div class="map" ref="mapEl"></div>

	<AddMarqueurPanel
		:is-open="createPanelOpen"
		:coordinates="{ lat: latitude, lng: longitude }"
		:adresse="currentAdresse"
		@close="closeCreatePanel"
		@marqueur-added="handleMarqueurAdded"
		@locate-address="handlelocateFromAddress"
	/>

  <MarqueurPanel
    :is-open="infoPanelOpen"
    @close="closeInfoPanel"
    @marqueur-deleted="handleMarqueurDeleted"
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

.leaflet-fullscreen-icon {
	background-image: url('icon-fullscreen.svg');
	background-size: 26px 52px;
}

.leaflet-fullscreen-icon.leaflet-fullscreen-on {
	background-position: 0 -26px;
}

.leaflet-touch .leaflet-fullscreen-icon {
	background-position: 2px 2px;
}

.leaflet-touch .leaflet-fullscreen-icon.leaflet-fullscreen-on {
	background-position: 2px -24px;
}

/* Safari still needs this vendor-prefix: https://caniuse.com/mdn-css_selectors_fullscreen */
/* stylelint-disable-next-line selector-no-vendor-prefix */
.leaflet-container:-webkit-full-screen,
.leaflet-container:fullscreen {
	width: 100% !important;
	height: 100% !important;
	z-index: 99999;
}

.leaflet-pseudo-fullscreen {
	position: fixed !important;
	width: 100% !important;
	height: 100% !important;
	top: 0 !important;
	left: 0 !important;
	z-index: 99999;
}
</style>
