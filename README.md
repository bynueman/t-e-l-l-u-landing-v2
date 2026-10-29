# TELLU Landing

Repository: https://github.com/bynueman/t-e-l-l-u-landing-v2

TELLU company website built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and GSAP. Includes the Technology, Creative, and Business ecosystems, Smart Search, and a source-backed website portfolio. Indonesian is the default; English dictionaries are prepared without enabling unfinished locale routes.

## Local setup

Use Node.js 22.20 or newer and the committed lockfile:

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000` for the local preview.

## Checks

```powershell
npm run lint -- src scripts
npm run typecheck
node --experimental-strip-types --test src/lib/*.test.mjs src/i18n/*.test.mjs scripts/brand-icons.test.mjs
npx next build --webpack
```

## Production URL

The official production domain has not been supplied. When it is known, set `NEXT_PUBLIC_SITE_URL` to its HTTPS origin, for example in a local `.env.local` file. Without it, the app omits canonical URL and Open Graph URL metadata rather than publishing a guessed domain. Environment files are ignored by Git.

## Production preview preparation

After the checks above, start the built app with:

```sh
npm run start -- --hostname 127.0.0.1 --port 3017
```

The planned VPS application directory is `/home/tellu/app`, running as Linux user `tellu`. A separately configured Nginx preview on port `8088` can proxy the internal port `3017`. No deployment, Nginx, systemd, or firewall changes are included in this repository setup. Keep existing VPS applications isolated.

## Brand assets and browser tests

The authentic symbol is `public/brand/tellu-logo.png`. App Router icon files are generated from it by `node scripts/generate-brand-icons.mjs`; no icon metadata overrides are needed. The original asset is preserved.

Browser checks use an externally installed Playwright package, without adding an application dependency. Set `TELLU_PLAYWRIGHT_MODULE` to its entry point and run `node scripts/phase3d-qa.mjs` against a production server on port `3100`. Set `TELLU_QA_OUTPUT` to choose a separate local evidence directory. Browser artifacts, environment files, dependencies, and build output should not be published.
