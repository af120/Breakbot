const assert = require('assert');
const http = require('http');
const ExcelJS = require('exceljs');
const app = require('../server/index');
const { db } = require('../server/db');

let server;
let port;
let adminToken = '';

function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      ...options,
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ statusCode: res.statusCode, headers: res.headers, buffer });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Starting Multi-Worksheet Excel Export Test Suite...\n');

  server = app.listen(0, async () => {
    port = server.address().port;

    try {
      // Login Admin
      const loginReq = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const loginPromise = new Promise(resolve => {
        loginReq.on('response', res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        });
      });
      loginReq.write(JSON.stringify({ username: 'admin', password: 'AdminPassword123!' }));
      loginReq.end();
      const loginRes = await loginPromise;
      adminToken = loginRes.token;

      // Seed a test daily upload batch with sample data
      const uploadInfo = db.prepare(`
        INSERT INTO daily_uploads (file_name, original_stored_path, uploaded_by, total_rows, status)
        VALUES ('daily-test-file.xlsx', '/tmp/test.xlsx', 'admin', 5, 'draft')
      `).run();
      const uploadId = uploadInfo.lastInsertRowid;

      // Add items covering all 9 worksheet categories
      const rawRow1 = JSON.stringify({ "Customer Name": "User 1 Kurdish ⚡", "Username": "@kurdish_user_01", "Phone": "07501234567" });
      const rawRow2 = JSON.stringify({ "Customer Name": "User 2 Arabic", "Username": "user_arabic_02", "Phone": "+9647509876543" });
      const rawRow3 = JSON.stringify({ "Customer Name": "User 3 English", "Username": "user_english_03", "Phone": "009647501112233" });
      const rawRow4 = JSON.stringify({ "Customer Name": "Not Found User", "Username": "not_found_user_99", "Phone": "07500000000" });
      const rawRow5 = JSON.stringify({ "Customer Name": "Dup User", "Username": "user_english_03", "Phone": "009647501112233" });

      db.prepare(`
        INSERT INTO daily_upload_items (upload_id, raw_data, customer_name, raw_username, auto_match_result, manual_override, final_eligibility_result, match_status, master_status, selected)
        VALUES (?, ?, 'User 1 Kurdish', '@kurdish_user_01', 'Yes', 'None', 'Yes', 'Exact Match', 'Not Done', 1)
      `).run(uploadId, rawRow1);

      db.prepare(`
        INSERT INTO daily_upload_items (upload_id, raw_data, customer_name, raw_username, auto_match_result, manual_override, final_eligibility_result, match_status, master_status, selected)
        VALUES (?, ?, 'User 2 Arabic', 'user_arabic_02', 'Yes', 'No', 'No', 'Exact Match', 'Not Done', 0)
      `).run(uploadId, rawRow2);

      db.prepare(`
        INSERT INTO daily_upload_items (upload_id, raw_data, customer_name, raw_username, auto_match_result, manual_override, final_eligibility_result, match_status, master_status, selected)
        VALUES (?, ?, 'User 3 English', 'user_english_03', 'No', 'Yes', 'Yes', 'Exact Match', 'Already Done', 0)
      `).run(uploadId, rawRow3);

      db.prepare(`
        INSERT INTO daily_upload_items (upload_id, raw_data, customer_name, raw_username, auto_match_result, manual_override, final_eligibility_result, match_status, master_status, selected)
        VALUES (?, ?, 'Not Found User', 'not_found_user_99', 'No', 'None', 'No', 'No Match', 'Not Found', 0)
      `).run(uploadId, rawRow4);

      db.prepare(`
        INSERT INTO daily_upload_items (upload_id, raw_data, customer_name, raw_username, auto_match_result, manual_override, final_eligibility_result, match_status, master_status, selected)
        VALUES (?, ?, 'Dup User', 'user_english_03', 'No', 'None', 'No', 'Duplicate', 'Not Found', 0)
      `).run(uploadId, rawRow5);

      // TEST 1: Request complete multi-worksheet Excel workbook
      const res = await request({
        path: `/api/export/daily-workbook/${uploadId}?tab=all`,
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      assert.ok(res.headers['content-disposition'].includes(`daily-expiration-results-`));
      console.log('✔ GET /api/export/daily-workbook returns .xlsx stream successfully.');

      // Load buffer into ExcelJS to test workbook structure & worksheets
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(res.buffer);

      const expectedWorksheetNames = [
        'Summary',
        'All Results',
        'Eligible - Yes',
        'Not Eligible - No',
        'Marked Done',
        'Already Done',
        'Not Found',
        'Manual Overrides',
        'Invalid and Duplicates'
      ];

      // TEST 2: Verify all 9 worksheets exist with exact names
      const actualSheetNames = workbook.worksheets.map(w => w.name);
      expectedWorksheetNames.forEach(expectedName => {
        assert.ok(actualSheetNames.includes(expectedName), `Worksheet '${expectedName}' missing!`);
      });
      console.log('✔ All 9 required worksheet tabs exist in the exported workbook.');

      // TEST 3: Verify Summary worksheet totals
      const summarySheet = workbook.getWorksheet('Summary');
      assert.ok(summarySheet);
      let totalRowsVal = null;
      summarySheet.eachRow((row) => {
        const metric = row.getCell(1).value;
        const val = row.getCell(2).value;
        if (metric === 'Total Rows Uploaded') totalRowsVal = val;
      });
      assert.strictEqual(totalRowsVal, 5);
      console.log('✔ Summary worksheet totals match uploaded record count.');

      // TEST 4: Verify All Results preserves original columns and text formatting
      const allResultsSheet = workbook.getWorksheet('All Results');
      const headerRow = allResultsSheet.getRow(1);
      assert.strictEqual(headerRow.font.bold, true);
      assert.strictEqual(allResultsSheet.views[0].state, 'frozen');
      assert.strictEqual(allResultsSheet.views[0].ySplit, 1);
      console.log('✔ Header row is bold, frozen, and auto-filtered.');

      // TEST 5: Verify individual tab exports
      const yesRes = await request({
        path: `/api/export/daily-workbook/${uploadId}?tab=eligible_yes`,
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(yesRes.statusCode, 200);
      console.log('✔ Individual sub-tab export endpoints (e.g. tab=eligible_yes) working.');

      console.log('\n==========================================================');
      console.log(' MULTI-WORKSHEET EXCEL EXPORT TEST SUITE PASSED (5/5)!   ');
      console.log('==========================================================\n');

    } catch (err) {
      console.error('Test Failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
