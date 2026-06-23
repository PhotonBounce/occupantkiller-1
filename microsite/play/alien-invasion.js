/* ───────────────────────────────────────────────────────────────────────────
   alien-invasion.js — Alien Invasion Mini-Game
   API: window.AlienInvasion = { init, update, reset }
   Activation: A + I simultaneous keypress (both keys within 400ms)

   Alien Types:
     SCOUT      — SphereGeometry r=0.8, 0x22AA44, floats y=3, fires plasma, 50 HP
     WARRIOR    — BoxGeometry 1x2x1, 0x116633, bipedal melee tentacle swipe r=2.5, 120 HP
     MOTHERSHIP — SphereGeometry r=6, 0x004422, orbits y=20, drops scouts every 30s, 800 HP
     TANK-ALIEN — BoxGeometry 3x2x4, 0x003311, fires acid balls, 300 HP

   Human Tech:
     PLASMA RIFLE   — BoxGeometry 0x00AAFF, fires SphereGeometry 0x0088FF, 60 dmg
     EMP GRENADE    — G key, stuns all aliens within 8 units for 5s
     ROCKET LAUNCHER — 100 dmg

   Controls:
     A + I  → activate alien invasion
     WASD   → move player
     Mouse  → aim
     Click  → fire plasma rifle
     G      → EMP grenade
     R      → rocket launcher (when equipped)
     E      → power defense pylon (when near one)
   ─────────────────────────────────────────────────────────────────────────── */

window.AlienInvasion = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active        = false;
  var _score         = 0;
  var _wave          = 0;
  var _maxWaves      = 5;
  var _waveActive    = false;
  var _waveDelay     = 0;
  var _victory       = false;
  var _defeat        = false;

  /* ── Key-combo tracking: A+I within 400ms ──────────────────────────────── */
  var _aiPressTime = { A: 0, I: 0 };
  var AI_WINDOW    = 400; // ms

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerMesh    = null;
  var _playerHP      = 100;
  var _playerMaxHP   = 100;
  var _playerPos     = { x: 0, y: 1, z: 0 };
  var _playerSpeed   = 10;
  var _plasmaAmmo    = 60;
  var _hasRocket     = false;
  var _rocketAmmo    = 3;
  var _fireCooldown  = 0;
  var _rocketCooldown= 0;
  var _empCooldown   = 0;
  var _empCount      = 3;

  /* ── Input state ───────────────────────────────────────────────────────── */
  var _keys    = {};
  var _mouseX  = 0;
  var _mouseY  = 0;
  var _mouseDown = false;
  var _yaw     = 0;
  var _pitch   = 0;

  /* ── Aliens ────────────────────────────────────────────────────────────── */
  var _aliens = [];
  // Each alien: { mesh, type, hp, maxHp, vel, fireTimer, stunTimer, alertTimer, alive, light }

  /* ── Mothership ────────────────────────────────────────────────────────── */
  var _mothership        = null;
  // { mesh, hp, maxHp, alive, orbitAngle, dropTimer, alerted, alertLight, ventMesh, ventHits, beamLight, beamTimer }
  var _mothershipAlerted = false;
  var _mothershipDestroyed = false;

  /* ── Projectiles ───────────────────────────────────────────────────────── */
  var _playerShots  = []; // { mesh, vel, life, damage, isRocket }
  var _alienShots   = []; // { mesh, vel, life, damage, type, acidTimer, acidActive }
  var _beamDamageTimer = 0;

  /* ── Explosions & VFX ─────────────────────────────────────────────────── */
  var _explosions = []; // { mesh, light, life, maxLife }
  var _acidPuddles = []; // { mesh, life, pos }

  /* ── City environment ─────────────────────────────────────────────────── */
  var _cityObjects = []; // all static environment meshes
  var _wreckageLights = [];

  /* ── Defense pylons ───────────────────────────────────────────────────── */
  var _pylons = [];
  // Each pylon: { mesh, pos, powered, powerTimer, light, fireTimer }

  /* ── Pickups ───────────────────────────────────────────────────────────── */
  var _pickups = []; // { mesh, type, pos, collected }

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud        = null;
  var _clearEl    = null;
  var _defeatEl   = null;
  var _waveAnnEl  = null;
  var _waveAnnTimer = 0;

  /* ── Internal timer ─────────────────────────────────────────────────────── */
  var _lastTime = 0;

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

  /* ════════════════════════════════════════════════════════════════════════
     CITY ENVIRONMENT: ruins, craters, burning wreckage
  ════════════════════════════════════════════════════════════════════════ */

  function buildCity() {
    var i, j, bw, bd, bh, bx, bz, dmg, building, geo, mesh, light;

    /* Ground plane */
    geo  = new THREE.BoxGeometry(200, 0.5, 200);
    mesh = makeMesh(geo, 0x223322);
    mesh.position.set(0, -0.25, 0);
    _scene.add(mesh);
    _cityObjects.push(mesh);

    /* Ruined buildings */
    var buildingPositions = [
      [-20, -30], [-10, -40], [5, -25], [15, -35], [25, -20],
      [-30, 10],  [-15, 15],  [0, 20],  [20, 10],  [30, 25],
      [-25, 40],  [-5, 45],   [10, 50], [28, 42],  [-35, -10],
      [35, -5],   [-40, 30],  [40, 15], [-20, 60],  [20, 60]
    ];

    for (i = 0; i < buildingPositions.length; i++) {
      bx = buildingPositions[i][0];
      bz = buildingPositions[i][1];
      bw = 4 + Math.random() * 6;
      bd = 4 + Math.random() * 6;
      bh = 3 + Math.random() * 10;
      dmg = Math.random();

      /* Main building */
      geo  = new THREE.BoxGeometry(bw, bh, bd);
      mesh = makeMesh(geo, 0x446655);
      mesh.position.set(bx, bh * 0.5, bz);
      _scene.add(mesh);
      _cityObjects.push(mesh);

      /* Partially destroyed top chunk */
      if (dmg > 0.4) {
        geo  = new THREE.BoxGeometry(bw * 0.6, bh * 0.3, bd * 0.6);
        mesh = makeMesh(geo, 0x334444);
        mesh.position.set(bx + (Math.random() - 0.5) * bw * 0.3,
                          bh + bh * 0.15,
                          bz + (Math.random() - 0.5) * bd * 0.3);
        mesh.rotation.y = Math.random() * 0.5;
        _scene.add(mesh);
        _cityObjects.push(mesh);
      }
    }

    /* Craters */
    var craterPos = [
      [0, 0], [10, -10], [-15, 5], [5, 30], [-8, -20],
      [22, -15], [-22, 25], [18, 45], [-5, -50], [30, -40]
    ];
    for (i = 0; i < craterPos.length; i++) {
      for (j = 0; j < 3; j++) {
        var cx = craterPos[i][0] + (Math.random() - 0.5) * 10;
        var cz = craterPos[i][1] + (Math.random() - 0.5) * 10;
        var cr = 1.5 + Math.random() * 3;
        geo  = new THREE.BoxGeometry(cr * 2, 0.4, cr * 2);
        mesh = makeMesh(geo, 0x334433);
        mesh.position.set(cx, -0.1, cz);
        _scene.add(mesh);
        _cityObjects.push(mesh);
      }
    }

    /* Burning wreckage with PointLights */
    var wreckPos = [
      [-5, -8], [12, 3], [-18, 20], [8, -15], [25, 35],
      [-28, -5], [3, 48], [20, -30], [-10, 38], [35, 10]
    ];
    for (i = 0; i < wreckPos.length; i++) {
      var wx = wreckPos[i][0];
      var wz = wreckPos[i][1];

      /* Wreckage debris */
      geo  = new THREE.BoxGeometry(2, 0.5, 2);
      mesh = makeMesh(geo, 0x332200, 0xFF4400, 0.6);
      mesh.position.set(wx, 0.25, wz);
      mesh.rotation.y = Math.random() * Math.PI;
      _scene.add(mesh);
      _cityObjects.push(mesh);

      /* Fire light */
      light = new THREE.PointLight(0xFF4400, 1.5, 12);
      light.position.set(wx, 1.5, wz);
      _scene.add(light);
      _wreckageLights.push({ light: light, baseIntensity: 1.5, phase: Math.random() * Math.PI * 2 });
    }

    /* Ambient + hemisphere */
    var ambient = new THREE.AmbientLight(0x112211, 0.6);
    _scene.add(ambient);

    var hemi = new THREE.HemisphereLight(0x224422, 0x111111, 0.4);
    _scene.add(hemi);

    /* Rocket launcher pickup in the city */
    geo  = new THREE.BoxGeometry(0.3, 0.3, 1.5);
    mesh = makeMesh(geo, 0xFF6600, 0xFF3300, 0.5);
    mesh.position.set(8, 0.5, -5);
    _scene.add(mesh);
    _pickups.push({ mesh: mesh, type: 'rocket', pos: { x: 8, y: 0.5, z: -5 }, collected: false });
  }

  /* ════════════════════════════════════════════════════════════════════════
     DEFENSE PYLONS
  ════════════════════════════════════════════════════════════════════════ */

  function buildPylons() {
    var pylonPositions = [
      { x: -15, z: -15 },
      { x:  15, z: -15 },
      { x:   0, z:  20 }
    ];
    var i, geo, mesh, light, cap;
    for (i = 0; i < pylonPositions.length; i++) {
      var px = pylonPositions[i].x;
      var pz = pylonPositions[i].z;
      var group = new THREE.Group();

      /* Body */
      geo  = new THREE.BoxGeometry(1, 4, 1);
      mesh = makeMesh(geo, 0x4466AA);
      mesh.position.set(0, 2, 0);
      group.add(mesh);

      /* Cap */
      geo = new THREE.BoxGeometry(1.4, 0.6, 1.4);
      cap = makeMesh(geo, 0x5577BB);
      cap.position.set(0, 4.3, 0);
      group.add(cap);

      group.position.set(px, 0, pz);
      _scene.add(group);

      light = new THREE.PointLight(0x4466AA, 0, 20);
      light.position.set(px, 5, pz);
      _scene.add(light);

      _pylons.push({
        mesh: group,
        pos: { x: px, y: 4, z: pz },
        powered: false,
        powerTimer: 0,
        light: light,
        fireTimer: 0
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLASMA RIFLE PICKUP (abandoned)
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlasmaRifle() {
    var geo  = new THREE.BoxGeometry(0.2, 0.2, 1.2);
    var mesh = makeMesh(geo, 0x00AAFF, 0x0088FF, 0.5);
    mesh.position.set(-8, 0.5, 5);
    _scene.add(mesh);
    _pickups.push({ mesh: mesh, type: 'plasmaRifle', pos: { x: -8, y: 0.5, z: 5 }, collected: false });
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MESH
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var group = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.5);
    var body    = makeMesh(bodyGeo, 0x556677);
    body.position.set(0, 0, 0);
    group.add(body);

    /* Head */
    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var head    = makeMesh(headGeo, 0x8899AA);
    head.position.set(0, 1.05, 0);
    group.add(head);

    group.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(group);
    _playerMesh = group;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ALIEN SPAWNING
  ════════════════════════════════════════════════════════════════════════ */

  function spawnAlien(type, x, z) {
    var geo, mesh, hp, light;
    var offset = 0;

    if (type === 'scout') {
      geo  = new THREE.SphereGeometry(0.8, 8, 8);
      mesh = makeMesh(geo, 0x22AA44, 0x11AA33, 0.3);
      hp   = 50;
      offset = 3;
    } else if (type === 'warrior') {
      var group = new THREE.Group();
      /* Torso */
      var torsoGeo = new THREE.BoxGeometry(1, 1.2, 1);
      var torso    = makeMesh(torsoGeo, 0x116633);
      torso.position.set(0, 0.6, 0);
      group.add(torso);
      /* Legs */
      var legGeo = new THREE.BoxGeometry(0.35, 0.8, 0.35);
      var legMat = new THREE.MeshLambertMaterial({ color: 0x0D5528 });
      var legL   = new THREE.Mesh(legGeo, legMat);
      legL.position.set(-0.3, -0.15, 0);
      group.add(legL);
      var legR = new THREE.Mesh(legGeo, legMat);
      legR.position.set(0.3, -0.15, 0);
      group.add(legR);
      /* Head */
      var hGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
      var hMesh = makeMesh(hGeo, 0x116633, 0x00FF44, 0.2);
      hMesh.position.set(0, 1.35, 0);
      group.add(hMesh);
      mesh = group;
      hp   = 120;
      offset = 1;
    } else if (type === 'tank') {
      geo  = new THREE.BoxGeometry(3, 2, 4);
      mesh = makeMesh(geo, 0x003311, 0x00AA22, 0.2);
      hp   = 300;
      offset = 1;
    }

    if (x === undefined) { x = (Math.random() - 0.5) * 80; }
    if (z === undefined) { z = (Math.random() - 0.5) * 80 - 30; }

    if (mesh) {
      mesh.position.set(x, offset, z);
      _scene.add(mesh);

      light = new THREE.PointLight(0x22FF44, 0.5, 5);
      light.position.set(x, offset + 1, z);
      _scene.add(light);

      _aliens.push({
        mesh: mesh,
        type: type,
        hp: hp,
        maxHp: hp,
        vel: { x: 0, y: 0, z: 0 },
        fireTimer: 1 + Math.random() * 2,
        stunTimer: 0,
        alertTimer: 0,
        alertedMothership: false,
        alive: true,
        light: light
      });
    }
  }

  function spawnMothership() {
    if (_mothership && _mothership.alive) return;

    var group = new THREE.Group();

    /* Main hull */
    var hullGeo = new THREE.SphereGeometry(6, 16, 16);
    var hull    = makeMesh(hullGeo, 0x004422, 0x00AA44, 0.15);
    group.add(hull);

    /* Bottom vent (the weak point) */
    var ventGeo  = new THREE.BoxGeometry(2, 0.5, 2);
    var vent     = makeMesh(ventGeo, 0x001100, 0x00FF44, 0.4);
    vent.position.set(0, -6, 0);
    group.add(vent);

    /* Ring detail */
    var ringGeo = new THREE.BoxGeometry(14, 0.8, 14);
    var ring    = makeMesh(ringGeo, 0x002211);
    ring.position.set(0, -1, 0);
    group.add(ring);

    group.position.set(0, 20, -40);
    _scene.add(group);

    var alertLight = new THREE.PointLight(0xFF4400, 0, 30);
    alertLight.position.set(0, 20, -40);
    _scene.add(alertLight);

    var beamLight = new THREE.PointLight(0x00FF00, 0, 40);
    beamLight.position.set(0, 10, -40);
    _scene.add(beamLight);

    _mothership = {
      mesh: group,
      hp: 800,
      maxHp: 800,
      alive: true,
      orbitAngle: 0,
      dropTimer: 30,
      alerted: false,
      alertLight: alertLight,
      ventMesh: vent,
      ventHits: 0,
      beamLight: beamLight,
      beamTimer: 0,
      beamActive: false
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     WAVE DEFINITIONS
  ════════════════════════════════════════════════════════════════════════ */

  var WAVE_DEFS = [
    /* Wave 1 */ { scouts: 3, warriors: 0, tanks: 0, mothership: false },
    /* Wave 2 */ { scouts: 5, warriors: 2, tanks: 0, mothership: false },
    /* Wave 3 */ { scouts: 8, warriors: 4, tanks: 1, mothership: false },
    /* Wave 4 */ { scouts: 6, warriors: 4, tanks: 2, mothership: true },
    /* Wave 5 */ { scouts: 10, warriors: 6, tanks: 3, mothership: true }
  ];

  function startWave(waveIndex) {
    var def = WAVE_DEFS[waveIndex];
    var i;

    for (i = 0; i < def.scouts; i++)   { spawnAlien('scout'); }
    for (i = 0; i < def.warriors; i++) { spawnAlien('warrior'); }
    for (i = 0; i < def.tanks; i++)    { spawnAlien('tank'); }
    if (def.mothership) { spawnMothership(); }

    _waveActive = true;
    showWaveAnnouncement('WAVE ' + (waveIndex + 1) + ' / ' + _maxWaves);
  }

  function countAliveAliens() {
    var count = 0;
    var i;
    for (i = 0; i < _aliens.length; i++) {
      if (_aliens[i].alive) count++;
    }
    return count;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PROJECTILE HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function firePlayerPlasma() {
    if (_plasmaAmmo <= 0) return;
    _plasmaAmmo--;

    var geo  = new THREE.SphereGeometry(0.15, 6, 6);
    var mesh = makeMesh(geo, 0x0088FF, 0x00AAFF, 0.8);

    var px = _playerPos.x;
    var py = _playerPos.y + 1;
    var pz = _playerPos.z;
    mesh.position.set(px, py, pz);
    _scene.add(mesh);

    /* Direction from yaw angle */
    var dirX = -Math.sin(_yaw);
    var dirZ = -Math.cos(_yaw);
    var speed = 40;

    _playerShots.push({
      mesh: mesh,
      vel: { x: dirX * speed, y: 0, z: dirZ * speed },
      life: 3,
      damage: 60,
      isRocket: false
    });
  }

  function firePlayerRocket() {
    if (_rocketAmmo <= 0) return;
    _rocketAmmo--;

    var geo  = new THREE.BoxGeometry(0.15, 0.15, 0.6);
    var mesh = makeMesh(geo, 0xFF6600, 0xFF3300, 0.9);

    var px = _playerPos.x;
    var py = _playerPos.y + 1;
    var pz = _playerPos.z;
    mesh.position.set(px, py, pz);
    _scene.add(mesh);

    var dirX = -Math.sin(_yaw);
    var dirZ = -Math.cos(_yaw);
    var speed = 30;

    var light = new THREE.PointLight(0xFF6600, 1, 8);
    light.position.set(px, py, pz);
    _scene.add(light);

    _playerShots.push({
      mesh: mesh,
      vel: { x: dirX * speed, y: 0, z: dirZ * speed },
      life: 4,
      damage: 100,
      isRocket: true,
      light: light
    });
  }

  function fireEMP() {
    if (_empCount <= 0 || _empCooldown > 0) return;
    _empCount--;
    _empCooldown = 8;

    /* Visual flash */
    var empLight = new THREE.PointLight(0x88AAFF, 4, 20);
    empLight.position.set(_playerPos.x, _playerPos.y + 1, _playerPos.z);
    _scene.add(empLight);
    _explosions.push({ mesh: null, light: empLight, life: 0.3, maxLife: 0.3 });

    /* Stun aliens within 8 units */
    var i, alien, dx, dz, dist;
    for (i = 0; i < _aliens.length; i++) {
      alien = _aliens[i];
      if (!alien.alive) continue;
      dx   = alien.mesh.position.x - _playerPos.x;
      dz   = alien.mesh.position.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 8) {
        alien.stunTimer = 5;
      }
    }

    /* Stun mothership beam */
    if (_mothership && _mothership.alive) {
      var mx = _mothership.mesh.position.x - _playerPos.x;
      var mz = _mothership.mesh.position.z - _playerPos.z;
      var md = Math.sqrt(mx * mx + mz * mz);
      if (md <= 8) {
        _mothership.beamTimer = -5; /* delay beam */
      }
    }
  }

  function fireAlienPlasma(alien) {
    var geo  = new THREE.SphereGeometry(0.2, 6, 6);
    var mesh = makeMesh(geo, 0x44FF44, 0x22FF22, 0.8);

    var ax = alien.mesh.position.x;
    var ay = alien.mesh.position.y;
    var az = alien.mesh.position.z;
    mesh.position.set(ax, ay, az);
    _scene.add(mesh);

    var dx   = _playerPos.x - ax;
    var dy   = _playerPos.y - ay;
    var dz   = _playerPos.z - az;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.01) dist = 0.01;
    var speed = 18;

    _alienShots.push({
      mesh: mesh,
      vel: { x: (dx / dist) * speed, y: (dy / dist) * speed, z: (dz / dist) * speed },
      life: 4,
      damage: 15,
      type: 'plasma',
      acidTimer: 0,
      acidActive: false
    });
  }

  function fireAlienAcid(alien) {
    var geo  = new THREE.SphereGeometry(0.3, 6, 6);
    var mesh = makeMesh(geo, 0x88FF00, 0x44FF00, 0.8);

    var ax = alien.mesh.position.x;
    var ay = alien.mesh.position.y;
    var az = alien.mesh.position.z;
    mesh.position.set(ax, ay + 1, az);
    _scene.add(mesh);

    var dx   = _playerPos.x - ax;
    var dy   = 0;
    var dz   = _playerPos.z - az;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.01) dist = 0.01;
    var speed = 14;

    _alienShots.push({
      mesh: mesh,
      vel: { x: (dx / dist) * speed, y: 2, z: (dz / dist) * speed },
      life: 5,
      damage: 25,
      type: 'acid',
      acidTimer: 3,
      acidActive: false
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSION VFX
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(x, y, z, color, size) {
    color = color || 0xFF4400;
    size  = size  || 1;

    var geo  = new THREE.SphereGeometry(size, 8, 8);
    var mesh = makeMesh(geo, color, color, 1.0);
    mesh.position.set(x, y, z);
    _scene.add(mesh);

    var light = new THREE.PointLight(color, 3 * size, 15 * size);
    light.position.set(x, y, z);
    _scene.add(light);

    _explosions.push({ mesh: mesh, light: light, life: 0.6, maxLife: 0.6 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     MOTHERSHIP BEAM
  ════════════════════════════════════════════════════════════════════════ */

  function activateMothershipBeam() {
    if (!_mothership || !_mothership.alive) return;
    _mothership.beamActive = true;
    _mothership.beamTimer  = 4;
    _mothership.beamLight.intensity = 3;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PYLON AUTO-FIRE
  ════════════════════════════════════════════════════════════════════════ */

  function pylonFireAtAlien(pylon, alien) {
    var geo  = new THREE.SphereGeometry(0.15, 6, 6);
    var mesh = makeMesh(geo, 0x4488FF, 0x2266FF, 0.8);

    var px = pylon.pos.x;
    var py = pylon.pos.y;
    var pz = pylon.pos.z;
    mesh.position.set(px, py, pz);
    _scene.add(mesh);

    var dx   = alien.mesh.position.x - px;
    var dy   = alien.mesh.position.y - py;
    var dz   = alien.mesh.position.z - pz;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.01) dist = 0.01;
    var speed = 35;

    _playerShots.push({
      mesh: mesh,
      vel: { x: (dx / dist) * speed, y: (dy / dist) * speed, z: (dz / dist) * speed },
      life: 3,
      damage: 30,
      isRocket: false,
      fromPylon: true
    });
  }

  function findNearestAlienToPylon(pylon) {
    var best     = null;
    var bestDist = 999;
    var i, alien, dx, dz, dist;
    for (i = 0; i < _aliens.length; i++) {
      alien = _aliens[i];
      if (!alien.alive) continue;
      dx   = alien.mesh.position.x - pylon.pos.x;
      dz   = alien.mesh.position.z - pylon.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) {
        bestDist = dist;
        best     = alien;
      }
    }
    return bestDist <= 30 ? best : null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:fixed', 'top:12px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.82)', 'color:#00FF44', 'font:bold 13px monospace',
      'padding:7px 18px', 'border:1px solid #00AA22', 'border-radius:4px',
      'z-index:10001', 'pointer-events:none', 'text-align:center',
      'letter-spacing:1px', 'text-shadow:0 0 8px #00FF44'
    ].join(';');
    document.body.appendChild(_hud);

    _clearEl = document.createElement('div');
    _clearEl.style.cssText = [
      'position:fixed', 'top:40%', 'left:50%', 'transform:translate(-50%,-50%)',
      'background:rgba(0,30,0,0.92)', 'color:#00FF88', 'font:bold 32px monospace',
      'padding:24px 48px', 'border:2px solid #00FF44', 'border-radius:8px',
      'z-index:10002', 'pointer-events:none', 'text-align:center',
      'display:none', 'text-shadow:0 0 16px #00FF44'
    ].join(';');
    _clearEl.innerHTML = 'INVASION REPELLED!<br><span style="font-size:18px">+3000 BONUS</span>';
    document.body.appendChild(_clearEl);

    _defeatEl = document.createElement('div');
    _defeatEl.style.cssText = [
      'position:fixed', 'top:40%', 'left:50%', 'transform:translate(-50%,-50%)',
      'background:rgba(30,0,0,0.92)', 'color:#FF4444', 'font:bold 32px monospace',
      'padding:24px 48px', 'border:2px solid #FF2222', 'border-radius:8px',
      'z-index:10002', 'pointer-events:none', 'text-align:center',
      'display:none', 'text-shadow:0 0 16px #FF4400'
    ].join(';');
    _defeatEl.innerHTML = 'EARTH FALLS...<br><span style="font-size:18px">ALIEN VICTORY</span>';
    document.body.appendChild(_defeatEl);

    _waveAnnEl = document.createElement('div');
    _waveAnnEl.style.cssText = [
      'position:fixed', 'top:25%', 'left:50%', 'transform:translate(-50%,-50%)',
      'background:rgba(0,10,0,0.85)', 'color:#FFFF00', 'font:bold 26px monospace',
      'padding:16px 36px', 'border:2px solid #AAAA00', 'border-radius:6px',
      'z-index:10002', 'pointer-events:none', 'text-align:center',
      'display:none', 'text-shadow:0 0 10px #FFFF00'
    ].join(';');
    document.body.appendChild(_waveAnnEl);
  }

  function showWaveAnnouncement(text) {
    _waveAnnEl.textContent = text;
    _waveAnnEl.style.display = 'block';
    _waveAnnTimer = 3;
  }

  function updateHUD() {
    if (!_hud || !_active) return;

    var alienCount    = countAliveAliens();
    var msHP          = (_mothership && _mothership.alive) ? _mothership.hp : 0;
    var msDist        = 9999;
    var poweredPylons = 0;
    var i;

    if (_mothership && _mothership.alive) {
      var mdx  = _mothership.mesh.position.x - _playerPos.x;
      var mdz  = _mothership.mesh.position.z - _playerPos.z;
      msDist   = Math.round(Math.sqrt(mdx * mdx + mdz * mdz));
    }

    for (i = 0; i < _pylons.length; i++) {
      if (_pylons[i].powered) poweredPylons++;
    }

    var msStr = (_mothership && _mothership.alive)
      ? '[MOTHERSHIP: ' + msDist + 'm HP:' + msHP + ']'
      : '[MOTHERSHIP: DESTROYED]';

    var rocketStr = _hasRocket ? ' | ROCKETS: ' + _rocketAmmo : '';
    var empStr    = ' | EMP: ' + _empCount;

    _hud.innerHTML =
      'INVASION [WAVE: ' + (_wave) + '/' + _maxWaves + '] ' +
      '[ALIENS: ' + alienCount + '] ' +
      msStr + ' ' +
      '[PYLONS: ' + poweredPylons + '/' + _pylons.length + '] | ' +
      'PLASMA: ' + _plasmaAmmo +
      rocketStr + empStr +
      ' | HP: ' + _playerHP;
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchInvasion() {
    if (_active) return;
    _active    = true;
    _score     = 0;
    _wave      = 0;
    _victory   = false;
    _defeat    = false;
    _playerHP  = 100;
    _plasmaAmmo = 60;
    _empCount  = 3;
    _hasRocket = false;
    _rocketAmmo = 3;
    _mothershipDestroyed = false;
    _mothershipAlerted   = false;
    _yaw   = 0;
    _pitch = 0;

    _aliens    = [];
    _playerShots = [];
    _alienShots  = [];
    _explosions  = [];
    _acidPuddles = [];
    _pickups     = [];
    _pylons      = [];
    _cityObjects = [];
    _wreckageLights = [];
    _mothership  = null;

    buildCity();
    buildPylons();
    buildPlasmaRifle();
    buildPlayer();

    /* Start wave 1 after short delay */
    _waveDelay  = 2;
    _wave       = 0;
    _waveActive = false;

    /* Reposition camera */
    if (_camera) {
      _camera.position.set(0, 6, 15);
      _camera.lookAt(0, 0, 0);
    }

    if (_hud) { _hud.style.display = 'block'; }
    if (_clearEl) { _clearEl.style.display = 'none'; }
    if (_defeatEl) { _defeatEl.style.display = 'none'; }

    showWaveAnnouncement('ALIEN INVASION BEGINS!');
    _waveAnnTimer = 3;
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════════════════ */

  function update(dt, scene, camera, canvas) {
    if (!_active) return;

    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    var i, j, alien, shot, pylon, pickup;
    var dx, dy, dz, dist, speed;

    /* ── Wave timing ───────────────────────────────────────────────────── */
    if (!_waveActive) {
      _waveDelay -= dt;
      if (_waveDelay <= 0) {
        _wave++;
        if (_wave > _maxWaves) {
          /* All waves done, check mothership */
          if (!_mothership || !_mothership.alive) {
            if (!_victory) {
              _victory = true;
              _score  += 3000;
              if (_mothershipDestroyed) _score += 1000;
              if (_clearEl) _clearEl.style.display = 'block';
            }
          }
        } else {
          startWave(_wave - 1);
        }
      }
    }

    /* ── Check wave clear ──────────────────────────────────────────────── */
    if (_waveActive && _wave <= _maxWaves) {
      var alive = countAliveAliens();
      var msAlive = _mothership && _mothership.alive;
      if (alive === 0 && (!msAlive || _wave < 4)) {
        _waveActive = false;
        if (_wave < _maxWaves) {
          _waveDelay = 5;
          showWaveAnnouncement('WAVE ' + _wave + ' CLEARED!');
        } else {
          /* Last wave cleared */
          if (!msAlive || _mothershipDestroyed) {
            if (!_victory) {
              _victory = true;
              _score  += 3000;
              if (_mothershipDestroyed) _score += 1000;
              if (_clearEl) _clearEl.style.display = 'block';
            }
          }
        }
      }
    }

    /* Victory / defeat checks */
    if (_playerHP <= 0 && !_defeat) {
      _defeat = true;
      if (_defeatEl) _defeatEl.style.display = 'block';
    }

    if (_victory || _defeat) {
      updateHUD();
      return;
    }

    /* ── Wave announcement timer ───────────────────────────────────────── */
    if (_waveAnnTimer > 0) {
      _waveAnnTimer -= dt;
      if (_waveAnnTimer <= 0 && _waveAnnEl) {
        _waveAnnEl.style.display = 'none';
      }
    }

    /* ── Player movement ───────────────────────────────────────────────── */
    var moveX = 0, moveZ = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    { moveZ = -1; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { moveZ =  1; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX = -1; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { moveX =  1; }

    /* Rotate move direction by yaw */
    var cosY = Math.cos(_yaw);
    var sinY = Math.sin(_yaw);
    var worldX = moveX * cosY + moveZ * sinY;
    var worldZ = -moveX * sinY + moveZ * cosY;
    var moveLen = Math.sqrt(worldX * worldX + worldZ * worldZ);
    if (moveLen > 0.01) {
      worldX /= moveLen;
      worldZ /= moveLen;
    }
    _playerPos.x += worldX * _playerSpeed * dt;
    _playerPos.z += worldZ * _playerSpeed * dt;
    /* Clamp to map */
    _playerPos.x = Math.max(-90, Math.min(90, _playerPos.x));
    _playerPos.z = Math.max(-90, Math.min(90, _playerPos.z));

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _playerMesh.rotation.y = _yaw;
    }

    /* Camera follow */
    if (_camera) {
      var camDist = 12;
      _camera.position.x = _playerPos.x + Math.sin(_yaw) * camDist;
      _camera.position.y = _playerPos.y + 7;
      _camera.position.z = _playerPos.z + Math.cos(_yaw) * camDist;
      _camera.lookAt(_playerPos.x, _playerPos.y + 1, _playerPos.z);
    }

    /* ── Fire cooldown ─────────────────────────────────────────────────── */
    if (_fireCooldown   > 0) { _fireCooldown   -= dt; }
    if (_rocketCooldown > 0) { _rocketCooldown -= dt; }
    if (_empCooldown    > 0) { _empCooldown    -= dt; }

    /* ── Auto-fire on mousedown ────────────────────────────────────────── */
    if (_mouseDown && _fireCooldown <= 0) {
      firePlayerPlasma();
      _fireCooldown = 0.18;
    }

    /* ── Pickup collision ──────────────────────────────────────────────── */
    for (i = 0; i < _pickups.length; i++) {
      pickup = _pickups[i];
      if (pickup.collected) continue;
      dx   = pickup.pos.x - _playerPos.x;
      dz   = pickup.pos.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2) {
        pickup.collected = true;
        _scene.remove(pickup.mesh);
        if (pickup.type === 'plasmaRifle') {
          _plasmaAmmo = Math.min(120, _plasmaAmmo + 45);
        } else if (pickup.type === 'rocket') {
          _hasRocket  = true;
          _rocketAmmo = Math.min(6, _rocketAmmo + 3);
        }
      }
    }

    /* ── Defense pylon interaction (E key) ────────────────────────────── */
    if (_keys['KeyE']) {
      for (i = 0; i < _pylons.length; i++) {
        pylon = _pylons[i];
        dx   = pylon.pos.x - _playerPos.x;
        dz   = pylon.pos.z - _playerPos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 4 && !pylon.powered) {
          pylon.powered    = true;
          pylon.powerTimer = 30;
          pylon.light.intensity = 2;
        }
      }
    }

    /* ── Update defense pylons ─────────────────────────────────────────── */
    for (i = 0; i < _pylons.length; i++) {
      pylon = _pylons[i];
      if (pylon.powered) {
        pylon.powerTimer -= dt;
        if (pylon.powerTimer <= 0) {
          pylon.powered = false;
          pylon.light.intensity = 0;
        } else {
          /* Pulsing light */
          pylon.light.intensity = 1.5 + Math.sin(_lastTime * 4) * 0.5;

          /* Auto-fire at nearest alien */
          pylon.fireTimer -= dt;
          if (pylon.fireTimer <= 0) {
            var target = findNearestAlienToPylon(pylon);
            if (target) {
              pylonFireAtAlien(pylon, target);
              pylon.fireTimer = 0.8;
            } else {
              pylon.fireTimer = 0.5;
            }
          }
        }
      }
    }

    /* ── Update aliens ─────────────────────────────────────────────────── */
    for (i = 0; i < _aliens.length; i++) {
      alien = _aliens[i];
      if (!alien.alive) continue;

      /* Stun */
      if (alien.stunTimer > 0) {
        alien.stunTimer -= dt;
        continue;
      }

      var ax = alien.mesh.position.x;
      var ay = alien.mesh.position.y;
      var az = alien.mesh.position.z;

      dx   = _playerPos.x - ax;
      dz   = _playerPos.z - az;
      dist = Math.sqrt(dx * dx + dz * dz);

      /* Face player */
      if (dist > 0.01) {
        alien.mesh.rotation.y = Math.atan2(dx, dz);
      }

      if (alien.type === 'scout') {
        /* Scouts float and shoot plasma */
        var targetY = 3;
        alien.mesh.position.y += (targetY - ay) * dt * 2;

        /* Drift toward player */
        if (dist > 8) {
          alien.mesh.position.x += (dx / dist) * 4 * dt;
          alien.mesh.position.z += (dz / dist) * 4 * dt;
        } else if (dist < 5) {
          alien.mesh.position.x -= (dx / dist) * 2 * dt;
          alien.mesh.position.z -= (dz / dist) * 2 * dt;
        }

        /* Alert mothership if player spotted (within 20 units) */
        if (!alien.alertedMothership && dist < 20 && _mothership && _mothership.alive) {
          alien.alertedMothership = true;
          alien.alertTimer = 0.5;
          if (!_mothership.alerted) {
            _mothership.alerted = true;
            _mothership.alertLight.intensity = 3;
            _mothershipAlerted = true;
            /* Drop 20 extra scouts */
            for (j = 0; j < 20; j++) {
              var sx = _mothership.mesh.position.x + (Math.random() - 0.5) * 30;
              var sz = _mothership.mesh.position.z + (Math.random() - 0.5) * 30;
              spawnAlien('scout', sx, sz);
            }
            showWaveAnnouncement('MOTHERSHIP ALERTED! REINFORCEMENTS INCOMING!');
          }
        }

        if (alien.alertTimer > 0) {
          alien.alertTimer -= dt;
          alien.light.intensity = 3;
          alien.light.color.setHex(0xFF4400);
        } else {
          alien.light.intensity = 0.5;
          alien.light.color.setHex(0x22FF44);
        }

        /* Fire */
        alien.fireTimer -= dt;
        if (alien.fireTimer <= 0 && dist < 25) {
          fireAlienPlasma(alien);
          alien.fireTimer = 2.5 + Math.random() * 1.5;
        }

      } else if (alien.type === 'warrior') {
        /* Warrior moves toward player, swipes at melee range */
        if (dist > 2.5) {
          var wSpeed = 4;
          alien.mesh.position.x += (dx / dist) * wSpeed * dt;
          alien.mesh.position.z += (dz / dist) * wSpeed * dt;
        } else {
          /* Melee swipe */
          alien.fireTimer -= dt;
          if (alien.fireTimer <= 0) {
            _playerHP -= 20;
            alien.fireTimer = 1.5;
            spawnExplosion(_playerPos.x, _playerPos.y + 1, _playerPos.z, 0x00FF44, 0.5);
          }
        }

        /* Bob up and down slightly (bipedal walk) */
        alien.mesh.position.y = 0.7 + Math.abs(Math.sin(_lastTime * 5 + i)) * 0.15;

      } else if (alien.type === 'tank') {
        /* Tank moves slowly, fires acid */
        if (dist > 15) {
          alien.mesh.position.x += (dx / dist) * 2 * dt;
          alien.mesh.position.z += (dz / dist) * 2 * dt;
        }
        alien.mesh.position.y = 1;

        alien.fireTimer -= dt;
        if (alien.fireTimer <= 0 && dist < 30) {
          fireAlienAcid(alien);
          alien.fireTimer = 4 + Math.random() * 2;
        }
      }

      /* Sync light position */
      alien.light.position.set(alien.mesh.position.x, alien.mesh.position.y + 1, alien.mesh.position.z);
    }

    /* ── Update mothership ──────────────────────────────────────────────── */
    if (_mothership && _mothership.alive) {
      /* Orbit */
      _mothership.orbitAngle += dt * 0.15;
      var orbitR = 45;
      _mothership.mesh.position.x = Math.cos(_mothership.orbitAngle) * orbitR;
      _mothership.mesh.position.z = -40 + Math.sin(_mothership.orbitAngle) * 20;
      _mothership.mesh.position.y = 20 + Math.sin(_lastTime * 0.3) * 2;

      /* Sync lights */
      _mothership.alertLight.position.copy(_mothership.mesh.position);
      _mothership.beamLight.position.set(
        _mothership.mesh.position.x,
        _mothership.mesh.position.y - 10,
        _mothership.mesh.position.z
      );

      /* Scout drop every 30s */
      _mothership.dropTimer -= dt;
      if (_mothership.dropTimer <= 0) {
        var dropCount = _mothership.alerted ? 5 : 3;
        for (j = 0; j < dropCount; j++) {
          var dropX = _mothership.mesh.position.x + (Math.random() - 0.5) * 20;
          var dropZ = _mothership.mesh.position.z + (Math.random() - 0.5) * 20;
          spawnAlien('scout', dropX, dropZ);
        }
        _mothership.dropTimer = 30;
      }

      /* Beam attack */
      _mothership.beamTimer -= dt;
      if (_mothership.beamTimer <= 0) {
        activateMothershipBeam();
        _mothership.beamTimer = 15 + Math.random() * 10;
      }

      if (_mothership.beamActive) {
        _mothership.beamLight.intensity = 3 + Math.sin(_lastTime * 8) * 1;
        /* Beam hits player if close */
        dx   = _mothership.mesh.position.x - _playerPos.x;
        dz   = _mothership.mesh.position.z - _playerPos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 12) {
          _playerHP -= 20 * dt;
        }
        _beamDamageTimer += dt;
        if (_beamDamageTimer > 4) {
          _mothership.beamActive = false;
          _mothership.beamLight.intensity = 0;
          _beamDamageTimer = 0;
        }
      }

      /* Slow rotation */
      _mothership.mesh.rotation.y += dt * 0.2;
    }

    /* ── Update player shots ────────────────────────────────────────────── */
    for (i = _playerShots.length - 1; i >= 0; i--) {
      shot = _playerShots[i];
      shot.life -= dt;
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.y += shot.vel.y * dt;
      shot.mesh.position.z += shot.vel.z * dt;
      if (shot.light) { shot.light.position.copy(shot.mesh.position); }

      var shotHit = false;

      /* Check vs aliens */
      for (j = 0; j < _aliens.length; j++) {
        alien = _aliens[j];
        if (!alien.alive) continue;
        dx   = shot.mesh.position.x - alien.mesh.position.x;
        dy   = shot.mesh.position.y - alien.mesh.position.y;
        dz   = shot.mesh.position.z - alien.mesh.position.z;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var hitR = alien.type === 'tank' ? 3 : (alien.type === 'warrior' ? 1.5 : 1.2);
        if (dist < hitR) {
          alien.hp -= shot.damage;
          spawnExplosion(
            shot.mesh.position.x, shot.mesh.position.y, shot.mesh.position.z,
            0x00AAFF, shot.isRocket ? 1.5 : 0.5
          );
          shotHit = true;
          if (alien.hp <= 0) {
            alien.alive = false;
            _scene.remove(alien.mesh);
            _scene.remove(alien.light);
            spawnExplosion(
              alien.mesh.position.x, alien.mesh.position.y, alien.mesh.position.z,
              0x22FF44, 1.5
            );
            _score += (alien.type === 'tank' ? 300 : alien.type === 'warrior' ? 120 : 50);
          }
          break;
        }
      }

      /* Check vs mothership */
      if (!shotHit && _mothership && _mothership.alive) {
        dx   = shot.mesh.position.x - _mothership.mesh.position.x;
        dy   = shot.mesh.position.y - _mothership.mesh.position.y;
        dz   = shot.mesh.position.z - _mothership.mesh.position.z;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        /* Check vent hit (more precise targeting) */
        var ventWx = _mothership.mesh.position.x;
        var ventWy = _mothership.mesh.position.y - 6;
        var ventWz = _mothership.mesh.position.z;
        var ventDx = shot.mesh.position.x - ventWx;
        var ventDy = shot.mesh.position.y - ventWy;
        var ventDz = shot.mesh.position.z - ventWz;
        var ventDist = Math.sqrt(ventDx * ventDx + ventDy * ventDy + ventDz * ventDz);

        if (dist < 7) {
          /* Hit main hull — less damage */
          _mothership.hp -= shot.damage * 0.5;
          shotHit = true;
          spawnExplosion(shot.mesh.position.x, shot.mesh.position.y, shot.mesh.position.z, 0x00FF44, 0.8);
        }
        if (ventDist < 2.5) {
          /* Hit the vent — full damage and count toward weakness */
          _mothership.hp -= shot.damage * 0.5; /* already counted above, just vent bonus */
          _mothership.ventHits++;
          spawnExplosion(ventWx, ventWy, ventWz, 0x00FF88, 1.2);
          shotHit = true;
          if (_mothership.ventHits >= 5) {
            /* Mothership destroyed! */
            _mothership.alive = false;
            _mothershipDestroyed = true;
            _scene.remove(_mothership.mesh);
            _scene.remove(_mothership.alertLight);
            _scene.remove(_mothership.beamLight);
            for (j = 0; j < 8; j++) {
              spawnExplosion(
                _mothership.mesh.position.x + (Math.random() - 0.5) * 12,
                _mothership.mesh.position.y + (Math.random() - 0.5) * 8,
                _mothership.mesh.position.z + (Math.random() - 0.5) * 12,
                0x00FF44, 2.5
              );
            }
            _score += 1000;
            showWaveAnnouncement('MOTHERSHIP DESTROYED! +1000');
          }
        }

        if (_mothership.hp <= 0 && _mothership.alive) {
          _mothership.alive = false;
          _mothershipDestroyed = true;
          _scene.remove(_mothership.mesh);
          _scene.remove(_mothership.alertLight);
          _scene.remove(_mothership.beamLight);
          spawnExplosion(
            _mothership.mesh.position.x, _mothership.mesh.position.y, _mothership.mesh.position.z,
            0x00FF44, 4
          );
          _score += 1000;
          showWaveAnnouncement('MOTHERSHIP DESTROYED! +1000');
        }
      }

      if (shotHit || shot.life <= 0) {
        _scene.remove(shot.mesh);
        if (shot.light) { _scene.remove(shot.light); }
        _playerShots.splice(i, 1);
      }
    }

    /* ── Update alien shots ─────────────────────────────────────────────── */
    for (i = _alienShots.length - 1; i >= 0; i--) {
      shot = _alienShots[i];
      shot.life -= dt;
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.y += shot.vel.y * dt;
      shot.mesh.position.z += shot.vel.z * dt;

      /* Gravity for acid balls */
      if (shot.type === 'acid') {
        shot.vel.y -= 9.8 * dt;
        if (shot.mesh.position.y <= 0) {
          shot.mesh.position.y = 0;
          shot.vel.y = 0;
          /* Create acid puddle */
          if (!shot.acidActive) {
            shot.acidActive = true;
            var pudGeo  = new THREE.BoxGeometry(2, 0.1, 2);
            var pudMesh = makeMesh(pudGeo, 0x66FF00, 0x44FF00, 0.7);
            pudMesh.position.set(shot.mesh.position.x, 0.05, shot.mesh.position.z);
            _scene.add(pudMesh);
            _acidPuddles.push({
              mesh: pudMesh,
              life: 3,
              pos: { x: shot.mesh.position.x, z: shot.mesh.position.z }
            });
            _scene.remove(shot.mesh);
            _alienShots.splice(i, 1);
            continue;
          }
        }
      }

      /* Hit player */
      dx   = shot.mesh.position.x - _playerPos.x;
      dy   = shot.mesh.position.y - _playerPos.y;
      dz   = shot.mesh.position.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.5) {
        _playerHP -= shot.damage;
        spawnExplosion(_playerPos.x, _playerPos.y + 1, _playerPos.z, 0x44FF44, 0.4);
        _scene.remove(shot.mesh);
        _alienShots.splice(i, 1);
        continue;
      }

      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _alienShots.splice(i, 1);
      }
    }

    /* ── Acid puddle damage ─────────────────────────────────────────────── */
    for (i = _acidPuddles.length - 1; i >= 0; i--) {
      var puddle = _acidPuddles[i];
      puddle.life -= dt;
      if (puddle.life <= 0) {
        _scene.remove(puddle.mesh);
        _acidPuddles.splice(i, 1);
        continue;
      }
      /* Damage player if standing in acid */
      dx   = puddle.pos.x - _playerPos.x;
      dz   = puddle.pos.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2) {
        _playerHP -= 25 * dt; /* 25 damage per second for 3s */
      }
    }

    /* ── Update explosions ──────────────────────────────────────────────── */
    for (i = _explosions.length - 1; i >= 0; i--) {
      var exp = _explosions[i];
      exp.life -= dt;
      var t = exp.life / exp.maxLife;
      if (exp.light) { exp.light.intensity = exp.light.intensity * (0.95); }
      if (exp.mesh) {
        var sc = 1 + (1 - t) * 2;
        exp.mesh.scale.set(sc, sc, sc);
        exp.mesh.material.opacity = t;
        exp.mesh.material.transparent = true;
      }
      if (exp.life <= 0) {
        if (exp.mesh) { _scene.remove(exp.mesh); }
        if (exp.light) { _scene.remove(exp.light); }
        _explosions.splice(i, 1);
      }
    }

    /* ── Flicker wreckage lights ────────────────────────────────────────── */
    for (i = 0; i < _wreckageLights.length; i++) {
      var wl = _wreckageLights[i];
      wl.light.intensity = wl.baseIntensity * (0.7 + Math.sin(_lastTime * 5 + wl.phase) * 0.3);
    }

    /* ── Internal time ──────────────────────────────────────────────────── */
    _lastTime += dt;

    /* ── HUD ────────────────────────────────────────────────────────────── */
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET / TEARDOWN
  ════════════════════════════════════════════════════════════════════════ */

  function reset(scene) {
    var i;

    if (!_active) return;
    _active = false;

    /* Remove all dynamic objects */
    for (i = 0; i < _aliens.length; i++) {
      if (scene) {
        scene.remove(_aliens[i].mesh);
        scene.remove(_aliens[i].light);
      }
    }
    for (i = 0; i < _playerShots.length; i++) {
      if (scene) {
        scene.remove(_playerShots[i].mesh);
        if (_playerShots[i].light) scene.remove(_playerShots[i].light);
      }
    }
    for (i = 0; i < _alienShots.length; i++) {
      if (scene) { scene.remove(_alienShots[i].mesh); }
    }
    for (i = 0; i < _explosions.length; i++) {
      if (scene) {
        if (_explosions[i].mesh)  scene.remove(_explosions[i].mesh);
        if (_explosions[i].light) scene.remove(_explosions[i].light);
      }
    }
    for (i = 0; i < _acidPuddles.length; i++) {
      if (scene) { scene.remove(_acidPuddles[i].mesh); }
    }
    for (i = 0; i < _cityObjects.length; i++) {
      if (scene) { scene.remove(_cityObjects[i]); }
    }
    for (i = 0; i < _wreckageLights.length; i++) {
      if (scene) { scene.remove(_wreckageLights[i].light); }
    }
    for (i = 0; i < _pylons.length; i++) {
      if (scene) {
        scene.remove(_pylons[i].mesh);
        scene.remove(_pylons[i].light);
      }
    }
    for (i = 0; i < _pickups.length; i++) {
      if (scene) { scene.remove(_pickups[i].mesh); }
    }
    if (_mothership && scene) {
      scene.remove(_mothership.mesh);
      scene.remove(_mothership.alertLight);
      scene.remove(_mothership.beamLight);
    }
    if (_playerMesh && scene) { scene.remove(_playerMesh); }

    _aliens         = [];
    _playerShots    = [];
    _alienShots     = [];
    _explosions     = [];
    _acidPuddles    = [];
    _cityObjects    = [];
    _wreckageLights = [];
    _pylons         = [];
    _pickups        = [];
    _mothership     = null;
    _playerMesh     = null;

    /* Remove HUD */
    if (_hud)     { _hud.style.display    = 'none'; }
    if (_clearEl) { _clearEl.style.display = 'none'; }
    if (_defeatEl){ _defeatEl.style.display = 'none'; }
    if (_waveAnnEl){ _waveAnnEl.style.display = 'none'; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;
    var now = Date.now();

    /* A+I activation */
    if (e.code === 'KeyA') { _aiPressTime.A = now; }
    if (e.code === 'KeyI') { _aiPressTime.I = now; }
    if (Math.abs(_aiPressTime.A - _aiPressTime.I) <= AI_WINDOW &&
        _aiPressTime.A > 0 && _aiPressTime.I > 0) {
      if (!_active) {
        _aiPressTime.A = 0;
        _aiPressTime.I = 0;
        launchInvasion();
      }
    }

    if (!_active) return;

    /* G key — EMP grenade */
    if (e.code === 'KeyG') { fireEMP(); }

    /* R key — rocket launcher */
    if (e.code === 'KeyR' && _hasRocket && _rocketCooldown <= 0) {
      firePlayerRocket();
      _rocketCooldown = 1.5;
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    var rect = _canvas ? _canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var nx = (e.clientX - rect.left) / rect.width  * 2 - 1;
    var ny = (e.clientY - rect.top)  / rect.height * 2 - 1;
    _mouseX = nx;
    _mouseY = ny;
    _yaw    = -nx * Math.PI;
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) { _mouseDown = true; }
  }

  function onMouseUp(e) {
    if (e.button === 0) { _mouseDown = false; }
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
    window.addEventListener('mouseup',   onMouseUp);
  }

  return {
    init:   init,
    update: function (dt, scene, camera, canvas) { update(dt, scene, camera, canvas); },
    reset:  function (scene) { reset(scene); }
  };

}());
