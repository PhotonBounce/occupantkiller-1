window.UnderwaterRuins = (function () {
  'use strict';

  var MODULE_NAME = 'UnderwaterRuins';
  var ACTIVATION_KEY_U = 85;
  var ACTIVATION_KEY_R = 82;
  var ACTIVATION_WINDOW = 400;

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    hudEl: null,
    animFrameId: null,
    lastTime: 0,

    // Player
    playerPos: { x: 0, y: -2, z: 0 },
    playerHP: 100,
    playerVel: { x: 0, y: 0, z: 0 },
    playerStunTimer: 0,
    playerBlindTimer: 0,
    hasDiveSuit: false,
    movementLocked: false,
    moveLockTimer: 0,

    // Oxygen
    o2: 180,           // 3 minutes in seconds
    o2Max: 180,
    o2Draining: false, // true when out of o2 → HP drain

    // Artifacts
    artifactsCollected: 0,
    artifactsTotal: 5,
    missionComplete: false,

    // Vault
    leversTotal: 3,
    leversPulled: 0,
    vaultOpen: false,

    // Key timing
    uKeyTime: 0,
    rKeyTime: 0,
    uKeyDown: false,
    rKeyDown: false,
    eKeyDown: false,
    qPressCount: 0,
    qPressTimer: 0,

    // Scene objects
    objects: [],
    kelp: [],
    buildings: [],
    columns: [],
    o2Pickups: [],
    airPockets: [],
    artifacts: [],
    levers: [],
    currentZones: [],
    diveSuitMesh: null,
    vaultDoor: null,
    vaultArtifactCache: null,

    // Creatures
    sharks: [],
    eels: [],
    squid: null,
    squidTentacles: [],
    squidGrabbing: false,
    squidGrabTimer: 0,
    squidInkMesh: null,
    squidInkTimer: 0,

    // Caustic shimmer
    causticLight: null,
    causticTimer: 0,

    // Harpoons
    harpoons: [],

    // Keys held
    keysDown: {}
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ─── Init / Destroy ───────────────────────────────────────────────────────
  function init() {
    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE.js not found');
      return;
    }

    resetState();
    setupScene();
    buildEnvironment();
    buildBuildings();
    buildColumns();
    buildKelp();
    buildO2Pickups();
    buildAirPockets();
    buildArtifacts();
    buildLevers();
    buildVault();
    buildDiveSuit();
    buildCurrentZones();
    buildSharks();
    buildEels();
    buildSquid();
    buildHUD();
    bindKeys();
    state.lastTime = performance.now();
    state.animFrameId = requestAnimationFrame(animate);
  }

  function resetState() {
    state.playerPos = { x: 0, y: -2, z: 0 };
    state.playerHP = 100;
    state.playerVel = { x: 0, y: 0, z: 0 };
    state.playerStunTimer = 0;
    state.playerBlindTimer = 0;
    state.hasDiveSuit = false;
    state.movementLocked = false;
    state.moveLockTimer = 0;
    state.o2 = 180;
    state.o2Max = 180;
    state.o2Draining = false;
    state.artifactsCollected = 0;
    state.missionComplete = false;
    state.leversTotal = 3;
    state.leversPulled = 0;
    state.vaultOpen = false;
    state.uKeyTime = 0;
    state.rKeyTime = 0;
    state.uKeyDown = false;
    state.rKeyDown = false;
    state.eKeyDown = false;
    state.qPressCount = 0;
    state.qPressTimer = 0;
    state.objects = [];
    state.kelp = [];
    state.buildings = [];
    state.columns = [];
    state.o2Pickups = [];
    state.airPockets = [];
    state.artifacts = [];
    state.levers = [];
    state.currentZones = [];
    state.diveSuitMesh = null;
    state.vaultDoor = null;
    state.vaultArtifactCache = null;
    state.sharks = [];
    state.eels = [];
    state.squid = null;
    state.squidTentacles = [];
    state.squidGrabbing = false;
    state.squidGrabTimer = 0;
    state.squidInkMesh = null;
    state.squidInkTimer = 0;
    state.causticLight = null;
    state.causticTimer = 0;
    state.harpoons = [];
    state.keysDown = {};
  }

  function destroy() {
    if (!state.active) return;
    state.active = false;
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer) {
      if (state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    unbindKeys();
    state.scene = null;
    state.camera = null;
  }

  // ─── Scene setup ──────────────────────────────────────────────────────────
  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x001133);
    state.scene.fog = new THREE.FogExp2(0x002244, 0.03);

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 500);
    state.camera.position.set(0, 2, 15);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0x002255, 0.6);
    state.scene.add(ambient);

    // Caustic shimmer point light
    state.causticLight = new THREE.PointLight(0x0044AA, 2.0, 120);
    state.causticLight.position.set(0, 10, 0);
    state.scene.add(state.causticLight);
  }

  // ─── Environment ──────────────────────────────────────────────────────────
  function buildEnvironment() {
    // Ocean floor
    var floorGeo = new THREE.PlaneGeometry(300, 300);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x224433 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -25;
    state.scene.add(floor);
    state.objects.push(floor);
  }

  // ─── Buildings (8 ruined BoxGeometry) ────────────────────────────────────
  function buildBuildings() {
    var buildingDefs = [
      { x: -20, y: -12, z: -15, w: 8, h: 14, d: 8 },
      { x: 15,  y: -13, z: -18, w: 7, h: 12, d: 7 },
      { x: -8,  y: -14, z: 20,  w: 9, h: 10, d: 9 },
      { x: 25,  y: -13, z: 10,  w: 6, h: 11, d: 6 },
      { x: -30, y: -15, z: 5,   w: 8, h: 9,  d: 7 },
      { x: 5,   y: -13, z: -30, w: 7, h: 12, d: 8 },
      { x: -18, y: -14, z: 30,  w: 6, h: 10, d: 6 },
      { x: 35,  y: -12, z: -5,  w: 8, h: 13, d: 8 }
    ];

    var barnMat = new THREE.MeshLambertMaterial({ color: 0x446655 });
    var windowMat = new THREE.MeshLambertMaterial({ color: 0x001122, transparent: true, opacity: 0.3 });

    for (var i = 0; i < buildingDefs.length; i++) {
      var bd = buildingDefs[i];
      var bGeo = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
      var bMesh = new THREE.Mesh(bGeo, barnMat);
      bMesh.position.set(bd.x, bd.y, bd.z);
      state.scene.add(bMesh);
      state.buildings.push(bMesh);
      state.objects.push(bMesh);

      // Open windows — 2 per building
      for (var w = 0; w < 2; w++) {
        var winGeo = new THREE.BoxGeometry(1.5, 1.5, 0.3);
        var winMesh = new THREE.Mesh(winGeo, windowMat);
        winMesh.position.set(
          bd.x + (w === 0 ? -bd.w * 0.3 : bd.w * 0.3),
          bd.y + 1,
          bd.z + bd.d / 2 + 0.1
        );
        state.scene.add(winMesh);
        state.objects.push(winMesh);
      }
    }
  }

  // ─── Columns CylinderGeometry ─────────────────────────────────────────────
  function buildColumns() {
    var columnPositions = [
      { x: -10, z: -10 }, { x: 10, z: -10 },
      { x: -10, z: 10  }, { x: 10, z: 10  },
      { x: -22, z: -22 }, { x: 22, z: -22 },
      { x: -22, z: 22  }, { x: 22, z: 22  }
    ];
    var colMat = new THREE.MeshLambertMaterial({ color: 0x335544 });

    for (var i = 0; i < columnPositions.length; i++) {
      var cp = columnPositions[i];
      var colGeo = new THREE.CylinderGeometry(0.6, 0.8, 12, 8);
      var col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cp.x, -19, cp.z);
      state.scene.add(col);
      state.columns.push(col);
      state.objects.push(col);
    }
  }

  // ─── Kelp LineSegments ────────────────────────────────────────────────────
  function buildKelp() {
    var kelpMat = new THREE.LineBasicMaterial({ color: 0x224422 });

    for (var i = 0; i < 30; i++) {
      var kx = (Math.random() - 0.5) * 100;
      var kz = (Math.random() - 0.5) * 100;
      var segments = 4 + Math.floor(Math.random() * 4);
      var points = [];
      for (var s = 0; s <= segments; s++) {
        points.push(kx + Math.sin(s * 0.8) * 0.4, -25 + s * 2, kz + Math.cos(s * 0.6) * 0.3);
      }
      var geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      var line = new THREE.LineSegments(geom, kelpMat);
      line.userData.basePoints = points.slice();
      line.userData.kx = kx;
      line.userData.kz = kz;
      line.userData.phase = Math.random() * Math.PI * 2;
      state.scene.add(line);
      state.kelp.push(line);
    }
  }

  // ─── O2 Pickups ───────────────────────────────────────────────────────────
  function buildO2Pickups() {
    var positions = [
      { x: -20, y: -10, z: -15 },
      { x: 15,  y: -11, z: -18 },
      { x: -8,  y: -12, z: 20  }
    ];
    var o2Mat = new THREE.MeshLambertMaterial({ color: 0x44AAFF, transparent: true, opacity: 0.85 });

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var geo = new THREE.BoxGeometry(1.2, 1.8, 0.8);
      var mesh = new THREE.Mesh(geo, o2Mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData.collected = false;
      mesh.userData.refillSeconds = 90;
      state.scene.add(mesh);
      state.o2Pickups.push(mesh);
      state.objects.push(mesh);
    }
  }

  // ─── Air Pockets ──────────────────────────────────────────────────────────
  function buildAirPockets() {
    var positions = [
      { x: 5,   y: -8,  z: -5 },
      { x: -15, y: -10, z: 15 }
    ];
    var apMat = new THREE.MeshLambertMaterial({ color: 0x226633, transparent: true, opacity: 0.5 });

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var geo = new THREE.BoxGeometry(4, 3, 4);
      var mesh = new THREE.Mesh(geo, apMat);
      mesh.position.set(p.x, p.y, p.z);
      state.scene.add(mesh);
      state.airPockets.push(mesh);
      state.objects.push(mesh);
    }
  }

  // ─── Artifacts (5) ───────────────────────────────────────────────────────
  function buildArtifacts() {
    var positions = [
      { x: -20, y: -8,  z: -15 },
      { x: 15,  y: -9,  z: -18 },
      { x: 25,  y: -9,  z: 10  },
      { x: -30, y: -11, z: 5   },
      { x: 35,  y: -8,  z: -5  }  // inside vault building
    ];
    var artMat = new THREE.MeshLambertMaterial({ color: 0xFFCC44, emissive: 0x886600, emissiveIntensity: 0.6 });

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      var mesh = new THREE.Mesh(geo, artMat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData.collected = false;
      mesh.userData.recoverTimer = 0;
      mesh.userData.recovering = false;
      state.scene.add(mesh);
      state.artifacts.push(mesh);
      state.objects.push(mesh);
    }
  }

  // ─── Levers (3 in separate buildings) ────────────────────────────────────
  function buildLevers() {
    var positions = [
      { x: -20, y: -9,  z: -15 },
      { x: 15,  y: -10, z: -18 },
      { x: -8,  y: -11, z: 20  }
    ];
    var leverMat = new THREE.MeshLambertMaterial({ color: 0x556644 });

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var geo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
      var mesh = new THREE.Mesh(geo, leverMat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData.pulled = false;
      mesh.userData.index = i;
      state.scene.add(mesh);
      state.levers.push(mesh);
      state.objects.push(mesh);
    }
  }

  // ─── Vault (largest building) ─────────────────────────────────────────────
  function buildVault() {
    var vaultMat = new THREE.MeshLambertMaterial({ color: 0x335566 });
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x223344 });

    // Vault body — largest building at center-ish
    var vGeo = new THREE.BoxGeometry(14, 18, 14);
    var vMesh = new THREE.Mesh(vGeo, vaultMat);
    vMesh.position.set(0, -16, -5);
    state.scene.add(vMesh);
    state.objects.push(vMesh);
    state.buildings.push(vMesh);

    // Vault door
    var doorGeo = new THREE.BoxGeometry(3.5, 5, 0.4);
    var doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0, -13, 2.2);
    state.scene.add(doorMesh);
    state.objects.push(doorMesh);
    state.vaultDoor = doorMesh;

    // Artifact cache inside vault (hidden until open)
    var cacheMat = new THREE.MeshLambertMaterial({ color: 0xFFDD88, emissive: 0x997700, emissiveIntensity: 0.8 });
    var cacheGeo = new THREE.BoxGeometry(2, 2, 2);
    var cacheMesh = new THREE.Mesh(cacheGeo, cacheMat);
    cacheMesh.position.set(0, -14, -5);
    cacheMesh.visible = false;
    state.scene.add(cacheMesh);
    state.vaultArtifactCache = cacheMesh;
  }

  // ─── Dive Suit ────────────────────────────────────────────────────────────
  function buildDiveSuit() {
    var suitMat = new THREE.MeshLambertMaterial({ color: 0x336655 });
    var suitGeo = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    var suitMesh = new THREE.Mesh(suitGeo, suitMat);
    // Hidden deep in one of the wrecks
    suitMesh.position.set(-8, -22, 20);
    state.scene.add(suitMesh);
    state.objects.push(suitMesh);
    state.diveSuitMesh = suitMesh;
    state.diveSuitMesh.userData.collected = false;
  }

  // ─── Current Zones (3) ───────────────────────────────────────────────────
  function buildCurrentZones() {
    var currentDefs = [
      { x: -5, y: -15, z: 0,  w: 10, h: 8, d: 10, dir: { x: 1, y: 0, z: 0 } },
      { x: 20, y: -14, z: 20, w: 12, h: 8, d: 8,  dir: { x: 0, y: 0, z: -1 } },
      { x: -25, y: -16, z: -10, w: 8, h: 8, d: 12, dir: { x: 0, y: 1, z: 0 } }
    ];
    var currentMat = new THREE.MeshLambertMaterial({ color: 0x0066AA, transparent: true, opacity: 0.25 });

    for (var i = 0; i < currentDefs.length; i++) {
      var cd = currentDefs[i];
      var geo = new THREE.PlaneGeometry(cd.w, cd.d);
      var mesh = new THREE.Mesh(geo, currentMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cd.x, cd.y, cd.z);
      mesh.userData.dir = cd.dir;
      mesh.userData.width = cd.w;
      mesh.userData.height = cd.h;
      mesh.userData.depth = cd.d;
      mesh.userData.baseY = cd.y;
      state.scene.add(mesh);
      state.currentZones.push(mesh);
      state.objects.push(mesh);
    }
  }

  // ─── Sharks (4) ──────────────────────────────────────────────────────────
  function buildSharks() {
    var sharkMat = new THREE.MeshLambertMaterial({ color: 0x557799 });
    var sharkPositions = [
      { x: -5,  y: -12, z: 5  },
      { x: 10,  y: -14, z: -8 },
      { x: -18, y: -13, z: 18 },
      { x: 28,  y: -11, z: 0  }
    ];

    for (var i = 0; i < sharkPositions.length; i++) {
      var sp = sharkPositions[i];
      var geo = new THREE.CylinderGeometry(0.5, 1.2, 5, 8);
      var mesh = new THREE.Mesh(geo, sharkMat);
      mesh.position.set(sp.x, sp.y, sp.z);
      mesh.rotation.z = Math.PI / 2;
      state.scene.add(mesh);

      state.sharks.push({
        mesh: mesh,
        hp: 1,
        alive: true,
        mode: 'circle',   // 'circle' | 'charge'
        stillTimer: 0,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitRadius: 8 + Math.random() * 4,
        chargeVel: { x: 0, y: 0, z: 0 }
      });
    }
  }

  // ─── Eels (6) ────────────────────────────────────────────────────────────
  function buildEels() {
    var eelMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var eelHidePositions = [
      { x: -20, y: -11, z: -15, wallDir: 1  },
      { x: 15,  y: -12, z: -18, wallDir: -1 },
      { x: -8,  y: -13, z: 20,  wallDir: 1  },
      { x: 25,  y: -12, z: 10,  wallDir: -1 },
      { x: -30, y: -14, z: 5,   wallDir: 1  },
      { x: 5,   y: -12, z: -30, wallDir: -1 }
    ];

    for (var i = 0; i < eelHidePositions.length; i++) {
      var ep = eelHidePositions[i];
      var geo = new THREE.CylinderGeometry(0.2, 0.35, 3, 6);
      var mesh = new THREE.Mesh(geo, eelMat);
      mesh.position.set(ep.x + ep.wallDir * 3, ep.y, ep.z);
      mesh.rotation.z = Math.PI / 2;
      state.scene.add(mesh);

      state.eels.push({
        mesh: mesh,
        hp: 40,
        alive: true,
        hiding: true,
        lunging: false,
        lungeTimer: 0,
        stunCooldown: 0,
        homeX: ep.x + ep.wallDir * 3,
        homeY: ep.y,
        homeZ: ep.z,
        wallDir: ep.wallDir
      });
    }
  }

  // ─── Giant Squid ─────────────────────────────────────────────────────────
  function buildSquid() {
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x442255 });
    var bodyGeo = new THREE.CylinderGeometry(2, 2, 4, 10);
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, -18, -40);
    state.scene.add(bodyMesh);

    var tentacleMat = new THREE.LineBasicMaterial({ color: 0x552266 });
    var tentacles = [];
    for (var t = 0; t < 8; t++) {
      var angle = (t / 8) * Math.PI * 2;
      var pts = [];
      for (var s = 0; s <= 5; s++) {
        pts.push(
          Math.cos(angle) * (2 + s * 0.5),
          -2 - s * 1.5,
          Math.sin(angle) * (2 + s * 0.5)
        );
      }
      var tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      var tLine = new THREE.LineSegments(tGeo, tentacleMat);
      bodyMesh.add(tLine);
      tentacles.push(tLine);
    }

    var inkMat = new THREE.MeshLambertMaterial({ color: 0x221133, transparent: true, opacity: 0.0 });
    var inkGeo = new THREE.SphereGeometry(8, 12, 12);
    var inkMesh = new THREE.Mesh(inkGeo, inkMat);
    inkMesh.position.set(0, -18, -40);
    state.scene.add(inkMesh);

    state.squid = {
      mesh: bodyMesh,
      hp: 300,
      alive: true,
      mode: 'patrol',
      grabbing: false,
      grabTimer: 0,
      inkCooldown: 0,
      phase: 0
    };
    state.squidTentacles = tentacles;
    state.squidInkMesh = inkMesh;
    state.squidInkTimer = 0;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function buildHUD() {
    var el = document.createElement('div');
    el.id = 'underwater-ruins-hud';
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.color = '#88CCFF';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '14px';
    el.style.background = 'rgba(0,10,30,0.7)';
    el.style.padding = '6px 16px';
    el.style.borderRadius = '6px';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.letterSpacing = '1px';
    document.body.appendChild(el);
    state.hudEl = el;
    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var o2s = Math.max(0, Math.round(state.o2));
    var depth = Math.round(state.playerPos.y);
    var suitStr = state.hasDiveSuit ? 'YES' : 'NO';
    var vaultStr = state.vaultOpen ? 'OPEN' : 'LOCKED';
    var blind = state.playerBlindTimer > 0 ? ' [BLINDED]' : '';
    var stun = state.playerStunTimer > 0 ? ' [STUNNED]' : '';
    state.hudEl.textContent =
      'RUINS [O2: ' + o2s + 's] [ARTIFACTS: ' + state.artifactsCollected + '/5] ' +
      '[DEPTH: ' + depth + 'm] [SUIT: ' + suitStr + '] | VAULT: ' + vaultStr +
      ' | HP: ' + Math.max(0, Math.round(state.playerHP)) +
      blind + stun;
  }

  // ─── Key bindings ─────────────────────────────────────────────────────────
  function onKeyDown(e) {
    state.keysDown[e.keyCode] = true;

    // Activation: U+R within 400ms
    if (e.keyCode === ACTIVATION_KEY_U) {
      if (!state.uKeyDown) {
        state.uKeyDown = true;
        state.uKeyTime = Date.now();
      }
    }
    if (e.keyCode === ACTIVATION_KEY_R) {
      if (!state.rKeyDown) {
        state.rKeyDown = true;
        state.rKeyTime = Date.now();
      }
    }

    if (state.uKeyDown && state.rKeyDown) {
      var delta = Math.abs(state.uKeyTime - state.rKeyTime);
      if (delta <= ACTIVATION_WINDOW) {
        if (!state.active) {
          init();
        }
      }
    }

    // E to interact
    if (e.keyCode === 69) {
      state.eKeyDown = true;
    }

    // Q to mash free from squid grab
    if (e.keyCode === 81 && state.squid && state.squid.grabbing) {
      state.qPressCount++;
    }

    // F to fire harpoon
    if (e.keyCode === 70 && state.active) {
      fireHarpoon();
    }
  }

  function onKeyUp(e) {
    state.keysDown[e.keyCode] = false;
    if (e.keyCode === ACTIVATION_KEY_U) state.uKeyDown = false;
    if (e.keyCode === ACTIVATION_KEY_R) state.rKeyDown = false;
    if (e.keyCode === 69) state.eKeyDown = false;
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function unbindKeys() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  }

  // ─── Harpoon ──────────────────────────────────────────────────────────────
  function fireHarpoon() {
    if (!state.scene) return;
    var hMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var hGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4);
    var hMesh = new THREE.Mesh(hGeo, hMat);
    hMesh.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z - 1);
    hMesh.rotation.x = Math.PI / 2;
    state.scene.add(hMesh);
    state.harpoons.push({
      mesh: hMesh,
      vel: { x: 0, y: 0, z: -18 },
      life: 2.0
    });
  }

  // ─── Player movement ──────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (state.playerStunTimer > 0) {
      state.playerStunTimer -= dt;
      if (state.playerStunTimer < 0) state.playerStunTimer = 0;
    }

    if (state.moveLockTimer > 0) {
      state.moveLockTimer -= dt;
      if (state.moveLockTimer <= 0) {
        state.moveLockTimer = 0;
        state.movementLocked = false;
      }
    }

    var speed = 5.5;
    var stunned = state.playerStunTimer > 0;
    var locked = state.movementLocked;

    if (!stunned && !locked) {
      var moveX = 0;
      var moveY = 0;
      var moveZ = 0;

      if (state.keysDown[65] || state.keysDown[37]) moveX -= 1; // A / left
      if (state.keysDown[68] || state.keysDown[39]) moveX += 1; // D / right
      if (state.keysDown[87] || state.keysDown[38]) moveZ -= 1; // W / up-arrow
      if (state.keysDown[83] || state.keysDown[40]) moveZ += 1; // S / down-arrow
      if (state.keysDown[32]) moveY += 1;                        // space = ascend
      if (state.keysDown[16]) moveY -= 1;                        // shift = descend

      // Current zone push
      var inCurrent = false;
      for (var ci = 0; ci < state.currentZones.length; ci++) {
        var cz = state.currentZones[ci];
        var cpx = cz.position.x;
        var cpy = cz.userData.baseY;
        var cpz = cz.position.z;
        var hw = cz.userData.width / 2;
        var hh = cz.userData.height / 2;
        var hd = cz.userData.depth / 2;
        if (state.playerPos.x > cpx - hw && state.playerPos.x < cpx + hw &&
            state.playerPos.y > cpy - hh && state.playerPos.y < cpy + hh &&
            state.playerPos.z > cpz - hd && state.playerPos.z < cpz + hd) {
          var dir = cz.userData.dir;
          moveX += dir.x * 5 * dt;
          moveY += dir.y * 5 * dt;
          moveZ += dir.z * 5 * dt;
          inCurrent = true;
        }
      }
      void inCurrent;

      state.playerPos.x += moveX * speed * dt;
      state.playerPos.y += moveY * speed * dt;
      state.playerPos.z += moveZ * speed * dt;
    }

    // Clamp depth
    state.playerPos.y = clamp(state.playerPos.y, -35, 20);
  }

  // ─── Oxygen system ───────────────────────────────────────────────────────
  function updateOxygen(dt) {
    // Check if inside air pocket
    var inPocket = false;
    for (var i = 0; i < state.airPockets.length; i++) {
      var ap = state.airPockets[i];
      var apx = ap.position.x;
      var apy = ap.position.y;
      var apz = ap.position.z;
      if (Math.abs(state.playerPos.x - apx) < 2 &&
          Math.abs(state.playerPos.y - apy) < 1.5 &&
          Math.abs(state.playerPos.z - apz) < 2) {
        inPocket = true;
        state.o2 = state.o2Max; // reset in air pocket
      }
    }

    if (!inPocket) {
      state.o2 -= dt;
      if (state.o2 < 0) {
        state.o2 = 0;
        // HP drain when out of O2
        state.playerHP -= 5 * dt;
      }
    }

    // O2 pickup proximity
    for (var j = 0; j < state.o2Pickups.length; j++) {
      var pu = state.o2Pickups[j];
      if (!pu.userData.collected) {
        var d = dist3(state.playerPos, pu.position);
        if (d < 1.5) {
          pu.userData.collected = true;
          pu.visible = false;
          state.o2 = clamp(state.o2 + pu.userData.refillSeconds, 0, state.o2Max);
        }
      }
    }
  }

  // ─── Pressure damage ──────────────────────────────────────────────────────
  function updatePressure(dt) {
    if (state.playerPos.y < -20 && !state.hasDiveSuit) {
      state.playerHP -= 2 * dt;
    }
  }

  // ─── Dive suit pickup ─────────────────────────────────────────────────────
  function updateDiveSuit() {
    if (state.diveSuitMesh && !state.diveSuitMesh.userData.collected) {
      var d = dist3(state.playerPos, state.diveSuitMesh.position);
      if (d < 2.0) {
        state.diveSuitMesh.userData.collected = true;
        state.diveSuitMesh.visible = false;
        state.hasDiveSuit = true;
      }
    }
  }

  // ─── Artifact interaction ──────────────────────────────────────────────────
  function updateArtifacts(dt) {
    for (var i = 0; i < state.artifacts.length; i++) {
      var art = state.artifacts[i];
      if (art.userData.collected) continue;

      var d = dist3(state.playerPos, art.position);
      if (d < 1.8) {
        if (state.eKeyDown) {
          art.userData.recoverTimer += dt;
          if (art.userData.recoverTimer >= 2.0) {
            art.userData.collected = true;
            art.visible = false;
            state.artifactsCollected++;
            if (state.artifactsCollected >= state.artifactsTotal) {
              state.missionComplete = true;
            }
          }
        } else {
          art.userData.recoverTimer = 0;
        }
      } else {
        art.userData.recoverTimer = 0;
      }

      // Float bob
      art.position.y += Math.sin(Date.now() * 0.002 + i) * 0.005;
    }
  }

  // ─── Lever interaction ────────────────────────────────────────────────────
  function updateLevers() {
    for (var i = 0; i < state.levers.length; i++) {
      var lev = state.levers[i];
      if (lev.userData.pulled) continue;

      var d = dist3(state.playerPos, lev.position);
      if (d < 1.5 && state.eKeyDown) {
        lev.userData.pulled = true;
        lev.rotation.z = Math.PI / 4;
        state.leversPulled++;
        if (state.leversPulled >= state.leversTotal && !state.vaultOpen) {
          openVault();
        }
      }
    }
  }

  function openVault() {
    state.vaultOpen = true;
    if (state.vaultDoor) {
      state.vaultDoor.visible = false;
    }
    if (state.vaultArtifactCache) {
      state.vaultArtifactCache.visible = true;
    }
  }

  // ─── Sharks ───────────────────────────────────────────────────────────────
  function updateSharks(dt) {
    for (var i = 0; i < state.sharks.length; i++) {
      var sh = state.sharks[i];
      if (!sh.alive) continue;

      var pp = state.playerPos;
      var sm = sh.mesh;
      var dToPlayer = dist3(pp, sm.position);

      if (sh.mode === 'circle') {
        // Track still time — if player hasn't moved, orbit tighter
        sh.orbitAngle += dt * 0.6;
        sm.position.x = pp.x + Math.cos(sh.orbitAngle) * sh.orbitRadius;
        sm.position.z = pp.z + Math.sin(sh.orbitAngle) * sh.orbitRadius;
        sm.position.y += (pp.y - sm.position.y) * dt * 0.5;

        // Check if player is still 3+ seconds → charge
        sh.stillTimer += dt;
        if (sh.stillTimer >= 3.0) {
          sh.mode = 'charge';
          var cdx = pp.x - sm.position.x;
          var cdy = pp.y - sm.position.y;
          var cdz = pp.z - sm.position.z;
          var clen = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) || 1;
          sh.chargeVel.x = (cdx / clen) * 12;
          sh.chargeVel.y = (cdy / clen) * 12;
          sh.chargeVel.z = (cdz / clen) * 12;
        }
      } else {
        // Charge
        sm.position.x += sh.chargeVel.x * dt;
        sm.position.y += sh.chargeVel.y * dt;
        sm.position.z += sh.chargeVel.z * dt;

        if (dToPlayer < 1.5) {
          state.playerHP -= 25 * dt;
        }

        // If overshot, go back to circle
        if (dToPlayer > sh.orbitRadius + 5) {
          sh.mode = 'circle';
          sh.stillTimer = 0;
          sh.orbitAngle = Math.random() * Math.PI * 2;
        }
      }

      // Face direction of movement
      sm.lookAt(pp.x, sm.position.y, pp.z);
    }
  }

  // ─── Eels ────────────────────────────────────────────────────────────────
  function updateEels(dt) {
    for (var i = 0; i < state.eels.length; i++) {
      var eel = state.eels[i];
      if (!eel.alive) continue;

      var pp = state.playerPos;
      var em = eel.mesh;
      var dToPlayer = dist3(pp, em.position);

      if (eel.stunCooldown > 0) {
        eel.stunCooldown -= dt;
      }

      if (!eel.lunging) {
        if (dToPlayer < 1.5 && eel.stunCooldown <= 0) {
          // Lunge
          eel.lunging = true;
          eel.lungeTimer = 0.5;
          var ldx = pp.x - em.position.x;
          var ldz = pp.z - em.position.z;
          var llen = Math.sqrt(ldx * ldx + ldz * ldz) || 1;
          eel.lungeVelX = (ldx / llen) * 3;
          eel.lungeVelZ = (ldz / llen) * 3;

          // Electric shock
          state.playerHP -= 30;
          state.playerStunTimer = 2.0;
          eel.stunCooldown = 4.0;
        }
      } else {
        em.position.x += eel.lungeVelX * dt;
        em.position.z += eel.lungeVelZ * dt;
        eel.lungeTimer -= dt;
        if (eel.lungeTimer <= 0) {
          eel.lunging = false;
          // Return to home
          em.position.set(eel.homeX, eel.homeY, eel.homeZ);
        }
      }
    }
  }

  // ─── Giant Squid ─────────────────────────────────────────────────────────
  function updateSquid(dt) {
    if (!state.squid || !state.squid.alive) return;

    var sq = state.squid;
    var sm = sq.mesh;
    var pp = state.playerPos;
    var dToPlayer = dist3(pp, sm.position);

    sq.phase += dt;
    sq.inkCooldown -= dt;

    if (sq.grabbing) {
      state.movementLocked = true;
      sq.grabTimer -= dt;

      // Q mash check: 10 presses frees player
      if (state.qPressCount >= 10) {
        sq.grabbing = false;
        state.movementLocked = false;
        state.moveLockTimer = 0;
        state.qPressCount = 0;
      }

      if (sq.grabTimer <= 0) {
        sq.grabbing = false;
        state.movementLocked = false;
        state.moveLockTimer = 0;
      }
    } else {
      state.qPressCount = 0;

      // Move toward player
      if (dToPlayer > 3) {
        var sdx = pp.x - sm.position.x;
        var sdy = pp.y - sm.position.y;
        var sdz = pp.z - sm.position.z;
        var slen = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz) || 1;
        sm.position.x += (sdx / slen) * 3 * dt;
        sm.position.y += (sdy / slen) * 3 * dt;
        sm.position.z += (sdz / slen) * 3 * dt;
      }

      // Grab attack
      if (dToPlayer < 3 && !sq.grabbing) {
        sq.grabbing = true;
        sq.grabTimer = 4.0;
        state.movementLocked = true;
        state.moveLockTimer = 4.0;
        state.qPressCount = 0;
      }

      // Ink cloud
      if (dToPlayer < 10 && sq.inkCooldown <= 0) {
        sq.inkCooldown = 15.0;
        state.squidInkTimer = 5.0;
        state.playerBlindTimer = 5.0;
        if (state.squidInkMesh) {
          state.squidInkMesh.material.opacity = 0.85;
          state.squidInkMesh.position.copy(sm.position);
        }
      }
    }

    // Tentacle sway
    sm.rotation.y = Math.sin(sq.phase * 0.8) * 0.4;

    // Ink fade
    if (state.squidInkTimer > 0) {
      state.squidInkTimer -= dt;
      if (state.squidInkMesh) {
        state.squidInkMesh.material.opacity = clamp(state.squidInkTimer / 5.0 * 0.85, 0, 0.85);
      }
      if (state.squidInkTimer <= 0 && state.squidInkMesh) {
        state.squidInkMesh.material.opacity = 0;
      }
    }

    if (state.playerBlindTimer > 0) {
      state.playerBlindTimer -= dt;
      if (state.playerBlindTimer < 0) state.playerBlindTimer = 0;
    }
  }

  // ─── Harpoons ────────────────────────────────────────────────────────────
  function updateHarpoons(dt) {
    for (var i = state.harpoons.length - 1; i >= 0; i--) {
      var h = state.harpoons[i];
      h.life -= dt;
      h.mesh.position.x += h.vel.x * dt;
      h.mesh.position.y += h.vel.y * dt;
      h.mesh.position.z += h.vel.z * dt;

      // Check shark hits
      for (var si = 0; si < state.sharks.length; si++) {
        var sh = state.sharks[si];
        if (!sh.alive) continue;
        var dsh = dist3(h.mesh.position, sh.mesh.position);
        if (dsh < 2.0) {
          sh.alive = false;
          sh.mesh.visible = false;
          h.life = 0;
        }
      }

      // Check eel hits
      for (var ei = 0; ei < state.eels.length; ei++) {
        var eel = state.eels[ei];
        if (!eel.alive) continue;
        var deel = dist3(h.mesh.position, eel.mesh.position);
        if (deel < 1.2) {
          eel.hp -= 40;
          if (eel.hp <= 0) {
            eel.alive = false;
            eel.mesh.visible = false;
          }
          h.life = 0;
        }
      }

      // Check squid hits
      if (state.squid && state.squid.alive) {
        var dsq = dist3(h.mesh.position, state.squid.mesh.position);
        if (dsq < 3.0) {
          state.squid.hp -= 50;
          if (state.squid.hp <= 0) {
            state.squid.alive = false;
            state.squid.mesh.visible = false;
            if (state.squidInkMesh) state.squidInkMesh.visible = false;
          }
          h.life = 0;
        }
      }

      if (h.life <= 0) {
        if (h.mesh.parent) h.mesh.parent.removeChild && h.mesh.parent.remove(h.mesh);
        state.scene.remove(h.mesh);
        state.harpoons.splice(i, 1);
      }
    }
  }

  // ─── Kelp sway ───────────────────────────────────────────────────────────
  function updateKelp(t) {
    for (var i = 0; i < state.kelp.length; i++) {
      var k = state.kelp[i];
      var base = k.userData.basePoints;
      var phase = k.userData.phase;
      var kx = k.userData.kx;
      var kz = k.userData.kz;
      var pts = base.slice();

      for (var s = 0; s < pts.length / 3; s++) {
        var seg = s;
        pts[s * 3]     = kx + Math.sin(t * 0.8 + phase + seg * 0.6) * seg * 0.3;
        pts[s * 3 + 2] = kz + Math.cos(t * 0.6 + phase + seg * 0.5) * seg * 0.25;
      }

      var posAttr = k.geometry.getAttribute('position');
      for (var pi = 0; pi < pts.length; pi++) {
        posAttr.array[pi] = pts[pi];
      }
      posAttr.needsUpdate = true;
    }
  }

  // ─── Caustic shimmer ──────────────────────────────────────────────────────
  function updateCaustic(dt) {
    state.causticTimer += dt * 3.0;
    if (state.causticLight) {
      state.causticLight.intensity = 1.5 + Math.sin(state.causticTimer) * 0.6 +
                                          Math.sin(state.causticTimer * 1.7) * 0.3;
      state.causticLight.position.x = Math.sin(state.causticTimer * 0.3) * 5;
      state.causticLight.position.z = Math.cos(state.causticTimer * 0.25) * 5;
    }
  }

  // ─── Camera follow ────────────────────────────────────────────────────────
  function updateCamera() {
    if (!state.camera) return;
    var pp = state.playerPos;
    state.camera.position.x += (pp.x - state.camera.position.x) * 0.08;
    state.camera.position.y += (pp.y + 4 - state.camera.position.y) * 0.08;
    state.camera.position.z += (pp.z + 15 - state.camera.position.z) * 0.08;
    state.camera.lookAt(pp.x, pp.y, pp.z);
  }

  // ─── Animate ─────────────────────────────────────────────────────────────
  function animate(now) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((now - state.lastTime) / 1000, 0.05);
    state.lastTime = now;
    var t = now / 1000;

    updatePlayer(dt);
    updateOxygen(dt);
    updatePressure(dt);
    updateDiveSuit();
    updateArtifacts(dt);
    updateLevers();
    updateSharks(dt);
    updateEels(dt);
    updateSquid(dt);
    updateHarpoons(dt);
    updateKelp(t);
    updateCaustic(dt);
    updateCamera();
    updateHUD();

    // Death check
    if (state.playerHP <= 0) {
      state.playerHP = 0;
      // Could trigger game-over; for now just clamp
    }

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init: init,
    destroy: destroy,
    getState: function () { return state; }
  };
})();
