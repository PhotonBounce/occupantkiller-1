/* ════════════════════════════════════════════════════════════════════════
 *  CITY-PROPS.JS — roadside war-scene set dressing
 *
 *  Scatters atmospheric props inspired by Ukrainian war photography:
 *  civilian cars (3 damage states), destroyed military vehicles with faction
 *  markings, Jersey barriers, sandbag positions, rubble piles, utility poles,
 *  detailed 3D traffic lights, bus shelters, and military checkpoints.
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
      if (state === 1) {
        var crack = box(0.045, 0.30, 0.7, mat(0xcdcdcd, { transparent: true, opacity: 0.4, basic: true }));
        crack.position.set(0.47, 0.86, 0.02); g.add(crack);
      }
    }
    var tire = mat(0x141414);
    [[0.62, 0.5], [0.62, -0.5], [-0.62, 0.5], [-0.62, -0.5]].forEach(function (p) {
      var w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 8), tire);
      w.rotation.x = Math.PI / 2; w.position.set(p[0], 0.22, p[1]); g.add(w);
    });

    if (state === 1) {
      var hole = mat(0x0a0a0a, { basic: true });
      for (var i = 0; i < 7; i++) {
        var d = box(0.07, 0.07, 0.02, hole);
        d.position.set(-0.6 + rng() * 1.2, 0.35 + rng() * 0.4, (rng() < 0.5 ? 0.48 : -0.48));
        g.add(d);
      }
      g.rotation.z = (rng() - 0.5) * 0.06;
    } else if (state === 2) {
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
      ? (burnt ? 0x20201a : 0x4a4a32)
      : (burnt ? 0x1c2418 : 0x39492f);
    var bMat = mat(baseHex);

    var hull = box(2.6, 0.7, 1.4, bMat); hull.position.y = 0.6; g.add(hull);
    var upper = box(2.0, 0.5, 1.2, bMat); upper.position.set(0, 1.05, 0); g.add(upper);
    var turret = box(1.1, 0.5, 1.0, bMat); turret.position.set(-0.2, 1.5, 0.1);
    turret.rotation.y = (rng() - 0.5) * 0.9; g.add(turret);
    var barrel = box(1.6, 0.14, 0.14, mat(0x2a2a22)); barrel.position.set(1.0, 0.05, 0);
    barrel.rotation.z = -0.12 - rng() * 0.18; turret.add(barrel);
    var trk = mat(0x161616);
    var tl = box(2.7, 0.32, 0.3, trk); tl.position.set(0, 0.3, 0.6); g.add(tl);
    var tr = box(2.7, 0.32, 0.3, trk); tr.position.set(0, 0.3, -0.6); g.add(tr);

    if (faction === 'ru') { (rng() < 0.6 ? addZ : addV)(g, 0.3, 1.05, 0, 0.71, 1.1); }
    else { addUkrCross(g, 0.3, 1.05, 0.71, 1.1); }

    if (burnt) {
      var scorch = box(2.1, 0.05, 1.25, mat(0x050505, { basic: true })); scorch.position.set(0, 1.32, 0); g.add(scorch);
      g.rotation.z = (rng() - 0.5) * 0.05;
    }
    g.userData.kind = 'military';
    return g;
  }

  // ── Jersey / concrete barrier (blast protection on roads) ──
  function concBarrier(rng) {
    var g = new THREE.Group();
    var n = 1 + (rng() * 4 | 0); // 1-4 barriers in a row
    var cMat = mat(0xb0b0b0);
    var lineMat = mat(0xdd4422, { basic: true }); // orange reflective stripe
    for (var i = 0; i < n; i++) {
      var bx = i * 1.2;
      var body = box(1.0, 0.8, 0.5, cMat); body.position.set(bx, 0.4, 0); g.add(body);
      // narrowing top section
      var top = box(0.6, 0.3, 0.38, cMat); top.position.set(bx, 0.95, 0); g.add(top);
      // orange warning stripe
      var stripe = box(1.01, 0.08, 0.51, lineMat); stripe.position.set(bx, 0.5, 0); g.add(stripe);
    }
    // blast damage: random tilt on hit barriers
    if (rng() < 0.4) g.rotation.z = (rng() - 0.5) * 0.25;
    g.userData.kind = 'barrier';
    return g;
  }

  // ── Sandbag defensive position (U-shape or line) ──
  function sandbagPos(rng) {
    var g = new THREE.Group();
    var sbMat = mat(0xa8904a);
    var sMat = mat(0x887030);
    var shape = rng() < 0.5 ? 'line' : 'U';
    var len = 3 + (rng() * 3 | 0);

    if (shape === 'line') {
      for (var i = 0; i < len; i++) {
        var sb = box(0.55, 0.3, 0.28, (i % 2 === 0) ? sbMat : sMat);
        sb.position.set(i * 0.5 - len * 0.25, 0.15, 0);
        sb.rotation.y = (rng() - 0.5) * 0.2;
        g.add(sb);
        // second layer (staggered)
        if (i < len - 1) {
          var sb2 = box(0.55, 0.3, 0.28, sMat);
          sb2.position.set(i * 0.5 - len * 0.25 + 0.25, 0.45, 0);
          sb2.rotation.y = (rng() - 0.5) * 0.15;
          g.add(sb2);
        }
      }
    } else {
      // U-shaped fighting position
      for (var j = 0; j < 4; j++) {
        var s = box(0.55, 0.6, 0.28, (j % 2 === 0) ? sbMat : sMat);
        s.position.set(j * 0.5 - 0.75, 0.3, 1.0); g.add(s);
        var s2 = box(0.55, 0.6, 0.28, sMat);
        s2.position.set(j * 0.5 - 0.75, 0.3, -1.0); g.add(s2);
      }
      for (var k = 0; k < 4; k++) {
        var s3 = box(0.28, 0.6, 0.55, sbMat);
        s3.position.set(-1.05, 0.3, k * 0.5 - 0.75); g.add(s3);
      }
    }
    g.userData.kind = 'sandbag';
    return g;
  }

  // ── Rubble pile — collapsed building chunks ──
  function rubblePile(rng) {
    var g = new THREE.Group();
    var mats = [mat(0xb0b0b0), mat(0x9a7060), mat(0x888888), mat(0xa08878)];
    var count = 6 + (rng() * 8 | 0);
    for (var i = 0; i < count; i++) {
      var w = 0.3 + rng() * 0.9, h = 0.15 + rng() * 0.6, d = 0.3 + rng() * 0.9;
      var chunk = box(w, h, d, mats[(rng() * mats.length) | 0]);
      chunk.position.set((rng() - 0.5) * 2.8, h * 0.5, (rng() - 0.5) * 2.8);
      chunk.rotation.set(
        (rng() - 0.5) * 0.8,
        rng() * Math.PI,
        (rng() - 0.5) * 0.6
      );
      g.add(chunk);
    }
    // rebar sticking out
    var rbMat = mat(0x4a3a2a);
    for (var j = 0; j < 3; j++) {
      var rb = box(0.05, 0.8 + rng() * 0.6, 0.05, rbMat);
      rb.position.set((rng() - 0.5) * 2, 0.4, (rng() - 0.5) * 2);
      rb.rotation.set((rng() - 0.5) * 0.5, rng() * Math.PI, (rng() - 0.5) * 0.5);
      g.add(rb);
    }
    g.userData.kind = 'rubble';
    return g;
  }

  // ── Utility pole — wood/concrete power line pole, often fallen ──
  function utilityPole(rng) {
    var g = new THREE.Group();
    var fallen = rng() < 0.45;
    var poleMat = mat(0x6a5030);
    var wireMat = mat(0x2a2a2a, { basic: true });
    var height = 5 + rng() * 2;

    var pole = box(0.18, height, 0.18, poleMat);
    pole.position.y = height * 0.5;
    g.add(pole);
    // crossarm
    var arm = box(2.2, 0.14, 0.14, poleMat); arm.position.set(0, height - 0.3, 0); g.add(arm);
    // wires sagging down
    for (var i = -1; i <= 1; i++) {
      var wire = box(0.04, 0.04, 4.0, wireMat);
      wire.position.set(i * 0.7, height - 0.5, 0);
      wire.rotation.x = 0.15; // sag
      g.add(wire);
    }

    if (fallen) {
      g.rotation.z = (rng() < 0.5 ? 1 : -1) * (Math.PI * 0.35 + rng() * 0.4);
      g.rotation.y = rng() * Math.PI;
    } else {
      g.rotation.z = (rng() - 0.5) * 0.08; // slight lean
    }
    g.userData.kind = 'pole';
    return g;
  }

  // ── Detailed 3D traffic light (better than single LIGHT block) ──
  function trafficLight3D(rng) {
    var g = new THREE.Group();
    var poleMat = mat(0x303030);
    var housingMat = mat(0x111111);

    // vertical pole
    var pole = box(0.1, 4.8, 0.1, poleMat); pole.position.y = 2.4; g.add(pole);
    // horizontal arm
    var arm = box(2.0, 0.1, 0.1, poleMat); arm.position.set(1.0, 4.7, 0); g.add(arm);
    // signal housing hanging from arm
    var housing = box(0.28, 0.75, 0.22, housingMat); housing.position.set(1.85, 4.35, 0); g.add(housing);
    // three lights: red top, amber mid, green bottom
    var lightColors = [mat(0xff2200, { basic: true }), mat(0xff8800, { basic: true }), mat(0x00cc00, { basic: true })];
    for (var i = 0; i < 3; i++) {
      var light = box(0.16, 0.16, 0.06, lightColors[i]);
      light.position.set(1.85, 4.58 - i * 0.24, 0.13);
      g.add(light);
    }
    // visor hoods over lights
    for (var j = 0; j < 3; j++) {
      var visor = box(0.2, 0.04, 0.12, housingMat);
      visor.position.set(1.85, 4.68 - j * 0.24, 0.16);
      g.add(visor);
    }
    // damage: tilt from blast
    if (rng() < 0.5) g.rotation.z = (rng() - 0.5) * 0.35;
    g.userData.kind = 'streetlight';
    return g;
  }

  // ── Bus stop shelter (partially destroyed) ──
  function busStop(rng) {
    var g = new THREE.Group();
    var frameMat = mat(0x4a6a8a);
    var glassMat = mat(0x88aabb, { transparent: true, opacity: 0.4 });
    var roofMat = mat(0x3a5a7a);
    var destroyed = rng() < 0.6;

    // back wall + roof
    var back = box(2.5, 2.2, 0.08, frameMat); back.position.set(0, 1.1, -0.9); g.add(back);
    var roof = box(2.6, 0.1, 1.0, roofMat); roof.position.set(0, 2.25, -0.4); g.add(roof);
    // side panels
    if (!destroyed || rng() < 0.5) {
      var sideL = box(0.08, 2.0, 1.0, frameMat); sideL.position.set(-1.2, 1.0, -0.4); g.add(sideL);
    }
    if (!destroyed || rng() < 0.5) {
      var sideR = box(0.08, 2.0, 1.0, frameMat); sideR.position.set(1.2, 1.0, -0.4); g.add(sideR);
    }
    // glass panels (may be shattered)
    if (!destroyed) {
      var glassP = box(2.3, 1.8, 0.04, glassMat); glassP.position.set(0, 1.0, -0.88); g.add(glassP);
    } else {
      // shattered glass fragments
      for (var i = 0; i < 4; i++) {
        var shard = box(0.4 + rng() * 0.5, 0.3 + rng() * 0.4, 0.03, glassMat);
        shard.position.set((rng() - 0.5) * 2, rng() * 0.5, -0.85 + rng() * 0.1);
        shard.rotation.z = (rng() - 0.5) * 0.8;
        g.add(shard);
      }
    }
    // bench inside
    var bench = box(2.0, 0.12, 0.4, mat(0x8a7050)); bench.position.set(0, 0.5, -0.6); g.add(bench);
    var legL = box(0.08, 0.5, 0.4, mat(0x4a4a4a)); legL.position.set(-0.9, 0.25, -0.6); g.add(legL);
    var legR = box(0.08, 0.5, 0.4, mat(0x4a4a4a)); legR.position.set(0.9, 0.25, -0.6); g.add(legR);

    if (destroyed) g.rotation.z = (rng() - 0.5) * 0.12;
    g.userData.kind = 'busstop';
    return g;
  }

  // ── Military checkpoint: barriers + guard post + flag ──
  function checkpoint(rng, faction) {
    var g = new THREE.Group();
    // Row of concrete barriers across the road
    var cMat = mat(0xaaaaaa);
    for (var i = -2; i <= 2; i++) {
      var b = box(1.0, 0.9, 0.5, cMat); b.position.set(i * 1.15, 0.45, 0); g.add(b);
      var bt = box(0.65, 0.35, 0.38, cMat); bt.position.set(i * 1.15, 1.07, 0); g.add(bt);
    }
    // Sandbag nest at one side
    var sbMat = mat(0xa08040);
    for (var j = 0; j < 6; j++) {
      var sb = box(0.52, 0.28, 0.26, sbMat);
      sb.position.set(-3.2 + (j % 3) * 0.48, 0.14 + Math.floor(j / 3) * 0.28, 1.0);
      g.add(sb);
    }
    // Guard post (small shack)
    var postMat = mat(faction === 'ru' ? 0x4a4a32 : 0x3a4a2f);
    var shack = box(1.2, 2.0, 1.2, postMat); shack.position.set(3.0, 1.0, 0.5); g.add(shack);
    var shackRoof = box(1.4, 0.15, 1.4, mat(0x2a3020)); shackRoof.position.set(3.0, 2.08, 0.5); g.add(shackRoof);
    // Flag on pole
    var flagPole = box(0.06, 2.5, 0.06, mat(0x5a5a5a)); flagPole.position.set(3.5, 1.25 + 2.0, 0.5); g.add(flagPole);
    var flagColor = faction === 'ru' ? 0xcc0000 : 0x3355ff;
    var flag = box(0.7, 0.45, 0.03, mat(flagColor, { basic: true })); flag.position.set(3.85, 1.25 + 2.0 + 2.25, 0.5); g.add(flag);
    // yellow stripe on Ukrainian flag
    if (faction === 'ua') {
      var stripe = box(0.7, 0.22, 0.04, mat(0xffdd00, { basic: true })); stripe.position.set(3.85, 1.25 + 2.0 + 2.03, 0.5); g.add(stripe);
    }

    g.userData.kind = 'checkpoint';
    return g;
  }

  function clear(scene) {
    if (_group && scene) scene.remove(_group);
    if (_group) {
      _group.traverse(function (o) { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); });
    }
    _group = null;
  }

  // ── Detect whether position is near a road (ASPHALT block) ──
  function isNearRoad(x, gy, z) {
    try {
      var VW = window.VoxelWorld;
      if (!VW || !VW.getBlock || !VW.BLOCK) return false;
      var ASPH = VW.BLOCK.ASPHALT || 18;
      for (var dx = -3; dx <= 3; dx++) {
        for (var dz = -3; dz <= 3; dz++) {
          if (VW.getBlock(Math.floor(x + dx), Math.floor(gy), Math.floor(z + dz)) === ASPH ||
              VW.getBlock(Math.floor(x + dx), Math.floor(gy) - 1, Math.floor(z + dz)) === ASPH) return true;
        }
      }
    } catch (e) {}
    return false;
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
    // urban/industrial = denser; grassland = sparser
    var count = theme === 'urban' ? 24 : theme === 'industrial' ? 18 : 10;

    var groundY = function (x, z) {
      try {
        if (window.VoxelWorld && window.VoxelWorld.getTopSolidY) return window.VoxelWorld.getTopSolidY(x, z);
      } catch (e) {}
      return 0;
    };

    var placed = 0, tries = 0;
    while (placed < count && tries < count * 8) {
      tries++;
      var ang = rng() * Math.PI * 2;
      var rad = 5 + rng() * 52;
      var x = Math.cos(ang) * rad;
      var z = Math.sin(ang) * rad;
      var gy = groundY(x, z);
      if (!isFinite(gy) || gy <= 0) continue;
      // skip water tiles
      try {
        var VW = window.VoxelWorld;
        if (VW && VW.getBlock && VW.BLOCK && VW.getBlock(Math.floor(x), Math.floor(gy) - 1, Math.floor(z)) === VW.BLOCK.WATER) continue;
      } catch (eW) {}

      var nearRoad = isNearRoad(x, gy, z);
      var roll = rng();
      var prop;

      if (theme === 'grassland') {
        // Grassland: mostly vehicles + scattered rubble; checkpoints on roads
        if (nearRoad && roll < 0.2) {
          prop = checkpoint(rng, rng() < 0.5 ? 'ru' : 'ua');
        } else if (roll < 0.45) {
          prop = civilianCar(rng, (rng() * 3) | 0);
        } else if (roll < 0.7) {
          prop = militaryWreck(rng, rng() < 0.5 ? 'ru' : 'ua');
        } else if (roll < 0.85) {
          prop = rubblePile(rng);
        } else {
          prop = utilityPole(rng);
        }
      } else {
        // Urban / Industrial: full mix with checkpoints, shelters, barriers
        if (nearRoad && roll < 0.12) {
          prop = checkpoint(rng, rng() < 0.55 ? 'ru' : 'ua');
        } else if (nearRoad && roll < 0.20) {
          prop = trafficLight3D(rng);
        } else if (nearRoad && roll < 0.27) {
          prop = busStop(rng);
        } else if (nearRoad && roll < 0.36) {
          prop = concBarrier(rng);
        } else if (roll < 0.50) {
          prop = militaryWreck(rng, rng() < 0.55 ? 'ru' : 'ua');
        } else if (roll < 0.68) {
          prop = civilianCar(rng, rng() < 0.3 ? 0 : (rng() < 0.5 ? 1 : 2));
        } else if (roll < 0.80) {
          prop = rubblePile(rng);
        } else if (roll < 0.88) {
          prop = sandbagPos(rng);
        } else if (roll < 0.94) {
          prop = utilityPole(rng);
        } else {
          prop = concBarrier(rng);
        }
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
