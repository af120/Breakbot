import { Hono } from 'hono';
import { generateId } from '../utils';
import { requireRole } from '../auth';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM services WHERE is_deleted = 0 ORDER BY display_order ASC').all();
  return c.json({ success: true, data: results });
});

app.get('/:id', async (c) => {
  const service = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(c.req.param('id')).first();
  if (!service) return c.json({ success: false, error: 'Not found' }, 404);
  const { results: prices } = await c.env.DB.prepare('SELECT * FROM service_prices WHERE service_id = ?').bind(service.id).all();
  return c.json({ success: true, data: { ...service, prices } });
});

app.post('/', requireRole('admin', 'manager'), async (c) => {
  const { name, description, duration_minutes, is_active, is_public } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO services (id, name, description, duration_minutes, is_active, is_public, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
    .bind(id, name, description, duration_minutes, is_active ? 1 : 0, is_public ? 1 : 0, new Date().toISOString()).run();
  return c.json({ success: true, data: { id } });
});

app.put('/:id', requireRole('admin', 'manager'), async (c) => {
  const { name, description, duration_minutes, is_active, is_public } = await c.req.json();
  await c.env.DB.prepare('UPDATE services SET name = ?, description = ?, duration_minutes = ?, is_active = ?, is_public = ? WHERE id = ?')
    .bind(name, description, duration_minutes, is_active ? 1 : 0, is_public ? 1 : 0, c.req.param('id')).run();
  return c.json({ success: true });
});

app.delete('/:id', requireRole('admin'), async (c) => {
  await c.env.DB.prepare('UPDATE services SET is_deleted = 1 WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

app.put('/:id/order', requireRole('admin', 'manager'), async (c) => {
  const { order } = await c.req.json();
  await c.env.DB.prepare('UPDATE services SET display_order = ? WHERE id = ?').bind(order, c.req.param('id')).run();
  return c.json({ success: true });
});

app.get('/:id/prices', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM service_prices WHERE service_id = ?').bind(c.req.param('id')).all();
  return c.json({ success: true, data: results });
});

app.put('/:id/prices', requireRole('admin', 'manager'), async (c) => {
  const { prices } = await c.req.json();
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM service_prices WHERE service_id = ?').bind(id).run();
  for (const price of prices) {
    await c.env.DB.prepare('INSERT INTO service_prices (id, service_id, vehicle_type, price_iqd) VALUES (?, ?, ?, ?)')
      .bind(generateId(), id, price.vehicle_type, price.price_iqd).run();
  }
  return c.json({ success: true });
});

export default app;
