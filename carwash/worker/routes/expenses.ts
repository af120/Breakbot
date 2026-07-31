import { Hono } from 'hono';
import { generateId } from '../utils';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const category = c.req.query('category');
  let q = 'SELECT * FROM expenses';
  let params = [];
  if (category) {
    q += ' WHERE category = ?';
    params.push(category);
  }
  const { results } = await c.env.DB.prepare(q).bind(...params).all();
  return c.json({ success: true, data: results });
});

app.post('/', async (c) => {
  const { amount, category, description, date } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO expenses (id, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, amount, category, description, date, new Date().toISOString()).run();
  return c.json({ success: true, data: { id } });
});

app.put('/:id', async (c) => {
  const { amount, category, description, date } = await c.req.json();
  await c.env.DB.prepare('UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ?')
    .bind(amount, category, description, date, c.req.param('id')).run();
  return c.json({ success: true });
});

app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
