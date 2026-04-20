import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import productsRouter from './server/routes/products.js';
import ordersRouter from './server/routes/orders.js';
import categoriesRouter from './server/routes/categories.js';
import attributesRouter from './server/routes/attributes.js';
import variantsRouter from './server/routes/variants.js';
import customersRouter from './server/routes/customers.js';
import settingsRouter from './server/routes/settings.js';
import siteContentRouter from './server/routes/siteContent.js';
import heroSlidesRouter from './server/routes/heroSlides.js';


export const app = express();
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/attributes', attributesRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/site-content', siteContentRouter);
app.use('/api/hero-slides', heroSlidesRouter);

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
