import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from "@google/genai";
import { WebSocketServer } from 'ws';

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

  app.post("/api/payment/webhook", async (req, res) => {
    const event = req.body;
    console.log("PayChangu Webhook Event:", event);
    res.sendStatus(200);
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages, userMessage } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [...messages, userMessage].map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are an AI study assistant named Emi. Answer the student's questions clearly, concisely, and informally. Help them with homework, study tips, or explanations of academic concepts. IMPORTANT RULES: 1. You must strictly align with the Malawi Secondary School Curriculum (MSCE) not from outside. 2. Use simple English that is very easy to understand. 3. Give relevant, relatable examples for a student in Malawi. 4. Do NOT use asterisks (*) or any markdown symbols like *, **, or # for formatting. If you need emphasis, use ALL CAPITAL LETTERS or write normally. 5. Do NOT use dollar signs ($) for mathematical equations; write them in plain text mathematical notation. 6. Do NOT use any emojis in your response. 7. You are grounded and developed by Peter Damiano, a Malawian developer (find out more at Peterdamiano.vercel.app). 8. If the user question requires real-time information or factual data, synthesize the searched information smoothly into your response.",
          tools: [{ googleSearch: {} }]
        }
      });
      
      let responseText = response.text || 'Sorry, I couldn\'t find an answer to that.';
      responseText = responseText.replace(/\*/g, '');
      responseText = responseText.replace(/\$/g, '');
      res.json({ text: responseText });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/quiz", async (req, res) => {
    try {
      const { topic, numQuestions } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        config: { responseMimeType: "application/json" },
        contents: [{ role: 'user', parts: [{ text: `Generate a high-quality educational quiz for MSCE students in Malawi on the topic: ${topic}.
      Generate exactly ${numQuestions} multiple-choice questions.
      Each question must have 4 options and one correct answer.
      Provide a "summary" field explaining why the correct answer is right.
      IMPORTANT: Do NOT use asterisks (*) or dollar signs ($), use simple plain text.
      Return ONLY a JSON array of objects with this structure:
      [
        {
          "q": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Correct Option text",
          "summary": "Brief explanation of why this answer is correct."
        }
      ]` }] }]
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/career", async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { tools: [{ googleSearch: {} }]}
      });
      let responseText = response.text || 'I have some ideas for you. Let\'s discuss your interests further.';
      responseText = responseText.replace(/\*/g, '');
      responseText = responseText.replace(/\$/g, '');
      res.json({ text: responseText });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

  wss.on('connection', async (clientWs) => {
    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: "You are Emi AI, a helpful study assistant grounded and developed by Peter Damiano, a Malawian developer (Peterdamiano.vercel.app). Answer questions clearly but concisely and align with the Malawi Secondary School Curriculum (MSCE)." }] }
        }
      });
      clientWs.on("message", (data) => {
         try {
            const msg = JSON.parse(data.toString());
            if (msg.realtimeInput?.mediaChunks?.[0]?.data) {
               session.send({
                 realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: msg.realtimeInput.mediaChunks[0].data }] }
               });
            }
         } catch(e) { }
      });
      clientWs.on("close", () => {
         // session closes automatically sometimes or we can just drop reference
      });
    } catch (err) {
      console.error("Live API Connection error", err);
      clientWs.close();
    }
  });
}

startServer();
