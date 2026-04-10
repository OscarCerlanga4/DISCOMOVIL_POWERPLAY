const express = require('express');
const router = express.Router();
const presupuestoController = require('../controllers/presupuestoController');

router.get('/', presupuestoController.getAll);
router.get('/:id', presupuestoController.getById);
router.post('/', presupuestoController.create);
router.put('/:id', presupuestoController.update);
router.delete('/:id', presupuestoController.remove);

module.exports = router;
