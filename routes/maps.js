const express = require('express');
const router = express.Router();
const { getStaticMapUrl } = require('../controllers/mapController');
console.log('getStaticMapUrl is', typeof getStaticMapUrl);

router.get('/staticmap', getStaticMapUrl);

module.exports = router;
