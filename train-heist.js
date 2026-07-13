/* ───────────────────────────────────────────────────────────────────────────
   train-heist.js — Train Heist FPS Module
   API: window.TrainHeist = { init, update, reset }
   Controls:
     T + H (simultaneous, 400ms window) → activate module
     W / S                              → move forward / backward along train
     A / D                              → strafe left / right
     Mouse                              → look / aim
     Left Click                         → shoot
     E                                  → pick up gold crate / transfer to heli
     R                                  → interact with brake controls
   ─────────────────────────────────────────────────────────────────────────── */

window.TrainHeist = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var ACTIVATE_WINDOW       = 0.4;       // seconds
  var MISSION_TIME          = 480;       // 8 minutes in seconds
  var HELI_DEPART_TIME      = 480;       // 8 minutes
  var CAR_WIDTH             = 3;
  var CAR_SPACING           = 16;        // gap between car centres
  var NUM_CARS              = 12;
  var GUARD_HP              = 80;
  var ELITE_HP              = 120;
  var COMMANDER_HP          = 250;
  var PLAYER_HP             = 100;
  var PLAYER_SPEED          = 6;
  var PLAYER_HEIGHT         = 1.7;
  var SHOOT_RANGE           = 50;
  var SHOOT_DAMAGE          = 30;
  var INTERACT_RANGE        = 2.8;
  var CRATE_SLOW            = 0.75;      // 25% movement penalty when carrying
  var TRAIN_SPEED_KMH       = 120;
  var SCROLL_RATE           = 0.08;
  var TREE_COUNT            = 100;
  var TUNNEL_INTERVAL       = 120;       // every 2 min
  var TUNNEL_DURATION       = 10;        // 10 seconds
  var BRIDGE_TIME           = 240;       // 4 min mark
  var BRAKE_TIME            = 360;       // 6 min mark
  var BRAKE_PENALTY         = 45;        // seconds added to extraction delay
  var GRENADE_FUSE          = 2.5;
  var GRENADE_DAMAGE        = 70;
  var GRENADE_RADIUS        = 5.5;
  var RESPAWN_HP            = 60;

  /* ── Colors ─────────────────────────────────────────────────────────────── */
  var COL_FLATBED           = 0x556655;
  var COL_FREIGHT           = 0x665544;
  var COL_ARMORED           = 0x445544;
  var COL_CONTROL           = 0x445566;
  var COL_VAULT             = 0x334433;
  var COL_LOUNGE            = 0x445544;
  var COL_REAR              = 0x334444;
  var COL_GUARD             = 0x334444;
  var COL_ELITE_GUARD       = 0x223333;
  var COL_COMMANDER         = 0x221122;
  var COL_GOLD_CRATE        = 0x997722;
  var COL_TRACK             = 0x444444;
  var COL_GROUND            = 0x5A6B40;
  var COL_MOUNTAIN          = 0x7A7060;
  var COL_TREE_TRUNK        = 0x5C4033;
  var COL_TREE_LEAF         = 0x2D6A2D;
  var COL_HELIPAD           = 0xCCCC00;
  var COL_HELICOPTER        = 0x228833;
  var COL_SKY               = 0x6699CC;
  var COL_GUN               = 0x1A1A1A;
  var COL_WHEEL             = 0x222222;
  var COL_BRAKE_LEVER       = 0xFF4400;
  var COL_RAIL              = 0x555555;

  /* ── Activation keys ────────────────────────────────────────────────────── */
  var _keyPressTime         = { T: 0, H: 0 };
  var _keys                 = {};
  var _keysAdded            = false;
  var _mouseX               = 0;
  var _mouseY               = 0;
  var _mouseLocked          = false;
  var _mouseAdded           = false;

  /* ── Scene refs ─────────────────────────────────────────────────────────── */
  var _scene                = null;
  var _camera               = null;
  var _renderer             = null;

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _active               = false;
  var _gameOver             = false;
  var _won                  = false;
  var _timer                = MISSION_TIME;
  var _lastTime             = 0;

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _playerPos            = null;
  var _playerHP             = PLAYER_HP;
  var _yaw                  = 0;
  var _pitch                = 0;
  var _currentCar           = 0;         // 0-indexed (0=flatbed front)
  var _carryingCrate        = false;
  var _carriedCrateIndex    = -1;
  var _respawnCar           = 0;
  var _lives                = 1;
  var _brakeActivated       = false;
  var _brakeEventTriggered  = false;
  var _brakeEventHandled    = false;
  var _trainSpeedMod        = 1.0;

  /* ── Train ──────────────────────────────────────────────────────────────── */
  var _trainRoot            = null;
  var _trackOffset          = 0;
  var _rails                = [];
  var _trees                = [];
  var _mountains            = [];
  var _sceneryRoot          = null;

  /* ── Cars ───────────────────────────────────────────────────────────────── */
  var _cars                 = [];
  /*
    Each car: {
      index, type, group, wallMesh,
      length, height,
      guards: [],
      crates: [],
      hasBrakeControl: bool,
      isHelipad: bool
    }
  */

  /* ── Guards ─────────────────────────────────────────────────────────────── */
  var _guards               = [];
  /*
    Each: {
      mesh, group, hp, alive, carIndex, isElite, isCommander,
      patrolDir, patrolTimer, alertTimer, alertState,
      pos: THREE.Vector3,
      useCover: bool, coverPos: THREE.Vector3
    }
  */
  var _commanderAlive       = true;
  var _totalGuards          = 0;
  var _guardsRemaining      = 0;

  /* ── Gold crates ────────────────────────────────────────────────────────── */
  var _crates               = [];
  /*
    Each: {
      mesh, light, pos: THREE.Vector3,
      secured: bool, transferred: bool, carIndex: int, group
    }
  */
  var _goldTransferred      = 0;

  /* ── Tunnel / bridge state ──────────────────────────────────────────────── */
  var _tunnelTimer          = 0;
  var _inTunnel             = false;
  var _nextTunnelAt         = TUNNEL_INTERVAL;
  var _bridgeActive         = false;
  var _bridgeTimer          = 0;

  /* ── Helicopter state ───────────────────────────────────────────────────── */
  var _heliMesh             = null;
  var _heliState            = 'INBOUND';   // INBOUND / WAITING / DEPARTED
  var _heliArrivalTime      = 30;          // arrives at T+30s
  var _heliDepartTime       = HELI_DEPART_TIME;
  var _heliPos              = null;
  var _heliBrakeDelay       = 0;           // extra seconds added by brake event

  /* ── Grenades ───────────────────────────────────────────────────────────── */
  var _grenades             = [];
  var _grenadeCount         = 3;

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hud                  = null;
  var _hudMsg               = null;
  var _hudMsgTimer          = 0;

  /* ── Crosshair flash ───────────────────────────────────────────────────── */
  var _hitFlash             = 0;
  var _crosshair            = null;

  /* ══════════════════════════════════════════════════════════════════════════
     UTILITY
  ══════════════════════════════════════════════════════════════════════════ */

  function getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }

  function getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }

  function getRenderer() {
    return _renderer ||
      (window.GameManager && window.GameManager.renderer) ||
      window.renderer || null;
  }

  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.emissive !== undefined) params.emissive = opts.emissive;
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
      if (opts.wireframe !== undefined) params.wireframe = opts.wireframe;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function makeBox(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function makeCyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, ws, hs, color) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function carZCenter(idx) {
    return -idx * CAR_SPACING;
  }

  function formatTime(secs) {
    var s = Math.floor(secs);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
  }

  function showMsg(text, dur) {
    if (!_hudMsg) return;
    _hudMsg.textContent = text;
    _hudMsg.style.display = 'block';
    _hudMsgTimer = dur || 2.5;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'train-heist-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFE44D',
      'background:rgba(0,0,0,0.65)',
      'font:bold 13px/1.4 monospace',
      'padding:6px 14px',
      'border-radius:4px',
      'border:1px solid #997722',
      'z-index:9999',
      'pointer-events:none',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _hudMsg = document.createElement('div');
    _hudMsg.id = 'train-heist-msg';
    _hudMsg.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFFFFF',
      'background:rgba(0,0,0,0.75)',
      'font:bold 16px/1.4 monospace',
      'padding:8px 18px',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hudMsg);

    _crosshair = document.createElement('div');
    _crosshair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px',
      'height:16px',
      'z-index:9998',
      'pointer-events:none'
    ].join(';');
    _crosshair.innerHTML = '<svg width="16" height="16"><line x1="8" y1="0" x2="8" y2="16" stroke="white" stroke-width="1.5"/><line x1="0" y1="8" x2="16" y2="8" stroke="white" stroke-width="1.5"/></svg>';
    document.body.appendChild(_crosshair);
  }

  function updateHUD() {
    if (!_hud) return;
    var heliStr = _heliState;
    if (_heliState === 'WAITING') {
      var remaining = Math.max(0, _heliDepartTime - (MISSION_TIME - _timer));
      heliStr = 'WAITING (' + Math.ceil(remaining) + 's)';
    }
    _hud.textContent = [
      'TRAIN HEIST',
      'GOLD: ' + _goldTransferred + '/3 TRANSFERRED',
      'CAR: ' + (_currentCar + 1) + '/12',
      'TIMER: ' + formatTime(_timer),
      'GUARDS: ' + _guardsRemaining,
      'SPEED: ' + Math.round(TRAIN_SPEED_KMH * _trainSpeedMod) + ' km/h',
      'HELICOPTER: ' + heliStr
    ].join('  |  ');
  }

  function removeHUD() {
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_hudMsg && _hudMsg.parentNode) _hudMsg.parentNode.removeChild(_hudMsg);
    if (_crosshair && _crosshair.parentNode) _crosshair.parentNode.removeChild(_crosshair);
    _hud = null;
    _hudMsg = null;
    _crosshair = null;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SCENE BUILDING
  ══════════════════════════════════════════════════════════════════════════ */

  function buildScene() {
    var scene = getScene();
    if (!scene) return;

    /* Sky color */
    scene.background = new THREE.Color(COL_SKY);

    /* Ambient light */
    var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    ambLight.name = 'th_ambient';
    scene.add(ambLight);

    /* Sun directional light */
    var sunLight = new THREE.DirectionalLight(0xFFF5CC, 1.0);
    sunLight.position.set(100, 200, 50);
    sunLight.name = 'th_sun';
    scene.add(sunLight);

    /* Scenery root */
    _sceneryRoot = new THREE.Group();
    _sceneryRoot.name = 'th_scenery';
    scene.add(_sceneryRoot);

    /* Ground plane */
    var groundMesh = makeBox(400, 1, 2000, COL_GROUND);
    groundMesh.position.set(0, -1, -500);
    groundMesh.name = 'th_ground';
    _sceneryRoot.add(groundMesh);

    /* Rails */
    buildRails();

    /* Mountains */
    buildMountains();

    /* Trees */
    buildTrees();

    /* Train root */
    _trainRoot = new THREE.Group();
    _trainRoot.name = 'th_train';
    scene.add(_trainRoot);

    /* Build the 12 cars */
    buildCars();

    /* Helicopter */
    buildHelicopter();

    /* Fog */
    scene.fog = new THREE.Fog(COL_SKY, 80, 300);
  }

  function buildRails() {
    var i;
    /* Two parallel rails, scrollable */
    for (i = 0; i < 2; i++) {
      var railGeo = new THREE.BoxGeometry(0.2, 0.1, 2000);
      var railMat = new THREE.MeshLambertMaterial({ color: COL_RAIL });
      var rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(i === 0 ? -0.7 : 0.7, -0.45, -500);
      rail.name = 'th_rail_' + i;
      _sceneryRoot.add(rail);
      _rails.push(rail);
    }

    /* Sleepers (cross-ties) */
    var j;
    for (j = 0; j < 100; j++) {
      var sleeperGeo = new THREE.BoxGeometry(2.0, 0.08, 0.3);
      var sleeperMat = new THREE.MeshLambertMaterial({ color: COL_TREE_TRUNK });
      var sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
      sleeper.position.set(0, -0.48, -j * 2.0);
      sleeper.name = 'th_sleeper_' + j;
      sleeper.userData.isSleeper = true;
      sleeper.userData.origZ = -j * 2.0;
      _sceneryRoot.add(sleeper);
      _rails.push(sleeper);
    }
  }

  function buildMountains() {
    var i;
    for (i = 0; i < 24; i++) {
      var h = 30 + Math.random() * 60;
      var w = 20 + Math.random() * 40;
      var mountGeo = new THREE.ConeGeometry(w, h, 6);
      var mountMat = new THREE.MeshLambertMaterial({ color: COL_MOUNTAIN });
      var mount = new THREE.Mesh(mountGeo, mountMat);
      var side = (Math.random() > 0.5 ? 1 : -1);
      mount.position.set(side * (30 + Math.random() * 80), h / 2 - 0.5, -Math.random() * 500);
      mount.name = 'th_mountain_' + i;
      _sceneryRoot.add(mount);
      _mountains.push({ mesh: mount, origZ: mount.position.z });
    }
  }

  function buildTrees() {
    var i;
    for (i = 0; i < TREE_COUNT; i++) {
      var treeGroup = new THREE.Group();
      var trunk = makeCyl(0.15, 0.2, 1.5, 6, COL_TREE_TRUNK);
      trunk.position.y = 0.75;
      treeGroup.add(trunk);
      var leaves = makeSphere(1.0, 6, 5, COL_TREE_LEAF);
      leaves.position.y = 2.0;
      treeGroup.add(leaves);
      var side = (Math.random() > 0.5 ? 1 : -1);
      var zpos = -Math.random() * 400;
      treeGroup.position.set(side * (6 + Math.random() * 25), 0, zpos);
      treeGroup.name = 'th_tree_' + i;
      _sceneryRoot.add(treeGroup);
      _trees.push({ group: treeGroup, side: side, origZ: zpos });
    }
  }

  function buildCars() {
    /*
      Car layout (0-indexed):
      0-1:   Flatbed       3×1×15  open  4 guards each
      2-3:   Covered       3×4×15        4 guards each
      4-5:   Armored       3×5×15        6 guards each
      6:     Control       3×5×12  brake 4 guards
      7-9:   Vault         3×5×15        guards + 3 crates
      10:    Lounge        3×4×12        4 off-duty guards
      11:    Rear platform 3×2×10  heli  0 guards
    */
    var i;
    for (i = 0; i < NUM_CARS; i++) {
      buildCar(i);
    }
  }

  function buildCar(idx) {
    var group = new THREE.Group();
    group.name = 'th_car_' + idx;
    _trainRoot.add(group);

    var zc = carZCenter(idx);
    var carObj = {
      index: idx,
      type: '',
      group: group,
      wallMesh: null,
      length: 15,
      height: 1,
      guards: [],
      crates: [],
      hasBrakeControl: false,
      isHelipad: false
    };

    /* Undercarriage (floor) — common to all */
    var floorH;
    var floorColor;
    var carL;

    if (idx <= 1) {
      /* Flatbed */
      carObj.type = 'flatbed';
      carL = 15;
      floorH = 1;
      floorColor = COL_FLATBED;
      carObj.length = carL;
      carObj.height = floorH;

      var flatFloor = makeBox(CAR_WIDTH, floorH, carL, floorColor);
      flatFloor.position.set(0, 0, zc);
      group.add(flatFloor);

      /* Wheel bogeys */
      addWheels(group, zc, carL);

      /* 4 guards per flatbed */
      addGuards(group, idx, 4, false, false, zc, carL, floorH);

    } else if (idx <= 3) {
      /* Covered freight */
      carObj.type = 'freight';
      carL = 15;
      floorH = 4;
      floorColor = COL_FREIGHT;
      carObj.length = carL;
      carObj.height = floorH;

      var frtBox = makeBox(CAR_WIDTH, floorH, carL, floorColor);
      frtBox.position.set(0, floorH / 2, zc);
      group.add(frtBox);
      carObj.wallMesh = frtBox;

      /* Crate cover props */
      addFreightCrates(group, zc, carL);
      addWheels(group, zc, carL);
      addGuards(group, idx, 4, false, false, zc, carL, floorH);

    } else if (idx <= 5) {
      /* Armored */
      carObj.type = 'armored';
      carL = 15;
      floorH = 5;
      floorColor = COL_ARMORED;
      carObj.length = carL;
      carObj.height = floorH;

      var armBox = makeBox(CAR_WIDTH, floorH, carL, floorColor);
      armBox.position.set(0, floorH / 2, zc);
      group.add(armBox);
      carObj.wallMesh = armBox;

      /* Reinforced strips */
      var rStrip1 = makeBox(CAR_WIDTH + 0.1, 0.2, carL + 0.1, 0x333333);
      rStrip1.position.set(0, 1.5, zc);
      group.add(rStrip1);
      var rStrip2 = makeBox(CAR_WIDTH + 0.1, 0.2, carL + 0.1, 0x333333);
      rStrip2.position.set(0, 3.0, zc);
      group.add(rStrip2);

      addWheels(group, zc, carL);
      addGuards(group, idx, 6, true, false, zc, carL, floorH);

    } else if (idx === 6) {
      /* Control car */
      carObj.type = 'control';
      carL = 12;
      floorH = 5;
      floorColor = COL_CONTROL;
      carObj.length = carL;
      carObj.height = floorH;
      carObj.hasBrakeControl = true;

      var ctrlBox = makeBox(CAR_WIDTH, floorH, carL, floorColor);
      ctrlBox.position.set(0, floorH / 2, zc);
      group.add(ctrlBox);
      carObj.wallMesh = ctrlBox;

      /* Brake lever */
      var brakeLever = makeBox(0.15, 1.0, 0.15, COL_BRAKE_LEVER);
      brakeLever.position.set(0.8, floorH + 0.5, zc + 2);
      brakeLever.name = 'th_brake_lever';
      brakeLever.userData.isBrakeLever = true;
      group.add(brakeLever);

      /* Console */
      var console_ = makeBox(1.5, 0.5, 0.8, 0x223344);
      console_.position.set(0, floorH + 0.25, zc + 2);
      group.add(console_);

      addWheels(group, zc, carL);
      /* 4 guards + commander */
      addGuards(group, idx, 4, true, true, zc, carL, floorH);

    } else if (idx <= 9) {
      /* Vault cars */
      carObj.type = 'vault';
      carL = 15;
      floorH = 5;
      floorColor = COL_VAULT;
      carObj.length = carL;
      carObj.height = floorH;

      var vaultBox = makeBox(CAR_WIDTH, floorH, carL, floorColor);
      vaultBox.position.set(0, floorH / 2, zc);
      group.add(vaultBox);
      carObj.wallMesh = vaultBox;

      /* Gold stripes */
      var goldStripe = makeBox(CAR_WIDTH + 0.05, 0.15, carL + 0.05, 0x776611);
      goldStripe.position.set(0, 2.5, zc);
      group.add(goldStripe);

      addWheels(group, zc, carL);
      addGuards(group, idx, 8, true, false, zc, carL, floorH);

      /* One gold crate per vault car */
      if (_crates.length < 3) {
        addGoldCrate(group, idx, zc, carL, floorH);
      }

    } else if (idx === 10) {
      /* Guards' lounge */
      carObj.type = 'lounge';
      carL = 12;
      floorH = 4;
      floorColor = COL_LOUNGE;
      carObj.length = carL;
      carObj.height = floorH;

      var loungeBox = makeBox(CAR_WIDTH, floorH, carL, floorColor);
      loungeBox.position.set(0, floorH / 2, zc);
      group.add(loungeBox);
      carObj.wallMesh = loungeBox;

      /* Bunks/seats */
      var bunk1 = makeBox(1.2, 0.2, 2.0, 0x554433);
      bunk1.position.set(-0.8, floorH - 0.9, zc - 2);
      group.add(bunk1);
      var bunk2 = makeBox(1.2, 0.2, 2.0, 0x554433);
      bunk2.position.set(-0.8, floorH - 0.9, zc + 2);
      group.add(bunk2);

      addWheels(group, zc, carL);
      addGuards(group, idx, 4, false, false, zc, carL, floorH);

    } else {
      /* Rear platform (car 11) — helicopter landing zone */
      carObj.type = 'rear';
      carL = 10;
      floorH = 2;
      floorColor = COL_REAR;
      carObj.length = carL;
      carObj.height = floorH;
      carObj.isHelipad = true;

      var rearFloor = makeBox(CAR_WIDTH, floorH, carL, floorColor);
      rearFloor.position.set(0, floorH / 2, zc);
      group.add(rearFloor);

      /* Helipad markings using LineSegments */
      var helipointGeo = new THREE.BufferGeometry();
      var hpVerts = new Float32Array([
        -1.0, floorH + 0.01,  zc - 3.5,   1.0, floorH + 0.01,  zc - 3.5,
         1.0, floorH + 0.01,  zc - 3.5,   1.0, floorH + 0.01,  zc + 3.5,
         1.0, floorH + 0.01,  zc + 3.5,  -1.0, floorH + 0.01,  zc + 3.5,
        -1.0, floorH + 0.01,  zc + 3.5,  -1.0, floorH + 0.01,  zc - 3.5,
        -1.0, floorH + 0.01,  zc,          1.0, floorH + 0.01,  zc,
         0.0, floorH + 0.01,  zc - 3.5,    0.0, floorH + 0.01,  zc + 3.5
      ]);
      helipointGeo.setAttribute('position', new THREE.BufferAttribute(hpVerts, 3));
      var helipadLines = new THREE.LineSegments(
        helipointGeo,
        new THREE.LineBasicMaterial({ color: COL_HELIPAD })
      );
      helipadLines.name = 'th_helipad_lines';
      group.add(helipadLines);

      addWheels(group, zc, carL);
    }

    /* Connector between cars */
    if (idx > 0) {
      var conn = makeBox(0.8, 0.3, 0.5, 0x333333);
      conn.position.set(0, 0.2, carZCenter(idx) + carObj.length / 2 + 0.3);
      group.add(conn);
    }

    _cars.push(carObj);
  }

  function addWheels(group, zc, carL) {
    var positions = [zc - carL / 2 + 1.5, zc + carL / 2 - 1.5];
    var sides = [-1, 1];
    var i, j;
    for (i = 0; i < positions.length; i++) {
      for (j = 0; j < sides.length; j++) {
        var wheel = makeCyl(0.4, 0.4, 0.2, 8, COL_WHEEL);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sides[j] * 1.1, -0.4, positions[i]);
        group.add(wheel);
      }
    }
  }

  function addFreightCrates(group, zc, carL) {
    var positions = [
      [0, 2.2, zc - 3],
      [-0.7, 2.2, zc + 1],
      [0.7, 2.2, zc + 3]
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var crate = makeBox(0.9, 0.9, 0.9, 0x8B6914);
      crate.position.set(positions[i][0], positions[i][1], positions[i][2]);
      group.add(crate);
    }
  }

  function addGoldCrate(group, carIdx, zc, carL, floorH) {
    var crateGroup = new THREE.Group();
    crateGroup.name = 'th_goldcrate_' + _crates.length;

    var offsetZ = ((_crates.length % 3) - 1) * 3;
    var worldZ = zc + offsetZ;

    var mesh = makeBox(1.2, 1.0, 1.2, COL_GOLD_CRATE);
    mesh.position.set(0, 0, 0);
    crateGroup.add(mesh);

    /* Gold glow */
    var crateLight = new THREE.PointLight(0xFFCC00, 1.5, 4);
    crateLight.position.set(0, 1.0, 0);
    crateGroup.add(crateLight);

    /* Lock detail */
    var lock = makeBox(0.2, 0.15, 0.05, 0xBBAA00);
    lock.position.set(0, 0, 0.62);
    crateGroup.add(lock);

    crateGroup.position.set(0, floorH + 0.5, worldZ);
    group.add(crateGroup);

    _crates.push({
      mesh: crateGroup,
      light: crateLight,
      carIndex: carIdx,
      secured: false,
      transferred: false,
      worldZ: worldZ
    });
  }

  function addGuards(group, carIdx, count, isElite, hasCommander, zc, carL, floorH) {
    var i;
    var guardFloorY = floorH + 0.9;

    for (i = 0; i < count; i++) {
      var isCmd = hasCommander && i === 0;
      var hp = isCmd ? COMMANDER_HP : (isElite ? ELITE_HP : GUARD_HP);
      var col = isCmd ? COL_COMMANDER : (isElite ? COL_ELITE_GUARD : COL_GUARD);

      var guardGroup = new THREE.Group();
      guardGroup.name = 'th_guard_' + _guards.length;

      /* Body */
      var body = makeBox(0.55, 1.0, 0.35, col);
      body.position.y = 0.5;
      guardGroup.add(body);

      /* Head */
      var head = makeBox(0.38, 0.38, 0.38, 0xDDAA88);
      head.position.y = 1.25;
      guardGroup.add(head);

      /* Helmet */
      var helmet = makeBox(0.42, 0.22, 0.42, col);
      helmet.position.y = 1.47;
      guardGroup.add(helmet);

      /* Arms */
      var armL = makeBox(0.18, 0.75, 0.18, col);
      armL.position.set(-0.38, 0.5, 0);
      guardGroup.add(armL);
      var armR = makeBox(0.18, 0.75, 0.18, col);
      armR.position.set(0.38, 0.5, 0);
      guardGroup.add(armR);

      /* Rifle */
      var rifle = makeBox(0.08, 0.08, 0.8, COL_GUN);
      rifle.position.set(0.5, 0.7, -0.2);
      guardGroup.add(rifle);

      /* Commander — bigger, different helmet */
      if (isCmd) {
        helmet.scale.set(1.2, 1.4, 1.2);
        var badge = makeBox(0.08, 0.08, 0.08, 0xFFCC00);
        badge.position.set(0, 1.6, 0.22);
        guardGroup.add(badge);
      }

      var spawnZ = zc + (((i + 1) / (count + 1)) - 0.5) * carL * 0.8;
      var spawnX = (i % 2 === 0) ? -0.6 : 0.6;
      guardGroup.position.set(spawnX, guardFloorY, spawnZ);

      group.add(guardGroup);

      var guardObj = {
        group: guardGroup,
        hp: hp,
        maxHp: hp,
        alive: true,
        carIndex: carIdx,
        isElite: isElite,
        isCommander: isCmd,
        patrolDir: (Math.random() > 0.5 ? 1 : -1),
        patrolTimer: Math.random() * 3,
        alertTimer: 0,
        alertState: 'patrol',  // patrol / alert / cover
        pos: new THREE.Vector3(spawnX, guardFloorY, spawnZ),
        coverTimer: 0,
        coverPos: new THREE.Vector3(spawnX, guardFloorY, spawnZ)
      };

      if (isCmd) { _commanderAlive = true; }
      _guards.push(guardObj);
      _totalGuards++;
    }
    _guardsRemaining = _totalGuards;
  }

  function buildHelicopter() {
    var scene = getScene();
    if (!scene) return;

    _heliMesh = new THREE.Group();
    _heliMesh.name = 'th_helicopter';

    /* Fuselage */
    var fuselage = makeBox(1.8, 1.2, 4.5, COL_HELICOPTER);
    fuselage.position.y = 0;
    _heliMesh.add(fuselage);

    /* Tail boom */
    var tailBoom = makeBox(0.5, 0.4, 3.0, COL_HELICOPTER);
    tailBoom.position.set(0, 0.2, 3.5);
    _heliMesh.add(tailBoom);

    /* Cockpit (windshield) */
    var cockpit = makeBox(1.5, 0.9, 1.2, 0x88AABB, { transparent: true, opacity: 0.5 });
    cockpit.position.set(0, 0.5, -2.0);
    _heliMesh.add(cockpit);

    /* Main rotor */
    var rotorHub = makeCyl(0.1, 0.1, 0.3, 6, 0x222222);
    rotorHub.position.y = 0.9;
    _heliMesh.add(rotorHub);

    var rotorBlade1 = makeBox(5.0, 0.06, 0.25, 0x333333);
    rotorBlade1.position.y = 1.05;
    rotorBlade1.name = 'th_rotor1';
    _heliMesh.add(rotorBlade1);

    var rotorBlade2 = makeBox(0.25, 0.06, 5.0, 0x333333);
    rotorBlade2.position.y = 1.05;
    rotorBlade2.name = 'th_rotor2';
    _heliMesh.add(rotorBlade2);

    /* Skids */
    var skid1 = makeBox(0.1, 0.08, 3.5, 0x333333);
    skid1.position.set(-0.85, -0.75, 0);
    _heliMesh.add(skid1);
    var skid2 = makeBox(0.1, 0.08, 3.5, 0x333333);
    skid2.position.set(0.85, -0.75, 0);
    _heliMesh.add(skid2);

    /* Start off-screen, high up */
    _heliPos = new THREE.Vector3(0, 40, -80);
    _heliMesh.position.copy(_heliPos);
    _heliMesh.visible = true;
    scene.add(_heliMesh);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT
  ══════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var now = performance.now() / 1000;
    var k = e.key.toUpperCase();
    _keys[k] = true;

    if (k === 'T') { _keyPressTime.T = now; }
    if (k === 'H') { _keyPressTime.H = now; }

    if (!_active) {
      if (Math.abs(_keyPressTime.T - _keyPressTime.H) < ACTIVATE_WINDOW &&
          _keyPressTime.T > 0 && _keyPressTime.H > 0) {
        activateModule();
      }
      return;
    }

    if (e.key === 'e' || e.key === 'E') {
      handleInteract();
    }
    if (e.key === 'r' || e.key === 'R') {
      handleBrakeInteract();
    }
    if (e.key === 'g' || e.key === 'G') {
      throwGrenade();
    }
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    if (!_active || !_mouseLocked) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _yaw   -= dx * 0.002;
    _pitch -= dy * 0.002;
    _pitch = clamp(_pitch, -Math.PI / 3, Math.PI / 3);
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      shoot();
    }
  }

  function onPointerLockChange() {
    var renderer = getRenderer();
    if (renderer && document.pointerLockElement === renderer.domElement) {
      _mouseLocked = true;
    } else {
      _mouseLocked = false;
    }
  }

  function addListeners() {
    if (!_keysAdded) {
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      _keysAdded = true;
    }
    if (!_mouseAdded) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('pointerlockchange', onPointerLockChange);
      _mouseAdded = true;
    }
  }

  function removeListeners() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    _keysAdded = false;
    _mouseAdded = false;
  }

  function requestPointerLock() {
    var renderer = getRenderer();
    if (renderer && renderer.domElement && renderer.domElement.requestPointerLock) {
      renderer.domElement.requestPointerLock();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ══════════════════════════════════════════════════════════════════════════ */

  function activateModule() {
    if (_active) return;
    _active = true;
    _gameOver = false;
    _won = false;

    var scene = getScene();
    if (!scene) { _active = false; return; }

    buildScene();
    buildHUD();

    /* Place player at top of car 0 (flatbed front) */
    var cam = getCamera();
    if (cam) {
      _playerPos = new THREE.Vector3(0, 1.7, carZCenter(0));
      cam.position.copy(_playerPos);
      cam.rotation.set(0, 0, 0);
    }

    _timer = MISSION_TIME;
    _lastTime = performance.now() / 1000;
    _nextTunnelAt = TUNNEL_INTERVAL;
    _heliState = 'INBOUND';

    requestPointerLock();
    showMsg('TRAIN HEIST — SECURE 3 GOLD CRATES! DROP FROM HELI!', 4);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INTERACT
  ══════════════════════════════════════════════════════════════════════════ */

  function handleInteract() {
    if (!_active || _gameOver) return;

    /* If on rear platform and carrying crate, transfer to helicopter */
    if (_currentCar === 11 && _carryingCrate && _heliState === 'WAITING') {
      transferCrate();
      return;
    }

    /* Try to pick up a gold crate */
    if (!_carryingCrate) {
      pickupCrate();
    }
  }

  function pickupCrate() {
    var i;
    for (i = 0; i < _crates.length; i++) {
      var c = _crates[i];
      if (c.transferred || c.secured) continue;
      if (c.carIndex !== _currentCar) continue;
      var crateWorldPos = new THREE.Vector3();
      c.mesh.getWorldPosition(crateWorldPos);
      if (dist3(_playerPos, crateWorldPos) < INTERACT_RANGE + 1.5) {
        _carryingCrate = true;
        _carriedCrateIndex = i;
        c.secured = true;
        /* Hide crate mesh from car, attach to camera later in update */
        c.mesh.visible = false;
        if (c.light) c.light.visible = false;
        showMsg('[E] GOLD CRATE SECURED — CARRY TO REAR PLATFORM', 3);
        return;
      }
    }
    showMsg('NOTHING TO PICK UP', 1.5);
  }

  function transferCrate() {
    if (_carriedCrateIndex < 0 || _carriedCrateIndex >= _crates.length) return;
    _crates[_carriedCrateIndex].transferred = true;
    _carryingCrate = false;
    _carriedCrateIndex = -1;
    _goldTransferred++;
    showMsg('GOLD TRANSFERRED TO HELICOPTER! ' + _goldTransferred + '/3', 3);
    if (_goldTransferred >= 3) {
      triggerWin();
    }
  }

  function handleBrakeInteract() {
    if (!_active || _gameOver) return;
    if (_currentCar !== 6) {
      showMsg('BRAKE CONTROLS IN CAR 7 (CONTROL CAR)', 2);
      return;
    }
    if (!_brakeEventTriggered) {
      showMsg('NO BRAKE EVENT ACTIVE', 1.5);
      return;
    }
    if (_brakeEventHandled) {
      showMsg('BRAKE ALREADY NEUTRALIZED', 1.5);
      return;
    }
    /* Player is in control car and prevents brake */
    _brakeEventHandled = true;
    _trainSpeedMod = 1.0;
    showMsg('BRAKE NEUTRALIZED — TRAIN SPEED MAINTAINED!', 3);
    /* Lever visual feedback */
    var i;
    for (i = 0; i < _cars[6].group.children.length; i++) {
      var ch = _cars[6].group.children[i];
      if (ch.name === 'th_brake_lever') {
        ch.material.color.setHex(0x00FF44);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHOOTING
  ══════════════════════════════════════════════════════════════════════════ */

  function shoot() {
    if (!_active || _gameOver) return;
    var cam = getCamera();
    if (!cam) return;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion);
    var ray = new THREE.Raycaster(_playerPos.clone(), dir, 0.1, SHOOT_RANGE);

    var i;
    var hit = false;
    for (i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      var gPos = new THREE.Vector3();
      g.group.getWorldPosition(gPos);
      var toGuard = gPos.clone().sub(_playerPos);
      var dot = toGuard.normalize().dot(dir);
      if (dot > 0.93 && dist3(_playerPos, gPos) < SHOOT_RANGE) {
        g.hp -= SHOOT_DAMAGE;
        _hitFlash = 0.12;
        hit = true;
        if (g.hp <= 0) {
          killGuard(i);
        } else {
          g.alertState = 'alert';
          g.alertTimer = 5.0;
        }
        break;
      }
    }

    /* Muzzle flash */
    if (cam) {
      /* simple recoil pitch */
      _pitch += 0.015;
      _pitch = clamp(_pitch, -Math.PI / 3, Math.PI / 3);
    }

    if (_crosshair && hit) {
      _crosshair.style.color = '#FF4400';
    }
  }

  function killGuard(idx) {
    var g = _guards[idx];
    g.alive = false;
    g.group.visible = false;
    _guardsRemaining--;
    if (g.isCommander) {
      _commanderAlive = false;
      showMsg('TRAIN COMMANDER ELIMINATED!', 3);
      /* Commander death — guards lose morale, reduce HP */
      var i;
      for (i = 0; i < _guards.length; i++) {
        if (_guards[i].alive && !_guards[i].isElite) {
          _guards[i].hp = Math.min(_guards[i].hp, 50);
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     GRENADES
  ══════════════════════════════════════════════════════════════════════════ */

  function throwGrenade() {
    if (!_active || _gameOver) return;
    if (_grenadeCount <= 0) { showMsg('NO GRENADES', 1.2); return; }
    _grenadeCount--;
    var scene = getScene();
    if (!scene) return;
    var cam = getCamera();
    if (!cam) return;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion);
    dir.y += 0.25;
    dir.normalize();

    var grenMesh = makeSphere(0.15, 5, 4, 0x334422);
    grenMesh.position.copy(_playerPos).add(dir.clone().multiplyScalar(0.8));
    grenMesh.name = 'th_grenade_' + _grenades.length;
    scene.add(grenMesh);

    _grenades.push({
      mesh: grenMesh,
      vel: dir.clone().multiplyScalar(14),
      fuse: GRENADE_FUSE,
      exploded: false
    });
  }

  function updateGrenades(dt) {
    var scene = getScene();
    var i, j;
    for (i = _grenades.length - 1; i >= 0; i--) {
      var gr = _grenades[i];
      if (gr.exploded) continue;

      gr.vel.y -= 9.8 * dt;
      gr.mesh.position.addScaledVector(gr.vel, dt);
      gr.fuse -= dt;

      /* Bounce off train top */
      var trainTop = getCurrentCarFloorY() + _cars[_currentCar].height;
      if (gr.mesh.position.y < trainTop) {
        gr.mesh.position.y = trainTop;
        gr.vel.y *= -0.4;
        gr.vel.x *= 0.7;
        gr.vel.z *= 0.7;
      }

      if (gr.fuse <= 0) {
        explodeGrenade(i);
      }
    }
  }

  function explodeGrenade(idx) {
    var gr = _grenades[idx];
    gr.exploded = true;
    var scene = getScene();
    if (scene && gr.mesh.parent) {
      scene.remove(gr.mesh);
    }

    var ePos = gr.mesh.position.clone();
    /* Flash light */
    var flashLight = new THREE.PointLight(0xFF8800, 8, 12);
    flashLight.position.copy(ePos);
    var scene2 = getScene();
    if (scene2) {
      scene2.add(flashLight);
      /* Remove after brief flash */
      var fl = flashLight;
      setTimeout(function () {
        if (fl.parent) fl.parent.remove(fl);
      }, 150);
    }

    /* Damage guards */
    var i;
    for (i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      var gPos = new THREE.Vector3();
      g.group.getWorldPosition(gPos);
      var d = dist3(ePos, gPos);
      if (d < GRENADE_RADIUS) {
        var dmg = GRENADE_DAMAGE * (1 - d / GRENADE_RADIUS);
        g.hp -= dmg;
        if (g.hp <= 0) killGuard(i);
      }
    }

    /* Damage player */
    var pDist = dist3(ePos, _playerPos);
    if (pDist < GRENADE_RADIUS) {
      var pDmg = GRENADE_DAMAGE * (1 - pDist / GRENADE_RADIUS);
      _playerHP -= pDmg;
      if (_playerHP <= 0) triggerPlayerDeath();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ══════════════════════════════════════════════════════════════════════════ */

  function getCurrentCarFloorY() {
    if (_currentCar < 0 || _currentCar >= _cars.length) return 0;
    return 0; /* floor is at y=0 for flatbed, walls start above */
  }

  function updatePlayerMovement(dt) {
    if (!_active || _gameOver) return;
    var cam = getCamera();
    if (!cam) return;

    var speed = PLAYER_SPEED * (_carryingCrate ? CRATE_SLOW : 1.0);
    /* Wind effect: moving toward front of train (positive Z) is hindered */
    var windFactor = 1.0;

    var forward = new THREE.Vector3(-Math.sin(_yaw), 0, -Math.cos(_yaw));
    var right   = new THREE.Vector3(Math.cos(_yaw), 0, -Math.sin(_yaw));

    var move = new THREE.Vector3();
    if (_keys['W']) move.addScaledVector(forward, speed * dt);
    if (_keys['S']) {
      /* Moving against wind (toward rear = negative Z) — no penalty */
      move.addScaledVector(forward, -speed * dt);
    }
    if (_keys['A']) move.addScaledVector(right, -speed * dt);
    if (_keys['D']) move.addScaledVector(right, speed * dt);

    /* Wind: moving toward positive Z (against train direction) slowed */
    if (move.z > 0) { move.z *= 0.6; }

    _playerPos.add(move);

    /* Clamp player to train width */
    _playerPos.x = clamp(_playerPos.x, -1.2, 1.2);

    /* Determine current car from player Z position */
    var newCar = Math.round(-_playerPos.z / CAR_SPACING);
    newCar = clamp(newCar, 0, NUM_CARS - 1);
    if (newCar !== _currentCar) {
      _currentCar = newCar;
      if (_currentCar > _respawnCar) _respawnCar = _currentCar;
      if (_currentCar === 11 && _carryingCrate && _heliState === 'WAITING') {
        showMsg('[E] TRANSFER GOLD TO HELICOPTER!', 3);
      }
      if (_currentCar === 6) {
        showMsg('CONTROL CAR — [R] TO NEUTRALIZE BRAKE', 2.5);
      }
    }

    /* Keep player on top of current car */
    var car = _cars[_currentCar];
    var floorY = car ? car.height + PLAYER_HEIGHT : PLAYER_HEIGHT;
    _playerPos.y = floorY;

    /* Fall off train check (too wide) */
    if (Math.abs(_playerPos.x) > 2.0) {
      handlePlayerFall();
    }

    /* Update camera */
    cam.position.copy(_playerPos);
    cam.rotation.order = 'YXZ';
    cam.rotation.y = _yaw;
    cam.rotation.x = _pitch;
  }

  function handlePlayerFall() {
    if (_lives > 0) {
      _lives--;
      /* Respawn at last safe car */
      _playerPos.set(0, _cars[_respawnCar].height + PLAYER_HEIGHT, carZCenter(_respawnCar));
      _currentCar = _respawnCar;
      if (_carryingCrate) {
        /* Drop crate */
        var c = _crates[_carriedCrateIndex];
        if (c) {
          c.secured = false;
          c.mesh.visible = true;
          if (c.light) c.light.visible = true;
        }
        _carryingCrate = false;
        _carriedCrateIndex = -1;
      }
      showMsg('YOU FELL! RESPAWNED AT CAR ' + (_respawnCar + 1), 3);
      _playerHP = RESPAWN_HP;
    } else {
      triggerLose('FELL FROM TRAIN — MISSION FAILED');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     GUARD AI
  ══════════════════════════════════════════════════════════════════════════ */

  function updateGuards(dt) {
    var i;
    for (i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      updateGuard(g, dt);
    }
  }

  function updateGuard(g, dt) {
    var car = _cars[g.carIndex];
    if (!car) return;

    var zc = carZCenter(g.carIndex);
    var halfLen = car.length / 2;
    var floorY = car.height + 0.9;

    /* Check if player is in same car or adjacent */
    var playerInRange = Math.abs(_currentCar - g.carIndex) <= 1;
    var gPos = g.group.position.clone();

    if (playerInRange && _playerPos) {
      var dp = dist3(_playerPos, new THREE.Vector3(gPos.x + carZCenter(g.carIndex) - carZCenter(g.carIndex), gPos.y, gPos.z));
      /* Simpler distance along Z */
      var dz = Math.abs(_playerPos.z - gPos.z);
      var dx = Math.abs(_playerPos.x - gPos.x);
      var inLOS = dz < 12 && dx < 3;

      if (inLOS) {
        g.alertState = 'alert';
        g.alertTimer = 4.0;
      }
    }

    if (g.alertTimer > 0) g.alertTimer -= dt;
    if (g.alertTimer <= 0 && g.alertState === 'alert') {
      g.alertState = 'patrol';
    }

    if (g.alertState === 'alert') {
      /* Shoot at player periodically */
      g.coverTimer = (g.coverTimer || 0) + dt;
      if (g.coverTimer > 1.5) {
        g.coverTimer = 0;
        /* Guard fires at player */
        var hitChance = g.isElite ? 0.35 : 0.18;
        if (_commanderAlive) hitChance += 0.08;
        if (Math.random() < hitChance) {
          _playerHP -= g.isElite ? 18 : 12;
          showMsg('HIT! HP: ' + Math.round(_playerHP), 0.8);
          if (_playerHP <= 0) { triggerPlayerDeath(); return; }
        }
      }
      /* Move toward player Z */
      var targetZ = _playerPos ? _playerPos.z : gPos.z;
      var dtz = targetZ - gPos.z;
      var moveZ = Math.sign(dtz) * 3.5 * dt;
      if (Math.abs(dtz) > 0.5) {
        gPos.z = clamp(gPos.z + moveZ, zc - halfLen + 0.5, zc + halfLen - 0.5);
      }
    } else {
      /* Patrol */
      g.patrolTimer -= dt;
      if (g.patrolTimer <= 0) {
        g.patrolDir *= -1;
        g.patrolTimer = 2.0 + Math.random() * 2.0;
      }
      gPos.z += g.patrolDir * 1.5 * dt;
      gPos.z = clamp(gPos.z, zc - halfLen + 0.5, zc + halfLen - 0.5);
    }

    gPos.y = floorY;
    g.group.position.copy(gPos);
    g.pos.copy(gPos);

    /* Face player direction */
    if (_playerPos) {
      var angleToPlayer = Math.atan2(_playerPos.x - gPos.x, _playerPos.z - gPos.z);
      g.group.rotation.y = angleToPlayer;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HELICOPTER
  ══════════════════════════════════════════════════════════════════════════ */

  function updateHelicopter(dt) {
    if (!_heliMesh) return;
    var elapsed = MISSION_TIME - _timer;

    /* Rotor spin */
    var r1 = _heliMesh.getObjectByName('th_rotor1');
    var r2 = _heliMesh.getObjectByName('th_rotor2');
    if (r1) r1.rotation.y += 8 * dt;
    if (r2) r2.rotation.y += 8 * dt;

    if (_heliState === 'INBOUND') {
      /* Fly in toward rear of train */
      if (elapsed < _heliArrivalTime) {
        var t = elapsed / _heliArrivalTime;
        _heliPos.set(
          0,
          40 - t * 30,
          -80 + t * 30
        );
      } else {
        _heliState = 'WAITING';
        /* Hover above car 11 */
        var rearZ = carZCenter(11);
        _heliPos.set(0, 10, rearZ);
        showMsg('HELICOPTER ARRIVED — TRANSFER GOLD!', 4);
      }
      _heliMesh.position.copy(_heliPos);

    } else if (_heliState === 'WAITING') {
      /* Hover above helipad with slight bob */
      var rearZ2 = carZCenter(11);
      _heliPos.set(0, 8 + Math.sin(elapsed * 1.5) * 0.3, rearZ2);
      _heliMesh.position.copy(_heliPos);

      /* Check depart time */
      var departAt = _heliDepartTime + _heliBrakeDelay;
      var timeLeft = departAt - elapsed;
      if (timeLeft < 30 && timeLeft > 0) {
        if (Math.floor(timeLeft) % 10 === 0 && timeLeft % 1 < dt) {
          showMsg('HELICOPTER DEPARTING IN ' + Math.ceil(timeLeft) + 's!', 2);
        }
      }
      if (elapsed >= departAt) {
        if (_goldTransferred < 3) {
          _heliState = 'DEPARTED';
          departHelicopter();
        }
      }

    } else if (_heliState === 'DEPARTED') {
      /* Fly away */
      _heliPos.y += 15 * dt;
      _heliPos.z -= 20 * dt;
      _heliMesh.position.copy(_heliPos);
    }
  }

  function departHelicopter() {
    _heliState = 'DEPARTED';
    if (_goldTransferred === 0) {
      triggerLose('HELICOPTER DEPARTED — NO GOLD SECURED');
    } else if (_goldTransferred < 3) {
      triggerLose('HELICOPTER DEPARTED — ONLY ' + _goldTransferred + '/3 CRATES SECURED');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TRAIN MECHANICS
  ══════════════════════════════════════════════════════════════════════════ */

  function updateTrainScenery(dt) {
    _trackOffset += SCROLL_RATE * _trainSpeedMod;
    if (_trackOffset > 2.0) _trackOffset -= 2.0;

    var i;
    /* Scroll sleepers */
    for (i = 0; i < _rails.length; i++) {
      var r = _rails[i];
      if (r.userData && r.userData.isSleeper) {
        r.position.z = r.userData.origZ + _trackOffset * 20;
        if (r.position.z > 10) {
          r.position.z -= 200;
          r.userData.origZ = r.position.z;
        }
      }
    }

    /* Scroll trees */
    for (i = 0; i < _trees.length; i++) {
      var t = _trees[i];
      t.group.position.z += SCROLL_RATE * 20 * _trainSpeedMod * dt * 10;
      if (t.group.position.z > 50) {
        t.group.position.z = -450 + Math.random() * 50;
        t.origZ = t.group.position.z;
      }
    }

    /* Scroll mountains */
    for (i = 0; i < _mountains.length; i++) {
      var m = _mountains[i];
      m.mesh.position.z += SCROLL_RATE * 5 * _trainSpeedMod * dt * 10;
      if (m.mesh.position.z > 100) {
        m.mesh.position.z = -500 + Math.random() * 100;
        m.origZ = m.mesh.position.z;
      }
    }
  }

  function updateTimedEvents(dt) {
    var elapsed = MISSION_TIME - _timer;

    /* Tunnel: every 2 minutes */
    if (!_inTunnel && elapsed >= _nextTunnelAt) {
      startTunnel();
    }
    if (_inTunnel) {
      _tunnelTimer -= dt;
      if (_tunnelTimer <= 0) endTunnel();
    }

    /* Bridge at 4 min mark */
    if (!_bridgeActive && elapsed >= BRIDGE_TIME && elapsed < BRIDGE_TIME + 30) {
      _bridgeActive = true;
      showMsg('BRIDGE CROSSING — NO GUARDRAILS! DO NOT FALL!', 4);
    } else if (_bridgeActive && elapsed >= BRIDGE_TIME + 30) {
      _bridgeActive = false;
    }

    /* Brake event at 6 min mark */
    if (!_brakeEventTriggered && elapsed >= BRAKE_TIME) {
      _brakeEventTriggered = true;
      triggerBrakeEvent();
    }
  }

  function startTunnel() {
    _inTunnel = true;
    _tunnelTimer = TUNNEL_DURATION;
    _nextTunnelAt += TUNNEL_INTERVAL;

    /* Dim all crate lights */
    var scene = getScene();
    if (scene) {
      var ambLight = scene.getObjectByName('th_ambient');
      if (ambLight) ambLight.intensity = 0.05;
      var sunLight = scene.getObjectByName('th_sun');
      if (sunLight) sunLight.intensity = 0.0;
    }
    var i;
    for (i = 0; i < _crates.length; i++) {
      if (_crates[i].light) _crates[i].light.visible = false;
    }
    showMsg('ENTERING TUNNEL — DARKNESS FOR 10s', 2.5);
  }

  function endTunnel() {
    _inTunnel = false;
    var scene = getScene();
    if (scene) {
      var ambLight = scene.getObjectByName('th_ambient');
      if (ambLight) ambLight.intensity = 0.5;
      var sunLight = scene.getObjectByName('th_sun');
      if (sunLight) sunLight.intensity = 1.0;
    }
    var i;
    for (i = 0; i < _crates.length; i++) {
      if (_crates[i].light && !_crates[i].transferred) {
        _crates[i].light.visible = true;
      }
    }
    showMsg('CLEAR OF TUNNEL', 1.5);
  }

  function triggerBrakeEvent() {
    _trainSpeedMod = 0.3;
    showMsg('CONDUCTOR PULLING BRAKE! GO TO CAR 7 — [R] TO STOP!', 5);
    /* If player doesn't neutralize within 30s, the delay stacks */
    var eventTime = performance.now();
    var checkInterval = setInterval(function () {
      if (!_active || _gameOver) { clearInterval(checkInterval); return; }
      if (_brakeEventHandled) { clearInterval(checkInterval); return; }
      var elapsed = (performance.now() - eventTime) / 1000;
      if (elapsed >= 30) {
        clearInterval(checkInterval);
        _heliBrakeDelay += BRAKE_PENALTY;
        _trainSpeedMod = 0.7;
        showMsg('BRAKE ENGAGED! HELICOPTER EXTRACTION DELAYED +45s', 4);
      }
    }, 1000);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ══════════════════════════════════════════════════════════════════════════ */

  function triggerWin() {
    _gameOver = true;
    _won = true;
    showMsg('MISSION COMPLETE! $200M IN GOLD SECURED!', 0);
    _heliState = 'DEPARTED';
    showEndScreen(true);
  }

  function triggerPlayerDeath() {
    if (_gameOver) return;
    _playerHP = 0;
    if (_carryingCrate) {
      var c = _crates[_carriedCrateIndex];
      if (c) {
        c.secured = false;
        c.mesh.visible = true;
        if (c.light) c.light.visible = true;
      }
      _carryingCrate = false;
      _carriedCrateIndex = -1;
    }
    triggerLose('KILLED IN ACTION');
  }

  function triggerLose(reason) {
    if (_gameOver) return;
    _gameOver = true;
    _won = false;
    showMsg('MISSION FAILED: ' + reason, 0);
    showEndScreen(false, reason);
  }

  function showEndScreen(win, reason) {
    var overlay = document.createElement('div');
    overlay.id = 'train-heist-end';
    overlay.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'background:rgba(0,0,0,0.80)',
      'color:' + (win ? '#FFD700' : '#FF4444'),
      'font:bold 28px monospace',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'z-index:99999',
      'text-align:center'
    ].join(';');

    var title = win ? 'HEIST SUCCESSFUL' : 'HEIST FAILED';
    var detail = win
      ? '$200,000,000 IN GOLD SECURED\n3/3 CRATES TRANSFERRED'
      : (reason || 'MISSION FAILED');
    var statsLine = 'GOLD: ' + _goldTransferred + '/3 | GUARDS ELIMINATED: ' + (_totalGuards - _guardsRemaining) + '/' + _totalGuards;
    var timeLine = 'TIME: ' + formatTime(MISSION_TIME - _timer);

    overlay.innerHTML = '<div style="font-size:40px;margin-bottom:16px">' + title + '</div>' +
      '<div style="font-size:18px;margin-bottom:12px;white-space:pre-line">' + detail + '</div>' +
      '<div style="font-size:15px;color:#AAAAAA;margin-bottom:8px">' + statsLine + '</div>' +
      '<div style="font-size:15px;color:#AAAAAA;margin-bottom:24px">' + timeLine + '</div>' +
      '<div style="font-size:14px;color:#888888">Press [T+H] to play again</div>';
    document.body.appendChild(overlay);

    /* Auto-remove after 8s */
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 8000);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CLEANUP
  ══════════════════════════════════════════════════════════════════════════ */

  function cleanupScene() {
    var scene = getScene();
    if (!scene) return;

    if (_trainRoot && _trainRoot.parent) {
      scene.remove(_trainRoot);
    }
    if (_sceneryRoot && _sceneryRoot.parent) {
      scene.remove(_sceneryRoot);
    }
    if (_heliMesh && _heliMesh.parent) {
      scene.remove(_heliMesh);
    }
    /* Remove lights we added */
    var ambLight = scene.getObjectByName('th_ambient');
    if (ambLight) scene.remove(ambLight);
    var sunLight = scene.getObjectByName('th_sun');
    if (sunLight) scene.remove(sunLight);

    /* Clear fog */
    scene.fog = null;
    scene.background = null;

    _trainRoot = null;
    _sceneryRoot = null;
    _heliMesh = null;
  }

  function resetState() {
    _active              = false;
    _gameOver            = false;
    _won                 = false;
    _timer               = MISSION_TIME;
    _lastTime            = 0;
    _playerHP            = PLAYER_HP;
    _yaw                 = 0;
    _pitch               = 0;
    _currentCar          = 0;
    _carryingCrate       = false;
    _carriedCrateIndex   = -1;
    _respawnCar          = 0;
    _lives               = 1;
    _brakeActivated      = false;
    _brakeEventTriggered = false;
    _brakeEventHandled   = false;
    _trainSpeedMod       = 1.0;
    _trackOffset         = 0;
    _rails               = [];
    _trees               = [];
    _mountains           = [];
    _cars                = [];
    _guards              = [];
    _crates              = [];
    _grenades            = [];
    _goldTransferred     = 0;
    _totalGuards         = 0;
    _guardsRemaining     = 0;
    _commanderAlive      = true;
    _inTunnel            = false;
    _tunnelTimer         = 0;
    _nextTunnelAt        = TUNNEL_INTERVAL;
    _bridgeActive        = false;
    _bridgeTimer         = 0;
    _heliState           = 'INBOUND';
    _heliPos             = null;
    _heliBrakeDelay      = 0;
    _hitFlash            = 0;
    _grenadeCount        = 3;
    _hudMsgTimer         = 0;
    _keyPressTime        = { T: 0, H: 0 };
    _keys                = {};
    _mouseLocked         = false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API: init / update / reset
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, renderer) {
    _scene    = scene    || null;
    _camera   = camera   || null;
    _renderer = renderer || null;
    addListeners();
  }

  function update(dt) {
    if (!_active) return;
    if (_gameOver) return;

    /* Delta time guard */
    var now = performance.now() / 1000;
    if (_lastTime === 0) { _lastTime = now; }
    var delta = dt !== undefined ? dt : Math.min(now - _lastTime, 0.05);
    _lastTime = now;

    /* Count down timer */
    _timer -= delta;
    if (_timer <= 0) {
      _timer = 0;
      if (_heliState !== 'DEPARTED') {
        departHelicopter();
      }
      return;
    }

    updatePlayerMovement(delta);
    updateGuards(delta);
    updateGrenades(delta);
    updateHelicopter(delta);
    updateTrainScenery(delta);
    updateTimedEvents(delta);

    /* Crosshair color reset */
    if (_hitFlash > 0) {
      _hitFlash -= delta;
      if (_crosshair) _crosshair.style.color = '#FF4400';
    } else {
      if (_crosshair) _crosshair.style.color = 'white';
    }

    /* HUD message timer */
    if (_hudMsgTimer > 0) {
      _hudMsgTimer -= delta;
      if (_hudMsgTimer <= 0 && _hudMsg) {
        _hudMsg.style.display = 'none';
      }
    }

    /* Carried crate visual — float in front of player */
    if (_carryingCrate && _carriedCrateIndex >= 0) {
      var cc = _crates[_carriedCrateIndex];
      if (cc && cc.mesh) {
        /* Place crate mesh in front of camera */
        var cam2 = getCamera();
        if (cam2) {
          var ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(cam2.quaternion);
          cc.mesh.visible = true;
          cc.mesh.position.copy(_playerPos).addScaledVector(ahead, 1.2);
          cc.mesh.position.y -= 0.2;
        }
      }
    }

    updateHUD();
  }

  function reset() {
    cleanupScene();
    removeHUD();
    removeListeners();

    /* Remove end screen if present */
    var endScreen = document.getElementById('train-heist-end');
    if (endScreen && endScreen.parentNode) endScreen.parentNode.removeChild(endScreen);

    /* Exit pointer lock */
    if (document.exitPointerLock) document.exitPointerLock();

    resetState();
    addListeners();  /* Re-add so activation key still works */
  }

  /* ══════════════════════════════════════════════════════════════════════════
     EXPOSE
  ══════════════════════════════════════════════════════════════════════════ */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
