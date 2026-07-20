import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateProductImage, generateAplusImage, uploadReferenceImages, type ReferenceImage } from "@/lib/fal";
import { buildImagePrompt, buildAplusPrompt, type GenerationBrief } from "@/lib/prompts";
import { createGeneration } from "@/lib/generations";
import { uploadToR2 } from "@/lib/cloudflare";
import { chargeUserCredits, getUserCredits } from "@/lib/credits";
import { IMAGE_COST } from "@/lib/pricing";
import { randomUUID } from "crypto";

const MAX_REFERENCE_PHOTOS = 4;
const MAX_IMAGE_TYPES = 12;
const CONCURRENCY = 4;

// Which types are A+ (GPT Image 2), rest are basic (nano-banana)
const APLUS_TYPES = new Set([
  "Standard Banner",
  "Banner with Text Overlay",
  "Standard Image & Text",
  "Three Image Module",
  "Four Image Module",
  "Hero Listing Image",
  "A+ Lifestyle Banner",
  "A+ Product Photo",
]);

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  let cursor = 0;
  const results: R[] = new Array(items.length);

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) break;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const briefRaw = formData.get("brief");
  if (typeof briefRaw !== "string") {
    return NextResponse.json({ error: "Missing brief data." }, { status: 400 });
  }

  let brief: GenerationBrief;
  try {
    brief = JSON.parse(briefRaw);
  } catch {
    return NextResponse.json({ error: "Brief could not be parsed." }, { status: 400 });
  }

  if (!brief.productName?.trim()) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }

  const photoFiles = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);
  if (photoFiles.length === 0) {
    return NextResponse.json({ error: "At least one product photo is required." }, { status: 400 });
  }

  const imageTypes = (brief.imageTypes || []).slice(0, MAX_IMAGE_TYPES);
  if (imageTypes.length === 0) {
    return NextResponse.json({ error: "Select at least one image type." }, { status: 400 });
  }

  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: "Image generation is not configured." }, { status: 503 });
  }

  // Split into basic and A+ types
  const basicTypes = imageTypes.filter((t) => !APLUS_TYPES.has(t));
  const aplusTypes = imageTypes.filter((t) => APLUS_TYPES.has(t));

  // Calculate total cost
  const basicCost = basicTypes.length * IMAGE_COST.basic;
  const aplusCost = aplusTypes.length * IMAGE_COST.aplus;
  const totalCost = basicCost + aplusCost;

  // Check credits
  const credits = await getUserCredits(userId);
  const balance = credits?.balance ?? 0;

  if (balance < totalCost) {
    return NextResponse.json({
      error: `Insufficient credits. Need ${totalCost} (${basicTypes.length} basic @ ${IMAGE_COST.basic} + ${aplusTypes.length} A+ @ ${IMAGE_COST.aplus}), but have ${balance}.`,
      balance,
      totalCost,
      required: totalCost,
      pricing: IMAGE_COST,
    }, { status: 402 });
  }

  let referenceImages: ReferenceImage[];
  try {
    referenceImages = await Promise.all(
      photoFiles.slice(0, MAX_REFERENCE_PHOTOS).map(async (file) => ({
        base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        mimeType: file.type || "image/jpeg"
      }))
    );
  } catch {
    return NextResponse.json({ error: "Could not read uploaded photos." }, { status: 400 });
  }

  const generationId = randomUUID();
  const storagePrefix = `${userId}/${generationId}`;

  let images: Array<{ type: string; mimeType: string; storageKey: string; url: string; data: string; isAplus: boolean; width: number; height: number }> = [];

  try {
    const referenceImageUrls = await uploadReferenceImages(referenceImages);

    // Generate basic images (nano-banana)
    if (basicTypes.length > 0) {
      console.log(`[generate] Generating ${basicTypes.length} basic images...`);
      const basicImages = await mapWithConcurrency(basicTypes, CONCURRENCY, async (imageType, index) => {
        const prompt = buildImagePrompt(brief, imageType);

        let customSize: { width: number; height: number } | undefined;
        if (brief.customWidth && brief.customHeight) {
          customSize = { width: brief.customWidth, height: brief.customHeight };
        }

        console.log(`[generate] [basic:${index}] ${imageType} — calling nano-banana`);
        const generated = await generateProductImage(prompt, referenceImageUrls, customSize);
        console.log(`[generate] [basic:${index}] done — uploading to R2`);

        const ext = generated.mimeType.split("/")[1] || "png";
        const storageKey = `${storagePrefix}/basic-${index}.${ext}`;
        const body = Buffer.from(generated.base64, "base64");
        const url = await uploadToR2(storageKey, body, generated.mimeType);

        return {
          type: imageType,
          mimeType: generated.mimeType,
          data: generated.base64,
          storageKey,
          url,
          isAplus: false,
          width: customSize?.width ?? 1024,
          height: customSize?.height ?? 1024,
        };
      });
      images = images.concat(basicImages);
    }

    // Generate A+ images (GPT Image 2)
    if (aplusTypes.length > 0) {
      console.log(`[generate] Generating ${aplusTypes.length} A+ images (GPT Image 2)...`);
      const aplusImages = await mapWithConcurrency(aplusTypes, CONCURRENCY, async (imageType, index) => {
        const prompt = buildAplusPrompt(brief, imageType);

        let customSize: { width: number; height: number } | undefined;
        if (imageType === "Standard Banner") {
          customSize = { width: 970, height: 300 };
        } else if (imageType === "Banner with Text Overlay") {
          customSize = { width: 970, height: 300 };
        } else if (imageType === "Standard Image & Text") {
          customSize = { width: 1000, height: 1000 };
        } else if (imageType === "Three Image Module") {
          customSize = { width: 1464, height: 400 };
        } else if (imageType === "Four Image Module") {
          customSize = { width: 1464, height: 800 };
        } else if (imageType === "Hero Listing Image") {
          customSize = { width: 1500, height: 1000 };
        } else if (imageType === "A+ Lifestyle Banner") {
          customSize = { width: 1464, height: 600 };
        } else if (imageType === "A+ Product Photo") {
          customSize = { width: 2000, height: 2000 };
        }

        console.log(`[generate] [aplus:${index}] ${imageType} — calling GPT Image 2`);
        const generated = await generateAplusImage(prompt, referenceImageUrls, customSize);
        console.log(`[generate] [aplus:${index}] done — uploading to R2`);

        const ext = generated.mimeType.split("/")[1] || "png";
        const storageKey = `${storagePrefix}/aplus-${index}.${ext}`;
        const body = Buffer.from(generated.base64, "base64");
        const url = await uploadToR2(storageKey, body, generated.mimeType);

        return {
          type: imageType,
          mimeType: generated.mimeType,
          data: generated.base64,
          storageKey,
          url,
          isAplus: true,
          width: customSize?.width ?? 1024,
          height: customSize?.height ?? 1024,
        };
      });
      images = images.concat(aplusImages);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[generate] FAILED:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Charge credits
  const chargeDesc = `${basicTypes.length} basic @ ${IMAGE_COST.basic} + ${aplusTypes.length} A+ @ ${IMAGE_COST.aplus}`;
  const chargeResult = await chargeUserCredits(
    userId,
    totalCost,
    `Image generation: ${chargeDesc}`,
    generationId
  );

  // Save to MongoDB
  let id: string | null = null;
  try {
    id = await createGeneration({
      userId,
      productName: brief.productName,
      category: brief.category,
      marketplaces: brief.marketplaces || [],
      background: brief.background,
      images,
    });
  } catch (err) {
    console.error("[generate] MongoDB save error:", err);
  }

  return NextResponse.json({
    id,
    images,
    generationId,
    creditsUsed: totalCost,
    newBalance: chargeResult.newBalance ?? balance,
  });
}
