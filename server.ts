import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(express.json());

// Simple health check - doesn't import supabase to avoid crash
app.get('/api/health', (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env_check: {
            SUPABASE_URL: supabaseUrl ? 'SET' : 'NOT SET',
            SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? 'SET' : 'NOT SET'
        }
    });
});

// Lazy load routes only when needed
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working', time: new Date().toISOString() });
});

export async function startServer() {
  const PORT = process.env.PORT || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
