const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, reservaController.getAll);
router.get('/:id', verificarToken, reservaController.getById);
router.post('/', verificarToken, reservaController.create);
router.put('/:id', verificarToken, reservaController.update);
router.delete('/:id', verificarToken, reservaController.remove);

module.exports = router;