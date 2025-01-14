const express = require('express');
const router = express.Router();
const db = require('../config/db');

const POINT_ZERO = new Date("2024-11-15");

const getWeeklyPeriod = (weekNumber = 1) => {
    if (weekNumber < 1 || weekNumber > 4) {
        throw new Error("Le numéro de semaine doit être compris entre 1 et 4.");
    }

    const startOfPeriod = new Date(POINT_ZERO);
    startOfPeriod.setDate(POINT_ZERO.getDate() + 1 + (7 * (weekNumber - 1)));

    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(startOfPeriod.getDate() + 6);

    return {
        startDate: startOfPeriod.toISOString().split("T")[0],
        endDate: endOfPeriod.toISOString().split("T")[0],
    };
};

// Route pour les défis de la semaine
router.get('/:type', async (req, res) => {
    const type = req.params.type;
    const weekNumber = parseInt(req.query.week, 10) || 1;

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber);
        console.log(`Période calculée : du ${startDate} au ${endDate}`);

        let query = '';
        let params = [];

        if (type === 'defi_semaine') {
            // Modification de la requête pour les défis hebdomadaires
            query = `
                SELECT 
                    id, nom, description, points, points_type, type
                FROM defis
                WHERE type = ?
                    AND date_debut <= ?
                    AND date_fin >= ?
                    AND (
                        (date_debut BETWEEN ? AND ?)
                        OR (date_fin BETWEEN ? AND ?)
                        OR (date_debut <= ? AND date_fin >= ?)
                    )
            `;
            params = [type, endDate, startDate, startDate, endDate, startDate, endDate, startDate, endDate];
        } else {
            query = `
                SELECT 
                    id, nom, description, points, points_type, type
                FROM defis
                WHERE type = ?
            `;
            params = [type];
        }

        const [results] = await db.query(query, params);
        console.log(`Défis trouvés pour ${type}, semaine ${weekNumber}:`, results.length);
        res.json(results);

    } catch (error) {
        console.error('Erreur lors de la récupération des défis:', error);
        res.status(error.message.includes('semaine') ? 400 : 500)
            .json({ message: error.message });
    }
});

// La route /player/:slug reste la même mais nécessite une mise à jour similaire
router.get('/player/:slug', async (req, res) => {
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
                AND d.date_debut <= ?
                AND d.date_fin >= ?
                AND (
                    (d.date_debut BETWEEN ? AND ?)
                    OR (d.date_fin BETWEEN ? AND ?)
                    OR (d.date_debut <= ? AND d.date_fin >= ?)
                )
            ORDER BY d.id ASC
        `;

        console.log('Recherche des défis pour la période:', startDate, 'à', endDate);

        const [results] = await db.query(query, [
            slug,
            endDate, startDate,
            startDate, endDate,
            startDate, endDate,
            startDate, endDate
        ]);

        console.log(`Défis trouvés pour la semaine ${weekNumber}:`, results.length);

        res.json({
            week: weekNumber,
            startDate,
            endDate,
            defis: results
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
