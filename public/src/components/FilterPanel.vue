<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  isOpen: { type: Boolean, required: true },
});

const emit = defineEmits(["close", "apply-filters", "reset-filters"]);

const CATEGORIES = [
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
];

const selected = ref([]);

function closePanel() {
  emit("close");
  resetFilters();
}

function resetFilters() {
  selected.value = [];
  emit("reset-filters");
}

function applyFilters() {
  emit("apply-filters", [...selected.value]);
  emit("close");
}
</script>

<template>
  <transition name="panel-fade">
    <aside
      v-if="isOpen"
      class="panel"
      role="dialog"
      aria-label="Filtrer les lieux"
    >
      <header class="panel__header">
        <h3>Filtrer les lieux</h3>
        <button class="panel__close" @click="closePanel" aria-label="Fermer">
          ×
        </button>
      </header>

      <div class="panel__body">
        <p class="subtitle">Sélectionnez les catégories à afficher :</p>

        <div class="checkboxes">
          <label
            v-for="cat in CATEGORIES"
            :key="cat"
            class="checkbox"
          >
            <input
              type="checkbox"
              :value="cat"
              v-model="selected"
            />
            <span>{{ cat }}</span>
          </label>
        </div>
      </div>

      <footer class="panel__footer">
        <button class="btn-reset" @click="resetFilters">Réinitialiser</button>
        <button class="btn-apply" @click="applyFilters">Appliquer</button>
      </footer>
    </aside>
  </transition>
</template>

<style scoped>
/* ---------- Panneau (même style que AddMarqueurPanel.vue) ---------- */
.panel {
  position: absolute;
  top: 12px;
  bottom: 12px;
  right: 12px;
  width: 320px;

  display: flex;
  flex-direction: column;

  background: #f2f2f2;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  color: #111;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 1000;
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
  line-height: 22px;
  font-size: 18px;

  border-radius: 4px;
  border: 2px solid #4CAF50;
  background: white;
  color: #4CAF50;

  cursor: pointer;
  transition: all 0.3s ease;
}

.panel__close:hover {
  background: #4CAF50;
  color: white;
}

.panel__body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.subtitle {
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.checkboxes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox input {
  width: 16px;
  height: 16px;
}

.panel__footer {
  display: flex;
  justify-content: space-between;

  padding: 12px;
  border-top: 1px solid #ddd;
}

/* ---------- Boutons ---------- */

.btn-reset {
  padding: 8px 12px;
  background: white;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  color: #4CAF50;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.btn-reset:hover {
  background: #4CAF50;
  color: white;
}

.btn-apply {
  padding: 8px 12px;
  background: #4CAF50;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.btn-apply:hover {
  background: white;
  color: #4CAF50;
}

/* ---------- Transition ---------- */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
