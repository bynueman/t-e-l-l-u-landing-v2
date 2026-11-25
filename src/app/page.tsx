import type { Metadata } from "next";
import Link from "next/link";
import { metadata as pageMetadata, home as copy } from "@/i18n/dictionaries/id";
import { Hero } from "@/components/home/hero";
import { EcosystemOverview } from "@/components/home/ecosystem-overview";
import { HomeMotion } from "@/components/home/home-motion";
import { FeaturedWork } from "@/components/home/featured-work";
import { Icon } from "@/components/ui/icon";
import { TelluFloatingAccent } from "@/components/layout/tellu-floating-accent";

export const metadata: Metadata = {
  title: { absolute: pageMetadata.title },
  description: pageMetadata.description,
  openGraph: {
    title: pageMetadata.title,
    description: pageMetadata.description,
    type: "website",
  },
};

export default function Home() {
  return (
    <main id="top">
      <HomeMotion>
        <Hero />
        <section id="tentang" className="home-intro page-container">
          <TelluFloatingAccent tone="subtle" className="about-accent" />
          <h2 className="display" data-reveal>{copy.aboutTitle}</h2>
          <p className="intro-copy" data-reveal>{copy.aboutText}</p>
        </section>
        <EcosystemOverview />
        <section id="work" className="home-work">
          <div className="page-container section-space">
            <div className="work-heading" data-reveal><h2 className="display">{copy.workTitle}</h2><Link href="/technology#selected-work" className="text-link inline-flex items-center gap-1.5">{copy.workCta}<Icon name="arrow-right" size={15} /></Link></div>
            <p className="work-intro">{copy.workText}</p>
            <FeaturedWork />
            <p className="work-provenance">{copy.workProvenance}</p>
          </div>
        </section>
        <section id="services" className="home-capabilities">
          <div className="page-container capabilities-inner"><h2 className="display" data-reveal>{copy.servicesTitle}</h2><div data-stagger className="capability-links">{[["Technology", "/technology"], ["Creative", "/creative"], ["Business", "/business"]].map(([name, href], index) => <Link key={href} href={href}><Icon name={(["browser", "palette", "app"] as const)[index]} />{name}</Link>)}</div></div>
        </section>
        <section id="faq" className="home-faq page-container section-space">
          <div data-reveal><h2 className="display">{copy.faqTitle}</h2></div>
          <div data-stagger className="faq-list">{copy.faqs.map(([question, answer], index) => <details key={question}><summary><span className="faq-number">0{index + 1}</span>{question}<span className="faq-toggle" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>
      </HomeMotion>
    </main>
  );
}
