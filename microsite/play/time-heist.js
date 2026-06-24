window.TimeHeist = (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW = 400;
  var PHASE_TIME = 90;
  var PHASE_EGYPT = 0;
  var PHASE_MEDIEVAL = 1;
  var PHASE_FUTURE = 2;
  var PHASE_DONE = 3;

  var ERA_NAMES = ['ANCIENT EGYPT 1300 BC', 'MEDIEVAL EUROPE 1345 AD', 'NEAR FUTURE 2087 AD'];

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    animId: null,

    // activation
    tKeyTime: 0,
    iKeyTime: 0,
    tPressed: false,
    iPressed: false,

    // player
    playerMesh: null,
    playerPos: { x: 0, y: 0.9, z: 8 },
    playerHP: 100,
    playerStunTimer: 0,
    playerYaw: 0,
    pointerLocked: false,
    moveKeys: {},

    // phase
    phase: PHASE_EGYPT,
    phaseTimer: PHASE_TIME,
    artifactsCollected: 0,
    artifactThisPhase: false,
    killsThisPhase: 0,
    paradoxLevel: 0,
    ghostBonus: 0,
    score: 0,
    gameOver: false,
    won: false,
    phaseObjects: [],

    // enemies
    enemies: [],
    bullets: [],

    // portal
    portalMesh: null,
    portalAngle: 0,

    // phase-specific
    falsewallOpen: false,
    drawbridgeLowered: false,
    laserActive: true,
    terminalHits: 0,
    elevatorRiding: false,
    elevatorTimer: 0,
    elevatorMesh: null,
    priestMesh: null,
    artifactMesh: null,
    falseWallMesh: null,
    drawbridgeMesh: null,
    laserMesh: null,
    terminals: [],
    terminalPressed: [],

    // hud
    hudEl: null,

    // flash
    flashEl: null,
    flashTimer: 0
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function makeBox(w, h, d, color, emissive) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = 0.6;
    }
    return new THREE.Mesh(geo, mat);
  }

  function makeCyl(rt, rb, h, segs, color, emissive) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = 0.6;
    }
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeCone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs || 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeLines(pts, color) {
    var geo = new THREE.BufferGeometry();
    var arr = [];
    for (var i = 0; i < pts.length; i++) {
      arr.push(pts[i][0], pts[i][1], pts[i][2]);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function addObj(mesh) {
    state.phaseObjects.push(mesh);
    state.scene.add(mesh);
    return mesh;
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function flashScreen(color, duration) {
    if (!state.flashEl) { return; }
    state.flashEl.style.background = color;
    state.flashEl.style.opacity = '0.55';
    state.flashTimer = duration || 0.25;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function initHUD() {
    var old = document.getElementById('th-hud');
    if (old) { old.parentNode.removeChild(old); }

    var hud = document.createElement('div');
    hud.id = 'th-hud';
    hud.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'z-index:2000', 'background:rgba(0,0,0,0.72)',
      'color:#00FFCC', 'font-family:monospace',
      'font-size:13px', 'padding:5px 12px',
      'pointer-events:none', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hud);
    state.hudEl = hud;

    var flash = document.createElement('div');
    flash.id = 'th-flash';
    flash.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'z-index:1999', 'opacity:0', 'pointer-events:none',
      'transition:opacity 0.15s'
    ].join(';');
    document.body.appendChild(flash);
    state.flashEl = flash;
  }

  function updateHUD() {
    if (!state.hudEl) { return; }
    var eraName = ERA_NAMES[state.phase] || 'PRESENT';
    var t = Math.max(0, Math.ceil(state.phaseTimer));
    var dx = 0 - state.playerPos.x;
    var dz = 0 - state.playerPos.z;
    var pDist = Math.sqrt(dx * dx + dz * dz).toFixed(1);
    state.hudEl.textContent = [
      'TIME HEIST',
      '[PHASE: ' + eraName + ']',
      '[ARTIFACTS: ' + state.artifactsCollected + '/3]',
      '[TIME: ' + t + 's]',
      '[PARADOX LEVEL: ' + state.paradoxLevel + ']',
      '| PORTAL: ' + pDist + 'm away'
    ].join(' ');
  }

  function showMsg(text, color, duration) {
    var el = document.getElementById('th-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'th-msg';
      el.style.cssText = [
        'position:fixed', 'top:60px', 'left:50%',
        'transform:translateX(-50%)',
        'z-index:2001', 'font-family:monospace',
        'font-size:20px', 'font-weight:bold',
        'text-shadow:0 0 8px currentColor',
        'pointer-events:none', 'text-align:center',
        'transition:opacity 0.4s'
      ].join(';');
      document.body.appendChild(el);
    }
    el.style.color = color || '#00FFCC';
    el.style.opacity = '1';
    el.textContent = text;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; }, (duration || 2000));
  }

  // ─── Scene ────────────────────────────────────────────────────────────────
  function initScene() {
    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    state.camera.position.set(0, 1.7, 10);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.setSize(window.innerWidth, window.innerHeight);

    var wrap = document.getElementById('th-canvas-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'th-canvas-wrap';
      wrap.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1900;';
      document.body.appendChild(wrap);
    }
    wrap.appendChild(state.renderer.domElement);

    state.clock = new THREE.Clock();
  }

  function clearPhase() {
    for (var i = 0; i < state.phaseObjects.length; i++) {
      state.scene.remove(state.phaseObjects[i]);
    }
    state.phaseObjects = [];
    for (var j = 0; j < state.enemies.length; j++) {
      state.scene.remove(state.enemies[j].mesh);
      if (state.enemies[j].head) { state.scene.remove(state.enemies[j].head); }
    }
    state.enemies = [];
    for (var k = 0; k < state.bullets.length; k++) {
      state.scene.remove(state.bullets[k].mesh);
    }
    state.bullets = [];
    if (state.portalMesh) { state.scene.remove(state.portalMesh); state.portalMesh = null; }
  }

  // ─── Phase 1: Ancient Egypt ───────────────────────────────────────────────
  function buildEgypt() {
    state.scene.background = new THREE.Color(0xE8C46A);
    state.scene.fog = null;

    // Ground
    var ground = makeBox(100, 1, 100, 0xDDB870);
    ground.position.set(0, -0.5, 0);
    addObj(ground);

    // Pyramid (main)
    var pyr = makeBox(20, 15, 20, 0xCC9944);
    pyr.position.set(0, 7.5, -25);
    addObj(pyr);

    // Inner chamber entrance
    var chamber = makeBox(8, 5, 6, 0xBB8833);
    chamber.position.set(0, 2.5, -15);
    addObj(chamber);

    // False wall (same color as chamber) — blocks secret passage
    var falseWall = makeBox(3, 4, 0.4, 0xBB8833);
    falseWall.position.set(-4, 2, -12);
    addObj(falseWall);
    state.falseWallMesh = falseWall;
    state.falsewallOpen = false;

    // Secret passage behind false wall
    var passage = makeBox(3, 4, 6, 0xAA7722);
    passage.position.set(-4, 2, -15);
    addObj(passage);

    // Artifact: golden ankh in inner chamber
    var ankh = makeBox(0.6, 1.2, 0.2, 0xFFCC00, 0xFFCC00);
    ankh.position.set(0, 1.5, -22);
    ankh.userData.isArtifact = true;
    addObj(ankh);
    state.artifactMesh = ankh;

    // Obelisks
    var ob1 = makeBox(1, 8, 1, 0xCC9944);
    ob1.position.set(14, 4, -10);
    addObj(ob1);
    var ob1tip = makeCone(0.7, 1.5, 4, 0xFFCC00);
    ob1tip.position.set(14, 8.75, -10);
    addObj(ob1tip);

    var ob2 = makeBox(1, 8, 1, 0xCC9944);
    ob2.position.set(-14, 4, -10);
    addObj(ob2);
    var ob2tip = makeCone(0.7, 1.5, 4, 0xFFCC00);
    ob2tip.position.set(-14, 8.75, -10);
    addObj(ob2tip);

    // Desert rocks
    var rock1 = makeBox(3, 1.5, 2, 0xBBAA88);
    rock1.position.set(18, 0.75, -5);
    addObj(rock1);
    var rock2 = makeBox(2, 1, 1.5, 0xBBAA88);
    rock2.position.set(-20, 0.5, -8);
    addObj(rock2);

    // Lighting
    var amb = new THREE.AmbientLight(0xFFE08A, 0.8);
    addObj(amb);
    var sun = new THREE.DirectionalLight(0xFFCC44, 1.3);
    sun.position.set(15, 30, 10);
    addObj(sun);

    // Portal
    buildPortal(0, 0, 0);

    // Enemies: 3 pharaoh guards + 2 guard dogs
    spawnEgyptGuard(-8, 0, -5);
    spawnEgyptGuard(8, 0, -5);
    spawnEgyptGuard(0, 0, -18);
    spawnGuardDog(-6, 0, 2);
    spawnGuardDog(6, 0, 2);

    // Paradox: extra guards if previous phase (none for Egypt)
    // Additional guards for paradox level
    if (state.paradoxLevel >= 1) {
      spawnEgyptGuard(-12, 0, -12);
      spawnEgyptGuard(12, 0, -12);
    }
  }

  function spawnEgyptGuard(x, y, z) {
    var body = makeBox(0.8, 1.6, 0.6, 0x886622);
    body.position.set(x, y + 0.8, z);
    state.scene.add(body);
    var head = makeBox(0.6, 0.6, 0.6, 0xCC9966);
    head.position.set(x, y + 1.9, z);
    state.scene.add(head);
    // Spear
    var spear = makeBox(0.1, 2.2, 0.1, 0x774411);
    spear.position.set(x + 0.45, y + 1.1, z);
    state.scene.add(spear);
    var enemy = {
      mesh: body, head: head, extra: spear,
      type: 'guard', phase: PHASE_EGYPT,
      hp: 60, maxHP: 60,
      dmg: 40, range: 3,
      speed: 1.8, reactTime: 1.2,
      shootTimer: 1.2 + Math.random() * 0.8,
      alive: true, shield: false,
      stunTimer: 0
    };
    state.enemies.push(enemy);
    return enemy;
  }

  function spawnGuardDog(x, y, z) {
    var body = makeCyl(0.35, 0.35, 0.7, 6, 0x885533);
    body.rotation.z = Math.PI / 2;
    body.position.set(x, y + 0.35, z);
    state.scene.add(body);
    var head = makeSphere(0.3, 0x774422);
    head.position.set(x + 0.5, y + 0.5, z);
    state.scene.add(head);
    var enemy = {
      mesh: body, head: head, extra: null,
      type: 'dog', phase: PHASE_EGYPT,
      hp: 30, maxHP: 30,
      dmg: 20, range: 1.2,
      speed: 3.5, reactTime: 0.4,
      shootTimer: 0.4 + Math.random() * 0.3,
      alive: true, shield: false,
      stunTimer: 0
    };
    state.enemies.push(enemy);
    return enemy;
  }

  // ─── Phase 2: Medieval Europe ─────────────────────────────────────────────
  function buildMedieval(egyptKillCount) {
    state.scene.background = new THREE.Color(0x88887A);
    state.scene.fog = new THREE.FogExp2(0x88887A, 0.03);

    // Ground
    var ground = makeBox(100, 1, 100, 0x666655);
    ground.position.set(0, -0.5, 0);
    addObj(ground);

    // Castle walls
    var castleBase = makeBox(30, 10, 30, 0x888877);
    castleBase.position.set(0, 5, -20);
    addObj(castleBase);

    // Castle towers
    var t1 = makeBox(5, 14, 5, 0x777766);
    t1.position.set(-12.5, 7, -20);
    addObj(t1);
    var t2 = makeBox(5, 14, 5, 0x777766);
    t2.position.set(12.5, 7, -20);
    addObj(t2);

    // Battlements (row of merlons)
    for (var m = -14; m <= 14; m += 4) {
      var merlon = makeBox(1.5, 2, 1.5, 0x888877);
      merlon.position.set(m, 10.5, -5.5);
      addObj(merlon);
    }

    // Drawbridge (LineSegments mechanism)
    var dbPts = [
      [-5, 0, -5], [5, 0, -5],
      [5, 0, -5], [5, 0, -8],
      [5, 0, -8], [-5, 0, -8],
      [-5, 0, -8], [-5, 0, -5]
    ];
    var dbLines = makeLines(dbPts, 0x888866);
    dbLines.position.set(0, 0.1, 0);
    addObj(dbLines);
    state.drawbridgeMesh = dbLines;
    state.drawbridgeLowered = false;

    // Drawbridge solid (visual)
    var db = makeBox(10, 0.4, 3, 0x776644);
    db.position.set(0, 0.2, -6.5);
    addObj(db);

    // Drawbridge mechanism box (shootable)
    var mechanism = makeBox(1, 1, 0.5, 0x554433);
    mechanism.position.set(6, 2, -5);
    mechanism.userData.isMechanism = true;
    addObj(mechanism);

    // Chapel
    var chapel = makeBox(10, 8, 8, 0x777766);
    chapel.position.set(0, 4, -24);
    addObj(chapel);
    var steeple = makeCone(2, 5, 4, 0x666655);
    steeple.position.set(0, 10.5, -24);
    addObj(steeple);

    // Artifact: holy grail in chapel
    var grail = makeCyl(0.4, 0.25, 0.8, 8, 0xFFDD88, 0xFFDD88);
    grail.position.set(0, 0.9, -28);
    grail.userData.isArtifact = true;
    addObj(grail);
    state.artifactMesh = grail;

    // Lighting
    var amb = new THREE.AmbientLight(0xAAAA99, 0.5);
    addObj(amb);
    var moon = new THREE.DirectionalLight(0xCCCCBB, 0.6);
    moon.position.set(-10, 20, 5);
    addObj(moon);

    // Portal
    buildPortal(0, 0, 0);

    // Priest (healing NPC)
    var priest = makeBox(0.7, 1.6, 0.6, 0x888888);
    priest.position.set(5, 0.8, -18);
    addObj(priest);
    var priestHead = makeBox(0.6, 0.6, 0.6, 0xDDCCBB);
    priestHead.position.set(5, 1.9, -18);
    addObj(priestHead);
    state.priestMesh = priest;

    // 5 base knights
    var knightCount = 5;
    // Paradox: Egypt guard kills bring extra knights
    if (egyptKillCount >= 1) {
      knightCount += 3;
      showMsg('PARADOX: Egypt blood echoes — 3 extra knights appear!', '#FF9900', 3000);
      state.paradoxLevel++;
    }
    if (state.paradoxLevel >= 2) {
      knightCount += 2;
    }
    for (var i = 0; i < knightCount; i++) {
      spawnKnight(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 12 - 8
      );
    }
  }

  function spawnKnight(x, y, z) {
    var body = makeBox(0.9, 1.7, 0.7, 0x777788);
    body.position.set(x, y + 0.85, z);
    state.scene.add(body);
    var helm = makeBox(0.75, 0.6, 0.75, 0x666677);
    helm.position.set(x, y + 1.85, z);
    state.scene.add(helm);
    // Shield
    var shield = makeBox(0.1, 1.0, 0.6, 0x555566);
    shield.position.set(x - 0.55, y + 0.9, z);
    state.scene.add(shield);
    var enemy = {
      mesh: body, head: helm, extra: shield,
      type: 'knight', phase: PHASE_MEDIEVAL,
      hp: 120, maxHP: 120,
      dmg: 60, range: 2,
      speed: 1.5, reactTime: 0.9,
      shootTimer: 0.9 + Math.random(),
      alive: true, shield: true,
      stunTimer: 0
    };
    state.enemies.push(enemy);
    return enemy;
  }

  // ─── Phase 3: Near Future 2087 ────────────────────────────────────────────
  function buildFuture(medievalKillCount) {
    state.scene.background = new THREE.Color(0x0A1020);
    state.scene.fog = new THREE.FogExp2(0x0A1020, 0.015);

    // Ground (corporate plaza)
    var ground = makeBox(100, 1, 100, 0x1A2030);
    ground.position.set(0, -0.5, 0);
    addObj(ground);

    // Corporate tower
    var tower = makeBox(15, 40, 15, 0x334455);
    tower.position.set(0, 20, -25);
    addObj(tower);

    // Tower glass panels
    for (var f = 0; f < 8; f++) {
      var panel = makeBox(14, 3.5, 0.2, 0x224466);
      panel.position.set(0, 3 + f * 5, -17.5);
      addObj(panel);
    }

    // Neon lights
    var neon1 = new THREE.PointLight(0x0044FF, 2.0, 35);
    neon1.position.set(-10, 5, -10);
    addObj(neon1);
    var neon2 = new THREE.PointLight(0xFF0044, 2.0, 35);
    neon2.position.set(10, 5, -10);
    addObj(neon2);
    var neon3 = new THREE.PointLight(0x00FFCC, 1.5, 25);
    neon3.position.set(0, 12, -18);
    addObj(neon3);

    // Ambient
    var amb = new THREE.AmbientLight(0x112233, 0.6);
    addObj(amb);

    // Elevator shaft + cab
    var shaft = makeCyl(1.5, 1.5, 40, 8, 0x223344);
    shaft.position.set(8, 20, -18);
    addObj(shaft);
    var cab = makeCyl(1.3, 1.3, 2.5, 8, 0x334455);
    cab.position.set(8, 1.25, -18);
    addObj(cab);
    state.elevatorMesh = cab;
    state.elevatorRiding = false;
    state.elevatorTimer = 0;

    // Laser grid (3 horizontal beams across corridor)
    var laserPts = [
      [-7, 1, -10], [7, 1, -10],
      [-7, 1.5, -12], [7, 1.5, -12],
      [-7, 2, -14], [7, 2, -14]
    ];
    var laserLines = makeLines(laserPts, 0xFF0000);
    addObj(laserLines);
    state.laserMesh = laserLines;
    state.laserActive = true;

    // 3 terminals to disable laser
    var termPos = [[-10, 0, -8], [0, 0, -7], [10, 0, -8]];
    state.terminals = [];
    state.terminalPressed = [false, false, false];
    for (var ti = 0; ti < 3; ti++) {
      var term = makeBox(0.8, 1.8, 0.6, 0x112233);
      term.position.set(termPos[ti][0], 0.9, termPos[ti][2]);
      term.userData.terminalIndex = ti;
      addObj(term);
      state.terminals.push(term);
      var screen = makeBox(0.6, 0.8, 0.15, 0x00FF88, 0x00FF88);
      screen.position.set(termPos[ti][0], 1.3, termPos[ti][2] + 0.38);
      addObj(screen);
    }

    // Server room (floor 30 = y ~148)
    var serverRoom = makeBox(12, 4, 10, 0x223344);
    serverRoom.position.set(0, 37, -25);
    addObj(serverRoom);

    // Artifact: quantum CPU in server room
    var cpu = makeBox(0.8, 0.4, 0.8, 0x00FFFF, 0x00FFFF);
    cpu.position.set(0, 39.2, -25);
    cpu.userData.isArtifact = true;
    addObj(cpu);
    state.artifactMesh = cpu;

    // Portal
    buildPortal(0, 0, 0);

    // Security AI speed modifier from medieval kills
    var aiBoost = 0;
    if (medievalKillCount >= 1) {
      aiBoost = 0.4;
      showMsg('PARADOX: Medieval blood — security AI upgraded!', '#FF4488', 3000);
      state.paradoxLevel++;
    }
    if (state.paradoxLevel >= 3) { aiBoost += 0.3; }

    // 8 security guards (+ paradox extras)
    var guardCount = 8 + state.paradoxLevel;
    for (var gi = 0; gi < guardCount; gi++) {
      spawnSecGuard(
        (Math.random() - 0.5) * 22,
        0,
        (Math.random() - 0.5) * 14 - 5,
        aiBoost
      );
    }
  }

  function spawnSecGuard(x, y, z, aiBoost) {
    var body = makeBox(0.8, 1.7, 0.6, 0x223344);
    body.position.set(x, y + 0.85, z);
    state.scene.add(body);
    var head = makeBox(0.65, 0.6, 0.65, 0x334455);
    head.position.set(x, y + 1.85, z);
    state.scene.add(head);
    var ai = aiBoost || 0;
    var enemy = {
      mesh: body, head: head, extra: null,
      type: 'secguard', phase: PHASE_FUTURE,
      hp: 100, maxHP: 100,
      dmg: 25, range: 15,
      speed: 2.2 + ai, reactTime: 0.6 - ai * 0.2,
      shootTimer: (0.6 - ai * 0.2) + Math.random() * 0.6,
      alive: true, shield: false,
      stunTimer: 0,
      stunDuration: 4,
      usingTaser: Math.random() < 0.5
    };
    state.enemies.push(enemy);
    return enemy;
  }

  // ─── Portal ───────────────────────────────────────────────────────────────
  function buildPortal(x, y, z) {
    var portalGeo = new THREE.CylinderGeometry(2, 2, 0.3, 16);
    var portalMat = new THREE.MeshLambertMaterial({
      color: 0xAA44FF,
      emissive: new THREE.Color(0xAA44FF),
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });
    var portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(x, y + 0.2, z);
    state.scene.add(portal);
    state.portalMesh = portal;
    state.phaseObjects.push(portal);

    var portalLight = new THREE.PointLight(0xAA44FF, 1.8, 10);
    portalLight.position.set(x, y + 1, z);
    state.scene.add(portalLight);
    state.phaseObjects.push(portalLight);
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────
  function playerShoot() {
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(state.camera.quaternion);
    var bullet = makeSphere(0.12, 0xFFFF44);
    bullet.position.copy(state.camera.position);
    bullet.position.addScaledVector(dir, 0.8);
    state.scene.add(bullet);
    state.bullets.push({
      mesh: bullet,
      vel: dir.multiplyScalar(0.5),
      fromPlayer: true,
      life: 2.5
    });
  }

  function enemyShoot(e) {
    var dx = state.playerPos.x - e.mesh.position.x;
    var dy = (state.playerPos.y + 1.7) - e.mesh.position.y;
    var dz = state.playerPos.z - e.mesh.position.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var spd = 0.28;
    var bullet = makeSphere(0.18, e.type === 'secguard' ? 0xFF4400 : 0xFF8800);
    bullet.position.copy(e.mesh.position);
    bullet.position.y += 1.0;
    state.scene.add(bullet);
    state.bullets.push({
      mesh: bullet,
      vel: { x: dx / len * spd, y: dy / len * spd, z: dz / len * spd },
      fromPlayer: false,
      life: 2.5,
      dmg: e.dmg,
      taser: e.type === 'secguard' && e.usingTaser,
      stunDur: e.stunDuration || 4
    });
  }

  // ─── Update: bullets ──────────────────────────────────────────────────────
  function updateBullets(dt) {
    for (var i = state.bullets.length - 1; i >= 0; i--) {
      var b = state.bullets[i];
      b.mesh.position.x += b.vel.x;
      b.mesh.position.y += b.vel.y;
      b.mesh.position.z += b.vel.z;
      b.life -= dt;

      if (b.life <= 0) {
        state.scene.remove(b.mesh);
        state.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        var hit = false;
        for (var j = 0; j < state.enemies.length; j++) {
          var e = state.enemies[j];
          if (!e.alive) { continue; }
          if (dist3(b.mesh.position, e.mesh.position) < 1.1) {
            var dmg = 30;
            // Shield halves damage from front
            if (e.shield && e.type === 'knight') {
              var fwd = { x: e.mesh.position.x - state.playerPos.x, z: e.mesh.position.z - state.playerPos.z };
              var len2 = Math.sqrt(fwd.x * fwd.x + fwd.z * fwd.z) || 1;
              fwd.x /= len2; fwd.z /= len2;
              // if bullet came from roughly the same direction knight faces
              var dot = fwd.x * b.vel.x + fwd.z * b.vel.z;
              if (dot > 0) { dmg = Math.floor(dmg * 0.5); }
            }
            e.hp -= dmg;
            if (e.hp <= 0) {
              killEnemy(e);
            }
            state.scene.remove(b.mesh);
            state.bullets.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) { continue; }

        // Shoot drawbridge mechanism
        if (state.phase === PHASE_MEDIEVAL && !state.drawbridgeLowered) {
          var mechMesh = null;
          for (var mo = 0; mo < state.phaseObjects.length; mo++) {
            if (state.phaseObjects[mo].userData.isMechanism) {
              mechMesh = state.phaseObjects[mo];
              break;
            }
          }
          if (mechMesh && dist3(b.mesh.position, mechMesh.position) < 1.5) {
            state.drawbridgeLowered = true;
            mechMesh.material.color.setHex(0x00FF44);
            showMsg('DRAWBRIDGE LOWERED!', '#AAFFAA', 2000);
            state.scene.remove(b.mesh);
            state.bullets.splice(i, 1);
          }
        }
      } else {
        // Enemy bullet hits player
        var pp = state.playerPos;
        var pdx = b.mesh.position.x - pp.x;
        var pdy = b.mesh.position.y - (pp.y + 1.0);
        var pdz = b.mesh.position.z - pp.z;
        if (Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz) < 0.8) {
          state.playerHP -= b.dmg;
          if (b.taser) {
            state.playerStunTimer = b.stunDur;
            showMsg('STUNNED!', '#FFAA00', 1500);
          }
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            triggerDeath('ELIMINATED');
          }
          state.scene.remove(b.mesh);
          state.bullets.splice(i, 1);
        }
      }
    }
  }

  function killEnemy(e) {
    e.alive = false;
    e.mesh.visible = false;
    if (e.head) { e.head.visible = false; }
    if (e.extra) { e.extra.visible = false; }
    state.killsThisPhase++;
    state.score += 50;
  }

  // ─── Update: enemies ──────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.alive) { continue; }

      // Stun
      if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }

      var pp = state.playerPos;
      var dx = pp.x - e.mesh.position.x;
      var dz = pp.z - e.mesh.position.z;
      var d = Math.sqrt(dx * dx + dz * dz) || 1;

      // Move toward player
      if (d > e.range * 0.8) {
        var spd = e.speed * dt;
        e.mesh.position.x += (dx / d) * spd;
        e.mesh.position.z += (dz / d) * spd;
        if (e.head) {
          e.head.position.x = e.mesh.position.x;
          e.head.position.z = e.mesh.position.z;
        }
        if (e.extra) {
          e.extra.position.x = e.mesh.position.x - (e.type === 'knight' ? 0.55 : 0.45);
          e.extra.position.z = e.mesh.position.z;
        }
      }

      // Attack timer
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.reactTime + Math.random() * 0.8;
        if (d <= e.range) {
          if (e.type === 'guard' || e.type === 'knight') {
            // Melee — check range
            if (d <= e.range) {
              state.playerHP -= e.dmg;
              if (state.playerStunTimer <= 0) {
                showMsg(e.type === 'guard' ? 'SPEAR HIT! -' + e.dmg + ' HP' : 'SWORD STRIKE! -' + e.dmg + ' HP', '#FF4444', 800);
              }
              if (state.playerHP <= 0) { state.playerHP = 0; triggerDeath('DEFEATED'); }
            }
          } else if (e.type === 'dog') {
            if (d <= e.range) {
              state.playerHP -= e.dmg;
              showMsg('DOG BITE! -' + e.dmg + ' HP', '#FF8844', 800);
              if (state.playerHP <= 0) { state.playerHP = 0; triggerDeath('MAULED'); }
            }
          } else if (e.type === 'secguard') {
            enemyShoot(e);
          }
        } else if (e.type === 'secguard' && d <= e.range) {
          enemyShoot(e);
        }
      }
    }
  }

  // ─── Priest healing ───────────────────────────────────────────────────────
  function updatePriest(dt) {
    if (!state.priestMesh || state.phase !== PHASE_MEDIEVAL) { return; }
    var dx = state.playerPos.x - state.priestMesh.position.x;
    var dz = state.playerPos.z - state.priestMesh.position.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d <= 4) {
      state.playerHP = Math.min(100, state.playerHP + 5 * dt);
    }
  }

  // ─── Elevator ─────────────────────────────────────────────────────────────
  function updateElevator(dt) {
    if (!state.elevatorRiding || state.phase !== PHASE_FUTURE) { return; }
    state.elevatorTimer -= dt;
    if (state.elevatorMesh) {
      var progress = 1 - Math.max(0, state.elevatorTimer / 5);
      state.elevatorMesh.position.y = 1.25 + progress * 36;
      state.playerPos.y = state.elevatorMesh.position.y + 1.8;
    }
    if (state.elevatorTimer <= 0) {
      state.elevatorRiding = false;
      state.playerPos.y = 38.5;
      showMsg('FLOOR 30 — SERVER ROOM', '#00FFCC', 2000);
    }
  }

  // ─── Interact (E key) ─────────────────────────────────────────────────────
  function onInteract() {
    // Portal check
    if (state.portalMesh) {
      var dx = state.playerPos.x - state.portalMesh.position.x;
      var dz = state.playerPos.z - state.portalMesh.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        enterPortal();
        return;
      }
    }

    if (state.phase === PHASE_EGYPT) {
      // False wall
      if (!state.falsewallOpen && state.falseWallMesh) {
        var fdx = state.playerPos.x - state.falseWallMesh.position.x;
        var fdz = state.playerPos.z - state.falseWallMesh.position.z;
        if (Math.sqrt(fdx * fdx + fdz * fdz) < 2.5) {
          state.falsewallOpen = true;
          state.falseWallMesh.visible = false;
          showMsg('SECRET PASSAGE OPENED!', '#FFDD00', 2000);
          return;
        }
      }
    }

    if (state.phase === PHASE_MEDIEVAL) {
      // (Drawbridge lowered by shooting mechanism)
      showMsg('Shoot the mechanism to lower drawbridge!', '#CCCCAA', 1500);
    }

    if (state.phase === PHASE_FUTURE) {
      // Elevator
      if (state.elevatorMesh && !state.elevatorRiding) {
        var edx = state.playerPos.x - state.elevatorMesh.position.x;
        var edz = state.playerPos.z - state.elevatorMesh.position.z;
        if (Math.sqrt(edx * edx + edz * edz) < 2.5) {
          state.elevatorRiding = true;
          state.elevatorTimer = 5;
          showMsg('ELEVATOR ASCENDING — FLOOR 30 IN 5s', '#00FFCC', 5000);
          return;
        }
      }

      // Terminals for laser grid
      for (var ti = 0; ti < state.terminals.length; ti++) {
        if (!state.terminalPressed[ti]) {
          var t = state.terminals[ti];
          var tdx = state.playerPos.x - t.position.x;
          var tdz = state.playerPos.z - t.position.z;
          if (Math.sqrt(tdx * tdx + tdz * tdz) < 2) {
            state.terminalPressed[ti] = true;
            t.material.color.setHex(0x00FF44);
            state.terminalHits++;
            showMsg('TERMINAL ' + (ti + 1) + '/3 ACTIVATED', '#00FF88', 1500);
            if (state.terminalHits >= 3) {
              state.laserActive = false;
              if (state.laserMesh) { state.laserMesh.visible = false; }
              showMsg('LASER GRID DISABLED!', '#00FF88', 2500);
            }
            return;
          }
        }
      }
    }
  }

  // ─── Artifact pickup ──────────────────────────────────────────────────────
  function checkArtifact() {
    if (state.artifactThisPhase || !state.artifactMesh) { return; }
    var dx = state.playerPos.x - state.artifactMesh.position.x;
    var dy = (state.playerPos.y + 0.5) - state.artifactMesh.position.y;
    var dz = state.playerPos.z - state.artifactMesh.position.z;
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.8) {
      state.artifactThisPhase = true;
      state.artifactMesh.visible = false;
      var names = ['GOLDEN ANKH', 'HOLY GRAIL', 'QUANTUM CPU'];
      showMsg(names[state.phase] + ' SECURED!', '#FFD700', 3000);
      flashScreen('#FFD700', 0.5);
    }
  }

  // ─── Portal entry ─────────────────────────────────────────────────────────
  function enterPortal() {
    if (!state.artifactThisPhase) {
      showMsg('COLLECT THE ARTIFACT FIRST!', '#FF4444', 2000);
      return;
    }
    state.artifactsCollected++;
    state.score += 1000;

    // Ghost bonus
    if (state.killsThisPhase === 0) {
      state.score += 1000;
      state.ghostBonus++;
      showMsg('GHOST BONUS! No kills — +1000 score!', '#AAFFFF', 3000);
    } else if (state.killsThisPhase > 3) {
      state.paradoxLevel++;
      showMsg('EXCESS KILLS — PARADOX LEVEL ' + state.paradoxLevel + '!', '#FF6600', 2500);
    }

    flashScreen('#AA44FF', 0.6);

    if (state.phase < PHASE_FUTURE) {
      var killedThisPhase = state.killsThisPhase;
      state.killsThisPhase = 0;
      state.artifactThisPhase = false;
      clearPhase();
      state.phase++;
      state.phaseTimer = PHASE_TIME;
      state.playerPos.x = 0;
      state.playerPos.y = 0.9;
      state.playerPos.z = 8;

      if (state.phase === PHASE_MEDIEVAL) {
        buildMedieval(killedThisPhase);
        showMsg('PORTAL: MEDIEVAL EUROPE 1345 AD', '#CC88FF', 3000);
      } else if (state.phase === PHASE_FUTURE) {
        buildFuture(killedThisPhase);
        showMsg('PORTAL: NEAR FUTURE 2087 AD', '#CC88FF', 3000);
      }
    } else {
      // Won
      triggerWin();
    }
  }

  // ─── Win / Lose ───────────────────────────────────────────────────────────
  function triggerWin() {
    state.won = true;
    state.gameOver = true;
    state.score += 2000;
    clearPhase();
    state.scene.background = new THREE.Color(0x002244);

    var banner = document.createElement('div');
    banner.id = 'th-end';
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'z-index:3000', 'background:rgba(0,0,30,0.92)',
      'color:#FFD700', 'font-family:monospace',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'font-size:28px', 'text-align:center', 'gap:16px'
    ].join(';');
    banner.innerHTML = [
      '<div style="font-size:42px;color:#AA44FF">TIME HEIST COMPLETE!</div>',
      '<div>All 3 artifacts recovered — present restored.</div>',
      '<div style="color:#00FFCC">SCORE: ' + state.score + '</div>',
      '<div style="color:#AAFFAA">ARTIFACTS: 3/3 | PARADOX LEVEL: ' + state.paradoxLevel + ' | GHOST BONUSES: ' + state.ghostBonus + '</div>',
      '<div style="font-size:16px;color:#888;margin-top:20px">Press R to play again</div>'
    ].join('');
    document.body.appendChild(banner);
  }

  function triggerDeath(reason) {
    state.gameOver = true;
    var banner = document.createElement('div');
    banner.id = 'th-end';
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'z-index:3000', 'background:rgba(30,0,0,0.92)',
      'color:#FF4444', 'font-family:monospace',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'font-size:28px', 'text-align:center', 'gap:16px'
    ].join(';');
    banner.innerHTML = [
      '<div style="font-size:42px">TIME HEIST FAILED</div>',
      '<div>' + reason + ' in ' + ERA_NAMES[state.phase] + '</div>',
      '<div style="color:#FFAA44">SCORE: ' + state.score + '</div>',
      '<div style="color:#FFCCAA">ARTIFACTS: ' + state.artifactsCollected + '/3</div>',
      '<div style="font-size:16px;color:#888;margin-top:20px">Press R to try again</div>'
    ].join('');
    document.body.appendChild(banner);
    flashScreen('#FF0000', 0.8);
  }

  function triggerTimerDeath() {
    state.playerHP = 0;
    triggerDeath('TIMER EXPIRED');
  }

  // ─── Player movement (FPS) ────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (state.playerStunTimer > 0) {
      state.playerStunTimer -= dt;
      return;
    }

    var speed = 5 * dt;
    var fwd = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, state.playerYaw, 0));
    var right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, state.playerYaw, 0));

    if (state.moveKeys['KeyW'] || state.moveKeys['ArrowUp']) {
      state.playerPos.x += fwd.x * speed;
      state.playerPos.z += fwd.z * speed;
    }
    if (state.moveKeys['KeyS'] || state.moveKeys['ArrowDown']) {
      state.playerPos.x -= fwd.x * speed;
      state.playerPos.z -= fwd.z * speed;
    }
    if (state.moveKeys['KeyA'] || state.moveKeys['ArrowLeft']) {
      state.playerPos.x -= right.x * speed;
      state.playerPos.z -= right.z * speed;
    }
    if (state.moveKeys['KeyD'] || state.moveKeys['ArrowRight']) {
      state.playerPos.x += right.x * speed;
      state.playerPos.z += right.z * speed;
    }

    // Clamp horizontal
    state.playerPos.x = Math.max(-45, Math.min(45, state.playerPos.x));
    state.playerPos.z = Math.max(-40, Math.min(12, state.playerPos.z));

    // Elevator sets y; otherwise ground
    if (!state.elevatorRiding) {
      state.playerPos.y = 0.9;
    }

    // Camera
    state.camera.position.set(
      state.playerPos.x,
      state.playerPos.y + 0.8,
      state.playerPos.z
    );
    state.camera.rotation.order = 'YXP';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch || 0;
  }

  // ─── Portal spin ──────────────────────────────────────────────────────────
  function updatePortal(dt) {
    if (!state.portalMesh) { return; }
    state.portalAngle += dt * 1.5;
    state.portalMesh.rotation.y = state.portalAngle;
    var pulse = 1 + 0.12 * Math.sin(state.portalAngle * 3);
    state.portalMesh.scale.set(pulse, 1, pulse);
  }

  // ─── Stun flash ───────────────────────────────────────────────────────────
  function updateFlash(dt) {
    if (state.flashTimer > 0 && state.flashEl) {
      state.flashTimer -= dt;
      if (state.flashTimer <= 0) {
        state.flashEl.style.opacity = '0';
      }
    }
  }

  // ─── Render loop ──────────────────────────────────────────────────────────
  function loop() {
    if (!state.active) { return; }
    state.animId = requestAnimationFrame(loop);
    var dt = Math.min(state.clock.getDelta(), 0.1);

    if (!state.gameOver) {
      // Phase timer
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) {
        state.phaseTimer = 0;
        triggerTimerDeath();
      }

      updatePlayer(dt);
      updateEnemies(dt);
      updateBullets(dt);
      checkArtifact();
      updatePriest(dt);
      updateElevator(dt);
      updatePortal(dt);
      updateFlash(dt);
      updateHUD();
    }

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  var playerPitch = 0;

  function onKeyDown(ev) {
    if (state.gameOver) {
      if (ev.code === 'KeyR') { reset(); }
      return;
    }
    if (!state.active) { return; }

    state.moveKeys[ev.code] = true;

    // T+I simultaneous = no-op (handled in activation outside game)
    if (ev.code === 'Space') { playerShoot(); }
    if (ev.code === 'KeyE') { onInteract(); }
    if (ev.code === 'KeyQ') {
      // Look left shortcut
      state.playerYaw += 0.08;
    }
    if (ev.code === 'KeyR') { reset(); }
  }

  function onKeyUp(ev) {
    state.moveKeys[ev.code] = false;
  }

  function onMouseMove(ev) {
    if (!state.active || !state.pointerLocked) { return; }
    state.playerYaw -= ev.movementX * 0.002;
    playerPitch -= ev.movementY * 0.002;
    playerPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, playerPitch));
    state.playerPitch = playerPitch;
    state.camera.rotation.x = playerPitch;
  }

  function onMouseDown() {
    if (!state.active || state.gameOver) { return; }
    if (!state.pointerLocked) {
      var el = state.renderer.domElement;
      if (el.requestPointerLock) { el.requestPointerLock(); }
    } else {
      playerShoot();
    }
  }

  function onPLChange() {
    state.pointerLocked = document.pointerLockElement === state.renderer.domElement;
  }

  function onResize() {
    if (!state.renderer || !state.camera) { return; }
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Activation: T+I ──────────────────────────────────────────────────────
  function onActivationKeyDown(ev) {
    if (state.active) { return; }
    if (ev.code === 'KeyT') {
      state.tKeyTime = Date.now();
      state.tPressed = true;
      if (state.iPressed && (Date.now() - state.iKeyTime) < ACTIVATION_WINDOW) { init(); }
    }
    if (ev.code === 'KeyI') {
      state.iKeyTime = Date.now();
      state.iPressed = true;
      if (state.tPressed && (Date.now() - state.tKeyTime) < ACTIVATION_WINDOW) { init(); }
    }
  }

  function onActivationKeyUp(ev) {
    if (ev.code === 'KeyT') { state.tPressed = false; }
    if (ev.code === 'KeyI') { state.iPressed = false; }
  }

  // ─── Destroy helpers ──────────────────────────────────────────────────────
  function destroyDOM() {
    var ids = ['th-canvas-wrap', 'th-hud', 'th-msg', 'th-flash', 'th-end'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) { el.parentNode.removeChild(el); }
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    if (state.active) { reset(); return; }

    // Listen for activation outside active state
    document.removeEventListener('keydown', onActivationKeyDown);
    document.removeEventListener('keyup', onActivationKeyUp);

    destroyDOM();

    // Reset state
    state.active = true;
    state.phase = PHASE_EGYPT;
    state.phaseTimer = PHASE_TIME;
    state.artifactsCollected = 0;
    state.artifactThisPhase = false;
    state.killsThisPhase = 0;
    state.paradoxLevel = 0;
    state.ghostBonus = 0;
    state.score = 0;
    state.gameOver = false;
    state.won = false;
    state.playerPos = { x: 0, y: 0.9, z: 8 };
    state.playerHP = 100;
    state.playerStunTimer = 0;
    state.playerYaw = Math.PI;
    playerPitch = 0;
    state.playerPitch = 0;
    state.pointerLocked = false;
    state.moveKeys = {};
    state.phaseObjects = [];
    state.enemies = [];
    state.bullets = [];
    state.portalMesh = null;
    state.portalAngle = 0;
    state.falsewallOpen = false;
    state.drawbridgeLowered = false;
    state.laserActive = true;
    state.terminalHits = 0;
    state.elevatorRiding = false;
    state.elevatorTimer = 0;
    state.elevatorMesh = null;
    state.priestMesh = null;
    state.artifactMesh = null;
    state.falseWallMesh = null;
    state.drawbridgeMesh = null;
    state.laserMesh = null;
    state.terminals = [];
    state.terminalPressed = [];
    state.flashTimer = 0;

    initScene();
    initHUD();
    buildEgypt();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPLChange);
    window.addEventListener('resize', onResize);

    showMsg('TIME HEIST — Click to lock mouse | WASD move | SPACE shoot | E interact | R reset', '#AA88FF', 6000);

    loop();
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    if (state.animId) { cancelAnimationFrame(state.animId); state.animId = null; }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPLChange);
    window.removeEventListener('resize', onResize);

    clearPhase();
    if (state.renderer) {
      state.renderer.dispose();
      state.renderer = null;
    }
    state.scene = null;
    state.camera = null;
    state.clock = null;
    state.active = false;
    state.gameOver = false;
    state.won = false;

    destroyDOM();

    // Re-register activation
    state.tPressed = false;
    state.iPressed = false;
    document.addEventListener('keydown', onActivationKeyDown);
    document.addEventListener('keyup', onActivationKeyUp);
  }

  // ─── Update (external hook) ───────────────────────────────────────────────
  function update() {
    // Called externally if needed; internal loop handles itself
  }

  // ─── Activation listeners (pre-game) ─────────────────────────────────────
  document.addEventListener('keydown', onActivationKeyDown);
  document.addEventListener('keyup', onActivationKeyUp);

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset
  };

}());
