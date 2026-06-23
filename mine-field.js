// ============================================================
//  mine-field.js — Mine-laying, detection, and safe lane clearance
//  M+F keys: open mine-laying mode; click to place mines on terrain
//  Mine types: AP, AT, CLAYMORE, TRIP_WIRE
//  D+M: equip metal detector with AudioContext beeping
//  Shift+M: draw safe lane through minefield
//  Public API: window.MineField = { init, update, reset }
// ============================================================
window.MineField = (function () {
  'use strict';

  // ── Internal state ──────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _playerPosition = null;
  var _enemies = null;
  var _onDamage = null;

  // Mine-laying mode
  var _minelayMode = false;
  var _mKeyDown = false;
  var _fKeyDown = false;
  var _dKeyDown = false;
  var _shiftDown = false;

  // Current mine type index
  var _mineTypeIndex = 0;
  var MINE_TYPES = ['AP', 'AT', 'CLAYMORE', 'TRIP_WIRE'];

  // Mine records
  var _mines = [];          // array of mine objects
  var _minefieldMap = {};   // keyed by "x_z" for MortarCalculator/ElectronicWarfare
  var _detectedMines = [];  // mines marked as detected

  // Detector state
  var _detectorActive = false;
  var _detectorMesh = null;
  var _detectorLED = null;
  var _audioCtx = null;
  var _beepOsc = null;
  var _beepGain = null;

  // Safe lane
  var _safeLanePath = [];
  var _safeLaneLines = [];
  var _drawingLane = false;
  var _shiftMPressed = false;

  // Explosion effects
  var _effects = [];

  // Trip wire state (two-click placement)
  var _tripWireFirst = null;

  // HUD
  var _hudEl = null;

  // Mouse
  var _raycaster = null;
  var _mouse = new THREE.Vector2();

  // ── Mine type definitions ───────────────────────────────────
  var MINE_DEFS = {
    AP: {
      label: 'AP',
      triggerRadius: 0.4,
      damage: 80,
      craterRadius: 1.5,
      color: 0x8B7355,
      fragCount: 0
    },
    AT: {
      label: 'AT',
      triggerRadius: 1.0,
      damage: 300,
      craterRadius: 3.5,
      color: 0x4A4A4A,
      fragCount: 0
    },
    CLAYMORE: {
      label: 'CL',
      triggerRadius: 3.0,
      damage: 60,
      craterRadius: 2.0,
      color: 0x2F4F2F,
      fragCount: 8
    },
    TRIP_WIRE: {
      label: 'TW',
      triggerRadius: 0.0,
      damage: 50,
      craterRadius: 1.0,
      color: 0x5C4033,
      fragCount: 0
    }
  };

  // ── Helpers ─────────────────────────────────────────────────
  function _getPlayerPos() {
    if (_playerPosition) return _playerPosition;
    if (_camera) return _camera.position;
    return new THREE.Vector3();
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _getTerrainY(x, z) {
    // Attempt to sample terrain; fall back to 0
    if (window.Environment && typeof window.Environment.getHeightAt === 'function') {
      return window.Environment.getHeightAt(x, z);
    }
    return 0;
  }

  // ── HUD ─────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl && document.body.contains(_hudEl)) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'mf-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:44px',
      'left:12px',
      'color:#ffe066',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'text-shadow:0 0 6px #ffe066',
      'pointer-events:none',
      'z-index:9999',
      'background:rgba(0,0,0,0.5)',
      'padding:4px 10px',
      'border-radius:3px'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _countByType(type) {
    var n = 0;
    for (var i = 0; i < _mines.length; i++) {
      if (_mines[i].mineType === type && _mines[i].alive) n++;
    }
    return n;
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var ap = _countByType('AP');
    var at = _countByType('AT');
    var cl = _countByType('CLAYMORE');
    var tw = _countByType('TRIP_WIRE');
    var detStr = _detectorActive ? 'ON' : 'OFF';
    var modeStr = _minelayMode ? (' | LAYING [' + MINE_TYPES[_mineTypeIndex] + ']') : '';
    _hudEl.textContent = 'MINEFIELD [AP:' + ap + ' AT:' + at + ' CL:' + cl + ' TW:' + tw + '] | DETECTOR: ' + detStr + modeStr;
  }

  // ── Mine mesh creation ──────────────────────────────────────
  function _createMineMesh(type, x, y, z) {
    var mesh = null;
    var def = MINE_DEFS[type];

    if (type === 'AP') {
      // Anti-personnel: flat cylinder, radius 0.3, height 0.15, tan color
      var geo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12);
      var mat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
      mesh = new THREE.Mesh(geo, mat);
    } else if (type === 'AT') {
      // Anti-tank: larger cylinder, radius 0.6, gray
      var geoAt = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 12);
      var matAt = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
      mesh = new THREE.Mesh(geoAt, matAt);
    } else if (type === 'CLAYMORE') {
      // Claymore: BoxGeometry 0.4×0.2×0.1 with directional spray
      var geoClay = new THREE.BoxGeometry(0.4, 0.2, 0.1);
      var matClay = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
      mesh = new THREE.Mesh(geoClay, matClay);
    } else if (type === 'TRIP_WIRE') {
      // Trip wire: two stake cylinders + wire LineSegments — return group
      var group = new THREE.Group();
      var stakeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
      var stakeMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
      var stake1 = new THREE.Mesh(stakeGeo, stakeMat);
      stake1.position.set(0, 0.2, 0);
      group.add(stake1);
      mesh = group;
    }

    if (mesh) {
      // Buried: slightly below terrain, 0.05 above ground visible
      mesh.position.set(x, y + 0.05, z);
      _scene.add(mesh);
    }
    return mesh;
  }

  function _addTripWireSecondStake(mine, x2, z2) {
    // Second stake at x2, z2
    var y2 = _getTerrainY(x2, z2);
    var stakeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
    var stakeMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    var stake2 = new THREE.Mesh(stakeGeo, stakeMat);
    stake2.position.set(x2, y2 + 0.2, z2);
    _scene.add(stake2);
    mine.stake2 = stake2;
    mine.x2 = x2;
    mine.z2 = z2;

    // LineSegments wire between stakes
    var pts = [
      new THREE.Vector3(mine.x, mine.y + 0.3, mine.z),
      new THREE.Vector3(x2, y2 + 0.3, z2)
    ];
    var wireGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var wireMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
    var wireLine = new THREE.LineSegments(wireGeo, wireMat);
    _scene.add(wireLine);
    mine.wireLine = wireLine;

    // Store wire endpoints for line intersection tests
    mine.wireA = new THREE.Vector3(mine.x, mine.y + 0.3, mine.z);
    mine.wireB = new THREE.Vector3(x2, y2 + 0.3, z2);
    mine.complete = true;
  }

  // ── Mine placement ──────────────────────────────────────────
  function _placeMine(worldX, worldZ) {
    var type = MINE_TYPES[_mineTypeIndex];
    var gy = _getTerrainY(worldX, worldZ);
    var def = MINE_DEFS[type];

    if (type === 'TRIP_WIRE') {
      if (!_tripWireFirst) {
        // First click: place first stake, wait for second
        var mesh = _createMineMesh(type, worldX, gy, worldZ);
        _tripWireFirst = {
          mineType: type,
          x: worldX,
          y: gy,
          z: worldZ,
          mesh: mesh,
          alive: false,  // not complete yet
          complete: false
        };
        return;
      } else {
        // Second click: complete the trip wire
        var mine = _tripWireFirst;
        _tripWireFirst = null;
        _addTripWireSecondStake(mine, worldX, worldZ);
        mine.alive = true;
        mine.triggered = false;
        mine.def = def;
        _mines.push(mine);
        _registerInMap(mine);
        _updateHUD();
        return;
      }
    }

    // Non-trip-wire mines
    var mineMesh = _createMineMesh(type, worldX, gy, worldZ);
    var mineObj = {
      mineType: type,
      x: worldX,
      y: gy,
      z: worldZ,
      mesh: mineMesh,
      alive: true,
      triggered: false,
      def: def,
      markerMesh: null,
      detected: false
    };
    _mines.push(mineObj);
    _registerInMap(mineObj);
    _updateHUD();
  }

  function _registerInMap(mine) {
    var key = Math.round(mine.x) + '_' + Math.round(mine.z);
    _minefieldMap[key] = mine;
  }

  // ── Raycast click to terrain ────────────────────────────────
  function _onMouseClick(event) {
    if (!_minelayMode) return;
    if (!_scene || !_camera) return;

    // Build raycaster from mouse position
    var rect = null;
    if (_renderer && _renderer.domElement) {
      rect = _renderer.domElement.getBoundingClientRect();
    } else {
      rect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    }
    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (!_raycaster) _raycaster = new THREE.Raycaster();
    _raycaster.setFromCamera(_mouse, _camera);

    // Try to intersect terrain/ground objects
    var terrainObjects = [];
    if (window.Environment && window.Environment.getTerrainMeshes) {
      terrainObjects = window.Environment.getTerrainMeshes();
    }

    var worldPos = null;
    if (terrainObjects.length > 0) {
      var hits = _raycaster.intersectObjects(terrainObjects, true);
      if (hits.length > 0) {
        worldPos = hits[0].point;
      }
    }

    if (!worldPos) {
      // Fallback: intersect Y=0 plane
      var ray = _raycaster.ray;
      if (Math.abs(ray.direction.y) > 0.0001) {
        var t = -ray.origin.y / ray.direction.y;
        if (t > 0) {
          worldPos = new THREE.Vector3(
            ray.origin.x + ray.direction.x * t,
            0,
            ray.origin.z + ray.direction.z * t
          );
        }
      }
    }

    if (worldPos) {
      _placeMine(worldPos.x, worldPos.z);
    }
  }

  // ── Explosion ───────────────────────────────────────────────
  function _explodeMine(mine) {
    if (!mine.alive) return;
    mine.alive = false;
    mine.triggered = true;

    var def = mine.def || MINE_DEFS[mine.mineType];
    var ex = mine.x;
    var ey = mine.y + 0.5;
    var ez = mine.z;

    // Remove mine mesh(es)
    if (mine.mesh && _scene) {
      _scene.remove(mine.mesh);
      if (mine.mesh.geometry) mine.mesh.geometry.dispose();
      if (mine.mesh.material) mine.mesh.material.dispose();
    }
    if (mine.stake2 && _scene) {
      _scene.remove(mine.stake2);
    }
    if (mine.wireLine && _scene) {
      _scene.remove(mine.wireLine);
    }
    if (mine.markerMesh && _scene) {
      _scene.remove(mine.markerMesh);
    }

    // Flash sphere
    var flashGeo = new THREE.SphereGeometry(1.2, 8, 8);
    var flashMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.9
    });
    var flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.set(ex, ey, ez);
    _scene.add(flashMesh);
    _effects.push({ mesh: flashMesh, timer: 0, life: 0.25, type: 'flash' });

    // Point light
    var light = new THREE.PointLight(0xff4400, 10, 8);
    light.position.set(ex, ey, ez);
    _scene.add(light);
    _effects.push({ mesh: light, timer: 0, life: 0.3, type: 'light' });

    // 6 debris chunks
    for (var d = 0; d < 6; d++) {
      var debGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      var debMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var debMesh = new THREE.Mesh(debGeo, debMat);
      debMesh.position.set(ex, ey, ez);
      _scene.add(debMesh);
      _effects.push({
        mesh: debMesh,
        timer: 0,
        life: 1.2,
        type: 'debris',
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 5 + 2,
        vz: (Math.random() - 0.5) * 6
      });
    }

    // Crater
    var craterGeo = new THREE.CylinderGeometry(def.craterRadius, def.craterRadius * 0.7, 0.2, 16);
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x222211 });
    var craterMesh = new THREE.Mesh(craterGeo, craterMat);
    craterMesh.position.set(ex, mine.y - 0.1, ez);
    _scene.add(craterMesh);
    // Crater persists — add with long life
    _effects.push({ mesh: craterMesh, timer: 0, life: 3600, type: 'crater' });

    // Apply damage
    _applyDamage(mine, ex, ey, ez, def);

    _updateHUD();
  }

  function _applyDamage(mine, ex, ey, ez, def) {
    var epos = new THREE.Vector3(ex, ey, ez);

    if (mine.mineType === 'CLAYMORE') {
      // Directional: 8 fragments in forward arc
      var fwdAngle = mine.facing || 0;
      var fragDamage = def.damage; // 60HP per fragment
      _applyFragDamage(epos, fwdAngle, fragDamage, 3.0, Math.PI * 0.6);
    } else {
      // Radial damage
      var radius = def.craterRadius + 1.5;
      var dmg = def.damage;

      // Damage player
      var pp = _getPlayerPos();
      if (_dist3D(epos, pp) < radius) {
        if (typeof _onDamage === 'function') _onDamage(dmg);
      }

      // Damage enemies
      if (_enemies) {
        for (var i = 0; i < _enemies.length; i++) {
          var en = _enemies[i];
          if (!en || en.dead) continue;
          var ep = en.position || (en.mesh && en.mesh.position);
          if (!ep) continue;
          if (_dist3D(epos, ep) < radius) {
            if (typeof en.takeDamage === 'function') en.takeDamage(dmg);
          }
        }
      }
    }
  }

  function _applyFragDamage(origin, facingAngle, dmgPerFrag, arcRadius, arcHalfAngle) {
    // Apply CLAYMORE fragment damage in a forward arc
    var fragDirections = [];
    for (var f = 0; f < 8; f++) {
      var a = facingAngle - arcHalfAngle + (arcHalfAngle * 2 * f / 7);
      fragDirections.push(a);
    }

    // Check player
    var pp = _getPlayerPos();
    var pdx = pp.x - origin.x;
    var pdz = pp.z - origin.z;
    var pDist = Math.sqrt(pdx * pdx + pdz * pdz);
    if (pDist < arcRadius) {
      var pAngle = Math.atan2(pdx, pdz);
      var pRelAngle = pAngle - facingAngle;
      // Normalize angle
      while (pRelAngle > Math.PI) pRelAngle -= 2 * Math.PI;
      while (pRelAngle < -Math.PI) pRelAngle += 2 * Math.PI;
      if (Math.abs(pRelAngle) < arcHalfAngle) {
        if (typeof _onDamage === 'function') _onDamage(dmgPerFrag);
      }
    }

    // Check enemies
    if (_enemies) {
      for (var i = 0; i < _enemies.length; i++) {
        var en = _enemies[i];
        if (!en || en.dead) continue;
        var ep = en.position || (en.mesh && en.mesh.position);
        if (!ep) continue;
        var edx = ep.x - origin.x;
        var edz = ep.z - origin.z;
        var eDist = Math.sqrt(edx * edx + edz * edz);
        if (eDist < arcRadius) {
          var eAngle = Math.atan2(edx, edz);
          var eRelAngle = eAngle - facingAngle;
          while (eRelAngle > Math.PI) eRelAngle -= 2 * Math.PI;
          while (eRelAngle < -Math.PI) eRelAngle += 2 * Math.PI;
          if (Math.abs(eRelAngle) < arcHalfAngle) {
            if (typeof en.takeDamage === 'function') en.takeDamage(dmgPerFrag);
          }
        }
      }
    }
  }

  // ── Trip wire intersection check ────────────────────────────
  function _checkTripWireIntersection(mine, entPrevX, entPrevZ, entX, entZ) {
    if (!mine.complete || !mine.wireA || !mine.wireB) return false;
    // 2D line segment intersection between movement vector and wire
    var ax = mine.wireA.x, az = mine.wireA.z;
    var bx = mine.wireB.x, bz = mine.wireB.z;

    var p1x = entPrevX, p1z = entPrevZ;
    var p2x = entX, p2z = entZ;

    var denom = (bx - ax) * (p2z - p1z) - (bz - az) * (p2x - p1x);
    if (Math.abs(denom) < 0.0001) return false;

    var t = ((p1x - ax) * (p2z - p1z) - (p1z - az) * (p2x - p1x)) / denom;
    var u = -((ax - p1x) * (bz - az) - (az - p1z) * (bx - ax)) / denom;

    return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
  }

  // ── Mine detection trigger ──────────────────────────────────
  function _checkMinesVsEntities() {
    var pp = _getPlayerPos();
    var prevPP = _prevPlayerPos || pp;

    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (!mine.alive || mine.triggered) continue;

      if (mine.mineType === 'TRIP_WIRE') {
        if (!mine.complete) continue;
        // Check player
        if (_checkTripWireIntersection(mine, prevPP.x, prevPP.z, pp.x, pp.z)) {
          _explodeMine(mine);
          continue;
        }
        // Check enemies
        if (_enemies) {
          for (var j = 0; j < _enemies.length; j++) {
            var en = _enemies[j];
            if (!en || en.dead) continue;
            var ep = en.position || (en.mesh && en.mesh.position);
            if (!ep) continue;
            var enPrev = en.prevPosition || ep;
            if (_checkTripWireIntersection(mine, enPrev.x, enPrev.z, ep.x, ep.z)) {
              _explodeMine(mine);
              break;
            }
          }
        }
        continue;
      }

      if (mine.mineType === 'CLAYMORE') {
        // Directional trigger within 3.0 units in forward arc
        var cDist = _dist2D(pp.x, pp.z, mine.x, mine.z);
        if (cDist < mine.def.triggerRadius) {
          mine.facing = Math.atan2(pp.x - mine.x, pp.z - mine.z);
          _explodeMine(mine);
          continue;
        }
        if (_enemies) {
          for (var k = 0; k < _enemies.length; k++) {
            var enC = _enemies[k];
            if (!enC || enC.dead) continue;
            var epC = enC.position || (enC.mesh && enC.mesh.position);
            if (!epC) continue;
            if (_dist2D(epC.x, epC.z, mine.x, mine.z) < mine.def.triggerRadius) {
              mine.facing = Math.atan2(epC.x - mine.x, epC.z - mine.z);
              _explodeMine(mine);
              break;
            }
          }
        }
        continue;
      }

      // AP / AT: radial trigger
      var trigR = mine.def.triggerRadius;

      // Check player
      if (_dist2D(pp.x, pp.z, mine.x, mine.z) < trigR) {
        _explodeMine(mine);
        continue;
      }

      // Check enemies
      if (_enemies) {
        for (var m = 0; m < _enemies.length; m++) {
          var enR = _enemies[m];
          if (!enR || enR.dead) continue;
          var epR = enR.position || (enR.mesh && enR.mesh.position);
          if (!epR) continue;
          if (_dist2D(epR.x, epR.z, mine.x, mine.z) < trigR) {
            _explodeMine(mine);
            break;
          }
        }
      }
    }

    // Store previous player pos for trip wire
    _prevPlayerPos = pp.clone ? pp.clone() : { x: pp.x, y: pp.y, z: pp.z };
  }

  // ── Mine detector ───────────────────────────────────────────
  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _stopBeep() {
    if (_beepOsc) {
      try { _beepOsc.stop(); } catch (e) {}
      _beepOsc.disconnect();
      _beepOsc = null;
    }
    if (_beepGain) {
      _beepGain.disconnect();
      _beepGain = null;
    }
  }

  function _playBeep(freq) {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    _stopBeep();
    try {
      _beepOsc = ctx.createOscillator();
      _beepGain = ctx.createGain();
      _beepOsc.type = 'square';
      _beepOsc.frequency.value = freq;
      _beepGain.gain.value = 0.12;
      _beepOsc.connect(_beepGain);
      _beepGain.connect(ctx.destination);
      _beepOsc.start();
      _beepOsc.stop(ctx.currentTime + 0.07);
    } catch (e) {
      _beepOsc = null;
      _beepGain = null;
    }
  }

  function _createDetectorMesh() {
    if (_detectorMesh) return;
    // Wand: BoxGeometry
    var wandGeo = new THREE.BoxGeometry(0.08, 0.08, 0.7);
    var wandMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    _detectorMesh = new THREE.Mesh(wandGeo, wandMat);

    // LED sphere on tip
    var ledGeo = new THREE.SphereGeometry(0.05, 8, 8);
    var ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    _detectorLED = new THREE.Mesh(ledGeo, ledMat);
    _detectorLED.position.set(0, 0, -0.38);
    _detectorMesh.add(_detectorLED);

    // Position relative to camera (first-person: bottom right)
    _detectorMesh.position.set(0.3, -0.35, -0.6);
    if (_camera) _camera.add(_detectorMesh);
  }

  function _removeDetectorMesh() {
    if (!_detectorMesh) return;
    if (_camera) _camera.remove(_detectorMesh);
    if (_detectorMesh.geometry) _detectorMesh.geometry.dispose();
    if (_detectorMesh.material) _detectorMesh.material.dispose();
    _detectorMesh = null;
    _detectorLED = null;
  }

  var _detectorBeepTimer = 0;
  var _detectorBeepInterval = 99;
  var _detectorClosestDist = Infinity;

  function _runDetector(dt) {
    var pp = _getPlayerPos();
    var closestDist = Infinity;

    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (!mine.alive) continue;
      var d = _dist2D(pp.x, pp.z, mine.x, mine.z);
      if (d < closestDist) closestDist = d;
    }

    _detectorClosestDist = closestDist;

    if (closestDist < Infinity) {
      // Mark detected mines within 2.0 units
      for (var j = 0; j < _mines.length; j++) {
        var m = _mines[j];
        if (!m.alive || m.detected) continue;
        if (_dist2D(pp.x, pp.z, m.x, m.z) < 2.0) {
          _markMineDetected(m);
        }
      }

      // Update LED color: red = close, green = far
      if (_detectorLED) {
        var intensity = Math.max(0, Math.min(1, 1 - closestDist / 5.0));
        _detectorLED.material.color.setRGB(intensity, 1 - intensity, 0);
      }

      // Beep frequency: 200 + distance*50 Hz (closer = higher pitch)
      var freq = 200 + Math.max(0, (5.0 - closestDist) * 50);
      _detectorBeepTimer += dt;
      // Beep interval: 0.1s when very close, 1.0s when far
      _detectorBeepInterval = Math.max(0.1, closestDist * 0.2);

      if (_detectorBeepTimer >= _detectorBeepInterval) {
        _detectorBeepTimer = 0;
        _playBeep(freq);
      }
    } else {
      _detectorBeepTimer = 0;
      if (_detectorLED) {
        _detectorLED.material.color.setRGB(0, 1, 0); // green = safe
      }
    }
  }

  // ── Mine marking ─────────────────────────────────────────────
  function _markMineDetected(mine) {
    mine.detected = true;
    _detectedMines.push(mine);

    // Overhead yellow marker sphere
    var markerGeo = new THREE.SphereGeometry(0.15, 8, 8);
    var markerMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var markerMesh = new THREE.Mesh(markerGeo, markerMat);
    markerMesh.position.set(mine.x, mine.y + 1.5, mine.z);
    _scene.add(markerMesh);
    mine.markerMesh = markerMesh;
  }

  // ── Safe lane ────────────────────────────────────────────────
  function _startSafeLane() {
    _drawingLane = true;
    _safeLanePath = [];
    // Remove old lane lines
    for (var i = 0; i < _safeLaneLines.length; i++) {
      if (_safeLaneLines[i] && _scene) _scene.remove(_safeLaneLines[i]);
    }
    _safeLaneLines = [];
  }

  function _addSafeLanePoint() {
    var pp = _getPlayerPos();
    _safeLanePath.push(new THREE.Vector3(pp.x, pp.y, pp.z));

    if (_safeLanePath.length >= 2) {
      _drawSafeLane();
    }
  }

  function _drawSafeLane() {
    // Remove existing lane lines
    for (var i = 0; i < _safeLaneLines.length; i++) {
      if (_safeLaneLines[i] && _scene) _scene.remove(_safeLaneLines[i]);
    }
    _safeLaneLines = [];

    if (_safeLanePath.length < 2) return;

    // Draw dashed white LineSegments along the path
    var pts = [];
    for (var j = 0; j < _safeLanePath.length - 1; j++) {
      var a = _safeLanePath[j];
      var b = _safeLanePath[j + 1];
      // Simulate dashed: alternate segments
      var seg = 10;
      for (var s = 0; s < seg; s++) {
        if (s % 2 === 0) {
          var t0 = s / seg;
          var t1 = (s + 0.6) / seg;
          pts.push(new THREE.Vector3(
            a.x + (b.x - a.x) * t0,
            a.y + (b.y - a.y) * t0 + 0.1,
            a.z + (b.z - a.z) * t0
          ));
          pts.push(new THREE.Vector3(
            a.x + (b.x - a.x) * t1,
            a.y + (b.y - a.y) * t1 + 0.1,
            a.z + (b.z - a.z) * t1
          ));
        }
      }
    }

    if (pts.length >= 2) {
      var laneGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var laneMat = new THREE.LineBasicMaterial({ color: 0xffffff });
      var laneLine = new THREE.LineSegments(laneGeo, laneMat);
      _scene.add(laneLine);
      _safeLaneLines.push(laneLine);
    }
  }

  function _finishSafeLane() {
    _drawingLane = false;
    _addSafeLanePoint(); // add final point
  }

  // ── Keyboard handling ────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';

    if (key === 'SHIFT') _shiftDown = true;

    // M+F to toggle mine-laying mode
    if (key === 'M') {
      _mKeyDown = true;
      if (_fKeyDown) {
        _minelayMode = !_minelayMode;
        if (!_minelayMode) {
          // Exit mine-laying: cancel any partial trip wire
          if (_tripWireFirst) {
            if (_tripWireFirst.mesh && _scene) _scene.remove(_tripWireFirst.mesh);
            _tripWireFirst = null;
          }
        }
        _updateHUD();
        return;
      }
      // Shift+M: safe lane mode
      if (_shiftDown) {
        e.preventDefault();
        if (!_drawingLane) {
          _startSafeLane();
          _addSafeLanePoint();
        } else {
          _addSafeLanePoint();
          _finishSafeLane();
        }
        return;
      }
      // D+M: toggle detector
      if (_dKeyDown) {
        _detectorActive = !_detectorActive;
        if (_detectorActive) {
          _createDetectorMesh();
        } else {
          _removeDetectorMesh();
          _stopBeep();
          _detectorBeepTimer = 0;
        }
        _updateHUD();
        return;
      }
      // Cycle mine type (just M alone)
      if (_minelayMode) {
        _mineTypeIndex = (_mineTypeIndex + 1) % MINE_TYPES.length;
        _updateHUD();
      }
    }

    if (key === 'F') {
      _fKeyDown = true;
      if (_mKeyDown) {
        _minelayMode = !_minelayMode;
        if (!_minelayMode) {
          if (_tripWireFirst) {
            if (_tripWireFirst.mesh && _scene) _scene.remove(_tripWireFirst.mesh);
            _tripWireFirst = null;
          }
        }
        _updateHUD();
      }
    }

    if (key === 'D') {
      _dKeyDown = true;
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    if (key === 'M') _mKeyDown = false;
    if (key === 'F') _fKeyDown = false;
    if (key === 'D') _dKeyDown = false;
    if (key === 'SHIFT') _shiftDown = false;
  }

  // ── Effects update ──────────────────────────────────────────
  function _updateEffects(dt) {
    for (var i = _effects.length - 1; i >= 0; i--) {
      var eff = _effects[i];
      eff.timer += dt;

      if (eff.type === 'debris') {
        eff.mesh.position.x += eff.vx * dt;
        eff.mesh.position.y += eff.vy * dt;
        eff.mesh.position.z += eff.vz * dt;
        eff.vy -= 9.8 * dt;
        if (eff.mesh.material && eff.mesh.material.opacity !== undefined) {
          eff.mesh.material.opacity = Math.max(0, 1 - eff.timer / eff.life);
        }
      }

      if (eff.type === 'flash') {
        var progress = eff.timer / eff.life;
        if (eff.mesh.material) {
          eff.mesh.material.opacity = Math.max(0, 0.9 - progress * 0.9);
        }
        var scale = 1 + progress * 2;
        eff.mesh.scale.set(scale, scale, scale);
      }

      if (eff.timer >= eff.life) {
        if (eff.type !== 'crater') {
          if (_scene) _scene.remove(eff.mesh);
          if (eff.mesh && eff.mesh.geometry) eff.mesh.geometry.dispose();
          if (eff.mesh && eff.mesh.material) eff.mesh.material.dispose();
        }
        _effects.splice(i, 1);
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────
  function init(opts) {
    opts = opts || {};
    _scene = opts.scene || null;
    _camera = opts.camera || null;
    _renderer = opts.renderer || null;
    _playerPosition = opts.playerPosition || null;
    _enemies = opts.enemies || null;
    _onDamage = opts.onDamage || null;

    _mines = [];
    _minefieldMap = {};
    _detectedMines = [];
    _effects = [];
    _safeLanePath = [];
    _safeLaneLines = [];
    _drawingLane = false;
    _minelayMode = false;
    _detectorActive = false;
    _mKeyDown = false;
    _fKeyDown = false;
    _dKeyDown = false;
    _shiftDown = false;
    _mineTypeIndex = 0;
    _tripWireFirst = null;
    _detectorBeepTimer = 0;
    _detectorBeepInterval = 99;
    _prevPlayerPos = null;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
    document.addEventListener('click', _onMouseClick);

    _createHUD();
  }

  function update(dt) {
    dt = dt || 0.016;

    // Check mine triggers vs entities
    _checkMinesVsEntities();

    // Run detector if active
    if (_detectorActive) {
      _runDetector(dt);
    }

    // Update explosion effects
    _updateEffects(dt);
  }

  function reset() {
    // Remove all mine meshes
    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (mine.mesh && _scene) _scene.remove(mine.mesh);
      if (mine.stake2 && _scene) _scene.remove(mine.stake2);
      if (mine.wireLine && _scene) _scene.remove(mine.wireLine);
      if (mine.markerMesh && _scene) _scene.remove(mine.markerMesh);
    }
    _mines = [];
    _minefieldMap = {};
    _detectedMines = [];

    // Remove safe lane lines
    for (var j = 0; j < _safeLaneLines.length; j++) {
      if (_safeLaneLines[j] && _scene) _scene.remove(_safeLaneLines[j]);
    }
    _safeLaneLines = [];
    _safeLanePath = [];
    _drawingLane = false;

    // Remove effects
    for (var k = 0; k < _effects.length; k++) {
      var eff = _effects[k];
      if (eff.type !== 'crater' && _scene) _scene.remove(eff.mesh);
    }
    _effects = [];

    // Remove detector
    _removeDetectorMesh();
    _stopBeep();
    _detectorActive = false;
    _detectorBeepTimer = 0;

    // Cancel trip wire
    if (_tripWireFirst && _tripWireFirst.mesh && _scene) {
      _scene.remove(_tripWireFirst.mesh);
    }
    _tripWireFirst = null;

    _minelayMode = false;
    _mineTypeIndex = 0;

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);
    document.removeEventListener('click', _onMouseClick);

    _updateHUD();
  }

  // Expose minefieldMap and detectedMines for other modules
  return {
    init: init,
    update: update,
    reset: reset,
    getMinefieldMap: function () { return _minefieldMap; },
    getDetectedMines: function () { return _detectedMines; },
    getMines: function () { return _mines; }
  };

})();
