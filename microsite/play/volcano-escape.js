/* ───────────────────────────────────────────────────────────────────────────
   volcano-escape.js — Volcano Escape Mini-Game
   API: window.VolcanoEscape = { init, update, reset }
   Controls:
     V + E (simultaneous, 400ms) → activate
     W / S                       → move forward / backward
     A / D                       → strafe left / right
     Space                       → jump
     Mouse                       → look
     E (near survivor/heli/door) → interact
     F (near C4 target)          → plant C4
     G                           → detonate C4
     R                           → use flare gun (if held)
   ─────────────────────────────────────────────────────────────────────────── */
window.VolcanoEscape = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation ─────────────────────────────────────────────────────────── */
  var _active         = false;
  var _vePressTime    = { V: 0, E: 0 };
  var VE_WINDOW       = 0.4;

  /* ── Game state ─────────────────────────────────────────────────────────── */
  var _playerHP         = 100;
  var _playerDead       = false;
  var _playerWon        = false;
  var _gameTimer        = 300;
  var _survivorsRescued = 0;
  var _survivorsTotal   = 5;

  /* ── Items held ─────────────────────────────────────────────────────────── */
  var _hasGasMask        = false;
  var _gasMaskTimer      = 0;
  var _hasFireSuit       = false;
  var _fireSuitTimer     = 0;
  var _hasFlareGun       = false;
  var _flareUsed         = false;
  var _c4Charges         = 0;
  var _c4Placed          = [];
  var _flareGunExtraTime = 0;

  /* ── Helicopter ─────────────────────────────────────────────────────────── */
  var _heliFuselage     = null;
  var _heliMesh         = null;
  var _heliPos          = null;
  var _heliArrivalDelay = 60;
  var _heliDeparted     = false;
  var _heliBoarding     = false;
  var _heliBoardTimer   = 0;

  /* ── Player ──────────────────────────────────────────────────────────────── */
  var _playerPos  = null;
  var _playerVel  = null;
  var _onGround   = false;
  var _yaw        = 0;
  var _pitch      = 0;
  var _playerMesh = null;

  /* ── Lava ────────────────────────────────────────────────────────────────── */
  var _lavaFlows        = [];
  var _lavaRise         = 0;
  var _lavaPools        = [];
  var _lavaContactTimer = 0;

  /* ── Pyroclastic bombs ───────────────────────────────────────────────────── */
  var _bombs     = [];
  var _bombTimer = 0;
  var _bombNext  = 15;

  /* ── Environment ─────────────────────────────────────────────────────────── */
  var _groundMesh        = null;
  var _volcanoMesh       = null;
  var _stationMesh       = null;
  var _stationDoor       = null;
  var _stationDoorOpen   = false;
  var _bridgeMesh        = null;
  var _bridgeCollapsed   = false;
  var _bridgeSupports    = [];
  var _smokeLights       = [];
  var _ashClouds         = [];
  var _rockfalls         = [];
  var _rockfallTimer     = 0;
  var _rockfallNext      = 8;
  var _groundCracks      = [];
  var _mudslides         = [];

  /* ── Survivors ───────────────────────────────────────────────────────────── */
  var _survivors = [];

  /* ── Supplies ────────────────────────────────────────────────────────────── */
  var _supplies = [];

  /* ── Timing ─────────────────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ── HUD + message ──────────────────────────────────────────────────────── */
  var _hud        = null;
  var _messageEl  = null;
  var _msgTimer   = 0;

  /* ── Input ───────────────────────────────────────────────────────────────── */
  var _keys   = {};
  var _mouseX = 0;
  var _mouseY = 0;

  /* ── Bound handlers ──────────────────────────────────────────────────────── */
  var _boundKeyDown   = null;
  var _boundKeyUp     = null;
  var _boundMouseMove = null;
  var _boundClick     = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function removeFromScene(mesh) {
    if (mesh && mesh.parent) {
      mesh.parent.remove(mesh);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    _scene.background = new THREE.Color(0xCC4400);
    _scene.fog        = new THREE.FogExp2(0xCC5500, 0.015);

    var ambLight = new THREE.AmbientLight(0xFF6633, 0.5);
    _scene.add(ambLight);

    var dirLight = new THREE.DirectionalLight(0xFF8844, 0.9);
    dirLight.position.set(40, 80, -20);
    _scene.add(dirLight);

    /* Ground — volcanic rock */
    var groundGeo = new THREE.PlaneGeometry(200, 200);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x222211 });
    _groundMesh   = new THREE.Mesh(groundGeo, groundMat);
    _groundMesh.rotation.x = -Math.PI / 2;
    _groundMesh.position.set(0, 0, 0);
    _scene.add(_groundMesh);

    /* Main volcano — CylinderGeometry r=15 h=25 at center */
    var volGeo   = new THREE.CylinderGeometry(0, 15, 25, 16);
    var volMat   = new THREE.MeshLambertMaterial({ color: 0x332211 });
    _volcanoMesh = new THREE.Mesh(volGeo, volMat);
    _volcanoMesh.position.set(0, 12.5, 0);
    _scene.add(_volcanoMesh);

    /* Smoke PointLights at peak */
    var peakPositions = [
      [0, 26, 0], [2, 25, 2], [-2, 25, -2]
    ];
    for (var li = 0; li < peakPositions.length; li++) {
      var pl = new THREE.PointLight(0xFF6600, 2.0, 40);
      pl.position.set(peakPositions[li][0], peakPositions[li][1], peakPositions[li][2]);
      _scene.add(pl);
      _smokeLights.push(pl);
    }

    /* Lava glow under caldera */
    var lavaGlow = new THREE.PointLight(0xFF4400, 1.5, 30);
    lavaGlow.position.set(0, 2, 0);
    _scene.add(lavaGlow);

    /* Caldera cap */
    var calGeo = new THREE.CylinderGeometry(2, 4, 1, 12);
    var calMat = new THREE.MeshLambertMaterial({
      color: 0xFF4400,
      emissive: new THREE.Color(0xFF2200),
      emissiveIntensity: 1
    });
    var calMesh = new THREE.Mesh(calGeo, calMat);
    calMesh.position.set(0, 25.5, 0);
    _scene.add(calMesh);
  }

  function buildLavaFlows() {
    /* 8 strips radiating outward at 45-degree intervals */
    for (var i = 0; i < 8; i++) {
      var angleRad    = (i * 45 * Math.PI) / 180;
      var stripLen    = 60;
      var stripWidth  = 3;
      var geo = new THREE.PlaneGeometry(stripWidth, stripLen);
      var mat = new THREE.MeshLambertMaterial({
        color: 0xFF4400,
        emissive: new THREE.Color(0xFF2200),
        emissiveIntensity: 0.8
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -angleRad;
      mesh.position.set(Math.sin(angleRad) * 16, 0.05, Math.cos(angleRad) * 16);
      mesh.scale.z = 0.01;
      _scene.add(mesh);
      _lavaFlows.push({
        mesh:   mesh,
        angle:  angleRad,
        extent: 0,
        max:    stripLen
      });
    }
  }

  function buildResearchStation() {
    /* Station: BoxGeometry 20x4x10 */
    var stGeo    = new THREE.BoxGeometry(20, 4, 10);
    var stMat    = new THREE.MeshLambertMaterial({ color: 0x445544 });
    _stationMesh = new THREE.Mesh(stGeo, stMat);
    _stationMesh.position.set(0, 2, -50);
    _scene.add(_stationMesh);

    /* Roof detail */
    var roofGeo  = new THREE.BoxGeometry(21, 0.5, 11);
    var roofMat  = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, 4.25, -50);
    _scene.add(roofMesh);

    /* Station door — south face */
    var doorGeo  = new THREE.BoxGeometry(2, 3, 0.3);
    var doorMat  = new THREE.MeshLambertMaterial({ color: 0x334433 });
    _stationDoor = new THREE.Mesh(doorGeo, doorMat);
    _stationDoor.position.set(0, 1.5, -44.8);
    _scene.add(_stationDoor);
  }

  function buildBridge() {
    /* Bridge: BoxGeometry crossing lava river gap */
    var bGeo   = new THREE.BoxGeometry(6, 0.5, 10);
    var bMat   = new THREE.MeshLambertMaterial({ color: 0x554433 });
    _bridgeMesh = new THREE.Mesh(bGeo, bMat);
    _bridgeMesh.position.set(20, 0.25, -25);
    _scene.add(_bridgeMesh);

    /* Lava river underneath */
    var riverGeo = new THREE.PlaneGeometry(10, 10);
    var riverMat = new THREE.MeshLambertMaterial({
      color: 0xFF4400,
      emissive: new THREE.Color(0xFF2200),
      emissiveIntensity: 0.9
    });
    var riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.rotation.x = -Math.PI / 2;
    riverMesh.position.set(20, -0.1, -25);
    _scene.add(riverMesh);

    /* Bridge supports — can be C4'd */
    var supDefs = [ [17, -25], [23, -25] ];
    for (var i = 0; i < supDefs.length; i++) {
      var supGeo  = new THREE.BoxGeometry(1, 3, 1);
      var supMat  = new THREE.MeshLambertMaterial({ color: 0x443322 });
      var supMesh = new THREE.Mesh(supGeo, supMat);
      supMesh.position.set(supDefs[i][0], 1.5, supDefs[i][1]);
      _scene.add(supMesh);
      _bridgeSupports.push({ mesh: supMesh, hp: 100 });
    }
  }

  function buildSurvivors() {
    /* 5 researchers: 2 station, 1 cliff, 2 beach */
    var defs = [
      { x: -2,  y: 1, z: -50, type: 'station' },
      { x:  2,  y: 1, z: -50, type: 'station' },
      { x: 35,  y: 1, z: -65, type: 'cliff'   },
      { x: -15, y: 1, z: -85, type: 'beach'   },
      { x: -5,  y: 1, z: -82, type: 'beach'   }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d    = defs[i];
      var geo  = new THREE.BoxGeometry(0.6, 1.8, 0.6);
      var mat  = new THREE.MeshLambertMaterial({ color: 0xFFDDCC });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, d.y, d.z);
      if (d.type === 'station') { mesh.visible = false; }
      _scene.add(mesh);
      _survivors.push({
        mesh:      mesh,
        pos:       new THREE.Vector3(d.x, d.y, d.z),
        vel:       new THREE.Vector3(0, 0, 0),
        type:      d.type,
        rescued:   false,
        following: false
      });
    }
  }

  function buildHelicopter() {
    _heliPos = new THREE.Vector3(-10, 2, -95);

    /* Fuselage BoxGeometry */
    var fGeo      = new THREE.BoxGeometry(5, 2, 2);
    var fMat      = new THREE.MeshLambertMaterial({ color: 0x334455 });
    _heliFuselage = new THREE.Mesh(fGeo, fMat);
    _heliFuselage.position.copy(_heliPos);
    _scene.add(_heliFuselage);

    /* Tail boom */
    var tailGeo  = new THREE.BoxGeometry(0.5, 0.8, 3);
    var tailMat  = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var tailMesh = new THREE.Mesh(tailGeo, tailMat);
    tailMesh.position.set(_heliPos.x + 3.5, _heliPos.y, _heliPos.z);
    _scene.add(tailMesh);

    /* Rotor — CylinderGeometry flat disc */
    var rotorGeo  = new THREE.CylinderGeometry(3, 3, 0.1, 8);
    var rotorMat  = new THREE.MeshLambertMaterial({ color: 0x223344, transparent: true, opacity: 0.6 });
    var rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
    rotorMesh.position.set(_heliPos.x, _heliPos.y + 1.5, _heliPos.z);
    _scene.add(rotorMesh);

    /* Landing light */
    var heliLight = new THREE.PointLight(0xFFFFAA, 1.5, 25);
    heliLight.position.set(_heliPos.x, _heliPos.y + 3, _heliPos.z);
    _scene.add(heliLight);

    _heliMesh = _heliFuselage;
  }

  function buildSupplies() {
    var defs = [
      { x:  8,  y: 0.4, z: -48, type: 'gasmask',  color: 0x556655, geom: 'box'  },
      { x: 25,  y: 0.4, z: -30, type: 'firesuit',  color: 0xCC8833, geom: 'box'  },
      { x: 30,  y: 0.4, z: -60, type: 'flaregun',  color: 0xFF6600, geom: 'cyl'  },
      { x: -5,  y: 0.4, z: -43, type: 'c4',        color: 0xFF4400, geom: 'box'  },
      { x:  5,  y: 0.4, z: -44, type: 'c4',        color: 0xFF4400, geom: 'box'  }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d   = defs[i];
      var geo = (d.geom === 'cyl')
        ? new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8)
        : new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var mat  = new THREE.MeshLambertMaterial({ color: d.color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, d.y, d.z);
      _scene.add(mesh);
      _supplies.push({ mesh: mesh, pos: new THREE.Vector3(d.x, d.y, d.z), type: d.type, taken: false });
    }
  }

  function buildAshClouds() {
    var pos = [ [-10, -35], [15, -55], [0, -70], [-20, -80] ];
    for (var i = 0; i < pos.length; i++) {
      var geo  = new THREE.SphereGeometry(4, 8, 6);
      var mat  = new THREE.MeshLambertMaterial({ color: 0x666655, transparent: true, opacity: 0.5 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos[i][0], 2, pos[i][1]);
      _scene.add(mesh);
      _ashClouds.push({
        mesh: mesh,
        pos:  new THREE.Vector3(pos[i][0], 2, pos[i][1]),
        vel:  new THREE.Vector3(randRange(-1, 1), 0, randRange(-0.5, 0.5))
      });
    }
  }

  function buildGroundCracks() {
    var defs = [
      { x: -5, z: -35, w: 12 },
      { x:  5, z: -58, w: 8  },
      { x: -8, z: -75, w: 10 }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      /* LineSegments gap visual */
      var pts = [
        new THREE.Vector3(d.x - d.w / 2, 0.1, d.z),
        new THREE.Vector3(d.x + d.w / 2, 0.1, d.z)
      ];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var lineMat = new THREE.LineBasicMaterial({ color: 0xFF2200 });
      var line    = new THREE.LineSegments(lineGeo, lineMat);
      _scene.add(line);

      /* Dark gap plane */
      var pGeo  = new THREE.PlaneGeometry(d.w, 0.5);
      var pMat  = new THREE.MeshLambertMaterial({ color: 0x110000 });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.rotation.x = -Math.PI / 2;
      pMesh.position.set(d.x, 0.08, d.z);
      _scene.add(pMesh);

      _groundCracks.push({
        mesh:  pMesh,
        line:  line,
        pos:   new THREE.Vector3(d.x, 0, d.z),
        width: d.w,
        deadly: true
      });
    }
  }

  function buildMudslides() {
    var defs = [
      { x: -18, z: -40, w: 5, depth: 20, dir:  1 },
      { x:  22, z: -60, w: 5, depth: 20, dir: -1 }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d    = defs[i];
      var geo  = new THREE.PlaneGeometry(d.w, d.depth);
      var mat  = new THREE.MeshLambertMaterial({ color: 0x553322, transparent: true, opacity: 0.85 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(d.x, 0.06, d.z);
      _scene.add(mesh);
      _mudslides.push({ mesh: mesh, pos: new THREE.Vector3(d.x, 0, d.z), width: d.w, depth: d.depth, dir: d.dir });
    }
  }

  function buildCliffEdge() {
    var cGeo  = new THREE.BoxGeometry(5, 1, 2);
    var cMat  = new THREE.MeshLambertMaterial({ color: 0x332211 });
    var cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.set(35, 0.5, -65);
    _scene.add(cMesh);
  }

  function buildBeachCamp() {
    /* Sandy north beach */
    var bGeo  = new THREE.PlaneGeometry(40, 20);
    var bMat  = new THREE.MeshLambertMaterial({ color: 0xDDCC99 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.rotation.x = -Math.PI / 2;
    bMesh.position.set(-10, 0.02, -95);
    _scene.add(bMesh);

    /* Tents */
    for (var i = 0; i < 2; i++) {
      var tGeo  = new THREE.ConeGeometry(1.5, 2, 6);
      var tMat  = new THREE.MeshLambertMaterial({ color: 0x446644 });
      var tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(-20 + i * 8, 1, -90);
      _scene.add(tMesh);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'volcano-escape-hud';
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)', 'color:#FF9944', 'font-family:monospace',
      'font-size:13px', 'padding:6px 14px', 'border-radius:6px',
      'pointer-events:none', 'z-index:9999', 'white-space:nowrap',
      'border:1px solid #FF6600'
    ].join(';');
    document.body.appendChild(_hud);
    updateHUD();
  }

  function updateHUD() {
    if (!_hud) return;

    /* Nearest lava distance */
    var minDist = 9999;
    var i;
    if (_playerPos) {
      for (i = 0; i < _lavaFlows.length; i++) {
        var f   = _lavaFlows[i];
        var tx  = Math.sin(f.angle) * (16 + f.extent);
        var tz  = Math.cos(f.angle) * (16 + f.extent);
        var dxf = _playerPos.x - tx;
        var dzf = _playerPos.z - tz;
        var df  = Math.sqrt(dxf * dxf + dzf * dzf);
        if (df < minDist) minDist = df;
      }
      for (i = 0; i < _lavaPools.length; i++) {
        var pd = distXZ(_playerPos, _lavaPools[i].pos) - _lavaPools[i].radius;
        if (pd < minDist) minDist = pd;
      }
      if (minDist < 0) minDist = 0;
    }

    var mm    = Math.floor(_gameTimer / 60);
    var ss    = Math.floor(_gameTimer % 60);
    var ssStr = ss < 10 ? '0' + ss : '' + ss;
    var mmStr = mm < 10 ? '0' + mm : '' + mm;

    var heliStr;
    if (_heliBoarding)             heliStr = 'BOARDING';
    else if (_heliArrivalDelay > 0) heliStr = Math.ceil(_heliArrivalDelay) + 's AWAY';
    else                           heliStr = 'READY';

    var items = [];
    if (_hasGasMask  && _gasMaskTimer > 0)   items.push('GASMASK(' + Math.ceil(_gasMaskTimer) + 's)');
    if (_hasFireSuit && _fireSuitTimer > 0)   items.push('FIRESUIT(' + Math.ceil(_fireSuitTimer) + 's)');
    if (_hasFlareGun && !_flareUsed)          items.push('FLARE[R]');
    if (_c4Charges > 0)                       items.push('C4x' + _c4Charges + '[F/G]');
    var itemStr = items.length ? ' | ' + items.join(' ') : '';

    _hud.textContent =
      'VOLCANO ESCAPE [HP: ' + Math.ceil(_playerHP) + '] ' +
      '[SURVIVORS: ' + _survivorsRescued + '/' + _survivorsTotal + '] ' +
      '[LAVA DISTANCE: ' + minDist.toFixed(1) + 'm] ' +
      '[TIME: ' + mmStr + ':' + ssStr + '] | HELI: ' + heliStr + itemStr;
  }

  function removeHUD() {
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }
  }

  function showMessage(txt) {
    if (!_messageEl) {
      _messageEl = document.createElement('div');
      _messageEl.style.cssText = [
        'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)', 'color:#FFBB44', 'font-family:monospace',
        'font-size:14px', 'padding:6px 16px', 'border-radius:5px',
        'pointer-events:none', 'z-index:9998'
      ].join(';');
      document.body.appendChild(_messageEl);
    }
    _messageEl.textContent = txt;
    _messageEl.style.display = 'block';
    _msgTimer = 3.5;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k   = e.key.toUpperCase();
    var now = performance.now() / 1000;
    _keys[k] = true;

    if (k === 'V') _vePressTime.V = now;
    if (k === 'E') _vePressTime.E = now;

    if (!_active) {
      if ((k === 'V' || k === 'E') &&
          _vePressTime.V > 0 && _vePressTime.E > 0 &&
          Math.abs(_vePressTime.V - _vePressTime.E) < VE_WINDOW) {
        activate();
      }
      return;
    }

    if (_playerDead || _playerWon) {
      /* Allow re-activate on V+E */
      if ((k === 'V' || k === 'E') &&
          _vePressTime.V > 0 && _vePressTime.E > 0 &&
          Math.abs(_vePressTime.V - _vePressTime.E) < VE_WINDOW) {
        reset();
        activate();
      }
      return;
    }

    if (k === 'E') handleInteract();
    if (k === 'R' && _hasFlareGun && !_flareUsed) useFlareGun();
    if (k === 'G') detonateC4();
    if (k === 'F') plantC4();
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    var sens = 0.002;
    _yaw   -= e.movementX * sens;
    _pitch -= e.movementY * sens;
    _pitch  = clamp(_pitch, -1.2, 1.2);
  }

  function onClick() {
    if (!_active) return;
    if (_canvas && document.pointerLockElement !== _canvas) {
      _canvas.requestPointerLock();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTION
  ════════════════════════════════════════════════════════════════════════ */

  function handleInteract() {
    if (!_playerPos) return;

    /* Board helicopter */
    if (_heliPos && distXZ(_playerPos, _heliPos) < 6 && _heliArrivalDelay <= 0 && !_heliBoarding) {
      _heliBoarding  = true;
      _heliBoardTimer = 3;
      showMessage('Boarding helicopter...');
      return;
    }

    /* Rescue survivors */
    var i;
    for (i = 0; i < _survivors.length; i++) {
      var s = _survivors[i];
      if (s.rescued || s.following) continue;
      if (dist3(_playerPos, s.pos) > 3) continue;

      if (s.type === 'station') {
        if (!_stationDoorOpen) {
          showMessage('Door is blocked! Plant C4 near it (F), then detonate (G).');
          return;
        }
        s.mesh.visible = true;
      }
      s.rescued   = true;
      s.following = true;
      _survivorsRescued++;
      var msgs = {
        station: 'Researcher rescued from station! ',
        cliff:   'Pulled researcher from cliff! ',
        beach:   'Convinced researcher to follow! '
      };
      showMessage((msgs[s.type] || 'Rescued! ') + _survivorsRescued + '/' + _survivorsTotal);
      return;
    }

    /* Pick up supplies */
    for (i = 0; i < _supplies.length; i++) {
      var sup = _supplies[i];
      if (sup.taken) continue;
      if (dist3(_playerPos, sup.pos) > 2) continue;

      sup.taken = true;
      removeFromScene(sup.mesh);

      if (sup.type === 'gasmask') {
        _hasGasMask   = true;
        _gasMaskTimer = 90;
        showMessage('Gas mask acquired! Ash damage halved for 90s.');
      } else if (sup.type === 'firesuit') {
        _hasFireSuit   = true;
        _fireSuitTimer = 60;
        showMessage('Fire-retardant suit on! Lava damage halved for 60s.');
      } else if (sup.type === 'flaregun') {
        _hasFlareGun = true;
        showMessage('Flare gun acquired! Press R to signal helicopter.');
      } else if (sup.type === 'c4') {
        _c4Charges++;
        showMessage('C4 charge acquired! F to plant near target, G to detonate. Charges: ' + _c4Charges);
      }
      return;
    }
  }

  function plantC4() {
    if (_c4Charges <= 0 || !_playerPos) return;

    /* Station door */
    var doorPos = new THREE.Vector3(0, 1.5, -44.8);
    if (dist3(_playerPos, doorPos) < 4) {
      _c4Charges--;
      var g1   = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var m1   = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF2200), emissiveIntensity: 1 });
      var mesh1 = new THREE.Mesh(g1, m1);
      mesh1.position.copy(doorPos);
      _scene.add(mesh1);
      _c4Placed.push({ mesh: mesh1, pos: doorPos.clone(), targetId: 'station_door' });
      showMessage('C4 planted on station door! G to detonate.');
      return;
    }

    /* Bridge supports */
    for (var i = 0; i < _bridgeSupports.length; i++) {
      var bs = _bridgeSupports[i];
      if (bs.hp <= 0) continue;
      if (dist3(_playerPos, bs.mesh.position) < 3) {
        _c4Charges--;
        var g2    = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        var m2    = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF2200), emissiveIntensity: 1 });
        var mesh2 = new THREE.Mesh(g2, m2);
        mesh2.position.copy(bs.mesh.position);
        _scene.add(mesh2);
        _c4Placed.push({ mesh: mesh2, pos: bs.mesh.position.clone(), targetId: 'bridge_support_' + i });
        showMessage('C4 planted on bridge support! G to detonate.');
        return;
      }
    }

    showMessage('No valid target nearby. Get close to a door or bridge support.');
  }

  function detonateC4() {
    if (_c4Placed.length === 0) { showMessage('No C4 placed.'); return; }

    var i;
    for (i = 0; i < _c4Placed.length; i++) {
      var charge = _c4Placed[i];
      removeFromScene(charge.mesh);
      spawnExplosionAt(charge.pos);

      if (charge.targetId === 'station_door') {
        removeFromScene(_stationDoor);
        _stationDoorOpen = true;
        /* Reveal station survivors */
        var si;
        for (si = 0; si < _survivors.length; si++) {
          if (_survivors[si].type === 'station') _survivors[si].mesh.visible = true;
        }
        showMessage('BOOM! Station door blown. Survivors can now exit!');

      } else if (charge.targetId.indexOf('bridge_support_') === 0) {
        var idx = parseInt(charge.targetId.replace('bridge_support_', ''), 10);
        if (_bridgeSupports[idx]) {
          _bridgeSupports[idx].hp = 0;
          removeFromScene(_bridgeSupports[idx].mesh);
          /* Check if all supports gone */
          var allDown = true;
          var bi;
          for (bi = 0; bi < _bridgeSupports.length; bi++) {
            if (_bridgeSupports[bi].hp > 0) { allDown = false; break; }
          }
          if (allDown && !_bridgeCollapsed) {
            _bridgeCollapsed = true;
            if (_bridgeMesh) _bridgeMesh.position.y -= 5;
            showMessage('Bridge collapsed into lava!');
          } else {
            showMessage('Support blown! Bridge weakened.');
          }
        }
      }
    }
    _c4Placed = [];
  }

  function spawnExplosionAt(pos) {
    var geo  = new THREE.SphereGeometry(2, 8, 6);
    var mat  = new THREE.MeshLambertMaterial({
      color: 0xFF8800,
      emissive: new THREE.Color(0xFF4400),
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    /* Piggyback on _bombs for self-cleanup */
    _bombs.push({ mesh: mesh, pos: pos.clone(), vel: new THREE.Vector3(), landed: true, landPos: pos.clone(), timer: 0.5, poolCreated: true, isExplosion: true });
  }

  function useFlareGun() {
    _flareUsed   = true;
    _hasFlareGun = false;
    _heliArrivalDelay = Math.max(0, _heliArrivalDelay - 30);
    _flareGunExtraTime = 300;

    var geo  = new THREE.SphereGeometry(0.15, 6, 4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: new THREE.Color(0xFF4400), emissiveIntensity: 2 });
    var fmesh = new THREE.Mesh(geo, mat);
    if (_playerPos) fmesh.position.copy(_playerPos);
    _scene.add(fmesh);
    _bombs.push({
      mesh: fmesh,
      vel:  new THREE.Vector3(0, 15, -5),
      pos:  _playerPos ? _playerPos.clone() : new THREE.Vector3(0, 2, 0),
      landed: false, landPos: null, timer: 4, poolCreated: true, isFlare: true
    });

    showMessage('Flare fired! Helicopter alerted — arrives 30s early, waits 5 extra minutes!');
  }

  /* ════════════════════════════════════════════════════════════════════════
     PHYSICS / MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (!_playerPos || !_playerVel) return;

    var sinY = Math.sin(_yaw);
    var cosY = Math.cos(_yaw);
    var mx   = 0;
    var mz   = 0;

    if (_keys['W']) { mx -= sinY; mz -= cosY; }
    if (_keys['S']) { mx += sinY; mz += cosY; }
    if (_keys['A']) { mx -= cosY; mz += sinY; }
    if (_keys['D']) { mx += cosY; mz -= sinY; }

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }

    _playerVel.x += mx * 8 * dt * 6;
    _playerVel.z += mz * 8 * dt * 6;
    _playerVel.x *= 0.82;
    _playerVel.z *= 0.82;

    if (_keys[' '] && _onGround) {
      _playerVel.y = 10;
      _onGround    = false;
    }

    if (!_onGround) _playerVel.y -= 20 * dt;

    _playerPos.x += _playerVel.x * dt;
    _playerPos.y += _playerVel.y * dt;
    _playerPos.z += _playerVel.z * dt;

    if (_playerPos.y < 1) {
      _playerPos.y = 1;
      _playerVel.y = 0;
      _onGround    = true;
    }

    _playerPos.x = clamp(_playerPos.x, -95, 95);
    _playerPos.z = clamp(_playerPos.z, -99, 95);

    _camera.position.set(_playerPos.x, _playerPos.y + 0.6, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _yaw;
    _camera.rotation.x     = _pitch;

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y - 0.3, _playerPos.z);
      _playerMesh.rotation.y = _yaw;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HAZARD CHECKS
  ════════════════════════════════════════════════════════════════════════ */

  function checkLavaContact(dt) {
    if (!_playerPos) return;
    var onLava = false;
    var i;

    /* Near volcano center */
    var distCenter = Math.sqrt(_playerPos.x * _playerPos.x + _playerPos.z * _playerPos.z);
    if (distCenter < 14) onLava = true;

    /* Lava flow strips */
    if (!onLava) {
      for (i = 0; i < _lavaFlows.length; i++) {
        var f   = _lavaFlows[i];
        var mid = 16 + f.extent / 2;
        var dx  = _playerPos.x - Math.sin(f.angle) * mid;
        var dz  = _playerPos.z - Math.cos(f.angle) * mid;
        if (Math.sqrt(dx * dx + dz * dz) < 2.5) { onLava = true; break; }
      }
    }

    /* Lava pools */
    if (!onLava) {
      for (i = 0; i < _lavaPools.length; i++) {
        if (distXZ(_playerPos, _lavaPools[i].pos) < _lavaPools[i].radius) { onLava = true; break; }
      }
    }

    if (onLava) {
      _lavaContactTimer += dt;
      if (_lavaContactTimer > 2) {
        var dmg = 30 * dt * (_hasFireSuit ? 0.5 : 1);
        _playerHP -= dmg;
        if (_playerHP <= 0) killPlayer('Consumed by lava!');
      }
    } else {
      _lavaContactTimer = Math.max(0, _lavaContactTimer - dt * 2);
    }
  }

  function checkAshContact(dt) {
    if (!_playerPos) return;
    for (var i = 0; i < _ashClouds.length; i++) {
      if (dist3(_playerPos, _ashClouds[i].pos) < 5) {
        var dmg = 15 * dt * (_hasGasMask ? 0.5 : 1);
        _playerHP -= dmg;
        if (_playerHP <= 0) { killPlayer('Overcome by toxic ash!'); return; }
      }
    }
  }

  function checkCrackFall() {
    if (!_playerPos) return;
    for (var i = 0; i < _groundCracks.length; i++) {
      var c  = _groundCracks[i];
      var dx = Math.abs(_playerPos.x - c.pos.x);
      var dz = Math.abs(_playerPos.z - c.pos.z);
      if (dx < c.width / 2 && dz < 0.45 && c.deadly) {
        killPlayer('Fell into a ground fissure!');
        return;
      }
    }
  }

  function checkMudslide(dt) {
    if (!_playerPos || !_playerVel) return;
    for (var i = 0; i < _mudslides.length; i++) {
      var m  = _mudslides[i];
      var dx = Math.abs(_playerPos.x - m.pos.x);
      var dz = Math.abs(_playerPos.z - m.pos.z);
      if (dx < m.width / 2 && dz < m.depth / 2) {
        _playerVel.x += m.dir * 5 * dt * 4;
      }
    }
  }

  function checkRockfallHit() {
    if (!_playerPos) return;
    for (var i = 0; i < _rockfalls.length; i++) {
      var r = _rockfalls[i];
      if (!r.active) continue;
      if (dist3(_playerPos, r.pos) < 1.5) {
        _playerHP -= 40;
        r.active = false;
        removeFromScene(r.mesh);
        if (r.shadow) removeFromScene(r.shadow);
        if (_playerHP <= 0) killPlayer('Crushed by falling rock!');
      }
    }
  }

  function killPlayer(msg) {
    if (_playerDead) return;
    _playerDead = true;
    showMessage('YOU DIED: ' + msg + ' | Press V+E to restart.');
    if (_hud) _hud.textContent = 'GAME OVER — ' + msg + ' | V+E to restart';
  }

  function winGame() {
    if (_playerWon) return;
    _playerWon = true;
    showMessage('ESCAPED! Survivors: ' + _survivorsRescued + '/' + _survivorsTotal + ' | V+E to restart.');
    if (_hud) _hud.textContent = 'ESCAPED! Survivors: ' + _survivorsRescued + '/' + _survivorsTotal + ' | V+E to restart';
  }

  /* ════════════════════════════════════════════════════════════════════════
     DYNAMIC UPDATES
  ════════════════════════════════════════════════════════════════════════ */

  function updateLavaFlows(dt) {
    var i;
    for (i = 0; i < _lavaFlows.length; i++) {
      var f = _lavaFlows[i];
      if (f.extent < f.max) {
        f.extent += 0.1 * dt;
        var half = f.extent / 2;
        f.mesh.scale.z = Math.max(0.01, f.extent / 60);
        f.mesh.position.x = Math.sin(f.angle) * (16 + half);
        f.mesh.position.z = Math.cos(f.angle) * (16 + half);
      }
    }
    /* Smoke light flicker */
    for (i = 0; i < _smokeLights.length; i++) {
      _smokeLights[i].intensity = 1.5 + Math.sin(performance.now() * 0.003 + i) * 0.5;
    }
  }

  function updateBombs(dt) {
    _bombTimer += dt;
    if (_bombTimer >= _bombNext) {
      _bombTimer = 0;
      spawnBomb();
    }

    var toRemove = [];
    var i;
    for (i = 0; i < _bombs.length; i++) {
      var bomb = _bombs[i];

      if (bomb.isExplosion) {
        bomb.timer -= dt;
        if (bomb.timer <= 0) { removeFromScene(bomb.mesh); toRemove.push(i); continue; }
        bomb.mesh.scale.setScalar(1 + (0.5 - bomb.timer) * 4);
        if (bomb.mesh.material) bomb.mesh.material.opacity = Math.max(0, bomb.timer / 0.5);
        continue;
      }

      if (bomb.isFlare) {
        bomb.timer -= dt;
        if (bomb.timer <= 0) { removeFromScene(bomb.mesh); toRemove.push(i); continue; }
        bomb.pos.x += bomb.vel.x * dt;
        bomb.pos.y += bomb.vel.y * dt;
        bomb.pos.z += bomb.vel.z * dt;
        bomb.vel.y -= 5 * dt;
        bomb.mesh.position.copy(bomb.pos);
        continue;
      }

      if (bomb.isShadow) {
        bomb.timer -= dt;
        if (bomb.timer <= 0) { removeFromScene(bomb.mesh); toRemove.push(i); }
        continue;
      }

      if (!bomb.landed) {
        bomb.vel.y -= 12 * dt;
        bomb.pos.x += bomb.vel.x * dt;
        bomb.pos.y += bomb.vel.y * dt;
        bomb.pos.z += bomb.vel.z * dt;
        bomb.mesh.position.copy(bomb.pos);

        if (bomb.pos.y <= 0.3) {
          bomb.landed  = true;
          bomb.pos.y   = 0.3;
          bomb.timer   = 30;
          /* Impact damage */
          if (_playerPos && dist3(_playerPos, bomb.pos) < 5) {
            _playerHP -= 100;
            if (_playerHP <= 0) killPlayer('Direct pyroclastic bomb hit!');
          }
          if (!bomb.poolCreated) {
            bomb.poolCreated = true;
            spawnLavaPool(bomb.pos.clone());
          }
          /* Cleanup shadow if present */
          if (bomb.shadow) { removeFromScene(bomb.shadow); bomb.shadow = null; }
        }
      } else {
        bomb.timer -= dt;
        if (bomb.timer <= 0) { removeFromScene(bomb.mesh); toRemove.push(i); }
      }
    }

    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      _bombs.splice(toRemove[ri], 1);
    }
  }

  function spawnBomb() {
    var tx = randRange(-40, 40);
    var tz = randRange(-80, 20);

    /* Warning shadow */
    var shGeo  = new THREE.CylinderGeometry(2, 2, 0.05, 8);
    var shMat  = new THREE.MeshLambertMaterial({ color: 0xFF2200, transparent: true, opacity: 0.5 });
    var shMesh = new THREE.Mesh(shGeo, shMat);
    shMesh.position.set(tx, 0.1, tz);
    _scene.add(shMesh);

    /* Bomb sphere */
    var bGeo  = new THREE.SphereGeometry(0.5, 8, 6);
    var bMat  = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF2200), emissiveIntensity: 1.5 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    var startPos = new THREE.Vector3(0, 26, 0);
    bMesh.position.copy(startPos);
    _scene.add(bMesh);

    var hangT = 4;
    var vx    = (tx - 0) / hangT;
    var vz    = (tz - 0) / hangT;
    var vy    = (0 - 26 + 0.5 * 12 * hangT * hangT) / hangT;

    _bombs.push({
      mesh:        bMesh,
      vel:         new THREE.Vector3(vx, vy, vz),
      pos:         startPos.clone(),
      landed:      false,
      landPos:     null,
      timer:       0,
      poolCreated: false,
      shadow:      shMesh
    });

    /* Self-cleaning shadow entry */
    _bombs.push({
      mesh: shMesh, pos: new THREE.Vector3(), vel: new THREE.Vector3(),
      landed: true, landPos: null, timer: hangT + 0.5,
      poolCreated: true, isShadow: true
    });
  }

  function spawnLavaPool(pos) {
    var r    = 3;
    var geo  = new THREE.CylinderGeometry(r, r, 0.15, 10);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF2200), emissiveIntensity: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = 0.08;
    _scene.add(mesh);
    _lavaPools.push({ mesh: mesh, pos: pos.clone(), radius: r });
  }

  function updateAshClouds(dt) {
    for (var i = 0; i < _ashClouds.length; i++) {
      var c = _ashClouds[i];
      c.pos.x += c.vel.x * dt;
      c.pos.z += c.vel.z * dt;
      if (c.pos.x < -50 || c.pos.x > 50) c.vel.x *= -1;
      if (c.pos.z < -95 || c.pos.z > 20) c.vel.z *= -1;
      c.mesh.position.set(c.pos.x, 2 + Math.sin(performance.now() * 0.001 + i) * 0.5, c.pos.z);
    }
  }

  function updateRockfalls(dt) {
    _rockfallTimer += dt;
    if (_rockfallTimer >= _rockfallNext) {
      _rockfallTimer = 0;
      _rockfallNext  = randRange(6, 14);
      spawnRockfall();
    }

    for (var i = 0; i < _rockfalls.length; i++) {
      var r = _rockfalls[i];
      if (!r.active) continue;

      r.pos.z += r.vel.z * dt;
      r.pos.x += r.vel.x * dt;
      r.vel.y -= 10 * dt;
      r.pos.y += r.vel.y * dt;
      if (r.pos.y < 0.4) { r.pos.y = 0.4; r.vel.y = 0; }

      r.mesh.position.copy(r.pos);
      r.mesh.rotation.x += dt * 3;
      if (r.shadow) r.shadow.position.set(r.pos.x, 0.05, r.pos.z);

      if (r.pos.z > 30 || Math.abs(r.pos.x) > 60) {
        r.active = false;
        removeFromScene(r.mesh);
        if (r.shadow) removeFromScene(r.shadow);
      }
    }
  }

  function spawnRockfall() {
    var rx = randRange(-20, 20);
    var rz = randRange(-30, -70);

    var shGeo  = new THREE.CylinderGeometry(1, 1, 0.05, 8);
    var shMat  = new THREE.MeshLambertMaterial({ color: 0xCC3300, transparent: true, opacity: 0.6 });
    var shMesh = new THREE.Mesh(shGeo, shMat);
    shMesh.position.set(rx, 0.05, rz);
    _scene.add(shMesh);

    var rGeo  = new THREE.CylinderGeometry(0.5, 0.7, 0.8, 6);
    var rMat  = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(rx, 15, rz);
    _scene.add(rMesh);

    _rockfalls.push({
      mesh:   rMesh,
      shadow: shMesh,
      pos:    new THREE.Vector3(rx, 15, rz),
      vel:    new THREE.Vector3(randRange(-2, 2), -8, randRange(3, 7)),
      active: true
    });
  }

  function updateSurvivors(dt) {
    for (var i = 0; i < _survivors.length; i++) {
      var s = _survivors[i];
      if (!s.following || !s.rescued || !_playerPos) continue;
      var dx = _playerPos.x - s.pos.x;
      var dz = _playerPos.z - s.pos.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d > 2.5) {
        var spd = 8 * 0.8;
        s.pos.x += (dx / d) * spd * dt;
        s.pos.z += (dz / d) * spd * dt;
      }
      s.pos.y = 1;
      s.mesh.position.copy(s.pos);
    }
  }

  function updateHelicopter(dt) {
    if (_heliArrivalDelay > 0) _heliArrivalDelay -= dt;

    if (_heliBoarding) {
      _heliBoardTimer -= dt;
      if (_heliBoardTimer <= 0) winGame();
    }

    /* Gentle hover bob */
    if (_heliFuselage) {
      _heliFuselage.position.y = 2 + Math.sin(performance.now() * 0.0015) * 0.15;
    }
  }

  function updateTimers(dt) {
    _gameTimer -= dt;
    if (_gameTimer <= 0 && !_playerWon && !_playerDead) {
      _gameTimer = 0;
      if (!_heliBoarding) killPlayer('Time ran out — the island is gone!');
    }

    if (_hasGasMask) {
      _gasMaskTimer -= dt;
      if (_gasMaskTimer <= 0) { _hasGasMask = false; _gasMaskTimer = 0; showMessage('Gas mask depleted!'); }
    }
    if (_hasFireSuit) {
      _fireSuitTimer -= dt;
      if (_fireSuitTimer <= 0) { _hasFireSuit = false; _fireSuitTimer = 0; showMessage('Fire suit burned through!'); }
    }

    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _messageEl) _messageEl.style.display = 'none';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATE / DEACTIVATE
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) return;
    _active = true;

    /* Grab scene/camera from globals */
    if (!_scene  && window.gameScene)  _scene  = window.gameScene;
    if (!_camera && window.gameCamera) _camera = window.gameCamera;
    if (!_scene  && window._scene)     _scene  = window._scene;
    if (!_camera && window._camera)    _camera = window._camera;
    if (!_canvas) _canvas = document.querySelector('canvas');

    if (!_scene || !_camera) {
      console.warn('[VolcanoEscape] No Three.js scene/camera found. Cannot activate.');
      _active = false;
      return;
    }

    buildEnvironment();
    buildLavaFlows();
    buildResearchStation();
    buildBridge();
    buildSurvivors();
    buildHelicopter();
    buildSupplies();
    buildAshClouds();
    buildGroundCracks();
    buildMudslides();
    buildCliffEdge();
    buildBeachCamp();

    /* Player spawn */
    _playerPos = new THREE.Vector3(0, 1, 20);
    _playerVel = new THREE.Vector3(0, 0, 0);
    _yaw       = Math.PI;
    _pitch     = 0;
    _onGround  = true;

    var pmGeo   = new THREE.BoxGeometry(0.5, 1.6, 0.5);
    var pmMat   = new THREE.MeshLambertMaterial({ color: 0xDD9955 });
    _playerMesh = new THREE.Mesh(pmGeo, pmMat);
    _playerMesh.position.copy(_playerPos);
    _scene.add(_playerMesh);

    buildHUD();
    _lastTime = performance.now() / 1000;

    if (_canvas) _canvas.requestPointerLock();

    showMessage('VOLCANO ESCAPE — Reach the helicopter on the north beach! E=interact F=C4 G=detonate R=flare');
  }

  function deactivate() {
    if (!_active) return;
    _active = false;
    if (document.pointerLockElement) document.exitPointerLock();
    removeHUD();
    if (_messageEl && _messageEl.parentNode) { _messageEl.parentNode.removeChild(_messageEl); _messageEl = null; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    if (scene)  _scene  = scene;
    if (camera) _camera = camera;
    if (canvas) _canvas = canvas;

    _boundKeyDown   = onKeyDown;
    _boundKeyUp     = onKeyUp;
    _boundMouseMove = onMouseMove;
    _boundClick     = onClick;

    document.addEventListener('keydown',   _boundKeyDown);
    document.addEventListener('keyup',     _boundKeyUp);
    document.addEventListener('mousemove', _boundMouseMove);
    document.addEventListener('click',     _boundClick);

    console.log('[VolcanoEscape] Ready. Press V+E simultaneously (within 400ms) to activate.');
  }

  function update(timestamp) {
    var now = timestamp / 1000;
    var dt  = Math.min(now - _lastTime, 0.1);
    _lastTime = now;

    if (!_active || _playerDead || _playerWon) return;

    updatePlayer(dt);
    updateLavaFlows(dt);
    updateBombs(dt);
    updateAshClouds(dt);
    updateRockfalls(dt);
    updateSurvivors(dt);
    updateHelicopter(dt);
    updateTimers(dt);

    /* Passive HP regen */
    if (_playerHP < 100 && _playerHP > 0) _playerHP = Math.min(100, _playerHP + 0.5 * dt);

    checkLavaContact(dt);
    checkAshContact(dt);
    checkCrackFall();
    checkMudslide(dt);
    checkRockfallHit();

    updateHUD();
  }

  function reset() {
    var i;

    /* Remove all scene objects */
    var toRemove = [];

    for (i = 0; i < _lavaFlows.length;   i++) toRemove.push(_lavaFlows[i].mesh);
    for (i = 0; i < _lavaPools.length;   i++) toRemove.push(_lavaPools[i].mesh);
    for (i = 0; i < _bombs.length;       i++) toRemove.push(_bombs[i].mesh);
    for (i = 0; i < _ashClouds.length;   i++) toRemove.push(_ashClouds[i].mesh);
    for (i = 0; i < _rockfalls.length;   i++) { toRemove.push(_rockfalls[i].mesh); if (_rockfalls[i].shadow) toRemove.push(_rockfalls[i].shadow); }
    for (i = 0; i < _survivors.length;   i++) toRemove.push(_survivors[i].mesh);
    for (i = 0; i < _supplies.length;    i++) toRemove.push(_supplies[i].mesh);
    for (i = 0; i < _groundCracks.length; i++) { toRemove.push(_groundCracks[i].mesh); if (_groundCracks[i].line) toRemove.push(_groundCracks[i].line); }
    for (i = 0; i < _mudslides.length;   i++) toRemove.push(_mudslides[i].mesh);
    for (i = 0; i < _c4Placed.length;    i++) toRemove.push(_c4Placed[i].mesh);
    for (i = 0; i < _bridgeSupports.length; i++) toRemove.push(_bridgeSupports[i].mesh);
    for (i = 0; i < _smokeLights.length; i++) { if (_smokeLights[i].parent) _smokeLights[i].parent.remove(_smokeLights[i]); }

    if (_groundMesh)   toRemove.push(_groundMesh);
    if (_volcanoMesh)  toRemove.push(_volcanoMesh);
    if (_stationMesh)  toRemove.push(_stationMesh);
    if (_stationDoor)  toRemove.push(_stationDoor);
    if (_bridgeMesh)   toRemove.push(_bridgeMesh);
    if (_heliFuselage) toRemove.push(_heliFuselage);
    if (_playerMesh)   toRemove.push(_playerMesh);

    for (i = 0; i < toRemove.length; i++) removeFromScene(toRemove[i]);

    /* Reset arrays */
    _lavaFlows      = [];
    _lavaPools      = [];
    _bombs          = [];
    _ashClouds      = [];
    _rockfalls      = [];
    _survivors      = [];
    _supplies       = [];
    _groundCracks   = [];
    _mudslides      = [];
    _c4Placed       = [];
    _bridgeSupports = [];
    _smokeLights    = [];

    /* Reset state */
    _playerHP          = 100;
    _playerDead        = false;
    _playerWon         = false;
    _gameTimer         = 300;
    _survivorsRescued  = 0;
    _hasGasMask        = false;
    _gasMaskTimer      = 0;
    _hasFireSuit       = false;
    _fireSuitTimer     = 0;
    _hasFlareGun       = false;
    _flareUsed         = false;
    _c4Charges         = 0;
    _flareGunExtraTime = 0;
    _heliArrivalDelay  = 60;
    _heliDeparted      = false;
    _heliBoarding      = false;
    _heliBoardTimer    = 0;
    _lavaContactTimer  = 0;
    _lavaRise          = 0;
    _bombTimer         = 0;
    _bombNext          = 15;
    _rockfallTimer     = 0;
    _rockfallNext      = 8;
    _stationDoorOpen   = false;
    _bridgeCollapsed   = false;
    _groundMesh        = null;
    _volcanoMesh       = null;
    _stationMesh       = null;
    _stationDoor       = null;
    _bridgeMesh        = null;
    _heliFuselage      = null;
    _heliMesh          = null;
    _heliPos           = null;
    _playerPos         = null;
    _playerVel         = null;
    _playerMesh        = null;
    _vePressTime       = { V: 0, E: 0 };

    deactivate();
    console.log('[VolcanoEscape] Reset complete. Press V+E to play again.');
  }

  return { init: init, update: update, reset: reset };

}());
