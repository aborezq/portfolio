// Renders the CV and the link-preview image from their HTML sources:
//   assets/Mohammed_Awad_CV.pdf  <- _src/cv.html
//   assets/og-card.jpg           <- _src/og-card.html
//
//   npm install && npx playwright install chromium   (once)
//   node _src/build.js
//
// CHROMIUM_PATH=/path/to/chromium uses a browser already on the machine.
// The folder starts with "_", so GitHub Pages does not publish it.
const path = require("path");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const source = (name) => "file://" + path.join(__dirname, name);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

  const cv = await browser.newPage();
  await cv.goto(source("cv.html"), { waitUntil: "load" });
  await cv.evaluate(() => document.fonts.ready);
  await cv.pdf({ path: path.join(root, "assets/Mohammed_Awad_CV.pdf"), preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });

  const card = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await card.goto(source("og-card.html"), { waitUntil: "load" });
  await card.evaluate(() => document.fonts.ready);
  await card.screenshot({ path: path.join(root, "assets/og-card.jpg"), type: "jpeg", quality: 90 });

  await browser.close();
  console.log("built assets/Mohammed_Awad_CV.pdf and assets/og-card.jpg");
})();
