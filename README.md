# AI Product Listing Assistant

> Upload product photos → AI auto-fills details → Generate marketplace images → Generate listing copy → Export to CSV

A full-stack SaaS platform that takes a few product photos and produces a complete, marketplace-ready package: optimized images, SEO-friendly titles, bullet points, descriptions, and export-ready CSV files for Amazon, Flipkart, Meesho, Shopify, and more.

---

## Features

### Vision AI Analysis
- **Auto-analyze on upload** — as soon as you drop product photos, Gemini 3.5 Flash Vision extracts all product details automatically
- Detects: product type, brand, color, material, dimensions, weight, target audience, gender, key features, packaging
- Smart merge — AI fills only empty fields, preserving your manual edits

### Image Generation
- 8 image types: Main Listing, Infographic, Feature Highlight, Lifestyle, Comparison, Size Guide, Packaging Showcase, Premium Banner
- 5 background options: Pure White, Transparent, Lifestyle, Gradient, Custom Color
- 6 AI styles: Minimal, Premium, Luxury, Modern, Colorful, Professional
- Text overlay control: No Text, Minimal Text, Feature Highlights, Promotional
- Output formats: PNG, JPG, WebP at Standard, HD, or 4K resolution

### Listing Text Generation
- **Amazon** — title (200 chars), 5 bullet points, description, backend keywords, SEO meta
- **Flipkart** — title, highlights, description, SEO
- **Meesho** — Hinglish title + description + highlights (value-focused copy)
- **Myntra** — fashion-forward title + description + tags
- **Shopify** — title, body HTML, tags, product type, vendor, SEO
- **WooCommerce** — title, description, short description, tags, SEO
- **Etsy** — 140-char title, storytelling description, 13 tags, materials, occasion

### Export
- One-click CSV download per marketplace
- Amazon TSV (Seller Central-ready, Excel UTF-8 compatible)
- Shopify CSV (full import format)
- Flipkart, Meesho, Etsy, WooCommerce CSV
- JSON export with full structured data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, CSS |
| Backend | Next.js API Routes |
| Auth | NextAuth v5 (Google OAuth + Credentials + bcrypt) |
| Database | MongoDB (user accounts, generation history) |
| Image Gen | fal.ai (nano-banana model) |
| Vision AI | Google Gemini 3.5 Flash |
| Text Gen | Google Gemini 3.5 Flash |
| Storage | fal.ai storage + MongoDB |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- A fal.ai API key from [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
- A MongoDB instance (local or Atlas)

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Authentication
AUTH_SECRET=your_generated_secret
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=image-generation

# AI Providers
FAL_KEY=your_fal_ai_key
FAL_IMAGE_MODEL=fal-ai/nano-banana/edit
GEMINI_API_KEY=your_gemini_api_key
GEMINI_IMAGE_MODEL=gemini-3.5-flash
```

**Generate AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Installation & Running

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       Vision AI: analyze photos → product data
│   │   ├── generate/route.ts      Image generation via fal.ai
│   │   └── listing/route.ts       Listing text generation
│   ├── studio/page.tsx            Main studio workspace UI
│   ├── login/page.tsx             Login page
│   └── page.tsx                  Landing page
├── lib/
│   ├── fal.ts                    fal.ai client
│   ├── gemini.ts                 Gemini client
│   ├── prompts.ts                Image prompt builder
│   ├── generations.ts             MongoDB CRUD for generations
│   ├── mongodb.ts                MongoDB singleton
│   └── export.ts                 CSV/JSON export utilities
├── auth.ts                        NextAuth configuration
├── auth.config.ts                 Auth middleware config
└── middleware.ts                  Route protection
```

---

## API Reference

### `POST /api/analyze`
Analyze product photos with Gemini Vision AI.

**Request:** `multipart/form-data` — `photos` (up to 8 images)

**Response:**
```json
{
  "productType": "Running Shoes",
  "brand": "Nike",
  "color": "White and Blue",
  "material": "Mesh",
  "dimensions": "30cm x 12cm x 10cm",
  "weight": "280g",
  "targetAudience": "Men",
  "keyFeatures": ["Breathable", "Lightweight"],
  "confidence": { "productType": "high", "material": "high" }
}
```

### `POST /api/generate`
Generate product images via fal.ai.

**Request:** `multipart/form-data` — `brief` (JSON) + `photos` (up to 4)

**Response:**
```json
{
  "id": "generation_id",
  "images": [{ "type": "Main Listing Image", "mimeType": "image/png", "data": "base64..." }]
}
```

### `POST /api/listing`
Generate marketplace listing copy.

**Request:** JSON with `brief` object

**Response:**
```json
{
  "amazon": { "title": "...", "bullets": [...], "description": "...", "keywords": [...] },
  "flipkart": { "title": "...", "highlights": [...], "description": "..." },
  "meesho": { "title": "...", "highlights": [...], "description": "..." },
  "shopify": { "title": "...", "bodyHtml": "...", "tags": [...] },
  "etsy": { "title": "...", "description": "...", "tags": [...] }
}
```

---

## User Flow

```
1. Sign in at /login (Google OAuth or email/password)
   ↓
2. Go to /studio
   ↓
3. Drop product photos → AI auto-analyzes in 1-2 seconds → Form auto-fills → Toast notification
   ↓
4. Fill remaining: category, marketplace(s), style preferences
   ↓
5. Click "Generate images" → fal.ai generates 1-8 images → Scroll to results → Download
   ↓
6. Click "Generate Listing Text" → Gemini generates all marketplace copy → Listing panel opens
   ↓
7. Browse tabs (Amazon, Flipkart, Meesho, Shopify, Etsy)
   ↓
8. Copy individual fields or download full CSV for any platform
```

---

## Database Schema

### `users` — User accounts (NextAuth managed)
### `generations` — Generation session records
```json
{ "_id": ObjectId, "userId": string, "productName": string, "category": string, "marketplaces": [], "createdAt": Date }
```
### `generationImages` — Generated image blobs
```json
{ "_id": ObjectId, "generationId": ObjectId, "type": string, "mimeType": string, "data": "base64", "createdAt": Date }
```

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1 | Vision AI auto-fill on upload | ✅ Done |
| 1 | Image generation (fal.ai) | ✅ Done |
| 1 | Listing text generation | ✅ Done |
| 1 | CSV export (all marketplaces) | ✅ Done |
| 2 | Background job queue (BullMQ) | ⬜ Pending |
| 2 | Progress tracking | ⬜ Pending |
| 3 | Stripe + credit system | ⬜ Pending |
| 4 | User dashboard | ⬜ Pending |
| 4 | Bulk CSV upload | ⬜ Pending |
| 5 | Cloudflare R2 storage | ⬜ Pending |
| 5 | Marketplace publishing APIs | ⬜ Pending |
| 5 | Product video generation | ⬜ Pending |
