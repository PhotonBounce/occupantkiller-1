/* ───────────────────────────────────────────────────────────────────────────
   assassination.js — Assassination Mission
   API: window.Assassination = { init, update, reset }
   Controls:
     A + N (together, within 400ms) → activate module
     WASD                           → move player
     Mouse                          → aim / look
     Hold Right-Click (2s)          → clean sniper shot
     E (within 1 unit undetected)   → melee instant kill
     F                              → throw decoy phone (distract 2 guards 15s)
     M                              → toggle overhead map
     Left-Click                     → fire weapon / use current method
   Methods cycle on Tab key: SNIPER / POISON / EXPLOSIVE / MELEE
   ─────────────────────────────────────────────────────────────────────────── */
window.Assassination = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active      = false;
  var _aPressTime  = 0;
  var _nPressTime  = 0;
  var _keys        = {};

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _score               = 0;
  var _missionEnd          = false;
  var _gameTime            = 0;
  var _cleanKill           = true;   // no collateral, no alarm
  var _alarmTriggered      = false;
  var _policeArrivalTimer  = 180;    // 3-minute extraction window
  var _policeSurrounded    = false;
  var _extractionSuccess   = false;
  var _methodBonusAwarded  = false;

  /* ── Target schedule ───────────────────────────────────────────────────── */
  var LOCATION_OFFICE        = 0;
  var LOCATION_CONFERENCE    = 1;
  var LOCATION_ROOFTOP       = 2;
  var _locationNames         = ['OFFICE', 'CONFERENCE', 'ROOFTOP'];
  var _locationPositions     = [
    { x: 0,   y: 3,  z: 0   },   // office level 3
    { x: 30,  y: 0,  z: 0   },   // conference room
    { x: -30, y: 8,  z: 0   }    // rooftop
  ];
  var _currentLocation       = LOCATION_OFFICE;
  var _locationTimer         = 240; // 4-minute schedule per location
  var _conferenceWindow      = false;
  var _conferenceWindowTimer = 0;

  /* ── Target ────────────────────────────────────────────────────────────── */
  var _target                = null;
  var _targetHP              = 300;
  var _targetAlive           = true;
  var _targetKilled          = false;
  var _targetKilledTime      = 0;

  /* ── Bodyguards ────────────────────────────────────────────────────────── */
  var _bodyguards            = [];   // { mesh, hp, alive, alertLevel, patrolAngle, decoyDistracted, decoyTimer, patrolOffset }

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player                = null;
  var _playerPos             = null;
  var _playerHP              = 100;
  var _mouseX                = 0;
  var _mouseY                = 0;
  var _yaw                   = 0;
  var _pitch                 = 0;
  var _playerDetected        = false;
  var _detectionLevel        = 0;   // 0-100

  /* ── Assassination method ──────────────────────────────────────────────── */
  var METHOD_SNIPER    = 0;
  var METHOD_POISON    = 1;
  var METHOD_EXPLOSIVE = 2;
  var METHOD_MELEE     = 3;
  var _methodNames     = ['SNIPER', 'POISON', 'EXPLOSIVE', 'MELEE'];
  var _currentMethod   = METHOD_SNIPER;

  /* ── Sniper ────────────────────────────────────────────────────────────── */
  var _sniperScopeActive     = false;
  var _sniperAimTimer        = 0;    // accumulates while right-click held
  var _sniperCleanThreshold  = 2.0;  // seconds for clean shot
  var _rightMouseDown        = false;
  var _sniperBullets         = [];   // { mesh, vel, life, windDrop }

  /* ── Poison ────────────────────────────────────────────────────────────── */
  var _poisonVial            = null;
  var _poisonPlaced          = false;
  var _poisonTimer           = 0;
  var _poisonEffect          = false;

  /* ── Explosive / IED ───────────────────────────────────────────────────── */
  var _ied                   = null;
  var _iedPlaced             = false;
  var _iedTriggerReady       = false;

  /* ── Decoy phone ───────────────────────────────────────────────────────── */
  var _decoys                = [];   // { mesh, pos, life, audioOsc, audioGain }

  /* ── Route map overlay ─────────────────────────────────────────────────── */
  var _mapActive             = false;
  var _mapElement            = null;

  /* ── Evidence dossiers ─────────────────────────────────────────────────── */
  var _dossiers              = [];   // { mesh, collected }
  var _dossiersCollected     = 0;
  var _guardTimingRevealed   = false;

  /* ── Extraction ────────────────────────────────────────────────────────── */
  var _extractionZone        = null;
  var _extractionActive      = false;

  /* ── Security camera ───────────────────────────────────────────────────── */
  var _securityCamera        = null;
  var _cameraSweepAngle      = 0;

  /* ── Vehicle (for explosive) ───────────────────────────────────────────── */
  var _targetVehicle         = null;
  var _targetBoarding        = false;

  /* ── Wind ──────────────────────────────────────────────────────────────── */
  var _windX                 = (Math.random() - 0.5) * 2;
  var _windZ                 = (Math.random() - 0.5) * 2;

  /* ── Scene groups ──────────────────────────────────────────────────────── */
  var _officeGroup           = null;
  var _conferenceGroup       = null;
  var _rooftopGroup          = null;
  var _patrolLines           = [];   // LineSegments for map

  /* ── Audio ─────────────────────────────────────────────────────────────── */
  var _audioCtx              = null;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud                   = null;

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HELPERS                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function _box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 6, 6);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _v3(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  function _pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _formatTime(sec) {
    var s = Math.max(0, Math.ceil(sec));
    return _pad2(Math.floor(s / 60)) + ':' + _pad2(s % 60);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD OFFICE (Location 1)                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildOffice() {
    _officeGroup = new THREE.Group();

    /* Building 20x12x15 */
    var building = _box(20, 12, 15, 0x778877);
    building.position.set(0, 6, 0);
    _officeGroup.add(building);

    /* Floor levels — thin platforms */
    var floor1 = _box(18, 0.3, 13, 0x556655);
    floor1.position.set(0, 0.15, 0);
    _officeGroup.add(floor1);

    var floor2 = _box(18, 0.3, 13, 0x556655);
    floor2.position.set(0, 4, 0);
    _officeGroup.add(floor2);

    var floor3 = _box(18, 0.3, 13, 0x556655);
    floor3.position.set(0, 8, 0);
    _officeGroup.add(floor3);

    /* Target desk at level 3 (y=8) */
    var desk = _box(2, 1, 1, 0x4A3A2A);
    desk.position.set(0, 8.65, 0);
    _officeGroup.add(desk);

    /* 2 guards outside door (y=0, front of building) */
    /* 2 guards inside (y=0, interior) — handled in _buildBodyguards() */

    /* Security camera CylinderGeometry at corner */
    _securityCamera = _cyl(0.1, 0.1, 0.6, 6, 0x222222);
    _securityCamera.rotation.z = Math.PI / 2;
    _securityCamera.position.set(8, 11.5, 6);
    _officeGroup.add(_securityCamera);

    /* Camera lens */
    var lens = _sphere(0.15, 0x111111);
    lens.position.set(8.4, 11.5, 6);
    _officeGroup.add(lens);

    /* Ambient light */
    var ambient = new THREE.AmbientLight(0xDDEEDD, 0.6);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFFFEE, 0.9);
    sun.position.set(30, 50, 30);
    _scene.add(sun);

    _officeGroup.position.set(0, 0, 0);
    _scene.add(_officeGroup);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD CONFERENCE ROOM (Location 2)                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildConferenceRoom() {
    _conferenceGroup = new THREE.Group();

    /* Conference room 15x4x12 */
    var room = _box(15, 4, 12, 0x556688);
    room.position.set(0, 2, 0);
    _conferenceGroup.add(room);

    /* Conference table 10x1x4 */
    var table = _box(10, 1, 4, 0x5A4A2A);
    table.position.set(0, 0.5, 0);
    _conferenceGroup.add(table);

    /* Glass wall — LineSegments on one side (exposed to sniper) */
    var glassGeo = new THREE.BufferGeometry();
    var pts = new Float32Array([
      -7.5, 0, 6,   -7.5, 4, 6,
      -7.5, 4, 6,    7.5, 4, 6,
       7.5, 4, 6,    7.5, 0, 6,
       7.5, 0, 6,   -7.5, 0, 6,
      -7.5, 1, 6,    7.5, 1, 6,
      -7.5, 2, 6,    7.5, 2, 6,
      -7.5, 3, 6,    7.5, 3, 6,
       0, 0, 6,       0, 4, 6
    ]);
    glassGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var glassMat = new THREE.LineBasicMaterial({ color: 0x88BBFF, transparent: true, opacity: 0.6 });
    var glassWall = new THREE.LineSegments(glassGeo, glassMat);
    _conferenceGroup.add(glassWall);

    _conferenceGroup.position.set(30, 0, 0);
    _conferenceGroup.visible = false;
    _scene.add(_conferenceGroup);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD ROOFTOP (Location 3)                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildRooftop() {
    _rooftopGroup = new THREE.Group();

    /* Rooftop platform 25x1x20 — open top */
    var roof = _box(25, 1, 20, 0x667766);
    roof.position.set(0, 0.5, 0);
    _rooftopGroup.add(roof);

    /* Low parapet walls */
    var pN = _box(25, 1, 0.5, 0x556655);
    pN.position.set(0, 1.25, -10);
    _rooftopGroup.add(pN);

    var pS = _box(25, 1, 0.5, 0x556655);
    pS.position.set(0, 1.25, 10);
    _rooftopGroup.add(pS);

    var pE = _box(0.5, 1, 20, 0x556655);
    pE.position.set(12.5, 1.25, 0);
    _rooftopGroup.add(pE);

    var pW = _box(0.5, 1, 20, 0x556655);
    pW.position.set(-12.5, 1.25, 0);
    _rooftopGroup.add(pW);

    _rooftopGroup.position.set(-30, 8, 0);
    _rooftopGroup.visible = false;
    _scene.add(_rooftopGroup);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD TARGET (high-value individual)                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildTarget() {
    var g = new THREE.Group();

    /* Body — CylinderGeometry 1.2x scale, suit 0x2244AA */
    var body = _cyl(0.35, 0.35, 1.7, 10, 0x2244AA);
    body.scale.set(1.2, 1.2, 1.2);
    body.position.y = 1.02;
    g.add(body);

    /* Head */
    var head = _sphere(0.28, 0xD4A56A);
    head.scale.set(1.2, 1.2, 1.2);
    head.position.y = 2.5;
    g.add(head);

    /* Tie detail */
    var tie = _box(0.08, 0.5, 0.05, 0xFF2200);
    tie.position.set(0, 1.7, 0.42);
    g.add(tie);

    /* Briefcase */
    var briefcase = _box(0.5, 0.4, 0.15, 0x3A2A1A);
    briefcase.position.set(0.55, 1.0, 0);
    g.add(briefcase);

    var locPos = _locationPositions[_currentLocation];
    g.position.set(locPos.x, locPos.y, locPos.z);
    _scene.add(g);
    _target = g;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD BODYGUARDS                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildBodyguard(x, y, z, patrolAngle) {
    var g = new THREE.Group();

    /* Body — BoxGeometry 0x334455 */
    var body = _box(0.6, 1.6, 0.4, 0x334455);
    body.position.y = 0.8;
    g.add(body);

    /* Head */
    var head = _sphere(0.25, 0xC08060);
    head.position.y = 1.85;
    g.add(head);

    /* Earpiece */
    var earpiece = _sphere(0.06, 0x111111);
    earpiece.position.set(0.25, 1.85, 0);
    g.add(earpiece);

    /* Weapon */
    var weapon = _box(0.08, 0.08, 0.7, 0x222222);
    weapon.position.set(0.35, 1.1, 0.35);
    g.add(weapon);

    g.position.set(x, y, z);
    _scene.add(g);
    return {
      mesh:             g,
      hp:               120,
      alive:            true,
      alertLevel:       0,
      patrolAngle:      patrolAngle || 0,
      patrolRadius:     2.5,
      patrolSpeed:      0.4,
      startX:           x,
      startY:           y,
      startZ:           z,
      decoyDistracted:  false,
      decoyTimer:       0,
      fireTimer:        1 + Math.random() * 2,
      thermalScope:     false
    };
  }

  function _buildBodyguards() {
    var locPos = _locationPositions[_currentLocation];

    /* 6 bodyguards surrounding target */
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var r     = 3;
      var bx    = locPos.x + Math.cos(angle) * r;
      var bz    = locPos.z + Math.sin(angle) * r;
      var bg    = _buildBodyguard(bx, locPos.y, bz, angle);
      if (_currentLocation === LOCATION_ROOFTOP) {
        bg.thermalScope = true;
      }
      _bodyguards.push(bg);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD EVIDENCE DOSSIERS                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildDossiers() {
    var positions = [
      { x: 5,  y: 0.2, z: 5  },
      { x: -5, y: 0.2, z: 3  },
      { x: 2,  y: 0.2, z: -4 }
    ];
    for (var i = 0; i < 3; i++) {
      var d = _box(0.5, 0.08, 0.35, 0xFFFFAA);
      d.position.set(positions[i].x, positions[i].y, positions[i].z);
      _scene.add(d);
      _dossiers.push({ mesh: d, collected: false });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD EXTRACTION ZONE                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildExtractionZone() {
    _extractionZone = _box(3, 0.2, 3, 0x00FF44);
    _extractionZone.position.set(15, 0.1, 15);
    _extractionZone.visible = false;
    _scene.add(_extractionZone);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD TARGET VEHICLE (for explosive method)                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildTargetVehicle() {
    var g = new THREE.Group();

    var body = _box(2.4, 1.2, 4.5, 0x1A1A2A);
    body.position.y = 0.6;
    g.add(body);

    var roof = _box(2.0, 0.7, 2.5, 0x1A1A2A);
    roof.position.set(0, 1.55, -0.2);
    g.add(roof);

    var wPos = [[-1.3, 0, 1.6], [1.3, 0, 1.6], [-1.3, 0, -1.6], [1.3, 0, -1.6]];
    for (var i = 0; i < 4; i++) {
      var wheel = _cyl(0.4, 0.4, 0.3, 8, 0x111111);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wPos[i][0], wPos[i][1], wPos[i][2]);
      g.add(wheel);
    }

    g.position.set(-5, 0, 8);
    _scene.add(g);
    _targetVehicle = g;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD PLAYER                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPlayer() {
    var g = new THREE.Group();

    var body = _box(0.6, 1.6, 0.4, 0x223322);
    body.position.y = 0.8;
    g.add(body);

    var head = _sphere(0.25, 0xD4A56A);
    head.position.y = 1.85;
    g.add(head);

    /* Rifle */
    var rifle = _box(0.08, 0.08, 1.1, 0x222222);
    rifle.position.set(0.35, 1.1, 0.55);
    g.add(rifle);

    g.position.set(10, 0, 12);
    _scene.add(g);
    _player    = g;
    _playerPos = g.position;

    _camera.position.set(10, 4, 18);
    _camera.lookAt(10, 1, 12);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HUD                                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'as-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#CCDDFF',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #2244AA',
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

    var locName    = _locationNames[_currentLocation];
    var guardsLeft = 0;
    for (var i = 0; i < _bodyguards.length; i++) {
      if (_bodyguards[i].alive) guardsLeft++;
    }
    var timeToMove = _formatTime(_locationTimer);
    var method     = _methodNames[_currentMethod];
    var cleanStr   = _cleanKill
      ? '<span style="color:#44FF44">YES</span>'
      : '<span style="color:#FF4444">NO</span>';

    var extra = '';
    if (_targetKilled && !_extractionSuccess) {
      extra = ' | <span style="color:#FF8844">EXTRACT NOW — ' + _formatTime(_policeArrivalTimer) + '</span>';
    }
    if (_sniperScopeActive && _currentMethod === METHOD_SNIPER) {
      var pct = Math.min(100, Math.floor((_sniperAimTimer / _sniperCleanThreshold) * 100));
      extra += ' | AIM: ' + pct + '%';
    }

    _hud.innerHTML =
      'MISSION [TARGET: ' + locName + '] ' +
      '[GUARDS: ' + guardsLeft + '] ' +
      '[TIME TO MOVE: ' + timeToMove + '] ' +
      '[METHOD: ' + method + '] | CLEAN: ' + cleanStr +
      extra;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MAP OVERLAY                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildMapOverlay() {
    _mapElement = document.createElement('div');
    _mapElement.id = 'as-map';
    _mapElement.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,10,20,0.92)',
      'color:#88AACC',
      'font-family:monospace',
      'font-size:12px',
      'padding:20px',
      'border:2px solid #2244AA',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:10000',
      'width:300px',
      'height:300px'
    ].join(';');
    _mapElement.innerHTML = '<div style="color:#CCDDFF;font-size:14px;margin-bottom:8px">TACTICAL MAP — ' + _locationNames[_currentLocation] + '</div>' +
      '<canvas id="as-map-canvas" width="260" height="240" style="border:1px solid #334466;display:block;margin:0 auto"></canvas>';
    document.body.appendChild(_mapElement);
    _drawMap();
  }

  function _drawMap() {
    if (!_mapElement) return;
    var canvas = document.getElementById('as-map-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#001020';
    ctx.fillRect(0, 0, 260, 240);

    /* Scale world coords to map: center=130,120 scale=6 */
    var cx = 130;
    var cy = 120;
    var scale = 6;

    function worldToMap(wx, wz) {
      return { mx: cx + wx * scale, my: cy + wz * scale };
    }

    /* Target pulsing dot */
    if (_target) {
      var tp = worldToMap(_target.position.x - _locationPositions[_currentLocation].x,
                          _target.position.z - _locationPositions[_currentLocation].z);
      var pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
      ctx.fillStyle = 'rgba(255,' + Math.floor(68 + pulse * 60) + ',0,1)';
      ctx.beginPath();
      ctx.arc(tp.mx, tp.my, 5 + pulse * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF4400';
      ctx.fillRect(tp.mx - 3, tp.my - 3, 6, 6);
    }

    /* Guard patrol paths */
    ctx.strokeStyle = '#334466';
    ctx.lineWidth   = 1;
    for (var i = 0; i < _bodyguards.length; i++) {
      var bg = _bodyguards[i];
      if (!bg.alive) continue;
      var lx = bg.startX - _locationPositions[_currentLocation].x;
      var lz = bg.startZ - _locationPositions[_currentLocation].z;
      var mp = worldToMap(lx, lz);
      /* Draw patrol circle */
      ctx.beginPath();
      ctx.arc(mp.mx, mp.my, bg.patrolRadius * scale, 0, Math.PI * 2);
      ctx.stroke();
      /* Guard position */
      var bpos = worldToMap(bg.mesh.position.x - _locationPositions[_currentLocation].x,
                            bg.mesh.position.z - _locationPositions[_currentLocation].z);
      ctx.fillStyle = bg.decoyDistracted ? '#888800' : '#334488';
      ctx.fillRect(bpos.mx - 3, bpos.my - 3, 6, 6);
    }

    /* Player */
    if (_player) {
      var pp = worldToMap(_player.position.x - _locationPositions[_currentLocation].x,
                          _player.position.z - _locationPositions[_currentLocation].z);
      ctx.fillStyle = '#00FF88';
      ctx.beginPath();
      ctx.arc(pp.mx, pp.my, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Legend */
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(10, 210, 10, 10);
    ctx.fillStyle = '#88AACC';
    ctx.fillText('TARGET', 25, 220);
    ctx.fillStyle = '#334488';
    ctx.fillRect(80, 210, 10, 10);
    ctx.fillText('GUARD', 95, 220);
    ctx.fillStyle = '#00FF88';
    ctx.beginPath();
    ctx.arc(145, 215, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#88AACC';
    ctx.fillText('YOU', 155, 220);
  }

  function _removeMapOverlay() {
    if (_mapElement && _mapElement.parentNode) {
      _mapElement.parentNode.removeChild(_mapElement);
      _mapElement = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  AUDIO HELPERS                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* no audio */ }
    }
    return _audioCtx;
  }

  function _playDecoyRing() {
    var ctx = _getAudioCtx();
    if (!ctx) return null;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 2000;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      return { osc: osc, gain: gain };
    } catch (e) { return null; }
  }

  function _stopAudio(node) {
    if (!node) return;
    try { node.osc.stop(); } catch (e) {}
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  LOCATION TRANSITION                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _moveTargetToLocation(loc) {
    _currentLocation = loc;
    var locPos = _locationPositions[loc];

    if (_target) {
      _target.position.set(locPos.x, locPos.y, locPos.z);
    }

    /* Reposition bodyguards */
    for (var i = 0; i < _bodyguards.length; i++) {
      if (!_bodyguards[i].alive) continue;
      var angle = (i / 6) * Math.PI * 2;
      var r = 3;
      var bx = locPos.x + Math.cos(angle) * r;
      var bz = locPos.z + Math.sin(angle) * r;
      _bodyguards[i].mesh.position.set(bx, locPos.y, bz);
      _bodyguards[i].startX = bx;
      _bodyguards[i].startY = locPos.y;
      _bodyguards[i].startZ = bz;
      _bodyguards[i].thermalScope = (loc === LOCATION_ROOFTOP);
    }

    /* Show/hide location groups */
    if (_officeGroup)     _officeGroup.visible     = (loc === LOCATION_OFFICE);
    if (_conferenceGroup) _conferenceGroup.visible  = (loc === LOCATION_CONFERENCE);
    if (_rooftopGroup)    _rooftopGroup.visible     = (loc === LOCATION_ROOFTOP);

    /* Conference window 60s between meetings */
    if (loc === LOCATION_CONFERENCE) {
      _conferenceWindow      = true;
      _conferenceWindowTimer = 60;
    } else {
      _conferenceWindow = false;
    }

    _locationTimer = 240;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  SNIPER                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _fireSniper() {
    if (!_scene || !_camera) return;
    var b = _sphere(0.08, 0xFFEECC);
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);

    /* Wind & drop on rooftop */
    var windFactor = (_currentLocation === LOCATION_ROOFTOP) ? 2.0 : 1.0;
    var windVel = new THREE.Vector3(_windX * windFactor * 0.3, 0, _windZ * windFactor * 0.3);

    b.position.copy(_camera.position).addScaledVector(dir, 2);
    _scene.add(b);
    _sniperBullets.push({
      mesh:     b,
      vel:      dir.clone().multiplyScalar(60).add(windVel),
      life:     4,
      windDrop: windFactor * 0.1
    });
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  POISON                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _placePoison() {
    if (_poisonPlaced) return;
    /* Place vial near target's position (bar/drink location) */
    _poisonVial = _box(0.12, 0.25, 0.12, 0x44FF44);
    var locPos = _locationPositions[_currentLocation];
    _poisonVial.position.set(locPos.x + 1.5, locPos.y + 0.5, locPos.z + 0.5);
    _scene.add(_poisonVial);
    _poisonPlaced = true;
    _poisonTimer  = 60; /* 60s effect */
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  EXPLOSIVE                                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _placeIED() {
    if (_iedPlaced) return;
    _ied = _box(0.35, 0.2, 0.35, 0xFF2200);
    if (_targetVehicle) {
      _ied.position.copy(_targetVehicle.position);
      _ied.position.y += 0.4;
    } else {
      var locPos = _locationPositions[_currentLocation];
      _ied.position.set(locPos.x - 5, 0.2, locPos.z + 8);
    }
    _scene.add(_ied);
    _iedPlaced      = true;
    _iedTriggerReady = false;

    /* IED arms when target would board vehicle (within 10s) */
    _iedTriggerReady = true;
  }

  function _triggerIED() {
    if (!_iedPlaced || !_iedTriggerReady) return;
    /* Explosion flash */
    var flash = _sphere(2, 0xFF4400);
    if (_ied) {
      flash.position.copy(_ied.position);
    }
    _scene.add(flash);

    /* Check if target is near explosion */
    if (_target && _ied) {
      var d = _dist(_target.position, _ied.position);
      if (d < 5) {
        _targetHP -= 300;
        if (_targetHP <= 0 && _targetAlive) {
          _killTarget('EXPLOSIVE');
        }
      }
    }

    /* Remove IED */
    if (_ied && _scene) {
      _scene.remove(_ied);
      _ied = null;
    }
    _iedPlaced = false;

    /* Remove flash after brief delay */
    setTimeout(function () {
      if (_scene) _scene.remove(flash);
    }, 500);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MELEE                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryMeleeKill() {
    if (!_target || !_targetAlive) return;
    var d = _dist(_playerPos, _target.position);
    if (d <= 1.2 && !_playerDetected) {
      _killTarget('MELEE');
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  KILL TARGET                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _killTarget(method) {
    if (!_targetAlive) return;
    _targetAlive    = false;
    _targetKilled   = true;
    _targetKilledTime = _gameTime;

    if (_target) {
      _target.visible = false;
    }

    /* Method bonus */
    var methodBonus = 0;
    if (method === 'SNIPER')    methodBonus = 600;
    if (method === 'POISON')    methodBonus = 800;   // most elegant
    if (method === 'EXPLOSIVE') methodBonus = 400;
    if (method === 'MELEE')     methodBonus = 700;

    _score += methodBonus;
    _methodBonusAwarded = true;

    /* Activate extraction */
    _extractionActive = true;
    if (_extractionZone) _extractionZone.visible = true;

    /* Police arrive countdown already ticking in update */
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  DECOY PHONE                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _throwDecoy() {
    /* Phone — CylinderGeometry style BoxGeometry 0x444444 */
    var phone = _box(0.1, 0.05, 0.2, 0x444444);
    var dir   = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);

    var startPos = _playerPos.clone().add(new THREE.Vector3(0, 1, 0));
    phone.position.copy(startPos).addScaledVector(dir, 3);
    phone.position.y = 0.1;
    _scene.add(phone);

    /* Audio ring at 2000 Hz */
    var audio = _playDecoyRing();

    _decoys.push({
      mesh:  phone,
      pos:   phone.position.clone(),
      life:  15,
      audio: audio
    });

    /* Distract nearest 2 alive guards */
    var sortedGuards = [];
    for (var i = 0; i < _bodyguards.length; i++) {
      if (!_bodyguards[i].alive) continue;
      var d = _dist(_bodyguards[i].mesh.position, phone.position);
      sortedGuards.push({ guard: _bodyguards[i], dist: d });
    }
    sortedGuards.sort(function (a, b) { return a.dist - b.dist; });
    for (var j = 0; j < Math.min(2, sortedGuards.length); j++) {
      sortedGuards[j].guard.decoyDistracted = true;
      sortedGuards[j].guard.decoyTimer      = 15;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ALARM                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _triggerAlarm() {
    if (_alarmTriggered) return;
    _alarmTriggered = true;
    _cleanKill = false;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PLAYER MOVEMENT                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _movePlayer(dt) {
    if (!_player || !_playerPos) return;

    var speed = 5;
    var dx    = 0;
    var dz    = 0;

    if (_keys['w'] || _keys['W'] || _keys['ArrowUp'])    dz -= speed * dt;
    if (_keys['s'] || _keys['S'] || _keys['ArrowDown'])  dz += speed * dt;
    if (_keys['a'] || _keys['A'] || _keys['ArrowLeft'])  dx -= speed * dt;
    if (_keys['d'] || _keys['D'] || _keys['ArrowRight']) dx += speed * dt;

    /* Apply yaw rotation to movement */
    var cos = Math.cos(_yaw);
    var sin = Math.sin(_yaw);
    var wx  = cos * dx - sin * dz;
    var wz  = sin * dx + cos * dz;

    _playerPos.x += wx;
    _playerPos.z += wz;

    /* Camera follow */
    _camera.position.x = _playerPos.x - Math.sin(_yaw) * 6;
    _camera.position.y = _playerPos.y + 4 + Math.sin(_pitch) * 4;
    _camera.position.z = _playerPos.z - Math.cos(_yaw) * (-6);
    _camera.lookAt(_playerPos.x, _playerPos.y + 1.5, _playerPos.z);

    /* Player facing */
    _player.rotation.y = _yaw;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  GUARD AI                                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateGuards(dt) {
    for (var i = 0; i < _bodyguards.length; i++) {
      var bg = _bodyguards[i];
      if (!bg.alive) continue;

      /* Decoy distraction */
      if (bg.decoyDistracted) {
        bg.decoyTimer -= dt;
        if (bg.decoyTimer <= 0) {
          bg.decoyDistracted = false;
          bg.decoyTimer      = 0;
        }
        /* Move toward nearest decoy */
        if (_decoys.length > 0) {
          var nearDecoy = _decoys[0];
          var ddx = nearDecoy.pos.x - bg.mesh.position.x;
          var ddz = nearDecoy.pos.z - bg.mesh.position.z;
          var ddn = Math.sqrt(ddx * ddx + ddz * ddz);
          if (ddn > 0.5) {
            bg.mesh.position.x += (ddx / ddn) * 2 * dt;
            bg.mesh.position.z += (ddz / ddn) * 2 * dt;
          }
        }
        continue;
      }

      /* Patrol orbit around target */
      bg.patrolAngle += bg.patrolSpeed * dt;
      var locPos = _locationPositions[_currentLocation];
      bg.mesh.position.x = locPos.x + Math.cos(bg.patrolAngle) * bg.patrolRadius;
      bg.mesh.position.z = locPos.z + Math.sin(bg.patrolAngle) * bg.patrolRadius;
      bg.mesh.position.y = locPos.y;

      /* Face patrol direction */
      bg.mesh.rotation.y = -bg.patrolAngle + Math.PI / 2;

      /* Detect player */
      if (_player && _playerPos) {
        var dp = _dist(bg.mesh.position, _playerPos);
        var detRange = bg.thermalScope ? 25 : 12;
        if (dp < detRange) {
          bg.alertLevel += dt * (bg.thermalScope ? 40 : 20);
          if (bg.alertLevel > 100 && !_playerDetected) {
            _playerDetected = true;
            _triggerAlarm();
          }
        } else {
          bg.alertLevel = Math.max(0, bg.alertLevel - dt * 10);
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  SECURITY CAMERA                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateCamera(dt) {
    if (!_securityCamera) return;
    /* Sweep 45 degrees left/right */
    _cameraSweepAngle += dt * 0.5;
    _securityCamera.rotation.y = Math.sin(_cameraSweepAngle) * (Math.PI / 4);

    /* Check if player is in camera cone */
    if (_player && _currentLocation === LOCATION_OFFICE) {
      var dp = _dist(_securityCamera.position, _playerPos);
      if (dp < 10) {
        _triggerAlarm();
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  SNIPER BULLET UPDATE                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateSniperBullets(dt) {
    for (var i = _sniperBullets.length - 1; i >= 0; i--) {
      var b = _sniperBullets[i];
      b.life -= dt;

      /* Gravity / wind drop */
      b.vel.y -= 9.8 * b.windDrop * dt;

      b.mesh.position.addScaledVector(b.vel, dt);

      /* Check target hit */
      if (_target && _targetAlive) {
        var dTarget = _dist(b.mesh.position, _target.position);
        if (dTarget < 1.5) {
          var dmg = (_sniperAimTimer >= _sniperCleanThreshold) ? 300 : 150;
          _targetHP -= dmg;
          if (_targetHP <= 0) {
            _killTarget('SNIPER');
          }
          if (_scene) _scene.remove(b.mesh);
          _sniperBullets.splice(i, 1);
          continue;
        }
      }

      /* Check guard hit */
      for (var j = 0; j < _bodyguards.length; j++) {
        if (!_bodyguards[j].alive) continue;
        var dg = _dist(b.mesh.position, _bodyguards[j].mesh.position);
        if (dg < 1.2) {
          _bodyguards[j].hp -= 120;
          if (_bodyguards[j].hp <= 0) {
            _bodyguards[j].alive = false;
            _bodyguards[j].mesh.visible = false;
            _triggerAlarm();
            _cleanKill = false;
          }
          if (_scene) _scene.remove(b.mesh);
          _sniperBullets.splice(i, 1);
          break;
        }
      }

      if (b.life <= 0) {
        if (_scene) _scene.remove(b.mesh);
        _sniperBullets.splice(i, 1);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  DECOY UPDATE                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateDecoys(dt) {
    for (var i = _decoys.length - 1; i >= 0; i--) {
      var d = _decoys[i];
      d.life -= dt;
      if (d.life <= 0) {
        if (d.audio) _stopAudio(d.audio);
        if (_scene)  _scene.remove(d.mesh);
        _decoys.splice(i, 1);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  POISON UPDATE                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updatePoison(dt) {
    if (!_poisonPlaced || _poisonEffect) return;

    /* Check if target is near vial */
    if (_target && _poisonVial) {
      var dp = _dist(_target.position, _poisonVial.position);
      if (dp < 2) {
        _poisonEffect = true;
      }
    }

    if (_poisonEffect) {
      _poisonTimer -= dt;
      if (_poisonTimer <= 0) {
        /* Poison kills target */
        _targetHP = 0;
        _killTarget('POISON');
        if (_poisonVial && _scene) {
          _scene.remove(_poisonVial);
          _poisonVial = null;
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  DOSSIER PICKUP                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateDossiers() {
    if (!_playerPos) return;
    for (var i = 0; i < _dossiers.length; i++) {
      if (_dossiers[i].collected) continue;
      var dd = _dist(_playerPos, _dossiers[i].mesh.position);
      if (dd < 1.5) {
        _dossiers[i].collected = true;
        _dossiers[i].mesh.visible = false;
        _dossiersCollected++;
        _score += 100;
        if (_dossiersCollected >= 3) {
          _guardTimingRevealed = true;
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  EXTRACTION                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkExtraction() {
    if (!_extractionActive || !_playerPos || !_extractionZone) return;
    var de = _dist(_playerPos, _extractionZone.position);
    if (de < 3) {
      _extractionSuccess = true;
      _score += 500;  /* escape before police bonus */

      /* Clean kill bonus */
      if (_cleanKill) {
        _score += 1000;
      }

      _endMission(true);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MISSION END                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _endMission(success) {
    _missionEnd = true;

    var msg  = success ? 'MISSION COMPLETE' : 'MISSION FAILED';
    var col  = success ? '#44FF44' : '#FF4444';

    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:' + col,
      'font-family:monospace',
      'font-size:22px',
      'padding:30px 50px',
      'border:2px solid ' + col,
      'border-radius:8px',
      'z-index:11000',
      'text-align:center'
    ].join(';');

    var bonuses = '';
    if (_cleanKill)          bonuses += '<br><span style="color:#AAFFAA">CLEAN KILL +1000</span>';
    if (_extractionSuccess)  bonuses += '<br><span style="color:#AAFFAA">EXTRACTION +500</span>';
    if (_methodBonusAwarded) bonuses += '<br><span style="color:#AAFFAA">METHOD BONUS applied</span>';
    if (_dossiersCollected > 0) bonuses += '<br><span style="color:#FFFFAA">INTEL x' + _dossiersCollected + ' +' + (_dossiersCollected * 100) + '</span>';

    overlay.innerHTML = msg + '<br><span style="font-size:16px;color:#CCDDFF">SCORE: ' + _score + bonuses + '</span>';
    document.body.appendChild(overlay);

    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 6000);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MAIN UPDATE                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _update(dt) {
    if (!_active) return;
    if (_missionEnd) return;

    _gameTime += dt;

    /* Location timer */
    _locationTimer -= dt;
    if (_locationTimer <= 0) {
      var nextLoc = (_currentLocation + 1) % 3;
      _moveTargetToLocation(nextLoc);
    }

    /* Conference window countdown */
    if (_conferenceWindow) {
      _conferenceWindowTimer -= dt;
      if (_conferenceWindowTimer <= 0) {
        _conferenceWindow = false;
      }
    }

    /* Police arrival after kill */
    if (_targetKilled && !_extractionSuccess) {
      _policeArrivalTimer -= dt;
      if (_policeArrivalTimer <= 0) {
        _policeSurrounded = true;
        _score -= 200; /* Penalty for every minute over */
        /* Game over — failed to escape */
        if (_policeArrivalTimer < -60) {
          _endMission(false);
          return;
        }
      }
    }

    /* Sniper aim accumulation */
    if (_rightMouseDown && _currentMethod === METHOD_SNIPER) {
      _sniperAimTimer += dt;
      _sniperScopeActive = true;
    } else {
      _sniperAimTimer    = Math.max(0, _sniperAimTimer - dt * 2);
      _sniperScopeActive = false;
    }

    _movePlayer(dt);
    _updateGuards(dt);
    _updateCamera(dt);
    _updateSniperBullets(dt);
    _updateDecoys(dt);
    _updatePoison(dt);
    _updateDossiers();

    /* Extraction zone pulse */
    if (_extractionZone && _extractionActive) {
      var pulse = 0.7 + 0.3 * Math.sin(_gameTime * 4);
      _extractionZone.material.opacity = pulse;
      _extractionZone.material.transparent = true;
    }

    _checkExtraction();

    /* Security camera sweep */
    _cameraSweepAngle += dt * 0.5;
    if (_securityCamera) {
      _securityCamera.rotation.y = Math.sin(_cameraSweepAngle) * (Math.PI / 4);
    }

    /* Map redraw if open */
    if (_mapActive && _mapElement) {
      _drawMap();
    }

    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ACTIVATION                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _activate() {
    if (_active) return;
    _active = true;

    _buildOffice();
    _buildConferenceRoom();
    _buildRooftop();
    _buildTarget();
    _buildBodyguards();
    _buildDossiers();
    _buildExtractionZone();
    _buildTargetVehicle();
    _buildPlayer();
    _buildHUD();

    /* Start on office */
    _officeGroup.visible     = true;
    _conferenceGroup.visible = false;
    _rooftopGroup.visible    = false;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INPUT HANDLERS                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    _keys[e.key] = true;

    /* Activation: A + N within 400ms */
    if (e.key === 'a' || e.key === 'A') {
      _aPressTime = Date.now();
    }
    if (e.key === 'n' || e.key === 'N') {
      _nPressTime = Date.now();
    }
    if ((e.key === 'a' || e.key === 'A') || (e.key === 'n' || e.key === 'N')) {
      if (_aPressTime > 0 && _nPressTime > 0) {
        if (Math.abs(_aPressTime - _nPressTime) <= 400) {
          _activate();
          _aPressTime = 0;
          _nPressTime = 0;
        }
      }
    }

    if (!_active) return;

    /* F — throw decoy phone */
    if (e.key === 'f' || e.key === 'F') {
      _throwDecoy();
    }

    /* M — toggle map */
    if (e.key === 'm' || e.key === 'M') {
      _mapActive = !_mapActive;
      if (_mapActive) {
        _buildMapOverlay();
      } else {
        _removeMapOverlay();
      }
    }

    /* Tab — cycle method */
    if (e.key === 'Tab') {
      e.preventDefault();
      _currentMethod = (_currentMethod + 1) % 4;
    }

    /* E — melee kill */
    if (e.key === 'e' || e.key === 'E') {
      if (_currentMethod === METHOD_MELEE) {
        _tryMeleeKill();
      } else {
        /* Interact: collect dossiers, place poison/IED */
        if (_currentMethod === METHOD_POISON) {
          _placePoison();
        }
        if (_currentMethod === METHOD_EXPLOSIVE) {
          if (!_iedPlaced) {
            _placeIED();
          } else if (_iedTriggerReady) {
            _triggerIED();
          }
        }
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    var movX = e.movementX || 0;
    var movY = e.movementY || 0;
    _yaw   -= movX * 0.002;
    _pitch -= movY * 0.002;
    _pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _pitch));
  }

  function _onMouseDown(e) {
    if (!_active) return;

    /* Right mouse — sniper aim hold */
    if (e.button === 2) {
      _rightMouseDown = true;
    }

    /* Left mouse — fire / use method */
    if (e.button === 0) {
      if (_currentMethod === METHOD_SNIPER) {
        _fireSniper();
      } else if (_currentMethod === METHOD_EXPLOSIVE && _iedPlaced && _iedTriggerReady) {
        _triggerIED();
      }
    }
  }

  function _onMouseUp(e) {
    if (e.button === 2) {
      _rightMouseDown = false;
    }
  }

  function _onContextMenu(e) {
    e.preventDefault();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  RESET                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _reset() {
    _active              = false;
    _aPressTime          = 0;
    _nPressTime          = 0;
    _keys                = {};
    _score               = 0;
    _missionEnd          = false;
    _gameTime            = 0;
    _cleanKill           = true;
    _alarmTriggered      = false;
    _policeArrivalTimer  = 180;
    _policeSurrounded    = false;
    _extractionSuccess   = false;
    _methodBonusAwarded  = false;
    _currentLocation     = LOCATION_OFFICE;
    _locationTimer       = 240;
    _conferenceWindow    = false;
    _conferenceWindowTimer = 0;
    _targetHP            = 300;
    _targetAlive         = true;
    _targetKilled        = false;
    _targetKilledTime    = 0;
    _playerHP            = 100;
    _playerDetected      = false;
    _detectionLevel      = 0;
    _currentMethod       = METHOD_SNIPER;
    _sniperScopeActive   = false;
    _sniperAimTimer      = 0;
    _rightMouseDown      = false;
    _poisonPlaced        = false;
    _poisonTimer         = 0;
    _poisonEffect        = false;
    _iedPlaced           = false;
    _iedTriggerReady     = false;
    _mapActive           = false;
    _dossiersCollected   = 0;
    _guardTimingRevealed = false;
    _extractionActive    = false;
    _windX               = (Math.random() - 0.5) * 2;
    _windZ               = (Math.random() - 0.5) * 2;
    _cameraSweepAngle    = 0;
    _mouseX              = 0;
    _mouseY              = 0;
    _yaw                 = 0;
    _pitch               = 0;
    _targetBoarding      = false;

    /* Remove scene objects */
    if (_officeGroup     && _scene) _scene.remove(_officeGroup);
    if (_conferenceGroup && _scene) _scene.remove(_conferenceGroup);
    if (_rooftopGroup    && _scene) _scene.remove(_rooftopGroup);
    if (_target          && _scene) _scene.remove(_target);
    if (_player          && _scene) _scene.remove(_player);
    if (_extractionZone  && _scene) _scene.remove(_extractionZone);
    if (_targetVehicle   && _scene) _scene.remove(_targetVehicle);
    if (_poisonVial      && _scene) _scene.remove(_poisonVial);
    if (_ied             && _scene) _scene.remove(_ied);

    for (var i = 0; i < _bodyguards.length; i++) {
      if (_bodyguards[i].mesh && _scene) _scene.remove(_bodyguards[i].mesh);
    }
    for (var j = 0; j < _dossiers.length; j++) {
      if (_dossiers[j].mesh && _scene) _scene.remove(_dossiers[j].mesh);
    }
    for (var k = 0; k < _sniperBullets.length; k++) {
      if (_sniperBullets[k].mesh && _scene) _scene.remove(_sniperBullets[k].mesh);
    }
    for (var m = 0; m < _decoys.length; m++) {
      if (_decoys[m].audio) _stopAudio(_decoys[m].audio);
      if (_decoys[m].mesh && _scene) _scene.remove(_decoys[m].mesh);
    }
    for (var n = 0; n < _patrolLines.length; n++) {
      if (_patrolLines[n] && _scene) _scene.remove(_patrolLines[n]);
    }

    _officeGroup      = null;
    _conferenceGroup  = null;
    _rooftopGroup     = null;
    _target           = null;
    _player           = null;
    _playerPos        = null;
    _extractionZone   = null;
    _targetVehicle    = null;
    _poisonVial       = null;
    _ied              = null;
    _securityCamera   = null;
    _mapElement       = null;
    _bodyguards       = [];
    _dossiers         = [];
    _sniperBullets    = [];
    _decoys           = [];
    _patrolLines      = [];

    if (_audioCtx) {
      try { _audioCtx.close(); } catch (e) {}
      _audioCtx = null;
    }

    _removeHUD();
    _removeMapOverlay();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PUBLIC API                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown',     _onKeyDown);
    document.addEventListener('keyup',       _onKeyUp);
    document.addEventListener('mousemove',   _onMouseMove);
    document.addEventListener('mousedown',   _onMouseDown);
    document.addEventListener('mouseup',     _onMouseUp);
    document.addEventListener('contextmenu', _onContextMenu);
  }

  function update(dt) {
    _update(dt);
  }

  function reset() {
    _reset();
  }

  return { init: init, update: update, reset: reset };

}());
