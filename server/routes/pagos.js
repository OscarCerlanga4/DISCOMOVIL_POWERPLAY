const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

router.get('/', pagoController.getAll);
router.get('/:id', pagoController.getById);
router.post('/', pagoController.create);
router.put('/:id', pagoController.update);
router.delete('/:id', pagoController.remove);

module.exports = router;
