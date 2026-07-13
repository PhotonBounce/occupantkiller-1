/* ───────────────────────────────────────────────────────────────────────────
   arms-dealer.js — Arms Dealer Underground Warehouse
   API: window.ArmsDealer = { init, update, reset }
   Controls:
     A + D (together, within 400ms) → activate module
     WASD                           → move player
     Mouse                          → aim / look
     F                              → camera flash (photograph exchange)
     E (within range)               → photograph documents / mark cache / interact
     Left Click                     → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.ArmsDealer = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active      = false;
  var _aPressTime  = 0;
  var _dPressTime  = 0;
  var _keys        = {};

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _score             = 0;
  var _gameTime          = 0;
  var _missionEnd        = false;
  var _detectionLevel    = 0;   /* 0=LOW 1=MED 2=HIGH */
  var _alarmTriggered    = false;

  /* ── Photo / intel ─────────────────────────────────────────────────────── */
  var _photosTotal       = 6;
  var _exchangePhotographed = false;
  var _docPhotos         = 0;     /* 0..5 */
  var _ledgerPhotographed = false;
  var _flashMesh         = null;
  var _flashTimer        = 0;
  var _cameraInteractTimer = {};  /* key=docIndex → countdown */

  /* ── GPS beacons on weapon caches ─────────────────────────────────────── */
  var _cachesMarked      = 0;     /* 0..8 */
  var _beaconTimers      = [];    /* per-cache hold timers */

  /* ── Non-lethal / tranq ────────────────────────────────────────────────── */
  var _hasTranq          = false;
  var _tranqAmmo         = 0;
  var _guardsIncapacitated = 0;
  var _nonLethalBonus    = false;
  var _killCount         = 0;

  /* ── Kingpin state ─────────────────────────────────────────────────────── */
  var _kingpinHP         = 350;
  var _kingpinAlive      = true;
  var _kingpinStatus     = 0;  /* 0=AT_TABLE 1=FLEEING 2=CAPTURED */
  var _kingpinFleeTrigger = false;
  var _escapeVehicleDisabled = false;

  /* ── Booby traps ───────────────────────────────────────────────────────── */
  var _hasDetector       = false;
  var _boobyTraps        = [];    /* { mesh, triggered } */

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player            = null;
  var _playerPos         = null;
  var _playerHP          = 100;
  var _mouseX            = 0;
  var _mouseY            = 0;
  var _yaw               = 0;
  var _pitch             = 0;
  var _fireTimer         = 0;
  var _fireRate          = 0.12;
  var _playerBullets     = [];
  var _enemyBullets      = [];
  var _bulletSpeed       = 22;

  /* ── Geometry refs ─────────────────────────────────────────────────────── */
  var _warehouseGroup    = null;
  var _guards            = [];     /* { mesh, hp, alive, incap, fireTimer, patrolDir, startX, startZ } */
  var _kingpin           = null;
  var _buyers            = [];
  var _docBoxes          = [];     /* { mesh, photographed } */
  var _ledger            = null;
  var _ledgerPhotographing = false;
  var _weaponCaches      = [];     /* { mesh, marked } */
  var _tranqPickup       = null;
  var _detectorPickup    = null;
  var _escapeVehicle     = null;
  var _escapeVehicleTires = [];
  var _serviceEntrance   = null;
  var _countingRoom      = null;
  var _coldStorage       = null;
  var _exchangeCrate     = null;
  var _cashCrate         = null;
  var _exchangeInProgress = true;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud               = null;

  /* ── Audio ─────────────────────────────────────────────────────────────── */
  var _audioCtx          = null;

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HELPERS                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _makeMat(color, emissive, emissiveIntensity) {
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = emissive;
      opts.emissiveIntensity = emissiveIntensity !== undefined ? emissiveIntensity : 0.4;
    }
    return new THREE.MeshLambertMaterial(opts);
  }

  function _box(w, h, d, color, emissive, emissiveIntensity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = _makeMat(color, emissive, emissiveIntensity);
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 6, 6);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _totalPhotos() {
    var n = _docPhotos;
    if (_exchangePhotographed) n++;
    if (_ledgerPhotographed) n++;
    return n;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD WAREHOUSE                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildWarehouse() {
    _warehouseGroup = new THREE.Group();

    /* Floor */
    var floor = _box(40, 0.2, 25, 0x334433);
    floor.position.set(0, -0.1, 0);
    _warehouseGroup.add(floor);

    /* Ceiling */
    var ceiling = _box(40, 0.3, 25, 0x223322);
    ceiling.position.set(0, 8, 0);
    _warehouseGroup.add(ceiling);

    /* Walls */
    var wallMat = _makeMat(0x334433);
    var wN = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 0.4), wallMat);
    wN.position.set(0, 4, -12.5);
    _warehouseGroup.add(wN);
    var wS = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 0.4), wallMat);
    wS.position.set(0, 4, 12.5);
    _warehouseGroup.add(wS);
    var wE = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 25), wallMat);
    wE.position.set(20, 4, 0);
    _warehouseGroup.add(wE);
    var wW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 25), wallMat);
    wW.position.set(-20, 4, 0);
    _warehouseGroup.add(wW);

    /* Ambient lighting — dim warehouse */
    var ambient = new THREE.AmbientLight(0x334433, 0.5);
    _scene.add(ambient);
    var lamp1 = new THREE.PointLight(0x665544, 1.2, 20);
    lamp1.position.set(-5, 6, 0);
    _scene.add(lamp1);
    var lamp2 = new THREE.PointLight(0x665544, 1.2, 20);
    lamp2.position.set(10, 6, -5);
    _scene.add(lamp2);
    var lamp3 = new THREE.PointLight(0x334455, 0.8, 15);
    lamp3.position.set(15, 6, 8);
    _scene.add(lamp3);

    _scene.add(_warehouseGroup);
  }

  function _buildCrateMaze() {
    /* Weapon crates stacked 2-3 high creating corridors */
    var cratePositions = [
      /* corridor left side */
      [-18, 0, -8], [-18, 1.2, -8],
      [-14, 0, -6], [-14, 1.2, -6], [-14, 2.4, -6],
      [-16, 0, -4], [-16, 1.2, -4],
      [-12, 0, -2], [-12, 1.2, -2], [-12, 2.4, -2],
      /* corridor mid */
      [-6,  0,  2], [-6,  1.2,  2],
      [-4,  0,  4], [-4,  1.2,  4], [-4, 2.4, 4],
      [-8,  0,  6], [-8,  1.2,  6],
      /* right side */
      [2,   0,  6], [2,   1.2,  6],
      [4,   0, -2], [4,   1.2, -2], [4, 2.4, -2],
      [6,   0,  4], [6,   1.2,  4],
      /* near counting room */
      [10,  0, -3], [10,  1.2, -3],
      [8,   0,  0], [8,   1.2,  0], [8, 2.4, 0],
    ];
    for (var i = 0; i < cratePositions.length; i++) {
      var c = cratePositions[i];
      var color = (i % 3 === 0) ? 0x664422 : 0x552211;
      var crate = _box(1.2, 1.2, 1.2, color);
      crate.position.set(c[0], c[1] + 0.6, c[2]);
      _warehouseGroup.add(crate);
    }
  }

  function _buildStructures() {
    /* Service entrance BoxGeometry 3x3x0.5 */
    _serviceEntrance = _box(3, 3, 0.5, 0x445544);
    _serviceEntrance.position.set(-19.8, 1.5, 5);
    _warehouseGroup.add(_serviceEntrance);

    /* Counting room BoxGeometry 10x4x8 at rear */
    _countingRoom = _box(10, 4, 8, 0x223322);
    _countingRoom.position.set(15, 2, -8);
    _warehouseGroup.add(_countingRoom);

    /* Counting room floor interior marker */
    var crFloor = _box(9.6, 0.1, 7.6, 0x1A2A1A);
    crFloor.position.set(15, 0.05, -8);
    _warehouseGroup.add(crFloor);

    /* Cold storage BoxGeometry 12x5x10 */
    _coldStorage = _box(12, 5, 10, 0x334455);
    _coldStorage.position.set(14, 2.5, 8);
    _warehouseGroup.add(_coldStorage);

    /* Cold storage interior floor */
    var csFloor = _box(11.6, 0.1, 9.6, 0x223344);
    csFloor.position.set(14, 0.05, 8);
    _warehouseGroup.add(csFloor);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD DEAL SCENE                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildDealScene() {
    /* Deal table */
    var table = _box(4, 0.15, 2, 0x443322);
    table.position.set(0, 0.9, -6);
    _warehouseGroup.add(table);

    /* Weapons crate on table (being exchanged) */
    _exchangeCrate = _box(1.0, 0.7, 0.6, 0x664422);
    _exchangeCrate.position.set(-0.8, 1.3, -6);
    _warehouseGroup.add(_exchangeCrate);

    /* Cash crate on table */
    _cashCrate = _box(0.9, 0.5, 0.6, 0x225522);
    _cashCrate.position.set(0.8, 1.2, -6);
    _warehouseGroup.add(_cashCrate);

    /* Arms kingpin — BoxGeometry 1.4x scale */
    _buildKingpin();

    /* 4 buyers */
    var buyerPositions = [
      [1.5, 0, -7.5], [-1.5, 0, -7.5],
      [1.5, 0, -4.5], [-1.5, 0, -4.5]
    ];
    for (var i = 0; i < 4; i++) {
      var bGroup = new THREE.Group();
      var bBody = _box(0.55, 1.6, 0.4, 0x334455);
      bBody.position.y = 0.8;
      bGroup.add(bBody);
      var bHead = _sphere(0.22, 0x554433);
      bHead.position.y = 1.72;
      bGroup.add(bHead);
      bGroup.position.set(buyerPositions[i][0], 0, buyerPositions[i][2]);
      _scene.add(bGroup);
      _buyers.push(bGroup);
    }
  }

  function _buildKingpin() {
    var g = new THREE.Group();
    /* Body BoxGeometry at 1.4x scale */
    var body = _box(0.7, 1.7, 0.5, 0x220033);
    body.scale.set(1.4, 1.4, 1.4);
    body.position.y = 1.19;
    g.add(body);
    /* Head */
    var head = _sphere(0.28, 0x220033);
    head.scale.set(1.4, 1.4, 1.4);
    head.position.y = 2.72;
    g.add(head);
    /* Distinctive hat */
    var hat = _box(0.55, 0.25, 0.55, 0x110022);
    hat.position.y = 3.1;
    g.add(hat);
    g.position.set(0, 0, -6.8);
    _scene.add(g);
    _kingpin = g;
    _kingpin._fireTimer = 1.5;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD GUARDS                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildGuard(x, z) {
    var g = new THREE.Group();
    var body = _box(0.55, 1.6, 0.4, 0x553322);
    body.position.y = 0.8;
    g.add(body);
    var head = _sphere(0.22, 0x664433);
    head.position.y = 1.72;
    g.add(head);
    var gun = _box(0.08, 0.08, 0.7, 0x222222);
    gun.position.set(0.32, 1.1, 0.35);
    g.add(gun);
    g.position.set(x, 0, z);
    _scene.add(g);
    return { mesh: g, hp: 80, alive: true, incap: false, fireTimer: 1 + Math.random() * 2,
             patrolDir: 1, startX: x, startZ: z };
  }

  function _buildGuards() {
    /* 10 dealer guards patrolling the warehouse */
    _guards.push(_buildGuard(-15, -2));
    _guards.push(_buildGuard(-10,  2));
    _guards.push(_buildGuard(-5,  -4));
    _guards.push(_buildGuard(3,    3));
    _guards.push(_buildGuard(7,   -1));
    _guards.push(_buildGuard(12,   4));
    _guards.push(_buildGuard(-18,  8));
    _guards.push(_buildGuard(-2,   8));
    _guards.push(_buildGuard(16,  -3));
    _guards.push(_buildGuard(6,   10));
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD INTEL DOCUMENTS                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildIntelDocs() {
    /* 5 document boxes in office/counting room area */
    var docPositions = [
      [12, 0, -10], [14, 0, -10], [16, 0, -10],
      [13, 0, -7],  [17, 0, -7]
    ];
    for (var i = 0; i < 5; i++) {
      var d = _box(0.5, 0.3, 0.4, 0xFFFFAA);
      d.position.set(docPositions[i][0], 0.15, docPositions[i][2]);
      _warehouseGroup.add(d);
      _docBoxes.push({ mesh: d, photographed: false, idx: i });
      _beaconTimers.push(0);
    }

    /* Ledger on desk — bonus intel */
    _ledger = _box(0.6, 0.05, 0.4, 0x885522);
    _ledger.position.set(15, 1.15, -8);
    _warehouseGroup.add(_ledger);

    /* Desk */
    var desk = _box(2, 1.1, 1, 0x442211);
    desk.position.set(15, 0.55, -8);
    _warehouseGroup.add(desk);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD WEAPON CACHES                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildWeaponCaches() {
    /* 8 glowing weapon crates in cold storage */
    var cachePositions = [
      [9,  0.6, 5],  [11, 0.6, 5],
      [13, 0.6, 5],  [15, 0.6, 5],
      [9,  0.6, 11], [11, 0.6, 11],
      [13, 0.6, 11], [15, 0.6, 11]
    ];
    for (var i = 0; i < 8; i++) {
      var c = _box(1.2, 1.2, 1.2, 0x556655, 0x335533, 0.5);
      c.position.set(cachePositions[i][0], cachePositions[i][1], cachePositions[i][2]);
      _warehouseGroup.add(c);
      _weaponCaches.push({ mesh: c, marked: false });
      _beaconTimers.push(0);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD BOOBY TRAPS                                                       */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildBoobyTraps() {
    var trapPositions = [
      [-11, 0, -3], [-15, 0, -7], [5, 0, -1], [9, 0, 3], [-3, 0, 6]
    ];
    for (var i = 0; i < trapPositions.length; i++) {
      var t = _box(1.0, 1.0, 1.0, 0xFF2222, 0xFF0000, 0.12);
      t.position.set(trapPositions[i][0], 0.5, trapPositions[i][2]);
      _warehouseGroup.add(t);
      _boobyTraps.push({ mesh: t, triggered: false });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD PICKUPS                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPickups() {
    /* Tranq rounds pickup */
    _tranqPickup = _box(0.5, 0.3, 0.3, 0x44AAFF);
    _tranqPickup.position.set(-17, 0.15, -10);
    _warehouseGroup.add(_tranqPickup);

    /* Trap detector pickup */
    _detectorPickup = _box(0.4, 0.4, 0.4, 0x44FF44);
    _detectorPickup.position.set(18, 0.2, 10);
    _warehouseGroup.add(_detectorPickup);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD ESCAPE VEHICLE                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildEscapeVehicle() {
    var g = new THREE.Group();
    /* Body BoxGeometry 5x2x2.5 */
    var body = _box(5, 2, 2.5, 0x220022);
    body.position.y = 1;
    g.add(body);
    /* Tires — CylinderGeometry r=0.5 as LineSegments */
    var tirePositions = [
      [-2, 0.5, 1.4], [2, 0.5, 1.4],
      [-2, 0.5, -1.4], [2, 0.5, -1.4]
    ];
    for (var i = 0; i < 4; i++) {
      var tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10);
      var wireGeo = new THREE.WireframeGeometry(tireGeo);
      var tire = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x222222 }));
      tire.rotation.z = Math.PI / 2;
      tire.position.set(tirePositions[i][0], tirePositions[i][1], tirePositions[i][2]);
      g.add(tire);
      _escapeVehicleTires.push(tire);
    }
    /* Position near service entrance / exit */
    g.position.set(-18, 0, 10);
    _scene.add(g);
    _escapeVehicle = g;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD PLAYER                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPlayer() {
    var g = new THREE.Group();
    var body = _box(0.6, 1.6, 0.4, 0x334455);
    body.position.y = 0.8;
    g.add(body);
    var gun = _box(0.1, 0.1, 0.8, 0x333333);
    gun.position.set(0.35, 1.1, 0.4);
    g.add(gun);
    /* Start near service entrance */
    g.position.set(-16, 0, 10);
    _scene.add(g);
    _player = g;
    _playerPos = g.position;
    _camera.position.set(-16, 5, 16);
    _camera.lookAt(-16, 1, 10);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HUD                                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'ad-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#AAFFAA',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #334433',
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
    var photos = _totalPhotos();
    var guardsActive = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i].alive && !_guards[i].incap) guardsActive++;
    }
    var kStr;
    if (_kingpinStatus === 0) kStr = 'AT TABLE';
    else if (_kingpinStatus === 1) kStr = '<span style="color:#FF8844">FLEEING</span>';
    else kStr = '<span style="color:#44FF44">CAPTURED</span>';

    var detStr;
    if (_detectionLevel === 0) detStr = '<span style="color:#44FF44">LOW</span>';
    else if (_detectionLevel === 1) detStr = '<span style="color:#FFFF44">MED</span>';
    else detStr = '<span style="color:#FF4444">HIGH</span>';

    _hud.innerHTML =
      'ARMS DEAL ' +
      '[PHOTOS: ' + photos + '/' + _photosTotal + '] ' +
      '[GUARDS: ' + guardsActive + '] ' +
      '[KINGPIN: ' + kStr + '] ' +
      '[CACHES: ' + _cachesMarked + '/8] | ' +
      'DETECTION: ' + detStr;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CAMERA FLASH (F key)                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _doFlash() {
    /* Create a brief white sphere burst */
    if (_flashMesh) {
      _scene.remove(_flashMesh);
      _flashMesh = null;
    }
    var flashGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9 });
    _flashMesh = new THREE.Mesh(flashGeo, flashMat);
    _flashMesh.position.copy(_playerPos).setY(_playerPos.y + 1.2);
    _scene.add(_flashMesh);
    _flashTimer = 0.18;

    /* Try photograph exchange if close enough */
    if (_exchangeInProgress && !_exchangePhotographed) {
      var exchPos = { x: 0, y: 1, z: -6 };
      var d = _dist(_playerPos, exchPos);
      if (d <= 15) {
        _exchangePhotographed = true;
        _score += 500;
      }
    }

    /* Raise detection slightly on flash */
    _raiseDetection(1);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INTERACT (E key)                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryInteract() {
    /* Tranq pickup */
    if (!_hasTranq && _tranqPickup) {
      if (_dist(_playerPos, _tranqPickup.position) < 2) {
        _hasTranq = true;
        _tranqAmmo = 15;
        _scene.remove(_tranqPickup);
        _tranqPickup = null;
        return;
      }
    }

    /* Detector pickup */
    if (!_hasDetector && _detectorPickup) {
      if (_dist(_playerPos, _detectorPickup.position) < 2) {
        _hasDetector = true;
        _scene.remove(_detectorPickup);
        _detectorPickup = null;
        /* Reveal booby traps visually */
        for (var bi = 0; bi < _boobyTraps.length; bi++) {
          _boobyTraps[bi].mesh.material.emissiveIntensity = 0.8;
        }
        return;
      }
    }

    /* Document boxes — 3s photograph */
    for (var i = 0; i < _docBoxes.length; i++) {
      var db = _docBoxes[i];
      if (db.photographed) continue;
      if (_dist(_playerPos, db.mesh.position) < 2.5) {
        var key = 'doc' + i;
        if (!_cameraInteractTimer[key]) {
          _cameraInteractTimer[key] = 3.0;
        }
        return;
      }
    }

    /* Ledger */
    if (!_ledgerPhotographed && _ledger) {
      if (_dist(_playerPos, _ledger.position) < 2.5) {
        if (!_cameraInteractTimer['ledger']) {
          _cameraInteractTimer['ledger'] = 3.0;
        }
        return;
      }
    }

    /* Weapon cache GPS beacon */
    for (var j = 0; j < _weaponCaches.length; j++) {
      var wc = _weaponCaches[j];
      if (wc.marked) continue;
      if (_dist(_playerPos, wc.mesh.position) < 2.5) {
        var wkey = 'cache' + j;
        if (!_cameraInteractTimer[wkey]) {
          _cameraInteractTimer[wkey] = 2.0;
        }
        return;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  DETECTION                                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _raiseDetection(amount) {
    _detectionLevel = Math.min(2, _detectionLevel + amount);
    if (_detectionLevel >= 2 && !_alarmTriggered) {
      _triggerAlarm();
    }
  }

  function _triggerAlarm() {
    _alarmTriggered = true;
    /* Kingpin flees unless guards all down */
    var aliveGuards = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i].alive && !_guards[i].incap) aliveGuards++;
    }
    if (aliveGuards > 0) {
      _kingpinStatus = 1;
      _kingpinFleeTrigger = true;
    }
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 660;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + 2);
    } catch (e) { /* no audio */ }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  SHOOT                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _firePlayerBullet(tranq) {
    var color = tranq ? 0x44AAFF : 0xFFFF88;
    var b = _sphere(0.12, color);
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    b.position.copy(_camera.position).addScaledVector(dir, 1.5);
    _scene.add(b);
    _playerBullets.push({ mesh: b, vel: dir.multiplyScalar(38), life: 1.8, tranq: !!tranq });
    if (tranq) _tranqAmmo--;
    /* Shooting raises detection */
    if (!tranq) _raiseDetection(1);
  }

  function _fireEnemyBullet(fromPos) {
    var b = _sphere(0.1, 0x881100);
    b.position.copy(fromPos);
    _scene.add(b);
    var dir = _playerPos.clone().sub(fromPos).normalize();
    dir.x += (Math.random() - 0.5) * 0.2;
    dir.y += (Math.random() - 0.5) * 0.1;
    dir.z += (Math.random() - 0.5) * 0.2;
    dir.normalize();
    _enemyBullets.push({ mesh: b, vel: dir.multiplyScalar(_bulletSpeed), life: 2 });
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MISSION SUCCESS CHECKS                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkMissionSuccess() {
    /* All 5 docs + exchange photo = stealth mission complete */
    if (_docPhotos >= 5 && _exchangePhotographed && !_missionEnd) {
      _score += 2000;
      if (_ledgerPhotographed) _score += 1000;
      _missionEnd = true;
      _showResult('MISSION COMPLETE<br><span style="font-size:16px">Intel gathered without engagement</span>', '#44FF44', '#224422');
      return;
    }
    /* All 8 caches marked = airstrike confirmed */
    if (_cachesMarked >= 8 && !_missionEnd) {
      _score += 3000;
      _missionEnd = true;
      _showResult('AIRSTRIKE CONFIRMED<br><span style="font-size:16px">All weapon caches marked for destruction</span>', '#FFAA44', '#443322');
      return;
    }
    /* Non-lethal bonus: all guards incapacitated, no kills */
    if (_killCount === 0 && _guardsIncapacitated >= 10 && !_nonLethalBonus) {
      _nonLethalBonus = true;
      _score += 2000;
    }
    /* Kingpin captured */
    if (_kingpinStatus === 2 && !_missionEnd) {
      _score += 2500;
      if (_nonLethalBonus) _score += 1000;
      _missionEnd = true;
      _showResult('KINGPIN CAPTURED<br><span style="font-size:16px">Arms network dismantled</span>', '#44FFFF', '#223344');
    }
  }

  function _showResult(msg, color, bg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:' + color,
      'font-family:monospace', 'font-size:26px',
      'padding:30px 50px',
      'border:2px solid ' + color,
      'border-radius:8px', 'z-index:99999', 'text-align:center'
    ].join(';');
    el.innerHTML = msg + '<br><span style="font-size:18px;color:#AAAAAA">SCORE: ' + _score + '</span>';
    document.body.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INPUT                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    /* Activation: A+D simultaneous within 400ms */
    if (k === 'a') _aPressTime = performance.now();
    if (k === 'd') _dPressTime = performance.now();
    if (k === 'a' && _keys['d'] && Math.abs(_aPressTime - _dPressTime) < 400) {
      if (!_active) { _activate(); return; }
    }
    if (k === 'd' && _keys['a'] && Math.abs(_aPressTime - _dPressTime) < 400) {
      if (!_active) { _activate(); return; }
    }

    if (!_active) return;

    if (k === 'e') _tryInteract();
    if (k === 'f') _doFlash();
  }

  function _onKeyUp(e) {
    _keys[e.key.toLowerCase()] = false;
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
    if (!_active) return;
    if (_fireTimer <= 0) {
      var useTranq = _hasTranq && _tranqAmmo > 0 && _keys['t'];
      _firePlayerBullet(useTranq);
      _fireTimer = _fireRate;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ACTIVATE                                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _activate() {
    if (_active) return;
    _active = true;
    _buildWarehouse();
    _buildCrateMaze();
    _buildStructures();
    _buildDealScene();
    _buildGuards();
    _buildIntelDocs();
    _buildWeaponCaches();
    _buildBoobyTraps();
    _buildPickups();
    _buildEscapeVehicle();
    _buildPlayer();
    _buildHUD();
    if (_canvas) {
      _canvas.requestPointerLock = _canvas.requestPointerLock || _canvas.mozRequestPointerLock;
      if (_canvas.requestPointerLock) _canvas.requestPointerLock();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _update(dt) {
    if (!_active || _missionEnd) return;
    _gameTime += dt;
    _fireTimer = Math.max(0, _fireTimer - dt);

    _updatePlayer(dt);
    _updateGuards(dt);
    _updateKingpin(dt);
    _updateFlash(dt);
    _updateInteractTimers(dt);
    _updateBullets(dt);
    _checkCollisions();
    _checkBoobyTraps();
    _checkKingpinEscape();
    _checkGameTimer();
    _checkMissionSuccess();
    _updateHUD();
  }

  function _updatePlayer(dt) {
    if (!_player) return;
    var speed = 4;
    var fwd   = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    var right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);

    if (_keys['w'] || _keys['arrowup'])    { _playerPos.addScaledVector(fwd,   speed * dt); }
    if (_keys['s'] || _keys['arrowdown'])  { _playerPos.addScaledVector(fwd,  -speed * dt); }
    if (_keys['a'] || _keys['arrowleft'])  { _playerPos.addScaledVector(right, -speed * dt); }
    if (_keys['d'] || _keys['arrowright']) { _playerPos.addScaledVector(right,  speed * dt); }

    /* Clamp inside warehouse */
    _playerPos.x = Math.max(-19.5, Math.min(19.5, _playerPos.x));
    _playerPos.z = Math.max(-12,   Math.min(12,   _playerPos.z));
    _playerPos.y = 0;

    _player.position.copy(_playerPos);
    _player.rotation.y = _yaw;

    var camOffset = new THREE.Vector3(0, 5, 8);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    _camera.position.copy(_playerPos).add(camOffset);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  function _updateGuards(dt) {
    for (var i = 0; i < _guards.length; i++) {
      var s = _guards[i];
      if (!s.alive || s.incap) continue;
      var d = _dist(_playerPos, s.mesh.position);

      /* Patrol */
      if (!_alarmTriggered) {
        s.mesh.position.x += s.patrolDir * 0.8 * dt;
        if (Math.abs(s.mesh.position.x - s.startX) > 4) s.patrolDir *= -1;
        if (d < 8) _raiseDetection(0); /* proximity detection tick — passive */
      }

      /* Shoot if alarm or player too close */
      if (_alarmTriggered || d < 10) {
        s.mesh.lookAt(_playerPos);
        s.fireTimer -= dt;
        if (s.fireTimer <= 0) {
          _fireEnemyBullet(s.mesh.position.clone().setY(s.mesh.position.y + 1.1));
          s.fireTimer = 1.4 + Math.random() * 1.2;
        }
        if (_alarmTriggered) {
          var dir = _playerPos.clone().sub(s.mesh.position).normalize();
          s.mesh.position.addScaledVector(dir, 1.8 * dt);
        }
      }
    }
  }

  function _updateKingpin(dt) {
    if (!_kingpin || !_kingpinAlive) return;

    if (_kingpinStatus === 0) {
      /* Animate at table */
      _kingpin.rotation.y = Math.sin(_gameTime * 0.4) * 0.3;
    } else if (_kingpinStatus === 1 && _kingpinFleeTrigger) {
      /* Move toward escape vehicle */
      if (_escapeVehicle) {
        var evPos = _escapeVehicle.position;
        var dir = evPos.clone().sub(_kingpin.position).normalize();
        _kingpin.position.addScaledVector(dir, 3 * dt);
        _kingpin.lookAt(evPos);

        /* If reached escape vehicle and not disabled — kingpin escapes */
        if (_dist(_kingpin.position, evPos) < 2.5 && !_escapeVehicleDisabled) {
          if (!_missionEnd) {
            _missionEnd = true;
            _showResult('MISSION FAILED<br><span style="font-size:16px">Kingpin escaped</span>', '#FF4444', '#440000');
          }
        }
      }
      /* Shoot at player while fleeing */
      if (_alarmTriggered) {
        _kingpin._fireTimer = (_kingpin._fireTimer || 0) - dt;
        if (_kingpin._fireTimer <= 0) {
          _fireEnemyBullet(_kingpin.position.clone().setY(_kingpin.position.y + 2.4));
          _kingpin._fireTimer = 1.2;
        }
      }
    }
  }

  function _checkKingpinEscape() {
    /* 4 minutes → flee trigger even without alarm */
    if (_gameTime > 240 && _kingpinStatus === 0 && !_alarmTriggered) {
      _kingpinStatus = 1;
      _kingpinFleeTrigger = true;
    }
  }

  function _updateFlash(dt) {
    if (_flashMesh) {
      _flashTimer -= dt;
      if (_flashTimer <= 0) {
        _scene.remove(_flashMesh);
        _flashMesh = null;
      } else {
        _flashMesh.material.opacity = Math.max(0, _flashTimer / 0.18) * 0.9;
      }
    }
  }

  function _updateInteractTimers(dt) {
    var k;
    for (k in _cameraInteractTimer) {
      if (!Object.prototype.hasOwnProperty.call(_cameraInteractTimer, k)) continue;
      _cameraInteractTimer[k] -= dt;
      if (_cameraInteractTimer[k] <= 0) {
        delete _cameraInteractTimer[k];
        /* Complete the action */
        if (k.indexOf('doc') === 0) {
          var idx = parseInt(k.replace('doc', ''), 10);
          if (!_docBoxes[idx].photographed) {
            _docBoxes[idx].photographed = true;
            _docPhotos++;
            _score += 200;
            _docBoxes[idx].mesh.material.color.setHex(0x888866);
          }
        } else if (k === 'ledger') {
          if (!_ledgerPhotographed) {
            _ledgerPhotographed = true;
            _score += 400;
            if (_ledger) _ledger.material.color.setHex(0x554411);
          }
        } else if (k.indexOf('cache') === 0) {
          var ci = parseInt(k.replace('cache', ''), 10);
          if (!_weaponCaches[ci].marked) {
            _weaponCaches[ci].marked = true;
            _cachesMarked++;
            _score += 150;
            _weaponCaches[ci].mesh.material.color.setHex(0x44FF44);
            _weaponCaches[ci].mesh.material.emissive.setHex(0x00FF00);
            _weaponCaches[ci].mesh.material.emissiveIntensity = 1.0;
          }
        }
      }
    }
  }

  function _updateBullets(dt) {
    var i;
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      pb.mesh.position.addScaledVector(pb.vel, dt);
      pb.life -= dt;
      if (pb.life <= 0) {
        _scene.remove(pb.mesh);
        _playerBullets.splice(i, 1);
      }
    }
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      var eb = _enemyBullets[i];
      eb.mesh.position.addScaledVector(eb.vel, dt);
      eb.life -= dt;
      if (eb.life <= 0) {
        _scene.remove(eb.mesh);
        _enemyBullets.splice(i, 1);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  COLLISION                                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkCollisions() {
    var i, j, hit;

    /* Player bullets */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      hit = false;

      /* Guards */
      for (j = 0; j < _guards.length; j++) {
        var s = _guards[j];
        if (!s.alive || s.incap) continue;
        if (_dist(pb.mesh.position, s.mesh.position) < 1.1) {
          if (pb.tranq) {
            s.incap = true;
            s.mesh.rotation.x = Math.PI / 2;
            _guardsIncapacitated++;
            /* Check if all guards incap → stop kingpin flee */
            var anyActive = false;
            for (var gi = 0; gi < _guards.length; gi++) {
              if (_guards[gi].alive && !_guards[gi].incap) { anyActive = true; break; }
            }
            if (!anyActive && _kingpinStatus === 1) {
              _kingpinStatus = 2;
              _kingpinFleeTrigger = false;
            }
          } else {
            s.hp -= 35;
            if (s.hp <= 0) {
              s.alive = false;
              _scene.remove(s.mesh);
              _killCount++;
              _score += 50;
              if (!_alarmTriggered) _raiseDetection(1);
            }
          }
          hit = true;
          break;
        }
      }
      if (hit) { _scene.remove(pb.mesh); _playerBullets.splice(i, 1); continue; }

      /* Kingpin */
      if (_kingpinAlive && _kingpin && _dist(pb.mesh.position, _kingpin.position) < 1.8) {
        if (pb.tranq) {
          _kingpinAlive = false;
          _kingpin.rotation.x = Math.PI / 2;
          _kingpinStatus = 2;
          _score += 1000;
        } else {
          _kingpinHP -= 25;
          if (!_alarmTriggered) _raiseDetection(1);
          if (_kingpinHP <= 0) {
            _kingpinAlive = false;
            _scene.remove(_kingpin);
            _kingpin = null;
            _killCount++;
            _score += 800;
            if (!_missionEnd) {
              _missionEnd = true;
              _showResult('KINGPIN ELIMINATED<br><span style="font-size:16px">Arms deal shut down</span>', '#FFAA44', '#442200');
            }
          }
        }
        hit = true;
      }
      if (hit) { _scene.remove(pb.mesh); _playerBullets.splice(i, 1); continue; }

      /* Escape vehicle tires */
      if (!_escapeVehicleDisabled && _escapeVehicle) {
        if (_dist(pb.mesh.position, _escapeVehicle.position) < 4) {
          _escapeVehicleDisabled = true;
          /* Visual — color tires red */
          for (var ti = 0; ti < _escapeVehicleTires.length; ti++) {
            _escapeVehicleTires[ti].material.color.setHex(0xFF2222);
          }
          _score += 300;
          hit = true;
        }
      }
      if (hit) { _scene.remove(pb.mesh); _playerBullets.splice(i, 1); continue; }
    }

    /* Enemy bullets hit player */
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      var eb = _enemyBullets[i];
      if (_dist(eb.mesh.position, _playerPos) < 0.8) {
        _playerHP -= 10;
        _scene.remove(eb.mesh);
        _enemyBullets.splice(i, 1);
        if (_playerHP <= 0 && !_missionEnd) {
          _missionEnd = true;
          _showResult('MISSION FAILED<br><span style="font-size:16px">Agent down</span>', '#FF4444', '#440000');
        }
      }
    }
  }

  function _checkBoobyTraps() {
    for (var i = 0; i < _boobyTraps.length; i++) {
      var t = _boobyTraps[i];
      if (t.triggered) continue;
      if (_dist(_playerPos, t.mesh.position) < 1.5) {
        t.triggered = true;
        t.mesh.material.color.setHex(0xFF0000);
        _playerHP -= 60;
        if (_playerHP <= 0 && !_missionEnd) {
          _missionEnd = true;
          _showResult('MISSION FAILED<br><span style="font-size:16px">Triggered booby trap</span>', '#FF4444', '#440000');
        }
        _raiseDetection(1);
      }
    }
  }

  function _checkGameTimer() {
    /* After 4 minutes (240s) with no alarm, kingpin flees — handled in _checkKingpinEscape */
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  RESET                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _reset() {
    _active            = false;
    _score             = 0;
    _gameTime          = 0;
    _missionEnd        = false;
    _detectionLevel    = 0;
    _alarmTriggered    = false;
    _exchangePhotographed = false;
    _docPhotos         = 0;
    _ledgerPhotographed = false;
    _flashTimer        = 0;
    _cameraInteractTimer = {};
    _cachesMarked      = 0;
    _hasTranq          = false;
    _tranqAmmo         = 0;
    _guardsIncapacitated = 0;
    _nonLethalBonus    = false;
    _killCount         = 0;
    _kingpinHP         = 350;
    _kingpinAlive      = true;
    _kingpinStatus     = 0;
    _kingpinFleeTrigger = false;
    _escapeVehicleDisabled = false;
    _hasDetector       = false;
    _playerHP          = 100;
    _mouseX            = 0;
    _mouseY            = 0;
    _yaw               = 0;
    _pitch             = 0;
    _fireTimer         = 0;
    _exchangeInProgress = true;
    _ledgerPhotographing = false;

    /* Remove scene objects */
    if (_warehouseGroup && _scene) _scene.remove(_warehouseGroup);
    if (_player && _scene)         _scene.remove(_player);
    if (_kingpin && _scene)        _scene.remove(_kingpin);
    if (_escapeVehicle && _scene)  _scene.remove(_escapeVehicle);
    if (_flashMesh && _scene)      _scene.remove(_flashMesh);

    var i;
    for (i = 0; i < _guards.length; i++) {
      if (_guards[i].mesh && _scene) _scene.remove(_guards[i].mesh);
    }
    for (i = 0; i < _buyers.length; i++) {
      if (_buyers[i] && _scene) _scene.remove(_buyers[i]);
    }
    for (i = 0; i < _playerBullets.length; i++) {
      if (_playerBullets[i].mesh && _scene) _scene.remove(_playerBullets[i].mesh);
    }
    for (i = 0; i < _enemyBullets.length; i++) {
      if (_enemyBullets[i].mesh && _scene) _scene.remove(_enemyBullets[i].mesh);
    }

    _warehouseGroup    = null;
    _player            = null;
    _playerPos         = null;
    _kingpin           = null;
    _escapeVehicle     = null;
    _flashMesh         = null;
    _ledger            = null;
    _tranqPickup       = null;
    _detectorPickup    = null;
    _serviceEntrance   = null;
    _countingRoom      = null;
    _coldStorage       = null;
    _exchangeCrate     = null;
    _cashCrate         = null;
    _guards            = [];
    _buyers            = [];
    _docBoxes          = [];
    _weaponCaches      = [];
    _boobyTraps        = [];
    _escapeVehicleTires = [];
    _playerBullets     = [];
    _enemyBullets      = [];
    _beaconTimers      = [];

    if (_audioCtx) {
      try { _audioCtx.close(); } catch (e) {}
      _audioCtx = null;
    }
    _removeHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PUBLIC API                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;
    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('click',     _onClick);
  }

  function update(dt) {
    _update(dt);
  }

  function reset() {
    _reset();
  }

  return { init: init, update: update, reset: reset };

}());
