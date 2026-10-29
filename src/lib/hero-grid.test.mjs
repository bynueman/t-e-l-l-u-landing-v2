import assert from "node:assert/strict";
import { test } from "node:test";
import { deformPixel, pixelFills } from "./hero-grid.ts";

test("pixel field stays aligned outside the local influence and when settled", () => {
  for (const point of [[0, 0, 0, 0, 1, 160], [200, 50, 0, 0, 1, 160], [30, 40, 0, 0, 0, 160]]) {
    assert.deepEqual(deformPixel(...point), { x: 0, y: 0, rotation: 0, opacity: 0 });
  }
});
test("pixel deformation swirls, falls off smoothly, and remains bounded", () => {
  const near = deformPixel(20, 0, 0, 0, 1, 160);
  const far = deformPixel(150, 0, 0, 0, 1, 160);
  assert.ok(near.y > near.x * 3, "tangential motion dominates radial pressure");
  assert.ok(Math.hypot(near.x, near.y) > 5);
  assert.ok(Math.hypot(near.x, near.y) < 12);
  assert.ok(Math.hypot(far.x, far.y) < .3);
  assert.equal(deformPixel(20, 0, 0, 0, .5, 160).y, near.y / 2);
  assert.equal(new Set(pixelFills.map(([x, y]) => `${x}:${y}`)).size, pixelFills.length);
});
