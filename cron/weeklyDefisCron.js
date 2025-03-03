// cron/weeklyDefisCron.js simplifié
const cron = require('node-cron');
const defiService = require('../services/defiService');

/**
 * Configuration du cron job pour la sélection des défis hebdomadaires
 * Le job s'exécute tous les lundis à minuit (00:00)
 * @param {boolean} testNow - Si true, le job s'exécutera immédiatement une fois en plus du planning
 */
function initWeeklyDefisCron(testNow = false) {
    console.log('Initialisation du cron job pour les défis hebdomadaires');

    // Exécuter tous les lundis à minuit
    // Format cron: seconde(0-59) minute(0-59) heure(0-23) jour_du_mois(1-31) mois(1-12) jour_de_semaine(0-6, où 1=lundi)
    cron.schedule('0 0 0 * * 1', async () => {
        console.log('Exécution du cron job de sélection des défis hebdomadaires');
        try {
            // Forcer la mise à jour même s'il y a déjà des défis actifs
            const result = await defiService.selectWeeklyDefis(true);
            console.log(`Défis sélectionnés: ${result.selectedDefis.map(d => d.nom).join(', ')}`);
        } catch (error) {
            console.error('Erreur dans le cron job de sélection des défis:', error);
        }
    }, {
        timezone: "Europe/Paris" // Ajuster selon votre fuseau horaire
    });

    // Si testNow est vrai, exécuter immédiatement le job pour tester
    if (testNow) {
        console.log('Exécution immédiate du job pour test...');
        setTimeout(async () => {
            try {
                // Pour le test, ne pas forcer la mise à jour si des défis sont déjà actifs
                const result = await defiService.selectWeeklyDefis(false);
                console.log(`[TEST] ${result.message}`);
                console.log('[TEST] Défis actifs:', result.selectedDefis.map(d => d.nom).join(', '));
            } catch (error) {
                console.error('[TEST] Erreur lors de la sélection des défis:', error);
            }
        }, 1000); // Attendre 1 seconde pour que les logs précédents s'affichent
    }
}

module.exports = { initWeeklyDefisCron };
