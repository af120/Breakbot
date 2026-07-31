import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const { email, password, token } = await request.json();
    
    // 1. Verify setup token
    if (!env.SETUP_TOKEN || env.SETUP_TOKEN !== token) {
      return new Response(JSON.stringify({ error: 'Invalid setup token' }), { status: 403 });
    }
    
    // 2. Check if admin already exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE role = ?').bind('admin').first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'Admin already initialized' }), { status: 400 });
    }

    // 3. Create admin
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, email, hash, 'admin', 1).run();

    return new Response(JSON.stringify({ success: true, message: 'Admin created successfully' }));
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
