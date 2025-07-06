// routes/rides.js
const express = require('express');
const { previewRide } = require('../controllers/ridePreviewController');
const { requestRide } = require('../controllers/rideRequestController');
const { cancelRide } = require('../controllers/rideCancelController'); 
const { getRideHistory } = require('../controllers/rideHistoryController');
const { acceptRide } = require('../controllers/rideAcceptController');
const { authenticateToken, verifyDriver } = require('../middleware/middleware');
const { startRide } = require('../controllers/rideStartController');
const { completeRide } = require('../controllers/rideCompleteController');



module.exports = (io, riderSockets) => {
  const router = express.Router();

  router.post('/preview', authenticateToken, previewRide);
  router.post('/request', authenticateToken, (req, res) => requestRide(req, res, io));
  router.post('/cancel', authenticateToken, (req, res) => cancelRide(req, res, io));
  router.get('/history', authenticateToken, getRideHistory);
  router.post('/accept', authenticateToken, verifyDriver, (req, res) =>
    acceptRide(req, res, io, riderSockets)
  );
router.post('/start', authenticateToken, verifyDriver, (req, res) =>
  startRide(req, res, io, riderSockets)
);
router.post('/complete', authenticateToken, verifyDriver, (req, res) =>
  completeRide(req, res, io, riderSockets)
);


  router.post('/test-socket', (req, res) => {
    io.emit('driverAccepted', { rideId: 123, driverId: 999 });
    res.send('Emit sent');
  });

  return router;
};
