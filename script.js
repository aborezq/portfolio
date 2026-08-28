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
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const lightMedia = window.matchMedia("(prefers-color-scheme: light)");

let currentTheme = rootEl.dataset.theme === "light" ? "light" : "dark";

// Reflect a theme in the DOM and on the toggle, without writing to storage.
const syncTheme = (theme) => {
  currentTheme = theme;
  rootEl.dataset.theme = theme;
  const toLight = theme === "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${toLight ? "light" : "dark"} theme`);
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
const ROLES = ["Computer Engineer", "Problem Solver"];
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
  if (e.key === "Escape" && navLinksList.classList.contains("is-open")) {
    setMenu(false);
    hamburger.focus();
  }
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
  const showTop = window.scrollY > window.innerHeight * 0.8;
  backToTop.classList.toggle("is-shown", showTop);
  // The class only drives the fade. inert is what actually keeps the faded-out
  // button out of the tab order and out of hit-testing, with no dependence on
  // a transition having finished.
  backToTop.inert = !showTop;
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
    navLinks.forEach((a) => {
      a.classList.remove("is-active");
      a.removeAttribute("aria-current");
    });
    const activeLink = linkFor(entry.target.id);
    activeLink?.classList.add("is-active");
    activeLink?.setAttribute("aria-current", "location");
  });
}, { rootMargin: "-40% 0px -55% 0px" });

document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

/* --------------------------------------------------------------------------
   6. Progressive scroll-reveal animations
   -------------------------------------------------------------------------- */
rootEl.classList.add("reveal-ready");
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");

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
   8. Credential disclosure — enhanced only when JavaScript is available
   -------------------------------------------------------------------------- */
const certGrid = document.getElementById("certificate-grid");
const certToggle = document.getElementById("cert-toggle");
const extraCertificates = certGrid.querySelectorAll(".cert-card--extra");

if (extraCertificates.length) {
  certGrid.classList.add("is-collapsible");
  certToggle.hidden = false;
  certToggle.addEventListener("click", () => {
    const expanded = certGrid.classList.toggle("is-expanded");
    certToggle.setAttribute("aria-expanded", String(expanded));
    certToggle.textContent = expanded ? "Show fewer credential groups" : "View all credential groups";
  });
}

/* --------------------------------------------------------------------------
   9. Contact form validation
   -------------------------------------------------------------------------- */
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT_EMAIL = "momoawad2004@gmail.com";
form.noValidate = true; // custom accessible errors once JS is running

/* Use the form's native action as the AJAX destination so the endpoint lives
   in one place and the markup retains a standard HTML submission target. */
const FORM_ENDPOINT = form.getAttribute("action")?.trim() || "";

const validators = {
  "cf-name": (v) => (v.trim().length >= 2 && v.trim().length <= 80 ? "" : "Please enter a name between 2 and 80 characters."),
  "cf-email": (v) => (EMAIL_RE.test(v.trim()) && v.trim().length <= 254 ? "" : "Please enter a valid email address."),
  "cf-message": (v) => (v.trim().length >= 10 && v.trim().length <= 2000 ? "" : "Please write a message between 10 and 2,000 characters."),
};

const validateField = (input) => {
  const message = validators[input.id](input.value);
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
});

const submitBtn = document.getElementById("cf-submit");
const honeypot = document.getElementById("cf-company");

const setStatus = (text, state) => {
  formStatus.textContent = text;
  formStatus.classList.toggle("is-ok", state === "ok");
  formStatus.classList.toggle("is-error", state === "error");
};

const setSending = (sending) => {
  submitBtn.disabled = sending;
  submitBtn.textContent = sending ? "Sending…" : "Send message";
};

// Fallback for when no endpoint is configured: hand the message to the
// visitor's mail client. Unreliable — mailto: does nothing at all when no mail
// client is set up — so it is a stopgap, not the delivery path.
const handOffToMailClient = ({ name, email, message }) => {
  const subject = `Portfolio message from ${name}`;
  const body = `${message}\n\n— ${name} (${email})`;
  window.location.href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  setStatus(
    `Opening your email app… if nothing happened, send your message to ${CONTACT_EMAIL} directly.`,
    "ok"
  );
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
    setStatus("Thanks — your message has been sent.", "ok");
    return;
  }

  const [name, email, message] = fields.map((f) => f.value.trim());

  if (!FORM_ENDPOINT) {
    handOffToMailClient({ name, email, message });
    return;
  }

  setSending(true);
  setStatus("Sending…", null);
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
    setStatus(`Thanks, ${name} — your message is on its way. I'll reply to ${email}.`, "ok");
  } catch (err) {
    // Network down, endpoint misconfigured, CORS — never drop the message
    // silently; point the visitor at a channel that works.
    console.error("Contact form submit failed:", err);
    const reason = err.name === "AbortError" ? "The request timed out." : "That didn't send.";
    setStatus(`${reason} Please email me at ${CONTACT_EMAIL} or message me on WhatsApp.`, "error");
  } finally {
    clearTimeout(timeoutId);
    setSending(false);
  }
});

/* --------------------------------------------------------------------------
   10. Footer year
   -------------------------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();
