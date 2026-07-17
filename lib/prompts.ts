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

// ── Dedicated per-type prompts for each basic image type ──────────────────────
// Each image gets its OWN complete prompt — no loops, no shared templates.

export function buildBasicImagePrompt(
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
${brief.customPrompt ? `Seller's direction: ${brief.customPrompt}` : ""}
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
${brief.customPrompt ? `Additional direction: ${brief.customPrompt}` : ""}
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
${brief.customPrompt ? `Custom direction: ${brief.customPrompt}` : ""}
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
${brief.customPrompt ? `Custom direction: ${brief.customPrompt}` : ""}
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
${brief.customPrompt ? `Custom direction: ${brief.customPrompt}` : ""}
TYPOGRAPHY: Brand name and warranty info in clean, premium font — minimal text, maximum elegance. Text should feel like a luxury catalog, not a discount ad.
ASPECT: Portrait (2:3) or square, output 960x1280 or 1280x1280 pixels. NO watermarks.`;
  }

  // Fallback
  return `Professional ecommerce product image. ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}. Create a clean, marketplace-ready product photo with a pure white studio background. Professional studio lighting with rim highlight. ${brief.keyFeatures.length > 0 ? `Highlight: ${brief.keyFeatures.join(", ")}.` : ""} ${brief.productColors.length > 0 ? `Color(s): ${brief.productColors.join(", ")}.` : ""} ${brief.material ? `Material: ${brief.material}.` : ""} ${brief.customPrompt ? `Direction: ${brief.customPrompt}` : ""} Crisp edges, vivid colors. Output 1280x1280 pixels. NO text, NO watermark.`;
}

// ── Dedicated per-type prompts for Amazon A+ Content modules ────────────────────
// Each module type gets its own perfectly-crafted prompt.

export function buildAplusPrompt(
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
${brief.customPrompt ? `Custom direction: ${brief.customPrompt}` : ""}
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

  // Fallback for any unlisted types
  return `You are an expert Amazon A+ Content designer. Create a premium A+ Content image for ${brief.productName}${brief.brandName ? ` by ${brief.brandName}` : ""}. ${brief.keyFeatures.length > 0 ? `Highlight: ${brief.keyFeatures.join(", ")}.` : ""} ${brief.material ? `Material: ${brief.material}.` : ""} ${brief.productColors.length > 0 ? `Colors: ${brief.productColors.join(", ")}.` : ""} ${brief.customPrompt ? `Direction: ${brief.customPrompt}` : ""} Premium editorial style. Keep the product faithful to the reference. Output 1000x1000 pixels. NO watermark, NO AI label.`;
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
