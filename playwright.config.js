const { defineConfig, devices } = require("@playwright/test");

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}/`;

module.exports = defineConfig({
  testDir: "./tests",
  reporter: "list",
  /* Real HTTP rather than file://. Chrome blocks the self-hosted woff2 fonts
     from a null origin, and a meta CSP does not behave the same on file://. */
  webServer: {
    command: "node tests/static-server.js",
    url: BASE_URL,
    reuseExistingServer: true,
  },
  use: { baseURL: BASE_URL },
  projects: [
    {
      name: "chrome",
      // Reuses the installed Chrome so no Chromium download is required.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
