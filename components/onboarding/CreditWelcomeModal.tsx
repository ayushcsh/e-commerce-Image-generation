"use client";

interface CreditWelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreditWelcomeModal({ visible, onClose }: CreditWelcomeModalProps) {
  if (!visible) return null;

  return (
    <div className="onboardWelcomeOverlay" role="dialog" aria-modal="true" aria-label="Welcome bonus">
      <div className="onboardWelcomeCard">
        <div className="onboardWelcomeOrb" aria-hidden="true" />

        <div className="onboardWelcomeBadge">
          <span className="onboardWelcomeBadgeDot" />
          <span>Welcome Gift</span>
        </div>

        <h1 className="onboardWelcomeTitle">
          You&apos;ve got 1 free credit! 🎁
        </h1>

        <p className="onboardWelcomeSubtitle">
          It&apos;s already in your account — use it to generate your first
          AI-powered product image, on us.
        </p>

        <div className="onboardWelcomeActions">
          <button className="onboardStartBtn" type="button" onClick={onClose}>
            <span>Start Creating</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
