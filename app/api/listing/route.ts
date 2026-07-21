import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createGeneration, saveGenerationListings, pruneOldGenerations } from "@/lib/generations";

export type MarketplaceListing = {
  title: string;
  bullets?: string[];
  description: string;
  keywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  highlights?: string[];
};

export type AllListings = {
  amazon: MarketplaceListing;
  flipkart: MarketplaceListing;
  meesho: MarketplaceListing;
  rawResponse?: string;
};

function buildListingPrompt(brief: Record<string, unknown>, marketplace: string): string {
  const productName = brief.productName || "Unknown Product";
  const category = brief.category || "General";
  const brandName = brief.brandName || "";
  const material = brief.material || "";
  const dimensions = brief.dimensions || "";
  const weight = brief.weight || "";
  const targetAudience = brief.targetAudience || "";
  const description = brief.description || "";
  const sellingPrice = brief.sellingPrice || "";
  const mrp = brief.mrp || "";
  const discount = brief.discountPercent || "";
  const warranty = brief.warranty || "";
  const countryOfOrigin = brief.countryOfOrigin || "India";
  const packageContents = brief.packageContents || "";
  const keyFeatures = Array.isArray(brief.keyFeatures) ? (brief.keyFeatures as string[]).join(", ") : "";
  const productColors = Array.isArray(brief.productColors) ? (brief.productColors as string[]).join(", ") : "";
  const marketplaces = Array.isArray(brief.marketplaces) ? (brief.marketplaces as string[]).join(", ") : "";
  const customPrompt = brief.customPrompt || "";

  const baseContext = `
Product: ${productName}
Brand: ${brandName || "Unbranded"}
Category: ${category}
Material: ${material || "Not specified"}
Dimensions: ${dimensions || "Not specified"}
Weight: ${weight || "Not specified"}
Target Audience: ${targetAudience || "General consumers"}
Description: ${description || "No description provided."}
Key Features: ${keyFeatures || "Not specified"}
Colors Available: ${productColors || "Not specified"}
Selling Price: ${sellingPrice}
MRP: ${mrp}
Discount: ${discount ? discount + "%" : "Not specified"}
Warranty: ${warranty || "Not specified"}
Country of Origin: ${countryOfOrigin}
Package Contents: ${packageContents || "Not specified"}
Target Marketplaces: ${marketplaces}
Additional Notes: ${customPrompt}
`.trim();

  switch (marketplace) {
    case "amazon":
      return `${baseContext}

You are an expert Amazon product listing copywriter. Generate a complete Amazon listing:

1. **Title** (max 200 characters): Include brand, product type, key features, size/color if applicable. Format: Brand | Product Type | Key Feature 1 | Key Feature 2 | Size/Color
2. **Bullet Points** (5 bullets, max 500 characters each): Feature-benefit format. Start each with a capital letter. Cover: key feature, material/quality, use case, what's included, warranty/policy.
3. **Description** (max 2000 characters): Detailed product description with specifications and brand story.
4. **Backend Keywords** (up to 249 bytes total, comma-separated): Relevant search terms buyers might use. No duplicates, no ASINs, no brand names you don't have permission to use.
5. **Search Terms** (comma-separated): Additional long-tail keywords.

Respond ONLY as JSON:
{
  "title": "string (max 200 chars)",
  "bullets": ["string (max 500 chars)", ...],
  "description": "string (max 2000 chars)",
  "keywords": ["string", "string", ...],
  "seoTitle": "string (max 50 chars for search engine title)",
  "seoDescription": "string (max 160 chars for search engine description)"
}`;

    case "flipkart":
      return `${baseContext}

You are an expert Flipkart product listing copywriter. Generate a complete Flipkart listing:

1. **Title** (max 100 characters): Product name with brand, key selling point.
2. **Highlights** (5-8 short bullet points): Key features and specifications in crisp, short phrases.
3. **Description**: Detailed product description with specifications table format.
4. **SEO Title**: Search-optimized title with high-volume keywords.
5. **SEO Description**: Meta description for search engines (max 160 chars).

Respond ONLY as JSON:
{
  "title": "string (max 100 chars)",
  "highlights": ["string", "string", ...],
  "description": "string",
  "seoTitle": "string",
  "seoDescription": "string (max 160 chars)"
}`;

    case "meesho":
      return `${baseContext}

You are an expert Meesho product listing copywriter. Meesho targets value-conscious buyers in Tier 2-4 cities of India. Generate:

1. **Title** (max 80 characters): Catchy, value-focused title. Include product type and 1 key feature. Price indicator helps.
2. **Description**: Warm, persuasive description targeting value-conscious Indian women. Mention quality, occasion, gifting.
3. **Highlights** (5 points): Short feature highlights in plain Hindi/English mix (Hinglish) style common on Meesho.

Respond ONLY as JSON:
{
  "title": "string (max 80 chars)",
  "description": "string (persuasive, in Hinglish style)",
  "highlights": ["string", "string", ...]
}`;

    default:
      return `${baseContext}

Generate a complete marketplace listing in JSON format with title, description, keywords, and SEO fields.`;
  }
}

async function generateListingForMarketplace(
  brief: Record<string, unknown>,
  marketplace: string
): Promise<MarketplaceListing> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = buildListingPrompt(brief, marketplace);
  const model = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error for ${marketplace}:`, response.status, errorText);
    if (response.status === 429) {
      throw new Error("Rate limit reached. Gemini free tier allows 15 requests/min. Wait 60 seconds before generating listings.");
    } else if (response.status === 403 || response.status === 401) {
      throw new Error("Invalid GEMINI_API_KEY. Use a key from aistudio.google.com/apikey that starts with 'AIza...'");
    }
    throw new Error(`Failed to generate ${marketplace} listing.`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    return {
      title: `[${marketplace}] Listing generation failed to parse.`,
      description: rawText || "Content unavailable.",
      bullets: [],
      keywords: [],
      seoTitle: "",
      seoDescription: "",
      highlights: []
    };
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let brief: Record<string, unknown>;
  let generationId: string | undefined;

  try {
    const json = await request.json();
    brief = json.brief || json;
    generationId = typeof json.generationId === "string" ? json.generationId : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!brief.productName && !brief.category) {
    return NextResponse.json(
      { error: "Product name or category is required to generate a listing." },
      { status: 400 }
    );
  }

  const selectedMarketplaces = Array.isArray(brief.marketplaces)
    ? (brief.marketplaces as string[])
    : ["Amazon"];

  const marketplaceMap: Record<string, string> = {
    Amazon: "amazon",
    Flipkart: "flipkart",
    Meesho: "meesho"
  };

  const marketplacesToGenerate = selectedMarketplaces
    .map((m) => marketplaceMap[m])
    .filter((m): m is string => Boolean(m));

  try {
    const results = await Promise.allSettled(
      marketplacesToGenerate.map((marketplace) =>
        generateListingForMarketplace(brief, marketplace)
      )
    );

    const allListings: AllListings = {
      amazon: { title: "", description: "", bullets: [], keywords: [], seoTitle: "", seoDescription: "" },
      flipkart: { title: "", description: "", highlights: [], seoTitle: "", seoDescription: "" },
      meesho: { title: "", description: "", highlights: [] }
    };

    const failedMarketplaces: string[] = [];

    marketplacesToGenerate.forEach((marketplace, index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        (allListings as unknown as Record<string, MarketplaceListing>)[marketplace] = result.value;
      } else {
        failedMarketplaces.push(marketplace);
        console.error(`Listing generation failed for ${marketplace}:`, result.reason);
      }
    });

    // If every requested marketplace failed (e.g. the AI provider is down or
    // out of quota), surface that as a real error instead of silently
    // returning empty listings with a 200.
    if (failedMarketplaces.length === marketplacesToGenerate.length) {
      const reason = results[0]?.status === "rejected" ? results[0].reason : undefined;
      const detail = reason instanceof Error ? reason.message : "The AI provider did not return a result.";
      return NextResponse.json({ error: `Listing generation failed for all marketplaces. ${detail}` }, { status: 502 });
    }

    // Persist the listing text so it shows up alongside images in history.
    // Attach to the existing generation (images already made) if one was passed in,
    // otherwise create a lightweight image-less record just to hold the listing text.
    let savedGenerationId: string | null = null;
    try {
      const attached = generationId
        ? await saveGenerationListings(generationId, session.user.id, allListings)
        : false;

      if (attached) {
        savedGenerationId = generationId!;
      } else {
        savedGenerationId = await createGeneration({
          userId: session.user.id,
          productName: String(brief.productName || "Untitled product"),
          category: String(brief.category || ""),
          marketplaces: selectedMarketplaces,
          background: "",
          images: [],
          listings: allListings,
        });
      }
      pruneOldGenerations(session.user.id).catch((err) => console.error("[listing] prune old generations failed:", err));
    } catch (err) {
      console.error("Listing save error:", err);
    }

    return NextResponse.json({ ...allListings, id: savedGenerationId, failedMarketplaces });
  } catch (error) {
    console.error("Listing generation error:", error);
    const message = error instanceof Error ? error.message : "Listing generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
