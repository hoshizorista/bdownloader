// Generate PNG icons for BDownloader Chrome Extension
// Run: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Simple PNG generator without external dependencies
// Creates a simple colored square icon with download arrow

function createPNG(size) {
  // PNG header
  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  // Helper to create a 32-bit big-endian integer
  const int32BE = (n) => [(n >> 24) & 0xFF, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];

  // Helper to create a 16-bit big-endian integer
  const int16BE = (n) => [(n >> 8) & 0xFF, n & 0xFF];

  // CRC32 calculation
  const crc32Table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    crc32Table[n] = c;
  }

  function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  // Create a chunk
  function createChunk(type, data) {
    const length = int32BE(data.length);
    const typeBytes = [...type].map(c => c.charCodeAt(0));
    const crc = int32BE(crc32([...typeBytes, ...data]));
    return [...length, ...typeBytes, ...data, ...crc];
  }

  // IHDR chunk
  const ihdr = [
    ...int32BE(size),  // width
    ...int32BE(size),  // height
    8,                  // bit depth
    6,                  // color type (RGBA)
    0,                  // compression
    0,                  // filter
    0                   // interlace
  ];

  // Create pixel data
  const rawData = [];

  // Color interpolation for gradient
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function getGradientColor(x, y) {
    const t = (x + y) / (2 * size);
    return {
      r: Math.round(lerp(102, 118, t)),  // #667eea to #764ba2
      g: Math.round(lerp(126, 75, t)),
      b: Math.round(lerp(234, 162, t)),
      a: 255
    };
  }

  // Check if point is inside rounded rectangle
  function inRoundedRect(px, py, w, h, r) {
    if (px < r && py < r) return Math.sqrt((px - r) ** 2 + (py - r) ** 2) <= r;
    if (px >= w - r && py < r) return Math.sqrt((px - (w - r)) ** 2 + (py - r) ** 2) <= r;
    if (px < r && py >= h - r) return Math.sqrt((px - r) ** 2 + (py - (h - r)) ** 2) <= r;
    if (px >= w - r && py >= h - r) return Math.sqrt((px - (w - r)) ** 2 + (py - (h - r)) ** 2) <= r;
    return true;
  }

  // Check if point is on arrow
  function isOnArrow(px, py) {
    const centerX = size / 2;
    const arrowWidth = size * 0.3;
    const arrowTop = size * 0.2;
    const arrowBottom = size * 0.55;
    const lineWidth = size * 0.12;

    // Vertical line
    if (Math.abs(px - centerX) < lineWidth && py >= arrowTop && py <= arrowBottom) {
      return true;
    }

    // Arrow head
    const headTop = arrowBottom - size * 0.2;
    if (py >= headTop && py <= arrowBottom) {
      const progress = (py - headTop) / (arrowBottom - headTop);
      const halfWidth = lineWidth + progress * arrowWidth;
      if (Math.abs(px - centerX) < halfWidth) {
        // Check if it's on the angled lines
        const relX = Math.abs(px - centerX);
        const expectedX = progress * arrowWidth;
        if (relX > lineWidth * 0.5 && Math.abs(relX - expectedX) < lineWidth) {
          return true;
        }
        if (relX <= lineWidth * 0.5) return true;
      }
    }

    return false;
  }

  // Check if point is on bottom bar
  function isOnBar(px, py) {
    const barHeight = size * 0.1;
    const barWidth = size * 0.5;
    const barY = size * 0.7;
    const centerX = size / 2;

    return py >= barY && py <= barY + barHeight &&
           px >= centerX - barWidth / 2 && px <= centerX + barWidth / 2;
  }

  // Generate pixels
  for (let y = 0; y < size; y++) {
    rawData.push(0); // Filter byte
    for (let x = 0; x < size; x++) {
      const radius = size * 0.15;
      const inRect = inRoundedRect(x, y, size, size, radius);

      if (!inRect) {
        rawData.push(0, 0, 0, 0); // Transparent
      } else {
        const color = getGradientColor(x, y);

        // Check for white elements (arrow or bar)
        if (isOnArrow(x, y) || isOnBar(x, y)) {
          rawData.push(255, 255, 255, 255);
        } else {
          rawData.push(color.r, color.g, color.b, color.a);
        }
      }
    }
  }

  // Compress with zlib (deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

  // Build PNG
  const png = [
    ...signature,
    ...createChunk('IHDR', ihdr),
    ...createChunk('IDAT', [...compressed]),
    ...createChunk('IEND', [])
  ];

  return Buffer.from(png);
}

// Generate icons
const iconsDir = path.join(__dirname, 'icons');

[16, 48, 128].forEach(size => {
  const png = createPNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
});

console.log('Icons generated successfully!');
