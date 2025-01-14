const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Récupérer le message actuel
router.get('/message', async (req, res) => {
    try {
        const query = 'SELECT message FROM parametres WHERE id = 1';
        const [results] = await db.query(query);
        res.json({ message: results[0]?.message || '' });
    } catch (error) {
        console.error('Erreur lors de la récupération du message :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Mettre à jour le message
router.put('/message', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ message: 'Message manquant' });
        }

        const query = 'UPDATE parametres SET message = ? WHERE id = 1';
        await db.query(query, [message]);
        res.json({ message: 'Message mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du message :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les paramètres de l'arrière-plan
router.get('/background-settings', async (req, res) => {
    try {
        const query = 'SELECT background_image_url, background_opacity, blend_color FROM parametres WHERE id = 1';
        const [results] = await db.query(query);
        res.json(results[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération des paramètres :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Mettre à jour les paramètres de l'arrière-plan
router.put('/background-settings', async (req, res) => {
    try {
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

        await db.query(query, [backgroundImageUrl, backgroundOpacity, blendColor]);
        res.json({ message: 'Paramètres mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
