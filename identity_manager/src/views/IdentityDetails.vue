<template>
  <div v-if="identity" class="p-6 mb-8">
    <h2 class="text-2xl font-bold mb-4">Identity Info</h2>
    <p class="mb-2"><strong>ID:</strong> {{ identity?.id }}</p>
    <p><strong>Public Key:</strong> {{ identity?.publicKey }}</p>

    <div class="bg-white shadow-md rounded-lg p-6 mb-8 mt-8">
      <ClaimsList :claims="claims" :identityId="identityId" />
    </div>

    <div class="bg-white shadow-md rounded-lg p-6">
      <AddClaim :identityId="identityId" />
    </div>
  </div>
  <p v-else>No identity found.</p>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import ClaimsList from '../components/ClaimsList.vue';
import AddClaim from '../components/AddClaim.vue';
import { useIdentityStore } from '../stores/identityStore';
import { useRoute } from 'vue-router';

const route = useRoute();  // Access route parameters
const identityId = route.params.id;
const identityStore = useIdentityStore();


// Compute the identity and claims for the current identity ID
const identity = computed(() =>
  identityStore.identities.find((id) => id.id === identityId)
);

const claims = computed(() => identity.value?.claims || []);

// Load identity data based on route ID
onMounted(async () => {
  await identityStore.loadIdentities();
});
</script>
