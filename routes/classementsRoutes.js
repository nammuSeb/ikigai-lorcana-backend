const express = require('express');
const router = express.Router();
const con = require('../config/db'); // Assurez-vous que votre connexion à la base de données est bien configurée

// Fonction pour calculer la semaine et la période actuelle si besoin
router.get('/leaderboard', (req, res) => {
    const week = parseInt(req.query.week, 10) || getCurrentWeekAndPeriod().currentWeek;

    // Requête pour récupérer les points de chaque jour de la semaine pour chaque joueur
    const query = `
        SELECT joueurs.id, joueurs.pseudo, classements.date, classements.points
        FROM joueurs
        JOIN classements ON joueurs.id = classements.joueur_id
        WHERE classements.semaine = ?
        ORDER BY joueurs.id, classements.date
    `;

    con.query(query, [week], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération du leaderboard :', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        // Organiser les résultats par joueur
        const leaderboard = results.reduce((acc, row) => {
            const { id, pseudo, date, points } = row;

            if (!acc[id]) {
                acc[id] = { pseudo, pointsByDay: Array(10).fill(0) };
            }

            // Calcul de l'index du jour de la semaine (0 pour lundi, 6 pour dimanche)
            const dayIndex = new Date(date).getDay() - 1; // Ajustement si la semaine commence le lundi
            acc[id].pointsByDay[dayIndex] = points;

            return acc;
        }, {});

        res.json(Object.values(leaderboard));
    });
});

// Route pour récupérer le leaderboard de la semaine donnée
router.get('/leaderboard', (req, res) => {
    const week = parseInt(req.query.week, 10) || getCurrentWeekAndPeriod().currentWeek; // Prend la semaine de la requête ou la semaine actuelle

    // Requête SQL pour obtenir le classement hebdomadaire
    const query = `
        SELECT joueurs.id, joueurs.pseudo, SUM(classements.points) AS total_points
        FROM joueurs
        JOIN classements ON joueurs.id = classements.joueur_id
        WHERE classements.semaine = ?
        GROUP BY joueurs.id
        ORDER BY total_points DESC
    `;

    con.query(query, [week], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération du leaderboard :', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json(results); // Envoie les résultats triés au client
    });
});

module.exports = router;
