/* ════════════════════════════════════════════════════════════════════════
 *  CITY-PROPS.JS — roadside war-scene set dressing (civilian + military wrecks)
 *
 *  Populates each stage's city center with atmospheric vehicle props inspired
 *  by Ukrainian war photography: civilian cars (intact / shot-up with cracked
 *  windshields / burnt-out husks) and destroyed military vehicles from both
 *  sides, with faction markings (Russian "Z"/"V", Ukrainian cross/flag).
 *
 *  Additive only — does not touch terrain generation. Hooked from
 *  GameManager.applyStage() right after VoxelWorld.generateLevel().
 *  Exposes: CityProps.populate(scene, stageIndex, stageDef), CityProps.clear(scene)
 * ════════════════════════════════════════════════════════════════════════ */
const CityProps = (function () {
  'use strict';

  var _group = null;           // THREE.Group holding all props for current stage
  var _shared = {};            // cached materials

  // ── Deterministic per-stage RNG so a map looks the same each load ──
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mat(hex, opts) {
    opts = opts || {};
    var key = hex + '|' + (opts.transparent ? 't' + opts.opacity : '') + (opts.basic ? 'b' : '');
    if (_shared[key]) return _shared[key];
    var m = opts.basic
      ? new THREE.MeshBasicMaterial({ color: hex, transparent: !!opts.transparent, opacity: opts.opacity != null ? opts.opacity : 1 })
      : new THREE.MeshLambertMaterial({ color: hex, transparent: !!opts.transparent, opacity: opts.opacity != null ? opts.opacity : 1 });
    _shared[key] = m;
    return m;
  }

  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

  // ── Faction markings rendered as thin white box-strokes (voxel style) ──
  function addZ(parent, x, y, z, faceZ, s) {
    s = s || 1;
    var col = mat(0xffffff, { basic: true });
    var t = 0.04 * s, len = 0.34 * s;
    var top = box(len, t, 0.02, col); top.position.set(x, y + len * 0.5, faceZ);
    var bot = box(len, t, 0.02, col); bot.position.set(x, y - len * 0.5, faceZ);
    var diag = box(t, len * 1.32, 0.02, col); diag.position.set(x, y, faceZ); diag.rotation.z = Math.PI / 4;
    parent.add(top, bot, diag);
  }
  function addV(parent, x, y, z, faceZ, s) {
    s = s || 1;
    var col = mat(0xffffff, { basic: true });
    var t = 0.045 * s, len = 0.32 * s;
    var l = box(t, len, 0.02, col); l.position.set(x - 0.09 * s, y, faceZ); l.rotation.z = Math.PI / 7;
    var r = box(t, len, 0.02, col); r.position.set(x + 0.09 * s, y, faceZ); r.rotation.z = -Math.PI / 7;
    parent.add(l, r);
  }
  function addUkrCross(parent, x, y, faceZ, s) {
    s = s || 1;
    var col = mat(0xffffff, { basic: true });
    var t = 0.06 * s, len = 0.30 * s;
    var v = box(t, len, 0.02, col); v.position.set(x, y, faceZ);
    var h = box(len, t, 0.02, col); h.position.set(x, y, faceZ);
    parent.add(v, h);
  }

  // ── Civilian car: state 0 intact, 1 shot-up, 2 burnt husk ──
  function civilianCar(rng, state) {
    var g = new THREE.Group();
    var palette = [0x9a3b3b, 0x3b5a9a, 0x8a8a8a, 0xb0a050, 0x4a6a4a, 0xcfcfcf, 0x2a2a2a];
    var bodyHex = state === 2 ? 0x1a1612 : palette[(rng() * palette.length) | 0];
    var bodyMat = mat(bodyHex);

    var body = box(1.7, 0.55, 0.95, bodyMat); body.position.y = 0.45;
    var cabin = box(1.0, 0.42, 0.86, bodyMat); cabin.position.set(-0.05, 0.85, 0);
    g.add(body, cabin);

    // windows (skip on burnt husks)
    if (state !== 2) {
      var glassHex = state === 1 ? 0x6a7a6a : 0x8fb6c9;
      var glass = mat(glassHex, { transparent: true, opacity: state === 1 ? 0.55 : 0.7 });
      var ws = box(0.04, 0.34, 0.78, glass); ws.position.set(0.46, 0.86, 0); g.add(ws);
      var rear = box(0.04, 0.30, 0.74, glass); rear.position.set(-0.55, 0.86, 0); g.add(rear);
      // cracked windshield overlay = grey shatter quad
      if (state === 1) {
        var crack = box(0.045, 0.30, 0.7, mat(0xcdcdcd, { transparent: true, opacity: 0.4, basic: true }));
        crack.position.set(0.47, 0.86, 0.02); g.add(crack);
      }
    }
    // wheels
    var tire = mat(0x141414);
    [[0.62, 0.5], [0.62, -0.5], [-0.62, 0.5], [-0.62, -0.5]].forEach(function (p) {
      var w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 8), tire);
      w.rotation.x = Math.PI / 2; w.position.set(p[0], 0.22, p[1]); g.add(w);
    });

    if (state === 1) {
      // bullet-hole peppering: small dark dots on body sides
      var hole = mat(0x0a0a0a, { basic: true });
      for (var i = 0; i < 7; i++) {
        var d = box(0.07, 0.07, 0.02, hole);
        d.position.set(-0.6 + rng() * 1.2, 0.35 + rng() * 0.4, (rng() < 0.5 ? 0.48 : -0.48));
        g.add(d);
      }
      g.rotation.z = (rng() - 0.5) * 0.06;
    } else if (state === 2) {
      // burnt: scorch crown + thin smoke wisp, tilt
      var scorch = box(1.8, 0.05, 1.05, mat(0x070707, { basic: true })); scorch.position.y = 1.06; g.add(scorch);
      g.rotation.z = (rng() - 0.5) * 0.12;
      g.rotation.x = (rng() - 0.5) * 0.05;
    }
    g.userData.kind = 'civilian';
    return g;
  }

  // ── Destroyed military vehicle: faction 'ru' or 'ua' ──
  function militaryWreck(rng, faction) {
    var g = new THREE.Group();
    var burnt = rng() < 0.55;
    var baseHex = faction === 'ru'
      ? (burnt ? 0x20201a : 0x4a4a32)   // Russian olive / scorched
      : (burnt ? 0x1c2418 : 0x39492f);  // Ukrainian green / scorched
    var bMat = mat(baseHex);

    var hull = box(2.6, 0.7, 1.4, bMat); hull.position.y = 0.6; g.add(hull);
    var upper = box(2.0, 0.5, 1.2, bMat); upper.position.set(0, 1.05, 0); g.add(upper);
    // turret knocked askew (destroyed look)
    var turret = box(1.1, 0.5, 1.0, bMat); turret.position.set(-0.2, 1.5, 0.1);
    turret.rotation.y = (rng() - 0.5) * 0.9; g.add(turret);
    // barrel is a child of the turret, so its position is in turret-local space
    // (turret centre is already ~y1.5 in group space — keep local y near 0)
    var barrel = box(1.6, 0.14, 0.14, mat(0x2a2a22)); barrel.position.set(1.0, 0.05, 0);
    barrel.rotation.z = -0.12 - rng() * 0.18; turret.add(barrel);
    // tracks
    var trk = mat(0x161616);
    var tl = box(2.7, 0.32, 0.3, trk); tl.position.set(0, 0.3, 0.6); g.add(tl);
    var tr = box(2.7, 0.32, 0.3, trk); tr.position.set(0, 0.3, -0.6); g.add(tr);

    // faction marking on hull side
    if (faction === 'ru') { (rng() < 0.6 ? addZ : addV)(g, 0.3, 1.05, 0, 0.71, 1.1); }
    else { addUkrCross(g, 0.3, 1.05, 0.71, 1.1); }

    if (burnt) {
      var scorch = box(2.1, 0.05, 1.25, mat(0x050505, { basic: true })); scorch.position.set(0, 1.32, 0); g.add(scorch);
      g.rotation.z = (rng() - 0.5) * 0.05;
    }
    g.userData.kind = 'military';
    return g;
  }

  function clear(scene) {
    if (_group && scene) scene.remove(_group);
    if (_group) {
      _group.traverse(function (o) { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); });
    }
    _group = null;
  }

  // ── Place props for a stage ──
  function populate(scene, stageIndex, stageDef) {
    if (typeof THREE === 'undefined' || !scene) return;
    clear(scene);
    _group = new THREE.Group();
    _group.name = 'city-props';

    var theme = (stageDef && stageDef.theme) || 'grassland';
    if (stageDef && stageDef.droneOnly) { scene.add(_group); return; } // drone map: skip

    var rng = mulberry32((stageIndex + 1) * 2654435761 >>> 0);
    // urban/industrial = denser wreck fields; grassland = sparser roadside
    var count = theme === 'urban' ? 16 : theme === 'industrial' ? 14 : 9;

    var groundY = function (x, z) {
      try {
        if (window.VoxelWorld && window.VoxelWorld.getTopSolidY) return window.VoxelWorld.getTopSolidY(x, z);
      } catch (e) {}
      return 0;
    };

    var placed = 0, tries = 0;
    while (placed < count && tries < count * 6) {
      tries++;
      // ring distribution around center (city core out to ~1km-equiv radius)
      var ang = rng() * Math.PI * 2;
      var rad = 6 + rng() * 48;
      var x = Math.cos(ang) * rad;
      var z = Math.sin(ang) * rad;
      var gy = groundY(x, z);
      if (!isFinite(gy) || gy <= 0) continue; // skip void
      // skip water tiles — don't strand vehicles in ponds/rivers
      try {
        var VW = window.VoxelWorld;
        if (VW && VW.getBlock && VW.BLOCK && VW.getBlock(Math.floor(x), Math.floor(gy) - 1, Math.floor(z)) === VW.BLOCK.WATER) continue;
      } catch (eW) {}
      var roll = rng();
      var prop;
      if (theme === 'grassland') {
        prop = roll < 0.5 ? civilianCar(rng, (rng() * 3) | 0) : militaryWreck(rng, rng() < 0.5 ? 'ru' : 'ua');
      } else {
        // cities: more wrecks + shot-up/burnt civilians
        if (roll < 0.45) prop = militaryWreck(rng, rng() < 0.55 ? 'ru' : 'ua');
        else prop = civilianCar(rng, rng() < 0.35 ? 0 : (rng() < 0.5 ? 1 : 2));
      }
      prop.position.set(x, gy, z);
      prop.rotation.y += rng() * Math.PI * 2;
      _group.add(prop);
      placed++;
    }
    scene.add(_group);
  }

  return { populate: populate, clear: clear };
})();

if (typeof window !== 'undefined') window.CityProps = CityProps;
