/* ─────────────────────────────────────────────────────────────────────────────
   FORTIFIED RETREAT — Hold a defensive perimeter until extraction arrives.
   Keys: F = activate scenario  R = reset scenario
         E = resupply from nearest ammo crate (within 3 units)
   ───────────────────────────────────────────────────────────────────────────── */
window.FortifiedRetreat = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var PERIMETER_RADIUS    = 12;
  var SANDBAG_COUNT       = 8;
  var EXTRACTION_TIME     = 180;   // 3 minutes
  var AMMO_CRATE_COUNT    = 3;
  var BUDDY_COUNT         = 3;
  var BUDDY_SANDBAG_IDX   = [0, 2, 5]; // which sandbag positions buddies occupy
  var ENEMY_APPROACH_DIST = 15;    // enemies stop & shoot when this close
  var BUDDY_FIRE_RANGE    = 20;
  var BUDDY_FIRE_RATE     = 1.5;
  var ENEMY_SPAWN_DIST    = 60;
  var SUPPRESSION_SPEED   = 0.60;  // 40% speed reduction
  var SCREEN_SHAKE_AMP    = 0.18;
  var HOLD_BONUS          = 1000;
  var VEHICLE_HP          = 5;     // hits to destroy vehicle
  var VEHICLE_SPEED       = 4;

  // Wave definitions: { enemyCount, hasVehicle, hasSuppression, hasMortar }
  var WAVES = [
    { enemyCount: 2,  hasVehicle: false, hasSuppression: false, hasMortar: false },
    { enemyCount: 4,  hasVehicle: false, hasSuppression: false, hasMortar: false },
    { enemyCount: 6,  hasVehicle: true,  hasSuppression: false, hasMortar: false },
    { enemyCount: 8,  hasVehicle: false, hasSuppression: true,  hasMortar: false },
    { enemyCount: 10, hasVehicle: false, hasSuppression: false, hasMortar: true  }
  ];

  // Compass spawn directions (unit vectors)
  var COMPASS_DIRS = [
    { x: 0,  z: -1 }, // North
    { x: 1,  z:  0 }, // East
    { x: 0,  z:  1 }, // South
    { x: -1, z:  0 }  // West
  ];

  // ── Scene references ──────────────────────────────────────────────────────
  var _scene      = null;
  var _camera     = null;
  var _player     = null;  // { position:THREE.Vector3, hp, speed, score }

  // ── Module state ──────────────────────────────────────────────────────────
  var _active          = false;
  var _missionComplete = false;
  var _extractionTimer = EXTRACTION_TIME;
  var _waveIndex       = 0;       // 0-based, current wave
  var _waveActive      = false;
  var _waveClearTimer  = 0;       // delay between waves
  var _allWavesDone    = false;

  // ── Keyboard state ────────────────────────────────────────────────────────
  var _keys          = {};
  var _fKeyWasDown   = false;
  var _rKeyWasDown   = false;
  var _eKeyWasDown   = false;

  // ── Scene objects ─────────────────────────────────────────────────────────
  var _sandbagMeshes  = [];    // array of THREE.Mesh
  var _sandbagPositions = [];  // array of THREE.Vector3
  var _perimeterLine  = null;  // THREE.LineSegments

  var _ammoCrates     = [];    // [{ mesh, position, active }]
  var _buddies        = [];    // [{ mesh, position, hp, fireTimer, sandbagIdx, alive }]
  var _enemies        = [];    // [{ mesh, position, alive, hp, shooting, fireTimer }]

  var _vehicleMesh    = null;
  var _vehicleAlive   = false;
  var _vehicleHp      = VEHICLE_HP;
  var _vehicleDir     = null;  // THREE.Vector3 toward center
  var _vehicleHitFlash = 0;

  var _mortarProjectile = null;
  var _mortarT          = 0;
  var _mortarActive     = false;
  var _mortarStart      = null;
  var _mortarEnd        = null;
  var _mortarTimer      = 0;

  var _heliGroup       = null;
  var _heliRotor       = null;
  var _heliArriving    = false;
  var _heliLanded      = false;
  var _heliDeparting   = false;
  var _heliT           = 0;
  var _heliBoardTimer  = 0;
  var _heliStartPos    = null;
  var _heliTargetPos   = null;
  var _heliFinalPos    = null;

  // ── Suppression state ─────────────────────────────────────────────────────
  var _suppressed      = false;
  var _suppressTimer   = 0;
  var _shakeTimer      = 0;
  var _shakeCamOffset  = null;

  // ── Announce state ────────────────────────────────────────────────────────
  var _announceTimer   = 0;

  // ── Audio ─────────────────────────────────────────────────────────────────
  var _audioCtx        = null;

  // ── HUD elements ──────────────────────────────────────────────────────────
  var _hudEl           = null;
  var _waveEl          = null;
  var _extractEl       = null;
  var _defendersEl     = null;
  var _ammoEl          = null;
  var _announceEl      = null;
  var _countdownEl     = null;
  var _bannerEl        = null;

  // ─────────────────────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  function _makeMat(color, emissive) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
    }
    return mat;
  }

  function _fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _playSiren() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  }

  function _playExplosion() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    var buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MESH BUILDERS
  // ─────────────────────────────────────────────────────────────────────────
  function _buildSandbag() {
    var group = new THREE.Group();
    // Main sandbag pile: 3 stacked boxes
    var mat = _makeMat(0x8B7355);
    var base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 1.2), mat);
    base.position.set(0, 0.25, 0);
    group.add(base);
    var mid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.0), mat);
    mid.position.set(0, 0.75, 0);
    group.add(mid);
    var top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.8), mat);
    top.position.set(0, 1.15, 0);
    group.add(top);
    return group;
  }

  function _buildAmmoCrate() {
    var group = new THREE.Group();
    var mat = _makeMat(0x4A5240);
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.5), mat);
    box.position.set(0, 0.3, 0);
    group.add(box);
    // Yellow cross markings
    var markMat = _makeMat(0xFFCC00);
    var h = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), markMat);
    h.position.set(0, 0.6, 0.26);
    group.add(h);
    var v = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), markMat);
    v.position.set(0, 0.6, 0.26);
    group.add(v);
    return group;
  }

  function _buildEnemy() {
    var group = new THREE.Group();
    // Body cylinder
    var bodyMat = _makeMat(0x8B0000);
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8), bodyMat);
    body.position.set(0, 0.6, 0);
    group.add(body);
    // Head sphere
    var headMat = _makeMat(0xC8A882);
    var head = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 8), headMat);
    head.position.set(0, 1.4, 0);
    group.add(head);
    return group;
  }

  function _buildBuddy() {
    var group = new THREE.Group();
    var bodyMat = _makeMat(0x556B2F);
    var helmMat = _makeMat(0x3B4A2F);
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 8), bodyMat);
    body.position.set(0, 0.55, 0);
    group.add(body);
    var helm = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.3, 8), helmMat);
    helm.position.set(0, 1.25, 0);
    group.add(helm);
    return group;
  }

  function _buildTruck() {
    var group = new THREE.Group();
    var odGreen = 0x4A5240;
    var mat = _makeMat(odGreen);
    // Cab
    var cab = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), mat);
    cab.position.set(0, 1, 0);
    group.add(cab);
    // Bed
    var bed = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2.5), _makeMat(odGreen));
    bed.position.set(3, 0.5, 0);
    group.add(bed);
    // Wheels
    var wheelMat = _makeMat(0x222222);
    var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10);
    var wpos = [
      [-0.8, 0.5, 1.4], [-0.8, 0.5, -1.4],
      [2.5, 0.5, 1.4],  [2.5, 0.5, -1.4]
    ];
    for (var wi = 0; wi < wpos.length; wi++) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wpos[wi][0], wpos[wi][1], wpos[wi][2]);
      group.add(w);
    }
    return group;
  }

  function _buildHelicopter() {
    var group = new THREE.Group();
    var bodyMat = _makeMat(0x2D5A1B);
    // Body
    var body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 2), bodyMat);
    group.add(body);
    // Main rotor disc
    var rotorGeo = new THREE.CylinderGeometry(3, 3, 0.1, 12);
    var rotorMesh = new THREE.Mesh(rotorGeo, _makeMat(0x1A1A1A));
    rotorMesh.position.set(0, 1.0, 0);
    group.add(rotorMesh);
    _heliRotor = rotorMesh;
    // Rotor blades
    var bladeGeo = new THREE.BoxGeometry(6, 0.08, 0.25);
    var bladeMat = _makeMat(0x111111);
    var b1 = new THREE.Mesh(bladeGeo, bladeMat);
    b1.position.set(0, 1.05, 0);
    group.add(b1);
    var b2 = new THREE.Mesh(bladeGeo, bladeMat);
    b2.position.set(0, 1.05, 0);
    b2.rotation.y = Math.PI / 2;
    group.add(b2);
    // Tail boom
    var tail = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 0.4), _makeMat(0x2D5A1B));
    tail.position.set(-3.0, 0.1, 0);
    group.add(tail);
    // Skids
    var skidGeo = new THREE.BoxGeometry(3, 0.12, 0.12);
    var skidMat = _makeMat(0x222222);
    var skidL = new THREE.Mesh(skidGeo, skidMat);
    skidL.position.set(0, -0.9, 0.8);
    group.add(skidL);
    var skidR = new THREE.Mesh(skidGeo, skidMat);
    skidR.position.set(0, -0.9, -0.8);
    group.add(skidR);
    return group;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PERIMETER CONSTRUCTION
  // ─────────────────────────────────────────────────────────────────────────
  function _buildPerimeter() {
    _sandbagPositions = [];
    _sandbagMeshes = [];

    var pts = [];
    for (var i = 0; i < SANDBAG_COUNT; i++) {
      var angle = (i / SANDBAG_COUNT) * Math.PI * 2;
      var px = Math.cos(angle) * PERIMETER_RADIUS;
      var pz = Math.sin(angle) * PERIMETER_RADIUS;
      var pos = new THREE.Vector3(px, 0, pz);
      _sandbagPositions.push(pos);

      var mesh = _buildSandbag();
      mesh.position.set(px, 0, pz);
      // rotate sandbag to face center
      mesh.rotation.y = -angle;
      _scene.add(mesh);
      _sandbagMeshes.push(mesh);
      pts.push(new THREE.Vector3(px, 0.5, pz));
    }
    // Close the loop
    pts.push(pts[0].clone());

    // Build line segments perimeter
    var geo = new THREE.BufferGeometry();
    var positions = [];
    for (var li = 0; li < pts.length - 1; li++) {
      positions.push(pts[li].x, pts[li].y, pts[li].z);
      positions.push(pts[li + 1].x, pts[li + 1].y, pts[li + 1].z);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x00FF88, linewidth: 2 });
    _perimeterLine = new THREE.LineSegments(geo, lineMat);
    _scene.add(_perimeterLine);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  AMMO CRATES
  // ─────────────────────────────────────────────────────────────────────────
  function _buildAmmoCrates() {
    _ammoCrates = [];
    var crateAngles = [Math.PI / 6, Math.PI + Math.PI / 3, (3 * Math.PI) / 2];
    for (var i = 0; i < AMMO_CRATE_COUNT; i++) {
      var angle = crateAngles[i];
      var r = PERIMETER_RADIUS * 0.45;
      var px = Math.cos(angle) * r;
      var pz = Math.sin(angle) * r;
      var mesh = _buildAmmoCrate();
      mesh.position.set(px, 0, pz);
      _scene.add(mesh);
      _ammoCrates.push({
        mesh: mesh,
        position: new THREE.Vector3(px, 0, pz),
        active: true
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  BUDDY DEFENDERS
  // ─────────────────────────────────────────────────────────────────────────
  function _buildBuddies() {
    _buddies = [];
    for (var i = 0; i < BUDDY_COUNT; i++) {
      var sbIdx = BUDDY_SANDBAG_IDX[i];
      var sbPos = _sandbagPositions[sbIdx];
      // Position buddies slightly inside sandbag (toward center)
      var inward = sbPos.clone().multiplyScalar(0.75);
      var mesh = _buildBuddy();
      mesh.position.set(inward.x, 0, inward.z);
      _scene.add(mesh);
      _buddies.push({
        mesh: mesh,
        position: inward.clone(),
        hp: 100,
        fireTimer: 0,
        sandbagIdx: sbIdx,
        alive: true
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  WAVE / ENEMY SPAWNING
  // ─────────────────────────────────────────────────────────────────────────
  function _spawnWave(waveIdx) {
    var waveData = WAVES[waveIdx];
    _enemies = [];

    for (var i = 0; i < waveData.enemyCount; i++) {
      var dir = COMPASS_DIRS[i % 4];
      // Spread enemies around each compass direction with offsets
      var spread = (i - waveData.enemyCount / 2) * 4;
      var sx = dir.x * ENEMY_SPAWN_DIST + dir.z * spread;
      var sz = dir.z * ENEMY_SPAWN_DIST + dir.x * spread;
      var mesh = _buildEnemy();
      mesh.position.set(sx, 0, sz);
      _scene.add(mesh);
      _enemies.push({
        mesh: mesh,
        position: new THREE.Vector3(sx, 0, sz),
        alive: true,
        hp: 2,
        shooting: false,
        fireTimer: 0,
        suppressTimer: 0
      });
    }

    // Wave 3 vehicle
    if (waveData.hasVehicle) {
      _spawnVehicle();
    }
  }

  function _spawnVehicle() {
    var dir = COMPASS_DIRS[1]; // East
    _vehicleMesh = _buildTruck();
    var sx = dir.x * ENEMY_SPAWN_DIST;
    var sz = dir.z * ENEMY_SPAWN_DIST;
    _vehicleMesh.position.set(sx, 0, sz);
    _scene.add(_vehicleMesh);
    _vehicleAlive = true;
    _vehicleHp = VEHICLE_HP;
    _vehicleDir = new THREE.Vector3(-dir.x, 0, -dir.z).normalize();
    _vehicleHitFlash = 0;
  }

  function _updateEnemies(delta) {
    var waveData = _waveIndex < WAVES.length ? WAVES[_waveIndex] : null;
    var centerPos = new THREE.Vector3(0, 0, 0);
    var playerPos = _player ? _player.position : centerPos;
    var hasSuppression = waveData && waveData.hasSuppression;

    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) { continue; }

      var distToCenter = _dist2(e.position, centerPos);
      var distToPlayer = _player ? _dist2(e.position, playerPos) : distToCenter;

      if (distToCenter > ENEMY_APPROACH_DIST) {
        // Advance toward center
        var dx = centerPos.x - e.position.x;
        var dz = centerPos.z - e.position.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0.01) {
          var speed = 5;
          e.position.x += (dx / len) * speed * delta;
          e.position.z += (dz / len) * speed * delta;
          e.mesh.position.set(e.position.x, 0, e.position.z);
          // Face movement direction
          e.mesh.rotation.y = Math.atan2(dx, dz);
        }
        e.shooting = false;
      } else {
        // In range: shoot
        e.shooting = true;
        e.fireTimer -= delta;
        if (e.fireTimer <= 0) {
          e.fireTimer = 1.5 + Math.random() * 1.5;
          // Suppression burst in wave 4
          if (hasSuppression && distToPlayer < 25) {
            _triggerSuppression();
          }
        }
      }
    }
  }

  function _triggerSuppression() {
    _suppressed = true;
    _suppressTimer = 3.0;
    _shakeTimer = 0.5;
  }

  function _updateVehicle(delta) {
    if (!_vehicleAlive || !_vehicleMesh) { return; }
    var centerPos = new THREE.Vector3(0, 0, 0);
    var dist = _dist2(_vehicleMesh.position, centerPos);
    if (dist > 3) {
      _vehicleMesh.position.x += _vehicleDir.x * VEHICLE_SPEED * delta;
      _vehicleMesh.position.z += _vehicleDir.z * VEHICLE_SPEED * delta;
      // face direction
      _vehicleMesh.rotation.y = Math.atan2(_vehicleDir.x, _vehicleDir.z);
    } else {
      // Breached the perimeter — game over condition (destroy perimeter visual)
      if (_perimeterLine) {
        _perimeterLine.material.color.setHex(0xFF3300);
      }
    }
    if (_vehicleHitFlash > 0) {
      _vehicleHitFlash -= delta;
      _vehicleMesh.children[0].material.emissive.setHex(_vehicleHitFlash > 0 ? 0xFF4400 : 0x000000);
    }
  }

  function _damageVehicle() {
    if (!_vehicleAlive) { return; }
    _vehicleHp -= 1;
    _vehicleHitFlash = 0.2;
    if (_vehicleHp <= 0) {
      _destroyVehicle();
    }
  }

  function _destroyVehicle() {
    if (_vehicleMesh) {
      _scene.remove(_vehicleMesh);
      _vehicleMesh = null;
    }
    _vehicleAlive = false;
    _playExplosion();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MORTAR
  // ─────────────────────────────────────────────────────────────────────────
  function _spawnMortar() {
    if (_mortarActive) { return; }
    // Random position outside perimeter
    var angle = Math.random() * Math.PI * 2;
    var r = PERIMETER_RADIUS * 0.6;
    _mortarStart = new THREE.Vector3(
      Math.cos(angle + Math.PI) * ENEMY_SPAWN_DIST * 0.6,
      0,
      Math.sin(angle + Math.PI) * ENEMY_SPAWN_DIST * 0.6
    );
    _mortarEnd = new THREE.Vector3(
      (Math.random() - 0.5) * r * 2,
      0,
      (Math.random() - 0.5) * r * 2
    );
    var geo = new THREE.CylinderGeometry(0.15, 0.05, 0.6, 6);
    _mortarProjectile = new THREE.Mesh(geo, _makeMat(0x333333, 0xFF6600));
    _mortarProjectile.position.copy(_mortarStart);
    _mortarProjectile.position.y = 0;
    _scene.add(_mortarProjectile);
    _mortarActive = true;
    _mortarT = 0;
    _mortarTimer = 0;
  }

  function _updateMortar(delta) {
    if (!_mortarActive || !_mortarProjectile) { return; }
    _mortarT += delta / 3.0;
    if (_mortarT >= 1.0) {
      // Impact
      _scene.remove(_mortarProjectile);
      _mortarProjectile = null;
      _mortarActive = false;
      _playExplosion();
      // Trigger screen shake on impact
      _shakeTimer = 0.6;
      // Queue next mortar
      _mortarTimer = 8 + Math.random() * 5;
      return;
    }
    var t = _mortarT;
    var mx = _mortarStart.x + (_mortarEnd.x - _mortarStart.x) * t;
    var mz = _mortarStart.z + (_mortarEnd.z - _mortarStart.z) * t;
    var my = Math.sin(t * Math.PI) * 20; // arc
    _mortarProjectile.position.set(mx, my, mz);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  BUDDY AI
  // ─────────────────────────────────────────────────────────────────────────
  function _updateBuddies(delta) {
    for (var i = 0; i < _buddies.length; i++) {
      var b = _buddies[i];
      if (!b.alive) { continue; }

      // Stay near assigned sandbag
      var sbPos = _sandbagPositions[b.sandbagIdx];
      var inwardPos = sbPos.clone().multiplyScalar(0.75);
      var dx = inwardPos.x - b.position.x;
      var dz = inwardPos.z - b.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 0.5) {
        b.position.x += (dx / d) * 3 * delta;
        b.position.z += (dz / d) * 3 * delta;
        b.mesh.position.set(b.position.x, 0, b.position.z);
      }

      // Find nearest alive enemy
      var nearestEnemy = null;
      var nearestDist = Infinity;
      for (var j = 0; j < _enemies.length; j++) {
        var e = _enemies[j];
        if (!e.alive) { continue; }
        var ed = _dist2(b.position, e.position);
        if (ed < nearestDist) {
          nearestDist = ed;
          nearestEnemy = e;
        }
      }

      if (nearestEnemy && nearestDist < BUDDY_FIRE_RANGE) {
        // Face enemy
        var ex = nearestEnemy.position.x - b.position.x;
        var ez = nearestEnemy.position.z - b.position.z;
        b.mesh.rotation.y = Math.atan2(ex, ez);

        b.fireTimer -= delta;
        if (b.fireTimer <= 0) {
          b.fireTimer = BUDDY_FIRE_RATE;
          // Hit with probability 0.65
          if (Math.random() < 0.65) {
            nearestEnemy.hp -= 1;
            if (nearestEnemy.hp <= 0) {
              nearestEnemy.alive = false;
              _scene.remove(nearestEnemy.mesh);
            }
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  WAVE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  function _checkWaveClear() {
    if (!_waveActive) { return; }
    var anyAlive = false;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) { anyAlive = true; break; }
    }
    var vehicleBlocksWave = _waveIndex === 2 && _vehicleAlive;
    if (!anyAlive && !vehicleBlocksWave) {
      _waveActive = false;
      _waveClearTimer = 5.0;
    }
  }

  function _advanceWave() {
    _waveIndex += 1;
    if (_waveIndex >= WAVES.length) {
      _allWavesDone = true;
      _waveActive = false;
      _showBanner('ALL WAVES REPELLED! AWAITING EXTRACTION');
    } else {
      _waveActive = true;
      _announceWave(_waveIndex);
      _spawnWave(_waveIndex);
    }
  }

  function _announceWave(idx) {
    var num = idx + 1;
    var msg = 'WAVE ' + num + ' APPROACHING';
    _showAnnounce(msg);
    _playSiren();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  EXTRACTION HELICOPTER
  // ─────────────────────────────────────────────────────────────────────────
  function _callExtraction() {
    if (_heliArriving || _heliLanded || _heliDeparting) { return; }
    _heliGroup = _buildHelicopter();
    _heliStartPos = new THREE.Vector3(0, 40, -80);
    _heliTargetPos = new THREE.Vector3(0, 5, 0);
    _heliFinalPos  = new THREE.Vector3(0, 40, 80);
    _heliGroup.position.copy(_heliStartPos);
    _scene.add(_heliGroup);
    _heliArriving = true;
    _heliT = 0;
    _heliBoardTimer = 0;
    _showBanner('EXTRACTION INBOUND');
    _playSiren();
  }

  function _updateHelicopter(delta) {
    if (!_heliGroup) { return; }
    // Spin rotor
    if (_heliRotor) {
      _heliRotor.rotation.y += 8 * delta;
    }

    if (_heliArriving) {
      _heliT += delta / 8.0;
      if (_heliT >= 1.0) {
        _heliT = 1.0;
        _heliArriving = false;
        _heliLanded = true;
        _heliBoardTimer = 0;
        _heliGroup.position.copy(_heliTargetPos);
        _showBanner('BOARD THE HELICOPTER!');
      } else {
        _heliGroup.position.lerpVectors(_heliStartPos, _heliTargetPos, _heliT);
      }
      return;
    }

    if (_heliLanded) {
      _heliBoardTimer += delta;
      // Hover oscillation
      _heliGroup.position.y = _heliTargetPos.y + Math.sin(_heliBoardTimer * 2) * 0.2;
      if (_heliBoardTimer >= 8.0) {
        _heliLanded = false;
        _heliDeparting = true;
        _heliT = 0;
        _missionComplete = true;
        _triggerMissionComplete();
      }
      return;
    }

    if (_heliDeparting) {
      _heliT += delta / 10.0;
      if (_heliT >= 1.0) { _heliT = 1.0; }
      _heliGroup.position.lerpVectors(_heliTargetPos, _heliFinalPos, _heliT);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SCREEN SHAKE
  // ─────────────────────────────────────────────────────────────────────────
  function _updateScreenShake(delta) {
    if (!_camera) { return; }
    if (_shakeTimer > 0) {
      _shakeTimer -= delta;
      var amp = SCREEN_SHAKE_AMP * (_shakeTimer / 0.6);
      _camera.position.x += (Math.random() - 0.5) * amp;
      _camera.position.y += (Math.random() - 0.5) * amp;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  RESUPPLY (E key)
  // ─────────────────────────────────────────────────────────────────────────
  function _tryResupply() {
    if (!_player) { return; }
    var playerPos = _player.position;
    for (var i = 0; i < _ammoCrates.length; i++) {
      var crate = _ammoCrates[i];
      if (!crate.active) { continue; }
      var d = _dist2(playerPos, crate.position);
      if (d < 3.0) {
        crate.active = false;
        crate.mesh.visible = false;
        if (_player.ammo !== undefined) {
          _player.ammo = (_player.ammo || 0) + 50;
        }
        _showBanner('+50 AMMO — RESUPPLIED');
        _updateHUD();
        return;
      }
    }
    _showBanner('NO CRATE IN RANGE — PRESS E NEAR CRATE');
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MISSION COMPLETE
  // ─────────────────────────────────────────────────────────────────────────
  function _triggerMissionComplete() {
    var msg = 'MISSION COMPLETE — EXTRACTION SUCCESSFUL';
    if (_allWavesDone && _player) {
      if (_player.score !== undefined) {
        _player.score += HOLD_BONUS;
      }
      msg = 'LAST STAND BONUS +' + HOLD_BONUS + ' — EXTRACTION SUCCESSFUL';
    }
    _showBanner(msg);
    _active = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  HUD
  // ─────────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'fr-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:7px 18px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:8000',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Large extraction countdown
    _countdownEl = document.createElement('div');
    _countdownEl.id = 'fr-countdown';
    _countdownEl.style.cssText = [
      'position:fixed',
      'top:22px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FF4400',
      'font-family:monospace',
      'font-size:32px',
      'font-weight:bold',
      'text-shadow:0 0 8px #FF6600',
      'pointer-events:none',
      'z-index:8000',
      'letter-spacing:3px'
    ].join(';');
    document.body.appendChild(_countdownEl);

    // Announce banner
    _announceEl = document.createElement('div');
    _announceEl.id = 'fr-announce';
    _announceEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'text-shadow:0 0 10px #FF8800',
      'pointer-events:none',
      'z-index:8001',
      'letter-spacing:2px',
      'opacity:0',
      'transition:opacity 0.2s'
    ].join(';');
    document.body.appendChild(_announceEl);

    // Flash banner (bottom center)
    _bannerEl = document.createElement('div');
    _bannerEl.id = 'fr-banner';
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:130px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFFFFF',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:8001',
      'letter-spacing:1px',
      'opacity:0',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(_bannerEl);

    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) { return; }

    var waveNum  = Math.min(_waveIndex + 1, WAVES.length);
    var waveText = 'WAVE: ' + waveNum + '/' + WAVES.length;

    var extractSecs = Math.max(0, Math.floor(_extractionTimer));
    var extractText = 'EXTRACT: ' + _fmtTime(extractSecs);

    var aliveCount = 0;
    for (var i = 0; i < _buddies.length; i++) {
      if (_buddies[i].alive) { aliveCount++; }
    }
    var defText = 'DEFENDERS: ' + aliveCount + '/' + BUDDY_COUNT;

    var crateCount = 0;
    for (var ci = 0; ci < _ammoCrates.length; ci++) {
      if (_ammoCrates[ci].active) { crateCount++; }
    }
    var ammoText = 'AMMO: ' + crateCount + '/' + AMMO_CRATE_COUNT + ' CRATES';

    _hudEl.textContent = 'LAST STAND  [' + waveText + ']  [' + extractText + ']  [' + defText + ']  [' + ammoText + ']';

    if (_countdownEl) {
      _countdownEl.textContent = 'EXTRACT IN: ' + _fmtTime(extractSecs);
      if (extractSecs < 30) {
        _countdownEl.style.color = '#FF0000';
      } else if (extractSecs < 60) {
        _countdownEl.style.color = '#FF8800';
      } else {
        _countdownEl.style.color = '#FF4400';
      }
    }
  }

  function _removeHUD() {
    if (_hudEl) { _hudEl.parentNode && _hudEl.parentNode.removeChild(_hudEl); _hudEl = null; }
    if (_countdownEl) { _countdownEl.parentNode && _countdownEl.parentNode.removeChild(_countdownEl); _countdownEl = null; }
    if (_announceEl) { _announceEl.parentNode && _announceEl.parentNode.removeChild(_announceEl); _announceEl = null; }
    if (_bannerEl) { _bannerEl.parentNode && _bannerEl.parentNode.removeChild(_bannerEl); _bannerEl = null; }
  }

  function _showAnnounce(msg) {
    if (!_announceEl) { return; }
    _announceEl.textContent = msg;
    _announceEl.style.opacity = '1';
    _announceTimer = 3.0;
  }

  function _showBanner(msg) {
    if (!_bannerEl) { return; }
    _bannerEl.textContent = msg;
    _bannerEl.style.opacity = '1';
    clearTimeout(_bannerEl._hideTimeout);
    _bannerEl._hideTimeout = setTimeout(function () {
      if (_bannerEl) { _bannerEl.style.opacity = '0'; }
    }, 3500);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  KEYBOARD
  // ─────────────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SCENE CLEANUP
  // ─────────────────────────────────────────────────────────────────────────
  function _clearScene() {
    var i;
    for (i = 0; i < _sandbagMeshes.length; i++) { _scene.remove(_sandbagMeshes[i]); }
    _sandbagMeshes = [];
    _sandbagPositions = [];

    if (_perimeterLine) { _scene.remove(_perimeterLine); _perimeterLine = null; }

    for (i = 0; i < _ammoCrates.length; i++) { _scene.remove(_ammoCrates[i].mesh); }
    _ammoCrates = [];

    for (i = 0; i < _buddies.length; i++) { _scene.remove(_buddies[i].mesh); }
    _buddies = [];

    for (i = 0; i < _enemies.length; i++) { _scene.remove(_enemies[i].mesh); }
    _enemies = [];

    if (_vehicleMesh) { _scene.remove(_vehicleMesh); _vehicleMesh = null; }
    _vehicleAlive = false;

    if (_mortarProjectile) { _scene.remove(_mortarProjectile); _mortarProjectile = null; }
    _mortarActive = false;

    if (_heliGroup) { _scene.remove(_heliGroup); _heliGroup = null; }
    _heliRotor = null;
    _heliArriving = false;
    _heliLanded = false;
    _heliDeparting = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SCENARIO START / RESET
  // ─────────────────────────────────────────────────────────────────────────
  function _startScenario() {
    if (_active) { return; }
    _active = true;
    _missionComplete = false;
    _extractionTimer = EXTRACTION_TIME;
    _waveIndex = 0;
    _waveActive = true;
    _waveClearTimer = 0;
    _allWavesDone = false;
    _suppressed = false;
    _suppressTimer = 0;
    _shakeTimer = 0;
    _mortarTimer = 0;
    _mortarActive = false;
    _heliArriving = false;
    _heliLanded = false;
    _heliDeparting = false;

    _buildPerimeter();
    _buildAmmoCrates();
    _buildBuddies();
    _spawnWave(0);
    _buildHUD();
    _showAnnounce('WAVE 1 APPROACHING — HOLD THE LINE');
    _playSiren();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, playerRef) {
    _scene  = sceneRef;
    _camera = cameraRef;
    _player = playerRef;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function update(delta) {
    // ── Key edge detection ────────────────────────────────────────────────
    var fDown = !!_keys['KeyF'];
    var rDown = !!_keys['KeyR'];
    var eDown = !!_keys['KeyE'];

    if (fDown && !_fKeyWasDown) {
      if (!_active) {
        _startScenario();
      }
    }
    _fKeyWasDown = fDown;

    if (rDown && !_rKeyWasDown) {
      reset();
    }
    _rKeyWasDown = rDown;

    if (eDown && !_eKeyWasDown && _active) {
      _tryResupply();
    }
    _eKeyWasDown = eDown;

    if (!_active) { return; }
    if (_missionComplete) {
      _updateHelicopter(delta);
      return;
    }

    // ── Extraction countdown ──────────────────────────────────────────────
    _extractionTimer -= delta;
    if (_extractionTimer <= 0) {
      _extractionTimer = 0;
      if (!_heliArriving && !_heliLanded && !_heliDeparting) {
        _callExtraction();
      }
    }

    // ── Wave management ───────────────────────────────────────────────────
    if (_waveActive) {
      _checkWaveClear();
    } else if (!_allWavesDone && _waveIndex < WAVES.length - 1) {
      _waveClearTimer -= delta;
      if (_waveClearTimer <= 0) {
        _advanceWave();
      }
    }

    // ── Mortar (wave 5) ───────────────────────────────────────────────────
    if (_waveActive && _waveIndex === 4) {
      if (!_mortarActive) {
        _mortarTimer -= delta;
        if (_mortarTimer <= 0) {
          _spawnMortar();
        }
      }
      _updateMortar(delta);
    }

    // ── Enemy AI ──────────────────────────────────────────────────────────
    _updateEnemies(delta);

    // ── Vehicle ───────────────────────────────────────────────────────────
    _updateVehicle(delta);

    // ── Buddy AI ─────────────────────────────────────────────────────────
    _updateBuddies(delta);

    // ── Suppression ───────────────────────────────────────────────────────
    if (_suppressed) {
      _suppressTimer -= delta;
      if (_suppressTimer <= 0) {
        _suppressed = false;
        if (_player && _player.speed !== undefined && _player._suppressedSpeed) {
          _player.speed = _player._suppressedSpeed;
          _player._suppressedSpeed = undefined;
        }
      } else {
        if (_player && _player.speed !== undefined && !_player._suppressedSpeed) {
          _player._suppressedSpeed = _player.speed;
          _player.speed = _player.speed * SUPPRESSION_SPEED;
        }
      }
    }

    // ── Screen shake ──────────────────────────────────────────────────────
    _updateScreenShake(delta);

    // ── Announce fadeout ──────────────────────────────────────────────────
    if (_announceTimer > 0) {
      _announceTimer -= delta;
      if (_announceTimer <= 0 && _announceEl) {
        _announceEl.style.opacity = '0';
      }
    }

    // ── Helicopter ────────────────────────────────────────────────────────
    _updateHelicopter(delta);

    // ── HUD refresh ───────────────────────────────────────────────────────
    _updateHUD();
  }

  function reset() {
    if (_scene) {
      _clearScene();
    }
    _removeHUD();

    _active          = false;
    _missionComplete = false;
    _extractionTimer = EXTRACTION_TIME;
    _waveIndex       = 0;
    _waveActive      = false;
    _waveClearTimer  = 0;
    _allWavesDone    = false;
    _suppressed      = false;
    _suppressTimer   = 0;
    _shakeTimer      = 0;
    _mortarTimer     = 0;
    _mortarActive    = false;
    _vehicleAlive    = false;
    _announceTimer   = 0;
    _fKeyWasDown     = false;
    _rKeyWasDown     = false;
    _eKeyWasDown     = false;

    if (_player && _player._suppressedSpeed !== undefined) {
      _player.speed = _player._suppressedSpeed;
      _player._suppressedSpeed = undefined;
    }
  }

  return { init: init, update: update, reset: reset };

}());
