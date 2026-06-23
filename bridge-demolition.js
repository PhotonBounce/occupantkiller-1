// bridge-demolition.js — Bridge Demolition mission module
// Activation: B+D simultaneous keypress (within 400ms window)
// Player must place 6 demolition charges on bridge support columns and blow the bridge
// before an enemy convoy crosses at T=120s.
// var only throughout — IIFE pattern, no block-scoped declarations
window.BridgeDemolition = (function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────────
  var CHARGE_PLACE_RANGE   = 3;      // units to approach column for E placement
  var TOTAL_CHARGES        = 6;      // charges needed for full demolition
  var START_CHARGES        = 2;      // charges player starts with
  var COUNTDOWN_SECS       = 5;      // detonation countdown
  var FALL_DURATION        = 3;      // bridge collapse animation duration (s)
  var CONVOY_ARRIVAL       = 120;    // seconds until convoy arrives
  var REINFORCE_TIME       = 60;     // seconds until reinforcements arrive by jeep
  var RAPPEL_SPEED         = 3;      // units/s descent during rappel escape
  var ACTIVATION_WINDOW    = 0.4;    // seconds for B+D combo window

  // ── State ───────────────────────────────────────────────────────────────────
  var _scene            = null;
  var _camera           = null;
  var _active           = false;
  var _inited           = false;

  var _missionTime      = 0;         // elapsed time since mission start
  var _playerCharges    = START_CHARGES;
  var _chargesPlaced    = 0;
  var _detonatorArmed   = false;
  var _countdown        = -1;        // -1 = not counting
  var _bridgeCollapsing = false;
  var _collapseTimer    = 0;
  var _missionDone      = false;
  var _missionFailed    = false;
  var _rappelling       = false;
  var _rappelTime       = 0;
  var _convoyArrived    = false;
  var _convoyCrossed    = false;
  var _reinforceArrived = false;

  // Key tracking
  var _keyB             = false;
  var _keyD             = false;
  var _keyBTime         = 0;
  var _keyDTime         = 0;
  var _keyE             = false;
  var _keySpace         = false;
  var _keyR             = false;
  var _keyEConsumed     = false;
  var _keySpaceConsumed = false;

  // Three.js objects
  var _bridgeGroup      = null;
  var _bridgeSpan       = null;        // main bridge deck mesh
  var _columns          = [];          // support column objects
  var _canyonWalls      = [];
  var _guardTowers      = [];
  var _supplyChests     = [];          // crates with extra charges
  var _placedCharges    = [];          // { mesh, light, col, blinkTimer, isWeakPoint }
  var _enemies          = [];
  var _jeepGroup        = null;
  var _convoyTrucks     = [];
  var _extractionZone   = null;
  var _particles        = [];
  var _lights           = [];

  // HUD element
  var _hudEl            = null;

  // Audio
  var _audioCtx         = null;

  // ── Scene / camera helpers ──────────────────────────────────────────────────
  function _getScene() {
    return _scene || window.scene || window._gameScene || null;
  }

  function _getCamera() {
    return _camera || window.camera || window._gameCamera || null;
  }

  function _playerPos() {
    var cam = _getCamera();
    if (window.player && window.player.position) return window.player.position;
    if (cam) return cam.position;
    return null;
  }

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  function _playBeep(freq, duration, vol) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(vol || 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.08));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (duration || 0.08));
    } catch (e) {}
  }

  function _playExplosion() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufLen = Math.floor(ctx.sampleRate * 1.5);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2.5);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var g = ctx.createGain();
      src.connect(g);
      g.connect(ctx.destination);
      g.gain.value = 2.0;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  // ── Toast / HUD helpers ─────────────────────────────────────────────────────
  function _toast(msg, color) {
    if (window.HUD && typeof window.HUD.showMessage === 'function') {
      window.HUD.showMessage(msg, 3000);
      return;
    }
    if (window.HUD && typeof window.HUD.notifyPickup === 'function') {
      window.HUD.notifyPickup(msg, color || '#ffdd44');
      return;
    }
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:22%', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)', 'color:' + (color || '#ffdd44'),
      'font-family:monospace', 'font-size:13px', 'padding:6px 16px',
      'border-radius:5px', 'z-index:9999', 'pointer-events:none',
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
  }

  // ── HUD element ─────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'bd-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'top:14px', 'left:50%', 'transform:translateX(-50%)',
      'font-family:monospace', 'font-size:13px', 'color:#ccdd88',
      'background:rgba(0,0,0,0.68)', 'padding:5px 14px', 'border-radius:5px',
      'z-index:3000', 'pointer-events:none', 'user-select:none',
      'border:1px solid rgba(150,180,60,0.45)', 'display:none',
      'white-space:nowrap',
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';

    var convoyRemain = Math.max(0, CONVOY_ARRIVAL - _missionTime);
    var convoyMins = Math.floor(convoyRemain / 60);
    var convoySecs = Math.floor(convoyRemain % 60);
    var convoyStr = (convoyMins < 10 ? '0' : '') + convoyMins + ':' + (convoySecs < 10 ? '0' : '') + convoySecs;
    if (_convoyArrived) convoyStr = '<span style="color:#ff4444">ARRIVED</span>';

    var aliveCount = 0;
    for (var i = 0; i < _enemies.length; i++) { if (_enemies[i].alive) aliveCount++; }

    var detonStr = _detonatorArmed
      ? '<span style="color:#ff4444">ARMED</span>'
      : '<span style="color:#88cc44">SAFE</span>';

    var chargeColor = _chargesPlaced >= TOTAL_CHARGES ? '#44ff88' : '#ffcc44';
    _hudEl.innerHTML =
      'DEMOLITION [CHARGES: <span style="color:' + chargeColor + '">' +
      _chargesPlaced + '/' + TOTAL_CHARGES + '</span>]' +
      ' [CONVOY: ' + convoyStr + ']' +
      ' [ENEMIES: ' + aliveCount + ']' +
      ' | DETONATOR: ' + detonStr;

    if (_countdown >= 0) {
      _hudEl.innerHTML += ' | <span style="color:#ff4444;font-weight:bold">DETONATING: ' +
        Math.ceil(_countdown) + '</span>';
    }
  }

  // ── Build scene geometry ────────────────────────────────────────────────────

  function _buildCanyonWalls(sc) {
    // Two canyon walls flanking the bridge area
    var wallPositions = [
      { x: 0, y: -8, z: 0, w: 80, h: 16, d: 8, side: 'left',  dx: 0, dz: -10 },
      { x: 0, y: -8, z: 0, w: 80, h: 16, d: 8, side: 'right', dx: 0, dz:  10 },
    ];
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    for (var i = 0; i < wallPositions.length; i++) {
      var wp = wallPositions[i];
      var wallGeo = new THREE.BoxGeometry(wp.w, wp.h, wp.d);
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wp.dx, wp.y, wp.dz);
      sc.add(wall);
      _canyonWalls.push(wall);
    }
    // Canyon floor (ravine bottom)
    var floorGeo = new THREE.BoxGeometry(80, 2, 12);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x5c4010 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -16, 0);
    sc.add(floor);
    _canyonWalls.push(floor);
  }

  function _buildBridge(sc) {
    _bridgeGroup = new THREE.Group();

    // Main bridge span: 30x2x8
    var spanGeo = new THREE.BoxGeometry(30, 2, 8);
    var spanMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    _bridgeSpan = new THREE.Mesh(spanGeo, spanMat);
    _bridgeSpan.position.set(0, 0, 0);
    _bridgeGroup.add(_bridgeSpan);

    // Bridge railing strips
    var railMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var railGeo = new THREE.BoxGeometry(30, 0.5, 0.3);
    var railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(0, 1.25, -3.85);
    _bridgeGroup.add(railL);
    var railR = new THREE.Mesh(railGeo.clone(), railMat);
    railR.position.set(0, 1.25, 3.85);
    _bridgeGroup.add(railR);

    // Road surface stripe
    var stripeMat = new THREE.MeshLambertMaterial({ color: 0xddcc66 });
    var stripeGeo = new THREE.BoxGeometry(28, 0.05, 0.4);
    var stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 1.05, 0);
    _bridgeGroup.add(stripe);

    // 4 support columns below bridge at x = -10, -3.3, 3.3, 10
    var colXPositions = [-11, -4, 4, 11];
    var colMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var weakMat = new THREE.LineBasicMaterial({ color: 0xffee00 });

    for (var ci = 0; ci < colXPositions.length; ci++) {
      var cx = colXPositions[ci];
      var colGeo = new THREE.CylinderGeometry(0.7, 0.9, 12, 10);
      var col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, -6, 0);
      _bridgeGroup.add(col);

      // Weak point marker — yellow LineSegments around column
      var isWeak = (ci === 1 || ci === 2); // inner columns are structural weak points
      var markerGeo = new THREE.BoxGeometry(2.2, 0.5, 2.2);
      var markerEdges = new THREE.EdgesGeometry(markerGeo);
      var marker = new THREE.LineSegments(markerEdges, weakMat);
      marker.position.set(cx, -2, 0);
      _bridgeGroup.add(marker);

      _columns.push({
        x: cx, y: -6, z: 0,
        mesh: col,
        marker: marker,
        isWeak: isWeak,
        hasCharge: false,
        chargeMesh: null,
      });
    }

    _bridgeGroup.position.set(0, 1, 0);
    sc.add(_bridgeGroup);
  }

  function _buildGuardTowers(sc) {
    // Guard post each end of bridge
    var towerPositions = [
      { x: -17, z: 0 },
      { x:  17, z: 0 },
    ];
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x667744 });
    var roofMat  = new THREE.MeshLambertMaterial({ color: 0x445533 });

    for (var ti = 0; ti < towerPositions.length; ti++) {
      var tp = towerPositions[ti];
      var towerGroup = new THREE.Group();

      // Tower body 3x4x3
      var bodyGeo = new THREE.BoxGeometry(3, 4, 3);
      var body = new THREE.Mesh(bodyGeo, towerMat);
      body.position.set(0, 2, 0);
      towerGroup.add(body);

      // Roof overhang
      var roofGeo = new THREE.BoxGeometry(3.8, 0.3, 3.8);
      var roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 4.15, 0);
      towerGroup.add(roof);

      // Platform for sniper
      var platGeo = new THREE.BoxGeometry(2.8, 0.15, 2.8);
      var platMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
      var plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(0, 4, 0);
      towerGroup.add(plat);

      // Sandbag (small box)
      var bagGeo = new THREE.BoxGeometry(2.4, 0.5, 0.4);
      var bagMat = new THREE.MeshLambertMaterial({ color: 0x997744 });
      var bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(0, 4.25, -1.2);
      towerGroup.add(bag);

      towerGroup.position.set(tp.x, 1, tp.z);
      sc.add(towerGroup);
      _guardTowers.push(towerGroup);
    }
  }

  function _buildSupplyChests(sc) {
    // Scatter supply crates around the area for extra charges
    var cratePositions = [
      { x: -8, z:  6 },
      { x:  6, z: -6 },
      { x: -5, z: -8 },
      { x:  9, z:  8 },
    ];
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x4A6A2A });
    for (var ci = 0; ci < cratePositions.length; ci++) {
      var cp = cratePositions[ci];
      var cGeo = new THREE.BoxGeometry(1.2, 1.0, 0.9);
      var crate = new THREE.Mesh(cGeo, crateMat);
      crate.position.set(cp.x, 1.5, cp.z);
      sc.add(crate);
      _supplyChests.push({ mesh: crate, x: cp.x, z: cp.z, collected: false });
    }
  }

  function _buildEnemies(sc) {
    var enemyMat = new THREE.MeshLambertMaterial({ color: 0x556633 });
    var headMat  = new THREE.MeshLambertMaterial({ color: 0xc8a87a });

    // 4 enemies each side of bridge (total 8)
    var spawnPositions = [
      { x: -16, z: -3 }, { x: -14, z:  3 }, { x: -12, z: -2 }, { x: -10, z:  4 },
      {  x: 16, z: -3 }, {  x: 14, z:  3 }, {  x: 12, z: -2 }, {  x: 10, z:  4 },
    ];

    for (var i = 0; i < spawnPositions.length; i++) {
      var sp = spawnPositions[i];
      var enemyGroup = new THREE.Group();
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.1, 0.4);
      var body = new THREE.Mesh(bodyGeo, enemyMat);
      body.position.y = 0.55;
      enemyGroup.add(body);
      var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.3;
      enemyGroup.add(head);
      enemyGroup.position.set(sp.x, 1, sp.z);
      sc.add(enemyGroup);

      _enemies.push({
        group: enemyGroup,
        x: sp.x, z: sp.z,
        alive: true,
        hp: 100,
        kind: 'guard',
        patrolPhase: Math.random() * Math.PI * 2,
      });
    }

    // Sniper on each guard tower (2 snipers)
    var sniperMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var sniperPositions = [{ x: -17, y: 5.2, z: 0 }, { x: 17, y: 5.2, z: 0 }];
    for (var si = 0; si < sniperPositions.length; si++) {
      var svp = sniperPositions[si];
      var sg = new THREE.Group();
      var sb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.4), sniperMat);
      sb.position.y = 0.5;
      sg.add(sb);
      var sh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), headMat);
      sh.position.y = 1.15;
      sg.add(sh);
      sg.position.set(svp.x, svp.y, svp.z);
      sc.add(sg);
      _enemies.push({ group: sg, x: svp.x, z: svp.z, alive: true, hp: 80, kind: 'sniper', patrolPhase: 0 });
    }
  }

  function _buildJeep(sc) {
    _jeepGroup = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(3.5, 1.2, 1.8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var jeepBody = new THREE.Mesh(bodyGeo, bodyMat);
    jeepBody.position.y = 0.8;
    _jeepGroup.add(jeepBody);

    var cabGeo = new THREE.BoxGeometry(1.8, 0.9, 1.7);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x3a4a3a });
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(-0.5, 1.65, 0);
    _jeepGroup.add(cab);

    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wPositions = [
      { x: -1.3, z: -1.1 }, { x: -1.3, z: 1.1 },
      {  x: 1.3, z: -1.1 }, {  x: 1.3, z: 1.1 },
    ];
    for (var wi = 0; wi < wPositions.length; wi++) {
      var wGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10);
      var wheel = new THREE.Mesh(wGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wPositions[wi].x, 0.45, wPositions[wi].z);
      _jeepGroup.add(wheel);
    }

    // Start far north, out of play area
    _jeepGroup.position.set(0, 1, 60);
    _jeepGroup.visible = false;
    sc.add(_jeepGroup);
  }

  function _buildConvoy(sc) {
    var truckMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var convoyX = [0, -5, 5];
    for (var ti = 0; ti < 3; ti++) {
      var tg = new THREE.Group();

      var truckBodyGeo = new THREE.BoxGeometry(4, 1.5, 2);
      var tb = new THREE.Mesh(truckBodyGeo, truckMat);
      tb.position.y = 1.0;
      tg.add(tb);

      var truckCabGeo = new THREE.BoxGeometry(1.5, 1.2, 1.9);
      var truckCabMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var tc = new THREE.Mesh(truckCabGeo, truckCabMat);
      tc.position.set(-1.8, 1.6, 0);
      tg.add(tc);

      var twMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      var twPos = [
        { x: -1.6, z: -1.2 }, { x: -1.6, z: 1.2 },
        {  x: 1.4, z: -1.2 }, {  x: 1.4, z: 1.2 },
      ];
      for (var wi = 0; wi < twPos.length; wi++) {
        var twGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
        var tw = new THREE.Mesh(twGeo, twMat);
        tw.rotation.z = Math.PI / 2;
        tw.position.set(twPos[wi].x, 0.45, twPos[wi].z);
        tg.add(tw);
      }

      tg.position.set(convoyX[ti], 1, 80 + ti * 6);
      tg.visible = false;
      sc.add(tg);
      _convoyTrucks.push({ group: tg, startZ: 80 + ti * 6, alive: true });
    }
  }

  function _buildExtractionZone(sc) {
    var exGeo = new THREE.BoxGeometry(4, 0.2, 4);
    var exMat = new THREE.MeshLambertMaterial({ color: 0x00FF88, transparent: true, opacity: 0.6 });
    _extractionZone = new THREE.Mesh(exGeo, exMat);
    _extractionZone.position.set(0, -15, 0);  // bottom of ravine
    _extractionZone.visible = false;
    sc.add(_extractionZone);
  }

  // ── Charge placement ────────────────────────────────────────────────────────
  function _tryPlaceCharge() {
    if (!_active || _missionDone || _missionFailed) return;
    if (_playerCharges <= 0) {
      _toast('No charges remaining! Find supply crates.', '#ff6644');
      return;
    }
    var pp = _playerPos();
    if (!pp) return;

    // Find nearest column within range
    var nearest = null;
    var nearestDist = Infinity;
    for (var ci = 0; ci < _columns.length; ci++) {
      var col = _columns[ci];
      if (col.hasCharge) continue;
      var dx = pp.x - (col.x + (_bridgeGroup ? _bridgeGroup.position.x : 0));
      var dz = pp.z - (col.z + (_bridgeGroup ? _bridgeGroup.position.z : 0));
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = col;
      }
    }

    if (!nearest || nearestDist > CHARGE_PLACE_RANGE) {
      _toast('Approach a support column to place charge (within ' + CHARGE_PLACE_RANGE + ' units)', '#ffcc44');
      return;
    }

    // Place charge on column
    nearest.hasCharge = true;
    _playerCharges--;
    _chargesPlaced++;

    var sc = _getScene();
    if (sc) {
      // Visual charge block on column
      var cGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
      var cMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
      var cMesh = new THREE.Mesh(cGeo, cMat);
      var bx = nearest.x + (_bridgeGroup ? _bridgeGroup.position.x : 0);
      var bz = nearest.z + (_bridgeGroup ? _bridgeGroup.position.z : 0);
      cMesh.position.set(bx, -0.5, bz);
      sc.add(cMesh);

      // Blinking PointLight
      var light = new THREE.PointLight(0xFF4400, 0.8, 3);
      light.position.set(bx, -0.5, bz);
      sc.add(light);

      _placedCharges.push({
        mesh: cMesh,
        light: light,
        col: nearest,
        blinkTimer: 0,
        isWeakPoint: nearest.isWeak,
      });
    }

    var msg = nearest.isWeak
      ? 'Charge placed on WEAK POINT — enhanced collapse!'
      : 'Charge placed on support column';
    _toast(msg, nearest.isWeak ? '#44ff88' : '#ffcc44');
    _playBeep(1200, 0.12, 0.3);

    // Check if detonator can be armed
    if (_chargesPlaced >= 4) {
      _detonatorArmed = true;
      _toast('DETONATOR ARMED — press SPACE to detonate', '#ff4444');
    }
    _updateHUD();
  }

  // ── Detonation ──────────────────────────────────────────────────────────────
  function _startDetonation() {
    if (!_active || _missionDone || _missionFailed) return;
    if (!_detonatorArmed) {
      _toast('Need at least 4 charges to detonate!', '#ff4444');
      return;
    }
    if (_countdown >= 0) return; // already counting
    _countdown = COUNTDOWN_SECS;
    _toast('DETONATING IN ' + COUNTDOWN_SECS + ' SECONDS!', '#ff4444');
    _playBeep(440, 0.3, 0.5);
  }

  function _triggerBridgeCollapse() {
    _bridgeCollapsing = true;
    _collapseTimer = 0;
    _playExplosion();

    var sc = _getScene();
    if (!sc) return;

    // Flash explosion lights on each placed charge
    for (var pi = 0; pi < _placedCharges.length; pi++) {
      var pc = _placedCharges[pi];
      if (pc.isWeakPoint) {
        _spawnExplosion(sc, pc.mesh.position.x, pc.mesh.position.y, pc.mesh.position.z, 2.5);
      } else {
        _spawnExplosion(sc, pc.mesh.position.x, pc.mesh.position.y, pc.mesh.position.z, 1.5);
      }
    }

    var isPartial = _chargesPlaced < TOTAL_CHARGES;
    if (isPartial) {
      _toast('PARTIAL DEMOLITION — ' + _chargesPlaced + '/6 charges. Convoy may still cross!', '#ffaa44');
    } else {
      _toast('FULL DEMOLITION — BRIDGE COLLAPSING!', '#44ff88');
    }

    // Show extraction zone
    if (_extractionZone) {
      _extractionZone.visible = true;
    }

    // Camera shake
    window._cameraShake = { intensity: 3.5, duration: 2.5 };
  }

  function _spawnExplosion(sc, x, y, z, scale) {
    var geo = new THREE.SphereGeometry(0.6, 10, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xff7722, transparent: true, opacity: 0.95 });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    sc.add(m);
    _particles.push({ mesh: m, mat: mat, t: 0, life: 0.9, grow: scale * 5 });

    // Secondary flash light
    var fl = new THREE.PointLight(0xff6600, 4, 20);
    fl.position.set(x, y, z);
    sc.add(fl);
    _lights.push({ light: fl, timer: 0.35 });
  }

  // ── Supply crate collection ─────────────────────────────────────────────────
  function _checkSupplyCrates(pp) {
    if (!pp) return;
    for (var ci = 0; ci < _supplyChests.length; ci++) {
      var chest = _supplyChests[ci];
      if (chest.collected) continue;
      var dx = pp.x - chest.x;
      var dz = pp.z - chest.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.5) {
        chest.collected = true;
        _playerCharges++;
        var sc = _getScene();
        if (sc && chest.mesh) {
          sc.remove(chest.mesh);
        }
        _toast('Supply crate: +1 demolition charge! [' + _playerCharges + ' remaining]', '#88ffaa');
        _playBeep(880, 0.1, 0.2);
        _updateHUD();
      }
    }
  }

  // ── Enemy update ─────────────────────────────────────────────────────────────
  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;
      // Simple patrol: oscillate in Z
      e.patrolPhase += dt * 0.8;
      if (e.group) {
        e.group.position.z = e.z + Math.sin(e.patrolPhase) * 2;
        e.group.rotation.y = Math.sin(e.patrolPhase * 0.5) * 0.4;
      }
      // If player shoots enemy (integrate with window._enemies hook)
      if (e.hp <= 0) {
        e.alive = false;
        if (e.group) e.group.visible = false;
      }
    }
    // Expose to shooting system
    window._bdEnemies = _enemies;
  }

  function _spawnReinforcements() {
    if (_reinforceArrived) return;
    _reinforceArrived = true;
    var sc = _getScene();
    if (!sc) return;

    // Show jeep arriving from north
    if (_jeepGroup) {
      _jeepGroup.visible = true;
      _jeepGroup.position.set(0, 1, 50);
    }

    // 2 new enemies riding jeep
    var enemyMat = new THREE.MeshLambertMaterial({ color: 0x556633 });
    var headMat  = new THREE.MeshLambertMaterial({ color: 0xc8a87a });
    var rPositions = [{ x: -3, z: 2 }, { x: 3, z: -2 }];
    for (var ri = 0; ri < rPositions.length; ri++) {
      var rp = rPositions[ri];
      var rg = new THREE.Group();
      var rb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.4), enemyMat);
      rb.position.y = 0.55;
      rg.add(rb);
      var rh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), headMat);
      rh.position.y = 1.3;
      rg.add(rh);
      rg.position.set(rp.x, 1, 45);
      sc.add(rg);
      _enemies.push({ group: rg, x: rp.x, z: rp.z, alive: true, hp: 100, kind: 'reinforce', patrolPhase: 0 });
    }

    _toast('REINFORCEMENTS ARRIVING BY JEEP!', '#ff4444');
  }

  function _spawnConvoy() {
    if (_convoyArrived) return;
    _convoyArrived = true;
    for (var ti = 0; ti < _convoyTrucks.length; ti++) {
      _convoyTrucks[ti].group.visible = true;
    }
    _toast('ENEMY CONVOY APPROACHING FROM NORTH! BLOW THE BRIDGE!', '#ff2200');
    _playBeep(330, 0.5, 0.6);
  }

  function _updateConvoy(dt) {
    if (!_convoyArrived || _convoyCrossed) return;

    var speed = 8; // units per second
    var allCrossed = true;

    for (var ti = 0; ti < _convoyTrucks.length; ti++) {
      var t = _convoyTrucks[ti];
      if (!t.alive) continue;
      t.group.position.z -= speed * dt;
      if (t.group.position.z > -60) allCrossed = false;

      // Check if convoy has crossed bridge position (z=0)
      if (!_bridgeCollapsing && t.group.position.z < 0 && !_missionFailed) {
        _missionFailed = true;
        _toast('CONVOY CROSSED THE BRIDGE — MISSION FAILED!', '#ff0000');
      }
    }

    if (allCrossed) _convoyCrossed = true;

    // Move jeep from north toward bridge
    if (_jeepGroup && _jeepGroup.visible) {
      _jeepGroup.position.z -= speed * 0.6 * dt;
    }
  }

  function _updateBridgeCollapse(dt) {
    if (!_bridgeCollapsing || !_bridgeGroup) return;
    _collapseTimer += dt;
    var prog = Math.min(1, _collapseTimer / FALL_DURATION);

    // Tilt and drop bridge
    _bridgeGroup.rotation.x = prog * 0.6;
    _bridgeGroup.position.y = 1 - prog * 18;

    // Also tilt columns
    for (var ci = 0; ci < _columns.length; ci++) {
      if (_columns[ci].mesh) {
        _columns[ci].mesh.rotation.x = prog * 0.4;
      }
    }

    // Partial vs full collapse visual
    var isPartial = _chargesPlaced < TOTAL_CHARGES;
    if (isPartial) {
      // Partial: bridge sags in middle but doesn't fully fall
      _bridgeGroup.rotation.x = prog * 0.25;
      _bridgeGroup.position.y = 1 - prog * 8;
    }

    if (_collapseTimer >= FALL_DURATION && !_missionDone) {
      _missionDone = true;
      if (!isPartial) {
        var score = 3000 + (_chargesPlaced === TOTAL_CHARGES ? 1000 : 0);
        _toast('BRIDGE DESTROYED! MISSION COMPLETE! Score: +' + score, '#44ff88');
        if (window.Marketplace && window.Marketplace.addOKC) {
          window.Marketplace.addOKC(score);
        }
      } else {
        _toast('BRIDGE PARTIALLY DEMOLISHED — Partial score awarded.', '#ffaa44');
        if (window.Marketplace && window.Marketplace.addOKC) {
          window.Marketplace.addOKC(1200);
        }
      }
      _toast('Press R to rappel down to extraction zone', '#00ff88');
    }
  }

  // ── Rappel escape ───────────────────────────────────────────────────────────
  function _startRappel() {
    if (!_bridgeCollapsing && !_missionDone) {
      _toast('You can only rappel after detonation!', '#ff6644');
      return;
    }
    if (_rappelling) return;
    _rappelling = true;
    _rappelTime = 0;
    window._rappelActive = true;
    _toast('RAPPELLING DOWN RAVINE WALL...', '#44ffcc');
  }

  function _updateRappel(dt) {
    if (!_rappelling) return;
    var cam = _getCamera();
    if (!cam) return;
    _rappelTime += dt;
    cam.position.y -= RAPPEL_SPEED * dt;

    // Check if reached extraction zone (y <= -15)
    if (cam.position.y <= -13) {
      _rappelling = false;
      window._rappelActive = false;
      _toast('EXTRACTION ZONE REACHED — MISSION SUCCESS!', '#00ff88');
      window._cameraShake = { intensity: 0.3, duration: 0.5 };
    }
  }

  // ── Particle / light update ─────────────────────────────────────────────────
  function _updateParticles(dt) {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.t += dt;
      var k = p.t / p.life;
      if (k >= 1) {
        var sc = _getScene();
        if (sc) sc.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mat) p.mat.dispose();
        _particles.splice(i, 1);
        continue;
      }
      var s = 1 + k * p.grow;
      p.mesh.scale.set(s, s, s);
      p.mat.opacity = 0.95 * (1 - k);
    }

    for (var li = _lights.length - 1; li >= 0; li--) {
      var lObj = _lights[li];
      lObj.timer -= dt;
      if (lObj.timer <= 0) {
        var lsc = _getScene();
        if (lsc) lsc.remove(lObj.light);
        _lights.splice(li, 1);
        continue;
      }
      lObj.light.intensity = (lObj.timer / 0.35) * 4;
    }
  }

  function _updateChargeBlinks(dt) {
    for (var i = 0; i < _placedCharges.length; i++) {
      var pc = _placedCharges[i];
      pc.blinkTimer += dt;
      var on = Math.floor(pc.blinkTimer * 2) % 2 === 0;
      if (pc.light) pc.light.intensity = on ? 1.2 : 0;
    }
    // Extraction zone pulse
    if (_extractionZone && _extractionZone.visible) {
      var pulse = 0.4 + 0.25 * Math.sin(Date.now() * 0.003);
      _extractionZone.material.opacity = pulse;
    }
  }

  // ── Countdown ───────────────────────────────────────────────────────────────
  function _updateCountdown(dt) {
    if (_countdown < 0) return;
    _countdown -= dt;

    // Beep each second
    var prev = Math.ceil(_countdown + dt);
    var curr = Math.ceil(_countdown);
    if (curr < prev && curr > 0) {
      _playBeep(660, 0.1, 0.3);
    }

    if (_countdown <= 0 && !_bridgeCollapsing) {
      _countdown = -1;
      _triggerBridgeCollapse();
    }
  }

  // ── Key combo for activation ────────────────────────────────────────────────
  function _checkActivationCombo() {
    if (_active) return;
    var now = Date.now() / 1000;
    if (_keyB && _keyD) {
      var diff = Math.abs(_keyBTime - _keyDTime);
      if (diff <= ACTIVATION_WINDOW) {
        _startMission();
      }
    }
  }

  // ── Mission start ────────────────────────────────────────────────────────────
  function _startMission() {
    if (_active) return;
    _active = true;
    _missionTime = 0;
    _playerCharges = START_CHARGES;
    _chargesPlaced = 0;
    _detonatorArmed = false;
    _countdown = -1;
    _bridgeCollapsing = false;
    _collapseTimer = 0;
    _missionDone = false;
    _missionFailed = false;
    _rappelling = false;
    _rappelTime = 0;
    _convoyArrived = false;
    _convoyCrossed = false;
    _reinforceArrived = false;

    var sc = _getScene();
    if (!sc) { _active = false; return; }

    _buildCanyonWalls(sc);
    _buildBridge(sc);
    _buildGuardTowers(sc);
    _buildSupplyChests(sc);
    _buildEnemies(sc);
    _buildJeep(sc);
    _buildConvoy(sc);
    _buildExtractionZone(sc);

    _ensureHUD();
    _updateHUD();

    _toast('BRIDGE DEMOLITION — Plant 6 charges on columns. Press E near columns.', '#ffcc44');
    setTimeout(function () {
      _toast('CONVOY arrives in ' + CONVOY_ARRIVAL + 's. Clear guard towers first!', '#ff8844');
    }, 2000);

    _playBeep(880, 0.15, 0.4);
  }

  // ── Input handling ──────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var now = Date.now() / 1000;
    if (e.key === 'b' || e.key === 'B') { _keyB = true; _keyBTime = now; _checkActivationCombo(); }
    if (e.key === 'd' || e.key === 'D') { _keyD = true; _keyDTime = now; _checkActivationCombo(); }

    if (!_active) return;

    if ((e.key === 'e' || e.key === 'E') && !_keyEConsumed) {
      _keyE = true;
      _keyEConsumed = true;
      _tryPlaceCharge();
    }

    if (e.key === ' ' && !_keySpaceConsumed) {
      _keySpace = true;
      _keySpaceConsumed = true;
      _startDetonation();
    }

    if (e.key === 'r' || e.key === 'R') {
      if (!_keyR) {
        _keyR = true;
        _startRappel();
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'b' || e.key === 'B') _keyB = false;
    if (e.key === 'd' || e.key === 'D') _keyD = false;
    if (e.key === 'e' || e.key === 'E') { _keyE = false; _keyEConsumed = false; }
    if (e.key === ' ') { _keySpace = false; _keySpaceConsumed = false; }
    if (e.key === 'r' || e.key === 'R') _keyR = false;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    if (!_inited) {
      document.addEventListener('keydown', _onKeyDown);
      document.addEventListener('keyup',   _onKeyUp);
      _inited = true;
    }

    _ensureHUD();
  }

  function update(dt) {
    if (!_active) return;
    _missionTime += dt;

    _checkSupplyCrates(_playerPos());
    _updateEnemies(dt);
    _updateChargeBlinks(dt);
    _updateCountdown(dt);
    _updateBridgeCollapse(dt);
    _updateParticles(dt);
    _updateRappel(dt);

    // Spawn reinforcements at T=60
    if (_missionTime >= REINFORCE_TIME && !_reinforceArrived) {
      _spawnReinforcements();
    }

    // Spawn convoy at T=120
    if (_missionTime >= CONVOY_ARRIVAL && !_convoyArrived) {
      _spawnConvoy();
    }

    if (_convoyArrived) {
      _updateConvoy(dt);
    }

    _updateHUD();
  }

  function reset() {
    _active           = false;
    _missionDone      = false;
    _missionFailed    = false;
    _bridgeCollapsing = false;
    _countdown        = -1;
    _rappelling       = false;
    window._rappelActive = false;
    window._bdEnemies = [];

    var sc = _getScene();

    // Remove bridge group
    if (_bridgeGroup && sc) sc.remove(_bridgeGroup);
    _bridgeGroup = null;
    _bridgeSpan  = null;
    _columns     = [];

    // Remove canyon walls
    for (var wi = 0; wi < _canyonWalls.length; wi++) {
      if (sc) sc.remove(_canyonWalls[wi]);
    }
    _canyonWalls = [];

    // Remove guard towers
    for (var ti = 0; ti < _guardTowers.length; ti++) {
      if (sc) sc.remove(_guardTowers[ti]);
    }
    _guardTowers = [];

    // Remove supply chests
    for (var ci = 0; ci < _supplyChests.length; ci++) {
      if (!_supplyChests[ci].collected && sc) sc.remove(_supplyChests[ci].mesh);
    }
    _supplyChests = [];

    // Remove placed charges + lights
    for (var pi = 0; pi < _placedCharges.length; pi++) {
      var pc = _placedCharges[pi];
      if (sc) {
        if (pc.mesh) sc.remove(pc.mesh);
        if (pc.light) sc.remove(pc.light);
      }
    }
    _placedCharges = [];

    // Remove enemies
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (sc && _enemies[ei].group) sc.remove(_enemies[ei].group);
    }
    _enemies = [];

    // Remove jeep
    if (_jeepGroup && sc) sc.remove(_jeepGroup);
    _jeepGroup = null;

    // Remove convoy trucks
    for (var cti = 0; cti < _convoyTrucks.length; cti++) {
      if (sc) sc.remove(_convoyTrucks[cti].group);
    }
    _convoyTrucks = [];

    // Remove extraction zone
    if (_extractionZone && sc) sc.remove(_extractionZone);
    _extractionZone = null;

    // Remove particles / lights
    for (var pri = 0; pri < _particles.length; pri++) {
      var p = _particles[pri];
      if (sc) sc.remove(p.mesh);
      if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mat) p.mat.dispose();
    }
    _particles = [];

    for (var li = 0; li < _lights.length; li++) {
      if (sc) sc.remove(_lights[li].light);
    }
    _lights = [];

    // Hide HUD
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };

})();
