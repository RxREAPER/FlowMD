/* Issue #5 asset generation — run from umu/ root:  node brand/gen-assets.mjs
   Sources (renamed by the user in brand/):
   - "app logo, dark .png"                              → app icons (square, black tile)
   - "topbar app name left side lightn mode adaptable.png" → nav logo light (white bg keyed out)
   - "topbar app name left, dark adaptable.png"         → nav logo dark (dark bg keyed out)
   - "logo,app main alternative.png"                    → spare (transparent, kept as-is)
   Outputs into assets/ (and root icon.svg / favicon.svg).
*/
import sharp from 'sharp';
import { mkdirSync, writeFileSync, renameSync } from 'fs';

const SRC = {
  icon: 'brand/app logo, dark .png',
  navLight: 'brand/topbar app name left side lightn mode adaptable.png',
  navDark: 'brand/topbar app name left, dark adaptable.png',
  alt: 'brand/logo,app main alternative.png',
};

mkdirSync('assets', { recursive: true });

const PNG_OPTS = { palette: true, quality: 90, compressionLevel: 9 };

/* ---------- keying: remove flat background, hard-protect artwork ---------- */
async function keyBackground(src, isDarkBg, outPath) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // distance from flat bg (white 255,255,255 / dark #0b0f19-ish)
      const bg = isDarkBg ? [7, 10, 15] : [255, 255, 255];
      const d = Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2);
      // very generous artwork-protection thresholds (nothing within 34 of bg)
      let a;
      if (isDarkBg) {
        if (d > 34) a = 255;            // definitely artwork
        else if (d < 16) a = 0;         // definitely background
        else a = Math.round(((d - 16) / 18) * 255);
      } else {
        if (d < 30) a = 0;              // definitely background
        else if (d > 48) a = 255;       // definitely artwork
        else a = Math.round(((d - 30) / 18) * 255);
      }
      const o = (y * W + x) * 4;
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
    }
  }
  const trimmed = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 1 })
    .png(PNG_OPTS)
    .toBuffer();
  const meta = await sharp(trimmed).metadata();
  await sharp(trimmed).toFile(outPath);
  console.log('keyed →', outPath, meta.width + 'x' + meta.height);
  return meta;
}

/* ---------- app icons from the black square tile ---------- */
async function genIcons() {
  // Square "any" icons (tile has its own rounded-square black background)
  for (const size of [192, 512]) {
    await sharp(SRC.icon).resize(size, size).png(PNG_OPTS).toFile(`assets/icon-${size}.png`);
    console.log('icon →', `assets/icon-${size}.png`);
  }
  // Apple touch icon (opaque square, iOS rounds it)
  await sharp(SRC.icon).resize(180, 180).png(PNG_OPTS).toFile('assets/apple-touch-icon.png');
  console.log('icon → assets/apple-touch-icon.png');
  // Maskable: content scaled into the 80% safe zone on the flat black bg
  const maskable = await sharp(SRC.icon)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png().toBuffer();
  await sharp(maskable)
    .composite([{ input: await sharp(SRC.icon).resize(410, 410).png().toBuffer(), gravity: 'centre' }])
    .png(PNG_OPTS).toFile('assets/icon-maskable-512.png');
  console.log('icon → assets/icon-maskable-512.png');
}

/* ---------- favicons + nav logo pair ---------- */
async function genRest() {
  // Favicon PNG fallback (square tile downscaled reads fine at 48px)
  await sharp(SRC.icon).resize(48, 48).png(PNG_OPTS).toFile('assets/favicon-48.png');
  console.log('icon → assets/favicon-48.png');

  // SVG favicon: black rounded tile + "MD" wordmark lockup cropped from the transparent alternative
  const md = await sharp(SRC.alt).trim({ threshold: 1 }).toBuffer();
  const mdMeta = await sharp(md).metadata();

  const mdResized = await sharp(md).resize(448, Math.round((mdMeta.height / mdMeta.width) * 448)).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#050505"/>
  <image href="data:image/png;base64,${mdResized.toString('base64')}" x="${(512 - 448) / 2}" y="${(512 - Math.round((mdMeta.height / mdMeta.width) * 448)) / 2}" width="448" height="${Math.round((mdMeta.height / mdMeta.width) * 448)}"/>
</svg>`;
  writeFileSync('icon.svg', faviconSvg);
  console.log('icon → icon.svg (embedded, self-contained)');

  // Nav logo pair: height 96px (2x for ~48px display), transparent
  const mkNav = async (src, isDark, out) => {
    const keyed = await keyBackground(src, isDark, out);
    await sharp(out).resize({ height: 96 }).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(out + '.tmp');
    renameSync(out + '.tmp', out);
    console.log('nav →', out, '(resized to h96, was ' + keyed.width + 'x' + keyed.height + ')');
  };
  await mkNav(SRC.navLight, false, 'assets/logo-light.png');
  await mkNav(SRC.navDark, true, 'assets/logo-dark.png');
}

await genIcons();
await genRest();
console.log('done.');
