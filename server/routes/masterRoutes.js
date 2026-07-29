const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { db, logAudit, uploadsDir } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');
const { normalizeUsername } = require('../normalize');

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: (process.env.MAX_UPLOAD_FILE_SIZE_MB || 50) * 1024 * 1024 }
});

// GET /api/master - Query master customers list
router.get('/', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const search = req.query.search ? req.query.search.trim() : '';
  const eligibility = req.query.eligibility || ''; // 'Yes', 'No'
  const contactStatus = req.query.contactStatus || '';
  const processingStatus = req.query.processingStatus || ''; // 'Done', 'Not Done'
  const overrideOnly = req.query.overrideOnly === 'true';

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(customer_name LIKE ? OR username LIKE ? OR normalized_username LIKE ? OR phone_number LIKE ? OR record_id LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term.toLowerCase(), term, term);
  }

  if (eligibility) {
    whereClauses.push('(CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = ?');
    params.push(eligibility);
  }

  if (contactStatus) {
    whereClauses.push('contact_status = ?');
    params.push(contactStatus);
  }

  if (processingStatus) {
    whereClauses.push('processing_status = ?');
    params.push(processingStatus);
  }

  if (overrideOnly) {
    whereClauses.push('manual_override IS NOT NULL');
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM master_customers ${whereSql}`);
  const total = totalStmt.get(...params).count;

  const itemsStmt = db.prepare(`
    SELECT *,
           (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) as final_eligibility
    FROM master_customers
    ${whereSql}
    ORDER BY id ASC
    LIMIT ? OFFSET ?
  `);

  const records = itemsStmt.all(...params, limit, offset);

  res.json({
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// GET /api/master/stats - Master list summary counts
router.get('/stats', authenticateToken, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = 'Yes' THEN 1 ELSE 0 END) as eligible_records,
      SUM(CASE WHEN (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = 'No' THEN 1 ELSE 0 END) as ineligible_records,
      SUM(CASE WHEN manual_override IS NOT NULL THEN 1 ELSE 0 END) as overridden_records,
      SUM(CASE WHEN contact_status != 'Not called' THEN 1 ELSE 0 END) as contacted_records,
      SUM(CASE WHEN processing_status = 'Done' THEN 1 ELSE 0 END) as done_records,
      SUM(CASE WHEN processing_status = 'Not Done' THEN 1 ELSE 0 END) as not_done_records
    FROM master_customers
  `).get();

  res.json(stats);
});

// GET /api/master/:id - Get single customer details with full activity history
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const customer = db.prepare(`
    SELECT *,
           (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) as final_eligibility
    FROM master_customers WHERE id = ?
  `).get(id);

  if (!customer) {
    return res.status(404).json({ error: 'Customer record not found.' });
  }

  // Get call history
  const calls = db.prepare('SELECT * FROM call_history WHERE customer_id = ? ORDER BY call_date DESC').all(id);

  // Get manual override history
  const overrides = db.prepare('SELECT * FROM manual_overrides_history WHERE customer_id = ? ORDER BY created_at DESC').all(id);

  // Get daily upload sightings
  const dailySightings = db.prepare(`
    SELECT dui.*, du.file_name, du.upload_date, du.uploaded_by
    FROM daily_upload_items dui
    JOIN daily_uploads du ON dui.upload_id = du.id
    WHERE dui.master_customer_id = ?
    ORDER BY du.upload_date DESC
  `).all(id);

  res.json({
    customer,
    calls,
    overrides,
    dailySightings
  });
});

// POST /api/master/upload - Upload Master Excel/CSV file (Admin only)
// Mode can be: 'replace', 'update', or 'merge'
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const mode = req.body.mode || 'replace'; // 'replace', 'update', 'merge'
  const usernameCol = req.body.usernameCol;
  const nameCol = req.body.nameCol;
  const phoneCol = req.body.phoneCol;

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    // Auto-detect columns if not specified
    const sampleRow = rawRows[0];
    const keys = Object.keys(sampleRow);
    
    const uCol = usernameCol || keys.find(k => /user|username|handle/i.test(k)) || keys[1] || keys[0];
    const nCol = nameCol || keys.find(k => /name|customer/i.test(k)) || keys[0];
    const pCol = phoneCol || keys.find(k => /phone|mobile|tel/i.test(k));

    db.transaction(() => {
      if (mode === 'replace') {
        db.prepare('DELETE FROM master_customers').run();
      }

      const insertStmt = db.prepare(`
        INSERT INTO master_customers (
          record_id, customer_name, username, normalized_username, phone_number,
          offer_eligibility, first_imported_date, last_updated_date
        ) VALUES (?, ?, ?, ?, ?, 'Yes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(normalized_username) DO UPDATE SET
          customer_name = excluded.customer_name,
          username = excluded.username,
          phone_number = COALESCE(excluded.phone_number, master_customers.phone_number),
          last_updated_date = CURRENT_TIMESTAMP
      `);

      let importedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rawUser = row[uCol];
        const normUser = normalizeUsername(rawUser);

        if (!normUser) {
          skippedCount++;
          continue;
        }

        const name = row[nCol] ? String(row[nCol]).trim() : rawUser;
        const phone = pCol && row[pCol] ? String(row[pCol]).trim() : null;
        const recordId = `MST-${String(importedCount + 1).padStart(5, '0')}`;

        insertStmt.run(recordId, name, String(rawUser).trim(), normUser, phone);
        importedCount++;
      }

      logAudit(
        req.user.username,
        'UPLOAD_MASTER_LIST',
        `Uploaded master file (${req.file.originalname}), Mode: ${mode}, Imported: ${importedCount}, Skipped: ${skippedCount}`,
        req.ip,
        req.user.id
      );
    })();

    // Store original file in uploads directory safely
    const storedPath = path.join(uploadsDir, `master_${Date.now()}_${req.file.originalname}`);
    fs.renameSync(req.file.path, storedPath);

    res.json({
      message: `Master list successfully processed (${mode} mode).`,
      totalRowsProcessed: rawRows.length
    });

  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Master upload error:', err);
    res.status(500).json({ error: `Failed to process master list: ${err.message}` });
  }
});

// POST /api/master/:id/override - Apply Manual Override (Admin & Employee)
router.post('/:id/override', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { override, reason } = req.body; // override: 'Yes', 'No', or null to remove

  if (override !== null && !['Yes', 'No'].includes(override)) {
    return res.status(400).json({ error: 'Override must be "Yes", "No", or null.' });
  }

  const customer = db.prepare('SELECT * FROM master_customers WHERE id = ?').get(id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer record not found.' });
  }

  const prevAuto = customer.offer_eligibility;
  const finalResult = override !== null ? override : prevAuto;

  db.transaction(() => {
    db.prepare(`
      UPDATE master_customers
      SET manual_override = ?,
          manual_override_reason = ?,
          manual_override_by = ?,
          manual_override_date = CURRENT_TIMESTAMP,
          last_updated_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(override, reason ? reason.trim() : null, req.user.name || req.user.username, id);

    // Record in manual override history
    db.prepare(`
      INSERT INTO manual_overrides_history (
        customer_id, username, previous_automatic_result, override_value, final_result, reason, changed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      customer.username,
      prevAuto,
      override !== null ? override : 'Removed',
      finalResult,
      reason ? reason.trim() : null,
      req.user.name || req.user.username
    );

    logAudit(
      req.user.username,
      'MANUAL_OVERRIDE',
      `Manual override for ${customer.username} set to ${override || 'Removed'}. Reason: ${reason || 'N/A'}`,
      req.ip,
      req.user.id
    );
  })();

  res.json({
    message: 'Manual override updated successfully.',
    customer: db.prepare('SELECT * FROM master_customers WHERE id = ?').get(id)
  });
});

module.exports = router;
