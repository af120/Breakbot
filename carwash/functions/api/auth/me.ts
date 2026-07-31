export async function onRequestGet(context: any) {
  const { request, env } = context;
  
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ user: null }), { status: 401 });
    
    const match = cookieHeader.match(/session=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ user: null }), { status: 401 });
    
    const token = match[1];
    
    // Check session in DB
    const session = await env.DB.prepare(
      `SELECT u.id, u.role, u.must_change_password 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP`
    ).bind(token).first();
    
    if (!session) {
      return new Response(JSON.stringify({ user: null }), { status: 401 });
    }

    return new Response(JSON.stringify({ 
      user: { id: session.id, role: session.role, must_change_password: session.must_change_password === 1 } 
    }), { headers: { 'Content-Type': 'application/json' }});
    
  } catch (err) {
    return new Response(JSON.stringify({ user: null }), { status: 500 });
  }
}
