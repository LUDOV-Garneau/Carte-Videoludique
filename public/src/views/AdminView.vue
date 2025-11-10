<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueursStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/useAuth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/connexion')
}

const marqueursStore = useMarqueursStore()
const authStore = useAuthStore()

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

const accepterMarqueur = async (marqueur) => {
  const id = marqueur?.properties?.id;
  if (!id) return;

  try {
    if (!authStore.token) throw new Error('Non authentifié: token absent');

    console.log('ancien status:', marqueur.properties.status); // <-- AVANT

    const payload = { status: 'approved' };
    const updated = await marqueursStore.modifierMarqueurStatus(id, authStore.token, payload);

    console.log('status renvoyé par le serveur:', updated?.properties?.status); // <-- RÉPONSE

    marqueur.properties.status = updated.properties.status;

    console.log('nouveau status local:', marqueur.properties.status); // <-- APRÈS
  } catch (err) {

    messageErreur.value = err.message;
  }
};

const refuserMarqueur = async (marqueur) => {
  const id = marqueur?.properties?.id;
  if (!id) return;

  try {
    if (!authStore.token) throw new Error('Non authentifié: token absent');

    console.log('ancien status:', marqueur.properties.status); // <-- AVANT

    const payload = { status: 'rejected' };
    const updated = await marqueursStore.modifierMarqueurStatus(id, authStore.token, payload);

    console.log('status renvoyé par le serveur:', updated?.properties?.status); // <-- RÉPONSE

    marqueur.properties.status = updated.properties.status;

    console.log('nouveau status local:', marqueur.properties.status); // <-- APRÈS
  } catch (err) {
    messageErreur.value = err.message;
  }
};


onMounted(() => {
  getMarqueurs()

})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <span class="brand-vertical">L U D O V</span>
    </aside>

    <main class="content">
      <header class="page-header">
  <div class="page-header-content">
    <h1 class="page-title mb-0">Le jeu vidéo au Québec</h1>

    <nav class="navbar navbar-expand-lg navbar-light bg-transparent shadow-none">
      <div class="container-fluid">
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <template v-if="auth.isAuthenticated">
              <li class="nav-item">
                <router-link to="/profile" class="nav-link">{{ auth.name }}</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/accounts" class="nav-link">Administrateurs</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/inscription" class="nav-link">Créer un compte</router-link>
              </li>
              <li class="nav-item">
                <a href="#" class="nav-link" @click="logout()">Se déconnecter</a>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </nav>
  </div>
</header>

      <h2 class="section-title">Notifications</h2>

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
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                    />
                    <line
                      x1="12"
                      y1="10.5"
                      x2="12"
                      y2="17"
                      stroke="currentColor"
                      stroke-width="1.75"
                    />
                    <circle cx="12" cy="7.5" r="1.25" fill="currentColor" />
                  </svg>
                  <span>Afficher la description</span>
                </button>
              </td>
              <td class="menu-col">
                <button class="kebab" aria-label="Modifier" @click="$emit('menu', marqueur)">
                  Modifier
                </button>
              </td>
              <td class="accept-col">
                <button class="action-btn accept" @click="accepterMarqueur(marqueur)">
                  Accepter
                </button>
              </td>
              <td class="reject-col">
                <button class="action-btn reject" @click="refuserMarqueur(marqueur)">
                  Refuser
                </button>
              </td>
            </tr>
            <tr v-if="!marqueursFiltres || marqueursFiltres.length === 0">
              <td colspan="6" class="empty">
                Aucune offre pour le moment.
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
/* Tableau de notification */

/* Titre */
/* ---------- Typo & couleurs locales (sans :root) ---------- */
h1, h2, p, table { color: #111827; }

/* ---------- Layout & fond blanc texturé ---------- */
.layout{
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at 25% -10%, rgba(0,0,0,.03) 0%, transparent 40%),
    radial-gradient(circle at 120% 10%, rgba(0,0,0,.02) 0%, transparent 45%),
    linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  position: relative;
  isolation: isolate;
}

/* ---------- Sidebar (gris élégant) ---------- */
.sidebar{
  width: 96px;
  background: linear-gradient(
   180deg,
   #e5e7eb 0%,
   #f3f4f6 100%
  );
  border-right: 1px solid #d1d5db; /* bordure gris moyen */
  display: flex;
  justify-content: center;
  align-items: start;
  position: sticky;
  top: 0;
  height: 100vh;
  box-shadow: var(--shadow-md);
}
.brand-vertical{
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: .2rem;
  font-weight: 800;
  font-size: 1.25rem;
  color: #0f172a;
  user-select: none;
  padding: 18px 6px;
  border-radius: 12px;

}

/* ---------- Contenu & header ---------- */
.content{
  flex: 1;
  padding: 28px clamp(16px, 3vw, 40px);
  margin: 0;
}
.page-header {
  max-width: 1100px;
  margin: 0 auto 24px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 28px 0;
  backdrop-filter: blur(8px) saturate(1.05);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.05);
}

.page-header-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.page-title {
  text-align: center;
  font-weight: 800;
  font-size: clamp(1.5rem, 2vw + .6rem, 2rem);
  color: #0f172a;
  margin: 0;
}

/* ---------- Navbar (Bootstrap-friendly) ---------- */
.page-header .navbar {
  background: transparent !important;
  box-shadow: none !important;
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
  margin-top: 8px;
}
.navbar .nav-link {
  color: #334155;
  font-weight: 500;
  transition: color 0.2s ease;
}
.navbar .nav-link:hover {
  color: #0f172a;
}
.nav-link.active {
  color: #0f766e;
  font-weight: 700;
}

/* ---------- Titre section ---------- */
.section-title{
  margin: 8px auto 12px;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  max-width: 1100px;
}

/* ---------- Tableau notifications (card + sticky header) ---------- */
.offers-wrapper{
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  overflow-x: auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0,0,0,.06), 0 3px 10px rgba(0,0,0,.05);
}
.offers-table{
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  color: #111827;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
}
thead th{
  position: sticky; top: 0; z-index: 1;
  background: linear-gradient(180deg, #f6f7f9 0%, #ffffff 140%);
  border-bottom: 1px solid #e5e7eb;
  font-weight: 700;
  letter-spacing: .2px;
}
th, td{
  padding: 14px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
  text-align: left;
}
tbody tr:last-child td{ border-bottom: none; }

/* zébrage + hover doux */
tbody tr:nth-child(odd) td{ background: #fbfbfc; }
.row-hover:hover td{
  background: #f3f6ff;
  transition: background .18s ease;
}

/* colonnes */
.info-col{ width: 220px; }
.modif-col, .accept-col, .reject-col{ width: 140px; text-align: center; }

/* boutons */
.info-btn{
  display: inline-flex; align-items: center; gap: 8px;
  font: inherit; border: none; background: transparent;
  cursor: pointer; padding: 0; color: #2563eb;
}
.info-btn:hover{ text-decoration: underline; }
.info-icon{ width: 18px; height: 18px; }

.kebab{
  background: transparent; border: 1px solid #e5e7eb; color: #111827;
  padding: 8px 12px; border-radius: 999px; cursor: pointer;
  transition: transform .06s ease, background .18s ease, border-color .18s ease;
}
.kebab:hover{ background: #f3f6ff; border-color: #c7d2fe; }
.kebab:active{ transform: scale(.98); }

.action-btn{
  width: 100%; border: none; padding: 10px 14px;
  font-weight: 700; cursor: pointer; border-radius: 999px;
  transition: transform .06s ease, filter .18s ease, opacity .18s ease;
}
.action-btn:active{ transform: scale(.98); }

.action-btn.accept{
  background: #e8fbef; color: #0f9b63;  /* vert doux */
}
.action-btn.accept:hover{ filter: brightness(.98); }

.action-btn.reject{
  background: #fff1f2; color: #e11d48;  /* rouge doux */
}
.action-btn.reject:hover{ filter: brightness(.98); }

/* états vides + bouton clear centré */
.empty{
  text-align: center; color: #6b7280; background: #fff;
}
.empty-btn{ text-align: center; padding: 16px 0; }
.clear-btn{
  background: #111827; color: #fff;
  border: none; padding: 10px 16px; border-radius: 999px;
  font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,.08);
}
.clear-btn:hover{ filter: brightness(1.05); }

/* ---------- Carte encadrée premium ---------- */
.map-wrapper{
  position: relative;
  margin: 18px auto 0;
  width: 100%;
  max-width: 1200px;
  height: min(78vh, 900px);
  border-radius: 20px;
  overflow: clip;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 40px rgba(0,0,0,.08), 0 6px 14px rgba(0,0,0,.06);
}

/* ---------- Titres par défaut ---------- */
h1{ color: #0f172a; }
h2{ color: #0f172a; text-decoration: underline; }
p{ color: #111827; }
table{ color: #111827; }

/* ---------- Responsive ---------- */
@media (max-width: 900px){
  .sidebar{ width: 72px; }
  .brand-vertical{ font-size: 1.05rem; letter-spacing: .16rem; }
  .page-header{ padding: 16px 18px; }
  .navbar{ border-radius: 12px; }
  .map-wrapper{ height: 70vh; }
}
@media (max-width: 640px){
  .sidebar{ display: none; }
  .content{ padding: 18px 14px; }
  .page-header { padding: 12px 18px; }
  .page-header-content { gap: 8px; }
  .page-title { font-size: 1.4rem; }
  .map-wrapper{ height: 63vh; }
}
</style>
