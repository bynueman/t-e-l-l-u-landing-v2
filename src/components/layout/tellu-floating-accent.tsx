const clips = {
  technology: "polygon(11% 0,89% 0,89% 30%,57% 66.3%,43% 66.3%,11% 30%)",
  creative: "polygon(0 42%,21% 42%,48.5% 72%,48.5% 100%,0 100%)",
  business: "polygon(79% 42%,100% 42%,100% 100%,51.5% 100%,51.5% 72%)",
};

export function TelluFloatingAccent({ variant, className = "" }: { variant?: keyof typeof clips; className?: string }) {
  return <span aria-hidden="true" className={`tellu-accent ${className}`} data-brand-parallax>
    <svg viewBox="0 0 629 589" className="brand-float" focusable="false">
      <image href="/brand/tellu-logo.png" width="629" height="589" style={variant ? { clipPath: clips[variant] } : undefined} />
    </svg>
  </span>;
}
