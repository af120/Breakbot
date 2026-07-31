export async function onRequest(context) {
  return new Response(JSON.stringify({ message: 'Pong from Cloudflare Pages Functions!' }), {
    headers: {
      'content-type': 'application/json',
    },
  });
}
