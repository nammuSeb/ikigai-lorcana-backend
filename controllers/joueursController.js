const db = require('../config/db');


// Helper function to calculate custom week, session, and league based on a specific date
const getCustomWeekRange = (date) => {
    const customStartDay = 5; // Start from Friday
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const firstFriday = new Date(yearStart.setDate(yearStart.getDate() + ((customStartDay - yearStart.getDay() + 7) % 7)));

    const diffDays = Math.floor((date - firstFriday) / (24 * 60 * 60 * 1000));
    const currentWeek = Math.ceil((diffDays + 1) / 7);
    const currentSession = Math.ceil(currentWeek / 4);
    const currentLeague = Math.ceil(currentSession / 3);

    const weekStartDate = new Date(firstFriday.getTime() + (currentWeek - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    return { week: currentWeek, session: currentSession, league: currentLeague, start: weekStartDate, end: weekEndDate };
};

// Controller to get player data by slug
exports.getJoueurBySlug = (req, res) => {
    const { slug } = req.params;
    const { week, session, league, start, end } = getCustomWeekRange(new Date());

    db.query('SELECT * FROM joueurs WHERE pseudo = ?', [slug], (err, joueurResults) => {
        if (err || joueurResults.length === 0) {
            console.error("Error fetching player data:", err);
            return res.status(500).json({ message: "Error fetching player data" });
        }

        const joueurData = joueurResults[0];
        joueurData.session = session;
        joueurData.league = league;

        // Fetch weekly challenges
        db.query('SELECT * FROM defis WHERE type = "defi_semaine"', (err, defisResults) => {
            if (err) {
                console.error("Error fetching weekly challenges:", err);
                return res.status(500).json({ message: "Error fetching weekly challenges" });
            }

            // Fetch completed challenges for the current week
            db.query(
                `SELECT WEEK(classements.start_date, 3) AS week, SUM(classements.points) AS total_points 
                 FROM classements 
                 WHERE joueur_id = ? 
                 AND classements.start_date >= ? 
                 AND classements.end_date <= ?
                 GROUP BY week`,
                [joueurData.id, start, end],
                (err, pointsResults) => {
                    if (err) {
                        console.error("Error fetching weekly points:", err);
                        return res.status(500).json({ message: "Error fetching weekly points" });
                    }

                    // Creating an object for points by week
                    const pointsByWeek = {};
                    pointsResults.forEach(row => {
                        pointsByWeek[row.week] = row.total_points;
                    });

                    joueurData.pointsByWeek = pointsByWeek;
                    joueurData.session = session;
                    joueurData.league = league;

                    console.log("Final player data to return:", joueurData);
                    res.json(joueurData);
                }
            );

        });
    });
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
