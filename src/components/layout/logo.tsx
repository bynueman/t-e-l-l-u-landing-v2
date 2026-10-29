import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="TELLU, halaman utama" className="inline-flex items-center gap-2.5">
      <Image src="/brand/tellu-logo.png" alt="" width={629} height={589} sizes="36px" className="h-9 w-9 object-contain" priority />
      <span className="display text-[1.65rem] font-bold tracking-[-.08em]">TELLU</span>
    </Link>
  );
}
