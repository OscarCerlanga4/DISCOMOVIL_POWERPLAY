const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.post('/', verificarToken, verificarAdmin, uploadController.uploadImagen);

module.exports = router;