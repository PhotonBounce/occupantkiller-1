/* ───────────────────────────────────────────────────────────────────────────
   drug-lord.js — Drug Lord Compound Raid
   API: window.DrugLord = { init, update, reset }
   Controls:
     D + L (together, within 400ms) → activate module
     WASD                           → move player
     Mouse                          → aim / look
     E (within 2u range)            → knife kill (silent) / interact / disable alarm
     B                              → place explosive charge at tunnel entrance
     F                              → commandeer nearby SUV
     Left Click                     → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.DrugLord = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active        = false;
  var _dPressTime    = 0;
  var _lPressTime    = 0;
  var _keys          = {};

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _score             = 0;
  var _alarmActive       = false;
  var _alarmTime         = 0;
  var _stealthWindow     = 30;    // seconds of no-alarm stealth window
  var _stealthWindowActive = true;
  var _perimeterKills    = 0;     // silent knife kills on perimeter guards
  var _evidenceCollected = 0;
  var _vaultCollected    = false;
  var _tunnelBlocked     = false;
  var _tunnelChargeTime  = 0;
  var _gameTime          = 0;
  var _reinforcementTimer = 90;
  var _reinforcementCountdown = 90;
  var _missionEnd        = false;

  /* ── Drug lord ─────────────────────────────────────────────────────────── */
  var _drugLord          = null;
  var _drugLordHP        = 500;
  var _drugLordAlive     = true;
  var _drugLordInVilla   = true;
  var _drugLordFleeing   = false;
  var _bodyguards        = [];

  /* ── Soldiers ──────────────────────────────────────────────────────────── */
  var _soldiers          = [];   // { mesh, hp, alive, onRoof, fireTimer, pos }
  var _soldierCount      = 15;
  var _aliveSoldiers     = 15;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player            = null;
  var _playerPos         = null;
  var _playerHP          = 100;
  var _playerInSUV       = false;
  var _currentSUV        = null;
  var _mouseX            = 0;
  var _mouseY            = 0;
  var _yaw               = 0;
  var _pitch             = 0;
  var _playerBullets     = [];  // { mesh, vel, life }
  var _fireTimer         = 0;
  var _fireRate          = 0.1; // seconds between shots

  /* ── Bullets / projectiles ─────────────────────────────────────────────── */
  var _enemyBullets      = [];  // { mesh, vel, life }
  var _bulletSpeed       = 20;

  /* ── Compound geometry references ──────────────────────────────────────── */
  var _compoundGroup     = null;
  var _villa             = null;
  var _lab               = null;
  var _garage            = null;
  var _vault             = null;
  var _evidencePackages  = [];
  var _tunnel            = null;
  var _tunnelEntrance    = null;
  var _alarmBox          = null;
  var _helicopterGroup   = null;
  var _helicopterActive  = false;
  var _helicopterPos     = null;

  /* ── Vehicles ──────────────────────────────────────────────────────────── */
  var _playerSUVs        = [];  // 3 commandeerable vehicles in garage
  var _cartelVehicles    = [];  // 4 chasing vehicles after alarm

  /* ── Roof platforms ────────────────────────────────────────────────────── */
  var _roofPlatforms     = [];

  /* ── Trees / jungle ────────────────────────────────────────────────────── */
  var _jungleTrees       = [];

  /* ── Alarm buzzer (AudioContext) ───────────────────────────────────────── */
  var _audioCtx          = null;
  var _alarmOsc          = null;
  var _alarmGain         = null;

  /* ── HUD element ───────────────────────────────────────────────────────── */
  var _hud               = null;

  /* ── Keycard ───────────────────────────────────────────────────────────── */
  var _hasKeycard        = false;
  var _keycardPickup     = null;

  /* ── Charge mesh ───────────────────────────────────────────────────────── */
  var _chargeMesh        = null;

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HELPERS                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function _box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 6, 6);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _v3(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD COMPOUND                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildCompound() {
    _compoundGroup = new THREE.Group();

    /* Ground */
    var ground = _box(50, 0.2, 40, 0x6B5A2A);
    ground.position.set(0, -0.1, 0);
    _compoundGroup.add(ground);

    /* Perimeter walls — 30x20 rectangle of adobe */
    var wallMat = _makeMat(0x8B6914);
    var wallH   = 3;
    var wallT   = 0.8;
    /* North wall */
    var wN = new THREE.Mesh(new THREE.BoxGeometry(30, wallH, wallT), wallMat);
    wN.position.set(0, wallH / 2, -10);
    _compoundGroup.add(wN);
    /* South wall */
    var wS = new THREE.Mesh(new THREE.BoxGeometry(30, wallH, wallT), wallMat);
    wS.position.set(0, wallH / 2, 10);
    _compoundGroup.add(wS);
    /* East wall */
    var wE = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, 20), wallMat);
    wE.position.set(15, wallH / 2, 0);
    _compoundGroup.add(wE);
    /* West wall */
    var wW = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, 20), wallMat);
    wW.position.set(-15, wallH / 2, 0);
    _compoundGroup.add(wW);

    /* Main villa 15x5x10 */
    _villa = _box(15, 5, 10, 0xD4A56A);
    _villa.position.set(-2, 2.5, -4);
    _compoundGroup.add(_villa);

    /* Processing lab 8x4x8 */
    _lab = _box(8, 4, 8, 0x887744);
    _lab.position.set(8, 2, 2);
    _compoundGroup.add(_lab);

    /* Garage 10x4x12 */
    _garage = _box(10, 4, 12, 0x6B6B6B);
    _garage.position.set(-9, 2, 5);
    _compoundGroup.add(_garage);

    /* SUVs inside garage */
    var suvOffsets = [[-7, 0.8, 2], [-9, 0.8, 5], [-11, 0.8, 8]];
    for (var i = 0; i < 3; i++) {
      var suv = _buildSUV(0x221100);
      suv.position.set(suvOffsets[i][0], suvOffsets[i][1], suvOffsets[i][2]);
      _compoundGroup.add(suv);
      _playerSUVs.push({ mesh: suv, commandeered: false, speed: 8 });
    }

    /* Money vault 3x3x3 golden — inside villa, locked */
    _vault = _box(3, 3, 3, 0xFFD700);
    _vault.position.set(-3, 1.5, -4);
    _compoundGroup.add(_vault);

    /* Keycard pickup near a dead guard position */
    _keycardPickup = _box(0.3, 0.1, 0.5, 0x00FF88);
    _keycardPickup.position.set(0, 0.1, 7);
    _compoundGroup.add(_keycardPickup);

    /* Drug evidence packages — 5 crates */
    var evidencePositions = [
      [4, 0.5, -2], [10, 0.5, 0], [6, 0.5, 4],
      [-5, 0.5, 2], [-1, 0.5, -6]
    ];
    for (var j = 0; j < 5; j++) {
      var pkg = _box(0.8, 0.6, 0.8, 0xFFFFAA);
      pkg.position.set(evidencePositions[j][0], evidencePositions[j][1], evidencePositions[j][2]);
      _compoundGroup.add(pkg);
      _evidencePackages.push({ mesh: pkg, collected: false });
    }

    /* Roof platforms on villa and lab */
    var rp1 = _box(15, 0.5, 10, 0xC09050);
    rp1.position.set(-2, 5.25, -4);
    _compoundGroup.add(rp1);
    _roofPlatforms.push(rp1);

    var rp2 = _box(8, 0.5, 8, 0x7A6634);
    rp2.position.set(8, 4.25, 2);
    _compoundGroup.add(rp2);
    _roofPlatforms.push(rp2);

    /* Alarm control box */
    _alarmBox = _box(0.6, 1.2, 0.3, 0xFF4400);
    _alarmBox.position.set(0, 1, 9.5);
    _compoundGroup.add(_alarmBox);

    /* Sub-tunnel under processing lab */
    _tunnel = _box(2.5, 2, 20, 0x3A3020);
    _tunnel.position.set(8, -1, 10);
    _compoundGroup.add(_tunnel);

    /* Tunnel entrance marker */
    _tunnelEntrance = _box(2.5, 0.2, 2.5, 0x5A4010);
    _tunnelEntrance.position.set(8, 0.1, 1);
    _compoundGroup.add(_tunnelEntrance);

    /* Ambient light */
    var ambient = new THREE.AmbientLight(0xFFEECC, 0.6);
    _scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFFFDD, 0.9);
    sun.position.set(20, 40, 20);
    _scene.add(sun);

    _scene.add(_compoundGroup);
  }

  function _buildSUV(color) {
    var group = new THREE.Group();
    /* Body */
    var body = _box(2.5, 1.2, 4.5, color);
    body.position.y = 0.6;
    group.add(body);
    /* Roof */
    var roof = _box(2, 0.7, 2.5, color);
    roof.position.set(0, 1.55, -0.3);
    group.add(roof);
    /* Wheels */
    var wPos = [[-1.4, 0, 1.5], [1.4, 0, 1.5], [-1.4, 0, -1.5], [1.4, 0, -1.5]];
    for (var i = 0; i < 4; i++) {
      var wheel = _cyl(0.4, 0.4, 0.3, 8, 0x111111);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wPos[i][0], wPos[i][1], wPos[i][2]);
      group.add(wheel);
    }
    /* Roof turret */
    var turretBase = _cyl(0.3, 0.3, 0.3, 8, 0x222222);
    turretBase.position.set(0, 2, -0.3);
    group.add(turretBase);
    var turretBarrel = _box(0.15, 0.15, 1, 0x333333);
    turretBarrel.position.set(0, 2.2, -0.8);
    group.add(turretBarrel);
    return group;
  }

  function _buildJungle() {
    var treePositions = [
      [0, 0, 16], [5, 0, 17], [-5, 0, 16], [10, 0, 18],
      [-10, 0, 17], [3, 0, 19], [-3, 0, 18], [8, 0, 15],
      [-8, 0, 15], [0, 0, 20], [6, 0, 20], [-6, 0, 19]
    ];
    for (var i = 0; i < treePositions.length; i++) {
      var trunk = _box(0.4, 2, 0.4, 0x5B3A1A);
      trunk.position.set(treePositions[i][0], 1, treePositions[i][2]);
      _scene.add(trunk);
      var canopy = _box(2, 2.5, 2, 0x224422);
      canopy.position.set(treePositions[i][0], 3.2, treePositions[i][2]);
      _scene.add(canopy);
      _jungleTrees.push(trunk);
      _jungleTrees.push(canopy);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD DRUG LORD + BODYGUARDS                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildDrugLord() {
    var group = new THREE.Group();
    /* Body — CylinderGeometry 1.4x scale */
    var body = _cyl(0.4, 0.4, 1.8, 8, 0x4A0000);
    body.scale.set(1.4, 1.4, 1.4);
    body.position.y = 1.26;
    group.add(body);
    /* Head */
    var head = _sphere(0.35, 0x4A0000);
    head.scale.set(1.4, 1.4, 1.4);
    head.position.y = 2.8;
    group.add(head);
    /* Gold chain accent */
    var chain = _box(0.5, 0.1, 0.1, 0xFFD700);
    chain.position.set(0, 2.1, 0.5);
    group.add(chain);
    group.position.set(-2, 0, -4);
    _scene.add(group);
    _drugLord = group;
  }

  function _buildBodyguards() {
    var positions = [[-4, 0, -4], [0, 0, -4]];
    for (var i = 0; i < 2; i++) {
      var g = new THREE.Group();
      var body = _cyl(0.35, 0.35, 1.7, 8, 0x220000);
      body.scale.set(1.2, 1.2, 1.2);
      body.position.y = 1.02;
      g.add(body);
      var head = _sphere(0.3, 0x220000);
      head.scale.set(1.2, 1.2, 1.2);
      head.position.y = 2.4;
      g.add(head);
      g.position.set(positions[i][0], 0, positions[i][1]);
      _scene.add(g);
      _bodyguards.push({ mesh: g, hp: 150, alive: true, fireTimer: 0 });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD SOLDIERS                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildSoldier(x, y, z, onRoof) {
    var g = new THREE.Group();
    var body = _cyl(0.25, 0.25, 1.6, 8, 0x3A5500);
    body.position.y = 0.8;
    g.add(body);
    var head = _sphere(0.22, 0x5A3A1A);
    head.position.y = 1.82;
    g.add(head);
    /* AK barrel */
    var barrel = _box(0.08, 0.08, 0.9, 0x222222);
    barrel.position.set(0.3, 1.1, 0.45);
    g.add(barrel);
    g.position.set(x, y, z);
    _scene.add(g);
    return { mesh: g, hp: 60, alive: true, onRoof: onRoof, fireTimer: 1 + Math.random() * 2, patrolDir: 1, startX: x, startZ: z };
  }

  function _buildSoldiers() {
    /* Perimeter guards (3) — south side, patrol */
    _soldiers.push(_buildSoldier(-10, 0, 9,   false));
    _soldiers.push(_buildSoldier(0,   0, 9.5, false));
    _soldiers.push(_buildSoldier(10,  0, 9,   false));
    /* Compound soldiers spread */
    _soldiers.push(_buildSoldier(-13, 0, 0,   false));
    _soldiers.push(_buildSoldier(13,  0, 0,   false));
    _soldiers.push(_buildSoldier(-5,  0, -8,  false));
    _soldiers.push(_buildSoldier(5,   0, -8,  false));
    _soldiers.push(_buildSoldier(2,   0, 3,   false));
    _soldiers.push(_buildSoldier(-8,  0, 6,   false));
    _soldiers.push(_buildSoldier(10,  0, 5,   false));
    _soldiers.push(_buildSoldier(-4,  0, 2,   false));
    _soldiers.push(_buildSoldier(7,   0, -5,  false));
    /* Roof guards */
    _soldiers.push(_buildSoldier(-2,  5.5, -4, true));
    _soldiers.push(_buildSoldier(1,   5.5, -6, true));
    _soldiers.push(_buildSoldier(8,   4.5, 2,  true));
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD PLAYER                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPlayer() {
    var g = new THREE.Group();
    var body = _box(0.6, 1.6, 0.4, 0x334455);
    body.position.y = 0.8;
    g.add(body);
    /* gun */
    var gun = _box(0.1, 0.1, 0.8, 0x222222);
    gun.position.set(0.35, 1.1, 0.4);
    g.add(gun);
    /* start in south jungle */
    g.position.set(0, 0, 18);
    _scene.add(g);
    _player = g;
    _playerPos = g.position;
    /* Camera behind player */
    _camera.position.set(0, 4, 24);
    _camera.lookAt(0, 1, 18);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CARTEL VEHICLES                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _spawnCartelVehicles() {
    var positions = [
      [12, 0, 8], [-12, 0, 8], [12, 0, -8], [-12, 0, -8]
    ];
    for (var i = 0; i < 4; i++) {
      var suv = _buildSUV(0x440000);
      suv.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(suv);
      _cartelVehicles.push({ mesh: suv, speed: 6 });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HELICOPTER                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildHelicopter() {
    _helicopterGroup = new THREE.Group();
    /* Body */
    var hBody = _box(5, 1.5, 2, 0x222244);
    hBody.position.y = 0;
    _helicopterGroup.add(hBody);
    /* Tail boom */
    var tail = _box(0.4, 0.4, 3, 0x222244);
    tail.position.set(0, 0.2, -2.5);
    _helicopterGroup.add(tail);
    /* Rotor */
    var rotor = _box(6, 0.1, 0.3, 0x333333);
    rotor.position.y = 1;
    _helicopterGroup.add(rotor);
    var rotor2 = _box(0.3, 0.1, 6, 0x333333);
    rotor2.position.y = 1;
    _helicopterGroup.add(rotor2);
    _helicopterGroup.position.set(0, 25, 0);
    _scene.add(_helicopterGroup);
    _helicopterPos = _helicopterGroup.position;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HUD                                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'dl-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 14px',
      'border:1px solid #8B6914',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _updateHUD() {
    if (!_hud) return;
    var alarmStr   = _alarmActive ? '<span style="color:#FF4444">ON</span>' : '<span style="color:#44FF44">OFF</span>';
    var reinforceSec = Math.max(0, Math.ceil(_reinforcementCountdown));
    var mm = _pad2(Math.floor(reinforceSec / 60));
    var ss = _pad2(reinforceSec % 60);
    _hud.innerHTML =
      'DRUG LORD [HP: ' + Math.max(0, _drugLordHP) + '] ' +
      '[SOLDIERS: ' + _aliveSoldiers + '] ' +
      '[EVIDENCE: ' + _evidenceCollected + '/5] ' +
      '[ALARM: ' + alarmStr + '] | ' +
      'REINFORCEMENTS: ' + mm + ':' + ss;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ALARM                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _triggerAlarm() {
    if (_alarmActive) return;
    _alarmActive = true;
    _alarmTime = 0;
    /* Spawn cartel vehicles */
    _spawnCartelVehicles();
    /* Buzzer sound */
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _alarmOsc  = _audioCtx.createOscillator();
      _alarmGain = _audioCtx.createGain();
      _alarmOsc.type = 'sawtooth';
      _alarmOsc.frequency.value = 880;
      _alarmGain.gain.value = 0.15;
      _alarmOsc.connect(_alarmGain);
      _alarmGain.connect(_audioCtx.destination);
      _alarmOsc.start();
    } catch (e) { /* no audio ctx available */ }
    /* Drug lord starts fleeing toward tunnel */
    _drugLordFleeing = true;
  }

  function _silenceAlarm() {
    _alarmActive = false;
    if (_alarmOsc) {
      try { _alarmOsc.stop(); } catch (e) {}
      _alarmOsc  = null;
      _alarmGain = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  SHOOT                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _firePlayerBullet() {
    var b = _sphere(0.12, 0xFFFF88);
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    b.position.copy(_camera.position).addScaledVector(dir, 1.5);
    _scene.add(b);
    _playerBullets.push({ mesh: b, vel: dir.multiplyScalar(40), life: 1.5 });
  }

  function _fireEnemyBullet(fromPos) {
    var b = _sphere(0.1, 0x8B0000);
    b.position.copy(fromPos);
    _scene.add(b);
    var dir = _playerPos.clone().sub(fromPos).normalize();
    /* Add slight inaccuracy */
    dir.x += (Math.random() - 0.5) * 0.15;
    dir.y += (Math.random() - 0.5) * 0.1;
    dir.z += (Math.random() - 0.5) * 0.15;
    dir.normalize();
    _enemyBullets.push({ mesh: b, vel: dir.multiplyScalar(_bulletSpeed), life: 2 });
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  KNIFE KILL                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryKnifeKill() {
    /* Kill nearest alive soldier within 2 units — silent if no alarm */
    var best = null;
    var bestDist = 99999;
    for (var i = 0; i < _soldiers.length; i++) {
      var s = _soldiers[i];
      if (!s.alive) continue;
      var d = _dist(_playerPos, s.mesh.position);
      if (d < 2 && d < bestDist) {
        best = s;
        bestDist = d;
      }
    }
    /* Also bodyguards */
    for (var j = 0; j < _bodyguards.length; j++) {
      var bg = _bodyguards[j];
      if (!bg.alive) continue;
      var d2 = _dist(_playerPos, bg.mesh.position);
      if (d2 < 2 && d2 < bestDist) {
        best = bg;
        bestDist = d2;
        best._isBodyguard = true;
      }
    }
    if (!best) return;
    /* Silent kill only if no alarm */
    best.hp = 0;
    best.alive = false;
    _scene.remove(best.mesh);
    if (!best._isBodyguard) {
      _aliveSoldiers = Math.max(0, _aliveSoldiers - 1);
      /* Check if perimeter guard */
      if (!_alarmActive && _stealthWindowActive) {
        _perimeterKills++;
      }
    }
    /* Alarm if >30s or alarm already active */
    if (_alarmActive) return;
    if (!_stealthWindowActive) {
      _triggerAlarm();
    }
    /* else stay silent — stealth window still open */
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INTERACT (E key)                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryInteract() {
    /* Disable alarm box */
    if (_alarmActive && _alarmBox) {
      var dAlarm = _dist(_playerPos, _alarmBox.position);
      if (dAlarm < 2.5) {
        _silenceAlarm();
        return;
      }
    }
    /* Keycard pickup */
    if (!_hasKeycard && _keycardPickup) {
      var dKey = _dist(_playerPos, _keycardPickup.position);
      if (dKey < 2) {
        _hasKeycard = true;
        _scene.remove(_keycardPickup);
        _keycardPickup = null;
        return;
      }
    }
    /* Vault — needs keycard, inside villa */
    if (!_vaultCollected && _vault && _hasKeycard) {
      var dVault = _dist(_playerPos, _vault.position);
      if (dVault < 4) {
        _vaultCollected = true;
        _score += 500;
        _vault.material.color.setHex(0x888888);
        return;
      }
    }
    /* Evidence packages */
    for (var i = 0; i < _evidencePackages.length; i++) {
      var ep = _evidencePackages[i];
      if (ep.collected) continue;
      var dEv = _dist(_playerPos, ep.mesh.position);
      if (dEv < 2) {
        ep.collected = true;
        _evidenceCollected++;
        _scene.remove(ep.mesh);
        /* DEA bonus at 3 */
        if (_evidenceCollected === 3) {
          _score += 300;
        }
        /* No-deal penalty if all 5 collected */
        if (_evidenceCollected === 5) {
          _score -= 200; /* no-deal penalty */
        }
        return;
      }
    }
    /* Knife kill is also on E */
    _tryKnifeKill();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PLACE CHARGE (B key)                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _placeCharge() {
    if (_tunnelBlocked) return;
    var dTunnel = _dist(_playerPos, _tunnelEntrance.position);
    if (dTunnel < 4) {
      _tunnelBlocked = true;
      _tunnelChargeTime = _gameTime;
      /* Visual charge */
      _chargeMesh = _box(0.6, 0.4, 0.6, 0xFF4400);
      _chargeMesh.position.copy(_tunnelEntrance.position);
      _chargeMesh.position.y = 0.3;
      _scene.add(_chargeMesh);
      /* Within 60s of alarm = capture bonus */
      if (_alarmActive && _alarmTime < 60) {
        _score += 800;
      }
      /* Drug lord cannot flee via tunnel */
      _drugLordFleeing = false;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  COMMANDEER SUV                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryCommandeerSUV() {
    if (_playerInSUV) {
      /* Exit vehicle */
      _playerInSUV = false;
      _currentSUV  = null;
      return;
    }
    for (var i = 0; i < _playerSUVs.length; i++) {
      var s = _playerSUVs[i];
      if (s.commandeered) continue;
      var d = _dist(_playerPos, s.mesh.position);
      if (d < 4) {
        s.commandeered  = true;
        _playerInSUV    = true;
        _currentSUV     = s;
        return;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  DROP REINFORCEMENTS FROM HELICOPTER                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _dropReinforcements() {
    _helicopterActive = true;
    /* Move chopper over compound */
    _helicopterGroup.position.set(0, 18, -2);
    /* Spawn 6 soldiers near helo drop zone */
    var dropPositions = [
      [-3, 0, -5], [3, 0, -5], [0, 0, -3],
      [-2, 0, -7], [2, 0, -7], [0, 0, -8]
    ];
    for (var i = 0; i < 6; i++) {
      var s = _buildSoldier(
        dropPositions[i][0],
        dropPositions[i][1],
        dropPositions[i][2],
        false
      );
      _soldiers.push(s);
      _aliveSoldiers++;
      _soldierCount++;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INPUT                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    /* Activation: D+L within 400ms */
    if (k === 'd') _dPressTime = performance.now();
    if (k === 'l') _lPressTime = performance.now();
    if (k === 'd' && _keys['l'] && Math.abs(_dPressTime - _lPressTime) < 400) {
      if (!_active) _activate();
      return;
    }
    if (k === 'l' && _keys['d'] && Math.abs(_dPressTime - _lPressTime) < 400) {
      if (!_active) _activate();
      return;
    }

    if (!_active) return;

    if (k === 'e') _tryInteract();
    if (k === 'b') _placeCharge();
    if (k === 'f') _tryCommandeerSUV();
  }

  function _onKeyUp(e) {
    _keys[e.key.toLowerCase()] = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    _mouseX += e.movementX * 0.002;
    _mouseY += e.movementY * 0.002;
    _mouseY = Math.max(-0.8, Math.min(0.8, _mouseY));
    _yaw    = -_mouseX;
    _pitch  = -_mouseY;
  }

  function _onClick() {
    if (!_active) return;
    if (_fireTimer <= 0) {
      _firePlayerBullet();
      _fireTimer = _fireRate;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ACTIVATE                                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _activate() {
    if (_active) return;
    _active = true;
    _buildCompound();
    _buildJungle();
    _buildDrugLord();
    _buildBodyguards();
    _buildSoldiers();
    _buildPlayer();
    _buildHelicopter();
    _buildHUD();
    /* Pointer lock for mouse look */
    if (_canvas) {
      _canvas.requestPointerLock = _canvas.requestPointerLock || _canvas.mozRequestPointerLock;
      if (_canvas.requestPointerLock) _canvas.requestPointerLock();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE (called each frame)                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _update(dt) {
    if (!_active || _missionEnd) return;

    _gameTime += dt;
    _fireTimer = Math.max(0, _fireTimer - dt);

    /* Stealth window expiry */
    if (_stealthWindowActive && _gameTime > _stealthWindow) {
      _stealthWindowActive = false;
    }

    /* Alarm timer */
    if (_alarmActive) {
      _alarmTime += dt;
      /* Reinforcements every 90s */
      _reinforcementCountdown -= dt;
      if (_reinforcementCountdown <= 0) {
        _dropReinforcements();
        _reinforcementCountdown = _reinforcementTimer;
      }
    } else {
      /* Count down from 90 but don't drop */
      _reinforcementCountdown = _reinforcementTimer;
    }

    /* Player movement */
    _updatePlayer(dt);

    /* Soldier AI */
    _updateSoldiers(dt);

    /* Drug lord AI */
    _updateDrugLord(dt);

    /* Bodyguards */
    _updateBodyguards(dt);

    /* Cartel vehicles chase */
    _updateCartelVehicles(dt);

    /* Helicopter rotor spin */
    if (_helicopterGroup) {
      _helicopterGroup.rotation.y += dt * 2;
    }

    /* Bullets */
    _updateBullets(dt);

    /* Collision checks */
    _checkCollisions();

    /* HUD refresh */
    _updateHUD();
  }

  function _updatePlayer(dt) {
    if (!_player) return;
    var speed = _playerInSUV ? 8 : 4;

    /* Camera-relative movement */
    var fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    var right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);

    var moved = false;
    if (_keys['w'] || _keys['arrowup']) {
      _playerPos.addScaledVector(fwd, speed * dt);
      moved = true;
    }
    if (_keys['s'] || _keys['arrowdown']) {
      _playerPos.addScaledVector(fwd, -speed * dt);
      moved = true;
    }
    if (_keys['a'] || _keys['arrowleft']) {
      _playerPos.addScaledVector(right, -speed * dt);
      moved = true;
    }
    if (_keys['d'] || _keys['arrowright']) {
      _playerPos.addScaledVector(right, speed * dt);
      moved = true;
    }

    _player.position.copy(_playerPos);
    _player.rotation.y = _yaw;

    /* Sync SUV position */
    if (_playerInSUV && _currentSUV) {
      _currentSUV.mesh.position.copy(_playerPos);
      _currentSUV.mesh.rotation.y = _yaw;
    }

    /* Camera follow */
    var camOffset = new THREE.Vector3(0, 5, 8);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    _camera.position.copy(_playerPos).add(camOffset);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    /* Auto-aim turret if in SUV */
    if (_playerInSUV && _fireTimer <= 0) {
      _autoAimTurret();
      _fireTimer = 0.4;
    }
  }

  function _autoAimTurret() {
    /* Find nearest soldier */
    var best = null;
    var bestDist = 30;
    for (var i = 0; i < _soldiers.length; i++) {
      var s = _soldiers[i];
      if (!s.alive) continue;
      var d = _dist(_playerPos, s.mesh.position);
      if (d < bestDist) {
        best = s;
        bestDist = d;
      }
    }
    if (!best) return;
    var b = _sphere(0.12, 0xFFFF88);
    b.position.copy(_playerPos).y += 2;
    _scene.add(b);
    var dir = best.mesh.position.clone().sub(b.position).normalize();
    _playerBullets.push({ mesh: b, vel: dir.multiplyScalar(35), life: 1 });
  }

  function _updateSoldiers(dt) {
    for (var i = 0; i < _soldiers.length; i++) {
      var s = _soldiers[i];
      if (!s.alive) continue;

      var distToPlayer = _dist(_playerPos, s.mesh.position);

      /* Patrol if no alarm */
      if (!_alarmActive && !s.onRoof) {
        s.mesh.position.x += s.patrolDir * 0.5 * dt;
        if (Math.abs(s.mesh.position.x - s.startX) > 3) {
          s.patrolDir *= -1;
        }
      }

      /* Shoot at player if alarm or close enough */
      var shouldShoot = _alarmActive || distToPlayer < 12;
      if (shouldShoot) {
        s.mesh.lookAt(_playerPos);
        s.fireTimer -= dt;
        if (s.fireTimer <= 0) {
          _fireEnemyBullet(s.mesh.position.clone().setY(s.mesh.position.y + 1.2));
          s.fireTimer = 1.2 + Math.random() * 1.5;
        }
        /* Chase (ground soldiers only) */
        if (!s.onRoof && _alarmActive) {
          var dir = _playerPos.clone().sub(s.mesh.position).normalize();
          s.mesh.position.addScaledVector(dir, 1.5 * dt);
        }
      }
    }
  }

  function _updateDrugLord(dt) {
    if (!_drugLord || !_drugLordAlive) return;

    if (_drugLordFleeing && !_tunnelBlocked) {
      /* Move toward tunnel entrance */
      var tunnelTarget = _tunnelEntrance.position.clone();
      var dir = tunnelTarget.sub(_drugLord.position).normalize();
      _drugLord.position.addScaledVector(dir, 2.5 * dt);
      _drugLord.lookAt(_tunnelEntrance.position);
    } else if (_alarmActive && !_drugLordFleeing) {
      /* Stay in villa area and defend */
      _drugLord.rotation.y += dt * 0.5;
    }

    /* Drug lord shooting */
    if (_alarmActive) {
      var dist = _dist(_playerPos, _drugLord.position);
      if (dist < 20) {
        _drugLord._fireTimer = (_drugLord._fireTimer || 0) - dt;
        if (_drugLord._fireTimer <= 0) {
          _fireEnemyBullet(_drugLord.position.clone().setY(_drugLord.position.y + 2));
          _drugLord._fireTimer = 0.8;
        }
      }
    }
  }

  function _updateBodyguards(dt) {
    for (var i = 0; i < _bodyguards.length; i++) {
      var bg = _bodyguards[i];
      if (!bg.alive) continue;

      /* Follow drug lord */
      if (_drugLord) {
        var offset = (i === 0) ? -1.5 : 1.5;
        var target = _drugLord.position.clone();
        target.x += offset;
        var dir = target.sub(bg.mesh.position).normalize();
        bg.mesh.position.addScaledVector(dir, 2 * dt);
      }

      /* Shoot */
      if (_alarmActive) {
        bg.mesh.lookAt(_playerPos);
        bg.fireTimer -= dt;
        if (bg.fireTimer <= 0) {
          _fireEnemyBullet(bg.mesh.position.clone().setY(bg.mesh.position.y + 1.2));
          bg.fireTimer = 1.5 + Math.random();
        }
      }
    }
  }

  function _updateCartelVehicles(dt) {
    for (var i = 0; i < _cartelVehicles.length; i++) {
      var v = _cartelVehicles[i];
      var dir = _playerPos.clone().sub(v.mesh.position).normalize();
      v.mesh.position.addScaledVector(dir, v.speed * dt);
      v.mesh.lookAt(_playerPos);
    }
  }

  function _updateBullets(dt) {
    var i;
    /* Player bullets */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      pb.mesh.position.addScaledVector(pb.vel, dt);
      pb.life -= dt;
      if (pb.life <= 0) {
        _scene.remove(pb.mesh);
        _playerBullets.splice(i, 1);
      }
    }
    /* Enemy bullets */
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      var eb = _enemyBullets[i];
      eb.mesh.position.addScaledVector(eb.vel, dt);
      eb.life -= dt;
      if (eb.life <= 0) {
        _scene.remove(eb.mesh);
        _enemyBullets.splice(i, 1);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  COLLISION                                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkCollisions() {
    var i, j;

    /* Player bullets hit soldiers */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      var hit = false;
      /* Soldiers */
      for (j = 0; j < _soldiers.length; j++) {
        var s = _soldiers[j];
        if (!s.alive) continue;
        if (_dist(pb.mesh.position, s.mesh.position) < 1) {
          s.hp -= 30;
          if (s.hp <= 0) {
            s.alive = false;
            _scene.remove(s.mesh);
            _aliveSoldiers = Math.max(0, _aliveSoldiers - 1);
            _score += 50;
            /* Trigger alarm if not already */
            if (!_alarmActive) _triggerAlarm();
          }
          hit = true;
          break;
        }
      }
      if (hit) {
        _scene.remove(pb.mesh);
        _playerBullets.splice(i, 1);
        continue;
      }
      /* Bodyguards */
      for (j = 0; j < _bodyguards.length; j++) {
        var bg = _bodyguards[j];
        if (!bg.alive) continue;
        if (_dist(pb.mesh.position, bg.mesh.position) < 1.2) {
          bg.hp -= 30;
          if (bg.hp <= 0) {
            bg.alive = false;
            _scene.remove(bg.mesh);
            _score += 100;
          }
          hit = true;
          break;
        }
      }
      if (hit) {
        _scene.remove(pb.mesh);
        _playerBullets.splice(i, 1);
        continue;
      }
      /* Drug lord */
      if (_drugLordAlive && _drugLord && _dist(pb.mesh.position, _drugLord.position) < 1.8) {
        _drugLordHP -= 20;
        if (!_alarmActive) _triggerAlarm();
        if (_drugLordHP <= 0) {
          _drugLordAlive = false;
          _scene.remove(_drugLord);
          _drugLord = null;
          _score += 1000;
          _missionEnd = true;
          _showMissionComplete();
        }
        _scene.remove(pb.mesh);
        _playerBullets.splice(i, 1);
      }
    }

    /* Enemy bullets hit player */
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      var eb = _enemyBullets[i];
      if (_dist(eb.mesh.position, _playerPos) < 0.8) {
        _playerHP -= 8;
        _scene.remove(eb.mesh);
        _enemyBullets.splice(i, 1);
        if (_playerHP <= 0) {
          _missionEnd = true;
          _showMissionFailed();
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MISSION RESULT                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _showMissionComplete() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#FFD700', 'font-family:monospace', 'font-size:28px',
      'padding:30px 50px', 'border:2px solid #FFD700',
      'border-radius:8px', 'z-index:99999', 'text-align:center'
    ].join(';');
    el.innerHTML = 'MISSION COMPLETE<br><span style="font-size:18px">SCORE: ' + _score + '</span>';
    document.body.appendChild(el);
    _silenceAlarm();
  }

  function _showMissionFailed() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#FF4444', 'font-family:monospace', 'font-size:28px',
      'padding:30px 50px', 'border:2px solid #FF4444',
      'border-radius:8px', 'z-index:99999', 'text-align:center'
    ].join(';');
    el.innerHTML = 'MISSION FAILED<br><span style="font-size:18px">SCORE: ' + _score + '</span>';
    document.body.appendChild(el);
    _silenceAlarm();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  RESET                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _reset() {
    _active            = false;
    _score             = 0;
    _alarmActive       = false;
    _alarmTime         = 0;
    _stealthWindowActive = true;
    _perimeterKills    = 0;
    _evidenceCollected = 0;
    _vaultCollected    = false;
    _tunnelBlocked     = false;
    _gameTime          = 0;
    _reinforcementCountdown = 90;
    _missionEnd        = false;
    _drugLordHP        = 500;
    _drugLordAlive     = true;
    _drugLordInVilla   = true;
    _drugLordFleeing   = false;
    _playerHP          = 100;
    _playerInSUV       = false;
    _currentSUV        = null;
    _hasKeycard        = false;
    _aliveSoldiers     = 15;
    _soldierCount      = 15;
    _fireTimer         = 0;
    _mouseX            = 0;
    _mouseY            = 0;
    _yaw               = 0;
    _pitch             = 0;
    _helicopterActive  = false;

    /* Remove scene objects */
    if (_compoundGroup && _scene) _scene.remove(_compoundGroup);
    if (_drugLord && _scene)      _scene.remove(_drugLord);
    if (_player && _scene)        _scene.remove(_player);
    if (_helicopterGroup && _scene) _scene.remove(_helicopterGroup);
    if (_chargeMesh && _scene)    _scene.remove(_chargeMesh);

    for (var i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].mesh && _scene) _scene.remove(_soldiers[i].mesh);
    }
    for (var j = 0; j < _bodyguards.length; j++) {
      if (_bodyguards[j].mesh && _scene) _scene.remove(_bodyguards[j].mesh);
    }
    for (var k = 0; k < _cartelVehicles.length; k++) {
      if (_cartelVehicles[k].mesh && _scene) _scene.remove(_cartelVehicles[k].mesh);
    }
    for (var m = 0; m < _jungleTrees.length; m++) {
      if (_jungleTrees[m] && _scene) _scene.remove(_jungleTrees[m]);
    }
    for (var n = 0; n < _playerBullets.length; n++) {
      if (_playerBullets[n].mesh && _scene) _scene.remove(_playerBullets[n].mesh);
    }
    for (var p = 0; p < _enemyBullets.length; p++) {
      if (_enemyBullets[p].mesh && _scene) _scene.remove(_enemyBullets[p].mesh);
    }

    _compoundGroup  = null;
    _drugLord       = null;
    _player         = null;
    _playerPos      = null;
    _helicopterGroup = null;
    _chargeMesh     = null;
    _soldiers       = [];
    _bodyguards     = [];
    _cartelVehicles = [];
    _playerSUVs     = [];
    _jungleTrees    = [];
    _playerBullets  = [];
    _enemyBullets   = [];
    _evidencePackages = [];
    _roofPlatforms  = [];
    _vault          = null;
    _keycardPickup  = null;
    _tunnelEntrance = null;
    _tunnel         = null;
    _alarmBox       = null;
    _villa          = null;
    _lab            = null;
    _garage         = null;

    _silenceAlarm();
    _removeHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PUBLIC API                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('click',   _onClick);
  }

  function update(dt) {
    _update(dt);
  }

  function reset() {
    _reset();
  }

  return { init: init, update: update, reset: reset };

}());
