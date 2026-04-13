const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth')

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verificarToken, authController.me)

module.exports = router;