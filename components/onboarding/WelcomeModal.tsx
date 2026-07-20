"use client";

interface WelcomeModalProps {
  visible: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export default function WelcomeModal({ visible, onStart, onSkip }: WelcomeModalProps) {
  if (!visible) return null;

  return (
    <div className="onboardWelcomeOverlay" role="dialog" aria-modal="true" aria-label="Welcome to the Studio">
      <div className="onboardWelcomeCard">
        <div className="onboardWelcomeBadge">
          <span className="onboardWelcomeBadgeDot" />
          <span>AI-Powered VendorFlow</span>
        </div>

        <h1 className="onboardWelcomeTitle">
          Let&apos;s create your first product<br />in under a minute.
        </h1>

        <p className="onboardWelcomeSubtitle">
          Upload one product photo and our AI will automatically fill
          your listing — name, category, features, and more.
        </p>

        <div className="onboardWelcomeFeatures">
          {[
            { icon: "📸", label: "Upload" },
            { icon: "🤖", label: "AI Analyze" },
            { icon: "✨", label: "Auto-fill" },
            { icon: "🚀", label: "Publish" },
          ].map(({ icon, label }) => (
            <div key={label} className="onboardWelcomeFeaturePill">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="onboardWelcomeActions">
          <button className="onboardStartBtn" type="button" onClick={onStart}>
            <span>Start Tour</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button className="onboardSkipBtn" type="button" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
