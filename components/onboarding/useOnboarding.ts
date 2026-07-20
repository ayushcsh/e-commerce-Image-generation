"use client";

import { useState, useEffect, useCallback } from "react";
import type { OnboardingStep, UseOnboardingReturn, OnboardingState } from "./types";
import { ONBOARDING_STEPS } from "./types";

const STORAGE_KEY = "vendor_onboarding_completed";

function readStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStorage(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {}
}

export function resetVendorOnboarding() {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  window.location.reload();
}

export function useOnboarding(): OnboardingState & {
  showWelcome: () => void;
  hideWelcome: () => void;
  startTour: () => void;
  skipTour: () => void;
  advanceTo: (step: OnboardingStep) => void;
  markDone: () => void;
  resetOnboarding: () => void;
} {
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const done = readStorage();
    if (!done) {
      const timer = setTimeout(() => setIsWelcomeVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const showWelcome = useCallback(() => setIsWelcomeVisible(true), []);
  const hideWelcome = useCallback(() => setIsWelcomeVisible(false), []);

  const startTour = useCallback(() => {
    setIsWelcomeVisible(false);
    setIsTourActive(true);
  }, []);

  const skipTour = useCallback(() => {
    setIsWelcomeVisible(false);
    setIsTourActive(false);
    setCompleted(true);
    writeStorage(true);
  }, []);

  const markDone = useCallback(() => {
    setIsTourActive(false);
    setCompleted(true);
    writeStorage(true);
  }, []);

  const advanceTo = useCallback((step: OnboardingStep) => {
    setIsTourActive(true);
  }, []);

  const resetOnboardingFn = useCallback(() => {
    resetVendorOnboarding();
  }, []);

  return {
    step: isTourActive ? "upload" : "welcome",
    isWelcomeVisible,
    isTourActive,
    completed,
    showWelcome,
    hideWelcome,
    startTour,
    skipTour,
    advanceTo,
    markDone,
    resetOnboarding: resetOnboardingFn,
  };
}

export function useOnboardingStep(initial: OnboardingStep = "welcome") {
  const [step, setStep] = useState<OnboardingStep>(initial);

  const advanceTo = useCallback((target: OnboardingStep) => {
    setStep(target);
  }, []);

  const goNext = useCallback(() => {
    setStep((prev) => {
      const idx = ONBOARDING_STEPS.indexOf(prev);
      return idx < ONBOARDING_STEPS.length - 1 ? ONBOARDING_STEPS[idx + 1] : prev;
    });
  }, []);

  const goBack = useCallback(() => {
    setStep((prev) => {
      const idx = ONBOARDING_STEPS.indexOf(prev);
      return idx > 0 ? ONBOARDING_STEPS[idx - 1] : prev;
    });
  }, []);

  const isFirst = () => step === ONBOARDING_STEPS[0];
  const isLast  = () => step === ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
  const index   = () => ONBOARDING_STEPS.indexOf(step);
  const total   = () => ONBOARDING_STEPS.length;

  return { step, advanceTo, goNext, goBack, isFirst, isLast, index, total };
}
