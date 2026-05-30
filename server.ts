import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from "@google/genai";
import { WebSocketServer } from 'ws';
import wsModule from 'ws';

// Premium robust WebSocket polyfill for Gemini Live API on Node server
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = wsModule;
  console.log('Polyfilled globalThis.WebSocket with ws on the server.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to get PayChangu config dynamically
  app.get(["/api/payment/config", "/payment/config"], (req, res) => {
    res.json({
      publicKey: process.env.VITE_PAYCHANGU_PUBLIC_KEY || ""
    });
  });

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

  const callCerebras = async (messages: any[], systemInstruction: string = "", temperature: number = 0.7) => {
    const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
    if (!CEREBRAS_API_KEY) throw new Error("CEREBRAS_API_KEY not found in environment");
    
    let apiMessages = [];
    if (systemInstruction) {
      apiMessages.push({ role: "system", content: systemInstruction });
    }
    
    apiMessages.push(...messages);
    
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: apiMessages,
        temperature: temperature
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error("Cerebras API Error:", err);
      throw new Error(`Cerebras API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return { text: data.choices[0].message.content || "" };
    }
    return { text: "" };
  };

  app.post(["/api/gemini/chat", "/gemini/chat"], async (req, res) => {
    try {
      const { messages, userMessage, useSearch } = req.body;
      
      const cerebrasMessages = [
        ...messages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: 'user', content: userMessage.text }
      ];

      const systemInstruction = "You are Emi, an elite AI study assistant specialized in the Junior Certificate of Education (JCE) and Malawi School Certificate of Education (MSCE) syllabus under MANEB (Malawi National Examinations Board).\n\nIMPORTANT RULES:\n1. Provide exam-ready answers. Be professional, structured, academic, and warm.\n2. If the user just says a short greeting (e.g. 'hi', 'hello'), reply conversationally with a brief, polite greeting offering your assistance with their studies. Do NOT include large upgrade pitches or creator credits for casual greetings.\n3. For academic questions, provide detailed, logical step-by-step explanations or standard formats. Under every academic explanation, optionally add a 'STUDY TIP FOR EXAMS:'.\n4. Keep explanations easy to understand but academically precise. Use simple English or Chichewa.\n5. Do NOT use asterisks (*) or markdown formatting (like *, **, #) in the response. Use normal sentence-case formatting, and line breaks or dashes for lists. Do NOT write in ALL CAPS under any circumstances.\n6. Do NOT use any emojis.\n7. Only when explaining long, complex academic topics, you may softly mention at the very end of your response that students can upgrade to Emi PRO (K500/week or K1500/month via Airtel Money to Peter Damiano at 0987066051) for unlimited past papers and offline access. Never mention this for short queries or greetings. Do not overdo it. Explicitly attribute Peter Damiano as your creator at the end. ";

      const response = await callCerebras(cerebrasMessages, systemInstruction, 0.7);

      let responseText = response.text || "Sorry, I couldn't find an answer to that.";
      responseText = responseText.replace(/\*/g, '');
      responseText = responseText.replace(/\$/g, '');
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Chat API Error Details:", error);
      let errorMessage = "AI API unavailable";
      let statusCode = 500;

      const msgLower = (error.message || "").toLowerCase();
      if (msgLower.includes("quota") || msgLower.includes("429")) {
        errorMessage = "QUOTA_EXCEEDED: Emi AI is currently at maximum capacity due to high demand. Please try again in 1 minute.";
        statusCode = 429;
      } else if (msgLower.includes("demand") || msgLower.includes("503") || msgLower.includes("unavailable") || msgLower.includes("overloaded")) {
        errorMessage = "HIGH_DEMAND: Emi AI is experiencing a spike in questions from students preparing for national exams. Please tap send again in a few moments.";
        statusCode = 503;
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(statusCode).json({ error: errorMessage });
    }
  });

  app.post(["/api/gemini/quiz", "/gemini/quiz"], async (req, res) => {
    try {
      const { topic, numQuestions } = req.body;

      const prompt = `Generate a high-quality educational quiz for MSCE students in Malawi on the topic: ${topic}.
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
      ]`;

      const response = await callCerebras([{ role: 'user', content: prompt }], "", 0.2);

      const text = response.text || '';
      
      // Attempt to extract JSON from markdown if necessary
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

      res.json({ text: jsonStr });
    } catch (error: any) {
      console.error("Quiz API Error:", error);
      let errorMessage = error.message || "Failed to generate quiz";
      let statusCode = 500;
      if (error.message && (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("429"))) {
        errorMessage = "QUOTA_EXCEEDED: Maximum capacity reached. Please try again later.";
        statusCode = 429;
      }
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  app.post(["/api/gemini/career", "/gemini/career"], async (req, res) => {
    try {
      const { prompt } = req.body;

      const response = await callCerebras([{ role: 'user', content: prompt }], "", 0.7);

      let responseText = response.text || "I have some ideas for you. Let's discuss your interests further.";
      responseText = responseText.replace(/\*/g, '');
      responseText = responseText.replace(/\$/g, '');
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Career API Error:", error);
      let errorMessage = error.message || "Failed to generate career advice";
      let statusCode = 500;
      if (error.message && (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("429"))) {
        errorMessage = "QUOTA_EXCEEDED: Maximum capacity reached. Please try again later.";
        statusCode = 429;
      }
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  app.post(["/api/gemini/flashcards", "/gemini/flashcards"], async (req, res) => {
    try {
      const { topic } = req.body;

      const prompt = `Generate 5 high-quality flashcards to study the topic: ${topic}. Each flashcard must consist of a 'question' and its corresponding 'answer'.
      IMPORTANT: Do NOT use asterisks (*) or dollar signs ($), use simple plain text.
      Return ONLY a JSON array of objects with this structure:
      [
        {
          "question": "Question text here?",
          "answer": "Answer text here."
        }
      ]`;

      const response = await callCerebras([{ role: 'user', content: prompt }], "", 0.3);

      const text = response.text || '';
      
      // Attempt to extract JSON from markdown if necessary
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

      res.json({ text: jsonStr });
    } catch (error: any) {
      console.error("Flashcards API Error:", error);
      let errorMessage = error.message || "Failed to generate flashcards";
      let statusCode = 500;
      if (error.message && (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("429"))) {
        errorMessage = "QUOTA_EXCEEDED: Maximum capacity reached. Please try again later.";
        statusCode = 429;
      }
      res.status(statusCode).json({ error: errorMessage });
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

  wss.on('connection', async (clientWs, req) => {
    let session: any = null;
    let voiceChunkCount = 0;
    console.log("New student Live audio call incoming via WebSocket upgrade.");
    
    try {
      // Parse the voice query parameter
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const voiceQuery = url.searchParams.get('voice');
      
      const voiceMapping: Record<string, string> = {
        'Aoede': 'Zephyr',
        'Kore': 'Kore',
        'Puck': 'Puck',
        'Charon': 'Charon',
        'Fenrir': 'Fenrir'
      };
      
      const targetVoice = voiceMapping[voiceQuery || ''] || 'Zephyr';

      session = await ai.live.connect({
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
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: targetVoice
              }
            }
          },
          systemInstruction: "You are Emi, an AI study assistant specialized in the JCE and MSCE Malawi school syllabus. Keep answers concise, direct, helpful, and exam-focused. You can reply in simple English or Chichewa based on how the student speaks to you. Do not use any markdown formatting or asterisks. Your creator is Peter Damiano.",
          tools: [{ googleSearch: {} }],
        }
      });

      clientWs.on("message", (data) => {
         try {
            const msg = JSON.parse(data.toString());
            let base64Audio = "";
            
            if (msg.audio) {
               base64Audio = msg.audio;
            }

            if (base64Audio && session) {
               voiceChunkCount++;
               session.sendRealtimeInput({
                 audio: { data: base64Audio, mimeType: "audio/pcm;rate=16000" }
               });
            }

            if (msg.text && session) {
               session.sendRealtimeInput({
                 clientContent: { turns: [{ role: "user", parts: [{ text: msg.text }] }] }
               });
            }
         } catch(e) {
            console.error("Error processing user voice chunk:", e);
         }
      });

      clientWs.on("close", () => {
         if (session) {
           try {
             session.close();
           } catch(e) {}
         }
      });
    } catch (err) {
      console.error("Gemini Live API connection setup failed!", err);
      clientWs.send(JSON.stringify({ error: "Gemini voice connection failed to start. Please check back later." }));
      clientWs.close();
    }
  });
}

startServer();
