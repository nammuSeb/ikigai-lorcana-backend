const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assurez-vous que votre connexion à la base de données est correctement configurée

// Route pour obtenir les tournois (À venir, Passés, Annulés)
router.get('/', (req, res) => {
    const statut = req.query.statut || 'a_venir';

    const query = `
        SELECT id, nom, type, date, heure, prix, participants_max, description, location, lien, statut
        FROM tournois
        WHERE statut = ?
        ORDER BY date ASC, heure ASC
    `;

    db.query(query, [statut], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des tournois:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        } else {
            res.json(results);
        }
    });
});

module.exports = router;
