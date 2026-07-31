# Car Wash Manager

A mobile-first website and business-management system for a local car wash.

## Architecture
- **Frontend**: React + TypeScript + Vite.
- **Styling**: Vanilla CSS with custom properties (`src/index.css`), following a premium navy/blue automotive design language. Supports deep right-to-left layout integration for Kurdish and Arabic.
- **Routing**: Client-side with `react-router-dom`.
- **Backend APIs**: Designed for Cloudflare Pages Functions (`functions/` directory).
- **Database**: Configured for Cloudflare D1.

## Local Setup

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Environment Variables
Copy `.env.example` to `.env` and fill in necessary configuration.

## Deployment
1. Log in to Cloudflare dashboard.
2. Navigate to Workers & Pages > Create application > Pages.
3. Connect your Git repository.
4. Set build command to `npm run build` and build output directory to `dist`.
5. Ensure `wrangler.toml` is present if configuring D1.

## Key Features Implemented
- Full responsive mobile-first UI avoiding standard component libraries to ensure a custom automotive look.
- Multi-lingual setup with support for English, Kurdish (Sorani), and Arabic.
- Admin dashboard mock-up displaying queue status.
- Cloudflare Pages Functions ready (see `functions/api/ping.ts`).
