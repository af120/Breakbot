-- Cloudflare D1 Schema (SQLite)

-- 1. Restaurant Settings
CREATE TABLE restaurant_settings (
    id TEXT PRIMARY KEY,
    restaurant_name TEXT NOT NULL DEFAULT 'Ember & Oak',
    tagline TEXT,
    description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    google_maps_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    x_url TEXT,
    reservation_email TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    
    reservation_enabled INTEGER DEFAULT 1,
    slot_interval_minutes INTEGER DEFAULT 30,
    default_table_duration_minutes INTEGER DEFAULT 120,
    minimum_advance_minutes INTEGER DEFAULT 60,
    maximum_advance_days INTEGER DEFAULT 60,
    maximum_party_size_online INTEGER DEFAULT 6,
    capacity_per_slot INTEGER DEFAULT 20,
    allow_same_day_reservation INTEGER DEFAULT 1,
    auto_confirm_reservations INTEGER DEFAULT 1,
    cancellation_cutoff_hours INTEGER DEFAULT 24,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Business Hours
CREATE TABLE business_hours (
    id TEXT PRIMARY KEY,
    weekday INTEGER NOT NULL UNIQUE CHECK (weekday BETWEEN 0 AND 6),
    is_open INTEGER NOT NULL DEFAULT 1,
    open_time TEXT,
    close_time TEXT,
    reservation_start_time TEXT,
    reservation_end_time TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Menu Categories
CREATE TABLE menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Menu Items
CREATE TABLE menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Menu Item Tags
CREATE TABLE menu_item_tags (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(menu_item_id, tag)
);

-- 6. Reservations
CREATE TABLE reservations (
    id TEXT PRIMARY KEY,
    reservation_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    reservation_date TEXT NOT NULL,
    reservation_time TEXT NOT NULL,
    party_size INTEGER NOT NULL,
    occasion TEXT,
    special_requests TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    source TEXT DEFAULT 'website',
    cancellation_token TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    confirmed_at TEXT,
    cancelled_at TEXT
);

-- 7. Reservation Blackouts
CREATE TABLE reservation_blackouts (
    id TEXT PRIMARY KEY,
    blackout_date TEXT NOT NULL,
    reason TEXT,
    all_day INTEGER DEFAULT 1,
    start_time TEXT,
    end_time TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 8. Newsletter Subscribers
CREATE TABLE newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    source TEXT DEFAULT 'website',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TEXT,
    unsubscribed_at TEXT
);

-- 9. Gallery Images
CREATE TABLE gallery_images (
    id TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    is_published INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
