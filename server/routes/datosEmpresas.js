const express = require('express');
const router = express.Router();
const datosEmpresaController = require('../controllers/datosEmpresaController');

router.get('/', datosEmpresaController.getAll);
router.put('/', datosEmpresaController.update);

module.exports = router;
