import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config.js'
import { useAuthStore } from './auth.js'

export const useMarqueurStore = defineStore('marqueurs', () => {

    const marqueurs = ref([])
    const archives = ref([])       // ⭐ AJOUT
    const marqueurActif = ref(null)
    const authStore = useAuthStore()

    function authHeaders() {
      const h = { "Content-Type": "application/json" }
      if (authStore.isAuthenticated && authStore.token) {
        h.Authorization = `Bearer ${authStore.token}`
      }
      return h
    }

    /* --------------------------------------------
       AJOUTER UN MARQUEUR
    -------------------------------------------- */
    function ajouterMarqueur(payload) {
        return fetch(`${API_URL}/marqueurs`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
        .then(async (response) => {
            const data = await response.json()

            if (response.status !== 201)
                throw new Error(data.message || 'Erreur inconnue')

            const mapped = { ...data.data, id: data.data._id }
            marqueurs.value.push(mapped)
            return mapped
        })
    }

    /* --------------------------------------------
       GET MARQUEURS (NON ARCHIVÉS)
    -------------------------------------------- */
    function getMarqueurs() {
        return fetch(`${API_URL}/marqueurs`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(async (response) => {
            const data = await response.json()

            if (response.status !== 200)
                throw new Error(data.message || 'Erreur inconnue')

            // ⭐ On ignore les marqueurs archivés
            marqueurs.value = data.data
                .filter(m => !m.archived)
                .map(m => ({ ...m, id: m._id }))

            return marqueurs.value
        })
    }

    /* --------------------------------------------
       GET ARCHIVES
    -------------------------------------------- */
    function getArchived() {
        return fetch(`${API_URL}/marqueurs/archives`, {
            method: 'GET',
            headers: authHeaders()
        })
        .then(async (response) => {
            const data = await response.json()

            if (!response.ok)
                throw new Error(data.message || "Erreur dans getArchived()")

            archives.value = data.data.map(m => ({
                ...m,
                id: m._id
            }))

            return archives.value
        })
    }

    /* --------------------------------------------
       ARCHIVER UN MARQUEUR
    -------------------------------------------- */
    function archiveMarqueur(id) {
        return fetch(`${API_URL}/marqueurs/${id}/archive`, {
            method: 'PUT',
            headers: authHeaders()
        })
        .then(async (response) => {
            const data = await response.json()

            if (!response.ok)
                throw new Error(data.message || "Erreur archiveMarqueur")

            // 🔥 Retirer du tableau principal
            marqueurs.value = marqueurs.value.filter(m => m.id !== id)

            // 🔥 Ajouter dans les archives
            archives.value.push({ ...data.data, id: data.data._id })

            return data.data
        })
    }

    /* --------------------------------------------
       GET UN SEUL MARQUEUR
    -------------------------------------------- */
    function getMarqueur(marqueurId) {
        return fetch(`${API_URL}/marqueurs/${marqueurId}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(async (response) => {
            const data = await response.json()

            if (!response.ok)
                throw new Error(data.message || 'Erreur inconnue')

            marqueurActif.value = { ...data.data, id: data.data._id }
            return marqueurActif.value
        })
    }

    /* --------------------------------------------
       SUPPRIMER UN MARQUEUR
    -------------------------------------------- */
    function supprimerMarqueur(id, token) {
        return fetch(`${API_URL}/marqueurs/${id}`, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })
        .then(async (response) => {
            const data = await response.json()

            if (!response.ok)
                throw new Error(data.message || 'Erreur inconnue')

            marqueurs.value = marqueurs.value.filter(m => m.id !== id)
            return data
        })
    }

    return {
        marqueurs,
        archives,          // ⭐ retour ajouté
        marqueurActif,

        ajouterMarqueur,
        getMarqueurs,
        getMarqueur,

        getArchived,       // ⭐ retour ajouté
        archiveMarqueur,   // ⭐ retour ajouté

        supprimerMarqueur
    }

}, { persist: true })
