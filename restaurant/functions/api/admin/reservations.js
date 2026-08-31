export async function onRequestGet({ request, env }) {
  try {
    // Basic auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { results } = await env.DB.prepare(
      "SELECT * FROM reservations ORDER BY reservation_date ASC, reservation_time ASC"
    ).all();
    
    return Response.json(results || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id, status } = await request.json();
    await env.DB.prepare(
      "UPDATE reservations SET status = ? WHERE id = ?"
    ).bind(status, id).run();
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
