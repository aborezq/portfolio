// The page for a missing address follows the visitor's theme, as the main page
// does: a choice made on the site first, then the system's. It is a file, not
// an inline script, because 404.html's Content-Security-Policy allows only
// 'self'. Loaded after style.css and before <body>, so nothing flashes.
(() => {
  const root = document.documentElement;
  let stored = null;
  try {
    stored = localStorage.getItem("preferred-theme");
  } catch {
    /* storage unavailable — the system's preference still decides */
  }
  const light = stored === "light" || (stored !== "dark" && window.matchMedia("(prefers-color-scheme: light)").matches);
  if (!light) return;
  root.dataset.theme = "light";
  // Tint the mobile browser chrome to match, from the stylesheet's own --bg.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue("--bg").trim();
})();
