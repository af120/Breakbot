const API_URL = 'https://barbershop-api.af120-barbershop.workers.dev/api';
async function test() {
  const loginRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const data = await loginRes.json();
  console.log('Token:', data.token);
  const parts = data.token.split('.');
  console.log('Header:', Buffer.from(parts[0], 'base64').toString());
  console.log('Payload:', Buffer.from(parts[1], 'base64').toString());
}
test();
