import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMarqueursStore = defineStore('marqueurs', () => {
    const apiUrl = 'https://carte-videoludique.vercel.app'
    const marqueurs = ref([])

    function ajouterMarqueur(payload){
        return fetch(`${apiUrl}/marqueurs`, {
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
        return fetch(`${apiUrl}/marqueurs`, {
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

    return {
        marqueurs,
        ajouterMarqueur,
        getMarqueurs
    }

}, {
    persist: true
})