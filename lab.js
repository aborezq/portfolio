/* ==========================================================================
   Mohammed R. Awad — Portfolio · Lab
   A k-nearest-neighbours classifier you can watch change its mind.

   Two features on very different scales — age in years, account balance in
   dollars — and one switch: measure distance in raw units, or standardize
   both features first. Everything is computed here, on a canvas, with no
   libraries:

     · the shaded field is the classifier's vote at every cell of a grid;
     · the line is where that vote crosses one half (marching squares);
     · accuracy is leave-one-out — each customer predicted from the others.

   The data is synthetic. It is shaped like a churn table (older customers
   leave more often; many accounts sit at a zero balance), and makes no claim
   beyond illustrating why feature scaling can change a model's answer.
   ========================================================================== */
(() => {
  "use strict";

  const canvas = document.getElementById("lab-canvas");
  if (!canvas || typeof canvas.getContext !== "function") return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  // Words come from i18n.js, in whichever language the page is in right now.
  const t = (key, vars) => (window.I18N ? window.I18N.t(key, vars) : key);
  // Latin from Inter, Arabic from Tajawal — the page's own body faces.
  const face = (weight, size) => `${weight} ${size}px "Inter", "Tajawal", system-ui, sans-serif`;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  const scaleInputs = [...document.querySelectorAll('input[name="lab-scale"]')];
  const classInputs = [...document.querySelectorAll('input[name="lab-class"]')];
  const kInput = document.getElementById("lab-k");
  const kOutput = document.getElementById("lab-k-out");
  const readouts = {
    raw: document.getElementById("lab-acc-raw"),
    std: document.getElementById("lab-acc-std"),
  };
  const statusEl = document.getElementById("lab-status");
  const hintEl = document.getElementById("lab-hint");

  /* ---------- The data ---------- */
  const AGE = [18, 76];        // years
  const BALANCE = [0, 210000]; // dollars
  const SAMPLE_SIZE = 84;
  const DEFAULT_SEED = 7;

  // mulberry32 — a small seeded generator, so "Reset" always deals the same hand.
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gaussian = (random) => {
    let u = 0;
    while (!u) u = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
  };

  // Leaving depends on age (a logistic step around 45) plus label noise;
  // balance is there to be on a much larger scale, not to help.
  const makeSample = (seed) => {
    const random = seeded(seed);
    const points = [];
    for (let n = 0; n < SAMPLE_SIZE; n++) {
      const age = 21 + random() * 51;
      const balance = random() < 0.28
        ? random() * 4000
        : clamp(105000 + gaussian(random) * 38000, 6000, 204000);
      const leaving = 1 / (1 + Math.exp(-(age - 45) / 4.5));
      points.push({ age, balance, left: random() < 0.07 + 0.86 * leaving ? 1 : 0 });
    }
    return points;
  };

  /* ---------- The model ---------- */

  // "Raw" divides by 1: a year and a dollar count the same. "std" divides each
  // feature by its own standard deviation (the means cancel in a difference).
  const spread = (points, key) => {
    const mean = points.reduce((sum, p) => sum + p[key], 0) / points.length;
    const variance = points.reduce((sum, p) => sum + (p[key] - mean) ** 2, 0) / points.length;
    return Math.sqrt(variance) || 1;
  };
  const scaleFor = (points, mode) =>
    mode === "std" ? { age: spread(points, "age"), balance: spread(points, "balance") } : { age: 1, balance: 1 };

  // Indices of the k nearest points, nearest first. `skip` leaves one out.
  const nearest = (points, age, balance, k, scale, skip = -1) => {
    const bestIndex = [];
    const bestDistance = [];
    for (let i = 0; i < points.length; i++) {
      if (i === skip) continue;
      const dAge = (points[i].age - age) / scale.age;
      const dBalance = (points[i].balance - balance) / scale.balance;
      const distance = dAge * dAge + dBalance * dBalance;
      if (bestIndex.length === k && distance >= bestDistance[k - 1]) continue;
      let slot = bestIndex.length < k ? bestIndex.length : k - 1;
      while (slot > 0 && bestDistance[slot - 1] > distance) {
        bestDistance[slot] = bestDistance[slot - 1];
        bestIndex[slot] = bestIndex[slot - 1];
        slot--;
      }
      bestDistance[slot] = distance;
      bestIndex[slot] = i;
    }
    return bestIndex;
  };

  const votesToLeave = (points, neighbours) => neighbours.reduce((sum, i) => sum + points[i].left, 0);

  // Leave-one-out: predict each customer from all the others.
  const leaveOneOut = (points, k, scale) => {
    const missed = new Set();
    points.forEach((p, i) => {
      const neighbours = nearest(points, p.age, p.balance, k, scale, i);
      const predicted = votesToLeave(points, neighbours) * 2 > neighbours.length ? 1 : 0;
      if (predicted !== p.left) missed.add(i);
    });
    return { missed, accuracy: points.length ? 1 - missed.size / points.length : 0 };
  };

  /* ---------- The field: the vote at every cell, and where it turns ---------- */
  const COLS = 120;
  const ROWS = 90;

  const voteGrid = (points, k, scale) => {
    const grid = new Float32Array(COLS * ROWS);
    for (let row = 0; row < ROWS; row++) {
      const balance = BALANCE[1] - ((row + 0.5) / ROWS) * (BALANCE[1] - BALANCE[0]);
      for (let col = 0; col < COLS; col++) {
        const age = AGE[0] + ((col + 0.5) / COLS) * (AGE[1] - AGE[0]);
        const neighbours = nearest(points, age, balance, k, scale);
        grid[row * COLS + col] = votesToLeave(points, neighbours) / neighbours.length;
      }
    }
    return grid;
  };

  // Marching squares at one half. Returns point pairs in grid coordinates.
  const boundary = (grid) => {
    const segments = [];
    const cross = (a, b) => (0.5 - a) / (b - a);
    for (let row = 0; row < ROWS - 1; row++) {
      for (let col = 0; col < COLS - 1; col++) {
        const a = grid[row * COLS + col];
        const b = grid[row * COLS + col + 1];
        const c = grid[(row + 1) * COLS + col + 1];
        const d = grid[(row + 1) * COLS + col];
        const shape = (a > 0.5 ? 8 : 0) | (b > 0.5 ? 4 : 0) | (c > 0.5 ? 2 : 0) | (d > 0.5 ? 1 : 0);
        if (shape === 0 || shape === 15) continue;
        const top = [col + cross(a, b), row];
        const right = [col + 1, row + cross(b, c)];
        const bottom = [col + cross(d, c), row + 1];
        const left = [col, row + cross(a, d)];
        switch (shape) {
          case 1: case 14: segments.push(left, bottom); break;
          case 2: case 13: segments.push(bottom, right); break;
          case 3: case 12: segments.push(left, right); break;
          case 4: case 11: segments.push(top, right); break;
          case 6: case 9: segments.push(top, bottom); break;
          case 7: case 8: segments.push(left, top); break;
          case 5: segments.push(left, top, bottom, right); break;
          default: segments.push(left, bottom, top, right); // 10
        }
      }
    }
    return segments;
  };

  /* ---------- State ---------- */
  const state = {
    points: makeSample(DEFAULT_SEED),
    mode: "raw",
    k: 5,
    addClass: 0,
    hover: null, // { x, y, touch }
  };
  let colors = {};
  let tint = [217, 179, 106];
  let current = null;  // { image, segments, missed }
  let previous = null; // the field being faded out
  let blend = 1;       // 0 → 1 as `current` replaces `previous`
  let blendStart = 0;
  let size = { w: 0, h: 0, dpr: 1 };
  let drawQueued = false;
  let shown = { raw: null, std: null }; // readout numbers as displayed

  const readColors = () => {
    const style = getComputedStyle(root);
    const value = (name) => style.getPropertyValue(name).trim();
    colors = {
      text: value("--text"),
      muted: value("--muted"),
      accent: value("--accent"),
      gold: value("--accent-strong"),
      border: value("--border"),
      error: value("--error"),
      ink: value("--accent-ink"),
    };
    const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(colors.gold);
    if (hex) tint = hex.slice(1).map((part) => parseInt(part, 16));
  };

  // The vote grid as a tiny image: gold, more opaque the surer the "leaves".
  const paintField = (grid) => {
    const image = document.createElement("canvas");
    image.width = COLS;
    image.height = ROWS;
    const imageCtx = image.getContext("2d");
    const pixels = imageCtx.createImageData(COLS, ROWS);
    for (let i = 0; i < grid.length; i++) {
      pixels.data[i * 4] = tint[0];
      pixels.data[i * 4 + 1] = tint[1];
      pixels.data[i * 4 + 2] = tint[2];
      pixels.data[i * 4 + 3] = Math.round(Math.pow(grid[i], 1.15) * 108);
    }
    imageCtx.putImageData(pixels, 0, 0);
    return image;
  };

  /* ---------- Geometry ---------- */
  // The left margin is sized to the widest balance label ("200k", «200 ألف»).
  const PAD = { left: 46, right: 14, top: 16, bottom: 32 };
  const fitLabels = () => {
    ctx.font = face(500, 11);
    let widest = 0;
    for (let balance = 50000; balance <= 200000; balance += 50000) {
      widest = Math.max(widest, ctx.measureText(t("lab.tick", { n: balance / 1000 })).width);
    }
    PAD.left = Math.max(46, Math.ceil(widest) + 18);
  };
  const plot = () => ({
    x: PAD.left,
    y: PAD.top,
    w: Math.max(10, size.w - PAD.left - PAD.right),
    h: Math.max(10, size.h - PAD.top - PAD.bottom),
  });
  const toX = (age, area) => area.x + ((age - AGE[0]) / (AGE[1] - AGE[0])) * area.w;
  const toY = (balance, area) => area.y + (1 - (balance - BALANCE[0]) / (BALANCE[1] - BALANCE[0])) * area.h;
  const toAge = (x, area) => AGE[0] + ((x - area.x) / area.w) * (AGE[1] - AGE[0]);
  const toBalance = (y, area) => BALANCE[0] + (1 - (y - area.y) / area.h) * (BALANCE[1] - BALANCE[0]);

  /* ---------- Drawing ---------- */
  const strokeBoundary = (segments, area, alpha) => {
    if (!segments.length || alpha <= 0) return;
    const cellW = area.w / COLS;
    const cellH = area.h / ROWS;
    ctx.beginPath();
    for (let i = 0; i < segments.length; i += 2) {
      ctx.moveTo(area.x + (segments[i][0] + 0.5) * cellW, area.y + (segments[i][1] + 0.5) * cellH);
      ctx.lineTo(area.x + (segments[i + 1][0] + 0.5) * cellW, area.y + (segments[i + 1][1] + 0.5) * cellH);
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const pill = (text, x, y, area) => {
    ctx.font = face(600, 12);
    const width = ctx.measureText(text).width + 20;
    const height = 26;
    const left = clamp(x - width / 2, area.x + 2, area.x + area.w - width - 2);
    const top = clamp(y - height, area.y + 2, area.y + area.h - height - 2);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(left, top, width, height, 13);
    else ctx.rect(left, top, width, height);
    ctx.fillStyle = colors.accent;
    ctx.fill();
    ctx.fillStyle = colors.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, left + width / 2, top + height / 2 + 0.5);
  };

  const draw = () => {
    drawQueued = false;
    if (!current || !size.w) return;
    fitLabels();
    const area = plot();
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    // Field and boundary, cross-fading from the previous answer.
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    // Where the canvas can blur, the grid's stair-steps soften into a wash.
    const soften = typeof ctx.filter === "string";
    const paint = (layer, alpha) => {
      if (soften) ctx.filter = "blur(2.5px)";
      ctx.globalAlpha = alpha;
      ctx.drawImage(layer.image, area.x, area.y, area.w, area.h);
      if (soften) ctx.filter = "none";
      ctx.globalAlpha = 1;
      strokeBoundary(layer.segments, area, alpha);
    };
    if (previous && blend < 1) paint(previous, 1 - blend);
    paint(current, blend);
    ctx.restore();

    // Axes.
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.border;
    ctx.fillStyle = colors.muted;
    ctx.font = face(500, 11);
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    for (let age = 20; age <= 70; age += 10) {
      const x = Math.round(toX(age, area)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, area.y + area.h);
      ctx.lineTo(x, area.y + area.h + 5);
      ctx.stroke();
      ctx.fillText(String(age), x, area.y + area.h + 9);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let balance = 0; balance <= 200000; balance += 50000) {
      const y = Math.round(toY(balance, area)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(area.x - 5, y);
      ctx.lineTo(area.x, y);
      ctx.stroke();
      ctx.fillText(balance ? t("lab.tick", { n: balance / 1000 }) : "0", area.x - 9, y);
    }
    ctx.strokeRect(area.x + 0.5, area.y + 0.5, area.w - 1, area.h - 1);
    ctx.font = face(600, 10);
    // The axis titles sit on the gold wash, where the muted grey falls below
    // 4.5:1; the tick labels outside the plot keep it.
    ctx.fillStyle = colors.text;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(t("lab.axisX"), area.x + area.w - 8, area.y + area.h - 7);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(t("lab.axisY"), area.x + 8, area.y + 8);

    // Who gets asked: the k nearest to the pointer, in the current units.
    let asked = null;
    if (state.hover) {
      const age = toAge(state.hover.x, area);
      const balance = toBalance(state.hover.y, area);
      const neighbours = nearest(state.points, age, balance, state.k, scaleFor(state.points, state.mode));
      asked = { neighbours, votes: votesToLeave(state.points, neighbours) };
      ctx.strokeStyle = colors.accent;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      neighbours.forEach((i) => {
        ctx.moveTo(state.hover.x, state.hover.y);
        ctx.lineTo(toX(state.points[i].age, area), toY(state.points[i].balance, area));
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Customers.
    const askedSet = new Set(asked ? asked.neighbours : []);
    state.points.forEach((p, i) => {
      const x = toX(p.age, area);
      const y = toY(p.balance, area);
      if (askedSet.has(i)) {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = colors.accent;
        ctx.globalAlpha = 0.22;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(x, y, p.left ? 4.4 : 4, 0, Math.PI * 2);
      if (p.left) {
        ctx.fillStyle = colors.gold;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = colors.ink; // an edge against the gold wash
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = colors.accent;
        ctx.stroke();
      }
      if (current.missed.has(i)) {
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = colors.error;
        ctx.stroke();
      }
    });

    // The pointer's own verdict.
    if (asked) {
      const leaves = asked.votes * 2 > asked.neighbours.length;
      ctx.beginPath();
      ctx.arc(state.hover.x, state.hover.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = leaves ? colors.gold : colors.accent;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = colors.ink;
      ctx.stroke();
      pill(
        t("lab.pill", { votes: asked.votes, n: asked.neighbours.length, verdict: t(leaves ? "lab.leaves" : "lab.stays") }),
        state.hover.x,
        state.hover.y - (state.hover.touch ? 44 : 16),
        area
      );
    }

    if (blend < 1) queueDraw();
  };

  const queueDraw = () => {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame((now) => {
      if (blend < 1) blend = reducedMotion ? 1 : clamp((now - blendStart) / 520, 0, 1);
      draw();
    });
  };

  /* ---------- Readouts ---------- */
  const showAccuracy = (mode, accuracy) => {
    const el = readouts[mode];
    if (!el) return;
    const target = Math.round(accuracy * 100);
    const from = shown[mode];
    shown[mode] = target;
    if (reducedMotion || from === null || from === target) {
      el.textContent = String(target);
      return;
    }
    const startedAt = performance.now();
    const run = (now) => {
      if (shown[mode] !== target) return; // a newer value took over
      const progress = clamp((now - startedAt) / 500, 0, 1);
      el.textContent = String(Math.round(from + (target - from) * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  };

  let announceTimer = 0;
  const announce = (raw, std) => {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      if (!statusEl) return;
      statusEl.textContent = t(state.k === 1 ? "lab.statusOne" : "lab.status", {
        k: state.k,
        raw: Math.round(raw * 100),
        std: Math.round(std * 100),
      });
    }, 600);
  };

  /* ---------- Recompute ---------- */
  const update = ({ fade = true, speak = true } = {}) => {
    const scales = { raw: scaleFor(state.points, "raw"), std: scaleFor(state.points, "std") };
    const scores = {
      raw: leaveOneOut(state.points, state.k, scales.raw),
      std: leaveOneOut(state.points, state.k, scales.std),
    };
    const grid = voteGrid(state.points, state.k, scales[state.mode]);

    previous = fade && current && !reducedMotion ? current : null;
    current = { image: paintField(grid), segments: boundary(grid), missed: scores[state.mode].missed };
    blend = previous ? 0 : 1;
    blendStart = performance.now();

    showAccuracy("raw", scores.raw.accuracy);
    showAccuracy("std", scores.std.accuracy);
    document.querySelectorAll(".lab-readout > div").forEach((box) => {
      box.classList.toggle("is-active", box.dataset.mode === state.mode);
    });
    // Only what the visitor does in the Lab is spoken; a page load, a theme or a
    // language switch refreshes the sentence silently. The region is switched
    // on here, well before announce() writes the text 600 ms later, so screen
    // readers have noticed it is live by then.
    statusEl?.setAttribute("aria-live", speak ? "polite" : "off");
    announce(scores.raw.accuracy, scores.std.accuracy);
    queueDraw();
  };

  /* ---------- Controls ---------- */
  scaleInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.mode = input.value;
      update();
    });
  });
  classInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) state.addClass = Number(input.value);
    });
  });
  if (kInput) {
    kInput.addEventListener("input", () => {
      state.k = Number(kInput.value);
      if (kOutput) kOutput.textContent = kInput.value;
      update({ fade: false });
    });
  }
  document.getElementById("lab-shuffle")?.addEventListener("click", () => {
    state.points = makeSample(Math.floor(Math.random() * 1e9));
    update();
  });
  document.getElementById("lab-reset")?.addEventListener("click", () => {
    state.points = makeSample(DEFAULT_SEED);
    state.mode = "raw";
    state.k = 5;
    state.addClass = 0;
    scaleInputs.forEach((input) => { input.checked = input.value === "raw"; });
    classInputs.forEach((input) => { input.checked = input.value === "0"; });
    if (kInput) kInput.value = "5";
    if (kOutput) kOutput.textContent = "5";
    update();
  });

  /* ---------- Pointer ---------- */
  const locate = (e) => {
    const box = canvas.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const area = plot();
    const inside = x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
    return inside ? { x, y, touch: e.pointerType === "touch" } : null;
  };
  const dismissHint = () => hintEl?.classList.add("is-gone");
  // On a touchscreen there is no hover: a sideways slide explores instead.
  const hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const writeHint = () => {
    if (hintEl) hintEl.textContent = t(hoverable ? "lab.hintMouse" : "lab.hintTouch");
  };
  writeHint();

  canvas.dataset.cursor = "none"; // the page's pointer ring would sit on the reading
  canvas.addEventListener("pointermove", (e) => {
    state.hover = locate(e);
    if (state.hover) dismissHint();
    queueDraw();
  });
  canvas.addEventListener("pointerdown", (e) => {
    state.hover = locate(e);
    queueDraw();
  });
  const clearHover = () => {
    state.hover = null;
    queueDraw();
  };
  canvas.addEventListener("pointerleave", clearHover);
  canvas.addEventListener("pointercancel", clearHover);

  // A click (or a tap that did not turn into a scroll) adds a customer.
  canvas.addEventListener("click", (e) => {
    const spot = locate(e);
    if (!spot) return;
    const area = plot();
    state.points = [...state.points, { age: toAge(spot.x, area), balance: toBalance(spot.y, area), left: state.addClass }];
    dismissHint();
    update();
  });

  /* ---------- Keyboard ---------- */
  // The same probe a hover shows, driven by the keys: the arrows move it (12px,
  // or 40 with Shift), Enter or Space adds a customer of the chosen class under
  // it, Escape puts it away. With no probe yet, it starts in the middle of the
  // plot (so a first Enter adds a customer there). The chart is not mirrored in
  // Arabic, so the arrows hold either way. Keys it does not use are left to the
  // browser (Tab, page scrolling), and so is anything held with Alt, Ctrl or Cmd
  // (Alt+Left is Back); Shift stays, for the larger step.
  canvas.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return; // leave browser and OS shortcuts alone
    const area = plot();
    const centre = { x: area.x + area.w / 2, y: area.y + area.h / 2, touch: false };
    const step = e.shiftKey ? 40 : 12;
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (move) {
      const at = state.hover || centre;
      state.hover = {
        x: clamp(at.x + move[0], area.x, area.x + area.w),
        y: clamp(at.y + move[1], area.y, area.y + area.h),
        touch: false,
      };
      dismissHint();
      queueDraw();
    } else if (e.key === "Enter" || e.key === " ") {
      if (!state.hover) state.hover = centre;
      const { x, y } = state.hover;
      state.points = [...state.points, { age: toAge(x, area), balance: toBalance(y, area), left: state.addClass }];
      update();
      dismissHint();
    } else if (e.key === "Escape" && state.hover) {
      clearHover();
    } else return;
    e.preventDefault();
  });
  // Leaving the chart by keyboard takes the probe with it, as leaving by mouse does.
  canvas.addEventListener("blur", clearHover);

  /* ---------- Sizing, theme, start ---------- */
  const resize = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = { w: box.width, h: box.height, dpr };
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    queueDraw();
  };

  readColors();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  resize();

  // Repaint in the other palette when the theme is switched, and in the other
  // language when that is: labels, the hint, and the spoken summary.
  new MutationObserver(() => {
    readColors();
    writeHint();
    update({ fade: false, speak: false });
  }).observe(root, { attributes: true, attributeFilter: ["data-theme", "lang"] });

  // Redraw once the label faces are in, so they are not left in a fallback.
  if (document.fonts?.ready) document.fonts.ready.then(queueDraw);
  document.fonts?.addEventListener?.("loadingdone", queueDraw);

  update({ fade: false, speak: false });
})();
