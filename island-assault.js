/* ───────────────────────────────────────────────────────────────────────────
   island-assault.js — WWII-style beach / island assault module
   Activation: press I + A simultaneously (both keys within 400 ms)
   N           → naval bombardment (3 uses, 45 s cooldown)
   E (hold 3s) → interact / plant flag / neutralise MG nest
   Public API  : window.IslandAssault = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.IslandAssault = (function () {
  'use strict';

  /* ── constants ────────────────────────────────────────────────────────── */
  var ACTIVATION_WINDOW     = 400;    // ms between I and A presses
  var BEACH_W               = 80;
  var BEACH_D               = 30;
  var OCEAN_W               = 80;
  var OCEAN_D               = 40;
  var PALM_COUNT            = 10;
  var BUNKER_COUNT          = 4;
  var MG_RANGE              = 30;
  var MG_DAMAGE             = 8;
  var MG_FIRE_RATE          = 3;      // hits per second
  var MG_SWEEP_ARC          = Math.PI / 2;  // 90°
  var WIRE_COUNT            = 3;
  var WIRE_SLOW             = 0.5;
  var MINE_COUNT            = 12;
  var MINE_DAMAGE           = 80;
  var MINE_KNOCKBACK        = 3;
  var DEFENDER_COUNT        = 20;
  var REINFORCEMENT_INTERVAL= 120;   // seconds
  var NAVAL_MAX_USES        = 3;
  var NAVAL_COOLDOWN        = 45;
  var NAVAL_RANGE           = 80;    // units from shore
  var NAVAL_DAMAGE          = 120;
  var NAVAL_BLAST_R         = 5;
  var NAVAL_SHELL_COUNT     = 5;
  var NAVAL_SHELL_INTERVAL  = 1.2;
  var HOWITZER_WARN         = 8;     // seconds warning smoke before shell
  var HOWITZER_INTERVAL     = 20;    // seconds between shots
  var CRAFT_W               = 8;
  var CRAFT_H               = 2;
  var CRAFT_D               = 4;
  var BEACH_SPRINT_DIST     = 30;
  var INTERACT_HOLD         = 3;     // seconds to hold E
  var NEST_INTERACT_RANGE   = 4;
  var FLAG_INTERACT_RANGE   = 5;

  /* ── colors ───────────────────────────────────────────────────────────── */
  var COL_SAND       = 0xCC9966;
  var COL_OCEAN      = 0x113355;
  var COL_PALM_TRUNK = 0x885533;
  var COL_PALM_LEAF  = 0x224411;
  var COL_BUNKER     = 0x556644;
  var COL_MG_NEST    = 0x445544;
  var COL_WIRE       = 0x888844;
  var COL_SANDBAG    = 0x887766;
  var COL_MINE       = 0x554433;
  var COL_PILLBOX    = 0x556633;
  var COL_SMOKE      = 0x888888;
  var COL_DEFENDER   = 0x334433;
  var COL_CRAFT      = 0x334455;
  var COL_RTOWER     = 0x556644;
  var COL_CMD_POST   = 0x334433;
  var COL_FLAG_RED   = 0xFF2200;
  var COL_FLAG_WHT   = 0xFFFFFF;
  var COL_SHELL      = 0xFFAA22;
  var COL_ROAD       = 0x665544;
  var COL_BOLCUT     = 0x888844;
  var COL_DETECTOR   = 0x667744;

  /* ── module state ────────────────────────────────────────────────────── */
  var _active    = false;
  var _scene     = null;
  var _camera    = null;
  var _audioCtx  = null;

  /* activation key tracking */
  var _iPressed  = false;
  var _aPressed  = false;
  var _iTime     = 0;
  var _aTime     = 0;

  /* keys held */
  var _keys      = {};

  /* objects */
  var _beachMesh     = null;
  var _oceanMesh     = null;
  var _palms         = [];
  var _bunkers       = [];       // { mesh, mgNest, mgAngle, mgTimer, hp, neutralised }
  var _wires         = [];       // { mesh, minX, maxX, z }
  var _mines         = [];       // { mesh, x, z, triggered, revealed }
  var _pillbox       = null;     // { mesh, howAngle, warnTimer, fireTimer, warnSmoke }
  var _defenders     = [];       // { mesh, x, z, hp, alive }
  var _craftMesh     = null;     // BoxGeometry group
  var _rampMesh      = null;
  var _rampDown      = false;
  var _cmdPost       = null;
  var _radioTower    = null;
  var _radioActive   = true;
  var _flagMesh      = null;
  var _flagPlanted   = false;

  /* pickups */
  var _boltCutters   = null;     // { mesh, x, z, taken }
  var _detector      = null;     // { mesh, x, z, taken }
  var _hasBoltCut    = false;
  var _hasDetector   = false;

  /* naval */
  var _navalUses     = NAVAL_MAX_USES;
  var _navalCooldown = 0;
  var _navalShells   = [];       // { mesh, pos, vel, age, travelTime }
  var _navalTimer    = 0;
  var _navalFired    = 0;
  var _navalFiring   = false;

  /* reinforcement convoy */
  var _reinfTimer    = REINFORCEMENT_INTERVAL;
  var _convoy        = [];       // { mesh, z, alive }

  /* objectives */
  var _mgNeutralisedCount = 0;
  var _beachSecured       = false;
  var _missionComplete    = false;

  /* interact */
  var _eHoldTimer    = 0;
  var _eHolding      = false;
  var _eTarget       = null;   // 'nest'|'flag'

  /* player proxy (uses camera as player position) */
  var _playerPos     = null;

  /* smoke / explosion particles */
  var _particles     = [];  // { mesh, vel, life, maxLife, type }

  /* HUD */
  var _hudEl         = null;

  /* wire slow active */
  var _inWire        = false;

  /* ── helpers ─────────────────────────────────────────────────────────── */
  function _mat(color, wireframe) {
    return new THREE.MeshLambertMaterial({ color: color, wireframe: !!wireframe });
  }

  function _box(w, h, d, color) {
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(g, _mat(color));
    return m;
  }

  function _cyl(rt, rb, h, segs, color) {
    var g = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var m = new THREE.Mesh(g, _mat(color));
    return m;
  }

  function _sphere(r, color) {
    var g = new THREE.SphereGeometry(r, 8, 6);
    var m = new THREE.Mesh(g, _mat(color));
    return m;
  }

  function _rand(min, max) { return min + Math.random() * (max - min); }
  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ── audio ───────────────────────────────────────────────────────────── */
  function _ensureAudio() {
    if (_audioCtx) return;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* silence */ }
  }

  function _playTone(freq, type, dur, vol) {
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var g   = _audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.3, _audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + dur);
      osc.connect(g);
      g.connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + dur);
    } catch (e) { /* silence */ }
  }

  function _playNoise(dur, vol, lpFreq) {
    if (!_audioCtx) return;
    try {
      var buf  = _audioCtx.createBuffer(1, Math.ceil(_audioCtx.sampleRate * dur), _audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.4));
      }
      var src = _audioCtx.createBufferSource();
      src.buffer = buf;
      var lp = _audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = lpFreq || 800;
      var g = _audioCtx.createGain();
      g.gain.value = vol || 0.5;
      src.connect(lp);
      lp.connect(g);
      g.connect(_audioCtx.destination);
      src.start();
    } catch (e) { /* silence */ }
  }

  function _sfxGunshot()   { _playTone(220, 'sawtooth', 0.1, 0.4); _playNoise(0.12, 0.3, 600); }
  function _sfxExplosion() { _playNoise(0.8, 0.7, 300); _playTone(80, 'sine', 0.6, 0.5); }
  function _sfxClick()     { _playTone(880, 'square', 0.05, 0.2); }
  function _sfxWarn()      { _playTone(440, 'square', 0.15, 0.3); _playTone(330, 'square', 0.15, 0.3); }
  function _sfxComplete()  { _playTone(523, 'sine', 0.2, 0.4); _playTone(659, 'sine', 0.2, 0.4); _playTone(784, 'sine', 0.4, 0.5); }

  /* ── HUD ─────────────────────────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ia-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'color:#EEDD88',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var beach   = _beachSecured ? 'SECURED' : 'UNDER FIRE';
    var mgStr   = _mgNeutralisedCount + '/4';
    var radio   = _radioActive ? 'ACTIVE' : 'DESTROYED';
    var defLeft = 0;
    for (var i = 0; i < _defenders.length; i++) { if (_defenders[i].alive) defLeft++; }
    var naval   = _navalUses + ' uses';
    if (_navalCooldown > 0) naval += ' (' + Math.ceil(_navalCooldown) + 's)';
    _hudEl.textContent = 'ASSAULT  [BEACH: ' + beach + ']  [MG NESTS: ' + mgStr + ']  [RADIO: ' + radio + ']  [DEFENDERS: ' + defLeft + ']  |  NAVAL: ' + naval;
    if (_missionComplete) {
      _hudEl.style.color = '#88FF88';
      _hudEl.textContent = '*** ISLAND SECURED — MISSION COMPLETE ***';
    }
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) { _hudEl.parentNode.removeChild(_hudEl); }
    _hudEl = null;
  }

  /* ── scene construction ──────────────────────────────────────────────── */
  function _buildScene() {
    /* sky + fog */
    _scene.background = new THREE.Color(0x6699CC);
    _scene.fog = new THREE.FogExp2(0x88BBCC, 0.015);

    /* ambient + directional light */
    var amb = new THREE.AmbientLight(0xffffff, 0.5);
    _scene.add(amb);
    var dir = new THREE.DirectionalLight(0xfff4cc, 0.8);
    dir.position.set(30, 60, 20);
    _scene.add(dir);

    /* beach */
    var beachGeo = new THREE.PlaneGeometry(BEACH_W, BEACH_D);
    var beachMat = new THREE.MeshLambertMaterial({ color: COL_SAND });
    _beachMesh = new THREE.Mesh(beachGeo, beachMat);
    _beachMesh.rotation.x = -Math.PI / 2;
    _beachMesh.position.set(0, 0, 5);
    _scene.add(_beachMesh);

    /* ocean — behind start (positive Z = camera side) */
    var oceanGeo = new THREE.PlaneGeometry(OCEAN_W, OCEAN_D);
    var oceanMat = new THREE.MeshLambertMaterial({ color: COL_OCEAN });
    _oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    _oceanMesh.rotation.x = -Math.PI / 2;
    _oceanMesh.position.set(0, -0.05, 35);
    _scene.add(_oceanMesh);

    /* cliff / hill for pillbox */
    var hillMesh = _box(20, 8, 18, 0x667755);
    hillMesh.position.set(-30, 4, -15);
    _scene.add(hillMesh);

    /* island interior ground */
    var intGeo = new THREE.PlaneGeometry(80, 60);
    var intMat = new THREE.MeshLambertMaterial({ color: 0x3A5C2A });
    var intMesh = new THREE.Mesh(intGeo, intMat);
    intMesh.rotation.x = -Math.PI / 2;
    intMesh.position.set(0, 0, -25);
    _scene.add(intMesh);

    _buildPalms();
    _buildLandingCraft();
    _buildBunkers();
    _buildWireObstacles();
    _buildLandMines();
    _buildPillbox();
    _buildDefenders();
    _buildRadioTower();
    _buildCommandPost();
    _buildPickups();
    _buildRoad();
  }

  /* palm trees */
  function _buildPalms() {
    for (var i = 0; i < PALM_COUNT; i++) {
      var px = _rand(-35, 35);
      var pz = _rand(-20, 10);
      var trunk = _cyl(0.25, 0.35, 5, 6, COL_PALM_TRUNK);
      trunk.position.set(px, 2.5, pz);
      _scene.add(trunk);
      var canopy = _sphere(2.2, COL_PALM_LEAF);
      canopy.position.set(px + _rand(-0.5, 0.5), 5.5, pz + _rand(-0.5, 0.5));
      _scene.add(canopy);
      _palms.push({ trunk: trunk, canopy: canopy });
    }
  }

  /* landing craft — player starts inside */
  function _buildLandingCraft() {
    var group = new THREE.Group();
    var hull = _box(CRAFT_W, CRAFT_H, CRAFT_D, COL_CRAFT);
    hull.position.y = 0;
    group.add(hull);

    /* sides */
    var sideL = _box(0.4, 1.5, CRAFT_D, 0x445566);
    sideL.position.set(-CRAFT_W / 2, 0.75, 0);
    group.add(sideL);
    var sideR = sideL.clone();
    sideR.position.x = CRAFT_W / 2;
    group.add(sideR);
    var sideB = _box(CRAFT_W, 1.5, 0.4, 0x445566);
    sideB.position.set(0, 0.75, CRAFT_D / 2);
    group.add(sideB);

    /* ramp (front, closed initially) */
    _rampMesh = _box(CRAFT_W - 0.4, 0.3, CRAFT_D - 0.4, 0x556677);
    _rampMesh.position.set(0, 0.75, -CRAFT_D / 2);
    _rampMesh.userData.rampClosed = true;
    group.add(_rampMesh);

    group.position.set(0, 0.5, 22);
    _craftMesh = group;
    _scene.add(group);

    /* animate craft beaching on init */
    _craftMesh.userData.beachTarget = 15;
    _craftMesh.userData.beaching = true;
  }

  /* 4 bunkers along beach edge */
  function _buildBunkers() {
    var positions = [
      { x: -28, z: -5 },
      { x: -10, z: -5 },
      { x:  10, z: -5 },
      { x:  28, z: -5 }
    ];
    for (var i = 0; i < BUNKER_COUNT; i++) {
      var bx = positions[i].x;
      var bz = positions[i].z;

      var body = _box(6, 3, 5, COL_BUNKER);
      body.position.set(bx, 1.5, bz);
      _scene.add(body);

      /* sandbag walls */
      var sb1 = _box(7, 1, 0.8, COL_SANDBAG);
      sb1.position.set(bx, 0.5, bz + 2.9);
      _scene.add(sb1);
      var sb2 = _box(7, 1, 0.8, COL_SANDBAG);
      sb2.position.set(bx, 0.5, bz - 2.9);
      _scene.add(sb2);

      /* MG nest on top */
      var nest = _cyl(0.6, 0.8, 0.8, 8, COL_MG_NEST);
      nest.position.set(bx, 3.4, bz);
      _scene.add(nest);

      /* MG barrel */
      var barrel = _box(0.15, 0.15, 1.2, 0x222222);
      barrel.position.set(bx, 3.8, bz - 1);
      _scene.add(barrel);

      _bunkers.push({
        body:        body,
        nest:        nest,
        barrel:      barrel,
        x:           bx,
        z:           bz,
        mgAngle:     0,
        mgDir:       1,
        mgTimer:     0,
        mgSweep:     0,
        hp:          200,
        neutralised: false
      });
    }
  }

  /* wire obstacles */
  function _buildWireObstacles() {
    var zPositions = [-1, 3, 7];
    for (var i = 0; i < WIRE_COUNT; i++) {
      var wz = zPositions[i];
      var points = [];
      var segs = 16;
      for (var j = 0; j <= segs; j++) {
        var wx = -38 + (76 / segs) * j;
        var wy = 0.4 + Math.abs(Math.sin(j * 0.9)) * 0.3;
        points.push(new THREE.Vector3(wx, wy, wz));
      }
      /* second strand */
      for (var k = segs; k >= 0; k--) {
        var wx2 = -38 + (76 / segs) * k;
        var wy2 = 0.7 + Math.abs(Math.sin(k * 1.3)) * 0.3;
        points.push(new THREE.Vector3(wx2, wy2, wz + 0.5));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var mat = new THREE.LineBasicMaterial({ color: COL_WIRE });
      var line = new THREE.LineSegments(geo, mat);
      _scene.add(line);
      _wires.push({ mesh: line, z: wz, cut: false });
    }
  }

  /* land mines */
  function _buildLandMines() {
    for (var i = 0; i < MINE_COUNT; i++) {
      var mx = _rand(-35, 35);
      var mz = _rand(-2, 14);
      var mine = _box(0.5, 0.3, 0.5, COL_MINE);
      mine.position.set(mx, 0.15, mz);
      mine.visible = false; /* hidden until detector or triggered */
      _scene.add(mine);
      _mines.push({ mesh: mine, x: mx, z: mz, triggered: false, revealed: false });
    }
  }

  /* pillbox on cliff */
  function _buildPillbox() {
    var pbMesh = _cyl(2, 2, 2.5, 10, COL_PILLBOX);
    pbMesh.position.set(-30, 8 + 1.25, -15);
    _scene.add(pbMesh);

    /* howitzer barrel */
    var barrel = _box(0.3, 0.3, 3, 0x333333);
    barrel.position.set(-30, 9.5, -16);
    _scene.add(barrel);

    _pillbox = {
      mesh:      pbMesh,
      barrel:    barrel,
      howAngle:  0,
      fireTimer: HOWITZER_INTERVAL,
      warnTimer: 0,
      warnSmoke: null,
      firing:    false,
      shell:     null,
      shellAge:  0
    };
  }

  /* 20 defenders */
  function _buildDefenders() {
    for (var i = 0; i < DEFENDER_COUNT; i++) {
      var dx, dz;
      if (i < 8) {
        /* near bunkers */
        var bun = _bunkers[i % BUNKER_COUNT];
        dx = bun.x + _rand(-4, 4);
        dz = bun.z + _rand(-2, 2);
      } else {
        /* scattered inland */
        dx = _rand(-35, 35);
        dz = _rand(-20, 0);
      }
      var def = _box(0.7, 1.8, 0.5, COL_DEFENDER);
      def.position.set(dx, 0.9, dz);
      _scene.add(def);
      _defenders.push({ mesh: def, x: dx, z: dz, hp: 50, alive: true, fireTimer: _rand(0, 2) });
    }
  }

  /* radio tower on hilltop */
  function _buildRadioTower() {
    var base = _box(2, 0.5, 2, COL_RTOWER);
    base.position.set(20, 0.25, -40);
    _scene.add(base);

    var mast = _cyl(0.15, 0.2, 12, 6, COL_RTOWER);
    mast.position.set(20, 6, -40);
    _scene.add(mast);

    var arm1 = _box(4, 0.12, 0.12, 0x778866);
    arm1.position.set(20, 10, -40);
    _scene.add(arm1);
    var arm2 = _box(0.12, 0.12, 3, 0x778866);
    arm2.position.set(20, 9, -40);
    _scene.add(arm2);

    /* antenna blink — just a small sphere */
    var tip = _sphere(0.2, 0xFF3300);
    tip.position.set(20, 12.2, -40);
    _scene.add(tip);

    _radioTower = { base: base, mast: mast, tip: tip, arm1: arm1, arm2: arm2, blinkTimer: 0 };
  }

  /* command post */
  function _buildCommandPost() {
    var cmd = _box(12, 5, 8, COL_CMD_POST);
    cmd.position.set(0, 2.5, -50);
    _scene.add(cmd);

    var roof = _box(13, 0.5, 9, 0x445533);
    roof.position.set(0, 5.25, -50);
    _scene.add(roof);

    /* flag pole */
    var pole = _cyl(0.1, 0.1, 6, 5, 0x888888);
    pole.position.set(6.5, 3, -50);
    _scene.add(pole);

    /* flag (two parts: red + white) */
    var flagR = _box(2, 0.8, 0.05, COL_FLAG_RED);
    flagR.position.set(7.5, 6, -50);
    _scene.add(flagR);
    var flagW = _box(2, 0.5, 0.05, COL_FLAG_WHT);
    flagW.position.set(7.5, 5.2, -50);
    _scene.add(flagW);

    _cmdPost = { mesh: cmd, roof: roof, pole: pole, flagR: flagR, flagW: flagW };
    _flagMesh = { r: flagR, w: flagW, pole: pole, x: 6.5, z: -50 };
  }

  /* bolt cutters + mine detector pickups */
  function _buildPickups() {
    var bc = _box(0.6, 0.3, 1.0, COL_BOLCUT);
    bc.position.set(-20, 0.15, 12);
    _scene.add(bc);
    _boltCutters = { mesh: bc, x: -20, z: 12, taken: false };

    var det = _box(0.5, 0.8, 0.3, COL_DETECTOR);
    det.position.set(18, 0.4, 12);
    _scene.add(det);
    _detector = { mesh: det, x: 18, z: 12, taken: false };
  }

  /* inland road (reinforcements come from here) */
  function _buildRoad() {
    var road = _box(6, 0.05, 60, COL_ROAD);
    road.position.set(35, 0.025, -30);
    _scene.add(road);
  }

  /* ── spawning helpers ─────────────────────────────────────────────────── */
  function _spawnSmokeParticle(x, y, z, color) {
    var sm = _box(_rand(0.5, 1.2), _rand(0.5, 1.2), _rand(0.5, 1.2), color || COL_SMOKE);
    sm.position.set(x + _rand(-0.5, 0.5), y, z + _rand(-0.5, 0.5));
    _scene.add(sm);
    _particles.push({
      mesh:    sm,
      vel:     new THREE.Vector3(_rand(-0.5, 0.5), _rand(0.8, 2.0), _rand(-0.5, 0.5)),
      life:    0,
      maxLife: _rand(1.5, 3.5),
      type:    'smoke'
    });
  }

  function _spawnExplosionParticles(x, y, z) {
    for (var i = 0; i < 12; i++) {
      var ep = _sphere(_rand(0.1, 0.4), 0xFF5500);
      ep.position.set(x, y, z);
      _scene.add(ep);
      _particles.push({
        mesh:    ep,
        vel:     new THREE.Vector3(_rand(-4, 4), _rand(1, 6), _rand(-4, 4)),
        life:    0,
        maxLife: _rand(0.5, 1.2),
        type:    'explosion'
      });
    }
  }

  function _explodeAt(x, y, z, radius, dmg) {
    _spawnExplosionParticles(x, y, z);
    _sfxExplosion();

    /* damage player (camera) */
    var pp = _playerPos;
    if (pp && _dist2(pp.x, pp.z, x, z) < radius) {
      /* visual feedback — flash HUD red */
      if (_hudEl) { _hudEl.style.background = 'rgba(180,0,0,0.5)'; }
      setTimeout(function () { if (_hudEl) _hudEl.style.background = 'rgba(0,0,0,0.55)'; }, 300);
    }

    /* damage defenders */
    for (var i = 0; i < _defenders.length; i++) {
      var d = _defenders[i];
      if (!d.alive) continue;
      if (_dist2(d.x, d.z, x, z) < radius) {
        d.hp -= dmg;
        if (d.hp <= 0) { _killDefender(i); }
      }
    }

    /* damage MG nests */
    for (var j = 0; j < _bunkers.length; j++) {
      var b = _bunkers[j];
      if (b.neutralised) continue;
      if (_dist2(b.x, b.z, x, z) < radius) {
        b.hp -= dmg * 0.5;
        if (b.hp <= 0) { _neutraliseBunker(j); }
      }
    }
  }

  function _killDefender(idx) {
    var d = _defenders[idx];
    if (!d.alive) return;
    d.alive = false;
    _scene.remove(d.mesh);
    _spawnExplosionParticles(d.x, 1, d.z);
    _updateHUD();
    _checkBeachSecured();
  }

  function _neutraliseBunker(idx) {
    var b = _bunkers[idx];
    if (b.neutralised) return;
    b.neutralised = true;
    _mgNeutralisedCount++;
    _scene.remove(b.nest);
    _sfxExplosion();
    _spawnExplosionParticles(b.x, 3, b.z);
    _updateHUD();
    _checkBeachSecured();
  }

  function _checkBeachSecured() {
    if (_beachSecured) return;
    var allNests = (_mgNeutralisedCount >= BUNKER_COUNT);
    var lowDef = true;
    var defCount = 0;
    for (var i = 0; i < _defenders.length; i++) { if (_defenders[i].alive) defCount++; }
    lowDef = defCount <= 5;
    if (allNests || lowDef) {
      _beachSecured = true;
      _updateHUD();
    }
  }

  /* ── naval bombardment ────────────────────────────────────────────────── */
  function _fireNavalBombardment() {
    if (_navalUses <= 0 || _navalCooldown > 0 || _navalFiring) return;
    _navalUses--;
    _navalFiring  = true;
    _navalFired   = 0;
    _navalTimer   = 0;
    _sfxClick();
    _updateHUD();
  }

  function _spawnNavalShell() {
    var targetX = _rand(-20, 20);
    var targetZ = _rand(-15, 5);
    var startX  = targetX + _rand(-5, 5) - 60; /* from sea (negative X) */
    var startZ  = targetZ + _rand(-5, 5) + 60; /* behind camera */

    var shell = _sphere(0.4, COL_SHELL);
    shell.position.set(startX, 5, startZ);
    _scene.add(shell);

    var travelTime = 3.0;
    var vx = (targetX - startX) / travelTime;
    var vz = (targetZ - startZ) / travelTime;
    var vy = 12; /* arc up */

    _navalShells.push({
      mesh:       shell,
      targetX:    targetX,
      targetZ:    targetZ,
      vel:        new THREE.Vector3(vx, vy, vz),
      age:        0,
      travelTime: travelTime,
      exploded:   false
    });
  }

  function _updateNavalShells(dt) {
    /* fire shells at intervals */
    if (_navalFiring && _navalFired < NAVAL_SHELL_COUNT) {
      _navalTimer += dt;
      if (_navalTimer >= NAVAL_SHELL_INTERVAL * _navalFired || _navalFired === 0) {
        if (_navalFired === 0 || _navalTimer >= NAVAL_SHELL_INTERVAL * _navalFired) {
          _spawnNavalShell();
          _navalFired++;
        }
      }
    }

    for (var i = _navalShells.length - 1; i >= 0; i--) {
      var s = _navalShells[i];
      s.age += dt;
      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.y += s.vel.y * dt - 4.9 * s.age * dt;
      s.mesh.position.z += s.vel.z * dt;

      if (s.age >= s.travelTime && !s.exploded) {
        s.exploded = true;
        _explodeAt(s.targetX, 0.5, s.targetZ, NAVAL_BLAST_R, NAVAL_DAMAGE);
        _scene.remove(s.mesh);
        _navalShells.splice(i, 1);
      }
    }

    if (_navalFiring && _navalFired >= NAVAL_SHELL_COUNT && _navalShells.length === 0) {
      _navalFiring  = false;
      _navalCooldown = NAVAL_COOLDOWN;
      _updateHUD();
    }

    if (_navalCooldown > 0) {
      _navalCooldown -= dt;
      if (_navalCooldown < 0) _navalCooldown = 0;
      _updateHUD();
    }
  }

  /* ── pillbox / howitzer ───────────────────────────────────────────────── */
  function _updatePillbox(dt) {
    if (!_pillbox) return;

    _pillbox.fireTimer -= dt;

    if (_pillbox.fireTimer <= HOWITZER_WARN && !_pillbox.firing) {
      /* spawn warning smoke */
      if (!_pillbox.warnSmoke) {
        var wx = _rand(-25, 25);
        var wz = _rand(-10, 10);
        var ws = _box(1.5, 1.5, 1.5, COL_SMOKE);
        ws.position.set(wx, 0.75, wz);
        _scene.add(ws);
        _pillbox.warnSmoke = { mesh: ws, x: wx, z: wz };
        _pillbox.warnX = wx;
        _pillbox.warnZ = wz;
        _sfxWarn();
        _spawnSmokeParticle(wx, 1, wz, 0xCCCCCC);
        _spawnSmokeParticle(wx, 1, wz, 0xCCCCCC);
      }
    }

    if (_pillbox.fireTimer <= 0) {
      /* fire howitzer shell */
      if (_pillbox.warnSmoke) {
        _scene.remove(_pillbox.warnSmoke.mesh);
        var tx = _pillbox.warnX || 0;
        var tz = _pillbox.warnZ || 0;
        _explodeAt(tx, 0.5, tz, 6, 60);
        _pillbox.warnSmoke = null;
      }
      _pillbox.fireTimer = HOWITZER_INTERVAL;
      _pillbox.firing    = false;
    }
  }

  /* ── MG nest sweeping fire ────────────────────────────────────────────── */
  function _updateMGNests(dt) {
    for (var i = 0; i < _bunkers.length; i++) {
      var b = _bunkers[i];
      if (b.neutralised) continue;

      /* sweep */
      b.mgSweep += b.mgDir * 0.8 * dt;
      if (b.mgSweep >  MG_SWEEP_ARC / 2) { b.mgDir = -1; }
      if (b.mgSweep < -MG_SWEEP_ARC / 2) { b.mgDir =  1; }

      /* rotate barrel */
      b.barrel.position.x = b.x + Math.sin(b.mgSweep) * 1.5;
      b.barrel.position.z = b.z - Math.cos(b.mgSweep) * 1.5;
      b.barrel.rotation.y = b.mgSweep;

      /* fire at player if in range */
      var pp = _playerPos;
      if (!pp) continue;
      var dx = pp.x - b.x;
      var dz = pp.z - b.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < MG_RANGE) {
        b.mgTimer += dt;
        if (b.mgTimer >= 1 / MG_FIRE_RATE) {
          b.mgTimer = 0;
          _sfxGunshot();
          /* small flash particle */
          _spawnSmokeParticle(b.x, 3.8, b.z, 0xFFFF88);
          /* apply damage indication */
          if (_hudEl) {
            _hudEl.style.color = '#FF8888';
            var capturedHud = _hudEl;
            setTimeout(function () { if (capturedHud) capturedHud.style.color = '#EEDD88'; }, 150);
          }
        }
      }
    }
  }

  /* ── defender AI (simple patrol/fire) ────────────────────────────────── */
  function _updateDefenders(dt) {
    for (var i = 0; i < _defenders.length; i++) {
      var d = _defenders[i];
      if (!d.alive) continue;

      var pp = _playerPos;
      if (!pp) continue;

      var dist = _dist2(d.x, d.z, pp.x, pp.z);
      if (dist < 25) {
        d.fireTimer -= dt;
        if (d.fireTimer <= 0) {
          d.fireTimer = _rand(1.5, 3.5);
          _sfxGunshot();
          if (_hudEl && dist < 15) {
            _hudEl.style.color = '#FF8888';
            var capturedHud2 = _hudEl;
            setTimeout(function () { if (capturedHud2) capturedHud2.style.color = '#EEDD88'; }, 150);
          }
        }
      }

      /* bob slightly */
      d.mesh.rotation.y += dt * 0.3;
    }
  }

  /* ── reinforcement convoy ────────────────────────────────────────────── */
  function _spawnConvoy() {
    if (_radioActive) {
      /* radio still active — spawn convoy */
      for (var i = 0; i < 4; i++) {
        var cv = _box(2, 1.5, 3.5, 0x445533);
        cv.position.set(35, 0.75, -80 - i * 8);
        _scene.add(cv);

        /* add a new defender that walks inland */
        var defMesh = _box(0.7, 1.8, 0.5, COL_DEFENDER);
        defMesh.position.set(35 + _rand(-1.5, 1.5), 0.9, -80 - i * 8);
        _scene.add(defMesh);
        _defenders.push({ mesh: defMesh, x: 35 + _rand(-1.5, 1.5), z: -80 - i * 8, hp: 50, alive: true, fireTimer: _rand(0, 2) });

        _convoy.push({ mesh: cv, z: -80 - i * 8, alive: true });
      }
      _updateHUD();
    }
  }

  function _updateConvoy(dt) {
    for (var i = _convoy.length - 1; i >= 0; i--) {
      var cv = _convoy[i];
      if (!cv.alive) continue;
      cv.z += 4 * dt;
      cv.mesh.position.z = cv.z;
      if (cv.z > 20) {
        _scene.remove(cv.mesh);
        _convoy.splice(i, 1);
      }
    }
  }

  /* ── landing craft beaching ───────────────────────────────────────────── */
  function _updateCraft(dt) {
    if (!_craftMesh) return;
    if (_craftMesh.userData.beaching) {
      _craftMesh.position.z -= 3 * dt;
      if (_craftMesh.position.z <= 15) {
        _craftMesh.userData.beaching = false;
        /* drop ramp */
        setTimeout(function () {
          if (_rampMesh) {
            _rampMesh.rotation.x = Math.PI / 2;
            _rampMesh.position.y = 0;
            _rampMesh.position.z -= 2;
            _rampDown = true;
          }
        }, 800);
      }
    }
  }

  /* ── pickup interaction ───────────────────────────────────────────────── */
  function _checkPickups() {
    var pp = _playerPos;
    if (!pp) return;

    if (_boltCutters && !_boltCutters.taken) {
      if (_dist2(pp.x, pp.z, _boltCutters.x, _boltCutters.z) < 2) {
        _boltCutters.taken = true;
        _hasBoltCut = true;
        _scene.remove(_boltCutters.mesh);
        _sfxClick();
      }
    }

    if (_detector && !_detector.taken) {
      if (_dist2(pp.x, pp.z, _detector.x, _detector.z) < 2) {
        _detector.taken = true;
        _hasDetector = true;
        _scene.remove(_detector.mesh);
        _sfxClick();
        /* reveal mines */
        for (var i = 0; i < _mines.length; i++) {
          if (!_mines[i].triggered) {
            _mines[i].mesh.visible = true;
            _mines[i].revealed = true;
          }
        }
      }
    }
  }

  /* ── wire + mine checks ──────────────────────────────────────────────── */
  function _checkWires() {
    var pp = _playerPos;
    if (!pp) return;

    _inWire = false;
    for (var i = 0; i < _wires.length; i++) {
      var w = _wires[i];
      if (w.cut) continue;
      var dz = Math.abs(pp.z - w.z);
      if (dz < 0.8 && pp.x > -38 && pp.x < 38) {
        if (_hasBoltCut && _keys['KeyC']) {
          w.cut = true;
          _scene.remove(w.mesh);
          _sfxClick();
        } else {
          _inWire = true;
        }
      }
    }
  }

  function _checkMines() {
    var pp = _playerPos;
    if (!pp) return;

    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m.triggered) continue;
      if (_dist2(pp.x, pp.z, m.x, m.z) < 0.6) {
        m.triggered = true;
        m.mesh.visible = false;
        _explodeAt(m.x, 0.3, m.z, 2, MINE_DAMAGE);
        /* knockback: push camera */
        if (_camera) {
          var dx = _camera.position.x - m.x;
          var dz2 = _camera.position.z - m.z;
          var len = Math.sqrt(dx * dx + dz2 * dz2) || 1;
          _camera.position.x += (dx / len) * MINE_KNOCKBACK;
          _camera.position.z += (dz2 / len) * MINE_KNOCKBACK;
        }
      }
    }
  }

  /* ── E key interaction ────────────────────────────────────────────────── */
  function _updateInteract(dt) {
    var pp = _playerPos;
    if (!pp) return;

    /* find interact target */
    _eTarget = null;

    /* check MG nests */
    for (var i = 0; i < _bunkers.length; i++) {
      var b = _bunkers[i];
      if (!b.neutralised && _dist2(pp.x, pp.z, b.x, b.z) < NEST_INTERACT_RANGE) {
        _eTarget = 'nest';
        _eTarget_idx = i;
        break;
      }
    }

    /* check radio tower */
    if (!_eTarget && !_radioActive === false && _dist2(pp.x, pp.z, 20, -40) < 5) {
      _eTarget = 'radio';
    }

    /* check flag (command post) */
    if (!_eTarget && _beachSecured && _mgNeutralisedCount >= BUNKER_COUNT &&
        _dist2(pp.x, pp.z, _flagMesh.x, _flagMesh.z) < FLAG_INTERACT_RANGE) {
      _eTarget = 'flag';
    }

    /* hold E */
    if (_keys['KeyE'] && _eTarget) {
      _eHolding  = true;
      _eHoldTimer += dt;
      if (_eHoldTimer >= INTERACT_HOLD) {
        _eHoldTimer = 0;
        _eHolding   = false;
        _triggerInteract();
      }
    } else {
      if (_eHolding) { _eHoldTimer = 0; _eHolding = false; }
    }
  }

  var _eTarget_idx = -1;

  function _triggerInteract() {
    if (_eTarget === 'nest') {
      _neutraliseBunker(_eTarget_idx);
    } else if (_eTarget === 'radio') {
      _radioActive = false;
      _scene.remove(_radioTower.mast);
      _scene.remove(_radioTower.arm1);
      _scene.remove(_radioTower.arm2);
      _scene.remove(_radioTower.tip);
      _spawnExplosionParticles(20, 6, -40);
      _sfxExplosion();
      _updateHUD();
    } else if (_eTarget === 'flag') {
      /* plant flag = mission complete */
      _flagPlanted    = true;
      _missionComplete = true;
      _sfxComplete();
      _updateHUD();
    }
  }

  /* ── particles update ────────────────────────────────────────────────── */
  function _updateParticles(dt) {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life += dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      if (p.type === 'explosion') {
        p.vel.y -= 6 * dt; /* gravity */
        p.mesh.scale.setScalar(1 - p.life / p.maxLife);
      } else {
        /* smoke drifts up */
        p.mesh.scale.setScalar(1 + p.life * 0.5);
        p.mesh.material.opacity = 1 - p.life / p.maxLife;
        p.mesh.material.transparent = true;
      }
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        _particles.splice(i, 1);
      }
    }
  }

  /* ── radio tower blink ────────────────────────────────────────────────── */
  function _updateRadioTower(dt) {
    if (!_radioActive || !_radioTower) return;
    _radioTower.blinkTimer += dt;
    if (_radioTower.blinkTimer > 0.5) {
      _radioTower.blinkTimer = 0;
      _radioTower.tip.visible = !_radioTower.tip.visible;
    }
  }

  /* ── keyboard handling ───────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;

    if (!_active) {
      /* activation check */
      if (e.code === 'KeyI') { _iPressed = true; _iTime = Date.now(); }
      if (e.code === 'KeyA') { _aPressed = true; _aTime = Date.now(); }

      if (_iPressed && _aPressed) {
        var gap = Math.abs(_iTime - _aTime);
        if (gap <= ACTIVATION_WINDOW) {
          _activate();
        }
      }
      return;
    }

    if (e.code === 'KeyN') { _fireNavalBombardment(); }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyI') { _iPressed = false; }
    if (e.code === 'KeyA') { _aPressed = false; }
  }

  /* ── activation ──────────────────────────────────────────────────────── */
  function _activate() {
    if (_active) return;
    _active = true;
    _ensureAudio();
    _buildScene();
    _createHUD();

    /* place camera at landing craft */
    if (_camera) {
      _camera.position.set(0, 2, 22);
      _camera.lookAt(0, 1, 0);
    }

    /* start reinforcement timer */
    _reinfTimer = REINFORCEMENT_INTERVAL;

    _sfxClick();
  }

  /* ── public API ──────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function update(dt) {
    if (!_active) return;

    /* update player position proxy from camera */
    if (_camera) {
      _playerPos = _camera.position;
    }

    _updateCraft(dt);
    _checkPickups();
    _checkWires();
    _checkMines();
    _updateMGNests(dt);
    _updateDefenders(dt);
    _updatePillbox(dt);
    _updateNavalShells(dt);
    _updateParticles(dt);
    _updateRadioTower(dt);
    _updateInteract(dt);

    /* reinforcement timer */
    if (!_missionComplete) {
      _reinfTimer -= dt;
      if (_reinfTimer <= 0) {
        _reinfTimer = REINFORCEMENT_INTERVAL;
        _spawnConvoy();
      }
    }
    _updateConvoy(dt);

    /* occasional HUD refresh for defender count */
    if (!_missionComplete) { _updateHUD(); }
  }

  function reset() {
    if (!_active) return;

    /* remove all scene objects */
    var toRemove = [_beachMesh, _oceanMesh, _craftMesh, _rampMesh];
    for (var i = 0; i < toRemove.length; i++) { if (toRemove[i]) _scene.remove(toRemove[i]); }
    for (var j = 0; j < _palms.length;    j++) { _scene.remove(_palms[j].trunk); _scene.remove(_palms[j].canopy); }
    for (var k = 0; k < _bunkers.length;  k++) { _scene.remove(_bunkers[k].body); _scene.remove(_bunkers[k].nest); _scene.remove(_bunkers[k].barrel); }
    for (var l = 0; l < _wires.length;    l++) { _scene.remove(_wires[l].mesh); }
    for (var m = 0; m < _mines.length;    m++) { _scene.remove(_mines[m].mesh); }
    for (var n = 0; n < _defenders.length; n++) { _scene.remove(_defenders[n].mesh); }
    for (var o = 0; o < _convoy.length;   o++) { _scene.remove(_convoy[o].mesh); }
    for (var p2 = 0; p2 < _particles.length; p2++) { _scene.remove(_particles[p2].mesh); }
    for (var q = 0; q < _navalShells.length; q++) { _scene.remove(_navalShells[q].mesh); }
    if (_pillbox) { _scene.remove(_pillbox.mesh); _scene.remove(_pillbox.barrel); if (_pillbox.warnSmoke) _scene.remove(_pillbox.warnSmoke.mesh); }
    if (_radioTower) { _scene.remove(_radioTower.base); _scene.remove(_radioTower.mast); _scene.remove(_radioTower.tip); _scene.remove(_radioTower.arm1); _scene.remove(_radioTower.arm2); }
    if (_cmdPost) { _scene.remove(_cmdPost.mesh); _scene.remove(_cmdPost.roof); _scene.remove(_cmdPost.pole); _scene.remove(_cmdPost.flagR); _scene.remove(_cmdPost.flagW); }
    if (_boltCutters) _scene.remove(_boltCutters.mesh);
    if (_detector)    _scene.remove(_detector.mesh);

    _removeHUD();

    /* reset state */
    _active               = false;
    _beachMesh            = null;
    _oceanMesh            = null;
    _palms                = [];
    _bunkers              = [];
    _wires                = [];
    _mines                = [];
    _pillbox              = null;
    _defenders            = [];
    _craftMesh            = null;
    _rampMesh             = null;
    _rampDown             = false;
    _cmdPost              = null;
    _radioTower           = null;
    _radioActive          = true;
    _flagMesh             = null;
    _flagPlanted          = false;
    _boltCutters          = null;
    _detector             = null;
    _hasBoltCut           = false;
    _hasDetector          = false;
    _navalUses            = NAVAL_MAX_USES;
    _navalCooldown        = 0;
    _navalShells          = [];
    _navalFiring          = false;
    _navalFired           = 0;
    _navalTimer           = 0;
    _convoy               = [];
    _particles            = [];
    _reinfTimer           = REINFORCEMENT_INTERVAL;
    _mgNeutralisedCount   = 0;
    _beachSecured         = false;
    _missionComplete      = false;
    _eHoldTimer           = 0;
    _eHolding             = false;
    _eTarget              = null;
    _inWire               = false;
    _keys                 = {};
    _iPressed             = false;
    _aPressed             = false;
    _playerPos            = null;

    _scene.background     = null;
    _scene.fog            = null;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
