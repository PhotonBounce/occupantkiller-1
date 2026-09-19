window.FortressBreach = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // --- Module State ---
  var active = false;
  var scene, camera, renderer, clock;
  var keys = {};
  var keyTimestamps = {};
  var gameOver = false;
  var gameWon = false;

  // Player state
  var playerPos = { x: 0, y: 2, z: 60 };
  var playerVel = { x: 0, y: 0, z: 0 };
  var playerYaw = 0;
  var playerPitch = 0;
  var playerHP = 100;
  var onGround = true;

  // Mouse look
  var mouseDX = 0;
  var mouseDY = 0;

  // Shooting
  var shootCooldown = 0;
  var SHOOT_INTERVAL = 0.18;
  var bullets = [];

  // Gate & entry mechanics
  var gateBreached = false;
  var portcullisOpen = false;
  var drawbridgeLowered = false;
  var lockHits = 0;
  var LOCK_HITS_REQUIRED = 3;
  var portcullisControlHits = 0;
  var PORTCULLIS_HITS_REQUIRED = 2;
  var carryingRam = false;
  var ramPickedUp = false;
  var nearRam = false;
  var ramUsed = false;

  // Keep floors
  var currentKeepFloor = 0; // 0 = courtyard, 1-4 = keep floors
  var keepFloorsCleared = [false, false, false, false];
  var nearStairs = false;
  var holdingE = false;
  var holdETimer = 0;
  var HOLD_E_DURATION = 3.0;

  // Flag planting (win condition)
  var flagPlanted = false;
  var nearFlagZone = false;
  var flagPlantTimer = 0;

  // Courtyard cleared tracking
  var outerCourtyardKills = 0;
  var OUTER_COURTYARD_ENEMIES = 10;
  var outerCourtyardCleared = false;

  // Murder holes
  var murderHoles = [];
  var MURDER_HOLE_SECTIONS = 3;

  // Warlord Vance
  var vanceAlive = true;
  var vanceMesh = null;
  var vanceHP = 550;
  var VANCE_MAX_HP = 550;
  var vancePhase2 = false; // triggered at 50% HP
  var vanceRappelArchers = [];
  var vanceShootCooldown = 0;
  var VANCE_SHOOT_CD = 1.8;
  var vanceShootgunFired = false;

  // Debris / murder hole drops
  var debrisParticles = [];

  // Bullet particles
  var bulletParticles = [];

  // Enemies array
  var enemies = [];
  var ENEMY_TYPES = {
    MERCENARY: 'mercenary',
    ARCHER: 'archer',
    WARLORD: 'warlord'
  };

  // Mesh references
  var portcullisMesh = null;
  var drawbridgeMesh = null;
  var lockMesh = null;
  var portcullisControlMesh = null;
  var ramMesh = null;
  var flagMesh = null;
  var flagPole = null;
  var staircaseRefs = [];
  var keepFloorMeshes = [];
  var hudEl = null;

  // Environment groups
  var fortressGroup = null;

  // Warlord rappel archers spawned
  var rappelArchersSpawned = false;

  // ------- Helper Geometry Functions -------

  function makeBox(w, h, d, color, opacity, transparent) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      opacity: opacity !== undefined ? opacity : 1,
      transparent: !!transparent
    });
    return new THREE.Mesh(geo, mat);
  }

  function makeCylinder(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeCone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeLineGrid(x0, y0, z0, cols, rows, stepX, stepY, axis, color) {
    // axis: 'XY', 'XZ', or 'YZ'
    var pts = [];
    // horizontal lines
    for (var r = 0; r <= rows; r++) {
      var dy = r * stepY;
      if (axis === 'XY') {
        pts.push(x0, y0 + dy, z0, x0 + cols * stepX, y0 + dy, z0);
      } else if (axis === 'XZ') {
        pts.push(x0, y0, z0 + dy, x0 + cols * stepX, y0, z0 + dy);
      } else {
        pts.push(x0, y0 + dy, z0, x0, y0 + dy, z0 + cols * stepX);
      }
    }
    // vertical lines
    for (var c = 0; c <= cols; c++) {
      var dx = c * stepX;
      if (axis === 'XY') {
        pts.push(x0 + dx, y0, z0, x0 + dx, y0 + rows * stepY, z0);
      } else if (axis === 'XZ') {
        pts.push(x0 + dx, y0, z0, x0 + dx, y0, z0 + rows * stepY);
      } else {
        pts.push(x0, y0, z0 + dx, x0, y0 + rows * stepY, z0 + dx);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function makeLineSegments(pointPairs, color) {
    var pts = [];
    for (var i = 0; i < pointPairs.length; i++) {
      pts.push(pointPairs[i][0], pointPairs[i][1], pointPairs[i][2]);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  // ------- Environment Building -------

  function buildFortress() {
    fortressGroup = new THREE.Group();

    buildGround();
    buildOuterWalls();
    buildGatehouse();
    buildOuterCourtyard();
    buildInnerWalls();
    buildGreatHall();
    buildKeep();
    buildRamProp();

    scene.add(fortressGroup);
  }

  function buildGround() {
    // Ground plane — grey stone paving
    var ground = makeBox(200, 0.5, 200, 0x555555);
    ground.position.set(0, -0.25, 0);
    fortressGroup.add(ground);

    // Moat suggestion — darker strip in front of gate
    var moat = makeBox(40, 0.4, 8, 0x223344);
    moat.position.set(0, 0, 58);
    fortressGroup.add(moat);
  }

  function buildOuterWalls() {
    // Stone color
    var STONE = 0x888877;
    var DARK_STONE = 0x666655;

    // North wall (back)
    var wallN = makeBox(80, 14, 4, STONE);
    wallN.position.set(0, 7, -40);
    fortressGroup.add(wallN);

    // South wall (front, two halves with gate gap)
    var wallSL = makeBox(25, 14, 4, STONE);
    wallSL.position.set(-27.5, 7, 40);
    fortressGroup.add(wallSL);

    var wallSR = makeBox(25, 14, 4, STONE);
    wallSR.position.set(27.5, 7, 40);
    fortressGroup.add(wallSR);

    // East wall
    var wallE = makeBox(4, 14, 80, STONE);
    wallE.position.set(40, 7, 0);
    fortressGroup.add(wallE);

    // West wall
    var wallW = makeBox(4, 14, 80, STONE);
    wallW.position.set(-40, 7, 0);
    fortressGroup.add(wallW);

    // Crenellations on north wall
    for (var cx = -38; cx <= 38; cx += 6) {
      var cren = makeBox(3, 3, 3, DARK_STONE);
      cren.position.set(cx, 15.5, -40);
      fortressGroup.add(cren);
    }
    // Crenellations on east wall
    for (var cz = -38; cz <= 38; cz += 6) {
      var crenE = makeBox(3, 3, 3, DARK_STONE);
      crenE.position.set(40, 15.5, cz);
      fortressGroup.add(crenE);
    }
    // Crenellations on west wall
    for (var czW = -38; czW <= 38; czW += 6) {
      var crenW = makeBox(3, 3, 3, DARK_STONE);
      crenW.position.set(-40, 15.5, czW);
      fortressGroup.add(crenW);
    }

    // Flanking towers — NE and NW corners
    buildTower(36, -36, STONE, DARK_STONE, 'ne');
    buildTower(-36, -36, STONE, DARK_STONE, 'nw');
    // SE and SW corner towers
    buildTower(36, 36, STONE, DARK_STONE, 'se');
    buildTower(-36, 36, STONE, DARK_STONE, 'sw');
  }

  function buildTower(x, z, stone, darkStone, tag) {
    var tower = makeBox(10, 18, 10, stone);
    tower.position.set(x, 9, z);
    fortressGroup.add(tower);

    // Tower cap crenellations
    for (var ti = -1; ti <= 1; ti++) {
      var tc1 = makeBox(2.5, 3, 2.5, darkStone);
      tc1.position.set(x + ti * 3.5, 19.5, z - 5);
      fortressGroup.add(tc1);
      var tc2 = makeBox(2.5, 3, 2.5, darkStone);
      tc2.position.set(x + ti * 3.5, 19.5, z + 5);
      fortressGroup.add(tc2);
      var tc3 = makeBox(2.5, 3, 2.5, darkStone);
      tc3.position.set(x - 5, 19.5, z + ti * 3.5);
      fortressGroup.add(tc3);
      var tc4 = makeBox(2.5, 3, 2.5, darkStone);
      tc4.position.set(x + 5, 19.5, z + ti * 3.5);
      fortressGroup.add(tc4);
    }

    // Arrow slit windows on tower (LineSegments cross)
    var slitPts = [
      [x - 0.2, 10, z - 5.1], [x + 0.2, 10, z - 5.1],
      [x, 8, z - 5.1], [x, 12, z - 5.1]
    ];
    var slits = makeLineSegments(slitPts, 0x222211);
    fortressGroup.add(slits);
  }

  function buildGatehouse() {
    var GATE_STONE = 0x777766;

    // Main gatehouse block
    var gatehouse = makeBox(18, 16, 12, GATE_STONE);
    gatehouse.position.set(0, 8, 40);
    fortressGroup.add(gatehouse);

    // Gate arch lintel (top bar over opening)
    var lintel = makeBox(8, 2, 4, 0x555544);
    lintel.position.set(0, 13, 40);
    fortressGroup.add(lintel);

    // Portcullis — iron grid LineSegments
    var portPts = [];
    // Vertical bars
    for (var pb = -3; pb <= 3; pb += 1.5) {
      portPts.push([pb, 2, 40.5], [pb, 12, 40.5]);
    }
    // Horizontal bars
    for (var ph = 2; ph <= 12; ph += 2) {
      portPts.push([-3, ph, 40.5], [3, ph, 40.5]);
    }
    portcullisMesh = makeLineSegments(portPts.reduce(function(a,b){ return a.concat(b); }, []).reduce(function(acc, v, i) {
      acc.push(v); return acc;
    }, []), 0x445566);
    // rebuild with proper flat array
    var portFlat = [];
    for (var pi = 0; pi < portPts.length; pi++) {
      portFlat.push(portPts[pi][0], portPts[pi][1], portPts[pi][2]);
    }
    var portGeo = new THREE.BufferGeometry();
    portGeo.setAttribute('position', new THREE.Float32BufferAttribute(portFlat, 3));
    var portMat = new THREE.LineBasicMaterial({ color: 0x556677 });
    portcullisMesh = new THREE.LineSegments(portGeo, portMat);
    fortressGroup.add(portcullisMesh);

    // Drawbridge — a flat box that rotates down
    drawbridgeMesh = makeBox(6, 0.5, 8, 0x664422);
    drawbridgeMesh.position.set(0, 0.25, 48);
    fortressGroup.add(drawbridgeMesh);

    // Lock mechanism on gate wall (shootable target)
    lockMesh = makeBox(1, 1.5, 1, 0xbbaa33);
    lockMesh.position.set(3.5, 6, 37);
    fortressGroup.add(lockMesh);

    // Portcullis control lever
    portcullisControlMesh = makeBox(0.8, 1.2, 0.8, 0xcc8833);
    portcullisControlMesh.position.set(-4, 9, 37);
    fortressGroup.add(portcullisControlMesh);

    // Gatehouse crenellations
    for (var gc = -8; gc <= 8; gc += 4) {
      var gcren = makeBox(2.5, 3, 2.5, 0x555544);
      gcren.position.set(gc, 18, 40);
      fortressGroup.add(gcren);
    }

    // Murder hole section 1 — gatehouse ceiling grate
    buildMurderHole(0, 14, 38, 0);
  }

  function buildMurderHole(x, y, z, index) {
    var pts = [];
    for (var mh = -3; mh <= 3; mh += 1.5) {
      pts.push([x + mh, y, z], [x + mh, y, z + 4]);
      pts.push([x - 3, y, z + mh + 1.5], [x + 3, y, z + mh + 1.5]);
    }
    var flat = [];
    for (var mp = 0; mp < pts.length; mp++) {
      flat.push(pts[mp][0], pts[mp][1], pts[mp][2]);
    }
    var mgeo = new THREE.BufferGeometry();
    mgeo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
    var mmat = new THREE.LineBasicMaterial({ color: 0x333322 });
    var grate = new THREE.LineSegments(mgeo, mmat);
    scene.add(grate);
    murderHoles.push({
      mesh: grate,
      x: x, y: y, z: z,
      triggered: false,
      index: index
    });
  }

  function buildOuterCourtyard() {
    // Stone paving tiles
    for (var px = -35; px <= 35; px += 10) {
      for (var pz = -35; pz <= 30; pz += 10) {
        var tile = makeBox(9.5, 0.3, 9.5, 0x666655);
        tile.position.set(px, 0.15, pz);
        fortressGroup.add(tile);
      }
    }

    // Stables — east side
    var stableBase = makeBox(16, 6, 10, 0x776644);
    stableBase.position.set(28, 3, 10);
    fortressGroup.add(stableBase);
    var stableRoof = makeBox(17, 0.5, 11, 0x554433);
    stableRoof.position.set(28, 6.25, 10);
    fortressGroup.add(stableRoof);
    // Stable door frame
    var stableDoor = makeBox(2.5, 4, 0.3, 0x443322);
    stableDoor.position.set(28, 2, 14.85);
    fortressGroup.add(stableDoor);
    // Hay bales inside stable (visible through door)
    var hay1 = makeBox(2, 1.5, 2, 0xccaa44);
    hay1.position.set(25, 0.75, 10);
    fortressGroup.add(hay1);
    var hay2 = makeBox(2, 1.5, 2, 0xccaa44);
    hay2.position.set(30, 0.75, 8);
    fortressGroup.add(hay2);

    // Well — CylinderGeometry
    var wellBase = makeCylinder(2, 2.2, 1.5, 12, 0x888877);
    wellBase.position.set(-20, 0.75, 15);
    fortressGroup.add(wellBase);
    var wellRim = makeCylinder(2.1, 2.1, 0.4, 12, 0x666655);
    wellRim.position.set(-20, 1.7, 15);
    fortressGroup.add(wellRim);
    // Well roof posts
    var wp1 = makeBox(0.3, 3, 0.3, 0x554433);
    wp1.position.set(-21.5, 2.5, 15);
    fortressGroup.add(wp1);
    var wp2 = makeBox(0.3, 3, 0.3, 0x554433);
    wp2.position.set(-18.5, 2.5, 15);
    fortressGroup.add(wp2);
    var wpTop = makeBox(3.5, 0.4, 0.4, 0x554433);
    wpTop.position.set(-20, 4, 15);
    fortressGroup.add(wpTop);

    // Barrels near stables
    for (var br = 0; br < 3; br++) {
      var barrel = makeCylinder(0.6, 0.6, 1.2, 8, 0x664422);
      barrel.position.set(20 + br * 2, 0.6, 18);
      fortressGroup.add(barrel);
    }

    // Cart (box shape)
    var cartBody = makeBox(4, 1.5, 7, 0x886633);
    cartBody.position.set(-30, 0.75, -5);
    fortressGroup.add(cartBody);
    var cartWheelL = makeCylinder(1.2, 1.2, 0.4, 10, 0x332211);
    cartWheelL.rotation.z = Math.PI / 2;
    cartWheelL.position.set(-32.2, 0.7, -3);
    fortressGroup.add(cartWheelL);
    var cartWheelR = makeCylinder(1.2, 1.2, 0.4, 10, 0x332211);
    cartWheelR.rotation.z = Math.PI / 2;
    cartWheelR.position.set(-27.8, 0.7, -3);
    fortressGroup.add(cartWheelR);

    // Murder hole section 2 — inner gatehouse tunnel
    buildMurderHole(-10, 12, 5, 1);

    // Murder hole section 3 — corridor to keep
    buildMurderHole(8, 10, -10, 2);
  }

  function buildInnerWalls() {
    var INNER_STONE = 0x999988;
    var INNER_DARK = 0x777766;

    // Inner north wall
    var iWallN = makeBox(40, 10, 3, INNER_STONE);
    iWallN.position.set(0, 5, -22);
    fortressGroup.add(iWallN);

    // Inner east wall
    var iWallE = makeBox(3, 10, 40, INNER_STONE);
    iWallE.position.set(20, 5, -2);
    fortressGroup.add(iWallE);

    // Inner west wall
    var iWallW = makeBox(3, 10, 40, INNER_STONE);
    iWallW.position.set(-20, 5, -2);
    fortressGroup.add(iWallW);

    // Inner south wall — two halves with gateway
    var iWallSL = makeBox(12, 10, 3, INNER_STONE);
    iWallSL.position.set(-14, 5, 18);
    fortressGroup.add(iWallSL);
    var iWallSR = makeBox(12, 10, 3, INNER_STONE);
    iWallSR.position.set(14, 5, 18);
    fortressGroup.add(iWallSR);

    // Inner wall crenellations
    for (var ic = -18; ic <= 18; ic += 5) {
      var icren = makeBox(2.5, 2.5, 2.5, INNER_DARK);
      icren.position.set(ic, 11.25, -22);
      fortressGroup.add(icren);
    }

    // Inner wall walkways (box ledges)
    var walkN = makeBox(40, 1, 3, 0x888877);
    walkN.position.set(0, 9.5, -22);
    fortressGroup.add(walkN);

    // Small inner towers
    buildSmallTower(18, -20, INNER_STONE, INNER_DARK);
    buildSmallTower(-18, -20, INNER_STONE, INNER_DARK);
  }

  function buildSmallTower(x, z, stone, dark) {
    var t = makeBox(7, 13, 7, stone);
    t.position.set(x, 6.5, z);
    fortressGroup.add(t);
    // crenellations
    for (var sc = -1; sc <= 1; sc++) {
      var sc1 = makeBox(2, 2.5, 2, dark);
      sc1.position.set(x + sc * 2.5, 14, z - 3.5);
      fortressGroup.add(sc1);
      var sc2 = makeBox(2, 2.5, 2, dark);
      sc2.position.set(x + sc * 2.5, 14, z + 3.5);
      fortressGroup.add(sc2);
    }
  }

  function buildGreatHall() {
    var HALL_STONE = 0x887766;

    // Main hall body
    var hall = makeBox(24, 10, 18, HALL_STONE);
    hall.position.set(-5, 5, -8);
    fortressGroup.add(hall);

    // Hall roof (pitched, approximate with box + cone-like ridge)
    var roofBase = makeBox(25, 1, 19, 0x554433);
    roofBase.position.set(-5, 10.5, -8);
    fortressGroup.add(roofBase);
    var ridgeL = makeBox(25, 0.5, 0.5, 0x443322);
    ridgeL.position.set(-5, 13, -8);
    fortressGroup.add(ridgeL);
    // Roof sides (angled appearance with thin boxes)
    var roofSideL = makeBox(25, 3, 0.5, 0x665544);
    roofSideL.rotation.z = 0.5;
    roofSideL.position.set(-5, 11.5, -16.8);
    fortressGroup.add(roofSideL);
    var roofSideR = makeBox(25, 3, 0.5, 0x665544);
    roofSideR.rotation.z = -0.5;
    roofSideR.position.set(-5, 11.5, 0.8);
    fortressGroup.add(roofSideR);

    // Long table — series of boxes
    var tableTop = makeBox(14, 0.5, 3, 0x995533);
    tableTop.position.set(-5, 1.5, -8);
    fortressGroup.add(tableTop);
    // Table legs
    for (var tl = -6; tl <= 6; tl += 4) {
      var tleg = makeBox(0.4, 1.5, 0.4, 0x774422);
      tleg.position.set(-5 + tl, 0.75, -9);
      fortressGroup.add(tleg);
      var tleg2 = makeBox(0.4, 1.5, 0.4, 0x774422);
      tleg2.position.set(-5 + tl, 0.75, -7);
      fortressGroup.add(tleg2);
    }

    // Benches along table
    var bench1 = makeBox(14, 0.3, 1, 0x886644);
    bench1.position.set(-5, 1.15, -10.5);
    fortressGroup.add(bench1);
    var bench2 = makeBox(14, 0.3, 1, 0x886644);
    bench2.position.set(-5, 1.15, -5.5);
    fortressGroup.add(bench2);

    // Fireplace — cylinder chimney + box hearth
    var hearth = makeBox(4, 3, 3, 0x665544);
    hearth.position.set(-16.5, 1.5, -8);
    fortressGroup.add(hearth);
    var chimney = makeCylinder(0.8, 1, 8, 8, 0x666655);
    chimney.position.set(-16.5, 8, -8);
    fortressGroup.add(chimney);
    // Fire glow (orange box inside hearth)
    var fireGlow = makeBox(2, 1.5, 1.5, 0xff6622, 0.8, true);
    fireGlow.position.set(-16.5, 0.75, -8);
    fortressGroup.add(fireGlow);

    // Hall windows (arrow slits + LineSegments cross)
    var hallWinPts = [
      // front face slits
      [-12, 5, 2], [-12, 9, 2],
      [-12.3, 7, 2], [-11.7, 7, 2],
      [2, 5, 2], [2, 9, 2],
      [1.7, 7, 2], [2.3, 7, 2]
    ];
    var hwFlat = [];
    for (var hwi = 0; hwi < hallWinPts.length; hwi++) {
      hwFlat.push(hallWinPts[hwi][0], hallWinPts[hwi][1], hallWinPts[hwi][2]);
    }
    var hwGeo = new THREE.BufferGeometry();
    hwGeo.setAttribute('position', new THREE.Float32BufferAttribute(hwFlat, 3));
    var hwMat = new THREE.LineBasicMaterial({ color: 0x222211 });
    fortressGroup.add(new THREE.LineSegments(hwGeo, hwMat));

    // Torches on walls (cylinder + cone flame)
    buildTorch(-17, 6, -4);
    buildTorch(-17, 6, -12);
    buildTorch(6, 6, -4);
    buildTorch(6, 6, -12);
  }

  function buildTorch(x, y, z) {
    var handle = makeCylinder(0.1, 0.1, 0.8, 6, 0x664422);
    handle.position.set(x, y, z);
    fortressGroup.add(handle);
    var flame = makeCone(0.15, 0.5, 6, 0xff8800);
    flame.position.set(x, y + 0.65, z);
    fortressGroup.add(flame);
  }

  function buildKeep() {
    // 4-story box tower
    var KEEP_STONE = 0x776655;
    var KEEP_DARK = 0x554433;

    // Foundation
    var keepFoundation = makeBox(14, 2, 14, 0x665544);
    keepFoundation.position.set(0, 1, -32);
    fortressGroup.add(keepFoundation);

    // Tower body (full height)
    var keepBody = makeBox(12, 32, 12, KEEP_STONE);
    keepBody.position.set(0, 18, -32);
    fortressGroup.add(keepBody);

    // Buttresses
    for (var bx = -1; bx <= 1; bx += 2) {
      var butt = makeBox(2, 20, 3, KEEP_DARK);
      butt.position.set(bx * 7, 10, -32);
      fortressGroup.add(butt);
    }

    // Keep crenellations
    for (var kc = -5; kc <= 5; kc += 2.5) {
      var kcren = makeBox(1.8, 2.5, 1.8, KEEP_DARK);
      kcren.position.set(kc, 35, -26.5);
      fortressGroup.add(kcren);
      var kcren2 = makeBox(1.8, 2.5, 1.8, KEEP_DARK);
      kcren2.position.set(kc, 35, -37.5);
      fortressGroup.add(kcren2);
      var kcren3 = makeBox(1.8, 2.5, 1.8, KEEP_DARK);
      kcren3.position.set(-6.5, 35, kc - 32);
      fortressGroup.add(kcren3);
      var kcren4 = makeBox(1.8, 2.5, 1.8, KEEP_DARK);
      kcren4.position.set(6.5, 35, kc - 32);
      fortressGroup.add(kcren4);
    }

    // Each floor: floor plate + staircase marker
    var FLOOR_Y_VALS = [2, 10, 18, 26];
    for (var kf = 0; kf < 4; kf++) {
      var fy = FLOOR_Y_VALS[kf];
      var floorPlate = makeBox(11, 0.5, 11, 0x887766);
      floorPlate.position.set(0, fy + 0.25, -32);
      fortressGroup.add(floorPlate);
      keepFloorMeshes.push(floorPlate);

      // Stair block on each floor
      var stair = makeBox(2, 1.5, 1.5, 0x665544);
      stair.position.set(4, fy + 1, -28);
      fortressGroup.add(stair);
      staircaseRefs.push({ mesh: stair, floor: kf, x: 4, y: fy + 1, z: -28 });

      // Torch on each floor
      buildTorch(-5, fy + 5, -28);
    }

    // Throne room — floor 4 (top)
    buildThroneRoom(26);

    // Flag zone marker (flat yellow disk)
    var flagZone = makeCylinder(1.5, 1.5, 0.2, 12, 0xffdd00);
    flagZone.position.set(0, 34.5, -32);
    fortressGroup.add(flagZone);

    // Flag pole
    flagPole = makeBox(0.2, 4, 0.2, 0x885522);
    flagPole.position.set(0, 36, -32);
    flagPole.visible = false;
    fortressGroup.add(flagPole);
    flagMesh = makeBox(2.5, 1.5, 0.1, 0xff2200);
    flagMesh.position.set(1.25, 37.5, -32);
    flagMesh.visible = false;
    fortressGroup.add(flagMesh);
  }

  function buildThroneRoom(floorY) {
    // Throne
    var throneBase = makeBox(3, 2, 2, 0x885522);
    throneBase.position.set(0, floorY + 1, -37);
    fortressGroup.add(throneBase);
    var throneBack = makeBox(3, 3, 0.5, 0x774411);
    throneBack.position.set(0, floorY + 2.5, -37.75);
    fortressGroup.add(throneBack);
    var throneArmL = makeBox(0.5, 1, 2, 0x885522);
    throneArmL.position.set(-1.75, floorY + 2, -37);
    fortressGroup.add(throneArmL);
    var throneArmR = makeBox(0.5, 1, 2, 0x885522);
    throneArmR.position.set(1.75, floorY + 2, -37);
    fortressGroup.add(throneArmR);

    // Stained glass windows — LineSegments diamond grid
    var sgPts = [];
    // Left window
    for (var sg = 0; sg < 4; sg++) {
      sgPts.push(-5 + sg, floorY + 3, -38, -4.5 + sg, floorY + 5, -38);
      sgPts.push(-5 + sg, floorY + 5, -38, -4.5 + sg, floorY + 3, -38);
    }
    // Right window
    for (var sg2 = 0; sg2 < 4; sg2++) {
      sgPts.push(1 + sg2, floorY + 3, -38, 1.5 + sg2, floorY + 5, -38);
      sgPts.push(1 + sg2, floorY + 5, -38, 1.5 + sg2, floorY + 3, -38);
    }
    var sgGeo = new THREE.BufferGeometry();
    sgGeo.setAttribute('position', new THREE.Float32BufferAttribute(sgPts, 3));
    var sgMat = new THREE.LineBasicMaterial({ color: 0xff8833 });
    fortressGroup.add(new THREE.LineSegments(sgGeo, sgMat));

    // Rug
    var rug = makeBox(3, 0.1, 6, 0x880000);
    rug.position.set(0, floorY + 0.55, -33);
    fortressGroup.add(rug);

    // Candle holders
    buildTorch(-4, floorY + 1, -35);
    buildTorch(4, floorY + 1, -35);
  }

  function buildRamProp() {
    // Battering ram — a large cylinder + box handle on a cart
    var ramLog = makeCylinder(0.6, 0.8, 7, 10, 0x886633);
    ramLog.rotation.z = Math.PI / 2;
    ramLog.position.set(0, 1.5, 55);
    fortressGroup.add(ramLog);

    // Ram tip (iron head)
    var ramHead = makeSphere(0.9, 0x666666);
    ramHead.position.set(3.5, 1.5, 55);
    fortressGroup.add(ramHead);

    // Ram support frame
    var ramFrameL = makeBox(0.3, 2.5, 7, 0x774422);
    ramFrameL.position.set(-1.5, 1.5, 55);
    fortressGroup.add(ramFrameL);
    var ramFrameR = makeBox(0.3, 2.5, 7, 0x774422);
    ramFrameR.position.set(1.5, 1.5, 55);
    fortressGroup.add(ramFrameR);

    // Ram cart wheels
    var rw1 = makeCylinder(0.9, 0.9, 0.4, 10, 0x443311);
    rw1.rotation.x = Math.PI / 2;
    rw1.position.set(-1.5, 0.9, 52);
    fortressGroup.add(rw1);
    var rw2 = makeCylinder(0.9, 0.9, 0.4, 10, 0x443311);
    rw2.rotation.x = Math.PI / 2;
    rw2.position.set(1.5, 0.9, 52);
    fortressGroup.add(rw2);

    // Store the ram mesh reference for pickup detection
    ramMesh = ramLog;
  }

  // ------- Enemy Spawning -------

  function spawnEnemies() {
    // 16 mercenaries — chain mail + AK47
    var mercPositions = [
      { x: -30, y: 1.5, z: 30, floor: 0 },
      { x: 30, y: 1.5, z: 30, floor: 0 },
      { x: -15, y: 1.5, z: 20, floor: 0 },
      { x: 15, y: 1.5, z: 20, floor: 0 },
      { x: 0, y: 1.5, z: 10, floor: 0 },
      { x: -25, y: 1.5, z: 5, floor: 0 },
      { x: 25, y: 1.5, z: 5, floor: 0 },
      { x: -10, y: 1.5, z: -5, floor: 0 },
      { x: 10, y: 1.5, z: -5, floor: 0 },
      { x: 0, y: 1.5, z: -15, floor: 0 },
      // Keep floors 1-3
      { x: 3, y: 11, z: -30, floor: 1 },
      { x: -3, y: 11, z: -30, floor: 1 },
      { x: 3, y: 19, z: -30, floor: 2 },
      { x: -3, y: 19, z: -30, floor: 2 },
      { x: 3, y: 27, z: -30, floor: 3 },
      { x: -3, y: 27, z: -30, floor: 3 }
    ];

    for (var mi = 0; mi < mercPositions.length; mi++) {
      var mp = mercPositions[mi];
      var enemy = spawnMercenary(mp.x, mp.y, mp.z, mp.floor);
      enemies.push(enemy);
    }

    // 6 crossbow archers — on walls and towers
    var archerPositions = [
      { x: 36, y: 16, z: -36, onWall: true },   // NE tower
      { x: -36, y: 16, z: -36, onWall: true },  // NW tower
      { x: 36, y: 16, z: 36, onWall: true },    // SE tower
      { x: -36, y: 16, z: 36, onWall: true },   // SW tower
      { x: 20, y: 9, z: -22, onWall: true },    // inner wall east
      { x: -20, y: 9, z: -22, onWall: true }    // inner wall west
    ];

    for (var ai = 0; ai < archerPositions.length; ai++) {
      var ap = archerPositions[ai];
      var archer = spawnArcher(ap.x, ap.y, ap.z, ap.onWall);
      enemies.push(archer);
    }

    // Warlord Vance — throne room floor 4
    spawnVance();
  }

  function makeEnemyMesh(color, h) {
    var grp = new THREE.Group();
    // Body
    var body = makeBox(1, h * 0.5, 0.7, color);
    body.position.y = h * 0.25;
    grp.add(body);
    // Head
    var head = makeBox(0.7, 0.7, 0.7, color);
    head.position.y = h * 0.5 + 0.35;
    grp.add(head);
    // Chain mail detail (LineSegments on body)
    var chainPts = [];
    for (var cr = 0; cr < 4; cr++) {
      chainPts.push(-0.5, h * 0.1 + cr * 0.2, 0.36, 0.5, h * 0.1 + cr * 0.2, 0.36);
    }
    var chainGeo = new THREE.BufferGeometry();
    chainGeo.setAttribute('position', new THREE.Float32BufferAttribute(chainPts, 3));
    var chainMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    grp.add(new THREE.LineSegments(chainGeo, chainMat));
    return grp;
  }

  function spawnMercenary(x, y, z, floor) {
    var mesh = makeEnemyMesh(0x554433, 2.2);
    mesh.position.set(x, y - 1.5, z);
    scene.add(mesh);
    return {
      type: ENEMY_TYPES.MERCENARY,
      mesh: mesh,
      x: x, y: y, z: z,
      hp: 80,
      alive: true,
      floor: floor,
      shootCooldown: Math.random() * 2,
      SHOOT_CD: 0.8 + Math.random() * 0.5,
      aggroRange: 25,
      damage: 12,
      rangeMultiplier: 1.0
    };
  }

  function spawnArcher(x, y, z, onWall) {
    var mesh = makeEnemyMesh(0x443322, 2.0);
    mesh.position.set(x, y - 1.5, z);
    scene.add(mesh);
    return {
      type: ENEMY_TYPES.ARCHER,
      mesh: mesh,
      x: x, y: y, z: z,
      hp: 75,
      alive: true,
      floor: -1,
      shootCooldown: Math.random() * 3 + 1.5,
      SHOOT_CD: 3.5 + Math.random(),  // slow reload, high accuracy
      aggroRange: 50,
      damage: 18,
      rangeMultiplier: 2.0,
      onWall: !!onWall
    };
  }

  function spawnVance() {
    // Large armor-clad figure in throne room
    var vGrp = new THREE.Group();
    // Armored body — larger, darker
    var vBody = makeBox(1.6, 1.6, 1, 0x332211);
    vBody.position.y = 0.8;
    vGrp.add(vBody);
    // Shoulder pauldrons
    var vShouldL = makeBox(0.6, 0.5, 1, 0x443322);
    vShouldL.position.set(-1.1, 1.3, 0);
    vGrp.add(vShouldL);
    var vShouldR = makeBox(0.6, 0.5, 1, 0x443322);
    vShouldR.position.set(1.1, 1.3, 0);
    vGrp.add(vShouldR);
    // Head with visor
    var vHead = makeBox(0.9, 0.9, 0.9, 0x443322);
    vHead.position.y = 2;
    vGrp.add(vHead);
    // Visor slit
    var vVisor = makeBox(0.7, 0.15, 0.2, 0x111100);
    vVisor.position.set(0, 2.1, 0.55);
    vGrp.add(vVisor);
    // Shotgun prop
    var shotgun = makeBox(0.15, 0.15, 1.8, 0x333333);
    shotgun.position.set(0.9, 1.2, 0.5);
    vGrp.add(shotgun);

    vGrp.position.set(0, 26, -37);
    scene.add(vGrp);
    vanceMesh = vGrp;
    vanceHP = VANCE_MAX_HP;
    vanceAlive = true;
  }

  // ------- HUD -------

  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'fortress-breach-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#e8d5a0',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(20,10,5,0.75)',
      'padding:10px 14px',
      'border-radius:6px',
      'border:1px solid #887755',
      'pointer-events:none',
      'z-index:9999',
      'line-height:1.7'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl || !active) return;
    var gateStatus = ramUsed ? 'RAMMED' : (gateBreached ? 'BREACHED' : (drawbridgeLowered ? (portcullisOpen ? 'OPEN' : 'PORTCULLIS SEALED') : 'SEALED'));
    var courtyardPct = Math.min(100, Math.floor((outerCourtyardKills / OUTER_COURTYARD_ENEMIES) * 100));
    var keepFloorStr = currentKeepFloor === 0 ? 'COURTYARD' : ('KEEP FL.' + currentKeepFloor);
    var vanceStr = vanceAlive ? Math.max(0, vanceHP) + ' / ' + VANCE_MAX_HP : 'SLAIN';
    var flagStr = flagPlanted ? 'PLANTED' : (nearFlagZone && vanceAlive === false ? 'HOLD E' : '--');

    hudEl.innerHTML = [
      '<b>FORTRESS BREACH</b>',
      'HP: <b>' + playerHP + '</b>',
      'Gate: <b>' + gateStatus + '</b>' + (lockHits > 0 && !drawbridgeLowered ? ' [' + lockHits + '/' + LOCK_HITS_REQUIRED + ']' : ''),
      'Courtyard: <b>' + courtyardPct + '%</b>',
      'Position: <b>' + keepFloorStr + '</b>',
      'Warlord Vance: <b>' + vanceStr + '</b>',
      'Flag: <b>' + flagStr + '</b>',
      (nearRam && !ramPickedUp ? '<span style="color:#ffcc44">[E] Pick up battering ram</span>' : ''),
      (carryingRam && !ramUsed ? '<span style="color:#ffcc44">[E near gate] Use ram</span>' : ''),
      (nearStairs ? '<span style="color:#ffcc44">[E] Climb to next floor</span>' : ''),
      (gameWon ? '<span style="color:#44ff44; font-size:16px">FORTRESS TAKEN!</span>' : ''),
      (gameOver ? '<span style="color:#ff4444; font-size:16px">YOU FELL</span>' : '')
    ].join('<br>');
  }

  // ------- Player Movement -------

  function handleMovement(dt) {
    var speed = 8;
    var yaw = playerYaw;

    var fwd = { x: Math.sin(yaw), z: -Math.cos(yaw) };
    var right = { x: Math.cos(yaw), z: Math.sin(yaw) };

    var moveX = 0, moveZ = 0;
    if (keys['w'] || keys['arrowup']) { moveX += fwd.x; moveZ += fwd.z; }
    if (keys['s'] || keys['arrowdown']) { moveX -= fwd.x; moveZ -= fwd.z; }
    if (keys['a'] || keys['arrowleft']) { moveX -= right.x; moveZ -= right.z; }
    if (keys['d'] || keys['arrowright']) { moveX += right.x; moveZ += right.z; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    playerPos.x += moveX * speed * dt;
    playerPos.z += moveZ * speed * dt;

    // Gravity
    if (!onGround) {
      playerVel.y -= 18 * dt;
    }
    playerPos.y += playerVel.y * dt;

    // Ground check — simplified flat ground at y=2
    var groundY = getGroundY(playerPos.x, playerPos.z);
    if (playerPos.y <= groundY) {
      playerPos.y = groundY;
      playerVel.y = 0;
      onGround = true;
    } else {
      onGround = false;
    }

    // Jump
    if ((keys[' '] || keys['space']) && onGround) {
      playerVel.y = 7;
      onGround = false;
    }

    // Clamp to world bounds
    playerPos.x = Math.max(-45, Math.min(45, playerPos.x));
    playerPos.z = Math.max(-45, Math.min(70, playerPos.z));

    updateCamera();
  }

  function getGroundY(x, z) {
    // Keep floors
    if (x > -7 && x < 7 && z < -26 && z > -39) {
      if (currentKeepFloor >= 4) return 34;
      if (currentKeepFloor >= 3) return 26;
      if (currentKeepFloor >= 2) return 18;
      if (currentKeepFloor >= 1) return 10;
    }
    // Outer wall walkway
    if (Math.abs(z + 40) < 3 && Math.abs(x) < 38) return 14;
    if (Math.abs(x - 40) < 3 && Math.abs(z) < 38) return 14;
    if (Math.abs(x + 40) < 3 && Math.abs(z) < 38) return 14;
    return 2;
  }

  function updateCamera() {
    camera.position.set(playerPos.x, playerPos.y + 0.8, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;
  }

  // ------- Gate Mechanics -------

  function checkGateMechanics() {
    // Check proximity to ram
    var ramX = 0, ramZ = 55;
    var dRam = dist2D(playerPos.x, playerPos.z, ramX, ramZ);
    nearRam = (dRam < 4 && !ramPickedUp && !ramUsed);

    // Use ram near gate
    if (carryingRam) {
      var dGate = dist2D(playerPos.x, playerPos.z, 0, 44);
      if (dGate < 5) {
        nearRam = false;
        // Show use prompt handled in HUD
        if (keys['e'] && !ramUsed) {
          ramUsed = true;
          carryingRam = false;
          gateBreached = true;
          drawbridgeLowered = true;
          portcullisOpen = true;
          if (portcullisMesh) portcullisMesh.visible = false;
          if (drawbridgeMesh) {
            drawbridgeMesh.position.y = -0.5;
            drawbridgeMesh.position.z = 46;
          }
        }
      }
    }

    // Drawbridge lowers when lock shot 3 times
    if (lockHits >= LOCK_HITS_REQUIRED && !drawbridgeLowered) {
      drawbridgeLowered = true;
      if (drawbridgeMesh) {
        drawbridgeMesh.position.y = -0.5;
      }
    }
    // Portcullis opens when control shot
    if (portcullisControlHits >= PORTCULLIS_HITS_REQUIRED && !portcullisOpen) {
      portcullisOpen = true;
      gateBreached = true;
      if (portcullisMesh) portcullisMesh.visible = false;
    }
  }

  // ------- Keep Floor Progression -------

  function checkKeepFloors() {
    var inKeep = (playerPos.x > -7 && playerPos.x < 7 && playerPos.z < -26 && playerPos.z > -40);

    if (inKeep && currentKeepFloor < 4) {
      // Find the staircase for the current floor
      var stairRef = staircaseRefs[currentKeepFloor];
      if (stairRef) {
        var ds = dist3D(playerPos, { x: stairRef.x, y: stairRef.y, z: stairRef.z });
        var floorCleared = isFloorCleared(currentKeepFloor);
        nearStairs = (ds < 4 && floorCleared && currentKeepFloor < 4);
        if (nearStairs && keys['e']) {
          currentKeepFloor++;
        }
      }
    } else {
      nearStairs = false;
    }

    // Check if near flag zone (throne room)
    if (currentKeepFloor >= 4 && !flagPlanted && !vanceAlive) {
      var dFlag = dist2D(playerPos.x, playerPos.z, 0, -32);
      nearFlagZone = (dFlag < 3 && playerPos.y > 32);
      if (nearFlagZone && keys['e']) {
        holdETimer += 0.016; // approx dt fallback
        if (holdETimer >= HOLD_E_DURATION) {
          flagPlanted = true;
          holdETimer = 0;
          if (flagPole) flagPole.visible = true;
          if (flagMesh) flagMesh.visible = true;
          checkWinCondition();
        }
      } else {
        holdETimer = 0;
      }
    } else {
      nearFlagZone = false;
    }
  }

  function isFloorCleared(floor) {
    if (floor === 0) return outerCourtyardCleared;
    return keepFloorsCleared[floor - 1];
  }

  function checkWinCondition() {
    if (flagPlanted && !vanceAlive) {
      gameWon = true;
    }
  }

  // ------- Shooting -------

  function shoot() {
    var dir = {
      x: Math.sin(playerYaw) * Math.cos(playerPitch),
      y: -Math.sin(playerPitch),
      z: -Math.cos(playerYaw) * Math.cos(playerPitch)
    };
    var origin = { x: playerPos.x, y: playerPos.y + 0.8, z: playerPos.z };

    // Spawn bullet particle
    var bp = makeBox(0.1, 0.1, 0.5, 0xffdd00);
    bp.position.set(origin.x, origin.y, origin.z);
    scene.add(bp);
    bulletParticles.push({
      mesh: bp,
      dx: dir.x * 60,
      dy: dir.y * 60,
      dz: dir.z * 60,
      life: 1.2
    });

    // Raycast against enemies
    var bestDist = 80;
    var hitEnemy = null;
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en.alive) continue;
      var td = rayHitSphere(origin, dir, en, 1.2);
      if (td > 0 && td < bestDist) {
        bestDist = td;
        hitEnemy = en;
      }
    }

    if (hitEnemy) {
      hitEnemy.hp -= 25;
      showHitSpark(hitEnemy.x, hitEnemy.y, hitEnemy.z);
      if (hitEnemy.hp <= 0) killEnemy(hitEnemy);
    }

    // Raycast against interactive objects
    checkShootInteractives(origin, dir);
  }

  function checkShootInteractives(origin, dir) {
    // Lock mechanism
    if (lockMesh && lockHits < LOCK_HITS_REQUIRED) {
      var lp = { x: lockMesh.position.x, y: lockMesh.position.y + 0.75, z: lockMesh.position.z };
      var ld = rayHitBox(origin, dir, lp, 1, 1.5, 1);
      if (ld > 0 && ld < 40) {
        lockHits++;
        showHitSpark(lp.x, lp.y, lp.z);
        if (lockHits >= LOCK_HITS_REQUIRED) {
          lockMesh.material.color.setHex(0x333311);
        }
      }
    }

    // Portcullis control
    if (portcullisControlMesh && portcullisControlHits < PORTCULLIS_HITS_REQUIRED) {
      var pp = { x: portcullisControlMesh.position.x, y: portcullisControlMesh.position.y + 0.6, z: portcullisControlMesh.position.z };
      var pd = rayHitBox(origin, dir, pp, 0.8, 1.2, 0.8);
      if (pd > 0 && pd < 40) {
        portcullisControlHits++;
        showHitSpark(pp.x, pp.y, pp.z);
      }
    }
  }

  function rayHitSphere(origin, dir, target, radius) {
    var oc = {
      x: origin.x - target.x,
      y: origin.y - target.y,
      z: origin.z - target.z
    };
    var b = 2 * (oc.x * dir.x + oc.y * dir.y + oc.z * dir.z);
    var c = oc.x * oc.x + oc.y * oc.y + oc.z * oc.z - radius * radius;
    var disc = b * b - 4 * c;
    if (disc < 0) return -1;
    var t = (-b - Math.sqrt(disc)) / 2;
    return t > 0 ? t : -1;
  }

  function rayHitBox(origin, dir, center, hw, hh, hd) {
    // Slab method AABB
    var tmin = -Infinity, tmax = Infinity;
    var axes = [
      { o: origin.x - center.x, d: dir.x, h: hw / 2 },
      { o: origin.y - center.y, d: dir.y, h: hh / 2 },
      { o: origin.z - center.z, d: dir.z, h: hd / 2 }
    ];
    for (var ai = 0; ai < 3; ai++) {
      var a = axes[ai];
      if (Math.abs(a.d) < 1e-8) {
        if (Math.abs(a.o) > a.h) return -1;
      } else {
        var t1 = (-a.h - a.o) / a.d;
        var t2 = (a.h - a.o) / a.d;
        if (t1 > t2) { var tmp = t1; t1 = t2; t2 = tmp; }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return -1;
      }
    }
    return tmin > 0 ? tmin : -1;
  }

  function showHitSpark(x, y, z) {
    var spark = makeBox(0.3, 0.3, 0.3, 0xffaa00);
    spark.position.set(x, y, z);
    scene.add(spark);
    bulletParticles.push({ mesh: spark, dx: 0, dy: 2, dz: 0, life: 0.3, isSpark: true });
  }

  function killEnemy(en) {
    en.alive = false;
    en.mesh.visible = false;

    // Track courtyard kills
    if (en.floor === 0) {
      outerCourtyardKills++;
      if (outerCourtyardKills >= OUTER_COURTYARD_ENEMIES) {
        outerCourtyardCleared = true;
      }
    }
    // Track keep floor kills
    if (en.floor >= 1 && en.floor <= 4) {
      keepFloorsCleared[en.floor - 1] = isKeepFloorCleared(en.floor);
    }

    // Drop death debris visual
    var corpse = makeBox(0.8, 0.2, 0.8, en.type === ENEMY_TYPES.WARLORD ? 0x332211 : 0x554433);
    corpse.position.set(en.x, en.y - 1, en.z);
    scene.add(corpse);
  }

  function isKeepFloorCleared(floor) {
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].floor === floor && enemies[i].alive) return false;
    }
    return true;
  }

  // ------- Enemy AI -------

  function updateEnemies(dt) {
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en.alive) continue;

      // Don't activate keep enemies before player reaches their floor
      if (en.floor > currentKeepFloor && en.floor > 0) continue;

      var dx = playerPos.x - en.x;
      var dy = playerPos.y - en.y;
      var dz = playerPos.z - en.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var effectiveRange = en.aggroRange * en.rangeMultiplier;

      if (dist < effectiveRange) {
        // Face player
        en.mesh.rotation.y = Math.atan2(dx, dz);

        // Shoot at player
        en.shootCooldown -= dt;
        if (en.shootCooldown <= 0) {
          en.shootCooldown = en.SHOOT_CD;
          var hitChance = en.type === ENEMY_TYPES.ARCHER ? 0.55 : 0.35;
          if (Math.random() < hitChance) {
            playerHP -= en.damage;
            if (playerHP <= 0) {
              playerHP = 0;
              gameOver = true;
            }
          }
          // Bullet tracer from enemy to player
          var eBullet = makeBox(0.08, 0.08, 0.4, 0xff6600);
          eBullet.position.set(en.x, en.y, en.z);
          scene.add(eBullet);
          bulletParticles.push({
            mesh: eBullet,
            dx: dx / dist * 50,
            dy: dy / dist * 50,
            dz: dz / dist * 50,
            life: 0.4
          });
        }

        // Mercenaries patrol / advance (not wall-mounted archers)
        if (en.type === ENEMY_TYPES.MERCENARY && dist > 5) {
          var speed = 2.5;
          en.x += (dx / dist) * speed * dt;
          en.z += (dz / dist) * speed * dt;
          en.mesh.position.set(en.x, en.y - 1.5, en.z);
        }
      }
    }

    // Warlord Vance AI
    updateVance(dt);

    // Rappel archers spawned at 50% HP
    updateRappelArchers(dt);
  }

  function updateVance(dt) {
    if (!vanceAlive || !vanceMesh) return;

    var dx = playerPos.x - 0;
    var dz = playerPos.z - (-37);
    var dist = Math.sqrt(dx * dx + dz * dz);

    // Phase 2 trigger
    if (vanceHP <= VANCE_MAX_HP * 0.5 && !vancePhase2) {
      vancePhase2 = true;
      spawnRappelArchers();
    }

    // Vance shoots player
    vanceShootCooldown -= dt;
    if (vanceShootCooldown <= 0 && playerPos.y > 30) {
      vanceShootCooldown = VANCE_SHOOT_CD;
      // Shotgun spread — 3 pellets
      for (var sp = 0; sp < 3; sp++) {
        var hitChance = 0.4;
        if (Math.random() < hitChance) {
          var pelletDmg = vancePhase2 ? 22 : 15;
          playerHP -= pelletDmg;
          if (playerHP <= 0) { playerHP = 0; gameOver = true; }
        }
      }
    }

    // Vance face player
    if (playerPos.y > 30) {
      var pdx = playerPos.x - vanceMesh.position.x;
      var pdz = playerPos.z - vanceMesh.position.z;
      vanceMesh.rotation.y = Math.atan2(pdx, pdz);
    }

    // Hit detection — player shooting Vance
    // (handled via shoot() -> enemies loop, but Vance is separate)
    // We check in shootVance if player shoots in Vance direction
  }

  function spawnRappelArchers() {
    if (rappelArchersSpawned) return;
    rappelArchersSpawned = true;

    // Spawn 3 archers rappelling from ceiling of throne room
    for (var ra = 0; ra < 3; ra++) {
      var raX = (ra - 1) * 3;
      var raY = 34;
      var raZ = -32;

      var raMesh = makeEnemyMesh(0x443322, 2.0);
      raMesh.position.set(raX, raY - 1.5, raZ);
      scene.add(raMesh);

      var rappelArcher = {
        type: ENEMY_TYPES.ARCHER,
        mesh: raMesh,
        x: raX, y: raY, z: raZ,
        hp: 75,
        alive: true,
        floor: 4,
        shootCooldown: 1 + ra * 0.5,
        SHOOT_CD: 3.5,
        aggroRange: 20,
        damage: 18,
        rangeMultiplier: 1.5,
        onWall: false,
        rappeling: true,
        rappelY: raY,
        rappelTargetY: 27
      };
      enemies.push(rappelArcher);
      vanceRappelArchers.push(rappelArcher);
    }
  }

  function updateRappelArchers(dt) {
    for (var ri = 0; ri < vanceRappelArchers.length; ri++) {
      var ra = vanceRappelArchers[ri];
      if (!ra.alive || !ra.rappeling) continue;
      if (ra.y > ra.rappelTargetY) {
        ra.y -= 4 * dt;
        ra.mesh.position.y = ra.y - 1.5;
      } else {
        ra.rappeling = false;
      }
    }
  }

  // ------- Murder Holes -------

  function checkMurderHoles() {
    for (var mhi = 0; mhi < murderHoles.length; mhi++) {
      var mh = murderHoles[mhi];
      if (mh.triggered) continue;

      // Check if player is near a live enemy in vicinity of murder hole
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en.alive) continue;
        var de = dist2D(en.x, en.z, mh.x, mh.z);
        if (de < 6) {
          mh.triggered = true;
          triggerMurderHole(mh);
          break;
        }
      }
    }
  }

  function triggerMurderHole(mh) {
    // Drop 4 debris blocks
    for (var db = 0; db < 4; db++) {
      var debris = makeBox(1, 1, 1, 0x666655);
      var dbX = mh.x + (Math.random() - 0.5) * 5;
      var dbZ = mh.z + (Math.random() - 0.5) * 5;
      debris.position.set(dbX, mh.y, dbZ);
      scene.add(debris);
      debrisParticles.push({
        mesh: debris,
        x: dbX, y: mh.y, z: dbZ,
        vy: 0,
        landed: false
      });
    }
  }

  function updateDebris(dt) {
    for (var di = 0; di < debrisParticles.length; di++) {
      var db = debrisParticles[di];
      if (db.landed) continue;

      db.vy -= 15 * dt;
      db.y += db.vy * dt;
      db.mesh.position.y = db.y;

      if (db.y <= 2) {
        db.y = 2;
        db.vy = 0;
        db.landed = true;
        // Damage player if nearby
        var dPl = dist2D(playerPos.x, playerPos.z, db.x, db.z);
        if (dPl < 2) {
          playerHP -= 25;
          if (playerHP <= 0) { playerHP = 0; gameOver = true; }
        }
      }
    }
  }

  // ------- Bullet particle update -------

  function updateBullets(dt) {
    for (var bi = bulletParticles.length - 1; bi >= 0; bi--) {
      var bp = bulletParticles[bi];
      bp.life -= dt;
      if (bp.life <= 0) {
        scene.remove(bp.mesh);
        bulletParticles.splice(bi, 1);
        continue;
      }
      if (!bp.isSpark) {
        bp.mesh.position.x += bp.dx * dt;
        bp.mesh.position.y += bp.dy * dt;
        bp.mesh.position.z += bp.dz * dt;
      }
    }
  }

  // ------- Shoot Vance (special boss raycast) -------

  function checkShootVance(origin, dir) {
    if (!vanceAlive || !vanceMesh) return;
    // Only shoot if player is on keep floor 4
    if (currentKeepFloor < 4) return;
    var vCenter = { x: 0, y: 28, z: -37 };
    var vd = rayHitBox(origin, dir, vCenter, 1.8, 3, 1.2);
    if (vd > 0 && vd < 30) {
      vanceHP -= 35;
      showHitSpark(vCenter.x, vCenter.y, vCenter.z);
      if (vanceHP <= 0) {
        vanceHP = 0;
        vanceAlive = false;
        if (vanceMesh) {
          // Topple Vance
          vanceMesh.rotation.z = Math.PI / 2;
          vanceMesh.position.y -= 1;
        }
      }
    }
  }

  // ------- Ram pickup -------

  function checkRamInteraction() {
    if (nearRam && keys['e'] && !ramPickedUp && !carryingRam) {
      ramPickedUp = true;
      carryingRam = true;
      // Hide the ram prop in the scene
      if (ramMesh) ramMesh.visible = false;
    }
  }

  // ------- Distance helpers -------

  function dist2D(x1, z1, x2, z2) {
    var dx = x1 - x2, dz = z1 - z2;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ------- Input -------

  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    if (!keys[k]) {
      keyTimestamps[k] = Date.now();
    }
    keys[k] = true;

    // Activation chord: F then B within 400ms
    if (k === 'b' && keyTimestamps['f'] && (Date.now() - keyTimestamps['f'] < 400)) {
      if (!active) {
        init();
      }
    }
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  function onMouseMove(e) {
    if (!active) return;
    mouseDX += e.movementX || 0;
    mouseDY += e.movementY || 0;
  }

  function onMouseDown(e) {
    if (!active) return;
    if (e.button === 0 && !gameOver && !gameWon) {
      if (shootCooldown <= 0) {
        var origin = { x: playerPos.x, y: playerPos.y + 0.8, z: playerPos.z };
        var dir = {
          x: Math.sin(playerYaw) * Math.cos(playerPitch),
          y: -Math.sin(playerPitch),
          z: -Math.cos(playerYaw) * Math.cos(playerPitch)
        };
        shoot();
        checkShootVance(origin, dir);
        shootCooldown = SHOOT_INTERVAL;
      }
    }
  }

  function onPointerLock() {
    document.body.requestPointerLock();
  }

  // ------- Scene Setup -------

  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1008);
    scene.fog = new THREE.Fog(0x1a1008, 40, 120);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 3, 62);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.domElement.id = 'fortress-breach-canvas';
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9998;cursor:crosshair;';
    document.body.appendChild(renderer.domElement);

    // Lighting
    var ambient = new THREE.AmbientLight(0x443322, 0.6);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffeedd, 0.9);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    // Torch point lights
    var torch1 = new THREE.PointLight(0xff8800, 1.2, 20);
    torch1.position.set(-5, 8, -8);
    scene.add(torch1);
    var torch2 = new THREE.PointLight(0xff8800, 0.8, 15);
    torch2.position.set(0, 8, -32);
    scene.add(torch2);
    var torch3 = new THREE.PointLight(0xff6600, 0.6, 12);
    torch3.position.set(0, 30, -32);
    scene.add(torch3);

    clock = new THREE.Clock();
  }

  function setupEventListeners() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onPointerLock);
    window.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ------- Crosshair -------

  function createCrosshair() {
    var ch = document.createElement('div');
    ch.id = 'fortress-breach-crosshair';
    ch.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px',
      'height:20px',
      'pointer-events:none',
      'z-index:10000'
    ].join(';');
    ch.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><line x1="10" y1="0" x2="10" y2="8" stroke="#e8d5a0" stroke-width="1.5"/><line x1="10" y1="12" x2="10" y2="20" stroke="#e8d5a0" stroke-width="1.5"/><line x1="0" y1="10" x2="8" y2="10" stroke="#e8d5a0" stroke-width="1.5"/><line x1="12" y1="10" x2="20" y2="10" stroke="#e8d5a0" stroke-width="1.5"/></svg>';
    document.body.appendChild(ch);
  }

  // ------- Game Over / Win screens -------

  function showEndScreen(won) {
    var ov = document.createElement('div');
    ov.id = 'fortress-breach-end';
    ov.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'background:rgba(10,5,2,0.88)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'color:#e8d5a0',
      'font-family:monospace',
      'z-index:10001'
    ].join(';');
    ov.innerHTML = won
      ? '<h1 style="font-size:2.5em;color:#ffdd44;">FORTRESS TAKEN</h1><p style="font-size:1.3em">The warlord has fallen. The flag flies over the keep.</p><p style="color:#aaa;margin-top:20px">Press R to play again</p>'
      : '<h1 style="font-size:2.5em;color:#ff4422;">YOU FELL</h1><p style="font-size:1.3em">The fortress holds.</p><p style="color:#aaa;margin-top:20px">Press R to play again</p>';
    document.body.appendChild(ov);

    var onR = function(e) {
      if (e.key.toLowerCase() === 'r') {
        document.removeEventListener('keydown', onR);
        var endEl = document.getElementById('fortress-breach-end');
        if (endEl) endEl.parentNode.removeChild(endEl);
        reset();
        startLoop();
      }
    };
    document.addEventListener('keydown', onR);
  }

  // ------- Main Loop -------

  var animId = null;

  function startLoop() {
    clock.start();
    function loop() {
      animId = requestAnimationFrame(loop);
      var dt = Math.min(clock.getDelta(), 0.05);

      // Mouse look
      var sensitivity = 0.002;
      playerYaw -= mouseDX * sensitivity;
      playerPitch -= mouseDY * sensitivity;
      playerPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, playerPitch));
      mouseDX = 0;
      mouseDY = 0;

      // Shoot cooldown
      if (shootCooldown > 0) shootCooldown -= dt;

      if (!gameOver && !gameWon) {
        handleMovement(dt);
        checkGateMechanics();
        checkKeepFloors();
        checkRamInteraction();
        checkMurderHoles();
        updateEnemies(dt);
        updateBullets(dt);
        updateDebris(dt);
      } else {
        updateBullets(dt);
        updateDebris(dt);
      }

      updateHUD();
      if (renderer) renderer.render(scene, camera);

      if ((gameOver || gameWon) && !document.getElementById('fortress-breach-end')) {
        showEndScreen(gameWon);
      }
    }
    loop();
  }

  // ------- Public API -------

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (active) return;
    active = true;

    setupScene();
    buildFortress();
    spawnEnemies();
    createHUD();
    createCrosshair();
    setupEventListeners();

    playerPos = { x: 0, y: 2, z: 62 };
    playerVel = { x: 0, y: 0, z: 0 };
    playerYaw = Math.PI;  // face north toward fortress
    playerPitch = 0;
    playerHP = 100;
    gameOver = false;
    gameWon = false;

    startLoop();
  }

  function update() {
    // No-op: game runs its own loop
  }

  function reset() {
    // Cleanup scene objects
    if (animId) { cancelAnimationFrame(animId); animId = null; }

    // Remove renderer
    var canvas = document.getElementById('fortress-breach-canvas');
    if (canvas) canvas.parentNode.removeChild(canvas);

    // Remove HUD
    var hud = document.getElementById('fortress-breach-hud');
    if (hud) hud.parentNode.removeChild(hud);

    // Remove crosshair
    var ch = document.getElementById('fortress-breach-crosshair');
    if (ch) ch.parentNode.removeChild(ch);

    // Remove event listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('resize', onResize);

    // Reset all state
    active = false;
    scene = null;
    camera = null;
    renderer = null;
    clock = null;
    keys = {};
    keyTimestamps = {};
    gameOver = false;
    gameWon = false;
    playerPos = { x: 0, y: 2, z: 62 };
    playerVel = { x: 0, y: 0, z: 0 };
    playerYaw = Math.PI;
    playerPitch = 0;
    playerHP = 100;
    onGround = true;
    bullets = [];
    bulletParticles = [];
    debrisParticles = [];
    enemies = [];
    vanceRappelArchers = [];
    rappelArchersSpawned = false;
    gateBreached = false;
    portcullisOpen = false;
    drawbridgeLowered = false;
    lockHits = 0;
    portcullisControlHits = 0;
    carryingRam = false;
    ramPickedUp = false;
    nearRam = false;
    ramUsed = false;
    currentKeepFloor = 0;
    keepFloorsCleared = [false, false, false, false];
    nearStairs = false;
    holdETimer = 0;
    flagPlanted = false;
    nearFlagZone = false;
    flagPlantTimer = 0;
    outerCourtyardKills = 0;
    outerCourtyardCleared = false;
    murderHoles = [];
    vanceAlive = true;
    vanceMesh = null;
    vanceHP = 550;
    vancePhase2 = false;
    shootCooldown = 0;
    vanceShootCooldown = 0;
    fortressGroup = null;
    portcullisMesh = null;
    drawbridgeMesh = null;
    lockMesh = null;
    portcullisControlMesh = null;
    ramMesh = null;
    flagMesh = null;
    flagPole = null;
    staircaseRefs = [];
    keepFloorMeshes = [];
    hudEl = null;
    mouseDX = 0;
    mouseDY = 0;

    // Re-init
    init();
  }

  // Register activation key listener globally immediately
  document.addEventListener('keydown', function(e) {
    var k = e.key.toLowerCase();
    if (!keyTimestamps) keyTimestamps = {};
    keyTimestamps[k] = Date.now();
    if (k === 'b') {
      var fTs = keyTimestamps['f'];
      if (fTs && (Date.now() - fTs < 400) && !active) {
        init();
      }
    }
  });

  return { init: init, update: update, reset: reset };
}());
