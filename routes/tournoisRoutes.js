const express = require('express');
const router = express.Router();
const tournoiController = require('../controllers/tournoisController');

router.get('/', tournoiController.getTournois);
router.get('/:id', tournoiController.getTournoiById);
router.post('/', tournoiController.createTournoi);
router.put('/:id', tournoiController.updateTournoi);
router.delete('/:id', tournoiController.deleteTournoi);

module.exports = router;
