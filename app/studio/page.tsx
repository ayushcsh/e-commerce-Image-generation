"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
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
};

type BriefState = {
  platform: string;
  productName: string;
  category: string;
  audience: string;
  priceRange: string;
  sku: string;
  imageCount: string;
  background: string;
  aspectRatio: string;
  customPrompt: string;
};

type Language = "en" | "hi";

const maxPhotos = 12;

const platforms = [
  {
    name: "Amazon",
    note: "Clean hero image, details, scale, and lifestyle set",
    noteHi: "क्लीन हीरो इमेज, डिटेल, स्केल और लाइफस्टाइल सेट"
  },
  {
    name: "Shopify",
    note: "Storefront hero, collection thumbnails, and ad crops",
    noteHi: "स्टोरफ्रंट हीरो, कलेक्शन थंबनेल और ऐड क्रॉप"
  },
  {
    name: "Etsy",
    note: "Handmade feel, closeups, texture, and warm lifestyle scenes",
    noteHi: "हैंडमेड फील, क्लोजअप, टेक्सचर और वार्म लाइफस्टाइल सीन"
  },
  {
    name: "eBay",
    note: "Clear condition shots, variants, and honest detail frames",
    noteHi: "कंडीशन शॉट, वैरिएंट और साफ डिटेल फ्रेम"
  },
  {
    name: "Flipkart",
    note: "Catalog-ready angles, feature callouts, and clean backgrounds",
    noteHi: "कैटलॉग-रेडी एंगल, फीचर कॉलआउट और क्लीन बैकग्राउंड"
  },
  {
    name: "Meesho",
    note: "Fast social commerce visuals with simple, bright product focus",
    noteHi: "सिंपल, ब्राइट और सोशल कॉमर्स के लिए तेज विजुअल"
  }
];

const imageGoals = [
  "Main listing image",
  "Detail closeups",
  "Lifestyle scene",
  "Size or scale shot",
  "Ad creative",
  "Variant grid"
];

const initialGoals = [imageGoals[0], imageGoals[1], imageGoals[2]];

const backgrounds = [
  "Clean studio white",
  "Soft shadow",
  "Premium dark",
  "Lifestyle room",
  "Seasonal campaign"
];

const aspectRatios = ["1:1 square", "4:5 portrait", "16:9 banner", "Marketplace mix"];

const goalLabels: Record<Language, Record<string, string>> = {
  en: Object.fromEntries(imageGoals.map((goal) => [goal, goal])),
  hi: {
    "Main listing image": "मुख्य लिस्टिंग इमेज",
    "Detail closeups": "डिटेल क्लोजअप",
    "Lifestyle scene": "लाइफस्टाइल सीन",
    "Size or scale shot": "साइज / स्केल शॉट",
    "Ad creative": "विज्ञापन क्रिएटिव",
    "Variant grid": "वैरिएंट ग्रिड"
  }
};

const backgroundLabels: Record<Language, Record<string, string>> = {
  en: Object.fromEntries(backgrounds.map((background) => [background, background])),
  hi: {
    "Clean studio white": "क्लीन स्टूडियो व्हाइट",
    "Soft shadow": "सॉफ्ट शैडो",
    "Premium dark": "प्रीमियम डार्क",
    "Lifestyle room": "लाइफस्टाइल रूम",
    "Seasonal campaign": "सीजनल कैंपेन"
  }
};

const aspectRatioLabels: Record<Language, Record<string, string>> = {
  en: Object.fromEntries(aspectRatios.map((ratio) => [ratio, ratio])),
  hi: {
    "1:1 square": "1:1 स्क्वेयर",
    "4:5 portrait": "4:5 पोर्ट्रेट",
    "16:9 banner": "16:9 बैनर",
    "Marketplace mix": "मार्केटप्लेस मिक्स"
  }
};

const studioText = {
  en: {
    brand: "AI Product Image Studio",
    brandSub: "Marketplace visuals from product photos",
    navHome: "Home",
    navPhotos: "Photos",
    navBrief: "Brief",
    newBrief: "New image brief",
    photosSelected: (count: number, max: number) => `${count}/${max} photos selected`,
    uploadEyebrow: "Upload",
    uploadTitle: "Product photo stack",
    uploadDesc: "Upload front, side, detail, packaging, and variant shots in one clean batch.",
    dropTitle: "Drop product photos",
    dropHint: (max: number) => `PNG, JPG, or WEBP. Up to ${max} images.`,
    choosePhotos: "Choose photos",
    emptySlots: ["Front", "Side", "Detail", "Scale"],
    briefEyebrow: "Listing brief",
    formTitle: "Build the image brief",
    formDesc: "Add marketplace, buyer, style, format, and custom directions for the final image set.",
    reset: "Reset",
    platformLegend: "Ecommerce platform",
    focus: "focus",
    fields: {
      productName: "Product name",
      category: "Category",
      audience: "Target buyer",
      priceRange: "Price range",
      sku: "SKU or variant",
      imageCount: "Number of images",
      background: "Background style",
      format: "Image format",
      goals: "Image goals",
      prompt: "Custom prompt"
    },
    placeholders: {
      productName: "Wireless desk lamp",
      category: "Home office accessories",
      audience: "Students, creators, home workers",
      priceRange: "$25 - $40",
      sku: "Black, USB-C, pack of 1",
      prompt:
        "Example: keep the original color, add soft shadows, show premium packaging, create one lifestyle scene for ads."
    },
    readyBrief: "Ready brief",
    selectedGoals: "Selected goals",
    noGoals: "No image goals selected",
    customization: "Customization",
    createBrief: "Create image brief",
    pendingProduct: "Product name pending",
    pendingCategory: "Category pending",
    outputs: (count: string) => `${count || "8"} outputs`,
    photos: (count: number) => `${count} product photo${count === 1 ? "" : "s"}`,
    addPhotoStatus: "Add at least one product photo before creating the brief.",
    readyStatus: (count: number, platform: string) =>
      `Brief ready: ${count} photo${count === 1 ? "" : "s"} for ${platform}.`
  },
  hi: {
    brand: "AI प्रोडक्ट इमेज स्टूडियो",
    brandSub: "प्रोडक्ट फोटो से मार्केटप्लेस विजुअल",
    navHome: "होम",
    navPhotos: "फोटो",
    navBrief: "ब्रीफ",
    newBrief: "नया इमेज ब्रीफ",
    photosSelected: (count: number, max: number) => `${count}/${max} फोटो चुने गए`,
    uploadEyebrow: "अपलोड",
    uploadTitle: "प्रोडक्ट फोटो स्टैक",
    uploadDesc: "फ्रंट, साइड, डिटेल, पैकेजिंग और वैरिएंट फोटो एक साथ अपलोड करें।",
    dropTitle: "प्रोडक्ट फोटो यहाँ ड्रॉप करें",
    dropHint: (max: number) => `PNG, JPG या WEBP. अधिकतम ${max} इमेज।`,
    choosePhotos: "फोटो चुनें",
    emptySlots: ["फ्रंट", "साइड", "डिटेल", "स्केल"],
    briefEyebrow: "लिस्टिंग ब्रीफ",
    formTitle: "इमेज ब्रीफ बनाएं",
    formDesc: "मार्केटप्लेस, खरीदार, स्टाइल, फॉर्मेट और कस्टम निर्देश जोड़ें।",
    reset: "रीसेट",
    platformLegend: "ई-कॉमर्स प्लेटफॉर्म",
    focus: "फोकस",
    fields: {
      productName: "प्रोडक्ट नाम",
      category: "कैटेगरी",
      audience: "टारगेट खरीदार",
      priceRange: "प्राइस रेंज",
      sku: "SKU या वैरिएंट",
      imageCount: "इमेज की संख्या",
      background: "बैकग्राउंड स्टाइल",
      format: "इमेज फॉर्मेट",
      goals: "इमेज गोल",
      prompt: "कस्टम प्रॉम्प्ट"
    },
    placeholders: {
      productName: "Wireless desk lamp",
      category: "Home office accessories",
      audience: "Students, creators, home workers",
      priceRange: "$25 - $40",
      sku: "Black, USB-C, pack of 1",
      prompt:
        "उदाहरण: असली रंग रखें, सॉफ्ट शैडो जोड़ें, प्रीमियम पैकेजिंग दिखाएं, ads के लिए एक लाइफस्टाइल सीन बनाएं।"
    },
    readyBrief: "तैयार ब्रीफ",
    selectedGoals: "चुने गए गोल",
    noGoals: "कोई इमेज गोल नहीं चुना गया",
    customization: "कस्टम निर्देश",
    createBrief: "इमेज ब्रीफ बनाएं",
    pendingProduct: "प्रोडक्ट नाम बाकी है",
    pendingCategory: "कैटेगरी बाकी है",
    outputs: (count: string) => `${count || "8"} आउटपुट`,
    photos: (count: number) => `${count} प्रोडक्ट फोटो`,
    addPhotoStatus: "ब्रीफ बनाने से पहले कम से कम एक प्रोडक्ट फोटो जोड़ें।",
    readyStatus: (count: number, platform: string) =>
      `${platform} के लिए ${count} फोटो का ब्रीफ तैयार है।`
  }
};

const initialBrief: BriefState = {
  platform: platforms[0].name,
  productName: "",
  category: "",
  audience: "",
  priceRange: "",
  sku: "",
  imageCount: "8",
  background: backgrounds[0],
  aspectRatio: aspectRatios[0],
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

export default function StudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadedImage[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [brief, setBrief] = useState<BriefState>(initialBrief);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);
  const [language, setLanguage] = useState<Language>("en");
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const text = studioText[language];

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  const selectedPlatform = useMemo(
    () => platforms.find((platform) => platform.name === brief.platform) ?? platforms[0],
    [brief.platform]
  );

  const briefSummary = useMemo(
    () => [
      text.photos(images.length),
      brief.platform,
      brief.productName || text.pendingProduct,
      brief.category || text.pendingCategory,
      text.outputs(brief.imageCount),
      backgroundLabels[language][brief.background] ?? brief.background,
      aspectRatioLabels[language][brief.aspectRatio] ?? brief.aspectRatio
    ],
    [
      brief.aspectRatio,
      brief.background,
      brief.category,
      brief.imageCount,
      brief.platform,
      brief.productName,
      images.length,
      language,
      text
    ]
  );

  function updateBrief(field: keyof BriefState, value: string) {
    setBrief((current) => ({
      ...current,
      [field]: value
    }));
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((file) => file.type.startsWith("image/"));

    if (incoming.length === 0) {
      return;
    }

    setImages((current) => {
      const openSlots = Math.max(0, maxPhotos - current.length);
      const nextImages = incoming.slice(0, openSlots).map((file, index) => ({
        id: createImageId(file, index),
        name: file.name,
        size: formatBytes(file.size),
        url: URL.createObjectURL(file)
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

  function toggleGoal(goal: string) {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    );
  }

  function resetBrief() {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    imagesRef.current = [];
    setImages([]);
    setBrief(initialBrief);
    setSelectedGoals(initialGoals);
    setStatusMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (images.length === 0) {
      setStatusMessage(text.addPhotoStatus);
      fileInputRef.current?.focus();
      return;
    }

    setStatusMessage(text.readyStatus(images.length, brief.platform));
  }

  return (
    <main className="studioPage" lang={language === "hi" ? "hi" : "en"}>
      <header className="studioTopBar">
        <Link className="studioBrand" href="/">
          <span className="brandMark" aria-hidden="true">AI</span>
          <span>
            <strong>{text.brand}</strong>
            <small>{text.brandSub}</small>
          </span>
        </Link>

        <nav className="studioNav" aria-label="Studio navigation">
          <Link href="/">
            {text.navHome}
          </Link>
          <a href="#photos">{text.navPhotos}</a>
          <a href="#brief">{text.navBrief}</a>
        </nav>

        <div className="studioTopActions">
          <div className="studioLanguage" aria-label="Switch language">
            <button
              className={language === "en" ? "isActive" : ""}
              type="button"
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              className={language === "hi" ? "isActive" : ""}
              type="button"
              onClick={() => setLanguage("hi")}
            >
              हिंदी
            </button>
          </div>
          <span className="topPhotoCount">{text.photosSelected(images.length, maxPhotos)}</span>
        </div>
      </header>

      <form className="studioWorkspace" onSubmit={handleSubmit}>
        <section className="uploadColumn" id="photos" aria-labelledby="upload-title">
          <div className="workspaceHeader">
            <div>
              <p className="eyebrow">{text.uploadEyebrow}</p>
              <h1 id="upload-title">{text.uploadTitle}</h1>
              <p>{text.uploadDesc}</p>
            </div>
            <span className="photoCounter">{images.length}/{maxPhotos}</span>
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
            <strong>{text.dropTitle}</strong>
            <small>{text.dropHint(maxPhotos)}</small>
            <button
              className="secondaryButton compactButton"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              {text.choosePhotos}
            </button>
          </div>

          {images.length > 0 ? (
            <div className="previewGrid" aria-label="Selected product photo previews">
              {images.map((image) => (
                <article className="previewTile" key={image.id}>
                  <div className="previewImage">
                    <Image
                      src={image.url}
                      alt={`Preview of ${image.name}`}
                      fill
                      sizes="160px"
                      unoptimized
                    />
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
                    X
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyPreview" aria-hidden="true">
              {text.emptySlots.map((slot) => (
                <span key={slot}>{slot}</span>
              ))}
            </div>
          )}
        </section>

        <section className="formColumn" id="brief" aria-labelledby="details-title">
          <div className="workspaceHeader formHeader">
            <div>
              <p className="eyebrow">{text.briefEyebrow}</p>
              <h2 id="details-title">{text.formTitle}</h2>
              <p>{text.formDesc}</p>
            </div>
            <button className="ghostButton" type="button" onClick={resetBrief}>
              {text.reset}
            </button>
          </div>

          <fieldset className="platformFieldset">
            <legend>{text.platformLegend}</legend>
            <div className="platformGrid">
              {platforms.map((platform) => (
                <label className="platformOption" key={platform.name}>
                  <input
                    type="radio"
                    name="platform"
                    value={platform.name}
                    checked={brief.platform === platform.name}
                    onChange={(event) => updateBrief("platform", event.target.value)}
                  />
                  <span>
                    <strong>{platform.name}</strong>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="selectedPlatformNote">
            <strong>{selectedPlatform.name} {text.focus}</strong>
            <span>{language === "hi" ? selectedPlatform.noteHi : selectedPlatform.note}</span>
          </div>

          <div className="formGrid">
            <label>
              <span>{text.fields.productName}</span>
              <input
                type="text"
                value={brief.productName}
                onChange={(event) => updateBrief("productName", event.target.value)}
                placeholder={text.placeholders.productName}
              />
            </label>

            <label>
              <span>{text.fields.category}</span>
              <input
                type="text"
                value={brief.category}
                onChange={(event) => updateBrief("category", event.target.value)}
                placeholder={text.placeholders.category}
              />
            </label>

            <label>
              <span>{text.fields.audience}</span>
              <input
                type="text"
                value={brief.audience}
                onChange={(event) => updateBrief("audience", event.target.value)}
                placeholder={text.placeholders.audience}
              />
            </label>

            <label>
              <span>{text.fields.priceRange}</span>
              <input
                type="text"
                value={brief.priceRange}
                onChange={(event) => updateBrief("priceRange", event.target.value)}
                placeholder={text.placeholders.priceRange}
              />
            </label>

            <label>
              <span>{text.fields.sku}</span>
              <input
                type="text"
                value={brief.sku}
                onChange={(event) => updateBrief("sku", event.target.value)}
                placeholder={text.placeholders.sku}
              />
            </label>

            <label>
              <span>{text.fields.imageCount}</span>
              <input
                type="number"
                min="1"
                max="12"
                value={brief.imageCount}
                onChange={(event) => updateBrief("imageCount", event.target.value)}
              />
            </label>
          </div>

          <div className="controlGroup">
            <span className="controlLabel">{text.fields.background}</span>
            <div className="segmentedControl">
              {backgrounds.map((background) => (
                <button
                  className={brief.background === background ? "isSelected" : ""}
                  key={background}
                  type="button"
                  onClick={() => updateBrief("background", background)}
                >
                  {backgroundLabels[language][background] ?? background}
                </button>
              ))}
            </div>
          </div>

          <div className="controlGroup">
            <span className="controlLabel">{text.fields.format}</span>
            <div className="segmentedControl">
              {aspectRatios.map((ratio) => (
                <button
                  className={brief.aspectRatio === ratio ? "isSelected" : ""}
                  key={ratio}
                  type="button"
                  onClick={() => updateBrief("aspectRatio", ratio)}
                >
                  {aspectRatioLabels[language][ratio] ?? ratio}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="goalFieldset">
            <legend>{text.fields.goals}</legend>
            <div className="goalGrid">
              {imageGoals.map((goal) => (
                <label className="goalOption" key={goal}>
                  <input
                    type="checkbox"
                    checked={selectedGoals.includes(goal)}
                    onChange={() => toggleGoal(goal)}
                  />
                  <span>{goalLabels[language][goal] ?? goal}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="promptField">
            <span>{text.fields.prompt}</span>
            <textarea
              value={brief.customPrompt}
              onChange={(event) => updateBrief("customPrompt", event.target.value)}
              placeholder={text.placeholders.prompt}
              rows={5}
            />
          </label>

          <aside className="briefPanel" aria-label="Current generation brief">
            <div className="briefHeader">
              <h2>{text.readyBrief}</h2>
              <span>{brief.platform}</span>
            </div>

            <div className="briefList">
              {briefSummary.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="goalSummary">
              <strong>{text.selectedGoals}</strong>
              <p>
                {selectedGoals.length > 0
                  ? selectedGoals.map((goal) => goalLabels[language][goal] ?? goal).join(", ")
                  : text.noGoals}
              </p>
            </div>

            {brief.customPrompt ? (
              <div className="promptSummary">
                <strong>{text.customization}</strong>
                <p>{brief.customPrompt}</p>
              </div>
            ) : null}

            <button className="primaryButton fullButton" type="submit">
              <span>{text.createBrief}</span>
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
