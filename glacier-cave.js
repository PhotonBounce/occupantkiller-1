window.GlacierCave = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'GlacierCave';
  var ACTIVATION_KEY_A = 'g';
  var ACTIVATION_KEY_B = 'c';
  var ACTIVATION_WINDOW = 400;

  // Color constants
  var COLOR_ICE_WALL      = 0x88BBDD;
  var COLOR_ICE_BLUE      = 0xAADDFF;
  var COLOR_THIN_ICE      = 0xCCEEFF;
  var COLOR_LAKE_WATER    = 0x112244;
  var COLOR_MERCENARY     = 0x445566;
  var COLOR_ICE_CLIMBER   = 0x334455;
  var COLOR_FROSTBITE     = 0x223344;
  var COLOR_HEATER        = 0xFF3300;
  var COLOR_CRATE         = 0x556644;
  var COLOR_TENT          = 0x667755;
  var COLOR_VAULT_DOOR    = 0x556677;
  var COLOR_LEVER         = 0xAA8833;
  var COLOR_ICICLE        = 0xBBDDFF;
  var COLOR_STALACTITE    = 0x99BBCC;
  var COLOR_BRIDGE        = 0x889999;
  var COLOR_GROUND        = 0x334455;
  var COLOR_NUCLEAR_CACHE = 0x88FF44;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    playerPos: { x: 0, y: 1.8, z: 60 },
    playerHP: 100,
    gameOver: false,
    victory: false,
    lastTime: 0,
    animFrameId: null,
    keysDown: {},
    keyTimes: {},

    // Temperature / hypothermia
    temperature: 100,          // 100% = warm, 0% = max cold
    nearHeater: false,

    // Thin ice tracking
    thinIceCracks: 0,          // cracks accumulated (max 3 -> fall)
    onThinIce: false,
    thinIceTimer: 0,

    // Vault levers
    leversTotal: 3,
    leversPulled: 0,
    vaultOpen: false,
    nuclearSecured: false,
    nuclearSecureTimer: 0,
    nuclearSecureRequired: 3,

    // Frostbite boss
    frostbiteHP: 500,
    frostbiteMaxHP: 500,
    frostbitePhase2: false,
    stalactiteCollapse: false,
    stalactiteTimer: 0,
    stalactiteObjects: [],
    icyGrenades: [],
    frostbiteFireTimer: 0,
    frostbiteFireInterval: 3,
    frostbiteDefeated: false,

    // Escape
    escaped: false,

    // World objects
    objects: [],
    enemies: [],
    heaters: [],
    thinIceSections: [],
    leverObjects: [],
    icicles: [],
    vaultDoor: null,
    nuclearCache: null,
    iceBridge: null,
    exitPortal: null,
    playerMesh: null,

    // HUD
    hudEl: null,
    hudInterval: null,

    // Freeze effect (on ice grenade hit)
    frozenTimer: 0,

    // In lake (fell through ice)
    inLake: false,
    lakeTimer: 0,

    // Cavern bounds for heater proximity check
    caverns: []
  };

  // ─── INIT / DESTROY ────────────────────────────────────────────────────────

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE.js not found');
      return;
    }

    resetState();
    setupScene();
    buildEnvironment();
    buildHUD();
    bindKeys();
    animate(0);
  }

  function resetState() {
    state.playerPos = { x: 0, y: 1.8, z: 60 };
    state.playerHP = 100;
    state.gameOver = false;
    state.victory = false;
    state.lastTime = 0;
    state.keysDown = {};
    state.keyTimes = {};
    state.temperature = 100;
    state.nearHeater = false;
    state.thinIceCracks = 0;
    state.onThinIce = false;
    state.thinIceTimer = 0;
    state.leversPulled = 0;
    state.vaultOpen = false;
    state.nuclearSecured = false;
    state.nuclearSecureTimer = 0;
    state.frostbiteHP = 500;
    state.frostbiteMaxHP = 500;
    state.frostbitePhase2 = false;
    state.stalactiteCollapse = false;
    state.stalactiteTimer = 0;
    state.stalactiteObjects = [];
    state.icyGrenades = [];
    state.frostbiteFireTimer = 0;
    state.frostbiteDefeated = false;
    state.escaped = false;
    state.objects = [];
    state.enemies = [];
    state.heaters = [];
    state.thinIceSections = [];
    state.leverObjects = [];
    state.icicles = [];
    state.vaultDoor = null;
    state.nuclearCache = null;
    state.iceBridge = null;
    state.exitPortal = null;
    state.playerMesh = null;
    state.frozenTimer = 0;
    state.inLake = false;
    state.lakeTimer = 0;
    state.caverns = [];
    state.animFrameId = null;
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
    if (state.hudInterval) {
      clearInterval(state.hudInterval);
      state.hudInterval = null;
    }
    unbindKeys();
  }

  // ─── SCENE SETUP ────────────────────────────────────────────────────────────

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x050D15);
    state.scene.fog = new THREE.FogExp2(0x081828, 0.018);

    state.camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 500);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0x334466, 0.6);
    state.scene.add(ambient);

    var caveLight = new THREE.DirectionalLight(0x6699BB, 0.4);
    caveLight.position.set(10, 40, 10);
    caveLight.castShadow = true;
    state.scene.add(caveLight);

    // Blue-tinted point lights for ice glow
    var gl1 = new THREE.PointLight(0x2255AA, 1.0, 60);
    gl1.position.set(0, 8, 0);
    state.scene.add(gl1);

    var gl2 = new THREE.PointLight(0x1144AA, 0.8, 50);
    gl2.position.set(30, 6, -40);
    state.scene.add(gl2);

    var gl3 = new THREE.PointLight(0x2266CC, 0.7, 50);
    gl3.position.set(-30, 6, -80);
    state.scene.add(gl3);

    var gl4 = new THREE.PointLight(0x1133AA, 0.9, 60);
    gl4.position.set(0, 8, -130);
    state.scene.add(gl4);
  }

  // ─── GEOMETRY HELPERS ────────────────────────────────────────────────────────

  function addMesh(geo, color, x, y, z, opts) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts && opts.transparent) {
      mat.transparent = true;
      mat.opacity = opts.opacity || 0.7;
    }
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (opts && opts.rx) mesh.rotation.x = opts.rx;
    if (opts && opts.ry) mesh.rotation.y = opts.ry;
    if (opts && opts.rz) mesh.rotation.z = opts.rz;
    if (opts && opts.castShadow) mesh.castShadow = true;
    if (opts && opts.receiveShadow) mesh.receiveShadow = true;
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
  }

  function addBox(w, h, d, color, x, y, z, opts) {
    return addMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, opts);
  }

  function addCylinder(rt, rb, h, segs, color, x, y, z, opts) {
    return addMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color, x, y, z, opts);
  }

  function addCone(r, h, segs, color, x, y, z, opts) {
    return addMesh(new THREE.ConeGeometry(r, h, segs), color, x, y, z, opts);
  }

  function addSphere(r, ws, hs, color, x, y, z, opts) {
    return addMesh(new THREE.SphereGeometry(r, ws, hs), color, x, y, z, opts);
  }

  // ─── BUILD ENVIRONMENT ───────────────────────────────────────────────────────

  function buildEnvironment() {
    buildGlacierEntrance();
    buildCaverns();
    buildUndergroundLake();
    buildMercenaryCamp();
    buildIceBridge();
    buildLevers();
    buildArtifactVault();
    buildPlayerMesh();
    buildEnemies();
    buildIcicles();
    buildExitMarker();
  }

  // ─── GLACIER ENTRANCE ────────────────────────────────────────────────────────

  function buildGlacierEntrance() {
    // Ground at entrance
    addBox(60, 1, 30, COLOR_ICE_WALL, 0, -0.5, 60, { receiveShadow: true });

    // Cave floor continuing inward
    addBox(40, 1, 160, COLOR_GROUND, 0, -0.5, -10, { receiveShadow: true });

    // Left arch pillar
    addBox(6, 22, 8, COLOR_ICE_WALL, -14, 11, 58, { castShadow: true });
    // Right arch pillar
    addBox(6, 22, 8, COLOR_ICE_WALL, 14, 11, 58, { castShadow: true });

    // Top arch — ConeGeometry spanning the top
    var archCone = addCone(10, 12, 6, COLOR_ICE_BLUE, 0, 26, 58, {});
    archCone.rotation.y = Math.PI / 6;

    // Arch cross beam (box)
    addBox(28, 3, 6, COLOR_ICE_WALL, 0, 22, 58, {});

    // Icicles hanging from arch — inverted ConeGeometry
    var icicleDefs = [
      { x: -10, z: 57 }, { x: -5, z: 57.5 }, { x: 0, z: 57 },
      { x: 5, z: 57.5 }, { x: 10, z: 57 }, { x: -7, z: 56 }, { x: 7, z: 56 }
    ];
    for (var i = 0; i < icicleDefs.length; i++) {
      var id = icicleDefs[i];
      var ht = 2.5 + Math.random() * 3;
      var ic = addCone(0.25, ht, 5, COLOR_ICICLE, id.x, 22 - ht / 2, id.z, {});
      ic.rotation.x = Math.PI; // invert
      state.icicles.push(ic);
    }

    // Cave side walls at entrance
    addBox(4, 20, 120, COLOR_ICE_WALL, -22, 10, 0, { castShadow: true, receiveShadow: true });
    addBox(4, 20, 120, COLOR_ICE_WALL, 22, 10, 0, { castShadow: true, receiveShadow: true });
    // Cave ceiling
    addBox(44, 3, 120, COLOR_ICE_WALL, 0, 19, 0, { receiveShadow: true });
  }

  // ─── CAVERN NETWORK (4 caverns) ──────────────────────────────────────────────

  function buildCaverns() {
    // Cavern 1: main hub (z: -20 to -60)
    buildCavern(0, 0, -40, 40, 18, 44, 'CAVERN_1');

    // Cavern 2: left branch (z: -60 to -100, x: -30)
    buildCavern(-32, 0, -80, 36, 16, 40, 'CAVERN_2');

    // Connecting passage from C1 to C2
    addBox(10, 12, 22, COLOR_ICE_WALL, -16, 6, -68, {});

    // Cavern 3: right branch (z: -50 to -90, x: +30)
    buildCavern(32, 0, -70, 36, 16, 40, 'CAVERN_3');

    // Connecting passage from C1 to C3
    addBox(10, 12, 22, COLOR_ICE_WALL, 16, 6, -68, {});

    // Cavern 4: vault room (deep, z: -110 to -155)
    buildCavern(0, 0, -132, 38, 20, 46, 'CAVERN_4');

    // Passage from C1 to C4 (central corridor)
    addBox(12, 14, 48, COLOR_ICE_WALL, 0, 7, -106, {});
  }

  function buildCavern(cx, cy, cz, w, h, d, name) {
    // Floor
    var floor = addBox(w, 1, d, COLOR_GROUND, cx, cy - 0.5, cz, { receiveShadow: true });
    floor.userData.cavernFloor = true;

    // Walls — left, right, back, ceiling
    addBox(3, h, d, COLOR_ICE_WALL, cx - w / 2 - 1.5, cy + h / 2, cz, { castShadow: true });
    addBox(3, h, d, COLOR_ICE_WALL, cx + w / 2 + 1.5, cy + h / 2, cz, { castShadow: true });
    addBox(w, h, 3, COLOR_ICE_WALL, cx, cy + h / 2, cz - d / 2 - 1.5, { castShadow: true });
    addBox(w, 3, d, COLOR_ICE_WALL, cx, cy + h + 1.5, cz, {});

    // Irregular ice formations on walls (decorative boxes)
    addBox(3, 4, 3, COLOR_ICE_BLUE, cx - w / 2 + 1, cy + 2, cz - d / 4, {});
    addBox(2, 5, 2, COLOR_ICE_BLUE, cx + w / 2 - 1, cy + 3, cz + d / 4, {});
    addBox(4, 3, 2, COLOR_ICE_BLUE, cx, cy + 1, cz - d / 2 + 1, {});

    state.caverns.push({ name: name, cx: cx, cy: cy, cz: cz, w: w, h: h, d: d });
    return floor;
  }

  // ─── UNDERGROUND LAKE ────────────────────────────────────────────────────────

  function buildUndergroundLake() {
    // Main dark water body
    var lake = addBox(34, 0.5, 28, COLOR_LAKE_WATER, -32, -1.25, -78, { receiveShadow: true });
    lake.userData.isLake = true;
    lake.userData.lakeBounds = {
      minX: -49, maxX: -15, minZ: -92, maxZ: -64
    };
    state.lakeMesh = lake;

    // Thin ice sections floating on lake
    var thinDefs = [
      { x: -28, z: -72 }, { x: -36, z: -80 }, { x: -24, z: -83 }
    ];
    for (var i = 0; i < thinDefs.length; i++) {
      var td = thinDefs[i];
      var thin = addBox(7, 0.2, 7, COLOR_THIN_ICE, td.x, -0.9, td.z,
        { transparent: true, opacity: 0.8 });
      thin.userData.isThinIce = true;
      thin.userData.cracks = 0;
      thin.userData.broken = false;
      thin.userData.bounds = {
        minX: td.x - 3.5, maxX: td.x + 3.5,
        minZ: td.z - 3.5, maxZ: td.z + 3.5
      };
      state.thinIceSections.push(thin);
    }
  }

  // ─── MERCENARY CAMP ──────────────────────────────────────────────────────────

  function buildMercenaryCamp() {
    // Camp in Cavern 1 area
    var campPositions = [
      { x: -8, z: -28 }, { x: 8, z: -32 }, { x: -5, z: -50 }
    ];

    for (var i = 0; i < campPositions.length; i++) {
      var cp = campPositions[i];
      buildTent(cp.x, cp.z);
    }

    // Heaters (red-glowing cylinders)
    var heaterDefs = [
      { x: -10, z: -30 }, { x: 10, z: -35 }, { x: -6, z: -52 },
      { x: 30, z: -62 }
    ];
    for (var j = 0; j < heaterDefs.length; j++) {
      var hd = heaterDefs[j];
      buildHeater(hd.x, hd.z);
    }

    // Supply crates scattered
    var crateDefs = [
      { x: -12, z: -25 }, { x: 6, z: -28 }, { x: 14, z: -40 },
      { x: -15, z: -45 }, { x: 28, z: -58 }, { x: -28, z: -68 }
    ];
    for (var k = 0; k < crateDefs.length; k++) {
      var cd = crateDefs[k];
      addBox(2, 1.5, 2, COLOR_CRATE, cd.x, 0.75, cd.z, { castShadow: true });
    }
  }

  function buildTent(x, z) {
    // Tent body (box)
    addBox(5, 3, 6, COLOR_TENT, x, 1.5, z, { castShadow: true });
    // Tent peak (cone on top)
    var peak = addCone(2.5, 2, 4, COLOR_TENT, x, 4.0, z, {});
    return peak;
  }

  function buildHeater(x, z) {
    var body = addCylinder(0.5, 0.5, 1.8, 8, COLOR_HEATER, x, 0.9, z, { castShadow: true });
    body.userData.isHeater = true;
    body.userData.hx = x;
    body.userData.hz = z;

    // Glow rings
    addCylinder(0.6, 0.6, 0.15, 8, 0xFF6600, x, 0.4, z, {});
    addCylinder(0.6, 0.6, 0.15, 8, 0xFF6600, x, 1.4, z, {});

    var light = new THREE.PointLight(0xFF3300, 1.2, 10);
    light.position.set(x, 2, z);
    state.scene.add(light);

    state.heaters.push({ x: x, z: z, mesh: body });
    return body;
  }

  // ─── ICE BRIDGE ──────────────────────────────────────────────────────────────

  function buildIceBridge() {
    // Bridge over a chasm between C3 and C4 area
    var bridge = addBox(4, 0.5, 20, COLOR_BRIDGE, 32, -0.25, -106, {
      castShadow: true, receiveShadow: true, transparent: true, opacity: 0.85
    });
    bridge.userData.isBridge = true;
    bridge.userData.bounds = {
      minX: 30, maxX: 34, minZ: -116, maxZ: -96
    };
    state.iceBridge = bridge;

    // Chasm below bridge
    addBox(20, 8, 20, COLOR_LAKE_WATER, 32, -5, -106, {});

    // Bridge railings (thin boxes)
    addBox(0.3, 1.2, 20, COLOR_BRIDGE, 30, 0.6, -106, {});
    addBox(0.3, 1.2, 20, COLOR_BRIDGE, 34, 0.6, -106, {});
  }

  // ─── VAULT LEVERS ────────────────────────────────────────────────────────────

  function buildLevers() {
    // 3 levers in 3 different caverns
    var leverDefs = [
      { x: -16, y: 1.5, z: -42, cavern: 'C1' },   // Cavern 1
      { x: -42, y: 1.5, z: -88, cavern: 'C2' },   // Cavern 2
      { x: 42, y: 1.5, z: -65, cavern: 'C3' }     // Cavern 3
    ];

    for (var i = 0; i < leverDefs.length; i++) {
      var ld = leverDefs[i];
      buildLever(ld.x, ld.y, ld.z, i);
    }
  }

  function buildLever(x, y, z, index) {
    // Lever base
    var base = addBox(0.6, 0.3, 0.6, 0x556677, x, y - 0.15, z, {});
    // Lever stick (cylinder)
    var stick = addCylinder(0.1, 0.1, 1.2, 6, COLOR_LEVER, x, y + 0.6, z, {});
    // Lever ball top
    var ball = addSphere(0.2, 6, 4, 0xFFAA00, x, y + 1.3, z, {});

    var leverGroup = {
      index: index,
      pulled: false,
      base: base,
      stick: stick,
      ball: ball,
      x: x, y: y, z: z
    };
    stick.userData.isLever = true;
    stick.userData.leverIndex = index;
    ball.userData.isLever = true;
    ball.userData.leverIndex = index;

    // Small wall-mount indicator
    addBox(0.15, 0.6, 1.4, COLOR_ICE_BLUE, x - 0.4, y + 0.6, z, {});

    state.leverObjects.push(leverGroup);
    return leverGroup;
  }

  // ─── ARTIFACT VAULT ──────────────────────────────────────────────────────────

  function buildArtifactVault() {
    // Steel vault door in ice wall (back of Cavern 4)
    var vaultDoor = addBox(8, 10, 1.5, COLOR_VAULT_DOOR, 0, 5, -154, { castShadow: true });
    vaultDoor.userData.isVaultDoor = true;
    state.vaultDoor = vaultDoor;

    // Door details (rivets / frame)
    addBox(8.5, 0.5, 1.6, 0x334455, 0, 0.5, -154, {});
    addBox(8.5, 0.5, 1.6, 0x334455, 0, 9.5, -154, {});
    addBox(0.5, 10, 1.6, 0x334455, -4, 5, -154, {});
    addBox(0.5, 10, 1.6, 0x334455, 4, 5, -154, {});
    // Vault wheel handle
    addCylinder(1.2, 1.2, 0.3, 8, 0x889999, 0, 5, -153.2, {});
    addBox(0.2, 2.4, 0.3, 0xAABBCC, 0, 5, -153.2, {});
    addBox(2.4, 0.2, 0.3, 0xAABBCC, 0, 5, -153.2, {});

    // Ice wall embedding vault
    addBox(20, 20, 5, COLOR_ICE_WALL, 0, 5, -157, { castShadow: true });

    // Nuclear cache inside vault (hidden until vault opens)
    var cache = addBox(3, 2, 3, COLOR_NUCLEAR_CACHE, 0, 1, -158, {});
    cache.visible = false;
    cache.userData.isNuclearCache = true;
    cache.userData.bounds = {
      minX: -2.5, maxX: 2.5, minZ: -161, maxZ: -155
    };
    // Green glow
    var cacheLight = new THREE.PointLight(0x88FF44, 1.5, 12);
    cacheLight.position.set(0, 3, -158);
    state.scene.add(cacheLight);
    state.cacheLight = cacheLight;
    cacheLight.intensity = 0;

    state.nuclearCache = cache;
  }

  // ─── PLAYER MESH ─────────────────────────────────────────────────────────────

  function buildPlayerMesh() {
    var pg = new THREE.CylinderGeometry(0.35, 0.35, 1.7, 8);
    var pm = new THREE.MeshLambertMaterial({ color: 0x2244AA });
    state.playerMesh = new THREE.Mesh(pg, pm);
    state.playerMesh.castShadow = true;
    state.playerMesh.position.set(
      state.playerPos.x, state.playerPos.y - 0.85, state.playerPos.z
    );
    state.scene.add(state.playerMesh);
    state.objects.push(state.playerMesh);
  }

  // ─── ICICLES ON CEILING ──────────────────────────────────────────────────────

  function buildIcicles() {
    var icicleDefs = [
      // Entrance area
      { x: -8, y: 18, z: 10 }, { x: 8, y: 18, z: 15 }, { x: 0, y: 18, z: 5 },
      // Cavern 1
      { x: -10, y: 15, z: -25 }, { x: 5, y: 15, z: -35 }, { x: -5, y: 14, z: -45 },
      { x: 12, y: 15, z: -30 }, { x: -15, y: 16, z: -50 },
      // Cavern 2
      { x: -28, y: 13, z: -70 }, { x: -38, y: 14, z: -78 }, { x: -32, y: 13, z: -88 },
      // Cavern 3
      { x: 28, y: 13, z: -60 }, { x: 38, y: 14, z: -72 },
      // Vault corridor
      { x: -5, y: 12, z: -108 }, { x: 5, y: 12, z: -115 },
      // Cavern 4
      { x: -8, y: 17, z: -125 }, { x: 8, y: 17, z: -130 },
      { x: 0, y: 17, z: -140 }, { x: -12, y: 16, z: -145 }, { x: 12, y: 16, z: -148 }
    ];

    for (var i = 0; i < icicleDefs.length; i++) {
      var id2 = icicleDefs[i];
      var ht = 1.5 + Math.random() * 4;
      var ic = addCone(0.2 + Math.random() * 0.15, ht, 5, COLOR_STALACTITE,
        id2.x, id2.y - ht / 2, id2.z, {});
      ic.rotation.x = Math.PI;
      ic.userData.isStalactite = true;
      ic.userData.fallen = false;
      ic.userData.velY = 0;
      state.icicles.push(ic);
    }
  }

  // ─── EXIT MARKER ─────────────────────────────────────────────────────────────

  function buildExitMarker() {
    // Exit is back at the entrance (player has to escape)
    var exit = addBox(6, 0.2, 6, 0x00FF88, 0, 0.1, 65, {
      transparent: true, opacity: 0.6
    });
    exit.userData.isExit = true;
    exit.userData.bounds = {
      minX: -3, maxX: 3, minZ: 62, maxZ: 68
    };
    state.exitPortal = exit;

    // Exit light
    var exitLight = new THREE.PointLight(0x00FF88, 1.0, 15);
    exitLight.position.set(0, 3, 65);
    state.scene.add(exitLight);
    state.exitLight = exitLight;
  }

  // ─── ENEMIES ─────────────────────────────────────────────────────────────────

  function buildEnemies() {
    // 11 mercenaries
    var mercPositions = [
      { x: -6, z: -22 }, { x: 8, z: -30 }, { x: -12, z: -38 },
      { x: 10, z: -45 }, { x: -4, z: -55 }, { x: 15, z: -35 },
      { x: -18, z: -28 }, { x: 4, z: -62 }, { x: -8, z: -65 },
      { x: 20, z: -55 }, { x: -22, z: -58 }
    ];
    for (var i = 0; i < mercPositions.length; i++) {
      var mp = mercPositions[i];
      spawnMercenary(mp.x, 1, mp.z);
    }

    // 5 ice climbers — appear from above (higher y start)
    var climberPositions = [
      { x: -30, z: -72 }, { x: -38, z: -85 }, { x: 32, z: -62 },
      { x: 40, z: -75 }, { x: 0, z: -95 }
    ];
    for (var j = 0; j < climberPositions.length; j++) {
      var cp2 = climberPositions[j];
      spawnIceClimber(cp2.x, 14, cp2.z);
    }

    // Boss Frostbite
    spawnFrostbite(0, 1, -138);
  }

  function spawnMercenary(x, y, z) {
    var geo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_MERCENARY });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.9, z);
    mesh.castShadow = true;
    mesh.userData = {
      type: 'mercenary',
      hp: 85,
      maxHp: 85,
      alive: true,
      patrolDir: { x: (Math.random() - 0.5), z: (Math.random() - 0.5) },
      patrolTimer: 0,
      fireCooldown: 0,
      fireInterval: 2 + Math.random() * 2,
      baseY: y + 0.9
    };

    // Head
    var headGeo = new THREE.SphereGeometry(0.35, 6, 5);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.1, 0);
    mesh.add(head);

    // Thermal weapon barrel
    var barrelGeo = new THREE.BoxGeometry(0.1, 0.1, 1.0);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0.3, 0.5, -0.8);
    mesh.add(barrel);

    state.scene.add(mesh);
    state.objects.push(mesh);
    state.enemies.push(mesh);
    return mesh;
  }

  function spawnIceClimber(x, y, z) {
    var geo = new THREE.CylinderGeometry(0.38, 0.38, 1.8, 7);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_ICE_CLIMBER });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.9, z);
    mesh.castShadow = true;
    mesh.userData = {
      type: 'iceClimber',
      hp: 90,
      maxHp: 90,
      alive: true,
      descending: true,
      descentSpeed: 2.5 + Math.random(),
      baseY: 1.9,
      targetY: 1.9,
      patrolDir: { x: (Math.random() - 0.5), z: (Math.random() - 0.5) },
      patrolTimer: 0,
      fireCooldown: 0,
      fireInterval: 1.5 + Math.random()
    };

    // Ice pick left
    var pickGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    var pickMat = new THREE.MeshLambertMaterial({ color: 0xCCDDEE });
    var pick = new THREE.Mesh(pickGeo, pickMat);
    pick.position.set(-0.5, 0.3, 0);
    pick.rotation.z = Math.PI / 5;
    mesh.add(pick);

    // Ice pick right
    var pick2 = new THREE.Mesh(pickGeo, pickMat);
    pick2.position.set(0.5, 0.3, 0);
    pick2.rotation.z = -Math.PI / 5;
    mesh.add(pick2);

    state.scene.add(mesh);
    state.objects.push(mesh);
    state.enemies.push(mesh);
    return mesh;
  }

  function spawnFrostbite(x, y, z) {
    var geo = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 8);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_FROSTBITE });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1.1, z);
    mesh.castShadow = true;
    mesh.userData = {
      type: 'frostbite',
      hp: 500,
      maxHp: 500,
      alive: true,
      phase2: false,
      patrolAngle: 0,
      patrolRadius: 8,
      fireCooldown: 0,
      fireInterval: 3,
      grenadesFired: 0,
      baseX: x,
      baseZ: z
    };

    // Large head / helmet
    var headGeo = new THREE.SphereGeometry(0.55, 8, 6);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.25, 0);
    mesh.add(head);

    // Ice armor spikes (cone)
    for (var s = 0; s < 4; s++) {
      var spikeGeo = new THREE.ConeGeometry(0.15, 0.8, 5);
      var spikeMat = new THREE.MeshLambertMaterial({ color: COLOR_ICICLE });
      var spike = new THREE.Mesh(spikeGeo, spikeMat);
      var angle = (s / 4) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.7, 0.3, Math.sin(angle) * 0.7);
      spike.rotation.x = Math.PI / 2;
      spike.rotation.z = angle;
      mesh.add(spike);
    }

    // Blue aura light
    var frostLight = new THREE.PointLight(0x0088FF, 1.2, 12);
    frostLight.position.set(x, y + 3, z);
    state.scene.add(frostLight);
    state.frostbiteLight = frostLight;

    state.scene.add(mesh);
    state.objects.push(mesh);
    state.enemies.push(mesh);
    state.frostbiteMesh = mesh;
    return mesh;
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────

  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'left:0',
      'width:100%',
      'text-align:center',
      'color:#AADDFF',
      'font-family:monospace',
      'font-size:13px',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 8px #0055AA'
    ].join(';');
    document.body.appendChild(state.hudEl);
    updateHUD();
    state.hudInterval = setInterval(updateHUD, 200);
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var temp = Math.round(state.temperature);
    var tempStr = 'TEMP: ' + temp + '%';
    if (state.temperature < 20) tempStr = '[!!HYPOTHERMIA ' + temp + '%!!]';
    var leverStr = 'LEVERS: ' + state.leversPulled + '/3';
    var fbhp = state.frostbiteDefeated ? 'DEFEATED'
      : state.frostbiteHP > 0 ? ('HP:' + Math.round(state.frostbiteHP)) : 'DEFEATED';
    var thinStr = state.onThinIce ? ' [THIN ICE! CRACKS:' + state.thinIceCracks + '/3]' : '';
    var frozenStr = state.frozenTimer > 0 ? ' [FROZEN]' : '';
    var hp = Math.round(state.playerHP);
    var vaultStr = state.vaultOpen ? 'VAULT:OPEN' : 'VAULT:LOCKED';
    var secStr = state.nuclearSecured ? ' CACHE:SECURED' : '';
    state.hudEl.textContent = (
      'GLACIER CAVE | HP:' + hp +
      ' | ' + tempStr +
      ' | ' + leverStr +
      ' | ' + vaultStr + secStr +
      ' | FROSTBITE ' + fbhp +
      thinStr + frozenStr +
      ' | WASD=MOVE E=INTERACT/SECURE F=SHOOT ESC=EXIT'
    );
  }

  // ─── KEY HANDLING ─────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    state.keysDown[e.key] = true;
    state.keyTimes[e.key] = Date.now();

    if (e.key === 'Escape') {
      destroy();
      return;
    }

    if (e.key === 'e' || e.key === 'E') {
      handleInteract();
    }

    if (e.key === 'f' || e.key === 'F') {
      handleShoot();
    }
  }

  function onKeyUp(e) {
    state.keysDown[e.key] = false;
  }

  function onResize() {
    if (!state.camera || !state.renderer) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(w, h);
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
  }

  function unbindKeys() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
  }

  // ─── INTERACT ─────────────────────────────────────────────────────────────────

  function handleInteract() {
    if (state.gameOver || state.victory) return;

    // Pull lever if near one
    for (var i = 0; i < state.leverObjects.length; i++) {
      var lev = state.leverObjects[i];
      if (lev.pulled) continue;
      var dx = state.playerPos.x - lev.x;
      var dz = state.playerPos.z - lev.z;
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        pullLever(lev);
        return;
      }
    }

    // Open vault if all levers pulled and near vault
    if (state.leversPulled >= 3 && !state.vaultOpen) {
      var dvx = state.playerPos.x - 0;
      var dvz = state.playerPos.z - (-154);
      if (Math.sqrt(dvx * dvx + dvz * dvz) < 6) {
        openVault();
        return;
      }
    }

    // Secure nuclear cache (hold E, handled in update — single press starts timer)
    if (state.vaultOpen && !state.nuclearSecured) {
      var ncb = state.nuclearCache && state.nuclearCache.userData.bounds;
      if (ncb) {
        var px = state.playerPos.x;
        var pz = state.playerPos.z;
        if (px > ncb.minX && px < ncb.maxX && pz > ncb.minZ && pz < ncb.maxZ) {
          // Start/continue securing — timer in update loop when E held
          state.securingNuclear = true;
        }
      }
    }
  }

  function pullLever(lev) {
    lev.pulled = true;
    state.leversPulled++;

    // Tilt lever stick
    lev.stick.rotation.z = Math.PI / 3;
    lev.ball.position.y -= 0.6;
    lev.ball.position.z += 0.4;

    // Visual feedback
    lev.stick.material.color.setHex(0x00FF88);
    lev.ball.material.color.setHex(0x00FF44);

    var leverLight = new THREE.PointLight(0x00FF88, 1.5, 8);
    leverLight.position.set(lev.x, lev.y + 2, lev.z);
    state.scene.add(leverLight);

    showMessage('LEVER ' + state.leversPulled + '/3 PULLED' +
      (state.leversPulled === 3 ? ' — VAULT UNLOCKED!' : ''), 0x00FF88);
  }

  function openVault() {
    state.vaultOpen = true;

    // Animate vault door sliding open (set position out of way)
    if (state.vaultDoor) {
      state.vaultDoor.position.x = 10;
      state.vaultDoor.position.y = -5;
    }

    // Reveal nuclear cache
    if (state.nuclearCache) {
      state.nuclearCache.visible = true;
    }
    if (state.cacheLight) {
      state.cacheLight.intensity = 1.5;
    }

    var vaultLight = new THREE.PointLight(0x88FF44, 2.0, 20);
    vaultLight.position.set(0, 5, -150);
    state.scene.add(vaultLight);

    showMessage('VAULT OPEN — SECURE THE NUCLEAR CACHE! (HOLD E FOR 3s)', 0x88FF44);
  }

  // ─── SHOOT ───────────────────────────────────────────────────────────────────

  function handleShoot() {
    if (state.gameOver || state.victory) return;
    if (state.frozenTimer > 0) return; // frozen can't shoot

    // Find closest alive enemy in front of player
    var bestDist = 25;
    var bestEnemy = null;
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.userData.alive) continue;
      var dx = e.position.x - state.playerPos.x;
      var dz = e.position.z - state.playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) {
        bestDist = dist;
        bestEnemy = e;
      }
    }

    if (bestEnemy) {
      var dmg = 25;
      bestEnemy.userData.hp -= dmg;
      // Flash hit
      var origColor = bestEnemy.material.color.getHex();
      bestEnemy.material.color.setHex(0xFF4400);
      var captured = bestEnemy;
      var origHex = origColor;
      setTimeout(function () {
        if (captured.userData.alive) {
          captured.material.color.setHex(origHex);
        }
      }, 100);

      if (bestEnemy.userData.hp <= 0) {
        killEnemy(bestEnemy);
      }
    }
  }

  function killEnemy(e) {
    e.userData.alive = false;
    e.visible = false;
    if (e.userData.type === 'frostbite') {
      state.frostbiteDefeated = true;
      state.frostbiteHP = 0;
      if (state.frostbiteLight) state.frostbiteLight.intensity = 0;
      showMessage('FROSTBITE DEFEATED!', 0x00FF88);
    }
  }

  // ─── MESSAGES ─────────────────────────────────────────────────────────────────

  function showMessage(text, color) {
    var msg = document.createElement('div');
    msg.style.cssText = [
      'position:fixed',
      'top:35%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#' + (color || 0xFFFFFF).toString(16).padStart(6, '0'),
      'font-family:monospace',
      'font-size:20px',
      'z-index:99999',
      'text-align:center',
      'pointer-events:none',
      'text-shadow:0 0 10px #0044AA'
    ].join(';');
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(function () {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 2800);
  }

  function triggerGameOver(reason) {
    if (state.gameOver) return;
    state.gameOver = true;
    var msg = document.createElement('div');
    msg.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FF3333',
      'font-family:monospace',
      'font-size:26px',
      'z-index:99999',
      'text-align:center',
      'text-shadow:0 0 14px #FF0000'
    ].join(';');
    msg.textContent = 'MISSION FAILED: ' + reason;
    document.body.appendChild(msg);
  }

  function triggerVictory() {
    if (state.victory) return;
    state.victory = true;
    var msg = document.createElement('div');
    msg.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:26px',
      'z-index:99999',
      'text-align:center',
      'text-shadow:0 0 14px #00FF88'
    ].join(';');
    msg.textContent = 'MISSION COMPLETE! NUCLEAR CACHE SECURED — GLACIER CAVE CLEARED';
    document.body.appendChild(msg);
  }

  // ─── GAME UPDATE FUNCTIONS ────────────────────────────────────────────────────

  function processInput(dt) {
    if (state.gameOver || state.victory) return;

    var speed = 6;
    if (state.temperature < 20) speed *= 0.6;    // movement slowed 40% below 20%
    if (state.frozenTimer > 0) speed *= 0.15;    // frozen = barely moving

    var moved = false;

    if (state.keysDown['ArrowUp'] || state.keysDown['w'] || state.keysDown['W']) {
      state.playerPos.z -= speed * dt;
      moved = true;
    }
    if (state.keysDown['ArrowDown'] || state.keysDown['s'] || state.keysDown['S']) {
      state.playerPos.z += speed * dt;
      moved = true;
    }
    if (state.keysDown['ArrowLeft'] || state.keysDown['a'] || state.keysDown['A']) {
      state.playerPos.x -= speed * dt;
      moved = true;
    }
    if (state.keysDown['ArrowRight'] || state.keysDown['d'] || state.keysDown['D']) {
      state.playerPos.x += speed * dt;
      moved = true;
    }

    // Nuclear securing — hold E
    if ((state.keysDown['e'] || state.keysDown['E']) && state.vaultOpen && !state.nuclearSecured) {
      var ncb2 = state.nuclearCache && state.nuclearCache.userData.bounds;
      if (ncb2) {
        var ppx = state.playerPos.x;
        var ppz = state.playerPos.z;
        if (ppx > ncb2.minX && ppx < ncb2.maxX && ppz > ncb2.minZ && ppz < ncb2.maxZ) {
          state.nuclearSecureTimer += dt;
          if (state.nuclearSecureTimer >= state.nuclearSecureRequired) {
            state.nuclearSecured = true;
            showMessage('NUCLEAR CACHE SECURED! GET OUT NOW!', 0x00FF88);
          }
        } else {
          state.nuclearSecureTimer = 0;
        }
      }
    }

    return moved;
  }

  function updateTemperature(dt) {
    if (state.gameOver || state.victory) return;

    // Temperature drops in cave
    state.temperature -= 5 * dt;

    // Near heater: temperature rises
    state.nearHeater = false;
    for (var i = 0; i < state.heaters.length; i++) {
      var h = state.heaters[i];
      var dx = state.playerPos.x - h.x;
      var dz = state.playerPos.z - h.z;
      if (Math.sqrt(dx * dx + dz * dz) < 5) {
        state.nearHeater = true;
        state.temperature += 20 * dt;
        break;
      }
    }

    if (state.temperature > 100) state.temperature = 100;

    // Below 0%: take cold damage
    if (state.temperature <= 0) {
      state.temperature = 0;
      state.playerHP -= 10 * dt;
      if (state.playerHP <= 0) {
        state.playerHP = 0;
        triggerGameOver('HYPOTHERMIA — FROZEN TO DEATH IN THE GLACIER');
      }
    }

    // Frozen by ice grenade adds -20% temperature
    if (state.frozenTimer > 0) {
      state.frozenTimer -= dt;
      state.temperature -= 8 * dt;
      if (state.frozenTimer < 0) state.frozenTimer = 0;
    }
  }

  function updateThinIce(dt) {
    if (state.inLake) {
      state.lakeTimer += dt;
      state.playerHP -= 20 * dt;
      state.temperature -= 15 * dt;
      if (state.playerHP <= 0) {
        state.playerHP = 0;
        triggerGameOver('DROWNED IN SUBGLACIAL LAKE');
      }
      // Climb out with E
      if (state.keysDown['e'] || state.keysDown['E']) {
        state.inLake = false;
        state.lakeTimer = 0;
        state.playerPos.y = 1.8;
        state.playerPos.x += 5;
        showMessage('CLIMBED OUT OF THE LAKE! (-20HP)', 0xFFAA00);
      }
      return;
    }

    state.onThinIce = false;
    for (var i = 0; i < state.thinIceSections.length; i++) {
      var thin = state.thinIceSections[i];
      if (thin.userData.broken) continue;
      var b = thin.userData.bounds;
      var px = state.playerPos.x;
      var pz = state.playerPos.z;
      if (px > b.minX && px < b.maxX && pz > b.minZ && pz < b.maxZ) {
        state.onThinIce = true;
        thin.userData.thinTimer = (thin.userData.thinTimer || 0) + dt;

        // Every 0.5s on thin ice: 30% chance to crack
        if (thin.userData.thinTimer > 0.5) {
          thin.userData.thinTimer = 0;
          if (Math.random() < 0.30) {
            thin.userData.cracks++;
            thin.material.opacity = 0.8 - thin.userData.cracks * 0.2;
            showMessage('THIN ICE CRACKING! (' + thin.userData.cracks + '/3)', 0xFFAA00);
            if (thin.userData.cracks >= 3) {
              thin.userData.broken = true;
              thin.visible = false;
              // Player falls in
              state.inLake = true;
              state.playerPos.y = -1;
              state.playerHP -= 20;
              showMessage('FELL THROUGH THIN ICE! (-20HP)', 0xFF4400);
            }
          }
        }
        break;
      }
    }
  }

  function updateEnemies(dt) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.userData.alive) continue;

      var ud = e.userData;

      if (ud.type === 'mercenary') {
        updateMercenary(e, ud, dt);
      } else if (ud.type === 'iceClimber') {
        updateIceClimber(e, ud, dt);
      } else if (ud.type === 'frostbite') {
        updateFrostbossAI(e, ud, dt);
      }
    }
  }

  function updateMercenary(e, ud, dt) {
    // Patrol toward player
    ud.patrolTimer += dt;
    if (ud.patrolTimer > 2.5) {
      ud.patrolTimer = 0;
      var dx0 = state.playerPos.x - e.position.x;
      var dz0 = state.playerPos.z - e.position.z;
      var len = Math.sqrt(dx0 * dx0 + dz0 * dz0) || 1;
      ud.patrolDir = { x: dx0 / len, z: dz0 / len };
    }

    var spd = 2.0;
    e.position.x += ud.patrolDir.x * spd * dt;
    e.position.z += ud.patrolDir.z * spd * dt;

    // Fire at player if in range
    ud.fireCooldown -= dt;
    var ddx = state.playerPos.x - e.position.x;
    var ddz = state.playerPos.z - e.position.z;
    var dist = Math.sqrt(ddx * ddx + ddz * ddz);
    if (dist < 20 && ud.fireCooldown <= 0) {
      ud.fireCooldown = ud.fireInterval;
      state.playerHP -= 8;
      if (state.playerHP <= 0) {
        state.playerHP = 0;
        triggerGameOver('KILLED BY MERCENARY THERMAL FIRE');
      }
    }

    // Face player
    e.rotation.y = Math.atan2(ddx, ddz);
  }

  function updateIceClimber(e, ud, dt) {
    // Descend from ceiling
    if (ud.descending && e.position.y > ud.targetY) {
      e.position.y -= ud.descentSpeed * dt;
      if (e.position.y <= ud.targetY) {
        e.position.y = ud.targetY;
        ud.descending = false;
      }
      return;
    }

    // On ground — melee rush
    ud.patrolTimer += dt;
    if (ud.patrolTimer > 1.5) {
      ud.patrolTimer = 0;
      var dx1 = state.playerPos.x - e.position.x;
      var dz1 = state.playerPos.z - e.position.z;
      var len1 = Math.sqrt(dx1 * dx1 + dz1 * dz1) || 1;
      ud.patrolDir = { x: dx1 / len1, z: dz1 / len1 };
    }

    var spd2 = 3.5;
    e.position.x += ud.patrolDir.x * spd2 * dt;
    e.position.z += ud.patrolDir.z * spd2 * dt;

    // Melee: ice pick damage when close
    var ddx2 = state.playerPos.x - e.position.x;
    var ddz2 = state.playerPos.z - e.position.z;
    var dist2 = Math.sqrt(ddx2 * ddx2 + ddz2 * ddz2);
    ud.fireCooldown -= dt;
    if (dist2 < 2 && ud.fireCooldown <= 0) {
      ud.fireCooldown = ud.fireInterval;
      state.playerHP -= 15;
      if (state.playerHP <= 0) {
        state.playerHP = 0;
        triggerGameOver('KILLED BY ICE CLIMBER MELEE ATTACK');
      }
    }

    e.rotation.y = Math.atan2(ddx2, ddz2);
  }

  function updateFrostbossAI(e, ud, dt) {
    if (!ud.alive) return;

    // Circle patrol
    ud.patrolAngle += 0.5 * dt;
    e.position.x = ud.baseX + Math.cos(ud.patrolAngle) * ud.patrolRadius;
    e.position.z = ud.baseZ + Math.sin(ud.patrolAngle) * ud.patrolRadius;

    // Face player
    var fdx = state.playerPos.x - e.position.x;
    var fdz = state.playerPos.z - e.position.z;
    e.rotation.y = Math.atan2(fdx, fdz);

    // Update boss HP tracking
    state.frostbiteHP = ud.hp;

    // Phase 2 trigger at 50%
    if (!ud.phase2 && ud.hp <= ud.maxHp * 0.5) {
      ud.phase2 = true;
      state.frostbitePhase2 = true;
      triggerStalactiteCollapse();
      showMessage('FROSTBITE PHASE 2 — STALACTITES FALLING!', 0xFF4400);
      ud.fireInterval = 1.8; // fire faster
    }

    // Fire ice grenades
    ud.fireCooldown -= dt;
    var fdist = Math.sqrt(fdx * fdx + fdz * fdz);
    if (fdist < 40 && ud.fireCooldown <= 0) {
      ud.fireCooldown = ud.fireInterval;
      fireIceGrenade(e.position.x, e.position.y + 1, e.position.z);
    }

    // Update aura light position
    if (state.frostbiteLight) {
      state.frostbiteLight.position.x = e.position.x;
      state.frostbiteLight.position.z = e.position.z;
    }
  }

  function fireIceGrenade(fromX, fromY, fromZ) {
    var geo = new THREE.SphereGeometry(0.3, 7, 5);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCCEEFF });
    var grenade = new THREE.Mesh(geo, mat);
    grenade.position.set(fromX, fromY, fromZ);

    var dx = state.playerPos.x - fromX;
    var dz = state.playerPos.z - fromZ;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    grenade.userData.vel = {
      x: (dx / dist) * 14,
      y: 3,
      z: (dz / dist) * 14
    };
    grenade.userData.life = 4;
    grenade.userData.isIceGrenade = true;

    // Grenade light
    var gLight = new THREE.PointLight(0x88CCFF, 0.8, 6);
    gLight.position.copy(grenade.position);
    state.scene.add(gLight);
    grenade.userData.light = gLight;

    state.scene.add(grenade);
    state.objects.push(grenade);
    state.icyGrenades.push(grenade);
  }

  function updateIceGrenades(dt) {
    for (var i = state.icyGrenades.length - 1; i >= 0; i--) {
      var g = state.icyGrenades[i];
      if (!g.parent) {
        state.icyGrenades.splice(i, 1);
        continue;
      }

      g.userData.life -= dt;
      g.userData.vel.y -= 9 * dt; // gravity

      g.position.x += g.userData.vel.x * dt;
      g.position.y += g.userData.vel.y * dt;
      g.position.z += g.userData.vel.z * dt;

      if (g.userData.light) {
        g.userData.light.position.copy(g.position);
      }

      // Check player hit
      var gdx = state.playerPos.x - g.position.x;
      var gdz = state.playerPos.z - g.position.z;
      var gdy = state.playerPos.y - g.position.y;
      if (Math.sqrt(gdx * gdx + gdy * gdy + gdz * gdz) < 1.5) {
        // Hit! 35 damage + freeze
        state.playerHP -= 35;
        state.frozenTimer = 3.5;
        state.temperature -= 15;
        showMessage('HIT BY ICE GRENADE! FROZEN! (-35HP)', 0x88CCFF);
        if (state.playerHP <= 0) {
          state.playerHP = 0;
          triggerGameOver('KILLED BY FROSTBITE ICE GRENADE');
        }
        removeGrenade(g, i);
        continue;
      }

      // Expire or hit ground
      if (g.userData.life <= 0 || g.position.y < -1) {
        removeGrenade(g, i);
      }
    }
  }

  function removeGrenade(g, i) {
    if (g.userData.light && g.userData.light.parent) {
      state.scene.remove(g.userData.light);
    }
    state.scene.remove(g);
    state.icyGrenades.splice(i, 1);
  }

  function triggerStalactiteCollapse() {
    state.stalactiteCollapse = true;
    // Pick 3 random icicles from the vault area / cavern 4 to fall
    var vaultIcicles = [];
    for (var i = 0; i < state.icicles.length; i++) {
      var ic = state.icicles[i];
      if (ic.position.z < -120 && !ic.userData.fallen) {
        vaultIcicles.push(ic);
      }
    }
    // Shuffle and pick up to 3
    vaultIcicles.sort(function () { return Math.random() - 0.5; });
    var count = Math.min(3, vaultIcicles.length);
    for (var j = 0; j < count; j++) {
      vaultIcicles[j].userData.falling = true;
      vaultIcicles[j].userData.velY = 0;
    }
    state.stalactiteObjects = vaultIcicles.slice(0, count);
  }

  function updateStalactites(dt) {
    for (var i = 0; i < state.icicles.length; i++) {
      var ic = state.icicles[i];
      if (!ic.userData.falling || ic.userData.fallen) continue;

      ic.userData.velY = (ic.userData.velY || 0) + 18 * dt;
      ic.position.y -= ic.userData.velY * dt;
      ic.rotation.x = 0; // un-invert as it falls
      ic.rotation.z += 1.5 * dt;

      // Rotation back to upright as it falls
      ic.rotation.x += 2 * dt;

      // Check if hits ground
      if (ic.position.y < 0.5) {
        ic.userData.fallen = true;
        ic.userData.falling = false;

        // Check player hit
        var sdx = state.playerPos.x - ic.position.x;
        var sdz = state.playerPos.z - ic.position.z;
        if (Math.sqrt(sdx * sdx + sdz * sdz) < 2.5) {
          state.playerHP -= 40;
          showMessage('HIT BY STALACTITE! (-40HP)', 0xFF4400);
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            triggerGameOver('CRUSHED BY STALACTITE COLLAPSE');
          }
        }
      }
    }
  }

  function updatePlayerMesh() {
    if (!state.playerMesh) return;
    state.playerMesh.position.set(
      state.playerPos.x,
      state.playerPos.y - 0.85,
      state.playerPos.z
    );

    // Bobble if moving
    var hasMove = (
      state.keysDown['ArrowUp'] || state.keysDown['w'] || state.keysDown['W'] ||
      state.keysDown['ArrowDown'] || state.keysDown['s'] || state.keysDown['S'] ||
      state.keysDown['ArrowLeft'] || state.keysDown['a'] || state.keysDown['A'] ||
      state.keysDown['ArrowRight'] || state.keysDown['d'] || state.keysDown['D']
    );
    if (hasMove) {
      state.playerMesh.position.y += Math.sin(Date.now() * 0.01) * 0.04;
    }
  }

  function updateCamera() {
    if (!state.camera) return;
    state.camera.position.set(
      state.playerPos.x,
      state.playerPos.y + 6,
      state.playerPos.z + 16
    );
    state.camera.lookAt(
      state.playerPos.x,
      state.playerPos.y,
      state.playerPos.z - 4
    );
  }

  function checkVictory() {
    if (state.victory || state.gameOver) return;

    // Win condition: all levers, vault open, nuclear secured, frostbite defeated, at exit
    if (
      state.leversPulled >= 3 &&
      state.vaultOpen &&
      state.nuclearSecured &&
      state.frostbiteDefeated
    ) {
      // Check if player is at exit
      var ex = state.exitPortal;
      if (ex) {
        var eb = ex.userData.bounds;
        if (eb &&
          state.playerPos.x > eb.minX && state.playerPos.x < eb.maxX &&
          state.playerPos.z > eb.minZ && state.playerPos.z < eb.maxZ) {
          triggerVictory();
        }
      }
    }
  }

  function animateEnvironment(dt) {
    // Pulsate thin ice color
    var t = Date.now() * 0.001;
    for (var i = 0; i < state.thinIceSections.length; i++) {
      var thin = state.thinIceSections[i];
      if (!thin.userData.broken) {
        var pulse = 0.5 + 0.3 * Math.sin(t * 2 + i);
        thin.material.opacity = pulse;
      }
    }

    // Frostbite aura flicker
    if (state.frostbiteLight && state.frostbiteMesh && state.frostbiteMesh.userData.alive) {
      state.frostbiteLight.intensity = 0.8 + 0.5 * Math.sin(t * 3);
    }

    // Exit light pulse
    if (state.exitLight && state.nuclearSecured && state.frostbiteDefeated) {
      state.exitLight.intensity = 1.0 + 0.8 * Math.sin(t * 4);
      state.exitPortal && (state.exitPortal.material.opacity = 0.5 + 0.4 * Math.sin(t * 4));
    }

    // Nuclear securing progress flash
    if (state.nuclearSecureTimer > 0 && !state.nuclearSecured) {
      var prog = state.nuclearSecureTimer / state.nuclearSecureRequired;
      if (state.cacheLight) {
        state.cacheLight.intensity = 1.5 + 2 * prog * Math.sin(t * 8);
      }
    }
  }

  // ─── MAIN LOOP ───────────────────────────────────────────────────────────────

  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
    state.lastTime = timestamp;
    if (dt <= 0) dt = 0.016;

    processInput(dt);
    updateTemperature(dt);
    updateThinIce(dt);
    updateEnemies(dt);
    updateIceGrenades(dt);
    updateStalactites(dt);
    updatePlayerMesh();
    updateCamera();
    animateEnvironment(dt);
    checkVictory();

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // ─── ACTIVATION KEY HANDLER ──────────────────────────────────────────────────

  var _pendingActivation = {};

  function handleActivationKey(e) {
    var key = e.key.toLowerCase();
    var now = Date.now();

    if (key === ACTIVATION_KEY_A) {
      _pendingActivation['g'] = now;
    }
    if (key === ACTIVATION_KEY_B) {
      _pendingActivation['c'] = now;
    }

    var tG = _pendingActivation['g'] || 0;
    var tC = _pendingActivation['c'] || 0;
    if (tG && tC && Math.abs(tG - tC) < ACTIVATION_WINDOW) {
      _pendingActivation = {};
      if (!state.active) {
        init();
      } else {
        destroy();
      }
    }
  }

  document.addEventListener('keydown', handleActivationKey);

  // ─── PUBLIC API ──────────────────────────────────────────────────────────────

  function reset() {
    destroy();
    setTimeout(init, 50);
  }

  function update(dt) {
    // External update hook (no-op: driven by own rAF loop)
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
