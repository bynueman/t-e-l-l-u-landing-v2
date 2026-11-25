import Link from "next/link";
import Image from "next/image";
import { contactConfig } from "@/config/site";
import { Icon } from "@/components/ui/icon";
import { TelluMagneticWordmark } from "./tellu-magnetic-wordmark";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="site-footer scroll-mt-28 relative overflow-hidden bg-[#1b1d19] text-[#f5f4ea] pt-10 sm:pt-14 pb-6 border-t border-white/[0.08]">
      <div className="page-container relative z-10">
        {/* Area 1 — Direct Headline & Action Buttons (Compact & To The Point) */}
        <div className="mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div>
            <h2 className="display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Hubungi tim TELLU<span className="text-[#ee961e]">.</span>
            </h2>
          </div>

          {/* Contact Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Primary Action: Chat WhatsApp */}
            <a
              href={contactConfig.whatsapp.getDirectUrl(contactConfig.whatsapp.defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-white px-5 text-xs sm:text-sm font-bold text-[#1b1d19] shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff6ee] hover:shadow-lg hover:shadow-black/30"
            >
              <Icon name="whatsapp" size={16} className="text-[#25D366]" />
              <span>Chat WhatsApp</span>
            </a>

            {/* Kirim Email */}
            <a
              href={contactConfig.email.url}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.08]"
            >
              <Icon name="mail" size={14} className="text-white/80" />
              <span>Kirim Email</span>
            </a>

            {/* Instagram */}
            <a
              href={contactConfig.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.08]"
            >
              <Icon name="instagram" size={14} className="text-white/80" />
              <span>Instagram</span>
            </a>
          </div>
        </div>

        {/* Areas 2, 3, 4 — Brand Information & Navigation (Compact Grid) */}
        <div className="grid gap-8 grid-cols-2 md:grid-cols-12 mb-6 sm:mb-8">
          {/* Brand Information */}
          <div className="col-span-2 md:col-span-6 flex flex-col justify-between gap-3">
            <Link href="/" aria-label="TELLU, halaman utama" className="inline-flex items-center gap-2.5 w-fit">
              <Image src="/brand/tellu-logo.png" alt="" width={629} height={589} sizes="32px" className="h-8 w-8 object-contain" priority />
              <span className="display text-2xl font-bold tracking-[-.08em] text-white">TELLU</span>
            </Link>

            <a
              href={contactConfig.location.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-xs text-[#c8ccc0] hover:text-white transition-colors w-fit"
            >
              <Icon name="map-pin" size={13} className="text-[#ee961e] transition-transform group-hover:scale-110" />
              <span>{contactConfig.location.label}</span>
            </a>
          </div>

          {/* Layanan Column */}
          <div className="col-span-1 md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#afb3a5] mb-3">
              Layanan
            </h4>
            <nav aria-label="Navigasi Layanan Footer" className="flex flex-col gap-2 text-xs sm:text-sm font-medium">
              <Link href="/technology" className="text-white/80 hover:text-white transition-colors">
                Technology
              </Link>
              <Link href="/creative" className="text-white/80 hover:text-white transition-colors">
                Creative
              </Link>
              <Link href="/business" className="text-white/80 hover:text-white transition-colors">
                Business
              </Link>
            </nav>
          </div>

          {/* Jelajahi TELLU Column */}
          <div className="col-span-1 md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#afb3a5] mb-3">
              Jelajahi TELLU
            </h4>
            <nav aria-label="Navigasi Eksplorasi Footer" className="flex flex-col gap-2 text-xs sm:text-sm font-medium">
              <Link href="/#tentang" className="text-white/80 hover:text-white transition-colors">
                Tentang Kami
              </Link>
              <Link href="/technology#selected-work" className="text-white/80 hover:text-white transition-colors">
                Portfolio
              </Link>
              <Link href="/blog" className="text-white/80 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/technology#packages" className="text-white/80 hover:text-white transition-colors">
                Paket Website
              </Link>
            </nav>
          </div>
        </div>

        {/* Area 5 — Signature Interactive TELLU Magnetic Wordmark (Proportional & Compact) */}
        <div className="border-t border-white/[0.08] pt-3 sm:pt-4">
          <TelluMagneticWordmark />
        </div>

        {/* Area 6 — Bottom Legal and Copyright Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4 text-xs text-[#afb3a5]">
          <span>© {currentYear} TELLU. All rights reserved.</span>
          <span className="font-medium tracking-wide text-[#afb3a5]">
            Technology · Creative · Business
          </span>
        </div>
      </div>
    </footer>
  );
}
