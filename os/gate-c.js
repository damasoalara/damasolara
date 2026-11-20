/* Protected page gate (protected-page skill). The page content ships encrypted (AES-GCM, key
   from PBKDF2-SHA256). Nothing here can check the password: the only way to read the page is to
   derive the right key and decrypt. A wrong password simply fails to decrypt.
   "Remember this device" keeps the derived key (never the password) in this browser only. */
(function () {
  /* The page's own <head> scripts, moved here so the page runs under script-src 'self'. */


  var KEY_STORE = "dl-os-key-v1";
  var TITLE = "DamasoOS";
  var EXTERNAL = ["/os/assets/app-c.js"];

  function b64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  function payload() { return JSON.parse(document.getElementById("pp-payload").textContent); }

  function derive(pass, p) {
    return crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]).then(function (base) {
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
  function loadExternal(i, done) {
    if (i >= EXTERNAL.length) { setTimeout(done, 0); return; }
    var s = document.createElement("script");
    s.src = EXTERNAL[i];
    s.onload = s.onerror = function () { loadExternal(i + 1, done); };
    document.body.appendChild(s);
  }
  function reveal(markup) {
    document.getElementById("pp-root").innerHTML = markup;
    document.getElementById("pp-gate").remove();
    if (TITLE) document.title = TITLE;
    window.scrollTo(0, 0);
    /* The page has long finished loading by now, so any DOMContentLoaded or load listener the
       page's scripts register would never fire. Run those handlers right away instead. */
    var dAdd = document.addEventListener, wAdd = window.addEventListener;
    function late(orig, target) {
      return function (type, fn, opts) {
        if (type === "DOMContentLoaded" || type === "load") { setTimeout(function () { fn.call(target, new Event(type)); }, 0); return; }
        return orig.call(target, type, fn, opts);
      };
    }
    document.addEventListener = late(dAdd, document);
    window.addEventListener = late(wAdd, window);
    try { init(); } catch (e) { if (window.console) console.error(e); }
    loadExternal(0, function () { document.addEventListener = dAdd; window.addEventListener = wAdd; });
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
    var form = document.getElementById("pp-form");
    var input = document.getElementById("pp-pw");
    var keep = document.getElementById("pp-keep");
    var msg = document.getElementById("pp-msg");
    var btn = form.querySelector("button");

    if (!window.crypto || !crypto.subtle) {
      msg.textContent = "This browser can't open the page. Try Safari or Chrome.";
      document.getElementById("pp-gate").classList.add("ready");
      return;
    }
    tryStored(p).then(reveal, function () {
      document.getElementById("pp-gate").classList.add("ready");
      input.focus({ preventScroll: true });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!input.value) return;
      btn.disabled = true; msg.textContent = "Opening…"; msg.className = "pp-msg";
      derive(input.value, p).then(function (key) {
        return open(key, p).then(function (markup) {
          return (keep && keep.checked ? remember(key) : Promise.resolve()).then(function () { reveal(markup); });
        });
      }).catch(function () {
        btn.disabled = false;
        msg.textContent = "That's not it. Try again.";
        msg.className = "pp-msg pp-msg--err";
        input.select();
      });
    });
  });

  /* The page's own inline <body> scripts, in order, run once the content is in the DOM. */
  function init() {

  }
})();
