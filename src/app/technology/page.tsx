import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HomeMotion } from "@/components/home/home-motion";
import { PortfolioExplorer } from "@/components/technology/portfolio-explorer";
import { technologyProjects } from "@/lib/technology-portfolio";
import "./technology.css";
import { technology as c } from "@/i18n/dictionaries/id";
import { Icon, IconBadge } from "@/components/ui/icon";

export const metadata: Metadata = c.metadata;

export default function Technology() {
  const { services, packages, process, faqs } = c;
  return <main className="tech-page ecosystem-technology"><HomeMotion>
    <section className="tech-hero page-container"><div data-reveal><p className="eyebrow">TELLU / TECHNOLOGY</p><h1 className="display">{c.title}</h1><div className="tech-hero-bottom"><p>{c.description}</p><div className="flex flex-wrap gap-3"><Link href="#web-development" className="button-primary">{c.explore} ↘</Link><Link href="#selected-work" className="button-outline">{c.work} ↗</Link></div></div></div><div className="tech-hero-index" aria-hidden="true"><span>TELLU / TECHNOLOGY</span><span>TECHNOLOGY BY TELLU</span></div></section>
    <nav className="tech-section-nav page-container" aria-label={c.navLabel}>{c.nav.map(([label,id]) => <a key={id} href={`#${id}`}>{label} ↘</a>)}</nav>
    <section id="explore" className="page-container section-space"><div data-reveal className="tech-section-heading"><p className="eyebrow">{c.labels[0]}</p><h2 className="display">{c.servicesTitle}</h2></div>{services.map(([id,title,text,items],index) => <article data-reveal id={id} key={id} className="tech-service"><IconBadge name={(["browser", "refresh", "globe", "wrench"] as const)[index]} tone="technology" /><div><h3>{title}</h3><p>{text}</p><a href="#contact" className="text-link mt-5">{c.discuss}<Icon name="arrow-right" /></a></div><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</section>
    <section id="selected-work" className="tech-work section-space"><div className="page-container"><div data-reveal className="tech-section-heading"><p className="eyebrow">{c.labels[1]}</p><h2 className="display">{c.workTitle}</h2><p>{c.workDescription}</p></div><PortfolioExplorer /><div className="tech-project-directory"><h3>{c.directory}</h3><div className="tech-project-grid">{technologyProjects.map(project => <a className="tech-project-card" key={project.id} href={project.url} target="_blank" rel="noopener noreferrer"><Image src={project.image} alt="" width={480} height={270} sizes="(max-width: 540px) 90vw, (max-width: 900px) 43vw, 21vw" /><div><p className="eyebrow">{project.category}</p><h4>{project.name}<span aria-hidden="true">↗</span></h4><p>{project.description}</p></div></a>)}</div></div></div></section>
    <section id="packages" className="page-container section-space"><div data-reveal className="tech-section-heading"><p className="eyebrow">{c.labels[2]}</p><h2 className="display">{c.packagesTitle}</h2><p>{c.packagesDescription}</p></div><div className="tech-packages">{packages.map(([name,subtitle,text],index) => <article data-reveal key={name}><span className="eyebrow">0{index+1} / WEBSITE</span><h3>{name}</h3><p className="font-semibold">{subtitle}</p><p>{text}</p><Link href="#contact" className="text-link">{c.quote} ↗</Link></article>)}</div></section>
    <section id="process" className="page-container section-space border-t border-line"><div data-reveal className="tech-section-heading"><p className="eyebrow">{c.labels[3]}</p><h2 className="display">{c.processTitle}</h2></div><ol className="tech-process">{process.map(([title,text],index) => <li data-reveal key={title}><IconBadge name={(["message", "clipboard", "code", "check"] as const)[index]} /><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
    <section id="faq" className="page-container section-space border-t border-line tech-faq"><div data-reveal><p className="eyebrow">{c.labels[4]}</p><h2 className="display">{c.faqTitle}</h2></div><div>{faqs.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section id="contact" className="tech-contact section-space"><div data-reveal className="page-container"><p className="eyebrow">{c.labels[5]}</p><h2 className="display">{c.contactTitle}</h2><p>{c.contactDescription}</p><Link href="/#hero-search" className="button-primary">{c.start} ↗</Link></div></section>
  </HomeMotion></main>;
}
