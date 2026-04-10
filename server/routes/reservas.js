const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');

router.get('/', reservaController.getAll);
router.get('/:id', reservaController.getById);
router.post('/', reservaController.create);
router.put('/:id', reservaController.update);
router.delete('/:id', reservaController.remove);

module.exports = router;