import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './auth';

import authRoutes from './routes/auth';
import servicesRoutes from './routes/services';
import customersRoutes from './routes/customers';
import vehiclesRoutes from './routes/vehicles';
import appointmentsRoutes from './routes/appointments';
import publicRoutes from './routes/public';
import baysRoutes from './routes/bays';
import employeesRoutes from './routes/employees';
import paymentsRoutes from './routes/payments';
import expensesRoutes from './routes/expenses';
import galleryRoutes from './routes/gallery';
import testimonialsRoutes from './routes/testimonials';
import reportsRoutes from './routes/reports';
import auditRoutes from './routes/audit';
import backupRoutes from './routes/backup';
import contentRoutes from './routes/content';
import settingsRoutes from './routes/settings';

export type Env = {
  DB: any;
  ASSETS: any;
  MEDIA: any;
  JWT_SECRET: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Env: Env }>();

app.use('*', cors({ origin: () => '*' }));

app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/public') || c.req.path === '/api/auth/login') {
    return next();
  }
  return authMiddleware(c, next);
});

app.route('/api/auth', authRoutes);
app.route('/api/services', servicesRoutes);
app.route('/api/customers', customersRoutes);
app.route('/api/vehicles', vehiclesRoutes);
app.route('/api/appointments', appointmentsRoutes);
app.route('/api/bays', baysRoutes);
app.route('/api/employees', employeesRoutes);
app.route('/api/payments', paymentsRoutes);
app.route('/api/expenses', expensesRoutes);
app.route('/api/gallery', galleryRoutes);
app.route('/api/testimonials', testimonialsRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/audit', auditRoutes);
app.route('/api/backup', backupRoutes);
app.route('/api/content', contentRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/public', publicRoutes);

app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ success: false, error: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  // Let Cloudflare Assets single-page-application fallback handle it
  return c.env.ASSETS ? c.env.ASSETS.fetch(c.req.raw) : c.text('Not Found', 404);
});

export default app;
