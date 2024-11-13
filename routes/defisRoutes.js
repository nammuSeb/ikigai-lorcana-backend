const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assurez-vous que votre connexion à la base de données est correcte

// Route pour obtenir les défis par type
router.get('/:type', (req, res) => {
    const type = req.params.type;

    const query = 'SELECT * FROM defis WHERE type = ?';
    db.query(query, [type], (error, results) => {
        console.log(results)
        if (error) {
            console.error('Erreur lors de la récupération des défis:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        } else {
            res.json(results);
        }
    });
});

module.exports = router;
