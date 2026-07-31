import { Hono } from 'hono';
import { verifyPassword, generateToken, hashPassword, requireRole } from '../auth';
import { generateId } from '../utils';

const app = new Hono<{ Env: any }>();

app.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  const db = c.env.DB;
  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  }

  const token = await generateToken(user.id, user.role, c.env.JWT_SECRET);
  const userData = {
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.name,
    is_active: user.active
  };
  return c.json({ success: true, data: { user: userData, token } });
});

app.post('/logout', (c) => c.json({ success: true }));

app.get('/me', async (c) => {
  const userPayload = c.get('user');
  const user = await c.env.DB.prepare('SELECT id, username, role, name as full_name, active as is_active FROM users WHERE id = ?').bind(userPayload.userId).first();
  return c.json({ success: true, data: user });
});

app.put('/change-password', async (c) => {
  const userPayload = c.get('user');
  const { oldPassword, newPassword } = await c.req.json();
  const user = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(userPayload.userId).first();
  if (!(await verifyPassword(oldPassword, user.password_hash))) {
    return c.json({ success: false, error: 'Invalid old password' }, 400);
  }
  const newHash = await hashPassword(newPassword);
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, userPayload.userId).run();
  return c.json({ success: true });
});

app.post('/users', requireRole('admin'), async (c) => {
  const { username, password, role, fullName } = await c.req.json();
  const id = generateId();
  const hash = await hashPassword(password);
  await c.env.DB.prepare('INSERT INTO users (id, username, password_hash, role, full_name, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)')
    .bind(id, username, hash, role, fullName, new Date().toISOString()).run();
  return c.json({ success: true, data: { id } });
});

app.get('/users', requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, username, role, full_name, is_active, created_at FROM users').all();
  return c.json({ success: true, data: results });
});

app.put('/users/:id', requireRole('admin'), async (c) => {
  const { role, fullName, isActive } = await c.req.json();
  await c.env.DB.prepare('UPDATE users SET role = ?, full_name = ?, is_active = ? WHERE id = ?').bind(role, fullName, isActive ? 1 : 0, c.req.param('id')).run();
  return c.json({ success: true });
});

app.delete('/users/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  if (id === c.get('user').userId) return c.json({ success: false, error: 'Cannot deactivate self' }, 400);
  await c.env.DB.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default app;
