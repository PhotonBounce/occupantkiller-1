/* ───────────────────────────────────────────────────────────────────────────
   volcano-fortress.js — Volcano Fortress: assault Dr. Kronos's supervillain
   lair built inside an active volcano caldera, destroy 3 power cores, and
   eliminate Dr. Kronos before the volcano erupts.
   API: window.VolcanoFortress = { init, update, reset }
   Controls:
     V + F (simultaneous, within 400ms) → activate module
     WASD / Arrow keys                  → move player
     Mouse / Q/E                        → look
     Space                              → shoot
     E (hold 5s on core)               → destroy power core
     E (tap on catwalk switch)         → extend/retract catwalk
   ─────────────────────────────────────────────────────────────────────────── */
window.VolcanoFortress = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Module state ──────────────────────────────────────────────────────── */
  var _active   = false;
  var _disposed = false;
  var _won      = false;
  var _lost     = false;
  var _loseReason = '';

  /* ── Key tracking ──────────────────────────────────────────────────────── */
  var _keysDown         = {};
  var _vPressTime       = -9999;
  var _fPressTime       = -9999;
  var ACTIVATION_WINDOW = 0.4;

  /* ── Player ──────────────────────────────────────────────────────────────*/
  var _player = {
    x: 0, y: 2, z: 0,
    vx: 0, vy: 0, vz: 0,
    yaw: 0,
    hp: 100,
    onGround: false
  };
  var PLAYER_SPEED  = 8;
  var PLAYER_JUMP   = 7;
  var GRAVITY       = 18;

  /* ── Countdown timer ─────────────────────────────────────────────────────*/
  var _timer        = 720; /* 12 minutes in seconds */
  var _lavaLevel    = -2;  /* Y of lava surface */
  var _lavaRising   = false;
  var _alarmActive  = false;

  /* ── Eruption phase ──────────────────────────────────────────────────────*/
  var _phase6min    = false;
  var _phase3min    = false;
  var _phase1min    = false;

  /* ── Core destruction ────────────────────────────────────────────────────*/
  var _cores        = [];   /* { mesh, light, destroyed, holdTimer, pos } */
  var CORE_HOLD_TIME = 5.0;
  var _coresDestroyed = 0;

  /* ── Guards ──────────────────────────────────────────────────────────────*/
  var _guards       = [];   /* { mesh, hp, alive, type, vx, vz, alertTimer, shootTimer } */
  var _alarmTriggered = false;
  var _guardsAlive  = 0;

  /* ── Dr. Kronos ──────────────────────────────────────────────────────────*/
  var _kronos = {
    mesh: null,
    hp: 500,
    maxHp: 500,
    alive: true,
    forceField: false,
    fieldMesh: null,
    emitters: [],
    emittersDown: 0,
    laserActive: false,
    laserMesh: null,
    shootTimer: 0,
    plasmaBursts: []
  };

  /* ── Catwalks ────────────────────────────────────────────────────────────*/
  var _catwalks     = [];   /* { mesh, extended, retractTimer, retracted, switchMesh, baseX, baseZ, len } */
  var CATWALK_RETRACT_INTERVAL = 30;

  /* ── Lava pools ──────────────────────────────────────────────────────────*/
  var _lavaPools    = [];   /* { mesh, light, baseY } */

  /* ── Debris (phase 3min) ─────────────────────────────────────────────────*/
  var _debris       = [];   /* { mesh, vy, active } */

  /* ── Bullets ─────────────────────────────────────────────────────────────*/
  var _bullets      = [];   /* { mesh, vx, vy, vz, fromPlayer, life } */
  var BULLET_SPEED  = 40;
  var SHOOT_COOLDOWN = 0.25;
  var _shootTimer   = 0;

  /* ── Escape elevator ─────────────────────────────────────────────────────*/
  var _elevatorMesh = null;
  var _elevatorZone = { x: 0, y: 2, z: 30, r: 4 };

  /* ── Scene objects ───────────────────────────────────────────────────────*/
  var _volcanoMesh  = null;
  var _lavaSurface  = null;
  var _doomLaser    = null;
  var _ambientLight = null;

  /* ── Floors / level geometry ─────────────────────────────────────────────*/
  var _floors       = [];   /* level floor meshes for collision Y */

  /* ── E-hold interaction ──────────────────────────────────────────────────*/
  var _eHoldTimer   = 0;
  var _eInteracting = false;
  var _eTarget      = null; /* 'core0','core1','core2','catwalkN' */

  /* ── HUD ─────────────────────────────────────────────────────────────────*/
  var _hudEl        = null;

  /* ── Misc helpers ────────────────────────────────────────────────────────*/
  var _time         = 0;

  /* ══════════════════════════════════════════════════════════════════════════
     UTILITY
     ══════════════════════════════════════════════════════════════════════════ */
  function _makeMesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

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

  function _formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
     ══════════════════════════════════════════════════════════════════════════ */
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'volcano-fortress-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(10,5,20,0.80)',
      'color:#FF8833',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:6px 16px',
      'border:1px solid #663311',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';

    var kronosStr = _kronos.alive ? 'ACTIVE' : 'ELIMINATED';
    var lavaStr   = _lavaRising  ? 'RISING'  : 'STABLE';
    var timerStr  = _formatTime(_timer);
    var color     = _alarmActive ? '#FF2222' : '#FF8833';

    if (_won) {
      _hudEl.style.color = '#44FF88';
      _hudEl.innerHTML = 'VOLCANO FORTRESS — MISSION COMPLETE! DR. KRONOS DEFEATED!';
      return;
    }
    if (_lost) {
      _hudEl.style.color = '#FF2222';
      _hudEl.innerHTML = 'VOLCANO FORTRESS — MISSION FAILED: ' + _loseReason;
      return;
    }

    _hudEl.style.color = color;
    _hudEl.innerHTML =
      'VOLCANO FORTRESS' +
      ' [CORES: ' + _coresDestroyed + '/3 DESTROYED]' +
      ' [TIMER: ' + timerStr + ']' +
      ' [GUARDS: ' + _guardsAlive + ']' +
      ' [DR.KRONOS: ' + kronosStr + ']' +
      ' [LAVA: ' + lavaStr + ']' +
      ' [HP: ' + Math.max(0, Math.floor(_player.hp)) + ']';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD SCENE
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildScene() {
    /* Ambient & directional light */
    _ambientLight = new THREE.PointLight(0xFF4400, 1.5, 200);
    _ambientLight.position.set(0, 20, 0);
    _scene.add(_ambientLight);

    var dirLight = new THREE.DirectionalLight(0xFF6633, 0.6);
    dirLight.position.set(5, 20, 5);
    _scene.add(dirLight);

    /* Fog */
    _scene.fog = new THREE.FogExp2(0x220800, 0.015);
    _scene.background = new THREE.Color(0x110400);

    _buildVolcano();
    _buildLavaFloor();
    _buildLevel1();
    _buildLevel2();
    _buildLevel3();
    _buildLevel4();
    _buildCatwalks();
    _buildLavaPools();
    _buildGuards();
    _buildKronos();
    _buildElevator();
  }

  /* ── Volcano exterior ────────────────────────────────────────────────────*/
  function _buildVolcano() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x553322, side: THREE.DoubleSide });
    var geo = new THREE.CylinderGeometry(40, 60, 30, 32, 1, true);
    _volcanoMesh = _makeMesh(geo, mat);
    _volcanoMesh.position.set(0, 8, 0);
    _scene.add(_volcanoMesh);

    /* Entry hatch */
    var hatchMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var hatchGeo = new THREE.BoxGeometry(6, 4, 1);
    var hatch = _makeMesh(hatchGeo, hatchMat);
    hatch.position.set(0, 2, -38);
    _scene.add(hatch);

    /* Lava surface (caldera floor) */
    var lavaMat = new THREE.MeshLambertMaterial({
      color: 0xFF4400,
      emissive: new THREE.Color(0xFF2200),
      emissiveIntensity: 0.8
    });
    var lavaGeo = new THREE.CylinderGeometry(38, 38, 1, 32);
    _lavaSurface = _makeMesh(lavaGeo, lavaMat);
    _lavaSurface.position.set(0, _lavaLevel - 0.5, 0);
    _scene.add(_lavaSurface);
  }

  /* ── Lava floor light ────────────────────────────────────────────────────*/
  function _buildLavaFloor() {
    var lavaGlow = new THREE.PointLight(0xFF2200, 3.0, 60);
    lavaGlow.position.set(0, _lavaLevel, 0);
    _scene.add(lavaGlow);
  }

  /* ── Level 1: Entry Chamber ──────────────────────────────────────────────*/
  function _buildLevel1() {
    /* Main chamber floor/ceiling */
    var mat = new THREE.MeshLambertMaterial({ color: 0x334433 });

    var floorGeo = new THREE.BoxGeometry(30, 1, 30);
    var floor1 = _makeMesh(floorGeo, mat);
    floor1.position.set(0, 3.5, 0);
    _scene.add(floor1);
    _floors.push({ mesh: floor1, y: 4.0, x1: -15, x2: 15, z1: -15, z2: 15 });

    var ceilGeo = new THREE.BoxGeometry(30, 1, 30);
    var ceil1 = _makeMesh(ceilGeo, mat);
    ceil1.position.set(0, 12, 0);
    _scene.add(ceil1);

    /* Walls */
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x2A3A2A });
    var wallGeoA = new THREE.BoxGeometry(30, 8, 1);
    var wallN = _makeMesh(wallGeoA, wallMat);
    wallN.position.set(0, 8, -15);
    _scene.add(wallN);
    var wallS = _makeMesh(wallGeoA, wallMat);
    wallS.position.set(0, 8, 15);
    _scene.add(wallS);
    var wallGeoB = new THREE.BoxGeometry(1, 8, 30);
    var wallE = _makeMesh(wallGeoB, wallMat);
    wallE.position.set(15, 8, 0);
    _scene.add(wallE);
    var wallW = _makeMesh(wallGeoB, wallMat);
    wallW.position.set(-15, 8, 0);
    _scene.add(wallW);

    /* Elevator shaft cylinder */
    var elevGeo = new THREE.CylinderGeometry(2, 2, 40, 12);
    var elevMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var elevShaft = _makeMesh(elevGeo, elevMat);
    elevShaft.position.set(12, 24, 12);
    _scene.add(elevShaft);

    /* Elevator platform */
    var platGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.4, 12);
    var platMat = new THREE.MeshLambertMaterial({ color: 0x667755 });
    var plat = _makeMesh(platGeo, platMat);
    plat.position.set(12, 4.2, 12);
    _scene.add(plat);
    _floors.push({ mesh: plat, y: 4.4, x1: 9.8, x2: 14.2, z1: 9.8, z2: 14.2 });
  }

  /* ── Level 2: Labs ───────────────────────────────────────────────────────*/
  function _buildLevel2() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });

    var floorGeo = new THREE.BoxGeometry(25, 1, 25);
    var floor2 = _makeMesh(floorGeo, mat);
    floor2.position.set(0, 13.5, 0);
    _scene.add(floor2);
    _floors.push({ mesh: floor2, y: 14.0, x1: -12.5, x2: 12.5, z1: -12.5, z2: 12.5 });

    var ceilGeo = new THREE.BoxGeometry(25, 1, 25);
    var ceil2 = _makeMesh(ceilGeo, mat);
    ceil2.position.set(0, 20, 0);
    _scene.add(ceil2);

    /* Science panels (glass-like) */
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x88AACC, transparent: true, opacity: 0.4 });
    var i;
    for (i = 0; i < 4; i++) {
      var panelGeo = new THREE.BoxGeometry(3, 2, 0.2);
      var panel = _makeMesh(panelGeo, glassMat);
      panel.position.set(-8 + i * 4, 15.5, -8);
      _scene.add(panel);
    }

    /* Scientists (non-combat) — gray-coated figures */
    var sciMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    for (i = 0; i < 3; i++) {
      var sciBody = _makeMesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), sciMat);
      sciBody.position.set(-8 + i * 6, 14.7, -6);
      _scene.add(sciBody);
      var sciHead = _makeMesh(new THREE.SphereGeometry(0.4, 8, 6), sciMat);
      sciHead.position.set(-8 + i * 6, 15.8, -6);
      _scene.add(sciHead);
    }

    /* Walls */
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var wgA = new THREE.BoxGeometry(25, 6, 1);
    var w2N = _makeMesh(wgA, wallMat);
    w2N.position.set(0, 17, -12.5);
    _scene.add(w2N);
    var w2S = _makeMesh(wgA, wallMat);
    w2S.position.set(0, 17, 12.5);
    _scene.add(w2S);
    var wgB = new THREE.BoxGeometry(1, 6, 25);
    var w2E = _makeMesh(wgB, wallMat);
    w2E.position.set(12.5, 17, 0);
    _scene.add(w2E);
    var w2W = _makeMesh(wgB, wallMat);
    w2W.position.set(-12.5, 17, 0);
    _scene.add(w2W);
  }

  /* ── Level 3: Power Core ─────────────────────────────────────────────────*/
  function _buildLevel3() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var floorGeo = new THREE.BoxGeometry(22, 1, 22);
    var floor3 = _makeMesh(floorGeo, mat);
    floor3.position.set(0, 23.5, 0);
    _scene.add(floor3);
    _floors.push({ mesh: floor3, y: 24.0, x1: -11, x2: 11, z1: -11, z2: 11 });

    var ceilGeo = new THREE.BoxGeometry(22, 1, 22);
    var ceil3 = _makeMesh(ceilGeo, mat);
    ceil3.position.set(0, 32, 0);
    _scene.add(ceil3);

    /* Walls */
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var wgA = new THREE.BoxGeometry(22, 8, 1);
    _scene.add(_makeMesh(wgA, wallMat)).position;
    var w3N = _makeMesh(wgA, wallMat);
    w3N.position.set(0, 28, -11);
    _scene.add(w3N);
    var w3S = _makeMesh(wgA, wallMat);
    w3S.position.set(0, 28, 11);
    _scene.add(w3S);
    var wgB = new THREE.BoxGeometry(1, 8, 22);
    var w3E = _makeMesh(wgB, wallMat);
    w3E.position.set(11, 28, 0);
    _scene.add(w3E);
    var w3W = _makeMesh(wgB, wallMat);
    w3W.position.set(-11, 28, 0);
    _scene.add(w3W);

    /* 3 power cores */
    var corePositions = [
      { x: -6, z: -6 },
      { x:  6, z: -6 },
      { x:  0, z:  6 }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var coreMat = new THREE.MeshLambertMaterial({
        color: 0x44FF88,
        emissive: new THREE.Color(0x22CC66),
        emissiveIntensity: 0.6
      });
      var coreGeo = new THREE.CylinderGeometry(3, 3, 6, 16);
      var coreMesh = _makeMesh(coreGeo, coreMat);
      coreMesh.position.set(corePositions[i].x, 27, corePositions[i].z);
      _scene.add(coreMesh);

      var coreLight = new THREE.PointLight(0x44FF88, 2.0, 20);
      coreLight.position.set(corePositions[i].x, 30, corePositions[i].z);
      _scene.add(coreLight);

      _cores.push({
        mesh: coreMesh,
        light: coreLight,
        destroyed: false,
        holdTimer: 0,
        pos: { x: corePositions[i].x, y: 27, z: corePositions[i].z }
      });
    }
  }

  /* ── Level 4: Laser Control ──────────────────────────────────────────────*/
  function _buildLevel4() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x334466 });
    var floorGeo = new THREE.BoxGeometry(20, 1, 20);
    var floor4 = _makeMesh(floorGeo, mat);
    floor4.position.set(0, 33.5, 0);
    _scene.add(floor4);
    _floors.push({ mesh: floor4, y: 34.0, x1: -10, x2: 10, z1: -10, z2: 10 });

    var ceilGeo = new THREE.BoxGeometry(20, 1, 20);
    var ceil4 = _makeMesh(ceilGeo, mat);
    ceil4.position.set(0, 42, 0);
    _scene.add(ceil4);

    /* Walls */
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x223355 });
    var wgA = new THREE.BoxGeometry(20, 8, 1);
    var w4N = _makeMesh(wgA, wallMat);
    w4N.position.set(0, 38, -10);
    _scene.add(w4N);
    var w4S = _makeMesh(wgA, wallMat);
    w4S.position.set(0, 38, 10);
    _scene.add(w4S);
    var wgB = new THREE.BoxGeometry(1, 8, 20);
    var w4E = _makeMesh(wgB, wallMat);
    w4E.position.set(10, 38, 0);
    _scene.add(w4E);
    var w4W = _makeMesh(wgB, wallMat);
    w4W.position.set(-10, 38, 0);
    _scene.add(w4W);

    /* Doomsday laser barrel */
    var laserMat = new THREE.MeshLambertMaterial({ color: 0x556688 });
    var laserGeo = new THREE.CylinderGeometry(1, 1, 15, 12);
    _doomLaser = _makeMesh(laserGeo, laserMat);
    _doomLaser.position.set(0, 41, 0);
    _scene.add(_doomLaser);
  }

  /* ── Lava pools ──────────────────────────────────────────────────────────*/
  function _buildLavaPools() {
    var poolPositions = [
      { x: -20, z: -20 },
      { x:  20, z: -20 },
      { x:   0, z: -30 },
      { x: -20, z:  20 },
      { x:  20, z:  20 }
    ];
    var i;
    for (i = 0; i < poolPositions.length; i++) {
      var lavaMat = new THREE.MeshLambertMaterial({
        color: 0xFF4400,
        emissive: new THREE.Color(0xFF2200),
        emissiveIntensity: 1.0
      });
      var lavaGeo = new THREE.CylinderGeometry(10, 10, 1, 20);
      var lavaMesh = _makeMesh(lavaGeo, lavaMat);
      lavaMesh.position.set(poolPositions[i].x, _lavaLevel, poolPositions[i].z);
      _scene.add(lavaMesh);

      var lavaLight = new THREE.PointLight(0xFF2200, 2.5, 25);
      lavaLight.position.set(poolPositions[i].x, _lavaLevel + 2, poolPositions[i].z);
      _scene.add(lavaLight);

      _lavaPools.push({
        mesh: lavaMesh,
        light: lavaLight,
        baseY: _lavaLevel
      });
    }
  }

  /* ── Catwalks (LineSegments over lava) ───────────────────────────────────*/
  function _buildCatwalks() {
    var catPositions = [
      { x: -20, z: -20, toX: 0,   toZ: -15, retractable: true  },
      { x:  20, z: -20, toX: 0,   toZ: -15, retractable: false },
      { x: -20, z:  20, toX: 0,   toZ:  15, retractable: true  },
      { x:  20, z:  20, toX: 0,   toZ:  15, retractable: false },
      { x:   0, z: -30, toX: 0,   toZ: -15, retractable: true  }
    ];
    var i;
    for (i = 0; i < catPositions.length; i++) {
      var cp = catPositions[i];
      var positions = _buildCatwalkLine(cp.x, cp.z, cp.toX, cp.toZ);
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      var mat = new THREE.LineBasicMaterial({ color: 0xAA6633 });
      var lines = new THREE.LineSegments(geo, mat);
      lines.position.y = 1.5;
      _scene.add(lines);

      /* Catwalk solid floor for player to stand on */
      var dx = cp.toX - cp.x;
      var dz = cp.toZ - cp.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      var cx = (cp.x + cp.toX) / 2;
      var cz = (cp.z + cp.toZ) / 2;
      var angle = Math.atan2(dx, dz);

      var floorGeo = new THREE.BoxGeometry(2, 0.3, len);
      var floorMat = new THREE.MeshLambertMaterial({ color: 0x885522 });
      var floorMesh = _makeMesh(floorGeo, floorMat);
      floorMesh.position.set(cx, 1.65, cz);
      floorMesh.rotation.y = angle;
      _scene.add(floorMesh);

      /* Catwalk switch panel */
      var switchMat = new THREE.MeshLambertMaterial({ color: 0x225522 });
      var switchGeo = new THREE.BoxGeometry(0.8, 0.8, 0.4);
      var switchMesh = _makeMesh(switchGeo, switchMat);
      switchMesh.position.set(cp.x, 2.5, cp.z);
      if (cp.retractable) _scene.add(switchMesh);

      _catwalks.push({
        lineMesh: lines,
        floorMesh: floorMesh,
        switchMesh: switchMesh,
        extended: true,
        retractable: cp.retractable,
        retractTimer: CATWALK_RETRACT_INTERVAL + i * 8,
        retracted: false,
        fromX: cp.x, fromZ: cp.z,
        toX: cp.toX, toZ: cp.toZ,
        len: len, angle: angle,
        cx: cx, cz: cz
      });

      if (cp.retractable) {
        _floors.push({
          mesh: floorMesh,
          y: 2.0,
          x1: cx - 1, x2: cx + 1,
          z1: cz - len / 2, z2: cz + len / 2,
          catwalkIdx: i
        });
      } else {
        _floors.push({
          mesh: floorMesh,
          y: 2.0,
          x1: cx - 1, x2: cx + 1,
          z1: cz - len / 2, z2: cz + len / 2
        });
      }
    }
  }

  function _buildCatwalkLine(x1, z1, x2, z2) {
    var dx = x2 - x1;
    var dz = z2 - z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var steps = Math.floor(len / 2);
    var verts = [];
    var i;
    for (i = 0; i < steps; i++) {
      var t0 = i / steps;
      var t1 = (i + 1) / steps;
      /* Main rail A */
      verts.push(x1 + dx * t0 - 0.8, 0, z1 + dz * t0);
      verts.push(x1 + dx * t1 - 0.8, 0, z1 + dz * t1);
      /* Main rail B */
      verts.push(x1 + dx * t0 + 0.8, 0, z1 + dz * t0);
      verts.push(x1 + dx * t1 + 0.8, 0, z1 + dz * t1);
      /* Cross planks */
      verts.push(x1 + dx * t0 - 0.8, 0, z1 + dz * t0);
      verts.push(x1 + dx * t0 + 0.8, 0, z1 + dz * t0);
    }
    return verts;
  }

  /* ── Guards ──────────────────────────────────────────────────────────────*/
  function _buildGuards() {
    var i;
    /* 30 elite soldiers on levels 1-3 */
    var soldierPositions = [
      /* Level 1 */
      {x:-8,y:4,z:-8}, {x:8,y:4,z:-8}, {x:-8,y:4,z:8}, {x:8,y:4,z:8},
      {x:0,y:4,z:-12}, {x:0,y:4,z:12}, {x:-12,y:4,z:0}, {x:12,y:4,z:0},
      {x:-5,y:4,z:5}, {x:5,y:4,z:-5},
      /* Level 2 */
      {x:-8,y:14,z:-8}, {x:8,y:14,z:-8}, {x:-8,y:14,z:8}, {x:8,y:14,z:8},
      {x:0,y:14,z:-10}, {x:0,y:14,z:10}, {x:-10,y:14,z:0}, {x:10,y:14,z:0},
      /* Level 3 */
      {x:-8,y:24,z:-8}, {x:8,y:24,z:-8}, {x:-8,y:24,z:8}, {x:8,y:24,z:8},
      {x:0,y:24,z:-10}, {x:0,y:24,z:10}, {x:-9,y:24,z:0}, {x:9,y:24,z:0},
      /* Level 1 extras */
      {x:-3,y:4,z:-3}, {x:3,y:4,z:3}, {x:-3,y:4,z:3}, {x:3,y:4,z:-3}
    ];
    for (i = 0; i < soldierPositions.length; i++) {
      var sp = soldierPositions[i];
      var guardMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
      var bodyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.6);
      var body = _makeMesh(bodyGeo, guardMat);
      body.position.set(sp.x, sp.y + 0.8, sp.z);
      _scene.add(body);

      var headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var headMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
      var head = _makeMesh(headGeo, headMat);
      head.position.set(sp.x, sp.y + 2.1, sp.z);
      _scene.add(head);

      body.add(head);

      _guards.push({
        mesh: body,
        hp: 90,
        alive: true,
        type: 'soldier',
        vx: 0, vz: 0,
        alertTimer: 0,
        shootTimer: 1.5 + Math.random() * 1.5,
        baseX: sp.x, baseZ: sp.z,
        patrolAngle: Math.random() * Math.PI * 2
      });
    }

    /* 4 robot sentries */
    var robotPositions = [
      {x:-12,y:14,z:-10}, {x:12,y:14,z:-10},
      {x:-10,y:24,z:10},  {x:10,y:24,z:10}
    ];
    for (i = 0; i < 4; i++) {
      var rp = robotPositions[i];
      var robotMat = new THREE.MeshLambertMaterial({ color: 0x445555 });
      var rBodyGeo = new THREE.BoxGeometry(1.2, 1.8, 0.9);
      var rBody = _makeMesh(rBodyGeo, robotMat);
      rBody.position.set(rp.x, rp.y + 0.9, rp.z);
      _scene.add(rBody);

      /* Sensor cylinder on top */
      var sensorMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
      var sensorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
      var sensor = _makeMesh(sensorGeo, sensorMat);
      sensor.position.set(0, 1.2, 0.3);
      rBody.add(sensor);

      _guards.push({
        mesh: rBody,
        hp: 150,
        alive: true,
        type: 'robot',
        vx: 0, vz: 0,
        alertTimer: 0,
        shootTimer: 2.0 + Math.random() * 2.0,
        baseX: rp.x, baseZ: rp.z,
        patrolAngle: Math.random() * Math.PI * 2
      });
    }

    _guardsAlive = _guards.length;
  }

  /* ── Dr. Kronos ──────────────────────────────────────────────────────────*/
  function _buildKronos() {
    /* Body */
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x223355 });
    var bodyGeo = new THREE.BoxGeometry(1.0, 1.8, 0.7);
    _kronos.mesh = _makeMesh(bodyGeo, bodyMat);
    _kronos.mesh.position.set(0, 35.9, -7);
    _scene.add(_kronos.mesh);

    /* Lab coat detail cylinders */
    var coatMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
    var lapelGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 6);
    var lapelL = _makeMesh(lapelGeo, coatMat);
    lapelL.position.set(-0.3, 0.3, 0.4);
    lapelL.rotation.x = Math.PI / 8;
    _kronos.mesh.add(lapelL);
    var lapelR = _makeMesh(lapelGeo, coatMat);
    lapelR.position.set(0.3, 0.3, 0.4);
    lapelR.rotation.x = Math.PI / 8;
    _kronos.mesh.add(lapelR);

    /* Head */
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFDDAA });
    var headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.6);
    var kronHead = _makeMesh(headGeo, headMat);
    kronHead.position.set(0, 1.3, 0);
    _kronos.mesh.add(kronHead);

    /* Plasma cannon PointLight */
    var plasmaLight = new THREE.PointLight(0x44AAFF, 0, 15);
    plasmaLight.position.set(0, 1.0, 0.5);
    _kronos.mesh.add(plasmaLight);
    _kronos.plasmaLight = plasmaLight;

    /* Force field emitters (2 sphere markers) */
    var emitMat = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
    var emitGeo = new THREE.SphereGeometry(0.25, 8, 6);
    var em1 = _makeMesh(emitGeo, emitMat);
    em1.position.set(3, 35.5, -7);
    _scene.add(em1);
    var em2 = _makeMesh(emitGeo, emitMat);
    em2.position.set(-3, 35.5, -7);
    _scene.add(em2);
    _kronos.emitters = [
      { mesh: em1, destroyed: false, pos: { x: 3, y: 35.5, z: -7 } },
      { mesh: em2, destroyed: false, pos: { x: -3, y: 35.5, z: -7 } }
    ];
  }

  /* ── Escape elevator ─────────────────────────────────────────────────────*/
  function _buildElevator() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x336633 });
    var geo = new THREE.CylinderGeometry(4, 4, 0.5, 16);
    _elevatorMesh = _makeMesh(geo, mat);
    _elevatorMesh.position.set(0, 3.75, 32);
    _scene.add(_elevatorMesh);

    /* Arrow/sign above elevator */
    var signMat = new THREE.MeshLambertMaterial({ color: 0x44FF44 });
    var signGeo = new THREE.BoxGeometry(3, 1, 0.2);
    var sign = _makeMesh(signGeo, signMat);
    sign.position.set(0, 6, 32);
    _scene.add(sign);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER PLACEMENT
     ══════════════════════════════════════════════════════════════════════════ */
  function _placePlayer() {
    _player.x = 0;
    _player.y = 5.5;
    _player.z = 0;
    _player.vx = 0;
    _player.vy = 0;
    _player.vz = 0;
    _player.yaw = 0;
    _player.hp = 100;
    _player.onGround = false;
    _syncCamera();
  }

  function _syncCamera() {
    if (!_camera) return;
    _camera.position.set(_player.x, _player.y + 0.8, _player.z);
    _camera.rotation.set(0, _player.yaw, 0, 'YXZ');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     KEY HANDLERS
     ══════════════════════════════════════════════════════════════════════════ */
  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = true;

    if (key === 'v') _vPressTime = _time;
    if (key === 'f') _fPressTime = _time;

    /* Check activation */
    if (!_active && !_disposed) {
      if (Math.abs(_vPressTime - _fPressTime) < ACTIVATION_WINDOW &&
          _vPressTime > 0 && _fPressTime > 0) {
        _activate();
      }
    }

    /* Jump */
    if (_active && !_won && !_lost && key === ' ' && _player.onGround) {
      _player.vy = PLAYER_JUMP;
      _player.onGround = false;
    }

    /* E-key: start interaction */
    if (_active && !_won && !_lost && key === 'e') {
      _eHoldTimer = 0;
      _eInteracting = true;
      _checkEInteract();
    }
  }

  function _onKeyUp(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = false;
    if (key === 'e') {
      _eInteracting = false;
      _eHoldTimer = 0;
      _eTarget = null;
    }
  }

  function _onMouseDown(e) {
    if (!_active || _won || _lost) return;
    if (e.button === 0) _tryShoot();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVATE / DEACTIVATE
     ══════════════════════════════════════════════════════════════════════════ */
  function _activate() {
    _active = true;
    _buildScene();
    _placePlayer();
    _ensureHUD();
    _updateHUD();

    /* Try pointer lock */
    if (_canvas && _canvas.requestPointerLock) {
      _canvas.requestPointerLock();
    }
  }

  function _deactivate() {
    _active = false;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     E-KEY INTERACTIONS
     ══════════════════════════════════════════════════════════════════════════ */
  function _checkEInteract() {
    var i;
    /* Check cores */
    for (i = 0; i < 3; i++) {
      if (!_cores[i].destroyed) {
        var cd = _dist3(_player.x, _player.y, _player.z,
                        _cores[i].pos.x, _cores[i].pos.y, _cores[i].pos.z);
        if (cd < 5) {
          _eTarget = 'core' + i;
          return;
        }
      }
    }
    /* Check catwalk switches */
    for (i = 0; i < _catwalks.length; i++) {
      if (!_catwalks[i].retractable) continue;
      var sw = _catwalks[i];
      var sd = _dist2(_player.x, _player.z, sw.fromX, sw.fromZ);
      if (sd < 3) {
        _eTarget = 'catwalk' + i;
        _toggleCatwalk(i);
        return;
      }
    }
    _eTarget = null;
  }

  function _toggleCatwalk(idx) {
    var cw = _catwalks[idx];
    if (cw.retracted) {
      cw.retracted = false;
      cw.extended = true;
      cw.floorMesh.visible = true;
      cw.lineMesh.visible = true;
    } else {
      cw.retracted = true;
      cw.extended = false;
      cw.floorMesh.visible = false;
      cw.lineMesh.visible = false;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHOOTING
     ══════════════════════════════════════════════════════════════════════════ */
  function _tryShoot() {
    if (_shootTimer > 0) return;
    _shootTimer = SHOOT_COOLDOWN;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(0, _player.yaw, 0, 'YXZ'));

    var bulletMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var bulletGeo = new THREE.SphereGeometry(0.1, 4, 4);
    var bMesh = _makeMesh(bulletGeo, bulletMat);
    bMesh.position.set(_player.x, _player.y + 0.8, _player.z);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vx: dir.x * BULLET_SPEED,
      vy: dir.y * BULLET_SPEED,
      vz: dir.z * BULLET_SPEED,
      fromPlayer: true,
      life: 3.0
    });
  }

  function _spawnEnemyBullet(ex, ey, ez) {
    var dx = _player.x - ex;
    var dy = (_player.y + 0.8) - ey;
    var dz = _player.z - ez;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) return;
    dx /= len; dy /= len; dz /= len;

    var bulletMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    var bulletGeo = new THREE.SphereGeometry(0.12, 4, 4);
    var bMesh = _makeMesh(bulletGeo, bulletMat);
    bMesh.position.set(ex, ey, ez);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vx: dx * 20,
      vy: dy * 20,
      vz: dz * 20,
      fromPlayer: false,
      life: 4.0
    });
  }

  function _spawnPlasmaBurst(ex, ey, ez) {
    var dx = _player.x - ex;
    var dy = (_player.y + 0.8) - ey;
    var dz = _player.z - ez;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) return;
    dx /= len; dy /= len; dz /= len;

    var pMat = new THREE.MeshLambertMaterial({
      color: 0x44AAFF,
      emissive: new THREE.Color(0x2266FF),
      emissiveIntensity: 0.8
    });
    var pGeo = new THREE.SphereGeometry(0.25, 6, 6);
    var pMesh = _makeMesh(pGeo, pMat);
    pMesh.position.set(ex, ey, ez);
    _scene.add(pMesh);

    _kronos.plasmaBursts.push({
      mesh: pMesh,
      vx: dx * 15,
      vy: dy * 15,
      vz: dz * 15,
      life: 5.0
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     COLLISION HELPERS
     ══════════════════════════════════════════════════════════════════════════ */
  function _getFloorY(x, z) {
    /* returns floor Y if player is above a floor tile, else null */
    var i;
    for (i = _floors.length - 1; i >= 0; i--) {
      var f = _floors[i];
      /* Skip retracted catwalks */
      if (f.catwalkIdx !== undefined && _catwalks[f.catwalkIdx].retracted) continue;
      if (x >= f.x1 && x <= f.x2 && z >= f.z1 && z <= f.z2) {
        return f.y;
      }
    }
    return null;
  }

  function _isOnLava(x, z, y) {
    /* Direct lava surface */
    if (Math.abs(y - _lavaLevel) < 1.5) {
      var i;
      for (i = 0; i < _lavaPools.length; i++) {
        var lp = _lavaPools[i];
        var lpx = lp.mesh.position.x;
        var lpz = lp.mesh.position.z;
        var d = _dist2(x, z, lpx, lpz);
        if (d < 10.5) return true;
      }
      /* Main lava surface (caldera floor) */
      if (y < _lavaLevel + 0.8 && _dist2(x, z, 0, 0) < 38) return true;
    }
    return false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE
     ══════════════════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (!_active || _disposed) return;
    _time += dt;

    if (_won || _lost) {
      _updateHUD();
      return;
    }

    _updateTimer(dt);
    _updatePlayer(dt);
    _updateGuards(dt);
    _updateKronos(dt);
    _updateBullets(dt);
    _updateCores(dt);
    _updateCatwalks(dt);
    _updateLavaPools(dt);
    _updateDebris(dt);
    _updateEruption();
    _checkWinLose();
    _updateHUD();
  }

  /* ── Timer & eruption phases ─────────────────────────────────────────────*/
  function _updateTimer(dt) {
    _timer -= dt;
    if (_timer < 0) _timer = 0;

    var mins = _timer / 60;

    /* 6-minute mark: lava rises */
    if (!_phase6min && mins <= 6) {
      _phase6min = true;
      _lavaRising = true;
    }

    /* 3-minute mark: ceiling debris */
    if (!_phase3min && mins <= 3) {
      _phase3min = true;
      _spawnDebris();
    }

    /* 1-minute mark: alarm */
    if (!_phase1min && mins <= 1) {
      _phase1min = true;
      _alarmActive = true;
      if (_ambientLight) _ambientLight.color.setHex(0xFF0000);
    }

    /* Rising lava */
    if (_lavaRising) {
      _lavaLevel += dt * 0.1;
      if (_lavaSurface) _lavaSurface.position.y = _lavaLevel - 0.5;
      var i;
      for (i = 0; i < _lavaPools.length; i++) {
        _lavaPools[i].mesh.position.y = _lavaLevel;
        _lavaPools[i].light.position.y = _lavaLevel + 2;
      }
    }

    /* Flood lower catwalks at 6-minute mark (after 10s) */
    if (_phase6min && !_phase3min && _lavaLevel > 1.0) {
      var j;
      for (j = 0; j < _catwalks.length; j++) {
        var cw = _catwalks[j];
        if (cw.floorMesh.position.y < _lavaLevel + 0.5 && !cw.retracted) {
          cw.retracted = true;
          cw.extended = false;
          cw.floorMesh.visible = false;
          cw.lineMesh.visible = false;
        }
      }
    }
  }

  /* ── Ceiling debris ──────────────────────────────────────────────────────*/
  function _spawnDebris() {
    var i;
    for (i = 0; i < 8; i++) {
      var debrisMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
      var debrisGeo = new THREE.BoxGeometry(
        0.5 + Math.random() * 1.5,
        0.3 + Math.random() * 0.7,
        0.5 + Math.random() * 1.5
      );
      var dMesh = _makeMesh(debrisGeo, debrisMat);
      dMesh.position.set(
        (Math.random() - 0.5) * 20,
        44,
        (Math.random() - 0.5) * 20
      );
      _scene.add(dMesh);
      _debris.push({ mesh: dMesh, vy: -2 - Math.random() * 3, active: true, hitTimer: 0 });
    }
  }

  function _updateDebris(dt) {
    var i;
    for (i = 0; i < _debris.length; i++) {
      var d = _debris[i];
      if (!d.active) continue;
      d.mesh.position.y += d.vy * dt;
      d.vy -= 5 * dt;

      /* Hit player */
      var ddist = _dist3(_player.x, _player.y, _player.z,
                         d.mesh.position.x, d.mesh.position.y, d.mesh.position.z);
      if (ddist < 1.5 && d.hitTimer <= 0) {
        _player.hp -= 15;
        d.hitTimer = 2.0;
      }
      if (d.hitTimer > 0) d.hitTimer -= dt;

      if (d.mesh.position.y < -10) {
        _scene.remove(d.mesh);
        d.active = false;
      }
    }
  }

  /* ── Player movement ─────────────────────────────────────────────────────*/
  function _updatePlayer(dt) {
    /* Look with Q/E keys as fallback */
    if (_keysDown['q']) _player.yaw += dt * 1.5;
    if (_keysDown['arrowleft']) _player.yaw += dt * 1.5;
    if (_keysDown['arrowright']) _player.yaw -= dt * 1.5;

    var forward = 0, strafe = 0;
    if (_keysDown['w'] || _keysDown['arrowup'])   forward -= 1;
    if (_keysDown['s'] || _keysDown['arrowdown'])  forward += 1;
    if (_keysDown['a']) strafe -= 1;
    if (_keysDown['d']) strafe += 1;

    var sin = Math.sin(_player.yaw);
    var cos = Math.cos(_player.yaw);

    _player.vx = (forward * (-sin) + strafe * cos) * PLAYER_SPEED;
    _player.vz = (forward * (-cos) + strafe * (-sin)) * PLAYER_SPEED;

    _player.x += _player.vx * dt;
    _player.z += _player.vz * dt;

    /* Gravity */
    _player.vy -= GRAVITY * dt;
    _player.y += _player.vy * dt;

    /* Floor collision */
    var floorY = _getFloorY(_player.x, _player.z);
    if (floorY !== null && _player.y < floorY) {
      _player.y = floorY;
      _player.vy = 0;
      _player.onGround = true;
    } else {
      _player.onGround = false;
    }

    /* World floor (outside all levels) */
    if (_player.y < _lavaLevel + 1.5 && floorY === null) {
      /* Falling into lava zone */
      if (_isOnLava(_player.x, _player.z, _player.y)) {
        _lost = true;
        _loseReason = 'TOUCHED LAVA';
        return;
      }
    }

    /* Clamp to world bounds */
    _player.x = _clamp(_player.x, -38, 38);
    _player.z = _clamp(_player.z, -38, 38);

    /* Shoot timer */
    if (_shootTimer > 0) _shootTimer -= dt;

    /* E-hold for cores */
    if (_eInteracting && _eTarget && _eTarget.indexOf('core') === 0) {
      var coreIdx = parseInt(_eTarget.charAt(4));
      if (!isNaN(coreIdx) && coreIdx >= 0 && coreIdx < 3) {
        var core = _cores[coreIdx];
        if (!core.destroyed) {
          var cd = _dist3(_player.x, _player.y, _player.z,
                          core.pos.x, core.pos.y, core.pos.z);
          if (cd < 5) {
            _eHoldTimer += dt;
            if (_eHoldTimer >= CORE_HOLD_TIME) {
              _destroyCore(coreIdx);
            }
          } else {
            _eHoldTimer = 0;
            _eTarget = null;
          }
        }
      }
    }

    _syncCamera();

    /* Mouse pointer lock rotation */
    if (document.pointerLockElement === _canvas && _canvas) {
      /* handled via mousemove below */
    }
  }

  /* ── Guards AI ───────────────────────────────────────────────────────────*/
  function _updateGuards(dt) {
    var i;
    _guardsAlive = 0;
    for (i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      _guardsAlive++;

      var distToPlayer = _dist3(
        g.mesh.position.x, g.mesh.position.y, g.mesh.position.z,
        _player.x, _player.y, _player.z
      );

      /* Trigger alarm if player is close */
      if (distToPlayer < 15 && !_alarmTriggered) {
        _alarmTriggered = true;
      }

      if (_alarmTriggered) {
        /* Move toward player */
        var gdx = _player.x - g.mesh.position.x;
        var gdz = _player.z - g.mesh.position.z;
        var gLen = Math.sqrt(gdx * gdx + gdz * gdz);
        if (gLen > 0.5) {
          gdx /= gLen; gdz /= gLen;
          g.mesh.position.x += gdx * 3.5 * dt;
          g.mesh.position.z += gdz * 3.5 * dt;
        }
      } else {
        /* Patrol */
        g.patrolAngle += dt * 0.5;
        g.mesh.position.x = g.baseX + Math.cos(g.patrolAngle) * 2;
        g.mesh.position.z = g.baseZ + Math.sin(g.patrolAngle) * 2;
      }

      /* Shoot player */
      g.shootTimer -= dt;
      if (g.shootTimer <= 0 && distToPlayer < 20) {
        g.shootTimer = 2.0 + Math.random() * 2.0;
        _spawnEnemyBullet(
          g.mesh.position.x,
          g.mesh.position.y + 0.8,
          g.mesh.position.z
        );
      }
    }
  }

  /* ── Dr. Kronos AI ───────────────────────────────────────────────────────*/
  function _updateKronos(dt) {
    if (!_kronos.alive) return;

    var kx = _kronos.mesh.position.x;
    var ky = _kronos.mesh.position.y;
    var kz = _kronos.mesh.position.z;

    var distToPlayer = _dist3(kx, ky, kz, _player.x, _player.y, _player.z);

    /* Face player */
    var faceAngle = Math.atan2(_player.x - kx, _player.z - kz);
    _kronos.mesh.rotation.y = faceAngle;

    /* Activate laser if player close without all cores destroyed */
    if (distToPlayer < 30 && _coresDestroyed < 3 && !_kronos.laserActive) {
      _kronos.laserActive = true;
      if (_doomLaser) {
        _doomLaser.material = new THREE.MeshLambertMaterial({
          color: 0xFF0000,
          emissive: new THREE.Color(0xFF0000),
          emissiveIntensity: 1.0
        });
      }
    }

    /* Force field at 50% HP */
    if (_kronos.hp <= _kronos.maxHp * 0.5 && !_kronos.forceField && _kronos.emittersDown < 2) {
      _kronos.forceField = true;
      _buildKronosForceField();
    }

    /* Shoot plasma */
    _kronos.shootTimer -= dt;
    if (_kronos.shootTimer <= 0 && distToPlayer < 40) {
      _kronos.shootTimer = 1.5;
      if (!_kronos.forceField || _kronos.emittersDown >= 2) {
        _spawnPlasmaBurst(kx, ky + 1.0, kz + 0.5);
      } else {
        _spawnPlasmaBurst(kx, ky + 1.0, kz + 0.5);
      }
      /* Plasma light flash */
      if (_kronos.plasmaLight) {
        _kronos.plasmaLight.intensity = 3.0;
      }
    } else {
      if (_kronos.plasmaLight && _kronos.plasmaLight.intensity > 0) {
        _kronos.plasmaLight.intensity = Math.max(0, _kronos.plasmaLight.intensity - dt * 8);
      }
    }

    /* Update plasma bursts */
    var i;
    for (i = _kronos.plasmaBursts.length - 1; i >= 0; i--) {
      var pb = _kronos.plasmaBursts[i];
      pb.mesh.position.x += pb.vx * dt;
      pb.mesh.position.y += pb.vy * dt;
      pb.mesh.position.z += pb.vz * dt;
      pb.life -= dt;

      /* Hit player */
      var pd = _dist3(pb.mesh.position.x, pb.mesh.position.y, pb.mesh.position.z,
                      _player.x, _player.y + 0.8, _player.z);
      if (pd < 1.0) {
        _player.hp -= 20;
        _scene.remove(pb.mesh);
        _kronos.plasmaBursts.splice(i, 1);
        continue;
      }

      if (pb.life <= 0) {
        _scene.remove(pb.mesh);
        _kronos.plasmaBursts.splice(i, 1);
      }
    }
  }

  function _buildKronosForceField() {
    /* Wireframe sphere around Kronos */
    var geo = new THREE.SphereGeometry(3, 12, 8);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: 0x44AAFF });
    _kronos.fieldMesh = new THREE.LineSegments(edges, mat);
    _kronos.fieldMesh.position.copy(_kronos.mesh.position);
    _kronos.fieldMesh.position.y += 0.5;
    _scene.add(_kronos.fieldMesh);
  }

  /* ── Bullet updates ──────────────────────────────────────────────────────*/
  function _updateBullets(dt) {
    var i, j;
    for (i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      b.life -= dt;

      if (b.fromPlayer) {
        /* Check guard hits */
        var hitSomething = false;
        for (j = 0; j < _guards.length; j++) {
          var g = _guards[j];
          if (!g.alive) continue;
          var gd = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                          g.mesh.position.x, g.mesh.position.y + 0.8, g.mesh.position.z);
          if (gd < 1.0) {
            g.hp -= 34;
            if (g.hp <= 0) {
              g.alive = false;
              _scene.remove(g.mesh);
            }
            hitSomething = true;
            break;
          }
        }

        /* Check Kronos hit */
        if (!hitSomething && _kronos.alive) {
          var kd = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                          _kronos.mesh.position.x, _kronos.mesh.position.y,
                          _kronos.mesh.position.z);
          /* Force field blocks if active and emitters not down */
          var blocked = _kronos.forceField && _kronos.emittersDown < 2;
          if (kd < 2.0 && !blocked) {
            _kronos.hp -= 25;
            hitSomething = true;
            if (_kronos.hp <= 0) {
              _kronos.alive = false;
              _scene.remove(_kronos.mesh);
              if (_kronos.fieldMesh) _scene.remove(_kronos.fieldMesh);
            }
          }

          /* Check emitter hits */
          if (!hitSomething) {
            for (j = 0; j < _kronos.emitters.length; j++) {
              var em = _kronos.emitters[j];
              if (em.destroyed) continue;
              var ed = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                              em.pos.x, em.pos.y, em.pos.z);
              if (ed < 0.8) {
                em.destroyed = true;
                _scene.remove(em.mesh);
                _kronos.emittersDown++;
                if (_kronos.emittersDown >= 2) {
                  _kronos.forceField = false;
                  if (_kronos.fieldMesh) {
                    _scene.remove(_kronos.fieldMesh);
                    _kronos.fieldMesh = null;
                  }
                }
                hitSomething = true;
                break;
              }
            }
          }
        }

        if (hitSomething || b.life <= 0) {
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          continue;
        }
      } else {
        /* Enemy bullet hits player */
        var bpd = _dist3(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z,
                         _player.x, _player.y + 0.8, _player.z);
        if (bpd < 0.8) {
          _player.hp -= 10;
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          continue;
        }
      }

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  /* ── Core interactions ───────────────────────────────────────────────────*/
  function _destroyCore(idx) {
    var core = _cores[idx];
    if (core.destroyed) return;
    core.destroyed = true;
    core.mesh.material.color.setHex(0x334433);
    core.mesh.material.emissive.setHex(0x000000);
    core.light.intensity = 0;
    _coresDestroyed++;
    _eHoldTimer = 0;
    _eTarget = null;
    _eInteracting = false;
  }

  function _updateCores(dt) {
    /* Pulse intact cores */
    var i;
    for (i = 0; i < _cores.length; i++) {
      var core = _cores[i];
      if (core.destroyed) continue;
      var pulse = 1.5 + Math.sin(_time * 3 + i * 2) * 0.5;
      core.light.intensity = pulse;
      var s = 1.0 + Math.sin(_time * 2 + i) * 0.05;
      core.mesh.scale.set(s, s, s);
    }
  }

  /* ── Catwalk retraction ──────────────────────────────────────────────────*/
  function _updateCatwalks(dt) {
    var i;
    for (i = 0; i < _catwalks.length; i++) {
      var cw = _catwalks[i];
      if (!cw.retractable) continue;
      cw.retractTimer -= dt;
      if (cw.retractTimer <= 0) {
        cw.retractTimer = CATWALK_RETRACT_INTERVAL;
        if (!_lavaRising) { /* only auto-retract if not already flooded */
          _toggleCatwalk(i);
        }
      }
    }
  }

  /* ── Lava pool pulse ─────────────────────────────────────────────────────*/
  function _updateLavaPools(dt) {
    var i;
    for (i = 0; i < _lavaPools.length; i++) {
      var lp = _lavaPools[i];
      var pulse = 2.0 + Math.sin(_time * 1.5 + i) * 0.8;
      lp.light.intensity = pulse;
    }
  }

  /* ── Force field bob ─────────────────────────────────────────────────────*/
  function _updateEruption() {
    if (_kronos.fieldMesh) {
      _kronos.fieldMesh.position.copy(_kronos.mesh.position);
      _kronos.fieldMesh.position.y += 0.5;
      _kronos.fieldMesh.rotation.y = _time * 1.2;
    }
  }

  /* ── Win / Lose checks ───────────────────────────────────────────────────*/
  function _checkWinLose() {
    /* Lose: hp */
    if (_player.hp <= 0) {
      _lost = true;
      _loseReason = 'KILLED IN ACTION';
      return;
    }

    /* Lose: timer expired inside fortress */
    if (_timer <= 0) {
      _lost = true;
      _loseReason = 'CALDERA COLLAPSED — TIMER EXPIRED';
      return;
    }

    /* Lose: lava touched */
    if (_isOnLava(_player.x, _player.z, _player.y)) {
      _lost = true;
      _loseReason = 'ENGULFED BY LAVA';
      return;
    }

    /* Win: all 3 cores + Kronos dead + reach elevator */
    if (_coresDestroyed >= 3 && !_kronos.alive) {
      var eDist = _dist2(_player.x, _player.z, _elevatorZone.x, _elevatorZone.z);
      if (eDist < _elevatorZone.r && _timer > 0) {
        _won = true;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MOUSE LOOK
     ══════════════════════════════════════════════════════════════════════════ */
  function _onMouseMove(e) {
    if (!_active || _won || _lost) return;
    if (document.pointerLockElement !== _canvas) return;
    _player.yaw -= e.movementX * 0.002;
    _syncCamera();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════════════════════ */
  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mousemove', _onMouseMove);

    _ensureHUD();
  }

  function reset() {
    _active    = false;
    _won       = false;
    _lost      = false;
    _loseReason = '';
    _timer     = 720;
    _lavaLevel = -2;
    _lavaRising = false;
    _alarmActive = false;
    _phase6min = false;
    _phase3min = false;
    _phase1min = false;
    _coresDestroyed = 0;
    _alarmTriggered = false;
    _guardsAlive = 0;
    _eHoldTimer = 0;
    _eInteracting = false;
    _eTarget = null;
    _shootTimer = 0;
    _time = 0;
    _vPressTime = -9999;
    _fPressTime = -9999;
    _keysDown = {};

    /* Remove scene objects */
    var i;
    for (i = _guards.length - 1; i >= 0; i--) {
      if (_guards[i].mesh && _guards[i].mesh.parent) {
        _scene.remove(_guards[i].mesh);
      }
    }
    _guards = [];

    for (i = _bullets.length - 1; i >= 0; i--) {
      if (_bullets[i].mesh && _bullets[i].mesh.parent) {
        _scene.remove(_bullets[i].mesh);
      }
    }
    _bullets = [];

    for (i = _cores.length - 1; i >= 0; i--) {
      if (_cores[i].mesh && _cores[i].mesh.parent) {
        _scene.remove(_cores[i].mesh);
      }
    }
    _cores = [];

    for (i = _catwalks.length - 1; i >= 0; i--) {
      if (_catwalks[i].lineMesh && _catwalks[i].lineMesh.parent) {
        _scene.remove(_catwalks[i].lineMesh);
      }
      if (_catwalks[i].floorMesh && _catwalks[i].floorMesh.parent) {
        _scene.remove(_catwalks[i].floorMesh);
      }
    }
    _catwalks = [];
    _floors   = [];

    for (i = _lavaPools.length - 1; i >= 0; i--) {
      if (_lavaPools[i].mesh && _lavaPools[i].mesh.parent) {
        _scene.remove(_lavaPools[i].mesh);
      }
    }
    _lavaPools = [];

    for (i = _debris.length - 1; i >= 0; i--) {
      if (_debris[i].mesh && _debris[i].mesh.parent) {
        _scene.remove(_debris[i].mesh);
      }
    }
    _debris = [];

    for (i = _kronos.plasmaBursts.length - 1; i >= 0; i--) {
      if (_kronos.plasmaBursts[i].mesh && _kronos.plasmaBursts[i].mesh.parent) {
        _scene.remove(_kronos.plasmaBursts[i].mesh);
      }
    }

    if (_kronos.mesh && _kronos.mesh.parent) _scene.remove(_kronos.mesh);
    if (_kronos.fieldMesh && _kronos.fieldMesh.parent) _scene.remove(_kronos.fieldMesh);

    _kronos = {
      mesh: null, hp: 500, maxHp: 500, alive: true,
      forceField: false, fieldMesh: null, emitters: [], emittersDown: 0,
      laserActive: false, laserMesh: null, shootTimer: 0, plasmaBursts: []
    };

    if (_volcanoMesh && _volcanoMesh.parent) _scene.remove(_volcanoMesh);
    if (_lavaSurface && _lavaSurface.parent) _scene.remove(_lavaSurface);
    if (_elevatorMesh && _elevatorMesh.parent) _scene.remove(_elevatorMesh);
    if (_doomLaser && _doomLaser.parent) _scene.remove(_doomLaser);
    if (_ambientLight && _ambientLight.parent) _scene.remove(_ambientLight);

    _volcanoMesh  = null;
    _lavaSurface  = null;
    _elevatorMesh = null;
    _doomLaser    = null;
    _ambientLight = null;

    if (_scene) _scene.fog = null;
    if (_scene) _scene.background = null;

    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };

}());
