const db = require('../db');

exports.acceptRide = (req, res, io) => {
  const { rideId } = req.body;
  const driverId = req.user.id;
  console.log('🔥 acceptRide called by driver', driverId, 'for ride', rideId);

  if (!rideId) return res.status(400).json({ message: 'rideId is required' });

  db.query(
    'UPDATE rides SET status = "accepted", driver_id = ? WHERE id = ? AND status = "requested"',
    [driverId, rideId],
    (err, results) => {
      console.log('⚙️ DB update results:', err, results);
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (results.affectedRows === 0) {
        console.log('❌ No rows updated: ride not found or already accepted');
        return res.status(404).json({ message: 'Ride not found or already accepted.' });
      }

      console.log('✅ Ride accepted in DB:', rideId);
      io.emit('driverAccepted', { rideId, driverId, message: 'Driver accepted the ride.' });
      io.emit('removeRide', rideId);
      return res.json({ message: 'Ride accepted successfully', rideId });
    }
  );
};
