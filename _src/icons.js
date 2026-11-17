// Renders the site icons from favicon.svg (the "M" of the nav logo, in Anton):
//   favicon.ico (16, 32, 48), apple-touch-icon.png (180), icon-192.png, icon-512.png
//   node _src/icons.js
//
// CHROMIUM_PATH=/path/to/chromium uses a browser already on the machine (as in build.js).
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
// iOS and Android round the corners themselves, so their icons are full squares.
const square = fs.readFileSync(path.join(root, "favicon.svg"), "utf8").replace(/ rx="\d+"/, "");
const rounded = fs.readFileSync(path.join(root, "favicon.svg"), "utf8");

// An .ico is a 6-byte header, a 16-byte entry per image, then the PNGs themselves.
const ico = (pngs) => {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    head.writeUInt8(size % 256, at);
    head.writeUInt8(size % 256, at + 1);
    head.writeUInt16LE(1, at + 4);
    head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(data.length, at + 8);
    head.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.data)]);
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  const render = async (svg, size) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
    return page.screenshot({ omitBackground: true });
  };
  for (const [file, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
    fs.writeFileSync(path.join(root, file), await render(square, size));
  }
  const small = [];
  for (const size of [16, 32, 48]) small.push({ size, data: await render(rounded, size) });
  fs.writeFileSync(path.join(root, "favicon.ico"), ico(small));
  await browser.close();
  console.log("built favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png");
})();
