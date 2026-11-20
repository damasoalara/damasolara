/* Appearance: Auto follows the system, Light and Dark pin it. Loaded in the <head> so the saved
   choice applies before first paint. Saved per browser; storage can be refused (private windows),
   so every access is guarded and Auto is the fallback. Public file: no names, no data. */
(function () {
  var KEY = "dl-os-theme";
  function read() { try { return localStorage.getItem(KEY) || "system"; } catch (e) { return "system"; } }
  function apply(v) {
    if (v === "light" || v === "dark") document.documentElement.setAttribute("data-theme", v);
    else document.documentElement.removeAttribute("data-theme");
    var bs = document.querySelectorAll("[data-theme-set]");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(bs[i].getAttribute("data-theme-set") === v));
  }
  window.dlTheme = function () { apply(read()); };
  apply(read());
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-theme-set]");
    if (!b) return;
    var v = b.getAttribute("data-theme-set");
    try { localStorage.setItem(KEY, v); } catch (err) {}
    apply(v);
  });
})();
