<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Add Identity</h2>
    <button class="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300" @click="addIdentityHandler">Add New Identity</button>
  </div>
</template>
  
<script setup>
  import { ref } from 'vue';
  import axios from '../api/axios';
  import { getRandomBytes, PrivateKey } from '@iden3/js-crypto';
  import { useIdentityStore } from '../stores/identityStore';

  
  const publicKeyX = ref('');
  const publicKeyY = ref('');
  const identityStore = useIdentityStore();

  async function addIdentityHandler() {
    const privKey = new PrivateKey(getRandomBytes(32));
    const pubKey = privKey.public();

    publicKeyX.value = pubKey.p[0]
    publicKeyY.value = pubKey.p[1]

    // Register via API
    try {
      const response = await axios.post('/identity', {
        publicKeyX: publicKeyX.value.toString(),
        publicKeyY: publicKeyY.value.toString(),
      });

      const genesisId = response.data.genesisId;

      const newIdentity = {
        id: genesisId,
        publicKey: `${publicKeyX.value},${publicKeyY.value}`,
        privateKey: privKey.hex()
      };

      // Save locally
      await identityStore.addIdentity(newIdentity);

      console.log('Identity registered:', response.data);
      alert('Identity added and registered successfully!');
    } catch (error) {
      console.error('Error registering identity:', error);
    }

    publicKeyX.value = '';
    publicKeyY.value = '';
  };
</script>
  