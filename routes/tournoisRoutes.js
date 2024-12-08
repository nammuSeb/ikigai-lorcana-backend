const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const statut = req.query.statut || 'a_venir';
    let query = '';
    let params = [];

    // Obtenir la date actuelle au format YYYY-MM-DD
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (statut === 'a_venir') {
        // Pour les tournois à venir, on vérifie la date ET l'heure
        query = `
            SELECT id, nom, type, date, heure, prix, participants_max, description, location, lien, statut
            FROM tournois
            WHERE 
                (date > ?) OR 
                (date = ? AND heure > ?) AND
                statut != 'annule' AND
                statut != 'passe'
            ORDER BY date ASC, heure ASC
        `;
        params = [currentDate, currentDate, currentTime];
    } else if (statut === 'passe') {
        // Pour les tournois passés
        query = `
            SELECT id, nom, type, date, heure, prix, participants_max, description, location, lien, statut, gagnant_id
            FROM tournois
            WHERE 
                (date < ?) OR 
                (date = ? AND heure < ?) OR
                statut = 'passe'
            ORDER BY date DESC, heure DESC
        `;
        params = [currentDate, currentDate, currentTime];
    } else {
        // Pour les autres statuts (comme 'annule')
        query = `
            SELECT id, nom, type, date, heure, prix, participants_max, description, location, lien, statut
            FROM tournois
            WHERE statut = ?
            ORDER BY date ASC, heure ASC
        `;
        params = [statut];
    }

    db.query(query, params, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des tournois:', error);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
        res.json(results);
    });
});

module.exports = router;
