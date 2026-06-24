/* ═══════════════════════════════════════════════════════════════════════════
   oil-rig-siege.js  —  Offshore Oil Rig Hostage Rescue
   Activation : press O + R simultaneously (within 400 ms)
   E (hold 3s) : defuse detonator when within 2 units
   Public API  : window.OilRigSiege = { init, update, reset }
   ═══════════════════════════════════════════════════════════════════════════ */
window.OilRigSiege = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var ACT_WINDOW        = 400;    // ms between O and R presses
  var PLATFORM_Y        = 0;      // main deck Y
  var WATER_Y           = -12;    // sea surface
  var ENEMY_COUNT       = 8;
  var HOSTAGE_COUNT     = 6;
  var ENEMY_SIGHT       = 28;     // detection radius
  var ENEMY_SPEED       = 3.5;
  var DEFUSE_TIME       = 3;      // seconds to hold E
  var DEFUSE_RANGE      = 2;      // units to detonator
  var BOB_AMPLITUDE     = 0.18;   // ocean wave bob height
  var BOB_FREQ          = 0.55;   // wave frequency (rad/s)
  var FLARE_PULSE       = 4;      // flare intensity oscillation speed
  var PATROL_RADIUS     = 6;
  var PATROL_SPEED      = 2.2;

  /* ── colors ────────────────────────────────────────────────────────────── */
  var COL_STEEL         = 0x556677;
  var COL_DARK_STEEL    = 0x334455;
  var COL_DECK          = 0x667788;
  var COL_PIPE          = 0xAA6633;
  var COL_DERRICK       = 0xFF9900;
  var COL_HELIPAD       = 0x2A2A2A;
  var COL_HELIPAD_MARK  = 0xFFFF00;
  var COL_QUARTERS      = 0x445566;
  var COL_WINDOW        = 0x88BBFF;
  var COL_FLARE         = 0xFF5500;
  var COL_FIRE          = 0xFF3300;
  var COL_CHAIN         = 0x888888;
  var COL_WATER         = 0x002244;
  var COL_ENEMY         = 0x223344;
  var COL_MASK          = 0x445533;
  var COL_HEAD          = 0x445533;
  var COL_DEAD          = 0x111122;
  var COL_HOSTAGE       = 0xDDCC99;
  var COL_RESCUED       = 0x88FFAA;
  var COL_DETONATOR     = 0xFF2200;
  var COL_DEFUSED       = 0x00FF88;
  var COL_WIRE          = 0xFF0000;

  /* ── module state ──────────────────────────────────────────────────────── */
  var _active     = false;
  var _scene      = null;
  var _camera     = null;
  var _time       = 0;

  /* activation tracking */
  var _oTime      = 0;
  var _rTime      = 0;

  /* keys held */
  var _keys       = {};

  /* player proxy (camera = player eye) */
  var _px = 0, _py = PLATFORM_Y + 1.7, _pz = 20;

  /* objects for reset */
  var _allMeshes  = [];

  /* rig root group — bobbed as a whole */
  var _rigGroup   = null;

  /* sub-objects */
  var _derrickParts = [];
  var _pipeParts    = [];
  var _flareStack   = null;
  var _flareLight   = null;
  var _fireParts    = [];

  /* anchor chain lines */
  var _chainLines   = [];

  /* ocean */
  var _ocean        = null;

  /* enemies */
  var _enemies      = [];
  /* { mesh, headMesh, maskMesh, alive, px, py, pz,
       patrolCx, patrolCz, patrolAngle, alertTimer, alerted } */

  /* hostages */
  var _hostages     = [];
  /* { mesh, rescued, px, pz } */

  /* detonator */
  var _detonator    = null;
  /* { mesh, wireMesh, armed, defusing, defuseTimer } */

  /* HUD */
  var _hudEl        = null;

  /* interact */
  var _eHolding     = false;
  var _eTimer       = 0;

  /* notification */
  var _notifEl      = null;
  var _notifTimer   = 0;

  /* ── helpers ────────────────────────────────────────────────────────────── */
  function _mat(color, emissive) {
    return new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive || 0x000000
    });
  }

  function _box(w, h, d, color, emissive) {
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(g, _mat(color, emissive));
    return m;
  }

  function _cyl(rt, rb, h, segs, color, emissive) {
    var g = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var m = new THREE.Mesh(g, _mat(color, emissive));
    return m;
  }

  function _sphere(r, segs, color, emissive) {
    var g = new THREE.SphereGeometry(r, segs || 8, segs || 6);
    var m = new THREE.Mesh(g, _mat(color, emissive));
    return m;
  }

  function _cone(r, h, segs, color) {
    var g = new THREE.ConeGeometry(r, h, segs || 8);
    var m = new THREE.Mesh(g, _mat(color));
    return m;
  }

  function _add(mesh) {
    _rigGroup.add(mesh);
    _allMeshes.push(mesh);
    return mesh;
  }

  function _addScene(mesh) {
    _scene.add(mesh);
    _allMeshes.push(mesh);
    return mesh;
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(ax, ay, az, bx, by, bz) {
    var dx = ax - bx, dy = ay - by, dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /* ── build scene ─────────────────────────────────────────────────────── */

  function _buildOcean() {
    var m = _box(300, 4, 300, COL_WATER);
    m.position.set(0, WATER_Y - 2, 0);
    _addScene(m);
    _ocean = m;
  }

  function _buildPlatform() {
    /* main deck */
    var deck = _box(40, 2, 40, COL_DECK);
    deck.position.set(0, -1, 0);
    _add(deck);

    /* raised walkway north */
    var walkN = _box(10, 1, 12, COL_STEEL);
    walkN.position.set(0, 0, -24);
    _add(walkN);

    /* raised walkway south */
    var walkS = _box(10, 1, 8, COL_STEEL);
    walkS.position.set(0, 0, 24);
    _add(walkS);

    /* support legs — four corner cylinders */
    var legPos = [[-16, -17, -16], [16, -17, -16], [-16, -17, 16], [16, -17, 16]];
    for (var i = 0; i < legPos.length; i++) {
      var leg = _cyl(1.2, 1.4, 30, 8, COL_DARK_STEEL);
      leg.position.set(legPos[i][0], legPos[i][1], legPos[i][2]);
      _add(leg);
    }

    /* cross-braces between legs */
    var braceData = [
      [-16, -10, -16, 16, -10, -16],
      [-16, -10, 16,  16, -10,  16],
      [-16, -10, -16, -16, -10, 16],
      [16,  -10, -16,  16, -10,  16]
    ];
    for (var b = 0; b < braceData.length; b++) {
      var bd = braceData[b];
      var dx = bd[3] - bd[0], dy = bd[4] - bd[1], dz = bd[5] - bd[2];
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var brace = _box(len, 0.5, 0.5, COL_DARK_STEEL);
      brace.position.set((bd[0] + bd[3]) / 2, (bd[1] + bd[4]) / 2, (bd[2] + bd[5]) / 2);
      var angle = Math.atan2(dz, dx);
      brace.rotation.y = -angle;
      _add(brace);
    }
  }

  function _buildDerrick() {
    /* base tower — stacked boxes to simulate lattice */
    var heights = [0, 6, 11, 15, 18];
    for (var i = 0; i < heights.length; i++) {
      var scale = 1 - i * 0.12;
      var tower = _box(3 * scale, 5.5, 3 * scale, COL_DERRICK);
      tower.position.set(-12, heights[i] + 3, -8);
      _add(tower);
      _derrickParts.push(tower);
    }

    /* horizontal cross-members */
    for (var c = 0; c < 4; c++) {
      var cross = _box(8, 0.4, 0.4, COL_DERRICK);
      cross.position.set(-12, c * 5 + 4, -8);
      _add(cross);
      _derrickParts.push(cross);

      var crossZ = _box(0.4, 0.4, 8, COL_DERRICK);
      crossZ.position.set(-12, c * 5 + 4, -8);
      _add(crossZ);
      _derrickParts.push(crossZ);
    }

    /* top crown */
    var crown = _cyl(0.3, 1.2, 4, 6, COL_DERRICK);
    crown.position.set(-12, 24, -8);
    _add(crown);
    _derrickParts.push(crown);

    /* pulley hook */
    var hook = _sphere(0.5, 6, 0x888888);
    hook.position.set(-12, 22, -8);
    _add(hook);
    _derrickParts.push(hook);

    /* drill pipe going down */
    var drill = _cyl(0.2, 0.2, 22, 6, 0x666666);
    drill.position.set(-12, 0, -8);
    _add(drill);
    _derrickParts.push(drill);
  }

  function _buildPipes() {
    /* horizontal pipe network across deck */
    var pipeDefs = [
      /* x, y, z, rotY, length */
      [0,  1,   0, 0,         18],
      [0,  1,  -8, 0,         14],
      [-9, 1,   4, Math.PI/2, 16],
      [8,  1,  -4, Math.PI/2, 12],
      [0,  3,   6, 0,         20],
      [-5, 1,  10, Math.PI/2,  8]
    ];
    for (var i = 0; i < pipeDefs.length; i++) {
      var pd = pipeDefs[i];
      var pipe = _cyl(0.3, 0.3, pd[4], 8, COL_PIPE);
      pipe.position.set(pd[0], pd[1], pd[2]);
      pipe.rotation.z = Math.PI / 2;   /* lay horizontal */
      pipe.rotation.y = pd[3];
      _add(pipe);
      _pipeParts.push(pipe);
    }

    /* vertical pipe risers */
    var riserPos = [[4, 2, 8], [-6, 2, -10], [10, 2, 2]];
    for (var r = 0; r < riserPos.length; r++) {
      var rp = riserPos[r];
      var riser = _cyl(0.35, 0.35, 4, 8, COL_PIPE);
      riser.position.set(rp[0], rp[1], rp[2]);
      _add(riser);
      _pipeParts.push(riser);
    }

    /* pipe joint spheres */
    for (var j = 0; j < pipeDefs.length; j++) {
      var jd = pipeDefs[j];
      var joint = _sphere(0.45, 6, 0x886655);
      joint.position.set(jd[0], jd[1], jd[2]);
      _add(joint);
    }
  }

  function _buildHelipad() {
    /* disc helipad — use CylinderGeometry (flat disc) */
    var pad = _cyl(8, 8, 0.3, 16, COL_HELIPAD);
    pad.position.set(14, 0.15, 14);
    _add(pad);

    /* H marking — two crossing boxes */
    var markV = _box(1, 0.31, 7, COL_HELIPAD_MARK);
    markV.position.set(14, 0.31, 14);
    _add(markV);

    var markH = _box(5, 0.31, 1, COL_HELIPAD_MARK);
    markH.position.set(14, 0.31, 14);
    _add(markH);

    /* circle border ring — thin cylinder outline */
    var ring = _cyl(8, 8, 0.15, 24, COL_HELIPAD_MARK);
    ring.position.set(14, 0.23, 14);
    _add(ring);

    /* warning light pylons */
    var pylonPos = [[14 - 7, 0, 14], [14 + 7, 0, 14], [14, 0, 14 - 7], [14, 0, 14 + 7]];
    for (var p = 0; p < pylonPos.length; p++) {
      var pylon = _cyl(0.1, 0.1, 1.5, 6, 0xCC0000, 0x440000);
      pylon.position.set(pylonPos[p][0], 0.75, pylonPos[p][2]);
      _add(pylon);
    }
  }

  function _buildCrewQuarters() {
    /* main module A */
    var modA = _box(12, 5, 8, COL_QUARTERS);
    modA.position.set(8, 2.5, -10);
    _add(modA);

    /* windows A */
    var winPosA = [[-3, 3.5, -10], [0, 3.5, -10], [3, 3.5, -10]];
    for (var w = 0; w < winPosA.length; w++) {
      var win = _box(1.2, 1.0, 0.1, COL_WINDOW, 0x224466);
      win.position.set(winPosA[w][0] + 8, winPosA[w][1], -14.05);
      _add(win);
    }

    /* main module B — second bunk block */
    var modB = _box(10, 4, 7, COL_QUARTERS);
    modB.position.set(-8, 2, -10);
    _add(modB);

    /* windows B */
    var winPosB = [[-2, 3, -10], [2, 3, -10]];
    for (var wb = 0; wb < winPosB.length; wb++) {
      var winB = _box(1.2, 0.9, 0.1, COL_WINDOW, 0x224466);
      winB.position.set(winPosB[wb][0] - 8, winPosB[wb][1], -13.55);
      _add(winB);
    }

    /* connecting walkway between modules */
    var bridge = _box(4, 0.5, 8, COL_STEEL);
    bridge.position.set(2, 1, -10);
    _add(bridge);

    /* railing posts */
    var railX = [-8, -6, -4, 4, 6, 8];
    for (var rx = 0; rx < railX.length; rx++) {
      var post = _box(0.15, 1.2, 0.15, 0x778899);
      post.position.set(railX[rx], 1.85, -6.1);
      _add(post);
      var post2 = _box(0.15, 1.2, 0.15, 0x778899);
      post2.position.set(railX[rx], 1.85, -13.9);
      _add(post2);
    }
  }

  function _buildFlareStack() {
    /* stack cylinder */
    var stack = _cyl(0.5, 0.7, 14, 8, COL_DARK_STEEL);
    stack.position.set(16, 7, -8);
    _add(stack);
    _flareStack = stack;

    /* tip cone */
    var tip = _cone(0.8, 1.5, 8, 0x444444);
    tip.position.set(16, 14.75, -8);
    _add(tip);

    /* fire effect — stacked cones of decreasing size */
    var fireCols = [COL_FIRE, COL_FLARE, 0xFFAA00, 0xFFFF00];
    for (var f = 0; f < 4; f++) {
      var fire = _cone(0.8 - f * 0.15, 1.5 + f * 0.4, 8, fireCols[f], fireCols[f]);
      fire.position.set(16, 15.5 + f * 0.7, -8);
      fire.userData.fireIndex = f;
      _add(fire);
      _fireParts.push(fire);
    }

    /* point light for fire glow */
    _flareLight = new THREE.PointLight(COL_FLARE, 4, 20);
    _flareLight.position.set(16, 17, -8);
    _rigGroup.add(_flareLight);
    _allMeshes.push(_flareLight);
  }

  function _buildAnchorChains() {
    /* LineSegments chains going from rig legs down into water */
    var chainAnchors = [
      { sx: -16, sy: -17, sz: -16, ex: -24, ey: WATER_Y + 2 - PLATFORM_Y, ez: -24 },
      { sx:  16, sy: -17, sz: -16, ex:  24, ey: WATER_Y + 2 - PLATFORM_Y, ez: -24 },
      { sx: -16, sy: -17, sz:  16, ex: -24, ey: WATER_Y + 2 - PLATFORM_Y, ez:  24 },
      { sx:  16, sy: -17, sz:  16, ex:  24, ey: WATER_Y + 2 - PLATFORM_Y, ez:  24 }
    ];

    for (var c = 0; c < chainAnchors.length; c++) {
      var ca = chainAnchors[c];
      var points = [];
      var steps = 8;
      for (var s = 0; s <= steps; s++) {
        var t = s / steps;
        /* catenary-like sag */
        var sag = Math.sin(t * Math.PI) * 3;
        points.push(
          ca.sx + (ca.ex - ca.sx) * t,
          ca.sy + (ca.ey - ca.sy) * t - sag,
          ca.sz + (ca.ez - ca.sz) * t
        );
      }

      var positions = [];
      for (var v = 0; v < points.length / 3 - 1; v++) {
        positions.push(
          points[v * 3],     points[v * 3 + 1],     points[v * 3 + 2],
          points[v * 3 + 3], points[v * 3 + 4], points[v * 3 + 5]
        );
      }

      var geo = new THREE.BufferGeometry();
      var arr = new Float32Array(positions);
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      var mat = new THREE.LineBasicMaterial({ color: COL_CHAIN });
      var line = new THREE.LineSegments(geo, mat);
      _rigGroup.add(line);
      _chainLines.push(line);
      _allMeshes.push(line);
    }
  }

  function _buildDetonator() {
    /* detonator box on main deck */
    var box = _box(1.2, 0.8, 0.8, COL_DETONATOR, 0x330000);
    box.position.set(0, 0.9, 0);
    _add(box);

    /* red blinky antenna */
    var ant = _cyl(0.05, 0.05, 1, 4, 0xFF0000, 0x440000);
    ant.position.set(0.3, 1.5, 0);
    _add(ant);

    /* wires */
    var wGeo = new THREE.BoxGeometry(8, 0.08, 0.08);
    var wMat = new THREE.MeshLambertMaterial({ color: COL_WIRE, emissive: 0x220000 });
    var wire = new THREE.Mesh(wGeo, wMat);
    wire.position.set(0, 0.6, 0);
    _add(wire);

    _detonator = {
      mesh: box,
      wireMesh: wire,
      armed: true,
      defusing: false,
      defuseTimer: 0
    };
  }

  function _buildEnemies() {
    var patrolCenters = [
      [10,  2], [-10,  2], [0,  12], [0, -12],
      [14, -2], [-14, -2], [6,  -6], [-6,   6]
    ];

    for (var i = 0; i < ENEMY_COUNT; i++) {
      var pc = patrolCenters[i % patrolCenters.length];

      /* body */
      var body = _box(0.9, 1.6, 0.7, COL_ENEMY);
      body.position.set(pc[0], 1.3, pc[1]);
      _add(body);

      /* head — sphere */
      var head = _sphere(0.42, 8, COL_HEAD);
      head.position.set(pc[0], 2.4, pc[1]);
      _add(head);

      /* gas mask visor — flat box on front of head */
      var mask = _box(0.55, 0.3, 0.15, COL_MASK);
      mask.position.set(pc[0], 2.4, pc[1] - 0.38);
      _add(mask);

      /* mask visor lens */
      var lens = _sphere(0.12, 6, 0x88BBFF, 0x112244);
      lens.position.set(pc[0] - 0.17, 2.43, pc[1] - 0.48);
      _add(lens);
      var lens2 = _sphere(0.12, 6, 0x88BBFF, 0x112244);
      lens2.position.set(pc[0] + 0.17, 2.43, pc[1] - 0.48);
      _add(lens2);

      _enemies.push({
        mesh:        body,
        headMesh:    head,
        maskMesh:    mask,
        alive:       true,
        px:          pc[0],
        py:          1.3,
        pz:          pc[1],
        patrolCx:    pc[0],
        patrolCz:    pc[1],
        patrolAngle: Math.random() * Math.PI * 2,
        alertTimer:  0,
        alerted:     false
      });
    }
  }

  function _buildHostages() {
    var hostagePosns = [
      [-8, 2, -10], [-8, 2, -12], [-6, 2, -11],
      [8,  2, -10], [8,  2, -12], [10, 2, -11]
    ];

    for (var i = 0; i < HOSTAGE_COUNT; i++) {
      var hp = hostagePosns[i];
      var body = _box(0.8, 1.7, 0.7, COL_HOSTAGE);
      body.position.set(hp[0], hp[1], hp[2]);
      _add(body);

      var head = _sphere(0.38, 8, 0xEECCAA);
      head.position.set(hp[0], hp[1] + 1.05, hp[2]);
      _add(head);

      _hostages.push({
        mesh:    body,
        headRef: head,
        rescued: false,
        px:      hp[0],
        pz:      hp[2]
      });
    }
  }

  function _buildLighting() {
    var ambient = new THREE.AmbientLight(0x223344, 0.7);
    _scene.add(ambient);
    _allMeshes.push(ambient);

    var sun = new THREE.DirectionalLight(0xFFDDAA, 1.1);
    sun.position.set(60, 100, 40);
    _scene.add(sun);
    _allMeshes.push(sun);

    var fill = new THREE.PointLight(0x2244AA, 0.6, 150);
    fill.position.set(-40, 20, -40);
    _scene.add(fill);
    _allMeshes.push(fill);
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.88)',
      'color:#00EEFF',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #0077AA',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    el.id = 'oil-rig-siege-hud';
    document.body.appendChild(el);
    _hudEl = el;
    _refreshHUD();
  }

  function _refreshHUD() {
    if (!_hudEl) return;
    var rescued = 0;
    for (var i = 0; i < _hostages.length; i++) {
      if (_hostages[i].rescued) rescued++;
    }
    var armed = (_detonator && _detonator.armed) ? 'YES' : 'NO';
    var defInfo = '';
    if (_detonator && _detonator.defusing) {
      defInfo = '  [DEFUSING: ' + Math.ceil(DEFUSE_TIME - _detonator.defuseTimer) + 's]';
    }
    _hudEl.textContent =
      'OIL RIG SIEGE  |  HOSTAGES RESCUED: ' + rescued + '/' + HOSTAGE_COUNT +
      '  |  DETONATOR ARMED: ' + armed + defInfo;
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  /* ── notification banner ─────────────────────────────────────────────────── */
  function _notify(msg, color) {
    if (_notifEl && _notifEl.parentNode) {
      _notifEl.parentNode.removeChild(_notifEl);
    }
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:52px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:' + (color || '#FFE000'),
      'font-family:monospace',
      'font-size:15px',
      'padding:5px 20px',
      'border:1px solid ' + (color || '#FFE000'),
      'border-radius:4px',
      'z-index:10000',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    _notifEl = el;
    _notifTimer = 3;
  }

  function _removeNotif() {
    if (_notifEl && _notifEl.parentNode) {
      _notifEl.parentNode.removeChild(_notifEl);
    }
    _notifEl = null;
    _notifTimer = 0;
  }

  /* ── key handlers ─────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.keyCode] = true;

    var now = Date.now();
    /* activation: O=79, R=82 */
    if (e.keyCode === 79) { _oTime = now; }
    if (e.keyCode === 82) { _rTime = now; }

    var oAge = now - _oTime;
    var rAge = now - _rTime;
    if (oAge <= ACT_WINDOW && rAge <= ACT_WINDOW && _oTime > 0 && _rTime > 0) {
      _oTime = 0; _rTime = 0;
      if (_active) {
        reset();
        _notify('OIL RIG SIEGE  OFF', '#FF4444');
      } else {
        _active = true;
        _buildAll();
        _notify('OIL RIG SIEGE  ON  —  Rescue 6 hostages. Defuse the bomb.', '#00EEFF');
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.keyCode] = false;
    if (e.keyCode === 69) {     /* E released */
      _eHolding = false;
      _eTimer = 0;
      if (_detonator) { _detonator.defusing = false; _detonator.defuseTimer = 0; }
      _refreshHUD();
    }
  }

  /* ── build everything ─────────────────────────────────────────────────── */
  function _buildAll() {
    _rigGroup = new THREE.Group();
    _scene.add(_rigGroup);

    _buildLighting();
    _buildOcean();
    _buildPlatform();
    _buildDerrick();
    _buildPipes();
    _buildHelipad();
    _buildCrewQuarters();
    _buildFlareStack();
    _buildAnchorChains();
    _buildDetonator();
    _buildEnemies();
    _buildHostages();
    _buildHUD();

    /* set fog */
    _scene.fog = new THREE.FogExp2(0x001122, 0.018);

    /* initial camera */
    if (_camera) {
      _camera.position.set(_px, _py, _pz);
      _camera.lookAt(0, 0, 0);
    }
  }

  /* ── update helpers ───────────────────────────────────────────────────── */
  function _updateBob(dt) {
    if (!_rigGroup) return;
    var bob = Math.sin(_time * BOB_FREQ) * BOB_AMPLITUDE;
    _rigGroup.position.y = PLATFORM_Y + bob;
  }

  function _updateFire(dt) {
    if (!_flareLight) return;
    /* pulsating intensity */
    _flareLight.intensity = 3.5 + Math.sin(_time * FLARE_PULSE) * 1.5;

    for (var f = 0; f < _fireParts.length; f++) {
      var fi = _fireParts[f];
      var wiggle = Math.sin(_time * (FLARE_PULSE + fi.userData.fireIndex * 0.7) + f) * 0.04;
      fi.position.x = 16 + wiggle;
      fi.scale.x = 0.9 + Math.abs(Math.sin(_time * 3 + f)) * 0.25;
      fi.scale.z = 0.9 + Math.abs(Math.cos(_time * 2.5 + f)) * 0.25;
    }
  }

  function _updateEnemies(dt) {
    if (!_camera) return;
    var cpx = _camera.position.x;
    var cpy = _camera.position.y;
    var cpz = _camera.position.z;
    /* offset by rig bob */
    var bobY = _rigGroup ? _rigGroup.position.y : PLATFORM_Y;

    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;

      /* patrol orbit around center */
      e.patrolAngle += PATROL_SPEED * dt / (PATROL_RADIUS || 1);
      e.px = e.patrolCx + Math.cos(e.patrolAngle) * PATROL_RADIUS;
      e.pz = e.patrolCz + Math.sin(e.patrolAngle) * PATROL_RADIUS;

      /* detection — compare camera to enemy world-space */
      var ewx = e.px;
      var ewy = bobY + e.py;
      var ewz = e.pz;
      var distToPlayer = _dist3(cpx, cpy, cpz, ewx, ewy, ewz);

      if (distToPlayer < ENEMY_SIGHT) {
        e.alerted = true;
        e.alertTimer += dt;
        /* alert: chase toward player on XZ */
        var dirX = cpx - ewx;
        var dirZ = cpz - ewz;
        var dLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
        e.px += (dirX / dLen) * ENEMY_SPEED * dt;
        e.pz += (dirZ / dLen) * ENEMY_SPEED * dt;
        e.mesh.material.color.setHex(0xFF2200);
        e.headMesh.material.color.setHex(0xFF2200);
      } else {
        e.alerted = false;
        e.alertTimer = 0;
        e.mesh.material.color.setHex(COL_ENEMY);
        e.headMesh.material.color.setHex(COL_HEAD);
      }

      /* sync Three.js mesh positions */
      e.mesh.position.set(e.px, e.py, e.pz);
      e.headMesh.position.set(e.px, e.py + 1.1, e.pz);
      e.maskMesh.position.set(e.px, e.py + 1.1, e.pz - 0.38);
    }
  }

  function _updateHostages(dt) {
    if (!_camera) return;
    var cpx = _camera.position.x;
    var cpz = _camera.position.z;
    var bobY = _rigGroup ? _rigGroup.position.y : PLATFORM_Y;

    for (var i = 0; i < _hostages.length; i++) {
      var h = _hostages[i];
      if (h.rescued) continue;
      var d = _dist2(cpx, cpz, h.px, h.pz);
      if (d < 2.5) {
        h.rescued = true;
        h.mesh.material.color.setHex(COL_RESCUED);
        h.headRef.material.color.setHex(0xAAFFCC);
        _refreshHUD();
        _checkVictory();
      }
    }
  }

  function _updateDefuse(dt) {
    if (!_detonator || !_detonator.armed) return;
    if (!_camera) return;

    var cpx = _camera.position.x;
    var cpy = _camera.position.y;
    var cpz = _camera.position.z;
    var bobY = _rigGroup ? _rigGroup.position.y : PLATFORM_Y;

    /* detonator world position includes rig bob */
    var dx = _detonator.mesh.position.x;
    var dy = bobY + _detonator.mesh.position.y;
    var dz = _detonator.mesh.position.z;

    var distToDet = _dist3(cpx, cpy, cpz, dx, dy, dz);

    if (_keys[69] && distToDet <= DEFUSE_RANGE) {
      /* holding E near detonator */
      _detonator.defusing = true;
      _detonator.defuseTimer += dt;
      _eHolding = true;

      if (_detonator.defuseTimer >= DEFUSE_TIME) {
        /* DEFUSED */
        _detonator.armed = false;
        _detonator.defusing = false;
        _detonator.mesh.material.color.setHex(COL_DEFUSED);
        _detonator.mesh.material.emissive.setHex(0x003300);
        _detonator.wireMesh.material.color.setHex(0x005500);
        _notify('DETONATOR DEFUSED! Now rescue the hostages!', '#00FF88');
        _refreshHUD();
        _checkVictory();
      }
    } else {
      if (_detonator.defusing) {
        _detonator.defusing = false;
        _detonator.defuseTimer = 0;
      }
    }
  }

  function _updateNotif(dt) {
    if (!_notifEl) return;
    _notifTimer -= dt;
    if (_notifTimer <= 0) {
      _removeNotif();
    }
  }

  function _checkVictory() {
    var allRescued = true;
    for (var i = 0; i < _hostages.length; i++) {
      if (!_hostages[i].rescued) { allRescued = false; break; }
    }
    var defused = _detonator && !_detonator.armed;

    if (allRescued && defused) {
      _notify('MISSION COMPLETE — All hostages rescued & bomb defused!', '#00FF88');
    } else if (allRescued) {
      _notify('All hostages rescued! Now defuse the detonator!', '#FFE000');
    } else if (defused) {
      _notify('Detonator defused! Rescue the remaining hostages!', '#FFE000');
    }
  }

  /* ── public API ──────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function update(dt) {
    if (!_active) return;
    _time += dt;

    _updateBob(dt);
    _updateFire(dt);
    _updateEnemies(dt);
    _updateHostages(dt);
    _updateDefuse(dt);
    _updateNotif(dt);
    _refreshHUD();
  }

  function reset() {
    if (!_active) return;
    _active = false;

    /* remove rig group (contains most meshes) */
    if (_rigGroup) {
      _scene.remove(_rigGroup);
      _rigGroup = null;
    }

    /* remove ocean & lighting (added directly to scene) */
    for (var i = 0; i < _allMeshes.length; i++) {
      if (_allMeshes[i].parent === _scene) {
        _scene.remove(_allMeshes[i]);
      }
    }

    /* clear fog */
    if (_scene) _scene.fog = null;

    _removeHUD();
    _removeNotif();

    /* reset state */
    _time       = 0;
    _allMeshes  = [];
    _chainLines = [];
    _derrickParts = [];
    _pipeParts  = [];
    _fireParts  = [];
    _flareStack = null;
    _flareLight = null;
    _ocean      = null;
    _enemies    = [];
    _hostages   = [];
    _detonator  = null;
    _eHolding   = false;
    _eTimer     = 0;
    _keys       = {};
    _px = 0; _py = PLATFORM_Y + 1.7; _pz = 20;
  }

  window.addEventListener('keydown', function (e) {
    /* handled inside _onKeyDown, this outer listener is the initial bootstrap
       so that init() need not be called before keys work */
  });

  return { init: init, update: update, reset: reset };
}());
