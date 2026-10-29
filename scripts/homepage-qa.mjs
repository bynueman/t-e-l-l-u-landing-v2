import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Pass an installed Playwright entry point; no application dependency is needed.
const { chromium } = await import(process.env.TELLU_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.TELLU_PLAYWRIGHT_MODULE).href : "playwright");
const baseline = process.argv.includes("--baseline");
const output = "artifacts/phase3c/continuation";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const results = { mode: baseline ? "baseline" : "redesign", viewports: [], errors: [] };
function watchErrors(page) {
  page.on("pageerror", error => results.errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && (message.location().url.startsWith("http://127.0.0.1:3100") || /hydration/i.test(message.text()))) results.errors.push(message.text());
  });
}
try {
  for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 393, 852]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    watchErrors(page);
    await page.addInitScript(() => {
      window.lab = { lcp: 0, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.lab.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.lab.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${output}/${results.mode}-${name}.png` });
    const measurements = await page.evaluate(() => ({ ...window.lab, overflow: document.documentElement.scrollWidth > innerWidth, h1: document.querySelectorAll("h1").length, search: document.querySelector("#hero-search").getBoundingClientRect().toJSON(), resources: performance.getEntriesByType("resource").map(r => ({ name: r.name, bytes: r.transferSize })) }));
    results.viewports.push({ name, ...measurements });
    if (!baseline) {
      assert.equal(measurements.overflow, false, `${name}: horizontal overflow`);
      assert.equal(measurements.h1, 1);
      assert.equal(await page.locator('.nav-shell > a[href="/#contact"]').isVisible(), name === "desktop");
      assert.ok(measurements.search.bottom < height, `${name}: prompt above fold`);
      await page.locator("#hero-search").fill("buat website");
      await page.locator("#hero-search").dispatchEvent("compositionstart");
      await page.locator("#hero-search").press("Enter");
      assert.equal(new URL(page.url()).pathname, "/");
      await page.locator("#hero-search").dispatchEvent("compositionend");
      await page.getByRole("button", { name: "Buat website bisnis", exact: true }).click();
      await page.locator("#hero-search").press("Shift+Enter");
      assert.equal(await page.locator("#hero-search").inputValue(), "Buat website bisnis\n");
      await page.locator("#hero-search").fill("website domain");
      await page.locator("#hero-search").press("Enter");
      await page.getByRole("status").filter({ hasText: "Ada beberapa" }).waitFor();
      await page.locator("#hero-search").fill("zzzz unrelated");
      await page.locator("#hero-search").press("Enter");
      await page.getByRole("status").filter({ hasText: "Belum menemukan" }).waitFor();
      await page.locator("#hero-search").fill("");
      await page.locator("#hero-search").press("Enter");
      await page.getByRole("status").filter({ hasText: "Ceritakan dulu" }).waitFor();
      for (const section of ["#tentang", "#ekosistem", "#work", "#faq", "#contact"]) {
        await page.locator(section).evaluate(element => element.scrollIntoView({ block: "start", behavior: "instant" }));
        await page.waitForTimeout(700);
        if (section === "#work") {
          const ratioDifference = await page.locator(".featured-image img:visible").evaluate(async image => {
            await image.decode();
            return Math.abs(image.width / image.height - image.naturalWidth / image.naturalHeight);
          });
          assert.ok(ratioDifference < .01, "featured image keeps its native aspect ratio");
        }
        await page.screenshot({ path: `${output}/${name}-${section.slice(1)}.png` });
      }
      assert.equal(await page.locator(".site-header").getAttribute("data-compact"), "true");
      if (name === "desktop") {
        for (const ecosystem of ["technology", "creative", "business"]) {
          await page.locator(`[data-ecosystem="${ecosystem}"]`).evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight * .35, behavior: "instant" }));
          await page.waitForTimeout(1100);
          const emphasis = await page.locator(`.piece-${ecosystem}`).evaluate(element => Number(getComputedStyle(element).opacity));
          assert.ok(emphasis > .9, `${ecosystem}: scroll emphasis ${emphasis}`);
          await page.screenshot({ path: `${output}/scene-${ecosystem}.png` });
        }
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(() => [...document.querySelectorAll("[data-reveal], [data-story-copy]")].every(element => getComputedStyle(element).transform === "none"), undefined, { timeout: 5000 });
        assert.ok(await page.locator("[data-reveal], [data-story-copy]").evaluateAll(elements => elements.every(element => getComputedStyle(element).transform === "none")), "reduced motion reverts scroll-reveal transforms");
        assert.ok(await page.locator(".story-piece").evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === "1")), "reduced motion restores all ecosystem shapes");
      }
      await page.locator("#faq summary").first().click();
      assert.equal(await page.locator("#faq details").first().getAttribute("open"), "");
      if (name === "mobile") {
        await page.getByRole("button", { name: "Buka menu", exact: true }).click();
        await page.locator("#mobile-menu").waitFor({ state: "visible" });
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#mobile-menu").count(), 0);
      }
    }
    await page.close();
  }
  if (!baseline) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    watchErrors(page);
    for (const [query, destination] of [["buat website bisnis", "/technology#web-development"], ["kelola media sosial", "/creative#social-media"], ["business software", "/business#products"]]) {
      await page.goto("http://127.0.0.1:3100");
      await page.locator("#hero-search").fill(query);
      await page.locator("#hero-search").press("Enter");
      await page.waitForURL(`**${destination}`);
      await page.getByRole("button", { name: "Buka pencarian TELLU" }).click();
      assert.equal(await page.locator("#floating-search").inputValue(), query);
      await page.reload();
      await page.getByRole("button", { name: "Buka pencarian TELLU" }).click();
      assert.equal(await page.locator("#floating-search").inputValue(), query);
    }
    await page.goto("http://127.0.0.1:3100/technology#selected-work");
    assert.equal(await page.locator("iframe").count(), 0);
    await page.getByRole("button", { name: "Jelajahi website", exact: true }).click();
    assert.equal(await page.locator("iframe").count(), 1);
    assert.equal(await page.locator("iframe").getAttribute("sandbox"), "allow-scripts allow-same-origin allow-forms allow-popups");
    await page.getByRole("button", { name: "Lihat tampilan mobile", exact: true }).click();
    assert.equal(await page.locator(".tech-browser").getAttribute("data-mobile"), "true");
    await page.getByRole("button", { name: "Lihat tampilan desktop", exact: true }).click();
    assert.equal(await page.locator(".tech-browser").getAttribute("data-mobile"), "false");
    await page.getByRole("button", { name: /Intrax/ }).click();
    assert.equal(await page.locator("iframe").count(), 0);
    await page.locator(".tech-preview-actions").getByText("Pratinjau langsung belum tersedia.", { exact: false }).waitFor();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
    assert.equal(await page.locator(".hero-title").evaluate(el => getComputedStyle(el).opacity), "1");
    await page.screenshot({ path: `${output}/reduced-motion.png` });
    await page.close();
    const noJS = await browser.newPage({ javaScriptEnabled: false });
    await noJS.goto("http://127.0.0.1:3100");
    assert.equal(await noJS.locator("h1").isVisible(), true);
    assert.equal(await noJS.locator("#ekosistem").isVisible(), true);
    await noJS.close();
    assert.deepEqual(results.errors, []);
  }
} catch (error) {
  results.failure = error.message;
  throw error;
} finally {
  await writeFile(`${output}/${results.mode}.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ mode: results.mode, errors: results.errors, viewports: results.viewports.map(({ name, lcp, cls, overflow }) => ({ name, lcp, cls, overflow })) }, null, 2));
