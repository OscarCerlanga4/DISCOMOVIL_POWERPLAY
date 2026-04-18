const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/factura/:id_factura', verificarToken, pagoController.getByFactura);
router.post('/crear-intencion', verificarToken, pagoController.crearIntencion);
router.get('/', verificarToken, verificarAdmin, pagoController.getAll);
router.get('/:id', verificarToken, pagoController.getById);
router.post('/', verificarToken, pagoController.create);
router.put('/:id', verificarToken, verificarAdmin, pagoController.update);
router.delete('/:id', verificarToken, verificarAdmin, pagoController.remove);

module.exports = router;