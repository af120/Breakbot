export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM menu_items WHERE is_available = 1 ORDER BY sort_order"
    ).all();
    
    // Also fetch categories and tags here if needed, or in separate requests
    return Response.json(results || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
