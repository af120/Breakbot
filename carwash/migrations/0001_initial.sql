-- Users & Auth
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  must_change_password INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL
);

-- Customers & Vehicles
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  plate_number TEXT,
  make TEXT,
  model TEXT,
  type TEXT NOT NULL, -- Sedan, SUV, Truck
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services & Pricing
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  name_ckb TEXT,
  description_en TEXT,
  description_ar TEXT,
  description_ckb TEXT,
  duration_minutes INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_prices (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  price REAL NOT NULL,
  effective_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Internal Ops
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE washing_bays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'available' -- available, occupied, maintenance
);

-- Reservations & Workflow
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  vehicle_id TEXT REFERENCES vehicles(id),
  date TEXT NOT NULL, -- YYYY-MM-DD
  time TEXT NOT NULL, -- HH:MM
  status TEXT DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservation_services (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id),
  price_at_booking REAL NOT NULL
);

CREATE TABLE reservation_status_history (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id)
);

CREATE TABLE queue_entries (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  bay_id TEXT REFERENCES washing_bays(id),
  status TEXT DEFAULT 'waiting', -- waiting, washing, ready, collected
  entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Financials
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  amount REAL NOT NULL,
  method TEXT, -- cash, card
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Public Website Content
CREATE TABLE gallery_items (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption_en TEXT,
  caption_ar TEXT,
  caption_ckb TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonials (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_published INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System
CREATE TABLE business_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
