import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.TELLU_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.TELLU_PLAYWRIGHT_MODULE).href : "playwright");
const output = "artifacts/phase3e";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const messages = ["Apa yang ingin kamu wujudkan?", "Butuh website untuk bisnismu?", "Ingin brand lebih dikenal?", "Mau konten yang lebih menarik?", "Butuh sistem untuk bisnismu?"];
const results = { viewports: [], errors: [], intrax: "PENDING server permission; no live rendering claimed" };
try {
  for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 393, 852]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: name !== "desktop" });
    page.on("pageerror", error => results.errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && (message.location().url.startsWith("http://127.0.0.1:3100") || /hydration/i.test(message.text()))) results.errors.push(message.text());
    });
    await page.route(/^https:\/\/(yukeducation\.co\.id|sukarindikjayaper\.id|cafegodigital\.store)\//, route => route.abort());
    const response = await page.goto("http://127.0.0.1:3100", { waitUntil: "domcontentloaded" });
    assert.ok((await response.text()).includes('class="typing-value">Apa yang ingin kamu wujudkan?'));
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("h1").getAttribute("aria-label"), messages[0]);
    assert.equal(await page.locator(".typing-visual").getAttribute("aria-hidden"), "true");
    assert.equal(await page.locator(".hero-heading [aria-live]").count(), 0);
    await page.getByRole("button", { name: "Jeda gerak dekoratif dan animasi judul", exact: true }).click();
    await page.waitForTimeout(900);
    const baseline = await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().top);
    const frozen = await page.locator(".typing-value").innerText();
    await page.waitForTimeout(200);
    assert.equal(await page.locator(".typing-value").innerText(), frozen);
    const wrapping = await page.locator(".typing-measure").evaluateAll(elements => elements.map(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      return { text: element.textContent, rows: new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size };
    }));
    assert.ok(wrapping.every(item => item.rows <= 2), `${name}: ${JSON.stringify(wrapping)}`);
    assert.ok(await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().bottom < innerHeight));
    assert.equal(await page.locator(".bridge-symbol, .bridge-piece").count(), 0);
    assert.equal(await page.locator(".hero-ornament").count(), 3);
    await page.screenshot({ path: `${output}/${name}-hero.png` });
    await page.getByRole("button", { name: "Lanjutkan gerak dekoratif dan animasi judul", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".hero-heading").dataset.phase === "delete" && document.querySelector(".typing-value").textContent.length < 27 && document.querySelector(".typing-value").textContent.length > 0);
    assert.ok(Math.abs(await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().top) - baseline) < .5);
    for (const message of name === "desktop" ? [...messages.slice(1), messages[0]] : [messages[1]]) {
      await page.waitForFunction(text => document.querySelector(".typing-value").textContent === text, message, { timeout: 12000 });
      assert.ok(Math.abs(await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().top) - baseline) < .5);
      if (message === messages[1] && name === "desktop") await page.screenshot({ path: `${output}/desktop-typing.png` });
    }
    // A simulated visibility event checks pause/resume without depending on OS tab focus.
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    const hiddenText = await page.locator(".typing-value").innerText();
    await page.waitForTimeout(250);
    assert.equal(await page.locator(".typing-value").innerText(), hiddenText);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    await page.evaluate(() => window.scrollTo({ top: document.getElementById("work").offsetTop, behavior: "instant" }));
    await page.waitForTimeout(150);
    const offscreen = await page.locator(".typing-value").innerText();
    await page.waitForTimeout(200);
    assert.equal(await page.locator(".typing-value").innerText(), offscreen);
    await page.getByRole("button", { name: "Buka pencarian TELLU" }).click();
    const colors = await page.locator(".floating-search-trigger .brand-symbol").evaluate(async image => {
      await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      const colors = { orange: 0, lime: 0, blue: 0 };
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) {
        if (data[i] > 200 && data[i + 1] > 60 && data[i + 1] < 200 && data[i + 2] < 80) colors.orange++;
        if (data[i + 1] > 150 && data[i + 2] < 80 && data[i] < 240) colors.lime++;
        if (data[i + 2] > 140 && data[i] < 150) colors.blue++;
      }
      return { ...colors, mask: getComputedStyle(image).maskImage, filter: getComputedStyle(image).filter };
    });
    assert.ok(colors.orange && colors.lime && colors.blue); assert.equal(colors.mask, "none"); assert.equal(colors.filter, "none");
    if (name === "mobile") await page.screenshot({ path: `${output}/mobile-search.png` });
    await page.locator("#floating-search").fill("buat website bisnis");
    await page.locator("#floating-search").press("Enter");
    await page.waitForURL("**/technology#web-development");
    assert.equal(await page.locator(".tech-service > .icon-badge").count(), 4);
    await page.getByRole("button", { name: /04.*Intrax/ }).click();
    assert.equal(await page.locator(".tech-project-info h3").innerText(), "Intrax");
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await page.getByRole("button", { name: "Jelajahi website", exact: true }).count(), 0);
    assert.match(await page.locator(".tech-cover").innerText(), /Pratinjau langsung belum tersedia/);
    assert.match(await page.locator('[role="status"]').first().innerText(), /menunggu izin/);
    assert.equal(await page.getByRole("link", { name: "Buka Website Intrax", exact: true }).getAttribute("href"), "https://intrax.web.id/");
    assert.ok(await page.locator(".tech-cover img").evaluate(async image => { await image.decode(); return image.naturalWidth > 0; }));
    if (name === "desktop") await page.locator(".tech-browser").screenshot({ path: `${output}/desktop-intrax.png` });
    await page.getByRole("button", { name: /01.*YUK Education/ }).click();
    await page.getByRole("button", { name: "Jelajahi website", exact: true }).click();
    assert.equal(await page.locator("iframe").count(), 1);
    assert.equal(await page.locator("iframe").getAttribute("sandbox"), "allow-scripts allow-same-origin allow-forms allow-popups");
    await page.getByRole("button", { name: /02.*Sukarindik/ }).click();
    assert.equal(await page.locator("iframe").count(), 0);
    await page.getByRole("button", { name: "Jelajahi website", exact: true }).click();
    assert.equal(await page.locator("iframe").count(), 1);
    await page.getByRole("button", { name: "Kembali ke tampilan proyek" }).click();
    assert.equal(await page.locator("iframe").count(), 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".site-header").getByRole("link", { name: "TELLU, halaman utama" }).click();
    await page.locator(".typing-value").waitFor();
    assert.equal(await page.locator(".typing-value").innerText(), messages[0]);
    assert.equal(await page.locator(".motion-toggle").isVisible(), false);
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".typing-value").innerText(), messages[0]);
    assert.equal(await page.locator(".story-symbol .story-piece image").count(), 3);
    if (name === "desktop") await page.locator(".story-step").first().screenshot({ path: `${output}/desktop-icons.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.goto("http://127.0.0.1:3100/creative#creative-agency");
    assert.equal(await page.locator("#explore .icon-badge").count(), 2);
    await page.goto("http://127.0.0.1:3100/business#products");
    assert.equal(await page.locator("#explore .icon-badge").count(), 1);
    results.viewports.push({ name, wrapping, typing: "PASS", stableSearch: "PASS", reducedMotion: "PASS", searchColors: colors, intraxFallback: "PASS", existingIframeRegression: "PASS" });
    await page.close();
  }
  const noScript = await browser.newPage({ javaScriptEnabled: false });
  await noScript.goto("http://127.0.0.1:3100");
  assert.equal(await noScript.locator(".typing-value").innerText(), messages[0]);
  assert.equal(await noScript.locator("#hero-search").isVisible(), true);
  assert.equal(await noScript.locator(".motion-toggle").isVisible(), false);
  await noScript.close();
  assert.deepEqual(results.errors, []);
  results.status = "PASS";
} catch (error) {
  results.status = "FAIL"; results.failure = error.message; throw error;
} finally {
  await writeFile(`${output}/checks.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
