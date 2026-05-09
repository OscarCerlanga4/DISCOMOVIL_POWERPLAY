const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', verificarToken, verificarAdmin, contactoController.getAll);
router.get('/:id', verificarToken, verificarAdmin, contactoController.getById);
router.post('/', contactoController.create);
router.put('/:id/responder', verificarToken, verificarAdmin, contactoController.responder);
router.delete('/:id', verificarToken, verificarAdmin, contactoController.remove);

module.exports = router;