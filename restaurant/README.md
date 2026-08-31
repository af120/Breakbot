# Ember & Oak — Restaurant Website

A production-quality restaurant website with a Supabase backend for reservations, menu management, and settings.

## Architecture

- **Frontend**: Vanilla HTML/CSS/JS (hosted on GitHub Pages).
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions).

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project.
2. Run the SQL migration in `supabase/migrations/20260101000000_initial_schema.sql` in the Supabase SQL Editor.
3. This creates the necessary tables, functions, and RLS policies.

### 2. Configure Environment
1. Copy `config.example.js` to `config.js` in the root of the project.
2. Add your Supabase URL and Anon Key.
3. **DO NOT** commit `config.js` with production credentials unless you are certain RLS policies secure your data (the default policies are secure for Anon access, but never expose Service Role keys).

### 3. Deploy Edge Functions
Edge Functions are used to safely process reservations and handle newsletters without exposing logic to the client.
You will need the Supabase CLI:
\`\`\`bash
supabase functions deploy create-reservation
\`\`\`
*Ensure you set the `SUPABASE_SERVICE_ROLE_KEY` secret for your Edge Functions via the Supabase dashboard or CLI.*

### 4. Admin Account Setup
To manage the restaurant:
1. Go to Supabase Authentication.
2. Disable "Enable Email Signup" to prevent random users from creating accounts.
3. Manually invite or create a user with your admin email.
4. Log in at `https://your-domain.com/admin/index.html`.

### 5. Local Development
Since the frontend uses ES Modules (`type="module"`), you must serve the files via a local web server (e.g., Live Server in VSCode, or `python -m http.server 8000`).
Open `http://localhost:8000` to view the site.

### 6. Deployment (GitHub Pages)
1. Commit your changes.
2. Ensure `config.js` is set up correctly (if you want the site to work in production, you can commit it WITH ONLY the public anon key and URL. **Never put your Service Role Key in this file.**)
3. Push to GitHub, and the Pages action will deploy it.

## Features Implemented
- Dynamic Menu rendering from DB (fallback to demo data if disconnected)
- Live reservation slot availability checking
- Backend table schema for Settings, Menu, Reservations
- Admin Dashboard for viewing reservations
- Accessibility improvements (ARIA attributes, keyboard navigation)
- Refactored JS into modular architecture
- Basic Legal Pages (Terms, Privacy, Accessibility)

## Intentionally Unfinished
- **Admin Settings/Menu Editing UI**: The admin dashboard currently only displays reservations. Full CRUD UI for menu items and settings requires more comprehensive components (like React/Vue, or extensive Vanilla JS) which is a natural next step. For now, data can be managed via the Supabase Dashboard.
- **Transactional Emails**: The `create-reservation` edge function has a placeholder for sending emails (e.g., via Resend). You must add your provider's API logic there.
- **Turnstile (Captcha)**: The UI logic exists conceptually in the newsletter/reservation flows, but the frontend widget and backend validation needs your specific Site Key and Secret.
