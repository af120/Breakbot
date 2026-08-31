import { config } from '../config.js';

const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Auth State Check
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    loadReservations();
  } else {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Load Reservations
async function loadReservations() {
  const tbody = document.getElementById('reservationsTableBody');
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6">Error loading reservations</td></tr>`;
    return;
  }

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No reservations found</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(res => `
    <tr>
      <td>${res.reservation_code}</td>
      <td>
        <strong>${res.customer_name}</strong><br>
        <small>${res.phone}</small>
      </td>
      <td>
        ${res.reservation_date}<br>
        <small>${res.reservation_time}</small>
      </td>
      <td>${res.party_size}</td>
      <td><span class="status-badge status-${res.status}">${res.status}</span></td>
      <td>
        <button onclick="updateStatus('${res.id}', 'confirmed')" class="btn" style="padding:0.25rem 0.5rem; font-size:0.8rem;">Confirm</button>
      </td>
    </tr>
  `).join('');
}

window.updateStatus = async (id, status) => {
    await supabase.from('reservations').update({ status }).eq('id', id);
    loadReservations();
}
