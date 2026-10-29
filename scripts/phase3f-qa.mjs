import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const modulePath = process.env.TELLU_PLAYWRIGHT_MODULE ?? process.argv[2];
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : "playwright");
const out = "artifacts/phase3f";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = { viewports: [], errors: [], intrax: "PENDING server permission; live Intrax not claimed", externalSites: "Requests intercepted; no external rendering claimed" };
const base = "http://127.0.0.1:3100";
async function snapshot(page, name, target) {
  if (target) { await page.locator(target).scrollIntoViewIfNeeded(); await page.locator(target).evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" })); }
  await page.waitForTimeout(850);
  await page.screenshot({ path: `${out}/${name}.png` });
}
async function noOverflow(page) { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "horizontal overflow"); }
try {
  for (const [name, width, height] of [["desktop",1440,900],["tablet",768,1024],["mobile",393,852]]) {
    const page = await browser.newPage({ viewport: { width,height }, hasTouch: name !== "desktop" });
    await page.addInitScript(() => {
      const listeners = new Set();
      const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
      document.addEventListener = (type, listener, options) => { if(type === "visibilitychange") listeners.add(listener); return add(type,listener,options); };
      document.removeEventListener = (type, listener, options) => { if(type === "visibilitychange") listeners.delete(listener); return remove(type,listener,options); };
      window.motionListenerCount = () => listeners.size;
    });
    page.on("pageerror", e => results.errors.push(e.message));
    page.on("console", m => { if(m.type() === "error" && /hydration|127\.0\.0\.1/.test(m.text()+m.location().url)) results.errors.push(m.text()); });
    await page.route(/^https:\/\/(yukeducation\.co\.id|sukarindikjayaper\.id|cafegodigital\.store|intrax\.web\.id)\//, route => route.fulfill({ contentType: "text/html", body: "<h1>Isolated iframe lifecycle check</h1>" }));
    const response = await page.goto(base, { waitUntil:"networkidle" });
    assert.ok((await response.text()).includes('class="typing-value">Apa yang ingin kamu wujudkan?'));
    assert.equal(await page.locator("h1").getAttribute("aria-label"), "Apa yang ingin kamu wujudkan?");
    assert.equal(await page.locator(".typing-visual").getAttribute("aria-hidden"), "true");
    assert.equal(await page.locator(".typing-toggle").count(),0);
    assert.equal(await page.locator(".hero-ornament").count(),3);
    const pause = page.locator(".motion-toggle");
    await pause.focus(); await page.keyboard.press("Space");
    assert.equal(await pause.getAttribute("aria-pressed"),"true");
    const searchTop = await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().top);
    const still = await page.locator(".hero-ornament .brand-float").first().getAttribute("style");
    await page.waitForTimeout(250);
    assert.equal(await page.locator(".hero-ornament .brand-float").first().getAttribute("style"),still);
    await noOverflow(page);
    if(name !== "tablet") await snapshot(page,`${name}-hero-complete`);
    await pause.click();
    await page.waitForFunction(() => document.querySelector('.hero-heading').dataset.phase === 'type' && document.querySelector('.typing-value').textContent.length >= 5 && document.querySelector('.typing-value').textContent.length < 12, { timeout: 15000 });
    await pause.click();
    const phrase = await page.locator(".typing-visual").textContent();
    assert.equal(phrase,"Butuh website untuk bisnismu?");
    assert.ok(await page.locator(".typing-tail").evaluate(el => getComputedStyle(el).opacity > .1));
    assert.ok(Math.abs(searchTop - await page.locator("#hero-search").evaluate(el => el.getBoundingClientRect().top)) < 1,"search layout moved");
    if(name === "desktop") await snapshot(page,"desktop-hero-typing");
    await pause.click();
    if(name === "desktop") {
      const listenerCount = await page.evaluate(() => window.motionListenerCount());
      const baseline = await page.locator(".pixel-canvas").evaluate(el => el.toDataURL());
      await page.mouse.move(190,350); await page.mouse.move(250,370,{steps:8}); await page.waitForTimeout(150);
      assert.notEqual(await page.locator(".pixel-canvas").evaluate(el => el.toDataURL()),baseline,"grid distortion inactive");
      await page.mouse.move(10,895); await page.waitForTimeout(1000);
      const before = await page.locator(".brand-float").first().getAttribute("style");
      await page.waitForTimeout(300);
      assert.notEqual(await page.locator(".brand-float").first().getAttribute("style"),before);
      await page.evaluate(() => { Object.defineProperty(document,"hidden",{configurable:true,value:true}); document.dispatchEvent(new Event("visibilitychange")); });
      const hidden = await page.locator(".brand-float").first().getAttribute("style");
      const hiddenText = await page.locator(".typing-value").textContent();
      await page.waitForTimeout(250);
      assert.equal(await page.locator(".brand-float").first().getAttribute("style"),hidden);
      assert.equal(await page.locator(".typing-value").textContent(),hiddenText);
      await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
      await snapshot(page,"about","#tentang");
      await snapshot(page,"ecosystem","#ekosistem");
      assert.equal(await page.locator(".story-symbol image").count(),3);
      await snapshot(page,"featured-work","#work");
      const offscreen = await page.locator(".hero-ornament .brand-float").first().getAttribute("style");
      await page.waitForTimeout(250);
      assert.equal(await page.locator(".hero-ornament .brand-float").first().getAttribute("style"),offscreen);
      await page.locator(".slideshow-thumbnails button").nth(3).click();
      assert.equal(await page.locator(".slideshow-thumbnails button").nth(3).getAttribute("aria-pressed"),"true");
      const floating = page.locator(".floating-search-trigger");
      await floating.click();
      assert.equal(await floating.locator("img.brand-symbol").getAttribute("src").then(s => s.includes("tellu-logo")),true);
      await page.keyboard.press("Escape");
      await page.locator(".featured-project:visible").click(); await page.waitForURL("**/technology?project=intrax#selected-work");
      await page.waitForTimeout(400);
      await page.locator(".site-header a").first().click(); await page.waitForURL(`${base}/`); await page.waitForTimeout(700);
      assert.equal(await page.evaluate(() => window.motionListenerCount()),listenerCount,"visibility listeners leaked after client navigation");
    }
    await page.goto(`${base}/technology#selected-work`, {waitUntil:"networkidle"});
    await page.waitForTimeout(700);
    assert.equal(await page.locator(".tech-browser").evaluate(el => getComputedStyle(el).borderTopWidth),"1px");
    assert.equal(await page.locator(".tech-browser .tech-preview-actions").count(),0);
    assert.equal(await page.locator(".tech-browser iframe").count(),0);
    assert.ok(await page.locator("#selected-work h2").evaluate(el => el.getBoundingClientRect().top >= document.querySelector(".site-header").getBoundingClientRect().bottom),"navbar covers work heading");
    if(name !== "tablet") await snapshot(page,`${name}-portfolio`,".tech-preview-tools");
    await page.locator(".tech-selector button").nth(3).click();
    assert.equal(await page.locator(".tech-browser iframe").count(),0);
    assert.equal(await page.getByRole("link",{name:"Buka Website Intrax",exact:true}).getAttribute("href"),"https://intrax.web.id/");
    await page.locator(".tech-selector button").first().click();
    await page.locator(".tech-preview-actions button").click();
    assert.equal(await page.locator(".tech-browser iframe").count(),1);
    await page.locator(".tech-selector button").nth(1).click();
    assert.equal(await page.locator(".tech-browser iframe").count(),0);
    await noOverflow(page);
    for (const route of ["creative","business"]) {
      await page.goto(`${base}/${route}`,{waitUntil:"networkidle"});
      assert.equal(await page.locator(".ecosystem-accent image").count(),1);
      assert.ok(await page.locator("[data-stagger] article").count() > 0);
      await noOverflow(page);
      if(name === "desktop") await snapshot(page,route,"#explore");
      if(name === "desktop") {
        const card = page.locator("[data-stagger] article").first();
        await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(850);
        const before = await card.boundingBox(); await card.hover(); await page.waitForTimeout(300);
        assert.ok((await card.boundingBox()).y < before.y - 1,"card hover lift absent");
      }
    }
    await page.emulateMedia({ reducedMotion:"reduce" });
    await page.goto(base,{waitUntil:"networkidle"});
    assert.equal(await page.locator(".typing-value").textContent(),"Apa yang ingin kamu wujudkan?");
    assert.equal(await pause.isVisible(),false);
    assert.equal(await page.locator(".brand-float").first().evaluate(el => getComputedStyle(el).transform),"none");
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".typing-value").textContent(),"Apa yang ingin kamu wujudkan?");
    results.viewports.push({name,width,height,typing:"PASS",stationarySearch:"PASS",motionPause:"PASS",portfolio:"PASS",reducedMotion:"PASS",overflow:"PASS"});
    await page.close();
  }
  const context = await browser.newContext({javaScriptEnabled:false,viewport:{width:393,height:852}});
  const page = await context.newPage(); await page.goto(base);
  assert.equal(await page.locator(".typing-value").textContent(),"Apa yang ingin kamu wujudkan?");
  assert.equal(await page.locator(".motion-toggle").isVisible(),false);
  assert.equal(await page.locator("#hero-search").isVisible(),true);
  await noOverflow(page); await context.close();
  const narrow = await browser.newPage({viewport:{width:320,height:740},reducedMotion:"reduce"});
  for (const route of ["/","/technology#selected-work","/creative","/business"]) {
    await narrow.goto(`${base}${route}`,{waitUntil:"networkidle"}); await noOverflow(narrow);
  }
  await narrow.close();
  results.narrowMobile = "320px: no horizontal overflow on all four routes";
  assert.deepEqual(results.errors,[]);
  results.status = "PASS";
} finally { await writeFile(`${out}/checks.json`,JSON.stringify(results,null,2)); await browser.close(); }
console.log(JSON.stringify(results,null,2));
