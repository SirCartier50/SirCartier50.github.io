/* Mignot Mesele - portfolio interactions */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scroll progress ------------------------------------------------- */

  var root = document.documentElement;
  var ticking = false;

  function progress() {
    var max = root.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    root.style.setProperty("--progress", pct.toFixed(2) + "%");
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(progress);
    }
  }, { passive: true });
  window.addEventListener("resize", progress, { passive: true });
  progress();

  /* ---- reveal on scroll ------------------------------------------------ */

  var reveals = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("is-in"); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(reveals, function (el) { revealer.observe(el); });
  }

  /* stagger siblings inside a group */
  Array.prototype.forEach.call(document.querySelectorAll("[data-stagger]"), function (group) {
    var step = parseInt(group.getAttribute("data-stagger"), 10) || 70;
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (child.classList.contains("reveal")) {
        child.style.setProperty("--d", Math.min(i * step, 400) + "ms");
      }
    });
  });

  /* ---- active section in the rail -------------------------------------- */

  var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  function setCurrent(id) {
    links.forEach(function (a) {
      a.setAttribute("aria-current", a.getAttribute("href") === "#" + id ? "true" : "false");
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bestRatio = 0;
      sections.forEach(function (s) {
        var r = visible[s.id] || 0;
        if (r > bestRatio) { bestRatio = r; best = s.id; }
      });
      if (best) setCurrent(best);
    }, { threshold: [0, 0.15, 0.4, 0.75], rootMargin: "-12% 0px -40% 0px" });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- mobile menu ------------------------------------------------------ */

  var menuBtn = document.querySelector(".menu-btn");
  var sheet = document.getElementById("sheet");

  function closeSheet() {
    if (!sheet) return;
    sheet.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "Menu";
    document.body.style.overflow = "";
  }

  if (menuBtn && sheet) {
    menuBtn.addEventListener("click", function () {
      var open = sheet.hidden;
      if (open) {
        sheet.hidden = false;
        menuBtn.setAttribute("aria-expanded", "true");
        menuBtn.textContent = "Close";
        document.body.style.overflow = "hidden";
        var first = sheet.querySelector("a");
        if (first) first.focus();
      } else {
        closeSheet();
      }
    });

    sheet.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeSheet();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) { closeSheet(); menuBtn.focus(); }
    });
  }

  /* ---- project detail toggles ------------------------------------------ */

  Array.prototype.forEach.call(document.querySelectorAll(".toggle"), function (btn) {
    var card = btn.closest(".proj");
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!card || !panel) return;

    var inner = panel.firstElementChild;
    if (inner && "inert" in HTMLElement.prototype) inner.inert = true;

    btn.addEventListener("click", function () {
      var open = card.hasAttribute("data-open");
      if (open) {
        card.removeAttribute("data-open");
        btn.setAttribute("aria-expanded", "false");
        btn.querySelector(".toggle__text").textContent = "How it works";
      } else {
        card.setAttribute("data-open", "");
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector(".toggle__text").textContent = "Hide";
      }
      if (inner && "inert" in HTMLElement.prototype) inner.inert = open;
    });
  });

  /* ---- project filters -------------------------------------------------- */

  var cards = Array.prototype.slice.call(document.querySelectorAll(".proj"));
  var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var empty = document.getElementById("no-match");

  filters.forEach(function (btn) {
    var tag = btn.getAttribute("data-filter");
    var count = tag === "all"
      ? cards.length
      : cards.filter(function (c) { return (c.getAttribute("data-tags") || "").split(" ").indexOf(tag) > -1; }).length;
    var n = btn.querySelector(".n");
    if (n) n.textContent = count;
  });

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tag = btn.getAttribute("data-filter");
      filters.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });

      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        var match = tag === "all" || tags.indexOf(tag) > -1;
        card.hidden = !match;
        if (match) {
          shown++;
          if (!reduced) {
            card.classList.remove("is-in");
            /* force reflow so the reveal transition replays */
            void card.offsetWidth;
            card.classList.add("is-in");
          }
        }
      });
      if (empty) empty.hidden = shown !== 0;
      progress();
    });
  });

  /* ---- footer year ------------------------------------------------------ */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
