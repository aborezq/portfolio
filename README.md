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
script.js         — language and theme, opening sequence, scroll & pointer
                    effects, filters, certificate viewer, contact form
i18n.js           — the Arabic for every string on the page (see Languages)
lab.js            — the Lab: a k-nearest-neighbours classifier on a canvas
assets/
  profile-cutout.* — the portrait cut out of its backdrop (avif + webp)
  profile.jpg     — the original photo: fallback for old browsers, search preview
  og-card.jpg     — social preview card
  Mohammed_Awad_CV.pdf — the CV behind "Download CV"
  nashrati/       — six screens of the Nashrati app (see below)
  certs/          — one image per certificate, for the viewer and the hover preview
  fonts/          — Anton, Inter, Instrument Serif; for Arabic, Tajawal, Noto Kufi
                    Arabic and Aref Ruqaa; LICENSE.txt
robots.txt, sitemap.xml, CNAME
tests/            — Playwright smoke tests (dev only; nothing here is deployed)
```

## What's on the page

- **English and Arabic** — the switch in the top bar turns the whole site
  Arabic and right-to-left (see Languages).

- **Cover** — a magazine cover: the display word runs behind the portrait,
  which is cut out of its backdrop, so his head rises into the letters at
  every screen size. A pointer-driven depth and key light, and an opening
  count-up that plays once per visit. The cover is sized to the screen, so the
  name and both buttons are on the first screen from a 13" laptop to a phone;
  the rest of the page then slides up over it. To change the portrait, keep
  the same framing (head and shoulders, the top of the head about a tenth of
  the way down) with a transparent background, and replace both
  `profile-cutout` files.
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

The strip shows the set for the site's language. To refresh them, run that test in the app repository (and again with
`RENDER_DARK=1`), then crop and convert the chosen captures from
`build/screens/` to 640px-wide WebP.

## Languages

The page is written in English in `index.html`. Every visible string — and
every translatable `aria-label`, `alt` and `placeholder` — carries a key:

```html
<p class="hero-name" data-i18n="hero.name">Mohammed R. Awad</p>
<img … alt="Portrait of …" data-i18n-attr="alt:hero.photoAlt">
```

`i18n.js` holds the Arabic for each key, plus the strings only the scripts
write (form messages, the Lab's chart, menu labels) in both languages. To
change a translation, edit it there; to add text to the page, give the new
element a key and add its Arabic to `i18n.js` — the smoke tests fail if a key
has no Arabic.

How it behaves:

- The switch names the language it leads to, in that language («العربية» /
  English). The choice is remembered in `localStorage`, and the address carries
  it (`?lang=ar`), so a shared link opens in Arabic.
- An Arabic visit is resolved in the `<head>` before first paint (`lang="ar"`,
  `dir="rtl"`), and the page stays hidden until the Arabic is in, so English
  never flashes.
- Switching keeps the reader in the same place on the page and cross-fades
  where the browser supports View Transitions.
- Layout uses logical properties, so the whole design mirrors; Arabic text
  gets no letter-spacing (it breaks the joins) and more line height.
- Arabic fonts are limited to Arabic characters (`unicode-range`), so the
  English page never downloads them.
- Certificate titles stay in English — they are the issuers' own names.

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
form and its CSP, certificates, the Lab, and the language switch (including a
check that every marked string has its Arabic):

```bash
npm install
npm test
```

## Run locally

No tooling needed — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```
