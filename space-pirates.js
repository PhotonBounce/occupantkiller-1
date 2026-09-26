// space-pirates.js — SpacePirates module
// Activation: S+P simultaneous keypress (both within 400ms)
// RULES: var only, IIFE window.SpacePirates, node --check must pass

window.SpacePirates = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    animId: null,
    clock: null,

    // Player
    playerHP: 120,
    playerPos: { x: 0, y: 1.7, z: 0 },
    playerMesh: null,
    yaw: 0,
    pitch: 0,
    keys: {},
    mouseDX: 0,
    mouseDY: 0,
    carryingPod: null,
    interactTimer: 0,
    interactTarget: null,
    interactAction: null,
    depressurizing: false,
    depresSec: 0,
    inVacuumSec: 0,

    // Key tracking for S+P activation
    keyTimestamps: {},

    // Mission timer (600s = 10 min)
    missionTimer: 600,
    missionOver: false,
    missionWon: false,
    reactorVented5: false,
    reactorVented8: false,
    captainDead: false,

    // Rooms / geometry
    rooms: [],          // { name, x, z, w, d, h, isBreached }
    walls: [],          // collideable wall meshes

    // Cargo pods
    cargoPods: [],      // { mesh, light, carried, transferred, x, z }

    // Survivors
    survivors: [],      // { mesh, hp, rescued, escorting, x, z, cabinDoor }

    // Pirates
    pirates: [],        // { mesh, helmet, hp, alive, x, z, fireTimer, type }
    pirateProjectiles: [],

    // Player projectiles
    projectiles: [],

    // Reactor
    reactorLight: null,
    reactorMesh: null,
    reactorFlicker: 0,

    // Debris floating
    debrisMeshes: [],
    debrisVels: [],

    // Airlock
    airlockInnerPos: { x: 0, z: -8 },
    airlockActive: false,

    // Breach zones
    breachZones: [],   // { x, z, r }

    // HUD
    hudEl: null,

    // Shoot cooldown
    shootCooldown: 0
  };

  // ─── Activation key handler ──────────────────────────────────────────────
  function handleActivationKey(e) {
    var key = e.key.toLowerCase();
    if (key !== 's' && key !== 'p') return;
    state.keyTimestamps[key] = Date.now();
    var s = state.keyTimestamps['s'] || 0;
    var p = state.keyTimestamps['p'] || 0;
    if (s > 0 && p > 0 && Math.abs(s - p) <= 400) {
      state.keyTimestamps = {};
      if (!state.active) {
        activate();
      }
    }
  }

  document.addEventListener('keydown', handleActivationKey);

  // ─── Activate ────────────────────────────────────────────────────────────
  function activate() {
    if (state.active) return;
    state.active = true;
    if (!window.THREE) { console.warn('SpacePirates: THREE.js not found'); return; }
    resetState();
    buildScene();
    buildHUD();
    startLoop();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onShoot);
    document.body.requestPointerLock && document.body.requestPointerLock();
  }

  function resetState() {
    state.playerHP = 120;
    state.playerPos = { x: 0, y: 1.7, z: 4 };
    state.yaw = 0;
    state.pitch = 0;
    state.keys = {};
    state.mouseDX = 0;
    state.mouseDY = 0;
    state.carryingPod = null;
    state.interactTimer = 0;
    state.interactTarget = null;
    state.interactAction = null;
    state.depressurizing = false;
    state.depresSec = 0;
    state.inVacuumSec = 0;
    state.missionTimer = 600;
    state.missionOver = false;
    state.missionWon = false;
    state.reactorVented5 = false;
    state.reactorVented8 = false;
    state.captainDead = false;
    state.rooms = [];
    state.walls = [];
    state.cargoPods = [];
    state.survivors = [];
    state.pirates = [];
    state.pirateProjectiles = [];
    state.projectiles = [];
    state.reactorLight = null;
    state.reactorMesh = null;
    state.reactorFlicker = 0;
    state.debrisMeshes = [];
    state.debrisVels = [];
    state.breachZones = [];
    state.shootCooldown = 0;
    state.airlockActive = false;
  }

  // ─── Scene builder ───────────────────────────────────────────────────────
  function buildScene() {
    var THREE = window.THREE;

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x000005);

    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 600);
    state.clock = new THREE.Clock();

    // Very dim ambient — ship losing power
    var ambient = new THREE.AmbientLight(0x111122, 0.3);
    state.scene.add(ambient);

    buildStarfield();
    buildShip();
    spawnCargoPods();
    spawnSurvivors();
    spawnPirates();
    buildDebris();
  }

  // ─── Starfield ───────────────────────────────────────────────────────────
  function buildStarfield() {
    var THREE = window.THREE;
    var starGeo = new THREE.SphereGeometry(0.08, 4, 4);
    var starMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    for (var i = 0; i < 400; i++) {
      var star = new THREE.Mesh(starGeo, starMat);
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = 250 + Math.random() * 50;
      star.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      state.scene.add(star);
    }
  }

  // ─── Ship layout ─────────────────────────────────────────────────────────
  function buildShip() {
    // Room layout along Z axis (player enters from +Z)
    // Airlock:     z=0,   w=4,  d=8,  h=4
    // CargoHold1:  z=-25, w=20, d=30, h=8
    // Engineering: z=-55, w=15, d=20, h=6
    // CrewQuarters:z=-80, w=10, d=15, h=4
    // CargoHold2:  z=-110,w=20, d=25, h=8
    // Bridge:      z=-135,w=12, d=10, h=5

    buildRoom('AIRLOCK',       0,    0,   4,  8, 4, 0x334444, false);
    buildRoom('CARGO_HOLD_1',  0,  -25,  20, 30, 8, 0x334433, false);
    buildRoom('ENGINEERING',   0,  -55,  15, 20, 6, 0x334444, false);
    buildRoom('CREW_QUARTERS', 0,  -80,  10, 15, 4, 0x445566, false);
    buildRoom('CARGO_HOLD_2',  0, -110,  20, 25, 8, 0x334433, true);
    buildRoom('BRIDGE',        0, -135,  12, 10, 5, 0x334466, false);

    // Corridors connecting rooms
    buildCorridor(0, -9.5,   4, 5, 4);  // airlock -> cargo1
    buildCorridor(0, -41,    6, 6, 5);  // cargo1 -> engineering
    buildCorridor(0, -66,    4, 4, 4);  // engineering -> crew quarters
    buildCorridor(0, -94,    5, 6, 4);  // crew quarters -> cargo2
    buildCorridor(0, -124,   5, 6, 4);  // cargo2 -> bridge

    // Emergency lighting in intact rooms
    addEmergencyLight(0,  3,  0);
    addEmergencyLight(0,  6, -25);
    addEmergencyLight(0,  3, -80);
    addEmergencyLight(0,  4, -135);

    // Vacuum / dark in cargo hold 2 (breached)
    var vacLight = new window.THREE.PointLight(0x000022, 0.4, 30);
    vacLight.position.set(0, 4, -110);
    state.scene.add(vacLight);
    state.breachZones.push({ x: 0, z: -110, r: 14 });

    // Hull breach gap visual (LineSegments)
    buildHullBreach(8, -105);
    buildHullBreach(-8, -115);

    // Reactor in engineering
    buildReactor(0, -55);

    // Airlock inner door marker
    buildAirlockMarker();
  }

  function buildRoom(name, x, z, w, d, h, color, isBreached) {
    var THREE = window.THREE;
    var mat = new THREE.MeshLambertMaterial({ color: color, side: THREE.BackSide });
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    state.scene.add(mesh);

    // Floor
    var fgeo = new THREE.BoxGeometry(w, 0.2, d);
    var fmat = new THREE.MeshLambertMaterial({ color: color });
    var floor = new THREE.Mesh(fgeo, fmat);
    floor.position.set(x, 0.1, z);
    state.scene.add(floor);

    state.rooms.push({ name: name, x: x, z: z, w: w, d: d, h: h, isBreached: isBreached });

    // Invisible collision walls for room boundaries
    pushWallBox(x - w / 2, z, 0.3, d + 0.3, h, x, z);
    pushWallBox(x + w / 2, z, 0.3, d + 0.3, h, x, z);
    pushWallBox(x, z - d / 2, w + 0.3, 0.3, h, x, z);
    pushWallBox(x, z + d / 2, w + 0.3, 0.3, h, x, z);
  }

  function pushWallBox(wx, wz, ww, wd, wh, rx, rz) {
    state.walls.push({ x: wx, z: wz, hw: ww / 2, hd: wd / 2 });
  }

  function buildCorridor(x, z, w, d, h) {
    var THREE = window.THREE;
    var mat = new THREE.MeshLambertMaterial({ color: 0x223333, side: THREE.BackSide });
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    state.scene.add(mesh);

    var fgeo = new THREE.BoxGeometry(w, 0.2, d);
    var fmat = new THREE.MeshLambertMaterial({ color: 0x223333 });
    var floor = new THREE.Mesh(fgeo, fmat);
    floor.position.set(x, 0.1, z);
    state.scene.add(floor);
  }

  function addEmergencyLight(x, y, z) {
    var light = new window.THREE.PointLight(0xFF2200, 0.6, 20);
    light.position.set(x, y, z);
    state.scene.add(light);
  }

  function buildHullBreach(x, z) {
    var THREE = window.THREE;
    var points = [];
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      points.push(new THREE.Vector3(
        x + Math.cos(angle) * 2,
        2 + Math.sin(angle) * 2,
        z
      ));
    }
    points.push(points[0].clone());
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x88AAFF, opacity: 0.8, transparent: true });
    var lines = new THREE.Line(geo, mat);
    state.scene.add(lines);
  }

  function buildReactor(x, z) {
    var THREE = window.THREE;
    var geo = new THREE.CylinderGeometry(3, 3, 6, 12);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x334455,
      emissive: new THREE.Color(0xFF4400),
      emissiveIntensity: 0.2
    });
    state.reactorMesh = new THREE.Mesh(geo, mat);
    state.reactorMesh.position.set(x, 3, z);
    state.scene.add(state.reactorMesh);

    state.reactorLight = new THREE.PointLight(0xFF4400, 1.5, 25);
    state.reactorLight.position.set(x, 5, z);
    state.scene.add(state.reactorLight);
  }

  function buildAirlockMarker() {
    var THREE = window.THREE;
    // Inner door frame
    var geo = new THREE.BoxGeometry(3.5, 3, 0.2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x225544, emissive: new THREE.Color(0x00FF88), emissiveIntensity: 0.3 });
    var door = new THREE.Mesh(geo, mat);
    door.position.set(0, 1.5, -4.5);
    state.scene.add(door);
  }

  // ─── Cargo pods ──────────────────────────────────────────────────────────
  function spawnCargoPods() {
    var THREE = window.THREE;
    var podData = [
      { x: -6, z: -18, color: 0x445566 },
      { x:  6, z: -30, color: 0x445566 },
      { x: -7, z: -100, color: 0x664433 },
      { x:  7, z: -118, color: 0x664433 }
    ];
    for (var i = 0; i < podData.length; i++) {
      var d = podData[i];
      var geo = new THREE.BoxGeometry(1.5, 1.5, 2.5);
      var mat = new THREE.MeshLambertMaterial({ color: d.color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, 0.75, d.z);
      state.scene.add(mesh);

      var light = new THREE.PointLight(0x4488FF, 0.8, 5);
      light.position.set(d.x, 1.5, d.z);
      state.scene.add(light);

      state.cargoPods.push({
        mesh: mesh,
        light: light,
        carried: false,
        transferred: false,
        x: d.x,
        z: d.z
      });
    }
  }

  // ─── Survivors ───────────────────────────────────────────────────────────
  function spawnSurvivors() {
    var THREE = window.THREE;
    var survivorData = [
      { x: -3, z: -76, locked: true },
      { x:  3, z: -80, locked: true },
      { x: -3, z: -84, locked: true },
      { x:  5, z: -20, locked: false },
      { x: -5, z: -35, locked: false },
      { x:  4, z: -48, locked: false }
    ];
    for (var i = 0; i < survivorData.length; i++) {
      var d = survivorData[i];
      var geo = new THREE.BoxGeometry(0.7, 1.7, 0.4);
      var mat = new THREE.MeshLambertMaterial({ color: 0x886655 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, 0.85, d.z);
      state.scene.add(mesh);

      var cabinDoor = null;
      if (d.locked) {
        var dgeo = new THREE.BoxGeometry(1, 2, 0.2);
        var dmat = new THREE.MeshLambertMaterial({ color: 0x445566 });
        cabinDoor = new THREE.Mesh(dgeo, dmat);
        cabinDoor.position.set(d.x, 1, d.z - 1.5);
        state.scene.add(cabinDoor);
      }

      state.survivors.push({
        mesh: mesh,
        hp: 80,
        rescued: false,
        escorting: false,
        x: d.x,
        z: d.z,
        locked: d.locked,
        cabinDoor: cabinDoor
      });
    }
  }

  // ─── Pirates ─────────────────────────────────────────────────────────────
  function spawnPirates() {
    var THREE = window.THREE;

    // Cargo hold 1: 5 pirates
    spawnPirateGroup(5, -20, -25, 8, 12);
    // Engineering: 4 pirates
    spawnPirateGroup(4, -5, -55, 6, 8);
    // Crew quarters: 3 pirates
    spawnPirateGroup(3, -4, -80, 4, 6);
    // Cargo hold 2: 6 pirates
    spawnPirateGroup(6, -8, -110, 8, 10);
    // Mechanic (special) in engineering
    spawnSpecialPirate('MECHANIC', 2, -50, 150);
    // Captain on bridge
    spawnSpecialPirate('CAPTAIN', 0, -135, 350);
  }

  function spawnPirateGroup(count, baseX, baseZ, spreadX, spreadZ) {
    var THREE = window.THREE;
    for (var i = 0; i < count; i++) {
      var px = baseX + (Math.random() - 0.5) * spreadX;
      var pz = baseZ + (Math.random() - 0.5) * spreadZ;
      spawnSinglePirate(px, pz, 80, 'GRUNT');
    }
  }

  function spawnSinglePirate(px, pz, hp, type) {
    var THREE = window.THREE;
    var bodyColor = type === 'CAPTAIN' ? 0x331111 : 0x443322;
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(px, 0.8, pz);
    state.scene.add(body);

    var helmGeo = new THREE.SphereGeometry(0.35, 8, 6);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var helmet = new THREE.Mesh(helmGeo, helmMat);
    helmet.position.set(px, 1.85, pz);
    state.scene.add(helmet);

    var plasmaLight = new THREE.PointLight(0xFF4400, 0.5, 4);
    plasmaLight.position.set(px, 1, pz);
    state.scene.add(plasmaLight);

    state.pirates.push({
      body: body,
      helmet: helmet,
      plasmaLight: plasmaLight,
      hp: hp,
      maxHp: hp,
      alive: true,
      x: px,
      z: pz,
      fireTimer: 1.5 + Math.random() * 2,
      type: type,
      alertTimer: 0
    });
  }

  function spawnSpecialPirate(type, px, pz, hp) {
    spawnSinglePirate(px, pz, hp, type);
  }

  // ─── Floating debris ─────────────────────────────────────────────────────
  function buildDebris() {
    var THREE = window.THREE;
    var debrisPositions = [
      { x: 5, y: 3, z: -108 },
      { x: -6, y: 2, z: -112 },
      { x: 3, y: 4, z: -116 },
      { x: -4, y: 1.5, z: -105 },
      { x: 7, y: 2.5, z: -118 }
    ];
    for (var i = 0; i < debrisPositions.length; i++) {
      var d = debrisPositions[i];
      var w = 0.4 + Math.random() * 0.8;
      var h = 0.3 + Math.random() * 0.6;
      var dep = 0.3 + Math.random() * 0.7;
      var geo = new THREE.BoxGeometry(w, h, dep);
      var mat = new THREE.MeshLambertMaterial({ color: 0x334444 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, d.y, d.z);
      state.scene.add(mesh);
      state.debrisMeshes.push(mesh);
      state.debrisVels.push({
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.1,
        vz: (Math.random() - 0.5) * 0.3
      });
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.id = 'sp-hud';
    state.hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00FFAA',
      'font:bold 14px monospace',
      'padding:8px 16px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'z-index:9100',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(state.hudEl);

    // Crosshair
    var ch = document.createElement('div');
    ch.id = 'sp-crosshair';
    ch.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:14px',
      'height:14px',
      'border:2px solid rgba(0,255,136,0.8)',
      'border-radius:50%',
      'z-index:9100',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(ch);

    // Interaction prompt
    var ip = document.createElement('div');
    ip.id = 'sp-interact';
    ip.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#FFDD00',
      'font:bold 13px monospace',
      'padding:6px 12px',
      'border-radius:4px',
      'z-index:9100',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(ip);

    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var cargo = countTransferred();
    var rescued = countRescued();
    var piratesLeft = countAlivePirates();
    var reactorSec = Math.max(0, Math.ceil(state.missionTimer));
    var capStatus = state.captainDead ? 'DEAD' : 'ALIVE';
    var hpColor = state.playerHP > 60 ? '#00FF88' : state.playerHP > 30 ? '#FFAA00' : '#FF3300';

    state.hudEl.innerHTML =
      'SPACE PIRATES' +
      '  |  HP: <span style="color:' + hpColor + '">' + Math.max(0, Math.ceil(state.playerHP)) + '</span>' +
      '  |  CARGO: ' + cargo + '/4 TRANSFERRED' +
      '  |  SURVIVORS: ' + rescued + '/6 RESCUED' +
      '  |  CAPTAIN: ' + capStatus +
      '  |  REACTOR: ' + reactorSec + 's' +
      '  |  PIRATES: ' + piratesLeft;
  }

  function showInteract(msg) {
    var el = document.getElementById('sp-interact');
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  function countTransferred() {
    var n = 0;
    for (var i = 0; i < state.cargoPods.length; i++) {
      if (state.cargoPods[i].transferred) n++;
    }
    return n;
  }

  function countRescued() {
    var n = 0;
    for (var i = 0; i < state.survivors.length; i++) {
      if (state.survivors[i].rescued) n++;
    }
    return n;
  }

  function countAlivePirates() {
    var n = 0;
    for (var i = 0; i < state.pirates.length; i++) {
      if (state.pirates[i].alive) n++;
    }
    return n;
  }

  // ─── Input handlers ──────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!state.active) return;
    state.keys[e.code] = true;
    if (e.code === 'Escape') {
      deactivate();
    }
    if (e.code === 'KeyE') {
      startInteract();
    }
  }

  function onKeyUp(e) {
    if (!state.active) return;
    state.keys[e.code] = false;
    if (e.code === 'KeyE') {
      cancelInteract();
    }
  }

  function onMouseMove(e) {
    if (!state.active) return;
    state.mouseDX += e.movementX || 0;
    state.mouseDY += e.movementY || 0;
  }

  function onShoot(e) {
    if (!state.active || state.missionOver) return;
    if (state.shootCooldown > 0) return;
    firePlayerShot();
    state.shootCooldown = 0.25;
  }

  // ─── Interact system ─────────────────────────────────────────────────────
  function startInteract() {
    if (state.missionOver) return;
    var target = findInteractTarget();
    if (!target) return;
    state.interactTarget = target;
    state.interactAction = target.action;
    state.interactTimer = 0;

    if (target.action === 'AIRLOCK_DEPRESSURIZE') {
      state.depressurizing = true;
    }
  }

  function cancelInteract() {
    state.interactTarget = null;
    state.interactAction = null;
    state.interactTimer = 0;
    state.depressurizing = false;
    state.depresSec = 0;
  }

  function findInteractTarget() {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var interactRange = 2.5;

    // Airlock inner door (transfer cargo/survivors)
    if (Math.abs(px) < 3 && Math.abs(pz - (-4.5)) < 2) {
      if (state.carryingPod) {
        return { action: 'TRANSFER_POD', label: '[E] Transfer cargo pod through airlock' };
      }
      // Check for escorting survivors near player
      for (var s = 0; s < state.survivors.length; s++) {
        var surv = state.survivors[s];
        if (surv.escorting && !surv.rescued) {
          return { action: 'RESCUE_SURVIVOR', label: '[E] Move survivor to safety', idx: s };
        }
      }
      // Depressurize airlock to enter
      if (!state.airlockActive) {
        return { action: 'AIRLOCK_DEPRESSURIZE', label: '[E] Hold 3s: Depressurize airlock' };
      }
    }

    // Cargo pods
    if (!state.carryingPod) {
      for (var c = 0; c < state.cargoPods.length; c++) {
        var pod = state.cargoPods[c];
        if (pod.transferred || pod.carried) continue;
        var dx = px - pod.x;
        var dz = pz - pod.z;
        if (Math.sqrt(dx * dx + dz * dz) < interactRange) {
          return { action: 'PICK_POD', label: '[E] Pick up cargo pod (80kg)', idx: c };
        }
      }
    } else {
      return { action: 'DROP_POD', label: '[E] Drop cargo pod', idx: -1 };
    }

    // Cabin doors (survivors)
    for (var sv = 0; sv < state.survivors.length; sv++) {
      var survivor = state.survivors[sv];
      if (survivor.rescued || survivor.escorting) continue;
      if (survivor.locked && survivor.cabinDoor) {
        var doorX = survivor.cabinDoor.position.x;
        var doorZ = survivor.cabinDoor.position.z;
        var ddx = px - doorX;
        var ddz = pz - doorZ;
        if (Math.sqrt(ddx * ddx + ddz * ddz) < interactRange) {
          return { action: 'OPEN_DOOR', label: '[E] Hold 2s: Open cabin door', idx: sv };
        }
      } else if (!survivor.locked) {
        var sdx = px - survivor.x;
        var sdz = pz - survivor.z;
        if (Math.sqrt(sdx * sdx + sdz * sdz) < interactRange) {
          return { action: 'ESCORT_SURVIVOR', label: '[E] Escort survivor to airlock', idx: sv };
        }
      }
    }

    return null;
  }

  function updateInteract(dt) {
    var target = findInteractTarget();
    if (target) {
      showInteract(target.label);
    } else {
      showInteract(null);
    }

    if (!state.interactTarget || !state.keys['KeyE']) {
      if (state.interactAction && state.interactAction !== 'TRANSFER_POD' && state.interactAction !== 'PICK_POD' && state.interactAction !== 'DROP_POD' && state.interactAction !== 'ESCORT_SURVIVOR' && state.interactAction !== 'RESCUE_SURVIVOR') {
        cancelInteract();
      }
      return;
    }

    var action = state.interactAction;

    if (action === 'AIRLOCK_DEPRESSURIZE') {
      state.depresSec += dt;
      showInteract('[E] Depressurizing... ' + Math.ceil(3 - state.depresSec) + 's');
      if (state.depresSec >= 3) {
        state.airlockActive = true;
        state.depressurizing = false;
        cancelInteract();
        showInteract('Airlock open!');
        setTimeout(function () { showInteract(null); }, 1500);
      }
      return;
    }

    if (action === 'PICK_POD') {
      var idx = state.interactTarget.idx;
      if (idx >= 0 && idx < state.cargoPods.length) {
        var pod = state.cargoPods[idx];
        pod.carried = true;
        cancelInteract();
        state.carryingPod = pod;
      }
      return;
    }

    if (action === 'DROP_POD') {
      if (state.carryingPod) {
        state.carryingPod.carried = false;
        state.carryingPod.x = state.playerPos.x + Math.sin(state.yaw) * (-1.5);
        state.carryingPod.z = state.playerPos.z + Math.cos(state.yaw) * (-1.5);
        state.carryingPod.mesh.position.set(state.carryingPod.x, 0.75, state.carryingPod.z);
        state.carryingPod.light.position.set(state.carryingPod.x, 1.5, state.carryingPod.z);
        state.carryingPod = null;
      }
      cancelInteract();
      return;
    }

    if (action === 'TRANSFER_POD') {
      if (state.carryingPod) {
        state.carryingPod.transferred = true;
        state.carryingPod.carried = false;
        state.scene.remove(state.carryingPod.mesh);
        state.scene.remove(state.carryingPod.light);
        state.carryingPod = null;
        cancelInteract();
        showInteract('Cargo pod transferred!');
        setTimeout(function () { showInteract(null); }, 1200);
      }
      return;
    }

    if (action === 'OPEN_DOOR') {
      state.interactTimer += dt;
      var sv2 = state.interactTarget.idx;
      showInteract('[E] Opening door... ' + Math.ceil(2 - state.interactTimer) + 's');
      if (state.interactTimer >= 2) {
        var survivor2 = state.survivors[sv2];
        survivor2.locked = false;
        if (survivor2.cabinDoor) {
          state.scene.remove(survivor2.cabinDoor);
          survivor2.cabinDoor = null;
        }
        cancelInteract();
        showInteract('Door open!');
        setTimeout(function () { showInteract(null); }, 800);
      }
      return;
    }

    if (action === 'ESCORT_SURVIVOR') {
      var eidx = state.interactTarget.idx;
      if (eidx >= 0 && eidx < state.survivors.length) {
        state.survivors[eidx].escorting = true;
        cancelInteract();
        showInteract('Survivor following you!');
        setTimeout(function () { showInteract(null); }, 1000);
      }
      return;
    }

    if (action === 'RESCUE_SURVIVOR') {
      var ridx = state.interactTarget.idx;
      if (ridx >= 0 && ridx < state.survivors.length) {
        state.survivors[ridx].rescued = true;
        state.survivors[ridx].escorting = false;
        state.scene.remove(state.survivors[ridx].mesh);
        cancelInteract();
        showInteract('Survivor rescued!');
        setTimeout(function () { showInteract(null); }, 1200);
      }
      return;
    }
  }

  // ─── Player movement ─────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (state.missionOver) return;

    // Mouse look
    var sensitivity = 0.002;
    state.yaw -= state.mouseDX * sensitivity;
    state.pitch -= state.mouseDY * sensitivity;
    state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
    state.mouseDX = 0;
    state.mouseDY = 0;

    // Movement
    var speed = 8;
    var dx = 0;
    var dz = 0;
    if (state.keys['KeyW'] || state.keys['ArrowUp'])    dz -= 1;
    if (state.keys['KeyS'] || state.keys['ArrowDown'])  dz += 1;
    if (state.keys['KeyA'] || state.keys['ArrowLeft'])  dx -= 1;
    if (state.keys['KeyD'] || state.keys['ArrowRight']) dx += 1;

    // Carrying pod slows player
    if (state.carryingPod) speed = 4;

    var cos = Math.cos(state.yaw);
    var sin = Math.sin(state.yaw);
    var mx = (cos * dx - sin * dz) * speed * dt;
    var mz = (sin * dx + cos * dz) * speed * dt;

    var nx = state.playerPos.x + mx;
    var nz = state.playerPos.z + mz;

    // Simple room boundary collision
    if (!isOutsideAllRooms(nx, state.playerPos.z)) {
      state.playerPos.x = nx;
    }
    if (!isOutsideAllRooms(state.playerPos.x, nz)) {
      state.playerPos.z = nz;
    }

    // Clamp in overall ship range
    state.playerPos.x = Math.max(-11, Math.min(11, state.playerPos.x));
    state.playerPos.z = Math.max(-142, Math.min(6, state.playerPos.z));

    // Vacuum exposure check
    var inBreach = isInBreachZone(state.playerPos.x, state.playerPos.z);
    if (inBreach) {
      state.inVacuumSec += dt;
      if (state.inVacuumSec >= 0.5) {
        state.playerHP -= 5 * dt;
        if (state.playerHP <= 0) {
          endMission(false, 'Vacuum exposure — hull breach was fatal.');
        }
      }
    } else {
      state.inVacuumSec = Math.max(0, state.inVacuumSec - dt);
    }

    // Update camera
    state.camera.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.yaw;
    state.camera.rotation.x = state.pitch;

    // Update carried pod position
    if (state.carryingPod) {
      var csin = Math.sin(state.yaw);
      var ccos = Math.cos(state.yaw);
      state.carryingPod.x = state.playerPos.x - csin * 1.2;
      state.carryingPod.z = state.playerPos.z - ccos * 1.2;
      state.carryingPod.mesh.position.set(state.carryingPod.x, 0.75, state.carryingPod.z);
      state.carryingPod.light.position.set(state.carryingPod.x, 1.5, state.carryingPod.z);
    }

    // Update escorting survivors
    for (var i = 0; i < state.survivors.length; i++) {
      var surv = state.survivors[i];
      if (!surv.escorting || surv.rescued || surv.hp <= 0) continue;
      var sdx = state.playerPos.x - surv.x;
      var sdz = state.playerPos.z - surv.z;
      var dist = Math.sqrt(sdx * sdx + sdz * sdz);
      if (dist > 2.5) {
        var followSpeed = 5 * dt;
        surv.x += (sdx / dist) * followSpeed;
        surv.z += (sdz / dist) * followSpeed;
        surv.mesh.position.set(surv.x, 0.85, surv.z);
      }
    }

    // Shoot cooldown
    if (state.shootCooldown > 0) {
      state.shootCooldown -= dt;
    }
  }

  function isOutsideAllRooms(x, z) {
    // Check if position is within any room or corridor - if not, it's a wall
    // Rooms
    var roomDefs = [
      { x: 0, z: 0,    hw: 2,  hd: 4 },
      { x: 0, z: -25,  hw: 10, hd: 15 },
      { x: 0, z: -55,  hw: 7.5,hd: 10 },
      { x: 0, z: -80,  hw: 5,  hd: 7.5 },
      { x: 0, z: -110, hw: 10, hd: 12.5 },
      { x: 0, z: -135, hw: 6,  hd: 5 },
      // corridors
      { x: 0, z: -9.5, hw: 2,  hd: 2.5 },
      { x: 0, z: -41,  hw: 3,  hd: 3 },
      { x: 0, z: -66,  hw: 2,  hd: 2 },
      { x: 0, z: -94,  hw: 2.5,hd: 3 },
      { x: 0, z: -124, hw: 2.5,hd: 3 }
    ];
    for (var i = 0; i < roomDefs.length; i++) {
      var r = roomDefs[i];
      if (Math.abs(x - r.x) <= r.hw && Math.abs(z - r.z) <= r.hd) {
        return false; // inside this room
      }
    }
    return true; // outside all rooms = wall
  }

  function isInBreachZone(x, z) {
    for (var i = 0; i < state.breachZones.length; i++) {
      var bz = state.breachZones[i];
      var dx = x - bz.x;
      var dz = z - bz.z;
      if (Math.sqrt(dx * dx + dz * dz) < bz.r) return true;
    }
    return false;
  }

  // ─── Player shooting ─────────────────────────────────────────────────────
  function firePlayerShot() {
    var THREE = window.THREE;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ'));

    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00FFAA });
    var proj = new THREE.Mesh(geo, mat);
    proj.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.scene.add(proj);

    state.projectiles.push({
      mesh: proj,
      vx: dir.x * 40,
      vy: dir.y * 40,
      vz: dir.z * 40,
      life: 3
    });
  }

  function updateProjectiles(dt) {
    var THREE = window.THREE;
    for (var i = state.projectiles.length - 1; i >= 0; i--) {
      var p = state.projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      if (p.life <= 0) {
        state.scene.remove(p.mesh);
        state.projectiles.splice(i, 1);
        continue;
      }

      // Hit pirates
      var hit = false;
      for (var j = 0; j < state.pirates.length; j++) {
        var pirate = state.pirates[j];
        if (!pirate.alive) continue;
        var dx = p.mesh.position.x - pirate.x;
        var dz = p.mesh.position.z - pirate.z;
        var dy = p.mesh.position.y - 0.8;
        if (Math.sqrt(dx * dx + dz * dz + dy * dy) < 0.9) {
          var dmg = 20 + Math.random() * 10;
          pirate.hp -= dmg;
          if (pirate.hp <= 0) {
            killPirate(j);
          }
          state.scene.remove(p.mesh);
          state.projectiles.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // Hit survivors (friendly fire from pirate projectiles — skip for player)
      // Clamp out of room = remove
      if (isOutsideAllRooms(p.mesh.position.x, p.mesh.position.z) && p.life < 2.5) {
        state.scene.remove(p.mesh);
        state.projectiles.splice(i, 1);
      }
    }
  }

  function killPirate(idx) {
    var pirate = state.pirates[idx];
    if (!pirate || !pirate.alive) return;
    pirate.alive = false;
    state.scene.remove(pirate.body);
    state.scene.remove(pirate.helmet);
    state.scene.remove(pirate.plasmaLight);
    if (pirate.type === 'CAPTAIN') {
      state.captainDead = true;
    }
  }

  // ─── Pirate AI ───────────────────────────────────────────────────────────
  function updatePirates(dt) {
    var THREE = window.THREE;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    for (var i = 0; i < state.pirates.length; i++) {
      var pirate = state.pirates[i];
      if (!pirate.alive) continue;

      var dx = px - pirate.x;
      var dz = pz - pirate.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Move toward player if close enough
      var aggroRange = pirate.type === 'CAPTAIN' ? 30 : 20;
      if (dist < aggroRange && dist > 2) {
        var speed = pirate.type === 'CAPTAIN' ? 6 : (pirate.type === 'MECHANIC' ? 3 : 4);
        var move = speed * dt;
        var nx = pirate.x + (dx / dist) * move;
        var nz = pirate.z + (dz / dist) * move;
        if (!isOutsideAllRooms(nx, nz)) {
          pirate.x = nx;
          pirate.z = nz;
        }
      }

      // Update meshes
      pirate.body.position.set(pirate.x, 0.8, pirate.z);
      pirate.helmet.position.set(pirate.x, 1.85, pirate.z);
      pirate.plasmaLight.position.set(pirate.x, 1, pirate.z);

      // Fire at player
      pirate.fireTimer -= dt;
      var fireRate = pirate.type === 'CAPTAIN' ? 0.6 : (pirate.type === 'MECHANIC' ? 2 : 1.8);
      if (pirate.fireTimer <= 0 && dist < aggroRange) {
        pirate.fireTimer = fireRate + Math.random() * 1;
        firePirateShot(pirate);
      }
    }
  }

  function firePirateShot(pirate) {
    var THREE = window.THREE;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var py = state.playerPos.y;

    var dx = px - pirate.x;
    var dy = py - 1;
    var dz = pz - pirate.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) return;

    // Add some inaccuracy
    dx += (Math.random() - 0.5) * 0.8;
    dz += (Math.random() - 0.5) * 0.8;
    len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    var speed = 25;
    var geo = new THREE.SphereGeometry(0.1, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
    var proj = new THREE.Mesh(geo, mat);
    proj.position.set(pirate.x, 1.2, pirate.z);
    state.scene.add(proj);

    state.pirateProjectiles.push({
      mesh: proj,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      vz: (dz / len) * speed,
      life: 3
    });
  }

  function updatePirateProjectiles(dt) {
    for (var i = state.pirateProjectiles.length - 1; i >= 0; i--) {
      var p = state.pirateProjectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      if (p.life <= 0) {
        state.scene.remove(p.mesh);
        state.pirateProjectiles.splice(i, 1);
        continue;
      }

      // Hit player
      var dx = p.mesh.position.x - state.playerPos.x;
      var dz = p.mesh.position.z - state.playerPos.z;
      var dy = p.mesh.position.y - state.playerPos.y;
      if (Math.sqrt(dx * dx + dz * dz + dy * dy) < 0.8) {
        var dmg = 8 + Math.random() * 7;
        state.playerHP -= dmg;
        state.scene.remove(p.mesh);
        state.pirateProjectiles.splice(i, 1);
        if (state.playerHP <= 0) {
          endMission(false, 'You were killed by pirates.');
        }
        continue;
      }

      // Hit escorting survivors
      for (var s = 0; s < state.survivors.length; s++) {
        var surv = state.survivors[s];
        if (!surv.escorting || surv.rescued) continue;
        var sdx = p.mesh.position.x - surv.x;
        var sdz = p.mesh.position.z - surv.z;
        if (Math.sqrt(sdx * sdx + sdz * sdz) < 0.8) {
          surv.hp -= 10;
          state.scene.remove(p.mesh);
          state.pirateProjectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  // ─── Reactor events ──────────────────────────────────────────────────────
  function updateReactor(dt) {
    if (!state.reactorLight) return;

    // Flicker
    state.reactorFlicker += dt * 5;
    var intensity = 1 + Math.sin(state.reactorFlicker) * 0.4 + Math.random() * 0.2;
    state.reactorLight.intensity = Math.max(0.1, intensity);

    var timeLeft = state.missionTimer;

    // At 5 min remaining (300s): plasma vent
    if (timeLeft <= 300 && !state.reactorVented5) {
      state.reactorVented5 = true;
      state.reactorLight.intensity = 6;
      setTimeout(function () {
        if (state.reactorLight) state.reactorLight.intensity = 1.5;
      }, 1000);
      // Deal damage if player is in engineering
      var pdx = state.playerPos.x;
      var pdz = state.playerPos.z;
      if (Math.abs(pdx) < 8 && Math.abs(pdz - (-55)) < 12) {
        state.playerHP -= 15;
        showInteract('PLASMA VENT! -15 HP');
        setTimeout(function () { showInteract(null); }, 2000);
      }
    }

    // At 2 min remaining (120s): containment breach warning
    if (timeLeft <= 120 && !state.reactorVented8) {
      state.reactorVented8 = true;
      flashHUD('red');
      showInteract('WARNING: CONTAINMENT BREACH IMMINENT!');
      setTimeout(function () { showInteract(null); }, 3000);
    }
  }

  function flashHUD(color) {
    if (!state.hudEl) return;
    var origColor = state.hudEl.style.color;
    state.hudEl.style.color = color === 'red' ? '#FF0000' : origColor;
    state.hudEl.style.borderColor = color === 'red' ? '#FF0000' : '#00FF88';
    setTimeout(function () {
      if (state.hudEl) {
        state.hudEl.style.color = '#00FFAA';
        state.hudEl.style.borderColor = '#00FF88';
      }
    }, 800);
  }

  // ─── Floating debris ─────────────────────────────────────────────────────
  function updateDebris(dt) {
    for (var i = 0; i < state.debrisMeshes.length; i++) {
      var mesh = state.debrisMeshes[i];
      var vel = state.debrisVels[i];
      mesh.position.x += vel.vx * dt;
      mesh.position.y += vel.vy * dt;
      mesh.position.z += vel.vz * dt;
      mesh.rotation.x += vel.vx * dt;
      mesh.rotation.z += vel.vz * dt;

      // Bounce off room boundaries
      if (mesh.position.y < 0.3 || mesh.position.y > 7) vel.vy *= -1;
      if (mesh.position.x < -9 || mesh.position.x > 9) vel.vx *= -1;
      if (mesh.position.z < -118 || mesh.position.z > -102) vel.vz *= -1;
    }
  }

  // ─── Mission timer ───────────────────────────────────────────────────────
  function updateMissionTimer(dt) {
    state.missionTimer -= dt;
    if (state.missionTimer <= 0) {
      state.missionTimer = 0;
      endMission(false, 'Reactor exploded! Mission failed.');
    }
  }

  // ─── Win / lose check ────────────────────────────────────────────────────
  function checkWinCondition() {
    if (state.missionOver) return;
    if (countTransferred() >= 4 && countRescued() >= 5) {
      endMission(true, 'Mission complete! Cargo recovered, crew rescued!');
    }
  }

  // ─── End mission ─────────────────────────────────────────────────────────
  function endMission(won, msg) {
    if (state.missionOver) return;
    state.missionOver = true;
    state.missionWon = won;

    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,0.85)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'z-index:9200',
      'color:' + (won ? '#00FF88' : '#FF3300'),
      'font:bold 32px monospace',
      'text-align:center'
    ].join(';');

    overlay.innerHTML =
      '<div>' + (won ? 'MISSION COMPLETE' : 'MISSION FAILED') + '</div>' +
      '<div style="font-size:16px;margin-top:20px;color:#CCCCCC">' + msg + '</div>' +
      '<div style="font-size:14px;margin-top:16px;color:#AAAAAA">' +
        'Cargo: ' + countTransferred() + '/4 | Survivors: ' + countRescued() + '/6 | Captain: ' + (state.captainDead ? 'Eliminated' : 'Escaped') +
      '</div>' +
      '<div style="font-size:13px;margin-top:24px;color:#888888">Press ESC to exit</div>';

    document.body.appendChild(overlay);
  }

  // ─── Main game loop ──────────────────────────────────────────────────────
  function startLoop() {
    function loop() {
      if (!state.active) return;
      state.animId = requestAnimationFrame(loop);
      var dt = Math.min(state.clock.getDelta(), 0.05);
      if (!state.missionOver) {
        updateMissionTimer(dt);
        updatePlayer(dt);
        updateInteract(dt);
        updatePirates(dt);
        updateProjectiles(dt);
        updatePirateProjectiles(dt);
        updateReactor(dt);
        updateDebris(dt);
        checkWinCondition();
        updateHUD();
      }
      state.renderer.render(state.scene, state.camera);
    }
    loop();
  }

  // ─── Deactivate ──────────────────────────────────────────────────────────
  function deactivate() {
    if (!state.active) return;
    state.active = false;
    if (state.animId) cancelAnimationFrame(state.animId);
    if (state.renderer && state.renderer.domElement && state.renderer.domElement.parentNode) {
      state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    var ch = document.getElementById('sp-crosshair');
    if (ch && ch.parentNode) ch.parentNode.removeChild(ch);
    var ip = document.getElementById('sp-interact');
    if (ip && ip.parentNode) ip.parentNode.removeChild(ip);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onShoot);
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    // already wired via keydown listener at module load
  }

  function update() {
    // loop is self-driven
  }

  function reset() {
    deactivate();
  }

  return { init: init, update: update, reset: reset };

}());
