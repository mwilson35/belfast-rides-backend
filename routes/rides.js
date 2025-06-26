// routes/rides.js
const express = require('express');
const { previewRide } = require('../controllers/ridePreviewController');
const { requestRide } = require('../controllers/rideRequestController');
const { cancelRide } = require('../controllers/rideCancelController'); 
const { getRideHistory } = require('../controllers/rideHistoryController');


const { authenticateToken } = require('../middleware/middleware');

module.exports = (io) => {
  const router = express.Router();

  router.post('/preview', authenticateToken, previewRide);
  router.post('/request', authenticateToken, (req, res) => requestRide(req, res, io));
 router.post('/cancel', authenticateToken, (req, res) => cancelRide(req, res, io));
 router.get('/history', authenticateToken, getRideHistory);




  return router;
};
