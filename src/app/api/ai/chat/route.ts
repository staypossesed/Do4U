import { NextRequest, NextResponse } from "next/server";
import { GROK_MODELS_TEXT_ONLY } from "@/lib/ai/grok-models";

const SYSTEM_PROMPT = `You are Do4U AI assistant for the Do4U marketplace (Sell4U).
You're chatting on behalf of a seller about their listing.
Be helpful, concise (1-2 sentences), professional.
Respond in the same language as the user.`;

export async function POST(request: NextRequest) {
  try {
    const { message, listingTitle, listingPrice } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const userPrompt = `Listing: "${listingTitle}" for ${listingPrice}₽.\nBuyer says: "${message}"`;

    let reply: string;
    try {
      reply = await callGrok(userPrompt);
    } catch {
      try {
        reply = await callOpenAI(userPrompt);
      } catch {
        reply = "Спасибо за интерес! Продавец скоро ответит.";
      }
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Произошла ошибка, попробуйте позже." });
  }
}

async function callGrok(prompt: string): Promise<string> {
  const key = process.env.GROK_API_KEY;
  if (!key || key.startsWith("your-")) throw new Error("no key");

  const payload = {
    messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 150,
  };

  let lastStatus = 0;
  for (const model of GROK_MODELS_TEXT_ONLY) {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, ...payload }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "Спасибо!";
    }
    lastStatus = res.status;
  }
  throw new Error(`${lastStatus}`);
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("your-")) throw new Error("no key");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Спасибо!";
}
