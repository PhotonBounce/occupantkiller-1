/* ─────────────────────────────────────────────────────────────────────────────
   plague-outbreak.js — Plague Outbreak FPS Mini-Game
   API: window.PlagueOutbreak = { init, update, reset }
   Activation: P + B simultaneous keypress (both within 400ms)

   Medieval city, 1350 AD. Black Death rages. You are a plague doctor sent to
   find the source and burn it out. Find and burn 5 plague pits, eliminate the
   Corrupted Inquisitor.

   Controls:
     P + B     → activate
     WASD      → move
     Mouse     → look
     Click     → fire crossbow
     E         → use item / hold 5s on pit to burn
     Q         → smoke bomb
     F         → toggle torch
     B         → ring church bell (when near church)
   ───────────────────────────────────────────────────────────────────────── */

window.PlagueOutbreak = (function () {
  'use strict';

  /* ── Activation ──────────────────────────────────────────────────────── */
  var _pTime = 0;
  var _bTime = 0;
  var ACTIVATE_WINDOW = 400;

  /* ── Renderer / scene ────────────────────────────────────────────────── */
  var _renderer = null;
  var _scene    = null;
  var _camera   = null;
  var _clock    = null;

  /* ── Game state ──────────────────────────────────────────────────────── */
  var _active       = false;
  var _victory      = false;
  var _defeat       = false;
  var _gameTime     = 0;
  var _msgText      = '';
  var _msgTimer     = 0;

  /* ── Player ──────────────────────────────────────────────────────────── */
  var _px = 0, _py = 1.8, _pz = 0;
  var _yaw   = 0;
  var _pitch = 0;
  var _hp    = 100;
  var _maxHp = 100;
  var _speed = 7;

  /* ── Infection ───────────────────────────────────────────────────────── */
  var _infected        = false;
  var _infectionTimer  = 0;   // seconds remaining
  var _infectionDps    = 3;
  var INFECTION_CHANCE = 0.20;
  var MASK_CHANCE      = 0.05;
  var INFECTION_DUR    = 30;

  /* ── Antidotes ───────────────────────────────────────────────────────── */
  var _antidotes      = 5;
  var _antidotePickups= [];  // { mesh, pos, taken }

  /* ── Plague pits ─────────────────────────────────────────────────────── */
  var _pits          = [];  // { mesh, light, burned, burnTimer, burningFx }
  var _pitsRequired  = 5;
  var _pitsBurned    = 0;
  var _eHeld         = false;
  var _eHoldTimer    = 0;
  var PIT_BURN_TIME  = 5;

  /* ── Inquisitor boss ─────────────────────────────────────────────────── */
  var _inquisitor    = null;  // { mesh, hp, phase, breathTimer, moveTimer }
  var INQUISITOR_HP  = 400;
  var _inquisitorDead= false;

  /* ── Enemies ─────────────────────────────────────────────────────────── */
  var _infected_enemies = []; // { mesh, hp, type, speed, state, stateTimer, stunTimer }
  var _priests           = []; // plague priests
  var _ratSwarms         = []; // rat swarms
  var _projectiles       = []; // { mesh, vx, vy, vz, life, damage, infects }

  /* ── Crossbow ────────────────────────────────────────────────────────── */
  var _crossbowAmmo    = 20;
  var _crossbowReload  = 0;
  var CROSSBOW_RELOAD  = 1.2;
  var CROSSBOW_DAMAGE  = 35;
  var CROSSBOW_PIERCE  = true;

  /* ── Torch ───────────────────────────────────────────────────────────── */
  var _torchActive    = true;
  var _torchMesh      = null;
  var TORCH_BONUS     = 0.5;

  /* ── Smoke bombs ─────────────────────────────────────────────────────── */
  var _smokeBombs     = 3;
  var _smokeClouds    = []; // { mesh, life, pos }
  var SMOKE_RADIUS    = 8;
  var SMOKE_SLOW      = 0.4;
  var SMOKE_DURATION  = 8;

  /* ── Church bell ─────────────────────────────────────────────────────── */
  var _bellStunActive = false;
  var _bellStunTimer  = 0;
  var _bellCooldown   = 0;
  var BELL_RANGE      = 30;
  var BELL_STUN_TIME  = 3;
  var BELL_COOLDOWN   = 15;
  var _churchPos      = { x: 0, z: -50 };

  /* ── Burning buildings ───────────────────────────────────────────────── */
  var _burningBldgs   = []; // { light, pos }

  /* ── Fog / ambient ───────────────────────────────────────────────────── */
  var _fogLight       = null;
  var _ambientLight   = null;

  /* ── World geometry (AABB collision) ────────────────────────────────── */
  var _walls          = []; // { minX, maxX, minZ, maxZ }

  /* ── HUD ─────────────────────────────────────────────────────────────── */
  var _hudEl = null;

  /* ── Input ───────────────────────────────────────────────────────────── */
  var _keys      = {};
  var _mouseDown = false;

  var _boundKeyDown     = null;
  var _boundKeyUp       = null;
  var _boundMouseMove   = null;
  var _boundMouseDown   = null;
  var _boundMouseUp     = null;
  var _boundCtxMenu     = null;
  var _boundResize      = null;

  var _animFrame = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function _dist(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function _showMsg(txt, dur) {
    _msgText  = txt;
    _msgTimer = dur || 2.5;
  }
  function _makeMesh(THREE, geo, color) {
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }
  function _padZ(n) { return n < 10 ? '0' + n : '' + n; }
  function _fmtTime(s) {
    s = Math.floor(s);
    return _padZ(Math.floor(s / 60)) + ':' + _padZ(s % 60);
  }
  function _inSmoke(x, z) {
    for (var i = 0; i < _smokeClouds.length; i++) {
      var sc = _smokeClouds[i];
      if (_dist(x, z, sc.pos.x, sc.pos.z) < SMOKE_RADIUS) { return true; }
    }
    return false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION KEY
  ═══════════════════════════════════════════════════════════════════════════*/

  function _onKeyDown(e) {
    var k   = e.key ? e.key.toLowerCase() : '';
    var now = Date.now();
    if (k === 'p') { _pTime = now; }
    if (k === 'b') { _bTime = now; }
    if ((k === 'p' || k === 'b') &&
        _pTime > 0 && _bTime > 0 &&
        Math.abs(_pTime - _bTime) <= ACTIVATE_WINDOW) {
      if (!_active) { _activate(); }
      _pTime = 0; _bTime = 0;
    }
    if (_active) {
      _keys[k] = true;
      if (k === 'e') { _eHeld = true; }
      if (k === 'q') { _throwSmoke(); }
      if (k === 'f') { _toggleTorch(); }
      if (k === 'b') { _ringBell(); }
    }
  }

  function _onKeyUp(e) {
    var k = e.key ? e.key.toLowerCase() : '';
    _keys[k] = false;
    if (k === 'e') { _eHeld = false; _eHoldTimer = 0; }
  }

  function _onMouseMove(e) {
    if (!_active) { return; }
    _yaw   -= e.movementX * 0.002;
    _pitch  = _clamp(_pitch - e.movementY * 0.002, -1.2, 1.2);
  }

  function _onMouseDown(e) {
    if (!_active) { return; }
    if (e.button === 0) {
      _mouseDown = true;
      _fireCrossbow();
    }
  }
  function _onMouseUp()  { _mouseDown = false; }
  function _onCtxMenu(e) { e.preventDefault(); }

  function _onResize() {
    if (!_renderer || !_camera) { return; }
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATE / DEACTIVATE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _activate() {
    if (_active) { return; }
    _active = true;
    _buildScene();
    _buildHUD();
    _bindInput();
    _animFrame = requestAnimationFrame(_loop);
  }

  function _deactivate() {
    if (!_active) { return; }
    _active = false;
    if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
    _unbindInput();
    if (_renderer && _renderer.domElement && _renderer.domElement.parentNode) {
      _renderer.domElement.parentNode.removeChild(_renderer.domElement);
    }
    if (_hudEl && _hudEl.parentNode) { _hudEl.parentNode.removeChild(_hudEl); }
    if (document.exitPointerLock) { document.exitPointerLock(); }
    _renderer = null;
    _scene    = null;
    _camera   = null;
    _clock    = null;
    _hudEl    = null;
    /* reset state */
    _resetState();
  }

  function _resetState() {
    _victory = false; _defeat = false; _gameTime = 0;
    _px = 0; _py = 1.8; _pz = 0; _yaw = 0; _pitch = 0;
    _hp = 100; _infected = false; _infectionTimer = 0;
    _antidotes = 5; _antidotePickups = [];
    _pits = []; _pitsBurned = 0;
    _inquisitor = null; _inquisitorDead = false;
    _infected_enemies = []; _priests = []; _ratSwarms = [];
    _projectiles = []; _smokeClouds = [];
    _crossbowAmmo = 20; _crossbowReload = 0;
    _torchActive = true; _torchMesh = null;
    _smokeBombs = 3;
    _bellStunActive = false; _bellStunTimer = 0; _bellCooldown = 0;
    _burningBldgs = []; _walls = [];
    _keys = {}; _mouseDown = false;
    _msgText = ''; _msgTimer = 0;
    _fogLight = null; _ambientLight = null;
    _eHeld = false; _eHoldTimer = 0;
  }

  function _bindInput() {
    _boundKeyDown   = _onKeyDown;
    _boundKeyUp     = _onKeyUp;
    _boundMouseMove = _onMouseMove;
    _boundMouseDown = _onMouseDown;
    _boundMouseUp   = _onMouseUp;
    _boundCtxMenu   = _onCtxMenu;
    _boundResize    = _onResize;
    window.addEventListener('keydown',   _boundKeyDown);
    window.addEventListener('keyup',     _boundKeyUp);
    window.addEventListener('mousemove', _boundMouseMove);
    window.addEventListener('mousedown', _boundMouseDown);
    window.addEventListener('mouseup',   _boundMouseUp);
    window.addEventListener('contextmenu', _boundCtxMenu);
    window.addEventListener('resize',    _boundResize);
    if (_renderer) {
      _renderer.domElement.addEventListener('click', function () {
        _renderer.domElement.requestPointerLock();
      });
    }
  }

  function _unbindInput() {
    if (_boundKeyDown)   { window.removeEventListener('keydown',   _boundKeyDown); }
    if (_boundKeyUp)     { window.removeEventListener('keyup',     _boundKeyUp); }
    if (_boundMouseMove) { window.removeEventListener('mousemove', _boundMouseMove); }
    if (_boundMouseDown) { window.removeEventListener('mousedown', _boundMouseDown); }
    if (_boundMouseUp)   { window.removeEventListener('mouseup',   _boundMouseUp); }
    if (_boundCtxMenu)   { window.removeEventListener('contextmenu', _boundCtxMenu); }
    if (_boundResize)    { window.removeEventListener('resize',    _boundResize); }
    _boundKeyDown = _boundKeyUp = _boundMouseMove = null;
    _boundMouseDown = _boundMouseUp = _boundCtxMenu = _boundResize = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE CONSTRUCTION
  ═══════════════════════════════════════════════════════════════════════════*/

  function _buildScene() {
    var THREE = window.THREE;
    if (!THREE) { alert('PlagueOutbreak: THREE.js not found'); _active = false; return; }

    _scene    = new THREE.Scene();
    _scene.background = new THREE.Color(0x221408);
    _scene.fog        = new THREE.FogExp2(0x1a1205, 0.018);

    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);

    _clock    = new THREE.Clock();

    _renderer = new THREE.WebGLRenderer({ antialias: false });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.shadowMap.enabled = false;
    _renderer.domElement.style.position = 'fixed';
    _renderer.domElement.style.top      = '0';
    _renderer.domElement.style.left     = '0';
    _renderer.domElement.style.zIndex   = '9000';
    document.body.appendChild(_renderer.domElement);

    /* ── Lighting ────────────────────────────────────────────────────── */
    _ambientLight = new THREE.AmbientLight(0x331100, 0.6);
    _scene.add(_ambientLight);

    /* Disease fog light — dim green tint over the whole scene */
    _fogLight = new THREE.PointLight(0x44CC44, 0.12, 200);
    _fogLight.position.set(0, 20, 0);
    _scene.add(_fogLight);

    /* Moon */
    var moonLight = new THREE.DirectionalLight(0x8899aa, 0.4);
    moonLight.position.set(-30, 60, 10);
    _scene.add(moonLight);

    /* ── Ground (cobblestone) ────────────────────────────────────────── */
    _buildGround(THREE);

    /* ── City layout ─────────────────────────────────────────────────── */
    _buildRowHouses(THREE);
    _buildChurch(THREE);
    _buildMarketSquare(THREE);
    _buildInquisitionKeep(THREE);
    _buildCatacombs(THREE);
    _buildPuddles(THREE);
    _buildBurningBuildings(THREE);
    _buildWell(THREE);

    /* ── Plague pits ─────────────────────────────────────────────────── */
    _buildPlaguePits(THREE);

    /* ── Antidotes ───────────────────────────────────────────────────── */
    _buildAntidotes(THREE);

    /* ── Enemies ─────────────────────────────────────────────────────── */
    _spawnEnemies(THREE);

    /* ── Player torch (viewmodel) ────────────────────────────────────── */
    _buildTorchViewModel(THREE);

    /* ── Player start ────────────────────────────────────────────────── */
    _px = 0; _py = 1.8; _pz = 20;

    _showMsg('PLAGUE OUTBREAK — Find and burn the 5 plague pits. Eliminate the Corrupted Inquisitor.', 6);
  }

  /* ── Ground ──────────────────────────────────────────────────────────── */
  function _buildGround(THREE) {
    /* Large cobblestone ground */
    var gGeo  = new THREE.BoxGeometry(200, 0.2, 200);
    var ground = _makeMesh(THREE, gGeo, 0x666655);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    /* Random puddle tiles */
    for (var i = 0; i < 40; i++) {
      var pGeo = new THREE.BoxGeometry(1.5 + Math.random(), 0.05, 1.5 + Math.random());
      var pud  = _makeMesh(THREE, pGeo, 0x334433);
      pud.position.set((Math.random() - 0.5) * 160, 0.02, (Math.random() - 0.5) * 160);
      _scene.add(pud);
    }
  }

  /* ── Row houses ──────────────────────────────────────────────────────── */
  function _buildRowHouses(THREE) {
    /* Left row */
    var housePositions = [
      { x: -20, z: -10 }, { x: -20, z:  5  }, { x: -20, z: 20 },
      { x: -20, z: 35  }, { x:  20, z: -10 }, { x:  20, z:  5 },
      { x:  20, z: 20  }, { x:  20, z: 35  }
    ];
    for (var i = 0; i < housePositions.length; i++) {
      var hp = housePositions[i];
      _buildHouse(THREE, hp.x, hp.z);
    }
  }

  function _buildHouse(THREE, x, z) {
    /* Walls */
    var wallGeo = new THREE.BoxGeometry(6, 8, 8);
    var wall    = _makeMesh(THREE, wallGeo, 0x776655);
    wall.position.set(x, 4, z);
    _scene.add(wall);
    _walls.push({ minX: x-3, maxX: x+3, minZ: z-4, maxZ: z+4 });

    /* Thatched roof (wood-colored flat pyramid approximation) */
    var roofGeo = new THREE.BoxGeometry(7, 1.2, 9);
    var roof    = _makeMesh(THREE, roofGeo, 0x5C3A1E);
    roof.position.set(x, 8.6, z);
    _scene.add(roof);

    /* Roof ridge */
    var ridgeGeo = new THREE.BoxGeometry(0.6, 1.8, 8.5);
    var ridge    = _makeMesh(THREE, ridgeGeo, 0x4A2A10);
    ridge.position.set(x, 9.6, z);
    _scene.add(ridge);
  }

  /* ── Church ──────────────────────────────────────────────────────────── */
  function _buildChurch(THREE) {
    /* Main nave */
    var naveGeo = new THREE.BoxGeometry(20, 12, 30);
    var nave    = _makeMesh(THREE, naveGeo, 0x888877);
    nave.position.set(0, 6, -50);
    _scene.add(nave);
    _walls.push({ minX: -10, maxX: 10, minZ: -65, maxZ: -35 });

    /* Bell tower */
    var towerGeo = new THREE.CylinderGeometry(3, 3.5, 20, 8);
    var tower    = _makeMesh(THREE, towerGeo, 0x888877);
    tower.position.set(-7, 16, -58);
    _scene.add(tower);

    /* Tower cap */
    var capGeo = new THREE.CylinderGeometry(0, 3.5, 5, 8);
    var cap    = _makeMesh(THREE, capGeo, 0x666655);
    cap.position.set(-7, 28, -58);
    _scene.add(cap);

    /* Church bell (LineSegments — rope visual) */
    _buildBellRope(THREE);

    /* Graveyard fence */
    _buildGraveyardFence(THREE);

    /* Bone piles in graveyard */
    for (var b = 0; b < 8; b++) {
      var bGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 5, 5);
      var bone = _makeMesh(THREE, bGeo, 0xCCBB99);
      bone.position.set(-8 + Math.random() * 16, 0.3, -68 + Math.random() * 8);
      _scene.add(bone);
    }

    /* Grave markers */
    for (var g = 0; g < 6; g++) {
      var graveGeo = new THREE.BoxGeometry(0.4, 1.2, 0.15);
      var grave    = _makeMesh(THREE, graveGeo, 0x777766);
      grave.position.set(-8 + g * 3.2, 0.6, -68);
      _scene.add(grave);
    }
  }

  function _buildBellRope(THREE) {
    var THREE_l = window.THREE;
    var pts = [];
    for (var i = 0; i < 10; i++) {
      pts.push(i * 0.4 - 2, 0, 0);
    }
    var geo  = new THREE_l.BufferGeometry();
    var verts = new Float32Array(pts.length);
    for (var j = 0; j < pts.length; j++) { verts[j] = pts[j]; }
    geo.setAttribute('position', new THREE_l.BufferAttribute(verts, 3));

    var indices = [];
    for (var k = 0; k < 9; k++) { indices.push(k, k + 1); }
    geo.setIndex(indices);

    var line = new THREE_l.LineSegments(geo, new THREE_l.LineBasicMaterial({ color: 0x8B5E3C }));
    line.position.set(-7, 18, -55);
    line.rotation.y = Math.PI / 2;
    _scene.add(line);
  }

  function _buildGraveyardFence(THREE) {
    var fencePositions = [
      { x: -12, z: -72, sx: 0.2, sz: 10 },
      { x:  12, z: -72, sx: 0.2, sz: 10 },
      { x: 0,   z: -77, sx: 24,  sz: 0.2 }
    ];
    for (var i = 0; i < fencePositions.length; i++) {
      var fp  = fencePositions[i];
      var fGeo = new THREE.BoxGeometry(fp.sx, 1.5, fp.sz);
      var fen  = _makeMesh(THREE, fGeo, 0x444433);
      fen.position.set(fp.x, 0.75, fp.z);
      _scene.add(fen);
    }
  }

  /* ── Market square ───────────────────────────────────────────────────── */
  function _buildMarketSquare(THREE) {
    /* Cobblestone market floor slightly elevated */
    var mGeo = new THREE.BoxGeometry(30, 0.15, 25);
    var mkt  = _makeMesh(THREE, mGeo, 0x777766);
    mkt.position.set(40, 0.07, 10);
    _scene.add(mkt);

    /* Abandoned stalls (wooden) */
    var stallDefs = [
      { x: 30, z: 5  }, { x: 30, z: 15 },
      { x: 50, z: 5  }, { x: 50, z: 15 }
    ];
    for (var i = 0; i < stallDefs.length; i++) {
      var s = stallDefs[i];
      /* Counter */
      var cGeo = new THREE.BoxGeometry(3, 0.8, 1.5);
      var counter = _makeMesh(THREE, cGeo, 0x5C3A1E);
      counter.position.set(s.x, 0.4, s.z);
      _scene.add(counter);
      /* Canopy frame */
      var postGeo = new THREE.BoxGeometry(0.15, 2, 0.15);
      for (var p = 0; p < 4; p++) {
        var post = _makeMesh(THREE, postGeo, 0x4A2A10);
        post.position.set(s.x + (p % 2 === 0 ? -1.2 : 1.2), 1.4, s.z + (p < 2 ? -0.6 : 0.6));
        _scene.add(post);
      }
      /* Canopy top */
      var canopyGeo = new THREE.BoxGeometry(3.2, 0.12, 1.8);
      var canopy    = _makeMesh(THREE, canopyGeo, 0x8B5E3C);
      canopy.position.set(s.x, 2.86, s.z);
      _scene.add(canopy);
    }
  }

  /* ── Inquisition keep ────────────────────────────────────────────────── */
  function _buildInquisitionKeep(THREE) {
    var kGeo  = new THREE.BoxGeometry(15, 12, 20);
    var keep  = _makeMesh(THREE, kGeo, 0x665544);
    keep.position.set(-50, 6, -20);
    _scene.add(keep);
    _walls.push({ minX: -57.5, maxX: -42.5, minZ: -30, maxZ: -10 });

    /* Battlements */
    for (var i = 0; i < 5; i++) {
      var bGeo = new THREE.BoxGeometry(2, 2, 1.5);
      var bat  = _makeMesh(THREE, bGeo, 0x665544);
      bat.position.set(-50 + (i - 2) * 3, 13, -30);
      _scene.add(bat);
    }

    /* Dungeon floor (below ground) */
    var dungGeo = new THREE.BoxGeometry(14, 3, 19);
    var dung    = _makeMesh(THREE, dungGeo, 0x554433);
    dung.position.set(-50, -1.5, -20);
    _scene.add(dung);

    /* Dungeon bone pile clusters */
    for (var j = 0; j < 12; j++) {
      var bsGeo = new THREE.SphereGeometry(0.25 + Math.random() * 0.2, 5, 4);
      var bs    = _makeMesh(THREE, bsGeo, 0xBBAA88);
      bs.position.set(-50 + (Math.random() - 0.5) * 12, -0.1, -20 + (Math.random() - 0.5) * 16);
      _scene.add(bs);
    }

    /* Iron bars for dungeon (LineSegments) */
    var barPts = [];
    for (var b = 0; b < 6; b++) {
      barPts.push(b * 1.5 - 3.75, 0, 0,  b * 1.5 - 3.75, 3, 0);
    }
    var barGeo  = new THREE.BufferGeometry();
    var barVerts = new Float32Array(barPts.length);
    for (var bv = 0; bv < barPts.length; bv++) { barVerts[bv] = barPts[bv]; }
    barGeo.setAttribute('position', new THREE.BufferAttribute(barVerts, 3));
    var barIdx = [];
    for (var bi = 0; bi < 6; bi++) { barIdx.push(bi * 2, bi * 2 + 1); }
    barGeo.setIndex(barIdx);
    var bars = new THREE.LineSegments(barGeo, new THREE.LineBasicMaterial({ color: 0x444444 }));
    bars.position.set(-50, 0, -11);
    _scene.add(bars);
  }

  /* ── Catacombs tunnel ────────────────────────────────────────────────── */
  function _buildCatacombs(THREE) {
    var catGeo = new THREE.BoxGeometry(4, 3, 40);
    var cat    = _makeMesh(THREE, catGeo, 0x554433);
    cat.position.set(-50, -2.5, 10);
    _scene.add(cat);
    _walls.push({ minX: -52, maxX: -48, minZ: -10, maxZ: 30 });

    /* Bone pile clusters along walls */
    for (var i = 0; i < 20; i++) {
      var clusterX = (Math.random() < 0.5 ? -52 : -48) + (Math.random() - 0.5) * 0.5;
      var clusterZ = -10 + i * 2 + (Math.random() - 0.5);
      for (var j = 0; j < 3; j++) {
        var bsGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 4, 4);
        var bs    = _makeMesh(THREE, bsGeo, 0xBBAA88);
        bs.position.set(clusterX + (Math.random() - 0.5) * 0.4, -0.9, clusterZ + (Math.random() - 0.5) * 0.4);
        _scene.add(bs);
      }
    }

    /* Dim catacomb torch light */
    var catLight = new THREE.PointLight(0xFF6600, 0.5, 20);
    catLight.position.set(-50, 0, 10);
    _scene.add(catLight);
  }

  /* ── Puddles ─────────────────────────────────────────────────────────── */
  function _buildPuddles(THREE) {
    /* Extra muddy puddles near the church and market */
    var puddleDefs = [
      { x: 5, z: -35 }, { x: -5, z: -35 }, { x: 0, z: -40 },
      { x: 35, z: 8 }, { x: 45, z: 18 }
    ];
    for (var i = 0; i < puddleDefs.length; i++) {
      var pd  = puddleDefs[i];
      var pGeo = new THREE.BoxGeometry(2, 0.04, 2);
      var pud  = _makeMesh(THREE, pGeo, 0x224422);
      pud.position.set(pd.x, 0.02, pd.z);
      _scene.add(pud);
    }
  }

  /* ── Burning buildings ───────────────────────────────────────────────── */
  function _buildBurningBuildings(THREE) {
    var positions = [ { x: -20, z: -25 }, { x: 20, z: -25 } ];
    for (var i = 0; i < positions.length; i++) {
      var bp  = positions[i];
      var bGeo = new THREE.BoxGeometry(6, 8, 8);
      var bldg = _makeMesh(THREE, bGeo, 0x554433);
      bldg.position.set(bp.x, 4, bp.z);
      _scene.add(bldg);

      var fireLight = new THREE.PointLight(0xFF4400, 2.5, 20);
      fireLight.position.set(bp.x, 6, bp.z);
      _scene.add(fireLight);

      _burningBldgs.push({ light: fireLight, pos: { x: bp.x, z: bp.z } });

      /* Fire LineSegments visual */
      _buildFireVisual(THREE, bp.x, 9, bp.z);
    }
  }

  function _buildFireVisual(THREE, x, y, z) {
    var pts = [];
    var numFlames = 12;
    for (var i = 0; i < numFlames; i++) {
      var fx = (Math.random() - 0.5) * 4;
      var fz = (Math.random() - 0.5) * 4;
      pts.push(fx, 0, fz,  fx * 0.3, 2 + Math.random() * 2, fz * 0.3);
    }
    var geo  = new THREE.BufferGeometry();
    var verts = new Float32Array(pts.length);
    for (var j = 0; j < pts.length; j++) { verts[j] = pts[j]; }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var idx = [];
    for (var k = 0; k < numFlames; k++) { idx.push(k * 2, k * 2 + 1); }
    geo.setIndex(idx);
    var fire = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xFF6600 }));
    fire.position.set(x, y, z);
    _scene.add(fire);
    return fire;
  }

  /* ── Well of corruption ──────────────────────────────────────────────── */
  function _buildWell(THREE) {
    /* Stone ring */
    var ringGeo = new THREE.CylinderGeometry(1.5, 1.6, 1.2, 10);
    var ring    = _makeMesh(THREE, ringGeo, 0x666655);
    ring.position.set(-30, 0.6, 15);
    _scene.add(ring);

    /* Well interior — glowing corruption */
    var wellGeo   = new THREE.CylinderGeometry(1.3, 1.3, 0.3, 10);
    var wellInner = _makeMesh(THREE, wellGeo, 0x224422);
    wellInner.position.set(-30, 1.1, 15);
    _scene.add(wellInner);

    var wellLight = new THREE.PointLight(0x44CC44, 1.5, 8);
    wellLight.position.set(-30, 2, 15);
    _scene.add(wellLight);

    /* Well label stored for interaction check */
    _buildWellSign(THREE, -30, 15);
  }

  function _buildWellSign(THREE, x, z) {
    /* Simple post */
    var postGeo = new THREE.BoxGeometry(0.12, 2, 0.12);
    var post    = _makeMesh(THREE, postGeo, 0x5C3A1E);
    post.position.set(x + 2, 1, z);
    _scene.add(post);

    var boardGeo = new THREE.BoxGeometry(1.2, 0.5, 0.08);
    var board    = _makeMesh(THREE, boardGeo, 0x7A5232);
    board.position.set(x + 2, 2.1, z);
    _scene.add(board);
  }

  /* ── Plague pits ─────────────────────────────────────────────────────── */
  function _buildPlaguePits(THREE) {
    var pitDefs = [
      { x:  5,   z: -68 }, /* church graveyard 1 */
      { x: -5,   z: -70 }, /* church graveyard 2 */
      { x: 35,   z:  8  }, /* market square 1   */
      { x: 50,   z: 15  }, /* market square 2   */
      { x: -50,  z:  25 }  /* catacombs exit    */
    ];
    for (var i = 0; i < pitDefs.length; i++) {
      var pd  = pitDefs[i];
      var pitGeo = new THREE.BoxGeometry(4, 0.8, 4);
      var pit    = _makeMesh(THREE, pitGeo, 0x333322);
      pit.position.set(pd.x, -0.4, pd.z);
      _scene.add(pit);

      /* Glowing corruption fill */
      var fillGeo  = new THREE.BoxGeometry(3.5, 0.15, 3.5);
      var fill     = _makeMesh(THREE, fillGeo, 0x553300);
      fill.position.set(pd.x, 0.02, pd.z);
      _scene.add(fill);

      /* Point light for corruption glow */
      var corLight = new THREE.PointLight(0xCC4400, 1.8, 10);
      corLight.position.set(pd.x, 1.5, pd.z);
      _scene.add(corLight);

      _pits.push({
        mesh:       pit,
        light:      corLight,
        fill:       fill,
        burned:     false,
        burnTimer:  0,
        pos:        { x: pd.x, z: pd.z },
        burningFx:  null
      });
    }
  }

  /* ── Antidote bottles ────────────────────────────────────────────────── */
  function _buildAntidotes(THREE) {
    var antDefs = [
      { x:  10, z:  5  },
      { x: -15, z:  30 },
      { x:  42, z:  22 },
      { x: -48, z: -18 },
      { x:   3, z: -60 }
    ];
    for (var i = 0; i < antDefs.length; i++) {
      var ad   = antDefs[i];
      var bGeo  = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 6);
      var bottle = _makeMesh(THREE, bGeo, 0x44AA44);
      bottle.position.set(ad.x, 0.4, ad.z);
      _scene.add(bottle);

      /* Green glow */
      var aLight = new THREE.PointLight(0x44FF44, 0.6, 4);
      aLight.position.set(ad.x, 0.6, ad.z);
      _scene.add(aLight);

      _antidotePickups.push({ mesh: bottle, light: aLight, pos: { x: ad.x, z: ad.z }, taken: false });
    }
  }

  /* ── Torch viewmodel ─────────────────────────────────────────────────── */
  function _buildTorchViewModel(THREE) {
    /* LineSegments fire on camera */
    var pts = [];
    var N   = 8;
    for (var i = 0; i < N; i++) {
      var angle = (i / N) * Math.PI * 2;
      pts.push(Math.cos(angle) * 0.04, 0, Math.sin(angle) * 0.04);
      pts.push(Math.cos(angle) * 0.01, 0.18, Math.sin(angle) * 0.01);
    }
    var geo  = new THREE.BufferGeometry();
    var verts = new Float32Array(pts.length);
    for (var j = 0; j < pts.length; j++) { verts[j] = pts[j]; }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var idx = [];
    for (var k = 0; k < N; k++) { idx.push(k * 2, k * 2 + 1); }
    geo.setIndex(idx);
    _torchMesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xFF8800 }));
    _torchMesh.position.set(0.35, -0.25, -0.6);
    _camera.add(_torchMesh);
    _scene.add(_camera);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY SPAWNING
  ═══════════════════════════════════════════════════════════════════════════*/

  function _spawnEnemies(THREE) {
    /* 30 plague-infected */
    var infectedPositions = [
      { x: -15, z: -5 }, { x: 15,  z: -5 }, { x: -15, z: 10 }, { x: 15,  z: 10 },
      { x: -15, z: 25 }, { x: 15,  z: 25 }, { x: -8,  z: -30}, { x:  8,  z: -30},
      { x:  30, z:  0 }, { x:  45, z:  5 }, { x:  35, z: 20 }, { x:  50, z: 20 },
      { x: -45, z: -5 }, { x: -45, z: 10 }, { x: -45, z: 25 }, { x:  0,  z: 30 },
      { x: -25, z: 30 }, { x:  25, z: 30 }, { x: -10, z: -55}, { x:  10, z: -55},
      { x:  3,  z: -70}, { x: -3,  z: -70}, { x: -50, z: 5  }, { x: -50, z: 15 },
      { x:  40, z: -5 }, { x:  20, z: -40}, { x: -20, z: -40}, { x:  0,  z: -45},
      { x: -35, z: -15}, { x:  35, z: -15}
    ];
    for (var i = 0; i < infectedPositions.length; i++) {
      var ip = infectedPositions[i];
      var mesh = _makeEnemyMesh(THREE, 0x554422, 1, 2, 0.8);
      mesh.position.set(ip.x, 1, ip.z);
      _scene.add(mesh);
      _infected_enemies.push({
        mesh:       mesh,
        hp:         60,
        maxHp:      60,
        type:       'infected',
        speed:      5.5,
        state:      'patrol',
        stateTimer: Math.random() * 3,
        stunTimer:  0,
        attackCooldown: 0,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolOrigin: { x: ip.x, z: ip.z }
      });
    }

    /* 5 plague priests */
    var priestPositions = [
      { x: -48, z: -25 }, { x: -48, z: -15 },
      { x:  5,  z: -65 }, { x: -5,  z: -65 },
      { x:  40, z:  0  }
    ];
    for (var p = 0; p < priestPositions.length; p++) {
      var pp = priestPositions[p];
      var pmesh = _makeEnemyMesh(THREE, 0x221122, 0.8, 2.2, 0.7);
      pmesh.position.set(pp.x, 1.1, pp.z);
      _scene.add(pmesh);
      _priests.push({
        mesh:         pmesh,
        hp:           120,
        maxHp:        120,
        type:         'priest',
        speed:        3.5,
        state:        'patrol',
        stateTimer:   Math.random() * 3,
        stunTimer:    0,
        throwCooldown: 2 + Math.random() * 3,
        patrolOrigin: { x: pp.x, z: pp.z }
      });
    }

    /* 3 rat swarms */
    var ratPositions = [
      { x: -30, z: 10 }, { x: 35, z: -10 }, { x: -5, z: -45 }
    ];
    for (var r = 0; r < ratPositions.length; r++) {
      var rp = ratPositions[r];
      var rGroup = new THREE.Group();
      rGroup.position.set(rp.x, 0.2, rp.z);
      for (var rs = 0; rs < 5; rs++) {
        var ratGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.1, 5, 4);
        var rat    = _makeMesh(THREE, ratGeo, 0x332211);
        rat.position.set((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5);
        rGroup.add(rat);
      }
      _scene.add(rGroup);
      _ratSwarms.push({
        mesh:       rGroup,
        hp:         40,
        maxHp:      40,
        type:       'rats',
        speed:      8,
        state:      'patrol',
        stateTimer: Math.random() * 3,
        stunTimer:  0,
        attackCooldown: 0,
        patrolOrigin: { x: rp.x, z: rp.z }
      });
    }

    /* Corrupted Inquisitor boss */
    _spawnInquisitor(THREE);
  }

  function _makeEnemyMesh(THREE, color, sx, sy, sz) {
    var geo  = new THREE.BoxGeometry(sx, sy, sz);
    var mesh = _makeMesh(THREE, geo, color);
    return mesh;
  }

  function _spawnInquisitor(THREE) {
    var inqGeo  = new THREE.BoxGeometry(1.5, 2.5, 1);
    var inqMesh = _makeMesh(THREE, inqGeo, 0x221111);
    inqMesh.position.set(-50, 1.25, -20);
    _scene.add(inqMesh);

    /* Armor plates */
    var armorGeo = new THREE.BoxGeometry(1.8, 1.2, 1.2);
    var armor    = _makeMesh(THREE, armorGeo, 0x333333);
    armor.position.set(0, 0.2, 0);
    inqMesh.add(armor);

    /* Fire breath light */
    var breathLight = new THREE.PointLight(0xFF4400, 0, 15);
    breathLight.position.set(0, 1.5, -2);
    inqMesh.add(breathLight);

    _inquisitor = {
      mesh:        inqMesh,
      hp:          INQUISITOR_HP,
      maxHp:       INQUISITOR_HP,
      type:        'inquisitor',
      speed:       4,
      state:       'idle',
      stateTimer:  0,
      breathTimer: 0,
      breathLight: breathLight,
      moveTimer:   0,
      phase:       1,
      attackCooldown: 0
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════*/

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'plague-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'color:#CCBB44', 'font:bold 13px monospace',
      'background:rgba(0,0,0,0.72)', 'padding:6px 14px',
      'border:1px solid #553300', 'border-radius:4px',
      'z-index:9999', 'pointer-events:none',
      'text-align:center', 'min-width:600px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    var infTxt = _infected
      ? ('INFECTED ' + Math.ceil(_infectionTimer) + 's')
      : 'CLEAN';
    var inqTxt = _inquisitorDead ? 'DEAD' : 'ALIVE';
    var enemyCount = _infected_enemies.length + _priests.length + _ratSwarms.length
                   + (_inquisitorDead ? 0 : 1);
    var hpBar = Math.round((_hp / _maxHp) * 10);
    var hpStr = '';
    for (var i = 0; i < 10; i++) { hpStr += (i < hpBar ? '|' : '.'); }

    _hudEl.innerHTML =
      'PLAGUE OUTBREAK &nbsp;|&nbsp; ' +
      'HP [' + hpStr + '] ' + Math.ceil(_hp) + ' &nbsp;|&nbsp; ' +
      'PITS BURNED: ' + _pitsBurned + '/' + _pitsRequired + ' &nbsp;|&nbsp; ' +
      'INFECTION: ' + infTxt + ' &nbsp;|&nbsp; ' +
      'INQUISITOR: ' + inqTxt + ' &nbsp;|&nbsp; ' +
      'TIMER: ' + _fmtTime(_gameTime) + ' &nbsp;|&nbsp; ' +
      'ENEMIES: ' + enemyCount + ' &nbsp;|&nbsp; ' +
      'ANTIDOTES: ' + _antidotes + ' &nbsp;|&nbsp; ' +
      'SMOKE: ' + _smokeBombs + ' &nbsp;|&nbsp; ' +
      'BOLT: ' + _crossbowAmmo +
      (_msgTimer > 0 ? '<br><span style="color:#FF8800">' + _msgText + '</span>' : '');
  }

  /* ════════════════════════════════════════════════════════════════════════
     CROSSBOW
  ═══════════════════════════════════════════════════════════════════════════*/

  function _fireCrossbow() {
    if (_crossbowReload > 0 || _crossbowAmmo <= 0) {
      if (_crossbowAmmo <= 0) { _showMsg('OUT OF BOLTS!', 1.5); }
      return;
    }
    _crossbowAmmo--;
    _crossbowReload = CROSSBOW_RELOAD;

    var THREE = window.THREE;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var bGeo  = new THREE.BoxGeometry(0.05, 0.05, 0.4);
    var bolt  = _makeMesh(THREE, bGeo, 0x8B5E3C);
    bolt.position.set(_px + dir.x * 1.5, _py, _pz + dir.z * 1.5);
    _scene.add(bolt);

    _projectiles.push({
      mesh:    bolt,
      vx:      dir.x * 40,
      vy:      dir.y * 40,
      vz:      dir.z * 40,
      life:    3,
      damage:  CROSSBOW_DAMAGE,
      infects: false,
      fromPlayer: true,
      pierced: []
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     SMOKE BOMB
  ═══════════════════════════════════════════════════════════════════════════*/

  function _throwSmoke() {
    if (_smokeBombs <= 0) { _showMsg('No smoke bombs!', 1.5); return; }
    _smokeBombs--;
    var THREE = window.THREE;
    var sGeo  = new THREE.SphereGeometry(SMOKE_RADIUS, 8, 6);
    var smoke = new THREE.Mesh(sGeo, new THREE.MeshLambertMaterial({
      color: 0x448844, transparent: true, opacity: 0.25
    }));
    smoke.position.set(_px, 2, _pz);
    _scene.add(smoke);
    _smokeClouds.push({
      mesh: smoke,
      life: SMOKE_DURATION,
      pos:  { x: _px, z: _pz }
    });
    _showMsg('Smoke bomb deployed!', 1.5);
  }

  /* ════════════════════════════════════════════════════════════════════════
     TORCH
  ═══════════════════════════════════════════════════════════════════════════*/

  function _toggleTorch() {
    _torchActive = !_torchActive;
    if (_torchMesh) { _torchMesh.visible = _torchActive; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CHURCH BELL
  ═══════════════════════════════════════════════════════════════════════════*/

  function _ringBell() {
    if (_bellCooldown > 0) {
      _showMsg('Bell cooling down... ' + Math.ceil(_bellCooldown) + 's', 1);
      return;
    }
    if (_dist(_px, _pz, _churchPos.x, _churchPos.z) > 20) {
      _showMsg('Must be near the church to ring the bell!', 2);
      return;
    }
    _bellCooldown   = BELL_COOLDOWN;
    _bellStunActive = true;
    _bellStunTimer  = BELL_STUN_TIME;
    _showMsg('BELL RINGS — infected stunned for 3s!', 3);

    /* Apply stun to nearby enemies */
    var allEnemies = _infected_enemies.concat(_priests).concat(_ratSwarms);
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      var ep = e.mesh.position;
      if (_dist(ep.x, ep.z, _churchPos.x, _churchPos.z) <= BELL_RANGE) {
        e.stunTimer = BELL_STUN_TIME;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER ACTIONS — use item / burn pit
  ═══════════════════════════════════════════════════════════════════════════*/

  function _handleEAction(dt) {
    /* Check for antidote pickup */
    for (var a = 0; a < _antidotePickups.length; a++) {
      var ap = _antidotePickups[a];
      if (!ap.taken && _dist(_px, _pz, ap.pos.x, ap.pos.z) < 2.5) {
        ap.taken = true;
        if (ap.mesh && ap.mesh.parent) { ap.mesh.parent.remove(ap.mesh); }
        if (ap.light && ap.light.parent) { ap.light.parent.remove(ap.light); }
        _antidotes++;
        _showMsg('Antidote bottle collected! [' + _antidotes + ' total]', 2);
        return;
      }
    }

    /* Use antidote if infected */
    if (_infected) {
      if (_antidotes > 0) {
        _antidotes--;
        _infected       = false;
        _infectionTimer = 0;
        _showMsg('Antidote administered — infection cured!', 2.5);
      } else {
        _showMsg('No antidotes remaining! INFECTED!', 2);
      }
      return;
    }

    /* Burn a nearby pit */
    var nearPit = null;
    for (var p = 0; p < _pits.length; p++) {
      var pit = _pits[p];
      if (!pit.burned && _dist(_px, _pz, pit.pos.x, pit.pos.z) < 4) {
        nearPit = pit;
        break;
      }
    }
    if (nearPit) {
      if (_eHeld) {
        _eHoldTimer += dt;
        if (_eHoldTimer >= PIT_BURN_TIME) {
          _burnPit(nearPit);
          _eHoldTimer = 0;
        } else {
          _showMsg('Pouring consecrated oil... [' + Math.floor(_eHoldTimer) + '/' + PIT_BURN_TIME + 's]', 0.3);
        }
      } else {
        _eHoldTimer = 0;
        _showMsg('Hold E to pour consecrated oil and burn the plague pit!', 0.6);
      }
    }
  }

  function _burnPit(pit) {
    pit.burned = true;
    _pitsBurned++;

    /* Remove corruption light, change color */
    pit.light.color.setHex(0xFF6600);
    pit.fill.material.color.setHex(0xFF4400);

    /* Burning fire visual */
    pit.burningFx = _buildFireVisual(window.THREE, pit.pos.x, 0.5, pit.pos.z);

    _showMsg('Pit burned! [' + _pitsBurned + '/' + _pitsRequired + '] — INFECTED RAGE!', 3);

    /* Spawn 4 enraged infected */
    _spawnRageInfected(pit.pos.x, pit.pos.z);

    _checkWin();
  }

  function _spawnRageInfected(ox, oz) {
    var THREE = window.THREE;
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var x = ox + Math.cos(angle) * 4;
      var z = oz + Math.sin(angle) * 4;
      var mesh = _makeEnemyMesh(THREE, 0x884422, 1, 2, 0.8);
      mesh.position.set(x, 1, z);
      _scene.add(mesh);
      _infected_enemies.push({
        mesh:       mesh,
        hp:         60,
        maxHp:      60,
        type:       'infected',
        speed:      9,  /* rage speed */
        state:      'chase',
        stateTimer: 0,
        stunTimer:  0,
        attackCooldown: 0,
        patrolAngle: angle,
        patrolOrigin: { x: x, z: z }
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _checkWin() {
    if (_pitsBurned >= _pitsRequired && _inquisitorDead) {
      _victory = true;
      _showMsg('VICTORY! The plague source is destroyed! City is saved!', 999);
      _updateHUD();
    }
  }

  function _checkLose() {
    if (_hp <= 0) {
      _defeat = true;
      _showMsg('YOU DIED — The Black Death claims another soul...', 999);
      _updateHUD();
      return;
    }
    if (_infected && _antidotes <= 0 && _infectionTimer > 0) {
      /* Continue until death — just a warning */
      /* Actual loss is HP reaching 0 */
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateEnemyAI(enemy, dt, isSmoke) {
    if (enemy.stunTimer > 0) {
      enemy.stunTimer -= dt;
      return;
    }
    if (enemy.attackCooldown > 0) { enemy.attackCooldown -= dt; }

    var ep  = enemy.mesh.position;
    var dx  = _px - ep.x;
    var dz  = _pz - ep.z;
    var dis = Math.sqrt(dx * dx + dz * dz);

    var effectiveSpeed = enemy.speed * (isSmoke ? SMOKE_SLOW : 1);

    if (dis < 60) {
      /* Chase */
      enemy.state = 'chase';
      if (dis > 0.5) {
        var nx = dx / dis;
        var nz = dz / dz === 0 ? 0 : dz / dis;
        if (dis > 0) {
          nx = dx / dis;
          nz = dz / dis;
        }
        ep.x += nx * effectiveSpeed * dt;
        ep.z += nz * effectiveSpeed * dt;
      }
      /* Melee attack */
      if (dis < 2 && enemy.attackCooldown <= 0) {
        _playerHit(enemy.type === 'rats' ? 5 : 12, true);
        enemy.attackCooldown = 1.2;
      }
    } else {
      /* Patrol */
      enemy.stateTimer -= dt;
      if (enemy.stateTimer <= 0) {
        enemy.patrolAngle  = Math.random() * Math.PI * 2;
        enemy.stateTimer   = 2 + Math.random() * 3;
      }
      var tx = enemy.patrolOrigin.x + Math.cos(enemy.patrolAngle) * 5;
      var tz = enemy.patrolOrigin.z + Math.sin(enemy.patrolAngle) * 5;
      var pdx = tx - ep.x;
      var pdz = tz - ep.z;
      var pd  = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pd > 0.5) {
        ep.x += (pdx / pd) * effectiveSpeed * 0.4 * dt;
        ep.z += (pdz / pd) * effectiveSpeed * 0.4 * dt;
      }
    }
    /* Face player */
    if (dis < 60) {
      enemy.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  function _updatePriestAI(priest, dt) {
    if (priest.stunTimer > 0) { priest.stunTimer -= dt; return; }
    priest.throwCooldown -= dt;

    var ep  = priest.mesh.position;
    var dx  = _px - ep.x;
    var dz  = _pz - ep.z;
    var dis = Math.sqrt(dx * dx + dz * dz);

    var isSmoke = _inSmoke(ep.x, ep.z);
    var effectiveSpeed = priest.speed * (isSmoke ? SMOKE_SLOW : 1);

    if (dis < 80) {
      /* Keep distance and throw */
      if (dis < 15) {
        /* Back away */
        if (dis > 0) {
          ep.x -= (dx / dis) * effectiveSpeed * dt;
          ep.z -= (dz / dis) * effectiveSpeed * dt;
        }
      } else if (dis > 25) {
        /* Approach */
        if (dis > 0) {
          ep.x += (dx / dis) * effectiveSpeed * dt;
          ep.z += (dz / dis) * effectiveSpeed * dt;
        }
      }
      /* Throw vial */
      if (priest.throwCooldown <= 0 && dis < 30) {
        _throwPriestVial(priest);
        priest.throwCooldown = 3 + Math.random() * 2;
      }
      priest.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  function _throwPriestVial(priest) {
    var THREE = window.THREE;
    var ep = priest.mesh.position;
    var dx = _px - ep.x;
    var dz = _pz - ep.z;
    var dis = Math.sqrt(dx * dx + dz * dz);
    if (dis === 0) { return; }

    var vGeo = new THREE.SphereGeometry(0.12, 5, 5);
    var vial = _makeMesh(THREE, vGeo, 0x44AA22);
    vial.position.set(ep.x, ep.y + 1.5, ep.z);
    _scene.add(vial);

    _projectiles.push({
      mesh:    vial,
      vx:      (dx / dis) * 14,
      vy:      3,
      vz:      (dz / dis) * 14,
      life:    3,
      damage:  8,
      infects: true,
      fromPlayer: false,
      pierced: []
    });
  }

  function _updateInquisitorAI(dt) {
    if (!_inquisitor || _inquisitorDead) { return; }
    var inq = _inquisitor;
    if (inq.attackCooldown > 0) { inq.attackCooldown -= dt; }

    var ep  = inq.mesh.position;
    var dx  = _px - ep.x;
    var dz  = _pz - ep.z;
    var dis = Math.sqrt(dx * dx + dz * dz);

    /* Phase 2 at 200 HP */
    if (inq.hp <= 200 && inq.phase === 1) {
      inq.phase = 2;
      inq.speed = 6;
      _showMsg('INQUISITOR ENRAGES! He burns with unholy fire!', 3);
    }

    var effectiveSpeed = inq.speed;
    inq.breathTimer -= dt;
    inq.moveTimer   -= dt;

    if (dis < 80) {
      inq.state = 'chase';
      if (dis > 1.5) {
        ep.x += (dx / dis) * effectiveSpeed * dt;
        ep.z += (dz / dis) * effectiveSpeed * dt;
      }
      /* Melee */
      if (dis < 3 && inq.attackCooldown <= 0) {
        _playerHit(25, false);
        inq.attackCooldown = 1.5;
      }
      /* Fire breath */
      if (dis < 12 && inq.breathTimer <= 0) {
        inq.breathTimer = inq.phase === 2 ? 4 : 7;
        inq.breathLight.intensity = 4;
        _playerHit(20, false);
        _showMsg('FIRE BREATH!', 1.5);
        /* Fade out breath light */
        inq._breathFade = 0.5;
      }
      if (inq._breathFade > 0) {
        inq._breathFade -= dt;
        inq.breathLight.intensity = Math.max(0, (inq._breathFade / 0.5) * 4);
      }
      inq.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER HIT
  ═══════════════════════════════════════════════════════════════════════════*/

  function _playerHit(damage, canInfect) {
    _hp -= damage;
    var infChance = MASK_CHANCE; /* plague mask always equipped */
    if (canInfect && !_infected && Math.random() < infChance) {
      _infected       = true;
      _infectionTimer = INFECTION_DUR;
      _showMsg('INFECTED! Use E to apply antidote!', 3);
    }
    if (_hp <= 0) {
      _hp = 0;
      _checkLose();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PROJECTILE UPDATES
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateProjectiles(dt) {
    var toRemove = [];
    for (var i = 0; i < _projectiles.length; i++) {
      var proj = _projectiles[i];
      proj.life -= dt;
      if (proj.life <= 0) { toRemove.push(i); continue; }

      proj.vy -= 9.8 * dt;
      proj.mesh.position.x += proj.vx * dt;
      proj.mesh.position.y += proj.vy * dt;
      proj.mesh.position.z += proj.vz * dt;

      if (proj.mesh.position.y < 0) { toRemove.push(i); continue; }

      if (proj.fromPlayer) {
        /* Check hits on enemies */
        var allEnemies = _infected_enemies.concat(_priests).concat(_ratSwarms);
        var hit = false;
        for (var j = 0; j < allEnemies.length; j++) {
          var e = allEnemies[j];
          if (proj.pierced.indexOf(j) >= 0) { continue; }
          if (_dist3(proj.mesh.position, e.mesh.position) < 1.2) {
            var bonus = (_torchActive && e.type !== 'rats') ? TORCH_BONUS : 0;
            e.hp -= proj.damage * (1 + bonus);
            if (CROSSBOW_PIERCE) { proj.pierced.push(j); }
            if (e.hp <= 0) { _killEnemy(e); }
            if (!CROSSBOW_PIERCE) { hit = true; break; }
          }
        }
        /* Check inquisitor */
        if (_inquisitor && !_inquisitorDead) {
          if (_dist3(proj.mesh.position, _inquisitor.mesh.position) < 2) {
            var iBonus = _torchActive ? TORCH_BONUS : 0;
            _inquisitor.hp -= proj.damage * (1 + iBonus);
            if (_inquisitor.hp <= 0) { _killInquisitor(); }
            hit = true;
          }
        }
        if (hit && !CROSSBOW_PIERCE) { toRemove.push(i); }
      } else {
        /* Enemy projectile hits player */
        if (Math.abs(proj.mesh.position.x - _px) < 1.2 &&
            Math.abs(proj.mesh.position.z - _pz) < 1.2 &&
            Math.abs(proj.mesh.position.y - _py) < 1.5) {
          _playerHit(proj.damage, proj.infects);
          toRemove.push(i);
        }
      }
    }
    /* Remove dead projectiles (in reverse order) */
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      var idx = toRemove[ri];
      if (_projectiles[idx]) {
        if (_projectiles[idx].mesh && _projectiles[idx].mesh.parent) {
          _projectiles[idx].mesh.parent.remove(_projectiles[idx].mesh);
        }
        _projectiles.splice(idx, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     KILL ENEMIES
  ═══════════════════════════════════════════════════════════════════════════*/

  function _killEnemy(enemy) {
    if (enemy.mesh && enemy.mesh.parent) { enemy.mesh.parent.remove(enemy.mesh); }
    /* Remove from lists */
    var idx;
    idx = _infected_enemies.indexOf(enemy);
    if (idx >= 0) { _infected_enemies.splice(idx, 1); return; }
    idx = _priests.indexOf(enemy);
    if (idx >= 0) { _priests.splice(idx, 1); return; }
    idx = _ratSwarms.indexOf(enemy);
    if (idx >= 0) { _ratSwarms.splice(idx, 1); }
  }

  function _killInquisitor() {
    _inquisitorDead = true;
    _inquisitor.breathLight.intensity = 0;
    if (_inquisitor.mesh && _inquisitor.mesh.parent) {
      _inquisitor.mesh.parent.remove(_inquisitor.mesh);
    }
    _showMsg('CORRUPTED INQUISITOR DEFEATED!', 4);
    _checkWin();
  }

  /* ════════════════════════════════════════════════════════════════════════
     MOVEMENT / COLLISION
  ═══════════════════════════════════════════════════════════════════════════*/

  function _movePlayer(dt) {
    var forward = _keys['w'] || _keys['arrowup']    ? 1 : 0;
    var back    = _keys['s'] || _keys['arrowdown']  ? 1 : 0;
    var left    = _keys['a'] || _keys['arrowleft']  ? 1 : 0;
    var right   = _keys['d'] || _keys['arrowright'] ? 1 : 0;

    var sinY = Math.sin(_yaw);
    var cosY = Math.cos(_yaw);

    var moveX = 0, moveZ = 0;
    if (forward) { moveX -= sinY; moveZ -= cosY; }
    if (back)    { moveX += sinY; moveZ += cosY; }
    if (left)    { moveX -= cosY; moveZ += sinY; }
    if (right)   { moveX += cosY; moveZ -= sinY; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      var spd = _speed * dt;
      moveX = (moveX / len) * spd;
      moveZ = (moveZ / len) * spd;
    }

    var nx = _px + moveX;
    var nz = _pz + moveZ;

    /* Simple AABB check */
    for (var i = 0; i < _walls.length; i++) {
      var w = _walls[i];
      if (nx > w.minX - 0.5 && nx < w.maxX + 0.5 &&
          nz > w.minZ - 0.5 && nz < w.maxZ + 0.5) {
        nx = _px;
        nz = _pz;
        break;
      }
    }

    _px = nx;
    _pz = nz;

    /* Burning building damage */
    for (var b = 0; b < _burningBldgs.length; b++) {
      var bb = _burningBldgs[b];
      if (_dist(_px, _pz, bb.pos.x, bb.pos.z) < 5) {
        _hp -= 5 * dt;
        if (_msgTimer <= 0) { _showMsg('Burning! Move away!', 0.8); }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CAMERA
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateCamera() {
    _camera.position.set(_px, _py, _pz);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _yaw;
    _camera.rotation.x     = _pitch;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SMOKE CLOUD UPDATES
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateSmokeClouds(dt) {
    for (var i = _smokeClouds.length - 1; i >= 0; i--) {
      var sc = _smokeClouds[i];
      sc.life -= dt;
      if (sc.life <= 0) {
        if (sc.mesh && sc.mesh.parent) { sc.mesh.parent.remove(sc.mesh); }
        _smokeClouds.splice(i, 1);
      } else {
        /* Fade opacity */
        sc.mesh.material.opacity = 0.25 * (sc.life / SMOKE_DURATION);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     AMBIENT FOG LIGHT FLICKER
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateAmbientFlicker(dt) {
    if (!_fogLight) { return; }
    _fogLight.intensity = 0.12 + Math.sin(Date.now() * 0.001) * 0.02;
    _bellCooldown = Math.max(0, _bellCooldown - dt);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INFECTION TIMER
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateInfection(dt) {
    if (!_infected) { return; }
    _infectionTimer -= dt;
    _hp -= _infectionDps * dt;
    if (_infectionTimer <= 0) {
      /* Infection expired but damage was dealt — not auto cured */
      _infected       = false;
      _infectionTimer = 0;
      _showMsg('Infection has run its course...', 2);
    }
    if (_hp <= 0) { _hp = 0; _checkLose(); }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN LOOP
  ═══════════════════════════════════════════════════════════════════════════*/

  function _loop() {
    if (!_active) { return; }
    _animFrame = requestAnimationFrame(_loop);

    var dt = _clock ? _clock.getDelta() : 0.016;
    dt = Math.min(dt, 0.05); /* cap at 50ms */

    if (_victory || _defeat) {
      if (_renderer && _scene && _camera) {
        _renderer.render(_scene, _camera);
      }
      _updateHUD();
      return;
    }

    _gameTime += dt;

    /* Movement */
    _movePlayer(dt);
    _updateCamera();

    /* Reload */
    if (_crossbowReload > 0) { _crossbowReload -= dt; }

    /* E hold */
    if (_eHeld) {
      _handleEAction(dt);
    } else {
      _eHoldTimer = 0;
    }

    /* Infection */
    _updateInfection(dt);

    /* Enemy AI */
    for (var i = 0; i < _infected_enemies.length; i++) {
      var e = _infected_enemies[i];
      var inSmoke = _inSmoke(e.mesh.position.x, e.mesh.position.z);
      _updateEnemyAI(e, dt, inSmoke);
    }
    for (var p = 0; p < _priests.length; p++) {
      _updatePriestAI(_priests[p], dt);
    }
    for (var r = 0; r < _ratSwarms.length; r++) {
      var rs = _ratSwarms[r];
      var ratSmoke = _inSmoke(rs.mesh.position.x, rs.mesh.position.z);
      _updateEnemyAI(rs, dt, ratSmoke);
    }
    _updateInquisitorAI(dt);

    /* Projectiles */
    _updateProjectiles(dt);

    /* Smoke clouds */
    _updateSmokeClouds(dt);

    /* Bell stun */
    if (_bellStunActive) {
      _bellStunTimer -= dt;
      if (_bellStunTimer <= 0) { _bellStunActive = false; }
    }

    /* Ambient effects */
    _updateAmbientFlicker(dt);

    /* Pit glow pulse */
    for (var pit = 0; pit < _pits.length; pit++) {
      if (!_pits[pit].burned) {
        _pits[pit].light.intensity = 1.8 + Math.sin(_gameTime * 2 + pit) * 0.4;
      }
    }

    /* Msg timer */
    if (_msgTimer > 0) { _msgTimer -= dt; }

    /* HUD */
    _updateHUD();

    /* Render */
    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════════*/

  function init(scene, camera, renderer) {
    /* Register key listener for activation — called by host page */
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function update(dt) {
    /* External update hook — no-op when self-managed */
  }

  function reset() {
    _deactivate();
  }

  /* Bootstrap: register activation listener automatically */
  (function () {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }());

  return { init: init, update: update, reset: reset };

}());
