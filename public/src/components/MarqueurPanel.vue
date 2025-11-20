<script setup>
import { ref, computed } from 'vue';
import { useMarqueurStore } from '../stores/useMarqueur.js';
import { useEditRequestStore } from '../stores/useEditRequest';
import { API_URL } from '../config';
// import { svg } from 'leaflet';
import MarqueurModal from './MarqueurModalComponent.vue';

// props and emits
const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
});
const emits = defineEmits(['close']);

const marqueurStore = useMarqueurStore();
const editRequestStore = useEditRequestStore();

const canDisplayPanel = computed(() => {
    return props.isOpen && marqueurStore.marqueurActif !== null;
});

const marqueurProperties = computed(() => {
    return marqueurStore.marqueurActif?.properties || {};
});
const isCommenting = ref(false);

const isEditModalOpen = ref(false);

const formData = ref({
	auteur: '',
	contenu: ''
});
const formErrors = ref({
	auteur: '',
	contenu: ''
});

function openModificationRequest() {
	if(!marqueurStore.marqueurActif) return;
	isEditModalOpen.value = true;
}

function closePanel() {
    emits('close');
}


async function handleEditRequestSubmit(payloadFromModal) {
	try {
		const original = marqueurStore.marqueurActif;
		if (!original) return;

		const marqueurId = original.properties?.id || original._id;

		const props = payloadFromModal.properties || {};

		const body = {
			titre: props.titre,
    		type: props.type,
      		adresse: props.adresse,
      		description: props.description,
      		temoignage: props.temoignage,
		}
		await editRequestStore.createEditRequest(marqueurId, body);
		isEditModalOpen.value = false;
		console.log('Demande de modification soumise avec succès');
	} catch (err) {
		console.error('Erreur lors de la soumission de la demande de modification :', err);
	}
}

function toggleCommenting() {
	isCommenting.value = !isCommenting.value;
	formData.value.auteur = '';
	formData.value.contenu = '';
	console.log(marqueurStore.marqueurActif);
	console.log('isCommenting:', isCommenting.value);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Optionnel : ajouter une notification de succès
        console.log('Adresse copiée dans le presse-papiers');
    }).catch(err => {
        console.error('Erreur lors de la copie :', err);
    });
}

function validateCommentForm() {
	let isValid = true;
	formErrors.value = {
		auteur: '',
		contenu: ''
	}
	if (formData.value.auteur.trim().length > 50) {
		formErrors.value.auteur = 'Le nom ne doit pas dépasser 50 caractères.';
		isValid = false;
	}
	if (formData.value.contenu.trim().length === 0) {
		formErrors.value.contenu = 'Le contenu du témoignage ne peut pas être vide.';
		isValid = false;
	} else if (formData.value.contenu.trim().length > 500) {
		formErrors.value.contenu = 'Le témoignage ne doit pas dépasser 500 caractères.';
		isValid = false;
	}
	console.log('Form validation:', isValid, formErrors.value);
	return isValid;
}

async function sendComment() {
	try {
		if (validateCommentForm()) {
			const auteur = formData.value.auteur.trim();
			const contenu = formData.value.contenu.trim();

			const response = await fetch(`${API_URL}/marqueurs/${marqueurStore.marqueurActif?.properties?.id}/commentaires`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ auteur: auteur, texte: contenu }),
			});
			if (response.status !== 200 && response.status !== 201) {
				const errorData = await response.json()
                throw new Error(errorData.message || 'Erreur inconnue')
			}
			const responseData = await response.json();
			marqueurStore.marqueurActif.properties.comments.push(responseData.data);
			console.log('Commentaire envoyé avec succès :', responseData.data);
			toggleCommenting();
		}
	} catch (err) {
		console.error('Erreur lors de l\'envoi du commentaire :', err);
		throw err;
	}
}
</script>
<template>
    <transition name="panel-fade">
        <aside v-if="canDisplayPanel" class="panel" role="dialog" aria-label="information du marqueur">
			<div class="panel__close-wrapper">
				<button class="panel__close" @click="closePanel" aria-label="Fermer">×</button>
			</div>
			<img v-if="marqueurProperties.images?.length > 0" class="panel__thumbnail" :src="marqueurProperties.images[0].url" :alt="'image d\'entrée d\'un marqueur'" />
            <header class="panel__header">
                <h3>{{ marqueurProperties.titre }}</h3>
				<p>Catégorie : {{ marqueurProperties.type }}</p>
            </header>
            <div class="panel__body">
				<div class="panel__section">
					<h5>Description</h5>
					<p>{{ marqueurProperties.description }}</p>
					<span>Créé par : {{ marqueurProperties.createdByName }}</span>
				</div>
				<button class="btn-panel1" @click="openModificationRequest()">
   					Demander une modification
				</button>
				<div class="panel__info-list">
					<div v-if="marqueurProperties.adresse" class="info-item">
						<svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
						</svg>
						<span class="info-text">{{ marqueurProperties.adresse }}</span>
						<button class="info-copy-button" @click="copyToClipboard(marqueurProperties.adresse)" title="Copier l'adresse">
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
							</svg>
						</button>
					</div>
					<div v-if="marqueurStore.marqueurActif?.geometry?.coordinates" class="info-item">
						<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none " class="info-icon">
							<path fill="currentColor" stroke="currentColor" stroke-width="2" d="M12,10 C14.209139,10 16,8.209139 16,6 C16,3.790861 14.209139,2 12,2 C9.790861,2 8,3.790861 8,6 C8,8.209139 9.790861,10 12,10 Z M12,10 L12,22"></path>
						</svg>
						<span class="info-text">Coordonnées : {{ marqueurStore.marqueurActif?.geometry?.coordinates?.join(', ') }}</span>
						<button class="info-copy-button" @click="copyToClipboard(marqueurStore.marqueurActif?.geometry?.coordinates?.join(', ') || '')" title="Copier les coordonnées">
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
							</svg>
						</button>
					</div>
				</div>
				<div class="panel__section">
					<h5>Témoignages</h5>
					<button v-if="!isCommenting" class="btn-panel1" @click="toggleCommenting">Ajouter un témoignage</button>
					<form v-if="isCommenting" class="add-comment-form"  @submit.prevent="sendComment">
						<div class="add-comment-nom">
							<label for="auteur">Votre nom :</label>
							<input type="text" id="auteur" v-model.trim="formData.auteur" name="auteur" />
						</div>
						<textarea id="contenu" v-model.trim="formData.contenu" name="contenu" rows="4" placeholder="Votre témoignage..."></textarea>
						<div class="add-comment-actions">
							<button type="submit" class="btn-submit-comment">Envoyer</button>
							<button type="button" class="btn-cancel-comment" @click="toggleCommenting">Annuler</button>
						</div>
					</form>
					<span class="no-comments" v-if="marqueurStore.marqueurActif?.properties.comments.length === 0">Aucun témoignage</span>
					<div v-else>
						<div v-for="(comment, index) in marqueurStore.marqueurActif?.properties.comments || []" :key="index" class="panel__comments">
							<span>Auteur(e) : {{ comment.auteur }}</span>
							<p>{{ comment.contenu }}</p>
						</div>
					</div>
				</div>
            </div>
        </aside>

    </transition>
	<MarqueurModal
    	v-if="isEditModalOpen"
    	:marqueur="marqueurStore.marqueurActif"
    	@fermer="isEditModalOpen = false"
    	@valider="handleEditRequestSubmit"
  	/>
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
	overflow: auto;

}

.panel__close-wrapper {
	position: sticky;
	top: 0;
	right: 0;
	height: 0;
	background: #f2f2f2;
	z-index: 1;
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
.btn-panel1 {
  	display: block;
	width: auto;
	height: 30px;
	border-radius: 25px;
	padding: 0 12px;
	margin: 12px auto;
	border: 1px solid rgba(67, 160, 71, 0.35);
	box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
	color: #4CAF50;
	cursor: default;
	font-weight: 600;
	font-size: small;
	transition: all 0.3s ease;
}
.btn-panel1:hover {
	background: #4CAF50;
	color: white;
}

.no-comments {
	display: block;
	text-align: center;
}

/* ---------- Formulaire d'ajout de commentaire ---------- */
.add-comment-form {
	border: 3px solid #4CAF50;
	border-radius: 20px;
	margin-bottom: 10px;
	box-sizing: border-box;
}

.add-comment-nom {
	display: flex;
	flex-direction: row;
	align-items: center;
	border-bottom: solid 2px #4CAF50;
}
.add-comment-nom label {
	padding: 5px 10px;
	margin: 0;
	height: 40px;
	min-width: max-content;
	display: flex;
	align-items: center;
	border-right: 2px solid #4CAF50;
	border-radius: 15px 0 0 0;
	background-color: #4CAF50;
	color: white;
}
.add-comment-nom input {
	height: auto;
	width: 100%;
	padding: 0 10px;
	margin: 0;
	background-color: transparent;
	border: none;
}
.add-comment-nom input:focus {
	outline: none;
}

.add-comment-form textarea {
	width: 100%;
	border: none;
	resize: none;
	padding: 10px;
	margin: 0;
	font-family: inherit;
	font-size: 14px;
	box-sizing: border-box;
	background-color: transparent;
	display: block;
}
.add-comment-form textarea:focus {
	outline: none;
}

.add-comment-actions {
	display: flex;
	margin: 0;
	padding: 0;
	border-top: 2px solid #4CAF50;
}
.btn-submit-comment {
	border-radius: 0 0 0 16px;
}
.btn-cancel-comment {
	border-radius: 0 0 16px 0;
}
.btn-submit-comment, .btn-cancel-comment {
	width: 100%;
	height: 36px;
	border: none;
	background: white;
	color: #4CAF50;
	font-weight: 600;
	cursor: default;
	transition: all 0.3s ease;
}
.btn-submit-comment:hover, .btn-cancel-comment:hover {
	background: #4CAF50;
	color: white;
	cursor: default;
}

/* ---------- Commentaires ---------- */
.panel__comments {
	border-top: 1px solid #ccc;
	padding: 8px 0;
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

::-webkit-scrollbar {
  width: 10px;
}

/* Fond de la track */
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

/* La barre (thumb) */
::-webkit-scrollbar-thumb {
  background: #cfcfcf;
  border-radius: 8px;
  border: 2px solid #f1f1f1; /* pour créer un espace visuel */
}

/* Effet au hover */
::-webkit-scrollbar-thumb:hover {
  background: #b6b6b6;
}
</style>
