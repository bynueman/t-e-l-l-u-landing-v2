import assert from "node:assert/strict";
import { test } from "node:test";
import * as id from "./dictionaries/id.ts";
import * as en from "./dictionaries/en.ts";
import { matchSearch } from "../lib/search-intents.ts";

function checkShape(original, translated, path = "dictionary") {
  assert.equal(typeof translated, typeof original, path);
  if (typeof original === "string") {
    assert.ok(translated.trim(), path);
    return;
  }
  assert.deepEqual(Object.keys(translated).sort(), Object.keys(original).sort(), path);
  for (const key of Object.keys(original)) checkShape(original[key], translated[key], `${path}.${key}`);
}
test("ID and EN contain matching keys, tuple lengths and nonempty strings", () => checkShape(id,en));
test("approved hero examples resolve without ambiguity", () => {
  for (const example of [...id.hero.examples, ...en.hero.examples]) assert.equal(matchSearch(example).kind, "direct", example);
});
test("translated Technology content preserves service and navigation anchors", () => {
  assert.deepEqual(id.technology.services.map(s => s[0]), en.technology.services.map(s => s[0]));
  assert.deepEqual(id.technology.nav.map(s => s[1]), en.technology.nav.map(s => s[1]));
});
