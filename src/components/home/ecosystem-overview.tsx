import Link from "next/link";
import { home as copy, technology } from "@/i18n/dictionaries/id";

const ecosystems = [
  { name: "Technology", href: "/technology", key: "technology", services: technology.services.map(service => [service[1], `/technology#${service[0]}`]) },
  { name: "Creative", href: "/creative", key: "creative", services: [[copy.serviceNames[2], "/creative#creative-agency"], [copy.serviceNames[3], "/creative#social-media"]] },
  { name: "Business", href: "/business", key: "business", services: [[copy.serviceNames[4], "/business#products"]] },
] as const;

export function EcosystemOverview() {
  return (
    <section id="ekosistem" aria-labelledby="ecosystem-heading" className="ecosystem-story page-container">
      <div className="story-heading" data-reveal>
        <p className="eyebrow">{copy.overviewLabel}</p>
        <h2 id="ecosystem-heading" className="display">{copy.overviewTitle}</h2>
      </div>
      <div className="story-layout">
        <div className="story-visual" aria-hidden="true">
          <svg className="story-symbol" viewBox="0 0 629 589">
            <g className="story-piece piece-technology"><image href="/brand/tellu-logo.png" width="629" height="589" style={{ clipPath: "polygon(11% 0, 89% 0, 89% 30%, 57% 66.3%, 43% 66.3%, 11% 30%)" }} /></g>
            <g className="story-piece piece-creative"><image href="/brand/tellu-logo.png" width="629" height="589" style={{ clipPath: "polygon(0 42%, 21% 42%, 48.5% 72%, 48.5% 100%, 0 100%)" }} /></g>
            <g className="story-piece piece-business"><image href="/brand/tellu-logo.png" width="629" height="589" style={{ clipPath: "polygon(79% 42%, 100% 42%, 100% 100%, 51.5% 100%, 51.5% 72%)" }} /></g>
          </svg>
          <span className="scene-label label-technology"><i />Technology<span>01</span></span>
          <span className="scene-label label-creative"><i />Creative<span>02</span></span>
          <span className="scene-label label-business"><i />Business<span>03</span></span>
          <span className="scene-caption">TELLU — {copy.sceneCaption}</span>
        </div>
        <div className="story-steps">
          {ecosystems.map((ecosystem, index) => (
            <article key={ecosystem.key} data-ecosystem={ecosystem.key} className={`story-step ecosystem-${ecosystem.key}`}>
              <div data-story-copy>
                <p className="story-number"><span>0{index + 1}</span><span>{copy.storyLabels[index]}</span></p>
                <h3 className="display"><Link href={ecosystem.href}>{ecosystem.name}<span aria-hidden="true">↗</span></Link></h3>
                <p className="story-description">{copy.overviewDescriptions[index]}</p>
                <ul className="story-services">{ecosystem.services.map(([label, href]) => <li key={href}><Link href={href}>{label}<span aria-hidden="true">↗</span></Link></li>)}</ul>
                <Link href={ecosystem.href} className="text-link story-link">{copy.explore} {ecosystem.name}<span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
