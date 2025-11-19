import { defineStore } from 'pinia';
import { ref } from 'vue';
import { API_URL } from '../config.js';


export const useEditRequestStore = defineStore('editRequest', () => {
    const editRequests = ref([]);

    function createEditRequest(marqueurId, payload){
        return fetch(`${API_URL}/marqueurs/${marqueurId}/edit-requests`, {
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
            editRequests.value.push(data.data)
            return data.data
        })
        .catch(error => {
            console.error('Erreur création demande de modification:', error)
            throw error
        })
    }

    function getEditRequests(token){
        return fetch(`${API_URL}/edit-requests`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
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
            editRequests.value = data.data;
            return data.data;
        })
        .catch(error => {
            console.error('Erreur récupération demandes de modification:', error);
            throw error;
        });
    }

    function getEditRequest(requestId, token){
        return fetch(`${API_URL}/edit-requests/${requestId}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
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
            return data.data;
        })
        .catch(error => {
            console.error('Erreur récupération demande de modification:', error);
            throw error;
        });
    }


    function approveEditRequest(requestId, token, payload){
        return fetch(`${API_URL}/edit-requests/${requestId}/approve`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(payload),
        })
        .then(async (response) => {
            if(response.ok) {
                return response.json();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur inconnue');
            }
        })
        .then((data) => {
            // Met à jour la liste locale des demandes de modification
            const index = editRequests.value.findIndex(req => req._id === requestId);
            if (index !== -1) {
                editRequests.value[index] = data.data;
            }
            return data.data;
        })
        .catch(error => {
            console.error('Erreur approbation demande de modification:', error);
            throw error;
        });

    }

    function rejectEditRequest(requestId, token){
        return fetch(`${API_URL}/edit-requests/${requestId}/reject`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })
        .then(async (response) => {
            if(response.ok) {
                return response.json();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur inconnue');
            }
        })
        .then((data) => {
            const index = editRequests.value.findIndex(req => req._id === requestId);
            if (index !== -1) {
                editRequests.value[index] = data.data;
            }
            return data.data;
        })
        .catch(error => {
            console.error('Erreur rejet demande de modification:', error);
            throw error;
        });
    }

    return {
        editRequests,
        createEditRequest,
        getEditRequests,
        getEditRequest,
        approveEditRequest,
        rejectEditRequest
    }
});