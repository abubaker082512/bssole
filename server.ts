import express from "express";
import path from "path";
import { fileURLToPath } from "url";

export const app = express();
app.use(express.json());

// Lazy load routes to prevent server crash on initialization
app.use('/api/products', (req, res, next) => {
    import('./server/routes/products').then(m => app.use('/api/products', m.default)).catch(next);
});
app.use('/api/orders', (req, res, next) => {
    import('./server/routes/orders').then(m => app.use('/api/orders', m.default)).catch(next);
});
app.use('/api/categories', (req, res, next) => {
    import('./server/routes/categories').then(m => app.use('/api/categories', m.default)).catch(next);
});
app.use('/api/attributes', (req, res, next) => {
    import('./server/routes/attributes').then(m => app.use('/api/attributes', m.default)).catch(next);
});
app.use('/api/variants', (req, res, next) => {
    import('./server/routes/variants').then(m => app.use('/api/variants', m.default)).catch(next);
});
app.use('/api/customers', (req, res, next) => {
    import('./server/routes/customers').then(m => app.use('/api/customers', m.default)).catch(next);
});
app.use('/api/settings', (req, res, next) => {
    import('./server/routes/settings').then(m => app.use('/api/settings', m.default)).catch(next);
});
app.use('/api/site-content', (req, res, next) => {
    import('./server/routes/siteContent').then(m => app.use('/api/site-content', m.default)).catch(next);
});
app.use('/api/hero-slides', (req, res, next) => {
    import('./server/routes/heroSlides').then(m => app.use('/api/hero-slides', m.default)).catch(next);
});

// Simple health check - does NOT import supabase to avoid crash
app.get('/api/health', (req, res) => {
    try {
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            message: 'Server is running'
        });
    } catch (error: any) {
        console.error('[HEALTH] Error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Lazy load routes only when needed
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working', time: new Date().toISOString() });
});

export async function startServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PORT = process.env.PORT || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the server if not running inside Vercel Serverless Functions
if (!process.env.VERCEL) {
  startServer();
}

export default app;

// Basic 404 for API routes and a global error handler to keep API responses consistent
// Note: This is intentionally lightweight to avoid masking route-specific errors above.
app.use('/api', (req: any, res: any) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err: any, req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err?.message ?? 'Internal Server Error' });
});
