# Mohammed R. Awad — Portfolio

Personal portfolio website of **Mohammed R. Awad** — Computer Engineering
student (Intelligent Systems) at Al-Aqsa University, Gaza, Palestine, working
in **AI, Data Analytics and Machine Learning**.

Built entirely with **vanilla HTML, CSS and JavaScript** — no frameworks, no
build step, no external requests (fonts and images are self-hosted).

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
  nashrati/       — six screens of the Nashrati app (see below)
  certs/          — one image per certificate, for the viewer and the hover preview
  fonts/          — Anton, Inter, Instrument Serif, a Tajawal subset; LICENSE.txt
robots.txt, sitemap.xml
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

`assets/nashrati/*.webp` are rendered from the Nashrati app's own Flutter code
by its screen-capture test (`test/render_screens_test.dart` in the app
repository, which is private), with the fixture data that test uses — so
they show the real interface, not a mock-up. To refresh them, run that test
in the app repository (and again with `RENDER_DARK=1`), then crop and convert
the chosen captures from `build/screens/` to 640px-wide WebP.

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

The absolute URLs in `index.html` (`canonical`, `og:url`, `og:image`),
`robots.txt` and `sitemap.xml` all assume the GitHub Pages project site at
`https://aborezq.github.io/portfolio/`. Update all three files together if the
site moves to a custom domain.

Note that GitHub Pages only serves `robots.txt` from the *domain* root, so on a
project site the file is decorative until a custom domain is attached — submit
`sitemap.xml` to Google Search Console directly in the meantime.

## Run locally

No tooling needed — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```
