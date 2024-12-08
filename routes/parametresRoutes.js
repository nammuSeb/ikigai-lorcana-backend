const express = require('express');
const router = express.Router();
const con = require('../config/db');

// Récupérer le message actuel
router.get('/message', (req, res) => {
    const query = 'SELECT message FROM parametres WHERE id = 1';
    con.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération du message :', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: results[0]?.message || '' });
    });
});

// Mettre à jour le message
router.put('/message', (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message manquant' });
    }

    const query = 'UPDATE parametres SET message = ? WHERE id = 1';
    con.query(query, [message], (error) => {
        if (error) {
            console.error('Erreur lors de la mise à jour du message :', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: 'Message mis à jour avec succès' });
    });
});


router.get('/background-settings', (req, res) => {
    const query = 'SELECT background_image_url, background_opacity, blend_color FROM parametres WHERE id = 1';
    con.query(query, (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des paramètres :', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json(results[0]);
    });
});

router.put('/background-settings', (req, res) => {
    const { backgroundImageUrl, backgroundOpacity, blendColor } = req.body;

    if (!backgroundImageUrl || typeof backgroundImageUrl !== 'string') {
        return res.status(400).json({ message: 'URL de l\'image invalide ou manquante' });
    }

    if (backgroundOpacity === undefined || isNaN(backgroundOpacity) || backgroundOpacity < 0 || backgroundOpacity > 1) {
        return res.status(400).json({ message: 'Opacité invalide. Doit être entre 0 et 1.' });
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(blendColor)) {
        return res.status(400).json({ message: 'Couleur de blend invalide. Doit être au format hexadécimal (#RRGGBB).' });
    }

    const query = `
        UPDATE parametres
        SET background_image_url = ?, background_opacity = ?, blend_color = ?
        WHERE id = 1
    `;

    con.query(query, [backgroundImageUrl, backgroundOpacity, blendColor], (error) => {
        if (error) {
            console.error('Erreur lors de la mise à jour des paramètres :', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: 'Paramètres mis à jour avec succès' });
    });
});



module.exports = router;
