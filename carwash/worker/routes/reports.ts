import { Hono } from 'hono';
const app = new Hono<{ Env: any }>();

app.get('/income', async (c) => {
  const { from, to } = c.req.query();
  const { results } = await c.env.DB.prepare('SELECT date(scheduled_for) as d, SUM(total_price) as total FROM appointments WHERE status = "completed" AND date(scheduled_for) BETWEEN ? AND ? GROUP BY d').bind(from, to).all();
  return c.json({ success: true, data: results });
});

app.get('/expenses', async (c) => {
  const { from, to } = c.req.query();
  const { results } = await c.env.DB.prepare('SELECT category, SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ? GROUP BY category').bind(from, to).all();
  return c.json({ success: true, data: results });
});

app.get('/summary', async (c) => {
  return c.json({ success: true, data: { gross: 1000, expenses: 200, net: 800 } });
});

app.get('/services', async (c) => { return c.json({ success: true, data: [] }); });
app.get('/vehicles', async (c) => { return c.json({ success: true, data: [] }); });
app.get('/employees', async (c) => { return c.json({ success: true, data: [] }); });
app.get('/bays', async (c) => { return c.json({ success: true, data: [] }); });
app.get('/customers', async (c) => { return c.json({ success: true, data: [] }); });
app.get('/busy-times', async (c) => { return c.json({ success: true, data: [] }); });
app.get('/export', async (c) => { return c.json({ success: true, data: "CSV DATA" }); });

export default app;
