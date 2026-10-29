import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.TELLU_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.TELLU_PLAYWRIGHT_MODULE).href : "playwright");
const output = process.env.TELLU_QA_OUTPUT ?? "artifacts/phase3d";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = { viewports: [], errors: [] };
try {
  for (const [name, width, height, touch] of [["desktop", 1440, 900, false], ["tablet", 768, 1024, true], ["mobile", 393, 852, true]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch, deviceScaleFactor: 1 });
    page.on("pageerror", error => results.errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && (message.location().url.startsWith("http://127.0.0.1:3100") || /hydration/i.test(message.text()))) results.errors.push(message.text());
    });
    await page.addInitScript(() => {
      const lab = window.gridLab = { strokes: 0, batches: [], listeners: 0 };
      // Repeated pixel assertions otherwise make Chrome switch raster backends mid-test.
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, options) {
        return getContext.call(this, type, this.className === "pixel-canvas" ? { ...options, willReadFrequently: true } : options);
      };
      const stroke = CanvasRenderingContext2D.prototype.strokeRect;
      const save = CanvasRenderingContext2D.prototype.save;
      const restore = CanvasRenderingContext2D.prototype.restore;
      let depth = 0, started = 0;
      CanvasRenderingContext2D.prototype.strokeRect = function (...args) { if (this.canvas.className === "pixel-canvas") lab.strokes++; return stroke.apply(this, args); };
      CanvasRenderingContext2D.prototype.save = function () { if (this.canvas.className === "pixel-canvas" && depth++ === 0) started = performance.now(); return save.call(this); };
      CanvasRenderingContext2D.prototype.restore = function () { const value = restore.call(this); if (this.canvas.className === "pixel-canvas" && --depth === 0 && lab.batches.length < 500) lab.batches.push(performance.now() - started); return value; };
      const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function (type, ...args) { if (this instanceof Element && this.id === "hero" && type.startsWith("pointer")) lab.listeners++; return add.call(this, type, ...args); };
      EventTarget.prototype.removeEventListener = function (type, ...args) { if (this instanceof Element && this.id === "hero" && type.startsWith("pointer")) lab.listeners--; return remove.call(this, type, ...args); };
      window.pixelHash = (far = false) => {
        const canvas = document.querySelector(".pixel-canvas"), ctx = canvas.getContext("2d");
        const bytes = far ? ctx.getImageData(canvas.width - 100, 200, 80, 80).data : ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let hash = 0;
        for (let i = 3; i < bytes.length; i += 4) hash = (hash * 31 + bytes[i]) | 0;
        return hash;
      };
    });
    await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
    assert.equal(await page.locator("h1").getAttribute("aria-label"), "Apa yang ingin kamu wujudkan?");
    assert.equal(await page.locator(".hero-eyebrow, .brand-dot").count(), 0);
    assert.ok((await page.title()).startsWith("TELLU"));
    if (!touch) {
      const icons = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll(links => links.map(link => ({ href: link.href, sizes: link.sizes.value })));
      assert.equal(icons.filter(icon => new URL(icon.href).pathname === "/favicon.ico").length, 1);
      assert.deepEqual(icons.filter(icon => !icon.href.includes("favicon.ico")).map(icon => icon.sizes).sort(), ["180x180", "192x192", "32x32", "512x512"].sort());
      for (const icon of icons) {
        const response = await page.request.get(icon.href);
        assert.equal(response.status(), 200);
        const file = new URL(icon.href).pathname.slice(1);
        assert.match(response.headers()["content-type"], file.endsWith(".ico") ? /image\/(x-icon|vnd.microsoft.icon)/ : /image\/png/);
        assert.deepEqual(await response.body(), await readFile(`src/app/${file}`));
      }
      results.branding = { freshSession: "PASS", title: await page.title(), icons };
    }
    assert.equal(await page.locator("#hero-search").getAttribute("placeholder"), "Ceritakan yang kamu butuhkan...");
    assert.ok(await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().bottom < innerHeight));
    assert.equal(await page.locator(".floating-search-dock").getAttribute("inert"), "");
    assert.ok(await page.locator(".hero-pixel-grid").evaluate(el => el.querySelectorAll("*").length < 35));
    await page.screenshot({ path: `${output}/${name}-hero.png` });
    await page.evaluate(() => window.scrollTo({ top: document.getElementById("hero").offsetHeight - innerHeight / 2, behavior: "instant" }));
    await page.screenshot({ path: `${output}/${name}-transition.png` });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    let drawing = null;
    if (!touch) {
      await page.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.ready === "true");
      const baseline = await page.evaluate(() => {
        const c = document.querySelector(".pixel-canvas");
        window.pixelBaseline = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        return [window.pixelHash(), window.pixelHash(true)];
      });
      await page.evaluate(() => { window.gridLab.batches = []; });
      await page.mouse.move(100, 400);
      await page.mouse.move(240, 440, { steps: 18 });
      assert.equal(await page.locator(".hero-pixel-grid").getAttribute("data-active"), "true");
      const active = await page.evaluate(() => [window.pixelHash(), window.pixelHash(true)]);
      assert.notEqual(active[0], baseline[0], "actual pixels deform");
      assert.equal(active[1], baseline[1], "far field remains unchanged");
      await page.evaluate(() => {
        window.pointerSample = setInterval(() => document.getElementById("hero").dispatchEvent(new PointerEvent("pointermove", { clientX: 220 + Math.sin(performance.now() / 80) * 12, clientY: 430, pointerType: "mouse", bubbles: true })), 20);
      });
      await page.screenshot({ path: `${output}/desktop-pointer.png` });
      await page.screenshot({ path: `${output}/desktop-pointer-detail.png`, clip: { x: 60, y: 290, width: 320, height: 280 } });
      await page.evaluate(() => clearInterval(window.pointerSample));
      await page.mouse.move(1430, 899);
      await page.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.active === "false");
      const settled = await page.evaluate(() => {
        const c = document.querySelector(".pixel-canvas"), pixels = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let changed = 0, maxDelta = 0;
        const examples = [];
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] !== window.pixelBaseline[i]) {
          changed++; maxDelta = Math.max(maxDelta, Math.abs(pixels[i] - window.pixelBaseline[i]));
          if (examples.length < 8) examples.push({ x: (i >> 2) % c.width, y: Math.floor((i >> 2) / c.width), before: window.pixelBaseline[i], after: pixels[i] });
        }
        return { hash: window.pixelHash(), changed, maxDelta, examples };
      });
      assert.equal(settled.hash, baseline[0], `pointer leave restores exact baseline: ${JSON.stringify(settled)}`);
      const idle = await page.evaluate(() => window.gridLab.strokes);
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.gridLab.strokes), idle, "no canvas redraw while idle");
      drawing = await page.evaluate(() => {
        const samples = window.gridLab.batches.toSorted((a, b) => a - b);
        return { backend: "CPU readback forced by test only", batches: samples.length, medianMs: samples[Math.floor(samples.length * .5)], p95Ms: samples[Math.floor(samples.length * .95)], maxMs: samples.at(-1) };
      });
      await page.mouse.move(160, 430, { steps: 5 });
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      assert.equal(await page.locator(".hero-pixel-grid").getAttribute("data-active"), "false");
      await page.evaluate(() => { delete document.hidden; });
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.mouse.move(120, 390, { steps: 5 });
      await page.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.active === "true");
      await page.setViewportSize({ width, height });
    } else {
      assert.notEqual(await page.locator(".hero-pixel-grid").getAttribute("data-ready"), "true");
      assert.equal(await page.evaluate(() => window.gridLab.listeners), 0);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.ready !== "true");
    assert.equal(await page.evaluate(() => window.gridLab.listeners), 0);
    assert.equal(await page.locator(".pixel-static").evaluate(el => getComputedStyle(el).visibility), "visible");
    await page.getByRole("button", { name: "Buat website bisnis", exact: true }).click();
    await page.locator("#hero-search").press("Shift+Enter");
    assert.equal(await page.locator("#hero-search").inputValue(), "Buat website bisnis\n");
    await page.locator("#hero-search").dispatchEvent("compositionstart");
    await page.locator("#hero-search").press("Enter");
    assert.equal(new URL(page.url()).pathname, "/");
    await page.locator("#hero-search").dispatchEvent("compositionend");
    if (!touch) {
      await page.getByRole("button", { name: "Proyek berikutnya" }).click();
      assert.match(await page.locator(".featured-project:visible").innerText(), /Sukarindik/);
      await page.getByRole("button", { name: "Proyek sebelumnya" }).click();
    }
    await page.locator("#hero-search").fill("website domain");
    await page.locator("#hero-search").press("Enter");
    await page.getByRole("status").filter({ hasText: "Ada beberapa" }).waitFor();
    await page.evaluate(() => window.scrollTo({ top: document.getElementById("work").offsetTop, behavior: "instant" }));
    await page.getByRole("button", { name: "Buka pencarian TELLU" }).click();
    assert.equal(await page.locator("#floating-search").inputValue(), "website domain");
    assert.equal(await page.locator(".hero-search-zone").evaluate(el => el.inert), true);
    assert.ok(await page.locator(".floating-search-panel").evaluate(el => el.getBoundingClientRect().top > document.querySelector(".site-header").getBoundingClientRect().bottom + 8));
    await page.locator("#floating-search").fill("zzzz unrelated");
    await page.locator("#floating-search").press("Enter");
    await page.locator(".floating-search-panel").getByRole("status").filter({ hasText: "Belum menemukan" }).waitFor();
    await page.locator("#floating-search").fill("");
    await page.locator("#floating-search").press("Enter");
    await page.locator(".floating-search-panel").getByRole("status").filter({ hasText: "Ceritakan dulu" }).waitFor();
    if (!touch) await page.locator(".floating-search-dock").screenshot({ path: `${output}/desktop-search-dock.png` });
    await page.locator("#floating-search").fill("buat website bisnis");
    await page.locator("#floating-search").press("Enter");
    await page.waitForURL("**/technology#web-development");
    assert.equal(await page.evaluate(() => window.gridLab.listeners), 0, "hero listeners cleaned up on navigation");
    await page.waitForFunction(() => document.getElementById("web-development").getBoundingClientRect().top >= document.querySelector(".site-header").getBoundingClientRect().bottom);
    if (!touch) {
      await page.route(/^https:\/\/(yukeducation\.co\.id|sukarindikjayaper\.id|cafegodigital\.store)\//, route => route.abort());
      assert.equal(await page.locator(".tech-project-card img").count(), 4);
      assert.equal(await page.locator(".browser-lights i").count(), 3);
      assert.equal(await page.locator("iframe").count(), 0);
      await page.getByRole("button", { name: "Jelajahi website", exact: true }).click();
      assert.equal(await page.locator("iframe").count(), 1);
      await page.getByRole("button", { name: /04.*Intrax/ }).click();
      assert.equal(await page.locator("iframe").count(), 0);
      assert.match(await page.locator(".tech-preview-actions").innerText(), /belum tersedia/);
      results.portfolioRegression = "PASS";
    }
    await page.getByRole("button", { name: "Buka pencarian TELLU" }).click();
    assert.equal(await page.locator("#floating-search").inputValue(), "buat website bisnis");
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("button", { name: "Buka pencarian TELLU" }).evaluate(el => el === document.activeElement), true);
    await page.locator(".site-header").getByRole("link", { name: "TELLU, halaman utama" }).click();
    await page.locator("#hero-search").waitFor();
    assert.equal(await page.locator("#hero-search").inputValue(), "buat website bisnis");
    await page.evaluate(() => window.scrollTo({ top: document.getElementById("work").offsetTop, behavior: "instant" }));
    await page.getByRole("button", { name: "Buka pencarian TELLU" }).click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector(".floating-search-dock").dataset.visible === "false");
    assert.equal(await page.locator("#floating-search").count(), 0);
    assert.equal(await page.locator(".hero-search-zone").evaluate(el => el.inert), false);
    assert.equal(await page.locator(".floating-search-dock").getAttribute("inert"), "");
    if (touch) {
      await page.getByRole("button", { name: "Buka menu", exact: true }).click();
      await page.locator('#mobile-menu a[href="/#tentang"]').click();
    } else await page.locator('.site-header nav a[href="/#tentang"]').click();
    await page.waitForFunction(() => document.querySelector("#tentang h2").getBoundingClientRect().top > document.querySelector(".site-header").getBoundingClientRect().bottom);
    if (!touch) {
      const geometry = await page.evaluate(async () => {
        const source = new Image(); source.src = "/brand/tellu-logo.png"; await source.decode();
        const c = document.createElement("canvas"); c.width = source.width; c.height = source.height;
        const ctx = c.getContext("2d"); ctx.drawImage(source, 0, 0);
        const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
        const polygons = [...document.querySelectorAll(".story-piece image")].map(image => {
          const values = image.style.clipPath.match(/[\d.]+/g).map(Number);
          return values.flatMap((value, index) => index % 2 ? [] : [[value, values[index + 1]]]);
        });
        function inside(x, y, polygon) {
          let hit = false;
          for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[i], b = polygon[j];
            if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
          }
          return hit;
        }
        let missing = 0, overlap = 0;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (pixels[(y * c.width + x) * 4 + 3]) {
          const count = polygons.filter(p => inside((x + .5) / c.width * 100, (y + .5) / c.height * 100, p)).length;
          if (!count) missing++; if (count > 1) overlap++;
        }
        return { missing, overlap };
      });
      assert.deepEqual(geometry, { missing: 0, overlap: 0 });
      results.brandGeometry = geometry;
      await page.locator(".story-symbol").screenshot({ path: `${output}/desktop-brand.png` });
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    if (!touch) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForFunction(() => window.gridLab.listeners === 3);
      assert.equal(await page.locator(".hero-pixel-grid").getAttribute("data-active"), "false");
    }
    results.viewports.push({ name, staticGrid: "PASS", cursor: touch ? "disabled on touch" : "PASS", reducedMotion: "PASS", search: "PASS", anchors: "PASS", drawing });
    await page.close();
  }
  const profile = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await profile.addInitScript(() => {
    window.defaultDraw = [];
    const save = CanvasRenderingContext2D.prototype.save, restore = CanvasRenderingContext2D.prototype.restore;
    let depth = 0, started = 0;
    CanvasRenderingContext2D.prototype.save = function () { if (this.canvas.className === "pixel-canvas" && depth++ === 0) started = performance.now(); return save.call(this); };
    CanvasRenderingContext2D.prototype.restore = function () { const value = restore.call(this); if (this.canvas.className === "pixel-canvas" && --depth === 0) window.defaultDraw.push(performance.now() - started); return value; };
  });
  await profile.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
  await profile.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.ready === "true");
  await profile.evaluate(() => { window.defaultDraw = []; });
  await profile.mouse.move(100, 420);
  await profile.mouse.move(420, 470, { steps: 24 });
  await profile.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.active === "false");
  results.defaultCanvasPatchMs = await profile.evaluate(() => {
    const samples = window.defaultDraw.toSorted((a, b) => a - b);
    return { backend: "browser default, no pixel readback", batches: samples.length, medianMs: samples[Math.floor(samples.length * .5)], p95Ms: samples[Math.floor(samples.length * .95)], maxMs: samples.at(-1) };
  });
  const boundary = await profile.evaluate(() => {
    const primary = document.querySelector(".hero-search-zone").getBoundingClientRect();
    window.dockOpacity = [];
    new MutationObserver(() => window.dockOpacity.push(Number(document.querySelector(".floating-search-dock").style.opacity))).observe(document.querySelector(".floating-search-dock"), { attributes: true, attributeFilter: ["style"] });
    return { y: primary.bottom + scrollY - document.querySelector(".site-header").getBoundingClientRect().bottom - 8 - primary.height * .05, height: primary.height };
  });
  await profile.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), boundary.y + 4);
  await profile.waitForFunction(() => document.querySelector(".floating-search-dock").style.opacity === "1");
  assert.ok(await profile.evaluate(() => window.dockOpacity.some(value => value > 0 && value < 1)), "dock transitions through intermediate opacity");
  await profile.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), boundary.y - 4);
  await profile.waitForTimeout(150);
  assert.equal(await profile.locator(".floating-search-dock").getAttribute("data-visible"), "true", "hysteresis prevents boundary flicker");
  await profile.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), boundary.y - boundary.height * .3);
  await profile.waitForFunction(() => document.querySelector(".floating-search-dock").style.visibility === "hidden");
  await profile.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await profile.mouse.move(150, 430, { steps: 5 });
  await profile.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.active === "true");
  await profile.evaluate(() => window.scrollTo({ top: document.getElementById("work").offsetTop, behavior: "instant" }));
  await profile.waitForFunction(() => document.querySelector(".hero-pixel-grid").dataset.active === "false");
  const stopped = await profile.evaluate(() => window.defaultDraw.length);
  await profile.waitForTimeout(250);
  assert.equal(await profile.evaluate(() => window.defaultDraw.length), stopped, "no offscreen redraw");
  results.normalDockTransition = "PASS, including hysteresis";
  await profile.close();
  const staticPage = await browser.newPage({ javaScriptEnabled: false });
  await staticPage.goto("http://127.0.0.1:3100");
  assert.equal(await staticPage.locator(".pixel-static").isVisible(), true);
  assert.equal(await staticPage.locator("#hero-search").isVisible(), true);
  await staticPage.close();
  assert.deepEqual(results.errors, []);
  results.status = "PASS";
} catch (error) {
  results.status = "FAIL"; results.failure = error.message;
  throw error;
} finally {
  await writeFile(`${output}/checks.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
