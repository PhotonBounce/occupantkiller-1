window.JungleCombat = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── State ──────────────────────────────────────────────────────────────────
  var _active = false;
  var _scene, _camera, _renderer, _container;
  var _keys = {};
  var _jTime = 0, _cTime = 0;
  var _gameOver = false, _gameWin = false;
  var _elapsed = 0;
  var _timeLimit = 600; // 10 minutes

  // Player
  var _player = { x: 0, y: 1, z: 0, hp: 100, yaw: 0, pitch: 0, crawling: false };
  var _velocity = { x: 0, z: 0 };
  var _onGround = true;

  // Squad
  var _squadDefs = [
    { role: 'medic',   color: 0x22aa22, x: -2, z:  2 },
    { role: 'demo',    color: 0xdddd22, x:  2, z:  2 },
    { role: 'scout',   color: 0x888888, x: -2, z: -2 },
    { role: 'sniper',  color: 0x115511, x:  2, z: -2 }
  ];
  var _squad = [];
  var _squadMode = 'attack'; // attack | defend | stealth | fallback

  // POWs
  var _pows = [];
  var _powsFreed = 0;

  // Enemies
  var _enemies = [];
  var _commanderAlive = true;

  // Objects
  var _trees = [];
  var _tripwires = [];
  var _tunnels = [];
  var _cages = [];
  var _mortarActive = true;
  var _mortarTimer = 0;
  var _mortarShell = null;
  var _mortarMesh = null;
  var _extractionLZ = null;
  var _flareSignaled = false;
  var _riverBox = null;

  // Interaction
  var _eHoldTime = 0;
  var _eTarget = null; // 'cage' | 'mortar'
  var _eTargetIndex = -1;
  var _flareCooldown = 0;

  // HUD
  var _hudEl = null;
  var _overlayEl = null;

  // Mouse look
  var _mouseActive = false;
  var _mouseDX = 0, _mouseDY = 0;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.wire) params.wireframe = true;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function _box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, _makeMat(color));
    return mesh;
  }

  function _sphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mesh = new THREE.Mesh(geo, _makeMat(color));
    return mesh;
  }

  function _cone(r, h, color) {
    var geo = new THREE.ConeGeometry(r, h, 6);
    var mesh = new THREE.Mesh(geo, _makeMat(color));
    return mesh;
  }

  function _cyl(rt, rb, h, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 6);
    var mesh = new THREE.Mesh(geo, _makeMat(color));
    return mesh;
  }

  function _lineSegs(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _makeCageLines(cx, cy, cz, w, h, d) {
    var hw = w / 2, hh = h / 2, hd = d / 2;
    var pts = [
      // bottom
      { x: cx - hw, y: cy - hh, z: cz - hd }, { x: cx + hw, y: cy - hh, z: cz - hd },
      { x: cx + hw, y: cy - hh, z: cz - hd }, { x: cx + hw, y: cy - hh, z: cz + hd },
      { x: cx + hw, y: cy - hh, z: cz + hd }, { x: cx - hw, y: cy - hh, z: cz + hd },
      { x: cx - hw, y: cy - hh, z: cz + hd }, { x: cx - hw, y: cy - hh, z: cz - hd },
      // top
      { x: cx - hw, y: cy + hh, z: cz - hd }, { x: cx + hw, y: cy + hh, z: cz - hd },
      { x: cx + hw, y: cy + hh, z: cz - hd }, { x: cx + hw, y: cy + hh, z: cz + hd },
      { x: cx + hw, y: cy + hh, z: cz + hd }, { x: cx - hw, y: cy + hh, z: cz + hd },
      { x: cx - hw, y: cy + hh, z: cz + hd }, { x: cx - hw, y: cy + hh, z: cz - hd },
      // verticals
      { x: cx - hw, y: cy - hh, z: cz - hd }, { x: cx - hw, y: cy + hh, z: cz - hd },
      { x: cx + hw, y: cy - hh, z: cz - hd }, { x: cx + hw, y: cy + hh, z: cz - hd },
      { x: cx + hw, y: cy - hh, z: cz + hd }, { x: cx + hw, y: cy + hh, z: cz + hd },
      { x: cx - hw, y: cy - hh, z: cz + hd }, { x: cx - hw, y: cy + hh, z: cz + hd },
      // inner bars front face
      { x: cx - hw, y: cy - hh * 0.3, z: cz - hd }, { x: cx + hw, y: cy - hh * 0.3, z: cz - hd },
      { x: cx - hw, y: cy + hh * 0.3, z: cz - hd }, { x: cx + hw, y: cy + hh * 0.3, z: cz - hd }
    ];
    return _lineSegs(pts, 0x886633);
  }

  function _makeTripwire(x1, z1, x2, z2, y) {
    var pts = [
      { x: x1, y: y,      z: z1 }, { x: x2, y: y,      z: z2 },
      { x: x1, y: y - 0.3, z: z1 }, { x: x1, y: y, z: z1 },
      { x: x2, y: y - 0.3, z: z2 }, { x: x2, y: y, z: z2 }
    ];
    return _lineSegs(pts, 0xffaa00);
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _randInt(min, max) {
    return Math.floor(_rand(min, max + 1));
  }

  // ── Build Scene ────────────────────────────────────────────────────────────
  function _buildScene() {
    // Ground
    var ground = _box(200, 0.2, 200, 0x336622);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    // River
    _riverBox = _box(200, 0.15, 6, 0x224488);
    _riverBox.position.set(0, 0.02, -20);
    _scene.add(_riverBox);

    // River crossing planks
    for (var p = 0; p < 3; p++) {
      var plank = _box(1.5, 0.2, 6.5, 0x886644);
      plank.position.set(-10 + p * 10, 0.12, -20);
      _scene.add(plank);
    }

    // 80 Trees
    var treePositions = [];
    for (var t = 0; t < 80; t++) {
      var tx, tz, tries = 0;
      do {
        tx = _rand(-80, 80);
        tz = _rand(-80, 60);
        tries++;
      } while (
        tries < 30 && (
          (Math.abs(tx) < 20 && tz > 30) || // camp area clear
          _dist2D(tx, tz, 0, 0) < 5          // player start clear
        )
      );

      var trunkH = _rand(3, 6);
      var trunk = _cyl(0.2, 0.3, trunkH, 0x225511);
      trunk.position.set(tx, trunkH / 2, tz);
      _scene.add(trunk);

      var foliageH = _rand(4, 7);
      var foliage = _cone(_rand(2, 3.5), foliageH, 0x226622);
      foliage.position.set(tx, trunkH + foliageH / 2 - 0.5, tz);
      _scene.add(foliage);

      treePositions.push({ x: tx, z: tz });
      _trees.push({ x: tx, z: tz, r: 0.5 });
    }

    _buildCamp();
    _buildTunnels();
    _buildTripwires();
    _buildExtractionLZ();
    _buildSquad();
    _buildEnemies();
  }

  function _buildCamp() {
    var cx = 0, cz = 50; // camp center

    // Palisade walls (BoxGeometry posts around perimeter)
    var palisadeW = 40, palisadeD = 30;
    var postSpacing = 2;
    // North/South walls
    for (var px = -palisadeW / 2; px <= palisadeW / 2; px += postSpacing) {
      var pn = _box(0.6, 4, 0.6, 0x886644);
      pn.position.set(cx + px, 2, cz - palisadeD / 2);
      _scene.add(pn);
      var ps = _box(0.6, 4, 0.6, 0x886644);
      ps.position.set(cx + px, 2, cz + palisadeD / 2);
      _scene.add(ps);
    }
    // East/West walls
    for (var pz = -palisadeD / 2; pz <= palisadeD / 2; pz += postSpacing) {
      var pe = _box(0.6, 4, 0.6, 0x886644);
      pe.position.set(cx + palisadeW / 2, 2, cz + pz);
      _scene.add(pe);
      var pw = _box(0.6, 4, 0.6, 0x886644);
      pw.position.set(cx - palisadeW / 2, 2, cz + pz);
      _scene.add(pw);
    }

    // Gate opening (south wall gap at cx)
    // already gapped by post spacing; just mark it

    // Guard towers (4 corners)
    var corners = [
      [-palisadeW / 2, -palisadeD / 2],
      [ palisadeW / 2, -palisadeD / 2],
      [-palisadeW / 2,  palisadeD / 2],
      [ palisadeW / 2,  palisadeD / 2]
    ];
    for (var c = 0; c < corners.length; c++) {
      var tower = _box(3, 6, 3, 0x775533);
      tower.position.set(cx + corners[c][0], 3, cz + corners[c][1]);
      _scene.add(tower);
      var platform = _box(4, 0.3, 4, 0x664422);
      platform.position.set(cx + corners[c][0], 6.15, cz + corners[c][1]);
      _scene.add(platform);
    }

    // Barracks (2 buildings)
    var b1 = _box(12, 3, 6, 0x775533);
    b1.position.set(cx - 8, 1.5, cz - 5);
    _scene.add(b1);
    var b2 = _box(12, 3, 6, 0x775533);
    b2.position.set(cx + 8, 1.5, cz - 5);
    _scene.add(b2);

    // Command hut (15×4×10)
    var cmdHut = _box(15, 4, 10, 0x664433);
    cmdHut.position.set(cx, 2, cz + 8);
    _scene.add(cmdHut);

    // Mortar emplacement
    _mortarMesh = _cyl(0.4, 0.6, 1.5, 0x444444);
    _mortarMesh.position.set(cx + 15, 0.75, cz - 10);
    _scene.add(_mortarMesh);
    var mortarBase = _box(2, 0.3, 2, 0x333333);
    mortarBase.position.set(cx + 15, 0.15, cz - 10);
    _scene.add(mortarBase);

    // POW cages (LineSegments)
    var cagePositions = [
      { x: cx - 10, z: cz + 12 },
      { x: cx,      z: cz + 14 },
      { x: cx + 10, z: cz + 12 }
    ];
    for (var i = 0; i < 3; i++) {
      var cage = _makeCageLines(cagePositions[i].x, 1.2, cagePositions[i].z, 2.5, 2.4, 2.5);
      _scene.add(cage);

      var powMesh = _box(0.6, 1.5, 0.6, 0x8888aa);
      powMesh.position.set(cagePositions[i].x, 0.75, cagePositions[i].z);
      _scene.add(powMesh);

      _pows.push({
        x: cagePositions[i].x,
        z: cagePositions[i].z,
        freed: false,
        alive: true,
        mesh: powMesh,
        cage: cage
      });
      _cages.push({ x: cagePositions[i].x, z: cagePositions[i].z, index: i, opened: false });
    }
  }

  function _buildTunnels() {
    // Two hidden tunnel entrances
    var tunnelDefs = [
      { x: -30, z: 10, exitX: -18, exitZ: 45 },
      { x:  25, z:  5, exitX:  18, exitZ: 42 }
    ];
    for (var i = 0; i < tunnelDefs.length; i++) {
      var td = tunnelDefs[i];
      var entrance = _box(2, 1, 2, 0x554433);
      entrance.position.set(td.x, 0.5, td.z);
      _scene.add(entrance);
      var exitMesh = _box(2, 1, 2, 0x554433);
      exitMesh.position.set(td.exitX, 0.5, td.exitZ);
      _scene.add(exitMesh);

      var cover = _box(2.2, 0.2, 2.2, 0x446633);
      cover.position.set(td.x, 1.1, td.z);
      _scene.add(cover);

      _tunnels.push({
        ex: td.x, ez: td.z,
        ox: td.exitX, oz: td.exitZ,
        inUse: false
      });
    }
  }

  function _buildTripwires() {
    var wireDefs = [
      { x1: -15, z1: -5, x2:  -5, z2: -5, y: 0.25 },
      { x1:   5, z1: -5, x2:  15, z2: -5, y: 0.25 },
      { x1: -20, z1: 18, x2: -10, z2: 18, y: 0.25 },
      { x1:  10, z1: 18, x2:  20, z2: 18, y: 0.25 }
    ];
    for (var i = 0; i < wireDefs.length; i++) {
      var wd = wireDefs[i];
      var wire = _makeTripwire(wd.x1, wd.z1, wd.x2, wd.z2, wd.y);
      _scene.add(wire);
      _tripwires.push({
        x1: wd.x1, z1: wd.z1,
        x2: wd.x2, z2: wd.z2,
        y: wd.y, triggered: false,
        mesh: wire
      });
    }
  }

  function _buildExtractionLZ() {
    _extractionLZ = _box(12, 0.1, 12, 0x334433);
    _extractionLZ.position.set(0, 0.05, -60);
    _scene.add(_extractionLZ);

    // LZ marker lines (LineSegments X pattern)
    var lzPts = [
      { x: -5, y: 0.12, z: -65 }, { x: 5, y: 0.12, z: -55 },
      { x:  5, y: 0.12, z: -65 }, { x:-5, y: 0.12, z: -55 }
    ];
    var lzMark = _lineSegs(lzPts, 0xffff00);
    _scene.add(lzMark);
  }

  function _buildSquad() {
    for (var i = 0; i < _squadDefs.length; i++) {
      var sd = _squadDefs[i];
      var body = _box(0.6, 1.5, 0.4, sd.color);
      body.position.set(sd.x, 0.75, sd.z);
      _scene.add(body);

      var head = _sphere(0.25, sd.color);
      head.position.set(sd.x, 1.65, sd.z);
      _scene.add(head);

      _squad.push({
        role: sd.role,
        color: sd.color,
        x: sd.x, y: 0.75, z: sd.z,
        hp: 80,
        alive: true,
        body: body,
        head: head,
        patrolTimer: _rand(0, 3),
        targetX: sd.x,
        targetZ: sd.z
      });
    }
  }

  function _buildEnemies() {
    var campCX = 0, campCZ = 50;

    // 25 regular enemies with patrol routes
    var patrolRoutes = [
      [{ x: -15, z: 35 }, { x: 15, z: 35 }],
      [{ x: -15, z: 65 }, { x: 15, z: 65 }],
      [{ x: -18, z: 45 }, { x: -18, z: 55 }],
      [{ x:  18, z: 45 }, { x:  18, z: 55 }],
      [{ x:   0, z: 35 }, { x:   0, z: 40 }],
      [{ x: -10, z: 40 }, { x:  10, z: 40 }],
      [{ x: -5,  z: 60 }, { x:  5,  z: 60 }],
      [{ x: -12, z: 50 }, { x: -12, z: 58 }],
      [{ x:  12, z: 50 }, { x:  12, z: 58 }],
    ];

    for (var i = 0; i < 25; i++) {
      var route = patrolRoutes[i % patrolRoutes.length];
      var startPt = route[0];

      var body = _box(0.6, 1.5, 0.4, 0x554422);
      body.position.set(startPt.x + _rand(-3, 3), 0.75, startPt.z + _rand(-3, 3));
      _scene.add(body);

      var head = _sphere(0.25, 0x886655);
      head.position.set(body.position.x, 2.15, body.position.z);
      _scene.add(head);

      _enemies.push({
        x: body.position.x,
        z: body.position.z,
        hp: 75,
        alive: true,
        body: body,
        head: head,
        isCommander: false,
        patrol: route,
        patrolIndex: 0,
        patrolTimer: 0,
        alertTimer: 0,
        alert: false,
        shootTimer: _rand(1, 3)
      });
    }

    // Camp commander inside command hut
    var cmdBody = _box(0.7, 1.6, 0.5, 0x885533);
    cmdBody.position.set(campCX, 0.8, campCZ + 8);
    _scene.add(cmdBody);

    var cmdHead = _sphere(0.3, 0xaa7755);
    cmdHead.position.set(campCX, 2.2, campCZ + 8);
    _scene.add(cmdHead);

    _enemies.push({
      x: campCX, z: campCZ + 8,
      hp: 350,
      alive: true,
      body: cmdBody,
      head: cmdHead,
      isCommander: true,
      patrol: [{ x: campCX - 3, z: campCZ + 6 }, { x: campCX + 3, z: campCZ + 10 }],
      patrolIndex: 0,
      patrolTimer: 0,
      alertTimer: 0,
      alert: false,
      shootTimer: 2
    });
  }

  // ── Lighting ───────────────────────────────────────────────────────────────
  function _buildLights() {
    var ambient = new THREE.AmbientLight(0x334422, 0.7);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xddcc88, 0.9);
    sun.position.set(30, 60, -20);
    _scene.add(sun);
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'jc-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.75)',
      'color:#88ff88',
      'font:bold 13px monospace',
      'padding:6px 14px',
      'border:1px solid #226622',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:0.05em'
    ].join(';');
    document.body.appendChild(_hudEl);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'jc-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.7)',
      'color:#88ff88',
      'font:bold 28px monospace',
      'z-index:10000',
      'flex-direction:column',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_overlayEl);

    // Crosshair
    var ch = document.createElement('div');
    ch.id = 'jc-crosshair';
    ch.style.cssText = [
      'position:fixed',
      'top:50%','left:50%',
      'transform:translate(-50%,-50%)',
      'color:#88ff88',
      'font:20px monospace',
      'pointer-events:none',
      'z-index:9998'
    ].join(';');
    ch.textContent = '+';
    document.body.appendChild(ch);

    // Controls hint
    var hint = document.createElement('div');
    hint.id = 'jc-hint';
    hint.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:10px',
      'background:rgba(0,20,0,0.75)',
      'color:#66cc66',
      'font:11px monospace',
      'padding:6px 10px',
      'border:1px solid #226622',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'line-height:1.6'
    ].join(';');
    hint.innerHTML = [
      'WASD: Move | Mouse: Look | C: Crouch | E(hold): Interact',
      'F: Signal Flare | F1:Attack F2:Defend F3:Stealth F4:Fallback',
      'Click canvas to lock mouse | ESC: unlock'
    ].join('<br>');
    document.body.appendChild(hint);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var aliveSquad = 0;
    for (var i = 0; i < _squad.length; i++) {
      if (_squad[i].alive) aliveSquad++;
    }
    var aliveEnemies = 0;
    for (var j = 0; j < _enemies.length; j++) {
      if (_enemies[j].alive && !_enemies[j].isCommander) aliveEnemies++;
    }
    var mins = Math.floor(_elapsed / 60);
    var secs = Math.floor(_elapsed % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var remaining = Math.max(0, _timeLimit - _elapsed);
    var rmins = Math.floor(remaining / 60);
    var rsecs = Math.floor(remaining % 60);
    var remStr = (rmins < 10 ? '0' : '') + rmins + ':' + (rsecs < 10 ? '0' : '') + rsecs;

    _hudEl.textContent = [
      'JUNGLE COMBAT',
      '[POWs: ' + _powsFreed + '/3 FREED]',
      '[SQUAD: ' + aliveSquad + '/4 ALIVE]',
      '[COMMANDER: ' + (_commanderAlive ? 'ALIVE' : 'DEAD') + ']',
      '[MORTAR: ' + (_mortarActive ? 'ACTIVE' : 'DISABLED') + ']',
      '[TIMER: ' + remStr + ']',
      '[ENEMIES: ' + aliveEnemies + ']',
      '[HP: ' + Math.max(0, _player.hp) + ']',
      '[MODE: ' + _squadMode.toUpperCase() + ']'
    ].join('  ');
  }

  function _showOverlay(msg) {
    if (!_overlayEl) return;
    _overlayEl.innerHTML = msg + '<br><br><span style="font-size:16px;color:#aaffaa">Press R to restart</span>';
    _overlayEl.style.display = 'flex';
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (!_active) return;
    _keys[e.code] = true;

    var now = performance.now();
    if (e.code === 'KeyJ') _jTime = now;
    if (e.code === 'KeyC') {
      _cTime = now;
      if (now - _jTime < 400 && !_active) {
        // activation handled in init
      }
    }

    if (e.code === 'F1') { e.preventDefault(); _squadMode = 'attack'; }
    if (e.code === 'F2') { e.preventDefault(); _squadMode = 'defend'; }
    if (e.code === 'F3') { e.preventDefault(); _squadMode = 'stealth'; }
    if (e.code === 'F4') { e.preventDefault(); _squadMode = 'fallback'; }

    if (e.code === 'KeyF' && _flareCooldown <= 0 && !_gameOver && !_gameWin) {
      _signalFlare();
    }

    if (e.code === 'KeyR' && (_gameOver || _gameWin)) {
      _reset();
    }

    if (e.code === 'KeyC') {
      _player.crawling = !_player.crawling;
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseMove(e) {
    if (!_active || !_mouseActive) return;
    _mouseDX += e.movementX || 0;
    _mouseDY += e.movementY || 0;
  }

  function _onPointerLock() {
    _mouseActive = (document.pointerLockElement === _renderer.domElement ||
                    document.pointerLockElement === _container);
  }

  function _signalFlare() {
    _flareSignaled = true;
    _flareCooldown = 5;
    // Spawn a brief visual sphere for flare
    var flare = _sphere(0.3, 0xff4400);
    flare.position.set(_player.x, _player.y + 5, _player.z);
    _scene.add(flare);
    setTimeout(function () { _scene.remove(flare); }, 3000);
  }

  // ── Update helpers ─────────────────────────────────────────────────────────
  function _movePlayer(dt) {
    var speed = _player.crawling ? 2 : 5;
    var cos = Math.cos(_player.yaw);
    var sin = Math.sin(_player.yaw);

    var mx = 0, mz = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    { mx -= sin; mz -= cos; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { mx += sin; mz += cos; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { mx -= cos; mz += sin; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { mx += cos; mz -= sin; }

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }

    _player.x += mx * speed * dt;
    _player.z += mz * speed * dt;

    // Clamp to world
    _player.x = Math.max(-95, Math.min(95, _player.x));
    _player.z = Math.max(-95, Math.min(95, _player.z));

    // Mouse look
    var sensitivity = 0.002;
    _player.yaw -= _mouseDX * sensitivity;
    _player.pitch -= _mouseDY * sensitivity;
    _player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _player.pitch));
    _mouseDX = 0;
    _mouseDY = 0;

    // Player height
    var targetY = _player.crawling ? 0.4 : 1.0;
    _player.y += (targetY - _player.y) * 10 * dt;
  }

  function _updateCamera() {
    _camera.position.set(_player.x, _player.y + 0.6, _player.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _player.yaw;
    _camera.rotation.x = _player.pitch;
  }

  function _checkTripwires() {
    for (var i = 0; i < _tripwires.length; i++) {
      var tw = _tripwires[i];
      if (tw.triggered) continue;

      // Check player
      var px = _player.x, pz = _player.z;
      // Segment crossing check (simplified bounding box)
      var minX = Math.min(tw.x1, tw.x2) - 0.3;
      var maxX = Math.max(tw.x1, tw.x2) + 0.3;
      var minZ = Math.min(tw.z1, tw.z2) - 0.3;
      var maxZ = Math.max(tw.z1, tw.z2) + 0.3;

      if (px > minX && px < maxX && pz > minZ && pz < maxZ) {
        tw.triggered = true;
        _player.hp -= 20;
        _scene.remove(tw.mesh);
        // Mortar-style explosion visual
        var boom = _sphere(1.5, 0xff6600);
        boom.position.set((tw.x1 + tw.x2) / 2, 1, (tw.z1 + tw.z2) / 2);
        _scene.add(boom);
        setTimeout(function () { _scene.remove(boom); }, 400);
        continue;
      }

      // Check squad (only triggers if not stealth)
      if (_squadMode !== 'stealth') {
        for (var s = 0; s < _squad.length; s++) {
          var sm = _squad[s];
          if (!sm.alive) continue;
          if (sm.x > minX && sm.x < maxX && sm.z > minZ && sm.z < maxZ) {
            tw.triggered = true;
            sm.hp -= 20;
            if (sm.hp <= 0) _killSquadMember(s);
            _scene.remove(tw.mesh);
            break;
          }
        }
      }
    }
  }

  function _checkTunnels(dt) {
    for (var i = 0; i < _tunnels.length; i++) {
      var tn = _tunnels[i];
      if (_dist2D(_player.x, _player.z, tn.ex, tn.ez) < 1.5 && _keys['KeyE'] && _player.crawling) {
        // Teleport to exit
        _player.x = tn.ox;
        _player.z = tn.oz;
        return;
      }
    }
  }

  function _checkInteraction(dt) {
    var interacting = _keys['KeyE'];
    _eTarget = null;
    _eTargetIndex = -1;

    if (interacting) {
      // Check cages
      for (var i = 0; i < _cages.length; i++) {
        var cage = _cages[i];
        if (cage.opened) continue;
        if (_dist2D(_player.x, _player.z, cage.x, cage.z) < 3) {
          _eTarget = 'cage';
          _eTargetIndex = i;
          break;
        }
      }
      // Check mortar
      if (!_eTarget && _mortarActive) {
        if (_dist2D(_player.x, _player.z, 15, 40) < 3) {
          _eTarget = 'mortar';
        }
      }

      if (_eTarget) {
        _eHoldTime += dt;
        var required = (_eTarget === 'mortar') ? 5 : 3;
        if (_eHoldTime >= required) {
          if (_eTarget === 'cage') {
            _freePOW(_eTargetIndex);
          } else if (_eTarget === 'mortar') {
            _disableMortar();
          }
          _eHoldTime = 0;
        }
      } else {
        _eHoldTime = 0;
      }
    } else {
      _eHoldTime = 0;
    }
  }

  function _freePOW(index) {
    var cage = _cages[index];
    if (cage.opened) return;
    cage.opened = true;
    _powsFreed++;
    _pows[index].freed = true;
    // Move POW mesh out to follow player loosely
    _pows[index].mesh.position.set(_player.x + _rand(-1.5, 1.5), 0.75, _player.z + 1.5);
  }

  function _disableMortar() {
    _mortarActive = false;
    if (_mortarMesh) {
      _mortarMesh.material.color.setHex(0x222222);
    }
  }

  function _updateMortar(dt) {
    if (!_mortarActive) return;
    _mortarTimer += dt;
    if (_mortarTimer >= 30) {
      _mortarTimer = 0;
      _fireMortar();
    }

    // Animate shell
    if (_mortarShell) {
      _mortarShell._t += dt;
      var t = _mortarShell._t;
      var dur = 2.5;
      if (t < dur) {
        var frac = t / dur;
        _mortarShell.position.x = _mortarShell._sx + (_mortarShell._tx - _mortarShell._sx) * frac;
        _mortarShell.position.z = _mortarShell._sz + (_mortarShell._tz - _mortarShell._sz) * frac;
        _mortarShell.position.y = 4 * frac * (1 - frac) * 20 + 0.5;
      } else {
        // Impact
        var impX = _mortarShell._tx, impZ = _mortarShell._tz;
        _scene.remove(_mortarShell);
        _mortarShell = null;
        // Damage player if close
        if (_dist2D(_player.x, _player.z, impX, impZ) < 4) {
          _player.hp -= 30;
        }
        // Damage squad
        for (var s = 0; s < _squad.length; s++) {
          if (!_squad[s].alive) continue;
          if (_dist2D(_squad[s].x, _squad[s].z, impX, impZ) < 4) {
            _squad[s].hp -= 25;
            if (_squad[s].hp <= 0) _killSquadMember(s);
          }
        }
        // Visual
        var boom = _sphere(2, 0xff4400);
        boom.position.set(impX, 1, impZ);
        _scene.add(boom);
        setTimeout(function () { _scene.remove(boom); }, 600);
      }
    }
  }

  function _fireMortar() {
    if (_mortarShell) _scene.remove(_mortarShell);
    _mortarShell = _sphere(0.3, 0x888888);
    _mortarShell._t = 0;
    _mortarShell._sx = 15;
    _mortarShell._sz = 40;
    // Target player or squad
    _mortarShell._tx = _player.x + _rand(-3, 3);
    _mortarShell._tz = _player.z + _rand(-3, 3);
    _mortarShell.position.set(15, 0.75, 40);
    _scene.add(_mortarShell);
  }

  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;

      // Patrol
      var tgt = en.patrol[en.patrolIndex];
      var distToTgt = _dist2D(en.x, en.z, tgt.x, tgt.z);
      if (distToTgt < 1) {
        en.patrolIndex = (en.patrolIndex + 1) % en.patrol.length;
        en.patrolTimer = _rand(1, 3);
      }
      if (en.patrolTimer > 0) {
        en.patrolTimer -= dt;
      } else {
        var speed = en.isCommander ? 1.5 : 2.5;
        var dx = tgt.x - en.x, dz = tgt.z - en.z;
        var dlen = Math.sqrt(dx * dx + dz * dz);
        if (dlen > 0) {
          en.x += (dx / dlen) * speed * dt;
          en.z += (dz / dlen) * speed * dt;
        }
      }

      // Alert detection
      var distToPlayer = _dist2D(en.x, en.z, _player.x, _player.z);
      var detectRange = (_squadMode === 'stealth') ? 8 : 15;
      if (distToPlayer < detectRange) {
        en.alert = true;
        en.alertTimer = 5;
      }
      if (en.alertTimer > 0) {
        en.alertTimer -= dt;
        if (en.alertTimer <= 0) en.alert = false;
      }

      // Chase & shoot when alert
      if (en.alert) {
        var chaseSpeed = en.isCommander ? 2 : 3;
        var cdx = _player.x - en.x, cdz = _player.z - en.z;
        var clen = Math.sqrt(cdx * cdx + cdz * cdz);
        if (clen > 3) {
          en.x += (cdx / clen) * chaseSpeed * dt;
          en.z += (cdz / clen) * chaseSpeed * dt;
        }

        en.shootTimer -= dt;
        if (en.shootTimer <= 0) {
          en.shootTimer = en.isCommander ? 1.5 : 2.5 + _rand(0, 1.5);
          if (distToPlayer < 20) {
            var dmg = en.isCommander ? 20 : 8;
            _player.hp -= dmg;
            // Also possibly hit squad
            for (var s = 0; s < _squad.length; s++) {
              if (!_squad[s].alive) continue;
              if (_dist2D(en.x, en.z, _squad[s].x, _squad[s].z) < 12 && Math.random() < 0.2) {
                _squad[s].hp -= 10;
                if (_squad[s].hp <= 0) _killSquadMember(s);
              }
            }
          }
        }
      }

      // Update mesh positions
      en.body.position.set(en.x, 0.75, en.z);
      en.head.position.set(en.x, 2.15, en.z);

      // Player shooting (click detection via shoot action)
      if (_keys['Mouse0'] || _keys['Space']) {
        if (distToPlayer < 25 && Math.random() < 0.05) {
          var shootDmg = 15;
          // Sniper bonus if squad in attack mode
          if (_squadMode === 'attack') shootDmg = 20;
          en.hp -= shootDmg;
          // Squad also shoots if in attack mode
          if (_squadMode === 'attack') {
            for (var sa = 0; sa < _squad.length; sa++) {
              if (!_squad[sa].alive) continue;
              if (_dist2D(_squad[sa].x, _squad[sa].z, en.x, en.z) < 20) {
                en.hp -= 10;
              }
            }
          }
          if (en.hp <= 0) {
            _killEnemy(i);
          }
        }
      }
    }
  }

  function _killEnemy(index) {
    var en = _enemies[index];
    en.alive = false;
    en.body.visible = false;
    en.head.visible = false;
    if (en.isCommander) {
      _commanderAlive = false;
    }
  }

  function _killSquadMember(index) {
    var sm = _squad[index];
    sm.alive = false;
    sm.hp = 0;
    sm.body.material.color.setHex(0x333333);
    sm.head.material.color.setHex(0x333333);
  }

  function _updateSquad(dt) {
    var aliveCount = 0;
    for (var i = 0; i < _squad.length; i++) {
      if (_squad[i].alive) aliveCount++;
    }

    for (var i = 0; i < _squad.length; i++) {
      var sm = _squad[i];
      if (!sm.alive) continue;

      var formationOffsets = [
        { x: -2, z: 2 }, { x: 2, z: 2 },
        { x: -3, z: 4 }, { x: 3, z: 4 }
      ];

      var tgtX, tgtZ;
      if (_squadMode === 'attack') {
        // Follow player closely
        tgtX = _player.x + formationOffsets[i].x;
        tgtZ = _player.z + formationOffsets[i].z;
      } else if (_squadMode === 'defend') {
        // Hold position in a spread formation
        tgtX = sm.x + (Math.random() - 0.5) * 0.1;
        tgtZ = sm.z + (Math.random() - 0.5) * 0.1;
      } else if (_squadMode === 'stealth') {
        // Follow single-file, slower
        tgtX = _player.x + Math.sin(_player.yaw + Math.PI) * (i + 1) * 1.5;
        tgtZ = _player.z + Math.cos(_player.yaw + Math.PI) * (i + 1) * 1.5;
      } else { // fallback
        tgtX = _player.x + formationOffsets[i].x * 3;
        tgtZ = _player.z + formationOffsets[i].z + 8;
      }

      var dx = tgtX - sm.x, dz = tgtZ - sm.z;
      var spd = (_squadMode === 'stealth') ? 3 : 5;
      var dlen = Math.sqrt(dx * dx + dz * dz);
      if (dlen > 0.5) {
        sm.x += (dx / dlen) * spd * dt;
        sm.z += (dz / dlen) * spd * dt;
      }

      // Medic heals nearby injured squad members
      if (sm.role === 'medic') {
        for (var j = 0; j < _squad.length; j++) {
          if (j === i || !_squad[j].alive) continue;
          if (_squad[j].hp < 80 && _dist2D(sm.x, sm.z, _squad[j].x, _squad[j].z) < 4) {
            _squad[j].hp = Math.min(80, _squad[j].hp + 5 * dt);
          }
        }
        // Heal player
        if (_player.hp < 100 && _dist2D(sm.x, sm.z, _player.x, _player.z) < 4) {
          _player.hp = Math.min(100, _player.hp + 3 * dt);
        }
      }

      sm.body.position.set(sm.x, 0.75, sm.z);
      sm.head.position.set(sm.x, 1.65, sm.z);
    }
  }

  function _checkWinLose() {
    if (_gameOver || _gameWin) return;

    // Timer expired
    if (_elapsed >= _timeLimit) {
      _gameOver = true;
      _showOverlay('MISSION FAILED\nTime expired!');
      return;
    }

    // Player dead
    if (_player.hp <= 0) {
      _player.hp = 0;
      // Check if all squad also dead
      var anySquadAlive = false;
      for (var i = 0; i < _squad.length; i++) {
        if (_squad[i].alive) { anySquadAlive = true; break; }
      }
      if (!anySquadAlive) {
        _gameOver = true;
        _showOverlay('MISSION FAILED\nAll forces eliminated!');
        return;
      }
    }

    // All POWs killed (if any squad/enemy damages them — treat as lose if can't be freed)
    // (In this implementation POWs just can't be freed if you die first)

    // Win condition: all 3 freed + at least 1 squad alive + reach LZ
    if (_powsFreed >= 3 && _flareSignaled) {
      var squadAlive = false;
      for (var j = 0; j < _squad.length; j++) {
        if (_squad[j].alive) { squadAlive = true; break; }
      }
      if (squadAlive && _dist2D(_player.x, _player.z, 0, -60) < 8) {
        _gameWin = true;
        _showOverlay('MISSION ACCOMPLISHED!\nAll POWs rescued!\nExfil successful!');
      }
    }
  }

  function _checkEInteraction() {
    // Show hint for nearby interactables
    // (handled in _checkInteraction)
  }

  // ── Main init/update/reset ─────────────────────────────────────────────────
  function init(container) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    _container = container || document.body;

    _scene = new THREE.Scene();
    _scene.fog = new THREE.Fog(0x336633, 5, 35);
    _scene.background = new THREE.Color(0x336633);

    _camera = new THREE.PerspectiveCamera(75, _container.clientWidth / _container.clientHeight || window.innerWidth / window.innerHeight, 0.1, 200);

    _renderer = new THREE.WebGLRenderer({ antialias: false });
    _renderer.setPixelRatio(window.devicePixelRatio || 1);
    _renderer.setSize(
      _container.clientWidth || window.innerWidth,
      _container.clientHeight || window.innerHeight
    );
    _container.appendChild(_renderer.domElement);

    // Pointer lock
    _renderer.domElement.addEventListener('click', function () {
      _renderer.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', _onPointerLock);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);

    // Mouse shoot
    document.addEventListener('mousedown', function (e) {
      if (e.button === 0) _keys['Mouse0'] = true;
    });
    document.addEventListener('mouseup', function (e) {
      if (e.button === 0) _keys['Mouse0'] = false;
    });

    // Resize
    window.addEventListener('resize', function () {
      var w = _container.clientWidth || window.innerWidth;
      var h = _container.clientHeight || window.innerHeight;
      _renderer.setSize(w, h);
      _camera.aspect = w / h;
      _camera.updateProjectionMatrix();
    });

    _buildLights();
    _buildScene();
    _buildHUD();

    _player.x = 0;
    _player.z = -10;

    _active = true;
    _elapsed = 0;
    _gameOver = false;
    _gameWin = false;
  }

  function update(dt) {
    if (!_active || _gameOver || _gameWin) return;

    _elapsed += dt;
    _flareCooldown -= dt;

    _movePlayer(dt);
    _updateCamera();
    _checkTripwires();
    _checkTunnels(dt);
    _checkInteraction(dt);
    _updateMortar(dt);
    _updateEnemies(dt);
    _updateSquad(dt);
    _checkWinLose();
    _updateHUD();

    _renderer.render(_scene, _camera);
  }

  function _reset() {
    // Remove meshes and DOM
    if (_renderer) {
      _renderer.domElement.parentNode && _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      _renderer.dispose();
      _renderer = null;
    }
    if (_hudEl) { _hudEl.parentNode && _hudEl.parentNode.removeChild(_hudEl); _hudEl = null; }
    if (_overlayEl) { _overlayEl.parentNode && _overlayEl.parentNode.removeChild(_overlayEl); _overlayEl = null; }
    var ch = document.getElementById('jc-crosshair');
    if (ch) ch.parentNode.removeChild(ch);
    var hint = document.getElementById('jc-hint');
    if (hint) hint.parentNode.removeChild(hint);

    document.removeEventListener('pointerlockchange', _onPointerLock);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);

    _keys = {};
    _squad = [];
    _enemies = [];
    _pows = [];
    _cages = [];
    _trees = [];
    _tripwires = [];
    _tunnels = [];
    _powsFreed = 0;
    _commanderAlive = true;
    _mortarActive = true;
    _mortarTimer = 0;
    _mortarShell = null;
    _mortarMesh = null;
    _flareSignaled = false;
    _flareCooldown = 0;
    _eHoldTime = 0;
    _elapsed = 0;
    _active = false;
    _gameOver = false;
    _gameWin = false;
    _squadMode = 'attack';
    _player = { x: 0, y: 1, z: 0, hp: 100, yaw: 0, pitch: 0, crawling: false };
    _mouseDX = 0;
    _mouseDY = 0;

    // Re-init
    init(_container);
  }

  function reset() {
    _reset();
  }

  // ── Activation: J+C within 400ms ──────────────────────────────────────────
  (function () {
    var _jT = 0, _cT = 0;
    function _activate() {
      if (_active) return;
      var gameContainer = document.createElement('div');
      gameContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9990;background:#000;';
      document.body.appendChild(gameContainer);
      init(gameContainer);
    }
    document.addEventListener('keydown', function (e) {
      var now = performance.now();
      if (e.code === 'KeyJ') _jT = now;
      if (e.code === 'KeyC') { _cT = now; if (_cT - _jT < 400) _activate(); }
    });
  })();

  return { init: init, update: update, reset: reset };
})();
