"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type UploadedImage = {
  id: string;
  name: string;
  size: string;
  url: string;
  file: File;
};

type BriefState = {
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
};

const MAX_PHOTOS = 12;
const MAX_FEATURES = 6;
const MIN_FEATURES = 3;
const MAX_PRODUCT_COLORS = 6;
const MAX_BRAND_COLORS = 4;

const CATEGORY_SUGGESTIONS = [
  "Electronics",
  "Clothing",
  "Furniture",
  "Beauty",
  "Grocery",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Toys & Games",
  "Health & Personal Care"
];

const MARKETPLACES = ["Amazon", "Flipkart", "Meesho", "Myntra", "Ajio", "Shopify", "WooCommerce", "Custom"];

const BACKGROUND_OPTIONS = ["Pure White", "Transparent", "Lifestyle", "Gradient", "Custom Color"];

const FONT_STYLES = ["Modern", "Classic", "Bold", "Elegant", "Minimal", "Playful"];

const IMAGE_TYPES = [
  "Main Listing Image",
  "Infographic",
  "Feature Highlight",
  "Lifestyle Image",
  "Comparison Image",
  "Size Guide",
  "Packaging Showcase",
  "Premium Banner"
];

const AI_IMAGE_STYLES = ["Minimal", "Premium", "Luxury", "Modern", "Colorful", "Professional"];

const TEXT_ON_IMAGE_OPTIONS = ["No Text", "Minimal Text", "Feature Highlights", "Promotional"];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Both"];

const IMAGE_FORMATS = ["PNG", "JPG", "WebP"];

const RESOLUTIONS = ["Standard", "HD", "4K"];

const initialBrief: BriefState = {
  productName: "",
  category: "",
  brandName: "",
  sku: "",
  background: BACKGROUND_OPTIONS[0],
  customBackgroundColor: "#ffffff",
  customMarketplace: "",
  material: "",
  dimensions: "",
  weight: "",
  fontStyle: FONT_STYLES[0],
  aiStyle: AI_IMAGE_STYLES[0],
  textOnImage: TEXT_ON_IMAGE_OPTIONS[0],
  language: LANGUAGE_OPTIONS[0],
  imageFormat: IMAGE_FORMATS[0],
  resolution: RESOLUTIONS[1],
  description: "",
  targetAudience: "",
  sellingPrice: "",
  mrp: "",
  discountPercent: "",
  specialOffers: "",
  warranty: "",
  countryOfOrigin: "",
  packageContents: "",
  customPrompt: ""
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createImageId(file: File, index: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${file.name}-${file.lastModified}-${index}`;
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function PillGroup({
  legend,
  options,
  value,
  onChange
}: {
  legend: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="controlGroup">
      <span className="controlLabel">{legend}</span>
      <div className="pillGroup">
        {options.map((option) => (
          <button
            className={value === option ? "isSelected" : ""}
            key={option}
            type="button"
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckGrid({
  legend,
  hint,
  options,
  values,
  onToggle,
  columns = 3
}: {
  legend: ReactNode;
  hint?: string;
  options: string[];
  values: string[];
  onToggle: (option: string) => void;
  columns?: number;
}) {
  return (
    <fieldset className="checkFieldset">
      <legend>{legend}</legend>
      {hint ? <p className="fieldHint">{hint}</p> : null}
      <div className="checkGrid" style={{ "--cols": columns } as CSSProperties}>
        {options.map((option) => (
          <label className="checkOption" key={option}>
            <input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ChipInput({
  legend,
  hint,
  values,
  onAdd,
  onRemove,
  placeholder,
  max,
  withColorPicker
}: {
  legend: string;
  hint?: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  max?: number;
  withColorPicker?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const atLimit = Boolean(max) && values.length >= (max ?? 0);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || atLimit) {
      return;
    }
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <div className="chipField">
      <div className="chipFieldHead">
        <span>{legend}</span>
        {max ? (
          <small>
            {values.length}/{max}
          </small>
        ) : null}
      </div>
      {hint ? <p className="fieldHint">{hint}</p> : null}
      <div className="chipInputRow">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          disabled={atLimit}
        />
        {withColorPicker ? (
          <input
            className="colorPicker"
            type="color"
            aria-label={`Pick a color for ${legend}`}
            onChange={(event) => {
              if (atLimit) {
                return;
              }
              onAdd(event.target.value);
            }}
          />
        ) : null}
        <button className="chipAddButton" type="button" onClick={commit} disabled={atLimit}>
          Add
        </button>
      </div>
      {values.length > 0 ? (
        <div className="chipList">
          {values.map((value) => (
            <span className="chip" key={value}>
              {withColorPicker && /^#([0-9a-f]{3}){1,2}$/i.test(value) ? (
                <i className="chipSwatch" style={{ background: value }} aria-hidden="true" />
              ) : null}
              {value}
              <button type="button" onClick={() => onRemove(value)} aria-label={`Remove ${value}`}>
                &times;
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FormSection({
  id,
  eyebrow,
  title,
  description,
  children
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
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

export default function StudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadedImage[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [logo, setLogo] = useState<UploadedImage | null>(null);
  const [brief, setBrief] = useState<BriefState>(initialBrief);
  const [marketplaces, setMarketplaces] = useState<string[]>([]);
  const [imageTypes, setImageTypes] = useState<string[]>([IMAGE_TYPES[0]]);
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [productColors, setProductColors] = useState<string[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
      if (logo) {
        URL.revokeObjectURL(logo.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateBrief(field: keyof BriefState, value: string) {
    setBrief((current) => ({ ...current, [field]: value }));
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((file) => file.type.startsWith("image/"));

    if (incoming.length === 0) {
      return;
    }

    setImages((current) => {
      const openSlots = Math.max(0, MAX_PHOTOS - current.length);
      const nextImages = incoming.slice(0, openSlots).map((file, index) => ({
        id: createImageId(file, index),
        name: file.name,
        size: formatBytes(file.size),
        url: URL.createObjectURL(file),
        file
      }));

      if (nextImages.length > 0) {
        setStatusMessage("");
      }

      return [...current, ...nextImages];
    });
  }

  function removeImage(id: string) {
    setImages((current) => {
      const imageToRemove = current.find((image) => image.id === id);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      return current.filter((image) => image.id !== id);
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

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

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setLogo((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }

      return {
        id: createImageId(file, 0),
        name: file.name,
        size: formatBytes(file.size),
        url: URL.createObjectURL(file),
        file
      };
    });
  }

  function removeLogo() {
    setLogo((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }

  function resetBrief() {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    imagesRef.current = [];
    setImages([]);
    if (logo) {
      URL.revokeObjectURL(logo.url);
    }
    setLogo(null);
    setBrief(initialBrief);
    setMarketplaces([]);
    setImageTypes([IMAGE_TYPES[0]]);
    setKeyFeatures([]);
    setProductColors([]);
    setBrandColors([]);
    setStatusMessage("");
  }

  const validationIssue = useMemo(() => {
    if (images.length === 0) {
      return "Add at least one product photo.";
    }
    if (!brief.productName.trim()) {
      return "Add a product name.";
    }
    if (!brief.category.trim()) {
      return "Add a product category.";
    }
    if (marketplaces.length === 0) {
      return "Select at least one marketplace.";
    }
    return null;
  }, [brief.category, brief.productName, images.length, marketplaces.length]);

  const briefSummary = useMemo(() => {
    const items = [
      `${images.length} photo${images.length === 1 ? "" : "s"}`,
      brief.productName || "Product name pending",
      brief.category || "Category pending"
    ];

    if (marketplaces.length > 0) {
      items.push(marketplaces.join(", "));
    }

    items.push(
      brief.background === "Custom Color" ? `Custom ${brief.customBackgroundColor}` : brief.background
    );

    if (imageTypes.length > 0) {
      items.push(`${imageTypes.length} image type${imageTypes.length === 1 ? "" : "s"}`);
    }

    items.push(brief.aiStyle);
    items.push(`${brief.imageFormat} · ${brief.resolution}`);

    return items;
  }, [
    brief.aiStyle,
    brief.background,
    brief.category,
    brief.customBackgroundColor,
    brief.imageFormat,
    brief.productName,
    brief.resolution,
    imageTypes.length,
    images.length,
    marketplaces
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validationIssue) {
      setStatusMessage(validationIssue);
      if (images.length === 0) {
        fileInputRef.current?.focus();
      }
      return;
    }

    setStatusMessage(
      `Brief ready — ${images.length} photo${images.length === 1 ? "" : "s"} for ${marketplaces.join(", ")}.`
    );
  }

  return (
    <main className="studioPage">
      <header className="studioTopBar">
        <Link className="studioBrand" href="/">
          <span className="brandMark" aria-hidden="true">
            AI
          </span>
          <span>
            <strong>AI Product Image Studio</strong>
            <small>Marketplace visuals from product photos</small>
          </span>
        </Link>

        <nav className="studioNav" aria-label="Studio navigation">
          <Link href="/">Home</Link>
          <a href="#photos">Photos</a>
          <a href="#details">Details</a>
          <a href="#brief">Brief</a>
        </nav>

        <div className="studioTopActions">
          <span className="topPhotoCount">
            {images.length}/{MAX_PHOTOS} photos
          </span>
        </div>
      </header>

      <form className="studioWorkspace" onSubmit={handleSubmit}>
        <section className="uploadColumn" id="photos" aria-labelledby="upload-title">
          <div className="formSectionHead">
            <p className="eyebrow">Upload</p>
            <h1 id="upload-title">Product photos</h1>
            <p className="sectionDesc">
              Front, side, back, and detail shots. <span className="requiredMark">*</span> at least 1 required, 2–4 recommended.
            </p>
          </div>

          <div
            className={`dropZone${isDragging ? " isDragging" : ""}`}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              className="fileInput"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <span className="uploadIcon" aria-hidden="true">
              +
            </span>
            <strong>Drop product photos</strong>
            <small>PNG, JPG, or WEBP. Up to {MAX_PHOTOS} images.</small>
            <button
              className="secondaryButton compactButton"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose photos
            </button>
          </div>

          {images.length > 0 ? (
            <div className="previewGrid" aria-label="Selected product photo previews">
              {images.map((image) => (
                <article className="previewTile" key={image.id}>
                  <div className="previewImage">
                    <Image src={image.url} alt={`Preview of ${image.name}`} fill sizes="160px" unoptimized />
                  </div>
                  <div className="previewMeta">
                    <strong>{image.name}</strong>
                    <span>{image.size}</span>
                  </div>
                  <button
                    className="removeButton"
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label={`Remove ${image.name}`}
                  >
                    &times;
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyPreview" aria-hidden="true">
              {["Front", "Side", "Detail", "Scale"].map((slot) => (
                <span key={slot}>{slot}</span>
              ))}
            </div>
          )}

          <div className="uploadDivider" />

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
              <div className="previewMeta">
                <strong>{logo.name}</strong>
                <span>{logo.size}</span>
              </div>
              <button className="ghostButton compactButton" type="button" onClick={removeLogo}>
                Remove
              </button>
            </div>
          ) : (
            <div className="dropZone compactDrop">
              <input
                ref={logoInputRef}
                className="fileInput"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
              <small>No logo uploaded</small>
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => logoInputRef.current?.click()}
              >
                Upload logo
              </button>
            </div>
          )}
        </section>

        <section className="formColumn" id="details" aria-labelledby="details-title">
          <div className="workspaceHeader formHeader">
            <div>
              <p className="eyebrow">Listing brief</p>
              <h2 id="details-title">Build the image brief</h2>
              <p>Add product, marketplace, style, and output details for the final image set.</p>
            </div>
            <button className="ghostButton" type="button" onClick={resetBrief}>
              Reset
            </button>
          </div>

          <FormSection eyebrow="Required" title="Product basics">
            <div className="formGrid">
              <label>
                <span>
                  Product name <span className="requiredMark">*</span>
                </span>
                <input
                  type="text"
                  value={brief.productName}
                  onChange={(event) => updateBrief("productName", event.target.value)}
                  placeholder="Wireless desk lamp"
                />
              </label>

              <label>
                <span>
                  Category <span className="requiredMark">*</span>
                </span>
                <input
                  type="text"
                  list="category-suggestions"
                  value={brief.category}
                  onChange={(event) => updateBrief("category", event.target.value)}
                  placeholder="Electronics, Clothing, Furniture..."
                />
                <datalist id="category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((category) => (
                    <option value={category} key={category} />
                  ))}
                </datalist>
              </label>

              <label>
                <span>Brand name</span>
                <input
                  type="text"
                  value={brief.brandName}
                  onChange={(event) => updateBrief("brandName", event.target.value)}
                  placeholder="Optional if unbranded"
                />
              </label>

              <label>
                <span>SKU</span>
                <input
                  type="text"
                  value={brief.sku}
                  onChange={(event) => updateBrief("sku", event.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>
          </FormSection>

          <FormSection eyebrow="Required" title="Marketplace & background">
            <CheckGrid
              legend={
                <>
                  Marketplace(s) <span className="requiredMark">*</span>
                </>
              }
              options={MARKETPLACES}
              values={marketplaces}
              onToggle={(value) => setMarketplaces((current) => toggleValue(current, value))}
              columns={4}
            />

            {marketplaces.includes("Custom") ? (
              <label className="inlineField">
                <span>Custom marketplace</span>
                <input
                  type="text"
                  value={brief.customMarketplace}
                  onChange={(event) => updateBrief("customMarketplace", event.target.value)}
                  placeholder="Name your marketplace"
                />
              </label>
            ) : null}

            <PillGroup
              legend="Background preference"
              options={BACKGROUND_OPTIONS}
              value={brief.background}
              onChange={(value) => updateBrief("background", value)}
            />

            {brief.background === "Custom Color" ? (
              <label className="inlineField colorField">
                <span>Custom background color</span>
                <div className="colorFieldRow">
                  <input
                    className="colorPicker"
                    type="color"
                    value={brief.customBackgroundColor}
                    onChange={(event) => updateBrief("customBackgroundColor", event.target.value)}
                  />
                  <input
                    type="text"
                    value={brief.customBackgroundColor}
                    onChange={(event) => updateBrief("customBackgroundColor", event.target.value)}
                  />
                </div>
              </label>
            ) : null}
          </FormSection>

          <FormSection eyebrow="Product details" title="Features, color & specs">
            <ChipInput
              legend="Key features"
              hint={`Add ${MIN_FEATURES}–${MAX_FEATURES} points, e.g. Waterproof, Fast Charging, Lightweight.`}
              values={keyFeatures}
              onAdd={(value) => setKeyFeatures((current) => [...current, value])}
              onRemove={(value) => setKeyFeatures((current) => current.filter((item) => item !== value))}
              placeholder="Type a feature and press Enter"
              max={MAX_FEATURES}
            />

            <ChipInput
              legend="Product color(s)"
              values={productColors}
              onAdd={(value) => setProductColors((current) => [...current, value])}
              onRemove={(value) => setProductColors((current) => current.filter((item) => item !== value))}
              placeholder="Type a color and press Enter"
              max={MAX_PRODUCT_COLORS}
              withColorPicker
            />

            <div className="formGrid">
              <label>
                <span>Material</span>
                <input
                  type="text"
                  value={brief.material}
                  onChange={(event) => updateBrief("material", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label>
                <span>Dimensions</span>
                <input
                  type="text"
                  value={brief.dimensions}
                  onChange={(event) => updateBrief("dimensions", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label>
                <span>Weight</span>
                <input
                  type="text"
                  value={brief.weight}
                  onChange={(event) => updateBrief("weight", event.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>
          </FormSection>

          <FormSection eyebrow="Branding" title="Brand look & feel">
            <ChipInput
              legend="Brand colors"
              values={brandColors}
              onAdd={(value) => setBrandColors((current) => [...current, value])}
              onRemove={(value) => setBrandColors((current) => current.filter((item) => item !== value))}
              placeholder="Pick or type a hex color"
              max={MAX_BRAND_COLORS}
              withColorPicker
            />

            <PillGroup
              legend="Preferred font style"
              options={FONT_STYLES}
              value={brief.fontStyle}
              onChange={(value) => updateBrief("fontStyle", value)}
            />
          </FormSection>

          <FormSection eyebrow="Image style" title="Choose image types">
            <CheckGrid legend="Image types" options={IMAGE_TYPES} values={imageTypes} onToggle={(value) => setImageTypes((current) => toggleValue(current, value))} columns={2} />
          </FormSection>

          <FormSection eyebrow="AI preferences" title="Style, text & language">
            <PillGroup legend="Image style" options={AI_IMAGE_STYLES} value={brief.aiStyle} onChange={(value) => updateBrief("aiStyle", value)} />
            <PillGroup legend="Text on image" options={TEXT_ON_IMAGE_OPTIONS} value={brief.textOnImage} onChange={(value) => updateBrief("textOnImage", value)} />
            <PillGroup legend="Language" options={LANGUAGE_OPTIONS} value={brief.language} onChange={(value) => updateBrief("language", value)} />
          </FormSection>

          <FormSection eyebrow="Output" title="Format & resolution">
            <PillGroup legend="Image format" options={IMAGE_FORMATS} value={brief.imageFormat} onChange={(value) => updateBrief("imageFormat", value)} />
            <PillGroup legend="Resolution" options={RESOLUTIONS} value={brief.resolution} onChange={(value) => updateBrief("resolution", value)} />
          </FormSection>

          <details className="formSection optionalSection">
            <summary>
              <span>Optional listing details</span>
              <span className="summaryChevron" aria-hidden="true" />
            </summary>

            <div className="optionalContent">
              <label className="promptField">
                <span>Product description</span>
                <textarea
                  value={brief.description}
                  onChange={(event) => updateBrief("description", event.target.value)}
                  placeholder="A short description buyers will see on the listing."
                  rows={3}
                />
              </label>

              <div className="formGrid">
                <label>
                  <span>Target audience</span>
                  <input
                    type="text"
                    value={brief.targetAudience}
                    onChange={(event) => updateBrief("targetAudience", event.target.value)}
                    placeholder="Students, creators, home workers"
                  />
                </label>

                <label>
                  <span>Selling price</span>
                  <input
                    type="text"
                    value={brief.sellingPrice}
                    onChange={(event) => updateBrief("sellingPrice", event.target.value)}
                    placeholder="₹999"
                  />
                </label>

                <label>
                  <span>MRP</span>
                  <input
                    type="text"
                    value={brief.mrp}
                    onChange={(event) => updateBrief("mrp", event.target.value)}
                    placeholder="₹1,499"
                  />
                </label>

                <label>
                  <span>Discount %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={brief.discountPercent}
                    onChange={(event) => updateBrief("discountPercent", event.target.value)}
                    placeholder="33"
                  />
                </label>

                <label>
                  <span>Special offers</span>
                  <input
                    type="text"
                    value={brief.specialOffers}
                    onChange={(event) => updateBrief("specialOffers", event.target.value)}
                    placeholder="Buy 1 Get 1, Bank offer..."
                  />
                </label>

                <label>
                  <span>Warranty</span>
                  <input
                    type="text"
                    value={brief.warranty}
                    onChange={(event) => updateBrief("warranty", event.target.value)}
                    placeholder="1 year manufacturer warranty"
                  />
                </label>

                <label>
                  <span>Country of origin</span>
                  <input
                    type="text"
                    value={brief.countryOfOrigin}
                    onChange={(event) => updateBrief("countryOfOrigin", event.target.value)}
                    placeholder="India"
                  />
                </label>
              </div>

              <label className="promptField">
                <span>Package contents</span>
                <textarea
                  value={brief.packageContents}
                  onChange={(event) => updateBrief("packageContents", event.target.value)}
                  placeholder="1 x Product, 1 x USB-C cable, 1 x User manual"
                  rows={2}
                />
              </label>

              <label className="promptField">
                <span>Custom prompt</span>
                <textarea
                  value={brief.customPrompt}
                  onChange={(event) => updateBrief("customPrompt", event.target.value)}
                  placeholder="Keep the original color, add soft shadows, show premium packaging..."
                  rows={4}
                />
              </label>
            </div>
          </details>

          <aside className="briefPanel" id="brief" aria-label="Current generation brief">
            <div className="briefHeader">
              <h2>Ready brief</h2>
              <span>{marketplaces.length > 0 ? marketplaces.join(", ") : "No marketplace"}</span>
            </div>

            <div className="briefList">
              {briefSummary.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            {keyFeatures.length > 0 ? (
              <div className="summaryNote">
                <strong>Key features</strong>
                <p>{keyFeatures.join(", ")}</p>
              </div>
            ) : null}

            {brief.customPrompt ? (
              <div className="summaryNote">
                <strong>Customization</strong>
                <p>{brief.customPrompt}</p>
              </div>
            ) : null}

            <button className="primaryButton fullButton" type="submit">
              <span>Create image brief</span>
              <span className="buttonIcon" aria-hidden="true">
                +
              </span>
            </button>

            {statusMessage ? <p className="statusMessage">{statusMessage}</p> : null}
          </aside>
        </section>
      </form>
    </main>
  );
}
