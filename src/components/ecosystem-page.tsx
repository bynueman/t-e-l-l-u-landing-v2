import Link from "next/link";
import { IconBadge, type IconName, type IconTone } from "@/components/ui/icon";
import { HomeMotion } from "@/components/home/home-motion";
import { TelluFloatingAccent } from "@/components/layout/tellu-floating-accent";

type Ecosystem = {
  name: string;
  eyebrow: string;
  introduction: string;
  accent: string;
  tone: IconTone;
  sections: { id: string; title: string; description: string; icon: IconName }[];
};

export function EcosystemPage({ ecosystem }: { ecosystem: Ecosystem }) {
  return (
    <main><HomeMotion>
      <section className={`relative isolate overflow-hidden border-b border-line pt-40 ecosystem-${ecosystem.name.toLowerCase()}`}>
        <div className="page-container grid min-h-[34rem] items-center gap-12 pb-20 lg:grid-cols-[1fr_.8fr]">
          <div data-reveal><p className="eyebrow mb-6 text-muted">TELLU / {ecosystem.eyebrow}</p><h1 className="display text-[clamp(4.5rem,10vw,9rem)] font-bold">{ecosystem.name}<span className="text-[var(--accent-end)]">.</span></h1><p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">{ecosystem.introduction}</p><div className="mt-9 flex flex-wrap gap-3"><Link href="#explore" className="button-primary">Explore this ecosystem ↘</Link><Link href="/#ekosistem" className="button-outline">All ecosystems ↗</Link></div></div>
          <div className="ecosystem-art"><TelluFloatingAccent className="ecosystem-accent" /><span className="ecosystem-art-label">{ecosystem.accent}</span></div>
        </div>
      </section>
      <section id="explore" className="page-container section-space"><p className="eyebrow mb-6 text-muted">Focus areas</p><h2 data-reveal className="display mb-12 text-4xl font-bold sm:text-6xl">Where ideas take shape.</h2><div data-stagger data-single={ecosystem.sections.length === 1} className="ecosystem-focus grid gap-5 md:grid-cols-2">{ecosystem.sections.map((section, index) => <article key={section.id} id={section.id} className={`ecosystem-${ecosystem.name.toLowerCase()} rounded-[2rem] border border-line bg-white p-8 sm:p-10`}><div className="mb-8"><IconBadge name={section.icon} tone={ecosystem.tone} /></div><span className="eyebrow text-muted">0{index + 1} / {ecosystem.name}</span><h3 className="display mt-5 text-3xl font-bold sm:text-4xl">{section.title}</h3><p className="mt-5 max-w-md leading-relaxed text-muted">{section.description}</p></article>)}</div></section>
      <section className="bg-foreground py-20 text-white sm:py-28"><div data-reveal className="page-container flex flex-wrap items-end justify-between gap-8"><div><p className="eyebrow mb-5 text-white/55">Keep exploring</p><h2 className="display max-w-2xl text-4xl font-bold sm:text-6xl">Find your next direction.</h2><p className="mt-5 max-w-xl text-white/65">Gunakan pencarian TELLU untuk menemukan jalur yang paling relevan.</p></div><Link href="/#hero-search" className="inline-flex min-h-14 items-center rounded-full bg-white px-6 font-bold text-foreground hover:bg-[var(--creative-start)]">Start with Smart Search ↗</Link></div></section>
    </HomeMotion></main>
  );
}
