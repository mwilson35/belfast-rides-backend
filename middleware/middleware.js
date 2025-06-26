const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
};

const verifyDriver = (req, res, next) => {
  if (req.user.role !== 'driver') return res.status(403).json({ message: 'Only drivers allowed.' });
  if (!req.user.verified) return res.status(403).json({ message: 'Driver not verified.' });
  next();
};

module.exports = { authenticateToken, verifyDriver };
