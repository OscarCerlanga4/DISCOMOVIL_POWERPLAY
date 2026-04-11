const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, pagoController.getAll);
router.get('/:id', verificarToken, pagoController.getById);
router.post('/', verificarToken, pagoController.create);
router.put('/:id', verificarToken, pagoController.update);
router.delete('/:id', verificarToken, pagoController.remove);

module.exports = router;
