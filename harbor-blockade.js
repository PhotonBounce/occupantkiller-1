window.HarborBlockade = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var keyState = {};
  var lastKeyH = 0;

  // player
  var playerHP = 100;
  var playerPos = { x: 0, y: 1.8, z: 20 };
  var playerVel = { x: 0, y: 0, z: 0 };
  var yaw = 0, pitch = 0;
  var onGround = true;
  var inWater = false;
  var score = 0;

  // game objects
  var enemies = [];
  var turrets = [];
  var fuelTanks = [];
  var hostages = [];
  var strikeMarkers = [];
  var particles = [];
  var extractionDock = null;

  // boss
  var kessler = null;
  var kesslerPhase2 = false;
  var kesslerStrikeTimer = 0;

  // win/lose
  var gameOver = false;
  var gameWon = false;
  var turretsDestroyed = 0;
  var hostagesFreed = 0;
  var freeingHostage = null;
  var freeingTimer = 0;

  // mouse look
  var mouseDX = 0, mouseDY = 0;
  var pointerLocked = false;

  // shooting cooldown
  var shootCooldown = 0;

  // HUD element
  var hudEl = null;
  var overlayEl = null;

  // container element provided by init
  var container = null;

  // damage flash tracking
  var lastHP = 100;

  // ── material / mesh helpers ────────────────────────────────────────────────
  // Creates a MeshLambertMaterial with the given color and optional params.
  // opts may include: transparent, opacity, emissive, emissiveIntensity
  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.transparent) params.transparent = true;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
      if (opts.emissive !== undefined) params.emissive = opts.emissive;
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  // Adds a BoxGeometry mesh to the scene at the specified position.
  // Returns the created mesh for further manipulation.
  function addBox(sc, w, h, d, color, x, y, z, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, opts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sc.add(mesh);
    return mesh;
  }

  // Adds a CylinderGeometry mesh (top radius, bottom radius, height, segments).
  // Returns the created mesh.
  function addCyl(sc, rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    sc.add(mesh);
    return mesh;
  }

  // Adds a SphereGeometry mesh to the scene.
  function addSphere(sc, radius, wSegs, hSegs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(radius, wSegs, hSegs);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    sc.add(mesh);
    return mesh;
  }

  // Adds a ConeGeometry mesh to the scene.
  function addCone(sc, radius, height, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(radius, height, segs);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    sc.add(mesh);
    return mesh;
  }

  // 3D distance between two {x,y,z} objects
  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // 2D (XZ plane) distance between two objects with x,z properties
  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── build environment ──────────────────────────────────────────────────────
  function buildEnvironment() {
    // Sky color — overcast harbor morning
    scene.background = new THREE.Color(0x7ab0d4);

    // Fog for atmosphere — limits visibility over water
    scene.fog = new THREE.Fog(0x7ab0d4, 60, 220);

    // ── Lighting ──
    // Ambient light — soft blue-tinted fill light simulating open sky
    var ambient = new THREE.AmbientLight(0x334455, 0.8);
    scene.add(ambient);

    // Main sun directional light — warm morning light from the east
    var sun = new THREE.DirectionalLight(0xfff0cc, 1.2);
    sun.position.set(60, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    // Soft fill light from the west for shadow softening
    var fillLight = new THREE.DirectionalLight(0x4466aa, 0.3);
    fillLight.position.set(-40, 30, -20);
    scene.add(fillLight);

    // ── Water surface ──
    // Large flat dark-blue sea surface plane
    addBox(scene, 300, 0.5, 300, 0x0a2a4a, 0, -0.25, 0);
    // Slightly lighter water highlights near shore
    addBox(scene, 30, 0.1, 30, 0x0d3560, 0, -0.15, -20);

    // ── Shore platforms ──
    // Left shore — naval base side
    addBox(scene, 80, 2, 40, 0x8b7355, -40, 1, 15);
    // Gravel texture detail on left shore
    addBox(scene, 78, 0.15, 38, 0x7a6644, -40, 2.08, 15);
    // Right shore — fuel depot and warehouse side
    addBox(scene, 80, 2, 40, 0x8b7355, 40, 1, 15);
    addBox(scene, 78, 0.15, 38, 0x7a6644, 40, 2.08, 15);

    // Shore retaining wall edges
    addBox(scene, 80, 1.5, 1, 0x6b5a3a, -40, 1.5, -4);
    addBox(scene, 80, 1.5, 1, 0x6b5a3a, 40, 1.5, -4);
    addBox(scene, 1, 1.5, 40, 0x6b5a3a, -80, 1.5, 15);
    addBox(scene, 1, 1.5, 40, 0x6b5a3a, 80, 1.5, 15);

    // ── Main dock / pier ──
    // Central pier — main walkway connecting shore to cross pier
    addBox(scene, 6, 1, 60, 0x6b4f2a, 0, 0.5, -10);
    // Cross pier — horizontal walkway at waterline
    addBox(scene, 40, 1, 6, 0x6b4f2a, 0, 0.5, -40);

    // Pier plank detail — evenly spaced planks across main pier
    for (var pi = 0; pi < 12; pi++) {
      addBox(scene, 5.8, 0.12, 0.28, 0x5a3e1e, 0, 1.06, -3 + pi * (-4.8));
    }

    // Cross pier planks
    for (var cpi = 0; cpi < 7; cpi++) {
      addBox(scene, 0.28, 0.12, 5.8, 0x5a3e1e, -14 + cpi * 4.8, 1.06, -40);
    }

    // Pier support pilings beneath waterline — cylindrical wooden posts
    for (var piling = 0; piling < 6; piling++) {
      addCyl(scene, 0.25, 0.3, 5, 6, 0x4a3218, -2, -2, -5 + piling * (-8));
      addCyl(scene, 0.25, 0.3, 5, 6, 0x4a3218, 2, -2, -5 + piling * (-8));
    }

    // Cross pier support pilings
    for (var cpil = 0; cpil < 4; cpil++) {
      addCyl(scene, 0.25, 0.3, 5, 6, 0x4a3218, -12 + cpil * 8, -2, -40);
    }

    // Bollards on pier — heavy iron mooring posts
    var bollardPos = [
      [-2.5, 1.3, 5], [2.5, 1.3, 5],
      [-2.5, 1.3, -5], [2.5, 1.3, -5],
      [-2.5, 1.3, -15], [2.5, 1.3, -15],
      [-2.5, 1.3, -25], [2.5, 1.3, -25],
      [-2.5, 1.3, -37], [2.5, 1.3, -37],
      [-18, 1.3, -40], [18, 1.3, -40],
      [-18, 1.3, -42], [18, 1.3, -42]
    ];
    for (var bi = 0; bi < bollardPos.length; bi++) {
      var bp = bollardPos[bi];
      // Bollard shaft
      addCyl(scene, 0.28, 0.32, 1.1, 8, 0x2a1a08, bp[0], bp[1], bp[2]);
      // Bollard top cap (wider flange)
      addCyl(scene, 0.4, 0.4, 0.18, 8, 0x1e1208, bp[0], bp[1] + 0.64, bp[2]);
    }

    // Rope coils on pier (decorative flat cylinders)
    addCyl(scene, 0.5, 0.5, 0.15, 10, 0xaa8855, -1.5, 1.08, 3);
    addCyl(scene, 0.5, 0.5, 0.15, 10, 0xaa8855, 1.8, 1.08, -8);
    addCyl(scene, 0.5, 0.5, 0.15, 10, 0xaa8855, -1.8, 1.08, -22);

    // ── Naval base buildings (left shore) ──
    // Command/HQ building — largest structure
    addBox(scene, 14, 8, 12, 0x889977, -50, 5, 22);
    // Roof detail
    addBox(scene, 14.5, 0.5, 12.5, 0x778866, -50, 9.25, 22);
    // HQ door
    addBox(scene, 2.5, 3.5, 0.2, 0x4a3420, -50, 3.25, 16.1);
    // HQ windows
    addBox(scene, 1.5, 1.2, 0.15, 0x4488bb, -46, 6, 16.1);
    addBox(scene, 1.5, 1.2, 0.15, 0x4488bb, -50, 6, 16.1);
    addBox(scene, 1.5, 1.2, 0.15, 0x4488bb, -54, 6, 16.1);

    // Barracks building
    addBox(scene, 10, 5, 8, 0x778866, -38, 3.5, 20);
    addBox(scene, 10.4, 0.4, 8.4, 0x667755, -38, 5.95, 20);
    addBox(scene, 1.2, 1.0, 0.12, 0x4488bb, -35, 4, 16.1);
    addBox(scene, 1.2, 1.0, 0.12, 0x4488bb, -41, 4, 16.1);

    // Signal tower / radio mast on left shore
    addBox(scene, 1.5, 14, 1.5, 0x667766, -62, 8, 18);
    addBox(scene, 5, 0.3, 0.3, 0x667766, -62, 14, 18);
    addBox(scene, 0.2, 0.2, 5, 0x667766, -62, 14, 18);
    addCyl(scene, 0.5, 0.5, 3, 6, 0xcc2200, -62, 15.5, 18); // red light

    // ── Naval base buildings (right shore) ──
    // East watchtower
    addBox(scene, 8, 6, 8, 0x778866, 55, 4, 20);
    addBox(scene, 8.5, 0.5, 8.5, 0x667755, 55, 7.25, 20);
    // Watchtower observation deck extension
    addBox(scene, 5, 0.4, 5, 0x6b5a3a, 55, 7.45, 20);
    addBox(scene, 0.2, 2, 5, 0x556644, 52.5, 8.45, 20);
    addBox(scene, 0.2, 2, 5, 0x556644, 57.5, 8.45, 20);

    // Main warehouse / armory
    addBox(scene, 12, 10, 10, 0x667755, 44, 6, 18);
    addBox(scene, 12.5, 0.5, 10.5, 0x556644, 44, 11.25, 18);
    addBox(scene, 3, 4, 0.15, 0x4a3420, 44, 3, 13.1);
    addBox(scene, 1.4, 1.1, 0.12, 0x4488bb, 40, 7, 13.1);
    addBox(scene, 1.4, 1.1, 0.12, 0x4488bb, 44, 7, 13.1);
    addBox(scene, 1.4, 1.1, 0.12, 0x4488bb, 48, 7, 13.1);

    // Storage sheds
    addBox(scene, 6, 3.5, 5, 0x7a7060, 68, 2.75, 14);
    addBox(scene, 6, 3.5, 5, 0x7a7060, 68, 2.75, 23);

    // Shore road markings (flat stripes)
    for (var roadMark = 0; roadMark < 5; roadMark++) {
      addBox(scene, 0.5, 0.05, 3, 0xeeeecc, -30, 2.05, 5 + roadMark * 5);
    }

    // ── Crane (LineSegments gantry structure) ──
    buildCrane(30, 0, 18);

    // ── Fuel depot (4 CylinderGeometry tanks) ──
    buildFuelDepot();

    // ── Cargo ship (captured vessel) ──
    buildCargoShip();

    // ── Command ship (enemy warship) ──
    buildCommandShip();

    // ── Extraction dock (goal) ──
    // Bright yellow dock platform — the escape point
    var extDockMesh = addBox(scene, 10, 0.6, 8, 0xffcc00, -15, 0.6, 22);
    extractionDock = { mesh: extDockMesh, pos: { x: -15, y: 0.6, z: 22 } };
    // Marker post
    addBox(scene, 0.3, 3.5, 0.3, 0xffaa00, -15, 2.55, 22);
    // Extraction flag
    addBox(scene, 2, 1.2, 0.05, 0xff6600, -14, 4.3, 22);
    // Dock edge bumpers
    addBox(scene, 10, 0.4, 0.4, 0xff8800, -15, 0.8, 18.2);
    addBox(scene, 10, 0.4, 0.4, 0xff8800, -15, 0.8, 25.8);
    addBox(scene, 0.4, 0.4, 8, 0xff8800, -19.8, 0.8, 22);
    addBox(scene, 0.4, 0.4, 8, 0xff8800, -10.2, 0.8, 22);
  }

  // ── crane gantry structure ─────────────────────────────────────────────────
  // Built using LineSegments geometry as required — forms an industrial crane
  function buildCrane(cx, cy, cz) {
    var points = [];

    // Helper to add a line segment (two endpoints) to the points array
    function addLine(x1, y1, z1, x2, y2, z2) {
      points.push(new THREE.Vector3(x1 + cx, y1 + cy, z1 + cz));
      points.push(new THREE.Vector3(x2 + cx, y2 + cy, z2 + cz));
    }

    // ── Four vertical corner columns ──
    addLine(-4, 0, -3, -4, 20, -3);
    addLine(4, 0, -3, 4, 20, -3);
    addLine(-4, 0, 3, -4, 20, 3);
    addLine(4, 0, 3, 4, 20, 3);

    // ── Horizontal rungs at regular intervals ──
    for (var ri = 0; ri <= 5; ri++) {
      var ry = ri * 4;
      addLine(-4, ry, -3, 4, ry, -3);   // front horizontal
      addLine(-4, ry, 3, 4, ry, 3);     // back horizontal
      addLine(-4, ry, -3, -4, ry, 3);   // left lateral
      addLine(4, ry, -3, 4, ry, 3);     // right lateral
      // Cross bracing on front face
      addLine(-4, ry, -3, 4, ry + 4, -3);
    }

    // ── Top horizontal frame ──
    addLine(-4, 20, -3, 4, 20, -3);
    addLine(-4, 20, 3, 4, 20, 3);
    addLine(-4, 20, -3, -4, 20, 3);
    addLine(4, 20, -3, 4, 20, 3);
    // Top diagonals
    addLine(-4, 20, -3, 4, 20, 3);
    addLine(4, 20, -3, -4, 20, 3);

    // ── Boom arm extending out from top ──
    addLine(0, 20, 0, 18, 20, 0);
    addLine(0, 20, 0, 18, 17.5, 0);
    addLine(18, 20, 0, 18, 17.5, 0);
    // Boom sub-truss
    addLine(6, 20, 0, 6, 18.5, 0);
    addLine(12, 20, 0, 12, 18, 0);
    addLine(0, 20, 0, 6, 18.5, 0);
    addLine(6, 18.5, 0, 12, 18, 0);
    addLine(12, 18, 0, 18, 17.5, 0);

    // ── Hoist cable ──
    addLine(18, 20, 0, 18, 4, 0);
    addLine(16, 20, 0, 18, 4, 0);
    addLine(20, 20, 0, 18, 4, 0);
    // Hook
    addLine(17.5, 4, 0, 18.5, 4, 0);
    addLine(17.5, 4, 0, 17.5, 3, 0);
    addLine(18.5, 4, 0, 18.5, 3.2, 0);

    // ── Counter-jib (back arm for balance) ──
    addLine(0, 20, 0, -6, 20, 0);
    addLine(-6, 20, 0, -6, 18, 0);
    addLine(0, 20, 0, -6, 18, 0);
    // Counter-weight block
    addLine(-5, 18, -1, -7, 18, -1);
    addLine(-5, 18, 1, -7, 18, 1);
    addLine(-5, 18, -1, -5, 16, -1);
    addLine(-7, 18, -1, -7, 16, -1);
    addLine(-5, 16, -1, -7, 16, -1);

    // ── Diagonal cross-braces on sides ──
    addLine(-4, 0, -3, 4, 8, -3);
    addLine(4, 0, -3, -4, 8, -3);
    addLine(-4, 0, 3, 4, 8, 3);
    addLine(4, 0, 3, -4, 8, 3);
    addLine(-4, 8, -3, 4, 16, -3);
    addLine(4, 8, -3, -4, 16, -3);

    // ── Ladder on front face ──
    addLine(-4.5, 0, -3, -4.5, 20, -3);
    addLine(-5, 0, -3, -4, 0, -3);
    for (var lr = 1; lr <= 9; lr++) {
      addLine(-5, lr * 2, -3, -4, lr * 2, -3);
    }

    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xcc8800, linewidth: 2 });
    var lines = new THREE.LineSegments(geo, mat);
    scene.add(lines);

    // Solid base block for crane foundation
    addBox(scene, 10, 1.2, 8, 0x554433, cx, 0.6, cz);
    // Operator cab at top of mast
    addBox(scene, 2.5, 2, 2.5, 0x667744, cx, 21, cz);
  }

  // ── fuel depot ────────────────────────────────────────────────────────────
  // 4 cylindrical fuel tanks — explosive when shot, chain reaction on a timer
  function buildFuelDepot() {
    var tankPositions = [
      { x: 55, z: -5 },
      { x: 63, z: -5 },
      { x: 55, z: -13 },
      { x: 63, z: -13 }
    ];

    for (var ti = 0; ti < tankPositions.length; ti++) {
      var tp = tankPositions[ti];
      // Main tank cylinder
      var tank = addCyl(scene, 3, 3, 6, 12, 0xcc4400, tp.x, 4, tp.z);
      tank.userData.fuelTankIndex = ti;
      tank.userData.exploded = false;
      tank.userData.explodeTimer = -1;
      tank.userData.pos = { x: tp.x, y: 4, z: tp.z };
      fuelTanks.push(tank);

      // Tank top cap (flat ring)
      addCyl(scene, 3.1, 3.1, 0.3, 12, 0xaa3300, tp.x, 7.15, tp.z);
      // Tank bottom ring
      addCyl(scene, 3.1, 3.1, 0.3, 12, 0xaa3300, tp.x, 0.85, tp.z);
      // Horizontal stripes (warning bands)
      addCyl(scene, 3.05, 3.05, 0.3, 12, 0xeeee00, tp.x, 3, tp.z);
      addCyl(scene, 3.05, 3.05, 0.3, 12, 0xeeee00, tp.x, 5, tp.z);
      // Pipe connections between tanks
      addBox(scene, 0.25, 0.25, 4, 0x888888, tp.x + 2.8, 2, tp.z + 3);
      // Ladder on each tank
      addBox(scene, 0.12, 6, 0.12, 0x666666, tp.x + 3, 4, tp.z);
      for (var rung = 0; rung < 5; rung++) {
        addBox(scene, 0.8, 0.1, 0.1, 0x666666, tp.x + 3, 1.2 + rung * 1.2, tp.z);
      }
    }

    // Inter-tank piping manifold
    addBox(scene, 0.25, 0.25, 9, 0x888888, 55, 1.5, -9);
    addBox(scene, 9, 0.25, 0.25, 0x888888, 59, 1.5, -5);
    addBox(scene, 9, 0.25, 0.25, 0x888888, 59, 1.5, -13);
    // Valve wheels (small cylinders)
    addCyl(scene, 0.4, 0.4, 0.1, 8, 0x444444, 59, 2.2, -5);
    addCyl(scene, 0.4, 0.4, 0.1, 8, 0x444444, 59, 2.2, -13);

    // Depot platform / bund wall
    addBox(scene, 20, 0.5, 20, 0x666655, 59, 0.25, -9);
    // Bund wall (containment)
    addBox(scene, 20, 0.8, 0.4, 0x555544, 59, 0.65, -19.2);
    addBox(scene, 20, 0.8, 0.4, 0x555544, 59, 0.65, 1.2);
    addBox(scene, 0.4, 0.8, 20, 0x555544, 49.2, 0.65, -9);
    addBox(scene, 0.4, 0.8, 20, 0x555544, 68.8, 0.65, -9);

    // Fence posts and rails around depot
    for (var fi = 0; fi < 5; fi++) {
      addCyl(scene, 0.1, 0.1, 2.5, 4, 0x555555, 50 + fi * 4, 1.5, -1);
      addCyl(scene, 0.1, 0.1, 2.5, 4, 0x555555, 50 + fi * 4, 1.5, -18);
    }
    for (var fsi = 0; fsi < 4; fsi++) {
      addCyl(scene, 0.1, 0.1, 2.5, 4, 0x555555, 50, 1.5, -3 - fsi * 4);
      addCyl(scene, 0.1, 0.1, 2.5, 4, 0x555555, 68, 1.5, -3 - fsi * 4);
    }

    // Warning sign post near depot entrance
    addBox(scene, 0.15, 2.5, 0.15, 0x888844, 51, 2, -1.5);
    addBox(scene, 1.2, 0.8, 0.08, 0xffcc00, 51, 3, -1.5);
  }

  // ── cargo ship ────────────────────────────────────────────────────────────
  // The captured vessel with 3 hostages locked in the cargo hold
  function buildCargoShip() {
    // Main hull — wide barge-like freighter shape
    var hull = addBox(scene, 22, 4, 60, 0x8b6914, -20, 2, -35);
    hull.userData.shipPart = 'cargo';

    // Hull bottom keel
    addBox(scene, 18, 1, 58, 0x7a5c0a, -20, -0.5, -35);

    // Bow slope (front of ship)
    addBox(scene, 20, 3, 5, 0x9a7520, -20, 2.5, -63);
    addBox(scene, 16, 2.5, 4, 0x8a6510, -20, 2.5, -67);

    // Stern details
    addBox(scene, 20, 2, 4, 0x8a6510, -20, 2.5, -8);

    // Deck surface
    addBox(scene, 20, 0.5, 58, 0x7a5c10, -20, 4.25, -35);
    // Deck non-slip pattern strips
    for (var ds = 0; ds < 8; ds++) {
      addBox(scene, 20, 0.06, 0.4, 0x6a4c08, -20, 4.52, -10 - ds * 6.5);
    }

    // Bridge superstructure — rear section
    addBox(scene, 10, 8, 10, 0x9a7920, -20, 8.5, -18);
    addBox(scene, 8, 3, 8, 0x8a6918, -20, 13, -18);
    // Bridge windows
    addBox(scene, 6, 1.2, 0.15, 0x88bbdd, -20, 13.5, -14.05);
    addBox(scene, 6, 1.2, 0.15, 0x88bbdd, -20, 13.5, -22.05);
    // Bridge top deck
    addBox(scene, 8.5, 0.4, 8.5, 0x7a5c10, -20, 14.7, -18);
    // Mast on bridge
    addCyl(scene, 0.2, 0.2, 8, 4, 0x666655, -20, 19, -18);
    addBox(scene, 5, 0.2, 0.2, 0x666655, -20, 21.5, -18);

    // Funnel/exhaust stack
    addCyl(scene, 1.0, 1.3, 4, 8, 0x555544, -17, 12, -18);
    addCyl(scene, 1.1, 1.0, 0.8, 8, 0x111111, -17, 14, -18);

    // ── Stacked shipping containers ──
    var containerColors = [0xcc2200, 0x2266cc, 0x22aa44, 0xccaa00, 0x884422, 0x226688];
    var containerLayout = [
      { x: -20, z: -36 }, { x: -14, z: -36 }, { x: -26, z: -36 },
      { x: -20, z: -44 }, { x: -14, z: -44 }, { x: -26, z: -44 },
      { x: -20, z: -52 }, { x: -14, z: -52 }
    ];
    for (var ci = 0; ci < containerLayout.length; ci++) {
      var cl = containerLayout[ci];
      var col = containerColors[ci % containerColors.length];
      // Ground layer containers
      addBox(scene, 5.5, 3, 9, col, cl.x, 6.5, cl.z);
      // Container door markings
      addBox(scene, 0.06, 2.6, 8.8, 0x888888, cl.x + 2.7, 6.5, cl.z);
      // Second layer
      if (ci < 6) {
        var col2 = containerColors[(ci + 2) % containerColors.length];
        addBox(scene, 5.5, 3, 9, col2, cl.x, 9.7, cl.z);
      }
      // Third layer on first three
      if (ci < 3) {
        var col3 = containerColors[(ci + 4) % containerColors.length];
        addBox(scene, 5.5, 3, 9, col3, cl.x, 12.9, cl.z);
      }
    }

    // ── Cargo hold hostages ──
    // Three crew members locked in the hold beneath the main deck
    for (var hi = 0; hi < 3; hi++) {
      var hx = -20 + (hi - 1) * 5;
      var hz = -58 + hi * 2.5;

      // Hostage body mesh
      var hostageGeo = new THREE.BoxGeometry(0.7, 1.8, 0.4);
      var hostageMat = makeMat(0xffcc88);
      var hostageMesh = new THREE.Mesh(hostageGeo, hostageMat);
      hostageMesh.position.set(hx, 5.4, hz);
      scene.add(hostageMesh);

      // Hostage head
      var hHeadGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      var hHeadMat = makeMat(0xffcc88);
      var hHeadMesh = new THREE.Mesh(hHeadGeo, hHeadMat);
      hHeadMesh.position.set(hx, 6.48, hz);
      scene.add(hHeadMesh);

      // Cage bars surrounding each hostage — cylindrical iron bars
      for (var bar = 0; bar < 8; bar++) {
        var angle = (bar / 8) * Math.PI * 2;
        addCyl(scene, 0.05, 0.05, 2.4, 4, 0x777777,
          hx + Math.cos(angle) * 1.3,
          5.6,
          hz + Math.sin(angle) * 1.3);
      }
      // Cage top ring
      addCyl(scene, 1.3, 1.3, 0.1, 12, 0x666666, hx, 6.8, hz);
      // Cage bottom ring
      addCyl(scene, 1.3, 1.3, 0.1, 12, 0x666666, hx, 4.4, hz);

      // "FREE ME" indicator — small glowing marker above cage
      addBox(scene, 0.6, 0.6, 0.6, 0x00ffcc, hx, 7.6, hz,
        { emissive: 0x00ffcc, emissiveIntensity: 0.4 });

      hostages.push({
        mesh: hostageMesh,
        headMesh: hHeadMesh,
        pos: { x: hx, y: 5.4, z: hz },
        freed: false,
        index: hi
      });
    }

    // Mooring lines from cargo ship to dock
    addBox(scene, 0.12, 0.12, 12, 0x8b7355, -9.1, 2.5, -13);
    addBox(scene, 0.12, 0.12, 12, 0x8b7355, -9.1, 2.5, -58);
    // Anchor chain segment (port side)
    for (var ac = 0; ac < 4; ac++) {
      addCyl(scene, 0.15, 0.15, 0.6, 6, 0x888888, -31, 1.5 - ac * 0.8, -65 + ac);
    }
  }

  // ── command ship ──────────────────────────────────────────────────────────
  // The enemy warship — Kessler's flagship with two gun turrets
  function buildCommandShip() {
    // ── Main hull — gray naval warship ──
    addBox(scene, 18, 3.5, 70, 0x556677, 25, 1.75, -35);
    // Hull waterline stripe
    addBox(scene, 18.2, 0.4, 70.2, 0x223344, 25, 0.2, -35);
    // Hull keel
    addBox(scene, 14, 1, 68, 0x334455, 25, -0.5, -35);

    // ── Upper deck surface ──
    addBox(scene, 16, 0.5, 68, 0x4a5d6b, 25, 3.75, -35);
    // Deck non-slip strips
    for (var wds = 0; wds < 10; wds++) {
      addBox(scene, 16, 0.06, 0.35, 0x3a4d5b, 25, 4.04, -8 - wds * 6);
    }

    // ── Main superstructure ──
    addBox(scene, 12, 6, 20, 0x445566, 25, 6.75, -25);
    addBox(scene, 10, 4, 15, 0x3a4d5e, 25, 10.75, -25);
    // Superstructure windows (port side)
    for (var sw = 0; sw < 3; sw++) {
      addBox(scene, 0.12, 0.9, 1.2, 0x88aacc, 19.05, 7.5, -20 - sw * 4);
    }
    // Superstructure windows (starboard side)
    for (var ssw = 0; ssw < 3; ssw++) {
      addBox(scene, 0.12, 0.9, 1.2, 0x88aacc, 30.95, 7.5, -20 - ssw * 4);
    }

    // ── Bridge ── where Admiral Kessler commands
    addBox(scene, 8, 3, 8, 0x334455, 25, 14.25, -25);
    // Bridge windows (windscreen)
    addBox(scene, 7, 1.5, 0.12, 0x88aacc, 25, 14.8, -21.05);
    addBox(scene, 7, 1.5, 0.12, 0x88aacc, 25, 14.8, -29.05);
    // Bridge wing extensions
    addBox(scene, 3, 0.3, 5, 0x334455, 18, 15.8, -25);
    addBox(scene, 3, 0.3, 5, 0x334455, 32, 15.8, -25);

    // ── Radar and communications mast ──
    addBox(scene, 0.3, 10, 0.3, 0x667788, 25, 19, -25);
    // Cross-tree
    addBox(scene, 6, 0.2, 0.2, 0x667788, 25, 22, -25);
    addBox(scene, 0.2, 0.2, 4, 0x667788, 25, 22, -25);
    // Radar dish (flat cylinder)
    addCyl(scene, 1.5, 1.5, 0.2, 8, 0x7788aa, 25, 23.5, -25);
    // Running lights
    addBox(scene, 0.3, 0.3, 0.3, 0xff4400, 19, 22.2, -25);
    addBox(scene, 0.3, 0.3, 0.3, 0x00ff44, 31, 22.2, -25);

    // ── Funnel / smokestack ──
    addCyl(scene, 1.2, 1.5, 5, 8, 0x223344, 22, 10, -20);
    addCyl(scene, 1.3, 1.2, 0.9, 8, 0x111122, 22, 12.5, -20);
    // Second funnel (smaller)
    addCyl(scene, 0.8, 1.0, 3.5, 8, 0x223344, 28, 9.5, -22);
    addCyl(scene, 0.9, 0.8, 0.7, 8, 0x111122, 28, 11.25, -22);

    // ── Bow section — tapered prow ──
    addBox(scene, 14, 2.5, 8, 0x4a5d6b, 25, 1.5, -67);
    addBox(scene, 10, 2.0, 6, 0x4a5d6b, 25, 1.5, -72);

    // ── Stern section ──
    addBox(scene, 16, 2, 5, 0x445566, 25, 2, -2);
    // Stern flag pole
    addBox(scene, 0.15, 4, 0.15, 0x667788, 25, 4, -2);
    addBox(scene, 2.5, 1.2, 0.06, 0x223399, 26.25, 5.6, -2);

    // ── Gun turrets (2) — each with 150HP ──
    buildTurret(20, 4.25, -45, 0);
    buildTurret(30, 4.25, -45, 1);

    // ── Deck-mounted defensive weapons ──
    // AA gun mounts (decorative)
    addBox(scene, 1, 0.8, 1, 0x334455, 17, 4.8, -18);
    addCyl(scene, 0.2, 0.2, 2, 6, 0x223344, 17, 5.8, -18);
    addBox(scene, 1, 0.8, 1, 0x334455, 33, 4.8, -18);
    addCyl(scene, 0.2, 0.2, 2, 6, 0x223344, 33, 5.8, -18);

    // ── Deck railings — port and starboard ──
    for (var drail = 0; drail < 14; drail++) {
      addBox(scene, 0.1, 1.2, 0.1, 0x667788, 16.5, 4.8, -8 - drail * 5);
      addBox(scene, 0.1, 1.2, 0.1, 0x667788, 33.5, 4.8, -8 - drail * 5);
    }
    // Top rail pipes
    addBox(scene, 18, 0.1, 0.1, 0x667788, 25, 5.4, -8);
    addBox(scene, 18, 0.1, 0.1, 0x667788, 25, 5.4, -73);
    addBox(scene, 0.1, 0.1, 70, 0x667788, 16.5, 5.4, -38);
    addBox(scene, 0.1, 0.1, 70, 0x667788, 33.5, 5.4, -38);

    // ── Mooring lines and anchor chains ──
    addBox(scene, 0.12, 0.12, 10, 0x8b7355, 16, 2.5, -10);
    addBox(scene, 0.12, 0.12, 10, 0x8b7355, 16, 2.5, -62);
    // Anchor port (decorative hole area)
    addBox(scene, 1.5, 1.5, 0.2, 0x223344, 25, 1, -73);

    // ── Depth charge rack (stern) ──
    addBox(scene, 4, 0.5, 2, 0x445566, 25, 4.8, -4);
    addCyl(scene, 0.4, 0.4, 1, 8, 0x556677, 23, 5.3, -4);
    addCyl(scene, 0.4, 0.4, 1, 8, 0x556677, 25, 5.3, -4);
    addCyl(scene, 0.4, 0.4, 1, 8, 0x556677, 27, 5.3, -4);
  }

  // ── gun turret ────────────────────────────────────────────────────────────
  // Each turret has 150HP and auto-fires at the player every 5 seconds
  function buildTurret(x, y, z, index) {
    // Armored base
    var base = addBox(scene, 4.5, 1.8, 4.5, 0x334455, x, y + 0.9, z);
    // Rotation ring / training gear
    addCyl(scene, 2.4, 2.4, 0.5, 12, 0x445566, x, y + 1.85, z);
    // Turret body (main armored housing)
    var body = addBox(scene, 3.8, 2.2, 3.5, 0x3a4d5e, x, y + 2.85, z);
    // Mantlet (front armored plate)
    addBox(scene, 3.5, 2, 0.4, 0x2a3d4e, x, y + 2.85, z - 1.95);
    // Turret hatch
    addCyl(scene, 0.5, 0.5, 0.2, 8, 0x445566, x, y + 4.05, z);

    // Gun barrels — twin barrel turret
    var barrel1 = addCyl(scene, 0.18, 0.22, 4.5, 6, 0x1a2233, x - 0.65, y + 2.9, z - 3.8);
    barrel1.rotation.x = Math.PI / 2;
    var barrel2 = addCyl(scene, 0.18, 0.22, 4.5, 6, 0x1a2233, x + 0.65, y + 2.9, z - 3.8);
    barrel2.rotation.x = Math.PI / 2;
    // Muzzle brakes
    addCyl(scene, 0.25, 0.25, 0.3, 6, 0x111122, x - 0.65, y + 2.9, z - 6.1);
    addCyl(scene, 0.25, 0.25, 0.3, 6, 0x111122, x + 0.65, y + 2.9, z - 6.1);

    turrets.push({
      hp: 150,
      maxHp: 150,
      pos: { x: x, y: y + 2, z: z },
      mesh: body,
      baseMesh: base,
      destroyed: false,
      fireTimer: 2 + Math.random() * 3,  // stagger initial fire times
      index: index
    });
  }

  // ── spawn enemies ──────────────────────────────────────────────────────────
  function spawnEnemies() {
    // ── 10 Naval Sailors (0x334466, 80HP) ──
    // Sailors patrol the docks and ship decks
    var sailorPatrols = [
      [{ x: -2, z: 8 }, { x: 2, z: 8 }],          // pier entrance
      [{ x: -2, z: -5 }, { x: 2, z: -5 }],         // mid pier
      [{ x: -10, z: -40 }, { x: 10, z: -40 }],     // cross pier east
      [{ x: -14, z: -40 }, { x: -20, z: -40 }],    // cross pier west
      [{ x: -14, z: -28 }, { x: -26, z: -28 }],    // cargo ship bow deck
      [{ x: -14, z: -48 }, { x: -26, z: -48 }],    // cargo ship stern deck
      [{ x: -14, z: -20 }, { x: -26, z: -20 }],    // cargo ship bridge area
      [{ x: 15, z: -20 }, { x: 35, z: -20 }],      // command ship mid
      [{ x: -2, z: -37 }, { x: 2, z: -37 }],       // cross pier center
      [{ x: 18, z: -8 }, { x: 32, z: -8 }]         // command ship stern
    ];

    for (var si = 0; si < 10; si++) {
      var patrol = sailorPatrols[si];
      spawnEnemy(
        patrol[0].x, 2, patrol[0].z,
        0x334466, 80, 'sailor',
        [patrol[0], patrol[1]]
      );
    }

    // ── 8 Marines (0x223355, 100HP) ──
    // Marines stand guard at fixed positions on the command ship
    var marinePositions = [
      { x: 20, z: -10 }, { x: 30, z: -10 },
      { x: 20, z: -35 }, { x: 30, z: -35 },
      { x: 20, z: -55 }, { x: 30, z: -55 },
      { x: 22, z: -22 }, { x: 28, z: -22 }
    ];
    for (var mi = 0; mi < 8; mi++) {
      var mp = marinePositions[mi];
      spawnEnemy(mp.x, 4.5, mp.z, 0x223355, 100, 'marine', null);
    }

    // ── Boss: Admiral Kessler (0x112244, 500HP) ──
    // Commands from the bridge of the command ship
    var kesslerBody = addBox(scene, 0.9, 2.1, 0.5, 0x112244, 25, 16.5, -25);
    // Admiral's hat — peaked cap
    addBox(scene, 0.85, 0.45, 0.75, 0x0a1833, 25, 17.75, -25);
    addBox(scene, 1.0, 0.1, 0.9, 0x0a1833, 25, 17.5, -25);
    // Gold epaulettes
    addBox(scene, 1.5, 0.2, 0.5, 0xccaa00, 25, 16.85, -25);
    // Medal decorations
    addBox(scene, 0.5, 0.5, 0.08, 0xffcc00, 25, 16.3, -24.75);
    // Name badge
    addBox(scene, 0.6, 0.15, 0.08, 0xffffff, 25, 15.9, -24.75);

    kessler = {
      mesh: kesslerBody,
      hp: 500,
      maxHp: 500,
      pos: { x: 25, y: 16.5, z: -25 },
      dead: false,
      phase2: false,
      strikeTimer: 0,
      strikeCooldown: 8   // seconds between naval strike salvos
    };

    enemies.push({
      mesh: kesslerBody,
      hp: 500,
      maxHp: 500,
      pos: { x: 25, y: 16.5, z: -25 },
      color: 0x112244,
      type: 'boss',
      patrol: null,
      patrolIndex: 0,
      patrolTimer: 0,
      aggroRange: 50,
      isKessler: true,
      dead: false,
      shootTimer: 3,
      shootCooldown: 3.5
    });
  }

  // Creates and registers a single enemy entity at the given coordinates
  function spawnEnemy(x, y, z, color, hp, type, patrol) {
    // Body mesh
    var geo = new THREE.BoxGeometry(0.8, 2, 0.5);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    // Head
    var headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var headMat = makeMat(0xf4c48a);
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(x, y + 1.3, z);
    scene.add(head);

    // Helmet for marines (darker military helmet)
    if (type === 'marine') {
      var helmGeo = new THREE.BoxGeometry(0.72, 0.38, 0.72);
      var helmMat = makeMat(0x112233);
      var helm = new THREE.Mesh(helmGeo, helmMat);
      helm.position.set(x, y + 1.65, z);
      scene.add(helm);
    }

    // Sailor cap for sailors
    if (type === 'sailor') {
      var capGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.15, 8);
      var capMat = makeMat(0x334466);
      var cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, y + 1.68, z);
      scene.add(cap);
    }

    enemies.push({
      mesh: mesh,
      head: head,
      hp: hp,
      maxHp: hp,
      pos: { x: x, y: y, z: z },
      color: color,
      type: type,
      patrol: patrol,
      patrolIndex: 0,
      patrolTimer: 0,
      aggroRange: type === 'marine' ? 25 : 20,
      isKessler: false,
      dead: false,
      shootTimer: 1 + Math.random() * 2,
      shootCooldown: type === 'marine' ? 1.8 : (2 + Math.random())
    });
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'hb-hud';
    hudEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'left:12px',
      'color:#00ffcc',
      'font:bold 13px monospace',
      'background:rgba(0,20,40,0.75)',
      'padding:10px 14px',
      'border:1px solid #004466',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:100',
      'text-shadow:0 0 8px #00ffcc',
      'line-height:1.6',
      'min-width:280px'
    ].join(';');
    container.appendChild(hudEl);

    overlayEl = document.createElement('div');
    overlayEl.id = 'hb-overlay';
    overlayEl.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none',
      'z-index:200'
    ].join(';');
    container.appendChild(overlayEl);

    updateHUD();
  }

  // Refreshes all HUD elements with current game state
  function updateHUD() {
    if (!hudEl) return;

    // Player health bar — green when healthy, red when critical
    var hpColor = playerHP > 60 ? '#44ff88' : (playerHP > 30 ? '#ffcc44' : '#ff4444');
    var hpBarWidth = Math.max(0, Math.round((playerHP / 100) * 80));
    var hpBar = '<span style="display:inline-block;width:80px;height:8px;background:#333;vertical-align:middle;margin-left:4px">' +
      '<span style="display:inline-block;width:' + hpBarWidth + 'px;height:8px;background:' + hpColor + '"></span></span>';

    // Kessler HP bar
    var kHPStr = 'N/A';
    var kBar = '';
    if (kessler) {
      var kHPPct = Math.max(0, kessler.hp) / kessler.maxHp;
      var kBarW = Math.round(kHPPct * 80);
      var kCol = kHPPct > 0.5 ? '#4488ff' : '#ff4400';
      kBar = '<span style="display:inline-block;width:80px;height:6px;background:#333;vertical-align:middle;margin-left:4px">' +
        '<span style="display:inline-block;width:' + kBarW + 'px;height:6px;background:' + kCol + '"></span></span>';
      kHPStr = Math.max(0, Math.round(kessler.hp)) + '/' + kessler.maxHp + kBar;
    }

    // Strike warning — find the nearest active strike marker timer
    var strikeWarn = '';
    var nearestStrike = 9999;
    for (var si = 0; si < strikeMarkers.length; si++) {
      if (strikeMarkers[si].active && strikeMarkers[si].timer < nearestStrike) {
        nearestStrike = strikeMarkers[si].timer;
      }
    }
    if (nearestStrike < 9999) {
      var blinkStyle = nearestStrike < 1 ? 'animation:none;color:#ff8800' : 'color:#ff4400';
      strikeWarn = '<br><span style="' + blinkStyle + '">&#9888; NAVAL STRIKE IN ' + nearestStrike.toFixed(1) + 's!</span>';
    }

    // Hostage freeing progress
    var freeStr = '';
    if (freeingHostage !== null) {
      var freePct = Math.round(((2 - freeingTimer) / 2) * 100);
      freeStr = '<br><span style="color:#ffff00">&#128275; FREEING CREW ' + (freeingHostage + 1) + ': ' +
        freePct + '% (' + freeingTimer.toFixed(1) + 's)</span>';
    }

    // Objective status icons
    var turretStatus = turretsDestroyed >= 2 ?
      '<span style="color:#44ff88">&#10003; TURRETS CLEAR</span>' :
      '<span style="color:#ff8844">&#9746; TURRETS: ' + turretsDestroyed + '/2</span>';
    var hostageStatus = hostagesFreed >= 3 ?
      '<span style="color:#44ff88">&#10003; CREW FREED</span>' :
      '<span style="color:#ffcc44">&#128119; CREW: ' + hostagesFreed + '/3</span>';
    var kesslerStatus = (kessler && kessler.dead) ?
      '<span style="color:#44ff88">&#10003; KESSLER DOWN</span>' :
      '<span style="color:#4488ff">&#128081; KESSLER: ' + kHPStr + '</span>';

    // Phase 2 warning indicator
    var phase2Str = (kessler && kessler.phase2 && !kessler.dead) ?
      ' <span style="color:#ff4400;font-size:11px">[STRIKE MODE ACTIVE]</span>' : '';

    // Extraction status
    var extractStr = '';
    if (turretsDestroyed >= 2 && (kessler && kessler.dead) && hostagesFreed >= 3) {
      var distToExt = extractionDock ? dist2(playerPos, extractionDock.pos) : 999;
      extractStr = '<br><span style="color:#ffcc00">&#9658; REACH EXTRACTION DOCK (' + Math.round(distToExt) + 'm)</span>';
    }

    // Water hazard warning
    var waterStr = inWater ? '<br><span style="color:#4488ff">&#127689; SWIMMING — REACH DOCK!</span>' : '';

    hudEl.innerHTML =
      'HP: <span style="color:' + hpColor + '">' + Math.max(0, Math.round(playerHP)) + '</span>' + hpBar +
      ' &nbsp; Score: <span style="color:#ffdd88">' + score + '</span>' +
      '<br>' + turretStatus + ' &nbsp; ' + hostageStatus +
      '<br>' + kesslerStatus + phase2Str +
      strikeWarn + freeStr + waterStr + extractStr;
  }

  // Displays a centered overlay message (win/loss/intro)
  function showOverlay(html) {
    if (!overlayEl) return;
    overlayEl.innerHTML = '<div style="background:rgba(0,10,30,0.92);border:2px solid #00ffcc;' +
      'border-radius:8px;padding:32px 48px;text-align:center;color:#00ffcc;' +
      'font:bold 20px monospace;max-width:520px;text-shadow:0 0 12px #00ffcc;' +
      'line-height:1.8">' + html + '</div>';
  }

  function clearOverlay() {
    if (overlayEl) overlayEl.innerHTML = '';
  }

  // ── shooting / raycasting ─────────────────────────────────────────────────
  // Fires a ray from the camera center; damages the first thing it hits
  function shoot() {
    if (shootCooldown > 0) return;
    shootCooldown = 0.22;  // fire rate ~4.5 rounds/sec

    var ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Collect all shootable mesh objects
    var targets = [];
    for (var ei = 0; ei < enemies.length; ei++) {
      if (!enemies[ei].dead) targets.push(enemies[ei].mesh);
    }
    for (var ti = 0; ti < turrets.length; ti++) {
      if (!turrets[ti].destroyed) {
        targets.push(turrets[ti].mesh);
        targets.push(turrets[ti].baseMesh);
      }
    }
    for (var fi = 0; fi < fuelTanks.length; fi++) {
      if (!fuelTanks[fi].userData.exploded) targets.push(fuelTanks[fi]);
    }

    var hits = ray.intersectObjects(targets);
    if (hits.length === 0) return;

    var hit = hits[0];
    spawnHitParticles(hit.point);

    // Check enemy hit
    for (var ei2 = 0; ei2 < enemies.length; ei2++) {
      var en = enemies[ei2];
      if (!en.dead && en.mesh === hit.object) {
        var dmg = en.type === 'marine' ? 25 : (en.type === 'boss' ? 30 : 20);
        damageEnemy(en, dmg);
        return;
      }
    }

    // Check turret hit
    for (var ti2 = 0; ti2 < turrets.length; ti2++) {
      var tur = turrets[ti2];
      if (!tur.destroyed && (tur.mesh === hit.object || tur.baseMesh === hit.object)) {
        tur.hp -= 35;
        if (tur.hp <= 0) destroyTurret(tur);
        return;
      }
    }

    // Check fuel tank hit
    for (var fi2 = 0; fi2 < fuelTanks.length; fi2++) {
      var ft = fuelTanks[fi2];
      if (!ft.userData.exploded && ft === hit.object) {
        triggerFuelChain(fi2);
        return;
      }
    }
  }

  // Apply damage to an enemy; handles Kessler phase transition
  function damageEnemy(en, dmg) {
    en.hp -= dmg;
    if (en.isKessler && kessler) {
      kessler.hp -= dmg;
      // Trigger phase 2 at 50% HP — Kessler begins calling naval strikes
      if (kessler.hp <= kessler.maxHp * 0.5 && !kessler.phase2) {
        kessler.phase2 = true;
        en.phase2 = true;
        showPhase2Warning();
      }
    }
    if (en.hp <= 0) killEnemy(en);
  }

  // Shows a temporary on-screen warning when Kessler enters phase 2
  function showPhase2Warning() {
    var warn = document.createElement('div');
    warn.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff4400',
      'font:bold 30px monospace',
      'text-shadow:0 0 20px #ff4400',
      'pointer-events:none',
      'z-index:300',
      'text-align:center',
      'white-space:nowrap'
    ].join(';');
    warn.innerHTML = '&#128204; KESSLER CALLS NAVAL STRIKES! &#128204;<br>' +
      '<span style="font-size:18px">WATCH FOR RED MARKERS!</span>';
    container.appendChild(warn);
    setTimeout(function () {
      if (warn.parentNode) warn.parentNode.removeChild(warn);
    }, 3500);
  }

  // Remove enemy from scene and award score
  function killEnemy(en) {
    en.dead = true;
    en.mesh.visible = false;
    if (en.head) en.head.visible = false;
    score += en.type === 'boss' ? 1000 : (en.type === 'marine' ? 200 : 100);
    spawnDeathParticles(en.pos);
    if (en.isKessler && kessler) {
      kessler.dead = true;
    }
  }

  // Destroy a turret — disables it and marks as cleared
  function destroyTurret(tur) {
    tur.destroyed = true;
    tur.hp = 0;
    tur.mesh.material.color.setHex(0x111111);
    tur.baseMesh.material.color.setHex(0x111111);
    turretsDestroyed++;
    score += 500;
    spawnExplosion(tur.pos.x, tur.pos.y + 1, tur.pos.z, 8);
  }

  // ── fuel chain explosion ──────────────────────────────────────────────────
  // Shooting one tank triggers all others in a chain with 5s delay each
  function triggerFuelChain(startIndex) {
    for (var i = 0; i < fuelTanks.length; i++) {
      var ft = fuelTanks[i];
      if (!ft.userData.exploded && ft.userData.explodeTimer < 0) {
        var delay = i === startIndex ? 0.15 : (Math.abs(i - startIndex) * 5.0);
        ft.userData.explodeTimer = delay;
      }
    }
  }

  // Tick down fuel tank explosion timers; trigger explosion when timer reaches 0
  function updateFuelTanks(dt) {
    for (var fi = 0; fi < fuelTanks.length; fi++) {
      var ft = fuelTanks[fi];
      if (ft.userData.exploded || ft.userData.explodeTimer < 0) continue;

      ft.userData.explodeTimer -= dt;
      if (ft.userData.explodeTimer <= 0) {
        ft.userData.exploded = true;
        ft.visible = false;
        var tp = ft.userData.pos;
        spawnExplosion(tp.x, tp.y, tp.z, 14);
        score += 300;

        // Area damage to nearby player
        var d = dist3(playerPos, tp);
        if (d < 16) {
          playerHP -= (1 - d / 16) * 65;
        }
      }
    }
  }

  // ── naval gun strikes ─────────────────────────────────────────────────────
  // Kessler calls 3 artillery strikes at the player's current position
  function callNavalStrike() {
    for (var i = 0; i < 3; i++) {
      var offset = i * 1.8;
      var tx = playerPos.x + (Math.random() - 0.5) * 8;
      var tz = playerPos.z + (Math.random() - 0.5) * 8;
      spawnStrikeMarker(tx, tz, 3.0 + offset);
    }
  }

  // Creates a red warning disc at (x, z) that explodes after 'delay' seconds
  function spawnStrikeMarker(x, z, delay) {
    var geo = new THREE.CylinderGeometry(2.2, 2.2, 0.22, 12);
    var mat = new THREE.MeshLambertMaterial({
      color: 0xff2200,
      transparent: true,
      opacity: 0.75
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.22, z);
    scene.add(mesh);

    // Inner ring (brighter)
    var innerGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.25, 10);
    var innerMat = new THREE.MeshLambertMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.set(x, 0.24, z);
    scene.add(inner);

    strikeMarkers.push({
      mesh: mesh,
      innerMesh: inner,
      pos: { x: x, y: 0, z: z },
      timer: delay,
      active: true
    });
  }

  // Update strike marker countdown; spawn explosion when timer expires
  function updateStrikeMarkers(dt) {
    for (var si = 0; si < strikeMarkers.length; si++) {
      var sm = strikeMarkers[si];
      if (!sm.active) continue;
      sm.timer -= dt;

      // Pulse the marker as time runs out
      var pulse = 0.5 + 0.5 * Math.sin(sm.timer * 10);
      sm.mesh.material.opacity = 0.35 + 0.55 * pulse;
      if (sm.timer < 1.5) {
        sm.mesh.material.color.setHex(0xff8800);
        sm.mesh.scale.setScalar(1 + 0.15 * Math.sin(sm.timer * 20));
      }

      if (sm.timer <= 0) {
        sm.active = false;
        sm.mesh.visible = false;
        if (sm.innerMesh) sm.innerMesh.visible = false;
        spawnExplosion(sm.pos.x, 1.5, sm.pos.z, 9);

        // Deal damage to player if close enough
        var d = dist2(playerPos, sm.pos);
        if (d < 9) {
          playerHP -= (1 - d / 9) * 50;
        }
      }
    }

    // Remove expired markers from array and scene
    strikeMarkers = strikeMarkers.filter(function (sm) {
      if (!sm.active) {
        scene.remove(sm.mesh);
        if (sm.innerMesh) scene.remove(sm.innerMesh);
        return false;
      }
      return true;
    });
  }

  // ── particles ─────────────────────────────────────────────────────────────
  // Small spark particles for bullet impacts
  function spawnHitParticles(pos) {
    for (var i = 0; i < 6; i++) {
      var geo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
      var mat = makeMat(0xffdd44);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      particles.push({
        mesh: mesh,
        vel: {
          x: (Math.random() - 0.5) * 5,
          y: Math.random() * 4 + 1,
          z: (Math.random() - 0.5) * 5
        },
        life: 0.35 + Math.random() * 0.15
      });
    }
  }

  // Red/orange debris particles when an enemy dies
  function spawnDeathParticles(pos) {
    for (var i = 0; i < 14; i++) {
      var geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
      var col = i % 2 === 0 ? 0xff4400 : 0xcc2200;
      var mat = makeMat(col);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);
      particles.push({
        mesh: mesh,
        vel: {
          x: (Math.random() - 0.5) * 9,
          y: Math.random() * 7 + 2,
          z: (Math.random() - 0.5) * 9
        },
        life: 0.7 + Math.random() * 0.4
      });
    }
  }

  // Large explosion — fireballs and debris burst
  function spawnExplosion(x, y, z, radius) {
    var colors = [0xff6600, 0xff4400, 0xffcc00, 0xff2200, 0xff8800];
    for (var i = 0; i < 24; i++) {
      var geo = new THREE.BoxGeometry(
        0.2 + Math.random() * 0.3,
        0.2 + Math.random() * 0.3,
        0.2 + Math.random() * 0.3
      );
      var col = colors[Math.floor(Math.random() * colors.length)];
      var mat = makeMat(col);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      var speed = radius * (0.25 + Math.random() * 0.75);
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.random() * Math.PI;
      particles.push({
        mesh: mesh,
        vel: {
          x: Math.sin(phi) * Math.cos(theta) * speed,
          y: Math.cos(phi) * speed * 0.5 + 4,
          z: Math.sin(phi) * Math.sin(theta) * speed
        },
        life: 1.0 + Math.random() * 0.5
      });
    }
  }

  // Advance all active particles; remove expired ones
  function updateParticles(dt) {
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var p = particles[pi];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(pi, 1);
        continue;
      }
      // Apply gravity
      p.vel.y -= 9.8 * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      // Fade out
      if (p.mesh.material.transparent) {
        p.mesh.material.opacity = Math.min(1, p.life * 2.5);
      }
    }
  }

  // ── enemy AI ──────────────────────────────────────────────────────────────
  // Update all enemy entities — patrol, chase, and shoot
  function updateEnemies(dt) {
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (en.dead) continue;

      // Kessler uses specialized logic
      if (en.isKessler) {
        updateKessler(en, dt);
        continue;
      }

      var d = dist2(en.pos, playerPos);

      if (d < en.aggroRange) {
        // ── Chase behavior: move toward player when in aggro range ──
        var dx = playerPos.x - en.pos.x;
        var dz = playerPos.z - en.pos.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 1.8) {
          var spd = en.type === 'marine' ? 3.8 : 2.8;
          en.pos.x += (dx / len) * spd * dt;
          en.pos.z += (dz / len) * spd * dt;
        }

        // ── Shoot player when within attack range ──
        en.shootTimer -= dt;
        if (en.shootTimer <= 0) {
          en.shootTimer = en.shootCooldown;
          if (d < 20) {
            // Accuracy drops off with distance
            var hitChance = 1 - (d / 20) * 0.6;
            if (Math.random() < hitChance) {
              playerHP -= en.type === 'marine' ? 12 : 8;
            }
          }
        }
      } else if (en.patrol) {
        // ── Patrol behavior: walk between waypoints ──
        var target = en.patrol[en.patrolIndex];
        var pdx = target.x - en.pos.x;
        var pdz = target.z - en.pos.z;
        var plen = Math.sqrt(pdx * pdx + pdz * pdz);
        if (plen < 0.6) {
          en.patrolIndex = (en.patrolIndex + 1) % en.patrol.length;
        } else {
          en.pos.x += (pdx / plen) * 1.6 * dt;
          en.pos.z += (pdz / plen) * 1.6 * dt;
        }
      }

      // Sync mesh position to logical position
      en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
      if (en.head) en.head.position.set(en.pos.x, en.pos.y + 1.3, en.pos.z);

      // Rotate enemy to face player
      var faceAngle = Math.atan2(playerPos.x - en.pos.x, playerPos.z - en.pos.z);
      en.mesh.rotation.y = faceAngle;
      if (en.head) en.head.rotation.y = faceAngle;
    }
  }

  // Specialized update for Kessler boss — stays on bridge, calls strikes in phase 2
  function updateKessler(en, dt) {
    if (!kessler || kessler.dead) return;

    // Kessler stays on the bridge; synchronize positions
    en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);

    // Phase 2: call naval gun strikes at regular intervals
    if (kessler.phase2) {
      kessler.strikeTimer -= dt;
      if (kessler.strikeTimer <= 0) {
        kessler.strikeTimer = kessler.strikeCooldown;
        callNavalStrike();
      }
    }

    // Kessler also shoots the player directly when in range
    var d = dist3(en.pos, playerPos);
    en.shootTimer -= dt;
    if (en.shootTimer <= 0 && d < 35) {
      en.shootTimer = en.shootCooldown;
      if (Math.random() > 0.35) {
        playerHP -= 15;
      }
    }
  }

  // ── turret auto-fire ──────────────────────────────────────────────────────
  // Each turret fires at the player every 5 seconds if in range
  function updateTurrets(dt) {
    for (var ti = 0; ti < turrets.length; ti++) {
      var tur = turrets[ti];
      if (tur.destroyed) continue;

      tur.fireTimer -= dt;
      if (tur.fireTimer <= 0) {
        tur.fireTimer = 5;  // 5 second fire interval
        var d = dist3(tur.pos, playerPos);
        if (d < 85) {
          // Hit probability scales with distance
          var hitChance = Math.max(0.15, 1 - d / 85);
          if (Math.random() < hitChance) {
            playerHP -= 18;
            // Spawn near-miss explosion effect on the player
            spawnExplosion(
              playerPos.x + (Math.random() - 0.5) * 3,
              playerPos.y - 0.5,
              playerPos.z + (Math.random() - 0.5) * 3,
              3
            );
          }
          // Muzzle flash at turret barrel tip
          spawnHitParticles(new THREE.Vector3(tur.pos.x, tur.pos.y + 0.8, tur.pos.z - 4));
        }
      }
    }
  }

  // ── hostage interaction ───────────────────────────────────────────────────
  // Player holds E near a hostage cage to free them over 2 seconds
  function updateHostageInteraction(dt) {
    if (freeingHostage !== null) {
      // Countdown while player holds E
      freeingTimer -= dt;
      if (freeingTimer <= 0) {
        var h = hostages[freeingHostage];
        h.freed = true;
        h.mesh.visible = false;
        if (h.headMesh) h.headMesh.visible = false;
        hostagesFreed++;
        score += 700;
        freeingHostage = null;
        freeingTimer = 0;

        // Flash a freed message
        var freed = document.createElement('div');
        freed.style.cssText = 'position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);' +
          'color:#00ff88;font:bold 24px monospace;text-shadow:0 0 14px #00ff88;' +
          'pointer-events:none;z-index:300;';
        freed.textContent = 'CREW MEMBER FREED! +700';
        container.appendChild(freed);
        setTimeout(function () {
          if (freed.parentNode) freed.parentNode.removeChild(freed);
        }, 2000);
      }
      return;
    }

    // Check E key press near any unfreed hostage
    if (keyState['e'] || keyState['E']) {
      for (var hi = 0; hi < hostages.length; hi++) {
        var h = hostages[hi];
        if (!h.freed) {
          var d = dist3(playerPos, h.pos);
          if (d < 4.5) {
            freeingHostage = hi;
            freeingTimer = 2.0;
            break;
          }
        }
      }
    }
  }

  // ── player movement ───────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var moveSpeed = 8;

    // Build movement vectors from current yaw (camera horizontal rotation)
    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    var move = new THREE.Vector3(0, 0, 0);

    if (keyState['w'] || keyState['W'] || keyState['ArrowUp']) move.add(forward);
    if (keyState['s'] || keyState['S'] || keyState['ArrowDown']) move.sub(forward);
    if (keyState['a'] || keyState['A'] || keyState['ArrowLeft']) move.sub(right);
    if (keyState['d'] || keyState['D'] || keyState['ArrowRight']) move.add(right);

    if (move.length() > 0) move.normalize();

    // Water imposes a movement penalty (40% speed)
    var speedMult = inWater ? 0.4 : 1;
    playerPos.x += move.x * moveSpeed * speedMult * dt;
    playerPos.z += move.z * moveSpeed * speedMult * dt;

    // Apply gravity when airborne; slow sink in water
    if (!onGround && !inWater) {
      playerVel.y -= 20 * dt;
    } else if (inWater) {
      playerVel.y = -0.8;  // gentle downward drift
    }

    // Jump / swim surface
    if ((keyState[' '] || keyState['Space']) && (onGround || inWater)) {
      playerVel.y = inWater ? 5.5 : 10;
      onGround = false;
    }

    playerPos.y += playerVel.y * dt;

    // Check ground collision
    var groundY = getGroundY(playerPos.x, playerPos.z);
    if (playerPos.y <= groundY + 1.8) {
      playerPos.y = groundY + 1.8;
      playerVel.y = 0;
      onGround = true;
    } else {
      onGround = false;
    }

    // Water surface detection — player is in water if ground is below sea level
    if (playerPos.y < 1.8 && groundY < -1) {
      inWater = true;
      playerHP -= 5 * dt;  // 5 HP/s drowning damage
      if (playerPos.y < -2.5) playerPos.y = -2.0;  // prevent sinking too deep
    } else {
      inWater = false;
    }

    // World boundary clamp
    playerPos.x = Math.max(-100, Math.min(100, playerPos.x));
    playerPos.z = Math.max(-92, Math.min(42, playerPos.z));

    // Sync camera to player eye position
    camera.position.set(playerPos.x, playerPos.y, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  // Returns the floor Y level at the given world XZ position.
  // Used for collision detection to keep the player on surfaces.
  function getGroundY(x, z) {
    // Left shore / naval base area
    if (x < -15 && z > 0) return 1;
    // Right shore / warehouse / fuel area
    if (x > 15 && z > 0) return 1;
    // Central pier (main walkway)
    if (Math.abs(x) < 3.2 && z > -46 && z < 12) return 1;
    // Cross pier
    if (Math.abs(z + 40) < 3.2 && Math.abs(x) < 22) return 1;
    // Cargo ship main deck
    if (x > -32 && x < -8 && z > -66 && z < -6) return 4.5;
    // Cargo ship bridge superstructure deck
    if (x > -26 && x < -14 && z > -24 && z < -12) return 8.5;
    // Command ship main deck
    if (x > 15 && x < 35 && z > -73 && z < -1) return 4;
    // Command ship superstructure deck
    if (x > 18 && x < 32 && z > -36 && z < -14) return 7.5;
    // Command ship bridge level
    if (x > 20 && x < 30 && z > -30 && z < -20) return 15.8;
    // Fuel depot bund platform
    if (x > 49 && x < 70 && z > -20 && z < 2) return 1;
    // Water — open sea surface (player swims here)
    return -10;
  }

  // ── win/loss condition check ──────────────────────────────────────────────
  function checkWinCondition() {
    if (gameOver || gameWon) return;

    // Win: both turrets destroyed, Kessler dead, all 3 hostages freed, at extraction dock
    if (turretsDestroyed >= 2 && kessler && kessler.dead && hostagesFreed >= 3) {
      var d = dist2(playerPos, extractionDock.pos);
      if (d < 9) {
        gameWon = true;
        score += 2000;  // mission completion bonus
        showOverlay(
          '&#127881; MISSION COMPLETE! &#127881;<br><br>' +
          'Blockade Broken!<br>' +
          'Both turrets destroyed<br>' +
          'Admiral Kessler eliminated<br>' +
          'Hostages freed: 3/3<br><br>' +
          'Final Score: <span style="color:#ffdd88">' + score + '</span><br><br>' +
          '<span style="font-size:14px;color:#aaccff">Press R to play again</span>'
        );
      }
    }

    // Loss: player ran out of HP
    if (playerHP <= 0) {
      playerHP = 0;
      gameOver = true;
      showOverlay(
        '&#128128; MISSION FAILED &#128128;<br><br>' +
        'You were eliminated<br><br>' +
        'Turrets: ' + turretsDestroyed + '/2<br>' +
        'Hostages: ' + hostagesFreed + '/3<br>' +
        'Score: <span style="color:#ffdd88">' + score + '</span><br><br>' +
        '<span style="font-size:14px;color:#aaccff">Press R to retry</span>'
      );
    }
  }

  // ── mouse / pointer input ─────────────────────────────────────────────────
  function onMouseMove(e) {
    if (!active || !pointerLocked) return;
    var sens = 0.0022;
    yaw -= e.movementX * sens;
    pitch -= e.movementY * sens;
    pitch = Math.max(-1.3, Math.min(1.3, pitch));
  }

  function onMouseDown(e) {
    if (!active) return;
    if (e.button === 0) {
      if (!pointerLocked) {
        renderer.domElement.requestPointerLock();
      } else if (!gameOver && !gameWon) {
        shoot();
      }
    }
  }

  function onPointerLockChange() {
    pointerLocked = document.pointerLockElement === renderer.domElement;
    if (pointerLocked) clearOverlay();
  }

  function onKeyDown(e) {
    if (!active) {
      // Pre-init activation sequence: press H then B within 400ms
      if (e.key === 'h' || e.key === 'H') {
        lastKeyH = Date.now();
      } else if ((e.key === 'b' || e.key === 'B') && Date.now() - lastKeyH < 400) {
        if (typeof THREE !== 'undefined' && window._gameScene) {
          init(window._gameContainer, window._gameRenderer, window._gameCamera, window._gameScene);
        }
      }
      return;
    }

    keyState[e.key] = true;

    // Restart on R after game over or win
    if ((e.key === 'r' || e.key === 'R') && (gameOver || gameWon)) {
      reset();
      init(container, renderer, camera, scene);
    }

    // Prevent page scroll on spacebar
    if (e.key === ' ') e.preventDefault();
  }

  function onKeyUp(e) {
    keyState[e.key] = false;
  }

  // ── crosshair ─────────────────────────────────────────────────────────────
  function createCrosshair() {
    var ch = document.createElement('div');
    ch.id = 'hb-crosshair';
    ch.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:22px',
      'height:22px',
      'pointer-events:none',
      'z-index:150'
    ].join(';');
    ch.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 22 22">' +
      '<line x1="11" y1="2" x2="11" y2="8" stroke="#00ffcc" stroke-width="1.5" opacity="0.9"/>' +
      '<line x1="11" y1="14" x2="11" y2="20" stroke="#00ffcc" stroke-width="1.5" opacity="0.9"/>' +
      '<line x1="2" y1="11" x2="8" y2="11" stroke="#00ffcc" stroke-width="1.5" opacity="0.9"/>' +
      '<line x1="14" y1="11" x2="20" y2="11" stroke="#00ffcc" stroke-width="1.5" opacity="0.9"/>' +
      '<circle cx="11" cy="11" r="1.2" fill="#00ffcc" opacity="0.7"/>' +
      '</svg>';
    container.appendChild(ch);
  }

  // ── damage flash ──────────────────────────────────────────────────────────
  // Flashes the screen red briefly when the player takes damage
  function checkDamageFlash() {
    if (playerHP < lastHP - 0.5) {
      var flash = document.createElement('div');
      flash.style.cssText = [
        'position:absolute',
        'top:0', 'left:0',
        'width:100%', 'height:100%',
        'background:rgba(200,0,0,0.22)',
        'pointer-events:none',
        'z-index:180'
      ].join(';');
      container.appendChild(flash);
      setTimeout(function () {
        if (flash.parentNode) flash.parentNode.removeChild(flash);
      }, 140);
    }
    lastHP = playerHP;
  }

  // ── init ──────────────────────────────────────────────────────────────────
  // Called by external harness or activation sequence to start the module
  function init(cont, ren, cam, sc) {
    container = cont || document.body;
    renderer = ren;
    camera = cam;
    scene = sc;

    // ── Reset all game state ──
    active = true;
    gameOver = false;
    gameWon = false;
    playerHP = 100;
    lastHP = 100;
    playerPos = { x: 0, y: 2.2, z: 20 };
    playerVel = { x: 0, y: 0, z: 0 };
    yaw = 0;
    pitch = 0;
    score = 0;
    turretsDestroyed = 0;
    hostagesFreed = 0;
    freeingHostage = null;
    freeingTimer = 0;
    enemies = [];
    turrets = [];
    fuelTanks = [];
    hostages = [];
    strikeMarkers = [];
    particles = [];
    kessler = null;
    kesslerPhase2 = false;
    kesslerStrikeTimer = 0;
    keyState = {};
    inWater = false;
    onGround = true;
    shootCooldown = 0;
    extractionDock = null;

    // Remove any existing HUD elements from previous session
    var oldHUD = document.getElementById('hb-hud');
    if (oldHUD && oldHUD.parentNode) oldHUD.parentNode.removeChild(oldHUD);
    var oldOverlay = document.getElementById('hb-overlay');
    if (oldOverlay && oldOverlay.parentNode) oldOverlay.parentNode.removeChild(oldOverlay);
    var oldCH = document.getElementById('hb-crosshair');
    if (oldCH && oldCH.parentNode) oldCH.parentNode.removeChild(oldCH);

    clock = new THREE.Clock();

    // Build world, spawn enemies, create HUD
    buildEnvironment();
    spawnEnemies();
    createHUD();
    createCrosshair();

    // Register input event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Show mission briefing overlay
    showOverlay(
      '&#9875; HARBOR BLOCKADE &#9875;<br><br>' +
      'Break the naval blockade!<br><br>' +
      '&#9746; Destroy both gun turrets<br>' +
      '&#9875; Defeat Admiral Kessler<br>' +
      '&#128119; Free 3 crew (hold E near cage)<br>' +
      '&#127937; Reach extraction dock<br><br>' +
      '<span style="color:#ffcc00">Click to lock mouse &amp; begin</span><br>' +
      '<span style="font-size:12px;color:#aaccff">' +
      'WASD / Arrows: move | Space: jump | LMB: shoot' +
      '</span>'
    );
  }

  // ── update (called every frame by game harness) ────────────────────────────
  function update() {
    if (!active) return;
    var dt = Math.min(clock.getDelta(), 0.05);  // cap delta to 50ms (20fps min)

    if (!gameOver && !gameWon) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateTurrets(dt);
      updateFuelTanks(dt);
      updateStrikeMarkers(dt);
      updateHostageInteraction(dt);
      checkWinCondition();

      // Tick down shoot cooldown
      if (shootCooldown > 0) shootCooldown -= dt;

      // Show red flash on damage
      checkDamageFlash();
    }

    // Always update particles (death animations continue after game over)
    updateParticles(dt);
    updateHUD();
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  // Called by harness to tear down this module cleanly
  function reset() {
    active = false;

    // Unregister all event listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    if (renderer) renderer.domElement.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLockChange);

    // Remove HUD DOM elements
    var oldHUD = document.getElementById('hb-hud');
    if (oldHUD && oldHUD.parentNode) oldHUD.parentNode.removeChild(oldHUD);
    var oldOverlay = document.getElementById('hb-overlay');
    if (oldOverlay && oldOverlay.parentNode) oldOverlay.parentNode.removeChild(oldOverlay);
    var oldCH = document.getElementById('hb-crosshair');
    if (oldCH && oldCH.parentNode) oldCH.parentNode.removeChild(oldCH);

    hudEl = null;
    overlayEl = null;

    // Clear game object arrays
    // (caller is responsible for clearing the Three.js scene)
    enemies = [];
    turrets = [];
    fuelTanks = [];
    hostages = [];
    strikeMarkers = [];
    particles = [];
    kessler = null;
    extractionDock = null;
  }

  // ── pre-init activation listener ──────────────────────────────────────────
  // Listens for H-then-B hotkey sequence to activate the module from any state
  document.addEventListener('keydown', function (e) {
    if (active) return;
    if (e.key === 'h' || e.key === 'H') {
      lastKeyH = Date.now();
    } else if ((e.key === 'b' || e.key === 'B') && Date.now() - lastKeyH < 400) {
      // Self-start if global scene objects are available from the game harness
      if (typeof THREE !== 'undefined' && window._gameScene) {
        init(window._gameContainer, window._gameRenderer, window._gameCamera, window._gameScene);
      }
    }
  });

  // ── public API ─────────────────────────────────────────────────────────────
  return { init: init, update: update, reset: reset };

}());
