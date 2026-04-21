import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy /api requests to backend
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
  app.use('/api', async (req, res) => {
    try {
      const url = `${BACKEND_URL}/api${req.url}`;
      const fetchRes = await fetch(url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: JSON.stringify(req.body) } : {})
      });
      const data = await fetchRes.json();
      res.status(fetchRes.status).json(data);
    } catch {
      res.status(502).json({ error: 'Backend unavailable' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
