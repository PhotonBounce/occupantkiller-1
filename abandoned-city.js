/* ─────────────────────────────────────────────────────────────────────────────
   abandoned-city.js — Abandoned City FPS Mini-Game
   API: window.AbandonedCity = { init, update, reset }
   Activation: A then B within 400ms (A first, then B — not simultaneous)

   Theme: Sweep an abandoned Chernobyl-like city overtaken by a criminal
   syndicate using it as a secret base. Streets are overgrown, apartment
   blocks crumbling, a rusted ferris wheel still turns slowly. You must
   eliminate The Phantom — syndicate boss — and reach the extraction
   helicopter on the factory roof.

   Controls:
     A then B  → activate (A first, then B within 400ms)
     WASD      → move
     Mouse     → look
     LClick    → shoot
     R         → reload
     M         → use metro escape route (when near station entrance)
   ───────────────────────────────────────────────────────────────────────── */

window.AbandonedCity = (function () {
  'use strict';

  /* ── Scene references ─────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation: A then B within 400ms ───────────────────────────────── */
  var _aTime      = 0;
  var _bTime      = 0;
  var AB_WINDOW   = 400;

  /* ── Game state ───────────────────────────────────────────────────────── */
  var _active       = false;
  var _victory      = false;
  var _defeat       = false;
  var _msgTimer     = 0;
  var _msgText      = '';
  var _gameTime     = 0;

  /* ── Player ───────────────────────────────────────────────────────────── */
  var _playerPos    = { x: 0, y: 1.8, z: 60 };
  var _playerHP     = 100;
  var _playerSpeed  = 6.5;
  var _yaw          = Math.PI;
  var _pitch        = 0;
  var _keys         = {};
  var _shootCooldown = 0;
  var _ammo         = 90;
  var _maxAmmo      = 90;

  /* ── Metro escape ─────────────────────────────────────────────────────── */
  var _inMetro        = false;
  var _metroTimer     = 0;

  /* ── Radiation zones ──────────────────────────────────────────────────── */
  var _radZones = [];  /* { pos, radius } */
  var _radWarning = false;

  /* ── Ferris wheel ─────────────────────────────────────────────────────── */
  var _ferrisAngle  = 0;
  var _ferrisHub    = null;
  var _ferrisSpokes = null;
  var _gondolas     = [];   /* { mesh, index } — mesh attached to scene */

  /* ── Enemies ──────────────────────────────────────────────────────────── */
  var _soldiers   = [];  /* { mesh, pos, hp, alive, patrol, patrolT, shootTimer } */
  var _snipers    = [];  /* { mesh, pos, hp, alive, sniperPos, shootTimer, gondolaIdx } */
  var _phantom    = null; /* boss object */

  /* ── Projectiles ──────────────────────────────────────────────────────── */
  var _bullets      = [];  /* { mesh, vel, life } */
  var _enemyShots   = [];  /* { mesh, vel, life, dmg } */

  /* ── Scene mesh/light registry for teardown ───────────────────────────── */
  var _sceneMeshes  = [];
  var _sceneLights  = [];

  /* ── HUD overlay element ─────────────────────────────────────────────── */
  var _hudEl  = null;

  /* ── Phantom state ────────────────────────────────────────────────────── */
  var _phantomCamoTimer  = 0;   /* countdown to next camo event */
  var _phantomCamoActive = false;
  var _phantomCamoDur    = 0;
  var _phantomFlashTimer = 0;   /* gunshot flash hint */

  /* ── Input listeners ─────────────────────────────────────────────────── */
  var _bndKeyDown     = null;
  var _bndKeyUp       = null;
  var _bndMouseMove   = null;
  var _bndMouseDown   = null;
  var _bndContextMenu = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _rnd(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _rndInt(lo, hi) {
    return Math.floor(_rnd(lo, hi + 1));
  }

  /* ─── Three.js primitive helpers ─────────────────────────────────────── */
  function _box(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) { mat.transparent = true; mat.opacity = opts.opacity; }
      if (opts.emissive)  mat.emissive = new THREE.Color(opts.emissive);
      if (opts.emissiveIntensity !== undefined) mat.emissiveIntensity = opts.emissiveIntensity;
      if (opts.wireframe) mat.wireframe = true;
    }
    return new THREE.Mesh(geo, mat);
  }

  function _cyl(rt, rb, h, segs, color, opts) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) { mat.transparent = true; mat.opacity = opts.opacity; }
      if (opts.emissive)  mat.emissive = new THREE.Color(opts.emissive);
      if (opts.emissiveIntensity !== undefined) mat.emissiveIntensity = opts.emissiveIntensity;
    }
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, segs, color, opts) {
    var geo = new THREE.SphereGeometry(r, segs || 8, segs || 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) { mat.transparent = true; mat.opacity = opts.opacity; }
      if (opts.emissive) mat.emissive = new THREE.Color(opts.emissive);
    }
    return new THREE.Mesh(geo, mat);
  }

  function _cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _addMesh(m) {
    _scene.add(m);
    _sceneMeshes.push(m);
    return m;
  }

  function _addLight(l) {
    _scene.add(l);
    _sceneLights.push(l);
    return l;
  }

  function _lineSegs(positions, color) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    var ls  = new THREE.LineSegments(geo, mat);
    _scene.add(ls);
    _sceneMeshes.push(ls);
    return ls;
  }

  function _showMsg(txt, dur) {
    _msgText  = txt;
    _msgTimer = dur || 3;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENVIRONMENT CONSTRUCTION
  ═══════════════════════════════════════════════════════════════════════════*/

  function _buildCity() {
    _buildLighting();
    _buildGround();
    _buildStreets();
    _buildApartmentBlocks();
    _buildFerrisWheel();
    _buildSovietFactory();
    _buildMetroStation();
    _buildSyndicateHQ();
    _buildRadiationZones();
    _buildVegetation();
    _buildAbandonedCars();
    _buildRubble();
  }

  /* ─── Lighting ─────────────────────────────────────────────────────────*/
  function _buildLighting() {
    var ambient = new THREE.AmbientLight(0x334433, 0.35);
    _addLight(ambient);

    var sun = new THREE.DirectionalLight(0x998866, 0.6);
    sun.position.set(30, 80, 20);
    _addLight(sun);

    /* Eerie green haze over the zone */
    var haze = new THREE.PointLight(0x224422, 0.4, 200);
    haze.position.set(0, 30, 0);
    _addLight(haze);
  }

  /* ─── Ground ───────────────────────────────────────────────────────────*/
  function _buildGround() {
    var g = _box(300, 0.5, 300, 0x334422);
    g.position.set(0, -0.25, 0);
    _addMesh(g);
  }

  /* ─── Cracked roads ────────────────────────────────────────────────────*/
  function _buildStreets() {
    var i;
    /* Main north-south boulevard */
    var road1 = _box(14, 0.15, 200, 0x222222);
    road1.position.set(0, 0.08, 0);
    _addMesh(road1);

    /* Crack patches — thin dark boxes */
    for (i = 0; i < 20; i++) {
      var crack = _box(_rnd(1, 5), 0.02, _rnd(0.2, 0.8), 0x111111);
      crack.position.set(_rnd(-6, 6), 0.17, _rnd(-90, 90));
      crack.rotation.y = _rnd(0, Math.PI);
      _addMesh(crack);
    }

    /* East-west cross street */
    var road2 = _box(200, 0.15, 12, 0x222222);
    road2.position.set(0, 0.08, -20);
    _addMesh(road2);

    /* Pavement strips */
    for (i = -4; i <= 4; i += 8) {
      var pave = _box(3, 0.2, 200, 0x333333);
      pave.position.set(i * 2, 0.1, 0);
      _addMesh(pave);
    }
  }

  /* ─── Apartment blocks ─────────────────────────────────────────────────*/
  function _buildApartmentBlocks() {
    var i;
    /* Block A — mostly intact, 5 floors */
    _buildApartment(-35, 0, -30, 18, 16, 14, true);

    /* Block B — heavily damaged, 3 floors remaining */
    _buildApartment(28, 0, -25, 16, 10, 12, false);

    /* Block C — with rubble ramp for upper floor access */
    _buildApartment(-30, 0, 30, 20, 14, 16, true);

    /* Block D — collapsed east wing */
    _buildApartment(35, 0, 25, 22, 8, 14, false);

    /* Balcony rails on block A */
    for (i = 0; i < 4; i++) {
      var rail = _box(18, 0.2, 0.2, 0x445544);
      rail.position.set(-35, 3 + i * 4, -23.1);
      _addMesh(rail);
    }

    /* Window openings (dark insets) */
    var wpos = [
      { x: -42, y: 8, z: -30 }, { x: -38, y: 8, z: -30 },
      { x: -34, y: 8, z: -30 }, { x: -30, y: 8, z: -30 },
      { x: -42, y: 4, z: -30 }, { x: -38, y: 4, z: -30 },
      { x: -34, y: 12, z: -30}, { x: -30, y: 12, z: -30 }
    ];
    for (i = 0; i < wpos.length; i++) {
      var win = _box(2.5, 2, 0.3, 0x111a11);
      win.position.set(wpos[i].x, wpos[i].y, wpos[i].z);
      _addMesh(win);
    }
  }

  function _buildApartment(x, y, z, w, h, d, intact) {
    var mainColor = 0x8a8a7a;
    var walls = _box(w, h, d, mainColor);
    walls.position.set(x, y + h / 2, z);
    _addMesh(walls);

    /* Roof slab */
    var roof = _box(w + 0.4, 0.6, d + 0.4, 0x777766);
    roof.position.set(x, y + h + 0.3, z);
    _addMesh(roof);

    if (!intact) {
      /* Broken corner — remove a chunk visually with dark box */
      var chunk = _box(w * 0.35, h * 0.5, d * 0.4, 0x223322);
      chunk.position.set(x + w * 0.35, y + h * 0.75, z + d * 0.3);
      _addMesh(chunk);

      /* Exposed rebar — LineSegments */
      var rebar = [];
      var rx, rz;
      for (rx = -1; rx <= 1; rx++) {
        rebar.push(x + w * 0.35 + rx * 0.4, y + h * 0.5,       z + d * 0.3);
        rebar.push(x + w * 0.35 + rx * 0.4, y + h * 0.5 + 3.5, z + d * 0.3);
      }
      for (rz = -1; rz <= 1; rz++) {
        rebar.push(x + w * 0.35, y + h * 0.55, z + d * 0.3 + rz * 0.4);
        rebar.push(x + w * 0.35 + 2.5, y + h * 0.55, z + d * 0.3 + rz * 0.4);
      }
      _lineSegs(rebar, 0x886644);
    }
  }

  /* ─── Ferris Wheel ─────────────────────────────────────────────────────*/
  function _buildFerrisWheel() {
    var FX = 60, FY = 0, FZ = -50;
    var RADIUS = 18;
    var i, angle, gx, gy;

    /* Support legs */
    var legL = _box(1.2, 28, 1.2, 0x554433);
    legL.position.set(FX - 5, 14, FZ);
    _addMesh(legL);
    var legR = _box(1.2, 28, 1.2, 0x554433);
    legR.position.set(FX + 5, 14, FZ);
    _addMesh(legR);

    /* Cross brace */
    var brace = _box(12, 1, 1.2, 0x554433);
    brace.position.set(FX, 12, FZ);
    _addMesh(brace);

    /* Central hub — CylinderGeometry */
    var hub = _cyl(1.5, 1.5, 1.8, 12, 0x776655);
    hub.position.set(FX, 28, FZ);
    hub.rotation.z = Math.PI / 2;
    _addMesh(hub);
    _ferrisHub = hub;

    /* Spokes — LineSegments (12 spokes) */
    var spokePositions = [];
    for (i = 0; i < 12; i++) {
      angle = (i / 12) * Math.PI * 2;
      gx = Math.cos(angle) * RADIUS;
      gy = Math.sin(angle) * RADIUS;
      spokePositions.push(FX, 28, FZ);
      spokePositions.push(FX + gx, 28 + gy, FZ);
    }
    var spokeLine = _lineSegs(spokePositions, 0x665544);
    _ferrisSpokes = spokeLine;

    /* Rim ring — LineSegments approximation */
    var rimPositions = [];
    for (i = 0; i < 12; i++) {
      var a1 = (i / 12) * Math.PI * 2;
      var a2 = ((i + 1) / 12) * Math.PI * 2;
      rimPositions.push(
        FX + Math.cos(a1) * RADIUS, 28 + Math.sin(a1) * RADIUS, FZ,
        FX + Math.cos(a2) * RADIUS, 28 + Math.sin(a2) * RADIUS, FZ
      );
    }
    _lineSegs(rimPositions, 0x665544);

    /* Gondolas — BoxGeometry, 6 gondolas on the wheel */
    _gondolas = [];
    for (i = 0; i < 6; i++) {
      angle = (i / 6) * Math.PI * 2;
      gx = Math.cos(angle) * RADIUS;
      gy = Math.sin(angle) * RADIUS;

      var gondola = _box(2.2, 1.4, 1.2, 0x665533);
      gondola.position.set(FX + gx, 28 + gy, FZ);
      _addMesh(gondola);

      /* Gondola hanger */
      var hanger = _box(0.15, 1.2, 0.15, 0x554433);
      hanger.position.set(FX + gx, 28 + gy + 1.3, FZ);
      _addMesh(hanger);

      _gondolas.push({
        gondolaMesh:  gondola,
        hangerMesh:   hanger,
        baseAngle:    angle,
        cx: FX, cy: 28, cz: FZ,
        radius: RADIUS
      });
    }

    /* Ferris wheel light */
    var fLight = new THREE.PointLight(0x886644, 0.5, 60);
    fLight.position.set(FX, 35, FZ);
    _addLight(fLight);
  }

  /* ─── Soviet Factory ────────────────────────────────────────────────────*/
  function _buildSovietFactory() {
    var i;
    var FX = -60, FY = 0, FZ = -60;

    /* Main building — large BoxGeometry */
    var main = _box(40, 20, 30, 0x776655);
    main.position.set(FX, 10, FZ);
    _addMesh(main);

    /* Second wing */
    var wing = _box(20, 14, 24, 0x665544);
    wing.position.set(FX - 28, 7, FZ + 3);
    _addMesh(wing);

    /* Roof */
    var roof = _box(40.4, 0.8, 30.4, 0x665544);
    roof.position.set(FX, 20.4, FZ);
    _addMesh(roof);

    /* Helipad — extraction point on factory roof */
    var helipad = _box(8, 0.3, 8, 0x333333);
    helipad.position.set(FX, 21, FZ);
    _addMesh(helipad);

    /* H marking on helipad */
    var hV = _box(0.6, 0.12, 4, 0xffffff);
    hV.position.set(FX - 1.5, 21.18, FZ);
    _addMesh(hV);
    var hV2 = _box(0.6, 0.12, 4, 0xffffff);
    hV2.position.set(FX + 1.5, 21.18, FZ);
    _addMesh(hV2);
    var hH = _box(3.6, 0.12, 0.6, 0xffffff);
    hH.position.set(FX, 21.18, FZ);
    _addMesh(hH);

    /* Extraction helicopter (simplified) */
    var heliBody = _box(6, 1.8, 2.4, 0x445544);
    heliBody.position.set(FX, 23.2, FZ);
    _addMesh(heliBody);

    var heliTail = _box(4, 0.7, 0.8, 0x334433);
    heliTail.position.set(FX + 5.5, 23.5, FZ);
    _addMesh(heliTail);

    var rotorH = _box(8, 0.12, 0.3, 0x223322);
    rotorH.position.set(FX, 24.3, FZ);
    _addMesh(rotorH);

    var rotorV = _box(0.3, 0.12, 8, 0x223322);
    rotorV.position.set(FX, 24.3, FZ);
    _addMesh(rotorV);

    /* Smokestacks — CylinderGeometry */
    for (i = 0; i < 3; i++) {
      var stack = _cyl(1.2, 1.5, 22, 8, 0x554433);
      stack.position.set(FX - 10 + i * 10, 22, FZ - 12);
      _addMesh(stack);

      /* Rust streaks */
      var rust = _cyl(0.2, 0.2, 18, 6, 0x885533, { opacity: 0.7 });
      rust.position.set(FX - 10 + i * 10 + 0.6, 20, FZ - 12);
      _addMesh(rust);

      /* Black smoke sphere cluster */
      var smoke1 = _sphere(1.8, 6, 0x222222, { opacity: 0.4 });
      smoke1.position.set(FX - 10 + i * 10, 35, FZ - 12);
      _addMesh(smoke1);
      var smoke2 = _sphere(2.2, 6, 0x333333, { opacity: 0.3 });
      smoke2.position.set(FX - 10 + i * 10 + 1.2, 37, FZ - 12);
      _addMesh(smoke2);
    }

    /* Factory windows (dark boxes) */
    for (i = 0; i < 5; i++) {
      var fw = _box(2.5, 3, 0.3, 0x1a2211);
      fw.position.set(FX - 16 + i * 8, 12, FZ - 15.2);
      _addMesh(fw);
    }

    /* Factory access ladder LineSegments */
    var ladderPos = [];
    var j;
    for (j = 0; j <= 10; j++) {
      ladderPos.push(FX + 20.6, j * 2, FZ - 8);
      ladderPos.push(FX + 21.0, j * 2, FZ - 8);
    }
    for (j = 1; j <= 9; j++) {
      ladderPos.push(FX + 20.5, j * 2 + 0.3, FZ - 8);
      ladderPos.push(FX + 21.1, j * 2 + 0.3, FZ - 8);
    }
    _lineSegs(ladderPos, 0x887755);

    /* Factory light */
    var fLight = new THREE.PointLight(0x665533, 0.6, 80);
    fLight.position.set(FX, 25, FZ);
    _addLight(fLight);

    /* Extraction beacon */
    var beacon = new THREE.PointLight(0x00ff88, 1.2, 20);
    beacon.position.set(FX, 26, FZ);
    _addLight(beacon);
  }

  /* ─── Metro Station ─────────────────────────────────────────────────────*/
  function _buildMetroStation() {
    var MX = 20, MY = 0, MZ = 30;

    /* Surface entrance building */
    var entrance = _box(14, 5, 10, 0x776677);
    entrance.position.set(MX, 2.5, MZ);
    _addMesh(entrance);

    var eRoof = _box(14.4, 0.5, 10.4, 0x665566);
    eRoof.position.set(MX, 5.25, MZ);
    _addMesh(eRoof);

    /* Metro sign (box on front) */
    var sign = _box(8, 1.5, 0.3, 0x001188);
    sign.position.set(MX, 4.5, MZ - 5.15);
    _addMesh(sign);

    /* M emblem on sign */
    var mEmb = _box(1.2, 1.0, 0.2, 0xdddddd);
    mEmb.position.set(MX, 4.5, MZ - 5.32);
    _addMesh(mEmb);

    /* Stairwell going down */
    var stair = _box(4, 0.3, 6, 0x555566);
    stair.position.set(MX, 0.15, MZ - 1);
    stair.rotation.x = 0.25;
    _addMesh(stair);

    /* Underground platform — extends downward */
    var platform = _box(20, 0.5, 8, 0x445566);
    platform.position.set(MX, -6, MZ);
    _addMesh(platform);

    /* Platform columns — CylinderGeometry */
    var i;
    for (i = -3; i <= 3; i += 3) {
      var col = _cyl(0.4, 0.4, 6, 8, 0x667788);
      col.position.set(MX + i * 2, -3.5, MZ + 3);
      _addMesh(col);
      var col2 = _cyl(0.4, 0.4, 6, 8, 0x667788);
      col2.position.set(MX + i * 2, -3.5, MZ - 3);
      _addMesh(col2);
    }

    /* Tunnel portals — CylinderGeometry half-arches */
    var tunnelPortalL = _cyl(3.5, 3.5, 1.2, 8, 0x334455);
    tunnelPortalL.position.set(MX - 10, -5.5, MZ);
    tunnelPortalL.rotation.z = Math.PI / 2;
    _addMesh(tunnelPortalL);

    var tunnelPortalR = _cyl(3.5, 3.5, 1.2, 8, 0x334455);
    tunnelPortalR.position.set(MX + 10, -5.5, MZ);
    tunnelPortalR.rotation.z = Math.PI / 2;
    _addMesh(tunnelPortalR);

    /* Tunnel tubes */
    var tunnelL = _cyl(3, 3, 20, 8, 0x223344, { opacity: 0.9 });
    tunnelL.position.set(MX - 20, -5.5, MZ);
    tunnelL.rotation.z = Math.PI / 2;
    _addMesh(tunnelL);

    var tunnelR = _cyl(3, 3, 20, 8, 0x223344, { opacity: 0.9 });
    tunnelR.position.set(MX + 20, -5.5, MZ);
    tunnelR.rotation.z = Math.PI / 2;
    _addMesh(tunnelR);

    /* Abandoned train cars */
    var trainA = _box(12, 3.5, 4, 0x334455);
    trainA.position.set(MX - 16, -4.5, MZ);
    _addMesh(trainA);
    var trainB = _box(12, 3.5, 4, 0x334455);
    trainB.position.set(MX + 16, -4.5, MZ);
    _addMesh(trainB);

    /* Platform lights */
    for (i = -6; i <= 6; i += 6) {
      var pl = new THREE.PointLight(0x4488cc, 0.8, 16);
      pl.position.set(MX + i, -2, MZ);
      _addLight(pl);
    }

    /* Metro entrance saved for interaction check */
    _radZones.push({}); /* placeholder index 0 reserved */
  }

  /* ─── Syndicate HQ (repurposed school) ─────────────────────────────────*/
  function _buildSyndicateHQ() {
    var HX = 0, HY = 0, HZ = -70;

    /* Main school building */
    var main = _box(34, 12, 20, 0x887766);
    main.position.set(HX, 6, HZ);
    _addMesh(main);

    /* Side wing */
    var wing = _box(12, 10, 14, 0x776655);
    wing.position.set(HX + 23, 5, HZ - 3);
    _addMesh(wing);

    /* Roof */
    var roof = _box(34.4, 0.6, 20.4, 0x665544);
    roof.position.set(HX, 12.3, HZ);
    _addMesh(roof);

    /* Syndicate flag on roof */
    var flagPole = _cyl(0.12, 0.12, 4, 6, 0x886644);
    flagPole.position.set(HX - 14, 14.3, HZ - 9);
    _addMesh(flagPole);
    var flag = _box(2.8, 1.5, 0.12, 0x880000);
    flag.position.set(HX - 12.5, 15.5, HZ - 9);
    _addMesh(flag);

    /* Sandbag fortifications — stacked BoxGeometry cubes */
    var i, sx, sz;
    var sandbagPositions = [
      { x: HX - 18, z: HZ - 11 }, { x: HX - 12, z: HZ - 11 },
      { x: HX - 6,  z: HZ - 11 }, { x: HX,      z: HZ - 11 },
      { x: HX + 6,  z: HZ - 11 }, { x: HX + 12, z: HZ - 11 },
      { x: HX + 18, z: HZ - 11 }, { x: HX - 18, z: HZ - 8  },
      { x: HX + 18, z: HZ - 8  }
    ];
    for (i = 0; i < sandbagPositions.length; i++) {
      sx = sandbagPositions[i].x;
      sz = sandbagPositions[i].z;
      var bag1 = _box(3.2, 0.7, 1.2, 0x886644);
      bag1.position.set(sx, 0.35, sz);
      _addMesh(bag1);
      var bag2 = _box(3.2, 0.7, 1.2, 0x997755);
      bag2.position.set(sx + 0.15, 1.05, sz - 0.1);
      _addMesh(bag2);
    }

    /* Guard tower */
    var tower = _box(4, 8, 4, 0x776655);
    tower.position.set(HX - 20, 4, HZ);
    _addMesh(tower);
    var towerTop = _box(5, 1, 5, 0x665544);
    towerTop.position.set(HX - 20, 8.5, HZ);
    _addMesh(towerTop);

    /* Barbed wire — LineSegments */
    var wirePos = [];
    for (i = -18; i <= 18; i += 4) {
      wirePos.push(HX + i, 1.8, HZ - 11.5);
      wirePos.push(HX + i + 3, 2.1, HZ - 11.5);
    }
    _lineSegs(wirePos, 0x555555);

    /* HQ interior light */
    var hl = new THREE.PointLight(0x886644, 0.7, 50);
    hl.position.set(HX, 8, HZ);
    _addLight(hl);

    /* Spotlight on HQ entrance */
    var spot = new THREE.PointLight(0xddcc88, 1.0, 25);
    spot.position.set(HX, 14, HZ - 12);
    _addLight(spot);
  }

  /* ─── Radiation Zones ──────────────────────────────────────────────────*/
  function _buildRadiationZones() {
    /* Remove the placeholder pushed earlier */
    _radZones = [];

    var zones = [
      { x: 45,  z: 10,  r: 14 },
      { x: -20, z: -55, r: 12 },
      { x: 10,  z: 50,  r: 16 }
    ];
    var i, z;
    for (i = 0; i < zones.length; i++) {
      z = zones[i];

      /* Yellow warning sign */
      var postA = _cyl(0.08, 0.08, 2, 6, 0x998800);
      postA.position.set(z.x, 1, z.z);
      _addMesh(postA);
      var signBoard = _box(1.2, 1.0, 0.1, 0xffdd00);
      signBoard.position.set(z.x, 2.3, z.z);
      _addMesh(signBoard);
      /* Radiation symbol approximation */
      var sym = _sphere(0.25, 6, 0x222200);
      sym.position.set(z.x, 2.3, z.z - 0.1);
      _addMesh(sym);

      /* Second and third warning signs around zone */
      var postB = _cyl(0.08, 0.08, 2, 6, 0x998800);
      postB.position.set(z.x + z.r * 0.7, 1, z.z + z.r * 0.7);
      _addMesh(postB);
      var signB = _box(1.2, 1.0, 0.1, 0xffdd00);
      signB.position.set(z.x + z.r * 0.7, 2.3, z.z + z.r * 0.7);
      _addMesh(signB);

      var postC = _cyl(0.08, 0.08, 2, 6, 0x998800);
      postC.position.set(z.x - z.r * 0.7, 1, z.z - z.r * 0.7);
      _addMesh(postC);
      var signC = _box(1.2, 1.0, 0.1, 0xffdd00);
      signC.position.set(z.x - z.r * 0.7, 2.3, z.z - z.r * 0.7);
      _addMesh(signC);

      /* Tainted ground */
      var ground = _box(z.r * 2, 0.1, z.r * 2, 0x334400, { opacity: 0.7 });
      ground.position.set(z.x, 0.06, z.z);
      _addMesh(ground);

      /* Radiation glow */
      var radLight = new THREE.PointLight(0xaacc00, 0.6, z.r * 2.5);
      radLight.position.set(z.x, 2, z.z);
      _addLight(radLight);

      _radZones.push({ pos: { x: z.x, z: z.z }, radius: z.r });
    }
  }

  /* ─── Overgrown Vegetation ─────────────────────────────────────────────*/
  function _buildVegetation() {
    var i, x, z;
    /* Weed clusters along streets */
    var weedSpots = [
      { x: 8,   z: 10 }, { x: -9, z: 5  }, { x: 6,   z: -15 },
      { x: -6,  z: 20 }, { x: 11, z: 30 }, { x: -12, z: -5  },
      { x: 4,   z: -30}, { x: -4, z: 35 }, { x: 7,   z: 45 },
      { x: -8,  z: 40 }, { x: 15, z: 15 }, { x: -15, z: 25 }
    ];
    for (i = 0; i < weedSpots.length; i++) {
      x = weedSpots[i].x;
      z = weedSpots[i].z;

      /* Thin CylinderGeometry stems */
      var stem1 = _cyl(0.04, 0.06, _rnd(0.6, 1.2), 5, 0x225522);
      stem1.position.set(x + _rnd(-0.3, 0.3), stem1.geometry.parameters.height / 2, z + _rnd(-0.3, 0.3));
      _addMesh(stem1);
      var stem2 = _cyl(0.04, 0.05, _rnd(0.5, 1.0), 5, 0x336633);
      stem2.position.set(x + _rnd(-0.4, 0.4), stem2.geometry.parameters.height / 2, z + _rnd(-0.4, 0.4));
      stem2.rotation.z = _rnd(-0.3, 0.3);
      _addMesh(stem2);
      var stem3 = _cyl(0.03, 0.05, _rnd(0.4, 0.9), 5, 0x224422);
      stem3.position.set(x + _rnd(-0.5, 0.5), stem3.geometry.parameters.height / 2, z + _rnd(-0.5, 0.5));
      _addMesh(stem3);

      /* SphereGeometry foliage cluster */
      var leaf1 = _sphere(_rnd(0.3, 0.55), 6, 0x336633, { opacity: 0.9 });
      leaf1.position.set(x + _rnd(-0.3, 0.3), _rnd(0.9, 1.4), z + _rnd(-0.3, 0.3));
      _addMesh(leaf1);
      var leaf2 = _sphere(_rnd(0.2, 0.4), 6, 0x447744, { opacity: 0.85 });
      leaf2.position.set(x + _rnd(-0.5, 0.5), _rnd(0.7, 1.2), z + _rnd(-0.5, 0.5));
      _addMesh(leaf2);
    }

    /* Trees at periphery */
    var treeSpots = [
      { x: 25, z: 55 }, { x: -25, z: 50 }, { x: 50, z: 0 },
      { x: -50, z: 5 }, { x: 30, z: -55 }, { x: -30, z: -50 }
    ];
    for (i = 0; i < treeSpots.length; i++) {
      x = treeSpots[i].x;
      z = treeSpots[i].z;
      var trunk = _cyl(0.35, 0.5, 5, 7, 0x553322);
      trunk.position.set(x, 2.5, z);
      _addMesh(trunk);
      var canopy1 = _sphere(3.5, 7, 0x335533, { opacity: 0.9 });
      canopy1.position.set(x, 7, z);
      _addMesh(canopy1);
      var canopy2 = _sphere(2.5, 7, 0x446644, { opacity: 0.85 });
      canopy2.position.set(x + _rnd(-1, 1), 9, z + _rnd(-1, 1));
      _addMesh(canopy2);
    }
  }

  /* ─── Abandoned Cars ────────────────────────────────────────────────────*/
  function _buildAbandonedCars() {
    var carData = [
      { x: 5,   z: -5,  rot: 0     },
      { x: -5,  z: 15,  rot: 0.15  },
      { x: 7,   z: 40,  rot: -0.1  },
      { x: -7,  z: -35, rot: 0.2   },
      { x: 8,   z: 55,  rot: 0.05  },
      { x: -8,  z: -10, rot: -0.3  }
    ];
    var i, d;
    for (i = 0; i < carData.length; i++) {
      d = carData[i];
      _buildCar(d.x, d.z, d.rot);
    }
  }

  function _buildCar(x, z, rotY) {
    /* Body */
    var body = _box(4.5, 1.4, 2.0, 0x445544);
    body.position.set(x, 0.7, z);
    body.rotation.y = rotY;
    _addMesh(body);

    /* Roof cabin */
    var cabin = _box(2.8, 1.0, 1.9, 0x334433);
    cabin.position.set(x - 0.3, 1.9, z);
    cabin.rotation.y = rotY;
    _addMesh(cabin);

    /* Wheels — CylinderGeometry */
    var offsets = [
      { dx: -1.3, dz:  0.9 }, { dx:  1.3, dz:  0.9 },
      { dx: -1.3, dz: -0.9 }, { dx:  1.3, dz: -0.9 }
    ];
    var j, o, wx, wz;
    for (j = 0; j < 4; j++) {
      o = offsets[j];
      wx = x + Math.cos(rotY) * o.dx - Math.sin(rotY) * o.dz;
      wz = z + Math.sin(rotY) * o.dx + Math.cos(rotY) * o.dz;
      var wheel = _cyl(0.38, 0.38, 0.25, 8, 0x222222);
      wheel.position.set(wx, 0.38, wz);
      wheel.rotation.z = Math.PI / 2;
      _addMesh(wheel);
    }

    /* Broken windshield — dark tinted box */
    var ws = _box(2.5, 0.9, 0.12, 0x1a2222, { opacity: 0.6 });
    ws.position.set(x + 0.8, 1.9, z - 0.95);
    ws.rotation.y = rotY;
    _addMesh(ws);
  }

  /* ─── Rubble piles ──────────────────────────────────────────────────────*/
  function _buildRubble() {
    var rubbleSpots = [
      { x: -30, z: 30, scale: 1.2 },
      { x: 35,  z: 25, scale: 1.0 },
      { x: -35, z: -30, scale: 0.9 },
      { x: 28,  z: -25, scale: 1.1 }
    ];
    var i, r, j;
    for (i = 0; i < rubbleSpots.length; i++) {
      r = rubbleSpots[i];
      /* Random rubble chunks */
      for (j = 0; j < 10; j++) {
        var chunk = _box(
          _rnd(0.4, 2.0) * r.scale,
          _rnd(0.2, 1.0) * r.scale,
          _rnd(0.4, 1.8) * r.scale,
          0x887766
        );
        chunk.position.set(
          r.x + _rnd(-4, 4),
          _rnd(0, 0.6),
          r.z + _rnd(-4, 4)
        );
        chunk.rotation.set(_rnd(-0.3, 0.3), _rnd(0, Math.PI), _rnd(-0.3, 0.3));
        _addMesh(chunk);
      }

      /* Accessible rubble ramp for two buildings */
      if (i < 2) {
        var ramp = _box(3, 0.4, 6, 0x998877);
        ramp.position.set(r.x + 2, 1.5, r.z - 5);
        ramp.rotation.x = -0.35;
        _addMesh(ramp);
        var ramp2 = _box(3, 0.4, 6, 0x887766);
        ramp2.position.set(r.x + 2, 3.5, r.z - 8);
        ramp2.rotation.x = -0.35;
        _addMesh(ramp2);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY SPAWNING
  ═══════════════════════════════════════════════════════════════════════════*/

  function _spawnAllEnemies() {
    _spawnSoldiers();
    _spawnSnipers();
    _spawnPhantom();
  }

  /* ─── Soldiers (14) ─────────────────────────────────────────────────────*/
  function _spawnSoldiers() {
    var soldierPositions = [
      /* Street patrols */
      { x: 0,    z: 10,  px: [0, 0],      pz: [10, 35]   },
      { x: 5,    z: -10, px: [5, 5],       pz: [-10, -40] },
      { x: -5,   z: 20,  px: [-5, -5],     pz: [20, 50]   },
      { x: 3,    z: -20, px: [3, 3],       pz: [-20, -55] },
      /* Near apartment blocks */
      { x: -32,  z: -30, px: [-32, -38],   pz: [-30, -15] },
      { x: 28,   z: -20, px: [28, 22],     pz: [-20, -10] },
      { x: -28,  z: 32,  px: [-28, -22],   pz: [32, 20]   },
      { x: 35,   z: 28,  px: [35, 28],     pz: [28, 15]   },
      /* Near HQ */
      { x: -8,   z: -60, px: [-8, 8],      pz: [-60, -60] },
      { x: 8,    z: -58, px: [8, -8],      pz: [-58, -58] },
      { x: 15,   z: -65, px: [15, 15],     pz: [-65, -55] },
      { x: -15,  z: -65, px: [-15, -15],   pz: [-65, -55] },
      /* Near factory */
      { x: -55,  z: -55, px: [-55, -65],   pz: [-55, -65] },
      { x: -65,  z: -50, px: [-65, -55],   pz: [-50, -60] }
    ];
    var i, d;
    for (i = 0; i < 14 && i < soldierPositions.length; i++) {
      d = soldierPositions[i];
      _createSoldier(d.x, d.z, d.px, d.pz);
    }
  }

  function _createSoldier(x, z, px, pz) {
    /* Body */
    var body = _box(0.7, 1.7, 0.5, 0x445533);
    body.position.set(x, 0.85, z);
    _scene.add(body);
    _sceneMeshes.push(body);

    /* Helmet */
    var helm = _sphere(0.28, 7, 0x334422);
    helm.position.set(x, 1.85, z);
    _scene.add(helm);
    _sceneMeshes.push(helm);

    /* Rifle */
    var rifle = _box(1.0, 0.12, 0.12, 0x222211);
    rifle.position.set(x + 0.55, 1.1, z);
    _scene.add(rifle);
    _sceneMeshes.push(rifle);

    _soldiers.push({
      bodyMesh:    body,
      helmMesh:    helm,
      rifleMesh:   rifle,
      pos:         { x: x, y: 0.85, z: z },
      hp:          80,
      alive:       true,
      patrolPts:   [ { x: px[0], z: pz[0] }, { x: px[1], z: pz[1] } ],
      patrolIdx:   0,
      patrolSpeed: 3.0,
      shootTimer:  _rnd(2, 5),
      alertTimer:  0
    });
  }

  /* ─── Snipers (6) ───────────────────────────────────────────────────────*/
  function _spawnSnipers() {
    /* 4 in buildings, 2 on ferris wheel gondolas */
    var sniperData = [
      { x: -38, y: 14, z: -30, gondola: -1 },  /* Apt block A roof */
      { x: 28,  y: 8,  z: -25, gondola: -1 },  /* Apt block B upper */
      { x: -28, y: 12, z: 32,  gondola: -1 },  /* Apt block C */
      { x: 0,   y: 12, z: -70, gondola: -1 },  /* HQ roof */
      { x: 60,  y: 28, z: -50, gondola: 1 },   /* Ferris gondola 1 */
      { x: 60,  y: 28, z: -50, gondola: 3 }    /* Ferris gondola 3 */
    ];
    var i, d;
    for (i = 0; i < 6 && i < sniperData.length; i++) {
      d = sniperData[i];
      _createSniper(d.x, d.y, d.z, d.gondola);
    }
  }

  function _createSniper(x, y, z, gondolaIdx) {
    var body = _box(0.65, 1.6, 0.48, 0x334422);
    body.position.set(x, y, z);
    _scene.add(body);
    _sceneMeshes.push(body);

    var helm = _sphere(0.26, 7, 0x223311);
    helm.position.set(x, y + 0.9, z);
    _scene.add(helm);
    _sceneMeshes.push(helm);

    /* Long sniper rifle */
    var snRifle = _box(1.5, 0.1, 0.1, 0x111100);
    snRifle.position.set(x + 0.85, y + 0.1, z);
    _scene.add(snRifle);
    _sceneMeshes.push(snRifle);

    var sniper = {
      bodyMesh:   body,
      helmMesh:   helm,
      rifleMesh:  snRifle,
      pos:        { x: x, y: y, z: z },
      hp:         95,
      alive:      true,
      shootTimer: _rnd(4, 8),
      gondolaIdx: gondolaIdx  /* -1 = static, else gondola index */
    };
    _snipers.push(sniper);
  }

  /* ─── The Phantom (Boss) ────────────────────────────────────────────────*/
  function _spawnPhantom() {
    var PX = 0, PY = 0, PZ = -65;

    /* Phantom body — dark camouflage */
    var body = _box(0.9, 2.1, 0.65, 0x223311);
    body.position.set(PX, 1.05, PZ);
    _scene.add(body);
    _sceneMeshes.push(body);

    /* Head */
    var head = _sphere(0.3, 8, 0x1a2211);
    head.position.set(PX, 2.25, PZ);
    _scene.add(head);
    _sceneMeshes.push(head);

    /* Balaclava */
    var bala = _box(0.4, 0.35, 0.42, 0x111100);
    bala.position.set(PX, 2.25, PZ);
    _scene.add(bala);
    _sceneMeshes.push(bala);

    /* Dual SMGs */
    var smgL = _box(0.65, 0.1, 0.12, 0x111111);
    smgL.position.set(PX - 0.6, 1.1, PZ - 0.4);
    _scene.add(smgL);
    _sceneMeshes.push(smgL);

    var smgR = _box(0.65, 0.1, 0.12, 0x111111);
    smgR.position.set(PX + 0.6, 1.1, PZ - 0.4);
    _scene.add(smgR);
    _sceneMeshes.push(smgR);

    /* Phantom glow indicator */
    var pGlow = new THREE.PointLight(0x223311, 0.8, 8);
    pGlow.position.set(PX, 2.5, PZ);
    _scene.add(pGlow);
    _sceneLights.push(pGlow);

    _phantom = {
      bodyMesh:  body,
      headMesh:  head,
      balaMesh:  bala,
      smgL:      smgL,
      smgR:      smgR,
      glow:      pGlow,
      pos:       { x: PX, y: 1.05, z: PZ },
      hp:        510,
      maxHp:     510,
      alive:     true,
      shootTimer: 0.8,
      moveTimer:  3.0,
      moveTarget: { x: PX, z: PZ }
    };

    _phantomCamoTimer  = 20;
    _phantomCamoActive = false;
    _phantomCamoDur    = 0;
    _phantomFlashTimer = 0;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION / INIT / RESET
  ═══════════════════════════════════════════════════════════════════════════*/

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');
    _registerInputs();
    _buildHUD();
  }

  function reset() {
    _teardown();
  }

  function _activate() {
    if (_active) { _teardown(); }

    _active      = true;
    _victory     = false;
    _defeat      = false;
    _msgTimer    = 0;
    _gameTime    = 0;

    _playerPos   = { x: 0, y: 1.8, z: 60 };
    _playerHP    = 100;
    _yaw         = Math.PI;
    _pitch       = 0;
    _ammo        = _maxAmmo;
    _shootCooldown = 0;

    _inMetro     = false;
    _metroTimer  = 0;
    _radWarning  = false;

    _soldiers    = [];
    _snipers     = [];
    _phantom     = null;
    _bullets     = [];
    _enemyShots  = [];
    _ferrisAngle = 0;
    _gondolas    = [];
    _ferrisHub   = null;
    _ferrisSpokes = null;
    _radZones    = [];
    _sceneMeshes = [];
    _sceneLights = [];

    _buildCity();
    _spawnAllEnemies();

    _showMsg('ABANDONED CITY — Eliminate The Phantom syndicate boss and reach the extraction helicopter!', 6);
    _updateHUD();
  }

  function _teardown() {
    if (!_active) return;
    _active = false;

    var i;
    for (i = 0; i < _sceneMeshes.length; i++) _scene.remove(_sceneMeshes[i]);
    for (i = 0; i < _sceneLights.length; i++) _scene.remove(_sceneLights[i]);
    for (i = 0; i < _bullets.length; i++) _scene.remove(_bullets[i].mesh);
    for (i = 0; i < _enemyShots.length; i++) _scene.remove(_enemyShots[i].mesh);

    _soldiers    = [];
    _snipers     = [];
    _phantom     = null;
    _bullets     = [];
    _enemyShots  = [];
    _radZones    = [];
    _sceneMeshes = [];
    _sceneLights = [];
    _gondolas    = [];
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════*/

  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ac-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'top:12px', 'left:12px',
      'color:#aaff88', 'font:bold 13px monospace',
      'text-shadow:1px 1px 3px #000',
      'pointer-events:none', 'z-index:999',
      'display:none', 'line-height:1.6'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';

    var snipersLeft = 0;
    var i;
    for (i = 0; i < _snipers.length; i++) { if (_snipers[i].alive) snipersLeft++; }

    var soldiersLeft = 0;
    for (i = 0; i < _soldiers.length; i++) { if (_soldiers[i].alive) soldiersLeft++; }

    var phantomStatus = 'NOT YET ENCOUNTERED';
    var phantomBar    = '';
    if (_phantom) {
      if (!_phantom.alive) {
        phantomStatus = 'ELIMINATED';
      } else if (_phantomCamoActive) {
        phantomStatus = 'CAMOUFLAGED — listen for gunfire!';
      } else {
        phantomStatus = 'VISIBLE  HP:' + Math.ceil(_phantom.hp) + '/' + _phantom.maxHp;
        var pct = Math.max(0, _phantom.hp / _phantom.maxHp);
        phantomBar = '[' + '|'.repeat(Math.round(pct * 20)) + ' '.repeat(20 - Math.round(pct * 20)) + ']';
      }
    }

    var radTxt = _radWarning
      ? '<span style="color:#ffff00;animation:none">&#9762; RADIATION ZONE — 8HP/s DAMAGE</span>'
      : '';

    var metroTxt = _inMetro
      ? '<span style="color:#88aaff">METRO ESCAPE — enemies cannot follow</span>'
      : '';

    var extractTxt = (_phantom && !_phantom.alive)
      ? '<span style="color:#00ff88">&#x2708; REACH FACTORY ROOFTOP FOR EXTRACTION!</span>'
      : '';

    _hudEl.innerHTML = [
      'HP: ' + Math.max(0, Math.ceil(_playerHP)) + '/100',
      'AMMO: ' + _ammo + '/' + _maxAmmo,
      'SOLDIERS: ' + soldiersLeft + '/14',
      'SNIPERS: ' + snipersLeft + '/6',
      'PHANTOM: ' + phantomStatus,
      phantomBar,
      radTxt,
      metroTxt,
      extractTxt,
      _msgTimer > 0 ? '<span style="color:#ffcc44">' + _msgText + '</span>' : ''
    ].filter(Boolean).join('<br>');
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════════*/

  function _registerInputs() {
    _bndKeyDown     = _onKeyDown.bind(this);
    _bndKeyUp       = _onKeyUp.bind(this);
    _bndMouseMove   = _onMouseMove.bind(this);
    _bndMouseDown   = _onMouseDown.bind(this);
    _bndContextMenu = function (e) { e.preventDefault(); };

    document.addEventListener('keydown',     _bndKeyDown,     false);
    document.addEventListener('keyup',       _bndKeyUp,       false);
    document.addEventListener('mousemove',   _bndMouseMove,   false);
    document.addEventListener('mousedown',   _bndMouseDown,   false);
    document.addEventListener('contextmenu', _bndContextMenu, false);
  }

  function _onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    /* A then B activation — A must come first */
    if (k === 'A') {
      _aTime = performance.now();
    }
    if (k === 'B') {
      _bTime = performance.now();
      if (_aTime > 0 && (_bTime - _aTime) < AB_WINDOW && _aTime < _bTime) {
        _activate();
        return;
      }
    }

    if (!_active || _victory || _defeat) return;

    if (k === 'R') _reloadAmmo();
    if (k === 'M') _useMetroRoute();
  }

  function _onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function _onMouseMove(e) {
    if (!_active || _victory || _defeat) return;
    var sens = 0.002;
    _yaw   -= e.movementX * sens;
    _pitch -= e.movementY * sens;
    _pitch  = _clamp(_pitch, -Math.PI / 2.8, Math.PI / 2.8);
  }

  function _onMouseDown(e) {
    if (!_active || _victory || _defeat) return;
    if (e.button === 0) _firePlayer();
    if (_canvas && _canvas.requestPointerLock) _canvas.requestPointerLock();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER ACTIONS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _firePlayer() {
    if (_shootCooldown > 0) return;
    if (_ammo <= 0) { _showMsg('OUT OF AMMO — press R to reload!', 2); return; }
    _ammo--;
    _shootCooldown = 0.14;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var bMesh = _sphere(0.07, 6, 0xffdd44);
    bMesh.position.set(_playerPos.x, _playerPos.y - 0.1, _playerPos.z);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vel:  { x: dir.x * 65, y: dir.y * 65, z: dir.z * 65 },
      life: 2.0
    });
  }

  function _reloadAmmo() {
    _ammo = _maxAmmo;
    _showMsg('Reloaded — ' + _ammo + ' rounds.', 1.5);
  }

  function _useMetroRoute() {
    var metroEntrance = { x: 20, z: 30 };
    var dist = _dist2(_playerPos, metroEntrance);
    if (dist > 10) {
      _showMsg('Metro entrance is at the northeast station — get closer first!', 2.5);
      return;
    }
    if (_inMetro) {
      _showMsg('Already in metro — enemies cannot follow you underground.', 2);
      return;
    }
    _inMetro    = true;
    _metroTimer = 12;
    /* Drop player underground */
    _playerPos.y = -4.8;
    _playerPos.x = 20;
    _playerPos.z = 30;
    _showMsg('METRO ESCAPE — you are underground. Enemies cannot follow. Exits in 12 seconds...', 5);
  }

  /* ════════════════════════════════════════════════════════════════════════
     MOVEMENT
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updatePlayer(dt) {
    var speed = _playerSpeed;
    var fwd = 0, right = 0;

    if (_keys['W'] || _keys['ARROWUP'])    fwd   -= 1;
    if (_keys['S'] || _keys['ARROWDOWN'])  fwd   += 1;
    if (_keys['A'] || _keys['ARROWLEFT'])  right -= 1;
    if (_keys['D'] || _keys['ARROWRIGHT']) right += 1;

    /* Disable move keys used for activation on surfaces */
    /* (A is allowed for movement, only intercepted for sequence) */

    var sinY = Math.sin(_yaw), cosY = Math.cos(_yaw);
    var dx   = (fwd * (-sinY) + right * cosY) * speed * dt;
    var dz   = (fwd * (-cosY) + right * (-sinY)) * speed * dt;

    if (!_inMetro) {
      _playerPos.x += dx;
      _playerPos.z += dz;
      _playerPos.x  = _clamp(_playerPos.x, -100, 100);
      _playerPos.z  = _clamp(_playerPos.z, -100, 80);
      _playerPos.y  = 1.8;
    } else {
      /* Underground: limited movement on platform */
      _playerPos.x += dx;
      _playerPos.z += dz;
      _playerPos.x  = _clamp(_playerPos.x, 8, 32);
      _playerPos.z  = _clamp(_playerPos.z, 24, 36);
      _playerPos.y  = -4.2;

      _metroTimer -= dt;
      if (_metroTimer <= 0) {
        _inMetro     = false;
        _playerPos.y = 1.8;
        _showMsg('Emerging from metro...', 2);
      }
    }

    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y     = _yaw;
      _camera.rotation.x     = _pitch;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RADIATION ZONES
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateRadiation(dt) {
    var i, z, dist;
    _radWarning = false;

    if (_inMetro) return;  /* Underground — no radiation */

    for (i = 0; i < _radZones.length; i++) {
      z = _radZones[i];
      dist = _dist2(_playerPos, z.pos);
      if (dist < z.radius) {
        _radWarning = true;
        _playerHP  -= 8 * dt;
        if (_playerHP <= 0 && !_defeat) _triggerDefeat('Died from radiation exposure!');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FERRIS WHEEL ROTATION
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateFerrisWheel(dt) {
    if (!_ferrisHub) return;

    _ferrisAngle += dt * 0.12;  /* slow rotation */

    var i, g, angle, gx, gy;
    var FX = 60, FY = 28, FZ = -50, RADIUS = 18;

    for (i = 0; i < _gondolas.length; i++) {
      g = _gondolas[i];
      angle = g.baseAngle + _ferrisAngle;
      gx    = Math.cos(angle) * RADIUS;
      gy    = Math.sin(angle) * RADIUS;

      g.gondolaMesh.position.set(FX + gx, FY + gy, FZ);
      g.hangerMesh.position.set(FX + gx, FY + gy + 1.3, FZ);
    }

    /* Update ferris snipers who ride gondolas */
    var j, s;
    for (j = 0; j < _snipers.length; j++) {
      s = _snipers[j];
      if (!s.alive || s.gondolaIdx < 0) continue;
      var gi = s.gondolaIdx;
      if (gi >= _gondolas.length) continue;
      var gg = _gondolas[gi];
      angle = gg.baseAngle + _ferrisAngle;
      gx    = Math.cos(angle) * RADIUS;
      gy    = Math.sin(angle) * RADIUS;

      s.pos.x = FX + gx;
      s.pos.y = FY + gy;
      s.pos.z = FZ;

      s.bodyMesh.position.set(s.pos.x, s.pos.y, s.pos.z);
      s.helmMesh.position.set(s.pos.x, s.pos.y + 0.9, s.pos.z);
      s.rifleMesh.position.set(s.pos.x + 0.85, s.pos.y + 0.1, s.pos.z);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SOLDIER AI
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateSoldiers(dt) {
    var i, s, dx, dz, dl, tgt, distToPlayer;

    for (i = 0; i < _soldiers.length; i++) {
      s = _soldiers[i];
      if (!s.alive) continue;

      /* Enemies cannot follow into metro */
      if (_inMetro) { s.shootTimer -= dt; continue; }

      distToPlayer = _dist2(_playerPos, s.pos);

      /* Alert range — chase player or patrol */
      if (distToPlayer < 30) {
        /* Chase */
        dx = _playerPos.x - s.pos.x;
        dz = _playerPos.z - s.pos.z;
        dl = Math.sqrt(dx * dx + dz * dz) || 1;
        s.pos.x += (dx / dl) * s.patrolSpeed * dt;
        s.pos.z += (dz / dl) * s.patrolSpeed * dt;
      } else {
        /* Patrol between two points */
        tgt = s.patrolPts[s.patrolIdx];
        dx  = tgt.x - s.pos.x;
        dz  = tgt.z - s.pos.z;
        dl  = Math.sqrt(dx * dx + dz * dz) || 1;
        if (dl < 1.5) {
          s.patrolIdx = 1 - s.patrolIdx;
        } else {
          s.pos.x += (dx / dl) * s.patrolSpeed * dt;
          s.pos.z += (dz / dl) * s.patrolSpeed * dt;
        }
      }

      s.bodyMesh.position.set(s.pos.x, s.pos.y, s.pos.z);
      s.helmMesh.position.set(s.pos.x, s.pos.y + 1.0, s.pos.z);
      s.rifleMesh.position.set(s.pos.x + 0.55, s.pos.y + 0.25, s.pos.z);

      /* Melee damage */
      if (distToPlayer < 2.0) {
        _playerHP -= 10 * dt;
        if (_playerHP <= 0 && !_defeat) _triggerDefeat('Overrun by syndicate soldiers!');
      }

      /* Shoot at player */
      if (distToPlayer < 30) {
        s.shootTimer -= dt;
        if (s.shootTimer <= 0) {
          s.shootTimer = _rnd(1.5, 3.5);
          _enemyFire(s.pos, 18, 10);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SNIPER AI
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateSnipers(dt) {
    var i, s, dist;
    for (i = 0; i < _snipers.length; i++) {
      s = _snipers[i];
      if (!s.alive) continue;
      if (_inMetro) continue;

      dist = _dist3(_playerPos, s.pos);
      if (dist < 80) {
        s.shootTimer -= dt;
        if (s.shootTimer <= 0) {
          s.shootTimer = _rnd(3, 7);
          _enemyFire(s.pos, 22, 22);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PHANTOM AI
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updatePhantom(dt) {
    if (!_phantom || !_phantom.alive) return;
    var p = _phantom;

    /* Urban camouflage cycle */
    if (_phantomCamoActive) {
      _phantomCamoDur -= dt;
      if (_phantomCamoDur <= 0) {
        _phantomCamoActive = false;
        _phantomCamoTimer  = 20;
        /* Restore opacity */
        p.bodyMesh.material.opacity = 1.0;
        p.headMesh.material.opacity = 1.0;
        p.balaMesh.material.opacity = 1.0;
        p.bodyMesh.material.transparent = false;
        p.headMesh.material.transparent = false;
        p.balaMesh.material.transparent = false;
        _showMsg('THE PHANTOM de-cloaked!', 2);
      }
    } else {
      _phantomCamoTimer -= dt;
      if (_phantomCamoTimer <= 0) {
        _phantomCamoActive = true;
        _phantomCamoDur    = 8;
        /* Fade to 20% opacity */
        p.bodyMesh.material.transparent = true;
        p.bodyMesh.material.opacity = 0.2;
        p.headMesh.material.transparent = true;
        p.headMesh.material.opacity = 0.2;
        p.balaMesh.material.transparent = true;
        p.balaMesh.material.opacity = 0.2;
        _showMsg('THE PHANTOM activated urban camouflage — listen for gunfire flashes!', 4);
      }
    }

    if (_inMetro) return;

    var dist = _dist3(_playerPos, p.pos);

    /* Move toward player, circling slightly */
    p.moveTimer -= dt;
    if (p.moveTimer <= 0) {
      p.moveTimer = _rnd(2, 5);
      var offsetAngle = _rnd(0, Math.PI * 2);
      var offsetR     = _rnd(5, 12);
      p.moveTarget.x = _playerPos.x + Math.cos(offsetAngle) * offsetR;
      p.moveTarget.z = _playerPos.z + Math.sin(offsetAngle) * offsetR;
      /* Keep near HQ */
      p.moveTarget.x = _clamp(p.moveTarget.x, -30, 30);
      p.moveTarget.z = _clamp(p.moveTarget.z, -90, -45);
    }

    var mdx = p.moveTarget.x - p.pos.x;
    var mdz = p.moveTarget.z - p.pos.z;
    var mdl = Math.sqrt(mdx * mdx + mdz * mdz) || 1;
    var spd = 4.5;
    p.pos.x += (mdx / mdl) * spd * dt;
    p.pos.z += (mdz / mdl) * spd * dt;

    p.bodyMesh.position.set(p.pos.x, p.pos.y, p.pos.z);
    p.headMesh.position.set(p.pos.x, p.pos.y + 1.2, p.pos.z);
    p.balaMesh.position.set(p.pos.x, p.pos.y + 1.2, p.pos.z);
    p.smgL.position.set(p.pos.x - 0.6, p.pos.y + 0.05, p.pos.z - 0.4);
    p.smgR.position.set(p.pos.x + 0.6, p.pos.y + 0.05, p.pos.z - 0.4);
    p.glow.position.set(p.pos.x, p.pos.y + 2.5, p.pos.z);

    /* Dual SMG fire — high rate */
    p.shootTimer -= dt;
    if (p.shootTimer <= 0 && dist < 50) {
      p.shootTimer = 0.6;
      _enemyFire(p.pos, 20, 14);
      _enemyFire({ x: p.pos.x + 0.5, y: p.pos.y, z: p.pos.z }, 20, 14);

      /* Audio-cue muzzle flash even when camo active */
      if (_phantomCamoActive) {
        _phantomFlashTimer = 0.2;
        _showMsg('PHANTOM muzzle flash detected!', 1);
      }
    }

    /* Melee */
    if (dist < 2.5) {
      _playerHP -= 20 * dt;
      if (_playerHP <= 0 && !_defeat) _triggerDefeat('Killed by The Phantom!');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY FIRE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _enemyFire(fromPos, speed, damage) {
    var dx = _playerPos.x - fromPos.x;
    var dy = _playerPos.y - fromPos.y;
    var dz = _playerPos.z - fromPos.z;
    var dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    /* Add slight spread */
    dx += _rnd(-0.12, 0.12) * dl;
    dy += _rnd(-0.08, 0.08) * dl;
    dz += _rnd(-0.12, 0.12) * dl;
    dl  = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    var sm = _sphere(0.07, 5, 0xff4400);
    sm.position.set(fromPos.x, fromPos.y + 0.5, fromPos.z);
    _scene.add(sm);

    _enemyShots.push({
      mesh:   sm,
      vel:    { x: (dx / dl) * speed, y: (dy / dl) * speed, z: (dz / dl) * speed },
      life:   3.0,
      dmg:    damage
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     BULLET UPDATE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateBullets(dt) {
    var i, b, hit, j, d;
    var toRemove = [];

    for (i = 0; i < _bullets.length; i++) {
      b = _bullets[i];
      b.life -= dt;
      if (b.life <= 0) { toRemove.push(i); continue; }

      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      var bpos = {
        x: b.mesh.position.x,
        y: b.mesh.position.y,
        z: b.mesh.position.z
      };

      hit = false;

      /* Soldier hits */
      for (j = 0; j < _soldiers.length && !hit; j++) {
        if (!_soldiers[j].alive) continue;
        d = _dist3(bpos, _soldiers[j].pos);
        if (d < 1.0) {
          _soldiers[j].hp -= 25;
          if (_soldiers[j].hp <= 0) _killSoldier(j);
          hit = true;
        }
      }

      /* Sniper hits */
      for (j = 0; j < _snipers.length && !hit; j++) {
        if (!_snipers[j].alive) continue;
        d = _dist3(bpos, _snipers[j].pos);
        if (d < 1.0) {
          _snipers[j].hp -= 30;
          if (_snipers[j].hp <= 0) _killSniper(j);
          hit = true;
        }
      }

      /* Phantom hit */
      if (!hit && _phantom && _phantom.alive) {
        d = _dist3(bpos, _phantom.pos);
        if (d < 1.2) {
          _phantom.hp -= 20;
          _showMsg('Phantom hit! HP: ' + Math.ceil(_phantom.hp), 1);
          if (_phantom.hp <= 0) _killPhantom();
          hit = true;
        }
      }

      if (hit) toRemove.push(i);
    }

    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      if (_bullets[idx]) {
        _scene.remove(_bullets[idx].mesh);
        _bullets.splice(idx, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY SHOT UPDATE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateEnemyShots(dt) {
    var i, s, d, toRemove;
    toRemove = [];

    for (i = 0; i < _enemyShots.length; i++) {
      s = _enemyShots[i];
      s.life -= dt;
      if (s.life <= 0) { toRemove.push(i); continue; }

      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.y += s.vel.y * dt;
      s.mesh.position.z += s.vel.z * dt;

      if (_inMetro) continue;

      d = _dist3(_playerPos, {
        x: s.mesh.position.x,
        y: s.mesh.position.y,
        z: s.mesh.position.z
      });
      if (d < 1.0) {
        _playerHP -= s.dmg;
        if (_playerHP <= 0 && !_defeat) _triggerDefeat('Shot down in the field!');
        toRemove.push(i);
      }
    }

    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      if (_enemyShots[idx]) {
        _scene.remove(_enemyShots[idx].mesh);
        _enemyShots.splice(idx, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     KILLS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _killSoldier(i) {
    var s = _soldiers[i];
    if (!s || !s.alive) return;
    s.alive = false;
    _scene.remove(s.bodyMesh);
    _scene.remove(s.helmMesh);
    _scene.remove(s.rifleMesh);
    var left = 0, j;
    for (j = 0; j < _soldiers.length; j++) { if (_soldiers[j].alive) left++; }
    _showMsg('Soldier down! ' + left + ' remaining.', 1.5);
  }

  function _killSniper(i) {
    var s = _snipers[i];
    if (!s || !s.alive) return;
    s.alive = false;
    _scene.remove(s.bodyMesh);
    _scene.remove(s.helmMesh);
    _scene.remove(s.rifleMesh);
    var left = 0, j;
    for (j = 0; j < _snipers.length; j++) { if (_snipers[j].alive) left++; }
    _showMsg('Sniper neutralized! ' + left + ' snipers remaining.', 2);
  }

  function _killPhantom() {
    if (!_phantom || !_phantom.alive) return;
    _phantom.alive = false;
    _scene.remove(_phantom.bodyMesh);
    _scene.remove(_phantom.headMesh);
    _scene.remove(_phantom.balaMesh);
    _scene.remove(_phantom.smgL);
    _scene.remove(_phantom.smgR);
    _phantom.glow.intensity = 0;
    _showMsg('THE PHANTOM IS DOWN! Now reach the factory rooftop extraction point!', 6);
    /* Change beacon to extraction blink */
    _phantomCamoActive = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE CONDITIONS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _checkExtraction() {
    if (!_phantom || _phantom.alive) return;
    /* Factory roof helipad: FX=-60, FY=21, FZ=-60 */
    var helipadPos = { x: -60, y: 21, z: -60 };
    var dist = _dist3(_playerPos, helipadPos);
    if (dist < 6) {
      _triggerVictory();
    }
  }

  function _triggerVictory() {
    if (_victory) return;
    _victory = true;
    _showMsg('MISSION COMPLETE! Phantom eliminated — extraction successful!', 10);
    _updateHUD();
  }

  function _triggerDefeat(reason) {
    if (_defeat) return;
    _defeat = true;
    _showMsg('MISSION FAILED — ' + (reason || 'You were killed.') + ' Press A then B to restart.', 8);
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN UPDATE LOOP
  ═══════════════════════════════════════════════════════════════════════════*/

  function update(dt) {
    if (!_active) return;

    _gameTime += dt;

    if (_shootCooldown > 0) _shootCooldown -= dt;
    if (_msgTimer > 0)      _msgTimer      -= dt;

    if (_victory || _defeat) {
      _updateHUD();
      return;
    }

    _updatePlayer(dt);
    _updateRadiation(dt);
    _updateFerrisWheel(dt);
    _updateSoldiers(dt);
    _updateSnipers(dt);
    _updatePhantom(dt);
    _updateBullets(dt);
    _updateEnemyShots(dt);
    _checkExtraction();

    /* HP clamp */
    _playerHP = _clamp(_playerHP, 0, 100);

    /* Phantom flash hint flicker */
    if (_phantomFlashTimer > 0) {
      _phantomFlashTimer -= dt;
      if (_phantom && _phantom.alive) {
        _phantom.glow.intensity = _phantomFlashTimer > 0.1 ? 3.0 : 0.8;
      }
    }

    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════════*/

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
