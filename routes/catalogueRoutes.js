// routes/catalogueRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Connexion à la base de données

// Route pour obtenir le catalogue
router.get('/', (req, res) => {
    const query = 'SELECT * FROM catalogue';

    db.query(query, (error, results) => {

        console.log(results)

        if (error) {
            console.error('Erreur lors de la récupération du catalogue:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        } else {
            res.json(results);
        }
    });
});

module.exports = router;
