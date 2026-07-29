const express = require('express');
const router = express.Router();
const db = require('./db');

// --- Barbers ---
router.get('/barbers', (req, res) => {
  const barbers = db.prepare('SELECT * FROM barbers').all();
  res.json(barbers);
});
router.post('/barbers', (req, res) => {
  const { name, phone, working_hours, days_off, commission_percentage } = req.body;
  const stmt = db.prepare('INSERT INTO barbers (name, phone, working_hours, days_off, commission_percentage) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(name, phone, working_hours, days_off, commission_percentage || 0);
  res.json({ id: info.lastInsertRowid });
});
router.put('/barbers/:id', (req, res) => {
  const { name, phone, working_hours, days_off, commission_percentage } = req.body;
  const stmt = db.prepare('UPDATE barbers SET name=?, phone=?, working_hours=?, days_off=?, commission_percentage=? WHERE id=?');
  stmt.run(name, phone, working_hours, days_off, commission_percentage || 0, req.params.id);
  res.json({ success: true });
});
router.delete('/barbers/:id', (req, res) => {
  db.prepare('DELETE FROM barbers WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// --- Services ---
router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services').all();
  res.json(services);
});
router.post('/services', (req, res) => {
  const { name, price, duration } = req.body;
  const info = db.prepare('INSERT INTO services (name, price, duration) VALUES (?, ?, ?)').run(name, price, duration);
  res.json({ id: info.lastInsertRowid });
});
router.put('/services/:id', (req, res) => {
  const { name, price, duration } = req.body;
  db.prepare('UPDATE services SET name=?, price=?, duration=? WHERE id=?').run(name, price, duration, req.params.id);
  res.json({ success: true });
});
router.delete('/services/:id', (req, res) => {
  db.prepare('DELETE FROM services WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// --- Customers ---
router.get('/customers', (req, res) => {
  const customers = db.prepare('SELECT customers.*, barbers.name as preferred_barber_name FROM customers LEFT JOIN barbers ON customers.preferred_barber_id = barbers.id').all();
  res.json(customers);
});
router.post('/customers', (req, res) => {
  const { name, phone, notes, preferred_barber_id } = req.body;
  const info = db.prepare('INSERT INTO customers (name, phone, notes, preferred_barber_id) VALUES (?, ?, ?, ?)').run(name, phone, notes, preferred_barber_id || null);
  res.json({ id: info.lastInsertRowid });
});
router.put('/customers/:id', (req, res) => {
  const { name, phone, notes, preferred_barber_id } = req.body;
  db.prepare('UPDATE customers SET name=?, phone=?, notes=?, preferred_barber_id=? WHERE id=?').run(name, phone, notes, preferred_barber_id || null, req.params.id);
  res.json({ success: true });
});
router.delete('/customers/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// --- Appointments ---
router.get('/appointments', (req, res) => {
  let { date, barber_id, status } = req.query;
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
  
  const appointments = db.prepare(query).all(...params);
  res.json(appointments);
});
router.post('/appointments', (req, res) => {
  const { customer_id, barber_id, service_id, date, time, status, type } = req.body;
  // Check overlap (simplified check)
  const existing = db.prepare('SELECT * FROM appointments WHERE barber_id = ? AND date = ? AND time = ? AND status NOT IN ("Cancelled", "Completed", "No-show")').get(barber_id, date, time);
  if (existing) {
    return res.status(400).json({ error: 'Barber is already booked at this time' });
  }

  const info = db.prepare('INSERT INTO appointments (customer_id, barber_id, service_id, date, time, status, type) VALUES (?, ?, ?, ?, ?, ?, ?)').run(customer_id, barber_id, service_id, date, time, status || 'Scheduled', type || 'Appointment');
  res.json({ id: info.lastInsertRowid });
});
router.put('/appointments/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});
router.put('/appointments/:id', (req, res) => {
  const { customer_id, barber_id, service_id, date, time, status } = req.body;
  const existing = db.prepare('SELECT * FROM appointments WHERE barber_id = ? AND date = ? AND time = ? AND id != ? AND status NOT IN ("Cancelled", "Completed", "No-show")').get(barber_id, date, time, req.params.id);
  if (existing) {
    return res.status(400).json({ error: 'Barber is already booked at this time' });
  }
  db.prepare('UPDATE appointments SET customer_id=?, barber_id=?, service_id=?, date=?, time=?, status=? WHERE id=?').run(customer_id, barber_id, service_id, date, time, status, req.params.id);
  res.json({ success: true });
});

// --- Queue ---
router.get('/queue', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const queue = db.prepare(`
    SELECT a.*, c.name as customer_name, b.name as barber_name, s.name as service_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.date = ? AND a.status IN ('Waiting', 'In Service')
    ORDER BY a.created_at ASC
  `).all(today);
  res.json(queue);
});

// --- Payments ---
router.get('/payments', (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, a.date as appointment_date, c.name as customer_name, b.name as barber_name, s.name as service_name
    FROM payments p
    JOIN appointments a ON p.appointment_id = a.id
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    ORDER BY p.date DESC
  `).all();
  res.json(payments);
});
router.post('/payments', (req, res) => {
  const { appointment_id, amount, discount, payment_method } = req.body;
  const info = db.prepare('INSERT INTO payments (appointment_id, amount, discount, payment_method) VALUES (?, ?, ?, ?)').run(appointment_id, amount, discount || 0, payment_method);
  db.prepare('UPDATE appointments SET status = "Completed" WHERE id = ?').run(appointment_id);
  res.json({ id: info.lastInsertRowid });
});

// --- Expenses ---
router.get('/expenses', (req, res) => {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  res.json(expenses);
});
router.post('/expenses', (req, res) => {
  const { category, amount, date, note } = req.body;
  const info = db.prepare('INSERT INTO expenses (category, amount, date, note) VALUES (?, ?, ?, ?)').run(category, amount, date, note);
  res.json({ id: info.lastInsertRowid });
});

// --- Settings ---
router.get('/settings', (req, res) => {
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(row => { settings[row.key] = row.value; });
  res.json(settings);
});
router.post('/settings', (req, res) => {
  const settings = req.body;
  const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  const insertStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      insertStmt.run(key, value);
      stmt.run(value, key);
    }
  })();
  res.json({ success: true });
});

// --- Dashboard & Reports ---
router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = today.substring(0, 8) + '01';

  const todayAppointments = db.prepare('SELECT count(*) as count FROM appointments WHERE date = ?').get(today).count;
  const waitingCustomers = db.prepare('SELECT count(*) as count FROM appointments WHERE date = ? AND status = "Waiting"').get(today).count;
  const completedToday = db.prepare('SELECT count(*) as count FROM appointments WHERE date = ? AND status = "Completed"').get(today).count;
  
  const incomeToday = db.prepare(`
    SELECT sum(p.amount) as total 
    FROM payments p JOIN appointments a ON p.appointment_id = a.id 
    WHERE a.date = ?
  `).get(today).total || 0;

  const incomeMonth = db.prepare(`
    SELECT sum(p.amount) as total 
    FROM payments p JOIN appointments a ON p.appointment_id = a.id 
    WHERE a.date >= ? AND a.date <= ?
  `).get(startOfMonth, today).total || 0;

  res.json({
    todayAppointments,
    waitingCustomers,
    completedToday,
    incomeToday,
    incomeMonth
  });
});

module.exports = router;
