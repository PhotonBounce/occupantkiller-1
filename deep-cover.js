window.DeepCover = (function () {
  'use strict';

  // ─── State ─────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys (D + P simultaneous within 400ms)
    dDown: false,
    pDown: false,
    dDownTime: 0,
    pDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    player: null,
    playerMesh: null,
    playerYaw: 0,
    playerPitch: 0,
    moveKeys: {},
    pointerLocked: false,
    // 6-minute FBI backup timer (360s)
    missionTimer: 360,
    missionStartTime: 0,
    missionFailed: false,
    missionClear: false,
    gameOver: false,
    // cover
    coverBlown: false,
    // loyalists: all 3 must be silenced before they warn Don
    loyalists: [],
    loyalistsSilenced: 0,
    loyalistsTotal: 3,
    // soldiers (8 regular, don't know player is FBI)
    soldiers: [],
    soldiersHostile: false,
    // Don Cabrini
    donMesh: null,
    donPos: { x: 13, y: 0.9, z: -18 },
    donHP: 200,
    donDown: false,
    donArrested: false,
    // arrest interact
    arrestHeld: false,
    arrestHoldTimer: 0,
    arrestHoldDuration: 3.0,
    // civilians (4 innocent patrons)
    civilians: [],
    civiliansKilled: 0,
    // FBI backup (arrive at T=360)
    fbiBuddy: [],
    backupArrived: false,
    // evidence
    ledgerCollected: false,
    ledgerMesh: null,
    wiretapPlanted: false,
    wiretapMesh: null,
    wiretapHeld: false,
    wiretapHoldTimer: 0,
    wiretapHoldDuration: 4.0,
    photosCollected: false,
    photoMesh: null,
    evidenceCount: 0,
    // safe
    safeLock: null,
    safeLockHP: 3,
    safeOpen: false,
    // radio
    radioOpen: false,
    radioEl: null,
    lastRadioTime: 0,
    radioBonus: 0,
    radioNPCNear: false,
    // poison pill (found in kitchen)
    poisonPillHeld: false,
    poisonPillMesh: null,
    // score
    score: 0,
    // interact
    interactKey: false,
    lastInteractTime: 0,
    // knife
    knifeKey: false,
    lastKnifeTime: 0,
    // push
    pushKey: false,
    lastPushTime: 0,
    // HUD / overlay elements
    hudEl: null,
    promptEl: null,
    endEl: null,
    // room meshes for reference
    balconyEdgeZ: -14,
    balconyEdgeX: 8,
    // key listeners
    keydownHandler: null,
    keyupHandler: null,
    mousemoveHandler: null,
    clickHandler: null
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function pad2(n) {
    return (n < 10 ? '0' : '') + Math.floor(n);
  }

  function toMM_SS(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return pad2(m) + ':' + pad2(sec);
  }

  function makeBox(w, h, d, colorHex, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      x !== undefined ? x : 0,
      y !== undefined ? y : h / 2,
      z !== undefined ? z : 0
    );
    return mesh;
  }

  function makeCylinder(rt, rb, h, colorHex, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      x !== undefined ? x : 0,
      y !== undefined ? y : h / 2,
      z !== undefined ? z : 0
    );
    return mesh;
  }

  function makeSphere(r, colorHex, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      x !== undefined ? x : 0,
      y !== undefined ? y : 0,
      z !== undefined ? z : 0
    );
    return mesh;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ─── Build Scene ───────────────────────────────────────────────────────────
  function buildScene() {
    var s = state.scene;

    // Global ambient + directional
    var ambient = new THREE.AmbientLight(0x332211, 0.5);
    s.add(ambient);
    var dir = new THREE.DirectionalLight(0xFFEECC, 0.4);
    dir.position.set(5, 15, 5);
    s.add(dir);

    buildMainDiningRoom(s);
    buildKitchen(s);
    buildBackRoom(s);
    buildOffice(s);
    buildBathroom(s);
    buildCellar(s);
    buildNPCs(s);
    buildEvidence(s);
    buildPlayer(s);
  }

  function buildMainDiningRoom(s) {
    // Floor/room block: 35x4x25 dark brown (0x332211)
    var floorBlock = makeBox(35, 4, 25, 0x332211, 0, -2, 0);
    s.add(floorBlock);

    // Ceiling
    var ceiling = makeBox(35, 0.3, 25, 0x221100, 0, 4.15, 0);
    s.add(ceiling);

    // Walls
    var wallN = makeBox(35, 8, 0.4, 0x2A1A0A, 0, 0, -12.5);
    s.add(wallN);
    var wallS = makeBox(35, 8, 0.4, 0x2A1A0A, 0, 0, 12.5);
    s.add(wallS);
    var wallE = makeBox(0.4, 8, 25, 0x2A1A0A, 17.5, 0, 0);
    s.add(wallE);
    var wallW = makeBox(0.4, 8, 25, 0x2A1A0A, -17.5, 0, 0);
    s.add(wallW);

    // Mood lighting: 6 warm PointLights
    var lightPositions = [
      [-12, 3.8, -8], [0, 3.8, -8], [12, 3.8, -8],
      [-12, 3.8, 6],  [0, 3.8, 6],  [12, 3.8, 6]
    ];
    for (var li = 0; li < lightPositions.length; li++) {
      var lp = lightPositions[li];
      var pl = new THREE.PointLight(0xFF8800, 0.8, 12);
      pl.position.set(lp[0], lp[1], lp[2]);
      s.add(pl);
      // Fixture geometry
      var fixture = makeCylinder(0.15, 0.25, 0.3, 0xBB8844, lp[0], lp[1] - 0.15, lp[2]);
      s.add(fixture);
    }

    // Round tables: BoxGeometry (circular approximation)
    var tablePositions = [
      [-10, 0, -6], [-3, 0, -6], [4, 0, -6],
      [-10, 0, 4],  [-3, 0, 4],  [4, 0, 4]
    ];
    for (var ti = 0; ti < tablePositions.length; ti++) {
      var tp = tablePositions[ti];
      var table = makeBox(1.6, 0.9, 1.6, 0x5A2D0C, tp[0], 0.45, tp[2]);
      s.add(table);
      // Cloth
      var cloth = makeBox(1.8, 0.05, 1.8, 0x880000, tp[0], 0.92, tp[2]);
      s.add(cloth);
      // Chairs (4 per table)
      var chairOffsets = [[0, -1.2], [0, 1.2], [-1.2, 0], [1.2, 0]];
      for (var ci = 0; ci < 4; ci++) {
        var co = chairOffsets[ci];
        var chair = makeBox(0.5, 0.8, 0.5, 0x3A1D0A, tp[0] + co[0], 0.4, tp[2] + co[1]);
        s.add(chair);
      }
    }

    // Bar: south wall
    var bar = makeBox(12, 1.1, 1.5, 0x6B3A1F, -2, 0.55, 10.5);
    s.add(bar);
    var barTop = makeBox(12.2, 0.1, 1.7, 0x8B5A2B, -2, 1.15, 10.5);
    s.add(barTop);

    // Bottles behind bar (cylinders)
    for (var boi = 0; boi < 8; boi++) {
      var bottle = makeCylinder(0.07, 0.07, 0.4, 0x115500 + boi * 0x101010,
        -8 + boi * 1.3, 1.5, 11.5);
      s.add(bottle);
    }

    // Balcony ledge marker (invisible trigger zone, visual railing)
    var railing = makeBox(6, 1.2, 0.1, 0x5A2D0C, 8, 0.6, -12);
    s.add(railing);
    // Balcony floor
    var balcony = makeBox(8, 0.1, 3, 0x3A1A0A, 10, 0.05, -11);
    s.add(balcony);

    // Entrance door area (north-west)
    var door = makeBox(2, 3, 0.3, 0x4A2510, -14, 1.5, -12.35);
    s.add(door);
  }

  function buildKitchen(s) {
    // Kitchen: 15x4x10 (0x445544), east side offset
    var kFloor = makeBox(15, 4, 10, 0x445544, 24, -2, -2);
    s.add(kFloor);

    var kCeiling = makeBox(15, 0.3, 10, 0x334433, 24, 4.15, -2);
    s.add(kCeiling);

    // Walls
    var kWallN = makeBox(15, 8, 0.4, 0x334433, 24, 0, -7);
    s.add(kWallN);
    var kWallS = makeBox(15, 8, 0.4, 0x334433, 24, 0, 3);
    s.add(kWallS);
    var kWallE = makeBox(0.4, 8, 10, 0x334433, 31.5, 0, -2);
    s.add(kWallE);
    // Connecting passage (opening in west wall of kitchen / east wall of dining)
    var kDivN = makeBox(5, 8, 0.4, 0x334433, 19.75, 0, -2);
    s.add(kDivN);
    // (passage gap around x=17.5 to 19.5)

    // Stove: CylinderGeometry burners on top of a BoxGeometry base
    var stoveBase = makeBox(2, 1.0, 1.2, 0x222222, 28, 0.5, -5);
    s.add(stoveBase);
    var burner1 = makeCylinder(0.25, 0.25, 0.1, 0x111111, 27.4, 1.05, -5.2);
    s.add(burner1);
    var burner2 = makeCylinder(0.25, 0.25, 0.1, 0x111111, 28.6, 1.05, -5.2);
    s.add(burner2);
    var burner3 = makeCylinder(0.25, 0.25, 0.1, 0x111111, 27.4, 1.05, -4.6);
    s.add(burner3);
    var burner4 = makeCylinder(0.25, 0.25, 0.1, 0x111111, 28.6, 1.05, -4.6);
    s.add(burner4);

    // Pots (CylinderGeometry)
    var pot1 = makeCylinder(0.3, 0.28, 0.5, 0x888888, 28, 1.3, -5.2);
    s.add(pot1);
    var pot2 = makeCylinder(0.22, 0.2, 0.4, 0x777777, 27, 1.25, -4.6);
    s.add(pot2);

    // Refrigerator
    var fridge = makeBox(1, 2, 0.8, 0xCCCCCC, 22, 1.0, -6.5);
    s.add(fridge);

    // Counter
    var counter = makeBox(6, 1, 1.0, 0x556644, 24, 0.5, 0.5);
    s.add(counter);

    // Drinks tray (where poison can be added)
    var tray = makeBox(0.8, 0.1, 0.5, 0xAA8833, 24, 1.05, 0.5);
    s.add(tray);
    var glass1 = makeCylinder(0.08, 0.07, 0.22, 0xCCEEFF, 23.7, 1.16, 0.5);
    s.add(glass1);
    var glass2 = makeCylinder(0.08, 0.07, 0.22, 0xCCEEFF, 24.0, 1.16, 0.5);
    s.add(glass2);
    var glass3 = makeCylinder(0.08, 0.07, 0.22, 0xCCEEFF, 24.3, 1.16, 0.5);
    s.add(glass3);

    // Poison pill pickup (glowing small sphere on counter)
    state.poisonPillMesh = makeSphere(0.1, 0x44FF44, 24, 1.2, -2);
    s.add(state.poisonPillMesh);

    // Kitchen light
    var kLight = new THREE.PointLight(0xFFFFCC, 1.0, 16);
    kLight.position.set(24, 3.8, -2);
    s.add(kLight);
  }

  function buildBackRoom(s) {
    // Private back room: 12x4x10 (0x332211)
    var bFloor = makeBox(12, 4, 10, 0x332211, 0, -2, -22);
    s.add(bFloor);

    var bCeiling = makeBox(12, 0.3, 10, 0x221100, 0, 4.15, -22);
    s.add(bCeiling);

    var bWallN = makeBox(12, 8, 0.4, 0x2A1A0A, 0, 0, -27);
    s.add(bWallN);
    var bWallE = makeBox(0.4, 8, 10, 0x2A1A0A, 6, 0, -22);
    s.add(bWallE);
    var bWallW = makeBox(0.4, 8, 10, 0x2A1A0A, -6, 0, -22);
    s.add(bWallW);
    // Divider with dining room (passage in middle)
    var bDivE = makeBox(4, 8, 0.4, 0x2A1A0A, 4, 0, -17);
    s.add(bDivE);
    var bDivW = makeBox(4, 8, 0.4, 0x2A1A0A, -4, 0, -17);
    s.add(bDivW);

    // Don's table (head of table)
    var donTable = makeBox(2.5, 0.9, 1.5, 0x5A2D0C, 0, 0.45, -23);
    s.add(donTable);
    var donCloth = makeBox(2.7, 0.06, 1.7, 0x660000, 0, 0.93, -23);
    s.add(donCloth);

    // Don chair
    var donChair = makeBox(0.7, 1.0, 0.7, 0x3A1D0A, 0, 0.5, -24.5);
    s.add(donChair);

    // Red light (back room ambiance)
    var bLight = new THREE.PointLight(0xFF4400, 0.7, 12);
    bLight.position.set(0, 3.8, -22);
    s.add(bLight);
  }

  function buildOffice(s) {
    // Office: 10x4x8 (0x221100)
    var oFloor = makeBox(10, 4, 8, 0x221100, -20, -2, -19);
    s.add(oFloor);

    var oCeiling = makeBox(10, 0.3, 8, 0x111000, -20, 4.15, -19);
    s.add(oCeiling);

    var oWallN = makeBox(10, 8, 0.4, 0x1A1000, -20, 0, -23);
    s.add(oWallN);
    var oWallS = makeBox(10, 8, 0.4, 0x1A1000, -20, 0, -15);
    s.add(oWallS);
    var oWallW = makeBox(0.4, 8, 8, 0x1A1000, -25, 0, -19);
    s.add(oWallW);
    // East wall (partial — connects to dining)
    var oWallE1 = makeBox(3, 8, 0.4, 0x1A1000, -13, 0, -19);
    s.add(oWallE1);

    // Desk
    var desk = makeBox(2.5, 0.8, 1.2, 0x5A3010, -21, 0.4, -19);
    s.add(desk);

    // Safe: BoxGeometry (0x444444), needs 3 shots to open lock
    var safe = makeBox(1.2, 1.4, 0.8, 0x444444, -23.5, 0.7, -21.5);
    s.add(safe);
    // Lock
    state.safeLock = makeBox(0.3, 0.3, 0.15, 0xFF4400, -23.5, 1.2, -21.05);
    state.safeLock.userData.hp = 3;
    s.add(state.safeLock);

    // Ledger: BoxGeometry (0xEEEECC), inside safe — hidden until open
    state.ledgerMesh = makeBox(0.5, 0.08, 0.35, 0xEEEECC, -23.5, 0.92, -21.5);
    state.ledgerMesh.visible = false;
    s.add(state.ledgerMesh);

    // Office lamp
    var oLight = new THREE.PointLight(0xFFCC88, 0.9, 10);
    oLight.position.set(-20, 3.6, -19);
    s.add(oLight);
  }

  function buildBathroom(s) {
    // Bathroom: 8x4x6 (0x445555)
    var bathFloor = makeBox(8, 4, 6, 0x445555, 12, -2, -21);
    s.add(bathFloor);

    var bathCeiling = makeBox(8, 0.3, 6, 0x334444, 12, 4.15, -21);
    s.add(bathCeiling);

    var bathWallN = makeBox(8, 8, 0.4, 0x334444, 12, 0, -24);
    s.add(bathWallN);
    var bathWallS = makeBox(8, 8, 0.4, 0x334444, 12, 0, -18);
    s.add(bathWallS);
    var bathWallE = makeBox(0.4, 8, 6, 0x334444, 16, 0, -21);
    s.add(bathWallE);
    var bathWallW = makeBox(0.4, 8, 6, 0x334444, 8, 0, -21);
    s.add(bathWallW);

    // Stalls
    var stall1 = makeBox(1.2, 2.0, 1.0, 0x556666, 11, 1.0, -23);
    s.add(stall1);
    var stall2 = makeBox(1.2, 2.0, 1.0, 0x556666, 13, 1.0, -23);
    s.add(stall2);

    // Sink (CylinderGeometry)
    var sink = makeCylinder(0.35, 0.3, 0.25, 0xEEEEEE, 12, 1.05, -19.5);
    s.add(sink);

    // Phone line on wall (wire tap target)
    state.wiretapMesh = makeBox(0.4, 0.15, 0.05, 0x222222, 15.8, 2.0, -21);
    s.add(state.wiretapMesh);

    // Wires detail (LineSegments)
    var wireGeo = new THREE.BufferGeometry();
    var wirePoints = new Float32Array([
      15.8, 2.0, -21,
      15.8, 1.5, -21,
      15.8, 1.5, -21,
      15.5, 1.5, -21
    ]);
    wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePoints, 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    var wireLines = new THREE.LineSegments(wireGeo, wireMat);
    s.add(wireLines);

    // Bathroom light (fluorescent, blueish)
    var bathLight = new THREE.PointLight(0xCCFFFF, 0.8, 10);
    bathLight.position.set(12, 3.8, -21);
    s.add(bathLight);
  }

  function buildCellar(s) {
    // Cellar: 20x4x15 (0x332200), below at y=-6
    var cellarFloor = makeBox(20, 4, 15, 0x332200, -8, -8, -8);
    s.add(cellarFloor);

    var cellarCeiling = makeBox(20, 0.3, 15, 0x221100, -8, -4.15, -8);
    s.add(cellarCeiling);

    var cellarWallN = makeBox(20, 8, 0.4, 0x221100, -8, -6, -15.5);
    s.add(cellarWallN);
    var cellarWallS = makeBox(20, 8, 0.4, 0x221100, -8, -6, -0.5);
    s.add(cellarWallS);
    var cellarWallE = makeBox(0.4, 8, 15, 0x221100, 2, -6, -8);
    s.add(cellarWallE);
    var cellarWallW = makeBox(0.4, 8, 15, 0x221100, -18, -6, -8);
    s.add(cellarWallW);

    // Stairs down
    for (var si = 0; si < 6; si++) {
      var step = makeBox(2, 0.3, 0.5, 0x4A3010, -15, -2 - si * 0.65, -1.5 - si * 0.5);
      s.add(step);
    }

    // Weapon stash barrels (CylinderGeometry)
    var barrelPositions = [
      [-16, -5.5, -3], [-14, -5.5, -3], [-12, -5.5, -3],
      [-16, -5.5, -5], [-14, -5.5, -5], [-12, -5.5, -5]
    ];
    for (var bi = 0; bi < barrelPositions.length; bi++) {
      var bp = barrelPositions[bi];
      var barrel = makeCylinder(0.35, 0.38, 1.0, 0x554422, bp[0], bp[1], bp[2]);
      s.add(barrel);
    }

    // Weapon crates (BoxGeometry)
    var crate1 = makeBox(1.0, 0.8, 0.8, 0x665533, -10, -5.6, -12);
    s.add(crate1);
    var crate2 = makeBox(1.0, 0.8, 0.8, 0x665533, -9, -5.6, -12);
    s.add(crate2);

    // Shelf with photos
    var shelf = makeBox(2, 0.1, 0.5, 0x5A3010, -6, -4.5, -13.5);
    s.add(shelf);

    // Photos BoxGeometry (0xCCCCCC)
    state.photoMesh = makeBox(0.35, 0.05, 0.25, 0xCCCCCC, -6, -4.42, -13.5);
    s.add(state.photoMesh);

    // Cellar light (dim orange)
    var cellarLight = new THREE.PointLight(0xFF6600, 0.5, 14);
    cellarLight.position.set(-8, -4.5, -8);
    s.add(cellarLight);
  }

  function buildNPCs(s) {
    var i;

    // Don Cabrini (0x442211): in back room
    state.donMesh = makeBox(0.65, 1.9, 0.65, 0x442211, 0, 0.95, -24);
    s.add(state.donMesh);

    // 3 Loyalist fixers (0x443322): spread through venue
    state.loyalists = [];
    var loyalistSpawns = [
      { x: -8, z: -1 },    // dining room
      { x: 22, z: -3 },    // kitchen area
      { x: 2, z: -21 }     // back room corridor
    ];
    for (i = 0; i < 3; i++) {
      var lp = loyalistSpawns[i];
      var lMesh = makeBox(0.6, 1.8, 0.6, 0x443322, lp.x, 0.9, lp.z);
      s.add(lMesh);
      state.loyalists.push({
        mesh: lMesh,
        pos: { x: lp.x, y: 0.9, z: lp.z },
        hp: 100,
        alive: true,
        silenced: false,
        alerted: false,
        alertTimer: 0,
        patrolAngle: (i / 3) * Math.PI * 2,
        patrolRadius: 3,
        baseX: lp.x,
        baseZ: lp.z,
        poisoned: false,
        poisonTimer: 0,
        drinkConsumeTimer: Math.random() * 20 + 15  // time until they drink
      });
    }

    // 8 Regular soldiers (0x554433): scattered in dining room + entrance
    state.soldiers = [];
    var soldierSpawns = [
      { x: 10, z: -10 }, { x: -10, z: -10 }, { x: 6, z: 0 },
      { x: -6, z: 0 },   { x: 12, z: 8 },    { x: -12, z: 8 },
      { x: 0, z: -11 },  { x: 3, z: -21 }
    ];
    for (i = 0; i < 8; i++) {
      var sp = soldierSpawns[i];
      var sMesh = makeBox(0.6, 1.8, 0.6, 0x554433, sp.x, 0.9, sp.z);
      s.add(sMesh);
      state.soldiers.push({
        mesh: sMesh,
        pos: { x: sp.x, y: 0.9, z: sp.z },
        hp: 80,
        alive: true,
        hostile: false,
        patrolAngle: (i / 8) * Math.PI * 2,
        patrolRadius: 2.5,
        baseX: sp.x,
        baseZ: sp.z
      });
    }

    // 4 Civilians (innocent patrons) seated at tables
    state.civilians = [];
    var civSpawns = [
      { x: -10, z: -5.5 }, { x: -3, z: -5.5 },
      { x: 4, z: 3.5 },    { x: -10, z: 3.5 }
    ];
    var civColors = [0xCC9977, 0xBBAA88, 0xDDBB99, 0xAA8866];
    for (i = 0; i < 4; i++) {
      var cp = civSpawns[i];
      var cMesh = makeBox(0.55, 1.6, 0.55, civColors[i], cp.x, 0.8, cp.z);
      s.add(cMesh);
      state.civilians.push({
        mesh: cMesh,
        pos: { x: cp.x, y: 0.8, z: cp.z },
        alive: true
      });
    }

    // 2 FBI backup agents (hidden, arrive later)
    state.fbiBuddy = [];
    for (i = 0; i < 2; i++) {
      var fbMesh = makeBox(0.6, 1.8, 0.6, 0x334455, -14 + i * 2, 0.9, 14);
      fbMesh.visible = false;
      s.add(fbMesh);
      state.fbiBuddy.push({
        mesh: fbMesh,
        pos: { x: -14 + i * 2, y: 0.9, z: 14 },
        arrived: false
      });
    }
  }

  function buildEvidence(s) {
    // Evidence built inline during room construction, references stored in state
    // (ledgerMesh, wiretapMesh, photoMesh already set in buildOffice/buildBathroom/buildCellar)
  }

  function buildPlayer(s) {
    state.playerMesh = makeBox(0.5, 1.8, 0.5, 0x667788, 0, 0.9, 6);
    s.add(state.playerMesh);
    state.player = { x: 0, y: 0.9, z: 6 };
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.id = 'deep-cover-hud';
    state.hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.80)',
      'color:#DDCC88',
      'font:bold 12px/1.5 monospace',
      'padding:6px 14px',
      'border-radius:6px',
      'z-index:10001',
      'pointer-events:none',
      'white-space:nowrap',
      'letter-spacing:0.03em'
    ].join(';');
    document.body.appendChild(state.hudEl);

    state.promptEl = document.createElement('div');
    state.promptEl.id = 'deep-cover-prompt';
    state.promptEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.70)',
      'color:#AAFFCC',
      'font:13px monospace',
      'padding:4px 12px',
      'border-radius:4px',
      'z-index:10001',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(state.promptEl);

    state.radioEl = document.createElement('div');
    state.radioEl.id = 'deep-cover-radio';
    state.radioEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,30,0,0.90)',
      'color:#33FF33',
      'font:11px monospace',
      'padding:4px 12px',
      'border-radius:4px',
      'z-index:10002',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(state.radioEl);
  }

  function updateHUD() {
    if (!state.hudEl) return;

    var timeLeft = Math.max(0, Math.floor(state.missionTimer));
    var loyalistStr = state.loyalistsSilenced + '/' + state.loyalistsTotal + ' SILENCED';
    var evidenceStr = state.evidenceCount + '/3';
    var donStr = state.donArrested ? 'ARRESTED' : 'FREE';
    var backupStr = state.backupArrived ? 'ARRIVED' : toMM_SS(timeLeft) + 's';
    var coverStr = state.coverBlown ? 'BLOWN' : 'INTACT';
    var coverColor = state.coverBlown ? '#FF4444' : '#44FF88';

    state.hudEl.innerHTML =
      'DEEP COVER &nbsp;|&nbsp; ' +
      'LOYALISTS: ' + loyalistStr + ' &nbsp;|&nbsp; ' +
      'EVIDENCE: ' + evidenceStr + ' &nbsp;|&nbsp; ' +
      'DON: ' + donStr + ' &nbsp;|&nbsp; ' +
      'BACKUP: ' + backupStr + ' &nbsp;|&nbsp; ' +
      'COVER: <span style="color:' + coverColor + '">' + coverStr + '</span>';
  }

  function setPrompt(msg) {
    if (state.promptEl) {
      state.promptEl.textContent = msg || '';
    }
  }

  function showEnd(win, msg) {
    if (state.endEl) return;
    state.endEl = document.createElement('div');
    state.endEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,0.82)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'z-index:10010',
      'pointer-events:none'
    ].join(';');
    var color = win ? '#44FF88' : '#FF4444';
    var title = win ? 'OPERATION COMPLETE' : 'MISSION FAILED';
    state.endEl.innerHTML =
      '<div style="color:' + color + ';font:bold 32px monospace;margin-bottom:16px">' + title + '</div>' +
      '<div style="color:#DDCC88;font:18px monospace;margin-bottom:10px">' + (msg || '') + '</div>' +
      '<div style="color:#AAAAAA;font:14px monospace">SCORE: ' + state.score + '</div>';
    document.body.appendChild(state.endEl);
    state.gameOver = true;
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  function setupInput() {
    state.keydownHandler = function (e) {
      var k = e.key.toLowerCase();
      state.moveKeys[k] = true;

      // Activation combo tracking
      if (k === 'd') {
        state.dDown = true;
        state.dDownTime = performance.now();
      }
      if (k === 'p') {
        state.pDown = true;
        state.pDownTime = performance.now();
      }

      // Activation check
      if (!state.active && state.dDown && state.pDown) {
        var gap = Math.abs(state.dDownTime - state.pDownTime);
        if (gap < 400) {
          activateGame();
          return;
        }
      }

      if (!state.active) return;

      if (k === 'e') {
        state.interactKey = true;
        state.arrestHeld = true;
        state.wiretapHeld = true;
      }
      if (k === 'q') {
        state.knifeKey = true;
      }
      if (k === ' ') {
        state.pushKey = true;
      }
      if (k === 'r') {
        toggleRadio();
      }
    };

    state.keyupHandler = function (e) {
      var k = e.key.toLowerCase();
      state.moveKeys[k] = false;

      if (k === 'd') { state.dDown = false; }
      if (k === 'p') { state.pDown = false; }

      if (!state.active) return;

      if (k === 'e') {
        state.interactKey = false;
        state.arrestHeld = false;
        state.arrestHoldTimer = 0;
        state.wiretapHeld = false;
        state.wiretapHoldTimer = 0;
      }
      if (k === 'q') { state.knifeKey = false; }
      if (k === ' ') { state.pushKey = false; }
    };

    state.mousemoveHandler = function (e) {
      if (!state.active || !state.pointerLocked) return;
      state.playerYaw -= e.movementX * 0.002;
      state.playerPitch -= e.movementY * 0.002;
      state.playerPitch = clamp(state.playerPitch, -0.4, 0.4);
    };

    state.clickHandler = function () {
      if (!state.active) return;
      if (!state.pointerLocked) {
        state.renderer.domElement.requestPointerLock();
        return;
      }
      // Shoot
      handleShoot();
    };

    document.addEventListener('keydown', state.keydownHandler);
    document.addEventListener('keyup', state.keyupHandler);
    document.addEventListener('mousemove', state.mousemoveHandler);

    document.addEventListener('pointerlockchange', function () {
      state.pointerLocked = document.pointerLockElement === state.renderer.domElement;
    });

    if (state.renderer && state.renderer.domElement) {
      state.renderer.domElement.addEventListener('click', state.clickHandler);
    }
  }

  // ─── Shoot ─────────────────────────────────────────────────────────────────
  function handleShoot() {
    if (state.gameOver) return;
    var px = state.player.x;
    var pz = state.player.z;

    // Shoot safe lock
    if (state.safeLock && !state.safeOpen) {
      var lockPos = state.safeLock.position;
      if (dist2D(px, pz, lockPos.x, lockPos.z) < 3.5) {
        state.safeLock.userData.hp -= 1;
        setColor(state.safeLock, 0xFF2200 - state.safeLock.userData.hp * 0x110000);
        if (state.safeLock.userData.hp <= 0) {
          state.safeOpen = true;
          state.safeLock.visible = false;
          if (state.ledgerMesh) { state.ledgerMesh.visible = true; }
          setPrompt('Safe cracked! Take the ledger (E)');
        }
        return;
      }
    }

    // Shoot soldiers / loyalists when in firefight
    if (state.coverBlown || state.soldiersHostile) {
      var i;
      for (i = 0; i < state.loyalists.length; i++) {
        var l = state.loyalists[i];
        if (!l.alive || l.silenced) continue;
        if (dist2D(px, pz, l.pos.x, l.pos.z) < 12) {
          l.hp -= 40;
          if (l.hp <= 0) { silenceLoyalist(i, false); }
          return;
        }
      }
      for (i = 0; i < state.soldiers.length; i++) {
        var sol = state.soldiers[i];
        if (!sol.alive) continue;
        if (dist2D(px, pz, sol.pos.x, sol.pos.z) < 12) {
          sol.hp -= 40;
          if (sol.hp <= 0) { killSoldier(i); }
          return;
        }
      }
    }

    // Shoot Don (only after loyalists silenced or in firefight)
    if (state.donMesh && !state.donDown) {
      var dp = state.donMesh.position;
      if (dist2D(px, pz, dp.x, dp.z) < 12) {
        if (state.loyalistsSilenced < 3 && !state.coverBlown) {
          setPrompt('Silence all 3 loyalists before confronting the Don!');
          return;
        }
        state.donHP -= 50;
        if (state.donHP <= 0) {
          state.donDown = true;
          setColor(state.donMesh, 0x220000);
          state.donMesh.position.y = 0.3;
          setPrompt('Don Cabrini is down! Hold E for 3s to arrest (get close).');
          state.score += 200;
        }
        return;
      }
    }
  }

  // ─── Silence Loyalist ──────────────────────────────────────────────────────
  function silenceLoyalist(idx, silent) {
    var l = state.loyalists[idx];
    if (!l || !l.alive || l.silenced) return;
    l.alive = false;
    l.silenced = true;
    l.mesh.position.y = 0.2;
    setColor(l.mesh, 0x221100);
    state.loyalistsSilenced++;
    state.score += silent ? 400 : 200;
    if (!silent) {
      // Noisy kill — alert soldiers
      alertSoldiers();
    }
  }

  function alertSoldiers() {
    if (state.soldiersHostile) return;
    state.soldiersHostile = true;
    state.coverBlown = true;
    for (var i = 0; i < state.soldiers.length; i++) {
      state.soldiers[i].hostile = true;
    }
    setPrompt('Cover blown! Soldiers are hostile!');
  }

  function killSoldier(idx) {
    var sol = state.soldiers[idx];
    if (!sol || !sol.alive) return;
    sol.alive = false;
    sol.mesh.position.y = 0.2;
    setColor(sol.mesh, 0x221100);
    state.score += 100;
  }

  // ─── Interact ──────────────────────────────────────────────────────────────
  function handleInteract(dt) {
    if (state.gameOver) return;
    var now = performance.now();
    var px = state.player.x;
    var pz = state.player.z;
    var prompt = '';

    // Arrest Don (hold E for 3s)
    if (state.donDown && !state.donArrested) {
      var dp = state.donMesh.position;
      if (dist2D(px, pz, dp.x, dp.z) < 2.5) {
        if (state.arrestHeld) {
          state.arrestHoldTimer += dt;
          prompt = 'Arresting Don... ' + Math.floor(state.arrestHoldTimer * 10 / 3) / 10 + 's / 3s';
          if (state.arrestHoldTimer >= state.arrestHoldDuration) {
            state.donArrested = true;
            setColor(state.donMesh, 0x113366);
            state.score += 1000;
            prompt = 'DON CABRINI ARRESTED! Secure evidence.';
            checkWin();
          }
        } else {
          prompt = 'Hold E to arrest Don Cabrini';
        }
        setPrompt(prompt);
        return;
      }
    }

    // One-time interact press actions
    if (state.interactKey && now - state.lastInteractTime > 300) {
      state.lastInteractTime = now;

      // Take poison pill from kitchen
      if (!state.poisonPillHeld && state.poisonPillMesh && state.poisonPillMesh.visible) {
        var pilPos = state.poisonPillMesh.position;
        if (dist2D(px, pz, pilPos.x, pilPos.z) < 2) {
          state.poisonPillHeld = true;
          state.poisonPillMesh.visible = false;
          setPrompt('Poison pill acquired. Find a loyalist near the bar/drink tray (E to poison their drink).');
          return;
        }
      }

      // Poison drink tray for nearest loyalist in kitchen
      if (state.poisonPillHeld) {
        var drinkTrayX = 24;
        var drinkTrayZ = 0.5;
        if (dist2D(px, pz, drinkTrayX, drinkTrayZ) < 2.5) {
          // Find nearest alive loyalist
          var nearest = -1;
          var nearDist = 999;
          for (var pi = 0; pi < state.loyalists.length; pi++) {
            var l = state.loyalists[pi];
            if (!l.alive || l.silenced || l.poisoned) continue;
            var pd = dist2D(drinkTrayX, drinkTrayZ, l.pos.x, l.pos.z);
            if (pd < nearDist) { nearDist = pd; nearest = pi; }
          }
          if (nearest >= 0) {
            state.poisonPillHeld = false;
            state.loyalists[nearest].poisoned = true;
            state.loyalists[nearest].drinkConsumeTimer = Math.random() * 8 + 5;
            setPrompt('Poison added to drink. The loyalist will consume it soon...');
            return;
          } else {
            setPrompt('No loyalist nearby to target.');
            return;
          }
        }
      }

      // Take ledger
      if (!state.ledgerCollected && state.ledgerMesh && state.ledgerMesh.visible) {
        var ledPos = state.ledgerMesh.position;
        if (dist2D(px, pz, ledPos.x, ledPos.z) < 2) {
          state.ledgerCollected = true;
          state.ledgerMesh.visible = false;
          state.evidenceCount++;
          state.score += (state.evidenceCount === 3 ? 2000 : 300);
          setPrompt('Ledger seized! RICO case building... (' + state.evidenceCount + '/3 evidence)');
          return;
        }
      }

      // Take photos from cellar
      if (!state.photosCollected && state.photoMesh) {
        var phPos = state.photoMesh.position;
        if (dist2D(px, pz, phPos.x, phPos.z) < 2) {
          state.photosCollected = true;
          state.photoMesh.visible = false;
          state.evidenceCount++;
          state.score += (state.evidenceCount === 3 ? 2000 : 300);
          setPrompt('Photos retrieved! (' + state.evidenceCount + '/3 evidence)');
          return;
        }
      }

      prompt = '';
    }

    // Wiretap plant (hold E for 4s)
    if (!state.wiretapPlanted && state.wiretapMesh) {
      var wtPos = state.wiretapMesh.position;
      if (dist2D(px, pz, wtPos.x, wtPos.z) < 2) {
        if (state.wiretapHeld) {
          state.wiretapHoldTimer += dt;
          prompt = 'Planting wire tap... ' + Math.floor(state.wiretapHoldTimer * 10 / 4) / 10 + 's / 4s';
          if (state.wiretapHoldTimer >= state.wiretapHoldDuration) {
            state.wiretapPlanted = true;
            setColor(state.wiretapMesh, 0x00FF44);
            state.evidenceCount++;
            state.score += (state.evidenceCount === 3 ? 2000 : 300);
            prompt = 'Wire tap planted! Recording Don\'s calls. (' + state.evidenceCount + '/3 evidence)';
          }
          setPrompt(prompt);
          return;
        } else {
          setPrompt('Hold E for 4s to plant wire tap on phone line');
          return;
        }
      }
    }

    if (!prompt) {
      promptNearby(px, pz);
    }
  }

  function promptNearby(px, pz) {
    var i;
    // Check proximity to objects and give hint
    for (i = 0; i < state.loyalists.length; i++) {
      var l = state.loyalists[i];
      if (!l.alive) continue;
      if (dist2D(px, pz, l.pos.x, l.pos.z) < 2.5) {
        if (!state.coverBlown) {
          setPrompt('[Q] Knife (from behind) | [SPACE] Push off balcony | poison drink in kitchen');
        }
        return;
      }
    }

    if (state.poisonPillMesh && state.poisonPillMesh.visible) {
      var pilPos = state.poisonPillMesh.position;
      if (dist2D(px, pz, pilPos.x, pilPos.z) < 2) {
        setPrompt('[E] Take poison pill');
        return;
      }
    }

    if (state.safeLock && !state.safeOpen) {
      if (dist2D(px, pz, state.safeLock.position.x, state.safeLock.position.z) < 3) {
        setPrompt('[CLICK] Shoot safe lock (' + state.safeLock.userData.hp + ' shots left)');
        return;
      }
    }

    if (state.ledgerMesh && state.ledgerMesh.visible) {
      if (dist2D(px, pz, state.ledgerMesh.position.x, state.ledgerMesh.position.z) < 2.5) {
        setPrompt('[E] Take ledger (RICO evidence)');
        return;
      }
    }

    if (state.photoMesh && !state.photosCollected) {
      if (dist2D(px, pz, state.photoMesh.position.x, state.photoMesh.position.z) < 2.5) {
        setPrompt('[E] Retrieve photos from shelf');
        return;
      }
    }

    if (state.wiretapMesh && !state.wiretapPlanted) {
      if (dist2D(px, pz, state.wiretapMesh.position.x, state.wiretapMesh.position.z) < 2.5) {
        setPrompt('[Hold E 4s] Plant wire tap on phone line');
        return;
      }
    }

    if (state.donDown && !state.donArrested) {
      if (dist2D(px, pz, state.donMesh.position.x, state.donMesh.position.z) < 3) {
        setPrompt('[Hold E 3s] Arrest Don Cabrini');
        return;
      }
    }

    setPrompt('');
  }

  // ─── Knife (silent kill from behind) ───────────────────────────────────────
  function handleKnife() {
    if (state.gameOver) return;
    var now = performance.now();
    if (!state.knifeKey || now - state.lastKnifeTime < 800) return;
    state.lastKnifeTime = now;

    var px = state.player.x;
    var pz = state.player.z;
    var i;

    for (i = 0; i < state.loyalists.length; i++) {
      var l = state.loyalists[i];
      if (!l.alive || l.silenced) continue;
      if (dist2D(px, pz, l.pos.x, l.pos.z) < 1.8) {
        // Check "from behind": player yaw roughly pointing same direction as loyalist travel
        // Simplified: if player is close, allow knife
        silenceLoyalist(i, true);
        setPrompt('Loyalist silenced with knife! (' + state.loyalistsSilenced + '/3)');
        return;
      }
    }
    setPrompt('No target in knife range (Q)');
  }

  // ─── Push (off balcony) ────────────────────────────────────────────────────
  function handlePush() {
    if (state.gameOver) return;
    var now = performance.now();
    if (!state.pushKey || now - state.lastPushTime < 800) return;
    state.lastPushTime = now;

    var px = state.player.x;
    var pz = state.player.z;
    var i;

    // Near balcony ledge?
    var nearBalcony = (pz < -10 && px > 5);

    for (i = 0; i < state.loyalists.length; i++) {
      var l = state.loyalists[i];
      if (!l.alive || l.silenced) continue;
      if (dist2D(px, pz, l.pos.x, l.pos.z) < 2) {
        if (nearBalcony) {
          // Silent "accident"
          l.mesh.position.y = -4;
          silenceLoyalist(i, true);
          setPrompt('Loyalist had an "accident" off the balcony. (' + state.loyalistsSilenced + '/3)');
        } else {
          setPrompt('[SPACE] Push only works near the balcony ledge!');
        }
        return;
      }
    }
    setPrompt('No one nearby to push (SPACE)');
  }

  // ─── Radio ─────────────────────────────────────────────────────────────────
  function toggleRadio() {
    if (state.gameOver) return;
    state.radioOpen = !state.radioOpen;
    if (!state.radioEl) return;

    if (state.radioOpen) {
      // Check if alone
      state.radioNPCNear = false;
      var px = state.player.x;
      var pz = state.player.z;
      var i;
      for (i = 0; i < state.loyalists.length; i++) {
        var l = state.loyalists[i];
        if (l.alive && dist2D(px, pz, l.pos.x, l.pos.z) < 5) {
          state.radioNPCNear = true; break;
        }
      }
      if (!state.radioNPCNear) {
        for (i = 0; i < state.soldiers.length; i++) {
          var sol = state.soldiers[i];
          if (sol.alive && dist2D(px, pz, sol.pos.x, sol.pos.z) < 5) {
            state.radioNPCNear = true; break;
          }
        }
      }

      if (state.radioNPCNear) {
        state.radioEl.style.display = 'block';
        state.radioEl.innerHTML = '[RADIO] STATIC — Wire still hot. Find a clear location to transmit.';
      } else {
        var now = performance.now() / 1000;
        var sinceLastRadio = now - state.lastRadioTime;
        var bonus = 0;
        if (sinceLastRadio >= 90 || state.lastRadioTime === 0) {
          bonus = 150;
          state.radioBonus += bonus;
          state.score += bonus;
          state.lastRadioTime = now;
        }
        var status = buildRadioStatus();
        state.radioEl.style.display = 'block';
        state.radioEl.innerHTML = '[RADIO CH7] ' + status + (bonus ? ' +' + bonus + ' BONUS' : '');
      }
    } else {
      state.radioEl.style.display = 'none';
    }
  }

  function buildRadioStatus() {
    var parts = [];
    parts.push('Agent Prentiss reporting.');
    parts.push('Loyalists: ' + state.loyalistsSilenced + '/3.');
    parts.push('Don: ' + (state.donArrested ? 'in custody' : state.donDown ? 'neutralized' : 'at large') + '.');
    parts.push('Evidence: ' + state.evidenceCount + '/3.');
    parts.push('Cover: ' + (state.coverBlown ? 'BLOWN' : 'intact') + '.');
    parts.push('ETA backup: ' + toMM_SS(Math.max(0, state.missionTimer)) + '.');
    return parts.join(' ');
  }

  // ─── NPC AI Update ─────────────────────────────────────────────────────────
  function updateNPCs(dt) {
    var i;
    var px = state.player.x;
    var pz = state.player.z;

    // Loyalists
    for (i = 0; i < state.loyalists.length; i++) {
      var l = state.loyalists[i];
      if (!l.alive) continue;

      // Patrol
      l.patrolAngle += dt * 0.4;
      l.pos.x = l.baseX + Math.cos(l.patrolAngle) * l.patrolRadius;
      l.pos.z = l.baseZ + Math.sin(l.patrolAngle) * l.patrolRadius;
      l.mesh.position.set(l.pos.x, 0.9, l.pos.z);

      // Poison timer
      if (l.poisoned && !l.silenced) {
        l.drinkConsumeTimer -= dt;
        if (l.drinkConsumeTimer <= 0) {
          silenceLoyalist(i, true);
          setPrompt('A loyalist collapsed from poisoning... (' + state.loyalistsSilenced + '/3)');
          continue;
        }
      }

      // Loyalist spots player and alerts (if they haven't been silenced)
      if (!state.coverBlown) {
        var dToPlayer = dist2D(px, pz, l.pos.x, l.pos.z);
        if (dToPlayer < 3 && !state.coverBlown) {
          l.alertTimer += dt;
          if (l.alertTimer > 2.5) {
            alertSoldiers();
          }
        } else {
          l.alertTimer = 0;
        }
      }

      // In firefight: move toward player
      if (state.coverBlown) {
        var dxl = px - l.pos.x;
        var dzl = pz - l.pos.z;
        var distl = Math.sqrt(dxl * dxl + dzl * dzl);
        if (distl > 2) {
          l.pos.x += (dxl / distl) * dt * 1.5;
          l.pos.z += (dzl / distl) * dt * 1.5;
          l.mesh.position.set(l.pos.x, 0.9, l.pos.z);
        }
      }
    }

    // Soldiers
    for (i = 0; i < state.soldiers.length; i++) {
      var sol = state.soldiers[i];
      if (!sol.alive) continue;

      if (sol.hostile) {
        // Chase player
        var dxs = px - sol.pos.x;
        var dzs = pz - sol.pos.z;
        var dists = Math.sqrt(dxs * dxs + dzs * dzs);
        if (dists > 2) {
          sol.pos.x += (dxs / dists) * dt * 1.8;
          sol.pos.z += (dzs / dists) * dt * 1.8;
          sol.mesh.position.set(sol.pos.x, 0.9, sol.pos.z);
        }
      } else {
        // Patrol
        sol.patrolAngle += dt * 0.3;
        sol.pos.x = sol.baseX + Math.cos(sol.patrolAngle) * sol.patrolRadius;
        sol.pos.z = sol.baseZ + Math.sin(sol.patrolAngle) * sol.patrolRadius;
        sol.mesh.position.set(sol.pos.x, 0.9, sol.pos.z);
      }
    }

    // Don (paces in back room)
    if (!state.donDown && state.donMesh) {
      state.donMesh.position.x = state.donPos.x + Math.sin(performance.now() / 2000) * 1.5;
    }
  }

  // ─── FBI Backup ─────────────────────────────────────────────────────────────
  function checkBackupArrival() {
    if (state.backupArrived) return;
    if (state.missionTimer <= 0) {
      state.backupArrived = true;
      for (var i = 0; i < state.fbiBuddy.length; i++) {
        state.fbiBuddy[i].mesh.visible = true;
        state.fbiBuddy[i].arrived = true;
      }
      setPrompt('FBI BACKUP HAS ARRIVED!');
      state.score += 200;
    }
  }

  // ─── Win/Lose Check ────────────────────────────────────────────────────────
  function checkWin() {
    if (state.gameOver) return;
    if (state.loyalistsSilenced >= 3 && state.donArrested) {
      var bonus = '';
      if (state.evidenceCount >= 3) {
        state.score += 2000;
        bonus = ' RICO CASE SEALED. +2000 bonus!';
      }
      showEnd(true,
        'All loyalists silenced. Don Cabrini in custody.' + bonus +
        ' Score: ' + state.score);
    }
  }

  function checkLose() {
    if (state.gameOver) return;
    // Lose if cover blown + Don escaped (timer ran out) and Don not arrested
    if (state.coverBlown && state.missionTimer <= 0 && !state.donArrested) {
      showEnd(false, 'Cover blown and Don Cabrini escaped. Operation compromised.');
      return;
    }
    // All civilians killed
    if (state.civiliansKilled >= 4) {
      showEnd(false, 'Four civilians killed. Operation aborted — FBI pulls support.');
      return;
    }
  }

  // ─── Player Movement ───────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (!state.player || state.gameOver) return;
    var speed = 6 * dt;
    var yaw = state.playerYaw;
    var fwdX = -Math.sin(yaw);
    var fwdZ = -Math.cos(yaw);
    var rtX = Math.cos(yaw);
    var rtZ = -Math.sin(yaw);
    var mk = state.moveKeys;

    if (mk['w'] || mk['arrowup'])    { state.player.x += fwdX * speed; state.player.z += fwdZ * speed; }
    if (mk['s'] || mk['arrowdown'])  { state.player.x -= fwdX * speed; state.player.z -= fwdZ * speed; }
    if (mk['a'] || mk['arrowleft'])  { state.player.x -= rtX * speed; state.player.z -= rtZ * speed; }
    if (mk['d'] || mk['arrowright']) { state.player.x += rtX * speed; state.player.z += rtZ * speed; }

    if (state.playerMesh) {
      state.playerMesh.position.set(state.player.x, 0.9, state.player.z);
      state.playerMesh.rotation.y = yaw;
    }

    // Camera follows player
    if (state.camera) {
      state.camera.position.set(
        state.player.x + fwdX * 0.2,
        2.2,
        state.player.z + fwdZ * 0.2
      );
      state.camera.rotation.order = 'YXZ';
      state.camera.rotation.y = yaw;
      state.camera.rotation.x = state.playerPitch;
    }
  }

  // ─── Init / Activate ───────────────────────────────────────────────────────
  function activateGame() {
    if (state.active) return;
    state.active = true;
    state.missionStartTime = performance.now();
    state.lastRadioTime = 0;

    // Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setClearColor(0x110A00);
    document.body.appendChild(state.renderer.domElement);
    state.renderer.domElement.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'z-index:9999'
    ].join(';');

    // Scene + camera
    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    state.camera.position.set(0, 2.2, 6);

    // Fog for atmosphere
    state.scene.fog = new THREE.Fog(0x110800, 20, 80);

    buildScene();
    buildHUD();
    setupInput();

    state.renderer.domElement.requestPointerLock();

    window.addEventListener('resize', function () {
      if (!state.active || !state.renderer || !state.camera) return;
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
    });

    state.lastTime = performance.now();
    gameLoop();
  }

  // ─── Game Loop ─────────────────────────────────────────────────────────────
  function gameLoop() {
    state.animFrameId = requestAnimationFrame(gameLoop);

    var now = performance.now();
    var dt = Math.min((now - state.lastTime) / 1000, 0.1);
    state.lastTime = now;

    if (!state.gameOver) {
      state.missionTimer -= dt;
      if (state.missionTimer < 0) state.missionTimer = 0;
    }

    updatePlayer(dt);
    updateNPCs(dt);
    handleInteract(dt);
    handleKnife();
    handlePush();
    checkBackupArrival();
    checkLose();
    updateHUD();

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  function init() {
    setupInput();
  }

  function update() {
    // External update hook (no-op: game loop is self-driven)
  }

  function reset() {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer && state.renderer.domElement && state.renderer.domElement.parentNode) {
      state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
    }
    if (state.hudEl && state.hudEl.parentNode) { state.hudEl.parentNode.removeChild(state.hudEl); }
    if (state.promptEl && state.promptEl.parentNode) { state.promptEl.parentNode.removeChild(state.promptEl); }
    if (state.radioEl && state.radioEl.parentNode) { state.radioEl.parentNode.removeChild(state.radioEl); }
    if (state.endEl && state.endEl.parentNode) { state.endEl.parentNode.removeChild(state.endEl); }

    if (state.keydownHandler) { document.removeEventListener('keydown', state.keydownHandler); }
    if (state.keyupHandler) { document.removeEventListener('keyup', state.keyupHandler); }
    if (state.mousemoveHandler) { document.removeEventListener('mousemove', state.mousemoveHandler); }
    if (state.renderer && state.clickHandler) {
      state.renderer.domElement.removeEventListener('click', state.clickHandler);
    }
    if (document.exitPointerLock) { document.exitPointerLock(); }

    // Reset state fields
    state.active = false;
    state.gameOver = false;
    state.missionFailed = false;
    state.missionClear = false;
    state.missionTimer = 360;
    state.coverBlown = false;
    state.loyalistsSilenced = 0;
    state.loyalists = [];
    state.soldiers = [];
    state.soldiersHostile = false;
    state.donDown = false;
    state.donArrested = false;
    state.donHP = 200;
    state.donMesh = null;
    state.civilians = [];
    state.civiliansKilled = 0;
    state.fbiBuddy = [];
    state.backupArrived = false;
    state.ledgerCollected = false;
    state.ledgerMesh = null;
    state.wiretapPlanted = false;
    state.wiretapMesh = null;
    state.wiretapHoldTimer = 0;
    state.photosCollected = false;
    state.photoMesh = null;
    state.evidenceCount = 0;
    state.safeOpen = false;
    state.safeLock = null;
    state.safeLockHP = 3;
    state.poisonPillHeld = false;
    state.poisonPillMesh = null;
    state.radioOpen = false;
    state.radioBonus = 0;
    state.score = 0;
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.playerMesh = null;
    state.player = null;
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.moveKeys = {};
    state.pointerLocked = false;
    state.arrestHoldTimer = 0;
    state.arrestHeld = false;
    state.hudEl = null;
    state.promptEl = null;
    state.radioEl = null;
    state.endEl = null;
    state.dDown = false;
    state.pDown = false;
    state.dDownTime = 0;
    state.pDownTime = 0;
    state.lastInteractTime = 0;
    state.lastKnifeTime = 0;
    state.lastPushTime = 0;
    state.keydownHandler = null;
    state.keyupHandler = null;
    state.mousemoveHandler = null;
    state.clickHandler = null;
  }

  // ─── Helper (used in reset scope) ─────────────────────────────────────────
  function setColor(mesh, hex) {
    if (mesh && mesh.material) {
      mesh.material.color.setHex(hex);
    }
  }

  return { init: init, update: update, reset: reset };
}());
