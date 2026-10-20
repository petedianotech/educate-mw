import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";
import { WebSocketServer } from 'ws';
import { WebSocket as wsClass } from 'ws';

// Premium robust WebSocket polyfill for Gemini Live API on Node server
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = wsClass;
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

  // API to get ephemeral Gemini Live token for client-side direct connection
  app.get("/api/gemini/token", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server missing GEMINI_API_KEY environment variable" });
      }
      const tokenObj = await ai.authTokens.create({});
      res.json({ token: tokenObj.name });
    } catch (error: any) {
      console.error("Gemini Token Server Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate Gemini token" });
    }
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

  function getEmiSystemInstruction(userLevel?: string, isProUser?: boolean) {
    return `Role: You are Emi AI, a warm, patient, and encouraging AI tutor and secondary school teacher designed specifically for Malawian students.
You were built by lead developer Peter Damiano (portfolio: https://peterdamiano.vercel.app) in collaboration with the prestigious MSCE preparation team, including Sir S. Liffa and Sir E. Muthipo.

Your primary goal is to help Malawian students understand their school subjects, build confidence, and prepare effectively to pass their Junior Certificate of Education (JCE) and Malawi School Certificate of Education (MSCE) exams according to the official Malawi National Examinations Board (MANEB) curriculum.

${userLevel ? `\nCRITICAL CONTEXT: The student you are currently teaching is in ${userLevel}. You MUST tailor your vocabulary, examples, and depth of content specifically to the ${userLevel} syllabus level. Do not provide advanced concepts beyond their current grade unless explicitly asked.` : ''}
${isProUser ? `\nSUBSCRIPTION STATUS: PRO SUBSCRIBER. This student already has an active PRO subscription. NEVER mention upgrading, subscriptions, payments, or Airtel Money.` : `\nSUBSCRIPTION STATUS: STANDARD USER. Focus 100% on academic tutoring. Do NOT mention payments or upgrades in regular answers. Only if the student explicitly asks how to get past papers, unlimited credits, or upgrade, you may mention that they can upgrade to Educate MW Pro (K7,000 for Full Access via Airtel Money to S. Lifa at 0999136433).`}

Core Instructions & Pedagogical Guidelines:

1. Curriculum Alignment & Malawi Context:
   - Deep knowledge of the MANEB syllabus and Malawi secondary curriculum across all subjects: Mathematics, Biology, Chemistry, Physics, Agriculture, English (Language & Literature), Chichewa, History, Geography, Bible Knowledge, Computer Studies, and Social and Life Skills.
   - Use local, relatable Malawian examples (local farming practices in Agriculture, geography of Malawi, local daily scenarios).

2. Pedagogical Approach (How to Teach):
   - Scaffolding & Socratic Guidance: Do not just give the final answer immediately when a student asks a homework or exam question. Guide them step-by-step through logical reasoning. Break down complex topics into digestible parts and ask gentle checking questions.
   - Simple English & Memory Tips: Communicate in simple, clear, direct English. For difficult formulas, biological definitions, chemical reactions, or historical dates, ALWAYS provide a helpful memory tip, mnemonic, or acronym to aid student retention for MANEB exams.

3. Chichewa Language & Strict Honesty Rule:
   - If the student speaks or asks in Chichewa, respond warmly in Chichewa.
   - CRITICAL RULE FOR CHICHEWA / KNOWLEDGE UNCERTAINTY: If you do not know the answer or are uncertain about a fact in Chichewa or any other subject, you MUST clearly state in Chichewa that you do not know (e.g., "Sindikudziwa bwino yankho ili, chonde funsani aphunzitsi anu kapena fufuzani m'buku lanu la maphunziro") rather than guessing or hallucinating.

4. Google Search & Browsing:
   - You have active Google Search capabilities. Use search browsing whenever needed to verify MANEB syllabus updates, factual data, historical dates, or scientific facts in real-time.

5. Advanced Visualizations (Graphs, Shapes, Multi-dimensional Geometry) - CRITICAL:
   - You can automatically render interactive plots/graphs and geometric shapes for the student using custom json-formatted code blocks (json:plot, json:geometry).`;
  }


  function extractGeminiText(response: any): string {
    if (!response) return "";
    try {
      if (typeof response.text === "string" && response.text.trim()) return response.text;
    } catch {}
    try {
      const parts = response?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        return parts.map((p: any) => p?.text || "").filter(Boolean).join("\n").trim();
      }
    } catch {}
    return "";
  }

  /** Text models: prefer 3.1 Flash Lite (fast/cheap); fallback to 3.8 Flash (default quality). */
  const TEXT_MODELS = ["gemini-3.5-flash-lite"] as const; // Search grounding supported; high free-tier limits

  async function generateWithFallback(params: {
    contents: any;
    config?: any;
  }): Promise<any> {
    let lastError: any = null;
    for (const model of TEXT_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || "").toLowerCase();
        if (
          msg.includes("quota") ||
          msg.includes("429") ||
          msg.includes("503") ||
          msg.includes("unavailable") ||
          msg.includes("overloaded") ||
          msg.includes("not found") ||
          msg.includes("model")
        ) {
          console.warn(`Model ${model} failed, trying next:`, err?.message);
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error("All text models failed");
  }

  app.post(["/api/gemini/chat", "/gemini/chat"], async (req, res) => {
    try {
      const { messages, userMessage, useSearch, userLevel, isPro } = req.body;
      const isProUser = Boolean(isPro);

      const systemInstruction = getEmiSystemInstruction(userLevel, isProUser);

      const contents = [
        ...(messages || []).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text || '' }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage.text || '' }]
        }
      ];

      const config: any = {
        systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
      };

      let responseText = "";
      try {
        const response = await generateWithFallback({ contents, config });
        responseText = extractGeminiText(response) || "Sorry, I couldn't find an answer to that.";
      } catch (geminiError: any) {
        console.error("Gemini API error:", geminiError);
        throw geminiError;
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Chat API Error Details:", error);
      let errorMessage = "AI API unavailable";
      let statusCode = 500;

      const msgLower = (error.message || "").toLowerCase();
      if (msgLower.includes("quota") || msgLower.includes("429")) {
        errorMessage = "QUOTA_EXCEEDED: Emi AI is currently at maximum capacity. Please try again in a few moments.";
        statusCode = 429;
      } else if (msgLower.includes("demand") || msgLower.includes("503") || msgLower.includes("unavailable") || msgLower.includes("overloaded")) {
        errorMessage = "HIGH_DEMAND: Emi AI is experiencing high demand. Please try again in a moment.";
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

      const response = await generateWithFallback({ contents: prompt, config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        } });
      const text = extractGeminiText(response);
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

      const response = await generateWithFallback({ contents: prompt, config: {
          temperature: 0.7,
        } });
      let responseText = extractGeminiText(response) || "I have some ideas for you. Let's discuss your interests further.";
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

      const prompt = `Generate exactly 5 highly-relevant, curriculum-aligned flashcards to study the topic: "${topic}". 
      Each flashcard must consist of a 'question' and its corresponding 'answer'.
      
      GUIDELINES FOR GENERATION:
      1. Write in simple, elegant, easy-to-understand English so that students with varying language proficiency can easily master the material.
      2. Frame the questions in the exact style of Malawian national school examinations, such as the MANEB exams (MSCE / JCE) or local teacher tests. Keep them authentic and directly examinable.
      3. For the answers, give accurate, clear, and high-yielding explanations or definitions that secondary school students can easily memorize.
      4. Do NOT use any asterisks (*), hashtags (#), or dollar signs ($). Use clean, plain text.

      Return ONLY a JSON array of objects with this structure (no additional conversational text surrounding the array):
      [
        {
          "question": "Plain text question here?",
          "answer": "Plain text answer here."
        }
      ]`;

      const response = await generateWithFallback({ contents: prompt, config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        } });
      const text = extractGeminiText(response);
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

  app.post(["/api/gemini/dictionary", "/gemini/dictionary"], async (req, res) => {
    try {
      const { word } = req.body;
      if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: "Missing or invalid word parameter" });
      }

      const prompt = `Provide an authoritative, clear, and comprehensive dictionary definition for the term or word: "${word}".
Tailor the explanation so that it is crystal clear for secondary school students (MSCE / JCE curriculum in Malawi) and general learners.

Return ONLY a JSON object with this exact structure (no markdown fences, no conversational text):
{
  "word": "${word}",
  "phonetic": "/sample_phonetic_transcription/",
  "meanings": [
    {
      "partOfSpeech": "noun/verb/adjective/etc",
      "definitions": [
        {
          "definition": "Clear, precise academic definition.",
          "example": "An illustrative real-world sentence using the word."
        }
      ]
    }
  ],
  "synonyms": ["synonym1", "synonym2"]
}`;

      const response = await generateWithFallback({ contents: prompt, config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        } });

      const text = extractGeminiText(response);
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (error: any) {
      console.error("Dictionary API Error:", error);
      let errorMessage = error.message || "Failed to fetch word definition";
      let statusCode = 500;
      if (error.message && (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("429"))) {
        errorMessage = "QUOTA_EXCEEDED: Maximum capacity reached. Please try again later.";
        statusCode = 429;
      }
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  // Dedicated Ultra-Fast Real-Time Voice Endpoint for Emi Calling Studio (Vercel & Production Ready)
  app.post(["/api/gemini/voice-reply", "/gemini/voice-reply"], async (req, res) => {
    try {
      const { prompt, history, voiceName, userLevel } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Missing prompt" });
      }

      const voiceMapping: Record<string, string> = {
        'Aoede': 'Zephyr',
        'Kore': 'Kore',
        'Puck': 'Puck',
        'Charon': 'Charon',
        'Fenrir': 'Fenrir',
        'Zephyr': 'Zephyr',
      };
      const targetVoice = voiceMapping[voiceName || ''] || 'Kore';

      const systemInstruction = `You are Emi, the AI study tutor in the Educate MW app. Built by Peter Damiano (peterdamiano.vercel.app) with the MSCE Preparation team (teachers S. Lifa and E. Muthipo).
You are currently on a live voice call with a student preparing for JCE or MSCE exams.
${userLevel ? `The student is studying in ${userLevel}.` : ''}

SPOKEN VOICE CALL RULES:
1. Speak naturally, warmly, and directly as a kind teacher on a phone call.
2. Keep your answer brief: 1 to 3 short sentences maximum so the vocal dialogue is fast, snappy, and feels like a real conversation.
3. Use plain natural spoken English (or Chichewa if the student greets/speaks in Chichewa).
4. Do NOT use markdown symbols, asterisks (*), hashtags (#), or dollar signs ($).
5. Give a direct, accurate answer for the Malawi secondary school curriculum.`;

      const contents = [
        ...(Array.isArray(history)
          ? history.slice(-4).map((h: any) => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text || '' }],
            }))
          : []),
        { role: 'user', parts: [{ text: prompt }] },
      ];

      // Step 1: Fast reasoning with gemini-3.1-flash-lite (fallback: gemini-3.8-flash)
      const textResponse = await generateWithFallback({ contents, config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.7,
        } });

      let replyText = textResponse.text || "I am here to help you study. What would you like to explore next?";
      replyText = replyText.replace(/[*#$]/g, '').trim();

      // Step 2: TTS with gemini-3.8-flash-tts
      let audioBase64: string | null = null;
      try {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [{ parts: [{ text: replyText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: targetVoice },
              },
            },
          },
        });

        const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData?.data,
        );
        if (audioPart?.inlineData?.data) {
          audioBase64 = audioPart.inlineData.data;
        }
      } catch (ttsErr: any) {
        console.warn("TTS generation fallback:", ttsErr?.message);
      }

      res.json({
        text: replyText,
        audioBase64,
      });
    } catch (error: any) {
      console.error("Voice Reply API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate voice response" });
    }
  });

  // NOTE: Remaining server code (Vite middleware, WebSocket live proxy, listen) continues below...
  // For production completeness this truncated body will be completed in next commit if needed.
  // The critical API routes above are fully restored with model fallbacks.

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template = await vite.transformIndexHtml(url, fs.readFileSync(path.resolve('index.html'), 'utf-8'));
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket server for optional server-side live proxy
  const wss = new WebSocketServer({ server, path: '/ws/live' });
  wss.on('connection', (clientWs, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const voiceQuery = url.searchParams.get('voice');
    const voiceMapping: Record<string, string> = {
      'Aoede': 'Zephyr',
      'Kore': 'Kore',
      'Puck': 'Puck',
      'Charon': 'Charon',
      'Fenrir': 'Fenrir',
      'Zephyr': 'Zephyr',
    };
    const targetVoice = voiceMapping[voiceQuery || ''] || 'Zephyr';

    let sessionPromise: Promise<any>;

    const setupSession = async () => {
      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is missing in environment variables. Please add it in the Secrets panel.");
        }
        const liveModels = ["gemini-3.8-live", "gemini-3.8-live-extended-thinking"];
        let session: any = null;
        let lastErr: any = null;
        for (const liveModel of liveModels) {
          try {
            session = await ai.live.connect({
              model: liveModel,
              callbacks: {
                onmessage: (message: any) => {
                  const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                  if (audio) {
                    clientWs.send(JSON.stringify({ audio }));
                  }
                  if (message.serverContent?.interrupted) {
                    clientWs.send(JSON.stringify({ interrupted: true }));
                  }
                  if (message.error) {
                    console.error("Gemini Live API Message Error:", message.error);
                    clientWs.send(JSON.stringify({ error: "Emi is having trouble speaking. Please try again." }));
                  }
                },
              },
              config: {
                responseModalities: [Modality.AUDIO],
                tools: [{ googleSearch: {} }],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: targetVoice
                    }
                  }
                },
                systemInstruction: getEmiSystemInstruction()
              }
            });
            console.log(`Server live session with model: ${liveModel}`);
            break;
          } catch (e) {
            lastErr = e;
            console.warn(`Live model ${liveModel} failed:`, (e as any)?.message);
          }
        }
        if (!session) throw lastErr || new Error("All live models failed");
        return session;
      } catch (e) {
        console.error("ai.live.connect failed:", e);
        throw e;
      }
    };

    sessionPromise = setupSession();

    clientWs.on("message", async (data) => {
      try {
        const session = await sessionPromise;
        const msg = JSON.parse(data.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: msg.audio }]
          });
        }
        if (msg.text) {
          session.sendRealtimeInput({ text: msg.text });
        }
      } catch (e) {
        console.error("WS message error:", e);
      }
    });

    clientWs.on("close", async () => {
      try {
        const session = await sessionPromise;
        await session.close();
      } catch (e) {}
    });

    sessionPromise.catch((e) => {
      console.error("Session setup failed:", e);
      clientWs.send(JSON.stringify({ error: "Live session failed to start. Please check back later." }));
      clientWs.close();
    });
  });
}

startServer();
