const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || './data/database.sqlite';
const dbDir = path.dirname(path.resolve(dbPath));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure uploads and backups directories exist
const uploadsDir = path.resolve('./uploads');
const backupsDir = path.resolve('./backups');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS master_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      username TEXT NOT NULL,
      normalized_username TEXT UNIQUE NOT NULL,
      phone_number TEXT,
      offer_eligibility TEXT NOT NULL DEFAULT 'Yes' CHECK(offer_eligibility IN ('Yes', 'No')),
      first_imported_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_in_daily DATETIME,
      contact_status TEXT NOT NULL DEFAULT 'Not called',
      contact_date DATETIME,
      contacted_by TEXT,
      offer_result TEXT,
      notes TEXT,
      manual_override TEXT CHECK(manual_override IN ('Yes', 'No') OR manual_override IS NULL),
      manual_override_reason TEXT,
      manual_override_by TEXT,
      manual_override_date DATETIME,
      last_updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      contact_attempts INTEGER DEFAULT 0,
      follow_up_date DATETIME,
      processing_status TEXT NOT NULL DEFAULT 'Not Done' CHECK(processing_status IN ('Not Done', 'Done')),
      done_date DATETIME,
      processed_by TEXT,
      source_daily_upload_id INTEGER,
      source_file_name TEXT,
      final_result_used TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      original_stored_path TEXT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_by TEXT NOT NULL,
      total_rows INTEGER DEFAULT 0,
      eligible_rows INTEGER DEFAULT 0,
      ineligible_rows INTEGER DEFAULT 0,
      duplicate_rows INTEGER DEFAULT 0,
      invalid_rows INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'completed', 'reversed')),
      column_mapping TEXT,
      confirmed_date DATETIME,
      confirmed_by TEXT,
      confirmed_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_upload_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      upload_id INTEGER NOT NULL REFERENCES daily_uploads(id) ON DELETE CASCADE,
      raw_data TEXT,
      customer_name TEXT,
      raw_username TEXT,
      normalized_username TEXT,
      phone_number TEXT,
      auto_match_result TEXT NOT NULL CHECK(auto_match_result IN ('Yes', 'No')),
      final_eligibility_result TEXT NOT NULL CHECK(final_eligibility_result IN ('Yes', 'No')),
      match_status TEXT NOT NULL,
      suggested_matches TEXT,
      already_contacted TEXT NOT NULL DEFAULT 'No' CHECK(already_contacted IN ('Yes', 'No')),
      contact_status TEXT DEFAULT 'Not called',
      contact_date DATETIME,
      contacted_by TEXT,
      offer_result TEXT,
      notes TEXT,
      manual_override TEXT CHECK(manual_override IN ('Yes', 'No', 'None') OR manual_override IS NULL),
      manual_override_reason TEXT,
      master_customer_id INTEGER REFERENCES master_customers(id) ON DELETE SET NULL,
      master_status TEXT NOT NULL DEFAULT 'Not Done' CHECK(master_status IN ('Not Done', 'Already Done', 'Not Found')),
      selected INTEGER NOT NULL DEFAULT 1,
      is_locked INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS manual_overrides_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      previous_automatic_result TEXT NOT NULL,
      override_value TEXT NOT NULL,
      final_result TEXT NOT NULL,
      reason TEXT,
      changed_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS call_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES master_customers(id) ON DELETE CASCADE,
      employee_name TEXT NOT NULL,
      call_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      contact_status TEXT NOT NULL,
      offer_result TEXT,
      notes TEXT,
      follow_up_date DATETIME
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_size INTEGER
    );

  `);

  // Safe migration helper for existing databases
  const safeAddCol = (table, colDef) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`); } catch (e) {}
  };

  safeAddCol('master_customers', "processing_status TEXT NOT NULL DEFAULT 'Not Done'");
  safeAddCol('master_customers', "done_date DATETIME");
  safeAddCol('master_customers', "processed_by TEXT");
  safeAddCol('master_customers', "source_daily_upload_id INTEGER");
  safeAddCol('master_customers', "source_file_name TEXT");
  safeAddCol('master_customers', "final_result_used TEXT");

  safeAddCol('daily_uploads', "confirmed_date DATETIME");
  safeAddCol('daily_uploads', "confirmed_by TEXT");
  safeAddCol('daily_uploads', "confirmed_count INTEGER DEFAULT 0");

  safeAddCol('daily_upload_items', "master_status TEXT NOT NULL DEFAULT 'Not Done'");
  safeAddCol('daily_upload_items', "selected INTEGER NOT NULL DEFAULT 1");
  safeAddCol('daily_upload_items', "is_locked INTEGER NOT NULL DEFAULT 0");

  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_uploads'").get();
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes('draft')) {
      db.exec("PRAGMA foreign_keys=OFF;");
      db.exec(`
        CREATE TABLE daily_uploads_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_name TEXT NOT NULL,
          original_stored_path TEXT NOT NULL,
          upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          uploaded_by TEXT NOT NULL,
          total_rows INTEGER DEFAULT 0,
          eligible_rows INTEGER DEFAULT 0,
          ineligible_rows INTEGER DEFAULT 0,
          duplicate_rows INTEGER DEFAULT 0,
          invalid_rows INTEGER DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'completed', 'reversed')),
          column_mapping TEXT,
          confirmed_date DATETIME,
          confirmed_by TEXT,
          confirmed_count INTEGER DEFAULT 0
        );
        INSERT INTO daily_uploads_new (id, file_name, original_stored_path, upload_date, uploaded_by, total_rows, eligible_rows, ineligible_rows, duplicate_rows, invalid_rows, status, column_mapping)
        SELECT id, file_name, original_stored_path, upload_date, uploaded_by, total_rows, eligible_rows, ineligible_rows, duplicate_rows, invalid_rows, status, column_mapping FROM daily_uploads;
        DROP TABLE daily_uploads;
        ALTER TABLE daily_uploads_new RENAME TO daily_uploads;
      `);
      db.exec("PRAGMA foreign_keys=ON;");
    }

    const itemTableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_upload_items'").get();
    if (itemTableInfo && itemTableInfo.sql && !itemTableInfo.sql.includes("'None'")) {
      db.exec("PRAGMA foreign_keys=OFF;");
      db.exec(`
        CREATE TABLE daily_upload_items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          upload_id INTEGER NOT NULL REFERENCES daily_uploads(id) ON DELETE CASCADE,
          raw_data TEXT,
          customer_name TEXT,
          raw_username TEXT,
          normalized_username TEXT,
          phone_number TEXT,
          auto_match_result TEXT NOT NULL CHECK(auto_match_result IN ('Yes', 'No')),
          final_eligibility_result TEXT NOT NULL CHECK(final_eligibility_result IN ('Yes', 'No')),
          match_status TEXT NOT NULL,
          suggested_matches TEXT,
          already_contacted TEXT NOT NULL DEFAULT 'No' CHECK(already_contacted IN ('Yes', 'No')),
          contact_status TEXT DEFAULT 'Not called',
          contact_date DATETIME,
          contacted_by TEXT,
          offer_result TEXT,
          notes TEXT,
          manual_override TEXT CHECK(manual_override IN ('Yes', 'No', 'None') OR manual_override IS NULL),
          manual_override_reason TEXT,
          master_customer_id INTEGER REFERENCES master_customers(id) ON DELETE SET NULL,
          master_status TEXT NOT NULL DEFAULT 'Not Done' CHECK(master_status IN ('Not Done', 'Already Done', 'Not Found')),
          selected INTEGER NOT NULL DEFAULT 1,
          is_locked INTEGER NOT NULL DEFAULT 0
        );
        INSERT INTO daily_upload_items_new (id, upload_id, raw_data, customer_name, raw_username, normalized_username, phone_number, auto_match_result, final_eligibility_result, match_status, suggested_matches, already_contacted, contact_status, contact_date, contacted_by, offer_result, notes, manual_override, manual_override_reason, master_customer_id)
        SELECT id, upload_id, raw_data, customer_name, raw_username, normalized_username, phone_number, auto_match_result, final_eligibility_result, match_status, suggested_matches, already_contacted, contact_status, contact_date, contacted_by, offer_result, notes, manual_override, manual_override_reason, master_customer_id FROM daily_upload_items;
        DROP TABLE daily_upload_items;
        ALTER TABLE daily_upload_items_new RENAME TO daily_upload_items;
      `);
      db.exec("PRAGMA foreign_keys=ON;");
    }
  } catch (e) {
    console.error('Migration error for daily tables:', e);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_master_norm_user ON master_customers(normalized_username);
    CREATE INDEX IF NOT EXISTS idx_master_record_id ON master_customers(record_id);
    CREATE INDEX IF NOT EXISTS idx_master_contact_status ON master_customers(contact_status);
    CREATE INDEX IF NOT EXISTS idx_master_processing_status ON master_customers(processing_status);
    CREATE INDEX IF NOT EXISTS idx_daily_items_upload_id ON daily_upload_items(upload_id);
  `);

  // Seed default Admin if no user exists
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countStmt.get();
  if (result.count === 0) {
    const adminUser = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const adminPass = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';
    const adminName = process.env.INITIAL_ADMIN_NAME || 'System Administrator';

    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare(`
      INSERT INTO users (username, password_hash, name, role, status)
      VALUES (?, ?, ?, 'admin', 'active')
    `).run(adminUser, hash, adminName);
    console.log(`Default admin user created: ${adminUser}`);
  }
}

initDb();

function logAudit(username, action, details, ip_address = '127.0.0.1', userId = null) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, action, typeof details === 'object' ? JSON.stringify(details) : String(details), ip_address);
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

module.exports = {
  db,
  logAudit,
  uploadsDir,
  backupsDir
};
