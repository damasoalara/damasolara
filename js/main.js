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
    window.dispatchEvent(new Event("dl-langchange"));
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
      if (Math.abs(e.clientX - startX) > 6) strip.classList.add("was-dragged");
      strip.scrollLeft = startLeft - (e.clientX - startX);
    });
    ["pointerup", "pointercancel"].forEach(function (ev) {
      strip.addEventListener(ev, function () {
        down = false;
        strip.classList.remove("is-dragging");
        setTimeout(function () { strip.classList.remove("was-dragged"); }, 50);
      });
    });
  });

  /* ---------- Play reel when visible ---------- */
  var reel = document.querySelector(".property__lead--film video");
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


  /* ---------- Lightbox (all property photography; headshot excluded) ---------- */
  var GALLERIES = {
    "879": [
      ["images/879-aerial-pool.jpg","Aerial view of 879 Linda Flora"],
      ["images/879-facade-twilight.jpg","Twilight facade"],
      ["images/879-living.jpg","Living room with arched openings"],
      ["images/879-kitchen.jpg","Kitchen with arched window"],
      ["images/879-bedroom-view.jpg","Primary bedroom with ocean view"],
      ["images/879-dining-twilight.jpg","Outdoor dining at dusk"],
      ["images/879-tennis-twilight.jpg","Estate and tennis court at twilight"],
      ["images/879-pool-elevation.jpg","Pool and rear elevation"],
      ["images/879-path-dusk.jpg","Lit path at dusk"]
    ],
    "903": [
      ["images/903-drone.jpg","Aerial view of 903 Linda Flora"],
      ["images/903-living.jpg","Living room with black marble fireplace"],
      ["images/903-bedroom.jpg","Bedroom with curved panoramic window"],
      ["images/903-tub.jpg","Freestanding tub with canyon view"],
      ["images/903-kitchen.jpg","Kitchen with double island"],
      ["images/903-pool.jpg","Pool overlooking the hills"],
      ["images/903-drone-2.jpg","Aerial toward the Westside"]
    ],
    "1149-lindaflora": [["images/1149-lindaflora.jpg","1149 Linda Flora Dr"],["images/g/1149-lindaflora-01.jpg",""],["images/g/1149-lindaflora-02.jpg",""],["images/g/1149-lindaflora-03.jpg",""],["images/g/1149-lindaflora-04.jpg",""],["images/g/1149-lindaflora-05.jpg",""],["images/g/1149-lindaflora-06.jpg",""],["images/g/1149-lindaflora-07.jpg",""]],
    "10814-savona": [["images/10814-savona.jpg","10814 Savona Rd"],["images/g/10814-savona-01.jpg",""]],
    "1132-chantilly": [["images/1132-chantilly.jpg","1132 Chantilly Rd"],["images/g/1132-chantilly-01.jpg",""],["images/g/1132-chantilly-02.jpg",""],["images/g/1132-chantilly-03.jpg",""]],
    "14367-mulholland": [["images/14367-mulholland.jpg","14367 Mulholland Dr"],["images/g/14367-mulholland-01.jpg",""],["images/g/14367-mulholland-02.jpg",""],["images/g/14367-mulholland-03.jpg",""]],
    "9604-heather": [["images/9604-heather.jpg","9604 Heather Rd"]],
    "15415-milldale": [["images/15415-milldale.jpg","15415 Milldale Dr"],["images/g/15415-milldale-01.jpg",""],["images/g/15415-milldale-02.jpg",""],["images/g/15415-milldale-03.jpg",""]],
    "146-groverton": [["images/146-groverton.jpg","146 Groverton Pl"],["images/g/146-groverton-01.jpg",""],["images/g/146-groverton-02.jpg",""],["images/g/146-groverton-03.jpg",""],["images/g/146-groverton-04.jpg",""],["images/g/146-groverton-05.jpg",""],["images/g/146-groverton-06.jpg",""],["images/g/146-groverton-07.jpg",""],["images/g/146-groverton-08.jpg",""]],
    "6020-lido": [["images/6020-lido.jpg","6020 Lido Ln"],["images/g/6020-lido-01.jpg",""],["images/g/6020-lido-02.jpg",""],["images/g/6020-lido-03.jpg",""]]
  };
  var LB_TITLES = {
    "879":"879 Linda Flora","903":"903 Linda Flora","1149-lindaflora":"1149 Linda Flora Dr",
    "10814-savona":"10814 Savona Rd","1132-chantilly":"1132 Chantilly Rd","14367-mulholland":"14367 Mulholland Dr",
    "9604-heather":"9604 Heather Rd","15415-milldale":"15415 Milldale Dr","146-groverton":"146 Groverton Pl","6020-lido":"6020 Lido Ln"
  };
  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lbImg");
  var lbTitle = document.getElementById("lbTitle");
  var lbCount = document.getElementById("lbCount");
  var lbGal = null, lbIdx = 0, dragMoved = false;

  function lbShow() {
    var item = GALLERIES[lbGal][lbIdx];
    lbImg.src = item[0];
    lbImg.alt = item[1] || LB_TITLES[lbGal];
    lbTitle.textContent = LB_TITLES[lbGal];
    lbCount.textContent = (lbIdx + 1) + " / " + GALLERIES[lbGal].length;
  }
  function lbOpen(key, idx) {
    if (!GALLERIES[key]) return;
    lbGal = key; lbIdx = idx || 0;
    lbShow();
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function lbClose() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function lbGo(idx) {
    var n = GALLERIES[lbGal].length;
    lbIdx = (idx + n) % n;
    lbImg.classList.add("fade");
    setTimeout(function () { lbShow(); lbImg.classList.remove("fade"); }, 200);
  }
  document.querySelectorAll("[data-gallery]").forEach(function (opener) {
    opener.addEventListener("click", function (e) {
      if (opener.closest(".strip") && opener.closest(".strip").classList.contains("was-dragged")) return;
      e.preventDefault();
      lbOpen(opener.getAttribute("data-gallery"), parseInt(opener.getAttribute("data-idx") || "0", 10));
    });
  });
  document.getElementById("lbClose").addEventListener("click", lbClose);
  document.getElementById("lbPrev").addEventListener("click", function () { lbGo(lbIdx - 1); });
  document.getElementById("lbNext").addEventListener("click", function () { lbGo(lbIdx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb__stage")) lbClose(); });
  window.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowLeft") lbGo(lbIdx - 1);
    if (e.key === "ArrowRight") lbGo(lbIdx + 1);
  });
  var lbTouchX = null;
  lb.addEventListener("touchstart", function (e) { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (lbTouchX === null) return;
    var dx = e.changedTouches[0].clientX - lbTouchX; lbTouchX = null;
    if (Math.abs(dx) > 50) lbGo(lbIdx + (dx < 0 ? 1 : -1));
  });

  /* ---------- Smooth anchor scrolling (JS, respects reduced motion) ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    if (a.hasAttribute("data-gallery")) return; // lightbox openers never scroll the page
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
