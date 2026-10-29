import Link from "next/link";
import { hero as copy } from "@/i18n/dictionaries/id";
import { SmartSearch } from "@/components/search/smart-search";
import { BrandMark } from "@/components/layout/brand-mark";
import { HeroPixelGrid } from "./hero-pixel-grid";
import { TypingHeadline } from "./typing-headline";
import { Icon } from "@/components/ui/icon";

export function Hero() {
  return (
    <section id="hero" aria-label={copy.label} className="hero-section">
      <HeroPixelGrid />
      <div aria-hidden="true" className="hero-ornaments">
        <BrandMark className="hero-ornament ornament-one" />
      </div>
      <div className="page-container hero-content">
        <TypingHeadline messages={[copy.title, ...copy.typingTitles]} pauseLabel={copy.pause} playLabel={copy.play} />
        <p className="hero-copy">{copy.description}</p>
        <div className="hero-search-zone"><SmartSearch /></div>
        <div className="hero-bottom">
          <p>{copy.signature}</p>
          <Link href="#tentang" className="hero-scroll-cue">{copy.scroll}<span aria-hidden="true"><Icon name="arrow-down" /></span></Link>
        </div>
      </div>
    </section>
  );
}
