import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import sharp from "sharp";

async function checkImage(bytes, size) {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, size); assert.equal(info.height, size);
  const colors = { orange: 0, lime: 0, blue: 0 };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const at = (y * size + x) * 4, [r, g, b, a] = data.subarray(at, at + 4);
    if (!x || !y || x === size - 1 || y === size - 1) assert.equal(a, 0, "transparent safe margin");
    if (a > 128) {
      if (r > 200 && g > 60 && g < 200 && b < 80) colors.orange++;
      if (g > 150 && b < 80 && r < 240) colors.lime++;
      if (b > 140 && r < 150) colors.blue++;
    }
  }
  for (const [color, count] of Object.entries(colors)) assert.ok(count > 0, `${size}px retains ${color}`);
}

test("App Router PNG icons retain official colors, sizes and transparent padding", async () => {
  for (const [file, size] of [["icon1.png", 32], ["icon2.png", 192], ["icon3.png", 512], ["apple-icon.png", 180]]) {
    await checkImage(await readFile(`src/app/${file}`), size);
  }
});
test("favicon ICO contains valid 16, 32 and 48px official PNG frames", async () => {
  const ico = await readFile("src/app/favicon.ico");
  assert.equal(ico.readUInt16LE(0), 0); assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const at = 6 + index * 16, length = ico.readUInt32LE(at + 8), offset = ico.readUInt32LE(at + 12);
    assert.equal(ico[at], size); assert.ok(offset + length <= ico.length);
    await checkImage(ico.subarray(offset, offset + length), size);
  }
});
