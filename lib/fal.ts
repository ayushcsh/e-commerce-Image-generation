import { fal } from "@fal-ai/client";
import sharp from "sharp";

export type ReferenceImage = {
  base64: string;
  mimeType: string;
};

export type GeneratedImage = {
  base64: string;
  mimeType: string;
};

let configured = false;

function ensureConfigured() {
  if (configured) {
    return;
  }

  const credentials = process.env.FAL_KEY;

  if (!credentials) {
    throw new Error("Missing FAL_KEY environment variable.");
  }

  fal.config({ credentials });
  configured = true;
}

export async function uploadReferenceImages(referenceImages: ReferenceImage[]): Promise<string[]> {
  ensureConfigured();

  return Promise.all(
    referenceImages.map((image) => {
      const buffer = Buffer.from(image.base64, "base64");
      return fal.storage.upload(new Blob([buffer], { type: image.mimeType }));
    })
  );
}

type FalImageEditResult = {
  images?: Array<{ url: string; content_type?: string }>;
};

export type ImageSizeOption = {
  width?: number;
  height?: number;
};

export async function generateProductImage(
  prompt: string,
  referenceImageUrls: string[],
  customSize?: ImageSizeOption,
  modelOverride?: string
): Promise<GeneratedImage> {
  ensureConfigured();

  const model = modelOverride || process.env.FAL_IMAGE_MODEL || "fal-ai/nano-banana/edit";

  const imageSize = customSize?.width && customSize?.height
    ? { width: customSize.width, height: customSize.height }
    : undefined;

  const { data } = await fal.subscribe(model, {
    input: {
      prompt,
      image_urls: referenceImageUrls,
      num_images: 1,
      ...(imageSize ? { image_size: imageSize } : {})
    },
    logs: false
  });

  const output = data as FalImageEditResult;
  const image = output.images?.[0];

  if (!image?.url) {
    throw new Error("fal.ai did not return an image.");
  }

  const response = await fetch(image.url);

  if (!response.ok) {
    throw new Error("Failed to download the generated image from fal.ai.");
  }

  return {
    base64: Buffer.from(await response.arrayBuffer()).toString("base64"),
    mimeType: image.content_type || "image/png"
  };
}

// GPT Image 2 requires image_size (as a width/height object) to be a multiple
// of 16 per side, have an aspect ratio no steeper than 3:1, and total pixels
// between 655,360 and 8,294,400 — Amazon's A+ content dimensions violate all
// three for most slot types. We request the closest compliant size and crop
// the result down to the exact target afterward.
const GPT_SIZE_MULTIPLE = 16;
const GPT_MIN_AREA = 655360;
const GPT_MAX_AREA = 8294400;
const GPT_MAX_ASPECT_RATIO = 3;

function roundToMultiple(value: number, multiple: number): number {
  return Math.max(multiple, Math.round(value / multiple) * multiple);
}

function floorToMultiple(value: number, multiple: number): number {
  return Math.max(multiple, Math.floor(value / multiple) * multiple);
}

function ceilToMultiple(value: number, multiple: number): number {
  return Math.max(multiple, Math.ceil(value / multiple) * multiple);
}

function computeGptCompatibleSize(targetWidth: number, targetHeight: number): { width: number; height: number } {
  const ratio = Math.min(GPT_MAX_ASPECT_RATIO, Math.max(1 / GPT_MAX_ASPECT_RATIO, targetWidth / targetHeight));
  const targetArea = Math.min(GPT_MAX_AREA, Math.max(GPT_MIN_AREA, targetWidth * targetHeight));

  let width = roundToMultiple(Math.sqrt(targetArea * ratio), GPT_SIZE_MULTIPLE);
  let height = roundToMultiple(Math.sqrt(targetArea / ratio), GPT_SIZE_MULTIPLE);

  // Rounding to a multiple of 16 can nudge the area back out of bounds — bias
  // the correction (ceil for the floor, floor for the ceiling) so it doesn't
  // re-violate the bound it's fixing.
  const area = width * height;
  if (area < GPT_MIN_AREA) {
    const scale = Math.sqrt(GPT_MIN_AREA / area);
    width = ceilToMultiple(width * scale, GPT_SIZE_MULTIPLE);
    height = ceilToMultiple(height * scale, GPT_SIZE_MULTIPLE);
  } else if (area > GPT_MAX_AREA) {
    const scale = Math.sqrt(GPT_MAX_AREA / area);
    width = floorToMultiple(width * scale, GPT_SIZE_MULTIPLE);
    height = floorToMultiple(height * scale, GPT_SIZE_MULTIPLE);
  }

  if (width / height > GPT_MAX_ASPECT_RATIO) {
    width = floorToMultiple(height * GPT_MAX_ASPECT_RATIO, GPT_SIZE_MULTIPLE);
  } else if (height / width > GPT_MAX_ASPECT_RATIO) {
    height = floorToMultiple(width * GPT_MAX_ASPECT_RATIO, GPT_SIZE_MULTIPLE);
  }

  return { width, height };
}

// GPT Image 2 — premium A+ listing images
export async function generateAplusImage(
  prompt: string,
  referenceImageUrls: string[],
  targetSize?: ImageSizeOption
): Promise<GeneratedImage> {
  ensureConfigured();

  const model = "fal-ai/gpt-image-2/edit";

  const requestSize = targetSize?.width && targetSize?.height
    ? computeGptCompatibleSize(targetSize.width, targetSize.height)
    : undefined;

  console.log(
    `[fal-ai] Calling GPT Image 2 model — target: ${targetSize?.width ?? "auto"}x${targetSize?.height ?? "auto"}, request: ${requestSize ? `${requestSize.width}x${requestSize.height}` : "auto"}`
  );

  const { data } = await fal.subscribe(model, {
    input: {
      prompt,
      image_urls: referenceImageUrls,
      num_images: 1,
      ...(requestSize ? { image_size: requestSize } : {})
    },
    logs: false
  });

  console.log(`[fal-ai] GPT Image 2 response keys: ${Object.keys(data ?? {})}`);

  const output = data as FalImageEditResult;
  const image = output.images?.[0];

  if (!image?.url) {
    throw new Error("GPT Image 2 did not return an image.");
  }

  const response = await fetch(image.url);

  if (!response.ok) {
    throw new Error("Failed to download the GPT Image 2 output from fal.ai.");
  }

  const rawBuffer = Buffer.from(await response.arrayBuffer());

  // Crop/resize down to the exact Amazon-spec dimensions the caller asked for.
  if (targetSize?.width && targetSize?.height) {
    const resized = await sharp(rawBuffer)
      .resize(targetSize.width, targetSize.height, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    return {
      base64: resized.toString("base64"),
      mimeType: "image/png"
    };
  }

  return {
    base64: rawBuffer.toString("base64"),
    mimeType: image.content_type || "image/png"
  };
}
