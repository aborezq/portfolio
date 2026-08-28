# Mohammed R. Awad — Portfolio

Personal portfolio website of **Mohammed R. Awad** — Computer Engineering
student (Intelligent Systems) at Al-Aqsa University, Gaza, Palestine, working
in **AI, Data Analytics and Machine Learning**.

Built entirely with **vanilla HTML, CSS and JavaScript** — no frameworks, no
build step, no external requests (fonts are self-hosted).

## Structure

```
index.html    — semantic, accessible markup
style.css     — custom properties, Grid/Flexbox, animations, light/dark themes
script.js     — ES6+: theme, typing effect, IntersectionObserver reveals, filters, validation
assets/       — portrait (jpg + webp), social card, self-hosted woff2 fonts (Anton, Inter)
robots.txt    — crawler policy
sitemap.xml   — single-page sitemap
```

## Features

- Cover-style hero: layered display type behind & in front of the portrait
- Light/dark theme: follows `prefers-color-scheme`, remembers an explicit
  choice, and is resolved before first paint so nothing flashes
- Animated typing effect cycling through roles
- Sticky nav, smooth scroll, active-section highlighting
- Progressive scroll-reveal animations that preserve visible content when
  JavaScript is unavailable
- Evidence-led skill groups instead of subjective percentage scores
- Featured-project hierarchy, live-demo links, and category filtering
- Collapsible certificate groups with issuer verification links
- Open Graph / Twitter card metadata so shared links render a preview
- Contact form: Formspree delivery, client-side validation, accessible status
  feedback, and a honeypot spam trap
- Contact channels: email, WhatsApp, GitHub, LinkedIn
- Fully responsive, mobile-first, hamburger menu
- Accessibility: skip link, ARIA labels, focus styles, `prefers-reduced-motion`

## Deployment

The production URL is `https://mohammedawad.online/`. GitHub Pages reads the
root `CNAME` file to attach that custom domain, while Hostinger manages its DNS.
If the domain changes, update `CNAME`, the absolute URLs in `index.html`,
`robots.txt`, and `sitemap.xml` together.

## Run locally

No tooling needed — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```
