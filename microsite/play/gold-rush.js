/* ───────────────────────────────────────────────────────────────────────────
   gold-rush.js — Gold Rush Mini-Game
   API: window.GoldRush = { init, update, reset }
   Controls:
     G + R (simultaneous, 400ms window) → activate module
     W / A / S / D                      → move player
     Mouse                              → look / aim
     E (hold 3s near vein)              → mine gold vein
     E (near cart with gold)            → load gold into minecart
     E (near cart, pushing)             → interact with cart
     W (near loaded cart)               → push cart to exit
     E (near pump, hold 10s)            → drain flood water
     F                                  → throw dynamite
     Mouse click                        → shoot outlaws / sheriff
   ─────────────────────────────────────────────────────────────────────────── */
window.GoldRush = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active         = false;
  var _keyPressTime   = { G: 0, R: 0 };
  var ACTIVATE_WINDOW = 0.4;

  /* ── Timing ─────────────────────────────────────────────────────────────── */
  var _lastTime = 0;
  var _clock    = 0;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys      = {};
  var _mouseX    = 0;
  var _mouseY    = 0;
  var _yaw       = 0;
  var _pitch     = 0;
  var _mouseDown = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerGroup = null;
  var _playerPos   = { x: 0, y: 0, z: 0 };
  var _playerVel   = { x: 0, y: 0, z: 0 };
  var _playerHP    = 100;
  var _goldOz      = 0;

  /* ── Gold veins ────────────────────────────────────────────────────────── */
  var _veins         = [];   // { mesh, mined, collapsed, mineTimer, ceilingMesh }
  var _veinsMined    = 0;
  var VEIN_TOTAL     = 8;

  /* ── Dynamite ──────────────────────────────────────────────────────────── */
  var _dynamiteSticks = 4;
  var _dynamites      = [];  // { mesh, timer, blown, worldPos }

  /* ── Outlaws / Sheriff ─────────────────────────────────────────────────── */
  var _outlaws    = [];  // { group, hp, alive, patrolDir, patrolTimer, speed }
  var _sheriff    = null; // { group, hp, alive }
  var SHERIFF_HP  = 300;
  var OUTLAW_TOTAL = 10;

  /* ── Claim jumpers ─────────────────────────────────────────────────────── */
  var _claimJumpers       = [];  // { group, hp, alive, speed, stakeTimer }
  var _claimJumperTimer   = 120.0; // first wave at 2 min
  var _claimJumperWaveNum = 0;
  var _claimStakePlanted  = false;
  var _claimPenalty       = 0;

  /* ── Minecart ──────────────────────────────────────────────────────────── */
  var _cart        = null;  // { group, loaded, delivered, posX, posZ }
  var _cartStatus  = 'EMPTY'; // EMPTY, LOADED, DELIVERED
  var _cartPushTimer = 0;

  /* ── Flooding ──────────────────────────────────────────────────────────── */
  var _floodActive    = false;
  var _waterMesh      = null;
  var _waterY         = -4.0;
  var _waterRiseSpeed = 0.3;
  var _drownTimer     = 0;
  var _pumpMesh       = null;
  var _pumpHoldTimer  = 0;
  var _draining       = false;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Mine interaction timers ──────────────────────────────────────────── */
  var _eKeyWasDown   = false;
  var _fKeyWasDown   = false;
  var _mineHoldTimer = 0;
  var _miningVeinIdx = -1;

  /* ── Scene objects ─────────────────────────────────────────────────────── */
  var _mineGroup   = null;
  var _tracksGroup = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMat(color, emissive) {
    return new THREE.MeshLambertMaterial({
      color:    color,
      emissive: emissive !== undefined ? emissive : 0x000000
    });
  }

  function rnd(min, max) { return min + Math.random() * (max - min); }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function worldPos(mesh) {
    var v = new THREE.Vector3();
    mesh.getWorldPosition(v);
    return v;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE CONSTRUCTION
  ════════════════════════════════════════════════════════════════════════ */

  function buildScene() {
    /* lighting */
    var ambient = new THREE.AmbientLight(0x443322, 0.6);
    _scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFCC88, 1.0);
    sun.position.set(40, 60, 30);
    _scene.add(sun);

    var torchLight = new THREE.PointLight(0xFF8833, 1.2, 30);
    torchLight.position.set(0, 3, 0);
    _scene.add(torchLight);

    buildGround();
    buildCanyonWalls();
    buildMineEntrance();
    buildMineshafts();
    buildWaterTrough();
    buildSaloon();
    buildDynamiteCrate();
    buildWaterPump();
    buildMinecartAndTracks();
    buildGoldVeins();
    buildOutlaws();
    buildSheriff();
    buildPlayer();
  }

  function buildGround() {
    /* canyon floor */
    var floorGeo = new THREE.BoxGeometry(60, 0.5, 80);
    var floor    = new THREE.Mesh(floorGeo, makeMat(0x886644));
    floor.position.set(0, -0.25, 0);
    _scene.add(floor);
  }

  function buildCanyonWalls() {
    /* left wall */
    var wallMatL = makeMat(0x886644);
    var wGeoL    = new THREE.BoxGeometry(6, 18, 80);
    var wallL    = new THREE.Mesh(wGeoL, wallMatL);
    wallL.position.set(-27, 9, 0);
    _scene.add(wallL);

    /* right wall */
    var wGeoR = new THREE.BoxGeometry(6, 18, 80);
    var wallR = new THREE.Mesh(wGeoR, makeMat(0x886644));
    wallR.position.set(27, 9, 0);
    _scene.add(wallR);

    /* back wall */
    var wGeoB = new THREE.BoxGeometry(54, 18, 6);
    var wallB = new THREE.Mesh(wGeoB, makeMat(0x886644));
    wallB.position.set(0, 9, -37);
    _scene.add(wallB);

    /* front canyon rim */
    var wGeoF = new THREE.BoxGeometry(54, 8, 6);
    var wallF = new THREE.Mesh(wGeoF, makeMat(0x886644));
    wallF.position.set(0, 4, 37);
    _scene.add(wallF);
  }

  function buildMineEntrance() {
    /* mine entrance 6x5x3 */
    var geo = new THREE.BoxGeometry(6, 5, 3);
    var m   = new THREE.Mesh(geo, makeMat(0x665533));
    m.position.set(0, 2.5, -34);
    _scene.add(m);

    /* entrance opening (dark recess) */
    var openGeo = new THREE.BoxGeometry(3, 3.5, 1);
    var openM   = new THREE.Mesh(openGeo, makeMat(0x111111));
    openM.position.set(0, 1.75, -32.5);
    _scene.add(openM);

    /* timber framing — top beam */
    var beamGeo = new THREE.BoxGeometry(3.6, 0.4, 0.4);
    var beamM   = new THREE.Mesh(beamGeo, makeMat(0x553311));
    beamM.position.set(0, 3.7, -32.5);
    _scene.add(beamM);

    /* timber framing — side posts */
    var postGeo = new THREE.BoxGeometry(0.4, 3.7, 0.4);
    var postL   = new THREE.Mesh(postGeo, makeMat(0x553311));
    postL.position.set(-1.6, 1.85, -32.5);
    _scene.add(postL);

    var postR = new THREE.Mesh(postGeo, makeMat(0x553311));
    postR.position.set(1.6, 1.85, -32.5);
    _scene.add(postR);
  }

  function buildMineshafts() {
    _mineGroup = new THREE.Group();
    _scene.add(_mineGroup);

    /* 3 tunnels BoxGeometry 3x3x20 */
    var tunnelPositions = [
      { x: -5, z: -20 },
      { x:  0, z: -25 },
      { x:  5, z: -20 }
    ];

    for (var ti = 0; ti < 3; ti++) {
      var geo = new THREE.BoxGeometry(3, 3, 20);
      var m   = new THREE.Mesh(geo, makeMat(0x443322));
      m.position.set(tunnelPositions[ti].x, 1.5, tunnelPositions[ti].z);
      _mineGroup.add(m);

      /* floor of each shaft */
      var floorGeo = new THREE.BoxGeometry(3, 0.2, 20);
      var floorM   = new THREE.Mesh(floorGeo, makeMat(0x332211));
      floorM.position.set(tunnelPositions[ti].x, 0.1, tunnelPositions[ti].z);
      _mineGroup.add(floorM);
    }
  }

  function buildWaterTrough() {
    /* water trough PlaneGeometry 0x224466 */
    var geo = new THREE.PlaneGeometry(4, 2);
    var m   = new THREE.Mesh(geo, makeMat(0x224466));
    m.rotation.x = -Math.PI / 2;
    m.position.set(15, 0.05, 10);
    _scene.add(m);

    /* trough sides */
    var sideGeo = new THREE.BoxGeometry(4.2, 0.6, 0.2);
    var sideMat = makeMat(0x553311);

    var s1 = new THREE.Mesh(sideGeo, sideMat);
    s1.position.set(15, 0.3, 9);
    _scene.add(s1);

    var s2 = new THREE.Mesh(sideGeo, sideMat);
    s2.position.set(15, 0.3, 11);
    _scene.add(s2);

    var sideGeo2 = new THREE.BoxGeometry(0.2, 0.6, 2.2);
    var s3 = new THREE.Mesh(sideGeo2, sideMat);
    s3.position.set(13, 0.3, 10);
    _scene.add(s3);

    var s4 = new THREE.Mesh(sideGeo2, sideMat);
    s4.position.set(17, 0.3, 10);
    _scene.add(s4);
  }

  function buildSaloon() {
    /* saloon BoxGeometry 12x5x8 0x885533 */
    var geo = new THREE.BoxGeometry(12, 5, 8);
    var m   = new THREE.Mesh(geo, makeMat(0x885533));
    m.position.set(18, 2.5, -10);
    _scene.add(m);

    /* saloon roof overhang */
    var roofGeo = new THREE.BoxGeometry(13.5, 0.4, 9.5);
    var roofM   = new THREE.Mesh(roofGeo, makeMat(0x664422));
    roofM.position.set(18, 5.2, -10);
    _scene.add(roofM);

    /* saloon sign post */
    var signGeo = new THREE.BoxGeometry(5, 0.5, 0.2);
    var signM   = new THREE.Mesh(signGeo, makeMat(0xCC9933));
    signM.position.set(18, 6.2, -6);
    _scene.add(signM);

    /* saloon door opening */
    var doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.3);
    var doorM   = new THREE.Mesh(doorGeo, makeMat(0x221100));
    doorM.position.set(18, 1.25, -6.1);
    _scene.add(doorM);

    /* windows */
    var winGeo = new THREE.BoxGeometry(1.8, 1.2, 0.15);
    var winMat = makeMat(0x88AACC);

    var w1 = new THREE.Mesh(winGeo, winMat);
    w1.position.set(14.5, 2.5, -6.1);
    _scene.add(w1);

    var w2 = new THREE.Mesh(winGeo, winMat);
    w2.position.set(21.5, 2.5, -6.1);
    _scene.add(w2);
  }

  function buildDynamiteCrate() {
    /* dynamite crate BoxGeometry 0xFF4400 marked */
    var geo = new THREE.BoxGeometry(1.2, 1.0, 1.0);
    var m   = new THREE.Mesh(geo, makeMat(0xFF4400));
    m.position.set(8, 0.5, 5);
    _scene.add(m);
    m.userData.isDynamiteCrate = true;

    /* X marking on crate */
    var pts = [
      new THREE.Vector3(-0.45, 0, -0.35),
      new THREE.Vector3( 0.45, 0,  0.35),
      new THREE.Vector3( 0.45, 0, -0.35),
      new THREE.Vector3(-0.45, 0,  0.35)
    ];
    var geo2 = new THREE.BufferGeometry().setFromPoints(pts);
    var line = new THREE.LineSegments(geo2, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));
    line.position.set(8, 1.01, 5);
    _scene.add(line);

    /* label */
    var labelGeo = new THREE.BoxGeometry(0.8, 0.3, 0.05);
    var labelM   = new THREE.Mesh(labelGeo, makeMat(0xFFFF00));
    labelM.position.set(8, 0.6, 5.51);
    _scene.add(labelM);
  }

  function buildWaterPump() {
    /* water pump BoxGeometry 0x334455 */
    var geo = new THREE.BoxGeometry(1.5, 3, 1.5);
    var m   = new THREE.Mesh(geo, makeMat(0x334455));
    m.position.set(-8, 1.5, -15);
    _scene.add(m);
    _pumpMesh = m;

    /* pump handle */
    var handleGeo = new THREE.BoxGeometry(0.3, 0.3, 2.0);
    var handleM   = new THREE.Mesh(handleGeo, makeMat(0x556677));
    handleM.position.set(-8, 3.3, -15);
    _scene.add(handleM);

    /* pump pipe down */
    var pipeGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    var pipeM   = new THREE.Mesh(pipeGeo, makeMat(0x223344));
    pipeM.position.set(-8, 0.0, -15);
    _scene.add(pipeM);
  }

  function buildMinecartAndTracks() {
    /* tracks — LineSegments */
    _tracksGroup = new THREE.Group();
    _scene.add(_tracksGroup);

    var railMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var tieCount = 12;

    /* left rail */
    var leftPts = [];
    var rightPts = [];
    for (var i = 0; i <= tieCount; i++) {
      var zr = -30 + i * 3;
      leftPts.push(new THREE.Vector3(-0.6, 0.08, zr));
      rightPts.push(new THREE.Vector3(0.6, 0.08, zr));
    }
    var leftGeo  = new THREE.BufferGeometry().setFromPoints(leftPts);
    var rightGeo = new THREE.BufferGeometry().setFromPoints(rightPts);
    _tracksGroup.add(new THREE.Line(leftGeo, railMat));
    _tracksGroup.add(new THREE.Line(rightGeo, railMat));

    /* ties */
    var tieMat = makeMat(0x5C3A1A);
    for (var ti = 0; ti < tieCount; ti++) {
      var tGeo = new THREE.BoxGeometry(1.6, 0.12, 0.4);
      var tM   = new THREE.Mesh(tGeo, tieMat);
      tM.position.set(0, 0.04, -30 + ti * 3 + 1.5);
      _tracksGroup.add(tM);
    }

    /* minecart BoxGeometry 0x885533 */
    var cartGeo = new THREE.BoxGeometry(1.8, 1.2, 2.5);
    var cartM   = new THREE.Mesh(cartGeo, makeMat(0x885533));

    var cartGroup = new THREE.Group();
    cartM.position.set(0, 0.7, 0);
    cartGroup.add(cartM);

    /* cart wheels */
    var wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    var wheelMat = makeMat(0x333333);
    var cartWheelOffsets = [
      { x: -0.8, z: -0.8 }, { x: 0.8, z: -0.8 },
      { x: -0.8, z:  0.8 }, { x: 0.8, z:  0.8 }
    ];
    for (var wi = 0; wi < cartWheelOffsets.length; wi++) {
      var wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(cartWheelOffsets[wi].x, 0.3, cartWheelOffsets[wi].z);
      cartGroup.add(wm);
    }

    cartGroup.position.set(0, 0.05, -25);
    _scene.add(cartGroup);

    _cart = {
      group:     cartGroup,
      loaded:    false,
      delivered: false,
      posX:      0,
      posZ:      -25
    };
  }

  function buildGoldVeins() {
    /* 8 gold chunks embedded in tunnel walls */
    var veinPositions = [
      { x: -6.3, y: 1.2, z: -16 },
      { x: -3.7, y: 1.8, z: -22 },
      { x:  1.3, y: 1.0, z: -18 },
      { x: -1.3, y: 2.0, z: -28 },
      { x:  6.3, y: 1.5, z: -16 },
      { x:  3.7, y: 1.2, z: -22 },
      { x: -5.8, y: 0.8, z: -26 },
      { x:  5.8, y: 1.6, z: -26 }
    ];

    for (var vi = 0; vi < VEIN_TOTAL; vi++) {
      var geo = new THREE.BoxGeometry(0.7, 0.5, 0.4);
      var m   = new THREE.Mesh(geo, makeMat(0xFFCC00, 0xAA8800));
      m.position.set(veinPositions[vi].x, veinPositions[vi].y, veinPositions[vi].z);
      _scene.add(m);

      /* ceiling chunk for collapse */
      var cGeo = new THREE.BoxGeometry(2.5, 0.6, 2.5);
      var cM   = new THREE.Mesh(cGeo, makeMat(0x443322));
      cM.position.set(veinPositions[vi].x, 3.3, veinPositions[vi].z);
      cM.visible = false;
      _scene.add(cM);

      _veins.push({
        mesh:        m,
        mined:       false,
        collapsed:   false,
        mineTimer:   0,
        ceilingMesh: cM,
        willCollapse: Math.random() < 0.4
      });
    }
  }

  function buildOutlaws() {
    /* 10 outlaws BoxGeometry 0x664422 dusters with revolvers */
    var positions = [
      { x: -15, z: 0 }, { x: -12, z: 8 }, { x: -18, z: -5 },
      { x: 10,  z: 5 }, { x: 14,  z: -8 }, { x: -10, z: -20 },
      { x: 12,  z: -15 }, { x: -5, z: 20 }, { x: 5, z: 22 },
      { x: 20,  z: 0 }
    ];

    for (var oi = 0; oi < OUTLAW_TOTAL; oi++) {
      var g = buildOutlawMesh(0x664422);
      g.position.set(positions[oi].x, 0, positions[oi].z);
      _scene.add(g);
      _outlaws.push({
        group:       g,
        hp:          80,
        alive:       true,
        patrolDir:   (Math.random() > 0.5 ? 1 : -1),
        patrolTimer: rnd(0, 3),
        speed:       2.5,
        shootTimer:  rnd(1, 4),
        isClaimJumper: false
      });
    }
  }

  function buildOutlawMesh(dustColor) {
    var g = new THREE.Group();

    /* duster body */
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.3, 0.5);
    var body    = new THREE.Mesh(bodyGeo, makeMat(dustColor));
    body.position.set(0, 0.75, 0);
    g.add(body);

    /* head */
    var headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    var head    = new THREE.Mesh(headGeo, makeMat(0x8B7355));
    head.position.set(0, 1.65, 0);
    g.add(head);

    /* hat */
    var hatGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.38, 8);
    var hat    = new THREE.Mesh(hatGeo, makeMat(0x221100));
    hat.position.set(0, 1.96, 0);
    g.add(hat);

    /* revolver CylinderGeometry 0x888844 */
    var revGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6);
    var revM   = new THREE.Mesh(revGeo, makeMat(0x888844));
    revM.rotation.z = Math.PI / 2;
    revM.position.set(0.5, 0.85, 0.15);
    g.add(revM);

    return g;
  }

  function buildSheriff() {
    /* sheriff BoxGeometry 0x334455 badge, 300HP, corrupt, in saloon */
    var g = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.8, 1.4, 0.55);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x334455));
    body.position.set(0, 0.8, 0);
    g.add(body);

    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var head    = new THREE.Mesh(headGeo, makeMat(0x8B7355));
    head.position.set(0, 1.75, 0);
    g.add(head);

    var hatGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.42, 8);
    var hat    = new THREE.Mesh(hatGeo, makeMat(0x112233));
    hat.position.set(0, 2.1, 0);
    g.add(hat);

    /* badge 0x334455 */
    var badgeGeo = new THREE.BoxGeometry(0.22, 0.22, 0.1);
    var badgeM   = new THREE.Mesh(badgeGeo, makeMat(0xFFDD00, 0x886600));
    badgeM.position.set(0.42, 1.1, 0);
    g.add(badgeM);

    /* revolver */
    var revGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 6);
    var revM   = new THREE.Mesh(revGeo, makeMat(0x888844));
    revM.rotation.z = Math.PI / 2;
    revM.position.set(0.55, 0.9, 0.15);
    g.add(revM);

    /* place in saloon */
    g.position.set(18, 0, -10);
    _scene.add(g);

    _sheriff = { group: g, hp: SHERIFF_HP, alive: true };
  }

  function buildPlayer() {
    _playerGroup = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.45);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x774422));
    body.position.set(0, 0.5, 0);
    _playerGroup.add(body);

    var headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    var head    = new THREE.Mesh(headGeo, makeMat(0x8B7355));
    head.position.set(0, 1.21, 0);
    _playerGroup.add(head);

    var hatGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.36, 8);
    var hat    = new THREE.Mesh(hatGeo, makeMat(0x442211));
    hat.position.set(0, 1.52, 0);
    _playerGroup.add(hat);

    _scene.add(_playerGroup);

    _playerPos.x = 0;
    _playerPos.y = 0;
    _playerPos.z = 28;

    _playerGroup.position.set(_playerPos.x, _playerPos.y, _playerPos.z);

    _camera.position.set(0, 5, 35);
    _camera.lookAt(0, 1, 0);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'gr-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#FFCC00',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 18px',
      'border:1px solid #FFCC0044',
      'letter-spacing:1px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function updateHUD() {
    if (!_hud || !_active) return;
    var outlawsAlive = 0;
    for (var oi = 0; oi < _outlaws.length; oi++) {
      if (_outlaws[oi].alive) outlawsAlive++;
    }
    var waterLevel = _waterY.toFixed(1);
    _hud.textContent =
      'GOLD RUSH' +
      ' [GOLD: ' + _goldOz + ' oz]' +
      ' [VEINS MINED: ' + _veinsMined + '/' + VEIN_TOTAL + ']' +
      ' [OUTLAWS: ' + outlawsAlive + ']' +
      ' [WATER LEVEL: ' + waterLevel + 'm]' +
      ' | CART: ' + _cartStatus;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    if (!_keys[k]) {
      _keys[k] = true;
      _keyPressTime[k] = _clock;
      checkActivation(k);
    }
    if (k === ' ') e.preventDefault();
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    _mouseX += e.movementX * 0.002;
    _mouseY += e.movementY * 0.002;
    _mouseY = Math.max(-0.6, Math.min(0.6, _mouseY));
  }

  function onMouseDown() { _mouseDown = true; }

  function checkActivation(k) {
    if (_active) return;
    if (k === 'G' || k === 'R') {
      var other = (k === 'G') ? 'R' : 'G';
      if (_keys[other] && _keyPressTime[other] > 0) {
        var diff = Math.abs(_clock - _keyPressTime[other]);
        if (diff < ACTIVATE_WINDOW) {
          activate();
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) return;
    _active = true;
    buildScene();
    buildHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    _yaw   = _mouseX;
    _pitch = _mouseY;

    var speed = 6.0;

    /* water slows movement */
    if (_waterY > _playerPos.y) {
      var depth = _waterY - _playerPos.y;
      speed = 6.0 / (1 + depth * 0.8);
    }

    var fdx = 0, fdz = 0;
    if (_keys['W']) fdz -= 1;
    if (_keys['S']) fdz += 1;
    if (_keys['A']) fdx -= 1;
    if (_keys['D']) fdx += 1;

    var sy = Math.sin(_yaw), cy = Math.cos(_yaw);
    var moveDX = fdx * cy - fdz * sy;
    var moveDZ = fdz * cy + fdx * sy;

    _playerPos.x += moveDX * speed * dt;
    _playerPos.z += moveDZ * speed * dt;

    /* gravity */
    _playerVel.y -= 18 * dt;
    _playerPos.y += _playerVel.y * dt;

    /* ground collision */
    var groundY = 0;
    if (_playerPos.y < groundY) {
      _playerPos.y  = groundY;
      _playerVel.y  = 0;
    }

    /* clamp to canyon bounds */
    _playerPos.x = Math.max(-23, Math.min(23, _playerPos.x));
    _playerPos.z = Math.max(-36, Math.min(36, _playerPos.z));

    _playerGroup.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _playerGroup.rotation.y = _yaw;

    /* camera third-person follow */
    var camBack = 5;
    _camera.position.set(
      _playerPos.x - Math.sin(_yaw) * camBack,
      _playerPos.y + 3.5,
      _playerPos.z - Math.cos(_yaw) * camBack
    );
    _camera.lookAt(_playerPos.x, _playerPos.y + 0.8, _playerPos.z);
  }

  /* ════════════════════════════════════════════════════════════════════════
     DROWNING
  ════════════════════════════════════════════════════════════════════════ */

  function updateDrowning(dt) {
    if (!_floodActive) return;
    if (_waterY > _playerPos.y + 1.8) {
      /* fully submerged */
      _drownTimer += dt;
      if (_drownTimer >= 8.0) {
        /* player drowns — respawn at surface */
        _playerPos.y = _waterY + 0.5;
        _playerVel.y = 4.0;
        _playerHP    = Math.max(10, _playerHP - 30);
        _drownTimer  = 0;
      }
    } else {
      _drownTimer = 0;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GOLD VEIN MINING (E hold 3s)
  ════════════════════════════════════════════════════════════════════════ */

  function updateMining(dt) {
    var pp = _playerPos;
    var eDown = !!_keys['E'];

    /* find nearest unmined vein within range */
    var nearIdx = -1;
    var nearDist = 3.5;
    for (var vi = 0; vi < _veins.length; vi++) {
      if (_veins[vi].mined) continue;
      var vm = _veins[vi].mesh;
      var vp = worldPos(vm);
      var d  = dist3(pp, { x: vp.x, y: vp.y, z: vp.z });
      if (d < nearDist) { nearDist = d; nearIdx = vi; }
    }

    if (eDown && nearIdx >= 0 && _miningVeinIdx === nearIdx) {
      _mineHoldTimer += dt;
      /* visual feedback — pulse brightness */
      var pulse = (Math.sin(_clock * 8) + 1) * 0.5;
      _veins[nearIdx].mesh.material.emissive.setHex(
        Math.floor(pulse * 0xAA) * 0x10000 + Math.floor(pulse * 0x88) * 0x100
      );

      if (_mineHoldTimer >= 3.0) {
        mineVein(nearIdx);
      }
    } else if (eDown && nearIdx >= 0) {
      _miningVeinIdx = nearIdx;
      _mineHoldTimer = 0;
    } else if (!eDown || nearIdx < 0) {
      _miningVeinIdx = -1;
      _mineHoldTimer = 0;
    }
  }

  function mineVein(idx) {
    var v = _veins[idx];
    v.mined = true;
    v.mesh.visible = false;
    _veinsMined++;
    _goldOz += 50;
    _miningVeinIdx = -1;
    _mineHoldTimer = 0;

    /* collapse ceiling? */
    if (v.willCollapse) {
      v.collapsed = true;
      v.ceilingMesh.visible = true;
      v.ceilingMesh.userData.fallTimer = 0;
      v.ceilingMesh.userData.falling   = true;
      /* 60 damage from ceiling fall */
      var cp = worldPos(v.ceilingMesh);
      if (dist3(_playerPos, { x: cp.x, y: cp.y, z: cp.z }) < 3.5) {
        _playerHP -= 60;
        if (_playerHP <= 0) { _playerHP = 15; }
      }
    }
  }

  function updateCeilings(dt) {
    for (var vi = 0; vi < _veins.length; vi++) {
      var v = _veins[vi];
      if (!v.collapsed || !v.ceilingMesh.userData.falling) continue;
      v.ceilingMesh.userData.fallTimer += dt;
      /* fall 1.5 units over 0.8s */
      v.ceilingMesh.position.y -= 2.0 * dt;
      if (v.ceilingMesh.position.y < 0.3) {
        v.ceilingMesh.position.y = 0.3;
        v.ceilingMesh.userData.falling = false;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DYNAMITE (F key, throw)
  ════════════════════════════════════════════════════════════════════════ */

  function updateDynamiteInput() {
    var fDown    = !!_keys['F'];
    var fPressed = fDown && !_fKeyWasDown;
    _fKeyWasDown = fDown;

    if (!fPressed) return;
    if (_dynamiteSticks <= 0) return;

    _dynamiteSticks--;

    /* throw forward */
    var throwDist = 8;
    var tx = _playerPos.x - Math.sin(_yaw) * throwDist;
    var tz = _playerPos.z - Math.cos(_yaw) * throwDist;

    var geo = new THREE.BoxGeometry(0.3, 0.6, 0.3);
    var m   = new THREE.Mesh(geo, makeMat(0xFF4400, 0x441100));
    m.position.set(tx, 0.3, tz);
    _scene.add(m);

    _dynamites.push({
      mesh:   m,
      timer:  3.0,
      blown:  false,
      worldX: tx,
      worldZ: tz
    });
  }

  function updateDynamites(dt) {
    for (var di = _dynamites.length - 1; di >= 0; di--) {
      var d = _dynamites[di];
      if (d.blown) { _dynamites.splice(di, 1); continue; }

      d.timer -= dt;

      /* blink */
      d.mesh.visible = (Math.floor(d.timer * 4) % 2 === 0) || d.timer > 0.5;

      if (d.timer <= 0) {
        explodeDynamite(d);
        _scene.remove(d.mesh);
        d.blown = true;
      }
    }
  }

  function explodeDynamite(d) {
    /* spawn flash */
    var fGeo = new THREE.BoxGeometry(2, 2, 2);
    var fMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF3300 });
    var fM   = new THREE.Mesh(fGeo, fMat);
    fM.position.set(d.worldX, 1, d.worldZ);
    _scene.add(fM);
    fM.userData.deathTimer = 0.5;
    if (!_scene.userData.flashes) _scene.userData.flashes = [];
    _scene.userData.flashes.push(fM);

    /* reveal hidden gold veins nearby (unmined veins within 6 units that were will-collapse get visibility restored) */
    for (var vi = 0; vi < _veins.length; vi++) {
      if (_veins[vi].mined) continue;
      var vp = worldPos(_veins[vi].mesh);
      var dx = vp.x - d.worldX, dz = vp.z - d.worldZ;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 6) {
        /* pulse emissive to show revealed */
        _veins[vi].mesh.material.emissive.setHex(0xFFAA00);
      }
    }

    /* damage player if nearby */
    var pd = dist3(_playerPos, { x: d.worldX, y: 0, z: d.worldZ });
    if (pd < 5) {
      _playerHP -= Math.floor((1 - pd / 5) * 40);
      if (_playerHP <= 0) _playerHP = 10;
    }

    /* damage outlaws nearby */
    for (var oi = 0; oi < _outlaws.length; oi++) {
      if (!_outlaws[oi].alive) continue;
      var op = _outlaws[oi].group.position;
      var od = dist3({ x: op.x, y: op.y, z: op.z }, { x: d.worldX, y: 0, z: d.worldZ });
      if (od < 5) {
        _outlaws[oi].hp -= Math.floor((1 - od / 5) * 80);
        if (_outlaws[oi].hp <= 0) killOutlaw(oi);
      }
    }
  }

  function updateFlashes(dt) {
    if (!_scene.userData.flashes) return;
    var arr = _scene.userData.flashes;
    for (var fi = arr.length - 1; fi >= 0; fi--) {
      arr[fi].userData.deathTimer -= dt;
      if (arr[fi].userData.deathTimer <= 0) {
        _scene.remove(arr[fi]);
        arr.splice(fi, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     OUTLAW AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateOutlaws(dt) {
    for (var oi = 0; oi < _outlaws.length; oi++) {
      var o = _outlaws[oi];
      if (!o.alive) continue;

      /* patrol in claim area */
      o.patrolTimer += dt;
      if (o.patrolTimer > 3.0) {
        o.patrolDir   = -o.patrolDir;
        o.patrolTimer = 0;
      }

      o.group.position.x += o.patrolDir * o.speed * dt;
      /* turn to face direction */
      o.group.rotation.y = o.patrolDir > 0 ? Math.PI / 2 : -Math.PI / 2;

      /* check distance to player */
      var op = o.group.position;
      var pd = dist3({ x: op.x, y: op.y, z: op.z }, _playerPos);

      if (pd < 12) {
        /* shoot at player */
        o.shootTimer -= dt;
        if (o.shootTimer <= 0) {
          o.shootTimer = rnd(1.5, 4.0);
          if (Math.random() < 0.45) {
            _playerHP -= 8;
            if (_playerHP <= 0) { _playerHP = 15; }
          }
        }

        /* move toward player */
        var toX = _playerPos.x - op.x;
        var toZ = _playerPos.z - op.z;
        var len = Math.sqrt(toX * toX + toZ * toZ) || 1;
        o.group.position.x += (toX / len) * o.speed * dt;
        o.group.position.z += (toZ / len) * o.speed * dt;
      }

      /* claim jumper stake logic */
      if (o.isClaimJumper && o.stakeTimer !== undefined) {
        o.stakeTimer -= dt;
        if (o.stakeTimer <= 0 && !_claimStakePlanted) {
          _claimStakePlanted = true;
          _claimPenalty     += 500;
          _goldOz            = Math.max(0, _goldOz - 500);
          plantClaimStake(o.group.position.x, o.group.position.z);
        }
      }
    }
  }

  function killOutlaw(idx) {
    var o = _outlaws[idx];
    if (!o.alive) return;
    o.alive = false;
    o.group.rotation.z = Math.PI / 2;
    o.group.position.y -= 0.4;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHERIFF AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateSheriff(dt) {
    if (!_sheriff || !_sheriff.alive) return;
    /* pace inside saloon */
    _sheriff.group.position.x = 18 + Math.sin(_clock * 0.5) * 3;
    _sheriff.group.position.z = -10 + Math.cos(_clock * 0.3) * 2;

    /* shoot at player if in range */
    var sp = _sheriff.group.position;
    var pd = dist3({ x: sp.x, y: sp.y, z: sp.z }, _playerPos);
    if (pd < 14) {
      if (!_sheriff.shootTimer) _sheriff.shootTimer = rnd(1, 3);
      _sheriff.shootTimer -= dt;
      if (_sheriff.shootTimer <= 0) {
        _sheriff.shootTimer = rnd(1.5, 3.5);
        if (Math.random() < 0.5) {
          _playerHP -= 12;
          if (_playerHP <= 0) { _playerHP = 15; }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CLAIM JUMPERS (every 2 minutes)
  ════════════════════════════════════════════════════════════════════════ */

  function updateClaimJumpers(dt) {
    _claimJumperTimer -= dt;

    if (_claimJumperTimer <= 0) {
      _claimJumperTimer  = 120.0; /* reset 2-min timer */
      _claimJumperWaveNum++;
      spawnClaimJumpers();
    }
  }

  function spawnClaimJumpers() {
    /* 3 extra outlaws on horseback from map edge */
    var spawnX = [-24, -22, -20];

    for (var ci = 0; ci < 3; ci++) {
      var hg = new THREE.Group();

      /* horse CylinderGeometry 0x885533 */
      var horseGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.4, 8);
      var horseM   = new THREE.Mesh(horseGeo, makeMat(0x885533));
      horseM.position.set(0, 0.7, 0);
      hg.add(horseM);

      /* horse head */
      var hhGeo = new THREE.BoxGeometry(0.6, 0.6, 0.8);
      var hhM   = new THREE.Mesh(hhGeo, makeMat(0x885533));
      hhM.position.set(0, 1.5, 0.5);
      hg.add(hhM);

      /* rider — claim jumper duster 0x553311 */
      var riderGeo = new THREE.BoxGeometry(0.65, 1.2, 0.45);
      var riderM   = new THREE.Mesh(riderGeo, makeMat(0x553311));
      riderM.position.set(0, 2.2, 0);
      hg.add(riderM);

      var rHeadGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
      var rHeadM   = new THREE.Mesh(rHeadGeo, makeMat(0x8B7355));
      rHeadM.position.set(0, 3.05, 0);
      hg.add(rHeadM);

      /* revolver */
      var revGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6);
      var revM   = new THREE.Mesh(revGeo, makeMat(0x888844));
      revM.rotation.z = Math.PI / 2;
      revM.position.set(0.48, 2.2, 0.15);
      hg.add(revM);

      hg.position.set(spawnX[ci], 0, 30);
      _scene.add(hg);

      _outlaws.push({
        group:         hg,
        hp:            100,
        alive:         true,
        patrolDir:     1,
        patrolTimer:   0,
        speed:         2.5 * 1.5, /* 1.5x faster */
        shootTimer:    rnd(1, 3),
        isClaimJumper: true,
        stakeTimer:    30.0        /* 30s to plant stake or be killed */
      });
    }
  }

  function plantClaimStake(x, z) {
    var stakeGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var stakeM   = new THREE.Mesh(stakeGeo, makeMat(0x884422));
    stakeM.position.set(x, 0.75, z);
    _scene.add(stakeM);

    var signGeo = new THREE.BoxGeometry(1.2, 0.6, 0.1);
    var signM   = new THREE.Mesh(signGeo, makeMat(0xCCAA33));
    signM.position.set(x, 1.8, z);
    _scene.add(signM);
  }

  /* ════════════════════════════════════════════════════════════════════════
     MINECART
  ════════════════════════════════════════════════════════════════════════ */

  function updateMinecart(dt) {
    if (!_cart || _cart.delivered) return;

    var cp = _cart.group.position;
    var pd = dist3({ x: cp.x, y: cp.y, z: cp.z }, _playerPos);

    /* load gold into cart if E pressed near cart and have gold */
    if (!!_keys['E'] && !_eKeyWasDown && pd < 3.5) {
      if (!_cart.loaded && _goldOz > 0) {
        _cart.loaded = true;
        _cartStatus  = 'LOADED';

        /* show gold in cart */
        var goldGeo = new THREE.BoxGeometry(1.2, 0.5, 1.8);
        var goldM   = new THREE.Mesh(goldGeo, makeMat(0xFFCC00, 0x886600));
        goldM.position.set(0, 1.4, 0);
        _cart.group.add(goldM);
      }
    }

    /* push loaded cart to exit with W */
    if (_cart.loaded && !!_keys['W'] && pd < 4.0) {
      _cartPushTimer += dt;
      var pushSpeed = 3.0;
      _cart.posZ += pushSpeed * dt;
      _cart.group.position.z = _cart.posZ;

      /* delivered when reaches Z = 34 (near exit) */
      if (_cart.posZ >= 34) {
        _cart.delivered = true;
        _cartStatus     = 'DELIVERED';
        /* bonus gold for delivery */
        _goldOz += 100;
      }
    } else {
      _cartPushTimer = 0;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FLOODING
  ════════════════════════════════════════════════════════════════════════ */

  function updateFlood(dt) {
    /* flooding starts at 6 minutes */
    if (_clock >= 360 && !_floodActive) {
      _floodActive = true;
      _waterY      = -4.0;
      buildWaterPlane();
    }

    if (!_floodActive) return;

    /* pump drain check */
    if (_pumpMesh) {
      var pumpp = _pumpMesh.position;
      var ppd   = dist3({ x: pumpp.x, y: pumpp.y, z: pumpp.z }, _playerPos);
      if (!!_keys['E'] && ppd < 3.5) {
        _pumpHoldTimer += dt;
        if (_pumpHoldTimer >= 10.0) {
          _draining      = true;
          _pumpHoldTimer = 0;
        }
      } else {
        _pumpHoldTimer = 0;
      }
    }

    if (_draining) {
      _waterY -= _waterRiseSpeed * 2 * dt;
      if (_waterY <= -4.0) {
        _waterY   = -4.0;
        _draining = false;
      }
    } else {
      _waterY += _waterRiseSpeed * dt;
    }

    if (_waterMesh) {
      _waterMesh.position.y = _waterY;
    }
  }

  function buildWaterPlane() {
    var geo = new THREE.PlaneGeometry(50, 70);
    _waterMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      color:       0x224466,
      emissive:    0x112233,
      transparent: true,
      opacity:     0.72
    }));
    _waterMesh.rotation.x = -Math.PI / 2;
    _waterMesh.position.set(0, _waterY, -5);
    _scene.add(_waterMesh);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING (mouse click)
  ════════════════════════════════════════════════════════════════════════ */

  function updateShooting() {
    if (!_mouseDown) return;
    _mouseDown = false;

    var pp   = new THREE.Vector3(_playerPos.x, _playerPos.y + 1.0, _playerPos.z);
    var aim  = new THREE.Vector3(-Math.sin(_yaw), Math.sin(_pitch), -Math.cos(_yaw)).normalize();

    /* check outlaws */
    var best = -1, bestScore = 0;
    for (var oi = 0; oi < _outlaws.length; oi++) {
      var o = _outlaws[oi];
      if (!o.alive) continue;
      var op   = o.group.position;
      var toO  = new THREE.Vector3(op.x - pp.x, op.y + 1 - pp.y, op.z - pp.z);
      var dist = toO.length();
      toO.normalize();
      var dot = aim.dot(toO);
      if (dot > 0.80 && dist < 25) {
        var score = dot / (dist + 1);
        if (score > bestScore) { bestScore = score; best = oi; }
      }
    }
    if (best >= 0) {
      _outlaws[best].hp -= 45;
      if (_outlaws[best].hp <= 0) killOutlaw(best);
      return;
    }

    /* check sheriff */
    if (_sheriff && _sheriff.alive) {
      var sp   = _sheriff.group.position;
      var toS  = new THREE.Vector3(sp.x - pp.x, sp.y + 0.8 - pp.y, sp.z - pp.z);
      var ds   = toS.length();
      toS.normalize();
      if (aim.dot(toS) > 0.80 && ds < 25) {
        _sheriff.hp -= 35;
        if (_sheriff.hp <= 0) {
          _sheriff.alive = false;
          _sheriff.group.rotation.z = Math.PI / 2;
          _sheriff.group.position.y -= 0.5;
        }
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     E KEY STATE TRACKING
  ════════════════════════════════════════════════════════════════════════ */

  function updateEKey() {
    _eKeyWasDown = !!_keys['E'];
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN LOOP
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    _lastTime = performance.now() / 1000;
    _clock    = 0;

    document.addEventListener('keydown',   onKeyDown);
    document.addEventListener('keyup',     onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
  }

  function update(timestamp) {
    var now = timestamp / 1000;
    var dt  = Math.min(now - _lastTime, 0.05);
    _lastTime = now;

    if (!_active) {
      _clock += dt;
      return;
    }

    _clock += dt;

    updatePlayer(dt);
    updateMining(dt);
    updateCeilings(dt);
    updateDynamiteInput();
    updateDynamites(dt);
    updateFlashes(dt);
    updateOutlaws(dt);
    updateSheriff(dt);
    updateClaimJumpers(dt);
    updateMinecart(dt);
    updateFlood(dt);
    updateDrowning(dt);
    updateShooting();
    updateEKey();

    updateHUD();
  }

  function reset() {
    _active        = false;
    _clock         = 0;
    _playerPos     = { x: 0, y: 0, z: 0 };
    _playerVel     = { x: 0, y: 0, z: 0 };
    _playerHP      = 100;
    _goldOz        = 0;
    _veinsMined    = 0;
    _dynamiteSticks = 4;
    _floodActive   = false;
    _waterY        = -4.0;
    _drownTimer    = 0;
    _pumpHoldTimer = 0;
    _draining      = false;
    _cartStatus    = 'EMPTY';
    _cartPushTimer = 0;
    _claimJumperTimer   = 120.0;
    _claimJumperWaveNum = 0;
    _claimStakePlanted  = false;
    _claimPenalty       = 0;
    _mineHoldTimer = 0;
    _miningVeinIdx = -1;
    _eKeyWasDown   = false;
    _fKeyWasDown   = false;
    _mouseX        = 0;
    _mouseY        = 0;
    _yaw           = 0;
    _pitch         = 0;
    _mouseDown     = false;
    _keyPressTime  = { G: 0, R: 0 };
    _keys          = {};

    /* remove scene objects */
    if (_playerGroup) { _scene.remove(_playerGroup); _playerGroup = null; }
    if (_mineGroup)   { _scene.remove(_mineGroup);   _mineGroup   = null; }
    if (_tracksGroup) { _scene.remove(_tracksGroup);  _tracksGroup = null; }
    if (_waterMesh)   { _scene.remove(_waterMesh);    _waterMesh   = null; }
    if (_pumpMesh)    { _scene.remove(_pumpMesh);     _pumpMesh    = null; }
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }

    if (_cart && _cart.group) { _scene.remove(_cart.group); }
    _cart = null;

    for (var oi = 0; oi < _outlaws.length; oi++) {
      _scene.remove(_outlaws[oi].group);
    }
    _outlaws = [];

    if (_sheriff && _sheriff.group) { _scene.remove(_sheriff.group); }
    _sheriff = null;

    for (var vi = 0; vi < _veins.length; vi++) {
      _scene.remove(_veins[vi].mesh);
      _scene.remove(_veins[vi].ceilingMesh);
    }
    _veins = [];

    for (var di = 0; di < _dynamites.length; di++) {
      _scene.remove(_dynamites[di].mesh);
    }
    _dynamites = [];

    if (_scene && _scene.userData && _scene.userData.flashes) {
      for (var fi = 0; fi < _scene.userData.flashes.length; fi++) {
        _scene.remove(_scene.userData.flashes[fi]);
      }
      _scene.userData.flashes = [];
    }
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };
}());
