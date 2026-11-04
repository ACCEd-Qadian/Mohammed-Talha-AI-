import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, getPixel) {
  // Simple uncompressed or deflate PNG generator
  // Scanline format: filter byte (0) + width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c ^ buf[i]) >>> 0;
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const out = Buffer.alloc(8 + len + 4);
  out.writeUInt32BE(len, 0);
  typeBuf.copy(out, 4);
  data.copy(out, 8);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = crc32(crcInput);
  out.writeUInt32BE(crc, 8 + len);
  return out;
}

// Pixel generator for TALHA AI icon
function getTalhaPixel(x, y, w, h, isMaskable = false) {
  // Center (cx, cy)
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background midnight blue / dark slate gradient
  const bgR = Math.floor(7 + (y / h) * 4);
  const bgG = Math.floor(10 + (y / h) * 6);
  const bgB = Math.floor(22 + (y / h) * 12);

  // If not maskable, round corner
  if (!isMaskable && dist > 1.35) {
    return [0, 0, 0, 0];
  }

  // Cyan and electric violet glow in center
  if (dist < 0.65) {
    const glow = 1 - (dist / 0.65);
    // Draw stylized 'T'
    // Horizontal bar: y in [-0.45, -0.25], x in [-0.55, 0.55]
    const inTopBar = (dy >= -0.42 && dy <= -0.22 && Math.abs(dx) <= 0.52);
    // Vertical stem: y in [-0.22, 0.45], x in [-0.12, 0.12]
    const inStem = (dy > -0.22 && dy <= 0.48 && Math.abs(dx) <= 0.12);
    // Diamond spark in center: |dx| + |dy + 0.05| <= 0.14
    const inSpark = (Math.abs(dx) + Math.abs(dy + 0.02) <= 0.15);

    if (inSpark) {
      return [255, 255, 255, 255];
    }
    if (inTopBar || inStem) {
      const grad = (dx + 1) / 2;
      const r = Math.floor(30 + grad * 110);
      const g = Math.floor(180 + (1 - grad) * 50);
      const b = 250;
      return [r, g, b, 255];
    }

    // Ambient radial glow
    const glowR = Math.floor(bgR + glow * 25);
    const glowG = Math.floor(bgG + glow * 80);
    const glowB = Math.floor(bgB + glow * 140);
    return [glowR, glowG, glowB, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

const png192 = createPng(192, 192, (x, y, w, h) => getTalhaPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

const png512 = createPng(512, 512, (x, y, w, h) => getTalhaPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

const pngMaskable = createPng(512, 512, (x, y, w, h) => getTalhaPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

const appleTouch = createPng(180, 180, (x, y, w, h) => getTalhaPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

// Favicon 32x32
const favicon = createPng(32, 32, (x, y, w, h) => getTalhaPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

console.log('All PWA icons generated successfully!');
