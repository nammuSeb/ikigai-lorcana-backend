// routes/defisRoutes.js - version complète simplifiée
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const defiService = require('../services/defiService');

// Route pour obtenir les informations de la ligue
router.get('/league-info', async (req, res) => {
    try {
        // Pour votre cas, nous n'avons plus besoin de calculer les semaines
        // Nous renvoyons simplement des informations de base
        res.json({
            message: "Ligue Lorcana en cours"
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de la ligue:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour les défis par type (defi_semaine, arene, quete)
router.get('/:type', async (req, res) => {
    const type = req.params.type;

    console.log(`Requête pour les défis de type ${type}`);

    try {
        const defis = await defiService.getDefis(type);
        console.log(`${defis.length} défis trouvés pour type=${type}`);

        res.json(defis);
    } catch (error) {
        console.error('Erreur lors de la récupération des défis:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route pour les défis d'un joueur
router.get('/player/:slug', async (req, res) => {
    const slug = req.params.slug;

    console.log(`Requête pour les défis du joueur ${slug}`);

    try {
        const playerDefis = await defiService.getPlayerDefis(slug);
        console.log(`${playerDefis.defis.length} défis trouvés pour le joueur ${slug}`);

        res.json(playerDefis);
    } catch (error) {
        console.error('Erreur lors de la récupération des défis du joueur:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route pour valider un défi pour un joueur
router.post('/validate', async (req, res) => {
    try {
        const { defiId, joueurId, points } = req.body;

        if (!defiId || !joueurId) {
            return res.status(400).json({ message: 'ID du défi et ID du joueur sont requis' });
        }

        console.log(`Validation du défi ${defiId} pour le joueur ${joueurId} avec ${points || 0} points`);

        const id = await defiService.validateDefi(defiId, joueurId, points || 0);
        res.status(201).json({
            id,
            message: 'Défi validé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la validation d\'un défi:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route pour exécuter manuellement la sélection des défis hebdomadaires (pour les admins)
router.post('/admin/select-weekly-defis', async (req, res) => {
    try {
        // Vous pourriez ajouter ici une vérification d'authentification administrateur

        const forceUpdate = req.query.force === 'true';
        console.log(`Exécution manuelle de sélection des défis (force=${forceUpdate})`);

        const result = await defiService.selectWeeklyDefis(forceUpdate);

        res.json({
            success: true,
            message: result.message,
            defis: result.selectedDefis
        });
    } catch (error) {
        console.error('Erreur lors de la sélection manuelle des défis:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour obtenir tous les défis (version admin)
router.get('/admin/all-defis', async (req, res) => {
    try {
        // Vous pourriez ajouter ici une vérification d'authentification administrateur

        const [defis] = await db.query(`
            SELECT id, nom, description, points, max_points, points_type, type, actif
            FROM defis
            ORDER BY type, actif DESC, id ASC
        `);

        res.json(defis);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les défis:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route pour mettre à jour un défi
router.put('/admin/defis/:id', async (req, res) => {
    try {
        // Vous pourriez ajouter ici une vérification d'authentification administrateur

        const { id } = req.params;
        const { nom, description, points, max_points, points_type, actif } = req.body;

        if (!nom) {
            return res.status(400).json({ message: 'Le nom du défi est requis' });
        }

        await db.query(`
            UPDATE defis
            SET nom = ?, description = ?, points = ?, max_points = ?, points_type = ?, actif = ?
            WHERE id = ?
        `, [nom, description, points, max_points, points_type, actif ? 1 : 0, id]);

        res.json({
            success: true,
            message: 'Défi mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du défi:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour ajouter un nouveau défi
router.post('/admin/defis', async (req, res) => {
    try {
        // Vous pourriez ajouter ici une vérification d'authentification administrateur

        const { nom, description, points, type, max_points, points_type, actif } = req.body;

        if (!nom || !type) {
            return res.status(400).json({ message: 'Le nom et le type du défi sont requis' });
        }

        const [result] = await db.query(`
            INSERT INTO defis (nom, description, points, type, max_points, points_type, actif)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nom, description, points, type, max_points, points_type, actif ? 1 : 0]);

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: 'Défi ajouté avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du défi:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour supprimer un défi
router.delete('/admin/defis/:id', async (req, res) => {
    try {
        // Vous pourriez ajouter ici une vérification d'authentification administrateur

        const { id } = req.params;

        // Vérifier si le défi est actif
        const [activeCheck] = await db.query(`
            SELECT COUNT(*) as count 
            FROM defis 
            WHERE id = ? AND actif = 1
        `, [id]);

        if (activeCheck[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer un défi actif. Désactivez-le d\'abord.'
            });
        }

        await db.query(`
            DELETE FROM defis
            WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Défi supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du défi:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour activer/désactiver un défi
router.put('/admin/defis/:id/toggle', async (req, res) => {
    try {
        // Vous pourriez ajouter ici une vérification d'authentification administrateur

        const { id } = req.params;

        // Récupérer l'état actuel
        const [defiState] = await db.query(`
            SELECT actif FROM defis WHERE id = ?
        `, [id]);

        if (defiState.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Défi non trouvé'
            });
        }

        // Inverser l'état
        const newState = defiState[0].actif === 1 ? 0 : 1;

        // Si on active un défi et qu'il y a déjà 4 défis actifs, désactiver un autre défi
        if (newState === 1) {
            const [activeCount] = await db.query(`
                SELECT COUNT(*) as count 
                FROM defis 
                WHERE type = 'defi_semaine' AND actif = 1
            `);

            if (activeCount[0].count >= 4) {
                // Désactiver le défi actif le plus ancien
                await db.query(`
                    UPDATE defis
                    SET actif = 0
                    WHERE id IN (
                        SELECT id FROM (
                            SELECT id
                            FROM defis
                            WHERE type = 'defi_semaine' AND actif = 1
                            ORDER BY id ASC
                            LIMIT 1
                        ) as temp
                    )
                `);
            }
        }

        // Mettre à jour l'état du défi
        await db.query(`
            UPDATE defis
            SET actif = ?
            WHERE id = ?
        `, [newState, id]);

        res.json({
            success: true,
            message: newState === 1 ? 'Défi activé avec succès' : 'Défi désactivé avec succès',
            actif: newState === 1
        });
    } catch (error) {
        console.error('Erreur lors de la modification de l\'état du défi:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour obtenir les statistiques des défis (pour l'admin)
router.get('/admin/stats', async (req, res) => {
    try {
        // Vous pourriez ajouter ici une vérification d'authentification administrateur

        // Obtenir le nombre de défis par type
        const [typeStats] = await db.query(`
            SELECT type, COUNT(*) as count
            FROM defis
            GROUP BY type
        `);

        // Obtenir le nombre de défis actifs
        const [activeStats] = await db.query(`
            SELECT COUNT(*) as activeCount
            FROM defis
            WHERE actif = 1
        `);

        // Obtenir les validations récentes
        const [recentValidations] = await db.query(`
            SELECT dv.id, d.nom as defi_nom, j.pseudo as joueur_pseudo, dv.date_validation, dv.points_gagnes
            FROM defis_valides dv
            JOIN defis d ON dv.defi_id = d.id
            JOIN joueurs j ON dv.joueur_id = j.id
            ORDER BY dv.date_validation DESC
            LIMIT 10
        `);

        res.json({
            byType: typeStats,
            activeCount: activeStats[0].activeCount,
            recentValidations
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
