/* ───────────────────────────────────────────────────────────────────────────
   mob-war.js — Mob War: City Territory Control
   API: window.MobWar = { init, update, reset }
   Controls:
     M + W (together, within 400ms) → activate module
     WASD                           → move player
     Mouse                          → aim / look
     E (hold 5s near district)      → plant flag / intimidate business (3s)
     1                              → order made men: ATTACK
     2                              → order made men: HOLD
     3                              → order made men: SPREAD
     4                              → assign made men to patrol district
     P                              → pay off police officer (200 gold, -30% heat)
     Left Click                     → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.MobWar = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active      = false;
  var _mPressTime  = 0;
  var _wPressTime  = 0;
  var _keys        = {};

  /* ── District definitions ──────────────────────────────────────────────── */
  var DISTRICTS = [
    { name: 'docks',      color: 0x334455, cx: -40, cz: -40 },
    { name: 'warehouse',  color: 0x445544, cx:  40, cz: -40 },
    { name: 'downtown',   color: 0x556655, cx:   0, cz:   0 },
    { name: 'casino',     color: 0x665544, cx: -40, cz:  40 },
    { name: 'airfield',   color: 0x554433, cx:  40, cz:  40 }
  ];

  /* ── Faction definitions ───────────────────────────────────────────────── */
  var FACTIONS = [
    { name: 'Italian', color: 0x882211, districts: [0, 2] },
    { name: 'Russian',  color: 0x112288, districts: [1]   },
    { name: 'Chinese',  color: 0x228811, districts: [3]   }
  ];
  /* district 4 = airfield starts neutral */

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _gold               = 100;
  var _policeHeat         = 0;     /* 0-100 */
  var _gameTime           = 0;
  var _goldTimer          = 0;
  var _gameOver           = false;

  /* ── District ownership: -1=neutral, 0=player, 1=Italian, 2=Russian, 3=Chinese */
  var _districtOwner      = [-1, -1, -1, -1, -1];
  /* district mesh objects */
  var _districtFloors     = [];
  var _districtBuildings  = []; /* array of arrays */
  var _districtFlags      = [];
  var _districtEnemyCounts = [0, 0, 0, 0, 0];

  /* ── Flag planting ─────────────────────────────────────────────────────── */
  var _plantingFlag        = false;
  var _plantingTimer       = 0;
  var _plantingDistrict    = -1;

  /* ── Business intimidation ─────────────────────────────────────────────── */
  var _businesses          = [];  /* { mesh, owner:-1/0, intimidateTimer, incomeActive, pos } */
  var _businessIncomeTimer = 0;

  /* ── Police officer payoff ─────────────────────────────────────────────── */
  var _policeOfficer       = null;
  var _policeOfficerPos    = null;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player              = null;
  var _playerPos           = null;
  var _playerHP            = 200;
  var _mouseX              = 0;
  var _mouseY              = 0;
  var _yaw                 = 0;
  var _pitch               = 0;
  var _playerBullets       = [];
  var _fireTimer           = 0;
  var _fireRate            = 0.15;

  /* ── Made men ──────────────────────────────────────────────────────────── */
  var _madeMen             = [];   /* { mesh, hp, alive, order, patrolDistrict, fireTimer } */
  var _madeMenOrder        = 'hold'; /* 'attack','hold','spread' */
  var _madeMenPatrolDist   = -1;

  /* ── Rival family enemies ──────────────────────────────────────────────── */
  var _enemies             = [];   /* { mesh, hp, alive, faction, district, fireTimer, patrolDir, startX, startZ } */

  /* ── Hit men ───────────────────────────────────────────────────────────── */
  var _hitMen              = [];   /* { mesh, hp, alive, fireTimer } */
  var _hitMenActive        = false;

  /* ── Police / SWAT ─────────────────────────────────────────────────────── */
  var _patrolCar           = null;
  var _patrolCarPos        = null;
  var _patrolCarActive     = false;
  var _policeOfficers      = [];   /* { mesh, hp, alive, fireTimer } */
  var _swatTeam            = [];   /* { mesh, hp, alive, fireTimer } */
  var _swatActive          = false;
  var _layLowTimer         = 0;

  /* ── Safehouse ─────────────────────────────────────────────────────────── */
  var _safehouse           = null;
  var _safehousePos        = null;

  /* ── Underboss meeting ─────────────────────────────────────────────────── */
  var _sitdownOffered      = false;
  var _sitdownActive       = false;
  var _sitdownTimer        = 0;
  var _sitdownAccepted     = false;
  var _rival_bosses        = [];   /* { mesh, alive, faction } */
  var _sitdownPromptEl     = null;

  /* ── Bullets ───────────────────────────────────────────────────────────── */
  var _enemyBullets        = [];

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud                 = null;

  /* ── Interaction key hold ──────────────────────────────────────────────── */
  var _eHeld               = false;
  var _eHoldTimer          = 0;
  var _eTargetType         = ''; /* 'flag' or 'business' or 'payoff' */
  var _eTargetIndex        = -1;

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

  function _distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _playerControlledCount() {
    var n = 0;
    for (var i = 0; i < 5; i++) { if (_districtOwner[i] === 0) n++; }
    return n;
  }

  function _factionControlledCount(factionIdx) {
    var n = 0;
    for (var i = 0; i < 5; i++) { if (_districtOwner[i] === factionIdx + 1) n++; }
    return n;
  }

  function _getDistrictColor(ownerIdx) {
    if (ownerIdx === 0) return 0x334499;              /* player - blue */
    if (ownerIdx === 1) return FACTIONS[0].color;     /* Italian */
    if (ownerIdx === 2) return FACTIONS[1].color;     /* Russian */
    if (ownerIdx === 3) return FACTIONS[2].color;     /* Chinese */
    return 0x888888;                                   /* neutral */
  }

  function _v3(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  function _randInDistrict(di) {
    var cx = DISTRICTS[di].cx;
    var cz = DISTRICTS[di].cz;
    return {
      x: cx + (Math.random() - 0.5) * 14,
      z: cz + (Math.random() - 0.5) * 14
    };
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD WORLD                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildCity() {
    /* Ground plane */
    var ground = _box(120, 0.2, 120, 0x222222);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    /* Roads — simple cross pattern */
    var roadH = _box(120, 0.05, 8, 0x333333);
    roadH.position.set(0, 0.01, 0);
    _scene.add(roadH);
    var roadV = _box(8, 0.05, 120, 0x333333);
    roadV.position.set(0, 0.01, 0);
    _scene.add(roadV);

    /* Build 5 districts */
    for (var di = 0; di < 5; di++) {
      _buildDistrict(di);
    }

    /* Lighting */
    var amb = new THREE.AmbientLight(0xCCCCDD, 0.5);
    _scene.add(amb);
    var sun = new THREE.DirectionalLight(0xFFEECC, 0.9);
    sun.position.set(30, 60, 30);
    _scene.add(sun);
  }

  function _buildDistrict(di) {
    var d = DISTRICTS[di];
    var cx = d.cx;
    var cz = d.cz;

    /* Floor */
    var floor = _box(20, 0.3, 20, 0x888888);
    floor.position.set(cx, 0.15, cz);
    _scene.add(floor);
    _districtFloors.push(floor);

    /* 3 buildings */
    var bldgs = [];
    var bldgOffsets = [
      { x: -5, z: -5, w: 4, h: 6, dep: 4 },
      { x:  5, z: -5, w: 3, h: 8, dep: 3 },
      { x:  0, z:  5, w: 5, h: 5, dep: 5 }
    ];
    for (var bi = 0; bi < 3; bi++) {
      var bo = bldgOffsets[bi];
      var bldg = _box(bo.w, bo.h, bo.dep, d.color);
      bldg.position.set(cx + bo.x, bo.h / 2, cz + bo.z);
      _scene.add(bldg);
      bldgs.push(bldg);
    }
    _districtBuildings.push(bldgs);

    /* Flag slot — initially no flag */
    _districtFlags.push(null);
  }

  function _setDistrictColor(di, ownerIdx) {
    var bldgs = _districtBuildings[di];
    var col = _getDistrictColor(ownerIdx);
    for (var i = 0; i < bldgs.length; i++) {
      bldgs[i].material.color.setHex(col);
    }
    _districtFloors[di].material.color.setHex(
      ownerIdx < 0 ? 0x888888 : col
    );
  }

  function _plantFlagMesh(di) {
    /* Remove old flag if any */
    if (_districtFlags[di]) {
      _scene.remove(_districtFlags[di]);
      _districtFlags[di] = null;
    }
    var g = new THREE.Group();
    var pole = _box(0.1, 3, 0.1, 0xAAAAAA);
    pole.position.y = 1.5;
    g.add(pole);
    var flag = _box(1.5, 1, 0.05, 0x334499);
    flag.position.set(0.75, 2.7, 0);
    g.add(flag);
    g.position.set(DISTRICTS[di].cx, 0.3, DISTRICTS[di].cz + 8);
    _scene.add(g);
    _districtFlags[di] = g;
  }

  function _removeFlagMesh(di) {
    if (_districtFlags[di]) {
      _scene.remove(_districtFlags[di]);
      _districtFlags[di] = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD BUSINESSES                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildBusinesses() {
    var bPositions = [
      { x: -15, z: 15 },
      { x:  15, z: 15 },
      { x: -15, z: -15 },
      { x:  15, z: -15 }
    ];
    for (var i = 0; i < 4; i++) {
      var mesh = _box(3, 4, 3, 0x665533);
      mesh.position.set(bPositions[i].x, 2, bPositions[i].z);
      _scene.add(mesh);
      /* Sign on top */
      var sign = _box(2.5, 0.5, 0.1, 0x998855);
      sign.position.set(bPositions[i].x, 4.5, bPositions[i].z + 1.5);
      _scene.add(sign);
      _businesses.push({
        mesh: mesh,
        owner: -1,
        intimidateTimer: 0,
        incomeActive: false,
        pos: new THREE.Vector3(bPositions[i].x, 2, bPositions[i].z)
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD POLICE OFFICER                                                    */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPoliceOfficer() {
    var g = new THREE.Group();
    /* Body - police blue */
    var body = _box(0.6, 1.6, 0.4, 0x334455);
    body.position.y = 0.8;
    g.add(body);
    /* Badge accent */
    var badge = _box(0.2, 0.2, 0.1, 0xFFD700);
    badge.position.set(0, 1.2, 0.25);
    g.add(badge);
    /* Head */
    var head = _sphere(0.25, 0x997755);
    head.position.y = 1.9;
    g.add(head);
    /* Hat */
    var hat = _box(0.5, 0.2, 0.5, 0x223344);
    hat.position.y = 2.15;
    g.add(hat);
    /* Position near downtown */
    g.position.set(5, 0, 5);
    _scene.add(g);
    _policeOfficer = g;
    _policeOfficerPos = g.position;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD SAFEHOUSE                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildSafehouse() {
    var sh = _box(5, 3, 5, 0x445544);
    sh.position.set(0, 1.5, -55);
    _scene.add(sh);
    var roof = _box(5.2, 0.4, 5.2, 0x334433);
    roof.position.set(0, 3.2, -55);
    _scene.add(roof);
    _safehouse = sh;
    _safehousePos = sh.position;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD ENEMIES                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildEnemy(factionIdx, di) {
    var col = FACTIONS[factionIdx].color;
    var g = new THREE.Group();
    var body = _cyl(0.25, 0.25, 1.6, 8, col);
    body.position.y = 0.8;
    g.add(body);
    var head = _sphere(0.22, col);
    head.position.y = 1.82;
    g.add(head);
    var gun = _box(0.08, 0.08, 0.7, 0x222222);
    gun.position.set(0.3, 1.1, 0.35);
    g.add(gun);
    var pos = _randInDistrict(di);
    g.position.set(pos.x, 0, pos.z);
    _scene.add(g);
    return {
      mesh: g,
      hp: 60,
      alive: true,
      faction: factionIdx,
      district: di,
      fireTimer: 1 + Math.random() * 2,
      patrolDir: (Math.random() < 0.5) ? 1 : -1,
      startX: pos.x,
      startZ: pos.z
    };
  }

  function _buildInitialEnemies() {
    /* Italian: districts 0 and 2 — 3 enemies each */
    for (var i = 0; i < 3; i++) { _enemies.push(_buildEnemy(0, 0)); }
    for (var j = 0; j < 3; j++) { _enemies.push(_buildEnemy(0, 2)); }
    _districtEnemyCounts[0] = 3;
    _districtOwner[0] = 1;
    _districtEnemyCounts[2] = 3;
    _districtOwner[2] = 1;

    /* Russian: district 1 — 3 enemies */
    for (var k = 0; k < 3; k++) { _enemies.push(_buildEnemy(1, 1)); }
    _districtEnemyCounts[1] = 3;
    _districtOwner[1] = 2;

    /* Chinese: district 3 — 3 enemies */
    for (var m = 0; m < 3; m++) { _enemies.push(_buildEnemy(2, 3)); }
    _districtEnemyCounts[3] = 3;
    _districtOwner[3] = 3;

    /* District 4 (airfield) neutral, no enemies */
    _districtOwner[4] = -1;

    /* Update colors */
    for (var di = 0; di < 5; di++) {
      _setDistrictColor(di, _districtOwner[di]);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD MADE MEN                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildMadeMen() {
    var offsets = [
      { x: -1.5, z:  2 },
      { x:  1.5, z:  2 },
      { x: -2.5, z:  3.5 },
      { x:  2.5, z:  3.5 },
      { x: -1.0, z:  4.5 },
      { x:  1.0, z:  4.5 }
    ];
    for (var i = 0; i < 6; i++) {
      var g = new THREE.Group();
      var body = _cyl(0.25, 0.25, 1.6, 8, 0x223366);
      body.position.y = 0.8;
      g.add(body);
      var head = _sphere(0.22, 0x997755);
      head.position.y = 1.82;
      g.add(head);
      var gun = _box(0.08, 0.08, 0.7, 0x333333);
      gun.position.set(0.3, 1.1, 0.35);
      g.add(gun);
      /* Start near player spawn */
      g.position.set(offsets[i].x, 0, offsets[i].z + 5);
      _scene.add(g);
      _madeMen.push({
        mesh: g,
        hp: 100,
        alive: true,
        order: 'hold',
        patrolDistrict: -1,
        fireTimer: 1 + Math.random()
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD RIVAL BOSSES                                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildRivalBosses() {
    var positions = [
      { x: -40, z: -40 },
      { x:  40, z: -40 },
      { x: -40, z:  40 }
    ];
    for (var fi = 0; fi < 3; fi++) {
      var g = new THREE.Group();
      /* CylinderGeometry 1.5x scale */
      var body = _cyl(0.4, 0.4, 1.8, 8, FACTIONS[fi].color);
      body.scale.set(1.5, 1.5, 1.5);
      body.position.y = 1.35;
      g.add(body);
      var head = _sphere(0.35, FACTIONS[fi].color);
      head.scale.set(1.5, 1.5, 1.5);
      head.position.y = 3.15;
      g.add(head);
      /* Suit accent */
      var suit = _box(0.6, 0.4, 0.1, 0x333333);
      suit.position.set(0, 2.0, 0.58);
      g.add(suit);
      g.position.set(positions[fi].x, 0, positions[fi].z);
      /* Hidden until sitdown triggered */
      g.visible = false;
      _scene.add(g);
      _rival_bosses.push({ mesh: g, alive: true, faction: fi, hp: 300, fireTimer: 1 });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD PLAYER                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPlayer() {
    var g = new THREE.Group();
    var body = _box(0.6, 1.6, 0.4, 0x334499);
    body.position.y = 0.8;
    g.add(body);
    var gun = _box(0.1, 0.1, 0.8, 0x222222);
    gun.position.set(0.35, 1.1, 0.4);
    g.add(gun);
    g.position.set(0, 0, 10);
    _scene.add(g);
    _player = g;
    _playerPos = g.position;
    _camera.position.set(0, 5, 18);
    _camera.lookAt(0, 1, 10);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HUD                                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'mw-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #556677',
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
    var territory = _playerControlledCount();
    var heatColor = _policeHeat >= 80 ? '#FF4444' : _policeHeat >= 50 ? '#FFAA44' : '#44FF44';
    var madeMenAlive = 0;
    for (var i = 0; i < _madeMen.length; i++) {
      if (_madeMen[i].alive) madeMenAlive++;
    }
    var itDist = _factionControlledCount(0);
    var ruDist = _factionControlledCount(1);
    var cnDist = _factionControlledCount(2);
    _hud.innerHTML =
      'MOB WAR [TERRITORY: ' + territory + '/5] ' +
      '[GOLD: ' + Math.floor(_gold) + '] ' +
      '[HEAT: <span style="color:' + heatColor + '">' + Math.floor(_policeHeat) + '%</span>] ' +
      '[MADE MEN: ' + madeMenAlive + '/6] | ' +
      'FAMILIES: Italian/' + itDist + ' Russian/' + ruDist + ' Chinese/' + cnDist;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
  }

  function _showMessage(msg, color, duration) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:70px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.80)',
      'color:' + (color || '#FFD700'),
      'font-family:monospace',
      'font-size:16px',
      'padding:8px 20px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9998'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, (duration || 2500));
  }

  function _showResult(win) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:' + (win ? '#FFD700' : '#FF4444'),
      'font-family:monospace',
      'font-size:28px',
      'padding:30px 50px',
      'border:2px solid ' + (win ? '#FFD700' : '#FF4444'),
      'border-radius:8px',
      'z-index:99999',
      'text-align:center'
    ].join(';');
    el.innerHTML = (win ? 'THE CITY IS YOURS' : 'YOU\'RE DEAD') +
      '<br><span style="font-size:16px">GOLD: ' + Math.floor(_gold) + '</span>';
    document.body.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BULLETS                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _firePlayerBullet() {
    var b = _sphere(0.12, 0xFFFF88);
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    b.position.copy(_camera.position).addScaledVector(dir, 1.5);
    _scene.add(b);
    _playerBullets.push({ mesh: b, vel: dir.multiplyScalar(45), life: 1.8 });
    /* Shooting increases heat slightly */
    _policeHeat = Math.min(100, _policeHeat + 0.5);
  }

  function _fireEnemyBullet(fromPos) {
    var b = _sphere(0.1, 0xFF4444);
    b.position.copy(fromPos);
    _scene.add(b);
    var dir = _playerPos.clone().sub(fromPos).normalize();
    dir.x += (Math.random() - 0.5) * 0.2;
    dir.y += (Math.random() - 0.5) * 0.1;
    dir.z += (Math.random() - 0.5) * 0.2;
    dir.normalize();
    _enemyBullets.push({ mesh: b, vel: dir.multiplyScalar(25), life: 2 });
  }

  function _fireMadeMenBullet(fromPos, target) {
    var b = _sphere(0.1, 0x8888FF);
    b.position.copy(fromPos);
    _scene.add(b);
    var dir = target.clone().sub(fromPos).normalize();
    dir.x += (Math.random() - 0.5) * 0.15;
    dir.z += (Math.random() - 0.5) * 0.15;
    dir.normalize();
    _playerBullets.push({ mesh: b, vel: dir.multiplyScalar(35), life: 2, fromMadeMen: true });
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PLAYER MOVEMENT                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updatePlayer(dt) {
    if (!_player) return;
    var speed = 6;
    var fwd   = new THREE.Vector3(0, 0, -1).applyAxisAngle(_v3(0, 1, 0), _yaw);
    var right = new THREE.Vector3(1, 0, 0).applyAxisAngle(_v3(0, 1, 0), _yaw);

    if (_keys['w'] || _keys['arrowup'])    _playerPos.addScaledVector(fwd, speed * dt);
    if (_keys['s'] || _keys['arrowdown'])  _playerPos.addScaledVector(fwd, -speed * dt);
    if (_keys['a'] || _keys['arrowleft'])  _playerPos.addScaledVector(right, -speed * dt);
    if (_keys['d'] || _keys['arrowright']) _playerPos.addScaledVector(right, speed * dt);

    /* Clamp to world */
    _playerPos.x = Math.max(-59, Math.min(59, _playerPos.x));
    _playerPos.z = Math.max(-59, Math.min(59, _playerPos.z));

    _player.position.copy(_playerPos);
    _player.rotation.y = _yaw;

    /* Camera follow */
    var camOffset = new THREE.Vector3(0, 6, 10);
    camOffset.applyAxisAngle(_v3(0, 1, 0), _yaw);
    _camera.position.copy(_playerPos).add(camOffset);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    /* Lay low at safehouse — reduce heat */
    if (_safehousePos && _dist(_playerPos, _safehousePos) < 6) {
      _layLowTimer += dt;
      /* 5%/min = 5/60 per second */
      _policeHeat = Math.max(0, _policeHeat - (5 / 60) * dt);
      if (Math.floor(_layLowTimer) % 5 === 0 && _layLowTimer > 0.1) {
        /* small periodic message handled below */
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MADE MEN AI                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateMadeMen(dt) {
    var aliveCount = 0;
    for (var i = 0; i < _madeMen.length; i++) {
      var mm = _madeMen[i];
      if (!mm.alive) continue;
      aliveCount++;

      /* Formation offset from player */
      var formOffsets = [
        { x: -1.5, z: 2 }, { x: 1.5, z: 2 },
        { x: -2.5, z: 3.5 }, { x: 2.5, z: 3.5 },
        { x: -1.0, z: 4.5 }, { x: 1.0, z: 4.5 }
      ];

      var fo = formOffsets[i];
      var fwdV = new THREE.Vector3(0, 0, 1).applyAxisAngle(_v3(0, 1, 0), _yaw);
      var rtV  = new THREE.Vector3(1, 0, 0).applyAxisAngle(_v3(0, 1, 0), _yaw);

      var order = mm.order !== 'hold' ? mm.order : _madeMenOrder;

      if (mm.patrolDistrict >= 0 && order !== 'attack') {
        /* Patrol assigned district */
        var cx = DISTRICTS[mm.patrolDistrict].cx;
        var cz = DISTRICTS[mm.patrolDistrict].cz;
        var patrolTarget = _v3(
          cx + formOffsets[i % 3].x * 2,
          0,
          cz + formOffsets[i % 3].z * 2
        );
        var pd = patrolTarget.clone().sub(mm.mesh.position);
        var pdLen = pd.length();
        if (pdLen > 0.5) {
          pd.normalize();
          mm.mesh.position.addScaledVector(pd, 2.5 * dt);
        }
      } else if (order === 'attack') {
        /* Move toward nearest enemy */
        var nearest = _findNearestEnemy(mm.mesh.position);
        if (nearest) {
          var toEnemy = nearest.mesh.position.clone().sub(mm.mesh.position);
          if (toEnemy.length() > 3) {
            toEnemy.normalize();
            mm.mesh.position.addScaledVector(toEnemy, 3.5 * dt);
          }
          mm.mesh.lookAt(nearest.mesh.position);
          /* Fire at enemy */
          mm.fireTimer -= dt;
          if (mm.fireTimer <= 0 && toEnemy.length() < 20) {
            _fireMadeMenBullet(
              mm.mesh.position.clone().setY(mm.mesh.position.y + 1.1),
              nearest.mesh.position.clone().setY(nearest.mesh.position.y + 1)
            );
            mm.fireTimer = 1.0 + Math.random() * 0.5;
          }
        } else {
          /* No enemies — follow player */
          _moveMadeMenToFormation(mm, i, fwdV, rtV, fo, dt);
        }
      } else if (order === 'spread') {
        /* Spread around player in wider arc */
        var spreadTarget = _playerPos.clone()
          .addScaledVector(fwdV, fo.z * 1.5)
          .addScaledVector(rtV, fo.x * 2);
        var sd = spreadTarget.clone().sub(mm.mesh.position);
        if (sd.length() > 1) {
          sd.normalize();
          mm.mesh.position.addScaledVector(sd, 3 * dt);
        }
        /* Fire at nearest enemy if within range */
        _madeMenFireIfClose(mm, 15, dt);
      } else {
        /* HOLD — stay in formation near player */
        _moveMadeMenToFormation(mm, i, fwdV, rtV, fo, dt);
        _madeMenFireIfClose(mm, 12, dt);
      }
    }
  }

  function _moveMadeMenToFormation(mm, idx, fwdV, rtV, fo, dt) {
    var target = _playerPos.clone()
      .addScaledVector(fwdV, fo.z)
      .addScaledVector(rtV, fo.x);
    var diff = target.clone().sub(mm.mesh.position);
    if (diff.length() > 0.5) {
      diff.normalize();
      mm.mesh.position.addScaledVector(diff, 4 * dt);
    }
  }

  function _madeMenFireIfClose(mm, range, dt) {
    var nearest = _findNearestEnemy(mm.mesh.position);
    if (!nearest) return;
    var d = _dist(mm.mesh.position, nearest.mesh.position);
    if (d < range) {
      mm.fireTimer -= dt;
      if (mm.fireTimer <= 0) {
        _fireMadeMenBullet(
          mm.mesh.position.clone().setY(mm.mesh.position.y + 1.1),
          nearest.mesh.position.clone().setY(nearest.mesh.position.y + 1)
        );
        mm.fireTimer = 1.2 + Math.random() * 0.6;
      }
    }
  }

  function _findNearestEnemy(pos) {
    var best = null;
    var bestDist = 99999;
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;
      var d = _dist(pos, e.mesh.position);
      if (d < bestDist) { best = e; bestDist = d; }
    }
    /* Also hit men, rival bosses */
    for (var j = 0; j < _hitMen.length; j++) {
      var h = _hitMen[j];
      if (!h.alive) continue;
      var dh = _dist(pos, h.mesh.position);
      if (dh < bestDist) { best = h; bestDist = dh; }
    }
    for (var k = 0; k < _rival_bosses.length; k++) {
      var rb = _rival_bosses[k];
      if (!rb.alive || !rb.mesh.visible) continue;
      var dr = _dist(pos, rb.mesh.position);
      if (dr < bestDist) { best = rb; bestDist = dr; }
    }
    return best;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ENEMY AI                                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;

      /* Patrol home district */
      e.mesh.position.x += e.patrolDir * 0.8 * dt;
      if (Math.abs(e.mesh.position.x - e.startX) > 6) {
        e.patrolDir *= -1;
      }

      var distPlayer = _dist(_playerPos, e.mesh.position);

      /* Shoot if player near */
      if (distPlayer < 20) {
        e.mesh.lookAt(_playerPos);
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          _fireEnemyBullet(e.mesh.position.clone().setY(e.mesh.position.y + 1.2));
          e.fireTimer = 1.4 + Math.random() * 1.2;
        }
        /* Chase if within 14 */
        if (distPlayer < 14) {
          var toPlayer = _playerPos.clone().sub(e.mesh.position).normalize();
          e.mesh.position.addScaledVector(toPlayer, 2 * dt);
        }
      }
    }

    /* Inter-faction warfare: factions fight each other */
    _updateFactionWar(dt);
  }

  function _updateFactionWar(dt) {
    /* Every enemy occasionally targets another faction's enemy */
    for (var i = 0; i < _enemies.length; i++) {
      var a = _enemies[i];
      if (!a.alive) continue;
      a._warTimer = (a._warTimer || (2 + Math.random() * 3)) - dt;
      if (a._warTimer > 0) continue;
      a._warTimer = 2 + Math.random() * 3;

      /* Find nearest enemy of another faction */
      var bestFoe = null;
      var bestFoeDist = 30;
      for (var j = 0; j < _enemies.length; j++) {
        var b = _enemies[j];
        if (!b.alive) continue;
        if (b.faction === a.faction) continue;
        var d = _dist(a.mesh.position, b.mesh.position);
        if (d < bestFoeDist) { bestFoe = b; bestFoeDist = d; }
      }
      if (!bestFoe) continue;

      /* Fire a bullet at them */
      var bul = _sphere(0.09, 0xFFAA44);
      bul.position.copy(a.mesh.position).y += 1.2;
      _scene.add(bul);
      var dir = bestFoe.mesh.position.clone().sub(bul.position).normalize();
      /* This bullet damages enemies, not player */
      a._factBullets = a._factBullets || [];
      a._factBullets.push({ mesh: bul, vel: dir.multiplyScalar(22), life: 1.5, target: bestFoe });
    }

    /* Move faction war bullets */
    for (var fi = 0; fi < _enemies.length; fi++) {
      var ea = _enemies[fi];
      if (!ea._factBullets) continue;
      for (var bi = ea._factBullets.length - 1; bi >= 0; bi--) {
        var fb = ea._factBullets[bi];
        fb.mesh.position.addScaledVector(fb.vel, dt);
        fb.life -= dt;
        var hitTarget = false;
        if (fb.target && fb.target.alive) {
          if (_dist(fb.mesh.position, fb.target.mesh.position) < 1.2) {
            fb.target.hp -= 25;
            hitTarget = true;
            if (fb.target.hp <= 0) {
              _killEnemy(fb.target);
            }
          }
        }
        if (fb.life <= 0 || hitTarget) {
          _scene.remove(fb.mesh);
          ea._factBullets.splice(bi, 1);
        }
      }
    }
  }

  function _killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    _scene.remove(e.mesh);
    if (e.district >= 0 && e.district < 5) {
      _districtEnemyCounts[e.district] = Math.max(0, _districtEnemyCounts[e.district] - 1);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HIT MEN                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _spawnHitMen() {
    if (_hitMenActive) return;
    _hitMenActive = true;
    _showMessage('BOSS PUT A CONTRACT ON YOU! HIT MEN INCOMING!', '#FF4444', 4000);

    /* 3 hit men from random directions */
    var angles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
    for (var i = 0; i < 3; i++) {
      var angle = angles[i] + (Math.random() - 0.5) * 0.5;
      var spawnDist = 55;
      var sx = Math.cos(angle) * spawnDist;
      var sz = Math.sin(angle) * spawnDist;

      var g = new THREE.Group();
      var body = _cyl(0.3, 0.3, 1.7, 8, 0x880022);
      body.position.y = 0.85;
      g.add(body);
      var head = _sphere(0.26, 0x880022);
      head.position.y = 1.92;
      g.add(head);
      var gun = _box(0.1, 0.1, 0.9, 0x111111);
      gun.position.set(0.35, 1.1, 0.45);
      g.add(gun);
      /* Red sunglasses accent */
      var glasses = _box(0.4, 0.1, 0.05, 0xFF0000);
      glasses.position.set(0, 1.9, 0.26);
      g.add(glasses);
      g.position.set(sx, 0, sz);
      _scene.add(g);
      _hitMen.push({ mesh: g, hp: 200, alive: true, fireTimer: 1 + Math.random() });
    }
  }

  function _updateHitMen(dt) {
    for (var i = 0; i < _hitMen.length; i++) {
      var h = _hitMen[i];
      if (!h.alive) continue;
      /* Move toward player */
      var toPlayer = _playerPos.clone().sub(h.mesh.position);
      var dist = toPlayer.length();
      if (dist > 3) {
        toPlayer.normalize();
        h.mesh.position.addScaledVector(toPlayer, 4.5 * dt);
      }
      h.mesh.lookAt(_playerPos);
      /* Fire */
      h.fireTimer -= dt;
      if (h.fireTimer <= 0 && dist < 25) {
        _fireEnemyBullet(h.mesh.position.clone().setY(h.mesh.position.y + 1.2));
        h.fireTimer = 0.8 + Math.random() * 0.5;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  POLICE SYSTEM                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updatePolice(dt) {
    /* Natural heat decay when calm */
    if (!_swatActive && _policeOfficers.length === 0 && _hitMen.length === 0) {
      _policeHeat = Math.max(0, _policeHeat - 0.3 * dt);
    }

    /* Heat thresholds */
    if (_policeHeat >= 50 && !_patrolCarActive) {
      _spawnPatrolCar();
    }
    if (_policeHeat >= 80 && _policeOfficers.length === 0) {
      _spawnPoliceOfficers();
    }
    if (_policeHeat >= 100 && !_swatActive) {
      _spawnSWAT();
    }

    /* Update patrol car */
    if (_patrolCarActive && _patrolCar) {
      var toPlayer = _playerPos.clone().sub(_patrolCarPos);
      if (toPlayer.length() > 4) {
        toPlayer.normalize();
        _patrolCarPos.addScaledVector(toPlayer, 6 * dt);
        _patrolCar.position.copy(_patrolCarPos);
        _patrolCar.lookAt(_playerPos);
      }
    }

    /* Update police officers */
    for (var i = _policeOfficers.length - 1; i >= 0; i--) {
      var po = _policeOfficers[i];
      if (!po.alive) { _policeOfficers.splice(i, 1); continue; }
      var toPl = _playerPos.clone().sub(po.mesh.position);
      if (toPl.length() > 2.5) {
        toPl.normalize();
        po.mesh.position.addScaledVector(toPl, 4 * dt);
      }
      po.mesh.lookAt(_playerPos);
      po.fireTimer -= dt;
      if (po.fireTimer <= 0 && _dist(_playerPos, po.mesh.position) < 20) {
        _fireEnemyBullet(po.mesh.position.clone().setY(po.mesh.position.y + 1.2));
        po.fireTimer = 1.0 + Math.random() * 0.5;
      }
    }

    /* Update SWAT */
    for (var j = _swatTeam.length - 1; j >= 0; j--) {
      var sw = _swatTeam[j];
      if (!sw.alive) { _swatTeam.splice(j, 1); continue; }
      var toPl2 = _playerPos.clone().sub(sw.mesh.position);
      if (toPl2.length() > 2) {
        toPl2.normalize();
        sw.mesh.position.addScaledVector(toPl2, 5 * dt);
      }
      sw.mesh.lookAt(_playerPos);
      sw.fireTimer -= dt;
      if (sw.fireTimer <= 0 && _dist(_playerPos, sw.mesh.position) < 25) {
        _fireEnemyBullet(sw.mesh.position.clone().setY(sw.mesh.position.y + 1.2));
        sw.fireTimer = 0.6 + Math.random() * 0.3;
      }
    }
  }

  function _spawnPatrolCar() {
    _patrolCarActive = true;
    var car = new THREE.Group();
    var body = _box(2.5, 1.2, 5, 0x334455);
    body.position.y = 0.6;
    car.add(body);
    /* Light bar */
    var bar = _box(1.8, 0.3, 0.8, 0x2244AA);
    bar.position.set(0, 1.35, 0);
    car.add(bar);
    var lightR = _box(0.4, 0.25, 0.3, 0xFF2222);
    lightR.position.set(-0.6, 1.45, 0);
    car.add(lightR);
    var lightB = _box(0.4, 0.25, 0.3, 0x2222FF);
    lightB.position.set(0.6, 1.45, 0);
    car.add(lightB);
    /* Wheels */
    for (var w = 0; w < 4; w++) {
      var wx = (w % 2 === 0) ? -1.3 : 1.3;
      var wz = (w < 2) ? 1.5 : -1.5;
      var whl = _cyl(0.4, 0.4, 0.25, 8, 0x111111);
      whl.rotation.z = Math.PI / 2;
      whl.position.set(wx, 0, wz);
      car.add(whl);
    }
    car.position.set(_playerPos.x + 30, 0, _playerPos.z);
    _scene.add(car);
    _patrolCar = car;
    _patrolCarPos = car.position;
    _showMessage('PATROL CAR SPOTTED — LAY LOW!', '#FFAA44', 3000);
  }

  function _spawnPoliceOfficers() {
    _showMessage('OFFICERS CONVERGING — HIGH ALERT!', '#FF8844', 3000);
    var angles2 = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
    for (var i = 0; i < 4; i++) {
      var g = new THREE.Group();
      var body = _box(0.55, 1.6, 0.4, 0x334455);
      body.position.y = 0.8;
      g.add(body);
      var badge2 = _box(0.18, 0.18, 0.08, 0xFFD700);
      badge2.position.set(0, 1.2, 0.24);
      g.add(badge2);
      var head2 = _sphere(0.24, 0x997755);
      head2.position.y = 1.88;
      g.add(head2);
      var hat2 = _box(0.48, 0.18, 0.48, 0x223344);
      hat2.position.y = 2.12;
      g.add(hat2);
      var px = _playerPos.x + Math.cos(angles2[i]) * 30;
      var pz = _playerPos.z + Math.sin(angles2[i]) * 30;
      g.position.set(px, 0, pz);
      _scene.add(g);
      _policeOfficers.push({ mesh: g, hp: 80, alive: true, fireTimer: 1.2 + Math.random() });
    }
  }

  function _spawnSWAT() {
    _swatActive = true;
    _showMessage('SWAT TEAM DEPLOYED — WANTED DEAD OR ALIVE!', '#FF2222', 4000);
    for (var i = 0; i < 6; i++) {
      var g = new THREE.Group();
      var body = _box(0.6, 1.7, 0.45, 0x223322);
      body.position.y = 0.85;
      g.add(body);
      /* Armor plates */
      var armor = _box(0.65, 0.8, 0.12, 0x111811);
      armor.position.set(0, 1.0, 0.26);
      g.add(armor);
      var helmet = _box(0.52, 0.35, 0.52, 0x223322);
      helmet.position.y = 2.1;
      g.add(helmet);
      var visor = _box(0.48, 0.18, 0.05, 0x445544);
      visor.position.set(0, 2.02, 0.28);
      g.add(visor);
      var rifle = _box(0.09, 0.09, 1.1, 0x222222);
      rifle.position.set(0.32, 1.15, 0.55);
      g.add(rifle);
      var angle3 = (Math.PI * 2 / 6) * i;
      var sx = _playerPos.x + Math.cos(angle3) * 40;
      var sz = _playerPos.z + Math.sin(angle3) * 40;
      g.position.set(sx, 0, sz);
      _scene.add(g);
      _swatTeam.push({ mesh: g, hp: 150, alive: true, fireTimer: 0.5 + Math.random() * 0.5 });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  TERRITORY / INCOME                                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateGoldIncome(dt) {
    _goldTimer += dt;
    if (_goldTimer >= 30) {
      _goldTimer -= 30;
      var territory = _playerControlledCount();
      var passiveGold = territory * 10;
      /* Business income: +20 gold/min = +10 gold/30s */
      var bizGold = 0;
      for (var i = 0; i < _businesses.length; i++) {
        if (_businesses[i].incomeActive) bizGold += 10;
      }
      var total = passiveGold + bizGold;
      if (total > 0) {
        _gold += total;
        _showMessage('+' + total + ' GOLD (territory income)', '#FFD700', 2000);
      }
    }
  }

  function _checkDistrictCapture() {
    /* If all enemies in a player-adjacent district are dead, allow planting */
    for (var di = 0; di < 5; di++) {
      /* Count living enemies in this district */
      var alive = 0;
      for (var ei = 0; ei < _enemies.length; ei++) {
        var e = _enemies[ei];
        if (e.alive && e.district === di) alive++;
      }
      _districtEnemyCounts[di] = alive;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  E KEY — INTERACT / HOLD                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _startInteract() {
    if (!_playerPos) return;

    /* Check payoff police officer */
    if (_policeOfficerPos && _dist(_playerPos, _policeOfficerPos) < 4) {
      _eTargetType = 'payoff';
      _eTargetIndex = 0;
      _eHeld = true;
      _eHoldTimer = 0;
      return;
    }

    /* Check businesses */
    for (var bi = 0; bi < _businesses.length; bi++) {
      var biz = _businesses[bi];
      if (biz.incomeActive) continue;
      if (_dist(_playerPos, biz.pos) < 5) {
        _eTargetType = 'business';
        _eTargetIndex = bi;
        _eHeld = true;
        _eHoldTimer = 0;
        return;
      }
    }

    /* Check district flag planting */
    for (var di = 0; di < 5; di++) {
      var cx = DISTRICTS[di].cx;
      var cz = DISTRICTS[di].cz;
      var d = _distXZ(_playerPos, _v3(cx, 0, cz));
      if (d < 12) {
        /* Must have cleared the district */
        if (_districtEnemyCounts[di] === 0 && _districtOwner[di] !== 0) {
          _eTargetType = 'flag';
          _eTargetIndex = di;
          _eHeld = true;
          _eHoldTimer = 0;
          return;
        }
      }
    }
  }

  function _updateInteract(dt) {
    if (!_eHeld) return;

    /* Check key still down */
    if (!_keys['e']) {
      _eHeld = false;
      _eHoldTimer = 0;
      _eTargetType = '';
      return;
    }

    _eHoldTimer += dt;

    if (_eTargetType === 'flag') {
      if (_eHoldTimer >= 5) {
        _captureDistrict(_eTargetIndex);
        _eHeld = false;
        _eHoldTimer = 0;
        _eTargetType = '';
      }
    } else if (_eTargetType === 'business') {
      if (_eHoldTimer >= 3) {
        _intimidateBusiness(_eTargetIndex);
        _eHeld = false;
        _eHoldTimer = 0;
        _eTargetType = '';
      }
    } else if (_eTargetType === 'payoff') {
      if (_eHoldTimer >= 1) {
        _payoffPolice();
        _eHeld = false;
        _eHoldTimer = 0;
        _eTargetType = '';
      }
    }
  }

  function _captureDistrict(di) {
    _districtOwner[di] = 0;
    _setDistrictColor(di, 0);
    _plantFlagMesh(di);
    _showMessage('DISTRICT CAPTURED: ' + DISTRICTS[di].name.toUpperCase() + ' (+10 GOLD/30s)', '#FFD700', 3500);
    _policeHeat = Math.min(100, _policeHeat + 15);

    /* Check for sitdown offer */
    if (_playerControlledCount() >= 3 && !_sitdownOffered) {
      _offerSitdown();
    }

    /* Check for victory */
    if (_playerControlledCount() === 5) {
      _gameOver = true;
      _showResult(true);
    }
  }

  function _intimidateBusiness(bi) {
    _businesses[bi].incomeActive = true;
    _businesses[bi].owner = 0;
    _businesses[bi].mesh.material.color.setHex(0x334499);
    _showMessage('BUSINESS UNDER PROTECTION (+20 GOLD/MIN, HEAT +10%)', '#FFD700', 3000);
    _policeHeat = Math.min(100, _policeHeat + 10);
  }

  function _payoffPolice() {
    if (_gold < 200) {
      _showMessage('NOT ENOUGH GOLD (need 200)', '#FF4444', 2000);
      return;
    }
    _gold -= 200;
    _policeHeat = Math.max(0, _policeHeat * 0.7);
    _showMessage('POLICE PAID OFF! HEAT -30%', '#44FF44', 3000);
    /* Officer walks away */
    if (_policeOfficer) {
      _policeOfficer.position.set(60, 0, 60);
      _policeOfficerPos = _policeOfficer.position;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UNDERBOSS SITDOWN                                                       */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _offerSitdown() {
    _sitdownOffered = true;
    _sitdownActive = true;

    /* Show bosses at neutral meeting point */
    for (var i = 0; i < _rival_bosses.length; i++) {
      _rival_bosses[i].mesh.visible = true;
      _rival_bosses[i].mesh.position.set(i * 6 - 6, 0, -20);
    }

    /* Prompt UI */
    _sitdownPromptEl = document.createElement('div');
    _sitdownPromptEl.style.cssText = [
      'position:fixed',
      'top:55%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:16px',
      'padding:20px 32px',
      'border:2px solid #FFD700',
      'border-radius:6px',
      'z-index:9997',
      'text-align:center'
    ].join(';');
    _sitdownPromptEl.innerHTML =
      'RIVAL BOSSES REQUEST SITDOWN<br>' +
      '<span style="color:#AAAAFF">Press Y — Accept Peace (3 minutes)<br>' +
      'Press N — BETRAY: Ambush All Bosses (decisive win)</span>';
    document.body.appendChild(_sitdownPromptEl);
    _showMessage('THE COMMISSION CALLS A SITDOWN', '#FFD700', 4000);
  }

  function _acceptSitdown() {
    if (!_sitdownActive) return;
    _sitdownActive = false;
    _sitdownAccepted = true;
    _sitdownTimer = 180; /* 3 minutes */
    if (_sitdownPromptEl && _sitdownPromptEl.parentNode) {
      _sitdownPromptEl.parentNode.removeChild(_sitdownPromptEl);
      _sitdownPromptEl = null;
    }
    /* Bosses disappear */
    for (var i = 0; i < _rival_bosses.length; i++) {
      _rival_bosses[i].mesh.visible = false;
    }
    /* Pause all enemy aggression */
    _showMessage('PEACE TREATY AGREED — 3 MINUTE CEASEFIRE', '#44FF44', 4000);
  }

  function _betraySitdown() {
    if (!_sitdownActive) return;
    _sitdownActive = false;
    if (_sitdownPromptEl && _sitdownPromptEl.parentNode) {
      _sitdownPromptEl.parentNode.removeChild(_sitdownPromptEl);
      _sitdownPromptEl = null;
    }
    /* Make bosses aggressive */
    _showMessage('AMBUSH! TAKE OUT ALL THREE BOSSES!', '#FF2222', 4000);
    for (var i = 0; i < _rival_bosses.length; i++) {
      _rival_bosses[i].mesh.visible = true;
      _rival_bosses[i].mesh.position.set((i - 1) * 8, 0, -15);
    }
  }

  function _updateSitdown(dt) {
    if (!_sitdownAccepted) return;
    _sitdownTimer -= dt;
    if (_sitdownTimer <= 0) {
      _sitdownAccepted = false;
      _showMessage('PEACE TREATY EXPIRED — WAR RESUMES', '#FF4444', 3000);
    }
  }

  function _updateRivalBosses(dt) {
    for (var i = 0; i < _rival_bosses.length; i++) {
      var rb = _rival_bosses[i];
      if (!rb.alive || !rb.mesh.visible) continue;

      /* Move toward player */
      var toPlayer = _playerPos.clone().sub(rb.mesh.position);
      if (toPlayer.length() > 4) {
        toPlayer.normalize();
        rb.mesh.position.addScaledVector(toPlayer, 2.5 * dt);
      }
      rb.mesh.lookAt(_playerPos);

      /* Fire */
      rb.fireTimer -= dt;
      if (rb.fireTimer <= 0 && _dist(_playerPos, rb.mesh.position) < 30) {
        _fireEnemyBullet(rb.mesh.position.clone().setY(rb.mesh.position.y + 2.5));
        rb.fireTimer = 0.6 + Math.random() * 0.4;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BULLETS UPDATE                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateBullets(dt) {
    var i;
    /* Player + made men bullets */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      pb.mesh.position.addScaledVector(pb.vel, dt);
      pb.life -= dt;
      if (pb.life <= 0) {
        _scene.remove(pb.mesh);
        _playerBullets.splice(i, 1);
      }
    }
    /* Enemy bullets */
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
  /*  COLLISION CHECKS                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkCollisions() {
    var i, j;

    /* Player+mademen bullets vs enemies */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      var pb = _playerBullets[i];
      var hit = false;

      /* vs faction enemies */
      for (j = 0; j < _enemies.length; j++) {
        var e = _enemies[j];
        if (!e.alive) continue;
        if (_dist(pb.mesh.position, e.mesh.position) < 1.2) {
          e.hp -= pb.fromMadeMen ? 20 : 35;
          if (e.hp <= 0) { _killEnemy(e); }
          hit = true; break;
        }
      }
      if (!hit) {
        /* vs hit men */
        for (j = 0; j < _hitMen.length; j++) {
          var h = _hitMen[j];
          if (!h.alive) continue;
          if (_dist(pb.mesh.position, h.mesh.position) < 1.2) {
            h.hp -= pb.fromMadeMen ? 20 : 35;
            if (h.hp <= 0) { h.alive = false; _scene.remove(h.mesh); }
            hit = true; break;
          }
        }
      }
      if (!hit) {
        /* vs police officers */
        for (j = 0; j < _policeOfficers.length; j++) {
          var po = _policeOfficers[j];
          if (!po.alive) continue;
          if (_dist(pb.mesh.position, po.mesh.position) < 1.2) {
            po.hp -= pb.fromMadeMen ? 15 : 30;
            if (po.hp <= 0) { po.alive = false; _scene.remove(po.mesh); }
            _policeHeat = Math.min(100, _policeHeat + 20);
            hit = true; break;
          }
        }
      }
      if (!hit) {
        /* vs SWAT */
        for (j = 0; j < _swatTeam.length; j++) {
          var sw = _swatTeam[j];
          if (!sw.alive) continue;
          if (_dist(pb.mesh.position, sw.mesh.position) < 1.2) {
            sw.hp -= pb.fromMadeMen ? 15 : 30;
            if (sw.hp <= 0) { sw.alive = false; _scene.remove(sw.mesh); }
            _policeHeat = Math.min(100, _policeHeat + 25);
            hit = true; break;
          }
        }
      }
      if (!hit) {
        /* vs rival bosses */
        for (j = 0; j < _rival_bosses.length; j++) {
          var rb = _rival_bosses[j];
          if (!rb.alive || !rb.mesh.visible) continue;
          if (_dist(pb.mesh.position, rb.mesh.position) < 2) {
            rb.hp -= pb.fromMadeMen ? 20 : 50;
            if (rb.hp <= 0) {
              rb.alive = false;
              _scene.remove(rb.mesh);
              rb.mesh.visible = false;
              _showMessage(FACTIONS[rb.faction].name + ' BOSS ELIMINATED!', '#FFD700', 3000);
              /* Check all bosses dead for decisive win */
              var allBossesDead = true;
              for (var bi2 = 0; bi2 < _rival_bosses.length; bi2++) {
                if (_rival_bosses[bi2].alive) { allBossesDead = false; break; }
              }
              if (allBossesDead) {
                _gameOver = true;
                _showResult(true);
              }
            }
            hit = true; break;
          }
        }
      }

      if (hit) {
        _scene.remove(pb.mesh);
        _playerBullets.splice(i, 1);
      }
    }

    /* Enemy bullets vs player */
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      var eb = _enemyBullets[i];
      if (_dist(eb.mesh.position, _playerPos) < 1.0) {
        _playerHP -= 10;
        _scene.remove(eb.mesh);
        _enemyBullets.splice(i, 1);
        if (_playerHP <= 0 && !_gameOver) {
          _gameOver = true;
          _showResult(false);
        }
      }
    }

    /* Enemy bullets vs made men */
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      var eb2 = _enemyBullets[i];
      if (!eb2) continue;
      for (j = 0; j < _madeMen.length; j++) {
        var mm = _madeMen[j];
        if (!mm.alive) continue;
        if (_dist(eb2.mesh.position, mm.mesh.position) < 1.0) {
          mm.hp -= 12;
          if (mm.hp <= 0) { mm.alive = false; _scene.remove(mm.mesh); }
          _scene.remove(eb2.mesh);
          _enemyBullets.splice(i, 1);
          break;
        }
      }
    }

    /* Hit men kill made men too */
    for (i = 0; i < _hitMen.length; i++) {
      var hitm = _hitMen[i];
      if (!hitm.alive) continue;
      for (j = 0; j < _madeMen.length; j++) {
        var mm2 = _madeMen[j];
        if (!mm2.alive) continue;
        if (_dist(hitm.mesh.position, mm2.mesh.position) < 1.5) {
          /* melee */
          mm2.hp -= 20 * 0.016; /* approximate per-frame damage */
          if (mm2.hp <= 0) { mm2.alive = false; _scene.remove(mm2.mesh); }
        }
      }
    }

    /* Enemy enemies check: all enemies of a faction gone = that faction loses district */
    _checkFactionDistrictLoss();
  }

  function _checkFactionDistrictLoss() {
    /* If all enemies of a faction in a district are dead, that district may go neutral or be fought over */
    for (var di = 0; di < 5; di++) {
      var ownerFac = _districtOwner[di] - 1; /* faction index */
      if (ownerFac < 0) continue; /* neutral or player */
      /* Count alive enemies of that faction in that district */
      var alive = 0;
      for (var ei = 0; ei < _enemies.length; ei++) {
        var e = _enemies[ei];
        if (!e.alive) continue;
        if (e.faction === ownerFac && e.district === di) alive++;
      }
      if (alive === 0) {
        /* District goes neutral — rival factions may fight over it */
        if (_districtOwner[di] !== 0) {
          _districtOwner[di] = -1;
          _setDistrictColor(di, -1);
          _removeFlagMesh(di);
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HIT MEN TRIGGER                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _checkHitMenTrigger() {
    /* Check if all faction districts gone = 0 */
    var totalFactionDist = 0;
    for (var di = 0; di < 5; di++) {
      if (_districtOwner[di] > 0) totalFactionDist++;
    }
    if (totalFactionDist === 0 && !_hitMenActive && !_gameOver) {
      _spawnHitMen();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PATROL KEY (4) — ASSIGN MADE MEN                                       */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _assignPatrol() {
    /* Find which district player is in */
    for (var di = 0; di < 5; di++) {
      if (_districtOwner[di] === 0) {
        var cx = DISTRICTS[di].cx;
        var cz = DISTRICTS[di].cz;
        if (_distXZ(_playerPos, _v3(cx, 0, cz)) < 12) {
          /* Assign all alive made men to patrol this district */
          for (var i = 0; i < _madeMen.length; i++) {
            if (_madeMen[i].alive) {
              _madeMen[i].patrolDistrict = di;
            }
          }
          _madeMenPatrolDist = di;
          _showMessage('MADE MEN ASSIGNED TO PATROL: ' + DISTRICTS[di].name.toUpperCase(), '#AAAAFF', 2500);
          return;
        }
      }
    }
    _showMessage('NO CAPTURED DISTRICT NEARBY', '#FF8844', 2000);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INPUT                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    /* Activation: M+W within 400ms */
    if (k === 'm') _mPressTime = performance.now();
    if (k === 'w' && !_active) _wPressTime = performance.now();
    if (k === 'm' && _keys['w'] && Math.abs(_mPressTime - _wPressTime) < 400) {
      if (!_active) { _activate(); return; }
    }
    if (k === 'w' && _keys['m'] && Math.abs(_mPressTime - _wPressTime) < 400) {
      if (!_active) { _activate(); return; }
    }

    if (!_active) return;

    /* Made men orders */
    if (k === '1') {
      _madeMenOrder = 'attack';
      /* Remove patrol assignment */
      for (var i = 0; i < _madeMen.length; i++) { _madeMen[i].patrolDistrict = -1; }
      _showMessage('MADE MEN: ATTACK!', '#FF8844', 1500);
    }
    if (k === '2') {
      _madeMenOrder = 'hold';
      _showMessage('MADE MEN: HOLD FORMATION', '#AAAAFF', 1500);
    }
    if (k === '3') {
      _madeMenOrder = 'spread';
      _showMessage('MADE MEN: SPREAD OUT', '#AAFFAA', 1500);
    }
    if (k === '4') { _assignPatrol(); }

    /* Sitdown response */
    if (k === 'y' && _sitdownActive) { _acceptSitdown(); }
    if (k === 'n' && _sitdownActive) { _betraySitdown(); }

    /* Pay off police */
    if (k === 'p') {
      if (_policeOfficerPos && _dist(_playerPos, _policeOfficerPos) < 6) {
        _payoffPolice();
      }
    }

    /* E — start hold-interact */
    if (k === 'e') { _startInteract(); }
  }

  function _onKeyUp(e) {
    _keys[e.key.toLowerCase()] = false;
    if (e.key.toLowerCase() === 'e') {
      _eHeld = false;
      _eHoldTimer = 0;
      _eTargetType = '';
    }
  }

  function _onMouseMove(e) {
    if (!_active) return;
    _mouseX += e.movementX * 0.002;
    _mouseY += e.movementY * 0.002;
    _mouseY  = Math.max(-0.7, Math.min(0.7, _mouseY));
    _yaw     = -_mouseX;
    _pitch   = -_mouseY;
  }

  function _onClick() {
    if (!_active) return;
    if (_fireTimer <= 0) {
      _firePlayerBullet();
      _fireTimer = _fireRate;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ACTIVATE                                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _activate() {
    if (_active) return;
    _active = true;
    _buildCity();
    _buildBusinesses();
    _buildPoliceOfficer();
    _buildSafehouse();
    _buildInitialEnemies();
    _buildMadeMen();
    _buildRivalBosses();
    _buildPlayer();
    _buildHUD();
    if (_canvas) {
      _canvas.requestPointerLock = _canvas.requestPointerLock || _canvas.mozRequestPointerLock;
      if (_canvas.requestPointerLock) _canvas.requestPointerLock();
    }
    _showMessage('MOB WAR ACTIVATED — TAKE THE CITY!', '#FFD700', 4000);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  UPDATE                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _update(dt) {
    if (!_active || _gameOver) return;

    _gameTime += dt;
    _fireTimer = Math.max(0, _fireTimer - dt);

    /* Clamp heat */
    _policeHeat = Math.max(0, Math.min(100, _policeHeat));

    _updatePlayer(dt);
    _updateMadeMen(dt);
    _updateEnemies(dt);
    _updateHitMen(dt);
    _updateRivalBosses(dt);
    _updatePolice(dt);
    _updateBullets(dt);
    _checkCollisions();
    _checkDistrictCapture();
    _checkHitMenTrigger();
    _updateInteract(dt);
    _updateSitdown(dt);
    _updateGoldIncome(dt);
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  RESET                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _reset() {
    _active           = false;
    _gold             = 100;
    _policeHeat       = 0;
    _gameTime         = 0;
    _goldTimer        = 0;
    _gameOver         = false;
    _madeMenOrder     = 'hold';
    _madeMenPatrolDist = -1;
    _hitMenActive     = false;
    _patrolCarActive  = false;
    _swatActive       = false;
    _sitdownOffered   = false;
    _sitdownActive    = false;
    _sitdownAccepted  = false;
    _sitdownTimer     = 0;
    _playerHP         = 200;
    _fireTimer        = 0;
    _mouseX           = 0;
    _mouseY           = 0;
    _yaw              = 0;
    _pitch            = 0;
    _eHeld            = false;
    _eHoldTimer       = 0;
    _eTargetType      = '';
    _eTargetIndex     = -1;
    _layLowTimer      = 0;
    _mPressTime       = 0;
    _wPressTime       = 0;

    /* Remove meshes from scene */
    var i;
    for (i = 0; i < _enemies.length; i++) {
      if (_enemies[i].mesh && _scene) _scene.remove(_enemies[i].mesh);
      if (_enemies[i]._factBullets) {
        for (var bi = 0; bi < _enemies[i]._factBullets.length; bi++) {
          _scene.remove(_enemies[i]._factBullets[bi].mesh);
        }
      }
    }
    for (i = 0; i < _madeMen.length; i++) {
      if (_madeMen[i].mesh && _scene) _scene.remove(_madeMen[i].mesh);
    }
    for (i = 0; i < _hitMen.length; i++) {
      if (_hitMen[i].mesh && _scene) _scene.remove(_hitMen[i].mesh);
    }
    for (i = 0; i < _policeOfficers.length; i++) {
      if (_policeOfficers[i].mesh && _scene) _scene.remove(_policeOfficers[i].mesh);
    }
    for (i = 0; i < _swatTeam.length; i++) {
      if (_swatTeam[i].mesh && _scene) _scene.remove(_swatTeam[i].mesh);
    }
    for (i = 0; i < _rival_bosses.length; i++) {
      if (_rival_bosses[i].mesh && _scene) _scene.remove(_rival_bosses[i].mesh);
    }
    for (i = 0; i < _playerBullets.length; i++) {
      if (_playerBullets[i].mesh && _scene) _scene.remove(_playerBullets[i].mesh);
    }
    for (i = 0; i < _enemyBullets.length; i++) {
      if (_enemyBullets[i].mesh && _scene) _scene.remove(_enemyBullets[i].mesh);
    }
    for (i = 0; i < _districtFlags.length; i++) {
      if (_districtFlags[i] && _scene) _scene.remove(_districtFlags[i]);
    }
    for (i = 0; i < _districtBuildings.length; i++) {
      var bldgs = _districtBuildings[i];
      for (var bi2 = 0; bi2 < bldgs.length; bi2++) {
        if (_scene) _scene.remove(bldgs[bi2]);
      }
    }
    for (i = 0; i < _districtFloors.length; i++) {
      if (_scene) _scene.remove(_districtFloors[i]);
    }
    for (i = 0; i < _businesses.length; i++) {
      if (_businesses[i].mesh && _scene) _scene.remove(_businesses[i].mesh);
    }
    if (_patrolCar && _scene)     _scene.remove(_patrolCar);
    if (_safehouse && _scene)     _scene.remove(_safehouse);
    if (_policeOfficer && _scene) _scene.remove(_policeOfficer);
    if (_player && _scene)        _scene.remove(_player);

    if (_sitdownPromptEl && _sitdownPromptEl.parentNode) {
      _sitdownPromptEl.parentNode.removeChild(_sitdownPromptEl);
      _sitdownPromptEl = null;
    }

    /* Reset arrays */
    _enemies          = [];
    _madeMen          = [];
    _hitMen           = [];
    _policeOfficers   = [];
    _swatTeam         = [];
    _rival_bosses     = [];
    _playerBullets    = [];
    _enemyBullets     = [];
    _businesses       = [];
    _districtFlags    = [];
    _districtBuildings = [];
    _districtFloors   = [];
    _districtOwner    = [-1, -1, -1, -1, -1];
    _districtEnemyCounts = [0, 0, 0, 0, 0];

    _patrolCar        = null;
    _patrolCarPos     = null;
    _safehouse        = null;
    _safehousePos     = null;
    _policeOfficer    = null;
    _policeOfficerPos = null;
    _player           = null;
    _playerPos        = null;

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
