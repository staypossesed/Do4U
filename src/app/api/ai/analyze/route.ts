import { NextRequest, NextResponse } from "next/server";

interface AnalysisResult {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  category: string;
  tags: string[];
  condition: string;
}

const SYSTEM_PROMPT = `You are Do4U AI — an expert at creating marketplace listings for the Do4U app (Sell4U / Buy4U).
Given a voice transcript describing an item and optionally photos, generate a complete listing.

ALLOWED CATEGORIES (pick exactly one):
clothing, shoes, accessories, electronics, books, toys, furniture

RULES:
- Title must be concise, SEO-optimized, max 60 chars
- Description: detailed, honest, mention all defects
- Price in RUB, based on typical Russian marketplace prices for this item's condition
- Tags: 5-8 relevant keywords
- If item seems prohibited (weapons, drugs, food, animals, counterfeits), set category to "REJECTED" and explain in description

Respond ONLY with valid JSON matching this schema:
{
  "title": "string (Russian)",
  "titleEn": "string (English)",
  "description": "string (Russian, 2-4 sentences)",
  "descriptionEn": "string (English, 2-4 sentences)",
  "price": number,
  "category": "string",
  "tags": ["string"],
  "condition": "new | like_new | good | fair | poor"
}`;

const GROK_VISION_MODELS = ["grok-2-vision-latest", "grok-2-vision-1212"];
const GROK_TEXT_MODELS = ["grok-2-latest", "grok-2-1212"];

async function callGrok(transcript: string, imageUrls: string[]): Promise<AnalysisResult> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("GROK_API_KEY missing or invalid");

  const hasImages = imageUrls.length > 0;
  const models = hasImages ? GROK_VISION_MODELS : GROK_TEXT_MODELS;
  const userText = `Voice transcript from seller: "${transcript}"\n\nGenerate the listing JSON.`;

  let lastError = "";

  for (const model of models) {
    try {
      // Build messages based on whether we have images
      let userContent: unknown;
      if (hasImages) {
        const parts: unknown[] = [{ type: "text", text: userText }];
        for (const url of imageUrls.slice(0, 4)) {
          parts.push({ type: "image_url", image_url: { url } });
        }
        userContent = parts;
      } else {
        userContent = userText;
      }

      const body = {
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      };

      console.log(`[AI] Trying Grok model: ${model}, hasImages: ${hasImages}`);

      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errText = "";
        try { errText = await res.text(); } catch { errText = "no body"; }
        lastError = `Grok ${model} HTTP ${res.status}: ${errText.slice(0, 200)}`;
        console.warn(`[AI] ${lastError}`);
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        lastError = `Grok ${model}: empty response content`;
        console.warn(`[AI] ${lastError}`);
        continue;
      }

      console.log(`[AI] Grok ${model} responded, parsing...`);
      return parseJSON(text);
    } catch (err) {
      lastError = `Grok ${model}: ${err instanceof Error ? err.message : String(err)}`;
      console.warn(`[AI] ${lastError}`);
    }
  }

  throw new Error(lastError || "All Grok models failed");
}

async function callOpenAI(transcript: string, imageUrls: string[]): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("OPENAI_API_KEY missing or invalid");

  const hasImages = imageUrls.length > 0;
  const userText = `Voice transcript from seller: "${transcript}"\n\nGenerate the listing JSON.`;

  let userContent: unknown;
  if (hasImages) {
    const parts: unknown[] = [{ type: "text", text: userText }];
    for (const url of imageUrls.slice(0, 4)) {
      parts.push({ type: "image_url", image_url: { url, detail: "low" } });
    }
    userContent = parts;
  } else {
    userContent = userText;
  }

  const model = hasImages ? "gpt-4o" : "gpt-4o-mini";
  console.log(`[AI] Trying OpenAI model: ${model}, hasImages: ${hasImages}`);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    let errText = "";
    try { errText = await res.text(); } catch { errText = "no body"; }
    throw new Error(`OpenAI ${model} HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned empty response");

  console.log(`[AI] OpenAI ${model} responded, parsing...`);
  return parseJSON(text);
}

function parseJSON(text: string): AnalysisResult {
  // Try code block first, then raw JSON
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error(`No JSON found in AI response: ${text.slice(0, 100)}`);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[1]);
  } catch (e) {
    throw new Error(`JSON parse failed: ${(e as Error).message} — raw: ${jsonMatch[1].slice(0, 100)}`);
  }

  if (!parsed.title || !parsed.description) {
    throw new Error("AI returned incomplete listing data (missing title/description)");
  }

  // Coerce price to number
  let price = Number(parsed.price);
  if (isNaN(price) || price < 0) price = 1000;

  const validCategories = ["clothing", "shoes", "accessories", "electronics", "books", "toys", "furniture", "REJECTED"];
  const category = validCategories.includes(parsed.category as string) ? parsed.category as string : "clothing";

  return {
    title: String(parsed.title),
    titleEn: String(parsed.titleEn || parsed.title_en || parsed.title),
    description: String(parsed.description),
    descriptionEn: String(parsed.descriptionEn || parsed.description_en || parsed.description),
    price,
    category,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    condition: String(parsed.condition || "good"),
  };
}

export async function POST(request: NextRequest) {
  // Wrap EVERYTHING in try/catch so we NEVER return plain text
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const transcript = String(body.transcript || "");
    const rawUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];

    if (transcript.length < 5) {
      return NextResponse.json(
        { error: "Transcript too short. Please describe the item in more detail." },
        { status: 400 }
      );
    }

    // Filter valid image URLs
    const validUrls = rawUrls.filter((u): u is string => typeof u === "string" && u.startsWith("http"));
    const errors: string[] = [];

    // === Attempt 1: Grok ===
    try {
      const result = await callGrok(transcript, validUrls);
      return respondSuccess(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Grok: ${msg}`);
    }

    // === Attempt 2: OpenAI with images ===
    try {
      const result = await callOpenAI(transcript, validUrls);
      return respondSuccess(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`OpenAI: ${msg}`);
    }

    // === Attempt 3: OpenAI text-only (if had images before) ===
    if (validUrls.length > 0) {
      try {
        const result = await callOpenAI(transcript, []);
        return respondSuccess(result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`OpenAI text-only: ${msg}`);
      }
    }

    // All failed
    console.error("[AI] All providers failed:", errors);
    return NextResponse.json(
      { error: errors.join(" | ") },
      { status: 502 }
    );
  } catch (fatalErr) {
    // This should NEVER happen, but just in case
    console.error("[AI] FATAL unhandled error:", fatalErr);
    return NextResponse.json(
      { error: `Server error: ${fatalErr instanceof Error ? fatalErr.message : "unknown"}` },
      { status: 500 }
    );
  }
}

function respondSuccess(result: AnalysisResult) {
  if (result.category === "REJECTED") {
    return NextResponse.json(
      { error: "This item is not allowed on Do4U.", rejected: true, reason: result.description },
      { status: 422 }
    );
  }
  return NextResponse.json({ success: true, listing: result });
}
