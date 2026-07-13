/* ───────────────────────────────────────────────────────────────────────────
   nuclear-submarine.js — Nuclear Submarine Mini-Game
   API: window.NuclearSubmarine = { init, update, reset }
   Controls:
     N + S (together, within 400ms) → activate nuclear submarine
     W / S               → drive forward / back
     A / D               → turn left / right
     Q / E               → dive / surface
     P (hold)            → periscope view (scope rises)
     1-4                 → select torpedo tube type
     SPACE               → fire selected torpedo
     E (at scrubber)     → reset O2 supply
   ─────────────────────────────────────────────────────────────────────────── */
window.NuclearSubmarine = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key tracking (N+S within 400ms) ───────────────────────── */
  var _nsPressTime = { N: 0, S: 0 };
  var NS_WINDOW    = 400; // ms

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _missionComplete = false;
  var _crisisMode      = false;  // nuclear launch order received
  var _crisisChoice    = false;  // player has made crisis choice
  var _crisisRefused   = false;  // true = refused nuclear launch (success)
  var _failState       = false;  // launched nuke = fail

  /* ── Player / sub state ────────────────────────────────────────────────── */
  var _playerYaw    = 0;
  var _playerDepth  = -10;
  var _playerVelX   = 0;
  var _playerVelZ   = 0;
  var _hullIntegrity = 100;   // %
  var _oxygen        = 480;   // seconds (8 minutes)
  var _maxOxygen     = 480;
  var _morale        = 100;   // %
  var _targetsDestroyed = 0;
  var _inOptimalDepth   = false; // -50 to -80m

  /* ── Periscope ─────────────────────────────────────────────────────────── */
  var _periscopeActive = false;
  var _periscopeRise   = 0;   // 0..1 animation progress
  var _savedCamPos     = null;
  var _savedCamLook    = null;

  /* ── Torpedo system ────────────────────────────────────────────────────── */
  // Tube types: 0=MK48(direct), 1=ADCAP(homing), 2=Decoy, 3=Nuclear(crisis only)
  var _selectedTube    = 0;
  var _tubes = [
    { type: 'MK48',    loaded: true, reloadTimer: 0 },
    { type: 'ADCAP',   loaded: true, reloadTimer: 0 },
    { type: 'Decoy',   loaded: true, reloadTimer: 0 },
    { type: 'Nuclear', loaded: false, reloadTimer: 0 }
  ];
  var _torpedoes       = [];  // { mesh, type, target, vel, life, homing }
  var _RELOAD_TIME     = 20;  // seconds

  /* ── Sonar officer NPC ─────────────────────────────────────────────────── */
  var _sonarOfficer    = null;
  var _sonarTimer      = 0;
  var _sonarContact    = '';   // current reported contact string
  var _sonarContactTimer = 0;  // how long to show contact
  var _falseContactActive = false;
  var _sonarOfficerFacing = false; // low morale: NPC turns toward player

  /* ── Enemy ships (surface targets) ────────────────────────────────────── */
  // 3 enemies: Destroyer, Carrier, Submarine
  // Destroyer: drops depth charges when sub known
  // Carrier: requires ADCAP
  // Enemy sub: requires MK48
  var _enemies = [];  // { mesh, hull, type, alive, silhouette, sonarLock, depthCharges, dcTimer }
  var _enemyKnown = false;  // destroyer knows player position

  /* ── Depth charges ─────────────────────────────────────────────────────── */
  var _depthCharges = [];  // { mesh, targetDepth, fuse, exploded }

  /* ── Decoy state ────────────────────────────────────────────────────────── */
  var _decoyActive  = false;
  var _decoyTimer   = 0;
  var _decoyMesh    = null;

  /* ── ICBM (crisis / fail state) ────────────────────────────────────────── */
  var _icbmMesh     = null;
  var _icbmLaunched = false;

  /* ── Sub interior geometry groups ───────────────────────────────────────── */
  var _interiorGroup   = null;   // all interior meshes
  var _periscopeMesh   = null;   // conning area periscope
  var _reactorLight    = null;   // reactor room PointLight

  /* ── Explosions ─────────────────────────────────────────────────────────── */
  var _explosions = [];  // { mesh, light, life }

  /* ── Scene save/restore ─────────────────────────────────────────────────── */
  var _savedBackground = null;
  var _savedFog        = null;

  /* ── Input ───────────────────────────────────────────────────────────────── */
  var _keys     = {};
  var _keysPrev = {};

  /* ── HUD elements ───────────────────────────────────────────────────────── */
  var _hud         = null;
  var _messageEl   = null;
  var _crisisEl    = null;

  /* ── Timing ──────────────────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildInterior() {
    var group = new THREE.Group();

    /* Control room 12x3x8 */
    var ctrlGeo = new THREE.BoxGeometry(12, 3, 8);
    var ctrlMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var ctrlMesh = new THREE.Mesh(ctrlGeo, ctrlMat);
    ctrlMesh.position.set(0, 0, 0);
    group.add(ctrlMesh);

    /* Torpedo bay 8x3x6 — forward */
    var torpGeo = new THREE.BoxGeometry(8, 3, 6);
    var torpMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var torpMesh = new THREE.Mesh(torpGeo, torpMat);
    torpMesh.position.set(10, 0, 0);
    group.add(torpMesh);

    /* Reactor room 6x3x6 — aft, glowing */
    var reactGeo = new THREE.BoxGeometry(6, 3, 6);
    var reactMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
    var reactMesh = new THREE.Mesh(reactGeo, reactMat);
    reactMesh.position.set(-10, 0, 0);
    group.add(reactMesh);

    _reactorLight = new THREE.PointLight(0x44FF00, 2.5, 12);
    _reactorLight.position.set(-10, 1.5, 0);
    group.add(_reactorLight);

    /* Crew quarters 8x3x5 — starboard */
    var crewGeo = new THREE.BoxGeometry(8, 3, 5);
    var crewMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var crewMesh = new THREE.Mesh(crewGeo, crewMat);
    crewMesh.position.set(0, 0, 7);
    group.add(crewMesh);

    /* Conning tower / periscope area above control room */
    var perGeo = new THREE.CylinderGeometry(0.25, 0.3, 4, 8);
    var perMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    _periscopeMesh = new THREE.Mesh(perGeo, perMat);
    _periscopeMesh.position.set(-1, 2, 0);
    group.add(_periscopeMesh);

    /* Helm console (player position) */
    var helmGeo = new THREE.BoxGeometry(2, 0.8, 1.2);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var helmMesh = new THREE.Mesh(helmGeo, helmMat);
    helmMesh.position.set(2, -0.6, 0);
    group.add(helmMesh);

    /* Scrubber station (E to reset O2) */
    var scrubGeo = new THREE.BoxGeometry(1, 1.5, 0.6);
    var scrubMat = new THREE.MeshLambertMaterial({ color: 0x446655 });
    var scrubMesh = new THREE.Mesh(scrubGeo, scrubMat);
    scrubMesh.name = '_ns_scrubber';
    scrubMesh.position.set(0, 0.5, -3.5);
    group.add(scrubMesh);

    return group;
  }

  function buildSonarOfficer() {
    var geo  = new THREE.BoxGeometry(0.6, 1.5, 0.6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildEnemyShip(type) {
    var group = new THREE.Group();

    /* Hull — PlaneGeometry visible from periscope */
    var hullGeo = new THREE.PlaneGeometry(8, 2);
    var hullMat = new THREE.MeshLambertMaterial({
      color: type === 'Carrier' ? 0x334455 : (type === 'Destroyer' ? 0x443322 : 0x223344),
      side: THREE.DoubleSide
    });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.x = -Math.PI / 2;
    hull.position.y = 0.1;
    group.add(hull);

    /* Silhouette LineSegments for type identification */
    var silEdges, silGeo, silMat, silLine;
    if (type === 'Destroyer') {
      /* Narrow, elongated */
      silGeo = new THREE.BufferGeometry();
      var silPts = new Float32Array([
        -4,1,0,  4,1,0,
         4,1,0,  4,0,0,
         4,0,0, -4,0,0,
        -4,0,0, -4,1,0,
        /* Mast */
         0,1,0,  0,3,0
      ]);
      silGeo.setAttribute('position', new THREE.BufferAttribute(silPts, 3));
    } else if (type === 'Carrier') {
      /* Wide, flat deck */
      silGeo = new THREE.BufferGeometry();
      var silPts = new Float32Array([ // eslint-disable-line no-redeclare
        -6,0.5,0,  6,0.5,0,
         6,0.5,0,  6,0,0,
         6,0,0,   -6,0,0,
        -6,0,0,   -6,0.5,0,
        /* Island */
         2,0.5,0,  2,2.5,0,
         2,2.5,0,  4,2.5,0,
         4,2.5,0,  4,0.5,0
      ]);
      silGeo.setAttribute('position', new THREE.BufferAttribute(silPts, 3));
    } else {
      /* Submarine shape */
      silGeo = new THREE.BufferGeometry();
      var silPts = new Float32Array([ // eslint-disable-line no-redeclare
        -3,0,0,  3,0,0,
         3,0,0,  3,0.6,0,
         3,0.6,0,-3,0.6,0,
        -3,0.6,0,-3,0,0,
        /* Conning */
        -0.5,0.6,0, -0.5,1.4,0,
        -0.5,1.4,0,  0.5,1.4,0,
         0.5,1.4,0,  0.5,0.6,0
      ]);
      silGeo.setAttribute('position', new THREE.BufferAttribute(silPts, 3));
    }
    silMat  = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    silLine = new THREE.LineSegments(silGeo, silMat);
    silLine.position.y = 1;
    silLine.visible = false;  // only visible through periscope
    group.add(silLine);

    return { group: group, silLine: silLine };
  }

  function buildDepthCharge() {
    var geo  = new THREE.BoxGeometry(1, 1, 1);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x885544 });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildTorpedoMesh(type) {
    var color = type === 'Nuclear' ? 0xFF4400
              : type === 'ADCAP'   ? 0x44AAFF
              : type === 'Decoy'   ? 0x44FF88
              : 0x888844;
    var geo  = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2;
    return mesh;
  }

  function buildDecoyMesh() {
    var geo  = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x44FF88 });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildICBM() {
    var geo  = new THREE.CylinderGeometry(0.4, 0.6, 8, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildExplosion(radius) {
    var r    = radius || 4;
    var geo  = new THREE.SphereGeometry(r, 8, 6);
    var mat  = new THREE.MeshBasicMaterial({
      color: 0xFF4400,
      transparent: true,
      opacity: 0.85
    });
    var mesh  = new THREE.Mesh(geo, mat);
    var light = new THREE.PointLight(0xFF4400, 3, r * 5);
    return { mesh: mesh, light: light };
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launch() {
    if (_active) return;
    _active           = true;
    _missionComplete  = false;
    _crisisMode       = false;
    _crisisChoice     = false;
    _crisisRefused    = false;
    _failState        = false;
    _playerYaw        = 0;
    _playerDepth      = -10;
    _playerVelX       = 0;
    _playerVelZ       = 0;
    _hullIntegrity    = 100;
    _oxygen           = _maxOxygen;
    _morale           = 100;
    _targetsDestroyed = 0;
    _inOptimalDepth   = false;
    _periscopeActive  = false;
    _periscopeRise    = 0;
    _selectedTube     = 0;
    _enemyKnown       = false;
    _decoyActive      = false;
    _decoyTimer       = 0;
    _icbmLaunched     = false;
    _sonarTimer       = 15;
    _sonarContact     = '';
    _sonarContactTimer = 0;
    _falseContactActive = false;
    _sonarOfficerFacing = false;
    _torpedoes        = [];
    _depthCharges     = [];
    _explosions       = [];
    _enemies          = [];

    /* Reset tubes */
    _tubes[0] = { type: 'MK48',    loaded: true,  reloadTimer: 0 };
    _tubes[1] = { type: 'ADCAP',   loaded: true,  reloadTimer: 0 };
    _tubes[2] = { type: 'Decoy',   loaded: true,  reloadTimer: 0 };
    _tubes[3] = { type: 'Nuclear', loaded: false,  reloadTimer: 0 };

    /* Scene setup */
    _savedBackground = _scene.background ? _scene.background.clone() : null;
    _savedFog        = _scene.fog || null;
    _scene.background = new THREE.Color(0x001122);
    _scene.fog        = new THREE.FogExp2(0x001122, 0.015);

    var ambient = new THREE.AmbientLight(0x003355, 0.6);
    ambient.name = '_ns_ambient';
    _scene.add(ambient);

    /* Sub interior */
    _interiorGroup = buildInterior();
    _interiorGroup.position.set(0, _playerDepth, 0);
    _scene.add(_interiorGroup);

    /* Sonar officer NPC at sonar station */
    _sonarOfficer = buildSonarOfficer();
    _sonarOfficer.position.set(-2, _playerDepth + 0.75, -2.5);
    _scene.add(_sonarOfficer);

    /* Camera — behind helm */
    if (_camera) {
      _camera.position.set(0, _playerDepth + 2.5, 6);
      _camera.lookAt(new THREE.Vector3(0, _playerDepth + 1, 0));
    }

    /* Enemy ships at surface (y=0) */
    var enemyDefs = [
      { type: 'Destroyer', x:  80, z: -60 },
      { type: 'Carrier',   x: -70, z:  50 },
      { type: 'Submarine', x:  20, z: 100 }
    ];
    for (var ei = 0; ei < enemyDefs.length; ei++) {
      var def    = enemyDefs[ei];
      var built  = buildEnemyShip(def.type);
      built.group.position.set(def.x, 0, def.z);
      _scene.add(built.group);
      _enemies.push({
        mesh:        built.group,
        silLine:     built.silLine,
        type:        def.type,
        alive:       true,
        sonarLock:   false,
        dcTimer:     8 + Math.random() * 5,
        dcList:      []
      });
    }

    showHUD();
    showMessage('BATTLE STATIONS — N+S activated. Helm ready.', 4000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function createHUD() {
    _hud = document.createElement('div');
    _hud.id = '_ns_hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:12px',
      'right:12px',
      'color:#00EEFF',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,8,20,0.75)',
      'padding:6px 12px',
      'border-radius:4px',
      'border:1px solid #004488',
      'display:none',
      'z-index:9999',
      'pointer-events:none',
      'white-space:pre'
    ].join(';');
    document.body.appendChild(_hud);

    _messageEl = document.createElement('div');
    _messageEl.id = '_ns_msg';
    _messageEl.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFEE44',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,8,20,0.8)',
      'padding:6px 18px',
      'border-radius:4px',
      'border:1px solid #886600',
      'display:none',
      'z-index:10001',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_messageEl);

    _crisisEl = document.createElement('div');
    _crisisEl.id = '_ns_crisis';
    _crisisEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FF2200',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'background:rgba(20,0,0,0.92)',
      'padding:20px 36px',
      'border-radius:6px',
      'border:2px solid #FF2200',
      'display:none',
      'z-index:10002',
      'pointer-events:none',
      'text-align:center',
      'text-shadow:0 0 10px #FF2200'
    ].join(';');
    document.body.appendChild(_crisisEl);
  }

  function showHUD() {
    if (_hud) _hud.style.display = 'block';
    updateHUD();
  }

  function hideHUD() {
    if (_hud) _hud.style.display = 'none';
  }

  function updateHUD() {
    if (!_hud || _hud.style.display === 'none') return;

    var depthStr = Math.round(_playerDepth);
    var hullStr  = Math.max(0, Math.round(_hullIntegrity));
    var o2Str    = Math.max(0, Math.round(_oxygen));
    var tgtStr   = _targetsDestroyed + '/3';

    /* Tube indicators */
    var tubeStr = '';
    for (var ti = 0; ti < 4; ti++) {
      var t = _tubes[ti];
      var mark = t.loaded ? (ti === _selectedTube ? '[' + (ti + 1) + ']' : ' ' + (ti + 1) + ' ') : ' - ';
      tubeStr += mark;
    }

    var sonarStr = _sonarContact ? ('SONAR CONTACT: ' + _sonarContact) : 'SONAR: CLEAR';
    var depthWarning = (_playerDepth >= -50 && _playerDepth <= -30) ? '' :
                       (_playerDepth < -80 ? ' [TOO DEEP]' : (_playerDepth > -50 ? ' [SURFACE — OPTIMAL -50/-80m]' : ''));

    _hud.textContent =
      'SUBMARINE [DEPTH: ' + depthStr + 'm' + depthWarning + '] ' +
      '[HULL: ' + hullStr + '%] ' +
      '[TUBES: ' + tubeStr.trim() + '] ' +
      '[O2: ' + o2Str + 's] ' +
      '[TARGETS: ' + tgtStr + '] | ' +
      sonarStr;
  }

  var _messageTimer = 0;

  function showMessage(text, duration) {
    if (!_messageEl) return;
    _messageEl.textContent = text;
    _messageEl.style.display = 'block';
    _messageTimer = duration || 3000;
  }

  function showCrisis() {
    if (!_crisisEl) return;
    _crisisEl.innerHTML =
      '*** NUCLEAR LAUNCH ORDER RECEIVED ***\n\n' +
      'FIRE NUCLEAR TORPEDO: Press 4 then SPACE\n' +
      'REFUSE ORDER:         Press R\n\n' +
      'This is a moral choice. Choose wisely.';
    _crisisEl.style.display = 'block';
  }

  function hideCrisis() {
    if (_crisisEl) _crisisEl.style.display = 'none';
  }

  function showEndScreen(success, text) {
    if (!_crisisEl) return;
    hideCrisis();
    _crisisEl.style.color    = success ? '#00FFAA' : '#FF4444';
    _crisisEl.style.border   = '2px solid ' + (success ? '#00FFAA' : '#FF4444');
    _crisisEl.style.textShadow = '0 0 10px ' + (success ? '#00FFAA' : '#FF4444');
    _crisisEl.textContent    = text;
    _crisisEl.style.display  = 'block';
  }

  /* ════════════════════════════════════════════════════════════════════════
     PERISCOPE
  ════════════════════════════════════════════════════════════════════════ */

  function enterPeriscope() {
    if (!_camera) return;
    _periscopeActive = true;
    /* Save camera state */
    _savedCamPos  = _camera.position.clone();
    _savedCamLook = _interiorGroup
      ? _interiorGroup.position.clone()
      : new THREE.Vector3(0, _playerDepth + 1, 0);

    /* Show silhouettes of living enemies */
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].alive) {
        _enemies[ei].silLine.visible = true;
      }
    }

    showMessage('PERISCOPE UP — Identify: D=Destroyer C=Carrier S=Submarine', 5000);
  }

  function exitPeriscope() {
    _periscopeActive = false;
    _periscopeRise   = 0;

    for (var ei = 0; ei < _enemies.length; ei++) {
      _enemies[ei].silLine.visible = false;
    }

    if (_camera && _savedCamPos) {
      _camera.position.copy(_savedCamPos);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SONAR OFFICER
  ════════════════════════════════════════════════════════════════════════ */

  function sonarReport() {
    var aliveEnemies = [];
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].alive) aliveEnemies.push(_enemies[ei]);
    }
    if (aliveEnemies.length === 0) {
      _sonarContact = 'NO CONTACTS';
      _sonarContactTimer = 8;
      return;
    }

    /* 20% false contact */
    _falseContactActive = Math.random() < 0.2;
    if (_falseContactActive) {
      var fakeBrng = Math.round(Math.random() * 360);
      var fakeRange = Math.round(800 + Math.random() * 1200);
      _sonarContact = 'BEARING ' + fakeBrng + ' RANGE ' + fakeRange + 'm [VERIFY VIA SCOPE]';
    } else {
      /* Real contact — pick random alive enemy */
      var target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      var dx = target.mesh.position.x - (_interiorGroup ? _interiorGroup.position.x : 0);
      var dz = target.mesh.position.z - (_interiorGroup ? _interiorGroup.position.z : 0);
      var bearing = Math.round(((Math.atan2(dx, -dz) * 180 / Math.PI) + 360) % 360);
      var range   = Math.round(Math.sqrt(dx * dx + dz * dz));
      _sonarContact = 'BEARING ' + bearing + '° RANGE ' + range + 'm TYPE UNKNOWN';
      /* Destroyer detects sub position */
      for (var di = 0; di < _enemies.length; di++) {
        if (_enemies[di].type === 'Destroyer' && _enemies[di].alive) {
          _enemies[di].sonarLock = true;
          _enemyKnown = true;
        }
      }
    }
    _sonarContactTimer = 12;
    showMessage('SONAR OFFICER: Contact! ' + _sonarContact, 5000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     TORPEDO FIRE
  ════════════════════════════════════════════════════════════════════════ */

  function fireTorpedo() {
    if (!_active) return;
    var tube = _tubes[_selectedTube];
    if (!tube.loaded) {
      showMessage('TUBE ' + (_selectedTube + 1) + ' RELOADING...', 2000);
      return;
    }

    /* Nuclear tube only available in crisis mode */
    if (_selectedTube === 3 && !_crisisMode) {
      showMessage('NUCLEAR LAUNCH LOCKED — crisis not active', 2000);
      return;
    }

    tube.loaded     = false;
    tube.reloadTimer = _RELOAD_TIME;

    if (_selectedTube === 2) {
      /* Decoy torpedo */
      fireDecoy();
      return;
    }

    if (_selectedTube === 3) {
      /* Nuclear torpedo — launch ICBM = fail state */
      fireNuclear();
      return;
    }

    var tMesh = buildTorpedoMesh(tube.type);
    tMesh.position.copy(_interiorGroup ? _interiorGroup.position : new THREE.Vector3(0, _playerDepth, 0));

    var fwdX = Math.sin(_playerYaw);
    var fwdZ = -Math.cos(_playerYaw);
    var vel = new THREE.Vector3(fwdX, 0, fwdZ).multiplyScalar(18);

    /* ADCAP: homing — find best target by type match */
    var homedTarget = null;
    if (tube.type === 'ADCAP') {
      var bestDist = Infinity;
      for (var ei = 0; ei < _enemies.length; ei++) {
        if (!_enemies[ei].alive) continue;
        var subPos = _interiorGroup ? _interiorGroup.position : new THREE.Vector3(0, _playerDepth, 0);
        var d = _enemies[ei].mesh.position.distanceTo(subPos);
        if (d < bestDist) {
          bestDist    = d;
          homedTarget = _enemies[ei];
        }
      }
    }

    _scene.add(tMesh);
    _torpedoes.push({
      mesh:   tMesh,
      type:   tube.type,
      target: homedTarget,
      vel:    vel,
      life:   10,
      homing: tube.type === 'ADCAP'
    });
  }

  function fireDecoy() {
    /* Deploy decoy at current position — confuses sonar lock for 15s */
    if (_decoyMesh) {
      _scene.remove(_decoyMesh);
    }
    _decoyMesh = buildDecoyMesh();
    _decoyMesh.position.copy(_interiorGroup ? _interiorGroup.position : new THREE.Vector3(0, _playerDepth, 0));
    _scene.add(_decoyMesh);
    _decoyActive = true;
    _decoyTimer  = 15;
    /* Break all sonar locks */
    _enemyKnown = false;
    for (var ei = 0; ei < _enemies.length; ei++) {
      _enemies[ei].sonarLock = false;
    }
    showMessage('DECOY DEPLOYED — sonar lock broken for 15s', 4000);
  }

  function fireNuclear() {
    /* Launch ICBM from conning tower = FAIL STATE */
    _icbmLaunched = true;
    _icbmMesh = buildICBM();
    var subPos = _interiorGroup ? _interiorGroup.position : new THREE.Vector3(0, _playerDepth, 0);
    _icbmMesh.position.set(subPos.x, _playerDepth, subPos.z);
    _scene.add(_icbmMesh);
    showMessage('NUCLEAR TORPEDO LAUNCHED — ESCALATION INEVITABLE', 6000);
    /* End game as fail after brief delay */
    _failState = true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     DEPTH CHARGE DROP
  ════════════════════════════════════════════════════════════════════════ */

  function dropDepthCharge(enemy) {
    if (!_active) return;
    /* Only drop if position is known and decoy not active */
    if (!_enemyKnown || _decoyActive) return;

    var subPos = _interiorGroup ? _interiorGroup.position : new THREE.Vector3(0, _playerDepth, 0);
    var dc = buildDepthCharge();
    dc.position.set(
      subPos.x + (Math.random() - 0.5) * 20,
      2,
      subPos.z + (Math.random() - 0.5) * 20
    );
    _scene.add(dc);
    var entry = {
      mesh:        dc,
      targetDepth: _playerDepth + (Math.random() - 0.5) * 8,
      fuse:        3 + Math.random() * 2,
      exploded:    false
    };
    enemy.dcList.push(entry);
    _depthCharges.push(entry);
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSION
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos, radius) {
    var exp = buildExplosion(radius || 5);
    exp.mesh.position.copy(pos);
    exp.light.position.copy(pos);
    _scene.add(exp.mesh);
    _scene.add(exp.light);
    _explosions.push({ mesh: exp.mesh, light: exp.light, life: 1.5 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE LOOP
  ════════════════════════════════════════════════════════════════════════ */

  function update(now) {
    if (!_active) return;

    if (_lastTime === 0) { _lastTime = now; return; }
    var dt = Math.min((now - _lastTime) / 1000, 0.1);
    _lastTime = now;

    /* ── Message timer ─────────────────────────────────────────────────── */
    if (_messageTimer > 0) {
      _messageTimer -= dt * 1000;
      if (_messageTimer <= 0) {
        _messageTimer = 0;
        if (_messageEl) _messageEl.style.display = 'none';
      }
    }

    /* ── Periscope animation ────────────────────────────────────────────── */
    var wantPeriscope = !!_keys['KeyP'];
    if (wantPeriscope && !_periscopeActive) {
      enterPeriscope();
    } else if (!wantPeriscope && _periscopeActive) {
      exitPeriscope();
    }
    if (_periscopeActive) {
      _periscopeRise = Math.min(1, _periscopeRise + dt * 2);
      if (_periscopeMesh) {
        _periscopeMesh.position.y = 2 + _periscopeRise * 2;
      }
      /* Periscope camera: look out at surface toward closest enemy */
      if (_camera && _interiorGroup) {
        _camera.position.set(
          _interiorGroup.position.x - 1,
          0.5,  // near surface
          _interiorGroup.position.z
        );
        if (_enemies.length > 0) {
          var nearestEnemy = null;
          var nearestDist2 = Infinity;
          for (var pei = 0; pei < _enemies.length; pei++) {
            if (!_enemies[pei].alive) continue;
            var pd = _enemies[pei].mesh.position.distanceTo(_camera.position);
            if (pd < nearestDist2) { nearestDist2 = pd; nearestEnemy = _enemies[pei]; }
          }
          if (nearestEnemy) {
            _camera.lookAt(nearestEnemy.mesh.position);
          }
        }
      }
    }

    /* ── Player movement (only when not in periscope) ──────────────────── */
    if (!_periscopeActive) {
      var speed = 14;
      var turnSpeed = 1.4;

      if (_keys['KeyA']) { _playerYaw += turnSpeed * dt; }
      if (_keys['KeyD']) { _playerYaw -= turnSpeed * dt; }

      var fwdX = Math.sin(_playerYaw);
      var fwdZ = -Math.cos(_playerYaw);

      _playerVelX = 0;
      _playerVelZ = 0;
      if (_keys['KeyW']) { _playerVelX = fwdX * speed; _playerVelZ = fwdZ * speed; }
      if (_keys['KeyS']) { _playerVelX = -fwdX * speed * 0.6; _playerVelZ = -fwdZ * speed * 0.6; }

      /* Evasive maneuver: Q+A+D simultaneously breaks sonar lock */
      if (_keys['KeyQ'] && _keys['KeyA'] && _keys['KeyD']) {
        _enemyKnown = false;
        for (var evi = 0; evi < _enemies.length; evi++) {
          _enemies[evi].sonarLock = false;
        }
      }

      if (_keys['KeyQ']) { _playerDepth -= 10 * dt; }
      if (_keys['KeyE'] && !_keys['ShiftLeft']) {
        _playerDepth += 7 * dt;
        if (_playerDepth > -1) _playerDepth = -1;
      }

      if (_interiorGroup) {
        _interiorGroup.position.x += _playerVelX * dt;
        _interiorGroup.position.z += _playerVelZ * dt;
        _interiorGroup.position.y  = _playerDepth;
        _interiorGroup.rotation.y  = _playerYaw;
      }

      /* Camera follows sub */
      if (_camera && _interiorGroup) {
        _camera.position.set(
          _interiorGroup.position.x - fwdX * 14,
          _playerDepth + 5,
          _interiorGroup.position.z - fwdZ * 14
        );
        _camera.lookAt(_interiorGroup.position);
      }
    }

    /* Sonar officer position tracks interior */
    if (_sonarOfficer && _interiorGroup) {
      _sonarOfficer.position.set(
        _interiorGroup.position.x - 2,
        _playerDepth + 0.75,
        _interiorGroup.position.z - 2.5
      );
      /* Low morale: NPC faces player */
      if (_morale < 40 && !_sonarOfficerFacing) {
        _sonarOfficerFacing = true;
        _sonarOfficer.rotation.y = _playerYaw + Math.PI;
      } else if (_morale >= 40) {
        _sonarOfficerFacing = false;
        _sonarOfficer.rotation.y = _playerYaw;
      }
    }

    /* ── Reactor light flicker ──────────────────────────────────────────── */
    if (_reactorLight) {
      _reactorLight.intensity = 2.0 + Math.sin(now * 0.003) * 0.5;
    }

    /* ── Optimal depth indicator ────────────────────────────────────────── */
    _inOptimalDepth = (_playerDepth <= -50 && _playerDepth >= -80);

    /* ── Oxygen ────────────────────────────────────────────────────────── */
    _oxygen -= dt;
    if (_oxygen <= 0) {
      _oxygen = 0;
      /* Morale drops rapidly when O2 out */
      _morale -= 20 * dt;
    }

    /* Scrubber interaction */
    if (_keys['KeyE'] && _interiorGroup) {
      var scrubStation = _interiorGroup.getObjectByName('_ns_scrubber');
      if (scrubStation) {
        /* Always reset O2 when E pressed near scrubber (within interior) */
        if (_oxygen < _maxOxygen * 0.9) {
          _oxygen = _maxOxygen;
          showMessage('O2 SCRUBBER CYCLED — supply restored', 3000);
        }
      }
    }

    /* ── Morale decay in combat (enemies alive and sonar lock) ─────────── */
    if (_enemyKnown) {
      _morale -= 1.5 * dt;
    }
    if (_morale < 0) _morale = 0;

    /* Low morale = slower sonar reports (handled via _sonarTimer multiplier) */

    /* ── Sonar officer reports ──────────────────────────────────────────── */
    var sonarInterval = _morale < 40 ? 25 : 15;  // slow when morale low
    _sonarTimer -= dt;
    if (_sonarTimer <= 0) {
      _sonarTimer = sonarInterval;
      sonarReport();
    }
    if (_sonarContactTimer > 0) {
      _sonarContactTimer -= dt;
      if (_sonarContactTimer <= 0) {
        _sonarContact      = '';
        _sonarContactTimer = 0;
        _falseContactActive = false;
      }
    }

    /* ── Torpedo reload timers ──────────────────────────────────────────── */
    for (var ri = 0; ri < _tubes.length; ri++) {
      var tube = _tubes[ri];
      if (!tube.loaded && tube.reloadTimer > 0) {
        tube.reloadTimer -= dt;
        if (tube.reloadTimer <= 0) {
          tube.reloadTimer = 0;
          if (ri !== 3 || _crisisMode) {  /* Nuclear only auto-loads in crisis */
            tube.loaded = true;
          }
        }
      }
    }

    /* ── Torpedo movement ───────────────────────────────────────────────── */
    for (var ti = _torpedoes.length - 1; ti >= 0; ti--) {
      var torp = _torpedoes[ti];
      torp.life -= dt;
      if (torp.life <= 0) {
        _scene.remove(torp.mesh);
        _torpedoes.splice(ti, 1);
        continue;
      }

      /* ADCAP homing */
      if (torp.homing && torp.target && torp.target.alive) {
        var toTgt = new THREE.Vector3().subVectors(
          torp.target.mesh.position, torp.mesh.position
        ).normalize();
        torp.vel.lerp(toTgt.multiplyScalar(18), dt * 2);
      }

      torp.mesh.position.addScaledVector(torp.vel, dt);

      /* Rise toward surface if MK48 or ADCAP */
      if (torp.type === 'MK48' || torp.type === 'ADCAP') {
        torp.mesh.position.y += 5 * dt;  // heads toward surface targets
      }

      /* Hit detection */
      var torpHit = false;
      for (var tei = 0; tei < _enemies.length; tei++) {
        var en = _enemies[tei];
        if (!en.alive) continue;
        var tdist = torp.mesh.position.distanceTo(en.mesh.position);
        if (tdist < 6) {
          /* Check torpedo type vs enemy type requirement */
          var effective = false;
          if (en.type === 'Carrier'    && torp.type === 'ADCAP')  { effective = true; }
          if (en.type === 'Destroyer'  && torp.type === 'MK48')   { effective = true; }
          if (en.type === 'Submarine'  && torp.type === 'MK48')   { effective = true; }

          spawnExplosion(torp.mesh.position.clone(), effective ? 8 : 3);
          _scene.remove(torp.mesh);
          _torpedoes.splice(ti, 1);
          torpHit = true;

          if (effective) {
            en.alive = false;
            _scene.remove(en.mesh);
            _targetsDestroyed++;
            _enemyKnown = false;
            showMessage(en.type + ' DESTROYED!', 4000);
            checkCrisis();
          } else {
            showMessage('WRONG TORPEDO TYPE vs ' + en.type + '! Use correct munition.', 4000);
          }
          break;
        }
      }
      if (torpHit) continue;
    }

    /* ── ICBM rises if launched ─────────────────────────────────────────── */
    if (_icbmMesh && _icbmLaunched) {
      _icbmMesh.position.y += 20 * dt;
    }

    /* ── Decoy timer ────────────────────────────────────────────────────── */
    if (_decoyActive) {
      _decoyTimer -= dt;
      if (_decoyTimer <= 0) {
        _decoyActive = false;
        _decoyTimer  = 0;
        if (_decoyMesh) {
          _scene.remove(_decoyMesh);
          _decoyMesh = null;
        }
      }
    }

    /* ── Enemy AI — destroyer drops depth charges when lock active ──────── */
    for (var ai = 0; ai < _enemies.length; ai++) {
      var enemy = _enemies[ai];
      if (!enemy.alive) continue;

      if (enemy.type === 'Destroyer' && enemy.sonarLock && !_decoyActive) {
        enemy.dcTimer -= dt;
        if (enemy.dcTimer <= 0) {
          enemy.dcTimer = 6 + Math.random() * 4;
          dropDepthCharge(enemy);
        }
      }
    }

    /* ── Depth charges sink and detonate ────────────────────────────────── */
    for (var dci = _depthCharges.length - 1; dci >= 0; dci--) {
      var dc = _depthCharges[dci];
      if (dc.exploded) {
        _depthCharges.splice(dci, 1);
        continue;
      }
      dc.mesh.position.y -= 10 * dt;
      dc.fuse -= dt;

      if (dc.fuse <= 0 || dc.mesh.position.y <= dc.targetDepth) {
        detonateDepthCharge(dci);
      }
    }

    /* ── Flooding/hull damage ───────────────────────────────────────────── */
    if (_hullIntegrity <= 0) {
      _hullIntegrity = 0;
      endGame(false, 'HULL BREACH — SUBMARINE LOST\nMISSION FAILED');
      return;
    }

    /* ── Explosions update ──────────────────────────────────────────────── */
    for (var xi = _explosions.length - 1; xi >= 0; xi--) {
      var exp = _explosions[xi];
      exp.life -= dt;
      var prog = 1 - (exp.life / 1.5);
      exp.mesh.scale.setScalar(1 + prog * 3);
      exp.mesh.material.opacity = exp.life / 1.5;
      exp.light.intensity = 3 * (exp.life / 1.5);
      if (exp.life <= 0) {
        _scene.remove(exp.mesh);
        _scene.remove(exp.light);
        _explosions.splice(xi, 1);
      }
    }

    /* ── Fail state: ICBM launched ──────────────────────────────────────── */
    if (_failState && !_missionComplete) {
      /* Brief delay then end */
      _failState = false;
      endGame(false, 'NUCLEAR TORPEDO LAUNCHED\nESCALATION PROTOCOL TRIGGERED\n\n*** MISSION FAILED ***\nRefusing the order was the only right answer.');
      return;
    }

    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function detonateDepthCharge(idx) {
    var dc = _depthCharges[idx];
    if (!dc || dc.exploded) return;
    dc.exploded = true;
    var pos = dc.mesh.position.clone();
    spawnExplosion(pos, 6);
    _scene.remove(dc.mesh);

    /* Damage player if in blast radius */
    var subPos = _interiorGroup ? _interiorGroup.position : new THREE.Vector3(0, _playerDepth, 0);
    var blastDist = pos.distanceTo(subPos);
    if (blastDist < 12) {
      var dmg = Math.round(35 * (1 - blastDist / 12));
      _hullIntegrity -= dmg;
      _morale        -= 8;
      showMessage('DEPTH CHARGE IMPACT — Hull ' + Math.max(0, Math.round(_hullIntegrity)) + '% — Dive! (Q) or evade (Q+A+D)', 3500);
    }
  }

  function checkCrisis() {
    if (_missionComplete || _crisisMode) return;
    if (_targetsDestroyed >= 3) {
      /* All 3 targets destroyed — nuclear launch order arrives */
      _crisisMode  = true;
      _tubes[3].loaded = true;  /* Nuclear tube unlocked */
      showCrisis();
      showMessage('ALL TARGETS DESTROYED — NUCLEAR ORDER INCOMING', 5000);
    }
  }

  function endGame(success, text) {
    if (!_active) return;
    _active          = false;
    _missionComplete = true;
    hideHUD();
    if (_messageEl) _messageEl.style.display = 'none';
    showEndScreen(success, text || (success ? 'MISSION COMPLETE' : 'MISSION FAILED'));
  }

  /* ════════════════════════════════════════════════════════════════════════
     KEY HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keysPrev[e.code] = _keys[e.code];
    _keys[e.code]     = true;

    /* ── N+S activation ─────────────────────────────────────────────── */
    if (e.code === 'KeyN') { _nsPressTime.N = Date.now(); }
    if (e.code === 'KeyS') { _nsPressTime.S = Date.now(); }
    if ((e.code === 'KeyN' || e.code === 'KeyS') && !_active) {
      var gap = Math.abs(_nsPressTime.N - _nsPressTime.S);
      if (gap <= NS_WINDOW && _nsPressTime.N > 0 && _nsPressTime.S > 0) {
        launch();
        _nsPressTime.N = 0;
        _nsPressTime.S = 0;
      }
    }

    if (!_active) return;

    /* ── Tube selection ─────────────────────────────────────────────── */
    if (e.code === 'Digit1') { _selectedTube = 0; updateHUD(); }
    if (e.code === 'Digit2') { _selectedTube = 1; updateHUD(); }
    if (e.code === 'Digit3') { _selectedTube = 2; updateHUD(); }
    if (e.code === 'Digit4') {
      if (_crisisMode) {
        _selectedTube = 3;
        showMessage('NUCLEAR TUBE SELECTED — press SPACE to fire or R to refuse', 4000);
      } else {
        showMessage('NUCLEAR TUBE LOCKED — not in crisis mode', 2000);
      }
      updateHUD();
    }

    /* ── Fire torpedo ───────────────────────────────────────────────── */
    if (e.code === 'Space') {
      e.preventDefault();
      fireTorpedo();
    }

    /* ── Refuse nuclear order ───────────────────────────────────────── */
    if (e.code === 'KeyR' && _crisisMode && !_crisisChoice) {
      _crisisChoice  = true;
      _crisisRefused = true;
      hideCrisis();
      endGame(true,
        'ORDER REFUSED\n\nYou stood down the nuclear launch.\nThe world did not end today.\n\n*** MISSION SUCCESS ***\nSilent service. Uncommon valor.');
    }
  }

  function onKeyUp(e) {
    _keysPrev[e.code] = _keys[e.code];
    _keys[e.code]     = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active = false;

    if (_interiorGroup) { _scene.remove(_interiorGroup); _interiorGroup = null; }
    if (_sonarOfficer)  { _scene.remove(_sonarOfficer);  _sonarOfficer  = null; }
    if (_decoyMesh)     { _scene.remove(_decoyMesh);     _decoyMesh     = null; }
    if (_icbmMesh)      { _scene.remove(_icbmMesh);      _icbmMesh      = null; }

    for (var ei = 0; ei < _enemies.length; ei++) {
      _scene.remove(_enemies[ei].mesh);
      for (var dci2 = 0; dci2 < _enemies[ei].dcList.length; dci2++) {
        _scene.remove(_enemies[ei].dcList[dci2].mesh);
      }
    }
    _enemies = [];

    for (var ti = 0; ti < _torpedoes.length; ti++) { _scene.remove(_torpedoes[ti].mesh); }
    _torpedoes = [];

    for (var dci = 0; dci < _depthCharges.length; dci++) { _scene.remove(_depthCharges[dci].mesh); }
    _depthCharges = [];

    for (var xi = 0; xi < _explosions.length; xi++) {
      _scene.remove(_explosions[xi].mesh);
      _scene.remove(_explosions[xi].light);
    }
    _explosions = [];

    var nsAmbient = _scene.getObjectByName('_ns_ambient');
    if (nsAmbient) _scene.remove(nsAmbient);

    if (_savedBackground) { _scene.background = _savedBackground; }
    if (_savedFog !== null) { _scene.fog = _savedFog; }
    _savedBackground = null;
    _savedFog        = null;
    _reactorLight    = null;
    _periscopeMesh   = null;

    hideHUD();
    if (_messageEl) _messageEl.style.display = 'none';
    hideCrisis();

    _lastTime    = 0;
    _messageTimer = 0;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;
    _keys      = {};
    _keysPrev  = {};
    _nsPressTime = { N: 0, S: 0 };

    createHUD();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
  }

  function publicUpdate(now) {
    update(now);
  }

  function publicReset() {
    reset();
  }

  return {
    init:   init,
    update: publicUpdate,
    reset:  publicReset
  };

}());
