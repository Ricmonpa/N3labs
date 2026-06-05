import sharp from "sharp";

const input = "../N3-LABS-SITE/N3 logos.jpg";

// Get image dimensions first
const meta = await sharp(input).metadata();
const halfHeight = Math.floor(meta.height / 2);

// Crop bottom half (dark version), then remove black background
const { data, info } = await sharp(input)
  .extract({ left: 0, top: halfHeight, width: meta.width, height: halfHeight })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Walk every pixel — make black/near-black transparent
const pixels = new Uint8ClampedArray(data);
const threshold = 30; // pixels darker than this in all channels → transparent

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  if (r < threshold && g < threshold && b < threshold) {
    pixels[i + 3] = 0; // fully transparent
  }
}

await sharp(pixels, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile("public/n3-logo.png");

console.log(`Done — ${info.width}×${info.height}px → public/n3-logo.png`);
