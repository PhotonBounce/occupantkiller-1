window.SwampBase = (function() {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    player: null,

    // Meshes and objects
    waterSurface: null,
    platforms: [],
    airboat: null,
    airboatFan: null,
    cypresTowers: [],
    mossStrips: [],
    barge: null,
    bargeWeapons: [],
    ziplineCable: null,
    fogSpheres: [],
    alligators: [],
    campfire: null,
    campfireParticles: [],
    supplyDepot: null,
    watchtower: null,
    weaponCaches: [],
    ropeBridge: null,

    // Lighting and effects
    ambientLight: null,
    directionalLight: null,
    pointLight: null,
    fogBackup: null,
    backgroundColorBackup: null,

    // Animation state
    elapsedTime: 0,
    airboatFanRotation: 0,
    mossSwayPhase: 0,
    fogDriftPhase: 0,
    alligatorMovement: 0,
    campfireFlicker: 0,
    ziplineSwayPhase: 0,

    // Key tracking
    sKeyDown: false,
    wKeyDown: false,
    dKeyDown: false,
    zKeyDown: false,
    mouseDown: false,

    // Gameplay state
    weaponCacheHealth: [100, 100, 100], // Three weapon caches
    alligatorHunger: [0, 0, 0],
    ziplineActive: false,
    ziplineTimer: 0,

    // HUD
    hudElement: null,

    // Internals
    isInitialized: false
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var WATER_COLOR = 0x557744;
  var WATER_DEPTH_COLOR = 0x336633;
  var WOOD_COLOR = 0x8B6914;
  var CAMPFIRE_COLOR = 0xFF4400;
  var MOSS_COLOR = 0x88AA44;
  var PLATFORM_SCALE = 1.5;
  var ALLIGATOR_SPEED = 0.015;
  var FOG_DRIFT_SPEED = 0.05;
  var MOSS_SWAY_AMPLITUDE = 0.3;
  var CAMPFIRE_FLICKER_SPEED = 8;
  var ZIPLINE_SWAY_AMPLITUDE = 0.5;
  var ZIPLINE_SWAY_SPEED = 2;

  // ─── Scene Setup ──────────────────────────────────────────────────────────
  function createWaterSurface() {
    var geometry = new THREE.PlaneGeometry(200, 200, 32, 32);
    var material = new THREE.MeshStandardMaterial({
      color: WATER_COLOR,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x1a1a1a
    });
    var water = new THREE.Mesh(geometry, material);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    water.receiveShadow = true;
    water.castShadow = false;
    water.userData.type = 'water';
    return water;
  }

  function createSiltedPlatform(x, z, width, depth) {
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    // Platform surface
    var platformGeom = new THREE.BoxGeometry(width, 0.5, depth);
    var platformMat = new THREE.MeshStandardMaterial({
      color: WOOD_COLOR,
      roughness: 0.8,
      metalness: 0
    });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = 3;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    // Support legs (4 cylinders)
    var legGeom = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    var legMat = new THREE.MeshStandardMaterial({
      color: 0x4a3c2a,
      roughness: 0.9
    });
    var legPositions = [
      [-width / 2 + 0.5, 1.5, -depth / 2 + 0.5],
      [width / 2 - 0.5, 1.5, -depth / 2 + 0.5],
      [-width / 2 + 0.5, 1.5, depth / 2 - 0.5],
      [width / 2 - 0.5, 1.5, depth / 2 - 0.5]
    ];
    for (var i = 0; i < legPositions.length; i++) {
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(legPositions[i][0], legPositions[i][1], legPositions[i][2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    }

    group.userData.type = 'platform';
    return group;
  }

  function createAirboat() {
    var group = new THREE.Group();
    group.position.set(30, 0.5, -40);

    // Hull
    var hullGeom = new THREE.BoxGeometry(3, 0.8, 2);
    var hullMat = new THREE.MeshStandardMaterial({
      color: 0x1a4d1a,
      roughness: 0.7
    });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.y = 0.8;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Cabin (box on top)
    var cabinGeom = new THREE.BoxGeometry(2.5, 1, 1.5);
    var cabinMat = new THREE.MeshStandardMaterial({
      color: 0x0d260d,
      roughness: 0.6
    });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(0, 2, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Fan engine (spinning)
    var fanGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    var fanMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5
    });
    var fan = new THREE.Mesh(fanGeom, fanMat);
    fan.position.set(0, 2.8, 0);
    fan.castShadow = true;
    group.add(fan);

    // Fan blades
    var bladeGeom = new THREE.BoxGeometry(0.15, 1.5, 0.1);
    var bladeMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7
    });
    for (var b = 0; b < 3; b++) {
      var blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.set(0, 2.8, 0);
      blade.rotation.z = (Math.PI * 2 / 3) * b;
      blade.castShadow = true;
      group.add(blade);
    }
    group.airboatFan = fan;
    fan.userData.isAirboatFan = true;

    group.userData.type = 'airboat';
    return group;
  }

  function createCypressTree(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    // Trunk (tall cylinder)
    var trunkGeom = new THREE.CylinderGeometry(0.6, 0.8, 12, 12);
    var trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.9
    });
    var trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 6;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Spanish moss strips (hanging from top)
    var mossCount = 12;
    for (var m = 0; m < mossCount; m++) {
      var angle = (Math.PI * 2 / mossCount) * m;
      var mossX = Math.cos(angle) * 0.7;
      var mossZ = Math.sin(angle) * 0.7;

      var mossGeom = new THREE.BoxGeometry(0.15, 3, 0.15);
      var mossMat = new THREE.MeshStandardMaterial({
        color: MOSS_COLOR,
        roughness: 0.8,
        transparent: true,
        opacity: 0.9
      });
      var moss = new THREE.Mesh(mossGeom, mossMat);
      moss.position.set(mossX, 9, mossZ);
      moss.userData.basePosition = { x: mossX, y: 9, z: mossZ };
      moss.userData.originalZ = mossZ;
      moss.castShadow = true;
      moss.receiveShadow = true;
      group.add(moss);
      state.mossStrips.push(moss);
    }

    group.userData.type = 'tree';
    return group;
  }

  function createFloatingBarge() {
    var group = new THREE.Group();
    group.position.set(-30, 0.3, 20);

    // Barge hull
    var bargeGeom = new THREE.BoxGeometry(6, 1, 4);
    var bargeMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8
    });
    var barge = new THREE.Mesh(bargeGeom, bargeMat);
    barge.position.y = 0.5;
    barge.castShadow = true;
    barge.receiveShadow = true;
    group.add(barge);

    // Weapon crates on barge (3 wooden crates)
    var crateGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    var crateMat = new THREE.MeshStandardMaterial({
      color: 0xA0522D,
      roughness: 0.9
    });
    var cratePositions = [
      [-1.5, 1.5, 0],
      [0, 1.5, 0],
      [1.5, 1.5, 0]
    ];
    for (var c = 0; c < cratePositions.length; c++) {
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(cratePositions[c][0], cratePositions[c][1], cratePositions[c][2]);
      crate.castShadow = true;
      crate.receiveShadow = true;
      group.add(crate);
      state.bargeWeapons.push(crate);
    }

    group.userData.type = 'barge';
    return group;
  }

  function createZiplineStructure() {
    var group = new THREE.Group();

    // Start tower (left)
    var startTowerGeom = new THREE.CylinderGeometry(0.4, 0.5, 8, 8);
    var towerMat = new THREE.MeshStandardMaterial({
      color: WOOD_COLOR,
      roughness: 0.8
    });
    var startTower = new THREE.Mesh(startTowerGeom, towerMat);
    startTower.position.set(-50, 4, 0);
    startTower.castShadow = true;
    group.add(startTower);

    // End tower (right)
    var endTower = new THREE.Mesh(startTowerGeom, towerMat);
    endTower.position.set(50, 4, 0);
    endTower.castShadow = true;
    group.add(endTower);

    // Cable (line between towers)
    var cableGeom = new THREE.BufferGeometry();
    var cablePositions = new Float32Array([
      -50, 7, 0,
      50, 7, 0
    ]);
    cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
    var cableMat = new THREE.LineBasicMaterial({
      color: 0x333333,
      linewidth: 3
    });
    var cable = new THREE.LineSegments(cableGeom, cableMat);
    group.add(cable);
    group.ziplineCable = cable;

    group.userData.type = 'zipline';
    return group;
  }

  function createFogVolume(x, z) {
    var fogGeom = new THREE.SphereGeometry(4, 8, 8);
    var fogMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      emissive: 0xcccccc,
      wireframe: false
    });
    var fog = new THREE.Mesh(fogGeom, fogMat);
    fog.position.set(x, 3, z);
    fog.userData.basePosition = { x: x, y: 3, z: z };
    fog.userData.driftOffset = { x: 0, z: 0 };
    fog.userData.type = 'fog';
    return fog;
  }

  function createAlligator(x, z) {
    var group = new THREE.Mesh(new THREE.Group(), new THREE.Material());
    group = new THREE.Group();
    group.position.set(x, 0.3, z);

    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(0.8, 0.4, 2.5);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.9,
      emissive: 0x0a0a0a
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeom = new THREE.SphereGeometry(0.35, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({
      color: 0x234010,
      roughness: 0.95
    });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 0.5, 1.4);
    head.scale.set(1.2, 0.9, 1);
    head.castShadow = true;
    group.add(head);

    // Eye (small sphere)
    var eyeGeom = new THREE.SphereGeometry(0.1, 4, 4);
    var eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xff0000
    });
    var eye = new THREE.Mesh(eyeGeom, eyeMat);
    eye.position.set(0.15, 0.7, 1.6);
    group.add(eye);

    group.userData.type = 'alligator';
    group.userData.basePosition = { x: x, z: z };
    group.userData.movePhase = Math.random() * Math.PI * 2;
    return group;
  }

  function createCampfire(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 0.2, z);

    // Base logs (box)
    var logGeom = new THREE.BoxGeometry(1, 0.4, 1);
    var logMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.95
    });
    var log = new THREE.Mesh(logGeom, logMat);
    log.position.y = 0.2;
    log.castShadow = true;
    group.add(log);

    // Fire cone
    var fireGeom = new THREE.ConeGeometry(0.5, 2, 8);
    var fireMat = new THREE.MeshStandardMaterial({
      color: CAMPFIRE_COLOR,
      emissive: 0xFF6600,
      roughness: 0.8
    });
    var fire = new THREE.Mesh(fireGeom, fireMat);
    fire.position.y = 1;
    fire.castShadow = true;
    group.add(fire);
    group.fireParticle = fire;

    // Light
    var light = new THREE.PointLight(CAMPFIRE_COLOR, 2, 20);
    light.position.set(0, 1.5, 0);
    group.add(light);

    group.userData.type = 'campfire';
    return group;
  }

  function createSupplyDepot() {
    var group = new THREE.Group();
    group.position.set(-20, 0, -20);

    // Main building
    var buildingGeom = new THREE.BoxGeometry(4, 3, 3);
    var buildingMat = new THREE.MeshStandardMaterial({
      color: WOOD_COLOR,
      roughness: 0.85
    });
    var building = new THREE.Mesh(buildingGeom, buildingMat);
    building.position.y = 1.5;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Roof (sloped cone)
    var roofGeom = new THREE.ConeGeometry(2.5, 1.5, 4);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x663300,
      roughness: 0.9
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 3.2;
    roof.castShadow = true;
    group.add(roof);

    // Door
    var doorGeom = new THREE.BoxGeometry(1, 2, 0.2);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x4a3c2a
    });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 1.5, 1.6);
    group.add(door);

    group.userData.type = 'depot';
    return group;
  }

  function createWatchtower() {
    var group = new THREE.Group();
    group.position.set(25, 0, 25);

    // Tower base
    var baseGeom = new THREE.CylinderGeometry(0.8, 1, 8, 12);
    var baseMat = new THREE.MeshStandardMaterial({
      color: WOOD_COLOR,
      roughness: 0.8
    });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 4;
    base.castShadow = true;
    group.add(base);

    // Watch platform (box on top)
    var platformGeom = new THREE.BoxGeometry(2, 0.5, 2);
    var platformMat = new THREE.MeshStandardMaterial({
      color: 0x8B6914,
      roughness: 0.7
    });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = 8.5;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    // Railing posts
    var postGeom = new THREE.CylinderGeometry(0.15, 0.15, 2, 6);
    var postMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a
    });
    var railPositions = [
      [1.2, 9.5, 1.2],
      [1.2, 9.5, -1.2],
      [-1.2, 9.5, 1.2],
      [-1.2, 9.5, -1.2]
    ];
    for (var r = 0; r < railPositions.length; r++) {
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(railPositions[r][0], railPositions[r][1], railPositions[r][2]);
      group.add(post);
    }

    group.userData.type = 'watchtower';
    return group;
  }

  function createWeaponCache() {
    var group = new THREE.Group();

    // Metal crate
    var crateGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var crateMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.5,
      metalness: 0.8
    });
    var crate = new THREE.Mesh(crateGeom, crateMat);
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);

    // Lock (cylinder)
    var lockGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    var lockMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 1
    });
    var lock = new THREE.Mesh(lockGeom, lockMat);
    lock.position.set(0, 0, 0.75);
    group.add(lock);

    group.userData.type = 'weaponCache';
    group.userData.health = 100;
    return group;
  }

  function createRopeBridge() {
    var group = new THREE.Group();

    // Bridge planks
    var plankGeom = new THREE.BoxGeometry(5, 0.3, 0.5);
    var plankMat = new THREE.MeshStandardMaterial({
      color: WOOD_COLOR,
      roughness: 0.85
    });
    var plank = new THREE.Mesh(plankGeom, plankMat);
    plank.position.set(0, 4.5, -35);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);

    // Rope railing (lines)
    var ropeGeom = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      -2.5, 5.5, -35,
      2.5, 5.5, -35,
      -2.5, 5.5, -32,
      2.5, 5.5, -32
    ]);
    ropeGeom.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropeMat = new THREE.LineBasicMaterial({
      color: 0x8B4513,
      linewidth: 2
    });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    group.add(rope);

    group.userData.type = 'bridge';
    return group;
  }

  function init(_scene, _camera) {
    if (state.isInitialized) { return; }

    state.scene = _scene;
    state.camera = _camera;
    state.isInitialized = true;

    // Backup scene state
    state.fogBackup = _scene.fog;
    state.backgroundColorBackup = _scene.background;

    // Create water surface
    state.waterSurface = createWaterSurface();
    _scene.add(state.waterSurface);

    // Create platforms
    var platformConfigs = [
      { x: 0, z: 0, w: 3, d: 3 },
      { x: 20, z: 20, w: 3, d: 3 },
      { x: -20, z: 20, w: 3, d: 3 }
    ];
    for (var p = 0; p < platformConfigs.length; p++) {
      var plat = createSiltedPlatform(
        platformConfigs[p].x,
        platformConfigs[p].z,
        platformConfigs[p].w,
        platformConfigs[p].d
      );
      state.platforms.push(plat);
      _scene.add(plat);
    }

    // Airboat
    state.airboat = createAirboat();
    _scene.add(state.airboat);

    // Cypress trees with moss
    var treeConfigs = [
      [-30, -30],
      [-25, 15],
      [15, -25],
      [40, 10],
      [-45, 5],
      [35, -35]
    ];
    for (var t = 0; t < treeConfigs.length; t++) {
      var tree = createCypressTree(treeConfigs[t][0], treeConfigs[t][1]);
      _scene.add(tree);
      state.cypresTowers.push(tree);
    }

    // Floating barge with weapons
    state.barge = createFloatingBarge();
    _scene.add(state.barge);

    // Zipline structure
    var ziplineGroup = createZiplineStructure();
    state.ziplineCable = ziplineGroup.ziplineCable;
    _scene.add(ziplineGroup);

    // Fog volumes
    var fogConfigs = [
      [-40, -40],
      [40, 40],
      [-40, 40],
      [40, -40],
      [0, 0]
    ];
    for (var f = 0; f < fogConfigs.length; f++) {
      var fogVol = createFogVolume(fogConfigs[f][0], fogConfigs[f][1]);
      state.fogSpheres.push(fogVol);
      _scene.add(fogVol);
    }

    // Alligators
    var gatorConfigs = [
      [10, 10],
      [-15, -15],
      [5, -25]
    ];
    for (var g = 0; g < gatorConfigs.length; g++) {
      var gator = createAlligator(gatorConfigs[g][0], gatorConfigs[g][1]);
      state.alligators.push(gator);
      _scene.add(gator);
    }

    // Campfire
    state.campfire = createCampfire(0, 5);
    _scene.add(state.campfire);

    // Supply depot
    state.supplyDepot = createSupplyDepot();
    _scene.add(state.supplyDepot);

    // Watchtower
    state.watchtower = createWatchtower();
    _scene.add(state.watchtower);

    // Weapon caches (3 distributed)
    var cacheConfigs = [
      [15, 0, 8],
      [-15, 0, 8],
      [0, 0, -30]
    ];
    for (var w = 0; w < cacheConfigs.length; w++) {
      var cache = createWeaponCache();
      cache.position.set(cacheConfigs[w][0], cacheConfigs[w][1], cacheConfigs[w][2]);
      state.weaponCaches.push(cache);
      _scene.add(cache);
    }

    // Rope bridge
    state.ropeBridge = createRopeBridge();
    _scene.add(state.ropeBridge);

    // Lighting
    state.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    _scene.add(state.ambientLight);

    state.directionalLight = new THREE.DirectionalLight(0xffffcc, 0.8);
    state.directionalLight.position.set(50, 60, 50);
    state.directionalLight.castShadow = true;
    state.directionalLight.shadow.mapSize.width = 2048;
    state.directionalLight.shadow.mapSize.height = 2048;
    _scene.add(state.directionalLight);

    state.pointLight = new THREE.PointLight(0x8B6914, 0.4, 60);
    state.pointLight.position.set(0, 4, 5);
    _scene.add(state.pointLight);

    // Fog effect
    _scene.fog = new THREE.Fog(0x4a5a3a, 100, 200);

    // Keyboard handlers
    if (!window.swampBaseKeyBindings) {
      window.swampBaseKeyBindings = true;
      document.addEventListener('keydown', onKeyDown, false);
      document.addEventListener('keyup', onKeyUp, false);
    }

    state.active = true;
  }

  function onKeyDown(e) {
    if (!state.active) { return; }
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 's') { state.sKeyDown = true; }
    if (key === 'w') { state.wKeyDown = true; }
    if (key === 'd') { state.dKeyDown = true; }
    if (key === 'z') { state.zKeyDown = true; }
    if (e.button === 0) { state.mouseDown = true; }

    // Toggle: S+W
    if (state.sKeyDown && state.wKeyDown) {
      if (state.active) {
        reset();
      } else {
        state.active = true;
      }
    }
  }

  function onKeyUp(e) {
    if (!state.isInitialized) { return; }
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 's') { state.sKeyDown = false; }
    if (key === 'w') { state.wKeyDown = false; }
    if (key === 'd') { state.dKeyDown = false; }
    if (key === 'z') { state.zKeyDown = false; }
    if (e.button === 0) { state.mouseDown = false; }
  }

  function update(delta) {
    if (!state.isInitialized || !state.active) { return; }

    state.elapsedTime += delta;

    // Water shimmering
    if (state.waterSurface) {
      var waterMaterial = state.waterSurface.material;
      if (waterMaterial) {
        waterMaterial.emissive.setHex(0x1a1a1a + Math.floor(Math.sin(state.elapsedTime * 2) * 5000));
      }
    }

    // Airboat fan spinning
    if (state.airboat && state.airboat.airboatFan) {
      state.airboatFanRotation += delta * 15;
      state.airboat.airboatFan.rotation.y = state.airboatFanRotation;
    }

    // Moss swaying
    state.mossSwayPhase += delta * 0.5;
    for (var m = 0; m < state.mossStrips.length; m++) {
      var moss = state.mossStrips[m];
      if (moss.userData.basePosition) {
        var sway = Math.sin(state.mossSwayPhase + m) * MOSS_SWAY_AMPLITUDE;
        moss.position.x = moss.userData.basePosition.x + sway;
        moss.position.z = moss.userData.basePosition.z + (Math.cos(state.mossSwayPhase * 0.7) * MOSS_SWAY_AMPLITUDE * 0.5);
      }
    }

    // Fog drifting
    state.fogDriftPhase += delta * FOG_DRIFT_SPEED;
    for (var f = 0; f < state.fogSpheres.length; f++) {
      var fog = state.fogSpheres[f];
      if (fog.userData.basePosition) {
        fog.position.x = fog.userData.basePosition.x + Math.sin(state.fogDriftPhase) * 3;
        fog.position.z = fog.userData.basePosition.z + Math.cos(state.fogDriftPhase * 0.7) * 3;
      }
    }

    // Alligator movement
    state.alligatorMovement += delta * ALLIGATOR_SPEED;
    for (var a = 0; a < state.alligators.length; a++) {
      var gator = state.alligators[a];
      if (gator.userData.basePosition) {
        var moveOffset = state.alligatorMovement + gator.userData.movePhase;
        gator.position.x = gator.userData.basePosition.x + Math.cos(moveOffset) * 8;
        gator.position.z = gator.userData.basePosition.z + Math.sin(moveOffset) * 8;
        gator.rotation.y = moveOffset;
      }
    }

    // Campfire flickering
    state.campfireFlicker += delta * CAMPFIRE_FLICKER_SPEED;
    if (state.campfire && state.campfire.fireParticle) {
      var flicker = 1 + Math.sin(state.campfireFlicker) * 0.3;
      state.campfire.fireParticle.scale.y = flicker;
      var fireLight = state.campfire.children[2];
      if (fireLight && fireLight.isLight) {
        fireLight.intensity = 2 * flicker;
      }
    }

    // Zipline sway
    state.ziplineSwayPhase += delta * ZIPLINE_SWAY_SPEED;
    if (state.ziplineCable) {
      var cableMat = state.ziplineCable.material;
      if (cableMat) {
        cableMat.linewidth = 3 + Math.sin(state.ziplineSwayPhase) * ZIPLINE_SWAY_AMPLITUDE;
      }
    }

    // Handle D key presses: shoot at weapon caches
    if (state.dKeyDown) {
      for (var c = 0; c < state.weaponCaches.length; c++) {
        state.weaponCacheHealth[c] -= delta * 20;
        if (state.weaponCacheHealth[c] < 0) {
          state.weaponCacheHealth[c] = 0;
        }
      }
    }

    // Handle Z key: use zipline
    if (state.zKeyDown && !state.ziplineActive) {
      state.ziplineActive = true;
      state.ziplineTimer = 5;
    }

    if (state.ziplineActive) {
      state.ziplineTimer -= delta;
      if (state.ziplineTimer <= 0) {
        state.ziplineActive = false;
      }
    }
  }

  function reset() {
    state.active = false;

    // Remove event listeners
    if (window.swampBaseKeyBindings) {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.swampBaseKeyBindings = false;
    }

    // Remove scene objects
    if (state.scene) {
      if (state.waterSurface) {
        state.scene.remove(state.waterSurface);
        state.waterSurface.geometry.dispose();
        state.waterSurface.material.dispose();
      }
      for (var p = 0; p < state.platforms.length; p++) {
        state.scene.remove(state.platforms[p]);
      }
      if (state.airboat) {
        state.scene.remove(state.airboat);
      }
      for (var t = 0; t < state.cypresTowers.length; t++) {
        state.scene.remove(state.cypresTowers[t]);
      }
      if (state.barge) {
        state.scene.remove(state.barge);
      }
      for (var f = 0; f < state.fogSpheres.length; f++) {
        state.scene.remove(state.fogSpheres[f]);
      }
      for (var g = 0; g < state.alligators.length; g++) {
        state.scene.remove(state.alligators[g]);
      }
      if (state.campfire) {
        state.scene.remove(state.campfire);
      }
      if (state.supplyDepot) {
        state.scene.remove(state.supplyDepot);
      }
      if (state.watchtower) {
        state.scene.remove(state.watchtower);
      }
      for (var w = 0; w < state.weaponCaches.length; w++) {
        state.scene.remove(state.weaponCaches[w]);
      }
      if (state.ropeBridge) {
        state.scene.remove(state.ropeBridge);
      }
      if (state.ambientLight) {
        state.scene.remove(state.ambientLight);
      }
      if (state.directionalLight) {
        state.scene.remove(state.directionalLight);
      }
      if (state.pointLight) {
        state.scene.remove(state.pointLight);
      }
    }

    // Reset state
    state = {
      active: false,
      scene: null,
      camera: null,
      player: null,
      waterSurface: null,
      platforms: [],
      airboat: null,
      airboatFan: null,
      cypresTowers: [],
      mossStrips: [],
      barge: null,
      bargeWeapons: [],
      ziplineCable: null,
      fogSpheres: [],
      alligators: [],
      campfire: null,
      campfireParticles: [],
      supplyDepot: null,
      watchtower: null,
      weaponCaches: [],
      ropeBridge: null,
      ambientLight: null,
      directionalLight: null,
      pointLight: null,
      fogBackup: null,
      backgroundColorBackup: null,
      elapsedTime: 0,
      airboatFanRotation: 0,
      mossSwayPhase: 0,
      fogDriftPhase: 0,
      alligatorMovement: 0,
      campfireFlicker: 0,
      ziplineSwayPhase: 0,
      sKeyDown: false,
      wKeyDown: false,
      dKeyDown: false,
      zKeyDown: false,
      mouseDown: false,
      weaponCacheHealth: [100, 100, 100],
      alligatorHunger: [0, 0, 0],
      ziplineActive: false,
      ziplineTimer: 0,
      hudElement: null,
      isInitialized: false
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
