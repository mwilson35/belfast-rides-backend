const db = require('../db');

exports.acceptRide = (req, res, io, riderSockets) => {
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

      // Now get the rider ID
      db.query('SELECT rider_id FROM rides WHERE id = ?', [rideId], (err, result) => {
        if (err || result.length === 0) {
          console.error('Error getting rider ID:', err);
          return res.status(500).json({ message: 'Error retrieving rider info' });
        }

        const riderId = result[0].rider_id;
        const riderSocketId = riderSockets.get(String(riderId));

        if (riderSocketId) {
          io.to(riderSocketId).emit('driverAccepted', {
            rideId,
            driverId,
            message: 'Your driver has accepted the ride.',
          });
          console.log(`🎯 Emitted 'driverAccepted' to rider ${riderId}`);
        } else {
          console.log(`👻 No socket found for rider ${riderId}. Rider may be offline.`);
        }

        // Still OK to emit globally if needed, e.g. to remove ride from the available pool
        io.emit('removeRide', rideId);

        return res.json({ message: 'Ride accepted successfully', rideId });
      });
    }
  );
};
