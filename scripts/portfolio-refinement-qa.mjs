import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.TELLU_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.TELLU_PLAYWRIGHT_MODULE).href : "playwright");
const output = "artifacts/portfolio-refinement";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = { viewports: [], errors: [] };
try {
  for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 393, 852]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", error => results.errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && (message.location().url.startsWith("http://127.0.0.1:3100") || /hydration/i.test(message.text()))) results.errors.push(message.text());
    });
    // Test blocked embeds deterministically without depending on third-party availability.
    await page.route(/^https:\/\/(yukeducation\.co\.id|sukarindikjayaper\.id|cafegodigital\.store)\//, route => route.abort());
    await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${output}/${name}-hero.png` });
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await page.locator(".hero-ornament").count(), 3);
    assert.equal(await page.locator(".bridge-piece.brand-module").count(), 0);
    assert.equal(await page.locator(".story-piece image").count(), 3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.ok(await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().bottom < innerHeight));
    await page.locator("#tentang").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${name}-about.png` });
    await page.locator("#work").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Proyek sebelumnya" }).click();
    assert.match(await page.locator(".featured-project:visible").innerText(), /Intrax/);
    await page.getByRole("button", { name: "Proyek berikutnya" }).focus();
    await page.keyboard.press("Enter");
    assert.match(await page.locator(".featured-project:visible").innerText(), /YUK Education/);
    await page.locator(".slideshow-thumbnails button").nth(1).click();
    assert.equal(await page.locator(".slideshow-thumbnails button[aria-pressed=true]").count(), 1);
    assert.match(await page.locator(".featured-project:visible").getAttribute("href"), /project=sukarindik-jaya-per/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".slideshow-thumbnails button").nth(2).click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".featured-project:has(h3)" )).transform === "none");
    assert.ok(await page.locator(".story-piece").evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === "1")));
    await page.screenshot({ path: `${output}/${name}-slideshow.png` });
    await page.locator(".featured-image:visible").screenshot({ path: `${output}/${name}-featured-image.png` });
    await page.locator(".featured-project:visible").click();
    await page.waitForURL("**/technology?project=cafe-go-digital#selected-work");
    await page.waitForFunction(() => document.querySelector(".tech-project-info h3")?.textContent === "Cafe Go Digital");
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await page.locator(".browser-lights i").count(), 3);
    assert.equal(await page.locator(".tech-project-card img").count(), 4);
    await page.getByRole("button", { name: "Jelajahi website", exact: true }).click();
    assert.equal(await page.locator("iframe").count(), 1);
    assert.equal(await page.locator("iframe").getAttribute("sandbox"), "allow-scripts allow-same-origin allow-forms allow-popups");
    assert.match(await page.locator('[role="status"]').first().innerText(), /kosong atau diblokir/);
    await page.getByRole("button", { name: "Kembali ke tampilan proyek" }).click();
    assert.equal(await page.locator("iframe").count(), 0);
    await page.getByRole("button", { name: /04.*Intrax/ }).click();
    assert.equal(await page.getByRole("button", { name: "Jelajahi website", exact: true }).count(), 0);
    assert.match(await page.locator(".tech-preview-actions").innerText(), /belum tersedia/);
    assert.match(await page.locator('[role="status"]').first().innerText(), /menunggu izin/);
    await page.getByRole("button", { name: /01.*YUK Education/ }).click();
    await page.locator(".tech-browser").screenshot({ path: `${output}/${name}-safari.png` });
    await page.getByRole("button", { name: "Lihat tampilan mobile" }).click();
    assert.equal(await page.locator(".tech-browser").getAttribute("data-mobile"), "true");
    assert.equal(await page.getByRole("button", { name: "Lihat tampilan mobile" }).getAttribute("aria-pressed"), "true");
    assert.equal(await page.getByRole("button", { name: "Lihat tampilan desktop" }).getAttribute("aria-pressed"), "false");
    await page.screenshot({ path: `${output}/${name}-preview.png` });
    await page.locator(".tech-project-grid").screenshot({ path: `${output}/${name}-project-cards.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    results.viewports.push({ name, slideshow: "PASS", fallback: "PASS", reducedMotion: "PASS", overflow: false });
    await page.close();
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto("http://127.0.0.1:3100");
  assert.equal(await page.locator(".featured-project:visible").count(), 1);
  assert.equal(await page.locator("h1").count(), 1);
  await page.goto("http://127.0.0.1:3100/technology");
  assert.equal(await page.locator(".tech-cover img:visible").count(), 1);
  assert.equal(await page.locator(".tech-project-card img").count(), 4);
  await page.close();
  const invalid = await browser.newPage();
  await invalid.goto("http://127.0.0.1:3100/technology?project=https://example.com");
  assert.equal(await invalid.locator(".tech-project-info h3").innerText(), "YUK Education");
  assert.equal(await invalid.locator(".tech-selector button[aria-pressed=true]").count(), 1);
  assert.equal(await invalid.locator("iframe").count(), 0);
  await invalid.close();
  assert.deepEqual(results.errors, []);
  results.status = "PASS";
} catch (error) {
  results.status = "FAIL";
  results.failure = error.message;
  throw error;
} finally {
  await writeFile(`${output}/checks.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
