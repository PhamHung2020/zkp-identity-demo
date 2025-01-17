<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Add Claim</h2>

    <div class="space-y-4">
      <div>
        <label for="claimSchemaHex" class="block text-sm font-medium text-gray-700">Claim Schema Hex</label>
        <input v-model="claimSchemaHex" id="claimSchemaHex" placeholder="Claim Schema Hex" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"/>
      </div>
      
      <div>
        <label for="claimData1" class="block text-sm font-medium text-gray-700">Claim Data 1</label>
        <input v-model="claimData[0]" id="claimData1" placeholder="Claim Data Element 1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"/>
      </div>
      
      <div>
        <label for="claimData2" class="block text-sm font-medium text-gray-700">Claim Data 2</label>
        <input v-model="claimData[1]" id="claimData2" placeholder="Claim Data Element 2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"/>
      </div>
      
      <button @click="addClaim" class="mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300">Add Claim</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useIdentityStore } from '../stores/identityStore';
import axios from '../api/axios';

const claimSchemaHex = ref('');
const claimData = ref(['', '']); // Array with two elements for claimData
const props = defineProps({
  identityId: {
    type: String,
    required: true,
  },
});
const identityStore = useIdentityStore();

// Function to handle adding a claim
const addClaim = async () => {
  if (!claimSchemaHex.value || !claimData.value[0] || !claimData.value[1]) {
    return alert('Fill all fields!');
  }

  // Optionally register claim via API (if required)
  try {
    const response = await axios.post(`/identity/${props.identityId}/claim`, {
      claimSchemaHex: claimSchemaHex.value,
      claimData: claimData.value,
    });

    const { hIndex, hValue, claim } = response.data;

    // Construct the claim object
    const newClaim = {
      claimId: `${Date.now()}`, // Generate a unique claim ID based on timestamp
      claimSchemaHex: claimSchemaHex.value,
      claimData: claimData.value,  // Array of claimData
      hIndex,
      hValue,
      claim
    };

    // Save claim to the identity in localStorage
    // addClaimToIdentity(props.identityId, newClaim);
    await identityStore.addClaim(props.identityId, newClaim);

    console.log('Claim registered:', response.data);
    alert('Claim added and registered successfully!');
  } catch (error) {
    console.error('Error registering claim:', error);
  }

  // Reset input fields
  claimSchemaHex.value = '';
  claimData.value = ['', ''];
};
</script>
