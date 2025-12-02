import { defineStore } from "pinia";
import { ref } from "vue";
import { API_URL } from "@/config";
import { useAuthStore } from "./auth";

export const useCommentRequestStore = defineStore("commentRequestStore", () => {

    const pendingComments = ref([]);
    const authStore = useAuthStore();

    async function getPendingComments() {
        const headers = { "Content-Type": "application/json" };
        if (authStore.token) headers.Authorization = "Bearer " + authStore.token;

        const res = await fetch(`${API_URL}/commentaires/pending`, { headers });
        const json = await res.json();

        pendingComments.value = json.data;
        return pendingComments.value;
    }

    async function accepter(idMarqueur, idCommentaire) {
        await fetch(`${API_URL}/marqueurs/${idMarqueur}/commentaires/${idCommentaire}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + authStore.token
            },
            body: JSON.stringify({ status: "approved" })
        });

        pendingComments.value = pendingComments.value.filter(c => c.commentId !== idCommentaire);
    }

    async function refuser(idMarqueur, idCommentaire) {
        await fetch(`${API_URL}/marqueurs/${idMarqueur}/commentaires/${idCommentaire}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + authStore.token
            },
            body: JSON.stringify({ status: "rejected" })
        });

        pendingComments.value = pendingComments.value.filter(c => c.commentId !== idCommentaire);
    }

    return {
        pendingComments,
        getPendingComments,
        accepter,
        refuser
    };
});
