const API_URL = "https://barbershop-api.af120-barbershop.workers.dev/api";
async function test() {
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin123!' })
  });
  const loginData = await loginRes.json();
  const barberRes = await fetch(`${API_URL}/barbers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      name: "Test Barber " + Date.now(),
      phone: "123456789",
      working_hours: "9-5",
      days_off: "Sunday",
      commission_percentage: 50
    })
  });
  console.log("Add Barber Status:", barberRes.status);
  console.log("Add Barber Data:", await barberRes.text());
}
test();
