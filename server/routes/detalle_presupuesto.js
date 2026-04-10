const express = require('express');
const router = express.Router();
const detalleController = require('../controllers/detalle_presupuestoController');

router.get('/', detalleController.getAll);
router.get('/:id', detalleController.getById);
router.post('/', detalleController.create);
router.put('/:id', detalleController.update);
router.delete('/:id', detalleController.remove);

module.exports = router;
