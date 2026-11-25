import Link from "next/link";
import { TelluFloatingAccent } from "@/components/layout/tellu-floating-accent";
import { Icon } from "@/components/ui/icon";
import { contactConfig } from "@/config/site";

interface TechnologyCtaProps {
  title?: string;
  description?: string;
}

export function TechnologyCta({
  title = "Siap mendiskusikan website bisnismu?",
  description = "Konsultasikan kebutuhan website lewat WhatsApp, hitung simulasi biaya, atau cari layanan yang kamu butuhkan.",
}: TechnologyCtaProps) {
  const whatsappUrl = contactConfig.whatsapp.getDirectUrl(
    "Halo tim TELLU Technology, saya ingin berkonsultasi mengenai kebutuhan website bisnis saya."
  );

  return (
    <section id="tech-contact" className="tech-contact-section section-space" aria-labelledby="tech-cta-heading">
      <div className="page-container relative z-10" data-reveal>
        <TelluFloatingAccent tone="charcoal" className="tech-contact-accent" />

        <h2 id="tech-cta-heading" className="display tech-contact-title">
          {title}
        </h2>

        <p className="tech-contact-copy">
          {description}
        </p>

        <div className="tech-contact-buttons">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-primary inline-flex items-center gap-2"
          >
            <Icon name="whatsapp" size={16} />
            <span>Chat WhatsApp</span>
          </a>

          <a href="#estimator" className="button-outline inline-flex items-center gap-2">
            <span>Hitung Estimasi Biaya</span>
            <Icon name="calculator" size={16} />
          </a>

          <Link href="/#hero-search" className="button-ghost inline-flex items-center gap-2">
            <span>Cari Layanan</span>
            <Icon name="search" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
