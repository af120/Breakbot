import { Hono } from 'hono';
import { requireRole } from '../auth';
const app = new Hono<{ Env: any }>();
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM content_blocks').all();
  return c.json({ success: true, data: results });
});
app.put('/', requireRole('admin'), async (c) => {
  const { key, content } = await c.req.json();
  await c.env.DB.prepare('UPDATE content_blocks SET content = ? WHERE block_key = ?').bind(content, key).run();
  return c.json({ success: true });
});
export default app;
