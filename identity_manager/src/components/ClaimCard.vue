<!-- ClaimCard.vue -->
<template>
  <div class="bg-gray-100 rounded-lg p-4 shadow hover:shadow-lg transition duration-300">
    <p class="font-semibold mb-2"><strong>Claim ID:</strong> {{ claim.hIndex.substring(0, 20) }}...</p>
    <p><strong>Claim Data:</strong> {{ claim.claimData.join(', ') }}</p>

    <button
      @click="showLinkInput = !showLinkInput"
      class="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
    >
      Generate Proof
    </button>

    <!-- Link input section -->
    <div v-if="showLinkInput" class="mt-4 space-y-4">
      <input
        v-model="link"
        type="text"
        placeholder="Enter the link to fetch files"
        class="block w-full p-2 border border-gray-300 rounded"
      />
      <button
        @click="fetchFiles"
        class="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300"
      >
        Fetch Files
      </button>
    </div>

    <!-- Once files are fetched, show generate proof button -->
    <div v-if="filesFetched && showLinkInput" class="mt-4 space-y-4">
      <button
        @click="generateProof"
        class="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition duration-300"
      >
        Generate
      </button>
    </div>
    
  </div>
</template>
  
<script setup>
import { ref } from 'vue';
import axios from '../api/axios';
import { groth16 } from 'snarkjs';
import { useIdentityStore } from '../stores/identityStore';

const props = defineProps({
  claim: Object,
  identityId: String, // Assuming identityId is passed as a prop as well
});

const showLinkInput = ref(false); // Control whether link input is shown
const link = ref(""); // Link provided by the user
const filesFetched = ref(false); // Track whether files are successfully fetched
const identityStore = useIdentityStore();

const files = ref({
  wasm: null,
  provingKey: null,
  verificationKey: null,
  publicInput: null
});

const fetchFile = async (url, responseType) => {
  try {
    const response = await axios.get(url, {
      responseType: responseType,
    })

    return response.data;
  } catch (error) {
    console.error('Error fetching the file:', error);
    throw error;
  }
}

// Function to fetch necessary files from the provided link
const fetchFiles = async () => {
  if (!link.value) {
    alert("Please provide a valid link.");
    return;
  }

  try {
    // Assuming the response contains the files in an appropriate format
    files.value.publicInput = await fetchFile(link.value + "/public_inputs.json", 'text');

    filesFetched.value = true; // Mark files as fetched
    alert("Files fetched successfully.");
  } catch (error) {
    console.error("Error fetching files:", error);
    alert("Failed to fetch files. Please check the link.");
  }
};

// Function to generate proof by calling the "/identity/:identityId/claim/:claimId/proof" API
const generateProof = async () => {
  try {
    // // After generating the proof, make the API call to "/proof"
    // const response = await axios.get(`/identity/${props.identityId}/claim/${props.claim.hIndex}/proof`);

    // // Assuming the server returns the additional proof-related info or verifies it
    // let {existence, siblings, root, state } = response.data;

    const claimInfo = await identityStore.getClaim(props.identityId, props.claim.id);
    
    if (!claimInfo) {
      throw new Error("Claim info not found");
    }

    console.log(claimInfo);
    
    let { existence, siblings, root, state } = claimInfo;
    if (!Array.isArray(siblings)) {
      throw new Error("Siblings must be a list");
    }

    if (siblings.length < 8) {
      siblings = siblings.concat(new Array(8 - siblings.length).fill(0));
    }

    const publicInput = JSON.parse(files.value.publicInput);
    const input = {
      "claim": props.claim.claim,
      // "claimHi": props.claim.hIndex,
      // "claimHv": props.claim.hValue,
      "enabled": "1",
      "claimMTP": siblings,
      "treeRoot": root,
      "state": state,
      ...publicInput
    }
    console.log(input);
    

    const { proof, publicSignals } = await groth16.fullProve(input, link.value + "/circuit.wasm", link.value + "/proving_key.zkey");
    console.log(publicSignals);
    
    // const proof = "Aaa";
    // Create a downloadable file for the proof
    const blob = new Blob([JSON.stringify({ proof })], { type: 'application/json' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `proof-${props.claim.claimId}.json`; // Set file name for the proof
    downloadLink.click();

    // Create a downloadable file for the public signals
    const publicSignalBlob = new Blob([JSON.stringify({ publicSignals })], { type: 'application/json' });
    const publicSignalDownloadLink = document.createElement('a');
    publicSignalDownloadLink.href = URL.createObjectURL(publicSignalBlob);
    publicSignalDownloadLink.download = `public-signals-${props.claim.claimId}.json`; // Set file name for the proof
    publicSignalDownloadLink.click();

    alert('Proof generated and downloaded successfully!');
  } catch (error) {
    console.error('Error generating proof:', error);
    alert('An error occurred while generating the proof.');
  }
};

// Mock function to simulate generating proof using the fetched files
const generateProofOnClient = async (wasmFile, provingKey, verificationKey) => {
  // Implement the actual logic to generate the proof using the files (e.g., WASM file, proving key, etc.)
  // For now, return a mock proof
  return {
    proof: "generated-proof-data",
  };
};
</script>
