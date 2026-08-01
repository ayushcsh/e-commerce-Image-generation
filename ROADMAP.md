# Project Status & Roadmap
## AI Product Listing Automation Platform

> **Positioning:** Not an "AI image generator." It's an AI Product Listing Assistant that takes a few product photos and produces a complete, marketplace-ready package in 2–3 minutes per product.

---

## Executive Summary

**Overall Completion: ~45–50%**

The foundation is solid — auth, database, image generation pipeline, and a working studio UI are all in place. The core AI intelligence layer (Vision + Listing generation) is now built and wired into the studio UI. The app still needs a job queue for background processing, but Razorpay payments and the credit system are already wired up and the core user workflow is functional.

---

## Vision Feature Checklist

### Step 1 — Upload ✅ ~95% Complete

| Feature | Status | Notes |
|---|---|---|
| Upload 5–20 images (drag & drop) | ✅ Done | 12 photo limit, preview grid, chip counter |
| Optional: Brand name | ✅ Done | `brandName` field in form |
| Optional: Product name | ✅ Done | Required field |
| Optional: Category | ✅ Done | `category` field with datalist suggestions |

**Remaining:** None significant.

---

### Step 2 — AI Vision Analysis ✅ Built

Implemented in `app/api/analyze/route.ts`. Uses Gemini 2.0 Flash (fast, cost-effective) via direct REST API call. Extracts product type, brand, color, material, dimensions, weight, pattern, usage, target audience, gender, key features, packaging, accessories, country of origin, warranty. Returns confidence levels per field.

| Feature | Status | Notes |
|---|---|---|
| Vision LLM integration | ❌ Not built | fal.ai is used for image gen, not vision analysis |
| Auto-detect: Product Type | ❌ | |
| Auto-detect: Color | ❌ | |
| Auto-detect: Material | ❌ | |
| Auto-detect: Size/Dimensions | ❌ | |
| Auto-detect: Pattern | ❌ | |
| Auto-detect: Usage | ❌ | |
| Auto-detect: Gender | ❌ | |
| Auto-detect: Target Audience | ❌ | |
| Auto-detect: Features | ❌ | |
| Auto-detect: Brand Logo | ❌ | |
| Auto-detect: Text present | ❌ | |
| Auto-detect: Packaging | ❌ | |
| Auto-detect: Accessories | ❌ | |

**What to build:** Integrate **Gemini 2.5 Pro/Flash** (already in `lib/gemini.ts` but unused) or **Claude Vision** to analyze uploaded reference photos and auto-populate product attributes. This is the intelligence core of the entire platform.

---

### Step 3 — Ask User (Missing Info) ✅ Built

The Vision Analysis Panel in `app/studio/page.tsx` shows a confirmation modal after AI analysis. Users can toggle each detected field on/off before applying. Only the fields AI detected with confidence are pre-checked. One-click applies the selected fields to the form.

| Feature | Status | Notes |
|---|---|---|
| Detect missing required fields | ❌ | |
| Show targeted "fill in the blanks" form | ❌ | |
| Validate before proceeding | ❌ | |

**What to build:** After Vision analysis, show a minimal one-page form for fields the AI couldn't determine. One short form, then done.

---

### Step 4 — Generate Images ⚠️ ~50% Complete

| Image Type | Status | Notes |
|---|---|---|
| Amazon White Background | ⚠️ Partial | Prompt-based; no dedicated "pure white / 85% fill / shadow removed" pipeline |
| Lifestyle Images | ⚠️ Partial | Lifestyle background option exists, no scene selector |
| Infographics | ⚠️ Partial | `TYPE_INSTRUCTIONS.Infographic` exists but no feature callout builder |
| Comparison Images | ⚠️ Partial | Basic prompt exists |
| Size Guide | ⚠️ Partial | Basic prompt exists |
| Packaging Showcase | ⚠️ Partial | Basic prompt exists |
| Instagram Posts | ❌ | No dedicated format |
| Facebook Ads | ❌ | No dedicated format |
| Pinterest | ❌ | No dedicated format |
| Shopify Banner | ❌ | No dedicated format |
| Thumbnail | ❌ | No dedicated format |
| Reels Cover | ❌ | No dedicated format |
| Background Removal | ❌ | Not built |
| Background Replacement | ❌ | Not built |
| Image Quality Enhancement | ❌ | Not built |

**Style/Options Coverage:**
| Option | Status | Notes |
|---|---|---|
| 4 Background presets | ✅ | White, Transparent, Lifestyle, Gradient |
| Custom Color Background | ✅ | Color picker |
| 6 AI Styles (Minimal → Luxury) | ✅ | |
| 4 Text options (No Text → Promotional) | ✅ | |
| 3 Resolutions (Standard/HD/4K) | ✅ | Resolution is captured but not passed to fal.ai |

**Remaining:** Platform-specific image formats (Instagram, Pinterest, etc.), background removal pipeline, quality enhancement.

---

### Step 5 — Generate Listing ✅ Built

Implemented in `app/api/listing/route.ts` + `app/studio/page.tsx` ListingPanel. Uses Gemini 2.0 Flash for text generation. Generates complete platform-specific listings for: Amazon (title, 5 bullets, description, backend keywords, SEO meta), Flipkart (title, highlights, description, SEO), Meesho (Hinglish title + description + highlights), Myntra (fashion-focused), Shopify (title, body HTML, tags, product type, vendor, SEO), WooCommerce (title, description, short description, tags, SEO), Etsy (title up to 140 chars, description, 13 tags, materials, occasion), Ajio (fashion title + highlights + tags). Up to 5 marketplace generations run in parallel.

| Platform | Title | Bullets | Description | Keywords | SEO | A+ Content | Alt Text |
|---|---|---|---|---|---|---|---|
| Amazon | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Shopify | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| Etsy | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| Flipkart | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| Meesho | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |

**What to build:** Use **GPT-5.5** or **Claude** (text models) with the product brief + Vision analysis to generate platform-specific listing content. Each marketplace has different requirements.

---

### Step 6 — SEO ❌ 0% Complete

| Feature | Status |
|---|---|
| Primary Keywords | ❌ |
| Long-tail Keywords | ❌ |
| Competitor Keywords | ❌ |
| Search Intent Mapping | ❌ |

**What to build:** SEO module that generates keyword clusters, search-intent labels, and meta descriptions from product data.

---

### Step 7 — Export ⚠️ ~5% Complete

| Feature | Status | Notes |
|---|---|---|
| Display results with download button | ✅ | Works end-to-end |
| Amazon CSV | ✅ | `lib/export.ts` — tab-delimited (Seller Central format), BOM UTF-8 |
| Shopify CSV | ✅ | Full Shopify import CSV with all required columns |
| Flipkart Sheet | ✅ | Tab-delimited with MRP, selling price, highlights, stock |
| Etsy CSV | ✅ | Title, description, tags, materials, occasion |
| WooCommerce CSV | ✅ | Full WooCommerce import format |
| JSON | ✅ | Full structured JSON with brief + all listings |
| Excel | ⚠️ | CSV opens in Excel natively via BOM encoding |

---

## Backend Infrastructure

| Component | Status | Notes |
|---|---|---|
| Auth (Google + Credentials) | ✅ Done | NextAuth v5, bcrypt, JWT |
| MongoDB setup | ✅ Done | Direct driver, not Prisma |
| Image storage | ⚠️ Partial | fal.ai storage used; no R2/S3 |
| Image generation pipeline | ✅ Done | fal.ai with concurrency control |
| Job queue (BullMQ) | ❌ | fal.ai subscribe() is synchronous; 31–44s blocking |
| Credits system | ✅ Done | Balance + transaction history, atomic charge/refund |
| Razorpay payments | ✅ Done | Order creation, client-side verify, webhook backup |
| CDN (Cloudflare R2) | ❌ | Images served from fal.ai URLs |
| Deployment (Vercel) | ❌ | Dev only |

---

## Frontend / UX

| Component | Status | Notes |
|---|---|---|
| Landing page | ✅ Done | EN/HI bilingual, animated, responsive |
| Login page | ✅ Done | Email/password + Google OAuth |
| Studio UI | ✅ Done | 1140 lines, full form |
| Results display | ✅ Done | Grid + download |
| User dashboard (projects, history) | ❌ | Not built |
| Product history | ❌ | Not built |
| Bulk upload | ❌ | Not built |
| Mobile responsive refinements | ⚠️ Partial | Basic mobile support |
| Waitlist / Email capture | ❌ | Not built |

---

## Architecture Gaps

| Gap | Impact | Priority |
|---|---|---|
| No Vision AI for product analysis | App can't auto-fill anything from photos | 🔴 Critical |
| No Listing text generation | Only images; no titles/descriptions | 🔴 Critical |
| Synchronous image generation | 31–44s blocking request; users stare at spinner | 🔴 Critical |
| No job queue | Can't do background processing, progress tracking | 🔴 Critical |
| No credit/pricing system | Can't monetize | 🟡 High |
| No CSV export | Can't actually publish to marketplaces | 🟡 High |
| No user dashboard | No way to revisit past projects | 🟡 High |
| Gemini unused | `lib/gemini.ts` exists but never called | 🟡 Medium |
| Resolution not wired to fal.ai | User picks "4K" but it doesn't affect output | 🟡 Medium |
| No background removal pipeline | Can't isolate products cleanly | 🟡 Medium |

---

## Recommended Build Roadmap

### Phase 1 — Core Intelligence (Week 1–2)
**Goal: Make the app actually intelligent**

1. Wire Vision AI into the upload flow
   - Use Gemini 2.5 Flash (fast, cheap) to analyze reference photos
   - Extract: product type, color, material, brand (if visible), dimensions, features, packaging
   - Auto-populate the form fields after analysis
2. Add "Missing Info" form
   - After Vision analysis, show only the fields still blank
3. Generate Listing text
   - One LLM call after Vision → produces title, bullets, description, keywords
   - Platform selector determines output format

### Phase 2 — Queue & Reliability (Week 2–3)
**Goal: Professional-grade processing**

1. Add BullMQ + Redis job queue
   - `POST /api/generate` enqueues a job and returns a job ID immediately
   - Client polls or SSE for progress
   - Background workers call fal.ai, update job status
2. Show live progress: "Analyzing photos... → Generating 3/8 images..."
3. Handle partial failures gracefully (retry individual image types)

### Phase 3 — Export & Integrations (Week 3–4)
**Goal: Actually ship to marketplaces**

1. Build CSV export per platform
   - Amazon: title, bullet1–5, description, backend keywords, image urls
   - Shopify: title, body_html, vendor, product_type, tags, images
   - Flipkart: product_name, description, highlights, image_urls
   - Etsy: title, description, tags, materials
2. One-click download per platform
3. JSON export for custom integrations

### Phase 4 — Payments & Credits (Week 4–5)
**Goal: Revenue**

1. Integrate Razorpay ✅ Done
2. Define credit costs: e.g., 1 product = 10 credits (1 vision call + 1 listing gen + 1 image = 3 credits)
3. Free tier: 5 products/month
4. Display credits on dashboard

### Phase 5 — UX Polish (Week 5–6)
1. User dashboard: view past projects, regenerate, re-export
2. Bulk upload (CSV with image URLs)
3. Background removal pipeline (rembg or similar)
4. Mobile refinements

### Phase 6 — Scale (Week 6+)
1. Cloudflare R2 for generated image storage
2. Multi-language listing generation (Hindi, regional languages)
3. Team collaboration
4. Competitor listing analysis
5. AI pricing suggestions
6. Marketplace publishing APIs (Amazon SP-API, Shopify, etc.)
7. Product video generation from images

---

## Current Tech Stack — What's Being Used vs. What Was Planned

| Planned | Current Implementation | Verdict |
|---|---|---|
| Next.js | ✅ Next.js | Good |
| TypeScript | ✅ Yes | Good |
| Tailwind CSS | ⚠️ `globals.css` (~3286 lines) | Works but not Tailwind |
| shadcn/ui | ❌ Not used | Custom components |
| NestJS / API Routes | ✅ API Routes | Fine for MVP |
| PostgreSQL | ❌ MongoDB | Okay for MVP |
| Prisma | ❌ Direct MongoDB driver | Works |
| Cloudflare R2 | ❌ fal.ai storage | Okay for now |
| BullMQ + Redis | ❌ Not used | 🔴 Gap |
| Clerk / Better Auth | ❌ NextAuth v5 | Works fine |
| Razorpay | ✅ `lib/razorpay.ts` | Wired up |
| Vercel | ❌ Dev only | 🔴 Gap |
| fal.ai | ✅ `lib/fal.ts` | Good |
| Gemini Vision | ⚠️ `lib/gemini.ts` exists | Not wired up |
| Claude Vision | ❌ Not integrated | Future |

---

## Quick Wins Left on Current Codebase

1. **Wire `lib/gemini.ts`** — it's already there, just needs to be called from the generate route
2. **Pass resolution to fal.ai** — `brief.resolution` is captured but never used in the API call
3. **Add CSV export button** — the image generation is already working; just format the brief as CSV
4. **Add a polling endpoint** — wrap the current sync flow in a job queue structure so the UI can show progress
