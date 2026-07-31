export async function onRequestGet(context: any) {
  const { env } = context;
  
  try {
    const { results } = await env.DB.prepare(
      `SELECT r.id, r.reference, r.time, r.status, v.plate_number, v.type 
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.date = date('now')
       ORDER BY r.time ASC`
    ).all();

    return new Response(JSON.stringify({ queue: results }), { headers: { 'Content-Type': 'application/json' }});
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
