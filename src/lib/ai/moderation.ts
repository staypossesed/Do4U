import { GROK_MODELS_TEXT_ONLY } from "@/lib/ai/grok-models";

/**
 * Pre-publish safety check (Grok → OpenAI fallback).
 * On provider errors we allow publish to avoid blocking users when APIs are down.
 */
export async function moderateListingContent(input: {
  title: string;
  description: string;
  transcript: string | null;
}): Promise<{ allowed: boolean; reason?: string }> {
  const blob = [
    input.title,
    input.description,
    input.transcript || "",
  ].join("\n---\n");

  const system = `You are a marketplace safety classifier for Do4U (consumer goods only).

ALLOW (allowed: true) by default when in doubt.
- Normal second-hand / pre-owned items: clothing, shoes, bags, electronics, furniture, books, toys — including authentic USED luxury brands (Prada, Gucci, Louis Vuitton, etc.) when the seller describes a real item for resale. A brand name in the title or description is NOT grounds to block.

BLOCK (allowed: false) ONLY for clear violations:
- Drugs, weapons, live animals, human exploitation, clearly illegal goods.
- Obvious counterfeit: listing admits replica/fake/copy/реплика/подделка/копия OR strongly implies selling a fake as genuine authentic (e.g. "идеальная копия люкса как оригинал", suspicious pricing + explicit fake cues). Do NOT block merely because the item is a luxury brand or expensive.

If the listing is a plausible honest resale of a branded used item → {"allowed": true}.

Reply ONLY with compact JSON: {"allowed": true} or {"allowed": false, "reason": "short Russian reason for user"}`;

  try {
    const grokKey = process.env.GROK_API_KEY;
    if (grokKey && grokKey.length > 10) {
      const payload = {
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Listing text:\n${blob.slice(0, 6000)}` },
        ],
        temperature: 0,
        max_tokens: 120,
      };
      for (const model of GROK_MODELS_TEXT_ONLY) {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({ model, ...payload }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) return parseModJson(text);
        }
      }
    }

    const oaKey = process.env.OPENAI_API_KEY;
    if (oaKey && oaKey.length > 10) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${oaKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Listing text:\n${blob.slice(0, 6000)}` },
          ],
          temperature: 0,
          max_tokens: 120,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return parseModJson(text);
      }
    }
  } catch (e) {
    console.warn("moderation: provider error, allowing publish", e);
  }

  return { allowed: true };
}

function parseModJson(text: string): { allowed: boolean; reason?: string } {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { allowed: true };
  try {
    const j = JSON.parse(m[0]) as { allowed?: boolean; reason?: string };
    if (typeof j.allowed === "boolean" && !j.allowed) {
      return { allowed: false, reason: j.reason || "Не прошло модерацию" };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}
