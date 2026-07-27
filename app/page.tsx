"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
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
  const [showAccountMenu, setShowAccountMenu] = useState(false);

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
              <Image
                src="/logo.png"
                alt=""
                width={211}
                height={196}
                className="brandMark"
                aria-hidden="true"
              />
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
            <div className="headerAccountMenu">
              <button
                className="headerCornerAvatar"
                type="button"
                onClick={() => setShowAccountMenu((v) => !v)}
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={showAccountMenu}
                title={session.user.name || session.user.email || "Account"}
              >
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
              </button>

              {showAccountMenu && (
                <>
                  <div className="headerAccountBackdrop" onClick={() => setShowAccountMenu(false)} />
                  <div className="headerAccountDropdown">
                    <Link href="/studio" className="headerAccountItem" onClick={() => setShowAccountMenu(false)}>
                      Go to Studio
                    </Link>
                    <button
                      className="headerAccountItem headerAccountSignOut"
                      type="button"
                      onClick={() => signOut({ redirectTo: "/" })}
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
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
                  <span>EC<AccentO />MMERCE</span>
                  <span>BUSINESS</span>
                  <span><AccentO />WNERS</span>
                </span>
                <span className="langHindi">
                  <span>नमस्ते</span>
                  <span>ई-कॉमर्स</span>
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

          <div className="workflowSteps">
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

        <div className="footerMain">
          <div className="footerCol footerColBrand">
            <div className="footerLogo">
              <span className="footerLogoMark">VF</span>
              <span className="footerLogoText">VendorFlow</span>
            </div>
            <p className="footerTagline">
              AI product image generation for online sellers. No shortcuts, no fake promises.
            </p>

            <span className="footerBuiltBy">Built &amp; supported by <strong>Kriscel Tech</strong></span>
            <div className="footerContactList">
              <a className="footerContactRow" href="tel:+918985419420">
                <span className="footerContactIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <span>+91 89854 19420</span>
              </a>
              <a className="footerContactRow" href="mailto:info@kriscel.com">
                <span className="footerContactIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16v16H4z" />
                    <path d="m4 6 8 7 8-7" />
                  </svg>
                </span>
                <span>info@kriscel.com</span>
              </a>
              <div className="footerContactRow">
                <span className="footerContactIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>229, Bharthal, Sector 26, Dwarka, South West Delhi, 110077</span>
              </div>
            </div>
          </div>

          <div className="footerCol">
            <h3 className="footerColTitle">Quick Links</h3>
            <nav className="footerLinksNav" aria-label="Footer navigation">
              {navItems.filter((item) => item.label !== "FAQ").map((item) => (
                <a key={item.href} href={item.href}>{item.label}</a>
              ))}
            </nav>
          </div>

          <div className="footerCol">
            <h3 className="footerColTitle">Follow Us</h3>
            <p className="footerFollowCopy">
              Connect with us on our social media platforms for the latest updates in AI and automation.
            </p>
            <div className="footerSocialGrid">
              <a className="footerSocialBtn" href="https://in.linkedin.com/company/kriscel-tech-pvt-ltd" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.83v1.64h.05c.53-1 1.85-2.05 3.8-2.05 4.07 0 4.82 2.68 4.82 6.16V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.97V21H9z" /></svg>
                LinkedIn
              </a>
              <a className="footerSocialBtn" href="https://www.instagram.com/krisceltech/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                Instagram
              </a>
              <a className="footerSocialBtn" href="https://www.facebook.com/KriscelTech/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.93.26-1.56 1.6-1.56H16.7V3.14C16.16 3.08 15.28 3 14.26 3c-2.13 0-3.6 1.3-3.6 3.68v2.12H8v3.2h2.66V21z" /></svg>
                Facebook
              </a>
              <a className="footerSocialBtn" href="https://www.youtube.com/@krisceltech" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 8.3s-.2-1.55-.82-2.23c-.78-.86-1.66-.87-2.06-.92C16.24 5 12 5 12 5s-4.24 0-7.12.15c-.4.05-1.28.06-2.06.92C2.2 6.75 2 8.3 2 8.3S1.8 10.1 1.8 11.9v1.2c0 1.8.2 3.6.2 3.6s.2 1.55.82 2.23c.78.86 1.8.83 2.26.92C6.6 19.98 12 20 12 20s4.24-.01 7.12-.16c.4-.05 1.28-.06 2.06-.92.62-.68.82-2.23.82-2.23s.2-1.8.2-3.6v-1.2c0-1.8-.2-3.6-.2-3.6zM9.9 14.9V8.9l5.4 3z" /></svg>
                YouTube
              </a>
              <a className="footerSocialBtn footerSocialBtnWide" href="https://wa.me/918985419420" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.9-2.2-.24-.58-.48-.5-.67-.5-.17-.01-.37-.01-.57-.01s-.52.07-.8.37c-.27.3-1.04 1.02-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 21.9h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.38a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.45 9.89-9.9 9.89zm8.41-18.3A11.82 11.82 0 0 0 12.03 0C5.5 0 .2 5.3.2 11.83c0 2.08.55 4.12 1.58 5.92L.1 24l6.4-1.68a11.86 11.86 0 0 0 5.53 1.41h.01c6.53 0 11.83-5.3 11.83-11.83 0-3.16-1.23-6.13-3.42-8.3z" /></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="footerBottom">
          <div className="footerCopy">
            <span>© {new Date().getFullYear()} Product Visuals. All rights reserved.</span>
            <span className="footerCredit">Developed &amp; designed by <strong>Kriscel Tech</strong></span>
          </div>
          <a className="footerPrivacy" href="#contact">Privacy Policy</a>
        </div>
      </footer>
    </main>
  );
}
