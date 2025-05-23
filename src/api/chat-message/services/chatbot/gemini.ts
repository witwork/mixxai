import { GoogleGenerativeAI } from "@google/generative-ai";

export async function sendMessageToGemini(
  messages: any[],
  current: string,
  ai_model: { model_name: string; api_key: string }
): Promise<string> {
  const { model_name, api_key } = ai_model;

  if (!api_key) {
    throw new Error("API Key của Google Gemini là bắt buộc.");
  }
  const genAI = new GoogleGenerativeAI(api_key);
  const model = genAI.getGenerativeModel({ model: model_name });
  const chats = messages = messages.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.message }],
  }))
  console.log("Gemini messages:", chats);

  try {
    const chat = model.startChat({
      history: chats
    });

    let result = await chat.sendMessage(current);
    console.log("Gemini response:", result.response);
    return result.response.text();
  } catch (error: any) {
    console.error("Lỗi khi gửi tin nhắn đến Gemini:", error);
    throw error;
  }
}