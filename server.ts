import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("store.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    featured INTEGER DEFAULT 0
  )
`);

// Seed initial data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO products (name, description, price, image, category, featured) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run("BSSole Gold Runner", "Premium athletic performance with a touch of luxury.", 189.99, "https://picsum.photos/seed/shoe1/800/800", "Running", 1);
  insert.run("Midnight Sole Executive", "Sleek black leather for the modern professional.", 249.99, "https://picsum.photos/seed/shoe2/800/800", "Formal", 1);
  insert.run("Golden Street Sole", "Urban style meets high-end finish.", 129.99, "https://picsum.photos/seed/shoe3/800/800", "Casual", 1);
  insert.run("Onyx BSSole Sport", "Lightweight and durable for daily use.", 99.99, "https://picsum.photos/seed/shoe4/800/800", "Sport", 0);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, description, price, image, category, featured } = req.body;
    const result = db.prepare("INSERT INTO products (name, description, price, image, category, featured) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, description, price, image, category, featured ? 1 : 0);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, description, price, image, category, featured } = req.body;
    db.prepare("UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, featured = ? WHERE id = ?")
      .run(name, description, price, image, category, featured ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
