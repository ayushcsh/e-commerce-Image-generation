export type GenerationBrief = {
  productName: string;
  category: string;
  brandName: string;
  sku: string;
  background: string;
  customBackgroundColor: string;
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
  variantSets?: number;
  quantityPerSet?: string;
  customWidth?: number;
  customHeight?: number;
};

const BACKGROUND_INSTRUCTIONS: Record<string, string> = {
  "Pure White": "Place the product on a pure white (#FFFFFF) seamless studio background with soft, even lighting and a subtle contact shadow.",
  Transparent: "Isolate the product cleanly against a transparent background with no background elements, lit like a studio cutout.",
  Lifestyle: "Place the product in a realistic, tasteful lifestyle setting relevant to how it is actually used.",
  Gradient: "Use a smooth, soft-color gradient background that complements the product's own colors."
};

// Appended once to every generated prompt so the seller's free-text direction
// always reaches the model, regardless of image type.
function appendCustomDirection(prompt: string, customPrompt: string): string {
  if (!customPrompt?.trim()) return prompt;
  return `${prompt}\nSELLER'S CUSTOM DIRECTION (apply on top of everything above, without breaking the required composition/aspect ratio rules): ${customPrompt.trim()}`;
}

// ── Dedicated per-type prompts for each basic image type ──────────────────────
// Each image gets its OWN complete prompt — no loops, no shared templates.

function buildBasicImagePromptCore(
  brief: GenerationBrief,
  imageType: string
): string {
  // ── 1. Main Product (White Background) ──────────────────────────────────────
  if (imageType === "Main Product (White Background)") {
    return `Professional ecommerce main product photography. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
CRITICAL COMPOSITION: Place the product dead-center of the frame, perfectly upright, with maximum visual weight. The product must occupy at least 70% of the frame height and be the undeniable hero. The background is a PURE seamless WHITE (#FFFFFF) studio sweep — absolutely no shadows on the backdrop, no props, no distracting elements. The product casts only a barely-perceptible soft contact shadow directly beneath it.
LIGHTING: Professional dual-light studio setup. Key light from upper-left at 45°, fill from lower-right, rim light from directly behind to create a crisp white edge highlight separating product from background. Vivid, true-to-life product colors with no color shift. High contrast, sharp product edges, no grain.
SCALE / QUANTITY: ${brief.quantityPerSet && parseInt(brief.quantityPerSet) > 1 ? `This listing shows ${brief.quantityPerSet} identical pieces — display all pieces together in a neat, symmetrical arrangement (e.g. side-by-side, stacked, or fanned out). Every piece must be identical in color and design.` : "Show a single product unit, clean and pristine."}
${brief.keyFeatures.length > 0 ? `KEY FEATURES TO HIGHLIGHT: ${brief.keyFeatures.join("; ")}.` : ""}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
${brief.material ? `Material: ${brief.material}.` : ""}
${brief.targetAudience ? `Target audience: ${brief.targetAudience}.` : ""}
FINAL QUALITY: Magazine-cover product shot. This is the #1 image buyers will see — it must look expensive, professional, and trustworthy. Aspect ratio 1:1, output 1280x1280 pixels. NO text, NO watermark, NO logo overlays.`;
  }

  // ── 2. Front/Side Angle ─────────────────────────────────────────────────────
  if (imageType === "Front/Side Angle") {
    return `Professional ecommerce product angle shot. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Shoot the product from a 30–45 degree side-front angle, showing both the front face AND one side face clearly. The product should be positioned so the viewer can understand its depth and profile in a single glance. Slight perspective that conveys the product's 3D form. Background: PURE WHITE seamless studio sweep.
LIGHTING: Three-point studio lighting — key light from upper-front-left, strong fill from the opposite side, and a hair light from behind-top to separate product from background with a clean rim highlight. Accentuate the product's contours and edges. Colors must be vivid and true to life. High clarity, sharp edges.
SCALE / QUANTITY: ${brief.quantityPerSet && parseInt(brief.quantityPerSet) > 1 ? `Display all ${brief.quantityPerSet} pieces arranged to best show the side-front perspective — e.g., slightly offset row so each piece's profile is visible.` : "Show a single product unit."}
${brief.keyFeatures.length > 0 ? `FEATURES TO SHOW: ${brief.keyFeatures.join("; ")}.` : ""}
${brief.material ? `Material: ${brief.material}. Show the material quality in the visible surfaces.` : ""}
${brief.productColors.length > 0 ? `Color(s): ${brief.productColors.join(", ")}.` : ""}
ASPECT: Slightly landscape (4:3 or 3:2). Output 1280x960 pixels. NO text, NO watermark, NO logo overlays.`;
  }

  // ── 3. Key Features Infographic ──────────────────────────────────────────────
  if (imageType === "Key Features Infographic") {
    return `Premium product infographic for marketplace listing. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Split the image into clearly defined zones. The LEFT 55% shows the product as a polished hero shot — clean, bright, centered with a pure white background. The RIGHT 45% is an elegant infographic panel with ${brief.keyFeatures.length > 0 ? brief.keyFeatures.length + " key feature callouts" : "3–4 key feature callouts"} displayed as clean icon-style badges or short bullet points.
EACH CALLOUT: Use a clean sans-serif or modern serif font. Each feature gets: a bold short headline (max 4 words), a short descriptive sub-line (max 10 words). Arrange vertically with equal spacing. Use the product's brand colors${brief.brandColors.length > 0 ? ` (${brief.brandColors.join(", ")})` : ""} for accent elements. Keep the infographic panel clean, not cluttered.
PRODUCT: Place the product prominently — shown from its most recognizable angle. Bright studio lighting, pure white background behind the product. The product must be the focal point; the infographic supports it.
${brief.keyFeatures.length > 0 ? `FEATURES TO HIGHLIGHT:\n${brief.keyFeatures.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}` : "FEATURES: Highlight the product's most compelling selling points with short punchy labels."}
${brief.material ? `MATERIAL/CONSTRUCTION note: ${brief.material}.` : ""}
${brief.targetAudience ? `Target audience: ${brief.targetAudience}.` : ""}
STYLE: Clean, professional, editorial. Think high-end product catalog. Aspect ratio 1:1 (1280x1280). NO watermark.`;
  }

  // ── 4. Dimensions ────────────────────────────────────────────────────────────
  if (imageType === "Dimensions") {
    return `Professional product dimension / size reference image. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Show the product in its most dimensionally readable orientation — flat on a surface, viewed from a clear 90-degree top-down or straight-front angle. The product must be photographed against a PURE WHITE studio background. Place a familiar, universally recognizable everyday object next to the product for INSTANT size context — e.g., a standard credit card, ballpoint pen, smartphone, hardcover book, AA battery, or human hand.
SIZE REFERENCE OBJECTS: Pick whichever object communicates scale best for this specific product category.
DIMENSION CALLOUTS: Add clean, minimal dimension callout lines drawn on the image itself (like technical product drawings). Each line should show a dimension value in mm or cm (${brief.dimensions || "use measurements visible from reference"}), with a short label. Callouts should use a consistent modern font, thin clean lines, and not clutter the image.
PRODUCT DETAILS: ${brief.material ? `Material: ${brief.material}.` : ""} ${brief.weight ? `Weight: ${brief.weight}.` : ""}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
LIGHTING: Bright, even studio lighting with zero harsh shadows. The product and scale reference must be crystal clear. High resolution, sharp edges.
ASPECT: Landscape (3:2), output 1280x854 pixels. NO text except dimension callouts. NO watermark.`;
  }

  // ── 5. Product in Use (Lifestyle) ───────────────────────────────────────────
  if (imageType === "Product in Use (Lifestyle)") {
    return `Authentic lifestyle product photography. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
SCENE: Place the ${brief.productName} naturally into a realistic, aspirational ${brief.targetAudience || "everyday"} setting where it is genuinely used. The product must feel AT HOME in this environment — not staged, not awkward. Think editorial magazine photography, not stock photo fake.
ENVIRONMENT: A realistic interior space — e.g., a desk, kitchen counter, living room, wardrobe, workshop bench, gym, or outdoor setting appropriate to the product. Soft natural light streaming in from a window (golden hour warmth preferred), or warm ambient indoor lighting. Depth of field: product in sharp focus, background softly blurred.
PRODUCT: Show the product actively being used or in its natural resting position mid-use. ${brief.keyFeatures.length > 0 ? `Highlight these in-use: ${brief.keyFeatures.slice(0, 2).join(", ")}.` : ""} The product must look inviting, desirable, and aspirational. Colors vivid and true.
${brief.material ? `Material: ${brief.material} — show the material quality in context.` : ""}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
${brief.targetAudience ? `Target audience mood: ${brief.targetAudience}.` : ""}
QUALITY: Editorial catalog photography. Aspect ratio 4:3 or 3:2, output 1280x960 pixels. NO watermark, NO logo text overlay.`;
  }

  // ── 6. Close-up / Material Quality ───────────────────────────────────────────
  if (imageType === "Close-up / Material Quality") {
    return `Macro close-up product photography emphasizing material, texture, and build quality. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Fill the frame with a TIGHT close-up of the most important surface detail — the material texture, finish, stitching, seams, surface coating, logo detail, button quality, or any distinctive physical characteristic that communicates premium craftsmanship.
CAMERA: Macro lens perspective, shallow depth of field with the most important area razor-sharp and the edges softly blurred. This creates visual depth and makes the material feel tactile and real.
SUBJECT: Focus on the ${brief.material ? `material quality: ${brief.material}` : "surface texture and build quality"} of the product. Every detail should be clearly visible — surface grain, weave pattern, leather texture, metal brushing, plastic finish quality, coating uniformity, stitch regularity, logo application quality, or panel gap precision. Show the product is worth its price point.
LIGHTING: Carefully controlled lighting to reveal surface qualities. Slight side-lighting to create texture contrast on surfaces. For shiny/metallic surfaces, use a single diffused light source to create elegant specular highlights. For matte surfaces, soft frontal lighting to show color and texture without glare.
${brief.productColors.length > 0 ? `Color(s): ${brief.productColors.join(", ")} — show how the color looks in the material.` : ""}
QUALITY STANDARD: Luxury product catalog macro shot. Think Apple product close-up or premium watchmaker photography. Aspect ratio 1:1, output 1280x1280 pixels. NO text, NO watermark, NO logo overlays.`;
  }

  // ── 7. What's in the Box ─────────────────────────────────────────────────────
  if (imageType === "What's in the Box") {
    const pkgItems = brief.packageContents?.trim() || (brief.keyFeatures.length > 0 ? brief.keyFeatures.join(", ") : "all accessories and components");
    return `Professional "What's in the Box" flat-lay product photography. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Overhead (top-down) camera view. Arrange ALL items included in the package in a clean, symmetrical, visually balanced flat-lay on a pure white or very light neutral surface. Every component must be clearly visible and identifiable.
ITEMS TO SHOW: The main product unit (positioned at the center of the composition), plus all accessories and included items arranged around it. Standard inclusions: user manual/warranty card, any cables, chargers, mounts, tools, or spare parts. Use this package contents as reference: ${pkgItems}.
LAYOUT: Group related items together. Keep consistent spacing between items. The product at center should be slightly larger or more prominent. Accessories arranged in a logical radial or grid pattern around it. Everything must be perfectly flat and in focus.
${brief.brandName ? `BRANDING: A subtle, tasteful ${brief.brandName} logo or label may appear on one or two items — keep branding minimal and elegant.` : ""}
LIGHTING: Bright, even overhead studio lighting. No shadows. Crisp, clean, product-catalog quality. Colors vivid and true.
ASPECT: Landscape (3:2) or square, output 1280x854 pixels. NO watermark. The image should answer the buyer's question: "What exactly am I getting?"`;
  }

  // ── 8. Comparison / Benefits ────────────────────────────────────────────────
  if (imageType === "Comparison / Benefits") {
    return `Professional marketplace comparison / benefits image. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Two-panel horizontal layout. LEFT SIDE (40% width): A generic, lower-quality version of a similar product shown from the same angle with plain white background and flat, unremarkable presentation — this is the "before" / competitor. RIGHT SIDE (60% width): The ${brief.productName} shown as a polished, premium hero product shot on pure white — this is the "after" / featured product.
The comparison must be VISUAL and IMMEDIATE — the buyer understands the difference without reading a single word.
VISUAL ELEMENTS for featured product side:
  ${brief.keyFeatures.length > 0 ? `- ${brief.keyFeatures.slice(0, 3).map(f => `"${f}"`).join(", ")} as small icon badges or checkmark callouts` : "- 2-3 small benefit checkmark badges"}
  ${brief.material ? `- Material advantage: ${brief.material}` : ""}
  ${brief.productColors.length > 0 ? `- Vivid color(s): ${brief.productColors.join(", ")} shown in the product` : ""}
GENERIC PRODUCT characteristics (subtle, visual): flat lighting, plain design, generic materials visible, dull color. The featured product should look DRAMATICALLY more desirable.
LIGHTING: Both sides: clean white background, professional studio lighting. Featured product has brighter, more dynamic lighting with rim light.
ASPECT: Landscape 3:2, output 1280x854 pixels. Text callouts minimal — only short benefit labels. NO exaggerated claims text. NO watermark.`;
  }

  // ── 9. Brand Story / Warranty ────────────────────────────────────────────────
  if (imageType === "Brand Story / Warranty") {
    return `Premium brand story / warranty trust image. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Elegant editorial layout. The product is the emotional anchor — shown in a warm, lifestyle context or as a lone hero on a beautifully lit surface. Behind or beside the product, include a subtle branded element (logo mark or brand name in elegant small typography).
TRUST ELEMENTS to include (shown as clean graphic badges or elegant text callouts):
  ${brief.warranty ? `✓ ${brief.warranty}` : "✓ Manufacturer Warranty"}
  ${brief.countryOfOrigin ? `Made in ${brief.countryOfOrigin}` : ""}
  ${brief.brandName ? `Brand: ${brief.brandName}` : ""}
  ${brief.specialOffers ? `Offer: ${brief.specialOffers}` : ""}
STYLE: Warm, trustworthy, premium. Think premium brand lookbook photography — the kind of image that makes a buyer feel confident and proud to own this product. Use warm tones, soft shadows, and editorial composition.
ATMOSPHERE: ${brief.targetAudience ? `${brief.targetAudience}` : "Professional and aspirational"} mood. Warm lighting. The product feels like it belongs to a quality-conscious brand. Elegant but not cold.
TYPOGRAPHY: Brand name and warranty info in clean, premium font — minimal text, maximum elegance. Text should feel like a luxury catalog, not a discount ad.
ASPECT: Portrait (2:3) or square, output 960x1280 or 1280x1280 pixels. NO watermarks.`;
  }

  // ── 10. Flipkart: Main Image (Hero) ──────────────────────────────────────────
  // Flipkart gallery slot 1 — pure white, product only, 1024x1024
  if (imageType === "Main Image (Hero)") {
    return `Professional Flipkart marketplace hero product photography. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
CRITICAL COMPOSITION: Center the product perfectly in the frame, upright, occupying at least 75% of the frame height — this is the primary gallery thumbnail buyers see first. Background: PURE WHITE (#FFFFFF), completely seamless, no gradient, no props, no shadow gradients — only a faint, barely-visible contact shadow directly under the product. NO watermark, NO logo overlay, NO border, NO promotional text anywhere in the frame — Flipkart's main image policy forbids all of these.
LIGHTING: Even, shadow-free studio lighting from both sides with a subtle top-down key light. Colors must be accurate and vivid, no color cast.
SCALE / QUANTITY: ${brief.quantityPerSet && parseInt(brief.quantityPerSet) > 1 ? `Show all ${brief.quantityPerSet} identical pieces arranged neatly and symmetrically.` : "Show a single product unit, pristine and centered."}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
${brief.material ? `Material: ${brief.material}.` : ""}
FINAL QUALITY: Sharp edges, no grain, true-to-life color. Aspect ratio strictly 1:1, output 1024x1024 pixels (this must read clearly even zoomed to 2048x2048). NO text of any kind.`;
  }

  // ── 11. Flipkart: Front/Alternate Angle ──────────────────────────────────────
  if (imageType === "Front/Alternate Angle") {
    return `Professional Flipkart gallery product photography — alternate angle. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Shoot the product from a different front-facing perspective than a straight-on hero shot — a gentle 15–25 degree rotation that still reads as a "front" view but gives the buyer a second reference point. Product centered, occupying most of the frame. Background: PURE WHITE seamless, no props, no shadow gradients besides a soft contact shadow.
LIGHTING: Clean, even studio lighting, no harsh highlights, accurate color reproduction.
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
${brief.keyFeatures.length > 0 ? `Subtly frame the shot so this feature is visible: ${brief.keyFeatures[0]}.` : ""}
ASPECT: Square 1:1, output 1024x1024 pixels. NO text, NO watermark, NO props.`;
  }

  // ── 12. Flipkart: Side View ───────────────────────────────────────────────────
  if (imageType === "Side View") {
    return `Professional Flipkart gallery product photography — side view. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Shoot the product from a direct 90-degree side profile so the buyer can clearly judge its thickness, depth, and side-profile design. The product must be perfectly centered and fully visible in profile — no angling that hides the side silhouette. Background: PURE WHITE seamless studio.
LIGHTING: Side-emphasis lighting — a key light positioned to skim across the profile and reveal contour and thickness, with a soft fill to avoid harsh shadows on the far side.
${brief.material ? `Material: ${brief.material} — the side profile should reveal build/material quality.` : ""}
${brief.dimensions ? `Dimensions reference (for accurate proportions): ${brief.dimensions}.` : ""}
ASPECT: Square 1:1, output 1024x1024 pixels. NO text, NO watermark.`;
  }

  // ── 13. Flipkart: Back View ───────────────────────────────────────────────────
  if (imageType === "Back View") {
    return `Professional Flipkart gallery product photography — rear/back view. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Rotate the product 180 degrees from its front-facing hero shot to show the complete back surface — rear panel, ports, straps, closures, labels, or any rear-mounted details relevant to this product category. Centered, filling most of the frame. Background: PURE WHITE seamless studio, no props.
LIGHTING: Even studio lighting that clearly reveals rear surface details without glare or deep shadow pockets.
${brief.material ? `Material: ${brief.material}.` : ""}
${brief.keyFeatures.length > 0 ? `If any of these features live on the back of the product, make sure they're visible: ${brief.keyFeatures.join(", ")}.` : ""}
ASPECT: Square 1:1, output 1024x1024 pixels. NO text, NO watermark.`;
  }

  // ── 14. Flipkart: Close-up / Macro ────────────────────────────────────────────
  if (imageType === "Close-up / Macro") {
    return `Macro close-up photography for Flipkart gallery — material and texture detail. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Extreme close-up filling the entire frame with the product's most tactile, quality-communicating surface — stitching, weave, grain, coating, seams, or finish. Shallow depth of field with the focal area razor-sharp and edges softly falling off.
SUBJECT: ${brief.material ? `Material: ${brief.material} — show its texture and construction quality at macro scale.` : "Surface texture, stitching, and build quality."}
LIGHTING: Controlled directional lighting to bring out texture contrast — side-raking light for fabric/grain, diffused single-source for metallic/glossy surfaces.
${brief.productColors.length > 0 ? `Color(s) as they appear in this material: ${brief.productColors.join(", ")}.` : ""}
ASPECT: Square 1:1, output 1024x1024 pixels. NO text, NO watermark.`;
  }

  // ── 15. Flipkart: Lifestyle Image ─────────────────────────────────────────────
  if (imageType === "Lifestyle Image") {
    return `Authentic lifestyle photography for Flipkart gallery. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
SCENE: Place the product naturally into a realistic ${brief.targetAudience || "everyday"} setting where it is genuinely being used or displayed in context — not a studio cutout. The product remains the clear focal point even inside a real environment.
ENVIRONMENT: Soft natural or warm ambient lighting, shallow depth of field with the product sharp and the background gently blurred. Editorial, aspirational, but believable — not an obvious stock photo.
${brief.keyFeatures.length > 0 ? `Show the product being used in a way that implies: ${brief.keyFeatures.slice(0, 2).join(", ")}.` : ""}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
ASPECT: Square 1:1, output 1024x1024 pixels. NO text, NO watermark.`;
  }

  // ── 16. Flipkart: Dimension Image ─────────────────────────────────────────────
  if (imageType === "Dimension Image") {
    return `Professional Flipkart size/dimension reference image. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Product photographed flat or upright from a clean, dimensionally-readable angle against a PURE WHITE background. Add clean, minimal technical-drawing-style dimension callout lines directly on the image, each labeled with a measurement (${brief.dimensions || "use realistic proportions for this product category"}) in cm or mm.
STYLE: Thin, precise callout lines with a consistent modern sans-serif label font — like a spec sheet, not cluttered. ${brief.weight ? `Weight: ${brief.weight} may be noted as a small label.` : ""}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
LIGHTING: Bright, even, shadow-free studio lighting so every callout and edge is crisp.
ASPECT: Square 1:1, output 1024x1024 pixels. NO watermark. Only the dimension callout text is permitted.`;
  }

  // ── 17. Flipkart: What's Included / Packaging ─────────────────────────────────
  if (imageType === "What's Included / Packaging") {
    const pkgItems = brief.packageContents?.trim() || (brief.keyFeatures.length > 0 ? brief.keyFeatures.join(", ") : "all accessories and components");
    return `Professional "What's Included" flat-lay photography for Flipkart gallery. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Overhead top-down flat-lay on a clean white or light neutral surface. The main product sits at the visual center, slightly larger than surrounding items, with all included accessories arranged neatly and symmetrically around it.
ITEMS TO SHOW: ${pkgItems}. Include standard inclusions if applicable — manual, cables, chargers, spare parts.
LIGHTING: Bright, even overhead lighting, no shadows, crisp product-catalog quality.
ASPECT: Square 1:1, output 1024x1024 pixels. NO watermark. The buyer should understand exactly what ships in the box.`;
  }

  // ── 18. Meesho: Hero Image ────────────────────────────────────────────────────
  // Meesho gallery slot 1 — white/light background, product centered, 1000x1000
  if (imageType === "Meesho Hero Image") {
    return `Professional Meesho marketplace hero product photography. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
CRITICAL COMPOSITION: Center the product perfectly in the frame, upright, occupying most of the frame height — this is the primary gallery thumbnail. Background: pure WHITE or very light neutral, completely seamless, no gradient, no props. Only a faint contact shadow directly under the product. NO text, NO logo overlay, NO watermark, NO border, NO collage — Meesho's main image policy forbids all of these.
LIGHTING: Even, shadow-free studio lighting. Colors must be accurate and vivid, no color cast.
SCALE / QUANTITY: ${brief.quantityPerSet && parseInt(brief.quantityPerSet) > 1 ? `Show all ${brief.quantityPerSet} identical pieces arranged neatly and symmetrically.` : "Show a single product unit, pristine and centered."}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
${brief.material ? `Material: ${brief.material}.` : ""}
FINAL QUALITY: Sharp edges, no grain, true-to-life color. Aspect ratio strictly 1:1, output 1000x1000 pixels. NO text of any kind.`;
  }

  // ── 19. Meesho: Front View ────────────────────────────────────────────────────
  if (imageType === "Meesho Front View") {
    return `Professional Meesho gallery product photography — front view / alternate angle. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Shoot the product from a clean front-facing angle, slightly different from the hero shot, so the buyer gets a second clear reference. Product centered, filling most of the frame. Background: pure white or very light neutral, seamless, no props.
LIGHTING: Clean, even studio lighting, accurate color reproduction.
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
ASPECT: Square 1:1, output 1000x1000 pixels. NO text, NO watermark.`;
  }

  // ── 20. Meesho: Back View ─────────────────────────────────────────────────────
  if (imageType === "Meesho Back View") {
    return `Professional Meesho gallery product photography — rear/back view. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Rotate the product 180 degrees from the front hero shot to clearly show the back — rear panel, closures, tags, or any rear details relevant to this product category. Centered, filling most of the frame. Background: pure white or very light neutral, no props.
LIGHTING: Even studio lighting revealing rear details without glare or deep shadows.
${brief.material ? `Material: ${brief.material}.` : ""}
ASPECT: Square 1:1, output 1000x1000 pixels. NO text, NO watermark.`;
  }

  // ── 21. Meesho: Side View ─────────────────────────────────────────────────────
  if (imageType === "Meesho Side View") {
    return `Professional Meesho gallery product photography — side profile. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Shoot the product from a direct 90-degree side profile so the buyer can judge thickness, drape, or side design. Product centered, fully visible in profile. Background: pure white or very light neutral, seamless.
LIGHTING: Side-emphasis lighting that reveals contour without harsh shadows on the far side.
${brief.material ? `Material: ${brief.material} — the side profile should reveal fit and build.` : ""}
ASPECT: Square 1:1, output 1000x1000 pixels. NO text, NO watermark.`;
  }

  // ── 22. Meesho: Close-up ──────────────────────────────────────────────────────
  if (imageType === "Meesho Close-up") {
    return `Macro close-up photography for Meesho gallery — fabric, texture, stitching, and button detail. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Extreme close-up filling the frame with the product's most quality-communicating detail — fabric weave, stitching, embroidery, print, buttons, or trims. Shallow depth of field, focal area razor-sharp.
SUBJECT: ${brief.material ? `Material: ${brief.material} — show its texture and construction quality at macro scale.` : "Fabric texture, stitching, and finish quality."}
LIGHTING: Directional lighting that brings out texture and stitch detail.
${brief.productColors.length > 0 ? `Color(s) as they appear in this material: ${brief.productColors.join(", ")}.` : ""}
ASPECT: Square 1:1, output 1000x1000 pixels. NO text, NO watermark.`;
  }

  // ── 23. Meesho: Lifestyle Image ───────────────────────────────────────────────
  if (imageType === "Meesho Lifestyle Image") {
    return `Authentic lifestyle photography for Meesho gallery. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
SCENE: Place the product naturally into a realistic, relatable ${brief.targetAudience || "everyday"} setting where it is genuinely worn or used — warm, approachable, aspirational but attainable. The product stays the clear focal point.
LIGHTING: Soft natural or warm ambient light, shallow depth of field with the product sharp and the background gently blurred.
${brief.keyFeatures.length > 0 ? `Show the product in a way that implies: ${brief.keyFeatures.slice(0, 2).join(", ")}.` : ""}
${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""}
ASPECT: Square 1:1, output 1000x1000 pixels. NO text, NO watermark.`;
  }

  // ── 24. Meesho: Size/Dimension Image ──────────────────────────────────────────
  if (imageType === "Meesho Size/Dimension Image") {
    return `Professional Meesho size/dimension reference image. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Product photographed flat or upright from a clean, dimensionally-readable angle against a pure white or very light background. Add clean, minimal callout lines with measurements (${brief.dimensions || "use realistic proportions for this product category"}) in cm/inches, OR — if this product is apparel/footwear — render a simple size chart table (S/M/L/XL or numeric sizes with corresponding measurements) laid over the bottom or side of the frame.
STYLE: Thin, precise lines and a consistent modern sans-serif label font — like a spec sheet, not cluttered.
LIGHTING: Bright, even, shadow-free studio lighting.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark. Only dimension/size-chart text is permitted.`;
  }

  // ── 25. Meesho: Package/What's Included ───────────────────────────────────────
  if (imageType === "Meesho Package/What's Included") {
    const pkgItems = brief.packageContents?.trim() || (brief.keyFeatures.length > 0 ? brief.keyFeatures.join(", ") : "all accessories and components");
    return `Professional "What's Included" flat-lay photography for Meesho gallery. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Overhead top-down flat-lay on a clean white or light neutral surface. The main product sits at the visual center, slightly larger than surrounding items, with all included accessories arranged neatly and symmetrically around it.
ITEMS TO SHOW: ${pkgItems}.
LIGHTING: Bright, even overhead lighting, no shadows, crisp catalog quality.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 26. Meesho: Feature Highlights (infographic) ──────────────────────────────
  if (imageType === "Meesho Feature Highlights") {
    const features = brief.keyFeatures.length > 0 ? brief.keyFeatures : ["Premium Quality", "Comfortable Fit", "Everyday Value"];
    return `Meesho gallery infographic — feature highlights. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module. Product shown as a clean hero shot in the upper or left portion, with ${features.length} short feature callouts arranged as simple icon badges or checkmark bullets around it — plain, easy to read at a glance, value-conscious buyer friendly (not overly designed).
FEATURES:\n${features.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}
STYLE: Clean, friendly, simple sans-serif labels. Bright, approachable color accents.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 27. Meesho: Material Details (infographic) ────────────────────────────────
  if (imageType === "Meesho Material Details") {
    return `Meesho gallery infographic — material details. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module combining a close-up shot of the product's material/finish with a short, plain-language label block describing the material.
MATERIAL: ${brief.material ? brief.material : "the product's primary material and finish"}.
STYLE: Simple, legible sans-serif labels, minimal clutter, friendly tone.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 28. Meesho: Fabric Composition (infographic) ──────────────────────────────
  if (imageType === "Meesho Fabric Composition") {
    return `Meesho gallery infographic — fabric composition. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module. Product or fabric swatch close-up on one side, with a simple composition breakdown on the other side (e.g., percentage-style bars or a short list — "100% Cotton", "Cotton Blend", etc., inferred from: ${brief.material || "the product's material"}).
STYLE: Clean, plain, easy-to-scan layout — a quick-glance fabric label, not a dense chart.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 29. Meesho: Size Chart (infographic) ──────────────────────────────────────
  if (imageType === "Meesho Size Chart") {
    return `Meesho gallery infographic — size chart. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module rendered as a clean size chart table — sizes (S/M/L/XL/XXL or numeric, appropriate to the product category) as rows, with key measurements as columns (${brief.dimensions || "chest/length/waist as relevant"}). A small product thumbnail anchors one corner.
STYLE: Simple grid table, legible sans-serif, minimal color — like a standard apparel size guide.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 30. Meesho: Usage Instructions (infographic) ──────────────────────────────
  if (imageType === "Meesho Usage Instructions") {
    return `Meesho gallery infographic — usage instructions. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module showing 3-4 simple numbered steps (with small icon or mini-illustration per step) explaining how to use or wear the product. Product shown small in the corner for context.
STEPS: Base the steps on this product's category and typical use — ${brief.description ? brief.description.substring(0, 150) : "how a buyer would set up, wear, or use this item"}.
STYLE: Simple, friendly, numbered step icons with short labels (max 5 words each).
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 31. Meesho: Wash Care (infographic) ───────────────────────────────────────
  if (imageType === "Meesho Wash Care") {
    return `Meesho gallery infographic — wash care instructions. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module showing standard garment-care icon row (machine wash / hand wash / do not bleach / line dry / iron low heat, as relevant) with a short plain-language care tip beneath. Product shown small for context.
${brief.material ? `Tailor care icons to this material: ${brief.material}.` : ""}
STYLE: Simple universal care icons, clean layout, minimal text.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 32. Meesho: Color Variants (infographic) ──────────────────────────────────
  if (imageType === "Meesho Color Variants") {
    return `Meesho gallery infographic — color variants. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module showing the product repeated in a clean row or grid across its available color options, each with a small color swatch and label beneath it.
COLORS: ${brief.productColors.length > 0 ? brief.productColors.join(", ") : "the product's available color options"}.
STYLE: Clean, evenly lit, consistent product pose across all variants, pure white background.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // ── 33. Meesho: Package Contents (infographic) ────────────────────────────────
  if (imageType === "Meesho Package Contents") {
    const pkgItems = brief.packageContents?.trim() || (brief.keyFeatures.length > 0 ? brief.keyFeatures.join(", ") : "all accessories and components");
    return `Meesho gallery infographic — package contents list. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module. Small flat-lay or icon-style illustration of each included item arranged in a simple row or grid, each with a short label beneath it.
ITEMS: ${pkgItems}.
STYLE: Clean, friendly, simple icon-and-label layout — easy to scan at a glance.
ASPECT: Square 1:1, output 1000x1000 pixels. NO watermark.`;
  }

  // Fallback
  return `Professional ecommerce product image. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}. Create a clean, marketplace-ready product photo with a pure white studio background. Professional studio lighting with rim highlight. ${brief.keyFeatures.length > 0 ? `Highlight: ${brief.keyFeatures.join(", ")}.` : ""} ${brief.productColors.length > 0 ? `Color(s): ${brief.productColors.join(", ")}.` : ""} ${brief.material ? `Material: ${brief.material}.` : ""} Crisp edges, vivid colors. Output 1280x1280 pixels. NO text, NO watermark.`;
}

export function buildBasicImagePrompt(brief: GenerationBrief, imageType: string): string {
  return appendCustomDirection(buildBasicImagePromptCore(brief, imageType), brief.customPrompt);
}

// ── Dedicated per-type prompts for Amazon A+ Content modules ────────────────────
// Each module type gets its own perfectly-crafted prompt.

function buildAplusPromptCore(
  brief: GenerationBrief,
  imageType: string
): string {
  // ── 1. Standard Banner ──────────────────────────────────────────────────────
  // Amazon A+ Standard Banner: ~970×300px — wide, top of A+ page
  if (imageType === "Standard Banner") {
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Standard Banner image.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Full-width horizontal banner, clean and impactful. The product occupies the LEFT 45-55% of the frame — clearly visible, hero placement with confident studio lighting. The RIGHT side is a soft neutral gradient (white to very light gray) with ${brief.keyFeatures.length > 0 ? `3 key feature bullet points` : "space for brand messaging"}. The layout must feel editorial and premium, not like an ad.
HEADER TEXT: A short punchy headline at the top-right or center — maximum 5 words — bold, clean sans-serif font. Examples: "Engineered for Perfection", "Where Quality Meets Design", "Premium Performance Daily". Match the tone to the ${brief.targetAudience || "product category"}.
${brief.keyFeatures.length > 0 ? `FEATURE POINTS (show as clean short bullet callouts with small icons or checkmarks):\n${brief.keyFeatures.slice(0, 3).map((f, i) => `  • ${f}`).join("\n")}` : ""}
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} for accent elements, headline, and icon colors.` : `Use a sophisticated color palette — deep navy, charcoal, and gold accents — for a premium feel.`}
PRODUCT: Show from a flattering angle with soft rim lighting. Pure white or very light background behind the product. High contrast, vivid colors.
LIGHTING: Professional soft studio lighting. Rim light on product edges.
ASPECT: Wide banner 970×300 pixels (approximately 3.2:1 ratio). Output at 970x300. Do NOT stretch or distort. The text must be legible. NO watermark, NO logo text, NO AI label.`;
  }

  // ── 2. Banner with Text Overlay ─────────────────────────────────────────────
  // Wide banner with headline + product integrated into scene
  if (imageType === "Banner with Text Overlay") {
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Banner with Text Overlay.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: FULL-BLEED wide banner. The ${brief.productName} is naturally integrated into a high-quality lifestyle scene — the product should look like it genuinely belongs in the environment. Background: a beautifully lit ${brief.targetAudience || "professional"} setting (e.g., a styled desk, luxury kitchen counter, elegant living room, outdoor lifestyle scene). The product is the natural hero, not awkwardly placed.
TEXT OVERLAY: Large, bold headline text overlaid on the right side or bottom of the image. The text must NOT obscure the product. Typography: clean modern sans-serif, white text with a subtle dark semi-transparent background panel behind the text so it reads clearly against any background.
HEADLINE SUGGESTION (use one or craft something fitting): "${brief.brandName ? `${brief.brandName} — ` : ""}${brief.keyFeatures[0] || brief.productName}${brief.specialOffers ? ` | ${brief.specialOffers}` : ""}"
${brief.keyFeatures.length > 0 ? `SUB-HEADLINE or TAGLINE (1 short sentence): ${brief.keyFeatures.slice(0, 2).join(". ")}.` : ""}
ATMOSPHERE: Warm, aspirational, premium editorial. Think high-end product catalog. Golden hour lighting or soft ambient indoor light. The product feels desirable.
${brief.material ? `MATERIAL QUALITY: Emphasize the ${brief.material} construction in the product's visible surfaces.` : ""}
ASPECT: Wide banner, approximately 970×300 pixels (3.2:1 ratio). Output at 970x300. NO watermark, NO AI label. The text overlay must be clean and legible.`;
  }

  // ── 3. Standard Image & Text ─────────────────────────────────────────────────
  // 50/50 split: product photo left, text right
  if (imageType === "Standard Image & Text") {
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Standard Image & Text module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Classic 50/50 split layout. LEFT 50%: High-quality product photograph, pure white or very light gray background, professional studio lighting with rim light. The product is shown from its most compelling, detail-rich angle. RIGHT 50%: Clean text panel.
RIGHT SIDE — TEXT CONTENT (structured as elegant editorial text blocks):
  HEADLINE: Bold, uppercase, clean sans-serif — max 4 words. "${brief.keyFeatures[0] || brief.brandName || brief.productName}"
  BODY PARAGRAPH: ${brief.description ? brief.description.substring(0, 150) + (brief.description.length > 150 ? "..." : "") : `Discover the ${brief.productName} — built with ${brief.material || "premium materials"} for ${brief.targetAudience || "everyday use"}. Designed to exceed expectations in both form and function.`}
  ${brief.keyFeatures.length > 0 ? `FEATURE BULLETS (3 clean bullet points):\n${brief.keyFeatures.slice(0, 3).map((f, i) => `    ${i + 1}. ${f}`).join("\n")}` : ""}
  ${brief.warranty ? `TRUST BADGE: ✓ ${brief.warranty}` : ""}
TEXT STYLE: Clean sans-serif font. Dark text on white or very light background. No heavy borders. Elegant spacing. The text should feel like a premium product brochure, not a discount ad.
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} for headline and accent elements.` : ""}
PRODUCT PHOTO SIDE: Bright, clean, premium product photography. Sharp edges, vivid colors, rim-lit.
ASPECT: Square or slightly landscape, output at 1000x1000 pixels. NO watermark, NO AI label.`;
  }

  // ── 4. Three Image Module ─────────────────────────────────────────────────────
  // Three equal panels — each with product detail + caption
  if (imageType === "Three Image Module") {
    const features = brief.keyFeatures.length > 0
      ? brief.keyFeatures.slice(0, 3)
      : ["Premium Quality", "Thoughtful Design", "Built to Last"];
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Three Image Module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: THREE EQUAL VERTICAL PANELS arranged side by side (left to right). Each panel is a standalone micro-story about the product.

PANEL 1 — "${features[0]}":
  IMAGE: Close-up detail shot of the ${brief.productName} showing the feature related to "${features[0]}" — this could be a texture close-up, mechanism detail, material finish, or the most visually compelling aspect of the product. Background: pure white or very light. Macro-style photography with shallow depth of field. High detail, sharp focus on the key area.
  CAPTION: Small, clean bold label at bottom of image: "${features[0]}". Clean sans-serif. Minimal — the image does the talking.

PANEL 2 — "${features[1] || "Smart Design"}":
  IMAGE: The ${brief.productName} shown in a usage context highlighting "${features[1] || "smart design"}" — the product being used in its intended environment, or a composition shot emphasizing the ergonomic/organic design qualities. Bright, clean lifestyle or studio background. Aspirational and professional.
  CAPTION: Small label at bottom: "${features[1] || "Smart Design"}"

PANEL 3 — "${features[2] || "Premium Materials"}":
  IMAGE: Full product hero shot emphasizing the overall build quality. Pure white background, studio lighting, the product as the complete hero. The buyer should see the whole product and understand its scale and quality in this panel.
  CAPTION: Small label at bottom: "${features[2] || "Premium Materials"}"

${brief.brandColors.length > 0 ? `BRAND COLORS: Use ${brief.brandColors.join(", ")} for caption text and any accent elements in each panel.` : `ACCENT COLOR: Use a consistent accent color (e.g., a deep blue, warm gold, or charcoal) across all three caption labels.`}
OVERALL: Each panel must be equally weighted visually. The three images together tell a complete mini-story about the product. Think editorial magazine spread, not a generic grid.
ASPECT: Three equal panels, total output approximately 1464×400 pixels (roughly 3.6:1 wide ratio). Each panel ~488×400. NO watermark, NO AI label.`;
  }

  // ── 5. Four Image Module ─────────────────────────────────────────────────────
  // Four panels — 2×2 grid within a wide module
  if (imageType === "Four Image Module") {
    const features = brief.keyFeatures.length > 0
      ? brief.keyFeatures.slice(0, 4)
      : ["Premium Quality", "Smart Features", "Ergonomic Design", "Built to Last"];
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Four Image Module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: 2×2 GRID of four equal panels. Each panel shows the ${brief.productName} from a different perspective or highlights a different selling point.

TOP-LEFT PANEL — Feature: "${features[0]}"
  Show the product's standout feature. Can be a close-up detail, the product being used, or a composition shot that emphasizes this specific attribute. Pure white background or soft lifestyle. Clean and direct.

TOP-RIGHT PANEL — Feature: "${features[1] || "Design Excellence"}"
  Highlight a second key attribute. Different visual approach from the top-left — if one was a close-up, this could be a wider shot showing context, or vice versa.

BOTTOM-LEFT PANEL — Feature: "${features[2] || "Quality Construction"}"
  Emphasize build quality, material, or structural design. Can be a macro surface detail, the product from a structural angle, or a flat-lay showing form factor.

BOTTOM-RIGHT PANEL — Feature: "${features[3] || "User Experience"}"
  Lifestyle or in-use shot showing the product in context. The most emotionally engaging image of the four — aspirational, inviting, showing the product delighting a user.

CAPTION STYLE: Each panel gets a small bold label at the bottom-center of the image. Clean sans-serif, white text with a subtle dark semi-transparent rounded pill/badge background so it reads on any image. Consistent styling across all four captions.

${brief.brandColors.length > 0 ? `BRAND COLORS: Use ${brief.brandColors.join(", ")} for caption badges and any accent elements.` : `ACCENT: Use a cohesive accent color across all four panels (e.g., deep teal, warm gold, or charcoal gray) for caption badges.`}
${brief.material ? `MATERIAL: Emphasize ${brief.material} in the bottom-left panel's close-up or texture shot.` : ""}
OVERALL: Balanced, harmonious grid. The four images together feel like a cohesive brand story. Think premium product catalog grid, not a generic photo collage.
ASPECT: 2×2 grid, total output approximately 1464×800 pixels. Each panel ~732×400. NO watermark, NO AI label.`;
  }

  // ── Hero Listing Image ───────────────────────────────────────────────────────
  // Primary A+ hero — product on white, negative space right
  if (imageType === "Hero Listing Image") {
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Hero Listing Image for ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.

COMPOSITION: The product is the absolute hero — placed BOLD and PROMINENT in the LEFT 55-65% of the frame with maximum visual impact. The product must feel confident and expensive. RIGHT 35-45%: Pure white or very soft gradient negative space. NO objects, NO decorations, NO lifestyle scene in the negative space — the whitespace is intentional and breathes. This composition ensures the product reads clearly even at tiny mobile thumbnail sizes.
PRODUCT: Show the ${brief.productName} from its most recognizable, flattering angle. Studio-lit, rim-highlighted, vivid colors. ${brief.productColors.length > 0 ? `Product color(s): ${brief.productColors.join(", ")}.` : ""} ${brief.material ? `Material: ${brief.material}.` : ""}
${brief.keyFeatures.length > 0 ? `HIGHLIGHT: ${brief.keyFeatures.slice(0, 2).join(" and ")}.` : ""}
${brief.brandName ? `BRAND: ${brief.brandName}.` : ""}
LIGHTING: Professional studio dual-light setup with rim light from behind to create a crisp bright edge. High contrast, sharp edges, no grain. The product should glow slightly.
QUALITY: Magazine-cover product photography. This image carries the entire first impression — it MUST look like a winning product shot.
ASPECT: 3:2 landscape, output 1500×1000 pixels. NO text, NO watermark, NO logo text, NO AI label.`;
  }

  // ── A+ Lifestyle Banner (legacy) ─────────────────────────────────────────────
  // Full-bleed lifestyle banner with caption
  if (imageType === "A+ Lifestyle Banner") {
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Lifestyle Banner for ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.

COMPOSITION: FULL-BLEED hero banner — fill the ENTIRE frame with a beautiful lifestyle scene. No empty borders, no negative space corners. The ${brief.productName} is naturally integrated into a realistic, aspirational ${brief.targetAudience || "professional"} environment — a styled workspace, elegant home interior, outdoor setting, or lifestyle moment. The product should feel like it belongs there.
SCENE QUALITY: Editorial catalog photography. Think a premium brand's lifestyle campaign — not a stock photo, not a generic mockup. The scene should feel curated and intentional. Warm, golden-hour or soft ambient lighting. Depth of field with the product in sharp focus and the background softly blurred.
BOTTOM CAPTION BAR: A thin, elegant branded bar across the bottom ~10% of the image height. Background: dark semi-transparent overlay. Text: "${brief.productName}${brief.brandName ? ` — ${brief.brandName}` : ""}" in clean white sans-serif, centered. No more than 5 words total.
${brief.keyFeatures.length > 0 ? `In the lifestyle scene, subtly show or imply: ${brief.keyFeatures.slice(0, 2).join(" and ")}.` : ""}
${brief.material ? `MATERIAL QUALITY: Show the ${brief.material} material quality clearly in the product's visible surfaces within the scene.` : ""}
ASPECT: Wide banner 1464×600 pixels (2.44:1 ratio). Do NOT distort or crop. NO watermark, NO AI label.`;
  }

  // ── A+ Product Photo (legacy) ────────────────────────────────────────────────
  // Square product photo for A+ content
  if (imageType === "A+ Product Photo") {
    return `You are an expert Amazon A+ Content designer. Create a premium Amazon A+ Product Photo for ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.

COMPOSITION: SQUARE format, product as the polished hero. Center the product in the frame with generous breathing room on all sides. Background: PURE WHITE or very subtle warm gray gradient — no shadows on the backdrop, no props, no distractions.
PRODUCT: The ${brief.productName} must look expensive and premium. Show from a slightly elevated angle (shoot from ~30 degrees above, straight on) that reveals both the front face and surface detail. ${brief.productColors.length > 0 ? `Color(s): ${brief.productColors.join(", ")} — shown vividly and accurately.` : ""} ${brief.material ? `Material: ${brief.material} — material quality should be clearly visible.` : ""}
LIGHTING: Professional studio soft-box lighting. Even illumination with no harsh spots. A subtle rim light creates a clean bright edge separating the product from the background. High detail, crisp edges, vivid colors.
${brief.keyFeatures.length > 0 ? `EMPHASIZE: ${brief.keyFeatures.slice(0, 2).join(" and ")}.` : ""}
${brief.brandName ? `BRAND NOTE: ${brief.brandName} branding on the product should be faithfully reproduced.` : ""}
QUALITY: Luxury product catalog photography — the kind of shot that makes someone want to buy. Think Apple, Dyson, or premium watch brand product pages.
ASPECT: Square 2000×2000 pixels. NO text, NO watermark, NO logo text, NO AI label.`;
  }

  // ── Flipkart RPD: Hero Banner ────────────────────────────────────────────────
  // 1440x600 — brand + product, top of the Rich Product Description page
  if (imageType === "Flipkart Hero Banner") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a premium Flipkart RPD Hero Banner.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Full-width hero banner. The product occupies the LEFT 50-60% of the frame as the confident hero, studio-lit on a clean white or soft gradient backdrop. The RIGHT side carries the brand identity — ${brief.brandName ? `the "${brief.brandName}" wordmark or a clean brand-style headline` : "a clean bold headline"} in elegant modern typography.
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} for the headline and accent elements.` : "Use a sophisticated, premium color palette for accents."}
HEADLINE: A short, confident tagline (max 6 words) that introduces the brand and product together.
LIGHTING: Professional studio lighting with soft rim light on the product.
ASPECT: Wide banner 1440×600 pixels (2.4:1 ratio). Output at 1440x600. Do NOT distort. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Feature Banner 1 (Key USP) ─────────────────────────────────
  if (imageType === "Flipkart Feature Banner 1") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Feature Banner focused on the product's key USP.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Wide horizontal banner. The product shown from a flattering angle on the LEFT or RIGHT half (studio-lit, clean background), with the opposite half dedicated to the single strongest unique selling point.
KEY USP: ${brief.keyFeatures[0] ? `"${brief.keyFeatures[0]}"` : "the product's single strongest differentiator"} shown as a bold short headline (max 5 words) plus a one-line supporting sentence.
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} for headline and accents.` : ""}
LIGHTING: Clean studio lighting, vivid true-to-life colors.
ASPECT: Wide banner 1200×600 pixels (2:1 ratio). Output at 1200x600. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Feature Banner 2 (Benefits) ────────────────────────────────
  if (imageType === "Flipkart Feature Banner 2") {
    const benefits = brief.keyFeatures.length > 1 ? brief.keyFeatures.slice(0, 3) : brief.keyFeatures;
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Feature Banner focused on buyer benefits.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Wide horizontal banner. Product shown in a lifestyle or clean studio context on one side; the other side lists 2-3 short benefit callouts as clean icon-style badges or checkmarks.
BENEFITS TO SHOW: ${benefits.length > 0 ? benefits.join(" · ") : "the product's most compelling everyday benefits"}.
${brief.targetAudience ? `Frame benefits for this audience: ${brief.targetAudience}.` : ""}
LIGHTING: Bright, clean, professional studio lighting.
ASPECT: Wide banner 1200×600 pixels (2:1 ratio). Output at 1200x600. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Feature Banner 3 (Material) ────────────────────────────────
  if (imageType === "Flipkart Feature Banner 3") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Feature Banner focused on material quality.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Wide horizontal banner combining a macro/close-up shot of the product's material or finish on one side with a short headline about material quality on the other side.
MATERIAL: ${brief.material ? `${brief.material} — emphasize how this material feels and performs.` : "Emphasize the product's premium build materials and finish."}
LIGHTING: Directional lighting that reveals texture and craftsmanship.
ASPECT: Wide banner 1200×600 pixels (2:1 ratio). Output at 1200x600. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Feature Banner 4 (Technology) ──────────────────────────────
  if (imageType === "Flipkart Feature Banner 4") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Feature Banner focused on technology or functional innovation.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Wide horizontal banner. Product shown alongside a clean technical/schematic-style visual element (subtle diagram lines, glow accents, or callout arrows) that communicates a technology or mechanism, paired with a short headline.
TECHNOLOGY / FUNCTION: ${brief.keyFeatures.slice(1, 3).length > 0 ? brief.keyFeatures.slice(1, 3).join(", ") : "the product's core functional innovation"}.
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} for technical accent elements.` : "Use a cool, modern accent color (electric blue, teal, or graphite) for technical accents."}
ASPECT: Wide banner 1200×600 pixels (2:1 ratio). Output at 1200x600. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Lifestyle Banner ───────────────────────────────────────────
  if (imageType === "Flipkart Lifestyle Banner") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Lifestyle Banner.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: FULL-BLEED wide banner — the product naturally integrated into a realistic, aspirational ${brief.targetAudience || "everyday"} scene, genuinely being used. Warm, editorial lighting with the product in sharp focus and background softly blurred.
${brief.keyFeatures.length > 0 ? `Subtly convey: ${brief.keyFeatures.slice(0, 2).join(" and ")}.` : ""}
ASPECT: Wide banner 1200×600 pixels (2:1 ratio). Output at 1200x600. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Infographic ────────────────────────────────────────────────
  if (imageType === "Flipkart Infographic") {
    const features = brief.keyFeatures.length > 0 ? brief.keyFeatures : ["Premium Quality", "Smart Design", "Built to Last"];
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Infographic module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module. Product shown centered or in the upper portion as a clean hero shot, with ${features.length} feature callouts arranged around it as icon-style badges connected by thin leader lines — classic feature-icon infographic layout.
FEATURES:\n${features.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} for icons and accent lines.` : "Use a cohesive accent color for all icons and leader lines."}
STYLE: Clean, modern, editorial infographic — not cluttered.
ASPECT: Square 1200×1200 pixels. Output at 1200x1200. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Dimensions ─────────────────────────────────────────────────
  if (imageType === "Flipkart Dimensions Graphic") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Dimensions module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module. Product shown from a clean, dimensionally-readable angle on a light neutral background, with precise technical-drawing-style dimension callout lines and labels (${brief.dimensions || "realistic proportions for this product category"}) in cm or mm.
${brief.weight ? `Include a small weight label: ${brief.weight}.` : ""}
STYLE: Minimal, precise, spec-sheet quality — thin lines, consistent modern sans-serif labels.
ASPECT: Square 1200×1200 pixels. Output at 1200x1200. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Comparison Chart ───────────────────────────────────────────
  if (imageType === "Flipkart Comparison Chart") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Comparison Chart module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module styled as a clean comparison table/chart. ${brief.productName} is shown as the featured column (highlighted with a subtle accent border or badge, e.g. "This Product"), compared against 1-2 generic alternative columns across 3-4 attribute rows.
ATTRIBUTES TO COMPARE: ${brief.keyFeatures.length > 0 ? brief.keyFeatures.slice(0, 4).join(", ") : "quality, material, durability, value"}. Use checkmarks/crosses or short values per cell.
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} to highlight the featured product's column.` : "Use a clear accent color to highlight the featured product's column."}
STYLE: Clean, legible chart typography — think spec-comparison table from a premium electronics listing.
ASPECT: Square 1200×1200 pixels. Output at 1200x1200. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Brand Story ─────────────────────────────────────────────────
  if (imageType === "Flipkart Brand Story") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Brand Story banner.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Wide editorial banner. The product shown in a warm, premium lifestyle or studio context as the emotional anchor, with a subtle brand mark (${brief.brandName || "brand name"}) in elegant small typography and a short brand story line.
TRUST ELEMENTS: ${brief.countryOfOrigin ? `Made in ${brief.countryOfOrigin}. ` : ""}${brief.warranty ? `${brief.warranty}.` : ""}
STYLE: Warm, trustworthy, premium lookbook photography — elegant, not cold.
ASPECT: Wide banner 1440×600 pixels (2.4:1 ratio). Output at 1440x600. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: FAQ Graphic ─────────────────────────────────────────────────
  if (imageType === "Flipkart FAQ Graphic") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD FAQ Graphic module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module styled as a clean FAQ card layout — 2-3 short question/answer pairs stacked vertically, each with a bold question line and a short one-sentence answer beneath it. A small product thumbnail or icon anchors the top of the module.
LIKELY QUESTIONS to address (craft natural Q&A around these): sizing/fit or compatibility, material/care, ${brief.warranty ? "warranty coverage" : "durability"}.
${brief.brandColors.length > 0 ? `Use brand colors ${brief.brandColors.join(", ")} for question headers.` : ""}
STYLE: Clean, legible, trustworthy — like a premium listing's help section.
ASPECT: Square 1200×1200 pixels. Output at 1200x1200. NO watermark, NO AI label.`;
  }

  // ── Flipkart RPD: Warranty / Trust ────────────────────────────────────────────
  if (imageType === "Flipkart Warranty Trust") {
    return `You are an expert Flipkart Rich Product Description (RPD) designer. Create a Flipkart RPD Warranty & Trust module.

PRODUCT: ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}.
COMPOSITION: Square module. Product shown cleanly on one portion of the frame, paired with trust badges/icons for warranty and certifications arranged neatly beside or beneath it.
TRUST ELEMENTS: ${brief.warranty ? `✓ ${brief.warranty}` : "✓ Manufacturer Warranty"}. ${brief.countryOfOrigin ? `Made in ${brief.countryOfOrigin}.` : ""} ${brief.specialOffers ? `Offer: ${brief.specialOffers}.` : ""}
STYLE: Clean, reassuring, premium badge design — like a certification seal on a trusted product page.
ASPECT: Square 1200×1200 pixels. Output at 1200x1200. NO watermark, NO AI label.`;
  }

  // Fallback for any unlisted types
  return `You are an expert Amazon A+ Content designer. Create a premium A+ Content image for ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}. ${brief.keyFeatures.length > 0 ? `Highlight: ${brief.keyFeatures.join(", ")}.` : ""} ${brief.material ? `Material: ${brief.material}.` : ""} ${brief.productColors.length > 0 ? `Colors: ${brief.productColors.join(", ")}.` : ""} Premium editorial style. Keep the product faithful to the reference. Output 1000x1000 pixels. NO watermark, NO AI label.`;
}

export function buildAplusPrompt(brief: GenerationBrief, imageType: string): string {
  return appendCustomDirection(buildAplusPromptCore(brief, imageType), brief.customPrompt);
}

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
  // Use the dedicated per-type prompt for basic image types
  return buildBasicImagePrompt(brief, imageType);
}
