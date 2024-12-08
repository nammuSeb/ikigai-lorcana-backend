const express = require('express');
const router = express.Router();
const defisController = require('../controllers/defisController');

// Route pour obtenir les défis par type (arene, quete, defi_semaine)
router.get('/:type', defisController.getDefisByType);

// Garder aussi la route existante si nécessaire
router.get('/slug/:slug', defisController.getDefisBySlugAndWeek);

module.exports = router;
