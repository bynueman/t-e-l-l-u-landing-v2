import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.TELLU_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.TELLU_PLAYWRIGHT_MODULE).href : "playwright");
const label = process.argv[2];
assert.match(label ?? "", /^[a-z0-9-]+$/, "provide a safe measurement label");
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const runs = [];
let failure;
try {
  for (let run = 1; run <= 3; run++) {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.lab = { lcp: 0, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.lab.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.lab.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("http://127.0.0.1:3100", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForFunction(() => document.querySelector(".hero-title span")?.style.transform);
    await page.waitForTimeout(1800);
    const { metrics } = await cdp.send("Performance.getMetrics");
    const values = Object.fromEntries(metrics.map(metric => [metric.name, metric.value]));
    const lab = await page.evaluate(() => ({ ...window.lab, jsBytes: performance.getEntriesByType("resource").filter(r => r.name.includes("/chunks/")).reduce((sum, r) => sum + r.transferSize, 0) }));
    assert.ok(values.LayoutCount > 0);
    assert.ok(lab.lcp > 0);
    runs.push({ run, ...lab, layoutCount: values.LayoutCount, styleCount: values.RecalcStyleCount, layoutMs: values.LayoutDuration * 1000, styleMs: values.RecalcStyleDuration * 1000, scriptMs: values.ScriptDuration * 1000, taskMs: values.TaskDuration * 1000 });
    console.log(JSON.stringify(runs.at(-1)));
    await page.close();
  }
} catch (error) {
  failure = error.message;
  throw error;
} finally {
  await mkdir("artifacts/phase3c", { recursive: true });
  await writeFile(`artifacts/phase3c/profile-${label}.json`, JSON.stringify({ label, cpuSlowdown: 4, runs, failure }, null, 2));
  await browser.close();
}
