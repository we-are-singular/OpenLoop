// scripts/build-icons.js
import sharp from 'sharp';
import { createRequire } from 'module';
import { writeFile, unlink, readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const Potrace = require('potrace');
const pngToIcoMod = require('png-to-ico');
const pngToIco = pngToIcoMod.default || pngToIcoMod.imagesToIco || pngToIcoMod;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(ROOT, 'public');
const PRIMARY = '#6366f1';
const PRIMARY_RGB = { r: 99, g: 102, b: 241 };
const SOURCE = resolve(PUBLIC, 'openloop.png');
const TEMP = resolve(ROOT, '.tmp-trace.png');

// 1. Preprocess for tracing: greyscale + binary threshold
// Coral pixels (~grey 140) fall below threshold 200 → black (0)
// White pixels (255) stay above → white (255)
async function preprocessForTrace() {
  await sharp(SOURCE)
    .greyscale()
    .threshold(200)
    .toFile(TEMP);
  console.log('  preprocessed');
}

// 2. Trace binary PNG → SVG with potrace, recolored to primary
async function traceSVG() {
  const { width, height } = await sharp(SOURCE).metadata();
  const svg = await new Promise((res, rej) => {
    Potrace.trace(TEMP, { color: PRIMARY, background: 'transparent' }, (err, s) =>
      err ? rej(err) : res(s)
    );
  });
  // Fix dimensions: potrace outputs pt units, normalize to px with proper viewBox
  return svg
    .replace(/width="[\d.]+(?:pt)?"/, `width="${width}"`)
    .replace(/height="[\d.]+(?:pt)?"/, `height="${height}"`)
    .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${width} ${height}"`);
}

// 3. Render SVG at size → flatten on white bg
async function generatePNG(size, outPath) {
  const svgBuf = await readFile(resolve(PUBLIC, 'logo.svg'));
  await sharp(svgBuf)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(outPath);
  console.log(`  ${size}x${size} → ${outPath.replace(ROOT + '/', '')}`);
}

// 4. Bundle 16/32/48 PNGs into a multi-size favicon.ico
async function generateICO() {
  const svgBuf = await readFile(resolve(PUBLIC, 'logo.svg'));
  const buffers = await Promise.all(
    [16, 32, 48].map(size =>
      sharp(svgBuf)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toBuffer()
    )
  );
  const ico = await pngToIco(buffers);
  await writeFile(resolve(PUBLIC, 'favicon.ico'), ico);
  console.log('  favicon.ico');
}

async function main() {
  console.log('1/4  Preprocessing for trace...');
  await preprocessForTrace();

  console.log('2/4  Tracing SVG...');
  const svg = await traceSVG();
  await writeFile(resolve(PUBLIC, 'logo.svg'), svg);
  await writeFile(resolve(PUBLIC, 'favicon.svg'), svg);
  console.log('  logo.svg + favicon.svg');

  console.log('3/4  Generating PNGs...');
  await generatePNG(16,  resolve(PUBLIC, 'favicon-16x16.png'));
  await generatePNG(32,  resolve(PUBLIC, 'favicon-32x32.png'));
  await generatePNG(180, resolve(PUBLIC, 'apple-touch-icon.png'));
  await generatePNG(192, resolve(PUBLIC, 'icon-192.png'));
  await generatePNG(512, resolve(PUBLIC, 'icon-512.png'));

  console.log('4/4  Generating ICO...');
  await generateICO();

  try { await unlink(TEMP); } catch {}
  console.log('\n✓ Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
