const express = require('express');
const router = express.Router();
const defisController = require('../controllers/defisController'); // Assurez-vous que ce chemin est correct

// Route pour obtenir les défis par slug et semaine
router.get('/slug/:slug', defisController.getDefisBySlugAndWeek);

module.exports = router;
