/* ─────────────────────────────────────────────────────────────────────────────
   haunted-mansion.js — Haunted Mansion FPS Survival Mini-Game
   API: window.HauntedMansion = { init, update, reset }
   Activation: H + M simultaneous keypress (both keys within 400ms)

   Survive 6 minutes (until dawn) in a haunted mansion, or banish all ghosts
   by finding all 5 ritual seals. Sanity at 0% = madness, then death.

   Controls:
     H + M  → activate
     WASD   → move
     Mouse  → look
     Click  → fire holy water
     E      → interact (pick up item / place item / cleanse seal)
     E hold → cleanse ritual seal (3s)
   ───────────────────────────────────────────────────────────────────────── */

window.HauntedMansion = (function () {
  'use strict';

  /* ── Scene references ─────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key-combo H+M within 400ms ───────────────────────────── */
  var _hmPressTime = { H: 0, M: 0 };
  var HM_WINDOW    = 400;

  /* ── Game state ───────────────────────────────────────────────────────── */
  var _active       = false;
  var _victory      = false;
  var _defeat       = false;
  var _gameTime     = 0;       // seconds elapsed
  var _dawnTime     = 360;     // 6 minutes
  var _madnessTimer = 0;       // seconds remaining in madness state
  var _inMadness    = false;
  var _msgTimer     = 0;
  var _msgText      = '';

  /* ── Player ───────────────────────────────────────────────────────────── */
  var _playerPos    = { x: 0, y: 1.7, z: 5 };
  var _playerSpeed  = 5;
  var _yaw          = 0;
  var _pitch        = 0;
  var _keys         = {};
  var _mouseDown    = false;

  /* ── Sanity ───────────────────────────────────────────────────────────── */
  var _sanity       = 100;
  var _sanitySwayT  = 0;
  var _controlDelay = 0;       // queued input for low-sanity delay

  /* ── Inventory ────────────────────────────────────────────────────────── */
  var _holyWater    = 5;
  var _salt         = 3;
  var _heldCandle   = 0;       // number of candles player is carrying
  var _heldTorch    = 0;       // torches in hand

  /* ── Seals ────────────────────────────────────────────────────────────── */
  var _sealsFound   = 0;
  var _sealTotal    = 5;
  var _seals        = [];      // { mesh, cleansed, cleansTimer, pos }
  var _eHoldTimer   = 0;
  var _eHeld        = false;

  /* ── Ghost counts ─────────────────────────────────────────────────────── */
  var _ghostsBanished = 0;

  /* ── Lights ───────────────────────────────────────────────────────────── */
  var _ambientLight    = null;
  var _hallLights      = [];   // flickering PointLights in hallways
  var _placedLights    = [];   // { light, pos, type } candles/torches player placed
  var _candlePickups   = [];   // { mesh, pos, collected }
  var _torchPickups    = [];   // { mesh, pos, collected }

  /* ── Ghosts ───────────────────────────────────────────────────────────── */
  var _spirits     = [];   // wandering spirits
  var _poltergeists= [];   // teleporting poltergeists
  var _banshee     = null; // single banshee
  var _shadowEntity= null; // darkness lurker
  var _projectiles = [];   // { mesh, vel, damage, sanityDrain, life }

  /* ── Salt circles ─────────────────────────────────────────────────────── */
  var _saltCircles  = [];  // { mesh, pos }

  /* ── Banshee state ───────────────────────────────────────────────────────*/
  var _bansheeScreamTimer = 0;
  var _bansheeScreenFlash = 0;

  /* ── Poltergeist state ───────────────────────────────────────────────────*/
  // per poltergeist: teleportTimer, throwTimer stored in object

  /* ── Room objects for collision approximation ────────────────────────── */
  var _roomMeshes = [];

  /* ── Flicker state ───────────────────────────────────────────────────────*/
  var _flickerTimer = 0;

  /* ── Input listeners (stored for cleanup) ────────────────────────────── */
  var _boundKeyDown   = null;
  var _boundKeyUp     = null;
  var _boundMouseMove = null;
  var _boundMouseDown = null;
  var _boundMouseUp   = null;
  var _boundContextMenu = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════════*/

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = (a.y||0) - (b.y||0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _rnd(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _box(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) {
        mat.transparent = true;
        mat.opacity = opts.opacity;
      }
      if (opts.emissive) mat.emissive = new THREE.Color(opts.emissive);
      if (opts.emissiveIntensity) mat.emissiveIntensity = opts.emissiveIntensity;
      if (opts.wireframe) mat.wireframe = true;
    }
    return new THREE.Mesh(geo, mat);
  }

  function _cylinder(rt, rb, h, segs, color, opts) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) {
        mat.transparent = true;
        mat.opacity = opts.opacity;
      }
      if (opts.emissive) mat.emissive = new THREE.Color(opts.emissive);
    }
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, color, opts) {
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.opacity !== undefined) {
        mat.transparent = true;
        mat.opacity = opts.opacity;
      }
    }
    return new THREE.Mesh(geo, mat);
  }

  function _showMsg(txt, dur) {
    _msgText  = txt;
    _msgTimer = dur || 3;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MANSION CONSTRUCTION
  ═══════════════════════════════════════════════════════════════════════════*/

  function _buildMansion() {

    /* ── Floor / ceiling helper ──────────────────────────────────────────*/
    function addRoom(w, h, d, color, x, y, z) {
      // Walls as thin slabs forming a box (open-top for gameplay)
      // Floor
      var fl = _box(w, 0.3, d, color);
      fl.position.set(x, y - 0.15, z);
      _scene.add(fl);
      // Ceiling
      var ce = _box(w, 0.3, d, color);
      ce.position.set(x, y + h - 0.15, z);
      _scene.add(ce);
      // North wall
      var wn = _box(w, h, 0.3, color);
      wn.position.set(x, y + h / 2, z - d / 2);
      _scene.add(wn);
      // South wall
      var ws = _box(w, h, 0.3, color);
      ws.position.set(x, y + h / 2, z + d / 2);
      _scene.add(ws);
      // West wall
      var ww = _box(0.3, h, d, color);
      ww.position.set(x - w / 2, y + h / 2, z);
      _scene.add(ww);
      // East wall
      var we = _box(0.3, h, d, color);
      we.position.set(x + w / 2, y + h / 2, z);
      _scene.add(we);
      _roomMeshes.push(fl);
    }

    /* ── Ground plane ────────────────────────────────────────────────────*/
    var ground = _box(120, 0.2, 120, 0x222211);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    /* Floor 0 — y=0 */
    // Grand foyer  20×8×20  0x444433
    addRoom(20, 8, 20, 0x444433, 0, 0, 0);

    // Staircase — series of BoxGeometry steps leading up
    var i;
    for (i = 0; i < 10; i++) {
      var step = _box(4, 0.3, 1, 0x555544);
      step.position.set(8, i * 0.8, -8 + i * 0.6);
      _scene.add(step);
    }

    // Library  15×4×12  0x443322
    addRoom(15, 4, 12, 0x443322, -18, 0, 0);
    // Bookshelves in library
    for (i = 0; i < 3; i++) {
      var shelf = _box(1, 3.5, 10, 0x332211);
      shelf.position.set(-22 + i * 3, 1.75, 0);
      _scene.add(shelf);
    }

    // Kitchen  12×4×10  0x445544
    addRoom(12, 4, 10, 0x445544, 18, 0, 0);

    // Connecting hallway foyer→library  3×4×8  0x333322
    addRoom(3, 4, 8, 0x333322, -10, 0, 0);
    // Connecting hallway foyer→kitchen  3×4×8  0x333322
    addRoom(3, 4, 8, 0x333322, 10, 0, 0);

    /* Floor 1 — y=8 (above foyer) */
    // Master bedroom  10×4×12  0x443333
    addRoom(10, 4, 12, 0x443333, 0, 8, 0);

    // Hallway from bedroom stairs  3×4×8  0x333322
    addRoom(3, 4, 8, 0x333322, 6, 8, 0);

    /* Floor 2 — y=12 */
    // Attic  20×3×15  0x333322 — darkest area
    addRoom(20, 3, 15, 0x333322, 0, 12, 0);

    /* Basement — y=-4 */
    // Ritual chamber  20×4×15  0x332222
    addRoom(20, 4, 15, 0x332222, 0, -4, 0);

    // Basement hallway downward (vertical ladder shaft implied by collider box)
    var shaft = _box(3, 4, 3, 0x221111);
    shaft.position.set(5, -2, 5);
    _scene.add(shaft);

    /* ── Hallway flickering PointLights ──────────────────────────────────*/
    var hallPositions = [
      { x: -10, y: 3, z:  0 },
      { x:  10, y: 3, z:  0 },
      { x:   6, y: 11,z:  0 },
    ];
    for (i = 0; i < hallPositions.length; i++) {
      var pl = new THREE.PointLight(0xFFCC44, 0.8, 8);
      pl.position.set(hallPositions[i].x, hallPositions[i].y, hallPositions[i].z);
      _scene.add(pl);
      _hallLights.push({ light: pl, baseIntensity: 0.8, flickerT: Math.random() * 6.28 });
    }

    /* ── Candle pickups (4 throughout mansion) ───────────────────────────*/
    var candlePositions = [
      { x: -18, y: 0.5, z: 3 },
      { x:  18, y: 0.5, z: -3 },
      { x:  0,  y: 8.5, z: 4 },
      { x:  0,  y: 12.5,z: -5 },
    ];
    for (i = 0; i < candlePositions.length; i++) {
      var cm = _cylinder(0.05, 0.07, 0.4, 6, 0xFFDD44);
      cm.position.set(candlePositions[i].x, candlePositions[i].y, candlePositions[i].z);
      _scene.add(cm);
      _candlePickups.push({ mesh: cm, pos: candlePositions[i], collected: false });
    }

    /* ── Torch pickups (3 available) ─────────────────────────────────────*/
    var torchPositions = [
      { x: -5, y: 0.5, z: 8 },
      { x:  5, y: 0.5, z: -8 },
      { x:  0, y: 8.5, z: -4 },
    ];
    for (i = 0; i < torchPositions.length; i++) {
      var tm = _box(0.15, 0.8, 0.15, 0xFF8800);
      tm.position.set(torchPositions[i].x, torchPositions[i].y, torchPositions[i].z);
      _scene.add(tm);
      _torchPickups.push({ mesh: tm, pos: torchPositions[i], collected: false });
    }

    /* ── Ritual seals (5 on walls) ───────────────────────────────────────*/
    var sealPositions = [
      { x: -9.8, y: 4,  z: 0,   rx: 0, ry: Math.PI/2 },    // library wall
      { x:  9.8, y: 4,  z: 0,   rx: 0, ry: -Math.PI/2 },   // kitchen wall
      { x:  0,   y: 10, z: -9.8,rx: 0, ry: 0 },             // bedroom wall
      { x:  0,   y: 13.5,z:-7.3,rx: 0, ry: 0 },             // attic wall
      { x:  0,   y: -2, z:-7.3, rx: 0, ry: 0 },             // basement wall
    ];
    for (i = 0; i < sealPositions.length; i++) {
      var sp = sealPositions[i];
      var sm = _box(0.8, 0.8, 0.1, 0xFFCC00, { emissive: 0xFFCC00, emissiveIntensity: 0.3 });
      sm.position.set(sp.x, sp.y, sp.z);
      sm.rotation.y = sp.ry;
      _scene.add(sm);
      _seals.push({ mesh: sm, cleansed: false, cleansTimer: 0, pos: { x: sp.x, y: sp.y, z: sp.z } });
    }

    /* ── Furniture props (basic BoxGeometry) ─────────────────────────────*/
    // Table in kitchen
    var table = _box(2, 0.1, 1, 0x553322);
    table.position.set(18, 1, 0);
    _scene.add(table);
    // Chair
    var chair = _box(0.5, 0.8, 0.5, 0x442211);
    chair.position.set(20, 0.4, 1);
    _scene.add(chair);
    // Bed in bedroom
    var bed = _box(2, 0.5, 3, 0x444466);
    bed.position.set(-2, 8.25, 0);
    _scene.add(bed);
  }

  /* ════════════════════════════════════════════════════════════════════════
     GHOST CONSTRUCTION
  ═══════════════════════════════════════════════════════════════════════════*/

  function _spawnGhosts() {
    var i;

    /* ── 3 Wandering Spirits (SphereGeometry, 0xAABBFF, 80% opacity) ─────*/
    var spiritSpawns = [
      { x: -18, y: 2, z: 0 },
      { x:  18, y: 2, z: 0 },
      { x:   0, y: 13, z: 0 },
    ];
    for (i = 0; i < 3; i++) {
      var sm = _sphere(0.6, 0xAABBFF, { opacity: 0.8 });
      sm.position.set(spiritSpawns[i].x, spiritSpawns[i].y, spiritSpawns[i].z);
      _scene.add(sm);
      _spirits.push({
        mesh: sm,
        pos:  { x: spiritSpawns[i].x, y: spiritSpawns[i].y, z: spiritSpawns[i].z },
        vel:  { x: _rnd(-1.5, 1.5), y: _rnd(-0.3, 0.3), z: _rnd(-1.5, 1.5) },
        hp:   3,
        alive: true,
        dirChangeTimer: _rnd(2, 5)
      });
    }

    /* ── 2 Poltergeists (BoxGeometry, 0x8888CC) ──────────────────────────*/
    var polterSpawns = [
      { x: -18, y: 2, z: -4 },
      { x:  0,  y: 9, z:  4 },
    ];
    for (i = 0; i < 2; i++) {
      var pm = _box(0.8, 1.2, 0.8, 0x8888CC, { opacity: 0.9 });
      pm.material.transparent = true;
      pm.position.set(polterSpawns[i].x, polterSpawns[i].y, polterSpawns[i].z);
      _scene.add(pm);
      _poltergeists.push({
        mesh: pm,
        pos:  { x: polterSpawns[i].x, y: polterSpawns[i].y, z: polterSpawns[i].z },
        hp:   4,
        alive: true,
        teleportTimer: 10,
        throwTimer:    _rnd(3, 7)
      });
    }

    /* ── 1 Banshee (CylinderGeometry, 0xCCAAFF) ──────────────────────────*/
    var bm = _cylinder(0.4, 0.6, 1.8, 6, 0xCCAAFF, { opacity: 0.85 });
    bm.material.transparent = true;
    bm.position.set(0, 13.5, -5);
    _scene.add(bm);
    _banshee = {
      mesh:  bm,
      pos:   { x: 0, y: 13.5, z: -5 },
      alive: true,
      screamTimer: 20,
      flyTimer: 0
    };
    _bansheeScreamTimer = 20;

    /* ── Shadow Entity (BoxGeometry, 0x111122) ───────────────────────────*/
    var shm = _box(1, 2, 0.4, 0x111122, { opacity: 0.7 });
    shm.material.transparent = true;
    shm.visible = false;
    shm.position.set(0, -3, -5);
    _scene.add(shm);
    _shadowEntity = {
      mesh:  shm,
      pos:   { x: 0, y: -3, z: -5 },
      alive: true,
      active: false
    };
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
    if (_active) return;
    _active  = true;
    _victory = false;
    _defeat  = false;

    _gameTime     = 0;
    _sanity       = 100;
    _holyWater    = 5;
    _salt         = 3;
    _heldCandle   = 0;
    _heldTorch    = 0;
    _sealsFound   = 0;
    _inMadness    = false;
    _madnessTimer = 0;
    _msgTimer     = 0;
    _ghostsBanished = 0;

    _spirits      = [];
    _poltergeists = [];
    _banshee      = null;
    _shadowEntity = null;
    _projectiles  = [];
    _saltCircles  = [];
    _seals        = [];
    _hallLights   = [];
    _placedLights = [];
    _candlePickups= [];
    _torchPickups = [];
    _roomMeshes   = [];
    _bansheeScreenFlash = 0;

    _playerPos = { x: 0, y: 1.7, z: 5 };
    _yaw   = 0;
    _pitch = 0;

    // Dark ambient
    _ambientLight = new THREE.AmbientLight(0x111122, 0.15);
    _scene.add(_ambientLight);

    _buildMansion();
    _spawnGhosts();

    _showMsg('SURVIVE UNTIL DAWN — Find 5 ritual seals to banish the evil!', 5);
  }

  function _teardown() {
    if (!_active) return;
    _active  = false;
    _victory = false;
    _defeat  = false;

    // Remove all added scene objects — tracked lists
    var i, j;

    if (_ambientLight) { _scene.remove(_ambientLight); _ambientLight = null; }

    for (i = 0; i < _hallLights.length; i++) _scene.remove(_hallLights[i].light);
    _hallLights = [];

    for (i = 0; i < _placedLights.length; i++) {
      _scene.remove(_placedLights[i].light);
      _scene.remove(_placedLights[i].mesh);
    }
    _placedLights = [];

    for (i = 0; i < _spirits.length; i++) _scene.remove(_spirits[i].mesh);
    _spirits = [];

    for (i = 0; i < _poltergeists.length; i++) _scene.remove(_poltergeists[i].mesh);
    _poltergeists = [];

    if (_banshee) { _scene.remove(_banshee.mesh); _banshee = null; }
    if (_shadowEntity) { _scene.remove(_shadowEntity.mesh); _shadowEntity = null; }

    for (i = 0; i < _projectiles.length; i++) _scene.remove(_projectiles[i].mesh);
    _projectiles = [];

    for (i = 0; i < _saltCircles.length; i++) _scene.remove(_saltCircles[i].mesh);
    _saltCircles = [];

    for (i = 0; i < _seals.length; i++) _scene.remove(_seals[i].mesh);
    _seals = [];

    for (i = 0; i < _candlePickups.length; i++) _scene.remove(_candlePickups[i].mesh);
    _candlePickups = [];

    for (i = 0; i < _torchPickups.length; i++) _scene.remove(_torchPickups[i].mesh);
    _torchPickups = [];

    // Room meshes
    for (i = 0; i < _roomMeshes.length; i++) _scene.remove(_roomMeshes[i]);
    _roomMeshes = [];

    // Remove all children that came from mansion (walk scene.children)
    // Scene cleanup: remove any leftover geometry meshes we added
    var toRemove = [];
    for (i = 0; i < _scene.children.length; i++) {
      var obj = _scene.children[i];
      if (obj.isMesh || (obj.isLight && obj !== _ambientLight)) {
        toRemove.push(obj);
      }
    }
    for (i = 0; i < toRemove.length; i++) _scene.remove(toRemove[i]);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════════*/

  function _registerInputs() {
    _boundKeyDown   = _onKeyDown.bind(this);
    _boundKeyUp     = _onKeyUp.bind(this);
    _boundMouseMove = _onMouseMove.bind(this);
    _boundMouseDown = _onMouseDown.bind(this);
    _boundMouseUp   = _onMouseUp.bind(this);
    _boundContextMenu = function(e) { e.preventDefault(); };

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

    // H+M activation
    if (k === 'H' || k === 'M') {
      _hmPressTime[k] = performance.now();
      var other = (k === 'H') ? 'M' : 'H';
      if (_hmPressTime[other] && (performance.now() - _hmPressTime[other]) < HM_WINDOW) {
        if (!_active) _activate();
      }
    }

    if (!_active || _victory || _defeat) return;

    // E key — interact or begin seal cleanse
    if (k === 'E') {
      _eHeld      = true;
      _eHoldTimer = 0;
      _handleInteractTap();
    }
  }

  function _onKeyUp(e) {
    var k = e.key.toUpperCase();
    _keys[k] = false;
    if (k === 'E') {
      _eHeld      = false;
      _eHoldTimer = 0;
    }
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
    if (e.button === 0) _fireHolyWater();
    if (e.button === 2) _pourSalt();
    // Lock pointer on click
    if (_canvas && _canvas.requestPointerLock) _canvas.requestPointerLock();
  }

  function _onMouseUp() {
    _mouseDown = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HOLY WATER FIRE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _fireHolyWater() {
    if (_holyWater <= 0) { _showMsg('No holy water left!', 2); return; }
    _holyWater--;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var pm = _box(0.15, 0.15, 0.15, 0xAAEEFF);
    pm.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(pm);

    _projectiles.push({
      mesh:   pm,
      vel:    { x: dir.x * 20, y: dir.y * 20, z: dir.z * 20 },
      damage: 1,          // 1 hit counted against ghost HP
      life:   2,
      isPlayer: true
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     SALT POUR
  ═══════════════════════════════════════════════════════════════════════════*/

  function _pourSalt() {
    if (_salt <= 0) { _showMsg('No salt left!', 2); return; }
    _salt--;
    var geo = new THREE.PlaneGeometry(3, 3);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFFFCC, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    var cm  = new THREE.Mesh(geo, mat);
    cm.rotation.x = -Math.PI / 2;
    cm.position.set(_playerPos.x, 0.05, _playerPos.z);
    _scene.add(cm);
    _saltCircles.push({ mesh: cm, pos: { x: _playerPos.x, z: _playerPos.z } });
    _showMsg('Salt circle placed — ghosts cannot cross!', 2);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACT (E tap)
  ═══════════════════════════════════════════════════════════════════════════*/

  function _handleInteractTap() {
    var i, item, d;
    var ppos = _playerPos;
    var REACH = 2.5;

    // Pick up candle
    for (i = 0; i < _candlePickups.length; i++) {
      item = _candlePickups[i];
      if (!item.collected && _dist3(ppos, item.pos) < REACH) {
        item.collected = true;
        _scene.remove(item.mesh);
        _heldCandle++;
        _showMsg('Picked up candle (' + _heldCandle + ' held). Press E near a wall to place.', 2);
        return;
      }
    }

    // Pick up torch
    for (i = 0; i < _torchPickups.length; i++) {
      item = _torchPickups[i];
      if (!item.collected && _dist3(ppos, item.pos) < REACH) {
        item.collected = true;
        _scene.remove(item.mesh);
        _heldTorch++;
        _showMsg('Picked up torch (' + _heldTorch + ' held). Press E to place.', 2);
        return;
      }
    }

    // Place candle
    if (_heldCandle > 0) {
      _heldCandle--;
      var cm = _cylinder(0.05, 0.07, 0.4, 6, 0xFFDD44);
      cm.position.set(ppos.x, 0.2, ppos.z);
      _scene.add(cm);
      var cpl = new THREE.PointLight(0xFFCC88, 1, 6);
      cpl.position.set(ppos.x, 0.5, ppos.z);
      _scene.add(cpl);
      _placedLights.push({ light: cpl, mesh: cm, pos: { x: ppos.x, y: 0.5, z: ppos.z }, type: 'candle' });
      _showMsg('Candle placed!', 1.5);
      return;
    }

    // Place torch
    if (_heldTorch > 0) {
      _heldTorch--;
      var tm = _box(0.15, 0.8, 0.15, 0xFF8800);
      tm.position.set(ppos.x, 0.4, ppos.z);
      _scene.add(tm);
      var tpl = new THREE.PointLight(0xFF9900, 1.5, 10);
      tpl.position.set(ppos.x, 1.2, ppos.z);
      _scene.add(tpl);
      _placedLights.push({ light: tpl, mesh: tm, pos: { x: ppos.x, y: 1.2, z: ppos.z }, type: 'torch' });
      _showMsg('Torch placed!', 1.5);
      return;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SEAL CLEANSE (E hold 3s)
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateSealCleanse(dt) {
    if (!_eHeld) return;
    var i, seal, d;
    var REACH = 2.0;

    for (i = 0; i < _seals.length; i++) {
      seal = _seals[i];
      if (seal.cleansed) continue;
      d = _dist3(_playerPos, seal.pos);
      if (d < REACH) {
        seal.cleansTimer += dt;
        if (seal.cleansTimer >= 3) {
          seal.cleansed = true;
          _sealsFound++;
          seal.mesh.material.emissive = new THREE.Color(0x00FF88);
          seal.mesh.material.emissiveIntensity = 1.0;
          _sanity = Math.min(100, _sanity + 10);
          _showMsg('Ritual seal cleansed! (' + _sealsFound + '/5) +10 sanity', 3);
          if (_sealsFound >= 5) _triggerVictory('ALL SEALS CLEANSED — GHOSTS BANISHED FOREVER!');
        }
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updatePlayer(dt) {
    var speed = _playerSpeed;
    // Below 10% sanity — slight control delay (skip frames of input)
    if (_sanity < 10) {
      _controlDelay += dt;
      if (_controlDelay < 0.12) return;
      _controlDelay = 0;
    }

    // Madness inverts controls
    var inv = _inMadness ? -1 : 1;

    var fwd = 0, right = 0;
    if (_keys['W'] || _keys['ARROWUP'])    fwd   -= inv;
    if (_keys['S'] || _keys['ARROWDOWN'])  fwd   += inv;
    if (_keys['A'] || _keys['ARROWLEFT'])  right -= inv;
    if (_keys['D'] || _keys['ARROWRIGHT']) right += inv;

    var sinY = Math.sin(_yaw), cosY = Math.cos(_yaw);
    var dx = (fwd * (-sinY) + right * cosY) * speed * dt;
    var dz = (fwd * (-cosY) + right * (-sinY)) * speed * dt;

    _playerPos.x += dx;
    _playerPos.z += dz;

    // Clamp to world bounds roughly
    _playerPos.x = _clamp(_playerPos.x, -30, 30);
    _playerPos.z = _clamp(_playerPos.z, -15, 15);

    // Update camera
    if (_camera) {
      var sway = 0;
      if (_sanity < 30) {
        _sanitySwayT += dt * 2;
        sway = Math.sin(_sanitySwayT) * (0.03 + (30 - _sanity) * 0.002);
      }
      _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y     = _yaw + sway;
      _camera.rotation.x     = _pitch;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SANITY SYSTEM
  ═══════════════════════════════════════════════════════════════════════════*/

  function _isInLight() {
    var i, pl, d;
    // Check hall lights
    for (i = 0; i < _hallLights.length; i++) {
      pl = _hallLights[i].light;
      d  = _dist3(_playerPos, { x: pl.position.x, y: pl.position.y, z: pl.position.z });
      if (d < 8) return true;
    }
    // Check placed lights
    for (i = 0; i < _placedLights.length; i++) {
      var range = _placedLights[i].type === 'torch' ? 10 : 6;
      d = _dist3(_playerPos, _placedLights[i].pos);
      if (d < range) return true;
    }
    return false;
  }

  function _updateSanity(dt) {
    var drain = 0;
    var inLight = _isInLight();

    // Dark room drain
    if (!inLight) drain += 2 * dt;

    // Ghost proximity drain
    var i, g, d;
    for (i = 0; i < _spirits.length; i++) {
      g = _spirits[i];
      if (!g.alive) continue;
      d = _dist3(_playerPos, g.pos);
      if (d < 4) drain += 15 * dt;
    }
    for (i = 0; i < _poltergeists.length; i++) {
      g = _poltergeists[i];
      if (!g.alive) continue;
      d = _dist3(_playerPos, g.pos);
      if (d < 5) drain += 10 * dt;
    }
    if (_banshee && _banshee.alive) {
      d = _dist3(_playerPos, _banshee.pos);
      if (d < 6) drain += 8 * dt;
    }

    // Shadow entity
    if (_shadowEntity && _shadowEntity.alive && _shadowEntity.active) {
      d = _dist3(_playerPos, _shadowEntity.pos);
      if (d < 5) drain += 40 * dt;
    }

    // Candle restore
    for (i = 0; i < _placedLights.length; i++) {
      if (_placedLights[i].type === 'candle') {
        d = _dist3(_playerPos, _placedLights[i].pos);
        if (d < 4) drain -= 5 * dt;  // net restore
      }
    }

    _sanity -= drain;
    _sanity  = _clamp(_sanity, 0, 100);

    if (_sanity <= 0 && !_inMadness && !_defeat) {
      _inMadness    = true;
      _madnessTimer = 30;
      _showMsg('MADNESS! Controls inverted! You have 30 seconds!', 4);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GHOST AI UPDATES
  ═══════════════════════════════════════════════════════════════════════════*/

  function _isInSaltCircle(pos) {
    var i, sc, d;
    for (i = 0; i < _saltCircles.length; i++) {
      sc = _saltCircles[i];
      d  = _dist2(pos.x, pos.z, sc.pos.x, sc.pos.z);
      if (d < 1.5) return true;
    }
    return false;
  }

  function _updateSpirits(dt) {
    var i, g, spd, d;
    for (i = 0; i < _spirits.length; i++) {
      g = _spirits[i];
      if (!g.alive) continue;

      // Wander with direction change
      g.dirChangeTimer -= dt;
      if (g.dirChangeTimer <= 0) {
        g.vel.x = _rnd(-2, 2);
        g.vel.y = _rnd(-0.2, 0.2);
        g.vel.z = _rnd(-2, 2);
        g.dirChangeTimer = _rnd(2, 5);
      }

      // Drift toward player slowly
      var tdx = _playerPos.x - g.pos.x;
      var tdz = _playerPos.z - g.pos.z;
      var tl  = Math.sqrt(tdx * tdx + tdz * tdz) || 1;
      g.vel.x += (tdx / tl) * 0.5 * dt;
      g.vel.z += (tdz / tl) * 0.5 * dt;

      // Speed limit
      spd = Math.sqrt(g.vel.x * g.vel.x + g.vel.z * g.vel.z);
      if (spd > 2.5) { g.vel.x *= 2.5 / spd; g.vel.z *= 2.5 / spd; }

      // Stop at salt circles
      var np = { x: g.pos.x + g.vel.x * dt, y: g.pos.y + g.vel.y * dt, z: g.pos.z + g.vel.z * dt };
      if (!_isInSaltCircle(np)) {
        g.pos.x = np.x; g.pos.y = np.y; g.pos.z = np.z;
      } else {
        g.vel.x *= -1; g.vel.z *= -1;
      }

      g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);

      // Pulse opacity
      g.mesh.material.opacity = 0.6 + Math.sin(Date.now() * 0.002 + i) * 0.2;
    }
  }

  function _updatePoltergeists(dt) {
    var i, g, d, dir;
    for (i = 0; i < _poltergeists.length; i++) {
      g = _poltergeists[i];
      if (!g.alive) continue;

      // Teleport timer
      g.teleportTimer -= dt;
      if (g.teleportTimer <= 0) {
        // Teleport to random position
        g.pos.x = _rnd(-20, 20);
        g.pos.y = _rnd(0, 15);
        g.pos.z = _rnd(-10, 10);
        g.teleportTimer = 10;
        g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
        _showMsg('A poltergeist vanished and reappeared!', 1.5);
      }

      // Throw furniture
      g.throwTimer -= dt;
      if (g.throwTimer <= 0) {
        g.throwTimer = _rnd(8, 14);
        d = _dist3(_playerPos, g.pos);
        if (d < 20) {
          var dx2 = _playerPos.x - g.pos.x;
          var dz2 = _playerPos.z - g.pos.z;
          var dl  = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1;
          var proj = _box(0.5, 0.5, 0.5, 0x997755);
          proj.position.set(g.pos.x, g.pos.y, g.pos.z);
          _scene.add(proj);
          _projectiles.push({
            mesh:  proj,
            vel:   { x: (dx2 / dl) * 12, y: 1, z: (dz2 / dl) * 12 },
            damage: 40,
            sanityDrain: 20,
            life:   3,
            isPlayer: false
          });
        }
      }

      g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
    }
  }

  function _updateBanshee(dt) {
    if (!_banshee || !_banshee.alive) return;
    var b = _banshee;

    // Scream timer
    b.screamTimer -= dt;
    if (b.screamTimer <= 0) {
      b.screamTimer = 20;
      _sanity       = Math.max(0, _sanity - 30);
      _bansheeScreenFlash = 0.5;
      _showMsg('THE BANSHEE SCREAMS!', 2);
    }

    // Fly toward player
    var dx = _playerPos.x - b.pos.x;
    var dy = _playerPos.y - b.pos.y;
    var dz = _playerPos.z - b.pos.z;
    var dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var spd = 2.5;
    b.pos.x += (dx / dl) * spd * dt;
    b.pos.y += (dy / dl) * spd * dt;
    b.pos.z += (dz / dl) * spd * dt;

    // Repel by salt circles
    if (_isInSaltCircle(b.pos)) {
      b.pos.x -= (dx / dl) * spd * dt * 3;
      b.pos.z -= (dz / dl) * spd * dt * 3;
    }

    b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
    b.mesh.rotation.y += dt * 1.5;
  }

  function _updateShadowEntity(dt) {
    if (!_shadowEntity || !_shadowEntity.alive) return;
    var s  = _shadowEntity;
    var inLight = _isInLight();

    // Only active when player is in darkness
    s.active = !inLight;
    s.mesh.visible = s.active;

    if (!s.active) return;

    // Move toward player
    var dx = _playerPos.x - s.pos.x;
    var dz = _playerPos.z - s.pos.z;
    var dl = Math.sqrt(dx * dx + dz * dz) || 1;
    s.pos.x += (dx / dl) * 2 * dt;
    s.pos.z += (dz / dl) * 2 * dt;
    s.pos.y  = _playerPos.y;
    s.mesh.position.set(s.pos.x, s.pos.y, s.pos.z);

    // Damage near player
    var d = _dist3(_playerPos, s.pos);
    if (d < 2) {
      _sanity = Math.max(0, _sanity - 40 * dt);
      // Also deal HP damage — represented as extra sanity drain (no explicit HP)
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PROJECTILES
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateProjectiles(dt) {
    var i, p, d;
    var toRemove = [];
    for (i = 0; i < _projectiles.length; i++) {
      p = _projectiles[i];
      p.life -= dt;
      if (p.life <= 0) { toRemove.push(i); continue; }

      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.vel.y -= 6 * dt; // gravity for thrown objects

      var mx = p.mesh.position.x, my = p.mesh.position.y, mz = p.mesh.position.z;

      if (p.isPlayer) {
        // Check hits on spirits
        var j;
        for (j = 0; j < _spirits.length; j++) {
          var g = _spirits[j];
          if (!g.alive) continue;
          if (_dist3({ x: mx, y: my, z: mz }, g.pos) < 0.8) {
            g.hp--;
            if (g.hp <= 0) {
              g.alive = false;
              _scene.remove(g.mesh);
              _ghostsBanished++;
              _sanity = Math.min(100, _sanity + 20);
              _showMsg('Spirit banished! +20 sanity', 2);
            }
            toRemove.push(i);
            break;
          }
        }
        // Check hits on poltergeists
        for (j = 0; j < _poltergeists.length; j++) {
          var pg = _poltergeists[j];
          if (!pg.alive) continue;
          if (_dist3({ x: mx, y: my, z: mz }, pg.pos) < 1.0) {
            pg.hp--;
            if (pg.hp <= 0) {
              pg.alive = false;
              _scene.remove(pg.mesh);
              _ghostsBanished++;
              _sanity = Math.min(100, _sanity + 20);
              _showMsg('Poltergeist banished! +20 sanity', 2);
            }
            toRemove.push(i);
            break;
          }
        }
        // Banshee is immune to holy water
      } else {
        // Enemy projectile: check hit on player
        d = _dist3({ x: mx, y: my, z: mz }, _playerPos);
        if (d < 1.0) {
          _sanity = Math.max(0, _sanity - (p.sanityDrain || 0));
          _showMsg('Hit by thrown furniture! -' + (p.sanityDrain || 0) + ' sanity', 2);
          toRemove.push(i);
        }
        if (my < -1) toRemove.push(i);
      }
    }

    // Remove expired projectiles (reverse order)
    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      if (_projectiles[idx]) {
        _scene.remove(_projectiles[idx].mesh);
        _projectiles.splice(idx, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HALLWAY LIGHT FLICKER
  ═══════════════════════════════════════════════════════════════════════════*/

  function _updateFlicker(dt) {
    var i, hl;
    _flickerTimer += dt;
    for (i = 0; i < _hallLights.length; i++) {
      hl = _hallLights[i];
      hl.flickerT += dt * _rnd(3, 8);
      hl.light.intensity = hl.baseIntensity * (0.6 + 0.4 * Math.abs(Math.sin(hl.flickerT)));
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ═══════════════════════════════════════════════════════════════════════════*/

  function _triggerVictory(msg) {
    _victory = true;
    _showMsg(msg || 'YOU SURVIVED UNTIL DAWN!', 999);
  }

  function _triggerDefeat() {
    _defeat = true;
    _showMsg('YOUR SANITY IS GONE. THE MANSION HAS CLAIMED YOU.', 999);
  }

  function _checkWinLose(dt) {
    // Dawn timer
    _gameTime += dt;
    if (!_victory && !_defeat && _gameTime >= _dawnTime) {
      _triggerVictory('DAWN HAS COME! YOU SURVIVED THE HAUNTED MANSION!');
      return;
    }

    // Madness countdown
    if (_inMadness) {
      _madnessTimer -= dt;
      if (_madnessTimer <= 0) {
        _triggerDefeat();
      }
    }

    // Banish all ghosts win
    if (!_victory && !_defeat) {
      var totalGhosts = 3 + 2 + 1 + 1; // spirits+poltergeists+banshee+shadow
      var banished = _ghostsBanished;
      if (_banshee && !_banshee.alive) banished++;
      if (_shadowEntity && !_shadowEntity.alive) banished++;
      if (_sealsFound >= 5 && banished >= totalGhosts - 1) {
        _triggerVictory('ALL SEALS FOUND AND ALL GHOSTS BANISHED!');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════*/

  function _drawHUD() {
    var el = document.getElementById('hm-hud');
    if (!el) {
      el = document.createElement('div');
      el.id = 'hm-hud';
      el.style.cssText = [
        'position:fixed',
        'top:12px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.7)',
        'color:#EEDDCC',
        'font:bold 14px monospace',
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

    var remaining = Math.max(0, _dawnTime - _gameTime);
    var mm = Math.floor(remaining / 60);
    var ss = Math.floor(remaining % 60);
    var ss2 = ss < 10 ? '0' + ss : '' + ss;

    var ghostCount = 0;
    var i;
    for (i = 0; i < _spirits.length; i++)      if (_spirits[i].alive)      ghostCount++;
    for (i = 0; i < _poltergeists.length; i++) if (_poltergeists[i].alive) ghostCount++;
    if (_banshee && _banshee.alive)      ghostCount++;
    if (_shadowEntity && _shadowEntity.alive) ghostCount++;

    var sanInt = Math.round(_sanity);
    var sanColor = sanInt > 60 ? '#AAFFAA' : sanInt > 30 ? '#FFDD44' : '#FF4444';

    el.innerHTML = 'HAUNTED MANSION &nbsp;|&nbsp; ' +
      '[SANITY: <span style="color:' + sanColor + '">' + sanInt + '%</span>] ' +
      '[SEALS: ' + _sealsFound + '/5] ' +
      '[GHOSTS: ' + ghostCount + '] ' +
      '[DAWN IN: ' + mm + ':' + ss2 + '] ' +
      '&nbsp;|&nbsp; HOLY WATER: ' + _holyWater + '&nbsp; SALT: ' + _salt +
      (_inMadness ? ' &nbsp;<span style="color:#FF0000;animation:none">*** MADNESS: ' + Math.ceil(_madnessTimer) + 's ***</span>' : '');

    // Message bar
    var mel = document.getElementById('hm-msg');
    if (!mel) {
      mel = document.createElement('div');
      mel.id = 'hm-msg';
      mel.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.8)',
        'color:#FFEECC',
        'font:bold 15px monospace',
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

    // Red edge overlay for low sanity
    var oe = document.getElementById('hm-overlay');
    if (!oe) {
      oe = document.createElement('div');
      oe.id = 'hm-overlay';
      oe.style.cssText = [
        'position:fixed',
        'inset:0',
        'pointer-events:none',
        'z-index:9998',
        'transition:box-shadow 0.3s'
      ].join(';');
      document.body.appendChild(oe);
    }
    if (_sanity < 10 || _bansheeScreenFlash > 0) {
      var alpha = _bansheeScreenFlash > 0 ? 0.5 : (10 - _sanity) / 10 * 0.4;
      oe.style.boxShadow = 'inset 0 0 80px 30px rgba(200,0,0,' + alpha.toFixed(2) + ')';
      if (_bansheeScreenFlash > 0) {
        oe.style.background = 'rgba(180,0,180,' + (_bansheeScreenFlash * 0.3).toFixed(2) + ')';
      } else {
        oe.style.background = 'transparent';
      }
    } else {
      oe.style.boxShadow = 'none';
      oe.style.background = 'transparent';
    }

    // Mini controls hint
    var ce = document.getElementById('hm-controls');
    if (!ce) {
      ce = document.createElement('div');
      ce.id = 'hm-controls';
      ce.style.cssText = [
        'position:fixed',
        'bottom:12px',
        'left:12px',
        'background:rgba(0,0,0,0.6)',
        'color:#AAAAAA',
        'font:11px monospace',
        'padding:5px 10px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'line-height:1.6'
      ].join(';');
      ce.innerHTML = 'WASD: Move | Mouse: Look | LClick: Holy Water | RClick: Pour Salt<br>E: Pick up / Place item | E Hold: Cleanse seal (3s)';
      document.body.appendChild(ce);
    }
    ce.style.display = _active ? 'block' : 'none';

    // Win/lose screen
    var we = document.getElementById('hm-winlose');
    if (!we) {
      we = document.createElement('div');
      we.id = 'hm-winlose';
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
      var bg   = _victory ? 'rgba(0,40,0,0.85)' : 'rgba(40,0,0,0.85)';
      var col  = _victory ? '#88FF88' : '#FF4444';
      var head = _victory ? 'YOU SURVIVED' : 'YOU ARE LOST';
      we.style.display = 'flex';
      we.innerHTML = '<div style="background:' + bg + ';border:2px solid ' + col + ';padding:40px 60px;border-radius:8px;text-align:center;font-family:monospace">' +
        '<div style="font-size:32px;color:' + col + ';font-weight:bold">' + head + '</div>' +
        '<div style="color:#DDCCBB;font-size:16px;margin-top:16px">' + _msgText + '</div>' +
        '<div style="color:#888;font-size:13px;margin-top:20px">H+M to restart</div></div>';
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

    // Clamp dt
    if (dt > 0.1) dt = 0.1;

    if (_victory || _defeat) {
      _drawHUD();
      return;
    }

    _msgTimer     = Math.max(0, _msgTimer - dt);
    if (_bansheeScreenFlash > 0) _bansheeScreenFlash = Math.max(0, _bansheeScreenFlash - dt * 2);

    _updatePlayer(dt);
    _updateSanity(dt);
    _checkWinLose(dt);

    if (!_victory && !_defeat) {
      _updateSpirits(dt);
      _updatePoltergeists(dt);
      _updateBanshee(dt);
      _updateShadowEntity(dt);
      _updateProjectiles(dt);
      _updateFlicker(dt);
      _updateSealCleanse(dt);

      // Reset seal timers when E released
      if (!_eHeld) {
        var i;
        for (i = 0; i < _seals.length; i++) {
          if (!_seals[i].cleansed) _seals[i].cleansTimer = 0;
        }
      }
    }

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
