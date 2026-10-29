import Link from "next/link";
import { hero as copy } from "@/i18n/dictionaries/id";
import { SmartSearch } from "@/components/search/smart-search";
import { BrandMark, BrandModule } from "@/components/layout/brand-mark";
import { HeroPixelGrid } from "./hero-pixel-grid";

export function Hero() {
  return (
    <section id="hero" aria-label={copy.label} className="hero-section">
      <HeroPixelGrid />
      <div aria-hidden="true" className="hero-ornaments">
        <BrandMark className="hero-ornament ornament-one" />
        <BrandModule className="hero-ornament ornament-two" />
        <BrandModule className="hero-ornament ornament-three" />
      </div>
      <div className="page-container hero-content">
        <h1 className="hero-title display"><span>{copy.title}</span></h1>
        <p className="hero-copy">{copy.description}</p>
        <div className="hero-search-zone"><SmartSearch /></div>
        <div className="hero-bottom">
          <p>{copy.signature}</p>
          <Link href="#tentang" className="hero-scroll-cue">{copy.scroll}<span aria-hidden="true">↓</span></Link>
        </div>
      </div>
    </section>
  );
}
