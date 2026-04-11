const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', verificarToken, verificarAdmin, facturaController.getAll);
router.get('/mis-facturas', verificarToken, facturaController.getMisFacturas);
router.get('/:id', verificarToken, facturaController.getById);
router.post('/', verificarToken, verificarAdmin, facturaController.create);
router.put('/:id', verificarToken, verificarAdmin, facturaController.update);
router.delete('/:id', verificarToken, verificarAdmin, facturaController.remove);

module.exports = router;
