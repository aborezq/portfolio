# Mohammed R. Awad — Portfolio

Personal portfolio website of **Mohammed R. Awad** — Front-End Developer and
Computer Engineering student (Intelligent Systems) at Al-Aqsa University,
Gaza, Palestine.

Built entirely with **vanilla HTML, CSS and JavaScript** — no frameworks, no
build step, no external requests (fonts are self-hosted).

## Structure

```
index.html    — semantic, accessible markup
style.css     — custom properties, Grid/Flexbox, animations, light/dark themes
script.js     — ES6+: theme, typing effect, IntersectionObserver reveals, filters, validation
assets/       — profile photo + self-hosted woff2 fonts (Anton, Inter)
```

## Features

- Cover-style hero: layered display type behind & in front of the portrait
- Light/dark theme: follows `prefers-color-scheme`, remembers an explicit
  choice, and is resolved before first paint so nothing flashes
- Animated typing effect cycling through roles
- Sticky nav, smooth scroll, active-section highlighting
- Scroll-reveal animations and animated skill bars (IntersectionObserver)
- Project filtering (All / Web / ML & Data / Java / Systems & Networks)
- Certificates section: 12 credentials, with Coursera verification links
- Contact form: client-side validation, honeypot spam trap, and a JSON POST to a
  configurable endpoint (`FORM_ENDPOINT` in `script.js`). Falls back to a
  `mailto:` handoff while that is unset
- Contact channels: email, WhatsApp, GitHub, LinkedIn
- Fully responsive, mobile-first, hamburger menu
- Accessibility: skip link, ARIA labels, focus styles, `prefers-reduced-motion`

## Run locally

No tooling needed — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```
