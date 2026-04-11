const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, usuarioController.getAll);
router.get('/:id', verificarToken, usuarioController.getById);
router.post('/', verificarToken, usuarioController.create);
router.put('/:id', verificarToken, usuarioController.update);
router.delete('/:id', verificarToken, usuarioController.remove);

module.exports = router;