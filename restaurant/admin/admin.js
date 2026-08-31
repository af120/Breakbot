const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

function getToken() {
  return localStorage.getItem('adminToken');
}

function checkAuth() {
  if (getToken()) {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    loadReservations();
  } else {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
  }
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('adminToken', data.token);
      checkAuth();
    } else {
      loginError.textContent = data.error || 'Login failed';
    }
  } catch (err) {
    loginError.textContent = 'Network error';
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  checkAuth();
});

// Load Reservations
async function loadReservations() {
  const tbody = document.getElementById('reservationsTableBody');
  
  try {
    const res = await fetch('/api/admin/reservations', {
      headers: { 'Authorization': \`Bearer \${getToken()}\` }
    });
    
    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      checkAuth();
      return;
    }
    
    const data = await res.json();

    if (data.length === 0) {
      tbody.innerHTML = \`<tr><td colspan="6">No reservations found</td></tr>\`;
      return;
    }

    tbody.innerHTML = data.map(r => \`
      <tr>
        <td>\${r.reservation_code}</td>
        <td>
          <strong>\${r.customer_name}</strong><br>
          <small>\${r.phone}</small>
        </td>
        <td>
          \${r.reservation_date}<br>
          <small>\${r.reservation_time}</small>
        </td>
        <td>\${r.party_size}</td>
        <td><span class="status-badge status-\${r.status}">\${r.status}</span></td>
        <td>
          <button onclick="updateStatus('\${r.id}', 'confirmed')" class="btn" style="padding:0.25rem 0.5rem; font-size:0.8rem;">Confirm</button>
        </td>
      </tr>
    \`).join('');
  } catch (err) {
    tbody.innerHTML = \`<tr><td colspan="6">Error loading reservations</td></tr>\`;
  }
}

window.updateStatus = async (id, status) => {
    await fetch('/api/admin/reservations', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${getToken()}\`
      },
      body: JSON.stringify({ id, status })
    });
    loadReservations();
}

checkAuth();
