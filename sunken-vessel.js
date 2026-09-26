window.SunkenVessel = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var ACTIVATION_KEY_S = 83;
  var ACTIVATION_KEY_V = 86;
  var ACTIVATION_WINDOW = 400;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    playerPos: { x: 0, y: 2, z: 35 },
    playerYaw: 0,
    playerHP: 100,
    air: 600,
    airMax: 600,
    isSprinting: false,
    hasIntelligence: false,
    hasCombination: false,
    safeOpen: false,
    safeHoldTimer: 0,
    safeHolding: false,
    nearSafe: false,
    nearLeader: false,
    nearLadder: false,
    inAirPocket: false,
    bloodSpilled: false,
    objectives: 0,
    objectivesTotal: 5,
    obj1CaptainFound: false,
    obj2LeaderDefeated: false,
    obj3CombinationLooted: false,
    obj4SafeOpened: false,
    obj5IntelSecured: false,
    surfaced: false,
    gameOver: false,
    gameWon: false,
    lastTime: 0,
    animFrameId: null,
    mouseX: 0,
    mouseY: 0,
    objects: [],
    frogmen: [],
    sharks: [],
    spears: [],
    airRefills: [],
    airPockets: [],
    bubbles: [],
    corals: [],
    marineLife: [],
    hudEl: null,
    beaconLight: null,
    captainBeaconActive: false,
    deathReason: '',
    safeCombo: '4-7-2',
    leaderMesh: null,
    safeMesh: null,
    intelCase: null,
    ladderShaft: null,
    entryPoint: { x: 0, y: 2, z: 35 },
    captainRoomPos: { x: -18, y: -8, z: -20 },
    _onKeyDown: null,
    _onKeyUp: null,
    _onMouseMove: null,
    keysDown: {},
    _sTime: null,
    _vTime: null
  };

  // ── helpers ───────────────────────────────────────────────────────────────

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function makeMesh(geo, mat, scene) {
    var m = new THREE.Mesh(geo, mat);
    scene.add(m);
    return m;
  }

  // ── scene setup ───────────────────────────────────────────────────────────

  function setupScene() {
    var w = window.innerWidth, h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x000511);
    state.scene.fog = new THREE.FogExp2(0x000a1a, 0.055);

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 120);
    state.camera.position.set(state.playerPos.x, state.playerPos.y + 1.6, state.playerPos.z);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setPixelRatio(window.devicePixelRatio || 1);
    state.renderer.setSize(w, h);
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    // Dark blue ambient
    var ambient = new THREE.AmbientLight(0x001133, 0.35);
    state.scene.add(ambient);

    // Dim blue fill
    var fillLight = new THREE.PointLight(0x002266, 1.2, 60);
    fillLight.position.set(0, 10, 0);
    state.scene.add(fillLight);

    // Sea floor light
    var floorLight = new THREE.PointLight(0x001144, 0.8, 40);
    floorLight.position.set(0, -30, 0);
    state.scene.add(floorLight);
  }

  // ── environment ───────────────────────────────────────────────────────────

  function buildEnvironment() {
    var sc = state.scene;

    // Sea floor
    var floorGeo = new THREE.BoxGeometry(200, 1, 200);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x0a1208 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -22, 0);
    sc.add(floor);
    state.objects.push(floor);

    // Water surface (ceiling plane – subtle)
    var surfGeo = new THREE.BoxGeometry(200, 0.5, 200);
    var surfMat = new THREE.MeshLambertMaterial({ color: 0x002244, transparent: true, opacity: 0.5 });
    var surf = new THREE.Mesh(surfGeo, surfMat);
    surf.position.set(0, 5, 0);
    sc.add(surf);
    state.objects.push(surf);

    buildBubbles();
  }

  function buildBubbles() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x4488aa, transparent: true, opacity: 0.55 });
    for (var i = 0; i < 30; i++) {
      var geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 5, 5);
      var b = new THREE.Mesh(geo, mat);
      b.position.set(
        (Math.random() - 0.5) * 100,
        -22 + Math.random() * 26,
        (Math.random() - 0.5) * 100
      );
      b.userData.speed = 0.6 + Math.random() * 1.2;
      b.userData.wobble = Math.random() * Math.PI * 2;
      state.scene.add(b);
      state.bubbles.push(b);
    }
  }

  // ── ship hull ─────────────────────────────────────────────────────────────

  function buildShipHull() {
    var sc = state.scene;

    // Main hull – BoxGeometry 60×10×20 tilted on its side
    var hullGeo = new THREE.BoxGeometry(60, 10, 20);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(0, -12, 0);
    hull.rotation.z = 0.18; // tilt
    sc.add(hull);
    state.objects.push(hull);

    // Deck superstructure
    var superGeo = new THREE.BoxGeometry(20, 5, 10);
    var superMat = new THREE.MeshLambertMaterial({ color: 0x2a3c2a });
    var superStr = new THREE.Mesh(superGeo, superMat);
    superStr.position.set(-8, -5, 0);
    sc.add(superStr);
    state.objects.push(superStr);

    // Funnel / chimney
    var funnelGeo = new THREE.CylinderGeometry(1.2, 1.5, 5, 8);
    var funnelMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var funnel = new THREE.Mesh(funnelGeo, funnelMat);
    funnel.position.set(-5, -1.5, 0);
    sc.add(funnel);
    state.objects.push(funnel);

    // Bow section
    var bowGeo = new THREE.BoxGeometry(10, 8, 18);
    var bowMat = new THREE.MeshLambertMaterial({ color: 0x2d3d2d });
    var bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(28, -13, 0);
    bow.rotation.z = 0.22;
    sc.add(bow);
    state.objects.push(bow);

    // Stern section
    var sternGeo = new THREE.BoxGeometry(10, 8, 18);
    var stern = new THREE.Mesh(sternGeo, bowMat);
    stern.position.set(-28, -14, 0);
    stern.rotation.z = -0.1;
    sc.add(stern);
    state.objects.push(stern);

    buildCoralGrowth();
    buildLadderShaft();
  }

  function buildCoralGrowth() {
    var sc = state.scene;
    var coralPositions = [
      { x: 22, y: -17, z: 8 },
      { x: 25, y: -18, z: -6 },
      { x: -20, y: -18, z: 9 },
      { x: -24, y: -17, z: -5 },
      { x: 10, y: -18, z: 11 },
      { x: -5, y: -19, z: -10 },
      { x: 30, y: -19, z: 3 },
      { x: -30, y: -18, z: -3 }
    ];
    for (var i = 0; i < coralPositions.length; i++) {
      var cp = coralPositions[i];
      var clusterCount = 2 + Math.floor(Math.random() * 3);
      for (var j = 0; j < clusterCount; j++) {
        var r = 0.3 + Math.random() * 0.7;
        var geo = new THREE.SphereGeometry(r, 6, 6);
        var mat = new THREE.MeshLambertMaterial({ color: 0x446644 });
        var coral = new THREE.Mesh(geo, mat);
        coral.position.set(
          cp.x + (Math.random() - 0.5) * 3,
          cp.y + Math.random() * 1.5,
          cp.z + (Math.random() - 0.5) * 3
        );
        sc.add(coral);
        state.corals.push(coral);
        state.objects.push(coral);
      }
    }
  }

  function buildLadderShaft() {
    var sc = state.scene;
    // Vertical cylinder shaft – entry/exit point
    var shaftGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
    var shaftMat = new THREE.MeshLambertMaterial({ color: 0x335533 });
    var shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.set(0, -5, 30);
    sc.add(shaft);
    state.objects.push(shaft);
    state.ladderShaft = shaft;

    // Entry point marker light
    var entryLight = new THREE.PointLight(0x00ff44, 1.5, 15);
    entryLight.position.set(0, 3, 30);
    sc.add(entryLight);

    // Rungs (LineSegments)
    var rungPoints = [];
    for (var r = 0; r < 8; r++) {
      rungPoints.push(new THREE.Vector3(-1, -14 + r * 2, 30));
      rungPoints.push(new THREE.Vector3(1, -14 + r * 2, 30));
    }
    var rungGeo = new THREE.BufferGeometry().setFromPoints(rungPoints);
    var rungMat = new THREE.LineBasicMaterial({ color: 0x445544 });
    var rungs = new THREE.LineSegments(rungGeo, rungMat);
    sc.add(rungs);
  }

  // ── interior rooms ─────────────────────────────────────────────────────────

  function buildInterior() {
    buildCorridors();
    buildEngineRoom();
    buildCrewQuarters();
    buildArmory();
    buildCaptainCabin();
  }

  function buildCorridors() {
    var sc = state.scene;
    var corridorMat = new THREE.MeshLambertMaterial({ color: 0x334433 });

    var corridors = [
      { x: 0, y: -9, z: 5, rx: 0, ry: 0, rz: 0 },
      { x: 0, y: -9, z: -5, rx: 0, ry: 0, rz: 0 },
      { x: 10, y: -9, z: 0, rx: 0, ry: Math.PI / 2, rz: 0 },
      { x: -10, y: -9, z: 0, rx: 0, ry: Math.PI / 2, rz: 0 }
    ];

    for (var i = 0; i < corridors.length; i++) {
      var cd = corridors[i];
      var cGeo = new THREE.BoxGeometry(2, 3, 15);
      var corr = new THREE.Mesh(cGeo, corridorMat);
      corr.position.set(cd.x, cd.y, cd.z);
      corr.rotation.set(cd.rx, cd.ry, cd.rz);
      sc.add(corr);
      state.objects.push(corr);
    }

    // Debris blocks in corridors
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var debrisPositions = [
      { x: 2, y: -10, z: 5 },
      { x: -2, y: -10, z: -5 },
      { x: 10, y: -10, z: 2 }
    ];
    for (var d = 0; d < debrisPositions.length; d++) {
      var dp = debrisPositions[d];
      var debGeo = new THREE.BoxGeometry(1, 1.5, 1);
      var deb = new THREE.Mesh(debGeo, debrisMat);
      deb.position.set(dp.x, dp.y, dp.z);
      deb.rotation.z = (Math.random() - 0.5) * 0.8;
      sc.add(deb);
      state.objects.push(deb);
    }
  }

  function buildEngineRoom() {
    var sc = state.scene;

    // Room
    var roomGeo = new THREE.BoxGeometry(16, 6, 12);
    var roomMat = new THREE.MeshLambertMaterial({ color: 0x2a3c2a });
    var room = new THREE.Mesh(roomGeo, roomMat);
    room.position.set(18, -10, 10);
    sc.add(room);
    state.objects.push(room);

    // Boilers – CylinderGeometry
    var boilerMat = new THREE.MeshLambertMaterial({ color: 0x445533 });
    var boilerPositions = [
      { x: 15, y: -9, z: 7 },
      { x: 18, y: -9, z: 7 },
      { x: 21, y: -9, z: 7 }
    ];
    for (var b = 0; b < boilerPositions.length; b++) {
      var bp = boilerPositions[b];
      var boilerGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.5, 8);
      var boiler = new THREE.Mesh(boilerGeo, boilerMat);
      boiler.position.set(bp.x, bp.y, bp.z);
      sc.add(boiler);
      state.objects.push(boiler);
    }

    // Pressure gauges detail (small spheres)
    var gaugeMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    for (var g = 0; g < 3; g++) {
      var gaugeGeo = new THREE.SphereGeometry(0.2, 5, 5);
      var gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
      gauge.position.set(14 + g * 3, -7.8, 7);
      sc.add(gauge);
    }

    // Air refill tank in engine room
    buildAirRefillTank(16, -9, 14, 0);

    // Room light
    var engLight = new THREE.PointLight(0x224422, 1.0, 18);
    engLight.position.set(18, -7, 10);
    sc.add(engLight);
  }

  function buildCrewQuarters() {
    var sc = state.scene;

    var roomGeo = new THREE.BoxGeometry(14, 5, 10);
    var roomMat = new THREE.MeshLambertMaterial({ color: 0x2d3020 });
    var room = new THREE.Mesh(roomGeo, roomMat);
    room.position.set(-18, -10, 10);
    sc.add(room);
    state.objects.push(room);

    // Collapsed wood bunks
    var bunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var bunkPositions = [
      { x: -20, y: -12, z: 8, rz: 0.3 },
      { x: -15, y: -12, z: 8, rz: -0.2 },
      { x: -20, y: -12, z: 12, rz: 0.15 },
      { x: -15, y: -12, z: 12, rz: 0.4 }
    ];
    for (var bk = 0; bk < bunkPositions.length; bk++) {
      var bkp = bunkPositions[bk];
      var bunkGeo = new THREE.BoxGeometry(4, 0.4, 1.8);
      var bunk = new THREE.Mesh(bunkGeo, bunkMat);
      bunk.position.set(bkp.x, bkp.y, bkp.z);
      bunk.rotation.z = bkp.rz;
      sc.add(bunk);
      state.objects.push(bunk);
    }

    // Air refill in crew quarters
    buildAirRefillTank(-22, -9, 14, 1);

    var crewLight = new THREE.PointLight(0x112211, 0.7, 15);
    crewLight.position.set(-18, -7.5, 10);
    sc.add(crewLight);
  }

  function buildArmory() {
    var sc = state.scene;

    var roomGeo = new THREE.BoxGeometry(12, 5, 10);
    var roomMat = new THREE.MeshLambertMaterial({ color: 0x2a2e22 });
    var room = new THREE.Mesh(roomGeo, roomMat);
    room.position.set(18, -10, -12);
    sc.add(room);
    state.objects.push(room);

    // Metal weapon racks (flat boxes)
    var rackMat = new THREE.MeshLambertMaterial({ color: 0x3a4030 });
    var rackPositions = [
      { x: 14, y: -10, z: -10 },
      { x: 14, y: -10, z: -14 },
      { x: 22, y: -10, z: -10 },
      { x: 22, y: -10, z: -14 }
    ];
    for (var ra = 0; ra < rackPositions.length; ra++) {
      var rp = rackPositions[ra];
      var rackGeo = new THREE.BoxGeometry(0.3, 2, 3);
      var rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(rp.x, rp.y, rp.z);
      sc.add(rack);
      state.objects.push(rack);
    }

    // Ammo caches
    var ammoMat = new THREE.MeshLambertMaterial({ color: 0x4a4a1a });
    var ammoPositions = [
      { x: 16, y: -11.5, z: -9 },
      { x: 20, y: -11.5, z: -13 }
    ];
    for (var am = 0; am < ammoPositions.length; am++) {
      var amp = ammoPositions[am];
      var ammoGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
      var ammo = new THREE.Mesh(ammoGeo, ammoMat);
      ammo.position.set(amp.x, amp.y, amp.z);
      sc.add(ammo);
      state.objects.push(ammo);
    }

    // Air refill in armory
    buildAirRefillTank(22, -9, -9, 2);

    var armLight = new THREE.PointLight(0x111a11, 0.6, 14);
    armLight.position.set(18, -7.5, -12);
    sc.add(armLight);
  }

  function buildCaptainCabin() {
    var sc = state.scene;
    var cx = state.captainRoomPos.x;
    var cy = state.captainRoomPos.y;
    var cz = state.captainRoomPos.z;

    var roomGeo = new THREE.BoxGeometry(10, 6, 8);
    var roomMat = new THREE.MeshLambertMaterial({ color: 0x302a1e });
    var room = new THREE.Mesh(roomGeo, roomMat);
    room.position.set(cx, cy, cz);
    sc.add(room);
    state.objects.push(room);

    // Wood desk
    var deskMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1a });
    var deskGeo = new THREE.BoxGeometry(3, 0.4, 1.5);
    var desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(cx - 1, cy - 2.8, cz);
    sc.add(desk);
    state.objects.push(desk);

    var deskLegGeo = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    var legPositions = [
      { x: cx - 2.3, z: cz - 0.6 },
      { x: cx - 2.3, z: cz + 0.6 },
      { x: cx + 0.3, z: cz - 0.6 },
      { x: cx + 0.3, z: cz + 0.6 }
    ];
    for (var lg = 0; lg < legPositions.length; lg++) {
      var lp = legPositions[lg];
      var leg = new THREE.Mesh(deskLegGeo, deskMat);
      leg.position.set(lp.x, cy - 3.55, lp.z);
      sc.add(leg);
    }

    // Safe (BoxGeometry) on wall – objective target
    var safeMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var safeGeo = new THREE.BoxGeometry(1.2, 1.2, 0.8);
    state.safeMesh = new THREE.Mesh(safeGeo, safeMat);
    state.safeMesh.position.set(cx + 4.2, cy - 0.5, cz);
    sc.add(state.safeMesh);
    state.objects.push(state.safeMesh);

    // Intelligence case (golden box) – hidden until safe opened
    var intelMat = new THREE.MeshLambertMaterial({ color: 0xd4a000 });
    var intelGeo = new THREE.BoxGeometry(0.6, 0.3, 0.4);
    state.intelCase = new THREE.Mesh(intelGeo, intelMat);
    state.intelCase.position.set(cx + 4.2, cy - 1.2, cz);
    state.intelCase.visible = false;
    sc.add(state.intelCase);

    // Air pocket in ceiling (SphereGeometry – transparent blue)
    var apMat = new THREE.MeshLambertMaterial({ color: 0x6688aa, transparent: true, opacity: 0.45 });
    var apGeo = new THREE.SphereGeometry(1.8, 8, 8);
    var ap = new THREE.Mesh(apGeo, apMat);
    ap.position.set(cx, cy + 2.6, cz);
    sc.add(ap);
    state.airPockets.push({ mesh: ap, pos: ap.position });

    // Air refill tank in captain's cabin
    buildAirRefillTank(cx + 3, cy - 2, cz - 2, 3);

    // Beacon light (dim until player enters room)
    var beacon = new THREE.PointLight(0x00aaff, 0, 18);
    beacon.position.set(cx, cy + 2, cz);
    sc.add(beacon);
    state.beaconLight = beacon;

    var capLight = new THREE.PointLight(0x223322, 0.8, 16);
    capLight.position.set(cx, cy + 1.5, cz);
    sc.add(capLight);
  }

  function buildAirRefillTank(x, y, z, idx) {
    var sc = state.scene;
    var tankMat = new THREE.MeshLambertMaterial({ color: 0x335566 });
    var tankGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.6, 8);
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(x, y, z);
    sc.add(tank);
    state.objects.push(tank);

    // Indicator sphere on top
    var indMat = new THREE.MeshLambertMaterial({ color: 0x00cc88 });
    var indGeo = new THREE.SphereGeometry(0.15, 6, 6);
    var ind = new THREE.Mesh(indGeo, indMat);
    ind.position.set(x, y + 0.95, z);
    sc.add(ind);

    var refillLight = new THREE.PointLight(0x008844, 1.2, 5);
    refillLight.position.set(x, y + 1, z);
    sc.add(refillLight);

    state.airRefills.push({
      mesh: tank,
      indMesh: ind,
      light: refillLight,
      pos: { x: x, y: y, z: z },
      used: false,
      amount: 180,
      index: idx
    });
  }

  // ── marine life ────────────────────────────────────────────────────────────

  function buildMarineLife() {
    buildSharks();
    buildSmallFish();
  }

  function buildSharks() {
    var sc = state.scene;
    var sharkMat = new THREE.MeshLambertMaterial({ color: 0x334444 });
    var sharkPositions = [
      { x: 35, y: -8, z: 15 },
      { x: -35, y: -7, z: -20 },
      { x: 5, y: -5, z: -35 }
    ];
    for (var i = 0; i < sharkPositions.length; i++) {
      var sp = sharkPositions[i];

      // Shark body – CylinderGeometry
      var bodyGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
      var body = new THREE.Mesh(bodyGeo, sharkMat);
      body.rotation.z = Math.PI / 2;
      body.position.set(sp.x, sp.y, sp.z);

      var finMat = new THREE.MeshLambertMaterial({ color: 0x2a3838 });
      var finGeo = new THREE.ConeGeometry(0.5, 1.2, 4);
      var fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(sp.x, sp.y + 0.9, sp.z);
      sc.add(fin);

      sc.add(body);
      body.userData.aggroRange = 12;
      body.userData.aggro = false;
      body.userData.patrolDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      body.userData.patrolTimer = 0;
      body.userData.finMesh = fin;
      state.sharks.push(body);
      state.objects.push(body);
    }
  }

  function buildSmallFish() {
    var sc = state.scene;
    var fishMat = new THREE.MeshLambertMaterial({ color: 0x226688 });
    for (var f = 0; f < 8; f++) {
      var fishGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.5, 6);
      var fish = new THREE.Mesh(fishGeo, fishMat);
      fish.position.set(
        (Math.random() - 0.5) * 60,
        -5 + Math.random() * 4,
        (Math.random() - 0.5) * 60
      );
      fish.rotation.z = Math.PI / 2;
      fish.userData.speed = 2 + Math.random() * 2;
      fish.userData.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      fish.userData.changeTimer = Math.random() * 3;
      sc.add(fish);
      state.marineLife.push(fish);
    }
  }

  // ── frogmen ────────────────────────────────────────────────────────────────

  function buildFrogmen() {
    var sc = state.scene;

    // 11 regular frogmen spread across rooms
    var spawnData = [
      // engine room (4)
      { x: 16, y: -9, z: 8 },
      { x: 20, y: -9, z: 8 },
      { x: 16, y: -9, z: 12 },
      { x: 20, y: -9, z: 12 },
      // crew quarters (3)
      { x: -16, y: -9, z: 8 },
      { x: -20, y: -9, z: 10 },
      { x: -18, y: -9, z: 12 },
      // armory (2)
      { x: 16, y: -9, z: -11 },
      { x: 22, y: -9, z: -13 },
      // corridors (2)
      { x: 5, y: -9, z: 0 },
      { x: -5, y: -9, z: 0 }
    ];

    for (var i = 0; i < spawnData.length; i++) {
      var sp = spawnData[i];
      spawnFrogman(sp.x, sp.y, sp.z, 70, false);
    }

    // Frogman leader (200HP) in captain's area
    var leader = spawnFrogman(-16, -9, -18, 200, true);
    state.leaderMesh = leader;
  }

  function spawnFrogman(x, y, z, hp, isLeader) {
    var sc = state.scene;

    var bodyMat = new THREE.MeshLambertMaterial({ color: isLeader ? 0x442200 : 0x223344 });
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.5, 0.5);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, y, z);

    var helmMat = new THREE.MeshLambertMaterial({ color: isLeader ? 0x663300 : 0x334455 });
    var helmGeo = new THREE.SphereGeometry(0.32, 7, 7);
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.set(x, y + 0.95, z);
    sc.add(helm);

    // Tank on back
    var tankMat = new THREE.MeshLambertMaterial({ color: 0x445533 });
    var tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6);
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(x, y, z + 0.3);
    tank.rotation.x = 0.3;
    sc.add(tank);

    sc.add(body);
    body.userData.hp = hp;
    body.userData.maxHp = hp;
    body.userData.isLeader = isLeader;
    body.userData.looted = false;
    body.userData.dead = false;
    body.userData.helmMesh = helm;
    body.userData.tankMesh = tank;
    body.userData.shootTimer = 0;
    body.userData.shootCooldown = isLeader ? 1.5 : 2.5 + Math.random() * 1.5;
    body.userData.groupTimer = 0;
    body.userData.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    state.frogmen.push(body);
    state.objects.push(body);
    return body;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'sunken-vessel-hud';
    hud.style.position = 'fixed';
    hud.style.top = '10px';
    hud.style.left = '50%';
    hud.style.transform = 'translateX(-50%)';
    hud.style.color = '#00DDCC';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '13px';
    hud.style.background = 'rgba(0,5,20,0.82)';
    hud.style.padding = '6px 16px';
    hud.style.borderRadius = '4px';
    hud.style.zIndex = '9999';
    hud.style.pointerEvents = 'none';
    hud.style.whiteSpace = 'nowrap';
    hud.style.letterSpacing = '0.04em';
    document.body.appendChild(hud);
    state.hudEl = hud;

    // Controls hint
    var hint = document.createElement('div');
    hint.id = 'sunken-vessel-hint';
    hint.style.position = 'fixed';
    hint.style.bottom = '16px';
    hint.style.left = '50%';
    hint.style.transform = 'translateX(-50%)';
    hint.style.color = '#557788';
    hint.style.fontFamily = 'monospace';
    hint.style.fontSize = '11px';
    hint.style.background = 'rgba(0,5,20,0.7)';
    hint.style.padding = '4px 12px';
    hint.style.borderRadius = '3px';
    hint.style.zIndex = '9999';
    hint.style.pointerEvents = 'none';
    hint.textContent = 'WASD=move  Q/E(vert)  Click=shoot  Shift=sprint  E=interact/loot  ESC=quit';
    document.body.appendChild(hint);
    state.hintEl = hint;

    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var airSecs = Math.max(0, Math.round(state.air));
    var activeFrogmen = 0;
    for (var i = 0; i < state.frogmen.length; i++) {
      if (!state.frogmen[i].userData.dead) activeFrogmen++;
    }
    var docStatus = state.hasIntelligence ? 'SECURED' : 'MISSING';
    var depth = Math.round(Math.abs(state.playerPos.y) * 5);
    var airColor = state.air < 120 ? '#FF4444' : state.air < 300 ? '#FFAA22' : '#00DDCC';

    state.hudEl.style.color = airColor;

    var safeHint = state.nearSafe && !state.safeOpen ? ' [HOLD E=OPEN SAFE]' : '';
    var lootHint = state.nearLeader && state.leaderMesh && state.leaderMesh.userData.dead && !state.hasCombination ? ' [E=LOOT COMBO]' : '';
    var intelHint = state.safeOpen && !state.hasIntelligence ? ' [E=TAKE INTEL]' : '';
    var surfaceHint = state.nearLadder && state.hasIntelligence ? ' [E=SURFACE!]' : '';

    state.hudEl.textContent =
      'SUNKEN VESSEL  [AIR: ' + airSecs + 's]  [OBJECTIVES: ' + state.objectives + '/' + state.objectivesTotal + ']' +
      '  [ENEMY DIVERS: ' + activeFrogmen + ']  [DOCUMENTS: ' + docStatus + ']  [DEPTH: -' + depth + 'm]' +
      safeHint + lootHint + intelHint + surfaceHint;

    if (state.inAirPocket) {
      state.hudEl.textContent += '  [AIR POCKET +2s/s]';
    }
    if (state.safeHolding) {
      var pct = Math.round((state.safeHoldTimer / 5) * 100);
      state.hudEl.textContent += '  [CRACKING: ' + pct + '%]';
    }
  }

  function showEndScreen(won) {
    var overlay = document.createElement('div');
    overlay.id = 'sunken-vessel-end';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = won ? 'rgba(0,30,20,0.92)' : 'rgba(30,0,0,0.92)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = won ? '#00FF99' : '#FF4444';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '28px';
    overlay.style.zIndex = '10000';
    var title = document.createElement('div');
    title.textContent = won ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED';
    var sub = document.createElement('div');
    sub.style.fontSize = '14px';
    sub.style.marginTop = '14px';
    sub.style.color = '#aaa';
    sub.textContent = won
      ? 'Classified intelligence recovered. Operation Sunken Vessel — SUCCESS.'
      : ('FAILURE: ' + state.deathReason);
    var btn = document.createElement('div');
    btn.textContent = '[ESC to exit]';
    btn.style.marginTop = '28px';
    btn.style.fontSize = '13px';
    btn.style.color = '#556677';
    overlay.appendChild(title);
    overlay.appendChild(sub);
    overlay.appendChild(btn);
    document.body.appendChild(overlay);
    state.endOverlay = overlay;
  }

  // ── input ──────────────────────────────────────────────────────────────────

  function bindKeys() {
    state._onKeyDown = function (e) {
      state.keysDown[e.keyCode] = true;
      if (e.keyCode === 27 && state.active) {
        destroy();
        return;
      }
      handleInteract(e.keyCode);
    };
    state._onKeyUp = function (e) {
      state.keysDown[e.keyCode] = false;
      if (e.keyCode === 69) {
        state.safeHolding = false;
        state.safeHoldTimer = 0;
      }
    };
    state._onMouseMove = function (e) {
      state.mouseX += e.movementX * 0.002;
      state.mouseY += e.movementY * 0.002;
      state.mouseY = clamp(state.mouseY, -1.2, 1.2);
    };
    state._onClick = function (e) {
      if (!state.active) return;
      if (document.pointerLockElement !== state.renderer.domElement) {
        state.renderer.domElement.requestPointerLock();
        return;
      }
      playerShoot();
    };
    window.addEventListener('keydown', state._onKeyDown);
    window.addEventListener('keyup', state._onKeyUp);
    window.addEventListener('mousemove', state._onMouseMove);
    window.addEventListener('click', state._onClick);
  }

  function unbindKeys() {
    if (state._onKeyDown) window.removeEventListener('keydown', state._onKeyDown);
    if (state._onKeyUp) window.removeEventListener('keyup', state._onKeyUp);
    if (state._onMouseMove) window.removeEventListener('mousemove', state._onMouseMove);
    if (state._onClick) window.removeEventListener('click', state._onClick);
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function handleInteract(keyCode) {
    if (!state.active || state.gameOver || state.gameWon) return;
    if (keyCode !== 69) return; // E key

    // Loot leader
    if (state.nearLeader && state.leaderMesh && state.leaderMesh.userData.dead && !state.hasCombination) {
      state.hasCombination = true;
      state.obj3CombinationLooted = true;
      state.objectives++;
      return;
    }

    // Grab intel if safe open
    if (state.safeOpen && !state.hasIntelligence && state.nearSafe) {
      state.hasIntelligence = true;
      state.obj5IntelSecured = true;
      state.objectives++;
      if (state.intelCase) state.intelCase.visible = false;
      return;
    }

    // Surface if near ladder with intel
    if (state.nearLadder && state.hasIntelligence) {
      triggerWin();
      return;
    }

    // Start holding E to crack safe (only if we have combo)
    if (state.nearSafe && state.hasCombination && !state.safeOpen) {
      state.safeHolding = true;
    }
  }

  // ── player shoot ───────────────────────────────────────────────────────────

  function playerShoot() {
    if (state.gameOver || state.gameWon) return;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(state.mouseY, state.mouseX, 0, 'YXZ'));

    var spearGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 5);
    var spearMat = new THREE.MeshLambertMaterial({ color: 0xcccc88 });
    var spear = new THREE.Mesh(spearGeo, spearMat);
    spear.position.set(state.playerPos.x, state.playerPos.y + 1.4, state.playerPos.z);

    // Align cylinder along direction
    var quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    spear.setRotationFromQuaternion(quat);

    // Tracer line
    var linePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dir.x * 2, dir.y * 2, dir.z * 2)
    ];
    var lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xaadd88 });
    var tracer = new THREE.LineSegments(lineGeo, lineMat);
    tracer.position.copy(spear.position);

    state.scene.add(spear);
    state.scene.add(tracer);
    state.spears.push({
      mesh: spear,
      tracer: tracer,
      dir: dir.clone(),
      speed: 25,
      life: 2.5,
      fromPlayer: true
    });
  }

  // ── enemy shoot ────────────────────────────────────────────────────────────

  function enemyShoot(fromPos, toPos) {
    var dir = new THREE.Vector3(
      toPos.x - fromPos.x,
      toPos.y - fromPos.y + 0.8,
      toPos.z - fromPos.z
    ).normalize();

    var spearGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 5);
    var spearMat = new THREE.MeshLambertMaterial({ color: 0x885544 });
    var spear = new THREE.Mesh(spearGeo, spearMat);
    spear.position.set(fromPos.x, fromPos.y + 0.8, fromPos.z);

    var quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    spear.setRotationFromQuaternion(quat);

    var linePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dir.x * 1.5, dir.y * 1.5, dir.z * 1.5)
    ];
    var lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xaa5533 });
    var tracer = new THREE.LineSegments(lineGeo, lineMat);
    tracer.position.copy(spear.position);

    state.scene.add(spear);
    state.scene.add(tracer);
    state.spears.push({
      mesh: spear,
      tracer: tracer,
      dir: dir,
      speed: 14,
      life: 3,
      fromPlayer: false
    });
  }

  // ── update functions ───────────────────────────────────────────────────────

  function updatePlayer(dt) {
    if (state.gameOver || state.gameWon) return;

    state.isSprinting = !!state.keysDown[16]; // Shift
    var speed = state.isSprinting ? 8 : 4.5;

    var fwd = new THREE.Vector3(-Math.sin(state.mouseX), 0, -Math.cos(state.mouseX));
    var rgt = new THREE.Vector3(Math.cos(state.mouseX), 0, -Math.sin(state.mouseX));

    if (state.keysDown[87]) { // W
      state.playerPos.x += fwd.x * speed * dt;
      state.playerPos.z += fwd.z * speed * dt;
    }
    if (state.keysDown[83]) { // S
      state.playerPos.x -= fwd.x * speed * dt;
      state.playerPos.z -= fwd.z * speed * dt;
    }
    if (state.keysDown[65]) { // A
      state.playerPos.x -= rgt.x * speed * dt;
      state.playerPos.z -= rgt.z * speed * dt;
    }
    if (state.keysDown[68]) { // D
      state.playerPos.x += rgt.x * speed * dt;
      state.playerPos.z += rgt.z * speed * dt;
    }
    if (state.keysDown[81]) { // Q – ascend
      state.playerPos.y += speed * dt * 0.7;
    }
    if (state.keysDown[90]) { // Z – descend (Z used since E is interact)
      state.playerPos.y -= speed * dt * 0.7;
    }

    state.playerPos.x = clamp(state.playerPos.x, -55, 55);
    state.playerPos.y = clamp(state.playerPos.y, -21, 5);
    state.playerPos.z = clamp(state.playerPos.z, -55, 55);
  }

  function updateCamera() {
    if (!state.camera) return;
    state.camera.position.set(
      state.playerPos.x,
      state.playerPos.y + 1.6,
      state.playerPos.z
    );
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.mouseX;
    state.camera.rotation.x = state.mouseY;
  }

  function updateAir(dt) {
    if (state.gameOver || state.gameWon) return;

    var drain = state.isSprinting ? 2 : 1;
    state.inAirPocket = false;

    // Check air pockets
    for (var i = 0; i < state.airPockets.length; i++) {
      var ap = state.airPockets[i];
      if (dist3(state.playerPos, ap.pos) < 2) {
        state.inAirPocket = true;
        state.air = Math.min(state.airMax, state.air + 2 * dt);
        drain = 0;
      }
    }

    // Check air refill tanks
    for (var r = 0; r < state.airRefills.length; r++) {
      var refill = state.airRefills[r];
      if (!refill.used && dist3(state.playerPos, refill.pos) < 2.5) {
        refill.used = true;
        state.air = Math.min(state.airMax, state.air + refill.amount);
        refill.mesh.material.color.setHex(0x224433);
        refill.indMesh.material.color.setHex(0x334433);
        refill.light.intensity = 0;
      }
    }

    state.air -= drain * dt;

    if (state.air <= 0) {
      state.air = 0;
      state.deathReason = 'Air supply depleted — mission failure.';
      triggerLoss();
    }
  }

  function updateSpears(dt) {
    for (var i = state.spears.length - 1; i >= 0; i--) {
      var s = state.spears[i];
      s.life -= dt;
      if (s.life <= 0) {
        state.scene.remove(s.mesh);
        state.scene.remove(s.tracer);
        state.spears.splice(i, 1);
        continue;
      }

      s.mesh.position.x += s.dir.x * s.speed * dt;
      s.mesh.position.y += s.dir.y * s.speed * dt;
      s.mesh.position.z += s.dir.z * s.speed * dt;
      s.tracer.position.copy(s.mesh.position);

      if (s.fromPlayer) {
        // Check frogman hits
        for (var f = 0; f < state.frogmen.length; f++) {
          var fm = state.frogmen[f];
          if (fm.userData.dead) continue;
          if (dist3(s.mesh.position, fm.position) < 1.0) {
            fm.userData.hp -= 35;
            state.bloodSpilled = true;
            if (fm.userData.hp <= 0) {
              killFrogman(fm);
            }
            state.scene.remove(s.mesh);
            state.scene.remove(s.tracer);
            state.spears.splice(i, 1);
            break;
          }
        }
      } else {
        // Enemy spear hitting player
        var pp = { x: state.playerPos.x, y: state.playerPos.y + 1.4, z: state.playerPos.z };
        if (dist3(s.mesh.position, pp) < 1.1) {
          state.playerHP -= 15;
          state.bloodSpilled = true;
          state.scene.remove(s.mesh);
          state.scene.remove(s.tracer);
          state.spears.splice(i, 1);
          if (state.playerHP <= 0) {
            state.deathReason = 'Killed by enemy frogman.';
            triggerLoss();
          }
        }
      }
    }
  }

  function killFrogman(fm) {
    fm.userData.dead = true;
    fm.material.color.setHex(0x111111);
    if (fm.userData.helmMesh) fm.userData.helmMesh.material.color.setHex(0x111111);
    fm.position.y -= 0.8;

    if (fm.userData.isLeader && !state.obj2LeaderDefeated) {
      state.obj2LeaderDefeated = true;
      state.objectives++;
    }
  }

  function updateFrogmen(dt) {
    var pp = state.playerPos;

    for (var i = 0; i < state.frogmen.length; i++) {
      var fm = state.frogmen[i];
      if (fm.userData.dead) continue;

      var toPlayer = new THREE.Vector3(pp.x - fm.position.x, pp.y - fm.position.y, pp.z - fm.position.z);
      var dToPlayer = toPlayer.length();

      // Move toward player if within aggro range
      if (dToPlayer < 28) {
        var spd = fm.userData.isLeader ? 2.5 : 2.0;
        var mv = toPlayer.clone().normalize().multiplyScalar(spd * dt);
        fm.position.add(mv);
        if (fm.userData.helmMesh) fm.userData.helmMesh.position.copy(fm.position).y += 0.95;
        if (fm.userData.tankMesh) fm.userData.tankMesh.position.copy(fm.position);
        if (fm.userData.helmMesh) fm.userData.helmMesh.position.set(fm.position.x, fm.position.y + 0.95, fm.position.z);
        if (fm.userData.tankMesh) fm.userData.tankMesh.position.set(fm.position.x, fm.position.y, fm.position.z + 0.3);

        // Face player
        fm.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      } else {
        // Patrol
        fm.userData.groupTimer += dt;
        if (fm.userData.groupTimer > 3) {
          fm.userData.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          fm.userData.groupTimer = 0;
        }
        fm.position.add(fm.userData.dir.clone().multiplyScalar(1.2 * dt));
        fm.position.x = clamp(fm.position.x, -50, 50);
        fm.position.z = clamp(fm.position.z, -50, 50);
        if (fm.userData.helmMesh) fm.userData.helmMesh.position.set(fm.position.x, fm.position.y + 0.95, fm.position.z);
        if (fm.userData.tankMesh) fm.userData.tankMesh.position.set(fm.position.x, fm.position.y, fm.position.z + 0.3);
      }

      // Shoot at player
      fm.userData.shootTimer += dt;
      if (fm.userData.shootTimer >= fm.userData.shootCooldown && dToPlayer < 18) {
        enemyShoot(fm.position, pp);
        fm.userData.shootTimer = 0;
        fm.userData.shootCooldown = fm.userData.isLeader ? 1.5 : 2.5 + Math.random() * 1.5;
      }

      // Melee damage
      if (dToPlayer < 1.2) {
        state.playerHP -= 8 * dt;
        if (state.playerHP <= 0 && !state.gameOver) {
          state.deathReason = 'Overpowered by enemy divers.';
          triggerLoss();
        }
      }
    }
  }

  function updateSharks(dt) {
    for (var i = 0; i < state.sharks.length; i++) {
      var sh = state.sharks[i];
      var toPlayer = new THREE.Vector3(
        state.playerPos.x - sh.position.x,
        0,
        state.playerPos.z - sh.position.z
      );
      var d = toPlayer.length();

      // Go aggro if blood spilled nearby
      if (state.bloodSpilled && d < 25) sh.userData.aggro = true;

      if (sh.userData.aggro) {
        toPlayer.normalize();
        sh.position.add(toPlayer.multiplyScalar(6.5 * dt));
        sh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        if (sh.userData.finMesh) {
          sh.userData.finMesh.position.set(sh.position.x, sh.position.y + 0.9, sh.position.z);
        }
        if (d < 1.5) {
          state.playerHP -= 30 * dt;
          if (state.playerHP <= 0 && !state.gameOver) {
            state.deathReason = 'Killed by shark attack.';
            triggerLoss();
          }
        }
      } else {
        // Patrol
        sh.userData.patrolTimer += dt;
        if (sh.userData.patrolTimer > 4) {
          sh.userData.patrolDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          sh.userData.patrolTimer = 0;
        }
        var pmv = sh.userData.patrolDir.clone().multiplyScalar(3 * dt);
        sh.position.add(pmv);
        if (sh.userData.finMesh) {
          sh.userData.finMesh.position.set(sh.position.x, sh.position.y + 0.9, sh.position.z);
        }
        sh.position.x = clamp(sh.position.x, -55, 55);
        sh.position.z = clamp(sh.position.z, -55, 55);
      }
    }
  }

  function updateBubbles(dt) {
    for (var i = 0; i < state.bubbles.length; i++) {
      var b = state.bubbles[i];
      b.userData.wobble += dt * 1.8;
      b.position.y += b.userData.speed * dt;
      b.position.x += Math.sin(b.userData.wobble) * 0.015;
      if (b.position.y > 5) {
        b.position.y = -22;
        b.position.x = (Math.random() - 0.5) * 100;
        b.position.z = (Math.random() - 0.5) * 100;
      }
    }
  }

  function updateMarineLife(dt) {
    for (var i = 0; i < state.marineLife.length; i++) {
      var fish = state.marineLife[i];
      fish.userData.changeTimer -= dt;
      if (fish.userData.changeTimer <= 0) {
        fish.userData.dir = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5).normalize();
        fish.userData.changeTimer = 2 + Math.random() * 3;
      }
      fish.position.add(fish.userData.dir.clone().multiplyScalar(fish.userData.speed * dt));
      fish.rotation.y = Math.atan2(fish.userData.dir.x, fish.userData.dir.z);
      fish.position.x = clamp(fish.position.x, -60, 60);
      fish.position.y = clamp(fish.position.y, -21, 4);
      fish.position.z = clamp(fish.position.z, -60, 60);
    }
  }

  function updateObjectiveChecks() {
    var pp = state.playerPos;
    var cap = state.captainRoomPos;

    // Obj 1 – find captain's quarters
    if (!state.obj1CaptainFound && dist3(pp, cap) < 8) {
      state.obj1CaptainFound = true;
      state.objectives++;
      state.captainBeaconActive = true;
      if (state.beaconLight) state.beaconLight.intensity = 2.0;
    }

    // Captain beacon pulse
    if (state.beaconLight && state.captainBeaconActive) {
      state.beaconLight.intensity = 1.5 + Math.sin(Date.now() * 0.004) * 0.8;
    }

    // Near safe check
    state.nearSafe = state.safeMesh && dist3(pp, state.safeMesh.position) < 3;

    // Near leader check
    state.nearLeader = state.leaderMesh && dist3(pp, state.leaderMesh.position) < 3;

    // Near ladder check
    state.nearLadder = state.ladderShaft && dist3(pp, { x: 0, y: state.playerPos.y, z: 30 }) < 4;

    // Intel case proximity
    if (state.safeOpen && state.intelCase && !state.hasIntelligence && state.nearSafe) {
      state.intelCase.visible = true;
    }

    // Obj 4 – safe open (via hold E)
    if (state.safeHolding && state.nearSafe && state.hasCombination && !state.safeOpen) {
      state.safeHoldTimer += 0.016;
      if (state.safeHoldTimer >= 5) {
        state.safeOpen = true;
        state.safeHolding = false;
        state.safeHoldTimer = 0;
        state.obj4SafeOpened = true;
        state.objectives++;
        if (state.safeMesh) state.safeMesh.material.color.setHex(0x88aa44);
        if (state.intelCase) state.intelCase.visible = true;
      }
    } else if (!state.nearSafe || !state.hasCombination) {
      state.safeHolding = false;
    }
  }

  function triggerWin() {
    if (state.gameWon || state.gameOver) return;
    state.gameWon = true;
    showEndScreen(true);
  }

  function triggerLoss() {
    if (state.gameOver || state.gameWon) return;
    state.gameOver = true;
    showEndScreen(false);
  }

  // ── animation loop ─────────────────────────────────────────────────────────

  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = (timestamp - state.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) dt = 0.016;
    state.lastTime = timestamp;

    if (!state.gameOver && !state.gameWon) {
      updatePlayer(dt);
      updateAir(dt);
      updateSpears(dt);
      updateFrogmen(dt);
      updateSharks(dt);
      updateBubbles(dt);
      updateMarineLife(dt);
      updateObjectiveChecks();
    }

    updateCamera();
    updateHUD();

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // ── public API ─────────────────────────────────────────────────────────────

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[SunkenVessel] THREE.js not loaded');
      return;
    }

    // Reset state fields that matter for fresh run
    state.playerPos = { x: 0, y: 2, z: 35 };
    state.playerHP = 100;
    state.air = 600;
    state.hasIntelligence = false;
    state.hasCombination = false;
    state.safeOpen = false;
    state.safeHolding = false;
    state.safeHoldTimer = 0;
    state.objectives = 0;
    state.obj1CaptainFound = false;
    state.obj2LeaderDefeated = false;
    state.obj3CombinationLooted = false;
    state.obj4SafeOpened = false;
    state.obj5IntelSecured = false;
    state.surfaced = false;
    state.gameOver = false;
    state.gameWon = false;
    state.bloodSpilled = false;
    state.captainBeaconActive = false;
    state.mouseX = 0;
    state.mouseY = 0;
    state.objects = [];
    state.frogmen = [];
    state.sharks = [];
    state.spears = [];
    state.airRefills = [];
    state.airPockets = [];
    state.bubbles = [];
    state.corals = [];
    state.marineLife = [];
    state.keysDown = {};
    state.deathReason = '';
    state.leaderMesh = null;
    state.safeMesh = null;
    state.intelCase = null;
    state.ladderShaft = null;
    state.beaconLight = null;
    state.endOverlay = null;
    state.hintEl = null;

    setupScene();
    buildEnvironment();
    buildShipHull();
    buildInterior();
    buildMarineLife();
    buildFrogmen();
    buildHUD();
    bindKeys();

    state.lastTime = performance.now();
    animate(state.lastTime);
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
    if (state.hintEl && state.hintEl.parentNode) {
      state.hintEl.parentNode.removeChild(state.hintEl);
      state.hintEl = null;
    }
    if (state.endOverlay && state.endOverlay.parentNode) {
      state.endOverlay.parentNode.removeChild(state.endOverlay);
      state.endOverlay = null;
    }
    unbindKeys();
    state.scene = null;
    state.camera = null;
    state.objects = [];
    state.frogmen = [];
    state.sharks = [];
    state.spears = [];
    state.airRefills = [];
    state.airPockets = [];
    state.bubbles = [];
    state.corals = [];
    state.marineLife = [];
  }

  function reset() {
    destroy();
    // Slight delay so DOM cleans up before re-init
    setTimeout(init, 80);
  }

  // ── global activation: S + V within 400ms ─────────────────────────────────

  function globalKeyHandler(e) {
    var now = Date.now();
    if (e.keyCode === ACTIVATION_KEY_S) state._sTime = now;
    if (e.keyCode === ACTIVATION_KEY_V) state._vTime = now;

    if (state._sTime && state._vTime && Math.abs(state._sTime - state._vTime) <= ACTIVATION_WINDOW) {
      state._sTime = null;
      state._vTime = null;
      if (!state.active) {
        init();
      }
    }

    if (e.keyCode === 27 && state.active) {
      destroy();
    }
  }

  window.addEventListener('keydown', globalKeyHandler);

  return {
    init: init,
    update: function (dt) { /* external update hook – loop calls animate internally */ },
    reset: reset
  };

}());
