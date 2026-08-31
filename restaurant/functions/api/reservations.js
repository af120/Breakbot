export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    
    // In a real app, verify Turnstile here
    
    // Generate UUIDs
    const id = crypto.randomUUID();
    const dateStr = body.reservation_date.replace(/-/g, '').substring(2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = \`EO-\${dateStr}-\${random}\`;
    const cancellation_token = crypto.randomUUID();

    // Very basic capacity check (a robust one would sum existing guests)
    // For simplicity in this demo, we assume the frontend filtered available times.
    
    await env.DB.prepare(\`
      INSERT INTO reservations (id, reservation_code, customer_name, email, phone, reservation_date, reservation_time, party_size, occasion, special_requests, cancellation_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`).bind(
      id,
      reservation_code,
      body.customer_name,
      body.email,
      body.phone,
      body.reservation_date,
      body.reservation_time,
      body.party_size,
      body.occasion || null,
      body.special_requests || null,
      cancellation_token
    ).run();

    return Response.json({ success: true, reservation_code });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
