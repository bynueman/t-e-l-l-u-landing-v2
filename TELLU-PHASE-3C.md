# TELLU Phase 3C — final handoff

Closure date: 2026-10-29. This report consolidates saved evidence and recorded command results. Closure did not rerun builds, browser suites, dependency installation, or Lighthouse. The already-running Lighthouse measurement completed and is included below.

## A. Implemented homepage changes — PASS

- Warm, centered, server-rendered hero with the approved Indonesian headline and supporting copy.
- Prominent white multiline search panel, functioning example chips, restrained brand ornaments, and coordinated entrance motion.
- Compact floating navigation, an editorial Technology/Creative/Business story, and native scrolling.
- Real YUK Education portfolio teaser with its verified 1440×810 image proportions.
- Service FAQs, final search CTA, and refined dark footer.
- Updated Indonesian and English dictionaries; no incomplete language switcher or locale routes.
- Obsolete hero-only isometric/orbit implementations retired after checking references.

The approved design was preserved during the performance continuation. No reference assets or source code were copied. The recording was unavailable; the original implementation used the supplied breakdown and public reference page.

## B. GSAP architecture and interactions — PASS

The homepage uses a scoped `useGSAP` owner and `gsap.matchMedia` cleanup. A short timeline coordinates the hero entrance while keeping search visible and usable. ScrollTrigger drives the converging decoration, section reveals, and desktop ecosystem emphasis. Mobile receives simpler motion and composition.

Motion primarily uses transforms and opacity. Scrolling remains native, with no long pinned section or continuously looping decorative timeline. Navigation compaction uses IntersectionObserver and CSS transforms.

A deferred-reveal experiment passed compilation but produced no usable after-change performance samples. It was reverted. The retained `home-motion.tsx` exactly matches the saved checkpoint.

## C. Smart Search and portfolio preservation — PASS

Saved browser checks verify deterministic matching, working examples, Enter submission, Shift+Enter, IME composition safety, ambiguous/unknown/empty results, all three ecosystem destinations, session persistence, and the floating assistant.

The Technology explorer and factual project registry remain intact. Tests verify no iframe before activation, one active iframe, preserved sandbox attributes, desktop/mobile controls, and Intrax screenshot fallback. The homepage uses a local image and loads no portfolio iframe.

The search engine, ecosystem pages, portfolio registry/explorer, package files, and Next/PostCSS configuration were preserved. No application dependencies or external AI services were added.

## D. Browser regression results — PASS

The saved production suite passed at 1440×900, 768×1024, and 393×852 with device scale 1. Checks include:

- One H1, above-fold search, no horizontal overflow, and no application console/runtime/hydration errors.
- Search flows, persistence, floating assistance, mobile menu Escape, FAQs, and portfolio controls.
- All three ecosystem emphasis states and the featured image's native proportions.
- Reduced-motion cleanup and essential content with JavaScript disabled.

Evidence: `artifacts/phase3c/continuation/redesign.json` and accompanying screenshots. Earlier evidence remains in the parent directory.

## E. Desktop and mobile Lighthouse results

All scores are production-mode lab observations. Historical filenames containing “final” identify checkpoints, not current acceptance.

| Evidence | Performance | Accessibility | LCP | CLS | TBT | CPU benchmark |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Original homepage, mobile | 83 | NOT MEASURED | 1.30 s | 0 | 566 ms | 603.5 |
| Initial redesign, mobile | 95 | 96 | 0.91 s | 0 | 261 ms | 1,681 |
| Earlier revision, mobile (`final-mobile-1`) | 95 | 96 | 0.96 s | 0 | 272 ms | 1,692.5 |
| Contrast-corrected, mobile (`final-mobile-2`) | 54 | 100 | 3.18 s | 0 | 2,239 ms | 288 |
| Contrast-corrected, mobile (`final-mobile-3`) | 69 | 100 | 2.11 s | 0 | 1,744 ms | 349.5 |
| Contrast-corrected, mobile (`final-mobile-4`) | 77 | 100 | 1.49 s | 0 | 1,007 ms | 694 |
| Historical desktop | 96 | 100 | 0.56 s | 0 | 143 ms | 379 |
| Latest mobile, 2026-10-29 | **39** | **100** | **4.43 s** | **0** | **3,613 ms** | **121** |

Latest evidence: `artifacts/phase3c/continuation/lighthouse-mobile-current.json`, fetched at 2026-10-29 06:06:18 UTC. It completed without a reported runtime error and includes Lighthouse's explicit slow-CPU warning.

Mobile performance ≥90 under repeatable conditions: **FAIL / not established**. Historical desktop ≥90: **PASS for that recorded run**; fresh desktop performance: **NOT VERIFIED**.

## F. Performance variability and LCP concerns

No comparable before/after evidence establishes a speed improvement. The CPU benchmark varied substantially, and slow runs contain explicit CPU warnings. Host variability is a measurement limitation; it does not dismiss the poor results or prove the application meets its targets.

Saved diagnostics identify main-thread style/layout and JavaScript execution as major costs. In the 77-point mobile run, style/layout consumed about 2,079 ms and script evaluation 1,884 ms. Next.js runtime execution was the largest attributed script cost; GSAP startup also contributed. There is no heavy hero image or remote font download.

The latest unthrottled browser observations were also poor: desktop LCP 8.144 s, tablet 2.836 s, and mobile 3.228 s, with CLS 0 throughout. These are local observations, not field metrics or Lighthouse scores.

Two throttled after-change profiles timed out before usable samples: 30 seconds waiting for network idle, then 45 seconds waiting for DOMContentLoaded. Both failures are retained. The optimization was reverted rather than credited with an unmeasured benefit.

Field INP and field Core Web Vitals: **NOT MEASURED**. TBT is not INP. Repeatable mobile performance acceptance remains open.

## G. Accessibility and reduced motion — PASS within tested scope

The latest mobile Lighthouse accessibility score is 100; historical desktop accessibility is 100. Browser checks pass reduced-motion cleanup, keyboard search behavior, accessible FAQ disclosures, and JavaScript-disabled essential content.

An immediate reduced-motion assertion initially failed because it raced the browser's asynchronous media-change handling. A bounded wait resolved the test race without changing application code. The failure is preserved in `continuation/qa-immediate-media-check-failed.json`.

Physical-device Safari/iOS behavior and comprehensive manual assistive-technology testing: **NOT VERIFIED**. An automated accessibility score is not a complete accessibility certification.

## H. Production build and test status

| Check | Status | Evidence / limitation |
| --- | --- | --- |
| Webpack production build | PASS | Restored build compiled, passed TypeScript, and statically generated all four routes |
| TypeScript | PASS | Recorded standalone check and production build |
| Automated tests | PASS | Eight dictionary, search/keyboard/anchor, and portfolio tests |
| Focused ESLint | PASS | Recorded application/scripts/configuration scope; final harness-only edits were not re-linted during closure |
| Production browser suite | PASS | Three viewports; saved continuation JSON and screenshots |
| Latest mobile accessibility | PASS | Lighthouse 100 |
| Repeatable mobile performance ≥90 | FAIL | Latest score 39; historical results vary |
| Default Turbopack build | FAIL | Known worker-connection failure reproduced earlier; not retried during closure |
| Dependency audit | PASS, historical | Zero vulnerabilities reported; dependency files unchanged |
| Field INP / field CWV | NOT MEASURED | No field telemetry |
| Physical mobile devices | NOT VERIFIED | Browser emulation only |

No configuration, OS permissions, or security settings were altered to force a build or score.

## I. Outstanding issues and review readiness

The remaining acceptance issue is mobile performance, including LCP and main-thread blocking. Reliable optimization comparison requires stable test conditions and profiling before retaining another change.

The project is ready for **manual Git review**, with performance limitations disclosed. The working tree consists of untracked application files, so ordinary tracked-file diffs alone do not represent the work. No staging, commits, pushes, resets, cleaning, deployment, VPS changes, other-repository changes, or Phase 3D work occurred.

During this final closure, only `TELLU-PHASE-3C.md` was edited. Earlier continuation work updated `scripts/homepage-qa.mjs`, created `scripts/homepage-profile.mjs`, and saved diagnostic artifacts. No speculative application optimization was retained. Historical screenshots, unsuccessful profiles, and low Lighthouse scores remain available.

## J. Final Phase 3C status — PARTIAL

Implementation and functional regression verification are complete. Mobile performance acceptance remains unmet, and no performance improvement is claimed.

Recommended next action: manually review the current working tree and this evidence, keeping mobile performance acceptance open for a controlled profiling session. Do not deploy or begin another phase automatically.
