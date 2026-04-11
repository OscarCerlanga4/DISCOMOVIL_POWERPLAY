const express = require('express');
const router = express.Router();
const presupuestoController = require('../controllers/presupuestoController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, presupuestoController.getAll);
router.get('/:id', verificarToken, presupuestoController.getById);
router.post('/', verificarToken, presupuestoController.create);
router.put('/:id', verificarToken, presupuestoController.update);
router.delete('/:id', verificarToken, presupuestoController.remove);

module.exports = router;
