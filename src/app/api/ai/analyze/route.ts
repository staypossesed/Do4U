import { NextRequest, NextResponse } from "next/server";
import { GROK_MODELS_TEXT_ONLY, GROK_MODELS_WITH_VISION } from "@/lib/ai/grok-models";
import {
  type ListingPrimaryLocale,
  priceCurrencyHint,
} from "@/lib/listing-locale";

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

function localityBlock(countryCode: string | undefined, sellerCity: string | undefined): string {
  const city = sellerCity?.trim();
  const parts = [city, countryCode].filter(Boolean) as string[];
  if (parts.length === 0) return "";
  return `

SELLER LOCAL MARKET: The listing targets buyers near ${parts.join(", ")}. Assume a typical local resale radius of about 50 km / 30 miles for pricing, meetup wording, and currency context unless the voice transcript clearly says shipping-only or a different region.`;
}

function buildAnalyzeSystemPrompt(
  primary: ListingPrimaryLocale,
  countryCode: string | undefined,
  sellerCity: string | undefined,
): string {
  const priceRule = priceCurrencyHint(countryCode ?? null, primary);
  const cc = countryCode ? ` Seller country (ISO-2): ${countryCode}.` : "";
  const loc = localityBlock(countryCode, sellerCity);

  if (primary === "ru") {
    return `You are Do4U AI — creating marketplace listings for the Do4U app (Sell4U / Buy4U).
The seller's primary market language is RUSSIAN.${cc}

ALLOWED CATEGORIES (pick exactly one):
clothing, shoes, accessories, electronics, books, toys, furniture

RULES:
- The voice transcript is the source of truth for WHAT is being sold (product, brand). Photos refine condition/details; if they seem to show a different item than the transcript, follow the transcript.
- "title" and "description" MUST be in Russian (main text for local marketplaces).
- "titleEn" and "descriptionEn": ONLY if a useful English summary adds value (e.g. export). If not needed, set both to null. Do NOT duplicate the full Russian text into English unless you are providing a proper translation. Prefer null for local-only listings.
- Title max ~60 chars (Russian). Description: 2-4 sentences, honest, mention defects.
- Price: ${priceRule}
- Tags: 5-8 keywords in Russian (or Latin brand names as appropriate).
- If item is prohibited (weapons, drugs, live animals, counterfeits, etc.), set category to "REJECTED" and explain in description (Russian).${loc}

Respond ONLY with valid JSON:
{
  "title": "string (Russian)",
  "description": "string (Russian)",
  "titleEn": "string (English) | null",
  "descriptionEn": "string (English) | null",
  "price": number,
  "category": "string",
  "tags": ["string"],
  "condition": "new | like_new | good | fair | poor"
}`;
  }

  return `You are Do4U AI — creating marketplace listings for the Do4U app (Sell4U / Buy4U).
The seller's primary language is ENGLISH (US, EU, UK, etc.). Do NOT use Russian in "title" or "description".${cc}

ALLOWED CATEGORIES (pick exactly one):
clothing, shoes, accessories, electronics, books, toys, furniture

RULES:
- The voice transcript is the source of truth for WHAT is being sold (product, brand). Photos refine condition/details; if they seem to show a different item than the transcript, follow the transcript.
- "title" and "description" MUST be in English only (natural for the seller's country).
- Set "titleEn" and "descriptionEn" to null — the main fields are already English; no second block required.
- Title max ~60 chars. Description: 2-4 sentences, honest, mention defects.
- Price: ${priceRule}
- Tags: 5-8 keywords in English.
- If item is prohibited, set category to "REJECTED" and explain in description (English).${loc}

Respond ONLY with valid JSON:
{
  "title": "string (English)",
  "description": "string (English)",
  "titleEn": null,
  "descriptionEn": null,
  "price": number,
  "category": "string",
  "tags": ["string"],
  "condition": "new | like_new | good | fair | poor"
}`;
}

async function callGrok(
  transcript: string,
  imageUrls: string[],
  primary: ListingPrimaryLocale,
  countryCode: string | undefined,
  sellerCity: string | undefined,
): Promise<AnalysisResult> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("GROK_API_KEY missing or invalid");

  const systemPrompt = buildAnalyzeSystemPrompt(primary, countryCode, sellerCity);
  const hasImages = imageUrls.length > 0;
  const models = hasImages ? GROK_MODELS_WITH_VISION : GROK_MODELS_TEXT_ONLY;
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
          { role: "system", content: systemPrompt },
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
      return parseJSON(text, primary);
    } catch (err) {
      lastError = `Grok ${model}: ${err instanceof Error ? err.message : String(err)}`;
      console.warn(`[AI] ${lastError}`);
    }
  }

  throw new Error(lastError || "All Grok models failed");
}

async function callOpenAI(
  transcript: string,
  imageUrls: string[],
  primary: ListingPrimaryLocale,
  countryCode: string | undefined,
  sellerCity: string | undefined,
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("OPENAI_API_KEY missing or invalid");

  const systemPrompt = buildAnalyzeSystemPrompt(primary, countryCode, sellerCity);
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
        { role: "system", content: systemPrompt },
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
  return parseJSON(text, primary);
}

function parseJSON(text: string, primary: ListingPrimaryLocale): AnalysisResult {
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

  function optStr(v: unknown): string {
    if (v == null) return "";
    const s = String(v).trim();
    return s;
  }

  const title = String(parsed.title ?? "").trim();
  const description = String(parsed.description ?? "").trim();

  let titleEn = "";
  let descriptionEn = "";
  if (primary === "ru") {
    titleEn = optStr(parsed.titleEn ?? parsed.title_en);
    descriptionEn = optStr(parsed.descriptionEn ?? parsed.description_en);
  }

  return {
    title,
    titleEn,
    description,
    descriptionEn,
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
    const primaryRaw = body.primaryLocale === "en" ? "en" : "ru";
    const primary = primaryRaw as ListingPrimaryLocale;
    const countryCode =
      typeof body.countryCode === "string" && body.countryCode.length >= 2
        ? String(body.countryCode).toUpperCase().slice(0, 2)
        : undefined;
    const sellerCity =
      typeof body.sellerCity === "string" ? String(body.sellerCity).trim().slice(0, 200) : undefined;
    const sellerCityNorm = sellerCity || undefined;

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
      const result = await callGrok(transcript, validUrls, primary, countryCode, sellerCityNorm);
      return respondSuccess(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Grok: ${msg}`);
    }

    // === Attempt 2: OpenAI with images ===
    try {
      const result = await callOpenAI(transcript, validUrls, primary, countryCode, sellerCityNorm);
      return respondSuccess(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`OpenAI: ${msg}`);
    }

    // === Attempt 3: OpenAI text-only (if had images before) ===
    if (validUrls.length > 0) {
      try {
        const result = await callOpenAI(transcript, [], primary, countryCode, sellerCityNorm);
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
