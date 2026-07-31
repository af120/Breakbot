const { sign, verify } = require('hono/jwt');
async function test() {
  const secret = 'super-secret-jwt-key-change-this-in-production-breakbot-2026';
  const token = await sign({ id: 1, username: 'admin' }, secret);
  try {
    const decoded = await verify(token, secret);
    console.log('Decoded:', decoded);
  } catch (err) {
    console.error('Verify error:', err);
  }
}
test();
