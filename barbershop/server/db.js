const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'barbershop.db'));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      working_hours TEXT,
      days_off TEXT,
      commission_percentage REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      duration INTEGER -- in minutes
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      notes TEXT,
      preferred_barber_id INTEGER,
      FOREIGN KEY (preferred_barber_id) REFERENCES barbers (id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      barber_id INTEGER,
      service_id INTEGER,
      date TEXT, -- YYYY-MM-DD
      time TEXT, -- HH:MM
      status TEXT, -- Scheduled, Waiting, In Service, Completed, Cancelled, No-show
      type TEXT, -- Appointment, Walk-in
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (barber_id) REFERENCES barbers (id),
      FOREIGN KEY (service_id) REFERENCES services (id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER,
      amount REAL,
      discount REAL DEFAULT 0,
      payment_method TEXT, -- Cash, Card, Other
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments (id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      amount REAL,
      date TEXT, -- YYYY-MM-DD
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Insert default settings
  const checkSettings = db.prepare('SELECT count(*) as count FROM settings').get();
  if (checkSettings.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('shop_name', 'BarberShop Manager');
    insertSetting.run('currency', '$');
    insertSetting.run('opening_time', '09:00');
    insertSetting.run('closing_time', '19:00');
    insertSetting.run('appointment_interval', '30');
    insertSetting.run('default_commission', '50');
  }

  // Insert admin user
  const checkUsers = db.prepare('SELECT count(*) as count FROM users').get();
  if (checkUsers.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run('admin', hash, 'Admin', 'Administrator');
  }

  // Insert sample services
  const checkServices = db.prepare('SELECT count(*) as count FROM services').get();
  if (checkServices.count === 0) {
    const insertService = db.prepare('INSERT INTO services (name, price, duration) VALUES (?, ?, ?)');
    insertService.run('Haircut', 25, 30);
    insertService.run('Beard Trim', 15, 15);
    insertService.run('Haircut and Beard', 35, 45);
    insertService.run('Kids Haircut', 20, 30);
    insertService.run('Hair Wash', 10, 10);
  }
}

initDb();

module.exports = db;
