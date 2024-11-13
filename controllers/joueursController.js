const db = require('../config/db');

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

exports.getJoueurBySlug = (req, res) => {
    const { slug } = req.params;
    console.log("Player :", slug)
    db.query('SELECT * FROM joueurs WHERE pseudo = ?', [slug], (err, results) => {
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
