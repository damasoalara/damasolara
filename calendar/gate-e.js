/* Protected page gate (protected-page skill). The page content ships encrypted (AES-GCM, key
   from PBKDF2-SHA256). Nothing here can check the password: the only way to read the page is to
   derive the right key and decrypt. A wrong password simply fails to decrypt.
   "Remember this device" keeps the derived key (never the password) in this browser only. */
(function () {
  /* The page's own <head> scripts, moved here so the page runs under script-src 'self'. */


  var KEY_STORE = "dl-os-key-v1";
  var TITLE = "Damaso Lara · Content calendar";
  var EXTERNAL = [];

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
/* Damaso's content calendar. Adapted from Drew's (~/Code/davis-group), which was adapted from
   Jo's. Static: the content is the JSON block #cal-data, encrypted with the rest of the page. */
(function(){
  "use strict";
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var DATA = JSON.parse($("#cal-data").textContent);
  var items = DATA.items.slice().sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var KIND = { ig:"Instagram", substack:"Substack", plan:"The plan" };
  var IVAN_SMS = DATA.sms || "";  // lives in the encrypted data, never in this public file
  function ymd(d){ return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function longDate(s){ return new Date(s + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" }); }
  function monthName(m){ return new Date(m.year, m.month, 1).toLocaleDateString("en-US", { month:"long" }); }
  // "[Damaso: ...]" in a caption or slide shows as an amber ask, like Jo's and Drew's calendars.
  function withAsks(s){ return esc(s).replace(/\[(Damaso[^\]]*)\]/g, '<span class="ask">$1</span>'); }
  function kind(it){
    if (it.type === "plan") return "plan";
    var m = /^(The Street|The Deal|The People|The Life|On the Record)/.exec(it.series || "");
    return m ? m[1].toLowerCase().replace(/^the /, "").replace(/ /g, "") : "other";
  }
  var posts = items;

  function chip(it){
    var sub = it.type === "plan" ? KIND.plan : KIND[it.type] + " · " + it.series;
    var label = it.type === "substack" ? it.no + " · " + it.title : it.title;
    return '<button data-id="' + esc(it.id) + '" class="chip press c-' + it.type + '"><i class="dot k-' + kind(it) + '"></i><span class="tx">' + (it.type === "plan" ? "" : '<small>' + esc(sub) + '</small>') + esc(label) + '</span></button>';
  }
  function render(){
    var a = items.filter(function(i){ return i.type === "substack"; }).length;
    var g = items.filter(function(i){ return i.type === "ig"; }).length;
    $("#count").textContent = a + " articles and " + g + " Instagram posts";
    var byDay = {}; items.forEach(function(it){ (byDay[it.date] = byDay[it.date] || []).push(it); });
    var html = "", list = "";
    DATA.months.forEach(function(M){
      var first = new Date(M.year, M.month, 1), start = new Date(first); start.setDate(1 - first.getDay());
      var last = new Date(M.year, M.month + 1, 0), cells = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
      var gr = DOW.map(function(d){ return '<div class="dow">' + d + '</div>'; }).join("");
      for (var k = 0; k < cells; k++){
        var d = new Date(start); d.setDate(start.getDate() + k);
        var key = ymd(d), inM = d.getMonth() === M.month, wk = d.getDay() === 0 || d.getDay() === 6;
        gr += '<div class="day' + (inM ? "" : " out") + (wk ? " weekend" : "") + (k >= cells - 7 ? " last" : "") + '"><span class="d">' + d.getDate() + '</span>' + (inM ? (byDay[key] || []).map(chip).join("") : "") + '</div>';
      }
      html += '<section class="month"><h2 class="mname">' + monthName(M) + '</h2><div class="cal"><div class="grid">' + gr + '</div></div></section>';
      var keys = Object.keys(byDay).sort().filter(function(key){ var x = new Date(key + "T12:00:00"); return x.getMonth() === M.month && x.getFullYear() === M.year; });
      list += '<section class="month"><h2 class="mname">' + monthName(M) + '</h2><div class="cal list">' + keys.map(function(key){
        var x = new Date(key + "T12:00:00");
        return '<div class="lday"><div class="d">' + x.getDate() + '<small>' + DOW[x.getDay()] + '</small></div><div class="items">' + byDay[key].map(chip).join("") + '</div></div>';
      }).join("") + '</div></section>';
    });
    $("#months").innerHTML = html;
    $("#mlist").innerHTML = list;
  }
  document.addEventListener("click", function(ev){
    var c = ev.target.closest("button.chip"); if (c) location.hash = "#/" + c.dataset.id;
  });

  /* ---------- item view ---------- */
  var view = $("#view"), lastFocus = null;
  var CHEV_L = '<svg viewBox="0 0 11 19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 1.5 1.5 9.5l8 8"/></svg>';
  function close(){ if (location.hash) history.pushState("", document.title, location.pathname); route(); }
  function bar(it){
    return '<div class="bar"><button class="back" id="back">' + CHEV_L + 'Calendar</button><span class="meta">' + KIND[it.type] + '<br>' + esc(longDate(it.date)) + '</span></div>';
  }
  function smsLink(it, cls){
    return '<a class="btn s press ' + (cls || "") + '" href="sms:' + IVAN_SMS + '?&body=' + encodeURIComponent("About “" + it.title + "”: ") + '">Text Ivan a note</a>';
  }
  function pager(it){
    var i = posts.indexOf(it), prev = posts[i-1], next = posts[i+1];
    var b = function(p, label){ return p ? '<a class="btn s press" href="#/' + p.id + '">' + label + '</a>' : '<span class="btn s" disabled aria-disabled="true">' + label + '</span>'; };
    return '<div class="pager">' + b(prev, "Previous") + b(next, "Next") + '</div>';
  }
  function needsHtml(it){
    if (!(it.needs || []).length) return "";
    return '<h3>Before it goes out</h3><ul class="checks">' + it.needs.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join("") + '</ul>';
  }

  function showPlan(it){
    view.innerHTML = bar(it) + '<div class="inner">' + $("#plan").innerHTML + '<div class="row">' + smsLink(it) + '</div>' + pager(it) + '</div>';
  }
  function showArticle(it){
    var st = /^Ready/.test(it.status) ? "ok" : /^To write/.test(it.status) ? "todo" : "draft";
    view.innerHTML = bar(it) + '<div class="inner article">' +
      (it.img ? '<div class="cover"><img src="' + esc(it.img) + '" alt=""></div>' : '') +
      '<p class="tag"><i class="dot k-' + kind(it) + '"></i>' + esc(it.series) + ' · ' + esc(it.no) + '<span class="st st-' + st + '">' + esc(it.status) + '</span></p>' +
      '<h2 class="atitle">' + esc(it.title) + '</h2><p class="asub">' + esc(it.sub) + '</p>' +
      '<p class="muted when">Substack, ' + esc(longDate(it.date)) + ', 9am</p>' +
      '<div class="excerpt">' + (it.excerpt || []).map(function(p){ return '<p>' + esc(p) + '</p>'; }).join("") + '</div>' +
      needsHtml(it) + '<div class="row">' + smsLink(it) + '</div>' + pager(it) + '</div>';
  }

  var ICON = {
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.5 4.5c2.1 0 3.6 1.2 5.5 3.3 1.9-2.1 3.4-3.3 5.5-3.3 3.5 0 5.3 3.7 3.7 6.9C19 15.6 12 20 12 20z"/></svg>',
    comment:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M20.5 12a8.5 8.5 0 1 1-3.4-6.8A8.5 8.5 0 0 1 20.5 12z"/><path d="M20.5 20.5l-2.6-2.6"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M21.5 3 3 10.5l7.5 2.8L13 21z"/><path d="M10.5 13.3 21.5 3"/></svg>',
    save:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>'
  };
  var ARR = function(dir){ return '<button class="arr ' + dir + '" aria-label="' + (dir === "prev" ? "Previous slide" : "Next slide") + '"><i><svg viewBox="0 0 10 14" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (dir === "prev" ? "M7.5 1.5 2 7l5.5 5.5" : "M2.5 1.5 8 7l-5.5 5.5") + '"/></svg></i></button>'; };
  var MONO = '<span class="wm">DL</span>';
  function slide(s, it, i){
    var foot = '<div class="foot"><span>Damaso Lara</span>' + MONO + '</div>';
    var body, st;
    if (s.k === "img"){
      st = 'background:var(--navy);color:var(--paper)';
      body = '<img class="bgimg" src="' + esc(s.src) + '" alt="">' + (s.t ? '<div class="t s over">' + withAsks(s.t) + '</div>' : '');
    } else {
      st = 'background:var(--' + s.bg + ');color:var(--' + s.fg + ')';
      if (s.k === "end") body = '<span class="wm big" aria-hidden="true">DL</span><div class="t s">' + withAsks(s.t) + '</div>';
      else body = '<div class="t' + (s.small ? " s" : "") + '">' + withAsks(s.t) + '</div>';
    }
    return '<div class="slide ' + s.k + '" style="' + st + '" role="group" aria-label="Slide ' + (i+1) + ' of ' + it.slides.length + '">' + body + (s.k === "end" ? "" : foot) + '</div>';
  }
  function showIg(it){
    view.classList.add("igmode");
    var n = it.slides.length;
    var dots = n > 1 ? '<div class="dots">' + it.slides.map(function(_, i){ return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join("") + '</div>' : '';
    var when = new Date(it.date + "T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"});
    var card = '<div class="card"><p class="tag"><i class="dot k-' + kind(it) + '"></i>' + esc(it.series) + ' · ' + esc(it.format) + '</p><h2>' + esc(it.title) + '</h2><p class="muted">' + esc(longDate(it.date)) + '</p>' + needsHtml(it) + '<div class="row">' + smsLink(it, "w") + '</div></div>' + pager(it);
    var ig = '<div class="ig"><div class="sbar"></div><div class="tbar"><button id="igback" aria-label="Back to the calendar"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M15 4 7 12l8 8"/></svg></button><span>Posts</span></div>' +
      '<div class="ph"><span class="av">' + MONO + '</span><b>Damaso Lara</b><span class="more">···</span></div>' +
      '<div class="car"><div class="track" id="track" tabindex="0" aria-label="Slides, swipe across">' + it.slides.map(function(s, i){ return slide(s, it, i); }).join("") + '</div>' +
      (n > 1 ? '<span class="pill" id="pill">1/' + n + '</span>' + ARR("prev") + ARR("next") : '') + '</div>' +
      '<div class="acts">' + ICON.heart + ICON.comment + ICON.send + dots + '<span class="bm">' + ICON.save + '</span></div>' +
      '<div class="cap"><b>Damaso Lara</b>' + withAsks(it.caption) + '</div><div class="when">' + esc(when) + '</div>' +
      '<div class="fb">' + card + '</div></div>';
    view.innerHTML = bar(it) + '<div class="igwrap"><div class="phone"><div class="screen">' + ig + '</div></div><div class="side">' + card + '</div></div>';
    var tr = $("#track", view), pill = $("#pill", view), pv = $(".arr.prev", view), nx = $(".arr.next", view);
    function sync(){
      var w = tr.clientWidth, i = w ? Math.round(tr.scrollLeft / w) : 0;
      if (pill) pill.textContent = (i+1) + "/" + n;
      view.querySelectorAll(".dots i").forEach(function(d, k){ d.classList.toggle("on", k === i); });
      if (pv) pv.hidden = i === 0;
      if (nx) nx.hidden = i === n - 1;
    }
    function go(step){ tr.scrollBy({ left: step * tr.clientWidth }); }
    tr.addEventListener("scroll", sync, { passive:true });
    tr.addEventListener("keydown", function(e){ if (e.key === "ArrowRight" || e.key === "ArrowLeft"){ e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); } });
    if (pv) pv.onclick = function(){ go(-1); };
    if (nx) nx.onclick = function(){ go(1); };
    sync();
    $("#igback", view).onclick = close;
  }
  function show(it){
    view.classList.remove("igmode", "open");
    (it.type === "ig" ? showIg : it.type === "substack" ? showArticle : showPlan)(it);
    $("#back", view).onclick = close;
    var wasHidden = view.hidden;
    view.hidden = false; document.body.style.overflow = "hidden";
    if (wasHidden) { void view.offsetWidth; view.classList.add("open"); }
    view.scrollTop = 0; view.focus();
    var t = $("#track", view); if (t) t.dispatchEvent(new Event("scroll"));
  }
  function route(){
    var m = location.hash.match(/^#\/([a-z0-9-]+)$/), it = m && items.filter(function(x){ return x.id === m[1]; })[0];
    if (!it){ view.hidden = true; view.innerHTML = ""; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); return; }
    if (view.hidden) lastFocus = document.activeElement;
    show(it);
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !view.hidden) close(); });
  render(); route();
})();
  }
})();
