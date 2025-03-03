// services/defiService.js simplifié
const db = require('../config/db');
const weekService = require('./weekService');

/**
 * Sélectionne aléatoirement 4 défis actifs pour la semaine
 * @param {boolean} forceUpdate - Forcer la mise à jour même si des défis actifs existent déjà
 */
async function selectWeeklyDefis(forceUpdate = false) {
    try {
        console.log("Sélection des défis actifs pour la semaine");

        // Commencer une transaction pour garantir l'atomicité
        await db.query('START TRANSACTION');

        // Vérifier s'il y a déjà des défis actifs
        const [activeDefis] = await db.query(`
            SELECT COUNT(*) as count FROM defis
            WHERE type = 'defi_semaine' AND actif = 1
        `);

        // Si des défis actifs existent déjà et qu'on ne force pas la mise à jour, on s'arrête là
        if (activeDefis[0].count >= 4 && !forceUpdate) {
            console.log(`${activeDefis[0].count} défis déjà actifs, pas de mise à jour nécessaire`);
            await db.query('COMMIT');

            // Récupérer les défis actifs pour les renvoyer
            const [currentDefis] = await db.query(`
                SELECT id, nom, description, points, max_points, points_type, type
                FROM defis
                WHERE type = 'defi_semaine' AND actif = 1
                ORDER BY id ASC
            `);

            return {
                message: "Défis actifs existants conservés",
                selectedDefis: currentDefis
            };
        }

        // 1. D'abord, désactiver tous les défis hebdomadaires
        await db.query(`
            UPDATE defis 
            SET actif = 0
            WHERE type = 'defi_semaine'
        `);

        // 2. Sélectionner aléatoirement 4 défis
        const [allDefis] = await db.query(`
            SELECT id
            FROM defis
            WHERE type = 'defi_semaine'
            ORDER BY RAND()
            LIMIT 4
        `);

        if (allDefis.length < 4) {
            throw new Error(`Pas assez de défis disponibles dans la base de données (${allDefis.length} trouvés, besoin de 4)`);
        }

        // 3. Activer les défis sélectionnés
        for (const defi of allDefis) {
            await db.query(`
                UPDATE defis 
                SET actif = 1
                WHERE id = ?
            `, [defi.id]);
        }

        // Valider la transaction
        await db.query('COMMIT');

        // Récupérer les détails complets des défis sélectionnés
        const [selectedDefisDetails] = await db.query(`
            SELECT id, nom, description, points, max_points, points_type, type
            FROM defis
            WHERE id IN (${allDefis.map(d => d.id).join(',')})
            ORDER BY id ASC
        `);

        console.log(`${selectedDefisDetails.length} nouveaux défis ont été activés avec succès`);

        return {
            message: "Nouveaux défis activés avec succès",
            selectedDefis: selectedDefisDetails
        };

    } catch (error) {
        // En cas d'erreur, annuler la transaction
        await db.query('ROLLBACK');
        console.error('Erreur lors de la sélection des défis de la semaine:', error);
        throw error;
    }
}

/**
 * Récupère les défis selon leur type
 * @param {string} type - Type de défi (defi_semaine, arene, quete)
 */
async function getDefis(type) {
    try {
        console.log(`Récupération des défis de type ${type}`);

        let query;

        if (type === 'defi_semaine') {
            // Pour les défis hebdomadaires, récupérer uniquement les actifs
            query = `
                SELECT 
                    id, nom, description, points, max_points, points_type, type
                FROM defis
                WHERE type = 'defi_semaine' AND actif = 1
                ORDER BY id ASC
            `;
        } else {
            // Pour les défis permanents (arene, quete)
            query = `
                SELECT 
                    id, nom, description, points, max_points, points_type, type
                FROM defis
                WHERE type = ?
                ORDER BY id ASC
            `;
        }

        const [results] = await db.query(query, type === 'defi_semaine' ? [] : [type]);
        console.log(`${results.length} défis trouvés pour type=${type}`);

        // Si aucun défi actif n'est trouvé pour defi_semaine, en sélectionner automatiquement
        if (results.length === 0 && type === 'defi_semaine') {
            console.log("Aucun défi actif trouvé, sélection automatique...");
            await selectWeeklyDefis(true);

            // Récupérer les défis nouvellement activés
            const [newResults] = await db.query(`
                SELECT 
                    id, nom, description, points, max_points, points_type, type
                FROM defis
                WHERE type = 'defi_semaine' AND actif = 1
                ORDER BY id ASC
            `);

            console.log(`${newResults.length} défis activés automatiquement`);
            return newResults;
        }

        return results;
    } catch (error) {
        console.error('Erreur lors de la récupération des défis:', error);
        throw error;
    }
}

/**
 * Récupère les défis d'un joueur
 * @param {string} slug - Pseudo du joueur
 */
async function getPlayerDefis(slug) {
    try {
        console.log(`Récupération des défis du joueur ${slug}`);

        // S'assurer qu'il y a des défis actifs
        const activeDefis = await getDefis('defi_semaine');

        if (activeDefis.length === 0) {
            return {
                defis: []
            };
        }

        const query = `
            SELECT 
                d.id,
                d.nom,
                d.description,
                d.points,
                d.max_points,
                d.points_type,
                IF(dv.id IS NOT NULL, TRUE, FALSE) as completed
            FROM defis d
            LEFT JOIN joueurs j ON j.pseudo = ?
            LEFT JOIN defis_valides dv ON d.id = dv.defi_id 
                AND dv.joueur_id = j.id
            WHERE d.type = 'defi_semaine' AND d.actif = 1
            ORDER BY d.id ASC
        `;

        const [results] = await db.query(query, [slug]);
        console.log(`${results.length} défis trouvés pour le joueur ${slug}`);

        return {
            defis: results
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des défis du joueur:', error);
        throw error;
    }
}

/**
 * Valide un défi pour un joueur
 * @param {number} defiId - ID du défi
 * @param {number} joueurId - ID du joueur
 * @param {number} points - Points gagnés
 */
async function validateDefi(defiId, joueurId, points) {
    try {
        const [result] = await db.query(`
            INSERT INTO defis_valides (defi_id, joueur_id, date_validation, points_gagnes)
            VALUES (?, ?, NOW(), ?)
        `, [defiId, joueurId, points]);

        return result.insertId;
    } catch (error) {
        console.error('Erreur lors de la validation d\'un défi:', error);
        throw error;
    }
}

module.exports = {
    selectWeeklyDefis,
    getDefis,
    getPlayerDefis,
    validateDefi
};
