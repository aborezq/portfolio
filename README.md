# Mohammed R. Awad — Portfolio

Personal portfolio website of **Mohammed R. Awad** — a senior in Intelligent
Systems and Computer Engineering at Al-Aqsa University, Gaza, Palestine,
working in **AI, Data Analytics and Machine Learning**.

Built entirely with **vanilla HTML, CSS, and JavaScript** — no frameworks, no
build step, and no external asset requests on page load (fonts and images are
self-hosted).

## Structure

```
index.html        — semantic, accessible markup
style.css         — design tokens, layout, motion, light/dark themes
script.js         — language and theme, opening sequence, scroll & pointer
                    effects, filters, certificate viewer, contact form
i18n.js           — the Arabic for every string on the page (see Languages)
lab.js            — the Lab: a k-nearest-neighbors classifier on a canvas
assets/
  profile-cutout.* — the portrait cut out of its backdrop (avif + webp)
  profile.jpg     — the original photo: fallback for old browsers, search preview
  og-card.jpg     — the picture a shared link shows (built from _src/)
  Mohammed_Awad_CV.pdf — the CV behind "Download CV" (built from _src/)
  nashrati/       — six screens of the Nashrati app (see below)
  socialty/       — the Socialty website's first screen, in English and Arabic
  solar-power/    — the Solar Power website's first screen, in English and Arabic
                    (site-en/site-ar.webp; i18n.js swaps them with the language)
  certs/          — one image per certificate, for the viewer and the hover preview
  fonts/          — Anton, Inter, Instrument Serif; for Arabic, Tajawal, Noto Kufi
                    Arabic and Aref Ruqaa; LICENSE.txt
404.html          — GitHub Pages' page for a missing address (English + Arabic)
404-theme.js      — puts that page in the visitor's theme (light or dark)
favicon.svg       — the site icon: the "M" of the nav logo, in Anton
favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png
                  — the same icon as PNG/ICO, for search results and home screens
                    (built from favicon.svg by _src/icons.js)
site.webmanifest  — names the site and points Android home screens at icon-192/512
robots.txt, sitemap.xml, CNAME
_src/             — sources of the CV and the link preview (build.js), the icons
                    (icons.js) and the GitHub profile pictures (not published: see below)
tests/            — Playwright smoke tests (dev only; the site never loads them)
```

## What's on the page

- **English and Arabic** — the switch in the top bar turns the whole site
  Arabic and right-to-left (see Languages).

- **Cover** — a magazine cover: the display word runs behind the portrait,
  which is cut out of its backdrop, so his head rises into the letters at
  every screen size. A pointer-driven depth and key light, and an opening
  count-up that plays once per visit. The cover is sized to the screen, so the
  name and both buttons are on the first screen from a 13" laptop to a phone
  held upright: on a phone the portrait gives up height first, and on the
  smallest (320 × 568) the typed line steps aside as well. (Checked in English
  and Arabic at 1280 × 720 and 1440 × 900, and at phone sizes from 320 × 568 to
  430 × 739; a shorter window, such as an iPhone SE with Safari's bars showing
  at 375 × 548, scrolls by up to 15px.) The rest of the page then slides up
  over it. To change the portrait, keep the same framing (head and shoulders,
  the top of the head about a tenth of the way down) with a transparent
  background, and replace both `profile-cutout` files.
- **Work** — Nashrati as the lead case study, then the other projects as a
  numbered list with category filters.
- **Lab** — the question behind the pattern-recognition research, made
  playable: the same customers, classified by k-NN in raw units or with
  standardized features, with live leave-one-out accuracy for both. Hover to
  see which neighbors are asked; click to add a customer. From the keyboard,
  the arrow keys move the same probe and Enter adds a customer under it.
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
  English page downloads only a 2.4 KB Tajawal subset for the two Arabic words
  it shows («العربية» and «نشرتي»).
- Certificate titles stay in English — they are the issuers' own names.

## Accessibility and robustness

- Everything decorative is an enhancement. Without JavaScript the page is
  complete (the Lab says it needs JavaScript); with `prefers-reduced-motion`
  there is no opening sequence, pinned cover, parallax or count-up.
- The pointer ring, magnetic buttons and hover previews only exist for a mouse
  or trackpad; the system cursor is never hidden.
- Skip link, landmarks, visible focus, `aria-live` for the form and the Lab,
  keyboard-operable phone strip and Lab, and a native `<dialog>` certificate
  viewer that holds the page still behind it and returns focus on Escape.
- Light/dark theme follows `prefers-color-scheme`, remembers an explicit
  choice, and is resolved before first paint so nothing flashes.

## Deployment

The production URL is `https://mohammedawad.online/`. GitHub Pages reads the
root `CNAME` file to attach that custom domain, while Hostinger manages its DNS.
If the domain changes, update `CNAME`, the absolute URLs in `index.html`,
`robots.txt`, and `sitemap.xml` together. Whenever the page's content changes,
update `<lastmod>` in `sitemap.xml` to the date of that change.

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

## CV and link preview

`assets/Mohammed_Awad_CV.pdf` and `assets/og-card.jpg` are built from HTML in
`_src/`, in the site's own fonts, so they stay in step with the page:

```
npm install && npx playwright install chromium   # once
node _src/build.js
```

Edit `_src/cv.html` (A4, one column, real text, so applicant-tracking systems
read it in order) or `_src/og-card.html` (1200 × 630), then rebuild. GitHub
Pages does not publish folders whose names start with `_`. After changing the
preview picture, bump the `?v=` on `og:image` and `twitter:image` in
`index.html`, so apps that cached the old one fetch it again.

The site icons come from `favicon.svg` the same way. After changing it, run
`node _src/icons.js` to rebuild `favicon.ico` (16, 32 and 48 px),
`apple-touch-icon.png` (180 px) and `icon-192.png` / `icon-512.png`.

The pictures of the GitHub profile README ([github.com/aborezq](https://github.com/aborezq)),
its cover, Nashrati card and section titles, in dark and light, come from
`_src/readme/` the same way; its Lab picture is taken from this page's own Lab,
as it opens, without the hover hint. The script prints the width to show each
title at (titles are sized by width in the README, so phones scale them):

```
node _src/readme.js ../aborezq/assets
```

It also types the site's Arabic roles («أنا …») frame by frame into a GIF, since
GitHub cannot run the site's script; that step needs Python 3 with Pillow and
NumPy (`_src/readme_gif.py`).

