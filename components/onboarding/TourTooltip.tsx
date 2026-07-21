"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type HoleRect = { top: number; left: number; right: number; bottom: number };

interface TourTooltipProps {
  targetId: string;
  title: string;
  description?: string;
  step: number;
  total: number;
  isLast?: boolean;
  isFirst?: boolean;
  showContinue?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
  isTourMode?: boolean;
  onRestartTour?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onFinish?: () => void;
  onContinue?: () => void;
  children?: ReactNode;
}

export default function TourTooltip({
  targetId,
  title,
  description,
  step,
  total,
  isLast = false,
  isFirst = false,
  showContinue = false,
  nextLabel,
  nextDisabled = false,
  hideNext = false,
  isTourMode = false,
  onRestartTour,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onContinue,
  children,
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const spotlightedRef = useRef<HTMLElement[]>([]);
  const [holeRect, setHoleRect] = useState<HoleRect | null>(null);

  // Scroll target into view and apply spotlight styling
  useEffect(() => {
    function clearSpotlight() {
      spotlightedRef.current.forEach((node, i) => {
        if (i === 0) {
          node.classList.remove("tourTargetHighlight");
          node.style.position = "";
        }
        node.style.zIndex = "";
      });
      spotlightedRef.current = [];
    }

    clearSpotlight();

    // No spotlight for special targetIds like "__no_spotlight__"
    if (targetId === "__no_spotlight__") return;

    const el = document.getElementById(targetId);
    if (!el) return;

    // Only force position:relative if the element has no positioning of its
    // own — overriding an existing sticky/fixed/absolute (e.g. the sticky
    // left panel itself) would break that element's layout for as long as
    // it's the tour target.
    if (window.getComputedStyle(el).position === "static") {
      el.style.position = "relative";
    }
    el.style.zIndex = "9701";
    el.classList.add("tourTargetHighlight");

    // A sticky/fixed/positioned ancestor creates its own stacking context,
    // which traps the target's z-index below the dim overlay — lift those too.
    const liftedAncestors: HTMLElement[] = [];
    let node = el.parentElement;
    while (node && node !== document.body) {
      const computed = window.getComputedStyle(node);
      if (
        computed.position === "sticky" ||
        computed.position === "fixed" ||
        (computed.position !== "static" && computed.zIndex !== "auto")
      ) {
        node.style.zIndex = "9701";
        liftedAncestors.push(node);
      }
      node = node.parentElement;
    }

    spotlightedRef.current = [el, ...liftedAncestors];

    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // Auto-focus the field so the user can start typing right away
      // instead of having to tap into it first.
      const focusable = (
        el.matches("input, textarea")
          ? el
          : el.querySelector("input[type='text'], input[type='number'], textarea")
      ) as HTMLElement | null;
      focusable?.focus({ preventScroll: true });
    }, 350);

    return clearSpotlight;
  }, [targetId]);

  // Position tooltip to the side of the target
  useEffect(() => {
    if (!tooltipRef.current) return;

    function positionTooltip() {
      const tip = tooltipRef.current;
      if (!tip) return;

      // Fullscreen centered for __no_spotlight__ steps (e.g. analyzing overlay)
      if (targetId === "__no_spotlight__") {
        tip.style.top = "50%";
        tip.style.left = "50%";
        tip.style.transform = "translate(-50%, -50%)";
        tip.style.position = "fixed";
        setHoleRect(null);
        return;
      }

      const el = document.getElementById(targetId);
      if (!el) {
        // Target doesn't exist (e.g. a skippable step whose result never
        // mounted) — fall back to a plain centered dialog instead of leaving
        // the previous step's spotlight hole stuck on screen.
        tip.style.top = "50%";
        tip.style.left = "50%";
        tip.style.transform = "translate(-50%, -50%)";
        tip.style.position = "fixed";
        setHoleRect(null);
        return;
      }

      // Cut an actual hole in the dim overlay around the target (rendered as
      // 4 separate rectangular bands, see below), instead of trying to make
      // the target "escape" above the overlay via z-index — that fight is
      // unwinnable when an ancestor (sticky/formColumn/etc.) traps the
      // stacking context. Bands never have that problem: the overlay simply
      // isn't present over those pixels at all.
      const pad = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      setHoleRect({
        left: Math.max(0, rect.left - pad),
        top: Math.max(0, rect.top - pad),
        right: Math.min(vw, rect.right + pad),
        bottom: Math.min(vh, rect.bottom + pad),
      });

      const tipRect = tip.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const PADDING = 12;
      const tooltipW = 300 + PADDING * 2;

      const spaceRight = viewportW - rect.right;
      const spaceLeft = rect.left;

      let top: number;
      let left: number;

      if (spaceRight >= tooltipW) {
        top = rect.top;
        left = rect.right + PADDING;
      } else if (spaceLeft >= tooltipW) {
        top = rect.top;
        left = rect.left - tooltipW - PADDING;
      } else {
        top = rect.bottom + PADDING;
        left = Math.max(PADDING, rect.left + rect.width / 2 - 150);
      }

      top  = Math.max(PADDING, Math.min(top, viewportH - tipRect.height - PADDING));
      left = Math.max(PADDING, Math.min(left, viewportW - 300 - PADDING));

      tip.style.top  = `${top}px`;
      tip.style.left = `${left}px`;
      tip.style.transform = "";
      tip.style.position = "fixed";
    }

    positionTooltip();
    const ro = new ResizeObserver(positionTooltip);
    if (targetId !== "__no_spotlight__") {
      const el = document.getElementById(targetId);
      if (el) ro.observe(el);
    }
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [targetId]);

  const progress = Math.round((step / total) * 100);

  return (
    <>
      {/* Dim overlay — 4 bands tiling around the target so those pixels are
          never covered at all, or one full-screen div when there's no target */}
      {holeRect ? (
        <>
          {/* top band: full width, above the hole */}
          <div className="tourOverlay" aria-hidden="true"
            style={{ top: 0, left: 0, width: "100vw", height: holeRect.top, right: "auto", bottom: "auto" }} />
          {/* bottom band: full width, below the hole */}
          <div className="tourOverlay" aria-hidden="true"
            style={{ top: holeRect.bottom, left: 0, width: "100vw", height: `calc(100vh - ${holeRect.bottom}px)`, right: "auto", bottom: "auto" }} />
          {/* left band: between top/bottom bands, left of the hole */}
          <div className="tourOverlay" aria-hidden="true"
            style={{ top: holeRect.top, left: 0, width: holeRect.left, height: holeRect.bottom - holeRect.top, right: "auto", bottom: "auto" }} />
          {/* right band: between top/bottom bands, right of the hole */}
          <div className="tourOverlay" aria-hidden="true"
            style={{ top: holeRect.top, left: holeRect.right, width: `calc(100vw - ${holeRect.right}px)`, height: holeRect.bottom - holeRect.top, right: "auto", bottom: "auto" }} />
        </>
      ) : (
        <div className="tourOverlay" role="presentation" aria-hidden="true" />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={`tourTooltip${targetId === "__no_spotlight__" ? " tourTooltipFullscreen" : ""}`}
        role="dialog"
        aria-label={title}
      >
        <div className="tourProgress">
          <div className="tourProgressBar" style={{ width: `${progress}%` }} />
        </div>

        <div className="tourStepLabel">
          <span>Step {step} of {total}</span>
          <span className="tourStepTitle">{title}</span>
        </div>

        {description && <p className="tourDescription">{description}</p>}
        {children && <div className="tourChildren">{children}</div>}

        <div className="tourNav">
          {!isFirst && (
            <button className="tourBtn tourBtnPrev" type="button" onClick={onPrev}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}

          {!hideNext && (
            <button
              className={`tourBtn ${nextDisabled ? "tourBtnNextDisabled" : "tourBtnNext"}`}
              type="button"
              disabled={nextDisabled}
              onClick={onSkip}
            >
              {nextLabel ?? "Next"}
            </button>
          )}
        </div>

        {isTourMode && (
          <button
            type="button"
            onClick={onRestartTour}
            style={{
              width: "100%", marginTop: "8px", padding: "4px 8px", fontSize: "0.7rem",
              background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              color: "var(--ink-secondary)", cursor: "pointer", opacity: 0.6,
            }}
          >
            Restart tour (dev)
          </button>
        )}
      </div>
    </>
  );
}
