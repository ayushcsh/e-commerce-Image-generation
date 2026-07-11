export type GenerationBrief = {
  productName: string;
  category: string;
  brandName: string;
  sku: string;
  background: string;
  customBackgroundColor: string;
  customMarketplace: string;
  material: string;
  dimensions: string;
  weight: string;
  fontStyle: string;
  aiStyle: string;
  textOnImage: string;
  language: string;
  imageFormat: string;
  resolution: string;
  description: string;
  targetAudience: string;
  sellingPrice: string;
  mrp: string;
  discountPercent: string;
  specialOffers: string;
  warranty: string;
  countryOfOrigin: string;
  packageContents: string;
  customPrompt: string;
  marketplaces: string[];
  imageTypes: string[];
  keyFeatures: string[];
  productColors: string[];
  brandColors: string[];
};

const BACKGROUND_INSTRUCTIONS: Record<string, string> = {
  "Pure White": "Place the product on a pure white (#FFFFFF) seamless studio background with soft, even lighting and a subtle contact shadow.",
  Transparent: "Isolate the product cleanly against a transparent background with no background elements, lit like a studio cutout.",
  Lifestyle: "Place the product in a realistic, tasteful lifestyle setting relevant to how it is actually used.",
  Gradient: "Use a smooth, soft-color gradient background that complements the product's own colors."
};

const TYPE_INSTRUCTIONS: Record<string, string> = {
  "Main Listing Image": "This is the primary marketplace listing hero shot: center the product, fill most of the frame, no text overlays or props.",
  Infographic: "Create an infographic-style image: show the product with clean callout lines pointing to 3-4 key features, each labeled with a short caption.",
  "Feature Highlight": "Create a close-up feature highlight image emphasizing one standout detail of the product, with a short bold caption.",
  "Lifestyle Image": "Show the product naturally in use within a realistic lifestyle scene that matches its category.",
  "Comparison Image": "Create a simple side-by-side comparison layout showing this product against a generic alternative, with a short labeled callout on why this product stands out.",
  "Size Guide": "Create a size/scale reference image showing the product next to a common everyday object for scale, with dimension callouts.",
  "Packaging Showcase": "Show the product together with attractive retail packaging or a branded box.",
  "Premium Banner": "Create a wide, premium banner-style composition with dramatic lighting, suitable for an ad or storefront hero banner."
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
  Minimal: "minimal, clean aesthetic with generous negative space",
  Premium: "premium, upscale aesthetic",
  Luxury: "luxury, high-end editorial aesthetic",
  Modern: "modern, sleek aesthetic",
  Colorful: "vibrant, colorful, energetic aesthetic",
  Professional: "professional, polished catalog aesthetic"
};

const TEXT_INSTRUCTIONS: Record<string, string> = {
  "No Text": "Do not include any text, watermark, or logo overlays in the image.",
  "Minimal Text": "Include minimal, tasteful text only if the image type calls for a short caption.",
  "Feature Highlights": "Include short, clean text callouts labeling the key features shown.",
  Promotional: "Include a short, tasteful promotional text overlay such as a small badge or one-line tagline."
};

export function buildImagePrompt(brief: GenerationBrief, imageType: string): string {
  const segments: string[] = [];

  segments.push(
    `You are an expert ecommerce product photographer. Using the attached reference photo(s) of "${brief.productName}"` +
      `${brief.category ? ` (category: ${brief.category})` : ""}, generate one photorealistic, high-resolution product image.`
  );

  segments.push(
    "Keep the product's real shape, proportions, colors, and design faithful to the reference photo(s) — do not invent a different product."
  );

  const details = [
    brief.brandName && `Brand: ${brief.brandName}.`,
    brief.productColors.length > 0 && `Product color(s): ${brief.productColors.join(", ")}.`,
    brief.material && `Material: ${brief.material}.`,
    brief.keyFeatures.length > 0 && `Key features to visually emphasize: ${brief.keyFeatures.join(", ")}.`
  ]
    .filter(Boolean)
    .join(" ");

  if (details) {
    segments.push(details);
  }

  segments.push(
    brief.background === "Custom Color"
      ? `Use a solid background in the color ${brief.customBackgroundColor}.`
      : BACKGROUND_INSTRUCTIONS[brief.background] || "Use a clean studio background."
  );

  segments.push(TYPE_INSTRUCTIONS[imageType] || "Create a clean, marketplace-ready product image.");

  segments.push(`Overall style: ${STYLE_INSTRUCTIONS[brief.aiStyle] || "clean, professional aesthetic"}.`);

  segments.push(TEXT_INSTRUCTIONS[brief.textOnImage] || TEXT_INSTRUCTIONS["No Text"]);

  if (brief.marketplaces.length > 0) {
    const marketplaceNames = brief.marketplaces.map((name) =>
      name === "Custom" && brief.customMarketplace ? brief.customMarketplace : name
    );
    segments.push(`This image is intended for: ${marketplaceNames.join(", ")}.`);
  }

  if (brief.customPrompt) {
    segments.push(`Additional direction from the seller: ${brief.customPrompt}`);
  }

  return segments.join(" ");
}
