window.MountainPass = (function() {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────────
  var _scene, _camera, _active = false, _group, _hud, _clock;
  var _keysDown = {}, _keyTimers = {};

  // Player
  var _player, _playerVel = { x: 0, y: 0, z: 0 };
  var _playerHP = 200, _ammo = 150, _onGround = false;
  var _missionComplete = false, _atSummit = false;

  // Environment
  var _rockPlatforms = [], _roadSegments = [], _cliffWalls = [];
  var _bunkers = [], _bunkerSlits = [];

  // Artillery
  var _artilleryGuns = [];       // { platform, barrel, hp, destroyed, fireTimer, position }
  var _artilleryStrikes = [];    // { cones, timer, x, z, warned }
  var _gunFireTimer = [20, 20, 20];
  var _gunsDestroyed = 0;
  var _artilleryStrikeTimer = 25;

  // Enemies
  var _enemies = [];             // { body, head, hp, maxHp, type, state, shootTimer, popupTimer, popped, waypoints, wpIdx, speed, pos, color }
  var _boss = null;              // { body, head, hp, maxHp, strikeTimer, strikeCount }
  var _bossDefeated = false;

  // Supply crates
  var _supplyCrates = [];        // { mesh, used }

  // Observation post
  var _observationPost = null;
  var _summitReached = false;

  // Projectiles (enemy shots at player shown as small spheres)
  var _enemyProjectiles = [];

  // Pass chokepoint markers
  var _chokePoints = [];

  // ─── Key Handling ─────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key.toUpperCase();
    _keysDown[key] = true;
    _keyTimers[key] = Date.now();

    // Activation: M then P within 400ms
    if (!_active) {
      if (key === 'P' && _keysDown['M'] && (Date.now() - (_keyTimers['M'] || 0)) < 400) {
        _activate();
        return;
      }
      if (key === 'M' && _keysDown['P'] && (Date.now() - (_keyTimers['P'] || 0)) < 400) {
        _activate();
        return;
      }
    }

    if (!_active) return;

    // E to resupply at ammo crate
    if (key === 'E') {
      _tryResupply();
    }

    // Space to jump
    if (key === ' ') {
      if (_onGround) {
        _playerVel.y = 7;
        _onGround = false;
      }
    }

    // Left click shoot (F key as shoot stand-in)
    if (key === 'F') {
      _playerShoot();
    }
  }

  function _onKeyUp(e) {
    var key = e.key.toUpperCase();
    _keysDown[key] = false;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      _playerShoot();
    }
  }

  // ─── Activation ───────────────────────────────────────────────────────────────
  function _activate() {
    if (_active) return;
    _active = true;
    _buildScene();
    _buildHUD();
  }

  // ─── Scene Construction ───────────────────────────────────────────────────────
  function _buildScene() {
    _group = new THREE.Group();
    _scene.add(_group);

    _scene.fog = new THREE.FogExp2(0x9BA8B0, 0.018);

    // Lighting
    var ambLight = new THREE.AmbientLight(0x607070, 0.9);
    _group.add(ambLight);
    var sun = new THREE.DirectionalLight(0xDDCCBB, 1.1);
    sun.position.set(20, 50, -10);
    _group.add(sun);
    var fillLight = new THREE.DirectionalLight(0x334455, 0.4);
    fillLight.position.set(-20, 10, 30);
    _group.add(fillLight);

    _buildTerrain();
    _buildRoad();
    _buildCliffWalls();
    _buildBunkers();
    _buildArtilleryEmplacements();
    _buildSupplyDepot();
    _buildObservationPost();
    _spawnEnemies();
    _buildPlayer();
  }

  // Mountain terrain: layered BoxGeometry rock platforms at escalating heights
  function _buildTerrain() {
    var rockColor = 0x7A7060;
    var rockColorDark = 0x5C5448;
    var rockColorBrown = 0x6B5B44;

    // Base valley floor
    var floorGeo = new THREE.BoxGeometry(120, 2, 200);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x4A4A38 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -1, 0);
    _group.add(floor);
    _rockPlatforms.push(floor);

    // Left cliff face — layered stepped rocks
    var leftLayers = [
      { x: -28, y: 0, z: 0,   w: 32, h: 4,  d: 200, col: rockColorDark },
      { x: -36, y: 4, z: 0,   w: 20, h: 6,  d: 200, col: rockColor },
      { x: -42, y: 10, z: 0,  w: 18, h: 8,  d: 200, col: rockColorDark },
      { x: -48, y: 18, z: 0,  w: 16, h: 10, d: 200, col: rockColor },
      { x: -54, y: 28, z: 0,  w: 14, h: 14, d: 200, col: rockColorBrown },
      { x: -60, y: 42, z: 0,  w: 14, h: 20, d: 200, col: rockColorDark }
    ];
    for (var i = 0; i < leftLayers.length; i++) {
      var ll = leftLayers[i];
      var lGeo = new THREE.BoxGeometry(ll.w, ll.h, ll.d);
      var lMat = new THREE.MeshLambertMaterial({ color: ll.col });
      var lMesh = new THREE.Mesh(lGeo, lMat);
      lMesh.position.set(ll.x, ll.y + ll.h / 2, ll.z);
      _group.add(lMesh);
      _rockPlatforms.push(lMesh);
    }

    // Right cliff face — layered
    var rightLayers = [
      { x: 28,  y: 0,  z: 0,  w: 32, h: 4,  d: 200, col: rockColorDark },
      { x: 36,  y: 4,  z: 0,  w: 20, h: 6,  d: 200, col: rockColor },
      { x: 42,  y: 10, z: 0,  w: 18, h: 8,  d: 200, col: rockColorDark },
      { x: 48,  y: 18, z: 0,  w: 16, h: 10, d: 200, col: rockColor },
      { x: 54,  y: 28, z: 0,  w: 14, h: 14, d: 200, col: rockColorBrown },
      { x: 60,  y: 42, z: 0,  w: 14, h: 20, d: 200, col: rockColorDark }
    ];
    for (var ri = 0; ri < rightLayers.length; ri++) {
      var rl = rightLayers[ri];
      var rGeo = new THREE.BoxGeometry(rl.w, rl.h, rl.d);
      var rMat = new THREE.MeshLambertMaterial({ color: rl.col });
      var rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(rl.x, rl.y + rl.h / 2, rl.z);
      _group.add(rMesh);
      _rockPlatforms.push(rMesh);
    }

    // Rocky outcroppings / cover rocks scattered in the pass
    var coverRocks = [
      { x: -8,  y: 0, z: -20, w: 4, h: 3, d: 3 },
      { x: 7,   y: 0, z: -25, w: 3, h: 4, d: 3 },
      { x: -6,  y: 0, z: -45, w: 5, h: 2.5, d: 4 },
      { x: 9,   y: 0, z: -50, w: 3, h: 3,   d: 3 },
      { x: -10, y: 0, z: -70, w: 4, h: 4,   d: 4 },
      { x: 8,   y: 0, z: -75, w: 3, h: 3.5, d: 3 },
      { x: -7,  y: 0, z: -90, w: 4, h: 3,   d: 3 },
      { x: 10,  y: 0, z: -95, w: 5, h: 2,   d: 4 },
      { x: -9,  y: 0, z: -110, w: 3, h: 4, d: 3 },
      { x: 6,   y: 0, z: -115, w: 4, h: 3, d: 4 },
      { x: -8,  y: 0, z: -130, w: 3, h: 3.5, d: 3 },
      { x: 9,   y: 0, z: -135, w: 4, h: 2.5, d: 3 },
      { x: -11, y: 0, z: -150, w: 5, h: 4,   d: 4 },
      { x: 7,   y: 0, z: -155, w: 3, h: 3,   d: 3 },
      { x: -6,  y: 0, z: -170, w: 4, h: 5,   d: 3 },
      { x: 10,  y: 0, z: -175, w: 3, h: 3.5, d: 4 }
    ];
    for (var ci = 0; ci < coverRocks.length; ci++) {
      var cr = coverRocks[ci];
      var crGeo = new THREE.BoxGeometry(cr.w, cr.h, cr.d);
      var crMat = new THREE.MeshLambertMaterial({ color: rockColor });
      var crMesh = new THREE.Mesh(crGeo, crMat);
      crMesh.position.set(cr.x, cr.y + cr.h / 2, cr.z);
      _group.add(crMesh);
      _rockPlatforms.push(crMesh);
    }

    // Upper ledge platforms that enemies stand on
    var ledges = [
      { x: -14, y: 6,  z: -30, w: 10, h: 1.5, d: 10 },
      { x: 14,  y: 8,  z: -40, w: 10, h: 1.5, d: 10 },
      { x: -14, y: 10, z: -65, w: 10, h: 1.5, d: 10 },
      { x: 14,  y: 12, z: -80, w: 10, h: 1.5, d: 10 },
      { x: -14, y: 14, z: -100, w: 10, h: 1.5, d: 10 },
      { x: 14,  y: 16, z: -120, w: 10, h: 1.5, d: 10 }
    ];
    for (var li = 0; li < ledges.length; li++) {
      var ld = ledges[li];
      var ldGeo = new THREE.BoxGeometry(ld.w, ld.h, ld.d);
      var ldMat = new THREE.MeshLambertMaterial({ color: rockColorDark });
      var ldMesh = new THREE.Mesh(ldGeo, ldMat);
      ldMesh.position.set(ld.x, ld.y + ld.h / 2, ld.z);
      _group.add(ldMesh);
      _rockPlatforms.push(ldMesh);
    }
  }

  // Narrow pass road winding between cliff faces
  function _buildRoad() {
    var roadMat = new THREE.MeshLambertMaterial({ color: 0x3D3830 });

    // Road segments winding through the pass
    var segments = [
      { x: 0,   z: 0,    w: 14, d: 30, rot: 0 },
      { x: -2,  z: -30,  w: 12, d: 30, rot: 0 },
      { x: 2,   z: -60,  w: 12, d: 30, rot: 0 },
      { x: -3,  z: -90,  w: 11, d: 30, rot: 0 },
      { x: 1,   z: -120, w: 11, d: 30, rot: 0 },
      { x: -2,  z: -150, w: 10, d: 30, rot: 0 },
      { x: 0,   z: -180, w: 10, d: 30, rot: 0 }
    ];

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      var segGeo = new THREE.BoxGeometry(seg.w, 0.3, seg.d);
      var segMesh = new THREE.Mesh(segGeo, roadMat);
      segMesh.position.set(seg.x, 0.15, seg.z);
      _group.add(segMesh);
      _roadSegments.push(segMesh);
    }

    // Chokepoint markers — narrow carved passages
    var chokeMat = new THREE.MeshLambertMaterial({ color: 0x2A2820 });
    var chokePositions = [
      { x: 0, z: -55 },
      { x: 0, z: -110 },
      { x: 0, z: -160 }
    ];
    for (var ci = 0; ci < chokePositions.length; ci++) {
      var cp = chokePositions[ci];
      // Left wall narrowing
      var clGeo = new THREE.BoxGeometry(6, 8, 8);
      var cl = new THREE.Mesh(clGeo, chokeMat);
      cl.position.set(cp.x - 8, 4, cp.z);
      _group.add(cl);
      // Right wall narrowing
      var crGeo2 = new THREE.BoxGeometry(6, 8, 8);
      var cr2 = new THREE.Mesh(crGeo2, chokeMat);
      cr2.position.set(cp.x + 8, 4, cp.z);
      _group.add(cr2);
      _chokePoints.push({ x: cp.x, z: cp.z });
    }
  }

  // Reinforced cliff-face bunkers
  function _buildCliffWalls() {
    // Decorative cliff detail slabs
    var cliffMat = new THREE.MeshLambertMaterial({ color: 0x5C5448 });
    var cliffDetails = [
      { x: -18, y: 2, z: -35, w: 3, h: 6, d: 20 },
      { x: 18,  y: 2, z: -50, w: 3, h: 7, d: 20 },
      { x: -18, y: 2, z: -80, w: 3, h: 5, d: 20 },
      { x: 18,  y: 2, z: -95, w: 3, h: 6, d: 20 },
      { x: -18, y: 2, z: -130, w: 3, h: 8, d: 20 },
      { x: 18,  y: 2, z: -145, w: 3, h: 7, d: 20 }
    ];
    for (var i = 0; i < cliffDetails.length; i++) {
      var cd = cliffDetails[i];
      var cdGeo = new THREE.BoxGeometry(cd.w, cd.h, cd.d);
      var cdMesh = new THREE.Mesh(cdGeo, cliffMat);
      cdMesh.position.set(cd.x, cd.y + cd.h / 2, cd.z);
      _group.add(cdMesh);
      _cliffWalls.push(cdMesh);
    }
  }

  // Bunkers carved into cliff face with firing slits (LineSegments)
  function _buildBunkers() {
    var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x4A4840 });
    var bunkerDef = [
      { x: -16, y: 0, z: -30,  side: -1 },
      { x: 16,  y: 0, z: -60,  side: 1  },
      { x: -16, y: 0, z: -100, side: -1 },
      { x: 16,  y: 0, z: -140, side: 1  }
    ];

    for (var i = 0; i < bunkerDef.length; i++) {
      var bd = bunkerDef[i];

      // Main bunker body
      var bGeo = new THREE.BoxGeometry(8, 5, 10);
      var bMesh = new THREE.Mesh(bGeo, bunkerMat);
      bMesh.position.set(bd.x, 2.5, bd.z);
      _group.add(bMesh);
      _bunkers.push(bMesh);

      // Roof reinforcement slab
      var roofGeo = new THREE.BoxGeometry(9, 0.8, 11);
      var roofMat = new THREE.MeshLambertMaterial({ color: 0x3A3830 });
      var roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(bd.x, 5.4, bd.z);
      _group.add(roofMesh);

      // Front sandbag barrier
      var sbGeo = new THREE.BoxGeometry(8, 1.5, 1.2);
      var sbMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
      var sbMesh = new THREE.Mesh(sbGeo, sbMat);
      sbMesh.position.set(bd.x, 0.75, bd.z + bd.side * 5.5);
      _group.add(sbMesh);

      // Firing slit — LineSegments on the face of the bunker
      var slitPoints = new Float32Array([
        bd.x - 2, 2.5, bd.z + bd.side * 5,
        bd.x + 2, 2.5, bd.z + bd.side * 5,
        bd.x + 2, 2.5, bd.z + bd.side * 5,
        bd.x + 2, 3.3, bd.z + bd.side * 5,
        bd.x + 2, 3.3, bd.z + bd.side * 5,
        bd.x - 2, 3.3, bd.z + bd.side * 5,
        bd.x - 2, 3.3, bd.z + bd.side * 5,
        bd.x - 2, 2.5, bd.z + bd.side * 5
      ]);
      var slitGeo = new THREE.BufferGeometry();
      slitGeo.setAttribute('position', new THREE.BufferAttribute(slitPoints, 3));
      var slitMat = new THREE.LineBasicMaterial({ color: 0x000000 });
      var slitLine = new THREE.LineSegments(slitGeo, slitMat);
      _group.add(slitLine);
      _bunkerSlits.push(slitLine);
    }
  }

  // 3 artillery emplacements — CylinderGeometry barrels on BoxGeometry platforms
  function _buildArtilleryEmplacements() {
    var empDef = [
      { x: -10, z: -50,  y: 0 },
      { x: 10,  z: -100, y: 0 },
      { x: -8,  z: -165, y: 0 }
    ];

    for (var i = 0; i < empDef.length; i++) {
      var ed = empDef[i];

      // Platform base
      var platGeo = new THREE.BoxGeometry(12, 1, 12);
      var platMat = new THREE.MeshLambertMaterial({ color: 0x5A5040 });
      var platMesh = new THREE.Mesh(platGeo, platMat);
      platMesh.position.set(ed.x, ed.y + 0.5, ed.z);
      _group.add(platMesh);

      // Gun base (thick cylinder)
      var baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 1.5, 10);
      var baseMat = new THREE.MeshLambertMaterial({ color: 0x3A3830 });
      var baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(ed.x, ed.y + 1.75, ed.z);
      _group.add(baseMesh);

      // Gun barrel (long thin cylinder pointing forward/up)
      var barrelGeo = new THREE.CylinderGeometry(0.3, 0.4, 7, 8);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2A2825 });
      var barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
      barrelMesh.position.set(ed.x, ed.y + 3.5, ed.z - 1.5);
      barrelMesh.rotation.x = -0.5;
      _group.add(barrelMesh);

      // Shield plate
      var shieldGeo = new THREE.BoxGeometry(4, 3, 0.4);
      var shieldMat = new THREE.MeshLambertMaterial({ color: 0x454038 });
      var shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.position.set(ed.x, ed.y + 2.5, ed.z + 2);
      _group.add(shieldMesh);

      _artilleryGuns.push({
        platform: platMesh,
        base: baseMesh,
        barrel: barrelMesh,
        shield: shieldMesh,
        hp: 5,
        maxHp: 5,
        destroyed: false,
        fireTimer: 20 + i * 5,
        position: new THREE.Vector3(ed.x, ed.y + 2, ed.z),
        index: i
      });
    }
  }

  // Supply depot at base of pass — BoxGeometry buildings + ammo crates
  function _buildSupplyDepot() {
    var depotMat = new THREE.MeshLambertMaterial({ color: 0x5C5040 });
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x6B5F2A });

    // Depot building 1
    var b1Geo = new THREE.BoxGeometry(10, 6, 8);
    var b1 = new THREE.Mesh(b1Geo, depotMat);
    b1.position.set(-15, 3, 20);
    _group.add(b1);

    // Depot building 2
    var b2Geo = new THREE.BoxGeometry(8, 5, 7);
    var b2 = new THREE.Mesh(b2Geo, depotMat);
    b2.position.set(12, 2.5, 22);
    _group.add(b2);

    // Depot roof details
    var r1Geo = new THREE.BoxGeometry(11, 0.5, 9);
    var r1Mat = new THREE.MeshLambertMaterial({ color: 0x3A3420 });
    var r1 = new THREE.Mesh(r1Geo, r1Mat);
    r1.position.set(-15, 6.25, 20);
    _group.add(r1);

    var r2Geo = new THREE.BoxGeometry(9, 0.5, 8);
    var r2 = new THREE.Mesh(r2Geo, r1Mat);
    r2.position.set(12, 5.25, 22);
    _group.add(r2);

    // 2 ammo crates (interactive supply points)
    var cratePositions = [
      { x: -12, z: 15 },
      { x: 15,  z: 18 }
    ];

    for (var i = 0; i < cratePositions.length; i++) {
      var cp = cratePositions[i];
      var cGeo = new THREE.BoxGeometry(1.8, 1.4, 1.8);
      var cMesh = new THREE.Mesh(cGeo, crateMat);
      cMesh.position.set(cp.x, 0.7, cp.z);
      _group.add(cMesh);

      // Crate markings (LineSegments cross on top)
      var markPts = new Float32Array([
        cp.x - 0.6, 1.41, cp.z,
        cp.x + 0.6, 1.41, cp.z,
        cp.x, 1.41, cp.z - 0.6,
        cp.x, 1.41, cp.z + 0.6
      ]);
      var markGeo = new THREE.BufferGeometry();
      markGeo.setAttribute('position', new THREE.BufferAttribute(markPts, 3));
      var markMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
      var markLine = new THREE.LineSegments(markGeo, markMat);
      _group.add(markLine);

      _supplyCrates.push({ mesh: cMesh, used: false, x: cp.x, z: cp.z });
    }

    // Stacked crate piles (visual)
    var stackDef = [
      { x: -18, y: 0, z: 18 },
      { x: -18, y: 1.4, z: 18 },
      { x: 18,  y: 0,   z: 15 },
      { x: 18,  y: 1.4, z: 15 }
    ];
    for (var si = 0; si < stackDef.length; si++) {
      var sd = stackDef[si];
      var scGeo = new THREE.BoxGeometry(1.8, 1.4, 1.8);
      var scMesh = new THREE.Mesh(scGeo, crateMat);
      scMesh.position.set(sd.x, sd.y + 0.7, sd.z);
      _group.add(scMesh);
    }
  }

  // Observation post — tall BoxGeometry tower on highest peak
  function _buildObservationPost() {
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x4A4038 });
    var windowMat = new THREE.MeshLambertMaterial({ color: 0x1A1810 });

    // Peak base platform
    var peakGeo = new THREE.BoxGeometry(20, 3, 20);
    var peakMat = new THREE.MeshLambertMaterial({ color: 0x5A5448 });
    var peakMesh = new THREE.Mesh(peakGeo, peakMat);
    peakMesh.position.set(0, 1.5, -190);
    _group.add(peakMesh);
    _rockPlatforms.push(peakMesh);

    // Tower base
    var tBaseGeo = new THREE.BoxGeometry(8, 2, 8);
    var tBase = new THREE.Mesh(tBaseGeo, towerMat);
    tBase.position.set(0, 4, -190);
    _group.add(tBase);

    // Tower shaft
    var tShaftGeo = new THREE.BoxGeometry(6, 18, 6);
    var tShaft = new THREE.Mesh(tShaftGeo, towerMat);
    tShaft.position.set(0, 14, -190);
    _group.add(tShaft);

    // Tower observation room
    var tTopGeo = new THREE.BoxGeometry(9, 5, 9);
    var tTop = new THREE.Mesh(tTopGeo, towerMat);
    tTop.position.set(0, 25.5, -190);
    _group.add(tTop);

    // Tower roof
    var tRoofGeo = new THREE.BoxGeometry(10, 0.8, 10);
    var tRoofMat = new THREE.MeshLambertMaterial({ color: 0x2A2820 });
    var tRoof = new THREE.Mesh(tRoofGeo, tRoofMat);
    tRoof.position.set(0, 28.4, -190);
    _group.add(tRoof);

    // Window slits on tower (LineSegments)
    var windowSides = [
      { dx: 0,    dz: 4.6  },
      { dx: 0,    dz: -4.6 },
      { dx: 4.6,  dz: 0    },
      { dx: -4.6, dz: 0    }
    ];
    for (var wi = 0; wi < windowSides.length; wi++) {
      var ws = windowSides[wi];
      var wx = ws.dx;
      var wz = -190 + ws.dz;
      var isZ = (ws.dx === 0);
      var wPts;
      if (isZ) {
        wPts = new Float32Array([
          -1, 24.5, wz,  1, 24.5, wz,
          1, 24.5, wz,   1, 26.5, wz,
          1, 26.5, wz,  -1, 26.5, wz,
          -1, 26.5, wz, -1, 24.5, wz
        ]);
      } else {
        wPts = new Float32Array([
          wx, 24.5, -191,  wx, 24.5, -189,
          wx, 24.5, -189,  wx, 26.5, -189,
          wx, 26.5, -189,  wx, 26.5, -191,
          wx, 26.5, -191,  wx, 24.5, -191
        ]);
      }
      var wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', new THREE.BufferAttribute(wPts, 3));
      var wMat = new THREE.LineBasicMaterial({ color: 0x000000 });
      var wLine = new THREE.LineSegments(wGeo, wMat);
      _group.add(wLine);
    }

    // Flag pole on top
    var poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 31, -190);
    _group.add(pole);

    // Flag (small box)
    var flagGeo = new THREE.BoxGeometry(2, 1, 0.1);
    var flagMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    var flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(1, 32.5, -190);
    _group.add(flagMesh);

    _observationPost = { peak: peakMesh, tower: tShaft, top: tTop, x: 0, y: 23, z: -190 };

    // Build boss Colonel Krieger
    _buildBoss();
  }

  // ─── Enemy Spawning ───────────────────────────────────────────────────────────
  function _spawnEnemies() {
    // 14 mountain infantry — hide behind rocks, pop-up shots
    var infantryPositions = [
      { x: -8,  z: -20,  ledgeX: -8,  ledgeY: 0 },
      { x: 7,   z: -25,  ledgeX: 7,   ledgeY: 0 },
      { x: -6,  z: -45,  ledgeX: -6,  ledgeY: 0 },
      { x: 9,   z: -50,  ledgeX: 9,   ledgeY: 0 },
      { x: -10, z: -70,  ledgeX: -10, ledgeY: 0 },
      { x: 8,   z: -75,  ledgeX: 8,   ledgeY: 0 },
      { x: -7,  z: -90,  ledgeX: -7,  ledgeY: 0 },
      { x: 10,  z: -95,  ledgeX: 10,  ledgeY: 0 },
      { x: -14, z: -30,  ledgeX: -14, ledgeY: 7.5 },
      { x: 14,  z: -40,  ledgeX: 14,  ledgeY: 9.5 },
      { x: -14, z: -65,  ledgeX: -14, ledgeY: 11.5 },
      { x: 14,  z: -80,  ledgeX: 14,  ledgeY: 13.5 },
      { x: -14, z: -100, ledgeX: -14, ledgeY: 15.5 },
      { x: 14,  z: -120, ledgeX: 14,  ledgeY: 17.5 }
    ];

    for (var i = 0; i < infantryPositions.length; i++) {
      var ip = infantryPositions[i];
      _spawnEnemy(ip.x, ip.ledgeY + 0.9, ip.z, 'infantry', 0x665544, 75);
    }

    // 8 artillery crews — near the gun emplacements
    var crewPositions = [
      // Gun 0 at z=-50
      { x: -12, y: 0.9, z: -52 },
      { x: -8,  y: 0.9, z: -47 },
      { x: -14, y: 0.9, z: -48 },
      // Gun 1 at z=-100
      { x: 12,  y: 0.9, z: -102 },
      { x: 8,   y: 0.9, z: -97 },
      // Gun 2 at z=-165
      { x: -10, y: 0.9, z: -167 },
      { x: -6,  y: 0.9, z: -162 },
      { x: -12, y: 0.9, z: -163 }
    ];

    for (var ci = 0; ci < crewPositions.length; ci++) {
      var cp = crewPositions[ci];
      // Assign to nearest gun
      var gunIdx = ci < 3 ? 0 : (ci < 5 ? 1 : 2);
      _spawnEnemy(cp.x, cp.y, cp.z, 'crew', 0x554433, 85, gunIdx);
    }
  }

  function _spawnEnemy(x, y, z, type, color, hp, gunIdx) {
    // Body
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.4, 0.7);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, y + 0.7, z);
    _group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.28, 6, 6);
    var head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(x, y + 1.65, z);
    _group.add(head);

    var enemy = {
      body: body,
      head: head,
      hp: hp,
      maxHp: hp,
      type: type,
      color: color,
      state: 'idle',
      shootTimer: 2 + Math.random() * 3,
      popupTimer: 0,
      popped: false,
      baseX: x,
      baseY: y,
      baseZ: z,
      coverX: x,
      coverY: y,
      coverZ: z,
      alive: true,
      gunIdx: (gunIdx !== undefined) ? gunIdx : -1,
      switchedToPistol: false
    };

    _enemies.push(enemy);
    return enemy;
  }

  function _buildBoss() {
    var bossMat = new THREE.MeshLambertMaterial({ color: 0x443322 });

    var bBodyGeo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
    var bBody = new THREE.Mesh(bBodyGeo, bossMat);
    bBody.position.set(0, 24.9, -188);
    _group.add(bBody);

    var bHeadGeo = new THREE.SphereGeometry(0.38, 8, 8);
    var bHead = new THREE.Mesh(bHeadGeo, bossMat);
    bHead.position.set(0, 26.7, -188);
    _group.add(bHead);

    // Commander hat (small box on top)
    var hatGeo = new THREE.BoxGeometry(0.55, 0.35, 0.55);
    var hatMat = new THREE.MeshLambertMaterial({ color: 0x222211 });
    var hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.set(0, 27.1, -188);
    _group.add(hat);

    // Binoculars prop
    var binoGeo = new THREE.BoxGeometry(0.4, 0.2, 0.5);
    var binoMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var bino = new THREE.Mesh(binoGeo, binoMat);
    bino.position.set(0, 26.5, -187.6);
    _group.add(bino);

    _boss = {
      body: bBody,
      head: bHead,
      hat: hat,
      hp: 520,
      maxHp: 520,
      strikeTimer: 25,
      shootTimer: 1.5,
      alive: true,
      x: 0,
      y: 24.0,
      z: -188
    };
  }

  function _buildPlayer() {
    var playerGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var playerMat = new THREE.MeshLambertMaterial({ color: 0x2255AA });
    _player = new THREE.Mesh(playerGeo, playerMat);
    _player.position.set(0, 1.9, 30);
    _group.add(_player);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hud) return;
    _hud = document.createElement('div');
    _hud.id = 'mountain-pass-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#CCB866',
      'font-family:monospace',
      'font-size:12px',
      'padding:7px 16px',
      'border:1px solid #88773A',
      'border-radius:3px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hud) return;
    var gunsStr = 'GUNS: ' + _gunsDestroyed + '/3';
    var strikesActive = 0;
    for (var i = 0; i < _artilleryGuns.length; i++) {
      if (!_artilleryGuns[i].destroyed) strikesActive++;
    }
    var strikeStr = 'STRIKES: ' + strikesActive;
    var ammoStr = 'AMMO: ' + _ammo;
    var hpStr = 'HP: ' + Math.max(0, _playerHP);
    var bossStr = _boss ? ('KRIEGER: ' + Math.max(0, _boss.hp) + '/' + _boss.maxHp) : 'KRIEGER: DEFEATED';

    var status = '';
    if (_missionComplete) {
      status = ' | ★ MOUNTAIN PASS CLEARED ★';
    } else if (_bossDefeated && _gunsDestroyed >= 3) {
      status = ' | REACH SUMMIT!';
    }

    var supplies = '';
    for (var si = 0; si < _supplyCrates.length; si++) {
      if (!_supplyCrates[si].used) { supplies = ' | [E] AMMO CRATE NEAR'; break; }
    }

    _hud.textContent = 'MOUNTAIN PASS | ' + hpStr + ' | ' + ammoStr + ' | ' + gunsStr + ' | ' + strikeStr + ' | ' + bossStr + supplies + status;
  }

  // ─── Game Logic ────────────────────────────────────────────────────────────────

  function _tryResupply() {
    if (!_player) return;
    for (var i = 0; i < _supplyCrates.length; i++) {
      var crate = _supplyCrates[i];
      if (crate.used) continue;
      var dx = _player.position.x - crate.x;
      var dz = _player.position.z - crate.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        _ammo = Math.min(_ammo + 100, 300);
        crate.used = true;
        crate.mesh.material = new THREE.MeshLambertMaterial({ color: 0x333333 });
        _updateHUD();
        return;
      }
    }
  }

  function _playerShoot() {
    if (!_player || !_active) return;
    if (_ammo <= 0) return;
    _ammo--;

    // Raycast from camera toward scene — find nearest enemy in front
    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);

    var nearestEnemy = null;
    var nearestDist = 80;

    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;
      var ep = e.body.position;
      var toEnemy = new THREE.Vector3(ep.x - _camera.position.x, ep.y - _camera.position.y, ep.z - _camera.position.z);
      var dist = toEnemy.length();
      toEnemy.normalize();
      var dot = toEnemy.dot(camDir);
      if (dot > 0.92 && dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = e;
      }
    }

    if (nearestEnemy) {
      var dmg = 20 + Math.floor(Math.random() * 15);
      nearestEnemy.hp -= dmg;
      if (nearestEnemy.hp <= 0) {
        _killEnemy(nearestEnemy);
      }
      _updateHUD();
      return;
    }

    // Check artillery guns
    for (var gi = 0; gi < _artilleryGuns.length; gi++) {
      var gun = _artilleryGuns[gi];
      if (gun.destroyed) continue;
      var gp = gun.position;
      var toGun = new THREE.Vector3(gp.x - _camera.position.x, gp.y - _camera.position.y, gp.z - _camera.position.z);
      var gdist = toGun.length();
      toGun.normalize();
      var gdot = toGun.dot(camDir);
      if (gdot > 0.94 && gdist < 60) {
        gun.hp--;
        if (gun.hp <= 0) {
          _destroyGun(gun);
        }
        _updateHUD();
        return;
      }
    }

    // Check boss
    if (_boss && _boss.alive) {
      var bp = _boss.body.position;
      var toBoss = new THREE.Vector3(bp.x - _camera.position.x, bp.y - _camera.position.y, bp.z - _camera.position.z);
      var bdist = toBoss.length();
      toBoss.normalize();
      var bdot = toBoss.dot(camDir);
      if (bdot > 0.90 && bdist < 120) {
        var bdmg = 15 + Math.floor(Math.random() * 10);
        _boss.hp -= bdmg;
        if (_boss.hp <= 0) {
          _killBoss();
        }
        _updateHUD();
      }
    }
  }

  function _killEnemy(e) {
    e.alive = false;
    e.body.visible = false;
    e.head.visible = false;
    // Drop to ground
    e.body.position.y = -5;
    e.head.position.y = -5;
  }

  function _destroyGun(gun) {
    gun.destroyed = true;
    _gunsDestroyed++;

    // Visually tilt the barrel
    gun.barrel.rotation.x = 1.5;
    gun.barrel.rotation.z = 0.4;
    gun.barrel.material = new THREE.MeshLambertMaterial({ color: 0x111111 });
    gun.base.material = new THREE.MeshLambertMaterial({ color: 0x222222 });

    // Switch crew members to pistol mode (increase mobility, lower HP)
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (e.gunIdx === gun.index && !e.switchedToPistol && e.alive) {
        e.switchedToPistol = true;
        e.shootTimer = 1.2; // faster pistol shots
      }
    }

    _updateHUD();
  }

  function _killBoss() {
    _boss.alive = false;
    _bossDefeated = true;
    _boss.body.visible = false;
    _boss.head.visible = false;
    _boss.hat.visible = false;
    _updateHUD();
  }

  // ─── Artillery Mechanics ──────────────────────────────────────────────────────

  // Each active gun fires at player position every 20s
  function _updateArtilleryFire(delta) {
    for (var i = 0; i < _artilleryGuns.length; i++) {
      var gun = _artilleryGuns[i];
      if (gun.destroyed) continue;

      gun.fireTimer -= delta;
      if (gun.fireTimer <= 0) {
        gun.fireTimer = 20;
        // Fire — spawn impact warning at player position
        _spawnArtilleryImpact(_player.position.x, _player.position.z, 4, 40);
      }
    }
  }

  // Krieger calls strikes every 25s while guns operational
  function _updateBossStrikes(delta) {
    if (!_boss || !_boss.alive) return;
    if (_gunsDestroyed >= 3) return; // no more strikes

    _artilleryStrikeTimer -= delta;
    if (_artilleryStrikeTimer <= 0) {
      _artilleryStrikeTimer = 25;
      // 3 red marker zones
      for (var i = 0; i < 3; i++) {
        var sx = _player.position.x + (Math.random() - 0.5) * 16;
        var sz = _player.position.z + (Math.random() - 0.5) * 16;
        _spawnArtilleryImpact(sx, sz, 5, 55);
      }
    }
  }

  function _spawnArtilleryImpact(x, z, warningTime, damage) {
    // Red cone markers warning
    var cones = [];
    for (var i = 0; i < 3; i++) {
      var offsetX = (i === 0) ? 0 : (i === 1 ? 1 : -1);
      var offsetZ = (i === 0) ? 0 : (i === 1 ? 1 : -1);
      var coneGeo = new THREE.ConeGeometry(1.2, 3, 8);
      var coneMat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
      var coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.set(x + offsetX * 1.5, 1.5, z + offsetZ * 1.5);
      coneMesh.rotation.x = Math.PI; // point downward
      _group.add(coneMesh);
      cones.push(coneMesh);
    }

    _artilleryStrikes.push({
      cones: cones,
      timer: warningTime,
      x: x,
      z: z,
      damage: damage,
      warned: false
    });
  }

  function _updateArtilleryStrikes(delta) {
    for (var i = _artilleryStrikes.length - 1; i >= 0; i--) {
      var strike = _artilleryStrikes[i];
      strike.timer -= delta;

      // Flash the cones as warning
      var flash = (Math.floor(strike.timer * 3) % 2 === 0);
      for (var ci = 0; ci < strike.cones.length; ci++) {
        strike.cones[ci].visible = flash;
      }

      if (strike.timer <= 0) {
        // Explosion — check player proximity
        var dx = _player.position.x - strike.x;
        var dz = _player.position.z - strike.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 5) {
          _playerHP -= strike.damage;
          if (_playerHP < 0) _playerHP = 0;
          _updateHUD();
        }

        // Remove cones
        for (var ri = 0; ri < strike.cones.length; ri++) {
          _group.remove(strike.cones[ri]);
        }
        _artilleryStrikes.splice(i, 1);

        // Spawn brief explosion visual
        _spawnExplosionMarker(strike.x, strike.z);
      }
    }
  }

  function _spawnExplosionMarker(x, z) {
    // Quick orange sphere that fades
    var eGeo = new THREE.SphereGeometry(2, 6, 6);
    var eMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var eMesh = new THREE.Mesh(eGeo, eMat);
    eMesh.position.set(x, 2, z);
    _group.add(eMesh);
    // Remove after 0.6s
    _explosionMarkers.push({ mesh: eMesh, timer: 0.6 });
  }

  var _explosionMarkers = [];

  function _updateExplosionMarkers(delta) {
    for (var i = _explosionMarkers.length - 1; i >= 0; i--) {
      var em = _explosionMarkers[i];
      em.timer -= delta;
      var scale = em.timer / 0.6;
      em.mesh.scale.setScalar(1 + (1 - scale) * 2);
      if (em.timer <= 0) {
        _group.remove(em.mesh);
        _explosionMarkers.splice(i, 1);
      }
    }
  }

  // ─── Enemy AI ─────────────────────────────────────────────────────────────────

  function _updateEnemies(delta) {
    if (!_player) return;

    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;

      var px = _player.position.x;
      var py = _player.position.y;
      var pz = _player.position.z;
      var ex = e.body.position.x;
      var ey = e.body.position.y;
      var ez = e.body.position.z;

      var dx = px - ex;
      var dz = pz - ez;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (e.type === 'infantry') {
        _updateInfantry(e, delta, dx, dz, dist);
      } else if (e.type === 'crew') {
        _updateCrew(e, delta, dx, dz, dist);
      }
    }

    // Boss AI
    if (_boss && _boss.alive) {
      _updateBossAI(delta);
    }
  }

  function _updateInfantry(e, delta, dx, dz, dist) {
    // Pop-up shooting mechanic: hide, pop up, shoot, hide
    e.popupTimer -= delta;

    if (!e.popped) {
      // Hiding — duck down
      e.body.position.y = e.baseY + 0.4;
      e.head.position.y = e.baseY + 0.95;

      if (e.popupTimer <= 0) {
        // Pop up
        e.popped = true;
        e.popupTimer = 1.5 + Math.random() * 1.5; // stay up for 1.5-3s
        e.body.position.y = e.baseY + 0.7;
        e.head.position.y = e.baseY + 1.65;
      }
    } else {
      // Popped up — shoot at player
      e.shootTimer -= delta;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.0 + Math.random() * 0.8;
        if (dist < 50) {
          // Shoot player
          var accuracy = (dist > 30) ? 0.35 : 0.6;
          if (Math.random() < accuracy) {
            _playerHP -= 10;
            if (_playerHP < 0) _playerHP = 0;
            _updateHUD();
          }
          // Spawn projectile visual
          _spawnEnemyShot(e.body.position.x, e.body.position.y + 0.5, e.body.position.z);
        }
      }

      if (e.popupTimer <= 0) {
        // Duck back down
        e.popped = false;
        e.popupTimer = 2 + Math.random() * 3; // hide for 2-5s
      }
    }
  }

  function _updateCrew(e, delta, dx, dz, dist) {
    // Artillery crew: if gun is operational, stay at gun; if destroyed, switch to pistol/patrol
    var gunOp = (e.gunIdx >= 0 && !_artilleryGuns[e.gunIdx].destroyed);

    if (gunOp) {
      // Stay near the gun, shoot if player close
      e.shootTimer -= delta;
      if (e.shootTimer <= 0) {
        e.shootTimer = 2.5 + Math.random() * 1.5;
        if (dist < 40) {
          var crewAcc = 0.45;
          if (Math.random() < crewAcc) {
            _playerHP -= 12;
            if (_playerHP < 0) _playerHP = 0;
            _updateHUD();
          }
          _spawnEnemyShot(e.body.position.x, e.body.position.y + 0.5, e.body.position.z);
        }
      }
    } else {
      // Gun destroyed — aggro player, move toward
      if (dist > 3) {
        var speed = e.switchedToPistol ? 3.5 : 2;
        var nx = dx / Math.max(dist, 0.01);
        var nz = dz / Math.max(dist, 0.01);
        e.body.position.x += nx * speed * delta;
        e.body.position.z += nz * speed * delta;
        e.head.position.x = e.body.position.x;
        e.head.position.z = e.body.position.z;
      }

      e.shootTimer -= delta;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.0 + Math.random() * 0.8;
        if (dist < 25) {
          if (Math.random() < 0.55) {
            _playerHP -= 14;
            if (_playerHP < 0) _playerHP = 0;
            _updateHUD();
          }
          _spawnEnemyShot(e.body.position.x, e.body.position.y + 0.5, e.body.position.z);
        }
      }
    }
  }

  function _updateBossAI(delta) {
    // Boss stays in observation post, shoots at player, calls strikes
    _boss.shootTimer -= delta;
    if (_boss.shootTimer <= 0) {
      _boss.shootTimer = 2.0 + Math.random() * 1.5;

      var pdx = _player.position.x - _boss.x;
      var pdz = _player.position.z - _boss.z;
      var pdist = Math.sqrt(pdx * pdx + pdz * pdz);

      if (pdist < 120) {
        // Accurate sniper fire
        var bossAcc = 0.5;
        if (Math.random() < bossAcc) {
          _playerHP -= 20;
          if (_playerHP < 0) _playerHP = 0;
          _updateHUD();
        }
        _spawnEnemyShot(_boss.x, _boss.y + 3, _boss.z);
      }
    }
  }

  function _spawnEnemyShot(x, y, z) {
    var sGeo = new THREE.SphereGeometry(0.12, 4, 4);
    var sMat = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    var sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.set(x, y, z);
    _group.add(sMesh);

    var tx = _player.position.x;
    var ty = _player.position.y + 1;
    var tz = _player.position.z;
    var vx = tx - x;
    var vy = ty - y;
    var vz = tz - z;
    var vlen = Math.sqrt(vx * vx + vy * vy + vz * vz);
    var speed = 18;

    _enemyProjectiles.push({
      mesh: sMesh,
      vx: (vx / vlen) * speed,
      vy: (vy / vlen) * speed,
      vz: (vz / vlen) * speed,
      life: 2.5
    });
  }

  function _updateProjectiles(delta) {
    for (var i = _enemyProjectiles.length - 1; i >= 0; i--) {
      var p = _enemyProjectiles[i];
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.life -= delta;
      if (p.life <= 0) {
        _group.remove(p.mesh);
        _enemyProjectiles.splice(i, 1);
      }
    }
  }

  // ─── Player Movement ──────────────────────────────────────────────────────────

  function _updatePlayer(delta) {
    if (!_player) return;

    var speed = 7;
    var moveX = 0, moveZ = 0;

    if (_keysDown['ARROWLEFT']  || _keysDown['A']) moveX -= speed * delta;
    if (_keysDown['ARROWRIGHT'] || _keysDown['D']) moveX += speed * delta;
    if (_keysDown['ARROWUP']    || _keysDown['W']) moveZ -= speed * delta;
    if (_keysDown['ARROWDOWN']  || _keysDown['S']) moveZ += speed * delta;

    _player.position.x += moveX;
    _player.position.z += moveZ;

    // Gravity
    _playerVel.y -= 22 * delta;
    _player.position.y += _playerVel.y * delta;

    // Clamp horizontal to pass bounds
    _player.position.x = Math.max(-11, Math.min(11, _player.position.x));
    _player.position.z = Math.min(35, _player.position.z);

    // Ground / platform collision
    _onGround = false;
    var groundY = 0.9;

    if (_player.position.y <= groundY) {
      _player.position.y = groundY;
      _playerVel.y = 0;
      _onGround = true;
    }

    // Check near supply crates for HUD prompt
    var nearCrate = false;
    for (var i = 0; i < _supplyCrates.length; i++) {
      var crate = _supplyCrates[i];
      if (crate.used) continue;
      var cdx = _player.position.x - crate.x;
      var cdz = _player.position.z - crate.z;
      if (Math.sqrt(cdx * cdx + cdz * cdz) < 5) {
        nearCrate = true;
        break;
      }
    }

    // Check win conditions
    if (!_missionComplete && _gunsDestroyed >= 3 && _bossDefeated) {
      var sdx = _player.position.x - _observationPost.x;
      var sdz = _player.position.z - _observationPost.z;
      var sdist = Math.sqrt(sdx * sdx + sdz * sdz);
      if (sdist < 12) {
        _missionComplete = true;
        _summitReached = true;
        _updateHUD();
      }
    }
  }

  // ─── Camera ───────────────────────────────────────────────────────────────────

  function _updateCamera() {
    if (!_player || !_camera) return;
    _camera.position.set(
      _player.position.x,
      _player.position.y + 5,
      _player.position.z + 12
    );
    _camera.lookAt(
      _player.position.x,
      _player.position.y + 1,
      _player.position.z - 8
    );
  }

  // ─── Main Update ──────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _clock = new THREE.Clock();
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('mousedown', _onMouseDown);
  }

  function update() {
    if (!_active) return;
    var delta = _clock.getDelta();
    if (delta > 0.1) delta = 0.1;

    _updatePlayer(delta);
    _updateCamera();
    _updateEnemies(delta);
    _updateArtilleryFire(delta);
    _updateBossStrikes(delta);
    _updateArtilleryStrikes(delta);
    _updateProjectiles(delta);
    _updateExplosionMarkers(delta);
    _updateHUD();
  }

  function reset() {
    _active = false;
    _missionComplete = false;
    _summitReached = false;
    _bossDefeated = false;
    _gunsDestroyed = 0;
    _playerHP = 200;
    _ammo = 150;
    _artilleryStrikeTimer = 25;
    _onGround = false;
    _playerVel = { x: 0, y: 0, z: 0 };
    _keysDown = {};
    _keyTimers = {};

    if (_group) {
      _scene.remove(_group);
      _group = null;
    }
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }

    _rockPlatforms = [];
    _roadSegments = [];
    _cliffWalls = [];
    _bunkers = [];
    _bunkerSlits = [];
    _artilleryGuns = [];
    _artilleryStrikes = [];
    _enemies = [];
    _boss = null;
    _supplyCrates = [];
    _observationPost = null;
    _enemyProjectiles = [];
    _explosionMarkers = [];
    _chokePoints = [];

    if (_scene && _scene.fog) {
      _scene.fog = null;
    }

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    window.removeEventListener('mousedown', _onMouseDown);

    _player = null;
  }

  return { init: init, update: update, reset: reset };
}());
