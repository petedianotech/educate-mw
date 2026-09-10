import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "test" });
  const session = await ai.live.connect({ model: "gemini-3.1-flash-live-preview", callbacks: {} });
  session.send({ text: "Hello" });
  session.send("Hello");
  session.sendRealtimeInput([{ mimeType: "audio/pcm", data: "b64" }]);
}
test();
