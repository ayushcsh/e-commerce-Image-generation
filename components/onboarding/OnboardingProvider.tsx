"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useSession } from "next-auth/react";
import WelcomeModal from "./WelcomeModal";
import TourTooltip from "./TourTooltip";
import type { OnboardingStep } from "./types";

interface TourContextValue {
  isTourMode: boolean;
  tourLockedAplus: boolean;
}

export const TourContext = createContext<TourContextValue>({
  isTourMode: false,
  tourLockedAplus: false,
});

export function useTourContext() {
  return useContext(TourContext);
}

// Tour completion is tracked per account (server-side) rather than per
// browser, so a fresh signup always sees the tour even on a device/browser
// that already completed it for a different account.
function markCompleted() {
  fetch("/api/onboarding/tour", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: true }),
  }).catch(() => {});
}

export async function resetVendorOnboarding() {
  try {
    await fetch("/api/onboarding/tour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    });
  } catch {}
  window.location.reload();
}

// ── Tour Steps ─────────────────────────────────────────────────────────────────
const TOUR_STEPS: Array<{
  step: OnboardingStep;
  targetId: string;
  title: string;
  description: string;
  nextLabel?: string;
  waitFor: () => boolean;
  onOverlayGone?: boolean;
  requiresField?: boolean;
}> = [
  {
    step: "upload",
    targetId: "photos",
    title: "Upload your product photos",
    description: "Start by uploading clear images of your product — front, side, and detail shots give the AI the best context.",
    requiresField: true,
    waitFor: () => {
      const previews = document.querySelectorAll(".previewTile");
      return previews.length > 0;
    },
  },
  {
    step: "logo",
    targetId: "logo-section",
    title: "Upload your logo",
    description: "Optional but recommended — add your brand logo so it can be placed on banner images. Not ready? Just skip it.",
    nextLabel: "Skip — optional",
    waitFor: () => {
      const logo = document.querySelector(".logoPreview");
      return logo !== null;
    },
  },
  {
    step: "processing",
    targetId: "analyze-trigger",
    title: "Analyze your photos",
    description: "Click 'Analyze Photos' and our AI will read colors, shapes, materials, and features to auto-fill your listing.",
    waitFor: () => false,
    onOverlayGone: true,
  },
  {
    step: "product-name",
    targetId: "product-name-field",
    title: "Product name",
    description: "The exact name buyers will see. The AI may have auto-filled this from your photos — double-check it.",
    requiresField: true,
    waitFor: () => {
      const input = document.getElementById("product-name-field") as HTMLInputElement | null;
      return !!input && input.value.trim().length > 0;
    },
  },
  {
    step: "category",
    targetId: "category-field",
    title: "Category",
    description: "Helps the AI apply the right lifestyle context and background styling for each marketplace.",
    requiresField: true,
    waitFor: () => {
      const input = document.getElementById("category-field") as HTMLInputElement | null;
      return !!input && input.value.trim().length > 0;
    },
  },
  {
    step: "brand-name",
    targetId: "brand-name-field",
    title: "Brand name",
    description: "Optional — used for A+ banner overlays and brand story images. Not branded? Skip it.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "sku",
    targetId: "sku-field",
    title: "SKU",
    description: "Optional internal reference code.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "marketplace-background",
    targetId: "marketplace-section",
    title: "Marketplace & background",
    description: "Pick where you're selling and the background style your listing images should use.",
    requiresField: true,
    waitFor: () => {
      const checked = document.querySelectorAll("#marketplace-section input[type='checkbox']:checked");
      return checked.length > 0;
    },
  },
  {
    step: "features-key-features",
    targetId: "key-features-field",
    title: "Key features",
    description: "Add 2–5 bullet points that describe what makes this product stand out.",
    waitFor: () => false,
  },
  {
    step: "features-product-colors",
    targetId: "product-colors-field",
    title: "Product color(s)",
    description: "Add the color(s) shown in your photos — the AI uses this to keep images consistent.",
    waitFor: () => false,
  },
  {
    step: "features-material",
    targetId: "material-field",
    title: "Material",
    description: "Optional — helps the AI add realistic textures like wood grain, brushed metal, or fabric.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "features-dimensions",
    targetId: "dimensions-field",
    title: "Dimensions",
    description: "Optional — add size so lifestyle scenes render with accurate proportions.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "features-weight",
    targetId: "weight-field",
    title: "Weight",
    description: "Optional — useful for shipping and lifestyle context.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "brand-colors",
    targetId: "brand-colors-field",
    title: "Brand colors",
    description: "Pick or type hex codes for your brand palette — the AI uses this for A+ banner overlays.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "font-style",
    targetId: "font-style-field",
    title: "Preferred font style",
    description: "Optional — pick a style for text that appears on A+ banner images.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "custom-prompt",
    targetId: "custom-prompt-field",
    title: "Anything else the AI should know?",
    description: "Optional — type freely here and it's added to every image prompt on top of the fields above.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "generate-basic",
    targetId: "basic-images-section",
    title: "Basic images",
    description: "Standard listing images — main shot, angles, lifestyle scenes, and feature infographics.",
    nextLabel: "Skip — optional",
    waitFor: () => false,
  },
  {
    step: "generate-aplus",
    targetId: "aplus-images-section",
    title: "A+ Premium images",
    description: "Rich A+ Content banners for Amazon/Flipkart. At least one image type (basic or A+) is required overall.",
    requiresField: true,
    waitFor: () => {
      const checked = document.querySelectorAll(
        "#basic-images-section input[type='checkbox']:checked, #aplus-images-section input[type='checkbox']:checked"
      );
      return checked.length > 0;
    },
  },
  {
    step: "ai-preferences",
    targetId: "ai-preferences-section",
    title: "Style, text & language",
    description: "Choose the overall image style, whether text appears on the image, and the language it's written in.",
    waitFor: () => false,
  },
  {
    step: "output",
    targetId: "output-section",
    title: "Quantity, size & format",
    description: "Set how many variants to generate and the output file size and format.",
    waitFor: () => false,
  },
  {
    step: "publish",
    targetId: "submit-section",
    title: "Generate your images",
    description: "Hit 'Generate images' and our AI will create professional, marketplace-ready product visuals.",
    waitFor: () => document.getElementById("results") !== null,
  },
  {
    step: "generating-images",
    targetId: "results",
    title: "Generating your images",
    description: "The AI is creating your marketplace-ready image set — this can take a minute for larger batches.",
    waitFor: () => {
      const stillLoading = document.querySelectorAll(".resultsTileLoading").length > 0;
      const hasReal = document.querySelectorAll(".resultsTile:not(.resultsTileLoading)").length > 0;
      return hasReal && !stillLoading;
    },
  },
  {
    step: "generated-output",
    targetId: "results",
    title: "Your images are ready!",
    description: "Click any image to preview it full-size, download individually, or grab the whole set as a ZIP.",
    waitFor: () => false,
  },
  {
    step: "generate-listing",
    targetId: "generate-listing-btn",
    title: "Generate marketplace listing text",
    description: "Optional — get an AI-written title, bullet points, and description to go with your images.",
    nextLabel: "Skip — optional",
    waitFor: () => document.querySelector(".listingPanelOverlay") !== null,
  },
  {
    step: "listing-output",
    targetId: "listing-output-panel",
    title: "Your listing text is ready",
    description: "Copy the AI-written title, bullets, and description straight into your marketplace listing.",
    waitFor: () => false,
  },
  {
    step: "history",
    targetId: "history-toggle-btn",
    title: "Find it again later",
    description: "Every generation is saved here — reopen past image sets and listing text anytime, no need to redo the work.",
    waitFor: () => false,
  },
];

// ── Provider Component ─────────────────────────────────────────────────────────
interface OnboardingProviderProps {
  children: React.ReactNode;
  tourMode?: boolean;
}

export default function OnboardingProvider({ children, tourMode = false }: OnboardingProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState<OnboardingStep>("upload");
  const [completed, setCompleted] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [analyzingActive, setAnalyzingActive] = useState(false);
  const [isTourMode, setIsTourMode] = useState(tourMode);

  const tourActiveRef = useRef(tourActive);
  tourActiveRef.current = tourActive;
  const completedRef = useRef(completed);
  completedRef.current = completed;
  const tourStepRef = useRef(tourStep);
  tourStepRef.current = tourStep;
  const autoAdvancingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showContinueRef = useRef(false);
  showContinueRef.current = showContinue;
  const overlayAppearedRef = useRef(false);

  // ── Navigation functions (defined before useEffects) ──────────────────────
  function goNext() {
    const idx = TOUR_STEPS.findIndex((s) => s.step === tourStepRef.current);
    if (idx < TOUR_STEPS.length - 1) {
      setTourStep(TOUR_STEPS[idx + 1].step);
    } else {
      setTourActive(false);
      setCompleted(true);
      markCompleted();
    }
  }

  function goBack() {
    const idx = TOUR_STEPS.findIndex((s) => s.step === tourStepRef.current);
    if (idx > 0) {
      setTourStep(TOUR_STEPS[idx - 1].step);
    }
  }

  function handleSkip() {
    setShowWelcome(false);
    goNext();
  }

  function handleStart() {
    setShowWelcome(false);
    setTourActive(true);
    setTourStep("upload");
    setTimeout(() => {
      document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }

  function finishTour() {
    setTourActive(false);
    setCompleted(true);
    markCompleted();
  }

  // ── Show welcome on first visit ────────────────────────────────────────────
  // Gated on the signed-in account (server-side), not the browser — so a
  // fresh signup always sees it, even on a device that already completed
  // the tour for a different account.
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) return;

    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout> | null = null;

    fetch("/api/onboarding/tour")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || data.completed) return;
        showTimer = setTimeout(() => setShowWelcome(true), 600);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (showTimer) clearTimeout(showTimer);
    };
  }, [sessionStatus, session?.user?.id]);

  // ── Auto-advance when waitFor condition becomes true ────────────────────
  useEffect(() => {
    // Reset flags when step changes — must be at top so check below always runs fresh
    setShowContinue(false);
    setAnalyzingActive(false);
    autoAdvancingRef.current = false;
    timerRef.current = null;

    if (!tourActiveRef.current || completedRef.current) return;

    const currentConfig = TOUR_STEPS.find((s) => s.step === tourStepRef.current);
    if (!currentConfig) return;

    // Processing step: wait for the user to click "Analyze Photos" (overlay
    // APPEARS), then wait for analysis to finish (overlay DISAPPEARS) before
    // advancing. Uses a ref so resets survive across effect re-runs.
    if ("onOverlayGone" in currentConfig && currentConfig.onOverlayGone) {
      const alreadyAppeared = document.querySelector(".analyzeOverlay") !== null;
      setAnalyzingActive(alreadyAppeared);
      overlayAppearedRef.current = alreadyAppeared;

      const observer = new MutationObserver(() => {
        const present = document.querySelector(".analyzeOverlay") !== null;
        if (present && !overlayAppearedRef.current) {
          overlayAppearedRef.current = true;
          setAnalyzingActive(true);
        } else if (!present && overlayAppearedRef.current) {
          observer.disconnect();
          setAnalyzingActive(false);
          timerRef.current = setTimeout(() => {
            goNext();
          }, 400);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }

    // Steps gated on a DOM condition (e.g. "a photo has been uploaded") need
    // to keep watching — the condition usually isn't true yet when the step
    // first mounts, it becomes true later as the user interacts with the page.
    function checkWaitFor() {
      const ready = currentConfig!.waitFor();

      // Required-field steps (product name, category, marketplace, image
      // types...): never auto-advance, just enable/disable the Next button
      // as the field's filled-state changes.
      if (currentConfig!.requiresField) {
        setShowContinue(ready);
        return;
      }

      if (!ready) return;

      // On "logo" step: show Continue button after both photo + logo uploaded
      if (currentConfig!.step === "logo") {
        const previews = document.querySelectorAll(".previewTile");
        const logo = document.querySelector(".logoPreview");
        if (previews.length > 0 && logo !== null) {
          setShowContinue(true);
        }
        return;
      }

      if (!autoAdvancingRef.current) {
        autoAdvancingRef.current = true;
        timerRef.current = setTimeout(() => {
          goNext();
        }, 700);
      }
    }

    checkWaitFor();
    const observer = new MutationObserver(checkWaitFor);
    observer.observe(document.body, { childList: true, subtree: true });
    // childList mutations don't fire for typing into a controlled input or
    // checking a checkbox (React sets .value/.checked as properties, not
    // attributes) — listen for the real events too so requiresField steps
    // react immediately as the user types/clicks.
    document.addEventListener("input", checkWaitFor, true);
    document.addEventListener("change", checkWaitFor, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", checkWaitFor, true);
      document.removeEventListener("change", checkWaitFor, true);
    };
    // tourActive is included because tourStep starts at "upload" and stays
    // there when the tour first activates (setTourStep("upload") is a no-op
    // React bails on) — without it this effect never runs for the first step.
  }, [tourStep, tourActive]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!tourActive) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleSkip();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourActive]);

  // ── Lock page scroll while tour is active ──────────────────────────────────
  useEffect(() => {
    if (tourActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [tourActive]);

  // ── Derived values ────────────────────────────────────────────────────────
  const currentConfig = TOUR_STEPS.find((s) => s.step === tourStep);
  const currentIdx    = TOUR_STEPS.findIndex((s) => s.step === tourStep);

  // ── Done screen ──────────────────────────────────────────────────────────
  if (completed && !tourActive && !showWelcome) {
    return (
      <TourContext.Provider value={{ isTourMode, tourLockedAplus: isTourMode }}>
        {children}
        <DoneScreen onReset={resetVendorOnboarding} />
      </TourContext.Provider>
    );
  }

  const tourLockedAplus = isTourMode;

  return (
    <TourContext.Provider value={{ isTourMode, tourLockedAplus }}>
      {children}

      {/* Welcome modal */}
      <WelcomeModal
        visible={showWelcome && !tourActive}
        onStart={handleStart}
        onSkip={handleSkip}
      />

      {/* Tour tooltip */}
      {tourActive && currentConfig && (
        <TourTooltip
          key={currentConfig.step}
          targetId={
            currentConfig.step === "processing" && analyzingActive
              ? "__no_spotlight__"
              : currentConfig.targetId
          }
          title={
            currentConfig.step === "processing" && analyzingActive
              ? "AI is analyzing your photos"
              : currentConfig.title
          }
          description={
            currentConfig.step === "processing" && analyzingActive
              ? "The AI is reading colors, shapes, materials, and features — this takes a few seconds."
              : currentConfig.description
          }
          step={currentIdx + 1}
          total={TOUR_STEPS.length}
          isLast={currentIdx === TOUR_STEPS.length - 1}
          isFirst={currentIdx === 0}
          showContinue={showContinue}
          nextLabel={showContinue && currentConfig.step === "logo" ? "Continue" : currentConfig.nextLabel}
          nextDisabled={!!currentConfig.requiresField && !showContinue}
          hideNext={currentConfig.step === "processing" || currentConfig.step === "generating-images"}
          onContinue={goNext}
          onNext={goNext}
          onPrev={goBack}
          onSkip={handleSkip}
          onFinish={finishTour}
          isTourMode={isTourMode}
          onRestartTour={() => {
            // Restart: clear completion flag and re-lock A+/basic selection
            // (isTourMode must stay true, otherwise the restarted tour would
            // run with those restrictions silently disabled).
            setCompleted(false);
            setIsTourMode(true);
            setTourActive(false);
            setShowWelcome(true);
          }}
        />
      )}
    </TourContext.Provider>
  );
}

// ── Done Screen ─────────────────────────────────────────────────────────────────
function DoneScreen({ onReset }: { onReset: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="onboardWelcomeOverlay" role="dialog" aria-modal="true" aria-label="You are all set">
      <div className="onboardWelcomeCard">
        <div className="onboardWelcomeBadge">
          <span className="onboardWelcomeBadgeDot" />
          <span>Tour complete</span>
        </div>
        <h1 className="onboardWelcomeTitle">You&apos;re Ready 🚀</h1>
        <p className="onboardWelcomeSubtitle">
          Your first AI-assisted listing is ready. Start creating and publishing your products today.
        </p>
        <div className="onboardWelcomeActions">
          <button className="onboardStartBtn" type="button" onClick={() => window.location.reload()}>
            Start Creating
          </button>
          <button className="onboardSkipBtn" type="button" onClick={onReset}>
            Restart Tour (dev)
          </button>
        </div>
        <div className="onboardWelcomeOrb" aria-hidden="true" />
      </div>
    </div>
  );
}
