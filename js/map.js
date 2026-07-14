/* Damaso Lara — the Westside, mapped.
   Hand-drawn interactive SVG in the site palette. No mapping libraries.
   Geometry is illustrative; pin positions are geocoded (Nominatim/Census). */
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
    { n: "879 Linda Flora", c: "home", lat: 34.08307, lon: -118.46552, en: "Bel Air · Represented", es: "Bel Air · Representada", link: "#work" },
    { n: "903 Linda Flora", c: "home", lat: 34.08400, lon: -118.46530, en: "Bel Air · Sold", es: "Bel Air · Vendida", link: "#work" },
    { n: "1149 Linda Flora Dr", c: "home", lat: 34.09028, lon: -118.46564, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "936 Chantilly Rd", c: "home", lat: 34.08685, lon: -118.45397, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "1132 Chantilly Rd", c: "home", lat: 34.09243, lon: -118.45709, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "10814 Savona Rd", c: "home", lat: 34.09966, lon: -118.45976, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "10917 Savona Rd", c: "home", lat: 34.09750, lon: -118.46098, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "642 Perugia Way", c: "home", lat: 34.08072, lon: -118.44901, en: "Bel Air · Represented", es: "Bel Air · Representada" },
    { n: "146 Groverton Pl", c: "home", lat: 34.07451, lon: -118.44804, en: "Bel Air · Development", es: "Bel Air · Desarrollo" },
    { n: "9604 Heather Rd", c: "home", lat: 34.10322, lon: -118.40597, en: "Beverly Hills · Represented", es: "Beverly Hills · Representada" },
    { n: "14367 Mulholland Dr", c: "home", lat: 34.13058, lon: -118.44613, en: "Mulholland · Represented", es: "Mulholland · Representada" },
    { n: "15415 Milldale Dr", c: "home", lat: 34.12573, lon: -118.46796, en: "Brentwood · Represented", es: "Brentwood · Representada" },
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

  /* ---- Illustrative geography ---- */
  // Roads as polylines of [lon,lat]; t: 1 arterial, 2 secondary, 3 local, 9 freeway
  var ROADS = [
    { n: "Sunset Blvd", t: 1, lbl: [-118.437, 34.0805, -6], pts: [[-118.497,34.0755],[-118.478,34.0742],[-118.466,34.0765],[-118.455,34.0788],[-118.447,34.0782],[-118.437,34.0808],[-118.428,34.0798],[-118.417,34.0818],[-118.408,34.0838],[-118.396,34.0872],[-118.383,34.0895]] },
    { n: "Wilshire Blvd", t: 1, lbl: [-118.428, 34.0596, 4], pts: [[-118.497,34.0435],[-118.475,34.0505],[-118.456,34.0585],[-118.44,34.0603],[-118.42,34.0605],[-118.404,34.0645],[-118.39,34.0672],[-118.383,34.069]] },
    { n: "Mulholland Dr", t: 1, lbl: [-118.452, 34.1332, -4], pts: [[-118.497,34.1275],[-118.483,34.1312],[-118.468,34.1288],[-118.455,34.1338],[-118.446,34.1305],[-118.435,34.1332],[-118.42,34.1352],[-118.405,34.1378],[-118.39,34.1398],[-118.383,34.1405]] },
    { n: "Santa Monica Blvd", t: 2, lbl: [-118.412, 34.0742, 12], pts: [[-118.44,34.052],[-118.425,34.0625],[-118.41,34.073],[-118.398,34.0795],[-118.39,34.084]] },
    { n: "San Vicente Blvd", t: 2, lbl: [-118.482, 34.0525, -8], pts: [[-118.497,34.058],[-118.478,34.0525],[-118.46,34.0478],[-118.45,34.046]] },
    { n: "Stone Canyon Rd", t: 2, lbl: [-118.4515, 34.0985, 78], pts: [[-118.4465,34.0785],[-118.449,34.086],[-118.4525,34.0925],[-118.4508,34.101],[-118.4535,34.11],[-118.455,34.1195],[-118.4555,34.128]] },
    { n: "Beverly Glen Blvd", t: 2, lbl: [-118.4375, 34.108, 82], pts: [[-118.433,34.081],[-118.4365,34.09],[-118.4345,34.0985],[-118.4385,34.108],[-118.4415,34.1175],[-118.4435,34.1265],[-118.4435,34.132]] },
    { n: "Benedict Canyon", t: 2, lbl: [-118.4215, 34.108, 80], pts: [[-118.4135,34.084],[-118.4175,34.093],[-118.42,34.102],[-118.4235,34.112],[-118.4275,34.1225],[-118.429,34.131]] },
    { n: "Coldwater Canyon", t: 2, lbl: [-118.394, 34.112, 78], pts: [[-118.3955,34.09],[-118.392,34.099],[-118.394,34.109],[-118.3965,34.119],[-118.3945,34.129],[-118.3935,34.1385]] },
    { n: "Bellagio Rd", t: 3, lbl: [-118.4555, 34.0855, -50], pts: [[-118.452,34.0782],[-118.4565,34.0825],[-118.4585,34.0875],[-118.4545,34.0905],[-118.4495,34.0885],[-118.4475,34.0845]] },
    { n: "Linda Flora Dr", t: 3, lbl: [-118.4675, 34.0875, 86], pts: [[-118.4625,34.0805],[-118.4655,34.0845],[-118.4652,34.089],[-118.4668,34.0935]] },
    { n: "Chantilly Rd", t: 3, lbl: [-118.4535, 34.0905, 80], pts: [[-118.4525,34.0838],[-118.454,34.0872],[-118.4568,34.0912],[-118.4572,34.0938]] },
    { n: "Savona Rd", t: 3, lbl: [-118.4625, 34.0995, -20], pts: [[-118.4655,34.0955],[-118.4615,34.0975],[-118.4592,34.0998],[-118.457,34.1015]] },
    { n: "Roscomare Rd", t: 3, lbl: [-118.462, 34.1105, 82], pts: [[-118.4585,34.089],[-118.4605,34.098],[-118.4625,34.107],[-118.464,34.116],[-118.4655,34.124]] },
    { n: "405", t: 9, lbl: [-118.4775, 34.099, 82], pts: [[-118.4745,34.036],[-118.4735,34.05],[-118.4755,34.064],[-118.4775,34.078],[-118.473,34.092],[-118.4705,34.106],[-118.469,34.12],[-118.4665,34.134],[-118.465,34.148]] }
  ];

  // Golf / parks: soft polygons [lon,lat]
  var GREENS = [
    { n: "Bel-Air CC", pts: [[-118.456,34.0795],[-118.4505,34.084],[-118.4445,34.0855],[-118.4415,34.082],[-118.445,34.0775],[-118.4525,34.0765]] },
    { n: "Los Angeles CC", pts: [[-118.432,34.0575],[-118.4235,34.0555],[-118.4135,34.0585],[-118.4125,34.0665],[-118.42,34.071],[-118.4295,34.0665]] },
    { n: "Brentwood CC", pts: [[-118.4875,34.0435],[-118.4765,34.0425],[-118.4725,34.049],[-118.479,34.0545],[-118.489,34.051]] },
    { n: "Holmby Park", pts: [[-118.4335,34.0745],[-118.4295,34.0735],[-118.4285,34.077],[-118.4325,34.078]] }
  ];

  // Stone Canyon Reservoir
  var WATERS = [
    { n: "Stone Canyon Reservoir", pts: [[-118.4545,34.0955],[-118.4505,34.0945],[-118.4475,34.0985],[-118.4485,34.104],[-118.452,34.1075],[-118.4545,34.104],[-118.4525,34.0995]] }
  ];

  // UCLA campus block
  var CAMPUS = { n: "UCLA", pts: [[-118.4545,34.0625],[-118.4375,34.0615],[-118.437,34.0745],[-118.4525,34.0755]] };

  var HOODS = [
    ["BEL AIR", -118.452, 34.0935], ["HOLMBY HILLS", -118.427, 34.087],
    ["BEVERLY HILLS", -118.402, 34.0735], ["WESTWOOD", -118.443, 34.058],
    ["BRENTWOOD", -118.482, 34.062], ["BEVERLY GLEN", -118.4405, 34.1145],
    ["TROUSDALE", -118.402, 34.1055], ["SEPULVEDA PASS", -118.478, 34.108]
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

  // Soft hill masses north of Sunset and in the canyons
  var HILLS = [
    [-118.47, 34.10, 340, 260], [-118.44, 34.115, 300, 220], [-118.41, 34.12, 300, 230],
    [-118.455, 34.088, 220, 150], [-118.425, 34.098, 220, 160], [-118.39, 34.105, 200, 170],
    [-118.462, 34.128, 260, 150], [-118.398, 34.132, 240, 140]
  ];
  HILLS.forEach(function (h) {
    el("ellipse", { cx: X(h[0]), cy: Y(h[1]), rx: h[2] / 2, ry: h[3] / 2, fill: COL.hill, opacity: 0.6 }, lyHill);
  });

  function poly(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") + " Z"; }

  // Flats: hint of a street grid (Westwood / BH flats / Brentwood)
  var FLATS = [
    { x0: -118.457, x1: -118.433, y0: 34.036, y1: 34.058, rot: 0 },   // Westwood south
    { x0: -118.415, x1: -118.384, y0: 34.052, y1: 34.078, rot: -24 }, // BH flats (angled grid)
    { x0: -118.497, x1: -118.462, y0: 34.036, y1: 34.056, rot: 12 }   // Brentwood
  ];
  FLATS.forEach(function (f) {
    var g = el("g", { transform: "rotate(" + f.rot + " " + X((f.x0 + f.x1) / 2) + " " + Y((f.y0 + f.y1) / 2) + ")", opacity: 0.75 }, lyBlocks);
    for (var lon = f.x0; lon < f.x1; lon += 0.004) for (var lat = f.y0; lat < f.y1; lat += 0.0033) {
      if (R() < 0.18) continue;
      var w = 0.0032 * KX * (0.72 + R() * 0.2), h2 = 0.0026 * KY * (0.72 + R() * 0.2);
      el("rect", { x: X(lon), y: Y(lat) - h2, width: w, height: h2, rx: 2, fill: R() < 0.5 ? COL.block : COL.hill, stroke: COL.bedge, "stroke-width": 0.4, "vector-effect": "non-scaling-stroke" }, g);
    }
  });

  // Campus
  el("path", { d: poly(CAMPUS.pts), fill: COL.block, stroke: COL.bedge, "stroke-width": 1, "vector-effect": "non-scaling-stroke", "fill-opacity": 0.9 }, lyBlocks);

  // Greens + trees
  GREENS.forEach(function (gr) {
    el("path", { d: poly(gr.pts), fill: COL.park, stroke: COL.pedge, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, lyGreen);
    var xs = gr.pts.map(function (p) { return X(p[0]); }), ys = gr.pts.map(function (p) { return Y(p[1]); });
    var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    for (var t = 0; t < 46; t++) {
      var tx = x0 + R() * (x1 - x0), ty = y0 + R() * (y1 - y0);
      el("circle", { cx: tx, cy: ty, r: 2.4 + R() * 2.4, fill: R() < 0.5 ? COL.tree : COL.tree2, opacity: 0.7 }, lyTrees);
    }
  });
  // Canyon tree scatter (north of Sunset)
  for (var t2 = 0; t2 < 420; t2++) {
    var lon = LON0 + R() * (LON1 - LON0), lat = 34.082 + R() * (LAT1 - 34.082);
    el("circle", { cx: X(lon), cy: Y(lat), r: 1.6 + R() * 2.2, fill: R() < 0.5 ? COL.tree : COL.tree2, opacity: 0.28 }, lyTrees);
  }

  WATERS.forEach(function (w) {
    el("path", { d: poly(w.pts), fill: COL.water, stroke: COL.wedge, "stroke-width": 1.2, "vector-effect": "non-scaling-stroke" }, lyWater);
  });

  // Roads
  function roadPath(pts) {
    var d = "M" + X(pts[0][0]).toFixed(1) + " " + Y(pts[0][1]).toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var prev = pts[i - 1], cur = pts[i];
      var mx = (X(prev[0]) + X(cur[0])) / 2, my = (Y(prev[1]) + Y(cur[1])) / 2;
      d += " Q" + X(prev[0]).toFixed(1) + " " + Y(prev[1]).toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
    }
    d += " T" + X(pts[pts.length - 1][0]).toFixed(1) + " " + Y(pts[pts.length - 1][1]).toFixed(1);
    return d;
  }
  function widths(t) { return t === 9 ? [11, 8] : t === 1 ? [7.5, 5.6] : t === 2 ? [5.4, 3.8] : [3.2, 2.1]; }
  ROADS.forEach(function (r) {
    var d = roadPath(r.pts), w = widths(r.t);
    el("path", { d: d, fill: "none", stroke: r.t === 9 ? COL.fcase : (r.t === 1 ? COL.acase : COL.rcase), "stroke-width": w[0], "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }, lyCase);
    el("path", { d: d, fill: "none", stroke: r.t === 9 ? COL.fwy : (r.t === 1 ? COL.art : COL.road), "stroke-width": w[1], "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }, lyFill);
  });

  // Labels
  ROADS.forEach(function (r) {
    if (!r.lbl) return;
    var art = r.t === 1 || r.t === 9;
    el("text", {
      x: X(r.lbl[0]), y: Y(r.lbl[1]), "text-anchor": "middle",
      "font-size": art ? 12 : 10, "font-weight": art ? 600 : 500,
      fill: art ? COL.stArt : COL.st,
      transform: "rotate(" + (r.lbl[2] || 0) + " " + X(r.lbl[0]) + " " + Y(r.lbl[1]) + ")",
      style: "paint-order:stroke;stroke:" + COL.land + ";stroke-width:3px;stroke-linejoin:round"
    }, lyStreet).textContent = r.n;
  });
  GREENS.forEach(function (gr) {
    var xs = gr.pts.map(function (p) { return X(p[0]); }), ys = gr.pts.map(function (p) { return Y(p[1]); });
    el("text", { x: (Math.min.apply(0, xs) + Math.max.apply(0, xs)) / 2, y: (Math.min.apply(0, ys) + Math.max.apply(0, ys)) / 2, "text-anchor": "middle", "font-size": 9.5, fill: "#5E7048", "font-weight": 600, style: "paint-order:stroke;stroke:" + COL.park + ";stroke-width:3px" }, lyStreet).textContent = gr.n;
  });
  el("text", { x: X(-118.4455), y: Y(34.0685), "text-anchor": "middle", "font-size": 11, fill: "#6E6455", "font-weight": 600, "letter-spacing": "1px", style: "paint-order:stroke;stroke:" + COL.block + ";stroke-width:3px" }, lyStreet).textContent = "UCLA";
  el("text", { x: X(-118.451), y: Y(34.1015), "text-anchor": "middle", "font-size": 9, fill: "#7A8F96", "font-weight": 500, style: "paint-order:stroke;stroke:" + COL.water + ";stroke-width:2.5px" }, lyStreet).textContent = "Stone Canyon Reservoir";
  HOODS.forEach(function (h) {
    el("text", { x: X(h[1]), y: Y(h[2]), "text-anchor": "middle", "font-size": 14, fill: COL.hood, "font-weight": 600, "letter-spacing": "2.5px", opacity: 0.66, style: "paint-order:stroke;stroke:" + COL.land + ";stroke-width:3.5px" }, lyHood).textContent = h[0];
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
