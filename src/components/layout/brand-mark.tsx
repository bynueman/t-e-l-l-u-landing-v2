// Crop the authentic upper module; the mask preserves its original rounded silhouette.
export function BrandModule({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-module ${className}`} />;
}

export function BrandMark({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-mark ${className}`} />;
}
