import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const { email, password } = await request.json();
    
    // Find user
    const user = await env.DB.prepare('SELECT id, password_hash, role, must_change_password FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    // Create session
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(uuidv4(), user.id, token, expiresAt.toISOString()).run();

    // Set cookie
    const headers = new Headers();
    headers.append('Set-Cookie', `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
    headers.append('Content-Type', 'application/json');

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: user.id, role: user.role, must_change_password: user.must_change_password === 1 } 
    }), { headers });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
