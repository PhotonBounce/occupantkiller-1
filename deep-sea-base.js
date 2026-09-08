/* ═══════════════════════════════════════════════════════════════════════════
   deep-sea-base.js — Deep Sea Bioweapon Research Base Assault
   API: window.DeepSeaBase = { init, update, reset }
   Activation: D + S simultaneous keypress within 400ms

   Scenario:
     Secret facility 2km below the Pacific. Illegal bioweapon program.
     Destroy 4 bioweapon labs + wipe server room + eliminate Director + escape.
     10-minute timer before facility self-destructs.

   Base layout:
     Entry airlock  — CylinderGeometry r=3 h=10 (0x334455)
     Corridors      — CylinderGeometry r=3 h=20 (0x334444) + GLASS dome windows
     Lab A virology — BoxGeometry 20×5×15 (0x334455)
     Lab B chem     — BoxGeometry 18×5×14 (0x334455)
     Lab C weapons  — BoxGeometry 20×5×18 (0x334433)
     Lab D testing  — BoxGeometry 15×5×12 (0x334444)
     Server room    — BoxGeometry 12×5×10 (0x334455)
     Control room   — BoxGeometry 15×5×15 (0x334466)

   Objectives:
     1. Destroy 4 bioweapon lab reactors (E hold 5s each → 30s blast delay)
     2. Wipe server room (E on director's terminal after all labs destroyed)
     3. Eliminate Director (boss, 400HP, sonic weapon)
     4. Escape via entry airlock

   Threats:
     22 security guards (BoxGeometry 0x334444, 90HP)
     4 dive-suit guards (SphereGeometry helmets, immune drowning)
     Director (BoxGeometry 0x334433, 400HP, sonic pulse stun)
     Alarm triggers +10 guards in 90s
     Hull breach panels (0xFF2200) — shoot = 10s before breach, 10HP/s
     3 patch kits in lockers; E hold 3s to seal

   HUD: DEEP SEA BASE [LABS: N/4 DESTROYED] [SERVER: INTACT/WIPED]
        [DIRECTOR: ACTIVE/ELIMINATED] [TIMER: MM:SS] [HULL: STABLE/BREACH]
   ═══════════════════════════════════════════════════════════════════════════ */

window.DeepSeaBase = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  /* ── Activation combo: D + S within 400ms ────────────────────────────── */
  var ACTIVATION_WINDOW = 400;
  var _activationTimes = { D: 0, S: 0 };

  /* ── Scene references ─────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;
  var _animId   = null;

  /* ── Game state ───────────────────────────────────────────────────────── */
  var _active       = false;
  var _gameOver     = false;
  var _victory      = false;
  var _lastTime     = 0;

  /* Mission timer: 10 minutes = 600s */
  var _missionTimer = 600;

  /* Objectives */
  var _labsDestroyed   = 0;
  var _serverWiped     = false;
  var _directorDead    = false;
  var _escaped         = false;

  /* Alarm */
  var _alarmActive        = false;
  var _alarmTimer         = 0;          /* time until reinforcements arrive */
  var _reinforcementsSpawned = false;

  /* Airlock state */
  var _airlockTimer       = 0;
  var _airlockOpen        = false;
  var _airlockInteracting = false;

  /* ── Player ───────────────────────────────────────────────────────────── */
  var _playerPos   = { x: 0, y: 1.5, z: 60 };
  var _playerHP    = 100;
  var _playerMaxHP = 100;
  var _playerSpeed = 7;
  var _yaw         = 0;
  var _pitch       = 0;
  var _playerMesh  = null;
  var _stunTimer   = 0;       /* director sonic stun */

  /* ── Input ────────────────────────────────────────────────────────────── */
  var _keys        = {};
  var _mouseX      = 0;
  var _mouseY      = 0;
  var _mouseLocked = false;
  var _ePressed    = false;
  var _eHeldTimer  = 0;
  var _eTarget     = null;   /* current interactive target type */
  var _shooting    = false;
  var _shootCooldown = 0;

  /* ── Player shots ─────────────────────────────────────────────────────── */
  var _playerShots = [];
  /* each: { mesh, vel:{x,y,z}, life } */

  /* ── Guards ───────────────────────────────────────────────────────────── */
  var _guards = [];
  /* each: { mesh, helmetMesh, pos:{x,y,z}, hp, alive, state, fireTimer,
             alertTimer, targetPos:{x,z}, diver, patrol, patrolTimer } */

  /* ── Guard shots ──────────────────────────────────────────────────────── */
  var _guardShots = [];
  /* each: { mesh, vel:{x,y,z}, life } */

  /* ── Director (boss) ──────────────────────────────────────────────────── */
  var _director = null;
  /* { mesh, pos, hp, alive, state, sonicTimer, sonicCooldown,
       overrideArmed, overrideTimer, sonicPulses:[] } */

  /* ── Lab reactors (4) ─────────────────────────────────────────────────── */
  var _labs = [];
  /* each: { id, mesh, light, pos:{x,y,z}, destroyed, overloading,
             overloadTimer, blastCountdown, blastDone,
             interacting, holdTimer } */

  /* ── Server room ──────────────────────────────────────────────────────── */
  var _serverTerminal   = null;
  /* { mesh, pos, interacting, holdTimer } */
  var _serverLocked     = true;    /* locked until all 4 labs destroyed */

  /* ── Hull breach panels ───────────────────────────────────────────────── */
  var _hullPanels = [];
  /* each: { mesh, light, pos, breachStarted, breachTimer, breached,
             sealed, patchInteracting, patchTimer } */

  /* ── Patch kits ───────────────────────────────────────────────────────── */
  var _patchKits      = 3;

  /* ── Containment tanks (Lab A) ────────────────────────────────────────── */
  var _containmentTanks = [];

  /* ── Survivors (Lab D) ───────────────────────────────────────────────── */
  var _survivors = [];
  /* each: { mesh, pos, freed } */

  /* ── Environment meshes / lights ─────────────────────────────────────── */
  var _envMeshes  = [];
  var _envLights  = [];

  /* ── Glass dome windows ───────────────────────────────────────────────── */
  var _glassDomes = [];

  /* ── Oxygen bubbles (atmosphere VFX) ─────────────────────────────────── */
  var _bubbles = [];

  /* ── Toxic cloud (Lab B chem) ────────────────────────────────────────── */
  var _toxicClouds = [];
  /* each: { mesh, light, life } */

  /* ── Sonic pulse VFX ─────────────────────────────────────────────────── */
  var _sonicPulses = [];
  /* each: { mesh, life, speed } */

  /* ── HUD ──────────────────────────────────────────────────────────────── */
  var _hud       = null;
  var _overlayEl = null;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, opts) {
    var matOpts = { color: color };
    if (opts) {
      if (opts.emissive !== undefined)          matOpts.emissive          = opts.emissive;
      if (opts.emissiveIntensity !== undefined) matOpts.emissiveIntensity = opts.emissiveIntensity;
      if (opts.transparent !== undefined)       matOpts.transparent       = opts.transparent;
      if (opts.opacity !== undefined)           matOpts.opacity           = opts.opacity;
    }
    var mat  = new THREE.MeshLambertMaterial(matOpts);
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function dist3D(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function addEnv(mesh) {
    _scene.add(mesh);
    _envMeshes.push(mesh);
    return mesh;
  }

  function addLight(light) {
    _scene.add(light);
    _envLights.push(light);
    return light;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE SETUP
  ════════════════════════════════════════════════════════════════════════ */

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x000A1A);
    _scene.fog = new THREE.FogExp2(0x001028, 0.025);

    _camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 400);
    _camera.position.set(_playerPos.x, _playerPos.y + 1, _playerPos.z);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(w, h);
    _renderer.domElement.style.position = 'fixed';
    _renderer.domElement.style.top      = '0';
    _renderer.domElement.style.left     = '0';
    _renderer.domElement.style.zIndex   = '9000';
    document.body.appendChild(_renderer.domElement);

    /* Ambient underwater light */
    addLight(new THREE.AmbientLight(0x001133, 0.5));

    /* Primary blue-green deep water illumination */
    var oceanLight = new THREE.PointLight(0x002244, 2.0, 200);
    oceanLight.position.set(0, 20, 0);
    addLight(oceanLight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD ENVIRONMENT — OCEAN FLOOR + FACILITY
  ════════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    var geo, mesh, i, light;

    /* Ocean floor */
    geo  = new THREE.BoxGeometry(300, 1, 300);
    mesh = makeMesh(geo, 0x050D18);
    mesh.position.set(0, -1, 0);
    addEnv(mesh);

    /* Overhead ocean darkness panels (ceiling) */
    geo  = new THREE.BoxGeometry(300, 1, 300);
    mesh = makeMesh(geo, 0x000510);
    mesh.position.set(0, 30, 0);
    addEnv(mesh);

    /* Scattered debris/rocks on the ocean floor */
    var rockPositions = [
      {x: -80, z: -40}, {x: 60, z: -70}, {x: 90, z: 20},
      {x: -60, z: 80},  {x: 40, z: 90},  {x: -100, z: 10}
    ];
    for (i = 0; i < rockPositions.length; i++) {
      geo  = new THREE.BoxGeometry(
        3 + Math.random() * 5,
        1 + Math.random() * 3,
        3 + Math.random() * 5
      );
      mesh = makeMesh(geo, 0x0A1520);
      mesh.position.set(rockPositions[i].x, 0.5, rockPositions[i].z);
      addEnv(mesh);
    }

    /* Distant bioluminescent points to suggest ocean life */
    var bioColors = [0x004488, 0x002266, 0x003355];
    for (i = 0; i < 6; i++) {
      light = new THREE.PointLight(
        bioColors[i % bioColors.length],
        0.4, 30
      );
      light.position.set(
        -120 + i * 40,
        5 + (i % 3) * 3,
        -80 + (i % 4) * 30
      );
      addLight(light);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD ENTRY AIRLOCK
  ════════════════════════════════════════════════════════════════════════ */

  function buildAirlock() {
    var geo, mesh, light;

    /* Main airlock tube — CylinderGeometry r=3 h=10 */
    geo  = new THREE.CylinderGeometry(3, 3, 10, 12);
    mesh = makeMesh(geo, 0x334455);
    mesh.rotation.z = Math.PI / 2;    /* horizontal tube */
    mesh.position.set(0, 3, 60);
    addEnv(mesh);

    /* Pressure equalization light (dim amber while equalizing) */
    light = new THREE.PointLight(0xAA6600, 0.8, 10);
    light.position.set(0, 3, 60);
    addLight(light);
    _envLights.push(light);   /* tracked for flicker */

    /* Door frame outer */
    geo  = new THREE.BoxGeometry(7, 7, 0.5);
    mesh = makeMesh(geo, 0x223344);
    mesh.position.set(0, 3, 63.5);
    addEnv(mesh);

    /* Indicator panel */
    geo  = new THREE.BoxGeometry(1, 0.5, 0.3);
    mesh = makeMesh(geo, 0x44FF44, { emissive: 0x22AA22, emissiveIntensity: 0.6 });
    mesh.position.set(1.5, 5, 63.3);
    addEnv(mesh);

    /* Inner hatch */
    geo  = new THREE.BoxGeometry(5, 5, 0.3);
    mesh = makeMesh(geo, 0x334455);
    mesh.position.set(0, 3, 56);
    addEnv(mesh);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD CONNECTOR CORRIDORS
  ════════════════════════════════════════════════════════════════════════ */

  function buildCorridors() {
    var geo, mesh, light, i;

    /* Corridor definitions: from airlock toward main facility and between wings */
    var corridors = [
      /* Entry corridor: airlock → main hub */
      { x: 0,    y: 3, z: 45,  rotY: 0,      rx: 0,           len: 20 },
      /* North wing connector */
      { x: -20,  y: 3, z: 20,  rotY: Math.PI/2, rx: 0,        len: 20 },
      /* South wing connector */
      { x: 20,   y: 3, z: 20,  rotY: Math.PI/2, rx: 0,        len: 20 },
      /* Deep wing to server room */
      { x: 0,    y: 3, z: -20, rotY: 0,      rx: 0,           len: 20 }
    ];

    for (i = 0; i < corridors.length; i++) {
      var c = corridors[i];
      geo  = new THREE.CylinderGeometry(3, 3, c.len, 10);
      mesh = makeMesh(geo, 0x334444);
      /* Stand tube upright then rotate to lie along Z */
      mesh.rotation.x = Math.PI / 2;
      if (c.rotY) mesh.rotation.y = c.rotY;
      mesh.position.set(c.x, c.y, c.z);
      addEnv(mesh);

      /* Corridor lighting strip */
      light = new THREE.PointLight(0x001133, 0.6, 25);
      light.position.set(c.x, c.y, c.z);
      addLight(light);
    }

    /* GLASS dome windows — partial SphereGeometry on corridors */
    var domePositions = [
      { x: -5, y: 5, z: 45 },
      { x:  5, y: 5, z: 45 },
      { x: -5, y: 5, z: 30 },
      { x:  5, y: 5, z: 30 },
      { x: -20, y: 5, z: 20 },
      { x:  20, y: 5, z: 20 }
    ];
    for (i = 0; i < domePositions.length; i++) {
      /* Half-sphere glass dome facing ocean */
      geo  = new THREE.SphereGeometry(2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      mesh = makeMesh(geo, 0x88CCFF, {
        transparent: true,
        opacity: 0.25
      });
      mesh.position.set(domePositions[i].x, domePositions[i].y, domePositions[i].z);
      addEnv(mesh);
      _glassDomes.push(mesh);

      /* Faint ocean-view light through dome */
      light = new THREE.PointLight(0x112244, 0.3, 8);
      light.position.set(domePositions[i].x, domePositions[i].y + 1, domePositions[i].z);
      addLight(light);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD LABS
  ════════════════════════════════════════════════════════════════════════ */

  function buildLabs() {
    var geo, mesh, light, i, j, tank, rack, panel;

    /* ── Lab A: Virology — 20×5×15 at (-30, 3, 10) ── */
    geo  = new THREE.BoxGeometry(20, 5, 15);
    mesh = makeMesh(geo, 0x334455);
    mesh.position.set(-30, 3, 10);
    addEnv(mesh);

    /* Lab A lighting — green tinted */
    light = new THREE.PointLight(0x004422, 1.0, 25);
    light.position.set(-30, 6, 10);
    addLight(light);

    /* Containment tanks (CylinderGeometry 0x44AA44 liquid) x4 */
    var tankPositions = [{x:-35,z:6}, {x:-35,z:14}, {x:-25,z:6}, {x:-25,z:14}];
    for (i = 0; i < tankPositions.length; i++) {
      /* Tank outer shell */
      geo  = new THREE.CylinderGeometry(1.2, 1.2, 3.5, 8);
      tank = makeMesh(geo, 0x224422, { transparent: true, opacity: 0.7 });
      tank.position.set(tankPositions[i].x, 2.5, tankPositions[i].z);
      addEnv(tank);
      _containmentTanks.push(tank);

      /* Liquid inside (bright green) */
      geo  = new THREE.CylinderGeometry(0.9, 0.9, 3.0, 8);
      var liquid = makeMesh(geo, 0x44AA44, {
        emissive: 0x226611, emissiveIntensity: 0.5,
        transparent: true, opacity: 0.6
      });
      liquid.position.set(tankPositions[i].x, 2.5, tankPositions[i].z);
      addEnv(liquid);

      /* Glow per tank */
      light = new THREE.PointLight(0x44AA44, 0.5, 6);
      light.position.set(tankPositions[i].x, 3.5, tankPositions[i].z);
      addLight(light);
    }

    /* Lab A reactor core (CylinderGeometry 0x44FF44) */
    buildReactor(0, -30, 3, 3);

    /* ── Lab B: Chemistry — 18×5×14 at (30, 3, 10) ── */
    geo  = new THREE.BoxGeometry(18, 5, 14);
    mesh = makeMesh(geo, 0x334455);
    mesh.position.set(30, 3, 10);
    addEnv(mesh);

    light = new THREE.PointLight(0x224411, 0.9, 22);
    light.position.set(30, 6, 10);
    addLight(light);

    /* Chemical barrel hazards (BoxGeometry 0xAA6600) - shoot = toxic cloud */
    var barrelPos = [{x:25,z:6},{x:35,z:6},{x:25,z:14},{x:35,z:14},{x:30,z:17}];
    for (i = 0; i < barrelPos.length; i++) {
      geo  = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 6);
      var barrel = makeMesh(geo, 0xAA6600, { emissive: 0x441100, emissiveIntensity: 0.3 });
      barrel.position.set(barrelPos[i].x, 1, barrelPos[i].z);
      barrel.userData.isBarrel = true;
      barrel.userData.intact = true;
      addEnv(barrel);
    }

    /* Lab B reactor */
    buildReactor(1, 30, 3, 3);

    /* ── Lab C: Weapons — 20×5×18 at (0, 3, -20) ── */
    geo  = new THREE.BoxGeometry(20, 5, 18);
    mesh = makeMesh(geo, 0x334433);
    mesh.position.set(0, 3, -20);
    addEnv(mesh);

    light = new THREE.PointLight(0x221133, 0.9, 26);
    light.position.set(0, 6, -20);
    addLight(light);

    /* Prototype weapon racks (LineSegments) */
    for (j = 0; j < 3; j++) {
      var rackPts = [];
      var rx = -8 + j * 8;
      /* vertical posts */
      rackPts.push(rx, 0, -24,  rx, 3, -24);
      rackPts.push(rx + 2, 0, -24,  rx + 2, 3, -24);
      /* horizontal rail */
      rackPts.push(rx, 2.5, -24,  rx + 2, 2.5, -24);
      rackPts.push(rx, 1.5, -24,  rx + 2, 1.5, -24);
      /* weapon silhouettes */
      rackPts.push(rx + 0.5, 2.5, -24,  rx + 0.5, 1.5, -24);
      rackPts.push(rx + 1.0, 2.5, -24,  rx + 1.0, 1.5, -24);
      rackPts.push(rx + 1.5, 2.5, -24,  rx + 1.5, 1.5, -24);

      var rackGeo = new THREE.BufferGeometry();
      var rackArr = new Float32Array(rackPts);
      rackGeo.setAttribute('position', new THREE.BufferAttribute(rackArr, 3));
      rack = new THREE.LineSegments(
        rackGeo,
        new THREE.LineBasicMaterial({ color: 0x667777 })
      );
      _scene.add(rack);
      _envMeshes.push(rack);
    }

    /* Lab C reactor */
    buildReactor(2, 0, 3, -20);

    /* ── Lab D: Testing — 15×5×12 at (-30, 3, -20) ── */
    geo  = new THREE.BoxGeometry(15, 5, 12);
    mesh = makeMesh(geo, 0x334444);
    mesh.position.set(-30, 3, -20);
    addEnv(mesh);

    light = new THREE.PointLight(0x001122, 0.8, 20);
    light.position.set(-30, 6, -20);
    addLight(light);

    /* Test subjects / survivors (5) */
    var survPos = [
      {x:-34,z:-18}, {x:-32,z:-16}, {x:-28,z:-18},
      {x:-26,z:-22}, {x:-34,z:-22}
    ];
    for (i = 0; i < survPos.length; i++) {
      geo  = new THREE.BoxGeometry(0.6, 1.6, 0.4);
      var surv = makeMesh(geo, 0x886644);
      surv.position.set(survPos[i].x, 1, survPos[i].z);
      _scene.add(surv);
      _survivors.push({ mesh: surv, pos: survPos[i], freed: false });
    }

    /* Lab D reactor */
    buildReactor(3, -30, 3, -20);
  }

  /* ── Reactor core helper ─────────────────────────────────────────────── */
  function buildReactor(id, x, y, z) {
    var geo, mesh, light;

    /* Outer casing */
    geo  = new THREE.CylinderGeometry(1.0, 1.0, 2.5, 10);
    mesh = makeMesh(geo, 0x224422, { emissive: 0x113311, emissiveIntensity: 0.4 });
    mesh.position.set(x, y + 2, z + 4);
    _scene.add(mesh);

    /* Core glow cylinder */
    var coreMat = new THREE.MeshLambertMaterial({
      color: 0x44FF44,
      emissive: 0x22AA22,
      emissiveIntensity: 0.8
    });
    var coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.0, 10);
    var coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(x, y + 2, z + 4);
    _scene.add(coreMesh);

    /* Reactor light */
    light = new THREE.PointLight(0x44FF44, 1.5, 14);
    light.position.set(x, y + 3, z + 4);
    _scene.add(light);

    _labs.push({
      id: id,
      mesh: coreMesh,
      outerMesh: mesh,
      light: light,
      pos: { x: x, y: y + 2, z: z + 4 },
      destroyed: false,
      overloading: false,
      overloadTimer: 0,
      blastCountdown: 0,
      blastDone: false,
      interacting: false,
      holdTimer: 0
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD SERVER ROOM
  ════════════════════════════════════════════════════════════════════════ */

  function buildServerRoom() {
    var geo, mesh, light, i, j;

    /* Server room shell — 12×5×10 */
    geo  = new THREE.BoxGeometry(12, 5, 10);
    mesh = makeMesh(geo, 0x334455);
    mesh.position.set(0, 3, -45);
    addEnv(mesh);

    light = new THREE.PointLight(0x002244, 1.0, 18);
    light.position.set(0, 6, -45);
    addLight(light);

    /* Server racks (LineSegments) */
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 2; j++) {
        var pts = [];
        var sx = -4 + i * 4;
        var sz = -48 + j * 5;
        /* Rack frame */
        pts.push(sx, 0, sz,  sx, 4, sz);
        pts.push(sx + 2, 0, sz,  sx + 2, 4, sz);
        pts.push(sx, 4, sz,  sx + 2, 4, sz);
        pts.push(sx, 0, sz,  sx + 2, 0, sz);
        /* Server unit dividers */
        pts.push(sx, 1, sz,  sx + 2, 1, sz);
        pts.push(sx, 2, sz,  sx + 2, 2, sz);
        pts.push(sx, 3, sz,  sx + 2, 3, sz);
        /* Drive indicators */
        pts.push(sx + 0.3, 0.5, sz,  sx + 0.7, 0.5, sz);
        pts.push(sx + 1.0, 0.5, sz,  sx + 1.4, 0.5, sz);
        pts.push(sx + 0.3, 1.5, sz,  sx + 0.7, 1.5, sz);

        var sGeo = new THREE.BufferGeometry();
        var sArr = new Float32Array(pts);
        sGeo.setAttribute('position', new THREE.BufferAttribute(sArr, 3));
        var rack = new THREE.LineSegments(
          sGeo, new THREE.LineBasicMaterial({ color: 0x005588 })
        );
        _scene.add(rack);
        _envMeshes.push(rack);

        /* Activity light on rack */
        var rLight = new THREE.PointLight(0x0044CC, 0.3, 5);
        rLight.position.set(sx + 1, 2, sz);
        addLight(rLight);
      }
    }

    /* Director's terminal */
    geo  = new THREE.BoxGeometry(2, 1.5, 0.5);
    var termMesh = makeMesh(geo, 0x225566, {
      emissive: 0x003344, emissiveIntensity: 0.5
    });
    termMesh.position.set(0, 1.25, -42);
    _scene.add(termMesh);
    _envMeshes.push(termMesh);

    /* Terminal screen glow */
    light = new THREE.PointLight(0x00AAFF, 0.6, 5);
    light.position.set(0, 2.5, -42);
    addLight(light);

    _serverTerminal = {
      mesh: termMesh,
      pos: { x: 0, y: 1.25, z: -42 },
      interacting: false,
      holdTimer: 0
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD CONTROL ROOM
  ════════════════════════════════════════════════════════════════════════ */

  function buildControlRoom() {
    var geo, mesh, light, i;

    /* Control room shell — 15×5×15 */
    geo  = new THREE.BoxGeometry(15, 5, 15);
    mesh = makeMesh(geo, 0x334466);
    mesh.position.set(0, 3, -62);
    addEnv(mesh);

    light = new THREE.PointLight(0x002255, 1.0, 22);
    light.position.set(0, 6, -62);
    addLight(light);

    /* Panoramic GLASS ocean windows (front wall) */
    var winPositions = [-5, 0, 5];
    for (i = 0; i < winPositions.length; i++) {
      geo  = new THREE.BoxGeometry(3.5, 3, 0.1);
      mesh = makeMesh(geo, 0x88CCFF, {
        transparent: true, opacity: 0.2
      });
      mesh.position.set(winPositions[i], 4, -70);
      addEnv(mesh);
      _glassDomes.push(mesh);

      /* Ocean-light sheen through window */
      light = new THREE.PointLight(0x001133, 0.2, 10);
      light.position.set(winPositions[i], 4, -70);
      addLight(light);
    }

    /* Control consoles */
    for (i = 0; i < 3; i++) {
      geo  = new THREE.BoxGeometry(3, 1, 1.5);
      mesh = makeMesh(geo, 0x223355, { emissive: 0x001122, emissiveIntensity: 0.3 });
      mesh.position.set(-5 + i * 5, 0.5, -60);
      addEnv(mesh);
    }

    /* Self-destruct terminal */
    geo  = new THREE.BoxGeometry(1.5, 1.2, 0.4);
    var sdTerm = makeMesh(geo, 0xAA2200, { emissive: 0x550000, emissiveIntensity: 0.6 });
    sdTerm.position.set(-5, 1.2, -57);
    sdTerm.userData.isSelfDestructTerm = true;
    _scene.add(sdTerm);
    _envMeshes.push(sdTerm);

    light = new THREE.PointLight(0xFF2200, 0.5, 5);
    light.position.set(-5, 2, -57);
    addLight(light);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD HULL BREACH PANELS
  ════════════════════════════════════════════════════════════════════════ */

  function buildHullPanels() {
    var geo, mesh, i;

    /* Red-marked vulnerable hull sections */
    var panelDefs = [
      { x: -39, y: 3, z: 12 },   /* Lab A outer wall */
      { x:  39, y: 3, z: 12 },   /* Lab B outer wall */
      { x:   8, y: 3, z: -29 },  /* Lab C outer wall */
      { x: -39, y: 3, z: -22 },  /* Lab D outer wall */
      { x:   8, y: 3, z: 45 }    /* Corridor section */
    ];

    for (i = 0; i < panelDefs.length; i++) {
      var def = panelDefs[i];
      geo  = new THREE.BoxGeometry(2, 2, 0.2);
      mesh = makeMesh(geo, 0xFF2200, { emissive: 0x880000, emissiveIntensity: 0.5 });
      mesh.position.set(def.x, def.y, def.z);
      _scene.add(mesh);

      var pLight = new THREE.PointLight(0xFF2200, 0.6, 5);
      pLight.position.set(def.x, def.y + 1, def.z);
      _scene.add(pLight);

      _hullPanels.push({
        mesh: mesh,
        light: pLight,
        pos: { x: def.x, y: def.y, z: def.z },
        breachStarted: false,
        breachTimer: 10,
        breached: false,
        sealed: false,
        patchInteracting: false,
        patchTimer: 0
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD GUARDS
  ════════════════════════════════════════════════════════════════════════ */

  function buildGuards() {
    var i, geo, mesh, helmetMesh, guard;

    /* Guard placement across the facility */
    var guardDefs = [
      /* Entry + corridors — 4 guards */
      { x: 0,   z: 55, diver: false }, { x: -3, z: 50, diver: false },
      { x: 3,   z: 50, diver: false }, { x: 0,   z: 35, diver: false },
      /* Lab A — 4 guards */
      { x: -28, z: 8,  diver: false }, { x: -32, z: 8,  diver: false },
      { x: -28, z: 12, diver: false }, { x: -32, z: 12, diver: false },
      /* Lab B — 3 guards */
      { x: 28,  z: 8,  diver: false }, { x: 32,  z: 8,  diver: false },
      { x: 30,  z: 14, diver: false },
      /* Lab C — 6 guards */
      { x: -4,  z:-18, diver: false }, { x: 4,   z:-18, diver: false },
      { x: -4,  z:-22, diver: false }, { x: 4,   z:-22, diver: false },
      { x: -6,  z:-20, diver: false }, { x: 6,   z:-20, diver: false },
      /* Lab D — 4 guards */
      { x:-28,  z:-18, diver: false }, { x:-32,  z:-18, diver: false },
      { x:-28,  z:-22, diver: false }, { x:-32,  z:-22, diver: false },
      /* Server room — 1 guard */
      { x: 0,   z:-43, diver: false },
      /* Dive team — 4 guards patrolling outer hull */
      { x:-50,  z: 10, diver: true  }, { x: 50,  z: 10, diver: true  },
      { x: 0,   z:-80, diver: true  }, { x: 0,   z: 80, diver: true  }
    ];

    for (i = 0; i < guardDefs.length; i++) {
      var def = guardDefs[i];

      /* Body */
      geo  = new THREE.BoxGeometry(0.8, 1.6, 0.5);
      mesh = makeMesh(geo, 0x334444);
      mesh.position.set(def.x, 1, def.z);
      _scene.add(mesh);

      helmetMesh = null;
      if (def.diver) {
        /* Dive suit helmet — SphereGeometry */
        var hGeo = new THREE.SphereGeometry(0.55, 8, 8);
        helmetMesh = makeMesh(hGeo, 0x445566, {
          emissive: 0x112233, emissiveIntensity: 0.3
        });
        helmetMesh.position.set(def.x, 2.1, def.z);
        _scene.add(helmetMesh);
      }

      guard = {
        mesh: mesh,
        helmetMesh: helmetMesh,
        pos: { x: def.x, y: 1, z: def.z },
        hp: 90,
        alive: true,
        state: 'patrol',    /* patrol | alert | attack */
        fireTimer: 1.5 + Math.random(),
        alertTimer: 0,
        targetPos: { x: def.x, z: def.z },
        diver: def.diver,
        patrol: { x: def.x, z: def.z },
        patrolTimer: Math.random() * 4
      };
      _guards.push(guard);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD DIRECTOR
  ════════════════════════════════════════════════════════════════════════ */

  function buildDirector() {
    var geo, mesh;

    /* Body — lab coat (slightly taller) */
    geo  = new THREE.BoxGeometry(0.9, 1.8, 0.5);
    mesh = makeMesh(geo, 0x334433, { emissive: 0x112211, emissiveIntensity: 0.2 });
    mesh.position.set(0, 1.4, -65);
    _scene.add(mesh);

    /* Lab coat collar */
    var collarGeo = new THREE.BoxGeometry(0.9, 0.4, 0.55);
    var collar = makeMesh(collarGeo, 0xDDDDDD);
    collar.position.set(0, 2.0, -65);
    _scene.add(collar);
    _envMeshes.push(collar);

    /* Sonic weapon — ConeGeometry */
    var weapGeo = new THREE.ConeGeometry(0.15, 0.8, 6);
    var weapMesh = makeMesh(weapGeo, 0x445533, {
      emissive: 0x224422, emissiveIntensity: 0.4
    });
    weapMesh.rotation.z = -Math.PI / 2;
    weapMesh.position.set(0.7, 1.4, -65);
    _scene.add(weapMesh);

    _director = {
      mesh: mesh,
      weaponMesh: weapMesh,
      pos: { x: 0, y: 1.4, z: -65 },
      hp: 400,
      alive: true,
      state: 'idle',       /* idle | combat | override */
      sonicTimer: 3,
      sonicCooldown: 3,
      overrideArmed: false,
      overrideTimer: 0,
      overrideDuration: 8, /* 8s after cornered */
      sonicPulses: []
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD ATMOSPHERE (bubbles)
  ════════════════════════════════════════════════════════════════════════ */

  function buildBubbles() {
    var i, geo, mesh;
    for (i = 0; i < 40; i++) {
      geo  = new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 4, 4);
      mesh = makeMesh(geo, 0x88CCFF, { transparent: true, opacity: 0.4 });
      mesh.position.set(
        -60 + Math.random() * 120,
        Math.random() * 20,
        -80 + Math.random() * 160
      );
      mesh.userData.riseSpeed = 0.5 + Math.random() * 1.5;
      mesh.userData.originY   = mesh.position.y;
      _scene.add(mesh);
      _bubbles.push(mesh);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD PLAYER MESH
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var geo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
    _playerMesh = makeMesh(geo, 0x224433);
    _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(_playerMesh);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'dsb-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,10,30,0.82)',
      'color:#44DDFF',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #004466',
      'border-radius:3px',
      'z-index:9100',
      'pointer-events:none',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'dsb-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:0','left:0',
      'width:100%','height:100%',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0)',
      'color:#44DDFF',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'z-index:9200',
      'pointer-events:none',
      'text-align:center',
      'transition:background 0.5s'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function updateHUD() {
    if (!_hud) return;
    var mm = Math.floor(_missionTimer / 60);
    var ss = Math.floor(_missionTimer % 60);
    var timerStr = (mm < 10 ? '0' + mm : mm) + ':' + (ss < 10 ? '0' + ss : ss);
    var hullStatus = 'STABLE';
    var i;
    for (i = 0; i < _hullPanels.length; i++) {
      if (_hullPanels[i].breached) { hullStatus = 'BREACH!'; break; }
      if (_hullPanels[i].breachStarted) { hullStatus = 'BREACHING'; break; }
    }
    var patchStr = _patchKits > 0 ? ' [PATCHES:' + _patchKits + ']' : ' [NO PATCHES]';
    var alarmStr = _alarmActive ? ' [!ALARM!]' : '';
    _hud.textContent =
      'DEEP SEA BASE' +
      '  [LABS:' + _labsDestroyed + '/4 DESTROYED]' +
      '  [SERVER:' + (_serverWiped ? 'WIPED' : 'INTACT') + ']' +
      '  [DIRECTOR:' + (_directorDead ? 'ELIMINATED' : 'ACTIVE') + ']' +
      '  [TIMER:' + timerStr + ']' +
      '  [HULL:' + hullStatus + ']' +
      '  [HP:' + Math.max(0, Math.floor(_playerHP)) + ']' +
      patchStr + alarmStr;
  }

  function showOverlay(msg, color) {
    if (!_overlayEl) return;
    _overlayEl.style.background = 'rgba(0,0,0,0.75)';
    _overlayEl.style.color = color || '#44DDFF';
    _overlayEl.innerHTML = msg;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    /* Activation check: D + S within 400ms */
    if (!_active) {
      var now = Date.now();
      if (k === 'D' || k === 'S') {
        _activationTimes[k] = now;
        var other = (k === 'D') ? 'S' : 'D';
        if (_activationTimes[other] && (now - _activationTimes[other]) < ACTIVATION_WINDOW) {
          init();
          return;
        }
      }
    }

    if (!_active) return;

    if (k === 'E' && !_ePressed) {
      _ePressed = true;
      _eHeldTimer = 0;
    }
    if (e.code === 'Space') _shooting = true;
  }

  function onKeyUp(e) {
    var k = e.key.toUpperCase();
    _keys[k] = false;
    if (k === 'E') { _ePressed = false; _eHeldTimer = 0; _eTarget = null; }
    if (e.code === 'Space') _shooting = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    if (_mouseLocked) {
      _yaw   -= e.movementX * 0.002;
      _pitch -= e.movementY * 0.002;
      _pitch = Math.max(-0.8, Math.min(0.8, _pitch));
    } else {
      _mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    }
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _shooting = true;
    if (!_mouseLocked && _renderer) {
      _renderer.domElement.requestPointerLock && _renderer.domElement.requestPointerLock();
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) _shooting = false;
  }

  function onPointerLockChange() {
    _mouseLocked = (document.pointerLockElement === (_renderer && _renderer.domElement));
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  function unbindKeys() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup',   onMouseUp);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    if (_mouseLocked) document.exitPointerLock && document.exitPointerLock();
    _mouseLocked = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (_gameOver || _stunTimer > 0) {
      _stunTimer -= dt;
      return;
    }

    var speed = _playerSpeed * dt;
    var sin = Math.sin(_yaw);
    var cos = Math.cos(_yaw);

    if (_keys['W'] || _keys['ARROWUP'])    { _playerPos.x -= sin * speed; _playerPos.z -= cos * speed; }
    if (_keys['S'] || _keys['ARROWDOWN'])  { _playerPos.x += sin * speed; _playerPos.z += cos * speed; }
    if (_keys['A'] || _keys['ARROWLEFT'])  { _playerPos.x -= cos * speed; _playerPos.z += sin * speed; }
    if (_keys['D'] || _keys['ARROWRIGHT']) { _playerPos.x += cos * speed; _playerPos.z -= sin * speed; }

    /* Simple boundary */
    _playerPos.x = Math.max(-80, Math.min(80, _playerPos.x));
    _playerPos.z = Math.max(-90, Math.min(80, _playerPos.z));

    /* Camera follows player */
    _camera.position.set(_playerPos.x, _playerPos.y + 1.6, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    /* Player mesh (behind camera) */
    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _playerMesh.rotation.y = _yaw;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function updateShooting(dt) {
    if (_gameOver) return;

    _shootCooldown -= dt;
    if (_shooting && _shootCooldown <= 0) {
      _shootCooldown = 0.12;
      spawnPlayerShot();
    }

    var i, shot;
    /* Move player shots */
    for (i = _playerShots.length - 1; i >= 0; i--) {
      shot = _playerShots[i];
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.y += shot.vel.y * dt;
      shot.mesh.position.z += shot.vel.z * dt;
      shot.life -= dt;

      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _playerShots.splice(i, 1);
        continue;
      }

      /* Check hits on guards */
      checkShotHitsGuards(shot, i);
      /* Check hits on director */
      checkShotHitsDirector(shot, i);
      /* Check hits on hull panels */
      checkShotHitsHull(shot, i);
      /* Check hits on lab reactors (when overloading — visible damage) */
    }

    /* Move guard shots */
    for (i = _guardShots.length - 1; i >= 0; i--) {
      shot = _guardShots[i];
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.y += shot.vel.y * dt;
      shot.mesh.position.z += shot.vel.z * dt;
      shot.life -= dt;
      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _guardShots.splice(i, 1);
        continue;
      }
      /* Check hit on player */
      var dx = shot.mesh.position.x - _playerPos.x;
      var dy = shot.mesh.position.y - (_playerPos.y + 1);
      var dz = shot.mesh.position.z - _playerPos.z;
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 1.0) {
        _playerHP -= 12;
        _scene.remove(shot.mesh);
        _guardShots.splice(i, 1);
        if (_playerHP <= 0) playerDeath();
      }
    }
  }

  function spawnPlayerShot() {
    var geo = new THREE.SphereGeometry(0.07, 4, 4);
    var mat = new THREE.MeshLambertMaterial({
      color: 0xFFFF44,
      emissive: 0xAAAA00,
      emissiveIntensity: 0.8
    });
    var mesh = new THREE.Mesh(geo, mat);

    var sin = Math.sin(_yaw);
    var cos = Math.cos(_yaw);
    var sinP = Math.sin(_pitch);

    mesh.position.set(
      _playerPos.x - sin * 0.3,
      _playerPos.y + 1.5,
      _playerPos.z - cos * 0.3
    );
    _scene.add(mesh);

    var speed = 40;
    _playerShots.push({
      mesh: mesh,
      vel: {
        x: -sin * speed,
        y:  sinP * speed * (-1),
        z: -cos * speed
      },
      life: 2.0
    });
  }

  function spawnGuardShot(guard) {
    var dx = _playerPos.x - guard.pos.x;
    var dz = _playerPos.z - guard.pos.z;
    var len = Math.sqrt(dx*dx + dz*dz);
    if (len < 0.01) return;
    dx /= len; dz /= len;

    var geo = new THREE.SphereGeometry(0.06, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0x882200, emissiveIntensity: 0.6 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(guard.pos.x + dx, guard.pos.y + 1, guard.pos.z + dz);
    _scene.add(mesh);

    var speed = 22;
    _guardShots.push({
      mesh: mesh,
      vel: { x: dx * speed, y: 0, z: dz * speed },
      life: 2.5
    });
  }

  function checkShotHitsGuards(shot, shotIdx) {
    var j, guard;
    for (j = _guards.length - 1; j >= 0; j--) {
      guard = _guards[j];
      if (!guard.alive) continue;
      var dx = shot.mesh.position.x - guard.pos.x;
      var dy = shot.mesh.position.y - (guard.pos.y + 0.8);
      var dz = shot.mesh.position.z - guard.pos.z;
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 0.9) {
        guard.hp -= 35;
        if (guard.hp <= 0) killGuard(guard);
        else {
          guard.state = 'alert';
          guard.alertTimer = 3;
          if (!_alarmActive) triggerAlarm();
        }
        _scene.remove(shot.mesh);
        _playerShots.splice(shotIdx, 1);
        return;
      }
    }
  }

  function checkShotHitsDirector(shot, shotIdx) {
    if (!_director || !_director.alive) return;
    var dx = shot.mesh.position.x - _director.pos.x;
    var dy = shot.mesh.position.y - (_director.pos.y + 0.9);
    var dz = shot.mesh.position.z - _director.pos.z;
    if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 1.1) {
      _director.hp -= 25;
      if (!_alarmActive) triggerAlarm();
      _director.state = 'combat';
      if (_director.hp <= 0) killDirector();
      _scene.remove(shot.mesh);
      _playerShots.splice(shotIdx, 1);

      /* Director cornered effect — starts override if low HP and combat */
      if (_director.hp < 100 && _director.alive && !_director.overrideArmed) {
        _director.overrideArmed = true;
        _director.overrideTimer = _director.overrideDuration;
      }
    }
  }

  function checkShotHitsHull(shot, shotIdx) {
    var j, panel;
    for (j = 0; j < _hullPanels.length; j++) {
      panel = _hullPanels[j];
      if (panel.breached || panel.sealed) continue;
      var dx = shot.mesh.position.x - panel.pos.x;
      var dz = shot.mesh.position.z - panel.pos.z;
      if (Math.sqrt(dx*dx + dz*dz) < 1.2) {
        if (!panel.breachStarted) {
          panel.breachStarted = true;
          panel.breachTimer   = 10;
          panel.mesh.material.color.setHex(0xFF4400);
        }
        _scene.remove(shot.mesh);
        _playerShots.splice(shotIdx, 1);
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUARD AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateGuards(dt) {
    var i, guard, distToPlayer, dx, dz;

    for (i = 0; i < _guards.length; i++) {
      guard = _guards[i];
      if (!guard.alive) continue;

      dx = _playerPos.x - guard.pos.x;
      dz = _playerPos.z - guard.pos.z;
      distToPlayer = Math.sqrt(dx*dx + dz*dz);

      /* Detection */
      if (distToPlayer < 20 && guard.state === 'patrol') {
        guard.state = 'alert';
        guard.alertTimer = 2;
        if (!_alarmActive) triggerAlarm();
      }

      /* Alert → attack */
      if (guard.state === 'alert') {
        guard.alertTimer -= dt;
        if (guard.alertTimer <= 0) guard.state = 'attack';
      }

      if (guard.state === 'attack') {
        /* Move toward player */
        if (distToPlayer > 5) {
          var spd = 2.5 * dt;
          var nx = dx / distToPlayer;
          var nz = dz / distToPlayer;
          guard.pos.x += nx * spd;
          guard.pos.z += nz * spd;
        }
        /* Fire */
        guard.fireTimer -= dt;
        if (guard.fireTimer <= 0 && distToPlayer < 25) {
          guard.fireTimer = 1.2 + Math.random() * 0.8;
          spawnGuardShot(guard);
        }
      } else {
        /* Patrol */
        guard.patrolTimer -= dt;
        if (guard.patrolTimer <= 0) {
          guard.patrolTimer = 3 + Math.random() * 3;
          guard.targetPos = {
            x: guard.patrol.x + (-5 + Math.random() * 10),
            z: guard.patrol.z + (-5 + Math.random() * 10)
          };
        }
        var pdx = guard.targetPos.x - guard.pos.x;
        var pdz = guard.targetPos.z - guard.pos.z;
        var plen = Math.sqrt(pdx*pdx + pdz*pdz);
        if (plen > 0.5) {
          var ps = 1.5 * dt;
          guard.pos.x += (pdx / plen) * ps;
          guard.pos.z += (pdz / plen) * ps;
        }
      }

      /* Update mesh */
      guard.mesh.position.set(guard.pos.x, guard.pos.y, guard.pos.z);
      if (guard.helmetMesh) {
        guard.helmetMesh.position.set(guard.pos.x, guard.pos.y + 1.1, guard.pos.z);
      }
    }
  }

  function killGuard(guard) {
    guard.alive = false;
    guard.hp = 0;
    guard.mesh.visible = false;
    if (guard.helmetMesh) guard.helmetMesh.visible = false;
  }

  function triggerAlarm() {
    if (_alarmActive) return;
    _alarmActive = true;
    _alarmTimer  = 90;   /* reinforcements in 90s */
  }

  function spawnReinforcements() {
    var i, geo, mesh, guard;
    var spawnPoints = [
      {x: 0, z: 65}, {x: -10, z: 65}, {x: 10, z: 65},
      {x: -15, z: 58}, {x: 15, z: 58},
      {x: -5, z: 70},  {x: 5, z: 70},
      {x: -20, z: 62}, {x: 20, z: 62},
      {x: 0,  z: 72}
    ];

    for (i = 0; i < spawnPoints.length; i++) {
      geo  = new THREE.BoxGeometry(0.8, 1.6, 0.5);
      mesh = makeMesh(geo, 0x334444);
      mesh.position.set(spawnPoints[i].x, 1, spawnPoints[i].z);
      _scene.add(mesh);

      guard = {
        mesh: mesh,
        helmetMesh: null,
        pos: { x: spawnPoints[i].x, y: 1, z: spawnPoints[i].z },
        hp: 90,
        alive: true,
        state: 'attack',
        fireTimer: 1.0 + Math.random(),
        alertTimer: 0,
        targetPos: { x: spawnPoints[i].x, z: spawnPoints[i].z },
        diver: false,
        patrol: { x: spawnPoints[i].x, z: spawnPoints[i].z },
        patrolTimer: 0
      };
      _guards.push(guard);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DIRECTOR AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateDirector(dt) {
    if (!_director || !_director.alive || _gameOver) return;

    var dx = _playerPos.x - _director.pos.x;
    var dz = _playerPos.z - _director.pos.z;
    var dist = Math.sqrt(dx*dx + dz*dz);

    /* Detect player */
    if (dist < 30 && _director.state === 'idle') {
      _director.state = 'combat';
      if (!_alarmActive) triggerAlarm();
    }

    if (_director.state === 'combat') {
      /* Move toward player, maintain distance 8-15 */
      if (dist > 15) {
        var spd = 2.0 * dt;
        _director.pos.x += (dx / dist) * spd;
        _director.pos.z += (dz / dist) * spd;
      } else if (dist < 8) {
        /* Back away */
        _director.pos.x -= (dx / dist) * 1.5 * dt;
        _director.pos.z -= (dz / dist) * 1.5 * dt;
      }

      /* Sonic weapon fire */
      _director.sonicTimer -= dt;
      if (_director.sonicTimer <= 0 && dist < 20) {
        _director.sonicTimer = _director.sonicCooldown;
        spawnSonicPulse();
      }

      /* Self-destruct override if cornered */
      if (_director.overrideArmed) {
        _director.overrideTimer -= dt;
        if (_director.overrideTimer <= 0) {
          /* Override triggers — game over unless player already used terminal */
          if (!_serverWiped) {
            _gameOver = true;
            showOverlay(
              'DIRECTOR ACTIVATED SELF-DESTRUCT OVERRIDE<br>' +
              'BIOWEAPON DATA UPLOADING TO REMOTE SERVER...<br>' +
              'MISSION FAILED',
              '#FF4400'
            );
          }
        }
      }
    }

    /* Update mesh */
    _director.mesh.position.set(_director.pos.x, _director.pos.y, _director.pos.z);
    if (_director.weaponMesh) {
      _director.weaponMesh.position.set(
        _director.pos.x + 0.7,
        _director.pos.y,
        _director.pos.z
      );
    }
  }

  function spawnSonicPulse() {
    /* ConeGeometry pulse expanding outward */
    var geo = new THREE.ConeGeometry(0.3, 1.5, 6);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x88FF88,
      emissive: 0x44AA44,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.6
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(_director.pos.x, _director.pos.y + 1, _director.pos.z);
    _scene.add(mesh);

    var dx = _playerPos.x - _director.pos.x;
    var dz = _playerPos.z - _director.pos.z;
    var len = Math.sqrt(dx*dx + dz*dz) || 1;

    _sonicPulses.push({
      mesh: mesh,
      vel: { x: (dx/len) * 12, z: (dz/len) * 12 },
      life: 1.5
    });
  }

  function updateSonicPulses(dt) {
    var i, pulse, dx, dz;
    for (i = _sonicPulses.length - 1; i >= 0; i--) {
      pulse = _sonicPulses[i];
      pulse.mesh.position.x += pulse.vel.x * dt;
      pulse.mesh.position.z += pulse.vel.z * dt;
      pulse.life -= dt;
      pulse.mesh.material.opacity = Math.max(0, pulse.life / 1.5 * 0.6);

      /* Scale up as it travels */
      var sc = 1 + (1.5 - pulse.life) * 2;
      pulse.mesh.scale.set(sc, sc * 0.5, sc);

      if (pulse.life <= 0) {
        _scene.remove(pulse.mesh);
        _sonicPulses.splice(i, 1);
        continue;
      }

      /* Hit player */
      dx = pulse.mesh.position.x - _playerPos.x;
      dz = pulse.mesh.position.z - _playerPos.z;
      if (Math.sqrt(dx*dx + dz*dz) < 1.5) {
        _playerHP -= 8;
        _stunTimer = 2.0;
        _scene.remove(pulse.mesh);
        _sonicPulses.splice(i, 1);
        if (_playerHP <= 0) playerDeath();
      }
    }
  }

  function killDirector() {
    _director.alive = false;
    _director.hp = 0;
    _director.mesh.visible = false;
    if (_director.weaponMesh) _director.weaponMesh.visible = false;
    _directorDead = true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTION (E KEY)
  ════════════════════════════════════════════════════════════════════════ */

  function updateInteraction(dt) {
    if (!_ePressed || _gameOver) return;

    var i, lab, panel, distP;

    /* ── Lab reactor hold (5s to overload) ── */
    for (i = 0; i < _labs.length; i++) {
      lab = _labs[i];
      if (lab.destroyed || lab.overloading) continue;
      distP = dist3D(_playerPos, lab.pos);
      if (distP < 4) {
        if (_eTarget === null) _eTarget = 'lab_' + i;
        if (_eTarget === 'lab_' + i) {
          _eHeldTimer += dt;
          if (_eHeldTimer >= 5.0) {
            _eHeldTimer = 0;
            _eTarget    = null;
            lab.overloading   = true;
            lab.overloadTimer = 0;
            lab.blastCountdown = 30;
            /* Change reactor color to red warning */
            lab.mesh.material.color.setHex(0xFF4400);
            lab.mesh.material.emissive.setHex(0xAA2200);
            lab.light.color.setHex(0xFF4400);
          }
        }
        return;
      }
    }

    /* ── Server terminal hold (depends on all 4 labs destroyed) ── */
    if (_serverTerminal && !_serverWiped) {
      distP = dist3D(_playerPos, _serverTerminal.pos);
      if (distP < 3) {
        if (!_serverLocked) {
          if (_eTarget === null) _eTarget = 'server';
          if (_eTarget === 'server') {
            _eHeldTimer += dt;
            if (_eHeldTimer >= 6.0) {
              _eHeldTimer  = 0;
              _eTarget     = null;
              _serverWiped = true;
              _serverTerminal.mesh.material.color.setHex(0xFF2200);
              _serverTerminal.mesh.material.emissiveIntensity = 0;
            }
          }
        }
        return;
      }
    }

    /* ── Hull breach panel — patch kit (E hold 3s) ── */
    for (i = 0; i < _hullPanels.length; i++) {
      panel = _hullPanels[i];
      if (!panel.breachStarted || panel.sealed || _patchKits <= 0) continue;
      distP = dist3D(_playerPos, panel.pos);
      if (distP < 3) {
        if (_eTarget === null) _eTarget = 'patch_' + i;
        if (_eTarget === 'patch_' + i) {
          _eHeldTimer += dt;
          if (_eHeldTimer >= 3.0) {
            _eHeldTimer = 0;
            _eTarget    = null;
            panel.sealed       = true;
            panel.breachStarted = false;
            panel.breached      = false;
            panel.mesh.material.color.setHex(0x224422);
            panel.light.color.setHex(0x224422);
            panel.light.intensity = 0.2;
            _patchKits--;
          }
        }
        return;
      }
    }

    /* ── Director's self-destruct terminal (cancel override) ── */
    if (_director && _director.overrideArmed && _director.alive) {
      var termPos = { x: -5, y: 1.2, z: -57 };
      distP = dist3D(_playerPos, termPos);
      if (distP < 3) {
        if (_eTarget === null) _eTarget = 'sdterm';
        if (_eTarget === 'sdterm') {
          _eHeldTimer += dt;
          if (_eHeldTimer >= 4.0) {
            _eHeldTimer = 0;
            _eTarget    = null;
            _director.overrideArmed = false;
            _director.overrideTimer = 0;
          }
        }
        return;
      }
    }

    /* ── Airlock escape (requires all objectives met) ── */
    var airlockPos = { x: 0, y: 3, z: 62 };
    distP = dist3D(_playerPos, airlockPos);
    if (distP < 5) {
      if (_labsDestroyed >= 4 && _serverWiped && _directorDead) {
        if (_eTarget === null) _eTarget = 'escape';
        if (_eTarget === 'escape') {
          _eHeldTimer += dt;
          if (_eHeldTimer >= 5.0) {
            /* Pressure equalization complete — victory */
            _victory  = true;
            _gameOver = true;
            showOverlay(
              'MISSION COMPLETE<br>' +
              'ALL BIOWEAPON LABS DESTROYED<br>' +
              'SERVER DATA WIPED<br>' +
              'DIRECTOR ELIMINATED<br>' +
              'FACILITY DETONATING IN 30s...<br>' +
              'MINI-SUB EXTRACTION SUCCESSFUL',
              '#44FFAA'
            );
          }
        }
      }
      return;
    }

    /* No valid target — reset */
    if (_eTarget !== null) {
      _eTarget = null;
      _eHeldTimer = 0;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAB REACTOR OVERLOAD + BLAST
  ════════════════════════════════════════════════════════════════════════ */

  function updateLabReactors(dt) {
    var i, lab;

    for (i = 0; i < _labs.length; i++) {
      lab = _labs[i];
      if (lab.destroyed || !lab.overloading) continue;

      lab.overloadTimer += dt;
      lab.blastCountdown -= dt;

      /* Flicker the reactor light */
      lab.light.intensity = 1.5 + Math.sin(lab.overloadTimer * 20) * 0.8;

      /* Countdown */
      if (lab.blastCountdown <= 0 && !lab.blastDone) {
        lab.blastDone = true;

        /* Explosion VFX — bright flash point light */
        var blastLight = new THREE.PointLight(0xFF6600, 8, 30);
        blastLight.position.set(lab.pos.x, lab.pos.y + 2, lab.pos.z);
        _scene.add(blastLight);

        /* Damage player if nearby */
        var distToBlast = dist3D(_playerPos, lab.pos);
        if (distToBlast < 12) {
          var dmg = Math.max(0, 80 - distToBlast * 5);
          _playerHP -= dmg;
          if (_playerHP <= 0) playerDeath();
        }

        /* Hide reactor mesh */
        lab.mesh.visible        = false;
        lab.outerMesh.visible   = false;
        lab.light.visible       = false;
        lab.destroyed           = true;
        lab.overloading         = false;
        _labsDestroyed++;

        /* Fade blast light */
        (function(bl) {
          var fadeTimer = 0;
          var fadeId = setInterval(function() {
            fadeTimer += 0.05;
            bl.intensity = Math.max(0, 8 - fadeTimer * 16);
            if (bl.intensity <= 0) {
              _scene.remove(bl);
              clearInterval(fadeId);
            }
          }, 50);
        })(blastLight);

        /* Unlock server if all 4 labs done */
        if (_labsDestroyed >= 4) {
          _serverLocked = false;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HULL BREACH SIMULATION
  ════════════════════════════════════════════════════════════════════════ */

  function updateHullPanels(dt) {
    var i, panel;
    for (i = 0; i < _hullPanels.length; i++) {
      panel = _hullPanels[i];
      if (!panel.breachStarted || panel.sealed) continue;

      panel.breachTimer -= dt;

      /* Flicker panel light as breach worsens */
      panel.light.intensity = 0.4 + Math.sin(Date.now() * 0.01) * 0.4;

      if (panel.breachTimer <= 0 && !panel.breached) {
        panel.breached = true;
        panel.light.color.setHex(0x224466);
        /* Water ingress — ongoing HP drain */
      }

      if (panel.breached) {
        _playerHP -= 10 * dt;
        if (_playerHP <= 0) {
          _gameOver = true;
          showOverlay(
            'HULL BREACH FATAL<br>' +
            'DROWNED 2KM BELOW THE PACIFIC<br>' +
            'MISSION FAILED',
            '#FF4400'
          );
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUBBLES VFX
  ════════════════════════════════════════════════════════════════════════ */

  function updateBubbles(dt) {
    var i, b;
    for (i = 0; i < _bubbles.length; i++) {
      b = _bubbles[i];
      b.position.y += b.userData.riseSpeed * dt;
      if (b.position.y > 25) {
        b.position.y = b.userData.originY;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION TIMER
  ════════════════════════════════════════════════════════════════════════ */

  function updateMissionTimer(dt) {
    if (_gameOver) return;
    _missionTimer -= dt;
    if (_missionTimer <= 0) {
      _missionTimer = 0;
      _gameOver     = true;
      showOverlay(
        'TIME EXPIRED<br>' +
        'FACILITY SELF-DESTRUCT ACTIVATED<br>' +
        'BIOWEAPON DATA TRANSMITTED TO SYNDICATE<br>' +
        'MISSION FAILED',
        '#FF4400'
      );
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ALARM / REINFORCEMENTS
  ════════════════════════════════════════════════════════════════════════ */

  function updateAlarm(dt) {
    if (!_alarmActive || _reinforcementsSpawned) return;
    _alarmTimer -= dt;
    if (_alarmTimer <= 0) {
      _reinforcementsSpawned = true;
      spawnReinforcements();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function checkWin() {
    if (_escaped && !_gameOver) {
      _gameOver = true;
      _victory  = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER DEATH
  ════════════════════════════════════════════════════════════════════════ */

  function playerDeath() {
    if (_gameOver) return;
    _gameOver = true;
    _playerHP = 0;
    showOverlay(
      'OPERATOR DOWN<br>' +
      'BIOWEAPON PROGRAM CONTINUES<br>' +
      'MISSION FAILED',
      '#FF4400'
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER LOOP
  ════════════════════════════════════════════════════════════════════════ */

  function animate(timestamp) {
    if (!_active) return;
    _animId = requestAnimationFrame(animate);

    var dt = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime = timestamp;

    if (dt > 0) {
      update(dt);
    }

    _renderer.render(_scene, _camera);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC: update (called from loop or externally)
  ════════════════════════════════════════════════════════════════════════ */

  function update(dt) {
    if (!_active) return;

    updateMissionTimer(dt);
    updatePlayer(dt);
    updateShooting(dt);
    updateGuards(dt);
    updateDirector(dt);
    updateSonicPulses(dt);
    updateLabReactors(dt);
    updateHullPanels(dt);
    updateBubbles(dt);
    updateInteraction(dt);
    updateAlarm(dt);
    updateHUD();
    checkWin();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC: init
  ════════════════════════════════════════════════════════════════════════ */

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (_active) return;
    _active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[DeepSeaBase] THREE.js not loaded');
      return;
    }

    /* Reset state */
    _gameOver              = false;
    _victory               = false;
    _missionTimer          = 600;
    _labsDestroyed         = 0;
    _serverWiped           = false;
    _serverLocked          = true;
    _directorDead          = false;
    _escaped               = false;
    _alarmActive           = false;
    _alarmTimer            = 0;
    _reinforcementsSpawned = false;
    _patchKits             = 3;
    _playerHP              = 100;
    _playerPos             = { x: 0, y: 1.5, z: 60 };
    _yaw                   = 0;
    _pitch                 = 0;
    _stunTimer             = 0;
    _shootCooldown         = 0;
    _ePressed              = false;
    _eHeldTimer            = 0;
    _eTarget               = null;
    _shooting              = false;
    _mouseLocked           = false;
    _guards                = [];
    _playerShots           = [];
    _guardShots            = [];
    _sonicPulses           = [];
    _toxicClouds           = [];
    _bubbles               = [];
    _hullPanels            = [];
    _labs                  = [];
    _survivors             = [];
    _containmentTanks      = [];
    _glassDomes            = [];
    _envMeshes             = [];
    _envLights             = [];
    _serverTerminal        = null;
    _director              = null;
    _playerMesh            = null;
    _lastTime              = 0;

    setupScene();
    buildEnvironment();
    buildAirlock();
    buildCorridors();
    buildLabs();
    buildServerRoom();
    buildControlRoom();
    buildHullPanels();
    buildGuards();
    buildDirector();
    buildBubbles();
    buildPlayer();
    buildHUD();
    bindKeys();

    _lastTime = performance.now();
    animate(_lastTime);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC: reset
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    if (!_active) return;
    _active = false;

    if (_animId) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }

    if (_renderer) {
      if (_renderer.domElement && _renderer.domElement.parentNode) {
        _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      }
      _renderer.dispose();
      _renderer = null;
    }

    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }

    if (_overlayEl && _overlayEl.parentNode) {
      _overlayEl.parentNode.removeChild(_overlayEl);
      _overlayEl = null;
    }

    unbindKeys();

    _scene    = null;
    _camera   = null;
    _guards   = [];
    _playerShots = [];
    _guardShots  = [];
    _sonicPulses = [];
    _bubbles  = [];
    _labs     = [];
    _hullPanels = [];
    _survivors = [];
    _envMeshes = [];
    _envLights = [];
    _director  = null;
    _playerMesh = null;
    _serverTerminal = null;

    _active       = false;
    _gameOver     = false;
    _victory      = false;
    _alarmActive  = false;
    _reinforcementsSpawned = false;
  }

  /* ── Expose activation key binding at module load ─────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (_active) return;
    var k   = e.key.toUpperCase();
    var now = Date.now();
    if (k === 'D' || k === 'S') {
      _activationTimes[k] = now;
      var other = (k === 'D') ? 'S' : 'D';
      if (_activationTimes[other] && (now - _activationTimes[other]) < ACTIVATION_WINDOW) {
        init();
      }
    }
  });

  return { init: init, update: update, reset: reset };

}());
