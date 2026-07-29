const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { db, logAudit, uploadsDir } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');
const { normalizeUsername, findSimilarUsernames } = require('../normalize');

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: (process.env.MAX_UPLOAD_FILE_SIZE_MB || 50) * 1024 * 1024 }
});

// POST /api/daily/preview - Preview uploaded daily file columns and sample rows
router.post('/preview', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    const columns = Object.keys(rawRows[0]);
    const previewRows = rawRows.slice(0, 10);

    const suggestedUsernameCol = columns.find(k => /user|username|handle|sub/i.test(k)) || columns[0];
    const suggestedNameCol = columns.find(k => /name|customer|client/i.test(k)) || columns[0];
    const suggestedPhoneCol = columns.find(k => /phone|mobile|tel|contact/i.test(k)) || '';

    const fileId = path.basename(req.file.path);

    res.json({
      fileId,
      originalName: req.file.originalname,
      totalRows: rawRows.length,
      columns,
      suggestedUsernameCol,
      suggestedNameCol,
      suggestedPhoneCol,
      previewRows
    });

  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('File preview error:', err);
    res.status(500).json({ error: `Failed to parse file: ${err.message}` });
  }
});

// STAGE 1: POST /api/daily/process - Upload and Process Daily Expiration File as Draft
// CRITICAL: Must NOT modify master list or mark anyone Done during upload!
router.post('/process', authenticateToken, (req, res) => {
  const { fileId, usernameCol, nameCol, phoneCol, originalName } = req.body;

  if (!fileId || !usernameCol) {
    return res.status(400).json({ error: 'File ID and username column mapping are required.' });
  }

  const tempPath = path.join(uploadsDir, fileId);
  if (!fs.existsSync(tempPath)) {
    return res.status(404).json({ error: 'Uploaded temporary file not found. Please upload again.' });
  }

  try {
    const workbook = xlsx.readFile(tempPath);
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    // Load current master customers map
    const masterRows = db.prepare(`
      SELECT id, record_id, customer_name, username, normalized_username, phone_number,
             offer_eligibility, manual_override, processing_status
      FROM master_customers
    `).all();

    const masterMap = {};
    masterRows.forEach(m => {
      masterMap[m.normalized_username] = m;
    });

    let eligibleCount = 0;
    let ineligibleCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    const seenDailyUsernames = new Set();
    const dailyProcessedItems = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rawUser = row[usernameCol];
      const normUser = normalizeUsername(rawUser);
      const name = nameCol && row[nameCol] ? String(row[nameCol]).trim() : String(rawUser || '').trim();
      const phone = phoneCol && row[phoneCol] ? String(row[phoneCol]).trim() : '';

      let matchStatus = 'No Match';
      let autoMatchResult = 'No';
      let finalEligibilityResult = 'No';
      let masterStatus = 'Not Found';
      let masterCustomer = null;
      let suggestedMatches = [];

      if (!normUser) {
        matchStatus = 'Invalid Username';
        invalidCount++;
      } else if (seenDailyUsernames.has(normUser)) {
        matchStatus = 'Duplicate';
        duplicateCount++;
      } else {
        seenDailyUsernames.add(normUser);

        if (masterMap[normUser]) {
          masterCustomer = masterMap[normUser];
          matchStatus = 'Exact Match';
          autoMatchResult = masterCustomer.offer_eligibility || 'Yes';
          finalEligibilityResult = autoMatchResult; // Default to Automatic Result when no manual override

          if (masterCustomer.processing_status === 'Done') {
            masterStatus = 'Already Done';
          } else {
            masterStatus = 'Not Done';
          }

          if (autoMatchResult === 'Yes') {
            eligibleCount++;
          } else {
            ineligibleCount++;
          }
        } else {
          suggestedMatches = findSimilarUsernames(normUser, masterMap, 3);
          ineligibleCount++;
        }
      }

      // Default selection: select if Final Result is Yes and Master Status is Not Done
      const defaultSelected = (finalEligibilityResult === 'Yes' && masterStatus === 'Not Done') ? 1 : 0;

      dailyProcessedItems.push({
        raw_data: JSON.stringify(row),
        customer_name: name,
        raw_username: rawUser !== undefined ? String(rawUser) : '',
        normalized_username: normUser,
        phone_number: phone,
        auto_match_result: autoMatchResult,
        manual_override: 'None', // Default 'None'
        final_eligibility_result: finalEligibilityResult,
        match_status: matchStatus,
        master_status: masterStatus,
        suggested_matches: JSON.stringify(suggestedMatches),
        selected: defaultSelected,
        notes: '',
        master_customer_id: masterCustomer ? masterCustomer.id : null
      });
    }

    const finalStoredPath = path.join(uploadsDir, `daily_${Date.now()}_${originalName || 'upload.xlsx'}`);
    fs.renameSync(tempPath, finalStoredPath);

    let uploadId;
    db.transaction(() => {
      // Save upload batch with status = 'draft'
      const uploadInfo = db.prepare(`
        INSERT INTO daily_uploads (
          file_name, original_stored_path, uploaded_by, total_rows,
          eligible_rows, ineligible_rows, duplicate_rows, invalid_rows, status, column_mapping
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      `).run(
        originalName || 'upload.xlsx',
        finalStoredPath,
        req.user.name || req.user.username,
        rawRows.length,
        eligibleCount,
        ineligibleCount,
        duplicateCount,
        invalidCount,
        JSON.stringify({ usernameCol, nameCol, phoneCol })
      );

      uploadId = uploadInfo.lastInsertRowid;

      const itemInsertStmt = db.prepare(`
        INSERT INTO daily_upload_items (
          upload_id, raw_data, customer_name, raw_username, normalized_username, phone_number,
          auto_match_result, manual_override, final_eligibility_result, match_status, master_status,
          suggested_matches, selected, notes, master_customer_id, is_locked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);

      for (const item of dailyProcessedItems) {
        itemInsertStmt.run(
          uploadId,
          item.raw_data,
          item.customer_name,
          item.raw_username,
          item.normalized_username,
          item.phone_number,
          item.auto_match_result,
          item.manual_override,
          item.final_eligibility_result,
          item.match_status,
          item.master_status,
          item.suggested_matches,
          item.selected,
          item.notes,
          item.master_customer_id
        );
      }

      logAudit(
        req.user.username,
        'UPLOAD_DAILY_DRAFT',
        `Uploaded daily draft batch ${uploadId} (${originalName}). Master list UNTOUCHED. Total: ${rawRows.length}, Eligible: ${eligibleCount}, Ineligible: ${ineligibleCount}`,
        req.ip,
        req.user.id
      );
    })();

    res.json({
      message: 'Daily file uploaded as Draft. Master list was NOT modified.',
      uploadId,
      status: 'draft',
      summary: {
        totalRows: rawRows.length,
        eligibleRows: eligibleCount,
        ineligibleRows: ineligibleCount,
        duplicateRows: duplicateCount,
        invalidRows: invalidCount
      }
    });

  } catch (err) {
    console.error('Daily process error:', err);
    res.status(500).json({ error: `Failed to process daily file: ${err.message}` });
  }
});

// GET /api/daily/history - List daily upload history
router.get('/history', authenticateToken, (req, res) => {
  const uploads = db.prepare('SELECT * FROM daily_uploads ORDER BY upload_date DESC').all();
  res.json({ uploads });
});

// GET /api/daily/history/:id - Get items for a daily upload batch (with filtering & search)
router.get('/history/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;

  const search = req.query.search ? req.query.search.trim() : '';
  const finalEligibility = req.query.finalEligibility || '';
  const masterStatus = req.query.masterStatus || '';

  const uploadRecord = db.prepare('SELECT * FROM daily_uploads WHERE id = ?').get(id);
  if (!uploadRecord) {
    return res.status(404).json({ error: 'Daily upload record not found.' });
  }

  let whereClauses = ['upload_id = ?'];
  let params = [id];

  if (search) {
    whereClauses.push('(customer_name LIKE ? OR raw_username LIKE ? OR phone_number LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (finalEligibility) {
    whereClauses.push('final_eligibility_result = ?');
    params.push(finalEligibility);
  }

  if (masterStatus) {
    whereClauses.push('master_status = ?');
    params.push(masterStatus);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const total = db.prepare(`SELECT COUNT(*) as count FROM daily_upload_items ${whereSql}`).get(...params).count;
  const items = db.prepare(`
    SELECT * FROM daily_upload_items ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    uploadRecord,
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// PUT /api/daily/item/:id - Update item override, selection, or notes (Stage 1 Review)
router.put('/item/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { manualOverride, selected, notes } = req.body;

  const item = db.prepare('SELECT * FROM daily_upload_items WHERE id = ?').get(id);
  if (!item) {
    return res.status(404).json({ error: 'Daily upload item not found.' });
  }

  if (item.is_locked) {
    return res.status(400).json({ error: 'Item is locked because the batch has already been confirmed.' });
  }

  let newOverride = item.manual_override;
  if (manualOverride !== undefined) {
    newOverride = manualOverride; // 'None', 'Yes', 'No'
  }

  // Calculate Final Result according to business rules:
  // If Manual Override is 'None' -> Automatic Result
  // If Manual Override is 'Yes' -> Final Result Yes
  // If Manual Override is 'No' -> Final Result No
  let newFinalResult = item.auto_match_result;
  if (newOverride === 'Yes') {
    newFinalResult = 'Yes';
  } else if (newOverride === 'No') {
    newFinalResult = 'No';
  }

  const newSelected = selected !== undefined ? (selected ? 1 : 0) : item.selected;
  const newNotes = notes !== undefined ? notes.trim() : item.notes;

  db.prepare(`
    UPDATE daily_upload_items
    SET manual_override = ?,
        final_eligibility_result = ?,
        selected = ?,
        notes = ?
    WHERE id = ?
  `).run(newOverride, newFinalResult, newSelected, newNotes, id);

  const updatedItem = db.prepare('SELECT * FROM daily_upload_items WHERE id = ?').get(id);
  res.json({ message: 'Item updated successfully.', item: updatedItem });
});

// POST /api/daily/batch-select/:uploadId - Selection Options (Select All Eligible, Deselect All, etc.)
router.post('/batch-select/:uploadId', authenticateToken, (req, res) => {
  const { uploadId } = req.params;
  const { option } = req.body; // 'all_eligible', 'deselect_all', 'final_yes', 'not_done'

  const uploadRecord = db.prepare('SELECT * FROM daily_uploads WHERE id = ?').get(uploadId);
  if (!uploadRecord) {
    return res.status(404).json({ error: 'Upload record not found.' });
  }
  if (uploadRecord.status === 'confirmed') {
    return res.status(400).json({ error: 'Cannot modify selection on a confirmed batch.' });
  }

  db.transaction(() => {
    if (option === 'deselect_all') {
      db.prepare('UPDATE daily_upload_items SET selected = 0 WHERE upload_id = ?').run(uploadId);
    } else if (option === 'all_eligible') {
      db.prepare(`
        UPDATE daily_upload_items
        SET selected = CASE WHEN final_eligibility_result = 'Yes' AND master_status != 'Already Done' THEN 1 ELSE 0 END
        WHERE upload_id = ?
      `).run(uploadId);
    } else if (option === 'final_yes') {
      db.prepare(`
        UPDATE daily_upload_items
        SET selected = CASE WHEN final_eligibility_result = 'Yes' THEN 1 ELSE 0 END
        WHERE upload_id = ?
      `).run(uploadId);
    } else if (option === 'not_done') {
      db.prepare(`
        UPDATE daily_upload_items
        SET selected = CASE WHEN master_status = 'Not Done' THEN 1 ELSE 0 END
        WHERE upload_id = ?
      `).run(uploadId);
    }
  })();

  res.json({ message: 'Selection updated successfully.' });
});

// GET /api/daily/pre-confirm-summary/:id - Get confirmation statistics for confirmation modal
router.get('/pre-confirm-summary/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const uploadRecord = db.prepare('SELECT * FROM daily_uploads WHERE id = ?').get(id);
  if (!uploadRecord) {
    return res.status(404).json({ error: 'Upload record not found.' });
  }

  const items = db.prepare('SELECT * FROM daily_upload_items WHERE upload_id = ?').all(id);

  let selectedRows = 0;
  let finalYesCount = 0;
  let alreadyDoneCount = 0;
  let willUpdateCount = 0;
  let willSkipCount = 0;

  for (const item of items) {
    if (item.selected) {
      selectedRows++;
    }
    if (item.final_eligibility_result === 'Yes') {
      finalYesCount++;
    }
    if (item.master_status === 'Already Done') {
      alreadyDoneCount++;
    }

    // Rules for willUpdateCount: Selected = 1 AND Final Result = Yes AND Master Status = Not Done AND Master customer exists
    if (item.selected === 1 && item.final_eligibility_result === 'Yes' && item.master_status === 'Not Done' && item.master_customer_id) {
      willUpdateCount++;
    } else {
      willSkipCount++;
    }
  }

  res.json({
    uploadId: id,
    fileName: uploadRecord.file_name,
    status: uploadRecord.status,
    totalRows: items.length,
    selectedRows,
    finalYesCount,
    alreadyDoneCount,
    willUpdateCount,
    willSkipCount
  });
});

// STAGE 2: POST /api/daily/confirm/:id - Confirm and Mark Done in Master List
router.post('/confirm/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const uploadRecord = db.prepare('SELECT * FROM daily_uploads WHERE id = ?').get(id);

  if (!uploadRecord) {
    return res.status(404).json({ error: 'Upload record not found.' });
  }

  if (uploadRecord.status === 'confirmed') {
    return res.json({
      message: 'Batch is already confirmed. Duplicate update skipped.',
      alreadyConfirmed: true,
      updatedCount: 0
    });
  }

  let updatedCount = 0;
  let skippedCount = 0;
  const processedUsernames = [];

  db.transaction(() => {
    const items = db.prepare('SELECT * FROM daily_upload_items WHERE upload_id = ?').all(id);

    const updateMasterStmt = db.prepare(`
      UPDATE master_customers
      SET processing_status = 'Done',
          done_date = CURRENT_TIMESTAMP,
          processed_by = ?,
          source_daily_upload_id = ?,
          source_file_name = ?,
          final_result_used = 'Yes',
          notes = COALESCE(?, notes),
          last_updated_date = CURRENT_TIMESTAMP
      WHERE id = ? AND processing_status != 'Done'
    `);

    const updateItemStatusStmt = db.prepare(`
      UPDATE daily_upload_items SET master_status = 'Already Done' WHERE id = ?
    `);

    for (const item of items) {
      // Only update rows that:
      // 1. Are selected (selected === 1)
      // 2. Have Final Result = Yes (final_eligibility_result === 'Yes')
      // 3. Have a valid matching username in master list (master_customer_id != null)
      // 4. Are not already Done (master_status === 'Not Done')
      if (item.selected === 1 && item.final_eligibility_result === 'Yes' && item.master_customer_id && item.master_status === 'Not Done') {
        const masterCust = db.prepare('SELECT processing_status FROM master_customers WHERE id = ?').get(item.master_customer_id);

        if (masterCust && masterCust.processing_status !== 'Done') {
          updateMasterStmt.run(
            req.user.name || req.user.username,
            id,
            uploadRecord.file_name,
            item.notes || null,
            item.master_customer_id
          );
          updateItemStatusStmt.run(item.id);
          updatedCount++;
          processedUsernames.push(item.raw_username);
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    // Lock items and mark daily upload as confirmed
    db.prepare('UPDATE daily_upload_items SET is_locked = 1 WHERE upload_id = ?').run(id);
    db.prepare(`
      UPDATE daily_uploads
      SET status = 'confirmed',
          confirmed_date = CURRENT_TIMESTAMP,
          confirmed_by = ?,
          confirmed_count = ?
      WHERE id = ?
    `).run(req.user.name || req.user.username, updatedCount, id);

    logAudit(
      req.user.username,
      'CONFIRM_DAILY_BATCH',
      `Confirmed daily upload ID ${id} (${uploadRecord.file_name}). ${updatedCount} master records marked Done. ${skippedCount} skipped. Usernames: ${processedUsernames.slice(0, 10).join(', ')}${processedUsernames.length > 10 ? '...' : ''}`,
      req.ip,
      req.user.id
    );
  })();

  res.json({
    message: `Batch confirmed. ${updatedCount} master customer records marked Done.`,
    uploadId: id,
    updatedCount,
    skippedCount
  });
});

// POST /api/daily/undo/:id - Undo Confirmed Batch (Admin Only)
router.post('/undo/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const uploadRecord = db.prepare('SELECT * FROM daily_uploads WHERE id = ?').get(id);

  if (!uploadRecord) {
    return res.status(404).json({ error: 'Upload record not found.' });
  }

  if (uploadRecord.status !== 'confirmed') {
    return res.status(400).json({ error: 'Only confirmed batches can be undone.' });
  }

  let revertedCount = 0;

  db.transaction(() => {
    // Revert master customer records updated by this daily upload ID
    const revertResult = db.prepare(`
      UPDATE master_customers
      SET processing_status = 'Not Done',
          done_date = NULL,
          processed_by = NULL,
          source_daily_upload_id = NULL,
          source_file_name = NULL,
          final_result_used = NULL
      WHERE source_daily_upload_id = ?
    `).run(id);

    revertedCount = revertResult.changes;

    // Unlock items and restore master_status for items
    const items = db.prepare('SELECT * FROM daily_upload_items WHERE upload_id = ?').all(id);
    const updateItemStmt = db.prepare(`
      UPDATE daily_upload_items
      SET master_status = ?,
          is_locked = 0
      WHERE id = ?
    `);

    for (const item of items) {
      let masterStatus = 'Not Found';
      if (item.master_customer_id) {
        const mc = db.prepare('SELECT processing_status FROM master_customers WHERE id = ?').get(item.master_customer_id);
        masterStatus = mc && mc.processing_status === 'Done' ? 'Already Done' : 'Not Done';
      }
      updateItemStmt.run(masterStatus, item.id);
    }

    // Revert daily upload status back to draft
    db.prepare(`
      UPDATE daily_uploads
      SET status = 'draft',
          confirmed_date = NULL,
          confirmed_by = NULL,
          confirmed_count = 0
      WHERE id = ?
    `).run(id);

    logAudit(
      req.user.username,
      'UNDO_DAILY_BATCH',
      `Admin ${req.user.username} undid confirmed daily batch ID ${id} (${uploadRecord.file_name}). Reverted ${revertedCount} master records to Not Done.`,
      req.ip,
      req.user.id
    );
  })();

  res.json({
    message: `Batch ID ${id} reverted. ${revertedCount} master customer records restored to Not Done.`,
    revertedCount
  });
});

module.exports = router;
