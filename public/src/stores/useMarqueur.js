import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config.js'
import { useAuthStore } from '../stores/auth'


export const useMarqueursStore = defineStore('marqueurs', () => {
    const marqueurs = ref([]);
    const marqueurActif = ref(null);
    const authStore = useAuthStore();

    function ajouterMarqueur(payload){
        // Construire les headers de base
        const headers = {
            "Content-Type": "application/json"
        };

        // Ajouter l'Authorization si l'admin est connecté
        if (authStore.isAuthenticated && authStore.token) {
            headers.Authorization = `Bearer ${authStore.token}`;
        }

        return fetch(`${API_URL}/marqueurs`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        })
        .then(async (response) => {
            if(response.status === 201){
                return response.json()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Erreur inconnue')
            }
        })
        .then(data => {
            marqueurs.value.push(data.data)
            return data.data
        })
        .catch(error => {
            console.error('Erreur ajout marqueur:', error)
            throw error
        })
    }

    function getMarqueurs(){
        return fetch(`${API_URL}/marqueurs`, {
            method: 'GET',
            headers: { 
                "Content-Type": "application/json" 
            }
        })
        .then(async (response) => {
            if(response.status === 200){
                return response.json()
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur inconnue');
            }
        })
        .then(data => {
            marqueurs.value = data.data
            return marqueurs
        })
        .catch(error => {
            throw error
        })
    }

    function getMarqueur(marqueurId) {
        return fetch(`${API_URL}/marqueurs/${marqueurId}`, {
            method: 'GET',
            headers: { 
                "Content-Type": "application/json" 
            }
        })
        .then(async (response) => {
            if(response.ok)
                return response.json()
            else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur inconnue');
            }
        })
        .then(data => {
            marqueurActif.value = data.data
            console.log(marqueurActif)
            return marqueurActif
        })
        .catch(error => {
            throw error
        })
    }
    function modifierMarqueur(marqueurId, token, payload){
            return fetch(`${API_URL}/marqueurs/${marqueurId}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            })
            .then( async (response) => {
                let body = null
                try { body = await response.json() } catch { body = null }

                if (response.ok) {
                    return { status: response.status, body } // 👈 renvoie le code HTTP
                } else {
                    const errorMessage = body?.message || 'Erreur inconnue'
                    throw new Error(`${response.status} - ${errorMessage}`)
                }
            })
            .then((result) => {
                // Normaliser le statut renvoyé (supporte 200 JSON et 204 No Content)
                const serverStatus = result.body?.data?.status
                                  ?? result.body?.status
                                  ?? payload?.status
                                  ?? null;

                // MAJ locale optionnelle si tu as un "marqueurActif"
                if (marqueurActif.value && serverStatus) {
                  marqueurActif.value.properties.status = serverStatus;
                }
            
                return result; // 👈 pour que le composant puisse lire res.status / res.body
            })
            .catch(error => {
                throw error
            })
        }

    return {
        marqueurs,
        ajouterMarqueur,
        getMarqueurs,
        getMarqueur,
        modifierMarqueur,
    }

}, {
    persist: true
})