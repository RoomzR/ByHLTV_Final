import fs from "fs";
import path from "path";
import sharp from "sharp";

const dir = "presentation/screens";
const out = "presentation/screens/figma-fit";
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(dir).filter((f) => /^\d.*\.png$/.test(f)).sort();
console.log("source", files.length);
const W = 1920;
const H = 1080;
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  const meta = await sharp(buf).metadata();
  const scale = Math.min(W / meta.width, H / meta.height);
  const nw = Math.round(meta.width * scale);
  const nh = Math.round(meta.height * scale);
  const resized = await sharp(buf).resize(nw, nh).png().toBuffer();
  await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 18, g: 18, b: 18 } },
  })
    .composite([{ input: resized, left: Math.round((W - nw) / 2), top: Math.round((H - nh) / 2) }])
    .png()
    .toFile(path.join(out, f));
  console.log("ok", f, `${meta.width}x${meta.height} -> fit`);
}
console.log("done", files.length);
