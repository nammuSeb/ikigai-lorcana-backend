const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route pour récupérer les sections du règlement
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT id, section, content, order_number
            FROM reglements
            ORDER BY order_number ASC
        `;

        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération du règlement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
