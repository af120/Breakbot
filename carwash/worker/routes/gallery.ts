import { Hono } from 'hono';
import { generateId } from '../utils';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM gallery ORDER BY display_order ASC').all();
  return c.json({ success: true, data: results });
});

app.post('/', async (c) => {
  const { url, title, description, is_public } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO gallery (id, image_url, title, description, is_public, display_order) VALUES (?, ?, ?, ?, ?, 0)')
    .bind(id, url, title, description, is_public ? 1 : 0).run();
  return c.json({ success: true, data: { id } });
});

app.post('/upload', async (c) => {
  // basic mock for R2 upload
  return c.json({ success: true, data: { url: 'https://example.com/img.jpg' } });
});

app.put('/:id/order', async (c) => {
  const { order } = await c.req.json();
  await c.env.DB.prepare('UPDATE gallery SET display_order = ? WHERE id = ?').bind(order, c.req.param('id')).run();
  return c.json({ success: true });
});

app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM gallery WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
