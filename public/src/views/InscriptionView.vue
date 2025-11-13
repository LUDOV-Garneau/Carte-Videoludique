<template>
  <div class="container mt-5">
    <h2>Créer un compte</h2>
    <form @submit.prevent="soumettreFormulaire" novalidate>
      <div class="mb-3">
        <label for="nom" class="form-label">Nom</label>
        <input v-model="nom" type="text" class="form-control" id="nom" required/>
        <div v-if="erreurs.nom" class="text-danger">{{ erreurs.nom }}</div>
      </div>
      <div class="mb-3">
        <label for="prenom" class="form-label">Prénom</label>
        <input v-model="prenom" type="text" class="form-control" id="prenom" required/>
        <div v-if="erreurs.prenom" class="text-danger">{{ erreurs.prenom }}</div>
      </div>

      <div class="mb-3">
        <label for="email" class="form-label">Courriel</label>
        <input v-model="email" type="email" class="form-control" id="email" required/>
        <div v-if="erreurs.email" class="text-danger">{{ erreurs.email }}</div>
      </div>

      <div class="mb-3">
        <label for="motdepasse" class="form-label">Mot de passe</label>
        <input v-model="motdepasse" type="password" class="form-control" id="motdepasse" required/>
        <div v-if="erreurs.motdepasse" class="text-danger">{{ erreurs.motdepasse }}</div>
      </div>

      <div class="mb-3">
        <label for="confirmation" class="form-label">Confirmation du mot de passe</label>
        <input v-model="confirmation" type="password" class="form-control" id="confirmation" required />
        <div v-if="erreurs.confirmation" class="text-danger">{{ erreurs.confirmation }}</div>
      </div>

      <button type="submit" class="btn btn-primary">S'inscrire</button>
      <div v-if="erreurServeur" class="mt-3 text-danger">{{ erreurServeur }}</div>

      <div
        v-if="messageSucces"
        class="alert alert-success mt-3"
        role="alert"
      >
        {{ messageSucces }}
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_URL } from '@/config'
import { useAuthStore } from '@/stores/auth'

const nom = ref('')
const prenom = ref('')
const email = ref('')
const motdepasse = ref('')
const confirmation = ref('')

const erreurs = ref({})
const erreurServeur = ref('')
const messageSucces = ref('')
const router = useRouter()

const soumettreFormulaire = async () => {
  erreurs.value = {}

  // Validation côté client
    //Validation du nom
  if (!nom.value) erreurs.value.nom = 'Le nom est requis.';
  else if (nom.value.length > 50) erreurs.value.nom  = 'Le nom ne peut pas dépasser 50 caractères';

    //Validation du prénom
  if (!prenom.value) erreurs.value.prenom = 'Le prénom est requis.';
  else if (prenom.value.length > 50) erreurs.value.prenom  = 'Le prénom ne peut pas dépasser 50 caractères';

  //Validation du courriel
  if (!email.value) erreurs.value.email = 'Le courriel est requis.';
  else if (!/\S+@\S+\.\S+/.test(email.value)) erreurs.value.email = 'Courriel invalide.';

  //Validation du mot de passe
  if (!motdepasse.value) erreurs.value.motdepasse = 'Mot de passe requis.';
  else if (motdepasse.value.length < 6) erreurs.value.motdepasse  = 'Le mot de passe doit contenir au moins 6 caractères';


  //Validation de la confirmation du mot de passe
  if (!confirmation.value) erreurs.value.confirmation = 'Une confirmation de mot de passe est requise.';
  else if (motdepasse.value !== confirmation.value) erreurs.value.confirmation = 'Les mots de passe ne correspondent pas.'

  // Si des erreurs de validation
  if (Object.keys(erreurs.value).length > 0) return

  // Envoi à l'API
  try {
    const res = await fetch(API_URL+`/signup`, {
      method: 'POST',
      headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${useAuthStore().token}`
  },
      body: JSON.stringify({
        nom: nom.value,
        prenom: prenom.value,
        courriel: email.value,
        mdp: motdepasse.value,
        mdp2:confirmation.value
      })
    })

    const data = await res.json()

    if (!res.ok) {
      erreurServeur.value = data.message || 'Erreur serveur'
      return
    }
    // Affichage du méssage de succès → afficher notif + redirection après délai
    messageSucces.value = 'Compte créé avec succès ! Redirection en cours...'

    setTimeout(() => {
      router.push('/connexion')
    }, 2000)

  } catch (err) {
    erreurServeur.value = 'Erreur de connexion au serveur'
  }
}
</script>

