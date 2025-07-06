// controllers/rideCompleteController.js
const db = require('../db');
const { calculateFare } = require('../utils/fareUtils');

exports.completeRide = (req, res, io, riderSockets) => {
  const driverId = req.user.id;
  const { rideId } = req.body;

  if (!rideId) {
    return res.status(400).json({ message: 'rideId is required' });
  }

  db.query('SELECT * FROM rides WHERE id = ?', [rideId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const ride = results[0];

    if (ride.driver_id !== driverId) {
      return res.status(403).json({ message: 'Not authorized to complete this ride' });
    }

    if (!['accepted', 'in_progress'].includes(ride.status)) {
      return res.status(400).json({ message: 'Ride must be accepted or in progress' });
    }

    const pricing = {
      base_fare: 2.5,
      per_km_rate: 1.2,
      surge_multiplier: ride.surge_multiplier || 1.0,
    };

    const fare = calculateFare(ride.distance || 0, pricing);

    db.query(
      'UPDATE rides SET status = ?, fare = ?, payment_status = ? WHERE id = ?',
      ['completed', fare, 'processed', rideId],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error updating ride' });
        }

        const riderSocketId = riderSockets.get(String(ride.rider_id));
        if (riderSocketId) {
          io.to(riderSocketId).emit('rideCompleted', {
            rideId,
            fare,
            message: 'Your ride is complete',
          });
          console.log(`🎯 Emitted 'rideCompleted' to rider ${ride.rider_id}`);
        }

        res.json({ message: 'Ride completed successfully', fare });
      }
    );
  });
};
