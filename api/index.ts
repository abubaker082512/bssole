import app from '../server.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function entrypoint
// `app` is our Express server
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Delegate the request to the Express app
  return app(req, res);
}