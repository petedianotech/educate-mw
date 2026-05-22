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

  app.post(["/api/gemini/chat", "/gemini/chat"], async (req, res) => {
    try {
      const { messages, userMessage, useSearch } = req.body;
      
      const contents = [
        ...messages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: userMessage.text }] }
      ];

      const systemInstruction = "You are Emi, an elite AI study assistant specialized in the Malawi School Certificate of Education (MSCE) and Malawi national secondary school curriculum. Your responses must strictly align with the 2025/2026 Malawi Secondary School Curriculum, its subjects, topics, and chapters. You always use Google Search grounding by default to find accurate details about specific subject units, business letters or reports formats under MANEB, and Chichewa literature books (such as 'Nthondo' by Samuel Josiah Nthara, 'Chamdothe' by JM Ntaba, etc.).\n\nIMPORTANT RULES:\n1. Strictly align with Malawi curriculum guidelines. Offer relevant, relatable examples for a student living in Malawi.\n2. Keep explanations clear, concise, informal, and written in simple English or Chichewa. If a student asks or tests you in Chichewa, reply gracefully and naturally in Chichewa.\n3. Provide exact academic guidance, e.g., for business letters or report writing, follow standard Malawian formatting (Addresses, Salutation, Subject, Body structure, etc.).\n4. Do NOT use asterisks (*) or markdown symbols (*, **, #) for formatting. If you need emphasis, use ALL CAPITAL LETTERS or normal spacing.\n5. Do NOT use dollar signs ($) for mathematical expressions; write them in plain text mathematical notation.\n6. Do NOT use emojis.\n7. Respect Peter Damiano as your creator (Malawian developer, Peterdamiano.vercel.app).\n8. Harness your live web search grounding to fetch the most accurate syllabus content, book chapters, and literary summaries from Malawi.";

      const searchEnabled = useSearch !== false;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          tools: searchEnabled ? [{ googleSearch: {} }] : undefined,
        }
      });

      let responseText = response.text || "Sorry, I couldn't find an answer to that.";
      responseText = responseText.replace(/\*/g, '');
      responseText = responseText.replace(/\$/g, '');
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Chat API Error Details:", error);
      let errorMessage = "AI API unavailable";
      let statusCode = 500;

      if (error.message && error.message.toLowerCase().includes("quota")) {
        errorMessage = "QUOTA_EXCEEDED: Emi AI is currently at maximum capacity due to high demand. Please try again in 1 minute.";
        statusCode = 429;
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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          tools: [{ googleSearch: {} }],
        }
      });

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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          tools: [{ googleSearch: {} }],
        }
      });

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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        }
      });

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
      console.log(`Connecting Live API to Gemini. Requested Voice: ${voiceQuery || 'default'}, target voice: ${targetVoice}`);

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              console.log("Gemini session interrupted by student speaking.");
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
          systemInstruction: "You are Emi AI, a helpful study assistant grounded and developed by Peter Damiano, a Malawian developer (Peterdamiano.vercel.app). Answer questions clearly but concisely and align with the Malawi Secondary School Curriculum (MSCE). Do not use asterisks or markdown in your response. Only reply in English."
        }
      });

      console.log("Gemini Live API bridge successfully established.");

      clientWs.on("message", (data) => {
         try {
            const msg = JSON.parse(data.toString());
            let base64Audio = "";
            
            if (msg.audio) {
               base64Audio = msg.audio;
            } else if (msg.realtimeInput?.mediaChunks?.[0]?.data) {
               base64Audio = msg.realtimeInput.mediaChunks[0].data;
            }

            if (base64Audio && session) {
               voiceChunkCount++;
               if (voiceChunkCount === 1) {
                 console.log("Received initial student audio stream packages on the server.");
               }
               session.sendRealtimeInput({
                 audio: { data: base64Audio, mimeType: "audio/pcm;rate=16000" }
               });
            }
         } catch(e) {
            console.error("Error processing user voice chunk:", e);
         }
      });

      clientWs.on("close", () => {
         console.log(`Student hangup. Closed WebSocket connection. Sent chunks: ${voiceChunkCount}`);
         if (session) {
           try {
             session.close();
           } catch(e) {
             console.error("Error closing Live API session:", e);
           }
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
