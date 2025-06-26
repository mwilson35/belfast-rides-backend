const db = require('../db');
console.log('Cancel controller loaded');

exports.cancelRide = (req, res, io) => {

  const userId = req.user.id;
  const userRole = req.user.role;
  const { rideId } = req.body;

  if (!rideId) {
    return res.status(400).json({ message: 'Missing rideId' });
  }

  db.query('SELECT * FROM rides WHERE id = ?', [rideId], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const ride = results[0];

    const isRider = userRole === 'rider' && ride.rider_id === userId;
    const isDriver = userRole === 'driver' && ride.driver_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isRider && !isDriver) {
      return res.status(403).json({ message: 'Forbidden: You cannot cancel this ride' });
    }

    if (ride.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed ride' });
    }

    db.query('UPDATE rides SET status = ? WHERE id = ?', ['cancelled', rideId], (updateErr) => {
      if (updateErr) {
        console.error('Update error:', updateErr);
        return res.status(500).json({ message: 'Error canceling ride' });
      }

      

      io.to(rideId).emit('rideCancelled', { rideId, cancelledBy: isAdmin ? 'admin' : userRole });

      if (isRider) {
        io.to(rideId).emit('rideCancelledByRider', { rideId });
      } else if (isDriver) {
        io.to(rideId).emit('rideCancelledByDriver', { rideId });
      }

      io.emit('removeRide', rideId);

      return res.json({ message: 'Ride canceled successfully' });
    });
  });
};
