import { Hono } from 'hono';
import { generateId, generateBookingRef } from '../utils';

const app = new Hono<{ Env: any }>();

app.post('/book', async (c) => {
  const { name, phone, vehicle_type, make, model, plate, service_id, scheduled_for, notes } = await c.req.json();
  const db = c.env.DB;
  
  let customer = await db.prepare('SELECT id FROM customers WHERE phone = ?').bind(phone).first();
  let customer_id = customer?.id;
  if (!customer_id) {
    customer_id = generateId();
    await db.prepare('INSERT INTO customers (id, name, phone, created_at) VALUES (?, ?, ?, ?)').bind(customer_id, name, phone, new Date().toISOString()).run();
  }
  
  let vehicle_id = generateId();
  await db.prepare('INSERT INTO vehicles (id, customer_id, type, brand, model, plate_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(vehicle_id, customer_id, vehicle_type, make || '', model || '', plate || '', new Date().toISOString()).run();
    
  const servicePrice = await db.prepare('SELECT price FROM service_prices WHERE service_id = ? AND vehicle_type = ?').bind(service_id, vehicle_type).first();
  const price = servicePrice ? servicePrice.price : 0;
  
  const id = generateId();
  const ref = generateBookingRef();
  await db.prepare(`INSERT INTO appointments (id, booking_ref, customer_id, vehicle_id, status, requested_date, requested_time, estimated_total, source, created_at) 
                          VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 'web', ?)`)
    .bind(id, ref, customer_id, vehicle_id, scheduled_for.split('T')[0], scheduled_for.split('T')[1] || '10:00', price, new Date().toISOString()).run();
  
  await db.prepare(`INSERT INTO appointment_services (id, appointment_id, service_id, vehicle_type, price_snapshot) VALUES (?, ?, ?, ?, ?)`)
    .bind(generateId(), id, service_id, vehicle_type, price).run();
    
  return c.json({ success: true, data: { ref } });
});

app.get('/booking-status', async (c) => {
  const ref = c.req.query('ref');
  const phone = c.req.query('phone');
  const result = await c.env.DB.prepare(`
    SELECT a.*, c.phone 
    FROM appointments a 
    JOIN customers c ON a.customer_id = c.id 
    WHERE a.booking_ref = ? AND c.phone = ?
  `).bind(ref, phone).first();
  if (!result) return c.json({ success: false, error: 'Not found' }, 404);
  return c.json({ success: true, data: result });
});

app.get('/services', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM services WHERE active = 1 AND public_visible = 1 ORDER BY display_order ASC').all();
  for (let s of results) {
    const { results: prices } = await c.env.DB.prepare('SELECT vehicle_type, price as price_iqd FROM service_prices WHERE service_id = ?').bind(s.id).all();
    s.prices = prices;
  }
  return c.json({ success: true, data: results });
});

app.get('/settings', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM settings").all();
  const settings = results.reduce((acc: any, r: any) => ({ ...acc, [r.key]: r.value }), {});
  return c.json({ success: true, data: settings });
});

app.get('/gallery', async (c) => {
  return c.json({ success: true, data: [] });
});

app.get('/testimonials', async (c) => {
  return c.json({ success: true, data: [] });
});

app.get('/content', async (c) => {
  return c.json({ success: true, data: [] });
});

app.get('/availability', async (c) => {
  return c.json({ success: true, data: [] });
});

export default app;
