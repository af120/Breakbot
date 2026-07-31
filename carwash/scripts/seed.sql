-- ============================================
-- Car Wash Manager - Seed Data
-- ============================================
-- This seed data is for development/demonstration purposes.
-- Demo data is clearly marked and can be removed via the admin panel.
-- ============================================

-- ============================================
-- Business Settings
-- ============================================
INSERT OR REPLACE INTO settings (key, value) VALUES
('business_name_ku', 'شوشتنی ئۆتۆمبێل'),
('business_name_ar', 'غسيل سيارات'),
('business_name_en', 'Car Wash Manager'),
('currency', 'IQD'),
('timezone', 'Asia/Baghdad'),
('phone', ''),
('whatsapp', ''),
('email', ''),
('address_ku', ''),
('address_ar', ''),
('address_en', ''),
('landmark_ku', ''),
('landmark_ar', ''),
('landmark_en', ''),
('google_maps_url', ''),
('latitude', ''),
('longitude', ''),
('facebook', ''),
('instagram', ''),
('tiktok', ''),
('primary_color', '#1a365d'),
('accent_color', '#38b2ac'),
('booking_interval', '30'),
('min_booking_notice', '60'),
('max_future_days', '30'),
('default_appointment_status', 'pending'),
('pending_reserves_capacity', '0'),
('prices_public', '1'),
('receipt_footer_ku', 'سوپاس بۆ سەردانیتان'),
('receipt_footer_ar', 'شكراً لزيارتكم'),
('receipt_footer_en', 'Thank you for your visit'),
('cancellation_policy_ku', 'تکایە لانیکەم ١ کاتژمێر پێش نۆبەتەکەت هەڵبوەشێنەوە'),
('cancellation_policy_ar', 'يرجى الإلغاء قبل ساعة واحدة على الأقل من موعدك'),
('cancellation_policy_en', 'Please cancel at least 1 hour before your appointment'),
('privacy_notice_ku', 'ئێمە زانیارییەکانی کەسیتان بۆ بەڕێوەبردنی خزمەتگوزاری شوشتنی ئۆتۆمبێل بەکاردەهێنین. زانیارییەکانتان بە تەنها بۆ مەبەستی ئەم خزمەتگوزارییە بەکاردەهێنرێن.'),
('privacy_notice_ar', 'نستخدم معلوماتك الشخصية لإدارة خدمات غسيل السيارات. لن تُستخدم معلوماتك إلا لأغراض هذه الخدمة.'),
('privacy_notice_en', 'We use your personal information to manage car wash services. Your information will only be used for the purposes of this service.'),
('default_language', 'ku'),
('supported_languages', 'ku,ar,en'),
('opening_hours', '{"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"08:00","close":"20:00"},"monday":{"open":"08:00","close":"20:00"},"tuesday":{"open":"08:00","close":"20:00"},"wednesday":{"open":"08:00","close":"20:00"},"thursday":{"open":"08:00","close":"20:00"},"friday":{"open":"10:00","close":"18:00"}}'),
('closed_days', '[]'),
('holiday_closures', '[]');

-- ============================================
-- Website Content
-- ============================================
INSERT OR REPLACE INTO website_content (key, value_ku, value_ar, value_en) VALUES
('headline', 'باشترین خزمەتگوزاری شوشتنی ئۆتۆمبێل', 'أفضل خدمة غسيل سيارات', 'Best Car Wash Service'),
('description', 'ئێمە خزمەتگوزاری شوشتنی ئۆتۆمبێلی پیشەیی پێشکەش دەکەین بە بەکارهێنانی باشترین بەرهەمەکان و ئامێرە نوێیەکان.', 'نقدم خدمة غسيل سيارات احترافية باستخدام أفضل المنتجات والمعدات الحديثة.', 'We provide professional car wash services using the best products and modern equipment.'),
('about', 'ئێمە تیمێکی پیشەییین لە شوشتنی ئۆتۆمبێل کە ساڵانە خزمەتگوزاری بە هەزاران ئۆتۆمبێل دەکەین. ئامانجمان پێشکەشکردنی باشترین خزمەتگوزارییە بە نرخی گونجاو.', 'نحن فريق محترف في غسيل السيارات نخدم آلاف السيارات سنوياً. هدفنا تقديم أفضل خدمة بأسعار مناسبة.', 'We are a professional car wash team serving thousands of vehicles annually. Our goal is to provide the best service at fair prices.'),
('why_choose_us', '[{"icon":"shield","title_ku":"کوالیتی بەرز","title_ar":"جودة عالية","title_en":"High Quality","desc_ku":"بەکارهێنانی بەرهەمە باشەکان بۆ پاراستنی ئۆتۆمبێلەکەت","desc_ar":"استخدام أفضل المنتجات لحماية سيارتك","desc_en":"Using the best products to protect your vehicle"},{"icon":"clock","title_ku":"خزمەتگوزاری خێرا","title_ar":"خدمة سريعة","title_en":"Fast Service","desc_ku":"کاتی چاوەڕوانی کەم و خزمەتگوزاری بە کات","desc_ar":"وقت انتظار قليل وخدمة في الوقت المحدد","desc_en":"Short wait times and service on time"},{"icon":"dollar","title_ku":"نرخی گونجاو","title_ar":"أسعار مناسبة","title_en":"Fair Prices","desc_ku":"باشترین خزمەتگوزاری بە نرخی دادپەروەرانە","desc_ar":"أفضل خدمة بأسعار عادلة","desc_en":"Best service at fair prices"},{"icon":"star","title_ku":"ئەزموونی پیشەیی","title_ar":"خبرة احترافية","title_en":"Professional Experience","desc_ku":"تیمی شارەزا و ئەزموونداری ئێمە","desc_ar":"فريقنا ذو خبرة واحترافية","desc_en":"Our experienced and professional team"}]', '', ''),
('location_instructions_ku', 'ئێمە لە سەر شەقامی سەرەکی دەبینرێین. لە تەنیشت...', 'يمكنك العثور علينا على الشارع الرئيسي. بجانب...', 'You can find us on the main road. Next to...'),
('location_instructions_ar', 'يمكنك العثور علينا على الشارع الرئيسي. بجانب...', 'يمكنك العثور علينا على الشارع الرئيسي. بجانب...', 'You can find us on the main road. Next to...'),
('location_instructions_en', 'You can find us on the main road. Next to...', 'You can find us on the main road. Next to...', 'You can find us on the main road. Next to...'),
('booking_confirmation_ku', 'داواکاری نۆبەتەکەت وەرگیرا. شوشتنی ئۆتۆمبێل نۆبەتەکەت بە تەلەفۆن یان واتساپ پشتڕاست دەکاتەوە.', 'تم استلام طلب حجزك. سيتم تأكيد الموعد عبر الهاتف أو الواتساب.', 'Your booking request has been received. The car wash will confirm the appointment by phone or WhatsApp.'),
('booking_confirmation_ar', 'تم استلام طلب حجزك. سيتم تأكيد الموعد عبر الهاتف أو الواتساب.', 'تم استلام طلب حجزك. سيتم تأكيد الموعد عبر الهاتف أو الواتساب.', 'Your booking request has been received. The car wash will confirm the appointment by phone or WhatsApp.'),
('booking_confirmation_en', 'Your booking request has been received. The car wash will confirm the appointment by phone or WhatsApp.', 'Your booking request has been received. The car wash will confirm the appointment by phone or WhatsApp.', 'Your booking request has been received. The car wash will confirm the appointment by phone or WhatsApp.');

-- ============================================
-- Washing Bays (2 default bays)
-- ============================================
INSERT OR REPLACE INTO washing_bays (id, name, description, active, status, supported_vehicle_types, display_order, created_at, updated_at) VALUES
('bay-001', 'Bay 1', 'Main washing bay', 1, 'available', 'sedan,SUV,pickup,taxi,minibus,motorcycle,other', 1, datetime('now'), datetime('now')),
('bay-002', 'Bay 2', 'Secondary washing bay', 1, 'available', 'sedan,SUV,pickup,taxi,minibus,motorcycle,other', 2, datetime('now'), datetime('now'));

-- ============================================
-- Admin User
-- The password hash will be generated by the seed script at runtime
-- Default credentials: admin / Admin123!
-- ============================================
-- NOTE: This INSERT uses a placeholder hash. The seed.js script replaces it with a proper PBKDF2 hash.
INSERT OR REPLACE INTO users (id, username, password_hash, name, role, active, force_password_change, created_at, updated_at) VALUES
('usr-admin-001', 'admin', 'PLACEHOLDER_HASH_REPLACED_BY_SEED_SCRIPT', 'System Administrator', 'admin', 1, 1, datetime('now'), datetime('now'));

-- ============================================
-- Services
-- ============================================
INSERT OR REPLACE INTO services (id, name_ku, name_ar, name_en, description_ku, description_ar, description_en, category, base_duration, active, public_visible, display_order, created_at, updated_at) VALUES
('svc-001', 'شوشتنی خێرا', 'غسيل سريع', 'Quick Wash', 'شوشتنی دەرەوەی خێرا بە ئاو و سابوون', 'غسيل خارجي سريع بالماء والصابون', 'Quick exterior wash with water and soap', 'quick_wash', 15, 1, 1, 1, datetime('now'), datetime('now')),
('svc-002', 'شوشتنی دەرەوە', 'غسيل خارجي', 'Exterior Wash', 'شوشتنی تەواوی دەرەوە لەگەڵ وشککردنەوە', 'غسيل خارجي كامل مع التجفيف', 'Full exterior wash with drying', 'exterior_wash', 25, 1, 1, 2, datetime('now'), datetime('now')),
('svc-003', 'شوشتنی ناوەوە و دەرەوە', 'غسيل داخلي وخارجي', 'Interior & Exterior Wash', 'شوشتنی تەواوی ناوەوە و دەرەوە', 'غسيل كامل داخلي وخارجي', 'Complete interior and exterior wash', 'interior_exterior', 45, 1, 1, 3, datetime('now'), datetime('now')),
('svc-004', 'پاککردنەوەی ناوەوە', 'تنظيف داخلي', 'Interior Cleaning', 'پاککردنەوەی ناوەوەی ئۆتۆمبێل تەنها', 'تنظيف داخلي للسيارة فقط', 'Interior car cleaning only', 'interior_cleaning', 30, 1, 1, 4, datetime('now'), datetime('now')),
('svc-005', 'پاککردنەوەی قوڵی ناوەوە', 'تنظيف داخلي عميق', 'Deep Interior Cleaning', 'پاککردنەوەی قوڵی ناوەوە لەگەڵ بۆنکردنەوە', 'تنظيف داخلي عميق مع التعطير', 'Deep interior cleaning with fragrance', 'deep_interior', 60, 1, 1, 5, datetime('now'), datetime('now')),
('svc-006', 'شوشتنی بزوێنەر', 'غسيل المحرك', 'Engine Cleaning', 'شوشتنی بزوێنەر بە شێوەیەکی پیشەیی', 'غسيل المحرك بطريقة احترافية', 'Professional engine cleaning', 'engine_cleaning', 30, 1, 1, 6, datetime('now'), datetime('now')),
('svc-007', 'بریقەدانەوە', 'تلميع', 'Polishing', 'بریقەدانەوەی دەرەوەی ئۆتۆمبێل', 'تلميع خارجي للسيارة', 'Exterior car polishing', 'polishing', 60, 1, 1, 7, datetime('now'), datetime('now')),
('svc-008', 'مۆمکردن', 'تشميع', 'Waxing', 'مۆمکردنی دەرەوەی ئۆتۆمبێل بۆ پاراستن', 'تشميع خارجي للسيارة للحماية', 'Exterior waxing for protection', 'waxing', 45, 1, 1, 8, datetime('now'), datetime('now')),
('svc-009', 'پاککردنەوەی تەواو', 'تفصيل كامل', 'Full Detailing', 'پاککردنەوەی تەواو لە ناوەوە و دەرەوە لەگەڵ بریقەدانەوە', 'تفصيل كامل داخلي وخارجي مع التلميع', 'Complete detailing inside and out with polishing', 'full_detailing', 120, 1, 1, 9, datetime('now'), datetime('now'));

-- ============================================
-- Service Prices (per vehicle type, in IQD)
-- ============================================
INSERT OR REPLACE INTO service_prices (id, service_id, vehicle_type, price) VALUES
-- Quick Wash
('sp-001', 'svc-001', 'sedan', 5000),
('sp-002', 'svc-001', 'SUV', 7500),
('sp-003', 'svc-001', 'pickup', 7500),
('sp-004', 'svc-001', 'taxi', 5000),
('sp-005', 'svc-001', 'minibus', 10000),
('sp-006', 'svc-001', 'motorcycle', 3000),
-- Exterior Wash
('sp-010', 'svc-002', 'sedan', 10000),
('sp-011', 'svc-002', 'SUV', 15000),
('sp-012', 'svc-002', 'pickup', 15000),
('sp-013', 'svc-002', 'taxi', 10000),
('sp-014', 'svc-002', 'minibus', 20000),
('sp-015', 'svc-002', 'motorcycle', 7000),
-- Interior & Exterior
('sp-020', 'svc-003', 'sedan', 15000),
('sp-021', 'svc-003', 'SUV', 20000),
('sp-022', 'svc-003', 'pickup', 20000),
('sp-023', 'svc-003', 'taxi', 15000),
('sp-024', 'svc-003', 'minibus', 30000),
-- Interior Cleaning
('sp-030', 'svc-004', 'sedan', 10000),
('sp-031', 'svc-004', 'SUV', 12500),
('sp-032', 'svc-004', 'pickup', 12500),
('sp-033', 'svc-004', 'taxi', 10000),
('sp-034', 'svc-004', 'minibus', 17500),
-- Deep Interior Cleaning
('sp-040', 'svc-005', 'sedan', 20000),
('sp-041', 'svc-005', 'SUV', 25000),
('sp-042', 'svc-005', 'pickup', 25000),
('sp-043', 'svc-005', 'taxi', 20000),
('sp-044', 'svc-005', 'minibus', 35000),
-- Engine Cleaning
('sp-050', 'svc-006', 'sedan', 15000),
('sp-051', 'svc-006', 'SUV', 17500),
('sp-052', 'svc-006', 'pickup', 17500),
('sp-053', 'svc-006', 'taxi', 15000),
('sp-054', 'svc-006', 'minibus', 22500),
-- Polishing
('sp-060', 'svc-007', 'sedan', 25000),
('sp-061', 'svc-007', 'SUV', 30000),
('sp-062', 'svc-007', 'pickup', 30000),
('sp-063', 'svc-007', 'taxi', 25000),
-- Waxing
('sp-070', 'svc-008', 'sedan', 20000),
('sp-071', 'svc-008', 'SUV', 25000),
('sp-072', 'svc-008', 'pickup', 25000),
('sp-073', 'svc-008', 'taxi', 20000),
-- Full Detailing
('sp-080', 'svc-009', 'sedan', 50000),
('sp-081', 'svc-009', 'SUV', 65000),
('sp-082', 'svc-009', 'pickup', 65000),
('sp-083', 'svc-009', 'taxi', 50000),
('sp-084', 'svc-009', 'minibus', 85000);

-- ============================================
-- Demo Customers (clearly marked)
-- ============================================
INSERT OR REPLACE INTO customers (id, name, phone, whatsapp, preferred_language, notes, created_at, updated_at) VALUES
('cust-demo-001', 'ئاراس محمد', '07501234567', '07501234567', 'ku', '[DEMO DATA] نموونەی کڕیار', datetime('now'), datetime('now')),
('cust-demo-002', 'أحمد علي', '07701234567', '07701234567', 'ar', '[DEMO DATA] عميل تجريبي', datetime('now'), datetime('now')),
('cust-demo-003', 'Karwan Hassan', '07801234567', '07801234567', 'en', '[DEMO DATA] Sample customer', datetime('now'), datetime('now'));

-- ============================================
-- Demo Vehicles
-- ============================================
INSERT OR REPLACE INTO vehicles (id, customer_id, type, brand, model, year, color, plate_number, created_at, updated_at) VALUES
('veh-demo-001', 'cust-demo-001', 'sedan', 'Toyota', 'Corolla', 2022, 'White', '21 A 12345', datetime('now'), datetime('now')),
('veh-demo-002', 'cust-demo-001', 'SUV', 'Toyota', 'Land Cruiser', 2023, 'Black', '21 B 67890', datetime('now'), datetime('now')),
('veh-demo-003', 'cust-demo-002', 'sedan', 'Hyundai', 'Sonata', 2021, 'Silver', '22 C 11111', datetime('now'), datetime('now')),
('veh-demo-004', 'cust-demo-003', 'pickup', 'Ford', 'Ranger', 2023, 'Blue', '23 D 22222', datetime('now'), datetime('now'));

-- ============================================
-- Demo Appointments
-- ============================================
INSERT OR REPLACE INTO appointments (id, booking_ref, customer_id, vehicle_id, requested_date, requested_time, bay_id, source, status, preferred_language, estimated_duration, estimated_total, created_at, updated_at) VALUES
('apt-demo-001', 'CW-A1B2C3', 'cust-demo-001', 'veh-demo-001', '2026-08-01', '10:00', 'bay-001', 'website', 'pending', 'ku', 45, 15000, datetime('now'), datetime('now')),
('apt-demo-002', 'CW-D4E5F6', 'cust-demo-002', 'veh-demo-003', '2026-08-01', '11:00', 'bay-002', 'phone', 'confirmed', 'ar', 25, 10000, datetime('now'), datetime('now'));

-- ============================================
-- Demo Appointment Services
-- ============================================
INSERT OR REPLACE INTO appointment_services (id, appointment_id, service_id, service_name_snapshot, price_snapshot, duration_snapshot, vehicle_type) VALUES
('asvc-demo-001', 'apt-demo-001', 'svc-003', 'Interior & Exterior Wash', 15000, 45, 'sedan'),
('asvc-demo-002', 'apt-demo-002', 'svc-002', 'Exterior Wash', 10000, 25, 'sedan');
