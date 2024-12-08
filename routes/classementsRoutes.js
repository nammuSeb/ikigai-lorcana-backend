const express = require('express');
const router = express.Router();
const con = require('../config/db');

const getWeeklyPeriod = (weekNumber = 1, baseDate = new Date()) => {
    baseDate.setHours(0, 0, 0, 0);
    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - ((dayOfWeek + 2) % 7) + (7 * (weekNumber - 1)));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0],
    };
};

router.get('/leaderboard', (req, res) => {
    const weekNumber = parseInt(req.query.week, 10) || 1;
    const { startDate, endDate } = getWeeklyPeriod(weekNumber);

    console.log(`Fetching leaderboard for week ${weekNumber}: ${startDate} - ${endDate}`);

    const leaderboardQuery = `
        SELECT 
            joueurs.id AS joueur_id,
            joueurs.pseudo,
            joueurs.nickname,
            IFNULL(SUM(classements.points), 0) AS total_points,
            GROUP_CONCAT(classements.points ORDER BY classements.start_date) AS points_by_day
        FROM joueurs
        LEFT JOIN classements ON joueurs.id = classements.joueur_id
        WHERE (classements.start_date BETWEEN ? AND ?) OR classements.joueur_id IS NULL
        GROUP BY joueurs.id
        ORDER BY total_points DESC;
    `;

    console.log("Executing SQL Query:", leaderboardQuery);

    con.query(leaderboardQuery, [startDate, endDate], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération du leaderboard :', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        console.log("Raw Results from Database:", results);

        const leaderboard = results.map(row => {
            const pointsByDay = row.points_by_day ? row.points_by_day.split(',').map(Number) : Array(10).fill(0);

            return {
                pseudo: row.pseudo,
                nickname: row.nickname || '', // Ajout du nickname avec une valeur par défaut vide
                totalPoints: row.total_points,
                pointsByDay: pointsByDay.concat(Array(10 - pointsByDay.length).fill(0)).slice(0, 10)
            };
        });

        res.json({
            players: leaderboard,
            period: { startDate, endDate }
        });
    });
});

module.exports = router;
