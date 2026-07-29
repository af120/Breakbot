const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, logAudit } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-breakbot-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: `${process.env.SESSION_TIMEOUT_MINUTES || 60}m` }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Check if user is still active in database
    const user = db.prepare('SELECT id, username, name, role, status FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User account is inactive or disabled.' });
    }

    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: `Access denied. Requires ${role} privilege.` });
    }
    next();
  };
}

const requireAdmin = requireRole('admin');

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireAdmin
};
