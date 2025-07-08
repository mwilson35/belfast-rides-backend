// controllers/rideCompleteController.js
const db = require('../db');
const { calculateFare } = require('../utils/fareUtils');
const { getWeekStartAndEnd } = require('../utils/dateUtils');

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

        // Insert base fare into driver earnings
        db.query(
          'INSERT INTO driver_earnings (driver_id, ride_id, amount) VALUES (?, ?, ?)',
          [driverId, rideId, fare],
          (err) => {
            if (err) {
              console.error('Error inserting into driver_earnings:', err.message);
              return res.status(500).json({ message: 'Error recording earnings' });
            }

            const currentDate = new Date();
            const { formattedWeekStart, formattedWeekEnd } = getWeekStartAndEnd(currentDate);

            db.query(
              `INSERT INTO weekly_earnings (driver_id, week_start, week_end, total_earnings)
               VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE total_earnings = total_earnings + ?`,
              [driverId, formattedWeekStart, formattedWeekEnd, fare, fare],
              (err) => {
                if (err) {
                  console.error('Error updating weekly earnings:', err.message);
                  return res.status(500).json({ message: 'Error updating weekly earnings' });
                }

                const riderSocketId = riderSockets.get(String(ride.rider_id));
                if (riderSocketId) {
io.to(riderSocketId).emit('rideCompleted', {
  rideId,
  fare,
  driverId, // 👈 add this line
  message: 'Your ride is complete',
});

                  console.log(`🎯 Emitted 'rideCompleted' to rider ${ride.rider_id}`);
                }

                res.json({ message: 'Ride completed successfully', fare });
              }
            );
          }
        );
      }
    );
  });
};
