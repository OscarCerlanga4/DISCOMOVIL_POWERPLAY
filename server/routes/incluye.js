const express = require('express');
const router = express.Router();
const incluyeController = require('../controllers/incluyeController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/:id_reserva', verificarToken, verificarAdmin, incluyeController.getByReserva);
router.post('/', verificarToken, verificarAdmin, incluyeController.create);
router.delete('/:id_reserva/:id_equipo', verificarToken, verificarAdmin, incluyeController.remove);

module.exports = router;
