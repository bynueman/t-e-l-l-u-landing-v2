"use client";

import { useEffect, useRef } from "react";
import { nextTypingState, typingTiming, type TypingState } from "@/lib/hero-typing";
import { useMotionPaused } from "./home-motion";

export function TypingHeadline({ messages }: { messages: readonly string[] }) {
  const scope = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const guide = useRef<HTMLSpanElement>(null);
  const syncPlayback = useRef<(() => void) | null>(null);
  const paused = useMotionPaused();

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
        guide.current!.textContent = "";
      } else if (!visible || document.hidden || element.dataset.paused === "true") stop();
      else if (timer === undefined) {
        deadline = performance.now() + remaining;
        timer = window.setTimeout(() => {
          timer = undefined;
          state = nextTypingState(state, messages);
          const next = messages[state.index].slice(0, state.length);
          if (value.textContent !== next) value.textContent = next;
          guide.current!.textContent = messages[state.index].slice(state.length);
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
      <span className="typing-visual" aria-hidden="true"><span ref={text} className="typing-value">{messages[0]}</span><i className="typing-caret" /><span ref={guide} className="typing-tail" /></span>
    </h1>
  </div>;
}
