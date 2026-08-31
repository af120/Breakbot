export async function onRequestPost({ request, env }) {
  try {
    const { email, password } = await request.json();
    
    // Check against env variables
    if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
      // In production, generate a real JWT. Here we return a simple token for demonstration.
      // Cloudflare Pages doesn't have built-in session auth like Supabase.
      const token = btoa(\`\${email}:\${Date.now()}\`);
      return Response.json({ success: true, token });
    }
    
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
