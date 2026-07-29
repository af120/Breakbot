const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { normalizeUsername } = require('./normalize');

function seedDatabase() {
  console.log('Seeding fake sample data...');

  // Ensure default users
  const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
  const employeeHash = bcrypt.hashSync('Caller123!', 10);

  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (username, password_hash, name, role, status)
      VALUES (?, ?, ?, 'admin', 'active')
    `).run('admin', adminHash, 'System Administrator');
  }

  const existingCaller = db.prepare('SELECT id FROM users WHERE username = ?').get('john_caller');
  if (!existingCaller) {
    db.prepare(`
      INSERT INTO users (username, password_hash, name, role, status)
      VALUES (?, ?, ?, 'employee', 'active')
    `).run('john_caller', employeeHash, 'John Caller');
  }

  const existingAgent = db.prepare('SELECT id FROM users WHERE username = ?').get('sarah_agent');
  if (!existingAgent) {
    db.prepare(`
      INSERT INTO users (username, password_hash, name, role, status)
      VALUES (?, ?, ?, 'employee', 'active')
    `).run('sarah_agent', employeeHash, 'Sarah Agent');
  }

  // Check if master customers exist
  const masterCount = db.prepare('SELECT COUNT(*) as count FROM master_customers').get().count;
  if (masterCount === 0) {
    const sampleCustomers = [
      { name: 'Alex Johnson', user: '@alex_johnson_99', phone: '+1 (555) 234-5678', eligibility: 'Yes', contact: 'Not called' },
      { name: 'Maria Rodriguez', user: 'maria_rod', phone: '+1 (555) 345-6789', eligibility: 'Yes', contact: 'Not called' },
      { name: 'David Smith', user: '@d_smith_2026', phone: '+1 (555) 456-7890', eligibility: 'Yes', contact: 'Accepted offer', offer: 'Accepted', notes: 'Very pleased with renewal discount.' },
      { name: 'Emma Watson', user: 'emma_w_official', phone: '+1 (555) 567-8901', eligibility: 'Yes', contact: 'Call again later', notes: 'Busy, asked to call tomorrow at 3 PM', followup: '2026-07-30' },
      { name: 'James Wilson', user: '@j_wilson', phone: '+1 (555) 678-9012', eligibility: 'No', contact: 'Not called' },
      { name: 'Sophia Chen', user: 'sophia_chen', phone: '+1 (555) 789-0123', eligibility: 'Yes', contact: 'Interested', offer: 'Interested', notes: 'Requested offer terms via email.' },
      { name: 'Daniel Taylor', user: '@dtaylor_real', phone: '+1 (555) 890-1234', eligibility: 'Yes', contact: 'Declined offer', offer: 'Declined', notes: 'Switched to a competitor.' },
      { name: 'Olivia Brown', user: 'olivia_brown_dev', phone: '+1 (555) 901-2345', eligibility: 'Yes', contact: 'No answer', notes: 'No answer, left voicemail.' },
      { name: 'Ethan Davis', user: '@ethan_davis', phone: '+1 (555) 012-3456', eligibility: 'Yes', contact: 'Not called' },
      { name: 'Ava Miller', user: 'ava_m_vip', phone: '+1 (555) 123-4567', eligibility: 'Yes', contact: 'Accepted offer', offer: 'Accepted', notes: 'Accepted 20% discount offer.' },
      { name: 'William Garcia', user: '@w_garcia', phone: '+1 (555) 234-8899', eligibility: 'Yes', contact: 'Not called' },
      { name: 'Isabella Martinez', user: 'isabella_m', phone: '+1 (555) 345-9900', eligibility: 'Yes', contact: 'Call again later', notes: 'Requested follow up next week', followup: '2026-08-02' },
      { name: 'Benjamin Anderson', user: '@ben_anderson', phone: '+1 (555) 456-1122', eligibility: 'Yes', contact: 'Not called' },
      { name: 'Mia Thomas', user: 'mia_thomas_tx', phone: '+1 (555) 567-2233', eligibility: 'Yes', contact: 'Wrong number', notes: 'Phone disconnected.' },
      { name: 'Lucas Jackson', user: '@lucas_j_99', phone: '+1 (555) 678-3344', eligibility: 'Yes', contact: 'Not called' },
      { name: 'Charlotte White', user: 'charlotte_w', phone: '+1 (555) 789-4455', eligibility: 'No', contact: 'Not called' },
      { name: 'Henry Harris', user: '@h_harris', phone: '+1 (555) 890-5566', eligibility: 'Yes', contact: 'Not called' },
      { name: 'Amelia Martin', user: 'amelia_m_2026', phone: '+1 (555) 901-6677', eligibility: 'Yes', contact: 'Interested', notes: 'Wants manager callback.' },
      { name: 'Alexander Thompson', user: '@alex_t_dev', phone: '+1 (555) 012-7788', eligibility: 'Yes', contact: 'Not called' },
      { name: 'Harper Moore', user: 'harper_moore', phone: '+1 (555) 123-8899', eligibility: 'Yes', contact: 'Not called' }
    ];

    const masterInsert = db.prepare(`
      INSERT INTO master_customers (
        record_id, customer_name, username, normalized_username, phone_number,
        offer_eligibility, contact_status, offer_result, notes, follow_up_date,
        manual_override, manual_override_reason, manual_override_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let idx = 1;
    for (const c of sampleCustomers) {
      const norm = normalizeUsername(c.user);
      const recordId = `MST-${String(idx).padStart(5, '0')}`;
      
      let override = null;
      let overrideReason = null;
      let overrideBy = null;

      if (c.name === 'James Wilson') {
        override = 'Yes';
        overrideReason = 'Customer VIP exception approved by Manager';
        overrideBy = 'System Administrator';
      }

      masterInsert.run(
        recordId,
        c.name,
        c.user,
        norm,
        c.phone,
        c.eligibility,
        c.contact,
        c.offer || null,
        c.notes || null,
        c.followup || null,
        override,
        overrideReason,
        overrideBy
      );
      idx++;
    }

    console.log(`Inserted ${sampleCustomers.length} master customers.`);
  }

  // Insert sample daily upload if none exists
  const dailyUploadCount = db.prepare('SELECT COUNT(*) as count FROM daily_uploads').get().count;
  if (dailyUploadCount === 0) {
    const uploadStmt = db.prepare(`
      INSERT INTO daily_uploads (
        file_name, original_stored_path, uploaded_by, total_rows,
        eligible_rows, ineligible_rows, duplicate_rows, invalid_rows, status, column_mapping
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `);

    const uploadInfo = uploadStmt.run(
      'daily_expirations_2026-07-29.xlsx',
      './uploads/daily_sample.xlsx',
      'System Administrator',
      8,
      5,
      2,
      1,
      0,
      JSON.stringify({ usernameCol: 'Username', nameCol: 'Customer Name', phoneCol: 'Phone' })
    );

    const uploadId = uploadInfo.lastInsertRowid;

    const itemStmt = db.prepare(`
      INSERT INTO daily_upload_items (
        upload_id, raw_data, customer_name, raw_username, normalized_username, phone_number,
        auto_match_result, final_eligibility_result, match_status, suggested_matches,
        already_contacted, contact_status, master_customer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const items = [
      { name: 'Alex Johnson', user: '@alex_johnson_99', phone: '+1 (555) 234-5678', match: 'Exact Match', auto: 'Yes', final: 'Yes', contacted: 'No', status: 'Not called', masterId: 1 },
      { name: 'Maria Rodriguez', user: 'maria_rod', phone: '+1 (555) 345-6789', match: 'Exact Match', auto: 'Yes', final: 'Yes', contacted: 'No', status: 'Not called', masterId: 2 },
      { name: 'David Smith', user: '@d_smith_2026', phone: '+1 (555) 456-7890', match: 'Exact Match', auto: 'Yes', final: 'Yes', contacted: 'Yes', status: 'Accepted offer', masterId: 3 },
      { name: 'Emma Watson', user: 'emma_w_official', phone: '+1 (555) 567-8901', match: 'Exact Match', auto: 'Yes', final: 'Yes', contacted: 'Yes', status: 'Call again later', masterId: 4 },
      { name: 'James Wilson', user: '@j_wilson', phone: '+1 (555) 678-9012', match: 'Exact Match', auto: 'No', final: 'Yes', contacted: 'No', status: 'Not called', masterId: 5 }, // Manual override Yes
      { name: 'Alex Johnson Dup', user: '@alex_johnson_99', phone: '+1 (555) 234-5678', match: 'Duplicate', auto: 'No', final: 'No', contacted: 'No', status: 'Not called', masterId: null },
      { name: 'Sam Unknown', user: 'sam_unknown_user', phone: '+1 (555) 999-0000', match: 'No Match', auto: 'No', final: 'No', contacted: 'No', status: 'Not called', masterId: null },
      { name: 'Maria R Dup', user: 'maria_rod', phone: '+1 (555) 345-6789', match: 'No Match', auto: 'No', final: 'No', contacted: 'No', status: 'Not called', masterId: null }
    ];

    for (const item of items) {
      const norm = normalizeUsername(item.user);
      itemStmt.run(
        uploadId,
        JSON.stringify({ "Customer Name": item.name, "Username": item.user, "Phone": item.phone }),
        item.name,
        item.user,
        norm,
        item.phone,
        item.auto,
        item.final,
        item.match,
        JSON.stringify([]),
        item.contacted,
        item.status,
        item.masterId
      );
    }
  }

  // Insert sample call history if empty
  const callCount = db.prepare('SELECT COUNT(*) as count FROM call_history').get().count;
  if (callCount === 0) {
    const callInsert = db.prepare(`
      INSERT INTO call_history (
        customer_id, employee_name, contact_status, offer_result, notes, follow_up_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    callInsert.run(3, 'John Caller', 'Accepted offer', 'Accepted', 'Very pleased with renewal discount.', null);
    callInsert.run(4, 'Sarah Agent', 'Call again later', 'Interested', 'Busy, asked to call tomorrow at 3 PM', '2026-07-30');
    callInsert.run(6, 'John Caller', 'Interested', 'Interested', 'Requested offer terms via email.', null);
    callInsert.run(7, 'Sarah Agent', 'Declined offer', 'Declined', 'Switched to a competitor.', null);
    callInsert.run(10, 'John Caller', 'Accepted offer', 'Accepted', 'Accepted 20% discount offer.', null);
  }

  // Insert sample audit logs if empty
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  if (auditCount === 0) {
    const auditInsert = db.prepare(`
      INSERT INTO audit_logs (username, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `);

    auditInsert.run('admin', 'SYSTEM_INIT', 'System initialized with sample data', '127.0.0.1');
    auditInsert.run('admin', 'UPLOAD_MASTER_LIST', 'Uploaded initial master customer list (20 records)', '127.0.0.1');
    auditInsert.run('admin', 'MANUAL_OVERRIDE', 'Manual override for @j_wilson set to Yes. Reason: Customer VIP exception approved by Manager', '127.0.0.1');
    auditInsert.run('john_caller', 'RECORD_CALL', 'Recorded call for d_smith_2026. Status: Accepted offer, Result: Accepted', '127.0.0.1');
    auditInsert.run('sarah_agent', 'RECORD_CALL', 'Recorded call for emma_w_official. Status: Call again later, Result: Interested', '127.0.0.1');
  }

  console.log('Database successfully seeded with sample data.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
