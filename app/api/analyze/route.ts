import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type ProductAnalysis = {
  productType: string;
  brand: string;
  color: string;
  material: string;
  dimensions: string;
  weight: string;
  pattern: string;
  usage: string;
  targetAudience: string;
  gender: string;
  features: string[];
  packaging: string;
  accessories: string[];
  keyFeatures: string[];
  countryOfOrigin: string;
  warranty: string;
  confidence: Record<string, "high" | "medium" | "low">;
  rawAnalysis: string;
};

const VISION_PROMPT = `You are an expert product analyst working for an AI-powered ecommerce listing platform. Your job is to carefully examine the provided product images and extract all available product information.

Look carefully at every image and extract:
1. **Product Type** — What is this product? Be specific (e.g., "Running Shoes" not just "Shoes")
2. **Brand** — Any visible brand name, logo, or branding (write "Unknown" if not visible)
3. **Color** — Primary and secondary colors of the product
4. **Material** — What material is the product made of (e.g., mesh, leather, cotton, plastic, metal)
5. **Dimensions** — Estimated physical dimensions if inferable (e.g., "30cm x 20cm x 5cm")
6. **Weight** — Estimated weight if inferable (e.g., "250g")
7. **Pattern** — Any pattern on the product (solid, striped, floral, geometric, etc.)
8. **Usage** — What is this product used for? How is it used?
9. **Target Audience** — Who is this product for? (e.g., Men, Women, Kids, Unisex, Babies, Seniors)
10. **Gender** — Specific gender if applicable (Men, Women, Boys, Girls, Unisex)
11. **Key Features** — 3–6 distinctive features visible or inferable (e.g., Waterproof, Lightweight, Rechargeable, Foldable)
12. **Packaging** — How is the product packaged? (retail box, blister pack, polybag, etc.)
13. **Accessories Included** — Any accessories or components visible in or with the product
14. **Country of Origin** — Any "Made in [Country]" label visible (write "Not visible" if not shown)
15. **Warranty** — Any warranty information visible (write "Not specified" if not shown)

Respond STRICTLY in this JSON format only (no extra text, no markdown, no code blocks):

{
  "productType": "string",
  "brand": "string",
  "color": "string",
  "material": "string",
  "dimensions": "string",
  "weight": "string",
  "pattern": "string",
  "usage": "string",
  "targetAudience": "string",
  "gender": "string",
  "features": ["string", "string"],
  "packaging": "string",
  "accessories": ["string"],
  "keyFeatures": ["string", "string"],
  "countryOfOrigin": "string",
  "warranty": "string"
}

If any field cannot be determined from the images, write "Not visible" or "Unknown" for that field. Do not guess values — only write what can be seen or reasonably inferred.`;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const photoFiles = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);

  if (photoFiles.length === 0) {
    return NextResponse.json({ error: "At least one product photo is required." }, { status: 400 });
  }

  if (photoFiles.length > 8) {
    return NextResponse.json({ error: "Maximum 8 photos supported for analysis." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set. Add it to your .env.local file. Get a free key at https://aistudio.google.com/apikey"
      },
      { status: 503 }
    );
  }

  let parts: Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> = [
    { text: VISION_PROMPT }
  ];

  try {
    for (const file of photoFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      parts.push({
        inlineData: {
          data: base64,
          mimeType: file.type || "image/jpeg"
        }
      });
    }
  } catch {
    return NextResponse.json({ error: "Could not read uploaded photos." }, { status: 400 });
  }

  try {
    const model = "gemini-3.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          topK: 16,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Vision API error:", response.status, errorText);

      let userMessage = "Vision analysis failed. Please try again.";

      if (response.status === 429) {
        userMessage = "Rate limit reached. Google Gemini free tier allows 15 requests/min. Wait 60 seconds and try again.";
      } else if (response.status === 403 || response.status === 401) {
        userMessage = "Invalid API key. Make sure you're using a Gemini API key from aistudio.google.com/apikey (starts with AIza...), not a Google OAuth or Vertex AI key.";
      }

      return NextResponse.json({ error: userMessage }, { status: 502 });
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json({ error: "No analysis returned. Please try again." }, { status: 502 });
    }

    // Strip markdown code blocks if Gemini wraps the JSON in them
    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let analysis: Partial<ProductAnalysis>;

    try {
      analysis = JSON.parse(cleanedText);
    } catch {
      // If JSON parsing fails, return the raw text as a fallback
      return NextResponse.json({
        rawAnalysis: cleanedText,
        error: "Could not parse structured data. Raw analysis shown below."
      }, { status: 200 });
    }

    const result: ProductAnalysis = {
      productType: analysis.productType ?? "Unknown",
      brand: analysis.brand ?? "Unknown",
      color: analysis.color ?? "Unknown",
      material: analysis.material ?? "Unknown",
      dimensions: analysis.dimensions ?? "Not visible",
      weight: analysis.weight ?? "Not visible",
      pattern: analysis.pattern ?? "Not visible",
      usage: analysis.usage ?? "Not visible",
      targetAudience: analysis.targetAudience ?? "General",
      gender: analysis.gender ?? "Unisex",
      features: Array.isArray(analysis.features) ? analysis.features.slice(0, 8) : [],
      packaging: analysis.packaging ?? "Not visible",
      accessories: Array.isArray(analysis.accessories) ? analysis.accessories.slice(0, 6) : [],
      keyFeatures: Array.isArray(analysis.keyFeatures) ? analysis.keyFeatures.slice(0, 6) : [],
      countryOfOrigin: analysis.countryOfOrigin ?? "Not visible",
      warranty: analysis.warranty ?? "Not specified",
      confidence: {},
      rawAnalysis: cleanedText
    };

    // Assign confidence based on whether fields are "Unknown" or "Not visible"
    for (const key of Object.keys(result) as (keyof ProductAnalysis)[]) {
      if (typeof result[key] === "string") {
        result.confidence[key] = result[key] === "Unknown" || result[key] === "Not visible" || result[key] === "Not specified"
          ? "low"
          : "high";
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Vision analysis error:", error);
    const message = error instanceof Error ? error.message : "Vision analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
