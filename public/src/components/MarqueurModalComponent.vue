<script setup>
import { defineProps, defineEmits, ref , watch} from 'vue';

const props = defineProps({
    marqueur: {
        type: Object,
        required: true
    }
});
const emit = defineEmits(['fermer', 'valider']);

const titre = ref(props.marqueur.properties.titre || '');
const type = ref(props.marqueur.properties.type || '');
const adresse = ref(props.marqueur.properties.adresse || '');
const description = ref(props.marqueur.properties.description || '');
const temoignage = ref(props.marqueur.properties.temoignage || '');
const image = ref(props.marqueur.properties.image || '');

const titreValidation = ref(false);
const typeValidation = ref(false);
const adresseValidation = ref(false);
const descriptionValidation = ref(false);

const titreMessage = ref('');
const typeMessage = ref('');
const adresseMessage = ref('');
const descriptionMessage = ref('');

const valider = () => {
    if(!titre.value.trim()){
        titreValidation.value = true;
        titreMessage.value = 'Le titre est obligatoire.';
        return;
    }
    if(!type.value.trim()){
        typeValidation.value = true;
        typeMessage.value = 'Le type est obligatoire.';
        return;
    }
    if(!adresse.value.trim()){
        adresseValidation.value = true;
        adresseMessage.value = 'L\'adresse est obligatoire.';
        return;
    }
    if(!description.value.trim()){
        descriptionValidation.value = true;
        descriptionMessage.value = 'La description est obligatoire.';
        return;
    }
    emit('valider', {
        ...props.marqueur,
        properties: {
            titre: titre.value,
            type: type.value,
            adresse: adresse.value,
            description: description.value,
            temoignage: temoignage.value,
            image: image.value
        }
    });
}


watch(() => props.marqueur, (newMarqueur) => {
    titre.value = newMarqueur.properties.titre || '';
    type.value = newMarqueur.properties.type || '';
    adresse.value = newMarqueur.properties.adresse || '';
    description.value = newMarqueur.properties.description || '';
    temoignage.value = newMarqueur.properties.temoignage || '';
    image.value = newMarqueur.properties.image || '';
},
{immediate: true});
</script>

<template>
    <div class="overlay" @click.self="emit('fermer')">
        <div class="modal">
            <h2>Modifier le marqueur</h2>
            <form @submit.prevent="valider">
                <div class="form-control" :class="{invalid: titreValidation}">
                    <input 
                        id="titreMarqueur"
                        name="titreMarqueur"
                        type="text" 
                        v-model.trim="titre" 
                        placeholder="Titre du marqueur" 
                        @input="titreValidation = false"
                    />
                    <p class="error-message" v-if="titreValidation">{{ titreMessage }}</p>
                </div>
                <div class="form-control" :class="{invalid: typeValidation}">
                    <input 
                        id="typeMarqueur"
                        name="typeMarqueur"
                        type="text" 
                        v-model.trim="type" 
                        placeholder="Type du marqueur" 
                        @input="typeValidation = false"
                    />
                    <p class="error-message" v-if="typeValidation">{{ typeMessage }}</p>
                </div>
                <div class="form-control" :class="{invalid: adresseValidation}">
                    <input 
                        id="adresseMarqueur"
                        name="adresseMarqueur"
                        type="text" 
                        v-model.trim="adresse" 
                        placeholder="Adresse du marqueur" 
                        @input="adresseValidation = false"
                    />
                    <p class="error-message" v-if="adresseValidation">{{ adresseMessage }}</p>
                </div>
                <div class="form-control" :class="{invalid: descriptionValidation}">
                    <textarea 
                        id="descriptionMarqueur"
                        name="descriptionMarqueur"
                        v-model.trim="description" 
                        placeholder="Description du marqueur" 
                        @input="descriptionValidation = false"
                    ></textarea>
                    <p class="error-message" v-if="descriptionValidation">{{ descriptionMessage }}</p>
                </div>
                <div class="form-control">
                    <textarea 
                        id="temoignageMarqueur"
                        name="temoignageMarqueur"
                        v-model.trim="temoignage" 
                        placeholder="Témoignage (optionnel)" 
                    ></textarea>
                </div>
                <div class="form-control">
                    <input 
                        id="imageMarqueur"
                        name="imageMarqueur"
                        type="text" 
                        v-model.trim="image" 
                        placeholder="URL de l'image (optionnel)" 
                    />
                </div>
                <div class="form-actions">
                    <button type="button" @click="emit('fermer')">Annuler</button>
                    <button type="submit">Valider</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.overlay{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 400px;
}
form {
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
}
.form-control {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
input, textarea {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  outline: none;
  transition: border 0.3s;
}
input:focus {
  border-color: #007bff;
}
.form-control.invalid input {
  border-color: #e74c3c;
  background-color: #fff5f5;
}
.err-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>