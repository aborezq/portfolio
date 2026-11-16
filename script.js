/* ==========================================================================
   Mohammed R. Awad — Portfolio
   Vanilla ES6+: DOM APIs, IntersectionObserver, no dependencies.

   Contents
     0. Shared helpers and the two loops     9. Reveal on scroll
     1. Language, theme                     10. Nashrati phone strip
     2. Opening sequence                    11. Counters and the Gaza clock
     3. Split headings, scrubbed text       12. Project filtering
     4. Scroll-linked chrome and the cover  13. Certificate viewer and preview
     5. Marquees                            14. Contact form
     6. Pointer: ring, depth, light         15. Footer year
     7. Magnetic buttons
     8. Typing effect, menu, active link    16. The language switch

   Everything decorative is an enhancement: it is skipped under
   prefers-reduced-motion and on touch where it needs a pointer, and the page
   reads the same with this file missing (see the .js notes in style.css).
   ========================================================================== */
"use strict";

/* --------------------------------------------------------------------------
   0. Shared helpers and the two loops
   -------------------------------------------------------------------------- */
const rootEl = document.documentElement;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const hasObserver = "IntersectionObserver" in window;

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const lerp = (from, to, amount) => from + (to - from) * amount;

/* Frame loop — for things that ease toward a target (the pointer ring, the
   cover's depth, the marquees). A task returns true while it still has work;
   when none does, the loop stops, and wake() starts it again. */
const frameTasks = new Set();
let frameId = 0;
let lastFrame = 0;
const runFrame = (now) => {
  frameId = 0;
  const elapsed = lastFrame ? Math.min(50, now - lastFrame) : 16.7;
  lastFrame = now;
  let busy = false;
  frameTasks.forEach((task) => {
    if (task(elapsed) === true) busy = true;
  });
  if (busy) frameId = requestAnimationFrame(runFrame);
  else lastFrame = 0;
};
const wake = () => {
  if (!frameId) frameId = requestAnimationFrame(runFrame);
};

/* Scroll loop — one passive listener, the work deferred to the next frame. */
const scrollTasks = [];
let scrollQueued = false;
const runScroll = () => {
  scrollQueued = false;
  const y = window.scrollY;
  const viewport = window.innerHeight;
  scrollTasks.forEach((task) => task(y, viewport));
};
const queueScroll = () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(runScroll);
};
window.addEventListener("scroll", queueScroll, { passive: true });
window.addEventListener("resize", queueScroll);

/* --------------------------------------------------------------------------
   1. Language — the page is written in English and i18n.js carries the
      Arabic. For an Arabic visitor the <head> script already turned the page
      right-to-left before first paint, and hid it so English never flashes;
      the Arabic goes in here, before anything below splits text into words.
      Each section that renders text of its own adds a hook to langHooks,
      run whenever the language changes (§16).
   -------------------------------------------------------------------------- */
const I18N = window.I18N;
const t = (key, vars) => I18N.t(key, vars);
let lang = rootEl.lang === "ar" ? "ar" : "en";
const langHooks = [];

// The English of everything translatable, read once as it was written.
const i18nNodes = [...document.querySelectorAll("[data-i18n], [data-i18n-attr]")].map((el) => ({
  el,
  key: el.dataset.i18n || null,
  html: el.dataset.i18n ? el.innerHTML : null,
  attrs: (el.dataset.i18nAttr || "").split(",").filter(Boolean).map((pair) => {
    const [name, key] = pair.split(":").map((part) => part.trim());
    return { name, key, en: el.getAttribute(name) };
  }),
}));

const translatePage = (next) => {
  i18nNodes.forEach(({ el, key, html, attrs }) => {
    if (key) {
      const value = next === "ar" ? I18N.ar[key] : html;
      if (value !== undefined) el.innerHTML = value;
    }
    attrs.forEach(({ name, key: attrKey, en }) => {
      const value = next === "ar" ? I18N.ar[attrKey] : en;
      if (value !== undefined && value !== null) el.setAttribute(name, value);
    });
  });
  document.title = t("title");
};

// The switch names the language it leads to, in that language.
const langToggle = document.getElementById("lang-toggle");
const syncLangToggle = () => {
  const other = lang === "ar" ? "en" : "ar";
  langToggle.lang = other;
  langToggle.textContent = other === "ar" ? "العربية" : "English";
};

const setLang = (next) => {
  lang = next;
  rootEl.lang = next;
  rootEl.dir = next === "ar" ? "rtl" : "ltr";
  translatePage(next);
  syncLangToggle();
  langHooks.forEach((hook) => hook(next));
};

if (lang === "ar") translatePage("ar");
syncLangToggle();
rootEl.classList.remove("i18n-pending");

/* --------------------------------------------------------------------------
   1b. Theme toggle — the inline script in <head> already resolved the theme
      before first paint, so this only mirrors it in the UI and handles clicks.
      An explicit click is persisted; merely following the OS setting is not.
   -------------------------------------------------------------------------- */
const themeToggle = document.getElementById("theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const lightMedia = window.matchMedia("(prefers-color-scheme: light)");

let currentTheme = rootEl.dataset.theme === "light" ? "light" : "dark";

// Reflect a theme in the DOM and on the toggle, without writing to storage.
const syncTheme = (theme) => {
  currentTheme = theme;
  rootEl.dataset.theme = theme;
  const toLight = theme === "dark";
  themeToggle.setAttribute("aria-label", t(toLight ? "theme.toLight" : "theme.toDark"));
  themeToggle.setAttribute("aria-pressed", String(theme === "light"));
  // Tint the mobile browser chrome to match. Read --bg back off the root so the
  // palette stays owned by the stylesheet rather than duplicated here.
  themeColorMeta.content = getComputedStyle(rootEl).getPropertyValue("--bg").trim();
};

const applyTheme = (theme) => {
  syncTheme(theme);
  try {
    localStorage.setItem("preferred-theme", theme);
  } catch {
    /* storage unavailable (private mode) — the variable still holds it */
  }
};

const storedTheme = () => {
  try {
    return localStorage.getItem("preferred-theme");
  } catch {
    return null; /* storage unavailable */
  }
};

syncTheme(currentTheme); // label the toggle to match what <head> already painted
langHooks.push(() => syncTheme(currentTheme));

themeToggle.addEventListener("click", () => {
  const next = currentTheme === "dark" ? "light" : "dark";

  // Where the browser can snapshot the page, the new palette opens as a circle
  // from the toggle. Everywhere else it simply changes.
  if (prefersReducedMotion || typeof document.startViewTransition !== "function") {
    applyTheme(next);
    return;
  }
  const box = themeToggle.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  // Colour transitions would be caught mid-fade by the snapshot.
  rootEl.classList.add("theme-switching");
  const transition = document.startViewTransition(() => applyTheme(next));
  transition.ready
    .then(() => {
      rootEl.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${reach}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    })
    .catch(() => { /* transition skipped — the theme is applied either way */ });
  transition.finished.finally(() => rootEl.classList.remove("theme-switching"));
});

// No explicit choice saved? Keep following the OS as the visitor changes it.
lightMedia.addEventListener("change", (e) => {
  const saved = storedTheme();
  if (saved !== "light" && saved !== "dark") syncTheme(e.matches ? "light" : "dark");
});

/* --------------------------------------------------------------------------
   2. Opening sequence — once per tab session (the <head> script decided, and
      set .intro-pending before first paint). A counter runs while the portrait
      loads, then the panel wipes away and the cover assembles: dropping
      .intro-pending is what releases every hero animation in style.css.
   -------------------------------------------------------------------------- */
const hero = document.getElementById("home");
const heroStage = document.getElementById("hero-stage");

// PORTFOLIO, one masked letter at a time.
// English only: Arabic letters must stay joined, so the Arabic word rises whole.
const splitHeroLetters = () => {
  document.querySelectorAll(".hero-word-line").forEach((layer) => {
    let index = 0;
    layer.querySelectorAll(".hw").forEach((half) => {
      const letters = [...half.textContent];
      half.textContent = "";
      letters.forEach((letter) => {
        const mask = document.createElement("span");
        mask.className = "ch-w";
        const glyph = document.createElement("span");
        glyph.className = "ch";
        glyph.style.setProperty("--i", index++);
        glyph.textContent = letter;
        mask.append(glyph);
        half.append(mask);
      });
    });
  });
};

if (rootEl.classList.contains("intro-pending")) {
  try {
    sessionStorage.setItem("intro-seen", "1");
  } catch {
    /* storage unavailable — it will simply play again next load */
  }
  if (lang === "en") splitHeroLetters();

  const intro = document.createElement("div");
  intro.className = "intro";
  intro.setAttribute("aria-hidden", "true");
  intro.innerHTML = `
    <div class="intro-top"><span>${t("intro.name")}</span><span>${t("intro.label", { year: new Date().getFullYear() })}</span></div>
    <div class="intro-count"><span>0</span><small>${t("intro.place")}</small></div>
    <div class="intro-bar"><i></i></div>`;
  document.body.append(intro);

  const counter = intro.querySelector(".intro-count span");
  const portrait = document.querySelector(".hero-photo");
  const portraitReady = () => !portrait || (portrait.complete && portrait.naturalWidth > 0);
  const RUN = 1350;      // the count itself
  const PATIENCE = 3200; // how long it will hold at 94 for a slow portrait
  const startedAt = performance.now();

  const count = (now) => {
    const elapsed = now - startedAt;
    let progress = 1 - Math.pow(1 - clamp(elapsed / RUN, 0, 1), 3);
    if (!portraitReady() && elapsed < PATIENCE) progress = Math.min(progress, 0.94);
    counter.textContent = String(Math.round(progress * 100));
    intro.style.setProperty("--p", progress.toFixed(3));
    if (progress < 1) {
      requestAnimationFrame(count);
      return;
    }
    setTimeout(() => {
      intro.classList.add("is-leaving");
      rootEl.classList.remove("intro-pending");
      setTimeout(() => intro.remove(), 1150);
    }, 180);
  };
  requestAnimationFrame(count);
}

/* --------------------------------------------------------------------------
   3. Split headings and scrubbed text
      Words are wrapped where they stand, so nested markup (<em>, <strong>)
      and the spaces between words — which is what a screen reader reads —
      are left exactly as written.
   -------------------------------------------------------------------------- */
const wrapWords = (el, makeWord) => {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName !== "BR") walk(child);
        return;
      }
      if (child.nodeType !== Node.TEXT_NODE) return;
      const pieces = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) {
          pieces.append(" ");
          return;
        }
        const word = makeWord(part, words.length);
        words.push(word.inner);
        pieces.append(word.outer);
      });
      child.replaceWith(pieces);
    });
  };
  walk(el);
  return words;
};

// Section titles: each word rises out of its own mask when the title arrives.
const splitHeadings = [...document.querySelectorAll("[data-split]")];
const splitting = !prefersReducedMotion && hasObserver;
const splitHeading = (heading) =>
  wrapWords(heading, (text, index) => {
    const mask = document.createElement("span");
    mask.className = "w";
    const inner = document.createElement("span");
    inner.className = "wi";
    inner.style.setProperty("--i", index);
    inner.textContent = text;
    mask.append(inner);
    return { outer: mask, inner };
  });
if (splitting) splitHeadings.forEach(splitHeading);

// A new language arrives as plain text: split it again, and let the titles
// on screen rise once more.
langHooks.push(() => {
  if (!splitting) return;
  splitHeadings.forEach((heading) => {
    splitHeading(heading);
    if (!heading.classList.contains("is-visible")) return;
    const box = heading.getBoundingClientRect();
    if (box.bottom < 0 || box.top > window.innerHeight) return;
    heading.classList.remove("is-visible");
    void heading.offsetWidth; // restart the transition
    heading.classList.add("is-visible");
  });
});

// The About statement: words light up as the paragraph is scrolled through.
if (!prefersReducedMotion) {
  document.querySelectorAll("[data-scrub]").forEach((paragraph) => {
    let words = [];
    let lit = -1;
    const wrap = () => {
      words = wrapWords(paragraph, (text) => {
        const span = document.createElement("span");
        span.className = "sw";
        span.textContent = text;
        return { outer: span, inner: span };
      });
      lit = -1;
    };
    wrap();
    rootEl.classList.add("scrub-ready");
    langHooks.push(() => {
      wrap();
      queueScroll();
    });
    scrollTasks.push((y, viewport) => {
      const box = paragraph.getBoundingClientRect();
      if (box.bottom < -200 || box.top > viewport + 200) return;
      const progress = clamp((viewport * 0.86 - box.top) / (box.height + viewport * 0.36), 0, 1);
      const count = Math.round(progress * words.length * 1.04);
      if (count === lit) return;
      lit = count;
      words.forEach((word, index) => word.classList.toggle("is-lit", index < count));
    });
  });
}

/* --------------------------------------------------------------------------
   4. Scroll-linked chrome and the cover
   -------------------------------------------------------------------------- */
const nav = document.getElementById("nav");
const mainEl = document.getElementById("main");
const backToTop = document.getElementById("back-to-top");
backToTop.hidden = false; // JS is running, so the button can exist

let menuOpen = false;

scrollTasks.push((y, viewport) => {
  nav.classList.toggle("is-scrolled", y > 24);
  const scrollable = rootEl.scrollHeight - viewport;
  nav.style.setProperty("--scroll", scrollable > 0 ? clamp(y / scrollable, 0, 1).toFixed(4) : "0");

  const showTop = y > viewport * 0.8;
  backToTop.classList.toggle("is-shown", showTop);
  // The class only drives the fade. inert is what actually keeps the faded-out
  // button out of the tab order and out of hit-testing, with no dependence on
  // a transition having finished.
  backToTop.inert = !showTop || menuOpen;
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

/* The cover is sticky: the rest of the page slides up over it while it sinks
   back (--hero-p, 0 → 1). A cover taller than the screen pins only once its
   lower edge has been reached, hence the negative --hero-stick. */
const heroChrome = [hero.querySelector(".hero-meta"), hero.querySelector(".hero-footer")];
let heroHeight = hero.offsetHeight;
const measureHero = () => {
  // What the cover needs besides the portrait; style.css sizes the portrait
  // from it. Neither row depends on the portrait, so this cannot feed back.
  const chrome = heroChrome.reduce((sum, el) => sum + (el ? el.offsetHeight : 0), 0);
  hero.style.setProperty("--hero-chrome", `${chrome}px`);
  heroHeight = hero.offsetHeight;
  hero.style.setProperty("--hero-stick", `${Math.min(0, window.innerHeight - heroHeight)}px`);
  queueScroll();
};
if ("ResizeObserver" in window) new ResizeObserver(measureHero).observe(hero);
window.addEventListener("resize", measureHero);
measureHero();

scrollTasks.push((y) => {
  if (!prefersReducedMotion) {
    hero.style.setProperty("--hero-p", clamp(y / (heroHeight * 0.85), 0, 1).toFixed(3));
  }
  // Fully covered: its loops can rest.
  hero.classList.toggle("is-past", y > heroHeight + 4);
});

// A pinned cover is always "in view" as far as the browser is concerned, even
// with the sheet drawn over it — so Shift+Tab back into it would put focus on
// a button nobody can see. Scroll back until the sheet clears the cover.
hero.addEventListener("focusin", () => {
  const uncovered = Math.max(0, heroHeight - window.innerHeight);
  if (window.scrollY > uncovered + 1) {
    window.scrollTo({ top: uncovered, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
});

/* --------------------------------------------------------------------------
   5. Marquees — a slow drift that leans into the scroll and turns with it.
      The row is cloned until it can loop without a seam.
   -------------------------------------------------------------------------- */
let scrollVelocity = 0;
let lastScrollY = window.scrollY;
scrollTasks.push((y) => {
  scrollVelocity = y - lastScrollY;
  lastScrollY = y;
  if (scrollVelocity) wake();
});

document.querySelectorAll("[data-marquee]").forEach((marquee) => {
  const track = marquee.querySelector(".marquee-track");
  const originals = [...track.children];
  const pace = parseFloat(marquee.dataset.speed || "1");
  let loopWidth = 0;
  let offset = 0;
  let direction = -1;
  let inView = !hasObserver;

  const build = () => {
    track.querySelectorAll("[data-clone]").forEach((clone) => clone.remove());
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const first = originals[0];
    const last = originals[originals.length - 1];
    loopWidth = last.offsetLeft + last.offsetWidth - first.offsetLeft + gap;
    if (!loopWidth) return;
    const copies = Math.ceil((marquee.clientWidth * 1.5) / loopWidth) + 1;
    for (let n = 0; n < copies; n++) {
      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.dataset.clone = "";
        track.append(clone);
      });
    }
  };
  build();
  // A font arriving changes every width in the row: Anton at first, the
  // Arabic face after a switch to Arabic.
  if (document.fonts?.ready) document.fonts.ready.then(build);
  document.fonts?.addEventListener?.("loadingdone", build);
  window.addEventListener("resize", build);
  langHooks.push(build);

  if (prefersReducedMotion) return; // a full, still row

  if (hasObserver) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) wake();
    }).observe(marquee);
  }

  frameTasks.add((elapsed) => {
    if (!inView || !loopWidth) return false;
    if (scrollVelocity > 0.5) direction = -1;
    else if (scrollVelocity < -0.5) direction = 1;
    const step = (0.55 * pace + Math.min(Math.abs(scrollVelocity), 60) * 0.3) * (elapsed / 16.7);
    offset += direction * step;
    if (offset <= -loopWidth) offset += loopWidth;
    if (offset > 0) offset -= loopWidth;
    track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
    return true;
  });
  wake();
});

// The scroll's push on the marquees fades out between scroll events.
frameTasks.add(() => {
  scrollVelocity *= 0.9;
  if (Math.abs(scrollVelocity) < 0.05) scrollVelocity = 0;
  return false;
});

/* --------------------------------------------------------------------------
   6. Pointer: the ring, the cover's depth, and its light
      Mouse and trackpad only. The system cursor is never hidden — the ring
      trails it and grows over things that can be used.
   -------------------------------------------------------------------------- */
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, seen: false };
const pointerEffects = finePointer && !prefersReducedMotion;

if (pointerEffects) {
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = true;
    wake();
  }, { passive: true });

  // The ring.
  const ring = document.createElement("div");
  ring.className = "cursor";
  ring.setAttribute("aria-hidden", "true");
  const ringLabel = document.createElement("span");
  ringLabel.className = "cursor-label";
  ring.append(ringLabel);
  document.body.append(ring);

  const ringAt = { x: pointer.x, y: pointer.y };
  frameTasks.add(() => {
    if (!pointer.seen) return false;
    ringAt.x = lerp(ringAt.x, pointer.x, 0.22);
    ringAt.y = lerp(ringAt.y, pointer.y, 0.22);
    ring.style.setProperty("--x", `${ringAt.x.toFixed(1)}px`);
    ring.style.setProperty("--y", `${ringAt.y.toFixed(1)}px`);
    return Math.abs(ringAt.x - pointer.x) + Math.abs(ringAt.y - pointer.y) > 0.2;
  });

  // data-cursor="Drag" turns the ring into a labelled disc; "none" hides it.
  document.addEventListener("pointerover", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const text = target?.closest("[data-cursor]")?.dataset.cursor || "";
    const labelled = Boolean(text) && text !== "none";
    if (labelled) ringLabel.textContent = text;
    ring.classList.add("is-on");
    ring.classList.toggle("is-hidden", text === "none");
    ring.classList.toggle("is-label", labelled);
    ring.classList.toggle(
      "is-hover",
      !text && Boolean(target?.closest("a, button, summary, label, input, textarea"))
    );
  });
  rootEl.addEventListener("pointerleave", () => ring.classList.remove("is-on"));

  // The cover: the word drifts against the pointer, the portrait with it, and
  // a warm light follows behind.
  const depth = { x: 0, y: 0 };
  const light = { x: 50, y: 36 };
  frameTasks.add(() => {
    if (!pointer.seen || hero.classList.contains("is-past")) return false;
    const aimX = (pointer.x / window.innerWidth) * 2 - 1;
    const aimY = (pointer.y / window.innerHeight) * 2 - 1;
    depth.x = lerp(depth.x, aimX, 0.07);
    depth.y = lerp(depth.y, aimY, 0.07);
    light.x = lerp(light.x, (pointer.x / window.innerWidth) * 100, 0.06);
    light.y = lerp(light.y, (pointer.y / window.innerHeight) * 100, 0.06);
    heroStage.style.setProperty("--px", depth.x.toFixed(3));
    heroStage.style.setProperty("--py", depth.y.toFixed(3));
    hero.style.setProperty("--mx", `${light.x.toFixed(1)}%`);
    hero.style.setProperty("--my", `${light.y.toFixed(1)}%`);
    return Math.abs(depth.x - aimX) + Math.abs(depth.y - aimY) > 0.002;
  });
}

/* --------------------------------------------------------------------------
   7. Magnetic buttons — they lean toward the pointer, and a button's fill
      grows from the point where the pointer came in (or left).
   -------------------------------------------------------------------------- */
if (pointerEffects) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    let box = null;
    el.addEventListener("pointerenter", () => {
      box = el.getBoundingClientRect();
    });
    el.addEventListener("pointermove", (e) => {
      if (!box) return;
      el.style.setProperty("--tx", `${((e.clientX - box.left - box.width / 2) * 0.3).toFixed(1)}px`);
      el.style.setProperty("--ty", `${((e.clientY - box.top - box.height / 2) * 0.4).toFixed(1)}px`);
    });
    el.addEventListener("pointerleave", () => {
      box = null;
      el.style.removeProperty("--tx");
      el.style.removeProperty("--ty");
    });
  });
}

document.querySelectorAll(".btn").forEach((btn) => {
  const aim = (e) => {
    const box = btn.getBoundingClientRect();
    btn.style.setProperty("--bx", `${(e.clientX - box.left).toFixed(0)}px`);
    btn.style.setProperty("--by", `${(e.clientY - box.top).toFixed(0)}px`);
  };
  btn.addEventListener("pointerenter", aim);
  btn.addEventListener("pointerleave", aim);
});

/* --------------------------------------------------------------------------
   8. Typing effect, menu, active link
   -------------------------------------------------------------------------- */

// Typing effect — cycles through roles with type / pause / delete phases.
const typedEl = document.getElementById("typed");
const roles = () => t("hero.roles");

if (prefersReducedMotion) {
  typedEl.textContent = roles()[0];
  langHooks.push(() => { typedEl.textContent = roles()[0]; });
} else {
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timer = 0;

  const tick = () => {
    // Nothing to type for while the sheet covers the cover.
    if (hero.classList.contains("is-past")) {
      timer = setTimeout(tick, 600);
      return;
    }
    const list = roles();
    const word = list[roleIndex % list.length];
    charIndex += deleting ? -1 : 1;
    typedEl.textContent = word.slice(0, charIndex);

    let delay = deleting ? 45 : 90;
    if (!deleting && charIndex === word.length) {
      delay = 1800;                 // linger on the full word
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % list.length;
      delay = 350;
    }
    timer = setTimeout(tick, delay);
  };
  tick();

  // A new language starts the roles over, in that language.
  langHooks.push(() => {
    clearTimeout(timer);
    roleIndex = 0;
    charIndex = 0;
    deleting = false;
    typedEl.textContent = "";
    timer = setTimeout(tick, 300);
  });
}

// Menu — a full-screen sheet on narrow screens.
const hamburger = document.getElementById("hamburger");
const navLinksList = document.getElementById("nav-links");
const navLinks = [...document.querySelectorAll(".nav-link")];
navLinks.forEach((link, index) => link.style.setProperty("--i", index));

const setMenu = (open) => {
  menuOpen = open;
  navLinksList.classList.toggle("is-open", open);
  hamburger.classList.toggle("is-open", open);
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", t(open ? "menu.close" : "menu.open"));
  // The page behind is covered, so it must not scroll or take focus either.
  rootEl.classList.toggle("menu-open", open);
  mainEl.inert = open;
  queueScroll();
};

hamburger.addEventListener("click", () => setMenu(!menuOpen));
langHooks.push(() => hamburger.setAttribute("aria-label", t(menuOpen ? "menu.close" : "menu.open")));

// Close the menu when a link is chosen, Escape is pressed, or the screen
// grows past the point where the menu exists.
navLinksList.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuOpen) {
    setMenu(false);
    hamburger.focus();
  }
});
window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
  if (e.matches && menuOpen) setMenu(false);
});

// Active-section highlighting. The cover is sticky — it never leaves the
// viewport — so "Home" is decided by scroll position and the observer only
// answers for the sections that follow it.
const linkFor = (id) => navLinks.find((a) => a.getAttribute("href") === `#${id}`);
let activeId = "home";

const setActive = (id) => {
  if (id === activeId) return;
  activeId = id;
  navLinks.forEach((a) => {
    a.classList.remove("is-active");
    a.removeAttribute("aria-current");
  });
  const activeLink = linkFor(id);
  activeLink?.classList.add("is-active");
  activeLink?.setAttribute("aria-current", "location");
};

const homeEnds = () => heroHeight - window.innerHeight * 0.45;

if (hasObserver) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && window.scrollY >= homeEnds()) setActive(entry.target.id);
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  document.querySelectorAll("main section[id]").forEach((section) => {
    if (section !== hero) sectionObserver.observe(section);
  });
}
scrollTasks.push((y) => {
  if (y < homeEnds()) setActive("home");
});

/* --------------------------------------------------------------------------
   9. Reveal on scroll — items that arrive together arrive in sequence
   -------------------------------------------------------------------------- */
if (hasObserver) {
  rootEl.classList.add("reveal-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    let order = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (order) {
        el.style.setProperty("--d", `${order * 80}ms`);
        // The delay is only for this entrance — not for whatever the element
        // transitions later.
        setTimeout(() => el.style.removeProperty("--d"), 1400);
      }
      order++;
      el.classList.add("is-visible");
      observer.unobserve(el); // reveal once, then stop watching
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

  document.querySelectorAll(".reveal, [data-split]").forEach((el) => revealObserver.observe(el));
} else {
  splitHeadings.forEach((heading) => heading.classList.add("is-visible"));
}

/* --------------------------------------------------------------------------
   10. Nashrati phone strip — a native horizontal scroller (swipe and arrow
       keys already work), plus mouse dragging with a little glide, two
       buttons, a position bar, and the tall captures travelling inside their
       frames as the page scrolls past.
   -------------------------------------------------------------------------- */
const phones = document.getElementById("phones");
if (phones) {
  const track = phones.querySelector(".phones-track");
  const positionBar = document.getElementById("phones-progress");
  const prevBtn = document.getElementById("phones-prev");
  const nextBtn = document.getElementById("phones-next");
  const shots = [...phones.querySelectorAll(".phone-screen img")];
  phones.dataset.cursor = "Drag";

  // How far each capture can travel: its height beyond the frame's.
  const measureTravel = () => {
    shots.forEach((img) => {
      const travel = Math.max(0, img.offsetHeight - img.parentElement.clientHeight);
      img.style.setProperty("--travel", `${travel}px`);
    });
  };
  shots.forEach((img) => {
    img.draggable = false;
    if (!img.complete) img.addEventListener("load", measureTravel, { once: true });
  });
  if ("ResizeObserver" in window) new ResizeObserver(measureTravel).observe(phones);
  measureTravel();

  // The app screens follow the site's language. Both sets are renders of the
  // same screens; the launch screen is the same in either language, so it
  // carries no data-shot. On a switch the new set is loaded first and swapped
  // in together, so the strip never shows two languages at once.
  const swappable = shots.filter((img) => img.dataset.shot);
  const shotPath = (img, which) => `assets/nashrati/${which}/${img.dataset.shot}.webp`;
  let screensLang = "en";
  const showScreens = (which) => {
    if (which === screensLang) return;
    screensLang = which;
    phones.classList.add("is-swapping");
    const loads = swappable.map((img) => new Promise((resolve) => {
      const next = new Image();
      next.onload = next.onerror = () => resolve([img, next]);
      next.src = shotPath(img, which);
    }));
    Promise.all(loads).then((pairs) => {
      if (which !== screensLang) return; // a newer choice has taken over
      pairs.forEach(([img, next]) => {
        if (!next.naturalWidth) return; // keep what is there rather than a hole
        img.height = Math.round((img.width * next.naturalHeight) / next.naturalWidth);
        img.src = shotPath(img, which); // already in the cache, so it shows at once
      });
      phones.classList.remove("is-swapping");
      requestAnimationFrame(() => {
        measureTravel();
        queueScroll();
      });
    });
  };
  // An Arabic visit asks for the Arabic set straight away: the images are lazy,
  // so the English ones have not been fetched yet.
  if (lang === "ar") {
    screensLang = "ar";
    swappable.forEach((img) => {
      img.src = shotPath(img, "ar");
      if (img.dataset.shot === "draft") img.height = 2009;
    });
  }
  langHooks.push((next) => {
    showScreens(next);
    phones.scrollLeft = 0; // the strip's start moves to the other side
    syncBar();
  });

  if (!prefersReducedMotion) {
    scrollTasks.push((y, viewport) => {
      const box = phones.getBoundingClientRect();
      if (box.bottom < -100 || box.top > viewport + 100) return;
      const progress = clamp((viewport * 0.85 - box.top) / (box.height * 0.9 + viewport * 0.35), 0, 1);
      phones.style.setProperty("--sp", progress.toFixed(3));
    });
  }

  // Right-to-left, scrollLeft runs from 0 down to negative numbers; its size
  // is the distance travelled either way.
  const syncBar = () => {
    const total = phones.scrollWidth;
    const view = phones.clientWidth;
    if (!total) return;
    const travelled = Math.abs(phones.scrollLeft);
    positionBar.style.setProperty("--w", `${((view / total) * 100).toFixed(2)}%`);
    positionBar.style.setProperty("--l", `${((travelled / total) * 100).toFixed(2)}%`);
    prevBtn.disabled = travelled < 4;
    nextBtn.disabled = travelled > total - view - 4;
  };
  phones.addEventListener("scroll", syncBar, { passive: true });
  window.addEventListener("resize", syncBar);
  syncBar();

  const stepBy = (direction) => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const stride = track.firstElementChild.offsetWidth + gap;
    const forward = rootEl.dir === "rtl" ? -1 : 1;
    phones.scrollBy({
      left: direction * forward * stride * (window.innerWidth > 900 ? 2 : 1),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };
  prevBtn.addEventListener("click", () => stepBy(-1));
  nextBtn.addEventListener("click", () => stepBy(1));

  // Mouse drag. Touch already scrolls natively, so only the mouse is handled.
  let drag = null;
  let gliding = 0;
  phones.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    cancelAnimationFrame(gliding);
    drag = { startX: e.clientX, startLeft: phones.scrollLeft, lastX: e.clientX, lastTime: e.timeStamp, speed: 0 };
    phones.setPointerCapture(e.pointerId);
    phones.classList.add("is-dragging");
  });
  phones.addEventListener("pointermove", (e) => {
    if (!drag) return;
    phones.scrollLeft = drag.startLeft - (e.clientX - drag.startX);
    const dt = Math.max(1, e.timeStamp - drag.lastTime);
    drag.speed = lerp(drag.speed, (e.clientX - drag.lastX) / dt, 0.5);
    drag.lastX = e.clientX;
    drag.lastTime = e.timeStamp;
  });
  const release = () => {
    if (!drag) return;
    let speed = prefersReducedMotion ? 0 : -drag.speed * 16;
    drag = null;
    // Keep snapping off while it glides, or each step would be pulled back.
    const glide = () => {
      if (Math.abs(speed) < 0.5) {
        phones.classList.remove("is-dragging");
        return;
      }
      phones.scrollLeft += speed;
      speed *= 0.93;
      gliding = requestAnimationFrame(glide);
    };
    glide();
  };
  phones.addEventListener("pointerup", release);
  phones.addEventListener("pointercancel", release);
}

/* --------------------------------------------------------------------------
   11. Counters and the Gaza clock
   -------------------------------------------------------------------------- */

// Numbers count up once, as they come into view.
if (!prefersReducedMotion && hasObserver) {
  const numberFormat = new Intl.NumberFormat("en-US");
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el = entry.target;
      const end = Number(el.dataset.count);
      const startedAt = performance.now();
      const run = (now) => {
        const progress = clamp((now - startedAt) / 1500, 0, 1);
        el.textContent = numberFormat.format(Math.round(end * (1 - Math.pow(1 - progress, 4))));
        if (progress < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));
}

// Local time in Gaza — useful to anyone planning a call across time zones.
const clocks = [...document.querySelectorAll("[data-clock]")];
if (clocks.length) {
  try {
    const timeFormat = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Gaza",
    });
    const zoneFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Gaza", timeZoneName: "shortOffset" });
    const showTime = () => {
      const now = new Date();
      const time = timeFormat.format(now);
      const zone = zoneFormat.formatToParts(now).find((part) => part.type === "timeZoneName")?.value || "";
      clocks.forEach((clock) => {
        clock.textContent = clock.hasAttribute("data-clock-zone") && zone ? `${time} · ${zone}` : time;
        clock.dateTime = now.toISOString();
      });
    };
    showTime();
    setInterval(showTime, 15000);
  } catch {
    // No time-zone data in this browser: say nothing rather than guess.
    clocks.forEach((clock) => {
      const holder = clock.closest(".js-only");
      if (holder) holder.hidden = true;
    });
  }
}

/* --------------------------------------------------------------------------
   12. Project filtering
   -------------------------------------------------------------------------- */
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");
const emptyNote = document.getElementById("projects-empty");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });

    const filter = btn.dataset.filter;
    let visible = 0;
    projectCards.forEach((card) => {
      const match = filter === "all" || (card.dataset.category ?? "").split(" ").includes(filter);
      card.classList.toggle("is-hidden", !match);
      // A row filtered back in may never have been scrolled to.
      if (match) card.classList.add("is-visible");
      if (match) visible++;
    });
    emptyNote.hidden = visible > 0;
  });
});

/* --------------------------------------------------------------------------
   13. Certificate viewer and preview
       Each certificate name is a plain link to its image, which is what a
       visitor without this script gets. Here a click opens it in a <dialog>
       instead, and with a mouse the certificate follows the pointer down the
       list.
   -------------------------------------------------------------------------- */
const lightbox = document.getElementById("lightbox");
const certLinks = [...document.querySelectorAll(".cert-view")];
let hidePreview = () => {};

// The certificate's own title, without its small print ("12 hours").
const certName = (link) => (link.querySelector(".cert-name")?.textContent || link.textContent).replace(/\s+/g, " ").trim();

if (lightbox && typeof lightbox.showModal === "function") {
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxVerify = document.getElementById("lightbox-verify");

  certLinks.forEach((link) => {
    const verifyLink = link.closest(".cert-row").querySelector(".cert-link");
    const name = certName(link);
    link.setAttribute("aria-haspopup", "dialog");
    const labelVerify = () => verifyLink.setAttribute("aria-label", t("cert.verifyAria", { name }));
    labelVerify();
    langHooks.push(labelVerify);

    link.addEventListener("click", (e) => {
      // Leave modified clicks alone: open-in-new-tab should still work.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      lightboxImg.src = link.href;
      lightboxImg.alt = t("cert.alt", { name });
      lightboxTitle.textContent = name;
      lightboxVerify.href = verifyLink.href;
      hidePreview();
      lightbox.showModal();
    });
  });

  // A click on the backdrop (the dialog's own box, outside its contents).
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.close();
  });
}

if (pointerEffects && certLinks.length) {
  const preview = document.createElement("div");
  preview.className = "preview";
  preview.setAttribute("aria-hidden", "true");
  const previewImg = new Image();
  previewImg.alt = "";
  previewImg.decoding = "async";
  preview.append(previewImg);
  document.body.append(preview);

  const at = { x: 0, y: 0 };
  let size = { w: 0, h: 0 };
  let showing = false;

  // Beside the pointer, on whichever side has room, and never off-screen.
  const aim = () => {
    const right = pointer.x + 30;
    const x = right + size.w > window.innerWidth - 12 ? pointer.x - size.w - 30 : right;
    return {
      x: clamp(x, 12, window.innerWidth - size.w - 12),
      y: clamp(pointer.y - size.h * 0.55, 12, window.innerHeight - size.h - 12),
    };
  };

  frameTasks.add(() => {
    if (!showing) return false;
    const target = aim();
    at.x = lerp(at.x, target.x, 0.16);
    at.y = lerp(at.y, target.y, 0.16);
    preview.style.setProperty("--x", `${at.x.toFixed(1)}px`);
    preview.style.setProperty("--y", `${at.y.toFixed(1)}px`);
    return true;
  });

  hidePreview = () => {
    showing = false;
    preview.classList.remove("is-on");
  };

  certLinks.forEach((link) => {
    const row = link.closest(".cert-row");
    row.dataset.cursor = "none"; // the certificate takes the ring's place
    row.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      if (previewImg.getAttribute("src") !== link.getAttribute("href")) previewImg.src = link.getAttribute("href");
      size = { w: preview.offsetWidth, h: preview.offsetHeight };
      if (!showing) Object.assign(at, aim()); // appear where it belongs, not fly in
      showing = true;
      preview.classList.add("is-on");
      wake();
    });
    row.addEventListener("pointerleave", hidePreview);
  });
}

/* --------------------------------------------------------------------------
   14. Contact form validation
   -------------------------------------------------------------------------- */
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT_EMAIL = "momoawad2004@gmail.com";
form.noValidate = true; // custom accessible errors once JS is running

/* Use the form's native action as the AJAX destination so the endpoint lives
   in one place and the markup retains a standard HTML submission target. */
const FORM_ENDPOINT = form.getAttribute("action")?.trim() || "";

/* Bounds are read from each field's minlength/maxlength, so the markup stays the
   single source of truth and the limits cannot drift away from the messages. */
const withinLength = (value, el) => {
  const { length } = value.trim();
  return length >= el.minLength && length <= el.maxLength;
};
const count = (n) => n.toLocaleString("en-US");

const validators = {
  "cf-name": (v, el) =>
    withinLength(v, el) ? "" : t("form.name", { min: count(el.minLength), max: count(el.maxLength) }),
  "cf-email": (v, el) =>
    EMAIL_RE.test(v.trim()) && v.trim().length <= el.maxLength ? "" : t("form.email"),
  "cf-message": (v, el) =>
    withinLength(v, el) ? "" : t("form.message", { min: count(el.minLength), max: count(el.maxLength) }),
};

const validateField = (input) => {
  const message = validators[input.id](input.value, input);
  const invalid = Boolean(message);
  input.classList.toggle("is-invalid", invalid);
  // The red outline is only half the signal — aria-invalid is what tells a
  // screen reader the field is wrong when the user tabs back to it, and the
  // aria-describedby in the markup is what reads out this error text.
  input.setAttribute("aria-invalid", String(invalid));
  document.getElementById(`${input.id}-error`).textContent = message;
  return !message;
};

// Validate as the user leaves each field, and re-check live once flagged
Object.keys(validators).forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener("blur", () => validateField(input));
  input.addEventListener("input", () => {
    if (input.classList.contains("is-invalid")) validateField(input);
  });
  // Errors already on screen are re-said in the new language.
  langHooks.push(() => {
    if (input.classList.contains("is-invalid")) validateField(input);
  });
});

const submitBtn = document.getElementById("cf-submit");
const submitLabel = submitBtn.querySelector("span") || submitBtn;
const honeypot = document.getElementById("cf-company");

const setStatus = (text, state) => {
  formStatus.textContent = text;
  formStatus.classList.toggle("is-ok", state === "ok");
  formStatus.classList.toggle("is-error", state === "error");
};

const setSending = (sending) => {
  submitBtn.disabled = sending;
  submitLabel.textContent = t(sending ? "form.sending" : "form.send");
};

// Fallback for when no endpoint is configured: hand the message to the
// visitor's mail client. Unreliable — mailto: does nothing at all when no mail
// client is set up — so it is a stopgap, not the delivery path.
const handOffToMailClient = () => {
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t("form.mailSubject"))}`;
  setStatus(t("form.mailto", { email: CONTACT_EMAIL }), "ok");
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fields = Object.keys(validators).map((id) => document.getElementById(id));
  const results = fields.map(validateField); // validate all, don't stop at first
  const firstInvalid = fields[results.indexOf(false)];

  if (firstInvalid) {
    firstInvalid.focus();
    setStatus("", null);
    return;
  }

  // Honeypot tripped — a person never sees this field. Act successful so the
  // bot has nothing to learn from, but send nothing.
  if (honeypot.value) {
    form.reset();
    setStatus(t("form.thanksBot"), "ok");
    return;
  }

  const [name, email, message] = fields.map((f) => f.value.trim());

  if (!FORM_ENDPOINT) {
    handOffToMailClient();
    return;
  }

  setSending(true);
  setStatus(t("form.sending"), null);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, message }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Form endpoint returned ${res.status}`);

    form.reset();
    fields.forEach((f) => {
      f.classList.remove("is-invalid");
      f.removeAttribute("aria-invalid");
      document.getElementById(`${f.id}-error`).textContent = "";
    });
    setStatus(t("form.thanks", { name, email }), "ok");
  } catch (err) {
    // Network down, endpoint misconfigured, CORS — never drop the message
    // silently; point the visitor at a channel that works.
    console.error("Contact form submit failed:", err);
    const reason = t(err.name === "AbortError" ? "form.timeout" : "form.failed");
    setStatus(t("form.fallback", { reason, email: CONTACT_EMAIL }), "error");
  } finally {
    clearTimeout(timeoutId);
    setSending(false);
  }
});

/* --------------------------------------------------------------------------
   15. Footer year
   -------------------------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* --------------------------------------------------------------------------
   16. The language switch — English or Arabic for the whole site. The choice
       is remembered, and the address carries it (?lang=ar) so a shared link
       opens in the same language. The reader stays where they were: the same
       section, the same distance into it, though every height has changed.
   -------------------------------------------------------------------------- */
const readingPlace = () => {
  const line = nav.offsetHeight + 8;
  const section = [...document.querySelectorAll("main section[id]")].find((el) => {
    if (el === hero) return false;
    const box = el.getBoundingClientRect();
    return box.top <= line && box.bottom > line;
  });
  if (!section) return null;
  const box = section.getBoundingClientRect();
  return { section, line, ratio: (line - box.top) / box.height };
};
const returnTo = (place) => {
  if (!place) return;
  const box = place.section.getBoundingClientRect();
  window.scrollTo({ top: window.scrollY + box.top + place.ratio * box.height - place.line, behavior: "instant" });
};

langToggle.addEventListener("click", () => {
  const next = lang === "ar" ? "en" : "ar";
  try {
    localStorage.setItem("preferred-lang", next);
  } catch {
    /* storage unavailable — the address still carries it */
  }
  const url = new URL(window.location.href);
  if (next === "ar") url.searchParams.set("lang", "ar");
  else url.searchParams.delete("lang");
  history.replaceState(history.state, "", url);

  const place = readingPlace();
  const swap = () => {
    setLang(next);
    measureHero();
    returnTo(place);
    queueScroll();
  };
  if (prefersReducedMotion || typeof document.startViewTransition !== "function") {
    swap();
    return;
  }
  // A short cross-fade, rather than the page snapping into the other script.
  rootEl.classList.add("lang-switching");
  const transition = document.startViewTransition(swap);
  transition.finished.finally(() => rootEl.classList.remove("lang-switching"));
});

// Everything is wired: settle the scroll-linked state for wherever we are.
queueScroll();
