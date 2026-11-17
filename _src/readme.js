// Renders the pictures of the GitHub profile README (github.com/aborezq) from
// the HTML in _src/readme/, in the site's own fonts, for GitHub's dark and
// light modes; the Lab picture is taken from the site itself (index.html):
//   node _src/readme.js <profile repository>/assets
// CHROMIUM_PATH=/path/to/chromium uses a browser already on the machine.
const fs = require("fs");
const http = require("http");
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

  // The site is served over HTTP for the Lab picture, as its Content-Security-Policy
  // expects (a file:// page has no origin to match 'self').
  const root = path.resolve(__dirname, "..");
  const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2",
    ".svg": "image/svg+xml", ".webp": "image/webp", ".avif": "image/avif", ".jpg": "image/jpeg", ".png": "image/png" };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.join(root, path.normalize(rel === "/" ? "/index.html" : rel));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const site = `http://127.0.0.1:${server.address().port}/`;

  for (const theme of ["dark", "light"]) {
    // The Lab as it opens (its first sample is seeded, so every render deals the
    // same customers), in raw units, without the hover hint: on GitHub the
    // picture can't be explored, it only links to the Lab.
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(site + "index.html#lab", { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // (The page's Content-Security-Policy refuses an injected stylesheet, so
      // the hint and the floating back-to-top button are hidden through the DOM.)
      const hide = () => ["lab-hint", "back-to-top"].forEach((id) => { document.getElementById(id).style.display = "none"; });
      const stage = page.locator(".lab-stage");
      await stage.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      await page.evaluate(hide);
      await stage.screenshot({ path: path.join(out, `lab-${theme}.jpg`), type: "jpeg", quality: 88 });
      await context.close();
    }

    for (const [name, width, height] of [["cover", 1600, 720], ["nashrati", 1600, 800]]) {
      const page = await open(source(`${name}.html`, { theme }), { width, height });
      await page.screenshot({ path: path.join(out, `${name}-${theme}.jpg`), type: "jpeg", quality: 88 });
      await page.close();
    }
    // Titles are drawn at twice the size they are shown, on a transparent
    // background; the README sets each one's width to half of what is printed
    // (a width, not a height, so a narrow phone scales a title instead of
    // squeezing it).
    for (const [slug, num, label, title] of titles) {
      const page = await open(source("title.html", { theme, num, label, title }), { width: 1600, height: 400 });
      const block = page.locator(".block");
      await block.screenshot({ path: path.join(out, `title-${slug}-${theme}.png`), omitBackground: true });
      if (theme === "dark") {
        const box = await block.boundingBox();
        console.log(`title-${slug}: ${Math.round(box.width)} x ${Math.round(box.height)}, show at width ${Math.round(box.width / 2)}`);
      }
      await page.close();
    }

    // The Arabic typed line, frame by frame with the site's own timing
    // (script.js §8): type 90 ms a letter, hold 1.8 s with the caret
    // blinking, delete 45 ms a letter, 350 ms before the next role.
    const page = await browser.newPage({ viewport: { width: 520, height: 44 }, deviceScaleFactor: 2 });
    await page.goto(source("roles-ar.html", { theme }), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const roles = await page.evaluate(() => window.ROLES);
    const framesDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "roles-ar-"));
    const plan = [];
    const frame = async (text, caretOn, ms) => {
      await page.evaluate(([t, c]) => window.show(t, c), [text, caretOn]);
      const name = `frame-${String(plan.length).padStart(3, "0")}.png`;
      await page.screenshot({ path: path.join(framesDir, name) });
      plan.push([name, ms]);
    };
    for (const word of roles) {
      for (let i = 1; i <= word.length; i++) await frame(word.slice(0, i), true, 90);
      for (const [on, ms] of [[false, 500], [true, 500], [false, 500], [true, 300]]) await frame(word, on, ms);
      for (let i = word.length - 1; i >= 0; i--) await frame(word.slice(0, i), true, 45);
      await frame("", true, 350);
    }
    const colours = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      return { bg: css.getPropertyValue("--bg").trim(), inks: [css.getPropertyValue("--gold").trim(), css.getPropertyValue("--muted").trim()] };
    });
    fs.writeFileSync(path.join(framesDir, "frames.json"), JSON.stringify({ ...colours, frames: plan }));
    await page.close();
    const gif = path.join(out, `roles-ar-${theme}.gif`);
    const made = require("child_process").spawnSync("python3", [path.join(__dirname, "readme_gif.py"), framesDir, gif], { stdio: "inherit" });
    if (made.status !== 0) console.log(`roles-ar-${theme}.gif needs Python 3 with Pillow; frames are in ${framesDir}`);
  }

  await browser.close();
  server.close();
  console.log("README pictures written to", out);
})();
