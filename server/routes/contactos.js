const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');

router.get('/', contactoController.getAll);
router.get('/:id', contactoController.getById);
router.post('/', contactoController.create);
router.delete('/:id', contactoController.remove);

module.exports = router;
