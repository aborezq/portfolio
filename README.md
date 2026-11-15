# Mohammed R. Awad — Portfolio

Personal portfolio website of **Mohammed R. Awad** — Computer Engineering
student (Intelligent Systems) at Al-Aqsa University, Gaza, Palestine, working
in **AI, Data Analytics and Machine Learning**.

Built entirely with **vanilla HTML, CSS and JavaScript** — no frameworks, no
build step, and no external asset requests on page load (fonts and images are
self-hosted).

## Structure

```
index.html        — semantic, accessible markup
style.css         — design tokens, layout, motion, light/dark themes
script.js         — theme, opening sequence, scroll & pointer effects, filters,
                    certificate viewer, contact form
lab.js            — the Lab: a k-nearest-neighbours classifier on a canvas
assets/
  profile.*       — portrait (jpg + webp)
  og-card.jpg     — social preview card
  Mohammed_Awad_CV.pdf — the CV behind "Download CV"
  nashrati/       — six screens of the Nashrati app (see below)
  certs/          — one image per certificate, for the viewer and the hover preview
  fonts/          — Anton, Inter, Instrument Serif, a Tajawal subset; LICENSE.txt
robots.txt, sitemap.xml, CNAME
tests/            — Playwright smoke tests (dev only; nothing here is deployed)
```

## What's on the page

- **Cover** — the display word layered through the portrait, a pointer-driven
  depth and key light, and an opening count-up that plays once per visit. The
  cover is sized to the screen, so the name and both buttons are on the first
  screen from a 13" laptop to a phone; the rest of the page then slides up
  over it.
- **Work** — Nashrati as the lead case study, then the other projects as a
  numbered list with category filters.
- **Lab** — the question behind the pattern-recognition research, made
  playable: the same customers, classified by k-NN in raw units or with
  standardized features, with live leave-one-out accuracy for both. Hover to
  see which neighbours are asked; click to add a customer.
- **Certificates** — 32 credentials grouped by program. Each name opens the
  certificate itself (with a mouse, it also follows the pointer down the list);
  each row links to the issuer's verification page.
- **Contact** — Formspree delivery, client-side validation, accessible status
  messages, a honeypot, and the local time in Gaza.

## Nashrati screens

The phone screens are rendered from the Nashrati app's own Flutter code by its
screen-capture test (`test/render_screens_test.dart` in the app repository,
which is private), so they show the real interface, not a mock-up:

- `assets/nashrati/ar/` — the app in Arabic, with its own sample data;
- `assets/nashrati/en/` — the same screens with the app switched to English
  and its sample reports and notifications translated (that translation was a
  local change for the renders only, not committed to the app);
- `assets/nashrati/splash.webp` — the launch screen, the same in both.

English is shown by default; the switch under the strip swaps in the Arabic
set. To refresh them, run that test in the app repository (and again with
`RENDER_DARK=1`), then crop and convert the chosen captures from
`build/screens/` to 640px-wide WebP.

## Accessibility and robustness

- Everything decorative is an enhancement. Without JavaScript the page is
  complete (the Lab says it needs JavaScript); with `prefers-reduced-motion`
  there is no opening sequence, pinned cover, parallax or count-up.
- The pointer ring, magnetic buttons and hover previews only exist for a mouse
  or trackpad; the system cursor is never hidden.
- Skip link, landmarks, visible focus, `aria-live` for the form and the Lab,
  keyboard-operable phone strip and Lab, and a native `<dialog>` viewer that
  returns focus on Escape.
- Light/dark theme follows `prefers-color-scheme`, remembers an explicit
  choice, and is resolved before first paint so nothing flashes.

## Deployment

The production URL is `https://mohammedawad.online/`. GitHub Pages reads the
root `CNAME` file to attach that custom domain, while Hostinger manages its DNS.
If the domain changes, update `CNAME`, the absolute URLs in `index.html`,
`robots.txt`, and `sitemap.xml` together.

`index.html` carries a Content-Security-Policy that allows the one inline
`<head>` script by its SHA-256 hash. After editing that script, recompute the
hash (the smoke tests fail with a console error if it no longer matches):

```bash
python3 -c "import re,hashlib,base64;s=open('index.html',encoding='utf-8').read();print(base64.b64encode(hashlib.sha256(re.search(r'<script>(.*?)</script>',s,re.S).group(1).encode()).digest()).decode())"
```

## Tests

Dev-only Playwright smoke tests cover the console, theme, filters, the contact
form and its CSP, certificates, the Nashrati screens switch and the Lab:

```bash
npm install
npm test
```

## Run locally

No tooling needed — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```
