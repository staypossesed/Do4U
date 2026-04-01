/**
 * Do4U seller draft generation. SUPABASE_SERVICE_ROLE_KEY is used only in this
 * server route (never exposed to the client) to read seller style_examples and
 * to update pending_ai_suggestion when the anon session cannot.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { GROK_MODELS_TEXT_ONLY } from "@/lib/ai/grok-models";

const BASE_SYSTEM = `You are Do4U — drafting a reply FOR THE SELLER to send to the buyer.
Write 1–3 short sentences the seller could send as themselves (first person), not as a bot.
Be polite and helpful. Match the buyer's language. No JSON, no quotes around the whole message.
If the buyer asks about price, you may offer up to about 10% flexibility unless examples say otherwise.`;

/** When seller has no style_examples, steer model to a neutral polite tone */
const NEUTRAL_STYLE_NO_EXAMPLES = `
The seller has not saved example phrases. Use a neutral, polite, professional tone: short clear sentences, no slang,
friendly but not overly casual. Stay helpful and concise.`;

function draftFallbackForBuyer(lastBuyerText: string | undefined): string {
  const t = lastBuyerText ?? "";
  const cyrillic = /[\u0400-\u04FF]/.test(t);
  return cyrillic
    ? "Do4U пока не смог подготовить ответ. Напишите, пожалуйста, ответ самостоятельно."
    : "Do4U couldn’t draft a reply just yet. Please write your own message.";
}

export async function POST(request: NextRequest) {
  try {
    const { chatId, messages } = await request.json();
    if (!chatId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const last = messages[messages.length - 1] as { sender?: string; text?: string };
    if (last?.sender !== "buyer") {
      return NextResponse.json({ error: "Last message must be from buyer" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(`chat-suggest:${user.id}`, 20, 60_000);
    if (!rl.ok) {
      const sec = rl.retryAfterMs ? Math.max(1, Math.ceil(rl.retryAfterMs / 1000)) : 60;
      return NextResponse.json(
        {
          error: "Too many requests. Try again in a moment.",
          error_ru: "Слишком много запросов. Подождите немного и попробуйте снова.",
        },
        { status: 429, headers: { "Retry-After": String(sec) } },
      );
    }

    const { data: chatRow, error: chatErr } = await supabase
      .from("chats")
      .select("id, buyer_id, seller_id, is_claw_managed")
      .eq("id", chatId)
      .single();

    if (chatErr || !chatRow) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    if (chatRow.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!chatRow.is_claw_managed) {
      return NextResponse.json({ ok: true, skipped: true, text: null });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let styleHint = "";
    let hadExamples = false;
    if (serviceKey) {
      const admin = createServiceClient(url, serviceKey);
      const { data: seller } = await admin
        .from("users")
        .select("style_examples")
        .eq("id", chatRow.seller_id)
        .maybeSingle();
      const examples = (seller?.style_examples as string[] | null)?.filter(Boolean) ?? [];
      if (examples.length > 0) {
        hadExamples = true;
        styleHint = `\nSeller's example phrases (mirror tone, not copy verbatim):\n${examples.slice(0, 5).join("\n")}`;
      }
    }
    const systemTail = hadExamples && styleHint ? styleHint : NEUTRAL_STYLE_NO_EXAMPLES;

    const chatHistory = messages.slice(-12).map(
      (m: { sender: string; text: string }) => ({
        role: m.sender === "buyer" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }),
    );

    const lastBuyerText = typeof last?.text === "string" ? last.text : "";

    let responseText: string;
    try {
      responseText = await callGrok(chatHistory, systemTail);
    } catch {
      try {
        responseText = await callOpenAI(chatHistory, systemTail);
      } catch {
        responseText = draftFallbackForBuyer(lastBuyerText);
      }
    }

    const trimmed = responseText.trim();
    if (!trimmed) {
      responseText = draftFallbackForBuyer(lastBuyerText);
    } else {
      responseText = trimmed;
    }

    const suggestion = {
      text: responseText.trim(),
      created_at: new Date().toISOString(),
    };

    const writer = serviceKey
      ? createServiceClient(url, serviceKey)
      : supabase;

    const { error: upErr } = await writer
      .from("chats")
      .update({ pending_ai_suggestion: suggestion })
      .eq("id", chatId);

    if (upErr) {
      console.error("pending_ai_suggestion update:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, text: suggestion.text, suggestion });
  } catch (err) {
    console.error("chat-suggest:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function callGrok(
  messages: { role: string; content: string }[],
  systemTail: string,
): Promise<string> {
  const key = process.env.GROK_API_KEY;
  if (!key || key === "your-grok-api-key") throw new Error("No key");

  const payload = {
    messages: [{ role: "system", content: BASE_SYSTEM + systemTail }, ...messages],
    temperature: 0.65,
    max_tokens: 220,
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
      return data.choices?.[0]?.message?.content || "";
    }
    lastStatus = res.status;
  }
  throw new Error(`Grok ${lastStatus}`);
}

async function callOpenAI(
  messages: { role: string; content: string }[],
  systemTail: string,
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "your-openai-api-key") throw new Error("No key");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: BASE_SYSTEM + systemTail }, ...messages],
      temperature: 0.65,
      max_tokens: 220,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
