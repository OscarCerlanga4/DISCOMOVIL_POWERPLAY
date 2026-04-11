const express = require('express');
const router = express.Router();
const djController = require('../controllers/djController');
const { verificarToken } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

router.get('/', djController.getAll);
router.get('/:id', djController.getById);
router.post('/', verificarToken, verificarAdmin, djController.create);
router.put('/:id', verificarToken, verificarAdmin, djController.update);
router.delete('/:id', verificarToken, verificarAdmin, djController.remove);

module.exports = router;
