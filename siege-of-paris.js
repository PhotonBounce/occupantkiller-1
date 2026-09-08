/* ============================================================
 *  SIEGE-OF-PARIS.JS — WW2 defense of Paris landmarks FPS module
 *  Activation: S + P simultaneous keypress (both within 400ms)
 *  Defend Eiffel Tower, Notre Dame, Arc de Triomphe across 5 waves
 * ============================================================ */
window.SiegeOfParis = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── Activation ──────────────────────────────────────────────────────────────
  var _active = false;
  var _keyTimes = {};
  var _ACTIVATION_WINDOW = 400;

  // ── Scene references ────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _animId = null;
  var _clock = null;

  // ── HUD ─────────────────────────────────────────────────────────────────────
  var _hudEl = null;

  // ── Input ────────────────────────────────────────────────────────────────────
  var _keys = {};
  var _mouse = { x: 0, y: 0, dx: 0, dy: 0 };
  var _mouseLocked = false;

  // ── Player state ─────────────────────────────────────────────────────────────
  var _playerX = 0;
  var _playerY = 1.8;
  var _playerZ = 30;
  var _playerYaw = 0;
  var _playerPitch = 0;
  var _playerCrouching = false;
  var _playerHP = 100;
  var _onRooftop = false;
  var _damageMultiplier = 1;

  // ── Weapons ──────────────────────────────────────────────────────────────────
  var _shootCooldown = 0;
  var _SHOOT_COOLDOWN = 0.25;
  var _bulletDamage = 20;

  // ── Defenses ─────────────────────────────────────────────────────────────────
  var _barricadeUses = 3;
  var _molotovCount = 3;
  var _resistanceFighterCharges = 2;
  var _repairKits = 2;
  var _barricades = [];   // { mesh, x, y, z }
  var _molotovs = [];     // { mesh, vx, vy, vz, x, y, z, bounced, fire }
  var _fireAreas = [];    // { mesh, x, z, timer, radius }
  var _allies = [];       // { mesh, x, z, hp, targetIdx, attackTimer }
  var _repairTarget = -1;
  var _repairTimer = 0;

  // ── Landmarks ────────────────────────────────────────────────────────────────
  var _landmarks = [
    { name: 'EIFFEL',     hp: 500, maxHp: 500, x:  0, z: -20, mesh: null, warningLight: null },
    { name: 'NOTRE DAME', hp: 500, maxHp: 500, x: -30, z: 10,  mesh: null, warningLight: null },
    { name: 'ARC',        hp: 500, maxHp: 500, x:  30, z: 10,  mesh: null, warningLight: null }
  ];
  var _landmarksFallen = 0;

  // ── Enemies ──────────────────────────────────────────────────────────────────
  var _enemies = [];
  // { mesh, type, hp, maxHp, speed, x, z, targetLandmark, damage,
  //   attackTimer, attackCooldown, cannon, cannonTimer, cannonCooldown,
  //   mortarTimer, mortarCooldown, isCommander, buffRadius }

  var _enemyProjectiles = [];  // { mesh, x, y, z, vx, vy, vz, damage, splash }
  var _mortarStrikes = [];     // { mesh, x, z, timer, radius, damage }

  // ── Wave system ──────────────────────────────────────────────────────────────
  var _currentWave = 0;
  var _totalWaves = 5;
  var _waveActive = false;
  var _betweenWaves = false;
  var _betweenTimer = 0;
  var _BETWEEN_WAVE_DURATION = 20;
  var _waveTimer = 0;
  var _MAX_WAVE_DURATION = 72; // 6 minutes / 5 waves ~= 72s each
  var _gameOver = false;
  var _victory = false;
  var _spawnQueue = [];
  var _spawnTimer = 0;

  // Wave definitions
  var WAVE_DEFS = [
    // Wave 1: 8 infantry, 60HP, rifles
    { infantry: 8, armoredCars: 0, tanks: 0, mortarTeams: 0, commander: false },
    // Wave 2: 12 infantry + 2 armored cars, 150HP
    { infantry: 12, armoredCars: 2, tanks: 0, mortarTeams: 0, commander: false },
    // Wave 3: 15 infantry + 1 tank
    { infantry: 15, armoredCars: 0, tanks: 1, mortarTeams: 0, commander: false },
    // Wave 4: 20 infantry + 2 tanks + mortar team
    { infantry: 20, armoredCars: 0, tanks: 2, mortarTeams: 1, commander: false },
    // Wave 5: 30 infantry + 3 tanks + 1 commander
    { infantry: 30, armoredCars: 0, tanks: 3, mortarTeams: 0, commander: true }
  ];

  // ── Rooftop zones ─────────────────────────────────────────────────────────────
  var _rooftops = [];  // { x, y, z, w, d } raised platforms

  // ── Bullets ──────────────────────────────────────────────────────────────────
  var _bullets = [];  // { mesh, x, y, z, vx, vy, vz, life }

  // ── Warning light pulse ───────────────────────────────────────────────────────
  var _warningPulseTimer = 0;

  // ── Toast ────────────────────────────────────────────────────────────────────
  var _toastEl = null;
  var _toastTimer = 0;

  // ──────────────────────────────────────────────────────────────────────────
  // GEOMETRY HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  function _makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineSegmentsMaterial ? new THREE.LineSegmentsMaterial({ color: color }) : new THREE.LineBasicMaterial({ color: color });
    // THREE.LineSegments uses LineBasicMaterial
    var ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
    return ls;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD ENVIRONMENT
  // ──────────────────────────────────────────────────────────────────────────

  function _buildEnvironment() {
    // Ground — cobblestone streets
    var ground = _makeBox(200, 0.5, 200, 0x777766, 0, -0.25, 0);
    _scene.add(ground);

    // River Seine — divides map horizontally
    var seine = _makeBox(200, 0.3, 8, 0x224466, 0, 0.1, -5);
    _scene.add(seine);

    // Boulevard road connecting landmarks (north-south and east-west)
    var blvdNS = _makeBox(8, 0.2, 80, 0x666655, 0, 0.1, 0);
    _scene.add(blvdNS);
    var blvdEW = _makeBox(80, 0.2, 8, 0x666655, 0, 0.1, 10);
    _scene.add(blvdEW);

    // Buildings for cover — scattered boxes
    var buildingData = [
      { x: -15, z: -35, w: 8, h: 6, d: 6 },
      { x:  15, z: -35, w: 6, h: 5, d: 8 },
      { x: -20, z:  25, w: 7, h: 8, d: 5 },
      { x:  20, z:  25, w: 5, h: 7, d: 7 },
      { x: -40, z: -10, w: 8, h: 6, d: 6 },
      { x:  40, z: -10, w: 6, h: 7, d: 8 },
      { x: -12, z:  40, w: 7, h: 5, d: 6 },
      { x:  12, z:  40, w: 6, h: 6, d: 7 },
      { x: -35, z: -30, w: 8, h: 5, d: 8 },
      { x:  35, z: -30, w: 7, h: 6, d: 7 }
    ];
    for (var bi = 0; bi < buildingData.length; bi++) {
      var bd = buildingData[bi];
      var bldg = _makeBox(bd.w, bd.h, bd.d, 0x887766, bd.x, bd.h * 0.5, bd.z);
      _scene.add(bldg);
      // Add rooftop zone
      _rooftops.push({ x: bd.x, y: bd.h, z: bd.z, w: bd.w, d: bd.d });
      // Rooftop platform marker
      var roofPlatform = _makeBox(bd.w, 0.3, bd.d, 0x998877, bd.x, bd.h + 0.15, bd.z);
      _scene.add(roofPlatform);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD EIFFEL TOWER
  // ──────────────────────────────────────────────────────────────────────────

  function _buildEiffelTower() {
    var lx = _landmarks[0].x;
    var lz = _landmarks[0].z;
    var group = new THREE.Group();

    // Base: 4 legs — cylinders tapering up
    var legPositions = [
      { x: -3, z: -3 }, { x: 3, z: -3 },
      { x: -3, z:  3 }, { x: 3, z:  3 }
    ];
    for (var li = 0; li < legPositions.length; li++) {
      var leg = _makeCylinder(0.3, 1.2, 10, 6, 0x997755, legPositions[li].x, 5, legPositions[li].z);
      group.add(leg);
    }

    // Mid section narrower
    var mid = _makeCylinder(0.4, 0.8, 8, 6, 0x997755, 0, 18, 0);
    group.add(mid);

    // Top spire
    var spire = _makeCylinder(0.1, 0.4, 10, 6, 0x887744, 0, 27, 0);
    group.add(spire);

    // Lattice cross-braces using LineSegments
    var latticePoints = [];
    // Lower cross braces
    latticePoints.push({ x: -3, y: 2,  z: -3 }, { x:  3, y: 6,  z: -3 });
    latticePoints.push({ x:  3, y: 2,  z: -3 }, { x: -3, y: 6,  z: -3 });
    latticePoints.push({ x: -3, y: 2,  z:  3 }, { x:  3, y: 6,  z:  3 });
    latticePoints.push({ x:  3, y: 2,  z:  3 }, { x: -3, y: 6,  z:  3 });
    latticePoints.push({ x: -3, y: 2,  z: -3 }, { x: -3, y: 6,  z:  3 });
    latticePoints.push({ x:  3, y: 2,  z: -3 }, { x:  3, y: 6,  z:  3 });
    // Upper cross braces
    latticePoints.push({ x: -1.5, y: 12, z: -1.5 }, { x:  1.5, y: 16, z: -1.5 });
    latticePoints.push({ x:  1.5, y: 12, z: -1.5 }, { x: -1.5, y: 16, z: -1.5 });
    latticePoints.push({ x: -1.5, y: 12, z:  1.5 }, { x:  1.5, y: 16, z:  1.5 });
    latticePoints.push({ x:  1.5, y: 12, z:  1.5 }, { x: -1.5, y: 16, z:  1.5 });
    // Horizontal ring braces
    latticePoints.push({ x: -3, y: 8, z: -3 }, { x:  3, y: 8, z: -3 });
    latticePoints.push({ x:  3, y: 8, z: -3 }, { x:  3, y: 8, z:  3 });
    latticePoints.push({ x:  3, y: 8, z:  3 }, { x: -3, y: 8, z:  3 });
    latticePoints.push({ x: -3, y: 8, z:  3 }, { x: -3, y: 8, z: -3 });

    var lattice = _makeLineSegments(latticePoints, 0xBB9966);
    group.add(lattice);

    // Warning light at top
    var wLight = new THREE.PointLight(0xFFCC00, 0, 20);
    wLight.position.set(0, 32, 0);
    group.add(wLight);
    _landmarks[0].warningLight = wLight;

    group.position.set(lx, 0, lz);
    _scene.add(group);
    _landmarks[0].mesh = group;

    // Collision marker (invisible box for proximity detection)
    _landmarks[0].cx = lx;
    _landmarks[0].cz = lz;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD NOTRE DAME
  // ──────────────────────────────────────────────────────────────────────────

  function _buildNotreDame() {
    var lx = _landmarks[1].x;
    var lz = _landmarks[1].z;
    var group = new THREE.Group();

    // Main body: 25x12x15
    var body = _makeBox(25, 12, 15, 0x888877, 0, 6, 0);
    group.add(body);

    // Twin towers: CylinderGeometry
    var tower1 = _makeCylinder(2.5, 2.5, 20, 8, 0x777766, -10, 10, -5);
    group.add(tower1);
    var tower2 = _makeCylinder(2.5, 2.5, 20, 8, 0x777766,  10, 10, -5);
    group.add(tower2);

    // Tower spires — cones on top
    var spire1 = _makeCone(2, 5, 8, 0x666655, -10, 22.5, -5);
    group.add(spire1);
    var spire2 = _makeCone(2, 5, 8, 0x666655,  10, 22.5, -5);
    group.add(spire2);

    // Rose window detail (small cylinder inset)
    var roseWindow = _makeCylinder(2, 2, 0.4, 12, 0x9999AA, 0, 8, -7.7);
    group.add(roseWindow);

    // Warning light
    var wLight = new THREE.PointLight(0xFFCC00, 0, 25);
    wLight.position.set(0, 25, 0);
    group.add(wLight);
    _landmarks[1].warningLight = wLight;

    group.position.set(lx, 0, lz);
    _scene.add(group);
    _landmarks[1].mesh = group;
    _landmarks[1].cx = lx;
    _landmarks[1].cz = lz;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD ARC DE TRIOMPHE
  // ──────────────────────────────────────────────────────────────────────────

  function _buildArcDeTriomphe() {
    var lx = _landmarks[2].x;
    var lz = _landmarks[2].z;
    var group = new THREE.Group();

    // Main arch body: 12x10x4
    var body = _makeBox(12, 10, 4, 0x887766, 0, 5, 0);
    group.add(body);

    // Arch opening — two side pillars with gap in the air center
    // Left pillar
    var pillarL = _makeBox(3.5, 6, 4, 0x776655, -3.75, 3, 0);
    group.add(pillarL);
    // Right pillar
    var pillarR = _makeBox(3.5, 6, 4, 0x776655,  3.75, 3, 0);
    group.add(pillarR);
    // Top beam over arch (leaves center air gap)
    var topBeam = _makeBox(12, 3, 4, 0x887766, 0, 8.5, 0);
    group.add(topBeam);

    // Decorative cornice
    var cornice = _makeBox(13, 0.8, 5, 0x998877, 0, 10.4, 0);
    group.add(cornice);

    // Warning light
    var wLight = new THREE.PointLight(0xFFCC00, 0, 20);
    wLight.position.set(0, 12, 0);
    group.add(wLight);
    _landmarks[2].warningLight = wLight;

    group.position.set(lx, 0, lz);
    _scene.add(group);
    _landmarks[2].mesh = group;
    _landmarks[2].cx = lx;
    _landmarks[2].cz = lz;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CAMERA / PLAYER SETUP
  // ──────────────────────────────────────────────────────────────────────────

  function _setupCamera() {
    _camera.fov = 75;
    _camera.near = 0.1;
    _camera.far = 500;
    _camera.updateProjectionMatrix();
    _playerX = 0;
    _playerY = 1.8;
    _playerZ = 30;
    _playerYaw = 0;
    _playerPitch = 0;
    _playerCrouching = false;
    _updateCameraPosition();
  }

  function _updateCameraPosition() {
    var eyeY = _playerCrouching ? 0.9 : 1.8;
    // Check if on rooftop
    var roofY = _getRooftopY(_playerX, _playerZ);
    _onRooftop = (roofY !== null);
    if (roofY !== null) {
      _playerY = roofY + eyeY;
      _damageMultiplier = (_playerCrouching && _onRooftop) ? 2 : 1;
    } else {
      _playerY = eyeY;
      _damageMultiplier = 1;
    }
    _camera.position.set(_playerX, _playerY, _playerZ);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _playerYaw;
    _camera.rotation.x = _playerPitch;
  }

  function _getRooftopY(px, pz) {
    for (var ri = 0; ri < _rooftops.length; ri++) {
      var rf = _rooftops[ri];
      if (Math.abs(px - rf.x) < rf.w * 0.5 + 0.5 &&
          Math.abs(pz - rf.z) < rf.d * 0.5 + 0.5) {
        return rf.y;
      }
    }
    return null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LIGHTING
  // ──────────────────────────────────────────────────────────────────────────

  function _setupLighting() {
    var ambient = new THREE.AmbientLight(0x334455, 0.6);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFEECC, 0.8);
    sun.position.set(50, 80, 30);
    _scene.add(sun);
    // Wartime haze — slight fog
    _scene.fog = new THREE.Fog(0x334455, 60, 200);
    _scene.background = new THREE.Color(0x334455);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SPAWN ENEMIES
  // ──────────────────────────────────────────────────────────────────────────

  function _buildSpawnQueue(waveIdx) {
    _spawnQueue = [];
    var def = WAVE_DEFS[waveIdx];
    if (!def) return;

    var i;
    for (i = 0; i < def.infantry; i++) {
      _spawnQueue.push('infantry');
    }
    for (i = 0; i < def.armoredCars; i++) {
      _spawnQueue.push('armoredCar');
    }
    for (i = 0; i < def.tanks; i++) {
      _spawnQueue.push('tank');
    }
    for (i = 0; i < def.mortarTeams; i++) {
      _spawnQueue.push('mortarTeam');
    }
    if (def.commander) {
      _spawnQueue.push('commander');
    }

    // Shuffle
    for (i = _spawnQueue.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = _spawnQueue[i];
      _spawnQueue[i] = _spawnQueue[j];
      _spawnQueue[j] = tmp;
    }
  }

  function _spawnEnemy(type) {
    // Spawn from north (z = -80 to -60), spread along X
    var sx = (Math.random() - 0.5) * 80;
    var sz = -70 - Math.random() * 20;

    // Pick target landmark
    var tgtIdx = Math.floor(Math.random() * _landmarks.length);
    // Prefer landmarks with more HP to distribute attack
    var tgt = _landmarks[tgtIdx];

    var e = null;

    if (type === 'infantry') {
      var mesh = _makeBox(0.8, 1.8, 0.8, 0x555544, sx, 0.9, sz);
      _scene.add(mesh);
      e = {
        mesh: mesh, type: 'infantry',
        hp: 60, maxHp: 60,
        speed: 4 + Math.random() * 1,
        x: sx, z: sz,
        targetLandmark: tgtIdx,
        damage: 10, attackTimer: 0, attackCooldown: 1.0,
        cannon: false, cannonTimer: 0, cannonCooldown: 0,
        mortarTimer: 0, mortarCooldown: 0,
        isCommander: false, buffRadius: 0, alive: true
      };
    } else if (type === 'armoredCar') {
      var acMesh = _makeBox(3, 1.5, 5, 0x445533, sx, 0.75, sz);
      _scene.add(acMesh);
      // Turret
      var turret = _makeBox(1.2, 0.8, 1.2, 0x334422, 0, 1.15, 0);
      acMesh.add(turret);
      e = {
        mesh: acMesh, type: 'armoredCar',
        hp: 150, maxHp: 150,
        speed: 6 + Math.random(),
        x: sx, z: sz,
        targetLandmark: tgtIdx,
        damage: 15, attackTimer: 0, attackCooldown: 2.0,
        cannon: false, cannonTimer: 0, cannonCooldown: 0,
        mortarTimer: 0, mortarCooldown: 0,
        isCommander: false, buffRadius: 0, alive: true
      };
    } else if (type === 'tank') {
      var tankMesh = _makeBox(3, 1.2, 5, 0x445533, sx, 0.6, sz);
      _scene.add(tankMesh);
      var barrel = _makeBox(0.3, 0.3, 3, 0x334422, 0, 0.8, -2.5);
      tankMesh.add(barrel);
      e = {
        mesh: tankMesh, type: 'tank',
        hp: 200, maxHp: 200,
        speed: 2.5 + Math.random() * 0.5,
        x: sx, z: sz,
        targetLandmark: tgtIdx,
        damage: 10, attackTimer: 0, attackCooldown: 1.0,
        cannon: true, cannonTimer: 0, cannonCooldown: 4.0,
        cannonDamage: 80,
        mortarTimer: 0, mortarCooldown: 0,
        isCommander: false, buffRadius: 0, alive: true
      };
    } else if (type === 'mortarTeam') {
      var mortMesh = _makeBox(1.2, 1.8, 1.2, 0x555544, sx, 0.9, sz);
      _scene.add(mortMesh);
      // Mortar tube
      var tube = _makeCylinder(0.2, 0.2, 1.5, 6, 0x333322, 0, 1.5, 0);
      mortMesh.add(tube);
      e = {
        mesh: mortMesh, type: 'mortarTeam',
        hp: 80, maxHp: 80,
        speed: 2.0,
        x: sx, z: sz,
        targetLandmark: tgtIdx,
        damage: 5, attackTimer: 0, attackCooldown: 1.0,
        cannon: false, cannonTimer: 0, cannonCooldown: 0,
        mortarTimer: 8, mortarCooldown: 8.0,
        mortarDamage: 60,
        isCommander: false, buffRadius: 0, alive: true
      };
    } else if (type === 'commander') {
      var cmdMesh = _makeCylinder(0.8, 0.8, 2.2, 8, 0x333322, sx, 1.1, sz);
      _scene.add(cmdMesh);
      // Commander hat
      var hat = _makeCone(0.6, 0.8, 8, 0x222211, 0, 1.5, 0);
      cmdMesh.add(hat);
      e = {
        mesh: cmdMesh, type: 'commander',
        hp: 500, maxHp: 500,
        speed: 3.0,
        x: sx, z: sz,
        targetLandmark: tgtIdx,
        damage: 15, attackTimer: 0, attackCooldown: 1.0,
        cannon: false, cannonTimer: 0, cannonCooldown: 0,
        mortarTimer: 0, mortarCooldown: 0,
        isCommander: true, buffRadius: 12, alive: true
      };
    }

    if (e) {
      _enemies.push(e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SHOOT
  // ──────────────────────────────────────────────────────────────────────────

  function _shoot() {
    if (_shootCooldown > 0) return;
    _shootCooldown = _SHOOT_COOLDOWN;

    // Direction from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);

    // Bullet mesh
    var bMesh = _makeBox(0.08, 0.08, 0.4, 0xFFFF88, _playerX, _playerY, _playerZ);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      x: _playerX, y: _playerY, z: _playerZ,
      vx: dir.x * 60, vy: dir.y * 60, vz: dir.z * 60,
      life: 2.0,
      damage: _bulletDamage * _damageMultiplier
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PLACE BARRICADE
  // ──────────────────────────────────────────────────────────────────────────

  function _placeBarricade() {
    if (_barricadeUses <= 0) {
      _toast('No barricades left!', 2000, '#FF4444');
      return;
    }
    _barricadeUses--;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    var bx = _playerX + dir.x * 3;
    var bz = _playerZ + dir.z * 3;
    var bMesh = _makeBox(2, 1.5, 0.4, 0x887766, bx, 0.75, bz);
    _scene.add(bMesh);
    _barricades.push({ mesh: bMesh, x: bx, y: 0.75, z: bz });
    _toast('Barricade placed! (' + _barricadeUses + ' left)', 1500, '#AAFFAA');
    _updateHUD();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // THROW MOLOTOV
  // ──────────────────────────────────────────────────────────────────────────

  function _throwMolotov() {
    if (_molotovCount <= 0) {
      _toast('No Molotovs left!', 2000, '#FF4444');
      return;
    }
    _molotovCount--;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);

    var mMesh = _makeSphere(0.25, 0xFF6600, _playerX, _playerY, _playerZ);
    mMesh.material.emissive = new THREE.Color(0xFF6600);
    mMesh.material.emissiveIntensity = 0.8;
    _scene.add(mMesh);

    _molotovs.push({
      mesh: mMesh,
      x: _playerX, y: _playerY, z: _playerZ,
      vx: dir.x * 15, vy: dir.y * 15 + 5, vz: dir.z * 15,
      bounced: false,
      life: 5.0,
      exploded: false
    });
    _toast('Molotov thrown! (' + _molotovCount + ' left)', 1500, '#FFAA44');
    _updateHUD();
  }

  function _explodeMolotov(m) {
    m.exploded = true;
    // Remove bottle mesh
    _scene.remove(m.mesh);

    // Create fire area: PlaneGeometry fire
    var fireGeo = new THREE.PlaneGeometry(8, 8);
    var fireMat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF4400), emissiveIntensity: 0.9, transparent: true, opacity: 0.7 });
    var fireMesh = new THREE.Mesh(fireGeo, fireMat);
    fireMesh.rotation.x = -Math.PI / 2;
    fireMesh.position.set(m.x, 0.1, m.z);
    _scene.add(fireMesh);

    // Fire light
    var fireLight = new THREE.PointLight(0xFF6600, 2, 12);
    fireLight.position.set(m.x, 1, m.z);
    _scene.add(fireLight);

    _fireAreas.push({
      mesh: fireMesh,
      light: fireLight,
      x: m.x, z: m.z,
      timer: 10.0,
      radius: 4,
      damage: 20
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SPAWN RESISTANCE FIGHTER
  // ──────────────────────────────────────────────────────────────────────────

  function _spawnResistanceFighter() {
    if (_resistanceFighterCharges <= 0) {
      _toast('No resistance fighters left!', 2000, '#FF4444');
      return;
    }
    _resistanceFighterCharges--;
    var ax = _playerX + (Math.random() - 0.5) * 4;
    var az = _playerZ + (Math.random() - 0.5) * 4;
    var aMesh = _makeBox(0.8, 1.8, 0.8, 0x554433, ax, 0.9, az);
    _scene.add(aMesh);
    _allies.push({
      mesh: aMesh, x: ax, z: az, hp: 100, maxHp: 100,
      targetIdx: -1, attackTimer: 0, attackCooldown: 0.8,
      shootTimer: 0, alive: true
    });
    _toast('Resistance fighter deployed! (' + _resistanceFighterCharges + ' left)', 1500, '#AAFFAA');
    _updateHUD();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REPAIR LANDMARK
  // ──────────────────────────────────────────────────────────────────────────

  function _tryRepair() {
    if (_repairKits <= 0) {
      _toast('No repair kits left!', 2000, '#FF4444');
      return;
    }
    // Find nearest landmark
    var best = -1;
    var bestDist = 8;
    for (var li = 0; li < _landmarks.length; li++) {
      var lm = _landmarks[li];
      if (lm.hp <= 0) continue;
      var dx = _playerX - lm.cx;
      var dz = _playerZ - lm.cz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) {
        bestDist = dist;
        best = li;
      }
    }
    if (best === -1) {
      _toast('No landmark in range to repair!', 2000, '#FF4444');
      _repairTarget = -1;
      return;
    }
    _repairTarget = best;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HUD
  // ──────────────────────────────────────────────────────────────────────────

  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'siege-of-paris-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:12px',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var waveStr = _currentWave + '/' + _totalWaves;
    var eiffelHp = Math.max(0, Math.round(_landmarks[0].hp));
    var notreDameHp = Math.max(0, Math.round(_landmarks[1].hp));
    var arcHp = Math.max(0, Math.round(_landmarks[2].hp));
    var enemyCount = 0;
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].alive) enemyCount++;
    }
    var repairInfo = _repairKits > 0 ? ' [HOLD E=REPAIR:' + _repairKits + ']' : '';
    var dmgInfo = (_damageMultiplier > 1) ? ' [SNIPER 2x]' : '';
    _hudEl.textContent = 'SIEGE OF PARIS [WAVE:' + waveStr + ']' +
      ' [EIFFEL:' + eiffelHp + 'HP]' +
      ' [NOTRE DAME:' + notreDameHp + 'HP]' +
      ' [ARC:' + arcHp + 'HP]' +
      ' [ENEMIES:' + enemyCount + ']' +
      ' | MOLOTOV:' + _molotovCount +
      ' BARRICADE:' + _barricadeUses +
      ' FIGHTER:' + _resistanceFighterCharges +
      repairInfo + dmgInfo;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TOAST
  // ──────────────────────────────────────────────────────────────────────────

  function _ensureToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'siege-of-paris-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#FFFFFF',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 18px',
      'border-radius:5px',
      'pointer-events:none',
      'z-index:10000',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function _toast(msg, duration, color) {
    _ensureToast();
    _toastEl.textContent = msg;
    _toastEl.style.color = color || '#FFFFFF';
    _toastEl.style.display = 'block';
    _toastTimer = (duration || 2000) / 1000;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WAVE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  function _startWave(waveIdx) {
    _currentWave = waveIdx + 1;
    _waveActive = true;
    _betweenWaves = false;
    _waveTimer = 0;
    _buildSpawnQueue(waveIdx);
    _spawnTimer = 0;
    _resistanceFighterCharges = 2;

    _toast('WAVE ' + _currentWave + ' INCOMING! DEFEND PARIS!', 4000, '#FF4444');
    _updateHUD();
  }

  function _checkWaveEnd() {
    if (!_waveActive) return;
    var anyAlive = false;
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].alive) {
        anyAlive = true;
        break;
      }
    }
    if (_spawnQueue.length === 0 && !anyAlive) {
      _waveActive = false;
      _betweenWaves = true;
      _betweenTimer = _BETWEEN_WAVE_DURATION;

      if (_currentWave >= _totalWaves) {
        _checkVictory();
        return;
      }
      _toast('WAVE ' + _currentWave + ' CLEARED! Rest period: ' + _BETWEEN_WAVE_DURATION + 's', 5000, '#AAFFAA');
    }
  }

  function _checkVictory() {
    var standing = 0;
    for (var li = 0; li < _landmarks.length; li++) {
      if (_landmarks[li].hp > 0) standing++;
    }
    if (standing >= 2) {
      _victory = true;
      _gameOver = true;
      _toast('PARIS DEFENDED! Victory — ' + standing + ' landmarks standing!', 10000, '#FFD700');
    } else {
      _gameOver = true;
      _victory = false;
      _toast('PARIS HAS FALLEN! All hope is lost.', 10000, '#FF4444');
    }
  }

  function _checkLandmarksFallen() {
    var fallen = 0;
    for (var li = 0; li < _landmarks.length; li++) {
      if (_landmarks[li].hp <= 0) fallen++;
    }
    if (fallen >= 2 && !_gameOver) {
      _gameOver = true;
      _victory = false;
      _toast('PARIS HAS FALLEN! 2 landmarks destroyed!', 10000, '#FF4444');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────────────────────────────────

  function _update(dt) {
    if (_gameOver) return;

    _updatePlayerMovement(dt);
    _updateShooting(dt);
    _updateBullets(dt);
    _updateMolotovs(dt);
    _updateFireAreas(dt);
    _updateAllies(dt);
    _updateEnemies(dt);
    _updateEnemyProjectiles(dt);
    _updateMortarStrikes(dt);
    _updateLandmarks(dt);
    _updateWarningLights(dt);
    _updateRepair(dt);
    _updateWaveLogic(dt);
    _updateToast(dt);
    _updateHUD();
  }

  function _updateToast(dt) {
    if (_toastTimer > 0) {
      _toastTimer -= dt;
      if (_toastTimer <= 0 && _toastEl) {
        _toastEl.style.display = 'none';
      }
    }
  }

  function _updatePlayerMovement(dt) {
    var speed = _playerCrouching ? 3 : 6;
    var dirX = 0;
    var dirZ = 0;

    if (_keys['W'] || _keys['ARROWUP'])    dirZ = -1;
    if (_keys['S'] || _keys['ARROWDOWN'])  dirZ =  1;
    if (_keys['A'] || _keys['ARROWLEFT'])  dirX = -1;
    if (_keys['D'] || _keys['ARROWRIGHT']) dirX =  1;

    // Apply yaw to direction
    var cos = Math.cos(_playerYaw);
    var sin = Math.sin(_playerYaw);
    var mx = (cos * dirX - sin * dirZ) * speed * dt;
    var mz = (sin * dirX + cos * dirZ) * speed * dt;

    _playerX += mx;
    _playerZ += mz;

    // Clamp to map
    _playerX = Math.max(-90, Math.min(90, _playerX));
    _playerZ = Math.max(-90, Math.min(90, _playerZ));

    _updateCameraPosition();
  }

  function _updateShooting(dt) {
    if (_shootCooldown > 0) _shootCooldown -= dt;
    if (_keys['MOUSE0'] || _keys[' ']) {
      _shoot();
    }
  }

  function _updateBullets(dt) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.life -= dt;
      b.mesh.position.set(b.x, b.y, b.z);

      var hit = false;

      // Check enemy hits
      for (var ei = 0; ei < _enemies.length; ei++) {
        var e = _enemies[ei];
        if (!e.alive) continue;
        var dx = b.x - e.x;
        var dy = b.y - (e.type === 'tank' ? 0.6 : 0.9);
        var dz = b.z - e.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 2.0) {
          var dmg = b.damage;
          e.hp -= dmg;
          if (e.hp <= 0) {
            e.alive = false;
            _scene.remove(e.mesh);
          }
          hit = true;
          break;
        }
      }

      if (hit || b.life <= 0 || b.y < -1) {
        _scene.remove(b.mesh);
        _bullets.splice(bi, 1);
      }
    }
  }

  function _updateMolotovs(dt) {
    for (var mi = _molotovs.length - 1; mi >= 0; mi--) {
      var m = _molotovs[mi];
      if (m.exploded) {
        _molotovs.splice(mi, 1);
        continue;
      }
      m.vx *= 0.99;
      m.vz *= 0.99;
      m.vy -= 9.8 * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.z += m.vz * dt;
      m.life -= dt;

      if (m.y <= 0.25 && !m.bounced) {
        m.bounced = true;
        m.vy = Math.abs(m.vy) * 0.3;
      }
      if (m.y <= 0.25 && m.bounced && Math.abs(m.vy) < 0.5) {
        m.y = 0.25;
        m.vy = 0;
        _explodeMolotov(m);
      }
      if (m.life <= 0 && !m.exploded) {
        _explodeMolotov(m);
      }

      m.mesh.position.set(m.x, m.y, m.z);
    }
  }

  function _updateFireAreas(dt) {
    _warningPulseTimer += dt;
    for (var fi = _fireAreas.length - 1; fi >= 0; fi--) {
      var fa = _fireAreas[fi];
      fa.timer -= dt;

      // Damage enemies in fire area
      for (var ei = 0; ei < _enemies.length; ei++) {
        var e = _enemies[ei];
        if (!e.alive) continue;
        var dx = e.x - fa.x;
        var dz = e.z - fa.z;
        if (Math.sqrt(dx * dx + dz * dz) < fa.radius) {
          e.hp -= fa.damage * dt;
          if (e.hp <= 0) {
            e.alive = false;
            _scene.remove(e.mesh);
          }
        }
      }

      // Pulse fire opacity
      if (fa.mesh && fa.mesh.material) {
        fa.mesh.material.opacity = 0.5 + 0.3 * Math.sin(_warningPulseTimer * 8);
      }
      if (fa.light) {
        fa.light.intensity = 1.5 + Math.sin(_warningPulseTimer * 10) * 0.7;
      }

      if (fa.timer <= 0) {
        _scene.remove(fa.mesh);
        if (fa.light) _scene.remove(fa.light);
        _fireAreas.splice(fi, 1);
      }
    }
  }

  function _updateAllies(dt) {
    for (var ai = _allies.length - 1; ai >= 0; ai--) {
      var ally = _allies[ai];
      if (!ally.alive) {
        _scene.remove(ally.mesh);
        _allies.splice(ai, 1);
        continue;
      }

      // Find nearest enemy
      var nearestDist = 999;
      var nearestIdx = -1;
      for (var ei = 0; ei < _enemies.length; ei++) {
        var e = _enemies[ei];
        if (!e.alive) continue;
        var dx = e.x - ally.x;
        var dz = e.z - ally.z;
        var d = Math.sqrt(dx * dx + dz * dz);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = ei;
        }
      }

      ally.targetIdx = nearestIdx;

      if (nearestIdx >= 0) {
        var tgt = _enemies[nearestIdx];
        var adx = tgt.x - ally.x;
        var adz = tgt.z - ally.z;
        var adist = Math.sqrt(adx * adx + adz * adz);

        if (adist > 10) {
          // Move toward enemy
          ally.x += (adx / adist) * 4 * dt;
          ally.z += (adz / adist) * 4 * dt;
          ally.mesh.position.set(ally.x, 0.9, ally.z);
        } else {
          // Attack
          ally.attackTimer -= dt;
          if (ally.attackTimer <= 0) {
            ally.attackTimer = ally.attackCooldown;
            tgt.hp -= 15;
            if (tgt.hp <= 0) {
              tgt.alive = false;
              _scene.remove(tgt.mesh);
            }
          }
        }
      }
    }
  }

  function _updateEnemies(dt) {
    // Commander buff: collect commander positions
    var commanderPositions = [];
    for (var ci = 0; ci < _enemies.length; ci++) {
      if (_enemies[ci].isCommander && _enemies[ci].alive) {
        commanderPositions.push({ x: _enemies[ci].x, z: _enemies[ci].z, r: _enemies[ci].buffRadius });
      }
    }

    for (var ei = 0; ei < _enemies.length; ei++) {
      var e = _enemies[ei];
      if (!e.alive) continue;

      // Commander speed buff
      var speedMult = 1;
      for (var cbi = 0; cbi < commanderPositions.length; cbi++) {
        var cp = commanderPositions[cbi];
        var cdx = e.x - cp.x;
        var cdz = e.z - cp.z;
        if (Math.sqrt(cdx * cdx + cdz * cdz) < cp.r) {
          speedMult = 1.3;
          break;
        }
      }

      // Move toward target landmark
      var lm = _landmarks[e.targetLandmark];
      if (!lm || lm.hp <= 0) {
        // Retarget
        var bestLmIdx = -1;
        var bestLmHp = -1;
        for (var lmi = 0; lmi < _landmarks.length; lmi++) {
          if (_landmarks[lmi].hp > bestLmHp) {
            bestLmHp = _landmarks[lmi].hp;
            bestLmIdx = lmi;
          }
        }
        e.targetLandmark = bestLmIdx;
        lm = _landmarks[bestLmIdx];
      }

      if (!lm) continue;

      var dx = lm.cx - e.x;
      var dz = lm.cz - e.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 3) {
        e.x += (dx / dist) * e.speed * speedMult * dt;
        e.z += (dz / dist) * e.speed * speedMult * dt;
        e.mesh.position.set(e.x, e.mesh.position.y, e.z);
      } else {
        // Attack landmark
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = e.attackCooldown;
          lm.hp -= e.damage;
          if (lm.hp < 0) lm.hp = 0;
        }
      }

      // Tank cannon shot
      if (e.cannon) {
        e.cannonTimer -= dt;
        if (e.cannonTimer <= 0) {
          e.cannonTimer = e.cannonCooldown;
          _fireCannonAt(e, lm);
        }
      }

      // Mortar team
      if (e.mortarTimer > 0) {
        e.mortarTimer -= dt;
        if (e.mortarTimer <= 0) {
          e.mortarTimer = e.mortarCooldown;
          _fireMortarAt(e, lm);
        }
      }
    }
  }

  function _fireCannonAt(enemy, lm) {
    var projMesh = _makeSphere(0.3, 0x333333, enemy.x, 1.5, enemy.z);
    _scene.add(projMesh);

    var tx = lm.cx + (Math.random() - 0.5) * 4;
    var tz = lm.cz + (Math.random() - 0.5) * 4;
    var dx = tx - enemy.x;
    var dz = tz - enemy.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var speed = 20;

    _enemyProjectiles.push({
      mesh: projMesh,
      x: enemy.x, y: 1.5, z: enemy.z,
      vx: (dx / dist) * speed,
      vy: 4,
      vz: (dz / dist) * speed,
      damage: enemy.cannonDamage || 80,
      splash: true,
      life: 5.0,
      targetX: tx, targetZ: tz
    });
  }

  function _fireMortarAt(enemy, lm) {
    // Mortar creates strike marker — delayed impact
    var tx = lm.cx + (Math.random() - 0.5) * 10;
    var tz = lm.cz + (Math.random() - 0.5) * 10;

    // Marker
    var markerGeo = new THREE.PlaneGeometry(4, 4);
    var markerMat = new THREE.MeshLambertMaterial({ color: 0xFF0000, transparent: true, opacity: 0.4 });
    var marker = new THREE.Mesh(markerGeo, markerMat);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(tx, 0.2, tz);
    _scene.add(marker);

    _mortarStrikes.push({
      mesh: marker,
      x: tx, z: tz,
      timer: 3.0,    // delay before strike
      radius: 4,
      damage: 60,
      triggered: false
    });
  }

  function _updateEnemyProjectiles(dt) {
    for (var pi = _enemyProjectiles.length - 1; pi >= 0; pi--) {
      var proj = _enemyProjectiles[pi];
      proj.vy -= 9.8 * dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.z += proj.vz * dt;
      proj.life -= dt;
      proj.mesh.position.set(proj.x, proj.y, proj.z);

      if (proj.y <= 0 || proj.life <= 0) {
        // Splash damage to landmark
        for (var li = 0; li < _landmarks.length; li++) {
          var lm = _landmarks[li];
          if (lm.hp <= 0) continue;
          var dx = proj.x - lm.cx;
          var dz = proj.z - lm.cz;
          if (Math.sqrt(dx * dx + dz * dz) < 6) {
            lm.hp -= proj.damage;
            if (lm.hp < 0) lm.hp = 0;
          }
        }
        // Damage player
        var pdx = proj.x - _playerX;
        var pdz = proj.z - _playerZ;
        if (Math.sqrt(pdx * pdx + pdz * pdz) < 3) {
          _playerHP -= 30;
          if (_playerHP < 0) _playerHP = 0;
          _toast('You took cannon fire! HP: ' + _playerHP, 1500, '#FF4444');
        }

        _scene.remove(proj.mesh);
        _enemyProjectiles.splice(pi, 1);
      }
    }
  }

  function _updateMortarStrikes(dt) {
    for (var msi = _mortarStrikes.length - 1; msi >= 0; msi--) {
      var ms = _mortarStrikes[msi];
      ms.timer -= dt;

      // Pulse marker
      if (ms.mesh && ms.mesh.material) {
        ms.mesh.material.opacity = 0.2 + 0.3 * Math.abs(Math.sin(ms.timer * 5));
      }

      if (ms.timer <= 0 && !ms.triggered) {
        ms.triggered = true;
        // Deal damage in radius
        for (var li = 0; li < _landmarks.length; li++) {
          var lm = _landmarks[li];
          if (lm.hp <= 0) continue;
          var ldx = ms.x - lm.cx;
          var ldz = ms.z - lm.cz;
          if (Math.sqrt(ldx * ldx + ldz * ldz) < ms.radius + 4) {
            lm.hp -= ms.damage;
            if (lm.hp < 0) lm.hp = 0;
          }
        }
        // Damage player
        var pdx = ms.x - _playerX;
        var pdz = ms.z - _playerZ;
        if (Math.sqrt(pdx * pdx + pdz * pdz) < ms.radius) {
          _playerHP -= 40;
          if (_playerHP < 0) _playerHP = 0;
          _toast('Mortar hit! HP: ' + _playerHP, 1500, '#FF4444');
        }
        // Damage allies in radius
        for (var ali = 0; ali < _allies.length; ali++) {
          var al = _allies[ali];
          var adx = ms.x - al.x;
          var adz = ms.z - al.z;
          if (Math.sqrt(adx * adx + adz * adz) < ms.radius) {
            al.hp -= 60;
            if (al.hp <= 0) al.alive = false;
          }
        }

        _scene.remove(ms.mesh);
        _mortarStrikes.splice(msi, 1);
      }
    }
  }

  function _updateLandmarks(dt) {
    for (var li = 0; li < _landmarks.length; li++) {
      var lm = _landmarks[li];
      if (lm.hp <= 0) {
        // Hide mesh if just fallen
        if (lm.mesh && lm.mesh.visible) {
          lm.mesh.visible = false;
          _landmarksFallen++;
          _toast(lm.name + ' HAS FALLEN!', 5000, '#FF2200');
          _checkLandmarksFallen();
        }
      }
    }
  }

  function _updateWarningLights(dt) {
    _warningPulseTimer += dt;
    var pulse = 0.8 + 0.8 * Math.abs(Math.sin(_warningPulseTimer * 3));
    for (var li = 0; li < _landmarks.length; li++) {
      var lm = _landmarks[li];
      if (lm.warningLight) {
        if (lm.hp > 0 && lm.hp < 200) {
          lm.warningLight.intensity = pulse;
        } else {
          lm.warningLight.intensity = 0;
        }
      }
    }
  }

  function _updateRepair(dt) {
    if (!_keys['E']) {
      _repairTarget = -1;
      _repairTimer = 0;
      return;
    }
    _tryRepair();
    if (_repairTarget < 0) return;

    _repairTimer += dt;
    if (_repairTimer >= 5.0) {
      _repairTimer = 0;
      _repairKits--;
      _landmarks[_repairTarget].hp = Math.min(
        _landmarks[_repairTarget].maxHp,
        _landmarks[_repairTarget].hp + 100
      );
      _toast(_landmarks[_repairTarget].name + ' repaired! +100 HP (' + _repairKits + ' kits left)', 2500, '#AAFFAA');
      _repairTarget = -1;
      if (_repairKits <= 0) {
        _toast('No repair kits remaining!', 2000, '#FF4444');
      }
    }
  }

  function _updateWaveLogic(dt) {
    if (_gameOver) return;

    if (_betweenWaves) {
      _betweenTimer -= dt;
      if (_betweenTimer <= 0) {
        if (_currentWave < _totalWaves) {
          _startWave(_currentWave);
        }
      }
      return;
    }

    if (!_waveActive && _currentWave === 0) {
      // Game just started, kick off wave 1 after short delay
      _betweenWaves = true;
      _betweenTimer = 5;
      _toast('Defend Paris! Wave 1 incoming in 5 seconds... [B=Barricade G=Molotov R=Fighter E=Repair C=Crouch]', 5000, '#FFD700');
      _currentWave = -1; // Will become 0 when wave 1 starts
      return;
    }

    if (_waveActive) {
      _waveTimer += dt;

      // Spawn from queue
      _spawnTimer -= dt;
      if (_spawnTimer <= 0 && _spawnQueue.length > 0) {
        var type = _spawnQueue.shift();
        _spawnEnemy(type);
        _spawnTimer = 0.8 + Math.random() * 0.5;
      }

      _checkWaveEnd();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ANIM LOOP
  // ──────────────────────────────────────────────────────────────────────────

  function _animLoop() {
    if (!_active) return;
    _animId = requestAnimationFrame(_animLoop);
    var dt = _clock ? _clock.getDelta() : 0.016;
    if (dt > 0.1) dt = 0.1;
    _update(dt);
    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MOUSE INPUT
  // ──────────────────────────────────────────────────────────────────────────

  function _onMouseMove(e) {
    if (!_active) return;
    var sensitivity = 0.002;
    _playerYaw -= e.movementX * sensitivity;
    _playerPitch -= e.movementY * sensitivity;
    _playerPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _playerPitch));
    _updateCameraPosition();
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      _keys['MOUSE0'] = true;
      _shoot();
      // Request pointer lock
      if (!_mouseLocked && _renderer) {
        _renderer.domElement.requestPointerLock();
      }
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) _keys['MOUSE0'] = false;
  }

  function _onPointerLockChange() {
    _mouseLocked = (document.pointerLockElement === (_renderer ? _renderer.domElement : null));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // KEYBOARD INPUT
  // ──────────────────────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keys[key] = true;

    // Activation: S + P within 400ms
    if (key === 'S' || key === 'P') {
      _keyTimes[key] = Date.now();
      var other = key === 'S' ? 'P' : 'S';
      if (_keyTimes[other] && (Date.now() - _keyTimes[other]) <= _ACTIVATION_WINDOW) {
        if (_active) {
          _deactivate();
        } else {
          _activate();
        }
        _keyTimes = {};
        return;
      }
    }

    if (!_active) return;

    // Crouch
    if (key === 'C') {
      _playerCrouching = !_playerCrouching;
      _updateCameraPosition();
      _toast(_playerCrouching ? 'Crouching [2x damage on rooftop]' : 'Standing', 1000, '#AAAAFF');
    }

    // Barricade
    if (key === 'B') {
      _placeBarricade();
    }

    // Molotov
    if (key === 'G') {
      _throwMolotov();
    }

    // Resistance fighter
    if (key === 'R') {
      _spawnResistanceFighter();
    }

    // Space — shoot
    if (key === ' ') {
      e.preventDefault();
      _shoot();
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keys[key] = false;
    if (key === 'E') {
      _repairTarget = -1;
      _repairTimer = 0;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTIVATE / DEACTIVATE
  // ──────────────────────────────────────────────────────────────────────────

  function _activate() {
    if (_active) return;

    // Find existing scene/renderer/camera from window globals
    _scene = window._scene || window.scene || null;
    _camera = window._camera || window.camera || null;
    _renderer = window._renderer || window.renderer || null;

    if (!_scene || !_camera || !_renderer) {
      // Create own
      _renderer = new THREE.WebGLRenderer({ antialias: true });
      _renderer.setSize(window.innerWidth, window.innerHeight);
      _renderer.shadowMap.enabled = false;
      document.body.appendChild(_renderer.domElement);
      _renderer.domElement.style.position = 'fixed';
      _renderer.domElement.style.top = '0';
      _renderer.domElement.style.left = '0';
      _renderer.domElement.style.zIndex = '8000';

      _scene = new THREE.Scene();
      _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    }

    _clock = new THREE.Clock();
    _active = true;

    // Reset state
    _reset();

    // Build world
    _setupLighting();
    _buildEnvironment();
    _buildEiffelTower();
    _buildNotreDame();
    _buildArcDeTriomphe();
    _setupCamera();
    _buildHUD();
    _ensureToast();

    // Start wave logic
    _waveActive = false;
    _betweenWaves = false;
    _currentWave = 0;
    _gameOver = false;
    _victory = false;

    // Listen for mouse on renderer
    _renderer.domElement.addEventListener('mousemove', _onMouseMove);
    _renderer.domElement.addEventListener('mousedown', _onMouseDown);
    _renderer.domElement.addEventListener('mouseup', _onMouseUp);
    document.addEventListener('pointerlockchange', _onPointerLockChange);

    _animLoop();

    _toast('SIEGE OF PARIS — Defend the city! S+P to exit. B=Barricade G=Molotov R=Fighter C=Crouch E=Repair', 6000, '#FFD700');
  }

  function _deactivate() {
    if (!_active) return;
    _active = false;

    if (_animId) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }

    // Remove renderer if we created it
    if (_renderer && _renderer.domElement && _renderer.domElement.parentNode) {
      _renderer.domElement.removeEventListener('mousemove', _onMouseMove);
      _renderer.domElement.removeEventListener('mousedown', _onMouseDown);
      _renderer.domElement.removeEventListener('mouseup', _onMouseUp);
    }
    document.removeEventListener('pointerlockchange', _onPointerLockChange);
    if (document.exitPointerLock) document.exitPointerLock();

    // Remove HUD
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
    if (_toastEl && _toastEl.parentNode) {
      _toastEl.parentNode.removeChild(_toastEl);
      _toastEl = null;
    }

    // Clear scene objects
    _clearScene();

    _toast = function () {};
  }

  function _clearScene() {
    var i;
    for (i = _enemies.length - 1; i >= 0; i--) {
      if (_enemies[i].mesh) _scene.remove(_enemies[i].mesh);
    }
    _enemies = [];
    for (i = _bullets.length - 1; i >= 0; i--) {
      if (_bullets[i].mesh) _scene.remove(_bullets[i].mesh);
    }
    _bullets = [];
    for (i = _molotovs.length - 1; i >= 0; i--) {
      if (_molotovs[i].mesh) _scene.remove(_molotovs[i].mesh);
    }
    _molotovs = [];
    for (i = _fireAreas.length - 1; i >= 0; i--) {
      if (_fireAreas[i].mesh) _scene.remove(_fireAreas[i].mesh);
      if (_fireAreas[i].light) _scene.remove(_fireAreas[i].light);
    }
    _fireAreas = [];
    for (i = _allies.length - 1; i >= 0; i--) {
      if (_allies[i].mesh) _scene.remove(_allies[i].mesh);
    }
    _allies = [];
    for (i = _barricades.length - 1; i >= 0; i--) {
      if (_barricades[i].mesh) _scene.remove(_barricades[i].mesh);
    }
    _barricades = [];
    for (i = _enemyProjectiles.length - 1; i >= 0; i--) {
      if (_enemyProjectiles[i].mesh) _scene.remove(_enemyProjectiles[i].mesh);
    }
    _enemyProjectiles = [];
    for (i = _mortarStrikes.length - 1; i >= 0; i--) {
      if (_mortarStrikes[i].mesh) _scene.remove(_mortarStrikes[i].mesh);
    }
    _mortarStrikes = [];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RESET
  // ──────────────────────────────────────────────────────────────────────────

  function _reset() {
    _playerHP = 100;
    _playerX = 0;
    _playerY = 1.8;
    _playerZ = 30;
    _playerYaw = 0;
    _playerPitch = 0;
    _playerCrouching = false;
    _onRooftop = false;
    _damageMultiplier = 1;

    _shootCooldown = 0;

    _barricadeUses = 3;
    _molotovCount = 3;
    _resistanceFighterCharges = 2;
    _repairKits = 2;
    _repairTarget = -1;
    _repairTimer = 0;

    _landmarks = [
      { name: 'EIFFEL',     hp: 500, maxHp: 500, x:  0,  z: -20, mesh: null, warningLight: null, cx: 0,   cz: -20 },
      { name: 'NOTRE DAME', hp: 500, maxHp: 500, x: -30, z:  10,  mesh: null, warningLight: null, cx: -30, cz:  10 },
      { name: 'ARC',        hp: 500, maxHp: 500, x:  30, z:  10,  mesh: null, warningLight: null, cx:  30, cz:  10 }
    ];
    _landmarksFallen = 0;

    _enemies = [];
    _enemyProjectiles = [];
    _mortarStrikes = [];
    _bullets = [];
    _molotovs = [];
    _fireAreas = [];
    _allies = [];
    _barricades = [];
    _rooftops = [];
    _spawnQueue = [];
    _spawnTimer = 0;

    _currentWave = 0;
    _waveActive = false;
    _betweenWaves = false;
    _betweenTimer = 0;
    _waveTimer = 0;
    _gameOver = false;
    _victory = false;
    _keys = {};
    _warningPulseTimer = 0;
    _toastTimer = 0;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────────────────────

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function update(dt) {
    if (_active && !_gameOver) {
      _update(dt || 0.016);
    }
  }

  function reset() {
    if (_active) _deactivate();
    _reset();
  }

  init();

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:       init,
    update:     update,
    reset:      reset,
    activate:   _activate,
    deactivate: _deactivate,
    isActive:   function () { return _active; }
  };

}());
