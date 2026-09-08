window.UnderwaterLab = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── Activation: U + L within 400ms ─────────────────────────────────────────
  var ACTIVATION_WINDOW = 400;
  var _uKeyTime = 0;
  var _lKeyTime = 0;

  // ─── Module state ────────────────────────────────────────────────────────────
  var _active   = false;
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;
  var _animId   = null;
  var _lastTime = 0;

  // ─── HUD elements ────────────────────────────────────────────────────────────
  var _hudEl       = null;
  var _notifyEl    = null;
  var _notifyTimer = 0;

  // ─── Player ──────────────────────────────────────────────────────────────────
  var _playerPos    = { x: 0, y: 1.6, z: 30 };
  var _playerHP     = 100;
  var _yaw          = 0;
  var _pitch        = 0;
  var _targetPos    = { x: 0, y: 1.6, z: 30 }; // for laggy lerp
  var _camPos       = { x: 0, y: 1.6, z: 30 };

  // ─── Objectives ──────────────────────────────────────────────────────────────
  var _crewRescued    = 0;
  var _crewTotal      = 5;
  var _chargesPlanted = 0;
  var _chargesTotal   = 3;

  // ─── Input ───────────────────────────────────────────────────────────────────
  var _keys         = {};
  var _mouseLocked  = false;
  var _shooting     = false;
  var _shootCooldown = 0;

  // ─── Scene object lists (for reset cleanup) ──────────────────────────────────
  var _allMeshes   = [];  // every mesh/line added to scene
  var _allLights   = [];  // every light added to scene

  // ─── Gameplay objects ────────────────────────────────────────────────────────
  var _bubbles        = [];
  var _causticPlanes  = [];
  var _enemies        = [];  // pirate divers
  var _crewMembers    = [];
  var _chargeSites    = [];
  var _playerShots    = [];
  var _enemyShots     = [];
  var _drilRigs       = [];  // mining drill rigs

  // ─── Caustic animation ───────────────────────────────────────────────────────
  var _causticTimer = 0;

  // ═════════════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ═════════════════════════════════════════════════════════════════════════════

  function addMesh(mesh) {
    _scene.add(mesh);
    _allMeshes.push(mesh);
    return mesh;
  }

  function addLight(light) {
    _scene.add(light);
    _allLights.push(light);
    return light;
  }

  function makeMesh(geo, color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity !== undefined)     params.opacity     = opts.opacity;
      if (opts.emissive !== undefined)    params.emissive    = opts.emissive;
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
    }
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial(params));
  }

  function dist3(ax, ay, az, bx, by, bz) {
    var dx = ax - bx, dy = ay - by, dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  SCENE SETUP
  // ═════════════════════════════════════════════════════════════════════════════

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x001A2E);
    // Blue-green underwater fog
    _scene.fog = new THREE.Fog(0x003344, 8, 60);

    _camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 150);
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camPos.x = _playerPos.x;
    _camPos.y = _playerPos.y;
    _camPos.z = _playerPos.z;

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(w, h);
    _renderer.domElement.style.position = 'fixed';
    _renderer.domElement.style.top      = '0';
    _renderer.domElement.style.left     = '0';
    _renderer.domElement.style.zIndex   = '9000';
    document.body.appendChild(_renderer.domElement);

    // Ambient deep-sea blue
    addLight(new THREE.AmbientLight(0x001833, 0.6));

    // Main water column light from above
    var topLight = new THREE.PointLight(0x004466, 1.8, 80);
    topLight.position.set(0, 20, 0);
    addLight(topLight);

    // Bioluminescent accent lights
    var biolights = [
      { pos: [-15, 3, -10], col: 0x00335A },
      { pos: [ 18, 2,  5 ], col: 0x003344 },
      { pos: [-5,  1, -25], col: 0x002244 }
    ];
    for (var bi = 0; bi < biolights.length; bi++) {
      var bl = new THREE.PointLight(biolights[bi].col, 0.7, 25);
      bl.position.set(biolights[bi].pos[0], biolights[bi].pos[1], biolights[bi].pos[2]);
      addLight(bl);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  ENVIRONMENT
  // ═════════════════════════════════════════════════════════════════════════════

  function buildFloor() {
    // Ocean floor — dark sediment
    var floorGeo = new THREE.BoxGeometry(200, 1, 200);
    var floor = makeMesh(floorGeo, 0x050D12);
    floor.position.set(0, -1, 0);
    addMesh(floor);

    // Some scattered rocks / debris on seabed
    var rockData = [
      { x: -20, z: -15, sx: 3, sy: 1.5, sz: 2.5 },
      { x:  25, z:  10, sx: 2, sy: 1.2, sz: 3   },
      { x: -10, z:  20, sx: 4, sy: 2,   sz: 2   },
      { x:  15, z: -30, sx: 2, sy: 0.8, sz: 2   },
      { x: -30, z:   5, sx: 1.5, sy: 1, sz: 1.5 }
    ];
    for (var ri = 0; ri < rockData.length; ri++) {
      var rd = rockData[ri];
      var rGeo = new THREE.BoxGeometry(rd.sx, rd.sy, rd.sz);
      var rock = makeMesh(rGeo, 0x0A1520);
      rock.position.set(rd.x, rd.sy * 0.5, rd.z);
      addMesh(rock);
    }
  }

  // ─── Caustic light planes (undulating white planes with opacity) ──────────
  function buildCaustics() {
    for (var ci = 0; ci < 5; ci++) {
      var cGeo = new THREE.BoxGeometry(14, 0.05, 14);
      var caustic = makeMesh(cGeo, 0xAADDFF, { transparent: true, opacity: 0.06 + Math.random() * 0.04 });
      caustic.position.set(
        -10 + ci * 5 + (Math.random() - 0.5) * 4,
        8 + Math.random() * 4,
        -20 + ci * 8 + (Math.random() - 0.5) * 4
      );
      caustic.userData.phase = Math.random() * Math.PI * 2;
      caustic.userData.baseY = caustic.position.y;
      addMesh(caustic);
      _causticPlanes.push(caustic);
    }
  }

  // ─── Coral formations: stacked cone + sphere shapes ──────────────────────
  function buildCorals() {
    var coralPositions = [
      { x: -18, z: 12  },
      { x:  22, z: -8  },
      { x: -8,  z: -20 },
      { x:  10, z:  18 },
      { x: -24, z: -14 },
      { x:  30, z:  5  }
    ];
    var coralColors = [0x662222, 0x884422, 0x663344, 0x774422, 0x553322];

    for (var ci = 0; ci < coralPositions.length; ci++) {
      var cp = coralPositions[ci];
      var col = coralColors[ci % coralColors.length];
      // Build 2-4 stalks per formation
      var numStalks = 2 + Math.floor(Math.random() * 3);
      for (var si = 0; si < numStalks; si++) {
        var ox = cp.x + (Math.random() - 0.5) * 3;
        var oz = cp.z + (Math.random() - 0.5) * 3;
        var height = 0.8 + Math.random() * 1.4;
        // Base cone
        var coneGeo = new THREE.ConeGeometry(0.18, height, 5);
        var cone = makeMesh(coneGeo, col);
        cone.position.set(ox, height * 0.5, oz);
        addMesh(cone);
        // Tip sphere bulb
        var bulbGeo = new THREE.SphereGeometry(0.22, 5, 5);
        var bulb = makeMesh(bulbGeo, col);
        bulb.position.set(ox, height + 0.12, oz);
        addMesh(bulb);
        // Occasional mid-node sphere
        if (Math.random() > 0.5) {
          var nodeGeo = new THREE.SphereGeometry(0.14, 4, 4);
          var node = makeMesh(nodeGeo, col);
          node.position.set(ox + 0.1, height * 0.55, oz + 0.1);
          addMesh(node);
        }
      }
    }
  }

  // ─── Pressurized habitat modules: cluster of boxes with sphere-domes ──────
  function buildHabitatModules() {
    // Module cluster A — main research hub
    buildHabitatCluster(0, 0, 0, 0x1A3344);
    // Module cluster B — crew quarters
    buildHabitatCluster(-18, 0, -10, 0x1A3322);
    // Module cluster C — lab wing
    buildHabitatCluster(16, 0, -12, 0x1A2244);
  }

  function buildHabitatCluster(cx, cy, cz, col) {
    // Central box module
    var mainGeo = new THREE.BoxGeometry(8, 5, 7);
    var main = makeMesh(mainGeo, col);
    main.position.set(cx, cy + 2.5, cz);
    addMesh(main);

    // Side box modules
    var sideOffsets = [
      { dx: -7, dy: 0, dz: 0,  w: 5, h: 4, d: 5 },
      { dx:  7, dy: 0, dz: 0,  w: 5, h: 4, d: 5 },
      { dx:  0, dy: 0, dz: 6,  w: 6, h: 3.5, d: 4 }
    ];
    for (var si = 0; si < sideOffsets.length; si++) {
      var s = sideOffsets[si];
      var sGeo = new THREE.BoxGeometry(s.w, s.h, s.d);
      var sm = makeMesh(sGeo, col);
      sm.position.set(cx + s.dx, cy + s.h * 0.5, cz + s.dz);
      addMesh(sm);
    }

    // Observation dome on top
    var domeGeo = new THREE.SphereGeometry(2.2, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
    var dome = makeMesh(domeGeo, 0x88CCEE, { transparent: true, opacity: 0.28 });
    dome.position.set(cx, cy + 5, cz);
    addMesh(dome);

    // Connector tube (horizontal cylinder)
    var tubeGeo = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
    var tube = makeMesh(tubeGeo, 0x22445A);
    tube.rotation.z = Math.PI * 0.5;
    tube.position.set(cx, cy + 2.5, cz - 4);
    addMesh(tube);

    // Port-hole windows using LineSegments
    var portHolePoints = [];
    var segments = 12;
    for (var phi = 0; phi <= segments; phi++) {
      var a0 = (phi / segments) * Math.PI * 2;
      var a1 = ((phi + 1) / segments) * Math.PI * 2;
      portHolePoints.push(
        cx + Math.cos(a0) * 0.6, cy + 3.5, cz + 3.5,
        cx + Math.cos(a1) * 0.6, cy + 3.5, cz + 3.5
      );
    }
    var phGeo = new THREE.BufferGeometry();
    phGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(portHolePoints), 3));
    var phLine = new THREE.LineSegments(phGeo, new THREE.LineBasicMaterial({ color: 0x44AACC }));
    _scene.add(phLine);
    _allMeshes.push(phLine);
  }

  // ─── Observation Dome (standalone large dome) ────────────────────────────
  function buildObservationDome() {
    // Large standalone observation dome at the edge of the facility
    var domeGeo = new THREE.SphereGeometry(5, 12, 12);
    var dome = makeMesh(domeGeo, 0x44AACC, { transparent: true, opacity: 0.2 });
    dome.position.set(8, 5, 20);
    addMesh(dome);

    // Interior platform box
    var platGeo = new THREE.BoxGeometry(7, 0.4, 7);
    var plat = makeMesh(platGeo, 0x1A3344);
    plat.position.set(8, 0.2, 20);
    addMesh(plat);

    // Interior light
    var domeLight = new THREE.PointLight(0x006688, 0.8, 12);
    domeLight.position.set(8, 3, 20);
    addLight(domeLight);

    // Support struts using LineSegments
    var strutPts = [
      8, 0, 20,   8, 5, 20,    // vertical center
      3, 0, 20,   8, 5, 20,    // left strut
      13, 0, 20,  8, 5, 20,    // right strut
      8, 0, 15,   8, 5, 20,    // back strut
      8, 0, 25,   8, 5, 20     // front strut
    ];
    var strutGeo = new THREE.BufferGeometry();
    strutGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(strutPts), 3));
    var strut = new THREE.LineSegments(strutGeo, new THREE.LineBasicMaterial({ color: 0x335566 }));
    _scene.add(strut);
    _allMeshes.push(strut);
  }

  // ─── Mining Drill Rigs (cylinder-based) ──────────────────────────────────
  function buildDrillRigs() {
    var rigPositions = [
      { x: -30, z: 5  },
      { x:  28, z: -5 },
      { x: -5,  z: -30 }
    ];

    for (var ri = 0; ri < rigPositions.length; ri++) {
      var rp = rigPositions[ri];
      var rigData = buildSingleDrillRig(rp.x, rp.z);
      _drilRigs.push(rigData);
      _chargeSites.push({
        x: rp.x,
        y: 0.5,
        z: rp.z,
        charged: false,
        chargeMesh: null
      });
    }
  }

  function buildSingleDrillRig(x, z) {
    // Drill tower (tall cylinder)
    var towerGeo = new THREE.CylinderGeometry(0.5, 0.7, 8, 8);
    var tower = makeMesh(towerGeo, 0x444422);
    tower.position.set(x, 4, z);
    addMesh(tower);

    // Drill bit tip (cone pointing down)
    var bitGeo = new THREE.ConeGeometry(0.5, 2, 8);
    var bit = makeMesh(bitGeo, 0x665500);
    bit.rotation.x = Math.PI;
    bit.position.set(x, -0.5, z);
    addMesh(bit);

    // Platform ring around the tower (flat cylinder)
    var platGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 10);
    var plat = makeMesh(platGeo, 0x333322);
    plat.position.set(x, 1.5, z);
    addMesh(plat);

    // Arm extending from mid-tower (box)
    var armGeo = new THREE.BoxGeometry(4, 0.4, 0.4);
    var arm = makeMesh(armGeo, 0x444422);
    arm.position.set(x + 2, 5, z);
    addMesh(arm);

    // Counterweight on arm
    var cwGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var cw = makeMesh(cwGeo, 0x555533);
    cw.position.set(x + 4, 5, z);
    addMesh(cw);

    // Rig warning light
    var rigLight = new THREE.PointLight(0xFF6600, 0.6, 8);
    rigLight.position.set(x, 6, z);
    addLight(rigLight);

    return {
      x: x, z: z,
      tower: tower,
      bit: bit,
      light: rigLight,
      spinAngle: 0
    };
  }

  // ─── Airlock chambers ────────────────────────────────────────────────────
  function buildAirlocks() {
    var airlockDefs = [
      { x:  0,  z: 32 },
      { x: -12, z: 0  }
    ];

    for (var ai = 0; ai < airlockDefs.length; ai++) {
      var ad = airlockDefs[ai];
      // Outer tube
      var outerGeo = new THREE.CylinderGeometry(1.8, 1.8, 4, 10);
      var outer = makeMesh(outerGeo, 0x2A4455);
      outer.position.set(ad.x, 2, ad.z);
      addMesh(outer);
      // Hatch door
      var hatchGeo = new THREE.BoxGeometry(3.2, 3.2, 0.3);
      var hatch = makeMesh(hatchGeo, 0x335566);
      hatch.position.set(ad.x, 2, ad.z + 1.9);
      addMesh(hatch);
      // Pressure indicator panel
      var panelGeo = new THREE.BoxGeometry(0.5, 0.3, 0.15);
      var panel = makeMesh(panelGeo, 0x00CC66, { emissive: 0x006633, emissiveIntensity: 0.5 });
      panel.position.set(ad.x + 1.0, 3.2, ad.z + 1.85);
      addMesh(panel);
    }
  }

  // ─── Pressure gauges ─────────────────────────────────────────────────────
  function buildPressureGauges() {
    var gaugePositions = [
      { x:  3, y: 2.5, z:  2  },
      { x: -14, y: 2.5, z: -8 },
      { x:  18, y: 2.5, z: -10 }
    ];

    for (var gi = 0; gi < gaugePositions.length; gi++) {
      var gp = gaugePositions[gi];

      // Gauge face (sphere)
      var faceGeo = new THREE.SphereGeometry(0.35, 8, 8);
      var face = makeMesh(faceGeo, 0x223344, { emissive: 0x001122, emissiveIntensity: 0.3 });
      face.position.set(gp.x, gp.y, gp.z);
      addMesh(face);

      // Mount plate (box)
      var mountGeo = new THREE.BoxGeometry(0.9, 0.9, 0.15);
      var mount = makeMesh(mountGeo, 0x334455);
      mount.position.set(gp.x, gp.y, gp.z - 0.4);
      addMesh(mount);

      // Needle (LineSegments)
      var needleAngle = Math.random() * Math.PI;
      var nx = Math.cos(needleAngle) * 0.25;
      var ny = Math.sin(needleAngle) * 0.25;
      var needlePts = new Float32Array([gp.x, gp.y, gp.z, gp.x + nx, gp.y + ny, gp.z + 0.01]);
      var needleGeo = new THREE.BufferGeometry();
      needleGeo.setAttribute('position', new THREE.BufferAttribute(needlePts, 3));
      var needle = new THREE.LineSegments(needleGeo, new THREE.LineBasicMaterial({ color: 0xFF4400 }));
      _scene.add(needle);
      _allMeshes.push(needle);

      // Pipe connecting gauge to wall
      var pipeGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 5);
      var pipe = makeMesh(pipeGeo, 0x334455);
      pipe.position.set(gp.x, gp.y - 0.5, gp.z);
      addMesh(pipe);
    }
  }

  // ─── Pirate diver enemies: dark cylinder body + sphere head ──────────────
  function buildEnemies() {
    var enemyPositions = [
      { x: -5,  z: 15  },
      { x:  5,  z: -15 },
      { x: -20, z: 0   },
      { x:  20, z: 10  },
      { x: -15, z: -25 },
      { x:  0,  z: -28 },
      { x:  25, z: -20 }
    ];

    for (var ei = 0; ei < enemyPositions.length; ei++) {
      var ep = enemyPositions[ei];

      // Dark cylinder body (dive suit)
      var bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.7, 8);
      var body = makeMesh(bodyGeo, 0x1A1A22);
      body.position.set(ep.x, 1.05, ep.z);
      addMesh(body);

      // Sphere head with helmet
      var headGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var head = makeMesh(headGeo, 0x2A2A35, { emissive: 0x111122, emissiveIntensity: 0.2 });
      head.position.set(ep.x, 2.05, ep.z);
      addMesh(head);

      // Oxygen tank on back (small cylinder)
      var tankGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
      var tank = makeMesh(tankGeo, 0x333344);
      tank.rotation.z = Math.PI * 0.5;
      tank.position.set(ep.x - 0.3, 1.3, ep.z - 0.1);
      addMesh(tank);

      _enemies.push({
        body: body,
        head: head,
        tank: tank,
        x: ep.x,
        y: 1.05,
        z: ep.z,
        hp: 60,
        alive: true,
        fireTimer: 1.5 + Math.random() * 2,
        fireCooldown: 2.5 + Math.random() * 1.5,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolRadius: 5 + Math.random() * 4,
        patrolCx: ep.x,
        patrolCz: ep.z,
        aggroRange: 22,
        state: 'patrol'
      });
    }
  }

  // ─── Crew members (to rescue) ────────────────────────────────────────────
  function buildCrew() {
    var crewPositions = [
      { x:  2,  z: -2  },
      { x: -16, z: -9  },
      { x:  17, z: -11 },
      { x: -4,  z: -28 },
      { x:  6,  z: -24 }
    ];

    for (var ci = 0; ci < crewPositions.length; ci++) {
      var cp = crewPositions[ci];
      // Body
      var bodyGeo = new THREE.CylinderGeometry(0.22, 0.25, 1.5, 7);
      var body = makeMesh(bodyGeo, 0x4466AA);
      body.position.set(cp.x, 0.75, cp.z);
      addMesh(body);
      // Head
      var headGeo = new THREE.SphereGeometry(0.22, 7, 7);
      var head = makeMesh(headGeo, 0xCCAA88);
      head.position.set(cp.x, 1.72, cp.z);
      addMesh(head);
      // Glow to mark crew
      var crewLight = new THREE.PointLight(0x4488FF, 0.4, 4);
      crewLight.position.set(cp.x, 2.5, cp.z);
      addLight(crewLight);

      _crewMembers.push({
        body: body,
        head: head,
        light: crewLight,
        x: cp.x,
        z: cp.z,
        rescued: false
      });
    }
  }

  // ─── Charge site markers (for mining rigs) ────────────────────────────────
  function buildChargeSiteMarkers() {
    for (var ci = 0; ci < _chargeSites.length; ci++) {
      var cs = _chargeSites[ci];
      var markerGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8);
      var marker = makeMesh(markerGeo, 0xFF6600, { emissive: 0x883300, emissiveIntensity: 0.4 });
      marker.position.set(cs.x, cs.y, cs.z);
      addMesh(marker);
      cs.chargeMesh = marker;
    }
  }

  // ─── Bubble particles ────────────────────────────────────────────────────
  function buildBubbles() {
    for (var bi = 0; bi < 50; bi++) {
      var r = 0.05 + Math.random() * 0.1;
      var bGeo = new THREE.SphereGeometry(r, 4, 4);
      var bubble = makeMesh(bGeo, 0x88CCEE, { transparent: true, opacity: 0.35 + Math.random() * 0.2 });
      bubble.position.set(
        (Math.random() - 0.5) * 70,
        Math.random() * 15,
        (Math.random() - 0.5) * 70
      );
      bubble.userData.riseSpeed = 0.6 + Math.random() * 1.8;
      bubble.userData.wobblePhase = Math.random() * Math.PI * 2;
      bubble.userData.originX = bubble.position.x;
      bubble.userData.originZ = bubble.position.z;
      addMesh(bubble);
      _bubbles.push(bubble);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  HUD
  // ═════════════════════════════════════════════════════════════════════════════

  function buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'ul-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,8,22,0.85)',
      'color:#22DDCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #005566',
      'border-radius:3px',
      'z-index:9100',
      'pointer-events:none',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);

    _notifyEl = document.createElement('div');
    _notifyEl.id = 'ul-notify';
    _notifyEl.style.cssText = [
      'position:fixed',
      'top:52px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,8,22,0.80)',
      'color:#FFCC22',
      'font-family:monospace',
      'font-size:12px',
      'padding:4px 12px',
      'border-radius:3px',
      'z-index:9101',
      'pointer-events:none',
      'white-space:nowrap',
      'opacity:0',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(_notifyEl);

    refreshHUD();
  }

  function refreshHUD() {
    if (!_hudEl) return;
    _hudEl.textContent =
      'UNDERWATER LAB' +
      '  |  CREW RESCUED: ' + _crewRescued + '/' + _crewTotal +
      '  |  CHARGES PLANTED: ' + _chargesPlanted + '/' + _chargesTotal +
      '  |  HP: ' + Math.max(0, Math.ceil(_playerHP));
  }

  function showNotify(msg) {
    if (!_notifyEl) return;
    _notifyEl.textContent = msg;
    _notifyEl.style.opacity = '1';
    _notifyTimer = 3.0;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  INPUT
  // ═════════════════════════════════════════════════════════════════════════════

  function onKeyDown(e) {
    var k = e.key ? e.key.toUpperCase() : '';
    _keys[k] = true;
    _keys[e.code] = true;

    // Activation combo: U + L within 400ms
    var now = Date.now();
    if (k === 'U') _uKeyTime = now;
    if (k === 'L') _lKeyTime = now;
    if (_uKeyTime && _lKeyTime && Math.abs(_uKeyTime - _lKeyTime) <= ACTIVATION_WINDOW) {
      _uKeyTime = 0; _lKeyTime = 0;
      if (!_active) {
        init(_scene, _camera);
      } else {
        reset();
        showNotify('UNDERWATER LAB — DEACTIVATED');
      }
    }

    if (!_active) return;
    if (e.code === 'Space') _shooting = true;
    if (k === 'E') onInteract();
  }

  function onKeyUp(e) {
    var k = e.key ? e.key.toUpperCase() : '';
    _keys[k] = false;
    _keys[e.code] = false;
    if (e.code === 'Space') _shooting = false;
  }

  function onMouseMove(e) {
    if (!_active || !_mouseLocked) return;
    _yaw   -= e.movementX * 0.002;
    _pitch -= e.movementY * 0.002;
    _pitch  = Math.max(-0.75, Math.min(0.75, _pitch));
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) { _shooting = true; }
    if (!_mouseLocked && _renderer && _renderer.domElement.requestPointerLock) {
      _renderer.domElement.requestPointerLock();
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) _shooting = false;
  }

  function onPointerLockChange() {
    _mouseLocked = (document.pointerLockElement === (_renderer && _renderer.domElement));
  }

  function bindInput() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  function unbindInput() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup',   onMouseUp);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    if (_mouseLocked && document.exitPointerLock) document.exitPointerLock();
    _mouseLocked = false;
  }

  // ─── Interact: rescue crew or plant charges ───────────────────────────────
  function onInteract() {
    var i;
    // Check crew rescue
    for (i = 0; i < _crewMembers.length; i++) {
      var cm = _crewMembers[i];
      if (cm.rescued) continue;
      var d = dist3(_playerPos.x, _playerPos.y, _playerPos.z, cm.x, 1, cm.z);
      if (d < 3.5) {
        cm.rescued = true;
        cm.body.visible = false;
        cm.head.visible = false;
        cm.light.intensity = 0;
        _crewRescued++;
        showNotify('CREW MEMBER RESCUED! (' + _crewRescued + '/' + _crewTotal + ')');
        refreshHUD();
        return;
      }
    }
    // Check charge planting
    for (i = 0; i < _chargeSites.length; i++) {
      var cs = _chargeSites[i];
      if (cs.charged) continue;
      var cd = dist3(_playerPos.x, _playerPos.y, _playerPos.z, cs.x, cs.y, cs.z);
      if (cd < 4) {
        cs.charged = true;
        if (cs.chargeMesh) cs.chargeMesh.material.color.setHex(0xFF2200);
        _chargesPlanted++;
        showNotify('CHARGE PLANTED! (' + _chargesPlanted + '/' + _chargesTotal + ')');
        refreshHUD();
        if (_chargesPlanted >= _chargesTotal) {
          showNotify('ALL CHARGES PLANTED — EVACUATE THE FACILITY!');
        }
        return;
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  PLAYER MOVEMENT (laggy lerp camera)
  // ═════════════════════════════════════════════════════════════════════════════

  function updatePlayer(dt) {
    var spd = 4.0 * dt;  // slower movement = underwater feel
    var sin = Math.sin(_yaw);
    var cos = Math.cos(_yaw);

    if (_keys['W'] || _keys['ARROWUP'])    { _targetPos.x -= sin * spd; _targetPos.z -= cos * spd; }
    if (_keys['S'] || _keys['ARROWDOWN'])  { _targetPos.x += sin * spd; _targetPos.z += cos * spd; }
    if (_keys['A'] || _keys['ARROWLEFT'])  { _targetPos.x -= cos * spd; _targetPos.z += sin * spd; }
    if (_keys['D'] || _keys['ARROWRIGHT']) { _targetPos.x += cos * spd; _targetPos.z -= sin * spd; }

    // Clamp to play area
    _targetPos.x = Math.max(-45, Math.min(45, _targetPos.x));
    _targetPos.z = Math.max(-45, Math.min(45, _targetPos.z));
    _targetPos.y = 1.6;

    // Laggy lerp — underwater drag feel
    var lerpFactor = 1.0 - Math.pow(0.04, dt);
    _playerPos.x = lerp(_playerPos.x, _targetPos.x, lerpFactor);
    _playerPos.y = lerp(_playerPos.y, _targetPos.y, lerpFactor);
    _playerPos.z = lerp(_playerPos.z, _targetPos.z, lerpFactor);

    // Camera position lerps even slower for extra lag
    var camLerp = 1.0 - Math.pow(0.02, dt);
    _camPos.x = lerp(_camPos.x, _playerPos.x, camLerp);
    _camPos.y = lerp(_camPos.y, _playerPos.y, camLerp);
    _camPos.z = lerp(_camPos.z, _playerPos.z, camLerp);

    _camera.position.set(_camPos.x, _camPos.y, _camPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  SHOOTING
  // ═════════════════════════════════════════════════════════════════════════════

  function updateShooting(dt) {
    _shootCooldown -= dt;
    if (_shooting && _shootCooldown <= 0) {
      _shootCooldown = 0.18;
      spawnPlayerShot();
    }

    var i, shot;
    for (i = _playerShots.length - 1; i >= 0; i--) {
      shot = _playerShots[i];
      shot.mesh.position.x += shot.vx * dt;
      shot.mesh.position.y += shot.vy * dt;
      shot.mesh.position.z += shot.vz * dt;
      shot.life -= dt;
      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _playerShots.splice(i, 1);
        continue;
      }
      // Hit detection on enemies
      var hit = false;
      for (var ei = 0; ei < _enemies.length; ei++) {
        var en = _enemies[ei];
        if (!en.alive) continue;
        var dd = dist3(shot.mesh.position.x, shot.mesh.position.y, shot.mesh.position.z, en.x, en.y + 0.8, en.z);
        if (dd < 0.9) {
          en.hp -= 35;
          if (en.hp <= 0) killEnemy(en);
          _scene.remove(shot.mesh);
          _playerShots.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
    }

    // Enemy shots
    for (i = _enemyShots.length - 1; i >= 0; i--) {
      shot = _enemyShots[i];
      shot.mesh.position.x += shot.vx * dt;
      shot.mesh.position.y += shot.vy * dt;
      shot.mesh.position.z += shot.vz * dt;
      shot.life -= dt;
      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _enemyShots.splice(i, 1);
        continue;
      }
      var dp = dist3(shot.mesh.position.x, shot.mesh.position.y, shot.mesh.position.z, _playerPos.x, _playerPos.y, _playerPos.z);
      if (dp < 0.8) {
        _playerHP -= 12;
        _scene.remove(shot.mesh);
        _enemyShots.splice(i, 1);
        if (_playerHP <= 0) _playerHP = 0;
        refreshHUD();
      }
    }
  }

  function spawnPlayerShot() {
    var sin = Math.sin(_yaw);
    var cos = Math.cos(_yaw);
    var sinP = Math.sin(_pitch);
    var geo = new THREE.SphereGeometry(0.07, 4, 4);
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xFFFF44, emissive: 0xAAAA00, emissiveIntensity: 0.8 }));
    mesh.position.set(_camPos.x - sin * 0.3, _camPos.y - 0.1, _camPos.z - cos * 0.3);
    _scene.add(mesh);
    var spd = 35;
    _playerShots.push({ mesh: mesh, vx: -sin * spd, vy: -sinP * spd, vz: -cos * spd, life: 2.0 });
  }

  function spawnEnemyShot(en) {
    var dx = _playerPos.x - en.x;
    var dy = (_playerPos.y) - (en.y + 0.8);
    var dz = _playerPos.z - en.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;
    dx /= len; dy /= len; dz /= len;

    var geo = new THREE.SphereGeometry(0.06, 4, 4);
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xFF4422, emissive: 0x882200, emissiveIntensity: 0.6 }));
    mesh.position.set(en.x + dx, en.y + 0.8, en.z + dz);
    _scene.add(mesh);
    var spd = 18;
    _enemyShots.push({ mesh: mesh, vx: dx * spd, vy: dy * spd, vz: dz * spd, life: 3.0 });
  }

  function killEnemy(en) {
    en.alive = false;
    en.hp = 0;
    en.body.visible = false;
    en.head.visible = false;
    en.tank.visible = false;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  ENEMY AI
  // ═════════════════════════════════════════════════════════════════════════════

  function updateEnemies(dt) {
    for (var ei = 0; ei < _enemies.length; ei++) {
      var en = _enemies[ei];
      if (!en.alive) continue;

      var dx = _playerPos.x - en.x;
      var dz = _playerPos.z - en.z;
      var distToPlayer = Math.sqrt(dx * dx + dz * dz);

      if (distToPlayer < en.aggroRange) {
        en.state = 'chase';
      } else if (en.state === 'chase' && distToPlayer > en.aggroRange + 5) {
        en.state = 'patrol';
      }

      if (en.state === 'chase') {
        // Move slowly toward player (underwater)
        if (distToPlayer > 4) {
          var spd = 1.8 * dt;
          en.x += (dx / distToPlayer) * spd;
          en.z += (dz / distToPlayer) * spd;
        }
        // Shoot at player
        en.fireTimer -= dt;
        if (en.fireTimer <= 0 && distToPlayer < en.aggroRange) {
          en.fireTimer = en.fireCooldown;
          spawnEnemyShot(en);
        }
      } else {
        // Patrol in a circle
        en.patrolAngle += 0.4 * dt;
        var targetX = en.patrolCx + Math.cos(en.patrolAngle) * en.patrolRadius;
        var targetZ = en.patrolCz + Math.sin(en.patrolAngle) * en.patrolRadius;
        var pdx = targetX - en.x;
        var pdz = targetZ - en.z;
        var plen = Math.sqrt(pdx * pdx + pdz * pdz);
        if (plen > 0.1) {
          en.x += (pdx / plen) * 1.2 * dt;
          en.z += (pdz / plen) * 1.2 * dt;
        }
      }

      // Sync meshes
      en.body.position.set(en.x, en.y, en.z);
      en.head.position.set(en.x, en.y + 1.0, en.z);
      en.tank.position.set(en.x - 0.3, en.y + 0.25, en.z - 0.1);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  ENVIRONMENT ANIMATION
  // ═════════════════════════════════════════════════════════════════════════════

  function updateBubbles(dt) {
    for (var bi = 0; bi < _bubbles.length; bi++) {
      var b = _bubbles[bi];
      b.userData.wobblePhase += dt * 1.5;
      b.position.y += b.userData.riseSpeed * dt;
      b.position.x = b.userData.originX + Math.sin(b.userData.wobblePhase) * 0.15;
      b.position.z = b.userData.originZ + Math.cos(b.userData.wobblePhase * 0.7) * 0.1;
      if (b.position.y > 18) {
        b.position.y = -0.5;
        b.userData.originX = (Math.random() - 0.5) * 70;
        b.userData.originZ = (Math.random() - 0.5) * 70;
        b.position.x = b.userData.originX;
        b.position.z = b.userData.originZ;
      }
    }
  }

  function updateCaustics(dt) {
    _causticTimer += dt;
    for (var ci = 0; ci < _causticPlanes.length; ci++) {
      var c = _causticPlanes[ci];
      var phase = c.userData.phase;
      // Undulate vertically
      c.position.y = c.userData.baseY + Math.sin(_causticTimer * 0.6 + phase) * 0.4;
      // Subtle rotation
      c.rotation.y = Math.sin(_causticTimer * 0.3 + phase) * 0.08;
      c.rotation.x = Math.cos(_causticTimer * 0.4 + phase * 0.5) * 0.05;
      // Pulse opacity
      c.material.opacity = 0.04 + Math.abs(Math.sin(_causticTimer * 0.5 + phase)) * 0.06;
    }
  }

  function updateDrillRigs(dt) {
    for (var ri = 0; ri < _drilRigs.length; ri++) {
      var rg = _drilRigs[ri];
      rg.spinAngle += dt * 1.2;
      rg.bit.rotation.y = rg.spinAngle;
      // Pulse the rig warning light
      rg.light.intensity = 0.4 + Math.abs(Math.sin(_causticTimer * 2.0 + ri)) * 0.5;
    }
  }

  function updateNotify(dt) {
    if (_notifyTimer > 0) {
      _notifyTimer -= dt;
      if (_notifyTimer <= 0) {
        _notifyTimer = 0;
        if (_notifyEl) _notifyEl.style.opacity = '0';
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═════════════════════════════════════════════════════════════════════════════

  function init(scene, camera) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    if (_active) return;
    _active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[UnderwaterLab] THREE not found');
      return;
    }

    // Reset objective state
    _crewRescued    = 0;
    _chargesPlanted = 0;
    _playerHP       = 100;
    _yaw            = 0;
    _pitch          = 0;
    _playerPos      = { x: 0, y: 1.6, z: 30 };
    _targetPos      = { x: 0, y: 1.6, z: 30 };
    _camPos         = { x: 0, y: 1.6, z: 30 };

    // Clear arrays
    _allMeshes   = [];
    _allLights   = [];
    _bubbles     = [];
    _causticPlanes = [];
    _enemies     = [];
    _crewMembers = [];
    _chargeSites = [];
    _playerShots = [];
    _enemyShots  = [];
    _drilRigs    = [];

    setupScene();
    buildFloor();
    buildCaustics();
    buildCorals();
    buildHabitatModules();
    buildObservationDome();
    buildDrillRigs();
    buildAirlocks();
    buildPressureGauges();
    buildEnemies();
    buildCrew();
    buildChargeSiteMarkers();
    buildBubbles();
    buildHUD();
    bindInput();

    showNotify('UNDERWATER LAB — ACTIVATED  |  U+L to toggle');

    _lastTime = 0;
    _animId   = requestAnimationFrame(loop);
  }

  function update(delta) {
    if (!_active) return;
    var dt = Math.min(delta, 0.1);

    updatePlayer(dt);
    updateShooting(dt);
    updateEnemies(dt);
    updateBubbles(dt);
    updateCaustics(dt);
    updateDrillRigs(dt);
    updateNotify(dt);
    refreshHUD();

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  function loop(timestamp) {
    if (!_active) return;
    _animId = requestAnimationFrame(loop);
    var dt = _lastTime === 0 ? 0.016 : (timestamp - _lastTime) / 1000;
    _lastTime = timestamp;
    update(dt);
  }

  function reset() {
    if (!_active) return;
    _active = false;

    if (_animId) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }

    // Remove all meshes and lines from scene
    var i;
    for (i = 0; i < _allMeshes.length; i++) {
      if (_scene) _scene.remove(_allMeshes[i]);
    }
    // Remove all lights from scene
    for (i = 0; i < _allLights.length; i++) {
      if (_scene) _scene.remove(_allLights[i]);
    }
    // Remove any dynamic shots still alive
    for (i = 0; i < _playerShots.length; i++) {
      if (_scene) _scene.remove(_playerShots[i].mesh);
    }
    for (i = 0; i < _enemyShots.length; i++) {
      if (_scene) _scene.remove(_enemyShots[i].mesh);
    }

    _allMeshes   = [];
    _allLights   = [];
    _bubbles     = [];
    _causticPlanes = [];
    _enemies     = [];
    _crewMembers = [];
    _chargeSites = [];
    _playerShots = [];
    _enemyShots  = [];
    _drilRigs    = [];

    // Remove HUD
    if (_hudEl && _hudEl.parentNode)    _hudEl.parentNode.removeChild(_hudEl);
    if (_notifyEl && _notifyEl.parentNode) _notifyEl.parentNode.removeChild(_notifyEl);
    _hudEl    = null;
    _notifyEl = null;

    // Remove renderer canvas
    if (_renderer) {
      if (_renderer.domElement && _renderer.domElement.parentNode) {
        _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      }
      _renderer.dispose();
      _renderer = null;
    }

    unbindInput();

    _scene  = null;
    _camera = null;
    _lastTime = 0;
  }

  // Listen globally for U+L activation even when module is not yet active
  document.addEventListener('keydown', function (e) {
    var k = e.key ? e.key.toUpperCase() : '';
    var now = Date.now();
    if (k === 'U') _uKeyTime = now;
    if (k === 'L') _lKeyTime = now;
    if (_uKeyTime && _lKeyTime && Math.abs(_uKeyTime - _lKeyTime) <= ACTIVATION_WINDOW) {
      _uKeyTime = 0; _lKeyTime = 0;
      if (!_active) {
        init(null, null);
      } else {
        reset();
      }
    }
  });

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
