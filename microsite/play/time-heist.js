(function (window) {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW = 400;
  var TOTAL_TIME = 300; // 5 minutes
  var PARADOX_INTERVAL = 90;
  var PORTAL_RADIUS = 3;
  var ERA_TRANSPORT_DELAY = 2000;
  var SCORE_COMPLETE = 2000;
  var SCORE_TIME_BONUS = 500;
  var TIME_BONUS_THRESHOLD = 180; // under 3 minutes = 120 seconds elapsed

  var ERAS = {
    WILD_WEST: 'WILD WEST 1880',
    WW2: 'WW2 1944',
    FUTURE: 'FUTURE 2150',
    PRESENT: 'PRESENT'
  };

  var ITEMS = {
    GOLD_KEY: 'KEY',
    COMBINATION_CODE: 'CODE',
    DIAMOND_CHIP: 'CHIP'
  };

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    player: null,
    playerMirror: null,
    currentEra: ERAS.WILD_WEST,
    timeRemaining: TOTAL_TIME,
    lastParadoxTime: 0,
    paradoxStatus: 'STABLE',
    paradoxFlashTimer: 0,
    items: {
      KEY: false,
      CODE: false,
      CHIP: false
    },
    vaultPanels: [false, false, false],
    vaultOpen: false,
    score: 0,
    completed: false,
    portalActive: false,
    portalMesh: null,
    portalTimer: 0,
    transportPending: false,
    transportTimer: 0,
    nextEra: null,
    eraObjects: {},
    enemies: [],
    paradoxEnemies: [],
    bullets: [],
    keys: {},
    tKeyTime: 0,
    hKeyTime: 0,
    tPressed: false,
    hPressed: false,
    hudEl: null,
    timeBarEl: null,
    clock: null,
    delta: 0,
    elapsed: 0,
    animId: null,
    panelInteractTimer: 0,
    panelInteractCount: 0,
    terminalDisabled: false,
    mirrorWarningTimer: 0
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function makeBox(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, color, wireframe) {
    var geo = new THREE.SphereGeometry(r, 16, 16);
    var mat = new THREE.MeshLambertMaterial({ color: color, wireframe: !!wireframe });
    return new THREE.Mesh(geo, mat);
  }

  function makeCylinder(rt, rb, h, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function clearEraObjects() {
    var era = state.eraObjects[state.currentEra];
    if (!era) { return; }
    for (var i = 0; i < era.length; i++) {
      state.scene.remove(era[i]);
    }
    state.eraObjects[state.currentEra] = [];
  }

  function addEraObject(mesh) {
    if (!state.eraObjects[state.currentEra]) {
      state.eraObjects[state.currentEra] = [];
    }
    state.eraObjects[state.currentEra].push(mesh);
    state.scene.add(mesh);
    return mesh;
  }

  function clearEnemies() {
    for (var i = 0; i < state.enemies.length; i++) {
      state.scene.remove(state.enemies[i].mesh);
      if (state.enemies[i].hatMesh) {
        state.scene.remove(state.enemies[i].hatMesh);
      }
    }
    state.enemies = [];
    for (var j = 0; j < state.paradoxEnemies.length; j++) {
      state.scene.remove(state.paradoxEnemies[j].mesh);
    }
    state.paradoxEnemies = [];
  }

  function clearBullets() {
    for (var i = 0; i < state.bullets.length; i++) {
      state.scene.remove(state.bullets[i].mesh);
    }
    state.bullets = [];
  }

  // ─── Era Builder: Wild West ───────────────────────────────────────────────
  function buildWildWest() {
    state.currentEra = ERAS.WILD_WEST;
    state.eraObjects[ERAS.WILD_WEST] = [];

    // Dirt ground
    var ground = makeBox(80, 0.5, 80, 0xAA8855);
    ground.position.set(0, -0.25, 0);
    addEraObject(ground);

    // Saloon
    var saloon = makeBox(10, 6, 8, 0xC8A46A);
    saloon.position.set(-12, 3, -15);
    addEraObject(saloon);
    var saloonRoof = makeBox(11, 1, 9, 0x8B5E3C);
    saloonRoof.position.set(-12, 6.5, -15);
    addEraObject(saloonRoof);
    var saloonSign = makeBox(6, 1.5, 0.2, 0xFFD700);
    saloonSign.position.set(-12, 7.5, -10.6);
    addEraObject(saloonSign);

    // Bank vault
    var vault = makeBox(6, 5, 6, 0x8B7355);
    vault.position.set(12, 2.5, -15);
    addEraObject(vault);
    var vaultDoor = makeBox(2.5, 3.5, 0.3, 0x5A4A35);
    vaultDoor.position.set(12, 1.75, -12.15);
    addEraObject(vaultDoor);

    // Gold Key item
    var keyMesh = makeBox(0.5, 0.5, 0.5, 0xFFD700);
    keyMesh.position.set(12, 1.0, -12);
    keyMesh.userData.itemType = ITEMS.GOLD_KEY;
    keyMesh.userData.collected = false;
    addEraObject(keyMesh);

    // Fences
    for (var f = -20; f <= 20; f += 5) {
      var fence = makeBox(0.3, 1.5, 4, 0x8B6914);
      fence.position.set(f, 0.75, 0);
      addEraObject(fence);
    }

    // Water trough
    var trough = makeBox(4, 0.8, 1, 0x6B4F2A);
    trough.position.set(0, 0.4, -5);
    addEraObject(trough);

    // Distant rock
    var rock = makeBox(3, 2, 3, 0x998877);
    rock.position.set(20, 1, 5);
    addEraObject(rock);

    // Ambient light (warm)
    var ambient = new THREE.AmbientLight(0xFFE5A0, 0.7);
    ambient.userData.eraLight = true;
    addEraObject(ambient);
    var sun = new THREE.DirectionalLight(0xFFCC44, 1.2);
    sun.position.set(10, 20, 10);
    sun.userData.eraLight = true;
    addEraObject(sun);

    // Cowboys
    state.enemies = [];
    for (var i = 0; i < 6; i++) {
      spawnCowboy(
        (Math.random() - 0.5) * 30,
        0,
        (Math.random() - 0.5) * 20 - 5
      );
    }
  }

  function spawnCowboy(x, y, z) {
    var body = makeCylinder(0.4, 0.4, 1.6, 0xC8A46A);
    body.position.set(x, y + 0.8, z);
    state.scene.add(body);
    var hat = makeCylinder(0.55, 0.3, 0.6, 0x5A3A1A);
    hat.position.set(x, y + 1.8, z);
    state.scene.add(hat);
    var enemy = {
      mesh: body,
      hatMesh: hat,
      type: 'COWBOY',
      era: ERAS.WILD_WEST,
      hp: 2,
      shootTimer: Math.random() * 2 + 1,
      moveTimer: Math.random() * 3,
      alive: true
    };
    state.enemies.push(enemy);
    return enemy;
  }

  // ─── Era Builder: WW2 ─────────────────────────────────────────────────────
  function buildWW2() {
    state.currentEra = ERAS.WW2;
    state.eraObjects[ERAS.WW2] = [];

    // Grass ground
    var ground = makeBox(80, 0.5, 80, 0x334433);
    ground.position.set(0, -0.25, 0);
    addEraObject(ground);

    // Bunker
    var bunker = makeBox(14, 4, 10, 0x556644);
    bunker.position.set(-10, 2, -18);
    addEraObject(bunker);
    var bunkerRoof = makeBox(15, 0.8, 11, 0x445533);
    bunkerRoof.position.set(-10, 4.4, -18);
    addEraObject(bunkerRoof);

    // HQ building (holds combination code)
    var hq = makeBox(8, 5, 8, 0x667755);
    hq.position.set(12, 2.5, -18);
    addEraObject(hq);
    var hqSign = makeBox(4, 1, 0.2, 0xCCCC88);
    hqSign.position.set(12, 5, -14.1);
    addEraObject(hqSign);

    // Combination code item
    var codeMesh = makeBox(0.6, 0.4, 0.1, 0xCCCC44);
    codeMesh.position.set(12, 1.0, -14.5);
    codeMesh.userData.itemType = ITEMS.COMBINATION_CODE;
    codeMesh.userData.collected = false;
    addEraObject(codeMesh);

    // Sandbags
    for (var s = 0; s < 5; s++) {
      var bag = makeBox(1.5, 0.8, 0.8, 0xAA9944);
      bag.position.set(-18 + s * 2, 0.4, -8);
      addEraObject(bag);
      var bag2 = makeBox(1.5, 0.8, 0.8, 0x998833);
      bag2.position.set(-18 + s * 2 + 0.7, 1.0, -8);
      addEraObject(bag2);
    }

    // Barbed wire
    var wire = makeBox(20, 0.3, 0.3, 0x777766);
    wire.position.set(0, 0.5, -5);
    addEraObject(wire);

    // Crater
    var crater = makeBox(4, 0.4, 4, 0x223322);
    crater.position.set(5, -0.2, 5);
    addEraObject(crater);

    // Ambient (grey overcast)
    var ambient = new THREE.AmbientLight(0x88AA88, 0.6);
    addEraObject(ambient);
    var overcast = new THREE.DirectionalLight(0xBBCCBB, 0.8);
    overcast.position.set(-10, 20, 5);
    addEraObject(overcast);

    // Soldiers
    state.enemies = [];
    for (var i = 0; i < 8; i++) {
      spawnSoldier(
        (Math.random() - 0.5) * 30,
        0,
        (Math.random() - 0.5) * 20 - 5
      );
    }
  }

  function spawnSoldier(x, y, z) {
    var body = makeBox(0.7, 1.7, 0.5, 0x556644);
    body.position.set(x, y + 0.85, z);
    state.scene.add(body);
    var helmet = makeBox(0.75, 0.4, 0.75, 0x445533);
    helmet.position.set(x, y + 1.85, z);
    state.scene.add(helmet);
    var enemy = {
      mesh: body,
      hatMesh: helmet,
      type: 'SOLDIER',
      era: ERAS.WW2,
      hp: 3,
      shootTimer: Math.random() * 2 + 1.5,
      moveTimer: Math.random() * 3,
      alive: true
    };
    state.enemies.push(enemy);
    return enemy;
  }

  // ─── Era Builder: Future ──────────────────────────────────────────────────
  function buildFuture() {
    state.currentEra = ERAS.FUTURE;
    state.eraObjects[ERAS.FUTURE] = [];

    // Metallic ground
    var ground = makeBox(80, 0.5, 80, 0x1A1A2E);
    ground.position.set(0, -0.25, 0);
    addEraObject(ground);

    // Security vault
    var secVault = makeBox(10, 8, 10, 0x2A2A4A);
    secVault.position.set(0, 4, -20);
    addEraObject(secVault);
    var secDoor = makeBox(3, 5, 0.3, 0x3A3A6A);
    secDoor.position.set(0, 2.5, -15.15);
    addEraObject(secDoor);

    // Diamond chip item
    var chipMesh = makeBox(0.4, 0.1, 0.4, 0x88FFFF);
    chipMesh.position.set(0, 1.0, -15.5);
    chipMesh.userData.itemType = ITEMS.DIAMOND_CHIP;
    chipMesh.userData.collected = false;
    addEraObject(chipMesh);

    // Laser grids (LineSegments)
    var laserPoints1 = [
      { x: -15, y: 0, z: -10 }, { x: -15, y: 3, z: -10 },
      { x: -15, y: 3, z: -10 }, { x: 15, y: 3, z: -10 },
      { x: 15, y: 3, z: -10 }, { x: 15, y: 0, z: -10 },
      { x: 15, y: 0, z: -10 }, { x: -15, y: 0, z: -10 }
    ];
    var laser1 = makeLineSegments(laserPoints1, 0xFF0000);
    addEraObject(laser1);

    var laserPoints2 = [
      { x: -10, y: 0, z: -5 }, { x: -10, y: 4, z: -5 },
      { x: -10, y: 4, z: -5 }, { x: 10, y: 4, z: -5 },
      { x: 10, y: 4, z: -5 }, { x: 10, y: 0, z: -5 },
      { x: 10, y: 0, z: -5 }, { x: -10, y: 0, z: -5 }
    ];
    var laser2 = makeLineSegments(laserPoints2, 0xFF0000);
    addEraObject(laser2);

    // Security terminal
    var terminal = makeBox(1, 2, 0.5, 0x3A5A4A);
    terminal.position.set(5, 1, -14);
    terminal.userData.isTerminal = true;
    addEraObject(terminal);
    var terminalScreen = makeBox(0.8, 1.2, 0.1, 0x00FF88);
    terminalScreen.position.set(5, 1.2, -13.76);
    addEraObject(terminalScreen);

    // Platform structures
    for (var p = 0; p < 4; p++) {
      var platform = makeBox(3, 0.3, 3, 0x2A2A5A);
      platform.position.set(-15 + p * 10, 0.15, 0);
      addEraObject(platform);
    }

    // Ambient (blue-purple futuristic)
    var ambient = new THREE.AmbientLight(0x3333AA, 0.5);
    addEraObject(ambient);
    var neon1 = new THREE.PointLight(0x00FFFF, 1.5, 30);
    neon1.position.set(0, 8, -18);
    addEraObject(neon1);
    var neon2 = new THREE.PointLight(0xFF00FF, 1.0, 25);
    neon2.position.set(-10, 4, 0);
    addEraObject(neon2);

    // Robot guards
    state.enemies = [];
    for (var i = 0; i < 4; i++) {
      spawnRobot(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 15 - 5
      );
    }
  }

  function spawnRobot(x, y, z) {
    var body = makeCylinder(0.45, 0.5, 1.8, 0x4A4A5A);
    body.position.set(x, y + 0.9, z);
    state.scene.add(body);
    var head = makeCylinder(0.3, 0.3, 0.5, 0x5A5A6A);
    head.position.set(x, y + 1.95, z);
    state.scene.add(head);
    var enemy = {
      mesh: body,
      hatMesh: head,
      type: 'ROBOT',
      era: ERAS.FUTURE,
      hp: 4,
      shootTimer: Math.random() * 3 + 2,
      moveTimer: Math.random() * 2,
      alive: true
    };
    state.enemies.push(enemy);
    return enemy;
  }

  // ─── Scene Setup ──────────────────────────────────────────────────────────
  function initScene() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x87CEEB);
    state.scene.fog = new THREE.Fog(0x87CEEB, 30, 80);

    state.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    state.camera.position.set(0, 8, 15);
    state.camera.lookAt(0, 0, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = false;

    var container = document.getElementById('time-heist-canvas');
    if (!container) {
      container = document.createElement('div');
      container.id = 'time-heist-canvas';
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;';
      document.body.appendChild(container);
    }
    container.appendChild(state.renderer.domElement);

    // Player
    state.player = makeBox(0.8, 1.8, 0.8, 0x00AAFF);
    state.player.position.set(0, 0.9, 5);
    state.scene.add(state.player);

    // Time device on player
    var timeDevice = makeBox(0.8, 1.0, 0.8, 0x00FFFF);
    timeDevice.position.set(0, 0, 0.4);
    timeDevice.scale.set(0.5, 0.5, 0.5);
    state.player.add(timeDevice);

    // Player mirror (self version in other era - initially hidden)
    state.playerMirror = makeBox(0.8, 1.8, 0.8, 0x0055FF);
    state.playerMirror.position.set(-5, 0.9, -8);
    state.playerMirror.visible = false;
    state.scene.add(state.playerMirror);

    state.clock = new THREE.Clock();
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function initHUD() {
    var existing = document.getElementById('time-heist-hud');
    if (existing) { existing.parentNode.removeChild(existing); }

    var hud = document.createElement('div');
    hud.id = 'time-heist-hud';
    hud.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:1100',
      'background:rgba(0,0,0,0.75)',
      'color:#00FFFF',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 12px',
      'display:flex',
      'flex-direction:column',
      'gap:3px'
    ].join(';');

    var topLine = document.createElement('div');
    topLine.id = 'th-top-line';
    topLine.textContent = 'TIME HEIST [ERA: WILD WEST 1880] [ITEMS: KEY - CODE - CHIP -] [TIME: 05:00] | PARADOX: STABLE';
    hud.appendChild(topLine);

    var timeBarWrap = document.createElement('div');
    timeBarWrap.style.cssText = 'width:100%;height:6px;background:#333;border-radius:3px;overflow:hidden;';
    var timeBar = document.createElement('div');
    timeBar.id = 'th-time-bar';
    timeBar.style.cssText = 'height:100%;width:100%;background:#00FFFF;transition:width 0.5s linear;';
    timeBarWrap.appendChild(timeBar);
    hud.appendChild(timeBarWrap);

    document.body.appendChild(hud);
    state.hudEl = topLine;
    state.timeBarEl = timeBar;
  }

  function updateHUD() {
    if (!state.hudEl) { return; }
    var mins = Math.floor(state.timeRemaining / 60);
    var secs = Math.floor(state.timeRemaining % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var keyStr = state.items.KEY ? 'KEY ✓' : 'KEY —';
    var codeStr = state.items.CODE ? 'CODE ✓' : 'CODE —';
    var chipStr = state.items.CHIP ? 'CHIP ✓' : 'CHIP —';

    var eraDisplay = state.currentEra;
    if (state.currentEra === ERAS.PRESENT) { eraDisplay = 'PRESENT'; }

    state.hudEl.textContent = 'TIME HEIST [ERA: ' + eraDisplay + '] [ITEMS: ' + keyStr + ' ' + codeStr + ' ' + chipStr + '] [TIME: ' + timeStr + '] | PARADOX: ' + state.paradoxStatus;

    if (state.timeBarEl) {
      var pct = (state.timeRemaining / TOTAL_TIME) * 100;
      state.timeBarEl.style.width = pct + '%';
      if (pct < 25) {
        state.timeBarEl.style.background = '#FF4444';
      } else if (pct < 50) {
        state.timeBarEl.style.background = '#FFAA00';
      } else {
        state.timeBarEl.style.background = '#00FFFF';
      }
    }
  }

  function showMessage(msg, color, duration) {
    var el = document.getElementById('th-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'th-message';
      el.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'z-index:1200',
        'font-family:monospace',
        'font-size:28px',
        'font-weight:bold',
        'text-shadow:0 0 10px currentColor',
        'pointer-events:none',
        'transition:opacity 0.5s'
      ].join(';');
      document.body.appendChild(el);
    }
    el.style.color = color || '#00FFFF';
    el.style.opacity = '1';
    el.textContent = msg;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(function () {
      el.style.opacity = '0';
    }, duration || 2000);
  }

  // ─── Portal ───────────────────────────────────────────────────────────────
  function activatePortal() {
    if (state.portalActive || state.transportPending) { return; }
    state.portalActive = true;
    state.portalTimer = 0;

    var portalGeo = new THREE.SphereGeometry(PORTAL_RADIUS, 20, 20);
    var portalMat = new THREE.MeshLambertMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 0.5,
      wireframe: false
    });
    state.portalMesh = new THREE.Mesh(portalGeo, portalMat);
    state.portalMesh.position.copy(state.player.position);
    state.portalMesh.position.y = PORTAL_RADIUS;
    state.scene.add(state.portalMesh);

    showMessage('TIME PORTAL OPENING...', '#00FFFF', ERA_TRANSPORT_DELAY);

    state.transportPending = true;
    state.transportTimer = ERA_TRANSPORT_DELAY / 1000;
    state.nextEra = getNextEra();
  }

  function getNextEra() {
    if (state.currentEra === ERAS.WILD_WEST) { return ERAS.WW2; }
    if (state.currentEra === ERAS.WW2) { return ERAS.FUTURE; }
    if (state.currentEra === ERAS.FUTURE) { return ERAS.PRESENT; }
    return ERAS.WILD_WEST;
  }

  function transportToEra(era) {
    // Clean up portal
    if (state.portalMesh) {
      state.scene.remove(state.portalMesh);
      state.portalMesh = null;
    }
    state.portalActive = false;

    // Remove current era visuals
    var oldObjects = state.eraObjects[state.currentEra] || [];
    for (var i = 0; i < oldObjects.length; i++) {
      state.scene.remove(oldObjects[i]);
    }
    clearEnemies();
    clearBullets();

    state.currentEra = era;

    // Show mirror self briefly when jumping
    state.playerMirror.visible = true;
    state.playerMirror.position.set(
      state.player.position.x + 3,
      state.player.position.y,
      state.player.position.z - 3
    );
    state.mirrorWarningTimer = 3;

    if (era === ERAS.WILD_WEST) {
      buildWildWest();
      state.scene.background = new THREE.Color(0xD4A43C);
      state.scene.fog = new THREE.Fog(0xD4A43C, 30, 80);
    } else if (era === ERAS.WW2) {
      buildWW2();
      state.scene.background = new THREE.Color(0x889988);
      state.scene.fog = new THREE.Fog(0x889988, 25, 70);
    } else if (era === ERAS.FUTURE) {
      buildFuture();
      state.scene.background = new THREE.Color(0x0A0A1E);
      state.scene.fog = new THREE.Fog(0x0A0A1E, 20, 60);
    } else if (era === ERAS.PRESENT) {
      buildPresent();
      state.scene.background = new THREE.Color(0x87CEEB);
      state.scene.fog = new THREE.Fog(0x87CEEB, 30, 80);
    }

    state.player.position.set(0, 0.9, 5);
    showMessage('ARRIVED: ' + era, '#00FFFF', 2000);
    updateHUD();
  }

  // ─── Era Builder: Present ─────────────────────────────────────────────────
  function buildPresent() {
    state.currentEra = ERAS.PRESENT;
    state.eraObjects[ERAS.PRESENT] = [];

    var ground = makeBox(80, 0.5, 80, 0x448844);
    ground.position.set(0, -0.25, 0);
    addEraObject(ground);

    // Present-day bank vault
    var bank = makeBox(16, 8, 14, 0xCCBBAA);
    bank.position.set(0, 4, -20);
    addEraObject(bank);

    // Three panels for vault insertion
    var panelColors = [0xFFD700, 0xCCCC44, 0x88FFFF];
    for (var p = 0; p < 3; p++) {
      var panel = makeBox(1.5, 2, 0.3, panelColors[p]);
      panel.position.set(-4 + p * 4, 1, -13.2);
      panel.userData.isPresentPanel = true;
      panel.userData.panelIndex = p;
      addEraObject(panel);
    }

    // Bank sign
    var sign = makeBox(8, 1.5, 0.2, 0x002266);
    sign.position.set(0, 9, -13.1);
    addEraObject(sign);

    var ambient = new THREE.AmbientLight(0xFFFFEE, 0.8);
    addEraObject(ambient);
    var sun = new THREE.DirectionalLight(0xFFFFDD, 1.0);
    sun.position.set(5, 20, 10);
    addEraObject(sun);

    showMessage('INSERT ALL 3 ITEMS AT THE VAULT PANELS!', '#FFD700', 4000);
  }

  // ─── Paradox Events ───────────────────────────────────────────────────────
  function spawnParadoxEnemy() {
    var enemyType;
    var x = (Math.random() - 0.5) * 20;
    var z = (Math.random() - 0.5) * 15 - 5;
    var enemy = null;

    if (state.currentEra === ERAS.WILD_WEST) {
      // WW2 soldier in Wild West
      enemy = spawnSoldier(x, 0, z);
      enemy.era = ERAS.WW2; // paradox marker
    } else if (state.currentEra === ERAS.WW2) {
      // Future robot in 1944
      enemy = spawnRobot(x, 0, z);
      enemy.era = ERAS.FUTURE;
    } else if (state.currentEra === ERAS.FUTURE) {
      // Cowboy in future
      enemy = spawnCowboy(x, 0, z);
      enemy.era = ERAS.WILD_WEST;
    } else {
      return;
    }

    if (enemy) {
      enemy.isParadox = true;
      // Tint paradox enemies
      enemy.mesh.material.color.setHex(0xFF66FF);
      state.paradoxEnemies.push(enemy);
      state.paradoxStatus = 'PARADOX!';
      state.paradoxFlashTimer = 5;
      showMessage('PARADOX EVENT: ENEMY FROM ANOTHER ERA!', '#FF66FF', 3000);
    }
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────
  function playerShoot() {
    var bullet = makeSphere(0.15, 0xFFFF00);
    bullet.position.copy(state.player.position);
    bullet.position.y += 1;
    state.scene.add(bullet);
    // Shoot forward (negative Z in world space from player facing)
    var dir = new THREE.Vector3(0, 0, -1);
    state.bullets.push({
      mesh: bullet,
      velocity: dir.multiplyScalar(0.4),
      fromPlayer: true,
      life: 3
    });
  }

  function enemyShoot(enemy) {
    var bullet = makeSphere(0.2, 0xFFAA00);
    bullet.position.copy(enemy.mesh.position);
    bullet.position.y += 0.8;
    state.scene.add(bullet);
    var dir = new THREE.Vector3().subVectors(state.player.position, enemy.mesh.position).normalize();
    state.bullets.push({
      mesh: bullet,
      velocity: dir.multiplyScalar(0.25),
      fromPlayer: false,
      life: 3
    });
  }

  // ─── Collision / Interaction ───────────────────────────────────────────────
  function dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function checkItemPickup() {
    var eraObjs = state.eraObjects[state.currentEra] || [];
    for (var i = 0; i < eraObjs.length; i++) {
      var obj = eraObjs[i];
      if (obj.userData.itemType && !obj.userData.collected) {
        if (dist2(state.player.position, obj.position) < 1.5) {
          obj.userData.collected = true;
          obj.visible = false;
          var it = obj.userData.itemType;
          if (it === ITEMS.GOLD_KEY) { state.items.KEY = true; showMessage('GOLD KEY ACQUIRED!', '#FFD700', 2500); }
          if (it === ITEMS.COMBINATION_CODE) { state.items.CODE = true; showMessage('COMBINATION CODE ACQUIRED!', '#CCCC44', 2500); }
          if (it === ITEMS.DIAMOND_CHIP) { state.items.CHIP = true; showMessage('DIAMOND CHIP ACQUIRED!', '#88FFFF', 2500); }
        }
      }
    }
  }

  function checkVaultPanels() {
    if (state.currentEra !== ERAS.PRESENT) { return; }
    if (!state.items.KEY || !state.items.CODE || !state.items.CHIP) {
      showMessage('YOU NEED ALL 3 ITEMS!', '#FF4444', 2000);
      return;
    }
    var eraObjs = state.eraObjects[ERAS.PRESENT] || [];
    for (var i = 0; i < eraObjs.length; i++) {
      var obj = eraObjs[i];
      if (obj.userData.isPresentPanel && !state.vaultPanels[obj.userData.panelIndex]) {
        if (dist2(state.player.position, obj.position) < 2) {
          state.vaultPanels[obj.userData.panelIndex] = true;
          obj.material.color.setHex(0x00FF00);
          showMessage('PANEL ' + (obj.userData.panelIndex + 1) + ' ACTIVATED!', '#00FF00', 1500);
          if (state.vaultPanels[0] && state.vaultPanels[1] && state.vaultPanels[2]) {
            triggerVaultOpen();
          }
          return;
        }
      }
    }
  }

  function checkTerminal() {
    if (state.currentEra !== ERAS.FUTURE) { return; }
    if (state.terminalDisabled) { showMessage('TERMINAL ALREADY DISABLED', '#888888', 1000); return; }
    var eraObjs = state.eraObjects[ERAS.FUTURE] || [];
    for (var i = 0; i < eraObjs.length; i++) {
      if (eraObjs[i].userData.isTerminal) {
        if (dist2(state.player.position, eraObjs[i].position) < 2) {
          state.terminalDisabled = true;
          eraObjs[i].material.color.setHex(0x444444);
          showMessage('SECURITY TERMINAL DISABLED!', '#00FF88', 2000);
          return;
        }
      }
    }
    // If not near terminal, check vault panels (present era)
    checkVaultPanels();
  }

  function triggerVaultOpen() {
    state.vaultOpen = true;
    state.completed = true;
    state.score += SCORE_COMPLETE;
    if (state.timeRemaining > TIME_BONUS_THRESHOLD) {
      state.score += SCORE_TIME_BONUS;
      showMessage('VAULT OPEN! TIME HEIST COMPLETE! +2500 SCORE (TIME BONUS!)', '#FFD700', 6000);
    } else {
      showMessage('VAULT OPEN! TIME HEIST COMPLETE! +2000 SCORE', '#00FFFF', 6000);
    }
    updateHUD();
  }

  function checkMirrorSelf() {
    if (!state.playerMirror.visible) { return; }
    var d = dist2(state.player.position, state.playerMirror.position);
    if (d < 1.5) {
      // Warning: touching yourself = timeline collapse
      triggerTimelineCollapse();
    } else if (d < 4) {
      showMessage('WARNING: DO NOT APPROACH YOUR OTHER SELF!', '#FFAA00', 1500);
    }
  }

  function triggerTimelineCollapse() {
    showMessage('TIMELINE COLLAPSE! PARADOX RESET!', '#FF0000', 3000);
    state.score = Math.max(0, state.score - 100);
    state.items = { KEY: false, CODE: false, CHIP: false };
    state.vaultPanels = [false, false, false];
    state.timeRemaining = TOTAL_TIME;
    state.paradoxStatus = 'COLLAPSED';
    state.paradoxFlashTimer = 3;
    state.playerMirror.visible = false;
    transportToEra(ERAS.WILD_WEST);
  }

  // ─── Update Loop ──────────────────────────────────────────────────────────
  function update(delta) {
    if (!state.active || state.completed) { return; }

    state.timeRemaining -= delta;
    if (state.timeRemaining <= 0) {
      state.timeRemaining = 0;
      showMessage('TIMELINE CLOSED! GAME OVER!', '#FF0000', 5000);
      state.completed = true;
      state.active = false;
      return;
    }

    state.elapsed += delta;

    // Portal pulse animation
    if (state.portalMesh) {
      state.portalTimer += delta;
      var pulse = 0.8 + 0.2 * Math.sin(state.portalTimer * 4);
      state.portalMesh.scale.set(pulse, pulse, pulse);
    }

    // Transport countdown
    if (state.transportPending) {
      state.transportTimer -= delta;
      if (state.transportTimer <= 0) {
        state.transportPending = false;
        transportToEra(state.nextEra);
      }
    }

    // Player movement
    updatePlayerMovement(delta);

    // Mirror self logic
    if (state.playerMirror.visible) {
      state.mirrorWarningTimer -= delta;
      if (state.mirrorWarningTimer <= 0) {
        state.playerMirror.visible = false;
      }
      checkMirrorSelf();
      // Slowly move mirror away
      state.playerMirror.position.x += Math.sin(state.elapsed) * 0.02;
    }

    // Enemy AI
    updateEnemies(delta);

    // Bullet movement
    updateBullets(delta);

    // Item pickup
    checkItemPickup();

    // Paradox events
    if (state.elapsed - state.lastParadoxTime > PARADOX_INTERVAL) {
      state.lastParadoxTime = state.elapsed;
      if (state.currentEra !== ERAS.PRESENT) {
        spawnParadoxEnemy();
      }
    }

    // Paradox flash timer
    if (state.paradoxFlashTimer > 0) {
      state.paradoxFlashTimer -= delta;
      if (state.paradoxFlashTimer <= 0) {
        state.paradoxStatus = 'STABLE';
      }
    }

    updateHUD();
  }

  function updatePlayerMovement(delta) {
    var speed = 5 * delta;
    var moved = false;

    if (state.keys['ArrowLeft'] || state.keys['KeyA']) {
      state.player.position.x -= speed;
      moved = true;
    }
    if (state.keys['ArrowRight'] || state.keys['KeyD']) {
      state.player.position.x += speed;
      moved = true;
    }
    if (state.keys['ArrowUp'] || state.keys['KeyW']) {
      state.player.position.z -= speed;
      moved = true;
    }
    if (state.keys['ArrowDown'] || state.keys['KeyS']) {
      state.player.position.z += speed;
      moved = true;
    }

    // Clamp player
    state.player.position.x = Math.max(-35, Math.min(35, state.player.position.x));
    state.player.position.z = Math.max(-30, Math.min(15, state.player.position.z));
    state.player.position.y = 0.9;

    // Camera follow
    state.camera.position.x = state.player.position.x;
    state.camera.position.z = state.player.position.z + 15;
    state.camera.position.y = 8;
    state.camera.lookAt(state.player.position);
  }

  function updateEnemies(delta) {
    var allEnemies = state.enemies.concat(state.paradoxEnemies);
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e.alive) { continue; }

      // Move toward player
      e.moveTimer -= delta;
      if (e.moveTimer <= 0) {
        e.moveTimer = Math.random() * 2 + 1;
        var dx = state.player.position.x - e.mesh.position.x;
        var dz = state.player.position.z - e.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0) {
          var spd = 1.5 * delta * 60;
          e.mesh.position.x += (dx / dist) * spd * delta;
          e.mesh.position.z += (dz / dist) * spd * delta;
          if (e.hatMesh) {
            e.hatMesh.position.x = e.mesh.position.x;
            e.hatMesh.position.z = e.mesh.position.z;
          }
        }
      }

      // Shoot at player
      e.shootTimer -= delta;
      if (e.shootTimer <= 0) {
        var baseInterval = (e.type === 'COWBOY') ? 2 : (e.type === 'SOLDIER') ? 2.5 : 3;
        e.shootTimer = baseInterval + Math.random();
        var pd = dist2(e.mesh.position, state.player.position);
        if (pd < 20) {
          enemyShoot(e);
        }
      }

      // Melee contact
      if (dist2(e.mesh.position, state.player.position) < 1.2) {
        showMessage('HIT BY ENEMY!', '#FF4444', 800);
      }
    }
  }

  function updateBullets(delta) {
    for (var i = state.bullets.length - 1; i >= 0; i--) {
      var b = state.bullets[i];
      b.mesh.position.add(b.velocity);
      b.life -= delta;

      if (b.life <= 0) {
        state.scene.remove(b.mesh);
        state.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        // Check enemy hits
        var allEnemies = state.enemies.concat(state.paradoxEnemies);
        for (var j = 0; j < allEnemies.length; j++) {
          var e = allEnemies[j];
          if (!e.alive) { continue; }
          if (dist2(b.mesh.position, e.mesh.position) < 1.0) {
            e.hp--;
            if (e.hp <= 0) {
              e.alive = false;
              state.scene.remove(e.mesh);
              if (e.hatMesh) { state.scene.remove(e.hatMesh); }
              state.score += 50;
            }
            state.scene.remove(b.mesh);
            state.bullets.splice(i, 1);
            break;
          }
        }

        // Check mirror self (paradox trigger)
        if (state.playerMirror.visible && b.fromPlayer) {
          if (state.bullets[i] && dist2(b.mesh.position, state.playerMirror.position) < 1.5) {
            triggerTimelineCollapse();
            state.scene.remove(b.mesh);
            state.bullets.splice(i, 1);
          }
        }
      }
    }
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!state.active) { return; }
    state.keys[e.code] = true;

    // T+H simultaneous activation
    if (e.code === 'KeyT') {
      state.tKeyTime = Date.now();
      state.tPressed = true;
      if (state.hPressed && (Date.now() - state.hKeyTime) < ACTIVATION_WINDOW) {
        activatePortal();
      }
    }
    if (e.code === 'KeyH') {
      state.hKeyTime = Date.now();
      state.hPressed = true;
      if (state.tPressed && (Date.now() - state.tKeyTime) < ACTIVATION_WINDOW) {
        activatePortal();
      }
    }

    // T alone = activate portal (time device)
    if (e.code === 'KeyT' && !e.repeat) {
      // also check if H was recently pressed
    }

    // Shoot
    if (e.code === 'Space') {
      if (!state.transportPending) {
        playerShoot();
      }
    }

    // E = interact
    if (e.code === 'KeyE') {
      if (state.currentEra === ERAS.FUTURE) {
        checkTerminal();
      } else if (state.currentEra === ERAS.PRESENT) {
        checkVaultPanels();
      }
    }
  }

  function onKeyUp(e) {
    state.keys[e.code] = false;
    if (e.code === 'KeyT') { state.tPressed = false; }
    if (e.code === 'KeyH') { state.hPressed = false; }
  }

  function onResize() {
    if (!state.renderer || !state.camera) { return; }
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Render Loop ──────────────────────────────────────────────────────────
  function renderLoop() {
    if (!state.active) { return; }
    state.animId = requestAnimationFrame(renderLoop);
    var delta = state.clock.getDelta();
    update(delta);
    state.renderer.render(state.scene, state.camera);
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  function destroy() {
    state.active = false;
    if (state.animId) { cancelAnimationFrame(state.animId); state.animId = null; }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);

    var container = document.getElementById('time-heist-canvas');
    if (container) { container.parentNode.removeChild(container); }
    var hud = document.getElementById('time-heist-hud');
    if (hud) { hud.parentNode.removeChild(hud); }
    var msg = document.getElementById('th-message');
    if (msg) { msg.parentNode.removeChild(msg); }

    if (state.renderer) {
      state.renderer.dispose();
      state.renderer = null;
    }
    state.scene = null;
    state.camera = null;
    state.enemies = [];
    state.paradoxEnemies = [];
    state.bullets = [];
    state.eraObjects = {};
    state.keys = {};
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    // Reset state
    state.active = true;
    state.timeRemaining = TOTAL_TIME;
    state.elapsed = 0;
    state.lastParadoxTime = 0;
    state.paradoxStatus = 'STABLE';
    state.paradoxFlashTimer = 0;
    state.items = { KEY: false, CODE: false, CHIP: false };
    state.vaultPanels = [false, false, false];
    state.vaultOpen = false;
    state.score = 0;
    state.completed = false;
    state.portalActive = false;
    state.portalMesh = null;
    state.portalTimer = 0;
    state.transportPending = false;
    state.transportTimer = 0;
    state.nextEra = null;
    state.eraObjects = {};
    state.enemies = [];
    state.paradoxEnemies = [];
    state.bullets = [];
    state.keys = {};
    state.tKeyTime = 0;
    state.hKeyTime = 0;
    state.tPressed = false;
    state.hPressed = false;
    state.terminalDisabled = false;
    state.mirrorWarningTimer = 0;

    initScene();
    initHUD();
    buildWildWest();
    state.scene.background = new THREE.Color(0xD4A43C);
    state.scene.fog = new THREE.Fog(0xD4A43C, 30, 80);
    state.currentEra = ERAS.WILD_WEST;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);

    showMessage('TIME HEIST - T+H to open portal | SPACE to shoot | E to interact', '#00FFFF', 5000);

    renderLoop();
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  window.TimeHeist = {
    init: init,
    destroy: destroy,
    getState: function () { return state; },
    getScore: function () { return state.score; },
    isActive: function () { return state.active; }
  };

}(window));
