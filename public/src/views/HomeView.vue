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
h1 {
  color:black;
}
h2 {
    color: black;
    text-decoration: underline;
}
p {
  color:black
}
table{
  color: black;
}
.layout {
  display: flex;
  min-height: 100vh;
  background-color: white;
}
.sidebar {
  width: 90px;
  background-color: #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: center;
}
.brand-vertical{
  margin-top: 60px;
  writing-mode: vertical-rl;
  text-orientation: upright;
  height:100%;
  align-items:center; 
  font-weight:700; 
  font-size:1.5rem; 
  color:#000;
}
.content {
  margin:30px;
  flex: 1;
  padding: 16px 32px;
}
.map-wrapper {
  position: relative;
  margin: 16px auto 0;
  width: 100%;
  max-width: 1200px;
  height: 80vh;
  border-radius: 8px;
  overflow: hidden;
}
</style>