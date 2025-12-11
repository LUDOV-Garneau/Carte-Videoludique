import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '@/config'
import { useAuthStore } from './auth'
import { useMarqueurStore } from './useMarqueur'

export const useCommentRequestStore = defineStore('commentRequestStore', () => {
  const pendingComments = ref([])
  const archivedComments = ref([])
  const authStore = useAuthStore()

  async function getPendingComments() {
    const headers = { 'Content-Type': 'application/json' }
    if (authStore.token) headers.Authorization = 'Bearer ' + authStore.token

    const res = await fetch(`${API_URL}/commentaires/pending`, { headers })
    const json = await res.json()

    pendingComments.value = json.data
    return pendingComments.value
  }

  async function accepter(idMarqueur, idCommentaire) {
    await fetch(`${API_URL}/marqueurs/${idMarqueur}/commentaires/${idCommentaire}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + authStore.token,
      },
      body: JSON.stringify({ status: 'approved' }),
    })

    pendingComments.value = pendingComments.value.filter((c) => c.commentId !== idCommentaire)
  }

  async function refuser(idMarqueur, idCommentaire) {
    await fetch(`${API_URL}/marqueurs/${idMarqueur}/commentaires/${idCommentaire}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + authStore.token,
      },
      body: JSON.stringify({ status: 'rejected' }),
    })

    pendingComments.value = pendingComments.value.filter((c) => c.commentId !== idCommentaire)
  }

  /* -----------------------
       ⭐ COMMENTAIRES ARCHIVÉS
    ------------------------ */
  async function getArchivedComments() {
    const headers = { 'Content-Type': 'application/json' }
    if (authStore.token) headers.Authorization = 'Bearer ' + authStore.token

    const res = await fetch(`${API_URL}/commentaires-archives`, { headers })
    const json = await res.json()

    archivedComments.value = json.data
    return archivedComments.value
  }

 async function restore(marqueurId, commentId) {
  await fetch(`${API_URL}/marqueurs/${marqueurId}/commentaires/${commentId}/restaurer`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + authStore.token,
    },
  });

  const marqueurStore = useMarqueurStore();
  await marqueurStore.getMarqueurs();   // 🔥 pas getMarqueur !

  archivedComments.value =
    archivedComments.value.filter(c => c.commentId !== commentId);
}

  async function deletePermanent(marqueurId, commentId) {
    await fetch(`${API_URL}/marqueurs/${marqueurId}/commentaires/${commentId}/definitif`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + authStore.token,
      },
    })

    archivedComments.value = archivedComments.value.filter((c) => c.commentId !== commentId)
  }

  return {
    pendingComments,
    getPendingComments,
    accepter,
    refuser,
    // archived
    archivedComments,
    getArchivedComments,
    restore,
    deletePermanent,
  }
})
