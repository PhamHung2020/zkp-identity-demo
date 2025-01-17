import { defineStore } from 'pinia';
import { InMemoryDB, Merkletree, hashElems } from '@iden3/js-merkletree';
import { SchemaHash, Claim, ClaimOptions, Id } from '@iden3/js-iden3-core';
import { toRaw } from 'vue';

// Utility functions for localStorage
const loadLocalData = () => JSON.parse(localStorage.getItem('identityManager')) || { identities: [] };
const saveLocalData = (data) => localStorage.setItem('identityManager', JSON.stringify(data));

const identityTreePrefix = new Uint8Array(0);
const identityTrees = {};
const identityDbs = {};

export const useIdentityStore = defineStore('identityStore', {
  state: () => ({
    identities: []
  }),
  actions: {
    async loadIdentities() {
      const data = loadLocalData();
      this.identities = data.identities;
      if (!this.identities) {
        return;
      }

      // construct a merkle tree for each identity
      for (const identity of this.identities) {
        const publicKey = identity['publicKey'].split(',');
        const schemaHex = "ca938857241db9451ea329256b9c06e5";
        const authSchemaHash = SchemaHash.newSchemaHashFromHex(schemaHex);

        const authClaim = Claim.newClaim(
            authSchemaHash, 
            ClaimOptions.withRevocationNonce(BigInt(1)), 
            ClaimOptions.withIndexDataInts(BigInt(publicKey[0]), BigInt(publicKey[1]))
        );

        const identityDb = new InMemoryDB(identityTreePrefix);
        const identityMerkleTree = new Merkletree(identityDb, true, 8);

        await identityMerkleTree.add(authClaim.hIndex(), authClaim.hValue());

        if (!identity['claims']) {
          continue;
        }

        for (const claim of identity['claims']) {
          const claimSchemaHash = SchemaHash.newSchemaHashFromHex(claim['claimSchemaHex']);
          const claimData = claim['claimData'];
          const newClaimObj = Claim.newClaim(claimSchemaHash, ClaimOptions.withIndexDataInts(BigInt(claimData[0]), BigInt(claimData[1])));
          const hIndex = newClaimObj.hIndex();
          const hValue = newClaimObj.hValue();

          await identityMerkleTree.add(hIndex, hValue);
        }

        identityDbs[identity['id']] = identityDb;
        identityTrees[identity['id']] = identityMerkleTree;

      }
    },
    async addIdentity(newIdentity) {
      const data = loadLocalData();
      data.identities.push(newIdentity);
      saveLocalData(data);
      this.identities = data.identities; // Update the store

      // construct a new merkle tree for the new identity
      const publicKey = newIdentity['publicKey'].split(',');
      const schemaHex = "ca938857241db9451ea329256b9c06e5";
      const authSchemaHash = SchemaHash.newSchemaHashFromHex(schemaHex);

      const authClaim = Claim.newClaim(
          authSchemaHash, 
          ClaimOptions.withRevocationNonce(BigInt(1)), 
          ClaimOptions.withIndexDataInts(BigInt(publicKey[0]), BigInt(publicKey[1]))
      );

      const identityDb = new InMemoryDB(identityTreePrefix);
      const identityMerkleTree = new Merkletree(identityDb, true, 8);

      await identityMerkleTree.add(authClaim.hIndex(), authClaim.hValue());

      identityDbs[newIdentity['id']] = identityDb;
      identityTrees[newIdentity['id']] = identityMerkleTree;
    },
    async addClaim(identityId, newClaim) {
      const data = loadLocalData();
      const identity = data.identities.find((id) => id.id === identityId);
      if (identity) {
        if (!identity.claims) identity.claims = [];
        identity.claims.push(newClaim);
        saveLocalData(data);
        this.identities = data.identities; // Update the store

        // update the corresponding merkle tree
        const identityTree = identityTrees[identityId];
        if (!identityTree) {
          return;
        }
        console.log(identityTrees[identityId]);
        

        const claimSchemaHash = SchemaHash.newSchemaHashFromHex(newClaim['claimSchemaHex']);
        const claimData = newClaim['claimData'];
        const newClaimObj = Claim.newClaim(claimSchemaHash, ClaimOptions.withIndexDataInts(BigInt(claimData[0]), BigInt(claimData[1])));
        const hIndex = newClaimObj.hIndex();
        const hValue = newClaimObj.hValue();

        await identityTrees[identityId].add(hIndex, hValue);
      }
    },
    getClaims(identityId) {
      const identity = this.identities.find((id) => id.id === identityId);
      return identity?.claims || [];
    },
    async getClaim(identityId, claimId) {
      const identity = this.identities.find((id) => id.id === identityId);
      if (!identity) {        
        return null;
      }

      const claim = identity.claims.find((claim) => claim['id'] == claimId);
      if (!claim) {        
        return null;
      }

      const identityTree = identityTrees[identityId];
      
      if (!identityTree) {        
        return null;
      }

      const currentRoot = await identityTree.root();
      const proof = await identityTree.generateProof(BigInt(claim['hIndex']), currentRoot);
      const proofJson = proof.proof.toJSON();
      const state = hashElems([currentRoot.bigInt()]);
      
      return {...proofJson, "root": currentRoot.bigInt().toString(), "state": state.bigInt().toString()};
    }
  }
});
