-- Initial Schema for Ember & Oak

-- ENUMS
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- 1. Restaurant Settings
CREATE TABLE restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    
    reservation_enabled BOOLEAN DEFAULT true,
    slot_interval_minutes INTEGER DEFAULT 30,
    default_table_duration_minutes INTEGER DEFAULT 120,
    minimum_advance_minutes INTEGER DEFAULT 60,
    maximum_advance_days INTEGER DEFAULT 60,
    maximum_party_size_online INTEGER DEFAULT 6,
    capacity_per_slot INTEGER DEFAULT 20,
    allow_same_day_reservation BOOLEAN DEFAULT true,
    auto_confirm_reservations BOOLEAN DEFAULT true,
    cancellation_cutoff_hours INTEGER DEFAULT 24,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business Hours
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME,
    close_time TIME,
    reservation_start_time TIME,
    reservation_end_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(weekday)
);

-- 3. Menu Categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu Items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Menu Item Tags (Dietary/Allergens)
CREATE TABLE menu_item_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(menu_item_id, tag)
);

-- 6. Reservations
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL,
    occasion TEXT,
    special_requests TEXT,
    status reservation_status DEFAULT 'pending',
    source TEXT DEFAULT 'website',
    cancellation_token TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- 7. Reservation Blackouts
CREATE TABLE reservation_blackouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blackout_date DATE NOT NULL,
    reason TEXT,
    all_day BOOLEAN DEFAULT true,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Newsletter Subscribers
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    source TEXT DEFAULT 'website',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ
);

-- 9. Gallery Images
CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurant_settings_modtime BEFORE UPDATE ON restaurant_settings FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_business_hours_modtime BEFORE UPDATE ON business_hours FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_menu_categories_modtime BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_menu_items_modtime BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_reservations_modtime BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public can read restaurant settings" ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Public can read business hours" ON business_hours FOR SELECT USING (true);
CREATE POLICY "Public can read active menu categories" ON menu_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read available menu items" ON menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Public can read menu tags" ON menu_item_tags FOR SELECT USING (true);
CREATE POLICY "Public can read published gallery images" ON gallery_images FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read blackouts" ON reservation_blackouts FOR SELECT USING (true);

-- Admin Policies (Full Access for authenticated users with role 'admin' or just authenticated users for now)
-- Assuming admin is just any authenticated user for this basic setup.
CREATE POLICY "Admin full access restaurant settings" ON restaurant_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access business hours" ON business_hours FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access menu categories" ON menu_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access menu items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access menu item tags" ON menu_item_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access reservations" ON reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access blackouts" ON reservation_blackouts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access subscribers" ON newsletter_subscribers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access gallery" ON gallery_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- No public write access. Reservations/Newsletter should be written via Edge Functions using Service Role Key.
-- This prevents anonymous clients from manipulating the database directly.

-- ==========================================
-- STORED PROCEDURE FOR AVAILABILITY
-- ==========================================
-- A simple function to generate time slots and check capacity
-- (Complex logic like overlap, exact capacity is often easier in an Edge Function, 
-- but a basic Postgres function can return slots for a day)
CREATE OR REPLACE FUNCTION get_available_slots(p_date DATE, p_party_size INTEGER)
RETURNS TABLE(available_time TEXT) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_is_open BOOLEAN;
    v_start_time TIME;
    v_end_time TIME;
    v_slot_interval INTEGER;
    v_capacity INTEGER;
    v_current_time TIME;
    v_booked_guests INTEGER;
BEGIN
    -- 1. Get Day of week (0=Sunday)
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- 2. Check if open
    SELECT is_open, reservation_start_time, reservation_end_time 
    INTO v_is_open, v_start_time, v_end_time
    FROM business_hours WHERE weekday = v_day_of_week;

    IF v_is_open IS FALSE OR v_start_time IS NULL THEN
        RETURN; -- Closed
    END IF;

    -- Check blackouts
    IF EXISTS (SELECT 1 FROM reservation_blackouts WHERE blackout_date = p_date AND all_day = true) THEN
        RETURN;
    END IF;

    -- 3. Get Settings
    SELECT slot_interval_minutes, capacity_per_slot 
    INTO v_slot_interval, v_capacity
    FROM restaurant_settings LIMIT 1;

    -- 4. Generate slots and check capacity
    v_current_time := v_start_time;
    WHILE v_current_time <= v_end_time LOOP
        -- Check bookings for this exact slot (Simplified logic)
        SELECT COALESCE(SUM(party_size), 0) INTO v_booked_guests
        FROM reservations
        WHERE reservation_date = p_date 
        AND reservation_time = v_current_time
        AND status IN ('pending', 'confirmed');

        IF (v_capacity - v_booked_guests) >= p_party_size THEN
            available_time := to_char(v_current_time, 'HH24:MI');
            RETURN NEXT;
        END IF;

        v_current_time := v_current_time + (v_slot_interval || ' minutes')::interval;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
