import { config } from '../config.js';

// Supabase client instance
let supabase = null;

// Initialize Supabase if available globally
if (window.supabase) {
  supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
} else {
  console.warn('Supabase client not loaded. Running in demo mode.');
}

export function isDemoMode() {
  return !supabase || config.supabaseUrl === 'YOUR_SUPABASE_URL';
}

// ==========================================
// RESTAURANT SETTINGS
// ==========================================
export async function getRestaurantSettings() {
  if (isDemoMode()) return null;
  const { data, error } = await supabase.from('restaurant_settings').select('*').single();
  if (error) throw error;
  return data;
}

export async function getBusinessHours() {
  if (isDemoMode()) return null;
  const { data, error } = await supabase.from('business_hours').select('*');
  if (error) throw error;
  return data;
}

// ==========================================
// MENU
// ==========================================
export async function getMenuCategories() {
  if (isDemoMode()) return []; // handled by fallback data
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function getMenuItems() {
  if (isDemoMode()) return []; // handled by fallback data
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      menu_item_tags (
        tag
      )
    `)
    .eq('is_available', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

// ==========================================
// RESERVATIONS
// ==========================================
export async function checkAvailability(date, partySize) {
  if (isDemoMode()) {
    // Fake availability for demo mode
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
        ]);
      }, 500);
    });
  }

  // Call Supabase Edge Function or Postgres Function
  // Assuming a Postgres function `get_available_slots`
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_date: date,
    p_party_size: partySize
  });

  if (error) throw error;
  return data; // Array of available time strings like '17:30'
}

export async function createReservation(reservationData) {
  if (isDemoMode()) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error("Network error"));
        } else {
          resolve({ reservation_code: 'DEMO-' + Math.floor(Math.random()*10000) });
        }
      }, 1000);
    });
  }

  // Use Edge Function for creating reservation to prevent double booking and send email
  const { data, error } = await supabase.functions.invoke('create-reservation', {
    body: reservationData
  });
  
  if (error) throw error;
  return data;
}

export async function cancelReservation(token) {
  if (isDemoMode()) return true;
  
  const { data, error } = await supabase.functions.invoke('cancel-reservation', {
    body: { token }
  });

  if (error) throw error;
  return data;
}

// ==========================================
// NEWSLETTER
// ==========================================
export async function subscribeNewsletter(email, turnstileToken) {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
  }

  const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
    body: { email, turnstileToken }
  });

  if (error) throw error;
  return data;
}
