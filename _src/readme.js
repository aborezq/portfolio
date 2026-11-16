// Renders the pictures of the GitHub profile README (github.com/aborezq) from
// the HTML in _src/readme/, in the site's own fonts, for GitHub's dark and
// light modes:
//   node _src/readme.js <profile repository>/assets
// CHROMIUM_PATH=/path/to/chromium uses a browser already on the machine.
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const out = path.resolve(process.argv[2] || "readme-assets");
const source = (name, params) => "file://" + path.join(__dirname, "readme", name) + "?" + new URLSearchParams(params);

// The site's section titles, numbered as on the page.
const titles = [
  ["about", "01", "About", "Built under pressure,<br><em>driven by curiosity.</em>"],
  ["work", "02", "Work", "Selected <em>work.</em>"],
  ["lab", "03", "Lab", "Same data.<br><em>Different answer.</em>"],
  ["skills", "04", "Skills", "Tools I <em>think in.</em>"],
  ["certs", "05", "Certificates", "Proof of <em>the reps.</em>"],
  ["contact", "06", "Contact", "Let's build <em>something.</em>"],
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const open = async (url, viewport) => {
    const page = await browser.newPage({ viewport });
    await page.goto(url, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return page;
  };

  for (const theme of ["dark", "light"]) {
    for (const [name, width, height] of [["cover", 1600, 720], ["nashrati", 1600, 800]]) {
      const page = await open(source(`${name}.html`, { theme }), { width, height });
      await page.screenshot({ path: path.join(out, `${name}-${theme}.jpg`), type: "jpeg", quality: 88 });
      await page.close();
    }
    // Titles are drawn at twice the size they are shown, on a transparent
    // background; the README sets each one's height to half of what is printed.
    for (const [slug, num, label, title] of titles) {
      const page = await open(source("title.html", { theme, num, label, title }), { width: 1600, height: 400 });
      const block = page.locator(".block");
      await block.screenshot({ path: path.join(out, `title-${slug}-${theme}.png`), omitBackground: true });
      if (theme === "dark") {
        const box = await block.boundingBox();
        console.log(`title-${slug}: ${Math.round(box.width)} x ${Math.round(box.height)}, show at height ${Math.round(box.height / 2)}`);
      }
      await page.close();
    }
  }

  await browser.close();
  console.log("README pictures written to", out);
})();
