/* Damaso Lara: the Westside, mapped.
   Interactive SVG in the site palette. No mapping libraries.
   Roads, water, parks and golf courses are real OpenStreetMap geometry
   (js/mapdata.js); pin positions are geocoded (Nominatim/Census). */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(t, a, p) { var e = document.createElementNS(NS, t); if (a) for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---- Projection: lon/lat -> world units ---- */
  var LON0 = -118.497, LON1 = -118.383, LAT0 = 34.036, LAT1 = 34.148;
  var KX = 9950, KY = 12000; // ~metres-true aspect at 34°N
  function X(lon) { return (lon - LON0) * KX; }
  function Y(lat) { return (LAT1 - lat) * KY; }
  var W = X(LON1), H = Y(LAT0); // ~1134 x 1344

  /* ---- Palette (site tokens, map shades) ---- */
  var COL = {
    land: "#EFE9DF", hill: "#E8E0D1", block: "#E5DBCB", bedge: "#D6C9B4",
    road: "#F7F5F0", rcase: "#D8CEBE", art: "#FBF9F4", acase: "#CBBDA6",
    fwy: "#F2EEE7", fcase: "#BFB097",
    park: "#CBD1B4", pedge: "#AFBA95", tree: "#8C9B6E", tree2: "#76865B",
    water: "#B7C6CC", wedge: "#9DB0B8",
    st: "#6B6357", stArt: "#4A463E", hood: "#97918A",
    ink: "#192231", gold: "#C0B283", olive: "#404A42", paper: "#F4F4F4"
  };

  var CATS = {
    home:   { en: "Represented", es: "Representadas", color: "#C0B283", diamond: true },
    clubs:  { en: "Tennis & clubs", es: "Tenis y clubes", color: "#58724F" },
    school: { en: "Private schools", es: "Colegios privados", color: "#3E5C76" },
    market: { en: "Fine grocery", es: "Mercados", color: "#A98A5B" },
    hotel:  { en: "Hotels & dining", es: "Hoteles y mesas", color: "#A05C44" }
  };

  /* ---- Points (geocoded) ---- */
  var PTS = [
    // Represented properties
    { n: "879 Linda Flora", c: "home", lat: 34.08307, lon: -118.46552, en: "Bel Air · Sold", es: "Bel Air · Vendida", link: "#work" },
    { n: "903 Linda Flora", c: "home", lat: 34.08400, lon: -118.46530, en: "Bel Air · Sold", es: "Bel Air · Vendida", link: "#work" },
    { n: "1149 Linda Flora Dr", c: "home", lat: 34.09028, lon: -118.46564, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "936 Chantilly Rd", c: "home", lat: 34.08685, lon: -118.45397, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "1132 Chantilly Rd", c: "home", lat: 34.09243, lon: -118.45709, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "10814 Savona Rd", c: "home", lat: 34.09966, lon: -118.45976, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "10917 Savona Rd", c: "home", lat: 34.09750, lon: -118.46098, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "642 Perugia Way", c: "home", lat: 34.08072, lon: -118.44901, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "146 Groverton Pl", c: "home", lat: 34.07451, lon: -118.44804, en: "Bel Air · Development", es: "Bel Air · Desarrollo" },
    { n: "9604 Heather Rd", c: "home", lat: 34.10322, lon: -118.40597, en: "Beverly Hills · Represented", es: "Beverly Hills · Representada" },
    { n: "14367 Mulholland Dr", c: "home", lat: 34.13058, lon: -118.44613, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "15415 Milldale Dr", c: "home", lat: 34.12573, lon: -118.46796, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    // Tennis & country clubs
    { n: "Bel-Air Country Club", c: "clubs", lat: 34.07837, lon: -118.44950, en: "Golf above Sunset, since 1926.", es: "Golf sobre Sunset, desde 1926." },
    { n: "Los Angeles Country Club", c: "clubs", lat: 34.07034, lon: -118.42221, en: "Two courses along Wilshire.", es: "Dos campos sobre Wilshire." },
    { n: "Beverly Hills Tennis Club", c: "clubs", lat: 34.06158, lon: -118.39291, en: "Clay courts in the flats.", es: "Canchas de arcilla en los flats." },
    { n: "Brentwood Country Club", c: "clubs", lat: 34.04711, lon: -118.48137, en: "Golf off San Vicente.", es: "Golf junto a San Vicente." },
    // Private schools
    { n: "John Thomas Dye", c: "school", lat: 34.08746, lon: -118.46342, en: "K–6, up Chalon Road.", es: "K–6, sobre Chalon Road." },
    { n: "Curtis School", c: "school", lat: 34.12836, lon: -118.47745, en: "K–6 on Mulholland.", es: "K–6 en Mulholland." },
    { n: "Marymount High School", c: "school", lat: 34.07487, lon: -118.44532, en: "Girls' 9–12 on Sunset.", es: "Preparatoria femenina en Sunset." },
    { n: "Harvard-Westlake", c: "school", lat: 34.08778, lon: -118.43384, en: "Middle school campus, Holmby Hills.", es: "Campus intermedio, Holmby Hills." },
    { n: "Brentwood School", c: "school", lat: 34.06527, lon: -118.46685, en: "K–12 on Barrington.", es: "K–12 en Barrington." },
    // Fine grocery
    { n: "Beverly Glen Marketplace", c: "market", lat: 34.12784, lon: -118.44358, en: "The Glen Centre, top of the canyon.", es: "The Glen Centre, en lo alto del cañón." },
    { n: "Erewhon", c: "market", lat: 34.06911, lon: -118.40136, en: "Beverly Hills flagship.", es: "La tienda insignia de Beverly Hills." },
    { n: "Vicente Foods", c: "market", lat: 34.05240, lon: -118.47384, en: "Brentwood's grocer since 1948.", es: "El mercado de Brentwood desde 1948." },
    { n: "Bristol Farms", c: "market", lat: 34.05350, lon: -118.44060, en: "Westwood, on the way home.", es: "Westwood, de camino a casa." },
    // Hotels & dining
    { n: "Hotel Bel-Air", c: "hotel", lat: 34.08650, lon: -118.44642, en: "Stone Canyon's quiet institution.", es: "La institución discreta de Stone Canyon." },
    { n: "The Beverly Hills Hotel", c: "hotel", lat: 34.08171, lon: -118.41380, en: "The Polo Lounge, on Sunset.", es: "El Polo Lounge, en Sunset." },
    { n: "Spago", c: "hotel", lat: 34.06761, lon: -118.39761, en: "Cañon Drive, Beverly Hills.", es: "Cañon Drive, Beverly Hills." },
    { n: "Waldorf Astoria", c: "hotel", lat: 34.06658, lon: -118.41164, en: "Wilshire at Santa Monica.", es: "Wilshire y Santa Monica." }
  ];

  /* Geography (roads, water, parks) is real OSM data (see js/mapdata.js) */

  var HOODS = [
    ["BEL AIR", -118.452, 34.0935], ["HOLMBY HILLS", -118.427, 34.087],
    ["BEVERLY HILLS", -118.402, 34.0735], ["WESTWOOD", -118.443, 34.058],
    ["BRENTWOOD", -118.485, 34.056], ["BEVERLY GLEN", -118.4405, 34.1145],
    ["TROUSDALE", -118.402, 34.1055], ["SEPULVEDA PASS", -118.481, 34.108],
    ["BEVERLY CREST", -118.409, 34.1205], ["CENTURY CITY", -118.414, 34.0515],
    ["LITTLE HOLMBY", -118.4405, 34.068]
  ];

  // Cultural landmarks: subtle marker + quiet label (not filterable pins)
  var LANDMARKS = [
    { n: "Getty Center", lat: 34.0779, lon: -118.4753 },
    { n: "Skirball Cultural Center", lat: 34.1017, lon: -118.4786 },
    { n: "Bel Air East Gate", lat: 34.0818, lon: -118.4338 },
    { n: "Hammer Museum", lat: 34.0596, lon: -118.4436 },
    { n: "UCLA", lat: 34.0689, lon: -118.4452 }
  ];

  /* ---- Build ---- */
  var svg = document.getElementById("wsmap");
  if (!svg) return;
  svg.setAttribute("viewBox", "0 0 800 600");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  var world = el("g", null, svg);
  var lyLand = el("g", null, world), lyHill = el("g", null, world), lyBlocks = el("g", null, world),
      lyGreen = el("g", null, world), lyTrees = el("g", null, world), lyWater = el("g", null, world),
      lyCase = el("g", null, world), lyFill = el("g", null, world), lyHood = el("g", null, world),
      lyStreet = el("g", null, world), lyPins = el("g", null, world);
  var R = rng(20260713);

  el("rect", { x: -300, y: -300, width: W + 600, height: H + 600, fill: COL.land }, lyLand);

  var D = window.MAP_DATA || { roads: [], water: [], parks: [], golf: { courses: [], fair: [], green: [], bunker: [], gwater: [] }, labels: [] };
  function ringD(pts) { var d = "M"; for (var i = 0; i < pts.length; i++) d += pts[i][0] + " " + pts[i][1] + " "; return d + "Z"; }
  function bbox(pts) { var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }); return [Math.min.apply(0, xs), Math.min.apply(0, ys), Math.max.apply(0, xs), Math.max.apply(0, ys)]; }
  function mergedRings(arr) { var d = ""; for (var i = 0; i < arr.length; i++) d += ringD(arr[i]) + " "; return d; }

  // Parks (real polygons) with a light tree scatter
  D.parks.forEach(function (p) {
    el("path", { d: ringD(p.pts), fill: COL.park, stroke: COL.pedge, "stroke-width": 1, "vector-effect": "non-scaling-stroke", "fill-opacity": 0.72 }, lyGreen);
    var bb = bbox(p.pts), area = (bb[2] - bb[0]) * (bb[3] - bb[1]), nt = Math.min(30, Math.round(area / 1100));
    for (var t = 0; t < nt; t++) el("circle", { cx: bb[0] + R() * (bb[2] - bb[0]), cy: bb[1] + R() * (bb[3] - bb[1]), r: 1.7 + R() * 1.9, fill: R() < 0.5 ? COL.tree : COL.tree2, opacity: 0.45 }, lyTrees);
  });

  // Golf courses: real footprint + fairways, greens, bunkers, water so each course's
  // distinctive shape (esp. Bel-Air CC, the heart of the town) reads immediately.
  var G = D.golf || { courses: [], fair: [], green: [], bunker: [], gwater: [] };
  var GC = { base: "#C3CDA1", bedge: "#8C9A64", fair: "#AEBE82", green: "#9BB36F", sand: "#ECE2C4" };
  G.courses.forEach(function (c) {
    el("path", { d: ringD(c.pts), fill: GC.base, stroke: GC.bedge, "stroke-width": 1.4, "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" }, lyGreen);
  });
  if (G.fair.length)   el("path", { d: mergedRings(G.fair),   fill: GC.fair,   "fill-rule": "evenodd", stroke: "none" }, lyGreen);
  if (G.green.length)  el("path", { d: mergedRings(G.green),  fill: GC.green,  stroke: "none" }, lyGreen);
  if (G.bunker.length) el("path", { d: mergedRings(G.bunker), fill: GC.sand,   stroke: "none" }, lyGreen);
  if (G.gwater.length) el("path", { d: mergedRings(G.gwater), fill: COL.water, stroke: COL.wedge, "stroke-width": 0.8, "vector-effect": "non-scaling-stroke" }, lyGreen);

  // Reservoirs (real polygons)
  D.water.forEach(function (w) {
    el("path", { d: ringD(w.pts), fill: COL.water, stroke: COL.wedge, "stroke-width": 1.2, "vector-effect": "non-scaling-stroke" }, lyWater);
  });

  // Roads: one merged path per class; casing pass, then fill pass (Apple-Maps layering)
  var CASE = { 9: [COL.fcase, 9], 1: [COL.acase, 6.5], 2: [COL.rcase, 5], 3: [COL.rcase, 3.4], 4: [COL.rcase, 2.4] };
  var FILL = { 9: [COL.fwy, 6.5], 1: [COL.art, 4.6], 2: [COL.art, 3.3], 3: [COL.road, 2.1], 4: [COL.road, 1.5] };
  var ORDER = [4, 3, 2, 1, 9], merged = {};
  ORDER.forEach(function (t) { var d = ""; for (var i = 0; i < D.roads.length; i++) if (D.roads[i].t === t) d += D.roads[i].d + " "; merged[t] = d; });
  ORDER.forEach(function (t) { if (!merged[t]) return; var c = CASE[t]; el("path", { d: merged[t], fill: "none", stroke: c[0], "stroke-width": c[1], "stroke-linecap": "round", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" }, lyCase); });
  ORDER.forEach(function (t) { if (!merged[t]) return; var f = FILL[t]; el("path", { d: merged[t], fill: "none", stroke: f[0], "stroke-width": f[1], "stroke-linecap": "round", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke" }, lyFill); });

  // Road labels (rotated along the street)
  D.labels.forEach(function (L) {
    var art = L.t <= 1, size = L.t <= 1 ? 12 : (L.t === 2 ? 11 : 9.5);
    el("text", { x: L.x, y: L.y, "text-anchor": "middle", "font-size": size, "font-weight": art ? 600 : 500, fill: art ? COL.stArt : COL.st, transform: "rotate(" + L.a + " " + L.x + " " + L.y + ")", style: "paint-order:stroke;stroke:" + COL.land + ";stroke-width:3px;stroke-linejoin:round" }, lyStreet).textContent = L.n;
  });

  // Golf-course names: once per course, at its largest polygon
  var courseSeen = {};
  G.courses.forEach(function (c) {
    if (!c.n) return;
    var bb = bbox(c.pts), a = (bb[2] - bb[0]) * (bb[3] - bb[1]);
    if (!courseSeen[c.n] || a > courseSeen[c.n].a) courseSeen[c.n] = { a: a, x: (bb[0] + bb[2]) / 2, y: (bb[1] + bb[3]) / 2 };
  });
  Object.keys(courseSeen).forEach(function (n) {
    var s = courseSeen[n];
    el("text", { x: s.x, y: s.y, "text-anchor": "middle", "font-size": 9.5, fill: "#4E6739", "font-weight": 600, style: "paint-order:stroke;stroke:" + GC.base + ";stroke-width:3.5px;stroke-linejoin:round" }, lyStreet).textContent = n;
  });
  D.water.forEach(function (w) {
    if (!w.n) return;
    var bb = bbox(w.pts);
    el("text", { x: (bb[0] + bb[2]) / 2, y: (bb[1] + bb[3]) / 2, "text-anchor": "middle", "font-size": 8.5, fill: "#5E7C86", "font-weight": 500, style: "paint-order:stroke;stroke:" + COL.water + ";stroke-width:2.5px" }, lyStreet).textContent = w.n;
  });  HOODS.forEach(function (h) {
    el("text", { x: X(h[1]), y: Y(h[2]), "text-anchor": "middle", "font-size": 14, fill: COL.hood, "font-weight": 600, "letter-spacing": "2.5px", opacity: 0.66, style: "paint-order:stroke;stroke:" + COL.land + ";stroke-width:3.5px" }, lyHood).textContent = h[0];
  });

  // Cultural landmarks: a small hollow marker + quiet label
  LANDMARKS.forEach(function (m) {
    var x = X(m.lon), y = Y(m.lat);
    el("circle", { cx: x, cy: y, r: 3, fill: "none", stroke: COL.st, "stroke-width": 1.4, "vector-effect": "non-scaling-stroke" }, lyStreet);
    el("circle", { cx: x, cy: y, r: 0.8, fill: COL.st }, lyStreet);
    el("text", { x: x + 6, y: y + 3.5, "font-size": 9, fill: COL.stArt, "font-weight": 500, "font-style": "italic", style: "paint-order:stroke;stroke:" + COL.land + ";stroke-width:3px;stroke-linejoin:round" }, lyStreet).textContent = m.n;
  });

  /* ---- Pins ---- */
  var lang = function () { return document.documentElement.lang === "es" ? "es" : "en"; };
  var pinEls = {}, sel = -1, hidden = {};
  PTS.forEach(function (p, i) {
    var cat = CATS[p.c], x = X(p.lon), y = Y(p.lat);
    var g = el("g", { "class": "wspin", transform: "translate(" + x + "," + y + ")", tabindex: "0", role: "button", "aria-label": p.n }, lyPins);
    g.dataset.cat = p.c;
    el("circle", { cx: 0, cy: 1.5, r: cat.diamond ? 9 : 7.5, fill: "rgba(25,34,49,.16)" }, g);
    if (cat.diamond) {
      el("rect", { x: -6.4, y: -6.4, width: 12.8, height: 12.8, rx: 2, "class": "dot", transform: "rotate(45)", fill: cat.color, stroke: COL.ink, "stroke-width": 1.4 }, g);
    } else {
      el("circle", { r: 6.6, "class": "dot", fill: cat.color, stroke: COL.paper, "stroke-width": 2 }, g);
      el("circle", { r: 2.1, fill: COL.paper }, g);
    }
    el("text", { x: 11, y: 4, "class": "wslabel" }, g).textContent = p.n;
    g.addEventListener("click", function (ev) { ev.stopPropagation(); select(i); });
    g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); select(i); } });
    pinEls[i] = g;
  });

  /* ---- Pan / zoom (bounded) ---- */
  var SMIN = 0.5, SMAX = 2.4;
  var HOME = { x: X(-118.452), y: Y(34.0915) }; // Bel Air center
  var s = 0.72, tx = 400 - HOME.x * s, ty = 300 - HOME.y * s;
  function clamp() {
    if (s < SMIN) s = SMIN; if (s > SMAX) s = SMAX;
    var lo = 800 - W * s, hi = 0; if (lo > hi) tx = (lo + hi) / 2; else { if (tx < lo) tx = lo; if (tx > hi) tx = hi; }
    var lo2 = 600 - H * s, hi2 = 0; if (lo2 > hi2) ty = (lo2 + hi2) / 2; else { if (ty < lo2) ty = lo2; if (ty > hi2) ty = hi2; }
  }
  function apply() { clamp(); world.setAttribute("transform", "translate(" + tx + "," + ty + ") scale(" + s + ")"); }
  apply();
  function zoomAt(cx, cy, f) { var ns = Math.max(SMIN, Math.min(SMAX, s * f)); var wx = (cx - tx) / s, wy = (cy - ty) / s; tx = cx - wx * ns; ty = cy - wy * ns; s = ns; apply(); }
  svg.addEventListener("wheel", function (e) { e.preventDefault(); var r = svg.getBoundingClientRect(); zoomAt((e.clientX - r.left) * (800 / r.width), (e.clientY - r.top) * (600 / r.height), e.deltaY < 0 ? 1.12 : 0.89); }, { passive: false });
  var drag = false, lx, ly, moved;
  svg.addEventListener("pointerdown", function (e) { drag = true; moved = false; lx = e.clientX; ly = e.clientY; svg.classList.add("grabbing"); svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", function (e) { if (!drag) return; var r = svg.getBoundingClientRect(); if (Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) > 3) moved = true; tx += (e.clientX - lx) * (800 / r.width); ty += (e.clientY - ly) * (600 / r.height); lx = e.clientX; ly = e.clientY; apply(); });
  function endDrag() { drag = false; svg.classList.remove("grabbing"); }
  svg.addEventListener("pointerup", endDrag); svg.addEventListener("pointercancel", endDrag);
  svg.addEventListener("click", function () { if (!moved) { sel = -1; render(); updSel(); } });
  document.getElementById("wszin").onclick = function () { zoomAt(400, 300, 1.25); };
  document.getElementById("wszout").onclick = function () { zoomAt(400, 300, 0.8); };
  document.getElementById("wszreset").onclick = function () { s = 0.72; tx = 400 - HOME.x * s; ty = 300 - HOME.y * s; apply(); };

  /* ---- Chips + panel ---- */
  var filt = document.getElementById("wsfilters");
  var panel = document.getElementById("wspanel");
  function buildChips() {
    filt.innerHTML = "";
    Object.keys(CATS).forEach(function (k) {
      var c = CATS[k];
      var b = document.createElement("button");
      b.className = "wschip" + (hidden[k] ? " off" : "");
      var sw = document.createElement("span"); sw.className = "sw"; sw.style.background = c.color;
      if (c.diamond) sw.style.borderRadius = "2px", sw.style.transform = "rotate(45deg)";
      b.appendChild(sw); b.appendChild(document.createTextNode(c[lang()]));
      b.onclick = function () {
        hidden[k] = !hidden[k]; b.classList.toggle("off", hidden[k]);
        PTS.forEach(function (p, i) { pinEls[i].style.display = hidden[p.c] ? "none" : ""; });
        render();
      };
      filt.appendChild(b);
    });
  }
  function updSel() { PTS.forEach(function (p, i) { pinEls[i].classList.toggle("sel", i === sel); }); }
  function render() {
    var L = lang();
    if (sel >= 0) { detail(PTS[sel]); return; }
    panel.innerHTML = "";
    var pe = document.createElement("div"); pe.className = "pe";
    pe.textContent = L === "es" ? "El territorio" : "The territory"; panel.appendChild(pe);
    var h = document.createElement("h3");
    h.textContent = L === "es" ? "Casas y vida diaria" : "The homes, and the life around them"; panel.appendChild(h);
    var list = document.createElement("div"); list.className = "wslist";
    PTS.forEach(function (p, i) {
      if (hidden[p.c]) return;
      var c = CATS[p.c];
      var row = document.createElement("button"); row.className = "wsrow";
      var sw = document.createElement("span"); sw.className = "sw"; sw.style.background = c.color;
      if (c.diamond) sw.style.borderRadius = "2px", sw.style.transform = "rotate(45deg)";
      var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = p.n;
      row.appendChild(sw); row.appendChild(nm);
      row.onclick = function () { select(i); };
      list.appendChild(row);
    });
    panel.appendChild(list);
  }
  function detail(p) {
    var L = lang(), c = CATS[p.c];
    panel.innerHTML = "";
    var back = document.createElement("button"); back.className = "wsback";
    back.textContent = L === "es" ? "←  Todo" : "←  Everything"; back.onclick = function () { sel = -1; render(); updSel(); };
    panel.appendChild(back);
    var tag = document.createElement("span"); tag.className = "wstag"; tag.style.background = c.color; tag.textContent = c[L];
    panel.appendChild(tag);
    var h = document.createElement("h4"); h.textContent = p.n; panel.appendChild(h);
    var bl = document.createElement("p"); bl.className = "bl"; bl.textContent = p[L] || p.en; panel.appendChild(bl);
    if (p.link) {
      var a = document.createElement("a"); a.className = "wslink"; a.href = p.link;
      a.textContent = L === "es" ? "Ver la obra →" : "See the work →";
      panel.appendChild(a);
    }
  }
  function select(i) {
    sel = i; var p = PTS[i];
    var nx = X(p.lon), ny = Y(p.lat);
    s = Math.max(s, 1.05); tx = 400 - nx * s; ty = 300 - ny * s; apply();
    render(); updSel();
  }

  buildChips(); render();
  window.addEventListener("dl-langchange", function () { buildChips(); render(); });
})();
