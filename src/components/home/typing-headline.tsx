"use client";

import { useEffect, useRef, useState } from "react";
import { nextTypingState, typingTiming, type TypingState } from "@/lib/hero-typing";
import { Icon } from "@/components/ui/icon";

export function TypingHeadline({ messages, pauseLabel, playLabel }: { messages: readonly string[]; pauseLabel: string; playLabel: string }) {
  const scope = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const syncPlayback = useRef<(() => void) | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = scope.current!;
    const value = text.current!;
    const hero = element.closest("#hero")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let state: TypingState = { index: 0, length: messages[0].length, phase: "hold" };
    let timer: number | undefined, deadline = 0, remaining: number = typingTiming.hold, visible = false;
    function stop() {
      if (timer !== undefined) {
        remaining = Math.max(0, deadline - performance.now());
        window.clearTimeout(timer); timer = undefined;
      }
    }
    function sync() {
      element.dataset.ready = reduced.matches ? "false" : "true";
      if (reduced.matches) {
        if (document.activeElement === element.querySelector("button")) (document.activeElement as HTMLElement).blur();
        stop(); state = { index: 0, length: messages[0].length, phase: "hold" };
        remaining = typingTiming.hold; value.textContent = messages[0]; element.dataset.phase = "hold";
      } else if (!visible || document.hidden || element.dataset.paused === "true") stop();
      else if (timer === undefined) {
        deadline = performance.now() + remaining;
        timer = window.setTimeout(() => {
          timer = undefined;
          state = nextTypingState(state, messages);
          const next = messages[state.index].slice(0, state.length);
          if (value.textContent !== next) value.textContent = next;
          element.dataset.phase = state.phase;
          remaining = typingTiming[state.phase];
          sync();
        }, remaining);
      }
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(hero);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    syncPlayback.current = sync;
    sync();
    return () => {
      stop(); observer.disconnect(); reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync); syncPlayback.current = null;
    };
  }, [messages]);

  useEffect(() => { syncPlayback.current?.(); }, [paused]);

  return <div ref={scope} className="hero-heading" data-paused={paused} data-phase="hold">
    <h1 id="hero-heading" className="hero-title display typing-heading" aria-label={messages[0]}>
      {messages.map(message => <span key={message} className="typing-measure" aria-hidden="true">{message}</span>)}
      <span className="typing-visual" aria-hidden="true"><span ref={text} className="typing-value">{messages[0]}</span><i className="typing-caret" /></span>
    </h1>
    <button type="button" className="typing-toggle" aria-controls="hero-heading" aria-pressed={paused} onClick={() => setPaused(!paused)}><Icon name={paused ? "play" : "pause"} /><span>{paused ? playLabel : pauseLabel}</span></button>
  </div>;
}
