const express = require('express')
const router = express.Router()
const disponibilidadController = require('../controllers/disponibilidadController')

router.get('/', disponibilidadController.getDisponibilidad)

module.exports = router