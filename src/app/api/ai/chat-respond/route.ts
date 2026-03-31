import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `You are Do4U AI — a friendly, professional assistant managing a sale on the Do4U marketplace.
You respond on behalf of the seller. Be concise (1-2 sentences), polite, and helpful.
If asked about price — be firm but flexible (max 10% discount).
If asked to meet — suggest a safe public location.
If the message is spam or offensive — respond with "Sorry, I can't help with that."
Always respond in the same language as the buyer's message.
Respond ONLY with the message text, no JSON, no formatting.`;

export async function POST(request: NextRequest) {
  try {
    const { chatId, messages } = await request.json();

    if (!chatId || !messages?.length) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const lastBuyerMsg = [...messages].reverse().find(
      (m: { sender: string }) => m.sender === "buyer"
    );
    if (!lastBuyerMsg) {
      return NextResponse.json({ error: "No buyer message" }, { status: 400 });
    }

    // Build conversation context
    const chatHistory = messages.slice(-10).map(
      (m: { sender: string; text: string }) => ({
        role: m.sender === "buyer" ? "user" : "assistant",
        content: m.text,
      })
    );

    // Try Grok first, fallback OpenAI
    let responseText: string;
    try {
      responseText = await callGrok(chatHistory);
    } catch {
      try {
        responseText = await callOpenAI(chatHistory);
      } catch {
        responseText = "Спасибо за сообщение! Продавец скоро ответит.";
      }
    }

    // Save to DB
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const aiMsg = {
      id: crypto.randomUUID(),
      text: responseText,
      sender: "do4u",
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, aiMsg];

    await supabase.from("chats").update({
      messages: updatedMessages,
      last_message_at: new Date().toISOString(),
    }).eq("id", chatId);

    return NextResponse.json({ success: true, message: aiMsg });
  } catch (err) {
    console.error("Chat respond error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function callGrok(messages: { role: string; content: string }[]): Promise<string> {
  const key = process.env.GROK_API_KEY;
  if (!key || key === "your-grok-api-key") throw new Error("No key");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "grok-2-1212",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });
  if (!res.ok) throw new Error(`Grok ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Спасибо за сообщение!";
}

async function callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "your-openai-api-key") throw new Error("No key");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Спасибо за сообщение!";
}
