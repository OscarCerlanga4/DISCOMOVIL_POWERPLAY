const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', verificarToken, verificarAdmin, usuarioController.getAll);
router.get('/:id', verificarToken, usuarioController.getById);
router.put('/:id', verificarToken, usuarioController.update);
router.delete('/:id', verificarToken, verificarAdmin, usuarioController.remove);

module.exports = router;