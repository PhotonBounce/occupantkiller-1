/* ───────────────────────────────────────────────────────────────────────────
   avalanche-escape.js — Avalanche Escape Mini-Game
   API: window.AvalancheEscape = { init, update, reset }
   Controls:
     A + E (simultaneous, 400ms) → activate avalanche escape
     W / S                       → move forward / backward (down/up mountain)
     A / D                       → strafe left / right
     Space                       → jump
     Mouse                       → look
     E (near survivor)           → grab survivor (auto-follow)
     T (aim at lift pole)        → rope grapple to ski lift
     E (near snowboard)          → mount snowboard (+60% speed 20s)
     E (near thermos)            → drink thermos (+50 HP)
   ─────────────────────────────────────────────────────────────────────────── */
window.AvalancheEscape = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ─────────────────────────────────────────────────────────── */
  var _active      = false;
  var _playerHP    = 100;
  var _playerDead  = false;
  var _playerWon   = false;
  var _score       = 0;
  var _stunTimer   = 0;      // seconds remaining of stun
  var _onBoard     = false;  // snowboard mounted
  var _boardTimer  = 0;      // seconds remaining of board speed bonus
  var _onLake      = false;  // player on frozen lake
  var _warmMeter   = 100;    // cold meter (drains over time)
  var _section     = 1;      // 1-4
  var _grappling   = false;
  var _grappleTimer = 0;
  var _grappleAnchor = null; // THREE.Vector3

  /* ── Timing ─────────────────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ── Avalanche ──────────────────────────────────────────────────────────── */
  var _avalancheMesh    = null;
  var _avalancheZ       = -40;  // starts behind player (negative Z = behind)
  var _avalancheSpeed   = 8;    // u/s

  /* ── Player position/velocity ───────────────────────────────────────────── */
  var _playerPos = null;  // THREE.Vector3
  var _playerVel = null;  // THREE.Vector3
  var _onGround  = false;
  var _yaw       = 0;
  var _pitch     = 0;

  /* ── Player mesh ────────────────────────────────────────────────────────── */
  var _playerMesh = null;

  /* ── Environment meshes ─────────────────────────────────────────────────── */
  var _chalets      = [];   // { mesh, bbox, collapsing, collapseTimer, crackLines, roofMesh, collapsed }
  var _trees        = [];   // { mesh, bbox, falling, fallTimer, fallWarn, warnMesh, fallen }
  var _cliffEdges   = [];   // { minX, maxX, z }  — deadly drop zones
  var _buriedCars   = [];   // { mesh, bbox }
  var _liftPoles    = [];   // { mesh, pos }
  var _liftCabins   = [];   // { mesh, swingAngle, swingSpeed, poleIndex }
  var _lake         = null; // { mesh, minX, maxX, minZ, maxZ }
  var _boulders     = [];   // { mesh, bbox } — ramps in section 4
  var _rescueStation = null;
  var _rescueLight   = null;
  var _groundMeshes  = [];  // { mesh, minX, maxX, minZ, maxZ, y }

  /* ── Survivors ───────────────────────────────────────────────────────────── */
  var _survivors = [];  // { mesh, pos, vel, rescued, following, delivered }
  var _survivorsDelivered = 0;

  /* ── Powerups ────────────────────────────────────────────────────────────── */
  var _snowboards  = [];  // { mesh, pos, taken }
  var _ropes       = [];  // { mesh, pos, taken }
  var _thermoses   = [];  // { mesh, pos, taken }

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Input ───────────────────────────────────────────────────────────────── */
  var _keys   = {};
  var _mouseX = 0;
  var _mouseY = 0;

  /* ── AE activation tracking ──────────────────────────────────────────────── */
  var _aePressTime = { A: 0, E: 0 };
  var AE_WINDOW    = 0.4;  // 400ms

  /* ── Bound handlers ──────────────────────────────────────────────────────── */
  var _boundKeyDown   = null;
  var _boundKeyUp     = null;
  var _boundMouseMove = null;

  /* ── Falling tree spawn timer ────────────────────────────────────────────── */
  var _treeWarnTimer  = 0;
  var _treeWarnNext   = 5;

  /* ── Chalet collapse timer ───────────────────────────────────────────────── */
  var _chaletWarnTimer = 0;
  var _chaletWarnNext  = 8;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function randInt(lo, hi) {
    return Math.floor(lo + Math.random() * (hi - lo + 1));
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function makeBBox(mesh) {
    var box = new THREE.Box3().setFromObject(mesh);
    return box;
  }

  function boxContainsXZ(bbox, x, z) {
    return x >= bbox.min.x && x <= bbox.max.x && z >= bbox.min.z && z <= bbox.max.z;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildSky() {
    _scene.background = new THREE.Color(0xCCDDEE);
    _scene.fog        = new THREE.FogExp2(0xAABBCC, 0.02);
    var ambLight = new THREE.AmbientLight(0xDDEEFF, 0.6);
    _scene.add(ambLight);
    var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    dirLight.position.set(50, 100, -50);
    _scene.add(dirLight);
  }

  function buildGroundSection(minX, maxX, zStart, zEnd, color) {
    var w    = maxX - minX;
    var d    = zEnd - zStart;
    var geo  = new THREE.BoxGeometry(w, 0.5, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((minX + maxX) / 2, -0.25, (zStart + zEnd) / 2);
    _scene.add(mesh);
    _groundMeshes.push({ mesh: mesh, minX: minX, maxX: maxX, minZ: zStart, maxZ: zEnd, y: 0 });
    return mesh;
  }

  function buildTerrain() {
    /* Section 1: resort village 0-80 */
    buildGroundSection(-20, 20, 0, 80, 0xEEEEFF);
    /* Section 2: open slopes 80-160 */
    buildGroundSection(-25, 25, 80, 160, 0xEEEEFF);
    /* Section 3: cliff path 160-240 (narrow 4u wide, centered) */
    buildGroundSection(-2, 2, 160, 240, 0xDDDDEE);
    /* Section 4: final descent 240-300 */
    buildGroundSection(-20, 20, 240, 300, 0xEEEEFF);

    /* Frozen lake in section 2 */
    var lakeGeo  = new THREE.BoxGeometry(12, 0.3, 18);
    var lakeMat  = new THREE.MeshLambertMaterial({ color: 0x88AACC, transparent: true, opacity: 0.85 });
    var lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
    lakeMesh.position.set(5, 0.05, 110);
    _scene.add(lakeMesh);
    _lake = { mesh: lakeMesh, minX: -1, maxX: 11, minZ: 101, maxZ: 119 };

    /* Cliff visual: dark void sides around section 3 */
    var voidGeo = new THREE.BoxGeometry(16, 2, 80);
    var voidMat = new THREE.MeshLambertMaterial({ color: 0x111122 });
    var voidL   = new THREE.Mesh(voidGeo, voidMat);
    voidL.position.set(-10, -2, 200);
    _scene.add(voidL);
    var voidR = new THREE.Mesh(voidGeo, voidMat);
    voidR.position.set(10, -2, 200);
    _scene.add(voidR);
    /* Cliff death edges */
    _cliffEdges.push({ minX: -100, maxX: -2.5, zStart: 160, zEnd: 240 });
    _cliffEdges.push({ minX: 2.5, maxX: 100, zStart: 160, zEnd: 240 });
  }

  function buildChalets() {
    /* 8 chalets scattered across sections 1 and 2 */
    var positions = [
      { x: -10, z: 15 }, { x: 12, z: 28 }, { x: -8, z: 45 }, { x: 14, z: 58 },
      { x: -15, z: 90 }, { x: 10, z: 105 }, { x: -12, z: 130 }, { x: 16, z: 148 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      /* Body */
      var bodyGeo  = new THREE.BoxGeometry(5, 4, 5);
      var bodyMat  = new THREE.MeshLambertMaterial({ color: 0x885533 });
      var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.set(p.x, 2, p.z);
      _scene.add(bodyMesh);
      /* Roof */
      var roofGeo  = new THREE.ConeGeometry(4, 2.5, 4);
      var roofMat  = new THREE.MeshLambertMaterial({ color: 0x663322 });
      var roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(p.x, 5.25, p.z);
      roofMesh.rotation.y = Math.PI / 4;
      _scene.add(roofMesh);
      var bbox = new THREE.Box3(
        new THREE.Vector3(p.x - 2.5, -1, p.z - 2.5),
        new THREE.Vector3(p.x + 2.5, 5, p.z + 2.5)
      );
      /* Crack warning lines (hidden initially) */
      var crackPts = [
        new THREE.Vector3(-2.5, 4.5, -2.5), new THREE.Vector3(2.5, 4.5, 2.5),
        new THREE.Vector3(-2.5, 4.5, 2.5), new THREE.Vector3(2.5, 4.5, -2.5),
        new THREE.Vector3(0, 3, -2.5), new THREE.Vector3(0, 3, 2.5)
      ];
      var crackGeo  = new THREE.BufferGeometry().setFromPoints(crackPts);
      var crackMat  = new THREE.LineBasicMaterial({ color: 0xFF2200, visible: false });
      var crackLines = new THREE.LineSegments(crackGeo, crackMat);
      crackLines.position.copy(bodyMesh.position);
      _scene.add(crackLines);
      _chalets.push({
        mesh: bodyMesh,
        roofMesh: roofMesh,
        bbox: bbox,
        crackLines: crackLines,
        collapsing: false,
        collapseTimer: 0,
        collapsed: false
      });
    }
  }

  function buildTrees() {
    /* 30 pine trees across sections 1-4 */
    var treePositions = [];
    for (var i = 0; i < 10; i++) {
      treePositions.push({ x: randRange(-18, 18), z: randRange(5, 75) });
    }
    for (var j = 0; j < 10; j++) {
      treePositions.push({ x: randRange(-23, 23), z: randRange(82, 158) });
    }
    for (var k = 0; k < 5; k++) {
      treePositions.push({ x: randRange(-1.5, 1.5), z: randRange(162, 238) });
    }
    for (var m = 0; m < 5; m++) {
      treePositions.push({ x: randRange(-18, 18), z: randRange(242, 298) });
    }
    for (var n = 0; n < treePositions.length; n++) {
      var tp = treePositions[n];
      /* Trunk */
      var trunkGeo  = new THREE.CylinderGeometry(0.25, 0.4, 3, 8);
      var trunkMat  = new THREE.MeshLambertMaterial({ color: 0x5C3D1A });
      var trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
      trunkMesh.position.set(tp.x, 1.5, tp.z);
      _scene.add(trunkMesh);
      /* Foliage layers */
      var fol1Geo  = new THREE.ConeGeometry(1.8, 3, 8);
      var fol1Mat  = new THREE.MeshLambertMaterial({ color: 0x1A5C1A });
      var fol1     = new THREE.Mesh(fol1Geo, fol1Mat);
      fol1.position.set(tp.x, 4, tp.z);
      _scene.add(fol1);
      var fol2Geo  = new THREE.ConeGeometry(1.3, 2.5, 8);
      var fol2     = new THREE.Mesh(fol2Geo, fol1Mat);
      fol2.position.set(tp.x, 5.8, tp.z);
      _scene.add(fol2);
      /* Shadow warning (ground circle, hidden initially) */
      var warnGeo  = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 12);
      var warnMat  = new THREE.MeshLambertMaterial({ color: 0xFF4400, transparent: true, opacity: 0.5, visible: false });
      var warnMesh = new THREE.Mesh(warnGeo, warnMat);
      warnMesh.position.set(tp.x, 0.1, tp.z);
      _scene.add(warnMesh);
      var bbox = new THREE.Box3(
        new THREE.Vector3(tp.x - 1, -1, tp.z - 1),
        new THREE.Vector3(tp.x + 1, 7, tp.z + 1)
      );
      _trees.push({
        trunk: trunkMesh,
        fol1: fol1,
        fol2: fol2,
        warnMesh: warnMesh,
        bbox: bbox,
        x: tp.x,
        z: tp.z,
        falling: false,
        fallTimer: 0,
        fallen: false,
        warned: false
      });
    }
  }

  function buildBuriedCars() {
    /* Half-submerged cars */
    var carPositions = [
      { x: -7, z: 22 }, { x: 9, z: 50 }, { x: -13, z: 100 }, { x: 6, z: 140 },
      { x: 15, z: 72 }, { x: -5, z: 260 }
    ];
    for (var i = 0; i < carPositions.length; i++) {
      var cp  = carPositions[i];
      var geo = new THREE.BoxGeometry(2.5, 1.5, 4.5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cp.x, -0.3, cp.z);  /* half submerged */
      _scene.add(mesh);
      var bbox = new THREE.Box3(
        new THREE.Vector3(cp.x - 1.25, -1, cp.z - 2.25),
        new THREE.Vector3(cp.x + 1.25, 1.5, cp.z + 2.25)
      );
      _buriedCars.push({ mesh: mesh, bbox: bbox });
    }
  }

  function buildSkiLifts() {
    /* 3 ski lifts with poles and swinging cabins */
    var liftData = [
      { x: -16, zStart: 30, zEnd: 70 },
      { x: 18, zStart: 90, zEnd: 140 },
      { x: -18, zStart: 250, zEnd: 290 }
    ];
    for (var li = 0; li < liftData.length; li++) {
      var ld = liftData[li];
      /* Poles every 20 units */
      var poleStep = 20;
      for (var pz = ld.zStart; pz <= ld.zEnd; pz += poleStep) {
        var poleGeo  = new THREE.CylinderGeometry(0.2, 0.3, 8, 6);
        var poleMat  = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var poleMesh = new THREE.Mesh(poleGeo, poleMat);
        poleMesh.position.set(ld.x, 4, pz);
        _scene.add(poleMesh);
        _liftPoles.push({ mesh: poleMesh, pos: new THREE.Vector3(ld.x, 8, pz) });
        /* Cable (LineSegments) to next pole */
        if (pz + poleStep <= ld.zEnd) {
          var cablePts = [
            new THREE.Vector3(ld.x, 8, pz),
            new THREE.Vector3(ld.x, 7.5, pz + poleStep / 2),
            new THREE.Vector3(ld.x, 8, pz + poleStep)
          ];
          var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePts);
          var cableMat = new THREE.LineBasicMaterial({ color: 0x444444 });
          var cable    = new THREE.LineSegments(cableGeo, cableMat);
          _scene.add(cable);
        }
        /* Cabin on pole */
        var cabinGeo  = new THREE.BoxGeometry(1.2, 1.5, 1.2);
        var cabinMat  = new THREE.MeshLambertMaterial({ color: 0xCC4422 });
        var cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
        cabinMesh.position.set(ld.x + 1, 7.5, pz);
        _scene.add(cabinMesh);
        _liftCabins.push({
          mesh: cabinMesh,
          basePoleX: ld.x,
          basePoleZ: pz,
          basePoleY: 8,
          swingAngle: Math.random() * Math.PI * 2,
          swingSpeed: 0.4 + Math.random() * 0.3
        });
      }
    }
  }

  function buildAvalanche() {
    /* Massive wall of snow */
    var geo  = new THREE.BoxGeometry(80, 20, 4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xEEEEFF });
    _avalancheMesh = new THREE.Mesh(geo, mat);
    _avalancheZ    = _playerPos.z - 40;  /* starts 40u behind player */
    _avalancheMesh.position.set(0, 8, _avalancheZ);
    _scene.add(_avalancheMesh);
  }

  function buildSurvivors() {
    var survPositions = [
      { x: -5, z: 20 }, { x: 8, z: 40 }, { x: -12, z: 95 },
      { x: 3, z: 125 }, { x: -1, z: 200 }, { x: 10, z: 270 }
    ];
    for (var i = 0; i < survPositions.length; i++) {
      var sp  = survPositions[i];
      var geo = new THREE.BoxGeometry(0.8, 1.8, 0.4);
      var mat = new THREE.MeshLambertMaterial({ color: 0xFFDDCC });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sp.x, 0.9, sp.z);
      _scene.add(mesh);
      _survivors.push({
        mesh: mesh,
        pos: new THREE.Vector3(sp.x, 0.9, sp.z),
        vel: new THREE.Vector3(randRange(-1, 1), 0, randRange(2, 4)),
        rescued: false,
        following: false,
        delivered: false
      });
    }
  }

  function buildPowerups() {
    /* Snowboards */
    var boardPositions = [{ x: 3, z: 35 }, { x: -7, z: 175 }, { x: 5, z: 255 }];
    for (var bi = 0; bi < boardPositions.length; bi++) {
      var bp  = boardPositions[bi];
      var geo = new THREE.BoxGeometry(0.4, 0.15, 1.6);
      var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bp.x, 0.15, bp.z);
      _scene.add(mesh);
      _snowboards.push({ mesh: mesh, pos: new THREE.Vector3(bp.x, 0.15, bp.z), taken: false });
    }
    /* Ropes */
    var ropePositions = [{ x: -14, z: 62 }, { x: 12, z: 155 }];
    for (var ri = 0; ri < ropePositions.length; ri++) {
      var rp  = ropePositions[ri];
      var geo2 = new THREE.BoxGeometry(0.3, 0.3, 0.8);
      var mat2 = new THREE.MeshLambertMaterial({ color: 0xCC8822 });
      var mesh2 = new THREE.Mesh(geo2, mat2);
      mesh2.position.set(rp.x, 0.3, rp.z);
      _scene.add(mesh2);
      _ropes.push({ mesh: mesh2, pos: new THREE.Vector3(rp.x, 0.3, rp.z), taken: false });
    }
    /* Hot thermoses */
    var thermoPositions = [{ x: 7, z: 55 }, { x: -3, z: 120 }, { x: 8, z: 215 }, { x: -6, z: 275 }];
    for (var ti = 0; ti < thermoPositions.length; ti++) {
      var tp2 = thermoPositions[ti];
      var geo3 = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
      var mat3 = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
      var mesh3 = new THREE.Mesh(geo3, mat3);
      mesh3.position.set(tp2.x, 0.4, tp2.z);
      _scene.add(mesh3);
      _thermoses.push({ mesh: mesh3, pos: new THREE.Vector3(tp2.x, 0.4, tp2.z), taken: false });
    }
  }

  function buildBoulders() {
    /* Section 4 boulders as ramps */
    var boulderData = [
      { x: -6, z: 252 }, { x: 4, z: 265 }, { x: -10, z: 278 }, { x: 8, z: 288 }
    ];
    for (var i = 0; i < boulderData.length; i++) {
      var bd  = boulderData[i];
      var geo = new THREE.SphereGeometry(1.5, 8, 6);
      var mat = new THREE.MeshLambertMaterial({ color: 0x776655 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bd.x, 1.5, bd.z);
      _scene.add(mesh);
      var bbox = new THREE.Box3(
        new THREE.Vector3(bd.x - 1.5, -0.5, bd.z - 1.5),
        new THREE.Vector3(bd.x + 1.5, 3.5, bd.z + 1.5)
      );
      _boulders.push({ mesh: mesh, bbox: bbox, x: bd.x, z: bd.z });
    }
  }

  function buildRescueStation() {
    var geo  = new THREE.BoxGeometry(8, 4, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 2, 308);
    _scene.add(mesh);
    _rescueStation = mesh;
    /* Beacon light */
    _rescueLight = new THREE.PointLight(0xFFFF44, 2, 40);
    _rescueLight.position.set(0, 8, 308);
    _scene.add(_rescueLight);
    /* Sign post */
    var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0xAA6622 });
    var pole    = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 2.5, 300);
    _scene.add(pole);
  }

  function buildPlayerMesh() {
    var geo  = new THREE.BoxGeometry(0.6, 1.7, 0.4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x2244AA });
    _playerMesh = new THREE.Mesh(geo, mat);
    _playerMesh.position.copy(_playerPos);
    _playerMesh.visible = false;  /* FPS — camera is the player */
    _scene.add(_playerMesh);
  }

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'ae-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,30,0.72)',
      'color:#EEF',
      'font:bold 13px/1.6 monospace',
      'padding:6px 16px',
      'border-radius:5px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'letter-spacing:0.05em',
      'text-shadow:0 0 6px #66BBFF'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function updateHUD() {
    if (!_hud) return;
    var distToSafety = Math.max(0, Math.round(300 - _playerPos.z));
    var avalancheBehind = Math.round(_playerPos.z - _avalancheZ);
    var speedLabel = _onBoard ? 'BOARDING' : 'NORMAL';
    var delivered  = 0;
    for (var i = 0; i < _survivors.length; i++) {
      if (_survivors[i].delivered) delivered++;
    }
    var secNum = _section;
    _hud.innerHTML =
      'AVALANCHE ESCAPE &nbsp;|&nbsp; ' +
      'DISTANCE: ' + distToSafety + 'm &nbsp;|&nbsp; ' +
      'AVALANCHE: ' + avalancheBehind + 'm BEHIND &nbsp;|&nbsp; ' +
      'SURVIVORS: ' + delivered + '/6 &nbsp;|&nbsp; ' +
      'SPEED: ' + speedLabel + ' &nbsp;|&nbsp; ' +
      'SECTION: ' + secNum + '/4 &nbsp;|&nbsp; ' +
      'HP: ' + Math.round(_playerHP);
  }

  function removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
    }
    _hud = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    /* AE activation */
    var now = performance.now() / 1000;
    if (k === 'A') { _aePressTime.A = now; }
    if (k === 'E') { _aePressTime.E = now; }
    if (!_active) {
      if (Math.abs(_aePressTime.A - _aePressTime.E) < AE_WINDOW &&
          _aePressTime.A > 0 && _aePressTime.E > 0) {
        activateGame();
      }
      return;
    }

    /* T — grapple rope */
    if (k === 'T' && !_grappling) {
      tryGrapple();
    }

    /* E — interact */
    if (k === 'E') {
      tryInteract();
    }
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    _yaw   -= e.movementX * 0.002;
    _pitch -= e.movementY * 0.002;
    _pitch  = clamp(_pitch, -1.2, 1.2);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION / CLEANUP
  ════════════════════════════════════════════════════════════════════════ */

  function activateGame() {
    if (_active) return;
    _active = true;
    _aePressTime.A = 0;
    _aePressTime.E = 0;

    /* Request pointer lock */
    if (_canvas && _canvas.requestPointerLock) {
      _canvas.requestPointerLock();
    }

    buildSky();
    buildTerrain();
    buildChalets();
    buildTrees();
    buildBuriedCars();
    buildSkiLifts();
    buildBoulders();
    buildSurvivors();
    buildPowerups();
    buildAvalanche();
    buildRescueStation();
    buildPlayerMesh();
    buildHUD();
  }

  function tryGrapple() {
    /* Find nearest lift pole within 15u */
    var best = null;
    var bestDist = 15;
    for (var i = 0; i < _liftPoles.length; i++) {
      var d = distXZ(_playerPos, _liftPoles[i].pos);
      if (d < bestDist) {
        bestDist = d;
        best = _liftPoles[i];
      }
    }
    /* Check ropes inventory */
    var hasRope = false;
    for (var r = 0; r < _ropes.length; r++) {
      if (_ropes[r].taken) { hasRope = true; break; }
    }
    if (best && hasRope) {
      _grappling = true;
      _grappleAnchor = best.pos.clone();
      _grappleTimer  = 2.5;  /* swing for 2.5s */
    }
  }

  function tryInteract() {
    /* Survivors */
    for (var i = 0; i < _survivors.length; i++) {
      var sv = _survivors[i];
      if (!sv.rescued && distXZ(_playerPos, sv.pos) < 2.5) {
        sv.rescued   = true;
        sv.following = true;
      }
    }
    /* Snowboard */
    for (var bi = 0; bi < _snowboards.length; bi++) {
      var sb = _snowboards[bi];
      if (!sb.taken && distXZ(_playerPos, sb.pos) < 2) {
        sb.taken     = true;
        sb.mesh.visible = false;
        _onBoard     = true;
        _boardTimer  = 20;
      }
    }
    /* Rope */
    for (var ri = 0; ri < _ropes.length; ri++) {
      var rp = _ropes[ri];
      if (!rp.taken && distXZ(_playerPos, rp.pos) < 2) {
        rp.taken     = true;
        rp.mesh.visible = false;
      }
    }
    /* Thermos */
    for (var ti = 0; ti < _thermoses.length; ti++) {
      var th = _thermoses[ti];
      if (!th.taken && distXZ(_playerPos, th.pos) < 2) {
        th.taken     = true;
        th.mesh.visible = false;
        _playerHP    = Math.min(100, _playerHP + 50);
        _warmMeter   = Math.min(100, _warmMeter + 30);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GAME LOGIC UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateAvalanche(dt) {
    /* Speed scales by section */
    if (_section === 1) { _avalancheSpeed = 8; }
    else if (_section === 2) { _avalancheSpeed = 10; }
    else if (_section === 3) { _avalancheSpeed = 10; }
    else { _avalancheSpeed = 12; }

    _avalancheZ += _avalancheSpeed * dt;
    _avalancheMesh.position.z = _avalancheZ;

    /* Pulse glow on avalanche */
    _avalancheMesh.material.emissive = new THREE.Color(0x8888CC);
    _avalancheMesh.material.emissiveIntensity = 0.1 + 0.05 * Math.sin(performance.now() / 200);

    /* Check catch */
    if (_avalancheZ >= _playerPos.z - 0.5) {
      killPlayer('BURIED BY AVALANCHE');
    }
  }

  function updateSection() {
    var z = _playerPos.z;
    if (z < 80)       { _section = 1; }
    else if (z < 160) { _section = 2; }
    else if (z < 240) { _section = 3; }
    else              { _section = 4; }
  }

  function updatePlayerMovement(dt) {
    if (_stunTimer > 0) {
      _stunTimer -= dt;
      /* Can't move while stunned */
      _playerVel.x = 0;
      _playerVel.z = 0;
      return;
    }

    var baseSpeed = _onBoard ? 8 * 1.6 : 8;
    if (_onLake) {
      /* Slippery — random direction drift */
      baseSpeed = 5;
    }

    var fwd  = new THREE.Vector3(-Math.sin(_yaw), 0, Math.cos(_yaw));
    var right = new THREE.Vector3(Math.cos(_yaw), 0, Math.sin(_yaw));
    var move  = new THREE.Vector3();

    if (_keys['W'] || _keys['ARROWUP'])    { move.add(fwd);   }
    if (_keys['S'] || _keys['ARROWDOWN'])  { move.sub(fwd);   }
    if (_keys['A'] || _keys['ARROWLEFT'])  { move.sub(right); }
    if (_keys['D'] || _keys['ARROWRIGHT']) { move.add(right); }

    if (move.lengthSq() > 0) { move.normalize(); }

    if (_onLake) {
      /* Add random drift */
      move.x += (Math.random() - 0.5) * 0.4;
      move.z += (Math.random() - 0.5) * 0.3;
    }

    _playerVel.x = move.x * baseSpeed;
    _playerVel.z = move.z * baseSpeed;

    /* Jump */
    if ((_keys[' '] || _keys['SPACE']) && _onGround) {
      _playerVel.y = _onBoard ? 7 : 4.5;
      _onGround = false;
    }

    /* Grapple override */
    if (_grappling && _grappleAnchor) {
      _grappleTimer -= dt;
      var toAnchor = new THREE.Vector3().subVectors(_grappleAnchor, _playerPos);
      var dist     = toAnchor.length();
      if (dist > 0.5) {
        toAnchor.normalize().multiplyScalar(10);
        _playerVel.x = toAnchor.x;
        _playerVel.z = toAnchor.z;
      }
      if (_grappleTimer <= 0 || dist < 1) {
        _grappling = false;
        _grappleAnchor = null;
      }
    }
  }

  function updatePhysics(dt) {
    /* Gravity */
    if (!_onGround) {
      _playerVel.y -= 18 * dt;
    }

    _playerPos.x += _playerVel.x * dt;
    _playerPos.y += _playerVel.y * dt;
    _playerPos.z += _playerVel.z * dt;

    /* Ground check */
    var groundY = getGroundY(_playerPos.x, _playerPos.z);
    if (_playerPos.y <= groundY + 0.85) {
      _playerPos.y = groundY + 0.85;
      _playerVel.y = 0;
      _onGround    = true;
    } else {
      _onGround = false;
    }

    /* Cliff death check */
    checkCliffDeath();

    /* Boundary on non-cliff sections */
    if (_section !== 3) {
      var halfW = _section === 2 ? 24 : 19;
      _playerPos.x = clamp(_playerPos.x, -halfW, halfW);
    } else {
      /* Section 3: narrow path */
      _playerPos.x = clamp(_playerPos.x, -1.8, 1.8);
    }

    /* Keep from going too far behind */
    if (_playerPos.z < _avalancheZ + 0.5) {
      _playerPos.z = _avalancheZ + 0.5;
    }
  }

  function getGroundY(x, z) {
    /* Default ground */
    var gy = 0;
    /* Boulder ramp check */
    for (var i = 0; i < _boulders.length; i++) {
      var bd = _boulders[i];
      var dx = x - bd.x;
      var dz = z - bd.z;
      var distSq = dx * dx + dz * dz;
      if (distSq < 1.5 * 1.5) {
        var boulderTop = 1.5 - Math.sqrt(Math.max(0, 1.5 * 1.5 - distSq));
        gy = Math.max(gy, boulderTop);
      }
    }
    return gy;
  }

  function checkCliffDeath() {
    for (var i = 0; i < _cliffEdges.length; i++) {
      var ce = _cliffEdges[i];
      if (_playerPos.z >= ce.zStart && _playerPos.z <= ce.zEnd) {
        if (_playerPos.x >= ce.minX && _playerPos.x <= ce.maxX) {
          killPlayer('FELL OFF CLIFF');
          return;
        }
      }
    }
  }

  function updateLake() {
    if (!_lake) { _onLake = false; return; }
    _onLake = (
      _playerPos.x >= _lake.minX && _playerPos.x <= _lake.maxX &&
      _playerPos.z >= _lake.minZ && _playerPos.z <= _lake.maxZ
    );
  }

  function updateChaletCollapse(dt) {
    /* Trigger warning on a random non-collapsing chalet near player periodically */
    _chaletWarnTimer += dt;
    if (_chaletWarnTimer > _chaletWarnNext) {
      _chaletWarnTimer = 0;
      _chaletWarnNext  = randRange(6, 14);
      var nearby = [];
      for (var i = 0; i < _chalets.length; i++) {
        var ch = _chalets[i];
        if (!ch.collapsing && !ch.collapsed) {
          var cx = ch.mesh.position.x;
          var cz = ch.mesh.position.z;
          var dx = _playerPos.x - cx;
          var dz = _playerPos.z - cz;
          if (Math.sqrt(dx * dx + dz * dz) < 25) {
            nearby.push(i);
          }
        }
      }
      if (nearby.length > 0) {
        var idx = nearby[randInt(0, nearby.length - 1)];
        _chalets[idx].collapsing = true;
        _chalets[idx].collapseTimer = 3;
        _chalets[idx].crackLines.material.visible = true;
      }
    }

    /* Update collapsing chalets */
    for (var ci = 0; ci < _chalets.length; ci++) {
      var ch = _chalets[ci];
      if (ch.collapsing && !ch.collapsed) {
        ch.collapseTimer -= dt;
        if (ch.collapseTimer <= 0) {
          /* Collapse: drop roof */
          ch.roofMesh.position.y -= 3;
          ch.mesh.scale.y = 0.3;
          ch.mesh.position.y = 0.3;
          ch.crackLines.material.visible = false;
          ch.collapsed = true;
          /* Check player hit */
          var px  = _playerPos.x;
          var pz2 = _playerPos.z;
          var cx2 = ch.mesh.position.x;
          var cz2 = ch.mesh.position.z;
          if (Math.abs(px - cx2) < 4 && Math.abs(pz2 - cz2) < 4) {
            _playerHP -= 60;
            if (_playerHP <= 0) killPlayer('CRUSHED BY COLLAPSING CHALET');
          }
        }
      }
    }
  }

  function updateFallingTrees(dt) {
    _treeWarnTimer += dt;
    if (_treeWarnTimer > _treeWarnNext) {
      _treeWarnTimer = 0;
      _treeWarnNext  = randRange(3, 7);
      /* Find a tree ahead of player that isn't already falling */
      var candidates = [];
      for (var i = 0; i < _trees.length; i++) {
        var t = _trees[i];
        if (!t.falling && !t.fallen) {
          var dz = t.z - _playerPos.z;
          if (dz > 2 && dz < 30) { candidates.push(i); }
        }
      }
      if (candidates.length > 0) {
        var idx = candidates[randInt(0, candidates.length - 1)];
        _trees[idx].falling = true;
        _trees[idx].fallTimer = 2;
        _trees[idx].warnMesh.material.visible = true;
      }
    }

    for (var ti = 0; ti < _trees.length; ti++) {
      var tr = _trees[ti];
      if (tr.falling && !tr.fallen) {
        tr.fallTimer -= dt;
        /* Pulse warning */
        tr.warnMesh.material.opacity = 0.3 + 0.4 * Math.abs(Math.sin(tr.fallTimer * 5));
        if (tr.fallTimer <= 0) {
          /* Crash down — rotate trunk & foliage */
          tr.trunk.rotation.x = Math.PI / 2;
          tr.trunk.position.y = 0.5;
          tr.fol1.rotation.x  = Math.PI / 2;
          tr.fol1.position.y  = 0.5;
          tr.fol2.rotation.x  = Math.PI / 2;
          tr.fol2.position.y  = 0.5;
          tr.warnMesh.material.visible = false;
          tr.fallen = true;
          /* Damage player if in range */
          var d = distXZ(_playerPos, { x: tr.x, z: tr.z });
          if (d < 2.5) {
            _playerHP -= 50;
            if (_playerHP <= 0) killPlayer('CRUSHED BY FALLING TREE');
          }
        }
      }
    }
  }

  function updateBuriedCars() {
    for (var i = 0; i < _buriedCars.length; i++) {
      var car = _buriedCars[i];
      if (boxContainsXZ(car.bbox, _playerPos.x, _playerPos.z) && _stunTimer <= 0) {
        /* Stumble into car */
        _stunTimer  = 0.5;
        _playerVel.x += randRange(-3, 3);
        _playerVel.z += randRange(-2, 2);
      }
    }
  }

  function updateChaletCollisions() {
    for (var i = 0; i < _chalets.length; i++) {
      var ch = _chalets[i];
      if (ch.collapsed) continue;
      if (boxContainsXZ(ch.bbox, _playerPos.x, _playerPos.z)) {
        /* Push player out */
        var cx  = ch.mesh.position.x;
        var cz  = ch.mesh.position.z;
        var dx2 = _playerPos.x - cx;
        var dz2 = _playerPos.z - cz;
        if (Math.abs(dx2) > Math.abs(dz2)) {
          _playerPos.x = cx + (dx2 > 0 ? 3 : -3);
        } else {
          _playerPos.z = cz + (dz2 > 0 ? 3 : -3);
        }
        _playerVel.x = 0;
        _playerVel.z = 0;
      }
    }
  }

  function updateTreeCollisions() {
    for (var i = 0; i < _trees.length; i++) {
      var tr2 = _trees[i];
      if (tr2.fallen) continue;
      var d = distXZ(_playerPos, { x: tr2.x, z: tr2.z });
      if (d < 1.2) {
        /* Slow player (branches) by 20% */
        _playerVel.x *= 0.8;
        _playerVel.z *= 0.8;
        /* Push out */
        var dx3 = _playerPos.x - tr2.x;
        var dz3 = _playerPos.z - tr2.z;
        var len  = Math.sqrt(dx3 * dx3 + dz3 * dz3) || 1;
        _playerPos.x = tr2.x + (dx3 / len) * 1.3;
        _playerPos.z = tr2.z + (dz3 / len) * 1.3;
      }
    }
  }

  function updateSurvivors(dt) {
    for (var i = 0; i < _survivors.length; i++) {
      var sv = _survivors[i];
      if (sv.delivered) continue;
      if (sv.following) {
        /* Follow player */
        var toPlayer = new THREE.Vector3().subVectors(_playerPos, sv.pos);
        var dist     = toPlayer.length();
        if (dist > 2) {
          toPlayer.normalize().multiplyScalar(5 * dt);
          sv.pos.add(toPlayer);
          sv.mesh.position.copy(sv.pos);
        }
        /* Check delivery */
        if (sv.pos.z >= 300) {
          sv.delivered = true;
          sv.mesh.visible = false;
          _survivorsDelivered++;
          _score += 500;
        }
      } else {
        /* Panic wander */
        sv.pos.x += sv.vel.x * dt * 0.5;
        sv.pos.z += sv.vel.z * dt * 0.5;
        /* Clamp to valid areas */
        sv.pos.x = clamp(sv.pos.x, -18, 18);
        sv.mesh.position.copy(sv.pos);
      }
    }
  }

  function updateLiftCabins(dt) {
    for (var i = 0; i < _liftCabins.length; i++) {
      var cab = _liftCabins[i];
      cab.swingAngle += cab.swingSpeed * dt;
      cab.mesh.position.x = cab.basePoleX + Math.sin(cab.swingAngle) * 1.5;
      cab.mesh.position.y = cab.basePoleY - 1 + Math.cos(cab.swingAngle * 0.5) * 0.3;
      cab.mesh.position.z = cab.basePoleZ;
    }
  }

  function updateBoardTimer(dt) {
    if (_onBoard) {
      _boardTimer -= dt;
      if (_boardTimer <= 0) {
        _onBoard    = false;
        _boardTimer = 0;
      }
    }
  }

  function updateWarmMeter(dt) {
    _warmMeter -= dt * 1.5;
    if (_warmMeter <= 0) {
      _warmMeter  = 0;
      _playerHP  -= dt * 3;  /* Hypothermia damage */
      if (_playerHP <= 0) killPlayer('FROZEN TO DEATH');
    }
  }

  function updateRescueLight(dt) {
    if (_rescueLight) {
      _rescueLight.intensity = 1.5 + Math.sin(performance.now() / 300) * 0.5;
    }
  }

  function checkWin() {
    if (_playerPos.z >= 300 && !_playerWon) {
      _playerWon = true;
      showEndScreen(true);
    }
  }

  function killPlayer(reason) {
    if (_playerDead || _playerWon) return;
    _playerDead = true;
    showEndScreen(false, reason);
  }

  function showEndScreen(won, reason) {
    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,20,0.88)', 'color:#EEF',
      'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
      'font:bold 24px monospace', 'z-index:10000', 'text-align:center'
    ].join(';');
    var delivered = 0;
    for (var i = 0; i < _survivors.length; i++) {
      if (_survivors[i].delivered) delivered++;
    }
    var title  = won ? '★ YOU ESCAPED! ★' : '✖ GAME OVER';
    var detail = won
      ? 'You reached the valley safely!'
      : (reason || 'You did not make it.');
    overlay.innerHTML =
      '<div style="font-size:2em;margin-bottom:16px">' + title + '</div>' +
      '<div style="margin:8px 0">' + detail + '</div>' +
      '<div style="margin:8px 0">SURVIVORS DELIVERED: ' + delivered + '/6</div>' +
      '<div style="margin:8px 0">SCORE: ' + _score + '</div>' +
      '<div style="margin:24px 0;font-size:0.7em;color:#AABBCC">Press R to play again</div>';
    document.body.appendChild(overlay);
    /* R to reset */
    var onR = function (e) {
      if (e.key.toUpperCase() === 'R') {
        document.removeEventListener('keydown', onR);
        overlay.remove();
        reset();
      }
    };
    document.addEventListener('keydown', onR);
  }

  function updateCamera() {
    if (!_camera) return;
    _camera.position.copy(_playerPos);
    _camera.position.y += 0.85;  /* eye height */
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  function updateScore(dt) {
    /* Score for surviving (distance-based) */
    _score += Math.round(_playerPos.z * 0.1);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');

    _playerPos = new THREE.Vector3(0, 1, 5);
    _playerVel = new THREE.Vector3(0, 0, 0);
    _yaw       = 0;
    _pitch     = 0;

    _boundKeyDown   = onKeyDown;
    _boundKeyUp     = onKeyUp;
    _boundMouseMove = onMouseMove;

    document.addEventListener('keydown', _boundKeyDown);
    document.addEventListener('keyup',   _boundKeyUp);
    document.addEventListener('mousemove', _boundMouseMove);
  }

  function update(now) {
    if (!_active) return;
    var dt = Math.min((now - _lastTime) / 1000, 0.05);
    _lastTime = now;
    if (dt <= 0) return;
    if (_playerDead || _playerWon) return;

    updateSection();
    updatePlayerMovement(dt);
    updatePhysics(dt);
    updateLake();
    updateAvalanche(dt);
    updateChaletCollapse(dt);
    updateFallingTrees(dt);
    updateBuriedCars();
    updateChaletCollisions();
    updateTreeCollisions();
    updateSurvivors(dt);
    updateLiftCabins(dt);
    updateBoardTimer(dt);
    updateWarmMeter(dt);
    updateRescueLight(dt);
    checkWin();
    updateScore(dt);
    updateCamera();
    updateHUD();
  }

  function reset() {
    /* Remove all game objects */
    while (_scene && _scene.children.length > 0) {
      var child = _scene.children[0];
      _scene.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    /* Reset state */
    _active      = false;
    _playerHP    = 100;
    _playerDead  = false;
    _playerWon   = false;
    _score       = 0;
    _stunTimer   = 0;
    _onBoard     = false;
    _boardTimer  = 0;
    _onLake      = false;
    _warmMeter   = 100;
    _section     = 1;
    _grappling   = false;
    _grappleTimer = 0;
    _grappleAnchor = null;
    _avalancheZ  = -40;
    _avalancheSpeed = 8;
    _onGround    = false;
    _survivorsDelivered = 0;
    _treeWarnTimer  = 0;
    _treeWarnNext   = 5;
    _chaletWarnTimer = 0;
    _chaletWarnNext  = 8;
    _lastTime    = 0;
    _keys        = {};
    _yaw         = 0;
    _pitch       = 0;

    /* Clear arrays */
    _chalets     = [];
    _trees       = [];
    _cliffEdges  = [];
    _buriedCars  = [];
    _liftPoles   = [];
    _liftCabins  = [];
    _lake        = null;
    _boulders    = [];
    _survivors   = [];
    _snowboards  = [];
    _ropes       = [];
    _thermoses   = [];
    _groundMeshes = [];
    _rescueStation = null;
    _rescueLight   = null;
    _avalancheMesh = null;
    _playerMesh    = null;

    _playerPos = new THREE.Vector3(0, 1, 5);
    _playerVel = new THREE.Vector3(0, 0, 0);
    _aePressTime = { A: 0, E: 0 };

    removeHUD();

    if (_canvas && _canvas.requestPointerLock) {
      document.exitPointerLock();
    }
  }

  return { init: init, update: update, reset: reset };

}());
