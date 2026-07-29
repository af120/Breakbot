const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, logAudit } = require('../db');
const { generateToken, authenticateToken, requireAdmin } = require('../auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    logAudit(username, 'LOGIN_FAILED', 'Invalid password attempted', req.ip);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Update last login
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const token = generateToken(user);
  logAudit(user.username, 'LOGIN_SUCCESS', `User ${user.username} logged in`, req.ip, user.id);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  logAudit(req.user.username, 'LOGOUT', `User ${req.user.username} logged out`, req.ip, req.user.id);
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/users (Admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, status, created_at, last_login FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// POST /api/auth/users (Admin only)
router.post('/users', authenticateToken, requireAdmin, (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'Username, password, name, and role are required.' });
  }
  if (!['admin', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either admin or employee.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO users (username, password_hash, name, role, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(username.trim(), hash, name.trim(), role);

  logAudit(req.user.username, 'CREATE_USER', `Created user ${username} with role ${role}`, req.ip, req.user.id);
  res.status(201).json({ message: 'User created successfully', userId: info.lastInsertRowid });
});

// PUT /api/auth/users/:id (Admin only)
router.put('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, role, status, password } = req.body;

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (password && password.trim() !== '') {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
  }

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        role = COALESCE(?, role),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(name ? name.trim() : null, role || null, status || null, id);

  logAudit(req.user.username, 'UPDATE_USER', `Updated user ID ${id}`, req.ip, req.user.id);
  res.json({ message: 'User updated successfully' });
});

module.exports = router;
