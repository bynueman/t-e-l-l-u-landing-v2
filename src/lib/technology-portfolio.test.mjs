import assert from "node:assert/strict";
import { test } from "node:test";
import { access } from "node:fs/promises";
import { technologyProjects } from "./technology-portfolio.ts";
test("portfolio retains source URLs, local assets and embedding exclusion", async () => {
  assert.equal(new Set(technologyProjects.map(p => p.id)).size, 4);
  assert.deepEqual(technologyProjects.map(p => new URL(p.url).hostname), ["yukeducation.co.id", "sukarindikjayaper.id", "cafegodigital.store", "intrax.web.id"]);
  for (const project of technologyProjects) {
    assert.equal(new URL(project.url).protocol, "https:");
    await access(`public${project.image}`);
  }
  assert.equal(technologyProjects.find(p => p.id === "intrax").embeddable, false);
  const intrax = technologyProjects.find(p => p.id === "intrax");
  assert.equal(intrax.previewStatus, "pending-server-permission");
  assert.equal(intrax.previewType, "remote-iframe");
  assert.equal(intrax.previewUrl, intrax.url);
  assert.equal(intrax.url, "https://intrax.web.id/");
});
