import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config.js'
import { useAuthStore } from './auth.js'

export const useMarqueurStore = defineStore('marqueurs', () => {

    const marqueurs = ref([])
    const marqueurActif = ref(null)
    const authStore = useAuthStore()

    /* --------------------------------------------
       AJOUTER UN MARQUEUR
    -------------------------------------------- */
    function ajouterMarqueur(payload) {

        const headers = { "Content-Type": "application/json" }

        if (authStore.isAuthenticated && authStore.token) {
            headers.Authorization = `Bearer ${authStore.token}`
        }

        return fetch(`${API_URL}/marqueurs`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        })
        .then(async (response) => {
            const data = await response.json()

            if (response.status !== 201) {
                throw new Error(data.message || 'Erreur inconnue')
            }

            const mapped = {
                ...data.data,
                id: data.data._id
            }

            marqueurs.value.push(mapped)
            return mapped
        })
        .catch((error) => {
            console.error('Erreur ajout marqueur:', error)
            throw error
        })
    }

    /* --------------------------------------------
       GET TOUS LES MARQUEURS
    -------------------------------------------- */
    function getMarqueurs() {
        return fetch(`${API_URL}/marqueurs`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(async (response) => {
            const data = await response.json()

            if (response.status !== 200) {
                throw new Error(data.message || 'Erreur inconnue')
            }

            marqueurs.value = data.data.map(m => ({
                ...m,
                id: m._id
            }))

            return marqueurs.value
        })
        .catch((error) => {
            console.error("Erreur getMarqueurs:", error)
            throw error
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

            if (!response.ok) {
                throw new Error(data.message || 'Erreur inconnue')
            }

            marqueurActif.value = {
                ...data.data,
                id: data.data._id
            }

            return marqueurActif.value
        })
        .catch((error) => {
            console.error("Erreur getMarqueur:", error)
            throw error
        })
    }

    /* --------------------------------------------
       MODIFIER MARQUEUR COMPLET
    -------------------------------------------- */
    function modifierMarqueur(marqueurId, token, payload) {
        return fetch(`${API_URL}/marqueurs/${marqueurId}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(payload)
        })
        .then(async (response) => {
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Erreur inconnue')
            }

            if (marqueurActif.value) {
                Object.assign(marqueurActif.value.properties, data.data)
            }

            return data.data
        })
        .catch((error) => {
            console.error("Erreur modifierMarqueur:", error)
            throw error
        })
    }

    /* --------------------------------------------
       MODIFIER STATUT (APPROUVE / REJETÉ)
    -------------------------------------------- */
    function modifierMarqueurStatus(marqueurId, token, status) {

        return fetch(`${API_URL}/marqueurs/${marqueurId}/status`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(status)
        })
        .then(async (response) => {
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Erreur inconnue')
            }

            // 🔥 Cas SUPPRESSION locale
            if (data.message?.includes("supprim")) {
                marqueurs.value = marqueurs.value.filter(m => m.id !== marqueurId)
                return null
            }

            // 🔥 Mise à jour normale
            const updated = {
                ...data.data,
                id: data.data._id
            }

            const index = marqueurs.value.findIndex(m => m.id === marqueurId)
            if (index !== -1) marqueurs.value[index] = updated

            if (marqueurActif.value?.id === marqueurId) {
                marqueurActif.value.properties.status = updated.properties.status
            }

            return updated
        })
        .catch((error) => {
            console.error("Erreur modifierMarqueurStatus:", error)
            throw error
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

            if (!response.ok) {
                throw new Error(data.message || 'Erreur inconnue')
            }

            // 🔥 supprimer localement (IMPORTANT)
            marqueurs.value = marqueurs.value.filter(m => m.id !== id)

            return data
        })
    }

    return {
        marqueurs,
        marqueurActif,
        ajouterMarqueur,
        getMarqueurs,
        getMarqueur,
        modifierMarqueur,
        modifierMarqueurStatus,
        supprimerMarqueur
    }

}, {
    persist: true
})
