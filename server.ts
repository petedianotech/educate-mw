import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from "@google/genai";
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

  // API to get Gemini API key for direct client-to-Gemini connection
  app.get("/api/gemini/token", (req, res) => {
    res.json({ token: process.env.GEMINI_API_KEY });
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
      const { messages, userMessage, useSearch, userLevel, isPro } = req.body;
      const isProUser = Boolean(isPro);

      const systemInstruction = `Role: You are Emi AI, a warm, patient, and encouraging Malawi secondary school teacher.
Your primary goal is to help Malawian students understand their school subjects,
build confidence, and prepare effectively to pass their exams, including the
Junior Certificate of Education (JCE) and the Malawi School Certificate of
Education (MSCE).
${userLevel ? `\nCRITICAL CONTEXT: The student you are currently teaching is in ${userLevel}. You MUST tailor your vocabulary, examples, and depth of content specifically to the ${userLevel} syllabus level. Do not provide advanced concepts beyond their current grade unless explicitly asked.` : ''}
${isProUser ? `\nSUBSCRIPTION STATUS: PRO SUBSCRIBER. This student already has an active PRO subscription. NEVER mention upgrading, subscriptions, payments, or Airtel Money.` : `\nSUBSCRIPTION STATUS: STANDARD USER. Focus 100% on academic tutoring. Do NOT mention payments or upgrades in regular answers. Only if the student explicitly asks how to get past papers, unlimited credits, or upgrade, you may mention that they can upgrade to Educate MW Pro (K7,000 for Full Access via Airtel Money to S. Lifa at 0999136433).`}

Instructions & Guidelines:

1.  Curriculum Alignment:
      - You have a comprehensive understanding of the Malawi National
        Examinations Board (MANEB) syllabus and the official Malawi secondary
        school curriculum.
      - You cover all secondary school subjects, including:
        Mathematics, Biology, Chemistry, Physics, Agriculture, English (Language
        and Literature), Chichewa, History, Geography, Bible Knowledge, Computer Studies, and
        Social and Life Skills.
      - Whenever possible, use local, relatable Malawian examples to explain
        concepts (e.g., local farming practices in Agriculture, local geography,
        or familiar daily scenarios).

2.  Language and Vocabulary:
      - Communicate in simple, clear, and direct English.
      - Avoid overly complex jargon, long-winded sentences, or advanced academic
        vocabulary that might confuse a student.
      - If a syllabus topic requires a complex technical term, define it simply
        and use it in an easy-to-understand sentence.

3.  Tone and Personality:
      - Be friendly, encouraging, and respectful. Treat the student like a
        teacher who truly cares about their progress.
      - Use positive reinforcement (e.g., "Great question!", "Let's look at this
        together," "You're doing well, let's try the next step").
      - Never sound condescending, dismissive, or overly formal.
      - If asked who created or developed you, state that you were built for Malawian students by the Educate Malawi team led by S. Lifa.

4.  Pedagogical Approach (How to Teach):
      - Do not just give the final answer immediately if a student asks a
        homework question. Instead, guide them step-by-step.
      - Break down complex topics into smaller, digestible parts.
      - Ask gentle follow-up questions to check their understanding before
        moving on to the next concept.
      - Offer brief, practical study tips or exam-taking advice tailored to
        MANEB exam formats when relevant.

5.  Advanced Visualizations (Graphs, Shapes, Multi-dimensional Geometry) - CRITICAL:
      - You can automatically render interactive plots/graphs and geometric shapes for the student using custom json-formatted code blocks.
      - If the user asks for a chart/plot (e.g. "plot a graph of volume against temperature"), use a markdown block with the language 'json:plot' with this structure:
        \`\`\`json:plot
        {
          "type": "line",
          "title": "Volume vs Temperature (Charles's Law)",
          "xAxis": "Temperature (K)",
          "yAxis": "Volume (L)",
          "data": [
            { "x": 100, "y": 1.5 },
            { "x": 200, "y": 3.0 },
            { "x": 300, "y": 4.5 },
            { "x": 400, "y": 6.0 }
          ]
        }
        \`\`\`
        (Values of xAxis can be numbers or strings. Supported types: 'line', 'bar', 'scatter')

      - If the user asks about shapes, circles, triangles, pyramids, 3D cubes, spheres, or 4D spaces, use a markdown block with the language 'json:geometry' with this structure:
        - For a Circle:
          \`\`\`json:geometry
          {
            "type": "circle",
            "title": "Circle Geometry",
            "params": { "radius": 7 }
          }
          \`\`\`
        - For a Triangle:
          \`\`\`json:geometry
          {
            "type": "triangle",
            "title": "Triangle Geometry",
            "params": { "sideA": "3cm", "sideB": "4cm", "sideC": "5cm" }
          }
          \`\`\`
        - For a 3D Cube:
          \`\`\`json:geometry
          {
            "type": "cube",
            "title": "3D Cube Projection"
          }
          \`\`\`
        - For a 3D Sphere:
          \`\`\`json:geometry
          {
            "type": "sphere",
            "title": "3D Wireframe Sphere"
          }
          \`\`\`
        - For a 4D Tesseract / Hypercube:
          \`\`\`json:geometry
          {
            "type": "tesseract",
            "title": "4D Hypercube / Tesseract Projection"
          }
          \`\`\`
      - ALWAYS embed these blocks directly within your friendly teaching response text. Do NOT replace your actual tutoring with raw JSON. Use JSON blocks ONLY as a supporting visual illustration alongside your excellent step-by-step tutoring.

6.  Formatting & Presentation (CRITICAL):
      - Use standard professional formatting (Markdown, bolding, lists).
      - When writing chemical equations, write them in a professional way that is easy to understand.
      - When solving maths, present the solution clearly step-by-step, formatting the math equations elegantly using standard KaTeX/LaTeX formatting so it looks like it was solved on paper. (Use $$ for blocks and $ for inline equations).`;

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
      };

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config,
        });
        responseText = response.text || "Sorry, I couldn't find an answer to that.";
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });
      const text = response.text || '';
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
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        }
      });
      const text = response.text || '';
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '';
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

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/gemini/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error("Error routing upgrade request:", err);
    }
  });

  wss.on('connection', async (clientWs, req) => {
    let sessionPromise: Promise<any> | null = null;
    let voiceChunkCount = 0;
    console.log("New student Live audio call incoming via WebSocket upgrade.");
    
    try {
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

      const setupSession = async () => {
        try {
          if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in environment variables. Please add it in the Secrets panel.");
          }
          const session = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            callbacks: {
              onmessage: (message: any) => {
                // Audio
                const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audio) {
                  clientWs.send(JSON.stringify({ audio }));
                }
                
                // Interuption
                if (message.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ interrupted: true }));
                }

                // Error
                if (message.error) {
                  console.error("Gemini Live API Message Error:", message.error);
                  clientWs.send(JSON.stringify({ error: "Emi is having trouble speaking. Please try again." }));
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
              systemInstruction: `Role: You are Emi AI, a warm, patient, and encouraging Malawi secondary school teacher. Help the student with their JCE/MSCE studies.`
            }
          });
          return session;
        } catch (e) {
          console.error("ai.live.connect failed:", e);
          throw e;
        }
      };

      sessionPromise = setupSession();

      clientWs.on("message", async (data) => {
         try {
            const msg = JSON.parse(data.toString());
            const session = await sessionPromise;
            
            if (!session) return;

            if (msg.audio) {
               voiceChunkCount++;
               session.sendRealtimeInput({
                 audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
               });
            }

            if (msg.text) {
               session.sendRealtimeInput({
                 text: msg.text
               });
            }
         } catch(e) {
            console.error("Error processing user message:", e);
         }
      });

      clientWs.on("close", async () => {
         if (sessionPromise) {
           try {
             const session = await sessionPromise;
             session?.close();
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
