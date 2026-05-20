const express = require('express');
const router = express.Router();
const contrataController = require('../controllers/contrataController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/:id_reserva', verificarToken, verificarAdmin, contrataController.getByReserva);
router.post('/', verificarToken, verificarAdmin, contrataController.create);
router.delete('/:id_reserva/:id_dj', verificarToken, verificarAdmin, contrataController.remove);

module.exports = router;
