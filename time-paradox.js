window.TimeParadox = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── State ────────────────────────────────────────────────────────────────
  var _active = false;
  var _lastTTime = 0;
  var _lastPTime = 0;

  var _scene, _camera, _renderer, _clock;
  var _animId = null;

  // Player
  var _playerHP = 100;
  var _playerPos = { x: 0, y: 1.7, z: 0 };
  var _yaw = 0;
  var _pitch = 0;
  var _moveForward = false;
  var _moveBack = false;
  var _moveLeft = false;
  var _moveRight = false;
  var _canJump = true;
  var _velY = 0;

  // Time periods
  var _currentPeriod = 0; // 0=WWI, 1=ColdWar, 2=Future
  var _periodNames = ['WWI TRENCHES', 'COLD WAR FACILITY', 'FUTURE 2350'];

  // Temporal energy & paradox
  var _temporalEnergy = 100;
  var _paradoxMeter = 0;

  // Game objects per period
  var _periodScenes = [null, null, null];    // THREE.Group per period
  var _enemies = [[], [], []];               // enemy objects per period
  var _portals = [null, null, null];         // portal meshes
  var _anchors = [null, null, null];         // anchor meshes
  var _anchorLights = [null, null, null];
  var _portalLights = [null, null, null];
  var _explosionLights = [];                 // WWI flash lights

  // Game progress
  var _anchorsSecured = [false, false, false];
  var _agentKilled = [false, false, false];

  // HUD
  var _hudEl = null;
  var _overlayEl = null;

  // Shooting
  var _raycaster = null;
  var _shootCooldown = 0;

  // Portal cooldown
  var _portalCooldown = 0;

  // Win/Lose
  var _gameOver = false;
  var _gameWon = false;

  // ── Key handlers ─────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (!_active) {
      if (e.key === 't' || e.key === 'T') { _lastTTime = Date.now(); }
      if ((e.key === 'p' || e.key === 'P') && (Date.now() - _lastTTime < 400)) { init(); }
      return;
    }
    if (e.code === 'KeyW') _moveForward = true;
    if (e.code === 'KeyS') _moveBack = true;
    if (e.code === 'KeyA') _moveLeft = true;
    if (e.code === 'KeyD') _moveRight = true;
    if (e.code === 'Space' && _canJump) { _velY = 8; _canJump = false; }
    if (e.code === 'KeyE') _trySecureAnchor();
    if (e.code === 'Escape') { document.exitPointerLock && document.exitPointerLock(); }
  }

  function _onKeyUp(e) {
    if (!_active) return;
    if (e.code === 'KeyW') _moveForward = false;
    if (e.code === 'KeyS') _moveBack = false;
    if (e.code === 'KeyA') _moveLeft = false;
    if (e.code === 'KeyD') _moveRight = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    if (document.pointerLockElement) {
      _yaw   -= e.movementX * 0.002;
      _pitch -= e.movementY * 0.002;
      _pitch = Math.max(-1.2, Math.min(1.2, _pitch));
    }
  }

  function _onClick(e) {
    if (!_active || _gameOver || _gameWon) return;
    if (!document.pointerLockElement && _renderer) {
      _renderer.domElement.requestPointerLock();
      return;
    }
    _shoot();
  }

  // ── Build period 0: WWI Trenches ─────────────────────────────────────────
  function _buildWWI() {
    var g = new THREE.Group();

    // Ground
    var groundGeo = new THREE.BoxGeometry(80, 0.5, 80);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x5a3a10 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.25, 0);
    g.add(ground);

    // Fog / ambient
    var ambient = new THREE.AmbientLight(0x553322, 0.6);
    g.add(ambient);
    var sunLight = new THREE.DirectionalLight(0x886644, 0.8);
    sunLight.position.set(10, 20, 10);
    g.add(sunLight);

    // Zigzag trenches (lowered boxes)
    var trenchMat = new THREE.MeshLambertMaterial({ color: 0x3d2508 });
    var trenchPts = [
      { x: -10, z: -20, w: 3, l: 10 },
      { x: -7,  z: -10, w: 10, l: 3 },
      { x: 3,   z: -13, w: 3, l: 10 },
      { x: 3,   z: -3,  w: 10, l: 3 },
      { x: 13,  z: -6,  w: 3, l: 10 }
    ];
    for (var ti = 0; ti < trenchPts.length; ti++) {
      var tp = trenchPts[ti];
      var tGeo = new THREE.BoxGeometry(tp.w, 1.5, tp.l);
      var tMesh = new THREE.Mesh(tGeo, trenchMat);
      tMesh.position.set(tp.x, -0.75, tp.z);
      g.add(tMesh);
    }

    // Sandbag walls
    var bagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    for (var bi = 0; bi < 12; bi++) {
      var bGeo = new THREE.BoxGeometry(2, 1, 1);
      var bMesh = new THREE.Mesh(bGeo, bagMat);
      bMesh.position.set(-15 + bi * 3, 0.5, 5);
      g.add(bMesh);
    }

    // Barbed wire (LineSegments)
    var wireVerts = [];
    for (var wi = 0; wi < 20; wi++) {
      var wx = -20 + wi * 2;
      wireVerts.push(wx, 0.8, 10,  wx + 1, 0.6, 10);
      wireVerts.push(wx, 0.8, 10,  wx,     1.0, 10.5);
    }
    var wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wireVerts, 3));
    var wireMat = new THREE.LineSegmentsMaterial ? new THREE.LineSegmentsMaterial({ color: 0x333333 }) : new THREE.LineBasicMaterial({ color: 0x333333 });
    var wire = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x333333 }));
    g.add(wire);

    // Explosion lights (orange flashes)
    for (var eli = 0; eli < 4; eli++) {
      var eLight = new THREE.PointLight(0xff6600, 0, 30);
      eLight.position.set(-20 + eli * 12, 5, -25);
      g.add(eLight);
      _explosionLights.push({ light: eLight, timer: Math.random() * 3, period: 0 });
    }

    // Portal
    var portalGeo = new THREE.SphereGeometry(1.2, 16, 16);
    var portalMat = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0x884400 });
    var portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(18, 1.5, -15);
    g.add(portal);
    _portals[0] = portal;
    var pLight0 = new THREE.PointLight(0xffaa00, 2, 10);
    pLight0.position.copy(portal.position);
    g.add(pLight0);
    _portalLights[0] = pLight0;

    // Temporal anchor
    var ancGeo = new THREE.SphereGeometry(0.5, 12, 12);
    var ancMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x004444 });
    var anchor = new THREE.Mesh(ancGeo, ancMat);
    anchor.position.set(-18, 1.0, -18);
    anchor.userData.secured = false;
    g.add(anchor);
    _anchors[0] = anchor;
    var aLight0 = new THREE.PointLight(0x00ffff, 1.5, 8);
    aLight0.position.copy(anchor.position);
    g.add(aLight0);
    _anchorLights[0] = aLight0;

    // Enemies: 8 WWI soldiers + 1 Temporal Paradox Agent
    _enemies[0] = [];
    var soldierMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var agentMat   = new THREE.MeshLambertMaterial({ color: 0x553399 });
    for (var si = 0; si < 8; si++) {
      var sObj = _makeHumanoid(soldierMat, 60, 0);
      sObj.mesh.position.set(-12 + (si % 4) * 7, 1.0, -5 + Math.floor(si / 4) * 8);
      g.add(sObj.mesh);
      _enemies[0].push(sObj);
    }
    var agent0 = _makeHumanoid(agentMat, 500, 1);
    agent0.mesh.position.set(0, 1.0, -20);
    g.add(agent0.mesh);
    _enemies[0].push(agent0);

    return g;
  }

  // ── Build period 1: Cold War Facility ─────────────────────────────────────
  function _buildColdWar() {
    var g = new THREE.Group();

    // Floor
    var floorGeo = new THREE.BoxGeometry(80, 0.3, 80);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.15, 0);
    g.add(floor);

    var ambient1 = new THREE.AmbientLight(0x334433, 0.7);
    g.add(ambient1);
    var fluoro = new THREE.PointLight(0xaaffaa, 1.2, 40);
    fluoro.position.set(0, 8, 0);
    g.add(fluoro);

    // Concrete walls
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var wallDefs = [
      { x: 0,   y: 3, z: -30, w: 60, h: 6, d: 1 },
      { x: 0,   y: 3, z:  30, w: 60, h: 6, d: 1 },
      { x: -30, y: 3, z:  0,  w: 1,  h: 6, d: 60 },
      { x:  30, y: 3, z:  0,  w: 1,  h: 6, d: 60 }
    ];
    for (var wi = 0; wi < wallDefs.length; wi++) {
      var wd = wallDefs[wi];
      var wMesh = new THREE.Mesh(new THREE.BoxGeometry(wd.w, wd.h, wd.d), wallMat);
      wMesh.position.set(wd.x, wd.y, wd.z);
      g.add(wMesh);
    }

    // Server rooms (stacked boxes)
    var serverMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    for (var sri = 0; sri < 6; sri++) {
      for (var srj = 0; srj < 3; srj++) {
        var srMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1), serverMat);
        srMesh.position.set(-20 + sri * 2.5, 0.75 + srj * 1.5, -10);
        g.add(srMesh);
      }
    }

    // Control panels (LineSegments)
    var panelVerts = [];
    for (var pi = 0; pi < 8; pi++) {
      var px = -14 + pi * 4;
      panelVerts.push(px, 1.2, 15,  px + 3, 1.2, 15);
      panelVerts.push(px, 1.2, 15,  px,     0.8, 15);
      panelVerts.push(px + 3, 1.2, 15, px + 3, 0.8, 15);
      panelVerts.push(px + 1, 1.2, 15, px + 1, 1.6, 15);
    }
    var panelGeo = new THREE.BufferGeometry();
    panelGeo.setAttribute('position', new THREE.Float32BufferAttribute(panelVerts, 3));
    var panel = new THREE.LineSegments(panelGeo, new THREE.LineBasicMaterial({ color: 0x00ff44 }));
    g.add(panel);

    // US flag (color blocks)
    var usFlagMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var usFlag = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.1), usFlagMat);
    usFlag.position.set(-25, 4, -28);
    g.add(usFlag);
    var usBlue = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.11), new THREE.MeshLambertMaterial({ color: 0x0000aa }));
    usBlue.position.set(-26, 4.6, -27.9);
    g.add(usBlue);

    // Soviet flag
    var sovFlag = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.1), new THREE.MeshLambertMaterial({ color: 0xcc0000 }));
    sovFlag.position.set(25, 4, -28);
    g.add(sovFlag);

    // Portal
    var portalGeo = new THREE.SphereGeometry(1.2, 16, 16);
    var portalMat = new THREE.MeshLambertMaterial({ color: 0x44aaff, emissive: 0x002244 });
    var portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(20, 1.5, 15);
    g.add(portal);
    _portals[1] = portal;
    var pLight1 = new THREE.PointLight(0x44aaff, 2, 10);
    pLight1.position.copy(portal.position);
    g.add(pLight1);
    _portalLights[1] = pLight1;

    // Anchor
    var ancGeo = new THREE.SphereGeometry(0.5, 12, 12);
    var ancMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x004444 });
    var anchor = new THREE.Mesh(ancGeo, ancMat);
    anchor.position.set(-20, 1.0, 15);
    anchor.userData.secured = false;
    g.add(anchor);
    _anchors[1] = anchor;
    var aLight1 = new THREE.PointLight(0x00ffff, 1.5, 8);
    aLight1.position.copy(anchor.position);
    g.add(aLight1);
    _anchorLights[1] = aLight1;

    // Enemies
    _enemies[1] = [];
    var agentMat0 = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var agentMat1 = new THREE.MeshLambertMaterial({ color: 0x553399 });
    for (var ci = 0; ci < 8; ci++) {
      var cObj = _makeHumanoid(agentMat0, 90, 0);
      cObj.mesh.position.set(-10 + (ci % 4) * 6, 1.0, -5 + Math.floor(ci / 4) * 10);
      g.add(cObj.mesh);
      _enemies[1].push(cObj);
    }
    var agent1 = _makeHumanoid(agentMat1, 500, 1);
    agent1.mesh.position.set(5, 1.0, -22);
    g.add(agent1.mesh);
    _enemies[1].push(agent1);

    return g;
  }

  // ── Build period 2: Future 2350 ────────────────────────────────────────────
  function _buildFuture() {
    var g = new THREE.Group();

    // Glowing floor
    var fGeo = new THREE.BoxGeometry(80, 0.2, 80);
    var fMat = new THREE.MeshLambertMaterial({ color: 0x0a0a2a, emissive: 0x050520 });
    var floor = new THREE.Mesh(fGeo, fMat);
    floor.position.set(0, -0.1, 0);
    g.add(floor);

    var ambient2 = new THREE.AmbientLight(0x111133, 0.5);
    g.add(ambient2);
    var neonLight = new THREE.PointLight(0x4444ff, 1.5, 50);
    neonLight.position.set(0, 10, 0);
    g.add(neonLight);

    // Holographic walls (LineSegments neon)
    var hWallVerts = [];
    var holoPositions = [
      { x: 0, z: -28 }, { x: 0, z: 28 },
      { x: -28, z: 0 }, { x: 28, z: 0 }
    ];
    for (var hi = 0; hi < holoPositions.length; hi++) {
      var hp = holoPositions[hi];
      for (var hj = 0; hj < 10; hj++) {
        var hx1 = hp.z === 0 ? hp.x : hp.x - 20 + hj * 4;
        var hz1 = hp.z === 0 ? hp.z - 20 + hj * 4 : hp.z;
        var hx2 = hp.z === 0 ? hp.x : hx1 + 4;
        var hz2 = hp.z === 0 ? hz1 + 4 : hp.z;
        hWallVerts.push(hx1, 0, hz1, hx2, 0, hz2);
        hWallVerts.push(hx1, 0, hz1, hx1, 5, hz1);
        hWallVerts.push(hx2, 0, hz2, hx2, 5, hz2);
        hWallVerts.push(hx1, 5, hz1, hx2, 5, hz2);
      }
    }
    var hWallGeo = new THREE.BufferGeometry();
    hWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(hWallVerts, 3));
    var hWall = new THREE.LineSegments(hWallGeo, new THREE.LineBasicMaterial({ color: 0x00aaff }));
    g.add(hWall);

    // Alien architecture: cones
    var alienMat = new THREE.MeshLambertMaterial({ color: 0x220044, emissive: 0x110022 });
    for (var ai = 0; ai < 6; ai++) {
      var aCone = new THREE.Mesh(new THREE.ConeGeometry(1, 4, 6), alienMat);
      aCone.position.set(-20 + ai * 8, 2, -20);
      g.add(aCone);
    }

    // Flying drones (small boxes near ceiling)
    var droneMat = new THREE.MeshLambertMaterial({ color: 0x336699 });
    for (var di = 0; di < 5; di++) {
      var drone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), droneMat);
      drone.position.set(-10 + di * 5, 6, -15);
      drone.userData.droneOffset = di * 1.2;
      g.add(drone);
    }

    // Portal
    var portalGeo = new THREE.SphereGeometry(1.2, 16, 16);
    var portalMat = new THREE.MeshLambertMaterial({ color: 0xff44ff, emissive: 0x440044 });
    var portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(-15, 1.5, 20);
    g.add(portal);
    _portals[2] = portal;
    var pLight2 = new THREE.PointLight(0xff44ff, 2, 10);
    pLight2.position.copy(portal.position);
    g.add(pLight2);
    _portalLights[2] = pLight2;

    // Anchor
    var ancGeo = new THREE.SphereGeometry(0.5, 12, 12);
    var ancMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x004444 });
    var anchor = new THREE.Mesh(ancGeo, ancMat);
    anchor.position.set(20, 1.0, 20);
    anchor.userData.secured = false;
    g.add(anchor);
    _anchors[2] = anchor;
    var aLight2 = new THREE.PointLight(0x00ffff, 1.5, 8);
    aLight2.position.copy(anchor.position);
    g.add(aLight2);
    _anchorLights[2] = aLight2;

    // Enemies
    _enemies[2] = [];
    var futMat  = new THREE.MeshLambertMaterial({ color: 0x0033aa });
    var agMat2  = new THREE.MeshLambertMaterial({ color: 0x553399 });
    for (var fi = 0; fi < 8; fi++) {
      var fObj = _makeHumanoid(futMat, 110, 0);
      fObj.mesh.position.set(-10 + (fi % 4) * 6, 1.0, -10 + Math.floor(fi / 4) * 10);
      g.add(fObj.mesh);
      _enemies[2].push(fObj);
    }
    var agent2 = _makeHumanoid(agMat2, 500, 1);
    agent2.mesh.position.set(-5, 1.0, -20);
    g.add(agent2.mesh);
    _enemies[2].push(agent2);

    return g;
  }

  // ── Helper: build a humanoid enemy ────────────────────────────────────────
  function _makeHumanoid(mat, hp, isAgent) {
    var group = new THREE.Group();
    // Body
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.4), mat);
    body.position.y = 0.45;
    group.add(body);
    // Head
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mat);
    head.position.y = 1.1;
    group.add(head);
    // Legs
    var legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.3), mat);
    legL.position.set(-0.15, -0.35, 0);
    group.add(legL);
    var legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.3), mat);
    legR.position.set(0.15, -0.35, 0);
    group.add(legR);
    // Agent glow
    if (isAgent) {
      var glow = new THREE.PointLight(0x9900ff, 1, 4);
      glow.position.y = 1.0;
      group.add(glow);
    }
    return {
      mesh: group,
      hp: hp,
      maxHp: hp,
      isAgent: isAgent,
      alive: true,
      moveTimer: Math.random() * 3,
      moveDir: new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize(),
      attackTimer: 1 + Math.random() * 2
    };
  }

  // ── Build HUD ─────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'tp-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'padding:10px 16px', 'background:rgba(0,0,0,0.7)',
      'color:#0ff', 'font:bold 13px monospace',
      'z-index:9999', 'pointer-events:none',
      'display:flex', 'gap:16px', 'flex-wrap:wrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'tp-overlay';
    _overlayEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.85)', 'color:#0ff',
      'font:bold 20px monospace', 'display:flex',
      'align-items:center', 'justify-content:center',
      'z-index:10000', 'text-align:center', 'pointer-events:none'
    ].join(';');
    _overlayEl.innerHTML = '<div>TIME PARADOX<br><span style="font-size:14px;color:#aaa">Press T then P to activate<br>Click to lock mouse | WASD + Mouse | E=Secure Anchor<br>Walk into portals to jump time periods</span></div>';
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var agentCount = (_agentKilled[0] ? 1 : 0) + (_agentKilled[1] ? 1 : 0) + (_agentKilled[2] ? 1 : 0);
    var anchorCount = (_anchorsSecured[0] ? 1 : 0) + (_anchorsSecured[1] ? 1 : 0) + (_anchorsSecured[2] ? 1 : 0);
    var liveEnemies = 0;
    for (var ei = 0; ei < _enemies[_currentPeriod].length; ei++) {
      if (_enemies[_currentPeriod][ei].alive && !_enemies[_currentPeriod][ei].isAgent) liveEnemies++;
    }
    var paradoxColor = _paradoxMeter > 70 ? '#f00' : _paradoxMeter > 40 ? '#fa0' : '#0ff';
    var energyColor  = _temporalEnergy < 20 ? '#f00' : '#0ff';
    _hudEl.innerHTML =
      '<span style="color:#ff0">TIME PARADOX</span>' +
      ' | PERIOD: <b>' + _periodNames[_currentPeriod] + '</b>' +
      ' | ANCHORS: ' + anchorCount + '/3' +
      ' | AGENT: ' + agentCount + '/3 KILLED' +
      ' | <span style="color:' + paradoxColor + '">PARADOX: ' + Math.floor(_paradoxMeter) + '%</span>' +
      ' | <span style="color:' + energyColor + '">T-ENERGY: ' + Math.floor(_temporalEnergy) + '%</span>' +
      ' | ENEMIES: ' + liveEnemies +
      ' | HP: ' + _playerHP;
  }

  function _showOverlay(msg) {
    if (_overlayEl) {
      _overlayEl.innerHTML = '<div>' + msg + '</div>';
      _overlayEl.style.pointerEvents = 'auto';
    }
  }

  // ── Shooting ──────────────────────────────────────────────────────────────
  function _shoot() {
    if (_shootCooldown > 0) return;
    _shootCooldown = 0.25;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));
    _raycaster.set(new THREE.Vector3(_playerPos.x, _playerPos.y + 0.3, _playerPos.z), dir);

    var currentEnemies = _enemies[_currentPeriod];
    var bestDist = 999;
    var hitEnemy = null;

    for (var ei = 0; ei < currentEnemies.length; ei++) {
      var enemy = currentEnemies[ei];
      if (!enemy.alive) continue;
      var intersects = _raycaster.intersectObject(enemy.mesh, true);
      if (intersects.length > 0 && intersects[0].distance < bestDist) {
        bestDist = intersects[0].distance;
        hitEnemy = enemy;
      }
    }

    if (hitEnemy) {
      var dmg = hitEnemy.isAgent ? 25 : 20;
      hitEnemy.hp -= dmg;
      if (hitEnemy.hp <= 0) {
        hitEnemy.alive = false;
        hitEnemy.mesh.visible = false;
        if (hitEnemy.isAgent) {
          _agentKilled[_currentPeriod] = true;
        } else {
          // Count alive non-agent enemies
          var aliveCount = 0;
          for (var ci = 0; ci < currentEnemies.length; ci++) {
            if (currentEnemies[ci].alive && !currentEnemies[ci].isAgent) aliveCount++;
          }
          // Paradox penalty for killing too many
          _paradoxMeter += 6;
          if (aliveCount === 0) _paradoxMeter += 30; // killing ALL creates paradox spike
        }
        if (_paradoxMeter > 100) _paradoxMeter = 100;
      }
    }
  }

  // ── Anchor securing ───────────────────────────────────────────────────────
  function _trySecureAnchor() {
    var anchor = _anchors[_currentPeriod];
    if (!anchor || _anchorsSecured[_currentPeriod]) return;
    var dx = _playerPos.x - anchor.position.x;
    var dz = _playerPos.z - anchor.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 3) {
      _anchorsSecured[_currentPeriod] = true;
      anchor.visible = false;
      if (_anchorLights[_currentPeriod]) _anchorLights[_currentPeriod].visible = false;
    }
  }

  // ── Portal travel ─────────────────────────────────────────────────────────
  function _checkPortal(dt) {
    if (_portalCooldown > 0) { _portalCooldown -= dt; return; }
    var portal = _portals[_currentPeriod];
    if (!portal) return;
    var dx = _playerPos.x - portal.position.x;
    var dz = _playerPos.z - portal.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.0) {
      if (_temporalEnergy < 20) return; // not enough energy
      _temporalEnergy -= 20;
      _currentPeriod = (_currentPeriod + 1) % 3;
      _switchPeriod();
      _portalCooldown = 2.0;
    }
  }

  function _switchPeriod() {
    for (var pi = 0; pi < 3; pi++) {
      _periodScenes[pi].visible = (pi === _currentPeriod);
    }
    // Place player near portal exit in new period
    var newPortal = _portals[_currentPeriod];
    if (newPortal) {
      _playerPos.x = newPortal.position.x + 3;
      _playerPos.z = newPortal.position.z + 3;
    }
  }

  // ── Win / Lose check ──────────────────────────────────────────────────────
  function _checkEndConditions() {
    if (_gameOver || _gameWon) return;
    if (_paradoxMeter >= 100 || _playerHP <= 0) {
      _gameOver = true;
      _showOverlay('TEMPORAL PARADOX CRITICAL<br><span style="font-size:14px;color:#f44">The timeline has collapsed.<br>GAME OVER<br><span style="color:#aaa;font-size:12px">Refresh to restart</span></span>');
      return;
    }
    var allAnchors = _anchorsSecured[0] && _anchorsSecured[1] && _anchorsSecured[2];
    var allAgents  = _agentKilled[0]    && _agentKilled[1]    && _agentKilled[2];
    if (allAnchors && allAgents) {
      _gameWon = true;
      _showOverlay('TIMELINE STABILIZED<br><span style="font-size:14px;color:#0f0">All temporal anchors secured.<br>Temporal Paradox Agent eliminated across all eras.<br>YOU WIN<br><span style="color:#aaa;font-size:12px">Refresh to restart</span></span>');
    }
  }

  // ── Enemy AI update ───────────────────────────────────────────────────────
  function _updateEnemies(dt) {
    var currentEnemies = _enemies[_currentPeriod];
    for (var ei = 0; ei < currentEnemies.length; ei++) {
      var enemy = currentEnemies[ei];
      if (!enemy.alive) continue;

      // Move toward player occasionally
      enemy.moveTimer -= dt;
      if (enemy.moveTimer <= 0) {
        var dx = _playerPos.x - enemy.mesh.position.x;
        var dz = _playerPos.z - enemy.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
          enemy.moveDir.set(dx / len, 0, dz / len);
        }
        enemy.moveTimer = 1.5 + Math.random() * 2;
      }

      var speed = enemy.isAgent ? 4 : 2.5;
      var ddx = _playerPos.x - enemy.mesh.position.x;
      var ddz = _playerPos.z - enemy.mesh.position.z;
      var dist = Math.sqrt(ddx * ddx + ddz * ddz);

      if (dist > 2) {
        enemy.mesh.position.x += enemy.moveDir.x * speed * dt;
        enemy.mesh.position.z += enemy.moveDir.z * speed * dt;
        // Face player
        enemy.mesh.rotation.y = Math.atan2(ddx, ddz);
      }

      // Attack player
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0 && dist < 8) {
        var dmg = enemy.isAgent ? 15 : 8;
        _playerHP -= dmg;
        if (_playerHP < 0) _playerHP = 0;
        enemy.attackTimer = 1.5 + Math.random() * 1.5;
      }
    }
  }

  // ── Update explosion flashes (WWI) ────────────────────────────────────────
  function _updateExplosions(dt) {
    for (var ei = 0; ei < _explosionLights.length; ei++) {
      var eObj = _explosionLights[ei];
      if (eObj.period !== _currentPeriod) continue;
      eObj.timer -= dt;
      if (eObj.timer <= 0) {
        eObj.light.intensity = 3 + Math.random() * 4;
        eObj.timer = 0.5 + Math.random() * 2.5;
        var t2 = setTimeout(function (l) { l.intensity = 0; }, 120, eObj.light);
      }
    }
  }

  // ── Main update ───────────────────────────────────────────────────────────
  function update(dt) {
    if (!_active || _gameOver || _gameWon) return;
    if (!dt) dt = 0.016;

    // Cooldowns
    if (_shootCooldown > 0) _shootCooldown -= dt;

    // Temporal energy recharge
    _temporalEnergy = Math.min(100, _temporalEnergy + 10 * dt);

    // Player movement
    var speed = 8;
    var sinY = Math.sin(_yaw);
    var cosY = Math.cos(_yaw);
    if (_moveForward) { _playerPos.x -= sinY * speed * dt; _playerPos.z -= cosY * speed * dt; }
    if (_moveBack)    { _playerPos.x += sinY * speed * dt; _playerPos.z += cosY * speed * dt; }
    if (_moveLeft)    { _playerPos.x -= cosY * speed * dt; _playerPos.z += sinY * speed * dt; }
    if (_moveRight)   { _playerPos.x += cosY * speed * dt; _playerPos.z -= sinY * speed * dt; }

    // Gravity
    _velY -= 20 * dt;
    _playerPos.y += _velY * dt;
    if (_playerPos.y <= 1.7) { _playerPos.y = 1.7; _velY = 0; _canJump = true; }

    // Clamp to map bounds
    _playerPos.x = Math.max(-35, Math.min(35, _playerPos.x));
    _playerPos.z = Math.max(-35, Math.min(35, _playerPos.z));

    // Camera
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    // Portal check
    _checkPortal(dt);

    // Enemies
    _updateEnemies(dt);

    // Explosions
    if (_currentPeriod === 0) _updateExplosions(dt);

    // Anchor pulse
    for (var ai = 0; ai < 3; ai++) {
      if (_anchors[ai] && !_anchorsSecured[ai]) {
        _anchors[ai].rotation.y += dt * 1.5;
      }
    }

    // Portal pulse
    for (var pi = 0; pi < 3; pi++) {
      if (_portals[pi]) {
        _portals[pi].rotation.y += dt * 2;
      }
    }

    // End check
    _checkEndConditions();

    // HUD
    _updateHUD();
  }

  // ── Render loop ───────────────────────────────────────────────────────────
  function _loop() {
    _animId = requestAnimationFrame(_loop);
    var dt = _clock.getDelta();
    update(dt);
    _renderer.render(_scene, _camera);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (_active) return;
    _active = true;

    // Reset state
    _playerHP = 100;
    _playerPos = { x: 0, y: 1.7, z: 5 };
    _yaw = 0; _pitch = 0;
    _temporalEnergy = 100;
    _paradoxMeter = 0;
    _currentPeriod = 0;
    _gameOver = false;
    _gameWon = false;
    _anchorsSecured = [false, false, false];
    _agentKilled = [false, false, false];
    _enemies = [[], [], []];
    _portals = [null, null, null];
    _anchors = [null, null, null];
    _anchorLights = [null, null, null];
    _portalLights = [null, null, null];
    _explosionLights = [];
    _shootCooldown = 0;
    _portalCooldown = 0;
    _canJump = true;
    _velY = 0;
    _moveForward = false; _moveBack = false; _moveLeft = false; _moveRight = false;

    // Cancel existing loop
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }

    // Remove old renderer
    var oldCanvas = document.getElementById('tp-canvas');
    if (oldCanvas) oldCanvas.remove();
    var oldHud = document.getElementById('tp-hud');
    if (oldHud) oldHud.remove();
    var oldOv = document.getElementById('tp-overlay');
    if (oldOv) oldOv.remove();

    // Renderer
    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(window.devicePixelRatio || 1);
    _renderer.domElement.id = 'tp-canvas';
    _renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9998;';
    document.body.appendChild(_renderer.domElement);

    // Camera
    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    // Clock
    _clock = new THREE.Clock();

    // Raycaster
    _raycaster = new THREE.Raycaster();

    // Scene
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x000000);

    // Build period scenes
    _periodScenes[0] = _buildWWI();
    _periodScenes[1] = _buildColdWar();
    _periodScenes[2] = _buildFuture();

    _scene.add(_periodScenes[0]);
    _scene.add(_periodScenes[1]);
    _scene.add(_periodScenes[2]);

    // Show only current period
    _periodScenes[0].visible = true;
    _periodScenes[1].visible = false;
    _periodScenes[2].visible = false;

    // Set fog per-period in update (use scene fog)
    _scene.fog = new THREE.Fog(0x5a3a10, 20, 60);

    // HUD
    _buildHUD();
    if (_overlayEl) {
      _overlayEl.innerHTML = '<div>TIME PARADOX<br><span style="font-size:14px;color:#aaa">Click to lock mouse | WASD + Mouse | E=Secure Anchor<br>Walk into portals to jump time periods<br><br>Click anywhere to begin</span></div>';
      _overlayEl.style.pointerEvents = 'auto';
    }

    // Resize handler
    window.addEventListener('resize', function () {
      if (!_active) return;
      _camera.aspect = window.innerWidth / window.innerHeight;
      _camera.updateProjectionMatrix();
      _renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Pointer lock: hide overlay when locked
    document.addEventListener('pointerlockchange', function () {
      if (document.pointerLockElement === _renderer.domElement) {
        if (_overlayEl && !_gameOver && !_gameWon) _overlayEl.style.display = 'none';
      } else {
        if (_overlayEl && !_gameOver && !_gameWon) {
          _overlayEl.style.display = 'flex';
          _overlayEl.style.pointerEvents = 'auto';
          _overlayEl.innerHTML = '<div>PAUSED<br><span style="font-size:14px;color:#aaa">Click to resume</span></div>';
        }
      }
    });

    // Start loop
    _loop();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    _active = false;
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    var c = document.getElementById('tp-canvas');
    if (c) c.remove();
    var h = document.getElementById('tp-hud');
    if (h) h.remove();
    var o = document.getElementById('tp-overlay');
    if (o) o.remove();
    _hudEl = null;
    _overlayEl = null;
    _gameOver = false;
    _gameWon = false;
  }

  // ── Global event listeners (always active for activation) ─────────────────
  window.addEventListener('keydown', _onKeyDown);
  window.addEventListener('keyup', _onKeyUp);
  window.addEventListener('mousemove', _onMouseMove);
  window.addEventListener('click', _onClick);

  return { init: init, update: update, reset: reset };

})();
