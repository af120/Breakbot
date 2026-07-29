const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { db, logAudit } = require('../db');
const { authenticateToken } = require('../auth');

// Helper to format string cells as text in ExcelJS to prevent string corruption (e.g. leading zeros in phone numbers or handles)
function addFormattedRow(sheet, rowValues) {
  const row = sheet.addRow(rowValues);
  row.eachCell((cell) => {
    if (typeof cell.value === 'string') {
      cell.numFmt = '@';
    }
  });
  return row;
}

// Auto-fit columns helper
function autoFitColumns(sheet) {
  sheet.columns.forEach(column => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellVal = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
      if (cellVal.length > maxLength) {
        maxLength = cellVal.length;
      }
    });
    column.width = Math.min(maxLength + 4, 60);
  });
}

// Format header row helper
function formatHeaderRow(sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF1F2937' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };
  headerRow.alignment = { vertical: 'middle' };
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  if (sheet.columns && sheet.columns.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length }
    };
  }
}

// GET /api/export/daily-workbook/:uploadId - Generate multi-worksheet Excel workbook for a daily upload batch
router.get('/daily-workbook/:uploadId', authenticateToken, async (req, res) => {
  const { uploadId } = req.params;
  const tabFilter = req.query.tab || 'all'; // 'all', 'all_results', 'eligible_yes', 'not_eligible_no', 'calling_list', 'marked_done', 'already_done', 'not_found', 'manual_overrides', 'invalid_duplicates'
  const format = (req.query.format || 'xlsx').toLowerCase();

  const uploadRecord = db.prepare('SELECT * FROM daily_uploads WHERE id = ?').get(uploadId);
  if (!uploadRecord) {
    return res.status(404).json({ error: 'Daily upload batch record not found.' });
  }

  const items = db.prepare('SELECT * FROM daily_upload_items WHERE upload_id = ? ORDER BY id ASC').all(uploadId);

  // Fetch master details for items matched
  const masterIds = items.map(i => i.master_customer_id).filter(Boolean);
  const masterCustomersMap = {};
  if (masterIds.length > 0) {
    const masters = db.prepare(`SELECT * FROM master_customers WHERE id IN (${masterIds.join(',')})`).all();
    masters.forEach(m => { masterCustomersMap[m.id] = m; });
  }

  // Calculate statistics for summary sheet
  let autoYesCount = 0;
  let autoNoCount = 0;
  let finalYesCount = 0;
  let finalNoCount = 0;
  let markedDoneCount = 0;
  let alreadyDoneCount = 0;
  let notFoundCount = 0;
  let manualOverridesCount = 0;
  let invalidDuplicatesCount = 0;

  items.forEach(item => {
    if (item.auto_match_result === 'Yes') autoYesCount++; else autoNoCount++;
    if (item.final_eligibility_result === 'Yes') finalYesCount++; else finalNoCount++;

    if (item.master_status === 'Already Done') {
      const mc = item.master_customer_id ? masterCustomersMap[item.master_customer_id] : null;
      if (mc && mc.source_daily_upload_id === parseInt(uploadId)) {
        markedDoneCount++;
      } else {
        alreadyDoneCount++;
      }
    }

    if (item.master_status === 'Not Found') notFoundCount++;
    if (item.manual_override && item.manual_override !== 'None') manualOverridesCount++;
    if (item.match_status === 'Duplicate' || item.match_status === 'Invalid Username') invalidDuplicatesCount++;
  });

  // Extract original headers from raw_data JSON of the first item
  let originalHeaders = [];
  if (items.length > 0 && items[0].raw_data) {
    try {
      const parsed = JSON.parse(items[0].raw_data);
      originalHeaders = Object.keys(parsed);
    } catch (e) {}
  }

  if (originalHeaders.length === 0) {
    originalHeaders = ['Customer Name', 'Username', 'Phone'];
  }

  const systemHeaders = [
    'Automatic Result',
    'Manual Override',
    'Final Result',
    'Selected',
    'Master Status',
    'Confirmation Status',
    'Done Date',
    'Processed By',
    'Notes'
  ];

  const fullHeaders = [...originalHeaders, ...systemHeaders];

  // Helper to map daily item into full row array preserving original columns
  const mapItemToRow = (item) => {
    let rawObj = {};
    try { rawObj = JSON.parse(item.raw_data); } catch (e) {}

    const originalValues = originalHeaders.map(h => rawObj[h] !== undefined ? String(rawObj[h]) : '');

    const mc = item.master_customer_id ? masterCustomersMap[item.master_customer_id] : null;
    const confirmationStatus = uploadRecord.status === 'confirmed' ? 'Confirmed' : 'Draft / Pending Review';
    const doneDate = mc && mc.done_date ? new Date(mc.done_date).toLocaleString() : 'N/A';
    const processedBy = mc && mc.processed_by ? mc.processed_by : 'N/A';

    const systemValues = [
      String(item.auto_match_result || 'No'),
      String(item.manual_override || 'None'),
      String(item.final_eligibility_result || 'No'),
      item.selected ? 'Yes' : 'No',
      String(item.master_status || 'Not Done'),
      confirmationStatus,
      doneDate,
      processedBy,
      String(item.notes || '')
    ];

    return [...originalValues, ...systemValues];
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Breakbot System';
  workbook.lastModifiedBy = req.user.username;
  workbook.created = new Date();

  // 1. Summary Worksheet
  if (tabFilter === 'all' || tabFilter === 'summary') {
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric / Field Name', key: 'metric', width: 35 },
      { header: 'Value / Status', key: 'value', width: 45 }
    ];

    const dateStr = new Date(uploadRecord.upload_date).toISOString().split('T')[0];
    const confirmStr = uploadRecord.confirmed_date ? new Date(uploadRecord.confirmed_date).toLocaleString() : 'Not Confirmed (Draft)';

    const summaryRows = [
      { metric: 'Original File Name', value: uploadRecord.file_name },
      { metric: 'Upload Date & Time', value: new Date(uploadRecord.upload_date).toLocaleString() },
      { metric: 'Confirmation Date & Time', value: confirmStr },
      { metric: 'Uploaded By', value: uploadRecord.uploaded_by },
      { metric: 'Confirmed By', value: uploadRecord.confirmed_by || 'N/A' },
      { metric: 'Batch Status', value: uploadRecord.status.toUpperCase() },
      { metric: 'Total Rows Uploaded', value: uploadRecord.total_rows },
      { metric: 'Automatic Yes (Eligible)', value: autoYesCount },
      { metric: 'Automatic No (Ineligible)', value: autoNoCount },
      { metric: 'Final Yes (After Override)', value: finalYesCount },
      { metric: 'Final No (After Override)', value: finalNoCount },
      { metric: 'Marked Done in Master List', value: uploadRecord.confirmed_count || markedDoneCount },
      { metric: 'Already Done Before Batch', value: alreadyDoneCount },
      { metric: 'Not Found in Master List', value: notFoundCount },
      { metric: 'Manual Overrides Applied', value: manualOverridesCount },
      { metric: 'Invalid or Duplicate Rows', value: invalidDuplicatesCount }
    ];

    summaryRows.forEach(r => summarySheet.addRow(r));
    formatHeaderRow(summarySheet);
    autoFitColumns(summarySheet);
  }

  // Helper to create data worksheet
  const createDataSheet = (sheetName, filterFn) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(fullHeaders);

    const filteredItems = items.filter(filterFn);
    filteredItems.forEach(item => {
      addFormattedRow(sheet, mapItemToRow(item));
    });

    formatHeaderRow(sheet);
    autoFitColumns(sheet);
    return filteredItems;
  };

  // 2. All Results
  if (tabFilter === 'all' || tabFilter === 'all_results') {
    createDataSheet('All Results', () => true);
  }

  // 3. Eligible - Yes
  if (tabFilter === 'all' || tabFilter === 'eligible_yes') {
    createDataSheet('Eligible - Yes', item => item.final_eligibility_result === 'Yes');
  }

  // 4. Not Eligible - No
  if (tabFilter === 'all' || tabFilter === 'not_eligible_no') {
    createDataSheet('Not Eligible - No', item => item.final_eligibility_result === 'No');
  }

  // 5. Marked Done
  if (tabFilter === 'all' || tabFilter === 'marked_done') {
    createDataSheet('Marked Done', item => {
      const mc = item.master_customer_id ? masterCustomersMap[item.master_customer_id] : null;
      return item.master_status === 'Already Done' && mc && mc.source_daily_upload_id === parseInt(uploadId);
    });
  }

  // 6. Already Done
  if (tabFilter === 'all' || tabFilter === 'already_done') {
    createDataSheet('Already Done', item => item.master_status === 'Already Done');
  }

  // 7. Not Found
  if (tabFilter === 'all' || tabFilter === 'not_found') {
    createDataSheet('Not Found', item => item.master_status === 'Not Found');
  }

  // 8. Manual Overrides
  if (tabFilter === 'all' || tabFilter === 'manual_overrides') {
    const sheet = workbook.addWorksheet('Manual Overrides');
    const overrideHeaders = ['Username', 'Customer Name', 'Original Automatic Result', 'Manual Override', 'Final Result', 'Reason / Notes'];
    sheet.addRow(overrideHeaders);

    const overriddenItems = items.filter(i => i.manual_override && i.manual_override !== 'None');
    overriddenItems.forEach(item => {
      addFormattedRow(sheet, [
        String(item.raw_username),
        String(item.customer_name),
        String(item.auto_match_result),
        String(item.manual_override),
        String(item.final_eligibility_result),
        String(item.notes || 'Manual override applied')
      ]);
    });

    formatHeaderRow(sheet);
    autoFitColumns(sheet);
  }

  // 9. Invalid and Duplicates
  if (tabFilter === 'all' || tabFilter === 'invalid_duplicates') {
    const sheet = workbook.addWorksheet('Invalid and Duplicates');
    sheet.addRow(fullHeaders);

    items.filter(i => i.match_status === 'Duplicate' || i.match_status === 'Invalid Username').forEach(item => {
      addFormattedRow(sheet, mapItemToRow(item));
    });

    formatHeaderRow(sheet);
    autoFitColumns(sheet);
  }

  // Calling List Tab if requested
  if (tabFilter === 'calling_list') {
    createDataSheet('Calling List', item => item.final_eligibility_result === 'Yes' && item.master_status === 'Not Done');
  }

  logAudit(
    req.user.username,
    'EXPORT_DAILY_WORKBOOK',
    `Exported daily workbook for batch ${uploadId} (${uploadRecord.file_name}), tab: ${tabFilter}`,
    req.ip,
    req.user.id
  );

  const dateStr = new Date(uploadRecord.upload_date).toISOString().split('T')[0];
  const filename = `daily-expiration-results-${dateStr}-batch-${uploadId}.${format === 'csv' ? 'csv' : 'xlsx'}`;

  if (format === 'csv') {
    // Generate CSV for requested sheet
    const sheet = workbook.worksheets[1] || workbook.worksheets[0];
    const buffer = await workbook.csv.writeBuffer({ sheetId: sheet.id });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } else {
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
});

// GET /api/export/download - Legacy / General Export Endpoint
router.get('/download', authenticateToken, (req, res) => {
  const type = req.query.type || 'master';
  const format = (req.query.format || 'xlsx').toLowerCase();
  const dailyUploadId = req.query.uploadId;

  let rows = [];
  let filenamePrefix = 'export';

  switch (type) {
    case 'daily':
      filenamePrefix = `daily_processed_upload_${dailyUploadId || 'latest'}`;
      if (dailyUploadId) {
        rows = db.prepare(`
          SELECT customer_name as "Customer Name", raw_username as "Username", phone_number as "Phone",
                 auto_match_result as "Automatic Result", manual_override as "Manual Override",
                 final_eligibility_result as "Final Result", master_status as "Master Status",
                 (CASE WHEN master_status = 'Already Done' THEN 'Done' ELSE 'Not Done' END) as "Processing Status",
                 (CASE WHEN selected = 1 THEN 'Yes' ELSE 'No' END) as "Selected",
                 notes as "Notes"
          FROM daily_upload_items WHERE upload_id = ?
        `).all(dailyUploadId);
      } else {
        const latest = db.prepare('SELECT id FROM daily_uploads ORDER BY id DESC LIMIT 1').get();
        if (latest) {
          rows = db.prepare(`
            SELECT customer_name as "Customer Name", raw_username as "Username", phone_number as "Phone",
                   auto_match_result as "Automatic Result", manual_override as "Manual Override",
                   final_eligibility_result as "Final Result", master_status as "Master Status",
                   (CASE WHEN master_status = 'Already Done' THEN 'Done' ELSE 'Not Done' END) as "Processing Status",
                   (CASE WHEN selected = 1 THEN 'Yes' ELSE 'No' END) as "Selected",
                   notes as "Notes"
            FROM daily_upload_items WHERE upload_id = ?
          `).all(latest.id);
        }
      }
      break;

    case 'eligible':
      filenamePrefix = 'eligible_customers';
      rows = db.prepare(`
        SELECT record_id as "Record ID", customer_name as "Customer Name", username as "Username",
               phone_number as "Phone", offer_eligibility as "Automatic Eligibility",
               manual_override as "Manual Override",
               (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) as "Final Eligibility",
               contact_status as "Contact Status", contacted_by as "Contacted By", contact_date as "Last Contact Date"
        FROM master_customers
        WHERE (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = 'Yes'
      `).all();
      break;

    case 'calling_queue':
      filenamePrefix = 'customers_to_be_called';
      rows = db.prepare(`
        SELECT record_id as "Record ID", customer_name as "Customer Name", username as "Username",
               phone_number as "Phone", contact_status as "Contact Status", contact_attempts as "Attempts",
               follow_up_date as "Follow-up Date", notes as "Notes"
        FROM master_customers
        WHERE (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = 'Yes'
          AND (contact_status = 'Not called' OR contact_status = 'Call again later' OR contact_status = 'No answer')
      `).all();
      break;

    case 'results':
      filenamePrefix = 'contact_and_offer_results';
      rows = db.prepare(`
        SELECT mc.record_id as "Record ID", mc.customer_name as "Customer Name", mc.username as "Username",
               ch.employee_name as "Employee", ch.call_date as "Call Date/Time", ch.contact_status as "Status",
               ch.offer_result as "Offer Result", ch.notes as "Notes", ch.follow_up_date as "Follow-up Date"
        FROM call_history ch
        JOIN master_customers mc ON ch.customer_id = mc.id
        ORDER BY ch.call_date DESC
      `).all();
      break;

    case 'overrides':
      filenamePrefix = 'manual_override_history';
      rows = db.prepare(`
        SELECT customer_id as "Customer ID", username as "Username", previous_automatic_result as "Auto Result",
               override_value as "Override", final_result as "Final Result", reason as "Reason",
               changed_by as "Changed By", created_at as "Date/Time"
        FROM manual_overrides_history
        ORDER BY created_at DESC
      `).all();
      break;

    case 'duplicates':
      filenamePrefix = 'duplicate_and_invalid_records';
      if (dailyUploadId) {
        rows = db.prepare(`
          SELECT customer_name as "Customer Name", raw_username as "Username", phone_number as "Phone",
                 match_status as "Error Type"
          FROM daily_upload_items
          WHERE upload_id = ? AND match_status IN ('Duplicate', 'Invalid Username')
        `).all(dailyUploadId);
      } else {
        const latest = db.prepare('SELECT id FROM daily_uploads ORDER BY id DESC LIMIT 1').get();
        if (latest) {
          rows = db.prepare(`
            SELECT customer_name as "Customer Name", raw_username as "Username", phone_number as "Phone",
                   match_status as "Error Type"
            FROM daily_upload_items
            WHERE upload_id = ? AND match_status IN ('Duplicate', 'Invalid Username')
          `).all(latest.id);
        }
      }
      break;

    case 'master':
    default:
      filenamePrefix = 'updated_master_list';
      rows = db.prepare(`
        SELECT record_id as "Record ID", customer_name as "Customer Name", username as "Username",
               phone_number as "Phone", offer_eligibility as "Auto Eligibility",
               manual_override as "Manual Override", manual_override_reason as "Override Reason",
               (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) as "Final Eligibility",
               first_imported_date as "First Imported", last_seen_in_daily as "Last Seen Daily",
               contact_status as "Contact Status", contact_date as "Last Contact Date",
               contacted_by as "Contacted By", offer_result as "Offer Result", notes as "Notes",
               last_updated_date as "Last Updated"
        FROM master_customers
        ORDER BY id ASC
      `).all();
      break;
  }

  logAudit(req.user.username, 'EXPORT_DATA', `Exported ${type} in ${format} format (${rows.length} rows)`, req.ip, req.user.id);

  const worksheet = xlsx.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: 'No data available' }]);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Export');

  if (format === 'csv') {
    const csvBuffer = xlsx.write(workbook, { bookType: 'csv', type: 'buffer' });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filenamePrefix}_${Date.now()}.csv"`);
    return res.send(csvBuffer);
  } else {
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filenamePrefix}_${Date.now()}.xlsx"`);
    return res.send(excelBuffer);
  }
});

module.exports = router;
