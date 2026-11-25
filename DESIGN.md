# TELLU Design System & Anti-Slop Standard

## Brand Identity
TELLU is a digital business ecosystem based in Yogyakarta, Indonesia, spanning three divisions:
- **Technology**: Website development, website revamp, domain & hosting, and website maintenance.
- **Creative**: Creative agency, visual communication, content production, and social media management.
- **Business**: SaaS and digital software solutions for business operations.

Preserve the complete multicolor official TELLU emblem (`/brand/tellu-logo.png`). Never redraw, crop, fragment, or approximate its geometry.

## Color Tokens
- **Canvas**: `#fcfbf8` (`--background`), `#f9f7f3` (`--background-subtle`), `#ffffff` (`--surface`), `#fffdf9` (`--surface-warm`)
- **Ink & Neutrals**: `#20211f` (`--foreground`), `#666961` (`--muted`), `#e6e4dc` (`--line`)
- **Dark Footer / Estimator Summary**: `#1b1d19` / `#1c1d1b` with `#f5f4ea` / `#afb3a5` high-contrast text
- **Division Brand Accents**:
  - Technology: `#ffae22` → `#f07800` (with `#b84300` / `#a44a00` for WCAG AA text & badges)
  - Creative: `#e1e900` → `#72dd00` (with `#4c630e` for WCAG AA text & badges)
  - Business: `#30b9fa` → `#5816d9` (with `#5540ba` for WCAG AA text & badges)

Maintain the light, warm-white editorial aesthetic. Do not introduce dark-agency themes, neon glows, or decorative gradients unrelated to the three division identities.

## Typography Hierarchy
- **Display**: `Arial, Helvetica, sans-serif` (`.display`, tight tracking `-0.07em` to `-0.03em`)
- **Body**: `"Segoe UI", Arial, Helvetica, sans-serif`
- **Minimum Sizes**: Keep all functional UI text (labels, meta, captions, buttons) at or above `11px` (`0.6875rem`), body prose at `15px–17px` (`~66ch` max measure on articles), and use `text-wrap: balance` on headings and `text-wrap: pretty` on body copy.

## Layout & Component Rules
- Let primary headings communicate section purpose directly; avoid redundant uppercase eyebrow kickers above headings and arbitrary `01 / 02` numbering.
- Vary composition across sections (editorial split, sticky visual storytelling, asymmetric bento, unboxed hairline grids) rather than repeating centered headlines above 3-card rows.
- Avoid nested card frames, side-tab `border-left` accent stripes on rounded boxes, pulsing decorative status dots (`animate-pulse`), and continuous auto-scrolling marquees.
- Use consistent SVG icons (`src/components/ui/icon.tsx`) instead of Unicode arrows or `×`/`✕`/`▼` UI glyphs.
- Keep one-time project fees and recurring monthly costs separated in pricing and estimator summaries.
- Ensure every page contains unique DOM `id` values (footer `#contact`, section CTA `#tech-contact`).

## Motion & Signature Interactions
- Preserve native scrolling without scroll-jacking.
- Respect `prefers-reduced-motion: reduce` and provide accessible pause controls on autoplay slideshows (`FeaturedWork`, `TechnologyHero`, `PortfolioExplorer`) and decorative ambient motion (`HomeMotion`).
- **Approved Signature Interactions**:
  1. `TelluBrandPreloader` (fast, session-once `T → E → L → L → U → Logo` reveal)
  2. `HeroPixelGrid` (neutral idle grid with subtle cursor-reactive vortex)
  3. `TelluFloatingAccent` (monochrome idle complete logo, multicolor reveal on cursor proximity)
  4. Stationary Safari-frame portfolio slideshows with synchronized domain bars
  5. `TelluMagneticWordmark` (interactive footer wordmark with local cursor color reveal)

## Copywriting Voice & Authenticity
- Primary site copy is natural, confident, approachable Indonesian (`"kamu"` in product/service UI, consistent editorial voice in Blog).
- Keep approved terminology consistent: `Technology`, `Creative`, `Business`, `Portfolio`, `Blog`, `Demo Website`.
- Never fabricate client counts, testimonials, awards, SEO/Lighthouse guarantees, unverified SaaS features, or office street addresses.
- Verified contact channels (`src/config/site.ts`): `+62 815-8819-099`, `info@tellu.co`, `@tellu.co`, `Yogyakarta, Indonesia`.
