const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');
const { authenticateToken } = require('../auth');

// GET /api/calls/queue - Get today's calling queue (eligible customers)
router.get('/queue', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const search = req.query.search ? req.query.search.trim() : '';
  const statusFilter = req.query.status || '';
  const followUpOnly = req.query.followUpOnly === 'true';

  let whereClauses = [
    "(CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = 'Yes'"
  ];
  let params = [];

  if (search) {
    whereClauses.push('(customer_name LIKE ? OR username LIKE ? OR phone_number LIKE ? OR record_id LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  if (statusFilter) {
    whereClauses.push('contact_status = ?');
    params.push(statusFilter);
  }

  if (followUpOnly) {
    whereClauses.push('follow_up_date IS NOT NULL AND DATE(follow_up_date) <= DATE("now")');
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const total = db.prepare(`SELECT COUNT(*) as count FROM master_customers ${whereSql}`).get(...params).count;

  const items = db.prepare(`
    SELECT *,
           (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) as final_eligibility
    FROM master_customers
    ${whereSql}
    ORDER BY 
      CASE WHEN follow_up_date IS NOT NULL AND DATE(follow_up_date) <= DATE('now') THEN 0 ELSE 1 END,
      contact_attempts ASC,
      last_updated_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// POST /api/calls/record - Record call outcome & update master customer
router.post('/record', authenticateToken, (req, res) => {
  const {
    customerId,
    contactStatus,
    offerResult,
    notes,
    followUpDate
  } = req.body;

  if (!customerId || !contactStatus) {
    return res.status(400).json({ error: 'Customer ID and contact status are required.' });
  }

  const validStatuses = [
    'Not called', 'Called', 'No answer', 'Call again later',
    'Interested', 'Not interested', 'Accepted offer', 'Declined offer',
    'Wrong number', 'Completed'
  ];

  if (!validStatuses.includes(contactStatus)) {
    return res.status(400).json({ error: `Invalid contact status: ${contactStatus}` });
  }

  const customer = db.prepare('SELECT * FROM master_customers WHERE id = ?').get(customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Master customer record not found.' });
  }

  const employeeName = req.user.name || req.user.username;

  db.transaction(() => {
    // 1. Insert into call_history
    db.prepare(`
      INSERT INTO call_history (
        customer_id, employee_name, contact_status, offer_result, notes, follow_up_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      employeeName,
      contactStatus,
      offerResult ? offerResult.trim() : null,
      notes ? notes.trim() : null,
      followUpDate ? followUpDate : null
    );

    // 2. Update master_customers record
    db.prepare(`
      UPDATE master_customers
      SET contact_status = ?,
          contact_date = CURRENT_TIMESTAMP,
          contacted_by = ?,
          offer_result = COALESCE(?, offer_result),
          notes = COALESCE(?, notes),
          contact_attempts = contact_attempts + 1,
          follow_up_date = ?,
          last_updated_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      contactStatus,
      employeeName,
      offerResult ? offerResult.trim() : null,
      notes ? notes.trim() : null,
      followUpDate ? followUpDate : null,
      customerId
    );

    // 3. Audit log
    logAudit(
      req.user.username,
      'RECORD_CALL',
      `Recorded call for ${customer.username} (${customer.customer_name}). Status: ${contactStatus}, Result: ${offerResult || 'N/A'}`,
      req.ip,
      req.user.id
    );
  })();

  res.json({
    message: 'Call result recorded and master customer updated.',
    customer: db.prepare('SELECT * FROM master_customers WHERE id = ?').get(customerId)
  });
});

module.exports = router;
