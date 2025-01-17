const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const snarkjs = require('snarkjs');
const axios = require('axios');

const verificationKeyPath = path.join(__dirname, 'public/verification_key.json');
const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath));

// CORS configuration
const corsOptions = {
    origin: '*',  // The Vue.js client URL (adjust if deployed elsewhere)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers
};

// Use CORS middleware
app.use(cors(corsOptions));

app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up a route to serve a specific file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/verify-proof', async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
        if (!isValid) {
          res.json({isValid});
        }

        const response = await axios.post(
          'http://localhost:3000/check_state', {
            'state': publicSignals[1]
          }, {
            'Content-Type': 'application/json'
          }
        );

        res.json({"isValid": response.data.exist});
    } catch (error) {
        console.error('Error verifying proof:', error);
        res.status(500).json({ error: 'Failed to verify proof' });
    }
})

// Start the server on port 3000
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
