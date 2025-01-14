const express = require('express');
const router = express.Router();
const db = require('../config/db');

const getWeeklyPeriod = (weekNumber = 1) => {
    if (weekNumber < 1 || weekNumber > 4) {
        throw new Error("Le numéro de semaine doit être compris entre 1 et 4.");
    }

    const startOfPeriod = new Date("2024-11-16"); // Date de départ fixe pour toutes les ligues
    startOfPeriod.setDate(startOfPeriod.getDate() + (7 * (weekNumber - 1)));

    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(startOfPeriod.getDate() + 6);

    return {
        startDate: startOfPeriod.toISOString().split("T")[0],
        endDate: endOfPeriod.toISOString().split("T")[0],
    };
};

const calculateCurrentWeek = () => {
    const leagueStart = new Date("2024-11-16");
    const now = new Date();
    const diffTime = now.getTime() - leagueStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    return Math.min(Math.max(1, weekNumber), 4);
};

// Route pour les défis de la semaine
router.get('/:type', async (req, res) => {
    const type = req.params.type;
    const weekNumber = parseInt(req.query.week, 10) || calculateCurrentWeek();

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber);
        console.log(`Période recherchée : du ${startDate} au ${endDate}`);

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
                ORDER BY id ASC
            `;
            params = [type, startDate, endDate];
        } else {
            query = `
                SELECT 
                    id, nom, description, points, points_type, type
                FROM defis
                WHERE type = ?
                    AND date_debut <= ?
                    AND date_fin >= ?
                ORDER BY id ASC
            `;
            params = [type, endDate, startDate];
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

router.get('/player/:slug', async (req, res) => {
    const slug = req.params.slug;
    const weekNumber = parseInt(req.query.week, 10) || calculateCurrentWeek();

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber);
        console.log('Recherche des défis pour la période:', startDate, 'à', endDate);

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

        const [results] = await db.query(query, [slug, startDate, endDate]);
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

// Route pour obtenir les informations de la ligue
router.get('/league-info', (req, res) => {
    const startDate = new Date("2024-11-16");
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (4 * 7)); // 4 semaines après le début

    res.json({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        currentWeek: calculateCurrentWeek()
    });
});

module.exports = router;
