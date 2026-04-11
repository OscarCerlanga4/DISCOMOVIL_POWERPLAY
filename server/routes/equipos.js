const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', equipoController.getAll);
router.get('/:id', equipoController.getById);
router.post('/', verificarToken, verificarAdmin, equipoController.create);
router.put('/:id', verificarToken, verificarAdmin, equipoController.update);
router.delete('/:id', verificarToken, verificarAdmin, equipoController.remove);


module.exports = router;