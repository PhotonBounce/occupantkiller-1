// mining-disaster.js — MiningDisaster module
// Activation: M+D simultaneous keypress (both within 400ms)
// Rules: var only, no let/const, IIFE window.MiningDisaster

(function (window) {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW = 400;
  var MINE_INTEGRITY_INITIAL = 100;
  var CAVE_IN_INTERVAL = 60000;
  var CAVE_IN_DAMAGE = 10;
  var CRUSH_DAMAGE = 80;
  var GAS_DAMAGE_PER_SEC = 5;
  var DRILL_CLEAR_TIME = 5000;
  var PUMP_ACTIVATE_TIME = 10000;
  var WATER_DRAIN_TIME = 15000;
  var DEFUSE_TIME = 8000;
  var ESCORT_KEY = 'e';
  var MINER_ESCORT_DISTANCE = 2.5;
  var CART_CAPACITY = 3;
  var CART_PUSH_SPEED = 0.15;
  var COLLAPSE_COUNTDOWN = 30;
  var CHARGE_COUNT = 3;
  var DRILL_FUEL_INITIAL = 100;
  var OXYGEN_MIN = 120;
  var OXYGEN_MAX = 300;

  var MINER_NAMES = [
    'Alice', 'Bob', 'Carlos', 'Diana',
    'Evan', 'Fiona', 'George', 'Hana'
  ];

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    animFrameId: null,

    // Player
    playerPos: null,
    playerHP: 100,
    hasGasMask: false,

    // Mine
    integrity: MINE_INTEGRITY_INITIAL,
    collapseCountdown: -1,
    collapseActive: false,
    escapeShaftOpen: false,

    // Drill
    drillFuel: DRILL_FUEL_INITIAL,
    drillingBlock: null,
    drillTimer: 0,

    // Miners
    miners: [],
    rescued: 0,

    // Hazards
    rubbleBlocks: [],
    gasPockets: [],
    floodedActive: true,
    pumpActivating: false,
    pumpTimer: 0,
    waterDraining: false,
    waterDrainTimer: 0,
    waterMesh: null,
    pumpMesh: null,

    // Mine cart
    cart: null,
    cartPos: null,
    cartMiners: [],
    playerInCart: false,

    // Saboteur & charges
    saboteurMesh: null,
    charges: [],
    defusingCharge: null,
    defuseTimer: 0,
    chargesDefused: 0,
    explosionTriggered: false,

    // Support beams
    supportBeams: [],

    // Timers & intervals
    caveInIntervalId: null,
    lastTime: 0,

    // Keyboard
    keys: {},
    mKeyTime: 0,
    dKeyTime: 0,

    // HUD
    hudEl: null,

    // Three objects refs
    elevatorMesh: null,
    elevatorCableMesh: null,
    elevatorY: -30,
    elevatorTargetY: -30,

    gasMaskPickup: null,
    gasMaskTaken: false
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function randBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function vec3(x, y, z) {
    return new window.THREE.Vector3(x, y, z);
  }

  function makeMesh(geo, color, pos, castShadow) {
    var mat = new window.THREE.MeshLambertMaterial({ color: color });
    var mesh = new window.THREE.Mesh(geo, mat);
    if (pos) { mesh.position.copy(pos); }
    if (castShadow) { mesh.castShadow = true; mesh.receiveShadow = true; }
    return mesh;
  }

  // ─── Activation Key Handling ───────────────────────────────────────────────

  function onKeyDown(evt) {
    var key = evt.key ? evt.key.toLowerCase() : '';
    state.keys[key] = true;

    if (!state.active) {
      var now = Date.now();
      if (key === 'm') { state.mKeyTime = now; }
      if (key === 'd') { state.dKeyTime = now; }
      if (state.mKeyTime > 0 && state.dKeyTime > 0 &&
          Math.abs(state.mKeyTime - state.dKeyTime) <= ACTIVATION_WINDOW) {
        activate();
      }
      return;
    }
  }

  function onKeyUp(evt) {
    var key = evt.key ? evt.key.toLowerCase() : '';
    state.keys[key] = false;
  }

  // ─── Setup / Teardown ─────────────────────────────────────────────────────

  function activate() {
    if (state.active) { return; }
    state.active = true;
    state.mKeyTime = 0;
    state.dKeyTime = 0;

    setupScene();
    setupHUD();
    startCaveInTimer();
    state.clock = new window.THREE.Clock();
    loop();
  }

  function deactivate() {
    if (!state.active) { return; }
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.caveInIntervalId) {
      clearInterval(state.caveInIntervalId);
      state.caveInIntervalId = null;
    }

    // Remove renderer
    if (state.renderer && state.renderer.domElement && state.renderer.domElement.parentNode) {
      state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
    }
    if (state.renderer) { state.renderer.dispose(); }

    // Remove HUD
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
    }

    // Reset state fields
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.clock = null;
    state.miners = [];
    state.rubbleBlocks = [];
    state.gasPockets = [];
    state.charges = [];
    state.supportBeams = [];
    state.cartMiners = [];
    state.rescued = 0;
    state.integrity = MINE_INTEGRITY_INITIAL;
    state.drillFuel = DRILL_FUEL_INITIAL;
    state.hasGasMask = false;
    state.playerHP = 100;
    state.collapseActive = false;
    state.collapseCountdown = -1;
    state.escapeShaftOpen = false;
    state.chargesDefused = 0;
    state.explosionTriggered = false;
    state.floodedActive = true;
    state.pumpActivating = false;
    state.waterDraining = false;
    state.gasMaskTaken = false;
    state.playerInCart = false;
    state.drillingBlock = null;
    state.defusingCharge = null;
  }

  // ─── Scene Setup ──────────────────────────────────────────────────────────

  function setupScene() {
    var THREE = window.THREE;
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x111111);
    state.scene.fog = new THREE.Fog(0x111111, 20, 80);

    // Camera (first-person style, follows player)
    state.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    state.playerPos = vec3(0, 1.5, 5);
    state.camera.position.copy(state.playerPos);

    // Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    document.body.appendChild(state.renderer.domElement);
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';

    // Ambient light
    var ambient = new THREE.AmbientLight(0x332211, 0.6);
    state.scene.add(ambient);

    // Torch-like point lights along shaft
    buildMineGeometry();
    buildMiners();
    buildCart();
    buildSaboteur();
  }

  function buildMineGeometry() {
    var THREE = window.THREE;
    var scene = state.scene;

    // Main shaft: vertical cylinder descending
    var shaftGeo = new THREE.CylinderGeometry(2, 2, 30, 16);
    var shaftMesh = makeMesh(shaftGeo, 0x554433, vec3(0, -15, 0));
    shaftMesh.receiveShadow = true;
    scene.add(shaftMesh);

    // Shaft interior light
    var shaftLight = new THREE.PointLight(0xFFAA44, 1.5, 40);
    shaftLight.position.set(0, -5, 0);
    scene.add(shaftLight);

    // Support beams every 4 units along shaft
    var beamY;
    for (beamY = -2; beamY >= -28; beamY -= 4) {
      addSupportBeam(0, beamY, 0, 4, 0.3, 0.3, 0x885533);
    }

    // Elevator cable (LineSegments)
    var cablePoints = [vec3(0, 2, 0), vec3(0, -30, 0)];
    var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    state.elevatorCableMesh = new THREE.Line(cableGeo, cableMat);
    scene.add(state.elevatorCableMesh);

    // Elevator cage
    var cageGeo = new THREE.BoxGeometry(2, 3, 2);
    state.elevatorMesh = makeMesh(cageGeo, 0x665544, vec3(0, -30, 0));
    state.elevatorY = -30;
    state.elevatorTargetY = -30;
    scene.add(state.elevatorMesh);

    // Horizontal tunnels at depths -10, -20, -30, -40
    var tunnelDepths = [-10, -20, -30, -40];
    var tunnelDirs = [
      vec3(1, 0, 0),
      vec3(-1, 0, 0),
      vec3(0, 0, 1),
      vec3(0, 0, -1)
    ];
    var i, depth, dir, cx, cz;
    for (i = 0; i < tunnelDepths.length; i++) {
      depth = tunnelDepths[i];
      dir = tunnelDirs[i];
      cx = dir.x * 11.5;
      cz = dir.z * 11.5;
      var tunnelGeo = new THREE.BoxGeometry(
        dir.x !== 0 ? 20 : 3,
        3,
        dir.z !== 0 ? 20 : 3
      );
      var tunnelMesh = makeMesh(tunnelGeo, 0x443322, vec3(cx, depth, cz));
      tunnelMesh.receiveShadow = true;
      scene.add(tunnelMesh);

      // Tunnel light
      var tLight = new THREE.PointLight(0xFFAA44, 1, 25);
      tLight.position.set(cx, depth + 1, cz);
      scene.add(tLight);

      // Support beams in tunnel
      var bStep;
      for (bStep = 0; bStep <= 18; bStep += 4) {
        var bx = dir.x !== 0 ? dir.x * (bStep + 1.5) : 0;
        var bz = dir.z !== 0 ? dir.z * (bStep + 1.5) : 0;
        addSupportBeam(bx, depth + 1, bz, 0.3, 2, 0.3, 0x885533);
      }
    }

    // Rubble blocks (collapsed sections)
    addRubble(8, -10, 0);
    addRubble(-15, -20, 0);
    addRubble(0, -30, 8);

    // Gas pockets
    addGasPocket(18, -10, 0);
    addGasPocket(-20, -20, 0);

    // Flooded section at depth -30 (branch toward positive Z)
    var waterGeo = new THREE.PlaneGeometry(20, 5);
    state.waterMesh = makeMesh(waterGeo, 0x113355, vec3(0, -31, 10));
    state.waterMesh.rotation.x = -Math.PI / 2;
    state.waterMesh.material.transparent = true;
    state.waterMesh.material.opacity = 0.75;
    scene.add(state.waterMesh);

    // Pump
    var pumpGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
    state.pumpMesh = makeMesh(pumpGeo, 0x334455, vec3(2, -30.25, 4));
    scene.add(state.pumpMesh);

    // Gas mask pickup
    var gasMaskGeo = new THREE.BoxGeometry(0.5, 0.4, 0.6);
    state.gasMaskPickup = makeMesh(gasMaskGeo, 0x44AA44, vec3(15, -9.5, 0));
    scene.add(state.gasMaskPickup);

    // Floor near surface
    var floorGeo = new THREE.PlaneGeometry(20, 20);
    var floorMesh = makeMesh(floorGeo, 0x332211, vec3(0, 0, 0));
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
  }

  function addSupportBeam(x, y, z, w, h, d, color) {
    var THREE = window.THREE;
    var geo = new THREE.BoxGeometry(w || 4, h || 0.3, d || 0.3);
    var mesh = makeMesh(geo, color || 0x885533, vec3(x, y, z));
    mesh.castShadow = true;
    state.scene.add(mesh);
    state.supportBeams.push(mesh);
    return mesh;
  }

  function addRubble(x, y, z) {
    var THREE = window.THREE;
    var geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var mesh = makeMesh(geo, 0x554433, vec3(x, y, z));
    mesh.castShadow = true;
    state.scene.add(mesh);
    state.rubbleBlocks.push({ mesh: mesh, pos: vec3(x, y, z) });
  }

  function addGasPocket(x, y, z) {
    var light = new window.THREE.PointLight(0x44FF22, 0.8, 6);
    light.position.set(x, y, z);
    state.scene.add(light);
    state.gasPockets.push({ light: light, pos: vec3(x, y, z), pulseT: 0 });
  }

  // ─── Miners ───────────────────────────────────────────────────────────────

  function buildMiners() {
    var THREE = window.THREE;
    var tunnelPositions = [
      vec3(18, -10, 0),
      vec3(20, -10, 0),
      vec3(-18, -20, 0),
      vec3(-20, -20, 0),
      vec3(0, -30, 18),
      vec3(0, -30, 20),
      vec3(0, -40, -18),
      vec3(0, -40, -20)
    ];

    var i;
    for (i = 0; i < 8; i++) {
      var geo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
      var mesh = makeMesh(geo, 0xFFDDCC, tunnelPositions[i], true);
      state.scene.add(mesh);
      state.miners.push({
        mesh: mesh,
        name: MINER_NAMES[i],
        oxygen: Math.round(randBetween(OXYGEN_MIN, OXYGEN_MAX)),
        oxygenMax: Math.round(randBetween(OXYGEN_MIN, OXYGEN_MAX)),
        following: false,
        rescued: false,
        inCart: false,
        index: i
      });
    }
  }

  // ─── Mine Cart ────────────────────────────────────────────────────────────

  function buildCart() {
    var THREE = window.THREE;

    // Tracks as LineSegments
    var trackPoints = [
      vec3(-1, -0.5, 0), vec3(1, -0.5, 0),
      vec3(-1, -0.5, 20), vec3(1, -0.5, 20)
    ];
    var trackGeo = new THREE.BufferGeometry().setFromPoints(trackPoints);
    var trackMat = new THREE.LineBasicMaterial({ color: 0x555555 });
    var trackLines = new THREE.LineSegments(trackGeo, trackMat);
    trackLines.position.set(0, -10, -5);
    state.scene.add(trackLines);

    // Cart body
    var cartGeo = new THREE.BoxGeometry(2, 1, 1.5);
    state.cart = makeMesh(cartGeo, 0x885533, vec3(0, -9.5, 0));
    state.cartPos = vec3(0, -9.5, 0);
    state.scene.add(state.cart);
  }

  // ─── Saboteur & Charges ───────────────────────────────────────────────────

  function buildSaboteur() {
    var THREE = window.THREE;

    // Saboteur in deepest tunnel (-40 depth)
    var sabGeo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
    state.saboteurMesh = makeMesh(sabGeo, 0x222233, vec3(0, -39, -22));
    state.scene.add(state.saboteurMesh);

    // 3 explosive charges
    var chargePositions = [
      vec3(0, -39.5, -15),
      vec3(0, -39.5, -18),
      vec3(0, -39.5, -21)
    ];
    var i;
    for (i = 0; i < CHARGE_COUNT; i++) {
      var chargeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
      var chargeMesh = makeMesh(chargeGeo, 0xFF2200, chargePositions[i]);
      // Pulsing light
      var chargeLight = new THREE.PointLight(0xFF2200, 0.6, 4);
      chargeLight.position.copy(chargePositions[i]);
      state.scene.add(chargeLight);
      state.scene.add(chargeMesh);
      state.charges.push({
        mesh: chargeMesh,
        light: chargeLight,
        pos: chargePositions[i],
        defused: false,
        pulseT: 0
      });
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function setupHUD() {
    var div = document.createElement('div');
    div.id = 'mining-disaster-hud';
    div.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'background:rgba(0,0,0,0.7)',
      'color:#FFDD88',
      'font:bold 13px monospace',
      'padding:6px 12px',
      'z-index:9999',
      'white-space:pre-wrap',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(div);
    state.hudEl = div;
    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) { return; }

    var criticalMiners = [];
    var i, miner;
    for (i = 0; i < state.miners.length; i++) {
      miner = state.miners[i];
      if (!miner.rescued && miner.oxygen < 60) {
        criticalMiners.push(miner.name + '(' + Math.round(miner.oxygen) + 's)');
      }
    }

    var mineralList = '';
    for (i = 0; i < state.miners.length; i++) {
      miner = state.miners[i];
      if (!miner.rescued) {
        mineralList += miner.name + ':' + Math.round(miner.oxygen) + 's ';
      }
    }

    var critStr = criticalMiners.length > 0 ? ' | CRITICAL: ' + criticalMiners.join(', ') : '';
    var collapseStr = state.collapseActive ? ' | COLLAPSE IN: ' + Math.ceil(state.collapseCountdown) + 's' : '';
    var escapeStr = state.escapeShaftOpen ? ' | ESCAPE SHAFT OPEN' : '';

    state.hudEl.textContent = [
      'MINE [MINERS RESCUED: ' + state.rescued + '/8]',
      '[INTEGRITY: ' + Math.round(state.integrity) + '%]',
      '[DRILL FUEL: ' + Math.round(state.drillFuel) + '%]',
      '[GAS MASK: ' + (state.hasGasMask ? 'YES' : 'NO') + ']',
      critStr,
      collapseStr,
      escapeStr,
      mineralList ? '\nOxygen: ' + mineralList : ''
    ].join(' ');
  }

  // ─── Cave-In Events ────────────────────────────────────────────────────────

  function startCaveInTimer() {
    state.caveInIntervalId = setInterval(function () {
      if (!state.active) { return; }
      triggerCaveIn();
    }, CAVE_IN_INTERVAL);
  }

  function triggerCaveIn() {
    var THREE = window.THREE;
    // Random tunnel branch
    var tunnelDepths = [-10, -20, -30, -40];
    var tunnelDirs = [
      vec3(1, 0, 0),
      vec3(-1, 0, 0),
      vec3(0, 0, 1),
      vec3(0, 0, -1)
    ];
    var idx = Math.floor(Math.random() * 4);
    var depth = tunnelDepths[idx];
    var dir = tunnelDirs[idx];
    var bx = dir.x * (5 + Math.random() * 10);
    var bz = dir.z * (5 + Math.random() * 10);
    var pos = vec3(bx, depth + 1, bz);

    var geo = new THREE.BoxGeometry(2.5, 1.5, 2.5);
    var mesh = makeMesh(geo, 0x554433, pos);
    state.scene.add(mesh);
    state.rubbleBlocks.push({ mesh: mesh, pos: pos });

    state.integrity -= CAVE_IN_DAMAGE;
    state.integrity = clamp(state.integrity, 0, 100);

    // Check crush: if player is very close
    if (state.playerPos && pos.distanceTo(state.playerPos) < 2) {
      state.playerHP -= CRUSH_DAMAGE;
      state.playerHP = clamp(state.playerHP, 0, 100);
    }

    // Check integrity thresholds
    checkIntegrity();
    updateHUD();
  }

  function checkIntegrity() {
    // At 50%: beams glow red
    var i;
    if (state.integrity <= 50) {
      for (i = 0; i < state.supportBeams.length; i++) {
        state.supportBeams[i].material.color.setHex(0xFF2200);
        state.supportBeams[i].material.emissive.setHex(0x441100);
      }
    }
    // At 0%: total collapse
    if (state.integrity <= 0 && !state.collapseActive) {
      startCollapse();
    }
  }

  function startCollapse() {
    state.collapseActive = true;
    state.collapseCountdown = COLLAPSE_COUNTDOWN;
    openEscapeShaft();
  }

  function openEscapeShaft() {
    state.escapeShaftOpen = true;
    var THREE = window.THREE;
    var geo = new THREE.BoxGeometry(2, 3, 2);
    var mesh = makeMesh(geo, 0x00FF44, vec3(5, 2, 5));
    state.scene.add(mesh);
    // Bright light to mark it
    var light = new THREE.PointLight(0x00FF44, 2, 10);
    light.position.set(5, 2, 5);
    state.scene.add(light);
  }

  // ─── Flooded Section ──────────────────────────────────────────────────────

  function startPump() {
    state.pumpActivating = true;
    state.pumpTimer = 0;
  }

  function updatePump(dt) {
    if (!state.pumpActivating) { return; }
    state.pumpTimer += dt * 1000;
    if (state.pumpTimer >= PUMP_ACTIVATE_TIME) {
      state.pumpActivating = false;
      state.waterDraining = true;
      state.waterDrainTimer = 0;
    }
  }

  function updateWater(dt) {
    if (!state.waterDraining) { return; }
    state.waterDrainTimer += dt * 1000;
    var pct = clamp(state.waterDrainTimer / WATER_DRAIN_TIME, 0, 1);
    if (state.waterMesh) {
      state.waterMesh.material.opacity = 0.75 * (1 - pct);
      state.waterMesh.scale.y = 1 - pct;
    }
    if (pct >= 1) {
      state.floodedActive = false;
      state.waterDraining = false;
      if (state.waterMesh) {
        state.scene.remove(state.waterMesh);
        state.waterMesh = null;
      }
    }
  }

  // ─── Drilling ─────────────────────────────────────────────────────────────

  function tryDrill(dt) {
    if (!state.keys[ESCORT_KEY]) { state.drillingBlock = null; state.drillTimer = 0; return; }
    if (state.drillFuel <= 0) { return; }

    var closest = null;
    var closestDist = 3;
    var i, rb, d;
    for (i = 0; i < state.rubbleBlocks.length; i++) {
      rb = state.rubbleBlocks[i];
      d = rb.pos.distanceTo(state.playerPos);
      if (d < closestDist) {
        closestDist = d;
        closest = rb;
      }
    }

    if (!closest) { state.drillingBlock = null; state.drillTimer = 0; return; }

    if (state.drillingBlock !== closest) {
      state.drillingBlock = closest;
      state.drillTimer = 0;
    }

    state.drillTimer += dt * 1000;
    state.drillFuel -= (dt / (DRILL_CLEAR_TIME / 1000)) * (100 / 10); // fuel use per clear
    state.drillFuel = clamp(state.drillFuel, 0, 100);

    if (state.drillTimer >= DRILL_CLEAR_TIME) {
      state.scene.remove(closest.mesh);
      state.rubbleBlocks.splice(state.rubbleBlocks.indexOf(closest), 1);
      state.drillingBlock = null;
      state.drillTimer = 0;
    }
  }

  // ─── Defusing ─────────────────────────────────────────────────────────────

  function tryDefuse(dt) {
    if (!state.keys[ESCORT_KEY]) { state.defusingCharge = null; state.defuseTimer = 0; return; }

    var closest = null;
    var closestDist = 3;
    var i, ch, d;
    for (i = 0; i < state.charges.length; i++) {
      ch = state.charges[i];
      if (ch.defused) { continue; }
      d = ch.pos.distanceTo(state.playerPos);
      if (d < closestDist) {
        closestDist = d;
        closest = ch;
      }
    }

    if (!closest) {
      if (state.defusingCharge) { state.defusingCharge = null; state.defuseTimer = 0; }
      return;
    }

    if (state.defusingCharge !== closest) {
      state.defusingCharge = closest;
      state.defuseTimer = 0;
    }

    state.defuseTimer += dt * 1000;
    if (state.defuseTimer >= DEFUSE_TIME) {
      closest.defused = true;
      state.scene.remove(closest.mesh);
      state.scene.remove(closest.light);
      state.chargesDefused++;
      state.defusingCharge = null;
      state.defuseTimer = 0;
    }
  }

  // ─── Escort / Miner Touch ─────────────────────────────────────────────────

  function updateMiners(dt) {
    var i, miner, d;
    for (i = 0; i < state.miners.length; i++) {
      miner = state.miners[i];
      if (miner.rescued || miner.inCart) { continue; }

      // Oxygen countdown
      miner.oxygen -= dt;
      if (miner.oxygen < 0) { miner.oxygen = 0; }

      // Touch detection
      d = miner.mesh.position.distanceTo(state.playerPos);
      if (d < MINER_ESCORT_DISTANCE && !miner.following) {
        miner.following = true;
      }

      // Follow player
      if (miner.following) {
        var dir = state.playerPos.clone().sub(miner.mesh.position);
        if (dir.length() > 1.5) {
          dir.normalize().multiplyScalar(2 * dt);
          miner.mesh.position.add(dir);
        }
      }

      // Check if miner reached elevator
      var elevPos = state.elevatorMesh ? state.elevatorMesh.position : vec3(0, -30, 0);
      if (miner.following && miner.mesh.position.distanceTo(elevPos) < 2.5) {
        miner.rescued = true;
        miner.following = false;
        state.scene.remove(miner.mesh);
        state.rescued++;
      }
    }
  }

  // ─── Gas Pocket Damage ────────────────────────────────────────────────────

  function updateGasPockets(dt) {
    var i, gp, d;
    for (i = 0; i < state.gasPockets.length; i++) {
      gp = state.gasPockets[i];
      gp.pulseT += dt * 2;
      gp.light.intensity = 0.4 + 0.4 * Math.sin(gp.pulseT);

      if (!state.hasGasMask) {
        d = gp.pos.distanceTo(state.playerPos);
        if (d < 4) {
          state.playerHP -= GAS_DAMAGE_PER_SEC * dt;
          state.playerHP = clamp(state.playerHP, 0, 100);
        }
      }
    }
  }

  // ─── Charge Pulsing ──────────────────────────────────────────────────────

  function updateCharges(dt) {
    var i, ch;
    for (i = 0; i < state.charges.length; i++) {
      ch = state.charges[i];
      if (ch.defused) { continue; }
      ch.pulseT += dt * 3;
      ch.light.intensity = 0.3 + 0.5 * Math.abs(Math.sin(ch.pulseT));
    }
  }

  // ─── Mine Cart Logic ──────────────────────────────────────────────────────

  function updateCart(dt) {
    if (!state.cart) { return; }

    // Check if player is near cart
    var distToCart = state.cartPos.distanceTo(state.playerPos);
    if (distToCart < 2 && !state.playerInCart) {
      state.playerInCart = true;
    }
    if (distToCart > 3 && state.playerInCart) {
      state.playerInCart = false;
    }

    // Push cart with W key
    if (state.playerInCart && state.keys['w']) {
      state.cartPos.z -= CART_PUSH_SPEED;
      state.cart.position.copy(state.cartPos);
    }

    // Load nearby following miners into cart (up to capacity)
    var i, miner;
    for (i = 0; i < state.miners.length; i++) {
      miner = state.miners[i];
      if (miner.rescued || miner.inCart || !miner.following) { continue; }
      if (state.cartMiners.length >= CART_CAPACITY) { continue; }
      if (miner.mesh.position.distanceTo(state.cartPos) < 2) {
        miner.inCart = true;
        state.cartMiners.push(miner);
        miner.mesh.position.copy(state.cartPos);
        miner.mesh.position.y += 1;
      }
    }

    // Move cart miners with cart
    for (i = 0; i < state.cartMiners.length; i++) {
      state.cartMiners[i].mesh.position.copy(state.cartPos);
      state.cartMiners[i].mesh.position.y += 1;
    }

    // Check if cart reached elevator
    var elevPos = state.elevatorMesh ? state.elevatorMesh.position : vec3(0, -30, 0);
    if (state.cartPos.distanceTo(elevPos) < 3 && state.cartMiners.length > 0) {
      for (i = 0; i < state.cartMiners.length; i++) {
        state.cartMiners[i].rescued = true;
        state.cartMiners[i].inCart = false;
        state.scene.remove(state.cartMiners[i].mesh);
        state.rescued++;
      }
      state.cartMiners = [];
    }
  }

  // ─── Player Movement ──────────────────────────────────────────────────────

  function updatePlayer(dt) {
    var speed = 5 * dt;
    var moved = false;

    if (state.keys['w'] && !state.playerInCart) {
      state.playerPos.z -= speed;
      moved = true;
    }
    if (state.keys['s']) {
      state.playerPos.z += speed;
      moved = true;
    }
    if (state.keys['a']) {
      state.playerPos.x -= speed;
      moved = true;
    }
    if (state.keys['d']) {
      state.playerPos.x += speed;
      moved = true;
    }
    if (state.keys['q']) {
      state.playerPos.y -= speed;
      moved = true;
    }
    if (state.keys['z']) {
      state.playerPos.y += speed;
      moved = true;
    }

    // Gas mask pickup
    if (state.gasMaskPickup && !state.gasMaskTaken) {
      if (state.gasMaskPickup.position.distanceTo(state.playerPos) < 1.5) {
        state.hasGasMask = true;
        state.gasMaskTaken = true;
        state.scene.remove(state.gasMaskPickup);
        state.gasMaskPickup = null;
      }
    }

    // Pump interaction
    if (state.floodedActive && state.pumpMesh && !state.pumpActivating && !state.waterDraining) {
      if (state.keys[ESCORT_KEY] && state.pumpMesh.position.distanceTo(state.playerPos) < 2.5) {
        startPump();
      }
    }

    state.camera.position.copy(state.playerPos);
    state.camera.position.y += 0.5;
  }

  // ─── Collapse Countdown ───────────────────────────────────────────────────

  function updateCollapse(dt) {
    if (!state.collapseActive) { return; }
    state.collapseCountdown -= dt;
    if (state.collapseCountdown <= 0) {
      state.collapseCountdown = 0;
      // Trigger explosion if charges not defused
      if (state.chargesDefused < CHARGE_COUNT) {
        state.explosionTriggered = true;
      }
      state.collapseActive = false;
    }
  }

  // ─── Explosion Check ──────────────────────────────────────────────────────

  function checkExplosion() {
    if (state.explosionTriggered) {
      // Force collapse - add lots of rubble
      var THREE = window.THREE;
      var i;
      for (i = 0; i < 10; i++) {
        var rx = randBetween(-15, 15);
        var ry = randBetween(-40, -10);
        var rz = randBetween(-15, 15);
        var geo = new THREE.BoxGeometry(2, 2, 2);
        var mesh = makeMesh(geo, 0x554433, vec3(rx, ry, rz));
        state.scene.add(mesh);
      }
      state.integrity = 0;
      state.explosionTriggered = false;
    }
  }

  // ─── Camera Look ──────────────────────────────────────────────────────────

  function setupMouseLook() {
    state.renderer.domElement.addEventListener('click', function () {
      state.renderer.domElement.requestPointerLock();
    });
    document.addEventListener('mousemove', function (evt) {
      if (!state.active) { return; }
      if (document.pointerLockElement !== state.renderer.domElement) { return; }
      state.camera.rotation.y -= evt.movementX * 0.002;
      state.camera.rotation.x -= evt.movementY * 0.002;
      state.camera.rotation.x = clamp(state.camera.rotation.x, -Math.PI / 2, Math.PI / 2);
    });
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────

  function loop() {
    if (!state.active) { return; }
    state.animFrameId = requestAnimationFrame(loop);

    var dt = state.clock.getDelta();
    dt = clamp(dt, 0, 0.1);

    updatePlayer(dt);
    updateMiners(dt);
    updateGasPockets(dt);
    updateCharges(dt);
    updateCart(dt);
    updatePump(dt);
    updateWater(dt);
    updateCollapse(dt);
    checkExplosion();
    tryDrill(dt);
    tryDefuse(dt);

    // Elevator animation: slowly return to surface
    if (state.rescued > 0 && state.elevatorY < -1) {
      state.elevatorY += 2 * dt;
      if (state.elevatorMesh) {
        state.elevatorMesh.position.y = state.elevatorY;
      }
    }

    updateHUD();

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Window Resize ────────────────────────────────────────────────────────

  function onResize() {
    if (!state.active) { return; }
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  window.MiningDisaster = (function () {
    // Attach global listeners once
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);

    return {
      activate: activate,
      deactivate: deactivate,
      getState: function () { return state; }
    };
  }());

}(window));
