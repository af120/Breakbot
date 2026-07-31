import { Hono } from 'hono';
import { generateId, createAuditLog } from '../utils';
import { requireRole } from '../auth';

const app = new Hono<{ Env: any }>();

app.post('/', async (c) => {
  const { appointment_id, amount, method, reference, notes } = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare('INSERT INTO payments (id, appointment_id, amount, method, reference_number, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, appointment_id, amount, method, reference, notes, new Date().toISOString()).run();
  return c.json({ success: true, data: { id } });
});

app.get('/:appointmentId', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM payments WHERE appointment_id = ?').bind(c.req.param('appointmentId')).all();
  return c.json({ success: true, data: results });
});

app.put('/:id', requireRole('admin', 'manager'), async (c) => {
  const { amount, method, notes, reason } = await c.req.json();
  const id = c.req.param('id');
  const user = c.get('user');
  const old = await c.env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first();
  await c.env.DB.prepare('UPDATE payments SET amount = ?, method = ?, notes = ? WHERE id = ?').bind(amount, method, notes, id).run();
  await createAuditLog(c.env.DB, 'update_payment', user.userId, 'System', 'payments', id, old, { amount, method, notes }, reason);
  return c.json({ success: true });
});

app.get('/receipt/:appointmentId', async (c) => {
  const data = await c.env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(c.req.param('appointmentId')).first();
  return c.json({ success: true, data });
});

export default app;
