<script setup>
import { ref, computed } from 'vue';
import { useMarqueurStore } from '../stores/useMarqueur';

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
</script>
<template>
    <transition name="panel-fade">
        <aside v-if="canDisplayPanel" class="panel" role="dialog" aria-label="information du marqueur">
            <header class="panel__header">
				<img :src="marqueurStore.marqueurActif.properties.images[0].url" :alt="'image d\'entré d\'un marqueur'" />
                <h3>{{ marqueurStore.marqueurActif.properties.titre }}</h3>
                <button class="panel__close" @click="closePanel" aria-label="Fermer">×</button>
            </header>
            <div class="panel__body">
				
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

.panel__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	font-weight: 700;
	border-bottom: 1px solid #ddd;
}
.panel__header img {
	width: 40px;
	height: 40px;
	object-fit: cover;
	border-radius: 4px;
	margin-right: 8px;
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