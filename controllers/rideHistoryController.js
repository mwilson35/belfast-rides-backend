const db = require('../db');

exports.getRideHistory = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole !== 'rider') {
    return res.status(403).json({ message: 'Only riders can view ride history' });
  }

  db.query(
    'SELECT id, pickup_location, destination, requested_at, fare, status FROM rides WHERE rider_id = ? ORDER BY requested_at DESC',
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching ride history:', err);
        return res.status(500).json({ message: 'Failed to fetch ride history' });
      }

      res.json(results);
    }
  );
};
