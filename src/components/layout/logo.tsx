"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Logo() {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Link
      href="/"
      aria-label="TELLU, kembali ke beranda"
      onClick={handleClick}
      className="relative z-20 inline-flex items-center gap-2.5 shrink-0 cursor-pointer select-none transition-transform duration-200 hover:scale-[1.02]"
    >
      <Image src="/brand/tellu-logo.png" alt="TELLU Logo" width={629} height={589} sizes="36px" className="h-9 w-9 object-contain" priority />
      <span className="display text-[1.65rem] font-bold tracking-[-.08em]">TELLU</span>
    </Link>
  );
}
