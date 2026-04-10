const express = require('express');
const router = express.Router();
const djController = require('../controllers/djController');

router.get('/', djController.getAll);
router.get('/:id', djController.getById);
router.post('/', djController.create);
router.put('/:id', djController.update);
router.delete('/:id', djController.remove);

module.exports = router;
