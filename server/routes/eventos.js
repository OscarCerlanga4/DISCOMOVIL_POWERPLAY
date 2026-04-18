const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', eventoController.getAll);
router.get('/:id', eventoController.getById);
router.post('/', verificarToken, verificarAdmin, eventoController.create);
router.put('/:id', verificarToken, verificarAdmin, eventoController.update);
router.delete('/:id', verificarToken, verificarAdmin, eventoController.remove);

module.exports = router;