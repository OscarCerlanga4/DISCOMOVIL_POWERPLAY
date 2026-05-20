const express = require('express');
const router = express.Router();
const datosEmpresaController = require('../controllers/datosEmpresaController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', datosEmpresaController.getAll);
router.put('/', verificarToken, verificarAdmin, datosEmpresaController.update);

module.exports = router;
