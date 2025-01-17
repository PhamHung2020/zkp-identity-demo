<template>
    <div>
      <h2>Identity Info</h2>
      <div v-if="identity">
        <p><strong>ID:</strong> {{ identity.id }}</p>
        <p><strong>Public Key X:</strong> {{ identity.publicKeyX }}</p>
        <p><strong>Public Key Y:</strong> {{ identity.publicKeyY }}</p>
      </div>
      <div v-else>
        <p>No identity selected.</p>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  
  export default {
    name: 'IdentityInfo',
    props: {
      identity: Object, // Identity object passed as a prop
    },
  };
  </script>
  