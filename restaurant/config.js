// Copy this file to config.js and fill in your credentials
// IMPORTANT: Never commit config.js with production secrets!

export const config = {
  supabaseUrl: 'https://hpffjrmzjbfxnkvqhtow.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZmZqcm16amJmeG5rdnFodG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTcwMjgsImV4cCI6MjEwMzc3MzAyOH0.9YUPQrz38nXOauRR3MLopjGujPDjovtnKeUwxwaiS0E',
  turnstileSiteKey: 'YOUR_TURNSTILE_SITE_KEY',
  
  // Restaurant Info Settings (Fallback if not loaded from DB)
  restaurantName: 'Ember & Oak',
  currency: 'USD',
  timezone: 'America/Los_Angeles'
};
