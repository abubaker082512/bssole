// Simple Vercel serverless function - no imports that could crash

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Health endpoint
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Products endpoint - simple response for now
  if (url.pathname === '/api/products') {
    return new Response(JSON.stringify({ 
      message: 'Products endpoint works but needs Supabase config',
      envCheck: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 404 for other routes
  return new Response(JSON.stringify({ error: 'Not found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}
