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
    async function getPendingComments() {
        try {
            const headers = { "Content-Type": "application/json" };

            if (authStore.token) {
                headers.Authorization = `Bearer ${authStore.token}`;
            }

            const response = await fetch(`${API_URL}/commentaires/pending`, {
                method: "GET",
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Erreur inconnue");
            }

            pendingComments.value = data.data; // format : [{ marqueurId, marqueur, commentId, comment }]
            return pendingComments.value;

        } catch (error) {
            console.error("Erreur getPendingComments :", error);
            throw error;
        }
    }

    /* --------------------------------------------
       PATCH — APPROUVER COMMENTAIRE
    -------------------------------------------- */
    async function approuverCommentaire(marqueurId, commentId) {
        try {
            const response = await fetch(`${API_URL}/marqueurs/${marqueurId}/commentaires/${commentId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + authStore.token
                },
                body: JSON.stringify({ status: "approved" })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Erreur inconnue");
            }

            // Supprime localement
            pendingComments.value = pendingComments.value.filter(
                item => item.commentId !== commentId
            );

            // Recharge depuis la BD (fiabilité ++)
            await getPendingComments();

            return data.data;

        } catch (error) {
            console.error("Erreur approuverCommentaire :", error);
            throw error;
        }
    }

    /* --------------------------------------------
       PATCH — REJETER COMMENTAIRE
    -------------------------------------------- */
    async function refuserCommentaire(marqueurId, commentId) {
        try {
            const response = await fetch(`${API_URL}/marqueurs/${marqueurId}/commentaires/${commentId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + authStore.token
                },
                body: JSON.stringify({ status: "rejected" })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Erreur inconnue");
            }

            // Supprime localement
            pendingComments.value = pendingComments.value.filter(
                item => item.commentId !== commentId
            );

            // Recharge depuis la BD
            await getPendingComments();

            return data.data;

        } catch (error) {
            console.error("Erreur refuserCommentaire :", error);
            throw error;
        }
    }

    return {
        pendingComments,
        getPendingComments,
        approuverCommentaire,
        refuserCommentaire
    };

}, {
    persist: false
});
