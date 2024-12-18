const express = require('express');
const router = express.Router();
const db = require('../config/db');

const POINT_ZERO = new Date("2024-11-15");

const getWeeklyPeriod = (weekNumber = 1) => {
    if (weekNumber < 1 || weekNumber > 4) {
        throw new Error("Le numéro de semaine doit être compris entre 1 et 4.");
    }

    const startOfPeriod = new Date(POINT_ZERO);
    // Ajouter un jour pour commencer le 16
    startOfPeriod.setDate(POINT_ZERO.getDate() + 1 + (7 * (weekNumber - 1)));

    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(startOfPeriod.getDate() + 6);

    return {
        startDate: startOfPeriod.toISOString().split("T")[0],
        endDate: endOfPeriod.toISOString().split("T")[0],
    };
};

// Route pour les défis de la semaine
router.get('/:type', (req, res) => {
    const type = req.params.type;
    const weekNumber = parseInt(req.query.week, 10) || 1;

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber);

        let query = '';
        let params = [];

        if (type === 'defi_semaine') {
            query = `
                SELECT 
                    id, nom, description, points, points_type, type
                FROM defis
                WHERE type = ?
                    AND date_debut = ?
                    AND date_fin = ?
            `;
            params = [type, startDate, endDate];
        } else {
            query = `
                SELECT 
                    id, nom, description, points, points_type, type
                FROM defis
                WHERE type = ?
            `;
            params = [type];
        }

        db.query(query, params, (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération des défis:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            console.log(`Défis trouvés pour ${type}, semaine ${weekNumber}:`, results.length);
            res.json(results);
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/player/:slug', (req, res) => {
    const slug = req.params.slug;
    const weekNumber = parseInt(req.query.week, 10) || 1;

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber);

        const query = `
            SELECT 
                d.id,
                d.nom,
                d.description,
                d.points,
                d.points_type,
                IF(dv.id IS NOT NULL, TRUE, FALSE) as completed
            FROM defis d
            LEFT JOIN joueurs j ON j.pseudo = ?
            LEFT JOIN defis_valides dv ON d.id = dv.defi_id 
                AND dv.joueur_id = j.id
            WHERE d.type = 'defi_semaine'
                AND d.date_debut = ?
                AND d.date_fin = ?
            ORDER BY d.id ASC
        `;

        console.log('Recherche des défis pour la période:', startDate, 'à', endDate);

        db.query(query, [slug, startDate, endDate], (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération des défis:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

            console.log(`Défis trouvés pour la semaine ${weekNumber}:`, results.length);

            res.json({
                week: weekNumber,
                startDate,
                endDate,
                defis: results
            });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
