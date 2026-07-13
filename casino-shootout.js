// ============================================================
//  casino-shootout.js — Casino Shootout FPS Module
//  Grand Monaco Casino — floor-by-floor hostage rescue
//  Activation: C + S simultaneous keypress within 400ms
//  Public API: init, update, reset
// ============================================================
window.CasinoShootout = (function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW   = 400;
  var FLOORS              = 5;
  var TOTAL_HOSTAGES      = 25;
  var WIN_HOSTAGES        = 15;
  var RESCUE_HOLD_TIME    = 1.5;   // seconds E held
  var RESCUE_RANGE        = 2.5;
  var EXEC_INTERVAL       = 240;   // 4 min between random executions
  var BOSS_SEE_EXEC_COUNT = 3;
  var BOMB_TIMER_START    = 600;   // 10 min from boss encounter
  var FLOOR_HEIGHT        = 6;

  // enemy config
  var GUNMAN_HP          = 80;
  var ELITE_HP           = 130;
  var BOSS_HP            = 400;
  var BODYGUARD_HP       = 150;
  var GUNMAN_SPEED       = 3;
  var ELITE_SPEED        = 3.5;
  var BOSS_SPEED         = 1.5;
  var DETECT_RANGE       = 18;
  var SHOOT_RANGE        = 14;
  var SHOOT_RATE         = 1.2;    // shots per second
  var PLAYER_HP_MAX      = 100;
  var BULLET_DAMAGE_TO_PLAYER = 12;
  var PLAYER_DAMAGE      = 35;

  // property damage values
  var DMG_SLOT_MACHINE   = 5000;
  var DMG_BAR_BOTTLE     = 200;
  var DMG_ROULETTE_TABLE = 8000;
  var DMG_GLASS_PANEL    = 3000;
  var DMG_CHANDELIER     = 15000;
  var DMG_POKER_TABLE    = 6000;
  var DMG_CHAIR          = 800;
  var DMG_MONITOR        = 4000;

  // colors
  var COL_FLOOR1         = 0x665544;
  var COL_FLOOR2         = 0x554433;
  var COL_FLOOR3         = 0x443322;
  var COL_FLOOR4         = 0x334444;
  var COL_PENTHOUSE      = 0x445566;
  var COL_GUNMAN         = 0x332222;
  var COL_ELITE          = 0x221111;
  var COL_BOSS           = 0x331111;
  var COL_HOSTAGE        = 0x886666;
  var COL_SLOT           = 0x445577;
  var COL_WOOD           = 0x8B5E3C;
  var COL_METAL          = 0x7A8A8A;
  var COL_GLASS          = 0x99CCDD;
  var COL_WINE           = 0x5C2244;
  var COL_CHIP           = 0x22AA44;
  var COL_VAULT_FRAME    = 0x888899;
  var COL_CARPET         = 0x9B1C1C;
  var COL_SAFE_ZONE      = 0x00BB44;
  var COL_CHANDELIER     = 0xDDAA33;
  var COL_SKIN           = 0xEEC9A3;

  // ─── State ──────────────────────────────────────────────────────────────────
  var st = {
    active: false,
    // activation
    cDown: false, cDownTime: 0,
    sDown: false, sDownTime: 0,
    // scene
    scene: null, camera: null, renderer: null,
    animId: null, lastTime: 0, clock: 0,
    // player
    playerHP: PLAYER_HP_MAX,
    playerYaw: 0, playerPitch: 0,
    moveKeys: {},
    pointerLocked: false,
    currentFloor: 1,
    // floors
    floorMeshes: [],
    floorGroups: [],
    // enemies
    enemies: [],
    // hostages
    hostages: [],
    // destructibles
    destructibles: [],
    // glass panels
    glassPanels: [],
    // chandeliers
    chandeliers: [],
    // stairwell safe zones per floor
    stairwellZones: [],
    // boss
    boss: null,
    bossDetonatorActive: false,
    bossArrested: false,
    bossNeutralized: false,
    bossSeen: false,
    // bomb
    bombActive: false, bombTimer: 0,
    // mission
    hostagesRescued: 0,
    hostagesExecuted: 0,
    execTimer: EXEC_INTERVAL,
    missionFailed: false,
    missionWon: false,
    failReason: '',
    // property damage
    propertyDamage: 0,
    // HUD + overlays
    hudEl: null, endEl: null, promptEl: null, briefEl: null,
    // input
    eKeyDown: false, ePressStart: 0, eRescueTarget: null,
    fKeyDown: false,
    // shooting
    lastShot: 0,
    // ambient lights
    ambientLight: null, dirLight: null,
    // debris/particles (simple meshes)
    particles: [],
    // key handlers
    keydownHandler: null, keyupHandler: null,
    mousemoveHandler: null, mousedownHandler: null,
    clickHandler: null, plChangeHandler: null,
    // boss bodyguards
    bodyguards: [],
    // roulette spin state
    rouletteTables: [],
    // floor geometry (for Y offset)
    floorY: [0, 6, 12, 18, 24],
    // stairwell mesh
    stairwells: [],
    // elapsed real time for HUD timer
    elapsed: 0,
    // gun hand visual
    gunMesh: null
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }
  function toMMSS(s) {
    var m = Math.floor(s / 60);
    return pad2(m) + ':' + pad2(s % 60);
  }

  function getScene() {
    return st.scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }
  function getCamera() {
    return st.camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }
  function getRenderer() {
    return st.renderer ||
      (window.GameManager && window.GameManager.renderer) ||
      window.renderer || null;
  }
  function getPlayerPos() {
    var cam = getCamera();
    if (cam) return cam.position;
    return null;
  }

  function makeBox(w, h, d, col, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: col });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeSphere(r, col, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: col });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : r, z || 0);
    return mesh;
  }

  function makeCyl(rt, rb, h, col, x, y, z, segs) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: col });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeCone(r, h, col, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, 6);
    var mat = new THREE.MeshLambertMaterial({ color: col });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeLineBox(w, h, d, col, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: col });
    var ls = new THREE.LineSegments(edges, mat);
    ls.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return ls;
  }

  function dist3D(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function fmtDmg(d) {
    if (d >= 1000000) return '$' + (d / 1000000).toFixed(1) + 'M';
    if (d >= 1000) return '$' + Math.floor(d / 1000) + 'k';
    return '$' + d;
  }

  function addDamage(val) {
    st.propertyDamage += val;
  }

  // ─── Scene Building ──────────────────────────────────────────────────────────
  function buildScene() {
    var scene = getScene();
    if (!scene) return;

    st.ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(st.ambientLight);
    st.dirLight = new THREE.DirectionalLight(0xFFEECC, 0.8);
    st.dirLight.position.set(10, 30, 10);
    scene.add(st.dirLight);

    buildFloor1(scene);
    buildFloor2(scene);
    buildFloor3(scene);
    buildFloor4(scene);
    buildPenthouse(scene);

    // stairwell connectors between floors (small boxes at edge)
    var i;
    for (i = 0; i < 4; i++) {
      var stairY = st.floorY[i] + 3;
      var stair = makeBox(4, 6, 4, 0x776655, 26, stairY, 0);
      scene.add(stair);
      st.stairwells.push(stair);
      // stairwell safe zone marker
      var szMesh = makeBox(4, 0.2, 4, COL_SAFE_ZONE, 26, st.floorY[i] + 0.2, 0);
      szMesh._floorIndex = i;
      scene.add(szMesh);
      st.stairwellZones.push({ mesh: szMesh, floorIndex: i, x: 26, z: 0 });
    }

    // gun hand
    st.gunMesh = makeBox(0.25, 0.15, 0.7, 0x111111, 0, 0, 0);
    st.gunMesh.visible = false;
    scene.add(st.gunMesh);
  }

  function buildFloor1(scene) {
    var fy = st.floorY[0];
    // floor slab
    var floor = makeBox(50, 0.5, 40, COL_FLOOR1, 0, fy, 0);
    scene.add(floor);
    // carpet
    var carpet = makeBox(48, 0.1, 38, COL_CARPET, 0, fy + 0.3, 0);
    scene.add(carpet);
    // ceiling
    var ceil = makeBox(50, 0.5, 40, 0x443322, 0, fy + FLOOR_HEIGHT, 0);
    scene.add(ceil);
    // walls
    scene.add(makeBox(50, FLOOR_HEIGHT, 0.5, 0x554433, 0, fy + FLOOR_HEIGHT / 2, -20));
    scene.add(makeBox(50, FLOOR_HEIGHT, 0.5, 0x554433, 0, fy + FLOOR_HEIGHT / 2, 20));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 40, 0x554433, -25, fy + FLOOR_HEIGHT / 2, 0));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 40, 0x554433, 25, fy + FLOOR_HEIGHT / 2, 0));

    // chandelier
    var chand = buildChandelier(scene, 0, fy + FLOOR_HEIGHT - 0.5, -5);
    st.chandeliers.push(chand);

    // slot machine rows
    var i, j;
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 5; j++) {
        buildSlotMachine(scene, -18 + j * 4, fy + 1.2, -12 + i * 5);
      }
    }

    // roulette tables
    buildRouletteTable(scene, 8, fy + 0.9, -8);
    buildRouletteTable(scene, 8, fy + 0.9, 5);
    buildRouletteTable(scene, -2, fy + 0.9, 8);

    // enemies: 6 gunmen
    var gpos = [
      {x: -15, z: -5}, {x: -10, z: 10}, {x: 0, z: -15},
      {x: 10, z: -10}, {x: 5, z: 5}, {x: -5, z: 15}
    ];
    for (i = 0; i < gpos.length; i++) {
      spawnEnemy(scene, 'gunman', gpos[i].x, fy + 1.2, gpos[i].z, 1);
    }

    // hostages: 10
    var hpos = [
      {x:-20,z:-15},{x:-16,z:0},{x:-12,z:10},{x:-8,z:-8},{x:-4,z:15},
      {x:4,z:-15},{x:8,z:0},{x:12,z:-5},{x:16,z:10},{x:20,z:-12}
    ];
    for (i = 0; i < hpos.length; i++) {
      spawnHostage(scene, hpos[i].x, fy + 0.9, hpos[i].z, 1);
    }
  }

  function buildFloor2(scene) {
    var fy = st.floorY[1];
    var floor = makeBox(45, 0.5, 35, COL_FLOOR2, 0, fy, 0);
    scene.add(floor);
    var ceil = makeBox(45, 0.5, 35, 0x443322, 0, fy + FLOOR_HEIGHT, 0);
    scene.add(ceil);
    scene.add(makeBox(45, FLOOR_HEIGHT, 0.5, 0x443322, 0, fy + FLOOR_HEIGHT / 2, -17.5));
    scene.add(makeBox(45, FLOOR_HEIGHT, 0.5, 0x443322, 0, fy + FLOOR_HEIGHT / 2, 17.5));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 35, 0x443322, -22.5, fy + FLOOR_HEIGHT / 2, 0));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 35, 0x443322, 22.5, fy + FLOOR_HEIGHT / 2, 0));

    // chandelier
    var chand = buildChandelier(scene, -5, fy + FLOOR_HEIGHT - 0.5, 2);
    st.chandeliers.push(chand);

    // restaurant tables (WOOD)
    var i;
    for (i = 0; i < 6; i++) {
      var tx = -14 + (i % 3) * 8;
      var tz = -8 + Math.floor(i / 3) * 10;
      var tbl = makeBox(2.5, 0.15, 1.4, COL_WOOD, tx, fy + 1.0, tz);
      scene.add(tbl);
      // legs
      scene.add(makeBox(0.1, 1.0, 0.1, COL_WOOD, tx - 1.1, fy + 0.5, tz - 0.6));
      scene.add(makeBox(0.1, 1.0, 0.1, COL_WOOD, tx + 1.1, fy + 0.5, tz - 0.6));
      scene.add(makeBox(0.1, 1.0, 0.1, COL_WOOD, tx - 1.1, fy + 0.5, tz + 0.6));
      scene.add(makeBox(0.1, 1.0, 0.1, COL_WOOD, tx + 1.1, fy + 0.5, tz + 0.6));
    }

    // bar counter (METAL)
    var bar = makeBox(12, 1.2, 1.5, COL_METAL, 6, fy + 0.6, 13);
    scene.add(bar);

    // wine bottles
    for (i = 0; i < 12; i++) {
      buildWineBottle(scene, 0 + i * 1.0, fy + 1.25, 12 + rnd(-0.3, 0.3));
    }

    // glass panels behind bar
    buildGlassPanel(scene, 12, fy + 2.0, 14, 0);
    buildGlassPanel(scene, 8, fy + 2.0, 14, 4);

    // enemies: 5 gunmen
    var gpos = [
      {x: -15, z: -12}, {x: -5, z: 5}, {x: 5, z: -10},
      {x: 12, z: 0}, {x: 0, z: 12}
    ];
    for (i = 0; i < gpos.length; i++) {
      spawnEnemy(scene, 'gunman', gpos[i].x, fy + 1.2, gpos[i].z, 2);
    }

    // hostages: 7
    var hpos = [
      {x:-18,z:-10},{x:-10,z:-5},{x:-6,z:8},{x:2,z:-12},
      {x:8,z:5},{x:14,z:-8},{x:18,z:10}
    ];
    for (i = 0; i < hpos.length; i++) {
      spawnHostage(scene, hpos[i].x, fy + 0.9, hpos[i].z, 2);
    }
  }

  function buildFloor3(scene) {
    var fy = st.floorY[2];
    var floor = makeBox(35, 0.5, 25, COL_FLOOR3, 0, fy, 0);
    scene.add(floor);
    var ceil = makeBox(35, 0.5, 25, 0x332211, 0, fy + FLOOR_HEIGHT, 0);
    scene.add(ceil);
    scene.add(makeBox(35, FLOOR_HEIGHT, 0.5, 0x332211, 0, fy + FLOOR_HEIGHT / 2, -12.5));
    scene.add(makeBox(35, FLOOR_HEIGHT, 0.5, 0x332211, 0, fy + FLOOR_HEIGHT / 2, 12.5));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 25, 0x332211, -17.5, fy + FLOOR_HEIGHT / 2, 0));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 25, 0x332211, 17.5, fy + FLOOR_HEIGHT / 2, 0));

    // chandelier
    var chand = buildChandelier(scene, 0, fy + FLOOR_HEIGHT - 0.5, 0);
    st.chandeliers.push(chand);

    // poker tables
    var i;
    var ptpos = [{x:-10,z:-5},{x:0,z:5},{x:10,z:-5}];
    for (i = 0; i < ptpos.length; i++) {
      var pt = makeBox(3, 0.12, 2, 0x115522, ptpos[i].x, fy + 1.0, ptpos[i].z);
      scene.add(pt);
      var dstructPT = makeBox(3, 0.12, 2, 0x115522, ptpos[i].x, fy + 1.0, ptpos[i].z);
      dstructPT.visible = false;
      st.destructibles.push({
        mesh: pt, type: 'poker_table', hp: 30, destroyed: false,
        cost: DMG_POKER_TABLE,
        x: ptpos[i].x, z: ptpos[i].z, floorY: fy
      });
      // chip stacks
      scene.add(makeCyl(0.15, 0.15, 0.5, COL_CHIP, ptpos[i].x - 1, fy + 1.26, ptpos[i].z));
      scene.add(makeCyl(0.15, 0.15, 0.5, 0xCC2222, ptpos[i].x + 0.5, fy + 1.26, ptpos[i].z + 0.4));
    }

    // leather chairs
    for (i = 0; i < 8; i++) {
      var cx = rnd(-14, 14), cz = rnd(-10, 10);
      var chair = makeBox(0.7, 0.9, 0.7, 0x2C1A0E, cx, fy + 0.45, cz);
      scene.add(chair);
      st.destructibles.push({
        mesh: chair, type: 'chair', hp: 15, destroyed: false,
        cost: DMG_CHAIR,
        x: cx, z: cz, floorY: fy
      });
    }

    // enemies: 4 elite guards
    var epos = [{x:-12,z:-8},{x:-4,z:8},{x:8,z:-6},{x:14,z:6}];
    for (i = 0; i < epos.length; i++) {
      spawnEnemy(scene, 'elite', epos[i].x, fy + 1.2, epos[i].z, 3);
    }

    // hostages: 5
    var hpos = [{x:-14,z:-10},{x:-8,z:4},{x:2,z:-8},{x:10,z:5},{x:14,z:-4}];
    for (i = 0; i < hpos.length; i++) {
      spawnHostage(scene, hpos[i].x, fy + 0.9, hpos[i].z, 3);
    }
  }

  function buildFloor4(scene) {
    var fy = st.floorY[3];
    var floor = makeBox(20, 0.5, 15, COL_FLOOR4, 0, fy, 0);
    scene.add(floor);
    var ceil = makeBox(20, 0.5, 15, 0x223333, 0, fy + FLOOR_HEIGHT, 0);
    scene.add(ceil);
    scene.add(makeBox(20, FLOOR_HEIGHT, 0.5, 0x223333, 0, fy + FLOOR_HEIGHT / 2, -7.5));
    scene.add(makeBox(20, FLOOR_HEIGHT, 0.5, 0x223333, 0, fy + FLOOR_HEIGHT / 2, 7.5));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 15, 0x223333, -10, fy + FLOOR_HEIGHT / 2, 0));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 15, 0x223333, 10, fy + FLOOR_HEIGHT / 2, 0));

    // monitor banks (glass panels)
    var i;
    for (i = 0; i < 5; i++) {
      buildMonitorPanel(scene, -8 + i * 3.5, fy + 2.5, -5);
    }
    // camera control console
    var console_ = makeBox(8, 1.0, 1.2, COL_METAL, 0, fy + 0.5, 4);
    scene.add(console_);

    // 3 guards
    var gpos = [{x:-6,z:-2},{x:2,z:2},{x:7,z:-4}];
    for (i = 0; i < gpos.length; i++) {
      spawnEnemy(scene, 'elite', gpos[i].x, fy + 1.2, gpos[i].z, 4);
    }
    // no hostages floor 4
  }

  function buildPenthouse(scene) {
    var fy = st.floorY[4];
    var floor = makeBox(30, 0.5, 30, COL_PENTHOUSE, 0, fy, 0);
    scene.add(floor);
    var ceil = makeBox(30, 0.5, 30, 0x334455, 0, fy + FLOOR_HEIGHT, 0);
    scene.add(ceil);
    scene.add(makeBox(30, FLOOR_HEIGHT, 0.5, 0x334455, 0, fy + FLOOR_HEIGHT / 2, -15));
    scene.add(makeBox(30, FLOOR_HEIGHT, 0.5, 0x334455, 0, fy + FLOOR_HEIGHT / 2, 15));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 30, 0x334455, -15, fy + FLOOR_HEIGHT / 2, 0));
    scene.add(makeBox(0.5, FLOOR_HEIGHT, 30, 0x334455, 15, fy + FLOOR_HEIGHT / 2, 0));

    // vault door (LineSegments steel frame)
    var vaultFrame = makeLineBox(5, 6, 0.5, COL_VAULT_FRAME, -10, fy + 3, -13);
    scene.add(vaultFrame);
    // inner vault lines
    var vaultInner = makeLineBox(4, 5, 0.3, 0xAABBCC, -10, fy + 3, -13);
    scene.add(vaultInner);

    // boss suite furniture
    var desk = makeBox(3, 0.8, 1.5, COL_WOOD, 0, fy + 0.4, -10);
    scene.add(desk);
    scene.add(makeBox(4, 0.1, 3, COL_CARPET, 0, fy + 0.05, -8));

    // chandelier above penthouse
    var chand = buildChandelier(scene, 0, fy + FLOOR_HEIGHT - 0.5, 0);
    st.chandeliers.push(chand);

    // spawn boss
    spawnBoss(scene, 0, fy + 1.4, -8);

    // 4 bodyguards in corners
    spawnBodyguard(scene, -11, fy + 1.2, -11);
    spawnBodyguard(scene, 11, fy + 1.2, -11);
    spawnBodyguard(scene, -11, fy + 1.2, 11);
    spawnBodyguard(scene, 11, fy + 1.2, 11);
  }

  // ─── Build Decorative Objects ────────────────────────────────────────────────
  function buildSlotMachine(scene, x, y, z) {
    var body = makeBox(0.8, 1.8, 0.7, COL_SLOT, x, y, z);
    scene.add(body);
    var screen = makeBox(0.5, 0.4, 0.05, 0x88AACC, x, y + 0.5, z - 0.36);
    scene.add(screen);
    var lever = makeBox(0.07, 0.6, 0.07, COL_METAL, x + 0.45, y + 0.3, z);
    scene.add(lever);
    st.destructibles.push({
      mesh: body, type: 'slot_machine', hp: 20, destroyed: false,
      cost: DMG_SLOT_MACHINE, x: x, z: z, floorY: y - 1.2,
      chain: true, extras: [screen, lever]
    });
  }

  function buildRouletteTable(scene, x, y, z) {
    var base = makeCyl(2.5, 2.5, 0.15, 0x114422, x, y, z);
    scene.add(base);
    var felt = makeCyl(2.3, 2.3, 0.05, 0x22AA44, x, y + 0.1, z);
    scene.add(felt);
    var wheel = makeCyl(0.6, 0.6, 0.25, 0xBB8833, x, y + 0.2, z - 1.2);
    scene.add(wheel);
    // chip scatter decorations
    var i;
    for (i = 0; i < 5; i++) {
      var ang = (i / 5) * Math.PI * 2;
      var cr = 1.2;
      scene.add(makeCyl(0.12, 0.12, 0.05, COL_CHIP, x + Math.cos(ang) * cr, y + 0.18, z + Math.sin(ang) * cr));
    }
    st.rouletteTables.push({ base: base, wheel: wheel, spinning: false, spinSpeed: 0, x: x, z: z });
    st.destructibles.push({
      mesh: base, type: 'roulette_table', hp: 40, destroyed: false,
      cost: DMG_ROULETTE_TABLE, x: x, z: z, floorY: y - 0.9,
      extras: [felt, wheel]
    });
  }

  function buildWineBottle(scene, x, y, z) {
    var bottle = makeCyl(0.06, 0.08, 0.35, COL_WINE, x, y, z);
    scene.add(bottle);
    st.destructibles.push({
      mesh: bottle, type: 'wine_bottle', hp: 5, destroyed: false,
      cost: DMG_BAR_BOTTLE, x: x, z: z, floorY: y - 0.35
    });
  }

  function buildGlassPanel(scene, x, y, z, rot) {
    var geo = new THREE.BoxGeometry(3, 2.5, 0.05);
    var mat = new THREE.MeshLambertMaterial({
      color: COL_GLASS, transparent: true, opacity: 0.4
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.y = rot;
    scene.add(mesh);

    var edges = new THREE.EdgesGeometry(geo);
    var lmat = new THREE.LineBasicMaterial({ color: 0xCCEEFF });
    var ls = new THREE.LineSegments(edges, lmat);
    ls.position.copy(mesh.position);
    ls.rotation.copy(mesh.rotation);
    scene.add(ls);

    st.glassPanels.push({
      mesh: mesh, ls: ls, destroyed: false,
      cost: DMG_GLASS_PANEL, x: x, z: z
    });
  }

  function buildMonitorPanel(scene, x, y, z) {
    var frame = makeBox(2.8, 1.8, 0.15, COL_METAL, x, y, z);
    scene.add(frame);
    var screen = makeBox(2.4, 1.4, 0.05, 0x001122, x, y, z - 0.1);
    scene.add(screen);
    // scan line effect (thin boxes)
    scene.add(makeBox(2.2, 0.05, 0.02, 0x003344, x, y + 0.3, z - 0.13));
    scene.add(makeBox(2.2, 0.05, 0.02, 0x003344, x, y - 0.3, z - 0.13));
    st.destructibles.push({
      mesh: frame, type: 'monitor', hp: 15, destroyed: false,
      cost: DMG_MONITOR, x: x, z: z, floorY: y - 2.5,
      extras: [screen]
    });
  }

  function buildChandelier(scene, x, y, z) {
    var center = makeSphere(0.3, COL_CHANDELIER, x, y, z);
    scene.add(center);
    // chain (cylinder)
    var chain = makeCyl(0.05, 0.05, 1.0, COL_METAL, x, y + 0.75, z);
    scene.add(chain);
    // arms (boxes)
    var arm1 = makeBox(2.5, 0.08, 0.08, COL_CHANDELIER, x, y - 0.15, z);
    scene.add(arm1);
    var arm2 = makeBox(0.08, 0.08, 2.5, COL_CHANDELIER, x, y - 0.15, z);
    scene.add(arm2);
    // bulbs at ends
    var b1 = makeSphere(0.15, 0xFFFFCC, x - 1.2, y - 0.3, z);
    var b2 = makeSphere(0.15, 0xFFFFCC, x + 1.2, y - 0.3, z);
    var b3 = makeSphere(0.15, 0xFFFFCC, x, y - 0.3, z - 1.2);
    var b4 = makeSphere(0.15, 0xFFFFCC, x, y - 0.3, z + 1.2);
    scene.add(b1); scene.add(b2); scene.add(b3); scene.add(b4);
    var chandObj = {
      center: center, chain: chain, arm1: arm1, arm2: arm2,
      bulbs: [b1, b2, b3, b4], fallen: false, falling: false,
      fallTimer: 0, x: x, y: y, z: z, hp: 10,
      cost: DMG_CHANDELIER, floorY: y - 5
    };
    return chandObj;
  }

  // ─── Enemy Spawning ──────────────────────────────────────────────────────────
  function spawnEnemy(scene, type, x, y, z, floor) {
    var hp = (type === 'gunman') ? GUNMAN_HP : ELITE_HP;
    var col = (type === 'gunman') ? COL_GUNMAN : COL_ELITE;
    var speed = (type === 'gunman') ? GUNMAN_SPEED : ELITE_SPEED;

    var body = makeBox(0.7, 1.6, 0.4, col, x, y, z);
    var head = makeSphere(0.25, COL_SKIN, x, y + 1.0, z);
    var gun = makeBox(0.08, 0.08, 0.7, 0x111111, x + 0.42, y + 0.4, z);
    scene.add(body); scene.add(head); scene.add(gun);

    var enemy = {
      type: type, floor: floor, hp: hp, maxHP: hp,
      body: body, head: head, gun: gun,
      x: x, y: y, z: z,
      vx: 0, vz: 0,
      speed: speed,
      state: 'patrol',
      patrolAngle: Math.random() * Math.PI * 2,
      patrolTimer: rnd(1, 3),
      shootTimer: rnd(0, 1 / SHOOT_RATE),
      alertTimer: 0,
      dead: false,
      deathTimer: 0
    };
    st.enemies.push(enemy);
    return enemy;
  }

  function spawnBoss(scene, x, y, z) {
    var body = makeBox(0.9, 1.8, 0.5, COL_BOSS, x, y, z);
    var head = makeSphere(0.3, COL_SKIN, x, y + 1.1, z);
    // detonator prop
    var det = makeBox(0.2, 0.3, 0.1, 0x882222, x + 0.55, y + 0.6, z);
    scene.add(body); scene.add(head); scene.add(det);

    st.boss = {
      type: 'boss', hp: BOSS_HP, maxHP: BOSS_HP,
      body: body, head: head, det: det,
      x: x, y: y, z: z,
      vx: 0, vz: 0,
      state: 'idle',
      shootTimer: 0.5,
      dead: false,
      arrested: false,
      seenPlayer: false,
      detonatorDisabled: false
    };
  }

  function spawnBodyguard(scene, x, y, z) {
    var body = makeBox(0.85, 1.75, 0.5, 0x1A0000, x, y, z);
    var head = makeSphere(0.28, COL_SKIN, x, y + 1.0, z);
    var gun = makeBox(0.08, 0.08, 0.7, 0x222222, x + 0.5, y + 0.4, z);
    scene.add(body); scene.add(head); scene.add(gun);

    var bg = {
      type: 'bodyguard', hp: BODYGUARD_HP, maxHP: BODYGUARD_HP,
      body: body, head: head, gun: gun,
      x: x, y: y, z: z,
      vx: 0, vz: 0,
      speed: 3.8,
      state: 'patrol',
      patrolAngle: Math.random() * Math.PI * 2,
      patrolTimer: rnd(1, 2),
      shootTimer: rnd(0, 0.8),
      dead: false,
      deathTimer: 0,
      homeX: x, homeZ: z
    };
    st.bodyguards.push(bg);
    return bg;
  }

  function spawnHostage(scene, x, y, z, floor) {
    var body = makeBox(0.55, 1.5, 0.35, COL_HOSTAGE, x, y, z);
    var head = makeSphere(0.2, COL_SKIN, x, y + 0.88, z);
    // bound hands (small box behind)
    var hands = makeBox(0.35, 0.12, 0.08, 0x664444, x, y + 0.4, z + 0.22);
    scene.add(body); scene.add(head); scene.add(hands);

    var hostage = {
      floor: floor, x: x, y: y, z: z,
      body: body, head: head, hands: hands,
      rescued: false, executed: false,
      following: false, followTimer: 0,
      safe: false
    };
    st.hostages.push(hostage);
    return hostage;
  }

  // ─── HUD ────────────────────────────────────────────────────────────────────
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'cs-hud';
    hud.style.cssText = [
      'position:fixed', 'top:8px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)', 'color:#FFE066',
      'font:bold 13px/1.5 monospace', 'padding:6px 14px',
      'border:1px solid #886622', 'border-radius:4px',
      'pointer-events:none', 'z-index:9000', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hud);
    st.hudEl = hud;

    var prompt = document.createElement('div');
    prompt.id = 'cs-prompt';
    prompt.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)', 'color:#88FFAA',
      'font:bold 12px monospace', 'padding:4px 10px',
      'border-radius:3px', 'pointer-events:none', 'z-index:9001',
      'display:none'
    ].join(';');
    document.body.appendChild(prompt);
    st.promptEl = prompt;

    var brief = document.createElement('div');
    brief.id = 'cs-brief';
    brief.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.92)', 'color:#FFE066',
      'font:14px monospace', 'padding:28px 36px',
      'border:2px solid #AA6622', 'border-radius:6px',
      'z-index:9010', 'max-width:480px', 'text-align:center',
      'line-height:1.7'
    ].join(';');
    brief.innerHTML = [
      '<b style="font-size:18px;color:#FF8844">CASINO SHOOTOUT</b><br>',
      '<span style="color:#FFCC66">Grand Monaco Casino — Active Hostage Situation</span><br><br>',
      'Crime syndicate Don Verano has seized the Grand Monaco.<br>',
      '25 hostages held across 5 floors. You are undercover.<br><br>',
      '<b>WASD</b> Move &nbsp; <b>Mouse</b> Aim &nbsp; <b>Click</b> Shoot<br>',
      '<b>E (hold 1.5s)</b> Signal hostage to safety<br>',
      '<b>F</b> Non-lethal takedown (boss only, close range)<br><br>',
      '<span style="color:#FF6644">Rescue 15+ hostages. Reach penthouse. Arrest or neutralize Don Verano.</span><br><br>',
      '<button id="cs-start-btn" style="',
      'background:#882222;color:#FFE;border:1px solid #FF6644;',
      'padding:8px 22px;font:bold 14px monospace;cursor:pointer;',
      'border-radius:3px">BEGIN MISSION</button>'
    ].join('');
    document.body.appendChild(brief);
    st.briefEl = brief;

    var startBtn = document.getElementById('cs-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        brief.style.display = 'none';
        requestPointerLock();
      });
    }
  }

  function updateHUD() {
    if (!st.hudEl) return;
    var bossStatus = 'UNLOCATED';
    if (st.currentFloor === 5) bossStatus = 'PENTHOUSE';
    if (st.bossArrested) bossStatus = 'ARRESTED';
    if (st.bossNeutralized) bossStatus = 'NEUTRALIZED';
    var dmgRating = '';
    if (st.propertyDamage === 0) dmgRating = ' [GHOST]';
    else if (st.propertyDamage >= 500000) dmgRating = ' [DEMOLITION]';

    var hpBar = '|' + '##########'.slice(0, Math.ceil(st.playerHP / 10)) + '|';

    st.hudEl.textContent = [
      'CASINO SHOOTOUT',
      '[FLOOR: ' + st.currentFloor + '/5]',
      '[HOSTAGES: ' + st.hostagesRescued + '/25 RESCUED]',
      '[TIMER: ' + toMMSS(Math.max(0, st.elapsed)) + ']',
      '[BOSS: ' + bossStatus + ']',
      '[DAMAGE: ' + fmtDmg(st.propertyDamage) + dmgRating + ']',
      '[HP: ' + st.playerHP + ']'
    ].join('  ');

    if (st.bombActive) {
      st.hudEl.style.color = '#FF4444';
      st.hudEl.textContent += '  !! BOMB: ' + toMMSS(st.bombTimer) + ' !!';
    } else {
      st.hudEl.style.color = '#FFE066';
    }
  }

  function showPrompt(text) {
    if (!st.promptEl) return;
    st.promptEl.textContent = text;
    st.promptEl.style.display = 'block';
  }
  function hidePrompt() {
    if (!st.promptEl) return;
    st.promptEl.style.display = 'none';
  }

  function showEnd(win) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.93)',
      'color:' + (win ? '#44FF88' : '#FF4444'),
      'font:bold 18px monospace', 'padding:30px 44px',
      'border:2px solid ' + (win ? '#22AA55' : '#AA2222'),
      'border-radius:8px', 'z-index:9020', 'text-align:center',
      'line-height:2'
    ].join(';');

    var rating = '';
    if (st.propertyDamage === 0) rating = 'Rating: GHOST — Zero collateral damage';
    else if (st.propertyDamage >= 500000) rating = 'Rating: DEMOLITION — You owe us one casino';
    else rating = 'Rating: OPERATIVE';

    el.innerHTML = win
      ? '<b>MISSION COMPLETE</b><br>Don Verano ' + (st.bossArrested ? 'ARRESTED' : 'NEUTRALIZED') + '<br>'
        + st.hostagesRescued + ' hostages rescued<br>'
        + 'Property damage: ' + fmtDmg(st.propertyDamage) + '<br>'
        + rating + '<br><br>'
        + '<span style="color:#FFE066">Press R to play again</span>'
      : '<b>MISSION FAILED</b><br>' + st.failReason + '<br><br>'
        + '<span style="color:#FFE066">Press R to retry</span>';

    document.body.appendChild(el);
    st.endEl = el;
  }

  // ─── Input ───────────────────────────────────────────────────────────────────
  function requestPointerLock() {
    var cv = getRenderer() && getRenderer().domElement;
    if (cv) cv.requestPointerLock();
  }

  function onKeyDown(e) {
    var k = e.code || e.key;
    st.moveKeys[k] = true;

    // activation: C + S within 400ms
    if (!st.active) {
      if (k === 'KeyC') { st.cDown = true; st.cDownTime = Date.now(); }
      if (k === 'KeyS') { st.sDown = true; st.sDownTime = Date.now(); }
      if (st.cDown && st.sDown) {
        var diff = Math.abs(st.cDownTime - st.sDownTime);
        if (diff < ACTIVATION_WINDOW) activate();
      }
      return;
    }

    if (k === 'KeyE' && !st.eKeyDown) {
      st.eKeyDown = true;
      st.ePressStart = Date.now() / 1000;
      st.eRescueTarget = null;
    }
    if (k === 'KeyF' && !st.fKeyDown) {
      st.fKeyDown = true;
      tryNonLethal();
    }
    if (k === 'KeyR' && (st.missionFailed || st.missionWon)) {
      reset();
    }
  }

  function onKeyUp(e) {
    var k = e.code || e.key;
    st.moveKeys[k] = false;
    if (k === 'KeyC') st.cDown = false;
    if (k === 'KeyS') st.sDown = false;
    if (k === 'KeyE') { st.eKeyDown = false; st.eRescueTarget = null; }
    if (k === 'KeyF') st.fKeyDown = false;
  }

  function onMouseMove(e) {
    if (!st.active || !st.pointerLocked) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    var sens = 0.002;
    st.playerYaw -= dx * sens;
    st.playerPitch -= dy * sens;
    st.playerPitch = clamp(st.playerPitch, -Math.PI / 3, Math.PI / 3);
  }

  function onMouseDown(e) {
    if (!st.active || st.missionFailed || st.missionWon) return;
    if (e.button === 0) tryShoot();
  }

  function onPLChange() {
    st.pointerLocked = (document.pointerLockElement === (getRenderer() && getRenderer().domElement));
  }

  // ─── Activation ──────────────────────────────────────────────────────────────
  function activate() {
    if (st.active) return;
    st.active = true;

    var scene = getScene();
    var camera = getCamera();
    if (!scene || !camera) { st.active = false; return; }

    st.scene = scene; st.camera = camera;
    st.renderer = getRenderer();

    // position player at floor 1 entrance
    camera.position.set(-22, st.floorY[0] + 1.8, 0);
    camera.rotation.set(0, 0, 0);
    st.playerYaw = 0; st.playerPitch = 0;
    st.playerHP = PLAYER_HP_MAX;
    st.currentFloor = 1;
    st.elapsed = 0;
    st.hostagesRescued = 0;
    st.propertyDamage = 0;
    st.execTimer = EXEC_INTERVAL;
    st.missionFailed = false;
    st.missionWon = false;
    st.bossArrested = false;
    st.bossNeutralized = false;
    st.bossSeen = false;
    st.bombActive = false;
    st.bombTimer = 0;

    buildScene();
    buildHUD();
    attachListeners();

    st.lastTime = performance.now();
    st.animId = requestAnimationFrame(loop);
  }

  function attachListeners() {
    st.keydownHandler = onKeyDown;
    st.keyupHandler = onKeyUp;
    st.mousemoveHandler = onMouseMove;
    st.mousedownHandler = onMouseDown;
    st.plChangeHandler = onPLChange;
    document.addEventListener('keydown', st.keydownHandler);
    document.addEventListener('keyup', st.keyupHandler);
    document.addEventListener('mousemove', st.mousemoveHandler);
    document.addEventListener('mousedown', st.mousedownHandler);
    document.addEventListener('pointerlockchange', st.plChangeHandler);
  }

  function detachListeners() {
    if (st.keydownHandler) document.removeEventListener('keydown', st.keydownHandler);
    if (st.keyupHandler) document.removeEventListener('keyup', st.keyupHandler);
    if (st.mousemoveHandler) document.removeEventListener('mousemove', st.mousemoveHandler);
    if (st.mousedownHandler) document.removeEventListener('mousedown', st.mousedownHandler);
    if (st.plChangeHandler) document.removeEventListener('pointerlockchange', st.plChangeHandler);
  }

  // ─── Game Loop ───────────────────────────────────────────────────────────────
  function loop(now) {
    if (!st.active) return;
    var dt = Math.min((now - st.lastTime) / 1000, 0.1);
    st.lastTime = now;
    update(dt);
    st.animId = requestAnimationFrame(loop);
  }

  // ─── Update ──────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!st.active) return;
    if (st.missionFailed || st.missionWon) return;

    st.elapsed += dt;
    updatePlayer(dt);
    updateCamera();
    updateEnemies(dt);
    updateBoss(dt);
    updateBodyguards(dt);
    updateHostages(dt);
    updateParticles(dt);
    updateChandeliers(dt);
    updateRoulette(dt);
    updateRescue(dt);
    checkFloor();
    checkExecutionTimer(dt);
    checkBombTimer(dt);
    checkWinLose();
    updateHUD();
    updateGunVisual();
    updateProximityPrompt();
  }

  function updatePlayer(dt) {
    var cam = getCamera();
    if (!cam) return;
    var speed = 6;
    var yaw = st.playerYaw;
    var fw = st.moveKeys['KeyW'] || st.moveKeys['ArrowUp'];
    var bk = st.moveKeys['KeyS'] || st.moveKeys['ArrowDown'];
    var lt = st.moveKeys['KeyA'] || st.moveKeys['ArrowLeft'];
    var rt = st.moveKeys['KeyD'] || st.moveKeys['ArrowRight'];

    var mx = 0, mz = 0;
    if (fw) { mx += Math.sin(yaw); mz += Math.cos(yaw); }
    if (bk) { mx -= Math.sin(yaw); mz -= Math.cos(yaw); }
    if (lt) { mx += Math.sin(yaw - Math.PI / 2); mz += Math.cos(yaw - Math.PI / 2); }
    if (rt) { mx += Math.sin(yaw + Math.PI / 2); mz += Math.cos(yaw + Math.PI / 2); }

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }

    cam.position.x += mx * speed * dt;
    cam.position.z += mz * speed * dt;

    // floor clamping
    var fy = st.floorY[st.currentFloor - 1];
    cam.position.y = fy + 1.8;
  }

  function updateCamera() {
    var cam = getCamera();
    if (!cam) return;
    cam.rotation.order = 'YXZ';
    cam.rotation.y = st.playerYaw;
    cam.rotation.x = st.playerPitch;
  }

  function updateGunVisual() {
    var cam = getCamera();
    if (!cam || !st.gunMesh) return;
    st.gunMesh.visible = st.pointerLocked;
    if (!st.pointerLocked) return;
    var offset = new THREE.Vector3(0.22, -0.18, -0.45);
    offset.applyQuaternion(cam.quaternion);
    st.gunMesh.position.copy(cam.position).add(offset);
    st.gunMesh.rotation.copy(cam.rotation);
  }

  function updateEnemies(dt) {
    var cam = getCamera();
    if (!cam) return;
    var px = cam.position.x, py = cam.position.y, pz = cam.position.z;
    var i, enemy;
    for (i = 0; i < st.enemies.length; i++) {
      enemy = st.enemies[i];
      if (enemy.dead) {
        enemy.deathTimer += dt;
        if (enemy.deathTimer > 3) removeEnemyMeshes(enemy);
        continue;
      }

      var d = dist3D({ x: enemy.x, y: enemy.y, z: enemy.z }, { x: px, y: py, z: pz });

      if (d < DETECT_RANGE) {
        enemy.state = 'chase';
        enemy.alertTimer += dt;
      } else {
        if (enemy.state === 'chase' && enemy.alertTimer > 0) {
          enemy.alertTimer -= dt * 0.5;
          if (enemy.alertTimer <= 0) enemy.state = 'patrol';
        }
      }

      if (enemy.state === 'patrol') {
        enemy.patrolTimer -= dt;
        if (enemy.patrolTimer <= 0) {
          enemy.patrolAngle += rnd(-1, 1);
          enemy.patrolTimer = rnd(1.5, 3.5);
        }
        var ps = enemy.speed * 0.5;
        enemy.x += Math.sin(enemy.patrolAngle) * ps * dt;
        enemy.z += Math.cos(enemy.patrolAngle) * ps * dt;
      } else if (enemy.state === 'chase') {
        var dx = px - enemy.x, dz = pz - enemy.z;
        var dd = Math.sqrt(dx * dx + dz * dz) || 1;
        if (d > 3) {
          enemy.x += (dx / dd) * enemy.speed * dt;
          enemy.z += (dz / dd) * enemy.speed * dt;
        }
        // shoot at player
        if (d < SHOOT_RANGE) {
          enemy.shootTimer -= dt;
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 1 / SHOOT_RATE + rnd(-0.2, 0.2);
            hitPlayer(BULLET_DAMAGE_TO_PLAYER * rnd(0.7, 1.3));
            spawnBulletTracer(enemy.x, enemy.y + 0.5, enemy.z, px, py, pz);
          }
        }
      }

      // sync meshes
      enemy.body.position.set(enemy.x, enemy.y, enemy.z);
      enemy.head.position.set(enemy.x, enemy.y + 1.0, enemy.z);
      enemy.gun.position.set(enemy.x + 0.42, enemy.y + 0.4, enemy.z);
      // face player
      var ang = Math.atan2(px - enemy.x, pz - enemy.z);
      enemy.body.rotation.y = ang;
      enemy.head.rotation.y = ang;
      enemy.gun.rotation.y = ang;
    }
  }

  function updateBoss(dt) {
    if (!st.boss || st.boss.dead || st.boss.arrested) return;
    var cam = getCamera();
    if (!cam) return;
    var px = cam.position.x, py = cam.position.y, pz = cam.position.z;
    var boss = st.boss;
    var d = dist3D({ x: boss.x, y: boss.y, z: boss.z }, { x: px, y: py, z: pz });

    // boss on penthouse floor only — only active if player is there
    if (st.currentFloor !== 5) return;

    if (d < DETECT_RANGE && !boss.seenPlayer) {
      boss.seenPlayer = true;
      st.bossSeen = true;
      // boss sees player: execute 3 hostages
      executeBossTriggeredHostages(BOSS_SEE_EXEC_COUNT);
      // arm bomb
      if (!st.bombActive && !st.bossDetonatorActive) {
        st.bossDetonatorActive = true;
        st.bombActive = true;
        st.bombTimer = BOMB_TIMER_START;
      }
    }

    if (boss.seenPlayer) {
      boss.state = 'combat';
      var dx = px - boss.x, dz = pz - boss.z;
      var dd = Math.sqrt(dx * dx + dz * dz) || 1;
      if (d > 5) {
        boss.x += (dx / dd) * BOSS_SPEED * dt;
        boss.z += (dz / dd) * BOSS_SPEED * dt;
      }
      boss.shootTimer -= dt;
      if (boss.shootTimer <= 0 && d < SHOOT_RANGE) {
        boss.shootTimer = 0.8;
        hitPlayer(BULLET_DAMAGE_TO_PLAYER * 1.5);
        spawnBulletTracer(boss.x, boss.y + 0.5, boss.z, px, py, pz);
      }
    }

    boss.body.position.set(boss.x, boss.y, boss.z);
    boss.head.position.set(boss.x, boss.y + 1.1, boss.z);
    boss.det.position.set(boss.x + 0.55, boss.y + 0.6, boss.z);
    var ang = Math.atan2(px - boss.x, pz - boss.z);
    boss.body.rotation.y = ang;
  }

  function updateBodyguards(dt) {
    var cam = getCamera();
    if (!cam) return;
    var px = cam.position.x, py = cam.position.y, pz = cam.position.z;
    var i, bg;
    for (i = 0; i < st.bodyguards.length; i++) {
      bg = st.bodyguards[i];
      if (bg.dead) {
        bg.deathTimer = (bg.deathTimer || 0) + dt;
        if (bg.deathTimer > 3) removeBodyguardMeshes(bg);
        continue;
      }
      if (st.currentFloor !== 5) continue;
      var d = dist3D({ x: bg.x, y: bg.y, z: bg.z }, { x: px, y: py, z: pz });
      if (d < DETECT_RANGE) {
        bg.state = 'chase';
        var dx = px - bg.x, dz = pz - bg.z;
        var dd = Math.sqrt(dx * dx + dz * dz) || 1;
        if (d > 2.5) {
          bg.x += (dx / dd) * bg.speed * dt;
          bg.z += (dz / dd) * bg.speed * dt;
        }
        if (d < SHOOT_RANGE) {
          bg.shootTimer -= dt;
          if (bg.shootTimer <= 0) {
            bg.shootTimer = 0.9;
            hitPlayer(BULLET_DAMAGE_TO_PLAYER);
            spawnBulletTracer(bg.x, bg.y + 0.5, bg.z, px, py, pz);
          }
        }
      } else {
        bg.state = 'patrol';
        bg.patrolTimer = (bg.patrolTimer || 0) - dt;
        if (bg.patrolTimer <= 0) {
          bg.patrolAngle = Math.random() * Math.PI * 2;
          bg.patrolTimer = rnd(1.5, 3);
        }
        // return toward home position slowly
        var hdx = bg.homeX - bg.x, hdz = bg.homeZ - bg.z;
        var hd = Math.sqrt(hdx * hdx + hdz * hdz) || 1;
        if (hd > 1) {
          bg.x += (hdx / hd) * 1.5 * dt;
          bg.z += (hdz / hd) * 1.5 * dt;
        }
      }
      bg.body.position.set(bg.x, bg.y, bg.z);
      bg.head.position.set(bg.x, bg.y + 1.0, bg.z);
      bg.gun.position.set(bg.x + 0.5, bg.y + 0.4, bg.z);
      var ang = Math.atan2(px - bg.x, pz - bg.z);
      bg.body.rotation.y = ang;
    }
  }

  function updateHostages(dt) {
    var i, h;
    for (i = 0; i < st.hostages.length; i++) {
      h = st.hostages[i];
      if (h.executed || h.safe) continue;
      if (h.following) {
        // move toward stairwell
        var sz = findNearestStairwell(h.floor);
        if (sz) {
          var dx = sz.x - h.x, dz = sz.z - h.z;
          var dd = Math.sqrt(dx * dx + dz * dz) || 1;
          var spd = 2.5;
          if (dd > 1.2) {
            h.x += (dx / dd) * spd * dt;
            h.z += (dz / dd) * spd * dt;
          } else {
            // reached stairwell — safe
            h.safe = true;
            h.following = false;
            h.rescued = true;
            st.hostagesRescued++;
            makeParticleBurst(h.x, h.y + 0.5, h.z, COL_SAFE_ZONE, 6);
            removeSafeHostageMeshes(h);
          }
        }
        h.body.position.set(h.x, h.y, h.z);
        h.head.position.set(h.x, h.y + 0.88, h.z);
        h.hands.position.set(h.x, h.y + 0.4, h.z + 0.22);
      }
    }
  }

  function findNearestStairwell(floor) {
    var i, best = null, bestD = 999;
    for (i = 0; i < st.stairwellZones.length; i++) {
      var sz = st.stairwellZones[i];
      if (sz.floorIndex === floor - 1) {
        best = sz;
        break;
      }
    }
    return best;
  }

  function updateRescue(dt) {
    if (!st.eKeyDown) {
      hidePrompt();
      return;
    }
    var cam = getCamera();
    if (!cam) return;
    var px = cam.position.x, py = cam.position.y, pz = cam.position.z;
    var nearest = null, nearD = RESCUE_RANGE;
    var i, h;
    for (i = 0; i < st.hostages.length; i++) {
      h = st.hostages[i];
      if (h.rescued || h.executed || h.safe || h.following) continue;
      var d = dist3D({ x: h.x, y: h.y, z: h.z }, { x: px, y: py, z: pz });
      if (d < nearD) { nearest = h; nearD = d; }
    }

    if (!nearest) { hidePrompt(); return; }

    var held = (Date.now() / 1000) - st.ePressStart;
    var pct = Math.min(held / RESCUE_HOLD_TIME, 1);
    showPrompt('SIGNALING HOSTAGE... ' + Math.floor(pct * 100) + '%');

    if (held >= RESCUE_HOLD_TIME) {
      nearest.following = true;
      st.eKeyDown = false;
      st.eRescueTarget = null;
      showPrompt('HOSTAGE SIGNALED — MOVING TO SAFETY');
    }
  }

  function updateParticles(dt) {
    var i, p;
    for (i = st.particles.length - 1; i >= 0; i--) {
      p = st.particles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 8 * dt; // gravity
      if (p.life <= 0) {
        var scene = getScene();
        if (scene) scene.remove(p.mesh);
        st.particles.splice(i, 1);
      }
    }
  }

  function updateChandeliers(dt) {
    var i, ch;
    for (i = 0; i < st.chandeliers.length; i++) {
      ch = st.chandeliers[i];
      if (ch.falling) {
        ch.fallTimer += dt;
        var drop = ch.fallTimer * ch.fallTimer * 6;
        ch.center.position.y = ch.y - drop;
        ch.arm1.position.y = ch.y - 0.15 - drop;
        ch.arm2.position.y = ch.y - 0.15 - drop;
        ch.chain.position.y = ch.y + 0.75 - drop;
        var j;
        for (j = 0; j < ch.bulbs.length; j++) {
          ch.bulbs[j].position.y = ch.y - 0.3 - drop;
        }
        if (ch.center.position.y < ch.floorY + 0.5) {
          ch.fallen = true;
          ch.falling = false;
          // check enemies under it
          crushEnemiesUnder(ch.x, ch.z, 3.5);
          addDamage(DMG_CHANDELIER);
          makeParticleBurst(ch.x, ch.floorY + 1, ch.z, 0xDDAA33, 14);
        }
      }
    }
  }

  function updateRoulette(dt) {
    var i, rt;
    for (i = 0; i < st.rouletteTables.length; i++) {
      rt = st.rouletteTables[i];
      if (rt.spinning) {
        rt.wheel.rotation.y += rt.spinSpeed * dt;
        rt.spinSpeed *= 0.98;
        if (Math.abs(rt.spinSpeed) < 0.02) rt.spinning = false;
      }
    }
  }

  function checkFloor() {
    var cam = getCamera();
    if (!cam) return;
    var py = cam.position.y;
    var i;
    for (i = 0; i < st.floorY.length; i++) {
      if (Math.abs(py - (st.floorY[i] + 1.8)) < 2) {
        st.currentFloor = i + 1;
        break;
      }
    }
  }

  function checkExecutionTimer(dt) {
    if (st.missionFailed || st.missionWon) return;
    st.execTimer -= dt;
    if (st.execTimer <= 0) {
      st.execTimer = EXEC_INTERVAL;
      executeRandomHostage();
    }
  }

  function checkBombTimer(dt) {
    if (!st.bombActive) return;
    st.bombTimer -= dt;
    if (st.bombTimer <= 0) {
      // bomb detonates
      st.missionFailed = true;
      st.failReason = 'Don Verano detonated the casino bomb!';
      showEnd(false);
    }
  }

  function checkWinLose() {
    // check player death
    if (st.playerHP <= 0) {
      st.missionFailed = true;
      st.failReason = 'Agent down — mission failed.';
      showEnd(false);
      return;
    }
    // check too many hostage deaths
    var deadH = 0;
    var i;
    for (i = 0; i < st.hostages.length; i++) {
      if (st.hostages[i].executed) deadH++;
    }
    if (deadH > TOTAL_HOSTAGES - WIN_HOSTAGES && !st.missionWon) {
      // can't possibly win now
      if ((TOTAL_HOSTAGES - deadH + st.hostagesRescued) < WIN_HOSTAGES) {
        st.missionFailed = true;
        st.failReason = 'Too many hostages executed (' + deadH + ' killed).';
        showEnd(false);
        return;
      }
    }
    // check win
    if ((st.bossArrested || st.bossNeutralized) && st.hostagesRescued >= WIN_HOSTAGES) {
      st.missionWon = true;
      if (st.bombActive) st.bombActive = false;
      showEnd(true);
    }
  }

  function updateProximityPrompt() {
    if (st.eKeyDown) return; // already showing rescue progress
    var cam = getCamera();
    if (!cam) return;
    var px = cam.position.x, py = cam.position.y, pz = cam.position.z;
    var i, h;
    for (i = 0; i < st.hostages.length; i++) {
      h = st.hostages[i];
      if (h.rescued || h.executed || h.safe || h.following) continue;
      var d = dist3D({ x: h.x, y: h.y, z: h.z }, { x: px, y: py, z: pz });
      if (d < RESCUE_RANGE) {
        showPrompt('[E] Signal hostage to stairwell (hold 1.5s)');
        return;
      }
    }
    // check boss proximity for non-lethal
    if (st.boss && !st.boss.dead && !st.boss.arrested && st.currentFloor === 5) {
      var bd = dist3D({ x: st.boss.x, y: st.boss.y, z: st.boss.z }, { x: px, y: py, z: pz });
      if (bd < 3) {
        showPrompt('[F] Non-lethal takedown — ARREST Don Verano');
        return;
      }
    }
    hidePrompt();
  }

  // ─── Combat ──────────────────────────────────────────────────────────────────
  function tryShoot() {
    var cam = getCamera();
    if (!cam) return;
    var now = performance.now() / 1000;
    if (now - st.lastShot < 0.15) return;
    st.lastShot = now;

    // muzzle flash particle
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion);
    var origin = cam.position.clone().addScaledVector(dir, 0.5);
    makeParticleBurst(origin.x, origin.y, origin.z, 0xFFCC44, 2);

    // raycast-style: check enemies in front-cone
    var i;
    // check enemies
    for (i = 0; i < st.enemies.length; i++) {
      var enemy = st.enemies[i];
      if (enemy.dead) continue;
      if (checkBulletHitsTarget(cam, dir, enemy.x, enemy.y + 0.8, enemy.z, 0.6)) {
        damageEnemy(enemy, PLAYER_DAMAGE, false);
        return;
      }
    }
    // check bodyguards
    for (i = 0; i < st.bodyguards.length; i++) {
      var bg = st.bodyguards[i];
      if (bg.dead) continue;
      if (checkBulletHitsTarget(cam, dir, bg.x, bg.y + 0.8, bg.z, 0.6)) {
        damageBodyguard(bg, PLAYER_DAMAGE);
        return;
      }
    }
    // check boss
    if (st.boss && !st.boss.dead && !st.boss.arrested) {
      if (checkBulletHitsTarget(cam, dir, st.boss.x, st.boss.y + 0.8, st.boss.z, 0.7)) {
        damageBoss(PLAYER_DAMAGE, false);
        return;
      }
    }
    // check destructibles
    for (i = 0; i < st.destructibles.length; i++) {
      var dest = st.destructibles[i];
      if (dest.destroyed) continue;
      if (checkBulletHitsTarget(cam, dir, dest.x, dest.floorY + 1.0, dest.z, 1.2)) {
        damageDestructible(dest);
        return;
      }
    }
    // check glass panels
    for (i = 0; i < st.glassPanels.length; i++) {
      var gp = st.glassPanels[i];
      if (gp.destroyed) continue;
      if (checkBulletHitsTarget(cam, dir, gp.x, gp.mesh.position.y, gp.z, 1.0)) {
        destroyGlassPanel(gp);
        return;
      }
    }
    // check chandeliers (chain)
    for (i = 0; i < st.chandeliers.length; i++) {
      var ch = st.chandeliers[i];
      if (ch.fallen || ch.falling) continue;
      if (checkBulletHitsTarget(cam, dir, ch.x, ch.y + 0.5, ch.z, 0.4)) {
        ch.hp -= PLAYER_DAMAGE;
        if (ch.hp <= 0) {
          ch.falling = true;
          ch.fallTimer = 0;
        }
        return;
      }
    }
  }

  function checkBulletHitsTarget(cam, dir, tx, ty, tz, radius) {
    // Vector from camera to target
    var dx = tx - cam.position.x;
    var dy = ty - cam.position.y;
    var dz = tz - cam.position.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > 40) return false;
    // dot product with direction
    var dot = (dx * dir.x + dy * dir.y + dz * dir.z) / dist;
    if (dot < 0.93) return false; // ~cos(22deg) cone
    // perpendicular distance
    var perpSq = (dx * dx + dy * dy + dz * dz) - (dot * dist) * (dot * dist);
    return perpSq < radius * radius;
  }

  function damageEnemy(enemy, dmg, headshot) {
    enemy.hp -= headshot ? dmg * 2 : dmg;
    makeParticleBurst(enemy.x, enemy.y + 0.8, enemy.z, 0xAA2222, 4);
    if (enemy.hp <= 0) killEnemy(enemy);
  }

  function killEnemy(enemy) {
    enemy.dead = true;
    enemy.deathTimer = 0;
    enemy.body.position.y -= 0.6;
    enemy.body.rotation.z = Math.PI / 2;
    enemy.head.visible = false;
    if (enemy.gun) enemy.gun.visible = false;
    makeParticleBurst(enemy.x, enemy.y, enemy.z, 0xFF3333, 8);
  }

  function damageBodyguard(bg, dmg) {
    bg.hp -= dmg;
    makeParticleBurst(bg.x, bg.y + 0.8, bg.z, 0xAA1111, 4);
    if (bg.hp <= 0) {
      bg.dead = true;
      bg.deathTimer = 0;
      bg.body.position.y -= 0.5;
      bg.body.rotation.z = Math.PI / 2;
      if (bg.head) bg.head.visible = false;
      if (bg.gun) bg.gun.visible = false;
      makeParticleBurst(bg.x, bg.y, bg.z, 0xFF2222, 8);
    }
  }

  function damageBoss(dmg, gunhand) {
    if (gunhand) {
      // shoot gun hand — boss drops detonator
      st.boss.detonatorActive = false;
      if (st.bombActive) {
        st.bombActive = false;
        st.bossDetonatorActive = false;
        showPrompt('DETONATOR DESTROYED — BOMB DISARMED!');
      }
      st.boss.det.visible = false;
    }
    st.boss.hp -= dmg;
    makeParticleBurst(st.boss.x, st.boss.y + 0.8, st.boss.z, 0xCC1111, 5);
    if (st.boss.hp <= 0) {
      st.boss.dead = true;
      st.bossNeutralized = true;
      st.bombActive = false;
      st.boss.body.position.y -= 0.7;
      st.boss.body.rotation.z = Math.PI / 2;
      if (st.boss.head) st.boss.head.visible = false;
      makeParticleBurst(st.boss.x, st.boss.y, st.boss.z, 0xFF3300, 12);
    }
  }

  function tryNonLethal() {
    if (!st.boss || st.boss.dead || st.boss.arrested) return;
    var cam = getCamera();
    if (!cam) return;
    var d = dist3D({ x: st.boss.x, y: st.boss.y, z: st.boss.z }, cam.position);
    if (d < 3) {
      st.boss.arrested = true;
      st.bossArrested = true;
      st.bombActive = false;
      st.bossDetonatorActive = false;
      // visual: put boss on ground, cuffed
      st.boss.body.rotation.z = Math.PI / 2;
      st.boss.body.position.y -= 0.5;
      if (st.boss.head) st.boss.head.position.y -= 0.5;
      if (st.boss.det) st.boss.det.visible = false;
      makeParticleBurst(st.boss.x, st.boss.y, st.boss.z, COL_SAFE_ZONE, 10);
      showPrompt('DON VERANO ARRESTED!');
    }
  }

  function hitPlayer(dmg) {
    st.playerHP -= Math.floor(dmg);
    st.playerHP = Math.max(0, st.playerHP);
    // red flash
    flashScreen('#FF000040');
  }

  function flashScreen(color) {
    var flash = document.createElement('div');
    flash.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:' + color, 'pointer-events:none', 'z-index:8999'
    ].join(';');
    document.body.appendChild(flash);
    setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 120);
  }

  // ─── Destructibles ────────────────────────────────────────────────────────────
  function damageDestructible(dest) {
    dest.hp -= PLAYER_DAMAGE;
    makeParticleBurst(dest.x, dest.floorY + 1.0, dest.z, 0xAA8844, 5);
    if (dest.hp <= 0) destroyDestructible(dest);
  }

  function destroyDestructible(dest) {
    if (dest.destroyed) return;
    dest.destroyed = true;
    addDamage(dest.cost);
    var scene = getScene();
    if (scene) scene.remove(dest.mesh);
    if (dest.extras) {
      var i;
      for (i = 0; i < dest.extras.length; i++) {
        if (scene) scene.remove(dest.extras[i]);
      }
    }
    makeParticleBurst(dest.x, dest.floorY + 1.0, dest.z, 0xFF9922, 10);

    // slot machine chain reaction
    if (dest.type === 'slot_machine' && dest.chain) {
      triggerSlotChain(dest.x, dest.z, 4.5);
    }
    // roulette scatter
    if (dest.type === 'roulette_table') {
      triggerRouletteScatter(dest.x, dest.z);
    }
  }

  function triggerSlotChain(x, z, radius) {
    var i, dest;
    for (i = 0; i < st.destructibles.length; i++) {
      dest = st.destructibles[i];
      if (!dest.destroyed && dest.type === 'slot_machine') {
        var dd = dist2D(x, z, dest.x, dest.z);
        if (dd < radius && dd > 0.1) {
          // delayed chain reaction
          (function (d) {
            setTimeout(function () { destroyDestructible(d); }, rnd(100, 400));
          })(dest);
        }
      }
    }
  }

  function triggerRouletteScatter(x, z) {
    var i;
    for (i = 0; i < st.rouletteTables.length; i++) {
      var rt = st.rouletteTables[i];
      if (dist2D(x, z, rt.x, rt.z) < 0.5) {
        rt.spinning = true;
        rt.spinSpeed = rnd(5, 12);
      }
    }
    // chip scatter particles
    makeParticleBurst(x, z + 1.0, z, COL_CHIP, 15);
  }

  function destroyGlassPanel(gp) {
    if (gp.destroyed) return;
    gp.destroyed = true;
    addDamage(gp.cost);
    var scene = getScene();
    if (scene) { scene.remove(gp.mesh); scene.remove(gp.ls); }
    makeParticleBurst(gp.x, gp.mesh.position.y, gp.z, COL_GLASS, 12);
  }

  function crushEnemiesUnder(cx, cz, r) {
    var i;
    for (i = 0; i < st.enemies.length; i++) {
      var enemy = st.enemies[i];
      if (!enemy.dead && dist2D(cx, cz, enemy.x, enemy.z) < r) {
        damageEnemy(enemy, 999, false);
      }
    }
    for (i = 0; i < st.bodyguards.length; i++) {
      var bg = st.bodyguards[i];
      if (!bg.dead && dist2D(cx, cz, bg.x, bg.z) < r) {
        damageBodyguard(bg, 999);
      }
    }
  }

  // ─── Hostage Execution ────────────────────────────────────────────────────────
  function executeRandomHostage() {
    var alive = [];
    var i;
    for (i = 0; i < st.hostages.length; i++) {
      var h = st.hostages[i];
      if (!h.executed && !h.safe && !h.following && !h.rescued) alive.push(h);
    }
    if (alive.length === 0) return;
    var victim = alive[Math.floor(Math.random() * alive.length)];
    executeHostage(victim);
  }

  function executeBossTriggeredHostages(count) {
    var alive = [];
    var i;
    for (i = 0; i < st.hostages.length; i++) {
      var h = st.hostages[i];
      if (!h.executed && !h.safe && !h.following && !h.rescued) alive.push(h);
    }
    for (i = 0; i < Math.min(count, alive.length); i++) {
      executeHostage(alive[i]);
    }
  }

  function executeHostage(h) {
    h.executed = true;
    st.hostagesExecuted++;
    var scene = getScene();
    if (scene) {
      scene.remove(h.body);
      scene.remove(h.head);
      scene.remove(h.hands);
    }
    makeParticleBurst(h.x, h.y + 0.5, h.z, 0xFF2222, 8);
    flashScreen('#FF000060');
  }

  function removeSafeHostageMeshes(h) {
    var scene = getScene();
    if (!scene) return;
    scene.remove(h.body);
    scene.remove(h.head);
    scene.remove(h.hands);
  }

  function removeEnemyMeshes(enemy) {
    var scene = getScene();
    if (!scene) return;
    scene.remove(enemy.body);
    scene.remove(enemy.head);
    if (enemy.gun) scene.remove(enemy.gun);
    enemy.deathTimer = -9999;
  }

  function removeBodyguardMeshes(bg) {
    var scene = getScene();
    if (!scene) return;
    scene.remove(bg.body);
    if (bg.head) scene.remove(bg.head);
    if (bg.gun) scene.remove(bg.gun);
    bg.deathTimer = -9999;
  }

  // ─── Particles ────────────────────────────────────────────────────────────────
  function makeParticleBurst(x, y, z, col, count) {
    var scene = getScene();
    if (!scene) return;
    var i;
    for (i = 0; i < count; i++) {
      var geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      var mat = new THREE.MeshLambertMaterial({ color: col });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      st.particles.push({
        mesh: mesh,
        vx: rnd(-3, 3), vy: rnd(2, 6), vz: rnd(-3, 3),
        life: rnd(0.4, 1.0)
      });
    }
  }

  function spawnBulletTracer(x1, y1, z1, x2, y2, z2) {
    var scene = getScene();
    if (!scene) return;
    var pts = [
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(x2, y2, z2)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0xFFFF88 });
    var line = new THREE.Line(geo, mat);
    scene.add(line);
    st.particles.push({
      mesh: line,
      vx: 0, vy: 0, vz: 0,
      life: 0.08
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  function init() {
    var kd = function (e) {
      var k = e.code || e.key;
      if (k === 'KeyC') { st.cDown = true; st.cDownTime = Date.now(); }
      if (k === 'KeyS') { st.sDown = true; st.sDownTime = Date.now(); }
      if (st.cDown && st.sDown && !st.active) {
        var diff = Math.abs(st.cDownTime - st.sDownTime);
        if (diff < ACTIVATION_WINDOW) activate();
      }
    };
    var ku = function (e) {
      var k = e.code || e.key;
      if (k === 'KeyC') st.cDown = false;
      if (k === 'KeyS') st.sDown = false;
    };
    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);
    st._preActivateKD = kd;
    st._preActivateKU = ku;
  }

  function reset() {
    if (st.animId) { cancelAnimationFrame(st.animId); st.animId = null; }
    detachListeners();
    var scene = getScene();
    if (scene) {
      // remove enemies
      var i;
      for (i = 0; i < st.enemies.length; i++) {
        scene.remove(st.enemies[i].body);
        scene.remove(st.enemies[i].head);
        if (st.enemies[i].gun) scene.remove(st.enemies[i].gun);
      }
      for (i = 0; i < st.bodyguards.length; i++) {
        scene.remove(st.bodyguards[i].body);
        if (st.bodyguards[i].head) scene.remove(st.bodyguards[i].head);
        if (st.bodyguards[i].gun) scene.remove(st.bodyguards[i].gun);
      }
      for (i = 0; i < st.hostages.length; i++) {
        scene.remove(st.hostages[i].body);
        scene.remove(st.hostages[i].head);
        scene.remove(st.hostages[i].hands);
      }
      for (i = 0; i < st.particles.length; i++) {
        scene.remove(st.particles[i].mesh);
      }
      if (st.boss) {
        scene.remove(st.boss.body);
        if (st.boss.head) scene.remove(st.boss.head);
        if (st.boss.det) scene.remove(st.boss.det);
      }
      if (st.gunMesh) scene.remove(st.gunMesh);
      if (st.ambientLight) scene.remove(st.ambientLight);
      if (st.dirLight) scene.remove(st.dirLight);
    }

    // remove HUD
    if (st.hudEl && st.hudEl.parentNode) st.hudEl.parentNode.removeChild(st.hudEl);
    if (st.promptEl && st.promptEl.parentNode) st.promptEl.parentNode.removeChild(st.promptEl);
    if (st.endEl && st.endEl.parentNode) st.endEl.parentNode.removeChild(st.endEl);
    if (st.briefEl && st.briefEl.parentNode) st.briefEl.parentNode.removeChild(st.briefEl);

    // reset state fields
    st.active = false;
    st.enemies = [];
    st.bodyguards = [];
    st.hostages = [];
    st.destructibles = [];
    st.glassPanels = [];
    st.chandeliers = [];
    st.stairwellZones = [];
    st.stairwells = [];
    st.rouletteTables = [];
    st.particles = [];
    st.boss = null;
    st.hudEl = null;
    st.promptEl = null;
    st.endEl = null;
    st.briefEl = null;
    st.gunMesh = null;
    st.floorGroups = [];
    st.floorMeshes = [];
    st.missionFailed = false;
    st.missionWon = false;
    st.bossArrested = false;
    st.bossNeutralized = false;
    st.bossSeen = false;
    st.bombActive = false;
    st.bombTimer = 0;
    st.bossDetonatorActive = false;
    st.hostagesRescued = 0;
    st.hostagesExecuted = 0;
    st.propertyDamage = 0;
    st.elapsed = 0;
    st.execTimer = EXEC_INTERVAL;
    st.playerHP = PLAYER_HP_MAX;
    st.pointerLocked = false;

    // re-attach pre-activation listeners
    if (st._preActivateKD) document.addEventListener('keydown', st._preActivateKD);
    if (st._preActivateKU) document.addEventListener('keyup', st._preActivateKU);
  }

  return { init: init, update: update, reset: reset };
}());
