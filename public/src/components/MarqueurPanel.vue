<script setup>
import { ref, computed } from 'vue';
import { useMarqueurStore } from '../stores/useMarqueur';
import { svg } from 'leaflet';

// props and emits
const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
});
const emits = defineEmits(['close']);

const marqueurStore = useMarqueurStore();
const canDisplayPanel = computed(() => {
    return props.isOpen && marqueurStore.marqueurActif !== null;
});

function closePanel() {
    emits('close');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Optionnel : ajouter une notification de succès
        console.log('Adresse copiée dans le presse-papiers');
    }).catch(err => {
        console.error('Erreur lors de la copie :', err);
    });
}
</script>
<template>
    <transition name="panel-fade">
        <aside v-if="canDisplayPanel" class="panel" role="dialog" aria-label="information du marqueur">
			<img v-if="marqueurStore.marqueurActif.properties.images.length > 0" class="panel__thumbnail" :src="marqueurStore.marqueurActif.properties.images[0].url" :alt="'image d\'entré d\'un marqueur'" />
			<button class="panel__close" @click="closePanel" aria-label="Fermer">×</button>
            <header class="panel__header">
                <h3>{{ marqueurStore.marqueurActif.properties.titre }}</h3>
				<p>Catégorie : {{ marqueurStore.marqueurActif.properties.type }}</p>
            </header>
            <div class="panel__body">
				<div class="panel__section">
					<h5>Description</h5>
					<p>{{ marqueurStore.marqueurActif.properties.description }}</p>
					<span>Créé par : {{ marqueurStore.marqueurActif.properties.createdByName }}</span>
				</div>
				<div class="panel__info-list">
					<div v-if="marqueurStore.marqueurActif.properties.adresse" class="info-item">
						<svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
						</svg>
						<span class="info-text">{{ marqueurStore.marqueurActif.properties.adresse }}</span>
						<button class="info-copy-button" @click="copyToClipboard(marqueurStore.marqueurActif.properties.adresse)" title="Copier l'adresse">
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
							</svg>
						</button>
					</div>
					<div v-if="marqueurStore.marqueurActif.geometry.coordinates" class="info-item">
						<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none " class="info-icon">
							<path fill="currentColor" stroke="currentColor" stroke-width="2" d="M12,10 C14.209139,10 16,8.209139 16,6 C16,3.790861 14.209139,2 12,2 C9.790861,2 8,3.790861 8,6 C8,8.209139 9.790861,10 12,10 Z M12,10 L12,22"></path>
						</svg>
						<span class="info-text">Coordonnées : {{ marqueurStore.marqueurActif.geometry.coordinates.join(', ') }}</span>
						<button class="info-copy-button" @click="copyToClipboard(marqueurStore.marqueurActif.geometry.coordinates.join(', '))" title="Copier les coordonnées">
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
							</svg>
						</button>
					</div>
				</div>
            </div>
        </aside>
    </transition>
</template>
<style scoped>
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

.panel__close {
	width: 28px;
	height: 28px;;
	border-radius: 4px;
	border: 2px solid #4CAF50;
	background: white;
	color: #4CAF50;
	line-height: 22px;
	font-size: 18px;
	cursor: pointer;
	transition: all 0.3s ease;
	position: absolute;
	right: 12px;
	top: 12px;
}

.panel__close:hover {
	background: #4CAF50;
	color: white;
}

.panel__thumbnail {
	object-fit: cover;
	border-radius: 4px 4px 0 0;
	margin-right: 8px;
	position: relative;
	width: 100%;
	height: 180px;
}

.panel__header {
	display: block;
	padding: 10px 12px;
	font-weight: 700;
	max-width: 90%;
}
.panel__header h3 {
	margin: 0;
	font-size: 24px;
	padding-bottom: 5px;
}
.panel__header p {
	font-weight: 500;
	opacity: 0.5;
	margin: 0;
}

.panel__body {
	overflow: auto;
	flex: 1;
	display: flex;
	flex-direction: column;
	border-top: gray 1px solid;
}

.panel__section {
	padding: 12px;
}
.panel__section p {
	margin: 0;
}
.panel__section span {
	font-size: 14px;
	text-decoration: underline;
}

/* ---------- Info list ---------- */
.panel__info-list {
	
}
.info-item {
	display: flex;
	align-items: center;
	width: 100%;
	margin: 0;
	padding: 8px 12px 8px 0;
	position: relative;
	transition: background-color 0.2s ease;
	cursor: default;
}
.info-item:hover {
	background: rgba(76, 175, 80, 0.1);
}
.info-icon {
	width: 20px;
	height: 20px;
	margin: 0 12px;
	flex-shrink: 0;
	color: #4CAF50;
}
.info-text {
	font-size: 14px;
	color: #333;
	line-height: 1.4;
	flex: 1;
}
.info-copy-button {
	width: 24px;
	height: 24px;
	border: none;
	background: transparent;
	cursor: pointer;
	border-radius: 4px;
	padding: 0;
	opacity: 0;
	color: #666;
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	right: 12px;
	z-index: 2;
}
.info-item::after {
	content: '';
	position: absolute;
	right: 0;
	top: 0;
	bottom: 0;
	width: 100px;
	background: linear-gradient(to right, transparent, white 60%);
	pointer-events: none;
	opacity: 0;
	z-index: 1;
}
.info-item:hover .info-copy-button {
	opacity: 1;
}
.info-item:hover::after {
	opacity: 1;
}
.info-copy-button:hover {
	color: #4CAF50;
}
.info-copy-button svg {
	width: 100%;
	height: 100%;
}

/* Transition simple (fade + léger slide) */
.panel-fade-enter-active,
.panel-fade-leave-active { 
  	transition: opacity .18s ease, transform .18s ease; 
}

.panel-fade-enter-from,
.panel-fade-leave-to { 
	opacity: 0; 
	transform: translateX(8px); 
}

.panel.left.panel-fade-enter-from,
.panel.left.panel-fade-leave-to { 
  	transform: translateX(-8px); 
}
</style>