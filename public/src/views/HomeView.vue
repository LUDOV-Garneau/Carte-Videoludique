<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import NavBar from '../components/NavBar.vue';
</script>

<template>
  <NavBar/>
  <div class="layout">
    <main class="content"> 
      <section class="map-wrapper">
        <LeafletMap /> 
      </section>      
    </main>
  </div>
</template>

<style scoped>



/* Layout général avec fond subtil “grid” + dégradé */
.layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  isolation: isolate;
}

/* Zone de contenu */
.content{
  flex: 1;
  padding: 28px clamp(16px, 3vw, 40px);
  margin: 0;
}



/* Carte avec cadre premium */
.map-wrapper{
  position: relative;
  margin: 18px auto 0;
  width: 100%;
  max-width: 1200px;
  height: min(78vh, 900px);
  border-radius: 20px;
  overflow: clip;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 40px rgba(0,0,0,.08), 0 6px 14px rgba(0,0,0,.06);
}
.map-wrapper:focus-within{
  outline: 3px solid color-mix(in srgb, var(--accent) 35%, transparent);
  outline-offset: 2px;
}

/* Petits bonus d’accessibilité */
:focus-visible{
  outline: 3px solid color-mix(in srgb, var(--accent) 45%, transparent);
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 900px){
  .sidebar{ width: 72px; }
  .brand-vertical{ font-size: 1.05rem; letter-spacing: .16rem; }
  .page-header{ padding: 16px 18px; }
  .map-wrapper{ height: 70vh; }
}

@media (max-width: 640px){
  .sidebar{ display: none; }
  .content{ padding: 18px 14px; }
  .page-header{ margin-bottom: 12px; }
  .map-wrapper{ height: 63vh; }
}
</style>