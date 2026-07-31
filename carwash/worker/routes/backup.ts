import { Hono } from 'hono';
import { requireRole } from '../auth';
const app = new Hono<{ Env: any }>();
app.get('/export', requireRole('admin'), async (c) => {
  return c.json({ success: true, data: { message: 'Exporting data...' } });
});
app.post('/import', requireRole('admin'), async (c) => {
  return c.json({ success: true });
});
app.post('/clear-demo', requireRole('admin'), async (c) => {
  return c.json({ success: true });
});
export default app;
