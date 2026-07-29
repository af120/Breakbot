const assert = require('assert');
const http = require('http');
const app = require('../server/index');

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
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
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
  console.log('Starting API integration test suite...');

  server = app.listen(0, async () => {
    port = server.address().port;
    console.log(`Test server running on port ${port}`);

    try {
      // 1. Health check
      const healthRes = await request({ path: '/api/health', method: 'GET' });
      assert.strictEqual(healthRes.statusCode, 200);
      assert.strictEqual(healthRes.body.status, 'ok');
      console.log('✔ GET /api/health passed');

      // 2. Login Admin
      const loginAdminRes = await request({
        path: '/api/auth/login',
        method: 'POST'
      }, { username: 'admin', password: 'AdminPassword123!' });
      assert.strictEqual(loginAdminRes.statusCode, 200);
      assert.ok(loginAdminRes.body.token);
      adminToken = loginAdminRes.body.token;
      console.log('✔ POST /api/auth/login (Admin) passed');

      // 3. Login Employee
      const loginEmpRes = await request({
        path: '/api/auth/login',
        method: 'POST'
      }, { username: 'john_caller', password: 'Caller123!' });
      assert.strictEqual(loginEmpRes.statusCode, 200);
      assert.ok(loginEmpRes.body.token);
      employeeToken = loginEmpRes.body.token;
      console.log('✔ POST /api/auth/login (Employee) passed');

      // 4. GET /api/auth/me
      const meRes = await request({
        path: '/api/auth/me',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(meRes.statusCode, 200);
      assert.strictEqual(meRes.body.user.username, 'admin');
      console.log('✔ GET /api/auth/me passed');

      // 5. GET /api/dashboard
      const dashRes = await request({
        path: '/api/dashboard',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(dashRes.statusCode, 200);
      assert.ok(dashRes.body.master);
      assert.ok(dashRes.body.calling);
      console.log('✔ GET /api/dashboard passed');

      // 6. GET /api/master
      const masterRes = await request({
        path: '/api/master?limit=10',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(masterRes.statusCode, 200);
      assert.ok(Array.isArray(masterRes.body.records));
      assert.strictEqual(masterRes.body.records.length, 10);
      console.log('✔ GET /api/master passed');

      // 7. GET /api/master/stats
      const masterStatsRes = await request({
        path: '/api/master/stats',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(masterStatsRes.statusCode, 200);
      assert.ok(masterStatsRes.body.total_records > 0);
      console.log('✔ GET /api/master/stats passed');

      // 8. GET /api/calls/queue
      const queueRes = await request({
        path: '/api/calls/queue',
        method: 'GET',
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      assert.strictEqual(queueRes.statusCode, 200);
      assert.ok(Array.isArray(queueRes.body.items));
      console.log('✔ GET /api/calls/queue passed');

      // 9. POST /api/calls/record
      const recordCallRes = await request({
        path: '/api/calls/record',
        method: 'POST',
        headers: { Authorization: `Bearer ${employeeToken}` }
      }, {
        customerId: 1,
        contactStatus: 'Accepted offer',
        offerResult: 'Accepted',
        notes: 'Test call recording'
      });
      assert.strictEqual(recordCallRes.statusCode, 200);
      assert.strictEqual(recordCallRes.body.customer.contact_status, 'Accepted offer');
      console.log('✔ POST /api/calls/record passed');

      // 10. POST /api/master/:id/override
      const overrideRes = await request({
        path: '/api/master/2/override',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      }, {
        override: 'No',
        reason: 'Testing manual override block'
      });
      assert.strictEqual(overrideRes.statusCode, 200);
      assert.strictEqual(overrideRes.body.customer.manual_override, 'No');
      console.log('✔ POST /api/master/:id/override passed');

      // 11. GET /api/audit
      const auditRes = await request({
        path: '/api/audit',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(auditRes.statusCode, 200);
      assert.ok(Array.isArray(auditRes.body.logs));
      console.log('✔ GET /api/audit passed');

      // 12. GET /api/export/download (Master export XLSX)
      const exportRes = await request({
        path: '/api/export/download?type=master&format=csv',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(exportRes.statusCode, 200);
      assert.strictEqual(exportRes.headers['content-type'], 'text/csv');
      console.log('✔ GET /api/export/download passed');

      console.log('\n====================================================');
      console.log(' All API Integration Tests Passed Successfully! (12/12)');
      console.log('====================================================\n');

    } catch (err) {
      console.error('Test Suite Failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
