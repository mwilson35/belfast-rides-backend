const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // <-- Adjust if needed
const { authenticateToken } = require('../middleware/middleware'); // <-- Adjust if needed

const router = express.Router();

// ===============================
//        User Signup
// ===============================
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'rider'],
      (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Signup successful', userId: results.insertId });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===============================
//       Driver Signup
// ===============================
router.post('/driver-signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'driver'],
      (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Driver signup successful', userId: results.insertId });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===============================
//           User Login
// ===============================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const payload = { id: user.id, role: user.role, verified: user.verified };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', accessToken, refreshToken });
  });
});


// ===============================
//        Refresh Token Endpoint
// ===============================
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided.' });
  }

  jwt.verify(refreshToken, process.env.JWT_SECRET || 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid refresh token. Please log in again.' });
    }

    const payload = { id: decoded.id, role: decoded.role, verified: decoded.verified };
    const newAccessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '15m' }
    );

    res.json({ accessToken: newAccessToken });
  });
});

// ===============================
//      Admin Account Creation
// ===============================
router.post('/create-admin', authenticateToken, async (req, res) => {
  const { username, email, password } = req.body;

  // Only allow admin users to create new admin accounts.
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only.' });
  }

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'admin'],
      (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Admin account created successfully', userId: results.insertId });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

//password reset

const crypto = require('crypto');

router.post('/request-password-reset', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const userId = results[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt],
      (insertErr) => {
        if (insertErr) return res.status(500).json({ message: 'Token insert error' });

        // Replace this with real email logic later
        console.log(`Reset token for ${email}: http://yourfrontend.com/reset-password/${token}`);

        res.json({ message: 'Password reset link has been sent (pretend email).' });
      }
    );
  });
});

//password reset routing

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  // 1. Fetch the token
  db.query(
    'SELECT user_id, expires_at FROM password_resets WHERE token = ?',
    [token],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length === 0) return res.status(400).json({ message: 'Invalid or expired token.' });

      const { user_id, expires_at } = results[0];
      if (new Date(expires_at) < new Date()) {
        return res.status(400).json({ message: 'Token expired. Please request a new reset.' });
      }

      // 2. Hash and update the user's password
      const hashed = await bcrypt.hash(newPassword, 10);
      db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user_id], (uErr) => {
        if (uErr) return res.status(500).json({ message: 'Could not update password.' });

        // 3. Delete old tokens (so user can't replay it)
        db.query('DELETE FROM password_resets WHERE user_id = ?', [user_id]);

        return res.json({ message: 'Password has been reset successfully!' });
      });
    }
  );
});


module.exports = router;
