"use client";

import Link from "next/link";
import { hero, search as copy, searchLabels } from "@/i18n/dictionaries/id";
import { useRouter } from "next/navigation";
import { type FormEvent, type RefObject, useEffect, useRef, useState } from "react";
import {
  classifyIntentEcosystem,
  fallbackDestinations,
  matchSearch,
  shouldSubmitPrompt,
} from "@/lib/search-intents";
import { useSearchQuery } from "./search-provider";
import { Icon } from "@/components/ui/icon";

export function SmartSearch({
  compact = false,
  inputRef,
  onNavigate,
}: {
  compact?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onNavigate?: () => void;
}) {
  const { query, setQuery } = useSearchQuery();
  const router = useRouter();
  const composing = useRef(false);
  const heroInput = useRef<HTMLTextAreaElement>(null);
  const [choices, setChoices] = useState<{ label: string; href: string }[] | null>(null);
  const [message, setMessage] = useState("");
  const [accent, setAccent] = useState("");

  useEffect(() => {
    const field = heroInput.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${Math.min(field.scrollHeight, 144)}px`;
  }, [query]);

  const detectedIntent = query ? classifyIntentEcosystem(query) : null;
  const currentAccent = accent || (detectedIntent ?? "");

  function changeQuery(value: string) {
    setQuery(value);
    setChoices(null);
    setMessage("");
    setAccent("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = matchSearch(query);
    if (result.kind === "empty") {
      setMessage(copy.empty);
      setChoices(null);
      return;
    }
    if (result.kind === "direct") {
      const href = result.choices[0].href;
      setMessage(copy.matched);
      setChoices(null);
      const matched = href.startsWith("/technology")
        ? "technology"
        : href.startsWith("/creative")
        ? "creative"
        : href.startsWith("/business")
        ? "business"
        : "";
      setAccent(matched);
      onNavigate?.();
      router.push(href);
      return;
    }
    setAccent("");
    setMessage(
      result.kind === "choices"
        ? copy.choices
        : copy.unknown
    );
    setChoices([...result.choices]);
  }

  return (
    <div className={compact ? "" : "prompt-wrap"} data-match={currentAccent || undefined} data-expanded={!compact && (query.includes("\n") || query.length > 90) || undefined}>
      <form onSubmit={submit} role="search" className={compact ? "flex items-center gap-2 rounded-full border border-line bg-white p-1.5" : "prompt-panel"}>
        {compact ? (
          <>
            <label htmlFor="floating-search" className="sr-only">{copy.label}</label>
            <input ref={inputRef} id="floating-search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder={copy.placeholder} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted" />
            <button type="submit" className="button-primary shrink-0 !min-h-10 !px-4" aria-label={copy.submit}><Icon name="search" /></button>
          </>
        ) : (
          <>
            <label htmlFor="hero-search" className="sr-only">{copy.label}</label>
            <textarea ref={heroInput} id="hero-search" rows={2} value={query} onChange={(event) => changeQuery(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={(event) => {
              if (shouldSubmitPrompt({ key: event.key, shiftKey: event.shiftKey, isComposing: composing.current || event.nativeEvent.isComposing, keyCode: event.nativeEvent.keyCode })) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }} placeholder={copy.placeholder} className="prompt-input" />
            <span className="prompt-hint"><svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M12 3v6H3m0 0 3-3M3 9l3 3" /></svg>{copy.hint}</span>
            <button type="submit" className="prompt-submit"><span>{copy.submit}</span><Icon name="search" /></button>
          </>
        )}
      </form>
      {!compact && <div className="hero-examples">{hero.examples.map(example => <button type="button" key={example} onClick={() => { changeQuery(example); heroInput.current?.focus(); }} className="prompt-choice">{example}</button>)}</div>}
      {message && <p role="status" className="mt-4 text-sm text-muted">{message}</p>}
      {choices && <div className="mt-3 flex flex-wrap gap-2">{choices.map((choice) => <Link key={choice.href} href={choice.href} onClick={onNavigate} className={compact ? "rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-foreground" : "prompt-choice"}>{searchLabels[choice.href as keyof typeof searchLabels] ?? choice.label}<Icon name="arrow-right" /></Link>)}</div>}
      {compact && !choices && <div className="mt-3 flex flex-wrap gap-2">{fallbackDestinations.map((destination) => <Link key={destination.href} href={destination.href} onClick={onNavigate} className="text-xs font-semibold underline underline-offset-4">{destination.label}</Link>)}</div>}
    </div>
  );
}
