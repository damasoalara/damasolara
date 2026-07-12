/* Damaso Lara — interactions (vanilla, no dependencies) */
(function () {
  "use strict";

  /* ---------- Announcement bar ---------- */
  var annc = document.getElementById("annc");
  var anncClose = document.getElementById("anncClose");
  if (sessionStorage.getItem("annc-dismissed")) annc.classList.add("is-hidden");
  anncClose.addEventListener("click", function () {
    annc.classList.add("is-hidden");
    sessionStorage.setItem("annc-dismissed", "1");
  });

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  function closeMenu() {
    menu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var open = menu.hidden;
    menu.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---------- Language toggle (EN/ES) ---------- */
  var LANG_KEY = "dl-lang";
  var lang = localStorage.getItem(LANG_KEY) || "en";

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = next;
    localStorage.setItem(LANG_KEY, next);
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var txt = el.getAttribute("data-" + next);
      if (txt) el.textContent = txt;
    });
    document.querySelectorAll("[data-ph-en]").forEach(function (el) {
      var ph = el.getAttribute("data-ph-" + next);
      if (ph) el.setAttribute("placeholder", ph);
    });
    // Re-split manifesto in the new language
    buildManifesto();
    var label = next === "en" ? "ES" : "EN";
    [document.getElementById("langToggle"), document.getElementById("langToggleFoot")].forEach(function (b) {
      if (b) b.textContent = label;
    });
  }

  [document.getElementById("langToggle"), document.getElementById("langToggleFoot")].forEach(function (b) {
    if (b) b.addEventListener("click", function () {
      applyLang(lang === "en" ? "es" : "en");
    });
  });

  /* ---------- Scroll reveals ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- Manifesto: word-by-word ink-in on scroll ---------- */
  var manifesto = document.getElementById("manifesto");
  var words = [];

  function buildManifesto() {
    if (!manifesto) return;
    var text = manifesto.getAttribute("data-" + lang) || manifesto.textContent;
    manifesto.innerHTML = "";
    words = text.split(/\s+/).map(function (w) {
      var span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      manifesto.appendChild(span);
      manifesto.appendChild(document.createTextNode(" "));
      return span;
    });
  }

  function paintManifesto() {
    if (!manifesto || !words.length) return;
    var rect = manifesto.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress: 0 when top of paragraph hits 85% of viewport, 1 when bottom passes 35%
    var start = vh * 0.85;
    var end = vh * 0.35;
    var total = rect.height + (start - end);
    var passed = start - rect.top;
    var progress = Math.min(1, Math.max(0, passed / total));
    var onCount = Math.round(progress * words.length);
    words.forEach(function (w, i) {
      w.classList.toggle("is-on", i < onCount);
    });
  }

  buildManifesto();
  window.addEventListener("scroll", paintManifesto, { passive: true });
  paintManifesto();

  /* ---------- Drag-to-scroll strips ---------- */
  document.querySelectorAll("[data-drag]").forEach(function (strip) {
    var down = false, startX = 0, startLeft = 0;
    strip.addEventListener("pointerdown", function (e) {
      down = true;
      startX = e.clientX;
      startLeft = strip.scrollLeft;
      strip.classList.add("is-dragging");
      strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener("pointermove", function (e) {
      if (!down) return;
      strip.scrollLeft = startLeft - (e.clientX - startX);
    });
    ["pointerup", "pointercancel"].forEach(function (ev) {
      strip.addEventListener(ev, function () {
        down = false;
        strip.classList.remove("is-dragging");
      });
    });
  });

  /* ---------- Play reel when visible ---------- */
  var reel = document.querySelector(".property__reel video");
  if (reel) {
    var syncReel = function () {
      var r = reel.getBoundingClientRect();
      var inView = r.top < window.innerHeight && r.bottom > 0;
      if (inView && reel.paused) reel.play().catch(function () {});
      else if (!inView && !reel.paused) reel.pause();
    };
    new IntersectionObserver(syncReel, { threshold: 0.1 }).observe(reel);
    var reelTick = false;
    window.addEventListener("scroll", function () {
      if (reelTick) return;
      reelTick = true;
      requestAnimationFrame(function () { reelTick = false; syncReel(); });
    }, { passive: true });
  }

  /* ---------- Smooth anchor scrolling (JS, respects reduced motion) ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- Footer year ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- Apply persisted language on load ---------- */
  if (lang !== "en") applyLang(lang);
})();
