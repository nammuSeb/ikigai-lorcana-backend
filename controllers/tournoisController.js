const db = require('../config/db');

exports.getTournois = async (req, res) => {
    try {
        const statut = req.query.statut || 'a_venir';
        let query = '';
        let params = [];

        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        if (statut === 'a_venir') {
            query = `
                SELECT id, nom, type, date, heure, prix, participants_max, description, location, lien, statut
                FROM tournois
                WHERE 
                    (date > ? OR (date = ? AND heure > ?)) AND
                    statut = 'a_venir'
                ORDER BY date ASC, heure ASC
            `;
            params = [currentDate, currentDate, currentTime];
        } else if (statut === 'passe') {
            query = `
                SELECT id, nom, type, date, heure, prix, participants_max, description, location, lien, statut, gagnant_id
                FROM tournois
                WHERE statut = 'passe'
                ORDER BY date DESC, heure DESC
            `;
        } else {
            query = `
                SELECT id, nom, type, date, heure, prix, participants_max, description, location, lien, statut
                FROM tournois
                WHERE statut = ?
                ORDER BY date ASC, heure ASC
            `;
            params = [statut];
        }

        const [results] = await db.query(query, params);

        const formattedResults = results.map(tournoi => ({
            ...tournoi,
            date: new Date(tournoi.date).toISOString().split('T')[0],
            heure: tournoi.heure ? tournoi.heure.slice(0, 5) : null
        }));

        res.json(formattedResults);
    } catch (error) {
        console.error('Erreur lors de la récupération des tournois:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getTournoiById = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM tournois WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createTournoi = async (req, res) => {
    try {
        const { nom, type, date, heure, prix, participants_max, description, location, lien, statut } = req.body;
        const query = `
            INSERT INTO tournois 
            (nom, type, date, heure, prix, participants_max, description, location, lien, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [
            nom, type, date, heure, prix, participants_max, description, location, lien, statut || 'a_venir'
        ]);
        res.status(201).json({
            id: result.insertId,
            nom, type, date, heure, prix, participants_max, description, location, lien, statut
        });
    } catch (error) {
        console.error('Erreur lors de la création du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateTournoi = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, type, date, heure, prix, participants_max, description, location, lien, statut, gagnant_id } = req.body;
        const query = `
            UPDATE tournois 
            SET nom = ?, type = ?, date = ?, heure = ?, prix = ?, 
                participants_max = ?, description = ?, location = ?, 
                lien = ?, statut = ?, gagnant_id = ?
            WHERE id = ?
        `;
        const [result] = await db.query(query, [
            nom, type, date, heure, prix, participants_max, description,
            location, lien, statut, gagnant_id, id
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }
        res.json({
            id,
            nom, type, date, heure, prix, participants_max,
            description, location, lien, statut, gagnant_id
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.deleteTournoi = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM tournois WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }
        res.json({ message: 'Tournoi supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
