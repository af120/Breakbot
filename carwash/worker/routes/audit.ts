import { Hono } from 'hono';
import { requireRole } from '../auth';
const app = new Hono<{ Env: any }>();
app.get('/', requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  return c.json({ success: true, data: results });
});
export default app;
