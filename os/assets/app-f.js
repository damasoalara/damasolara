/* DamasoOS: the month view, the article and post views, the article list, and the framed brandscript.
   Public file (it loads after unlock, but anyone can fetch it): code only. Every word, name and
   number comes from the encrypted #os-data block. Routes live in the hash:
     #calendar, #2026-12, #/<item id>, #articles, #brandscript. */
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("os-data").textContent);
  /* Parity with the account (Ivan, 2026-11-19, the DavisOS feature). DATA.posted is what is actually on Instagram,
     written by posted.py from a read of the grid. A post that fulfils a planned item marks it posted and shows what
     went up; one that went up off-plan joins the calendar on its own day. */
  var POSTED = (DATA.posted || []).slice(), raw = (DATA.items || []).slice();
  POSTED.forEach(function(p){
    var it = p.plan && raw.filter(function(x){ return x.id === p.plan; })[0];
    if (it) { it.posted = p; return; }
    raw.push({ id:"ig-" + p.code.toLowerCase().replace(/[^a-z0-9]/g, ""), type:"ig", account:true, posted:p, date:p.date, series:"Posted", format:p.format, title:p.title,
      slides:[{ k:"img", img:p.img, t:p.title }], caption:p.caption || "" });
  });
  var items = raw.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  /* Drop zones (Ivan, 2026-11-19). Every slide that needs a photo gets an ID: the post's month and day plus the
     slide number ("1201-2"), with a letter after the day when two posts share it ("1124a-1"). posts.py computes it
     the same way; change one, change both. Photos and renders exist only in the local build (DATA.drops and
     DATA.renders): the site's repository is public, so an unposted photo never goes into it. */
  var DROPS = DATA.drops || {}, RENDERS = DATA.renders || {}, LOCAL = !!DATA.local;
  var dayKey = {};
  (function(){
    var byDate = {};
    items.forEach(function(it){ if (it.type === "ig" && !it.account) (byDate[it.date] = byDate[it.date] || []).push(it); });
    Object.keys(byDate).forEach(function(d){
      byDate[d].forEach(function(it, k, l){ dayKey[it.id] = d.slice(5, 7) + d.slice(8, 10) + (l.length > 1 ? "abcdefgh"[k] : ""); });
    });
  })();
  function dropId(it, i){ return (dayKey[it.id] || "") + "-" + (i + 1); }
  var HOODS = (DATA.neighborhoods && DATA.neighborhoods.pages) || [], SHOTS = (DATA.neighborhoods && DATA.neighborhoods.shotList) || [];
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
  // A planned post whose day has passed and that is not on the account. Only meaningful once the grid has been read.
  function missed(it){ return POSTED.length > 0 && it.type === "ig" && !it.posted && it.date < TODAY && it.date >= (DATA.parityFrom || "9999"); }
  var TICK = '<span class="tick" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 5 8.5l4.5-5"/></svg></span>';
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
    var st = it.posted ? " is-posted" : missed(it) ? " is-missed" : "";
    var note = it.posted ? '<span class="vh">, on Instagram</span>' : missed(it) ? '<span class="vh">, not posted</span>' : "";
    return '<button data-id="' + esc(it.id) + '" class="chip press c-' + it.type + ' k-' + kind(it) + st + '">' + (it.posted ? TICK : '<i class="dot k-' + kind(it) + '"></i>') + '<span class="tx">' + (sub ? '<small>' + esc(sub) + '</small>' : '') + esc(label) + note + '</span></button>';
  }
  function countLine(list){
    var a = list.filter(function(i){ return i.type === "substack"; }).length;
    var g = list.filter(function(i){ return i.type === "ig"; }).length;
    if (!a && !g) return "Nothing scheduled yet";
    var parts = [];
    if (a) parts.push(a + " article" + (a === 1 ? "" : "s"));
    if (g) parts.push(g + " post" + (g === 1 ? "" : "s"));
    var up = list.filter(function(i){ return i.posted; }).length;
    return parts.join(" and ") + (up ? ", " + up + " on Instagram" : "");
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
      '<div class="legend" aria-label="Pillars">' + (DATA.pillars || []).map(function(p){ return '<span><i class="dot k-' + esc(p.key) + '"></i>' + esc(p.name) + '</span>'; }).join("") + (POSTED.length ? '<span>' + TICK + 'On Instagram</span>' : '') + '</div>' +
      '<div class="cal"><div class="grid" aria-label="' + MON[m] + ' ' + y + '">' + g + '</div><div class="list">' + list + '</div></div>' +
      '<p class="cal-foot">' + esc(DATA.calFoot || "") + (POSTED.length && DATA.postedAt ? ' A tick means it is on Instagram, read from the account ' + esc(new Date(DATA.postedAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })) + '.' : '') + '</p>';
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
  var PILL = { published:["ok","Published"], scheduled:["go","Scheduled"], ready:["go","Ready to post"], waiting:["warn","Waiting"], draft:["warn","Waiting"], todo:["","To write"] };
  function pill(st){ var p = PILL[st] || ["", st]; return '<span class="pill ' + p[0] + '">' + p[1] + '</span>'; }
  function band(title, aside, inner){ return '<div class="band"><h2>' + title + (aside ? '<span class="aside">' + aside + '</span>' : '') + '</h2>' + inner + '</div>'; }
  function waitLine(it){ return it.waitingOn ? "On " + it.waitingOn + ": " + it.waitingFor : ""; }
  function articleRow(it){
    var second = it.status === "published" ? it.series + (it.sub ? " · " + it.sub : "") : (waitLine(it) || it.series);
    return '<a href="#/' + esc(it.id) + '" class="rowline st-' + esc(it.status) + '"><span class="primary">' + esc(it.no + " · " + it.title) + pill(it.status) + '</span><span class="secondary">' + esc(second) + '</span><span class="when">' + esc(shortDate(it.date)) + '</span></a>';
  }
  function showArticles(){
    setCurrent("articles"); main.classList.remove("doc");
    var arts = items.filter(function(i){ return i.type === "substack"; });
    var by = function(st){ return arts.filter(function(i){ return st.indexOf(i.status) >= 0; }); };
    var out = by(["published"]).reverse(), ready = by(["scheduled","ready"]), wait = by(["waiting","draft"]), todo = by(["todo"]);
    var list = function(a){ return a.length ? '<div class="rows">' + a.map(articleRow).join("") + '</div>' : ''; };
    main.innerHTML = '<div class="page-head"><h1>Articles</h1><span class="count">' + out.length + ' published, ' + (arts.length - out.length) + ' coming</span></div>' +
      '<p class="page-note">' + esc(DATA.articlesNote || "") + '</p>' +
      (ready.length ? band("Ready to post", "and scheduled", list(ready)) : '') +
      (wait.length ? band("Waiting", "on one of us", list(wait)) : '') +
      (todo.length ? band("To write", "", list(todo)) : '') +
      band("Published", "the archive, from 001", list(out));
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
  var DROP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>';
  function slide(s, it, i){
    var label = 'role="group" aria-label="Slide ' + (i+1) + ' of ' + it.slides.length + '"';
    if (s.k === "photo" && !it.account) {
      var id = dropId(it, i);
      if (DROPS[id] && /\.(mp4|mov)$/i.test(DROPS[id])) return '<div class="slide img" ' + label + '><video src="' + esc(DROPS[id]) + '" muted loop playsinline autoplay preload="metadata"></video></div>';
      if (DROPS[id]) return '<div class="slide img" ' + label + '><img src="' + esc(DROPS[id]) + '" alt="' + esc(s.t) + '" loading="lazy"></div>';
      return '<div class="slide drop" style="background:var(--' + (s.bg || "s-paper") + ');color:var(--' + (s.fg || "s-ink") + ')" ' + label + '><div class="dz">' + DROP_ICON +
        '<div class="dz-id">' + esc(id) + '</div><div class="dz-l">' + esc(it.format === "Reel" ? "Video goes here" : "Photo goes here") + '</div><div class="dz-d">' + withAsks(s.t) + '</div></div></div>';
    }
    // A rendered post (the quotes) shows the real image; the rest are drafted in CSS until a photo exists.
    if (s.k === "img" && (it.account || s.bare)) return '<div class="slide img" ' + label + '><img src="' + esc(s.img) + '" alt="' + esc(s.t || "") + '" loading="lazy"></div>';
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
  /* Downloads at Instagram's portrait size, 1080x1350 (4:5), rendered by posts.py from the #render route, so a file
     is exactly what the preview shows. Only the local build has them; the live OS says where they are. */
  function downloadsHtml(it){
    if (it.account) return "";
    var empty = it.slides.map(function(s, i){ return s.k === "photo" && !DROPS[dropId(it, i)] ? dropId(it, i) : null; }).filter(Boolean);
    var zones = it.slides.map(function(s, i){ return s.k === "photo" ? dropId(it, i) : null; }).filter(Boolean);
    var zoneLine = zones.length ? '<p class="muted">Drop zone' + (zones.length > 1 ? 's' : '') + ' ' + esc(zones.join(", ")) + '. Name a photo by its ID, or say which ID it goes to.</p>' : '';
    if (!LOCAL) return '<h3>Files</h3>' + zoneLine + '<p class="muted">Iván keeps the Instagram-ready files and posts them once you say yes.</p>';
    var files = [], zip = null;
    if (it.format === "Reel" && DROPS[dropId(it, 0)]) files = [DROPS[dropId(it, 0)]];
    else if (RENDERS[it.id]) { files = RENDERS[it.id].slides; zip = files.length > 1 ? RENDERS[it.id].zip : null; }
    var stale = RENDERS[it.id] && RENDERS[it.id].drops !== Object.keys(DROPS).filter(function(k){ return k.indexOf(dayKey[it.id] + "-") === 0; }).sort().join(",");
    var name = function(n){ return it.date + "-" + it.id + (files.length > 1 ? "-" + n : "") + (((files[0] || "").match(/\.[a-z0-9]+$/i) || [".png"])[0]); };
    if (!files.length) return '<h3>Download</h3>' + zoneLine + '<p class="muted">Not rendered yet. Run posts.py.</p>';
    return '<h3>Download for Instagram</h3>' + zoneLine + '<p class="muted">' + (it.format === "Reel" ? "The video as it was shot; a reel plays at 9:16" : "1080 × 1350, the 4:5 portrait size") + (empty.length ? '. Still to place: ' + esc(empty.join(", ")) + '; those slides download as drop zones.' : '.') + (stale ? ' The files are older than the photos placed since; run posts.py again.' : '') + '</p>' +
      '<div class="dl">' + (zip ? '<a class="btn s press all" href="' + esc(zip) + '" download="' + esc(it.date + "-" + it.id + ".zip") + '">All ' + files.length + ' slides (.zip)</a>' : '') +
      files.map(function(f, k){ return '<a class="btn s press' + (files.length === 1 ? ' all' : '') + '" href="' + esc(f) + '" download="' + esc(name(k + 1)) + '">' + (files.length > 1 ? "Slide " + (k + 1) : "Download") + '</a>'; }).join("") + '</div>';
  }
  function showIg(it){
    if (it.posted && !it.account) it = Object.assign({}, it, { caption: it.posted.caption || it.caption,
      slides: it.posted.img ? [{ k:"img", img:it.posted.img, t:it.posted.title, bare:true }] : it.slides });
    var n = it.slides.length;
    var dots = n > 1 ? '<div class="dots">' + it.slides.map(function(_, i){ return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join("") + '</div>' : '';
    var when = new Date(it.date + "T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"});
    var state = it.posted ? '<p class="state ok">Posted ' + esc(shortDate(it.posted.date)) + '. <a href="' + esc(it.posted.url) + '" target="_blank" rel="noopener">Open on Instagram</a></p>'
      : missed(it) ? '<p class="state">Not posted. Its day has passed and it is not on the account.</p>' : '';
    var card = '<div class="card"><span class="tag"><i class="dot k-' + kind(it) + '"></i>' + esc(it.strand || it.series) + ' · ' + esc(it.format) + '</span><h2>' + esc(it.title) + '</h2><p class="muted">' + esc(longDate(it.date)) + '</p>' + state + (it.posted ? "" : needsHtml(it) + downloadsHtml(it)) + '<div class="row">' + smsLink(it, "w") + '</div></div>' + pager(it);
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
      (it.waitingOn && it.status !== "published" ? '<p class="waiting">' + esc(waitLine(it)) + '</p>' : '') +
      '<p class="when">Substack, ' + esc(longDate(it.date)) + (it.url ? ' · <a href="' + esc(it.url) + '" target="_blank" rel="noopener">Read it on Substack</a>' : '') + ', 9am</p>' +
      (it.concept && !(it.excerpt || []).length ? '<h3>The idea</h3><p>' + esc(it.concept) + '</p>' : '') +
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

  /* ---------- neighborhoods: private until Damaso approves them (Ivan, 2026-11-19) ----------
     Each page is written to be published as it stands: his own photos only, no placeholder anywhere. What still
     needs his word sits above the page in a review card that is not part of it. A part of Bel Air without his
     photos gets no page; it waits on the shot list. */
  (function(){
    var rows = document.getElementById("sect-hoods"); if (!rows) return;
    rows.innerHTML += HOODS.map(function(n){ return '<a href="#n/' + esc(n.slug) + '" data-route="neighborhoods" data-sub="' + esc(n.slug) + '" class="sub"><span>' + esc(n.name) + '</span></a>'; }).join("");
  })();
  function showHoods(){
    setCurrent("neighborhoods"); main.classList.remove("doc");
    var cards = HOODS.map(function(n){
      return '<a class="hcard press" href="#n/' + esc(n.slug) + '"><span class="hc-img"><img src="' + esc(n.hero.src) + '" alt="" loading="lazy"></span><span class="hc-tx"><b>' + esc(n.name) + '</b><span>' + esc(n.tagline) + '</span><span class="pill wait">Waiting on Damaso’s OK</span></span></a>';
    }).join("");
    var shots = SHOTS.map(function(x){ return '<div class="rowline"><span class="primary">' + esc(x.name) + '</span><span class="secondary">' + esc(x.why) + '</span></div>'; }).join("");
    main.innerHTML = '<div class="page-head"><h1>Neighborhoods</h1><span class="count">' + HOODS.length + ' written, ' + SHOTS.length + ' to photograph</span></div>' +
      '<p class="page-note">' + esc((DATA.neighborhoods && DATA.neighborhoods.note) || "") + '</p>' +
      band("Ready for your read", "nothing here is on the site yet", '<div class="hcards">' + cards + '</div>') +
      (shots ? band("To photograph first", "no page until the photos exist", '<div class="rows">' + shots + '</div>') : "");
    document.title = APP + " · Neighborhoods";
  }
  function showHood(n){
    setCurrent("neighborhoods", n.slug); main.classList.remove("doc"); main.classList.add("hoodview");
    var review = (n.review || []).length ? '<div class="card review"><p><span class="pill wait" style="margin:0">Waiting on Damaso’s OK</span></p><h3>Before this goes on the site</h3><ul class="checks">' + n.review.map(function(r){ return '<li>' + esc(r) + '</li>'; }).join("") + '</ul></div>' : '';
    var facts = '<dl class="group facts">' + n.facts.map(function(f){ return '<div><span><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></span></div>'; }).join("") + '</dl>';
    var faq = '<div class="faq">' + n.faq.map(function(q){ return '<details><summary>' + esc(q.q) + '</summary><p>' + esc(q.a) + '</p></details>'; }).join("") + '</div>';
    var gal = '<div class="gal g' + n.gallery.length + '">' + n.gallery.map(function(g){ return '<figure><img src="' + esc(g.src) + '" alt="' + esc(g.cap) + '" loading="lazy"><figcaption>' + esc(g.cap) + '</figcaption></figure>'; }).join("") + '</div>';
    var src = (n.sources || []).length ? '<details class="sources"><summary>Sources (' + n.sources.length + ')</summary><ul>' + n.sources.map(function(u){ return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 80)) + '</a></li>'; }).join("") + '</ul></details>' : '';
    main.innerHTML = '<div class="page-head"><button class="back" data-hash="#neighborhoods">' + CHEV_L + 'Neighborhoods</button></div>' + review +
      '<article class="hood"><figure class="hero"><img src="' + esc(n.hero.src) + '" alt="' + esc(n.hero.cap) + '"><figcaption>' + esc(n.hero.cap) + '</figcaption></figure>' +
      '<h1>' + esc(n.name) + '</h1><p class="lede">' + esc(n.tagline) + '</p>' +
      n.paras.slice(0, 2).map(function(p){ return '<p>' + esc(p) + '</p>'; }).join("") + gal +
      n.paras.slice(2).map(function(p){ return '<p>' + esc(p) + '</p>'; }).join("") +
      '<h2>At a glance</h2>' + facts + '<h2>Questions buyers ask</h2>' + faq + src + '</article>';
    document.title = APP + " · " + n.name;
  }

  /* ---------- routing ---------- */
  function currentMonth(){
    var h = (location.hash || "#calendar").slice(1);
    return parseMonth(h) || (h === "calendar" ? { y: today.getFullYear(), m: today.getMonth() } : null);
  }
  /* #render/<id>/<n>: one slide alone, full width, for posts.py to screenshot at 1080x1350. */
  function showRender(it, n){
    document.documentElement.classList.add("render");
    document.body.innerHTML = '<div class="rtrack">' + slide(it.slides[n], it, n) + '</div>';
  }
  function route(){
    var h = location.hash || "#calendar";
    var rr = h.match(/^#render\/([A-Za-z0-9_-]+)\/(\d+)$/);
    if (rr) { var ri = items.filter(function(x){ return x.id === rr[1]; })[0]; if (ri && ri.slides && ri.slides[+rr[2]]) { showRender(ri, +rr[2]); return; } }
    main.classList.remove("post"); main.classList.remove("hoodview");
    var mm;
    if (h === "#articles") { showArticles(); }
    else if (h === "#neighborhoods") { showHoods(); }
    else if ((mm = h.match(/^#n\/([a-z0-9-]+)$/))) {
      var N = HOODS.filter(function(x){ return x.slug === mm[1]; })[0];
      if (N) showHood(N); else showHoods();
    }
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
  (function(){ var a = $("#site-link"); if (a && DATA.site) a.href = DATA.site; })();
  if (window.dlTheme) window.dlTheme();
  route();
})();
