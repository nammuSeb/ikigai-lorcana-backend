// routes/catalogueRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Connexion à la base de données

// Route pour obtenir le catalogue
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM catalogue');

        console.log(results);

        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération du catalogue:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
