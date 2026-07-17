import type { AllListings } from "@/app/api/listing/route";

export type BriefForExport = {
  productName: string;
  category: string;
  brandName: string;
  sku: string;
  material: string;
  dimensions: string;
  weight: string;
  description: string;
  targetAudience: string;
  sellingPrice: string;
  mrp: string;
  discountPercent: string;
  specialOffers: string;
  warranty: string;
  countryOfOrigin: string;
  packageContents: string;
  keyFeatures: string[];
  productColors: string[];
  marketplaces: string[];
};

export type ExportData = {
  brief: BriefForExport;
  listings: AllListings;
  generatedAt: string;
};

function escapeCsvField(value: string | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  // Escape fields that contain commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCsvField(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "";
  return arr.map(escapeCsvField).join(", ");
}

// ── Amazon Tab-Delimited (Seller Central-ready) ──────────────────────────────────
export function exportAmazonCsv(brief: BriefForExport, listings: AllListings): string {
  const a = listings.amazon;
  const headers = [
    "Product Type",
    "Seller SKU",
    "Brand Name",
    "Product Name",
    "Manufacturer",
    "Product Description",
    "Bullet Point 1",
    "Bullet Point 2",
    "Bullet Point 3",
    "Bullet Point 4",
    "Bullet Point 5",
    "Search Terms",
    "Standard Price",
    "Quantity",
    "Fulfillment Channel",
    "ASIN",
    "Department",
    "Material",
    "ItemDimensionsLxWxH",
    "ItemWeight",
    "Country of Origin",
    "Warranty Description",
    "Generic Keywords"
  ];

  const keyFeature1 = a.bullets?.[0] ?? "";
  const keyFeature2 = a.bullets?.[1] ?? "";
  const keyFeature3 = a.bullets?.[2] ?? "";
  const keyFeature4 = a.bullets?.[3] ?? "";
  const keyFeature5 = a.bullets?.[4] ?? "";
  const keywords = (a.keywords ?? []).join(", ");

  const price = brief.sellingPrice?.replace(/[^0-9.]/g, "") || "";
  const mrpPrice = brief.mrp?.replace(/[^0-9.]/g, "") || "";
  const dims = brief.dimensions || "";
  const wt = brief.weight || "";
  const coo = brief.countryOfOrigin || "India";

  const rows = [
    escapeCsvField(brief.category),
    escapeCsvField(brief.sku),
    escapeCsvField(brief.brandName || "Unknown"),
    escapeCsvField(a.title || brief.productName),
    escapeCsvField(brief.brandName || "Unknown"),
    escapeCsvField(a.description || brief.description),
    escapeCsvField(keyFeature1),
    escapeCsvField(keyFeature2),
    escapeCsvField(keyFeature3),
    escapeCsvField(keyFeature4),
    escapeCsvField(keyFeature5),
    escapeCsvField(keywords),
    escapeCsvField(price),
    "99",
    "MF",
    "",
    escapeCsvField(brief.category),
    escapeCsvField(brief.material),
    escapeCsvField(dims),
    escapeCsvField(wt),
    escapeCsvField(coo),
    escapeCsvField(brief.warranty),
    escapeCsvField(keywords)
  ];

  // Seller Central uses tab as delimiter
  const tsv = [headers.join("\t"), rows.join("\t")].join("\n");
  return "﻿" + tsv; // BOM for Excel UTF-8
}

// ── Shopify CSV ─────────────────────────────────────────────────────────────────
export function exportShopifyCsv(brief: BriefForExport, listings: AllListings): string {
  const s = listings.shopify;
  const headers = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Inventory Qty",
    "Variant Weight Unit",
    "Image Src",
    "SEO Title",
    "SEO Description",
    "Google Shopping / Google Product Category",
    "Cost Price",
    "Variant Taxable",
    "Variant Tax Code"
  ];

  const handle = (brief.productName || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const price = brief.sellingPrice?.replace(/[^0-9.]/g, "") || "0";
  const comparePrice = brief.mrp?.replace(/[^0-9.]/g, "") || "";
  const tags = [brief.category, brief.targetAudience, ...(s.tags ?? []), ...(brief.keyFeatures ?? [])]
    .filter(Boolean)
    .join(", ");
  const productType = s.productType || brief.category;
  const vendor = s.vendor || brief.brandName || "Unknown";

  const rows = [
    escapeCsvField(handle),
    escapeCsvField(s.title || brief.productName),
    escapeCsvField(s.bodyHtml || brief.description),
    escapeCsvField(vendor),
    escapeCsvField(productType),
    escapeCsvField(productType),
    escapeCsvField(tags),
    "TRUE",
    "Color",
    escapeCsvField(brief.productColors?.[0] || "Default"),
    escapeCsvField(price),
    escapeCsvField(comparePrice),
    "100",
    "kg",
    "",
    escapeCsvField(s.seoTitle),
    escapeCsvField(s.seoDescription),
    "",
    "",
    "TRUE",
    "P00000000"
  ];

  return "﻿" + [headers.join(","), rows.join(",")].join("\n");
}

// ── Flipkart Tab-Delimited ──────────────────────────────────────────────────────
export function exportFlipkartCsv(brief: BriefForExport, listings: AllListings): string {
  const f = listings.flipkart;
  const headers = [
    "Product Name",
    "Product Description",
    "Brand",
    "Category",
    "MRP",
    "Selling Price",
    "Highlights",
    "Stock",
    "Manufacturer Details",
    "Country of Origin",
    "Warranty",
    "Weight",
    "Dimensions"
  ];

  const rows = [
    escapeCsvField(f.title || brief.productName),
    escapeCsvField(f.description || brief.description),
    escapeCsvField(brief.brandName || "Unknown"),
    escapeCsvField(brief.category),
    escapeCsvField(brief.mrp),
    escapeCsvField(brief.sellingPrice),
    escapeCsvField((f.highlights ?? brief.keyFeatures ?? []).join(" | ")),
    "99",
    escapeCsvField(brief.brandName || "Unknown"),
    escapeCsvField(brief.countryOfOrigin || "India"),
    escapeCsvField(brief.warranty),
    escapeCsvField(brief.weight),
    escapeCsvField(brief.dimensions)
  ];

  return "﻿" + [headers.join("\t"), rows.join("\t")].join("\n");
}

// ── Meesho Tab-Delimited ───────────────────────────────────────────────────────
export function exportMeeshoCsv(brief: BriefForExport, listings: AllListings): string {
  const m = listings.meesho;
  const headers = [
    "Title",
    "Description",
    "Category",
    "MRP",
    "Selling Price",
    "Discount (%)",
    "Stock",
    "Country of Origin",
    "Highlights"
  ];

  const discount = brief.discountPercent || "";
  const rows = [
    escapeCsvField(m.title || brief.productName),
    escapeCsvField(m.description || brief.description),
    escapeCsvField(brief.category),
    escapeCsvField(brief.mrp),
    escapeCsvField(brief.sellingPrice),
    escapeCsvField(discount),
    "99",
    escapeCsvField(brief.countryOfOrigin || "India"),
    escapeCsvField((m.highlights ?? brief.keyFeatures ?? []).join(" | "))
  ];

  return "﻿" + [headers.join("\t"), rows.join("\t")].join("\n");
}

// ── Etsy CSV ────────────────────────────────────────────────────────────────────
export function exportEtsyCsv(brief: BriefForExport, listings: AllListings): string {
  const e = listings.etsy;
  const headers = [
    "title",
    "description",
    "price",
    "quantity",
    "tags",
    "materials",
    "taxonomy_id",
    "occasion",
    "style",
    "when_made",
    "who_made",
    "is_customizable",
    "is_digital",
    "state"
  ];

  const tags = (e.tags ?? brief.keyFeatures ?? []).slice(0, 13);
  const price = brief.sellingPrice?.replace(/[^0-9.]/g, "") || "0";

  const rows = [
    escapeCsvField(e.title || brief.productName),
    escapeCsvField(e.description || brief.description),
    escapeCsvField(price),
    "99",
    escapeCsvField(tags.join(",")),
    escapeCsvField(e.material || brief.material),
    "",
    escapeCsvField(e.occasion || ""),
    "",
    "made_to_order",
    "i_did",
    "FALSE",
    "FALSE",
    "draft"
  ];

  return "﻿" + [headers.join(","), rows.join(",")].join("\n");
}

// ── WooCommerce CSV ─────────────────────────────────────────────────────────────
export function exportWooCommerceCsv(brief: BriefForExport, listings: AllListings): string {
  const w = listings.woocommerce;
  const headers = [
    "ID",
    "Type",
    "SKU",
    "Name",
    "Published",
    "Short description",
    "Description",
    "Regular price",
    "Categories",
    "Tags",
    "Attributes",
    "Meta: _woocommerc_product_attributes",
    "SEO Title",
    "SEO Description"
  ];

  const price = brief.sellingPrice?.replace(/[^0-9.]/g, "") || "";
  const categories = escapeCsvField(brief.category);
  const tags = escapeCsvField((w.tags ?? brief.keyFeatures ?? []).join(", "));

  const rows = [
    "",
    "simple",
    escapeCsvField(brief.sku),
    escapeCsvField(w.title || brief.productName),
    "1",
    escapeCsvField(w.seoDescription || brief.description),
    escapeCsvField(w.description || brief.description),
    escapeCsvField(price),
    categories,
    tags,
    "",
    "",
    escapeCsvField(w.seoTitle),
    escapeCsvField(w.seoDescription)
  ];

  return "﻿" + [headers.join(","), rows.join(",")].join("\n");
}

// ── Generic JSON ────────────────────────────────────────────────────────────────
export function exportJson(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

// ── Helper: trigger download in browser ─────────────────────────────────────────
export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Export all as ZIP-ready manifest ───────────────────────────────────────────
export type ExportManifest = {
  version: "1.0";
  exportedAt: string;
  product: string;
  marketplaces: string[];
  files: {
    filename: string;
    format: string;
    contentBase64?: string;
    note: string;
  }[];
};

export function buildExportManifest(
  brief: BriefForExport,
  listings: AllListings,
  csvFiles: Record<string, string>
): ExportManifest {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    product: brief.productName,
    marketplaces: brief.marketplaces ?? [],
    files: Object.entries(csvFiles).map(([name, content]) => ({
      filename: `${name}.csv`,
      format: "text/csv",
      note: `${name} listing export`
    }))
  };
}
