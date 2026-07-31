const { sign, verify } = require('hono/jwt');
async function test() {
  const secret = 'super-secret-jwt-key-change-this-in-production-breakbot-2026';
  const token = await sign({ id: 1, username: 'admin' }, secret, 'HS256');
  try {
    const decoded = await verify(token, secret, 'HS256');
    console.log('Decoded:', decoded);
  } catch (err) {
    console.error('Verify error:', err);
  }
}
test();
