import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "test" });
  const session = await ai.live.connect({ model: "gemini-3.1-flash-live-preview" });
  session.send({ text: "Hello" });
}
test();
