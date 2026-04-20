// Simple Vercel handler - no imports to avoid crashes

export default async function handler(req: Request): Promise<Response> {
  return new Response(JSON.stringify({ 
    message: 'API is working!',
    path: new URL(req.url).pathname,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}