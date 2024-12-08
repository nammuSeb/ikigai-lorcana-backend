const express = require('express');
const router = express.Router();
const con = require('../config/db');

const getWeeklyPeriod = (weekNumber = 1) => {
    if (weekNumber < 1 || weekNumber > 4) {
        throw new Error("Le numéro de semaine doit être compris entre 1 et 4.");
    }

    const startOfPeriod = new Date("2024-11-16"); // Date de départ fixe
    startOfPeriod.setDate(startOfPeriod.getDate() + (7 * (weekNumber - 1)));

    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(startOfPeriod.getDate() + 6);

    return {
        startDate: startOfPeriod.toISOString().split("T")[0],
        endDate: endOfPeriod.toISOString().split("T")[0],
    };
};

router.get('/leaderboard', (req, res) => {
    const weekNumber = parseInt(req.query.week, 10) || 1;
    const { startDate, endDate } = getWeeklyPeriod(weekNumber);

    const leaderboardQuery = `
        SELECT 
            j.id AS joueur_id,
            j.pseudo,
            j.nickname,
            COALESCE(c.points, 0) as points,
            c.start_date,
            c.end_date
        FROM joueurs j
        LEFT JOIN classements c ON j.id = c.joueur_id 
            AND c.start_date = ? 
            AND c.end_date = ?
        ORDER BY 
            COALESCE(c.points, 0) DESC,
            j.pseudo ASC;
    `;

    con.query(leaderboardQuery, [startDate, endDate], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération du leaderboard:', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        let rank = 0;
        let previousPoints = -1;
        let skipRanks = 0;

        const leaderboard = results.map((row, index) => {
            if (row.points !== previousPoints) {
                rank += 1 + skipRanks;
                skipRanks = 0;
                previousPoints = row.points;
            } else {
                skipRanks++;
            }

            return {
                pseudo: row.pseudo,
                nickname: row.nickname || '',
                points: row.points,
                rank: rank,
                pointsByDay: [row.points] // On retourne les points de la semaine dans un tableau
            };
        });

        res.json({
            week: weekNumber,
            startDate,
            endDate,
            players: leaderboard
        });
    });
});

module.exports = router;
