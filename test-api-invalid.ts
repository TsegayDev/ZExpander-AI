import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "invalid_key_12345" });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log("Success:", response.text);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
