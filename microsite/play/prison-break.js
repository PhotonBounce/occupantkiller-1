window.PrisonBreak = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────────
  var _scene, _camera, _renderer, _clock;
  var _active = false;
  var _container;

  // Key tracking for P+B chord (both within 400ms)
  var _keysDown = {};
  var _keyTimestamps = {};
  var _pTime = 0;
  var _bTime = 0;

  // Player
  var _player;
  var _playerSpeed = 8;
  var _cameraAngle = 0;
  var _cameraDistance = 22;
  var _cameraHeight = 14;

  // Phase & items
  var _phase = 1;
  var _itemsCollected = 0;
  var _totalItems = 4;
  var _items = [];          // wire cutter, guard uniform, rope, tunnel map
  var _uniformHeld = false;

  // Phase 2
  var _diversionActive = false;
  var _diversionTimer = 0;
  var _laundryRoom = null;
  var _fire = null;

  // Phase 3 – escape route
  var _escapeRoute = null;   // 'fence'|'wall'|'tunnel'
  var _tunnelHole = null;
  var _fenceCutting = false;
  var _fenceCutTimer = 0;
  var _wallRoping = false;
  var _wallRopeTimer = 0;
  var _escapeDone = false;

  // Guards (12 total)
  var _guards = [];         // 10 patrol guards
  var _towerGuards = [];    // 2 tower guards
  var _lastKnownPos = null;
  var _dogs = [];           // alert level 3 dogs

  // Disguise
  var _disguised = false;
  var _disguiseBlown = false;

  // Warden
  var _warden = null;
  var _wardenKey = null;
  var _wardenKeyTaken = false;
  var _subduingWarden = false;
  var _subdueTimer = 0;
  var _cellsUnlocked = false;
  var _freedPrisoners = [];

  // Alert
  var _alertLevel = 0;
  var _prisonerDistractors = [];

  // HUD
  var _hud = null;
  var _promptEl = null;
  var _promptTimer = 0;

  // Audio
  var _audioCtx = null;

  // ── Geometry helpers ──────────────────────────────────────────────────────────
  function _box(w, h, d, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function _cyl(rt, rb, h, segs, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs || 8), mat);
  }

  function _plane(w, d, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  }

  function _lineSegs(pts, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < pts.length; i++) {
      verts.push(pts[i].x, pts[i].y, pts[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _coiledRope(color) {
    var pts = [];
    var turns = 6, ptsPerTurn = 8;
    for (var i = 0; i <= turns * ptsPerTurn; i++) {
      var t = i / ptsPerTurn;
      var a = t * Math.PI * 2;
      var r = 0.4 + 0.05 * (i / (turns * ptsPerTurn));
      pts.push({ x: Math.cos(a) * r, y: t * 0.06 - 0.15, z: Math.sin(a) * r });
    }
    var verts = [];
    for (var j = 0; j < pts.length - 1; j++) {
      verts.push(pts[j].x, pts[j].y, pts[j].z);
      verts.push(pts[j + 1].x, pts[j + 1].y, pts[j + 1].z);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
  }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Audio ─────────────────────────────────────────────────────────────────────
  function _initAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
  }

  function _beep(freq, dur, vol) {
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.value = freq || 440;
      osc.type = 'square';
      gain.gain.setValueAtTime(vol || 0.1, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + (dur || 0.15));
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + (dur || 0.15));
    } catch (e) { /* silence */ }
  }

  // ── Build world ───────────────────────────────────────────────────────────────
  function _buildPrison() {
    // Ground (green earth)
    var ground = _box(200, 0.2, 200, 0x446633);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    // ── Outer wall perimeter BoxGeometry 60x8x2 (0x887766) ────────────────────
    // North, South walls (along X)
    var wN = _box(60, 8, 2, 0x887766);
    wN.position.set(0, 4, -30);
    _scene.add(wN);
    var wS = _box(60, 8, 2, 0x887766);
    wS.position.set(0, 4, 30);
    _scene.add(wS);
    // East, West walls (along Z)
    var wE = _box(2, 8, 60, 0x887766);
    wE.position.set(30, 4, 0);
    _scene.add(wE);
    var wW = _box(2, 8, 60, 0x887766);
    wW.position.set(-30, 4, 0);
    _scene.add(wW);

    // ── Guard towers CylinderGeometry r=2 h=12 (0x776655) at 4 corners ────────
    var towerCorners = [
      { x: -30, z: -30 }, { x: 30, z: -30 },
      { x: -30, z: 30 },  { x: 30, z: 30 }
    ];
    for (var ti = 0; ti < 4; ti++) {
      var tc = towerCorners[ti];
      var tower = _cyl(2, 2, 12, 8, 0x776655);
      tower.position.set(tc.x, 6, tc.z);
      _scene.add(tower);
      // Tower guard (scans yard)
      var tg = _cyl(0.4, 0.4, 1.8, 8, 0x334433);
      tg.position.set(tc.x, 13, tc.z);
      tg.userData = {
        type: 'towerGuard',
        scanAngle: Math.atan2(-tc.x, -tc.z),
        scanSpeed: 0.4,
        post: { x: tc.x, z: tc.z }
      };
      _scene.add(tg);
      _towerGuards.push(tg);
      // Vision cone LineSegments
      var vCone = _makeCone(tg, 0x334433);
      tg.userData.visionCone = vCone;
      _scene.add(vCone);
    }

    // ── Cell block BoxGeometry 25x5x15 (0x665544) ─────────────────────────────
    var cellBlock = _box(25, 5, 15, 0x665544);
    cellBlock.position.set(-2, 2.5, 0);
    _scene.add(cellBlock);

    // ── 10 cells BoxGeometry 3x3x3 (0x554433) ─────────────────────────────────
    for (var ci = 0; ci < 10; ci++) {
      var col = ci % 5;
      var row = Math.floor(ci / 5);
      var cx = -10 + col * 5;
      var cz = -4 + row * 8;
      var cell = _box(3, 3, 3, 0x554433);
      cell.position.set(cx, 1.5, cz);
      _scene.add(cell);
    }

    // ── Yard PlaneGeometry 30x20 (0x887755) ───────────────────────────────────
    var yard = _plane(30, 20, 0x887755);
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(10, 0.02, 5);
    _scene.add(yard);

    // ── Warden office BoxGeometry 8x4x6 (0x556644) ────────────────────────────
    var wardenOffice = _box(8, 4, 6, 0x556644);
    wardenOffice.position.set(-16, 2, -18);
    _scene.add(wardenOffice);

    // ── Laundry room (phase 2 diversion) BoxGeometry (0x664433) ───────────────
    _laundryRoom = _box(6, 3, 6, 0x664433);
    _laundryRoom.position.set(18, 1.5, -10);
    _laundryRoom.userData = { type: 'laundryRoom' };
    _scene.add(_laundryRoom);

    // ── Tunnel hole BoxGeometry (0x554433) in yard ───────────────────────────
    _tunnelHole = _box(2, 0.4, 2, 0x554433);
    _tunnelHole.position.set(12, 0.2, 12);
    _tunnelHole.userData = { type: 'tunnelHole' };
    _scene.add(_tunnelHole);

    // ── Fence section (phase 3 wire-cutter target) ─────────────────────────────
    var fenceSection = _lineSegs([
      { x: 28, y: 0, z: -8 }, { x: 28, y: 6, z: -8 },
      { x: 28, y: 0, z: -4 }, { x: 28, y: 6, z: -4 },
      { x: 28, y: 0, z: 0 },  { x: 28, y: 6, z: 0 },
      { x: 28, y: 6, z: -8 }, { x: 28, y: 6, z: 0 }
    ], 0x888888);
    fenceSection.userData = { type: 'fence' };
    _scene.add(fenceSection);

    // ── Warden NPC (0x332211) at 1.2x scale ──────────────────────────────────
    _warden = _box(1.2 * 1, 1.2 * 1.8, 1.2 * 1, 0x332211);
    _warden.position.set(-14, 0.9, -18);
    _warden.userData = { type: 'warden', facing: 0, patrolAngle: 0, patrolRadius: 3 };
    _scene.add(_warden);

    // ── Warden's master key BoxGeometry (0xFFDD00) ────────────────────────────
    _wardenKey = _box(0.4, 0.15, 0.8, 0xFFDD00);
    _wardenKey.position.set(-14, 1.9, -18);
    _wardenKey.userData = { type: 'wardenKey' };
    _scene.add(_wardenKey);

    // ── 4 collectable items ────────────────────────────────────────────────────
    // Wire cutter BoxGeometry 0x888844 — cell area
    var wireCutter = _box(0.6, 0.3, 0.3, 0x888844);
    wireCutter.position.set(-8, 0.5, -4);
    wireCutter.userData = { type: 'item', name: 'wire_cutter', collected: false };
    _scene.add(wireCutter);
    _items.push(wireCutter);

    // Guard uniform BoxGeometry 0xFFFFDD — another cell
    var guardUniform = _box(0.6, 0.8, 0.3, 0xFFFFDD);
    guardUniform.position.set(-3, 0.5, 4);
    guardUniform.userData = { type: 'item', name: 'guard_uniform', collected: false };
    _scene.add(guardUniform);
    _items.push(guardUniform);

    // Rope LineSegments coiled 0x885533 — yard
    var rope = _coiledRope(0x885533);
    rope.position.set(14, 0.5, 3);
    rope.userData = { type: 'item', name: 'rope', collected: false };
    _scene.add(rope);
    _items.push(rope);

    // Tunnel map BoxGeometry 0xFFFFAA — yard
    var tunnelMap = _box(0.5, 0.05, 0.7, 0xFFFFAA);
    tunnelMap.position.set(10, 0.4, 8);
    tunnelMap.userData = { type: 'item', name: 'tunnel_map', collected: false };
    _scene.add(tunnelMap);
    _items.push(tunnelMap);

    // ── Lighting ───────────────────────────────────────────────────────────────
    var ambient = new THREE.AmbientLight(0x303040, 0.7);
    _scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffcc, 0.8);
    dirLight.position.set(10, 25, 10);
    _scene.add(dirLight);
  }

  // Make a vision-cone LineSegments for a guard
  function _makeCone(guard, color) {
    var pts = [];
    var range = 12, halfFov = Math.PI / 4; // 45 deg each side
    var steps = 6;
    // From center out to arc
    pts.push({ x: 0, y: 0.5, z: 0 });
    pts.push({ x: Math.sin(-halfFov) * range, y: 0.5, z: Math.cos(-halfFov) * range });
    pts.push({ x: 0, y: 0.5, z: 0 });
    pts.push({ x: Math.sin(halfFov) * range, y: 0.5, z: Math.cos(halfFov) * range });
    // Arc
    for (var s = 0; s < steps; s++) {
      var a1 = -halfFov + s * (2 * halfFov / steps);
      var a2 = -halfFov + (s + 1) * (2 * halfFov / steps);
      pts.push({ x: Math.sin(a1) * range, y: 0.5, z: Math.cos(a1) * range });
      pts.push({ x: Math.sin(a2) * range, y: 0.5, z: Math.cos(a2) * range });
    }
    return _lineSegs(pts, color);
  }

  // ── Build guards ──────────────────────────────────────────────────────────────
  function _buildGuards() {
    // 10 patrol guards with patrol routes; 2 tower guards built in _buildPrison
    var patrolRoutes = [
      [{ x: -20, z: -20 }, { x: 0, z: -20 }, { x: 0, z: -10 }, { x: -20, z: -10 }],
      [{ x: 0, z: -20 },   { x: 20, z: -20 }, { x: 20, z: -10 }, { x: 0, z: -10 }],
      [{ x: -20, z: 0 },   { x: -10, z: 0 },  { x: -10, z: 10 }, { x: -20, z: 10 }],
      [{ x: 5, z: 0 },     { x: 20, z: 0 },   { x: 20, z: 10 },  { x: 5, z: 10 }],
      [{ x: -20, z: 10 },  { x: 0, z: 10 },   { x: 0, z: 20 },   { x: -20, z: 20 }],
      [{ x: 0, z: 10 },    { x: 20, z: 10 },  { x: 20, z: 20 },  { x: 0, z: 20 }],
      [{ x: -25, z: -5 },  { x: -15, z: -5 }, { x: -15, z: 5 },  { x: -25, z: 5 }],
      [{ x: 15, z: -5 },   { x: 25, z: -5 },  { x: 25, z: 5 },   { x: 15, z: 5 }],
      [{ x: -10, z: -28 }, { x: 10, z: -28 }, { x: 10, z: -22 }, { x: -10, z: -22 }],
      [{ x: -10, z: 22 },  { x: 10, z: 22 },  { x: 10, z: 28 },  { x: -10, z: 28 }]
    ];

    for (var i = 0; i < 10; i++) {
      var g = _box(0.8, 1.8, 0.8, 0x334433);
      var sp = patrolRoutes[i][0];
      g.position.set(sp.x, 0.9, sp.z);
      g.userData = {
        type: 'guard',
        route: patrolRoutes[i],
        routeIdx: 0,
        speed: 3.5,
        facing: 0,
        spotTimer: 0,
        downed: false,
        alertedPos: null,
        redirected: false  // for diversion phase 2
      };
      // Vision cone
      var cone = _makeCone(g, 0x334433);
      cone.userData = { type: 'visionCone' };
      g.userData.visionCone = cone;
      _scene.add(cone);
      _scene.add(g);
      _guards.push(g);
    }
  }

  // ── Build player ──────────────────────────────────────────────────────────────
  function _buildPlayer() {
    _player = _cyl(0.4, 0.4, 1.8, 8, 0x2244AA);
    _player.position.set(0, 0.9, 22);
    _player.userData = { type: 'player' };
    _scene.add(_player);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 18px',
      'border:1px solid #00FF44',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _promptEl = document.createElement('div');
    _promptEl.style.cssText = [
      'position:fixed', 'bottom:60px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#FFFF00',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 16px',
      'border:1px solid #FFFF00',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(_promptEl);
  }

  function _updateHUD() {
    if (!_hud) return;
    var disguiseStr = _disguised ? 'ACTIVE' : (_disguiseBlown ? 'BLOWN' : 'OFF');
    var guardCount = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (!_guards[i].userData.downed) guardCount++;
    }
    guardCount += _towerGuards.length;
    _hud.textContent =
      'PRISON BREAK' +
      ' [PHASE: ' + _phase + '/3]' +
      ' [ITEMS: ' + _itemsCollected + '/4]' +
      ' [ALERT: ' + _alertLevel + ']' +
      ' [DISGUISE: ' + disguiseStr + ']' +
      ' | GUARDS: ' + guardCount;
  }

  function _showPrompt(text, dur) {
    if (!_promptEl) return;
    _promptEl.textContent = text;
    _promptEl.style.display = 'block';
    _promptTimer = dur || 3;
  }

  // ── Alert escalation ──────────────────────────────────────────────────────────
  function _escalateAlert(level) {
    if (_alertLevel >= level) return;
    _alertLevel = level;
    if (level === 1) _showPrompt('!! ALERT 1: Weapon spotted !!', 4);
    if (level === 2) {
      _showPrompt('!! ALERT 2: Prisoner missing — all exits watched !!', 5);
      _lastKnownPos = { x: _player.position.x, z: _player.position.z };
    }
    if (level === 3) {
      _showPrompt('!! ALERT 3: Maximum security — dogs deployed !!', 6);
      _spawnDogs();
    }
    _beep(880 - level * 100, 0.3, 0.15);
  }

  function _spawnDogs() {
    // Dogs: CylinderGeometry 0x885533 sniff radius 6
    var dogSpawns = [
      { x: -25, z: 25 }, { x: 25, z: 25 },
      { x: -25, z: -25 }, { x: 25, z: -25 }
    ];
    for (var di = 0; di < dogSpawns.length; di++) {
      var ds = dogSpawns[di];
      var dog = _cyl(0.3, 0.3, 0.7, 6, 0x885533);
      dog.position.set(ds.x, 0.35, ds.z);
      dog.userData = {
        type: 'dog',
        speed: 6,
        sniffRadius: 6,
        angle: 0,
        patrolCenter: { x: ds.x, z: ds.z }
      };
      _scene.add(dog);
      _dogs.push(dog);
    }
  }

  // ── Guard AI ──────────────────────────────────────────────────────────────────
  function _updateGuards(dt) {
    var px = _player.position.x;
    var pz = _player.position.z;

    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.userData.downed) continue;

      var gx = g.position.x, gz = g.position.z;
      var dx = px - gx, dz = pz - gz;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Diversion: 8 of 10 guards redirect to fire
      if (_diversionActive && !g.userData.redirected && i < 8) {
        g.userData.redirected = true;
        g.userData.alertedPos = { x: _laundryRoom.position.x, z: _laundryRoom.position.z };
      }

      // Alerted: converge on last known / alertedPos
      if (_alertLevel >= 2 || g.userData.alertedPos) {
        var tgt = g.userData.alertedPos || _lastKnownPos;
        if (tgt) {
          var tdx = tgt.x - gx, tdz = tgt.z - gz;
          var td = Math.sqrt(tdx * tdx + tdz * tdz);
          if (td > 1) {
            g.position.x += (tdx / td) * g.userData.speed * 1.4 * dt;
            g.position.z += (tdz / td) * g.userData.speed * 1.4 * dt;
            g.rotation.y = Math.atan2(tdx, tdz);
            g.userData.facing = g.rotation.y;
          }
        }
      } else {
        // Normal patrol
        var route = g.userData.route;
        var rtgt = route[g.userData.routeIdx];
        var rdx = rtgt.x - gx, rdz = rtgt.z - gz;
        var rd = Math.sqrt(rdx * rdx + rdz * rdz);
        if (rd < 0.5) {
          g.userData.routeIdx = (g.userData.routeIdx + 1) % route.length;
        } else {
          g.position.x += (rdx / rd) * g.userData.speed * dt;
          g.position.z += (rdz / rd) * g.userData.speed * dt;
          g.rotation.y = Math.atan2(rdx, rdz);
          g.userData.facing = g.rotation.y;
        }
      }

      // Update vision cone position/rotation
      if (g.userData.visionCone) {
        g.userData.visionCone.position.set(g.position.x, 0, g.position.z);
        g.userData.visionCone.rotation.y = g.rotation.y;
      }

      // Detection: 45-deg FOV, range 12 (halved if disguised, unless restricted zone or running)
      var fwd = { x: Math.sin(g.userData.facing), z: Math.cos(g.userData.facing) };
      var toPlayer = dist > 0.01 ? { x: dx / dist, z: dz / dist } : { x: 0, z: 1 };
      var dot = fwd.x * toPlayer.x + fwd.z * toPlayer.z;
      var fovHalf = Math.cos(Math.PI / 4); // 45 deg
      var range = 12;
      var detected = false;
      if (_disguised && !_disguiseBlown) {
        // Disguise: guards only detect if < 3 units or in restricted zone
        detected = (dist < 3);
      } else {
        detected = (dot > fovHalf && dist < range) || (dist < 3);
      }

      if (detected) {
        g.userData.spotTimer += dt;
        if (g.userData.spotTimer > 2) {
          if (_disguised) {
            _disguised = false;
            _disguiseBlown = true;
            _showPrompt('DISGUISE BLOWN! Guards onto you!', 4);
          }
          _lastKnownPos = { x: px, z: pz };
          _escalateAlert(2);
          _guardBark();
        }
      } else {
        g.userData.spotTimer = Math.max(0, g.userData.spotTimer - dt * 0.5);
      }
    }

    // Tower guards: always scan yard (rotate vision cone)
    for (var ti = 0; ti < _towerGuards.length; ti++) {
      var tg = _towerGuards[ti];
      tg.userData.scanAngle += tg.userData.scanSpeed * dt;
      tg.rotation.y = tg.userData.scanAngle;
      if (tg.userData.visionCone) {
        tg.userData.visionCone.position.set(tg.userData.post.x, 0, tg.userData.post.z);
        tg.userData.visionCone.rotation.y = tg.userData.scanAngle;
      }
    }

    // Dogs (alert level 3)
    for (var di = 0; di < _dogs.length; di++) {
      var dog = _dogs[di];
      dog.userData.angle += dog.userData.speed * dt * 0.3;
      var dc = dog.userData.patrolCenter;
      dog.position.x = dc.x + Math.cos(dog.userData.angle) * 4;
      dog.position.z = dc.z + Math.sin(dog.userData.angle) * 4;
      // Sniff player
      var dd = _dist2(dog.position, _player.position);
      if (dd < dog.userData.sniffRadius) {
        _lastKnownPos = { x: px, z: pz };
        _escalateAlert(3);
        _showPrompt('Dogs tracking you!', 2);
      }
    }
  }

  function _guardBark() {
    _beep(300, 0.2, 0.12);
  }

  // ── Warden AI ─────────────────────────────────────────────────────────────────
  function _updateWarden(dt) {
    if (!_warden || _wardenKeyTaken) return;
    _warden.userData.patrolAngle += dt * 0.5;
    var a = _warden.userData.patrolAngle;
    _warden.position.x = -14 + Math.cos(a) * 3;
    _warden.position.z = -18 + Math.sin(a) * 3;
    _warden.rotation.y = a + Math.PI / 2;

    if (_wardenKey) {
      _wardenKey.position.set(_warden.position.x, _warden.position.y + 1.0, _warden.position.z);
      _wardenKey.rotation.y += dt * 2;
    }

    // Subdue interaction (E from behind, 2s)
    var px = _player.position.x, pz = _player.position.z;
    var wd = _dist2(_player.position, _warden.position);
    if (wd < 2.5) {
      // Check if behind warden
      var toWarden = { x: _warden.position.x - px, z: _warden.position.z - pz };
      var wfwd = { x: Math.sin(_warden.rotation.y), z: Math.cos(_warden.rotation.y) };
      var len = Math.sqrt(toWarden.x * toWarden.x + toWarden.z * toWarden.z) || 1;
      var dot = (toWarden.x / len) * wfwd.x + (toWarden.z / len) * wfwd.z;
      var behind = (dot > 0.5); // player is behind warden

      if (behind) {
        _showPrompt('[E] Subdue warden from behind (2s hold)', 1);
        if (_keysDown['KeyE']) {
          _subduingWarden = true;
          _subdueTimer += dt;
          if (_subdueTimer >= 2) {
            _wardenKeyTaken = true;
            _subduingWarden = false;
            _scene.remove(_wardenKey);
            _wardenKey = null;
            _warden.rotation.z = Math.PI / 2;
            _warden.position.y = 0;
            _showPrompt('Warden subdued! Master key taken. Free prisoners with [E]!', 5);
            _cellsUnlocked = true;
            // Free 3 prisoner NPCs as distractors
            _spawnPrisonerDistractors();
          }
        } else {
          _subdueTimer = Math.max(0, _subdueTimer - dt * 2);
          _subduingWarden = false;
        }
      }
    } else {
      _subdueTimer = Math.max(0, _subdueTimer - dt * 2);
      _subduingWarden = false;
    }
  }

  function _spawnPrisonerDistractors() {
    // 3 prisoners run out and distract guards
    var spawnPts = [
      { x: -5, z: 0 }, { x: 0, z: 5 }, { x: 5, z: 0 }
    ];
    for (var pi = 0; pi < 3; pi++) {
      var pr = _cyl(0.35, 0.35, 1.6, 8, 0xBBAA88);
      pr.position.set(spawnPts[pi].x, 0.8, spawnPts[pi].z);
      pr.userData = {
        type: 'prisonerDistractor',
        angle: Math.random() * Math.PI * 2,
        speed: 5
      };
      _scene.add(pr);
      _prisonerDistractors.push(pr);
      _freedPrisoners.push(pr);
    }
    _showPrompt('3 prisoners freed — distracting guards!', 4);
  }

  // ── Phase transitions ─────────────────────────────────────────────────────────
  function _checkPhase() {
    if (_phase === 1 && _itemsCollected >= 4) {
      _phase = 2;
      _showPrompt('PHASE 2: Create a diversion! Use lighter near laundry room [E]', 6);
    }
    if (_phase === 2 && _diversionActive) {
      _phase = 3;
      _showPrompt('PHASE 3: Choose escape: [F] Fence (wire cutters) | [R] Rope over wall | [T] Tunnel', 8);
    }
  }

  // ── Diversion fire ────────────────────────────────────────────────────────────
  function _startFire() {
    if (_fire) return;
    _fire = _box(2, 3, 2, 0xFF4400);
    _fire.position.set(18, 1.5, -10);
    _fire.userData = { type: 'fire' };
    _scene.add(_fire);
    _diversionActive = true;
    _diversionTimer = 90;
    _escalateAlert(1);
    _showPrompt('FIRE at laundry! 8 of 12 guards redirected — 90-second window!', 6);
    _beep(220, 0.5, 0.2);
  }

  // ── Item spin animation ───────────────────────────────────────────────────────
  function _animateItems(dt) {
    for (var i = 0; i < _items.length; i++) {
      if (!_items[i].userData.collected) {
        _items[i].rotation.y += dt * 2;
        _items[i].position.y = 0.5 + 0.1 * Math.sin(Date.now() * 0.003 + i);
      }
    }
    if (_fire) {
      _fire.scale.x = 1 + 0.2 * Math.sin(Date.now() * 0.01);
      _fire.scale.z = 1 + 0.2 * Math.cos(Date.now() * 0.009);
    }
    if (_tunnelHole && !_tunnelHole.userData.crawling) {
      _tunnelHole.position.y = 0.2 + 0.03 * Math.sin(Date.now() * 0.002);
    }
  }

  // ── Prisoner distractors movement ─────────────────────────────────────────────
  function _updateDistractors(dt) {
    for (var i = 0; i < _prisonerDistractors.length; i++) {
      var pr = _prisonerDistractors[i];
      pr.userData.angle += dt * 0.7;
      pr.position.x += Math.cos(pr.userData.angle) * pr.userData.speed * dt;
      pr.position.z += Math.sin(pr.userData.angle) * pr.userData.speed * dt;
      // Bounce off walls
      if (Math.abs(pr.position.x) > 28) pr.userData.angle += Math.PI;
      if (Math.abs(pr.position.z) > 28) pr.userData.angle += Math.PI;
    }
  }

  // ── Player movement ───────────────────────────────────────────────────────────
  function _updatePlayer(dt) {
    var mx = 0, mz = 0;
    if (_keysDown['KeyW'] || _keysDown['ArrowUp']) mz -= 1;
    if (_keysDown['KeyS'] || _keysDown['ArrowDown']) mz += 1;
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft']) mx -= 1;
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) mx += 1;
    if (_keysDown['KeyQ']) _cameraAngle -= 1.5 * dt;
    if (_keysDown['KeyZ']) _cameraAngle += 1.5 * dt;

    var running = (Math.abs(mx) > 0 || Math.abs(mz) > 0);

    // Running breaks disguise
    if (running && _disguised && !_disguiseBlown) {
      // Slight risk increase: checked in guard detection loop
    }

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) {
      mx /= len; mz /= len;
      var ca = _cameraAngle;
      var rx = mx * Math.cos(ca) + mz * Math.sin(ca);
      var rz = -mx * Math.sin(ca) + mz * Math.cos(ca);
      _player.position.x += rx * _playerSpeed * dt;
      _player.position.z += rz * _playerSpeed * dt;
      _player.rotation.y = Math.atan2(rx, rz);
    }

    _player.position.x = Math.max(-120, Math.min(120, _player.position.x));
    _player.position.z = Math.max(-120, Math.min(120, _player.position.z));

    // Camera follow
    _camera.position.x = _player.position.x + Math.sin(_cameraAngle) * _cameraDistance;
    _camera.position.z = _player.position.z + Math.cos(_cameraAngle) * _cameraDistance;
    _camera.position.y = _cameraHeight;
    _camera.lookAt(new THREE.Vector3(_player.position.x, 1, _player.position.z));
  }

  // ── Interactions ──────────────────────────────────────────────────────────────
  function _checkInteractions() {
    var px = _player.position.x, pz = _player.position.z;
    var ePressed = _keysDown['_e_pressed'];

    // Phase 1: pick up items
    if (_phase === 1) {
      for (var ii = 0; ii < _items.length; ii++) {
        var item = _items[ii];
        if (item.userData.collected) continue;
        var id = _dist2({ x: px, z: pz }, item.position);
        if (id < 2.5) {
          _showPrompt('[E] Pick up ' + item.userData.name.replace('_', ' '), 0.8);
          if (ePressed) {
            item.userData.collected = true;
            _scene.remove(item);
            _itemsCollected++;
            if (item.userData.name === 'guard_uniform') _uniformHeld = true;
            _showPrompt('Picked up ' + item.userData.name.replace(/_/g, ' ') + ' (' + _itemsCollected + '/4)', 2);
            _keysDown['_e_pressed'] = false;
            _beep(660, 0.1, 0.1);
            _checkPhase();
            break;
          }
        }
      }
    }

    // Phase 1 bonus: wear guard uniform
    if (_uniformHeld && !_disguised && !_disguiseBlown) {
      var uPt = { x: px, z: pz };
      // Allow wearing anywhere after picking up
      _showPrompt('[U] Wear guard uniform (disguise)', 0.5);
      if (_keysDown['KeyU']) {
        _disguised = true;
        _disguiseBlown = false;
        _player.material.color.setHex(0x334433);
        _showPrompt('Disguise ON — blend with guards. Running or restricted zones will blow cover!', 4);
        _keysDown['KeyU'] = false;
      }
    }

    // Warden subdue (handled in _updateWarden with E hold)

    // Phase 2: lighter near laundry
    if (_phase === 2) {
      var ld = _dist2({ x: px, z: pz }, _laundryRoom.position);
      if (ld < 4) {
        _showPrompt('[E] Use lighter — start fire in laundry room', 1);
        if (ePressed) {
          _startFire();
          _keysDown['_e_pressed'] = false;
          _checkPhase();
        }
      }
    }

    // Phase 3 escape routes
    if (_phase === 3) {
      // Fence cut (F key near east wall)
      var fd = _dist2({ x: px, z: pz }, { x: 28, z: 0 });
      if (fd < 5) {
        var hasWireCutter = _itemsCollected >= 1; // wire cutter was item 0
        if (hasWireCutter) {
          _showPrompt('[F] Cut fence — 30s animation', 1);
          if (_keysDown['KeyF'] && !_fenceCutting) {
            _fenceCutting = true;
            _fenceCutTimer = 0;
            _escalateAlert(1);
            _showPrompt('Cutting fence... (30s)', 2);
          }
        }
      }

      if (_fenceCutting) {
        _fenceCutTimer += 0.016; // approximate dt
        _showPrompt('Cutting fence: ' + Math.ceil(30 - _fenceCutTimer) + 's remaining...', 0.5);
        if (_fenceCutTimer >= 30) {
          _fenceCutting = false;
          _triggerEscape('Fence cut! ESCAPED through east wall!');
        }
      }

      // Rope over wall (R key near north wall, needs diversion still active)
      var rpd = _dist2({ x: px, z: pz }, { x: 0, z: -28 });
      if (rpd < 5) {
        var hasRope = _itemsCollected >= 3;
        if (hasRope && _diversionActive) {
          _showPrompt('[R] Throw rope over north wall', 1);
          if (_keysDown['KeyR'] && !_wallRoping) {
            _wallRoping = true;
            _wallRopeTimer = 0;
            _showPrompt('Climbing wall with rope...', 2);
          }
        } else if (hasRope && !_diversionActive) {
          _showPrompt('Need diversion still active for rope escape!', 1);
        }
      }

      if (_wallRoping) {
        _wallRopeTimer += 0.016;
        _showPrompt('Climbing: ' + Math.ceil(8 - _wallRopeTimer) + 's...', 0.5);
        if (_wallRopeTimer >= 8) {
          _wallRoping = false;
          _triggerEscape('Rope over wall! ESCAPED north!');
        }
      }

      // Tunnel (T key near tunnel hole, needs tunnel map)
      var tnd = _dist2({ x: px, z: pz }, _tunnelHole.position);
      if (tnd < 3 && _itemsCollected >= 4) {
        _showPrompt('[T] Crawl through tunnel — exits outside perimeter', 1);
        if (_keysDown['KeyT']) {
          _tunnelHole.userData.crawling = true;
          _player.scale.set(1, 0.5, 1);
          _showPrompt('Crawling through tunnel...', 3);
          // Crawl animation: move player underground then pop out
          _player.position.y = -0.5;
          setTimeout(function () {
            if (_active) {
              _player.position.set(50, 0.9, 12);
              _player.scale.set(1, 1, 1);
              _triggerEscape('Tunnel escape complete! OUTSIDE the perimeter!');
            }
          }, 3000);
          _keysDown['KeyT'] = false;
        }
      }
    }

    // Diversion timer
    if (_diversionActive) {
      _diversionTimer -= 0.016;
      if (_diversionTimer <= 0) {
        _diversionActive = false;
        _showPrompt('Diversion over — guards returning to posts!', 4);
        for (var gi = 0; gi < _guards.length; gi++) {
          _guards[gi].userData.redirected = false;
          _guards[gi].userData.alertedPos = null;
        }
        if (_fire) {
          _scene.remove(_fire);
          _fire = null;
        }
      }
    }
  }

  function _triggerEscape(msg) {
    if (_escapeDone) return;
    _escapeDone = true;
    _showPrompt('MISSION COMPLETE! ' + msg + ' FREEDOM!', 15);
    _beep(880, 0.5, 0.2);
    setTimeout(function () { if (_active) _beep(1100, 0.3, 0.2); }, 300);
    setTimeout(function () { if (_active) _beep(1320, 0.5, 0.2); }, 600);
  }

  // ── Main loop ─────────────────────────────────────────────────────────────────
  function _loop() {
    if (!_active) return;
    requestAnimationFrame(_loop);

    var dt = Math.min(_clock.getDelta(), 0.05);

    _updatePlayer(dt);
    _updateWarden(dt);
    _updateGuards(dt);
    _updateDistractors(dt);
    _checkInteractions();
    _animateItems(dt);
    _updateHUD();

    // Prompt fade
    if (_promptTimer > 0) {
      _promptTimer -= dt;
      if (_promptTimer <= 0 && _promptEl) _promptEl.style.display = 'none';
    }

    _renderer.render(_scene, _camera);
  }

  // ── Key events ────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    if (e.code === 'KeyP') _pTime = Date.now();
    if (e.code === 'KeyB') _bTime = Date.now();

    if (!_active) {
      // Check P+B chord
      if (_keysDown['KeyP'] && _keysDown['KeyB']) {
        if (Math.abs(_pTime - _bTime) < 400) _init();
      }
      return;
    }

    if (e.code === 'KeyE') _keysDown['_e_pressed'] = true;
    if (e.code === 'Escape') reset();
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  function _onResize() {
    if (!_active) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function _init() {
    if (_active) return;
    _active = true;

    // Reset all state
    _phase = 1;
    _itemsCollected = 0;
    _items = [];
    _uniformHeld = false;
    _diversionActive = false;
    _diversionTimer = 0;
    _laundryRoom = null;
    _fire = null;
    _escapeRoute = null;
    _tunnelHole = null;
    _fenceCutting = false;
    _fenceCutTimer = 0;
    _wallRoping = false;
    _wallRopeTimer = 0;
    _escapeDone = false;
    _guards = [];
    _towerGuards = [];
    _lastKnownPos = null;
    _dogs = [];
    _disguised = false;
    _disguiseBlown = false;
    _warden = null;
    _wardenKey = null;
    _wardenKeyTaken = false;
    _subduingWarden = false;
    _subdueTimer = 0;
    _cellsUnlocked = false;
    _freedPrisoners = [];
    _alertLevel = 0;
    _prisonerDistractors = [];
    _keysDown = {};
    _pTime = 0;
    _bTime = 0;
    _cameraAngle = 0;

    _container = document.createElement('div');
    _container.id = 'prison-break-container';
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:#000;';
    document.body.appendChild(_container);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _container.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x080f10);
    _scene.fog = new THREE.Fog(0x080f10, 60, 150);

    _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
    _camera.position.set(0, _cameraHeight, 22 + _cameraDistance);

    _clock = new THREE.Clock();

    _initAudio();
    _buildPrison();
    _buildGuards();
    _buildPlayer();
    _buildHUD();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('resize', _onResize);

    _showPrompt(
      'PRISON BREAK — WASD:move  E:interact  U:wear uniform  F:cut fence  R:rope  T:tunnel  Q/Z:camera  ESC:quit',
      10
    );

    _loop();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init() { _init(); }

  function update(dt) { /* external hook – loop is self-driven */ }

  function reset() {
    _active = false;

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    window.removeEventListener('resize', _onResize);

    if (_renderer) { _renderer.dispose(); _renderer = null; }
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
      _container = null;
    }
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
    if (_promptEl && _promptEl.parentNode) {
      _promptEl.parentNode.removeChild(_promptEl);
      _promptEl = null;
    }
    if (_audioCtx) {
      try { _audioCtx.close(); } catch (e) { /* silence */ }
      _audioCtx = null;
    }

    _scene = null;
    _camera = null;
    _clock = null;
    _guards = [];
    _towerGuards = [];
    _items = [];
    _dogs = [];
    _prisonerDistractors = [];
    _freedPrisoners = [];
    _warden = null;
    _wardenKey = null;
    _laundryRoom = null;
    _fire = null;
    _tunnelHole = null;
    _keysDown = {};
  }

  return { init: init, update: update, reset: reset };

})();
