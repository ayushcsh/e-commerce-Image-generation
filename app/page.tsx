import Image from "next/image";

const navItems = [
  { label: "Home", hindi: "होम", href: "#home" },
  { label: "Benefits", hindi: "फायदे", href: "#about" },
  { label: "Workflow", hindi: "वर्कफ्लो", href: "#services" },
  { label: "Contact", hindi: "संपर्क", href: "#contact" }
];

const features = [
  {
    title: "Complete Image Set",
    hindi: "7-8 लिस्टिंग इमेज",
    text: "Generate 7-8 clean listing shots from one upload: angles, details, lifestyle, and ad-ready frames.",
    hindiText: "एक प्रोडक्ट फोटो से फ्रंट, बैक, साइड, डिटेल और लाइफस्टाइल इमेज बनाएं।"
  },
  {
    title: "Marketplace Polish",
    hindi: "मार्केटप्लेस रेडी",
    text: "Create sharper visuals for Amazon, Meesho, Flipkart, Myntra, catalogs, ads, and your own store.",
    hindiText: "Amazon, Meesho, Flipkart, Myntra और अपने स्टोर के लिए साफ विजुअल तैयार करें।"
  },
  {
    title: "Lighting That Sells",
    hindi: "लाइटिंग वैरिएशन",
    text: "Switch between studio white, soft shadow, premium dark, and lifestyle moods without a reshoot.",
    hindiText: "स्टूडियो, सॉफ्ट शैडो, व्हाइट बैकग्राउंड और लाइफस्टाइल मूड बनाएं।"
  },
  {
    title: "Angles Buyers Trust",
    hindi: "बेहतर प्रोडक्ट एंगल",
    text: "Show the shape, scale, texture, and key details clearly so buyers know exactly what they get.",
    hindiText: "खरीदारों को प्रोडक्ट हर साइड से साफ दिखाएं।"
  }
];

const steps = [
  {
    label: "Upload Photo",
    hindi: "प्रोडक्ट फोटो अपलोड करें",
    detail: "Start with one clear product image.",
    hindiDetail: "अपने पास मौजूद प्रोडक्ट फोटो से शुरू करें।"
  },
  {
    label: "Clean Frame",
    hindi: "फ्रेम साफ करें",
    detail: "Separate the product and prepare a sharp base.",
    hindiDetail: "प्रोडक्ट को साफ बेस पर तैयार करें।"
  },
  {
    label: "Add Angles",
    hindi: "एंगल जोड़ें",
    detail: "Build front, side, detail, and scale shots.",
    hindiDetail: "फ्रंट, साइड, डिटेल और स्केल शॉट बनाएं।"
  },
  {
    label: "Style Scenes",
    hindi: "आउटपुट स्टाइल चुनें",
    detail: "Apply backgrounds, lighting, and lifestyle moods.",
    hindiDetail: "एंगल, बैकग्राउंड, लाइटिंग और मूड चुनें।"
  },
  {
    label: "Launch Gallery",
    hindi: "लिस्टिंग सेट डाउनलोड करें",
    detail: "Export a complete set for listings and ads.",
    hindiDetail: "लिस्टिंग और ads के लिए तैयार set डाउनलोड करें।"
  }
];

function AccentO() {
  return (
    <span className="accentO" aria-hidden="true">
      O
    </span>
  );
}

export default function Home() {
  return (
    <main className="page">
      <input
        className="languageToggleInput"
        id="language-toggle"
        type="checkbox"
        aria-label="Switch language between English and Hindi"
      />

      <section className="posterHero" id="home" aria-label="Product image generation hero">
        <header className="siteHeader">
          <nav className="siteNav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a
                className="navLink"
                href={item.href}
                key={item.label}
              >
                <span className="langEnglish">{item.label}</span>
                <span className="langHindi">{item.hindi}</span>
              </a>
            ))}
          </nav>

          <div className="headerTools">
            <label className="languageSwitch" htmlFor="language-toggle">
              <span>EN</span>
              <span className="switchTrack" aria-hidden="true" />
              <span>हिंदी</span>
            </label>

          </div>
        </header>

        <div className="heroGrid">
          <div className="peoplePanel">
            <Image
              src="/vendor-hero.png"
              alt="Black and white illustration of ecommerce vendors preparing products for online selling"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 56vw"
            />
          </div>

          <div className="copyPanel">
            <div className="copyInner">
              <p className="eyebrow">
                <span className="langEnglish">AI product visuals for sellers</span>
                <span className="langHindi">ई-कॉमर्स विक्रेताओं के लिए</span>
              </p>
              <h1 className="heroTitle">
                <span className="langEnglish">
                  <span>HELL<AccentO /></span>
                  <span>VEND<AccentO />RS!</span>
                </span>
                <span className="langHindi">
                  <span>नमस्ते</span>
                  <span>विक्रेताओं!</span>
                </span>
              </h1>

              <div className="titleRule" aria-hidden="true" />

              <p className="introCopy">
                <span className="langEnglish">
                  Drop in one product photo. Get a polished gallery of angles,
                  detail shots, background options, and lifestyle scenes built
                  for faster marketplace uploads.
                </span>
                <span className="langHindi">
                  एक प्रोडक्ट फोटो अपलोड करें और उसे 7-8 मार्केटप्लेस इमेज में बदलें।
                </span>
              </p>

              <a className="getStarted" href="#services" aria-label="Get started">
                <span className="langEnglish">GET STARTED</span>
                <span className="langHindi">शुरू करें</span>
              </a>
            </div>
          </div>
        </div>

      </section>

      <section className="featureBand" id="about" aria-labelledby="features-title">
        <div className="sectionHeader">
          <p className="sectionEyebrow">
            <span className="langEnglish">Built for product sellers</span>
            <span className="langHindi">प्रोडक्ट विक्रेताओं के लिए बनाया गया</span>
          </p>
          <h2 id="features-title">
            <span className="langEnglish">Turn one ordinary photo into a marketplace-ready image set.</span>
            <span className="langHindi">आपके पास मौजूद फोटो से ज्यादा उपयोगी इमेज।</span>
          </h2>
        </div>

        <div className="featureGrid">
          {features.map((feature, index) => (
            <article className="featureCard" key={feature.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>
                <span className="langEnglish">{feature.title}</span>
                <span className="langHindi">{feature.hindi}</span>
              </h3>
              <p>
                <span className="langEnglish">{feature.text}</span>
                <span className="langHindi">{feature.hindiText}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflowBand" id="services" aria-label="Product generation workflow">
        <div className="workflowCopy">
          <p className="sectionEyebrow">
            <span className="langEnglish">AI studio workflow</span>
            <span className="langHindi">आसान वर्कफ्लो</span>
          </p>
          <h2>
            <span className="langEnglish">Scroll through the product image pipeline.</span>
            <span className="langHindi">एक अपलोड, पूरी प्रोडक्ट गैलरी।</span>
          </h2>
          <p>
            <span className="langEnglish">
              Each screen shows one AI step, from the first upload to the final
              marketplace-ready gallery.
            </span>
            <span className="langHindi">
              हर एंगल के लिए अलग फोटोशूट की जरूरत नहीं। यह प्लेटफॉर्म लिस्टिंग,
              ads और catalog के लिए पूरा image set बनाता है।
            </span>
          </p>

          <div className="pathway" aria-label="Five step product image workflow">
            <svg className="pathwayLine" viewBox="0 0 640 980" preserveAspectRatio="none" aria-hidden="true">
              <path className="pathwayTrack" d="M326 34 C146 86 94 190 292 264 C560 364 560 470 318 548 C86 620 96 748 356 806 C560 852 500 936 238 960" />
              <path className="pathwayGlow" d="M326 34 C146 86 94 190 292 264 C560 364 560 470 318 548 C86 620 96 748 356 806 C560 852 500 936 238 960" />
              <path className="pathwayPulse" d="M326 34 C146 86 94 190 292 264 C560 364 560 470 318 548 C86 620 96 748 356 806 C560 852 500 936 238 960" />
            </svg>

            <div className="pathwayNodes">
            {steps.map((step, index) => (
              <article className="pathStep" key={step.label}>
                <div className={`aiVideo aiVideo${index + 1}`} aria-label={`${step.label} AI video preview`} role="img">
                  <span className="videoStage" />
                  <span className="videoProduct" />
                  <span className="videoGhost videoGhostOne" />
                  <span className="videoGhost videoGhostTwo" />
                  <span className="videoScan" />
                  <span className="videoSpark videoSparkOne" />
                  <span className="videoSpark videoSparkTwo" />
                  <span className="videoExport" />
                </div>

                <div className="pathStepCopy">
                  <span className="pathStepNumber">{String(index + 1).padStart(2, "0")}</span>
                  <strong>
                    <span className="langEnglish">{step.label}</span>
                    <span className="langHindi">{step.hindi}</span>
                  </strong>
                  <small>
                    <span className="langEnglish">{step.detail}</span>
                    <span className="langHindi">{step.hindiDetail}</span>
                  </small>
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="contactBand" id="contact" aria-labelledby="contact-title">
        <div className="contactIntro">
          <p className="sectionEyebrow">
            <span className="langEnglish">Contact</span>
            <span className="langHindi">संपर्क</span>
          </p>
          <h2 id="contact-title">
            <span className="langEnglish">Need better product images for your store?</span>
            <span className="langHindi">मार्केटप्लेस इमेज बनाने के लिए तैयार?</span>
          </h2>
          <p>
            <span className="langEnglish">
              Send one sample product photo and tell us your marketplace. We will
              suggest the right image set, background style, and listing format.
            </span>
            <span className="langHindi">एक प्रोडक्ट फोटो भेजें और सही image set की सलाह पाएं।</span>
          </p>
        </div>

        <div className="contactPanel" aria-label="Contact details">
          <a className="contactButton" href="mailto:hello@productvisuals.ai">
            <span className="langEnglish">Email product photo</span>
            <span className="langHindi">प्रोडक्ट फोटो भेजें</span>
          </a>

          <div className="contactInfoGrid">
            <div>
              <strong>Response</strong>
              <span>Within 24 hours</span>
            </div>
            <div>
              <strong>Best for</strong>
              <span>Amazon, Flipkart, Meesho, D2C stores</span>
            </div>
            <div>
              <strong>You receive</strong>
              <span>Angles, detail shots, lifestyle scenes, ad frames</span>
            </div>
            <div>
              <strong>Support</strong>
              <span>Style selection, image planning, listing guidance</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="siteFooter">
        <div className="footerCta">
          <div className="footerCtaCard">
            <h2>Let&apos;s get started.</h2>
            <p>Send one product photo and we&apos;ll plan a sharper image set for your store.</p>
            <a href="mailto:hello@productvisuals.ai">Let&apos;s Chat</a>
          </div>

          <div className="footerIllustration" aria-hidden="true">
            <span className="footerBurst" />
            <span className="footerHand" />
            <span className="footerPalm" />
            <span className="footerFinger footerFingerOne" />
            <span className="footerFinger footerFingerTwo" />
            <span className="footerFinger footerFingerThree" />
            <span className="footerEye footerEyeOne" />
            <span className="footerEye footerEyeTwo" />
            <span className="footerSmile" />
            <span className="footerShape footerShapeOne" />
            <span className="footerShape footerShapeTwo" />
            <span className="footerShape footerShapeThree" />
            <span className="footerShape footerShapeFour" />
          </div>
        </div>

        <div className="footerBottom">
          <div className="footerBrand">
            <strong>AI Product Image Generator</strong>
            <span>Marketplace visuals from one product photo.</span>
          </div>

          <nav aria-label="Footer navigation">
            <a href="#home">Work</a>
            <a href="#about">Benefits</a>
            <a href="#services">Workflow</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="footerChannels" aria-label="Contact channels">
            <a href="mailto:hello@productvisuals.ai">Email</a>
            <a href="#contact">Chat</a>
            <a href="#contact">Support</a>
          </div>

          <span className="footerCopy">© Copyright 2026 Product Visuals</span>
          <a className="footerPrivacy" href="#contact">Privacy Policy</a>
        </div>
      </footer>
    </main>
  );
}
