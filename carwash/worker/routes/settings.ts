import { Hono } from 'hono';
import { requireRole } from '../auth';

const app = new Hono<{ Env: any }>();

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM settings').all();
  return c.json({ success: true, data: results });
});

app.get('/:key', async (c) => {
  const setting = await c.env.DB.prepare('SELECT * FROM settings WHERE setting_key = ?').bind(c.req.param('key')).first();
  return c.json({ success: true, data: setting });
});

app.put('/', requireRole('admin'), async (c) => {
  const settings = await c.req.json();
  for (const [k, v] of Object.entries(settings)) {
    await c.env.DB.prepare('UPDATE settings SET setting_value = ? WHERE setting_key = ?').bind(v as string, k).run();
  }
  return c.json({ success: true });
});

export default app;
