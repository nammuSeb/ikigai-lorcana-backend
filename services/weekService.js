// services/weekService.js
const db = require('../config/db');

// Dates de référence pour la ligue actuelle
// Ajustez ces dates pour qu'elles correspondent à la période actuelle
const CURRENT_LEAGUE_START = new Date('2025-02-01'); // Début du mois de février 2025
const CURRENT_LEAGUE_END = new Date('2025-03-31');   // Fin du mois de mars 2025
const WEEKS_IN_LEAGUE = 8;

/**
 * Calcule la semaine actuelle de la ligue
 * @returns {number} Le numéro de semaine (1-8)
 */
function calculateCurrentWeek() {
    const now = new Date();

    // Si on est avant le début de la ligue, retourner 1
    if (now < CURRENT_LEAGUE_START) {
        return 1;
    }

    // Si on est après la fin de la ligue, retourner la dernière semaine
    if (now > CURRENT_LEAGUE_END) {
        return WEEKS_IN_LEAGUE;
    }

    // Calculer le nombre de jours depuis le début de la ligue
    const diffTime = now.getTime() - CURRENT_LEAGUE_START.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return Math.min(Math.max(1, weekNumber), WEEKS_IN_LEAGUE);
}

/**
 * Obtient les dates de début et de fin pour une semaine spécifique
 * @param {number} weekNumber - Numéro de la semaine (1-8)
 * @returns {Object} Les dates de début et de fin
 */
function getWeeklyPeriod(weekNumber = 1) {
    if (weekNumber < 1 || weekNumber > WEEKS_IN_LEAGUE) {
        throw new Error(`Le numéro de semaine doit être compris entre 1 et ${WEEKS_IN_LEAGUE}.`);
    }

    // Calculer le début de la semaine (Jour de début de la ligue + (semaine-1) * 7 jours)
    const startOfPeriod = new Date(CURRENT_LEAGUE_START);
    startOfPeriod.setDate(CURRENT_LEAGUE_START.getDate() + (7 * (weekNumber - 1)));

    // Calculer la fin de la semaine (début + 6 jours)
    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(startOfPeriod.getDate() + 6);

    return {
        startDate: startOfPeriod.toISOString().split('T')[0],
        endDate: endOfPeriod.toISOString().split('T')[0],
    };
}

/**
 * Récupère les informations de configuration de la ligue
 * @returns {Object} Informations de la ligue
 */
async function getLeagueInfo() {
    // Pour l'instant, on retourne des valeurs fixes
    // À l'avenir, on pourrait les récupérer depuis la base de données
    const currentWeek = calculateCurrentWeek();
    const { startDate, endDate } = getWeeklyPeriod(currentWeek);

    return {
        startDate: CURRENT_LEAGUE_START.toISOString().split('T')[0],
        endDate: CURRENT_LEAGUE_END.toISOString().split('T')[0],
        currentWeek: currentWeek,
        totalWeeks: WEEKS_IN_LEAGUE,
        currentWeekStart: startDate,
        currentWeekEnd: endDate
    };
}

module.exports = {
    calculateCurrentWeek,
    getWeeklyPeriod,
    getLeagueInfo
};
