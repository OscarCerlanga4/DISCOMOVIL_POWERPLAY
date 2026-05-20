const express = require('express');
const router = express.Router();
const detalleController = require('../controllers/detalle_presupuestoController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', verificarToken, verificarAdmin, detalleController.getAll);
router.get('/:id', verificarToken, verificarAdmin, detalleController.getById);
router.post('/', verificarToken, verificarAdmin, detalleController.create);
router.put('/:id', verificarToken, verificarAdmin, detalleController.update);
router.delete('/:id', verificarToken, verificarAdmin, detalleController.remove);

module.exports = router;
