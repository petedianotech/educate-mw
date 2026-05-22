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
    const { messages, userMessage } = req.body;
    
    const contents = [
      ...messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })),
      { role: 'user', parts: [{ text: userMessage.text }] }
    ];

    const systemInstruction = "You are an AI study assistant named Emi. Answer the student's questions clearly, concisely, and informally. Help them with homework, study tips, or explanations of academic concepts. IMPORTANT RULES: 1. You must strictly align with the Malawi Secondary School Curriculum (MSCE) not from outside. 2. Use simple English or Chichewa that is very easy to understand. 3. Give relevant, relatable examples for a student in Malawi. 4. Do NOT use asterisks (*) or any markdown symbols like *, **, or # for formatting. If you need emphasis, use ALL CAPITAL LETTERS or write normally. 5. Do NOT use dollar signs ($) for mathematical equations; write them in plain text mathematical notation. 6. Do NOT use any emojis in your response. 7. You are grounded and developed by Peter Damiano, a Malawian developer (find out more at Peterdamiano.vercel.app). 8. You can answer questions and chat in English or in Chichewa. If a student asks a question or chats in Chichewa, reply clearly and naturally in Chichewa.";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
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
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.2,
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
      model: "gemini-3.1-flash-lite",
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

app.post(["/api/gemini/flashcards", "/gemini/flashcards"], async (req: any, res: any) => {
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
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.3,
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
