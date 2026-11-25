import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { HomeMotion } from "@/components/home/home-motion";
import { TechnologyHero } from "@/components/technology/technology-hero";
import { TechnologyStack } from "@/components/technology/technology-stack";
import { TechnologyServices } from "@/components/technology/technology-services";
import { TechnologyCapabilities } from "@/components/technology/technology-capabilities";
import { PortfolioExplorer } from "@/components/technology/portfolio-explorer";
import { TechnologyPricingSection } from "@/components/technology/technology-pricing-section";
import { WebsiteEstimator } from "@/components/technology/website-estimator";
import { TechnologyProcess } from "@/components/technology/technology-process";
import { TechnologyFaq } from "@/components/technology/technology-faq";
import { TechnologyCta } from "@/components/technology/technology-cta";
import { technologyProjects } from "@/lib/technology-portfolio";
import { technology as c } from "@/i18n/dictionaries/id";
import "./technology.css";

export const metadata: Metadata = {
  title: { absolute: c.metadata.title },
  description: c.metadata.description,
  openGraph: {
    title: c.metadata.title,
    description: c.metadata.description,
    type: "website",
  },
};

export default function Technology() {
  return (
    <main className="tech-page ecosystem-technology">
      <HomeMotion>
        {/* 01. Technology Hero with Automatic Portfolio Slideshow */}
        <TechnologyHero
          title={c.title}
          description={c.description}
        />

        {/* 02. Technology Stack Marquee */}
        <TechnologyStack title={c.stackTitle} />

        {/* 03. Services Overview (Bento Grid: Pembuatan Website Baru, Revamp, Domain & Hosting, Perawatan) */}
        <TechnologyServices
          title={c.servicesTitle}
          description="Pilih layanan sesuai kondisi website bisnismu saat ini, mulai dari membuat dari nol hingga merawat website yang sudah berjalan."
        />

        {/* 04. Website Development Capabilities (Types & Practical Benefits) */}
        <TechnologyCapabilities title={c.capabilitiesTitle} />

        {/* 05. Selected Projects / Live Portfolio */}
        <section id="selected-work" className="tech-work section-space" aria-labelledby="tech-work-heading">
          <div className="page-container">
            <div data-reveal className="tech-section-heading">
              <h2 id="tech-work-heading" className="display">{c.workTitle}</h2>
              <p>{c.workDescription}</p>
            </div>

            <PortfolioExplorer />

            <div className="tech-project-directory">
              <h3>{c.directory}</h3>
              <div data-stagger className="tech-project-grid">
                {technologyProjects.map((project) => (
                  <a
                    className="tech-project-card"
                    key={project.id}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={project.image}
                      alt={`Tangkapan layar ${project.name}`}
                      width={480}
                      height={270}
                      sizes="(max-width: 540px) 90vw, (max-width: 900px) 43vw, 21vw"
                    />
                    <div>
                      <p className="eyebrow">{project.category}</p>
                      <h4>
                        {project.name}
                        <Icon name="external" size={13} className="inline ml-1 text-muted group-hover:text-foreground" />
                      </h4>
                      <p>{project.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 06. Website Pricing & Package Comparison */}
        <TechnologyPricingSection title={c.packagesTitle} />

        {/* 07. Interactive Website Cost Estimator */}
        <WebsiteEstimator title={c.estimatorTitle} />

        {/* 08. Development Process */}
        <TechnologyProcess title={c.processTitle} />

        {/* 09. Frequently Asked Questions */}
        <TechnologyFaq title={c.faqTitle} />

        {/* 10. Final Consultation CTA */}
        <TechnologyCta
          title={c.contactTitle}
          description={c.contactDescription}
        />
      </HomeMotion>
    </main>
  );
}
