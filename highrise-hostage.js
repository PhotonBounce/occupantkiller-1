// ============================================================
//  highrise-hostage.js — Highrise Hostage FPS Module
//  Features:
//    1. H+H simultaneous keypress (within 400ms) to activate
//    2. 20-floor skyscraper, floor-by-floor clearance
//    3. 50 mercenaries (2-4/floor), 60 hostages (3/floor), CEO on floor 20
//    4. 15-minute countdown; helicopter arrives at 5-min mark
//    5. Rappel mechanic, rope LineSegments, window breach
//    6. E key to free hostages (2s), breach doors, non-lethal takedown
//    7. Alarm system: 30s before executioner kills hostage on that floor
//    8. Silenced approach prevents alarm
//    9. Mercenary leader (floor 20): 500HP, CEO hostage at knifepoint
//   10. HUD: FLOOR / HOSTAGES / TIMER / CEO STATUS / HELICOPTER STATUS
//  Public API: init, update, reset
// ============================================================
window.HighriseHostage = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── Constants ────────────────────────────────────────────────
  var TOTAL_FLOORS         = 20;
  var FLOOR_WIDTH          = 20;
  var FLOOR_HEIGHT         = 3;
  var FLOOR_DEPTH          = 20;
  var FLOOR_GAP            = 0;          // floors stack flush
  var TOTAL_MERCENARIES    = 50;
  var TOTAL_HOSTAGES       = 60;
  var HOSTAGES_PER_FLOOR   = 3;
  var MISSION_TIME         = 900;        // 15 minutes in seconds
  var HELI_ARRIVE_TIME     = 300;        // 5 minutes
  var ALARM_EXECUTE_DELAY  = 30;         // seconds after alarm before execution
  var RESCUE_TIME          = 2;          // seconds to free hostage
  var BREACH_TIME          = 1;          // seconds to breach door
  var FLOOR_CLEAR_RANGE    = 22;         // range considered "on floor"
  var RAPPEL_MIDPOINT      = 10;         // can rappel directly to floor 10
  var FASTROP_FLOOR        = 18;         // helicopter fast-rope floor

  // Colors
  var COLOR_FLOOR          = 0x445566;
  var COLOR_SHAFT          = 0x334455;
  var COLOR_STAIRWELL      = 0x334455;
  var COLOR_GLASS          = 0x88AACC;
  var COLOR_HELIPAD        = 0x445544;
  var COLOR_MERC           = 0x334444;
  var COLOR_MERC_ELITE     = 0x222233;
  var COLOR_MERC_LEADER    = 0x221133;
  var COLOR_HELI_BODY      = 0x333344;
  var COLOR_HOSTAGE        = 0xFF8800;
  var COLOR_HOSTAGE_SKIN   = 0xF5C5A3;
  var COLOR_DESK           = 0x8B5E3C;
  var COLOR_ROPE           = 0xAA9977;
  var COLOR_SNIPER_PERCH   = 0x446655;
  var COLOR_FREED          = 0x00FF88;
  var COLOR_CEIL           = 0x556677;
  var COLOR_ROTOR          = 0x555566;
  var COLOR_ALARM_FLASH    = 0xFF2200;
  var COLOR_CEO            = 0x3399FF;

  // ── State ────────────────────────────────────────────────────
  var active           = false;
  var scene            = null;
  var camera           = null;
  var renderer         = null;
  var clock            = null;

  var rootGroup        = null;
  var floorGroups      = [];       // array[20] of THREE.Group
  var floorMeshes      = [];       // floor slab meshes

  var mercenaries      = [];       // { mesh, hp, floor, state, pos, patrol, alarmTimer, isElite, isSniper, isLeader }
  var hostages         = [];       // { mesh, floor, freed, beingRescued, rescueTimer, executioner, alive }
  var ceo              = null;     // hostage object
  var helicopter       = null;     // { group, alive, landed, gunFired, rotorMesh }
  var ropes            = [];       // LineSegments for rappel

  var player           = null;     // { pos, vel, floor, hp, onRappel, rappelY, silenced, ammo, grenades }
  var playerMesh       = null;

  var gameTimer        = 0;        // counts down from MISSION_TIME
  var missionActive    = false;
  var missionWon       = false;
  var missionFailed    = false;
  var failReason       = '';

  var currentFloor     = 1;       // 1-indexed
  var hostagesFreed    = 0;
  var heliArrived      = false;
  var heliDestroyed    = false;
  var heliLanded       = false;
  var ceoDead          = false;
  var leaderArrested   = false;
  var leaderDead       = false;

  var floorsCleared    = [];      // bool[20]
  var floorAlarms      = [];      // { active, timer, executionDone } per floor
  var floorAlarmFlash  = [];      // flash timers

  var keys             = {};
  var keyTimes         = {};      // for H+H detection
  var lastHPress       = -Infinity;
  var activationPhase  = false;

  // Interaction state
  var interactTarget   = null;    // current E-key target
  var interactTimer    = 0;
  var interactType     = '';      // 'rescue', 'breach', 'arrest'
  var interactDoor     = null;

  // HUD
  var hudEl            = null;
  var overlayEl        = null;

  // Rappel state
  var rappelActive     = false;
  var rappelRope       = null;
  var rappelTargetFloor= 0;
  var rappelT          = 0;

  // Camera angles
  var yaw              = 0;
  var pitch            = 0;
  var pointerLocked    = false;

  // Shooting
  var shootCooldown    = 0;
  var SHOOT_RATE       = 0.1;
  var PLAYER_SPEED     = 8;
  var PLAYER_HP        = 100;
  var GRAVITY          = -20;
  var JUMP_VEL         = 10;
  var onGround         = false;

  // Doors
  var doors            = [];       // { mesh, floor, breached, beingBreached, breachTimer }

  // Sniper perches
  var sniperPerches    = [];

  // ── Utility ──────────────────────────────────────────────────
  function floorY(f) {
    // f is 1-indexed; returns world Y of floor top surface center
    return (f - 1) * (FLOOR_HEIGHT + FLOOR_GAP) + FLOOR_HEIGHT * 0.5;
  }

  function floorSurfaceY(f) {
    return (f - 1) * (FLOOR_HEIGHT + FLOOR_GAP) + FLOOR_HEIGHT;
  }

  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  function randInt(a, b) {
    return Math.floor(a + Math.random() * (b - a + 1));
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function formatTime(s) {
    var mm = Math.floor(s / 60);
    var ss = Math.floor(s % 60);
    return (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function makeBox(w, h, d, color, opacity) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var opts = { color: color };
    if (opacity !== undefined && opacity < 1) {
      opts.transparent = true;
      opts.opacity     = opacity;
    }
    var mat  = new THREE.MeshLambertMaterial(opts);
    return new THREE.Mesh(geo, mat);
  }

  function makeCyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeLine(pts, color) {
    var geo = new THREE.BufferGeometry();
    var arr = [];
    for (var i = 0; i < pts.length; i++) {
      arr.push(pts[i].x, pts[i].y, pts[i].z);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    var mat = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
    return mat;
  }

  // ── Building Construction ────────────────────────────────────

  function buildTower() {
    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Central elevator shaft
    var shaft = makeCyl(2, 2, TOTAL_FLOORS * (FLOOR_HEIGHT + FLOOR_GAP), 16, COLOR_SHAFT);
    shaft.position.set(0, (TOTAL_FLOORS * FLOOR_HEIGHT) / 2, 0);
    rootGroup.add(shaft);

    for (var f = 1; f <= TOTAL_FLOORS; f++) {
      var fg = new THREE.Group();
      fg.position.y = 0;
      rootGroup.add(fg);
      floorGroups.push(fg);
      buildFloor(f, fg);
    }

    // Roof helipad
    var roofY = floorSurfaceY(TOTAL_FLOORS);
    var helipad = makeBox(10, 0.3, 10, COLOR_HELIPAD);
    helipad.position.set(0, roofY + 0.15, 0);
    rootGroup.add(helipad);

    // Helipad markings (H cross)
    var hBar1 = makeBox(6, 0.05, 1, 0xFFFFFF);
    hBar1.position.set(0, roofY + 0.31, 0);
    rootGroup.add(hBar1);
    var hBar2 = makeBox(1, 0.05, 6, 0xFFFFFF);
    hBar2.position.set(0, roofY + 0.31, 0);
    rootGroup.add(hBar2);

    // Ground plane
    var ground = makeBox(60, 0.5, 60, 0x334433);
    ground.position.set(0, -0.25, 0);
    rootGroup.add(ground);

    // Ambient light
    var amb = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(amb);
    var dir = new THREE.DirectionalLight(0xFFEECC, 0.8);
    dir.position.set(20, 40, 20);
    scene.add(dir);
  }

  function buildFloor(f, fg) {
    var sy = floorY(f);
    var surf = floorSurfaceY(f);

    // Floor slab
    var slab = makeBox(FLOOR_WIDTH, FLOOR_HEIGHT, FLOOR_DEPTH, COLOR_FLOOR);
    slab.position.set(0, sy, 0);
    fg.add(slab);
    floorMeshes.push(slab);

    // Ceiling
    var ceil = makeBox(FLOOR_WIDTH, 0.2, FLOOR_DEPTH, COLOR_CEIL);
    ceil.position.set(0, surf, 0);
    fg.add(ceil);

    // Corner stairwells (4 corners)
    var cornerOffsets = [
      { x: -8, z: -8 }, { x: 8, z: -8 },
      { x: -8, z:  8 }, { x: 8, z:  8 }
    ];
    for (var c = 0; c < cornerOffsets.length; c++) {
      var sw = makeBox(3, FLOOR_HEIGHT, 3, COLOR_STAIRWELL);
      sw.position.set(cornerOffsets[c].x, sy, cornerOffsets[c].z);
      fg.add(sw);
    }

    // Exterior glass windows — 4 faces, 2 panels each
    addWindows(f, fg, sy);

    // Interior theme props
    addFloorProps(f, fg, surf);

    // Doors at stairwell entrances (each floor has 2 doors)
    addDoors(f, fg, surf);
  }

  function addWindows(f, fg, sy) {
    var h = FLOOR_HEIGHT * 0.6;
    var w = 4;
    var offsets = [
      // North face
      [{ x: -5, z: -10 }, { x: 5, z: -10 }, { rx: 0, ry: 0 }],
      // South face
      [{ x: -5, z:  10 }, { x: 5, z: 10  }, { rx: 0, ry: Math.PI }],
      // East face
      [{ x: 10, z: -5  }, { x: 10, z: 5  }, { rx: 0, ry: Math.PI * 0.5 }],
      // West face
      [{ x: -10, z: -5 }, { x: -10, z: 5 }, { rx: 0, ry: -Math.PI * 0.5 }]
    ];
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 2; j++) {
        var gp = makeBox(w, h, 0.15, COLOR_GLASS, 0.35);
        gp.position.set(offsets[i][j].x, sy, offsets[i][j].z);
        fg.add(gp);
      }
    }
  }

  function addFloorProps(f, fg, surf) {
    // WOOD desk areas — 3 per floor for hostage clusters
    var deskPositions = [
      { x: -5, z: -5 }, { x: 0, z: 3 }, { x: 5, z: -3 }
    ];
    for (var d = 0; d < 3; d++) {
      var desk = makeBox(2, 0.6, 1, COLOR_DESK);
      desk.position.set(deskPositions[d].x, surf + 0.3, deskPositions[d].z);
      fg.add(desk);
      // Chair
      var chair = makeBox(0.8, 0.4, 0.8, 0x4A3728);
      chair.position.set(deskPositions[d].x, surf + 0.2, deskPositions[d].z + 1.2);
      fg.add(chair);
    }

    // Theme-specific props
    if (f >= 6 && f <= 10) {
      // Server room: server racks
      for (var r = 0; r < 3; r++) {
        var rack = makeBox(1.5, 2.0, 0.8, 0x1A2233);
        rack.position.set(-6 + r * 2.5, surf + 1.0, -6);
        fg.add(rack);
        // Blinking status indicator
        var led = makeBox(0.1, 0.1, 0.1, 0x00FF00);
        led.position.set(-6 + r * 2.5, surf + 1.6, -5.55);
        fg.add(led);
      }
    } else if (f >= 11 && f <= 15) {
      // Executive suites: larger desks, conference table
      var confTable = makeBox(6, 0.5, 2, 0x5C3D1A);
      confTable.position.set(0, surf + 0.25, 0);
      fg.add(confTable);
    } else if (f >= 16 && f <= 19) {
      // Penthouse prep: barriers, crates
      for (var b = 0; b < 4; b++) {
        var crate = makeBox(1.2, 1.2, 1.2, 0x553322);
        crate.position.set(-4 + b * 2.5, surf + 0.6, randRange(-3, 3));
        fg.add(crate);
      }
    } else if (f === 20) {
      // Penthouse: fancy floor, center throne area
      var throne = makeBox(1.5, 0.8, 1.5, 0x332244);
      throne.position.set(0, surf + 0.4, 0);
      fg.add(throne);
    }
  }

  function addDoors(f, fg, surf) {
    // Two doors per floor on east and west stairwell sides
    var doorPositions = [
      { x: -6.5, z: -8, ry: 0 },
      { x:  6.5, z:  8, ry: Math.PI }
    ];
    for (var d = 0; d < doorPositions.length; d++) {
      var dm = makeBox(1.5, 2.2, 0.15, 0x6B4226);
      dm.position.set(doorPositions[d].x, surf - 1.1, doorPositions[d].z);
      dm.rotation.y = doorPositions[d].ry;
      fg.add(dm);
      doors.push({
        mesh:         dm,
        floor:        f,
        breached:     false,
        beingBreached:false,
        breachTimer:  0,
        origPos:      { x: doorPositions[d].x, z: doorPositions[d].z }
      });
    }
  }

  // ── Mercenary Spawning ───────────────────────────────────────

  function spawnMercenaries() {
    // Per-floor count distribution: 2-4 per floor totaling 50
    var counts = [];
    var placed = 0;
    for (var f = 1; f <= TOTAL_FLOORS; f++) {
      var min = 2, max = (f >= 17) ? 4 : (f >= 11) ? 3 : 2;
      var c = (placed + (TOTAL_FLOORS - f) * min < TOTAL_MERCENARIES - max)
              ? max : min;
      // Adjust for exact total
      if (f === TOTAL_FLOORS) { c = TOTAL_MERCENARIES - placed; }
      counts.push(c);
      placed += c;
    }
    // Normalize
    placed = 0;
    for (var fi = 0; fi < TOTAL_FLOORS; fi++) {
      placed += counts[fi];
    }
    if (placed !== TOTAL_MERCENARIES) {
      counts[TOTAL_FLOORS - 1] += TOTAL_MERCENARIES - placed;
    }

    var mercId = 0;
    for (var f = 1; f <= TOTAL_FLOORS; f++) {
      var cnt = counts[f - 1];
      for (var m = 0; m < cnt; m++) {
        spawnMerc(f, mercId, m, cnt);
        mercId++;
      }
    }

    // 3 snipers on exterior window ledges
    spawnSnipers();

    // Mercenary leader on floor 20
    spawnLeader();
  }

  function spawnMerc(floor, id, idx, cnt) {
    var isElite   = floor >= 17;
    var color     = isElite ? COLOR_MERC_ELITE : COLOR_MERC;
    var hp        = isElite ? 130 : 80;
    var surf      = floorSurfaceY(floor);

    // Body
    var body      = makeBox(0.8, 1.4, 0.8, color);
    var head      = makeSphere(0.35, COLOR_HOSTAGE_SKIN);
    head.position.y = 0.9;
    body.add(head);

    // Weapon indicator
    var gun       = makeBox(0.15, 0.15, 0.9, 0x222222);
    gun.position.set(0.45, 0.3, -0.4);
    body.add(gun);

    var angle     = (idx / cnt) * Math.PI * 2;
    var radius    = 3 + Math.random() * 3;
    body.position.set(
      Math.cos(angle) * radius,
      surf + 0.7,
      Math.sin(angle) * radius
    );

    rootGroup.add(body);

    // Patrol waypoints
    var waypoints = [];
    for (var w = 0; w < 4; w++) {
      waypoints.push({
        x: randRange(-8, 8),
        z: randRange(-8, 8)
      });
    }

    mercenaries.push({
      id:           id,
      mesh:         body,
      hp:           hp,
      maxHp:        hp,
      floor:        floor,
      state:        'patrol',    // patrol, alert, chase, attack, dead, arrested
      patrolIdx:    0,
      waypoints:    waypoints,
      alarmTimer:   0,
      isElite:      isElite,
      isSniper:     false,
      isLeader:     false,
      detectRange:  isElite ? 14 : 10,
      speed:        isElite ? 4.5 : 3.5,
      shootTimer:   0,
      shootRate:    isElite ? 0.6 : 1.0,
      alive:        true
    });
  }

  function spawnSnipers() {
    var positions = [
      { floor: 5,  x:  11, z:   0 },
      { floor: 12, x: -11, z:   5 },
      { floor: 18, x:   5, z: -11 }
    ];
    for (var s = 0; s < positions.length; s++) {
      var p     = positions[s];
      var surf  = floorSurfaceY(p.floor);
      // Perch cylinder
      var perch = makeCyl(0.5, 0.5, 0.8, 8, COLOR_SNIPER_PERCH);
      perch.position.set(p.x, surf + 0.4, p.z);
      rootGroup.add(perch);
      sniperPerches.push(perch);

      // Sniper body
      var body  = makeBox(0.8, 1.4, 0.8, 0x445544);
      var head  = makeSphere(0.35, COLOR_HOSTAGE_SKIN);
      head.position.y = 0.9;
      body.add(head);
      body.position.set(p.x, surf + 1.5, p.z);
      rootGroup.add(body);

      mercenaries.push({
        id:           mercenaries.length,
        mesh:         body,
        hp:           150,
        maxHp:        150,
        floor:        p.floor,
        state:        'snipe',
        patrolIdx:    0,
        waypoints:    [{ x: p.x, z: p.z }],
        alarmTimer:   0,
        isElite:      false,
        isSniper:     true,
        isLeader:     false,
        detectRange:  25,
        speed:        0,
        shootTimer:   0,
        shootRate:    2.5,
        alive:        true
      });
    }
  }

  function spawnLeader() {
    var surf  = floorSurfaceY(20);
    var body  = makeBox(1.0, 1.6, 1.0, COLOR_MERC_LEADER);
    var head  = makeSphere(0.4, COLOR_HOSTAGE_SKIN);
    head.position.y = 1.0;
    body.add(head);
    // Dual pistols
    var p1    = makeBox(0.1, 0.1, 0.5, 0x111111);
    p1.position.set(-0.55, 0.2, -0.25);
    body.add(p1);
    var p2    = makeBox(0.1, 0.1, 0.5, 0x111111);
    p2.position.set(0.55, 0.2, -0.25);
    body.add(p2);
    body.position.set(0, surf + 0.8, -3);
    rootGroup.add(body);

    mercenaries.push({
      id:           mercenaries.length,
      mesh:         body,
      hp:           500,
      maxHp:        500,
      floor:        20,
      state:        'guard',
      patrolIdx:    0,
      waypoints:    [{ x: 0, z: -3 }],
      alarmTimer:   0,
      isElite:      true,
      isSniper:     false,
      isLeader:     true,
      detectRange:  15,
      speed:        5,
      shootTimer:   0,
      shootRate:    0.4,
      alive:        true
    });
  }

  // ── Hostage Spawning ─────────────────────────────────────────

  function spawnHostages() {
    var deskPositions = [
      { x: -5, z: -5 }, { x: 0, z: 3 }, { x: 5, z: -3 }
    ];

    for (var f = 1; f <= TOTAL_FLOORS; f++) {
      for (var h = 0; h < HOSTAGES_PER_FLOOR; h++) {
        var surf = floorSurfaceY(f);
        var dp   = deskPositions[h];
        var isCEOFloor = (f === 20 && h === 1);

        // Hostage body
        var color = isCEOFloor ? COLOR_CEO : COLOR_HOSTAGE;
        var body  = makeBox(0.7, 1.3, 0.7, color);
        var head  = makeSphere(0.3, COLOR_HOSTAGE_SKIN);
        head.position.y = 0.8;
        body.add(head);
        // Tied-wrists indicator
        var ties  = makeBox(0.3, 0.1, 0.1, 0xCC2200);
        ties.position.set(0, 0.0, 0.45);
        body.add(ties);

        body.position.set(dp.x + randRange(-0.5, 0.5), surf + 0.65, dp.z + randRange(-0.5, 0.5));
        rootGroup.add(body);

        var ho = {
          id:           hostages.length,
          mesh:         body,
          floor:        f,
          freed:        false,
          beingRescued: false,
          rescueTimer:  0,
          executioner:  null,
          alive:        true,
          isCEO:        isCEOFloor,
          origColor:    color
        };

        if (isCEOFloor) { ceo = ho; }
        hostages.push(ho);
      }
    }
  }

  // ── Helicopter ───────────────────────────────────────────────

  function spawnHelicopter() {
    var hg    = new THREE.Group();
    var roofY = floorSurfaceY(TOTAL_FLOORS) + 10;

    // Body
    var hBody = makeBox(6, 2, 3, COLOR_HELI_BODY);
    hg.add(hBody);
    // Tail boom
    var tail  = makeBox(4, 0.8, 0.8, 0x333344);
    tail.position.set(4.5, 0.2, 0);
    hg.add(tail);
    // Main rotor
    var rotorHub = makeCyl(0.3, 0.3, 0.3, 6, 0x222222);
    rotorHub.position.y = 1.2;
    hg.add(rotorHub);
    var rotorBar = makeBox(7, 0.1, 0.3, COLOR_ROTOR);
    rotorBar.position.y = 1.35;
    hg.add(rotorBar);
    var rotorBar2 = makeBox(0.3, 0.1, 7, COLOR_ROTOR);
    rotorBar2.position.y = 1.45;
    hg.add(rotorBar2);
    // Tail rotor
    var tailRotor = makeCyl(0.5, 0.5, 0.15, 6, COLOR_ROTOR);
    tailRotor.position.set(6.5, 0.5, 0.5);
    tailRotor.rotation.z = Math.PI * 0.5;
    hg.add(tailRotor);
    // Mounted gun
    var gun   = makeBox(0.3, 0.3, 2, 0x111111);
    gun.position.set(0, -0.8, -2.2);
    hg.add(gun);
    // Skids
    var skidL = makeBox(4, 0.2, 0.2, 0x444455);
    skidL.position.set(0, -1.2, -1.2);
    hg.add(skidL);
    var skidR = makeBox(4, 0.2, 0.2, 0x444455);
    skidR.position.set(0, -1.2, 1.2);
    hg.add(skidR);

    hg.position.set(30, roofY + 5, 0);
    scene.add(hg);

    helicopter = {
      group:     hg,
      rotorMesh: rotorBar,
      alive:     true,
      landed:    false,
      approach:  true,
      gunTimer:  0,
      gunRate:   2.0
    };
  }

  // ── Player Setup ─────────────────────────────────────────────

  function initPlayer() {
    player = {
      pos:        new THREE.Vector3(0, floorSurfaceY(1) + 0.9, 8),
      vel:        new THREE.Vector3(0, 0, 0),
      floor:      1,
      hp:         PLAYER_HP,
      silenced:   true,
      ammo:       120,
      grenades:   3,
      onRappel:   false
    };

    // Simple player capsule mesh
    playerMesh = makeBox(0.6, 1.6, 0.6, 0x4488AA);
    playerMesh.position.copy(player.pos);
    scene.add(playerMesh);

    // Camera positioned at eye level
    camera.position.copy(player.pos);
    camera.position.y += 0.6;
  }

  // ── Rappel System ────────────────────────────────────────────

  function startRappel(targetFloor) {
    if (rappelActive) { return; }
    rappelActive      = true;
    rappelTargetFloor = targetFloor;
    rappelT           = 0;
    player.onRappel   = true;

    // Draw rope as LineSegments
    var startY = player.pos.y;
    var endY   = floorSurfaceY(targetFloor) + 1;
    var ropeGeo = new THREE.BufferGeometry();
    var pts     = new Float32Array([
      player.pos.x, startY, player.pos.z,
      player.pos.x, endY,   player.pos.z
    ]);
    ropeGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: COLOR_ROPE });
    rappelRope  = new THREE.LineSegments(ropeGeo, ropeMat);
    scene.add(rappelRope);
    ropes.push(rappelRope);

    showMessage('RAPPELING TO FLOOR ' + targetFloor + '...');
  }

  function updateRappel(dt) {
    if (!rappelActive) { return; }
    rappelT += dt * 3.0;
    var targetY = floorSurfaceY(rappelTargetFloor) + 0.9;
    player.pos.y = THREE.MathUtils
      ? THREE.MathUtils.lerp(player.pos.y, targetY, dt * 3)
      : player.pos.y + (targetY - player.pos.y) * dt * 3;

    if (Math.abs(player.pos.y - targetY) < 0.2) {
      player.pos.y  = targetY;
      rappelActive  = false;
      player.onRappel = false;
      currentFloor  = rappelTargetFloor;
      player.floor  = rappelTargetFloor;
      scene.remove(rappelRope);
    }
  }

  // ── Input ────────────────────────────────────────────────────

  function onKeyDown(e) {
    keys[e.code] = true;
    keyTimes[e.code] = performance.now();

    // Activation: H+H within 400ms
    if (e.code === 'KeyH') {
      var now = performance.now();
      if (now - lastHPress < 400) {
        if (!active) { activate(); }
      }
      lastHPress = now;
    }

    if (!active || !missionActive) { return; }

    // Interact / Breach / Arrest
    if (e.code === 'KeyE') {
      beginInteraction();
    }
    // Rappel to floor 10 (from outside)
    if (e.code === 'KeyR' && !rappelActive) {
      if (currentFloor === 1) { startRappel(RAPPEL_MIDPOINT); }
    }
    // Jump
    if ((e.code === 'Space') && onGround) {
      player.vel.y = JUMP_VEL;
      onGround     = false;
    }
    // Grenade
    if (e.code === 'KeyG' && player.grenades > 0) {
      throwGrenade();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!pointerLocked) { return; }
    yaw   -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch  = clamp(pitch, -Math.PI * 0.4, Math.PI * 0.4);
  }

  function onMouseDown(e) {
    if (!active || !missionActive) { return; }
    if (e.button === 0) { shoot(); }
  }

  function onPointerLock() {
    pointerLocked = (document.pointerLockElement === renderer.domElement);
  }

  // ── Interaction ──────────────────────────────────────────────

  function beginInteraction() {
    // Check doors first
    for (var d = 0; d < doors.length; d++) {
      var door = doors[d];
      if (door.breached) { continue; }
      var dp   = door.mesh.position;
      if (dist3(player.pos, dp) < 3) {
        door.beingBreached = true;
        door.breachTimer   = 0;
        interactTarget     = door;
        interactType       = 'breach';
        showMessage('BREACHING DOOR... [HOLD E]');
        return;
      }
    }
    // Check hostages
    for (var h = 0; h < hostages.length; h++) {
      var ho = hostages[h];
      if (ho.freed || !ho.alive) { continue; }
      if (dist3(player.pos, ho.mesh.position) < 2.5) {
        ho.beingRescued = true;
        ho.rescueTimer  = 0;
        interactTarget  = ho;
        interactType    = 'rescue';
        showMessage('FREEING HOSTAGE... [HOLD E]');
        return;
      }
    }
    // Check leader arrest (from behind, non-lethal)
    for (var m = 0; m < mercenaries.length; m++) {
      var merc = mercenaries[m];
      if (!merc.isLeader || !merc.alive) { continue; }
      if (dist3(player.pos, merc.mesh.position) < 2.5) {
        // Check approach from behind
        var leaderFwd = new THREE.Vector3(-Math.sin(merc.mesh.rotation.y), 0, -Math.cos(merc.mesh.rotation.y));
        var toPlayer  = new THREE.Vector3().subVectors(player.pos, merc.mesh.position).normalize();
        var dot       = leaderFwd.dot(toPlayer);
        if (dot > 0.5) {
          // Approaching from behind
          merc.state     = 'arrested';
          merc.hp        = 0;
          merc.alive     = false;
          leaderArrested = true;
          showMessage('MERCENARY LEADER ARRESTED! NON-LETHAL TAKEDOWN!');
          checkWinCondition();
        }
        return;
      }
    }
  }

  function updateInteractions(dt) {
    if (!keys['KeyE']) {
      // Cancel in-progress
      if (interactType === 'breach' && interactTarget) {
        interactTarget.beingBreached = false;
      }
      if (interactType === 'rescue' && interactTarget) {
        interactTarget.beingRescued = false;
      }
      interactTarget = null;
      interactType   = '';
      return;
    }

    if (!interactTarget) { return; }

    if (interactType === 'breach') {
      interactTarget.breachTimer += dt;
      if (interactTarget.breachTimer >= BREACH_TIME) {
        interactTarget.breached      = true;
        interactTarget.beingBreached = false;
        // Explode door open
        interactTarget.mesh.rotation.y += Math.PI * 0.5;
        interactTarget.mesh.position.x += 1.5;
        // Trigger alarm if not silenced
        if (!player.silenced) {
          triggerAlarm(interactTarget.floor);
        }
        interactTarget = null;
        interactType   = '';
        showMessage('DOOR BREACHED!');
      }
    } else if (interactType === 'rescue') {
      interactTarget.rescueTimer += dt;
      if (interactTarget.rescueTimer >= RESCUE_TIME) {
        freeHostage(interactTarget);
        interactTarget = null;
        interactType   = '';
      }
    }
  }

  function freeHostage(ho) {
    ho.freed        = true;
    ho.beingRescued = false;
    hostagesFreed++;
    // Visual: change color to freed
    ho.mesh.material.color.setHex(COLOR_FREED);
    if (ho.isCEO) {
      showMessage('CEO FREED! NOW ELIMINATE OR ARREST THE LEADER!');
    } else {
      showMessage('HOSTAGE FREED! [' + hostagesFreed + '/' + TOTAL_HOSTAGES + ']');
    }
    checkWinCondition();
  }

  // ── Alarm System ─────────────────────────────────────────────

  function triggerAlarm(floor) {
    if (!floorAlarms[floor] || floorAlarms[floor].active) { return; }
    floorAlarms[floor].active = true;
    floorAlarms[floor].timer  = 0;
    floorAlarms[floor].executionDone = false;
    showMessage('ALARM ON FLOOR ' + floor + '! EXECUTOR IN 30s!');

    // Alert all mercs on this floor
    for (var m = 0; m < mercenaries.length; m++) {
      var merc = mercenaries[m];
      if (merc.floor === floor && merc.alive && merc.state !== 'dead') {
        merc.state = 'chase';
      }
    }
  }

  function updateAlarms(dt) {
    for (var f = 1; f <= TOTAL_FLOORS; f++) {
      var alarm = floorAlarms[f];
      if (!alarm || !alarm.active) { continue; }
      alarm.timer += dt;
      floorAlarmFlash[f] = (alarm.timer % 0.5) < 0.25;

      if (!alarm.executionDone && alarm.timer >= ALARM_EXECUTE_DELAY) {
        alarm.executionDone = true;
        executeRandomHostageOnFloor(f);
      }
    }
  }

  function executeRandomHostageOnFloor(floor) {
    var candidates = [];
    for (var h = 0; h < hostages.length; h++) {
      var ho = hostages[h];
      if (ho.floor === floor && !ho.freed && ho.alive) {
        candidates.push(ho);
      }
    }
    if (candidates.length === 0) { return; }
    var victim = candidates[Math.floor(Math.random() * candidates.length)];
    victim.alive = false;
    victim.mesh.material.color.setHex(0xFF0000);
    victim.mesh.position.y -= 0.5;
    victim.mesh.rotation.z = Math.PI * 0.5;

    if (victim.isCEO) {
      ceoDead       = true;
      missionFailed = true;
      failReason    = 'CEO EXECUTED BY MERCENARIES!';
      showEndScreen(false);
    } else {
      showMessage('HOSTAGE EXECUTED ON FLOOR ' + floor + '!');
    }
  }

  // ── Shooting ─────────────────────────────────────────────────

  function shoot() {
    if (shootCooldown > 0) { return; }
    if (player.ammo <= 0) { showMessage('OUT OF AMMO!'); return; }

    player.ammo--;
    shootCooldown = SHOOT_RATE;

    // Raycast from camera forward
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

    var start = camera.position.clone();
    var raycaster = new THREE.Raycaster(start, dir.normalize(), 0, 80);

    // Collect merc meshes
    var mercMeshes = [];
    for (var m = 0; m < mercenaries.length; m++) {
      if (mercenaries[m].alive) { mercMeshes.push(mercenaries[m].mesh); }
    }

    var hits = raycaster.intersectObjects(mercMeshes, true);
    if (hits.length > 0) {
      var hitMesh = hits[0].object;
      // Traverse up to find the root merc mesh
      var root = hitMesh;
      while (root.parent && root.parent !== scene && root.parent !== rootGroup) {
        root = root.parent;
      }
      for (var m = 0; m < mercenaries.length; m++) {
        var merc = mercenaries[m];
        if (merc.mesh === root && merc.alive) {
          var dmg = player.silenced ? 25 : 30;
          // Headshot check
          if (hitMesh.geometry && hitMesh.geometry.type === 'SphereGeometry') { dmg *= 2; }
          merc.hp -= dmg;
          merc.mesh.material.color.setHex(0xFF4444);
          if (merc.hp <= 0) {
            killMerc(merc);
          } else {
            // Alert unless silenced
            if (!player.silenced) {
              merc.state = 'chase';
              triggerAlarm(merc.floor);
            }
          }
          break;
        }
      }
    }

    // Gunshot alert (non-silenced)
    if (!player.silenced) {
      for (var m = 0; m < mercenaries.length; m++) {
        var merc = mercenaries[m];
        if (merc.alive && dist3(merc.mesh.position, player.pos) < 20) {
          merc.state = 'chase';
        }
      }
    }

    // Muzzle flash effect
    spawnMuzzleFlash();
  }

  function spawnMuzzleFlash() {
    var flash = makeBox(0.3, 0.3, 0.3, 0xFFAA00);
    var dir   = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    flash.position.copy(camera.position).addScaledVector(dir, 1.5);
    scene.add(flash);
    setTimeout(function () { scene.remove(flash); }, 60);
  }

  function throwGrenade() {
    player.grenades--;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    var gpos = camera.position.clone().addScaledVector(dir, 1.5);
    var gvel = dir.clone().multiplyScalar(15);
    gvel.y  += 5;

    var gMesh = makeSphere(0.2, 0x445533);
    gMesh.position.copy(gpos);
    scene.add(gMesh);

    var gTimer = 2.5;
    var gVel   = gvel;

    (function animateGrenade() {
      gTimer -= 0.016;
      gVel.y -= GRAVITY * (-1) * 0.016;
      gMesh.position.addScaledVector(gVel, 0.016);

      if (gTimer > 0) {
        requestAnimationFrame(animateGrenade);
      } else {
        // Explode
        scene.remove(gMesh);
        var center = gMesh.position.clone();
        // Damage nearby mercs
        for (var m = 0; m < mercenaries.length; m++) {
          var merc = mercenaries[m];
          if (merc.alive && dist3(merc.mesh.position, center) < 6) {
            merc.hp -= 80;
            if (merc.hp <= 0) { killMerc(merc); }
          }
        }
        // Visual flash
        var exp = makeBox(4, 4, 4, 0xFF6600);
        exp.position.copy(center);
        scene.add(exp);
        setTimeout(function () { scene.remove(exp); }, 150);
        showMessage('GRENADE! [' + player.grenades + ' remaining]');
      }
    }());
  }

  function killMerc(merc) {
    merc.alive       = false;
    merc.state       = 'dead';
    merc.hp          = 0;
    merc.mesh.rotation.z = Math.PI * 0.5;
    merc.mesh.position.y -= 0.4;
    merc.mesh.material.color.setHex(0x222222);

    if (merc.isLeader) {
      leaderDead = true;
      showMessage('MERCENARY LEADER ELIMINATED!');
      checkWinCondition();
    }
    checkFloorClear(merc.floor);
  }

  function checkFloorClear(floor) {
    for (var m = 0; m < mercenaries.length; m++) {
      var merc = mercenaries[m];
      if (merc.floor === floor && merc.alive) { return; }
    }
    if (!floorsCleared[floor]) {
      floorsCleared[floor] = true;
      showMessage('FLOOR ' + floor + ' CLEARED!');
    }
  }

  // ── Helicopter AI ─────────────────────────────────────────────

  function updateHelicopter(dt) {
    if (!helicopter || !helicopter.alive) { return; }

    // Spin rotor
    helicopter.rotorMesh.rotation.y += dt * 15;

    var targetX = 0;
    var targetZ = -25;
    var roofY   = floorSurfaceY(TOTAL_FLOORS) + 8;

    if (helicopter.approach) {
      // Approach the building
      var hpos = helicopter.group.position;
      hpos.x  += (targetX - hpos.x) * dt * 0.5;
      hpos.z  += (targetZ - hpos.z) * dt * 0.5;
      hpos.y  += (roofY   - hpos.y) * dt * 0.3;

      if (Math.abs(hpos.x - targetX) < 1 && Math.abs(hpos.z - targetZ) < 2) {
        helicopter.approach = false;
        heliArrived         = true;
        showMessage('ENEMY HELICOPTER HAS ARRIVED! FAST-ROPE TO FLOOR 18 AVAILABLE!');
      }
    }

    // Helicopter gun fires at player if in range
    helicopter.gunTimer += dt;
    if (helicopter.gunTimer >= helicopter.gunRate) {
      helicopter.gunTimer = 0;
      if (dist3(helicopter.group.position, player.pos) < 40) {
        player.hp -= 15;
        showMessage('HELICOPTER GUNFIRE! HP: ' + player.hp);
        if (player.hp <= 0) {
          missionFailed = true;
          failReason    = 'KILLED BY HELICOPTER GUNNER!';
          showEndScreen(false);
        }
      }
    }
  }

  // ── Mercenary AI ─────────────────────────────────────────────

  function updateMercenaries(dt) {
    for (var m = 0; m < mercenaries.length; m++) {
      var merc = mercenaries[m];
      if (!merc.alive) { continue; }

      // Flash when hit
      if (merc.hp < merc.maxHp && merc.hp > 0) {
        var ratio = merc.hp / merc.maxHp;
        if (ratio > 0.5) {
          merc.mesh.material.color.setHex(merc.isLeader ? COLOR_MERC_LEADER :
                                          merc.isElite  ? COLOR_MERC_ELITE  : COLOR_MERC);
        }
      }

      var mpos = merc.mesh.position;
      var ppos = player.pos;
      var d2   = dist3(mpos, ppos);

      if (merc.state === 'snipe') {
        // Sniper stays in place, shoots at player
        merc.shootTimer += dt;
        if (d2 < merc.detectRange && merc.shootTimer >= merc.shootRate) {
          merc.shootTimer = 0;
          player.hp -= 20;
          showMessage('SNIPER HIT! HP: ' + player.hp);
          if (player.hp <= 0) {
            missionFailed = true;
            failReason    = 'KILLED BY SNIPER!';
            showEndScreen(false);
          }
        }
        continue;
      }

      if (merc.state === 'guard' && merc.isLeader) {
        // Leader circles CEO position
        merc.shootTimer += dt;
        if (d2 < merc.detectRange) {
          merc.state = 'attack';
        }
        continue;
      }

      if (merc.state === 'patrol') {
        // Move toward next waypoint
        var wp   = merc.waypoints[merc.patrolIdx];
        var wpY  = floorSurfaceY(merc.floor) + 0.7;
        var tx   = wp.x;
        var tz   = wp.z;
        var ddx  = tx - mpos.x;
        var ddz  = tz - mpos.z;
        var dist = Math.sqrt(ddx * ddx + ddz * ddz);

        if (dist < 0.5) {
          merc.patrolIdx = (merc.patrolIdx + 1) % merc.waypoints.length;
        } else {
          mpos.x += (ddx / dist) * merc.speed * dt;
          mpos.z += (ddz / dist) * merc.speed * dt;
          mpos.x  = clamp(mpos.x, -9, 9);
          mpos.z  = clamp(mpos.z, -9, 9);
        }
        mpos.y = wpY;

        // Detect player
        if (d2 < merc.detectRange && merc.floor === currentFloor) {
          merc.state = 'alert';
          merc.alarmTimer = 0;
        }

      } else if (merc.state === 'alert') {
        merc.alarmTimer += dt;
        if (merc.alarmTimer > 1.5) {
          merc.state = 'chase';
          if (!player.silenced) { triggerAlarm(merc.floor); }
        }

      } else if (merc.state === 'chase') {
        // Move toward player
        var ddx2  = ppos.x - mpos.x;
        var ddz2  = ppos.z - mpos.z;
        var dist2 = Math.sqrt(ddx2 * ddx2 + ddz2 * ddz2);
        if (dist2 > 0.1) {
          mpos.x += (ddx2 / dist2) * merc.speed * dt;
          mpos.z += (ddz2 / dist2) * merc.speed * dt;
        }
        // Look at player
        merc.mesh.rotation.y = Math.atan2(ddx2, ddz2);

        if (d2 < 8) {
          merc.state = 'attack';
        } else if (d2 > 30 && merc.floor !== currentFloor) {
          merc.state = 'patrol';
        }

      } else if (merc.state === 'attack') {
        merc.shootTimer += dt;
        var ddx3 = ppos.x - mpos.x;
        var ddz3 = ppos.z - mpos.z;
        merc.mesh.rotation.y = Math.atan2(ddx3, ddz3);

        if (merc.shootTimer >= merc.shootRate) {
          merc.shootTimer = 0;
          // Shoot player (with accuracy falloff)
          var hitChance = merc.isElite ? 0.65 : 0.4;
          if (Math.random() < hitChance) {
            var dmg = merc.isLeader ? 18 : merc.isElite ? 14 : 10;
            player.hp -= dmg;
            if (player.hp <= 0) {
              missionFailed = true;
              failReason    = 'KILLED IN ACTION!';
              showEndScreen(false);
            }
          }
        }

        if (d2 > 12) {
          merc.state = 'chase';
        }
      }
    }
  }

  // ── Floor / Level Logic ───────────────────────────────────────

  function updateCurrentFloor() {
    // Determine which floor player is on
    var py = player.pos.y;
    var f  = Math.round(py / FLOOR_HEIGHT);
    f      = clamp(f, 1, TOTAL_FLOORS);
    currentFloor  = f;
    player.floor  = f;
  }

  function updateFloorAlarmVisuals() {
    // Flash building exterior when alarm is active on current floor
    // (simplified: flash floor slab)
    for (var f = 1; f <= TOTAL_FLOORS; f++) {
      if (floorAlarms[f] && floorAlarms[f].active && floorAlarmFlash[f]) {
        if (floorMeshes[f - 1]) {
          floorMeshes[f - 1].material.color.setHex(COLOR_ALARM_FLASH);
        }
      } else {
        if (floorMeshes[f - 1]) {
          floorMeshes[f - 1].material.color.setHex(COLOR_FLOOR);
        }
      }
    }
  }

  // ── Player Movement ──────────────────────────────────────────

  function updatePlayer(dt) {
    if (!player) { return; }
    if (rappelActive) { updateRappel(dt); }

    if (!rappelActive) {
      // Movement
      var speed = PLAYER_SPEED;
      var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      var right   = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw));
      var move    = new THREE.Vector3();

      if (keys['KeyW'] || keys['ArrowUp'])    { move.addScaledVector(forward,  speed); }
      if (keys['KeyS'] || keys['ArrowDown'])  { move.addScaledVector(forward, -speed); }
      if (keys['KeyA'] || keys['ArrowLeft'])  { move.addScaledVector(right,   -speed); }
      if (keys['KeyD'] || keys['ArrowRight']) { move.addScaledVector(right,    speed); }

      player.vel.x = move.x;
      player.vel.z = move.z;

      // Gravity
      player.vel.y += GRAVITY * dt;

      // Move
      player.pos.addScaledVector(player.vel, dt);

      // Floor collision — snap to floor surface
      var floorSurf = floorSurfaceY(player.floor) + 0.8;
      if (player.pos.y <= floorSurf) {
        player.pos.y = floorSurf;
        player.vel.y = 0;
        onGround     = true;
      } else {
        onGround = false;
      }

      // Bound player inside building X/Z (rough)
      player.pos.x = clamp(player.pos.x, -9.5, 9.5);
      player.pos.z = clamp(player.pos.z, -9.5, 9.5);
    }

    // Update camera
    camera.position.copy(player.pos);
    camera.position.y += 0.5;
    camera.rotation.order = 'YXZ';
    camera.rotation.y     = yaw;
    camera.rotation.x     = pitch;

    // Sync player mesh
    if (playerMesh) {
      playerMesh.position.copy(player.pos);
      playerMesh.rotation.y = yaw;
    }

    shootCooldown = Math.max(0, shootCooldown - dt);
    updateCurrentFloor();
  }

  // ── Win / Lose ───────────────────────────────────────────────

  function checkWinCondition() {
    if (missionFailed || missionWon) { return; }

    // Win: CEO freed AND (leader dead OR arrested)
    if (ceo && ceo.freed && (leaderDead || leaderArrested)) {
      missionWon = true;
      showEndScreen(true);
    }
  }

  function showEndScreen(won) {
    if (overlayEl) { overlayEl.remove(); }
    overlayEl = document.createElement('div');
    overlayEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.85)', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'z-index:9999',
      'font-family:monospace', 'color:' + (won ? '#00FF88' : '#FF3300'),
      'font-size:28px', 'text-align:center', 'pointer-events:auto'
    ].join(';');

    var title = won ? 'MISSION COMPLETE' : 'MISSION FAILED';
    var sub   = won
      ? 'CEO RESCUED — MERCENARY CREW NEUTRALIZED'
      : failReason;

    var stats = [
      'HOSTAGES FREED: ' + hostagesFreed + '/' + TOTAL_HOSTAGES,
      'TIME REMAINING: ' + formatTime(gameTimer),
      'FLOOR REACHED:  ' + currentFloor + '/20'
    ].join('<br>');

    overlayEl.innerHTML = [
      '<div style="font-size:36px;font-weight:bold;letter-spacing:4px">' + title + '</div>',
      '<div style="font-size:18px;margin:16px 0;color:#FFFFFF">' + sub + '</div>',
      '<div style="font-size:16px;color:#AAAAFF;line-height:2">' + stats + '</div>',
      '<button id="hh-restart" style="margin-top:30px;padding:12px 32px;font-size:18px;',
      'font-family:monospace;background:#223344;color:#88FFCC;border:2px solid #44AAFF;',
      'cursor:pointer;letter-spacing:2px">RESTART</button>'
    ].join('');

    document.body.appendChild(overlayEl);
    document.getElementById('hh-restart').addEventListener('click', function () {
      overlayEl.remove();
      overlayEl = null;
      reset();
      init(scene, camera, renderer);
    });
  }

  // ── HUD ──────────────────────────────────────────────────────

  function buildHUD() {
    if (hudEl) { hudEl.remove(); }
    hudEl = document.createElement('div');
    hudEl.id = 'hh-hud';
    hudEl.style.cssText = [
      'position:fixed', 'top:12px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.82)', 'color:#00FFCC',
      'font-family:"Courier New",monospace', 'font-size:13px',
      'padding:8px 20px', 'border:1px solid #004466',
      'white-space:nowrap', 'z-index:9000', 'letter-spacing:1px',
      'pointer-events:none', 'border-radius:4px'
    ].join(';');
    document.body.appendChild(hudEl);

    // Crosshair
    var cross = document.createElement('div');
    cross.id  = 'hh-crosshair';
    cross.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px', 'height:16px', 'pointer-events:none', 'z-index:9001'
    ].join(';');
    cross.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">' +
      '<line x1="8" y1="2" x2="8" y2="14" stroke="#00FFCC" stroke-width="1.2"/>' +
      '<line x1="2" y1="8" x2="14" y2="8" stroke="#00FFCC" stroke-width="1.2"/>' +
      '<circle cx="8" cy="8" r="2" fill="none" stroke="#00FFCC" stroke-width="1"/>' +
      '</svg>';
    document.body.appendChild(cross);

    // Info bar (E key hints)
    var info = document.createElement('div');
    info.id  = 'hh-info';
    info.style.cssText = [
      'position:fixed', 'bottom:40px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.7)', 'color:#88DDFF',
      'font-family:"Courier New",monospace', 'font-size:12px',
      'padding:5px 14px', 'z-index:9000', 'letter-spacing:1px',
      'pointer-events:none', 'border-radius:3px'
    ].join(';');
    info.textContent = '[W/A/S/D] MOVE  [MOUSE] AIM  [CLICK] SHOOT  [E] INTERACT  [G] GRENADE  [R] RAPPEL';
    document.body.appendChild(info);

    // Message overlay (bottom center)
    var msg = document.createElement('div');
    msg.id  = 'hh-msg';
    msg.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
      'color:#FFFF00', 'font-family:"Courier New",monospace', 'font-size:14px',
      'padding:4px 16px', 'z-index:9000', 'pointer-events:none',
      'background:rgba(0,0,0,0.5)', 'border-radius:3px', 'opacity:0',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(msg);
  }

  var msgTimeout = null;
  function showMessage(text) {
    var msg = document.getElementById('hh-msg');
    if (!msg) { return; }
    msg.textContent = text;
    msg.style.opacity = '1';
    if (msgTimeout) { clearTimeout(msgTimeout); }
    msgTimeout = setTimeout(function () { msg.style.opacity = '0'; }, 3000);
  }

  function updateHUD() {
    if (!hudEl) { return; }

    var heliStatus = 'NOT YET';
    if (heliDestroyed)    { heliStatus = 'DESTROYED'; }
    else if (heliLanded)  { heliStatus = 'LANDED'; }
    else if (heliArrived) { heliStatus = 'INBOUND'; }
    else if (gameTimer < HELI_ARRIVE_TIME) { heliStatus = 'INBOUND'; }

    var floorName = getFloorName(currentFloor);
    var timerColor = gameTimer < 60 ? '#FF3300' : gameTimer < 300 ? '#FFAA00' : '#00FFCC';

    hudEl.innerHTML = [
      'HIGHRISE HOSTAGE',
      ' | FLOOR: <b>' + currentFloor + '/20</b> (' + floorName + ')',
      ' | HOSTAGES: <b>' + hostagesFreed + '/' + TOTAL_HOSTAGES + ' FREED</b>',
      ' | TIMER: <span style="color:' + timerColor + '"><b>' + formatTime(gameTimer) + '</b></span>',
      ' | CEO: <b style="color:' + (ceoDead ? '#FF0000' : ceo && ceo.freed ? '#00FF88' : '#FFCC00') + '">' +
        (ceoDead ? 'DEAD' : ceo && ceo.freed ? 'FREED' : 'ALIVE') + '</b>',
      ' | HELI: <b style="color:' + (heliDestroyed ? '#888' : heliArrived ? '#FF6600' : '#888') + '">' +
        heliStatus + '</b>',
      ' | HP: <b style="color:' + (player.hp < 30 ? '#FF3300' : '#00FFCC') + '">' + player.hp + '</b>',
      ' | AMMO: <b>' + player.ammo + '</b>',
      ' | GRENADES: <b>' + player.grenades + '</b>'
    ].join('');
  }

  function getFloorName(f) {
    if (f <= 5)  { return 'LOBBY/OFFICES'; }
    if (f <= 10) { return 'SERVER ROOM/IT'; }
    if (f <= 15) { return 'EXEC SUITES'; }
    if (f <= 19) { return 'PENTHOUSE PREP'; }
    return 'PENTHOUSE';
  }

  // ── Stairwell / Elevator Traversal ───────────────────────────

  function checkStairElevator() {
    // If player is near elevator shaft (center), allow riding up/down
    var distToShaft = dist2(player.pos, { x: 0, z: 0 });
    if (distToShaft < 2.5) {
      if (keys['KeyQ'] && currentFloor < TOTAL_FLOORS) {
        // Go up
        player.pos.y = floorSurfaceY(currentFloor + 1) + 0.8;
        currentFloor++;
        player.floor = currentFloor;
        showMessage('ELEVATOR: FLOOR ' + currentFloor);
      }
      if (keys['KeyZ'] && currentFloor > 1) {
        // Go down
        player.pos.y = floorSurfaceY(currentFloor - 1) + 0.8;
        currentFloor--;
        player.floor = currentFloor;
        showMessage('ELEVATOR: FLOOR ' + currentFloor);
      }
    }

    // Stairwells (corners) — auto-climb if walking into corner and pressing W
    var corners = [
      { x: -8, z: -8 }, { x: 8, z: -8 },
      { x: -8, z:  8 }, { x: 8, z:  8 }
    ];
    for (var c = 0; c < corners.length; c++) {
      var cd = dist2(player.pos, corners[c]);
      if (cd < 2.5) {
        if (keys['KeyQ'] && currentFloor < TOTAL_FLOORS) {
          player.pos.y = floorSurfaceY(currentFloor + 1) + 0.8;
          currentFloor++;
          player.floor = currentFloor;
          showMessage('STAIRWELL: FLOOR ' + currentFloor);
        }
        if (keys['KeyZ'] && currentFloor > 1) {
          player.pos.y = floorSurfaceY(currentFloor - 1) + 0.8;
          currentFloor--;
          player.floor = currentFloor;
          showMessage('STAIRWELL: FLOOR ' + currentFloor);
        }
        break;
      }
    }

    // Fast-rope from helicopter (if alive and on roof area)
    if (heliArrived && !heliDestroyed && !heliLanded) {
      var distToRoof = Math.abs(player.pos.y - floorSurfaceY(TOTAL_FLOORS) - 1);
      if (distToRoof < 3 && keys['KeyF']) {
        player.pos.set(0, floorSurfaceY(FASTROP_FLOOR) + 0.8, 0);
        currentFloor = FASTROP_FLOOR;
        player.floor = FASTROP_FLOOR;
        heliLanded   = true;
        showMessage('FAST-ROPE FROM HELI! FLOOR ' + FASTROP_FLOOR + '!');
      }
    }
  }

  // ── Intro Screen ─────────────────────────────────────────────

  function showIntroScreen() {
    if (overlayEl) { overlayEl.remove(); }
    overlayEl = document.createElement('div');
    overlayEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,5,15,0.95)', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'z-index:9999',
      'font-family:"Courier New",monospace', 'color:#00FFCC',
      'text-align:center', 'pointer-events:auto'
    ].join(';');

    overlayEl.innerHTML = [
      '<div style="font-size:40px;font-weight:bold;letter-spacing:6px;color:#FFCC00">',
      'HIGHRISE HOSTAGE</div>',
      '<div style="font-size:16px;color:#88AACC;margin:12px 0 4px">',
      '20-FLOOR SKYSCRAPER SIEGE RESCUE</div>',
      '<hr style="width:400px;border-color:#336">',
      '<div style="font-size:13px;color:#AABBCC;line-height:1.9;max-width:500px;margin:10px 0">',
      'A MERCENARY CREW HAS SEIZED VANTIX TOWER.<br>',
      '60 CORPORATE EXECUTIVES ARE HELD HOSTAGE.<br>',
      'THE CEO IS ON FLOOR 20 — A GUN TO HIS HEAD.<br>',
      'THE MERCENARY LEADER DEMANDS EVACUATION IN <b style="color:#FF3300">15 MINUTES</b>.',
      '</div>',
      '<div style="font-size:13px;color:#88FFAA;line-height:1.9;margin:10px 0">',
      'YOU RAPPEL UP THE EXTERIOR. CLEAR FLOOR BY FLOOR.<br>',
      'FREE HOSTAGES (E). BREACH DOORS (E). STAY SILENT.<br>',
      '[Q] UP FLOOR  [Z] DOWN FLOOR  [E] INTERACT<br>',
      '[G] GRENADE  [R] RAPPEL TO MID-FLOOR  [F] FAST-ROPE<br>',
      '[CLICK] SHOOT</div>',
      '<button id="hh-start" style="margin-top:20px;padding:14px 40px;font-size:20px;',
      'font-family:monospace;background:#001122;color:#00FFCC;',
      'border:2px solid #00AAFF;cursor:pointer;letter-spacing:3px">',
      'BEGIN MISSION</button>'
    ].join('');

    document.body.appendChild(overlayEl);
    document.getElementById('hh-start').addEventListener('click', function () {
      overlayEl.remove();
      overlayEl = null;
      missionActive = true;
      renderer.domElement.requestPointerLock();
      showMessage('MISSION START — CLEAR ALL 20 FLOORS!');
    });
  }

  // ── Init ─────────────────────────────────────────────────────

  function activate() {
    if (active) { return; }
    active = true;

    // If no scene provided externally, create minimal standalone
    if (!scene) {
      scene    = new THREE.Scene();
      scene.background = new THREE.Color(0x0A1020);
      camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      document.body.appendChild(renderer.domElement);
      clock    = new THREE.Clock();

      window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }

    init(scene, camera, renderer);
  }

  function init(sc, cam, ren) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    scene    = sc    || scene;
    camera   = cam  || camera;
    renderer = ren  || renderer;
    if (!clock) { clock = new THREE.Clock(); }

    // Reset all state
    missionActive   = false;
    missionWon      = false;
    missionFailed   = false;
    failReason      = '';
    gameTimer       = MISSION_TIME;
    hostagesFreed   = 0;
    currentFloor    = 1;
    heliArrived     = false;
    heliDestroyed   = false;
    heliLanded      = false;
    ceoDead         = false;
    leaderArrested  = false;
    leaderDead      = false;
    rappelActive    = false;
    rappelRope      = null;
    interactTarget  = null;
    interactType    = '';
    yaw             = 0;
    pitch           = 0;
    pointerLocked   = false;
    onGround        = true;
    shootCooldown   = 0;

    floorGroups     = [];
    floorMeshes     = [];
    mercenaries     = [];
    hostages        = [];
    doors           = [];
    ropes           = [];
    sniperPerches   = [];
    ceo             = null;
    helicopter      = null;

    floorsCleared   = [];
    floorAlarms     = [];
    floorAlarmFlash = [];
    for (var f = 0; f <= TOTAL_FLOORS + 1; f++) {
      floorsCleared.push(false);
      floorAlarms.push({ active: false, timer: 0, executionDone: false });
      floorAlarmFlash.push(false);
    }

    // Clear scene
    if (rootGroup) { scene.remove(rootGroup); }
    // Remove lingering lights
    var toRemove = [];
    scene.traverse(function (obj) {
      if (obj.isLight) { toRemove.push(obj); }
    });
    for (var i = 0; i < toRemove.length; i++) { scene.remove(toRemove[i]); }

    buildTower();
    spawnMercenaries();
    spawnHostages();
    initPlayer();
    buildHUD();

    // Event listeners (idempotent)
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLock);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLock);

    renderer.domElement.addEventListener('click', function () {
      if (missionActive && !missionWon && !missionFailed) {
        renderer.domElement.requestPointerLock();
      }
    });

    showIntroScreen();

    // Start render loop if standalone
    if (!window._hhLoopRunning) {
      window._hhLoopRunning = true;
      (function loop() {
        requestAnimationFrame(loop);
        var dt = clock.getDelta();
        dt = Math.min(dt, 0.05); // cap delta
        if (active) {
          update(dt);
          if (renderer) renderer.render(scene, camera);
        }
      }());
    }
  }

  // ── Update ───────────────────────────────────────────────────

  function update(dt) {
    if (!active || !missionActive || missionWon || missionFailed) { return; }

    // Timer
    gameTimer -= dt;
    if (gameTimer <= 0) {
      gameTimer     = 0;
      missionFailed = true;
      failReason    = 'TIME EXPIRED — CEO EXECUTED PER MERCENARY DEMANDS!';
      showEndScreen(false);
      return;
    }

    // Helicopter arrives at 5-min mark
    if (!heliArrived && !helicopter && gameTimer <= HELI_ARRIVE_TIME) {
      spawnHelicopter();
      showMessage('ENEMY HELICOPTER INBOUND!');
    }

    updatePlayer(dt);
    updateMercenaries(dt);
    updateAlarms(dt);
    updateHelicopter(dt);
    updateInteractions(dt);
    checkStairElevator();
    updateFloorAlarmVisuals();
    updateHUD();
  }

  // ── Reset ────────────────────────────────────────────────────

  function reset() {
    active          = false;
    missionActive   = false;
    missionWon      = false;
    missionFailed   = false;
    gameTimer       = MISSION_TIME;
    hostagesFreed   = 0;
    heliArrived     = false;
    heliDestroyed   = false;
    heliLanded      = false;
    ceoDead         = false;
    leaderArrested  = false;
    leaderDead      = false;
    rappelActive    = false;
    interactTarget  = null;
    interactType    = '';
    keys            = {};

    // Remove event listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLock);

    // Clear Three.js objects
    if (rootGroup) {
      scene.remove(rootGroup);
      rootGroup = null;
    }
    for (var i = 0; i < ropes.length; i++) { scene.remove(ropes[i]); }
    if (helicopter && helicopter.group) { scene.remove(helicopter.group); }
    if (playerMesh) { scene.remove(playerMesh); }

    // Remove HUD
    var hudToRemove = document.getElementById('hh-hud');
    if (hudToRemove) { hudToRemove.remove(); }
    var crossToRemove = document.getElementById('hh-crosshair');
    if (crossToRemove) { crossToRemove.remove(); }
    var infoToRemove = document.getElementById('hh-info');
    if (infoToRemove) { infoToRemove.remove(); }
    var msgToRemove = document.getElementById('hh-msg');
    if (msgToRemove) { msgToRemove.remove(); }

    if (hudEl) { hudEl.remove(); hudEl = null; }
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }

    floorGroups     = [];
    floorMeshes     = [];
    mercenaries     = [];
    hostages        = [];
    doors           = [];
    ropes           = [];
    sniperPerches   = [];
    ceo             = null;
    helicopter      = null;
    playerMesh      = null;
    player          = null;
    window._hhLoopRunning = false;
  }

  // ── Key listener for standalone activation ───────────────────
  // Attach immediately so H+H works before init is explicitly called
  document.addEventListener('keydown', function bootstrapKey(e) {
    if (e.code === 'KeyH') {
      var now = performance.now();
      if (now - lastHPress < 400 && !active) {
        document.removeEventListener('keydown', bootstrapKey);
        activate();
      }
      lastHPress = now;
    }
  });

  return { init: init, update: update, reset: reset };

}());
