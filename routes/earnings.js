const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/middleware');
const earningsController = require('../controllers/earningsController');

router.get('/', authenticateToken, earningsController.getEarnings);

module.exports = router;
