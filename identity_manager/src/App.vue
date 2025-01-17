<template>
  <div id="app">
    <router-view></router-view> <!-- Will render Home.vue or IdentityDetails.vue based on routing -->
  </div>
</template>

<script setup>
import { useIdentityStore } from './stores/identityStore';
import { onMounted } from 'vue';

const identityStore = useIdentityStore();

onMounted(async () => {
  await identityStore.loadIdentities();
});

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: #eef0f1;
  font-family: 'Inter', sans-serif;
}
</style>
