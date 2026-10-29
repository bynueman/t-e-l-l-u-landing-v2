import Image from "next/image";

export function BrandSymbol({ className = "" }: { className?: string }) {
  return <Image src="/brand/tellu-logo.png" alt="" width={629} height={589} sizes="24px" className={`brand-symbol ${className}`} />;
}

export function BrandMark({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-mark ${className}`} />;
}
