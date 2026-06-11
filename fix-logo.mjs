import sharp from "sharp";

const input = "public/n3-logo.png";

const meta = await sharp(input).metadata();
console.log("Input:", meta.width, "x", meta.height);

// Keep only the icon + "3" (top portion, above the wordmark text)
const iconHeight = 175;
// Two passes: sharp's fixed pipeline runs trim before extract, so they can't share one chain
const topHalf = await sharp(input)
  .extract({ left: 0, top: 0, width: meta.width, height: iconHeight })
  .png()
  .toBuffer();
const icon = await sharp(topHalf).trim().toBuffer();

const iconMeta = await sharp(icon).metadata();
console.log("Icon trimmed:", iconMeta.width, "x", iconMeta.height);

// Render the corrected wordmark as SVG text (crisp, correct spelling)
const textHeight = 64;
const canvasWidth = Math.max(iconMeta.width, 560);
const textSvg = `
<svg width="${canvasWidth}" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="46" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="bold"
        font-size="46" fill="#ffffff">Thinktech IA Laboratory</text>
</svg>`;
const text = await sharp(Buffer.from(textSvg)).png().toBuffer();

// Compose: icon centered on top, text below
const gap = 10;
const totalHeight = iconMeta.height + gap + textHeight;
await sharp({
  create: {
    width: canvasWidth,
    height: totalHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: icon, top: 0, left: Math.round((canvasWidth - iconMeta.width) / 2) },
    { input: text, top: iconMeta.height + gap, left: 0 },
  ])
  .png()
  .toFile("public/n3-logo-fixed.png");

console.log(`Done — ${canvasWidth}x${totalHeight} → public/n3-logo-fixed.png`);
