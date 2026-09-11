import express from 'express';
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

// API to get PayChangu config dynamically
app.get(["/api/payment/config", "/payment/config"], (req: any, res: any) => {
  res.json({
    publicKey: process.env.VITE_PAYCHANGU_PUBLIC_KEY || ""
  });
});

// API to get Gemini API key for direct client-to-Gemini connection
app.get(["/api/gemini/token", "/gemini/token"], (req: any, res: any) => {
  res.json({ token: process.env.GEMINI_API_KEY });
});

// API to verify PayChangu payment synchronously
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
    const data: any = await response.json();
    
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
  const event = req.body;
  console.log("PayChangu Webhook Event:", event);
  res.sendStatus(200);
});

app.post(["/api/gemini/chat", "/gemini/chat"], async (req: any, res: any) => {
  try {
    const { messages, userMessage, useSearch, isPro, userLevel } = req.body;
    
    const contents = [
      ...messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })),
      { role: 'user', parts: [{ text: userMessage.text }] }
    ];

    const isProUser = Boolean(isPro);

    const systemInstruction = `You are Emi, an elite AI study assistant specialized in the Junior Certificate of Education (JCE) and Malawi School Certificate of Education (MSCE) syllabus under MANEB (Malawi National Examinations Board). Your answers must be highly professional, structured, academic, and directly suitable for copying or writing on official national examinations in Malawi for any subject (including Agriculture, Biology, English, Chichewa literature such as Samuel Josiah Nthara's 'Nthondo' and J.M. Ntaba's 'Chamdothe', Physics, History, Geography, and Social Studies).

CONTEXT: You are the built-in AI tutor of Educate Malawi (Educate MW - where MW stands for Malawi), Malawi's premier digital learning platform for secondary school students. Educate Malawi provides a comprehensive Library of study notes, Video Lessons, a Dictionary, Interactive Quizzes, and a University Points Calculator. You fully understand these app features and encourage students to use them.

${userLevel ? `\nCRITICAL CONTEXT: The student is in ${userLevel}. Tailor your depth and vocabulary specifically to this class level.` : ''}
${isProUser ? `\nSUBSCRIPTION STATUS: PRO SUBSCRIBER. This student already has an active PRO account. NEVER mention upgrading, payments, pricing, or Airtel Money.` : `\nSUBSCRIPTION STATUS: STANDARD USER. Focus 100% on academic tutoring. Do NOT spam or append payment recommendations to regular answers. Only if the student explicitly asks about past papers, premium features, or subscription packages, you may let them know they can upgrade to Educate MW Pro (K7,000 via Airtel Money to S. Lifa at 0999136433).`}

IMPORTANT RULES:
1. Provide exam-ready answers. Write clear definitions, structural lists, correct formatting diagrams, and logical step-by-step explanations that would score full marks on a JCE or MSCE exam.
2. Always incorporate Google Search grounding when needed to fetch precise 2025/2026 Malawi syllabus units, specific book chapters, exact literary summaries, or MANEB guidelines.
3. Formatting rule for business letters/reports: write full examples using the standard Malawian address format (e.g., Sender's Address on top right, Receiver's Address on the left, Date, Salutation, Subject Line capitalized and aligned, concise body, and closing).
4. Under academic explanations, you may provide a separate, simple English section titled 'HOW NOT TO FORGET THIS:' or 'STUDY TIP FOR EXAMS:'. Give a simple, relatable analogy or mnemonic that helps Malawian students memorize key points.
5. Keep explanations easy to understand but academically precise. Use simple English or Chichewa. If a student chats in Chichewa, reply naturally in Chichewa, but keep the core concept academically educational.
6. Do NOT use asterisks (*) or markdown formatting (like *, **, #) in the response at all. Use ALL CAPS or plain spacing to structure your answers. Do NOT use dollar signs ($) for equations; write them in standard plain text notation.
7. Do NOT use any emojis.
8. If asked who built or created you, state that you were built for Malawian secondary students by the Educate Malawi team led by S. Lifa.`;

    const searchEnabled = true;

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

app.post(["/api/gemini/quiz", "/gemini/quiz"], async (req: any, res: any) => {
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

app.post(["/api/gemini/career", "/gemini/career"], async (req: any, res: any) => {
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

app.post(["/api/gemini/flashcards", "/gemini/flashcards"], async (req: any, res: any) => {
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

export default app;
