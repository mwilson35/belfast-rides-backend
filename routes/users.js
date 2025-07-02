// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/middleware');


router.put('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  const query = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
  db.query(query, [username, email, userId], (err, results) => {
    if (err) {
      console.error('Profile update error:', err);
      return res.status(500).json({ message: 'Failed to update profile' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
});


router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  // Make sure the column name exactly matches the database.
  const query = "SELECT id, username, email, profilePicUrl FROM users WHERE id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({ message: "Failed to retrieve profile." });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("Profile fetched:", results[0]);
    res.json(results[0]);
  });
});

module.exports = router;