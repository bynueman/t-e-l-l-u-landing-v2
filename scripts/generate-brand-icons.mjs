import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = "public/brand/tellu-logo.png";
const metadata = await sharp(source).metadata();
assert.ok(metadata.hasAlpha && metadata.width && metadata.height, "official symbol must have transparency");

async function icon(size) {
  const margin = Math.max(1, Math.round(size * .06));
  const image = await sharp(source)
    .resize(size - margin * 2, size - margin * 2, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: margin, right: margin, bottom: margin, left: margin, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, size); assert.equal(info.height, size); assert.equal(data[3], 0);
  return image;
}

for (const [file, size] of [["icon1.png", 32], ["icon2.png", 192], ["icon3.png", 512], ["apple-icon.png", 180]]) {
  await writeFile(`src/app/${file}`, await icon(size));
}
// ICO supports PNG frames; no separate image conversion dependency is needed.
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(icon));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const at = 6 + index * 16;
  header[at] = sizes[index]; header[at + 1] = sizes[index];
  header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(frame.length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += frame.length;
});
const ico = Buffer.concat([header, ...frames]);
assert.equal(ico.readUInt16LE(4), 3);
assert.equal(ico.readUInt32LE(6 + 2 * 16 + 12) + frames[2].length, ico.length);
await writeFile("src/app/favicon.ico", ico);
console.log(`Generated TELLU icons from ${metadata.width}x${metadata.height} transparent official symbol.`);
