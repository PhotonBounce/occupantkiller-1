/* ───────────────────────────────────────────────────────────────────────────
   zombie-apocalypse.js — Zombie Apocalypse Mini-Game
   API: window.ZombieApocalypse = { init, update, reset }
   Activation: Z + A simultaneous keypress (both keys within 400ms)

   Zombie Types:
     WALKER  — BoxGeometry, 0x557755, slow, 1-hit melee, 40 HP
     RUNNER  — BoxGeometry, 0x446644, 3x speed, lunges, 30 HP
     ARMORED — BoxGeometry 3 layers, 0x556655/0x445544/0x334433, each layer separate hits, 80 HP
     SPITTER — BoxGeometry, 0x447744, ranged acid SphereGeometry 0x44FF22 r=0.3, 60 HP

   Boss Zombies:
     GIANT   — BoxGeometry 3x scale, 0x664422, 150 HP (wave 7+)
     BOSS    — CylinderGeometry, 0x882222, 500 HP (wave 10), throws body parts

   Controls:
     Z + A   → activate zombie apocalypse
     WASD    → move player
     Mouse   → aim / look
     Click   → fire weapon
     B       → place barricade (near wall gap)
     E       → repair barricade / board helicopter / interact
     R       → reload
   ─────────────────────────────────────────────────────────────────────────── */

window.ZombieApocalypse = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active       = false;
  var _wave         = 0;
  var _maxWaves     = 10;
  var _waveActive   = false;
  var _waveDelay    = 0;
  var _victory      = false;
  var _defeat       = false;
  var _score        = 0;

  /* ── Key-combo tracking: Z+A within 400ms ──────────────────────────────── */
  var _zaPressTime  = { Z: 0, A: 0 };
  var ZA_WINDOW     = 400;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerMesh   = null;
  var _playerHP     = 100;
  var _playerMaxHP  = 100;
  var _playerPos    = { x: 0, y: 1, z: 0 };
  var _playerSpeed  = 8;
  var _fireCooldown = 0;
  var _ammo         = 90;
  var _maxAmmo      = 90;
  var _reloading    = false;
  var _reloadTimer  = 0;

  /* ── Infection ─────────────────────────────────────────────────────────── */
  var _infected         = false;
  var _infectionTimer   = 0;
  var _infectionDrainTimer = 0;

  /* ── Input state ───────────────────────────────────────────────────────── */
  var _keys     = {};
  var _mouseX   = 0;
  var _mouseY   = 0;
  var _yaw      = 0;
  var _pitch    = 0;
  var _mouseDown = false;

  /* ── Zombies ───────────────────────────────────────────────────────────── */
  var _zombies = [];
  // Each: { mesh, type, hp, maxHp, vel, alive, armorLayers, lungeTimer, fireTimer, armorMeshes }

  /* ── Projectiles ───────────────────────────────────────────────────────── */
  var _playerShots = []; // { mesh, vel, life }
  var _zombieShots = []; // { mesh, vel, life, damage, poisoned }
  var _bossThrows  = []; // { mesh, vel, life }

  /* ── Barricades ────────────────────────────────────────────────────────── */
  var _barricades = []; // { mesh, hp, maxHp, pos }
  var _maxBarricades = 5;
  var _repairTimer = 0;
  var _repairTarget = null;

  /* ── Supply drops ──────────────────────────────────────────────────────── */
  var _supplyDrops = [];   // { mesh, type, pos, timer, collected }
  var _supplyTimer = 0;

  /* ── Generator ─────────────────────────────────────────────────────────── */
  var _generatorMesh   = null;
  var _generatorTimer  = 180; // 3 minutes
  var _generatorOn     = true;
  var _floodLights     = []; // PointLight x4

  /* ── First aid stations ────────────────────────────────────────────────── */
  var _aidStations = []; // { mesh, pos, cooldown }

  /* ── Helicopter escape ─────────────────────────────────────────────────── */
  var _helicopterMesh     = null;
  var _helicopterArrived  = false;
  var _helicopterTimer    = 0;
  var _helicopterDeparted = false;

  /* ── Environment objects ───────────────────────────────────────────────── */
  var _envObjects = [];

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud        = null;
  var _waveAnnEl  = null;
  var _waveAnnTimer = 0;
  var _victoryEl  = null;
  var _defeatEl   = null;

  /* ── Internal timer ─────────────────────────────────────────────────────── */
  var _lastTime   = 0;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY / MATERIAL HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, emissive, emissiveInt) {
    var mat;
    if (emissive !== undefined) {
      mat = new THREE.MeshLambertMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: emissiveInt !== undefined ? emissiveInt : 0.3
      });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }
    return new THREE.Mesh(geo, mat);
  }

  /* ════════════════════════════════════════════════════════════════════════
     CITY ENVIRONMENT
  ════════════════════════════════════════════════════════════════════════ */

  function buildCity() {
    var i, geo, mesh, angle, bx, bz, bw, bh, bd, rx, rz, px, pz, vx, vz;

    /* Ground */
    geo  = new THREE.BoxGeometry(160, 0.4, 160);
    mesh = makeMesh(geo, 0x332222);
    mesh.position.set(0, -0.2, 0);
    _scene.add(mesh);
    _envObjects.push(mesh);

    /* 6 ruined buildings in a ring */
    var buildingColors = [0x554444, 0x665555, 0x443333, 0x554444, 0x665555, 0x443333];
    for (i = 0; i < 6; i++) {
      angle = (i / 6) * Math.PI * 2;
      bx = Math.cos(angle) * 30;
      bz = Math.sin(angle) * 30;
      bw = 7 + Math.random() * 4;
      bd = 7 + Math.random() * 4;
      bh = 6 + Math.random() * 10;

      geo  = new THREE.BoxGeometry(bw, bh, bd);
      mesh = makeMesh(geo, buildingColors[i]);
      mesh.position.set(bx, bh * 0.5, bz);
      _scene.add(mesh);
      _envObjects.push(mesh);

      /* Broken top */
      geo  = new THREE.BoxGeometry(bw * 0.5, bh * 0.25, bd * 0.5);
      mesh = makeMesh(geo, buildingColors[(i + 1) % 3]);
      mesh.position.set(bx + (Math.random() - 0.5) * 2,
                        bh + bh * 0.12,
                        bz + (Math.random() - 0.5) * 2);
      mesh.rotation.y = Math.random() * 0.6;
      _scene.add(mesh);
      _envObjects.push(mesh);
    }

    /* Rubble piles between buildings */
    for (i = 0; i < 6; i++) {
      angle = ((i + 0.5) / 6) * Math.PI * 2;
      rx = Math.cos(angle) * 22;
      rz = Math.sin(angle) * 22;

      geo  = new THREE.BoxGeometry(3 + Math.random() * 2, 0.8 + Math.random() * 1.2, 3 + Math.random() * 2);
      mesh = makeMesh(geo, 0x553322);
      mesh.position.set(rx, 0.5, rz);
      mesh.rotation.y = Math.random() * Math.PI;
      _scene.add(mesh);
      _envObjects.push(mesh);

      /* Secondary rubble chunk */
      geo  = new THREE.BoxGeometry(1.5 + Math.random(), 0.5 + Math.random() * 0.8, 1.5 + Math.random());
      mesh = makeMesh(geo, 0x443311);
      mesh.position.set(rx + (Math.random() - 0.5) * 3,
                        0.3,
                        rz + (Math.random() - 0.5) * 3);
      mesh.rotation.y = Math.random() * Math.PI;
      _scene.add(mesh);
      _envObjects.push(mesh);
    }

    /* Overturned vehicles */
    var vehiclePositions = [
      [12, 8], [-12, -8], [8, -15], [-8, 15], [18, -5], [-18, 5]
    ];
    for (i = 0; i < vehiclePositions.length; i++) {
      vx = vehiclePositions[i][0];
      vz = vehiclePositions[i][1];

      /* Car body */
      geo  = new THREE.BoxGeometry(2, 1.2, 4);
      mesh = makeMesh(geo, 0x443322);
      mesh.position.set(vx, 0.6, vz);
      mesh.rotation.z = Math.PI * 0.5 * (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.3);
      mesh.rotation.y = Math.random() * Math.PI;
      _scene.add(mesh);
      _envObjects.push(mesh);
    }

    /* Outer boundary walls (low) */
    var wallData = [
      [0, 0, 80, 2, 0.5],
      [0, 0, -80, 2, 0.5],
      [80, 0, 0, 0.5, 2],
      [-80, 0, 0, 0.5, 2]
    ];
    for (i = 0; i < wallData.length; i++) {
      geo  = new THREE.BoxGeometry(wallData[i][3] * 2, 2, wallData[i][4] * 2);
      mesh = makeMesh(geo, 0x332211);
      mesh.position.set(wallData[i][0], 1, wallData[i][1]);
      mesh.scale.set(wallData[i][3] === 0.5 ? 1 : 80, 1, wallData[i][4] === 0.5 ? 80 : 1);
      _scene.add(mesh);
      _envObjects.push(mesh);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GENERATOR
  ════════════════════════════════════════════════════════════════════════ */

  function buildGenerator() {
    var geo, mesh, light, i, angle, lx, lz;

    /* Generator cylinder in center */
    geo  = new THREE.CylinderGeometry(1.2, 1.5, 2.5, 8);
    mesh = makeMesh(geo, 0x445544, 0x224422, 0.5);
    mesh.position.set(0, 1.25, 0);
    _scene.add(mesh);
    _envObjects.push(mesh);
    _generatorMesh = mesh;

    /* 4 flood-light towers at compass points */
    var towerPositions = [[18, 0], [-18, 0], [0, 18], [0, -18]];
    for (i = 0; i < 4; i++) {
      lx = towerPositions[i][0];
      lz = towerPositions[i][1];

      /* Tower pole */
      geo  = new THREE.BoxGeometry(0.4, 8, 0.4);
      mesh = makeMesh(geo, 0x333333);
      mesh.position.set(lx, 4, lz);
      _scene.add(mesh);
      _envObjects.push(mesh);

      /* Light housing */
      geo  = new THREE.BoxGeometry(1.2, 0.5, 0.6);
      mesh = makeMesh(geo, 0x444444);
      mesh.position.set(lx, 8.2, lz);
      _scene.add(mesh);
      _envObjects.push(mesh);

      /* Flood light */
      light = new THREE.PointLight(0xFFAA44, _generatorOn ? 2.5 : 0, 40);
      light.position.set(lx, 8, lz);
      _scene.add(light);
      _floodLights.push(light);
    }

    /* Ambient dim light always present */
    var ambient = new THREE.AmbientLight(0x221100, 0.5);
    _scene.add(ambient);
    _envObjects.push(ambient);

    /* Directional moonlight */
    var moon = new THREE.DirectionalLight(0x334455, 0.4);
    moon.position.set(10, 30, 10);
    _scene.add(moon);
    _envObjects.push(moon);
  }

  /* ════════════════════════════════════════════════════════════════════════
     FIRST AID STATIONS
  ════════════════════════════════════════════════════════════════════════ */

  function buildAidStations() {
    var i, geo, mesh, positions;
    positions = [[-25, -25], [25, 25]];
    for (i = 0; i < 2; i++) {
      geo  = new THREE.BoxGeometry(1.5, 1.8, 1.5);
      mesh = makeMesh(geo, 0x44FF44, 0x22AA22, 0.6);
      mesh.position.set(positions[i][0], 0.9, positions[i][1]);
      _scene.add(mesh);
      _envObjects.push(mesh);
      _aidStations.push({ mesh: mesh, pos: { x: positions[i][0], y: 0.9, z: positions[i][1] }, cooldown: 0 });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var geo, mesh;

    /* Player body */
    geo  = new THREE.BoxGeometry(0.8, 1.6, 0.8);
    mesh = makeMesh(geo, 0x3355AA, 0x1133AA, 0.2);
    mesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(mesh);
    _playerMesh = mesh;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ZOMBIE SPAWNING
  ════════════════════════════════════════════════════════════════════════ */

  function spawnZombie(type, x, z) {
    var geo, mesh, armorMeshes, layer, layerGeo, layerMesh, i;
    armorMeshes = [];

    if (type === 'WALKER') {
      geo  = new THREE.BoxGeometry(0.8, 1.7, 0.8);
      mesh = makeMesh(geo, 0x557755);
    } else if (type === 'RUNNER') {
      geo  = new THREE.BoxGeometry(0.7, 1.5, 0.7);
      mesh = makeMesh(geo, 0x446644);
    } else if (type === 'ARMORED') {
      geo  = new THREE.BoxGeometry(1.0, 1.8, 1.0);
      mesh = makeMesh(geo, 0x334433);

      /* 3 armor layers as child boxes */
      var armorColors = [0x556655, 0x445544, 0x334433];
      var armorScales = [1.35, 1.2, 1.05];
      for (i = 0; i < 3; i++) {
        layerGeo  = new THREE.BoxGeometry(1.0 * armorScales[i], 1.8 * armorScales[i], 1.0 * armorScales[i]);
        layerMesh = makeMesh(layerGeo, armorColors[i]);
        layerMesh.position.set(x, 0.9, z);
        _scene.add(layerMesh);
        armorMeshes.push({ mesh: layerMesh, alive: true });
      }
    } else if (type === 'SPITTER') {
      geo  = new THREE.BoxGeometry(0.75, 1.6, 0.75);
      mesh = makeMesh(geo, 0x447744);
    } else if (type === 'GIANT') {
      geo  = new THREE.BoxGeometry(2.4, 5.1, 2.4);
      mesh = makeMesh(geo, 0x664422);
    } else if (type === 'BOSS') {
      geo  = new THREE.CylinderGeometry(1.2, 1.5, 4, 8);
      mesh = makeMesh(geo, 0x882222, 0x551111, 0.4);
    } else {
      geo  = new THREE.BoxGeometry(0.8, 1.7, 0.8);
      mesh = makeMesh(geo, 0x557755);
    }

    mesh.position.set(x, type === 'GIANT' ? 2.55 : (type === 'BOSS' ? 2 : 0.85), z);
    _scene.add(mesh);

    var hp = 40;
    if (type === 'RUNNER')  hp = 30;
    if (type === 'ARMORED') hp = 80;
    if (type === 'SPITTER') hp = 60;
    if (type === 'GIANT')   hp = 150;
    if (type === 'BOSS')    hp = 500;

    var spd = 2;
    if (type === 'RUNNER')  spd = 6;
    if (type === 'ARMORED') spd = 1.5;
    if (type === 'SPITTER') spd = 1.8;
    if (type === 'GIANT')   spd = 1.2;
    if (type === 'BOSS')    spd = 1.0;

    _zombies.push({
      mesh: mesh,
      type: type,
      hp: hp,
      maxHp: hp,
      speed: spd,
      vel: { x: 0, z: 0 },
      alive: true,
      armorMeshes: armorMeshes,
      armorLayer: 2,   // 0=core exposed; 2=all layers on
      lungeTimer: 0,
      lunging: false,
      fireTimer: type === 'SPITTER' ? 3 + Math.random() * 2 : 0,
      throwTimer: type === 'BOSS' ? 4 + Math.random() * 3 : 0,
      attackCooldown: 0
    });
  }

  function getSpawnEdge() {
    var side = Math.floor(Math.random() * 4);
    var t    = (Math.random() - 0.5) * 120;
    if (side === 0) return { x:  60, z: t };
    if (side === 1) return { x: -60, z: t };
    if (side === 2) return { x: t,  z: 60 };
    return { x: t, z: -60 };
  }

  function startWave(waveNum) {
    var i, pos, types, count;
    _wave = waveNum;
    _waveActive = true;
    _waveDelay  = 0;

    showWaveAnnouncement('WAVE ' + waveNum + ' / 10');

    /* Determine spawn types & counts per spec */
    types = ['WALKER'];
    count = 8;

    if (waveNum >= 3) { types.push('RUNNER');  count = 12; }
    if (waveNum >= 5) { types.push('ARMORED'); count = 20; }
    if (waveNum >= 7) { types.push('SPITTER'); count = 30; }
    if (waveNum >= 10) { count = 50; }

    /* Randomise type selection weighted toward walkers early */
    for (i = 0; i < count; i++) {
      var t = types[Math.floor(Math.random() * types.length)];
      /* Ensure some walkers always present */
      if (i < 3) t = 'WALKER';
      pos = getSpawnEdge();
      spawnZombie(t, pos.x, pos.z);
    }

    /* Wave 7+: spawn a giant */
    if (waveNum >= 7) {
      pos = getSpawnEdge();
      spawnZombie('GIANT', pos.x, pos.z);
    }

    /* Wave 10: spawn boss */
    if (waveNum === 10) {
      spawnZombie('BOSS', 40, 40);
    }

    /* Every 2 waves: supply drop */
    if (waveNum >= 2 && waveNum % 2 === 0) {
      spawnSupplyDrop();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SUPPLY DROPS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnSupplyDrop() {
    var geo, mesh, types, t, sx, sz;
    types = ['ammo', 'medkit', 'fuel'];
    t     = types[Math.floor(Math.random() * types.length)];

    /* Drop in open area away from center */
    sx = (Math.random() - 0.5) * 40;
    sz = (Math.random() - 0.5) * 40;
    /* Avoid exact center where generator is */
    if (Math.abs(sx) < 5 && Math.abs(sz) < 5) sx += 12;

    geo  = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    mesh = makeMesh(geo, 0x44FF44, 0x22BB22, 0.7);
    mesh.position.set(sx, 0.75, sz);
    _scene.add(mesh);

    _supplyDrops.push({
      mesh: mesh,
      type: t,
      pos: { x: sx, y: 0.75, z: sz },
      timer: 30,
      collected: false
    });
  }

  function collectSupply(drop) {
    if (drop.type === 'ammo') {
      _ammo = Math.min(_maxAmmo, _ammo + 30);
    } else if (drop.type === 'medkit') {
      _playerHP = Math.min(_playerMaxHP, _playerHP + 50);
    } else if (drop.type === 'fuel') {
      _generatorTimer = Math.min(180, _generatorTimer + 60);
      if (!_generatorOn) {
        _generatorOn = true;
        setFloodLights(true);
      }
    }
    drop.collected = true;
    _scene.remove(drop.mesh);
    showWaveAnnouncement('SUPPLY: ' + drop.type.toUpperCase() + ' COLLECTED!');
  }

  /* ════════════════════════════════════════════════════════════════════════
     BARRICADES
  ════════════════════════════════════════════════════════════════════════ */

  function placeBarricade() {
    var geo, mesh, bx, bz;
    if (_barricades.length >= _maxBarricades) return;

    /* Place in front of player based on yaw */
    bx = _playerPos.x + Math.sin(_yaw) * 3;
    bz = _playerPos.z + Math.cos(_yaw) * 3;

    /* Stack 3 boxes to represent a barricade 3 units high */
    geo  = new THREE.BoxGeometry(2.5, 3, 0.6);
    mesh = makeMesh(geo, 0x885533);
    mesh.position.set(bx, 1.5, bz);
    mesh.rotation.y = _yaw;
    _scene.add(mesh);

    _barricades.push({ mesh: mesh, hp: 80, maxHp: 80, pos: { x: bx, y: 1.5, z: bz } });
  }

  function tryRepairBarricade() {
    var i, dx, dz, dist, b;
    for (i = 0; i < _barricades.length; i++) {
      b  = _barricades[i];
      dx = b.pos.x - _playerPos.x;
      dz = b.pos.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3.5 && b.hp < b.maxHp) {
        _repairTarget = b;
        _repairTimer  = 2;
        return;
      }
    }
    _repairTarget = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HELICOPTER
  ════════════════════════════════════════════════════════════════════════ */

  function spawnHelicopter() {
    var geo, mesh, geo2, mesh2;

    /* Main body */
    geo  = new THREE.BoxGeometry(4, 1.5, 8);
    mesh = makeMesh(geo, 0x334433, 0x223322, 0.3);
    mesh.position.set(15, 8, 15);
    _scene.add(mesh);
    _helicopterMesh = mesh;

    /* Tail */
    geo2  = new THREE.BoxGeometry(1, 0.8, 4);
    mesh2 = makeMesh(geo2, 0x334433);
    mesh2.position.set(0, 0.2, 5.5);
    mesh.add(mesh2);

    _helicopterArrived = true;
    _helicopterTimer   = 60;
    _helicopterDeparted = false;
    showWaveAnnouncement('HELICOPTER ARRIVED! BOARD WITHIN 60s - PRESS E');
  }

  function tryBoardHelicopter() {
    if (!_helicopterArrived || _helicopterDeparted) return;
    var hp = _helicopterMesh.position;
    var dx = hp.x - _playerPos.x;
    var dz = hp.z - _playerPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 6) {
      _victory = true;
      showVictory();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FLOOD LIGHTS
  ════════════════════════════════════════════════════════════════════════ */

  function setFloodLights(on) {
    var i;
    for (i = 0; i < _floodLights.length; i++) {
      _floodLights[i].intensity = on ? 2.5 : 0;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function firePlayerShot() {
    var geo, mesh, dx, dy, dz, len;

    if (_ammo <= 0 || _reloading || _fireCooldown > 0) return;
    _ammo--;
    _fireCooldown = 0.12;

    geo  = new THREE.SphereGeometry(0.12, 5, 5);
    mesh = makeMesh(geo, 0xFFDD44, 0xFFAA00, 1.0);

    /* Direction from camera look */
    dx = -Math.sin(_yaw) * Math.cos(_pitch);
    dy = Math.sin(_pitch);
    dz = -Math.cos(_yaw) * Math.cos(_pitch);
    len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    dx /= len; dy /= len; dz /= len;

    mesh.position.set(
      _playerPos.x + dx * 1.2,
      _playerPos.y + 0.5,
      _playerPos.z + dz * 1.2
    );
    _scene.add(mesh);
    _playerShots.push({ mesh: mesh, vel: { x: dx * 40, y: dy * 40, z: dz * 40 }, life: 1.5, damage: 25 });
  }

  function fireZombieShot(zombie) {
    var geo, mesh, dx, dz, len;

    geo  = new THREE.SphereGeometry(0.3, 6, 6);
    mesh = makeMesh(geo, 0x44FF22, 0x22BB00, 0.8);
    mesh.position.set(zombie.mesh.position.x, zombie.mesh.position.y + 0.5, zombie.mesh.position.z);
    _scene.add(mesh);

    dx = _playerPos.x - zombie.mesh.position.x;
    dz = _playerPos.z - zombie.mesh.position.z;
    len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) len = 1;
    dx /= len; dz /= len;

    _zombieShots.push({
      mesh: mesh,
      vel: { x: dx * 12, y: 0, z: dz * 12 },
      life: 4,
      damage: 12,
      poisoned: true
    });
  }

  function bossThrownPart(zombie) {
    var geo, mesh, dx, dz, len;

    geo  = new THREE.SphereGeometry(0.4, 6, 6);
    mesh = makeMesh(geo, 0x663322);
    mesh.position.set(zombie.mesh.position.x, zombie.mesh.position.y + 2, zombie.mesh.position.z);
    _scene.add(mesh);

    dx = _playerPos.x - zombie.mesh.position.x;
    dz = _playerPos.z - zombie.mesh.position.z;
    len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) len = 1;
    dx /= len; dz /= len;

    _bossThrows.push({
      mesh: mesh,
      vel: { x: dx * 18, y: 6, z: dz * 18 },
      life: 3
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'za-hud';
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'color:#FF4444', 'font-family:monospace', 'font-size:13px',
      'font-weight:bold', 'background:rgba(0,0,0,0.75)', 'padding:6px 14px',
      'border:1px solid #662222', 'border-radius:4px', 'z-index:9999',
      'pointer-events:none', 'white-space:nowrap', 'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);

    _waveAnnEl = document.createElement('div');
    _waveAnnEl.id = 'za-wave-ann';
    _waveAnnEl.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FF2222', 'font-family:monospace', 'font-size:28px',
      'font-weight:bold', 'text-shadow:0 0 20px #FF0000',
      'z-index:10000', 'pointer-events:none', 'display:none'
    ].join(';');
    document.body.appendChild(_waveAnnEl);

    _victoryEl = document.createElement('div');
    _victoryEl.id = 'za-victory';
    _victoryEl.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#44FF44', 'font-family:monospace', 'font-size:32px',
      'font-weight:bold', 'text-align:center', 'line-height:1.6',
      'text-shadow:0 0 20px #00FF00',
      'z-index:10001', 'pointer-events:none', 'display:none'
    ].join(';');
    _victoryEl.innerHTML = 'ESCAPED!<br><span style="font-size:18px">YOU SURVIVED THE APOCALYPSE</span>';
    document.body.appendChild(_victoryEl);

    _defeatEl = document.createElement('div');
    _defeatEl.id = 'za-defeat';
    _defeatEl.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FF2222', 'font-family:monospace', 'font-size:32px',
      'font-weight:bold', 'text-align:center', 'line-height:1.6',
      'text-shadow:0 0 20px #FF0000',
      'z-index:10001', 'pointer-events:none', 'display:none'
    ].join(';');
    _defeatEl.innerHTML = 'OVERRUN<br><span style="font-size:18px">THE DEAD HAVE WON</span>';
    document.body.appendChild(_defeatEl);
  }

  function updateHUD() {
    if (!_hud) return;
    var infStr  = _infected ? '<span style="color:#FF8800">YES</span>' : 'NO';
    var genStr  = _generatorOn ? Math.ceil(_generatorTimer) + 's' : '<span style="color:#882222">OFF</span>';
    var escStr  = _helicopterArrived
      ? (_helicopterDeparted ? '<span style="color:#882222">DEPARTED</span>' : Math.ceil(_helicopterTimer) + 's')
      : 'PENDING';
    var waveStr = _wave + '/10';
    var zCount  = 0;
    var i;
    for (i = 0; i < _zombies.length; i++) {
      if (_zombies[i].alive) zCount++;
    }
    var bCount = _barricades.length;

    _hud.innerHTML = [
      'APOCALYPSE',
      '[WAVE: ' + waveStr + ']',
      '[ZOMBIES: ' + zCount + ']',
      '[BARRICADES: ' + bCount + '/5]',
      '[INFECTED: ' + infStr + ']',
      '[GENERATOR: ' + genStr + ']',
      '| ESCAPE: ' + escStr
    ].join(' ');
  }

  function showWaveAnnouncement(msg) {
    if (!_waveAnnEl) return;
    _waveAnnEl.textContent = msg;
    _waveAnnEl.style.display = 'block';
    _waveAnnTimer = 3;
  }

  function showVictory() {
    if (_victoryEl) _victoryEl.style.display = 'block';
  }

  function showDefeat() {
    if (_defeatEl) _defeatEl.style.display = 'block';
  }

  function removeHUD() {
    if (_hud)        { document.body.removeChild(_hud);        _hud = null; }
    if (_waveAnnEl)  { document.body.removeChild(_waveAnnEl);  _waveAnnEl = null; }
    if (_victoryEl)  { document.body.removeChild(_victoryEl);  _victoryEl = null; }
    if (_defeatEl)   { document.body.removeChild(_defeatEl);   _defeatEl = null; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    if (!_active) {
      /* Track Z and A for activation */
      if (k === 'Z') _zaPressTime.Z = Date.now();
      if (k === 'A') _zaPressTime.A = Date.now();
      var diff = Math.abs(_zaPressTime.Z - _zaPressTime.A);
      if (_zaPressTime.Z > 0 && _zaPressTime.A > 0 && diff < ZA_WINDOW) {
        activate();
      }
      return;
    }

    if (_victory || _defeat) return;

    if (k === 'B') { placeBarricade(); }
    if (k === 'E') {
      tryRepairBarricade();
      tryBoardHelicopter();
    }
    if (k === 'R') {
      if (!_reloading && _ammo < _maxAmmo) {
        _reloading    = true;
        _reloadTimer  = 2.0;
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _yaw   -= dx * 0.002;
    _pitch -= dy * 0.002;
    _pitch  = Math.max(-1.0, Math.min(0.5, _pitch));
  }

  function onMouseDown(e) {
    if (!_active || _victory || _defeat) return;
    if (e.button === 0) {
      _mouseDown = true;
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) _mouseDown = false;
  }

  function onPointerLockChange() {
    /* no-op; pointer lock handled externally */
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION / DEACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) return;
    _active = true;

    /* Get scene/camera from game globals */
    _scene  = window._scene  || window.scene;
    _camera = window._camera || window.camera;
    _canvas = window._canvas || window.canvas || document.querySelector('canvas');

    if (!_scene || !_camera) {
      _active = false;
      return;
    }

    /* Environment setup */
    _scene.background = new THREE.Color(0x111111);
    _scene.fog        = new THREE.FogExp2(0x221100, 0.04);

    buildCity();
    buildGenerator();
    buildAidStations();
    buildPlayer();
    buildHUD();

    /* Reset state */
    _wave         = 0;
    _waveActive   = false;
    _waveDelay    = 3;
    _playerHP     = 100;
    _ammo         = 90;
    _infected     = false;
    _generatorOn  = true;
    _generatorTimer = 180;
    _helicopterArrived  = false;
    _helicopterDeparted = false;
    _helicopterTimer    = 0;
    _victory = false;
    _defeat  = false;

    /* Set camera behind player */
    _camera.position.set(_playerPos.x, _playerPos.y + 2, _playerPos.z + 6);
    _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);

    showWaveAnnouncement('ZOMBIE APOCALYPSE BEGINS!');
    _lastTime = performance.now();
  }

  function deactivate() {
    if (!_active) return;
    _active = false;

    var i;
    /* Remove all scene objects */
    for (i = 0; i < _envObjects.length; i++) {
      _scene.remove(_envObjects[i]);
    }
    _envObjects = [];

    for (i = 0; i < _zombies.length; i++) {
      _scene.remove(_zombies[i].mesh);
      var al = _zombies[i].armorMeshes;
      for (var j = 0; j < al.length; j++) _scene.remove(al[j].mesh);
    }
    _zombies = [];

    for (i = 0; i < _playerShots.length; i++) _scene.remove(_playerShots[i].mesh);
    _playerShots = [];

    for (i = 0; i < _zombieShots.length; i++) _scene.remove(_zombieShots[i].mesh);
    _zombieShots = [];

    for (i = 0; i < _bossThrows.length; i++) _scene.remove(_bossThrows[i].mesh);
    _bossThrows = [];

    for (i = 0; i < _barricades.length; i++) _scene.remove(_barricades[i].mesh);
    _barricades = [];

    for (i = 0; i < _supplyDrops.length; i++) {
      if (!_supplyDrops[i].collected) _scene.remove(_supplyDrops[i].mesh);
    }
    _supplyDrops = [];

    if (_playerMesh)    { _scene.remove(_playerMesh);    _playerMesh    = null; }
    if (_generatorMesh) { _scene.remove(_generatorMesh); _generatorMesh = null; }
    if (_helicopterMesh){ _scene.remove(_helicopterMesh); _helicopterMesh = null; }

    _floodLights = [];
    _aidStations = [];

    if (_scene.fog) _scene.fog = null;
    removeHUD();

    _zaPressTime = { Z: 0, A: 0 };
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════════════════ */

  function update(nowMs) {
    if (!_active) return;

    var dt = Math.min((nowMs - _lastTime) / 1000, 0.1);
    _lastTime = nowMs;

    if (_victory || _defeat) {
      updateHUD();
      return;
    }

    updatePlayer(dt);
    updateGenerator(dt);
    updateWaveLogic(dt);
    updateZombies(dt);
    updateProjectiles(dt);
    updateBarricades(dt);
    updateSupplyDrops(dt);
    updateAidStations(dt);
    updateHelicopter(dt);
    updateInfection(dt);
    updateReload(dt);
    updateWaveAnnouncement(dt);
    updateHUD();
  }

  /* ── Player movement ────────────────────────────────────────────────────── */
  function updatePlayer(dt) {
    var mx = 0, mz = 0;
    var sinY = Math.sin(_yaw);
    var cosY = Math.cos(_yaw);

    if (_keys['W'] || _keys['ARROWUP'])    { mx -= sinY; mz -= cosY; }
    if (_keys['S'] || _keys['ARROWDOWN'])  { mx += sinY; mz += cosY; }
    if (_keys['A'] || _keys['ARROWLEFT'])  { mx -= cosY; mz += sinY; }
    if (_keys['D'] || _keys['ARROWRIGHT']) { mx += cosY; mz -= sinY; }

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }

    _playerPos.x += mx * _playerSpeed * dt;
    _playerPos.z += mz * _playerSpeed * dt;

    /* Clamp to map */
    _playerPos.x = Math.max(-70, Math.min(70, _playerPos.x));
    _playerPos.z = Math.max(-70, Math.min(70, _playerPos.z));

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _playerMesh.rotation.y = _yaw;
    }

    /* Camera follow */
    if (_camera) {
      var camDist = 7;
      var camH    = 4;
      _camera.position.x += ((_playerPos.x + Math.sin(_yaw) * -camDist) - _camera.position.x) * 0.12;
      _camera.position.y += ((_playerPos.y + camH) - _camera.position.y) * 0.12;
      _camera.position.z += ((_playerPos.z + Math.cos(_yaw) * -camDist) - _camera.position.z) * 0.12;
      _camera.lookAt(_playerPos.x, _playerPos.y + 0.8, _playerPos.z);
    }

    /* Fire */
    if (_fireCooldown > 0) _fireCooldown -= dt;
    if (_mouseDown || _keys[' ']) {
      firePlayerShot();
    }

    /* HP clamp */
    if (_playerHP <= 0) {
      _defeat = true;
      showDefeat();
    }
  }

  /* ── Generator ──────────────────────────────────────────────────────────── */
  function updateGenerator(dt) {
    if (!_generatorOn) return;
    _generatorTimer -= dt;
    if (_generatorTimer <= 0) {
      _generatorTimer = 0;
      _generatorOn    = false;
      setFloodLights(false);
      showWaveAnnouncement('GENERATOR OFFLINE - LIGHTS OUT!');
    }
  }

  /* ── Wave logic ─────────────────────────────────────────────────────────── */
  function updateWaveLogic(dt) {
    if (_wave >= _maxWaves && !_waveActive) {
      /* All waves done, spawn helicopter if not already */
      if (!_helicopterArrived && !_helicopterDeparted) {
        spawnHelicopter();
      }
      return;
    }

    if (_waveActive) {
      /* Check if all zombies dead */
      var alive = 0, i;
      for (i = 0; i < _zombies.length; i++) {
        if (_zombies[i].alive) alive++;
      }
      if (alive === 0) {
        _waveActive = false;
        _waveDelay  = 8;
        if (_wave < _maxWaves) {
          showWaveAnnouncement('WAVE ' + _wave + ' CLEARED!');
        }
      }
    } else {
      _waveDelay -= dt;
      if (_waveDelay <= 0 && _wave < _maxWaves) {
        startWave(_wave + 1);
      }
    }
  }

  /* ── Zombie update ──────────────────────────────────────────────────────── */
  function updateZombies(dt) {
    var i, j, z, dx, dz, dist, spd, nx, nz, len, armor;

    for (i = 0; i < _zombies.length; i++) {
      z = _zombies[i];
      if (!z.alive) continue;

      dx = _playerPos.x - z.mesh.position.x;
      dz = _playerPos.z - z.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.001) { dx = 1; dz = 0; dist = 1; }
      nx = dx / dist;
      nz = dz / dist;

      spd = z.speed;

      /* Vision: if lights off, only chase if player is close */
      if (!_generatorOn && dist > 12) continue;

      /* Move toward player (unless lunging runner which has its own vel) */
      if (z.type === 'RUNNER' && z.lunging) {
        z.mesh.position.x += z.vel.x * dt;
        z.mesh.position.z += z.vel.z * dt;
        z.lungeTimer -= dt;
        if (z.lungeTimer <= 0) { z.lunging = false; z.vel.x = 0; z.vel.z = 0; }
      } else if (z.type !== 'RUNNER' || !z.lunging) {
        z.mesh.position.x += nx * spd * dt;
        z.mesh.position.z += nz * spd * dt;
      }

      /* Sync armor layers */
      if (z.type === 'ARMORED') {
        for (j = 0; j < z.armorMeshes.length; j++) {
          if (z.armorMeshes[j].alive) {
            z.armorMeshes[j].mesh.position.set(
              z.mesh.position.x,
              z.mesh.position.y,
              z.mesh.position.z
            );
          }
        }
      }

      /* Runner lunge trigger */
      if (z.type === 'RUNNER' && !z.lunging && dist < 8 && z.lungeTimer <= 0) {
        z.lunging   = true;
        z.lungeTimer = 0.6;
        z.vel.x     = nx * spd * 4;
        z.vel.z     = nz * spd * 4;
      }

      /* Spitter fire */
      if (z.type === 'SPITTER') {
        z.fireTimer -= dt;
        if (z.fireTimer <= 0 && dist < 20) {
          fireZombieShot(z);
          z.fireTimer = 3 + Math.random() * 2;
        }
      }

      /* Boss throws */
      if (z.type === 'BOSS') {
        z.throwTimer -= dt;
        if (z.throwTimer <= 0) {
          bossThrownPart(z);
          z.throwTimer = 4 + Math.random() * 3;
        }
      }

      /* Melee attack player */
      if (dist < 2.0 && z.attackCooldown <= 0) {
        var dmg = 10;
        if (z.type === 'GIANT') dmg = 25;
        if (z.type === 'BOSS')  dmg = 30;
        _playerHP -= dmg;
        z.attackCooldown = 1.5;

        /* Infection chance 15% */
        if (!_infected && Math.random() < 0.15) {
          _infected = true;
          _infectionTimer = 0;
          showWaveAnnouncement('INFECTED! REACH FIRST AID STATION!');
        }
      }
      if (z.attackCooldown > 0) z.attackCooldown -= dt;

      /* Attack barricades */
      for (j = 0; j < _barricades.length; j++) {
        var b = _barricades[j];
        var bdx = b.pos.x - z.mesh.position.x;
        var bdz = b.pos.z - z.mesh.position.z;
        var bdist = Math.sqrt(bdx * bdx + bdz * bdz);
        if (bdist < 1.8 && z.attackCooldown <= 0) {
          b.hp -= 8;
          if (b.hp <= 0) {
            _scene.remove(b.mesh);
            _barricades.splice(j, 1);
            j--;
          }
        }
      }
    }
  }

  /* ── Projectile update ──────────────────────────────────────────────────── */
  function updateProjectiles(dt) {
    var i, j, s, z, dx, dz, dist, hit;

    /* Player shots */
    for (i = _playerShots.length - 1; i >= 0; i--) {
      s = _playerShots[i];
      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.y += s.vel.y * dt;
      s.mesh.position.z += s.vel.z * dt;
      s.life -= dt;

      hit = false;

      /* Check vs zombies */
      for (j = 0; j < _zombies.length; j++) {
        z = _zombies[j];
        if (!z.alive) continue;
        dx = z.mesh.position.x - s.mesh.position.x;
        dz = z.mesh.position.z - s.mesh.position.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        var hitR = z.type === 'GIANT' ? 2.0 : (z.type === 'BOSS' ? 1.5 : 0.8);
        if (dist < hitR) {
          /* Armored: remove layer first */
          if (z.type === 'ARMORED' && z.armorLayer >= 0) {
            var layerIdx = z.armorLayer;
            if (layerIdx >= 0 && z.armorMeshes[layerIdx] && z.armorMeshes[layerIdx].alive) {
              _scene.remove(z.armorMeshes[layerIdx].mesh);
              z.armorMeshes[layerIdx].alive = false;
              z.armorLayer--;
              hit = true;
              break;
            }
          }
          z.hp -= s.damage;
          hit = true;
          if (z.hp <= 0) {
            z.alive = false;
            _scene.remove(z.mesh);
            /* Remove remaining armor */
            var al = z.armorMeshes;
            for (var ai = 0; ai < al.length; ai++) {
              if (al[ai].alive) _scene.remove(al[ai].mesh);
            }
            _score += 10;
          }
          break;
        }
      }

      if (hit || s.life <= 0) {
        _scene.remove(s.mesh);
        _playerShots.splice(i, 1);
      }
    }

    /* Zombie acid shots */
    for (i = _zombieShots.length - 1; i >= 0; i--) {
      s = _zombieShots[i];
      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.z += s.vel.z * dt;
      s.life -= dt;

      dx = _playerPos.x - s.mesh.position.x;
      dz = _playerPos.z - s.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.8) {
        _playerHP -= s.damage;
        if (!_infected && Math.random() < 0.25) {
          _infected = true;
          showWaveAnnouncement('ACID INFECTED! REACH FIRST AID STATION!');
        }
        _scene.remove(s.mesh);
        _zombieShots.splice(i, 1);
        continue;
      }

      if (s.life <= 0) {
        _scene.remove(s.mesh);
        _zombieShots.splice(i, 1);
      }
    }

    /* Boss thrown parts */
    for (i = _bossThrows.length - 1; i >= 0; i--) {
      s = _bossThrows[i];
      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.y += s.vel.y * dt;
      s.mesh.position.z += s.vel.z * dt;
      s.vel.y -= 9.8 * dt; /* gravity */
      s.life  -= dt;

      dx = _playerPos.x - s.mesh.position.x;
      dz = _playerPos.z - s.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 1.2 || s.mesh.position.y < 0) {
        if (dist < 3) _playerHP -= 20;
        _scene.remove(s.mesh);
        _bossThrows.splice(i, 1);
        continue;
      }
      if (s.life <= 0) {
        _scene.remove(s.mesh);
        _bossThrows.splice(i, 1);
      }
    }
  }

  /* ── Barricade repair ───────────────────────────────────────────────────── */
  function updateBarricades(dt) {
    if (_repairTarget) {
      _repairTimer -= dt;
      if (_repairTimer <= 0) {
        _repairTarget.hp = Math.min(_repairTarget.maxHp, _repairTarget.hp + 40);
        _repairTarget = null;
        _repairTimer  = 0;
      }
    }

    /* Update barricade color based on HP */
    var i, b, ratio;
    for (i = 0; i < _barricades.length; i++) {
      b     = _barricades[i];
      ratio = b.hp / b.maxHp;
      if (b.mesh.material) {
        b.mesh.material.color.setHex(ratio > 0.5 ? 0x885533 : 0x663311);
      }
    }
  }

  /* ── Supply drops ───────────────────────────────────────────────────────── */
  function updateSupplyDrops(dt) {
    var i, s, dx, dz, dist;
    for (i = _supplyDrops.length - 1; i >= 0; i--) {
      s = _supplyDrops[i];
      if (s.collected) continue;
      s.timer -= dt;

      /* Bob animation */
      s.mesh.position.y = 0.75 + Math.sin(Date.now() * 0.003) * 0.15;
      s.mesh.rotation.y += dt * 1.5;

      dx = _playerPos.x - s.pos.x;
      dz = _playerPos.z - s.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 2.5) {
        collectSupply(s);
        _supplyDrops.splice(i, 1);
        continue;
      }

      if (s.timer <= 0) {
        _scene.remove(s.mesh);
        _supplyDrops.splice(i, 1);
        showWaveAnnouncement('SUPPLY DROP MISSED!');
      }
    }
  }

  /* ── Aid stations ───────────────────────────────────────────────────────── */
  function updateAidStations(dt) {
    var i, a, dx, dz, dist;
    for (i = 0; i < _aidStations.length; i++) {
      a = _aidStations[i];
      if (a.cooldown > 0) { a.cooldown -= dt; continue; }

      dx = _playerPos.x - a.pos.x;
      dz = _playerPos.z - a.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 3) {
        if (_infected) {
          _infected = false;
          showWaveAnnouncement('INFECTION CURED!');
          a.cooldown = 15;
        }
        if (_playerHP < _playerMaxHP) {
          _playerHP = Math.min(_playerMaxHP, _playerHP + 20 * dt);
        }
      }
    }
  }

  /* ── Helicopter ─────────────────────────────────────────────────────────── */
  function updateHelicopter(dt) {
    if (!_helicopterArrived || _helicopterDeparted) return;

    _helicopterTimer -= dt;

    /* Hovering bob */
    if (_helicopterMesh) {
      _helicopterMesh.position.y = 8 + Math.sin(Date.now() * 0.002) * 0.4;
      _helicopterMesh.rotation.y += dt * 0.3;
    }

    if (_helicopterTimer <= 0) {
      _helicopterDeparted = true;
      if (_helicopterMesh) {
        _scene.remove(_helicopterMesh);
        _helicopterMesh = null;
      }
      _defeat = true;
      showDefeat();
      showWaveAnnouncement('HELICOPTER DEPARTED - OVERRUN!');
    }
  }

  /* ── Infection drain ────────────────────────────────────────────────────── */
  function updateInfection(dt) {
    if (!_infected) return;
    _infectionDrainTimer += dt;
    if (_infectionDrainTimer >= 1) {
      _playerHP -= 1;
      _infectionDrainTimer = 0;
    }
  }

  /* ── Reload ─────────────────────────────────────────────────────────────── */
  function updateReload(dt) {
    if (!_reloading) return;
    _reloadTimer -= dt;
    if (_reloadTimer <= 0) {
      _ammo      = _maxAmmo;
      _reloading = false;
    }
  }

  /* ── Wave announcement fade ─────────────────────────────────────────────── */
  function updateWaveAnnouncement(dt) {
    if (_waveAnnTimer <= 0 || !_waveAnnEl) return;
    _waveAnnTimer -= dt;
    if (_waveAnnTimer <= 0) {
      _waveAnnEl.style.display = 'none';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init() {
    document.addEventListener('keydown',   onKeyDown);
    document.addEventListener('keyup',     onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
  }

  function reset() {
    deactivate();
    _zaPressTime = { Z: 0, A: 0 };
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
