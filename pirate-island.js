window.PirateIsland = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,

    // Activation key tracking (P+I within 400ms)
    pKeyDown: false,
    iKeyDown: false,
    pKeyTime: 0,
    iKeyTime: 0,

    // Backups for deactivation
    bgBackup: null,
    fogBackup: null,

    // Environment meshes
    beachMesh: null,
    cliffMeshes: [],
    palmTrees: [],    // { trunk, canopy }
    bushMeshes: [],
    fortMesh: null,
    towerMeshes: [],
    caveMesh: null,
    hillMesh: null,
    dockMesh: null,
    pirateShips: [],
    sloopMesh: null,
    sloopHelmMesh: null,

    // Cannons
    cannons: [],      // { mesh, crewA, crewB, barrel, fireTimer, destroyed, powderBarrel, powderProgress }
    cannonballs: [],  // { mesh, vel, fromBlackbeard }
    cannonDestroyedCount: 0,

    // Pirates
    pirates: [],      // { mesh, hp, type, pos, state, reloadTimer, alertTimer, vel }
    blackbeard: null, // { mesh, hp, pos, state, reloadTimer, blunderTimer }
    lookout: null,    // { mesh, hp, pos, alerted, shouted }
    allAlerted: false,

    // Prisoners
    prisoners: [],    // { mesh, cage, lock, freed, followPlayer }
    prisonersFreed: 0,

    // Treasure chest
    chestMesh: null,
    chestTaken: false,
    chestLoaded: false,
    chestPos: { x: 0, y: 1, z: -25 },

    // Treasure map
    mapMesh: null,
    mapPickedUp: false,
    waypointLight: null,

    // Torches
    torches: [],      // { mesh, light, thrown, vel, pos, age }
    distractionLights: [], // { light, age, pos }
    tKeyDown: false,

    // Gunpowder barrels placed
    powderBarrels: [],  // { mesh, pos, cannonIdx }

    // Player
    playerHP: 100,
    playerPos: { x: 0, y: 1.8, z: 40 },
    playerVel: { x: 0, y: 0, z: 0 },
    playerYaw: 0,
    playerPitch: 0,
    hasChest: false,
    hasTorch: true,
    torchCount: 3,
    speed: 8,
    onGround: true,
    shooting: false,
    shootCooldown: 0,
    eKeyDown: false,
    eHoldTimer: 0,
    interactTarget: null,   // 'cannon', 'lock', 'chest', 'helm', 'map'

    // Blackbeard pursuit after escape
    bbPursuitTimer: 0,
    bbPursuitActive: false,

    // Sloop state
    sloopCastOff: false,
    sloopPos: { x: 20, y: 0, z: 50 },
    helmHoldTimer: 0,

    // Win/lose
    won: false,
    lost: false,
    gameOver: false,

    // Timers
    elapsedTime: 0,
    timeLimit: 300,    // 5 minutes
    _animId: null,
    _lastTs: 0,

    // Input
    keys: {},

    // HUD
    hudElement: null,
    msgElement: null,
    msgTimer: 0,

    // Collision boxes (AABB) for terrain
    colliders: []     // { minX, maxX, minZ, maxZ, minY, maxY }
  };

  // ─── Constants ───────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW   = 0.4;
  var PIRATE_HP           = 70;
  var PIRATE_DETECT_NIGHT = 12;
  var PIRATE_DETECT_BUSH  = 4;
  var PIRATE_RELOAD       = 4;
  var PIRATE_MELEE_RANGE  = 2;
  var PIRATE_SHOOT_RANGE  = 18;
  var CANNON_FIRE_INTERVAL = 8;
  var CANNON_DAMAGE       = 100;
  var BLACKBEARD_HP       = 500;
  var BLACKBEARD_FIRE_INT = 2.5;
  var BLUNDER_RELOAD      = 6;
  var LOOKOUT_HP          = 60;
  var CHEST_SPEED_PENALTY = 0.3;
  var INTERACT_RANGE      = 3.5;
  var POWDER_HOLD         = 3;
  var HELM_HOLD           = 3;
  var CANNONBALL_SPEED    = 22;
  var BULLET_SPEED        = 30;
  var PLAYER_SHOOT_CD     = 0.5;
  var PRISONER_COUNT      = 4;
  var CANNON_COUNT        = 2;
  var PIRATE_COUNT        = 18;
  var TORCH_COUNT         = 3;
  var DISTRACTION_RANGE   = 8;
  var BB_PURSUIT_DURATION = 15;
  var GRAVITY             = -18;
  var PLAYER_HEIGHT       = 1.8;

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function makeMesh(geo, color, transparent, opacity) {
    var mat;
    if (transparent) {
      mat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: opacity || 0.7 });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }
    return new THREE.Mesh(geo, mat);
  }

  function makeWire(geo) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x553311 }));
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx; var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x; var dy = (a.y || 0) - (b.y || 0); var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function showMessage(msg, dur) {
    if (!state.msgElement) { return; }
    state.msgElement.textContent = msg;
    state.msgElement.style.display = 'block';
    state.msgTimer = dur || 3;
  }

  function addCollider(mesh, w, h, d, ox, oy, oz) {
    var x = (mesh.position.x + (ox || 0));
    var y = (mesh.position.y + (oy || 0));
    var z = (mesh.position.z + (oz || 0));
    state.colliders.push({
      minX: x - w / 2, maxX: x + w / 2,
      minY: y - h / 2, maxY: y + h / 2,
      minZ: z - d / 2, maxZ: z + d / 2
    });
  }

  function playerInBush() {
    var px = state.playerPos.x, pz = state.playerPos.z;
    for (var i = 0; i < state.bushMeshes.length; i++) {
      var b = state.bushMeshes[i];
      if (dist2D(px, pz, b.position.x, b.position.z) < 2) { return true; }
    }
    return false;
  }

  function detectionRange() {
    return playerInBush() ? PIRATE_DETECT_BUSH : PIRATE_DETECT_NIGHT;
  }

  function playerNearDistractionLight() {
    for (var i = 0; i < state.distractionLights.length; i++) {
      var dl = state.distractionLights[i];
      if (dist2D(state.playerPos.x, state.playerPos.z, dl.pos.x, dl.pos.z) < DISTRACTION_RANGE) {
        return true;
      }
    }
    return false;
  }

  // ─── Scene Setup ─────────────────────────────────────────────────────────
  function buildScene() {
    var scene = state.scene;

    // Ambient + moonlight
    var ambient = new THREE.AmbientLight(0x112233, 0.6);
    scene.add(ambient);
    var moon = new THREE.DirectionalLight(0x334466, 0.8);
    moon.position.set(20, 50, 10);
    scene.add(moon);

    // Beach ground
    var beachGeo = new THREE.BoxGeometry(200, 1, 200);
    state.beachMesh = makeMesh(beachGeo, 0xDDCC88);
    state.beachMesh.position.set(0, -0.5, 0);
    scene.add(state.beachMesh);

    // North cliff
    var cliffN = makeMesh(new THREE.BoxGeometry(200, 20, 10), 0x887755);
    cliffN.position.set(0, 10, -100);
    scene.add(cliffN);
    state.cliffMeshes.push(cliffN);
    addCollider(cliffN, 200, 20, 10);

    // South cliff
    var cliffS = makeMesh(new THREE.BoxGeometry(200, 20, 10), 0x887755);
    cliffS.position.set(0, 10, 100);
    scene.add(cliffS);
    state.cliffMeshes.push(cliffS);
    addCollider(cliffS, 200, 20, 10);

    // East cliff
    var cliffE = makeMesh(new THREE.BoxGeometry(10, 20, 200), 0x887755);
    cliffE.position.set(100, 10, 0);
    scene.add(cliffE);
    state.cliffMeshes.push(cliffE);
    addCollider(cliffE, 10, 20, 200);

    // West cliff
    var cliffW = makeMesh(new THREE.BoxGeometry(10, 20, 200), 0x887755);
    cliffW.position.set(-100, 10, 0);
    scene.add(cliffW);
    state.cliffMeshes.push(cliffW);
    addCollider(cliffW, 10, 20, 200);

    buildPalmTrees();
    buildBushes();
    buildFort();
    buildCave();
    buildDock();
    buildPrisoners();
    buildTreasureChest();
    buildTreasureMap();
    buildTorchPickups();
    buildPirates();
    buildBlackbeard();
    buildLookout();
  }

  function buildPalmTrees() {
    var palmPositions = [
      [-30, 30], [-20, 20], [-40, 10], [-35, -10], [-25, -30],
      [30, 35], [25, 15], [40, 5],  [35, -15], [28, -35],
      [-10, 45], [10, 45], [-5, -45], [15, -40], [-15, -20]
    ];
    for (var i = 0; i < palmPositions.length; i++) {
      var px = palmPositions[i][0];
      var pz = palmPositions[i][1];

      var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 7, 8);
      var trunk = makeMesh(trunkGeo, 0x7A5C3A);
      trunk.position.set(px, 3.5, pz);
      state.scene.add(trunk);

      var canopyGeo = new THREE.SphereGeometry(2.5, 8, 6);
      var canopy = makeMesh(canopyGeo, 0x1A5C1A);
      canopy.position.set(px, 8.5, pz);
      state.scene.add(canopy);

      state.palmTrees.push({ trunk: trunk, canopy: canopy });
    }
  }

  function buildBushes() {
    var bushPos = [
      [-12, 8], [12, 8], [-8, 15], [8, 15],
      [-18, 0], [18, 0], [-5, -8], [5, -8],
      [-22, -20], [22, -20], [0, 30], [-30, -5], [30, -5]
    ];
    for (var i = 0; i < bushPos.length; i++) {
      var geo = new THREE.BoxGeometry(2.5, 1.2, 2.5);
      var bush = makeMesh(geo, 0x1A4A1A);
      bush.position.set(bushPos[i][0], 0.6, bushPos[i][1]);
      state.scene.add(bush);
      state.bushMeshes.push(bush);
    }
  }

  function buildFort() {
    // Main fort walls
    var fortGeo = new THREE.BoxGeometry(40, 8, 30);
    state.fortMesh = makeMesh(fortGeo, 0x886644);
    state.fortMesh.position.set(0, 4, -55);
    state.scene.add(state.fortMesh);
    addCollider(state.fortMesh, 40, 8, 30);

    // Fort interior (hollow via position offset: just use walls)
    // Front wall gap (entrance) – leave open by making separate wall segments
    var wallL = makeMesh(new THREE.BoxGeometry(14, 8, 2), 0x886644);
    wallL.position.set(-13, 4, -41);
    state.scene.add(wallL);
    addCollider(wallL, 14, 8, 2);

    var wallR = makeMesh(new THREE.BoxGeometry(14, 8, 2), 0x886644);
    wallR.position.set(13, 4, -41);
    state.scene.add(wallR);
    addCollider(wallR, 14, 8, 2);

    // Battlements top (decorative)
    for (var bi = -4; bi <= 4; bi += 2) {
      var bat = makeMesh(new THREE.BoxGeometry(1.5, 2, 1.5), 0x997755);
      bat.position.set(bi * 4, 9, -55);
      state.scene.add(bat);
    }

    // Two cannon towers on north side
    var towerPositions = [[-18, -58], [18, -58]];
    for (var ti = 0; ti < 2; ti++) {
      var towerGeo = new THREE.CylinderGeometry(4, 4.5, 12, 8);
      var tower = makeMesh(towerGeo, 0x775533);
      tower.position.set(towerPositions[ti][0], 6, towerPositions[ti][1]);
      state.scene.add(tower);
      state.towerMeshes.push(tower);
      addCollider(tower, 9, 12, 9);

      // Cannon on tower
      var cannonGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 8);
      var cannon = makeMesh(cannonGeo, 0x333333);
      cannon.rotation.z = Math.PI / 2;
      cannon.position.set(towerPositions[ti][0], 12.5, towerPositions[ti][1]);
      state.scene.add(cannon);

      // Cannon crew
      var crewA = makeMesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), 0x554433);
      crewA.position.set(towerPositions[ti][0] - 1.5, 12.9, towerPositions[ti][1]);
      state.scene.add(crewA);

      var crewB = makeMesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), 0x554433);
      crewB.position.set(towerPositions[ti][0] + 1.5, 12.9, towerPositions[ti][1]);
      state.scene.add(crewB);

      state.cannons.push({
        mesh: cannon,
        crewA: crewA,
        crewB: crewB,
        pos: { x: towerPositions[ti][0], y: 12.5, z: towerPositions[ti][1] },
        fireTimer: 3 + ti * 4,
        destroyed: false,
        powderBarrel: null,
        powderProgress: 0
      });
    }
  }

  function buildCave() {
    // Hill
    var hillGeo = new THREE.BoxGeometry(18, 10, 18);
    state.hillMesh = makeMesh(hillGeo, 0x887755);
    state.hillMesh.position.set(0, 5, -25);
    state.scene.add(state.hillMesh);
    addCollider(state.hillMesh, 18, 10, 18);

    // Cave entrance
    var caveGeo = new THREE.BoxGeometry(5, 4, 6);
    state.caveMesh = makeMesh(caveGeo, 0x664433);
    state.caveMesh.position.set(0, 2, -17);
    state.scene.add(state.caveMesh);
    // Cave is walkable — no collider (opening)

    // Cave interior indicator (darker box behind)
    var innerGeo = new THREE.BoxGeometry(5, 4, 3);
    var inner = makeMesh(innerGeo, 0x221100);
    inner.position.set(0, 2, -19);
    state.scene.add(inner);
  }

  function buildDock() {
    // Dock platform
    var dockGeo = new THREE.BoxGeometry(50, 1, 12);
    state.dockMesh = makeMesh(dockGeo, 0x554422);
    state.dockMesh.position.set(0, 0.5, 62);
    state.scene.add(state.dockMesh);
    addCollider(state.dockMesh, 50, 1, 12);

    // Dock poles
    for (var di = -20; di <= 20; di += 10) {
      var pole = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x443311);
      pole.position.set(di, 2, 66);
      state.scene.add(pole);
    }

    // Two pirate ships at dock
    var shipPos = [[-18, 68], [18, 68]];
    for (var si = 0; si < 2; si++) {
      var hullGeo = new THREE.BoxGeometry(12, 3, 4);
      var hull = makeMesh(hullGeo, 0x554422);
      hull.position.set(shipPos[si][0], 1.5, shipPos[si][1]);
      state.scene.add(hull);
      addCollider(hull, 12, 3, 4);

      var mast = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), 0x553311);
      mast.position.set(shipPos[si][0], 7, shipPos[si][1]);
      state.scene.add(mast);

      state.pirateShips.push({ hull: hull, mast: mast });
    }

    // Player escape sloop
    var sloopGeo = new THREE.BoxGeometry(10, 2.5, 4);
    state.sloopMesh = makeMesh(sloopGeo, 0x334455);
    state.sloopMesh.position.set(state.sloopPos.x, 1.25, state.sloopPos.z);
    state.scene.add(state.sloopMesh);

    // Helm wheel (small cylinder on sloop)
    var helmGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    state.sloopHelmMesh = makeMesh(helmGeo, 0x885522);
    state.sloopHelmMesh.position.set(state.sloopPos.x, 3, state.sloopPos.z - 1);
    state.scene.add(state.sloopHelmMesh);

    var sloopMast = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), 0x334455);
    sloopMast.position.set(state.sloopPos.x, 6, state.sloopPos.z);
    state.scene.add(sloopMast);
  }

  function buildPrisoners() {
    // Cage near fort interior
    var cagePositions = [
      { x: -8, z: -50 }, { x: -5, z: -50 },
      { x: 5,  z: -50 }, { x: 8,  z: -50 }
    ];
    for (var i = 0; i < PRISONER_COUNT; i++) {
      var px = cagePositions[i].x;
      var pz = cagePositions[i].z;

      // Cage box (wire frame)
      var cageGeo = new THREE.BoxGeometry(2.5, 3, 2.5);
      var cage = makeWire(cageGeo);
      cage.position.set(px, 1.5, pz);
      state.scene.add(cage);

      // Prisoner inside
      var prisonerGeo = new THREE.BoxGeometry(0.7, 1.7, 0.7);
      var prisoner = makeMesh(prisonerGeo, 0xFFDDCC);
      prisoner.position.set(px, 0.85, pz);
      state.scene.add(prisoner);

      // Lock
      var lockGeo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
      var lock = makeMesh(lockGeo, 0x888888);
      lock.position.set(px + 1.25, 1.2, pz);
      state.scene.add(lock);

      state.prisoners.push({
        mesh: prisoner,
        cage: cage,
        lock: lock,
        freed: false,
        followPlayer: false,
        pos: { x: px, y: 0.85, z: pz }
      });
    }
  }

  function buildTreasureChest() {
    var cp = state.chestPos;
    var chestGeo = new THREE.BoxGeometry(1.2, 0.9, 0.8);
    state.chestMesh = makeMesh(chestGeo, 0xFFCC00);
    state.chestMesh.position.set(cp.x, cp.y, cp.z);
    state.scene.add(state.chestMesh);

    // Glow
    var chestLight = new THREE.PointLight(0xFFCC00, 1.5, 6);
    chestLight.position.set(cp.x, cp.y + 1, cp.z);
    state.scene.add(chestLight);
    state._chestLight = chestLight;
  }

  function buildTreasureMap() {
    var mapGeo = new THREE.BoxGeometry(0.8, 0.05, 0.6);
    state.mapMesh = makeMesh(mapGeo, 0xEEDDBB);
    // Place near fort entrance
    state.mapMesh.position.set(-5, 0.5, -38);
    state.scene.add(state.mapMesh);
  }

  function buildTorchPickups() {
    // Torches scattered around
    var torchSpots = [{ x: -15, z: 10 }, { x: 15, z: 10 }, { x: 0, z: -15 }];
    for (var i = 0; i < torchSpots.length; i++) {
      var geo = new THREE.CylinderGeometry(0.1, 0.15, 1, 6);
      var t = makeMesh(geo, 0xFF8800);
      t.position.set(torchSpots[i].x, 0.5, torchSpots[i].z);
      state.scene.add(t);

      var tLight = new THREE.PointLight(0xFF6600, 1.2, 8);
      tLight.position.set(torchSpots[i].x, 1, torchSpots[i].z);
      state.scene.add(tLight);

      state.torches.push({
        mesh: t,
        light: tLight,
        thrown: false,
        vel: { x: 0, y: 0, z: 0 },
        pos: { x: torchSpots[i].x, y: 0.5, z: torchSpots[i].z },
        age: 0,
        picked: false
      });
    }
  }

  function buildPirates() {
    // Distribute pirates: 6 on beach, 6 in fort area, 6 on north end
    var pirateSpots = [
      { x: -20, z: 35 }, { x: 20,  z: 35 }, { x: -10, z: 20 },
      { x: 10,  z: 20 }, { x: 0,   z: 30 }, { x: -30, z: 10 },
      { x: -12, z: -48 }, { x: 12, z: -48 }, { x: -6,  z: -52 },
      { x: 6,   z: -52 }, { x: -18, z: -45 }, { x: 18, z: -45 },
      { x: -5,  z: -70 }, { x: 5,  z: -70 }, { x: -15, z: -65 },
      { x: 15,  z: -65 }, { x: 0,  z: -75 }, { x: 25, z: -60 }
    ];
    for (var i = 0; i < PIRATE_COUNT; i++) {
      var sp = pirateSpots[i] || { x: (i % 5 - 2) * 8, z: -50 + i * 2 };
      var geo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
      var mesh = makeMesh(geo, 0x554433);
      mesh.position.set(sp.x, 0.9, sp.z);
      state.scene.add(mesh);

      // Cutlass
      var cutlass = makeMesh(new THREE.BoxGeometry(0.1, 0.8, 0.05), 0xCCCCCC);
      cutlass.position.set(0.6, 0.3, 0);
      mesh.add(cutlass);

      state.pirates.push({
        mesh: mesh,
        hp: PIRATE_HP,
        pos: { x: sp.x, y: 0.9, z: sp.z },
        patrolOrigin: { x: sp.x, z: sp.z },
        state: 'patrol',  // patrol, chase, attack, dead
        reloadTimer: 0,
        alertTimer: 0,
        vel: { x: 0, z: 0 },
        patrolAngle: Math.random() * Math.PI * 2,
        patrolTimer: 2 + Math.random() * 3,
        alive: true
      });
    }
  }

  function buildBlackbeard() {
    var geo = new THREE.BoxGeometry(1.1, 2, 1.1);
    var mesh = makeMesh(geo, 0x220000);
    mesh.position.set(0, 10.5, -58);  // On fort battlement
    state.scene.add(mesh);

    // Hat
    var hat = makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 8), 0x110000);
    hat.position.set(0, 1.3, 0);
    mesh.add(hat);

    // Beard indicator
    var beard = makeMesh(new THREE.BoxGeometry(0.8, 0.5, 0.2), 0x111111);
    beard.position.set(0, 0.5, 0.56);
    mesh.add(beard);

    state.blackbeard = {
      mesh: mesh,
      hp: BLACKBEARD_HP,
      pos: { x: 0, y: 10.5, z: -58 },
      state: 'guard',
      reloadTimer: 0,
      blunderTimer: 0,
      alive: true
    };
  }

  function buildLookout() {
    // Crow's nest on a tall mast near fort
    var mastGeo = new THREE.CylinderGeometry(0.25, 0.25, 16, 8);
    var mast = makeMesh(mastGeo, 0x553311);
    mast.position.set(5, 8, -55);
    state.scene.add(mast);

    // Crow's nest platform
    var nestGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
    var nest = makeMesh(nestGeo, 0x553311);
    nest.position.set(5, 16.25, -55);
    state.scene.add(nest);

    // Lookout figure (tall)
    var figGeo = new THREE.BoxGeometry(0.7, 2.2, 0.7);
    var fig = makeMesh(figGeo, 0x554433);
    fig.position.set(5, 17.6, -55);
    state.scene.add(fig);

    state.lookout = {
      mesh: fig,
      hp: LOOKOUT_HP,
      pos: { x: 5, y: 17.6, z: -55 },
      alerted: false,
      shouted: false,
      alive: true
    };
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function buildHUD() {
    // Container
    var hud = document.createElement('div');
    hud.id = 'pi-hud';
    hud.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'background:rgba(0,0,0,0.65)', 'color:#FFD700',
      'font:bold 13px monospace', 'padding:6px 12px',
      'z-index:9999', 'pointer-events:none',
      'display:none', 'user-select:none'
    ].join(';');
    document.body.appendChild(hud);
    state.hudElement = hud;

    // Message overlay
    var msg = document.createElement('div');
    msg.id = 'pi-msg';
    msg.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.8)', 'color:#FFD700',
      'font:bold 18px monospace', 'padding:12px 24px',
      'border:2px solid #FFD700', 'border-radius:4px',
      'z-index:10000', 'pointer-events:none',
      'display:none', 'text-align:center'
    ].join(';');
    document.body.appendChild(msg);
    state.msgElement = msg;

    // Crosshair
    var ch = document.createElement('div');
    ch.id = 'pi-crosshair';
    ch.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px', 'height:16px',
      'border:2px solid rgba(255,255,255,0.8)',
      'border-radius:50%',
      'z-index:9998', 'pointer-events:none', 'display:none'
    ].join(';');
    document.body.appendChild(ch);
    state._crosshair = ch;

    // HP bar
    var hp = document.createElement('div');
    hp.id = 'pi-hp';
    hp.style.cssText = [
      'position:fixed', 'bottom:20px', 'left:20px',
      'width:200px', 'height:14px',
      'background:#333', 'border:1px solid #FFD700',
      'z-index:9999', 'display:none'
    ].join(';');
    var hpFill = document.createElement('div');
    hpFill.id = 'pi-hp-fill';
    hpFill.style.cssText = 'width:100%;height:100%;background:#CC2200;transition:width 0.1s';
    hp.appendChild(hpFill);
    document.body.appendChild(hp);
    state._hpBar = hp;
    state._hpFill = hpFill;

    // Timer
    var tmr = document.createElement('div');
    tmr.id = 'pi-timer';
    tmr.style.cssText = [
      'position:fixed', 'top:30px', 'right:20px',
      'color:#FF4444', 'font:bold 22px monospace',
      'z-index:9999', 'display:none'
    ].join(';');
    document.body.appendChild(tmr);
    state._timerEl = tmr;

    // Torch count
    var tc = document.createElement('div');
    tc.id = 'pi-torch';
    tc.style.cssText = [
      'position:fixed', 'bottom:44px', 'left:20px',
      'color:#FF8800', 'font:bold 13px monospace',
      'z-index:9999', 'display:none'
    ].join(';');
    document.body.appendChild(tc);
    state._torchEl = tc;
  }

  function updateHUD() {
    if (!state.hudElement) { return; }
    var cannons = state.cannonDestroyedCount + '/2 DESTROYED';
    var prisoners = state.prisonersFreed + '/4';
    var chest = state.chestLoaded ? 'LOADED' : (state.chestTaken ? 'CARRYING' : 'NOT TAKEN');
    var bb = state.blackbeard && state.blackbeard.alive ? 'ALIVE' : 'DEAD';
    var escapeReady = (state.chestLoaded) ? 'READY' : 'NOT READY';
    var timeLeft = Math.max(0, state.timeLimit - state.elapsedTime);
    var mins = Math.floor(timeLeft / 60);
    var secs = Math.floor(timeLeft % 60);
    state.hudElement.textContent = 'PIRATE ISLAND  [CANNONS: ' + cannons + ']  [PRISONERS: ' + prisoners + ']  [CHEST: ' + chest + ']  [BLACKBEARD: ' + bb + ']  |  ESCAPE: ' + escapeReady;
    if (state._hpFill) {
      state._hpFill.style.width = Math.max(0, state.playerHP) + '%';
    }
    if (state._timerEl) {
      state._timerEl.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
    if (state._torchEl) {
      state._torchEl.textContent = 'TORCHES: ' + state.torchCount + '  [T=THROW]';
    }
    if (state.msgTimer > 0) {
      state.msgTimer -= 0;  // decremented in update
    } else if (state.msgElement && state.msgElement.style.display !== 'none') {
      state.msgElement.style.display = 'none';
    }
  }

  function showHUD(show) {
    var d = show ? 'block' : 'none';
    if (state.hudElement)   { state.hudElement.style.display   = d; }
    if (state._crosshair)  { state._crosshair.style.display   = d; }
    if (state._hpBar)      { state._hpBar.style.display       = d; }
    if (state._timerEl)    { state._timerEl.style.display     = d; }
    if (state._torchEl)    { state._torchEl.style.display     = d; }
  }

  // ─── Input ───────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    var now = state.elapsedTime;

    if (key === 'p') { state.pKeyDown = true; state.pKeyTime = now; }
    if (key === 'i') { state.iKeyDown = true; state.iKeyTime = now; }

    if (state.pKeyDown && state.iKeyDown) {
      var diff = Math.abs(state.pKeyTime - state.iKeyTime);
      if (diff <= ACTIVATION_WINDOW) {
        if (state.active) { deactivate(); } else { activate(); }
        return;
      }
    }

    if (!state.active) { return; }
    state.keys[key] = true;

    if (key === 'e') { state.eKeyDown = true; }
    if (key === 't') { throwTorch(); }
    if (key === ' ') { tryJump(); }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'p') { state.pKeyDown = false; }
    if (key === 'i') { state.iKeyDown = false; }
    if (!state.active) { return; }
    state.keys[key] = false;
    if (key === 'e') {
      state.eKeyDown = false;
      state.eHoldTimer = 0;
      state.helmHoldTimer = 0;
    }
  }

  function onMouseMove(e) {
    if (!state.active || state.gameOver) { return; }
    state.playerYaw   -= e.movementX * 0.002;
    state.playerPitch -= e.movementY * 0.002;
    state.playerPitch  = Math.max(-1.2, Math.min(1.2, state.playerPitch));
  }

  function onMouseDown(e) {
    if (!state.active || state.gameOver) { return; }
    if (e.button === 0) { tryShoot(); }
  }

  function tryJump() {
    if (state.onGround) {
      state.playerVel.y = 8;
      state.onGround = false;
    }
  }

  function tryShoot() {
    if (state.shootCooldown > 0) { return; }
    state.shootCooldown = PLAYER_SHOOT_CD;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(state.playerPitch, state.playerYaw, 0, 'YXZ'));

    // Check for hits (raycast approximation via distance + direction check)
    var px = state.playerPos.x, py = state.playerPos.y, pz = state.playerPos.z;

    // Check pirates
    for (var i = 0; i < state.pirates.length; i++) {
      var p = state.pirates[i];
      if (!p.alive) { continue; }
      var toEnemyX = p.pos.x - px;
      var toEnemyY = p.pos.y - py;
      var toEnemyZ = p.pos.z - pz;
      var enemyDist = Math.sqrt(toEnemyX * toEnemyX + toEnemyY * toEnemyY + toEnemyZ * toEnemyZ);
      if (enemyDist > 40) { continue; }
      var nx = toEnemyX / enemyDist, ny = toEnemyY / enemyDist, nz = toEnemyZ / enemyDist;
      var dot = nx * dir.x + ny * dir.y + nz * dir.z;
      if (dot > 0.97) {
        damagePirate(i, 35);
        showMessage('HIT! Pirate HP: ' + Math.max(0, state.pirates[i].hp), 1.5);
        return;
      }
    }

    // Check lookout
    if (state.lookout && state.lookout.alive) {
      var lo = state.lookout;
      var ldx = lo.pos.x - px, ldy = lo.pos.y - py, ldz = lo.pos.z - pz;
      var ld = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz);
      if (ld < 40) {
        var lnx = ldx / ld, lny = ldy / ld, lnz = ldz / ld;
        var ldot = lnx * dir.x + lny * dir.y + lnz * dir.z;
        if (ldot > 0.96) {
          state.lookout.hp -= 40;
          showMessage('LOOKOUT HIT! HP: ' + Math.max(0, state.lookout.hp), 1.5);
          if (state.lookout.hp <= 0) {
            killLookout();
          }
          return;
        }
      }
    }

    // Check blackbeard
    if (state.blackbeard && state.blackbeard.alive) {
      var bb = state.blackbeard;
      var bdx = bb.pos.x - px, bdy = bb.pos.y - py, bdz = bb.pos.z - pz;
      var bd = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz);
      if (bd < 60) {
        var bnx = bdx / bd, bny = bdy / bd, bnz = bdz / bd;
        var bdot = bnx * dir.x + bny * dir.y + bnz * dir.z;
        if (bdot > 0.97) {
          state.blackbeard.hp -= 25;
          showMessage('BLACKBEARD HIT! HP: ' + Math.max(0, state.blackbeard.hp), 2);
          if (state.blackbeard.hp <= 0) {
            killBlackbeard();
          }
          return;
        }
      }
    }

    // Check locks (shoot to free prisoners)
    for (var j = 0; j < state.prisoners.length; j++) {
      var pr = state.prisoners[j];
      if (pr.freed) { continue; }
      var lx = pr.lock.position.x - px, ly = pr.lock.position.y - py, lz = pr.lock.position.z - pz;
      var ld2 = Math.sqrt(lx * lx + ly * ly + lz * lz);
      if (ld2 > 15) { continue; }
      var lnx2 = lx / ld2, lny2 = ly / ld2, lnz2 = lz / ld2;
      var ldot2 = lnx2 * dir.x + lny2 * dir.y + lnz2 * dir.z;
      if (ldot2 > 0.97) {
        freePrisoner(j);
        showMessage('LOCK SHOT — PRISONER FREED! (' + state.prisonersFreed + '/4)', 2.5);
        return;
      }
    }

    // Check powder barrels (detonate)
    for (var k = 0; k < state.powderBarrels.length; k++) {
      var pb = state.powderBarrels[k];
      if (!pb || pb.detonated) { continue; }
      var bx = pb.pos.x - px, by2 = pb.pos.y - py, bz2 = pb.pos.z - pz;
      var bd2 = Math.sqrt(bx * bx + by2 * by2 + bz2 * bz2);
      if (bd2 > 30) { continue; }
      var bnx2 = bx / bd2, bny2 = by2 / bd2, bnz2 = bz2 / bd2;
      var bdot2 = bnx2 * dir.x + bny2 * dir.y + bnz2 * dir.z;
      if (bdot2 > 0.96) {
        detonateBarrel(k);
        return;
      }
    }
  }

  // ─── Game Logic ──────────────────────────────────────────────────────────
  function freePrisoner(idx) {
    var pr = state.prisoners[idx];
    if (pr.freed) { return; }
    pr.freed = true;
    pr.followPlayer = true;
    state.prisonersFreed++;
    state.scene.remove(pr.cage);
    state.scene.remove(pr.lock);
  }

  function damagePirate(idx, dmg) {
    var p = state.pirates[idx];
    if (!p.alive) { return; }
    p.hp -= dmg;
    p.state = 'chase';
    state.allAlerted = true;
    if (p.hp <= 0) {
      p.alive = false;
      p.state = 'dead';
      state.scene.remove(p.mesh);
    }
  }

  function killLookout() {
    state.lookout.alive = false;
    state.scene.remove(state.lookout.mesh);
    showMessage('LOOKOUT ELIMINATED — ALARM SUPPRESSED', 3);
  }

  function killBlackbeard() {
    state.blackbeard.alive = false;
    state.scene.remove(state.blackbeard.mesh);
    showMessage('BLACKBEARD DEFEATED!', 4);
  }

  function placePowderBarrel(cannonIdx) {
    var cn = state.cannons[cannonIdx];
    if (cn.destroyed || cn.powderBarrel) { return; }
    var geo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8);
    var barrel = makeMesh(geo, 0xFF4400);
    barrel.position.set(cn.pos.x, cn.pos.y - 0.5, cn.pos.z + 1);
    state.scene.add(barrel);
    cn.powderBarrel = barrel;
    var pb = { mesh: barrel, pos: { x: cn.pos.x, y: cn.pos.y - 0.5, z: cn.pos.z + 1 }, cannonIdx: cannonIdx, detonated: false };
    state.powderBarrels.push(pb);
    showMessage('GUNPOWDER BARREL PLACED — RETREAT AND SHOOT IT!', 3);
  }

  function detonateBarrel(pbIdx) {
    var pb = state.powderBarrels[pbIdx];
    if (!pb || pb.detonated) { return; }
    pb.detonated = true;
    state.scene.remove(pb.mesh);

    var cn = state.cannons[pb.cannonIdx];
    if (!cn.destroyed) {
      cn.destroyed = true;
      state.cannonDestroyedCount++;
      state.scene.remove(cn.mesh);
      state.scene.remove(cn.crewA);
      state.scene.remove(cn.crewB);
      showMessage('CANNON DESTROYED! (' + state.cannonDestroyedCount + '/2)', 3);
    }

    // Explosion flash light
    var flash = new THREE.PointLight(0xFF4400, 5, 15);
    flash.position.set(pb.pos.x, pb.pos.y, pb.pos.z);
    state.scene.add(flash);
    state._explosionFlash = { light: flash, timer: 0.5 };
  }

  function throwTorch() {
    if (state.torchCount <= 0) { return; }
    state.torchCount--;
    var dir = new THREE.Vector3(0, 0.3, -1);
    dir.applyEuler(new THREE.Euler(0, state.playerYaw, 0, 'YXZ'));
    dir.normalize();

    var geo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
    var torchMesh = makeMesh(geo, 0xFF8800);
    torchMesh.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.scene.add(torchMesh);

    var tLight = new THREE.PointLight(0xFF6600, 1.5, 12);
    tLight.position.copy(torchMesh.position);
    state.scene.add(tLight);

    state.torches.push({
      mesh: torchMesh,
      light: tLight,
      thrown: true,
      vel: { x: dir.x * 10, y: dir.y * 10 + 5, z: dir.z * 10 },
      pos: { x: state.playerPos.x, y: state.playerPos.y, z: state.playerPos.z },
      age: 0,
      picked: false
    });
    showMessage('TORCH THROWN — DISTRACTING PIRATES!', 2);
  }

  function updateTorches(dt) {
    for (var i = 0; i < state.torches.length; i++) {
      var t = state.torches[i];
      if (t.picked || !t.thrown) { continue; }
      t.age += dt;
      t.vel.y += GRAVITY * dt;
      t.pos.x += t.vel.x * dt;
      t.pos.y += t.vel.y * dt;
      t.pos.z += t.vel.z * dt;
      if (t.pos.y <= 0.5) {
        t.pos.y = 0.5;
        t.vel.x *= 0.2;
        t.vel.y = 0;
        t.vel.z *= 0.2;

        // Became a distraction light on landing
        if (!t._landed) {
          t._landed = true;
          state.distractionLights.push({ light: t.light, age: 0, pos: t.pos });
        }
      }
      t.mesh.position.set(t.pos.x, t.pos.y, t.pos.z);
      t.light.position.set(t.pos.x, t.pos.y + 0.3, t.pos.z);
    }

    // Age out distraction lights
    for (var j = state.distractionLights.length - 1; j >= 0; j--) {
      state.distractionLights[j].age += dt;
      if (state.distractionLights[j].age > 20) {
        state.scene.remove(state.distractionLights[j].light);
        state.distractionLights.splice(j, 1);
      }
    }

    // Pickup torches on ground (not thrown)
    for (var k = 0; k < state.torches.length; k++) {
      var tr = state.torches[k];
      if (tr.picked || tr.thrown) { continue; }
      var d = dist2D(state.playerPos.x, state.playerPos.z, tr.pos.x, tr.pos.z);
      if (d < 1.5) {
        tr.picked = true;
        state.scene.remove(tr.mesh);
        state.scene.remove(tr.light);
        state.torchCount++;
        showMessage('TORCH PICKED UP (' + state.torchCount + ')', 1.5);
      }
    }
  }

  function updatePirates(dt) {
    var pp = state.playerPos;
    var baseDetect = detectionRange();

    // Check distraction: pirates near lights chase the light, not player
    var distracted = playerNearDistractionLight();

    for (var i = 0; i < state.pirates.length; i++) {
      var p = state.pirates[i];
      if (!p.alive) { continue; }
      p.reloadTimer = Math.max(0, p.reloadTimer - dt);

      var dToPlayer = dist2D(p.pos.x, p.pos.z, pp.x, pp.z);

      // Alarm propagation
      if (state.allAlerted && p.state === 'patrol') {
        p.state = 'chase';
      }

      // Detection
      if (p.state === 'patrol') {
        if (dToPlayer < baseDetect && !distracted) {
          p.state = 'chase';
          state.allAlerted = true;
          if (state.lookout && state.lookout.alive && !state.lookout.alerted) {
            state.lookout.alerted = true;
          }
        }
      }

      if (p.state === 'patrol') {
        // Walk patrol circle
        p.patrolTimer -= dt;
        if (p.patrolTimer <= 0) {
          p.patrolAngle += (Math.random() - 0.5) * Math.PI;
          p.patrolTimer = 2 + Math.random() * 3;
        }
        p.pos.x += Math.cos(p.patrolAngle) * 2 * dt;
        p.pos.z += Math.sin(p.patrolAngle) * 2 * dt;

      } else if (p.state === 'chase') {
        // Move toward player
        var dx = pp.x - p.pos.x, dz = pp.z - p.pos.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        var spd = 4;
        p.pos.x += (dx / len) * spd * dt;
        p.pos.z += (dz / len) * spd * dt;

        // Rotate toward player
        p.mesh.rotation.y = Math.atan2(dx, dz);

        if (dToPlayer < PIRATE_MELEE_RANGE) {
          // Melee attack
          if (p.reloadTimer <= 0) {
            state.playerHP -= 12;
            p.reloadTimer = 1;
            if (state.playerHP <= 0) { triggerDeath(); }
          }
        } else if (dToPlayer < PIRATE_SHOOT_RANGE && p.reloadTimer <= 0) {
          // Shoot
          p.reloadTimer = PIRATE_RELOAD;
          spawnEnemyBullet(p.pos, pp, false);
        }
      }

      p.mesh.position.set(p.pos.x, 0.9, p.pos.z);
    }
  }

  function spawnEnemyBullet(from, to, isCannonball) {
    var geo = isCannonball
      ? new THREE.SphereGeometry(0.25, 6, 6)
      : new THREE.SphereGeometry(0.08, 4, 4);
    var color = isCannonball ? 0x333333 : 0xFFFFCC;
    var ball = makeMesh(geo, color);
    ball.position.set(from.x, from.y || 1.2, from.z);
    state.scene.add(ball);

    var dx = to.x - from.x;
    var dy = (to.y || 1.5) - (from.y || 1.2);
    var dz = to.z - from.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var spd = isCannonball ? CANNONBALL_SPEED : BULLET_SPEED;

    state.cannonballs.push({
      mesh: ball,
      vel: { x: dx / len * spd, y: dy / len * spd, z: dz / len * spd },
      fromBlackbeard: false,
      isCannonball: isCannonball,
      age: 0
    });
  }

  function updateCannonballs(dt) {
    for (var i = state.cannonballs.length - 1; i >= 0; i--) {
      var cb = state.cannonballs[i];
      cb.age += dt;
      cb.mesh.position.x += cb.vel.x * dt;
      cb.mesh.position.y += cb.vel.y * dt;
      cb.mesh.position.z += cb.vel.z * dt;

      var dmg = cb.isCannonball ? CANNON_DAMAGE : 20;
      var hitRange = cb.isCannonball ? 1.5 : 0.5;

      if (cb.age > 5 || cb.mesh.position.y < -5) {
        state.scene.remove(cb.mesh);
        state.cannonballs.splice(i, 1);
        continue;
      }

      // Hit player check
      var dx = cb.mesh.position.x - state.playerPos.x;
      var dy = cb.mesh.position.y - state.playerPos.y;
      var dz = cb.mesh.position.z - state.playerPos.z;
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < hitRange) {
        state.playerHP -= dmg;
        state.scene.remove(cb.mesh);
        state.cannonballs.splice(i, 1);
        if (state.playerHP <= 0) { triggerDeath(); }
        continue;
      }
    }
  }

  function updateCannons(dt) {
    for (var i = 0; i < state.cannons.length; i++) {
      var cn = state.cannons[i];
      if (cn.destroyed) { continue; }
      cn.fireTimer -= dt;
      if (cn.fireTimer <= 0) {
        cn.fireTimer = CANNON_FIRE_INTERVAL;
        // Fire cannonball at player
        spawnEnemyBullet(
          { x: cn.pos.x, y: cn.pos.y, z: cn.pos.z },
          { x: state.playerPos.x, y: state.playerPos.y, z: state.playerPos.z },
          true
        );
      }
    }
  }

  function updateBlackbeard(dt) {
    if (!state.blackbeard || !state.blackbeard.alive) { return; }
    var bb = state.blackbeard;
    bb.reloadTimer  = Math.max(0, bb.reloadTimer  - dt);
    bb.blunderTimer = Math.max(0, bb.blunderTimer - dt);

    var dToPlayer = dist3D(bb.pos, state.playerPos);

    // Rotate toward player
    var dx = state.playerPos.x - bb.pos.x;
    var dz = state.playerPos.z - bb.pos.z;
    bb.mesh.rotation.y = Math.atan2(dx, dz);

    if (dToPlayer < 50 && bb.reloadTimer <= 0) {
      bb.reloadTimer = BLACKBEARD_FIRE_INT;
      spawnEnemyBullet(bb.pos, state.playerPos, false);
    }
    if (dToPlayer < 12 && bb.blunderTimer <= 0) {
      bb.blunderTimer = BLUNDER_RELOAD;
      // Blunderbuss: area damage
      state.playerHP -= 35;
      showMessage('BLUNDERBUSS HIT! -35 HP', 2);
      if (state.playerHP <= 0) { triggerDeath(); }
    }

    // Blackbeard fires at fleeing ship
    if (state.bbPursuitActive && state.sloopCastOff) {
      state.bbPursuitTimer += dt;
      if (state.bbPursuitTimer < BB_PURSUIT_DURATION && bb.reloadTimer <= 0) {
        bb.reloadTimer = 1.5;
        spawnEnemyBullet(
          bb.pos,
          { x: state.sloopPos.x, y: 1.5, z: state.sloopPos.z },
          true
        );
      }
    }
  }

  function updateLookout(dt) {
    if (!state.lookout || !state.lookout.alive) { return; }
    var lo = state.lookout;
    var dToPlayer = dist2D(lo.pos.x, lo.pos.z, state.playerPos.x, state.playerPos.z);

    if (!lo.alerted && !lo.shouted) {
      var detect = PIRATE_DETECT_NIGHT * 1.5; // lookout sees further
      if (dToPlayer < detect) {
        lo.alerted = true;
        lo.shouted = true;
        state.allAlerted = true;
        showMessage('LOOKOUT SPOTTED YOU — ALL PIRATES ALERTED!', 4);
      }
    }
  }

  // ─── Interact (E key hold) ────────────────────────────────────────────────
  function updateInteract(dt) {
    if (!state.eKeyDown) {
      state.eHoldTimer = 0;
      state.helmHoldTimer = 0;
      return;
    }

    var pp = state.playerPos;

    // Check cannon planting (powder barrel)
    for (var ci = 0; ci < state.cannons.length; ci++) {
      var cn = state.cannons[ci];
      if (cn.destroyed || cn.powderBarrel) { continue; }
      var d = dist2D(pp.x, pp.z, cn.pos.x, cn.pos.z);
      if (d < INTERACT_RANGE + 2) {
        cn.powderProgress += dt;
        if (cn.powderProgress >= POWDER_HOLD) {
          cn.powderProgress = 0;
          placePowderBarrel(ci);
        } else {
          showMessage('PLANTING GUNPOWDER... ' + Math.floor(cn.powderProgress / POWDER_HOLD * 100) + '%', 0.1);
        }
        return;
      }
    }
    cn = undefined; // avoid accidental reference

    // Check chest pickup
    if (!state.chestTaken && !state.hasChest) {
      var cd = dist3D(pp, state.chestPos);
      if (cd < INTERACT_RANGE) {
        state.chestTaken = true;
        state.hasChest = true;
        state.speed = 8 * (1 - CHEST_SPEED_PENALTY);
        state.scene.remove(state.chestMesh);
        state.scene.remove(state._chestLight);
        showMessage('TREASURE CHEST TAKEN! SPEED REDUCED — GET TO THE SLOOP!', 3);
        return;
      }
    }

    // Check sloop helm (cast off)
    if (state.hasChest || state.chestLoaded) {
      var helmPos = { x: state.sloopPos.x, y: 3, z: state.sloopPos.z - 1 };
      var hd = dist3D(pp, helmPos);
      if (hd < INTERACT_RANGE) {
        // First load chest if carrying
        if (state.hasChest && !state.chestLoaded) {
          state.hasChest = false;
          state.chestLoaded = true;
          state.speed = 8;
          showMessage('CHEST LOADED ON SLOOP!', 2);
          return;
        }
        if (state.chestLoaded) {
          state.helmHoldTimer += dt;
          showMessage('CASTING OFF... ' + Math.floor(state.helmHoldTimer / HELM_HOLD * 100) + '%', 0.1);
          if (state.helmHoldTimer >= HELM_HOLD) {
            castOff();
          }
          return;
        }
      }
    }

    // Load chest at sloop even without helm (boarding)
    if (state.hasChest && !state.chestLoaded) {
      var sloopD = dist2D(pp.x, pp.z, state.sloopPos.x, state.sloopPos.z);
      if (sloopD < 6) {
        state.hasChest = false;
        state.chestLoaded = true;
        state.speed = 8;
        showMessage('CHEST LOADED ON SLOOP! Now hold E at helm to cast off.', 3);
        return;
      }
    }

    // Check map pickup
    if (!state.mapPickedUp && state.mapMesh) {
      var md = dist2D(pp.x, pp.z, state.mapMesh.position.x, state.mapMesh.position.z);
      if (md < 2) {
        state.mapPickedUp = true;
        state.scene.remove(state.mapMesh);
        // Add waypoint to cave
        state.waypointLight = new THREE.PointLight(0xFFCC00, 2, 20);
        state.waypointLight.position.set(state.chestPos.x, 6, state.chestPos.z);
        state.scene.add(state.waypointLight);
        showMessage('TREASURE MAP! Cave is marked with a golden light.', 4);
        return;
      }
    }
  }

  // ─── Sloop / Escape ───────────────────────────────────────────────────────
  function castOff() {
    if (state.sloopCastOff) { return; }
    state.sloopCastOff = true;
    state.bbPursuitActive = true;
    state.bbPursuitTimer = 0;
    showMessage('SLOOP AWAY! BLACKBEARD IS FIRING!', 5);
  }

  function updateSloop(dt) {
    if (!state.sloopCastOff) { return; }
    // Move sloop south (escape)
    state.sloopPos.z += 10 * dt;
    state.sloopMesh.position.z = state.sloopPos.z;
    state.sloopHelmMesh.position.z = state.sloopPos.z - 1;

    // Move player with sloop
    state.playerPos.z += 10 * dt;

    if (state.sloopPos.z > 150) {
      triggerWin();
    }
  }

  // ─── Prisoner follow ─────────────────────────────────────────────────────
  function updatePrisoners(dt) {
    for (var i = 0; i < state.prisoners.length; i++) {
      var pr = state.prisoners[i];
      if (!pr.freed || !pr.followPlayer) { continue; }
      var dx = state.playerPos.x - pr.pos.x;
      var dz = state.playerPos.z - pr.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 2) {
        var spd = 4;
        pr.pos.x += (dx / d) * spd * dt;
        pr.pos.z += (dz / d) * spd * dt;
        pr.mesh.position.set(pr.pos.x, 0.85, pr.pos.z);
      }
    }
  }

  // ─── Player movement ─────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (state.gameOver) { return; }

    var spd = state.speed;
    var fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyEuler(new THREE.Euler(0, state.playerYaw, 0, 'YXZ'));
    var right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(new THREE.Euler(0, state.playerYaw, 0, 'YXZ'));

    var moveX = 0, moveZ = 0;
    if (state.keys['w'] || state.keys['arrowup'])    { moveX += fwd.x; moveZ += fwd.z; }
    if (state.keys['s'] || state.keys['arrowdown'])  { moveX -= fwd.x; moveZ -= fwd.z; }
    if (state.keys['a'] || state.keys['arrowleft'])  { moveX -= right.x; moveZ -= right.z; }
    if (state.keys['d'] || state.keys['arrowright']) { moveX += right.x; moveZ += right.z; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    state.playerPos.x += moveX * spd * dt;
    state.playerPos.z += moveZ * spd * dt;

    // Gravity
    state.playerVel.y += GRAVITY * dt;
    state.playerPos.y += state.playerVel.y * dt;

    if (state.playerPos.y <= PLAYER_HEIGHT) {
      state.playerPos.y = PLAYER_HEIGHT;
      state.playerVel.y = 0;
      state.onGround = true;
    }

    // Boundary clamp
    state.playerPos.x = Math.max(-90, Math.min(90, state.playerPos.x));
    state.playerPos.z = Math.max(-95, Math.min(95, state.playerPos.z));

    // Simple collider check (push out)
    for (var i = 0; i < state.colliders.length; i++) {
      var c = state.colliders[i];
      var px = state.playerPos.x, py = state.playerPos.y, pz = state.playerPos.z;
      if (px > c.minX - 0.5 && px < c.maxX + 0.5 &&
          py > c.minY - 0.5 && py < c.maxY + 0.5 &&
          pz > c.minZ - 0.5 && pz < c.maxZ + 0.5) {
        // Push back
        state.playerPos.x -= moveX * spd * dt * 1.5;
        state.playerPos.z -= moveZ * spd * dt * 1.5;
      }
    }

    // Update camera
    state.camera.position.set(state.playerPos.x, state.playerPos.y + 0.3, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;

    // Shoot cooldown
    state.shootCooldown = Math.max(0, state.shootCooldown - dt);

    // Waypoint flicker (pulse)
    if (state.waypointLight) {
      state.waypointLight.intensity = 1.5 + Math.sin(state.elapsedTime * 4) * 0.5;
    }

    // Explosion flash
    if (state._explosionFlash) {
      state._explosionFlash.timer -= dt;
      if (state._explosionFlash.timer <= 0) {
        state.scene.remove(state._explosionFlash.light);
        state._explosionFlash = null;
      }
    }
  }

  // ─── Win / Lose ──────────────────────────────────────────────────────────
  function triggerWin() {
    if (state.gameOver) { return; }
    state.gameOver = true;
    state.won = true;
    showMessage('VICTORY! You escaped with the treasure! The crew cheers!', 0);
    state.msgElement.style.color = '#FFD700';
    state.msgElement.style.display = 'block';
    setTimeout(deactivate, 8000);
  }

  function triggerDeath() {
    if (state.gameOver) { return; }
    state.gameOver = true;
    state.lost = true;
    showMessage('YOU FELL IN BATTLE. The treasure remains with Blackbeard.', 0);
    state.msgElement.style.color = '#FF4444';
    state.msgElement.style.display = 'block';
    setTimeout(deactivate, 6000);
  }

  function checkTimer() {
    if (state.elapsedTime >= state.timeLimit && !state.gameOver && !state.sloopCastOff) {
      state.gameOver = true;
      state.lost = true;
      showMessage('TIME\'S UP! The tide turned against you. Mission failed.', 0);
      state.msgElement.style.color = '#FF4444';
      state.msgElement.style.display = 'block';
      setTimeout(deactivate, 6000);
    }
  }

  // ─── Activate / Deactivate ───────────────────────────────────────────────
  function activate() {
    if (state.active) { return; }

    // Find or create renderer / scene / camera from global context
    if (typeof window.gameScene !== 'undefined' && window.gameScene) {
      state.scene    = window.gameScene;
      state.camera   = window.gameCamera;
      state.renderer = window.gameRenderer;
      state._ownScene = false;
    } else {
      // Create standalone
      state.scene    = new THREE.Scene();
      state.camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
      state.renderer = new THREE.WebGLRenderer({ antialias: true });
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      document.body.appendChild(state.renderer.domElement);
      state._ownScene = true;
    }

    state.bgBackup  = state.scene.background;
    state.fogBackup = state.scene.fog;
    state.scene.background = new THREE.Color(0x001133);
    state.scene.fog = new THREE.FogExp2(0x001133, 0.01);

    state.camera.position.set(0, PLAYER_HEIGHT + 0.3, 40);
    state.camera.rotation.order = 'YXZ';

    buildScene();
    buildHUD();

    state.active = true;
    state.elapsedTime = 0;
    state._lastTs = performance.now();

    showHUD(true);
    showMessage('PIRATE ISLAND — Steal the chest! Sink 2 cannons! Free prisoners! Escape by sloop!', 5);

    // Pointer lock
    if (state._ownScene && state.renderer.domElement.requestPointerLock) {
      state.renderer.domElement.requestPointerLock();
    }

    state._animId = requestAnimationFrame(loop);
  }

  function deactivate() {
    if (!state.active) { return; }
    state.active = false;

    if (state._animId) {
      cancelAnimationFrame(state._animId);
      state._animId = null;
    }

    // Restore scene
    state.scene.background = state.bgBackup;
    state.scene.fog        = state.fogBackup;

    // Remove all added objects (track via scene children snapshot)
    // Since we don't track all individually, just reset scene if owned
    if (state._ownScene) {
      while (state.scene.children.length > 0) {
        state.scene.remove(state.scene.children[0]);
      }
      if (state.renderer && state.renderer.domElement && state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
    }

    showHUD(false);
    if (state.msgElement) { state.msgElement.style.display = 'none'; }

    if (document.exitPointerLock) { document.exitPointerLock(); }
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!state.active) { return; }
    var dt = Math.min((ts - state._lastTs) / 1000, 0.05);
    state._lastTs = ts;
    state.elapsedTime += dt;

    if (!state.gameOver) {
      updatePlayer(dt);
      updateInteract(dt);
      updatePirates(dt);
      updateLookout(dt);
      updateCannons(dt);
      updateBlackbeard(dt);
      updateCannonballs(dt);
      updateTorches(dt);
      updatePrisoners(dt);
      updateSloop(dt);
      checkTimer();
    }

    updateHUD();
    if (state.msgTimer > 0) { state.msgTimer -= dt; }

    if (state._ownScene) {
      state.renderer.render(state.scene, state.camera);
    }

    state._animId = requestAnimationFrame(loop);
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', function () {
      if (state.camera && state._ownScene) {
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    });
  }

  function update(dt) {
    // Called by host engine each frame when integrated
    if (!state.active || state._ownScene) { return; }
    if (!state.gameOver) {
      updatePlayer(dt || 0.016);
      updateInteract(dt || 0.016);
      updatePirates(dt || 0.016);
      updateLookout(dt || 0.016);
      updateCannons(dt || 0.016);
      updateBlackbeard(dt || 0.016);
      updateCannonballs(dt || 0.016);
      updateTorches(dt || 0.016);
      updatePrisoners(dt || 0.016);
      updateSloop(dt || 0.016);
      checkTimer();
    }
    updateHUD();
    if (state.msgTimer > 0) { state.msgTimer -= (dt || 0.016); }
    state.elapsedTime += (dt || 0.016);
  }

  function reset() {
    if (state.active) { deactivate(); }

    // Reset all state values
    state.elapsedTime        = 0;
    state.playerHP           = 100;
    state.playerPos          = { x: 0, y: 1.8, z: 40 };
    state.playerVel          = { x: 0, y: 0, z: 0 };
    state.playerYaw          = 0;
    state.playerPitch        = 0;
    state.hasChest           = false;
    state.chestTaken         = false;
    state.chestLoaded        = false;
    state.torchCount         = TORCH_COUNT;
    state.speed              = 8;
    state.onGround           = true;
    state.shootCooldown      = 0;
    state.eKeyDown           = false;
    state.eHoldTimer         = 0;
    state.helmHoldTimer      = 0;
    state.allAlerted         = false;
    state.cannonDestroyedCount = 0;
    state.prisonersFreed     = 0;
    state.sloopCastOff       = false;
    state.sloopPos           = { x: 20, y: 0, z: 50 };
    state.bbPursuitActive    = false;
    state.bbPursuitTimer     = 0;
    state.won                = false;
    state.lost               = false;
    state.gameOver           = false;
    state.mapPickedUp        = false;
    state.pKeyDown           = false;
    state.iKeyDown           = false;
    state.pKeyTime           = 0;
    state.iKeyTime           = 0;
    state.pirates            = [];
    state.cannons            = [];
    state.cannonballs        = [];
    state.prisoners          = [];
    state.torches            = [];
    state.distractionLights  = [];
    state.powderBarrels      = [];
    state.bushMeshes         = [];
    state.palmTrees          = [];
    state.cliffMeshes        = [];
    state.towerMeshes        = [];
    state.pirateShips        = [];
    state.colliders          = [];
    state.blackbeard         = null;
    state.lookout            = null;
    state.chestMesh          = null;
    state.mapMesh            = null;
    state.waypointLight      = null;
    state.sloopMesh          = null;
    state.sloopHelmMesh      = null;
    state.keys               = {};
  }

  return { init: init, update: update, reset: reset };

}());
