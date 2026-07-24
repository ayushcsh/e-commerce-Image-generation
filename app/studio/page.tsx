"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from "react";
import JSZip from "jszip";
import type { ProductAnalysis } from "@/app/api/analyze/route";
import type { AllListings } from "@/app/api/listing/route";
import {
  exportAmazonCsv,
  exportFlipkartCsv,
  exportMeeshoCsv,
  exportJson,
  type BriefForExport
} from "@/lib/export";
import { IMAGE_COST } from "@/lib/pricing";
import OnboardingProvider, { useTourContext } from "@/components/onboarding/OnboardingProvider";
import CreditWelcomeModal from "@/components/onboarding/CreditWelcomeModal";

type UploadedImage = {
  id: string;
  name: string;
  size: string;
  url: string;
  file: File;
};

type GeneratedImageResult = {
  type: string;
  mimeType: string;
  /** Base64 for immediate display */
  data: string;
  /** R2 storage key */
  storageKey?: string;
  /** R2 public URL */
  url?: string;
  /** Actual image dimensions from generation */
  width: number;
  height: number;
  /** Whether this is an A+ image (GPT Image 2) */
  isAplus?: boolean;
};

type HistoryItem = {
  id: string;
  productName: string;
  category: string;
  marketplaces: string[];
  createdAt: string;
  thumbnail: string | null;
  thumbnailMimeType: string | null;
  imageCount: number;
  hasListing: boolean;
};

type BriefState = {
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
  variantSets: string;
  quantityPerSet: string;
  customWidth: string;
  customHeight: string;
};

type Notification = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  fields?: string[];
};

const MAX_PHOTOS = 12;
const MAX_FEATURES = 6;
const MIN_FEATURES = 3;
const MAX_PRODUCT_COLORS = 6;
const MAX_BRAND_COLORS = 4;

const CATEGORY_SUGGESTIONS = [
  "Electronics", "Clothing", "Furniture", "Beauty", "Grocery",
  "Home & Kitchen", "Sports & Outdoors", "Toys & Games", "Health & Personal Care"
];

const MARKETPLACES = ["Amazon", "Flipkart", "Meesho"];
const BACKGROUND_OPTIONS = ["Pure White", "Transparent", "Lifestyle", "Gradient", "Custom Color"];
const FONT_STYLES = ["Modern", "Classic", "Bold", "Elegant", "Minimal", "Playful"];

// Basic image types — nano-banana, $0.15 each
const BASIC_IMAGE_TYPES = [
  "Main Product (White Background)",
  "Front/Side Angle",
  "Key Features Infographic",
  "Dimensions",
  "Product in Use (Lifestyle)",
  "Close-up / Material Quality",
  "What's in the Box",
  "Comparison / Benefits",
  "Brand Story / Warranty",
];

// A+ Listing image types — GPT Image 2, $0.90 each
const APLUS_IMAGE_TYPES = [
  { id: "Standard Banner",         label: "Standard Banner",          hint: "970×300 · wide top banner",           size: "970x300"   },
  { id: "Banner with Text Overlay",label: "Banner with Text Overlay",hint: "970×300 · headline overlay banner",   size: "970x300"   },
  { id: "Standard Image & Text",   label: "Standard Image & Text",   hint: "1000×1000 · 50/50 split",           size: "1000x1000" },
  { id: "Three Image Module",      label: "Three Image Module",      hint: "1464×400 · 3-panel row",             size: "1464x400"  },
  { id: "Four Image Module",       label: "Four Image Module",       hint: "1464×800 · 2×2 grid",               size: "1464x800"  },
];

// Flipkart Product Gallery — nano-banana, same basic pricing, 1024×1024 (1:1)
const FLIPKART_BASIC_IMAGE_TYPES = [
  "Main Image (Hero)",
  "Front/Alternate Angle",
  "Side View",
  "Back View",
  "Close-up / Macro",
  "Lifestyle Image",
  "Dimension Image",
  "What's Included / Packaging",
];

// Flipkart Rich Product Description (RPD) modules — GPT Image 2, same A+ pricing
const FLIPKART_APLUS_IMAGE_TYPES = [
  { id: "Flipkart Hero Banner",        label: "Hero Banner",       hint: "1440×600 · brand + product",          size: "1440x600"  },
  { id: "Flipkart Feature Banner 1",   label: "Feature Banner 1",  hint: "1200×600 · key USP",                  size: "1200x600"  },
  { id: "Flipkart Feature Banner 2",   label: "Feature Banner 2",  hint: "1200×600 · benefits",                 size: "1200x600"  },
  { id: "Flipkart Feature Banner 3",   label: "Feature Banner 3",  hint: "1200×600 · material",                 size: "1200x600"  },
  { id: "Flipkart Feature Banner 4",   label: "Feature Banner 4",  hint: "1200×600 · technology",               size: "1200x600"  },
  { id: "Flipkart Lifestyle Banner",   label: "Lifestyle Banner",  hint: "1200×600 · product in use",           size: "1200x600"  },
  { id: "Flipkart Infographic",        label: "Infographic",       hint: "1200×1200 · features with icons",     size: "1200x1200" },
  { id: "Flipkart Dimensions Graphic", label: "Dimensions",        hint: "1200×1200 · measurements",            size: "1200x1200" },
  { id: "Flipkart Comparison Chart",   label: "Comparison Chart",  hint: "1200×1200 · compare models",          size: "1200x1200" },
  { id: "Flipkart Brand Story",        label: "Brand Story",       hint: "1440×600 · about brand",              size: "1440x600"  },
  { id: "Flipkart FAQ Graphic",        label: "FAQ Graphic",       hint: "1200×1200 · common questions",        size: "1200x1200" },
  { id: "Flipkart Warranty Trust",     label: "Warranty / Trust",  hint: "1200×1200 · warranty, certifications", size: "1200x1200" },
];

// Meesho Product Gallery — nano-banana, basic pricing, 1000×1000 (1:1)
const MEESHO_GALLERY_IMAGE_TYPES = [
  "Meesho Hero Image",
  "Meesho Front View",
  "Meesho Back View",
  "Meesho Side View",
  "Meesho Close-up",
  "Meesho Lifestyle Image",
  "Meesho Size/Dimension Image",
  "Meesho Package/What's Included",
];

// Meesho Infographic Images — Meesho has no dedicated A+/RPD section, so these
// informational graphics live in the regular gallery at basic pricing too.
const MEESHO_INFOGRAPHIC_IMAGE_TYPES = [
  "Meesho Feature Highlights",
  "Meesho Material Details",
  "Meesho Fabric Composition",
  "Meesho Size Chart",
  "Meesho Usage Instructions",
  "Meesho Wash Care",
  "Meesho Color Variants",
  "Meesho Package Contents",
];

// Display labels with optional badges for image types
const IMAGE_TYPE_LABELS: Record<string, string> = {
  "A+ Product Photo ⬜": "A+ Photo ★",
  "A+ Lifestyle Banner ⬛": "A+ Banner ★",
};

// Quick A+ size presets (Amazon A+ Content module sizes)
const APLU_SIZE_PRESETS = [
  { label: "A+ Hero Banner 970×600", width: 970, height: 600 },
  { label: "A+ Wide Banner 970×300", width: 970, height: 300 },
  { label: "A+ Brand Story 970×520", width: 970, height: 520 },
  { label: "A+ Premium Banner 1464×600", width: 1464, height: 600 },
  { label: "A+ Module Image 300×300", width: 300, height: 300 },
  { label: "Square 2000×2000", width: 2000, height: 2000 },
  { label: "Widescreen 3000×1200", width: 3000, height: 1200 },
  { label: "Cinema 2560×720", width: 2560, height: 720 },
];

const AI_IMAGE_STYLES = ["Minimal", "Premium", "Luxury", "Modern", "Colorful", "Professional"];
const TEXT_ON_IMAGE_OPTIONS = ["No Text", "Minimal Text", "Feature Highlights", "Promotional"];
const LANGUAGE_OPTIONS = ["English", "Hindi", "Both"];
const IMAGE_FORMATS = ["PNG", "JPG", "WebP"];
const RESOLUTIONS = ["Standard", "HD", "4K"];

const initialBrief: BriefState = {
  productName: "", category: "", brandName: "", sku: "",
  background: BACKGROUND_OPTIONS[0], customBackgroundColor: "#ffffff",
  material: "", dimensions: "", weight: "",
  fontStyle: FONT_STYLES[0], aiStyle: AI_IMAGE_STYLES[0],
  textOnImage: TEXT_ON_IMAGE_OPTIONS[0], language: LANGUAGE_OPTIONS[0],
  imageFormat: IMAGE_FORMATS[0], resolution: RESOLUTIONS[1],
  description: "", targetAudience: "", sellingPrice: "", mrp: "",
  discountPercent: "", specialOffers: "", warranty: "",
  countryOfOrigin: "", packageContents: "", customPrompt: "",
  variantSets: "1", quantityPerSet: "1", customWidth: "", customHeight: ""
};

// ── Utility helpers ──────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createImageId(file: File, index: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${file.name}-${file.lastModified}-${index}`;
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

function formatHistoryTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getImageSrc(image: GeneratedImageResult): string {
  if (image.data) return `data:${image.mimeType};base64,${image.data}`;
  if (image.url) return image.url;
  return "";
}

// ── Notification Toast ──────────────────────────────────────────────────────────
function NotificationToast({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = notification.type === "success"
    ? "rgba(22, 163, 74, 0.95)"
    : notification.type === "error"
    ? "rgba(220, 38, 38, 0.95)"
    : "rgba(37, 99, 235, 0.95)";

  const icon = notification.type === "success" ? "✓" : notification.type === "error" ? "✕" : "ℹ";

  return (
    <div
      className={`notificationToast ${visible ? "toastVisible" : "toastHidden"}`}
      style={{ background: bgColor }}
      role="alert"
    >
      <span className="toastIcon" aria-hidden="true">{icon}</span>
      <div className="toastContent">
        <p className="toastMessage">{notification.message}</p>
        {notification.fields && notification.fields.length > 0 && (
          <p className="toastFields">Auto-filled: {notification.fields.join(" · ")}</p>
        )}
      </div>
      <button className="toastDismiss" onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

// ── Reusable UI components ──────────────────────────────────────────────────────
function PillGroup({ legend, options, value, onChange, id }: {
  legend: string; options: string[]; value: string; onChange: (v: string) => void; id?: string;
}) {
  return (
    <div className="controlGroup" id={id}>
      <span className="controlLabel">{legend}</span>
      <div className="pillGroup">
        {options.map((option) => (
          <button className={value === option ? "isSelected" : ""} key={option} type="button" onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckGrid({ legend, hint, options, values, onToggle, columns = 3, disabled = false, singleSelect = false, name }: {
  legend: ReactNode; hint?: string; options: string[]; values: string[]; onToggle: (v: string) => void; columns?: number; disabled?: boolean; singleSelect?: boolean; name?: string;
}) {
  return (
    <fieldset className="checkFieldset">
      <legend>{legend}</legend>
      {hint ? <p className="fieldHint">{hint}</p> : null}
      <div className="checkGrid" style={{ "--cols": columns } as CSSProperties}>
        {options.map((option) => (
          <label className={`checkOption${disabled ? " isLocked" : ""}`} key={option}>
            <input
              type={singleSelect ? "radio" : "checkbox"}
              name={name}
              checked={values.includes(option)}
              disabled={disabled}
              onChange={() => { if (!disabled) onToggle(option); }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AplusOptionGrid({ options, values, onToggle, disabled = false }: {
  options: { id: string; label: string; hint: string }[]; values: string[]; onToggle: (id: string) => void; disabled?: boolean;
}) {
  return (
    <div className="aplusImageOptions">
      {options.map((type) => (
        <label key={type.id} className={`aplusImageOption${values.includes(type.id) ? " isSelected" : ""}${disabled ? " isLocked" : ""}`}>
          <input
            type="checkbox"
            checked={values.includes(type.id)}
            disabled={disabled}
            onChange={() => onToggle(type.id)}
          />
          <div className="aplusImageOptionContent">
            <span className="aplusImageOptionLabel">{type.label}</span>
            <span className="aplusImageOptionHint">{type.hint}</span>
          </div>
          <div className="aplusImageOptionCheck" aria-hidden="true">
            {values.includes(type.id) ? "✓" : ""}
          </div>
        </label>
      ))}
    </div>
  );
}

function ChipInput({ legend, hint, values, onAdd, onRemove, placeholder, max, withColorPicker, id }: {
  legend: string; hint?: string; values: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void;
  placeholder?: string; max?: number; withColorPicker?: boolean; id?: string;
}) {
  const [draft, setDraft] = useState("");
  const atLimit = Boolean(max) && values.length >= (max ?? 0);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || atLimit) return;
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <div className="chipField" id={id}>
      <div className="chipFieldHead">
        <span>{legend}</span>
        {max ? <small>{values.length}/{max}</small> : null}
      </div>
      {hint ? <p className="fieldHint">{hint}</p> : null}
      <div className="chipInputRow">
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          placeholder={placeholder} disabled={atLimit} />
        {withColorPicker ? (
          <input className="colorPicker" type="color" aria-label={`Pick a color for ${legend}`}
            onChange={(e) => { if (!atLimit) onAdd(e.target.value); }} />
        ) : null}
        <button className="chipAddButton" type="button" onClick={commit} disabled={atLimit}>Add</button>
      </div>
      {values.length > 0 ? (
        <div className="chipList">
          {values.map((value) => (
            <span className="chip" key={value}>
              {withColorPicker && /^#([0-9a-f]{3}){1,2}$/i.test(value) ? (
                <i className="chipSwatch" style={{ background: value }} aria-hidden="true" />
              ) : null}
              {value}
              <button type="button" onClick={() => onRemove(value)} aria-label={`Remove ${value}`}>&times;</button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FormSection({ id, eyebrow, title, description, children }: {
  id?: string; eyebrow: string; title: string; description?: string; children: ReactNode;
}) {
  return (
    <section className="formSection" id={id}>
      <div className="formSectionHead">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="sectionDesc">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

// ── Listing Panel ───────────────────────────────────────────────────────────────
type ActiveTab = "amazon" | "flipkart" | "meesho";

function ListingPanel({ listings, brief, onClose }: {
  listings: AllListings; brief: BriefForExport; onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("amazon");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "amazon", label: "Amazon" }, { id: "flipkart", label: "Flipkart" },
    { id: "meesho", label: "Meesho" }
  ];

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  function handleExport(format: string) {
    const slug = (brief.productName || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let content: string; let filename: string; const mimeType = "text/csv;charset=utf-8";

    switch (format) {
      case "amazon":      content = exportAmazonCsv(brief, listings);      filename = `${slug}-amazon.csv`;        break;
      case "flipkart":    content = exportFlipkartCsv(brief, listings);    filename = `${slug}-flipkart.csv`;       break;
      case "meesho":      content = exportMeeshoCsv(brief, listings);      filename = `${slug}-meesho.csv`;         break;
      case "json":
        content = exportJson({ brief, listings, generatedAt: new Date().toISOString() });
        filename = `${slug}-listing.json`;
        break;
      default: return;
    }

    const blob = new Blob([content], { type: format === "json" ? "application/json" : mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const current = listings[activeTab];

  return (
    <div className="listingPanelOverlay" id="listing-output-panel">
      <div className="listingPanel listingPanelWide">
        <div className="listingPanelHeader">
          <div>
            <h2>AI Generated Listings</h2>
            {brief.productName ? <p className="listingPanelSubtitle">{brief.productName}</p> : null}
          </div>
          <button className="ghostButton" type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="listingTabs">
          {tabs.map((tab) => (
            <button key={tab.id}
              className={`listingTab${activeTab === tab.id ? " isActive" : ""}`}
              type="button" onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="listingContent">
          {current.title || current.description ? (
            <div className="listingPrimary">
              {current.title ? (
                <div className="listingPrimaryRow">
                  <h3 className="listingTitleText">{current.title}</h3>
                  <button className="ghostButton compactButton" type="button"
                    onClick={() => copyToClipboard(current.title!, `${activeTab}-title`)}>
                    {copiedField === `${activeTab}-title` ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : null}
              {current.description ? (
                <div className="listingPrimaryRow listingPrimaryRowTop">
                  <p className="listingDescriptionText">{current.description}</p>
                  <button className="ghostButton compactButton" type="button"
                    onClick={() => copyToClipboard(current.description!, `${activeTab}-desc`)}>
                    {copiedField === `${activeTab}-desc` ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {(current.bullets && current.bullets.length > 0) || (current.highlights && current.highlights.length > 0) ? (
            <div className="listingSectionBlock">
              <div className="listingSectionHead">
                <span>{current.bullets ? "Bullet Points" : "Highlights"}</span>
                <button className="ghostButton compactButton" type="button"
                  onClick={() => copyToClipboard((current.bullets ?? current.highlights ?? []).join("\n"), `${activeTab}-points`)}>
                  {copiedField === `${activeTab}-points` ? "Copied!" : "Copy all"}
                </button>
              </div>
              <ul className="listingPointList">
                {(current.bullets ?? current.highlights ?? []).map((point, i) => (
                  <li key={i} className="listingPoint">
                    <span className="listingPointText">{point}</span>
                    <button className="listingPointCopy" type="button"
                      onClick={() => copyToClipboard(point, `${activeTab}-point-${i}`)}
                      aria-label="Copy this point">
                      {copiedField === `${activeTab}-point-${i}` ? "✓" : "Copy"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {(current.keywords && current.keywords.length > 0) || current.seoTitle || current.seoDescription ? (
            <div className="listingMeta">
              <p className="listingMetaLabel">SEO &amp; Metadata</p>
              {current.seoTitle ? (
                <div className="listingMetaRow">
                  <span className="listingMetaKey">SEO Title</span>
                  <span className="listingMetaValue">{current.seoTitle}</span>
                  <button className="ghostButton compactButton" type="button"
                    onClick={() => copyToClipboard(current.seoTitle!, `${activeTab}-seo-title`)}>
                    {copiedField === `${activeTab}-seo-title` ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : null}
              {current.seoDescription ? (
                <div className="listingMetaRow">
                  <span className="listingMetaKey">SEO Description</span>
                  <span className="listingMetaValue">{current.seoDescription}</span>
                  <button className="ghostButton compactButton" type="button"
                    onClick={() => copyToClipboard(current.seoDescription!, `${activeTab}-seo-desc`)}>
                    {copiedField === `${activeTab}-seo-desc` ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : null}
              {current.keywords && current.keywords.length > 0 ? (
                <div className="listingMetaRow listingMetaRowChips">
                  <span className="listingMetaKey">Keywords</span>
                  <div className="chipList">
                    {current.keywords.map((k) => <span className="chip" key={k}>{k}</span>)}
                  </div>
                  <button className="ghostButton compactButton" type="button"
                    onClick={() => copyToClipboard(current.keywords!.join(", "), `${activeTab}-keywords`)}>
                    {copiedField === `${activeTab}-keywords` ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {!current.title && !current.description && (
            <div className="listingEmpty">
              <p>No listing content for {activeTab}.</p>
              <small>Either this marketplace wasn't selected when you generated, or the AI provider failed for it — try Generate Listing Text again.</small>
            </div>
          )}
        </div>

        <div className="listingPanelFooter listingPanelFooterExport">
          <span className="exportLabel">Export:</span>
          {activeTab === "amazon"     && <button className="secondaryButton compactButton" type="button" onClick={() => handleExport("amazon")}>Amazon CSV ⬇</button>}
          {activeTab === "flipkart"   && <button className="secondaryButton compactButton" type="button" onClick={() => handleExport("flipkart")}>Flipkart CSV ⬇</button>}
          {activeTab === "meesho"     && <button className="secondaryButton compactButton" type="button" onClick={() => handleExport("meesho")}>Meesho CSV ⬇</button>}
          <button className="secondaryButton compactButton" type="button" onClick={() => handleExport("json")}>JSON ⬇</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Studio Page ────────────────────────────────────────────────────────────
export default function StudioPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadedImage[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [logo, setLogo] = useState<UploadedImage | null>(null);
  const [brief, setBrief] = useState<BriefState>(initialBrief);
  const [marketplaces, setMarketplaces] = useState<string[]>([]);
  const [selectedBasicTypes, setSelectedBasicTypes] = useState<string[]>([]);
  const [selectedAplusTypes, setSelectedAplusTypes] = useState<string[]>([]);

  const { isTourMode } = useTourContext();

  // Pre-select exactly one basic image type and lock A+ during the
  // onboarding tour — forces the selection every time tour mode turns on
  // (not just when empty), so a restart can't leave stale extra selections
  // picked while briefly unlocked.
  useEffect(() => {
    if (isTourMode) {
      setSelectedBasicTypes(["Main Product (White Background)"]);
      setSelectedAplusTypes([]);
    }
  }, [isTourMode]);

  // Drop selections that belong to a marketplace's image spec once that
  // marketplace is deselected — otherwise they'd keep counting toward cost
  // and generation while hidden from the now-inactive section.
  useEffect(() => {
    const flipkartActive = marketplaces[0] === "Flipkart";
    const meeshoActive = marketplaces[0] === "Meesho";
    const visibleBasic = new Set(
      flipkartActive ? FLIPKART_BASIC_IMAGE_TYPES
      : meeshoActive ? [...MEESHO_GALLERY_IMAGE_TYPES, ...MEESHO_INFOGRAPHIC_IMAGE_TYPES]
      : BASIC_IMAGE_TYPES
    );
    const visibleAplus = new Set(flipkartActive ? FLIPKART_APLUS_IMAGE_TYPES.map((t) => t.id) : meeshoActive ? [] : APLUS_IMAGE_TYPES.map((t) => t.id));
    setSelectedBasicTypes((prev) => prev.filter((t) => visibleBasic.has(t)));
    setSelectedAplusTypes((prev) => prev.filter((t) => visibleAplus.has(t)));
  }, [marketplaces]);
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [productColors, setProductColors] = useState<string[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pulseLogoBtn, setPulseLogoBtn] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImageResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [isGeneratingListing, setIsGeneratingListing] = useState(false);
  const [listings, setListings] = useState<AllListings | null>(null);
  const [showListingPanel, setShowListingPanel] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);

  // ── History sidebar ────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // ── First-time onboarding ────────────────────────────────────────────────────
  const [showOnboard, setShowOnboard] = useState(true);
  const [formWarnings, setFormWarnings] = useState<string[]>([]);

  function dismissOnboard() {
    setShowOnboard(false);
  }

  function markOnboardDone() {
    setShowOnboard(false);
  }

  // ── Credits ─────────────────────────────────────────────────────────────────
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(false);

  function loadCredits() {
    setCreditsLoading(true);
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.balance === "number") setCreditBalance(data.balance);
      })
      .catch(console.error)
      .finally(() => setCreditsLoading(false));
  }

  useEffect(() => {
    loadCredits();
  }, []);

  // ── First-login welcome credit popup ─────────────────────────────────────────
  const [showCreditWelcome, setShowCreditWelcome] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/credits/welcome")
      .then((r) => r.json())
      .then((data) => {
        if (data.show) setShowCreditWelcome(true);
      })
      .catch(console.error);
  }, [session?.user?.id]);

  function dismissCreditWelcome() {
    setShowCreditWelcome(false);
    loadCredits();
  }

  // Calculate cost preview
  const selectedCost = {
    basic: selectedBasicTypes.length,
    aplus: selectedAplusTypes.length,
    total: selectedBasicTypes.length * IMAGE_COST.basic + selectedAplusTypes.length * IMAGE_COST.aplus,
  };
  const canAfford = creditBalance >= selectedCost.total;

  // Which image-type option set(s) to show: each marketplace with its own spec gets
  // its own section. Amazon and Meesho (no dedicated spec yet) share the generic set;
  // Flipkart gets its own Product Gallery + RPD spec.
  const showFlipkartImageOptions = marketplaces[0] === "Flipkart";
  const showMeeshoImageOptions = marketplaces[0] === "Meesho";
  const showGenericImageOptions = !showFlipkartImageOptions && !showMeeshoImageOptions;

  function loadHistory() {
    setHistoryLoading(true);
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistoryItems(data);
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }

  useEffect(() => {
    if (showHistory && historyItems.length === 0) loadHistory();
  }, [showHistory]);

  async function loadHistoryItem(id: string) {
    setActiveHistoryId(id);
    try {
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      if (data.images) {
        setGeneratedImages(
          data.images.map((img: { type: string; mimeType: string; url: string; storageKey?: string; isAplus?: boolean; width?: number; height?: number }) => ({
            type: img.type,
            mimeType: img.mimeType,
            data: "",
            url: img.url,
            storageKey: img.storageKey,
            isAplus: img.isAplus,
            width: img.width ?? 1024,
            height: img.height ?? 1024,
          }))
        );
        setListings(data.listings ?? null);
        setShowListingPanel(false);
        setCurrentGenerationId(id);
        setShowHistory(false);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveHistoryId(null);
    }
  }

  function handleGenerationSuccess(newImages: GeneratedImageResult[], newId?: string) {
    setGeneratedImages(newImages);
    setCurrentGenerationId(newId ?? null);
    loadHistory();
    loadCredits(); // Refresh credit balance
    if (showOnboard) dismissOnboard();
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
      if (logo) URL.revokeObjectURL(logo.url);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addNotification(notification: Omit<Notification, "id">) {
    const id = generateId();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function toggleBasicImageType(value: string) {
    if (isTourMode) return;
    const isRemoving = selectedBasicTypes.includes(value);
    if (!isRemoving) {
      const nextCost = (selectedBasicTypes.length + 1) * IMAGE_COST.basic + selectedAplusTypes.length * IMAGE_COST.aplus;
      if (nextCost > creditBalance) {
        addNotification({ type: "error", message: `Insufficient credits — this would need ${nextCost}, you have ${creditBalance}.` });
        return;
      }
    }
    setSelectedBasicTypes((prev) => toggleValue(prev, value));
  }

  function toggleAplusImageType(value: string) {
    if (isTourMode) return;
    const isRemoving = selectedAplusTypes.includes(value);
    if (!isRemoving) {
      const nextCost = selectedBasicTypes.length * IMAGE_COST.basic + (selectedAplusTypes.length + 1) * IMAGE_COST.aplus;
      if (nextCost > creditBalance) {
        addNotification({ type: "error", message: `Insufficient credits — this would need ${nextCost}, you have ${creditBalance}.` });
        return;
      }
    }
    setSelectedAplusTypes((prev) => toggleValue(prev, value));
  }

  function updateBrief(field: keyof BriefState, value: string) {
    setBrief((current) => ({ ...current, [field]: value }));
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (incoming.length === 0) return;

    setImages((current) => {
      const openSlots = Math.max(0, MAX_PHOTOS - current.length);
      const nextImages = incoming.slice(0, openSlots).map((file, index) => ({
        id: createImageId(file, index), name: file.name, size: formatBytes(file.size),
        url: URL.createObjectURL(file), file
      }));
      if (nextImages.length > 0) setStatusMessage("");
      return [...current, ...nextImages];
    });
  }

  async function triggerAnalyze(imgs: UploadedImage[]) {
    if (isAnalyzing || imgs.length === 0) return;
    setIsAnalyzing(true);
    setStatusMessage("AI is analyzing your photos...");

    const formData = new FormData();
    imgs.forEach((img) => formData.append("photos", img.file));

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Analysis failed.");
      }

      applyAnalysis(result);
      addNotification({
        type: "success",
        message: `✓ AI detected: ${result.productType || "product"}`,
        fields: [
          result.material !== "Unknown" ? result.material : null,
          result.color !== "Unknown" ? result.color : null,
          result.targetAudience !== "General" ? result.targetAudience : null,
          ...(result.keyFeatures ?? []).slice(0, 2)
        ].filter(Boolean) as string[]
      });
    } catch (error) {
      addNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Analysis failed."
      });
    } finally {
      setIsAnalyzing(false);
      setStatusMessage("");
    }
  }

  function applyAnalysis(result: ProductAnalysis) {
    const filledFields: string[] = [];

    setBrief((prev) => {
      const next = { ...prev };

      if (result.productType && result.productType !== "Unknown" && result.productType !== "Review Raw") {
        next.productName = prev.productName || result.productType;
        filledFields.push(result.productType);
      }

      if (result.brand && result.brand !== "Unknown") {
        next.brandName = prev.brandName || result.brand;
        filledFields.push(`Brand: ${result.brand}`);
      }

      if (result.material && result.material !== "Unknown") {
        next.material = prev.material || result.material;
        filledFields.push(result.material);
      }

      if (result.dimensions && result.dimensions !== "Not visible") {
        next.dimensions = prev.dimensions || result.dimensions;
      }

      if (result.weight && result.weight !== "Not visible") {
        next.weight = prev.weight || result.weight;
      }

      if (result.targetAudience && result.targetAudience !== "General") {
        next.targetAudience = prev.targetAudience || result.targetAudience;
        filledFields.push(result.targetAudience);
      }

      if (result.countryOfOrigin && result.countryOfOrigin !== "Not visible") {
        next.countryOfOrigin = prev.countryOfOrigin || result.countryOfOrigin;
      }

      if (result.warranty && result.warranty !== "Not specified") {
        next.warranty = prev.warranty || result.warranty;
      }

      return next;
    });

    // Apply key features as chips (merge, max 6)
    if (result.keyFeatures && result.keyFeatures.length > 0) {
      setKeyFeatures((prev) => {
        const merged = [...new Set([...prev, ...result.keyFeatures!])].slice(0, MAX_FEATURES);
        return merged;
      });
      filledFields.push(`${result.keyFeatures.length} features`);
    }

    // Apply color from AI analysis (extract first color if it looks like a color)
    if (result.color && result.color !== "Unknown") {
      const colorParts = result.color.split(/[,&\/]/).map((c: string) => c.trim()).filter(Boolean);
      setProductColors((prev) => {
        const merged = [...new Set([...prev, ...colorParts])].slice(0, MAX_PRODUCT_COLORS);
        return merged;
      });
      filledFields.push(result.color);
    }

    return filledFields;
  }

  function removeImage(id: string) {
    setImages((current) => {
      const imageToRemove = current.find((image) => image.id === id);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);
      return current.filter((image) => image.id !== id);
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    setPulseLogoBtn(false);
    setLogo((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return { id: createImageId(file, 0), name: file.name, size: formatBytes(file.size), url: URL.createObjectURL(file), file };
    });
  }

  function removeLogo() {
    setLogo((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }


  function resetBrief() {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    setPulseLogoBtn(false);
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    imagesRef.current = [];
    setImages([]);
    if (logo) URL.revokeObjectURL(logo.url);
    setLogo(null);
    setBrief(initialBrief);
    setMarketplaces([]);
    setSelectedBasicTypes([]);
    setSelectedAplusTypes([]);
    setKeyFeatures([]);
    setProductColors([]);
    setBrandColors([]);
    setStatusMessage("");
    setListings(null);
    setShowListingPanel(false);
    setNotifications([]);
  }

  // ── Image Generation ───────────────────────────────────────────────────────────
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requiredChecks: Array<{ bad: boolean; message: string; targetId: string }> = [
      { bad: images.length === 0, message: "Add at least one product photo.", targetId: "photos" },
      { bad: !brief.productName.trim(), message: "Add a product name.", targetId: "product-name-field" },
      { bad: !brief.category.trim(), message: "Add a product category.", targetId: "category-field" },
      { bad: marketplaces.length === 0, message: "Select a marketplace.", targetId: "marketplace-section" },
      { bad: selectedBasicTypes.length === 0 && selectedAplusTypes.length === 0, message: "Pick at least one image type.", targetId: showFlipkartImageOptions ? "flipkart-gallery-section" : showMeeshoImageOptions ? "meesho-gallery-section" : "basic-images-section" },
    ];

    const warnings = requiredChecks.filter((c) => c.bad).map((c) => c.message);
    if (!canAfford) warnings.push(`Insufficient credits — need ${selectedCost.total}, have ${creditBalance}.`);

    if (warnings.length > 0) {
      setFormWarnings(warnings);

      // Jump the user straight to the first thing that needs fixing instead
      // of leaving them to hunt for it in a long form.
      const firstBad = requiredChecks.find((c) => c.bad);
      const targetId = firstBad ? firstBad.targetId : (!canAfford ? "submit-section" : null);
      const el = targetId ? document.getElementById(targetId) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = (
          el.matches("input, textarea")
            ? el
            : el.querySelector<HTMLElement>("input, textarea")
        );
        focusable?.focus({ preventScroll: true });
        el.classList.add("fieldFlash");
        setTimeout(() => el.classList.remove("fieldFlash"), 1200);
      }

      return;
    }
    setFormWarnings([]);

    setIsGenerating(true);
    setGeneratedImages([]);
    setListings(null);
    setShowListingPanel(false);
    setCurrentGenerationId(null);
    const imageTypes = [...selectedBasicTypes, ...selectedAplusTypes];
    setStatusMessage(`Generating ${imageTypes.length} image${imageTypes.length === 1 ? "" : "s"}...`);
    const payload = { ...brief, marketplaces, imageTypes, keyFeatures, productColors, brandColors };
    const formData = new FormData();
    formData.set("brief", JSON.stringify(payload));
    images.forEach((image) => formData.append("photos", image.file));

    try {
      const response = await fetch("/api/generate", { method: "POST", body: formData });
      const result = await response.json();

      // Handle insufficient credits (402)
      if (response.status === 402) {
        loadCredits();
        setStatusMessage(result.error || "Insufficient credits.");
        return;
      }

      if (!response.ok) throw new Error(result.error || "Image generation failed.");

      const newImages = (result.images || []) as GeneratedImageResult[];
      setGeneratedImages(newImages);

      // Update credit display with new balance from server
      if (typeof result.newBalance === "number") {
        setCreditBalance(result.newBalance);
      }

      setStatusMessage(
        `Done — ${newImages.length} image${newImages.length === 1 ? "" : "s"} generated.`
      );
      handleGenerationSuccess(newImages, result.id);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Image generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Listing Generation ───────────────────────────────────────────────────────
  async function handleGenerateListing() {
    if (!brief.productName.trim()) { setStatusMessage("Product name is required."); return; }
    setIsGeneratingListing(true);
    setStatusMessage("Generating listings for all marketplaces...");
    const payload = { ...brief, marketplaces, keyFeatures, productColors };

    try {
      const response = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: payload, generationId: currentGenerationId })
      });
      const { id: savedId, failedMarketplaces, ...result } = await response.json();
      if (!response.ok) throw new Error((result as { error?: string }).error || "Listing generation failed.");
      setListings(result as AllListings);
      setShowListingPanel(true);
      setStatusMessage("");
      if (savedId) setCurrentGenerationId(savedId);
      loadHistory();

      const failed = (failedMarketplaces as string[] | undefined) ?? [];
      if (failed.length > 0) {
        addNotification({
          type: "error",
          message: `⚠ Couldn't generate a listing for ${failed.join(", ")} — the AI provider failed for that marketplace. The others were saved.`,
        });
      } else {
        addNotification({ type: "success", message: "✓ Listings generated for all marketplaces — saved to history!" });
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Listing generation failed.");
    } finally {
      setIsGeneratingListing(false);
    }
  }

  function getImageAspectRatio(image: GeneratedImageResult): string {
    // Use actual image dimensions when available
    if (image.width && image.height) {
      return `${image.width} / ${image.height}`;
    }
    const t = image.type;
    if (t === "Main Product (White Background)") return "1 / 1";
    if (t === "Front/Side Angle") return "3 / 2";
    if (t === "Key Features Infographic") return "1 / 1";
    if (t === "Dimensions") return "3 / 2";
    if (t === "Product in Use (Lifestyle)") return "3 / 2";
    if (t === "Close-up / Material Quality") return "1 / 1";
    if (t === "What's in the Box") return "3 / 2";
    if (t === "Comparison / Benefits") return "3 / 2";
    if (t === "Brand Story / Warranty") return "2 / 3";
    if (t === "Standard Banner") return "970 / 300";
    if (t === "Banner with Text Overlay") return "970 / 300";
    if (t === "Standard Image & Text") return "1 / 1";
    if (t === "Three Image Module") return "1464 / 400";
    if (t === "Four Image Module") return "1464 / 800";
    if (t === "Hero Listing Image") return "1500 / 1000";
    if (t === "A+ Lifestyle Banner") return "1464 / 600";
    if (t === "A+ Product Photo") return "1 / 1";
    return "1 / 1";
  }

  function getImageFilename(image: GeneratedImageResult) {
    const isAplus = image.type.includes("A+");
    const size = (brief.customWidth && brief.customHeight)
      ? `${brief.customWidth}x${brief.customHeight}`
      : brief.resolution === "4K" ? "2048x2048" : brief.resolution === "HD" ? "1280x1280" : "1024x1024";
    const sizeSuffix = isAplus ? `-${size}` : "";
    return `${image.type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}${sizeSuffix}.${image.mimeType.split("/")[1] || "png"}`;
  }

  async function downloadImage(image: GeneratedImageResult) {
    let blob: Blob;
    if (image.data) {
      const binaryString = atob(image.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: image.mimeType });
    } else if (image.url) {
      const res = await fetch(image.url);
      if (!res.ok) { setStatusMessage("Download failed."); return; }
      blob = await res.blob();
    } else {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getImageFilename(image);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function downloadAllAsZip() {
    if (generatedImages.length === 0) return;
    setStatusMessage(`Zipping ${generatedImages.length} images...`);
    const zip = new JSZip();
    const folder = zip.folder("generated-images");
    if (!folder) return;

    for (const image of generatedImages) {
      let bytes: Uint8Array;
      if (image.data) {
        const binaryString = atob(image.data);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else if (image.url) {
        const res = await fetch(image.url);
        if (!res.ok) continue;
        const ab = await res.arrayBuffer();
        bytes = new Uint8Array(ab);
      } else {
        continue;
      }
      folder.file(getImageFilename(image), bytes);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `images-${(brief.productName || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage("");
  }

  const validationIssue = (() => {
    if (images.length === 0) return "Add at least one product photo.";
    if (!brief.productName.trim()) return "Add a product name.";
    if (!brief.category.trim()) return "Add a product category.";
    if (marketplaces.length === 0) return "Select a marketplace.";
    if (selectedBasicTypes.length === 0 && selectedAplusTypes.length === 0) {
      return "Select at least one image type below.";
    }
    return null;
  })();

  const briefSummary = [
    `${images.length} photo${images.length === 1 ? "" : "s"}`,
    brief.productName || "Product name pending",
    brief.category || "Category pending",
    ...(marketplaces.length > 0 ? [marketplaces.join(", ")] : []),
    brief.background === "Custom Color" ? `Custom ${brief.customBackgroundColor}` : brief.background,
    brief.aiStyle,
    `${brief.imageFormat} · ${brief.resolution}`
  ];

  return (
    <OnboardingProvider tourMode>
    <main className={`studioPage${showHistory ? " historyOpen" : ""}`} suppressHydrationWarning>
      <CreditWelcomeModal visible={showCreditWelcome} onClose={dismissCreditWelcome} />

      {/* ── Notification Toasts ── */}
      <div className="toastContainer" aria-live="polite" aria-atomic="true">
        {notifications.map((n) => (
          <NotificationToast key={n.id} notification={n} onDismiss={() => dismissNotification(n.id)} />
        ))}
      </div>

      {/* ── Photo analysis overlay ── */}
      {isAnalyzing && (
        <div className="analyzeOverlay" role="status" aria-live="polite" aria-label="Analyzing photos">
          <div className="analyzeOverlayCard">
            <span className="analyzeOverlaySpinner" aria-hidden="true" />
            <strong>Analyzing your photos…</strong>
            <p>Our AI is reading product details, colors, and features to auto-fill your brief.</p>
          </div>
        </div>
      )}

      {/* ── Listing generation overlay ── */}
      {isGeneratingListing && (
        <div className="analyzeOverlay" role="status" aria-live="polite" aria-label="Generating listing text">
          <div className="analyzeOverlayCard">
            <span className="analyzeOverlaySpinner" aria-hidden="true" />
            <strong>Writing your listings…</strong>
            <p>AI is drafting titles, bullet points, and descriptions for {marketplaces.length > 0 ? marketplaces.join(", ") : "your marketplaces"}.</p>
          </div>
        </div>
      )}

      {/* ── History Sidebar ── */}
      {showHistory && (
        <>
          <div className="historyBackdrop" onClick={() => setShowHistory(false)} />
          <aside className="historySidebar" aria-label="Generation history">
            <div className="historySidebarHead">
              <h2>Your Generations</h2>
              <button className="ghostButton compactButton" type="button" onClick={() => setShowHistory(false)} aria-label="Close history">✕</button>
            </div>

            {historyLoading ? (
              <div className="historyEmpty">
                <span className="spinner" />
                <p>Loading...</p>
              </div>
            ) : historyItems.length === 0 ? (
              <div className="historyEmpty">
                <p>No generations yet.</p>
                <small>Create your first set of images above.</small>
              </div>
            ) : (
              <ul className="historyList" role="list">
                {historyItems.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`historyItem${activeHistoryId === item.id ? " isLoading" : ""}`}
                      type="button"
                      onClick={() => loadHistoryItem(item.id)}
                      disabled={!!activeHistoryId}
                    >
                      <div className="historyThumb">
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt={item.productName}
                            loading="lazy"
                          />
                        ) : (
                          <div className="historyThumbPlaceholder">🖼</div>
                        )}
                        <span className="historyCount">{item.imageCount}</span>
                      </div>
                      <div className="historyMeta">
                        <strong>{item.productName || "Untitled"}</strong>
                        <span>{item.category || "General"}</span>
                        {item.marketplaces?.length > 0 && (
                          <span className="historyMarketplaces">{item.marketplaces.join(", ")}</span>
                        )}
                        <div className="historyMetaFooter">
                          <time className="historyTime">{formatHistoryTime(item.createdAt)}</time>
                          {item.hasListing && <span className="historyListingBadge">📝 Listing</span>}
                        </div>
                      </div>
                      {activeHistoryId === item.id && <span className="spinner" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </>
      )}

      <header className="studioTopBar">
        <Link className="studioBrand" href="/">
          <span className="brandMark" aria-hidden="true">AI</span>
          <span><strong>VendorFlow</strong><small>AI image generation</small></span>
        </Link>
        <div className="studioTopActions">
          <button
            id="history-toggle-btn"
            className={`historyToggleBtn${showHistory ? " isActive" : ""}`}
            type="button"
            onClick={() => { setShowHistory((v) => !v); if (!showHistory) loadHistory(); }}
            title="Generation history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>History</span>
          </button>
          <div className="userMenu">
            <button className="userAvatar" type="button" onClick={() => setShowUserMenu((v) => !v)} title="Account">
              <span>{session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}</span>
            </button>
            {showUserMenu && (
              <>
                <div className="userMenuBackdrop" onClick={() => setShowUserMenu(false)} />
                <div className="userMenuDropdown">
                  <div className="userMenuHeader">
                    <div className="userMenuName">{session?.user?.name || "User"}</div>
                    <div className="userMenuEmail">{session?.user?.email}</div>
                  </div>
                  <div className="userMenuCredits">
                    <span className="userMenuCreditsLabel">Credit balance</span>
                    <span className="userMenuCreditsAmount">{creditBalance} Credits</span>
                    <button className="userMenuCreditsRefresh" type="button" onClick={(e) => { e.stopPropagation(); loadCredits(); }}>↻</button>
                  </div>
                  <div className="userMenuDivider" />
                  <Link href="/credits" className="userMenuItemLink" onClick={() => setShowUserMenu(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    Buy Credits
                  </Link>
                  <div className="userMenuDivider" />
                  <button className="userMenuItem" type="button" onClick={() => { setShowUserMenu(false); loadHistory(); setShowHistory(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Generation History
                  </button>
                  <div className="userMenuDivider" />
                  <button className="userMenuItem userMenuSignout" type="button" onClick={() => signOut({ redirectTo: "/" })}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <form className="studioWorkspace" onSubmit={handleSubmit}>
        <section className="uploadColumn" id="photos" aria-labelledby="upload-title">
          <div className="formSectionHead">
            <p className="eyebrow">Upload</p>
            <h1 id="upload-title">Product photos</h1>
            <p className="sectionDesc">Front, side, back, and detail shots. Photos are auto-analyzed by AI after upload.</p>
          </div>

          <div className={`dropZone${isDragging ? " isDragging" : ""}`}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}>
            <input ref={fileInputRef} className="fileInput" type="file" accept="image/*" multiple onChange={handleFileChange} />
            <span className="uploadIcon" aria-hidden="true">+</span>
            <strong>Drop product photos</strong>
            <small>PNG, JPG, or WEBP. Up to {MAX_PHOTOS} images.</small>
            <button className="secondaryButton compactButton" type="button" onClick={() => fileInputRef.current?.click()}>Choose photos</button>
          </div>

          {images.length > 0 ? (
            <div className="previewGrid" aria-label="Selected product photo previews">
              {images.map((image) => (
                <article className="previewTile" key={image.id}>
                  <div className="previewImage">
                    <Image src={image.url} alt={`Preview of ${image.name}`} fill sizes="160px" unoptimized />
                  </div>
                  <div className="previewMeta"><strong>{image.name}</strong><span>{image.size}</span></div>
                  <button className="removeButton" type="button" onClick={() => removeImage(image.id)}
                    aria-label={`Remove ${image.name}`}>&times;</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyPreview" aria-hidden="true">
              {["Front", "Side", "Detail", "Scale"].map((slot) => <span key={slot}>{slot}</span>)}
            </div>
          )}

          <div className="uploadDivider" />

          <div className="logoSection" id="logo-section">
            <div className="formSectionHead">
              <p className="eyebrow">Branding</p>
              <h2>Logo</h2>
              <p className="sectionDesc">Optional. Used to place your mark on packaging or banner shots.</p>
            </div>

            {logo ? (
              <div className="logoPreview">
                <div className="previewImage logoPreviewImage">
                  <Image src={logo.url} alt={`Preview of ${logo.name}`} fill sizes="72px" unoptimized />
                </div>
                <div className="previewMeta"><strong>{logo.name}</strong><span>{logo.size}</span></div>
                <button className="ghostButton compactButton" type="button" onClick={removeLogo}>Remove</button>
              </div>
            ) : (
              <div className={`dropZone compactDrop${pulseLogoBtn ? " isPulsing" : ""}`}>
                <input ref={logoInputRef} className="fileInput" type="file" accept="image/*" onChange={handleLogoChange} />
                <small>No logo uploaded</small>
                <button
                  className={`secondaryButton compactButton${pulseLogoBtn ? " isPulsing" : ""}`}
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Upload logo
                </button>
              </div>
            )}
          </div>

          {images.length > 0 ? (
            <div id="analyze-trigger">
              <button
                className="secondaryButton fullButton"
                type="button"
                disabled={isAnalyzing}
                onClick={() => triggerAnalyze(images)}
              >
                {isAnalyzing ? "Analyzing…" : "Analyze Photos"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="formColumn" id="details" aria-labelledby="details-title">
          <div className="workspaceHeader formHeader">
            <div>
              <p className="eyebrow">Listing brief</p>
              <h2 id="details-title">Build the image brief</h2>
              <p>Add product, marketplace, style, and output details for the final image set.</p>
            </div>
            <button className="ghostButton" type="button" onClick={resetBrief}>Reset</button>
          </div>

          <FormSection id="product-basics-section" eyebrow="Required" title="Product basics">
            <div className="formGrid">
              <label>
                <span>
                  Product name <span className="requiredMark">*</span>
                  <span className="helpTip">
                    <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                    <span className="helpTipBubble">The exact name buyers will see. Include model/type if relevant — this shapes the AI image context.</span>
                  </span>
                </span>
                <input id="product-name-field" type="text" value={brief.productName} onChange={(e) => updateBrief("productName", e.target.value)} placeholder="Wireless desk lamp" />
              </label>
              <label>
                <span>
                  Category <span className="requiredMark">*</span>
                  <span className="helpTip">
                    <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                    <span className="helpTipBubble">Helps the AI apply correct lifestyle context and background styling for each marketplace.</span>
                  </span>
                </span>
                <input id="category-field" type="text" list="category-suggestions" value={brief.category}
                  onChange={(e) => updateBrief("category", e.target.value)} placeholder="Electronics, Clothing, Furniture..." />
                <datalist id="category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((cat) => <option value={cat} key={cat} />)}
                </datalist>
              </label>
              <label>
                <span>
                  Brand name
                  <span className="helpTip">
                    <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                    <span className="helpTipBubble">Optional — used for A+ banner overlays and brand story images.</span>
                  </span>
                </span>
                <input id="brand-name-field" type="text" value={brief.brandName} onChange={(e) => updateBrief("brandName", e.target.value)} placeholder="Optional if unbranded" />
              </label>
              <label><span>SKU</span>
                <input id="sku-field" type="text" value={brief.sku} onChange={(e) => updateBrief("sku", e.target.value)} placeholder="Optional" />
              </label>
            </div>
          </FormSection>

          <FormSection id="marketplace-section" eyebrow="Required" title="Marketplace & background">
            <CheckGrid legend={<><span className="requiredMark">*</span> Marketplace</>}
              options={MARKETPLACES} values={marketplaces}
              onToggle={(value) => setMarketplaces([value])} columns={3} singleSelect name="marketplace" />
            <PillGroup legend="Background preference" options={BACKGROUND_OPTIONS}
              value={brief.background} onChange={(value) => updateBrief("background", value)} />
            {brief.background === "Custom Color" ? (
              <label className="inlineField colorField"><span>Custom background color</span>
                <div className="colorFieldRow">
                  <input className="colorPicker" type="color" value={brief.customBackgroundColor}
                    onChange={(e) => updateBrief("customBackgroundColor", e.target.value)} />
                  <input type="text" value={brief.customBackgroundColor}
                    onChange={(e) => updateBrief("customBackgroundColor", e.target.value)} />
                </div>
              </label>
            ) : null}
          </FormSection>

          <FormSection id="features-section" eyebrow="Product details" title="Features, color & specs">
            <ChipInput id="key-features-field" legend="Key features" hint={`Add ${MIN_FEATURES}–${MAX_FEATURES} points.`}
              values={keyFeatures} onAdd={(value) => setKeyFeatures((current) => [...current, value])}
              onRemove={(value) => setKeyFeatures((current) => current.filter((item) => item !== value))}
              placeholder="Type a feature and press Enter" max={MAX_FEATURES} />
            <ChipInput id="product-colors-field" legend="Product color(s)" values={productColors}
              onAdd={(value) => setProductColors((current) => [...current, value])}
              onRemove={(value) => setProductColors((current) => current.filter((item) => item !== value))}
              placeholder="Type a color and press Enter" max={MAX_PRODUCT_COLORS} withColorPicker />
            <div className="formGrid">
              <label id="material-field"><span>Material</span>
                <input type="text" value={brief.material} onChange={(e) => updateBrief("material", e.target.value)} placeholder="Optional" />
              </label>
              <label id="dimensions-field"><span>Dimensions</span>
                <input type="text" value={brief.dimensions} onChange={(e) => updateBrief("dimensions", e.target.value)} placeholder="Optional" />
              </label>
              <label id="weight-field"><span>Weight</span>
                <input type="text" value={brief.weight} onChange={(e) => updateBrief("weight", e.target.value)} placeholder="Optional" />
              </label>
            </div>
          </FormSection>

          <FormSection id="branding-section" eyebrow="Branding" title="Brand look & feel">
            <ChipInput id="brand-colors-field" legend="Brand colors" values={brandColors}
              onAdd={(value) => setBrandColors((current) => [...current, value])}
              onRemove={(value) => setBrandColors((current) => current.filter((item) => item !== value))}
              placeholder="Pick or type a hex color" max={MAX_BRAND_COLORS} withColorPicker />
            <PillGroup id="font-style-field" legend="Preferred font style" options={FONT_STYLES}
              value={brief.fontStyle} onChange={(value) => updateBrief("fontStyle", value)} />
          </FormSection>

          <FormSection id="custom-prompt-section" eyebrow="Your voice" title="Anything else the AI should know?"
            description="Type freely — this is added to every image prompt, on top of the fields above.">
            <label id="custom-prompt-field" className="promptField"><span>Custom prompt</span>
              <textarea value={brief.customPrompt} onChange={(e) => updateBrief("customPrompt", e.target.value)}
                placeholder="Keep the original color, add soft shadows, show premium packaging..." rows={4} />
            </label>
          </FormSection>

          {/* Basic Images */}
          {showGenericImageOptions && (
            <FormSection id="basic-images-section" eyebrow="Basic Images" title="Select basic images">
              <div className="imageTypeSectionHeader">
                <span className="imageTypeBadge basic">Basic</span>
                <span className="imageTypePrice">{IMAGE_COST.basic} Credit per image · nano-banana AI</span>
                <span className="helpTip" style={{ marginLeft: "auto" }}>
                  <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                  <span className="helpTipBubble">Standard listing images for product pages — main shot, angles, lifestyle, and feature infographics.</span>
                </span>
              </div>
              <CheckGrid legend="Basic image types" options={BASIC_IMAGE_TYPES} values={selectedBasicTypes}
                onToggle={toggleBasicImageType} columns={2} disabled={isTourMode} />
            </FormSection>
          )}

          {/* A+ Listing Images */}
          {showGenericImageOptions && (
            <FormSection id="aplus-images-section" eyebrow="A+ Listing Images" title="Premium A+ images">
              <div className="imageTypeSectionHeader">
                <span className="imageTypeBadge aplus">A+ Premium</span>
                <span className="imageTypePrice">{IMAGE_COST.aplus} Credits per image · GPT Image 2 AI</span>
                <span className="helpTip" style={{ marginLeft: "auto" }}>
                  <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                  <span className="helpTipBubble">Rich A+ Content banners for Amazon — high-quality composite images with text overlays.</span>
                </span>
              </div>
              <AplusOptionGrid options={APLUS_IMAGE_TYPES} values={selectedAplusTypes} onToggle={toggleAplusImageType} disabled={isTourMode} />
            </FormSection>
          )}

          {/* Flipkart Product Gallery */}
          {showFlipkartImageOptions && (
            <FormSection id="flipkart-gallery-section" eyebrow="Flipkart Product Gallery" title="Select Flipkart gallery images">
              <div className="imageTypeSectionHeader">
                <span className="imageTypeBadge basic">Basic</span>
                <span className="imageTypePrice">{IMAGE_COST.basic} Credit per image · nano-banana AI · 1024×1024</span>
                <span className="helpTip" style={{ marginLeft: "auto" }}>
                  <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                  <span className="helpTipBubble">Flipkart&apos;s 1–8 image product gallery — square 1024×1024 (ideal up to 2048×2048), pure white main image.</span>
                </span>
              </div>
              <CheckGrid legend="Flipkart gallery slots" options={FLIPKART_BASIC_IMAGE_TYPES} values={selectedBasicTypes}
                onToggle={toggleBasicImageType} columns={2} disabled={isTourMode} />
            </FormSection>
          )}

          {/* Flipkart Rich Product Description (RPD) */}
          {showFlipkartImageOptions && (
            <FormSection id="flipkart-rpd-section" eyebrow="Flipkart RPD" title="Rich Product Description modules">
              <div className="imageTypeSectionHeader">
                <span className="imageTypeBadge aplus">RPD Premium</span>
                <span className="imageTypePrice">{IMAGE_COST.aplus} Credits per image · GPT Image 2 AI</span>
                <span className="helpTip" style={{ marginLeft: "auto" }}>
                  <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                  <span className="helpTipBubble">Flipkart doesn&apos;t call these &quot;A+&quot; — sellers still build these visual modules for an enhanced product page (RPD).</span>
                </span>
              </div>
              <AplusOptionGrid options={FLIPKART_APLUS_IMAGE_TYPES} values={selectedAplusTypes} onToggle={toggleAplusImageType} disabled={isTourMode} />
            </FormSection>
          )}

          {/* Meesho Product Gallery */}
          {showMeeshoImageOptions && (
            <FormSection id="meesho-gallery-section" eyebrow="Meesho Product Gallery" title="Select Meesho gallery images">
              <div className="imageTypeSectionHeader">
                <span className="imageTypeBadge basic">Basic</span>
                <span className="imageTypePrice">{IMAGE_COST.basic} Credit per image · nano-banana AI · 1000×1000</span>
                <span className="helpTip" style={{ marginLeft: "auto" }}>
                  <button className="helpTipBtn" type="button" tabIndex={0}>?</button>
                  <span className="helpTipBubble">Meesho&apos;s 3–8 image product gallery — square 1000×1000, white/light background main image, no text or watermarks.</span>
                </span>
              </div>
              <CheckGrid legend="Meesho gallery slots" options={MEESHO_GALLERY_IMAGE_TYPES} values={selectedBasicTypes}
                onToggle={toggleBasicImageType} columns={2} disabled={isTourMode} />
            </FormSection>
          )}

          {/* Meesho Infographic Images */}
          {showMeeshoImageOptions && (
            <FormSection id="meesho-infographic-section" eyebrow="Meesho Infographics" title="Informational graphics (optional)"
              description="Meesho has no separate A+ section — these live in the regular gallery at the same basic price.">
              <div className="imageTypeSectionHeader">
                <span className="imageTypeBadge basic">Basic</span>
                <span className="imageTypePrice">{IMAGE_COST.basic} Credit per image · nano-banana AI · 1000×1000</span>
              </div>
              <CheckGrid legend="Meesho infographic types" options={MEESHO_INFOGRAPHIC_IMAGE_TYPES} values={selectedBasicTypes}
                onToggle={toggleBasicImageType} columns={2} disabled={isTourMode} />
            </FormSection>
          )}

          <FormSection id="ai-preferences-section" eyebrow="AI preferences" title="Style, text & language">
            <PillGroup legend="Image style" options={AI_IMAGE_STYLES} value={brief.aiStyle}
              onChange={(value) => updateBrief("aiStyle", value)} />
            <PillGroup legend="Text on image" options={TEXT_ON_IMAGE_OPTIONS} value={brief.textOnImage}
              onChange={(value) => updateBrief("textOnImage", value)} />
            <PillGroup legend="Language" options={LANGUAGE_OPTIONS} value={brief.language}
              onChange={(value) => updateBrief("language", value)} />
          </FormSection>

          <FormSection id="output-section" eyebrow="Output" title="Quantity, size & format">
            <div className="formGrid">
              <label><span>Number of variant sets</span>
                <input type="number" min="1" max="10" value={brief.variantSets}
                  onChange={(e) => updateBrief("variantSets", e.target.value)} placeholder="1" />
              </label>
              <label><span>Quantity per set (pieces shown in-frame)</span>
                <input type="number" min="1" max="12" value={brief.quantityPerSet}
                  onChange={(e) => updateBrief("quantityPerSet", e.target.value)} placeholder="e.g. 2 for a pair" />
              </label>
              <label><span>Image format</span>
                <select value={brief.imageFormat}
                  onChange={(e) => updateBrief("imageFormat", e.target.value)}
                  style={{ minHeight: "42px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg)", color: "var(--ink)", padding: "0 0.75rem", fontSize: "0.85rem", fontWeight: "500", outline: "none", cursor: "pointer", width: "100%" }}>
                  {IMAGE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
            </div>

            <details className="optionalSection" style={{ border: "none", padding: "0", margin: "0" }}>
              <summary>
                <span>Basic image size (optional)</span>
                <span className="summaryChevron" aria-hidden="true" />
              </summary>
              <div className="optionalContent" style={{ paddingTop: "0.75rem" }}>
                <div className="formGrid formGridThree">
                  <label><span>Preset</span>
                    <select value={brief.resolution}
                      onChange={(e) => updateBrief("resolution", e.target.value)}
                      style={{ minHeight: "42px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg)", color: "var(--ink)", padding: "0 0.75rem", fontSize: "0.85rem", fontWeight: "500", outline: "none", cursor: "pointer", width: "100%" }}>
                        {RESOLUTIONS.map((r) => <option key={r} value={r}>{r} ({r === "Standard" ? "1024×1024" : r === "HD" ? "1280×1280" : "2048×2048"})</option>)}
                    </select>
                  </label>
                  <label><span>Width (px)</span>
                    <input type="number" min="128" max="4096" value={brief.customWidth}
                      onChange={(e) => updateBrief("customWidth", e.target.value)} placeholder="1024" />
                  </label>
                  <label><span>Height (px)</span>
                    <input type="number" min="128" max="4096" value={brief.customHeight}
                      onChange={(e) => updateBrief("customHeight", e.target.value)} placeholder="1024" />
                  </label>
                </div>
                <p className="fieldHint">Only applies to basic images. A+ images use fixed sizes.</p>
              </div>
            </details>
          </FormSection>

          <details className="formSection optionalSection">
            <summary>
              <span>Optional listing details</span>
              <span className="summaryChevron" aria-hidden="true" />
            </summary>
            <div className="optionalContent">
              <label className="promptField"><span>Product description</span>
                <textarea value={brief.description} onChange={(e) => updateBrief("description", e.target.value)}
                  placeholder="A short description buyers will see on the listing." rows={3} />
              </label>
              <div className="formGrid">
                <label><span>Target audience</span>
                  <input type="text" value={brief.targetAudience} onChange={(e) => updateBrief("targetAudience", e.target.value)}
                    placeholder="Students, creators, home workers" />
                </label>
                <label><span>Selling price</span>
                  <input type="text" value={brief.sellingPrice} onChange={(e) => updateBrief("sellingPrice", e.target.value)}
                    placeholder="₹999" />
                </label>
                <label><span>MRP</span>
                  <input type="text" value={brief.mrp} onChange={(e) => updateBrief("mrp", e.target.value)}
                    placeholder="₹1,499" />
                </label>
                <label><span>Discount %</span>
                  <input type="number" min="0" max="100" value={brief.discountPercent}
                    onChange={(e) => updateBrief("discountPercent", e.target.value)} placeholder="33" />
                </label>
                <label><span>Special offers</span>
                  <input type="text" value={brief.specialOffers} onChange={(e) => updateBrief("specialOffers", e.target.value)}
                    placeholder="Buy 1 Get 1, Bank offer..." />
                </label>
                <label><span>Warranty</span>
                  <input type="text" value={brief.warranty} onChange={(e) => updateBrief("warranty", e.target.value)}
                    placeholder="1 year manufacturer warranty" />
                </label>
                <label><span>Country of origin</span>
                  <input type="text" value={brief.countryOfOrigin} onChange={(e) => updateBrief("countryOfOrigin", e.target.value)}
                    placeholder="India" />
                </label>
              </div>
              <label className="promptField"><span>Package contents</span>
                <textarea value={brief.packageContents} onChange={(e) => updateBrief("packageContents", e.target.value)}
                  placeholder="1 x Product, 1 x USB-C cable, 1 x User manual" rows={2} />
              </label>
            </div>
          </details>

          <aside className="briefPanel" id="submit-section" aria-label="Generate and submit">
            {/* Cost preview — shown when image types are selected */}
            {(selectedCost.basic > 0 || selectedCost.aplus > 0) && (
              <div className="briefCostRow">
                <span className="briefCostLabel">
                  {selectedCost.basic > 0 && `${selectedCost.basic} basic @ ${IMAGE_COST.basic}cr`}
                  {selectedCost.basic > 0 && selectedCost.aplus > 0 && " · "}
                  {selectedCost.aplus > 0 && `${selectedCost.aplus} A+ @ ${IMAGE_COST.aplus}cr`}
                </span>
                <span className={`briefCostTotal${canAfford ? "" : " isLow"}`}>
                  {selectedCost.total} Credits
                </span>
              </div>
            )}

            <div className="briefHeader">
              <h2>Ready brief</h2>
              <span>{marketplaces.length > 0 ? marketplaces.join(", ") : "No marketplace"}</span>
            </div>
            <div className="briefList">
              {briefSummary.map((item) => <span key={item}>{item}</span>)}
            </div>
            {keyFeatures.length > 0 ? (
              <div className="summaryNote"><strong>Key features</strong><p>{keyFeatures.join(", ")}</p></div>
            ) : null}
            {brief.customPrompt ? (
              <div className="summaryNote"><strong>Customization</strong><p>{brief.customPrompt}</p></div>
            ) : null}

            {formWarnings.length > 0 && (
              <div className="validationWarning" role="alert">
                <span className="warnIcon" aria-hidden="true">⚠</span>
                <span>
                  {formWarnings.map((w, i) => <span key={i} style={{ display: "block" }}>{w}</span>)}
                  {!canAfford && <a href="/studio#credits" style={{ color: "#92400e", textDecoration: "underline", fontSize: "0.78rem" }}>Add credits →</a>}
                </span>
              </div>
            )}

            <button className="primaryButton fullButton" type="submit"
              disabled={isGenerating || !!validationIssue || isAnalyzing || !canAfford || (selectedBasicTypes.length === 0 && selectedAplusTypes.length === 0)}>
              <span>{isGenerating ? "Generating..." : !canAfford ? "Insufficient credits" : "Generate images"}</span>
              <span className="buttonIcon" aria-hidden="true">
                {isGenerating ? <span className="spinner" /> : "+"}
              </span>
            </button>

            <button className="secondaryButton fullButton" type="button"
              id="generate-listing-btn"
              onClick={handleGenerateListing}
              disabled={isGeneratingListing || !brief.productName.trim() || isGenerating || isAnalyzing}
              style={{ marginTop: "8px" }}>
              {isGeneratingListing ? "Generating listings..." : "Generate Listing Text"}
              <span className="buttonIcon" aria-hidden="true">
                {isGeneratingListing ? <span className="spinner" /> : "📝"}
              </span>
            </button>

            {listings && !isGeneratingListing ? (
              <button className="ghostButton fullButton compactButton" type="button"
                onClick={() => setShowListingPanel(true)} style={{ marginTop: "6px" }}>
                View saved listing text
              </button>
            ) : null}

            {statusMessage ? <p className="statusMessage">{statusMessage}</p> : null}
          </aside>
        </section>
      </form>

      {isGenerating || generatedImages.length > 0 ? (
        <section className="resultsSection" id="results" ref={resultsRef} aria-label="Generated images">
          <div className="resultsSectionHeader">
            <div className="formSectionHead">
              <p className="eyebrow">Output</p>
              <h2>Generated images</h2>
              <p className="sectionDesc">
                {isGenerating
                  ? "Creating your marketplace-ready images. This can take a minute for larger batches."
                  : `${generatedImages.length} image${generatedImages.length === 1 ? "" : "s"} ready to download.`}
              </p>
            </div>
            {generatedImages.length > 0 && !isGenerating && (
              <button className="primaryButton" type="button" onClick={downloadAllAsZip}
                style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                ⬇ Download ZIP
              </button>
            )}
          </div>

          {isGenerating ? (
            <div className="resultsGrid">
              {[...selectedBasicTypes, ...selectedAplusTypes].map((type) => (
                <div className="resultsTile resultsTileLoading" key={type}>
                  <div className="resultsSkeleton"><span className="spinner" /></div>
                  <span className="resultsLabel">{type}</span>
                </div>
              ))}
            </div>
          ) : (() => {
            const basicImages = generatedImages.filter((img) => !img.isAplus);
            const aplusImages = generatedImages.filter((img) => img.isAplus);

            function renderImageTile(image: GeneratedImageResult, index: number) {
              return (
                <div className="resultsTile" key={`${image.type}-${index}`}>
                  <div className="resultsImage" style={{ aspectRatio: getImageAspectRatio(image) }}>
                    <button
                      type="button"
                      className="resultsImageBtn"
                      onClick={() => setLightboxImage(image)}
                      aria-label={`View ${image.type} full size`}
                    >
                      {getImageSrc(image) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getImageSrc(image)}
                          alt={image.type}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "8px" }}
                        />
                      ) : (
                        <div className="historyThumbPlaceholder" style={{ width: "100%", height: "100%" }}>🖼</div>
                      )}
                    </button>
                  </div>
                  <div className="resultsTileFooter">
                    <span className="resultsLabel">{image.type}</span>
                    <button type="button" className="ghostButton compactButton" onClick={() => downloadImage(image)}>Download</button>
                  </div>
                </div>
              );
            }

            return (
              <>
                {basicImages.length > 0 && (
                  <>
                    <div className="resultsSectionSubhead">
                      <span>Basic Images</span>
                      <span className="resultsSubCost">{basicImages.length * IMAGE_COST.basic} Credits</span>
                    </div>
                    <div className="resultsGrid">
                      {basicImages.map((img, i) => renderImageTile(img, i))}
                    </div>
                  </>
                )}
                {aplusImages.length > 0 && (
                  <>
                    <div className="resultsSectionSubhead aplusSubhead">
                      <span>A+ Listing Images (GPT Image 2)</span>
                      <span className="resultsSubCost">{aplusImages.length * IMAGE_COST.aplus} Credits</span>
                    </div>
                    <div className="resultsGrid">
                      {aplusImages.map((img, i) => renderImageTile(img, i))}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </section>
      ) : null}

      {showListingPanel && listings ? (
        <section className="listingSection" id="listing" aria-label="Generated listings">
          <ListingPanel listings={listings}
            brief={{
              productName: brief.productName, category: brief.category, brandName: brief.brandName, sku: brief.sku,
              material: brief.material, dimensions: brief.dimensions, weight: brief.weight,
              description: brief.description, targetAudience: brief.targetAudience,
              sellingPrice: brief.sellingPrice, mrp: brief.mrp, discountPercent: brief.discountPercent,
              specialOffers: brief.specialOffers, warranty: brief.warranty,
              countryOfOrigin: brief.countryOfOrigin, packageContents: brief.packageContents,
              keyFeatures, productColors, marketplaces
            }}
            onClose={() => setShowListingPanel(false)} />
        </section>
      ) : null}

      {/* Lightbox — tap any image to view full size */}
      {lightboxImage && (
        <div className="lightboxOverlay" onClick={() => setLightboxImage(null)} role="dialog" aria-modal="true" aria-label="Image preview">
          <button className="lightboxClose" onClick={() => setLightboxImage(null)} aria-label="Close">✕</button>
          <div className="lightboxContent" onClick={(e) => e.stopPropagation()}>
            {getImageSrc(lightboxImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageSrc(lightboxImage)}
                alt={lightboxImage.type}
                className="lightboxImage"
              />
            ) : (
              <div className="historyThumbPlaceholder">🖼</div>
            )}
            <div className="lightboxMeta">
              <span className="lightboxType">{lightboxImage.type}</span>
              {lightboxImage.type.includes("A+") && brief.customWidth && brief.customHeight && (
                <span className="lightboxSize">{brief.customWidth}×{brief.customHeight}px</span>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
    </OnboardingProvider>
  );
}
