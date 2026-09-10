import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "test" });
  const session = await ai.live.connect({ model: "gemini-3.1-flash-live-preview", callbacks: {} });
  session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello" }] }] });
  session.sendRealtimeInput([{ mimeType: "audio/pcm;rate=16000", data: "b64" }]);
}
test();
