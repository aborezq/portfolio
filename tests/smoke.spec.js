const { test, expect } = require("@playwright/test");

const SITE = "/";

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
  expect(errors).toEqual([]);
});

test("theme toggle flips the theme and remembers it", async ({ page }) => {
  await page.goto(SITE);
  const html = page.locator("html");

  const before = await html.getAttribute("data-theme");
  await page.click("#theme-toggle");
  const after = await html.getAttribute("data-theme");
  expect(after).not.toBe(before);

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", after);
});

for (const filter of ["all", "web", "ml", "java", "systems"]) {
  test(`filter "${filter}" leaves at least one project visible`, async ({ page }) => {
    await page.goto(SITE);
    await page.click(`.filter-btn[data-filter="${filter}"]`);

    expect(await page.locator(".project-card:not(.is-hidden)").count()).toBeGreaterThan(0);
    await expect(page.locator("#projects-empty")).toBeHidden();
  });
}

test("empty submit shows every field error and sends nothing", async ({ page }) => {
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

test("certificate group toggle expands", async ({ page }) => {
  await page.goto(SITE);
  const toggle = page.locator("#cert-toggle");

  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
});
