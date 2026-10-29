import type { Metadata } from "next";
import Link from "next/link";
import { metadata as pageMetadata, home as copy } from "@/i18n/dictionaries/id";
import { Hero } from "@/components/home/hero";
import { EcosystemOverview } from "@/components/home/ecosystem-overview";
import { HomeMotion } from "@/components/home/home-motion";
import { FeaturedWork } from "@/components/home/featured-work";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = pageMetadata;

export default function Home() {
  return (
    <main id="top">
      <HomeMotion>
        <Hero />
        <section id="tentang" className="home-intro page-container">
          <p className="eyebrow" data-reveal>{copy.aboutLabel}</p>
          <h2 className="display" data-reveal>{copy.aboutTitle}</h2>
          <p className="intro-copy" data-reveal>{copy.aboutText}</p>
        </section>
        <EcosystemOverview />
        <section id="work" className="home-work">
          <div className="page-container section-space">
            <div className="work-heading" data-reveal><div><p className="eyebrow">{copy.workLabel}</p><h2 className="display">{copy.workTitle}</h2></div><Link href="/technology#selected-work" className="text-link">{copy.workCta}<span aria-hidden="true">↗</span></Link></div>
            <p className="work-intro">{copy.workText}</p>
            <FeaturedWork />
            <p className="work-provenance">{copy.workProvenance}</p>
          </div>
        </section>
        <section id="services" className="home-capabilities">
          <div className="page-container capabilities-inner"><p className="eyebrow">{copy.servicesLabel}</p><h2 className="display" data-reveal>{copy.servicesTitle}</h2><div className="capability-links">{[["Technology", "/technology"], ["Creative", "/creative"], ["Business", "/business"]].map(([name, href], index) => <Link key={href} href={href}><Icon name={(["browser", "palette", "app"] as const)[index]} />{name}</Link>)}</div></div>
        </section>
        <section id="faq" className="home-faq page-container section-space">
          <div data-reveal><p className="eyebrow">{copy.faqLabel}</p><h2 className="display">{copy.faqTitle}</h2></div>
          <div className="faq-list">{copy.faqs.map(([question, answer], index) => <details key={question}><summary><span className="faq-number">0{index + 1}</span>{question}<span className="faq-toggle" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>
        <section id="contact" className="home-contact">
          <div className="page-container" data-reveal><p className="eyebrow">{copy.contactLabel}</p><h2 className="display">{copy.contactTitle}</h2><p className="contact-copy">{copy.contactText}</p><Link href="#hero-search" className="button-primary">{copy.contactCta}<span aria-hidden="true">↗</span></Link></div>
          <div aria-hidden="true" className="contact-wordmark">TELLU</div>
        </section>
      </HomeMotion>
    </main>
  );
}
