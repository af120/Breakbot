const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all barbers (public)
router.get('/barbers', (req, res) => {
  const barbers = db.prepare('SELECT id, name, working_hours, days_off FROM barbers').all();
  res.json(barbers);
});

// Get all services (public)
router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services').all();
  res.json(services);
});

// Get shop settings (public - only non-sensitive ones)
router.get('/settings', (req, res) => {
  const settingsRows = db.prepare("SELECT * FROM settings WHERE key IN ('shop_name', 'opening_time', 'closing_time', 'appointment_interval', 'currency')").all();
  const settings = {};
  settingsRows.forEach(row => { settings[row.key] = row.value; });
  res.json(settings);
});

// Get available time slots for a barber on a specific date
router.get('/availability', (req, res) => {
  const { barber_id, date, service_id } = req.query;
  if (!barber_id || !date) {
    return res.status(400).json({ error: 'barber_id and date are required' });
  }

  // Get shop settings
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(row => { settings[row.key] = row.value; });

  const openingTime = settings.opening_time || '09:00';
  const closingTime = settings.closing_time || '19:00';
  const interval = parseInt(settings.appointment_interval) || 30;

  // Get service duration
  let serviceDuration = interval;
  if (service_id) {
    const service = db.prepare('SELECT duration FROM services WHERE id = ?').get(service_id);
    if (service) serviceDuration = service.duration;
  }

  // Get barber info
  const barber = db.prepare('SELECT * FROM barbers WHERE id = ?').get(barber_id);
  if (!barber) {
    return res.status(404).json({ error: 'Barber not found' });
  }

  // Check if it's a day off
  const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const daysOff = barber.days_off ? barber.days_off.split(',').map(d => d.trim().toLowerCase()) : [];
  if (daysOff.includes(dayOfWeek.toLowerCase())) {
    return res.json({ available: false, reason: 'Barber is off on this day', slots: [] });
  }

  // Parse barber working hours
  let barberStart = openingTime;
  let barberEnd = closingTime;
  if (barber.working_hours) {
    const parts = barber.working_hours.split('-');
    if (parts.length === 2) {
      barberStart = parts[0].trim();
      barberEnd = parts[1].trim();
    }
  }

  // Generate all possible time slots
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

  // Get existing booked appointments for this barber on this date
  const booked = db.prepare(
    'SELECT time FROM appointments WHERE barber_id = ? AND date = ? AND status NOT IN ("Cancelled", "No-show", "Rejected")'
  ).all(barber_id, date).map(a => a.time);

  // Filter out booked slots
  const availableSlots = slots.filter(slot => !booked.includes(slot));

  res.json({
    available: true,
    barber_name: barber.name,
    date,
    slots: availableSlots,
    booked_slots: booked
  });
});

// Submit a booking request (public)
router.post('/book', (req, res) => {
  const { customer_name, customer_phone, barber_id, service_id, date, time, notes } = req.body;

  if (!customer_name || !customer_phone || !barber_id || !service_id || !date || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if the slot is still available
  const existing = db.prepare(
    'SELECT * FROM appointments WHERE barber_id = ? AND date = ? AND time = ? AND status NOT IN ("Cancelled", "No-show", "Rejected")'
  ).get(barber_id, date, time);
  if (existing) {
    return res.status(400).json({ error: 'This time slot is no longer available. Please choose another time.' });
  }

  // Find or create the customer
  let customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer_phone);
  if (!customer) {
    const info = db.prepare('INSERT INTO customers (name, phone, notes, preferred_barber_id) VALUES (?, ?, ?, ?)').run(
      customer_name, customer_phone, notes || '', barber_id
    );
    customer = { id: info.lastInsertRowid };
  }

  // Create appointment with "Pending" status
  const info = db.prepare(
    'INSERT INTO appointments (customer_id, barber_id, service_id, date, time, status, type) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(customer.id, barber_id, service_id, date, time, 'Pending', 'Online Booking');

  res.json({
    success: true,
    appointment_id: info.lastInsertRowid,
    message: 'Your booking request has been submitted! The barber will review and confirm your appointment.'
  });
});

// Check booking status (public)
router.get('/booking-status/:phone', (req, res) => {
  const { phone } = req.params;
  const customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone);
  if (!customer) {
    return res.json([]);
  }

  const bookings = db.prepare(`
    SELECT a.id, a.date, a.time, a.status, a.type, a.created_at,
           b.name as barber_name, s.name as service_name, s.price as service_price
    FROM appointments a
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.customer_id = ? AND a.date >= date('now')
    ORDER BY a.date ASC, a.time ASC
  `).all(customer.id);

  res.json(bookings);
});

module.exports = router;
