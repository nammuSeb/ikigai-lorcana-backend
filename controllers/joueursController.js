const db = require('../config/db');

const POINT_ZERO = new Date("2024-11-11");

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

exports.getJoueurBySlug = async (req, res) => {
    const { slug } = req.params;
    const weekNumber = parseInt(req.query.week, 10) || 1;

    try {
        const playerQuery = `
            SELECT 
                j.pseudo,
                j.nickname,
                j.argent,
                j.avatar_url
            FROM joueurs j
            WHERE j.pseudo = ?
        `;

        const pointsQuery = `
            SELECT 
                SUM(d.points) as points,
                d.date_debut as startDate,
                d.date_fin as endDate
            FROM defis d
            INNER JOIN defis_valides dv ON d.id = dv.defi_id
            INNER JOIN joueurs j ON j.id = dv.joueur_id
            WHERE j.pseudo = ?
            GROUP BY d.date_debut, d.date_fin
        `;

        const [playerResults] = await db.query(playerQuery, [slug]);
        const [weeklyPoints] = await db.query(pointsQuery, [slug]);

        if (playerResults.length === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }

        const playerData = {
            ...playerResults[0],
            weeklyPoints: weeklyPoints.map(week => ({
                points: week.points,
                startDate: week.startDate,
                endDate: week.endDate
            }))
        };

        res.json(playerData);
    } catch (error) {
        console.error('Erreur lors de la récupération du joueur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir tous les joueurs
exports.getAllJoueurs = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM joueurs');
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des joueurs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir un joueur par ID
exports.getJoueurById = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM joueurs WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du joueur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Créer un nouveau joueur
exports.createJoueur = async (req, res) => {
    try {
        const { pseudo, rang, argent, points, semaine, set_ligue, avatar_url } = req.body;
        const [result] = await db.query(
            'INSERT INTO joueurs (pseudo, rang, argent, points, semaine, set_ligue, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [pseudo, rang, argent, points, semaine, set_ligue, avatar_url]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error('Erreur lors de la création du joueur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un joueur
exports.updateJoueur = async (req, res) => {
    try {
        const { pseudo, rang, argent, points, semaine, set_ligue, avatar_url } = req.body;
        const [result] = await db.query(
            'UPDATE joueurs SET pseudo = ?, rang = ?, argent = ?, points = ?, semaine = ?, set_ligue = ?, avatar_url = ? WHERE id = ?',
            [pseudo, rang, argent, points, semaine, set_ligue, avatar_url, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }
        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du joueur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un joueur
exports.deleteJoueur = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM joueurs WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }
        res.json({ message: 'Joueur supprimé' });
    } catch (error) {
        console.error('Erreur lors de la suppression du joueur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
