const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Définir les points de départ pour chaque ligue
const LEAGUES = {
    '2024': new Date("2024-11-15"),
    '2025': new Date("2025-01-09")
};

const getWeeklyPeriod = (weekNumber = 1, year = '2025') => {
    if (weekNumber < 1 || weekNumber > 4) {
        throw new Error("Le numéro de semaine doit être compris entre 1 et 4.");
    }

    // Utiliser le point de départ de la ligue appropriée
    const POINT_ZERO = LEAGUES[year];
    if (!POINT_ZERO) {
        throw new Error("Année de ligue invalide");
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
    const year = req.query.year || '2025'; // Par défaut, utiliser la ligue 2025

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber, year);
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
    const weekNumber = parseInt(req.query.week, 10) || 1;
    const year = req.query.year || '2025'; // Par défaut, utiliser la ligue 2025

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber, year);
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

// Ajout d'une route pour obtenir les informations de la ligue actuelle
router.get('/league-info', (req, res) => {
    const year = req.query.year || '2025';
    const leagueStartDate = LEAGUES[year];

    if (!leagueStartDate) {
        return res.status(400).json({ message: "Année de ligue invalide" });
    }

    const leagueEndDate = new Date(leagueStartDate);
    leagueEndDate.setDate(leagueStartDate.getDate() + (4 * 7)); // 4 semaines après le début

    res.json({
        year,
        startDate: leagueStartDate.toISOString().split('T')[0],
        endDate: leagueEndDate.toISOString().split('T')[0],
        currentWeek: calculateCurrentWeek(year)
    });
});

// Fonction utilitaire pour calculer la semaine actuelle
const calculateCurrentWeek = (year) => {
    const leagueStart = LEAGUES[year];
    const now = new Date();
    const leagueEnd = new Date(leagueStart);
    leagueEnd.setDate(leagueStart.getDate() + (4 * 7));

    if (now > leagueEnd) return 4;
    if (now < leagueStart) return 1;

    const diffTime = now.getTime() - leagueStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return Math.min(Math.max(1, weekNumber), 4);
};

module.exports = router;
