<script setup>
import LeafletMap from '../components/LeafletMap.vue'
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <span class="brand-vertical">L U D O V</span>
    </aside>
  
    <main class="content">   
      <header class="page-header">
        <h1>Le jeu vidéo au Québec</h1>
        <p class="subtitle">
          Cette carte vise à répertorier les lieux où le jeu vidéo s’est vendu, joué,
          échangé et créé au fil de son histoire au Québec.
        </p>
      </header>     
      <section class="map-wrapper">
        <LeafletMap /> 
      </section>      
    </main>
  </div>
</template>

<style scoped>

/* Reset local couleurs (évite les noirs durs) */
h1, h2, p, table { color: var(--text); }

/* Layout général avec fond subtil “grid” + dégradé */
.layout{
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% -10%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 40%),
    radial-gradient(circle at 120% 10%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 45%),
    linear-gradient(180deg, color-mix(in srgb, var(--panel) 30%, var(--bg)) 0%, var(--bg) 100%);
  position: relative;
  isolation: isolate;
}

.layout::before{
  /* grille douce */
  content:"";
  position:absolute; inset:0;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px);
  background-size: 22px 22px;
  opacity:.3;
  pointer-events:none;
}

/* Sidebar verticale élégante */
.sidebar {
  width: 96px;
  background: linear-gradient(
   180deg,
   #e5e7eb 0%,   /* gris clair haut */
   #f3f4f6 100%  /* gris très pâle bas */
  );
  border-right: 1px solid #d1d5db; /* bordure gris moyen */
  display: flex;
  justify-content: center;
  align-items: start;
  position: sticky;
  top: 0;
  height: 100vh;
  box-shadow: var(--shadow-md);
}

.brand-vertical{
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: .2rem;
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--text);
  user-select: none;
  padding: 24px 0;
  border-radius: 12px;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent-weak) 45%, transparent));
  outline: 0;
}
.brand-vertical:focus-visible{
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent);
}
/* Zone de contenu */
.content{
  flex: 1;
  padding: 28px clamp(16px, 3vw, 40px);
  margin: 0;
}

.page-header{
  max-width: 1100px;
  margin: 0 auto 18px;
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: clamp(16px, 3vw, 28px);
  backdrop-filter: blur(8px) saturate(1.1);
  box-shadow: var(--shadow-md);
}

/* Carte avec cadre premium */
.map-wrapper{
  position: relative;
  margin: 18px auto 0;
  width: 100%;
  max-width: 1200px;
  height: min(78vh, 900px);
  border-radius: calc(var(--radius) + 4px);
  overflow: clip;
  background: var(--panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
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