const db = require('../config/db');

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

// Fonction pour obtenir les défis par type
exports.getDefisByType = (req, res) => {
    const type = req.params.type;
    const weekNumber = parseInt(req.query.week, 10) || 1;

    console.log(`[LOG] Requête reçue : Type = ${type}, Week = ${weekNumber}`);

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber);
        console.log(`[LOG] Période calculée : Start = ${startDate}, End = ${endDate}`);

        let defisQuery = '';
        let queryParams = [];

        // Requête SQL différente selon le type de défi
        if (type === 'defi_semaine') {
            defisQuery = `
                SELECT 
                    id,
                    nom,
                    description,
                    points,
                    points_type,
                    type,
                    date_debut,
                    date_fin
                FROM defis
                WHERE type = ?
                    AND date_debut <= ?
                    AND date_fin >= ?
            `;
            queryParams = [type, startDate, endDate];
        } else {
            defisQuery = `
                SELECT 
                    id,
                    nom,
                    description,
                    points,
                    points_type,
                    type
                FROM defis
                WHERE type = ?
            `;
            queryParams = [type];
        }

        console.log(`[LOG] Exécution de la requête SQL :`, defisQuery);
        console.log(`[LOG] Paramètres :`, queryParams);

        db.query(defisQuery, queryParams, (err, results) => {
            if (err) {
                console.error('[ERREUR] Erreur lors de la récupération des défis :', err);
                return res.status(500).json({
                    message: "Erreur serveur lors de la récupération des défis.",
                    error: err.message
                });
            }

            console.log(`[LOG] ${results.length} défis trouvés`);
            res.json(results);
        });
    } catch (error) {
        console.error('[ERREUR] Erreur lors du traitement :', error);
        res.status(400).json({
            message: "Erreur lors du traitement de la requête",
            error: error.message
        });
    }
};

// Fonction pour obtenir les défis d'un joueur spécifique
exports.getDefisBySlugAndWeek = (req, res) => {
    const slug = req.params.slug;
    const weekNumber = parseInt(req.query.week, 10) || 1;

    console.log(`[LOG] Requête reçue : Slug = ${slug}, Week = ${weekNumber}`);

    try {
        const { startDate, endDate } = getWeeklyPeriod(weekNumber);
        console.log(`[LOG] Période calculée : Start = ${startDate}, End = ${endDate}`);

        const playerQuery = `SELECT id FROM joueurs WHERE pseudo = ?`;
        const defisQuery = `
            SELECT 
                d.id, 
                d.nom, 
                d.description, 
                d.points, 
                d.points_type,
                d.type, 
                IF(dv.id IS NOT NULL, 1, 0) AS completed
            FROM defis d
            LEFT JOIN defis_valides dv 
                ON d.id = dv.defi_id 
                AND dv.joueur_id = ?
            WHERE d.type = 'defi_semaine' 
                AND d.date_debut <= ? 
                AND d.date_fin >= ?;
        `;

        // Recherche d'abord le joueur
        db.query(playerQuery, [slug], (err, playerResults) => {
            if (err) {
                console.error(`[ERREUR] Erreur lors de la récupération du joueur :`, err);
                return res.status(500).json({
                    message: "Erreur serveur lors de la récupération du joueur.",
                    error: err.message
                });
            }

            if (playerResults.length === 0) {
                console.warn(`[AVERTISSEMENT] Aucun joueur trouvé avec le pseudo : ${slug}`);
                return res.status(404).json({ message: "Joueur non trouvé." });
            }

            const playerId = playerResults[0].id;
            console.log(`[LOG] Joueur trouvé : ID = ${playerId}`);

            // Puis recherche les défis du joueur
            db.query(defisQuery, [playerId, startDate, endDate], (err, defisResults) => {
                if (err) {
                    console.error(`[ERREUR] Erreur lors de la récupération des défis :`, err);
                    return res.status(500).json({
                        message: "Erreur serveur lors de la récupération des défis.",
                        error: err.message
                    });
                }

                if (defisResults.length === 0) {
                    console.warn(`[AVERTISSEMENT] Aucun défi trouvé pour la semaine ${weekNumber}`);
                }

                console.log(`[LOG] ${defisResults.length} défis récupérés`);
                res.json({
                    week: weekNumber,
                    startDate,
                    endDate,
                    defis: defisResults
                });
            });
        });
    } catch (error) {
        console.error('[ERREUR] Erreur lors du traitement :', error);
        res.status(400).json({
            message: "Erreur lors du traitement de la requête",
            error: error.message
        });
    }
};
