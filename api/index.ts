const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('ENV:', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_KEY: !!SUPABASE_KEY });

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const err = 'Missing ENV: SUPABASE_URL=' + !!SUPABASE_URL + ', SUPABASE_KEY=' + !!SUPABASE_KEY;
    console.error(err);
    throw new Error(err);
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  try {
    if (path === '/api/health' || path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_KEY,
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/products' || path === '/products') && req.method === 'GET') {
      const data = await supabaseFetch('products?select=*');
      return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/hero-slides' || path === '/hero-slides') && req.method === 'GET') {
      const data = await supabaseFetch('hero_slides?is_active=eq.true&select=*');
      return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/site-content' || path === '/site-content') && req.method === 'GET') {
      const data = await supabaseFetch('site_content?select=*');
      const content: Record<string, string> = {};
      (data || []).forEach((row: any) => { content[row.key] = row.value; });
      return new Response(JSON.stringify(content), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/categories' || path === '/categories') && req.method === 'GET') {
      const data = await supabaseFetch('categories?select=*');
      return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/attributes' || path === '/attributes') && req.method === 'GET') {
      const data = await supabaseFetch('attributes?select=*');
      return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/orders' || path === '/orders') && req.method === 'GET') {
      const data = await supabaseFetch('orders?select=*&order=created_at.desc');
      return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/customers' || path === '/customers') && req.method === 'GET') {
      const data = await supabaseFetch('customers?select=*');
      return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if ((path === '/api/settings' || path === '/settings') && req.method === 'GET') {
      const data = await supabaseFetch('settings?select=*');
      return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({ error: 'Not found', path }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}