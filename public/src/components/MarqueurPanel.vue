<script setup>
import { ref } from 'vue';
import { useMarqueurStore } from '../stores/useMarqueur';

// props and emits
const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    
});
const marqueurStore = useMarqueurStore();
</script>
<template>

</template>
<style scoped>
</style>