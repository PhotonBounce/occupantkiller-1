/* ─────────────────────────────────────────────────────────────────────────────
   glacier-fortress.js
   GlacierFortress — Assault a fortress carved into a glacier, expose the
   hidden research lab, and destroy the ice drill weapon system.

   Activation: G then L within 400ms
   WASD / Arrow keys — move
   Q / E-rotate       — turn camera
   Space              — shoot
   E (hold 3s)        — plant explosive charge on drill leg
   H                  — seek nearest heat source (reduces hypothermia faster)

   Win:  5 charges planted + Dr. Kryos defeated + escape before flood max
   Lose: Player HP ≤ 0  |  flood reaches max before escape
   ─────────────────────────────────────────────────────────────────────────── */
window.GlacierFortress = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  /* ── Constants ─────────────────────────────────────────────────────────── */
  var MODULE_NAME         = 'GlacierFortress';
  var ACTIVATION_KEY_A    = 'g';
  var ACTIVATION_KEY_B    = 'l';
  var ACTIVATION_WINDOW   = 400;          /* ms */

  var PLAYER_SPEED        = 7;
  var PLAYER_SPEED_SLOW   = 4.9;          /* 30% reduction above 80% hypothermia */
  var GRAVITY             = 20;
  var JUMP_VEL            = 8;

  var HYPO_RATE_COLD      = 4;            /* %/s outside heat sources */
  var HYPO_RATE_HEAT      = -12;          /* %/s near heat source */
  var HYPO_SLOW_THRESHOLD = 80;           /* % above which player slows */

  var DRILL_CHARGE_HOLD   = 3.0;          /* seconds to hold E for each charge */
  var DRILL_LEGS          = 5;

  var FLOOD_RISE_RATE     = 1 / 10;       /* units per second when active */
  var FLOOD_MAX           = 18;           /* flood kills player above this Y */

  var SHOOT_COOLDOWN      = 0.22;
  var BULLET_SPEED        = 42;
  var BULLET_DMG_PLAYER   = 12;
  var ICE_SHARD_DMG       = 30;

  var ARCTIC_COUNT        = 10;
  var SCIENTIST_COUNT     = 6;

  var KRYOS_HP            = 510;
  var KRYOS_PHASE2_PCT    = 0.5;

  var ICE_COLOR           = 0xCCEEFF;
  var ICE_WALL_COLOR      = 0xAADDEE;
  var CAVE_COLOR          = 0x88BBCC;
  var FORTRESS_COLOR      = 0x8899AA;
  var GATE_COLOR          = 0x556677;
  var TOWER_COLOR         = 0x667788;
  var LAB_COLOR           = 0xDDEEFF;
  var EQUIP_COLOR         = 0x445566;
  var DRILL_COLOR         = 0x334455;
  var CRYO_COLOR          = 0x99CCDD;
  var ARCTIC_COLOR        = 0x334455;
  var SCIENTIST_COLOR     = 0x445544;
  var KRYOS_COLOR         = 0x224455;
  var CHARGE_COLOR        = 0xFF8800;
  var HEAT_COLOR          = 0xFF4400;
  var MIST_COLOR          = 0xEEFFFF;
  var GROUND_COLOR        = 0xDDEEFF;

  /* ── Module-level state ─────────────────────────────────────────────────── */
  var _active    = false;
  var _won       = false;
  var _lost      = false;
  var _loseMsg   = '';
  var _time      = 0;

  /* ── Key tracking ──────────────────────────────────────────────────────── */
  var _keysDown   = {};
  var _gPressTime = 0;
  var _lPressTime = 0;

  /* ── Three.js handles ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;
  var _raf      = null;
  var _lastTs   = 0;

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _player = {
    x: 0, y: 2, z: 0,
    vx: 0, vy: 0, vz: 0,
    yaw: 0,
    hp: 100,
    onGround: false
  };

  /* ── Hypothermia ────────────────────────────────────────────────────────── */
  var _hypothermia   = 0;      /* 0–100 */
  var _nearHeat      = false;

  /* ── Ice sliding ────────────────────────────────────────────────────────── */
  var _onIce         = false;
  var _slideVx       = 0;
  var _slideVz       = 0;
  var _slideDecay    = 0.5;    /* normal decay per second */
  var _iceDecay      = 0.25;   /* slide decays 2x slower on ice */

  /* ── Drill charges ──────────────────────────────────────────────────────── */
  var _charges       = [];     /* { mesh, leg, planted, holdTimer, lightMesh } */
  var _chargesPlanted = 0;
  var _eHolding      = false;
  var _eHoldTimer    = 0;
  var _eTargetLeg    = -1;

  /* ── Cryo flood ─────────────────────────────────────────────────────────── */
  var _floodActive   = false;
  var _floodLevel    = -5;
  var _floodMesh     = null;

  /* ── Enemies ────────────────────────────────────────────────────────────── */
  var _arcticSoldiers = [];
  var _scientists     = [];
  var _kryos          = null;   /* { mesh, hp, alive, phase2, shootTimer, burstCooldown } */

  /* ── Projectiles ────────────────────────────────────────────────────────── */
  var _bullets       = [];     /* { mesh, vx,vy,vz, fromPlayer, dmg, life } */
  var _shootTimer    = 0;

  /* ── Environment objects ────────────────────────────────────────────────── */
  var _drillMesh     = null;
  var _drillHead     = null;   /* rotating box */
  var _drillLegs     = [];     /* array of {mesh, pos} */
  var _iceSurfaces   = [];     /* floor tiles that count as ice */
  var _floors        = [];     /* {x1,x2,z1,z2,y} */
  var _heatSources   = [];     /* {x,y,z,light} — PointLight areas */
  var _mistParticles = [];
  var _stalactites   = [];

  /* ── Escape zone ────────────────────────────────────────────────────────── */
  var _escapeZone    = { x: 0, y: 1, z: -85, r: 6 };
  var _escaped       = false;

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  var _hudEl   = null;
  var _hudTick = null;

  /* ════════════════════════════════════════════════════════════════════════════
     UTILITY
     ════════════════════════════════════════════════════════════════════════════ */
  function _dist3(ax, ay, az, bx, by, bz) {
    var dx = ax - bx, dy = ay - by, dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _makeBox(w, h, d, color, scene) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
  }

  function _makeCyl(rt, rb, h, color, scene, segs) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 12);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
  }

  function _makeSphere(r, color, scene) {
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
  }

  function _makeCone(r, h, color, scene) {
    var geo = new THREE.ConeGeometry(r, h, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
  }

  function _addFloor(x1, x2, z1, z2, y) {
    _floors.push({ x1: x1, x2: x2, z1: z1, z2: z2, y: y });
  }

  function _getFloorY(x, z) {
    var best = null;
    var i;
    for (i = 0; i < _floors.length; i++) {
      var f = _floors[i];
      if (x >= f.x1 && x <= f.x2 && z >= f.z1 && z <= f.z2) {
        if (best === null || f.y > best) best = f.y;
      }
    }
    return best;
  }

  function _wireBox(w, h, d, color, scene) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    var lines = new THREE.LineSegments(edges, mat);
    scene.add(lines);
    return lines;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     HUD
     ════════════════════════════════════════════════════════════════════════════ */
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'glacier-fortress-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.82)',
      'color:#AADDFF',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:6px 18px',
      'border:1px solid #224466',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
    _hudTick = setInterval(_updateHUD, 250);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_won) {
      _hudEl.style.color = '#44FF88';
      _hudEl.textContent = 'GLACIER FORTRESS — MISSION COMPLETE! ESCAPED!';
      return;
    }
    if (_lost) {
      _hudEl.style.color = '#FF3333';
      _hudEl.textContent = 'MISSION FAILED: ' + _loseMsg;
      return;
    }
    var hypoStr = Math.round(_hypothermia) + '%';
    var chargeStr = _chargesPlanted + '/' + DRILL_LEGS;
    var floodStr = _floodActive ? '  [FLOOD: ' + Math.max(0, _floodLevel).toFixed(1) + 'm]' : '';
    var hpStr    = Math.max(0, Math.floor(_player.hp));
    var alive    = 0;
    var i;
    for (i = 0; i < _arcticSoldiers.length; i++) { if (_arcticSoldiers[i].alive) alive++; }
    for (i = 0; i < _scientists.length; i++) { if (_scientists[i].alive) alive++; }
    if (_kryos && _kryos.alive) alive++;
    _hudEl.textContent = (
      'GLACIER FORTRESS' +
      '  [HYPO: ' + hypoStr + ']' +
      '  [CHARGES: ' + chargeStr + ']' +
      '  [ENEMIES: ' + alive + ']' +
      '  [HP: ' + hpStr + ']' +
      floodStr
    );
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
    if (_hudTick) {
      clearInterval(_hudTick);
      _hudTick = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     SCENE CONSTRUCTION
     ════════════════════════════════════════════════════════════════════════════ */
  function _buildScene() {
    _scene.background = new THREE.Color(0x99BBCC);
    _scene.fog = new THREE.FogExp2(0xAABBCC, 0.018);

    var ambient = new THREE.AmbientLight(0xCCEEFF, 0.55);
    _scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xDDEEFF, 0.8);
    sun.position.set(30, 60, 20);
    sun.castShadow = true;
    _scene.add(sun);

    _buildGround();
    _buildGlacierWalls();
    _buildIceCaves();
    _buildFortressGate();
    _buildGuardTowers();
    _buildResearchLab();
    _buildDrillChamber();
    _buildCryoStorage();
    _buildHeatSources();
    _buildDrillCharges();
    _buildMistParticles();
    _buildEscapeMarker();
    _buildFloodPlane();
    _buildEnemies();
    _buildKryos();
  }

  /* ── Ground ─────────────────────────────────────────────────────────────── */
  function _buildGround() {
    var ground = _makeBox(300, 1, 300, GROUND_COLOR, _scene);
    ground.position.set(0, -0.5, 0);
    _addFloor(-150, 150, -150, 150, 0);

    /* A second ice-level ground for the glacier exterior */
    var iceGround = _makeBox(180, 0.5, 180, ICE_COLOR, _scene);
    iceGround.position.set(0, 0.25, -20);
    iceGround.material.transparent = true;
    iceGround.material.opacity = 0.7;
    _iceSurfaces.push(iceGround);
  }

  /* ── Massive glacier ice walls (exterior) ───────────────────────────────── */
  function _buildGlacierWalls() {
    var i;
    /* Back wall — massive cliff face */
    var backWall = _makeBox(160, 40, 6, ICE_WALL_COLOR, _scene);
    backWall.position.set(0, 20, -90);

    /* Left wall */
    var leftWall = _makeBox(6, 35, 120, ICE_WALL_COLOR, _scene);
    leftWall.position.set(-80, 17.5, -30);

    /* Right wall */
    var rightWall = _makeBox(6, 35, 120, ICE_WALL_COLOR, _scene);
    rightWall.position.set(80, 17.5, -30);

    /* Ice boulders / outcroppings scattered around */
    var boulderPositions = [
      {x: -45, z: -10, s: 6},
      {x:  38, z: -5,  s: 5},
      {x: -60, z: -40, s: 8},
      {x:  55, z: -35, s: 7},
      {x: -20, z: 20,  s: 4},
      {x:  25, z: 18,  s: 5}
    ];
    for (i = 0; i < boulderPositions.length; i++) {
      var bp = boulderPositions[i];
      var boulder = _makeBox(bp.s, bp.s * 0.8, bp.s, ICE_WALL_COLOR, _scene);
      boulder.position.set(bp.x, bp.s * 0.4, bp.z);
      boulder.rotation.y = Math.random() * Math.PI;
    }

    /* Ice shelf / platform raised area */
    var shelf = _makeBox(50, 2, 30, ICE_COLOR, _scene);
    shelf.position.set(-55, 1, -50);
    _addFloor(-80, -30, -65, -35, 2);
    _iceSurfaces.push(shelf);

    var shelf2 = _makeBox(40, 2, 25, ICE_COLOR, _scene);
    shelf2.position.set(55, 1, -50);
    _addFloor(35, 75, -62, -37, 2);
    _iceSurfaces.push(shelf2);
  }

  /* ── Ice caves (tunnels) ────────────────────────────────────────────────── */
  function _buildIceCaves() {
    var i;
    /* Cave 1 — left tunnel from exterior to fortress */
    var cave1Floor = _makeBox(12, 0.8, 50, CAVE_COLOR, _scene);
    cave1Floor.position.set(-35, 0.4, -55);
    _addFloor(-41, -29, -80, -30, 0.8);
    _iceSurfaces.push(cave1Floor);

    var cave1RoofL = _makeBox(3, 8, 50, CAVE_COLOR, _scene);
    cave1RoofL.position.set(-41, 5, -55);
    var cave1RoofR = _makeBox(3, 8, 50, CAVE_COLOR, _scene);
    cave1RoofR.position.set(-29, 5, -55);
    var cave1Ceil = _makeBox(12, 2, 50, CAVE_COLOR, _scene);
    cave1Ceil.position.set(-35, 9, -55);

    /* Stalactites in cave 1 */
    for (i = 0; i < 8; i++) {
      var stalX = -35 + (Math.random() - 0.5) * 8;
      var stalZ = -38 - i * 5;
      var stalH = 1.5 + Math.random() * 3;
      var stal = _makeCone(0.4, stalH, 0xCCEEFF, _scene);
      stal.position.set(stalX, 9 - stalH * 0.5, stalZ);
      stal.rotation.z = Math.PI;  /* point downward */
      _stalactites.push(stal);
    }

    /* Cave 2 — right tunnel */
    var cave2Floor = _makeBox(12, 0.8, 50, CAVE_COLOR, _scene);
    cave2Floor.position.set(35, 0.4, -55);
    _addFloor(29, 41, -80, -30, 0.8);
    _iceSurfaces.push(cave2Floor);

    var cave2RoofL = _makeBox(3, 8, 50, CAVE_COLOR, _scene);
    cave2RoofL.position.set(29, 5, -55);
    var cave2RoofR = _makeBox(3, 8, 50, CAVE_COLOR, _scene);
    cave2RoofR.position.set(41, 5, -55);
    var cave2Ceil = _makeBox(12, 2, 50, CAVE_COLOR, _scene);
    cave2Ceil.position.set(35, 9, -55);

    for (i = 0; i < 8; i++) {
      var s2X = 35 + (Math.random() - 0.5) * 8;
      var s2Z = -38 - i * 5;
      var s2H = 1.5 + Math.random() * 3;
      var s2  = _makeCone(0.4, s2H, 0xCCEEFF, _scene);
      s2.position.set(s2X, 9 - s2H * 0.5, s2Z);
      s2.rotation.z = Math.PI;
      _stalactites.push(s2);
    }

    /* Add blue ambient light in each cave */
    var caveLight1 = new THREE.PointLight(0x88CCFF, 1.2, 30);
    caveLight1.position.set(-35, 6, -55);
    _scene.add(caveLight1);

    var caveLight2 = new THREE.PointLight(0x88CCFF, 1.2, 30);
    caveLight2.position.set(35, 6, -55);
    _scene.add(caveLight2);
  }

  /* ── Fortress gate ──────────────────────────────────────────────────────── */
  function _buildFortressGate() {
    /* Main gate structure */
    var gateBase = _makeBox(30, 16, 5, FORTRESS_COLOR, _scene);
    gateBase.position.set(0, 8, -27);

    /* Gate opening (visual cutout using two side pillars + lintel) */
    var pillarL = _makeBox(8, 16, 5, GATE_COLOR, _scene);
    pillarL.position.set(-11, 8, -27);
    var pillarR = _makeBox(8, 16, 5, GATE_COLOR, _scene);
    pillarR.position.set(11, 8, -27);
    var lintel = _makeBox(14, 4, 5, GATE_COLOR, _scene);
    lintel.position.set(0, 14, -27);

    /* Gate doors (two box halves) */
    var doorL = _makeBox(3.5, 8, 1, 0x334455, _scene);
    doorL.position.set(-1.75, 5, -25);
    var doorR = _makeBox(3.5, 8, 1, 0x334455, _scene);
    doorR.position.set(1.75, 5, -25);

    /* Gate floor */
    var gateFloor = _makeBox(14, 0.5, 5, FORTRESS_COLOR, _scene);
    gateFloor.position.set(0, 0.25, -27);
    _addFloor(-7, 7, -30, -25, 0.5);

    /* Wire frame accents on gate */
    var gateWire = _wireBox(30, 16, 5, 0x99BBCC, _scene);
    gateWire.position.set(0, 8, -27);
  }

  /* ── Guard towers ───────────────────────────────────────────────────────── */
  function _buildGuardTowers() {
    var towerDefs = [
      { x: -22, z: -27 },
      { x:  22, z: -27 }
    ];
    var i, j;
    for (i = 0; i < towerDefs.length; i++) {
      var td = towerDefs[i];
      /* Tower shaft */
      var shaft = _makeBox(7, 18, 7, TOWER_COLOR, _scene);
      shaft.position.set(td.x, 9, td.z);

      /* Tower battlements (merlons) */
      for (j = 0; j < 4; j++) {
        var merlon = _makeBox(2, 2.5, 2, TOWER_COLOR, _scene);
        var ang = (j / 4) * Math.PI * 2;
        merlon.position.set(
          td.x + Math.cos(ang) * 2.5,
          19.25,
          td.z + Math.sin(ang) * 2.5
        );
      }

      /* Tower platform */
      var platform = _makeBox(8, 0.6, 8, TOWER_COLOR, _scene);
      platform.position.set(td.x, 18.3, td.z);
      _addFloor(td.x - 4, td.x + 4, td.z - 4, td.z + 4, 18.6);

      /* Tower searchlight */
      var searchLight = new THREE.PointLight(0xFFEECC, 1.5, 35);
      searchLight.position.set(td.x, 20, td.z);
      _scene.add(searchLight);

      /* Ladder rungs suggestion (LineSegments) */
      var ladderVerts = [];
      var k;
      for (k = 0; k < 8; k++) {
        ladderVerts.push(-0.5, 1 + k * 2, 0, 0.5, 1 + k * 2, 0);
        ladderVerts.push(-0.5, 1, k * 2, -0.5, 3 + k * 2, k * 2);
        ladderVerts.push( 0.5, 1, k * 2,  0.5, 3 + k * 2, k * 2);
      }
      var ladderGeo = new THREE.BufferGeometry();
      ladderGeo.setAttribute('position', new THREE.Float32BufferAttribute(ladderVerts, 3));
      var ladderMat = new THREE.LineBasicMaterial({ color: 0x445566 });
      var ladder = new THREE.LineSegments(ladderGeo, ladderMat);
      ladder.position.set(td.x + 3, 0, td.z);
      _scene.add(ladder);
    }
  }

  /* ── Research lab (interior rooms) ─────────────────────────────────────── */
  function _buildResearchLab() {
    var i;
    /* Lab floor */
    var labFloor = _makeBox(50, 1, 40, LAB_COLOR, _scene);
    labFloor.position.set(0, 0.5, -50);
    _addFloor(-25, 25, -70, -30, 1.0);

    /* White walls */
    var wallN = _makeBox(50, 14, 1, LAB_COLOR, _scene);
    wallN.position.set(0, 8, -71);
    var wallS = _makeBox(50, 14, 1, LAB_COLOR, _scene);
    wallS.position.set(0, 8, -29);
    var wallE = _makeBox(1, 14, 40, LAB_COLOR, _scene);
    wallE.position.set(25, 8, -50);
    var wallW = _makeBox(1, 14, 40, LAB_COLOR, _scene);
    wallW.position.set(-25, 8, -50);
    var ceiling = _makeBox(50, 1, 40, LAB_COLOR, _scene);
    ceiling.position.set(0, 15, -50);

    /* Equipment racks (BoxGeometry) — 4 racks */
    var rackPositions = [
      {x: -18, z: -40}, {x: -10, z: -40},
      {x:  10, z: -40}, {x:  18, z: -40}
    ];
    for (i = 0; i < rackPositions.length; i++) {
      var rp = rackPositions[i];
      var rack = _makeBox(3, 8, 1.5, EQUIP_COLOR, _scene);
      rack.position.set(rp.x, 5, rp.z);
      /* Rack shelves */
      var s;
      for (s = 0; s < 3; s++) {
        var shelf = _makeBox(3.2, 0.2, 1.7, 0x556677, _scene);
        shelf.position.set(rp.x, 2 + s * 2.5, rp.z);
      }
    }

    /* Monitor screens (flat boxes) */
    var monitorPositions = [
      {x: -20, z: -65}, {x: -12, z: -65},
      {x:   0, z: -65}, {x:  12, z: -65},
      {x:  20, z: -65}
    ];
    for (i = 0; i < monitorPositions.length; i++) {
      var mp = monitorPositions[i];
      var monitor = _makeBox(3, 2, 0.3, 0x223344, _scene);
      monitor.position.set(mp.x, 6, mp.z);
      var screen = _makeBox(2.6, 1.6, 0.1, 0x003355, _scene);
      screen.position.set(mp.x, 6, mp.z - 0.15);
      var screenLight = new THREE.PointLight(0x0088FF, 0.4, 5);
      screenLight.position.set(mp.x, 7, mp.z - 1);
      _scene.add(screenLight);
    }

    /* Lab tables */
    for (i = 0; i < 3; i++) {
      var table = _makeBox(6, 1, 3, 0xCCDDEE, _scene);
      table.position.set(-15 + i * 12, 3, -55);
      var tableTop = _makeBox(6.2, 0.2, 3.2, 0xBBCCDD, _scene);
      tableTop.position.set(-15 + i * 12, 3.6, -55);
    }

    /* Internal dividing wall with doorway */
    var divWallA = _makeBox(18, 14, 1, LAB_COLOR, _scene);
    divWallA.position.set(-16, 8, -48);
    var divWallB = _makeBox(18, 14, 1, LAB_COLOR, _scene);
    divWallB.position.set(16, 8, -48);
    var divLintel = _makeBox(50, 3, 1, LAB_COLOR, _scene);
    divLintel.position.set(0, 13, -48);

    /* Lab overhead lights */
    var labLight1 = new THREE.PointLight(0xCCEEFF, 1.0, 30);
    labLight1.position.set(-10, 14, -50);
    _scene.add(labLight1);
    var labLight2 = new THREE.PointLight(0xCCEEFF, 1.0, 30);
    labLight2.position.set(10, 14, -50);
    _scene.add(labLight2);
  }

  /* ── Ice drill chamber ──────────────────────────────────────────────────── */
  function _buildDrillChamber() {
    var i;
    /* Chamber floor */
    var chamberFloor = _makeBox(35, 1, 35, 0x667788, _scene);
    chamberFloor.position.set(0, 0.5, -80);
    _addFloor(-17.5, 17.5, -97.5, -62.5, 1.0);

    /* Chamber walls */
    var cwN = _makeBox(35, 20, 1.5, DRILL_COLOR, _scene);
    cwN.position.set(0, 11, -98);
    var cwS = _makeBox(35, 20, 1.5, DRILL_COLOR, _scene);
    cwS.position.set(0, 11, -62);
    var cwE = _makeBox(1.5, 20, 35, DRILL_COLOR, _scene);
    cwE.position.set(17.5, 11, -80);
    var cwW = _makeBox(1.5, 20, 35, DRILL_COLOR, _scene);
    cwW.position.set(-17.5, 11, -80);
    var cwCeil = _makeBox(35, 1.5, 35, DRILL_COLOR, _scene);
    cwCeil.position.set(0, 21, -80);

    /* Main drill cylinder */
    _drillMesh = _makeCyl(3, 3.5, 18, DRILL_COLOR, _scene, 16);
    _drillMesh.position.set(0, 10, -80);
    _drillMesh.userData.isDrill = true;

    /* Rotating drill head (BoxGeometry) */
    _drillHead = _makeBox(10, 2, 10, 0x223344, _scene);
    _drillHead.position.set(0, 2.5, -80);
    _drillHead.userData.isDrillHead = true;

    /* Drill bit tip (cone) */
    var drillTip = _makeCone(3, 4, 0x334455, _scene);
    drillTip.position.set(0, -0.5, -80);
    drillTip.rotation.z = Math.PI;  /* point down */

    /* Drill arm cross pieces */
    for (i = 0; i < 3; i++) {
      var arm = _makeBox(14, 1, 1.5, 0x334455, _scene);
      arm.position.set(0, 6 + i * 4, -80);
      arm.rotation.y = (i * Math.PI) / 3;
    }

    /* Drill legs — 5 legs around the base (where charges are planted) */
    var legPositions = [
      {x:  6, z: -80},
      {x: -6, z: -80},
      {x:  0, z: -86},
      {x:  0, z: -74},
      {x:  5, z: -83}
    ];
    for (i = 0; i < DRILL_LEGS; i++) {
      var lp = legPositions[i];
      var leg = _makeBox(1.5, 4, 1.5, 0x445566, _scene);
      leg.position.set(lp.x, 2, lp.z);
      _drillLegs.push({ mesh: leg, pos: { x: lp.x, y: 1, z: lp.z } });
    }

    /* Drill chamber lights */
    var drillLight = new THREE.PointLight(0x2255AA, 2.5, 40);
    drillLight.position.set(0, 18, -80);
    _scene.add(drillLight);

    var drillLight2 = new THREE.PointLight(0x0044AA, 1.5, 30);
    drillLight2.position.set(0, 3, -80);
    _scene.add(drillLight2);
  }

  /* ── Cryo storage (cryo-pods + mist) ───────────────────────────────────── */
  function _buildCryoStorage() {
    var i;
    /* Room */
    var cryoFloor = _makeBox(30, 1, 20, 0x99AABB, _scene);
    cryoFloor.position.set(-35, 0.5, -75);
    _addFloor(-50, -20, -85, -65, 1.0);

    var cwA = _makeBox(30, 12, 1, 0x99AABB, _scene);
    cwA.position.set(-35, 7, -85);
    var cwB = _makeBox(30, 12, 1, 0x99AABB, _scene);
    cwB.position.set(-35, 7, -65);
    var cwC = _makeBox(1, 12, 20, 0x99AABB, _scene);
    cwC.position.set(-20, 7, -75);
    var cwD = _makeBox(1, 12, 20, 0x99AABB, _scene);
    cwD.position.set(-50, 7, -75);

    /* Cryo pod cylinders — 2 rows of 4 */
    var podPositions = [
      {x: -46, z: -82}, {x: -41, z: -82}, {x: -36, z: -82}, {x: -31, z: -82},
      {x: -46, z: -68}, {x: -41, z: -68}, {x: -36, z: -68}, {x: -31, z: -68}
    ];
    for (i = 0; i < podPositions.length; i++) {
      var pp = podPositions[i];
      var pod = _makeCyl(1.2, 1.2, 5, CRYO_COLOR, _scene, 12);
      pod.position.set(pp.x, 3.5, pp.z);
      pod.material.transparent = true;
      pod.material.opacity = 0.7;
      /* Pod cap */
      var podCap = _makeCyl(1.3, 1.3, 0.4, 0x7799AA, _scene, 12);
      podCap.position.set(pp.x, 6.2, pp.z);
      /* Pod status light */
      var podLight = new THREE.PointLight(0x88DDFF, 0.5, 6);
      podLight.position.set(pp.x, 4, pp.z);
      _scene.add(podLight);
    }

    /* Mist spheres (small white SphereGeometry) */
    for (i = 0; i < 40; i++) {
      var mist = _makeSphere(0.15 + Math.random() * 0.25, MIST_COLOR, _scene);
      mist.position.set(
        -35 + (Math.random() - 0.5) * 25,
        0.3 + Math.random() * 1.2,
        -75 + (Math.random() - 0.5) * 18
      );
      mist.material.transparent = true;
      mist.material.opacity = 0.5 + Math.random() * 0.3;
      mist.userData.driftX = (Math.random() - 0.5) * 0.8;
      mist.userData.driftZ = (Math.random() - 0.5) * 0.8;
      mist.userData.driftY = 0.1 + Math.random() * 0.2;
      mist.userData.baseY  = mist.position.y;
      mist.userData.phase  = Math.random() * Math.PI * 2;
      _mistParticles.push(mist);
    }

    /* Cryo room light */
    var cryoLight = new THREE.PointLight(0x99DDFF, 1.5, 40);
    cryoLight.position.set(-35, 10, -75);
    _scene.add(cryoLight);
  }

  /* ── Heat sources (red PointLight areas) ───────────────────────────────── */
  function _buildHeatSources() {
    var heatDefs = [
      /* Entrance camp fire area */
      { x: -12, y: 1, z: -5 },
      /* Right side of gate */
      { x: 15,  y: 1, z: -22 },
      /* Inside lab corridor */
      { x: -22, y: 1, z: -50 },
      /* Drill antechamber */
      { x: 12,  y: 1, z: -63 }
    ];
    var i;
    for (i = 0; i < heatDefs.length; i++) {
      var hd = heatDefs[i];
      /* Heater box */
      var heater = _makeBox(1.5, 2, 1.5, HEAT_COLOR, _scene);
      heater.position.set(hd.x, hd.y + 1, hd.z);
      /* Glow */
      var hLight = new THREE.PointLight(0xFF4400, 2.0, 10);
      hLight.position.set(hd.x, hd.y + 2, hd.z);
      _scene.add(hLight);
      _heatSources.push({ x: hd.x, y: hd.y, z: hd.z, light: hLight });
    }
  }

  /* ── Explosive charges (orange boxes, not yet placed on drill) ─────────── */
  function _buildDrillCharges() {
    var i;
    for (i = 0; i < DRILL_LEGS; i++) {
      var lp = _drillLegs[i];
      var charge = _makeBox(0.6, 0.4, 0.6, CHARGE_COLOR, _scene);
      charge.position.set(lp.pos.x, lp.pos.y + 2.5, lp.pos.z);
      charge.userData.isCharge = true;
      charge.userData.legIndex = i;
      charge.userData.planted = false;
      charge.visible = false;  /* hidden until planted */
      _charges.push({
        mesh: charge,
        leg: i,
        planted: false,
        holdTimer: 0
      });
    }
  }

  /* ── Cryo-flood plane ───────────────────────────────────────────────────── */
  function _buildFloodPlane() {
    var geo = new THREE.BoxGeometry(300, 0.5, 300);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x4499CC,
      transparent: true,
      opacity: 0.7
    });
    _floodMesh = new THREE.Mesh(geo, mat);
    _floodMesh.position.set(0, _floodLevel, 0);
    _floodMesh.visible = false;
    _scene.add(_floodMesh);
  }

  /* ── Mist particle spheres ──────────────────────────────────────────────── */
  function _buildMistParticles() {
    /* Additional exterior mist */
    var i;
    for (i = 0; i < 30; i++) {
      var mist = _makeSphere(0.12 + Math.random() * 0.2, 0xDDEEFF, _scene);
      mist.position.set(
        (Math.random() - 0.5) * 140,
        0.2 + Math.random() * 1.5,
        -20 + (Math.random() - 0.5) * 80
      );
      mist.material.transparent = true;
      mist.material.opacity = 0.3 + Math.random() * 0.3;
      mist.userData.driftX = (Math.random() - 0.5) * 1.2;
      mist.userData.driftZ = (Math.random() - 0.5) * 1.2;
      mist.userData.driftY = 0.05 + Math.random() * 0.1;
      mist.userData.baseY  = mist.position.y;
      mist.userData.phase  = Math.random() * Math.PI * 2;
      _mistParticles.push(mist);
    }
  }

  /* ── Escape marker ──────────────────────────────────────────────────────── */
  function _buildEscapeMarker() {
    /* Green light at escape hatch */
    var escLight = new THREE.PointLight(0x00FF88, 2.0, 20);
    escLight.position.set(_escapeZone.x, 3, _escapeZone.z);
    _scene.add(escLight);

    var escPad = _makeBox(8, 0.3, 8, 0x225533, _scene);
    escPad.position.set(_escapeZone.x, 0.15, _escapeZone.z);

    /* Vertical poles */
    var i;
    for (i = 0; i < 4; i++) {
      var ang = (i / 4) * Math.PI * 2;
      var pole = _makeBox(0.3, 4, 0.3, 0x33AA66, _scene);
      pole.position.set(
        _escapeZone.x + Math.cos(ang) * 4,
        2,
        _escapeZone.z + Math.sin(ang) * 4
      );
    }

    /* Wire frame outline */
    var escWire = _wireBox(8, 4, 8, 0x00FF88, _scene);
    escWire.position.set(_escapeZone.x, 2, _escapeZone.z);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ENEMIES
     ════════════════════════════════════════════════════════════════════════════ */
  function _buildEnemies() {
    _buildArcticSoldiers();
    _buildScientists();
  }

  function _buildArcticSoldiers() {
    var soldierPositions = [
      {x: -40, z: -5},   {x:  35, z: -8},
      {x: -55, z: -45},  {x:  50, z: -42},
      {x: -25, z: -20},  {x:  22, z: -20},
      {x: -35, z: -32},  {x:  30, z: -32},
      {x: -22, z: -27},  {x:  22, z: -27}   /* guard towers */
    ];
    var i;
    for (i = 0; i < ARCTIC_COUNT; i++) {
      var sp = soldierPositions[i];
      var body = _makeBox(0.8, 1.6, 0.6, ARCTIC_COLOR, _scene);
      body.position.set(sp.x, 1.8, sp.z);
      var head = _makeSphere(0.4, 0xCCDDEE, _scene);
      head.position.set(sp.x, 3.2, sp.z);

      /* Sniper rifle suggestion — LineSegments */
      var rfleVerts = [
        0, 0, 0,
        0, 0, -2
      ];
      var rfleGeo = new THREE.BufferGeometry();
      rfleGeo.setAttribute('position', new THREE.Float32BufferAttribute(rfleVerts, 3));
      var rfleMat = new THREE.LineBasicMaterial({ color: 0x334455 });
      var rifle = new THREE.LineSegments(rfleGeo, rfleMat);
      rifle.position.set(sp.x + 0.5, 2.8, sp.z);
      _scene.add(rifle);

      _arcticSoldiers.push({
        body: body,
        head: head,
        hp: 85,
        alive: true,
        x: sp.x, y: 1.8, z: sp.z,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolSpeed: 1.2 + Math.random() * 0.8,
        patrolRadius: 5 + Math.random() * 8,
        baseX: sp.x, baseZ: sp.z,
        shootTimer: 1.5 + Math.random() * 2,
        alertTimer: 0,
        alerted: false,
        shootRange: 35
      });
    }
  }

  function _buildScientists() {
    var sciPositions = [
      {x: -15, z: -45}, {x: 0,   z: -55},
      {x:  10, z: -42}, {x: -8,  z: -60},
      {x:  18, z: -52}, {x: -18, z: -58}
    ];
    var i;
    for (i = 0; i < SCIENTIST_COUNT; i++) {
      var sp = sciPositions[i];
      var body = _makeBox(0.7, 1.5, 0.55, SCIENTIST_COLOR, _scene);
      body.position.set(sp.x, 1.75, sp.z);
      var head = _makeSphere(0.35, 0xFFDDAA, _scene);
      head.position.set(sp.x, 3.0, sp.z);
      /* Lab coat accent */
      var coat = _makeBox(0.75, 1.0, 0.6, 0xEEEEEE, _scene);
      coat.position.set(sp.x, 1.5, sp.z);

      _scientists.push({
        body: body,
        head: head,
        coat: coat,
        hp: 65,
        alive: true,
        x: sp.x, y: 1.75, z: sp.z,
        baseX: sp.x, baseZ: sp.z,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolSpeed: 1.8 + Math.random() * 1,
        patrolRadius: 6 + Math.random() * 6,
        shootTimer: 2.5 + Math.random() * 2,
        alerted: false,
        alertTimer: 0,
        shootRange: 25,
        fleeOnAlert: true
      });
    }
  }

  /* ── Dr. Kryos (boss) ───────────────────────────────────────────────────── */
  function _buildKryos() {
    var body = _makeBox(1.1, 2.0, 0.8, KRYOS_COLOR, _scene);
    body.position.set(0, 2, -90);

    var head = _makeSphere(0.5, 0xCCDDEE, _scene);
    head.position.set(0, 3.6, -90);

    /* Armor spikes — LineSegments */
    var spikeVerts = [];
    var j;
    for (j = 0; j < 6; j++) {
      var ang = (j / 6) * Math.PI * 2;
      spikeVerts.push(
        Math.cos(ang) * 0.6, 1.0, Math.sin(ang) * 0.6,
        Math.cos(ang) * 1.1, 1.8, Math.sin(ang) * 1.1
      );
    }
    var spikeGeo = new THREE.BufferGeometry();
    spikeGeo.setAttribute('position', new THREE.Float32BufferAttribute(spikeVerts, 3));
    var spikeMat = new THREE.LineBasicMaterial({ color: 0x88CCFF });
    var spikes = new THREE.LineSegments(spikeGeo, spikeMat);
    spikes.position.set(0, 2, -90);
    _scene.add(spikes);

    /* Kryos light */
    var kryosLight = new THREE.PointLight(0x0088FF, 1.5, 20);
    kryosLight.position.set(0, 5, -90);
    _scene.add(kryosLight);

    _kryos = {
      body: body,
      head: head,
      spikes: spikes,
      hp: KRYOS_HP,
      maxHp: KRYOS_HP,
      alive: true,
      phase2: false,
      x: 0, y: 2, z: -90,
      shootTimer: 2.0,
      burstCount: 0,
      lightRef: kryosLight,
      alerted: false
    };
  }

  /* ════════════════════════════════════════════════════════════════════════════
     PLAYER INIT / SYNC
     ════════════════════════════════════════════════════════════════════════════ */
  function _placePlayer() {
    _player.x = 0;
    _player.y = 2;
    _player.z = 20;
    _player.vx = 0;
    _player.vy = 0;
    _player.vz = 0;
    _player.yaw = 0;
    _player.hp = 100;
    _player.onGround = false;
  }

  function _syncCamera() {
    if (!_camera) return;
    _camera.position.set(_player.x, _player.y + 1.5, _player.z);
    _camera.rotation.set(0, _player.yaw, 0, 'YXZ');
  }

  /* ════════════════════════════════════════════════════════════════════════════
     INPUT
     ════════════════════════════════════════════════════════════════════════════ */
  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = true;

    var now = Date.now();
    if (key === ACTIVATION_KEY_A) _gPressTime = now;
    if (key === ACTIVATION_KEY_B) _lPressTime = now;

    /* Activation check */
    if (!_active && Math.abs(_gPressTime - _lPressTime) < ACTIVATION_WINDOW &&
        _gPressTime > 0 && _lPressTime > 0) {
      init();
      return;
    }

    if (!_active || _won || _lost) return;

    if (key === ' ' && _player.onGround) {
      _player.vy = JUMP_VEL;
      _player.onGround = false;
    }

    if (key === 'e') {
      _eHolding = true;
      _eHoldTimer = 0;
      _findNearbyLeg();
    }
  }

  function _onKeyUp(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = false;
    if (key === 'e') {
      _eHolding = false;
      _eHoldTimer = 0;
      _eTargetLeg = -1;
    }
  }

  function _onMouseDown(e) {
    if (!_active || _won || _lost) return;
    if (e.button === 0) _tryShoot();
  }

  function _onMouseMove(e) {
    if (!_active || _won || _lost) return;
    if (document.pointerLockElement === _renderer.domElement) {
      _player.yaw -= e.movementX * 0.002;
    }
  }

  function _onResize() {
    if (!_camera || !_renderer) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    _camera.aspect = w / h;
    _camera.updateProjectionMatrix();
    _renderer.setSize(w, h);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     SHOOT
     ════════════════════════════════════════════════════════════════════════════ */
  function _tryShoot() {
    if (_shootTimer > 0) return;
    _shootTimer = SHOOT_COOLDOWN;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(0, _player.yaw, 0, 'YXZ'));

    var geo = new THREE.SphereGeometry(0.12, 5, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFFF44 });
    var bMesh = new THREE.Mesh(geo, mat);
    bMesh.position.set(_player.x, _player.y + 1.5, _player.z);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vx: dir.x * BULLET_SPEED,
      vy: dir.y * BULLET_SPEED,
      vz: dir.z * BULLET_SPEED,
      fromPlayer: true,
      dmg: 20,
      life: 3.0
    });
  }

  function _spawnIceShard(ex, ey, ez) {
    var dx = _player.x - ex;
    var dy = (_player.y + 1) - ey;
    var dz = _player.z - ez;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;
    dx /= len; dy /= len; dz /= len;

    /* White ConeGeometry ice shard projectile */
    var geo = new THREE.ConeGeometry(0.2, 1.2, 5);
    var mat = new THREE.MeshLambertMaterial({ color: 0xEEFFFF });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ex, ey, ez);
    /* Rotate to face direction */
    mesh.rotation.z = Math.PI / 2;
    _scene.add(mesh);

    _bullets.push({
      mesh: mesh,
      vx: dx * 22,
      vy: dy * 22,
      vz: dz * 22,
      fromPlayer: false,
      dmg: ICE_SHARD_DMG,
      life: 4.0
    });
  }

  function _spawnEnemyBullet(ex, ey, ez, dmg) {
    var dx = _player.x - ex;
    var dy = (_player.y + 1) - ey;
    var dz = _player.z - ez;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;
    dx /= len; dy /= len; dz /= len;

    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ex, ey, ez);
    _scene.add(mesh);

    _bullets.push({
      mesh: mesh,
      vx: dx * 28,
      vy: dy * 28,
      vz: dz * 28,
      fromPlayer: false,
      dmg: dmg || BULLET_DMG_PLAYER,
      life: 3.5
    });
  }

  /* ════════════════════════════════════════════════════════════════════════════
     DRILL CHARGE INTERACTION
     ════════════════════════════════════════════════════════════════════════════ */
  function _findNearbyLeg() {
    _eTargetLeg = -1;
    var i;
    for (i = 0; i < _drillLegs.length; i++) {
      if (_charges[i].planted) continue;
      var lp = _drillLegs[i].pos;
      var d = _dist3(_player.x, _player.y, _player.z, lp.x, lp.y, lp.z);
      if (d < 4.5) {
        _eTargetLeg = i;
        return;
      }
    }
  }

  function _plantCharge(legIdx) {
    if (_charges[legIdx].planted) return;
    _charges[legIdx].planted = true;
    _charges[legIdx].mesh.position.set(
      _drillLegs[legIdx].pos.x,
      _drillLegs[legIdx].pos.y + 0.5,
      _drillLegs[legIdx].pos.z
    );
    _charges[legIdx].mesh.visible = true;
    _chargesPlanted++;

    /* Orange flash light */
    var chargeLight = new THREE.PointLight(CHARGE_COLOR, 1.5, 5);
    chargeLight.position.copy(_charges[legIdx].mesh.position);
    _scene.add(chargeLight);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     UPDATE
     ════════════════════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (!_active || _won || _lost) return;
    _time += dt;

    _updatePlayer(dt);
    _updateHypothermia(dt);
    _updateIceSlide(dt);
    _updateEHold(dt);
    _updateEnemies(dt);
    _updateKryos(dt);
    _updateBullets(dt);
    _updateFlood(dt);
    _updateMist(dt);
    _updateDrill(dt);
    _checkWin();
    _checkLose();
    _syncCamera();

    if (_shootTimer > 0) _shootTimer -= dt;
  }

  /* ── Player movement ────────────────────────────────────────────────────── */
  function _updatePlayer(dt) {
    if (_won || _lost) return;

    /* Turn with Q/ArrowLeft/ArrowRight */
    if (_keysDown['q'] || _keysDown['arrowleft'])  _player.yaw += dt * 1.8;
    if (_keysDown['arrowright'])                    _player.yaw -= dt * 1.8;

    var spd = (_hypothermia >= HYPO_SLOW_THRESHOLD) ? PLAYER_SPEED_SLOW : PLAYER_SPEED;

    var fwd = 0, str = 0;
    if (_keysDown['w'] || _keysDown['arrowup'])   fwd -= 1;
    if (_keysDown['s'] || _keysDown['arrowdown']) fwd += 1;
    if (_keysDown['a'])                           str -= 1;
    if (_keysDown['d'])                           str += 1;

    var sinY = Math.sin(_player.yaw);
    var cosY = Math.cos(_player.yaw);

    var moveX = (fwd * (-sinY) + str * cosY) * spd;
    var moveZ = (fwd * (-cosY) + str * (-sinY)) * spd;

    /* On ice — apply slide (velocity maintained longer) */
    _onIce = _isOnIceSurface(_player.x, _player.z);
    if (_onIce) {
      var decay = _iceDecay;
      _slideVx += (moveX - _slideVx) * decay * dt * 2;
      _slideVz += (moveZ - _slideVz) * decay * dt * 2;
      _player.x += _slideVx * dt;
      _player.z += _slideVz * dt;
    } else {
      _slideVx = moveX;
      _slideVz = moveZ;
      _player.x += moveX * dt;
      _player.z += moveZ * dt;
    }

    /* Gravity */
    _player.vy -= GRAVITY * dt;
    _player.y  += _player.vy * dt;

    /* Floor collision */
    var floorY = _getFloorY(_player.x, _player.z);
    if (floorY !== null && _player.y <= floorY + 0.05) {
      _player.y = floorY;
      _player.vy = 0;
      _player.onGround = true;
    } else {
      if (_player.y > 0) _player.onGround = false;
    }

    /* Hard ground fallback */
    if (_player.y < 0.05) {
      _player.y = 0.05;
      _player.vy = 0;
      _player.onGround = true;
    }

    /* Clamp to world */
    _player.x = _clamp(_player.x, -75, 75);
    _player.z = _clamp(_player.z, -100, 30);

    /* Check heat sources */
    _nearHeat = _isNearHeatSource();
  }

  function _isOnIceSurface(x, z) {
    /* simple check using ice floor tiles */
    var iceFloors = [
      {x1: -150, x2: 150, z1: -35, z2: 35},    /* exterior glacier */
      {x1: -80, x2: -30,  z1: -80, z2: -30},    /* left shelf */
      {x1:  30, x2:  80,  z1: -80, z2: -30}     /* right shelf */
    ];
    var i;
    for (i = 0; i < iceFloors.length; i++) {
      var f = iceFloors[i];
      if (x >= f.x1 && x <= f.x2 && z >= f.z1 && z <= f.z2) return true;
    }
    return false;
  }

  function _isNearHeatSource() {
    var i;
    for (i = 0; i < _heatSources.length; i++) {
      var hs = _heatSources[i];
      if (_dist3(_player.x, _player.y, _player.z, hs.x, hs.y, hs.z) < 5) {
        return true;
      }
    }
    return false;
  }

  /* ── Hypothermia ────────────────────────────────────────────────────────── */
  function _updateHypothermia(dt) {
    if (_nearHeat) {
      _hypothermia += HYPO_RATE_HEAT * dt;
    } else {
      _hypothermia += HYPO_RATE_COLD * dt;
    }
    _hypothermia = _clamp(_hypothermia, 0, 100);

    /* Take damage at max hypothermia */
    if (_hypothermia >= 100) {
      _player.hp -= 5 * dt;
    }
  }

  /* ── Ice slide decay ────────────────────────────────────────────────────── */
  function _updateIceSlide(dt) {
    if (!_onIce) {
      /* Faster decay off ice */
      var decay = _slideDecay * 4;
      _slideVx -= _slideVx * decay * dt;
      _slideVz -= _slideVz * decay * dt;
    }
  }

  /* ── E-hold charge planting ─────────────────────────────────────────────── */
  function _updateEHold(dt) {
    if (!_eHolding) return;
    if (_eTargetLeg < 0) {
      _findNearbyLeg();
      return;
    }
    if (_charges[_eTargetLeg].planted) {
      _eTargetLeg = -1;
      return;
    }
    var lp = _drillLegs[_eTargetLeg].pos;
    var d  = _dist3(_player.x, _player.y, _player.z, lp.x, lp.y, lp.z);
    if (d > 5) {
      _eTargetLeg = -1;
      _eHoldTimer = 0;
      return;
    }
    _eHoldTimer += dt;
    if (_eHoldTimer >= DRILL_CHARGE_HOLD) {
      _plantCharge(_eTargetLeg);
      _eHoldTimer = 0;
      _eTargetLeg = -1;
    }
  }

  /* ── Arctic soldier AI ──────────────────────────────────────────────────── */
  function _updateEnemies(dt) {
    var i;
    for (i = 0; i < _arcticSoldiers.length; i++) {
      _updateArcticSoldier(_arcticSoldiers[i], dt);
    }
    for (i = 0; i < _scientists.length; i++) {
      _updateScientist(_scientists[i], dt);
    }
  }

  function _updateArcticSoldier(s, dt) {
    if (!s.alive) return;

    var distToPlayer = _dist3(s.x, s.y, s.z, _player.x, _player.y, _player.z);

    if (distToPlayer < 30) s.alerted = true;

    if (s.alerted) {
      /* Chase toward player at half speed */
      var dx = _player.x - s.x;
      var dz = _player.z - s.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      s.x += (dx / len) * s.patrolSpeed * dt;
      s.z += (dz / len) * s.patrolSpeed * dt;
    } else {
      /* Patrol orbit around base */
      s.patrolAngle += s.patrolSpeed * 0.15 * dt;
      s.x = s.baseX + Math.cos(s.patrolAngle) * s.patrolRadius;
      s.z = s.baseZ + Math.sin(s.patrolAngle) * s.patrolRadius;
    }

    s.body.position.set(s.x, s.y, s.z);
    s.head.position.set(s.x, s.y + 1.4, s.z);

    /* Shoot at player */
    if (distToPlayer < s.shootRange) {
      s.shootTimer -= dt;
      if (s.shootTimer <= 0) {
        s.shootTimer = 2.0 + Math.random() * 2;
        _spawnEnemyBullet(s.x, s.y + 1, s.z, BULLET_DMG_PLAYER);
      }
    }
  }

  function _updateScientist(sc, dt) {
    if (!sc.alive) return;

    var distToPlayer = _dist3(sc.x, sc.y, sc.z, _player.x, _player.y, _player.z);

    if (distToPlayer < 20) sc.alerted = true;

    if (sc.alerted) {
      if (sc.fleeOnAlert) {
        /* Scientists flee — run away from player (shortcuts through lab) */
        var dx = sc.x - _player.x;
        var dz = sc.z - _player.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        sc.x += (dx / len) * sc.patrolSpeed * dt;
        sc.z += (dz / len) * sc.patrolSpeed * dt;
      }
    } else {
      sc.patrolAngle += sc.patrolSpeed * 0.12 * dt;
      sc.x = sc.baseX + Math.cos(sc.patrolAngle) * sc.patrolRadius;
      sc.z = sc.baseZ + Math.sin(sc.patrolAngle) * sc.patrolRadius;
    }

    /* Still shoot (pistol) when player is close */
    if (distToPlayer < sc.shootRange) {
      sc.shootTimer -= dt;
      if (sc.shootTimer <= 0) {
        sc.shootTimer = 3.0 + Math.random() * 2;
        _spawnEnemyBullet(sc.x, sc.y + 0.8, sc.z, 8);
      }
    }

    sc.body.position.set(sc.x, sc.y, sc.z);
    sc.head.position.set(sc.x, sc.y + 1.3, sc.z);
    sc.coat.position.set(sc.x, sc.y, sc.z);
  }

  /* ── Dr. Kryos boss AI ──────────────────────────────────────────────────── */
  function _updateKryos(dt) {
    if (!_kryos || !_kryos.alive) return;

    var distToPlayer = _dist3(_kryos.x, _kryos.y, _kryos.z,
                              _player.x, _player.y, _player.z);

    if (distToPlayer < 40) _kryos.alerted = true;
    if (!_kryos.alerted) return;

    /* Kryos circles around drill chamber center */
    _kryos.x = Math.sin(_time * 0.4) * 8;
    _kryos.z = -80 + Math.cos(_time * 0.3) * 10;
    _kryos.body.position.set(_kryos.x, _kryos.y, _kryos.z);
    _kryos.head.position.set(_kryos.x, _kryos.y + 1.6, _kryos.z);
    _kryos.spikes.position.set(_kryos.x, _kryos.y, _kryos.z);

    /* Phase 2 at 50% HP — activate cryo-flood */
    if (!_kryos.phase2 && _kryos.hp <= _kryos.maxHp * KRYOS_PHASE2_PCT) {
      _kryos.phase2 = true;
      _activateCryoFlood();
    }

    /* Shoot ice shards */
    _kryos.shootTimer -= dt;
    var fireRate = _kryos.phase2 ? 1.0 : 2.0;
    if (_kryos.shootTimer <= 0 && distToPlayer < 50) {
      _kryos.shootTimer = fireRate;
      /* Fire 1-3 ice shards */
      var count = _kryos.phase2 ? 3 : 1;
      var k;
      for (k = 0; k < count; k++) {
        var offX = (Math.random() - 0.5) * 4;
        var offY = (Math.random() - 0.5) * 2;
        _spawnIceShard(
          _kryos.x + offX,
          _kryos.y + 1.2 + offY,
          _kryos.z
        );
      }
      /* Pulsed light */
      if (_kryos.lightRef) {
        _kryos.lightRef.intensity = 3.5;
      }
    }

    /* Dim light back down */
    if (_kryos.lightRef && _kryos.lightRef.intensity > 1.5) {
      _kryos.lightRef.intensity -= dt * 6;
    }
  }

  /* ── Cryo flood activation ──────────────────────────────────────────────── */
  function _activateCryoFlood() {
    _floodActive = true;
    _floodLevel  = -4;
    if (_floodMesh) _floodMesh.visible = true;
  }

  /* ── Flood update ───────────────────────────────────────────────────────── */
  function _updateFlood(dt) {
    if (!_floodActive) return;
    _floodLevel += FLOOD_RISE_RATE * dt;
    if (_floodMesh) _floodMesh.position.y = _floodLevel;

    /* Player drowning check */
    if (_player.y < _floodLevel + 0.3) {
      _player.hp -= 20 * dt;
      _hypothermia = Math.min(100, _hypothermia + 30 * dt);
    }
  }

  /* ── Bullet updates ─────────────────────────────────────────────────────── */
  function _updateBullets(dt) {
    var i, j;
    for (i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      b.life -= dt;

      if (b.fromPlayer) {
        var hit = false;
        /* Check arctic soldier hits */
        for (j = 0; j < _arcticSoldiers.length; j++) {
          var s = _arcticSoldiers[j];
          if (!s.alive) continue;
          var d = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                         s.x, s.y + 0.8, s.z);
          if (d < 1.0) {
            s.hp -= b.dmg;
            if (s.hp <= 0) {
              s.alive = false;
              s.body.visible = false;
              s.head.visible = false;
            }
            hit = true;
            break;
          }
        }
        if (!hit) {
          /* Check scientist hits */
          for (j = 0; j < _scientists.length; j++) {
            var sc = _scientists[j];
            if (!sc.alive) continue;
            var sd = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                            sc.x, sc.y + 0.75, sc.z);
            if (sd < 0.9) {
              sc.hp -= b.dmg;
              if (sc.hp <= 0) {
                sc.alive = false;
                sc.body.visible = false;
                sc.head.visible = false;
                sc.coat.visible = false;
              }
              hit = true;
              break;
            }
          }
        }
        if (!hit && _kryos && _kryos.alive) {
          var kd = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                          _kryos.x, _kryos.y + 1, _kryos.z);
          if (kd < 1.4) {
            _kryos.hp -= b.dmg;
            if (_kryos.hp <= 0) {
              _kryos.alive = false;
              _kryos.body.visible = false;
              _kryos.head.visible = false;
              _kryos.spikes.visible = false;
            }
            hit = true;
          }
        }
        if (hit || b.life <= 0) {
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
        }
      } else {
        /* Enemy bullet hits player */
        var pd = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                        _player.x, _player.y + 1, _player.z);
        if (pd < 0.8 || b.life <= 0) {
          if (pd < 0.8) {
            _player.hp -= b.dmg;
            /* Ice shard extra hypothermia */
            if (b.dmg === ICE_SHARD_DMG) {
              _hypothermia = Math.min(100, _hypothermia + 10);
            }
          }
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
        }
      }
    }
  }

  /* ── Mist animation ─────────────────────────────────────────────────────── */
  function _updateMist(dt) {
    var i;
    for (i = 0; i < _mistParticles.length; i++) {
      var m = _mistParticles[i];
      m.position.x += m.userData.driftX * dt;
      m.position.z += m.userData.driftZ * dt;
      m.position.y = m.userData.baseY + Math.sin(_time * 0.5 + m.userData.phase) * 0.3;
      /* Wrap drift */
      if (Math.abs(m.position.x - (m.userData.baseX || m.position.x)) > 5) {
        m.userData.driftX *= -1;
      }
      if (Math.abs(m.position.z - (m.userData.baseZ || m.position.z)) > 5) {
        m.userData.driftZ *= -1;
      }
    }
  }

  /* ── Drill rotation ─────────────────────────────────────────────────────── */
  function _updateDrill(dt) {
    if (_drillHead) {
      _drillHead.rotation.y += 1.5 * dt;
    }
    if (_drillMesh) {
      _drillMesh.rotation.y += 0.4 * dt;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     WIN / LOSE
     ════════════════════════════════════════════════════════════════════════════ */
  function _checkWin() {
    if (_won || _lost) return;
    /* All charges planted, Kryos dead, player at escape zone */
    if (_chargesPlanted >= DRILL_LEGS && _kryos && !_kryos.alive) {
      var distToEscape = _dist2(_player.x, _player.z, _escapeZone.x, _escapeZone.z);
      if (distToEscape < _escapeZone.r) {
        _won = true;
        _escaped = true;
        _showMessage('MISSION COMPLETE! GLACIER FORTRESS DESTROYED! ESCAPED!', '#44FF88');
      }
    }
  }

  function _checkLose() {
    if (_won || _lost) return;
    if (_player.hp <= 0) {
      _lost = true;
      _loseMsg = 'KIA - ELIMINATED IN GLACIER FORTRESS';
      _showMessage('MISSION FAILED: ' + _loseMsg, '#FF3333');
      return;
    }
    if (_floodActive && _floodLevel >= FLOOD_MAX && !_escaped) {
      _lost = true;
      _loseMsg = 'DROWNED IN CRYO-FLOOD';
      _showMessage('MISSION FAILED: ' + _loseMsg, '#FF3333');
    }
  }

  function _showMessage(msg, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + color,
      'font-family:"Courier New",monospace',
      'font-size:26px',
      'font-weight:bold',
      'z-index:99999',
      'text-align:center',
      'text-shadow:0 0 14px ' + color,
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ANIMATION LOOP
     ════════════════════════════════════════════════════════════════════════════ */
  function _animate(timestamp) {
    if (!_active) return;
    _raf = requestAnimationFrame(_animate);

    var dt = Math.min((timestamp - _lastTs) / 1000, 0.05);
    _lastTs = timestamp;
    if (dt <= 0) dt = 0.016;

    update(dt);
    _updateHUD();

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     LIFECYCLE
     ════════════════════════════════════════════════════════════════════════════ */
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (_active) return;
    _active = true;
    _won    = false;
    _lost   = false;
    _time   = 0;
    _lastTs = 0;

    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE.js not found');
      return;
    }

    /* Reuse existing scene/camera if available via game manager */
    if (window.GameManager && window.GameManager.getScene) {
      _scene    = window.GameManager.getScene();
      _camera   = window.GameManager.getCamera();
      _renderer = window.GameManager.getRenderer();
    } else {
      _setupRenderer();
    }

    _resetState();
    _buildScene();
    _placePlayer();
    _buildHUD();
    _bindInput();
    _raf = requestAnimationFrame(_animate);
  }

  function _setupRenderer() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    _scene  = new THREE.Scene();
    _camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 700);
    _camera.position.set(0, 4, 25);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(w, h);
    _renderer.shadowMap.enabled = true;
    _renderer.domElement.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'z-index:9000'
    ].join(';');
    document.body.appendChild(_renderer.domElement);
  }

  function _resetState() {
    _hypothermia    = 0;
    _nearHeat       = false;
    _onIce          = false;
    _slideVx        = 0;
    _slideVz        = 0;
    _chargesPlanted = 0;
    _eHolding       = false;
    _eHoldTimer     = 0;
    _eTargetLeg     = -1;
    _floodActive    = false;
    _floodLevel     = -5;
    _floodMesh      = null;
    _escaped        = false;
    _shootTimer     = 0;
    _bullets        = [];
    _arcticSoldiers = [];
    _scientists     = [];
    _kryos          = null;
    _drillMesh      = null;
    _drillHead      = null;
    _drillLegs      = [];
    _charges        = [];
    _heatSources    = [];
    _mistParticles  = [];
    _stalactites    = [];
    _iceSurfaces    = [];
    _floors         = [];
    _won            = false;
    _lost           = false;
    _loseMsg        = '';
    _player.hp      = 100;
  }

  function reset() {
    if (!_active) return;
    _teardownScene();
    _resetState();
    _buildScene();
    _placePlayer();
    _updateHUD();
  }

  function _teardownScene() {
    if (_scene) {
      while (_scene.children.length > 0) {
        var child = _scene.children[0];
        _scene.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            var k;
            for (k = 0; k < child.material.length; k++) {
              child.material[k].dispose();
            }
          } else {
            child.material.dispose();
          }
        }
      }
    }
  }

  function destroy() {
    if (!_active) return;
    _active = false;

    if (_raf) {
      cancelAnimationFrame(_raf);
      _raf = null;
    }

    _unbindInput();
    _removeHUD();

    if (_renderer && _renderer.domElement && _renderer.domElement.parentNode) {
      _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      _renderer.dispose();
      _renderer = null;
    }

    _teardownScene();
    _scene  = null;
    _camera = null;

    _resetState();
  }

  /* ════════════════════════════════════════════════════════════════════════════
     INPUT BINDING
     ════════════════════════════════════════════════════════════════════════════ */
  function _bindInput() {
    document.addEventListener('keydown',   _onKeyDown,   false);
    document.addEventListener('keyup',     _onKeyUp,     false);
    document.addEventListener('mousedown', _onMouseDown, false);
    document.addEventListener('mousemove', _onMouseMove, false);
    window.addEventListener('resize',      _onResize,    false);
  }

  function _unbindInput() {
    document.removeEventListener('keydown',   _onKeyDown,   false);
    document.removeEventListener('keyup',     _onKeyUp,     false);
    document.removeEventListener('mousedown', _onMouseDown, false);
    document.removeEventListener('mousemove', _onMouseMove, false);
    window.removeEventListener('resize',      _onResize,    false);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ACTIVATION LISTENER (G then L within 400ms)
     ════════════════════════════════════════════════════════════════════════════ */
  (function _installActivationListener() {
    var _pending = {};
    function _activationCheck(e) {
      var key = e.key.toLowerCase();
      var now = Date.now();
      if (key === ACTIVATION_KEY_A) _pending.g = now;
      if (key === ACTIVATION_KEY_B) _pending.l = now;
      if (_pending.g && _pending.l &&
          Math.abs(_pending.g - _pending.l) < ACTIVATION_WINDOW) {
        _pending = {};
        if (!_active) {
          init();
        } else {
          destroy();
        }
      }
    }
    document.addEventListener('keydown', _activationCheck, false);
  }());

  /* ════════════════════════════════════════════════════════════════════════════
     PUBLIC API
     ════════════════════════════════════════════════════════════════════════════ */
  return {
    init:    init,
    update:  update,
    reset:   reset,
    destroy: destroy,
    getState: function () {
      return {
        active:         _active,
        won:            _won,
        lost:           _lost,
        hypothermia:    _hypothermia,
        chargesPlanted: _chargesPlanted,
        floodLevel:     _floodLevel,
        floodActive:    _floodActive,
        playerHP:       _player.hp,
        kryosHP:        _kryos ? _kryos.hp : 0,
        kryosAlive:     _kryos ? _kryos.alive : false
      };
    }
  };

}());
