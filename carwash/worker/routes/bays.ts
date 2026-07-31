import { Hono } from 'hono';
import { generateId } from '../utils';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM washing_bays').all();
  return c.json({ success: true, data: results });
});

app.get('/:id', async (c) => {
  const bay = await c.env.DB.prepare('SELECT * FROM washing_bays WHERE id = ?').bind(c.req.param('id')).first();
  return c.json({ success: true, data: bay });
});

app.post('/', async (c) => {
  const { name, is_active } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO washing_bays (id, name, is_active) VALUES (?, ?, ?)').bind(id, name, is_active ? 1 : 0).run();
  return c.json({ success: true, data: { id } });
});

app.put('/:id', async (c) => {
  const { name, is_active } = await c.req.json();
  await c.env.DB.prepare('UPDATE washing_bays SET name = ?, is_active = ? WHERE id = ?').bind(name, is_active ? 1 : 0, c.req.param('id')).run();
  return c.json({ success: true });
});

app.put('/:id/status', async (c) => {
  const { status } = await c.req.json();
  await c.env.DB.prepare('UPDATE washing_bays SET current_status = ? WHERE id = ?').bind(status, c.req.param('id')).run();
  return c.json({ success: true });
});

app.post('/:id/blocks', async (c) => {
  return c.json({ success: true });
});

app.delete('/blocks/:id', async (c) => {
  return c.json({ success: true });
});

export default app;
