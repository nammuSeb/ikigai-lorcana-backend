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

exports.getDefisBySlugAndWeek = (req, res) => {
    const slug = req.params.slug;
    const weekNumber = parseInt(req.query.week, 10) || 1;

    // Log de la requête reçue
    console.log(`[LOG] Requête reçue : Slug = ${slug}, Week = ${weekNumber}`);

    // Calcul des périodes hebdomadaires
    const { startDate, endDate } = getWeeklyPeriod(weekNumber);
    console.log(`[LOG] Période calculée : Start = ${startDate}, End = ${endDate}`);

    // Requête SQL pour trouver l'ID du joueur
    const playerQuery = `SELECT id FROM joueurs WHERE pseudo = ?`;
    const defisQuery = `
        SELECT d.id, d.nom, d.description, d.points, d.type, 
               IF(dv.id IS NOT NULL, 1, 0) AS completed
        FROM defis d
        LEFT JOIN defis_valides dv 
          ON d.id = dv.defi_id 
          AND dv.date_validation BETWEEN ? AND ?
        WHERE d.type = 'defi_semaine' 
          AND d.date_debut <= ? 
          AND d.date_fin >= ?`;

    // Recherche du joueur
    db.query(playerQuery, [slug], (err, playerResults) => {
        if (err) {
            console.error(`[ERREUR] Erreur lors de la récupération du joueur : ${err}`);
            return res.status(500).json({ message: "Erreur serveur lors de la récupération du joueur." });
        }

        if (playerResults.length === 0) {
            console.warn(`[AVERTISSEMENT] Aucun joueur trouvé avec le pseudo : ${slug}`);
            return res.status(404).json({ message: "Joueur non trouvé." });
        }

        const playerId = playerResults[0].id;
        console.log(`[LOG] Joueur trouvé : ID = ${playerId}, Slug = ${slug}`);

        // Recherche des défis valides
        db.query(defisQuery, [startDate, endDate, endDate, startDate], (err, defisResults) => {
            if (err) {
                console.error(`[ERREUR] Erreur lors de la récupération des défis : ${err}`);
                return res.status(500).json({ message: "Erreur serveur lors de la récupération des défis." });
            }

            console.log(`[LOG] Défis récupérés (${defisResults.length} résultats) :`, defisResults);

            res.json({ week: weekNumber, defis: defisResults });
        });
    });
};
