const express = require('express');
const router = express.Router();
const { usarToken } = require('../controllers/tokenController');

router.get('/:token/usar', usarToken);

module.exports = router;