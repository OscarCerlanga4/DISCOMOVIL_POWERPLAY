const express = require('express');
const router = express.Router();
const presupuestoController = require('../controllers/presupuestoController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', verificarToken, verificarAdmin, presupuestoController.getAll);
router.get('/mis-presupuestos', verificarToken, presupuestoController.getMisPresupuestos);
router.get('/:id', verificarToken, presupuestoController.getById);
router.post('/', verificarToken, verificarAdmin, presupuestoController.create);
router.put('/:id', verificarToken, presupuestoController.update);
router.delete('/:id', verificarToken, verificarAdmin, presupuestoController.remove);

module.exports = router;
