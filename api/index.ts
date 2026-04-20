// Vercel Serverless Function - Simplified
export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Import supabase only when needed
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;
  
  // Health
  if (path === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok',
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      supabaseKey: supabaseKey ? 'SET' : 'NOT SET'
    }), { headers: { 'Content-Type': 'application/json' } });
  }
  
  // Products
  if (path === '/api/products' || path === '/products') {
    if (!supabase) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const { data } = await supabase.from('products').select('*');
    return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
  }
  
  // Hero Slides  
  if (path === '/api/hero-slides' || path === '/hero-slides') {
    if (!supabase) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const { data } = await supabase.from('hero_slides').select('*').eq('is_active', true);
    return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
  }
  
  // Site Content
  if (path === '/api/site-content' || path === '/site-content') {
    if (!supabase) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const { data } = await supabase.from('site_content').select('*');
    const content: any = {};
    (data || []).forEach((row: any) => { content[row.key] = row.value; });
    return new Response(JSON.stringify(content), { headers: { 'Content-Type': 'application/json' } });
  }
  
  // Categories
  if (path === '/api/categories' || path === '/categories') {
    if (!supabase) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const { data } = await supabase.from('categories').select('*');
    return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
  }
  
  return new Response(JSON.stringify({ error: 'Not found', path }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
