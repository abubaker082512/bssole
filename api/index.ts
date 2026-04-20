// Vercel Serverless Function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Health endpoint
  if (path === '/api/health' || path === '/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      supabaseKey: supabaseKey ? 'SET' : 'NOT SET',
      supabaseClient: !!supabase
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Products endpoint
  if (path === '/api/products') {
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Simple select for now
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        return new Response(JSON.stringify({ 
          error: error.message,
          details: error
        }), {
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
  
  // Hero Slides endpoint
  if (path === '/api/hero-slides') {
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
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
  
  // Site Content endpoint
  if (path === '/api/site-content') {
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*');
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Convert to key-value object
      const content: any = {};
      (data || []).forEach((row: any) => {
        content[row.key] = row.value;
      });
      
      return new Response(JSON.stringify(content), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
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