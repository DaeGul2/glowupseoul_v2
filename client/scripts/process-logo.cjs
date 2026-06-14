// One-off: make the logo's white background transparent + trim whitespace,
// so the rose-gold wordmark sits cleanly (no white box) and fills its height.
//   node scripts/process-logo.cjs
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SRC = path.resolve(__dirname, '..', 'public', 'glowup-logo.png');
const OUT = SRC; // overwrite

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width, height, data } = png;

// 1) near-white → transparent
const T = 244;
for (let i = 0; i < data.length; i += 4) {
  if (data[i] >= T && data[i + 1] >= T && data[i + 2] >= T) data[i + 3] = 0;
}

// 2) bounding box of visible pixels
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 10) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
const pad = 6;
minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad);
const w = maxX - minX + 1, h = maxY - minY + 1;

const out = new PNG({ width: w, height: h });
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const s = ((minY + y) * width + (minX + x)) * 4;
    const d = (y * w + x) * 4;
    out.data[d] = data[s]; out.data[d + 1] = data[s + 1];
    out.data[d + 2] = data[s + 2]; out.data[d + 3] = data[s + 3];
  }
}
fs.writeFileSync(OUT, PNG.sync.write(out));
console.log(`done: ${width}x${height} → ${w}x${h} (transparent + trimmed)`);
