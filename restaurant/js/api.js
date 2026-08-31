export function isDemoMode() {
  return window.location.hostname === 'localhost' || window.location.hostname.includes('github.io');
}

async function fetchAPI(endpoint, options = {}) {
  if (isDemoMode()) throw new Error("Demo Mode");
  const res = await fetch(endpoint, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'API Error');
  }
  return res.json();
}

// ==========================================
// MENU
// ==========================================
export async function getMenuCategories() {
  if (isDemoMode()) return []; 
  return await fetchAPI('/api/menu-categories');
}

export async function getMenuItems() {
  if (isDemoMode()) return []; 
  return await fetchAPI('/api/menu');
}

// ==========================================
// RESERVATIONS
// ==========================================
export async function checkAvailability(date, partySize) {
  if (isDemoMode()) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']);
      }, 500);
    });
  }
  // Simplified for Cloudflare: return hardcoded slots for now
  return ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
}

export async function createReservation(reservationData) {
  if (isDemoMode()) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ reservation_code: 'DEMO-' + Math.floor(Math.random()*10000) });
      }, 1000);
    });
  }

  return await fetchAPI('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservationData)
  });
}

// ==========================================
// NEWSLETTER
// ==========================================
export async function subscribeNewsletter(email, turnstileToken) {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
  }

  return await fetchAPI('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, turnstileToken })
  });
}

export async function getRestaurantSettings() {
  return null;
}
