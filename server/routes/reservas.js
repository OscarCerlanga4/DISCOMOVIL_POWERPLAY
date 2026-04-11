const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', verificarToken, verificarAdmin, reservaController.getAll);
router.get('/:id', verificarToken, reservaController.getById);
router.post('/', verificarToken, reservaController.create);
router.put('/:id', verificarToken, verificarAdmin, reservaController.update);
router.delete('/:id', verificarToken, verificarAdmin, reservaController.remove);

module.exports = router;