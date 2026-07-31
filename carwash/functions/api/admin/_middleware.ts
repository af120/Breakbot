export async function onRequest(context: any) {
  const { request, env, next } = context;
  
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    
    const match = cookieHeader.match(/session=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    
    const token = match[1];
    
    const session = await env.DB.prepare(
      `SELECT u.id, u.role 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP`
    ).bind(token).first();
    
    if (!session || session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Attach user to context data for downstream handlers
    context.data = context.data || {};
    context.data.user = session;
    
    return next();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
