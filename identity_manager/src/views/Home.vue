<template>
  <div class="p-8 flex flex-col text-center">
    <h1 class="text-3xl font-bold mb-6">Identity Manager</h1>
    <div class="bg-white shadow-md rounded-lg p-6 mb-8 text-center max-w-lg self-center">
      <AddIdentity />
    </div>

    <h2 class="text-2xl font-semibold mb-4">Saved Identities</h2>
    <ul class="space-y-4 flex flex-col">
      <li v-for="identity in identities" :key="identity.id" class="bg-white rounded-lg p-4 shadow hover:shadow-lg transition duration-300 max-w-max self-center">
        <router-link :to="{ name: 'IdentityDetails', params: { id: identity.id } }" class="text-blue-600 hover:text-blue-800 font-semibold">
          {{ identity.id }}
        </router-link>
      </li>
    </ul>
  </div>
</template>
  
<script setup>

import { onMounted, computed } from 'vue';
import { useIdentityStore } from '../stores/identityStore';
import AddIdentity from '../components/AddIdentity.vue';

const identityStore = useIdentityStore();
// const identities = ref([]);
// Load identities from the store
// onMounted(async () => {
//   await identityStore.loadIdentities();
//   // Use the store's reactive state
//   // identities.value = identityStore.identities;
// });

const identities = computed(() => identityStore.identities);

</script>
  