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

  // API Routes
  app.get('/api/stats', (req, res) => {
    res.json({
      monthlySpend: 142850.20,
      potentialSavings: 28400.00,
      efficiencyScore: 92,
      spendTrend: "+ 4.2% vs last month",
      savingsTrend: "↓ 12 identified risks"
    });
  });

  app.get('/api/recommendations', (req, res) => {
    res.json([
      { 
        id: 1,
        title: "Resize r5.large Instances", 
        region: "us-east-1", 
        savings: "$12,400/yr", 
        status: "Critical",
        tag: "tag-blue",
        desc: "Avg CPU utilization under 5% for the last 30 days. Recommend downsizing to t3.medium."
      },
      { 
        id: 2,
        title: "Active S3 Lifecycle Policy", 
        region: "Global", 
        savings: "$4,200/yr", 
        status: "Medium",
        tag: "tag-amber",
        desc: "Move 4.2TB of standard storage to Intelligent-Tiering to auto-optimize access costs."
      },
      { 
        id: 3,
        title: "Cleanup EBS Volumes", 
        region: "us-west-2", 
        savings: "$850/yr", 
        status: "Low",
        tag: "tag-green",
        desc: "12 unattached volumes identified in development account that haven't been touched in 60 days."
      }
    ]);
  });

  app.get('/api/history', (req, res) => {
    res.json({
      months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      values: [40, 45, 42, 55, 60, 75, 70, 68, 62, 58, 50, 48]
    });
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
