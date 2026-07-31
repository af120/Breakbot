import { Hono } from 'hono';
import { generateId } from '../utils';
const app = new Hono<{ Env: any }>();
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM testimonials').all();
  return c.json({ success: true, data: results });
});
app.post('/', async (c) => {
  const { customer_name, content, rating, is_published } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO testimonials (id, customer_name, content, rating, is_published) VALUES (?, ?, ?, ?, ?)')
    .bind(id, customer_name, content, rating, is_published ? 1 : 0).run();
  return c.json({ success: true, data: { id } });
});
app.put('/:id', async (c) => {
  const { customer_name, content, rating, is_published } = await c.req.json();
  await c.env.DB.prepare('UPDATE testimonials SET customer_name = ?, content = ?, rating = ?, is_published = ? WHERE id = ?')
    .bind(customer_name, content, rating, is_published ? 1 : 0, c.req.param('id')).run();
  return c.json({ success: true });
});
app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM testimonials WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});
export default app;
