/* ==========================================================================
   Mohammed R. Awad — Portfolio
   Vanilla ES6+: DOM APIs, IntersectionObserver, no dependencies.
   ========================================================================== */
"use strict";

/* --------------------------------------------------------------------------
   1. Theme toggle — the inline script in <head> already resolved the theme
      before first paint, so this only mirrors it in the UI and handles clicks.
      An explicit click is persisted; merely following the OS setting is not.
   -------------------------------------------------------------------------- */
const themeToggle = document.getElementById("theme-toggle");
const rootEl = document.documentElement;
const lightMedia = window.matchMedia("(prefers-color-scheme: light)");

let currentTheme = rootEl.dataset.theme === "light" ? "light" : "dark";

// Reflect a theme in the DOM and on the toggle, without writing to storage.
const syncTheme = (theme) => {
  currentTheme = theme;
  rootEl.dataset.theme = theme;
  const toLight = theme === "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${toLight ? "light" : "dark"} theme`);
  themeToggle.setAttribute("aria-pressed", String(theme === "light"));
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

themeToggle.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// No explicit choice saved? Keep following the OS as the visitor changes it.
lightMedia.addEventListener("change", (e) => {
  const saved = storedTheme();
  if (saved !== "light" && saved !== "dark") syncTheme(e.matches ? "light" : "dark");
});

/* --------------------------------------------------------------------------
   2. Typing effect — cycles through roles with type / pause / delete phases.
   -------------------------------------------------------------------------- */
const ROLES = ["Front-End Developer", "Computer Engineer", "Problem Solver"];
const typedEl = document.getElementById("typed");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  typedEl.textContent = ROLES[0];
} else {
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const word = ROLES[roleIndex];
    charIndex += deleting ? -1 : 1;
    typedEl.textContent = word.slice(0, charIndex);

    let delay = deleting ? 45 : 90;
    if (!deleting && charIndex === word.length) {
      delay = 1800;                 // linger on the full word
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % ROLES.length;
      delay = 350;
    }
    setTimeout(tick, delay);
  };
  tick();
}

/* --------------------------------------------------------------------------
   3. Sticky nav styling + hamburger menu
   -------------------------------------------------------------------------- */
const nav = document.getElementById("nav");
const hamburger = document.getElementById("hamburger");
const navLinksList = document.getElementById("nav-links");

const setMenu = (open) => {
  navLinksList.classList.toggle("is-open", open);
  hamburger.classList.toggle("is-open", open);
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};

hamburger.addEventListener("click", () => {
  setMenu(!navLinksList.classList.contains("is-open"));
});

// Close the mobile menu when a link is chosen or Escape is pressed
navLinksList.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

/* --------------------------------------------------------------------------
   4. Scroll-linked UI: nav backdrop + back-to-top visibility
      (one passive listener, work deferred to rAF)
   -------------------------------------------------------------------------- */
const backToTop = document.getElementById("back-to-top");
backToTop.hidden = false; // JS is running, so the button can exist

let scrollTicking = false;
const onScroll = () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 24);
  backToTop.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.8);
  scrollTicking = false;
};
window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });
onScroll();

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

/* --------------------------------------------------------------------------
   5. Active-section highlighting — IntersectionObserver over the sections
   -------------------------------------------------------------------------- */
const navLinks = [...document.querySelectorAll(".nav-link")];
const linkFor = (id) => navLinks.find((a) => a.getAttribute("href") === `#${id}`);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.remove("is-active"));
    linkFor(entry.target.id)?.classList.add("is-active");
  });
}, { rootMargin: "-40% 0px -55% 0px" });

document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

/* --------------------------------------------------------------------------
   6. Scroll-reveal animations + skill-bar fill, one observer for both
   -------------------------------------------------------------------------- */
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");

    // Animate any skill bars inside the revealed block
    entry.target.querySelectorAll(".skill-fill").forEach((fill) => {
      fill.style.width = `${fill.dataset.level}%`;
    });

    observer.unobserve(entry.target); // reveal once, then stop watching
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* --------------------------------------------------------------------------
   7. Project filtering
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
      const match = filter === "all" || card.dataset.category.split(" ").includes(filter);
      card.classList.toggle("is-hidden", !match);
      if (match) visible++;
    });
    emptyNote.hidden = visible > 0;
  });
});

/* --------------------------------------------------------------------------
   8. Contact form validation
   -------------------------------------------------------------------------- */
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT_EMAIL = "momoawad2004@gmail.com";

const validators = {
  "cf-name": (v) => (v.trim().length >= 2 ? "" : "Please enter your name (at least 2 characters)."),
  "cf-email": (v) => (EMAIL_RE.test(v.trim()) ? "" : "Please enter a valid email address."),
  "cf-message": (v) => (v.trim().length >= 10 ? "" : "Please write a message of at least 10 characters."),
};

const validateField = (input) => {
  const message = validators[input.id](input.value);
  input.classList.toggle("is-invalid", Boolean(message));
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
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const fields = Object.keys(validators).map((id) => document.getElementById(id));
  const results = fields.map(validateField); // validate all, don't stop at first
  const firstInvalid = fields[results.indexOf(false)];

  if (firstInvalid) {
    firstInvalid.focus();
    formStatus.textContent = "";
    return;
  }

  // Static host, no backend: hand the message to the visitor's mail client.
  const [name, email, message] = fields.map((f) => f.value.trim());
  const subject = `Portfolio message from ${name}`;
  const body = `${message}\n\n— ${name} (${email})`;
  window.location.href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Deliberately not resetting: when no mail client is configured mailto: does
  // nothing at all, and the visitor still needs their text to copy out.
  formStatus.textContent =
    `Opening your email app… if nothing happened, send your message to ${CONTACT_EMAIL} directly.`;
});

/* --------------------------------------------------------------------------
   9. Footer year
   -------------------------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();
