// ── Onboarding Types ──────────────────────────────────────────────────────────────

export type OnboardingStep =
  | "welcome"
  | "upload"
  | "logo"
  | "processing"
  | "product-name"
  | "category"
  | "brand-name"
  | "sku"
  | "marketplace-background"
  | "features-key-features"
  | "features-product-colors"
  | "features-material"
  | "features-dimensions"
  | "features-weight"
  | "brand-colors"
  | "font-style"
  | "custom-prompt"
  | "generate-basic"
  | "generate-aplus"
  | "ai-preferences"
  | "output"
  | "publish"
  | "done";

export interface OnboardingState {
  step: OnboardingStep;
  isWelcomeVisible: boolean;
  isTourActive: boolean;
  completed: boolean;
}

export interface OnboardingActions {
  showWelcome: () => void;
  hideWelcome: () => void;
  startTour: () => void;
  skipTour: () => void;
  goNext: () => void;
  goBack: () => void;
  advanceTo: (step: OnboardingStep) => void;
  markDone: () => void;
  resetOnboarding: () => void;
}

export type UseOnboardingReturn = OnboardingState & OnboardingActions;

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "upload",
  "logo",
  "processing",
  "product-name",
  "category",
  "brand-name",
  "sku",
  "marketplace-background",
  "features-key-features",
  "features-product-colors",
  "features-material",
  "features-dimensions",
  "features-weight",
  "brand-colors",
  "font-style",
  "custom-prompt",
  "generate-basic",
  "generate-aplus",
  "ai-preferences",
  "output",
  "publish",
  "done",
];

export const STEP_META: Record<OnboardingStep, { label: string; description: string }> = {
  welcome:                  { label: "Welcome",               description: "Let's get started" },
  upload:                   { label: "Upload photos",         description: "Add your product photos" },
  logo:                     { label: "Upload logo",           description: "Add your brand logo" },
  processing:               { label: "Processing",            description: "AI is analyzing your images" },
  "product-name":           { label: "Product name",          description: "The name buyers will see" },
  category:                 { label: "Category",              description: "Helps style the AI images correctly" },
  "brand-name":             { label: "Brand name",            description: "Optional — for A+ banners" },
  sku:                      { label: "SKU",                   description: "Optional internal reference" },
  "marketplace-background": { label: "Marketplace",           description: "Where to sell and background style" },
  "features-key-features":  { label: "Key features",          description: "Key selling points" },
  "features-product-colors":{ label: "Product colors",       description: "Color(s) shown in photos" },
  "features-material":      { label: "Material",             description: "Optional — helps AI textures" },
  "features-dimensions":    { label: "Dimensions",           description: "Optional — size info" },
  "features-weight":        { label: "Weight",               description: "Optional — shipping info" },
  "brand-colors":           { label: "Brand colors",          description: "Brand palette for A+ banners" },
  "font-style":             { label: "Font style",           description: "Preferred font for A+ text" },
  "custom-prompt":          { label: "Custom prompt",        description: "Anything else the AI should know" },
  "generate-basic":         { label: "Basic images",          description: "Standard listing images" },
  "generate-aplus":         { label: "A+ images",             description: "Premium banner modules" },
  "ai-preferences":         { label: "AI preferences",       description: "Style, text, and language" },
  output:                   { label: "Output settings",       description: "Quantity, size & format" },
  publish:                  { label: "Publish",               description: "Go live" },
  done:                     { label: "All done!",             description: "You're ready to go" },
};
