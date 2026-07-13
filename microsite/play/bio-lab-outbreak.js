/* ───────────────────────────────────────────────────────────────────────────
   bio-lab-outbreak.js — BIO-LAB OUTBREAK FPS
   API: window.BioLabOutbreak = { init, update, reset }
   Activation: B then L within 400ms

   Theme: Quarantined underground biolab — CDC special agent containing
   a viral outbreak in a research facility.

   Objectives:
     - Collect 4 antidote vials (E to pick up, glowing green SphereGeometry)
     - Purge all 3 quarantine zones (kill all infected, then press decon button E)
     - Destroy 3 cryogenic virus sample tanks (shoot them)
     - Eliminate Dr. Voss (boss, 450HP, mutates at 225HP into super form)
     - Reach roof evac point

   Enemies:
     - 15 infected researchers (0x665544, 60HP) — shambling melee
     - 8 hostile mercenaries (0x334433, 90HP) — ranged shooting
     - Dr. Voss boss (0x443322, 450HP) — injects at 225HP, becomes faster+stronger

   HUD: BIO-LAB OUTBREAK | ANTIDOTES N/4 | ZONES PURGED N/3 |
        VIRUS SAMPLES N/3 DESTROYED | DR. VOSS ALIVE/KIA |
        INFECTION N% | SUIT N% | TIMER MM:SS | HP N
   ─────────────────────────────────────────────────────────────────────────── */

window.BioLabOutbreak = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation: B then L within 400ms ───────────────────────────────── */
  var _lastBTime = 0;
  var _lastLTime = 0;
  var BL_WINDOW  = 400;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active    = false;
  var _victory   = false;
  var _defeat    = false;
  var _gameTimer = 1200;  /* 20 minutes */

  /* ── Player stats ──────────────────────────────────────────────────────── */
  var _playerHP       = 100;
  var _infectionPct   = 0;
  var _suitDurability = 100;
  var _filterTimer    = 60;
  var _antidotes      = 0;
  var _vossKilled     = false;
  var _atEvac         = false;
  var _cryoDestroyed  = 0;
  var _shootCooldown  = 0;

  /* ── Player position/look ──────────────────────────────────────────────── */
  var _playerPos = { x: 0, y: 1.7, z: 40 };
  var _yaw       = 0;
  var _pitch     = 0;
  var _velY      = 0;
  var _onGround  = true;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys    = {};
  var _eDown   = false;
  var _ePrev   = false;
  var _mDX     = 0;
  var _mDY     = 0;

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _enemies = [];
  /*  { bodyMesh, headMesh, pos:{x,z}, hp, maxHp, alive, type, speed,
        state, fireTimer, meleeTimer, alertDist, mutated, light } */

  /* ── Projectiles (player) ──────────────────────────────────────────────── */
  var _bullets = [];
  /* { mesh, pos:{x,y,z}, vel:{x,y,z}, life } */

  /* ── Projectiles (enemy) ───────────────────────────────────────────────── */
  var _eBullets = [];
  /* { mesh, pos:{x,y,z}, vel:{x,z}, life } */

  /* ── Antidote vials ────────────────────────────────────────────────────── */
  var _vials = [];
  /* { mesh, light, pos:{x,z}, collected } */

  /* ── Quarantine zones ──────────────────────────────────────────────────── */
  var _zones = [];
  /* { cx, cz, w, d, purged, btnMesh, btnLight, warnLight,
       tapeLines, infectedIds } */

  /* ── Cryo virus tanks ──────────────────────────────────────────────────── */
  var _cryoTanks = [];
  /* { bodyMesh, topMesh, light, pos:{x,z}, destroyed, hp } */

  /* ── Filter/decon stations ─────────────────────────────────────────────── */
  var _filterStations = [];
  /* { mesh, pos:{x,z} } */

  /* ── Biohazard exposure zones ──────────────────────────────────────────── */
  var _hazardZones = [];
  /* { cx, cz, radius } */

  /* ── Environment cleanup list ──────────────────────────────────────────── */
  var _envObjects = [];
  /* Three.js objects added to scene for cleanup on reset */

  /* ── HUD elements ──────────────────────────────────────────────────────── */
  var _hud       = null;
  var _victoryEl = null;
  var _defeatEl  = null;
  var _crosshair = null;

  /* ══════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ══════════════════════════════════════════════════════════════════════ */

  function mkBox(w, h, d, color, emissive, ei) {
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000,
      emissiveIntensity: ei !== undefined ? ei : 0
    });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function mkCyl(rT, rB, h, segs, color, emissive, ei) {
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000,
      emissiveIntensity: ei !== undefined ? ei : 0
    });
    return new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, segs || 8), mat);
  }

  function mkSphere(r, ws, hs, color, emissive, ei) {
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000,
      emissiveIntensity: ei !== undefined ? ei : 0
    });
    return new THREE.Mesh(new THREE.SphereGeometry(r, ws || 8, hs || 8), mat);
  }

  function mkCone(r, h, segs, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.ConeGeometry(r, h, segs || 8), mat);
  }

  function mkLines(pts, color) {
    var verts = [];
    for (var i = 0; i < pts.length; i++) {
      verts.push(pts[i].x, pts[i].y, pts[i].z);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
  }

  function mkLight(color, intensity, dist) {
    return new THREE.PointLight(color, intensity, dist);
  }

  function addObj(obj) {
    _scene.add(obj);
    _envObjects.push(obj);
    return obj;
  }

  function dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ══════════════════════════════════════════════════════════════════════
     BUILD ENVIRONMENT
  ══════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    /* Fog and background */
    _scene.background = new THREE.Color(0x050a05);
    _scene.fog = new THREE.Fog(0x050a05, 25, 65);

    /* Ambient and emergency red lighting */
    var amb = new THREE.AmbientLight(0x0a1a0a, 0.7);
    _scene.add(amb);
    _envObjects.push(amb);

    var redAmb = mkLight(0xff1100, 1.2, 80);
    redAmb.position.set(0, 4, 0);
    addObj(redAmb);

    var redAmb2 = mkLight(0xdd0000, 0.8, 50);
    redAmb2.position.set(-20, 4, 0);
    addObj(redAmb2);

    /* Floor */
    var floor = mkBox(120, 0.4, 120, 0x2a3a2a);
    floor.position.set(0, -0.2, 0);
    addObj(floor);

    /* Ceiling */
    var ceil = mkBox(120, 0.4, 120, 0x1a2a1a);
    ceil.position.set(0, 4.2, 0);
    addObj(ceil);

    /* Main N-S corridor */
    buildWalls(0, 0, 80, 6, 4);
    /* Main E-W corridor */
    buildWalls(0, 0, 6, 4, 80);

    /* Lab Alpha (NE) */
    buildRoomWalls(22, -30, 22, 4, 18);
    /* Lab Beta (NW) */
    buildRoomWalls(-22, -30, 22, 4, 18);
    /* Lab Gamma (SE) */
    buildRoomWalls(22, 30, 22, 4, 18);
    /* Lab Delta (SW) */
    buildRoomWalls(-22, 30, 22, 4, 18);

    /* Control room */
    buildRoomWalls(0, -45, 18, 4, 12);
    buildControlRoom();

    /* Decontam shower room */
    buildRoomWalls(-50, 0, 14, 4, 14);
    buildDeconRoom();

    /* Airlock N */
    buildAirlock(0, -15, true);
    /* Airlock E */
    buildAirlock(15, 0, false);

    /* Server racks in control room */
    buildServerRacks(4, -45);
    buildServerRacks(-4, -45);

    /* Containment tanks (aesthetic, not cryo) */
    buildContainmentTanks();

    /* Evac platform */
    buildEvacPlatform();

    /* Ceiling light strips */
    buildLightStrips();
  }

  function buildWalls(cx, cz, w, h, d) {
    var color = 0x445544;
    var wN = mkBox(w, h, 0.3, color);
    wN.position.set(cx, h / 2, cz - d / 2);
    addObj(wN);
    var wS = mkBox(w, h, 0.3, color);
    wS.position.set(cx, h / 2, cz + d / 2);
    addObj(wS);
    var wW = mkBox(0.3, h, d, color);
    wW.position.set(cx - w / 2, h / 2, cz);
    addObj(wW);
    var wE = mkBox(0.3, h, d, color);
    wE.position.set(cx + w / 2, h / 2, cz);
    addObj(wE);
  }

  function buildRoomWalls(cx, cz, w, h, d) {
    var color = 0x3a4a3a;
    var wN = mkBox(w, h, 0.3, color);
    wN.position.set(cx, h / 2, cz - d / 2);
    addObj(wN);
    var wS = mkBox(w, h, 0.3, color);
    wS.position.set(cx, h / 2, cz + d / 2);
    addObj(wS);
    var wW = mkBox(0.3, h, d, color);
    wW.position.set(cx - w / 2, h / 2, cz);
    addObj(wW);
    var wE = mkBox(0.3, h, d, color);
    wE.position.set(cx + w / 2, h / 2, cz);
    addObj(wE);
  }

  function buildControlRoom() {
    /* Panel board */
    var panelPts = [
      { x: -8, y: 1, z: -50 },   { x: 8, y: 1, z: -50 },
      { x: 8,  y: 1, z: -50 },   { x: 8, y: 3, z: -50 },
      { x: 8,  y: 3, z: -50 },   { x: -8, y: 3, z: -50 },
      { x: -8, y: 3, z: -50 },   { x: -8, y: 1, z: -50 }
    ];
    var panel = mkLines(panelPts, 0x00ff88);
    addObj(panel);

    /* Monitor boxes */
    for (var i = -2; i <= 2; i++) {
      var mon = mkBox(1.4, 0.9, 0.1, 0x112211, 0x00ff44, 0.5);
      mon.position.set(i * 2.8, 2, -50.9);
      addObj(mon);
    }

    /* Desk */
    var desk = mkBox(16, 0.3, 2, 0x223322);
    desk.position.set(0, 0.9, -49.2);
    addObj(desk);

    /* Control light */
    var cl = mkLight(0x00ff44, 1, 10);
    cl.position.set(0, 3.5, -47);
    addObj(cl);
  }

  function buildDeconRoom() {
    /* Decon shower cylinder */
    var shower = mkCyl(1.3, 1.3, 3.8, 12, 0x445566, 0x0088ff, 0.3);
    shower.position.set(-50, 1.9, 0);
    addObj(shower);

    var showerTop = mkCone(1.4, 0.6, 12, 0x334455);
    showerTop.position.set(-50, 4, 0);
    addObj(showerTop);

    var showerLight = mkLight(0x0088ff, 2.5, 12);
    showerLight.position.set(-50, 3.5, 0);
    addObj(showerLight);

    /* Decon label strip */
    var label = mkBox(3, 0.35, 0.1, 0x004499, 0x0044ff, 0.4);
    label.position.set(-50, 4.2, -1.5);
    addObj(label);

    /* Register as filter station */
    _filterStations.push({ mesh: shower, pos: { x: -50, z: 0 } });

    /* Second filter station in main corridor */
    var fs2 = mkBox(0.8, 1.5, 0.5, 0x3355aa, 0x0044ff, 0.2);
    fs2.position.set(0, 0.75, 5);
    addObj(fs2);
    _filterStations.push({ mesh: fs2, pos: { x: 0, z: 5 } });
  }

  function buildAirlock(cx, cz, ns) {
    var w = ns ? 6 : 4;
    var d = ns ? 4 : 6;
    var box1 = mkBox(w, 4, d, 0x445544);
    box1.position.set(cx, 2, cz - (ns ? 3.5 : 0));
    addObj(box1);

    var box2 = mkBox(w, 4, d, 0x445544);
    box2.position.set(cx, 2, cz + (ns ? 3.5 : 0));
    addObj(box2);

    var frame = mkBox(ns ? 2.5 : 0.1, 3.2, ns ? 0.1 : 2.5, 0x778866);
    frame.position.set(cx, 1.6, cz);
    addObj(frame);

    var al = mkLight(0xffaa00, 1.5, 8);
    al.position.set(cx, 3, cz);
    addObj(al);
  }

  function buildContainmentTanks() {
    var positions = [
      { x: -15, z: -10 }, { x: 15, z: -10 }, { x: 0, z: 10 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var tank = mkCyl(0.9, 0.9, 2.8, 10, 0x334455, 0x003366, 0.2);
      tank.position.set(p.x, 1.4, p.z);
      addObj(tank);
      var tTop = mkSphere(0.9, 8, 6, 0x223344);
      tTop.position.set(p.x, 2.9, p.z);
      addObj(tTop);
      var tLight = mkLight(0x0044ff, 1, 7);
      tLight.position.set(p.x, 2.5, p.z);
      addObj(tLight);
    }
  }

  function buildServerRacks(cx, cz) {
    for (var i = 0; i < 4; i++) {
      var rack = mkBox(0.9, 3.2, 0.7, 0x1a2a1a);
      rack.position.set(cx, 1.6, cz + i * 1.2 - 1.8);
      addObj(rack);
      for (var j = 0; j < 4; j++) {
        var led = mkBox(0.6, 0.06, 0.06, 0x00ff00, 0x00ff00, 1);
        led.position.set(cx, 0.4 + j * 0.7, cz + i * 1.2 - 1.8 + 0.38);
        addObj(led);
      }
    }
  }

  function buildLightStrips() {
    var stripPositions = [
      { x: 0, z: 0 }, { x: 0, z: -20 }, { x: 0, z: 20 },
      { x: 10, z: -30 }, { x: -10, z: -30 }, { x: 10, z: 30 }
    ];
    for (var i = 0; i < stripPositions.length; i++) {
      var p = stripPositions[i];
      var strip = mkBox(0.8, 0.08, 0.08, 0x88ff88, 0x44ff44, 0.8);
      strip.position.set(p.x, 4.1, p.z);
      addObj(strip);
      var sl = mkLight(0x44ff44, 0.6, 8);
      sl.position.set(p.x, 4, p.z);
      addObj(sl);
    }
  }

  function buildEvacPlatform() {
    /* Roof platform */
    var platform = mkBox(12, 0.5, 12, 0x445533);
    platform.position.set(0, 8.25, 0);
    addObj(platform);

    /* Staircase */
    for (var s = 0; s < 8; s++) {
      var step = mkBox(4, 0.35, 1.2, 0x334422);
      step.position.set(7 + s * 0.5, 0.3 + s * 1.0, 0);
      addObj(step);
    }

    /* Evac beacon */
    var beacon = mkCyl(0.7, 0.7, 0.2, 8, 0x00ff55, 0x00ff55, 1);
    beacon.position.set(0, 8.6, 0);
    addObj(beacon);

    var evacLight = mkLight(0x00ff55, 4, 18);
    evacLight.position.set(0, 11, 0);
    addObj(evacLight);

    /* Helipad lines */
    var hPts = [
      { x: -5, y: 8.55, z: -5 }, { x: 5, y: 8.55, z: -5 },
      { x: 5, y: 8.55, z: -5 },  { x: 5, y: 8.55, z: 5 },
      { x: 5, y: 8.55, z: 5 },   { x: -5, y: 8.55, z: 5 },
      { x: -5, y: 8.55, z: 5 },  { x: -5, y: 8.55, z: -5 },
      { x: -2, y: 8.55, z: 0 },  { x: 2, y: 8.55, z: 0 },
      { x: 0, y: 8.55, z: -2 },  { x: 0, y: 8.55, z: 2 }
    ];
    addObj(mkLines(hPts, 0xffff00));
  }

  /* ══════════════════════════════════════════════════════════════════════
     QUARANTINE ZONES
  ══════════════════════════════════════════════════════════════════════ */

  function buildQuarantineZones() {
    var defs = [
      { cx: 22, cz: -30, w: 22, d: 18 },
      { cx: -22, cz: -30, w: 22, d: 18 },
      { cx: -22, cz: 30, w: 22, d: 18 }
    ];

    for (var i = 0; i < defs.length; i++) {
      var def = defs[i];
      var hw = def.w / 2, hd = def.d / 2;

      /* Yellow hazard tape border (LineSegments) */
      var tapePts = [
        { x: def.cx - hw, y: 0.08, z: def.cz - hd },
        { x: def.cx + hw, y: 0.08, z: def.cz - hd },
        { x: def.cx + hw, y: 0.08, z: def.cz - hd },
        { x: def.cx + hw, y: 0.08, z: def.cz + hd },
        { x: def.cx + hw, y: 0.08, z: def.cz + hd },
        { x: def.cx - hw, y: 0.08, z: def.cz + hd },
        { x: def.cx - hw, y: 0.08, z: def.cz + hd },
        { x: def.cx - hw, y: 0.08, z: def.cz - hd },
        { x: def.cx - hw, y: 2.2, z: def.cz - hd },
        { x: def.cx + hw, y: 2.2, z: def.cz - hd },
        { x: def.cx + hw, y: 2.2, z: def.cz - hd },
        { x: def.cx + hw, y: 2.2, z: def.cz + hd },
        { x: def.cx + hw, y: 2.2, z: def.cz + hd },
        { x: def.cx - hw, y: 2.2, z: def.cz + hd },
        { x: def.cx - hw, y: 2.2, z: def.cz + hd },
        { x: def.cx - hw, y: 2.2, z: def.cz - hd }
      ];
      var tape = mkLines(tapePts, 0xffee00);
      addObj(tape);

      /* Red PointLight warning */
      var warnLight = mkLight(0xff0000, 3, 22);
      warnLight.position.set(def.cx, 3.5, def.cz);
      addObj(warnLight);

      /* Warning strobe sphere */
      var strobe = mkSphere(0.35, 6, 6, 0xff2200, 0xff0000, 1);
      strobe.position.set(def.cx, 3.8, def.cz);
      addObj(strobe);

      /* Decon button */
      var btn = mkBox(0.5, 0.5, 0.2, 0xff3300, 0xff2200, 0.6);
      btn.position.set(def.cx + hw - 0.8, 1.4, def.cz);
      addObj(btn);

      var btnLight = mkLight(0xff3300, 1.2, 4);
      btnLight.position.set(def.cx + hw - 0.8, 1.9, def.cz);
      addObj(btnLight);

      /* Biohazard exposure zone */
      _hazardZones.push({
        cx: def.cx, cz: def.cz,
        radius: Math.max(hw, hd)
      });

      _zones.push({
        cx: def.cx, cz: def.cz, w: def.w, d: def.d,
        purged: false, infectedIds: [],
        btnMesh: btn, btnLight: btnLight,
        warnLight: warnLight, tapeLines: tape
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     CRYO TANKS (virus sample storage)
  ══════════════════════════════════════════════════════════════════════ */

  function buildCryoTanks() {
    var positions = [
      { x: 22, z: -30 }, { x: -22, z: -30 }, { x: 22, z: 30 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var body = mkCyl(0.75, 0.75, 2.6, 10, 0x334455, 0x0055ff, 0.35);
      body.position.set(p.x, 1.3, p.z);
      addObj(body);

      var cap = mkCyl(0.5, 0.75, 0.4, 10, 0x223344);
      cap.position.set(p.x, 2.8, p.z);
      addObj(cap);

      var glow = mkLight(0x0088ff, 2, 9);
      glow.position.set(p.x, 2, p.z);
      addObj(glow);

      _cryoTanks.push({
        bodyMesh: body, topMesh: cap, light: glow,
        pos: { x: p.x, z: p.z },
        destroyed: false, hp: 75
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     ANTIDOTE VIALS
  ══════════════════════════════════════════════════════════════════════ */

  function buildAntidoteVials() {
    var positions = [
      { x: 20, z: -28 }, { x: -20, z: -28 },
      { x: -20, z: 28 }, { x: 5, z: -42 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var v = mkSphere(0.28, 8, 8, 0x00ff55, 0x00ff55, 1);
      v.position.set(p.x, 0.7, p.z);
      addObj(v);

      var vLight = mkLight(0x00ff55, 1.8, 6);
      vLight.position.set(p.x, 1.1, p.z);
      addObj(vLight);

      _vials.push({ mesh: v, light: vLight, pos: { x: p.x, z: p.z }, collected: false });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     ENEMIES
  ══════════════════════════════════════════════════════════════════════ */

  function buildEnemies() {
    /* 15 infected researchers — 5 per quarantine zone */
    var infectedSpawns = [
      /* Zone 0 (NE lab) */
      { x: 20, z: -32 }, { x: 24, z: -28 }, { x: 18, z: -26 },
      { x: 25, z: -35 }, { x: 20, z: -38 },
      /* Zone 1 (NW lab) */
      { x: -20, z: -32 }, { x: -24, z: -28 }, { x: -18, z: -26 },
      { x: -25, z: -35 }, { x: -20, z: -38 },
      /* Zone 2 (SW lab) */
      { x: -20, z: 28 }, { x: -24, z: 32 }, { x: -18, z: 35 },
      { x: -25, z: 26 }, { x: -20, z: 32 }
    ];

    for (var i = 0; i < infectedSpawns.length; i++) {
      var p = infectedSpawns[i];
      var idx = _enemies.length;
      _enemies.push(spawnEnemy(p.x, p.z, 'infected'));
      var zoneIdx = Math.floor(i / 5);
      if (zoneIdx < _zones.length) {
        _zones[zoneIdx].infectedIds.push(idx);
      }
    }

    /* 8 mercenaries in corridors */
    var mercSpawns = [
      { x: -3, z: -12 }, { x: 3, z: -12 },
      { x: -3, z: 12 },  { x: 3, z: 12 },
      { x: -40, z: -4 }, { x: -40, z: 4 },
      { x: 28, z: -3 },  { x: 28, z: 3 }
    ];
    for (var j = 0; j < mercSpawns.length; j++) {
      _enemies.push(spawnEnemy(mercSpawns[j].x, mercSpawns[j].z, 'merc'));
    }

    /* Dr. Voss boss */
    var voss = spawnEnemy(22, 30, 'voss');
    voss.hp = 450;
    voss.maxHp = 450;
    voss.speed = 2;
    voss.alertDist = 35;
    _enemies.push(voss);
  }

  function spawnEnemy(x, z, type) {
    var color, hp, speed, alertDist;
    if (type === 'infected') {
      color = 0x665544; hp = 60; speed = 1.5; alertDist = 10;
    } else if (type === 'merc') {
      color = 0x334433; hp = 90; speed = 3; alertDist = 22;
    } else {
      color = 0x443322; hp = 450; speed = 2; alertDist = 30;
    }

    var body = mkBox(0.65, 1.4, 0.55, color);
    body.position.set(x, 0.7, z);
    addObj(body);

    var head = mkSphere(0.3, 6, 6, color);
    head.position.set(x, 1.65, z);
    addObj(head);

    var armL = mkBox(0.22, 0.8, 0.22, color);
    armL.position.set(x - 0.48, 0.75, z);
    addObj(armL);

    var armR = mkBox(0.22, 0.8, 0.22, color);
    armR.position.set(x + 0.48, 0.75, z);
    addObj(armR);

    return {
      bodyMesh: body, headMesh: head, armL: armL, armR: armR,
      pos: { x: x, z: z },
      hp: hp, maxHp: hp,
      alive: true,
      type: type,
      speed: speed,
      state: 'idle',
      fireTimer: type === 'merc' ? 2 : 1,
      meleeTimer: 0,
      alertDist: alertDist,
      mutated: false,
      light: null
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'color:#88ff44', 'font:bold 13px monospace',
      'background:rgba(0,8,0,0.82)', 'padding:7px 16px',
      'border:1px solid #00ff44', 'border-radius:4px',
      'pointer-events:none', 'z-index:9999',
      'text-align:center', 'min-width:680px',
      'text-shadow:0 0 4px #00ff44'
    ].join(';');
    document.body.appendChild(_hud);

    _crosshair = document.createElement('div');
    _crosshair.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'width:14px', 'height:14px', 'margin:-7px 0 0 -7px',
      'border:2px solid rgba(136,255,68,0.8)',
      'border-radius:50%',
      'pointer-events:none', 'z-index:9999'
    ].join(';');
    document.body.appendChild(_crosshair);

    _victoryEl = document.createElement('div');
    _victoryEl.style.cssText = [
      'position:fixed', 'top:38%', 'left:50%', 'transform:translateX(-50%)',
      'color:#00ff88', 'font:bold 30px monospace', 'text-align:center',
      'background:rgba(0,16,0,0.92)', 'padding:24px 48px',
      'border:2px solid #00ff88', 'border-radius:6px',
      'pointer-events:none', 'z-index:10000', 'display:none',
      'text-shadow:0 0 8px #00ff44'
    ].join(';');
    _victoryEl.innerHTML = 'MISSION COMPLETE<br><span style="font-size:18px">OUTBREAK CONTAINED — EVAC SUCCESSFUL</span>';
    document.body.appendChild(_victoryEl);

    _defeatEl = document.createElement('div');
    _defeatEl.style.cssText = [
      'position:fixed', 'top:38%', 'left:50%', 'transform:translateX(-50%)',
      'color:#ff2200', 'font:bold 30px monospace', 'text-align:center',
      'background:rgba(16,0,0,0.92)', 'padding:24px 48px',
      'border:2px solid #ff2200', 'border-radius:6px',
      'pointer-events:none', 'z-index:10000', 'display:none',
      'text-shadow:0 0 8px #ff2200'
    ].join(';');
    _defeatEl.innerHTML = 'AGENT DOWN<br><span style="font-size:18px">OUTBREAK UNCONTROLLED</span>';
    document.body.appendChild(_defeatEl);
  }

  function refreshHUD() {
    if (!_hud) return;
    var zonesPurged = 0;
    for (var i = 0; i < _zones.length; i++) { if (_zones[i].purged) zonesPurged++; }
    var rem = Math.max(0, _gameTimer);
    var mm = Math.floor(rem / 60);
    var ss = Math.floor(rem % 60);
    var ts = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    var infC = _infectionPct > 70 ? '#ff2200' : _infectionPct > 40 ? '#ffaa00' : '#88ff44';
    var sCl = _suitDurability < 30 ? '#ff2200' : _suitDurability < 60 ? '#ffaa00' : '#88ff44';
    var hpC = _playerHP < 25 ? '#ff2200' : _playerHP < 50 ? '#ffaa00' : '#88ff44';
    var vossStr = _vossKilled
      ? '<span style="color:#00ff44">KIA</span>'
      : '<span style="color:#ff4400">ALIVE</span>';
    _hud.innerHTML =
      'BIO-LAB OUTBREAK &nbsp;|&nbsp; ANTIDOTES: ' + _antidotes + '/4 &nbsp;|&nbsp; ' +
      'ZONES PURGED: ' + zonesPurged + '/3 &nbsp;|&nbsp; ' +
      'VIRUS SAMPLES: ' + _cryoDestroyed + '/3 DESTROYED &nbsp;|&nbsp; DR. VOSS: ' + vossStr + '<br>' +
      'INFECTION: <span style="color:' + infC + '">' + Math.floor(_infectionPct) + '%</span> &nbsp;|&nbsp; ' +
      'SUIT: <span style="color:' + sCl + '">' + Math.floor(_suitDurability) + '%</span> &nbsp;|&nbsp; ' +
      'TIMER: ' + ts + ' &nbsp;|&nbsp; ' +
      'HP: <span style="color:' + hpC + '">' + _playerHP + '</span>';
  }

  /* ══════════════════════════════════════════════════════════════════════
     INPUT
  ══════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;

    /* Activation combo */
    if (e.code === 'KeyB') _lastBTime = performance.now();
    if (e.code === 'KeyL') {
      _lastLTime = performance.now();
      if (_lastBTime > 0 && (_lastLTime - _lastBTime) < BL_WINDOW) {
        activate();
      }
    }

    if (!_active) return;
    if (e.code === 'KeyE') _eDown = true;
    if (e.code === 'Space') e.preventDefault();
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyE') _eDown = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    if (document.pointerLockElement === _canvas) {
      _mDX += e.movementX || 0;
      _mDY += e.movementY || 0;
    }
  }

  function onMouseDown(e) {
    if (!_active || _victory || _defeat) return;
    if (document.pointerLockElement !== _canvas) {
      _canvas.requestPointerLock();
      return;
    }
    if (e.button === 0 && _shootCooldown <= 0) {
      firePlayerBullet();
      _shootCooldown = 0.25;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     SHOOTING
  ══════════════════════════════════════════════════════════════════════ */

  function firePlayerBullet() {
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));
    dir.normalize();

    var b = mkSphere(0.09, 4, 4, 0xffff55, 0xffff55, 1);
    b.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(b);
    _envObjects.push(b);

    _bullets.push({
      mesh: b,
      pos: { x: _playerPos.x, y: _playerPos.y, z: _playerPos.z },
      vel: { x: dir.x * 45, y: dir.y * 45, z: dir.z * 45 },
      life: 2
    });
  }

  function fireEnemyBullet(enemy) {
    var dx = _playerPos.x - enemy.pos.x;
    var dz = _playerPos.z - enemy.pos.z;
    var len = Math.sqrt(dx * dx + dz * dz) + 0.001;
    dx /= len; dz /= len;

    var b = mkSphere(0.08, 4, 4, 0xff5500, 0xff2200, 1);
    b.position.set(enemy.pos.x, 1.3, enemy.pos.z);
    _scene.add(b);
    _envObjects.push(b);

    _eBullets.push({
      mesh: b,
      pos: { x: enemy.pos.x, y: 1.3, z: enemy.pos.z },
      vel: { x: dx * 20, z: dz * 20 },
      life: 3
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     UPDATE
  ══════════════════════════════════════════════════════════════════════ */

  function update(dt, scene, camera, canvas) {
    if (!_active) return;
    if (!_scene && scene) {
      _scene = scene; _camera = camera; _canvas = canvas;
    }
    if (!_scene) return;
    if (_victory || _defeat) return;

    if (dt > 0.1) dt = 0.1;

    _gameTimer -= dt;
    if (_gameTimer <= 0) { doDefeat('TIMER EXPIRED'); return; }

    stepPlayer(dt);
    stepBullets(dt);
    stepEnemyBullets(dt);
    stepEnemies(dt);
    stepVials(dt);
    stepCryoTanks(dt);
    stepZones(dt);
    stepInfection(dt);
    stepCamera();
    refreshHUD();
    checkWin();
  }

  /* ── Player movement ────────────────────────────────────────────────────── */
  function stepPlayer(dt) {
    /* Look */
    _yaw   -= _mDX * 0.002;
    _pitch -= _mDY * 0.002;
    _pitch = Math.max(-1.1, Math.min(1.1, _pitch));
    _mDX = 0; _mDY = 0;

    /* Move */
    var spd = 7;
    var dx = 0, dz = 0;
    if (_keys['KeyW']) { dx += Math.sin(_yaw); dz -= Math.cos(_yaw); }
    if (_keys['KeyS']) { dx -= Math.sin(_yaw); dz += Math.cos(_yaw); }
    if (_keys['KeyA']) { dx -= Math.cos(_yaw); dz -= Math.sin(_yaw); }
    if (_keys['KeyD']) { dx += Math.cos(_yaw); dz += Math.sin(_yaw); }
    var ml = Math.sqrt(dx * dx + dz * dz);
    if (ml > 0) { dx /= ml; dz /= ml; }
    _playerPos.x += dx * spd * dt;
    _playerPos.z += dz * spd * dt;

    /* Gravity / jump */
    if (_keys['Space'] && _onGround) {
      _velY = 6;
      _onGround = false;
    }
    _velY -= 20 * dt;
    _playerPos.y += _velY * dt;
    if (_playerPos.y < 1.7) {
      _playerPos.y = 1.7;
      _velY = 0;
      _onGround = true;
    }

    /* Bounds */
    _playerPos.x = Math.max(-58, Math.min(58, _playerPos.x));
    _playerPos.z = Math.max(-58, Math.min(58, _playerPos.z));

    /* Shoot cooldown */
    if (_shootCooldown > 0) _shootCooldown -= dt;

    /* Air filter timer */
    _filterTimer -= dt;
    if (_filterTimer <= 0) {
      _filterTimer = 60;
      _suitDurability = Math.max(0, _suitDurability - 4);
    }

    /* E key interactions (edge-detect) */
    if (_eDown && !_ePrev) {
      doInteract();
    }
    _ePrev = _eDown;
  }

  function doInteract() {
    /* Pick up vials */
    for (var i = 0; i < _vials.length; i++) {
      var v = _vials[i];
      if (v.collected) continue;
      if (dist2(_playerPos.x, _playerPos.z, v.pos.x, v.pos.z) < 2) {
        v.collected = true;
        _scene.remove(v.mesh);
        _scene.remove(v.light);
        _antidotes++;
        _infectionPct = Math.max(0, _infectionPct - 25);
        return;
      }
    }

    /* Filter stations */
    for (var j = 0; j < _filterStations.length; j++) {
      var fs = _filterStations[j];
      if (dist2(_playerPos.x, _playerPos.z, fs.pos.x, fs.pos.z) < 2.5) {
        _filterTimer = 60;
        _suitDurability = Math.min(100, _suitDurability + 25);
        return;
      }
    }

    /* Zone decon buttons */
    for (var k = 0; k < _zones.length; k++) {
      var zone = _zones[k];
      if (zone.purged) continue;
      var bd = dist2(_playerPos.x, _playerPos.z,
                     zone.btnMesh.position.x, zone.btnMesh.position.z);
      if (bd < 2) {
        /* Check all infected in zone are dead */
        var allDead = true;
        for (var m = 0; m < zone.infectedIds.length; m++) {
          var ei = zone.infectedIds[m];
          if (ei < _enemies.length && _enemies[ei].alive) {
            allDead = false;
            break;
          }
        }
        if (allDead) {
          zone.purged = true;
          zone.btnMesh.material.color.setHex(0x00ff44);
          zone.btnMesh.material.emissive.setHex(0x00ff00);
          zone.btnLight.color.setHex(0x00ff44);
          zone.warnLight.color.setHex(0x00ff44);
          zone.tapeLines.material.color.setHex(0x00ff44);
          /* Remove zone from hazard zones */
          for (var n = _hazardZones.length - 1; n >= 0; n--) {
            if (_hazardZones[n].cx === zone.cx && _hazardZones[n].cz === zone.cz) {
              _hazardZones.splice(n, 1);
              break;
            }
          }
        }
        return;
      }
    }
  }

  /* ── Camera ─────────────────────────────────────────────────────────────── */
  function stepCamera() {
    if (!_camera) return;
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
    _camera.rotation.z = 0;
  }

  /* ── Player bullets ─────────────────────────────────────────────────────── */
  function stepBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.pos.z += b.vel.z * dt;
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);

      var hit = false;

      /* Hit enemies */
      for (var j = 0; j < _enemies.length && !hit; j++) {
        var en = _enemies[j];
        if (!en.alive) continue;
        if (dist2(b.pos.x, b.pos.z, en.pos.x, en.pos.z) < 0.7 &&
            Math.abs(b.pos.y - 1.0) < 1.3) {
          en.hp -= 25;
          hit = true;
          if (en.hp <= 0) killEnemy(j);
          else if (en.type === 'voss' && !en.mutated && en.hp <= 225) {
            mutateVoss(en);
          }
        }
      }

      /* Hit cryo tanks */
      for (var k = 0; k < _cryoTanks.length && !hit; k++) {
        var ct = _cryoTanks[k];
        if (ct.destroyed) continue;
        if (dist2(b.pos.x, b.pos.z, ct.pos.x, ct.pos.z) < 1.1 &&
            b.pos.y < 3.5) {
          ct.hp -= 25;
          hit = true;
          if (ct.hp <= 0) destroyCryoTank(k);
        }
      }

      if (hit || b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  /* ── Enemy bullets ──────────────────────────────────────────────────────── */
  function stepEnemyBullets(dt) {
    for (var i = _eBullets.length - 1; i >= 0; i--) {
      var b = _eBullets[i];
      b.life -= dt;
      b.pos.x += b.vel.x * dt;
      b.pos.z += b.vel.z * dt;
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);

      if (dist2(b.pos.x, b.pos.z, _playerPos.x, _playerPos.z) < 0.6) {
        _playerHP -= 10;
        if (_playerHP <= 0) { doDefeat('AGENT KIA'); return; }
        _scene.remove(b.mesh);
        _eBullets.splice(i, 1);
        continue;
      }
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _eBullets.splice(i, 1);
      }
    }
  }

  /* ── Enemy AI ───────────────────────────────────────────────────────────── */
  function stepEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;

      var dx = _playerPos.x - en.pos.x;
      var dz = _playerPos.z - en.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);

      if (d < en.alertDist) en.state = 'chase';

      if (en.state !== 'chase') continue;

      /* Move toward player */
      if (d > 0.8) {
        en.pos.x += (dx / d) * en.speed * dt;
        en.pos.z += (dz / d) * en.speed * dt;
      }

      en.bodyMesh.position.set(en.pos.x, 0.7, en.pos.z);
      en.headMesh.position.set(en.pos.x, 1.65, en.pos.z);
      en.armL.position.set(en.pos.x - 0.48, 0.75, en.pos.z);
      en.armR.position.set(en.pos.x + 0.48, 0.75, en.pos.z);
      if (en.light) en.light.position.set(en.pos.x, 2.5, en.pos.z);

      /* Melee (infected, voss) */
      if (en.type === 'infected' || en.type === 'voss') {
        en.meleeTimer -= dt;
        if (d < 1.6 && en.meleeTimer <= 0) {
          var mDmg = en.type === 'voss' ? (en.mutated ? 22 : 15) : 8;
          var infDelta = en.type === 'voss' ? 4 : 9;
          _playerHP -= mDmg;
          _infectionPct = Math.min(100, _infectionPct + infDelta);
          en.meleeTimer = en.type === 'voss' ? 0.9 : 1.0;
          if (_playerHP <= 0) { doDefeat('AGENT KIA'); return; }
          if (_infectionPct >= 100) { doDefeat('INFECTION 100% - VIRAL TAKEOVER'); return; }
        }
      }

      /* Ranged (merc, mutated voss) */
      if (en.type === 'merc' || (en.type === 'voss' && en.mutated)) {
        en.fireTimer -= dt;
        if (d < 22 && en.fireTimer <= 0) {
          fireEnemyBullet(en);
          en.fireTimer = en.type === 'voss' ? 0.7 : 1.8;
        }
      }
    }
  }

  function killEnemy(idx) {
    var en = _enemies[idx];
    en.alive = false;
    _scene.remove(en.bodyMesh);
    _scene.remove(en.headMesh);
    _scene.remove(en.armL);
    _scene.remove(en.armR);
    if (en.light) _scene.remove(en.light);
    if (en.type === 'voss') _vossKilled = true;
  }

  function mutateVoss(en) {
    en.mutated = true;
    en.speed = 5;
    en.alertDist = 60;
    en.bodyMesh.material.color.setHex(0x882200);
    en.headMesh.material.color.setHex(0xaa3300);
    en.armL.material.color.setHex(0x882200);
    en.armR.material.color.setHex(0x882200);

    var vLight = mkLight(0xff2200, 4, 14);
    vLight.position.set(en.pos.x, 2.5, en.pos.z);
    _scene.add(vLight);
    _envObjects.push(vLight);
    en.light = vLight;

    /* Spawn additional infected reinforcements */
    for (var s = 0; s < 4; s++) {
      var nx = en.pos.x + (Math.random() - 0.5) * 8;
      var nz = en.pos.z + (Math.random() - 0.5) * 8;
      var newEn = spawnEnemy(nx, nz, 'infected');
      newEn.state = 'chase';
      _enemies.push(newEn);
    }
  }

  /* ── Vials ──────────────────────────────────────────────────────────────── */
  function stepVials(dt) {
    var t = performance.now() * 0.001;
    for (var i = 0; i < _vials.length; i++) {
      var v = _vials[i];
      if (v.collected) continue;
      v.mesh.position.y = 0.7 + Math.sin(t * 2.2 + i * 1.4) * 0.14;
      v.light.position.y = 1.1 + Math.sin(t * 2.2 + i * 1.4) * 0.14;
      v.mesh.rotation.y += 0.025;
    }
  }

  /* ── Cryo tanks ─────────────────────────────────────────────────────────── */
  function destroyCryoTank(idx) {
    var ct = _cryoTanks[idx];
    ct.destroyed = true;
    _scene.remove(ct.bodyMesh);
    _scene.remove(ct.topMesh);
    ct.light.color.setHex(0xff4400);
    ct.light.intensity = 3;
    _cryoDestroyed++;

    /* Biohazard spill damages suit */
    _suitDurability = Math.max(0, _suitDurability - 18);
    _hazardZones.push({ cx: ct.pos.x, cz: ct.pos.z, radius: 4.5 });

    /* Spill visuals */
    var spill = mkCyl(2.2, 2.8, 0.1, 8, 0x22aa55, 0x00ff55, 0.4);
    spill.position.set(ct.pos.x, 0.06, ct.pos.z);
    addObj(spill);
  }

  function stepCryoTanks(dt) {
    var t = performance.now() * 0.001;
    for (var i = 0; i < _cryoTanks.length; i++) {
      var ct = _cryoTanks[i];
      if (!ct.destroyed) {
        ct.light.intensity = 1.6 + Math.sin(t * 2.5 + i) * 0.5;
      }
    }
  }

  /* ── Zone warning strobes ───────────────────────────────────────────────── */
  function stepZones(dt) {
    var t = performance.now() * 0.001;
    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];
      if (!zone.purged) {
        zone.warnLight.intensity = 1.8 + Math.sin(t * 5 + i * 2.1) * 1.4;
      }
    }
  }

  /* ── Infection and suit degradation ────────────────────────────────────── */
  function stepInfection(dt) {
    var inHazard = false;
    for (var i = 0; i < _hazardZones.length; i++) {
      var hz = _hazardZones[i];
      if (dist2(_playerPos.x, _playerPos.z, hz.cx, hz.cz) < hz.radius) {
        inHazard = true;
        break;
      }
    }

    if (inHazard) {
      var suitRate = _suitDurability < 30 ? 4 : 1.2;
      _suitDurability = Math.max(0, _suitDurability - suitRate * dt);
      var infRate = _suitDurability < 30 ? 5 : 1.5;
      _infectionPct = Math.min(100, _infectionPct + infRate * dt);
    }

    if (_infectionPct >= 100) {
      doDefeat('INFECTION 100% - VIRAL TAKEOVER');
    }

    /* Evac zone check (roof platform, y > 8) */
    if (dist2(_playerPos.x, _playerPos.z, 0, 0) < 5 && _playerPos.y > 8) {
      _atEvac = true;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ══════════════════════════════════════════════════════════════════════ */

  function checkWin() {
    if (!_vossKilled) return;
    if (_antidotes < 4) return;
    if (_cryoDestroyed < 3) return;
    for (var i = 0; i < _zones.length; i++) {
      if (!_zones[i].purged) return;
    }
    if (!_atEvac) return;
    doVictory();
  }

  function doVictory() {
    _victory = true;
    if (_victoryEl) _victoryEl.style.display = 'block';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function doDefeat(reason) {
    _defeat = true;
    if (_defeatEl) {
      _defeatEl.innerHTML = 'AGENT DOWN<br>' +
        '<span style="font-size:16px">OUTBREAK UNCONTROLLED<br>' + reason + '</span>';
      _defeatEl.style.display = 'block';
    }
    if (document.pointerLockElement) document.exitPointerLock();
  }

  /* ══════════════════════════════════════════════════════════════════════
     ACTIVATE (called when B+L combo fires)
  ══════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active || !_scene) return;
    _active = true;
    if (_canvas) _canvas.requestPointerLock();
    buildEnvironment();
    buildQuarantineZones();
    buildCryoTanks();
    buildAntidoteVials();
    buildEnemies();
    buildHUD();
    refreshHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════
     INIT / RESET
  ══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
  }

  function reset() {
    _active = false; _victory = false; _defeat = false;
    _gameTimer = 1200;
    _playerHP = 100; _infectionPct = 0; _suitDurability = 100;
    _antidotes = 0; _cryoDestroyed = 0; _vossKilled = false; _atEvac = false;
    _filterTimer = 60; _shootCooldown = 0;
    _yaw = 0; _pitch = 0; _velY = 0; _onGround = true;
    _lastBTime = 0; _lastLTime = 0;
    _playerPos = { x: 0, y: 1.7, z: 40 };
    _keys = {}; _eDown = false; _ePrev = false;
    _mDX = 0; _mDY = 0;

    /* Remove all scene objects */
    for (var i = 0; i < _envObjects.length; i++) {
      if (_scene) _scene.remove(_envObjects[i]);
    }
    for (var j = 0; j < _enemies.length; j++) {
      var en = _enemies[j];
      if (_scene) {
        _scene.remove(en.bodyMesh);
        _scene.remove(en.headMesh);
        _scene.remove(en.armL);
        _scene.remove(en.armR);
        if (en.light) _scene.remove(en.light);
      }
    }
    for (var k = 0; k < _bullets.length; k++) {
      if (_scene) _scene.remove(_bullets[k].mesh);
    }
    for (var l = 0; l < _eBullets.length; l++) {
      if (_scene) _scene.remove(_eBullets[l].mesh);
    }

    _envObjects = []; _enemies = []; _bullets = []; _eBullets = [];
    _vials = []; _zones = []; _cryoTanks = [];
    _filterStations = []; _hazardZones = [];

    if (_hud)      { document.body.removeChild(_hud); _hud = null; }
    if (_crosshair){ document.body.removeChild(_crosshair); _crosshair = null; }
    if (_victoryEl){ document.body.removeChild(_victoryEl); _victoryEl = null; }
    if (_defeatEl) { document.body.removeChild(_defeatEl); _defeatEl = null; }

    if (_scene) {
      _scene.background = null;
      _scene.fog = null;
    }
    _scene = null; _camera = null; _canvas = null;
  }

  /* ══════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════ */

  return { init: init, update: update, reset: reset };

}());
