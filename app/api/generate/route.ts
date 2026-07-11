import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateProductImage, type ReferenceImage } from "@/lib/gemini";
import { buildImagePrompt, type GenerationBrief } from "@/lib/prompts";
import { createGeneration } from "@/lib/generations";

const MAX_REFERENCE_PHOTOS = 4;
const MAX_IMAGE_TYPES = 8;
const CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

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
    return NextResponse.json({ error: "Brief data could not be parsed." }, { status: 400 });
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

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Image generation is not configured. Add GEMINI_API_KEY to the server environment." },
      { status: 503 }
    );
  }

  let images: Array<{ type: string; mimeType: string; data: string }>;

  try {
    images = await mapWithConcurrency(imageTypes, CONCURRENCY, async (imageType) => {
      const prompt = buildImagePrompt(brief, imageType);
      const generated = await generateProductImage(prompt, referenceImages);
      return { type: imageType, mimeType: generated.mimeType, data: generated.base64 };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const id = await createGeneration({
    userId: session.user.id,
    productName: brief.productName,
    category: brief.category,
    marketplaces: brief.marketplaces || [],
    background: brief.background,
    images
  });

  return NextResponse.json({ id });
}
