// Vercel Serverless Function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const config = {
  runtime: 'nodejs',
  memory: 1024,
  maxDuration: 30
};

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  
  console.log('[API] Request:', path);
  console.log('[API] Supabase configured:', !!supabaseUrl && !!supabaseKey);
  
  // Health endpoint
  if (path === '/api/health' || path === '/health') {
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
  if (path === '/api/products') {
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ 
        error: 'Supabase credentials not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      console.log('[API] Fetching products from Supabase...');
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) {
        console.log('[API] Supabase error:', error.message);
        return new Response(JSON.stringify({ 
          error: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log('[API] Products found:', data?.length || 0);
      return new Response(JSON.stringify(data || []), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      console.log('[API] Catch error:', e.message);
      return new Response(JSON.stringify({ 
        error: e.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Not found
  return new Response(JSON.stringify({ 
    error: 'Not found',
    path: path
  }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}