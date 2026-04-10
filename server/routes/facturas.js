const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');

router.get('/', facturaController.getAll);
router.get('/:id', facturaController.getById);
router.post('/', facturaController.create);
router.put('/:id', facturaController.update);
router.delete('/:id', facturaController.remove);

module.exports = router;
