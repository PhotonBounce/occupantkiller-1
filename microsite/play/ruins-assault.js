window.RuinsAssault = (function() {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    player: null,

    // Ruins objects
    collapsedWalls: [],
    rubbleMounds: [],
    shellCraters: [],
    burningVehicles: [],
    sandbagWalls: [],
    archDoorways: [],
    rebarPoles: [],
    waterPuddles: [],
    sniperPositions: [],
    propagandaMurals: [],
    ammoCaches: [],
    tunnelEntrance: null,

    // Animation state
    elapsedTime: 0,
    fireFlickers: [],
    smokeColumns: [],
    particleSystems: [],

    // Lighting
    ambientLight: null,
    fireLight: null,
    fogBackup: null,
    backgroundColorBackup: null
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var RUINS_RADIUS = 100;
  var BUILDING_HEIGHT = 8;
  var RUBBLE_COUNT = 15;
  var SHELL_CRATER_COUNT = 8;
  var BURNING_VEHICLE_COUNT = 4;
  var SANDBAG_WALL_COUNT = 6;
  var ARCH_DOORWAY_COUNT = 4;
  var REBAR_POLE_COUNT = 12;
  var SNIPER_POSITION_COUNT = 3;
  var PROPAGANDA_MURAL_COUNT = 3;
  var AMMO_CACHE_COUNT = 5;

  var COLOR_TAN_RUBBLE = 0x886644;
  var COLOR_FIRE = 0xFF4400;
  var COLOR_CONCRETE = 0x888888;
  var COLOR_DARK_CRATER = 0x444422;
  var COLOR_VEGETATION = 0x88AA44;

  // ─── Public Initialization ────────────────────────────────────────────────
  function init(_scene, _camera) {
    state.scene = _scene;
    state.camera = _camera;
    state.active = true;

    // Backup current fog and background
    state.fogBackup = state.scene.fog;
    state.backgroundColorBackup = state.scene.background;

    // Set ruins atmosphere
    state.scene.fog = new THREE.FogExp2(0x999999, 0.008);
    state.scene.background = new THREE.Color(0x4A5859);

    // Lighting
    var ambLightColor = 0xBBBBBB;
    var ambLightIntensity = 0.8;
    state.ambientLight = new THREE.AmbientLight(ambLightColor, ambLightIntensity);
    state.scene.add(state.ambientLight);

    // Fire light (flickering)
    state.fireLight = new THREE.PointLight(0xFF6633, 0.5, 80);
    state.fireLight.position.set(-20, 10, -30);
    state.scene.add(state.fireLight);

    // Build scene
    buildCollapsedWalls();
    buildRubbleMounds();
    buildShellCraters();
    buildBurningVehicles();
    buildSandbagWalls();
    buildArchDoorways();
    buildRebarPoles();
    buildTunnelEntrance();
    buildWaterPuddles();
    buildSniperPositions();
    buildPropagandaMurals();
    buildAmmoCaches();

    state.elapsedTime = 0;
  }

  // ─── Deactivation / Reset ─────────────────────────────────────────────────
  function reset() {
    if (!state.active) { return; }
    state.active = false;

    // Restore fog and background
    state.scene.fog = state.fogBackup;
    state.scene.background = state.backgroundColorBackup;

    // Remove lights
    if (state.ambientLight) {
      state.scene.remove(state.ambientLight);
      state.ambientLight = null;
    }
    if (state.fireLight) {
      state.scene.remove(state.fireLight);
      state.fireLight = null;
    }

    // Remove all ruins objects
    var i;
    for (i = 0; i < state.collapsedWalls.length; i++) {
      state.scene.remove(state.collapsedWalls[i]);
    }
    state.collapsedWalls = [];

    for (i = 0; i < state.rubbleMounds.length; i++) {
      state.scene.remove(state.rubbleMounds[i].group);
    }
    state.rubbleMounds = [];

    for (i = 0; i < state.shellCraters.length; i++) {
      state.scene.remove(state.shellCraters[i]);
    }
    state.shellCraters = [];

    for (i = 0; i < state.burningVehicles.length; i++) {
      state.scene.remove(state.burningVehicles[i].group);
    }
    state.burningVehicles = [];

    for (i = 0; i < state.sandbagWalls.length; i++) {
      state.scene.remove(state.sandbagWalls[i]);
    }
    state.sandbagWalls = [];

    for (i = 0; i < state.archDoorways.length; i++) {
      state.scene.remove(state.archDoorways[i]);
    }
    state.archDoorways = [];

    for (i = 0; i < state.rebarPoles.length; i++) {
      state.scene.remove(state.rebarPoles[i]);
    }
    state.rebarPoles = [];

    for (i = 0; i < state.sniperPositions.length; i++) {
      state.scene.remove(state.sniperPositions[i]);
    }
    state.sniperPositions = [];

    for (i = 0; i < state.propagandaMurals.length; i++) {
      state.scene.remove(state.propagandaMurals[i]);
    }
    state.propagandaMurals = [];

    for (i = 0; i < state.ammoCaches.length; i++) {
      state.scene.remove(state.ammoCaches[i]);
    }
    state.ammoCaches = [];

    for (i = 0; i < state.waterPuddles.length; i++) {
      state.scene.remove(state.waterPuddles[i]);
    }
    state.waterPuddles = [];

    if (state.tunnelEntrance) {
      state.scene.remove(state.tunnelEntrance.group);
      state.tunnelEntrance = null;
    }

    state.fireFlickers = [];
    state.smokeColumns = [];
    state.particleSystems = [];
    state.elapsedTime = 0;
  }

  // ─── Building Functions ───────────────────────────────────────────────────

  function buildCollapsedWalls() {
    var i, j;
    // Build 3-4 clusters of irregular box stacks
    for (i = 0; i < 3; i++) {
      var baseX = (Math.random() - 0.5) * RUINS_RADIUS * 1.5;
      var baseZ = (Math.random() - 0.5) * RUINS_RADIUS * 1.5;

      // Each cluster has 4-6 wall segments
      var segmentCount = 4 + Math.floor(Math.random() * 3);
      for (j = 0; j < segmentCount; j++) {
        var width = 8 + Math.random() * 6;
        var height = 6 + Math.random() * 4;
        var depth = 2 + Math.random() * 1.5;

        var geo = new THREE.BoxGeometry(width, height, depth);
        var mat = new THREE.MeshLambertMaterial({ color: COLOR_TAN_RUBBLE });
        var wall = new THREE.Mesh(geo, mat);

        wall.position.set(
          baseX + (Math.random() - 0.5) * 15,
          height / 2,
          baseZ + (Math.random() - 0.5) * 15
        );
        wall.rotation.z = (Math.random() - 0.5) * 0.3;
        wall.castShadow = true;
        wall.receiveShadow = true;

        state.scene.add(wall);
        state.collapsedWalls.push(wall);
      }
    }
  }

  function buildRubbleMounds() {
    var i, j;
    for (i = 0; i < RUBBLE_COUNT; i++) {
      var group = new THREE.Group();
      var cx = (Math.random() - 0.5) * RUINS_RADIUS * 1.6;
      var cz = (Math.random() - 0.5) * RUINS_RADIUS * 1.6;
      group.position.set(cx, 0, cz);

      // Pile 5-8 boxes irregularly
      var boxCount = 5 + Math.floor(Math.random() * 4);
      for (j = 0; j < boxCount; j++) {
        var bw = 2 + Math.random() * 2;
        var bh = 1.5 + Math.random() * 2;
        var bd = 2 + Math.random() * 2;

        var geo = new THREE.BoxGeometry(bw, bh, bd);
        var mat = new THREE.MeshLambertMaterial({
          color: COLOR_TAN_RUBBLE,
          roughness: 0.8
        });
        var box = new THREE.Mesh(geo, mat);

        box.position.set(
          (Math.random() - 0.5) * 4,
          bh / 2 + j * (bh * 0.6),
          (Math.random() - 0.5) * 4
        );
        box.rotation.set(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        );
        box.castShadow = true;
        box.receiveShadow = true;

        group.add(box);
      }

      state.scene.add(group);
      state.rubbleMounds.push({ group: group, x: cx, z: cz });
    }
  }

  function buildShellCraters() {
    var i;
    for (i = 0; i < SHELL_CRATER_COUNT; i++) {
      var craterX = (Math.random() - 0.5) * RUINS_RADIUS * 1.8;
      var craterZ = (Math.random() - 0.5) * RUINS_RADIUS * 1.8;
      var craterRad = 6 + Math.random() * 4;

      // Outer rim (raised depression border)
      var rimGeo = new THREE.CylinderGeometry(craterRad + 1, craterRad + 0.5, 0.5, 16);
      var rimMat = new THREE.MeshLambertMaterial({ color: COLOR_DARK_CRATER });
      var rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(craterX, 0.25, craterZ);
      rim.castShadow = true;
      rim.receiveShadow = true;
      state.scene.add(rim);
      state.shellCraters.push(rim);

      // Inner crater floor (darker, depressed)
      var floorGeo = new THREE.CylinderGeometry(craterRad - 0.5, craterRad, 1.5, 16);
      var floorMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
      var floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(craterX, -0.75, craterZ);
      floor.receiveShadow = true;
      state.scene.add(floor);
      state.shellCraters.push(floor);
    }
  }

  function buildBurningVehicles() {
    var i, j;
    for (i = 0; i < BURNING_VEHICLE_COUNT; i++) {
      var group = new THREE.Group();
      var vx = (Math.random() - 0.5) * RUINS_RADIUS * 1.5;
      var vz = (Math.random() - 0.5) * RUINS_RADIUS * 1.5;
      group.position.set(vx, 0, vz);

      // Vehicle body (elongated box)
      var bodyGeo = new THREE.BoxGeometry(6, 2.5, 2.5);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Wheels
      for (j = 0; j < 2; j++) {
        var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(-1.5 + j * 3, 1.2, 1.3);
        wheel.castShadow = true;
        group.add(wheel);
      }

      // Burning debris on top (emissive)
      var fireGeo = new THREE.BoxGeometry(3, 1, 1.5);
      var fireMat = new THREE.MeshBasicMaterial({ color: COLOR_FIRE });
      var fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.set(0, 2, 0);
      group.add(fire);

      state.scene.add(group);
      state.burningVehicles.push({
        group: group,
        fire: fire,
        x: vx,
        z: vz,
        fireIntensity: 1.0
      });

      state.fireFlickers.push({
        mesh: fire,
        baseIntensity: 0.7,
        flickerSpeed: 3 + Math.random() * 2,
        flickerAmount: 0.5
      });
    }
  }

  function buildSandbagWalls() {
    var i, j;
    for (i = 0; i < SANDBAG_WALL_COUNT; i++) {
      var baseX = (Math.random() - 0.5) * RUINS_RADIUS;
      var baseZ = (Math.random() - 0.5) * RUINS_RADIUS;
      var length = 8 + Math.random() * 6;

      var bagCount = Math.floor(length / 0.8);
      for (j = 0; j < bagCount; j++) {
        var bagGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
        var bagMat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var bag = new THREE.Mesh(bagGeo, bagMat);

        var angleRot = (Math.random() - 0.5) * 0.4;
        var yOffset = (j % 2) * 0.5;

        bag.position.set(
          baseX + j * 0.8,
          0.25 + yOffset,
          baseZ
        );
        bag.rotation.y = angleRot;
        bag.castShadow = true;
        bag.receiveShadow = true;

        state.scene.add(bag);
        state.sandbagWalls.push(bag);
      }
    }
  }

  function buildArchDoorways() {
    var i;
    for (i = 0; i < ARCH_DOORWAY_COUNT; i++) {
      var archX = (Math.random() - 0.5) * RUINS_RADIUS;
      var archZ = (Math.random() - 0.5) * RUINS_RADIUS;

      // Left pillar
      var lPillarGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
      var lPillarMat = new THREE.MeshLambertMaterial({ color: COLOR_CONCRETE });
      var lPillar = new THREE.Mesh(lPillarGeo, lPillarMat);
      lPillar.position.set(archX - 3, 2.5, archZ);
      lPillar.castShadow = true;
      state.scene.add(lPillar);
      state.archDoorways.push(lPillar);

      // Right pillar
      var rPillarGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
      var rPillarMat = new THREE.MeshLambertMaterial({ color: COLOR_CONCRETE });
      var rPillar = new THREE.Mesh(rPillarGeo, rPillarMat);
      rPillar.position.set(archX + 3, 2.5, archZ);
      rPillar.castShadow = true;
      state.scene.add(rPillar);
      state.archDoorways.push(rPillar);

      // Lintel beam (top)
      var lintelGeo = new THREE.BoxGeometry(7, 1.2, 1.5);
      var lintelMat = new THREE.MeshLambertMaterial({ color: COLOR_CONCRETE });
      var lintel = new THREE.Mesh(lintelGeo, lintelMat);
      lintel.position.set(archX, 5.2, archZ);
      lintel.castShadow = true;
      state.scene.add(lintel);
      state.archDoorways.push(lintel);

      // Arch curve (stone blocks along curved path)
      var segmentCount = 8;
      var j;
      for (j = 0; j < segmentCount; j++) {
        var angle = (j / segmentCount) * Math.PI;
        var archRadius = 3.5;
        var blockX = archX + Math.sin(angle) * archRadius - archRadius * Math.sin(Math.PI / 2);
        var blockY = 5.5 + Math.cos(angle) * archRadius - archRadius;

        var blockGeo = new THREE.BoxGeometry(0.6, 0.6, 1.5);
        var blockMat = new THREE.MeshLambertMaterial({ color: 0x9E8B77 });
        var block = new THREE.Mesh(blockGeo, blockMat);
        block.position.set(blockX, blockY, archZ);
        block.castShadow = true;
        state.scene.add(block);
        state.archDoorways.push(block);
      }
    }
  }

  function buildRebarPoles() {
    var i;
    for (i = 0; i < REBAR_POLE_COUNT; i++) {
      var poleX = (Math.random() - 0.5) * RUINS_RADIUS * 1.8;
      var poleZ = (Math.random() - 0.5) * RUINS_RADIUS * 1.8;
      var poleHeight = 8 + Math.random() * 4;

      var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, poleHeight, 6);
      var poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var pole = new THREE.Mesh(poleGeo, poleMat);

      pole.position.set(poleX, poleHeight / 2, poleZ);
      pole.castShadow = true;
      pole.receiveShadow = true;

      state.scene.add(pole);
      state.rebarPoles.push(pole);

      // Store shadow oscillation data
      pole.userData.shadowPhase = Math.random() * Math.PI * 2;
    }
  }

  function buildTunnelEntrance() {
    var tunnelGroup = new THREE.Group();
    tunnelGroup.position.set(-40, 0, 40);

    // Tunnel mouth (dark cylinder)
    var tunnelGeo = new THREE.CylinderGeometry(4, 4, 6, 16);
    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(0, 2, 0);
    tunnel.castShadow = true;
    tunnelGroup.add(tunnel);

    // Reinforced entrance frame
    var frameGeo = new THREE.BoxGeometry(9, 5, 1.5);
    var frameMat = new THREE.MeshLambertMaterial({ color: COLOR_CONCRETE });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 3, -3);
    frame.castShadow = true;
    tunnelGroup.add(frame);

    // Glow inside (emissive material suggesting light/danger)
    var glowGeo = new THREE.SphereGeometry(3, 8, 8);
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0xFF6633,
      transparent: true,
      opacity: 0.3
    });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, 2, 1);
    tunnelGroup.add(glow);

    state.scene.add(tunnelGroup);
    state.tunnelEntrance = {
      group: tunnelGroup,
      glow: glow,
      glowPhase: 0
    };
  }

  function buildWaterPuddles() {
    var i;
    for (i = 0; i < SHELL_CRATER_COUNT; i++) {
      // Place puddles in/near craters
      if (state.shellCraters.length > 0) {
        var craterMound = state.rubbleMounds[i % state.rubbleMounds.length];
        if (!craterMound) { continue; }

        var pudGeo = new THREE.PlaneGeometry(4 + Math.random() * 3, 2 + Math.random() * 2);
        var pudMat = new THREE.MeshLambertMaterial({
          color: 0x2A4466,
          transparent: true,
          opacity: 0.5
        });
        var puddle = new THREE.Mesh(pudGeo, pudMat);

        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(
          craterMound.x + (Math.random() - 0.5) * 4,
          0.01,
          craterMound.z + (Math.random() - 0.5) * 4
        );
        puddle.receiveShadow = true;

        state.scene.add(puddle);
        state.waterPuddles.push(puddle);

        // Ripple animation data
        puddle.userData.ripplePhase = Math.random() * Math.PI * 2;
        puddle.userData.rippleSpeed = 2 + Math.random();
        puddle.userData.baseScale = puddle.scale.clone();
      }
    }
  }

  function buildSniperPositions() {
    var i;
    for (i = 0; i < SNIPER_POSITION_COUNT; i++) {
      var posX = (Math.random() - 0.5) * RUINS_RADIUS;
      var posZ = (Math.random() - 0.5) * RUINS_RADIUS;

      // Elevated platform
      var platformGeo = new THREE.BoxGeometry(3, 0.4, 3);
      var platformMat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(posX, 8, posZ);
      platform.castShadow = true;
      state.scene.add(platform);
      state.sniperPositions.push(platform);

      // Support pillar
      var pillarGeo = new THREE.CylinderGeometry(0.6, 1, 8, 8);
      var pillarMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(posX, 4, posZ);
      pillar.castShadow = true;
      state.scene.add(pillar);
      state.sniperPositions.push(pillar);

      // Sandbag barrier on platform
      var barrierGeo = new THREE.BoxGeometry(2.5, 0.6, 0.8);
      var barrierMat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
      var barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(posX, 8.5, posZ - 1.2);
      barrier.castShadow = true;
      state.scene.add(barrier);
      state.sniperPositions.push(barrier);
    }
  }

  function buildPropagandaMurals() {
    var i;
    var muralsData = [
      { x: 30, z: -50, width: 12, height: 6, color: 0xAA3333 },
      { x: -50, z: 20, width: 10, height: 5, color: 0x333388 },
      { x: 10, z: 60, width: 14, height: 7, color: 0x444444 }
    ];

    for (i = 0; i < Math.min(PROPAGANDA_MURAL_COUNT, muralsData.length); i++) {
      var mData = muralsData[i];
      var muralGeo = new THREE.BoxGeometry(mData.width, mData.height, 0.3);
      var muralMat = new THREE.MeshLambertMaterial({ color: mData.color });
      var mural = new THREE.Mesh(muralGeo, muralMat);

      mural.position.set(mData.x, mData.height / 2 + 2, mData.z);
      mural.castShadow = true;
      mural.receiveShadow = true;

      state.scene.add(mural);
      state.propagandaMurals.push(mural);
    }
  }

  function buildAmmoCaches() {
    var i;
    for (i = 0; i < AMMO_CACHE_COUNT; i++) {
      var group = new THREE.Group();
      var cacheX = (Math.random() - 0.5) * RUINS_RADIUS * 1.5;
      var cacheZ = (Math.random() - 0.5) * RUINS_RADIUS * 1.5;
      group.position.set(cacheX, 0, cacheZ);

      // Wooden crate
      var crateGeo = new THREE.BoxGeometry(2, 1.5, 2);
      var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.castShadow = true;
      crate.receiveShadow = true;
      group.add(crate);

      // Ammo boxes stacked
      var j;
      for (j = 0; j < 2; j++) {
        var boxGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        var boxMat = new THREE.MeshLambertMaterial({ color: 0xFF9900 });
        var box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(-0.6 + j * 0.6, 1.8, 0);
        box.castShadow = true;
        group.add(box);
      }

      state.scene.add(group);
      state.ammoCaches.push(group);
    }
  }

  // ─── Update Function ──────────────────────────────────────────────────────

  function update(delta) {
    if (!delta || delta <= 0) { delta = 0.016; }
    if (!state.active) { return; }

    state.elapsedTime += delta;

    // Update fire flickers
    updateFireFlickers(delta);

    // Update tunnel glow flicker
    if (state.tunnelEntrance) {
      updateTunnelGlow(delta);
    }

    // Update water puddle ripples
    updateWaterPuddles(delta);

    // Update rebar pole shadows (oscillating)
    updateRebarShadows(delta);

    // Update fire light position slightly
    if (state.fireLight && state.burningVehicles.length > 0) {
      var vehicleIdx = Math.floor(state.elapsedTime) % state.burningVehicles.length;
      var vehicle = state.burningVehicles[vehicleIdx];
      state.fireLight.position.set(
        vehicle.x + Math.sin(state.elapsedTime) * 5,
        10 + Math.cos(state.elapsedTime * 0.5) * 2,
        vehicle.z + Math.cos(state.elapsedTime) * 5
      );
    }
  }

  function updateFireFlickers(delta) {
    var i;
    for (i = 0; i < state.fireFlickers.length; i++) {
      var flicker = state.fireFlickers[i];
      var phase = (state.elapsedTime * flicker.flickerSpeed) % (Math.PI * 2);
      var fluxVal = flicker.baseIntensity + Math.sin(phase) * flicker.flickerAmount;
      fluxVal = Math.max(0.3, Math.min(1, fluxVal));

      if (flicker.mesh && flicker.mesh.material) {
        flicker.mesh.material.emissiveIntensity = fluxVal;
      }
    }
  }

  function updateTunnelGlow(delta) {
    var tunnel = state.tunnelEntrance;
    if (!tunnel.glow) { return; }

    tunnel.glowPhase = (tunnel.glowPhase + delta * 2) % (Math.PI * 2);
    var glowIntensity = 0.2 + Math.sin(tunnel.glowPhase) * 0.15;
    tunnel.glow.material.opacity = glowIntensity;
  }

  function updateWaterPuddles(delta) {
    var i;
    for (i = 0; i < state.waterPuddles.length; i++) {
      var puddle = state.waterPuddles[i];
      puddle.userData.ripplePhase = (puddle.userData.ripplePhase + delta * puddle.userData.rippleSpeed) % (Math.PI * 2);

      // Ripple effect via scale
      var rippleAmount = 0.95 + Math.sin(puddle.userData.ripplePhase) * 0.03;
      puddle.scale.set(
        puddle.userData.baseScale.x * rippleAmount,
        puddle.userData.baseScale.y,
        puddle.userData.baseScale.z * rippleAmount
      );
    }
  }

  function updateRebarShadows(delta) {
    var i;
    for (i = 0; i < state.rebarPoles.length; i++) {
      var pole = state.rebarPoles[i];
      var shadowPhase = (pole.userData.shadowPhase + delta * 1.5) % (Math.PI * 2);
      pole.userData.shadowPhase = shadowPhase;

      // Slight rotation/offset for shadow effects
      pole.rotation.z = Math.sin(shadowPhase) * 0.02;
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    reset: reset,
    getState: function() { return state; },
    isActive: function() { return state.active; }
  };
})();
