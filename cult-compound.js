/* ───────────────────────────────────────────────────────────────────────────
   cult-compound.js — Cult Compound Infiltration Module
   API: window.CultCompound = { init, update, reset }
   Controls:
     C + C (both within 400ms) → activate module
     WASD                      → move player
     Mouse                     → aim / look
     E (within 2u range)       → deprogramming / photograph evidence /
                                  neutralize poison / secure/destroy armory /
                                  call authorities (radio)
     Left Click                → shoot (alerts everyone, lights alarm)
   ─────────────────────────────────────────────────────────────────────────── */
window.CultCompound = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active       = false;
  var _c1PressTime  = 0;
  var _keys         = {};
  var _prevEKey     = false;
  var _prevCKey     = false;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _missionEnd        = false;
  var _missionSuccess    = false;
  var _alarmActive       = false;
  var _alarmLight        = null;
  var _gameTime          = 0;
  var _poisonTimer       = 360;   /* 6 minutes until mass casualty */
  var _pacifist          = true;  /* no shots fired yet */
  var _shotFired         = false;
  var _cultLeaderAlive   = true;
  var _cultLeaderStatus  = 'AT LARGE';

  /* ── Cultist counts ────────────────────────────────────────────────────── */
  var _cultists          = [];    /* 20 peaceful + 5 armed guards = 25 total */
  var _hostages          = [];    /* 8 brainwashed cultists to deprogram */
  var _rescuedCount      = 0;
  var _cultLeaderMesh    = null;
  var _cultLeaderHP      = 400;

  /* ── Evidence ──────────────────────────────────────────────────────────── */
  var _evidenceBoxes     = [];    /* 4 document boxes */
  var _financialRecord   = null;
  var _evidenceCount     = 0;
  var _evidenceTotal     = 5;

  /* ── Poison barrels ────────────────────────────────────────────────────── */
  var _poisonBarrels     = [];    /* 3 barrels to neutralize */
  var _barrelsNeutralized = 0;

  /* ── Armory ────────────────────────────────────────────────────────────── */
  var _weaponsCache      = null;
  var _armoryAction      = null;  /* null | 'destroy' | 'secure' */
  var _armoryInteractTimer = 0;

  /* ── Radio ─────────────────────────────────────────────────────────────── */
  var _radioMesh         = null;
  var _radioInteractTimer = 0;
  var _authoritiesCalled = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player            = null;
  var _playerPos         = null;
  var _playerHP          = 100;
  var _yaw               = 0;
  var _pitch             = 0;
  var _mouseX            = 0;
  var _mouseY            = 0;
  var _fireTimer         = 0;
  var _fireRate          = 0.12;
  var _playerBullets     = [];

  /* ── Enemy bullets ─────────────────────────────────────────────────────── */
  var _enemyBullets      = [];

  /* ── Interact timers ───────────────────────────────────────────────────── */
  /* Per-hostage deprogramming progress */
  var _deprogramTarget   = null;  /* current hostage being deprogrammed */
  var _deprogramTimer    = 0;     /* 0..8 */

  /* Per-barrel neutralize progress */
  var _neutralizeTarget  = null;
  var _neutralizeTimer   = 0;     /* 0..5 */

  /* ── Compound geometry references ──────────────────────────────────────── */
  var _compoundGroup     = null;
  var _fenceLines        = null;
  var _guardPosts        = [];

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud               = null;

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HELPERS                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function _box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = _makeMat(color);
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = _makeMat(color);
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  }

  function _dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }

  function _getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }

  function _addScore(pts) {
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(pts);
    }
    var el = document.getElementById('score-display');
    if (el) {
      var cur = parseInt((el.textContent || '').replace(/[^0-9\-]/g, ''), 10) || 0;
      el.textContent = 'SCORE: ' + (cur + pts);
    }
  }

  function _killFeed(msg) {
    if (window.KillFeedEvents && typeof window.KillFeedEvents.push === 'function') {
      window.KillFeedEvents.push(msg);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD COMPOUND                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildCompound() {
    var sc = _getScene();
    _compoundGroup = new THREE.Group();

    /* Ground — 40x1x40 */
    var ground = _box(40, 1, 40, 0x556644);
    ground.position.set(0, -0.5, 0);
    _compoundGroup.add(ground);

    /* Main temple — 15x10x12 */
    var temple = _box(15, 10, 12, 0x887766);
    temple.position.set(0, 5, -6);
    _compoundGroup.add(temple);

    /* Dormitory — 20x4x10 */
    var dorm = _box(20, 4, 10, 0x776655);
    dorm.position.set(-8, 2, 8);
    _compoundGroup.add(dorm);

    /* Armory — 8x4x6 */
    var armory = _box(8, 4, 6, 0x665544);
    armory.position.set(12, 2, 4);
    _compoundGroup.add(armory);

    /* Weapons cache inside armory */
    _weaponsCache = _box(2, 1.5, 1, 0x556644);
    _weaponsCache.position.set(12, 0.75, 4);
    _compoundGroup.add(_weaponsCache);

    /* Cult leader mansion — 12x6x10 */
    var mansion = _box(12, 6, 10, 0x554433);
    mansion.position.set(-10, 3, -8);
    _compoundGroup.add(mansion);

    /* Financial records in mansion */
    _financialRecord = _box(1, 0.5, 0.8, 0x885522);
    _financialRecord.position.set(-10, 0.25, -8);
    _compoundGroup.add(_financialRecord);

    /* Radio in a small office near temple */
    _radioMesh = _box(0.8, 0.6, 0.6, 0x334455);
    _radioMesh.position.set(4, 0.3, -2);
    _compoundGroup.add(_radioMesh);

    /* Perimeter fence — LineSegments, 44x44 square approx */
    var fencePoints = [];
    var hw = 20, hd = 20;
    /* NW→NE */
    fencePoints.push(-hw, 0.5, -hd);  fencePoints.push( hw, 0.5, -hd);
    /* NE→SE */
    fencePoints.push( hw, 0.5, -hd);  fencePoints.push( hw, 0.5,  hd);
    /* SE→SW */
    fencePoints.push( hw, 0.5,  hd);  fencePoints.push(-hw, 0.5,  hd);
    /* SW→NW */
    fencePoints.push(-hw, 0.5,  hd);  fencePoints.push(-hw, 0.5, -hd);
    /* Top rail */
    fencePoints.push(-hw, 2,   -hd);  fencePoints.push( hw, 2,   -hd);
    fencePoints.push( hw, 2,   -hd);  fencePoints.push( hw, 2,    hd);
    fencePoints.push( hw, 2,    hd);  fencePoints.push(-hw, 2,    hd);
    fencePoints.push(-hw, 2,    hd);  fencePoints.push(-hw, 2,   -hd);
    /* Verticals at corners */
    fencePoints.push(-hw, 0.5, -hd);  fencePoints.push(-hw, 2,   -hd);
    fencePoints.push( hw, 0.5, -hd);  fencePoints.push( hw, 2,   -hd);
    fencePoints.push( hw, 0.5,  hd);  fencePoints.push( hw, 2,    hd);
    fencePoints.push(-hw, 0.5,  hd);  fencePoints.push(-hw, 2,    hd);

    var fenceGeo = new THREE.BufferGeometry();
    var fenceArr = new Float32Array(fencePoints);
    fenceGeo.setAttribute('position', new THREE.BufferAttribute(fenceArr, 3));
    var fenceMat = new THREE.LineBasicMaterial({ color: 0x887744 });
    _fenceLines = new THREE.LineSegments(fenceGeo, fenceMat);
    _compoundGroup.add(_fenceLines);

    /* 4 guard posts at corners */
    var postPositions = [[-hw + 1, 0, -hd + 1], [hw - 1, 0, -hd + 1],
                         [hw - 1, 0,  hd - 1], [-hw + 1, 0,  hd - 1]];
    for (var gi = 0; gi < 4; gi++) {
      var post = _box(1.5, 3, 1.5, 0x665533);
      post.position.set(postPositions[gi][0], 1.5, postPositions[gi][2]);
      _compoundGroup.add(post);
      _guardPosts.push(post);
    }

    /* Ambient + directional lighting */
    var ambient = new THREE.AmbientLight(0xCCDDBB, 0.55);
    sc.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFEEDD, 0.8);
    sun.position.set(15, 30, 20);
    sc.add(sun);

    /* Alarm light — off initially */
    _alarmLight = new THREE.PointLight(0xFF2200, 0, 20);
    _alarmLight.position.set(0, 8, 0);
    _compoundGroup.add(_alarmLight);

    sc.add(_compoundGroup);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD EVIDENCE BOXES                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildEvidenceBoxes() {
    /* 4 document boxes in temple, dormitory, office */
    var positions = [
      [2, 0.3, -5],    /* temple floor */
      [-3, 0.3, -7],   /* temple corner */
      [-5, 0.3, 8],    /* dormitory */
      [6, 0.3, 6]      /* near armory */
    ];
    for (var i = 0; i < positions.length; i++) {
      var b = _box(0.8, 0.5, 0.6, 0xFFFFAA);
      b.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _compoundGroup.add(b);
      _evidenceBoxes.push({ mesh: b, collected: false });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD POISON BARRELS                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPoisonBarrels() {
    var positions = [
      [-2, 0, -3],
      [1, 0, -4],
      [-4, 0, -2]
    ];
    for (var i = 0; i < positions.length; i++) {
      var b = _cyl(0.4, 0.4, 1.2, 10, 0x336633);
      b.position.set(positions[i][0], 0.6, positions[i][2]);
      _compoundGroup.add(b);
      _poisonBarrels.push({ mesh: b, neutralized: false, timer: 0, interacting: false });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD CULT MEMBERS                                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildCultMember(x, z, isGuard, isLeader) {
    var g = new THREE.Group();
    var scale = isLeader ? 1.5 : 1.0;
    var color = isLeader ? 0x441122 : (isGuard ? 0x334433 : 0xFFDDCC);

    var body = _box(0.6 * scale, 1.4 * scale, 0.4 * scale, color);
    body.position.y = 0.7 * scale;
    g.add(body);

    var headGeo = new THREE.BoxGeometry(0.35 * scale, 0.35 * scale, 0.35 * scale);
    var headMat = _makeMat(isLeader ? 0x441122 : (isGuard ? 0x334433 : 0xFFDDCC));
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.575 * scale;
    g.add(head);

    if (isGuard || isLeader) {
      /* Weapon */
      var gun = _box(0.1, 0.1, 0.8, 0x222222);
      gun.position.set(0.35 * scale, 0.9 * scale, 0.4 * scale);
      g.add(gun);
    }

    g.position.set(x, 0, z);
    _compoundGroup.add(g);
    return g;
  }

  function _buildCultists() {
    /* 20 peaceful cultists */
    var peacefulPositions = [
      [-2, 2], [1, 3], [-4, 6], [3, 7], [-6, 4],
      [5, -2], [-3, -4], [2, -6], [-5, -3], [6, 1],
      [-8, 7], [8, 6], [-1, 9], [4, 9], [-7, 1],
      [9, -1], [-9, 3], [0, 5], [7, 3], [-5, 9]
    ];
    for (var i = 0; i < 20; i++) {
      var mesh = _buildCultMember(peacefulPositions[i][0], peacefulPositions[i][1], false, false);
      _cultists.push({
        mesh: mesh,
        hp: 60,
        alive: true,
        isGuard: false,
        isLeader: false,
        alertState: false,
        patrolDir: Math.random() > 0.5 ? 1 : -1,
        startX: peacefulPositions[i][0],
        startZ: peacefulPositions[i][1],
        waypointIndex: 0,
        fireTimer: 2 + Math.random() * 2,
        hasImprovisedWeapon: false
      });
    }

    /* 5 armed guards */
    var guardPositions = [
      [-19, -19], [19, -19], [19, 19], [-19, 19], [0, -15]
    ];
    for (var j = 0; j < 5; j++) {
      var gmesh = _buildCultMember(guardPositions[j][0], guardPositions[j][1], true, false);
      _cultists.push({
        mesh: gmesh,
        hp: 80,
        alive: true,
        isGuard: true,
        isLeader: false,
        alertState: false,
        patrolDir: 1,
        startX: guardPositions[j][0],
        startZ: guardPositions[j][1],
        waypointIndex: 0,
        fireTimer: 1.5 + Math.random(),
        hasImprovisedWeapon: false
      });
    }

    /* Cult leader — 1.5x scale, 400HP, in mansion */
    _cultLeaderMesh = _buildCultMember(-10, -8, true, true);
    _cultists.push({
      mesh: _cultLeaderMesh,
      hp: 400,
      alive: true,
      isGuard: true,
      isLeader: true,
      alertState: false,
      patrolDir: 1,
      startX: -10,
      startZ: -8,
      waypointIndex: 0,
      fireTimer: 1.0,
      hasImprovisedWeapon: false
    });
  }

  function _buildHostages() {
    /* 8 brainwashed cultists */
    var hostagePositions = [
      [-1, -5], [1, -6], [-2, -4], [2, -5],
      [0, -3], [-1, -7], [1, -4], [3, -6]
    ];
    for (var i = 0; i < 8; i++) {
      var g = new THREE.Group();
      var body = _box(0.55, 1.3, 0.38, 0xFFCCBB);
      body.position.y = 0.65;
      g.add(body);
      var headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var headMat = _makeMat(0xFFCCBB);
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.45;
      g.add(head);
      g.position.set(hostagePositions[i][0], 0, hostagePositions[i][1]);
      _compoundGroup.add(g);
      _hostages.push({
        mesh: g,
        deprogrammed: false,
        fleeing: false,
        fleeProgress: 0
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD PLAYER                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPlayer() {
    var g = new THREE.Group();
    var body = _box(0.6, 1.6, 0.4, 0x334455);
    body.position.y = 0.8;
    g.add(body);
    var gun = _box(0.1, 0.1, 0.8, 0x222222);
    gun.position.set(0.35, 1.1, 0.4);
    g.add(gun);
    g.position.set(0, 0, 22);
    _getScene().add(g);
    _player = g;
    _playerPos = g.position;
    var cam = _getCamera();
    if (cam) {
      cam.position.set(0, 5, 28);
      cam.lookAt(0, 1, 22);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HUD                                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'cc-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#AAFFAA',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #556644',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hud) return;
    var guardCount = 0;
    for (var i = 0; i < _cultists.length; i++) {
      if (_cultists[i].alive && (_cultists[i].isGuard || _cultists[i].isLeader)) guardCount++;
    }
    var poisonSecs = Math.max(0, Math.ceil(_poisonTimer));
    var pm = Math.floor(poisonSecs / 60);
    var ps = poisonSecs % 60;
    var poisonStr = pm + ':' + (ps < 10 ? '0' : '') + ps;
    var alarmStr = _alarmActive ? ' <span style="color:#FF4444">!! ALARM</span>' : '';
    _hud.innerHTML =
      'COMPOUND' + alarmStr + ' | ' +
      '[CULTISTS RESCUED: ' + _rescuedCount + '/8] ' +
      '[EVIDENCE: ' + _evidenceCount + '/5] ' +
      '[POISON BARRELS: ' + _barrelsNeutralized + '/3 | ' + poisonStr + '] ' +
      '[GUARDS: ' + guardCount + '] | ' +
      'CULT LEADER: ' + _cultLeaderStatus;
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
    /* Light up PointLight alarm */
    if (_alarmLight) {
      _alarmLight.intensity = 3;
    }
    /* Alert all guards */
    for (var i = 0; i < _cultists.length; i++) {
      if (_cultists[i].isGuard || _cultists[i].isLeader) {
        _cultists[i].alertState = true;
      }
    }
    /* Peaceful cultists react: flee or pick up improvised weapons */
    for (var j = 0; j < _cultists.length; j++) {
      if (!_cultists[j].isGuard && !_cultists[j].isLeader && _cultists[j].alive) {
        if (Math.random() < 0.4) {
          /* pick up improvised weapon */
          _cultists[j].hasImprovisedWeapon = true;
          _cultists[j].alertState = true;
          /* Attach a small box to represent improvised weapon */
          var impWep = _box(0.2, 0.2, 0.7, 0x885533);
          impWep.position.set(0.35, 0.9, 0.4);
          _cultists[j].mesh.add(impWep);
        } else {
          /* flee — set a flee direction */
          _cultists[j].fleeDir = {
            x: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2
          };
          var fl = Math.sqrt(_cultists[j].fleeDir.x * _cultists[j].fleeDir.x +
                             _cultists[j].fleeDir.z * _cultists[j].fleeDir.z);
          if (fl > 0.01) {
            _cultists[j].fleeDir.x /= fl;
            _cultists[j].fleeDir.z /= fl;
          }
          _cultists[j].fleeing = true;
        }
      }
    }
    _killFeed('!! ALARM TRIGGERED — Guards converging!');
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  SHOOT                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _firePlayerBullet() {
    var cam = _getCamera();
    if (!cam) return;
    var geo = new THREE.SphereGeometry(0.12, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
    var b = new THREE.Mesh(geo, mat);
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion);
    b.position.copy(cam.position).addScaledVector(dir, 1.5);
    _getScene().add(b);
    _playerBullets.push({ mesh: b, vel: dir.multiplyScalar(40), life: 1.5 });
    /* Shooting always triggers alarm and breaks pacifist */
    _pacifist = false;
    _shotFired = true;
    _triggerAlarm();
  }

  function _fireEnemyBullet(fromPos) {
    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    var b = new THREE.Mesh(geo, mat);
    b.position.copy(fromPos);
    _getScene().add(b);
    if (!_playerPos) return;
    var dir = _playerPos.clone().sub(fromPos).normalize();
    dir.x += (Math.random() - 0.5) * 0.18;
    dir.y += (Math.random() - 0.5) * 0.1;
    dir.z += (Math.random() - 0.5) * 0.18;
    dir.normalize();
    _enemyBullets.push({ mesh: b, vel: dir.multiplyScalar(18), life: 2.5 });
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INTERACT (E key)                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryStartInteract() {
    if (!_playerPos) return;

    /* Deprogramming: find nearest non-deprogrammed hostage within 2u */
    if (!_deprogramTarget) {
      for (var hi = 0; hi < _hostages.length; hi++) {
        var h = _hostages[hi];
        if (h.deprogrammed || h.fleeing) continue;
        if (_dist(_playerPos, h.mesh.position) < 2) {
          _deprogramTarget = h;
          _deprogramTimer = 0;
          _killFeed('Deprogramming cultist... (8s)');
          return;
        }
      }
    }

    /* Neutralize poison barrel */
    if (!_neutralizeTarget) {
      for (var bi = 0; bi < _poisonBarrels.length; bi++) {
        var bar = _poisonBarrels[bi];
        if (bar.neutralized) continue;
        if (_dist(_playerPos, bar.mesh.position) < 2) {
          _neutralizeTarget = bar;
          _neutralizeTimer = 0;
          _killFeed('Neutralizing poison barrel... (5s)');
          return;
        }
      }
    }

    /* Photograph evidence box */
    for (var ei = 0; ei < _evidenceBoxes.length; ei++) {
      var ev = _evidenceBoxes[ei];
      if (ev.collected) continue;
      if (_dist(_playerPos, ev.mesh.position) < 2) {
        ev.collected = true;
        _evidenceCount++;
        ev.mesh.material.color.setHex(0x888800);
        _killFeed('Evidence photographed! (' + _evidenceCount + '/5)');
        _addScore(200);
        _checkMissionComplete();
        return;
      }
    }

    /* Financial records in mansion */
    if (_financialRecord && _evidenceCount < _evidenceTotal) {
      if (_dist(_playerPos, _financialRecord.position) < 2.5) {
        _evidenceCount++;
        _getScene().remove(_financialRecord);
        /* can't remove from compound group after the fact easily, just hide */
        _financialRecord.visible = false;
        _financialRecord = null;
        _killFeed('Financial records secured! (' + _evidenceCount + '/5)');
        _addScore(300);
        _checkMissionComplete();
        return;
      }
    }

    /* Armory — destroy (3s) or secure (6s) */
    if (_weaponsCache && !_armoryAction && _dist(_playerPos, _weaponsCache.position) < 3) {
      /* Choose destroy vs secure based on crouch key (X) held; default secure */
      var destroyMode = !!(_keys['x'] || _keys['KeyX']);
      _armoryAction = destroyMode ? 'destroy' : 'secure';
      _armoryInteractTimer = 0;
      _killFeed(destroyMode
        ? 'Planting charge on armory... (3s) — will alert everyone!'
        : 'Calling secure team for armory... (6s)');
      return;
    }

    /* Call authorities at radio */
    if (_radioMesh && !_authoritiesCalled && _dist(_playerPos, _radioMesh.position) < 2) {
      _radioInteractTimer = 0;
      _authoritiesCalled = false; /* will be set after 6s */
      _killFeed('Calling authorities... (6s)');
      _armoryAction = _armoryAction || null; /* don't clobber */
      /* Use a dedicated flag to track radio progress */
      _radioInteracting = true;
      return;
    }
  }

  var _radioInteracting = false;

  function _cancelInteract() {
    _deprogramTarget = null;
    _deprogramTimer  = 0;
    _neutralizeTarget = null;
    _neutralizeTimer  = 0;
    _radioInteracting = false;
    _armoryAction     = null;
    _armoryInteractTimer = 0;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHECK MISSION COMPLETE                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkMissionComplete() {
    if (_missionEnd) return;
    /* Pacifist option: all evidence + all poison + authorities called */
    var allEvidence = (_evidenceCount >= _evidenceTotal);
    var allPoison   = (_barrelsNeutralized >= 3);
    if (allEvidence && allPoison && _authoritiesCalled) {
      _endMission(true, _pacifist);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  END MISSION                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _endMission(success, wasPacifist) {
    _missionEnd    = true;
    _missionSuccess = success;
    var bonus = 0;
    if (success && wasPacifist) {
      bonus = 3000;
      _addScore(bonus);
    }

    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:' + (success ? '#44FF88' : '#FF4444'),
      'font-family:monospace', 'font-size:26px',
      'padding:28px 48px',
      'border:2px solid ' + (success ? '#44FF88' : '#FF4444'),
      'border-radius:8px', 'z-index:99999', 'text-align:center'
    ].join(';');
    if (success) {
      el.innerHTML = 'MISSION COMPLETE' +
        (wasPacifist ? '<br><span style="font-size:17px;color:#FFFF44">PACIFIST BONUS +3000</span>' : '') +
        '<br><span style="font-size:15px">RESCUED: ' + _rescuedCount +
        '/8 | EVIDENCE: ' + _evidenceCount + '/5</span>';
    } else {
      el.innerHTML = 'MISSION FAILED<br><span style="font-size:15px">Mass casualty event</span>';
    }
    document.body.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INPUT HANDLERS                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    var k = e.code || e.key;
    _keys[k] = true;

    /* Activation: C+C both within 400ms */
    if (k === 'KeyC' || k === 'c' || k === 'C') {
      var now = performance.now();
      if (now - _c1PressTime < 400 && _c1PressTime > 0) {
        if (!_active) {
          _activate();
        }
        _c1PressTime = 0;
      } else {
        _c1PressTime = now;
      }
      return;
    }

    if (!_active) return;
  }

  function _onKeyUp(e) {
    var k = e.code || e.key;
    _keys[k] = false;

    if (!_active) return;

    /* E key released cancels active interaction */
    if (k === 'KeyE' || k === 'e') {
      _cancelInteract();
    }
  }

  function _onMouseMove(e) {
    if (!_active) return;
    _mouseX += e.movementX * 0.002;
    _mouseY += e.movementY * 0.002;
    _mouseY = Math.max(-0.7, Math.min(0.7, _mouseY));
    _yaw    = -_mouseX;
    _pitch  = -_mouseY;
  }

  function _onClick() {
    if (!_active || _missionEnd) return;
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
    _buildEvidenceBoxes();
    _buildPoisonBarrels();
    _buildCultists();
    _buildHostages();
    _buildPlayer();
    _buildHUD();

    if (_canvas) {
      var fn = _canvas.requestPointerLock || _canvas.mozRequestPointerLock;
      if (fn) fn.call(_canvas);
    }

    _killFeed('CULT COMPOUND ACTIVATED — Infiltrate and complete objectives');
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE PLAYER                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updatePlayer(dt) {
    if (!_player || !_playerPos) return;
    var speed = 5;
    var fwd   = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    var right = new THREE.Vector3(1, 0,  0).applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);

    if (_keys['KeyW'] || _keys['w'] || _keys['ArrowUp'])    _playerPos.addScaledVector(fwd,   speed * dt);
    if (_keys['KeyS'] || _keys['s'] || _keys['ArrowDown'])  _playerPos.addScaledVector(fwd,  -speed * dt);
    if (_keys['KeyA'] || _keys['a'] || _keys['ArrowLeft'])  _playerPos.addScaledVector(right, -speed * dt);
    if (_keys['KeyD'] || _keys['d'] || _keys['ArrowRight']) _playerPos.addScaledVector(right,  speed * dt);

    _player.position.copy(_playerPos);
    _player.rotation.y = _yaw;

    var cam = _getCamera();
    if (cam) {
      var offset = new THREE.Vector3(0, 5, 8);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
      cam.position.copy(_playerPos).add(offset);
      cam.rotation.order = 'YXZ';
      cam.rotation.y = _yaw;
      cam.rotation.x = _pitch;
    }

    /* E key — held for interact */
    var eDown = !!(_keys['KeyE'] || _keys['e']);
    if (eDown && !_prevEKey) {
      _tryStartInteract();
    }
    _prevEKey = eDown;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE CULTISTS AI                                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateCultists(dt) {
    for (var i = 0; i < _cultists.length; i++) {
      var c = _cultists[i];
      if (!c.alive) continue;

      var cp = c.mesh.position;

      if (c.fleeing && c.fleeDir) {
        /* Peaceful fleeing cultist runs away */
        cp.x += c.fleeDir.x * 4 * dt;
        cp.z += c.fleeDir.z * 4 * dt;
        continue;
      }

      if (c.alertState && _playerPos) {
        /* Chase player */
        var dx = _playerPos.x - cp.x;
        var dz = _playerPos.z - cp.z;
        var dl = Math.sqrt(dx * dx + dz * dz);
        if (dl > 1.5) {
          var chaseSpeed = c.isLeader ? 2.5 : (c.isGuard ? 4 : 2.5);
          cp.x += (dx / dl) * chaseSpeed * dt;
          cp.z += (dz / dl) * chaseSpeed * dt;
          c.mesh.rotation.y = Math.atan2(dx, dz);
        }
        /* Shoot if guard or has improvised weapon and within range */
        if ((c.isGuard || c.isLeader || c.hasImprovisedWeapon) && dl < 18) {
          c.fireTimer -= dt;
          if (c.fireTimer <= 0) {
            var fireFrom = cp.clone();
            fireFrom.y += 1.2;
            _fireEnemyBullet(fireFrom);
            c.fireTimer = c.isLeader ? 0.8 : (1.2 + Math.random() * 1.5);
          }
        }
        /* Alert nearby peaceful cultists (guard spots player) */
        if (c.isGuard && !_alarmActive) {
          _triggerAlarm();
        }
      } else if (!c.isGuard && !c.isLeader) {
        /* Peaceful patrol */
        cp.x += c.patrolDir * 0.6 * dt;
        if (Math.abs(cp.x - c.startX) > 4) {
          c.patrolDir *= -1;
        }
      } else {
        /* Guard patrol */
        cp.x += c.patrolDir * 1.2 * dt;
        if (Math.abs(cp.x - c.startX) > 6) {
          c.patrolDir *= -1;
        }
        /* Guards detect player within 10u */
        if (_playerPos && _dist2(cp, _playerPos) < 10) {
          c.alertState = true;
          _triggerAlarm();
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE HOSTAGES                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateHostages(dt) {
    for (var i = 0; i < _hostages.length; i++) {
      var h = _hostages[i];
      if (!h.deprogrammed) continue;
      if (!h.fleeing) {
        /* Start fleeing after deprogramming */
        h.fleeing = true;
        h.fleeAngle = Math.random() * Math.PI * 2;
      }
      /* Flee toward compound edge */
      h.mesh.position.x += Math.cos(h.fleeAngle) * 5 * dt;
      h.mesh.position.z += Math.sin(h.fleeAngle) * 5 * dt;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE DEPROGRAMMING                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateDeprogramming(dt) {
    if (!_deprogramTarget) return;

    /* If E not held, cancel */
    var eDown = !!(_keys['KeyE'] || _keys['e']);
    if (!eDown) {
      _deprogramTarget = null;
      _deprogramTimer  = 0;
      return;
    }

    /* Check player is still close enough */
    if (!_playerPos || _dist(_playerPos, _deprogramTarget.mesh.position) > 3) {
      _deprogramTarget = null;
      _deprogramTimer  = 0;
      return;
    }

    _deprogramTimer += dt;

    /* Check if spotted by guards */
    if (_alarmActive) {
      /* Alert interrupts deprogramming but doesn't cancel progress */
      /* Guards won't auto-stop it in this implementation */
    }

    if (_deprogramTimer >= 8) {
      _deprogramTarget.deprogrammed = true;
      _rescuedCount++;
      _killFeed('Cultist deprogrammed! (' + _rescuedCount + '/8) — fleeing compound');
      _addScore(150);
      _deprogramTarget = null;
      _deprogramTimer  = 0;
      _checkMissionComplete();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE NEUTRALIZE POISON                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateNeutralize(dt) {
    if (!_neutralizeTarget) return;

    var eDown = !!(_keys['KeyE'] || _keys['e']);
    if (!eDown) {
      _neutralizeTarget = null;
      _neutralizeTimer  = 0;
      return;
    }

    if (!_playerPos || _dist(_playerPos, _neutralizeTarget.mesh.position) > 2.5) {
      _neutralizeTarget = null;
      _neutralizeTimer  = 0;
      return;
    }

    _neutralizeTimer += dt;
    if (_neutralizeTimer >= 5) {
      _neutralizeTarget.neutralized = true;
      _neutralizeTarget.mesh.material.color.setHex(0x886666);
      _barrelsNeutralized++;
      _killFeed('Poison barrel neutralized! (' + _barrelsNeutralized + '/3)');
      _addScore(300);
      _neutralizeTarget = null;
      _neutralizeTimer  = 0;
      _checkMissionComplete();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE ARMORY                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateArmory(dt) {
    if (!_armoryAction || !_weaponsCache) return;

    var eDown = !!(_keys['KeyE'] || _keys['e']);
    if (!eDown) {
      _armoryAction = null;
      _armoryInteractTimer = 0;
      return;
    }

    if (!_playerPos || _dist(_playerPos, _weaponsCache.position) > 4) {
      _armoryAction = null;
      _armoryInteractTimer = 0;
      return;
    }

    _armoryInteractTimer += dt;
    var duration = (_armoryAction === 'destroy') ? 3 : 6;

    if (_armoryInteractTimer >= duration) {
      if (_armoryAction === 'destroy') {
        /* Destroying alerts everyone */
        _weaponsCache.material.color.setHex(0xFF4400);
        _weaponsCache.visible = false;
        _triggerAlarm();
        _killFeed('Armory DESTROYED — Resupply prevented! (Everyone alerted)');
        _addScore(400);
      } else {
        /* Securing lets authorities track */
        _weaponsCache.material.color.setHex(0x334433);
        _killFeed('Armory SECURED — Authorities notified for tracking');
        _addScore(250);
      }
      _armoryAction = null;
      _armoryInteractTimer = 0;
      _weaponsCache = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE RADIO                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateRadio(dt) {
    if (!_radioInteracting || _authoritiesCalled) return;

    var eDown = !!(_keys['KeyE'] || _keys['e']);
    if (!eDown) {
      _radioInteracting = false;
      _radioInteractTimer = 0;
      return;
    }

    if (!_radioMesh || !_playerPos || _dist(_playerPos, _radioMesh.position) > 2.5) {
      _radioInteracting = false;
      _radioInteractTimer = 0;
      return;
    }

    _radioInteractTimer += dt;
    if (_radioInteractTimer >= 6) {
      _authoritiesCalled = true;
      _radioInteracting  = false;
      _radioInteractTimer = 0;
      if (_radioMesh) _radioMesh.material.color.setHex(0x44FF44);
      _killFeed('AUTHORITIES CALLED — Evidence package transmitted!');
      _addScore(500);
      _checkMissionComplete();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE BULLETS                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateBullets(dt) {
    var sc = _getScene();
    var i;

    /* Player bullets */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      pb.mesh.position.addScaledVector(pb.vel, dt);
      pb.life -= dt;
      if (pb.life <= 0) {
        sc.remove(pb.mesh);
        _playerBullets.splice(i, 1);
      }
    }

    /* Enemy bullets */
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      var eb = _enemyBullets[i];
      eb.mesh.position.addScaledVector(eb.vel, dt);
      eb.life -= dt;
      if (eb.life <= 0) {
        sc.remove(eb.mesh);
        _enemyBullets.splice(i, 1);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  COLLISION                                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkCollisions() {
    var sc = _getScene();
    var i, j;

    /* Player bullets vs cultists */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      var hit = false;
      for (j = 0; j < _cultists.length; j++) {
        var c = _cultists[j];
        if (!c.alive) continue;
        if (_dist(pb.mesh.position, c.mesh.position) < 1.2) {
          c.hp -= c.isLeader ? 15 : 30;
          if (c.hp <= 0) {
            c.alive = false;
            sc.remove(c.mesh);
            _addScore(c.isLeader ? 0 : 50); /* no score for killing leader here — tracked separately */
            if (c.isLeader) {
              _cultLeaderAlive = false;
              _cultLeaderStatus = 'NEUTRALIZED';
              _killFeed('CULT LEADER NEUTRALIZED');
              _addScore(500);
            }
          }
          if (!_alarmActive) { _triggerAlarm(); }
          hit = true;
          break;
        }
      }
      if (hit) {
        sc.remove(pb.mesh);
        _playerBullets.splice(i, 1);
        continue;
      }
      /* Bullets vs hostages — don't collide (avoid friendly fire) */
    }

    /* Enemy bullets vs player */
    if (_playerPos) {
      for (i = _enemyBullets.length - 1; i >= 0; i--) {
        var eb = _enemyBullets[i];
        if (_dist(eb.mesh.position, _playerPos) < 0.8) {
          _playerHP -= 8;
          sc.remove(eb.mesh);
          _enemyBullets.splice(i, 1);
          if (_playerHP <= 0 && !_missionEnd) {
            _endMission(false, false);
          }
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE (main game loop)                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _update(dt) {
    if (!_active || _missionEnd) return;
    _gameTime += dt;
    _fireTimer = Math.max(0, _fireTimer - dt);

    /* Poison countdown */
    if (_barrelsNeutralized < 3) {
      _poisonTimer -= dt;
      if (_poisonTimer <= 0) {
        /* Mass casualty event */
        _killFeed('MASS CASUALTY EVENT — Cultists drank the compound!');
        _endMission(false, false);
        return;
      }
    }

    /* Alarm light pulse */
    if (_alarmActive && _alarmLight) {
      _alarmLight.intensity = 2.5 + Math.sin(_gameTime * 6) * 1.5;
    }

    _updatePlayer(dt);
    _updateCultists(dt);
    _updateHostages(dt);
    _updateDeprogramming(dt);
    _updateNeutralize(dt);
    _updateArmory(dt);
    _updateRadio(dt);
    _updateBullets(dt);
    _checkCollisions();
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  RESET                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _reset() {
    _active            = false;
    _missionEnd        = false;
    _missionSuccess    = false;
    _alarmActive       = false;
    _gameTime          = 0;
    _poisonTimer       = 360;
    _pacifist          = true;
    _shotFired         = false;
    _cultLeaderAlive   = true;
    _cultLeaderStatus  = 'AT LARGE';
    _rescuedCount      = 0;
    _evidenceCount     = 0;
    _barrelsNeutralized = 0;
    _armoryAction      = null;
    _armoryInteractTimer = 0;
    _authoritiesCalled = false;
    _radioInteracting  = false;
    _radioInteractTimer = 0;
    _deprogramTarget   = null;
    _deprogramTimer    = 0;
    _neutralizeTarget  = null;
    _neutralizeTimer   = 0;
    _playerHP          = 100;
    _yaw               = 0;
    _pitch             = 0;
    _mouseX            = 0;
    _mouseY            = 0;
    _fireTimer         = 0;
    _prevEKey          = false;
    _prevCKey          = false;
    _c1PressTime       = 0;

    var sc = _getScene();

    if (_compoundGroup && sc) sc.remove(_compoundGroup);
    if (_player && sc) sc.remove(_player);
    for (var i = 0; i < _playerBullets.length; i++) {
      if (_playerBullets[i].mesh && sc) sc.remove(_playerBullets[i].mesh);
    }
    for (var j = 0; j < _enemyBullets.length; j++) {
      if (_enemyBullets[j].mesh && sc) sc.remove(_enemyBullets[j].mesh);
    }

    _compoundGroup     = null;
    _fenceLines        = null;
    _guardPosts        = [];
    _alarmLight        = null;
    _cultists          = [];
    _hostages          = [];
    _evidenceBoxes     = [];
    _poisonBarrels     = [];
    _weaponsCache      = null;
    _financialRecord   = null;
    _radioMesh         = null;
    _cultLeaderMesh    = null;
    _player            = null;
    _playerPos         = null;
    _playerBullets     = [];
    _enemyBullets      = [];

    _removeHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PUBLIC API                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function init(scene, camera, canvas) {
    _scene  = scene  || null;
    _camera = camera || null;
    _canvas = canvas || null;

    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('click',     _onClick);
  }

  function update(dt) {
    _update(dt || 0.016);
  }

  function reset() {
    _reset();
  }

  return { init: init, update: update, reset: reset };

}());
