/* Brandscript gate. The page content ships encrypted (AES-GCM, key from PBKDF2-SHA256,
   600,000 rounds). Nothing here can check the password: the only way to read the page is
   to derive the right key and decrypt. A wrong password simply fails to decrypt.
   "Remember this device" keeps the derived key (not the password) in this browser only. */
(function () {
  var html = document.documentElement;
  html.classList.add("js");
  try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) html.classList.add("rm"); } catch (e) {}

  var KEY_STORE = "dl-brandscript-key-v1";
  function b64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }

  function payload() {
    var el = document.getElementById("payload");
    return JSON.parse(el.textContent);
  }

  function derive(pass, p) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64(p.salt), iterations: p.iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
    });
  }

  function open(key, p) {
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(p.iv) }, key, b64(p.ct)).then(function (buf) {
      return new TextDecoder().decode(buf);
    });
  }

  function reveal(markup) {
    var gate = document.getElementById("gate");
    var root = document.getElementById("root");
    root.innerHTML = markup;
    gate.remove();
    document.title = "Brandscript · Damaso Lara";
    window.scrollTo(0, 0);
    init();
  }

  function remember(key) {
    return crypto.subtle.exportKey("raw", key).then(function (raw) {
      try { localStorage.setItem(KEY_STORE, btoa(String.fromCharCode.apply(null, new Uint8Array(raw)))); } catch (e) {}
    });
  }

  function tryStored(p) {
    var s = null;
    try { s = localStorage.getItem(KEY_STORE); } catch (e) {}
    if (!s) return Promise.reject();
    return crypto.subtle.importKey("raw", b64(s), { name: "AES-GCM" }, false, ["decrypt"])
      .then(function (k) { return open(k, p); })
      .catch(function (e) { try { localStorage.removeItem(KEY_STORE); } catch (x) {} throw e; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var p = payload();
    var form = document.getElementById("gateForm");
    var input = document.getElementById("pw");
    var keep = document.getElementById("keep");
    var msg = document.getElementById("gateMsg");
    var btn = form.querySelector("button");

    if (!window.crypto || !crypto.subtle) {
      msg.textContent = "This browser can't open the page. Try Safari or Chrome.";
      return;
    }

    tryStored(p).then(reveal, function () {
      document.getElementById("gate").classList.add("ready");
      input.focus({ preventScroll: true });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var pass = input.value;
      if (!pass) return;
      btn.disabled = true; msg.textContent = "Opening…"; msg.className = "gate__msg";
      derive(pass, p).then(function (key) {
        return open(key, p).then(function (markup) {
          var done = keep.checked ? remember(key) : Promise.resolve();
          return done.then(function () { reveal(markup); });
        });
      }).catch(function () {
        btn.disabled = false;
        msg.textContent = "That's not it. Try again.";
        msg.className = "gate__msg gate__msg--err";
        input.select();
      });
    });
  });

  /* Everything below is the page's own behaviour, run once the content is in. */
  function init() {
  var html = document.documentElement;
  var rm = html.classList.contains("rm");

  /* Hero settles in once the image is ready (or immediately if cached). */
  var hero = document.querySelector(".hero");
  var hImg = hero.querySelector("img");
  function heroIn() { hero.classList.add("in"); }
  if (hImg.complete) heroIn(); else { hImg.addEventListener("load", heroIn); setTimeout(heroIn, 1200); }

  /* Reveals. If IntersectionObserver is missing, show everything. */
  var rvs = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !rm) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add("in"); });
  }

  /* Word paint on the one-liner: split into words, light them as the line scrolls through. */
  var paint = document.getElementById("paint");
  var words = [];
  (function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          var s = document.createElement("span"); s.className = "w"; s.textContent = t; frag.appendChild(s); words.push(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName === "EM") {
        var inner = n.textContent; n.textContent = "";
        inner.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { n.appendChild(document.createTextNode(t)); return; }
          var e = document.createElement("em"); e.className = "w"; e.textContent = t; n.appendChild(e); words.push(e);
        });
        n.outerHTML = n.innerHTML;
      }
    });
  })(paint);
  words = Array.prototype.slice.call(paint.querySelectorAll(".w"));

  /* Chapter rail for the top bar. */
  var bar = document.getElementById("bar");
  var barChap = document.getElementById("barChap");
  var chaps = Array.prototype.slice.call(document.querySelectorAll(".chap"));
  var prog = document.getElementById("prog");
  var last = "";

  function onScroll() {
    var y = window.scrollY, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    bar.classList.toggle("show", y > hero.offsetHeight - 80);

    if (!rm) {
      var r = paint.getBoundingClientRect();
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      var lit = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < lit);
    }

    var cur = null;
    for (var j = 0; j < chaps.length; j++) {
      if (chaps[j].getBoundingClientRect().top < vh * 0.4) cur = chaps[j];
    }
    var label = cur ? "<b>" + cur.getAttribute("data-n") + "</b>" + cur.getAttribute("data-t") : "<b>00</b>Brandscript";
    var past = document.querySelector(".voice").getBoundingClientRect().top < vh * 0.4;
    if (past) label = "<b>&middot;</b>How we sound";
    if (document.querySelector(".rules-dark").getBoundingClientRect().top < vh * 0.4) label = "<b>&middot;</b>The discretion rules";
    if (document.querySelector(".look").getBoundingClientRect().top < vh * 0.4) label = "<b>&middot;</b>How we look";
    if (document.querySelector(".pillars").getBoundingClientRect().top < vh * 0.4) label = "<b>&middot;</b>Pillars";
    if (document.querySelector(".next").getBoundingClientRect().top < vh * 0.4) label = "<b>&middot;</b>What I need from you";
    if (label !== last) { barChap.innerHTML = label; last = label; }
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* Stakes / success switch (phones; on desktop both panes show side by side). */
  var tabs = [document.getElementById("tWin"), document.getElementById("tFail")];
  var panes = { tWin: document.getElementById("pWin"), tFail: document.getElementById("pFail") };
  var pill = document.querySelector(".seg i");
  function select(t) {
    tabs.forEach(function (b) {
      var on = b === t;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if (on) panes[b.id].removeAttribute("hidden"); else panes[b.id].setAttribute("hidden", "");
    });
    pill.style.width = t.offsetWidth + "px";
    pill.style.transform = "translateX(" + (t.offsetLeft - 4) + "px)";
  }
  tabs.forEach(function (b, i) {
    b.addEventListener("click", function () { select(b); });
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var n = tabs[(i + 1) % 2]; n.focus(); select(n); }
    });
  });
  select(tabs[0]);
  window.addEventListener("resize", function () { select(tabs.filter(function (b) { return b.getAttribute("aria-selected") === "true"; })[0]); });
  }
})();
