import { Hono } from 'hono';
import { generateId } from '../utils';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const { results } = await c.env.DB.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
  return c.json({ success: true, data: results });
});

app.get('/search', async (c) => {
  const q = `%${c.req.query('q')}%`;
  const { results } = await c.env.DB.prepare('SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? LIMIT 20').bind(q, q).all();
  return c.json({ success: true, data: results });
});

app.get('/duplicates/:phone', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM customers WHERE phone = ?').bind(c.req.param('phone')).all();
  return c.json({ success: true, data: results });
});

app.get('/:id', async (c) => {
  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(c.req.param('id')).first();
  if (!customer) return c.json({ success: false, error: 'Not found' }, 404);
  return c.json({ success: true, data: customer });
});

app.post('/', async (c) => {
  const { name, phone, email, notes } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO customers (id, name, phone, email, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, name, phone, email, notes, new Date().toISOString()).run();
  return c.json({ success: true, data: { id } });
});

app.put('/:id', async (c) => {
  const { name, phone, email, notes } = await c.req.json();
  await c.env.DB.prepare('UPDATE customers SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?')
    .bind(name, phone, email, notes, c.req.param('id')).run();
  return c.json({ success: true });
});

app.get('/:id/vehicles', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM vehicles WHERE customer_id = ?').bind(c.req.param('id')).all();
  return c.json({ success: true, data: results });
});

app.get('/:id/appointments', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM appointments WHERE customer_id = ? ORDER BY scheduled_for DESC').bind(c.req.param('id')).all();
  return c.json({ success: true, data: results });
});

export default app;
