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

-- Seed Settings
INSERT INTO settings (key, value) VALUES
  ('shop_name', 'BarberShop Manager'),
  ('currency', '$'),
  ('opening_time', '09:00'),
  ('closing_time', '19:00'),
  ('appointment_interval', '30'),
  ('default_commission', '50')
ON CONFLICT(key) DO NOTHING;

-- Seed Admin User
INSERT INTO users (username, password, role, name) VALUES
  ('admin', '$2b$10$GvEsET0UE.OoN2A3rbXVjeqC3SZOtt4d/a8cTBHPkViycq.f7sonS', 'Admin', 'Administrator')
ON CONFLICT(username) DO NOTHING;

-- Seed Services
INSERT INTO services (name, price, duration)
SELECT 'Haircut', 25, 30
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Haircut');

INSERT INTO services (name, price, duration)
SELECT 'Beard Trim', 15, 15
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Beard Trim');

INSERT INTO services (name, price, duration)
SELECT 'Haircut and Beard', 35, 45
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Haircut and Beard');

INSERT INTO services (name, price, duration)
SELECT 'Kids Haircut', 20, 30
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Kids Haircut');

INSERT INTO services (name, price, duration)
SELECT 'Hair Wash', 10, 10
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Hair Wash');
