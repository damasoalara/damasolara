/* DamasoOS: the month view, the article and post views, the article list, and the framed brandscript.
   Public file (it loads after unlock, but anyone can fetch it): code only. Every word, name and
   number comes from the encrypted #os-data block. Routes live in the hash:
     #calendar, #2026-12, #/<item id>, #articles, #brandscript. */
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("os-data").textContent);
  var items = (DATA.items || []).slice().sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var KIND = { ig:"Instagram", substack:"Substack", plan:"The plan" };
  var BRAND = DATA.brand || { name:"", handle:"" };
  var DOCS = { brandscript:"/brandscript/" };
  var IVAN_SMS = DATA.sms || "";
  var APP = DATA.app || "OS";
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var main = $("#view");
  function ymd(d){ return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function longDate(s){ return new Date(s + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" }); }
  var ASK = new RegExp("\\[(" + (DATA.askName || "Ask") + "[^\\]]*)\\]", "g");
  function withAsks(s){ return esc(s).replace(ASK, '<span class="ask">$1</span>'); }
  function kind(it){
    if (it.type === "plan") return "plan";
    var p = (DATA.pillars || []).filter(function(x){ return (it.series || "").indexOf(x.name) === 0; })[0];
    return p ? p.key : "other";
  }
  var posts = items;
  var today = new Date(); today.setHours(12,0,0,0);
  var TODAY = ymd(today);
  function monthKey(y, m){ var d = new Date(y, m, 1); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0"); }
  function parseMonth(k){ var m = /^(\d{4})-(\d{2})$/.exec(k); return m ? { y:+m[1], m:+m[2]-1 } : null; }
  /* The sidebar. `sub` is a row under a section (a neighborhood's name); without it the section's main row
     is current. On a phone the names are hidden, so the main row carries data-within instead. */
  function setCurrent(route, sub){
    var cur = null, within = null;
    document.querySelectorAll(".bar nav a").forEach(function(a){
      var on = a.dataset.route === route && (a.dataset.sub || "") === (sub || "");
      if (on) { a.setAttribute("aria-current", "page"); cur = a; } else a.removeAttribute("aria-current");
      if (a.dataset.route === route && !a.dataset.sub && sub) { a.dataset.within = "true"; within = a; } else delete a.dataset.within;
    });
    document.querySelectorAll(".bar .sect").forEach(function(s){ s.dataset.hasCurrent = String(!!(cur && s.contains(cur))); });
    /* Keep the row you are on in sight: down the list on a desktop, along the tab row on a phone
       (where a name is hidden and its section's tab stands in for it). */
    var seen = cur && cur.offsetParent ? cur : within && within.offsetParent ? within : null;
    if (seen && seen.scrollIntoView) seen.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  /* Disclosure: each section opens and closes from its header. Closed ones are saved per browser;
     storage can be refused (private windows), so every access is guarded and open is the fallback. */
  (function(){
    var KEY = "dl-os-sections-closed", closed = [];
    try { closed = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { closed = []; }
    if (!Array.isArray(closed)) closed = [];
    function apply(s, open){ s.dataset.open = String(open); var b = $(".group", s); if (b) b.setAttribute("aria-expanded", String(open)); }
    document.querySelectorAll(".bar .sect").forEach(function(s){ apply(s, closed.indexOf(s.dataset.sect) < 0); });
    document.addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest(".bar .sect > .group"); if (!b) return;
      var s = b.parentNode, open = s.dataset.open === "false", k = s.dataset.sect, i = closed.indexOf(k);
      apply(s, open);
      if (open && i >= 0) closed.splice(i, 1); else if (!open && i < 0) closed.push(k);
      try { localStorage.setItem(KEY, JSON.stringify(closed)); } catch (err) {}
    });
  })();
  var CHEV_L = '<svg viewBox="0 0 11 19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 1.5 1.5 9.5l8 8"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 11 19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5l8 8-8 8"/></svg>';

  /* ---------- month ---------- */
  function chip(it){
    var sub = it.type === "plan" ? "" : KIND[it.type] + " · " + (it.series || "");
    var label = it.type === "substack" ? it.no + " · " + it.title : it.title;
    return '<button data-id="' + esc(it.id) + '" class="chip press c-' + it.type + ' k-' + kind(it) + '"><i class="dot k-' + kind(it) + '"></i><span class="tx">' + (sub ? '<small>' + esc(sub) + '</small>' : '') + esc(label) + '</span></button>';
  }
  function countLine(list){
    var a = list.filter(function(i){ return i.type === "substack"; }).length;
    var g = list.filter(function(i){ return i.type === "ig"; }).length;
    if (!a && !g) return "Nothing scheduled yet";
    var parts = [];
    if (a) parts.push(a + " article" + (a === 1 ? "" : "s"));
    if (g) parts.push(g + " post" + (g === 1 ? "" : "s"));
    return parts.join(" and ");
  }
  function showMonth(y, m){
    setCurrent("calendar");
    main.classList.remove("doc");
    var first = new Date(y, m, 1), start = new Date(first); start.setDate(1 - first.getDay());
    var last = new Date(y, m + 1, 0), cells = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
    var key = monthKey(y, m);
    var inMonth = items.filter(function(i){ return i.date.slice(0,7) === key; });
    var byDay = {}; inMonth.forEach(function(it){ (byDay[it.date] = byDay[it.date] || []).push(it); });
    var g = DOW.map(function(d){ return '<div class="dow">' + d + '</div>'; }).join("");
    for (var k = 0; k < cells; k++){
      var d = new Date(start); d.setDate(start.getDate() + k);
      var dk = ymd(d), inM = d.getMonth() === m, wk = d.getDay() === 0 || d.getDay() === 6;
      g += '<div class="day' + (inM ? "" : " out") + (wk ? " weekend" : "") + (dk === TODAY ? " today" : "") + (k >= cells - 7 ? " last" : "") + '"><span class="d">' + d.getDate() + '</span>' + (inM ? (byDay[dk] || []).map(chip).join("") : "") + '</div>';
    }
    var list = Object.keys(byDay).sort().map(function(dk){
      var d = new Date(dk + "T12:00:00");
      return '<div class="lday"><div class="d">' + d.getDate() + '<small>' + DOW[d.getDay()] + '</small></div><div class="items">' + byDay[dk].map(chip).join("") + '</div></div>';
    }).join("") || '<div class="empty">Nothing scheduled in ' + MON[m] + ' yet.</div>';
    main.innerHTML =
      '<div class="page-head"><h1>' + MON[m] + ' ' + y + '</h1><span class="count">' + countLine(inMonth) + '</span>' +
      '<div class="actions"><div class="monthnav" role="group" aria-label="Month"><button type="button" data-month="' + monthKey(y, m - 1) + '" aria-label="Previous month">' + CHEV_L + '</button><button type="button" data-month="' + monthKey(today.getFullYear(), today.getMonth()) + '">Today</button><button type="button" data-month="' + monthKey(y, m + 1) + '" aria-label="Next month">' + CHEV_R + '</button></div></div></div>' +
      '<div class="legend" aria-label="Pillars">' + (DATA.pillars || []).map(function(p){ return '<span><i class="dot k-' + esc(p.key) + '"></i>' + esc(p.name) + '</span>'; }).join("") + '</div>' +
      '<div class="cal"><div class="grid" aria-label="' + MON[m] + ' ' + y + '">' + g + '</div><div class="list">' + list + '</div></div>' +
      '<p class="cal-foot">' + esc(DATA.calFoot || "") + '</p>';
    document.title = APP + " · " + MON[m] + " " + y;
  }
  document.addEventListener("click", function(ev){
    var c = ev.target.closest("button.chip"); if (c) { location.hash = "#/" + c.dataset.id; return; }
    var b = ev.target.closest("[data-month]"); if (b) { location.hash = "#" + b.dataset.month; return; }
    var hb = ev.target.closest("[data-hash]"); if (hb) { location.hash = hb.dataset.hash; }
  });

  /* ---------- documents, framed ---------- */
  var TITLES = { brandscript:"Brandscript" };
  function showDoc(name){
    setCurrent(name);
    main.classList.add("doc");
    main.innerHTML = '<iframe class="doc-frame" src="' + DOCS[name] + '" title="' + TITLES[name] + '"></iframe>';
    document.title = APP + " · " + TITLES[name];
  }
  function showFramed(route, backHash, backLabel, title, meta, href){
    setCurrent(route);
    main.classList.add("doc");
    main.innerHTML = '<div class="doc-head"><button class="back" data-hash="' + backHash + '">' + CHEV_L + backLabel + '</button><span class="meta">' + esc(title) + (meta ? ' · ' + esc(meta) : '') + '</span></div>' +
      '<iframe class="doc-frame" src="' + esc(href) + '" title="' + esc(title) + '"></iframe>';
    document.title = APP + " · " + title;
  }

  /* ---------- articles: every Substack piece, published and planned ---------- */
  function shortDate(s){ return new Date(s + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" }); }
  var PILL = { published:["ok","Published"], ready:["accent","Ready"], draft:["warn","Draft"], todo:["","To write"] };
  function pill(st){ var p = PILL[st] || ["", st]; return '<span class="pill ' + p[0] + '">' + p[1] + '</span>'; }
  function band(title, aside, inner){ return '<div class="band"><h2>' + title + (aside ? '<span class="aside">' + aside + '</span>' : '') + '</h2>' + inner + '</div>'; }
  function articleRow(it){
    return '<a href="#/' + esc(it.id) + '" class="rowline"><span class="primary">' + esc(it.no + " · " + it.title) + pill(it.status) + '</span><span class="secondary">' + esc(it.series + (it.sub ? " · " + it.sub : "")) + '</span><span class="when">' + esc(shortDate(it.date)) + '</span></a>';
  }
  function showArticles(){
    setCurrent("articles"); main.classList.remove("doc");
    var arts = items.filter(function(i){ return i.type === "substack"; });
    var out = arts.filter(function(i){ return i.status === "published"; }).reverse();
    var next = arts.filter(function(i){ return i.status !== "published"; });
    main.innerHTML = '<div class="page-head"><h1>Articles</h1><span class="count">' + out.length + ' published, ' + next.length + ' coming</span></div>' +
      '<p class="page-note">' + esc(DATA.articlesNote || "") + '</p>' +
      band("Coming", "", '<div class="rows">' + next.map(articleRow).join("") + '</div>') +
      band("Published", "", '<div class="rows">' + out.map(articleRow).join("") + '</div>');
    document.title = APP + " · Articles";
  }

  /* ---------- a post ---------- */
  function head(it){
    var d = new Date(it.date + "T12:00:00");
    return '<div class="page-head"><button class="back" id="back" data-month="' + monthKey(d.getFullYear(), d.getMonth()) + '">' + CHEV_L + MON[d.getMonth()] + '</button><span class="meta">' + KIND[it.type] + '<br>' + esc(longDate(it.date)) + '</span></div>';
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
    main.innerHTML = head(it) + '<div class="inner">' + $("#plan").innerHTML + '<div class="row">' + smsLink(it) + '</div>' + pager(it) + '</div>';
  }
  var ICON = {
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.5 4.5c2.1 0 3.6 1.2 5.5 3.3 1.9-2.1 3.4-3.3 5.5-3.3 3.5 0 5.3 3.7 3.7 6.9C19 15.6 12 20 12 20z"/></svg>',
    comment:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M20.5 12a8.5 8.5 0 1 1-3.4-6.8A8.5 8.5 0 0 1 20.5 12z"/><path d="M20.5 20.5l-2.6-2.6"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M21.5 3 3 10.5l7.5 2.8L13 21z"/><path d="M10.5 13.3 21.5 3"/></svg>',
    save:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>'
  };
  var ARR = function(dir){ return '<button class="arr ' + dir + '" aria-label="' + (dir === "prev" ? "Previous slide" : "Next slide") + '"><i><svg viewBox="0 0 10 14" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (dir === "prev" ? "M7.5 1.5 2 7l5.5 5.5" : "M2.5 1.5 8 7l-5.5 5.5") + '"/></svg></i></button>'; };
  var MONO = '<span class="wm" aria-hidden="true">' + esc(BRAND.mark || "") + '</span>';
  function slide(s, it, i){
    var label = 'role="group" aria-label="Slide ' + (i+1) + ' of ' + it.slides.length + '"';
    // A rendered post (the quotes) shows the real image; the rest are drafted in CSS until a photo exists.
    if (s.k === "img") return '<div class="slide img" ' + label + '><img src="' + esc(s.img) + '" alt="" loading="lazy">' + (s.t ? '<div class="over">' + withAsks(s.t) + '</div>' : '') + '<div class="foot"><span>' + esc(BRAND.name) + '</span>' + MONO + '</div></div>';
    var st = 'background:var(--' + s.bg + ');color:var(--' + s.fg + ')';
    var foot = '<div class="foot"><span>' + esc(BRAND.name) + '</span>' + MONO + '</div>';
    var body;
    if (s.k === "photo") body = '<div class="pl">' + esc(s.label || "Photo") + '</div><div class="pd">' + esc(s.t) + '</div>';
    else if (s.k === "quote") body = '<div class="q">' + esc(s.t) + '</div><div class="who">' + esc(s.who) + '</div>';
    else if (s.k === "end") body = '<span class="wm bigmark" aria-hidden="true">' + esc(BRAND.mark || "") + '</span><div class="t s">' + withAsks(s.t) + '</div>';
    else body = '<div class="t' + (s.small ? " s" : "") + '">' + withAsks(s.t) + '</div>';
    return '<div class="slide ' + s.k + '" style="' + st + '" ' + label + '>' + body + (s.k === "end" ? "" : foot) + '</div>';
  }
  function showIg(it){
    var n = it.slides.length;
    var dots = n > 1 ? '<div class="dots">' + it.slides.map(function(_, i){ return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join("") + '</div>' : '';
    var when = new Date(it.date + "T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"});
    var card = '<div class="card"><span class="tag"><i class="dot k-' + kind(it) + '"></i>' + esc(it.series) + ' · ' + esc(it.format) + '</span><h2>' + esc(it.title) + '</h2><p class="muted">' + esc(longDate(it.date)) + '</p>' + needsHtml(it) + '<div class="row">' + smsLink(it, "w") + '</div></div>' + pager(it);
    var ig = '<div class="ig"><div class="sbar"></div><div class="tbar"><button id="igback" aria-label="Back to the month"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M15 4 7 12l8 8"/></svg></button><span>Posts</span></div>' +
      '<div class="ph"><span class="av">' + MONO + '</span><b>' + esc(BRAND.handle || BRAND.name) + '</b><span class="more">···</span></div>' +
      '<div class="car"><div class="track" id="track" tabindex="0" aria-label="Slides, swipe across">' + it.slides.map(function(s, i){ return slide(s, it, i); }).join("") + '</div>' +
      (n > 1 ? '<span class="pill" id="pill">1/' + n + '</span>' + ARR("prev") + ARR("next") : '') + '</div>' +
      '<div class="acts">' + ICON.heart + ICON.comment + ICON.send + dots + '<span class="bm">' + ICON.save + '</span></div>' +
      '<div class="cap"><b>' + esc(BRAND.handle || BRAND.name) + '</b>' + withAsks(it.caption) + '</div><div class="when">' + esc(when) + '</div>' +
      '<div class="fb">' + card + '</div></div>';
    main.innerHTML = head(it) + '<div class="igwrap"><div class="phone"><div class="screen">' + ig + '</div></div><div class="side">' + card + '</div></div>';
    var tr = $("#track", main), pill = $("#pill", main), pv = $(".arr.prev", main), nx = $(".arr.next", main);
    function sync(){
      var w = tr.clientWidth, i = w ? Math.round(tr.scrollLeft / w) : 0;
      if (pill) pill.textContent = (i+1) + "/" + n;
      main.querySelectorAll(".dots i").forEach(function(d, k){ d.classList.toggle("on", k === i); });
      if (pv) pv.hidden = i === 0;
      if (nx) nx.hidden = i === n - 1;
    }
    function go(step){ tr.scrollBy({ left: step * tr.clientWidth }); }
    tr.addEventListener("scroll", sync, { passive:true });
    tr.addEventListener("keydown", function(e){ if (e.key === "ArrowRight" || e.key === "ArrowLeft"){ e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); } });
    if (pv) pv.onclick = function(){ go(-1); };
    if (nx) nx.onclick = function(){ go(1); };
    sync();
    var d = new Date(it.date + "T12:00:00");
    $("#igback", main).onclick = function(){ location.hash = "#" + monthKey(d.getFullYear(), d.getMonth()); };
  }
  function showArticle(it){
    main.innerHTML = head(it) + '<div class="inner article">' +
      (it.img ? '<div class="cover"><img src="' + esc(it.img) + '" alt=""></div>' : '') +
      '<p class="tag"><i class="dot k-' + kind(it) + '"></i>' + esc(it.series) + ' · ' + esc(it.no) + pill(it.status) + '</p>' +
      '<h2 class="atitle">' + esc(it.title) + '</h2><p class="asub">' + esc(it.sub || "") + '</p>' +
      '<p class="when">Substack, ' + esc(longDate(it.date)) + (it.url ? ' · <a href="' + esc(it.url) + '" target="_blank" rel="noopener">Read it on Substack</a>' : '') + '</p>' +
      ((it.excerpt || []).length ? '<div class="excerpt">' + it.excerpt.map(function(p){ return '<p>' + esc(p) + '</p>'; }).join("") + '</div>' : '') +
      needsHtml(it) + '<div class="row">' + smsLink(it) + '</div>' + pager(it) + '</div>';
  }
  function showItem(it){
    setCurrent("calendar");
    main.classList.remove("doc");
    main.classList.add("post");
    (it.type === "ig" ? showIg : it.type === "substack" ? showArticle : showPlan)(it);
    document.title = APP + " · " + it.title;
  }

  /* ---------- routing ---------- */
  function currentMonth(){
    var h = (location.hash || "#calendar").slice(1);
    return parseMonth(h) || (h === "calendar" ? { y: today.getFullYear(), m: today.getMonth() } : null);
  }
  function route(){
    var h = location.hash || "#calendar";
    main.classList.remove("post");
    var mm;
    if (h === "#articles") { showArticles(); }
    else if (DOCS[h.slice(1)]) { showDoc(h.slice(1)); }
    else if ((mm = h.match(/^#\/([a-z0-9-]+)$/))) {
      var it = items.filter(function(x){ return x.id === mm[1]; })[0];
      if (it) showItem(it); else showMonth(today.getFullYear(), today.getMonth());
    }
    else if ((mm = parseMonth(h.slice(1)))) { showMonth(mm.y, mm.m); }
    else { showMonth(today.getFullYear(), today.getMonth()); }
    window.scrollTo(0, 0); main.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", function(e){
    if (e.target.closest("input,textarea,iframe")) return;
    var mm = currentMonth(); if (!mm) return;
    if (e.key === "ArrowLeft") location.hash = "#" + monthKey(mm.y, mm.m - 1);
    if (e.key === "ArrowRight") location.hash = "#" + monthKey(mm.y, mm.m + 1);
  });
  if (window.dlTheme) window.dlTheme();
  route();
})();
