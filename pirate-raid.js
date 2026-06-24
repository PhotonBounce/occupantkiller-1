/* ───────────────────────────────────────────────────────────────────────────
   pirate-raid.js — Pirate Raid: Board & Plunder a Spanish Treasure Galleon
   API: window.PirateRaid = { init, update, reset }
   Controls:
     P + R (simultaneous, 400ms) → activate module
     W/A/S/D                     → move player
     Mouse                       → look (pointer lock)
     Space                       → fire musket (2.5s reload)
     E                           → pick up / transfer chest
     Q                           → drop chest
     F                           → use powder keg / cut rope
   ─────────────────────────────────────────────────────────────────────────── */
window.PirateRaid = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active       = false;
  var _keysDown     = {};
  var _pPressTime   = 0;
  var _rPressTime   = 0;
  var _COMBO_WINDOW = 400;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _gameOver        = false;
  var _gameWon         = false;
  var _timeRemaining   = 600; // 10 minutes in seconds
  var _navyArrived     = false;
  var _navyVisible     = false; // appears at 5 min (300s left)

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerHP         = 150;
  var _playerMaxHP      = 150;
  var _playerPos        = { x: -55, y: 6, z: 0 };
  var _playerVel        = { x: 0, y: 0, z: 0 };
  var _playerYaw        = 0;   // look left/right
  var _playerPitch      = 0;   // look up/down
  var _playerSpeed      = 7;
  var _playerOnWater    = false;
  var _musketLoaded     = true;
  var _musketCooldown   = 0;
  var _MUSKET_RELOAD    = 2.5;
  var _carryingChest    = -1;  // index of held chest (-1=none)
  var _chestsAboard     = 0;   // chests transferred to pirate ship

  /* ── Mouse look ────────────────────────────────────────────────────────── */
  var _mouseDX = 0;
  var _mouseDY = 0;
  var _pointerLocked = false;

  /* ── Ships ─────────────────────────────────────────────────────────────── */
  var _pirateShip  = null; // player's ship, starts at x=-65
  var _galleon     = null; // enemy galleon, x=0
  var _navyFrigate = null; // appears at 5 min, x=200 initially

  /* ── Ocean ─────────────────────────────────────────────────────────────── */
  var _ocean       = null;
  var _rockTime    = 0;
  var _ROCK_AMP    = 0.035;
  var _ROCK_FREQ   = 0.18;

  /* ── Rope bridges (3 ropes) ────────────────────────────────────────────── */
  var _ropeLines   = []; // [{line, pts, active, anchorPt}]

  /* ── Treasure chests ────────────────────────────────────────────────────── */
  var _chests = []; // {mesh, light, isDecoy, collected, worldPos:{x,y,z}}

  /* ── Powder kegs ────────────────────────────────────────────────────────── */
  var _kegs = []; // {mesh, worldPos:{x,y,z}, exploded}

  /* ── Masts ──────────────────────────────────────────────────────────────── */
  var _masts      = []; // {mesh, ropes:[LineSegments], toppled, deckLevel}
  var _mastRopes  = []; // LineSegments refs for topple ropes

  /* ── Cannon ports (LineSegments) ────────────────────────────────────────── */
  var _cannonPortLines = [];

  /* ── Soldiers ───────────────────────────────────────────────────────────── */
  var _soldiers = []; // {mesh, hp, deckLevel, alive, fireTimer, fireCD, isCapt}

  /* ── Captain (boss) ─────────────────────────────────────────────────────── */
  var _captain     = null;
  var _captainHP   = 300;
  var _captainMaxHP= 300;
  var _captainAlive= true;
  var _captainFireTimer = 0;
  var _captainMeleeTimer= 0;
  var _captainShotFired = false;

  /* ── Projectiles ────────────────────────────────────────────────────────── */
  var _bullets = []; // {mesh, vel:{x,y,z}, age, fromEnemy}

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  var _hudEl = null;

  /* ── Lights to clean up ─────────────────────────────────────────────────── */
  var _lights = [];

  /* ── Deck definitions for soldier/chest placement ──────────────────────── */
  // deckLevel: 0=upper, 1=gun, 2=cargo, 3=cabin
  var _deckY = [5, 1, -3, 1.5]; // relative Y from galleon origin

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _makeMat(color, emissive) {
    var opts = { color: color };
    if (emissive !== undefined) { opts.emissive = emissive; }
    return new THREE.MeshLambertMaterial(opts);
  }

  function _makeBox(w, h, d, color, emissive) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = _makeMat(color, emissive);
    return new THREE.Mesh(geo, mat);
  }

  function _makeCyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _makeSphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 6, 6);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _makeLine(pts, color) {
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _v3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _addLight(type, color, intensity, distance, x, y, z) {
    var light;
    if (type === 'point') {
      light = new THREE.PointLight(color, intensity, distance);
    } else {
      light = new THREE.AmbientLight(color, intensity);
    }
    if (x !== undefined) { light.position.set(x, y, z); }
    _scene.add(light);
    _lights.push(light);
    return light;
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — OCEAN
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildOcean() {
    var mesh = _makeBox(400, 1, 200, 0x224466);
    mesh.position.set(0, -1.5, 0);
    _scene.add(mesh);
    _ocean = mesh;
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — PIRATE SHIP (player's ship)
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildPirateShip() {
    var g = new THREE.Group();

    // hull
    var hull = _makeBox(40, 7, 16, 0x553322);
    hull.position.set(0, 0, 0);
    g.add(hull);

    // deck railing
    var railF = _makeBox(40, 1, 0.4, 0x442211);
    railF.position.set(0, 3.7, 8.2);
    g.add(railF);
    var railB = _makeBox(40, 1, 0.4, 0x442211);
    railB.position.set(0, 3.7, -8.2);
    g.add(railB);

    // mast
    var mast = _makeCyl(0.5, 0.6, 18, 8, 0x664422);
    mast.position.set(2, 12.5, 0);
    g.add(mast);

    // boarding transfer zone marker
    var zone = _makeBox(5, 0.2, 5, 0xFFDD00);
    zone.position.set(18, 3.6, 0);
    g.add(zone);

    g.position.set(-65, 2, 0);
    _scene.add(g);
    _pirateShip = g;
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — GALLEON (enemy ship)
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildGalleon() {
    var g = new THREE.Group();

    // ── Main hull ──
    var hull = _makeBox(60, 8, 20, 0x886644);
    hull.position.set(0, 0, 0);
    g.add(hull);

    // hull keel/bottom
    var keel = _makeBox(58, 2, 18, 0x775533);
    keel.position.set(0, -5, 0);
    g.add(keel);

    // ── Upper deck (open, y≈4) ──
    _buildUpperDeck(g);

    // ── Gun deck (enclosed, y≈0) ──
    _buildGunDeck(g);

    // ── Cargo hold (below gun deck, y≈-4) ──
    _buildCargoHold(g);

    // ── Captain's cabin (stern, y≈2) ──
    _buildCaptainCabin(g);

    // ── Masts ──
    _buildGalleonMasts(g);

    g.position.set(0, 2, 0);
    _scene.add(g);
    _galleon = g;
  }

  function _buildUpperDeck(g) {
    // 5 cannons on upper deck
    var i, cx, cannon;
    for (i = 0; i < 5; i++) {
      cx = -20 + i * 10;
      cannon = _makeCyl(0.5, 0.7, 3, 8, 0x445533);
      cannon.rotation.z = Math.PI / 2;
      cannon.position.set(cx, 4.5, 7);
      g.add(cannon);
      // cannon base
      var base = _makeBox(1.5, 1, 1.5, 0x334422);
      base.position.set(cx, 4, 7);
      g.add(base);
    }
  }

  function _buildGunDeck(g) {
    // gun deck floor
    var floor = _makeBox(55, 4, 18, 0x775533);
    floor.position.set(-1, -2, 0);
    g.add(floor);

    // 12 cannon ports as LineSegments (6 per side)
    var i, pts, line, px;
    for (i = 0; i < 6; i++) {
      px = -22 + i * 9;
      // port side
      pts = [
        _v3(px - 1.2, -1, 9), _v3(px + 1.2, -1, 9),
        _v3(px + 1.2, -1, 9), _v3(px + 1.2, 1, 9),
        _v3(px + 1.2, 1, 9),  _v3(px - 1.2, 1, 9),
        _v3(px - 1.2, 1, 9),  _v3(px - 1.2, -1, 9)
      ];
      line = _makeLine(pts, 0x222211);
      g.add(line);
      _cannonPortLines.push(line);

      // starboard
      pts = [
        _v3(px - 1.2, -1, -9), _v3(px + 1.2, -1, -9),
        _v3(px + 1.2, -1, -9), _v3(px + 1.2, 1, -9),
        _v3(px + 1.2, 1, -9),  _v3(px - 1.2, 1, -9),
        _v3(px - 1.2, 1, -9),  _v3(px - 1.2, -1, -9)
      ];
      line = _makeLine(pts, 0x222211);
      g.add(line);
      _cannonPortLines.push(line);
    }
  }

  function _buildCargoHold(g) {
    // cargo hold structure
    var floor = _makeBox(50, 4, 16, 0x665522);
    floor.position.set(-2, -6, 0);
    g.add(floor);

    // hatch cover
    var hatch = _makeBox(6, 0.3, 6, 0x554411);
    hatch.position.set(-5, -3.9, 0);
    g.add(hatch);

    // 5 treasure chests
    var i, mesh, light, isDecoy, wx, wy, wz;
    var chestPositions = [
      {x: -18, z: -4}, {x: -10, z: 4}, {x: -2, z: -5},
      {x: 6,  z: 3},  {x: 14, z: -3}
    ];

    for (i = 0; i < 5; i++) {
      isDecoy = (i === 2); // third chest is decoy
      if (isDecoy) {
        mesh = _makeBox(1.6, 1.2, 1.2, 0x774411);
        light = null;
      } else {
        mesh = _makeBox(1.6, 1.2, 1.2, 0x997722);
        light = new THREE.PointLight(0xFFAA00, 1.5, 6);
        light.position.set(
          chestPositions[i].x,
          -5.5,
          chestPositions[i].z
        );
        g.add(light);
        _lights.push(light);
      }
      mesh.position.set(chestPositions[i].x, -5.5, chestPositions[i].z);
      g.add(mesh);

      // world position relative to galleon (galleon at x=0,y=2,z=0)
      wx = chestPositions[i].x;
      wy = -5.5 + 2; // +galleon.y
      wz = chestPositions[i].z;

      _chests.push({
        mesh: mesh,
        light: light,
        isDecoy: isDecoy,
        collected: false,
        worldPos: { x: wx, y: wy, z: wz }
      });
    }
  }

  function _buildCaptainCabin(g) {
    // cabin at stern
    var cabin = _makeBox(12, 5, 10, 0x776644);
    cabin.position.set(22, 2.5, 0);
    g.add(cabin);

    // windows (LineSegments)
    var i, pts, line;
    for (i = 0; i < 3; i++) {
      pts = [
        _v3(18, 3 + i * 0.5, 5),  _v3(18, 4 + i * 0.5, 5),
        _v3(18, 4 + i * 0.5, 5),  _v3(19, 4 + i * 0.5, 5),
        _v3(19, 4 + i * 0.5, 5),  _v3(19, 3 + i * 0.5, 5),
        _v3(19, 3 + i * 0.5, 5),  _v3(18, 3 + i * 0.5, 5)
      ];
      line = _makeLine(pts, 0x88AACC);
      g.add(line);
    }

    // navigation charts (flat boxes)
    var chart = _makeBox(3, 0.1, 2, 0xDDCC99);
    chart.position.set(22, 5.1, -1);
    g.add(chart);

    var chart2 = _makeBox(2, 0.1, 1.5, 0xCCBB88);
    chart2.position.set(23, 5.15, 1);
    g.add(chart2);
  }

  function _buildGalleonMasts(g) {
    var mastDefs = [
      { x: -10, h: 22 },
      { x:   5, h: 26 },
      { x:  18, h: 18 }
    ];

    var i, j, mast, ropeLines, pts, line;
    for (i = 0; i < mastDefs.length; i++) {
      mast = _makeCyl(0.45, 0.6, mastDefs[i].h, 8, 0x886633);
      mast.position.set(mastDefs[i].x, mastDefs[i].h / 2 + 4, 0);
      g.add(mast);

      ropeLines = [];
      // rigging ropes (LineSegments) - 4 ropes per mast
      for (j = 0; j < 4; j++) {
        var angle = (j / 4) * Math.PI * 2;
        var rx = Math.cos(angle) * 8;
        var rz = Math.sin(angle) * 5;
        pts = [
          _v3(mastDefs[i].x, mastDefs[i].h + 4, 0),
          _v3(mastDefs[i].x + rx, 4.5, rz)
        ];
        line = _makeLine(pts, 0x776644);
        g.add(line);
        ropeLines.push(line);
        _mastRopes.push(line);
      }

      _masts.push({
        mesh: mast,
        ropes: ropeLines,
        toppled: false,
        baseX: mastDefs[i].x,
        baseH: mastDefs[i].h
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — ROPE BRIDGES (grappling hooks already thrown)
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildRopeBridges() {
    // 3 rope bridges between pirate ship (-65+20=-45) and galleon (-30)
    var offsets = [-5, 0, 5];
    var i, pts, line;
    for (i = 0; i < 3; i++) {
      // anchor points
      pts = [
        _v3(-45, 5, offsets[i]),
        _v3(-30, 5, offsets[i])
      ];
      line = _makeLine(pts, 0x886633);
      _scene.add(line);

      // catenary sag rope (3 segments)
      var sagPts = [
        _v3(-45, 5, offsets[i]),
        _v3(-40, 3.5, offsets[i]),
        _v3(-35, 3, offsets[i]),
        _v3(-30, 5, offsets[i])
      ];
      var sagLine = _makeLine(sagPts, 0x664422);
      _scene.add(sagLine);

      _ropeLines.push({
        line: line,
        sagLine: sagLine,
        pts: pts,
        sagPts: sagPts,
        active: true,
        offsetZ: offsets[i]
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — SOLDIERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildSoldiers() {
    var i, mesh, barrel, bpos, sx, sz, deckY;

    // ── Upper deck: 8 soldiers ──
    var upperPositions = [
      {x:-20,z:-5},{x:-12,z:6},{x:-4,z:-6},{x:4,z:5},
      {x:12,z:-5},{x:18,z:6},{x:-8,z:0},{x:8,z:0}
    ];
    for (i = 0; i < 8; i++) {
      sx = upperPositions[i].x;
      sz = upperPositions[i].z;
      deckY = 7;
      mesh = _makeBox(1.2, 2.2, 1.2, 0x884422);
      mesh.position.set(sx, deckY, sz);
      _galleon.add(mesh);

      // musket barrel LineSegments
      barrel = _makeLine([_v3(0, 0.8, 0), _v3(0, 0.8, 1.8)], 0x333333);
      mesh.add(barrel);

      _soldiers.push({
        mesh: mesh,
        hp: 70, maxHp: 70,
        deckLevel: 0,
        alive: true,
        fireTimer: Math.random() * 3,
        fireCD: 2.5 + Math.random() * 1.5,
        isCapt: false,
        worldX: sx,
        worldZ: sz,
        worldY: deckY + 2
      });
    }

    // ── Gun deck: 10 soldiers ──
    var gunPositions = [
      {x:-22,z:-5},{x:-14,z:5},{x:-6,z:-4},{x:2,z:4},{x:10,z:-5},
      {x:-18,z:0},{x:-2,z:0},{x:14,z:4},{x:-10,z:-3},{x:6,z:3}
    ];
    for (i = 0; i < 10; i++) {
      sx = gunPositions[i].x;
      sz = gunPositions[i].z;
      deckY = 1;
      mesh = _makeBox(1.2, 2.2, 1.2, 0x884422);
      mesh.position.set(sx, deckY, sz);
      _galleon.add(mesh);

      barrel = _makeLine([_v3(0, 0.8, 0), _v3(0, 0.8, 1.8)], 0x333333);
      mesh.add(barrel);

      _soldiers.push({
        mesh: mesh,
        hp: 70, maxHp: 70,
        deckLevel: 1,
        alive: true,
        fireTimer: Math.random() * 3,
        fireCD: 2.5 + Math.random() * 1.5,
        isCapt: false,
        worldX: sx,
        worldZ: sz,
        worldY: deckY + 2
      });
    }

    // ── Cargo hold: 8 soldiers ──
    var cargoPositions = [
      {x:-22,z:-4},{x:-14,z:4},{x:-6,z:-4},{x:2,z:4},
      {x:-18,z:0},{x:-2,z:0},{x:10,z:-4},{x:6,z:4}
    ];
    for (i = 0; i < 8; i++) {
      sx = cargoPositions[i].x;
      sz = cargoPositions[i].z;
      deckY = -5;
      mesh = _makeBox(1.2, 2.2, 1.2, 0x884422);
      mesh.position.set(sx, deckY, sz);
      _galleon.add(mesh);

      barrel = _makeLine([_v3(0, 0.8, 0), _v3(0, 0.8, 1.8)], 0x333333);
      mesh.add(barrel);

      _soldiers.push({
        mesh: mesh,
        hp: 70, maxHp: 70,
        deckLevel: 2,
        alive: true,
        fireTimer: Math.random() * 3,
        fireCD: 2.5 + Math.random() * 1.5,
        isCapt: false,
        worldX: sx,
        worldZ: sz,
        worldY: deckY + 2
      });
    }

    // ── Captain's cabin: captain (BOSS) ──
    mesh = _makeBox(1.4, 2.4, 1.4, 0x662211);
    mesh.position.set(22, 3.5, 0);
    _galleon.add(mesh);

    // rapier (LineSegments)
    var rapier = _makeLine([_v3(0.7, 0.5, 0), _v3(0.7, 0.5, 2.2)], 0x888899);
    mesh.add(rapier);

    _captain = {
      mesh: mesh,
      hp: 300, maxHp: 300,
      alive: true,
      fireTimer: 0,
      fireCD: 0.5,
      isCapt: true,
      shotFired: false,
      worldX: 22,
      worldZ: 0,
      worldY: 5.5
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — POWDER KEGS
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildKegs() {
    var positions = [
      {x: -18, y: 2, z: 6},   // upper deck
      {x:  5,  y: 2, z: -6},  // upper deck
      {x: -10, y: -2, z: 4},  // gun deck
      {x:  8,  y: -6, z: -4}  // cargo
    ];

    var i, mesh, keg;
    for (i = 0; i < positions.length; i++) {
      mesh = _makeBox(1.2, 1.5, 1.2, 0x443322);
      mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
      _galleon.add(mesh);

      // keg hoops (LineSegments)
      var hoop1 = _makeLine([
        _v3(-0.65, 0.3, 0), _v3(0, 0.3, 0.65),
        _v3(0, 0.3, 0.65),  _v3(0.65, 0.3, 0),
        _v3(0.65, 0.3, 0),  _v3(0, 0.3, -0.65),
        _v3(0, 0.3, -0.65), _v3(-0.65, 0.3, 0)
      ], 0x665544);
      mesh.add(hoop1);

      _kegs.push({
        mesh: mesh,
        worldPos: {
          x: positions[i].x,
          y: positions[i].y + 2,
          z: positions[i].z
        },
        exploded: false
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — NAVY FRIGATE (appears on horizon)
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildNavyFrigate() {
    var g = new THREE.Group();

    var hull = _makeBox(45, 7, 14, 0x334466);
    hull.position.set(0, 0, 0);
    g.add(hull);

    var mast = _makeCyl(0.4, 0.5, 20, 8, 0x445577);
    mast.position.set(0, 13, 0);
    g.add(mast);

    // Royal Navy flag (box)
    var flag = _makeBox(3, 2, 0.1, 0xCC2222);
    flag.position.set(2, 24, 0);
    g.add(flag);

    g.position.set(200, 2, -80); // far on horizon
    g.visible = false;
    _scene.add(g);
    _navyFrigate = g;
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD — HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'pirate-raid-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:55px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var mm = Math.floor(_timeRemaining / 60);
    var ss = Math.floor(_timeRemaining % 60);
    var timerStr = (mm < 10 ? '0' + mm : '' + mm) + ':' + (ss < 10 ? '0' + ss : '' + ss);
    var aliveSoldiers = 0;
    var i;
    for (i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].alive) { aliveSoldiers++; }
    }

    var navyStr = _navyArrived ? 'ARRIVING!' : (_navyVisible ? 'HORIZON' : 'NONE');
    var captStr = _captainAlive ? 'ALIVE' : 'DEFEATED';
    var musketStr = _musketLoaded ? 'READY' : ('RELOAD ' + Math.max(0, _MUSKET_RELOAD - _musketCooldown).toFixed(1) + 's');
    var hpStr = Math.max(0, Math.floor(_playerHP));
    var carryStr = _carryingChest >= 0 ? (_chests[_carryingChest].isDecoy ? 'DECOY!' : 'CHEST') : 'NONE';

    _hudEl.textContent =
      'PIRATE RAID' +
      ' │ HP:' + hpStr +
      ' │ TREASURE:' + _chestsAboard + '/5 ABOARD' +
      ' │ TIMER:' + timerStr +
      ' │ SOLDIERS:' + aliveSoldiers +
      ' │ CAPTAIN:' + captStr +
      ' │ NAVY:' + navyStr +
      ' │ MUSKET:' + musketStr +
      ' │ CARRY:' + carryStr;

    if (_gameOver || _gameWon) {
      _hudEl.style.fontSize = '20px';
      _hudEl.style.color = _gameWon ? '#44FF44' : '#FF4444';
      _hudEl.textContent = _gameWon
        ? ('VICTORY! Plundered ' + _chestsAboard + '/5 chests! Escape to the seas!')
        : 'DEFEAT! The Royal Navy has taken you. Davy Jones awaits...';
    }
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = true;

    // activation combo: P + R within 400ms
    if (key === 'p') { _pPressTime = performance.now(); }
    if (key === 'r') { _rPressTime = performance.now(); }
    if (key === 'p' && _keysDown['r'] &&
        Math.abs(_pPressTime - _rPressTime) < _COMBO_WINDOW) {
      if (!_active) { _activate(); }
    }
    if (key === 'r' && _keysDown['p'] &&
        Math.abs(_pPressTime - _rPressTime) < _COMBO_WINDOW) {
      if (!_active) { _activate(); }
    }

    if (!_active || _gameOver || _gameWon) return;

    // fire musket
    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      _firePlayerMusket();
    }

    // pick up chest
    if (key === 'e') {
      _tryPickupOrTransfer();
    }

    // drop chest
    if (key === 'q') {
      _carryingChest = -1;
    }

    // use powder keg / cut rope
    if (key === 'f') {
      _tryInteract();
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.key.toLowerCase()] = false;
  }

  function _onMouseMove(e) {
    if (!_active || !_pointerLocked) return;
    _mouseDX += e.movementX || 0;
    _mouseDY += e.movementY || 0;
  }

  function _onPointerLockChange() {
    _pointerLocked = (document.pointerLockElement === _canvas ||
                      document.mozPointerLockElement === _canvas);
  }

  function _tryPointerLock() {
    if (_canvas && !_pointerLocked) {
      if (_canvas.requestPointerLock) { _canvas.requestPointerLock(); }
      else if (_canvas.mozRequestPointerLock) { _canvas.mozRequestPointerLock(); }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ══════════════════════════════════════════════════════════════════════════ */

  function _activate() {
    _active = true;

    _buildOcean();
    _buildPirateShip();
    _buildGalleon();
    _buildRopeBridges();
    _buildSoldiers();
    _buildKegs();
    _buildNavyFrigate();
    _buildHUD();

    // lighting
    _addLight('ambient', 0xBBCCDD, 0.6);
    var sun = new THREE.DirectionalLight(0xFFEECC, 0.9);
    sun.position.set(80, 100, 50);
    _scene.add(sun);
    _lights.push(sun);

    // fog for atmosphere
    _scene.fog = new THREE.FogExp2(0x8899BB, 0.008);

    // camera start position (first person on pirate ship)
    _playerPos.x = -45;
    _playerPos.y = 7;
    _playerPos.z = 0;
    _playerYaw = Math.PI / 2; // facing galleon (positive X)

    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y = _playerYaw;
      _camera.rotation.x = _playerPitch;
    }

    _tryPointerLock();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ══════════════════════════════════════════════════════════════════════════ */

  function _updatePlayerMovement(dt) {
    // apply mouse look
    if (_mouseDX !== 0 || _mouseDY !== 0) {
      _playerYaw   -= _mouseDX * 0.002;
      _playerPitch -= _mouseDY * 0.002;
      _playerPitch = Math.max(-1.2, Math.min(1.2, _playerPitch));
      _mouseDX = 0;
      _mouseDY = 0;
    }

    var speed = _playerSpeed;
    if (_carryingChest >= 0) { speed *= 0.7; } // -30% when carrying

    var moving = false;
    var fw = { x: Math.sin(_playerYaw), z: Math.cos(_playerYaw) };
    var rt = { x: Math.cos(_playerYaw), z: -Math.sin(_playerYaw) };
    var mx = 0, mz = 0;

    if (_keysDown['w']) { mx += fw.x; mz += fw.z; moving = true; }
    if (_keysDown['s']) { mx -= fw.x; mz -= fw.z; moving = true; }
    if (_keysDown['a']) { mx -= rt.x; mz -= rt.z; moving = true; }
    if (_keysDown['d']) { mx += rt.x; mz += rt.z; moving = true; }

    if (moving) {
      var len = Math.sqrt(mx * mx + mz * mz) || 1;
      _playerPos.x += (mx / len) * speed * dt;
      _playerPos.z += (mz / len) * speed * dt;
    }

    // keep player on surface
    var targetY = _getFloorY(_playerPos.x, _playerPos.z);
    _playerPos.y = targetY + 1.8; // eye height above floor

    // water penalty
    _playerOnWater = (targetY < 0.5);
    if (_playerOnWater) {
      _playerHP -= 5 * dt;
      speed = speed * 0.4;
    }

    // update camera
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _camera.rotation.y = _playerYaw;
      _camera.rotation.x = _playerPitch;
    }

    // update carried chest position
    if (_carryingChest >= 0) {
      var ci = _carryingChest;
      var ch = _chests[ci];
      if (ch && !ch.collected) {
        ch.mesh.position.set(
          _playerPos.x,
          _playerPos.y - 1.0,
          _playerPos.z
        );
        if (ch.light) {
          ch.light.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
        }
        // remove from galleon and add to scene root if needed
      }
    }
  }

  function _getFloorY(px, pz) {
    // pirate ship zone
    if (px >= -85 && px <= -45 && pz >= -8 && pz <= 8) { return 5.5; }
    // rope bridge zone
    if (px >= -45 && px <= -30 && pz >= -6 && pz <= 6) { return 4.5; }
    // galleon upper deck
    if (px >= -30 && px <= 30 && pz >= -10 && pz <= 10) {
      // captain's cabin area (raised)
      if (px >= 16 && px <= 28) { return 6.5; }
      return 5.0;
    }
    // water
    return -0.5;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MUSKET
  ══════════════════════════════════════════════════════════════════════════ */

  function _firePlayerMusket() {
    if (!_musketLoaded) return;
    _musketLoaded = false;
    _musketCooldown = 0;

    // spawn bullet from camera direction
    var dir = { x: Math.sin(_playerYaw), y: Math.sin(_playerPitch), z: Math.cos(_playerYaw) };
    var speed = 60;
    var bullet = _makeSphere(0.12, 0xCCCCAA);
    bullet.position.set(_playerPos.x, _playerPos.y - 0.3, _playerPos.z);
    _scene.add(bullet);

    _bullets.push({
      mesh: bullet,
      vel: { x: dir.x * speed, y: dir.y * speed, z: dir.z * speed },
      age: 0,
      fromEnemy: false
    });
  }

  function _updateMusketReload(dt) {
    if (!_musketLoaded) {
      _musketCooldown += dt;
      if (_musketCooldown >= _MUSKET_RELOAD) {
        _musketLoaded = true;
        _musketCooldown = 0;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CHEST PICKUP & TRANSFER
  ══════════════════════════════════════════════════════════════════════════ */

  function _tryPickupOrTransfer() {
    // check if near transfer zone (pirate ship, x~=-47 to -45)
    if (_playerPos.x >= -82 && _playerPos.x <= -60 && Math.abs(_playerPos.z) <= 10) {
      if (_carryingChest >= 0) {
        var ci = _carryingChest;
        var ch = _chests[ci];
        if (ch && !ch.collected && !ch.isDecoy) {
          ch.collected = true;
          _chestsAboard++;
          _scene.remove(ch.mesh);
          if (ch.light) { _scene.remove(ch.light); }
        } else if (ch && ch.isDecoy) {
          // waste time — chest vanishes (decoy)
          ch.collected = true;
          _scene.remove(ch.mesh);
        }
        _carryingChest = -1;
        return;
      }
    }

    // pick up nearest chest
    var i, ch, dx, dz, dd, bestDist = 5, bestIdx = -1;
    for (i = 0; i < _chests.length; i++) {
      ch = _chests[i];
      if (ch.collected) continue;
      dx = ch.mesh.position.x - _playerPos.x;
      dz = ch.mesh.position.z - _playerPos.z;
      dd = Math.sqrt(dx * dx + dz * dz);
      if (dd < bestDist) { bestDist = dd; bestIdx = i; }
    }
    if (bestIdx >= 0) {
      _carryingChest = bestIdx;
      // detach from galleon, add to scene
      _galleon.remove(_chests[bestIdx].mesh);
      _scene.add(_chests[bestIdx].mesh);
      if (_chests[bestIdx].light) {
        _galleon.remove(_chests[bestIdx].light);
        _scene.add(_chests[bestIdx].light);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     POWDER KEG & ROPE CUT INTERACTION
  ══════════════════════════════════════════════════════════════════════════ */

  function _tryInteract() {
    // try explode powder keg
    var i, keg, dx, dz, dd;
    for (i = 0; i < _kegs.length; i++) {
      keg = _kegs[i];
      if (keg.exploded) continue;
      dx = keg.mesh.getWorldPosition
        ? keg.mesh.getWorldPosition(new THREE.Vector3()).x - _playerPos.x
        : (keg.worldPos.x - _playerPos.x);
      dz = keg.mesh.getWorldPosition
        ? keg.mesh.getWorldPosition(new THREE.Vector3()).z - _playerPos.z
        : (keg.worldPos.z - _playerPos.z);
      dd = Math.sqrt(dx * dx + dz * dz);
      if (dd < 5) {
        _explodeKeg(i);
        return;
      }
    }

    // try cut mast rope
    var j, mast, rope, rp;
    for (i = 0; i < _masts.length; i++) {
      mast = _masts[i];
      if (mast.toppled) continue;
      var mwx = mast.baseX; // relative to galleon
      var mwz = 0;
      dx = mwx - (_playerPos.x - _galleon.position.x);
      dz = mwz - (_playerPos.z - _galleon.position.z);
      dd = Math.sqrt(dx * dx + dz * dz);
      if (dd < 6) {
        _toppleMast(i);
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     POWDER KEG EXPLOSION
  ══════════════════════════════════════════════════════════════════════════ */

  function _explodeKeg(idx) {
    var keg = _kegs[idx];
    keg.exploded = true;

    // remove keg from scene
    if (keg.mesh.parent) { keg.mesh.parent.remove(keg.mesh); }

    // flash light
    var flash = new THREE.PointLight(0xFF6600, 8, 20);
    var wp = new THREE.Vector3();
    keg.mesh.getWorldPosition
      ? keg.mesh.getWorldPosition(wp)
      : wp.set(keg.worldPos.x, keg.worldPos.y, keg.worldPos.z);
    flash.position.copy(wp);
    _scene.add(flash);
    _lights.push(flash);

    // fade flash after 0.5s
    flash.userData.fadeTimer = 0;
    flash.userData.fading = true;

    // kill nearby soldiers (radius 10)
    var i, s, sdx, sdy, sdz, sd;
    for (i = 0; i < _soldiers.length; i++) {
      s = _soldiers[i];
      if (!s.alive) continue;
      var swp = new THREE.Vector3();
      s.mesh.getWorldPosition(swp);
      sdx = swp.x - wp.x;
      sdy = swp.y - wp.y;
      sdz = swp.z - wp.z;
      sd = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
      if (sd < 10) {
        s.alive = false;
        s.mesh.visible = false;
      }
    }

    // damage captain if nearby
    if (_captainAlive && _captain) {
      var cwp = new THREE.Vector3();
      _captain.mesh.getWorldPosition(cwp);
      sdx = cwp.x - wp.x;
      sdy = cwp.y - wp.y;
      sdz = cwp.z - wp.z;
      sd = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
      if (sd < 10) {
        _captain.hp -= 120;
        if (_captain.hp <= 0) {
          _captainAlive = false;
          _captain.mesh.visible = false;
        }
      }
    }

    // damage player if in blast radius
    var pdx = _playerPos.x - wp.x;
    var pdz = _playerPos.z - wp.z;
    var pd = Math.sqrt(pdx * pdx + pdz * pdz);
    if (pd < 8) {
      _playerHP -= 40;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAST TOPPLE
  ══════════════════════════════════════════════════════════════════════════ */

  function _toppleMast(idx) {
    var mast = _masts[idx];
    mast.toppled = true;
    mast.toppleTime = 0;

    // remove ropes
    var i;
    for (i = 0; i < mast.ropes.length; i++) {
      if (mast.ropes[i].parent) {
        mast.ropes[i].parent.remove(mast.ropes[i]);
      }
    }
  }

  function _updateMastTopple(dt) {
    var i, mast, swp, s, sd;
    for (i = 0; i < _masts.length; i++) {
      mast = _masts[i];
      if (!mast.toppled) continue;
      mast.toppleTime = (mast.toppleTime || 0) + dt;

      // rotate mast as it falls
      mast.mesh.rotation.z = Math.min(Math.PI / 2, mast.toppleTime * 1.5);

      // at 1s, check if it crushes any soldiers
      if (mast.toppleTime > 0.8 && !mast.crushChecked) {
        mast.crushChecked = true;
        var mwp = new THREE.Vector3();
        mast.mesh.getWorldPosition(mwp);
        for (var j = 0; j < _soldiers.length; j++) {
          s = _soldiers[j];
          if (!s.alive) continue;
          var soldWp = new THREE.Vector3();
          s.mesh.getWorldPosition(soldWp);
          sd = _dist3(soldWp, mwp);
          if (sd < 12) {
            s.alive = false;
            s.mesh.visible = false;
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SOLDIER AI
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateSoldiers(dt) {
    var i, s, swp, dx, dz, dd, dir;
    for (i = 0; i < _soldiers.length; i++) {
      s = _soldiers[i];
      if (!s.alive) continue;

      s.mesh.getWorldPosition
        ? s.mesh.getWorldPosition(new THREE.Vector3())
        : null;

      // get world position of soldier
      var swx = _galleon.position.x + s.mesh.position.x;
      var swy = _galleon.position.y + s.mesh.position.y;
      var swz = _galleon.position.z + s.mesh.position.z;

      dx = _playerPos.x - swx;
      dz = _playerPos.z - swz;
      dd = Math.sqrt(dx * dx + dz * dz);

      // face player
      s.mesh.rotation.y = Math.atan2(dx, dz);

      // slow patrol: move slightly toward player if within 20 units
      if (dd < 20 && dd > 2) {
        s.mesh.position.x += (dx / dd) * 1.5 * dt;
        s.mesh.position.z += (dz / dd) * 1.5 * dt;
      }

      // melee damage if very close
      if (dd < 2.5) {
        _playerHP -= 8 * dt;
      }

      // musket fire
      s.fireTimer += dt;
      if (s.fireTimer >= s.fireCD && dd < 25) {
        s.fireTimer = 0;
        _fireSoldierMusket(swx, swy + 1, swz);
      }
    }
  }

  function _fireSoldierMusket(sx, sy, sz) {
    var dx = _playerPos.x - sx;
    var dy = _playerPos.y - sy;
    var dz = _playerPos.z - sz;
    var dd = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var spd = 45;

    var ball = _makeSphere(0.12, 0x888888);
    ball.position.set(sx, sy, sz);
    _scene.add(ball);

    _bullets.push({
      mesh: ball,
      vel: {
        x: (dx / dd) * spd + (Math.random() - 0.5) * 3,
        y: (dy / dd) * spd,
        z: (dz / dd) * spd + (Math.random() - 0.5) * 3
      },
      age: 0,
      fromEnemy: true
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     CAPTAIN (BOSS) AI
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateCaptain(dt) {
    if (!_captainAlive || !_captain) return;

    var cwx = _galleon.position.x + _captain.mesh.position.x;
    var cwy = _galleon.position.y + _captain.mesh.position.y;
    var cwz = _galleon.position.z + _captain.mesh.position.z;

    var dx = _playerPos.x - cwx;
    var dy = _playerPos.y - cwy;
    var dz = _playerPos.z - cwz;
    var dd = Math.sqrt(dx * dx + dz * dz);

    _captain.mesh.rotation.y = Math.atan2(dx, dz);

    // move toward player aggressively
    if (dd > 3 && dd < 35) {
      _captain.mesh.position.x += (dx / dd) * 4 * dt;
      _captain.mesh.position.z += (dz / dd) * 4 * dt;
    }

    // rapier melee attack (fast: 0.5s cooldown)
    if (dd < 3) {
      _captainMeleeTimer += dt;
      if (_captainMeleeTimer >= 0.5) {
        _captainMeleeTimer = 0;
        _playerHP -= 18;
      }
    }

    // pistol shot (1 shot only, then melee)
    if (!_captain.shotFired && dd < 20) {
      _captainFireTimer += dt;
      if (_captainFireTimer >= 1.5) {
        _captain.shotFired = true;
        _fireSoldierMusket(cwx, cwy + 0.8, cwz);
      }
    }

    // check captain HP
    if (_captain.hp <= 0) {
      _captainAlive = false;
      _captain.mesh.visible = false;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BULLET UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateBullets(dt) {
    var i, b, hit;
    for (i = _bullets.length - 1; i >= 0; i--) {
      b = _bullets[i];
      b.vel.y -= 2 * dt; // mild gravity
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      b.age += dt;

      hit = false;

      if (b.fromEnemy) {
        // check player hit
        var dx = b.mesh.position.x - _playerPos.x;
        var dy = b.mesh.position.y - _playerPos.y;
        var dz = b.mesh.position.z - _playerPos.z;
        var dd = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dd < 1.5) {
          _playerHP -= 20;
          hit = true;
        }
      } else {
        // check soldier hits
        var j, s, swx, swz, sdx, sdz, sdd;
        for (j = 0; j < _soldiers.length && !hit; j++) {
          s = _soldiers[j];
          if (!s.alive) continue;
          swx = _galleon.position.x + s.mesh.position.x;
          swz = _galleon.position.z + s.mesh.position.z;
          var swy = _galleon.position.y + s.mesh.position.y;
          sdx = b.mesh.position.x - swx;
          var sdy2 = b.mesh.position.y - (swy + 1);
          sdz = b.mesh.position.z - swz;
          sdd = Math.sqrt(sdx * sdx + sdy2 * sdy2 + sdz * sdz);
          if (sdd < 1.5) {
            s.hp -= 70; // one-shot for player (70HP enemy)
            if (s.hp <= 0) {
              s.alive = false;
              s.mesh.visible = false;
            }
            hit = true;
          }
        }

        // check captain hit
        if (!hit && _captainAlive && _captain) {
          var cwx = _galleon.position.x + _captain.mesh.position.x;
          var cwz = _galleon.position.z + _captain.mesh.position.z;
          var cwy2 = _galleon.position.y + _captain.mesh.position.y + 1;
          var cdx = b.mesh.position.x - cwx;
          var cdy = b.mesh.position.y - cwy2;
          var cdz = b.mesh.position.z - cwz;
          var cdd = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz);
          if (cdd < 2.0) {
            _captain.hp -= 30;
            if (_captain.hp <= 0) {
              _captainAlive = false;
              _captain.mesh.visible = false;
            }
            hit = true;
          }
        }
      }

      if (hit || b.age > 4 || b.mesh.position.y < -10) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ROPE BRIDGES (enemy can cut)
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateRopes(dt) {
    // Soldiers near ropes have a small chance to cut them
    var i, j, s, rope, swx, swz, rdx, rdz, rd;
    for (i = 0; i < _ropeLines.length; i++) {
      rope = _ropeLines[i];
      if (!rope.active) continue;

      for (j = 0; j < _soldiers.length; j++) {
        s = _soldiers[j];
        if (!s.alive) continue;
        swx = _galleon.position.x + s.mesh.position.x;
        swz = _galleon.position.z + s.mesh.position.z;
        // check distance to rope anchor (~x=-30)
        rdx = swx - (-30);
        rdz = swz - rope.offsetZ;
        rd = Math.sqrt(rdx * rdx + rdz * rdz);
        if (rd < 4 && Math.random() < 0.0003) {
          _cutRope(i);
          break;
        }
      }
    }
  }

  function _cutRope(idx) {
    var rope = _ropeLines[idx];
    rope.active = false;
    _scene.remove(rope.line);
    _scene.remove(rope.sagLine);
  }

  /* ════════════════════════════════════════════════════════════════════════
     OCEAN ROCKING
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateRocking(dt) {
    _rockTime += dt;
    var angle = Math.sin(_rockTime * 2 * Math.PI * _ROCK_FREQ) * _ROCK_AMP;
    if (_galleon) { _galleon.rotation.z = angle; }
    if (_pirateShip) { _pirateShip.rotation.z = angle * 0.85 + 0.008; }
    if (_navyFrigate && _navyFrigate.visible) {
      _navyFrigate.rotation.z = angle * 0.7;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     NAVY TIMER
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateNavy(dt) {
    _timeRemaining -= dt;

    // 5 min remaining: navy appears on horizon
    if (!_navyVisible && _timeRemaining <= 300) {
      _navyVisible = true;
      if (_navyFrigate) { _navyFrigate.visible = true; }
    }

    // navy approaches
    if (_navyVisible && _navyFrigate) {
      var targetX = -20;
      var speed = 8;
      if (_navyFrigate.position.x > targetX) {
        _navyFrigate.position.x -= speed * dt;
        _navyFrigate.position.z += 0.5 * dt; // arc in
      }
    }

    // 0 min: navy arrives - game over
    if (!_navyArrived && _timeRemaining <= 0) {
      _navyArrived = true;
      _gameOver = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSION FLASH FADE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateLights(dt) {
    var i, light;
    for (i = _lights.length - 1; i >= 0; i--) {
      light = _lights[i];
      if (light.userData && light.userData.fading) {
        light.userData.fadeTimer += dt;
        light.intensity = Math.max(0, 8 - light.userData.fadeTimer * 16);
        if (light.intensity <= 0) {
          _scene.remove(light);
          _lights.splice(i, 1);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE CHECK
  ══════════════════════════════════════════════════════════════════════════ */

  function _checkEndConditions() {
    if (_gameOver || _gameWon) return;

    // player dead
    if (_playerHP <= 0) {
      _playerHP = 0;
      _gameOver = true;
      return;
    }

    // win: 4+ chests transferred before timer
    if (_chestsAboard >= 4 && _timeRemaining > 0) {
      _gameWon = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function update(scene, camera, canvas, dt) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    if (!_active) return;
    if (_gameOver || _gameWon) {
      _updateHUD();
      return;
    }

    _updatePlayerMovement(dt);
    _updateMusketReload(dt);
    _updateBullets(dt);
    _updateSoldiers(dt);
    _updateCaptain(dt);
    _updateRocking(dt);
    _updateRopes(dt);
    _updateMastTopple(dt);
    _updateNavy(dt);
    _updateLights(dt);
    _checkEndConditions();
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);

    document.addEventListener('pointerlockchange',    _onPointerLockChange);
    document.addEventListener('mozpointerlockchange', _onPointerLockChange);

    if (canvas) {
      canvas.addEventListener('click', _tryPointerLock);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ══════════════════════════════════════════════════════════════════════════ */

  function reset() {
    var i, j;

    if (_ocean)       { _scene.remove(_ocean); _ocean = null; }
    if (_pirateShip)  { _scene.remove(_pirateShip); _pirateShip = null; }
    if (_galleon)     { _scene.remove(_galleon); _galleon = null; }
    if (_navyFrigate) { _scene.remove(_navyFrigate); _navyFrigate = null; }

    for (i = 0; i < _ropeLines.length; i++) {
      _scene.remove(_ropeLines[i].line);
      _scene.remove(_ropeLines[i].sagLine);
    }
    _ropeLines = [];

    for (i = 0; i < _bullets.length; i++) { _scene.remove(_bullets[i].mesh); }
    _bullets = [];

    for (i = 0; i < _lights.length; i++) { _scene.remove(_lights[i]); }
    _lights = [];

    _chests = [];
    _kegs   = [];
    _masts  = [];
    _mastRopes = [];
    _cannonPortLines = [];
    _soldiers = [];
    _captain  = null;
    _captainHP = 300;
    _captainAlive = true;
    _captainFireTimer = 0;
    _captainMeleeTimer = 0;

    _removeHUD();

    if (_scene && _scene.fog !== undefined) { _scene.fog = null; }

    // reset state
    _active         = false;
    _gameOver       = false;
    _gameWon        = false;
    _timeRemaining  = 600;
    _navyVisible    = false;
    _navyArrived    = false;
    _playerHP       = 150;
    _playerPos      = { x: -55, y: 6, z: 0 };
    _playerVel      = { x: 0, y: 0, z: 0 };
    _playerYaw      = Math.PI / 2;
    _playerPitch    = 0;
    _playerOnWater  = false;
    _musketLoaded   = true;
    _musketCooldown = 0;
    _carryingChest  = -1;
    _chestsAboard   = 0;
    _rockTime       = 0;
    _mouseDX        = 0;
    _mouseDY        = 0;
    _pointerLocked  = false;
    _keysDown       = {};
    _pPressTime     = 0;
    _rPressTime     = 0;

    window.removeEventListener('keydown',  _onKeyDown);
    window.removeEventListener('keyup',    _onKeyUp);
    window.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('pointerlockchange',    _onPointerLockChange);
    document.removeEventListener('mozpointerlockchange', _onPointerLockChange);
    if (_canvas) {
      _canvas.removeEventListener('click', _tryPointerLock);
    }

    if (document.exitPointerLock)    { document.exitPointerLock(); }
    if (document.mozExitPointerLock) { document.mozExitPointerLock(); }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
