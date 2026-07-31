import { Hono } from 'hono';
import { generateId } from '../utils';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM employees').all();
  return c.json({ success: true, data: results });
});

app.post('/', async (c) => {
  const { name, phone, role } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO employees (id, name, phone, role) VALUES (?, ?, ?, ?)').bind(id, name, phone, role).run();
  return c.json({ success: true, data: { id } });
});

app.put('/:id', async (c) => {
  const { name, phone, role, is_active } = await c.req.json();
  await c.env.DB.prepare('UPDATE employees SET name = ?, phone = ?, role = ?, is_active = ? WHERE id = ?').bind(name, phone, role, is_active ? 1 : 0, c.req.param('id')).run();
  return c.json({ success: true });
});

app.get('/:id/assignments', async (c) => {
  const today = new Date().toISOString().split('T')[0];
  const { results } = await c.env.DB.prepare('SELECT * FROM appointments WHERE assigned_employee_id = ? AND date(scheduled_for) = ?').bind(c.req.param('id'), today).all();
  return c.json({ success: true, data: results });
});

app.put('/:id/status', async (c) => {
  const { status } = await c.req.json();
  await c.env.DB.prepare('UPDATE employees SET is_active = ? WHERE id = ?').bind(status === 'active' ? 1 : 0, c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
