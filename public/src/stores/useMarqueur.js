import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config.js'
import { useAuthStore } from './auth.js'

export const useMarqueurStore = defineStore('marqueurs', () => {

    const marqueurs = ref([])
    const archives = ref([])
    const marqueurActif = ref(null)
    const authStore = useAuthStore()

    function authHeaders() {
        const headers = { "Content-Type": "application/json" }
        if (authStore.isAuthenticated && authStore.token) {
            headers.Authorization = `Bearer ${authStore.token}`
        }
        return headers
    }

    /* --------------------------------------------
       AJOUTER UN MARQUEUR
    -------------------------------------------- */
    async function ajouterMarqueur(payload) {
        const response = await fetch(`${API_URL}/marqueurs`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })

        const data = await response.json()
        if (response.status !== 201) throw new Error(data.message)

        const mapped = { ...data.data, id: data.data._id }
        marqueurs.value.push(mapped)
        return mapped
    }

    /* --------------------------------------------
       GET MARQUEURS NON ARCHIVÉS
    -------------------------------------------- */
    async function getMarqueurs() {
        const response = await fetch(`${API_URL}/marqueurs`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message)

        marqueurs.value = data.data
            .filter(m => !m.archived) // ✅ CORRIGÉ
            .map(m => ({ ...m, id: m._id }))

        return marqueurs.value
    }

    /* --------------------------------------------
       ✅ GET UN SEUL MARQUEUR
    -------------------------------------------- */
    async function getMarqueur(id) {
        const response = await fetch(`${API_URL}/marqueurs/${id}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message)

        marqueurActif.value = { ...data.data, id: data.data._id }
        return marqueurActif.value
    }

    /* --------------------------------------------
       GET ARCHIVES
    -------------------------------------------- */
    async function getArchived() {
        const response = await fetch(`${API_URL}/marqueurs/archives`, {
            method: 'GET',
            headers: authHeaders()
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message)

        archives.value = data.data.map(m => ({ ...m, id: m._id }))
        return archives.value
    }

    /* --------------------------------------------
       ARCHIVER MARQUEUR
    -------------------------------------------- */
    async function archiveMarqueur(id) {
        const response = await fetch(`${API_URL}/marqueurs/${id}/archive`, {
            method: 'PUT',
            headers: authHeaders()
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message)

        marqueurs.value = marqueurs.value.filter(m => m.id !== id)
        return data.data
    }

    /* --------------------------------------------
       RESTAURER MARQUEUR
    -------------------------------------------- */
    async function restore(id) {
        const response = await fetch(`${API_URL}/marqueurs/${id}/restore`, {
            method: 'PUT',
            headers: authHeaders()
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message)

        archives.value = archives.value.filter(m => m.id !== id)
        marqueurs.value.push({ ...data.data, id: data.data._id })
        return data.data
    }

    /* --------------------------------------------
       SUPPRESSION DÉFINITIVE
    -------------------------------------------- */
    async function deletePermanently(id) {
        const response = await fetch(`${API_URL}/marqueurs/${id}/permanent`, {
            method: 'DELETE',
            headers: authHeaders()
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message)

        archives.value = archives.value.filter(m => m.id !== id)
        return data
    }

    /* --------------------------------------------
   SUPPRIMER (refuser) un marqueur NON archivé
-------------------------------------------- */
async function supprimerMarqueur(id, token) {
    const response = await fetch(`${API_URL}/marqueurs/${id}`, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    // Retirer du tableau local
    marqueurs.value = marqueurs.value.filter(m =>
        (m.id || m._id || m.properties?.id) !== id
    );

    return data;
}


    return {
        marqueurs,
        archives,
        marqueurActif,
        ajouterMarqueur,
        getMarqueurs,
        getMarqueur,
        getArchived,
        archiveMarqueur,
        restore,
        deletePermanently,
        supprimerMarqueur
    }

}, { persist: true })
