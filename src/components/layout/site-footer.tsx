import Link from "next/link";
import { shared as copy } from "@/i18n/dictionaries/id";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1fr_auto]">
        <div><Logo /><p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{copy.description}</p></div>
        <nav aria-label={copy.footer} className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm font-semibold">
          <Link href="/technology">Technology</Link><Link href="/creative">Creative</Link><Link href="/business">Business</Link><Link href="/#tentang">{copy.about}</Link><Link href="/#contact">{copy.contact}</Link>
        </nav>
      </div>
      <div className="page-container flex flex-wrap justify-between gap-3 border-t border-line py-5 text-xs text-muted"><span>© {new Date().getFullYear()} TELLU</span><span>{copy.tagline}</span></div>
    </footer>
  );
}
