window.CanyonAmbush = (function() {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    objects: [],

    // Canyon environment
    canyonWalls: [],
    canyonFloor: null,
    cliffLedges: [],
    caveOpenings: [],
    ropeBridges: [],
    sniperNests: [],
    vehicleWrecks: [],
    boulders: [],
    cacti: [],
    riverbed: null,
    rockfallBoulders: [],
    campfire: null,
    supplyBoxes: [],

    // Animations
    dustParticles: [],
    fireFlicker: 0,
    bridgeSway: 0,
    rockfallActive: false,
    rockfallTimer: 0
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var CANYON_WIDTH = 40;
  var CANYON_LENGTH = 150;
  var CANYON_HEIGHT = 60;
  var WALL_COLOR = 0xCC5522;
  var FLOOR_COLOR = 0xDDCC88;
  var CACTUS_COLOR = 0x228822;
  var FIRE_COLOR = 0xFF6600;
  var CAVE_COLOR = 0x664422;
  var DUST_COUNT = 20;
  var BRIDGE_SWAY_AMPLITUDE = 0.15;
  var FIRE_FLICKER_SPEED = 0.1;

  // ─── Initialization ──────────────────────────────────────────────────────
  function buildCanyonWalls() {
    // Left wall - tall red rock face
    var leftWallGeo = new THREE.BoxGeometry(8, CANYON_HEIGHT, CANYON_LENGTH);
    var wallMat = new THREE.MeshLambertMaterial({ color: WALL_COLOR });
    var leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-(CANYON_WIDTH / 2 + 4), CANYON_HEIGHT / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    state.scene.add(leftWall);
    state.canyonWalls.push(leftWall);

    // Right wall - tall red rock face
    var rightWallGeo = new THREE.BoxGeometry(8, CANYON_HEIGHT, CANYON_LENGTH);
    var rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set((CANYON_WIDTH / 2 + 4), CANYON_HEIGHT / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    state.scene.add(rightWall);
    state.canyonWalls.push(rightWall);

    // Back wall
    var backWallGeo = new THREE.BoxGeometry(CANYON_WIDTH + 16, CANYON_HEIGHT, 8);
    var backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, CANYON_HEIGHT / 2, -(CANYON_LENGTH / 2 + 4));
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    state.scene.add(backWall);
    state.canyonWalls.push(backWall);

    // Front wall
    var frontWallGeo = new THREE.BoxGeometry(CANYON_WIDTH + 16, CANYON_HEIGHT, 8);
    var frontWall = new THREE.Mesh(frontWallGeo, wallMat);
    frontWall.position.set(0, CANYON_HEIGHT / 2, (CANYON_LENGTH / 2 + 4));
    frontWall.receiveShadow = true;
    frontWall.castShadow = true;
    state.scene.add(frontWall);
    state.canyonWalls.push(frontWall);
  }

  function buildCanyonFloor() {
    var floorGeo = new THREE.BoxGeometry(CANYON_WIDTH, 1, CANYON_LENGTH);
    var floorMat = new THREE.MeshLambertMaterial({ color: FLOOR_COLOR });
    state.canyonFloor = new THREE.Mesh(floorGeo, floorMat);
    state.canyonFloor.position.set(0, -0.5, 0);
    state.canyonFloor.receiveShadow = true;
    state.scene.add(state.canyonFloor);
  }

  function buildCliffLedges() {
    // Overhang on left side
    var overhang1Geo = new THREE.BoxGeometry(6, 3, 30);
    var edgeMat = new THREE.MeshLambertMaterial({ color: WALL_COLOR });
    var overhang1 = new THREE.Mesh(overhang1Geo, edgeMat);
    overhang1.position.set(-(CANYON_WIDTH / 2 + 6), CANYON_HEIGHT - 10, -40);
    overhang1.receiveShadow = true;
    overhang1.castShadow = true;
    state.scene.add(overhang1);
    state.cliffLedges.push(overhang1);

    // Overhang on right side
    var overhang2Geo = new THREE.BoxGeometry(6, 3, 30);
    var overhang2 = new THREE.Mesh(overhang2Geo, edgeMat);
    overhang2.position.set((CANYON_WIDTH / 2 + 6), CANYON_HEIGHT - 10, 40);
    overhang2.receiveShadow = true;
    overhang2.castShadow = true;
    state.scene.add(overhang2);
    state.cliffLedges.push(overhang2);

    // Recessed ledge for supply boxes
    var ledgeGeo = new THREE.BoxGeometry(8, 2, 12);
    var ledgeMat = new THREE.MeshLambertMaterial({ color: 0xAA7733 });
    var ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
    ledge.position.set(-(CANYON_WIDTH / 2 + 2), CANYON_HEIGHT - 20, 20);
    ledge.receiveShadow = true;
    state.scene.add(ledge);
    state.cliffLedges.push(ledge);
  }

  function buildCaveOpenings() {
    // Dark cave recess in left wall
    var cave1Geo = new THREE.BoxGeometry(6, 8, 6);
    var caveMat = new THREE.MeshLambertMaterial({ color: CAVE_COLOR });
    var cave1 = new THREE.Mesh(cave1Geo, caveMat);
    cave1.position.set(-(CANYON_WIDTH / 2 + 4), 12, -35);
    cave1.receiveShadow = true;
    state.scene.add(cave1);
    state.caveOpenings.push(cave1);

    // Dark cave recess in right wall
    var cave2Geo = new THREE.BoxGeometry(6, 8, 6);
    var cave2 = new THREE.Mesh(cave2Geo, caveMat);
    cave2.position.set((CANYON_WIDTH / 2 + 4), 12, 35);
    cave2.receiveShadow = true;
    state.scene.add(cave2);
    state.caveOpenings.push(cave2);

    // Small cave in back wall
    var cave3Geo = new THREE.BoxGeometry(5, 7, 4);
    var cave3 = new THREE.Mesh(cave3Geo, caveMat);
    cave3.position.set(0, 10, -(CANYON_LENGTH / 2 + 3));
    cave3.receiveShadow = true;
    state.scene.add(cave3);
    state.caveOpenings.push(cave3);
  }

  function buildRopeBridges() {
    // Bridge 1: cables and planks across left side
    var bridge1Group = new THREE.Group();

    // Cables
    var cablePoints1 = [
      new THREE.Vector3(-CANYON_WIDTH / 2 - 4, 25, -20),
      new THREE.Vector3(-CANYON_WIDTH / 2 - 4, 25, 20)
    ];
    var cableGeo1 = new THREE.BufferGeometry().setFromPoints(cablePoints1);
    var cableMat = new THREE.LineBasicMaterial({ color: 0xCC9966, linewidth: 3 });
    var cable1 = new THREE.LineSegments(cableGeo1, cableMat);
    bridge1Group.add(cable1);

    // Wooden planks
    var i;
    for (i = 0; i < 5; i++) {
      var plankGeo = new THREE.BoxGeometry(2, 0.2, 1);
      var plankMat = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
      var plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(-CANYON_WIDTH / 2 - 4, 24.5, -20 + i * 10);
      plank.receiveShadow = true;
      bridge1Group.add(plank);
    }

    bridge1Group.position.set(0, 0, 0);
    bridge1Group.userData.sway = 0;
    bridge1Group.userData.baseY = 25;
    state.scene.add(bridge1Group);
    state.ropeBridges.push(bridge1Group);

    // Bridge 2: cables and planks across right side
    var bridge2Group = new THREE.Group();

    var cablePoints2 = [
      new THREE.Vector3(CANYON_WIDTH / 2 + 4, 25, -20),
      new THREE.Vector3(CANYON_WIDTH / 2 + 4, 25, 20)
    ];
    var cableGeo2 = new THREE.BufferGeometry().setFromPoints(cablePoints2);
    var cable2 = new THREE.LineSegments(cableGeo2, cableMat);
    bridge2Group.add(cable2);

    for (i = 0; i < 5; i++) {
      var plankGeo2 = new THREE.BoxGeometry(2, 0.2, 1);
      var plankMat2 = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
      var plank2 = new THREE.Mesh(plankGeo2, plankMat2);
      plank2.position.set(CANYON_WIDTH / 2 + 4, 24.5, -20 + i * 10);
      plank2.receiveShadow = true;
      bridge2Group.add(plank2);
    }

    bridge2Group.position.set(0, 0, 0);
    bridge2Group.userData.sway = 0;
    bridge2Group.userData.baseY = 25;
    state.scene.add(bridge2Group);
    state.ropeBridges.push(bridge2Group);
  }

  function buildSniperNests() {
    // Sniper nest on left cliff top
    var nest1Geo = new THREE.BoxGeometry(5, 1.5, 6);
    var nestMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
    var nest1 = new THREE.Mesh(nest1Geo, nestMat);
    nest1.position.set(-(CANYON_WIDTH / 2 + 8), CANYON_HEIGHT - 5, -30);
    nest1.receiveShadow = true;
    nest1.castShadow = true;
    state.scene.add(nest1);
    state.sniperNests.push(nest1);

    // Sniper nest on right cliff top
    var nest2Geo = new THREE.BoxGeometry(5, 1.5, 6);
    var nest2 = new THREE.Mesh(nest2Geo, nestMat);
    nest2.position.set((CANYON_WIDTH / 2 + 8), CANYON_HEIGHT - 5, 30);
    nest2.receiveShadow = true;
    nest2.castShadow = true;
    state.scene.add(nest2);
    state.sniperNests.push(nest2);

    // Observation post at back
    var nest3Geo = new THREE.BoxGeometry(6, 2, 4);
    var nest3 = new THREE.Mesh(nest3Geo, nestMat);
    nest3.position.set(0, CANYON_HEIGHT - 8, -(CANYON_LENGTH / 2 - 10));
    nest3.receiveShadow = true;
    nest3.castShadow = true;
    state.scene.add(nest3);
    state.sniperNests.push(nest3);
  }

  function buildVehicleWrecks() {
    // Burned out truck body
    var truckGeo = new THREE.BoxGeometry(3, 2.5, 8);
    var wreckMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var truck = new THREE.Mesh(truckGeo, wreckMat);
    truck.position.set(-8, 1, -50);
    truck.receiveShadow = true;
    truck.castShadow = true;
    state.scene.add(truck);
    state.vehicleWrecks.push(truck);

    // Cargo container toppled
    var containerGeo = new THREE.BoxGeometry(2, 2, 4);
    var container = new THREE.Mesh(containerGeo, wreckMat);
    container.position.set(10, 1.5, 60);
    container.rotation.z = 0.3;
    container.receiveShadow = true;
    container.castShadow = true;
    state.scene.add(container);
    state.vehicleWrecks.push(container);
  }

  function buildBoulders() {
    // Static boulders scattered around
    var positions = [
      { x: -12, y: 1, z: 0 },
      { x: 15, y: 1, z: -25 },
      { x: -18, y: 1, z: 45 },
      { x: 20, y: 1, z: -60 },
      { x: -10, y: 1, z: 70 },
      { x: 5, y: 1, z: 30 },
      { x: -20, y: 1, z: -75 }
    ];

    var boulderMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
    var i;
    for (i = 0; i < positions.length; i++) {
      var size = 0.8 + Math.random() * 1.2;
      var boulderGeo = new THREE.SphereGeometry(size, 8, 8);
      var boulder = new THREE.Mesh(boulderGeo, boulderMat);
      boulder.position.set(positions[i].x, positions[i].y + size, positions[i].z);
      boulder.receiveShadow = true;
      boulder.castShadow = true;
      state.scene.add(boulder);
      state.boulders.push(boulder);
    }
  }

  function buildCacti() {
    // Cactus clusters with cylinder body and cone arms
    var positions = [
      { x: -15, z: -45 },
      { x: 10, z: 25 },
      { x: -8, z: 55 },
      { x: 18, z: -30 },
      { x: -22, z: 15 }
    ];

    var cactusColor = CACTUS_COLOR;
    var i, j;
    for (i = 0; i < positions.length; i++) {
      var cactusGroup = new THREE.Group();
      cactusGroup.position.set(positions[i].x, 0, positions[i].z);

      // Main body - cylinder
      var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 3, 8);
      var cactusMat = new THREE.MeshLambertMaterial({ color: cactusColor });
      var body = new THREE.Mesh(bodyGeo, cactusMat);
      body.position.y = 1.5;
      body.receiveShadow = true;
      body.castShadow = true;
      cactusGroup.add(body);

      // Arms - cones
      var armPositions = [
        { x: 0.8, z: 0 },
        { x: -0.8, z: 0 },
        { x: 0, z: 0.8 },
        { x: 0, z: -0.8 }
      ];

      for (j = 0; j < armPositions.length; j++) {
        var armGeo = new THREE.ConeGeometry(0.3, 1.2, 8);
        var arm = new THREE.Mesh(armGeo, cactusMat);
        arm.position.set(armPositions[j].x, 2.5, armPositions[j].z);
        arm.rotation.z = Math.PI / 2;
        arm.receiveShadow = true;
        arm.castShadow = true;
        cactusGroup.add(arm);
      }

      state.scene.add(cactusGroup);
      state.cacti.push(cactusGroup);
    }
  }

  function buildRiverbed() {
    // Dry sandy riverbed strip
    var riverbedGeo = new THREE.BoxGeometry(6, 0.3, CANYON_LENGTH);
    var riverbedMat = new THREE.MeshLambertMaterial({ color: 0xCCAA88 });
    state.riverbed = new THREE.Mesh(riverbedGeo, riverbedMat);
    state.riverbed.position.set(0, 0.1, 0);
    state.riverbed.receiveShadow = true;
    state.scene.add(state.riverbed);
  }

  function buildRockfallBoulders() {
    // Boulders positioned at cliff top ready to fall
    var fallPositions = [
      { x: -(CANYON_WIDTH / 2 + 8), y: CANYON_HEIGHT - 1, z: 0 },
      { x: (CANYON_WIDTH / 2 + 8), y: CANYON_HEIGHT - 1, z: -20 },
      { x: -(CANYON_WIDTH / 2 + 6), y: CANYON_HEIGHT - 0.5, z: 30 }
    ];

    var rockMat = new THREE.MeshLambertMaterial({ color: 0x665533 });
    var i;
    for (i = 0; i < fallPositions.length; i++) {
      var rockGeo = new THREE.SphereGeometry(1.2, 8, 8);
      var rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(fallPositions[i].x, fallPositions[i].y, fallPositions[i].z);
      rock.receiveShadow = true;
      rock.castShadow = true;
      rock.userData.basePos = {
        x: fallPositions[i].x,
        y: fallPositions[i].y,
        z: fallPositions[i].z
      };
      rock.userData.rolling = false;
      state.scene.add(rock);
      state.rockfallBoulders.push(rock);
    }
  }

  function buildCampfire() {
    // Fire base - dark stones in circle
    var baseGeo = new THREE.BoxGeometry(2, 0.3, 2);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    state.campfire = new THREE.Group();
    state.campfire.position.set(0, 0.1, 0);

    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.15;
    state.campfire.add(base);

    // Flames - upright cones
    var flameMat = new THREE.MeshLambertMaterial({
      color: FIRE_COLOR,
      emissive: 0xFF4400,
      emissiveIntensity: 0.5
    });

    var i;
    for (i = 0; i < 3; i++) {
      var flameGeo = new THREE.ConeGeometry(0.4, 2, 8);
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(
        Math.cos(i * Math.PI * 2 / 3) * 0.3,
        1.5,
        Math.sin(i * Math.PI * 2 / 3) * 0.3
      );
      flame.userData.baseY = 1.5;
      flame.userData.baseScale = 1.0;
      state.campfire.add(flame);
    }

    state.scene.add(state.campfire);
  }

  function buildSupplyBoxes() {
    // Crates on the ledge
    var boxPositions = [
      { x: -CANYON_WIDTH / 2 - 4, y: CANYON_HEIGHT - 18, z: 15 },
      { x: -CANYON_WIDTH / 2 - 4, y: CANYON_HEIGHT - 18, z: 20 },
      { x: -CANYON_WIDTH / 2 - 4, y: CANYON_HEIGHT - 18, z: 25 }
    ];

    var boxMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
    var i;
    for (i = 0; i < boxPositions.length; i++) {
      var boxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(boxPositions[i].x, boxPositions[i].y, boxPositions[i].z);
      box.receiveShadow = true;
      box.castShadow = true;
      state.scene.add(box);
      state.supplyBoxes.push(box);
    }
  }

  function buildDustParticles() {
    // Create dust particle system
    var dustPositions = [];
    var i;
    for (i = 0; i < DUST_COUNT; i++) {
      dustPositions.push(
        (Math.random() - 0.5) * 60,  // x
        Math.random() * 30,            // y
        (Math.random() - 0.5) * 150    // z
      );
    }

    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dustPositions), 3));

    var dustMat = new THREE.PointsMaterial({
      color: 0xCCAA88,
      size: 0.3,
      transparent: true,
      opacity: 0.3
    });

    var dust = new THREE.Points(dustGeo, dustMat);
    state.scene.add(dust);
    state.dustParticles.push(dust);
  }

  // ─── Update Functions ────────────────────────────────────────────────────
  function updateRopeBridges(delta) {
    // Gentle swaying motion
    state.bridgeSway += delta * 0.8;
    var sway = Math.sin(state.bridgeSway) * BRIDGE_SWAY_AMPLITUDE;

    var i;
    for (i = 0; i < state.ropeBridges.length; i++) {
      var bridge = state.ropeBridges[i];
      var children = bridge.children;
      var j;
      for (j = 1; j < children.length; j++) {  // Skip cable
        children[j].position.y = bridge.userData.baseY + sway;
      }
    }
  }

  function updateCampfire(delta) {
    // Flickering flames
    state.fireFlicker += delta * FIRE_FLICKER_SPEED;

    if (state.campfire) {
      var children = state.campfire.children;
      var i;
      for (i = 1; i < children.length; i++) {  // Skip base
        var flame = children[i];
        var flicker = Math.sin(state.fireFlicker * 3.2 + i * 2) * 0.3 + 0.7;
        flame.position.y = flame.userData.baseY + flicker * 0.3;
        flame.scale.y = flame.userData.baseScale * (0.8 + flicker * 0.4);
      }
    }
  }

  function updateDustParticles(delta) {
    // Drifting from cliff edges
    var i;
    for (i = 0; i < state.dustParticles.length; i++) {
      var dust = state.dustParticles[i];
      var positions = dust.geometry.attributes.position.array;
      var j;
      for (j = 0; j < positions.length; j += 3) {
        positions[j + 1] += Math.sin(state.fireFlicker * 0.5 + j) * 0.01;  // y drift
        if (positions[j + 1] < 0) {
          positions[j + 1] = 30;
        }
      }
      dust.geometry.attributes.position.needsUpdate = true;
    }
  }

  function updateRockfall(delta) {
    // Slow rolling animation for rockfall boulders
    if (state.rockfallActive) {
      state.rockfallTimer += delta;

      var i;
      for (i = 0; i < state.rockfallBoulders.length; i++) {
        var rock = state.rockfallBoulders[i];
        if (!rock.userData.rolling && state.rockfallTimer > (i + 1)) {
          rock.userData.rolling = true;
          rock.userData.rollStart = state.rockfallTimer;
        }

        if (rock.userData.rolling) {
          var elapsed = state.rockfallTimer - rock.userData.rollStart;
          var fallDist = Math.min(elapsed * 15, 40);  // Fall over ~3 seconds
          rock.position.y = rock.userData.basePos.y - fallDist;
          rock.rotation.x += delta * 3;
          rock.rotation.z += delta * 2;
        }
      }
    }
  }

  function updateSniperShadow(delta) {
    // Flickering shadow cast from sniper nests (light flicker effect)
    var flicker = Math.sin(state.fireFlicker * 2) * 0.5 + 0.5;
    // This could affect scene lighting if available
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    state.scene = scene;
    state.camera = camera;
    state.active = true;

    // Set up lighting
    var ambientLight = new THREE.AmbientLight(0xDDCCBB, 0.8);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFEEDD, 0.9);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Build canyon environment
    buildCanyonWalls();
    buildCanyonFloor();
    buildCliffLedges();
    buildCaveOpenings();
    buildRopeBridges();
    buildSniperNests();
    buildVehicleWrecks();
    buildBoulders();
    buildCacti();
    buildRiverbed();
    buildRockfallBoulders();
    buildCampfire();
    buildSupplyBoxes();
    buildDustParticles();

    // Store all objects for cleanup
    state.objects = [
      state.canyonWalls,
      state.cliffLedges,
      state.caveOpenings,
      state.ropeBridges,
      state.sniperNests,
      state.vehicleWrecks,
      state.boulders,
      state.cacti,
      state.rockfallBoulders,
      state.supplyBoxes,
      state.dustParticles
    ];

    // Start rockfall after a delay
    state.rockfallActive = true;
    state.rockfallTimer = 10;
  }

  function update(delta) {
    if (!state.active || !state.scene) { return; }
    if (!delta || delta <= 0) { delta = 0.016; }

    updateRopeBridges(delta);
    updateCampfire(delta);
    updateDustParticles(delta);
    updateRockfall(delta);
    updateSniperShadow(delta);
  }

  function reset() {
    if (!state.scene) { return; }

    state.active = false;

    // Remove canyon walls
    var i;
    for (i = 0; i < state.canyonWalls.length; i++) {
      state.scene.remove(state.canyonWalls[i]);
    }
    state.canyonWalls = [];

    // Remove floor
    if (state.canyonFloor) {
      state.scene.remove(state.canyonFloor);
      state.canyonFloor = null;
    }

    // Remove cliff ledges
    for (i = 0; i < state.cliffLedges.length; i++) {
      state.scene.remove(state.cliffLedges[i]);
    }
    state.cliffLedges = [];

    // Remove cave openings
    for (i = 0; i < state.caveOpenings.length; i++) {
      state.scene.remove(state.caveOpenings[i]);
    }
    state.caveOpenings = [];

    // Remove rope bridges
    for (i = 0; i < state.ropeBridges.length; i++) {
      state.scene.remove(state.ropeBridges[i]);
    }
    state.ropeBridges = [];

    // Remove sniper nests
    for (i = 0; i < state.sniperNests.length; i++) {
      state.scene.remove(state.sniperNests[i]);
    }
    state.sniperNests = [];

    // Remove vehicle wrecks
    for (i = 0; i < state.vehicleWrecks.length; i++) {
      state.scene.remove(state.vehicleWrecks[i]);
    }
    state.vehicleWrecks = [];

    // Remove boulders
    for (i = 0; i < state.boulders.length; i++) {
      state.scene.remove(state.boulders[i]);
    }
    state.boulders = [];

    // Remove cacti
    for (i = 0; i < state.cacti.length; i++) {
      state.scene.remove(state.cacti[i]);
    }
    state.cacti = [];

    // Remove riverbed
    if (state.riverbed) {
      state.scene.remove(state.riverbed);
      state.riverbed = null;
    }

    // Remove rockfall boulders
    for (i = 0; i < state.rockfallBoulders.length; i++) {
      state.scene.remove(state.rockfallBoulders[i]);
    }
    state.rockfallBoulders = [];

    // Remove campfire
    if (state.campfire) {
      state.scene.remove(state.campfire);
      state.campfire = null;
    }

    // Remove supply boxes
    for (i = 0; i < state.supplyBoxes.length; i++) {
      state.scene.remove(state.supplyBoxes[i]);
    }
    state.supplyBoxes = [];

    // Remove dust particles
    for (i = 0; i < state.dustParticles.length; i++) {
      state.scene.remove(state.dustParticles[i]);
    }
    state.dustParticles = [];

    // Reset state
    state.scene = null;
    state.camera = null;
    state.objects = [];
    state.fireFlicker = 0;
    state.bridgeSway = 0;
    state.rockfallActive = false;
    state.rockfallTimer = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getState: function() { return state; }
  };
})();
