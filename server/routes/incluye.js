const express = require('express');
const router = express.Router();
const incluyeController = require('../controllers/incluyeController');

router.get('/:id_reserva', incluyeController.getByReserva);
router.post('/', incluyeController.create);
router.delete('/:id_reserva/:id_equipo', incluyeController.remove);

module.exports = router;
