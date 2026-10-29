"use client";

import Image from "next/image";
import { portfolio as copy } from "@/i18n/dictionaries/id";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { technologyProjects } from "@/lib/technology-portfolio";
import { Icon } from "@/components/ui/icon";

export function PortfolioExplorer() {
  return <Suspense fallback={<ProjectPreview />}><ProjectFromQuery /></Suspense>;
}

function ProjectFromQuery() {
  const query = useSearchParams().get("project");
  return <ProjectPreview key={query} initialSelected={query ?? undefined} />;
}

function ProjectPreview({ initialSelected = technologyProjects[0].id }: { initialSelected?: string }) {
  const [selected, setSelected] = useState(() => technologyProjects.find(item => item.id === initialSelected)?.id ?? technologyProjects[0].id);
  const [live, setLive] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [revision, setRevision] = useState(0);
  // Resolve IDs against the fixed registry; arbitrary URLs never enter the iframe.
  const project = technologyProjects.find((item) => item.id === selected) ?? technologyProjects[0];
  const pending = project.previewStatus === "pending-server-permission";
  const canEmbed = project.embeddable && !pending;
  return <div className="tech-explorer">
    <div className="tech-selector" role="group" aria-label={copy.select}>
      {technologyProjects.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); setLive(false); }}><span>0{index + 1}</span>{item.name}<span aria-hidden="true">{selected === item.id && <Icon name="check" />}</span></button>)}
    </div>
    <div className="min-w-0">
      <div className="tech-project-info" aria-live="polite"><p className="eyebrow text-muted">{project.category}</p><h3>{project.name}</h3><p>{project.description}</p></div>
      <div className="tech-preview-tools"><div role="group" aria-label={copy.width}><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>{copy.desktop}</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>{copy.mobile}</button></div><a href={project.url} target="_blank" rel="noopener noreferrer" className="text-link">{copy.original}<Icon name="external" /></a></div>
      <div className="tech-browser" data-mobile={mobile}>
        <div className="tech-address"><span className="browser-lights" aria-hidden="true"><i /><i /><i /></span><span className="browser-domain">{new URL(project.url).hostname}</span>{live && <button type="button" onClick={() => setRevision((value) => value + 1)}>{copy.reload}</button>}</div>
        {live && canEmbed ? <iframe key={`${project.id}-${revision}`} src={project.previewUrl ?? project.url} title={`${copy.preview}: ${project.name}`} loading="lazy" referrerPolicy="no-referrer" sandbox={project.id === "intrax" ? "allow-scripts allow-same-origin" : "allow-scripts allow-same-origin allow-forms allow-popups"} /> : <div className="tech-cover"><Image src={project.image} alt={`${copy.screenshot}: ${project.name}`} width={1600} height={1000} sizes="(max-width: 768px) 90vw, 65vw" /><div><p className="eyebrow">{copy.image}</p>{canEmbed ? <button type="button" className="button-primary" onClick={() => setLive(true)}>{copy.explore}</button> : <><p>{copy.unavailable}</p><a className="button-primary" href={project.url} target="_blank" rel="noopener noreferrer">{copy.openProject.replace("{name}", project.name)}<Icon name="external" /></a></>}</div></div>}
      </div>
      <p className="tech-preview-note" role="status">{pending ? copy.pending : live ? copy.requested : canEmbed ? copy.idle : `${copy.image}.`} {copy.widthNote}</p>
      <p className="tech-preview-note">{copy.recovery}<a href={project.url} target="_blank" rel="noopener noreferrer" className="text-link">{copy.original}</a>{live && <button type="button" onClick={() => setLive(false)} className="text-link ml-4">{copy.back}</button>}</p>
    </div>
  </div>;
}
