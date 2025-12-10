<script setup>
import { onMounted, watch, computed } from 'vue'
import { useEditRequestStore } from '@/stores/useEditRequest'
import { useAuthStore } from '@/stores/auth'
import { useCommentRequestStore } from "@/stores/useCommentRequestStore";
import { useMarqueurStore } from "@/stores/useMarqueur";
import { API_URL } from '@/config';


const editRequestStore = useEditRequestStore()
const authStore = useAuthStore()
const marqueurStore = useMarqueurStore()
const commentRequestStore = useCommentRequestStore();
const archivedList = computed(() =>
  (marqueurStore.marqueurs ?? []).filter(m => m.archived === true)
);

const restoreMarqueur = async (marqueur) => {
  const id = marqueur.id || marqueur._id || marqueur.properties?.id;
  if (!id) return;

  try {
    await fetch(`${API_URL}/marqueurs/${id}/restaurer`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + authStore.token
      }
    });

    // Recharge les marqueurs
    await marqueurStore.getMarqueurs();

    // 🔥 NOTIFIE le parent (AdminView) qu’il faut rafraîchir la carte
    emit("refresh");

  } catch (err) {
    console.error("Erreur restauration :", err);
  }
};

const deleteMarqueurDefinitif = async (marqueur) => {
  const id = marqueur.id || marqueur._id || marqueur.properties?.id;
  if (!id) return;

  try {
    await fetch(`${API_URL}/marqueurs/${id}/definitif`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + authStore.token
      }
    });

    await marqueurStore.getMarqueurs();
  } catch (err) {
    console.error("Erreur suppression définitive :", err);
  }
};



const props = defineProps({
  filtreStatus: { type: String, default: 'pending' },
  marqueursFiltres: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:filtreStatus',
  'ouvrir-modal',
  'accepter-marqueur',
  'refuser-marqueur',
  'show-info',
  'focus-marqueur'
])

const setFiltre = (status) => {
  emit('update:filtreStatus', status)
}

const ouvrirModalLocal = (marqueur) => {
  emit('ouvrir-modal', marqueur)
}

const accepterLocal = (marqueur) => {
  emit('accepter-marqueur', marqueur)
}

const refuserLocal = (marqueur) => {
  emit('refuser-marqueur', marqueur)
}

// --- ICI le fix complet ---
const focusMarqueur = (marqueur) => {
  // Prévention si aucune coordonnée : évite un crash et un focus inutile
  if (!marqueur?.geometry?.coordinates) {
    console.warn("❗ Impossible de centrer : ce marqueur n'a pas de coordonnées", marqueur)
    return
  }

  emit('focus-marqueur', marqueur)
}
// ---------------------------

const loadEditRequests = async () => {
  try {
    const token = authStore.token
    const data = await editRequestStore.getEditRequests(token)
    console.log('liste editRequest :', data)
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de modification :', error)
  }
}

watch(
  () => props.filtreStatus,
  (newVal) => {
    if (newVal === 'edit-request') {
      loadEditRequests()
    }
    if (newVal === "comments") {
      commentRequestStore.getPendingComments();
    }
  }
)

onMounted(() => {
  if (props.filtreStatus === 'edit-request') {
    loadEditRequests()
  }
  if (props.filtreStatus === "comments") {
    commentRequestStore.getPendingComments();
  }
})
</script>

<template>
  <div class="offers-wrapper">
    <div class="tabs-wrapper">
      <div class="tabs">
        <button :class="{ active: filtreStatus === 'pending' }" @click="setFiltre('pending')">
          Demande d'ajout
        </button>

        <button :class="{ active: filtreStatus === 'edit-request' }" @click="setFiltre('edit-request')">
          Demande de modification
        </button>
        <button :class="{ active: filtreStatus === 'comments' }" @click="setFiltre('comments')">
          Commentaires à approuver
        </button>
        <button :class="{ active: filtreStatus === 'archived' }" @click="setFiltre('archived')">
          Marqueurs archivés
        </button>
      </div>
    </div>

    <!-- TABLE DES DEMANDES D'AJOUT -->
    <table v-if="filtreStatus === 'pending'" class="offers-table" role="table" aria-label="Offres fournisseur">
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
        <tr v-for="marqueur in marqueursFiltres" :key="marqueur.id || marqueur._id" class="row-hover"
          @click="focusMarqueur(marqueur)">
          <td class="provider">{{ marqueur.properties.titre }}</td>
          <td class="address">{{ marqueur.properties.adresse }}</td>

          <td class="info-col" @click.stop>
            <button class="info-btn" @click="emit('show-info', marqueur)">
              <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.75" />
                <line x1="12" y1="10.5" x2="12" y2="17" stroke="currentColor" stroke-width="1.75" />
                <circle cx="12" cy="7.5" r="1.25" fill="currentColor" />
              </svg>
              <span>Afficher la description</span>
            </button>
          </td>

          <td class="menu-col" @click.stop>
            <button class="kebab" aria-label="Modifier" @click="ouvrirModalLocal(marqueur)">
              Modifier
            </button>
          </td>

          <td class="accept-col" @click.stop>
            <button class="action-btn accept" @click="accepterLocal(marqueur)">
              Accepter
            </button>
          </td>

          <td class="reject-col" @click.stop>
            <button class="action-btn reject" @click="refuserLocal(marqueur)">
              Refuser
            </button>
          </td>
        </tr>

        <tr v-if="!marqueursFiltres || marqueursFiltres.length === 0">
          <td colspan="6" class="empty">Aucune offre pour le moment.</td>
        </tr>
      </tbody>
    </table>

    <!-- TABLE DES DEMANDES DE MODIFICATION -->
    <table v-if="filtreStatus === 'edit-request'">
      <thead>
        <tr>
          <th>Lieu</th>
          <th>Modifications proposées</th>
          <th class="info-col">Info</th>
          <th class="accept-col">Accepter</th>
          <th class="reject-col">Refuser</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="req in editRequestStore.editRequests" :key="req._id" class="row-hover"
          @click="focusMarqueur(req.marqueur)">
          <td>
            {{ req.proposedProperties?.titre || req.marqueur?.properties?.titre }}
          </td>

          <td>
            {{ req.proposedProperties?.adresse }} <br>
            {{ req.proposedProperties?.description }}
          </td>

          <td class="info-col" @click.stop>
            <button class="info-btn">Voir détails</button>
          </td>

          <td class="accept-col" @click.stop>
            <button class="action-btn accept">Accepter</button>
          </td>

          <td class="reject-col" @click.stop>
            <button class="action-btn reject">Refuser</button>
          </td>
        </tr>

        <tr v-if="!editRequestStore.editRequests.length">
          <td colspan="5" class="empty">
            Aucune demande de modification pour le moment.
          </td>
        </tr>
      </tbody>
    </table>
    <!-- TABLE DES COMMENTAIRES À APPROUVER -->
    <table v-if="filtreStatus === 'comments'" class="offers-table">
      <thead>
        <tr>
          <th>Marqueur</th>
          <th>Commentaire</th>
          <th>Auteur</th>
          <th class="accept-col">Accepter</th>
          <th class="reject-col">Refuser</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in commentRequestStore.pendingComments" :key="item.commentId" class="row-hover"
          @click="focusMarqueur(item.marqueur)">
          <td>{{ item.marqueur?.properties?.titre }}</td>

          <td>{{ item.comment?.contenu }}</td>

          <td>{{ item.comment?.auteur }}</td>

          <td class="accept-col" @click.stop>
            <button class="action-btn accept" @click="emit('accepter-commentaire', item.marqueurId, item.commentId)">
              Accepter
            </button>

          </td>

          <td class="reject-col" @click.stop>
            <button class="action-btn reject" @click="emit('refuser-commentaire', item.marqueurId, item.commentId)">
              Refuser
            </button>

          </td>
        </tr>

        <tr v-if="!commentRequestStore.pendingComments.length">
          <td colspan="5" class="empty">
            Aucun commentaire en attente de validation.
          </td>
        </tr>
      </tbody>
    </table>
    <!-- TABLE DES MARQUEURS ARCHIVÉS -->
    <table v-if="filtreStatus === 'archived'" class="offers-table">
      <thead>
        <tr>
          <th>Titre</th>
          <th>Auteur</th>
          <th class="accept-col">Restaurer</th>
          <th class="reject-col">Supprimer définitivement</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="m in archivedList" :key="m.id" class="row-hover" @click="focusMarqueur(m)">
          <td>{{ m.properties.titre }}</td>
          <td>{{ m.properties.createdByName || 'Non spécifié' }}</td>

          <td class="accept-col" @click.stop>
            <button class="action-btn accept" @click="restoreMarqueur(m)">
              Restaurer
            </button>
          </td>

          <td class="reject-col" @click.stop>
            <button class="action-btn reject" @click="deleteMarqueurDefinitif(m)">
              Supprimer
            </button>
          </td>
        </tr>

        <tr v-if="archivedList.length === 0">
          <td colspan="4" class="empty">Aucun marqueur archivé.</td>
        </tr>
      </tbody>
    </table>

  </div>
</template>


<style scoped>
.offers-wrapper {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  overflow-x: auto;
  background: #ffffff;
  /* border: 1px solid #e5e7eb; */
  border-radius: 16px;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.06),
    0 3px 10px rgba(0, 0, 0, 0.05);
}

.offers-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  color: #111827;
  background: #ffffff;
  overflow: hidden;
}

.tabs-wrapper {
  display:flex;
  justify-content: flex-start;
  max-width: 1100px;
  margin: 0 auto -1px;
  padding-top: 5px;
  background: #d7dce2;
  position: relative;
  z-index: 10;
}

.tabs {
  display: flex;
  gap: 0;
  background: transparent;
  overflow: hidden;
}

.tabs button {
  margin: 0 auto;
  padding: 6px 20px;
  background: #d7dce2;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
  border-radius: 12px 12px 0 0; /* haut arrondi, bas droit */
  position: relative;
  transition: 0.2s;
}

/* ONGLET ACTIF */
.tabs button.active {
  background: #ffffff;
  color: #111827;
}

.tabs button.active::before,
.tabs button.active::after {
   content: "";
  position: absolute;
  left: -18px;
  bottom: 0;
  width: 36px;
  height: 36px;
  background: var(--bg);
  pointer-events: none;
}

.tabs button.active::before {
  left: -12px;
  border-bottom-right-radius: 12px;
}

.tabs button.active::after {
  right: -12px;
  border-bottom-left-radius: 12px;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 700;
  letter-spacing: 0.2px;
}

th,
td {
  padding: 14px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
  text-align: left;
}
tbody tr:last-child td {
  border-bottom: none;
}

/* zébrage + hover doux */
tbody tr:nth-child(odd) td {
  background: #fbfbfc;
}
.row-hover:hover td {
  background: #f3f6ff;
  transition: background 0.18s ease;
}

.info-col {
  width: 220px;
}
.modif-col,
.accept-col,
.reject-col {
  width: 140px;
  text-align: center;
}

.info-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font: inherit;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: var(--accent-dark);
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
  border: 1px solid #e5e7eb;
  color: #111827;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    transform 0.06s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}
.kebab:hover {
  background: #f3f6ff;
  border-color: #c7d2fe;
}
.kebab:active {
  transform: scale(0.98);
}

.action-btn {
  width: 100%;
  border: none;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 999px;
  transition:
    transform 0.06s ease,
    filter 0.18s ease,
    opacity 0.18s ease;
}
.action-btn:active {
  transform: scale(0.98);
}

.action-btn.accept {
  background: var(--accent);
  color: white; 
}
.action-btn.accept:hover {
  background: var(--accent-dark);
  /* filter: brightness(0.50); */
}

.action-btn.reject {
  background: #fff1f2;
  color: #e11d48; /* rouge doux */
}
.action-btn.reject:hover {
  filter: brightness(0.98);
}

/* états vides + bouton clear centré */
.empty {
  text-align: center;
  color: #6b7280;
  background: #fff;
}
.empty-btn {
  text-align: center;
  padding: 16px 0;
}
.clear-btn {
  background: #111827;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}
.clear-btn:hover {
  filter: brightness(1.05);
}

</style>
