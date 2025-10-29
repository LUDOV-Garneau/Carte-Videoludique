<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueursStore } from '../stores/useMarqueur'
// import {useRoute} from 'vue-router'


const marqueursStore = useMarqueursStore()
// const route = useRoute()
// const marqueurId = computed(() => route.params.marqueurId)

const messageErreur = ref('')

const filtreStatus = ref('pending')

const marqueursFiltres = computed(() => {
  console.log(marqueursStore.marqueurs)
  return (marqueursStore.marqueurs ?? []).filter(
    m => (m.properties.status ?? '').toLowerCase() === filtreStatus.value.toLowerCase()
  )
})

const getMarqueurs = () => {
  marqueursStore.getMarqueurs()
  .catch(error => {
    messageErreur.value = error.message;
  });
}
// const getMarqueur = (marqueurId) => {
//   marqueursStore.getMarqueur(marqueurId)
//   console.log(marqueurId)
// }

const accepterMarqueur = (marqueurId) => {
  marqueursStore.getMarqueur(marqueurId)
  console.log(marqueurId)
}

onMounted(() => {
  getMarqueurs()
  // getMarqueur(marqueurId.value)
})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <span class="brand-vertical">L U D O V</span>
    </aside>

    <main class="content">   
      <header class="page-header">
        <h1>Le jeu vidéo au Québec</h1>
        </header> 
        
        <h2>Notification</h2>
        
        <div class="offers-wrapper">
          <table class="offers-table" role="table" aria-label="Offres fournisseur">
            <thead>
              <tr>
                <th>Lieu</th>
                  <th>Adresse</th>
                  <th class="info-col">Info</th>
                  <th class="modif-col">Modification</th>
                  <th class="accept-col">Accepter</th>
                  <th class="reject-col">Refuser</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="marqueur in marqueursFiltres" :key="marqueur.id">
                  <td class="provider">{{ marqueur.properties.titre }}</td>
                  <td class="address">{{ marqueur.properties.adresse }}</td>
                  <td class="info-col">
                    <button class="info-btn" @click="$emit('show-info', marqueur)">
                      <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.75" />
                        <line x1="12" y1="10.5" x2="12" y2="17" stroke="currentColor" stroke-width="1.75"/>
                        <circle cx="12" cy="7.5" r="1.25" fill="currentColor" />
                      </svg>
                      <span>Afficher la description</span>
                    </button>
                  </td>
                  <td class="menu-col">
                    <button class="kebab" aria-label="Modifier" @click="$emit('menu', marqueur)">Modifier</button>
                  </td>
                  <td class="accept-col">
                    <button class="action-btn accept" @click="accepterMarqueur(marqueurId)">Accepter</button>
                  </td>
                  <td class="reject-col">
                    <button class="action-btn reject" @click="$emit('reject', marqueur)">Refuser</button>
                  </td>
                </tr>
                <tr v-if="!marqueursFiltres || marqueursFiltres.length === 0">
                  <td colspan="6" class="empty">Aucune offre pour le moment.
                    <div class="empty-btn">
                       <button class="clear-btn">Effacer les notifications</button>
                    </div>     
                  </td> 
                </tr>
              </tbody>
            </table>
        </div>
      <section class="map-wrapper">
        <LeafletMap /> 
      </section>      
    </main>
  </div>
</template>

<style scoped>
/*Tableau notifications*/
.offers-wrapper {
  width: 100%;
  overflow-x: auto; 
}
.offers-table { 
  width: 100%; 
  border-collapse: collapse; 
  table-layout: fixed; 
}
thead {
  background: #f3f2f2;
}
th, td { 
  border: 1px solid var(--border); 
  padding: 10px 12px; 
  text-align: left; 
}
th { 
  font-weight: 600;   
}
.provider, .address, .info-col, .menu-col { 
  background: var(--cell-bg); 
}
.info-col { 
  width: 240px; 
}
.modif-col { 
  width: 120px; 
  text-align: center; 
}
.accept-col { 
  width: 120px; 
  background: var(--green); 
  text-align: center; 
}
.reject-col { 
  width: 120px; 
  background: var(--red); 
  text-align: center; 
}
.info-btn { 
  display: inline-flex; 
  align-items: center; 
  gap: 8px; font: inherit; 
  border: none; 
  background: transparent; 
  cursor: pointer; 
  padding: 0; 
}
.info-btn:hover { 
  text-decoration: underline; 
}
.info-icon { 
  width: 18px; 
  height: 18px; 
}
.kebab { 
  background: transparent; 
  border: none; 
  line-height: 16px;  
  cursor: pointer; 
}
.kebab:hover { 
  opacity: 0.7; 
}
.action-btn { 
  width: 100%;
  border: none; 
  padding: 10px 12px; 
  font-weight: 600; 
  cursor: pointer; 
  background: transparent; 
}
.action-btn.accept:hover { 
 text-decoration: underline;
}
.action-btn.reject:hover { 
  text-decoration: underline;
}


/* Cellule vide */
.empty { 
  text-align: center; 
  color: #666; 
  background: #fff; 
}
.empty-btn {
  margin:20px;
}
.clear-btn {
  border: 1px solid black;
  padding: 6px 12px;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}
.clear-btn:hover {
  border: 1px solid black;
  padding: 6px 12px;
  background: #d6d4d4;
  cursor: pointer;
  border-radius: 4px;
}
h1 {
  color:black;
}
h2 {
    color: black;
    text-decoration: underline;
}
p {
  color:black
}
table{
  color: black;
}
.layout {
  display: flex;
  min-height: 100vh;
  background-color: white;
}
.sidebar {
  width: 90px;
  background-color: #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: center;
}
.brand-vertical{
  margin-top: 60px;
  writing-mode: vertical-rl;
  text-orientation: upright;
  height:100%;
  align-items:center; 
  font-weight:700; 
  font-size:1.5rem; 
  color:#000;
}
.content {
  margin:30px;
  flex: 1;
  padding: 16px 32px;
}
.map-wrapper {
  position: relative;
  margin: 16px auto 0;
  width: 100%;
  max-width: 1200px;
  height: 80vh;
  border-radius: 8px;
  overflow: hidden;
}
</style>