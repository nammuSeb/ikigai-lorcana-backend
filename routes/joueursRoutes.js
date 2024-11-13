const express = require('express');
const router = express.Router();
const joueursController = require('../controllers/joueursController');

router.get('/', joueursController.getAllJoueurs);
router.get('/id/:id', joueursController.getJoueurById);
router.get('/slug/:slug', joueursController.getJoueurBySlug); // Route avec le slug
router.post('/', joueursController.createJoueur);
router.put('/:id', joueursController.updateJoueur);
router.delete('/:id', joueursController.deleteJoueur);

module.exports = router;
