"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ── Colors ────────────────────────────────────────────────────────────────────
const BRAND   = [15,  76, 129];   // #0F4C81
const ACCENT  = [14, 165, 233];   // #0EA5E9
const MID     = [51,  65,  85];    // #334155
const LIGHT   = [241, 245, 249];   // #F1F5F9
const CODE_BG = [30,  41,  59];    // #1E293B
const WHITE   = [255, 255, 255];
const BORDER  = [203, 213, 225];   // #CBD5E1
const CODE_TX = [226, 232, 240];    // #E2E8F0

// ── Layout constants ───────────────────────────────────────────────────────────
const PAGE_W  = 612;  // US Letter: 8.5in
const PAGE_H  = 792;  // US Letter: 11in
const MARGIN_L = 56;
const MARGIN_R = 56;
const MARGIN_T = 56;
const MARGIN_B = 56;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const CODE_FONT = "Courier";
const CODE_SIZE = 8;
const BODY_SIZE = 10;
const H2_SIZE   = 14;
const H1_SIZE   = 18;

// ── State ────────────────────────────────────────────────────────────────────
let doc;
let y = MARGIN_T;
let pageNum = 1;

function newPage() {
  if (doc) {
    doc.addPage();
    pageNum++;
    y = MARGIN_T;
    drawHeader();
    y += 24;
  }
}

function checkPage(needed = 80) {
  if (y + needed > PAGE_H - MARGIN_B) newPage();
}

function drawHeader() {
  // Top thin accent line
  doc.rect(MARGIN_L, MARGIN_T - 8, CONTENT_W, 3).fill(ACCENT);
  // Footer
  const footerY = PAGE_H - MARGIN_B + 8;
  doc.fontSize(8).fillColor(MID).text(
    `VendorFlow — AI Product Image Generator  |  Documentation v1.0`,
    MARGIN_L, footerY, { width: CONTENT_W - 80, align: "left", continued: false }
  );
  doc.text(`${pageNum}`, PAGE_W - MARGIN_R - 20, footerY, { width: 20, align: "right" });
}

// ── Drawing helpers ────────────────────────────────────────────────────────────
function h1(text) {
  checkPage(60);
  y += 6;
  doc.font("Helvetica-Bold").fontSize(H1_SIZE).fillColor(BRAND).text(text, MARGIN_L, y, { width: CONTENT_W });
  y += doc.currentLineHeight() + 2;
  // Underline accent bar
  doc.rect(MARGIN_L, y, CONTENT_W, 2).fill(ACCENT);
  y += 8;
}

function h2(text) {
  checkPage(48);
  y += 10;
  doc.font("Helvetica-Bold").fontSize(H2_SIZE).fillColor(MID).text(text, MARGIN_L, y, { width: CONTENT_W });
  y += doc.currentLineHeight() + 4;
}

function h3(text) {
  checkPage(36);
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(MID).text(text, MARGIN_L, y, { width: CONTENT_W });
  y += doc.currentLineHeight() + 2;
}

function body(text, opts = {}) {
  checkPage(30);
  if (Array.isArray(text)) {
    // Array of { text, font?, size?, color? } objects
    let cx = MARGIN_L;
    let totalWidth = 0;
    text.forEach(t => totalWidth += doc.widthOfString(t.text, t.font || "Helvetica", t.size || BODY_SIZE));
    text.forEach(t => {
      doc.font(t.font || "Helvetica").fontSize(t.size || BODY_SIZE).fillColor(t.color || opts.color || MID);
      doc.text(t.text, cx, y, { width: CONTENT_W, continued: false });
      cx += doc.widthOfString(t.text);
    });
    y += doc.currentLineHeight() + 4;
    return;
  }
  doc.font("Helvetica").fontSize(BODY_SIZE).fillColor(opts.color || MID)
    .text(String(text), MARGIN_L, y, { width: CONTENT_W, align: opts.align || "justify", continued: false });
  y += doc.currentLineHeight() + 4;
}

function spacer(n = 1) {
  y += n * 12;
}

function bullet(text, indent = 16) {
  checkPage(20);
  doc.fontSize(BODY_SIZE).fillColor(MID)
    .text("•  " + text, MARGIN_L + indent, y, { width: CONTENT_W - indent, continued: false });
  y += doc.currentLineHeight() + 2;
}

function numbered(text, n, indent = 16) {
  checkPage(20);
  doc.fontSize(BODY_SIZE).fillColor(MID)
    .text(`${n}.  ${text}`, MARGIN_L + indent, y, { width: CONTENT_W - indent, continued: false });
  y += doc.currentLineHeight() + 2;
}

function code(text, indent = 0) {
  const lines = text.split("\n");
  const boxH = lines.length * (CODE_SIZE + 4) + 12;
  checkPage(boxH + 10);

  const bx = MARGIN_L + indent;
  const bw = CONTENT_W - indent;

  // Background
  doc.rect(bx, y, bw, boxH).fill(CODE_BG);
  // Text
  doc.font(CODE_FONT).fontSize(CODE_SIZE).fillColor(CODE_TX);
  lines.forEach((line, i) => {
    doc.text(line, bx + 8, y + 6 + i * (CODE_SIZE + 4), { width: bw - 16, continued: false });
  });
  y += boxH + 6;
  doc.font("Helvetica").fontSize(BODY_SIZE).fillColor(MID);
}

function hr() {
  checkPage(20);
  doc.rect(MARGIN_L, y, CONTENT_W, 1).fill(BORDER);
  y += 16;
}

// ── Two-column table ────────────────────────────────────────────────────────────
function twoColTable(rows, col1W = 0.35, col2W = 0.65) {
  const rowH = 22;
  const totalRows = 1 + rows.length;
  const needed = totalRows * rowH + 20;
  checkPage(needed);

  const c1px = Math.floor(CONTENT_W * col1W);
  const c2px = CONTENT_W - c1px;
  const headerY = y;

  // Header row
  doc.rect(MARGIN_L, y, c1px, rowH).fill(BRAND);
  doc.rect(MARGIN_L + c1px, y, c2px, rowH).fill(BRAND);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text("Field", MARGIN_L + 6, y + 6, { width: c1px - 12 });
  doc.text("Description", MARGIN_L + c1px + 6, y + 6, { width: c2px - 12 });
  y += rowH;

  rows.forEach(([a, b], i) => {
    const bg = i % 2 === 0 ? LIGHT : WHITE;
    doc.rect(MARGIN_L, y, c1px, rowH).fill(bg);
    doc.rect(MARGIN_L + c1px, y, c2px, rowH).fill(bg);
    doc.fontSize(9).fillColor(MID).text(String(a), MARGIN_L + 6, y + 5, { width: c1px - 12 });
    doc.text(String(b), MARGIN_L + c1px + 6, y + 5, { width: c2px - 12 });
    y += rowH;
  });

  // Border
  doc.rect(MARGIN_L, headerY, c1px, rows.length * rowH + rowH).stroke(BORDER);
  doc.rect(MARGIN_L + c1px, headerY, c2px, rows.length * rowH + rowH).stroke(BORDER);

  y += 12;
  doc.fontSize(BODY_SIZE).fillColor(MID);
}

// ── Multi-column table ─────────────────────────────────────────────────────────
function multiColTable(headers, rows, colWidths) {
  // Guard: ensure colWidths matches column count
  if (!colWidths || colWidths.length !== headers.length) {
    console.error("multiColTable width mismatch!", { cols: headers.length, widths: colWidths, headers });
  }
  const rowH = 22;
  const totalRows = 1 + rows.length;
  const needed = totalRows * rowH + 20;
  checkPage(needed);

  // Convert fractions to px — guard against mismatched width arrays
  const safeWidths = headers.map((_, i) =>
    colWidths && i < colWidths.length && typeof colWidths[i] === "number"
      ? (colWidths[i] <= 1 ? Math.floor(CONTENT_W * colWidths[i]) : colWidths[i])
      : Math.floor(CONTENT_W / headers.length)
  );
  if (!colWidths || colWidths.length !== headers.length) {
    console.error("Width mismatch — headers:", headers.length, "widths:", colWidths, "→ using equal split");
  }
  const headerY = y;

  // Header
  let x = MARGIN_L;
  headers.forEach((h, i) => {
    const w = safeWidths[i];
    doc.rect(x, y, w, rowH).fill(BRAND);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text(h, x + 4, y + 5, { width: w - 8 });
    x += w;
  });
  y += rowH;

  // Data rows
  rows.forEach((row, ri) => {
    x = MARGIN_L;
    const bg = ri % 2 === 0 ? LIGHT : WHITE;
    row.forEach((cell, ci) => {
      const w = safeWidths[ci];
      doc.rect(x, y, w, rowH).fill(bg);
      doc.fontSize(9).fillColor(MID).text(String(cell), x + 4, y + 5, { width: w - 8 });
      x += w;
    });
    y += rowH;
  });

  // Border
  doc.rect(MARGIN_L, headerY, CONTENT_W, (rows.length + 1) * rowH).stroke(BORDER);
  // Vertical dividers
  let divX = MARGIN_L;
  safeWidths.slice(0, -1).forEach(w => {
    divX += w;
    doc.moveTo(divX, headerY).lineTo(divX, headerY + (rows.length + 1) * rowH).stroke(BORDER);
  });

  y += 12;
  doc.fontSize(BODY_SIZE).fillColor(MID);
}

// ── Callout box ───────────────────────────────────────────────────────────────
function callout(label, text, accentColor) {
  // Wrap text manually — pdfkit doesn't expose _wrapText
  const maxW = CONTENT_W - 24;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  doc.font("Helvetica").fontSize(BODY_SIZE);
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (doc.widthOfString(test, "Helvetica", BODY_SIZE) <= maxW) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  const boxH = (lines.length + 1) * (BODY_SIZE + 5) + 20;
  checkPage(boxH + 10);

  const bx = MARGIN_L;
  const bw = CONTENT_W;
  const accentRgb = accentColor || ACCENT;

  doc.rect(bx, y, 4, boxH).fill(accentRgb);
  doc.rect(bx + 4, y, bw - 4, boxH).fill(LIGHT);
  doc.font("Helvetica-Bold").fontSize(BODY_SIZE).fillColor(accentRgb).text(label, bx + 12, y + 8, { width: bw - 24 });
  doc.fontSize(BODY_SIZE).fillColor(MID).text(text, bx + 12, y + 22, { width: bw - 24 });
  y += boxH + 10;
  doc.fontSize(BODY_SIZE).fillColor(MID);
}

// ── Cover page ────────────────────────────────────────────────────────────────
function drawCoverPage() {
  // Background header block
  doc.rect(0, 0, PAGE_W, 300).fill(BRAND);

  // Title
  doc.font("Helvetica-Bold").fontSize(36).fillColor(WHITE)
    .text("VendorFlow", 56, 100, { width: CONTENT_W, align: "center" });
  doc.font("Helvetica").fontSize(18).fillColor(ACCENT)
    .text("AI Product Image Generator", 56, 155, { width: CONTENT_W, align: "center" });
  doc.font("Helvetica").fontSize(13).fillColor([200, 215, 235])
    .text("Developer & Platform Documentation", 56, 185, { width: CONTENT_W, align: "center" });
  doc.font("Helvetica").fontSize(11).fillColor([160, 180, 210])
    .text("Version 1.0  ·  July 2026", 56, 210, { width: CONTENT_W, align: "center" });

  // Bottom info block
  doc.rect(140, 330, 332, 80).fill(LIGHT);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(MID)
    .text("Built with:", 156, 344, { width: CONTENT_W, align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor(BRAND)
    .text("Next.js · MongoDB · Razorpay · fal.ai · Gemini AI · Cloudflare R2", 156, 362, { width: CONTENT_W, align: "center" });

  doc.font("Helvetica").fontSize(10).fillColor(MID)
    .text("hello@productvisuals.ai", 56, 460, { width: CONTENT_W, align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor([150, 160, 175])
    .text("All rights reserved © 2026", 56, 480, { width: CONTENT_W, align: "center" });
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "VendorFlow-Documentation.pdf");
doc = new PDFDocument({
  size: "LETTER",
  margins: { top: MARGIN_T, bottom: MARGIN_B, left: MARGIN_L, right: MARGIN_R },
  info: {
    Title: "VendorFlow — Developer & Platform Documentation",
    Author: "VendorFlow",
    Subject: "Technical documentation for the VendorFlow AI Product Image Generator",
    Keywords: "VendorFlow, AI, image generation, ecommerce, Amazon, Flipkart, Meesho, documentation",
    Creator: "VendorFlow Docs",
    Producer: "pdfkit",
  },
});

doc.pipe(fs.createWriteStream(outPath));
doc.registerFont("Bold", "Helvetica-Bold");

// ── Cover ─────────────────────────────────────────────────────────────────────
drawCoverPage();
newPage();

// ══════════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
h1("1.  Overview");

body("VendorFlow is an AI-powered product image generation platform for ecommerce sellers. It enables vendors on marketplaces like Amazon, Flipkart, and Meesho to upload a single product photo and automatically generate a full set of marketplace-ready images — including multiple angles, lifestyle shots, close-ups, infographics, and premium A+ content banners — without a physical photoshoot.");

spacer();
h2("1.1  Core Problem Solved");
body("Most small and medium sellers lack access to professional product photography. They need multiple images per listing across different marketplaces, each with specific size, background, and style requirements. VendorFlow eliminates the cost and complexity of physical photoshoots by using AI image generation to create these assets from a single reference photo.");

spacer();
h2("1.2  Key Capabilities");
bullet("Generate 7–8 product images from one uploaded photo");
bullet("Support for Amazon, Flipkart, and Meesho with platform-specific sizing and formatting");
bullet("Basic product images (nano-banana AI) and premium A+ / RPD banners (GPT Image 2)");
bullet("AI-powered photo analysis — auto-fills product name, brand, material, dimensions, color, and key features");
bullet("AI-generated listing copy (titles, bullet points, descriptions, keywords, SEO metadata) for all three marketplaces");
bullet("Credit-based billing with GST-compliant Indian rupee pricing via Razorpay");
bullet("Generation history with re-download capability");
bullet("Onboarding tour for first-time users");
bullet("Bilingual UI (English / Hindi)");

spacer();
callout("Platform", "VendorFlow targets Indian ecommerce sellers, particularly those selling on Amazon India, Flipkart, and Meesho. The billing, language support, and marketplace specifications all reflect this focus.", BRAND);

// ══════════════════════════════════════════════════════════════════════════════
// 2. ARCHITECTURE
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("2.  Architecture");

h2("2.1  High-Level Overview");
body("VendorFlow is a serverless-first Next.js application (App Router). It handles both the frontend UI and the backend API routes as a single deployed service. No separate backend server is required.");

spacer();
multiColTable(
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
  [0.20, 0.28, 0.52]
);

spacer();
h2("2.2  Data Flow");
multiColTable(
  ["Step", "Action"],
  [
    ["1", "User uploads 1–12 product photos in the Studio UI"],
    ["2", "Optional: User clicks 'Analyze Photos' — Gemini Vision extracts product metadata"],
    ["3", "User fills in the listing brief (product name, marketplace, image types, style)"],
    ["4", "On submit, the generate API route charges credits and dispatches generation jobs"],
    ["5", "Reference images are uploaded to fal.storage for use as AI input"],
    ["6", "Basic images → nano-banana model; A+ images → GPT Image 2 model"],
    ["7", "Generated images are uploaded to Cloudflare R2"],
    ["8", "Generation record saved to MongoDB (user history)"],
    ["9", "Base64 image data + R2 URLs returned to client; displayed in results gallery"],
  ],
  [0.08, 0.92]
);

spacer();
h2("2.3  Directory Structure");
code(`image-generation/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth session endpoint
│   │   ├── generate/             # POST — image generation pipeline
│   │   ├── analyze/              # POST — Gemini Vision photo analysis
│   │   ├── listing/              # POST — Gemini text listing generation
│   │   ├── credits/              # GET — credit balance & transaction history
│   │   ├── credits/welcome/       # GET — check welcome bonus flag
│   │   ├── history/              # GET — generation history list
│   │   ├── history/[id]/         # GET — single generation with images
│   │   ├── razorpay/checkout/     # POST — create Razorpay order / verify payment
│   │   ├── razorpay/portal/       # POST — stub (Razorpay has no billing portal)
│   │   ├── razorpay/webhook/      # POST — Razorpay payment.captured backup
│   │   └── assistant/             # POST — AI assistant chat
│   ├── studio/page.tsx           # Main product image studio
│   ├── login/page.tsx             # Sign in / Register page
│   ├── credits/page.tsx           # Credit balance & purchase page
│   ├── layout.tsx                 # Root layout with auth providers
│   ├── page.tsx                   # Marketing landing page
│   └── globals.css               # Global styles & design tokens
├── components/                   # Shared React components
├── lib/
│   ├── mongodb.ts                # MongoDB connection singleton
│   ├── auth.ts                   # NextAuth configuration
│   ├── credits.ts                # Credit CRUD & atomic transactions
│   ├── generations.ts             # Generation history CRUD
│   ├── fal.ts                    # fal.ai client — image generation
│   ├── prompts.ts                 # Prompt builders for AI models
│   ├── pricing.ts                 # Credit costs & purchasable plans
│   ├── export.ts                 # CSV/JSON export for marketplaces
│   ├── cloudflare.ts             # R2 file upload/delete
│   ├── razorpay.ts                # Razorpay client, orders, signature verification
│   └── email.ts                  # Resend email (receipts, OTPs)
└── public/                       # Static assets`);

// ══════════════════════════════════════════════════════════════════════════════
// 3. TECH STACK
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("3.  Tech Stack");

h2("3.1  Frontend");
multiColTable(
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
  [0.25, 0.15, 0.60]
);

spacer();
h2("3.2  Backend & Infrastructure");
multiColTable(
  ["Technology", "Purpose"],
  [
    ["NextAuth.js v5 (beta)", "Authentication — Credentials provider + Google OAuth"],
    ["MongoDB + @mongodb-adapter", "Database — users, credits, generations, listings"],
    ["Cloudflare R2 (S3 API)", "Object storage — generated image files"],
    ["fal.ai client", "Image generation — nano-banana (basic) + GPT Image 2 (A+)"],
    ["Google Gemini 3.5 Flash", "Photo vision analysis + listing text generation"],
    ["Razorpay", "Payments — INR Orders + Checkout modal, webhooks (no billing portal)"],
    ["Resend", "Transactional email — receipts, OTPs"],
    ["sharp", "^0.35", "Server-side image resizing (A+ image post-processing)"],
  ],
  [0.30, 0.70]
);

spacer();
h2("3.3  Development Tools");
multiColTable(
  ["Tool", "Purpose"],
  [
    ["ESLint", "Code linting"],
    ["TypeScript", "Static type checking"],
    ["bcryptjs", "Password hashing for credential auth"],
  ],
  [0.32, 0.68]
);

// ══════════════════════════════════════════════════════════════════════════════
// 4. ENVIRONMENT VARIABLES
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("4.  Environment Variables");

body("All configuration is managed via environment variables in a .env.local file. Required variables are grouped by service. Copy .env.example to .env.local and fill in all values before running the application in production. Never commit .env files to version control.");

spacer();
callout("Setup Required", "Missing environment variables will cause API routes to fail. The Razorpay webhook, fal.ai, and Gemini keys are the most commonly missed.", [220, 38, 38]);

spacer();
h2("4.1  Database");
twoColTable([
  ["MONGODB_URI", "Full MongoDB connection string (mongodb+srv://... or mongodb://...)"],
  ["MONGODB_DB_NAME", "Name of the MongoDB database (e.g. image-generation)"],
]);

spacer();
h2("4.2  Authentication (NextAuth)");
twoColTable([
  ["AUTH_SECRET", "Random secret for NextAuth session encryption (openssl rand -base64 32)"],
  ["AUTH_URL", "Public URL of the app (https://yourdomain.com) — used for OAuth redirects"],
  ["GOOGLE_CLIENT_ID", "Google OAuth Client ID from Google Cloud Console"],
  ["GOOGLE_CLIENT_SECRET", "Google OAuth Client Secret"],
]);

spacer();
h2("4.3  Image Generation (fal.ai)");
twoColTable([
  ["FAL_KEY", "fal.ai API key (get one at fal.ai) — used for both nano-banana and GPT Image 2"],
  ["FAL_IMAGE_MODEL", "Optional override for the basic image model (default: fal-ai/nano-banana/edit)"],
]);

spacer();
h2("4.4  AI Providers");
twoColTable([
  ["GEMINI_API_KEY", "Google AI Studio API key (get one at aistudio.google.com/apikey) — used for Gemini Vision (photo analysis) and Gemini Flash (listing copy generation)"],
]);

spacer();
h2("4.5  Cloud Storage (Cloudflare R2)");
twoColTable([
  ["R2_ACCOUNT_ID", "Cloudflare account ID for R2 API"],
  ["R2_ACCESS_KEY_ID", "R2 API token access key ID"],
  ["R2_SECRET_ACCESS_KEY", "R2 API token secret access key"],
  ["R2_BUCKET_NAME", "R2 bucket name (e.g. generated-images)"],
  ["R2_PUBLIC_URL", "Optional custom public base URL for R2 objects — if not set, uses default R2.dev public URL"],
]);

spacer();
h2("4.6  Payments (Razorpay)");
twoColTable([
  ["RAZORPAY_KEY_ID", "Razorpay key ID (rzp_live_... or rzp_test_...) — used client + server side"],
  ["RAZORPAY_KEY_SECRET", "Razorpay key secret — backend only"],
  ["RAZORPAY_WEBHOOK_SECRET", "Webhook signing secret from dashboard.razorpay.com/app/webhooks"],
]);

spacer();
h2("4.7  Email (Resend)");
twoColTable([
  ["RESEND_API_KEY", "Resend API key for transactional email (receipts, OTPs)"],
  ["EMAIL_FROM", "Sender email address (e.g. VendorFlow <hello@productvisuals.ai>)"],
]);

// ══════════════════════════════════════════════════════════════════════════════
// 5. DATA STORAGE
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("5.  Data Storage");

body("VendorFlow uses MongoDB as its primary database. There is no ORM — all database operations are performed directly via the official mongodb Node.js driver. The lib/mongodb.ts file exports a singleton connection promise reused across all API routes.");

spacer();
h2("5.1  Collections");
multiColTable(
  ["Collection", "Purpose", "Key Fields"],
  [
    ["users (NextAuth)", "NextAuth user documents", "email, name, image, emailVerified"],
    ["userCredits", "Per-user credit balance", "userId, balance, welcomeBonusShown, createdAt, updatedAt"],
    ["creditTransactions", "Immutable audit log of all credit changes", "userId, type (grant|charge|refund), amount, description, generationId, priceInr, planId, createdAt"],
    ["generations", "Each image generation batch", "userId, productName, category, marketplaces, background, listings, createdAt"],
    ["generationImages", "Individual images per generation", "generationId, type, mimeType, storageKey, url, isAplus, createdAt"],
  ],
  [0.22, 0.40, 0.38]
);

spacer();
h2("5.2  Generation Image Storage (Cloudflare R2)");
body("Generated images are stored in Cloudflare R2, not in MongoDB. This keeps the database lightweight and avoids MongoDB's 16 MB document limit.");
twoColTable([
  ["Storage key format", "<userId>/<generationId>/basic-<index>.png"],
  ["Example", "abc123/550e8400-e29b-41d2-a716-446655440000/basic-0.png"],
  ["Public URL format", "https://<R2_PUBLIC_URL>/<storageKey>"],
  ["Retention", "Most recent 5 generations per user are kept; older ones are automatically deleted from R2 and MongoDB via pruneOldGenerations()"],
]);

spacer();
h2("5.3  Image Types & Storage Paths");
multiColTable(
  ["Image Category", "Storage Path", "Notes"],
  [
    ["Basic images (nano-banana)", "<userId>/<genId>/basic-<N>.<ext>", "Standard product listing images"],
    ["A+ images (GPT Image 2)", "<userId>/<genId>/aplus-<N>.png", "Premium Amazon/Flipkart A+ banners"],
    ["Reference uploads (temp)", "Temporary fal.storage URLs", "Short-lived pre-signed URLs; not persisted"],
  ],
  [0.28, 0.34, 0.38]
);

// ══════════════════════════════════════════════════════════════════════════════
// 6. AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("6.  Authentication");

body("VendorFlow uses NextAuth.js v5 (beta) with two authentication providers:");
multiColTable(
  ["Provider", "Type", "Notes"],
  [
    ["Credentials", "Email + Password", "Passwords hashed with bcryptjs. Registration via /api/auth/register creates the user and then signs in automatically."],
    ["Google OAuth", "Social Login", "Standard OAuth 2.0. User is created on first sign-in via events.createUser callback."],
  ],
  [0.22, 0.18, 0.60]
);

spacer();
h2("6.1  User Creation Flow");
numbered("User submits email + password on /login", 1);
body([{ text: "POST /api/auth/register — creates user in MongoDB", font: CODE_FONT, size: CODE_SIZE }], { color: BRAND });
numbered("On success, auto-sign-in via signIn('credentials', ...)", 2);
numbered("NextAuth events.createUser callback fires — grants welcome bonus (1 free credit) and shows popup on first login", 3);
numbered("Session cookie issued; user redirected to /studio", 4);

spacer();
h2("6.2  Route Protection");
body("All /api/* routes (except /api/auth/*) and the /studio and /credits pages are protected. The auth() function is called at the top of every route handler. Unauthenticated requests receive a 401 response.");
code(`const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
}`);

spacer();
h2("6.3  Welcome Bonus");
body("On first registration, a 1-credit welcome bonus is granted atomically using MongoDB's upsert with $setOnInsert. This ensures the bonus is granted exactly once — even if the user registers twice or triggers the callback multiple times.");

// ══════════════════════════════════════════════════════════════════════════════
// 7. CREDITS & BILLING
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("7.  Credits & Billing");

h2("7.1  Credit System Overview");
body("Credits are the sole currency of VendorFlow. They are deducted before generation begins and refunded if generation fails. Credits never expire.");

spacer();
callout("Pricing", "1 basic image = 1 credit  |  1 A+ image = 5 credits  |  Credits are GST-inclusive (18% Indian GST already included in plan prices)", BRAND);

spacer();
h2("7.2  Image Cost Matrix");
multiColTable(
  ["Image Category", "AI Model", "Cost per Image"],
  [
    ["Basic product images (Main Product, Front/Side Angle, Lifestyle, etc.)", "nano-banana (fal.ai)", "1 Credit"],
    ["A+ listing images (Amazon Standard Banner, Three Image Module, etc.)", "GPT Image 2 (fal.ai)", "5 Credits"],
    ["Flipkart RPD banners (Hero Banner, Feature Banners, Infographics, etc.)", "GPT Image 2 (fal.ai)", "5 Credits"],
  ],
  [0.46, 0.28, 0.26]
);

spacer();
h2("7.3  Credit Pack Plans");
multiColTable(
  ["Plan", "Price (Incl. GST)", "Credits", "Bonus"],
  [
    ["Starter", "₹400", "20", "—"],
    ["Growth (Popular)", "₹1,000", "55", "+5 bonus"],
    ["Pro", "₹2,000", "115", "+15 bonus"],
    ["Business", "₹5,000", "300", "+50 bonus"],
  ],
  [0.25, 0.22, 0.23, 0.30]
);

spacer();
h2("7.4  Atomic Credit Operations");
bullet("chargeUserCredits — deducts credits only if balance >= required amount in a single atomic MongoDB operation, preventing race conditions");
bullet("addUserCredits — increments balance and is guarded by the Razorpay payment ID (idempotency key) to prevent double-crediting on webhook/verify retries");
bullet("refundUserCredits — restores credits when generation fails after charging");

spacer();
h2("7.5  Razorpay Payment Flow");
numbered("User selects a plan on /credits and clicks Buy", 1);
numbered("POST /api/razorpay/checkout — creates a Razorpay order for the plan's INR amount, returns order/key details", 2);
numbered("Client opens the Razorpay Checkout modal in-page using those details (INR currency)", 3);
numbered("On success, client calls POST /api/razorpay/checkout with action: 'verify' — validates the HMAC signature, re-fetches the order/payment from Razorpay, and re-checks amount + userId", 4);
numbered("Credits are added via addUserCredits (idempotent by payment ID) → receipt email sent via Resend", 5);
numbered("A payment.captured webhook at /api/razorpay/webhook acts as a backup in case the client-side verify call never completes", 6);
numbered("User sees the success state on /credits?success=true with updated balance", 7);

spacer();
h2("7.6  GST / Invoice Handling");
body("All displayed plan prices include 18% GST. The GST is split into CGST + SGST components for the digital receipt (via splitGstInclusive() in lib/pricing.ts). Receipts are emailed via Resend after successful payment and can also be viewed as an in-app modal on the /credits page.");

// ══════════════════════════════════════════════════════════════════════════════
// 8. CORE FEATURES
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("8.  Core Features");

h2("8.1  Studio — Image Generation Form");
body("The /studio page is the primary user workspace. It contains a multi-section form for building a generation brief:");
multiColTable(
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
    ["Basic Images", "Checkbox grid of 9 image types", "nano-banana — 1 credit each"],
    ["A+ Images", "Checkbox grid of 5 module types", "GPT Image 2 — 5 credits each; Amazon only"],
    ["Flipkart Gallery", "8 gallery slots + 11 RPD module types", "Gallery = nano-banana; RPD = GPT Image 2"],
    ["Meesho Gallery", "8 gallery + 8 infographic types", "All nano-banana at basic pricing"],
    ["Style Preferences", "AI style, text overlay option, language", "Applied across all images"],
    ["Output Settings", "Variant sets, quantity per set, format, resolution", "Size presets + custom dimensions for basic images"],
    ["Optional Listing Details", "Description, target audience, pricing, warranty, COO, package contents", "Used by the listing generation AI"],
  ],
  [0.20, 0.38, 0.42]
);

spacer();
h2("8.2  Photo Analysis (Gemini Vision)");
body("Clicking 'Analyze Photos' sends all uploaded images to the Gemini 3.5 Flash Vision API, which extracts:");
bullet("Product type, brand, material, color(s), pattern");
bullet("Estimated dimensions and weight");
bullet("Target audience and gender");
bullet("Key features (up to 6)");
bullet("Packaging type, accessories, country of origin, warranty");
bullet("Confidence scores per field (high/medium/low)");
body("Extracted fields are auto-populated into the listing brief form, and a toast notification confirms which fields were filled.");

spacer();
h2("8.3  Image Generation (fal.ai)");
body("Two AI models are used depending on the image type selected:");
multiColTable(
  ["Model", "Provider", "Image Types", "Max Concurrent"],
  [
    ["nano-banana/edit", "fal.ai", "Basic product images (main shot, angles, lifestyle, infographics)", "4"],
    ["gpt-image-2/edit", "fal.ai", "A+ / RPD premium banners (GPT Image 2)", "4"],
  ],
  [0.22, 0.18, 0.42, 0.18]
);
body("The generation pipeline processes images concurrently (up to 4 at a time). Reference images are uploaded to fal.storage first, then used as input URLs in the model calls.");

spacer();
h2("8.4  Listing Text Generation (Gemini Flash)");
body("Clicking 'Generate Listing Text' sends the full brief (product metadata + user inputs) to Gemini 3.5 Flash with a marketplace-specific system prompt. Separate listings are generated for Amazon, Flipkart, and Meesho simultaneously via Promise.allSettled.");
bullet("Amazon: Title (≤200 chars), 5 bullet points (≤500 chars each), description (≤2000 chars), SEO title, SEO description, backend keywords");
bullet("Flipkart: Title (≤100 chars), 5–8 highlights, description, SEO title, SEO description");
bullet("Meesho: Title (≤80 chars), persuasive Hinglish description, highlights — optimized for value-conscious Tier 2–4 buyers");

spacer();
h2("8.5  Generation History");
body("Every completed generation is saved to MongoDB and appears in the history sidebar. Clicking a history item reloads its images and listing text. Old generations beyond the 5 most recent are automatically pruned, with images deleted from R2.");

spacer();
h2("8.6  Download & Export");
bullet("Single image — click the download button on any image tile");
bullet("All images as ZIP — click 'Download ZIP' to bundle all images");
bullet("Listing CSV — export Amazon TSV, Flipkart TSV, or Meesho TSV for bulk upload tools");
bullet("Listing JSON — export all listing data as structured JSON");

// ══════════════════════════════════════════════════════════════════════════════
// 9. API REFERENCE
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("9.  API Reference");

h2("9.1  POST /api/generate");
body("Generates a batch of product images. Requires authentication (NextAuth session).");
code(`POST /api/generate
Content-Type: multipart/form-data

Fields:
  brief   — JSON string of GenerationBrief object
  photos  — Image File(s), up to 12`);

spacer();
body("GenerationBrief object:", { color: BRAND });
twoColTable([
  ["productName", "string — required"],
  ["category", "string — required"],
  ["marketplaces", "string[] — required (Amazon | Flipkart | Meesho)"],
  ["imageTypes", "string[] — required, max 12"],
  ["brandName", "string (optional)"],
  ["background", "string (default: 'Pure White')"],
  ["customBackgroundColor", "string (hex, e.g. #FF5733)"],
  ["material / dimensions / weight", "string (optional)"],
  ["aiStyle", "string (default: 'Minimal')"],
  ["textOnImage", "string (default: 'No Text')"],
  ["language", "string (default: 'English')"],
  ["imageFormat", "string (default: 'PNG')"],
  ["resolution", "string ('Standard'|'HD'|'4K')"],
  ["customWidth / customHeight", "number (optional, pixels)"],
  ["keyFeatures / productColors / brandColors", "string[]"],
  ["customPrompt", "string — appended to all AI prompts"],
], 0.35, 0.65);

spacer();
body("Success response (200):");
code(`{
  "id": "<mongodb_id>",
  "images": [...],
  "generationId": "<uuid>",
  "creditsUsed": <N>,
  "newBalance": <N>
}`);

spacer();
body("Error responses:", { color: BRAND });
multiColTable(
  ["Status", "Condition"],
  [
    ["401", "Not authenticated"],
    ["400", "Missing or invalid brief / photos"],
    ["402", "Insufficient credits — returns required amount"],
    ["503", "fal.ai not configured (missing FAL_KEY)"],
    ["502", "AI generation failed — credits are automatically refunded"],
  ],
  [0.15, 0.85]
);

spacer();
h2("9.2  POST /api/analyze");
body("Analyzes uploaded photos with Gemini Vision to extract product metadata. Requires authentication.");
code(`POST /api/analyze
Content-Type: multipart/form-data
photos — Image File(s), max 8

Success response (200):
{
  "productType": "string",
  "brand": "string",
  "color": "string",
  "material": "string",
  "dimensions": "string",
  "weight": "string",
  "targetAudience": "string",
  "keyFeatures": ["string", ...],
  "countryOfOrigin": "string",
  "warranty": "string",
  "confidence": { "<field>": "high|medium|low", ... }
}`);

spacer();
h2("9.3  POST /api/listing");
body("Generates AI-written marketplace listing copy for Amazon, Flipkart, and Meesho. Requires authentication.");
code(`POST /api/listing
Content-Type: application/json

Body: { "brief": {...GenerationBrief}, "generationId": "<optional>" }

Success response (200):
{
  "amazon": { "title", "bullets", "description", "keywords", "seoTitle", "seoDescription" },
  "flipkart": { "title", "highlights", "description", "seoTitle", "seoDescription" },
  "meesho": { "title", "description", "highlights" },
  "id": "<generationId>"
}`);

spacer();
h2("9.4  GET /api/credits");
body("Returns the authenticated user's credit balance and recent transaction history.");
code(`GET /api/credits
Response: { "balance": <N>, "pricing": { "basic": 1, "aplus": 5 }, "transactions": [...] }`);

spacer();
h2("9.5  GET /api/credits/welcome");
body("Checks whether the welcome bonus popup should be shown (fires once per user).");
code(`GET /api/credits/welcome
Response: { "show": true | false }`);

spacer();
h2("9.6  GET /api/history");
body("Returns a list of the user's recent generation summaries (without image data).");
code(`GET /api/history
Response: [{ id, productName, category, marketplaces, createdAt, thumbnail, imageCount, hasListing }, ...]`);

spacer();
h2("9.7  GET /api/history/[id]");
body("Returns a single generation with full image URLs and listing text.");
code(`GET /api/history/[id]
Response: { id, productName, category, marketplaces, createdAt, images: [...], listings: {...} }`);

spacer();
h2("9.8  POST /api/razorpay/checkout");
body("Creates a Razorpay order for purchasing a credit pack, or (with action: 'verify') verifies a completed payment. Requires authentication.");
code(`POST /api/razorpay/checkout
Body: { "plan": "starter" | "growth" | "pro" | "business" }
Response: { keyId, orderId, amount, currency, name, description, prefill }

POST /api/razorpay/checkout (verify)
Body: { "action": "verify", "orderId", "paymentId", "signature" }
Response: { success, newBalance, alreadyProcessed }`);

spacer();
h2("9.9  POST /api/razorpay/webhook");
body("Handles Razorpay payment.captured events as a backup to client-side verification. Idempotent via payment ID. Sends a receipt email via Resend.");
code(`POST /api/razorpay/webhook
Required header: X-Razorpay-Signature: <hmac>
Internal: adds credits, sends receipt, marks payment as processed`);

spacer();
h2("9.10  POST /api/razorpay/portal");
body("Razorpay has no hosted billing-portal equivalent to Stripe's — this endpoint always returns 404. Receipts are viewed via the in-app credit purchase history instead.");
code(`POST /api/razorpay/portal
Response (404): { "error": "Razorpay does not provide a customer billing portal..." }`);

// ══════════════════════════════════════════════════════════════════════════════
// 10. MARKETPLACE INTEGRATIONS
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("10.  Marketplace Integrations");

h2("10.1  Amazon India");
body("Amazon is the most image-format-diverse integration, with separate pipelines for basic product listing images and premium A+ Content.");

spacer();
h3("Basic Product Images — nano-banana");
multiColTable(
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
  [0.38, 0.15, 0.47]
);

spacer();
h3("A+ Content Images — GPT Image 2");
multiColTable(
  ["Module Type", "Dimensions", "Credits"],
  [
    ["Standard Banner", "970×300", "5"],
    ["Banner with Text Overlay", "970×300", "5"],
    ["Standard Image & Text", "1000×1000", "5"],
    ["Three Image Module", "1464×400", "5"],
    ["Four Image Module", "1464×800", "5"],
  ],
  [0.50, 0.25, 0.25]
);
body("GPT Image 2 requires sizes that are multiples of 16 with total pixels between 655,360 and 8,294,400. The app requests the closest compliant size and crops to the exact Amazon spec using sharp after generation.", { color: [100, 120, 140] });

spacer();
h3("Amazon Export Format");
body("Amazon listings are exported as a tab-separated values (TSV) file with a UTF-8 BOM, ready for direct upload to Amazon Seller Central. Includes all standard catalog fields: SKU, brand, product name, description, 5 bullet points, search terms, dimensions, weight, COO, and warranty.");

spacer();
hr();
h2("10.2  Flipkart");
body("Flipkart's integration uses a two-tier image approach: a standard product gallery (1:1 square format) and a Rich Product Description (RPD) section with banner-style infographics.");

spacer();
h3("Flipkart Product Gallery — nano-banana");
multiColTable(
  ["Image Type", "Format", "Notes"],
  [
    ["Hero Image", "1024×1024", "Primary listing image — white background"],
    ["Front/Alternate Angle, Side View, Back View", "1024×1024", "Full product coverage"],
    ["Close-up / Macro, Lifestyle Image", "1024×1024", "Detail and usage context"],
    ["Dimension Image, Package/What's Included", "1024×1024", "Specifications and packaging"],
  ],
  [0.40, 0.18, 0.42]
);

spacer();
h3("Flipkart RPD Modules — GPT Image 2");
multiColTable(
  ["Module Type", "Dimensions", "Credits"],
  [
    ["Hero Banner", "1440×600", "5"],
    ["Feature Banner (×4)", "1200×600", "5 each"],
    ["Lifestyle Banner", "1200×600", "5"],
    ["Infographic, Dimensions Graphic, Comparison Chart, FAQ, Warranty/Trust", "1200×1200", "5 each"],
  ],
  [0.50, 0.22, 0.28]
);

spacer();
h3("Flipkart Export Format");
body("Flipkart listings are exported as TSV with: product name, description, brand, category, MRP, selling price, highlights, stock quantity, manufacturer details, COO, warranty, weight, and dimensions.");

spacer();
hr();
h2("10.3  Meesho");
body("Meesho targets value-conscious buyers in Tier 2–4 Indian cities. Listings use a Hinglish style and are optimized for social-commerce discovery. Meesho has no A+ content section — all informational graphics are part of the standard product gallery.");

spacer();
h3("Meesho Product Gallery — nano-banana");
multiColTable(
  ["Image Type", "Format", "Notes"],
  [
    ["Hero Image, Front View, Back View, Side View", "1000×1000", "Core product views — white/light background"],
    ["Close-up, Lifestyle, Size/Dimension, Package/What's Included", "1000×1000", "Detail and usage context"],
  ],
  [0.58, 0.18, 0.24]
);

spacer();
h3("Meesho Infographics — nano-banana (same pricing)");
multiColTable(
  ["Image Type", "Notes"],
  [
    ["Feature Highlights, Material Details, Fabric Composition, Size Chart", "Core informational graphics"],
    ["Usage Instructions, Wash Care, Color Variants, Package Contents", "Value-add images for buyer confidence"],
  ],
  [0.55, 0.45]
);

spacer();
h3("Meesho Export Format");
body("Meesho listings are exported as TSV with: title (≤80 chars), persuasive Hinglish description, category, MRP, selling price, discount %, stock, COO, and highlights. The title is optimized for the Meesho search algorithm.");

// ══════════════════════════════════════════════════════════════════════════════
// 11. AI MODELS
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("11.  AI Models");

h2("11.1  fal.ai — Image Generation");
multiColTable(
  ["Model", "Use Case", "Max Concurrent"],
  [
    ["fal-ai/nano-banana/edit", "Basic product listing images", "4"],
    ["fal-ai/gpt-image-2/edit", "Premium A+ / RPD banner images", "4"],
  ],
  [0.35, 0.43, 0.22]
);
body("Both models use the edit (image-to-image) mode, taking a reference photo and an AI prompt as input. Reference images are uploaded to fal.storage and passed as URLs.");

spacer();
h2("11.2  Google Gemini 3.5 Flash");
multiColTable(
  ["Mode", "Endpoint", "Use Case"],
  [
    ["Vision (multimodal)", "generativelanguage.googleapis.com", "Photo analysis — extracts product metadata from uploaded photos"],
    ["Text", "generativelanguage.googleapis.com", "Listing copy generation — titles, bullets, descriptions, keywords, SEO metadata"],
  ],
  [0.22, 0.35, 0.43]
);

spacer();
h2("11.3  Prompt Engineering");
body("The lib/prompts.ts file contains buildImagePrompt() and buildAplusPrompt() which construct detailed, structured prompts from the user-supplied brief. Prompts include:");
bullet("Product name, brand, category, and target marketplace");
bullet("Background type (white, lifestyle, gradient, etc.)");
bullet("Key features and color information");
bullet("Target audience and use context");
bullet("Output format and aspect ratio");
bullet("Style guidance (Minimal, Premium, Luxury, Modern, Colorful, Professional)");
bullet("Text overlay instructions (from the 'Text on image' preference)");
bullet("Custom user prompt (appended verbatim to allow full overrides)");

// ══════════════════════════════════════════════════════════════════════════════
// 12. USER FLOWS
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("12.  User Flows");

h2("12.1  First-Time User Journey");
multiColTable(
  ["Step", "Action", "Outcome"],
  [
    ["1", "Visit site → click Sign Up", "Navigate to /login with ?mode=register"],
    ["2", "Enter email + password → Create Account", "User created in MongoDB; welcome bonus (1 credit) granted; auto-signed in"],
    ["3", "Welcome modal appears", "CreditWelcomeModal shows the 1 free credit bonus; dismissable"],
    ["4", "Redirected to /studio", "Onboarding tour highlights upload zone, brief form, and image type selector"],
    ["5", "Upload 1 product photo", "Drop zone or click-to-upload; max 12 images"],
    ["6 (opt)", "Click Analyze Photos", "Gemini Vision extracts product type, brand, material, color, features; form auto-fills"],
    ["7", "Fill product name, category, marketplace", "Required fields — others pre-filled from step 6"],
    ["8", "Select image types (checkboxes)", "Basic images (1 credit each) or A+ images (5 credits each)"],
    ["9", "Click Generate Images", "Credits deducted; images generated concurrently via fal.ai; saved to R2 and MongoDB"],
    ["10", "Images appear in gallery", "Lightbox on click; download ZIP or individual images"],
  ],
  [0.10, 0.42, 0.48]
);

spacer();
h2("12.2  Credit Purchase Flow");
multiColTable(
  ["Step", "Action", "Notes"],
  [
    ["1", "Navigate to /credits", "Shows current balance, plan cards, transaction history"],
    ["2", "Click Buy on a plan (e.g. Growth ₹1,000 for 55 credits + 5 bonus)", "POST /api/razorpay/checkout creates a Razorpay order"],
    ["3", "Razorpay Checkout modal opens in-page (INR)", "Razorpay handles PCI compliance; user enters card/UPI details"],
    ["4", "Payment confirmed by Razorpay", "Client calls checkout API with action: verify + signature"],
    ["5", "Credits added to account", "Idempotent by payment ID — safe against retries; webhook is a backup path"],
    ["6", "Redirect to /credits?success=true", "Balance updates; success banner shown; receipt email sent"],
    ["7", "Optional: click View Bill", "ReceiptModal shows GST breakdown (base amount + CGST + SGST)"],
  ],
  [0.10, 0.40, 0.50]
);

spacer();
h2("12.3  Generate → Export Flow");
multiColTable(
  ["Step", "Action", "Notes"],
  [
    ["1", "Generate images with full brief", "All marketplace selections and image types included"],
    ["2", "Click Generate Listing Text", "Sends brief to Gemini Flash; generates Amazon + Flipkart + Meesho listings simultaneously"],
    ["3", "Listing panel opens with tabbed view", "Switch between Amazon / Flipkart / Meesho tabs"],
    ["4", "Copy individual fields or copy all", "Click Copy on any field, or 'Copy all' on a section"],
    ["5", "Export: Amazon CSV", "Downloads Amazon TSV (UTF-8 BOM) for Seller Central"],
    ["6", "Export: Flipkart CSV", "Downloads Flipkart TSV for Flipkart seller panel"],
    ["7", "Export: Meesho CSV", "Downloads Meesho TSV for Meesho supplier panel"],
    ["8", "Export: JSON", "Downloads all listing data as structured JSON for API integrations"],
  ],
  [0.10, 0.35, 0.55]
);

// ══════════════════════════════════════════════════════════════════════════════
// 13. SETUP & INSTALLATION
// ══════════════════════════════════════════════════════════════════════════════
newPage();
h1("13.  Setup & Installation");

h2("13.1  Prerequisites");
bullet("Node.js 18+ (LTS recommended)");
bullet("npm or yarn");
bullet("MongoDB instance (local or Atlas)");
bullet("Cloudflare account with R2 enabled + API token");
bullet("fal.ai account + API key");
bullet("Google Cloud project + AI Studio API key");
bullet("Razorpay account (test or live mode)");
bullet("Resend account (for email receipts)");

spacer();
h2("13.2  Installation Steps");
numbered("Clone the repository and install dependencies", 1);
code(`git clone <repo-url>
cd image-generation
npm install`);

spacer();
numbered("Configure environment variables", 2);
code(`cp .env.example .env.local
# Edit .env.local with all required values (see Section 4)`);

spacer();
numbered("Start the development server", 3);
code(`npm run dev
# Open http://localhost:3000`);

spacer();
numbered("Build for production", 4);
code(`npm run build
npm start`);

spacer();
h2("13.3  Required Service Sign-Up");
multiColTable(
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
  [0.22, 0.32, 0.46]
);

spacer();
h2("13.4  Razorpay Webhook Setup (Local Testing)");
body("To test Razorpay webhooks locally, expose your dev server with a tunnel (e.g. ngrok) and register the URL in the Razorpay dashboard:");
code(`ngrok http 3000
# Add https://<ngrok-id>.ngrok.io/api/razorpay/webhook as a webhook URL
# in dashboard.razorpay.com/app/webhooks, subscribed to payment.captured
# Copy the webhook secret shown there into RAZORPAY_WEBHOOK_SECRET in .env.local`);

spacer();
h2("13.5  Deployment");
body("VendorFlow is a standard Next.js application deployable to any platform that supports Node.js:");
multiColTable(
  ["Platform", "Notes"],
  [
    ["Vercel", "Recommended — zero-config Next.js deployment; add env vars in dashboard"],
    ["Railway", "Add MONGODB_URI, R2, Razorpay, fal, Gemini vars as environment variables"],
    ["Render", "Use build command: npm run build; start command: npm start"],
    ["Self-hosted (VPS)", "Run npm run build && npm start behind a reverse proxy (nginx/Caddy)"],
  ],
  [0.25, 0.75]
);

spacer();
h2("13.6  Environment Variable Checklist");
multiColTable(
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
  [0.28, 0.12, 0.28, 0.32]
);

// ── Footer ────────────────────────────────────────────────────────────────────
spacer(2);
hr();
body("VendorFlow — AI Product Image Generator  |  Documentation v1.0  |  hello@productvisuals.ai", { color: [148, 163, 184] });

// ── Finalize ───────────────────────────────────────────────────────────────────
doc.end();

doc.promise.then(() => {
  const stat = fs.statSync(outPath);
  console.log("Written:", outPath);
  console.log("Size:", Math.round(stat.size / 1024), "KB");
  console.log("Pages:", pageNum);
});
