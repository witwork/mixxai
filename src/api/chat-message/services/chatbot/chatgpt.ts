import OpenAI from 'openai';

export async function sendMessageToChatGPT(
  messages: any[],
  current: string,
  ai_model: { model_name: string; api_key: string }
): Promise<string> {

  try {
    const { model_name, api_key } = ai_model;
    const client = new OpenAI({
      apiKey: api_key, // This is the default and can be omitted
    });

    // Map the existing messages and then append the current message
    const chats = [
      ...messages.map((msg) => ({
        role: msg.sender === "user" ? "user" as const : "assistant" as const,
        content: msg.message,
      })),
      { role: "user" as const, content: current }
    ];

    const completion = await client.chat.completions.create({
      model: model_name,
      messages: chats
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    throw new Error("Failed to fetch response from ChatGPT");
  }
}