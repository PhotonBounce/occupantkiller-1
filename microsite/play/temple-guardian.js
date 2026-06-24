/* ───────────────────────────────────────────────────────────────────────────
   temple-guardian.js — Temple Guardian Module
   API: window.TempleGuardian = { init, update, reset }
   Controls:
     T then G  (both within 400ms) → activate / deactivate module
     WASD                          → move player
     Space                         → jump
     Mouse                         → aim / look
     Click                         → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.TempleGuardian = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Activation ────────────────────────────────────────────────────────── */
  var _active      = false;
  var _tPressTime  = 0;
  var _gPressTime  = 0;
  var _keys        = {};
  var _mouseX      = 0;
  var _mouseY      = 0;
  var _yaw         = 0;
  var _pitch       = 0;

  /* ── All scene objects (for cleanup) ───────────────────────────────────── */
  var _meshes = [];
  var _lights = [];

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player    = null;
  var _playerHP  = 100;
  var _velY      = 0;
  var _onGround  = true;
  var _speed     = 8;
  var _px        = 0;
  var _py        = 1.7;
  var _pz        = 40;

  /* ── Bullets (player shots) ────────────────────────────────────────────── */
  var _bullets = [];
  /* { mesh, vx, vy, vz, life } */

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _cultists  = [];
  var _golems    = [];
  var _highPriest = null;
  var _enemiesAlive = 0;
  /* cultist: { mesh, bodyMesh, hp, dead, x, y, z, fireTimer, throwTimer,
               daggers:[], maceSwingTimer, maceSwinging, alertRadius,
               patrolAngle, patrolCx, patrolCz, patrolRadius }
     golem:   { mesh, hp, dead, x, y, z, skinBroken, hitCount, crackLines,
               moveSpeed, attackTimer }
     priest:  { mesh, hp, dead, x, y, z, ritualHealing, lastHitTime,
               glowLight, summonsDone, phase2, summonCooldown,
               summonedGolemCount } */

  /* ── Thrown daggers / golem projectiles ────────────────────────────────── */
  var _projectiles = [];
  /* { mesh, vx, vy, vz, life, damage } */

  /* ── Arrow traps ───────────────────────────────────────────────────────── */
  var _trapTiles   = [];
  /* { mesh, x, z, triggered, arrowCooldown, arrows:[] } */
  var _arrowProjectiles = [];
  /* { mesh, vx, vy, vz, life } */

  /* ── Idol ──────────────────────────────────────────────────────────────── */
  var _idolMesh    = null;
  var _idolHP      = 5;
  var _idolLight   = null;
  var _idolDestroyed = false;

  /* ── Ritual timer ──────────────────────────────────────────────────────── */
  var _ritualTimer    = 150;
  var _ritualExpired  = false;
  var _unkillabeSpawned = false;

  /* ── Win / Lose ────────────────────────────────────────────────────────── */
  var _gameOver = false;
  var _gameWon  = false;

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  var _hud     = null;
  var _msgEl   = null;
  var _msgTimer = 0;

  /* ── Fog/bg backup ──────────────────────────────────────────────────────── */
  var _bgBackup  = null;
  var _fogBackup = null;

  /* ── Game time ──────────────────────────────────────────────────────────── */
  var _gameTime = 0;

  /* ── Secret passages ────────────────────────────────────────────────────── */
  var _secretPanels = [];
  /* { mesh, x, y, z, open, openTimer } */

  /* ── Torches ─────────────────────────────────────────────────────────────  */
  var _torches = [];
  /* { mesh, light, flickerTimer, baseIntensity } */

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HELPERS                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _box(w, h, d, color, emissive) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = new THREE.Color(emissive);
      opts.emissiveIntensity = 0.5;
    }
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial(opts));
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _sphere(r, segs, color) {
    var geo = new THREE.SphereGeometry(r, segs || 8, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _lines(geo, color) {
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
  }

  function _add(mesh) {
    _scene.add(mesh);
    _meshes.push(mesh);
    return mesh;
  }

  function _addLight(light) {
    _scene.add(light);
    _lights.push(light);
    return light;
  }

  function _dist2d(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3d(ax, ay, az, bx, by, bz) {
    var dx = ax - bx, dy = ay - by, dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
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

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  MESSAGES & HUD                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _showMsg(text, duration) {
    if (!_msgEl) {
      _msgEl = document.createElement('div');
      _msgEl.style.cssText = [
        'position:fixed',
        'bottom:90px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#FFEE44',
        'font-family:monospace',
        'font-size:15px',
        'font-weight:bold',
        'background:rgba(0,0,0,0.82)',
        'padding:8px 22px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:10000',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(_msgEl);
    }
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = duration || 4.0;
  }

  function _updateMsgTimer(dt) {
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _msgEl) { _msgEl.style.display = 'none'; }
    }
  }

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'tg-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.75)',
      'padding:6px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'min-width:380px'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    if (!_hud) return;
    var golems = 0;
    for (var i = 0; i < _golems.length; i++) {
      if (!_golems[i].dead) golems++;
    }
    var timerColor = _ritualTimer < 30 ? '#FF3333' : (_ritualTimer < 60 ? '#FF8800' : '#FFCC44');
    var idolPct = Math.round((_idolHP / 5) * 100);
    var priestStatus = '';
    if (_highPriest && !_highPriest.dead) {
      priestStatus = ' | PRIEST:' + _highPriest.hp + 'HP';
      if (_highPriest.ritualHealing) priestStatus += ' [HEALING]';
    } else if (_highPriest && _highPriest.dead) {
      priestStatus = ' | PRIEST:SLAIN';
    }
    _hud.innerHTML =
      '<span style="color:' + timerColor + '">RITUAL: ' + Math.ceil(_ritualTimer) + 's</span>' +
      ' | GOLEMS:' + golems +
      ' | IDOL:' + idolPct + '%' +
      priestStatus +
      ' | HP:' + _playerHP;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }
    if (_msgEl && _msgEl.parentNode) { _msgEl.parentNode.removeChild(_msgEl); _msgEl = null; }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  ENVIRONMENT — TEMPLE PYRAMID EXTERIOR                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _buildPyramid() {
    /* 5-tier stepped pyramid exterior */
    var tiers = [
      { w: 60, h: 4,  d: 60, y: 2  },
      { w: 48, h: 4,  d: 48, y: 6  },
      { w: 36, h: 4,  d: 36, y: 10 },
      { w: 26, h: 4,  d: 26, y: 14 },
      { w: 16, h: 4,  d: 16, y: 18 }
    ];
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var tier = _box(t.w, t.h, t.d, 0x998866);
      tier.position.set(0, t.y, 0);
      _add(tier);
    }
    /* Wide front stairs */
    for (var s = 0; s < 10; s++) {
      var stair = _box(10, 0.5, 2.5, 0x887755);
      stair.position.set(0, s * 2 + 0.25, 32 - s * 2.5);
      _add(stair);
    }
    /* Ground plane around pyramid */
    var ground = _box(140, 0.5, 140, 0xBBAA88);
    ground.position.set(0, -0.25, 0);
    _add(ground);
    /* Boundary walls (keep player in area) */
    var bwall1 = _box(140, 8, 2, 0x887755);
    bwall1.position.set(0, 4, -70);
    _add(bwall1);
    var bwall2 = _box(140, 8, 2, 0x887755);
    bwall2.position.set(0, 4, 70);
    _add(bwall2);
    var bwall3 = _box(2, 8, 140, 0x887755);
    bwall3.position.set(-70, 4, 0);
    _add(bwall3);
    var bwall4 = _box(2, 8, 140, 0x887755);
    bwall4.position.set(70, 4, 0);
    _add(bwall4);
  }

  function _buildTempleInterior() {
    /* ── Entrance Hall (Room 1) ──────────────────────────────── */
    /* floor */
    var floor1 = _box(24, 0.5, 32, 0x887744);
    floor1.position.set(0, 0.25, 10);
    _add(floor1);
    /* ceiling */
    var ceil1 = _box(24, 0.5, 32, 0x776633);
    ceil1.position.set(0, 7.75, 10);
    _add(ceil1);
    /* walls */
    var w1a = _box(0.5, 8, 32, 0x776644);
    w1a.position.set(-12, 4, 10);
    _add(w1a);
    var w1b = _box(0.5, 8, 32, 0x776644);
    w1b.position.set(12, 4, 10);
    _add(w1b);
    var w1c = _box(24, 8, 0.5, 0x776644);
    w1c.position.set(0, 4, -6);
    _add(w1c);
    /* entrance opening in back wall (door gap) */

    /* ── Sanctum (Room 2) ───────────────────────────────────── */
    var floor2 = _box(22, 0.5, 24, 0x886644);
    floor2.position.set(0, 0.25, -18);
    _add(floor2);
    var ceil2 = _box(22, 0.5, 24, 0x665533);
    ceil2.position.set(0, 8.75, -18);
    _add(ceil2);
    var w2a = _box(0.5, 9, 24, 0x665533);
    w2a.position.set(-11, 4.5, -18);
    _add(w2a);
    var w2b = _box(0.5, 9, 24, 0x665533);
    w2b.position.set(11, 4.5, -18);
    _add(w2b);
    /* passage between rooms */
    var arch1 = _box(5, 5, 0.5, 0x554433);
    arch1.position.set(-4.75, 2.5, -6.25);
    _add(arch1);
    var arch2 = _box(5, 5, 0.5, 0x554433);
    arch2.position.set(4.75, 2.5, -6.25);
    _add(arch2);
    var archTop = _box(14, 2, 0.5, 0x554433);
    archTop.position.set(0, 6, -6.25);
    _add(archTop);

    /* ── Inner Sanctum (Room 3) ─────────────────────────────── */
    var floor3 = _box(18, 0.5, 16, 0x774433);
    floor3.position.set(0, 0.25, -38);
    _add(floor3);
    var ceil3 = _box(18, 0.5, 16, 0x553322);
    ceil3.position.set(0, 9.75, -38);
    _add(ceil3);
    var w3a = _box(0.5, 10, 16, 0x664433);
    w3a.position.set(-9, 5, -38);
    _add(w3a);
    var w3b = _box(0.5, 10, 16, 0x664433);
    w3b.position.set(9, 5, -38);
    _add(w3b);
    var w3back = _box(18, 10, 0.5, 0x553322);
    w3back.position.set(0, 5, -46);
    _add(w3back);
    /* passage between room 2 and 3 */
    var arch3 = _box(4, 5, 0.5, 0x554433);
    arch3.position.set(-4.5, 2.5, -30);
    _add(arch3);
    var arch4 = _box(4, 5, 0.5, 0x554433);
    arch4.position.set(4.5, 2.5, -30);
    _add(arch4);
    var archTop2 = _box(13, 2, 0.5, 0x554433);
    archTop2.position.set(0, 6.5, -30);
    _add(archTop2);
  }

  function _buildPillars() {
    /* Entrance hall pillars */
    var pillarPositions = [
      [-8, 4, 0],  [ 8, 4, 0],
      [-8, 4, 18], [ 8, 4, 18],
      [-7, 4.5, -14], [7, 4.5, -14],
      [-7, 4.5, -22], [7, 4.5, -22]
    ];
    for (var i = 0; i < pillarPositions.length; i++) {
      var pp = pillarPositions[i];
      var pillar = _cyl(0.7, 0.8, pp[1] * 2, 10, 0x887766);
      pillar.position.set(pp[0], pp[1], pp[2]);
      _add(pillar);
      /* carved detail lines on pillar */
      var linesGeo = new THREE.BufferGeometry();
      var lv = [];
      for (var ring = 0; ring < 5; ring++) {
        var ry = ring * 1.5 - 2.5;
        for (var seg = 0; seg < 10; seg++) {
          var a1 = (seg / 10) * Math.PI * 2;
          var a2 = ((seg + 1) / 10) * Math.PI * 2;
          var rad = 0.75;
          lv.push(Math.cos(a1) * rad, ry, Math.sin(a1) * rad);
          lv.push(Math.cos(a2) * rad, ry, Math.sin(a2) * rad);
        }
      }
      linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(lv, 3));
      var carving = _lines(linesGeo, 0x554433);
      carving.position.set(pp[0], pp[1], pp[2]);
      _add(carving);
    }
  }

  function _buildAltar() {
    /* Raised altar platform */
    var altarBase = _box(8, 1.5, 6, 0x886644);
    altarBase.position.set(0, 1.5, -40);
    _add(altarBase);
    var altarRiser = _box(4, 1.0, 3, 0x775533);
    altarRiser.position.set(0, 2.75, -40);
    _add(altarRiser);
    /* Idol: glowing gold SphereGeometry on top */
    _idolMesh = _sphere(0.6, 12, 0xFFCC00);
    _idolMesh.position.set(0, 4.05, -40);
    _idolMesh.material.emissive = new THREE.Color(0xAA8800);
    _idolMesh.material.emissiveIntensity = 0.8;
    _add(_idolMesh);
    _idolLight = new THREE.PointLight(0xFFCC22, 1.5, 8);
    _idolLight.position.set(0, 4.5, -40);
    _addLight(_idolLight);
    /* altar decoration lines */
    var altGeo = new THREE.BufferGeometry();
    var av = [
      -4, 0, -3,  4, 0, -3,
       4, 0, -3,  4, 0,  3,
       4, 0,  3, -4, 0,  3,
      -4, 0,  3, -4, 0, -3,
      -4, 1.5, -3,  4, 1.5, -3,
       4, 1.5, -3,  4, 1.5,  3,
       4, 1.5,  3, -4, 1.5,  3,
      -4, 1.5,  3, -4, 1.5, -3
    ];
    altGeo.setAttribute('position', new THREE.Float32BufferAttribute(av, 3));
    var altLines = _lines(altGeo, 0xAA8833);
    altLines.position.set(0, 1.5, -40);
    _add(altLines);
  }

  function _buildSecretPassages() {
    /* Passage 1: east wall of sanctum, leads to narrow tunnel */
    var panel1 = _box(2, 4, 0.4, 0x665533);
    panel1.position.set(10.6, 2, -20);
    _add(panel1);
    _secretPanels.push({ mesh: panel1, x: 10.6, y: 2, z: -20, open: false, openTimer: 0, axis: 'x', dir: 1 });
    /* Tunnel segment */
    var tun1 = _box(6, 4, 2, 0x554422);
    tun1.position.set(14, 2, -20);
    _add(tun1);
    /* Passage 2: west wall shortcut */
    var panel2 = _box(2, 4, 0.4, 0x665533);
    panel2.position.set(-10.6, 2, -24);
    _add(panel2);
    _secretPanels.push({ mesh: panel2, x: -10.6, y: 2, z: -24, open: false, openTimer: 0, axis: 'x', dir: -1 });
    var tun2 = _box(6, 4, 2, 0x554422);
    tun2.position.set(-14, 2, -24);
    _add(tun2);
  }

  function _buildTorches() {
    var torchPositions = [
      /* entrance hall */
      [-11, 3.5, 4],  [11, 3.5, 4],
      [-11, 3.5, 12], [11, 3.5, 12],
      [-11, 3.5, 20], [11, 3.5, 20],
      /* sanctum */
      [-10, 3.5, -14], [10, 3.5, -14],
      [-10, 3.5, -22], [10, 3.5, -22],
      /* inner sanctum */
      [-8, 3.5, -34], [8, 3.5, -34],
      [-8, 3.5, -42], [8, 3.5, -42]
    ];
    for (var i = 0; i < torchPositions.length; i++) {
      var tp = torchPositions[i];
      /* torch holder */
      var holder = _cyl(0.08, 0.1, 0.7, 6, 0x554422);
      holder.position.set(tp[0], tp[1], tp[2]);
      _add(holder);
      /* flame cone */
      var flame = _cone(0.12, 0.3, 6, 0xFF6600);
      flame.material.emissive = new THREE.Color(0xFF4400);
      flame.material.emissiveIntensity = 0.9;
      flame.position.set(tp[0], tp[1] + 0.5, tp[2]);
      _add(flame);
      /* point light */
      var ptLight = new THREE.PointLight(0xFF8833, 1.2, 7);
      ptLight.position.set(tp[0], tp[1] + 0.6, tp[2]);
      _addLight(ptLight);
      _torches.push({ mesh: flame, light: ptLight, flickerTimer: Math.random() * 2, baseIntensity: 1.2 });
    }
  }

  function _buildTrapTiles() {
    /* 6 trap tiles with lighter color in entrance hall and sanctum */
    var tilePositions = [
      [-4, 0.26, 8],  [4, 0.26, 8],
      [0, 0.26, 16],
      [-3, 0.26, -15], [3, 0.26, -15],
      [0, 0.26, -24]
    ];
    for (var i = 0; i < tilePositions.length; i++) {
      var tp = tilePositions[i];
      var tile = _box(2, 0.1, 2, 0xCCBB99);
      tile.position.set(tp[0], tp[1], tp[2]);
      _add(tile);
      _trapTiles.push({
        mesh:  tile,
        x:     tp[0],
        z:     tp[2],
        triggered: false,
        arrowCooldown: 0,
        arrows: []
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  ENEMIES — CULTISTS                                                     */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _spawnCultist(x, y, z, patrolCx, patrolCz, patrolRadius) {
    /* robe body */
    var body = _box(0.8, 1.4, 0.5, 0x442211);
    body.position.set(x, y + 0.7, z);
    _add(body);
    /* head */
    var head = _sphere(0.25, 7, 0xBBAA99);
    head.position.set(x, y + 1.65, z);
    _add(head);
    /* hood */
    var hood = _cone(0.28, 0.45, 7, 0x331100);
    hood.position.set(x, y + 1.95, z);
    _add(hood);
    /* mace arm (BoxGeometry club) */
    var mace = _box(0.12, 0.6, 0.12, 0x776655);
    mace.position.set(x + 0.55, y + 0.8, z);
    _add(mace);
    var obj = {
      mesh:       body,
      headMesh:   head,
      hoodMesh:   hood,
      maceMesh:   mace,
      hp:         70,
      dead:       false,
      x: x, y: y, z: z,
      fireTimer:      2 + Math.random() * 2,
      throwTimer:     4 + Math.random() * 3,
      maceSwingTimer: 0,
      maceSwinging:   false,
      alertRadius:    18,
      patrolAngle:    Math.random() * Math.PI * 2,
      patrolCx:   patrolCx || x,
      patrolCz:   patrolCz || z,
      patrolRadius: patrolRadius || 5,
      daggers:    []
    };
    _cultists.push(obj);
    _enemiesAlive++;
    return obj;
  }

  function _spawnGolem(x, y, z) {
    /* stone cylinder body */
    var body = _cyl(0.6, 0.7, 2.0, 10, 0x667766);
    body.position.set(x, y + 1.0, z);
    _add(body);
    /* head */
    var ghead = _box(0.8, 0.8, 0.8, 0x556655);
    ghead.position.set(x, y + 2.2, z);
    _add(ghead);
    /* arms */
    var armL = _box(0.35, 1.2, 0.35, 0x667766);
    armL.position.set(x - 0.85, y + 1.2, z);
    _add(armL);
    var armR = _box(0.35, 1.2, 0.35, 0x667766);
    armR.position.set(x + 0.85, y + 1.2, z);
    _add(armR);
    var obj = {
      mesh:       body,
      headMesh:   ghead,
      armL:       armL,
      armR:       armR,
      hp:         200,
      dead:       false,
      x: x, y: y, z: z,
      skinBroken: false,
      hitCount:   0,
      crackLines: [],
      moveSpeed:  2.5,
      attackTimer: 2.0,
      alertRadius: 22
    };
    _golems.push(obj);
    _enemiesAlive++;
    return obj;
  }

  function _addGolemCracks(golem) {
    /* LineSegments cracks when stone skin breaks */
    var geo = new THREE.BufferGeometry();
    var cv = [];
    for (var c = 0; c < 8; c++) {
      var angle = (c / 8) * Math.PI * 2 + Math.random() * 0.4;
      var r1 = 0.5 + Math.random() * 0.2;
      var r2 = 0.2 + Math.random() * 0.3;
      var y1 = Math.random() * 1.6 - 0.8;
      var y2 = y1 + (Math.random() - 0.5) * 0.8;
      cv.push(Math.cos(angle) * r1, y1, Math.sin(angle) * r1);
      cv.push(Math.cos(angle + 0.3) * r2, y2, Math.sin(angle + 0.3) * r2);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(cv, 3));
    var crack = _lines(geo, 0x333333);
    crack.position.copy(golem.mesh.position);
    _add(crack);
    golem.crackLines.push(crack);
  }

  function _spawnHighPriest(x, y, z) {
    /* robed priestly figure */
    var body = _box(0.9, 1.6, 0.6, 0x441111);
    body.position.set(x, y + 0.8, z);
    _add(body);
    var head = _sphere(0.3, 8, 0xAA8877);
    head.position.set(x, y + 1.85, z);
    _add(head);
    /* tall mitre hat */
    var hat = _cone(0.22, 0.7, 6, 0x330000);
    hat.position.set(x, y + 2.35, z);
    _add(hat);
    /* staff */
    var staff = _box(0.1, 2.0, 0.1, 0x664422);
    staff.position.set(x + 0.6, y + 1.0, z);
    _add(staff);
    /* staff orb */
    var staffOrb = _sphere(0.15, 7, 0xFF3322);
    staffOrb.material.emissive = new THREE.Color(0xCC1100);
    staffOrb.material.emissiveIntensity = 1.0;
    staffOrb.position.set(x + 0.6, y + 2.15, z);
    _add(staffOrb);
    /* ritual glow light */
    var glowLight = new THREE.PointLight(0xFF2200, 0.8, 6);
    glowLight.position.set(x, y + 1.5, z);
    _addLight(glowLight);
    _highPriest = {
      mesh:         body,
      headMesh:     head,
      hatMesh:      hat,
      staffMesh:    staff,
      staffOrb:     staffOrb,
      glowLight:    glowLight,
      hp:           470,
      dead:         false,
      x: x, y: y, z: z,
      ritualHealing:   false,
      lastHitTime:     -999,
      summonsDone:     false,
      phase2:          false,
      summonCooldown:  0,
      summonedGolemCount: 0,
      fireTimer:       3.0,
      alertRadius:     30
    };
    _enemiesAlive++;
    return _highPriest;
  }

  function _spawnAllEnemies() {
    /* 8 cultists in entrance hall and sanctum */
    _spawnCultist(-5, 0, 14, -5, 14, 4);
    _spawnCultist( 5, 0, 14,  5, 14, 4);
    _spawnCultist(-6, 0,  6, -6,  6, 3);
    _spawnCultist( 6, 0,  6,  6,  6, 3);
    _spawnCultist(-7, 0, -12, -7, -12, 5);
    _spawnCultist( 7, 0, -12,  7, -12, 5);
    _spawnCultist(-5, 0, -20, -5, -20, 4);
    _spawnCultist( 5, 0, -20,  5, -20, 4);
    /* 8 stone golems — 4 sanctum, 4 inner sanctum */
    _spawnGolem(-6, 0, -10);
    _spawnGolem( 6, 0, -10);
    _spawnGolem(-5, 0, -26);
    _spawnGolem( 5, 0, -26);
    _spawnGolem(-6, 0, -34);
    _spawnGolem( 6, 0, -34);
    _spawnGolem(-4, 0, -40);
    _spawnGolem( 4, 0, -40);
    /* Boss High Priest in inner sanctum */
    _spawnHighPriest(0, 0, -43);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SHOOTING                                                               */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _firePlayerBullet() {
    if (!_camera) return;
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    var bm = _box(0.06, 0.06, 0.3, 0xFFFF88, 0xFFFF00);
    bm.position.set(_px, _py - 0.1, _pz);
    _add(bm);
    _bullets.push({
      mesh: bm,
      vx: dir.x * 60,
      vy: dir.y * 60,
      vz: dir.z * 60,
      life: 2.0
    });
  }

  function _fireArrowTrap(trap) {
    /* arrows from both sides of the wall slot */
    for (var side = -1; side <= 1; side += 2) {
      var arrow = _box(0.06, 0.06, 0.5, 0x996633);
      arrow.position.set(trap.x + side * 10, 1.2, trap.z);
      _add(arrow);
      _arrowProjectiles.push({
        mesh:   arrow,
        vx:    -side * 20,
        vy:     0,
        vz:     0,
        life:   2.0,
        trapRef: trap
      });
    }
  }

  function _fireCultistDagger(cultist) {
    var dx = _px - cultist.x;
    var dz = _pz - cultist.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var dagger = _box(0.05, 0.05, 0.3, 0xAA8866);
    dagger.position.set(cultist.x, cultist.y + 1.4, cultist.z);
    _add(dagger);
    var speed = 14;
    _projectiles.push({
      mesh:   dagger,
      vx:     (dx / len) * speed,
      vy:     0.5,
      vz:     (dz / len) * speed,
      life:   3.0,
      damage: 12
    });
  }

  function _firePriestBlast(priest) {
    var dx = _px - priest.x;
    var dy = (_py - 0.3) - (priest.y + 1.5);
    var dz = _pz - priest.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var blast = _sphere(0.2, 6, 0xFF3300);
    blast.material.emissive = new THREE.Color(0xFF1100);
    blast.material.emissiveIntensity = 1.0;
    blast.position.set(priest.x, priest.y + 1.5, priest.z);
    _add(blast);
    var speed = 18;
    _projectiles.push({
      mesh:   blast,
      vx:     (dx / len) * speed,
      vy:     (dy / len) * speed,
      vz:     (dz / len) * speed,
      life:   3.5,
      damage: 22
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HIT DETECTION                                                          */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _checkBulletHits(dt) {
    for (var b = _bullets.length - 1; b >= 0; b--) {
      var bul = _bullets[b];
      bul.mesh.position.x += bul.vx * dt;
      bul.mesh.position.y += bul.vy * dt;
      bul.mesh.position.z += bul.vz * dt;
      bul.life -= dt;
      var bx = bul.mesh.position.x;
      var by = bul.mesh.position.y;
      var bz = bul.mesh.position.z;
      var hit = false;

      /* vs cultists */
      for (var ci = 0; ci < _cultists.length && !hit; ci++) {
        var cult = _cultists[ci];
        if (cult.dead) continue;
        if (_dist3d(bx, by, bz, cult.x, cult.y + 1.0, cult.z) < 0.9) {
          cult.hp -= 20;
          hit = true;
          if (cult.hp <= 0) _killCultist(ci);
        }
      }

      /* vs golems */
      for (var gi = 0; gi < _golems.length && !hit; gi++) {
        var golem = _golems[gi];
        if (golem.dead) continue;
        if (_dist3d(bx, by, bz, golem.x, golem.y + 1.0, golem.z) < 1.1) {
          hit = true;
          golem.hitCount++;
          if (!golem.skinBroken) {
            if (golem.hitCount >= 3) {
              golem.skinBroken = true;
              _addGolemCracks(golem);
              _showMsg('Stone skin shattered! Golem is now vulnerable!');
            } else {
              _showMsg('Stone skin deflects the shot! (' + (3 - golem.hitCount) + ' hits to break)');
            }
          } else {
            golem.hp -= 20;
            if (golem.hp <= 0) _killGolem(gi);
          }
        }
      }

      /* vs high priest */
      if (!hit && _highPriest && !_highPriest.dead) {
        if (_dist3d(bx, by, bz, _highPriest.x, _highPriest.y + 1.5, _highPriest.z) < 1.0) {
          hit = true;
          _highPriest.hp -= 20;
          _highPriest.lastHitTime = _gameTime;
          _highPriest.ritualHealing = false;
          if (_highPriest.glowLight) _highPriest.glowLight.intensity = 0.8;
          if (_highPriest.hp <= 235 && !_highPriest.phase2) {
            _highPriest.phase2 = true;
            _showMsg('HIGH PRIEST: You cannot stop the ritual!', 5);
            _highPriest.summonsDone = false;
          }
          if (_highPriest.hp <= 0) _killHighPriest();
        }
      }

      /* vs idol */
      if (!hit && _idolMesh && !_idolDestroyed && _highPriest && _highPriest.dead) {
        if (_dist3d(bx, by, bz, 0, 4.05, -40) < 0.7) {
          hit = true;
          _idolHP--;
          _showMsg('Idol integrity: ' + Math.round((_idolHP / 5) * 100) + '%', 2);
          if (_idolMesh) {
            _idolMesh.material.emissiveIntensity = 0.8 * (_idolHP / 5);
          }
          if (_idolLight) _idolLight.intensity = 1.5 * (_idolHP / 5);
          if (_idolHP <= 0) _destroyIdol();
        }
      }

      if (hit || bul.life <= 0) {
        _scene.remove(bul.mesh);
        var bidx = _meshes.indexOf(bul.mesh);
        if (bidx !== -1) _meshes.splice(bidx, 1);
        _bullets.splice(b, 1);
      }
    }
  }

  function _killCultist(idx) {
    var c = _cultists[idx];
    if (c.dead) return;
    c.dead = true;
    _enemiesAlive--;
    /* collapse body */
    c.mesh.position.y -= 0.5;
    c.mesh.rotation.z = Math.PI / 2;
    /* cleanup thrown daggers */
    for (var d = 0; d < c.daggers.length; d++) {
      _scene.remove(c.daggers[d]);
    }
  }

  function _killGolem(idx) {
    var g = _golems[idx];
    if (g.dead) return;
    g.dead = true;
    _enemiesAlive--;
    g.mesh.position.y -= 0.8;
    g.mesh.rotation.x = Math.PI / 2;
    if (g.headMesh) g.headMesh.position.y -= 2.5;
  }

  function _killHighPriest() {
    if (!_highPriest || _highPriest.dead) return;
    _highPriest.dead = true;
    _enemiesAlive--;
    _highPriest.mesh.position.y -= 0.7;
    _highPriest.mesh.rotation.z = Math.PI / 2;
    if (_highPriest.glowLight) _highPriest.glowLight.intensity = 0;
    _showMsg('High Priest Malachar has fallen! Destroy the idol!', 6);
  }

  function _destroyIdol() {
    _idolDestroyed = true;
    if (_idolMesh) {
      _scene.remove(_idolMesh);
      var iidx = _meshes.indexOf(_idolMesh);
      if (iidx !== -1) _meshes.splice(iidx, 1);
      _idolMesh = null;
    }
    if (_idolLight) {
      _scene.remove(_idolLight);
      var lidx = _lights.indexOf(_idolLight);
      if (lidx !== -1) _lights.splice(lidx, 1);
      _idolLight = null;
    }
    /* scatter shards */
    for (var s = 0; s < 8; s++) {
      var shard = _box(0.1 + Math.random() * 0.2, 0.1, 0.1, 0xDDAA00);
      shard.position.set(
        0 + (Math.random() - 0.5) * 3,
        3.5 + Math.random(),
        -40 + (Math.random() - 0.5) * 3
      );
      _add(shard);
    }
    _triggerWin();
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  ENEMY AI UPDATE                                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateCultists(dt) {
    for (var i = 0; i < _cultists.length; i++) {
      var c = _cultists[i];
      if (c.dead) continue;
      var distToPlayer = _dist2d(c.x, c.z, _px, _pz);
      var alerted = distToPlayer < c.alertRadius;

      if (alerted) {
        /* Move toward player */
        var dx = _px - c.x;
        var dz = _pz - c.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        if (distToPlayer > 2.0) {
          c.x += (dx / len) * 3.5 * dt;
          c.z += (dz / len) * 3.5 * dt;
        }
        /* Mace melee if close */
        if (distToPlayer < 2.2) {
          c.maceSwingTimer -= dt;
          if (c.maceSwingTimer <= 0) {
            c.maceSwingTimer = 2.5;
            _playerHP -= 18;
            _showMsg('Cultist mace hit! -18 HP', 1.5);
            _checkPlayerDead();
          }
        }
        /* Throw dagger at range */
        c.throwTimer -= dt;
        if (c.throwTimer <= 0 && distToPlayer > 4 && distToPlayer < 16) {
          c.throwTimer = 4 + Math.random() * 2;
          _fireCultistDagger(c);
        }
      } else {
        /* patrol */
        c.patrolAngle += 0.5 * dt;
        c.x = c.patrolCx + Math.cos(c.patrolAngle) * c.patrolRadius;
        c.z = c.patrolCz + Math.sin(c.patrolAngle) * c.patrolRadius;
      }

      /* update mesh positions */
      c.mesh.position.set(c.x, c.y + 0.7, c.z);
      c.headMesh.position.set(c.x, c.y + 1.65, c.z);
      c.hoodMesh.position.set(c.x, c.y + 1.95, c.z);
      /* mace swing animation */
      if (c.maceSwingTimer < 2.0 && c.maceSwingTimer > 1.5) {
        c.maceMesh.position.set(c.x + 0.55, c.y + 0.8 + Math.sin(c.maceSwingTimer * 4) * 0.3, c.z);
      } else {
        c.maceMesh.position.set(c.x + 0.55, c.y + 0.8, c.z);
      }
    }
  }

  function _updateGolems(dt) {
    for (var i = 0; i < _golems.length; i++) {
      var g = _golems[i];
      if (g.dead) continue;
      var distToPlayer = _dist2d(g.x, g.z, _px, _pz);
      var alerted = distToPlayer < g.alertRadius;
      if (alerted) {
        if (distToPlayer > 1.5) {
          var dx = _px - g.x;
          var dz = _pz - g.z;
          var len = Math.sqrt(dx * dx + dz * dz) || 1;
          g.x += (dx / len) * g.moveSpeed * dt;
          g.z += (dz / len) * g.moveSpeed * dt;
        } else {
          g.attackTimer -= dt;
          if (g.attackTimer <= 0) {
            g.attackTimer = 2.5;
            _playerHP -= 30;
            _showMsg('Golem slam! -30 HP', 1.5);
            _checkPlayerDead();
          }
        }
      }
      g.mesh.position.set(g.x, g.y + 1.0, g.z);
      g.headMesh.position.set(g.x, g.y + 2.2, g.z);
      g.armL.position.set(g.x - 0.85, g.y + 1.2, g.z);
      g.armR.position.set(g.x + 0.85, g.y + 1.2, g.z);
      /* move crack lines with golem */
      for (var c = 0; c < g.crackLines.length; c++) {
        g.crackLines[c].position.copy(g.mesh.position);
      }
    }
  }

  function _updateHighPriest(dt) {
    if (!_highPriest || _highPriest.dead) return;
    var distToPlayer = _dist2d(_highPriest.x, _highPriest.z, _px, _pz);

    /* Ritual healing: if no damage for 3s */
    var timeSinceHit = _gameTime - _highPriest.lastHitTime;
    if (timeSinceHit >= 3.0 && !_highPriest.dead) {
      _highPriest.ritualHealing = true;
      _highPriest.hp = Math.min(470, _highPriest.hp + 15 * dt);
      if (_highPriest.glowLight) {
        _highPriest.glowLight.intensity = 1.5 + Math.sin(_gameTime * 4) * 0.5;
      }
    } else {
      _highPriest.ritualHealing = false;
    }

    /* Phase 2: summon 2 golems at 50% HP */
    if (_highPriest.hp <= 235 && !_highPriest.summonsDone) {
      _highPriest.summonCooldown -= dt;
      if (_highPriest.summonCooldown <= 0) {
        _highPriest.summonsDone = true;
        _spawnGolem(-3, 0, -38);
        _spawnGolem( 3, 0, -38);
        _showMsg('MALACHAR SUMMONS STONE GUARDIANS!', 4);
      }
    }

    /* Priest fires ritual blasts toward player */
    _highPriest.fireTimer -= dt;
    if (distToPlayer < _highPriest.alertRadius && _highPriest.fireTimer <= 0) {
      _highPriest.fireTimer = 3.0 + Math.random();
      _firePriestBlast(_highPriest);
    }

    /* Priest faces player (rotate staff orb) */
    if (_highPriest.staffOrb) {
      _highPriest.staffOrb.material.emissiveIntensity = 0.7 + Math.sin(_gameTime * 2) * 0.3;
    }

    /* Update mesh positions */
    _highPriest.mesh.position.set(_highPriest.x, _highPriest.y + 0.8, _highPriest.z);
    _highPriest.headMesh.position.set(_highPriest.x, _highPriest.y + 1.85, _highPriest.z);
    _highPriest.hatMesh.position.set(_highPriest.x, _highPriest.y + 2.35, _highPriest.z);
    _highPriest.staffMesh.position.set(_highPriest.x + 0.6, _highPriest.y + 1.0, _highPriest.z);
    _highPriest.staffOrb.position.set(_highPriest.x + 0.6, _highPriest.y + 2.15, _highPriest.z);
    _highPriest.glowLight.position.set(_highPriest.x, _highPriest.y + 1.5, _highPriest.z);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PROJECTILE UPDATE                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateProjectiles(dt) {
    /* enemy projectiles (daggers, priest blasts) */
    for (var p = _projectiles.length - 1; p >= 0; p--) {
      var proj = _projectiles[p];
      proj.mesh.position.x += proj.vx * dt;
      proj.mesh.position.y += proj.vy * dt;
      proj.mesh.position.z += proj.vz * dt;
      proj.life -= dt;
      var px2 = proj.mesh.position.x;
      var py2 = proj.mesh.position.y;
      var pz2 = proj.mesh.position.z;
      var hitPlayer = _dist3d(px2, py2, pz2, _px, _py, _pz) < 0.8;
      if (hitPlayer) {
        _playerHP -= proj.damage;
        _showMsg('Hit! -' + proj.damage + ' HP', 1.5);
        _checkPlayerDead();
        proj.life = 0;
      }
      if (proj.life <= 0) {
        _scene.remove(proj.mesh);
        var pidx = _meshes.indexOf(proj.mesh);
        if (pidx !== -1) _meshes.splice(pidx, 1);
        _projectiles.splice(p, 1);
      }
    }
  }

  function _updateArrowProjectiles(dt) {
    for (var a = _arrowProjectiles.length - 1; a >= 0; a--) {
      var ar = _arrowProjectiles[a];
      ar.mesh.position.x += ar.vx * dt;
      ar.mesh.position.y += ar.vy * dt;
      ar.mesh.position.z += ar.vz * dt;
      ar.life -= dt;
      var ax = ar.mesh.position.x;
      var ay = ar.mesh.position.y;
      var az = ar.mesh.position.z;
      if (_dist3d(ax, ay, az, _px, _py, _pz) < 0.6) {
        _playerHP -= 25;
        _showMsg('Arrow trap! -25 HP', 2);
        _checkPlayerDead();
        ar.life = 0;
      }
      if (ar.life <= 0) {
        _scene.remove(ar.mesh);
        var aidx = _meshes.indexOf(ar.mesh);
        if (aidx !== -1) _meshes.splice(aidx, 1);
        _arrowProjectiles.splice(a, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  TRAP TILES UPDATE                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateTrapTiles(dt) {
    for (var i = 0; i < _trapTiles.length; i++) {
      var trap = _trapTiles[i];
      if (trap.arrowCooldown > 0) {
        trap.arrowCooldown -= dt;
        continue;
      }
      var dx = _px - trap.x;
      var dz = _pz - trap.z;
      var onTile = Math.abs(dx) < 1.1 && Math.abs(dz) < 1.1;
      if (onTile && !trap.triggered) {
        trap.triggered = true;
        trap.arrowCooldown = 5.0;
        _fireArrowTrap(trap);
        _showMsg('TRAP! Arrow volley!', 2);
        /* reset trigger after cooldown so trap can fire again */
        (function(t) {
          setTimeout(function () { t.triggered = false; }, 5000);
        }(trap));
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RITUAL TIMER                                                           */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateRitualTimer(dt) {
    if (_ritualExpired) return;
    _ritualTimer -= dt;
    if (_ritualTimer <= 60 && _ritualTimer > 59.9) {
      _showMsg('WARNING: Ritual completes in 60 seconds!', 5);
    }
    if (_ritualTimer <= 30 && _ritualTimer > 29.9) {
      _showMsg('CRITICAL: Ritual completes in 30 seconds!', 5);
    }
    if (_ritualTimer <= 0) {
      _ritualTimer = 0;
      _ritualExpired = true;
      _onRitualComplete();
    }
  }

  function _onRitualComplete() {
    _showMsg('THE RITUAL IS COMPLETE! AN UNKILLABLE GOLEM ARMY AWAKENS!', 8);
    /* spawn unkillable golems */
    if (!_unkillabeSpawned) {
      _unkillabeSpawned = true;
      _spawnUnkillableGolems();
    }
    _triggerLose('The ritual was completed — the unkillable golem army awakens!');
  }

  function _spawnUnkillableGolems() {
    var positions = [
      [-8, 0, 20], [8, 0, 20], [0, 0, 25],
      [-6, 0, -5], [6, 0, -5]
    ];
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var g = _spawnGolem(pos[0], pos[1], pos[2]);
      g.skinBroken = true;  /* bypass normal skin break — unkillable because hp never runs out */
      g.hp = 9999;
      g.moveSpeed = 4.5;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  TORCHES / ATMOSPHERE                                                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateTorches(dt) {
    for (var i = 0; i < _torches.length; i++) {
      var t = _torches[i];
      t.flickerTimer += dt;
      var flicker = Math.sin(t.flickerTimer * 7.3 + i) * 0.2 + Math.sin(t.flickerTimer * 3.1) * 0.1;
      t.light.intensity = t.baseIntensity + flicker;
      t.mesh.position.y += Math.sin(t.flickerTimer * 9 + i * 0.5) * 0.003;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PLAYER MOVEMENT                                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (!_camera || _gameOver) return;
    /* gravity */
    var floorY = 0;
    _velY -= 18 * dt;
    _py += _velY * dt;
    if (_py <= floorY + 1.7) {
      _py = floorY + 1.7;
      _velY = 0;
      _onGround = true;
    } else {
      _onGround = false;
    }
    /* horizontal movement */
    var fwd = new THREE.Vector3();
    _camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    var right = new THREE.Vector3();
    right.crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    var mx = 0, mz = 0;
    if (_keys['w'] || _keys['W'] || _keys['ArrowUp'])    { mx += fwd.x;   mz += fwd.z; }
    if (_keys['s'] || _keys['S'] || _keys['ArrowDown'])  { mx -= fwd.x;   mz -= fwd.z; }
    if (_keys['a'] || _keys['A'] || _keys['ArrowLeft'])  { mx -= right.x; mz -= right.z; }
    if (_keys['d'] || _keys['D'] || _keys['ArrowRight']) { mx += right.x; mz += right.z; }
    var ml = Math.sqrt(mx * mx + mz * mz);
    if (ml > 0) { mx /= ml; mz /= ml; }
    _px += mx * _speed * dt;
    _pz += mz * _speed * dt;
    /* clamp to rough bounds */
    _px = Math.max(-68, Math.min(68, _px));
    _pz = Math.max(-47, Math.min(68, _pz));
    /* jump */
    if ((_keys[' '] || _keys['Space']) && _onGround) {
      _velY = 8;
      _onGround = false;
    }
    _camera.position.set(_px, _py, _pz);
    /* apply yaw/pitch */
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  WIN / LOSE                                                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _checkPlayerDead() {
    if (_playerHP <= 0 && !_gameOver) {
      _playerHP = 0;
      _triggerLose('You have been slain by the cultists!');
    }
  }

  function _triggerWin() {
    _gameWon  = true;
    _gameOver = true;
    _showMsg('VICTORY! The idol is destroyed — the ritual is broken!', 999);
    if (_hud) {
      _hud.style.color = '#44FF44';
      _hud.innerHTML = 'MISSION COMPLETE — TEMPLE GUARDIAN DEFEATED';
    }
  }

  function _triggerLose(reason) {
    if (_gameOver) return;
    _gameOver = true;
    _showMsg('MISSION FAILED: ' + reason, 999);
    if (_hud) {
      _hud.style.color = '#FF4444';
      _hud.innerHTML = 'MISSION FAILED — ' + reason.toUpperCase();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  IDOL GLOW PULSE                                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateIdol(dt) {
    if (!_idolMesh || _idolDestroyed) return;
    _idolMesh.rotation.y += 0.8 * dt;
    var pulse = Math.sin(_gameTime * 2) * 0.15 + 0.65;
    _idolMesh.material.emissiveIntensity = pulse * (_idolHP / 5);
    if (_idolLight) _idolLight.intensity = (1.2 + Math.sin(_gameTime * 3) * 0.3) * (_idolHP / 5);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  EVENT HANDLERS                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.key] = true;
    var now = Date.now();

    /* Activation: T then G within 400ms */
    if (e.key === 't' || e.key === 'T') {
      _tPressTime = now;
    }
    if ((e.key === 'g' || e.key === 'G') && (now - _tPressTime) < 400) {
      if (!_active) {
        _activate();
      } else {
        _deactivate();
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    var sens = 0.002;
    _yaw   -= e.movementX * sens;
    _pitch -= e.movementY * sens;
    _pitch  = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _pitch));
  }

  function _onMouseDown(e) {
    if (!_active || _gameOver) return;
    if (e.button === 0) {
      _firePlayerBullet();
    }
  }

  function _onPointerLockChange() {
    /* no-op for now, pointer lock maintained externally */
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  ACTIVATE / DEACTIVATE                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _activate() {
    _scene  = _getScene();
    _camera = _getCamera();
    if (!_scene || !_camera) {
      console.warn('[TempleGuardian] No scene/camera found.');
      return;
    }
    _active = true;

    /* Backup fog & bg */
    _bgBackup  = _scene.background ? _scene.background.clone() : null;
    _fogBackup = _scene.fog || null;

    /* Temple atmosphere */
    _scene.background = new THREE.Color(0x110A00);
    _scene.fog = new THREE.Fog(0x110A00, 20, 80);

    /* Ambient + directional */
    var ambient = new THREE.AmbientLight(0x332211, 0.5);
    _addLight(ambient);
    var dirLight = new THREE.DirectionalLight(0x885533, 0.6);
    dirLight.position.set(10, 20, 10);
    _addLight(dirLight);

    /* Build environment */
    _buildPyramid();
    _buildTempleInterior();
    _buildPillars();
    _buildAltar();
    _buildSecretPassages();
    _buildTorches();
    _buildTrapTiles();

    /* Spawn enemies */
    _spawnAllEnemies();

    /* Reset player */
    _px = 0; _py = 1.7; _pz = 44;
    _playerHP = 100;
    _velY = 0;
    _onGround = true;
    _yaw = Math.PI;  /* face toward pyramid */
    _pitch = 0;
    _camera.position.set(_px, _py, _pz);
    _camera.rotation.set(0, _yaw, 0);

    /* HUD */
    _buildHUD();
    _showMsg('Temple Guardian activated — T+G to deactivate | Destroy the idol before the ritual completes!', 6);

    /* Reset game state */
    _ritualTimer     = 150;
    _ritualExpired   = false;
    _gameOver        = false;
    _gameWon         = false;
    _idolHP          = 5;
    _idolDestroyed   = false;
    _gameTime        = 0;
    _bullets         = [];
    _projectiles     = [];
    _arrowProjectiles = [];
    _unkillabeSpawned = false;

    /* Pointer lock */
    document.addEventListener('keydown',       _onKeyDown,           false);
    document.addEventListener('keyup',         _onKeyUp,             false);
    document.addEventListener('mousemove',     _onMouseMove,         false);
    document.addEventListener('mousedown',     _onMouseDown,         false);
    document.addEventListener('pointerlockchange', _onPointerLockChange, false);

    try { document.body.requestPointerLock(); } catch(ex) { /* ignore */ }
  }

  function _deactivate() {
    _active = false;
    document.removeEventListener('keydown',       _onKeyDown,           false);
    document.removeEventListener('keyup',         _onKeyUp,             false);
    document.removeEventListener('mousemove',     _onMouseMove,         false);
    document.removeEventListener('mousedown',     _onMouseDown,         false);
    document.removeEventListener('pointerlockchange', _onPointerLockChange, false);
    try { document.exitPointerLock(); } catch(ex) { /* ignore */ }
    _cleanupScene();
    _removeHUD();
    /* restore scene */
    if (_scene) {
      if (_bgBackup)  _scene.background = _bgBackup;
      if (_fogBackup) _scene.fog        = _fogBackup;
      else            _scene.fog        = null;
    }
  }

  function _cleanupScene() {
    for (var i = 0; i < _meshes.length; i++) {
      _scene.remove(_meshes[i]);
      if (_meshes[i].geometry) _meshes[i].geometry.dispose();
      if (_meshes[i].material) _meshes[i].material.dispose();
    }
    _meshes = [];
    for (var l = 0; l < _lights.length; l++) {
      _scene.remove(_lights[l]);
    }
    _lights = [];
    _cultists  = [];
    _golems    = [];
    _highPriest = null;
    _bullets   = [];
    _projectiles = [];
    _arrowProjectiles = [];
    _trapTiles = [];
    _secretPanels = [];
    _torches = [];
    _enemiesAlive = 0;
    _idolMesh = null;
    _idolLight = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  WIN/LOSE CONDITION CHECK (called each frame)                           */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _checkWinLose() {
    if (_gameOver) return;
    /* Check if idol is destroyed after priest death = win */
    if (_highPriest && _highPriest.dead && _idolDestroyed && !_gameWon) {
      _triggerWin();
    }
    /* Ritual expired = lose (handled in _updateRitualTimer) */
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PUBLIC API                                                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene  || _getScene();
    _camera = camera || _getCamera();
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
  }

  function update(dt) {
    if (!_active) return;
    if (!dt || dt > 0.1) dt = 0.016;
    _gameTime += dt;

    if (!_gameOver) {
      _updatePlayer(dt);
      _updateCultists(dt);
      _updateGolems(dt);
      _updateHighPriest(dt);
      _checkBulletHits(dt);
      _updateProjectiles(dt);
      _updateArrowProjectiles(dt);
      _updateTrapTiles(dt);
      _updateRitualTimer(dt);
      _updateIdol(dt);
      _checkWinLose();
    }

    _updateTorches(dt);
    _updateMsgTimer(dt);
    _updateHUD();
  }

  function reset() {
    if (_active) _deactivate();
    _cultists       = [];
    _golems         = [];
    _highPriest     = null;
    _bullets        = [];
    _projectiles    = [];
    _arrowProjectiles = [];
    _trapTiles      = [];
    _secretPanels   = [];
    _torches        = [];
    _meshes         = [];
    _lights         = [];
    _enemiesAlive   = 0;
    _playerHP       = 100;
    _ritualTimer    = 150;
    _ritualExpired  = false;
    _gameOver       = false;
    _gameWon        = false;
    _idolHP         = 5;
    _idolDestroyed  = false;
    _idolMesh       = null;
    _idolLight      = null;
    _gameTime       = 0;
    _keys           = {};
    _tPressTime     = 0;
    _gPressTime     = 0;
    _unkillabeSpawned = false;
  }

  return { init: init, update: update, reset: reset };

}());
