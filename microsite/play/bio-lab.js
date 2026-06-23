/* ───────────────────────────────────────────────────────────────────────────
   bio-lab.js — Bio-Lab Mini-Game
   API: window.BioLab = { init, update, reset }
   Activation: B + L simultaneous keypress (both keys within 400ms)

   Layout:
     FACILITY         — BoxGeometry 30x6x25, 0x445544
     AIRLOCK          — BoxGeometry 3x4x3, 0x336633
     LAB ROOMS x4     — BoxGeometry 10x4x8, 0x334433, connected by corridors
     CONTAINMENT      — BoxGeometry 8x5x8, 0x223322, biohazard PointLight 0x44FF44

   Objectives:
     - 6-minute containment breach timer
     - Neutralize 3 culture samples (E, 8s each)
     - Destroy main culture tank (E 10s, all samples first)
     - Decontamination shower at station (E) restores suit + clears exposure

   Threats:
     - 8 armed scientists (BoxGeometry 0x225522); tranq gun → suit breach; melee → 20% suit tear
     - Autosampler robot (CylinderGeometry 0x445544); if reaches tank → -60s timer
     - Specimen containers x4 (BoxGeometry 0x224422); shoot → sub-pathogen cloud 3s, -30% suit
     - Emergency lockdown: blast doors seal rooms; hack terminal E 12s each

   HUD: BIO-LAB [CONTAINMENT: MM:SS] [SAMPLES: N/3] [SUIT: N%] [SCIENTISTS: N] | TANK: LOCKED/ARMED/DESTROYED
   ─────────────────────────────────────────────────────────────────────────── */

window.BioLab = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation combo: B + L within 400ms ─────────────────────────────── */
  var _blPressTime = { B: 0, L: 0 };
  var BL_WINDOW    = 400;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _victory         = false;
  var _defeat          = false;
  var _breachTimer     = 360; /* 6 minutes */
  var _alarmTriggered  = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerMesh      = null;
  var _suitMesh        = null;
  var _playerHP        = 100;
  var _playerMaxHP     = 100;
  var _playerPos       = { x: 0, y: 1, z: 10 };
  var _playerSpeed     = 8;
  var _suitIntegrity   = 100;
  var _exposed         = false;
  var _exposureLight   = null;
  var _exposureDrainTimer = 0;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys      = {};
  var _mouseX    = 0;
  var _yaw       = 0;
  var _ePressed  = false;

  /* ── Culture samples ───────────────────────────────────────────────────── */
  var _samples = [];
  /* each: { mesh, light, pos, neutralized, reactionTimer, interacting } */

  /* ── Main culture tank ─────────────────────────────────────────────────── */
  var _tank = null;
  /* { mesh, light, pos, explosive, detonateTimer, interacting, destroyed } */

  /* ── Scientists ────────────────────────────────────────────────────────── */
  var _scientists = [];
  /* each: { mesh, pos, hp, alive, state, fireTimer, alertTimer, targetPos } */

  /* ── Autosampler robot ─────────────────────────────────────────────────── */
  var _robot = null;
  /* { mesh, baseMesh, pos, speed, alive, reached } */

  /* ── Specimen containers ───────────────────────────────────────────────── */
  var _specimens = [];
  /* each: { mesh, pos, intact, cloud, cloudTimer, cloudLight } */

  /* ── Decontamination shower ────────────────────────────────────────────── */
  var _deconStation  = null;
  var _deconMesh     = null;
  var _deconInteracting = false;
  var _deconTimer    = 0;

  /* ── Blast doors / lockdown ────────────────────────────────────────────── */
  var _blastDoors = [];
  /* each: { mesh, pos, sealed, hackTimer, interacting } */

  /* ── Player projectiles ────────────────────────────────────────────────── */
  var _playerShots = [];
  /* each: { mesh, vel, life } */

  /* ── Sci projectiles (tranq) ───────────────────────────────────────────── */
  var _tranqShots = [];
  /* each: { mesh, vel, life } */

  /* ── Interaction state ─────────────────────────────────────────────────── */
  var _interactTarget  = null;
  var _interactTimer   = 0;
  var _interactDuration = 0;
  var _interactType    = '';

  /* ── Environment meshes ────────────────────────────────────────────────── */
  var _envMeshes  = [];
  var _envLights  = [];

  /* ── Pathogen cloud VFX ────────────────────────────────────────────────── */
  var _pathClouds = [];
  /* each: { mesh, light, life, pos } */

  /* ── HUD elements ──────────────────────────────────────────────────────── */
  var _hud       = null;
  var _victoryEl = null;
  var _defeatEl  = null;

  /* ── Internal timer ─────────────────────────────────────────────────────── */
  var _lastTime  = 0;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, emissive, emissiveIntensity) {
    var mat;
    if (emissive !== undefined) {
      mat = new THREE.MeshLambertMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity !== undefined ? emissiveIntensity : 0.4
      });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }
    return new THREE.Mesh(geo, mat);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD ENVIRONMENT
  ════════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    var geo, mesh, light, i;

    /* Ambient lighting — dim green-tinted lab */
    var ambient = new THREE.AmbientLight(0x112211, 0.5);
    _scene.add(ambient);
    _envLights.push(ambient);

    /* Ground */
    geo  = new THREE.BoxGeometry(60, 0.3, 60);
    mesh = makeMesh(geo, 0x222222);
    mesh.position.set(0, -0.15, 0);
    _scene.add(mesh);
    _envMeshes.push(mesh);

    /* ── Main facility shell 30x6x25 ── */
    geo  = new THREE.BoxGeometry(30, 6, 25);
    mesh = makeMesh(geo, 0x445544);
    mesh.position.set(0, 3, 0);
    _scene.add(mesh);
    _envMeshes.push(mesh);

    /* ── Airlock entry 3x4x3 at front ── */
    geo  = new THREE.BoxGeometry(3, 4, 3);
    mesh = makeMesh(geo, 0x336633);
    mesh.position.set(0, 2, -14.5);
    _scene.add(mesh);
    _envMeshes.push(mesh);

    /* ── 4 lab rooms 10x4x8 arranged inside facility ── */
    var roomPositions = [
      { x: -8,  z: -6  },
      { x:  8,  z: -6  },
      { x: -8,  z:  6  },
      { x:  8,  z:  6  }
    ];
    for (i = 0; i < roomPositions.length; i++) {
      geo  = new THREE.BoxGeometry(10, 4, 8);
      mesh = makeMesh(geo, 0x334433);
      mesh.position.set(roomPositions[i].x, 2, roomPositions[i].z);
      _scene.add(mesh);
      _envMeshes.push(mesh);

      /* Room lighting */
      light = new THREE.PointLight(0x336633, 0.6, 15);
      light.position.set(roomPositions[i].x, 3.5, roomPositions[i].z);
      _scene.add(light);
      _envLights.push(light);
    }

    /* ── Corridors between rooms (simple box connectors) ── */
    var corridors = [
      { x:  0,  z: -6, w: 4, d: 2 },
      { x:  0,  z:  6, w: 4, d: 2 },
      { x: -8,  z:  0, w: 2, d: 4 },
      { x:  8,  z:  0, w: 2, d: 4 }
    ];
    for (i = 0; i < corridors.length; i++) {
      geo  = new THREE.BoxGeometry(corridors[i].w, 3, corridors[i].d);
      mesh = makeMesh(geo, 0x334433);
      mesh.position.set(corridors[i].x, 1.5, corridors[i].z);
      _scene.add(mesh);
      _envMeshes.push(mesh);
    }

    /* ── Containment chamber 8x5x8 at rear center ── */
    geo  = new THREE.BoxGeometry(8, 5, 8);
    mesh = makeMesh(geo, 0x223322);
    mesh.position.set(0, 2.5, 14);
    _scene.add(mesh);
    _envMeshes.push(mesh);

    /* Biohazard glow PointLight */
    light = new THREE.PointLight(0x44FF44, 1.2, 14);
    light.position.set(0, 4, 14);
    _scene.add(light);
    _envLights.push(light);

    /* ── Decontamination shower station ── */
    geo  = new THREE.BoxGeometry(2, 3, 2);
    _deconMesh = makeMesh(geo, 0x225522, 0x22FF22, 0.2);
    _deconMesh.position.set(-12, 1.5, 0);
    _scene.add(_deconMesh);
    _envMeshes.push(_deconMesh);
    _deconStation = { pos: { x: -12, y: 1.5, z: 0 } };

    /* Shower light */
    light = new THREE.PointLight(0x22FF66, 0.5, 6);
    light.position.set(-12, 3, 0);
    _scene.add(light);
    _envLights.push(light);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD CULTURE SAMPLES (3)
  ════════════════════════════════════════════════════════════════════════ */

  function buildSamples() {
    /* One per lab room except containment-side rooms — use 3 of the 4 rooms */
    var samplePositions = [
      { x: -8,  z: -6  },
      { x:  8,  z: -6  },
      { x: -8,  z:  6  }
    ];
    var i, geo, mesh, light;
    for (i = 0; i < samplePositions.length; i++) {
      geo  = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      mesh = makeMesh(geo, 0x44FF44, 0x22CC22, 0.8);
      mesh.position.set(samplePositions[i].x, 1.5, samplePositions[i].z);
      _scene.add(mesh);

      light = new THREE.PointLight(0x44FF44, 0.8, 5);
      light.position.set(samplePositions[i].x, 1.5, samplePositions[i].z);
      _scene.add(light);

      _samples.push({
        mesh:          mesh,
        light:         light,
        pos:           { x: samplePositions[i].x, y: 1.5, z: samplePositions[i].z },
        neutralized:   false,
        reactionTimer: 0,
        interacting:   false
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD MAIN CULTURE TANK
  ════════════════════════════════════════════════════════════════════════ */

  function buildTank() {
    var geo  = new THREE.CylinderGeometry(2, 2, 4, 12);
    var mesh = makeMesh(geo, 0x336633, 0x22AA22, 0.3);
    mesh.position.set(0, 2, 14);
    _scene.add(mesh);

    var light = new THREE.PointLight(0x44FF44, 1.0, 8);
    light.position.set(0, 4, 14);
    _scene.add(light);

    _tank = {
      mesh:          mesh,
      light:         light,
      pos:           { x: 0, y: 2, z: 14 },
      explosive:     false,
      detonateTimer: 0,
      interacting:   false,
      destroyed:     false
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD SCIENTISTS (8)
  ════════════════════════════════════════════════════════════════════════ */

  function buildScientists() {
    var sciPositions = [
      { x: -8,  z: -8  },
      { x:  8,  z: -8  },
      { x: -8,  z:  8  },
      { x:  8,  z:  8  },
      { x: -5,  z: -2  },
      { x:  5,  z: -2  },
      { x: -4,  z: 12  },
      { x:  4,  z: 12  }
    ];
    var i, geo, head, body, mesh, group;
    for (i = 0; i < sciPositions.length; i++) {
      group = new THREE.Group();

      /* Lab coat body */
      geo  = new THREE.BoxGeometry(0.7, 1.4, 0.5);
      body = makeMesh(geo, 0x225522);
      body.position.set(0, 0.7, 0);
      group.add(body);

      /* Head */
      geo  = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      head = makeMesh(geo, 0xCCAA88);
      head.position.set(0, 1.65, 0);
      group.add(head);

      group.position.set(sciPositions[i].x, 0, sciPositions[i].z);
      _scene.add(group);

      _scientists.push({
        mesh:       group,
        pos:        { x: sciPositions[i].x, y: 0, z: sciPositions[i].z },
        hp:         60,
        alive:      true,
        state:      'patrol',   /* patrol | alert | attack */
        fireTimer:  2 + Math.random() * 2,
        alertTimer: 0,
        targetPos:  { x: 0, z: 0 }
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD AUTOSAMPLER ROBOT
  ════════════════════════════════════════════════════════════════════════ */

  function buildRobot() {
    var group = new THREE.Group();
    var geo, mesh;

    /* Cylinder body */
    geo  = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 10);
    mesh = makeMesh(geo, 0x445544);
    mesh.position.set(0, 0.8, 0);
    group.add(mesh);

    /* Wheel base */
    geo  = new THREE.BoxGeometry(1.2, 0.4, 1.2);
    mesh = makeMesh(geo, 0x334433);
    mesh.position.set(0, 0.2, 0);
    group.add(mesh);

    /* Sensor arm */
    geo  = new THREE.BoxGeometry(0.15, 0.15, 0.8);
    mesh = makeMesh(geo, 0x556655);
    mesh.position.set(0, 1.3, 0.4);
    group.add(mesh);

    group.position.set(-12, 0, -10);
    _scene.add(group);

    _robot = {
      mesh:    group,
      pos:     { x: -12, y: 0, z: -10 },
      speed:   2.0,
      alive:   true,
      reached: false
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD SPECIMEN CONTAINERS (4)
  ════════════════════════════════════════════════════════════════════════ */

  function buildSpecimens() {
    var specPositions = [
      { x: -10, z: -4  },
      { x:  10, z: -4  },
      { x: -10, z:  4  },
      { x:  10, z:  4  }
    ];
    var i, geo, mesh;
    for (i = 0; i < specPositions.length; i++) {
      geo  = new THREE.BoxGeometry(0.8, 1.0, 0.8);
      mesh = makeMesh(geo, 0x224422);
      mesh.position.set(specPositions[i].x, 0.5, specPositions[i].z);
      _scene.add(mesh);

      _specimens.push({
        mesh:       mesh,
        pos:        { x: specPositions[i].x, y: 0.5, z: specPositions[i].z },
        intact:     true,
        cloud:      null,
        cloudTimer: 0,
        cloudLight: null
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD BLAST DOORS (4, one per lab room entrance)
  ════════════════════════════════════════════════════════════════════════ */

  function buildBlastDoors() {
    var doorPositions = [
      { x: -4,  z: -6,  w: 2, d: 0.3 },
      { x:  4,  z: -6,  w: 2, d: 0.3 },
      { x: -4,  z:  6,  w: 2, d: 0.3 },
      { x:  4,  z:  6,  w: 2, d: 0.3 }
    ];
    var i, geo, mesh;
    for (i = 0; i < doorPositions.length; i++) {
      geo  = new THREE.BoxGeometry(doorPositions[i].w, 3, doorPositions[i].d);
      mesh = makeMesh(geo, 0x556655);
      mesh.position.set(doorPositions[i].x, 1.5, doorPositions[i].z);
      mesh.visible = false; /* hidden until lockdown */
      _scene.add(mesh);

      _blastDoors.push({
        mesh:        mesh,
        pos:         { x: doorPositions[i].x, y: 1.5, z: doorPositions[i].z },
        sealed:      false,
        hackTimer:   0,
        interacting: false
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD PLAYER
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var group = new THREE.Group();
    var geo, mesh;

    /* Player body */
    geo  = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    mesh = makeMesh(geo, 0x334455);
    mesh.position.set(0, 0.6, 0);
    group.add(mesh);

    /* Biosuit overlay */
    geo        = new THREE.BoxGeometry(0.75, 1.4, 0.55);
    _suitMesh  = makeMesh(geo, 0x445544, 0x224422, 0.1);
    _suitMesh.position.set(0, 0.7, 0);
    group.add(_suitMesh);

    /* Head */
    geo  = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    mesh = makeMesh(geo, 0x445544);
    mesh.position.set(0, 1.55, 0);
    group.add(mesh);

    group.position.set(_playerPos.x, _playerPos.y - 1, _playerPos.z);
    _scene.add(group);
    _playerMesh = group;

    /* Exposure aura light (hidden until exposed) */
    _exposureLight = new THREE.PointLight(0x44FF44, 0, 4);
    _exposureLight.position.set(_playerPos.x, _playerPos.y + 1, _playerPos.z);
    _scene.add(_exposureLight);
    _envLights.push(_exposureLight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    if (!_hud) {
      _hud = document.createElement('div');
      _hud.id = 'biolab-hud';
      _hud.style.cssText = [
        'position:fixed',
        'top:12px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,20,0,0.82)',
        'color:#44FF44',
        'font-family:monospace',
        'font-size:13px',
        'padding:6px 14px',
        'border:1px solid #224422',
        'border-radius:3px',
        'pointer-events:none',
        'z-index:9999',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(_hud);
    }

    if (!_victoryEl) {
      _victoryEl = document.createElement('div');
      _victoryEl.style.cssText = [
        'position:fixed',
        'top:40%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'background:rgba(0,30,0,0.9)',
        'color:#44FF88',
        'font-family:monospace',
        'font-size:28px',
        'font-weight:bold',
        'padding:24px 40px',
        'border:2px solid #44FF44',
        'border-radius:6px',
        'pointer-events:none',
        'z-index:10000',
        'display:none',
        'text-align:center'
      ].join(';');
      _victoryEl.textContent = 'CONTAINMENT SECURED\nPATHOGEN NEUTRALIZED';
      document.body.appendChild(_victoryEl);
    }

    if (!_defeatEl) {
      _defeatEl = document.createElement('div');
      _defeatEl.style.cssText = [
        'position:fixed',
        'top:40%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'background:rgba(20,0,0,0.9)',
        'color:#FF4444',
        'font-family:monospace',
        'font-size:28px',
        'font-weight:bold',
        'padding:24px 40px',
        'border:2px solid #FF2222',
        'border-radius:6px',
        'pointer-events:none',
        'z-index:10000',
        'display:none',
        'text-align:center'
      ].join(';');
      _defeatEl.textContent = 'CONTAINMENT BREACH\nPATHOGEN RELEASED';
      document.body.appendChild(_defeatEl);
    }
  }

  function updateHUD() {
    if (!_hud) return;

    var mins    = Math.floor(_breachTimer / 60);
    var secs    = Math.floor(_breachTimer % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var neutralized = 0;
    var i;
    for (i = 0; i < _samples.length; i++) {
      if (_samples[i].neutralized) neutralized++;
    }

    var sciAlive = 0;
    for (i = 0; i < _scientists.length; i++) {
      if (_scientists[i].alive) sciAlive++;
    }

    var tankStatus = 'LOCKED';
    if (_tank) {
      if (_tank.destroyed) {
        tankStatus = 'DESTROYED';
      } else if (_tank.explosive) {
        tankStatus = 'ARMED';
      } else if (neutralized >= 3) {
        tankStatus = 'READY';
      }
    }

    var timeColor  = _breachTimer < 120 ? '#FF2222' : '#44FF44';
    var suitColor  = _suitIntegrity < 30 ? '#FF4444' : (_suitIntegrity < 60 ? '#FFAA22' : '#44FF44');

    _hud.innerHTML =
      'BIO-LAB ' +
      '[<span style="color:' + timeColor + '">CONTAINMENT: ' + timeStr + '</span>] ' +
      '[SAMPLES: ' + neutralized + '/3] ' +
      '[<span style="color:' + suitColor + '">SUIT: ' + Math.floor(_suitIntegrity) + '%</span>] ' +
      '[SCIENTISTS: ' + sciAlive + '] | ' +
      'TANK: ' + tankStatus;
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launch() {
    if (_active) return;
    _active        = true;
    _victory       = false;
    _defeat        = false;
    _breachTimer   = 360;
    _alarmTriggered = false;
    _suitIntegrity  = 100;
    _exposed        = false;
    _playerHP       = 100;
    _playerPos      = { x: 0, y: 1, z: -10 };
    _interactTarget = null;
    _interactTimer  = 0;
    _interactType   = '';

    buildEnvironment();
    buildSamples();
    buildTank();
    buildScientists();
    buildRobot();
    buildSpecimens();
    buildBlastDoors();
    buildPlayer();

    if (_hud)      { _hud.style.display      = 'block'; }
    if (_victoryEl){ _victoryEl.style.display = 'none';  }
    if (_defeatEl) { _defeatEl.style.display  = 'none';  }

    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function movePlayer(dt) {
    var speed = _playerSpeed;
    var dx = 0, dz = 0;
    var cos = Math.cos(_yaw);
    var sin = Math.sin(_yaw);

    if (_keys['KeyW'] || _keys['ArrowUp'])    { dx += sin; dz += cos; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { dx -= sin; dz -= cos; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { dx += cos; dz -= sin; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { dx -= cos; dz += sin; }

    var len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) { dx /= len; dz /= len; }

    _playerPos.x += dx * speed * dt;
    _playerPos.z += dz * speed * dt;

    /* Clamp inside facility roughly */
    _playerPos.x = Math.max(-14, Math.min(14, _playerPos.x));
    _playerPos.z = Math.max(-14, Math.min(18, _playerPos.z));

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y - 1, _playerPos.z);
      _playerMesh.rotation.y = -_yaw;
    }
    if (_exposureLight) {
      _exposureLight.position.set(_playerPos.x, _playerPos.y + 1, _playerPos.z);
    }

    /* Camera follow */
    if (_camera) {
      _camera.position.set(
        _playerPos.x + Math.sin(_yaw) * 0,
        _playerPos.y + 8,
        _playerPos.z - 12
      );
      _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FIRE PLAYER SHOT
  ════════════════════════════════════════════════════════════════════════ */

  function firePlayerShot() {
    var geo  = new THREE.BoxGeometry(0.1, 0.1, 0.4);
    var mesh = makeMesh(geo, 0x88FFAA, 0x44FF44, 0.9);
    mesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(mesh);

    var vx = Math.sin(_yaw) * 20;
    var vz = Math.cos(_yaw) * 20;

    _playerShots.push({
      mesh: mesh,
      vel:  { x: vx, y: 0, z: vz },
      life: 2.0
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE PLAYER SHOTS
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayerShots(dt) {
    var i, j, shot, sci, sp, dx, dz, d;
    for (i = _playerShots.length - 1; i >= 0; i--) {
      shot = _playerShots[i];
      shot.life -= dt;
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.z += shot.vel.z * dt;

      /* Hit scientists */
      for (j = 0; j < _scientists.length; j++) {
        sci = _scientists[j];
        if (!sci.alive) continue;
        dx = shot.mesh.position.x - sci.pos.x;
        dz = shot.mesh.position.z - sci.pos.z;
        d  = Math.sqrt(dx * dx + dz * dz);
        if (d < 1.0) {
          sci.hp -= 25;
          if (sci.hp <= 0) {
            sci.alive = false;
            sci.mesh.visible = false;
          }
          shot.life = 0;
          break;
        }
      }

      /* Hit specimen containers */
      for (j = 0; j < _specimens.length; j++) {
        sp = _specimens[j];
        if (!sp.intact) continue;
        dx = shot.mesh.position.x - sp.pos.x;
        dz = shot.mesh.position.z - sp.pos.z;
        d  = Math.sqrt(dx * dx + dz * dz);
        if (d < 1.2) {
          releaseSpecimenCloud(sp);
          shot.life = 0;
          break;
        }
      }

      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _playerShots.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SPECIMEN CLOUD
  ════════════════════════════════════════════════════════════════════════ */

  function releaseSpecimenCloud(sp) {
    if (!sp.intact) return;
    sp.intact = false;
    sp.mesh.material.color.setHex(0x334433);
    sp.mesh.material.emissive.setHex(0x000000);

    /* Visual cloud */
    var geo  = new THREE.BoxGeometry(3, 2, 3);
    var mesh = makeMesh(geo, 0x66FF22, 0x44CC11, 0.6);
    mesh.position.set(sp.pos.x, sp.pos.y + 1, sp.pos.z);
    mesh.material.transparent = true;
    mesh.material.opacity      = 0.55;
    _scene.add(mesh);

    var light = new THREE.PointLight(0x66FF22, 1.0, 5);
    light.position.set(sp.pos.x, sp.pos.y + 1, sp.pos.z);
    _scene.add(light);

    sp.cloud      = mesh;
    sp.cloudTimer = 3.0;
    sp.cloudLight = light;

    /* Immediate suit damage if near player */
    var dx = _playerPos.x - sp.pos.x;
    var dz = _playerPos.z - sp.pos.z;
    if (Math.sqrt(dx * dx + dz * dz) < 5) {
      damageSuit(30);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE SPECIMEN CLOUDS
  ════════════════════════════════════════════════════════════════════════ */

  function updateSpecimenClouds(dt) {
    var i, sp, dx, dz;
    for (i = 0; i < _specimens.length; i++) {
      sp = _specimens[i];
      if (sp.intact || !sp.cloud) continue;
      sp.cloudTimer -= dt;
      if (sp.cloudTimer <= 0) {
        _scene.remove(sp.cloud);
        if (sp.cloudLight) { _scene.remove(sp.cloudLight); }
        sp.cloud      = null;
        sp.cloudLight = null;
      } else {
        /* Damage player if inside cloud */
        dx = _playerPos.x - sp.pos.x;
        dz = _playerPos.z - sp.pos.z;
        if (Math.sqrt(dx * dx + dz * dz) < 5) {
          damageSuit(30 * dt * (1 / 3));
        }
        /* Flicker cloud light */
        if (sp.cloudLight) {
          sp.cloudLight.intensity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BIOSUIT DAMAGE & EXPOSURE
  ════════════════════════════════════════════════════════════════════════ */

  function damageSuit(amount) {
    _suitIntegrity -= amount;
    if (_suitIntegrity < 0) { _suitIntegrity = 0; }
    if (_suitIntegrity === 0 && !_exposed) {
      _exposed = true;
      if (_exposureLight) { _exposureLight.intensity = 1.2; }
    }
    /* Update suit mesh color to reflect damage */
    if (_suitMesh) {
      var t = _suitIntegrity / 100;
      /* Shift from 0x445544 toward red as integrity drops */
      var r = Math.floor(0x44 + (1 - t) * (0xFF - 0x44));
      var g = Math.floor(0x55 * t);
      var b = Math.floor(0x44 * t);
      _suitMesh.material.color.setRGB(r / 255, g / 255, b / 255);
    }
  }

  function updateExposure(dt) {
    if (!_exposed) return;
    _playerHP -= 2 * dt;
    if (_exposureLight) {
      _exposureLight.intensity = 1.0 + Math.sin(Date.now() * 0.006) * 0.4;
    }
    if (_playerHP <= 0) {
      _playerHP = 0;
      triggerDefeat();
    }
  }

  function decontaminate() {
    _exposed        = false;
    _suitIntegrity  = 100;
    if (_exposureLight) { _exposureLight.intensity = 0; }
    if (_suitMesh) { _suitMesh.material.color.setHex(0x445544); }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCIENTISTS AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateScientists(dt) {
    var i, sci, dx, dz, d, angle;
    for (i = 0; i < _scientists.length; i++) {
      sci = _scientists[i];
      if (!sci.alive) continue;

      dx = _playerPos.x - sci.pos.x;
      dz = _playerPos.z - sci.pos.z;
      d  = Math.sqrt(dx * dx + dz * dz);

      if (d < 18) {
        /* Alert: move toward player */
        sci.state = 'attack';
        if (d > 3) {
          var spd = 3.0 * dt;
          sci.pos.x += (dx / d) * spd;
          sci.pos.z += (dz / d) * spd;
        }
        sci.mesh.position.set(sci.pos.x, 0, sci.pos.z);
        angle = Math.atan2(dx, dz);
        sci.mesh.rotation.y = angle;

        /* Fire tranq gun */
        sci.fireTimer -= dt;
        if (sci.fireTimer <= 0 && d < 15) {
          fireTranq(sci);
          sci.fireTimer = 2.5 + Math.random() * 2;
        }

        /* Melee if close */
        if (d < 1.5) {
          damageSuit(20 * dt);
        }
      } else {
        /* Patrol: simple wander */
        sci.state = 'patrol';
        sci.alertTimer += dt;
        if (sci.alertTimer > 3) {
          sci.alertTimer = 0;
          sci.targetPos.x = sci.pos.x + (Math.random() - 0.5) * 6;
          sci.targetPos.z = sci.pos.z + (Math.random() - 0.5) * 6;
        }
        var pdx = sci.targetPos.x - sci.pos.x;
        var pdz = sci.targetPos.z - sci.pos.z;
        var pd  = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pd > 0.2) {
          sci.pos.x += (pdx / pd) * 1.5 * dt;
          sci.pos.z += (pdz / pd) * 1.5 * dt;
          sci.mesh.position.set(sci.pos.x, 0, sci.pos.z);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TRANQ GUN
  ════════════════════════════════════════════════════════════════════════ */

  function fireTranq(sci) {
    var geo  = new THREE.BoxGeometry(0.08, 0.08, 0.3);
    var mesh = makeMesh(geo, 0xAADD44, 0x88BB22, 0.7);
    mesh.position.set(sci.pos.x, 1.0, sci.pos.z);
    _scene.add(mesh);

    var dx = _playerPos.x - sci.pos.x;
    var dz = _playerPos.z - sci.pos.z;
    var d  = Math.sqrt(dx * dx + dz * dz) || 1;

    _tranqShots.push({
      mesh: mesh,
      vel:  { x: (dx / d) * 14, y: 0, z: (dz / d) * 14 },
      life: 2.0
    });
  }

  function updateTranqShots(dt) {
    var i, shot, dx, dz, d;
    for (i = _tranqShots.length - 1; i >= 0; i--) {
      shot = _tranqShots[i];
      shot.life -= dt;
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.z += shot.vel.z * dt;

      /* Hit player */
      dx = shot.mesh.position.x - _playerPos.x;
      dz = shot.mesh.position.z - _playerPos.z;
      d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.8) {
        /* Suit breach: temporary exposure damage */
        damageSuit(8);
        shot.life = 0;
      }

      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _tranqShots.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     AUTOSAMPLER ROBOT
  ════════════════════════════════════════════════════════════════════════ */

  function updateRobot(dt) {
    if (!_robot || !_robot.alive || _robot.reached) return;
    if (!_tank || _tank.destroyed) return;

    var tx = _tank.pos.x;
    var tz = _tank.pos.z;
    var dx = tx - _robot.pos.x;
    var dz = tz - _robot.pos.z;
    var d  = Math.sqrt(dx * dx + dz * dz);

    if (d < 1.5) {
      _robot.reached  = true;
      /* Accelerate breach timer: -60 seconds */
      _breachTimer -= 60;
      if (_breachTimer < 0) { _breachTimer = 0; }
      return;
    }

    _robot.pos.x += (dx / d) * _robot.speed * dt;
    _robot.pos.z += (dz / d) * _robot.speed * dt;
    _robot.mesh.position.set(_robot.pos.x, 0, _robot.pos.z);
    _robot.mesh.rotation.y += dt * 1.5;

    /* Player can destroy robot by shooting near it */
  }

  function checkRobotHit() {
    var i, shot, dx, dz, d;
    if (!_robot || !_robot.alive) return;
    for (i = _playerShots.length - 1; i >= 0; i--) {
      shot = _playerShots[i];
      dx = shot.mesh.position.x - _robot.pos.x;
      dz = shot.mesh.position.z - _robot.pos.z;
      d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 1.2) {
        _robot.alive = false;
        _robot.mesh.visible = false;
        _scene.remove(shot.mesh);
        _playerShots.splice(i, 1);
        break;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CULTURE SAMPLES — INTERACTION
  ════════════════════════════════════════════════════════════════════════ */

  function tryNeutralizeSample(dt) {
    var i, s, dx, dz, d;
    for (i = 0; i < _samples.length; i++) {
      s = _samples[i];
      if (s.neutralized) continue;

      dx = _playerPos.x - s.pos.x;
      dz = _playerPos.z - s.pos.z;
      d  = Math.sqrt(dx * dx + dz * dz);

      if (d < 2.5) {
        if (_interactType === 'sample' && _interactTarget === i) {
          _interactTimer += dt;
          if (_interactTimer >= 8.0) {
            /* Neutralized */
            s.neutralized = true;
            s.mesh.material.color.setHex(0x888888);
            s.mesh.material.emissive.setHex(0x000000);
            if (s.light) { s.light.intensity = 0; }
            _interactTarget = null;
            _interactTimer  = 0;
            _interactType   = '';
          }
          return;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CULTURE TANK — INTERACTION
  ════════════════════════════════════════════════════════════════════════ */

  function countNeutralized() {
    var n = 0, i;
    for (i = 0; i < _samples.length; i++) {
      if (_samples[i].neutralized) n++;
    }
    return n;
  }

  function tryPlantExplosive(dt) {
    if (!_tank || _tank.destroyed || _tank.explosive) return;
    if (countNeutralized() < 3) return;

    var dx = _playerPos.x - _tank.pos.x;
    var dz = _playerPos.z - _tank.pos.z;
    var d  = Math.sqrt(dx * dx + dz * dz);

    if (d < 3.5) {
      if (_interactType === 'tank') {
        _interactTimer += dt;
        if (_interactTimer >= 10.0) {
          _tank.explosive     = true;
          _tank.detonateTimer = 5.0;
          _tank.mesh.material.color.setHex(0xFF4400);
          _tank.mesh.material.emissive.setHex(0xFF2200);
          _tank.mesh.material.emissiveIntensity = 0.6;
          if (_tank.light) { _tank.light.color.setHex(0xFF4400); }
          _interactTarget = null;
          _interactTimer  = 0;
          _interactType   = '';
        }
        return;
      }
    }
  }

  function updateTankDetonate(dt) {
    if (!_tank || !_tank.explosive || _tank.destroyed) return;
    _tank.detonateTimer -= dt;

    /* Flicker */
    if (_tank.light) {
      _tank.light.intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.5;
    }

    if (_tank.detonateTimer <= 0) {
      _tank.destroyed      = true;
      _tank.mesh.visible   = false;
      if (_tank.light) { _tank.light.intensity = 0; }
      triggerVictory();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DECONTAMINATION SHOWER
  ════════════════════════════════════════════════════════════════════════ */

  function tryDecontaminate(dt) {
    if (!_deconStation) return;
    var dx = _playerPos.x - _deconStation.pos.x;
    var dz = _playerPos.z - _deconStation.pos.z;
    var d  = Math.sqrt(dx * dx + dz * dz);

    if (d < 2.5) {
      if (_interactType === 'decon') {
        _interactTimer += dt;
        if (_interactTimer >= 3.0) {
          decontaminate();
          _interactTarget = null;
          _interactTimer  = 0;
          _interactType   = '';
        }
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BLAST DOORS / HACK TERMINALS
  ════════════════════════════════════════════════════════════════════════ */

  function triggerAlarm() {
    if (_alarmTriggered) return;
    _alarmTriggered = true;
    var i;
    for (i = 0; i < _blastDoors.length; i++) {
      _blastDoors[i].sealed       = true;
      _blastDoors[i].mesh.visible = true;
    }
  }

  function tryHackDoor(dt) {
    var i, door, dx, dz, d;
    for (i = 0; i < _blastDoors.length; i++) {
      door = _blastDoors[i];
      if (!door.sealed) continue;

      dx = _playerPos.x - door.pos.x;
      dz = _playerPos.z - door.pos.z;
      d  = Math.sqrt(dx * dx + dz * dz);

      if (d < 2.0) {
        if (_interactType === 'door' && _interactTarget === i) {
          _interactTimer += dt;
          if (_interactTimer >= 12.0) {
            door.sealed       = false;
            door.mesh.visible = false;
            _interactTarget   = null;
            _interactTimer    = 0;
            _interactType     = '';
          }
          return;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     E KEY INTERACTION DISPATCH
  ════════════════════════════════════════════════════════════════════════ */

  function handleEKey() {
    /* Determine best nearby interaction target */
    var i, dx, dz, d;

    /* Check decon station */
    if (_deconStation) {
      dx = _playerPos.x - _deconStation.pos.x;
      dz = _playerPos.z - _deconStation.pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        _interactType   = 'decon';
        _interactTarget = 0;
        _interactTimer  = 0;
        return;
      }
    }

    /* Check samples */
    for (i = 0; i < _samples.length; i++) {
      if (_samples[i].neutralized) continue;
      dx = _playerPos.x - _samples[i].pos.x;
      dz = _playerPos.z - _samples[i].pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        _interactType   = 'sample';
        _interactTarget = i;
        _interactTimer  = 0;
        return;
      }
    }

    /* Check tank */
    if (_tank && !_tank.destroyed && !_tank.explosive && countNeutralized() >= 3) {
      dx = _playerPos.x - _tank.pos.x;
      dz = _playerPos.z - _tank.pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 3.5) {
        _interactType   = 'tank';
        _interactTarget = 0;
        _interactTimer  = 0;
        return;
      }
    }

    /* Check blast doors */
    for (i = 0; i < _blastDoors.length; i++) {
      if (!_blastDoors[i].sealed) continue;
      dx = _playerPos.x - _blastDoors[i].pos.x;
      dz = _playerPos.z - _blastDoors[i].pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.0) {
        _interactType   = 'door';
        _interactTarget = i;
        _interactTimer  = 0;
        return;
      }
    }

    /* Nothing nearby — cancel current interaction */
    _interactTarget = null;
    _interactTimer  = 0;
    _interactType   = '';
  }

  /* ════════════════════════════════════════════════════════════════════════
     BREACH TIMER
  ════════════════════════════════════════════════════════════════════════ */

  function updateBreachTimer(dt) {
    if (_breachTimer <= 0) {
      triggerDefeat();
      return;
    }
    _breachTimer -= dt;
    if (_breachTimer < 0) { _breachTimer = 0; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     VICTORY / DEFEAT
  ════════════════════════════════════════════════════════════════════════ */

  function triggerVictory() {
    if (_victory || _defeat) return;
    _victory = true;
    _active  = false;
    if (_victoryEl) { _victoryEl.style.display = 'block'; }
  }

  function triggerDefeat() {
    if (_victory || _defeat) return;
    _defeat = true;
    _active = false;
    if (_defeatEl) { _defeatEl.style.display = 'block'; }
    /* Biohazard light goes red on breach */
    var i;
    for (i = 0; i < _envLights.length; i++) {
      if (_envLights[i].color && _envLights[i].color.getHex() === 0x44FF44) {
        _envLights[i].color.setHex(0xFF2200);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONTAINMENT GLOW FLICKER
  ════════════════════════════════════════════════════════════════════════ */

  function updateContainmentGlow() {
    /* Flicker the biohazard PointLight in containment chamber */
    var i, l;
    for (i = 0; i < _envLights.length; i++) {
      l = _envLights[i];
      if (l.color && l.color.getHex() === 0x44FF44) {
        var urgency = 1 - (_breachTimer / 360);
        l.intensity = 1.0 + urgency * 0.8 + Math.sin(Date.now() * (0.003 + urgency * 0.01)) * 0.4;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════════════ */

  function reset(scene) {
    _active  = false;
    _victory = false;
    _defeat  = false;

    var i, s = scene || _scene;

    for (i = 0; i < _envMeshes.length; i++) {
      if (s) { s.remove(_envMeshes[i]); }
    }
    for (i = 0; i < _envLights.length; i++) {
      if (s) { s.remove(_envLights[i]); }
    }
    for (i = 0; i < _samples.length; i++) {
      if (s) {
        s.remove(_samples[i].mesh);
        if (_samples[i].light) { s.remove(_samples[i].light); }
        if (_samples[i].cloud) { s.remove(_samples[i].cloud); }
        if (_samples[i].cloudLight) { s.remove(_samples[i].cloudLight); }
      }
    }
    if (_tank && s) {
      s.remove(_tank.mesh);
      if (_tank.light) { s.remove(_tank.light); }
    }
    for (i = 0; i < _scientists.length; i++) {
      if (s) { s.remove(_scientists[i].mesh); }
    }
    if (_robot && s) { s.remove(_robot.mesh); }
    for (i = 0; i < _specimens.length; i++) {
      if (s) {
        s.remove(_specimens[i].mesh);
        if (_specimens[i].cloud)      { s.remove(_specimens[i].cloud);      }
        if (_specimens[i].cloudLight) { s.remove(_specimens[i].cloudLight); }
      }
    }
    for (i = 0; i < _blastDoors.length; i++) {
      if (s) { s.remove(_blastDoors[i].mesh); }
    }
    for (i = 0; i < _playerShots.length; i++) {
      if (s) { s.remove(_playerShots[i].mesh); }
    }
    for (i = 0; i < _tranqShots.length; i++) {
      if (s) { s.remove(_tranqShots[i].mesh); }
    }
    for (i = 0; i < _pathClouds.length; i++) {
      if (s) {
        s.remove(_pathClouds[i].mesh);
        s.remove(_pathClouds[i].light);
      }
    }
    if (_playerMesh && s)    { s.remove(_playerMesh);    }
    if (_exposureLight && s) { s.remove(_exposureLight); }

    _envMeshes    = [];
    _envLights    = [];
    _samples      = [];
    _tank         = null;
    _scientists   = [];
    _robot        = null;
    _specimens    = [];
    _blastDoors   = [];
    _playerShots  = [];
    _tranqShots   = [];
    _pathClouds   = [];
    _playerMesh   = null;
    _suitMesh     = null;
    _deconMesh    = null;
    _deconStation = null;
    _exposureLight = null;

    _breachTimer   = 360;
    _suitIntegrity = 100;
    _exposed       = false;
    _alarmTriggered = false;
    _interactTarget = null;
    _interactTimer  = 0;
    _interactType   = '';

    if (_hud)      { _hud.style.display      = 'none'; }
    if (_victoryEl){ _victoryEl.style.display = 'none'; }
    if (_defeatEl) { _defeatEl.style.display  = 'none'; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  var _fireCooldown = 0;

  function onKeyDown(e) {
    _keys[e.code] = true;
    var now = Date.now();

    /* B + L activation combo */
    if (e.code === 'KeyB') { _blPressTime.B = now; }
    if (e.code === 'KeyL') { _blPressTime.L = now; }
    if (Math.abs(_blPressTime.B - _blPressTime.L) <= BL_WINDOW &&
        _blPressTime.B > 0 && _blPressTime.L > 0) {
      if (!_active && !_victory && !_defeat) {
        _blPressTime.B = 0;
        _blPressTime.L = 0;
        launch();
      }
    }

    if (!_active) return;

    /* E key — start interaction */
    if (e.code === 'KeyE') {
      _ePressed = true;
      handleEKey();
    }

    /* Trigger alarm via F key (simulation of being spotted / triggering alarm) */
    if (e.code === 'KeyF') {
      triggerAlarm();
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyE') {
      _ePressed     = false;
      /* Cancel ongoing interaction if E released */
      _interactTarget = null;
      _interactTimer  = 0;
      _interactType   = '';
    }
  }

  function onMouseMove(e) {
    if (!_active) return;
    var rect = _canvas
      ? _canvas.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var nx = (e.clientX - rect.left) / rect.width * 2 - 1;
    _mouseX = nx;
    _yaw    = -nx * Math.PI;
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0 && _fireCooldown <= 0) {
      firePlayerShot();
      _fireCooldown = 0.18;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function update(dt, scene, camera, canvas) {
    if (scene)  { _scene  = scene;  }
    if (camera) { _camera = camera; }
    if (canvas) { _canvas = canvas; }

    if (!_active) return;

    /* Clamp dt to prevent spiral of death */
    if (dt > 0.1) { dt = 0.1; }

    _fireCooldown -= dt;
    if (_fireCooldown < 0) { _fireCooldown = 0; }

    movePlayer(dt);
    updatePlayerShots(dt);
    updateTranqShots(dt);
    updateScientists(dt);
    updateRobot(dt);
    checkRobotHit();
    updateSpecimenClouds(dt);
    updateExposure(dt);
    updateBreachTimer(dt);
    updateContainmentGlow();
    updateTankDetonate(dt);

    /* Ongoing interactions (E held) */
    if (_ePressed && _interactType !== '') {
      if (_interactType === 'sample')  { tryNeutralizeSample(dt); }
      if (_interactType === 'tank')    { tryPlantExplosive(dt);   }
      if (_interactType === 'decon')   { tryDecontaminate(dt);    }
      if (_interactType === 'door')    { tryHackDoor(dt);         }
    }

    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    buildHUD();
    if (_hud) { _hud.style.display = 'none'; }

    window.addEventListener('keydown',   onKeyDown);
    window.addEventListener('keyup',     onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
  }

  return {
    init:   init,
    update: function (dt, scene, camera, canvas) { update(dt, scene, camera, canvas); },
    reset:  function (scene) { reset(scene); }
  };

}());
