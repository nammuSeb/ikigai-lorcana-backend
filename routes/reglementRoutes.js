const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route pour récupérer les sections du règlement
router.get('/', (req, res) => {
    const query = `
        SELECT id, section, content, order_number
        FROM reglements
        ORDER BY order_number ASC
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération du règlement:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        } else {
            res.json(results);
        }
    });
});

module.exports = router;
