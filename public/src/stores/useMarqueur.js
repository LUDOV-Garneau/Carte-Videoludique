import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config.js'

export const useMarqueursStore = defineStore('marqueurs', () => {
    const marqueurs = ref([])
    const marqueurActif = ref(null)

    function ajouterMarqueur(payload){
        return fetch(`${API_URL}/marqueurs`, {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json" 
            },
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
        .then((response) => {
            if(response.status === 200){
                return response.json()
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
        })
        .then(data => {
            marqueurActif.value = data
            console.log(data)
            return data
        })
        .catch(error => {
            throw error
        })

    }

    return {
        marqueurs,
        ajouterMarqueur,
        getMarqueurs,
        getMarqueur
    }

}, {
    persist: true
})