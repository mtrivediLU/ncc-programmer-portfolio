(function () {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: motionAllowed ? "smooth" : "auto", block: "start" });
      history.pushState(null, "", targetId);
    });
  });

  function animateMetric(element) {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";

    const target = Number(element.dataset.value || 0);
    const decimals = Number(element.dataset.decimals || 0);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const duration = 1150;
    const start = performance.now();

    function render(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      element.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(render);
      } else {
        element.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      }
    }

    if (!motionAllowed) {
      element.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }

    requestAnimationFrame(render);
  }

  const metrics = $$(".metric-value");

  if ("IntersectionObserver" in window) {
    const metricObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateMetric(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    metrics.forEach((metric) => metricObserver.observe(metric));
  } else {
    metrics.forEach(animateMetric);
  }

  const revealTargets = $$(".reveal");

  if (!motionAllowed) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -90px 0px", threshold: 0.12 });

    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  const navLinks = $$("[data-nav]");
  const sectionMap = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      return href && href.startsWith("#") ? { link, section: document.querySelector(href) } : null;
    })
    .filter((item) => item && item.section);

  if ("IntersectionObserver" in window && sectionMap.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (!visibleEntries.length) return;

      const activeId = visibleEntries[0].target.id;
      sectionMap.forEach(({ link }) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
      });
    }, { rootMargin: "-24% 0px -66% 0px", threshold: 0 });

    sectionMap.forEach(({ section }) => activeObserver.observe(section));
  }

  const backToTop = $("[data-back-to-top]");

  if (backToTop) {
    function toggleBackToTop() {
      backToTop.classList.toggle("is-visible", window.scrollY > 720);
    }

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: motionAllowed ? "smooth" : "auto" });
    });

    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();
  }

  if (motionAllowed) {
    const shapes = $$(".float-shape");
    let ticking = false;

    function updateShapes() {
      const scrollY = window.scrollY;
      shapes.forEach((shape, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        shape.style.setProperty("--parallax-y", `${scrollY * 0.03 * direction}px`);
      });
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateShapes);
    }, { passive: true });
  }
})();