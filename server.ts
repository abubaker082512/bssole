import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

import productsRouter from "./server/routes/products.js";
import categoriesRouter from "./server/routes/categories.js";
import variantsRouter from "./server/routes/variants.js";
import attributesRouter from "./server/routes/attributes.js";
import ordersRouter from "./server/routes/orders.js";
import customersRouter from "./server/routes/customers.js";
import settingsRouter from "./server/routes/settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(express.json());

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/attributes', attributesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/settings', settingsRouter);

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
