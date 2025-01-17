<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Claims</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ClaimCard
        v-for="claim in claims"
        :key="claim.hIndex"
        :claim="claim"
        :identityId="identityId"

      />
      <!-- <div
        v-for="claim in claims"
        :key="claim.claimId"
        class="bg-gray-100 rounded-lg p-4 shadow hover:shadow-lg transition duration-300"
      >
        <p class="font-semibold mb-2"><strong>Claim ID:</strong> {{ claim.hIndex }}</p>
        <p><strong>Claim Data:</strong> {{ claim.claimData.join(', ') }}</p>
      </div> -->
    </div>
    <!-- <ul>
      <li v-for="claim in claims" :key="claim.claimId">
        <p><strong>Claim ID:</strong> {{ claim.hIndex }}</p>
        <p><strong>Claim Data:</strong> {{ claim.claimData }}</p>
      </li>
    </ul> -->
  </div>
</template>
  
<script setup>
  import ClaimCard from './ClaimCard.vue';

  const props = defineProps({
    claims: Array,
    identityId: String
  })
</script>
