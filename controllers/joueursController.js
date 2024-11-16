const db = require('../config/db');
const con = require("../config/db");


const POINT_ZERO = new Date("2024-11-15");

const getWeeklyPeriod = (weekNumber = 1) => {
    if (weekNumber < 1 || weekNumber > 4) {
        throw new Error("Le numéro de semaine doit être compris entre 1 et 4.");
    }

    const startOfPeriod = new Date(POINT_ZERO);
    startOfPeriod.setDate(POINT_ZERO.getDate() + (7 * (weekNumber - 1)));

    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(startOfPeriod.getDate() + 6);

    return {
        startDate: startOfPeriod.toISOString().split("T")[0],
        endDate: endOfPeriod.toISOString().split("T")[0],
    };
};


exports.getJoueurBySlug = (req, res) => {
    try {
        const weekNumber = parseInt(req.query.week, 10) || 1;
        if (weekNumber < 1 || weekNumber > 4) {
            return res.status(400).json({ message: "Le numéro de semaine doit être compris entre 1 et 4." });
        }

        const { startDate, endDate } = getWeeklyPeriod(weekNumber);
        const slug = req.params.slug;

        // Requête SQL pour récupérer les informations du joueur
        const playerQuery = `
            SELECT *
            FROM joueurs
            WHERE pseudo = ?`;

        // Requête SQL pour récupérer les points de la semaine
        const pointsQuery = `
            SELECT points, start_date, end_date
            FROM classements
            WHERE joueur_id = ? AND (start_date BETWEEN ? AND ?)`;

        con.query(playerQuery, [slug], (err, playerResults) => {
            if (err || playerResults.length === 0) {
                res.status(404).json({ message: "Joueur non trouvé." });
                return;
            }

            const player = playerResults[0];
            con.query(pointsQuery, [player.id, startDate, endDate], (err, pointsResults) => {
                if (err) {
                    res.status(500).json({ message: "Erreur lors de la récupération des points." });
                    return;
                }

                const weeklyPoints = pointsResults.map((entry) => ({
                    points: entry.points,
                    startDate: entry.start_date,
                    endDate: entry.end_date,
                }));

                res.json({
                    ...player,
                    weeklyPoints,
                });
            });
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Obtenir tous les joueurs
exports.getAllJoueurs = (req, res) => {
    db.query('SELECT * FROM joueurs', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// Obtenir un joueur par ID
exports.getJoueurById = (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM joueurs WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
};



// Créer un nouveau joueur
exports.createJoueur = (req, res) => {
    const { pseudo, rang, argent, points, semaine, set_ligue, avatar_url } = req.body;
    db.query('INSERT INTO joueurs (pseudo, rang, argent, points, semaine, set_ligue, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [pseudo, rang, argent, points, semaine, set_ligue, avatar_url], (err, results) => {
            if (err) throw err;
            res.json({ id: results.insertId, ...req.body });
        });
};

// Mettre à jour un joueur
exports.updateJoueur = (req, res) => {
    const id = req.params.id;
    const { pseudo, rang, argent, points, semaine, set_ligue, avatar_url } = req.body;
    db.query('UPDATE joueurs SET pseudo = ?, rang = ?, argent = ?, points = ?, semaine = ?, set_ligue = ?, avatar_url = ? WHERE id = ?',
        [pseudo, rang, argent, points, semaine, set_ligue, avatar_url, id], (err) => {
            if (err) throw err;
            res.json({ id, ...req.body });
        });
};

// Supprimer un joueur
exports.deleteJoueur = (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM joueurs WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Joueur supprimé' });
    });
};
