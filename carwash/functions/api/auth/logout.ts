export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/session=([^;]+)/);
      if (match) {
        const token = match[1];
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      }
    }
  } catch (e) {
    // Ignore errors on logout
  }

  const headers = new Headers();
  headers.append('Set-Cookie', `session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  headers.append('Content-Type', 'application/json');

  return new Response(JSON.stringify({ success: true }), { headers });
}
