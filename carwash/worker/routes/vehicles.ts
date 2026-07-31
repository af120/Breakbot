import { Hono } from 'hono';
import { generateId } from '../utils';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM vehicles LIMIT 100').all();
  return c.json({ success: true, data: results });
});

app.get('/search', async (c) => {
  const plate = `%${c.req.query('plate')}%`;
  const { results } = await c.env.DB.prepare('SELECT * FROM vehicles WHERE license_plate LIKE ? LIMIT 20').bind(plate).all();
  return c.json({ success: true, data: results });
});

app.get('/:id', async (c) => {
  const vehicle = await c.env.DB.prepare('SELECT * FROM vehicles WHERE id = ?').bind(c.req.param('id')).first();
  if (!vehicle) return c.json({ success: false, error: 'Not found' }, 404);
  return c.json({ success: true, data: vehicle });
});

app.post('/', async (c) => {
  const { customer_id, make, model, year, color, license_plate, vehicle_type } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO vehicles (id, customer_id, make, model, year, color, license_plate, vehicle_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, customer_id, make, model, year, color, license_plate, vehicle_type, new Date().toISOString()).run();
  return c.json({ success: true, data: { id } });
});

app.put('/:id', async (c) => {
  const { make, model, year, color, license_plate, vehicle_type } = await c.req.json();
  await c.env.DB.prepare('UPDATE vehicles SET make = ?, model = ?, year = ?, color = ?, license_plate = ?, vehicle_type = ? WHERE id = ?')
    .bind(make, model, year, color, license_plate, vehicle_type, c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
