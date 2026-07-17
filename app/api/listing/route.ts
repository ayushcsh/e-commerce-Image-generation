import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type MarketplaceListing = {
  title: string;
  bullets?: string[];
  description: string;
  keywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  highlights?: string[];
  productType?: string;
  vendor?: string;
  bodyHtml?: string;
  material?: string;
  occasion?: string;
};

export type AllListings = {
  amazon: MarketplaceListing;
  flipkart: MarketplaceListing;
  meesho: MarketplaceListing;
  myntra: MarketplaceListing;
  shopify: MarketplaceListing;
  woocommerce: MarketplaceListing;
  etsy: MarketplaceListing;
  ajio: MarketplaceListing;
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

    case "myntra":
      return `${baseContext}

You are an expert Myntra product listing copywriter. Myntra is a fashion-focused Indian marketplace. Generate:

1. **Title**: Clean product name with brand.
2. **Description**: Fashion-forward description emphasizing style, fit, and occasion.
3. **Highlights**: Style and fashion highlights.
4. **SEO Title**: Fashion keywords + brand + product type.
5. **Tags** (comma-separated): Fashion/style keywords for discoverability.

Respond ONLY as JSON:
{
  "title": "string",
  "description": "string",
  "highlights": ["string", "string", ...],
  "seoTitle": "string",
  "tags": ["string", "string", ...],
  "productType": "string"
}`;

    case "shopify":
      return `${baseContext}

You are an expert Shopify product listing copywriter. Generate a complete Shopify listing:

1. **Title**: Search-optimized product title with key terms.
2. **Description (body_html)**: Full HTML description with product details, features, shipping info. Use basic HTML tags (<p>, <ul>, <li>, <strong>) for formatting.
3. **SEO Title** (max 70 chars): Meta title for search engines.
4. **SEO Description** (max 320 chars): Meta description.
5. **Tags** (comma-separated, Shopify max 75 chars per tag, up to 20 tags): Browse-ability keywords.
6. **Product Type**: Clean category hierarchy (e.g., "Clothing > T-Shirts > Men's").
7. **Vendor**: Brand name.

Respond ONLY as JSON:
{
  "title": "string",
  "bodyHtml": "string (HTML formatted)",
  "seoTitle": "string (max 70 chars)",
  "seoDescription": "string (max 320 chars)",
  "tags": ["string", "string", ...],
  "productType": "string",
  "vendor": "string"
}`;

    case "woocommerce":
      return `${baseContext}

You are an expert WooCommerce product listing copywriter. WooCommerce stores vary widely but typically serve niche brands. Generate:

1. **Title**: Clean, descriptive product title.
2. **Description**: Full product description with features.
3. **Short Description**: 2-3 line pitch for the product card.
4. **SEO Title** (max 60 chars).
5. **SEO Description** (max 160 chars).
6. **Tags**: Product tags for filtering.
7. **Categories**: Suggested WooCommerce categories based on the product.

Respond ONLY as JSON:
{
  "title": "string",
  "description": "string",
  "seoTitle": "string (max 60 chars)",
  "seoDescription": "string (max 160 chars)",
  "tags": ["string", "string", ...],
  "productType": "string"
}`;

    case "etsy":
      return `${baseContext}

You are an expert Etsy product listing copywriter. Etsy is a handmade/vintage/craft marketplace. Generate:

1. **Title** (max 140 characters): Etsy-optimized with search terms naturally woven in. Include product type, material, occasion, style.
2. **Description**: Personal, storytelling style. Explain what makes this product special, how it was made (if applicable), dimensions, materials in detail.
3. **Tags** (13 tags, each max 20 characters): Etsy search terms — be specific and include synonyms.
4. **Materials** (comma-separated): All materials used.
5. **Occasion**: When would someone buy this? (e.g., Wedding, Birthday, Anniversary)
6. **SEO Title**: Craft/Etsy search-optimized title.

Respond ONLY as JSON:
{
  "title": "string (max 140 chars)",
  "description": "string",
  "tags": ["string (max 20 chars)", ...],
  "material": "string",
  "occasion": "string",
  "seoTitle": "string"
}`;

    case "ajio":
      return `${baseContext}

You are an expert Ajio product listing copywriter. Ajio is a fashion and lifestyle Indian marketplace targeting trendy, urban buyers. Generate:

1. **Title**: Stylish, brand-forward title with key features.
2. **Description**: Fashion-forward description.
3. **Highlights**: Style and quality highlights.
4. **SEO Title**: Fashion keywords + brand + product type.
5. **Tags**: Fashion/style keywords.

Respond ONLY as JSON:
{
  "title": "string",
  "description": "string",
  "highlights": ["string", "string", ...],
  "seoTitle": "string",
  "tags": ["string", "string", ...]
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
      tags: [],
      highlights: [],
      productType: "",
      vendor: "",
      bodyHtml: ""
    };
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let brief: Record<string, unknown>;

  try {
    const json = await request.json();
    brief = json.brief || json;
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
    Meesho: "meesho",
    Myntra: "myntra",
    Shopify: "shopify",
    WooCommerce: "woocommerce",
    Etsy: "etsy",
    Ajio: "ajio"
  };

  // Limit to 5 marketplace generations at once to avoid long response times
  const marketplacesToGenerate = selectedMarketplaces
    .slice(0, 5)
    .map((m) => marketplaceMap[m] || m.toLowerCase());

  try {
    const results = await Promise.allSettled(
      marketplacesToGenerate.map((marketplace) =>
        generateListingForMarketplace(brief, marketplace)
      )
    );

    const allListings: AllListings = {
      amazon: { title: "", description: "", bullets: [], keywords: [], seoTitle: "", seoDescription: "" },
      flipkart: { title: "", description: "", highlights: [], seoTitle: "", seoDescription: "" },
      meesho: { title: "", description: "", highlights: [] },
      myntra: { title: "", description: "", highlights: [], seoTitle: "", tags: [], productType: "" },
      shopify: { title: "", description: "", seoTitle: "", seoDescription: "", tags: [], productType: "", vendor: "", bodyHtml: "" },
      woocommerce: { title: "", description: "", seoTitle: "", seoDescription: "", tags: [], productType: "" },
      etsy: { title: "", description: "", tags: [], material: "", occasion: "", seoTitle: "" },
      ajio: { title: "", description: "", highlights: [], seoTitle: "", tags: [] }
    };

    marketplacesToGenerate.forEach((marketplace, index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        (allListings as unknown as Record<string, MarketplaceListing>)[marketplace] = result.value;
      }
    });

    return NextResponse.json(allListings);
  } catch (error) {
    console.error("Listing generation error:", error);
    const message = error instanceof Error ? error.message : "Listing generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
