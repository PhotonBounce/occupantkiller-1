// ============================================================
//  hostage-standoff.js — Hostage Standoff Scenario Module
//  Features:
//    1. H+S keys to trigger hostage standoff scenario
//    2. Abandoned building: BoxGeometry frame (12x6x10, walls outline via LineSegments)
//    3. Interior pillars (4 CylinderGeometry r=0.3), broken windows (BoxGeometry gaps)
//    4. 3 hostages (CylinderGeometry+SphereGeometry, 0xCC8844) kneeling (scale.y=0.6)
//    5. 2 armed perpetrators (CylinderGeometry 0x333333), HP 150 each
//    6. Negotiation phase (90s): countdown + progress bar, press N for demand panel
//    7. 3 negotiation options with success probabilities
//    8. Tactical breach: SNIPER (S), BREACH TEAM (B), GAS ATTACK (G+M)
//    9. Perp AI: patrol, fire at breach team, grab hostage as shield
//   10. Mission outcomes: CLEAN RESCUE / PARTIAL / FAILED
//   11. Post-rescue: freed hostages run toward exit ring
//   12. HUD: STANDOFF [HOSTAGES] [MORALE] [PERPS] | NEG TIME
//  Public API: { init(scene, camera, renderer), update(delta), reset() }
// ============================================================
window.HostageStandoff = (function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  var NEGOT_PHASE_DURATION  = 90;    // seconds
  var BREACH_MIN_WAIT       = 60;    // seconds before BREACH TEAM allowed
  var NUM_HOSTAGES          = 3;
  var NUM_PERPS             = 2;
  var PERP_HP               = 150;
  var PERP_PATROL_SPEED     = 1.5;
  var PERP_FIRE_SPEED       = 0.5;   // projectile speed
  var BREACH_UNIT_COUNT     = 3;
  var BREACH_CONVERGE_TIME  = 2.0;   // seconds to rush perps
  var SNIPER_FOV            = 15;
  var SNIPER_ZOOM_DURATION  = 3.0;
  var SNIPER_MISS_CHANCE    = 0.20;
  var GAS_SLOW_DURATION     = 15;    // seconds gas slows perps
  var MORALE_DRAIN_RATE     = 5;     // % per second
  var SCORE_CLEAN_RESCUE    = 1000;
  var SCORE_PARTIAL         = 300;   // per saved hostage
  var SCORE_HOSTAGE_KILLED  = -500;

  var COLOR_HOSTAGE_BODY    = 0xCC8844;
  var COLOR_HOSTAGE_SKIN    = 0xF5C5A3;
  var COLOR_BINDING         = 0x8B6914;
  var COLOR_PERP_BODY       = 0x333333;
  var COLOR_EXIT_RING       = 0x00FF88;
  var COLOR_GAS             = 0xFFFF88;
  var COLOR_BREACH_UNIT     = 0x111111;
  var COLOR_BULLET          = 0xFFAA00;

  // Negotiation demand options
  var NEG_OPTIONS = [
    { label: 'CONCEDE TRANSPORT', prob: 0.60 },
    { label: 'OFFER FOOD',        prob: 0.80 },
    { label: 'DEMAND RELEASE',    prob: 0.40 }
  ];

  // ── State ───────────────────────────────────────────────────
  var _scene              = null;
  var _camera             = null;
  var _renderer           = null;
  var _active             = false;
  var _inited             = false;
  var _addedKeys          = false;

  var _negotTimer         = NEGOT_PHASE_DURATION;
  var _negotPhaseOver     = false;
  var _negotElapsed       = 0;

  var _hostages           = [];
  var _perps              = [];
  var _breachUnits        = [];
  var _gasSpheres         = [];
  var _bullets            = [];
  var _buildingGroup      = null;
  var _exitRing           = null;

  var _hostileMorale      = 100;  // 0–100, drains during standoff
  var _gasActive          = false;
  var _gasTimer           = 0;
  var _hasMask            = false;
  var _sniperActive       = false;
  var _sniperTimer        = 0;
  var _origFOV            = 75;
  var _breachActive       = false;
  var _breachTimer        = 0;
  var _missOutcome        = null;  // null / 'clean' / 'partial' / 'failed'
  var _missionScore       = 0;

  // Key state
  var _keys               = {};
  var _prevH              = false;
  var _prevS              = false;
  var _prevN              = false;
  var _prevB              = false;
  var _prevG              = false;
  var _prevM              = false;
  var _prevSpace          = false;

  // HUD elements
  var _hudEl              = null;
  var _negPanelEl         = null;
  var _bannerEl           = null;
  var _crosshairEl        = null;
  var _progBarEl          = null;
  var _progBarFillEl      = null;

  // Threat flash state
  var _threatFlash        = [];  // { light, timer }

  // Building center
  var _buildingPos        = { x: 0, y: 0, z: -20 };

  // ── Helpers ──────────────────────────────────────────────────
  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }
  function _getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }
  function _getPlayerPos() {
    var cam = _getCamera();
    return cam ? cam.position : null;
  }
  function _dist2D(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function _dist3D(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function _addScore(pts) {
    _missionScore += pts;
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(pts);
    } else if (typeof window._score !== 'undefined') {
      window._score += pts;
    }
    var scoreEl = document.getElementById('score-display');
    if (scoreEl) {
      var cur = parseInt((scoreEl.textContent || '').replace(/[^0-9\-]/g, '')) || 0;
      scoreEl.textContent = 'SCORE: ' + (cur + pts);
    }
  }
  function _makeMat(color, opts) {
    var params = { color: color };
    if (opts) { for (var k in opts) { params[k] = opts[k]; } }
    return new THREE.MeshLambertMaterial(params);
  }
  function _makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }
  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ── Key Listener ─────────────────────────────────────────────
  function _setupKeys() {
    if (_addedKeys) return;
    _addedKeys = true;
    document.addEventListener('keydown', function (e) { _keys[e.code] = true; });
    document.addEventListener('keyup',   function (e) { _keys[e.code] = false; });
  }

  // ── Building Construction ─────────────────────────────────────
  function _buildAbandonedBuilding(scene) {
    var group = new THREE.Group();
    group.position.set(_buildingPos.x, _buildingPos.y, _buildingPos.z);

    var bx = _buildingPos.x, bz = _buildingPos.z;

    // Outline via LineSegments — define 8 corners of 12×6×10 box
    var W = 12, H = 6, D = 10;
    var hw = W / 2, hd = D / 2;
    var corners = [
      [-hw, 0, -hd], [ hw, 0, -hd], [ hw, H, -hd], [-hw, H, -hd],
      [-hw, 0,  hd], [ hw, 0,  hd], [ hw, H,  hd], [-hw, H,  hd]
    ];
    var edges = [
      0,1, 1,2, 2,3, 3,0,
      4,5, 5,6, 6,7, 7,4,
      0,4, 1,5, 2,6, 3,7
    ];
    var linePositions = [];
    for (var ei = 0; ei < edges.length; ei += 2) {
      var c0 = corners[edges[ei]], c1 = corners[edges[ei + 1]];
      linePositions.push(c0[0], c0[1], c0[2], c1[0], c1[1], c1[2]);
    }
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var lineSegs = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lineSegs);

    // Thin wall panels (mostly transparent to allow line visibility)
    // Floor
    var floorGeo = new THREE.BoxGeometry(W, 0.1, D);
    var floorMat = _makeMat(0x444444);
    var floor = _makeMesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    group.add(floor);

    // Thin wall outlines (partial walls, broken)
    var wallMat = _makeMat(0x555555, { opacity: 0.7, transparent: true });
    // Front wall (with window gap)
    var frontWallA = _makeMesh(new THREE.BoxGeometry(4, H, 0.2), wallMat);
    frontWallA.position.set(-4, H / 2, -hd);
    group.add(frontWallA);
    var frontWallB = _makeMesh(new THREE.BoxGeometry(4, H, 0.2), wallMat);
    frontWallB.position.set(4, H / 2, -hd);
    group.add(frontWallB);
    // Window gap in middle-front (broken window)
    var frontWallTop = _makeMesh(new THREE.BoxGeometry(4, 2, 0.2), wallMat);
    frontWallTop.position.set(0, H - 1, -hd);
    group.add(frontWallTop);
    var frontWallBot = _makeMesh(new THREE.BoxGeometry(4, 1.5, 0.2), wallMat);
    frontWallBot.position.set(0, 0.75, -hd);
    group.add(frontWallBot);

    // Back wall (with window gap)
    var backWallA = _makeMesh(new THREE.BoxGeometry(4, H, 0.2), wallMat);
    backWallA.position.set(-4, H / 2, hd);
    group.add(backWallA);
    var backWallB = _makeMesh(new THREE.BoxGeometry(4, H, 0.2), wallMat);
    backWallB.position.set(4, H / 2, hd);
    group.add(backWallB);
    var backWallTop = _makeMesh(new THREE.BoxGeometry(4, 2, 0.2), wallMat);
    backWallTop.position.set(0, H - 1, hd);
    group.add(backWallTop);
    var backWallBot = _makeMesh(new THREE.BoxGeometry(4, 1.5, 0.2), wallMat);
    backWallBot.position.set(0, 0.75, hd);
    group.add(backWallBot);

    // Side walls
    var sideWallMat = _makeMat(0x555555, { opacity: 0.7, transparent: true });
    var leftWall = _makeMesh(new THREE.BoxGeometry(0.2, H, D), sideWallMat);
    leftWall.position.set(-hw, H / 2, 0);
    group.add(leftWall);
    var rightWall = _makeMesh(new THREE.BoxGeometry(0.2, H, D), sideWallMat);
    rightWall.position.set(hw, H / 2, 0);
    group.add(rightWall);

    // 4 Interior pillars (CylinderGeometry r=0.3)
    var pillarMat = _makeMat(0x666666);
    var pillarPositions = [
      [-3.5, 0, -3], [3.5, 0, -3],
      [-3.5, 0,  3], [3.5, 0,  3]
    ];
    for (var pi = 0; pi < pillarPositions.length; pi++) {
      var pp = pillarPositions[pi];
      var pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, H, 8);
      var pillar = _makeMesh(pillarGeo, pillarMat);
      pillar.position.set(pp[0], H / 2, pp[2]);
      group.add(pillar);
    }

    scene.add(group);
    _buildingGroup = group;

    // Exit ring (CylinderGeometry 0x00FF88)
    var exitGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16, 1, true);
    var exitMat = _makeMat(COLOR_EXIT_RING, { opacity: 0.7, transparent: true, side: THREE.DoubleSide });
    var exitRing = _makeMesh(exitGeo, exitMat);
    exitRing.position.set(bx + 18, 0.1, bz);
    scene.add(exitRing);
    _exitRing = exitRing;
    _exitRing._pos = { x: bx + 18, y: 0.1, z: bz };
  }

  // ── Hostage Construction ──────────────────────────────────────
  function _buildHostage(scene, idx) {
    var group = new THREE.Group();
    var bx = _buildingPos.x, bz = _buildingPos.z;

    // Place hostages in a cluster inside building
    var hx = bx + (idx - 1) * 2.5;
    var hz = bz - 1;
    group.position.set(hx, 0, hz);

    // Body (kneeling): CylinderGeometry, scale.y=0.6, y=-0.4
    var bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
    var bodyMat = _makeMat(COLOR_HOSTAGE_BODY);
    var body = _makeMesh(bodyGeo, bodyMat);
    body.scale.y = 0.6;
    body.position.y = -0.4 + 0.36; // center at kneeling height
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = _makeMat(COLOR_HOSTAGE_SKIN);
    var head = _makeMesh(headGeo, headMat);
    head.position.y = 0.4;
    group.add(head);

    // Bindings (BoxGeometry at wrists, 0x8B6914)
    var bindGeo = new THREE.BoxGeometry(0.18, 0.08, 0.08);
    var bindMat = _makeMat(COLOR_BINDING);
    var bindL = _makeMesh(bindGeo, bindMat);
    bindL.position.set(-0.3, -0.1, 0.0);
    group.add(bindL);
    var bindR = _makeMesh(bindGeo.clone(), bindMat);
    bindR.position.set(0.3, -0.1, 0.0);
    group.add(bindR);

    scene.add(group);

    var hostage = {
      group: group,
      hp: 100,
      morale: 100,
      alive: true,
      freed: false,
      fallen: false,
      fleeing: false,
      shielding: false,  // is being used as human shield by perp
      perpShield: null,  // which perp holds this hostage
      origPos: { x: hx, y: 0, z: hz },
      idx: idx
    };
    return hostage;
  }

  // ── Perpetrator Construction ──────────────────────────────────
  function _buildPerp(scene, idx) {
    var group = new THREE.Group();
    var bx = _buildingPos.x, bz = _buildingPos.z;

    var px = bx + (idx === 0 ? -2 : 2);
    var pz = bz + 2;
    group.position.set(px, 0, pz);

    // Body (CylinderGeometry 0x333333)
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
    var bodyMat = _makeMat(COLOR_PERP_BODY);
    var body = _makeMesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    group.add(body);
    group._bodyMesh = body;
    group._bodyMat  = bodyMat;

    // Head
    var headGeo = new THREE.SphereGeometry(0.24, 8, 8);
    var headMat = _makeMat(0x222222);
    var head = _makeMesh(headGeo, headMat);
    head.position.y = 1.9;
    group.add(head);

    scene.add(group);

    // Patrol waypoints (between hostage clusters)
    var wpA = { x: bx - 3, z: bz };
    var wpB = { x: bx + 3, z: bz };

    var perp = {
      group: group,
      hp: PERP_HP,
      maxHP: PERP_HP,
      alive: true,
      morale: 1.0,   // 1.0 = normal, drops on negotiation success
      wpA: wpA,
      wpB: wpB,
      targetWP: (idx === 0) ? wpB : wpA,
      state: 'patrol',   // patrol | firing | shield | stagger
      staggerTimer: 0,
      fireTimer: 0,
      hostageTarget: null,  // hostage grabbed as shield
      idx: idx
    };
    return perp;
  }

  // ── Threat Flash (red point light near hostage) ───────────────
  function _triggerThreatFlash(hostage) {
    var scene = _getScene();
    if (!scene) return;
    var light = new THREE.PointLight(0xFF0000, 3, 5);
    light.position.copy(hostage.group.position);
    light.position.y += 1.5;
    scene.add(light);
    _threatFlash.push({ light: light, timer: 0.8 });
  }

  // ── Gas spheres ───────────────────────────────────────────────
  function _spawnGas(scene) {
    var bx = _buildingPos.x, bz = _buildingPos.z;
    var gasPositions = [
      [bx, 1, bz],
      [bx - 3, 1, bz + 2],
      [bx + 3, 1, bz - 2]
    ];
    for (var gi = 0; gi < gasPositions.length; gi++) {
      var gp = gasPositions[gi];
      var gasGeo = new THREE.SphereGeometry(2.5, 8, 8);
      var gasMat = _makeMat(COLOR_GAS, { opacity: 0.5, transparent: true });
      var gasMesh = _makeMesh(gasGeo, gasMat);
      gasMesh.position.set(gp[0], gp[1], gp[2]);
      scene.add(gasMesh);
      _gasSpheres.push(gasMesh);
    }
  }

  // ── Breach Unit Construction ──────────────────────────────────
  function _spawnBreachTeam(scene) {
    var bx = _buildingPos.x, bz = _buildingPos.z;
    var entryPoints = [
      { x: bx - 6, z: bz - 5 },
      { x: bx,     z: bz - 5 },
      { x: bx + 6, z: bz - 5 }
    ];
    for (var bi = 0; bi < BREACH_UNIT_COUNT; bi++) {
      var ep = entryPoints[bi];
      var bGroup = new THREE.Group();
      bGroup.position.set(ep.x, 0, ep.z);

      var bBodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.8, 8);
      var bBodyMat = _makeMat(COLOR_BREACH_UNIT);
      var bBody = _makeMesh(bBodyGeo, bBodyMat);
      bBody.position.y = 0.9;
      bGroup.add(bBody);

      var bHeadGeo = new THREE.SphereGeometry(0.2, 8, 8);
      var bHeadMat = _makeMat(0x222222);
      var bHead = _makeMesh(bHeadGeo, bHeadMat);
      bHead.position.y = 1.85;
      bGroup.add(bHead);

      scene.add(bGroup);

      var targetPerp = _perps[bi % _perps.length];
      var targetPos = targetPerp ? targetPerp.group.position : { x: bx, z: bz };

      _breachUnits.push({
        group: bGroup,
        startPos: { x: ep.x, z: ep.z },
        targetPos: { x: targetPos.x, z: targetPos.z },
        progress: 0,
        alive: true
      });
    }
  }

  // ── HUD Construction ──────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'hs-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border-radius:4px',
      'z-index:9000',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Progress bar container
    _progBarEl = document.createElement('div');
    _progBarEl.style.cssText = [
      'position:fixed',
      'top:40px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:240px',
      'height:8px',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #888',
      'border-radius:4px',
      'z-index:9000'
    ].join(';');
    _progBarFillEl = document.createElement('div');
    _progBarFillEl.style.cssText = [
      'height:100%',
      'width:100%',
      'background:#44FF44',
      'border-radius:4px',
      'transition:width 0.2s'
    ].join(';');
    _progBarEl.appendChild(_progBarFillEl);
    document.body.appendChild(_progBarEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var aliveHostages = 0, totalHostages = _hostages.length;
    for (var hi = 0; hi < _hostages.length; hi++) {
      if (_hostages[hi].alive) aliveHostages++;
    }
    var alivePerps = 0;
    for (var pi = 0; pi < _perps.length; pi++) {
      if (_perps[pi].alive) alivePerps++;
    }
    var moraleStr = Math.round(_hostileMorale) + '%';
    var negSec = Math.max(0, Math.ceil(_negotTimer));
    var mm = Math.floor(negSec / 60);
    var ss = negSec % 60;
    var timeStr = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    var phase = _negotPhaseOver ? 'TACTICAL' : 'NEGOTIATION';
    _hudEl.textContent = 'STANDOFF [HOSTAGES: ' + aliveHostages + '/' + totalHostages +
      '] [MORALE: ' + moraleStr + '] [PERPS: ' + alivePerps + '/' + NUM_PERPS +
      '] | NEG TIME: ' + timeStr + ' [' + phase + ']';

    // Progress bar shows negotiation time remaining
    if (_progBarFillEl) {
      var pct = (_negotPhaseOver ? 0 : _negotTimer / NEGOT_PHASE_DURATION * 100);
      _progBarFillEl.style.width = pct + '%';
      _progBarFillEl.style.background = pct > 30 ? '#44FF44' : '#FF4444';
    }
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) { _hudEl.parentNode.removeChild(_hudEl); _hudEl = null; }
    if (_progBarEl && _progBarEl.parentNode) { _progBarEl.parentNode.removeChild(_progBarEl); _progBarEl = null; }
    _progBarFillEl = null;
  }

  // ── Negotiation Panel ─────────────────────────────────────────
  function _openNegPanel() {
    if (_negPanelEl) return;  // already open
    _negPanelEl = document.createElement('div');
    _negPanelEl.id = 'hs-neg-panel';
    _negPanelEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,10,30,0.92)',
      'color:#fff',
      'font-family:monospace',
      'font-size:14px',
      'padding:20px 28px',
      'border:2px solid #4488FF',
      'border-radius:6px',
      'z-index:9100',
      'min-width:280px'
    ].join(';');

    var title = document.createElement('div');
    title.style.cssText = 'font-size:16px;font-weight:bold;color:#88AAFF;margin-bottom:12px;text-align:center;';
    title.textContent = 'NEGOTIATION DEMAND';
    _negPanelEl.appendChild(title);

    for (var oi = 0; oi < NEG_OPTIONS.length; oi++) {
      (function (opt, i) {
        var btn = document.createElement('button');
        btn.style.cssText = [
          'display:block',
          'width:100%',
          'margin:6px 0',
          'padding:8px 12px',
          'background:#223366',
          'color:#fff',
          'border:1px solid #4466AA',
          'border-radius:4px',
          'font-family:monospace',
          'font-size:13px',
          'cursor:pointer',
          'text-align:left'
        ].join(';');
        btn.textContent = '[' + (i + 1) + '] ' + opt.label + ' (' + Math.round(opt.prob * 100) + '% success)';
        btn.addEventListener('click', function () {
          _executeNegotiation(opt, i);
          _closeNegPanel();
        });
        _negPanelEl.appendChild(btn);
      })(NEG_OPTIONS[oi], oi);
    }

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = [
      'display:block',
      'width:100%',
      'margin-top:12px',
      'padding:6px',
      'background:#442222',
      'color:#ffaaaa',
      'border:1px solid #882222',
      'border-radius:4px',
      'font-family:monospace',
      'cursor:pointer'
    ].join(';');
    closeBtn.textContent = '[ESC] CANCEL';
    closeBtn.addEventListener('click', _closeNegPanel);
    _negPanelEl.appendChild(closeBtn);

    document.body.appendChild(_negPanelEl);
  }

  function _closeNegPanel() {
    if (_negPanelEl && _negPanelEl.parentNode) {
      _negPanelEl.parentNode.removeChild(_negPanelEl);
    }
    _negPanelEl = null;
  }

  function _executeNegotiation(opt, idx) {
    var roll = Math.random();
    if (roll < opt.prob) {
      // Success: halve one alive perp's HP, morale drops (color shifts lighter)
      var targetPerp = null;
      for (var pi = 0; pi < _perps.length; pi++) {
        if (_perps[pi].alive) { targetPerp = _perps[pi]; break; }
      }
      if (targetPerp) {
        targetPerp.hp = Math.ceil(targetPerp.hp / 2);
        targetPerp.morale = Math.max(0, targetPerp.morale - 0.3);
        // Shift color lighter to show morale drop
        var newColor = Math.floor(0x333333 + targetPerp.morale * 0x444444);
        if (targetPerp.group._bodyMat) {
          targetPerp.group._bodyMat.color.setHex(newColor);
        }
        _showBanner('NEGOTIATION SUCCESS — ' + opt.label, '#44FF88', 2500);
      }
    } else {
      // Fail: perp threatens hostage (red flash)
      var h = _hostages[Math.floor(Math.random() * _hostages.length)];
      if (h && h.alive) { _triggerThreatFlash(h); }
      _showBanner('NEGOTIATION FAILED — PERP THREATENS', '#FF4444', 2500);
    }
  }

  // ── Banner ────────────────────────────────────────────────────
  function _showBanner(text, color, duration) {
    if (_bannerEl && _bannerEl.parentNode) {
      _bannerEl.parentNode.removeChild(_bannerEl);
    }
    _bannerEl = document.createElement('div');
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:' + (color || '#fff'),
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'padding:14px 30px',
      'border-radius:8px',
      'z-index:9200',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    _bannerEl.textContent = text;
    document.body.appendChild(_bannerEl);
    var el = _bannerEl;
    setTimeout(function () {
      if (el && el.parentNode) { el.parentNode.removeChild(el); }
      if (_bannerEl === el) { _bannerEl = null; }
    }, duration || 3000);
  }

  // ── Sniper Overlay ────────────────────────────────────────────
  function _showCrosshair() {
    if (_crosshairEl) return;
    _crosshairEl = document.createElement('div');
    _crosshairEl.id = 'hs-crosshair';
    _crosshairEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:60px',
      'height:60px',
      'pointer-events:none',
      'z-index:9300'
    ].join(';');
    _crosshairEl.innerHTML = [
      '<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">',
      '<circle cx="30" cy="30" r="28" stroke="#FF2222" stroke-width="1" fill="none" opacity="0.8"/>',
      '<line x1="30" y1="0" x2="30" y2="60" stroke="#FF2222" stroke-width="1" opacity="0.8"/>',
      '<line x1="0" y1="30" x2="60" y2="30" stroke="#FF2222" stroke-width="1" opacity="0.8"/>',
      '<circle cx="30" cy="30" r="3" fill="#FF2222" opacity="0.9"/>',
      '</svg>'
    ].join('');
    document.body.appendChild(_crosshairEl);
  }

  function _hideCrosshair() {
    if (_crosshairEl && _crosshairEl.parentNode) {
      _crosshairEl.parentNode.removeChild(_crosshairEl);
    }
    _crosshairEl = null;
  }

  // ── Sniper Mode ───────────────────────────────────────────────
  function _activateSniper() {
    if (_sniperActive) return;
    var cam = _getCamera();
    if (!cam) return;
    _sniperActive = true;
    _sniperTimer = SNIPER_ZOOM_DURATION;
    _origFOV = cam.fov || 75;
    cam.fov = SNIPER_FOV;
    cam.updateProjectionMatrix();
    _showCrosshair();
    _showBanner('SNIPER MODE — SPACE to fire | 20% MISS CHANCE', '#FFFF44', 3000);
  }

  function _deactivateSniper() {
    var cam = _getCamera();
    if (cam) {
      cam.fov = _origFOV;
      cam.updateProjectionMatrix();
    }
    _sniperActive = false;
    _hideCrosshair();
  }

  function _sniperFire() {
    if (!_sniperActive) return;
    // Find closest alive perp in view direction
    var cam = _getCamera();
    if (!cam) return;
    var miss = Math.random() < SNIPER_MISS_CHANCE;
    if (miss) {
      _showBanner('MISS! Perp alerted!', '#FF8844', 2000);
      return;
    }
    var killed = false;
    for (var pi = 0; pi < _perps.length; pi++) {
      var perp = _perps[pi];
      if (!perp.alive) continue;
      perp.hp = 0;
      _killPerp(perp);
      _showBanner('PERP NEUTRALIZED — PRECISION SHOT!', '#44FF88', 2500);
      killed = true;
      break;
    }
    if (!killed) { _showBanner('NO TARGETS IN SIGHT', '#FFAAAA', 1500); }
    _deactivateSniper();
  }

  // ── Kill Perp ─────────────────────────────────────────────────
  function _killPerp(perp) {
    if (!perp.alive) return;
    perp.alive = false;
    perp.state = 'dead';
    // Fall over: tilt the group
    if (perp.group) {
      perp.group.rotation.z = Math.PI / 2;
      perp.group.position.y = -0.4;
    }
    // Free any shielding hostage
    if (perp.hostageTarget) {
      var h = perp.hostageTarget;
      h.shielding = false;
      h.perpShield = null;
      // Detach from perp group
      if (perp.group && h.group.parent === perp.group) {
        var worldPos = new THREE.Vector3();
        h.group.getWorldPosition(worldPos);
        _getScene().add(h.group);
        h.group.position.copy(worldPos);
      }
      perp.hostageTarget = null;
    }
  }

  // ── Hostage falls (executed) ──────────────────────────────────
  function _hostageExecuted(hostage) {
    if (!hostage.alive || hostage.fallen) return;
    hostage.alive = false;
    hostage.fallen = true;
    // Tilt to fallen position
    hostage.group.rotation.z = Math.PI / 2;
    hostage.group.position.y = -0.5;
    _showBanner('HOSTAGE EXECUTED!', '#FF2222', 3000);
    _addScore(SCORE_HOSTAGE_KILLED);
  }

  // ── Breach Team AI ────────────────────────────────────────────
  function _activateBreach() {
    if (_breachActive) return;
    _breachActive = true;
    _breachTimer = 0;
    var scene = _getScene();
    if (!scene) return;
    _spawnBreachTeam(scene);

    // Hostages dive flat
    for (var hi = 0; hi < _hostages.length; hi++) {
      var h = _hostages[hi];
      if (h.alive && !h.fallen) {
        h.group.scale.y = 0.2;
        h.group.position.y = -0.7;
      }
    }
    // Perps fire back — set state
    for (var pi = 0; pi < _perps.length; pi++) {
      if (_perps[pi].alive) {
        _perps[pi].state = 'firing';
        _perps[pi].fireTimer = 0;
      }
    }
    _showBanner('BREACH TEAM INCOMING!', '#FF8800', 2000);
  }

  // ── Gas Attack ────────────────────────────────────────────────
  function _activateGas() {
    if (_gasActive) return;
    if (!_hasMask) {
      _showBanner('GAS ATTACK FAILED — NEED GAS MASK (M)!', '#FF4444', 3000);
      return;
    }
    _gasActive = true;
    _gasTimer = GAS_SLOW_DURATION;
    var scene = _getScene();
    if (!scene) return;
    _spawnGas(scene);
    // Slow perps
    for (var pi = 0; pi < _perps.length; pi++) {
      if (_perps[pi].alive) {
        _perps[pi].state = 'stagger';
        _perps[pi].staggerTimer = GAS_SLOW_DURATION;
      }
    }
    _showBanner('TEAR GAS DEPLOYED — PERPS STAGGERED!', '#FFFF44', 2500);
  }

  // ── Spawn Scenario ────────────────────────────────────────────
  function _spawnScenario() {
    var scene = _getScene();
    if (!scene) return;

    _buildAbandonedBuilding(scene);

    // Spawn hostages
    _hostages = [];
    for (var hi = 0; hi < NUM_HOSTAGES; hi++) {
      _hostages.push(_buildHostage(scene, hi));
    }

    // Spawn perps
    _perps = [];
    for (var pi = 0; pi < NUM_PERPS; pi++) {
      _perps.push(_buildPerp(scene, pi));
    }

    // Ambient light inside building
    var ambientLight = new THREE.AmbientLight(0x404060, 0.8);
    scene.add(ambientLight);

    // One dim point light inside building
    var buildLight = new THREE.PointLight(0x886644, 1.5, 15);
    buildLight.position.set(_buildingPos.x, 3, _buildingPos.z);
    scene.add(buildLight);

    _active = true;
    _negotTimer = NEGOT_PHASE_DURATION;
    _negotElapsed = 0;
    _negotPhaseOver = false;
    _hostileMorale = 100;
    _missOutcome = null;
    _missionScore = 0;
    _gasActive = false;
    _gasTimer = 0;
    _hasMask = false;
    _sniperActive = false;
    _breachActive = false;
    _breachTimer = 0;
    _breachUnits = [];
    _gasSpheres = [];
    _bullets = [];
    _threatFlash = [];

    _buildHUD();
    _showBanner('HOSTAGE STANDOFF — Press N to negotiate | S=Sniper | B=Breach | G=Gas (need M mask)', '#FFAA44', 5000);
  }

  // ── Spawn bullet from perp ────────────────────────────────────
  function _spawnBullet(fromPos, toPos, scene) {
    var bulletGeo = new THREE.SphereGeometry(0.05, 4, 4);
    var bulletMat = _makeMat(COLOR_BULLET, { emissive: COLOR_BULLET });
    var bulletMesh = _makeMesh(bulletGeo, bulletMat);
    bulletMesh.position.set(fromPos.x, fromPos.y + 1, fromPos.z);
    scene.add(bulletMesh);

    var dx = toPos.x - fromPos.x;
    var dz = toPos.z - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var bullet = {
      mesh: bulletMesh,
      vx: (dx / len) * 12,
      vz: (dz / len) * 12,
      life: 2.0
    };
    _bullets.push(bullet);
  }

  // ── Perp AI update ────────────────────────────────────────────
  function _updatePerps(delta) {
    var playerPos = _getPlayerPos();
    var scene = _getScene();

    for (var pi = 0; pi < _perps.length; pi++) {
      var perp = _perps[pi];
      if (!perp.alive) continue;

      var pg = perp.group;
      var perpPos = pg.position;

      // HP death check
      if (perp.hp <= 0) { _killPerp(perp); continue; }

      var gasSlowed = _gasActive && perp.staggerTimer > 0;
      var speed = gasSlowed ? PERP_PATROL_SPEED * 0.5 : PERP_PATROL_SPEED;

      // Check if player enters building — grab nearest hostage as shield
      if (playerPos && !perp.hostageTarget && !perp.shielding) {
        var distToPlayer = _dist2D(perpPos, playerPos);
        if (distToPlayer < 6) {
          // Grab nearest live, unshielded hostage
          var nearest = null, nearDist = Infinity;
          for (var hi = 0; hi < _hostages.length; hi++) {
            var h = _hostages[hi];
            if (!h.alive || h.shielding || h.freed) continue;
            var hd2 = _dist2D(perpPos, h.group.position);
            if (hd2 < nearDist) { nearDist = hd2; nearest = h; }
          }
          if (nearest) {
            perp.hostageTarget = nearest;
            nearest.shielding = true;
            nearest.perpShield = perp;
            // Reparent hostage to perp group
            if (scene) {
              pg.add(nearest.group);
              nearest.group.position.set(0, 0, 0.4); // in front of perp
            }
            _showBanner('PERP GRABBING HOSTAGE AS SHIELD!', '#FF4444', 2500);
          }
        }
      }

      if (perp.staggerTimer > 0) {
        perp.staggerTimer -= delta;
        if (perp.staggerTimer < 0) perp.staggerTimer = 0;
      }

      if (perp.state === 'patrol' || perp.state === 'stagger') {
        // Move toward target waypoint
        var twp = perp.targetWP;
        var dx = twp.x - perpPos.x;
        var dz = twp.z - perpPos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.3) {
          // Swap waypoints
          perp.targetWP = (perp.targetWP === perp.wpA) ? perp.wpB : perp.wpA;
        } else {
          var moveSpeed = gasSlowed ? speed * 0.5 : speed;
          pg.position.x += (dx / dist) * moveSpeed * delta;
          pg.position.z += (dz / dist) * moveSpeed * delta;
          // Face movement direction
          pg.rotation.y = Math.atan2(dx, dz);
        }
      } else if (perp.state === 'firing' && scene) {
        // Fire at breach units
        perp.fireTimer -= delta;
        if (perp.fireTimer <= 0) {
          perp.fireTimer = 1.0 + Math.random();
          // Find a breach unit target
          var btarget = null;
          for (var bi = 0; bi < _breachUnits.length; bi++) {
            if (_breachUnits[bi].alive) { btarget = _breachUnits[bi]; break; }
          }
          if (!btarget && playerPos) {
            // Fire at player if no breach units
            _spawnBullet(perpPos, playerPos, scene);
          } else if (btarget) {
            _spawnBullet(perpPos, btarget.group.position, scene);
          }
        }
      }
    }
  }

  // ── Breach Unit AI update ─────────────────────────────────────
  function _updateBreachUnits(delta) {
    _breachTimer += delta;
    var t = _clamp(_breachTimer / BREACH_CONVERGE_TIME, 0, 1);

    for (var bi = 0; bi < _breachUnits.length; bi++) {
      var bu = _breachUnits[bi];
      if (!bu.alive) continue;

      var sp = bu.startPos;
      var tp = bu.targetPos;

      // Update target position if perp moved
      var targetPerp = _perps[bi % _perps.length];
      if (targetPerp && targetPerp.alive) {
        tp.x = targetPerp.group.position.x;
        tp.z = targetPerp.group.position.z;
      }

      bu.group.position.x = sp.x + (tp.x - sp.x) * t;
      bu.group.position.z = sp.z + (tp.z - sp.z) * t;

      // On arrival, neutralize perp
      if (t >= 1.0 && targetPerp && targetPerp.alive) {
        targetPerp.hp = 0;
        _killPerp(targetPerp);
        bu.alive = false;
        _showBanner('PERP NEUTRALIZED BY BREACH TEAM!', '#44FF88', 2000);
      }
    }
  }

  // ── Bullet update ─────────────────────────────────────────────
  function _updateBullets(delta) {
    var scene = _getScene();
    var toRemove = [];
    for (var bi = 0; bi < _bullets.length; bi++) {
      var b = _bullets[bi];
      b.mesh.position.x += b.vx * delta;
      b.mesh.position.z += b.vz * delta;
      b.life -= delta;
      if (b.life <= 0) { toRemove.push(bi); }
    }
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      var idx = toRemove[ri];
      if (scene) { scene.remove(_bullets[idx].mesh); }
      _bullets.splice(idx, 1);
    }
  }

  // ── Hostage morale update ─────────────────────────────────────
  function _updateHostageMorale(delta) {
    if (!_active) return;
    _hostileMorale -= MORALE_DRAIN_RATE * delta;
    _hostileMorale = Math.max(0, _hostileMorale);

    if (_hostileMorale <= 0) {
      // Execute a hostage
      for (var hi = 0; hi < _hostages.length; hi++) {
        var h = _hostages[hi];
        if (h.alive && !h.fallen && !h.freed) {
          _hostageExecuted(h);
          _hostileMorale = 50; // reset partially so perps don't instant-kill all
          break;
        }
      }
    }
  }

  // ── Freed hostage runs to exit ────────────────────────────────
  function _updateFleeingHostages(delta) {
    if (!_exitRing) return;
    var ep = _exitRing._pos;
    for (var hi = 0; hi < _hostages.length; hi++) {
      var h = _hostages[hi];
      if (!h.freed || !h.alive || h.fallen) continue;
      h.fleeing = true;
      var hg = h.group;
      var dx = ep.x - hg.position.x;
      var dz = ep.z - hg.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        var spd = 3.0;
        hg.position.x += (dx / dist) * spd * delta;
        hg.position.z += (dz / dist) * spd * delta;
        hg.rotation.y = Math.atan2(dx, dz);
      }
    }
  }

  // ── Threat flash update ───────────────────────────────────────
  function _updateThreatFlash(delta) {
    var scene = _getScene();
    var toRemove = [];
    for (var ti = 0; ti < _threatFlash.length; ti++) {
      var tf = _threatFlash[ti];
      tf.timer -= delta;
      if (tf.timer <= 0) {
        toRemove.push(ti);
        if (scene) { scene.remove(tf.light); }
      }
    }
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      _threatFlash.splice(toRemove[ri], 1);
    }
  }

  // ── Mission outcome check ─────────────────────────────────────
  function _checkMissionOutcome() {
    if (_missOutcome !== null) return;

    var aliveHostages = 0, freedHostages = 0, alivePerps = 0;
    for (var hi = 0; hi < _hostages.length; hi++) {
      var h = _hostages[hi];
      if (h.alive) aliveHostages++;
      if (h.freed && h.alive) freedHostages++;
    }
    for (var pi = 0; pi < _perps.length; pi++) {
      if (_perps[pi].alive) alivePerps++;
    }

    // Fail condition: all hostages dead
    if (aliveHostages === 0) {
      _missOutcome = 'failed';
      _showBanner('MISSION FAILED — ALL HOSTAGES LOST', '#FF2222', 8000);
      _active = false;
      return;
    }

    // Success condition: all perps neutralized
    if (alivePerps === 0) {
      // Free all alive non-freed hostages
      for (var hi2 = 0; hi2 < _hostages.length; hi2++) {
        var h2 = _hostages[hi2];
        if (h2.alive && !h2.freed) {
          h2.freed = true;
          // Stand them up
          h2.group.scale.y = 1.0;
          h2.group.position.y = 0;
        }
      }
      var savedCount = 0;
      for (var hi3 = 0; hi3 < _hostages.length; hi3++) {
        if (_hostages[hi3].freed && _hostages[hi3].alive) savedCount++;
      }
      if (savedCount === NUM_HOSTAGES) {
        _missOutcome = 'clean';
        _addScore(SCORE_CLEAN_RESCUE);
        _showBanner('CLEAN RESCUE! ALL HOSTAGES FREED! +' + SCORE_CLEAN_RESCUE, '#44FF88', 8000);
      } else if (savedCount > 0) {
        _missOutcome = 'partial';
        _addScore(savedCount * SCORE_PARTIAL);
        _showBanner('PARTIAL RESCUE — ' + savedCount + ' HOSTAGES SAVED! +' + (savedCount * SCORE_PARTIAL), '#FFAA44', 8000);
      } else {
        _missOutcome = 'failed';
        _showBanner('MISSION FAILED', '#FF2222', 8000);
      }
      _active = false;
    }
  }

  // ── Key processing ────────────────────────────────────────────
  function _processKeys() {
    var hKey = !!_keys['KeyH'];
    var sKey = !!_keys['KeyS'];
    var nKey = !!_keys['KeyN'];
    var bKey = !!_keys['KeyB'];
    var gKey = !!_keys['KeyG'];
    var mKey = !!_keys['KeyM'];
    var spaceKey = !!_keys['Space'];
    var escKey   = !!_keys['Escape'];

    // H+S to activate standoff (rising edge)
    if (hKey && sKey && !_prevH && !_active) {
      _spawnScenario();
    }

    if (_active) {
      // N to open negotiation panel (rising edge), only in negot phase
      if (nKey && !_prevN && !_negotPhaseOver) {
        if (!_negPanelEl) { _openNegPanel(); }
      }

      // S for sniper mode (rising edge, only if not in negotiation phase required to be over)
      if (sKey && !_prevS) {
        _activateSniper();
      }

      // Space to fire sniper shot (rising edge)
      if (spaceKey && !_prevSpace && _sniperActive) {
        _sniperFire();
      }

      // B for breach team (rising edge, only after 60s)
      if (bKey && !_prevB && !_breachActive) {
        if (_negotElapsed >= BREACH_MIN_WAIT) {
          _activateBreach();
        } else {
          var remaining = Math.ceil(BREACH_MIN_WAIT - _negotElapsed);
          _showBanner('BREACH TEAM NOT READY — wait ' + remaining + 's', '#FFAAAA', 2000);
        }
      }

      // M for gas mask
      if (mKey && !_prevM) {
        _hasMask = true;
        _showBanner('GAS MASK EQUIPPED — G to deploy gas', '#AAFFAA', 2000);
      }

      // G for gas attack (rising edge)
      if (gKey && !_prevG) {
        _activateGas();
      }

      // ESC to close neg panel
      if (escKey) { _closeNegPanel(); }
    }

    _prevH = hKey;
    _prevS = sKey;
    _prevN = nKey;
    _prevB = bKey;
    _prevG = gKey;
    _prevM = mKey;
    _prevSpace = spaceKey;
  }

  // ── Exit ring pulse ───────────────────────────────────────────
  function _updateExitRing(delta) {
    if (!_exitRing) return;
    var t = Date.now() * 0.001;
    _exitRing.rotation.y += delta * 0.5;
    _exitRing.material.opacity = 0.4 + 0.3 * Math.sin(t * 2);
  }

  // ── Gas timer ─────────────────────────────────────────────────
  function _updateGas(delta) {
    if (!_gasActive) return;
    _gasTimer -= delta;
    if (_gasTimer <= 0) {
      _gasActive = false;
      // Remove gas spheres
      var scene = _getScene();
      for (var gi = 0; gi < _gasSpheres.length; gi++) {
        if (scene) { scene.remove(_gasSpheres[gi]); }
      }
      _gasSpheres = [];
      _showBanner('TEAR GAS DISPERSED', '#FFFF88', 1500);
    }
  }

  // ── Sniper timer ──────────────────────────────────────────────
  function _updateSniper(delta) {
    if (!_sniperActive) return;
    _sniperTimer -= delta;
    if (_sniperTimer <= 0) {
      _deactivateSniper();
    }
  }

  // ── Public API ────────────────────────────────────────────────

  function init(scene, camera, renderer) {
    _scene    = scene    || null;
    _camera   = camera   || null;
    _renderer = renderer || null;
    _inited   = true;
    _setupKeys();
  }

  function update(delta) {
    if (!_inited) return;
    _processKeys();
    if (!_active) return;

    // Cap delta to avoid large jumps
    var dt = Math.min(delta, 0.1);

    // Negotiation timer
    _negotElapsed += dt;
    if (!_negotPhaseOver) {
      _negotTimer -= dt;
      if (_negotTimer <= 0) {
        _negotTimer = 0;
        _negotPhaseOver = true;
        _closeNegPanel();
        _showBanner('NEGOTIATION PHASE ENDED — CHOOSE TACTICAL OPTION!', '#FF8800', 4000);
      }
    }

    // Morale drain
    _updateHostageMorale(dt);

    // Perp AI
    _updatePerps(dt);

    // Breach team
    if (_breachActive) { _updateBreachUnits(dt); }

    // Bullets
    _updateBullets(dt);

    // Fleeing hostages
    _updateFleeingHostages(dt);

    // Threat flashes
    _updateThreatFlash(dt);

    // Gas
    _updateGas(dt);

    // Sniper
    _updateSniper(dt);

    // Exit ring
    _updateExitRing(dt);

    // HUD
    _updateHUD();

    // Check mission outcome
    _checkMissionOutcome();
  }

  function reset() {
    _active = false;
    _negotPhaseOver = false;
    _negotTimer = NEGOT_PHASE_DURATION;
    _negotElapsed = 0;
    _missOutcome = null;

    var scene = _getScene();

    // Remove building
    if (_buildingGroup && scene) { scene.remove(_buildingGroup); }
    _buildingGroup = null;

    // Remove exit ring
    if (_exitRing && scene) { scene.remove(_exitRing); }
    _exitRing = null;

    // Remove hostages
    for (var hi = 0; hi < _hostages.length; hi++) {
      if (_hostages[hi].group && scene) { scene.remove(_hostages[hi].group); }
    }
    _hostages = [];

    // Remove perps
    for (var pi = 0; pi < _perps.length; pi++) {
      if (_perps[pi].group && scene) { scene.remove(_perps[pi].group); }
    }
    _perps = [];

    // Remove breach units
    for (var bi = 0; bi < _breachUnits.length; bi++) {
      if (_breachUnits[bi].group && scene) { scene.remove(_breachUnits[bi].group); }
    }
    _breachUnits = [];

    // Remove gas spheres
    for (var gi = 0; gi < _gasSpheres.length; gi++) {
      if (scene) { scene.remove(_gasSpheres[gi]); }
    }
    _gasSpheres = [];

    // Remove bullets
    for (var bli = 0; bli < _bullets.length; bli++) {
      if (scene) { scene.remove(_bullets[bli].mesh); }
    }
    _bullets = [];

    // Remove threat lights
    for (var ti = 0; ti < _threatFlash.length; ti++) {
      if (scene) { scene.remove(_threatFlash[ti].light); }
    }
    _threatFlash = [];

    // Restore FOV if in sniper mode
    if (_sniperActive) { _deactivateSniper(); }
    _sniperActive = false;
    _gasActive = false;
    _breachActive = false;
    _hasMask = false;

    // Remove HUD
    _removeHUD();
    _closeNegPanel();
    _hideCrosshair();
    if (_bannerEl && _bannerEl.parentNode) { _bannerEl.parentNode.removeChild(_bannerEl); _bannerEl = null; }
  }

  return { init: init, update: update, reset: reset };

}());
