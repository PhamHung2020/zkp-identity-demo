const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { babyJub, getRandomBytes, PrivateKey, Poseidon } = require('@iden3/js-crypto');
const { SchemaHash, Claim, ClaimOptions, Id } = require('@iden3/js-iden3-core');
const { InMemoryDB, Merkletree, hashElems } = require('@iden3/js-merkletree');

// CORS configuration
const corsOptions = {
    origin: '*',  // The Vue.js client URL (adjust if deployed elsewhere)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers
};
  

const app = express();
app.use(bodyParser.json());
// Use CORS middleware
app.use(cors(corsOptions));

// In-memory data structures
const globalPrefix = new Uint8Array(0);
const globalDb = new InMemoryDB(globalPrefix);
const globalMerkleTree = new Merkletree(globalDb, true, 16);
const identities = {}; // Stores identities and their individual SMTs

app.post('/identity', async (req, res) => {
    try {
        const { publicKeyX, publicKeyY } = req.body;

        // Validate that the public key is provided
        if (!publicKeyX || !publicKeyY) {
            return res.status(400).json({ error: 'Public key is required.' });
        }

        const schemaHex = "ca938857241db9451ea329256b9c06e5";
        const authSchemaHash = SchemaHash.newSchemaHashFromHex(schemaHex);

        const authClaim = Claim.newClaim(
            authSchemaHash, 
            ClaimOptions.withRevocationNonce(BigInt(1)), 
            ClaimOptions.withIndexDataInts(BigInt(publicKeyX), BigInt(publicKeyY))
        );

        const identityDb = new InMemoryDB(globalPrefix);
        const identityMerkleTree = new Merkletree(identityDb, true, 8);

        await identityMerkleTree.add(authClaim.hIndex(), authClaim.hValue());
        const root = await identityMerkleTree.root();
        const state = hashElems([root.bigInt()])
        const genesisId = Id.idGenesisFromIdenState(new Uint8Array([0, 0]), state.bigInt()).bigInt();

        // Check if the identity already exists
        if (identities[genesisId]) {
            return res.status(400).json({ error: 'Identity already exists.' });
        }

        identities[genesisId] = {
            'publicKeyX': publicKeyX,
            'publicKeyY': publicKeyY,
            'db': identityDb,
            'claimTree': identityMerkleTree,
            'state': state.bigInt()
        }

        // add new identity to the global tree
        const hashGenesisId = Poseidon.hash([genesisId]);
        await globalMerkleTree.add(hashGenesisId, state.bigInt());

        res.json({
            'genesisId': genesisId.toString(),
            'currentState': state.bigInt().toString()
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create identity.' });
    }
});


app.post('/identity/:identityId/claim', async (req, res) => {
    try {
        const { identityId } = req.params;
        const { claimSchemaHex, claimData } = req.body;

        if (!identities[BigInt(identityId)] || !claimSchemaHex || !claimData) {
            return res.status(404).json({ error: 'Provided data is invalid.' });
        }

        if (!Array.isArray(claimData) || claimData.length < 2) {
            return res.status(404).json({ error: 'Provided data is invalid.' });
        }

        const claimSchemaHash = SchemaHash.newSchemaHashFromHex(claimSchemaHex);
        const newClaim = Claim.newClaim(claimSchemaHash, ClaimOptions.withIndexDataInts(BigInt(claimData[0]), BigInt(claimData[1])));
        const hIndex = newClaim.hIndex();
        const hValue = newClaim.hValue();

        const identity = identities[BigInt(identityId)]
        await identity['claimTree'].add(hIndex, hValue);
        const currentRoot = await identity['claimTree'].root();

        const newState = hashElems([currentRoot.bigInt()]);
        identity['state'] = newState.bigInt();

        // update new state to the global tree
        const hashGenesisId = Poseidon.hash([BigInt(identityId)]);
        await globalMerkleTree.update(hashGenesisId, newState.bigInt());
        
        // const proof = await identity['claimTree'].generateProof(hIndex, currentRoot);
        // console.log(newClaim.marshalJson());
        // console.log(proof.proof.toJSON());
        // console.log(currentRoot.bigInt());
        // console.log(currentRoot.bigInt().toString());
        
        res.json({
            'hIndex': hIndex.toString(),
            'hValue': hValue.toString(),
            'currentRoot': currentRoot.bigInt().toString(),
            'claim': newClaim.marshalJson(),
            'currentState': newState
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add claim.' });
    }
});

app.get("/identity/:identityId/claim/:claimHIndex/proof", async (req, res) => {
    try {
        const { identityId, claimHIndex } = req.params;
        if (!identities[BigInt(identityId)]) {
            return res.status(404).json({ error: 'Provided data is invalid.' });
        }

        const identity = identities[BigInt(identityId)]
        const currentRoot = await identity['claimTree'].root();
        const proof = await identity['claimTree'].generateProof(BigInt(claimHIndex), currentRoot);
        const proofJson = proof.proof.toJSON();
        res.json({...proofJson, "root": currentRoot, "state": identity['state'].toString()});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

app.post("/check_state", async (req, res) => {
    try {
        const { state } = req.body;
        const genesisId = Object.keys(identities).find(key => identities[key]['state'].toString() == state);
        if (!genesisId) {
            return res.json({
                "exist": false
            })
        }

        const hashGenesisId = hashElems([genesisId]);
        const existProof = await globalMerkleTree.generateProof(hashGenesisId.bigInt(), (await globalMerkleTree.root()));
        res.json({
            "exist": existProof.proof.existence
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});