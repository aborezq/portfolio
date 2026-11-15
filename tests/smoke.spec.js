const { test, expect } = require("@playwright/test");

const SITE = "/";

/* The opening sequence plays once per tab session. Tests about something else
   mark it as seen, so they start on a settled page; the first test below
   deliberately does not, so a first visit is covered too. */
const skipIntro = (page) =>
  page.addInitScript(() => {
    try {
      sessionStorage.setItem("intro-seen", "1");
    } catch {}
  });

/* Replaces fetch before any page script runs. Routing the real request instead
   would drag in a CORS preflight, since a cross-origin JSON POST is not a
   simple request - that makes the test fail for reasons unrelated to the site. */
const stubFetch = (page, { ok = true } = {}) =>
  page.addInitScript((succeed) => {
    window.__fetchCalls = 0;
    window.fetch = async () => {
      window.__fetchCalls += 1;
      return new Response("{}", { status: succeed ? 200 : 500 });
    };
  }, ok);

test("loads with no console errors and runs script.js to completion", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(SITE);

  // script.js is one flat top-level sequence, so a throw anywhere aborts every
  // later feature. These two assertions sit near its start and its very end.
  await expect(page.locator("#typed")).not.toBeEmpty();
  await expect(page.locator("#year")).toHaveText(String(new Date().getFullYear()));
  // The opening sequence finishes and hands over to the page.
  await expect(page.locator(".intro")).toHaveCount(0, { timeout: 8000 });
  await expect(page.locator("html")).not.toHaveClass(/intro-pending/);
  // lab.js ran too: both accuracies are filled in.
  await expect(page.locator("#lab-acc-raw")).toHaveText(/^\d+$/);
  await expect(page.locator("#lab-acc-std")).toHaveText(/^\d+$/);
  expect(errors).toEqual([]);
});

test("theme toggle flips the theme and remembers it", async ({ page }) => {
  await skipIntro(page);
  await page.goto(SITE);
  const html = page.locator("html");

  const before = await html.getAttribute("data-theme");
  const after = before === "dark" ? "light" : "dark";
  await page.click("#theme-toggle");
  // Applied inside a view transition, a frame after the click — so wait for it.
  await expect(html).toHaveAttribute("data-theme", after);

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", after);
});

for (const filter of ["all", "web", "ml", "java", "systems"]) {
  test(`filter "${filter}" leaves at least one project visible`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(SITE);
    await page.click(`.filter-btn[data-filter="${filter}"]`);

    expect(await page.locator(".project-card:not(.is-hidden)").count()).toBeGreaterThan(0);
    await expect(page.locator("#projects-empty")).toBeHidden();
  });
}

test("empty submit shows every field error and sends nothing", async ({ page }) => {
  await skipIntro(page);
  await stubFetch(page);
  await page.goto(SITE);

  await page.click("#cf-submit");

  // Exact text, because the bounds are derived from minlength/maxlength - if the
  // markup and the messages ever drift apart, these assertions catch it.
  await expect(page.locator("#cf-name-error")).toHaveText(
    "Please enter a name between 2 and 80 characters."
  );
  await expect(page.locator("#cf-email-error")).toHaveText("Please enter a valid email address.");
  await expect(page.locator("#cf-message-error")).toHaveText(
    "Please write a message between 10 and 2,000 characters."
  );
  expect(await page.evaluate(() => window.__fetchCalls)).toBe(0);
});

test("valid submit reports success and posts exactly once", async ({ page }) => {
  await skipIntro(page);
  await stubFetch(page);
  await page.goto(SITE);

  await page.fill("#cf-name", "Test Person");
  await page.fill("#cf-email", "test@example.com");
  await page.fill("#cf-message", "A message comfortably past the ten character minimum.");
  await page.click("#cf-submit");

  await expect(page.locator("#form-status")).toContainText("on its way");
  expect(await page.evaluate(() => window.__fetchCalls)).toBe(1);
});

/* Deliberately does NOT stub fetch. The real cross-origin request runs so the
   CSP connect-src check actually happens in the renderer; only the network
   response is faked. Guards against a policy that would break form delivery. */
test("CSP permits the real Formspree connection", async ({ page }) => {
  await skipIntro(page);
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations.push(`${e.violatedDirective} blocked ${e.blockedURI}`);
    });
  });
  await page.route("https://formspree.io/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "{}",
    })
  );

  await page.goto(SITE);
  await page.fill("#cf-name", "Test Person");
  await page.fill("#cf-email", "test@example.com");
  await page.fill("#cf-message", "A message comfortably past the ten character minimum.");
  await page.click("#cf-submit");

  await expect(page.locator("#form-status")).toContainText("on its way");
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
});

test("a closed certificate group opens", async ({ page }) => {
  await skipIntro(page);
  await page.goto(SITE);
  // Pinned by position: a `:not([open])` locator would move on to the next
  // closed group the moment this one opens.
  const index = await page.locator(".cert-group").evaluateAll((groups) => groups.findIndex((g) => !g.open));
  expect(index).toBeGreaterThan(-1);
  const group = page.locator(".cert-group").nth(index);

  await group.locator("summary").click();
  await expect(group).toHaveAttribute("open", "");
  await expect(group.locator(".cert-row").first()).toBeVisible();
});

test("a certificate opens in the viewer with its verify link, and Escape closes it", async ({ page }) => {
  await skipIntro(page);
  await page.goto(SITE);
  const row = page.locator(".cert-group[open] .cert-row").first();
  const verify = await row.locator(".cert-link").getAttribute("href");

  await row.locator(".cert-view").click();
  const viewer = page.locator("#lightbox");
  await expect(viewer).toBeVisible();
  await expect(page.locator("#lightbox-verify")).toHaveAttribute("href", verify);
  await expect(page.locator("#lightbox-img")).toHaveJSProperty("complete", true);

  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
});

test("Nashrati screens switch to Arabic and back to English", async ({ page }) => {
  await skipIntro(page);
  await page.goto(SITE);
  const shots = page.locator(".phone-screen img[data-shot]");
  await expect(shots).toHaveCount(5);
  for (const src of await shots.evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src")))) {
    expect(src).toContain("/en/");
  }

  await page.locator('.screens-lang label:has(input[value="ar"])').click();
  await expect(shots.first()).toHaveAttribute("src", /\/ar\//);
  for (const src of await shots.evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src")))) {
    expect(src).toContain("/ar/");
  }

  await page.locator('.screens-lang label:has(input[value="en"])').click();
  await expect(shots.last()).toHaveAttribute("src", /\/en\//);
});

test("the Lab rescores when the features are standardized", async ({ page }) => {
  await skipIntro(page);
  await page.goto(SITE);
  const raw = page.locator('.lab-readout [data-mode="raw"]');
  const std = page.locator('.lab-readout [data-mode="std"]');
  await expect(raw).toHaveClass(/is-active/);

  await page.locator('#lab-controls label:has(input[value="std"])').click();
  await expect(std).toHaveClass(/is-active/);
  await expect(raw).not.toHaveClass(/is-active/);
  // The point of the demo: on the default sample, scaling helps.
  const [r, s2] = await Promise.all([
    page.locator("#lab-acc-raw").textContent(),
    page.locator("#lab-acc-std").textContent(),
  ]);
  expect(Number(s2)).toBeGreaterThan(Number(r));
});
