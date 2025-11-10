import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config.js'
import { useAuthStore } from './useAuth.js'


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
        .then(async (response) => {
            if(response.ok) {
                return response.json();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur inconnue');
            }
        })
        .then((result) => {
            // MAJ locale optionnelle si tu as un "marqueurActif"
            if (marqueurActif.value) {
                marqueurActif.value.properties.titre = result.data.titre;
                marqueurActif.value.properties.type = result.data.type;
                marqueurActif.value.properties.adresse = result.data.adresse;
                marqueurActif.value.properties.description = result.data.description;
                marqueurActif.value.properties.temoignage = result.data.temoignage;
                marqueurActif.value.properties.image = result.data.image;
                return result.data;
            }
            return result; // 👈 pour que le composant puisse lire res.status / res.body
        })
        .catch(error => {
            throw error
        })
    }
    function modifierMarqueurStatus(marqueurId, token, status){
        return fetch(`${API_URL}/marqueurs/${marqueurId}/status`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
             body: JSON.stringify(status)
        })
        .then((response) => {
            return response.json().then((data) => {
                if (!response.ok) {
                    throw new Error(data.message || 'Erreur inconnue');
                }
                return data;
            });
        })
        .then((data) => {
            const updated = data.data;
            const newStatus = updated?.properties?.status;

            if (marqueurActif.value && newStatus) {
                marqueurActif.value.properties.status = newStatus;
            }

            return updated;
        })
        .catch((error) => {
            console.error('Erreur lors de la mise à jour du marqueur :', error.message);
            throw error;
        });
    }

    return {
        marqueurs,
        marqueurActif,
        ajouterMarqueur,
        getMarqueurs,
        getMarqueur,
        modifierMarqueur,
        modifierMarqueurStatus
    }

}, {
    persist: true
})
