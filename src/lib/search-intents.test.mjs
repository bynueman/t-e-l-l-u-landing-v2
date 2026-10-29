import assert from "node:assert/strict";
import { test } from "node:test";
import { matchSearch, searchDestinations, shouldSubmitPrompt } from "./search-intents.ts";

test("Indonesian and English intents route to real destinations", () => {
  for (const [query, href] of [
    ["buat website perusahaan", "/technology#web-development"],
    ["beli domain", "/technology#domain"],
    ["revamp website", "/technology#website-revamp"],
    ["lihat portfolio website", "/technology#selected-work"],
    ["kelola instagram", "/creative#social-media"],
    ["mau bikin konten", "/creative#creative-agency"],
    ["punya aplikasi bisnis?", "/business#products"],
    ["apa itu TELLU?", "/#tentang"],
    ["company website", "/technology#web-development"],
  ]) {
    const result = matchSearch(query);
    assert.equal(result.kind, "direct", query);
    assert.equal(result.choices[0].href, href, query);
  }
});

test("ambiguous and unknown queries offer choices", () => {
  assert.equal(matchSearch("website domain").kind, "choices");
  assert.equal(matchSearch("something unrelated").kind, "fallback");
  assert.equal(matchSearch(" ").kind, "empty");
});

test("prompt Enter submits only outside Shift and IME composition", () => {
  assert.equal(shouldSubmitPrompt({ key: "Enter", shiftKey: false, isComposing: false }), true);
  assert.equal(shouldSubmitPrompt({ key: "Enter", shiftKey: true, isComposing: false }), false);
  assert.equal(shouldSubmitPrompt({ key: "Enter", shiftKey: false, isComposing: true }), false);
  assert.equal(shouldSubmitPrompt({ key: "Enter", shiftKey: false, isComposing: false, keyCode: 229 }), false);
});

test("all intent anchors exist in server-rendered pages", async () => {
  const { readFile } = await import("node:fs/promises");
  const routes = {
    "/": "src/app/page.tsx",
    "/technology": "src/app/technology/page.tsx",
    "/creative": "src/app/creative/page.tsx",
    "/business": "src/app/business/page.tsx",
  };
  for (const destination of searchDestinations) {
    const [route, anchor] = destination.href.split("#");
    const page = await readFile(routes[route], "utf8") + (route === "/technology" ? await readFile("src/i18n/dictionaries/id.ts", "utf8") : "");
    assert.ok(page.includes(anchor), destination.href);
  }
});
