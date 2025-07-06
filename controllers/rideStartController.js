// controllers/rideStartController.js
const db = require('../db');

exports.startRide = (req, res, io, riderSockets) => {
  const { rideId } = req.body;
  const driverId = req.user.id;

  console.log("🚀 startRide called for ride:", rideId, "by driver:", driverId);

  if (!rideId) {
    return res.status(400).json({ message: 'rideId is required.' });
  }

  db.query('SELECT * FROM rides WHERE id = ?', [rideId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const ride = results[0];

    if (ride.driver_id !== driverId) {
      return res.status(403).json({ message: 'You are not assigned to this ride.' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Ride must be accepted before starting.' });
    }

    db.query('UPDATE rides SET status = ? WHERE id = ?', ['in_progress', rideId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating ride status' });
      }

      const riderId = ride.rider_id;
      const riderSocketId = riderSockets.get(String(riderId));
      if (riderSocketId) {
        io.to(riderSocketId).emit('rideStarted', { rideId });
        console.log(`🎯 Emitted 'rideStarted' to rider ${riderId}`);
      } else {
        console.log(`👻 Rider socket not found for ${riderId}`);
      }

      return res.json({ message: 'Ride started successfully', rideId });
    });
  });
};
