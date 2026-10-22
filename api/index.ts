import express from 'express';
import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";

const app = express();
app.use(express.json());

// CORS for web + Capacitor APK (https://localhost / capacitor://localhost)
app.use((req: any, res: any, next: any) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

/** Text models: prefer 3.1 Flash Lite (fast/cheap); fallback to 3.8 Flash (default quality). */
const TEXT_MODELS = ["gemini-3.1-flash-lite", "gemini-3.8-flash"] as const;

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

app.get(["/api/payment/config", "/payment/config"], (req: any, res: any) => {
  res.json({
    publicKey: process.env.VITE_PAYCHANGU_PUBLIC_KEY || ""
  });
});

app.get(["/api/gemini/token", "/gemini/token"], async (req: any, res: any) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server missing GEMINI_API_KEY environment variable" });
    }
    const requestedModel = (req.query?.model as string) || "gemini-3.8-live";
    const allowedModels = [
      "gemini-3.8-live",
      "gemini-3.8-live-extended-thinking",
      "gemini-3.1-flash-live-preview",
      "gemini-2.5-flash-native-audio-preview-12-2025",
    ];
    const model = allowedModels.includes(requestedModel) ? requestedModel : "gemini-3.8-live";

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    let tokenObj: any;
    try {
      tokenObj = await ai.authTokens.create({
        config: {
          uses: 1,
          expireTime,
          newSessionExpireTime,
          liveConnectConstraints: {
            model,
            config: {
              sessionResumption: {},
              responseModalities: [Modality.AUDIO],
            },
          },
        },
      });
    } catch (constrainedErr: any) {
      console.warn("Constrained token failed, trying unconstrained:", constrainedErr?.message);
      tokenObj = await ai.authTokens.create({
        config: {
          uses: 1,
          expireTime,
          newSessionExpireTime,
        },
      });
    }

    if (!tokenObj?.name) {
      return res.status(500).json({ error: "Token creation returned empty name" });
    }
    res.json({ token: tokenObj.name, model });
  } catch (error: any) {
    console.error("Gemini Token Creation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate Gemini token" });
  }
});

app.post(["/api/payment/verify", "/payment/verify"], async (req: any, res: any) => {
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

app.post(["/api/payment/webhook", "/payment/webhook"], async (req: any, res: any) => {
  console.log("PayChangu Webhook Event:", req.body);
  res.sendStatus(200);
});

app.post(["/api/gemini/chat", "/gemini/chat"], async (req: any, res: any) => {
  try {
    const { messages, userMessage, useSearch, userLevel, isPro, hasAttachment, attachmentType, attachmentName, tone, attachments } = req.body;
    const isProUser = Boolean(isPro);

    let systemInstruction = `Role: You are Emi AI, a warm, patient, and encouraging Malawi secondary school teacher.
Your primary goal is to help Malawian students understand their school subjects, build confidence, and prepare effectively to pass their exams, including the Junior Certificate of Education (JCE) and the Malawi School Certificate of Education (MSCE).
${userLevel ? `\nCRITICAL CONTEXT: The student you are currently teaching is in ${userLevel}. You MUST tailor your vocabulary, examples, and depth of content specifically to the ${userLevel} syllabus level.` : ''}
${isProUser ? `\nSUBSCRIPTION STATUS: PRO SUBSCRIBER. NEVER mention upgrading or payments.` : `\nSUBSCRIPTION STATUS: STANDARD USER. Focus on academic tutoring.`}
${hasAttachment || (attachments && attachments.length > 0) ? `\nATTACHMENT: Student attached educational material (image, handwritten homework, or document). Carefully examine all details, transcribe the problem accurately, and solve step-by-step with real notebook clarity.` : ''}

Instructions:
1. Curriculum: MANEB / Malawi secondary syllabus. Local examples when helpful.
2. Language: Simple clear English.
3. Tone: Friendly, encouraging teacher.
4. Pedagogy: Step-by-step guidance, not only final answers.
5. Math formatting: ALWAYS use $...$ for inline and $$...$$ for display equations/matrices (KaTeX). Never leave raw LaTeX outside delimiters.
6. When solving systems/matrices use $$\\begin{pmatrix}...\\end{pmatrix}$$.`;

    if (tone === "maneb-prep") {
      systemInstruction += `\n7. Tone: MANEB Exam Prep mode. Emphasize marking schemes, exam tips, and scoring full marks.`;
    } else if (tone === "concise") {
      systemInstruction += `\n7. Tone: Quick & Concise mode. Direct summaries, essential formulas, and fast revision.`;
    } else if (tone === "socratic") {
      systemInstruction += `\n7. Tone: Socratic Coach mode. Ask questions to help the student derive the answer.`;
    } else {
      systemInstruction += `\n7. Tone: Step-by-Step Teacher mode. Clear numbered steps with notebook-style explanation.`;
    }

    const userParts: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att && att.data && att.mimeType) {
          userParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data,
            },
          });
        }
      }
    }
    const promptText = (userMessage?.text || "").trim();
    if (promptText) {
      userParts.push({ text: promptText });
    } else if (userParts.length > 0) {
      userParts.push({
        text: "Please analyze this homework/exam question and solve it step-by-step for a Malawian student with clear mathematical formulas.",
      });
    }

    const contents = [
      ...(messages || []).map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text || '' }]
      })),
      {
        role: 'user',
        parts: userParts.length > 0 ? userParts : [{ text: 'Hello Emi!' }]
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
      const response = await generateWithFallback({ contents, config });
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

app.post(["/api/gemini/quiz", "/gemini/quiz"], async (req: any, res: any) => {
  try {
    const { topic, numQuestions } = req.body;
    const prompt = `Generate a high-quality educational quiz for MSCE students in Malawi on the topic: ${topic}.
    Generate exactly ${numQuestions} multiple-choice questions.
    Each question must have 4 options and one correct answer.
    Provide a "summary" field explaining why the correct answer is right.
    IMPORTANT: Do NOT use asterisks (*) or dollar signs ($), use simple plain text.
    Return ONLY a JSON array of objects with this structure:
    [ { "q": "Question?", "options": ["A", "B", "C", "D"], "answer": "Correct", "summary": "Why" } ]`;
    const response = await generateWithFallback({ contents: prompt, config: { temperature: 0.2, responseMimeType: 'application/json' } });
    const text = response.text || '';
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    res.json({ text: jsonStr });
  } catch (error: any) {
    console.error("Quiz API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

app.post(["/api/gemini/career", "/gemini/career"], async (req: any, res: any) => {
  try {
    const { prompt } = req.body;
    const response = await generateWithFallback({ contents: prompt, config: { temperature: 0.7 } });
    let responseText = response.text || "I have some ideas for you.";
    responseText = responseText.replace(/\*/g, '').replace(/\$/g, '');
    res.json({ text: responseText });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate career advice" });
  }
});

app.post(["/api/gemini/flashcards", "/gemini/flashcards"], async (req: any, res: any) => {
  try {
    const { topic } = req.body;
    const prompt = `Generate exactly 5 flashcards for MSCE topic: "${topic}". Return ONLY JSON array [{ "question": "...", "answer": "..." }]. No asterisks or dollar signs.`;
    const response = await generateWithFallback({ contents: prompt, config: { temperature: 0.3, responseMimeType: 'application/json' } });
    const text = response.text || '';
    res.json({ text: text.replace(/```json\n?|\n?```/g, '').trim() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate flashcards" });
  }
});

app.post(["/api/gemini/dictionary", "/gemini/dictionary"], async (req: any, res: any) => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: "Missing or invalid word parameter" });
    }
    const prompt = `Dictionary definition for "${word}" for MSCE students. Return ONLY JSON: { "word": "${word}", "phonetic": "/.../", "meanings": [{ "partOfSpeech": "noun", "definitions": [{ "definition": "...", "example": "..." }] }], "synonyms": [] }`;
    const response = await generateWithFallback({ contents: prompt, config: { temperature: 0.2, responseMimeType: 'application/json' } });
    const text = response.text || '';
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch word definition" });
  }
});

app.post(["/api/gemini/voice-reply", "/gemini/voice-reply"], async (req: any, res: any) => {
  try {
    const { text, voice } = req.body;
    const targetVoice = voice || "Kore";
    let replyText = text || "I am here to help you study.";
    replyText = String(replyText).replace(/[*#$]/g, '').trim();
    let audioBase64: string | null = null;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [{ parts: [{ text: replyText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: targetVoice } } },
        },
      });
      const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (audioPart?.inlineData?.data) audioBase64 = audioPart.inlineData.data;
    } catch (ttsErr: any) {
      console.warn("TTS generation fallback:", ttsErr?.message);
    }
    res.json({ text: replyText, audioBase64 });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate voice response" });
  }
});

export default app;
