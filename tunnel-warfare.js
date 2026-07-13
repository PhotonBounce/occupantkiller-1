/* ───────────────────────────────────────────────────────────────────────────
   tunnel-warfare.js — Tunnel Warfare Mini-Game
   API: window.TunnelWarfare = { init, update, reset }
   Controls:
     T + W (together, 400ms window) → activate tunnel warfare mode
     E                              → descend into tunnel (near entrance)
     C                              → place demolition charge
     M                              → toggle tunnel map overlay
     Mouse                          → look / aim
     WASD                           → move
   ─────────────────────────────────────────────────────────────────────────── */
window.TunnelWarfare = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _score           = 0;
  var _inTunnel        = false;
  var _depth           = 0;
  var _oxygen          = 100;
  var _collapsePercent = 0;
  var _cacheCollected  = 0;
  var _totalCaches     = 3;
  var _enemyCount      = 8;
  var _mapVisible      = false;
  var _flooding        = false;
  var _floodLevel      = 0;
  var _waterMesh       = null;
  var _descendTimer    = 0;
  var _descending      = false;
  var _descendTarget   = 0;

  /* ── Objects ───────────────────────────────────────────────────────────── */
  var _tunnelSegments  = [];   // { ceiling, wallL, wallR, collapseHit:0 }
  var _supportBeams    = [];
  var _entrances       = [];   // { shaft, labelDiv, pos }
  var _lanterns        = [];   // { mesh, light, flickerTimer, on }
  var _enemies         = [];   // { mesh, hp, speed, alive, onRoute, routeIdx, boss }
  var _charges         = [];   // { mesh, pos }
  var _debris          = [];   // { mesh, vel, life }
  var _caches          = [];   // { mesh, pos, collected }
  var _vents           = [];   // { mesh, pos, exit }
  var _commandCenter   = null;
  var _commandLight    = null;
  var _commandAntenna  = null;
  var _bossEnemy       = null;
  var _allObjects      = [];   // every scene-added mesh for cleanup

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud        = null;
  var _mapCanvas  = null;
  var _mapCtx     = null;
  var _mapOverlay = null;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys     = {};
  var _twTimes  = { T: 0, W: 0 };
  var TW_WINDOW = 400; // ms

  /* ── Collapse ──────────────────────────────────────────────────────────── */
  var _collapseEvents = []; // { mesh, life, vel }
  var _collapseQueued = false;

  /* ── Camera / player tracking ──────────────────────────────────────────── */
  var _playerPos       = null; // THREE.Vector3 reference
  var _lastPlayerPos   = null;

  /* ── Timers ────────────────────────────────────────────────────────────── */
  var _lastTime        = 0;
  var _floodTimer      = 0;
  var _oxygenTimer     = 0;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    _allObjects.push(m);
    return m;
  }

  function addToScene(obj) {
    _scene.add(obj);
    return obj;
  }

  function randBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ════════════════════════════════════════════════════════════════════════
     TUNNEL NETWORK BUILDER
     Cross-shaped: 1 horizontal corridor + 1 vertical corridor (3 segs each)
     Total 6 segments
  ════════════════════════════════════════════════════════════════════════ */

  function buildTunnels() {
    /* Tunnel Y offset (underground) */
    var TY = -6;
    var SEG_W = 3;
    var SEG_H = 2.5;
    var SEG_L = 15;
    var WALL_T = 0.3;

    /* Segment definitions: [cx, cy, cz, rotY] */
    var segDefs = [
      /* Horizontal corridor (along X axis) */
      [-30, TY, 0, 0],
      [-15, TY, 0, 0],
      [0,   TY, 0, 0],
      /* Vertical corridor (along Z axis) */
      [0, TY, -15, Math.PI / 2],
      [0, TY,  15, Math.PI / 2],
      /* Extra branch */
      [15, TY, 0, 0]
    ];

    var ceilMat  = new THREE.MeshLambertMaterial({ color: 0x4A3B2A });
    var wallMat  = new THREE.MeshLambertMaterial({ color: 0x3A2B1A });

    for (var i = 0; i < segDefs.length; i++) {
      var def = segDefs[i];
      var cx = def[0], cy = def[1], cz = def[2], ry = def[3];

      /* Ceiling */
      var ceilGeo = new THREE.BoxGeometry(SEG_W, 0.4, SEG_L);
      var ceil = makeMesh(ceilGeo, ceilMat);
      ceil.position.set(cx, cy + SEG_H / 2, cz);
      ceil.rotation.y = ry;
      addToScene(ceil);

      /* Floor */
      var floorGeo = new THREE.BoxGeometry(SEG_W, 0.2, SEG_L);
      var floorMat2 = new THREE.MeshLambertMaterial({ color: 0x2A1F10 });
      var floor = makeMesh(floorGeo, floorMat2);
      floor.position.set(cx, cy - SEG_H / 2, cz);
      floor.rotation.y = ry;
      addToScene(floor);

      /* Wall Left */
      var wallGeoL = new THREE.BoxGeometry(WALL_T, SEG_H, SEG_L);
      var wallL = makeMesh(wallGeoL, wallMat);
      var offL = new THREE.Vector3(-SEG_W / 2 + WALL_T / 2, 0, 0);
      offL.applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
      wallL.position.set(cx + offL.x, cy, cz + offL.z);
      wallL.rotation.y = ry;
      addToScene(wallL);

      /* Wall Right */
      var wallGeoR = new THREE.BoxGeometry(WALL_T, SEG_H, SEG_L);
      var wallR = makeMesh(wallGeoR, wallMat);
      var offR = new THREE.Vector3(SEG_W / 2 - WALL_T / 2, 0, 0);
      offR.applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
      wallR.position.set(cx + offR.x, cy, cz + offR.z);
      wallR.rotation.y = ry;
      addToScene(wallR);

      _tunnelSegments.push({
        ceiling: ceil,
        floor:   floor,
        wallL:   wallL,
        wallR:   wallR,
        cx: cx, cy: cy, cz: cz,
        ry: ry,
        collapsed: false,
        collapseHit: 0
      });
    }

    /* Support beams every 8 units along corridors */
    var beamMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
    var beamPositions = [];
    /* Horizontal corridor beams */
    for (var bx = -36; bx <= 20; bx += 8) {
      beamPositions.push([bx, TY, 0]);
    }
    /* Vertical corridor beams */
    for (var bz = -20; bz <= 20; bz += 8) {
      beamPositions.push([0, TY, bz]);
    }

    for (var bi = 0; bi < beamPositions.length; bi++) {
      var bp = beamPositions[bi];
      var beamGeo = new THREE.CylinderGeometry(0.15, 0.15, SEG_H, 6);
      var beam = makeMesh(beamGeo, beamMat);
      beam.position.set(bp[0], bp[1], bp[2]);
      addToScene(beam);
      _supportBeams.push(beam);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TUNNEL ENTRANCES (4 shafts on surface)
  ════════════════════════════════════════════════════════════════════════ */

  function buildEntrances() {
    var shaftMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var entrancePositions = [
      [-30, 0,  0],
      [ 15, 0,  0],
      [  0, 0, -15],
      [  0, 0,  15]
    ];

    for (var i = 0; i < entrancePositions.length; i++) {
      var ep = entrancePositions[i];
      var shaftGeo = new THREE.CylinderGeometry(1, 1, 4, 10);
      var shaft = makeMesh(shaftGeo, shaftMat);
      shaft.position.set(ep[0], -2, ep[2]);
      addToScene(shaft);

      /* Label */
      var div = document.createElement('div');
      div.style.cssText = 'position:absolute;color:#FFCC44;font:bold 11px monospace;pointer-events:none;background:rgba(0,0,0,0.6);padding:2px 5px;border:1px solid #FFCC44;';
      div.textContent = '[E] ENTER TUNNEL';
      document.body.appendChild(div);

      _entrances.push({ shaft: shaft, label: div, pos: new THREE.Vector3(ep[0], 0, ep[2]) });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TUNNEL LIGHTING — lanterns + flickering
  ════════════════════════════════════════════════════════════════════════ */

  function buildLighting() {
    var lanternMat = new THREE.MeshLambertMaterial({ color: 0x664400, emissive: 0x442200 });
    var TY = -6;

    /* Lantern positions along tunnels every 10 units */
    var lanternPos = [];
    for (var lx = -35; lx <= 15; lx += 10) {
      lanternPos.push([lx, TY + 1, 0]);
    }
    for (var lz = -10; lz <= 10; lz += 10) {
      lanternPos.push([0, TY + 1, lz]);
    }

    for (var i = 0; i < lanternPos.length; i++) {
      var lp = lanternPos[i];
      var lanternGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
      var lantern = makeMesh(lanternGeo, lanternMat);
      lantern.position.set(lp[0], lp[1], lp[2]);
      addToScene(lantern);

      var ptLight = new THREE.PointLight(0xFFAA44, 0.8, 12);
      ptLight.position.set(lp[0], lp[1] - 0.4, lp[2]);
      _scene.add(ptLight);

      var flicker = (Math.random() < 0.35); /* ~35% chance to flicker */
      _lanterns.push({
        mesh:         lantern,
        light:        ptLight,
        flickerTimer: randBetween(0.5, 2.0),
        on:           true,
        doesFlicker:  flicker
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMIES — 8 tunnel rats + 1 boss
  ════════════════════════════════════════════════════════════════════════ */

  function buildEnemies() {
    var TY = -6;
    var ratMat  = new THREE.MeshLambertMaterial({ color: 0x2A3A2A });
    var bossMat = new THREE.MeshLambertMaterial({ color: 0x1A2A1A });

    /* Tunnel rat spawn positions spread across tunnel branches */
    var spawnPts = [
      [-28, TY, 0],
      [-20, TY, 0],
      [-12, TY, 0],
      [ 12, TY, 0],
      [  0, TY, -12],
      [  0, TY,  12],
      [  4, TY,  8],
      [ -4, TY, -8]
    ];

    for (var i = 0; i < 8; i++) {
      var sp = spawnPts[i % spawnPts.length];
      var ratGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 8);
      var rat = makeMesh(ratGeo, ratMat);
      rat.scale.y = 0.6; /* crouch height */
      rat.position.set(sp[0], sp[1], sp[2]);
      addToScene(rat);

      _enemies.push({
        mesh:     rat,
        hp:       30,
        maxHp:    30,
        speed:    12,
        alive:    true,
        boss:     false,
        routeIdx: 0,
        moveDir:  new THREE.Vector3(randBetween(-1, 1), 0, randBetween(-1, 1)).normalize(),
        changeDirTimer: randBetween(1, 3)
      });
    }

    /* Boss — guards junction at 0, TY, 0 */
    var bossGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.0, 10);
    var boss = makeMesh(bossGeo, bossMat);
    boss.scale.set(1.2, 1.2, 1.2);
    boss.position.set(0, TY, 0);
    addToScene(boss);

    _bossEnemy = {
      mesh:     boss,
      hp:       200,
      maxHp:    200,
      speed:    5,
      alive:    true,
      boss:     true,
      hitsNeeded: 5,
      hitsReceived: 0,
      moveDir:  new THREE.Vector3(1, 0, 0),
      changeDirTimer: 2
    };
    _enemies.push(_bossEnemy);
    _enemyCount = 9;
  }

  /* ════════════════════════════════════════════════════════════════════════
     WEAPON CACHES — 3 hidden in dead-ends
  ════════════════════════════════════════════════════════════════════════ */

  function buildCaches() {
    var cacheMat = new THREE.MeshLambertMaterial({ color: 0xCC9933, emissive: 0x553300, emissiveIntensity: 0.3 });
    var TY = -6;
    var cachePositions = [
      [-33, TY, 0],
      [18,  TY, 0],
      [0,   TY, -18]
    ];

    for (var i = 0; i < cachePositions.length; i++) {
      var cp = cachePositions[i];
      var cacheGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
      var cache = makeMesh(cacheGeo, cacheMat);
      cache.position.set(cp[0], cp[1], cp[2]);
      addToScene(cache);
      _caches.push({ mesh: cache, pos: new THREE.Vector3(cp[0], cp[1], cp[2]), collected: false });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     VENTILATION — 2 vents per tunnel block
  ════════════════════════════════════════════════════════════════════════ */

  function buildVents() {
    var ventMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var TY = -6;
    var ventDefs = [
      /* [x, y, z, exitX, exitZ] */
      [-25, TY + 1.1, 0,   -25, -5],
      [-10, TY + 1.1, 0,   -10, -5],
      [  0, TY + 1.1, -8,    5, -8],
      [  0, TY + 1.1,  8,    5,  8],
      [ 10, TY + 1.1,  0,   10,  5],
      [ -5, TY + 1.1,  0,   -5,  5]
    ];

    for (var i = 0; i < ventDefs.length; i++) {
      var vd = ventDefs[i];
      var ventGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8);
      var vent = makeMesh(ventGeo, ventMat);
      vent.position.set(vd[0], vd[1], vd[2]);
      vent.rotation.x = Math.PI / 2;
      addToScene(vent);
      _vents.push({
        mesh: vent,
        pos:  new THREE.Vector3(vd[0], vd[1], vd[2]),
        exit: new THREE.Vector3(vd[3], 0, vd[4])
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     COMMAND CENTER — objective at tunnel center
  ════════════════════════════════════════════════════════════════════════ */

  function buildCommandCenter() {
    var TY = -6;
    var ccMat     = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var lightMat  = new THREE.MeshLambertMaterial({ color: 0xFFFF00, emissive: 0xAAAA00, emissiveIntensity: 1 });
    var antenMat  = new THREE.MeshLambertMaterial({ color: 0x888888 });

    /* Main structure 5x3x5 */
    var ccGeo = new THREE.BoxGeometry(5, 3, 5);
    _commandCenter = makeMesh(ccGeo, ccMat);
    _commandCenter.position.set(-8, TY + 0.5, -5);
    addToScene(_commandCenter);

    /* Light blocks on top */
    var lbMat = new THREE.MeshLambertMaterial({ color: 0xFFFF44, emissive: 0xAAAA00 });
    for (var li = 0; li < 4; li++) {
      var lbGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
      var lb = makeMesh(lbGeo, lbMat);
      var lbOff = [[-1.5, 0, -1.5], [1.5, 0, -1.5], [-1.5, 0, 1.5], [1.5, 0, 1.5]];
      lb.position.set(-8 + lbOff[li][0], TY + 2.2, -5 + lbOff[li][2]);
      addToScene(lb);
    }

    /* Antenna */
    var antenGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6);
    _commandAntenna = makeMesh(antenGeo, antenMat);
    _commandAntenna.position.set(-8, TY + 3.75, -5);
    addToScene(_commandAntenna);

    /* Command light */
    _commandLight = new THREE.PointLight(0x44FF44, 1.0, 8);
    _commandLight.position.set(-8, TY + 1, -5);
    _scene.add(_commandLight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'tunnel-warfare-hud';
    _hud.style.cssText = [
      'position:absolute',
      'top:8px',
      'left:8px',
      'color:#00FF88',
      'font:bold 13px monospace',
      'background:rgba(0,0,0,0.65)',
      'padding:5px 10px',
      'border:1px solid #00FF88',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    /* Map overlay */
    _mapOverlay = document.createElement('div');
    _mapOverlay.style.cssText = [
      'position:absolute',
      'top:50px',
      'left:50px',
      'width:200px',
      'height:200px',
      'background:rgba(0,0,0,0.85)',
      'border:2px solid #00FF88',
      'display:none',
      'z-index:901',
      'pointer-events:none'
    ].join(';');

    _mapCanvas = document.createElement('canvas');
    _mapCanvas.width  = 200;
    _mapCanvas.height = 200;
    _mapCtx = _mapCanvas.getContext('2d');
    _mapOverlay.appendChild(_mapCanvas);
    document.body.appendChild(_mapOverlay);
  }

  function updateHUD() {
    if (!_hud || !_active) return;
    var alive = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) alive++;
    }
    var depthStr  = _inTunnel ? '5m' : '0m';
    var o2Str     = Math.max(0, Math.floor(_oxygen)) + '%';
    var colStr    = Math.min(100, Math.floor(_collapsePercent)) + '%';
    var cacheStr  = _cacheCollected + '/' + _totalCaches;
    _hud.textContent = 'TUNNEL WAR [DEPTH: ' + depthStr + '] [O2: ' + o2Str + '] [COLLAPSE: ' + colStr + '] [CACHE: ' + cacheStr + '] | ENEMY: ' + alive;
  }

  /* ════════════════════════════════════════════════════════════════════════
     TUNNEL MAP DRAW
  ════════════════════════════════════════════════════════════════════════ */

  function drawMap() {
    if (!_mapCtx) return;
    var ctx = _mapCtx;
    var W = 200, H = 200;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, W, H);

    /* Scale: world coords -40..20 -> map 0..200 */
    function toMapX(wx) { return (wx + 40) / 60 * W; }
    function toMapZ(wz) { return (wz + 25) / 50 * H; }

    /* Draw tunnel corridors */
    ctx.strokeStyle = '#005500';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(toMapX(-37), toMapZ(0));
    ctx.lineTo(toMapX(18),  toMapZ(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toMapX(0), toMapZ(-20));
    ctx.lineTo(toMapX(0), toMapZ(20));
    ctx.stroke();

    /* Collapsed tunnel segments shown darker */
    ctx.strokeStyle = '#002200';
    ctx.lineWidth = 8;
    for (var i = 0; i < _tunnelSegments.length; i++) {
      var seg = _tunnelSegments[i];
      if (seg.collapsed) {
        ctx.beginPath();
        ctx.moveTo(toMapX(seg.cx), toMapZ(seg.cz));
        ctx.lineTo(toMapX(seg.cx), toMapZ(seg.cz));
        ctx.arc(toMapX(seg.cx), toMapZ(seg.cz), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#440000';
        ctx.fill();
      }
    }

    /* Command Center */
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(toMapX(-10) - 5, toMapZ(-7) - 5, 10, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px monospace';
    ctx.fillText('CMD', toMapX(-10) - 8, toMapZ(-7) - 7);

    /* Entrances */
    ctx.fillStyle = '#FFCC44';
    for (var ei = 0; ei < _entrances.length; ei++) {
      var epos = _entrances[ei].pos;
      ctx.beginPath();
      ctx.arc(toMapX(epos.x), toMapZ(epos.z), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Caches */
    for (var ci = 0; ci < _caches.length; ci++) {
      var c = _caches[ci];
      if (!c.collected) {
        ctx.fillStyle = '#CC9933';
        ctx.fillRect(toMapX(c.pos.x) - 3, toMapZ(c.pos.z) - 3, 6, 6);
      }
    }

    /* Enemies */
    for (var eni = 0; eni < _enemies.length; eni++) {
      var en = _enemies[eni];
      if (!en.alive) continue;
      ctx.fillStyle = en.boss ? '#FF0000' : '#FF4400';
      ctx.beginPath();
      ctx.arc(toMapX(en.mesh.position.x), toMapZ(en.mesh.position.z), en.boss ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Player */
    if (_camera) {
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.arc(toMapX(_camera.position.x), toMapZ(_camera.position.z), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Legend */
    ctx.fillStyle = '#00FF88';
    ctx.font = '9px monospace';
    ctx.fillText('MAP [M to close]', 5, 15);
    ctx.fillStyle = '#FFCC44'; ctx.fillRect(5, 170, 8, 8); ctx.fillStyle = '#CCC'; ctx.fillText('ENTRANCE', 16, 178);
    ctx.fillStyle = '#CC9933'; ctx.fillRect(5, 182, 8, 8); ctx.fillStyle = '#CCC'; ctx.fillText('CACHE', 16, 190);
    ctx.fillStyle = '#00FFFF'; ctx.beginPath(); ctx.arc(9, 196, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#CCC'; ctx.fillText('YOU', 16, 199);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENTRANCE LABELS (project to screen)
  ════════════════════════════════════════════════════════════════════════ */

  function updateEntranceLabels() {
    if (!_camera || !_canvas) return;
    var W = _canvas.width  || window.innerWidth;
    var H = _canvas.height || window.innerHeight;
    var projVec = new THREE.Vector3();

    for (var i = 0; i < _entrances.length; i++) {
      var en = _entrances[i];
      projVec.copy(en.pos);
      projVec.project(_camera);
      var sx = (projVec.x * 0.5 + 0.5) * W;
      var sy = (-projVec.y * 0.5 + 0.5) * H;
      var visible = projVec.z > 0 && projVec.z < 1 && !_inTunnel;
      en.label.style.display = visible ? 'block' : 'none';
      en.label.style.left = sx + 'px';
      en.label.style.top  = sy + 'px';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DEMOLITION CHARGE
  ════════════════════════════════════════════════════════════════════════ */

  function placeCharge() {
    if (!_active || !_inTunnel) return;
    var chargeMat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0x881100 });
    var chargeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.6);
    var charge = makeMesh(chargeGeo, chargeMat);
    var pos = new THREE.Vector3();
    pos.copy(_camera.position);
    pos.y -= 0.5;
    charge.position.copy(pos);
    addToScene(charge);
    _charges.push({ mesh: charge, pos: pos.clone(), timer: 3.0 });

    showNotification('CHARGE PLACED — 3 SECONDS', '#FF4400');
  }

  function detonateCharge(charge) {
    /* Find nearest tunnel segment */
    var nearest = null;
    var nearDist = 999;
    for (var i = 0; i < _tunnelSegments.length; i++) {
      var seg = _tunnelSegments[i];
      if (seg.collapsed) continue;
      var d = dist2D(charge.pos.x, charge.pos.z, seg.cx, seg.cz);
      if (d < nearDist) { nearDist = d; nearest = seg; }
    }

    if (nearest && nearDist < 10) {
      collapseSegment(nearest);
    }

    /* Spawn debris */
    spawnDebris(charge.pos, 12);

    /* Remove charge */
    _scene.remove(charge.mesh);
    showNotification('BOOM! TUNNEL COLLAPSED', '#FF6600');
  }

  function collapseSegment(seg) {
    if (seg.collapsed) return;
    seg.collapsed = true;
    _scene.remove(seg.ceiling);
    _scene.remove(seg.wallL);
    _scene.remove(seg.wallR);
    spawnDebris(new THREE.Vector3(seg.cx, seg.cy, seg.cz), 20);
    /* Add rock rubble */
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (var ri = 0; ri < 8; ri++) {
      var rg = new THREE.BoxGeometry(randBetween(0.3, 0.9), randBetween(0.2, 0.5), randBetween(0.3, 0.7));
      var rock = makeMesh(rg, rockMat);
      rock.position.set(
        seg.cx + randBetween(-1.2, 1.2),
        seg.cy - 1 + randBetween(0, 0.5),
        seg.cz + randBetween(-6, 6)
      );
      rock.rotation.set(randBetween(0, Math.PI), randBetween(0, Math.PI), randBetween(0, Math.PI));
      addToScene(rock);
    }
  }

  function spawnDebris(pos, count) {
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (var i = 0; i < count; i++) {
      var dg = new THREE.BoxGeometry(randBetween(0.1, 0.4), randBetween(0.1, 0.3), randBetween(0.1, 0.4));
      var dm = makeMesh(dg, debrisMat);
      dm.position.copy(pos);
      dm.position.x += randBetween(-2, 2);
      dm.position.z += randBetween(-2, 2);
      addToScene(dm);
      _debris.push({
        mesh: dm,
        vel:  new THREE.Vector3(randBetween(-3, 3), randBetween(2, 6), randBetween(-3, 3)),
        life: randBetween(1.5, 3.0)
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FLOOD WATER
  ════════════════════════════════════════════════════════════════════════ */

  function triggerFlood() {
    if (_flooding) return;
    _flooding = true;
    _floodLevel = -8.5;
    _floodTimer = 0;

    var waterMat = new THREE.MeshLambertMaterial({
      color: 0x224488,
      transparent: true,
      opacity: 0.55
    });
    var waterGeo = new THREE.BoxGeometry(80, 0.3, 60);
    _waterMesh = makeMesh(waterGeo, waterMat);
    _waterMesh.position.set(-10, _floodLevel, 0);
    addToScene(_waterMesh);
    showNotification('WARNING: TUNNEL FLOODING!', '#2244FF');
  }

  /* ════════════════════════════════════════════════════════════════════════
     NOTIFICATIONS
  ════════════════════════════════════════════════════════════════════════ */

  function showNotification(text, color) {
    var notif = document.createElement('div');
    notif.style.cssText = [
      'position:absolute',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + (color || '#FFFFFF'),
      'font:bold 18px monospace',
      'background:rgba(0,0,0,0.8)',
      'padding:8px 18px',
      'border:2px solid ' + (color || '#FFFFFF'),
      'pointer-events:none',
      'z-index:950'
    ].join(';');
    notif.textContent = text;
    document.body.appendChild(notif);
    setTimeout(function () {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 2500);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION SEQUENCE
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) return;
    _active          = true;
    _score           = 0;
    _inTunnel        = false;
    _depth           = 0;
    _oxygen          = 100;
    _collapsePercent = 0;
    _cacheCollected  = 0;
    _flooding        = false;
    _floodLevel      = 0;
    _floodTimer      = 0;
    _oxygenTimer     = 0;
    _mapVisible      = false;

    buildTunnels();
    buildEntrances();
    buildLighting();
    buildEnemies();
    buildCaches();
    buildVents();
    buildCommandCenter();

    _hud.style.display = 'block';
    updateHUD();
    showNotification('TUNNEL WARFARE ACTIVE — Press E near entrance to descend', '#00FF88');
  }

  /* ════════════════════════════════════════════════════════════════════════
     DESCEND INTO TUNNEL
  ════════════════════════════════════════════════════════════════════════ */

  function tryDescend() {
    if (!_active || _inTunnel || _descending) return;
    /* Check proximity to any entrance */
    for (var i = 0; i < _entrances.length; i++) {
      var en = _entrances[i];
      if (!_camera) return;
      var d = dist2D(_camera.position.x, _camera.position.z, en.pos.x, en.pos.z);
      if (d < 3) {
        _descending   = true;
        _descendTimer = 0;
        _descendTarget = _camera.position.y - 5;
        showNotification('DESCENDING INTO TUNNEL...', '#00FF88');
        return;
      }
    }
    /* Check if near a vent exit while in tunnel — ascend */
    if (_inTunnel) {
      for (var vi = 0; vi < _vents.length; vi++) {
        var vent = _vents[vi];
        var vd = dist2D(_camera.position.x, _camera.position.z, vent.pos.x, vent.pos.z);
        if (vd < 2) {
          _camera.position.copy(vent.exit);
          _camera.position.y = 1.7;
          _inTunnel = false;
          _depth    = 0;
          showNotification('CRAWLED THROUGH VENT', '#00FF88');
          return;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateEnemies(dt) {
    var TY = -6;
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;

      en.changeDirTimer -= dt;
      if (en.changeDirTimer <= 0) {
        en.changeDirTimer = randBetween(1.5, 4.0);
        /* Chase camera if nearby */
        if (_camera && _inTunnel) {
          var dx = _camera.position.x - en.mesh.position.x;
          var dz = _camera.position.z - en.mesh.position.z;
          var len = Math.sqrt(dx * dx + dz * dz);
          if (len > 0.01 && len < 20) {
            en.moveDir.set(dx / len, 0, dz / len);
          } else {
            en.moveDir.set(randBetween(-1, 1), 0, randBetween(-1, 1)).normalize();
          }
        } else {
          en.moveDir.set(randBetween(-1, 1), 0, randBetween(-1, 1)).normalize();
        }
      }

      en.mesh.position.x += en.moveDir.x * en.speed * dt;
      en.mesh.position.z += en.moveDir.z * en.speed * dt;
      en.mesh.position.y = TY;

      /* Clamp to tunnel area */
      en.mesh.position.x = Math.max(-37, Math.min(20, en.mesh.position.x));
      en.mesh.position.z = Math.max(-20, Math.min(20, en.mesh.position.z));

      /* Check if enemy is close to flood — flee or drown */
      if (_flooding && _waterMesh) {
        if (en.mesh.position.y < _floodLevel + 0.5) {
          en.alive = false;
          _scene.remove(en.mesh);
          _score += 50;
          continue;
        }
      }

      /* Boss triggers flood when HP drops below 50% */
      if (en.boss && en.alive && en.hp < en.maxHp * 0.5 && !_flooding) {
        triggerFlood();
      }

      /* Check player collision (damage) */
      if (_camera && _inTunnel) {
        var pdx = _camera.position.x - en.mesh.position.x;
        var pdz = _camera.position.z - en.mesh.position.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist < 1.5) {
          /* Enemy hits player — flash HUD */
          if (_hud) {
            _hud.style.color = '#FF0000';
            setTimeout(function () { if (_hud) _hud.style.color = '#00FF88'; }, 200);
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     LANTERN FLICKER UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateLanterns(dt) {
    for (var i = 0; i < _lanterns.length; i++) {
      var lan = _lanterns[i];
      if (!lan.doesFlicker) continue;
      lan.flickerTimer -= dt;
      if (lan.flickerTimer <= 0) {
        lan.on = !lan.on;
        lan.light.intensity = lan.on ? 0.8 : 0;
        lan.flickerTimer = lan.on ? randBetween(0.3, 1.5) : randBetween(0.05, 0.3);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DEBRIS / COLLAPSE PHYSICS
  ════════════════════════════════════════════════════════════════════════ */

  function updateDebris(dt) {
    for (var i = _debris.length - 1; i >= 0; i--) {
      var db = _debris[i];
      db.life -= dt;
      db.vel.y -= 9.8 * dt;
      db.mesh.position.x += db.vel.x * dt;
      db.mesh.position.y += db.vel.y * dt;
      db.mesh.position.z += db.vel.z * dt;
      if (db.life <= 0) {
        _scene.remove(db.mesh);
        _debris.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CHARGE TIMERS
  ════════════════════════════════════════════════════════════════════════ */

  function updateCharges(dt) {
    for (var i = _charges.length - 1; i >= 0; i--) {
      var ch = _charges[i];
      ch.timer -= dt;
      if (ch.timer <= 0) {
        detonateCharge(ch);
        _charges.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FLOOD UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateFlood(dt) {
    if (!_flooding || !_waterMesh) return;
    _floodTimer += dt;
    /* Water rises from -8.5 to -5 over 20s */
    _floodLevel = -8.5 + (_floodTimer / 20) * 3.5;
    _waterMesh.position.y = _floodLevel;

    /* Player drowning check */
    if (_camera && _inTunnel && _camera.position.y < _floodLevel + 0.5) {
      _oxygen -= dt * 8;
      if (_oxygen <= 0) {
        _oxygen = 0;
        showNotification('YOU DROWNED — GAME OVER', '#0044FF');
        _active = false;
      }
    } else if (_oxygen < 100) {
      _oxygen = Math.min(100, _oxygen + dt * 5);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CACHE COLLECTION CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function checkCaches() {
    if (!_camera) return;
    for (var i = 0; i < _caches.length; i++) {
      var c = _caches[i];
      if (c.collected) continue;
      var d = dist2D(_camera.position.x, _camera.position.z, c.pos.x, c.pos.z);
      if (d < 2 && Math.abs(_camera.position.y - c.pos.y) < 3) {
        c.collected = true;
        _scene.remove(c.mesh);
        _cacheCollected++;
        _score += 200;
        showNotification('+200 CACHE FOUND! (' + _cacheCollected + '/' + _totalCaches + ')', '#CC9933');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     COLLAPSE METER — shooting within tunnel increases collapse risk
  ════════════════════════════════════════════════════════════════════════ */

  function onShootInTunnel() {
    if (!_inTunnel || !_active) return;
    _collapsePercent += 8;
    if (_collapsePercent >= 100) {
      _collapsePercent = 100;
      triggerRandomCollapse();
    }
  }

  function triggerRandomCollapse() {
    /* Pick a random non-collapsed segment */
    var candidates = [];
    for (var i = 0; i < _tunnelSegments.length; i++) {
      if (!_tunnelSegments[i].collapsed) candidates.push(_tunnelSegments[i]);
    }
    if (candidates.length === 0) return;
    var seg = candidates[Math.floor(Math.random() * candidates.length)];
    collapseSegment(seg);
    spawnDebris(new THREE.Vector3(seg.cx, seg.cy + 1, seg.cz), 15);
    _collapsePercent = Math.max(0, _collapsePercent - 40);
    showNotification('TUNNEL COLLAPSING! TAKE COVER!', '#FF4400');
  }

  /* ════════════════════════════════════════════════════════════════════════
     COMMAND CENTER DESTRUCTION CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function checkCommandCenter() {
    if (!_commandCenter || !_commandCenter.parent) return;
    if (!_camera) return;
    var d = dist2D(_camera.position.x, _camera.position.z,
                   _commandCenter.position.x, _commandCenter.position.z);
    /* Command center destroyed if player places charge nearby */
    if (d < 4) {
      /* Mark for potential destruction via charge */
    }
  }

  function destroyCommandCenter() {
    if (!_commandCenter || !_commandCenter.parent) return;
    _scene.remove(_commandCenter);
    _scene.remove(_commandAntenna);
    if (_commandLight) _scene.remove(_commandLight);
    spawnDebris(_commandCenter.position, 25);
    _commandCenter = null;
    _score += 1000;
    showNotification('COMMAND CENTER DESTROYED! +1000 POINTS', '#00FF88');
    /* Win condition */
    setTimeout(function () {
      showNotification('MISSION COMPLETE! Score: ' + _score, '#FFFF00');
    }, 3000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     DESCEND ANIMATION
  ════════════════════════════════════════════════════════════════════════ */

  function updateDescend(dt) {
    if (!_descending || !_camera) return;
    _descendTimer += dt;
    var t = Math.min(_descendTimer, 1.0);
    _camera.position.y += (_descendTarget - _camera.position.y) * (dt * 4);
    if (t >= 1.0 || Math.abs(_camera.position.y - _descendTarget) < 0.1) {
      _camera.position.y = _descendTarget;
      _descending = false;
      _inTunnel   = true;
      _depth      = 5;
      showNotification('UNDERGROUND — O2 depleting slowly', '#00FF88');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     OXYGEN DRAIN WHILE UNDERGROUND
  ════════════════════════════════════════════════════════════════════════ */

  function updateOxygen(dt) {
    if (!_inTunnel) return;
    _oxygenTimer += dt;
    if (_oxygenTimer >= 5.0) {
      _oxygenTimer = 0;
      _oxygen = Math.max(0, _oxygen - 0.5);
    }
    if (_oxygen <= 0) {
      showNotification('O2 DEPLETED — SUFFOCATING', '#FF4400');
      _active = false;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var key = e.key.toUpperCase();
    _keys[key] = true;

    /* T+W simultaneous activation */
    if (key === 'T' || key === 'W') {
      _twTimes[key] = Date.now();
      var other = (key === 'T') ? 'W' : 'T';
      if (_twTimes[other] && (Date.now() - _twTimes[other]) < TW_WINDOW) {
        if (!_active) {
          activate();
          return;
        }
      }
    }

    if (!_active) return;

    if (key === 'E') {
      tryDescend();
    }
    if (key === 'C') {
      placeCharge();
    }
    if (key === 'M') {
      _mapVisible = !_mapVisible;
      _mapOverlay.style.display = _mapVisible ? 'block' : 'none';
    }

    /* Detect shooting keys to raise collapse meter */
    if (key === ' ' || key === 'MOUSE0') {
      onShootInTunnel();
    }
  }

  function onKeyUp(e) {
    var key = e.key.toUpperCase();
    _keys[key] = false;
  }

  function onMouseDown(e) {
    if (e.button === 0 && _active && _inTunnel) {
      onShootInTunnel();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    buildHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE (called every frame from main game loop)
  ════════════════════════════════════════════════════════════════════════ */

  function update(dt) {
    if (!_active) return;
    if (!dt || dt <= 0 || dt > 0.5) dt = 0.016;

    updateDescend(dt);
    updateLanterns(dt);
    updateEnemies(dt);
    updateDebris(dt);
    updateCharges(dt);
    updateFlood(dt);
    updateOxygen(dt);
    checkCaches();
    checkCommandCenter();
    updateEntranceLabels();

    if (_mapVisible) drawMap();

    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET — remove all tunnel objects, clean up DOM
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    /* Remove all tracked meshes from scene */
    for (var i = 0; i < _allObjects.length; i++) {
      if (_allObjects[i].parent) _scene.remove(_allObjects[i]);
    }
    _allObjects = [];

    /* Remove lantern lights */
    for (var li = 0; li < _lanterns.length; li++) {
      _scene.remove(_lanterns[li].light);
    }

    /* Remove command center light */
    if (_commandLight && _commandLight.parent) _scene.remove(_commandLight);

    /* Remove water */
    if (_waterMesh && _waterMesh.parent) _scene.remove(_waterMesh);

    /* Remove entrance labels */
    for (var ei = 0; ei < _entrances.length; ei++) {
      var label = _entrances[ei].label;
      if (label && label.parentNode) label.parentNode.removeChild(label);
    }

    /* Remove HUD */
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_mapOverlay && _mapOverlay.parentNode) _mapOverlay.parentNode.removeChild(_mapOverlay);

    /* Reset state */
    _active          = false;
    _inTunnel        = false;
    _depth           = 0;
    _oxygen          = 100;
    _collapsePercent = 0;
    _cacheCollected  = 0;
    _flooding        = false;
    _floodLevel      = 0;
    _floodTimer      = 0;
    _oxygenTimer     = 0;
    _descending      = false;
    _mapVisible      = false;
    _tunnelSegments  = [];
    _supportBeams    = [];
    _entrances       = [];
    _lanterns        = [];
    _enemies         = [];
    _charges         = [];
    _debris          = [];
    _caches          = [];
    _vents           = [];
    _commandCenter   = null;
    _commandAntenna  = null;
    _commandLight    = null;
    _bossEnemy       = null;
    _waterMesh       = null;
    _hud             = null;
    _mapCanvas       = null;
    _mapCtx          = null;
    _mapOverlay      = null;
    _score           = 0;
    _enemyCount      = 8;

    document.removeEventListener('keydown',   onKeyDown);
    document.removeEventListener('keyup',     onKeyUp);
    document.removeEventListener('mousedown', onMouseDown);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
