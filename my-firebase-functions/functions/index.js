const functions = require('firebase-functions');
const axios = require('axios');

// Your Chapa secret key
const CHAPA_SECRET_KEY = 'CHASECK_TEST-TYab8brKaIUT7ukguboxz7WgA30BRrYh';

exports.createPayment = functions.https.onRequest(async (req, res) => {
    // Ensure only POST requests are handled
    if (req.method !== 'POST') {
        return res.status(405).send({ error: 'Method Not Allowed' });
    }

    const { amount, email } = req.body;

    if (!amount || !email) {
        return res.status(400).send({ error: 'Amount and email are required' });
    }

    try {
        const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', {
            amount,
            email,
            key: CHASECK_TEST-TYab8brKaIUT7ukguboxz7WgA30BRrYh, // Use the correct secret key variable
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error during payment initialization:', error);
        res.status(500).json({ error: error.message });
    }
});