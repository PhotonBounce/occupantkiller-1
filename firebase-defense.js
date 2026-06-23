window.FirebaseDefense = (function() {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var FIREBASE_HP_MAX        = 500;
  var COMMAND_POST_HP_MAX    = 200;
  var WALL_HP_MAX            = 60;
  var WATCHTOWER_HP_MAX      = 80;
  var WALL_SEGMENT_COUNT     = 12;
  var RESUPPLY_INTERVAL      = 45; // seconds
  var REPAIR_DURATION        = 3;  // seconds
  var REPAIR_RANGE           = 6;
  var MORTAR_MAX             = 5;
  var MORTAR_COOLDOWN        = 10; // seconds
  var TOTAL_WAVES            = 5;
  var HELIPAD_RADIUS         = 4;

  // ── Private State ────────────────────────────────────────────────────────
  var _active              = false;
  var _scene               = null;
  var _camera              = null;
  var _group               = null;

  // Firebase structures
  var _commandPost         = null;
  var _watchtowers         = [];
  var _wallSegments        = [];
  var _ammoDump            = null;
  var _helipad             = null;

  // HP tracking
  var _commandPostHP       = COMMAND_POST_HP_MAX;
  var _wallHP              = [];
  var _watchtowerHP        = [];

  // Enemy waves
  var _currentWave         = 0;
  var _enemies             = [];
  var _waveActive          = false;
  var _allWavesDefeated    = false;

  // Resupply
  var _resupplyTimer       = RESUPPLY_INTERVAL;
  var _helicopter          = null;
  var _heliActive          = false;
  var _heliPhase           = 'approach'; // 'approach'|'hover'|'depart'
  var _heliTimer           = 0;
  var _supplyCrate         = null;
  var _ammoCount           = 100;
  var _repairKits          = 2;

  // Repair
  var _repairingIndex      = -1;
  var _repairTimer         = 0;

  // Mortar
  var _mortarCount         = MORTAR_MAX;
  var _mortarCooldown      = 0;
  var _mortarProjectiles   = [];

  // HUD
  var _hudEl               = null;
  var _bannerEl            = null;
  var _bannerTimer         = 0;

  // Wave announcement
  var _waveAnnounceTimer   = 0;
  var _betweenWaves        = false;
  var _nextWaveDelay       = 0;

  // Game over / victory
  var _gameOver            = false;
  var _victory             = false;
  var _endBannerEl         = null;

  // Key state
  var _keys                = {};

  // ── Wave Definitions ─────────────────────────────────────────────────────
  var _waveDefs = [
    { label: 'WAVE 1 INCOMING — 4 INFANTRY',
      infantry: 4, rpg: 0, btr: 0, mortar: 0, commander: false },
    { label: 'WAVE 2 INCOMING — 6 INFANTRY + RPG',
      infantry: 6, rpg: 1, btr: 0, mortar: 0, commander: false },
    { label: 'WAVE 3 INCOMING — 8 INFANTRY + 2 BTR',
      infantry: 8, rpg: 0, btr: 2, mortar: 0, commander: false },
    { label: 'WAVE 4 INCOMING — 10 INFANTRY + MORTAR TEAM',
      infantry: 10, rpg: 0, btr: 0, mortar: 3, commander: false },
    { label: 'WAVE 5 INCOMING — 12 INFANTRY + COMMANDER',
      infantry: 12, rpg: 0, btr: 0, mortar: 0, commander: true }
  ];

  // ── Utility ──────────────────────────────────────────────────────────────
  function _resolveScene() {
    return _scene || window._gameScene || window._scene || null;
  }

  function _resolveCamera() {
    return _camera || window._camera || (window._controls && window._controls.camera) || null;
  }

  function _makeMaterial(color, wire) {
    return new THREE.MeshLambertMaterial({ color: color, wireframe: !!wire });
  }

  function _makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow    = true;
    m.receiveShadow = true;
    return m;
  }

  function _disposeObject(obj) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(function(mt) { mt.dispose(); });
      } else {
        obj.material.dispose();
      }
    }
  }

  function _removeFromScene(obj) {
    if (!obj) return;
    var sc = _resolveScene();
    if (sc) sc.remove(obj);
    _disposeObject(obj);
  }

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'firebase-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'text-shadow:1px 1px 3px #000',
      'pointer-events:none',
      'z-index:9000',
      'display:none',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 10px',
      'border-left:3px solid #00FF88'
    ].join(';');
    document.body.appendChild(_hudEl);

    _bannerEl = document.createElement('div');
    _bannerEl.id = 'firebase-banner';
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'text-shadow:2px 2px 6px #000',
      'pointer-events:none',
      'z-index:9100',
      'display:none',
      'background:rgba(0,0,0,0.7)',
      'padding:14px 28px',
      'border:2px solid #FFD700',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_bannerEl);

    _endBannerEl = document.createElement('div');
    _endBannerEl.id = 'firebase-end-banner';
    _endBannerEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'text-shadow:2px 2px 8px #000',
      'pointer-events:none',
      'z-index:9200',
      'display:none',
      'padding:20px 40px',
      'border:3px solid #FFD700',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_endBannerEl);
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;
    var wallsIntact = 0;
    for (var i = 0; i < _wallHP.length; i++) {
      if (_wallHP[i] > 0) wallsIntact++;
    }
    var totalHP = _commandPostHP;
    for (var j = 0; j < _wallHP.length; j++) totalHP += _wallHP[j];
    for (var k = 0; k < _watchtowerHP.length; k++) totalHP += _watchtowerHP[k];

    var mortarStr = '[MORTARS:' + _mortarCount + '/' + MORTAR_MAX + ']';
    var kitStr    = '[KITS:' + _repairKits + ']';
    var ammoStr   = '[AMMO:' + _ammoCount + ']';

    _hudEl.innerHTML =
      'FIREBASE DEFENSE<br>' +
      '[WAVE:' + (_currentWave) + '/' + TOTAL_WAVES + '] ' +
      '[BASE HP:' + Math.max(0, _commandPostHP) + '] ' +
      '[WALLS:' + wallsIntact + '/' + WALL_SEGMENT_COUNT + '] ' +
      '[ENEMIES:' + _enemies.length + ']<br>' +
      mortarStr + ' ' + kitStr + ' ' + ammoStr;
  }

  function _showBanner(msg, duration) {
    if (!_bannerEl) return;
    _bannerEl.innerHTML  = msg;
    _bannerEl.style.display = 'block';
    _bannerTimer = duration || 3;
  }

  function _showEndBanner(victory) {
    if (!_endBannerEl) return;
    if (victory) {
      _endBannerEl.style.color      = '#00FF88';
      _endBannerEl.style.background = 'rgba(0,80,0,0.85)';
      _endBannerEl.innerHTML        = 'FIREBASE DEFENDED<br>ALL WAVES REPELLED';
    } else {
      _endBannerEl.style.color      = '#FF3333';
      _endBannerEl.style.background = 'rgba(80,0,0,0.85)';
      _endBannerEl.innerHTML        = 'FIREBASE OVERRUN<br>COMMAND POST DESTROYED';
    }
    _endBannerEl.style.display = 'block';
  }

  // ── Build Firebase Structures ─────────────────────────────────────────────
  function _buildFirebase() {
    var sc = _resolveScene();
    if (!sc) return;

    _group = new THREE.Group();
    _group.position.set(0, 0, 0);
    sc.add(_group);

    // Command post — 6×4×6
    var cpGeo = new THREE.BoxGeometry(6, 4, 6);
    var cpMat = _makeMaterial(0x5C5C3D);
    _commandPost = _makeMesh(cpGeo, cpMat);
    _commandPost.position.set(0, 2, 0);
    _commandPost.userData.type = 'commandPost';
    _group.add(_commandPost);

    // 4 corner watchtowers — 1.5×8×1.5
    var cornerOffsets = [
      { x: -14, z: -14 },
      { x:  14, z: -14 },
      { x: -14, z:  14 },
      { x:  14, z:  14 }
    ];
    _watchtowerHP = [];
    _watchtowers  = [];
    for (var ti = 0; ti < 4; ti++) {
      var twGeo = new THREE.BoxGeometry(1.5, 8, 1.5);
      var twMat = _makeMaterial(0x6B6B50);
      var tw    = _makeMesh(twGeo, twMat);
      tw.position.set(cornerOffsets[ti].x, 4, cornerOffsets[ti].z);
      tw.userData.type = 'watchtower';
      tw.userData.idx  = ti;
      _group.add(tw);
      _watchtowers.push(tw);
      _watchtowerHP.push(WATCHTOWER_HP_MAX);
    }

    // Perimeter wall — 12 segments, 1×2×12 each, forming a square
    // Layout: 3 segments per side, square perimeter at radius ~15 units
    // Segment positions: each 12 units long, placed end-to-end
    _wallSegments = [];
    _wallHP       = [];
    var wallSize  = 12;
    var wallY     = 1;
    var perimeter = 15; // distance from center to wall face

    // North wall (z = -perimeter), segments along X
    var northPositions = [-12, 0, 12];
    for (var ni = 0; ni < 3; ni++) {
      var wGeo = new THREE.BoxGeometry(1, 2, wallSize);
      var wMat = _makeMaterial(0x7A7A60);
      var wm   = _makeMesh(wGeo, wMat);
      wm.position.set(northPositions[ni], wallY, -perimeter);
      wm.rotation.y = 0;
      wm.userData.type     = 'wall';
      wm.userData.idx      = _wallSegments.length;
      wm.userData.side     = 'north';
      wm.userData.fullPos  = wm.position.clone();
      _group.add(wm);
      _wallSegments.push(wm);
      _wallHP.push(WALL_HP_MAX);
    }
    // South wall (z = +perimeter)
    var southPositions = [-12, 0, 12];
    for (var si = 0; si < 3; si++) {
      var wGeoS = new THREE.BoxGeometry(1, 2, wallSize);
      var wMatS = _makeMaterial(0x7A7A60);
      var wmS   = _makeMesh(wGeoS, wMatS);
      wmS.position.set(southPositions[si], wallY, perimeter);
      wmS.userData.type     = 'wall';
      wmS.userData.idx      = _wallSegments.length;
      wmS.userData.side     = 'south';
      wmS.userData.fullPos  = wmS.position.clone();
      _group.add(wmS);
      _wallSegments.push(wmS);
      _wallHP.push(WALL_HP_MAX);
    }
    // West wall (x = -perimeter), segments along Z
    var westPositions = [-12, 0, 12];
    for (var wi = 0; wi < 3; wi++) {
      var wGeoW = new THREE.BoxGeometry(wallSize, 2, 1);
      var wMatW = _makeMaterial(0x7A7A60);
      var wmW   = _makeMesh(wGeoW, wMatW);
      wmW.position.set(-perimeter, wallY, westPositions[wi]);
      wmW.userData.type     = 'wall';
      wmW.userData.idx      = _wallSegments.length;
      wmW.userData.side     = 'west';
      wmW.userData.fullPos  = wmW.position.clone();
      _group.add(wmW);
      _wallSegments.push(wmW);
      _wallHP.push(WALL_HP_MAX);
    }
    // East wall (x = +perimeter)
    var eastPositions = [-12, 0, 12];
    for (var ei = 0; ei < 3; ei++) {
      var wGeoE = new THREE.BoxGeometry(wallSize, 2, 1);
      var wMatE = _makeMaterial(0x7A7A60);
      var wmE   = _makeMesh(wGeoE, wMatE);
      wmE.position.set(perimeter, wallY, eastPositions[ei]);
      wmE.userData.type     = 'wall';
      wmE.userData.idx      = _wallSegments.length;
      wmE.userData.side     = 'east';
      wmE.userData.fullPos  = wmE.position.clone();
      _group.add(wmE);
      _wallSegments.push(wmE);
      _wallHP.push(WALL_HP_MAX);
    }

    // Ammo dump — 3×2×3
    var adGeo = new THREE.BoxGeometry(3, 2, 3);
    var adMat = _makeMaterial(0x8B5E3C);
    _ammoDump = _makeMesh(adGeo, adMat);
    _ammoDump.position.set(-6, 1, 6);
    _group.add(_ammoDump);

    // Helipad — cylinder r=4, h=0.1
    var hpGeo = new THREE.CylinderGeometry(HELIPAD_RADIUS, HELIPAD_RADIUS, 0.1, 24);
    var hpMat = _makeMaterial(0x333333);
    _helipad  = _makeMesh(hpGeo, hpMat);
    _helipad.position.set(8, 0.05, -5);
    _group.add(_helipad);

    // Helipad H symbol using LineSegments
    _buildHelicopterH();
  }

  function _buildHelicopterH() {
    if (!_group) return;
    var pts = [
      // Left vertical of H
      new THREE.Vector3(6.5, 0.15, -6.5),
      new THREE.Vector3(6.5, 0.15, -3.5),
      // Right vertical of H
      new THREE.Vector3(9.5, 0.15, -6.5),
      new THREE.Vector3(9.5, 0.15, -3.5),
      // Crossbar of H
      new THREE.Vector3(6.5, 0.15, -5),
      new THREE.Vector3(9.5, 0.15, -5)
    ];
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(pts.length * 3);
    for (var i = 0; i < pts.length; i++) {
      positions[i * 3]     = pts[i].x;
      positions[i * 3 + 1] = pts[i].y;
      positions[i * 3 + 2] = pts[i].z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat   = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    var lines = new THREE.LineSegments(geo, mat);
    _group.add(lines);
  }

  // ── Enemy Spawning ────────────────────────────────────────────────────────
  function _spawnEnemy(type) {
    var sc = _resolveScene();
    if (!sc) return;

    var angle = _rand(0, Math.PI * 2);
    var dist  = 60 + _rand(0, 20);
    var sx    = Math.cos(angle) * dist;
    var sz    = Math.sin(angle) * dist;

    var enemy = { type: type, mesh: null, hp: 0, speed: 0,
                  attackTimer: 0, state: 'advance', targetWallIdx: -1,
                  projectiles: [], mortarTimer: 0 };

    if (type === 'infantry') {
      var geo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
      var mat = _makeMaterial(0x556633);
      enemy.mesh = _makeMesh(geo, mat);
      enemy.hp   = 30;
      enemy.speed = 4;
    } else if (type === 'rpg') {
      var geoR = new THREE.BoxGeometry(0.6, 1.8, 0.6);
      var matR = _makeMaterial(0x445533);
      enemy.mesh = _makeMesh(geoR, matR);
      // Launcher visual
      var launchGeo = new THREE.BoxGeometry(0.2, 0.2, 1.2);
      var launchMat = _makeMaterial(0x222222);
      var launcher  = _makeMesh(launchGeo, launchMat);
      launcher.position.set(0.3, 0.5, 0.6);
      enemy.mesh.add(launcher);
      enemy.hp    = 40;
      enemy.speed = 3;
    } else if (type === 'btr') {
      var geoB = new THREE.BoxGeometry(3, 1.8, 5);
      var matB = _makeMaterial(0x445544);
      enemy.mesh = _makeMesh(geoB, matB);
      // Turret
      var turGeo = new THREE.BoxGeometry(1.2, 1, 1.2);
      var turMat = _makeMaterial(0x334433);
      var turret  = _makeMesh(turGeo, turMat);
      turret.position.set(0, 1.4, 0);
      enemy.mesh.add(turret);
      enemy.hp    = 200;
      enemy.speed = 6;
    } else if (type === 'mortar') {
      var geoM = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8);
      var matM = _makeMaterial(0x664433);
      enemy.mesh = _makeMesh(geoM, matM);
      // Mortar tube visual
      var tubeGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 6);
      var tubeMat = _makeMaterial(0x333333);
      var tube    = _makeMesh(tubeGeo, tubeMat);
      tube.position.set(0, 1, 0);
      tube.rotation.x = -0.4;
      enemy.mesh.add(tube);
      enemy.hp          = 25;
      enemy.speed       = 2;
      enemy.mortarTimer = _rand(5, 10);
    } else if (type === 'commander') {
      var geoC = new THREE.BoxGeometry(1.2, 2.4, 1.2);
      var matC = _makeMaterial(0x880000);
      enemy.mesh  = _makeMesh(geoC, matC);
      // Red outline edges
      var edgesGeo = new THREE.EdgesGeometry(geoC);
      var edgesMat = new THREE.LineBasicMaterial({ color: 0xFF0000 });
      var edges    = new THREE.LineSegments(edgesGeo, edgesMat);
      enemy.mesh.add(edges);
      enemy.hp    = 300;
      enemy.speed = 3.5;
    }

    if (!enemy.mesh) return;
    enemy.mesh.position.set(sx, enemy.type === 'btr' ? 0.9 : 0.9, sz);
    enemy.mesh.userData.enemyRef = enemy;
    sc.add(enemy.mesh);
    _enemies.push(enemy);
  }

  function _spawnWave(waveIndex) {
    var def = _waveDefs[waveIndex];
    for (var i = 0; i < def.infantry; i++)  _spawnEnemy('infantry');
    for (var r = 0; r < def.rpg; r++)       _spawnEnemy('rpg');
    for (var b = 0; b < def.btr; b++)       _spawnEnemy('btr');
    for (var m = 0; m < def.mortar; m++)    _spawnEnemy('mortar');
    if (def.commander)                       _spawnEnemy('commander');
  }

  // ── Nearest wall ─────────────────────────────────────────────────────────
  function _nearestBreachableWall(pos) {
    var bestDist = Infinity;
    var bestIdx  = -1;
    for (var i = 0; i < _wallSegments.length; i++) {
      var wm  = _wallSegments[i];
      var hp  = _wallHP[i];
      if (hp <= 0) continue; // already breached — skip
      var dist = _dist2D(pos, wm.position);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx  = i;
      }
    }
    return bestIdx;
  }

  function _nearestBrokenWall(pos) {
    var bestDist = Infinity;
    var bestIdx  = -1;
    for (var i = 0; i < _wallSegments.length; i++) {
      if (_wallHP[i] > 0) continue;
      var dist = _dist2D(pos, _wallSegments[i].position);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx  = i;
      }
    }
    return { idx: bestIdx, dist: bestDist };
  }

  // ── Enemy Update ──────────────────────────────────────────────────────────
  function _updateEnemies(delta) {
    var sc = _resolveScene();
    if (!sc) return;

    var toRemove = [];

    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.mesh) continue;

      var pos = en.mesh.position;

      // Find target wall if not set
      if (en.targetWallIdx < 0) {
        en.targetWallIdx = _nearestBreachableWall(pos);
      }

      // Re-target if current wall is breached
      if (en.targetWallIdx >= 0 && _wallHP[en.targetWallIdx] <= 0) {
        en.targetWallIdx = _nearestBreachableWall(pos);
      }

      // Determine movement target
      var targetPos = new THREE.Vector3(0, 0, 0); // command post
      if (en.targetWallIdx >= 0 && _wallHP[en.targetWallIdx] > 0) {
        targetPos = _wallSegments[en.targetWallIdx].position.clone();
      }

      var dx     = targetPos.x - pos.x;
      var dz     = targetPos.z - pos.z;
      var distToTarget = Math.sqrt(dx * dx + dz * dz);

      // Mortar enemies stop at range
      var stopRange = (en.type === 'mortar') ? 35 : 2;

      if (distToTarget > stopRange) {
        var speed = en.speed * delta;
        pos.x += (dx / distToTarget) * speed;
        pos.z += (dz / distToTarget) * speed;
        // Face direction of movement
        en.mesh.rotation.y = Math.atan2(dx, dz);
      }

      // BTR smashes through walls
      if (en.type === 'btr') {
        for (var wi = 0; wi < _wallSegments.length; wi++) {
          if (_wallHP[wi] <= 0) continue;
          var wpos  = _wallSegments[wi].position;
          var wdist = _dist2D(pos, wpos);
          if (wdist < 4) {
            _damageWall(wi, 80 * delta);
          }
        }
      }

      // Infantry/RPG attack nearest wall
      if (en.type === 'infantry' || en.type === 'rpg') {
        en.attackTimer -= delta;
        if (en.attackTimer <= 0) {
          en.attackTimer = (en.type === 'rpg') ? 3 : 1.5;
          if (en.targetWallIdx >= 0 && _wallHP[en.targetWallIdx] > 0) {
            var wdist2 = _dist2D(pos, _wallSegments[en.targetWallIdx].position);
            if (wdist2 < 20) {
              _damageWall(en.targetWallIdx, en.type === 'rpg' ? 25 : 5);
            }
          }
          // Also attack command post if close
          var cpDist = _dist2D(pos, { x: 0, z: 0 });
          if (cpDist < 8) {
            _damageCommandPost(en.type === 'rpg' ? 15 : 3);
          }
        }
      }

      // Commander attacks command post directly
      if (en.type === 'commander') {
        en.attackTimer -= delta;
        if (en.attackTimer <= 0) {
          en.attackTimer = 1;
          var cdist = _dist2D(pos, { x: 0, z: 0 });
          if (cdist < 10) {
            _damageCommandPost(20);
          }
        }
      }

      // Mortar team lobs projectiles
      if (en.type === 'mortar') {
        en.mortarTimer -= delta;
        if (en.mortarTimer <= 0) {
          en.mortarTimer = _rand(4, 8);
          _launchMortarProjectile(pos.clone());
        }
      }

      // Remove dead enemies
      if (en.hp <= 0) {
        sc.remove(en.mesh);
        _disposeObject(en.mesh);
        toRemove.push(i);
      }
    }

    // Remove dead enemies in reverse order
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      _enemies.splice(toRemove[ri], 1);
    }
  }

  // ── Damage ────────────────────────────────────────────────────────────────
  function _damageWall(idx, amount) {
    if (idx < 0 || idx >= _wallHP.length) return;
    _wallHP[idx] -= amount;
    if (_wallHP[idx] < 0) _wallHP[idx] = 0;
    // Visual crumble: lerp scale.y toward 0
    var wm = _wallSegments[idx];
    if (wm) {
      var ratio = _wallHP[idx] / WALL_HP_MAX;
      wm.scale.y = Math.max(0.01, ratio);
    }
  }

  function _damageCommandPost(amount) {
    _commandPostHP -= amount;
    if (_commandPostHP < 0) _commandPostHP = 0;
    if (_commandPostHP <= 0 && !_gameOver) {
      _gameOver = true;
      _showEndBanner(false);
    }
  }

  // ── Mortar Projectiles ────────────────────────────────────────────────────
  function _launchMortarProjectile(fromPos) {
    var sc = _resolveScene();
    if (!sc) return;

    // Target: random position inside firebase
    var tx = _rand(-10, 10);
    var tz = _rand(-10, 10);

    var geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var mat = _makeMaterial(0xFF6600);
    var mesh = _makeMesh(geo, mat);
    mesh.position.copy(fromPos);
    mesh.position.y = 1;
    sc.add(mesh);

    _mortarProjectiles.push({
      mesh:   mesh,
      startX: fromPos.x,
      startZ: fromPos.z,
      endX:   tx,
      endZ:   tz,
      t:      0,
      duration: 3 + _rand(0, 1),
      arcHeight: 20 + _rand(0, 10)
    });
  }

  function _updateMortarProjectiles(delta) {
    var sc = _resolveScene();
    if (!sc) return;

    var toRemove = [];
    for (var i = 0; i < _mortarProjectiles.length; i++) {
      var proj = _mortarProjectiles[i];
      proj.t  += delta / proj.duration;
      if (proj.t >= 1) {
        proj.t = 1;
        // Impact: damage walls / command post in radius
        var impactX = proj.endX;
        var impactZ = proj.endZ;
        var cpDist  = Math.sqrt(impactX * impactX + impactZ * impactZ);
        if (cpDist < 6) {
          _damageCommandPost(30);
        }
        for (var wi = 0; wi < _wallSegments.length; wi++) {
          var wd = _dist2D({ x: impactX, z: impactZ }, _wallSegments[wi].position);
          if (wd < 5) {
            _damageWall(wi, 25);
          }
        }
        sc.remove(proj.mesh);
        _disposeObject(proj.mesh);
        toRemove.push(i);
        continue;
      }
      // Arc trajectory
      var t  = proj.t;
      proj.mesh.position.x = proj.startX + (proj.endX - proj.startX) * t;
      proj.mesh.position.z = proj.startZ + (proj.endZ - proj.startZ) * t;
      proj.mesh.position.y = proj.arcHeight * 4 * t * (1 - t) + 1;
      proj.mesh.rotation.x += delta * 3;
      proj.mesh.rotation.z += delta * 2;
    }
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      _mortarProjectiles.splice(toRemove[ri], 1);
    }
  }

  // ── Counter-Mortar ────────────────────────────────────────────────────────
  function _fireCounterMortar() {
    if (_mortarCount <= 0 || _mortarCooldown > 0) return;
    if (_enemies.length === 0) return;

    // Target nearest enemy cluster
    var sc = _resolveScene();
    if (!sc) return;

    // Find centroid of enemies
    var cx = 0, cz = 0;
    for (var i = 0; i < _enemies.length; i++) {
      cx += _enemies[i].mesh.position.x;
      cz += _enemies[i].mesh.position.z;
    }
    cx /= _enemies.length;
    cz /= _enemies.length;

    _mortarCount--;
    _mortarCooldown = MORTAR_COOLDOWN;

    // Damage enemies in blast radius
    var blastRadius = 8;
    for (var j = _enemies.length - 1; j >= 0; j--) {
      var en   = _enemies[j];
      var dist = _dist2D(en.mesh.position, { x: cx, z: cz });
      if (dist < blastRadius) {
        en.hp -= 80;
        if (en.hp < 0) en.hp = 0;
      }
    }

    // Visual flash
    _showBanner('COUNTER-MORTAR FIRE!<br>[' + _mortarCount + ' REMAINING]', 1.5);
  }

  // ── Resupply Helicopter ───────────────────────────────────────────────────
  function _buildHelicopter() {
    var sc = _resolveScene();
    if (!sc) return;

    var heliGroup = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(2, 1, 5);
    var bodyMat = _makeMaterial(0x556644);
    var body    = _makeMesh(bodyGeo, bodyMat);
    heliGroup.add(body);

    // Tail
    var tailGeo = new THREE.BoxGeometry(0.5, 0.5, 3);
    var tailMat = _makeMaterial(0x445533);
    var tail    = _makeMesh(tailGeo, tailMat);
    tail.position.set(0, 0.2, -3.5);
    heliGroup.add(tail);

    // Main rotor
    var rGeo1 = new THREE.CylinderGeometry(0.1, 0.1, 3, 6);
    var rMat1 = _makeMaterial(0x888888);
    var rotor1 = _makeMesh(rGeo1, rMat1);
    rotor1.rotation.z = Math.PI / 2;
    rotor1.position.set(0, 0.7, 0);
    rotor1.userData.isRotor = true;
    heliGroup.add(rotor1);

    // Tail rotor
    var rGeo2 = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
    var rMat2 = _makeMaterial(0x888888);
    var rotor2 = _makeMesh(rGeo2, rMat2);
    rotor2.rotation.x = Math.PI / 2;
    rotor2.position.set(0.3, 0.2, -5);
    rotor2.userData.isRotor = true;
    heliGroup.add(rotor2);

    heliGroup.position.set(50, 30, -50);
    heliGroup.userData.isHelicopter = true;
    sc.add(heliGroup);
    _helicopter = heliGroup;
    _heliPhase  = 'approach';
    _heliTimer  = 0;
    _heliActive = true;
  }

  function _dropSupplyCrate() {
    var sc = _resolveScene();
    if (!sc || !_helipad) return;

    var geo  = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var mat  = _makeMaterial(0xBB8833);
    var crate = _makeMesh(geo, mat);
    crate.position.copy(_helipad.position);
    crate.position.y = 8;
    crate.userData.isCrate   = true;
    crate.userData.fallSpeed = 6;
    sc.add(crate);
    _supplyCrate = crate;
  }

  function _updateHelicopter(delta) {
    if (!_heliActive || !_helicopter) return;
    var sc = _resolveScene();
    if (!sc) return;

    var targetX = 8, targetY = 12, targetZ = -5;

    // Spin rotors
    _helicopter.children.forEach(function(child) {
      if (child.userData.isRotor) {
        child.rotation.y += delta * 15;
      }
    });

    _heliTimer += delta;

    if (_heliPhase === 'approach') {
      // Fly toward helipad
      var pos  = _helicopter.position;
      var dx   = targetX - pos.x;
      var dy   = targetY - pos.y;
      var dz   = targetZ - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 3) {
        _heliPhase = 'hover';
        _heliTimer = 0;
        _dropSupplyCrate();
      } else {
        var spd = 15 * delta;
        pos.x += (dx / dist) * spd;
        pos.y += (dy / dist) * spd;
        pos.z += (dz / dist) * spd;
      }
    } else if (_heliPhase === 'hover') {
      // Hover for 4 seconds
      _helicopter.position.y = targetY + Math.sin(_heliTimer * 2) * 0.3;
      if (_heliTimer >= 4) {
        _heliPhase = 'depart';
        _heliTimer = 0;
      }
    } else if (_heliPhase === 'depart') {
      var pos2 = _helicopter.position;
      pos2.x  += delta * 20;
      pos2.y  += delta * 8;
      pos2.z  -= delta * 15;
      if (pos2.x > 120 || pos2.z < -120) {
        sc.remove(_helicopter);
        _disposeObject(_helicopter);
        _helicopter  = null;
        _heliActive  = false;
      }
    }

    // Update supply crate fall
    if (_supplyCrate) {
      _supplyCrate.position.y -= _supplyCrate.userData.fallSpeed * delta;
      if (_supplyCrate.position.y <= 0.4) {
        _supplyCrate.position.y = 0.4;
        // Collect supplies
        _ammoCount  += 100;
        _repairKits += 2;
        _showBanner('RESUPPLY RECEIVED!<br>+100 AMMO  +2 REPAIR KITS', 3);
        sc.remove(_supplyCrate);
        _disposeObject(_supplyCrate);
        _supplyCrate = null;
      }
    }
  }

  // ── Repair ────────────────────────────────────────────────────────────────
  function _tryRepair(delta) {
    var cam = _resolveCamera();
    if (!cam) return;

    if (_repairingIndex >= 0) {
      // In progress
      _repairTimer -= delta;
      if (_repairTimer <= 0) {
        _wallHP[_repairingIndex] = WALL_HP_MAX;
        var wm = _wallSegments[_repairingIndex];
        if (wm) wm.scale.y = 1;
        _showBanner('WALL REPAIRED', 2);
        _repairingIndex = -1;
      }
      return;
    }

    // Find nearest broken wall within range
    var result = _nearestBrokenWall(cam.position);
    if (result.idx < 0 || result.dist > REPAIR_RANGE) return;
    if (_repairKits <= 0) return;

    _repairKits--;
    _repairingIndex = result.idx;
    _repairTimer    = REPAIR_DURATION;
    _showBanner('REPAIRING WALL... (' + REPAIR_DURATION + 's)', REPAIR_DURATION);
  }

  // ── Wave Management ───────────────────────────────────────────────────────
  function _startNextWave() {
    if (_currentWave >= TOTAL_WAVES) return;
    _spawnWave(_currentWave);
    _waveActive = true;
    _betweenWaves = false;
    _currentWave++;
    _showBanner(_waveDefs[_currentWave - 1].label, 3);
  }

  function _checkWaveComplete() {
    if (!_waveActive) return;
    if (_enemies.length === 0) {
      _waveActive = false;
      if (_currentWave >= TOTAL_WAVES) {
        _allWavesDefeated = true;
        _victory          = true;
        _gameOver         = true;
        _showEndBanner(true);
      } else {
        // Delay before next wave
        _betweenWaves  = true;
        _nextWaveDelay = 8;
      }
    }
  }

  // ── Key Handlers ──────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;

    if (!_active) {
      // F + B activation combo (both held, then either triggers)
      if ((e.code === 'KeyB' && _keys['KeyF']) ||
          (e.code === 'KeyF' && _keys['KeyB'])) {
        _startMode();
      }
      return;
    }

    // Spacebar: counter-mortar
    if (e.code === 'Space') {
      _fireCounterMortar();
    }

    // R: repair nearby wall
    if (e.code === 'KeyR') {
      _tryRepairInstant();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _tryRepairInstant() {
    var cam = _resolveCamera();
    if (!cam) return;
    if (_repairingIndex >= 0) return; // already repairing
    var result = _nearestBrokenWall(cam.position);
    if (result.idx < 0 || result.dist > REPAIR_RANGE) {
      _showBanner('NO BROKEN WALL IN RANGE', 1.5);
      return;
    }
    if (_repairKits <= 0) {
      _showBanner('NO REPAIR KITS REMAINING', 1.5);
      return;
    }
    _repairKits--;
    _repairingIndex = result.idx;
    _repairTimer    = REPAIR_DURATION;
    _showBanner('REPAIRING WALL... (' + REPAIR_DURATION + 's)', REPAIR_DURATION);
  }

  // ── Mode Start / Stop ─────────────────────────────────────────────────────
  function _startMode() {
    if (_active) return;
    _active = true;

    _commandPostHP    = COMMAND_POST_HP_MAX;
    _currentWave      = 0;
    _waveActive       = false;
    _allWavesDefeated = false;
    _gameOver         = false;
    _victory          = false;
    _ammoCount        = 100;
    _repairKits       = 2;
    _mortarCount      = MORTAR_MAX;
    _mortarCooldown   = 0;
    _repairingIndex   = -1;
    _repairTimer      = 0;
    _resupplyTimer    = RESUPPLY_INTERVAL;
    _betweenWaves     = false;
    _nextWaveDelay    = 3;
    _enemies          = [];
    _mortarProjectiles = [];

    _buildFirebase();

    if (_hudEl)      _hudEl.style.display      = 'block';
    if (_endBannerEl) _endBannerEl.style.display = 'none';

    _showBanner('FIREBASE DEFENSE INITIATED<br>F+B TO ACTIVATE', 3);
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    _createHUD();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  // ── Public: update ────────────────────────────────────────────────────────
  function update(delta) {
    if (!_active) return;
    if (!delta || delta > 0.5) delta = 0.016;

    if (_gameOver) {
      _updateHUD();
      return;
    }

    // Wave timing
    if (!_waveActive && !_betweenWaves && _currentWave === 0) {
      // First wave — start after short delay
      _nextWaveDelay -= delta;
      if (_nextWaveDelay <= 0) {
        _startNextWave();
      }
    } else if (_betweenWaves) {
      _nextWaveDelay -= delta;
      if (_nextWaveDelay <= 0) {
        _startNextWave();
      }
    }

    _checkWaveComplete();

    // Mortar cooldown
    if (_mortarCooldown > 0) _mortarCooldown -= delta;

    // Resupply timer
    _resupplyTimer -= delta;
    if (_resupplyTimer <= 0 && !_heliActive) {
      _resupplyTimer = RESUPPLY_INTERVAL;
      _buildHelicopter();
    }

    // Repair in-progress tick
    if (_repairingIndex >= 0) {
      _repairTimer -= delta;
      if (_repairTimer <= 0) {
        _wallHP[_repairingIndex] = WALL_HP_MAX;
        var wm = _wallSegments[_repairingIndex];
        if (wm) wm.scale.y = 1;
        _showBanner('WALL REPAIRED', 2);
        _repairingIndex = -1;
      }
    }

    // Banner timer
    if (_bannerTimer > 0) {
      _bannerTimer -= delta;
      if (_bannerTimer <= 0 && _bannerEl) {
        _bannerEl.style.display = 'none';
      }
    }

    _updateEnemies(delta);
    _updateMortarProjectiles(delta);
    _updateHelicopter(delta);
    _updateHUD();
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    var sc = _resolveScene();

    // Remove all enemies
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].mesh && sc) sc.remove(_enemies[i].mesh);
      _disposeObject(_enemies[i].mesh);
    }
    _enemies = [];

    // Remove mortar projectiles
    for (var mi = 0; mi < _mortarProjectiles.length; mi++) {
      if (_mortarProjectiles[mi].mesh && sc) sc.remove(_mortarProjectiles[mi].mesh);
      _disposeObject(_mortarProjectiles[mi].mesh);
    }
    _mortarProjectiles = [];

    // Remove firebase group
    if (_group && sc) {
      sc.remove(_group);
    }
    _group        = null;
    _commandPost  = null;
    _watchtowers  = [];
    _wallSegments = [];
    _ammoDump     = null;
    _helipad      = null;

    // Remove helicopter
    if (_helicopter && sc) sc.remove(_helicopter);
    _helicopter = null;
    _heliActive = false;

    // Remove supply crate
    if (_supplyCrate && sc) sc.remove(_supplyCrate);
    _supplyCrate = null;

    // Reset HUD
    if (_hudEl)       _hudEl.style.display       = 'none';
    if (_bannerEl)    _bannerEl.style.display     = 'none';
    if (_endBannerEl) _endBannerEl.style.display  = 'none';

    _active           = false;
    _gameOver         = false;
    _victory          = false;
    _allWavesDefeated = false;
    _currentWave      = 0;
    _waveActive       = false;
    _betweenWaves     = false;
    _wallHP           = [];
    _watchtowerHP     = [];
    _commandPostHP    = COMMAND_POST_HP_MAX;
    _repairingIndex   = -1;
    _repairTimer      = 0;
    _mortarCount      = MORTAR_MAX;
    _mortarCooldown   = 0;
    _resupplyTimer    = RESUPPLY_INTERVAL;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
