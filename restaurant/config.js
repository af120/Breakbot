// Copy this file to config.js and fill in your credentials
// IMPORTANT: Never commit config.js with production secrets!

export const config = {
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  turnstileSiteKey: 'YOUR_TURNSTILE_SITE_KEY',
  
  // Restaurant Info Settings (Fallback if not loaded from DB)
  restaurantName: 'Ember & Oak',
  currency: 'USD',
  timezone: 'America/Los_Angeles'
};
