import Link from "next/link";
import { Icon, IconBadge, type IconName, type IconTone } from "@/components/ui/icon";
import { HomeMotion } from "@/components/home/home-motion";
import { TelluFloatingAccent } from "@/components/layout/tellu-floating-accent";
import { contactConfig } from "@/config/site";

type EcosystemSection = {
  id: string;
  title: string;
  description: string;
  points?: readonly string[];
  icon: IconName;
};

type Ecosystem = {
  name: string;
  introduction: string;
  sectionHeading: string;
  sectionSubheading: string;
  ctaHeading: string;
  ctaDescription: string;
  whatsappMessage: string;
  tone: IconTone;
  sections: readonly EcosystemSection[];
};

export function EcosystemPage({ ecosystem }: { ecosystem: Ecosystem }) {
  const toneClass = `ecosystem-${ecosystem.name.toLowerCase()}`;
  const whatsappUrl = contactConfig.whatsapp.getDirectUrl(ecosystem.whatsappMessage);

  return (
    <main className={toneClass}>
      <HomeMotion>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-line pt-32 sm:pt-40 pb-16 sm:pb-24">
          <div className="page-container grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
            <div data-reveal>
              <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-muted">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Beranda
                </Link>
                <span aria-hidden="true">/</span>
                <span className="text-foreground">{ecosystem.name}</span>
              </nav>

              <h1 className="display text-[clamp(3.4rem,9vw,7.5rem)] font-bold tracking-tight">
                {ecosystem.name}
                <span className="text-[var(--accent-end)]">.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted text-pretty">
                {ecosystem.introduction}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-primary inline-flex items-center gap-2 text-sm"
                >
                  <Icon name="whatsapp" size={17} />
                  <span>Konsultasi {ecosystem.name}</span>
                </a>
                <a href="#explore" className="button-outline inline-flex items-center gap-2 text-sm">
                  <span>Lihat Ruang Lingkup</span>
                  <Icon name="arrow-down" size={16} />
                </a>
              </div>
            </div>

            {/* Editorial Visual & Quick Index Panel */}
            <div className="relative rounded-3xl border border-line bg-white p-7 sm:p-9 shadow-sm" data-reveal>
              <div className="h-1.5 w-16 rounded-full accent-bar mb-6" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Fokus Ekosistem {ecosystem.name}</h2>
                  <p className="text-xs text-muted mt-1">
                    Pilih area yang sesuai dengan kebutuhan bisnismu saat ini.
                  </p>
                </div>
                <TelluFloatingAccent tone="charcoal" className="relative !static w-11 shrink-0" />
              </div>

              <ul className="divide-y divide-line border-t border-line">
                {ecosystem.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="group flex items-center justify-between gap-3 py-3.5 text-sm font-semibold text-foreground hover:text-muted transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Icon name={section.icon} size={16} className="text-muted" />
                        <span>{section.title}</span>
                      </span>
                      <Icon name="arrow-right" size={15} className="text-muted transition-transform group-hover:translate-x-1" />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
                <span>Ekosistem TELLU lainnya</span>
                <Link href="/#ekosistem" className="font-semibold text-foreground hover:underline underline-offset-4">
                  Lihat semua layanan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Focus Areas */}
        <section id="explore" className="page-container section-space" aria-labelledby="ecosystem-focus-heading">
          <div data-reveal className="max-w-2xl mb-12">
            <h2 id="ecosystem-focus-heading" className="display text-3xl sm:text-5xl font-bold leading-tight">
              {ecosystem.sectionHeading}
            </h2>
            <p className="mt-4 text-base text-muted leading-relaxed text-pretty">
              {ecosystem.sectionSubheading}
            </p>
          </div>

          <div
            data-stagger
            data-single={ecosystem.sections.length === 1}
            className="ecosystem-focus grid gap-6 md:grid-cols-2"
          >
            {ecosystem.sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="rounded-3xl border border-line bg-white p-7 sm:p-10 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <IconBadge name={section.icon} tone={ecosystem.tone} />
                    <div className="h-1 w-10 rounded-full accent-bar" aria-hidden="true" />
                  </div>
                  <h3 className="display text-2xl sm:text-3xl font-bold">{section.title}</h3>
                  <p className="mt-4 max-w-[65ch] text-sm sm:text-base leading-relaxed text-muted text-pretty">
                    {section.description}
                  </p>

                  {section.points && section.points.length > 0 && (
                    <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm text-foreground">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5">
                          <Icon name="check" size={15} className="mt-0.5 shrink-0 text-muted" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-8 pt-5 border-t border-line">
                  <a
                    href={contactConfig.whatsapp.getDirectUrl(
                      `Halo TELLU, saya ingin berkonsultasi mengenai layanan ${section.title} (${ecosystem.name}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link text-sm inline-flex items-center gap-1.5"
                  >
                    <span>Diskusikan {section.title}</span>
                    <Icon name="arrow-right" size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom Direction CTA */}
        <section className="bg-foreground py-16 sm:py-24 text-white">
          <div data-reveal className="page-container flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="display text-3xl sm:text-5xl font-bold text-white leading-tight">
                {ecosystem.ctaHeading}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-white/75 leading-relaxed">
                {ecosystem.ctaDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-foreground transition-colors hover:bg-[#fff2e8]"
              >
                <Icon name="whatsapp" size={16} />
                <span>Hubungi Tim TELLU</span>
              </a>
              <Link
                href="/#hero-search"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Icon name="search" size={16} />
                <span>Cari Layanan Lain</span>
              </Link>
            </div>
          </div>
        </section>
      </HomeMotion>
    </main>
  );
}
