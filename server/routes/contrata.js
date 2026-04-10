const express = require('express');
const router = express.Router();
const contrataController = require('../controllers/contrataController');

router.get('/:id_reserva', contrataController.getByReserva);
router.post('/', contrataController.create);
router.delete('/:id_reserva/:id_dj', contrataController.remove);

module.exports = router;
