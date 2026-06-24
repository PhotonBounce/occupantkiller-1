/* ─────────────────────────────────────────────────────────────────────────────
   WATER CRISIS — water treatment plant infiltration
   Activation: W+T simultaneous keypress (both within 400ms)
   Mission: Stop eco-terrorists from poisoning the city water supply.
     1. Eliminate all 20 guards + 3 elite guards
     2. Neutralize all 4 nerve-agent canisters (E-hold 3s each)
     3. Eliminate the chemist boss (300 HP)
     4. Flush the system at the main console (E-hold 5s)
   Timer: 8 minutes — zero time = mission failure
   Depends on: THREE (global)
   ───────────────────────────────────────────────────────────────────────────── */
window.WaterCrisis = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var MISSION_DURATION     = 8 * 60;   // 8 minutes
  var KEY_WINDOW           = 0.4;      // 400ms simultaneous window
  var PLAYER_SPEED         = 8;
  var PLAYER_HEIGHT        = 1.7;
  var PLAYER_MAX_HP        = 100;
  var GUARD_HP             = 80;
  var ELITE_GUARD_HP       = 120;
  var BOSS_HP              = 300;
  var CANISTER_HOLD        = 3.0;      // seconds to neutralize
  var CONSOLE_HOLD         = 5.0;      // seconds to flush system
  var SHOOT_RANGE          = 60;
  var SHOOT_DAMAGE         = 25;
  var GUARD_DAMAGE         = 8;
  var BOSS_SPRAY_DAMAGE    = 15;
  var CHEM_DAMAGE_RATE     = 3;        // HP/s without mask after 4-min leak
  var CHEM_LEAK_TIME       = 4 * 60;  // 4 minutes in
  var FALL_DAMAGE_THRESH   = 4;        // units of falling before damage
  var INTERACT_DIST        = 3.5;
  var GUARD_SIGHT_RANGE    = 18;
  var GUARD_ATTACK_RANGE   = 6;
  var GUARD_MOVE_SPEED     = 3.5;
  var PATROL_RADIUS        = 5;
  var SHOOT_COOLDOWN       = 0.7;
  var PIPE_KNOCKBACK       = 12;
  var DRUM_EXPLOSION_RADIUS = 8;
  var DRUM_EXPLOSION_DAMAGE = 50;
  var GRAVITY              = -20;
  var JUMP_VELOCITY        = 9;
  var CAMERA_SENS          = 0.002;

  /* ── Colors ─────────────────────────────────────────────────────────────── */
  var COL_FENCE       = 0x445544;
  var COL_BUILDING1   = 0x445555;
  var COL_BUILDING2   = 0x334433;
  var COL_BUILDING3   = 0x334455;
  var COL_TANK        = 0x226644;
  var COL_TUNNEL      = 0x223322;
  var COL_CANISTER    = 0x88FF44;
  var COL_GUARD       = 0x335533;
  var COL_ELITE       = 0x44AA44;
  var COL_BOSS        = 0x336633;
  var COL_GROUND      = 0x334422;
  var COL_CATWALK     = 0x445544;
  var COL_RAIL        = 0x556655;
  var COL_PIPE        = 0x557755;
  var COL_DRUM        = 0xAA5533;
  var COL_CONSOLE     = 0x224455;
  var COL_SPRAY       = 0x44FF44;
  var COL_WATER       = 0x2266AA;

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _scene         = null;
  var _camera        = null;
  var _renderer      = null;
  var _active        = false;
  var _onComplete    = null;
  var _meshes        = [];
  var _lights        = [];

  /* Activation keys */
  var _wPressed      = false;
  var _tPressed      = false;
  var _wTime         = 0;
  var _tTime         = 0;

  /* Timer */
  var _timer         = MISSION_DURATION;
  var _missionOver   = false;
  var _missionWon    = false;

  /* Player */
  var _playerPos     = { x: 0, y: PLAYER_HEIGHT, z: 40 };
  var _playerVel     = { x: 0, y: 0, z: 0 };
  var _playerHP      = PLAYER_MAX_HP;
  var _playerOnGround = true;
  var _hasMask       = false;
  var _chemLeakActive = false;
  var _shootCooldown  = 0;
  var _prevPlayerY   = PLAYER_HEIGHT;

  /* Camera look */
  var _yaw           = 0;
  var _pitch         = 0;

  /* Keys held */
  var _keys          = {};

  /* Guards */
  var _guards        = [];
  // { mesh, helmetMesh, x, y, z, hp, maxHp, alive, isElite, isHazmat,
  //   patrolCx, patrolCz, patrolAngle, attackCooldown }

  /* Boss */
  var _boss          = null;
  // { mesh, x, y, z, hp, alive, sprayCooldown, sprayMeshes }

  /* Canisters */
  var _canisters     = [];
  // { mesh, x, y, z, neutralized, holdTimer }

  /* Interactable console */
  var _console       = null;
  // { mesh, x, y, z, holdTimer, flushed }

  /* Interaction state */
  var _eHeld         = false;
  var _interactTarget = null;

  /* Environmental */
  var _catwalks      = [];   // { mesh, y }
  var _pipes         = [];   // { mesh, x, y, z, shot }
  var _drums         = [];   // { mesh, x, y, z, exploded }
  var _valve         = null; // { mesh, x, y, z }
  var _chemCloud     = null; // PointLight
  var _chemCloudMesh = null;
  var _doorLocked    = true; // control room door
  var _doorMesh      = null;

  /* HUD elements */
  var _hudEl         = null;
  var _hudBar        = null;
  var _overlayEl     = null;
  var _timerEl       = null;
  var _canistersEl   = null;
  var _guardsEl      = null;
  var _chemistEl     = null;
  var _systemEl      = null;
  var _crosshairEl   = null;
  var _msgEl         = null;
  var _msgTimer      = 0;
  var _interactBarEl = null;
  var _interactFillEl = null;
  var _hpBarEl       = null;
  var _hpFillEl      = null;
  var _maskWarningEl = null;
  var _hitFlashEl    = null;
  var _hitFlashTimer = 0;

  /* Spray effects */
  var _sprayMeshes   = [];   // { mesh, life }

  /* Water jet */
  var _waterJets     = [];   // { mesh, dir, life }

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function _makeMesh(geo, col, x, y, z) {
    var mat  = new THREE.MeshLambertMaterial({ color: col });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _meshes.push(mesh);
    return mesh;
  }

  function _makeBox(w, h, d, col, x, y, z) {
    return _makeMesh(new THREE.BoxGeometry(w, h, d), col, x, y, z);
  }

  function _makeCyl(rt, rb, h, segs, col, x, y, z) {
    return _makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), col, x, y, z);
  }

  function _makeSphere(r, segs, col, x, y, z) {
    return _makeMesh(new THREE.SphereGeometry(r, segs, segs), col, x, y, z);
  }

  function _makeCone(r, h, segs, col, x, y, z) {
    return _makeMesh(new THREE.ConeGeometry(r, h, segs), col, x, y, z);
  }

  function _makeLines(col, x, y, z, points) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) {
      verts.push(points[i][0], points[i][1], points[i][2]);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat  = new THREE.LineBasicMaterial({ color: col });
    var line = new THREE.LineSegments(geo, mat);
    line.position.set(x, y, z);
    _scene.add(line);
    _meshes.push(line);
    return line;
  }

  function _addLight(col, intensity, x, y, z, dist) {
    var light = new THREE.PointLight(col, intensity, dist || 20);
    light.position.set(x, y, z);
    _scene.add(light);
    _lights.push(light);
    return light;
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _showMsg(txt, duration) {
    _msgEl.textContent = txt;
    _msgEl.style.opacity = '1';
    _msgTimer = duration || 3;
  }

  /* ── Build Scene ────────────────────────────────────────────────────────── */
  function _buildScene() {
    /* Ambient + directional light */
    var ambient = new THREE.AmbientLight(0x334433, 0.7);
    _scene.add(ambient);
    _lights.push(ambient);

    var sun = new THREE.DirectionalLight(0x88aa88, 0.8);
    sun.position.set(20, 40, 10);
    _scene.add(sun);
    _lights.push(sun);

    /* Ground */
    _makeBox(120, 0.4, 120, COL_GROUND, 0, -0.2, 0);

    /* ── Perimeter fence ─────────────────────────────────────────────────── */
    /* North fence */
    _makeBox(120, 3, 0.4, COL_FENCE, 0, 1.5, -55);
    /* South fence */
    _makeBox(120, 3, 0.4, COL_FENCE, 0, 1.5, 55);
    /* West fence */
    _makeBox(0.4, 3, 110, COL_FENCE, -55, 1.5, 0);
    /* East fence */
    _makeBox(0.4, 3, 110, COL_FENCE, 55, 1.5, 0);

    /* Guard posts: 3 corner towers */
    _makeBox(3, 6, 3, COL_FENCE, -50, 3, -50);  /* NW post */
    _makeBox(3, 6, 3, COL_FENCE,  50, 3, -50);  /* NE post */
    _makeBox(3, 6, 3, COL_FENCE, -50, 3,  50);  /* SW post */
    /* Top platforms */
    _makeBox(4, 0.3, 4, COL_CATWALK, -50, 6.15, -50);
    _makeBox(4, 0.3, 4, COL_CATWALK,  50, 6.15, -50);
    _makeBox(4, 0.3, 4, COL_CATWALK, -50, 6.15,  50);

    /* ── Building 1: Intake control ──────────────────────────────────────── */
    _makeBox(20, 5, 15, COL_BUILDING1, -20, 2.5, -20);
    /* Windows (decorative) */
    _makeBox(2, 1.5, 0.2, 0x334455, -24, 3, -16);
    _makeBox(2, 1.5, 0.2, 0x334455, -16, 3, -16);
    /* Door */
    _makeBox(2.5, 4, 0.3, 0x223322, -20, 2, -27.7);
    /* Pump controls (interactable look) */
    _makeBox(3, 2, 1, COL_CONSOLE, -22, 1.5, -22);
    _makeBox(3, 2, 1, COL_CONSOLE, -18, 1.5, -22);

    /* ── Water tanks: 3 large cylinders ──────────────────────────────────── */
    _makeCyl(6, 6, 10, 16, COL_TANK, -5, 5, 0);
    _makeCyl(6, 6, 10, 16, COL_TANK, 10, 5, 0);
    _makeCyl(6, 6, 10, 16, COL_TANK, 25, 5, 0);
    /* Tank tops */
    _makeCyl(6.1, 6.1, 0.4, 16, 0x334433, -5, 10.2, 0);
    _makeCyl(6.1, 6.1, 0.4, 16, 0x334433, 10, 10.2, 0);
    _makeCyl(6.1, 6.1, 0.4, 16, 0x334433, 25, 10.2, 0);

    /* Catwalks above tanks */
    var cwY = 11;
    var cw1 = _makeBox(22, 0.3, 2, COL_CATWALK, 10, cwY, 0);
    _catwalks.push({ mesh: cw1, y: cwY });

    /* Catwalk rails using CylinderGeometry */
    _makeCyl(0.1, 0.1, 1.2, 6, COL_RAIL, -1.5, cwY + 0.75, -0.9);
    _makeCyl(0.1, 0.1, 1.2, 6, COL_RAIL, -1.5, cwY + 0.75,  0.9);
    _makeCyl(0.1, 0.1, 1.2, 6, COL_RAIL, 21.5, cwY + 0.75, -0.9);
    _makeCyl(0.1, 0.1, 1.2, 6, COL_RAIL, 21.5, cwY + 0.75,  0.9);
    /* Rail horizontals (rotated) */
    var railH1 = _makeCyl(0.08, 0.08, 22, 6, COL_RAIL, 10, cwY + 1.2, -0.9);
    railH1.rotation.z = Math.PI / 2;
    var railH2 = _makeCyl(0.08, 0.08, 22, 6, COL_RAIL, 10, cwY + 1.2,  0.9);
    railH2.rotation.z = Math.PI / 2;

    /* Catwalk access ladder */
    _makeBox(0.6, cwY, 0.3, COL_CATWALK, -2, cwY / 2, 2);

    /* ── Building 2: Chemical injection room ─────────────────────────────── */
    _makeBox(15, 5, 12, COL_BUILDING2, 35, 2.5, -20);
    /* Door to building 2 */
    _makeBox(2.5, 4, 0.3, 0x223322, 28, 2, -20);
    /* Pipe connecting tank 3 to building 2 */
    var pipe1 = _makeBox(8, 0.6, 0.6, COL_PIPE, 31, 3, -5);
    _pipes.push({ mesh: pipe1, x: 31, y: 3, z: -5, shot: false });

    /* ── Building 3: Main control room ───────────────────────────────────── */
    _makeBox(12, 5, 10, COL_BUILDING3, 35, 2.5, 15);
    /* Control room door (locked until all canisters done) */
    _doorMesh = _makeBox(2.5, 4, 0.3, 0xAA2222, 35, 2, 10.2);

    /* ── Drainage tunnels (underground) ──────────────────────────────────── */
    _makeBox(2, 2, 30, COL_TUNNEL, -35, -0.5, 0);   /* main tunnel */
    _makeBox(2, 2, 15, COL_TUNNEL, -28, -0.5, 0);   /* branch */
    /* Tunnel entrance hatch */
    _makeBox(2.5, 0.3, 2.5, 0x334433, -35, 0.5, 14);

    /* ── Chemical drums (shootable) ──────────────────────────────────────── */
    var d1 = _makeCyl(0.5, 0.5, 1.2, 8, COL_DRUM, 30, 0.6, -18);
    var d2 = _makeCyl(0.5, 0.5, 1.2, 8, COL_DRUM, 32, 0.6, -18);
    var d3 = _makeCyl(0.5, 0.5, 1.2, 8, COL_DRUM, 30, 0.6,  20);
    _drums.push(
      { mesh: d1, x: 30, y: 0.6, z: -18, exploded: false },
      { mesh: d2, x: 32, y: 0.6, z: -18, exploded: false },
      { mesh: d3, x: 30, y: 0.6, z:  20, exploded: false }
    );

    /* ── Pressurized pipe (shootable water jet) ──────────────────────────── */
    var pipe2 = _makeBox(0.5, 6, 0.5, COL_PIPE, -15, 3, -10);
    _pipes.push({ mesh: pipe2, x: -15, y: 3, z: -10, shot: false, vertical: true });

    /* ── Emergency shutdown valve (LineSegments cross) ───────────────────── */
    _valve = { x: -20, y: 1.5, z: -10 };
    _makeLines(0xAABBAA, -20, 1.5, -10, [
      [-1, 0, 0], [1, 0, 0],
      [0, -1, 0], [0, 1, 0],
      [0, 0, -0.5], [0, 0, 0.5]
    ]);
    /* Valve housing */
    _makeCyl(0.4, 0.4, 0.3, 8, COL_PIPE, -20, 1.5, -10);

    /* ── Control console ─────────────────────────────────────────────────── */
    _console = {
      mesh: _makeBox(2, 1.5, 1, COL_CONSOLE, 35, 3.25, 18),
      x: 35, y: 3.25, z: 18,
      holdTimer: 0,
      flushed: false
    };
    /* Console screen indicator */
    _makeBox(1.5, 0.8, 0.15, 0xAA2222, 35, 3.65, 17.5);
    /* Ambient red light on console */
    _addLight(0xFF2222, 0.5, 35, 4, 18, 8);

    /* Facility work lights */
    _addLight(0x88FFAA, 0.4, -20, 8, -20, 25);  /* building 1 */
    _addLight(0x88AAFF, 0.4,  35, 8, -20, 20);  /* building 2 */
    _addLight(0x8899FF, 0.4,  35, 8,  15, 20);  /* control room */
    _addLight(0xAAFFAA, 0.6,  10, 14,   0, 30); /* tank catwalk */
  }

  /* ── Place Guards ───────────────────────────────────────────────────────── */
  function _spawnGuards() {
    /* Guard spawn positions: 20 eco-terrorists distributed */
    var spawnData = [
      /* perimeter / guard posts */
      { x: -50, z: -50, elite: false, hazmat: false },  /* NW tower */
      { x:  50, z: -50, elite: false, hazmat: false },  /* NE tower */
      { x: -50, z:  50, elite: false, hazmat: false },  /* SW tower */
      /* Building 1: 4 guards */
      { x: -22, z: -24, elite: false, hazmat: false },
      { x: -18, z: -24, elite: false, hazmat: false },
      { x: -20, z: -18, elite: false, hazmat: false },
      { x: -16, z: -20, elite: false, hazmat: true  },  /* hazmat in building 1 */
      /* Tank area */
      { x:  -5, z:   5, elite: false, hazmat: false },
      { x:  10, z:   5, elite: false, hazmat: false },
      { x:  25, z:   5, elite: false, hazmat: true  },  /* hazmat near tanks */
      /* Building 2: 4 guards */
      { x:  33, z: -23, elite: false, hazmat: false },
      { x:  37, z: -23, elite: false, hazmat: false },
      { x:  33, z: -17, elite: false, hazmat: false },
      { x:  37, z: -17, elite: false, hazmat: true  },  /* hazmat in injection room */
      /* Tunnel */
      { x: -35, z:  -5, elite: false, hazmat: false },
      { x: -35, z:   5, elite: false, hazmat: false },
      /* Control room area: 3 elite guards protecting boss */
      { x:  33, z:  15, elite: true,  hazmat: false },
      { x:  37, z:  15, elite: true,  hazmat: false },
      { x:  35, z:  20, elite: true,  hazmat: false },
      /* Additional perimeter */
      { x:   0, z: -40, elite: false, hazmat: false }
    ];

    for (var i = 0; i < spawnData.length; i++) {
      var sd    = spawnData[i];
      var col   = sd.elite ? COL_ELITE : (sd.hazmat ? COL_ELITE : COL_GUARD);
      var hp    = sd.elite ? ELITE_GUARD_HP : GUARD_HP;
      var body  = _makeBox(0.8, 1.6, 0.5, col, sd.x, 0.8, sd.z);

      /* Helmet: gas mask cylinder */
      var helmet = _makeCyl(0.35, 0.35, 0.5, 8, sd.hazmat ? 0x33AA44 : 0x445544,
                            sd.x, 1.8, sd.z);

      _guards.push({
        mesh:          body,
        helmetMesh:    helmet,
        x:             sd.x,
        y:             0.8,
        z:             sd.z,
        hp:            hp,
        maxHp:         hp,
        alive:         true,
        isElite:       sd.elite,
        isHazmat:      sd.hazmat,
        patrolCx:      sd.x,
        patrolCz:      sd.z,
        patrolAngle:   Math.random() * Math.PI * 2,
        attackCooldown: 0,
        alertTimer:    0,
        alerted:       false
      });
    }
  }

  /* ── Place Boss ─────────────────────────────────────────────────────────── */
  function _spawnBoss() {
    var bx = 35, bz = 19;
    var body = _makeBox(1.0, 2.0, 0.7, COL_BOSS, bx, 1.0, bz);
    /* Hazmat helmet: cylinder */
    var hHelmet = _makeCyl(0.5, 0.5, 0.7, 8, 0x44AA44, bx, 2.35, bz);
    /* Hazmat visor: box */
    var visor   = _makeBox(0.6, 0.25, 0.15, 0x88FFAA, bx, 2.3, bz - 0.4);
    _boss = {
      mesh:          body,
      helmetMesh:    hHelmet,
      visorMesh:     visor,
      x:             bx,
      y:             1.0,
      z:             bz,
      hp:            BOSS_HP,
      alive:         true,
      sprayCooldown: 0,
      moveDir:       { x: 0, z: 0 },
      moveTimer:     0
    };
    _meshes.push(hHelmet);
    _meshes.push(visor);
  }

  /* ── Place Canisters ────────────────────────────────────────────────────── */
  function _spawnCanisters() {
    /* 2 in injection room */
    var c1 = _makeCyl(0.25, 0.25, 0.9, 8, COL_CANISTER, 33, 0.45, -22);
    var c2 = _makeCyl(0.25, 0.25, 0.9, 8, COL_CANISTER, 37, 0.45, -22);
    /* 1 on catwalk above tank 2 */
    var c3 = _makeCyl(0.25, 0.25, 0.9, 8, COL_CANISTER, 10, 11.6,  0);
    /* 1 in tunnel */
    var c4 = _makeCyl(0.25, 0.25, 0.9, 8, COL_CANISTER, -35, -0.05, 2);

    /* Glow around canisters */
    _addLight(COL_CANISTER, 0.8, 33, 1, -22, 5);
    _addLight(COL_CANISTER, 0.8, 37, 1, -22, 5);
    _addLight(COL_CANISTER, 0.8, 10, 12,  0, 5);
    _addLight(COL_CANISTER, 0.6, -35, 0.5, 2, 5);

    _canisters.push(
      { mesh: c1, x: 33,  y: 0.45, z: -22, neutralized: false, holdTimer: 0 },
      { mesh: c2, x: 37,  y: 0.45, z: -22, neutralized: false, holdTimer: 0 },
      { mesh: c3, x: 10,  y: 11.6, z:   0, neutralized: false, holdTimer: 0 },
      { mesh: c4, x: -35, y:-0.05, z:   2, neutralized: false, holdTimer: 0 }
    );
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    /* Remove any existing HUD */
    var old = document.getElementById('wc-hud-root');
    if (old) old.parentNode.removeChild(old);

    var root = document.createElement('div');
    root.id = 'wc-hud-root';
    root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9900;font-family:monospace;';
    document.body.appendChild(root);

    /* Main status bar */
    _hudEl = document.createElement('div');
    _hudEl.style.cssText = [
      'position:absolute',
      'top:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,10,0.82)',
      'color:#88FF88',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #336633',
      'border-radius:3px',
      'letter-spacing:0.05em',
      'white-space:nowrap'
    ].join(';');
    root.appendChild(_hudEl);

    /* HP bar */
    _hpBarEl = document.createElement('div');
    _hpBarEl.style.cssText = [
      'position:absolute',
      'bottom:40px',
      'left:20px',
      'width:200px',
      'height:14px',
      'background:#111',
      'border:1px solid #336633',
      'border-radius:2px'
    ].join(';');
    root.appendChild(_hpBarEl);

    _hpFillEl = document.createElement('div');
    _hpFillEl.style.cssText = [
      'height:100%',
      'background:#44CC44',
      'width:100%',
      'transition:width 0.1s',
      'border-radius:2px'
    ].join(';');
    _hpBarEl.appendChild(_hpFillEl);

    /* Interact bar */
    _interactBarEl = document.createElement('div');
    _interactBarEl.style.cssText = [
      'position:absolute',
      'bottom:70px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:220px',
      'height:10px',
      'background:#111',
      'border:1px solid #88FF44',
      'border-radius:2px',
      'display:none'
    ].join(';');
    root.appendChild(_interactBarEl);

    _interactFillEl = document.createElement('div');
    _interactFillEl.style.cssText = 'height:100%;background:#88FF44;width:0%;transition:width 0.1s;border-radius:2px;';
    _interactBarEl.appendChild(_interactFillEl);

    /* Crosshair */
    _crosshairEl = document.createElement('div');
    _crosshairEl.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#88FF88',
      'font-size:18px',
      'line-height:1',
      'text-shadow:0 0 4px #44FF44'
    ].join(';');
    _crosshairEl.textContent = '+';
    root.appendChild(_crosshairEl);

    /* Message display */
    _msgEl = document.createElement('div');
    _msgEl.style.cssText = [
      'position:absolute',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#CCFFCC',
      'font-size:15px',
      'text-align:center',
      'text-shadow:0 0 6px #44FF44',
      'opacity:0',
      'transition:opacity 0.4s'
    ].join(';');
    root.appendChild(_msgEl);

    /* Mask warning */
    _maskWarningEl = document.createElement('div');
    _maskWarningEl.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-60px)',
      'color:#FF4444',
      'font-size:16px',
      'font-weight:bold',
      'text-shadow:0 0 8px #FF2222',
      'display:none'
    ].join(';');
    _maskWarningEl.textContent = '! TOXIC GAS — EQUIP MASK [M] !';
    root.appendChild(_maskWarningEl);

    /* Hit flash vignette */
    _hitFlashEl = document.createElement('div');
    _hitFlashEl.style.cssText = [
      'position:absolute',
      'inset:0',
      'pointer-events:none',
      'opacity:0',
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(200,20,20,0.55) 100%)',
      'transition:opacity 0.15s'
    ].join(';');
    root.appendChild(_hitFlashEl);

    /* Overlay for win/lose */
    _overlayEl = document.createElement('div');
    _overlayEl.style.cssText = [
      'position:absolute',
      'inset:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column',
      'background:rgba(0,15,5,0.85)',
      'color:#88FF88',
      'font-size:28px',
      'text-align:center',
      'display:none'
    ].join(';');
    root.appendChild(_overlayEl);

    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var neutralized = 0;
    for (var i = 0; i < _canisters.length; i++) {
      if (_canisters[i].neutralized) neutralized++;
    }
    var guardsAlive = 0;
    for (var j = 0; j < _guards.length; j++) {
      if (_guards[j].alive) guardsAlive++;
    }
    var mm  = Math.floor(_timer / 60);
    var ss  = Math.floor(_timer % 60);
    var ssStr = ss < 10 ? '0' + ss : '' + ss;
    var chemistStr = (_boss && _boss.alive) ? 'ACTIVE' : 'ELIMINATED';
    var sysStr = (_console && _console.flushed) ? 'FLUSHED' : 'ARMED';
    _hudEl.textContent = 'WATER CRISIS [CANISTERS: ' + neutralized + '/4]'
      + '  [TIMER: ' + mm + ':' + ssStr + ']'
      + '  [GUARDS: ' + guardsAlive + ']'
      + '  [CHEMIST: ' + chemistStr + ']'
      + '  [SYSTEM: ' + sysStr + ']';

    /* HP bar */
    var hpPct = Math.max(0, _playerHP / PLAYER_MAX_HP * 100);
    _hpFillEl.style.width = hpPct + '%';
    _hpFillEl.style.background = hpPct > 50 ? '#44CC44' : (hpPct > 25 ? '#CCAA22' : '#CC2222');
  }

  function _removeHUD() {
    var root = document.getElementById('wc-hud-root');
    if (root) root.parentNode.removeChild(root);
    _hudEl = null;
  }

  /* ── Keyboard / Mouse ───────────────────────────────────────────────────── */
  var _boundKeyDown   = null;
  var _boundKeyUp     = null;
  var _boundMouseMove = null;
  var _boundMouseDown = null;
  var _boundClick     = null;
  var _pointerLocked  = false;
  var _keysBoundGame  = false;

  function _bindGameKeys() {
    if (_keysBoundGame) return;
    _keysBoundGame = true;

    _boundKeyDown = function (e) {
      _keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (_playerOnGround) {
          _playerVel.y = JUMP_VELOCITY;
          _playerOnGround = false;
        }
      }
      if (e.code === 'KeyE') {
        _eHeld = true;
      }
      if (e.code === 'KeyM') {
        _hasMask = !_hasMask;
        _showMsg(_hasMask ? 'Gas mask equipped' : 'Gas mask removed', 2);
      }
      if (e.code === 'KeyF') {
        /* Shoot pressurized pipe / interact instant-shoot */
        _tryShootPipe();
      }
    };
    _boundKeyUp = function (e) {
      _keys[e.code] = false;
      if (e.code === 'KeyE') {
        _eHeld = false;
        /* Reset active interact hold */
        if (_interactTarget) {
          _interactTarget.holdTimer = 0;
        }
        _interactBarEl.style.display = 'none';
      }
    };
    _boundMouseMove = function (e) {
      if (!_pointerLocked) return;
      _yaw   -= e.movementX * CAMERA_SENS;
      _pitch -= e.movementY * CAMERA_SENS;
      _pitch  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, _pitch));
    };
    _boundMouseDown = function (e) {
      if (!_pointerLocked) return;
      if (e.button === 0) {
        _shoot();
      }
    };
    _boundClick = function () {
      if (!_active) return;
      if (!_pointerLocked) {
        document.body.requestPointerLock();
      }
    };

    document.addEventListener('keydown', _boundKeyDown);
    document.addEventListener('keyup',   _boundKeyUp);
    document.addEventListener('mousemove', _boundMouseMove);
    document.addEventListener('mousedown', _boundMouseDown);
    document.addEventListener('click',     _boundClick);
    document.addEventListener('pointerlockchange', function () {
      _pointerLocked = (document.pointerLockElement === document.body);
    });
  }

  function _unbindGameKeys() {
    if (!_keysBoundGame) return;
    if (_boundKeyDown)   document.removeEventListener('keydown',    _boundKeyDown);
    if (_boundKeyUp)     document.removeEventListener('keyup',      _boundKeyUp);
    if (_boundMouseMove) document.removeEventListener('mousemove',  _boundMouseMove);
    if (_boundMouseDown) document.removeEventListener('mousedown',  _boundMouseDown);
    if (_boundClick)     document.removeEventListener('click',      _boundClick);
    _keysBoundGame = false;
  }

  /* ── Shooting ───────────────────────────────────────────────────────────── */
  function _shoot() {
    if (!_active || _missionOver) return;
    if (_shootCooldown > 0) return;
    _shootCooldown = SHOOT_COOLDOWN;

    var dir = _getCameraDir();
    var px  = _playerPos.x, py = _playerPos.y + 0.3, pz = _playerPos.z;

    /* Check guards */
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      var hit = _rayHitsBox(px, py, pz, dir, g.x, g.y, g.z, 0.8, 1.6, 0.5, SHOOT_RANGE);
      if (hit) {
        _damageGuard(g, SHOOT_DAMAGE);
        _showHitFlash();
        return;
      }
    }

    /* Check boss */
    if (_boss && _boss.alive) {
      var bHit = _rayHitsBox(px, py, pz, dir, _boss.x, _boss.y, _boss.z, 1.0, 2.0, 0.7, SHOOT_RANGE);
      if (bHit) {
        _damageBoss(SHOOT_DAMAGE);
        _showHitFlash();
        return;
      }
    }

    /* Check drums */
    for (var d = 0; d < _drums.length; d++) {
      var drum = _drums[d];
      if (drum.exploded) continue;
      var dHit = _rayHitsBox(px, py, pz, dir, drum.x, drum.y, drum.z, 1, 1.2, 1, SHOOT_RANGE);
      if (dHit) {
        _explodeDrum(drum);
        return;
      }
    }
  }

  function _tryShootPipe() {
    if (!_active || _missionOver) return;
    for (var i = 0; i < _pipes.length; i++) {
      var pipe = _pipes[i];
      if (pipe.shot) continue;
      var d = _dist2(_playerPos.x, _playerPos.z, pipe.x, pipe.z);
      if (d < 6) {
        pipe.shot = true;
        pipe.mesh.material.color.setHex(0x88BBFF);
        _createWaterJet(pipe);
        _showMsg('Pipe ruptured — water jet active!', 3);
        return;
      }
    }
  }

  function _getCameraDir() {
    /* Forward vector from yaw/pitch */
    var cx = Math.sin(_yaw) * Math.cos(_pitch);
    var cy = Math.sin(-_pitch);
    var cz = -Math.cos(_yaw) * Math.cos(_pitch);
    return { x: cx, y: cy, z: cz };
  }

  function _rayHitsBox(ox, oy, oz, dir, bx, by, bz, w, h, d, maxDist) {
    /* Slab method AABB ray intersection */
    var hx = w / 2, hy = h / 2, hz = d / 2;
    var mnx = (bx - hx - ox) / dir.x, mxx = (bx + hx - ox) / dir.x;
    var mny = (by - hy - oy) / dir.y, mxy = (by + hy - oy) / dir.y;
    var mnz = (bz - hz - oz) / dir.z, mxz = (bz + hz - oz) / dir.z;
    if (dir.x === 0) { if (ox < bx - hx || ox > bx + hx) return false; mnx = -Infinity; mxx = Infinity; }
    if (dir.y === 0) { if (oy < by - hy || oy > by + hy) return false; mny = -Infinity; mxy = Infinity; }
    if (dir.z === 0) { if (oz < bz - hz || oz > bz + hz) return false; mnz = -Infinity; mxz = Infinity; }
    var tmin = Math.max(Math.min(mnx, mxx), Math.min(mny, mxy), Math.min(mnz, mxz));
    var tmax = Math.min(Math.max(mnx, mxx), Math.max(mny, mxy), Math.max(mnz, mxz));
    return tmax >= 0 && tmin <= tmax && tmin <= maxDist;
  }

  function _showHitFlash() {
    _hitFlashEl.style.opacity = '0.5';
    _hitFlashTimer = 0.12;
  }

  /* ── Damage functions ───────────────────────────────────────────────────── */
  function _damageGuard(g, dmg) {
    g.hp -= dmg;
    if (g.hp <= 0) {
      g.alive = false;
      g.mesh.position.y = 0.2;
      g.helmetMesh.visible = false;
      g.mesh.material.color.setHex(0x222222);
      _checkAllCanisters();
    } else {
      g.alerted = true;
      g.alertTimer = 10;
    }
  }

  function _damageBoss(dmg) {
    if (!_boss || !_boss.alive) return;
    _boss.hp -= dmg;
    if (_boss.hp <= 0) {
      _boss.alive = false;
      _boss.mesh.position.y = 0.3;
      _boss.mesh.material.color.setHex(0x222222);
      _boss.helmetMesh.visible = false;
      _boss.visorMesh.visible  = false;
      _showMsg('CHEMIST ELIMINATED — reach the control room!', 4);
    }
  }

  function _damagePlayer(dmg) {
    _playerHP -= dmg;
    _hitFlashEl.style.opacity = '0.6';
    _hitFlashTimer = 0.25;
    if (_playerHP <= 0) {
      _playerHP = 0;
      _endMission(false, 'You have been eliminated.');
    }
  }

  function _explodeDrum(drum) {
    drum.exploded = true;
    drum.mesh.material.color.setHex(0xFF4400);

    /* AoE damage to guards */
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      var dist = _dist2(g.x, g.z, drum.x, drum.z);
      if (dist < DRUM_EXPLOSION_RADIUS) {
        _damageGuard(g, DRUM_EXPLOSION_DAMAGE);
      }
    }
    /* Boss */
    if (_boss && _boss.alive) {
      var bd = _dist2(_boss.x, _boss.z, drum.x, drum.z);
      if (bd < DRUM_EXPLOSION_RADIUS) _damageBoss(DRUM_EXPLOSION_DAMAGE);
    }
    /* Player */
    var pd = _dist2(_playerPos.x, _playerPos.z, drum.x, drum.z);
    if (pd < DRUM_EXPLOSION_RADIUS) _damagePlayer(DRUM_EXPLOSION_DAMAGE * 0.5);

    /* Temporary cloud light */
    var eLight = _addLight(0xFF6600, 2, drum.x, drum.y + 2, drum.z, 15);
    /* Fade it out */
    var fadeStart = Date.now();
    var fadeInterval = setInterval(function () {
      var elapsed = (Date.now() - fadeStart) / 1000;
      eLight.intensity = Math.max(0, 2 - elapsed * 2);
      if (elapsed > 1) clearInterval(fadeInterval);
    }, 50);

    _showMsg('DRUM EXPLODED!', 2);
  }

  /* ── Water jet ──────────────────────────────────────────────────────────── */
  function _createWaterJet(pipe) {
    var dir = pipe.vertical ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    var mesh = _makeBox(0.4, 0.4, 6, COL_WATER, pipe.x + dir.x * 3, pipe.y + dir.y * 3, pipe.z + dir.z * 3);
    mesh.material.transparent = true;
    mesh.material.opacity = 0.7;
    _waterJets.push({ mesh: mesh, dir: dir, x: pipe.x, y: pipe.y, z: pipe.z, life: 8, pipe: pipe });
    _addLight(COL_WATER, 0.5, pipe.x, pipe.y + 1, pipe.z, 8);
  }

  function _updateWaterJets(dt) {
    for (var i = _waterJets.length - 1; i >= 0; i--) {
      var jet = _waterJets[i];
      jet.life -= dt;
      if (jet.life <= 0) {
        _scene.remove(jet.mesh);
        _waterJets.splice(i, 1);
        continue;
      }
      /* Knock back guards in range */
      for (var j = 0; j < _guards.length; j++) {
        var g = _guards[j];
        if (!g.alive) continue;
        var dist = _dist2(g.x, g.z, jet.x + jet.dir.x * 3, jet.z + jet.dir.z * 3);
        if (dist < 3) {
          g.x += jet.dir.x * PIPE_KNOCKBACK * dt;
          g.z += jet.dir.z * PIPE_KNOCKBACK * dt;
          g.mesh.position.x = g.x;
          g.mesh.position.z = g.z;
          g.helmetMesh.position.x = g.x;
          g.helmetMesh.position.z = g.z;
        }
      }
    }
  }

  /* ── Chemical cloud ─────────────────────────────────────────────────────── */
  function _spawnChemCloud() {
    _chemCloud = _addLight(COL_CANISTER, 0.6, 30, 2, -15, 20);
    /* Visible mesh for cloud */
    _chemCloudMesh = _makeSphere(5, 8, COL_CANISTER, 30, 2, -15);
    _chemCloudMesh.material.transparent = true;
    _chemCloudMesh.material.opacity = 0.18;
    _showMsg('! CHEMICAL LEAK DETECTED — Equip gas mask [M] !', 5);
    _maskWarningEl.style.display = 'block';
  }

  /* ── Canister / Console interaction ────────────────────────────────────── */
  function _checkAllCanisters() {
    var allDone = true;
    for (var i = 0; i < _canisters.length; i++) {
      if (!_canisters[i].neutralized) { allDone = false; break; }
    }
    if (allDone) {
      _doorLocked = false;
      if (_doorMesh) _doorMesh.material.color.setHex(0x224422);
      _showMsg('All canisters neutralized — control room unlocked!', 5);
    }
    return allDone;
  }

  function _findInteractTarget() {
    _interactTarget = null;
    var bestDist    = INTERACT_DIST;

    /* Canisters */
    for (var i = 0; i < _canisters.length; i++) {
      var c = _canisters[i];
      if (c.neutralized) continue;
      var d = _dist3(_playerPos, { x: c.x, y: c.y, z: c.z });
      if (d < bestDist) {
        bestDist       = d;
        _interactTarget = c;
        _interactTarget._type = 'canister';
        _interactTarget._totalTime = CANISTER_HOLD;
      }
    }

    /* Control console */
    if (_console && !_console.flushed) {
      var cd = _dist3(_playerPos, { x: _console.x, y: _console.y, z: _console.z });
      if (cd < bestDist) {
        /* Only if all canisters neutralized and boss dead */
        var cansOk   = true;
        for (var j = 0; j < _canisters.length; j++) {
          if (!_canisters[j].neutralized) { cansOk = false; break; }
        }
        var bossOk = !_boss || !_boss.alive;
        if (!_doorLocked && cansOk && bossOk) {
          bestDist        = cd;
          _interactTarget = _console;
          _interactTarget._type = 'console';
          _interactTarget._totalTime = CONSOLE_HOLD;
        }
      }
    }
  }

  function _updateInteraction(dt) {
    _findInteractTarget();

    if (!_interactTarget || !_eHeld) {
      /* Fade bar out */
      _interactBarEl.style.display = 'none';
      if (_interactTarget) {
        /* Show hint */
        var hint = (_interactTarget._type === 'canister') ?
          '[E] Neutralize canister' :
          '[E] Flush system';
        _msgEl.textContent = hint;
        _msgEl.style.opacity = '1';
        _msgTimer = 0.2;
      }
      return;
    }

    /* Holding E on a target */
    _interactBarEl.style.display = 'block';
    _interactTarget.holdTimer += dt;
    var pct = Math.min(100, (_interactTarget.holdTimer / _interactTarget._totalTime) * 100);
    _interactFillEl.style.width = pct + '%';

    if (_interactTarget.holdTimer >= _interactTarget._totalTime) {
      /* Completed */
      if (_interactTarget._type === 'canister') {
        _interactTarget.neutralized = true;
        _interactTarget.mesh.material.color.setHex(0x225522);
        _interactTarget.mesh.material.opacity = 0.5;
        _interactTarget.mesh.material.transparent = true;
        var n = 0;
        for (var k = 0; k < _canisters.length; k++) {
          if (_canisters[k].neutralized) n++;
        }
        _showMsg('Canister neutralized (' + n + '/4)', 3);
        _checkAllCanisters();
      } else if (_interactTarget._type === 'console') {
        _console.flushed = true;
        var conLight = document.querySelector ? null : null;
        /* Turn console green */
        _console.mesh.material.color.setHex(0x224422);
        _showMsg('SYSTEM FLUSHED — Water supply safe!', 6);
        /* Check win */
        _checkWin();
      }
      _interactBarEl.style.display = 'none';
      _interactTarget = null;
    }
  }

  function _checkWin() {
    var allCans = true;
    for (var i = 0; i < _canisters.length; i++) {
      if (!_canisters[i].neutralized) { allCans = false; break; }
    }
    var bossGone = !_boss || !_boss.alive;
    var flushed  = _console && _console.flushed;
    if (allCans && bossGone && flushed) {
      _endMission(true, 'MISSION COMPLETE\nWater supply secured.\nCity saved.');
    }
  }

  /* ── Guard AI ───────────────────────────────────────────────────────────── */
  function _updateGuards(dt) {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;

      var distToPlayer = _dist2(g.x, g.z, _playerPos.x, _playerPos.z);

      /* Alert timer */
      if (g.alertTimer > 0) {
        g.alertTimer -= dt;
        if (g.alertTimer <= 0) g.alerted = false;
      }

      /* Sight check */
      if (distToPlayer < GUARD_SIGHT_RANGE) {
        g.alerted  = true;
        g.alertTimer = 8;
      }

      if (g.alerted && distToPlayer > 0.5) {
        /* Move toward player */
        var dx = _playerPos.x - g.x;
        var dz = _playerPos.z - g.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        var spd = GUARD_MOVE_SPEED * dt;
        if (len > 0.01) {
          g.x += (dx / len) * spd;
          g.z += (dz / len) * spd;
        }

        /* Attack */
        if (distToPlayer < GUARD_ATTACK_RANGE) {
          g.attackCooldown -= dt;
          if (g.attackCooldown <= 0) {
            g.attackCooldown = 1.5;
            _damagePlayer(GUARD_DAMAGE);
          }
        }
      } else {
        /* Patrol */
        g.patrolAngle += dt * 0.6;
        g.x = g.patrolCx + Math.cos(g.patrolAngle) * PATROL_RADIUS;
        g.z = g.patrolCz + Math.sin(g.patrolAngle) * PATROL_RADIUS;
      }

      /* Update mesh */
      g.mesh.position.x = g.x;
      g.mesh.position.z = g.z;
      g.helmetMesh.position.x = g.x;
      g.helmetMesh.position.z = g.z;
    }
  }

  /* ── Boss AI ────────────────────────────────────────────────────────────── */
  function _updateBoss(dt) {
    if (!_boss || !_boss.alive) return;

    var distToPlayer = _dist2(_boss.x, _boss.z, _playerPos.x, _playerPos.z);

    /* Move toward player */
    _boss.moveTimer -= dt;
    if (_boss.moveTimer <= 0) {
      _boss.moveTimer = 1.5;
      var dx = _playerPos.x - _boss.x;
      var dz = _playerPos.z - _boss.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0.01) {
        _boss.moveDir.x = dx / len;
        _boss.moveDir.z = dz / len;
      }
    }

    if (distToPlayer > 2) {
      var bspd = 2.5 * dt;
      _boss.x += _boss.moveDir.x * bspd;
      _boss.z += _boss.moveDir.z * bspd;
    }

    /* Chemical spray attack */
    _boss.sprayCooldown -= dt;
    if (_boss.sprayCooldown <= 0 && distToPlayer < 10) {
      _boss.sprayCooldown = 3.5;
      _bossSpray();
    }

    /* Update mesh */
    _boss.mesh.position.x = _boss.x;
    _boss.mesh.position.z = _boss.z;
    _boss.helmetMesh.position.x = _boss.x;
    _boss.helmetMesh.position.z = _boss.z;
    _boss.visorMesh.position.x  = _boss.x;
    _boss.visorMesh.position.z  = _boss.z;
  }

  function _bossSpray() {
    /* ConeGeometry spray projectile */
    var sprayMesh = _makeMesh(
      new THREE.ConeGeometry(1.5, 4, 6),
      COL_SPRAY,
      _boss.x, _boss.y + 0.5, _boss.z - 2
    );
    sprayMesh.material.transparent = true;
    sprayMesh.material.opacity = 0.55;
    sprayMesh.rotation.x = Math.PI / 2;
    _sprayMeshes.push({ mesh: sprayMesh, life: 1.5, x: _boss.x, z: _boss.z });

    /* Damage player if near */
    var d = _dist2(_playerPos.x, _playerPos.z, _boss.x, _boss.z);
    if (d < 8 && !_hasMask) {
      _damagePlayer(BOSS_SPRAY_DAMAGE);
      _showMsg('Hit by chemical spray!', 1.5);
    }
  }

  function _updateSprayMeshes(dt) {
    for (var i = _sprayMeshes.length - 1; i >= 0; i--) {
      var s = _sprayMeshes[i];
      s.life -= dt;
      s.mesh.material.opacity = Math.max(0, s.life / 1.5 * 0.55);
      if (s.life <= 0) {
        _scene.remove(s.mesh);
        _sprayMeshes.splice(i, 1);
      }
    }
  }

  /* ── Player movement & physics ──────────────────────────────────────────── */
  function _updatePlayer(dt) {
    if (_missionOver) return;

    /* Movement direction from keys */
    var moveX = 0, moveZ = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    { moveZ -= 1; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { moveZ += 1; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX -= 1; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { moveX += 1; }

    /* Rotate movement by yaw */
    var cos = Math.cos(_yaw), sin = Math.sin(_yaw);
    var worldX = moveX * cos - moveZ * sin;
    var worldZ = moveX * sin + moveZ * cos;
    var len = Math.sqrt(worldX * worldX + worldZ * worldZ);
    if (len > 0) { worldX /= len; worldZ /= len; }

    _playerPos.x += worldX * PLAYER_SPEED * dt;
    _playerPos.z += worldZ * PLAYER_SPEED * dt;

    /* Boundary */
    _playerPos.x = Math.max(-54, Math.min(54, _playerPos.x));
    _playerPos.z = Math.max(-54, Math.min(54, _playerPos.z));

    /* Gravity */
    _prevPlayerY = _playerPos.y;
    _playerVel.y += GRAVITY * dt;
    _playerPos.y  += _playerVel.y * dt;

    /* Ground plane */
    var groundY = PLAYER_HEIGHT;
    /* Check if on catwalk */
    for (var i = 0; i < _catwalks.length; i++) {
      var cw = _catwalks[i];
      if (Math.abs(_playerPos.x - 10) < 11 && Math.abs(_playerPos.z) < 1.5) {
        if (_playerPos.y <= cw.y + PLAYER_HEIGHT && _prevPlayerY >= cw.y + PLAYER_HEIGHT - 0.5) {
          groundY = cw.y + PLAYER_HEIGHT;
        }
      }
    }

    if (_playerPos.y <= groundY) {
      var fallDist = _prevPlayerY - groundY;
      if (fallDist > FALL_DAMAGE_THRESH) {
        _damagePlayer(Math.floor((fallDist - FALL_DAMAGE_THRESH) * 8));
        _showMsg('Fall damage!', 1.5);
      }
      _playerPos.y = groundY;
      _playerVel.y = 0;
      _playerOnGround = true;
    } else {
      _playerOnGround = false;
    }

    /* Tunnel — allow going below ground in tunnel area */
    if (_playerPos.x < -28 && _playerPos.x > -42) {
      /* Tunnel ground level */
      if (_playerPos.y < 0.5 && _playerPos.y > -2) {
        /* fine — in tunnel */
      }
    }

    /* Update camera */
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 0.3, _playerPos.z);
      _camera.rotation.set(0, 0, 0);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y = _yaw;
      _camera.rotation.x = _pitch;
    }
  }

  /* ── Chemical hazard ────────────────────────────────────────────────────── */
  function _updateChemHazard(dt) {
    if (!_chemLeakActive) return;
    if (_hasMask) {
      _maskWarningEl.style.display = 'none';
      return;
    }
    /* Check if player in cloud radius */
    var dist = _dist2(_playerPos.x, _playerPos.z, 30, -15);
    if (dist < 20) {
      _damagePlayer(CHEM_DAMAGE_RATE * dt);
      _maskWarningEl.style.display = 'block';
    } else {
      _maskWarningEl.style.display = 'none';
    }
  }

  /* ── Shoot cooldown ─────────────────────────────────────────────────────── */
  function _updateShootCooldown(dt) {
    if (_shootCooldown > 0) _shootCooldown -= dt;
    if (_shootCooldown < 0) _shootCooldown = 0;
  }

  /* ── Hit flash ──────────────────────────────────────────────────────────── */
  function _updateHitFlash(dt) {
    if (_hitFlashTimer > 0) {
      _hitFlashTimer -= dt;
      if (_hitFlashTimer <= 0) {
        _hitFlashEl.style.opacity = '0';
      }
    }
  }

  /* ── Message fade ───────────────────────────────────────────────────────── */
  function _updateMsgFade(dt) {
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0) {
        _msgEl.style.opacity = '0';
      }
    }
  }

  /* ── End mission ────────────────────────────────────────────────────────── */
  function _endMission(won, msg) {
    if (_missionOver) return;
    _missionOver = true;
    _missionWon  = won;

    if (document.exitPointerLock) document.exitPointerLock();

    _overlayEl.style.display = 'flex';
    _overlayEl.innerHTML = '<div style="color:' + (won ? '#44FF88' : '#FF4444') + ';font-size:32px;margin-bottom:20px;">'
      + (won ? 'MISSION SUCCESS' : 'MISSION FAILED') + '</div>'
      + '<div style="color:#AAFFAA;font-size:18px;white-space:pre-line;margin-bottom:30px;">' + msg + '</div>'
      + '<div style="color:#66CC66;font-size:14px;">[Press R to restart / ESC to exit]</div>';

    document.addEventListener('keydown', function onEndKey(e) {
      if (e.code === 'KeyR') {
        document.removeEventListener('keydown', onEndKey);
        _cleanup();
        _start();
      }
      if (e.code === 'Escape') {
        document.removeEventListener('keydown', onEndKey);
        _cleanup();
        if (typeof _onComplete === 'function') _onComplete(won);
      }
    });
  }

  /* ── Cleanup ────────────────────────────────────────────────────────────── */
  function _cleanup() {
    _active = false;
    /* Remove all meshes */
    for (var i = 0; i < _meshes.length; i++) {
      _scene.remove(_meshes[i]);
      if (_meshes[i].geometry) _meshes[i].geometry.dispose();
      if (_meshes[i].material) _meshes[i].material.dispose();
    }
    _meshes = [];
    /* Remove all lights */
    for (var j = 0; j < _lights.length; j++) {
      _scene.remove(_lights[j]);
    }
    _lights = [];
    /* Remove HUD */
    _removeHUD();
    /* Unbind keys */
    _unbindGameKeys();
    /* Reset state */
    _guards      = [];
    _canisters   = [];
    _drums       = [];
    _pipes       = [];
    _waterJets   = [];
    _sprayMeshes = [];
    _catwalks    = [];
    _boss        = null;
    _console     = null;
    _valve       = null;
    _doorMesh    = null;
    _chemCloud   = null;
    _chemCloudMesh = null;
    _doorLocked  = true;
    _hasMask     = false;
    _chemLeakActive = false;
  }

  /* ── Start ──────────────────────────────────────────────────────────────── */
  function _start() {
    _active      = true;
    _missionOver = false;
    _missionWon  = false;
    _timer       = MISSION_DURATION;
    _playerPos   = { x: 0, y: PLAYER_HEIGHT, z: 45 };
    _playerVel   = { x: 0, y: 0, z: 0 };
    _playerHP    = PLAYER_MAX_HP;
    _playerOnGround = true;
    _hasMask     = false;
    _chemLeakActive = false;
    _shootCooldown = 0;
    _yaw         = Math.PI;  /* facing into the facility */
    _pitch       = 0;
    _keys        = {};
    _eHeld       = false;
    _interactTarget = null;
    _doorLocked  = true;

    _buildScene();
    _spawnGuards();
    _spawnBoss();
    _spawnCanisters();
    _buildHUD();
    _bindGameKeys();

    /* Request pointer lock */
    if (document.body.requestPointerLock) {
      document.body.requestPointerLock();
    }

    _showMsg('Infiltrate the water treatment plant. Stop the attack!', 5);
  }

  /* ── Activation key tracking ────────────────────────────────────────────── */
  var _activationBound = false;
  function _bindActivation() {
    if (_activationBound) return;
    _activationBound = true;
    document.addEventListener('keydown', function (e) {
      var now = performance.now() / 1000;
      if (e.code === 'KeyW') { _wPressed = true; _wTime = now; }
      if (e.code === 'KeyT') { _tPressed = true; _tTime = now; }
      if (_wPressed && _tPressed && Math.abs(_wTime - _tTime) <= KEY_WINDOW) {
        if (!_active) {
          _wPressed = false;
          _tPressed = false;
          _start();
        }
      }
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyW') _wPressed = false;
      if (e.code === 'KeyT') _tPressed = false;
    });
  }

  /* ── Public: init ───────────────────────────────────────────────────────── */
  function init(scene, camera, renderer, onComplete) {
    _scene      = scene;
    _camera     = camera;
    _renderer   = renderer;
    _onComplete = onComplete || null;
    _bindActivation();
  }

  /* ── Public: update (called each frame) ─────────────────────────────────── */
  function update(dt) {
    if (!_active || _missionOver) return;

    /* Safety clamp */
    if (dt > 0.1) dt = 0.1;

    /* Countdown timer */
    _timer -= dt;
    if (_timer <= 0) {
      _timer = 0;
      var allCans = true;
      for (var i = 0; i < _canisters.length; i++) {
        if (!_canisters[i].neutralized) { allCans = false; break; }
      }
      if (!allCans || (_boss && _boss.alive) || !(_console && _console.flushed)) {
        _endMission(false, 'Time expired.\nNerve agent reaches city water supply.\nMission failed.');
        return;
      }
    }

    /* Chemical leak triggers at 4-min mark */
    if (_timer <= (MISSION_DURATION - CHEM_LEAK_TIME) && !_chemLeakActive) {
      _chemLeakActive = true;
      _spawnChemCloud();
    }

    _updatePlayer(dt);
    _updateGuards(dt);
    _updateBoss(dt);
    _updateSprayMeshes(dt);
    _updateWaterJets(dt);
    _updateChemHazard(dt);
    _updateInteraction(dt);
    _updateShootCooldown(dt);
    _updateHitFlash(dt);
    _updateMsgFade(dt);
    _updateHUD();
  }

  /* ── Public: reset ──────────────────────────────────────────────────────── */
  function reset() {
    if (_active) _cleanup();
  }

  /* ── Bootstrap activation binding ──────────────────────────────────────── */
  _bindActivation();

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
