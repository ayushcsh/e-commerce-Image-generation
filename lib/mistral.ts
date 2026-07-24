import { CREDIT_PLANS } from "@/lib/pricing";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

export type ChatMessage = { role: "user" | "assistant"; content: string };

function plansSummary(): string {
  return (Object.values(CREDIT_PLANS) as Array<(typeof CREDIT_PLANS)[keyof typeof CREDIT_PLANS]>)
    .map((p) => `${p.name}: ₹${p.priceInr} for ${p.credits} credits${p.bonus ? ` (includes ${p.bonus} bonus credits)` : ""}`)
    .join("; ");
}

const SYSTEM_PROMPT = `You are the on-site assistant for VendorFlow, an AI product image generator for online sellers.

What VendorFlow does: a seller uploads one product photo, and VendorFlow's AI generates a complete marketplace-ready image set — multiple angles, studio backgrounds, close-ups, and lifestyle shots. It supports Amazon, Flipkart, Meesho, Myntra, and any D2C/custom store. Available styles include studio white, soft shadow, premium dark, and lifestyle scenes. Most image sets are ready within minutes; bulk/custom requests within 24 hours. New users get one free image set on their first upload.

Credit plans (in INR, all prices GST-inclusive): ${plansSummary()}. 1 credit = 1 basic image, 5 credits = 1 A+ (premium) listing image. Credits never expire.

Answer only questions relevant to VendorFlow — the product, pricing, how it works, account/credits, or general help using the site. Be concise (a few sentences, not an essay) and friendly. If asked something unrelated to VendorFlow or something you don't actually know, say so plainly rather than guessing.`;

export async function askAssistant(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not configured.");
  }

  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL || "mistral-small-latest",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.4,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mistral API error (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string") {
    throw new Error("Mistral API returned an unexpected response shape.");
  }
  return reply;
}
 