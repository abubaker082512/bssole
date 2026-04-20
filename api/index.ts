import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Health endpoint
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      supabaseKey: supabaseKey ? 'SET' : 'NOT SET'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Products endpoint
  if (url.pathname === '/api/products') {
    try {
      const { data, error } = await supabase.from('products').select('*');
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(data || []), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // 404 for other routes
  return new Response(JSON.stringify({ error: 'Not found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}