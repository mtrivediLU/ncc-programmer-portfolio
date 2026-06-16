/* ============================================================
   Mihir Trivedi — NCC Programmer/Developer Portfolio
   Vanilla JS · no dependencies
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------
     1. Hexagonal conservation-prioritization map (hero)
     --------------------------------------------------------- */
  function buildHexMap() {
    const svg = $("#hexmap");
    if (!svg) return;

    const W = 480;
    const H = 360;
    const r = 15;                    // hex radius (center -> vertex)
    const w = Math.sqrt(3) * r;      // column spacing (pointy-top)
    const vert = 1.5 * r;            // row spacing
    const cx0 = 240, cy0 = 176;      // blob centre
    const rx = 212, ry = 150;        // blob radii

    // organic "landmass" boundary — irregular ellipse
    function inBlob(x, y) {
      const ang = Math.atan2(y - cy0, x - cx0);
      const rr = 1 + 0.12 * Math.sin(3 * ang + 0.6) + 0.09 * Math.sin(5 * ang + 1.3) - 0.06 * Math.cos(2 * ang);
      const dx = (x - cx0) / rx, dy = (y - cy0) / ry;
      return (dx * dx + dy * dy) <= rr * rr;
    }

    // smooth priority field with a couple of "hot spots"
    function field(x, y) {
      const nx = x / W, ny = y / H;
      let v = 0.5
        + 0.30 * Math.sin(nx * 6.0 + 0.7) * Math.cos(ny * 4.6 + 1.1)
        + 0.20 * Math.sin((nx + ny) * 5.0)
        + 0.16 * Math.cos(nx * 3.0 - ny * 5.4);
      v += 0.40 * Math.exp(-(((x - 150) ** 2 + (y - 118) ** 2) / 2600));
      v += 0.34 * Math.exp(-(((x - 332) ** 2 + (y - 238) ** 2) / 3100));
      return v;
    }

    function hexPoints(cx, cy) {
      let pts = "";
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 90); // pointy-top
        pts += `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)} `;
      }
      return pts.trim();
    }

    // colour ramp: low (deep teal) -> high (bright mint)
    const stops = [
      [0.00, 14, 70, 56],
      [0.45, 15, 118, 110],
      [0.75, 26, 170, 140],
      [1.00, 92, 240, 198]
    ];
    function ramp(t) {
      t = Math.max(0, Math.min(1, t));
      for (let i = 1; i < stops.length; i++) {
        if (t <= stops[i][0]) {
          const a = stops[i - 1], b = stops[i];
          const f = (t - a[0]) / (b[0] - a[0]);
          const c = (j) => Math.round(a[j] + (b[j] - a[j]) * f);
          return `rgb(${c(1)},${c(2)},${c(3)})`;
        }
      }
      return `rgb(${stops[stops.length - 1].slice(1).join(",")})`;
    }

    // collect cells
    const cells = [];
    let minV = Infinity, maxV = -Infinity;
    for (let row = 0; ; row++) {
      const cy = 22 + row * vert;
      if (cy > H - 8) break;
      const offset = (row % 2) ? w / 2 : 0;
      for (let col = 0; ; col++) {
        const cx = 20 + offset + col * w;
        if (cx > W - 12) break;
        if (!inBlob(cx, cy)) continue;
        const v = field(cx, cy);
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
        cells.push({ cx, cy, v });
      }
    }
    if (!cells.length) return;

    // normalise + selection threshold (top ~14%)
    cells.forEach((c) => { c.t = (c.v - minV) / (maxV - minV || 1); });
    const sorted = cells.map((c) => c.t).sort((a, b) => a - b);
    const selThreshold = sorted[Math.floor(sorted.length * 0.86)];

    const maxDelay = 620;
    const frag = document.createDocumentFragment();
    cells.forEach((c) => {
      const poly = document.createElementNS(SVGNS, "polygon");
      poly.setAttribute("points", hexPoints(c.cx, c.cy));
      poly.setAttribute("fill", ramp(c.t));
      poly.setAttribute("fill-opacity", (0.72 + 0.28 * c.t).toFixed(2));
      const isSel = c.t >= selThreshold;
      poly.setAttribute("class", isSel ? "hex hex--sel" : "hex");
      const delay = Math.round(((c.cx + c.cy) / (W + H)) * maxDelay + Math.random() * 60);
      poly.style.setProperty("--d", delay + "ms");
      frag.appendChild(poly);
    });
    svg.appendChild(frag);

    // reveal (microtask so the browser registers initial opacity:0 first)
    requestAnimationFrame(() => svg.classList.add("is-ready"));
  }

  /* ---------------------------------------------------------
     2. Scroll progress bar
     --------------------------------------------------------- */
  function initProgressBar() {
    const bar = $("#progressBar");
    if (!bar || !motionAllowed) return;
    let ticking = false;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------
     3. Mobile nav
     --------------------------------------------------------- */
  const navToggle = $(".nav-toggle");
  const navMenu = $("#nav-menu");

  function closeMenu() {
    if (!navToggle || !navMenu) return;
    navMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------------------------------------------------------
     4. Smooth anchor scrolling
     --------------------------------------------------------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: motionAllowed ? "smooth" : "auto", block: "start" });
      history.pushState(null, "", targetId);
    });
  });

  /* ---------------------------------------------------------
     5. Count-up metrics
     --------------------------------------------------------- */
  function animateMetric(el) {
    if (el.dataset.counted === "true") return;
    el.dataset.counted = "true";
    const target = Number(el.dataset.value || 0);
    const decimals = Number(el.dataset.decimals || 0);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (!motionAllowed) {
      el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }
    const duration = 1100;
    const start = performance.now();
    function render(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${prefix}${(target * eased).toFixed(decimals)}${suffix}`;
      if (p < 1) requestAnimationFrame(render);
      else el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
    }
    requestAnimationFrame(render);
  }

  const metrics = $$(".metric-value");
  if ("IntersectionObserver" in window) {
    const mo = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        animateMetric(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.45 });
    metrics.forEach((m) => mo.observe(m));
  } else {
    metrics.forEach(animateMetric);
  }

  /* ---------------------------------------------------------
     6. Reveal on scroll
     --------------------------------------------------------- */
  const revealTargets = $$(".reveal");
  if (!motionAllowed) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const ro = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        obs.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -90px 0px", threshold: 0.12 });
    revealTargets.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
      ro.observe(el);
    });
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------
     7. Active nav highlighting
     --------------------------------------------------------- */
  const navLinks = $$("[data-nav]");
  const sectionMap = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      return href && href.startsWith("#") ? { link, section: document.querySelector(href) } : null;
    })
    .filter((it) => it && it.section);

  function setActiveNav(id) {
    sectionMap.forEach(({ link }) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  }

  if ("IntersectionObserver" in window && sectionMap.length) {
    const ao = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActiveNav(visible[0].target.id);
    }, { rootMargin: "-22% 0px -66% 0px", threshold: 0 });
    sectionMap.forEach(({ section }) => ao.observe(section));
  }

  /* ---------------------------------------------------------
     8. Back to top
     --------------------------------------------------------- */
  const backToTop = $("[data-back-to-top]");
  if (backToTop) {
    const toggle = () => backToTop.classList.toggle("is-visible", window.scrollY > 680);
    backToTop.addEventListener("click", () => {
      closeMenu();
      window.scrollTo({ top: 0, behavior: motionAllowed ? "smooth" : "auto" });
      history.pushState(null, "", "#top");
    });
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
  }

  /* ---------------------------------------------------------
     9. Init
     --------------------------------------------------------- */
  if (window.location.hash) {
    const initial = document.querySelector(window.location.hash);
    if (initial) setActiveNav(initial.id);
  } else {
    setActiveNav("overview");
  }

  buildHexMap();
  initProgressBar();
})();