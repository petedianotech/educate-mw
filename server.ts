import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to verify PayChangu payment synchronously
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { tx_ref } = req.body;
      const secretKey = process.env.PAYCHANGU_SECRET_KEY;
      
      if (!secretKey) {
        return res.status(500).json({ error: "Server missing PayChangu secret key." });
      }

      const response = await fetch(`https://api.paychangu.com/verify-payment/${tx_ref}`, {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.status === 'success' && data.data && data.data.status === 'success') {
        return res.json({ success: true, data: data.data });
      } else {
        return res.status(400).json({ success: false, message: data.message || "Payment verification failed" });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Webhook for PayChangu (Optional but recommended for production)
  app.post("/api/payment/webhook", async (req, res) => {
    const event = req.body;
    // Log the event or handle async payment success here
    console.log("PayChangu Webhook Event:", event);
    res.sendStatus(200);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
