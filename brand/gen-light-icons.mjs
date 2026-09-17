/* Issue #15 — light home-screen icon set.
   Source: brand/app logo light.png (same FlowMD mark as the dark tile, on the
   white tile). Run from umu/ root:  node brand/gen-light-icons.mjs
   Regenerates: assets/icon-192.png, icon-512.png, icon-maskable-512.png,
   apple-touch-icon.png, favicon-48.png, icon.svg (embedded, self-contained).
*/
import sharp from 'sharp';
import { writeFileSync } from 'fs';

const SRC = 'brand/app logo light.png';

const PNG_OPTS = { palette: true, quality: 90, compressionLevel: 9 };

/* ---------- app icons from the white square tile ---------- */
async function genIcons() {
  for (const size of [192, 512]) {
    await sharp(SRC).resize(size, size).png(PNG_OPTS).toFile(`assets/icon-${size}.png`);
    console.log('icon →', `assets/icon-${size}.png`);
  }
  // Apple touch icon (opaque square, iOS rounds it)
  await sharp(SRC).resize(180, 180).png(PNG_OPTS).toFile('assets/apple-touch-icon.png');
  console.log('icon → assets/apple-touch-icon.png');

  // Maskable: content scaled into the 80% safe zone on the flat white bg
  const maskable = await sharp(SRC)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png().toBuffer();
  await sharp(maskable)
    .composite([{ input: await sharp(SRC).resize(410, 410).png().toBuffer(), gravity: 'centre' }])
    .png(PNG_OPTS).toFile('assets/icon-maskable-512.png');
  console.log('icon → assets/icon-maskable-512.png');
}

/* ---------- favicons + self-contained SVG favicon ---------- */
async function genRest() {
  await sharp(SRC).resize(48, 48).png(PNG_OPTS).toFile('assets/favicon-48.png');
  console.log('icon → assets/favicon-48.png');

  // SVG favicon: white rounded tile + the light "MD" mark embedded as PNG.
  // 410px content on the 512 tile mirrors the maskable 80% safe zone.
  const mark = await sharp(SRC).resize(410, 410).png().toBuffer();
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#fdfdfd"/>
  <image href="data:image/png;base64,${mark.toString('base64')}" x="51" y="51" width="410" height="410"/>
</svg>`;
  writeFileSync('icon.svg', faviconSvg);
  console.log('icon → icon.svg (light, embedded, self-contained)');
}

await genIcons();
await genRest();
console.log('done.');
