/* ─────────────────────────────────────────────────────────────────────────────
   ghost-town.js — Ghost Town FPS Supernatural Gunfight Mini-Game
   API: window.GhostTown = { init, update, reset }
   Activation: G + T simultaneous keypress (both keys within 400ms)

   Dusthaven, 1880s. A railroad crew disturbed an ancient burial site and now
   the dead walk. You are the town sheriff. Find and destroy 4 cursed totems to
   lift the curse, then face the Outlaw King — undead boss of all wrath.

   Controls:
     G + T  → activate
     WASD   → move
     Mouse  → look
     Click  → shoot (left: regular, right: fire silver bullet)
     E      → interact (pick up silver ore / holy water / collect)
     F      → pour holy water on nearest totem (must have water + be close)
   ───────────────────────────────────────────────────────────────────────── */

window.GhostTown = (function () {
  'use strict';

  /* ── Scene references ─────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key-combo G+T within 400ms ───────────────────────────── */
  var _gtPressTime = { G: 0, T: 0 };
  var GT_WINDOW    = 400;

  /* ── Game state ───────────────────────────────────────────────────────── */
  var _active        = false;
  var _victory       = false;
  var _defeat        = false;
  var _msgTimer      = 0;
  var _msgText       = '';

  /* ── Player ───────────────────────────────────────────────────────────── */
  var _playerPos     = { x: 0, y: 1.7, z: 30 };
  var _playerHP      = 100;
  var _playerSpeed   = 6;
  var _yaw           = 0;
  var _pitch         = 0;
  var _keys          = {};
  var _mouseDown     = false;

  /* ── Inventory ────────────────────────────────────────────────────────── */
  var _regularAmmo   = 30;
  var _silverBullets = 0;
  var _silverOre     = 0;
  var _holyWater     = 0;
  var _totemWatered  = [];   // which totems have been holy-watered (index)

  /* ── Totems ───────────────────────────────────────────────────────────── */
  var _totems        = [];   // { mesh, light, pos, watered, destroyed }
  var _totemsDestroyed = 0;

  /* ── Wraiths ──────────────────────────────────────────────────────────── */
  var _wraiths       = [];   // { mesh, light, pos, hp, alive, speed, rageTimer }
  var _outlawKing    = null; // { mesh, light, pos, hp, alive, spawned }
  var _outlawStatus  = 'DORMANT'; // 'DORMANT' | 'AWAKENED' | 'DEFEATED'

  /* ── Projectiles ──────────────────────────────────────────────────────── */
  var _bullets       = [];   // { mesh, light, vel, isSilver, life }
  var _wraithShots   = [];   // { mesh, vel, life, damage }

  /* ── Silver ore pickups ───────────────────────────────────────────────── */
  var _oreNodes      = [];   // { mesh, pos, collected }

  /* ── Holy water source ───────────────────────────────────────────────── */
  var _holyFontPos   = { x: -38, y: 1, z: -55 };
  var _holyFontMesh  = null;
  var _fontRefillCooldown = 0;

  /* ── Ghost horse ──────────────────────────────────────────────────────── */
  var _ghostHorse    = null; // { body, legs, pos }

  /* ── Tumbleweeds ──────────────────────────────────────────────────────── */
  var _tumbleweeds   = [];   // { mesh, pos, vel, rotSpeed }

  /* ── Scene objects for teardown ──────────────────────────────────────── */
  var _sceneMeshes   = [];
  var _sceneLights   = [];

  /* ── Cooldown / timers ────────────────────────────────────────────────── */
  var _shootCooldown  = 0;
  var _regenTimer     = 0;   // wraith HP regen tick

  /* ── Input listeners ─────────────────────────────────────────────────── */
  var _boundKeyDown     = null;
  var _boundKeyUp       = null;
  var _boundMouseMove   = null;
  var _boundMouseDown   = null;
  var _boundMouseUp     = null;
  var _boundContextMenu = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _rnd(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _box(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) { mat.transparent = true; mat.opacity = opts.opacity; }
      if (opts.emissive) mat.emissive = new THREE.Color(opts.emissive);
      if (opts.emissiveIntensity !== undefined) mat.emissiveIntensity = opts.emissiveIntensity;
      if (opts.wireframe) mat.wireframe = true;
    }
    return new THREE.Mesh(geo, mat);
  }

  function _cylinder(rt, rb, h, segs, color, opts) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) { mat.transparent = true; mat.opacity = opts.opacity; }
      if (opts.emissive) mat.emissive = new THREE.Color(opts.emissive);
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

  function _addMesh(mesh) {
    _scene.add(mesh);
    _sceneMeshes.push(mesh);
    return mesh;
  }

  function _addLight(light) {
    _scene.add(light);
    _sceneLights.push(light);
    return light;
  }

  function _showMsg(txt, dur) {
    _msgText  = txt;
    _msgTimer = dur || 3;
  }

  /* ════════════════════════════════════════════════════════════════════════
     TOWN CONSTRUCTION — DUSTHAVEN
  ═══════════════════════════════════════════════════════════════════════════*/

  function _buildTown() {
    var i;

    /* ── Ground — dirt ───────────────────────────────────────────────────*/
    var ground = _box(200, 0.4, 200, 0x886644);
    ground.position.set(0, -0.2, 0);
    _addMesh(ground);

    /* ── Moonlight ambient ───────────────────────────────────────────────*/
    var ambient = new THREE.AmbientLight(0x223344, 0.25);
    _addLight(ambient);

    var moon = new THREE.PointLight(0x334466, 0.8, 300);
    moon.position.set(0, 80, 0);
    _addLight(moon);

    /* ── Main street dirt road ───────────────────────────────────────────*/
    var road = _box(10, 0.05, 120, 0x886644);
    road.position.set(0, 0.02, 0);
    _addMesh(road);

    /* ── SALOON  15×6×20  (0x886633) ─────────────────────────────────── */
    _buildSaloon();

    /* ── SHERIFF'S OFFICE  10×5×12  (0x887755) ──────────────────────── */
    _buildSheriff();

    /* ── GENERAL STORE  12×5×15  (0x886622) ─────────────────────────── */
    _buildStore();

    /* ── GRAVEYARD  30×1×25  (0x665533) ─────────────────────────────── */
    _buildGraveyard();

    /* ── CHURCH  15×8×20  (0x998877) ────────────────────────────────── */
    _buildChurch();

    /* ── ABANDONED MINE ──────────────────────────────────────────────── */
    _buildMine();

    /* ── GHOST HORSE ─────────────────────────────────────────────────── */
    _buildGhostHorse();

    /* ── TUMBLEWEEDS ─────────────────────────────────────────────────── */
    for (i = 0; i < 5; i++) {
      var tw = _sphere(0.4, 6, 0x887744, { opacity: 0.9 });
      tw.position.set(_rnd(-20, 20), 0.4, _rnd(-50, 50));
      _addMesh(tw);
      _tumbleweeds.push({
        mesh: tw,
        pos:  { x: tw.position.x, y: 0.4, z: tw.position.z },
        vel:  { x: _rnd(-2, 2), z: _rnd(-2, 2) },
        rotSpeed: _rnd(1, 3)
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     SALOON
  ──────────────────────────────────────────────────────────────────────────*/
  function _buildSaloon() {
    var i;
    var ox = -20, oy = 0, oz = -20;

    // Main building  15×6×20
    var walls = _box(15, 6, 20, 0x886633);
    walls.position.set(ox, oy + 3, oz);
    _addMesh(walls);

    // Floor
    var fl = _box(14.6, 0.3, 19.6, 0x775522);
    fl.position.set(ox, oy + 0.15, oz);
    _addMesh(fl);

    // Roof
    var roof = _box(15, 0.4, 20, 0x664422);
    roof.position.set(ox, oy + 6.2, oz);
    _addMesh(roof);

    // Saloon sign
    var sign = _box(8, 1, 0.2, 0x886633, { emissive: 0x442200, emissiveIntensity: 0.3 });
    sign.position.set(ox, oy + 7.2, oz - 10.1);
    _addMesh(sign);

    // Balcony railing
    var balcony = _box(15, 0.3, 2, 0x775522);
    balcony.position.set(ox, oy + 4.15, oz - 9);
    _addMesh(balcony);

    // Balcony support posts
    for (i = -6; i <= 6; i += 4) {
      var post = _box(0.3, 4, 0.3, 0x664422);
      post.position.set(ox + i, oy + 2, oz - 10);
      _addMesh(post);
    }

    // Bar counter  (WOOD)
    var bar = _box(8, 1, 1.2, 0x775533);
    bar.position.set(ox, oy + 0.5, oz + 4);
    _addMesh(bar);

    // Bar top
    var bartop = _box(8.2, 0.15, 1.4, 0x996644);
    bartop.position.set(ox, oy + 1.07, oz + 4);
    _addMesh(bartop);

    // Bottles (CylinderGeometry)
    for (i = 0; i < 5; i++) {
      var bottle = _cylinder(0.07, 0.09, 0.4, 6, i % 2 === 0 ? 0x44AA66 : 0xAA8844);
      bottle.position.set(ox - 3 + i * 1.4, oy + 1.35, oz + 4.2);
      _addMesh(bottle);
    }

    // Piano (BoxGeometry)
    var piano = _box(2, 1.1, 1, 0x332211);
    piano.position.set(ox + 5, oy + 0.55, oz - 6);
    _addMesh(piano);

    var pianoLid = _box(2.1, 0.08, 1.1, 0x221100);
    pianoLid.position.set(ox + 5, oy + 1.14, oz - 6);
    _addMesh(pianoLid);

    // Tables
    for (i = 0; i < 3; i++) {
      var tbl = _box(1.5, 0.1, 1.5, 0x885533);
      tbl.position.set(ox - 4 + i * 4, oy + 0.9, oz - 2 + i * 1.5);
      _addMesh(tbl);

      var tleg = _cylinder(0.08, 0.08, 0.9, 6, 0x664422);
      tleg.position.set(ox - 4 + i * 4, oy + 0.45, oz - 2 + i * 1.5);
      _addMesh(tleg);
    }

    // Saloon light
    var sl = new THREE.PointLight(0xFFCC66, 0.6, 25);
    sl.position.set(ox, oy + 5, oz);
    _addLight(sl);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     SHERIFF'S OFFICE
  ──────────────────────────────────────────────────────────────────────────*/
  function _buildSheriff() {
    var i;
    var ox = 18, oy = 0, oz = -10;

    // Main building  10×5×12
    var walls = _box(10, 5, 12, 0x887755);
    walls.position.set(ox, oy + 2.5, oz);
    _addMesh(walls);

    // Roof
    var roof = _box(10.2, 0.4, 12.2, 0x665533);
    roof.position.set(ox, oy + 5.2, oz);
    _addMesh(roof);

    // Floor
    var fl = _box(9.6, 0.2, 11.6, 0x776644);
    fl.position.set(ox, oy + 0.1, oz);
    _addMesh(fl);

    // JAIL CELLS — LineSegments bars
    var barGeo = new THREE.BufferGeometry();
    var barPositions = [];
    for (i = 0; i < 5; i++) {
      // vertical bars
      barPositions.push(ox - 2 + i * 0.6, oy + 0.1, oz + 4);
      barPositions.push(ox - 2 + i * 0.6, oy + 3.5, oz + 4);
    }
    // horizontal bars
    barPositions.push(ox - 2.3, oy + 1.2, oz + 4);
    barPositions.push(ox + 0.5, oy + 1.2, oz + 4);
    barPositions.push(ox - 2.3, oy + 2.4, oz + 4);
    barPositions.push(ox + 0.5, oy + 2.4, oz + 4);

    barGeo.setAttribute('position', new THREE.Float32BufferAttribute(barPositions, 3));
    var barMat  = new THREE.LineBasicMaterial({ color: 0x888888 });
    var barLine = new THREE.LineSegments(barGeo, barMat);
    _scene.add(barLine);
    _sceneMeshes.push(barLine);

    // Gun locker (BoxGeometry)
    var locker = _box(1.2, 2, 0.5, 0x556644);
    locker.position.set(ox + 3.5, oy + 1, oz - 4);
    _addMesh(locker);

    var lockerDoor = _box(1.1, 1.9, 0.1, 0x445533);
    lockerDoor.position.set(ox + 3.5, oy + 1, oz - 3.74);
    _addMesh(lockerDoor);

    // Desk
    var desk = _box(2, 0.1, 1, 0x885533);
    desk.position.set(ox - 1, oy + 0.9, oz - 2);
    _addMesh(desk);

    // Dim office light
    var sl = new THREE.PointLight(0xFFCC88, 0.4, 15);
    sl.position.set(ox, oy + 4.5, oz);
    _addLight(sl);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     GENERAL STORE
  ──────────────────────────────────────────────────────────────────────────*/
  function _buildStore() {
    var i;
    var ox = -18, oy = 0, oz = 15;

    // Main building  12×5×15
    var walls = _box(12, 5, 15, 0x886622);
    walls.position.set(ox, oy + 2.5, oz);
    _addMesh(walls);

    var roof = _box(12.2, 0.4, 15.2, 0x665511);
    roof.position.set(ox, oy + 5.2, oz);
    _addMesh(roof);

    var fl = _box(11.6, 0.2, 14.6, 0x776633);
    fl.position.set(ox, oy + 0.1, oz);
    _addMesh(fl);

    // Shelves (WOOD)
    for (i = 0; i < 3; i++) {
      var shelf = _box(0.2, 3, 5, 0x775522);
      shelf.position.set(ox - 5.5, oy + 1.5, oz - 4 + i * 4);
      _addMesh(shelf);

      var shelfBoard = _box(0.3, 0.1, 4.8, 0x886633);
      shelfBoard.position.set(ox - 5.4, oy + 1 + i * 0.6, oz);
      _addMesh(shelfBoard);
    }

    // Silver ore nodes on shelf (SphereGeometry, 0xCCCCFF)
    var orePositions = [
      { x: ox - 5.0, y: oy + 1.2, z: oz - 3 },
      { x: ox - 5.0, y: oy + 1.2, z: oz + 1 }
    ];
    for (i = 0; i < orePositions.length; i++) {
      var ore = _sphere(0.18, 8, 0xCCCCFF, { emissive: 0x8888CC, emissiveIntensity: 0.4 });
      ore.position.set(orePositions[i].x, orePositions[i].y, orePositions[i].z);
      _addMesh(ore);
      _oreNodes.push({ mesh: ore, pos: orePositions[i], collected: false });
    }

    // Counter
    var counter = _box(6, 1, 0.8, 0x775533);
    counter.position.set(ox, oy + 0.5, oz + 6);
    _addMesh(counter);

    // Store light
    var sl = new THREE.PointLight(0xFFDD88, 0.5, 18);
    sl.position.set(ox, oy + 4.5, oz);
    _addLight(sl);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     GRAVEYARD
  ──────────────────────────────────────────────────────────────────────────*/
  function _buildGraveyard() {
    var i;
    var ox = 0, oy = 0, oz = 60;

    // Ground  30×1×25
    var gnd = _box(30, 0.6, 25, 0x665533);
    gnd.position.set(ox, oy - 0.3, oz);
    _addMesh(gnd);

    // Graveyard fence
    for (i = -14; i <= 14; i += 3) {
      var fp = _box(0.3, 1.5, 0.3, 0x445533);
      fp.position.set(ox + i, oy + 0.75, oz - 12.5);
      _addMesh(fp);
      var fp2 = _box(0.3, 1.5, 0.3, 0x445533);
      fp2.position.set(ox + i, oy + 0.75, oz + 12.5);
      _addMesh(fp2);
    }

    // Headstones (BoxGeometry)
    var headstonePositions = [
      { x: ox - 8, z: oz - 6 }, { x: ox - 4, z: oz - 6 }, { x: ox,     z: oz - 6 },
      { x: ox + 4, z: oz - 6 }, { x: ox + 8, z: oz - 6 },
      { x: ox - 8, z: oz + 2 }, { x: ox - 4, z: oz + 2 }, { x: ox,     z: oz + 2 },
      { x: ox + 4, z: oz + 2 }, { x: ox + 8, z: oz + 2 },
      { x: ox - 8, z: oz + 8 }, { x: ox,     z: oz + 8 }, { x: ox + 8, z: oz + 8 }
    ];
    for (i = 0; i < headstonePositions.length; i++) {
      var hs = _box(0.8, 1.2, 0.2, 0x887766);
      hs.position.set(headstonePositions[i].x, oy + 0.6, headstonePositions[i].z);
      _addMesh(hs);
      // arch top
      var hstop = _box(0.85, 0.3, 0.22, 0x998877);
      hstop.position.set(headstonePositions[i].x, oy + 1.35, headstonePositions[i].z);
      _addMesh(hstop);
    }

    // 2 CURSED TOTEMS in graveyard
    _spawnTotem(ox - 5, oy, oz - 2, 0);
    _spawnTotem(ox + 5, oy, oz + 5, 1);

    // Eerie graveyard light
    var gl = new THREE.PointLight(0x334422, 0.4, 40);
    gl.position.set(ox, oy + 8, oz);
    _addLight(gl);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     CHURCH
  ──────────────────────────────────────────────────────────────────────────*/
  function _buildChurch() {
    var ox = 25, oy = 0, oz = 30;

    // Main building  15×8×20
    var walls = _box(15, 8, 20, 0x998877);
    walls.position.set(ox, oy + 4, oz);
    _addMesh(walls);

    // Roof peak (box approximation)
    var roofBase = _box(15.2, 0.4, 20.2, 0x887766);
    roofBase.position.set(ox, oy + 8.2, oz);
    _addMesh(roofBase);

    var roofPeak = _box(1, 3, 20, 0x776655);
    roofPeak.position.set(ox, oy + 9.5, oz);
    _addMesh(roofPeak);

    // Bell tower (CylinderGeometry)
    var tower = _cylinder(2, 2.5, 8, 8, 0x998877);
    tower.position.set(ox, oy + 12, oz - 9);
    _addMesh(tower);

    var towerRoof = _cone(2.5, 3, 8, 0x776655);
    towerRoof.position.set(ox, oy + 17.5, oz - 9);
    _addMesh(towerRoof);

    // Bell (CylinderGeometry)
    var bell = _cylinder(0.8, 1.0, 1.2, 8, 0xCC9933);
    bell.position.set(ox, oy + 15.5, oz - 9);
    _addMesh(bell);

    // Cross on top of bell tower
    var crossV = _box(0.2, 1.5, 0.2, 0xBBAA88);
    crossV.position.set(ox, oy + 19.5, oz - 9);
    _addMesh(crossV);
    var crossH = _box(1, 0.2, 0.2, 0xBBAA88);
    crossH.position.set(ox, oy + 19.8, oz - 9);
    _addMesh(crossH);

    // Pews (BoxGeometry rows)
    var pi;
    for (pi = 0; pi < 4; pi++) {
      var pew = _box(8, 0.6, 1, 0x775533);
      pew.position.set(ox, oy + 0.3, oz - 6 + pi * 3.5);
      _addMesh(pew);
    }

    // HOLY WATER FONT  (CylinderGeometry bowl)
    var fontPedestal = _cylinder(0.3, 0.4, 0.9, 8, 0xBBBBAA);
    fontPedestal.position.set(_holyFontPos.x, _holyFontPos.y - 0.45, _holyFontPos.z);
    _addMesh(fontPedestal);

    var fontBowl = _cylinder(0.6, 0.4, 0.4, 8, 0xCCCCBB);
    fontBowl.position.set(_holyFontPos.x, _holyFontPos.y + 0.1, _holyFontPos.z);
    _addMesh(fontBowl);
    _holyFontMesh = fontBowl;

    // Holy water glow
    var fontLight = new THREE.PointLight(0xAADDFF, 0.6, 5);
    fontLight.position.set(_holyFontPos.x, _holyFontPos.y + 0.5, _holyFontPos.z);
    _addLight(fontLight);

    // BASEMENT TOTEM  (church basement approximation — underground)
    var basementFloor = _box(10, 0.3, 12, 0x554433);
    basementFloor.position.set(ox, oy - 2.85, oz + 4);
    _addMesh(basementFloor);

    var basementWalls = _box(10, 3, 12, 0x665544, { opacity: 0.95 });
    basementWalls.position.set(ox, oy - 1.5, oz + 4);
    _addMesh(basementWalls);

    _spawnTotem(ox, oy - 2.5, oz + 5, 3);  // index 3 = church basement

    // Church ambient
    var cl = new THREE.PointLight(0xCCBBAA, 0.35, 30);
    cl.position.set(ox, oy + 7, oz);
    _addLight(cl);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ABANDONED MINE
  ──────────────────────────────────────────────────────────────────────────*/
  function _buildMine() {
    var i;
    var ox = -40, oy = 0, oz = 0;

    // Mine entrance framing
    var entryLeft = _box(0.4, 3.5, 0.4, 0x664422);
    entryLeft.position.set(ox + 1.5, oy + 1.75, oz);
    _addMesh(entryLeft);

    var entryRight = _box(0.4, 3.5, 0.4, 0x664422);
    entryRight.position.set(ox - 1.5, oy + 1.75, oz);
    _addMesh(entryRight);

    var entryTop = _box(3.4, 0.4, 0.4, 0x664422);
    entryTop.position.set(ox, oy + 3.5, oz);
    _addMesh(entryTop);

    // Mine tunnel  3×3×30  (0x554422)
    var tunnel = _box(3, 3, 30, 0x554422);
    tunnel.position.set(ox, oy + 1.5, oz - 15);
    _addMesh(tunnel);

    // Support beams inside tunnel
    for (i = 0; i < 5; i++) {
      var beamL = _box(0.3, 3, 0.3, 0x664422);
      beamL.position.set(ox + 1.2, oy + 1.5, oz - 5 - i * 5);
      _addMesh(beamL);
      var beamR = _box(0.3, 3, 0.3, 0x664422);
      beamR.position.set(ox - 1.2, oy + 1.5, oz - 5 - i * 5);
      _addMesh(beamR);
      var beamTop = _box(3, 0.3, 0.3, 0x664422);
      beamTop.position.set(ox, oy + 3, oz - 5 - i * 5);
      _addMesh(beamTop);
    }

    // Mine cart (CylinderGeometry wheels + BoxGeometry body)
    var cartBody = _box(1.2, 0.8, 0.7, 0x555544);
    cartBody.position.set(ox, oy + 0.8, oz - 8);
    _addMesh(cartBody);

    for (i = 0; i < 2; i++) {
      var wheelL = _cylinder(0.25, 0.25, 0.15, 8, 0x333333);
      wheelL.rotation.z = Math.PI / 2;
      wheelL.position.set(ox + 0.7, oy + 0.35, oz - 7 - i * 1.2);
      _addMesh(wheelL);
      var wheelR = _cylinder(0.25, 0.25, 0.15, 8, 0x333333);
      wheelR.rotation.z = Math.PI / 2;
      wheelR.position.set(ox - 0.7, oy + 0.35, oz - 7 - i * 1.2);
      _addMesh(wheelR);
    }

    // Silver ore in mine
    var mineOrePositions = [
      { x: ox - 1, y: oy + 0.5, z: oz - 12 },
      { x: ox + 1, y: oy + 0.5, z: oz - 20 },
      { x: ox,     y: oy + 0.5, z: oz - 25 }
    ];
    for (i = 0; i < mineOrePositions.length; i++) {
      var mineOre = _sphere(0.2, 8, 0xCCCCFF, { emissive: 0x9999DD, emissiveIntensity: 0.5 });
      mineOre.position.set(mineOrePositions[i].x, mineOrePositions[i].y, mineOrePositions[i].z);
      _addMesh(mineOre);
      _oreNodes.push({ mesh: mineOre, pos: mineOrePositions[i], collected: false });
    }

    // MINE TOTEM  (index 2)
    _spawnTotem(ox, oy, oz - 22, 2);

    // Mine darkness
    var mineLight = new THREE.PointLight(0x332211, 0.5, 20);
    mineLight.position.set(ox, oy + 2.5, oz - 10);
    _addLight(mineLight);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     TOTEM SPAWNER
  ──────────────────────────────────────────────────────────────────────────*/
  function _spawnTotem(x, y, z, index) {
    // Stack of boxes for totem look
    var base = _box(0.8, 0.6, 0.8, 0x334433, { emissive: 0x220000, emissiveIntensity: 0.3 });
    base.position.set(x, y + 0.3, z);
    _addMesh(base);

    var mid = _box(0.6, 0.8, 0.6, 0x334433, { emissive: 0x330000, emissiveIntensity: 0.5 });
    mid.position.set(x, y + 0.9 + 0.4, z);
    _addMesh(mid);

    var top = _box(0.7, 0.6, 0.7, 0x223322, { emissive: 0x440000, emissiveIntensity: 0.6 });
    top.position.set(x, y + 1.7 + 0.3, z);
    _addMesh(top);

    // Totem glow
    var tl = new THREE.PointLight(0xAA3300, 1.2, 6);
    tl.position.set(x, y + 2.2, z);
    _addLight(tl);

    _totems[index] = {
      mesh:     top,
      light:    tl,
      pos:      { x: x, y: y + 1, z: z },
      watered:  false,
      destroyed: false
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     GHOST HORSE
  ──────────────────────────────────────────────────────────────────────────*/
  function _buildGhostHorse() {
    var hx = 8, hy = 0, hz = 5;

    // Body
    var body = _box(2.5, 1.2, 1, 0xCCDDCC, { opacity: 0.7, emissive: 0x334433, emissiveIntensity: 0.2 });
    body.position.set(hx, hy + 1.2, hz);
    _addMesh(body);

    // Neck
    var neck = _box(0.5, 0.9, 0.4, 0xBBCCBB, { opacity: 0.7 });
    neck.position.set(hx + 1.1, hy + 1.8, hz);
    _addMesh(neck);

    // Head
    var head = _box(0.9, 0.6, 0.6, 0xCCDDCC, { opacity: 0.7 });
    head.position.set(hx + 1.6, hy + 2.4, hz);
    _addMesh(head);

    // Legs (CylinderGeometry)
    var legOffsets = [
      { x: hx + 0.6, z: hz + 0.3 }, { x: hx + 0.6, z: hz - 0.3 },
      { x: hx - 0.6, z: hz + 0.3 }, { x: hx - 0.6, z: hz - 0.3 }
    ];
    var i;
    for (i = 0; i < 4; i++) {
      var leg = _cylinder(0.12, 0.12, 1, 6, 0xBBCCBB, { opacity: 0.7 });
      leg.position.set(legOffsets[i].x, hy + 0.5, legOffsets[i].z);
      _addMesh(leg);
    }

    // Tail
    var tail = _box(0.15, 0.8, 0.15, 0xCCDDCC, { opacity: 0.6 });
    tail.position.set(hx - 1.4, hy + 1.2, hz);
    tail.rotation.z = 0.4;
    _addMesh(tail);

    var ghostHorseGlow = new THREE.PointLight(0x44FF88, 0.4, 6);
    ghostHorseGlow.position.set(hx, hy + 2, hz);
    _addLight(ghostHorseGlow);

    _ghostHorse = { pos: { x: hx, y: hy, z: hz }, driftT: 0 };
  }

  /* ════════════════════════════════════════════════════════════════════════
     WRAITH SPAWNING
  ═══════════════════════════════════════════════════════════════════════════*/

  function _spawnWraith(x, y, z, speed) {
    var ws = speed || 2.5;

    // Wraith body (BoxGeometry, 0x445566)
    var body = _box(0.8, 1.6, 0.5, 0x445566, { opacity: 0.85, emissive: 0x223355, emissiveIntensity: 0.4 });
    body.position.set(x, y + 0.8, z);
    body.material.transparent = true;
    _scene.add(body);
    _sceneMeshes.push(body);

    // Hat (ConeGeometry — classic gunslinger hat silhouette)
    var hat = _cone(0.4, 0.6, 6, 0x223344);
    hat.position.set(x, y + 1.9, z);
    _scene.add(hat);
    _sceneMeshes.push(hat);

    // Ghost glow (PointLight 0x4466FF)
    var glow = new THREE.PointLight(0x4466FF, 0.8, 4);
    glow.position.set(x, y + 1, z);
    _scene.add(glow);
    _sceneLights.push(glow);

    var wraith = {
      mesh:      body,
      hat:       hat,
      light:     glow,
      pos:       { x: x, y: y + 0.8, z: z },
      hp:        80,
      alive:     true,
      speed:     ws,
      rageTimer: 0,       // time remaining in rage (3x speed)
      shootTimer: _rnd(2, 5),
      phaseTimer: _rnd(8, 15)
    };
    _wraiths.push(wraith);
    return wraith;
  }

  function _spawnAllWraiths() {
    var i;
    var positions = [
      // Around main street
      { x: -5,  z: 10  }, { x: 5,   z: 10  }, { x: -5,  z: -10 }, { x: 5,   z: -10 },
      { x: 0,   z: 20  }, { x: 0,   z: -20 },
      // Near saloon
      { x: -22, z: -15 }, { x: -18, z: -25 }, { x: -15, z: -18 },
      // Near sheriff
      { x: 20,  z: -5  }, { x: 22,  z: -15 }, { x: 16,  z: -18 },
      // Near store
      { x: -20, z: 12  }, { x: -15, z: 20  }, { x: -22, z: 22  },
      // Graveyard
      { x: -8,  z: 55  }, { x: 0,   z: 62  }, { x: 8,   z: 55  }, { x: 4,   z: 68  }, { x: -4, z: 68 },
      // Mine area
      { x: -38, z: -5  }, { x: -45, z: 5   }, { x: -35, z: 5   },
      // Church area
      { x: 28,  z: 25  }, { x: 22,  z: 35  }
    ];

    for (i = 0; i < positions.length && i < 25; i++) {
      _spawnWraith(positions[i].x, 0, positions[i].z, 2.5);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     OUTLAW KING (BOSS)
  ═══════════════════════════════════════════════════════════════════════════*/

  function _spawnOutlawKing() {
    var ox = 0, oy = 0, oz = 0;  // spawns center of town

    var body = _box(1.2, 2.4, 0.7, 0x222244, { emissive: 0x111133, emissiveIntensity: 0.5 });
    body.position.set(ox, oy + 1.2, oz);
    _scene.add(body);
    _sceneMeshes.push(body);

    var hat = _cone(0.6, 1.0, 6, 0x111122);
    hat.position.set(ox, oy + 2.9, oz);
    _scene.add(hat);
    _sceneMeshes.push(hat);

    var coat = _box(1.4, 2, 0.4, 0x1A1A33);
    coat.position.set(ox, oy + 0.7, oz);
    _scene.add(coat);
    _sceneMeshes.push(coat);

    var kingGlow = new THREE.PointLight(0x2233FF, 2.0, 10);
    kingGlow.position.set(ox, oy + 2, oz);
    _scene.add(kingGlow);
    _sceneLights.push(kingGlow);

    _outlawKing = {
      mesh:      body,
      hat:       hat,
      coat:      coat,
      light:     kingGlow,
      pos:       { x: ox, y: oy + 1.2, z: oz },
      hp:        600,
      alive:     true,
      spawned:   true,
      shootTimer: 1.5,
      chargeTimer: 0
    };
    _outlawStatus = 'AWAKENED';
    _showMsg('THE OUTLAW KING HAS RISEN! Face him in Dusthaven\'s main street!', 6);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION / INIT / RESET
  ═══════════════════════════════════════════════════════════════════════════*/

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');
    _registerInputs();
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

    _playerPos   = { x: 0, y: 1.7, z: 30 };
    _playerHP    = 100;
    _yaw         = Math.PI;   // face north (into town)
    _pitch       = 0;

    _regularAmmo   = 30;
    _silverBullets = 0;
    _silverOre     = 0;
    _holyWater     = 0;
    _totemWatered  = [];

    _totems          = [null, null, null, null];
    _totemsDestroyed = 0;
    _wraiths         = [];
    _outlawKing      = null;
    _outlawStatus    = 'DORMANT';
    _bullets         = [];
    _wraithShots     = [];
    _oreNodes        = [];
    _tumbleweeds     = [];
    _ghostHorse      = null;
    _holyFontMesh    = null;
    _sceneMeshes     = [];
    _sceneLights     = [];
    _shootCooldown   = 0;
    _regenTimer      = 0;
    _fontRefillCooldown = 0;

    _buildTown();
    _spawnAllWraiths();

    _showMsg('DUSTHAVEN, 1880 — Find holy water, destroy 4 totems, defeat the Outlaw King!', 6);
  }

  function _teardown() {
    if (!_active) return;
    _active  = false;
    _victory = false;
    _defeat  = false;

    var i;
    for (i = 0; i < _sceneMeshes.length; i++) _scene.remove(_sceneMeshes[i]);
    for (i = 0; i < _sceneLights.length; i++) _scene.remove(_sceneLights[i]);

    // Remove any bullet meshes/lights not in sceneMeshes/sceneLights
    for (i = 0; i < _bullets.length; i++) {
      _scene.remove(_bullets[i].mesh);
      if (_bullets[i].light) _scene.remove(_bullets[i].light);
    }
    for (i = 0; i < _wraithShots.length; i++) _scene.remove(_wraithShots[i].mesh);

    _sceneMeshes   = [];
    _sceneLights   = [];
    _bullets       = [];
    _wraithShots   = [];
    _wraiths       = [];
    _totems        = [null, null, null, null];
    _oreNodes      = [];
    _outlawKing    = null;
    _tumbleweeds   = [];
    _ghostHorse    = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════════*/

  function _registerInputs() {
    _boundKeyDown     = _onKeyDown.bind(this);
    _boundKeyUp       = _onKeyUp.bind(this);
    _boundMouseMove   = _onMouseMove.bind(this);
    _boundMouseDown   = _onMouseDown.bind(this);
    _boundMouseUp     = _onMouseUp.bind(this);
    _boundContextMenu = function (e) { e.preventDefault(); };

    document.addEventListener('keydown',     _boundKeyDown,     false);
    document.addEventListener('keyup',       _boundKeyUp,       false);
    document.addEventListener('mousemove',   _boundMouseMove,   false);
    document.addEventListener('mousedown',   _boundMouseDown,   false);
    document.addEventListener('mouseup',     _boundMouseUp,     false);
    document.addEventListener('contextmenu', _boundContextMenu, false);
  }

  function _onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    // G+T activation
    if (k === 'G' || k === 'T') {
      _gtPressTime[k] = performance.now();
      var other = (k === 'G') ? 'T' : 'G';
      if (_gtPressTime[other] && (performance.now() - _gtPressTime[other]) < GT_WINDOW) {
        _activate();
      }
    }

    if (!_active || _victory || _defeat) return;

    if (k === 'E') _handleInteract();
    if (k === 'F') _pourHolyWater();
    if (k === 'R') _reloadAmmo();
  }

  function _onKeyUp(e) {
    var k = e.key.toUpperCase();
    _keys[k] = false;
  }

  function _onMouseMove(e) {
    if (!_active || _victory || _defeat) return;
    var sens = 0.002;
    _yaw   -= e.movementX * sens;
    _pitch -= e.movementY * sens;
    _pitch  = _clamp(_pitch, -Math.PI / 3, Math.PI / 3);
  }

  function _onMouseDown(e) {
    _mouseDown = true;
    if (!_active || _victory || _defeat) return;
    if (e.button === 0) _fireBullet(false);   // regular
    if (e.button === 2) _fireBullet(true);    // silver
    if (_canvas && _canvas.requestPointerLock) _canvas.requestPointerLock();
  }

  function _onMouseUp() {
    _mouseDown = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ═══════════════════════════════════════════════════════════════════════════*/

  function _fireBullet(isSilver) {
    if (_shootCooldown > 0) return;

    if (isSilver) {
      if (_silverBullets <= 0) { _showMsg('No silver bullets! Collect 3 silver ore to craft.', 2); return; }
      _silverBullets--;
    } else {
      if (_regularAmmo <= 0) { _showMsg('Out of regular ammo! Press R to reload (if available).', 2); return; }
      _regularAmmo--;
    }

    _shootCooldown = 0.18;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var bColor = isSilver ? 0xDDDDFF : 0xFFDD66;
    var bMesh  = _sphere(0.06, 6, bColor);
    bMesh.position.set(_playerPos.x, _playerPos.y - 0.1, _playerPos.z);
    _scene.add(bMesh);

    var bLight = null;
    if (isSilver) {
      bLight = new THREE.PointLight(0xCCCCFF, 1.5, 3);
      bLight.position.copy(bMesh.position);
      _scene.add(bLight);
    }

    _bullets.push({
      mesh:     bMesh,
      light:    bLight,
      vel:      { x: dir.x * 60, y: dir.y * 60, z: dir.z * 60 },
      isSilver: isSilver,
      life:     1.5
    });
  }

  function _reloadAmmo() {
    _regularAmmo += 15;
    if (_regularAmmo > 60) _regularAmmo = 60;
    _showMsg('Reloaded — ' + _regularAmmo + ' rounds.', 1.5);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACT (E key) — pick up ore / holy water refill
  ═══════════════════════════════════════════════════════════════════════════*/

  function _handleInteract() {
    var i, item, d;
    var REACH = 3.0;

    // Silver ore pickup
    for (i = 0; i < _oreNodes.length; i++) {
      item = _oreNodes[i];
      if (!item.collected && _dist3(_playerPos, item.pos) < REACH) {
        item.collected = true;
        _scene.remove(item.mesh);
        _silverOre++;
        _showMsg('Silver ore collected (' + _silverOre + '/3). Collect 3 to auto-craft 12 silver bullets!', 3);
        // Auto-craft when 3 ore collected
        if (_silverOre >= 3) {
          _silverOre -= 3;
          _silverBullets += 12;
          _showMsg('12 SILVER BULLETS CRAFTED from ore! Wraiths beware!', 4);
        }
        return;
      }
    }

    // Holy water font refill
    if (_dist3(_playerPos, _holyFontPos) < REACH && _fontRefillCooldown <= 0) {
      _holyWater += 3;
      _fontRefillCooldown = 10;
      _showMsg('Holy water collected (' + _holyWater + ' vials). Press F near a watered totem to destroy it!', 4);
      return;
    }

    _showMsg('Nothing to interact with here.', 1.5);
  }

  /* ════════════════════════════════════════════════════════════════════════
     POUR HOLY WATER (F key) — on nearest totem if close
  ═══════════════════════════════════════════════════════════════════════════*/

  function _pourHolyWater() {
    if (_holyWater <= 0) { _showMsg('No holy water! Collect from the church font.', 2); return; }

    var REACH = 4.0;
    var i, t, d;
    for (i = 0; i < _totems.length; i++) {
      t = _totems[i];
      if (!t || t.destroyed) continue;
      d = _dist3(_playerPos, t.pos);
      if (d < REACH) {
        if (!t.watered) {
          _holyWater--;
          t.watered = true;
          t.mesh.material.emissive = new THREE.Color(0x0055FF);
          t.mesh.material.emissiveIntensity = 0.8;
          t.light.color.set(0x0055FF);
          _showMsg('Totem blessed with holy water! Now SHOOT it to destroy it!', 3);
        } else {
          _showMsg('Totem already blessed — shoot it to destroy it!', 2);
        }
        return;
      }
    }
    _showMsg('No totem in range. Get closer.', 2);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updatePlayer(dt) {
    var speed = _playerSpeed;
    var fwd = 0, right = 0;

    if (_keys['W'] || _keys['ARROWUP'])    fwd   -= 1;
    if (_keys['S'] || _keys['ARROWDOWN'])  fwd   += 1;
    if (_keys['A'] || _keys['ARROWLEFT'])  right -= 1;
    if (_keys['D'] || _keys['ARROWRIGHT']) right += 1;

    var sinY = Math.sin(_yaw), cosY = Math.cos(_yaw);
    var dx = (fwd * (-sinY) + right * cosY) * speed * dt;
    var dz = (fwd * (-cosY) + right * (-sinY)) * speed * dt;

    _playerPos.x += dx;
    _playerPos.z += dz;
    _playerPos.x  = _clamp(_playerPos.x, -80, 80);
    _playerPos.z  = _clamp(_playerPos.z, -50, 90);

    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y     = _yaw;
      _camera.rotation.x     = _pitch;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BULLET UPDATE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateBullets(dt) {
    var i, j, b, w, d, damage, toRemove;
    toRemove = [];

    for (i = 0; i < _bullets.length; i++) {
      b = _bullets[i];
      b.life -= dt;
      if (b.life <= 0) { toRemove.push(i); continue; }

      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      if (b.light) {
        b.light.position.copy(b.mesh.position);
      }

      var bpos = { x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z };

      // Check wraith hits
      var hit = false;
      for (j = 0; j < _wraiths.length; j++) {
        w = _wraiths[j];
        if (!w.alive) continue;
        d = _dist3(bpos, w.pos);
        if (d < 1.0) {
          damage = b.isSilver ? 80 * 1.5 : 80 * 0.5; // silver 1.5x, regular 0.5x
          w.hp -= damage;
          if (w.hp <= 0) {
            _killWraith(j);
          }
          hit = true;
          break;
        }
      }

      if (!hit && _outlawKing && _outlawKing.alive) {
        d = _dist3(bpos, _outlawKing.pos);
        if (d < 1.5) {
          damage = b.isSilver ? 40 * 1.5 : 40 * 0.5;
          _outlawKing.hp -= damage;
          if (_outlawKing.hp <= 0) _killOutlawKing();
          hit = true;
        }
      }

      // Check totem hits (only if watered)
      if (!hit) {
        var ti;
        for (ti = 0; ti < _totems.length; ti++) {
          var t = _totems[ti];
          if (!t || t.destroyed) continue;
          d = _dist3(bpos, t.pos);
          if (d < 1.0) {
            if (t.watered) {
              _destroyTotem(ti);
              hit = true;
            } else {
              _showMsg('Totem resists bullets! Pour holy water on it first!', 2);
              hit = true;
            }
            break;
          }
        }
      }

      if (hit) toRemove.push(i);
    }

    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      if (_bullets[idx]) {
        _scene.remove(_bullets[idx].mesh);
        if (_bullets[idx].light) _scene.remove(_bullets[idx].light);
        _bullets.splice(idx, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WRAITH UPDATE / AI
  ═══════════════════════════════════════════════════════════════════════════*/

  function _killWraith(index) {
    var w = _wraiths[index];
    if (!w || !w.alive) return;
    w.alive = false;
    _scene.remove(w.mesh);
    _scene.remove(w.hat);
    _scene.remove(w.light);
    _showMsg('Wraith banished!', 1.5);
  }

  function _updateWraiths(dt) {
    var i, w, dx, dz, dl, spd, now;
    _regenTimer += dt;
    var doRegen = _regenTimer >= 1.0;
    if (doRegen) _regenTimer = 0;

    now = performance.now();

    for (i = 0; i < _wraiths.length; i++) {
      w = _wraiths[i];
      if (!w.alive) continue;

      // HP regen — 5HP/s
      if (doRegen) {
        w.hp = Math.min(80, w.hp + 5);
      }

      // Rage timer
      if (w.rageTimer > 0) {
        w.rageTimer -= dt;
        spd = w.speed * 3;
      } else {
        spd = w.speed;
      }

      // Move toward player
      dx = _playerPos.x - w.pos.x;
      dz = _playerPos.z - w.pos.z;
      dl = Math.sqrt(dx * dx + dz * dz) || 1;

      w.pos.x += (dx / dl) * spd * dt;
      w.pos.z += (dz / dl) * spd * dt;

      // Phase teleport (pass through walls)
      w.phaseTimer -= dt;
      if (w.phaseTimer <= 0) {
        w.phaseTimer = _rnd(8, 15);
        // Teleport to a position 15 units closer to player
        var teleportDist = Math.max(0, dl - 15);
        w.pos.x = _playerPos.x - (dx / dl) * teleportDist;
        w.pos.z = _playerPos.z - (dz / dl) * teleportDist;
      }

      w.mesh.position.set(w.pos.x, w.pos.y, w.pos.z);
      w.hat.position.set(w.pos.x, w.pos.y + 1.1, w.pos.z);
      w.light.position.set(w.pos.x, w.pos.y, w.pos.z);

      // Pulse glow
      w.light.intensity = 0.6 + 0.4 * Math.abs(Math.sin(now * 0.002 + i));

      // Shoot at player
      w.shootTimer -= dt;
      if (w.shootTimer <= 0) {
        w.shootTimer = _rnd(3, 7);
        d_shootWraith(w);
      }

      // Melee damage
      var dist = _dist3(_playerPos, w.pos);
      if (dist < 1.8) {
        _playerHP -= 12 * dt;
        if (_playerHP <= 0 && !_defeat) _triggerDefeat();
      }
    }
  }

  function d_shootWraith(w) {
    var dx = _playerPos.x - w.pos.x;
    var dy = _playerPos.y - w.pos.y;
    var dz = _playerPos.z - w.pos.z;
    var dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    var sm = _sphere(0.1, 6, 0x4466FF, { opacity: 0.9, emissive: 0x2233AA });
    sm.material.transparent = true;
    sm.position.set(w.pos.x, w.pos.y, w.pos.z);
    _scene.add(sm);

    _wraithShots.push({
      mesh:   sm,
      vel:    { x: (dx / dl) * 18, y: (dy / dl) * 18, z: (dz / dl) * 18 },
      life:   2.5,
      damage: 15
    });
  }

  function _updateWraithShots(dt) {
    var i, s, d, toRemove;
    toRemove = [];

    for (i = 0; i < _wraithShots.length; i++) {
      s = _wraithShots[i];
      s.life -= dt;
      if (s.life <= 0) { toRemove.push(i); continue; }

      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.y += s.vel.y * dt;
      s.mesh.position.z += s.vel.z * dt;

      d = _dist3(_playerPos, {
        x: s.mesh.position.x,
        y: s.mesh.position.y,
        z: s.mesh.position.z
      });
      if (d < 1.2) {
        _playerHP -= s.damage;
        if (_playerHP <= 0 && !_defeat) _triggerDefeat();
        _showMsg('Shot by a wraith! HP: ' + Math.max(0, Math.floor(_playerHP)), 1.5);
        toRemove.push(i);
      }
    }

    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      if (_wraithShots[idx]) {
        _scene.remove(_wraithShots[idx].mesh);
        _wraithShots.splice(idx, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TOTEM DESTRUCTION
  ═══════════════════════════════════════════════════════════════════════════*/

  function _destroyTotem(index) {
    var t = _totems[index];
    if (!t || t.destroyed) return;
    t.destroyed = true;
    _scene.remove(t.mesh);
    _scene.remove(t.light);
    _totemsDestroyed++;

    _showMsg('TOTEM DESTROYED! (' + _totemsDestroyed + '/4) — Wraiths enrage!', 4);

    // Rage-spawn 4 wraiths at 3x speed for 10s
    var i, nx, nz;
    for (i = 0; i < 4; i++) {
      nx = t.pos.x + _rnd(-5, 5);
      nz = t.pos.z + _rnd(-5, 5);
      var rw = _spawnWraith(nx, 0, nz, 2.5);
      rw.rageTimer = 10;
    }

    // Additionally, rage all surviving wraiths for 10s
    for (i = 0; i < _wraiths.length; i++) {
      if (_wraiths[i].alive) _wraiths[i].rageTimer = 10;
    }

    // All 4 totems destroyed — awaken Outlaw King
    if (_totemsDestroyed >= 4 && !_outlawKing) {
      _spawnOutlawKing();
    }

    // Check victory
    _checkVictory();
  }

  /* ════════════════════════════════════════════════════════════════════════
     OUTLAW KING AI
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateOutlawKing(dt) {
    if (!_outlawKing || !_outlawKing.alive) return;
    var ok = _outlawKing;

    // Move toward player
    var dx = _playerPos.x - ok.pos.x;
    var dz = _playerPos.z - ok.pos.z;
    var dl = Math.sqrt(dx * dx + dz * dz) || 1;
    var spd = 4.0;

    ok.pos.x += (dx / dl) * spd * dt;
    ok.pos.z += (dz / dl) * spd * dt;

    ok.mesh.position.set(ok.pos.x, ok.pos.y, ok.pos.z);
    ok.hat.position.set(ok.pos.x, ok.pos.y + 1.7, ok.pos.z);
    ok.coat.position.set(ok.pos.x, ok.pos.y - 0.3, ok.pos.z);
    ok.light.position.set(ok.pos.x, ok.pos.y + 0.8, ok.pos.z);

    // Pulse intensely
    ok.light.intensity = 1.5 + 0.8 * Math.sin(performance.now() * 0.003);

    // Shoot volley
    ok.shootTimer -= dt;
    if (ok.shootTimer <= 0) {
      ok.shootTimer = 1.2;
      // 3-shot spread
      var angles = [-0.2, 0, 0.2];
      var i, a, ddx, ddz;
      for (i = 0; i < angles.length; i++) {
        a    = Math.atan2(dx, dz) + angles[i];
        ddx  = Math.sin(a);
        ddz  = Math.cos(a);
        var km = _sphere(0.12, 6, 0x5566FF, { opacity: 0.9 });
        km.material.transparent = true;
        km.position.set(ok.pos.x, ok.pos.y, ok.pos.z);
        _scene.add(km);
        _wraithShots.push({ mesh: km, vel: { x: ddx * 22, y: 0, z: ddz * 22 }, life: 2, damage: 25 });
      }
    }

    // Melee charge
    var dist = _dist3(_playerPos, ok.pos);
    if (dist < 2.5) {
      _playerHP -= 30 * dt;
      if (_playerHP <= 0 && !_defeat) _triggerDefeat();
    }
  }

  function _killOutlawKing() {
    if (!_outlawKing) return;
    _outlawKing.alive = false;
    _scene.remove(_outlawKing.mesh);
    _scene.remove(_outlawKing.hat);
    _scene.remove(_outlawKing.coat);
    _scene.remove(_outlawKing.light);
    _outlawStatus = 'DEFEATED';
    _showMsg('THE OUTLAW KING IS DEFEATED! Dusthaven is free!', 999);
    _checkVictory();
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _checkVictory() {
    if (_totemsDestroyed >= 4 && _outlawStatus === 'DEFEATED') {
      _victory = true;
      _showMsg('DUSTHAVEN IS SAVED! The curse is lifted. Sheriff, you are a legend.', 999);
    }
  }

  function _triggerDefeat() {
    _defeat = true;
    _showMsg('THE SHERIFF HAS FALLEN. The wraiths of Dusthaven walk forever...', 999);
  }

  /* ════════════════════════════════════════════════════════════════════════
     TUMBLEWEEDS + GHOST HORSE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateTumbleweeds(dt) {
    var i, tw;
    for (i = 0; i < _tumbleweeds.length; i++) {
      tw = _tumbleweeds[i];
      tw.pos.x += tw.vel.x * dt;
      tw.pos.z += tw.vel.z * dt;
      if (tw.pos.x > 80 || tw.pos.x < -80) tw.vel.x *= -1;
      if (tw.pos.z > 90 || tw.pos.z < -50) tw.vel.z *= -1;
      tw.mesh.position.set(tw.pos.x, 0.4, tw.pos.z);
      tw.mesh.rotation.x += tw.rotSpeed * dt;
      tw.mesh.rotation.z += tw.rotSpeed * 0.7 * dt;
    }
  }

  function _updateGhostHorse(dt) {
    if (!_ghostHorse) return;
    _ghostHorse.driftT += dt * 0.5;
    // Gently wander in figure-8
    _ghostHorse.pos.x = 8 + Math.sin(_ghostHorse.driftT) * 6;
    _ghostHorse.pos.z = 5 + Math.sin(_ghostHorse.driftT * 2) * 4;
  }

  /* ════════════════════════════════════════════════════════════════════════
     COOLDOWNS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateCooldowns(dt) {
    if (_shootCooldown > 0) _shootCooldown = Math.max(0, _shootCooldown - dt);
    if (_fontRefillCooldown > 0) _fontRefillCooldown = Math.max(0, _fontRefillCooldown - dt);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════*/

  function _drawHUD() {
    var el = document.getElementById('gt-hud');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gt-hud';
      el.style.cssText = [
        'position:fixed',
        'top:12px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:#DDCCAA',
        'font:bold 13px monospace',
        'padding:6px 14px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(el);
    }

    if (!_active) { el.style.display = 'none'; return; }
    el.style.display = 'block';

    var aliveWraiths = 0;
    var i;
    for (i = 0; i < _wraiths.length; i++) {
      if (_wraiths[i].alive) aliveWraiths++;
    }

    var hpColor = _playerHP > 60 ? '#88FF88' : _playerHP > 30 ? '#FFDD44' : '#FF4444';
    var okColor = _outlawStatus === 'DEFEATED' ? '#88FF88' : _outlawStatus === 'AWAKENED' ? '#FF4444' : '#FFDD44';

    el.innerHTML =
      'GHOST TOWN &nbsp;|&nbsp; ' +
      '[TOTEMS: <span style="color:#FF8833">' + _totemsDestroyed + '/4 DESTROYED</span>] ' +
      '[SILVER BULLETS: <span style="color:#CCCCFF">' + _silverBullets + '</span>] ' +
      '[WRAITHS: <span style="color:#4466FF">' + aliveWraiths + '</span>] ' +
      '[OUTLAW KING: <span style="color:' + okColor + '">' + _outlawStatus + '</span>] ' +
      '[HOLY WATER: <span style="color:#AADDFF">' + _holyWater + '</span>] ' +
      '&nbsp;|&nbsp; HP: <span style="color:' + hpColor + '">' + Math.max(0, Math.floor(_playerHP)) + '</span>' +
      '&nbsp; AMMO: ' + _regularAmmo +
      '&nbsp; ORE: ' + _silverOre;

    // Message bar
    var mel = document.getElementById('gt-msg');
    if (!mel) {
      mel = document.createElement('div');
      mel.id = 'gt-msg';
      mel.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.82)',
        'color:#FFEECC',
        'font:bold 14px monospace',
        'padding:5px 16px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'max-width:80vw',
        'text-align:center'
      ].join(';');
      document.body.appendChild(mel);
    }
    mel.style.display = (_msgTimer > 0) ? 'block' : 'none';
    mel.textContent   = _msgText;

    // Low HP vignette
    var oe = document.getElementById('gt-overlay');
    if (!oe) {
      oe = document.createElement('div');
      oe.id = 'gt-overlay';
      oe.style.cssText = [
        'position:fixed',
        'inset:0',
        'pointer-events:none',
        'z-index:9998'
      ].join(';');
      document.body.appendChild(oe);
    }
    if (_playerHP < 30 && !_defeat) {
      var alpha = ((30 - _playerHP) / 30 * 0.5).toFixed(2);
      oe.style.boxShadow = 'inset 0 0 100px 40px rgba(200,0,0,' + alpha + ')';
      oe.style.background = 'transparent';
    } else if (_defeat) {
      oe.style.background = 'rgba(80,0,0,0.55)';
      oe.style.boxShadow  = 'none';
    } else {
      oe.style.boxShadow  = 'none';
      oe.style.background = 'transparent';
    }

    // Controls hint
    var ce = document.getElementById('gt-controls');
    if (!ce) {
      ce = document.createElement('div');
      ce.id = 'gt-controls';
      ce.style.cssText = [
        'position:fixed',
        'bottom:12px',
        'left:12px',
        'background:rgba(0,0,0,0.65)',
        'color:#AAAAAA',
        'font:11px monospace',
        'padding:5px 10px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'line-height:1.6'
      ].join(';');
      ce.innerHTML = 'WASD: Move | Mouse: Look | LClick: Regular Bullet | RClick: Silver Bullet<br>E: Interact/Collect | F: Pour holy water on totem | R: Reload';
      document.body.appendChild(ce);
    }
    ce.style.display = _active ? 'block' : 'none';

    // Win/lose screen
    var we = document.getElementById('gt-winlose');
    if (!we) {
      we = document.createElement('div');
      we.id = 'gt-winlose';
      we.style.cssText = [
        'position:fixed',
        'inset:0',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'pointer-events:none',
        'z-index:10000'
      ].join(';');
      document.body.appendChild(we);
    }
    if (_victory || _defeat) {
      var bg   = _victory ? 'rgba(0,30,0,0.88)' : 'rgba(40,0,0,0.88)';
      var col  = _victory ? '#88FF88'            : '#FF4444';
      var head = _victory ? 'DUSTHAVEN SAVED!'   : 'THE SHERIFF FALLS';
      we.style.display = 'flex';
      we.innerHTML = '<div style="background:' + bg + ';border:2px solid ' + col +
        ';padding:40px 60px;border-radius:8px;text-align:center;font-family:monospace">' +
        '<div style="font-size:30px;color:' + col + ';font-weight:bold">' + head + '</div>' +
        '<div style="color:#DDCCBB;font-size:15px;margin-top:14px;max-width:480px">' + _msgText + '</div>' +
        '<div style="color:#888;font-size:13px;margin-top:20px">G+T to restart</div></div>';
    } else {
      we.style.display = 'none';
      we.innerHTML = '';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ═══════════════════════════════════════════════════════════════════════════*/

  function update(dt) {
    if (!_active) return;
    if (dt > 0.1) dt = 0.1;

    _msgTimer = Math.max(0, _msgTimer - dt);

    if (_victory || _defeat) {
      _drawHUD();
      return;
    }

    _updateCooldowns(dt);
    _updatePlayer(dt);
    _updateBullets(dt);
    _updateWraiths(dt);
    _updateWraithShots(dt);
    _updateOutlawKing(dt);
    _updateTumbleweeds(dt);
    _updateGhostHorse(dt);

    _drawHUD();
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
