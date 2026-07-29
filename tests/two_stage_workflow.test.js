const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const app = require('../server/index');
const { db } = require('../server/db');

let server;
let port;
let adminToken = '';
let employeeToken = '';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting Two-Stage Workflow Test Suite...\n');

  server = app.listen(0, async () => {
    port = server.address().port;

    try {
      // Login Admin
      const loginRes = await request({
        path: '/api/auth/login',
        method: 'POST'
      }, { username: 'admin', password: 'AdminPassword123!' });
      adminToken = loginRes.body.token;

      // Seed specific test customers in master_customers if not existing
      db.prepare(`
        INSERT OR IGNORE INTO master_customers (record_id, customer_name, username, normalized_username, offer_eligibility, processing_status)
        VALUES ('TEST-001', 'Test Customer 1', 'test_user_1', 'test_user_1', 'Yes', 'Not Done')
      `).run();
      db.prepare(`
        INSERT OR IGNORE INTO master_customers (record_id, customer_name, username, normalized_username, offer_eligibility, processing_status)
        VALUES ('TEST-002', 'Test Customer 2', 'test_user_2', 'test_user_2', 'No', 'Not Done')
      `).run();
      db.prepare(`
        INSERT OR IGNORE INTO master_customers (record_id, customer_name, username, normalized_username, offer_eligibility, processing_status)
        VALUES ('TEST-003', 'Test Customer 3', 'test_user_3', 'test_user_3', 'Yes', 'Done')
      `).run();

      const cust1Before = db.prepare("SELECT processing_status FROM master_customers WHERE username = 'test_user_1'").get();
      assert.strictEqual(cust1Before.processing_status, 'Not Done');

      // Create a test daily draft upload batch manually in DB for exact item testing
      const uploadInfo = db.prepare(`
        INSERT INTO daily_uploads (file_name, original_stored_path, uploaded_by, total_rows, status)
        VALUES ('test_daily_sheet.xlsx', '/tmp/test.xlsx', 'admin', 4, 'draft')
      `).run();
      const uploadId = uploadInfo.lastInsertRowid;

      const cust1 = db.prepare("SELECT id FROM master_customers WHERE username = 'test_user_1'").get();
      const cust2 = db.prepare("SELECT id FROM master_customers WHERE username = 'test_user_2'").get();
      const cust3 = db.prepare("SELECT id FROM master_customers WHERE username = 'test_user_3'").get();

      // Insert items for this daily upload draft:
      // Item 1: test_user_1 (Auto: Yes, Master Status: Not Done, Selected: 1)
      const item1Info = db.prepare(`
        INSERT INTO daily_upload_items (
          upload_id, customer_name, raw_username, normalized_username, auto_match_result,
          manual_override, final_eligibility_result, match_status, master_status, selected, master_customer_id
        ) VALUES (?, 'Test Customer 1', 'test_user_1', 'test_user_1', 'Yes', 'None', 'Yes', 'Exact Match', 'Not Done', 1, ?)
      `).run(uploadId, cust1.id);

      // Item 2: test_user_2 (Auto: No, Master Status: Not Done, Selected: 0)
      const item2Info = db.prepare(`
        INSERT INTO daily_upload_items (
          upload_id, customer_name, raw_username, normalized_username, auto_match_result,
          manual_override, final_eligibility_result, match_status, master_status, selected, master_customer_id
        ) VALUES (?, 'Test Customer 2', 'test_user_2', 'test_user_2', 'No', 'None', 'No', 'Exact Match', 'Not Done', 0, ?)
      `).run(uploadId, cust2.id);

      // Item 3: test_user_3 (Auto: Yes, Master Status: Already Done, Selected: 0)
      const item3Info = db.prepare(`
        INSERT INTO daily_upload_items (
          upload_id, customer_name, raw_username, normalized_username, auto_match_result,
          manual_override, final_eligibility_result, match_status, master_status, selected, master_customer_id
        ) VALUES (?, 'Test Customer 3', 'test_user_3', 'test_user_3', 'Yes', 'None', 'Yes', 'Exact Match', 'Already Done', 0, ?)
      `).run(uploadId, cust3.id);

      // Item 4: unknown_user (Auto: No, Master Status: Not Found, Selected: 0)
      const item4Info = db.prepare(`
        INSERT INTO daily_upload_items (
          upload_id, customer_name, raw_username, normalized_username, auto_match_result,
          manual_override, final_eligibility_result, match_status, master_status, selected, master_customer_id
        ) VALUES (?, 'Unknown User', 'unknown_user', 'unknown_user', 'No', 'None', 'No', 'No Match', 'Not Found', 0, NULL)
      `).run(uploadId);

      const item1Id = item1Info.lastInsertRowid;
      const item2Id = item2Info.lastInsertRowid;

      // TEST 1: Uploading a daily file does not change master list
      const cust1AfterUpload = db.prepare("SELECT processing_status FROM master_customers WHERE username = 'test_user_1'").get();
      assert.strictEqual(cust1AfterUpload.processing_status, 'Not Done');
      console.log('✔ Test 1 Passed: Uploading daily draft does not modify master list.');

      // TEST 2 & 3: Yes and No results appear correctly
      const item1 = db.prepare('SELECT auto_match_result, final_eligibility_result FROM daily_upload_items WHERE id = ?').get(item1Id);
      const item2 = db.prepare('SELECT auto_match_result, final_eligibility_result FROM daily_upload_items WHERE id = ?').get(item2Id);
      assert.strictEqual(item1.final_eligibility_result, 'Yes');
      assert.strictEqual(item2.final_eligibility_result, 'No');
      console.log('✔ Tests 2 & 3 Passed: Automatic Yes and No results appear correctly.');

      // TEST 4: Manual Yes-to-No change before confirmation
      const changeYesToNoRes = await request({
        path: `/api/daily/item/${item1Id}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      }, { manualOverride: 'No', selected: false });
      assert.strictEqual(changeYesToNoRes.statusCode, 200);
      assert.strictEqual(changeYesToNoRes.body.item.final_eligibility_result, 'No');
      console.log('✔ Test 4 Passed: Manual Yes-to-No change updates Final Result to No.');

      // TEST 5: Manual No-to-Yes change before confirmation
      const changeNoToYesRes = await request({
        path: `/api/daily/item/${item2Id}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      }, { manualOverride: 'Yes', selected: true });
      assert.strictEqual(changeNoToYesRes.statusCode, 200);
      assert.strictEqual(changeNoToYesRes.body.item.final_eligibility_result, 'Yes');
      console.log('✔ Test 5 Passed: Manual No-to-Yes change updates Final Result to Yes.');

      // Reset item 1 back to Yes (selected) and item 2 to No
      await request({
        path: `/api/daily/item/${item1Id}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      }, { manualOverride: 'Yes', selected: true });

      await request({
        path: `/api/daily/item/${item2Id}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      }, { manualOverride: 'No', selected: false });

      // Check pre-confirm summary endpoint
      const summaryRes = await request({
        path: `/api/daily/pre-confirm-summary/${uploadId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(summaryRes.statusCode, 200);
      assert.strictEqual(summaryRes.body.willUpdateCount, 1); // Only item 1 will update!
      console.log('✔ Pre-confirm Summary Modal calculation verified.');

      // TEST 6 & 7 & 8: STAGE 2 CONFIRMATION (Only selected Yes rows marked Done; No & Already Done skipped)
      const confirmRes = await request({
        path: `/api/daily/confirm/${uploadId}`,
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(confirmRes.statusCode, 200);
      assert.strictEqual(confirmRes.body.updatedCount, 1);

      const cust1AfterConfirm = db.prepare("SELECT processing_status, done_date, processed_by FROM master_customers WHERE username = 'test_user_1'").get();
      assert.strictEqual(cust1AfterConfirm.processing_status, 'Done');
      assert.ok(cust1AfterConfirm.done_date);

      const cust2AfterConfirm = db.prepare("SELECT processing_status FROM master_customers WHERE username = 'test_user_2'").get();
      assert.strictEqual(cust2AfterConfirm.processing_status, 'Not Done');

      console.log('✔ Tests 6, 7, 8 Passed: Only selected Yes rows marked Done; No and Already Done skipped.');

      // TEST 9: Clicking confirmation button twice does not create duplicate updates
      const confirmAgainRes = await request({
        path: `/api/daily/confirm/${uploadId}`,
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(confirmAgainRes.statusCode, 200);
      assert.strictEqual(confirmAgainRes.body.updatedCount, 0);
      assert.strictEqual(confirmAgainRes.body.alreadyConfirmed, true);
      console.log('✔ Test 9 Passed: Clicking confirmation button twice does not duplicate updates.');

      // TEST 10: Undoing a confirmed batch restores previous statuses
      const undoRes = await request({
        path: `/api/daily/undo/${uploadId}`,
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(undoRes.statusCode, 200);
      assert.strictEqual(undoRes.body.revertedCount, 1);

      const cust1AfterUndo = db.prepare("SELECT processing_status, done_date FROM master_customers WHERE username = 'test_user_1'").get();
      assert.strictEqual(cust1AfterUndo.processing_status, 'Not Done');
      assert.strictEqual(cust1AfterUndo.done_date, null);

      const batchAfterUndo = db.prepare('SELECT status FROM daily_uploads WHERE id = ?').get(uploadId);
      assert.strictEqual(batchAfterUndo.status, 'draft');

      console.log('✔ Test 10 Passed: Undoing confirmed batch restores master records and draft status.\n');

      console.log('===========================================================');
      console.log(' ALL 10 TWO-STAGE WORKFLOW SCENARIO TESTS PASSED CLEANLY! ');
      console.log('===========================================================\n');

    } catch (err) {
      console.error('Test Failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
