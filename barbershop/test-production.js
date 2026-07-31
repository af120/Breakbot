const API_URL = 'https://barbershop-api.af120-barbershop.workers.dev/api';

async function test() {
  console.log('Logging in as admin...');
  const loginRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful! Token acquired.');
  
  console.log('Creating a new barber...');
  const barberRes = await fetch(`${API_URL}/barbers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Test Barber Production',
      phone: '123-456-7890',
      working_hours: '09:00-17:00',
      days_off: 'Sunday',
      commission_percentage: 50
    })
  });
  
  if (!barberRes.ok) {
    console.error('Create barber failed:', await barberRes.text());
    return;
  }
  
  const barberData = await barberRes.json();
  console.log('Create barber success! ID:', barberData.id);
  
  console.log('Fetching barbers...');
  const listRes = await fetch(`${API_URL}/barbers`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const barbers = await listRes.json();
  const createdBarber = barbers.find(b => b.name === 'Test Barber Production');
  
  if (createdBarber) {
    console.log('Test Passed: Barber remains stored in D1!');
  } else {
    console.error('Test Failed: Barber not found in list.');
  }
}

test();
