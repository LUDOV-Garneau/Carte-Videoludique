import { defineStore } from "pinia";
import { ref } from "vue";
import { API_URL } from "@/config.js";
import { useAuthStore } from "./auth.js";

export const useCommentRequestStore = defineStore("commentRequests", () => {

    const pendingComments = ref([]);
    const authStore = useAuthStore();

    /* --------------------------------------------
       GET — COMMENTAIRES EN ATTENTE
    -------------------------------------------- */
    function getPendingComments() {

        const headers = { "Content-Type": "application/json" };

        if (authStore.isAuthenticated && authStore.token) {
            headers.Authorization = `Bearer ${authStore.token}`;
        }

        return fetch(`${API_URL}/commentaires/pending`, {
            method: "GET",
            headers: headers
        })
        .then(async (response) => {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur inconnue");
            }

            // Format attendu : {marqueurId, marqueur, commentId, comment}
            pendingComments.value = data.data;
            return pendingComments.value;
        })
        .catch((error) => {
            console.error("Erreur getPendingComments :", error);
            throw error;
        });
    }

    /* --------------------------------------------
       PATCH — APPROUVER COMMENTAIRE
    -------------------------------------------- */
    function approuverCommentaire(marqueurId, commentId) {

        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + authStore.token
        };

        return fetch(`${API_URL}/marqueurs/${marqueurId}/commentaires/${commentId}/status`, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify({ status: "approved" })
        })
        .then(async (response) => {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur inconnue");
            }

            // 🔥 supprimer localement le commentaire approuvé
            pendingComments.value = pendingComments.value.filter(
                (item) => item.commentId !== commentId
            );

            return data.data;
        })
        .catch((error) => {
            console.error("Erreur approuverCommentaire :", error);
            throw error;
        });
    }

    /* --------------------------------------------
       PATCH — REJETER COMMENTAIRE
    -------------------------------------------- */
    function refuserCommentaire(marqueurId, commentId) {

        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + authStore.token
        };

        return fetch(`${API_URL}/marqueurs/${marqueurId}/commentaires/${commentId}/status`, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify({ status: "rejected" })
        })
        .then(async (response) => {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur inconnue");
            }

            pendingComments.value = pendingComments.value.filter(
                (item) => item.commentId !== commentId
            );

            return data.data;
        })
        .catch((error) => {
            console.error("Erreur refuserCommentaire :", error);
            throw error;
        });
    }

    return {
        pendingComments,
        getPendingComments,
        approuverCommentaire,
        refuserCommentaire
    };

}, {
    persist: true
});
