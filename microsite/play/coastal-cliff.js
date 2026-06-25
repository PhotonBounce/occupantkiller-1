window.CoastalCliff = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animationState = {
    lighthouseRotation: 0,
    wavePhase: 0,
    searchlightAngle: 0,
    ropeSwayX: 0,
    ropeSwayZ: 0,
    ladderRungs: []
  };

  var materials = {
    rock: new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8, metalness: 0.1 }),
    cliff: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.0 }),
    white: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5, metalness: 0.3 }),
    darkGray: new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.9, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.4, metalness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.7, metalness: 0.1 }),
    ocean: new THREE.MeshStandardMaterial({ color: 0x1E90FF, roughness: 0.3, metalness: 0.4 }),
    foam: new THREE.MeshStandardMaterial({ color: 0xF0F8FF, roughness: 0.6, metalness: 0.0 })
  };

  function createCliffFace() {
    var cliffGroup = new THREE.Group();

    // Stacked rock layers creating cliff face
    for (var i = 0; i < 8; i++) {
      var rockLayer = new THREE.Mesh(
        new THREE.BoxGeometry(60, 8, 15 + Math.random() * 5),
        materials.cliff
      );
      rockLayer.position.y = i * 8 + 4;
      rockLayer.position.z = -2 - Math.random() * 3;
      rockLayer.castShadow = true;
      rockLayer.receiveShadow = true;

      // Add irregular protrusions
      if (i % 2 === 0) {
        var protrusion = new THREE.Mesh(
          new THREE.BoxGeometry(40, 4, 8),
          materials.rock
        );
        protrusion.position.y = i * 8 + 6;
        protrusion.position.z = 5;
        protrusion.position.x = (Math.random() - 0.5) * 30;
        protrusion.castShadow = true;
        cliffGroup.add(protrusion);
      }

      cliffGroup.add(rockLayer);
    }

    // Main cliff face base
    var cliffBase = new THREE.Mesh(
      new THREE.BoxGeometry(65, 70, 20),
      materials.cliff
    );
    cliffBase.position.y = 30;
    cliffBase.position.z = -5;
    cliffBase.castShadow = true;
    cliffBase.receiveShadow = true;
    cliffGroup.add(cliffBase);

    return cliffGroup;
  }

  function createCliffTopPlatform() {
    var platformGroup = new THREE.Group();

    // Flat defensive area at cliff top
    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(70, 1, 25),
      materials.rock
    );
    platform.position.y = 65;
    platform.position.z = 8;
    platform.castShadow = true;
    platform.receiveShadow = true;
    platformGroup.add(platform);

    return platformGroup;
  }

  function createLighthouse() {
    var lighthouseGroup = new THREE.Group();

    // Tower
    var tower = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.5, 25, 16),
      materials.white
    );
    tower.position.set(35, 75, 15);
    tower.castShadow = true;
    tower.receiveShadow = true;
    lighthouseGroup.add(tower);

    // Lamp housing at top
    var lamp = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 16),
      materials.white
    );
    lamp.position.set(35, 100, 15);
    lamp.castShadow = true;
    lighthouseGroup.add(lamp);

    // Lighthouse group marker for rotation
    lighthouseGroup.userData.rotationPoint = new THREE.Vector3(35, 75, 15);

    return lighthouseGroup;
  }

  function createGunEmplacement() {
    var gunGroup = new THREE.Group();

    // Recessed gun position cut into cliff
    var recess = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 10),
      materials.darkGray
    );
    recess.position.set(-25, 50, 5);
    recess.castShadow = true;
    gunGroup.add(recess);

    // Cannon barrel
    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 12, 12),
      materials.metal
    );
    barrel.rotation.z = 0.3;
    barrel.position.set(-25, 52, 10);
    barrel.castShadow = true;
    gunGroup.add(barrel);

    // Gun carriage support
    var carriage = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 8),
      materials.metal
    );
    carriage.position.set(-25, 48, 8);
    carriage.castShadow = true;
    gunGroup.add(carriage);

    return gunGroup;
  }

  function createRopeLadder() {
    var ladderGroup = new THREE.Group();

    // Rope sides
    var ropeGeometry = new THREE.BufferGeometry();
    var positions = [];

    // Left rope
    for (var i = 0; i < 20; i++) {
      positions.push(-8, 70 - i * 4, 0);
      positions.push(-8, 70 - (i + 1) * 4, 0);
    }

    // Right rope
    for (var i = 0; i < 20; i++) {
      positions.push(-6, 70 - i * 4, 0);
      positions.push(-6, 70 - (i + 1) * 4, 0);
    }

    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    var ropeLines = new THREE.LineSegments(ropeGeometry, new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 }));
    ladderGroup.add(ropeLines);

    // Rope rungs
    for (var i = 0; i < 15; i++) {
      var rung = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.3, 0.2),
        materials.wood
      );
      rung.position.set(-7, 70 - i * 4.5, 0);
      rung.castShadow = true;
      animationState.ladderRungs.push(rung);
      ladderGroup.add(rung);
    }

    return ladderGroup;
  }

  function createCliffsideCaves() {
    var cavesGroup = new THREE.Group();

    // Cave openings at various heights
    var cavePositions = [
      { x: 15, y: 35, z: 5 },
      { x: -20, y: 45, z: 6 },
      { x: 30, y: 25, z: 4 }
    ];

    cavePositions.forEach(function(pos) {
      var cave = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 6),
        materials.darkGray
      );
      cave.position.set(pos.x, pos.y, pos.z);
      cave.castShadow = true;
      cavesGroup.add(cave);
    });

    return cavesGroup;
  }

  function createRockyBeach() {
    var beachGroup = new THREE.Group();

    // Scattered boulders on beach
    for (var i = 0; i < 20; i++) {
      var boulder = new THREE.Mesh(
        new THREE.BoxGeometry(
          2 + Math.random() * 4,
          2 + Math.random() * 3,
          2 + Math.random() * 4
        ),
        materials.rock
      );
      boulder.position.set(
        (Math.random() - 0.5) * 80,
        1 + Math.random() * 2,
        -30 - Math.random() * 10
      );
      boulder.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      beachGroup.add(boulder);
    }

    // Beach ground plane
    var sand = new THREE.Mesh(
      new THREE.BoxGeometry(100, 0.5, 30),
      materials.rock
    );
    sand.position.set(0, 0, -30);
    sand.receiveShadow = true;
    beachGroup.add(sand);

    return beachGroup;
  }

  function createWaveFoam() {
    var foamGroup = new THREE.Group();

    // White foam clusters
    for (var i = 0; i < 15; i++) {
      var foam = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random() * 1, 8, 8),
        materials.foam
      );
      foam.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 5,
        -40 - Math.random() * 15
      );
      foam.castShadow = true;
      foamGroup.add(foam);
    }

    return foamGroup;
  }

  function createOcean() {
    var oceanGroup = new THREE.Group();

    // Large water expanse
    var ocean = new THREE.Mesh(
      new THREE.BoxGeometry(120, 30, 60),
      materials.ocean
    );
    ocean.position.set(0, -15, -40);
    ocean.receiveShadow = true;
    oceanGroup.add(ocean);

    return oceanGroup;
  }

  function createWoodenPlatform() {
    var platformGroup = new THREE.Group();

    // Defensive wooden platform on cliff
    for (var i = 0; i < 5; i++) {
      var plank = new THREE.Mesh(
        new THREE.BoxGeometry(15, 0.4, 2),
        materials.wood
      );
      plank.position.set(20, 62 + i * 0.5, 12);
      plank.castShadow = true;
      platformGroup.add(plank);
    }

    // Support posts
    for (var i = 0; i < 3; i++) {
      var post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 8, 8),
        materials.wood
      );
      post.position.set(15 - i * 7, 58, 12);
      post.castShadow = true;
      platformGroup.add(post);
    }

    return platformGroup;
  }

  function createAmmoResupply() {
    var resupplyGroup = new THREE.Group();

    // Pulley wheel
    var wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 1, 16),
      materials.metal
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(-35, 72, 12);
    wheel.castShadow = true;
    resupplyGroup.add(wheel);

    // Rope from pulley
    var ropeGeometry = new THREE.BufferGeometry();
    var ropePositions = [];
    for (var i = 0; i < 15; i++) {
      ropePositions.push(-35, 70 - i * 3, 12);
      ropePositions.push(-35 + 0.2, 70 - (i + 1) * 3, 12);
    }
    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
    var ropeLines = new THREE.LineSegments(ropeGeometry, new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 }));
    resupplyGroup.add(ropeLines);

    return resupplyGroup;
  }

  function createSearchlight() {
    var searchlightGroup = new THREE.Group();

    // Base housing
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.5, 2, 12),
      materials.metal
    );
    base.position.set(40, 68, 18);
    base.castShadow = true;
    searchlightGroup.add(base);

    // Beam housing (spherical)
    var beamHousing = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 12, 12),
      materials.metal
    );
    beamHousing.position.set(40, 71, 18);
    beamHousing.castShadow = true;
    searchlightGroup.add(beamHousing);

    // Store reference for rotation
    searchlightGroup.userData.basePosition = new THREE.Vector3(40, 71, 18);

    return searchlightGroup;
  }

  function createBarbedWire() {
    var wireGroup = new THREE.Group();

    // Barbed wire along cliff edge
    var wireGeometry = new THREE.BufferGeometry();
    var positions = [];

    for (var i = 0; i < 30; i++) {
      var x = -60 + i * 4;
      var waveOffset = Math.sin(i * 0.3) * 0.5;
      positions.push(x, 66 + waveOffset, 10);
      positions.push(x + 4, 66 - waveOffset, 10);
    }

    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var wireLines = new THREE.LineSegments(wireGeometry, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 }));
    wireGroup.add(wireLines);

    return wireGroup;
  }

  function createObserverPost() {
    var postGroup = new THREE.Group();

    // Small shelter structure
    var shelter = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 4),
      materials.darkGray
    );
    shelter.position.set(-40, 68, 18);
    shelter.castShadow = true;
    postGroup.add(shelter);

    // Observation slot
    var slot = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 0.3),
      materials.darkGray
    );
    slot.position.set(-40, 70, 20.2);
    slot.castShadow = true;
    postGroup.add(slot);

    return postGroup;
  }

  function createGullNests() {
    var nestsGroup = new THREE.Group();

    // Tiny nests on various ledges
    var nestPositions = [
      { x: 20, y: 48, z: 8 },
      { x: -30, y: 35, z: 7 },
      { x: 15, y: 42, z: 6 },
      { x: -10, y: 55, z: 9 }
    ];

    nestPositions.forEach(function(pos) {
      var nest = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        materials.rock
      );
      nest.position.set(pos.x, pos.y, pos.z);
      nest.scale.y = 0.4;
      nest.castShadow = true;
      nestsGroup.add(nest);
    });

    return nestsGroup;
  }

  function createCliffPathSwitchback() {
    var pathGroup = new THREE.Group();

    // Switchback trail down cliff
    var segments = [
      { x: 50, y: 55, z: 5, length: 20 },
      { x: 30, y: 40, z: 5, length: 20 },
      { x: 10, y: 25, z: 5, length: 20 }
    ];

    segments.forEach(function(seg) {
      var trail = new THREE.Mesh(
        new THREE.BoxGeometry(seg.length, 1.5, 3),
        materials.rock
      );
      trail.position.set(seg.x, seg.y, seg.z);
      trail.castShadow = true;
      trail.receiveShadow = true;
      pathGroup.add(trail);
    });

    return pathGroup;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];

    // Add all coastal cliff elements
    var cliffFace = createCliffFace();
    scene.add(cliffFace);
    objects.push(cliffFace);

    var cliffTop = createCliffTopPlatform();
    scene.add(cliffTop);
    objects.push(cliffTop);

    var lighthouse = createLighthouse();
    scene.add(lighthouse);
    objects.push(lighthouse);

    var gunEmplacement = createGunEmplacement();
    scene.add(gunEmplacement);
    objects.push(gunEmplacement);

    var ropeLadder = createRopeLadder();
    scene.add(ropeLadder);
    objects.push(ropeLadder);

    var caves = createCliffsideCaves();
    scene.add(caves);
    objects.push(caves);

    var beach = createRockyBeach();
    scene.add(beach);
    objects.push(beach);

    var foam = createWaveFoam();
    scene.add(foam);
    objects.push(foam);

    var ocean = createOcean();
    scene.add(ocean);
    objects.push(ocean);

    var woodenPlatform = createWoodenPlatform();
    scene.add(woodenPlatform);
    objects.push(woodenPlatform);

    var ammoResupply = createAmmoResupply();
    scene.add(ammoResupply);
    objects.push(ammoResupply);

    var searchlight = createSearchlight();
    scene.add(searchlight);
    objects.push(searchlight);

    var barbedWire = createBarbedWire();
    scene.add(barbedWire);
    objects.push(barbedWire);

    var observerPost = createObserverPost();
    scene.add(observerPost);
    objects.push(observerPost);

    var gullNests = createGullNests();
    scene.add(gullNests);
    objects.push(gullNests);

    var cliffPath = createCliffPathSwitchback();
    scene.add(cliffPath);
    objects.push(cliffPath);

    // Add lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(40, 80, 30);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
  }

  function update(delta) {
    // Lighthouse rotation
    animationState.lighthouseRotation += delta * 0.3;
    var lighthouseObj = objects[2];
    if (lighthouseObj) {
      lighthouseObj.rotation.y = animationState.lighthouseRotation;
    }

    // Wave foam oscillation
    animationState.wavePhase += delta * 1.5;
    var foamObj = objects[7];
    if (foamObj && foamObj.children) {
      foamObj.children.forEach(function(foam, index) {
        foam.position.y = Math.sin(animationState.wavePhase + index * 0.5) * 0.8 +
                         (Math.random() * 5 - 2.5);
      });
    }

    // Rope ladder sway
    animationState.ropeSwayX = Math.sin(animationState.wavePhase * 0.5) * 0.3;
    animationState.ropeSwayZ = Math.cos(animationState.wavePhase * 0.5) * 0.2;

    var ladderObj = objects[4];
    if (ladderObj) {
      ladderObj.position.x = animationState.ropeSwayX;
      ladderObj.position.z = animationState.ropeSwayZ;
    }

    // Searchlight sweep
    animationState.searchlightAngle += delta * 0.8;
    var searchlightObj = objects[10];
    if (searchlightObj) {
      var basePos = searchlightObj.userData.basePosition;
      if (basePos) {
        var sweepX = Math.cos(animationState.searchlightAngle) * 15;
        var sweepZ = Math.sin(animationState.searchlightAngle) * 10;
        searchlightObj.position.x = basePos.x + sweepX;
        searchlightObj.position.z = basePos.z + sweepZ;
      }
    }
  }

  function reset() {
    animationState.lighthouseRotation = 0;
    animationState.wavePhase = 0;
    animationState.searchlightAngle = 0;
    animationState.ropeSwayX = 0;
    animationState.ropeSwayZ = 0;

    if (objects[2]) {
      objects[2].rotation.y = 0;
    }

    if (objects[4]) {
      objects[4].position.x = 0;
      objects[4].position.z = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
