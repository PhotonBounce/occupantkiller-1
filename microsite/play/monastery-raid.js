window.MonasteryRaid = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var monasteryObjects = [];
  var spawnPoints = [];
  var butterLamps = [];
  var prayerWheels = [];
  var incenseSmokes = [];
  var prayerBanners = [];
  var torches = [];
  var animationState = {
    butterLampTime: 0,
    prayerWheelRotation: 0,
    bellSwing: 0,
    incenseTime: 0,
    bannerFlap: 0,
    mountainSway: 0,
    torchFlame: 0
  };

  function createColor(hex) {
    return new THREE.Color(hex);
  }

  function createBox(width, height, depth, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    monasteryObjects.push(mesh);
    return mesh;
  }

  function createCylinder(radiusTop, radiusBottom, height, color, x, y, z) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    monasteryObjects.push(mesh);
    return mesh;
  }

  function createSphere(radius, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    monasteryObjects.push(mesh);
    return mesh;
  }

  function createCone(radius, height, color, x, y, z) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    monasteryObjects.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    var positionArray = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      positionArray[i * 3] = points[i].x;
      positionArray[i * 3 + 1] = points[i].y;
      positionArray[i * 3 + 2] = points[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var lineSegments = new THREE.LineSegments(geometry, material);
    scene.add(lineSegments);
    monasteryObjects.push(lineSegments);
    return lineSegments;
  }

  function buildOuterCourtyard() {
    var stoneColor = 0x808080;
    var wallThickness = 1.5;

    createBox(50, 8, wallThickness, stoneColor, 0, 4, -25);
    createBox(50, 8, wallThickness, stoneColor, 0, 4, 25);
    createBox(wallThickness, 8, 50, stoneColor, -25, 4, 0);
    createBox(wallThickness, 8, stoneColor, 25, 4, 0);

    createBox(100, 0.5, 100, 0xA9A9A9, 0, -0.5, 0);
  }

  function buildMainPrayerHall() {
    var terrColor = 0x8B4513;
    var roofColor = 0xCD853F;

    createBox(30, 12, 25, terrColor, 0, 6, 0);
    createBox(32, 3, 27, roofColor, 0, 18.5, 0);
    createBox(30, 2, 25, roofColor, 0, 21.5, 0);
    createBox(28, 1.5, 23, roofColor, 0, 23.5, 0);

    createBox(1, 12, 25, 0xB8860B, -15, 6, 0);
    createBox(1, 12, 25, 0xB8860B, 15, 6, 0);
    createBox(30, 12, 1, 0xB8860B, 0, 6, -12.5);
    createBox(30, 12, 1, 0xB8860B, 0, 6, 12.5);
  }

  function buildBellTower() {
    createBox(6, 20, 6, 0x696969, 20, 10, 0);
    createCylinder(3, 3, 2, 0xD4AF37, 20, 20, 0);
    createBox(2.5, 0.5, 2.5, 0xC0C0C0, 20, 21.5, 0);
    createCone(4.5, 3, 0xD4AF37, 20, 22, 0);
  }

  function buildMeditationChambers() {
    var chamberColor = 0x8B4513;

    createBox(8, 8, 8, chamberColor, -15, 4, 8);
    createBox(8, 8, 8, chamberColor, 15, 4, 8);
    createBox(8, 8, 8, chamberColor, -15, 4, -8);
    createBox(8, 8, 8, chamberColor, 15, 4, -8);

    createBox(0.8, 8, 8, 0xB8860B, -15, 4, 8);
    createBox(0.8, 8, 8, 0xB8860B, 15, 4, 8);
  }

  function buildButterLampCorridor() {
    createBox(35, 7, 3, 0x8B4513, 0, 3.5, 15);

    for (var i = -6; i <= 6; i += 3) {
      var lampBase = createCylinder(0.8, 0.8, 0.5, 0xDEB887, i * 5, 3.8, 15);
      var lampFlame = createSphere(0.4, 0xFFD700, i * 5, 4.5, 15);
      butterLamps.push({
        base: lampBase,
        flame: lampFlame,
        baseColor: 0xDEB887,
        flameColor: 0xFFD700,
        intensity: 1.0
      });
    }
  }

  function buildPrayerWheelPosts() {
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var x = Math.cos(angle) * 18;
      var z = Math.sin(angle) * 18;

      var post = createCylinder(0.8, 0.8, 6, 0x696969, x, 3, z);
      var drum = createCylinder(2, 2, 4, 0xD4AF37, x, 6, z);

      prayerWheels.push({
        post: post,
        drum: drum,
        rotation: 0
      });
    }
  }

  function buildStoneStaircase() {
    var stepColor = 0x808080;
    for (var i = 0; i < 8; i++) {
      createBox(6, 0.8, 6 - (i * 0.5), stepColor, -10, i * 1.2, 15 + (i * 2));
    }
  }

  function buildInnerCourtyard() {
    createBox(60, 0.3, 60, 0xC0C0C0, 0, 0.2, 0);
  }

  function buildArmoryBasement() {
    var basementColor = 0x654321;
    createBox(25, 8, 20, basementColor, 0, -4, 0);

    var crateColor = 0x8B4513;
    createBox(3, 3, 3, crateColor, -8, -1.5, -5);
    createBox(3, 3, 3, crateColor, 0, -1.5, -5);
    createBox(3, 3, 3, crateColor, 8, -1.5, -5);
    createBox(3, 3, 3, crateColor, -8, -1.5, 5);
    createBox(3, 3, 3, crateColor, 8, -1.5, 5);
  }

  function buildMountainBackdrop() {
    var snowColor = 0xF5F5F5;
    var rockColor = 0x696969;

    createCone(12, 35, rockColor, -40, 15, -35);
    createCone(10, 30, rockColor, -35, 12, -40);
    createBox(8, 20, 8, rockColor, -38, 10, -38);

    createCone(14, 40, rockColor, 40, 18, -35);
    createCone(11, 32, rockColor, 35, 14, -40);
    createBox(10, 25, 10, rockColor, 38, 12, -38);

    createCone(13, 38, rockColor, 0, 17, -42);
    createBox(120, 0.5, 2, snowColor, 0, -0.5, -48);
  }

  function buildGatewayArch() {
    var archColor = 0x696969;
    createBox(20, 0.8, 2, archColor, 0, 10, -24);
    createBox(1.5, 8, 2, archColor, -10, 6, -24);
    createBox(1.5, 8, 2, archColor, 10, 6, -24);
    createBox(18, 1, 2, 0xD4AF37, 0, 9.5, -24);
  }

  function buildOrnateColumns() {
    for (var i = 0; i < 6; i++) {
      var xPos = -12 + (i * 5);
      var column = createCylinder(1.2, 1.2, 14, 0x8B7355, xPos, 7, -2);
      var capital = createCylinder(1.5, 1.5, 0.6, 0xD4AF37, xPos, 14.6, -2);
    }
  }

  function buildIncenseBurner() {
    var burnerBase = createCylinder(2.5, 2.5, 0.8, 0xCD853F, 0, 0.8, 25);
    var burnerBowl = createCylinder(2.2, 2.2, 2, 0x8B4513, 0, 2.2, 25);

    var smokeParticles = [];
    for (var i = 0; i < 5; i++) {
      var smoke = createSphere(0.3, 0xE0E0E0, 0, 3.5 + (i * 0.8), 25);
      smokeParticles.push(smoke);
    }

    incenseSmokes.push({
      particles: smokeParticles,
      time: 0
    });
  }

  function buildPrayerBanners() {
    var bannerPositions = [
      { x: -8, z: -15 },
      { x: 0, z: -15 },
      { x: 8, z: -15 }
    ];

    for (var i = 0; i < bannerPositions.length; i++) {
      var pos = bannerPositions[i];
      var banner = createBox(2, 8, 0.2, 0xFFFF00, pos.x, 8, pos.z);
      banner.rotationZ = 0;

      var points = [
        { x: pos.x - 1, y: 8, z: pos.z },
        { x: pos.x + 1, y: 8, z: pos.z },
        { x: pos.x + 1, y: 0, z: pos.z },
        { x: pos.x - 1, y: 0, z: pos.z }
      ];

      prayerBanners.push({
        banner: banner,
        time: 0,
        xPos: pos.x
      });
    }
  }

  function buildWaterFountain() {
    var basins = createCylinder(4, 4, 1, 0x696969, -20, 0.8, 20);
    var water = createCylinder(3.8, 3.8, 0.8, 0x4DA6FF, -20, 1.3, 20);
    var spout = createCylinder(0.4, 0.4, 3, 0xC0C0C0, -20, 3.5, 20);
  }

  function createSpawnPoints() {
    spawnPoints = [
      { x: 0, y: 1, z: -30 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 6, z: 0 },
      { x: 20, y: 5, z: 0 },
      { x: 0, y: -1, z: 0 }
    ];
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    monasteryObjects = [];
    spawnPoints = [];
    butterLamps = [];
    prayerWheels = [];
    incenseSmokes = [];
    prayerBanners = [];
    torches = [];

    buildInnerCourtyard();
    buildOuterCourtyard();
    buildMainPrayerHall();
    buildBellTower();
    buildMeditationChambers();
    buildButterLampCorridor();
    buildPrayerWheelPosts();
    buildStoneStaircase();
    buildArmoryBasement();
    buildMountainBackdrop();
    buildGatewayArch();
    buildOrnateColumns();
    buildIncenseBurner();
    buildPrayerBanners();
    buildWaterFountain();
    createSpawnPoints();

    animationState = {
      butterLampTime: 0,
      prayerWheelRotation: 0,
      bellSwing: 0,
      incenseTime: 0,
      bannerFlap: 0,
      mountainSway: 0,
      torchFlame: 0
    };
  }

  function updateButterLamps(delta) {
    animationState.butterLampTime += delta;

    for (var i = 0; i < butterLamps.length; i++) {
      var lamp = butterLamps[i];
      var flicker = 0.8 + 0.2 * Math.sin(animationState.butterLampTime * 8 + i);
      lamp.flame.scale.set(flicker, flicker, flicker);
      lamp.flame.position.y = 4.5 + Math.sin(animationState.butterLampTime * 10 + i) * 0.2;
    }
  }

  function updatePrayerWheels(delta) {
    animationState.prayerWheelRotation += delta * 0.5;

    for (var i = 0; i < prayerWheels.length; i++) {
      var wheel = prayerWheels[i];
      wheel.drum.rotation.y += delta * 0.3;
    }
  }

  function updateBellSwing(delta) {
    animationState.bellSwing += delta;
    var bellSwingAmount = Math.sin(animationState.bellSwing * 1.5) * 0.15;

    if (monasteryObjects.length > 0) {
      for (var i = 0; i < monasteryObjects.length; i++) {
        if (monasteryObjects[i].position.x > 19 && monasteryObjects[i].position.x < 21 &&
            monasteryObjects[i].position.y > 18 && monasteryObjects[i].position.y < 23) {
          monasteryObjects[i].rotation.z = bellSwingAmount;
        }
      }
    }
  }

  function updateIncenseSmoke(delta) {
    animationState.incenseTime += delta;

    for (var i = 0; i < incenseSmokes.length; i++) {
      var incense = incenseSmokes[i];
      for (var j = 0; j < incense.particles.length; j++) {
        var particle = incense.particles[j];
        particle.position.y += delta * 2;
        particle.position.x += Math.sin(animationState.incenseTime * 2 + j) * delta;
        particle.position.z += Math.cos(animationState.incenseTime * 2 + j) * delta;

        if (particle.position.y > 8) {
          particle.position.y = 3.5;
        }

        var opacity = 1.0 - (particle.position.y - 3.5) / 4.5;
        particle.material.opacity = Math.max(0, opacity);
      }
    }
  }

  function updatePrayerBanners(delta) {
    animationState.bannerFlap += delta;

    for (var i = 0; i < prayerBanners.length; i++) {
      var banner = prayerBanners[i];
      var flapAmount = Math.sin(animationState.bannerFlap * 4 + i) * 0.3;
      banner.banner.rotation.z = flapAmount;
      banner.banner.position.x = banner.xPos + Math.sin(animationState.bannerFlap * 3 + i) * 0.5;
    }
  }

  function updateMountainSway(delta) {
    animationState.mountainSway += delta;

    for (var i = 0; i < monasteryObjects.length; i++) {
      var obj = monasteryObjects[i];
      if (obj.position.y > 10) {
        var originalX = obj.position.x;
        var swayAmount = Math.sin(animationState.mountainSway * 0.3 + i) * 0.08;
        obj.position.x = originalX + swayAmount;
      }
    }
  }

  function updateTorchFlames(delta) {
    animationState.torchFlame += delta;

    for (var i = 0; i < monasteryObjects.length; i++) {
      var obj = monasteryObjects[i];
      if (obj.position.y > 3 && obj.position.y < 5 && obj.geometry.type === 'SphereGeometry') {
        var flameScale = 0.9 + 0.1 * Math.sin(animationState.torchFlame * 12 + i);
        obj.scale.set(flameScale, flameScale, flameScale);
      }
    }
  }

  function update(delta) {
    if (scene === null) {
      return;
    }

    updateButterLamps(delta);
    updatePrayerWheels(delta);
    updateBellSwing(delta);
    updateIncenseSmoke(delta);
    updatePrayerBanners(delta);
    updateMountainSway(delta);
    updateTorchFlames(delta);
  }

  function reset() {
    if (scene === null) {
      return;
    }

    for (var i = monasteryObjects.length - 1; i >= 0; i--) {
      scene.remove(monasteryObjects[i]);
      if (monasteryObjects[i].geometry) {
        monasteryObjects[i].geometry.dispose();
      }
      if (monasteryObjects[i].material) {
        monasteryObjects[i].material.dispose();
      }
    }

    monasteryObjects = [];
    butterLamps = [];
    prayerWheels = [];
    incenseSmokes = [];
    prayerBanners = [];
    torches = [];
    spawnPoints = [];

    animationState = {
      butterLampTime: 0,
      prayerWheelRotation: 0,
      bellSwing: 0,
      incenseTime: 0,
      bannerFlap: 0,
      mountainSway: 0,
      torchFlame: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() {
      return spawnPoints;
    }
  };
}());
