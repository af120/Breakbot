import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const app = new Hono();

// CORS Middleware
app.use('*', cors({
  origin: [
    'https://af120.github.io',
    'http://localhost:5173'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Health Check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- Public Routes ---
app.get('/api/public/barbers', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, working_hours, days_off FROM barbers').all();
  return c.json(results || []);
});

app.get('/api/public/services', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM services').all();
  return c.json(results || []);
});

app.get('/api/public/settings', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM settings WHERE key IN ('shop_name', 'opening_time', 'closing_time', 'appointment_interval', 'currency')").all();
  const settings = {};
  if (results) {
    results.forEach(row => { settings[row.key] = row.value; });
  }
  return c.json(settings);
});

app.get('/api/public/availability', async (c) => {
  const barber_id = c.req.query('barber_id');
  const date = c.req.query('date');
  const service_id = c.req.query('service_id');

  if (!barber_id || !date) {
    return c.json({ error: 'barber_id and date are required' }, 400);
  }

  const { results: settingsRows } = await c.env.DB.prepare('SELECT * FROM settings').all();
  const settings = {};
  if (settingsRows) settingsRows.forEach(row => { settings[row.key] = row.value; });

  const openingTime = settings.opening_time || '09:00';
  const closingTime = settings.closing_time || '19:00';
  const interval = parseInt(settings.appointment_interval) || 30;

  let serviceDuration = interval;
  if (service_id) {
    const service = await c.env.DB.prepare('SELECT duration FROM services WHERE id = ?').bind(service_id).first();
    if (service) serviceDuration = service.duration;
  }

  const barber = await c.env.DB.prepare('SELECT * FROM barbers WHERE id = ?').bind(barber_id).first();
  if (!barber) {
    return c.json({ error: 'Barber not found' }, 404);
  }

  const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const daysOff = barber.days_off ? barber.days_off.split(',').map(d => d.trim().toLowerCase()) : [];
  if (daysOff.includes(dayOfWeek.toLowerCase())) {
    return c.json({ available: false, reason: 'Barber is off on this day', slots: [] });
  }

  let barberStart = openingTime;
  let barberEnd = closingTime;
  if (barber.working_hours) {
    const parts = barber.working_hours.split('-');
    if (parts.length === 2) {
      barberStart = parts[0].trim();
      barberEnd = parts[1].trim();
    }
  }

  const slots = [];
  const [startH, startM] = barberStart.split(':').map(Number);
  const [endH, endM] = barberEnd.split(':').map(Number);
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + serviceDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    slots.push(timeStr);
    currentMinutes += interval;
  }

  const { results: bookedRows } = await c.env.DB.prepare('SELECT time FROM appointments WHERE barber_id = ? AND date = ? AND status NOT IN ("Cancelled", "No-show", "Rejected")').bind(barber_id, date).all();
  const booked = bookedRows ? bookedRows.map(a => a.time) : [];

  const availableSlots = slots.filter(slot => !booked.includes(slot));

  return c.json({
    available: true,
    barber_name: barber.name,
    date,
    slots: availableSlots,
    booked_slots: booked
  });
});

app.post('/api/public/book', async (c) => {
  const { customer_name, customer_phone, barber_id, service_id, date, time, notes } = await c.req.json();

  if (!customer_name || !customer_phone || !barber_id || !service_id || !date || !time) {
    return c.json({ error: 'All fields are required' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT * FROM appointments WHERE barber_id = ? AND date = ? AND time = ? AND status NOT IN ("Cancelled", "No-show", "Rejected")').bind(barber_id, date, time).first();
  if (existing) {
    return c.json({ error: 'This time slot is no longer available. Please choose another time.' }, 400);
  }

  let customer = await c.env.DB.prepare('SELECT id FROM customers WHERE phone = ?').bind(customer_phone).first();
  let customerId = customer?.id;
  
  if (!customer) {
    const info = await c.env.DB.prepare('INSERT INTO customers (name, phone, notes, preferred_barber_id) VALUES (?, ?, ?, ?)').bind(customer_name, customer_phone, notes || '', barber_id).run();
    customerId = info.meta.last_row_id;
  }

  const info = await c.env.DB.prepare('INSERT INTO appointments (customer_id, barber_id, service_id, date, time, status, type) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(customerId, barber_id, service_id, date, time, 'Pending', 'Online Booking').run();

  return c.json({
    success: true,
    appointment_id: info.meta.last_row_id,
    message: 'Your booking request has been submitted! The barber will review and confirm your appointment.'
  });
});

app.get('/api/public/booking-status/:phone', async (c) => {
  const phone = c.req.param('phone');
  const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE phone = ?').bind(phone).first();
  if (!customer) {
    return c.json([]);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT a.id, a.date, a.time, a.status, a.type, a.created_at,
           b.name as barber_name, s.name as service_name, s.price as service_price
    FROM appointments a
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.customer_id = ? AND a.date >= date('now')
    ORDER BY a.date ASC, a.time ASC
  `).bind(customer.id).all();

  return c.json(results || []);
});

// --- Auth Route ---
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user) return c.json({ error: 'Invalid username or password' }, 401);

  if (!bcrypt.compareSync(password, user.password)) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }

  const secret = c.env.JWT_SECRET || 'secret123';
  const token = await sign({
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 1 day
  }, secret, 'HS256');
  
  return c.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

// --- Auth Middleware ---
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/auth/login' || c.req.path.startsWith('/api/public/') || c.req.path === '/api/health') {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'No token provided' }, 401);

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verify(token, c.env.JWT_SECRET || 'secret123', 'HS256');
    c.set('user', decoded);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token: ' + err.message }, 401);
  }
});

// --- Protected Routes ---
app.get('/api/barbers', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM barbers').all();
  return c.json(results || []);
});

app.post('/api/barbers', async (c) => {
  const { name, phone, working_hours, days_off, commission_percentage } = await c.req.json();
  const info = await c.env.DB.prepare('INSERT INTO barbers (name, phone, working_hours, days_off, commission_percentage) VALUES (?, ?, ?, ?, ?)').bind(name, phone, working_hours, days_off, commission_percentage || 0).run();
  return c.json({ id: info.meta.last_row_id });
});

app.put('/api/barbers/:id', async (c) => {
  const { name, phone, working_hours, days_off, commission_percentage } = await c.req.json();
  await c.env.DB.prepare('UPDATE barbers SET name=?, phone=?, working_hours=?, days_off=?, commission_percentage=? WHERE id=?').bind(name, phone, working_hours, days_off, commission_percentage || 0, c.req.param('id')).run();
  return c.json({ success: true });
});

app.delete('/api/barbers/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM barbers WHERE id=?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// Services
app.get('/api/services', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM services').all();
  return c.json(results || []);
});
app.post('/api/services', async (c) => {
  const { name, price, duration } = await c.req.json();
  const info = await c.env.DB.prepare('INSERT INTO services (name, price, duration) VALUES (?, ?, ?)').bind(name, price, duration).run();
  return c.json({ id: info.meta.last_row_id });
});
app.put('/api/services/:id', async (c) => {
  const { name, price, duration } = await c.req.json();
  await c.env.DB.prepare('UPDATE services SET name=?, price=?, duration=? WHERE id=?').bind(name, price, duration, c.req.param('id')).run();
  return c.json({ success: true });
});
app.delete('/api/services/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM services WHERE id=?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// Customers
app.get('/api/customers', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT customers.*, barbers.name as preferred_barber_name FROM customers LEFT JOIN barbers ON customers.preferred_barber_id = barbers.id').all();
  return c.json(results || []);
});
app.post('/api/customers', async (c) => {
  const { name, phone, notes, preferred_barber_id } = await c.req.json();
  const info = await c.env.DB.prepare('INSERT INTO customers (name, phone, notes, preferred_barber_id) VALUES (?, ?, ?, ?)').bind(name, phone, notes, preferred_barber_id || null).run();
  return c.json({ id: info.meta.last_row_id });
});
app.put('/api/customers/:id', async (c) => {
  const { name, phone, notes, preferred_barber_id } = await c.req.json();
  await c.env.DB.prepare('UPDATE customers SET name=?, phone=?, notes=?, preferred_barber_id=? WHERE id=?').bind(name, phone, notes, preferred_barber_id || null, c.req.param('id')).run();
  return c.json({ success: true });
});
app.delete('/api/customers/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM customers WHERE id=?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// Appointments
app.get('/api/appointments', async (c) => {
  let date = c.req.query('date');
  let barber_id = c.req.query('barber_id');
  let status = c.req.query('status');
  
  let query = `
    SELECT a.*, c.name as customer_name, c.phone as customer_phone, b.name as barber_name, s.name as service_name, s.price as service_price, s.duration as service_duration
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { query += ' AND a.date = ?'; params.push(date); }
  if (barber_id) { query += ' AND a.barber_id = ?'; params.push(barber_id); }
  if (status) { query += ' AND a.status = ?'; params.push(status); }
  query += ' ORDER BY a.date ASC, a.time ASC';
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results || []);
});

app.post('/api/appointments', async (c) => {
  const { customer_id, barber_id, service_id, date, time, status, type } = await c.req.json();
  const existing = await c.env.DB.prepare('SELECT * FROM appointments WHERE barber_id = ? AND date = ? AND time = ? AND status NOT IN ("Cancelled", "Completed", "No-show")').bind(barber_id, date, time).first();
  if (existing) {
    return c.json({ error: 'Barber is already booked at this time' }, 400);
  }
  const info = await c.env.DB.prepare('INSERT INTO appointments (customer_id, barber_id, service_id, date, time, status, type) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(customer_id, barber_id, service_id, date, time, status || 'Scheduled', type || 'Appointment').run();
  return c.json({ id: info.meta.last_row_id });
});

app.put('/api/appointments/:id/status', async (c) => {
  const { status } = await c.req.json();
  await c.env.DB.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(status, c.req.param('id')).run();
  return c.json({ success: true });
});

app.put('/api/appointments/:id', async (c) => {
  const { customer_id, barber_id, service_id, date, time, status } = await c.req.json();
  const existing = await c.env.DB.prepare('SELECT * FROM appointments WHERE barber_id = ? AND date = ? AND time = ? AND id != ? AND status NOT IN ("Cancelled", "Completed", "No-show")').bind(barber_id, date, time, c.req.param('id')).first();
  if (existing) {
    return c.json({ error: 'Barber is already booked at this time' }, 400);
  }
  await c.env.DB.prepare('UPDATE appointments SET customer_id=?, barber_id=?, service_id=?, date=?, time=?, status=? WHERE id=?').bind(customer_id, barber_id, service_id, date, time, status, c.req.param('id')).run();
  return c.json({ success: true });
});

// Booking Requests
app.get('/api/booking-requests', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT a.*, c.name as customer_name, c.phone as customer_phone,
           b.name as barber_name, s.name as service_name, s.price as service_price, s.duration as service_duration
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.status = 'Pending'
    ORDER BY a.date ASC, a.time ASC
  `).all();
  return c.json(results || []);
});
app.put('/api/booking-requests/:id/accept', async (c) => {
  const appointment = await c.env.DB.prepare('SELECT * FROM appointments WHERE id = ? AND status = "Pending"').bind(c.req.param('id')).first();
  if (!appointment) return c.json({ error: 'Booking request not found or already processed' }, 404);
  await c.env.DB.prepare('UPDATE appointments SET status = "Scheduled" WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true, message: 'Booking accepted and added to schedule' });
});
app.put('/api/booking-requests/:id/reject', async (c) => {
  const appointment = await c.env.DB.prepare('SELECT * FROM appointments WHERE id = ? AND status = "Pending"').bind(c.req.param('id')).first();
  if (!appointment) return c.json({ error: 'Booking request not found or already processed' }, 404);
  await c.env.DB.prepare('UPDATE appointments SET status = "Rejected" WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true, message: 'Booking rejected' });
});

// Queue
app.get('/api/queue', async (c) => {
  const today = new Date().toISOString().split('T')[0];
  const { results } = await c.env.DB.prepare(`
    SELECT a.*, c.name as customer_name, b.name as barber_name, s.name as service_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.date = ? AND a.status IN ('Waiting', 'In Service')
    ORDER BY a.created_at ASC
  `).bind(today).all();
  return c.json(results || []);
});

// Payments
app.get('/api/payments', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT p.*, a.date as appointment_date, c.name as customer_name, b.name as barber_name, s.name as service_name
    FROM payments p
    JOIN appointments a ON p.appointment_id = a.id
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    ORDER BY p.date DESC
  `).all();
  return c.json(results || []);
});
app.post('/api/payments', async (c) => {
  const { appointment_id, amount, discount, payment_method } = await c.req.json();
  const info = await c.env.DB.prepare('INSERT INTO payments (appointment_id, amount, discount, payment_method) VALUES (?, ?, ?, ?)').bind(appointment_id, amount, discount || 0, payment_method).run();
  await c.env.DB.prepare('UPDATE appointments SET status = "Completed" WHERE id = ?').bind(appointment_id).run();
  return c.json({ id: info.meta.last_row_id });
});

// Expenses
app.get('/api/expenses', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  return c.json(results || []);
});
app.post('/api/expenses', async (c) => {
  const { category, amount, date, note } = await c.req.json();
  const info = await c.env.DB.prepare('INSERT INTO expenses (category, amount, date, note) VALUES (?, ?, ?, ?)').bind(category, amount, date, note).run();
  return c.json({ id: info.meta.last_row_id });
});

// Settings
app.get('/api/settings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM settings').all();
  const settings = {};
  if (results) results.forEach(row => { settings[row.key] = row.value; });
  return c.json(settings);
});
app.post('/api/settings', async (c) => {
  const settings = await c.req.json();
  const stmt = c.env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?');
  const insertStmt = c.env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING');
  
  const stmts = [];
  for (const [key, value] of Object.entries(settings)) {
    stmts.push(insertStmt.bind(key, value));
    stmts.push(stmt.bind(value, key));
  }
  
  await c.env.DB.batch(stmts);
  return c.json({ success: true });
});

// Dashboard
app.get('/api/dashboard', async (c) => {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = today.substring(0, 8) + '01';

  const [
    todayAppointmentsResult,
    waitingCustomersResult,
    completedTodayResult,
    pendingBookingsResult,
    incomeTodayResult,
    incomeMonthResult
  ] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT count(*) as count FROM appointments WHERE date = ?').bind(today),
    c.env.DB.prepare('SELECT count(*) as count FROM appointments WHERE date = ? AND status = "Waiting"').bind(today),
    c.env.DB.prepare('SELECT count(*) as count FROM appointments WHERE date = ? AND status = "Completed"').bind(today),
    c.env.DB.prepare('SELECT count(*) as count FROM appointments WHERE status = "Pending"'),
    c.env.DB.prepare('SELECT sum(p.amount) as total FROM payments p JOIN appointments a ON p.appointment_id = a.id WHERE a.date = ?').bind(today),
    c.env.DB.prepare('SELECT sum(p.amount) as total FROM payments p JOIN appointments a ON p.appointment_id = a.id WHERE a.date >= ? AND a.date <= ?').bind(startOfMonth, today)
  ]);

  return c.json({
    todayAppointments: todayAppointmentsResult.results[0]?.count || 0,
    waitingCustomers: waitingCustomersResult.results[0]?.count || 0,
    completedToday: completedTodayResult.results[0]?.count || 0,
    pendingBookings: pendingBookingsResult.results[0]?.count || 0,
    incomeToday: incomeTodayResult.results[0]?.total || 0,
    incomeMonth: incomeMonthResult.results[0]?.total || 0
  });
});

export default app;
