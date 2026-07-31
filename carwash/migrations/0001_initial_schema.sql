-- Migration 0001_initial_schema.sql

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    phone TEXT,
    email TEXT,
    active INTEGER DEFAULT 1,
    force_password_change INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    preferred_language TEXT DEFAULT 'ku',
    notes TEXT,
    marketing_consent INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_visit TEXT
);

CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    color TEXT,
    plate_number TEXT,
    notes TEXT,
    total_visits INTEGER DEFAULT 0,
    last_service TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);

CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name_ku TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT,
    description_ku TEXT,
    description_ar TEXT,
    description_en TEXT,
    category TEXT NOT NULL,
    base_duration INTEGER NOT NULL DEFAULT 30,
    image_url TEXT,
    active INTEGER DEFAULT 1,
    public_visible INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_prices (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    price INTEGER NOT NULL,
    UNIQUE(service_id, vehicle_type),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE service_addons (
    id TEXT PRIMARY KEY,
    parent_service_id TEXT NOT NULL,
    addon_service_id TEXT NOT NULL,
    UNIQUE(parent_service_id, addon_service_id),
    FOREIGN KEY (parent_service_id) REFERENCES services(id),
    FOREIGN KEY (addon_service_id) REFERENCES services(id)
);

CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    profile_image TEXT,
    active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'off_duty',
    working_days TEXT,
    working_hours_start TEXT,
    working_hours_end TEXT,
    break_start TEXT,
    break_end TEXT,
    skills TEXT,
    completed_jobs INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE washing_bays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'available',
    supported_vehicle_types TEXT,
    current_vehicle_id TEXT,
    current_appointment_id TEXT,
    maintenance_note TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bay_blocks (
    id TEXT PRIMARY KEY,
    bay_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    reason TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bay_id) REFERENCES washing_bays(id)
);

CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    booking_ref TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    requested_date TEXT NOT NULL,
    requested_time TEXT NOT NULL,
    confirmed_time TEXT,
    bay_id TEXT,
    source TEXT NOT NULL DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'pending',
    customer_note TEXT,
    internal_note TEXT,
    preferred_language TEXT DEFAULT 'ku',
    cancellation_reason TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    estimated_duration INTEGER DEFAULT 0,
    estimated_total INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (bay_id) REFERENCES washing_bays(id)
);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_vehicle_id ON appointments(vehicle_id);
CREATE INDEX idx_appointments_bay_id ON appointments(bay_id);

CREATE TABLE appointment_services (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name_snapshot TEXT NOT NULL,
    price_snapshot INTEGER NOT NULL,
    duration_snapshot INTEGER NOT NULL,
    vehicle_type TEXT NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);
CREATE INDEX idx_appointment_services_appointment_id ON appointment_services(appointment_id);

CREATE TABLE appointment_employees (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
CREATE INDEX idx_appointment_employees_appointment_id ON appointment_employees(appointment_id);

CREATE TABLE appointment_status_history (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
CREATE INDEX idx_appointment_status_history_appointment_id ON appointment_status_history(appointment_id);

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash',
    status TEXT DEFAULT 'completed',
    recorded_by TEXT,
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
CREATE INDEX idx_payments_appointment_id ON payments(appointment_id);

CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    supplier TEXT,
    reference_number TEXT,
    note TEXT,
    recorded_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gallery (
    id TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    title_ku TEXT,
    title_ar TEXT,
    title_en TEXT,
    caption_ku TEXT,
    caption_ar TEXT,
    caption_en TEXT,
    category TEXT,
    alt_text TEXT,
    featured INTEGER DEFAULT 0,
    public_visible INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    uploaded_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonials (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    rating INTEGER,
    comment TEXT NOT NULL,
    language TEXT DEFAULT 'ku',
    public_visible INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE website_content (
    key TEXT PRIMARY KEY,
    value_ku TEXT,
    value_ar TEXT,
    value_en TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

CREATE TABLE notification_logs (
    id TEXT PRIMARY KEY,
    appointment_id TEXT,
    customer_id TEXT,
    template TEXT NOT NULL,
    channel TEXT NOT NULL,
    sent_by TEXT,
    message_preview TEXT,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    record_type TEXT,
    record_id TEXT,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
