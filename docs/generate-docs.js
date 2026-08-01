"use strict";

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, PageBreak, TabStopType, TabStopPosition,
  LevelFormat, NumberingConfig, convertInchesToTwip,
  UnderlineType, VerticalAlign, PageOrientation,
  ShadingType, ImageRun, TableOfContents,
  Header, Footer, PageNumber, NumberFormat,
  SectionType, convertMillimetersToTwip,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Color palette ──────────────────────────────────────────────────────────────
const BRAND     = "0F4C81"; // deep blue
const ACCENT    = "0EA5E9"; // sky blue
const MID       = "334155"; // slate-700
const LIGHT     = "F1F5F9"; // slate-100
const WHITE     = "FFFFFF";
const CODE_BG   = "1E293B"; // slate-800
const CODE_TXT  = "E2E8F0"; // slate-200

// ── Typography helpers ─────────────────────────────────────────────────────────
function h1(text, color = BRAND) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, color, bold: true, size: 36 })],
    spacing: { before: 400, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } },
  });
}

function h2(text, color = MID) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, color, bold: true, size: 28 })],
    spacing: { before: 320, after: 120 },
  });
}

function h3(text, color = MID) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, color, bold: true, size: 24 })],
    spacing: { before: 200, after: 80 },
  });
}

function p(runs, spacing = {}) {
  const children = Array.isArray(runs)
    ? runs
    : [new TextRun({ text: runs, color: MID, size: 22 })];
  return new Paragraph({
    children,
    spacing: { before: 60, after: 100, ...spacing },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function bullet(text, level = 0, color = MID) {
  return new Paragraph({
    children: [new TextRun({ text, color, size: 22 })],
    bullet: { level },
    spacing: { before: 40, after: 40 },
  });
}

function numbered(text, num, color = MID) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}. ${text}`, color, size: 22 }),
    ],
    spacing: { before: 40, after: 40 },
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, color: CODE_TXT, size: 18, font: "Courier New" })],
    shading: { type: ShadingType.CLEAR, color: CODE_BG },
    spacing: { before: 60, after: 60 },
  });
}

function spacer(lines = 1) {
  return new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 0, after: lines * 120 } });
}

function hr() {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" } },
    spacing: { before: 200, after: 200 },
  });
}

function badge(text) {
  return new TextRun({ text: ` ${text} `, color: WHITE, size: 18, bold: true,
    shading: { type: ShadingType.CLEAR, color: ACCENT } });
}

// ── Table helpers ──────────────────────────────────────────────────────────────
function pct(n) { return String(n) + "%"; }

function hdrCell(text, width, color = BRAND) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, color: WHITE, bold: true, size: 20 })],
      alignment: AlignmentType.CENTER,
    })],
    width: { size: pct(width), type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, color },
    verticalAlign: VerticalAlign.CENTER,
  });
}

function dataCell(text, width, align = AlignmentType.LEFT, bg = WHITE) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), color: MID, size: 20 })],
      alignment: align,
    })],
    width: { size: pct(width), type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, color: bg },
  });
}

function twoColTable(rows, col1W = 35, col2W = 65) {
  return new Table({
    width: { size: pct(100), type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [hdrCell("Field", col1W), hdrCell("Description", col2W)],
      }),
      ...rows.map(([a, b], i) =>
        new TableRow({
          children: [
            dataCell(a, col1W, AlignmentType.LEFT, i % 2 === 0 ? WHITE : LIGHT),
            dataCell(b, col2W, AlignmentType.LEFT, i % 2 === 0 ? WHITE : LIGHT),
          ],
        })
      ),
    ],
  });
}

function threeColTable(headers, rows, colWidths) {
  return new Table({
    width: { size: pct(100), type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h, i) => hdrCell(h, colWidths[i])),
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            dataCell(cell, colWidths[ci], AlignmentType.LEFT, ri % 2 === 0 ? WHITE : LIGHT)
          ),
        })
      ),
    ],
  });
}

function fourColTable(headers, rows, colWidths) {
  return threeColTable(headers, rows, colWidths);
}

// ── Callout box ───────────────────────────────────────────────────────────────
function callout(label, text, bg = LIGHT, accent = ACCENT) {
  return new Table({
    width: { size: pct(100), type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: accent },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 8, color: accent },
      right: { style: BorderStyle.NONE, size: 0, color: WHITE },
      insideH: { style: BorderStyle.NONE, size: 0, color: WHITE },
      insideV: { style: BorderStyle.NONE, size: 0, color: WHITE },
    },
    rows: [new TableRow({
      children: [new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, color: accent, size: 20 })],
            spacing: { before: 60, after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text, color: MID, size: 20 })],
            spacing: { before: 0, after: 80 },
          }),
        ],
        shading: { type: ShadingType.CLEAR, color: bg },
        width: { size: pct(100), type: WidthType.PERCENTAGE },
      })],
    })],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
const children = [

  // ══════════════════════════════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════════════════════════════
  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  spacer(4),

  new Paragraph({
    children: [new TextRun({ text: "VendorFlow", color: BRAND, bold: true, size: 72 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
  }),

  new Paragraph({
    children: [new TextRun({ text: "AI Product Image Generator", color: ACCENT, size: 36, bold: false })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
  }),

  new Paragraph({
    children: [new TextRun({ text: "Developer & Platform Documentation", color: MID, size: 26 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
  }),

  new Paragraph({
    children: [new TextRun({ text: "Version 1.0  ·  July 2026", color: "94A3B8", size: 22 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
  }),

  new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: "Built with", color: "94A3B8", size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 } }),
            new Paragraph({ children: [new TextRun({ text: "Next.js · MongoDB · Razorpay · fal.ai · Gemini AI", color: MID, size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
          ],
          shading: { type: ShadingType.CLEAR, color: LIGHT },
          width: { size: pct(100), type: WidthType.PERCENTAGE },
        }),
      ],
    })],
  }),

  spacer(6),
  new Paragraph({
    children: [new TextRun({ text: "hello@productvisuals.ai", color: "94A3B8", size: 20 })],
    alignment: AlignmentType.CENTER,
  }),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ══════════════════════════════════════════════════════════════
  h1("Table of Contents"),

  twoColTable([
    ["1. Overview", "3"],
    ["2. Architecture", "4"],
    ["3. Tech Stack", "5"],
    ["4. Environment Variables", "6"],
    ["5. Data Storage", "8"],
    ["6. Authentication", "9"],
    ["7. Credits & Billing", "10"],
    ["8. Core Features", "12"],
    ["9. API Reference", "14"],
    ["10. Marketplace Integrations", "19"],
    ["11. AI Models", "21"],
    ["12. User Flows", "22"],
    ["13. Setup & Installation", "24"],
  ], 65, 35),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 1 — OVERVIEW
  // ══════════════════════════════════════════════════════════════
  h1("1. Overview"),

  p("VendorFlow is an AI-powered product image generation platform for ecommerce sellers. It enables vendors on marketplaces like Amazon, Flipkart, and Meesho to upload a single product photo and automatically generate a full set of marketplace-ready images — including multiple angles, lifestyle shots, close-ups, infographics, and premium A+ content banners — without a physical photoshoot."),

  spacer(),
  h2("1.1  Core Problem Solved"),

  p("Most small and medium sellers lack access to professional product photography. They need multiple images per listing across different marketplaces, each with specific size, background, and style requirements. VendorFlow eliminates the cost and complexity of physical photoshoots by using AI image generation to create these assets from a single reference photo."),

  spacer(),
  h2("1.2  Key Capabilities"),

  bullet("Generate 7–8 product images from one uploaded photo"),
  bullet("Support for Amazon, Flipkart, and Meesho with platform-specific sizing and formatting"),
  bullet("Basic product images (nano-banana AI) and premium A+ / RPD banners (GPT Image 2)"),
  bullet("AI-powered photo analysis — auto-fills product name, brand, material, dimensions, color, and key features"),
  bullet("AI-generated listing copy (titles, bullet points, descriptions, keywords, SEO metadata) for all three marketplaces"),
  bullet("Credit-based billing with GST-compliant Indian rupee pricing via Razorpay"),
  bullet("Generation history with re-download capability"),
  bullet("Onboarding tour for first-time users"),
  bullet("Bilingual UI (English / Hindi)"),

  spacer(),
  callout("Platform", "VendorFlow targets Indian ecommerce sellers, particularly those selling on Amazon India, Flipkart, and Meesho. The billing, language support, and marketplace specifications all reflect this focus."),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — ARCHITECTURE
  // ══════════════════════════════════════════════════════════════
  h1("2. Architecture"),

  h2("2.1  High-Level Overview"),

  p("VendorFlow is a serverless-first Next.js application (App Router). It is deployed as a single Next.js service that handles both the frontend UI and the backend API routes. No separate backend server is required."),

  spacer(),

  threeColTable(
    ["Layer", "Technology", "Role"],
    [
      ["Frontend UI", "Next.js 15 (App Router), React 19, TypeScript", "Pages, forms, image gallery, user account management"],
      ["API Routes", "Next.js Route Handlers (app/api/*)", "Authentication, image generation, listing generation, credits, Razorpay webhooks"],
      ["Database", "MongoDB (via @mongodb-adapter / NextAuth)", "Users, credits, transaction history, generation history, listings"],
      ["File Storage", "Cloudflare R2 (S3-compatible)", "Stores generated images; public URL served via R2 CDN"],
      ["Image Generation", "fal.ai (nano-banana, GPT Image 2)", "AI product image generation from reference photos"],
      ["Photo Analysis", "Google Gemini 3.5 Flash (Vision)", "Extracts product metadata from uploaded photos"],
      ["Listing Copy", "Google Gemini 3.5 Flash (Text)", "Generates marketplace listing text (titles, bullets, descriptions)"],
      ["Auth", "NextAuth.js v5 (Credentials + Google OAuth)", "User authentication and session management"],
      ["Payments", "Razorpay (Orders + Webhooks)", "Credit pack purchases with Indian INR billing and GST receipts"],
      ["Styling", "CSS Modules (globals.css)", "Custom design system — no Tailwind or component library"],
      ["Animations", "GSAP + Motion.dev", "UI transitions and entrance animations"],
    ],
    [22, 30, 48]
  ),

  spacer(),
  h2("2.2  Data Flow"),

  p("The diagram below shows how a typical image generation request flows through the system:"),

  spacer(),
  new Table({
    width: { size: pct(100), type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: "1. User uploads 1–12 product photos in the Studio UI", color: MID, size: 20 })], spacing: { before: 60, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "2. Optional: User clicks \"Analyze Photos\" — Gemini Vision extracts product metadata", color: MID, size: 20 })], spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "3. User fills in the listing brief (product name, marketplace, image types, style)", color: MID, size: 20 })], spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "4. On submit, the generate API route charges credits and dispatches generation jobs", color: MID, size: 20 })], spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "5. Reference images are uploaded to fal.storage", color: MID, size: 20 })], spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "6. Basic images → nano-banana model; A+ images → GPT Image 2 model", color: MID, size: 20 })], spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "7. Generated images are uploaded to Cloudflare R2", color: MID, size: 20 })], spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "8. Generation record saved to MongoDB (user history)", color: MID, size: 20 })], spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "9. Base64 image data + R2 URLs returned to client; displayed in the results gallery", color: MID, size: 20 })], spacing: { before: 0, after: 60 } }),
        ],
        shading: { type: ShadingType.CLEAR, color: LIGHT },
        width: { size: pct(100), type: WidthType.PERCENTAGE },
      })] }),
    ],
  }),

  spacer(),
  h2("2.3  Directory Structure"),

  code("image-generation/"),
  code("├── app/                          # Next.js App Router"),
  code("│   ├── api/                      # API Route Handlers"),
  code("│   │   ├── auth/[...nextauth]/   # NextAuth session endpoint"),
  code("│   │   ├── generate/             # POST — image generation pipeline"),
  code("│   │   ├── analyze/              # POST — Gemini Vision photo analysis"),
  code("│   │   ├── listing/              # POST — Gemini text listing generation"),
  code("│   │   ├── credits/              # GET — credit balance & transaction history"),
  code("│   │   ├── credits/welcome/      # GET — check welcome bonus flag"),
  code("│   │   ├── history/              # GET — generation history list"),
  code("│   │   ├── history/[id]/         # GET — single generation with images"),
  code("│   │   ├── razorpay/checkout/    # POST — create Razorpay order / verify payment"),
  code("│   │   ├── razorpay/portal/      # POST — stub (Razorpay has no billing portal)"),
  code("│   │   ├── razorpay/webhook/     # POST — Razorpay payment.captured backup"),
  code("│   │   └── assistant/            # POST — AI assistant chat"),
  code("│   ├── studio/page.tsx           # Main product image studio (authenticated)"),
  code("│   ├── login/page.tsx            # Sign in / Register page"),
  code("│   ├── credits/page.tsx          # Credit balance & purchase page"),
  code("│   ├── layout.tsx                # Root layout with auth providers"),
  code("│   ├── page.tsx                  # Marketing landing page"),
  code("│   └── globals.css               # Global styles & design tokens"),
  code("├── components/                   # Shared React components"),
  code("├── lib/                          # Backend utilities"),
  code("│   ├── mongodb.ts                # MongoDB connection singleton"),
  code("│   ├── auth.ts                   # NextAuth configuration"),
  code("│   ├── credits.ts                # Credit CRUD & atomic transactions"),
  code("│   ├── generations.ts             # Generation history CRUD"),
  code("│   ├── fal.ts                    # fal.ai client — image generation"),
  code("│   ├── prompts.ts                 # Prompt builders for AI models"),
  code("│   ├── pricing.ts                 # Credit costs & purchasable plans"),
  code("│   ├── export.ts                 # CSV/JSON export for marketplaces"),
  code("│   ├── cloudflare.ts             # R2 file upload/delete"),
  code("│   ├── razorpay.ts               # Razorpay client, orders, signature verification"),
  code("│   └── email.ts                  # Resend email (receipts, OTPs)"),
  code("└── public/                       # Static assets"),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — TECH STACK
  // ══════════════════════════════════════════════════════════════
  h1("3. Tech Stack"),

  h2("3.1  Frontend"),
  threeColTable(
    ["Technology", "Version", "Purpose"],
    [
      ["Next.js", "latest (App Router)", "React framework with server components & route handlers"],
      ["React", "latest", "UI library"],
      ["TypeScript", "latest", "Type safety across the codebase"],
      ["CSS Modules", "globals.css", "Styling — custom design system, no Tailwind"],
      ["GSAP + @gsap/react", "^3.15", "Scroll-triggered and entrance animations"],
      ["Motion", "^12.x", "Micro-interactions and transitions"],
      ["driver.js", "^1.8", "Onboarding tour overlay"],
      ["JSZip", "^3.10", "Client-side ZIP generation for bulk downloads"],
    ],
    [28, 20, 52]
  ),

  spacer(),
  h2("3.2  Backend & Infrastructure"),
  threeColTable(
    ["Technology", "Purpose"],
    [
      ["NextAuth.js v5 (beta)", "Authentication — Credentials provider + Google OAuth"],
      ["MongoDB + @mongodb-adapter", "Database — users, credits, generations, listings"],
      ["Cloudflare R2 (S3 API)", "Object storage — generated image files"],
      ["fal.ai client", "Image generation — nano-banana (basic) + GPT Image 2 (A+)"],
      ["Google Gemini 3.5 Flash", "Photo vision analysis + listing text generation"],
      ["Razorpay", "Payments — INR Orders + Checkout modal, webhooks (no billing portal)"],
      ["Resend", "Transactional email — purchase receipts"],
      ["sharp", "^0.35", "Server-side image resizing (A+ image post-processing)"],
    ],
    [35, 65]
  ),

  spacer(),
  h2("3.3  Development Tools"),
  threeColTable(
    ["Tool", "Purpose"],
    [
      ["ESLint", "Code linting"],
      ["TypeScript", "Static type checking"],
      ["bcryptjs", "Password hashing for credential auth"],
    ],
    [35, 65]
  ),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — ENVIRONMENT VARIABLES
  // ══════════════════════════════════════════════════════════════
  h1("4. Environment Variables"),

  p("All configuration is managed via environment variables in a .env.local file. Required variables are grouped by service."),

  spacer(),
  callout("Required Setup", "Copy .env.example to .env.local and fill in all values before running the application in production. Never commit .env files to version control.", LIGHT, "DC2626"),

  spacer(),
  h2("4.1  Database"),
  twoColTable([
    ["MONGODB_URI", "Full MongoDB connection string (mongodb+srv://... or mongodb://...)"],
    ["MONGODB_DB_NAME", "Name of the MongoDB database (e.g. image-generation)"],
  ]),

  spacer(),
  h2("4.2  Authentication (NextAuth)"),
  twoColTable([
    ["AUTH_SECRET", "Random secret for NextAuth session encryption (openssl rand -base64 32)"],
    ["AUTH_URL", "Public URL of the app (https://yourdomain.com) — used for OAuth redirects"],
    ["GOOGLE_CLIENT_ID", "Google OAuth Client ID from Google Cloud Console"],
    ["GOOGLE_CLIENT_SECRET", "Google OAuth Client Secret"],
  ]),

  spacer(),
  h2("4.3  Image Generation (fal.ai)"),
  twoColTable([
    ["FAL_KEY", "fal.ai API key (get one at fal.ai) — used for both nano-banana and GPT Image 2"],
    ["FAL_IMAGE_MODEL", "Optional override for the basic image model (default: fal-ai/nano-banana/edit)"],
  ]),

  spacer(),
  h2("4.4  AI Providers"),
  twoColTable([
    ["GEMINI_API_KEY", "Google AI Studio API key (get one at aistudio.google.com/apikey) — used for Gemini Vision (photo analysis) and Gemini Flash (listing copy generation)"],
  ]),

  spacer(),
  h2("4.5  Cloud Storage (Cloudflare R2)"),
  twoColTable([
    ["R2_ACCOUNT_ID", "Cloudflare account ID for R2 API"],
    ["R2_ACCESS_KEY_ID", "R2 API token access key ID"],
    ["R2_SECRET_ACCESS_KEY", "R2 API token secret access key"],
    ["R2_BUCKET_NAME", "R2 bucket name (e.g. generated-images)"],
    ["R2_PUBLIC_URL", "Optional custom public base URL for R2 objects (e.g. https://cdn.yourdomain.com) — if not set, uses the default R2.dev public URL"],
  ]),

  spacer(),
  h2("4.6  Payments (Razorpay)"),
  twoColTable([
    ["RAZORPAY_KEY_ID", "Razorpay key ID (rzp_live_... or rzp_test_...) — used client + server side"],
    ["RAZORPAY_KEY_SECRET", "Razorpay key secret — backend only"],
    ["RAZORPAY_WEBHOOK_SECRET", "Webhook signing secret from dashboard.razorpay.com/app/webhooks"],
  ]),

  spacer(),
  h2("4.7  Email (Resend)"),
  twoColTable([
    ["RESEND_API_KEY", "Resend API key for transactional email (receipts, OTPs)"],
    ["EMAIL_FROM", "Sender email address (e.g. VendorFlow <hello@productvisuals.ai>)"],
  ]),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — DATA STORAGE
  // ══════════════════════════════════════════════════════════════
  h1("5. Data Storage"),

  p("VendorFlow uses MongoDB as its primary database. There is no ORM — all database operations are performed directly via the official mongodb Node.js driver. The lib/mongodb.ts file exports a singleton connection promise that is reused across all API routes."),

  spacer(),
  h2("5.1  Collections"),

  threeColTable(
    ["Collection", "Purpose", "Key Fields"],
    [
      ["users (NextAuth)", "NextAuth user documents", "email, name, image, emailVerified"],
      ["userCredits", "Per-user credit balance", "userId, balance, welcomeBonusShown, createdAt, updatedAt"],
      ["creditTransactions", "Immutable audit log of all credit changes", "userId, type (grant|charge|refund), amount, description, generationId, priceInr, planId, createdAt"],
      ["generations", "Each image generation batch", "userId, productName, category, marketplaces, background, listings, createdAt"],
      ["generationImages", "Individual images per generation", "generationId, type, mimeType, storageKey, url, isAplus, createdAt"],
    ],
    [22, 42, 36]
  ),

  spacer(),
  h2("5.2  Generation Image Storage (Cloudflare R2)"),

  p("Generated images are stored in Cloudflare R2, not in MongoDB. This keeps the database lightweight and avoids MongoDB's 16 MB document limit."),

  twoColTable([
    ["Storage key format", "<userId>/<generationId>/basic-<index>.png"],
    ["Example", "abc123/550e8400-e29b/basic-0.png"],
    ["Public URL format", "https://<R2_PUBLIC_URL>/<storageKey>"],
    ["Retention", "The most recent 5 generations per user are kept; older ones are automatically deleted from R2 and MongoDB via pruneOldGenerations()"],
  ]),

  spacer(),
  h2("5.3  Image Types & Storage Paths"),

  threeColTable(
    ["Image Category", "Storage Path", "Notes"],
    [
      ["Basic images (nano-banana)", "<userId>/<genId>/basic-<N>.<ext>", "Standard product listing images"],
      ["A+ images (GPT Image 2)", "<userId>/<genId>/aplus-<N>.png", "Premium Amazon/Flipkart A+ banners"],
      ["Reference uploads (temp)", "Temporary fal.storage URLs", "Short-lived pre-signed URLs used only during generation; not persisted"],
    ],
    [25, 35, 40]
  ),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 6 — AUTHENTICATION
  // ══════════════════════════════════════════════════════════════
  h1("6. Authentication"),

  p("VendorFlow uses NextAuth.js v5 (beta) with two authentication providers:"),

  spacer(),
  h2("6.1  Providers"),

  threeColTable(
    ["Provider", "Type", "Notes"],
    [
      ["Credentials", "Email + Password", "Passwords hashed with bcryptjs. Registration via /api/auth/register creates the user and then signs in automatically."],
      ["Google OAuth", "Social Login", "Standard OAuth 2.0. User is created on first sign-in via the events.createUser callback."],
    ],
    [20, 20, 60]
  ),

  spacer(),
  h2("6.2  User Creation Flow"),

  numbered("User submits email + password on /login", 1),
  p([new TextRun({ text: "POST /api/auth/register", color: BRAND, size: 20, font: "Courier New" }), new TextRun({ text: " — creates user in MongoDB", color: MID, size: 20 })], { before: 20 }),
  numbered("On success, auto-sign-in via signIn('credentials', ...)", 2),
  numbered("NextAuth events.createUser callback fires — grants welcome bonus (1 free credit) and shows popup on first login", 3),
  numbered("Session cookie issued; user redirected to /studio", 4),

  spacer(),
  h2("6.3  Route Protection"),

  p("All /api/* routes (except /api/auth/*) and the /studio and /credits pages are protected. The auth() function from lib/auth.ts is called at the top of every route handler. Unauthenticated requests receive a 401 response."),

  code("const session = await auth();"),
  code("if (!session?.user?.id) {"),
  code("  return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });"),
  code("}"),

  spacer(),
  h2("6.4  Welcome Bonus"),

  p("On first registration, a 1-credit welcome bonus is granted atomically using MongoDB's upsert with $setOnInsert. This ensures the bonus is granted exactly once — even if the user registers twice or triggers the callback multiple times."),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 7 — CREDITS & BILLING
  // ══════════════════════════════════════════════════════════════
  h1("7. Credits & Billing"),

  h2("7.1  Credit System Overview"),

  p("Credits are the sole currency of VendorFlow. They are deducted before generation begins and refunded if generation fails. Credits never expire."),

  spacer(),
  callout("Pricing", "1 basic image = 1 credit  |  1 A+ image = 5 credits  |  Credits are GST-inclusive (18% Indian GST included in plan prices)", LIGHT, BRAND),

  spacer(),
  h2("7.2  Image Cost Matrix"),

  threeColTable(
    ["Image Category", "AI Model", "Cost per Image"],
    [
      ["Basic product images (e.g. Main Product, Front/Side Angle, Lifestyle)", "nano-banana (fal.ai)", "1 Credit"],
      ["A+ listing images (Amazon Standard Banner, Three Image Module, etc.)", "GPT Image 2 (fal.ai)", "5 Credits"],
      ["Flipkart RPD banners (Hero Banner, Feature Banners, Infographics, etc.)", "GPT Image 2 (fal.ai)", "5 Credits"],
    ],
    [45, 30, 25]
  ),

  spacer(),
  h2("7.3  Credit Pack Plans"),

  fourColTable(
    ["Plan", "Price (Inclusive GST)", "Credits", "Bonus"],
    [
      ["Starter", "₹400", "20", "—"],
      ["Growth (Popular)", "₹1,000", "55", "+5 bonus"],
      ["Pro", "₹2,000", "115", "+15 bonus"],
      ["Business", "₹5,000", "300", "+50 bonus"],
    ],
    [20, 28, 22, 30]
  ),

  spacer(),
  h2("7.4  Atomic Credit Operations"),

  p("Credit charges and refunds use MongoDB's findOneAndUpdate with atomic guards to prevent race conditions:"),

  bullet("chargeUserCredits — deducts credits only if balance >= required amount in a single atomic operation"),
  bullet("addUserCredits — increments balance and is guarded by the Razorpay payment ID (idempotency key) to prevent double-crediting on webhook/verify retries"),
  bullet("refundUserCredits — restores credits when generation fails after charging"),

  spacer(),
  h2("7.5  Razorpay Payment Flow"),

  numbered("User selects a plan on /credits and clicks Buy", 1),
  numbered("POST /api/razorpay/checkout — creates a Razorpay order for the plan's INR amount, returns order/key details", 2),
  numbered("Client opens the Razorpay Checkout modal in-page using those details (INR currency)", 3),
  numbered("On success, client calls POST /api/razorpay/checkout with action: 'verify' — validates the HMAC signature, re-fetches the order/payment from Razorpay, and re-checks amount + userId", 4),
  numbered("Credits are added via addUserCredits (idempotent by payment ID) → receipt email sent via Resend", 5),
  numbered("A payment.captured webhook at /api/razorpay/webhook acts as a backup in case the client-side verify call never completes", 6),
  numbered("User sees the success state on /credits?success=true with updated balance", 7),

  spacer(),
  h2("7.6  GST / Invoice Handling"),

  p("All displayed plan prices include 18% GST. The GST is split into CGST + SGST components for the digital receipt (via splitGstInclusive() in lib/pricing.ts). Receipts are emailed via Resend after successful payment and can also be viewed as an in-app modal on the /credits page."),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 8 — CORE FEATURES
  // ══════════════════════════════════════════════════════════════
  h1("8. Core Features"),

  h2("8.1  Studio — Image Generation Form"),

  p("The /studio page is the primary user workspace. It contains a multi-section form for building a generation brief:"),

  threeColTable(
    ["Section", "Fields", "Notes"],
    [
      ["Product Photos", "Up to 12 images (drag & drop + click-to-upload)", "Auto-detected by the AI analyzer on click"],
      ["Logo (optional)", "Single image", "Overlaid on A+ banner images"],
      ["Product Basics", "Product name, Category, Brand name, SKU", "Required fields"],
      ["Marketplace", "Amazon / Flipkart / Meesho (single select)", "Changes the image type options shown"],
      ["Background", "Pure White, Transparent, Lifestyle, Gradient, Custom Color", "Affects AI prompt for all generated images"],
      ["Features, Color & Specs", "Key features (chips), product colors (chips), material, dimensions, weight", "Auto-filled from photo analysis"],
      ["Brand Look & Feel", "Brand colors (chips), font style", "Used for A+ image text overlays"],
      ["Custom Prompt", "Free-text textarea", "Appended to all AI prompts; overrides defaults"],
      ["Basic Images", "Checkbox grid of 9 image types", " nano-banana — 1 credit each"],
      ["A+ Images", "Checkbox grid of 5 module types", "GPT Image 2 — 5 credits each; Amazon only"],
      ["Flipkart Gallery", "8 gallery slots + 11 RPD module types", "Gallery = nano-banana; RPD = GPT Image 2"],
      ["Meesho Gallery", "8 gallery + 8 infographic types", "All nano-banana at basic pricing"],
      ["Style Preferences", "AI style, text overlay option, language", "Applied across all images"],
      ["Output Settings", "Variant sets, quantity per set, format (PNG/JPG/WebP), resolution", "Size presets + custom dimensions for basic images"],
      ["Optional Listing Details", "Description, target audience, pricing, warranty, COO, package contents", "Used by the listing generation AI"],
    ],
    [22, 38, 40]
  ),

  spacer(),
  h2("8.2  Photo Analysis (Gemini Vision)"),

  p("Clicking 'Analyze Photos' sends all uploaded images to the Gemini 3.5 Flash Vision API, which extracts:"),

  bullet("Product type, brand, material, color(s), pattern"),
  bullet("Estimated dimensions and weight"),
  bullet("Target audience and gender"),
  bullet("Key features (up to 6)"),
  bullet("Packaging type, accessories, country of origin, warranty"),
  bullet("Confidence scores per field (high/medium/low)"),

  p("Extracted fields are auto-populated into the listing brief form, and a toast notification confirms which fields were filled."),

  spacer(),
  h2("8.3  Image Generation (fal.ai)"),

  p("Two AI models are used depending on the image type selected:"),

  threeColTable(
    ["Model", "Provider", "Image Types", "Max Concurrent"],
    [
      ["nano-banana/edit", "fal.ai", "Basic product images (main shot, angles, lifestyle, infographics)", "4"],
      ["gpt-image-2/edit", "fal.ai", "A+ / RPD premium banners (GPT Image 2)", "4"],
    ],
    [25, 20, 40, 15]
  ),

  p("The generation pipeline processes images concurrently (up to 4 at a time). Reference images are uploaded to fal.storage first, then used as input URLs in the model calls."),

  spacer(),
  h2("8.4  Listing Text Generation (Gemini Flash)"),

  p("Clicking 'Generate Listing Text' sends the full brief (product metadata + user inputs) to Gemini 3.5 Flash with a marketplace-specific system prompt. Separate listings are generated for Amazon, Flipkart, and Meesho simultaneously via Promise.allSettled."),

  bullet("Amazon: Title (≤200 chars), 5 bullet points (≤500 chars each), description (≤2000 chars), SEO title (≤50 chars), SEO description (≤160 chars), backend keywords"),
  bullet("Flipkart: Title (≤100 chars), 5–8 highlights, description, SEO title, SEO description"),
  bullet("Meesho: Title (≤80 chars), persuasive Hinglish description, highlights — optimized for value-conscious Tier 2–4 buyers"),

  spacer(),
  h2("8.5  Generation History"),

  p("Every completed generation is saved to MongoDB and appears in the history sidebar. Clicking a history item reloads its images and (if available) its listing text. Old generations beyond the 5 most recent are automatically pruned, with images deleted from R2."),

  spacer(),
  h2("8.6  Download & Export"),

  bullet("Single image — click the download button on any image tile"),
  bullet("All images as ZIP — click 'Download ZIP' to bundle all images"),
  bullet("Listing CSV — export Amazon TSV, Flipkart TSV, or Meesho TSV for bulk upload tools"),
  bullet("Listing JSON — export all listing data as structured JSON"),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 9 — API REFERENCE
  // ══════════════════════════════════════════════════════════════
  h1("9. API Reference"),

  h2("9.1  POST /api/generate"),
  p("Generates a batch of product images. Requires authentication."),

  code("POST /api/generate"),
  code("Content-Type: multipart/form-data"),
  code(""),
  code("Fields:"),
  code("  brief         — JSON string of GenerationBrief object"),
  code("  photos        — Image File(s) (up to 12)"),

  spacer(),
  p("GenerationBrief object:"),
  twoColTable([
    ["productName", "string — required"],
    ["category", "string — required"],
    ["marketplaces", "string[] — required"],
    ["imageTypes", "string[] — required, max 12"],
    ["brandName", "string (optional)"],
    ["sku", "string (optional)"],
    ["background", "string (default: 'Pure White')"],
    ["customBackgroundColor", "string (hex, e.g. #FF5733)"],
    ["material", "string (optional)"],
    ["dimensions", "string (optional)"],
    ["weight", "string (optional)"],
    ["aiStyle", "string (default: 'Minimal')"],
    ["textOnImage", "string (default: 'No Text')"],
    ["language", "string (default: 'English')"],
    ["imageFormat", "string (default: 'PNG')"],
    ["resolution", "string ('Standard'|'HD'|'4K')"],
    ["customWidth", "number (optional, px)"],
    ["customHeight", "number (optional, px)"],
    ["keyFeatures", "string[]"],
    ["productColors", "string[]"],
    ["brandColors", "string[]"],
    ["customPrompt", "string — appended to all AI prompts"],
  ], 35, 65),

  spacer(),
  p("Success response (200):"),
  code('{ "id": "<mongodb_id>", "images": [...], "generationId": "<uuid>", "creditsUsed": <N>, "newBalance": <N> }'),

  spacer(),
  p("Error responses:"),
  twoColTable([
    ["401", "Not authenticated"],
    ["400", "Missing or invalid brief / photos"],
    ["402", "Insufficient credits — returns required amount"],
    ["503", "fal.ai not configured"],
    ["502", "AI generation failed — credits are refunded"],
  ], 15, 85),

  spacer(),
  h2("9.2  POST /api/analyze"),
  p("Analyzes uploaded photos with Gemini Vision to extract product metadata. Requires authentication."),

  code("POST /api/analyze"),
  code("Content-Type: multipart/form-data"),
  code(""),
  code("Fields:"),
  code("  photos — Image File(s), max 8"),

  spacer(),
  p("Success response (200) — ProductAnalysis object:"),
  code('{'),
  code('  "productType": "string",'),
  code('  "brand": "string",'),
  code('  "color": "string",'),
  code('  "material": "string",'),
  code('  "dimensions": "string",'),
  code('  "weight": "string",'),
  code('  "targetAudience": "string",'),
  code('  "keyFeatures": ["string", ...],'),
  code('  "countryOfOrigin": "string",'),
  code('  "warranty": "string",'),
  code('  "confidence": { "<field>": "high|medium|low", ... }'),
  code('}'),

  spacer(),
  h2("9.3  POST /api/listing"),
  p("Generates AI-written marketplace listing copy for Amazon, Flipkart, and Meesho. Requires authentication."),

  code("POST /api/listing"),
  code("Content-Type: application/json"),
  code("{"),
  code('  "brief": { ...GenerationBrief },'),
  code('  "generationId": "<optional — attaches listing to existing generation>"'),
  code("}"),

  spacer(),
  p("Success response (200) — AllListings object:"),
  code('{'),
  code('  "amazon": { "title", "bullets", "description", "keywords", "seoTitle", "seoDescription" },'),
  code('  "flipkart": { "title", "highlights", "description", "seoTitle", "seoDescription" },'),
  code('  "meesho": { "title", "description", "highlights" },'),
  code('  "id": "<generationId>"'),
  code('}'),

  spacer(),
  h2("9.4  GET /api/credits"),
  p("Returns the authenticated user's credit balance and recent transaction history."),

  code("GET /api/credits"),
  code(""),
  code("Response:"),
  code('{ "balance": <N>, "pricing": { "basic": 1, "aplus": 5 }, "transactions": [...] }'),

  spacer(),
  h2("9.5  GET /api/credits/welcome"),
  p("Checks whether the welcome bonus popup should be shown (fires once per user)."),

  code("GET /api/credits/welcome"),
  code(""),
  code('Response: { "show": true | false }'),

  spacer(),
  h2("9.6  GET /api/history"),
  p("Returns a list of the user's recent generation summaries (without image data)."),

  code("GET /api/history"),
  code(""),
  code("Response: [{ id, productName, category, marketplaces, createdAt, thumbnail, imageCount, hasListing }, ...]"),

  spacer(),
  h2("9.7  GET /api/history/[id]"),
  p("Returns a single generation with full image URLs and listing text."),

  code("GET /api/history/[id]"),
  code(""),
  code("{ id, productName, category, marketplaces, createdAt, images: [...], listings: {...} }"),

  spacer(),
  h2("9.8  POST /api/razorpay/checkout"),
  p("Creates a Razorpay order for purchasing a credit pack, or (with action: 'verify') verifies a completed payment. Requires authentication."),

  code("POST /api/razorpay/checkout"),
  code('Content-Type: application/json'),
  code('{ "plan": "starter" | "growth" | "pro" | "business" }'),
  code(""),
  code('Response: { keyId, orderId, amount, currency, name, description, prefill }'),
  code(""),
  code("POST /api/razorpay/checkout (verify)"),
  code('{ "action": "verify", "orderId", "paymentId", "signature" }'),
  code(""),
  code('Response: { success, newBalance, alreadyProcessed }'),

  spacer(),
  h2("9.9  POST /api/razorpay/webhook"),
  p("Handles Razorpay payment.captured events as a backup to client-side verification. Idempotent via payment ID. Sends a receipt email via Resend."),

  code("POST /api/razorpay/webhook"),
  code("X-Razorpay-Signature: <hmac>"),
  code(""),
  code("// Internal: adds credits, sends receipt, marks payment as processed"),

  spacer(),
  h2("9.10  POST /api/razorpay/portal"),
  p("Razorpay has no hosted billing-portal equivalent to Stripe's — this endpoint always returns 404. Receipts are viewed via the in-app credit purchase history instead."),

  code("POST /api/razorpay/portal"),
  code('Response (404): { "error": "Razorpay does not provide a customer billing portal..." }'),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 10 — MARKETPLACE INTEGRATIONS
  // ══════════════════════════════════════════════════════════════
  h1("10. Marketplace Integrations"),

  h2("10.1  Amazon India"),

  p("Amazon is the most image-format-diverse integration, with separate pipelines for basic product listing images and premium A+ Content."),

  spacer(),
  h3("Basic Product Images — nano-banana"),
  threeColTable(
    ["Image Type", "Aspect Ratio", "Notes"],
    [
      ["Main Product (White Background)", "1:1 (1024×1024)", "Required hero image — pure white BG"],
      ["Front/Side Angle", "3:2", "Alternate product view"],
      ["Key Features Infographic", "1:1", "Text overlay with key selling points"],
      ["Dimensions", "3:2", "Show size/scale for buyer confidence"],
      ["Product in Use (Lifestyle)", "3:2", "Lifestyle context shot"],
      ["Close-up / Material Quality", "1:1", "Texture and build quality detail"],
      ["What's in the Box", "3:2", "Packaging contents"],
      ["Comparison / Benefits", "3:2", "Side-by-side or benefit callout"],
      ["Brand Story / Warranty", "2:3 (portrait)", "Brand and warranty information"],
    ],
    [35, 18, 47]
  ),

  spacer(),
  h3("A+ Content Images — GPT Image 2"),
  threeColTable(
    ["Module Type", "Dimensions", "Credits"],
    [
      ["Standard Banner", "970×300", "5"],
      ["Banner with Text Overlay", "970×300", "5"],
      ["Standard Image & Text", "1000×1000", "5"],
      ["Three Image Module", "1464×400", "5"],
      ["Four Image Module", "1464×800", "5"],
    ],
    [45, 30, 25]
  ),

  p("GPT Image 2 requires sizes that are multiples of 16 with total pixels between 655,360 and 8,294,400. The app requests the closest compliant size and crops to the exact Amazon spec using sharp after generation."),

  spacer(),
  h3("Amazon Export Format"),
  p("Amazon listings are exported as a tab-separated values (TSV) file with a UTF-8 BOM, ready for direct upload to Amazon Seller Central. Includes all standard catalog fields: SKU, brand, product name, description, 5 bullet points, search terms, dimensions, weight, COO, and warranty."),

  spacer(),
  hr(),
  spacer(),
  h2("10.2  Flipkart"),

  p("Flipkart's integration uses a two-tier image approach: a standard product gallery (1:1 square format) and a Rich Product Description (RPD) section with banner-style infographics."),

  spacer(),
  h3("Flipkart Product Gallery — nano-banana"),
  threeColTable(
    ["Image Type", "Format", "Notes"],
    [
      ["Hero Image", "1024×1024", "Primary listing image — white background"],
      ["Front/Alternate Angle", "1024×1024", "Additional product view"],
      ["Side View, Back View", "1024×1024", "Full product coverage"],
      ["Close-up / Macro", "1024×1024", "Detail and quality shots"],
      ["Lifestyle Image", "1024×1024", "In-context usage shot"],
      ["Dimension Image, Package/What's Included", "1024×1024", "Specifications and packaging"],
    ],
    [38, 22, 40]
  ),

  spacer(),
  h3("Flipkart RPD Modules — GPT Image 2"),
  threeColTable(
    ["Module Type", "Dimensions", "Credits"],
    [
      ["Hero Banner", "1440×600", "5"],
      ["Feature Banner (×4)", "1200×600", "5 each"],
      ["Lifestyle Banner", "1200×600", "5"],
      ["Infographic", "1200×1200", "5"],
      ["Dimensions Graphic", "1200×1200", "5"],
      ["Comparison Chart", "1200×1200", "5"],
      ["Brand Story", "1440×600", "5"],
      ["FAQ Graphic", "1200×1200", "5"],
      ["Warranty / Trust", "1200×1200", "5"],
    ],
    [35, 22, 43]
  ),

  spacer(),
  h3("Flipkart Export Format"),
  p("Flipkart listings are exported as TSV with: product name, description, brand, category, MRP, selling price, highlights, stock quantity, manufacturer details, COO, warranty, weight, and dimensions."),

  spacer(),
  hr(),
  spacer(),
  h2("10.3  Meesho"),

  p("Meesho targets value-conscious buyers in Tier 2–4 Indian cities. Listings use a Hinglish style and are optimized for social-commerce discovery. Meesho has no A+ content section — all informational graphics are part of the standard product gallery."),

  spacer(),
  h3("Meesho Product Gallery — nano-banana"),
  threeColTable(
    ["Image Type", "Format", "Notes"],
    [
      ["Hero Image, Front View, Back View, Side View", "1000×1000", "Core product views — white/light background"],
      ["Close-up, Lifestyle, Size/Dimension, Package/What's Included", "1000×1000", "Detail and usage context"],
    ],
    [55, 20, 25]
  ),

  spacer(),
  h3("Meesho Infographics — nano-banana (same pricing)"),
  threeColTable(
    ["Image Type", "Notes"],
    [
      ["Feature Highlights, Material Details, Fabric Composition, Size Chart", "Core informational graphics"],
      ["Usage Instructions, Wash Care, Color Variants, Package Contents", "Value-add images for buyer confidence"],
    ],
    [50, 50]
  ),

  spacer(),
  h3("Meesho Export Format"),
  p("Meesho listings are exported as TSV with: title (≤80 chars), persuasive Hinglish description, category, MRP, selling price, discount %, stock, COO, and highlights. The title is optimized for the Meesho search algorithm and typically includes a price indicator."),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 11 — AI MODELS
  // ══════════════════════════════════════════════════════════════
  h1("11. AI Models"),

  h2("11.1  fal.ai — Image Generation"),

  threeColTable(
    ["Model", "Use Case", "Max Concurrent"],
    [
      ["fal-ai/nano-banana/edit", "Basic product listing images", "4"],
      ["fal-ai/gpt-image-2/edit", "Premium A+ / RPD banner images", "4"],
    ],
    [35, 45, 20]
  ),

  spacer(),
  p("Both models use the edit (image-to-image) mode, taking a reference photo and an AI prompt as input. Reference images are uploaded to fal.storage and passed as URLs."),

  spacer(),
  h2("11.2  Google Gemini 3.5 Flash"),

  threeColTable(
    ["Mode", "Endpoint", "Use Case"],
    [
      ["Vision (multimodal)", "generativelanguage.googleapis.com", "Photo analysis — extracts product metadata from uploaded photos"],
      ["Text", "generativelanguage.googleapis.com", "Listing copy generation — titles, bullets, descriptions, keywords, SEO metadata"],
    ],
    [20, 35, 45]
  ),

  spacer(),
  h2("11.3  Prompt Engineering"),

  p("The lib/prompts.ts file contains buildImagePrompt() and buildAplusPrompt() which construct detailed, structured prompts from the user-supplied brief. Prompts include:"),

  bullet("Product name, brand, category, and target marketplace"),
  bullet("Background type (white, lifestyle, gradient, etc.)"),
  bullet("Key features and color information"),
  bullet("Target audience and use context"),
  bullet("Output format and aspect ratio"),
  bullet("Style guidance (Minimal, Premium, Luxury, Modern, Colorful, Professional)"),
  bullet("Text overlay instructions (from the 'Text on image' preference)"),
  bullet("Custom user prompt (appended verbatim to allow full overrides)"),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 12 — USER FLOWS
  // ══════════════════════════════════════════════════════════════
  h1("12. User Flows"),

  h2("12.1  First-Time User Journey"),

  threeColTable(
    ["Step", "Action", "Outcome"],
    [
      ["1", "Visit site → click Sign Up", "Navigate to /login with ?mode=register"],
      ["2", "Enter email + password → Create Account", "User created in MongoDB; welcome bonus (1 credit) granted; auto-signed in"],
      ["3", "Welcome modal appears", "CreditWelcomeModal shows the 1 free credit bonus; dismissable"],
      ["4", "Redirected to /studio", "Onboarding tour highlights the upload zone, brief form, and image type selector"],
      ["5", "Upload 1 product photo", "Drop zone or click-to-upload; max 12 images"],
      ["6 (optional)", "Click Analyze Photos", "Gemini Vision extracts product type, brand, material, color, features; form auto-fills"],
      ["7", "Fill product name, category, marketplace", "Required fields — others pre-filled from step 6"],
      ["8", "Select image types (checkboxes)", "Basic images (1 credit each) or A+ images (5 credits each)"],
      ["9", "Click Generate Images", "Credits deducted; images generated concurrently via fal.ai; saved to R2 and MongoDB"],
      ["10", "Images appear in gallery", "Lightbox on click; download ZIP or individual images"],
    ],
    [8, 46, 46]
  ),

  spacer(),
  h2("12.2  Credit Purchase Flow"),

  threeColTable(
    ["Step", "Action", "Notes"],
    [
      ["1", "Navigate to /credits", "Shows current balance, plan cards, transaction history"],
      ["2", "Click Buy on a plan (e.g. Growth — ₹1,000 for 55 credits + 5 bonus)", "POST /api/razorpay/checkout creates a Razorpay order"],
      ["3", "Razorpay Checkout modal opens in-page (INR)", "Razorpay handles PCI compliance; user enters card/UPI details"],
      ["4", "Payment confirmed by Razorpay", "Client calls checkout API with action: verify + signature"],
      ["5", "Credits added to account", "Idempotent by payment ID — safe against retries; webhook is a backup path"],
      ["6", "Redirect to /credits?success=true", "Balance updates; success banner shown; receipt email sent"],
      ["7", "Optional: click View Bill", "ReceiptModal shows GST breakdown (base amount + CGST + SGST)"],
    ],
    [8, 42, 50]
  ),

  spacer(),
  h2("12.3  Generate → Export Flow"),

  threeColTable(
    ["Step", "Action", "Notes"],
    [
      ["1", "Generate images with full brief", "All marketplace selections and image types included"],
      ["2", "Click Generate Listing Text", "Sends brief to Gemini Flash; generates Amazon + Flipkart + Meesho listings simultaneously"],
      ["3", "Listing panel opens with tabbed view", "Switch between Amazon / Flipkart / Meesho tabs"],
      ["4", "Copy individual fields or copy all", "Click Copy on any field, or 'Copy all' on a section"],
      ["5", "Click Export: Amazon CSV", "Downloads Amazon TSV (UTF-8 BOM) for Seller Central"],
      ["6", "Click Export: Flipkart CSV", "Downloads Flipkart TSV for Flipkart seller panel"],
      ["7", "Click Export: Meesho CSV", "Downloads Meesho TSV for Meesho supplier panel"],
      ["8", "Click Export: JSON", "Downloads all listing data as structured JSON for API integrations"],
    ],
    [8, 35, 57]
  ),

  new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),

  // ══════════════════════════════════════════════════════════════
  // SECTION 13 — SETUP & INSTALLATION
  // ══════════════════════════════════════════════════════════════
  h1("13. Setup & Installation"),

  h2("13.1  Prerequisites"),

  bullet("Node.js 18+ (LTS recommended)"),
  bullet("npm or yarn"),
  bullet("MongoDB instance (local or Atlas)"),
  bullet("Cloudflare account with R2 enabled + API token"),
  bullet("fal.ai account + API key"),
  bullet("Google Cloud project + AI Studio API key"),
  bullet("Razorpay account (test or live mode)"),
  bullet("Resend account (for email receipts)"),

  spacer(),
  h2("13.2  Installation Steps"),

  numbered("Clone the repository and install dependencies", 1),
  code("git clone <repo-url>"),
  code("cd image-generation"),
  code("npm install"),

  spacer(),
  numbered("Configure environment variables", 2),
  code("cp .env.example .env.local"),
  code("# Edit .env.local with all required values (see Section 4)"),

  spacer(),
  numbered("Start the development server", 3),
  code("npm run dev"),
  code("# Open http://localhost:3000"),

  spacer(),
  numbered("Build for production", 4),
  code("npm run build"),
  code("npm start"),

  spacer(),
  h2("13.3  Required Service Sign-Up"),

  threeColTable(
    ["Service", "Sign-Up URL", "Key to Get"],
    [
      ["MongoDB Atlas", "mongodb.com/atlas", "Connection URI (mongodb+srv://...)"],
      ["Cloudflare R2", "dash.cloudflare.com/r2", "Account ID, Access Key, Secret, Bucket Name"],
      ["fal.ai", "fal.ai", "API Key (FAL_KEY)"],
      ["Google AI Studio", "aistudio.google.com/apikey", "API Key (GEMINI_API_KEY) — starts with AIza..."],
      ["Razorpay", "dashboard.razorpay.com/app/keys", "Key ID + Key Secret + Webhook Secret"],
      ["Resend", "resend.com", "API Key"],
      ["Google OAuth", "console.cloud.google.com", "OAuth Client ID + Secret"],
    ],
    [22, 35, 43]
  ),

  spacer(),
  h2("13.4  Razorpay Webhook Setup (Local Testing)"),

  p("To test Razorpay webhooks locally, expose your dev server with a tunnel (e.g. ngrok) and register the URL in the Razorpay dashboard:"),
  code("ngrok http 3000"),
  code("# Add https://<ngrok-id>.ngrok.io/api/razorpay/webhook as a webhook URL"),
  code("# in dashboard.razorpay.com/app/webhooks, subscribed to payment.captured"),
  code("# Copy the webhook secret shown there into RAZORPAY_WEBHOOK_SECRET in .env.local"),

  spacer(),
  h2("13.5  Deployment"),

  p("VendorFlow is a standard Next.js application deployable to any platform that supports Node.js:"),

  threeColTable(
    ["Platform", "Notes"],
    [
      ["Vercel", "Recommended — zero-config Next.js deployment; add env vars in dashboard"],
      ["Railway", "Add MONGODB_URI, R2, Razorpay, fal, Gemini vars as environment variables"],
      ["Render", "Use a Dockerfile or build command: npm run build; start command: npm start"],
      ["Self-hosted (VPS)", "Run npm run build && npm start behind a reverse proxy (nginx/Caddy)"],
    ],
    [25, 75]
  ),

  spacer(),
  h2("13.6  Environment Variable Checklist"),

  fourColTable(
    ["Variable", "Required", "Used In", "Where to Get"],
    [
      ["MONGODB_URI", "Yes", "All API routes", "MongoDB Atlas dashboard"],
      ["MONGODB_DB_NAME", "Yes", "lib/*.ts", "Your choice — must match a database on the cluster"],
      ["AUTH_SECRET", "Yes", "NextAuth", "openssl rand -base64 32"],
      ["AUTH_URL", "Yes", "NextAuth", "Your deployed URL (https://domain.com)"],
      ["GOOGLE_CLIENT_ID", "Yes (OAuth)", "NextAuth", "Google Cloud Console → Credentials"],
      ["GOOGLE_CLIENT_SECRET", "Yes (OAuth)", "NextAuth", "Google Cloud Console → Credentials"],
      ["FAL_KEY", "Yes", "lib/fal.ts", "fal.ai dashboard"],
      ["GEMINI_API_KEY", "Yes", "lib/analyze.ts, lib/listing.ts", "aistudio.google.com/apikey"],
      ["R2_ACCOUNT_ID", "Yes", "lib/cloudflare.ts", "Cloudflare dashboard → R2 overview"],
      ["R2_ACCESS_KEY_ID", "Yes", "lib/cloudflare.ts", "Cloudflare API Token"],
      ["R2_SECRET_ACCESS_KEY", "Yes", "lib/cloudflare.ts", "Cloudflare API Token"],
      ["R2_BUCKET_NAME", "Yes", "lib/cloudflare.ts", "Cloudflare R2 → bucket name"],
      ["RAZORPAY_KEY_ID", "Yes", "lib/razorpay.ts, checkout route", "dashboard.razorpay.com/app/keys"],
      ["RAZORPAY_KEY_SECRET", "Yes", "lib/razorpay.ts, checkout route", "dashboard.razorpay.com/app/keys"],
      ["RAZORPAY_WEBHOOK_SECRET", "Yes (webhooks)", "webhook route", "dashboard.razorpay.com/app/webhooks"],
      ["RESEND_API_KEY", "No (recommended)", "lib/email.ts", "resend.com → API Keys"],
      ["EMAIL_FROM", "No (recommended)", "lib/email.ts", "Your verified domain in Resend"],
    ],
    [30, 12, 30, 28]
  ),

  spacer(2),
  hr(),
  spacer(),
  p([
    new TextRun({ text: "VendorFlow — AI Product Image Generator", color: "94A3B8", size: 18, italics: true }),
    new TextRun({ text: "   |   ", color: "CBD5E1", size: 18 }),
    new TextRun({ text: "Documentation v1.0", color: "94A3B8", size: 18, italics: true }),
    new TextRun({ text: "   |   ", color: "CBD5E1", size: 18 }),
    new TextRun({ text: "hello@productvisuals.ai", color: ACCENT, size: 18 }),
  ], { alignment: AlignmentType.CENTER }),
];

// ── Build document ─────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "VendorFlow Docs",
  title: "VendorFlow — Developer & Platform Documentation",
  description: "Complete technical documentation for the VendorFlow AI Product Image Generator platform.",
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      children,
    },
  ],
});

const outPath = path.join(__dirname, "VendorFlow-Documentation.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Written:", outPath);
  console.log("Size:", Math.round(buf.length / 1024), "KB");
});
