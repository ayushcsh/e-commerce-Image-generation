"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import SplitText from "@/components/SplitText";
import CursorGrid from "@/components/CursorGrid";

const navItems = [
  { label: "Home", hindi: "होम", href: "#home" },
  { label: "Benefits", hindi: "फायदे", href: "#about" },
  { label: "Workflow", hindi: "वर्कफ्लो", href: "#services" },
  { label: "FAQ", hindi: "सवाल", href: "#faq" },
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

const faqs = [
  {
    q: "How does it work?",
    a: "Upload one product photo, select your marketplace, and our AI generates a complete image set — front, side, detail, lifestyle, and ad-ready frames in minutes.",
    aHindi: "एक प्रोडक्ट फोटो अपलोड करें, मार्केटप्लेस चुनें — बाकी हमारा AI संभालेगा।"
  },
  {
    q: "Which marketplaces do you support?",
    a: "Amazon, Flipkart, Meesho, Myntra, and any D2C or custom store. Each format is sized and styled to the platform's listing requirements.",
    aHindi: "Amazon, Flipkart, Meesho, Myntra और किसी भी D2C स्टोर के लिए।"
  },
  {
    q: "What image styles can I choose from?",
    a: "Studio white, soft shadow, premium dark, and lifestyle scenes. Switch between them without a reshoot.",
    aHindi: "स्टूडियो व्हाइट, सॉफ्ट शैडो, प्रीमियम डार्क और लाइफस्टाइल।"
  },
  {
    q: "How fast is the turnaround?",
    a: "Most image sets are ready within minutes. Bulk or custom requests are delivered within 24 hours.",
    aHindi: "ज्यादातर image set कुछ ही मिनटों में तैयार।"
  },
  {
    q: "Is there a free trial?",
    a: "Yes — new users get a complimentary image set on their first upload so you can judge the quality before committing.",
    aHindi: "हाँ — पहली बार free image set मिलता है।"
  },
  {
    q: "Can I edit or regenerate specific frames?",
    a: "Absolutely. You can regenerate individual angles, adjust backgrounds, or refine lighting until the set matches your brand.",
    aHindi: "ज़रूर — अलग-अलग एंगल बदलें, बैकग्राउंड या लाइटिंग अपडेट करें।"
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
  const { data: session, status: sessionStatus } = useSession();
  const isAuthed = sessionStatus === "authenticated";
  const ctaHref = isAuthed ? "/studio" : "/login";

  useEffect(() => {
    const btn = document.getElementById("mobile-menu-btn");
    const nav = document.getElementById("mobile-nav");
    const close = document.getElementById("mobile-nav-close");
    if (!btn || !nav || !close) return;

    const open = () => {
      nav.classList.add("isOpen");
      nav.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const closeNav = () => {
      nav.classList.remove("isOpen");
      nav.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    btn.addEventListener("click", open);
    close.addEventListener("click", closeNav);
    nav.addEventListener("click", (e) => {
      if (e.target === nav) closeNav();
    });

    return () => {
      btn.removeEventListener("click", open);
      close.removeEventListener("click", closeNav);
    };
  }, []);

  return (
    <main className="page">
      <input
        className="languageToggleInput"
        id="language-toggle"
        type="checkbox"
        aria-label="Switch language between English and Hindi"
      />

      <CursorGrid
        className="pageCursorGrid"
        cellSize={74}
        color="#0ea5e9"
        radius={150}
        falloff="smooth"
        holdTime={260}
        fadeDuration={850}
        lineWidth={1}
        maxOpacity={0.55}
        fillOpacity={0.04}
        gridOpacity={0.08}
        cellRadius={4}
        clickPulse
        pulseSpeed={620}
      />

      <section className="posterHero" id="home" aria-label="Product image generation hero">
        <div className="heroGridMask" aria-hidden="true" />
        <header className="siteHeader">
          <div className="navBar">
            <a className="siteBrand" href="/">
              <span className="brandMark" aria-hidden="true">VF</span>
              <SplitText
                text="VendorFlow"
                className="brandName"
                tag="span"
                splitType="chars"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                delay={60}
                duration={0.8}
                ease="power3.out"
                threshold={0.1}
                rootMargin="-50px"
                textAlign="left"
              />
            </a>

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
          </div>

          {sessionStatus === "authenticated" && session?.user ? (
            <Link className="headerCornerAvatar" href="/studio" aria-label="Go to your studio" title={session.user.name || session.user.email || "Account"}>
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={38}
                  height={38}
                  unoptimized
                />
              ) : (
                <span>
                  {(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
                </span>
              )}
            </Link>
          ) : (
            <a className="headerCornerSignUp" href="/login">Sign Up</a>
          )}
        </header>

        {/* Mobile-only hamburger button */}
        <button className="mobileMenuBtn" aria-label="Open menu" id="mobile-menu-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Mobile nav overlay */}
        <div className="mobileNavOverlay" id="mobile-nav" aria-hidden="true">
          <div className="mobileNavDrawer">
            <button className="mobileNavClose" id="mobile-nav-close" aria-label="Close menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <nav aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a
                  className="mobileNavLink"
                  href={item.href}
                  key={item.label}
                >
                  <span className="langEnglish">{item.label}</span>
                  <span className="langHindi">{item.hindi}</span>
                </a>
              ))}
              <a className="mobileNavLink mobileNavCta" href={ctaHref}>
                <span className="langEnglish">{isAuthed ? "Go to Studio" : "Login / Sign Up"}</span>
                <span className="langHindi">{isAuthed ? "स्टूडियो" : "लॉगिन / साइन अप"}</span>
              </a>
            </nav>
          </div>
        </div>

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
                <span className="langEnglish">AI-powered product visuals for sellers</span>
                <span className="langHindi">ई-कॉमर्स विक्रेताओं के लिए</span>
              </p>
              <h1 className="heroTitle">
                <span className="langEnglish">
                  <span>HELL<AccentO /></span>
                  <span>VEND<AccentO />RS!</span>
                </span>
                <span className="langHindi">
                  <span>नमस्ते</span>
                  <span>विक्रेताओ!</span>
                </span>
              </h1>

              <div className="titleRule" aria-hidden="true" />

              <p className="introCopy">
                <span className="langEnglish">
                  Upload one product photo and instantly generate a
                  marketplace-ready gallery with multiple angles, studio
                  backgrounds, close-ups, and lifestyle shots.
                </span>
                <span className="langHindi">
                  एक प्रोडक्ट फोटो अपलोड करें और उसे 7-8 मार्केटप्लेस इमेज में बदलें।
                </span>
              </p>

              <p className="heroTagline">
                <span className="langEnglish">
                  One photo. Endless possibilities.
                </span>
                <span className="langHindi">
                  एक फोटो। अनगिनत संभावनाएं।
                </span>
              </p>

              <a className="getStarted" href={ctaHref} aria-label="Get started">
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
            <svg className="pathwayLine" viewBox="0 0 640 2960" preserveAspectRatio="none" aria-hidden="true">
              <path className="pathwayTrack" d="M520 296 C520 592 120 592 120 888 C120 1184 520 1184 520 1480 C520 1776 120 1776 120 2072 C120 2368 520 2368 520 2664" />
              <path className="pathwayGlow" d="M520 296 C520 592 120 592 120 888 C120 1184 520 1184 520 1480 C520 1776 120 1776 120 2072 C120 2368 520 2368 520 2664" />
              <path className="pathwayPulse" d="M520 296 C520 592 120 592 120 888 C120 1184 520 1184 520 1480 C520 1776 120 1776 120 2072 C120 2368 520 2368 520 2664" />
            </svg>

            <div className="pathwayNodes">
            {steps.map((step, index) => (
              <article className="pathStep" key={step.label}>
                <video
                  className="stepVideo"
                  src={`/${["photo-upload", "clean-frames", "angle", "style-scene", "launch-gallery"][index]}.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label={step.label}
                />

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

      <section className="faqBand" id="faq" aria-labelledby="faq-title">
        <div className="faqHeader">
          <h2 id="faq-title">
            <span className="langEnglish">Frequently asked questions.</span>
            <span className="langHindi">आपके सवाल, हमारे जवाब।</span>
          </h2>
        </div>

        <div className="faqList faqListCenter">
          {faqs.map((faq, index) => (
            <details className="faqItem" key={faq.q}>
              <summary className="faqQuestion">
                <span className="faqNum">{String(index + 1).padStart(2, "0")}</span>
                <span className="faqQText">
                  <span className="langEnglish">{faq.q}</span>
                  <span className="langHindi">{faq.q}</span>
                </span>
                <span className="faqIcon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </summary>
              <div className="faqAnswer">
                <span className="langEnglish">{faq.a}</span>
                <span className="langHindi">{faq.aHindi}</span>
              </div>
            </details>
          ))}
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
