window.IronMarsh = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];

  var RUST_RED = 0x8B4513;
  var RUST_ORANGE = 0xA0522D;
  var RUST_DARK = 0x654321;
  var RUST_BROWN = 0x6B4423;
  var CORRODED_ORANGE = 0xCD7F32;
  var DARK_WATER = 0x1a1410;
  var IRON_BLACK = 0x2F2F2F;
  var DECAY_BROWN = 0x8B7355;
  var BUBBLE_ORANGE = 0xFF8C00;
  var DEAD_GRASS = 0x4A4A3A;

  var rustBubbles = [];
  var dripDroplets = [];

  function createBoxGeometry(width, height, depth, material) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createCylinderGeometry(radiusTop, radiusBottom, height, segments, material) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createSphereGeometry(radius, widthSegments, heightSegments, material) {
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createConeGeometry(radius, height, segments, material) {
    var geometry = new THREE.ConeGeometry(radius, height, segments);
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createLineSegments(points, material) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var lineSegments = new THREE.LineSegments(geometry, material);
    return lineSegments;
  }

  function addToScene(obj) {
    if (scene) {
      scene.add(obj);
      objects.push(obj);
    }
  }

  function createMarchWater() {
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: DARK_WATER,
      roughness: 0.8,
      metalness: 0.3
    });

    var waterPatches = [
      { x: -20, z: 0, w: 30, h: 25 },
      { x: 15, z: -15, w: 25, h: 30 },
      { x: -5, z: 25, w: 20, h: 20 },
      { x: 25, z: 10, w: 18, h: 22 }
    ];

    waterPatches.forEach(function(patch) {
      var water = createBoxGeometry(patch.w, 1.5, patch.h, waterMaterial);
      water.position.set(patch.x, 0.75, patch.z);
      water.userData.isWater = true;
      addToScene(water);
    });
  }

  function createSunkenMachinery() {
    var machineryMaterial = new THREE.MeshStandardMaterial({
      color: RUST_ORANGE,
      roughness: 0.9,
      metalness: 0.7
    });

    var machinery = [
      { x: -25, z: -10, w: 12, h: 8, d: 10 },
      { x: 30, z: -20, w: 10, h: 6, d: 12 },
      { x: 10, z: 5, w: 14, h: 9, d: 11 },
      { x: -15, z: 20, w: 11, h: 7, d: 13 },
      { x: 20, z: 25, w: 9, h: 5, d: 10 }
    ];

    machinery.forEach(function(item) {
      var box = createBoxGeometry(item.w, item.h, item.d, machineryMaterial);
      box.position.set(item.x, item.h / 2 + 0.5, item.z);
      box.rotation.y = Math.random() * Math.PI * 0.3;
      addToScene(box);

      var detail = createBoxGeometry(item.w * 0.4, item.h * 0.3, item.d * 0.3, machineryMaterial);
      detail.position.set(item.x + 2, item.h + 1, item.z + 2);
      addToScene(detail);
    });
  }

  function createIronOreDeposits() {
    var oreMaterial = new THREE.MeshStandardMaterial({
      color: RUST_RED,
      roughness: 0.85,
      metalness: 0.6
    });

    var orePositions = [
      { x: -30, y: 1.5, z: 15 },
      { x: -10, y: 1.2, z: -25 },
      { x: 25, y: 1.8, z: -5 },
      { x: 5, y: 1.4, z: 30 },
      { x: -20, y: 1.6, z: 0 },
      { x: 32, y: 1.3, z: 10 },
      { x: 15, y: 1.7, z: -30 },
      { x: -35, y: 1.5, z: -10 }
    ];

    orePositions.forEach(function(pos) {
      var oreSphere = createSphereGeometry(2.5, 8, 8, oreMaterial);
      oreSphere.position.set(pos.x, pos.y, pos.z);
      addToScene(oreSphere);

      for (var i = 0; i < 3; i++) {
        var smallOre = createSphereGeometry(1.2, 6, 6, oreMaterial);
        smallOre.position.set(
          pos.x + (Math.random() - 0.5) * 4,
          pos.y + Math.random() * 1.5,
          pos.z + (Math.random() - 0.5) * 4
        );
        addToScene(smallOre);
      }
    });
  }

  function createSubmergedRailroads() {
    var railMaterial = new THREE.MeshStandardMaterial({
      color: IRON_BLACK,
      roughness: 0.95,
      metalness: 0.5
    });

    var rail1X = -35;
    var rail1Z = -20;
    var rail1Length = 60;

    for (var i = 0; i < 8; i++) {
      var railSegment = createBoxGeometry(0.8, 0.5, 8, railMaterial);
      railSegment.position.set(rail1X, 0.25, rail1Z + i * 8);
      railSegment.rotation.x = (Math.random() - 0.5) * 0.2;
      addToScene(railSegment);
    }

    var rail2X = 25;
    var rail2Z = -35;

    for (var j = 0; j < 7; j++) {
      var railSegment2 = createBoxGeometry(0.8, 0.5, 8, railMaterial);
      railSegment2.position.set(rail2X, 0.2, rail2Z + j * 8);
      railSegment2.rotation.x = (Math.random() - 0.5) * 0.2;
      addToScene(railSegment2);
    }

    var tiePositions = [
      { x: -34, z: -20 },
      { x: -33, z: -12 },
      { x: -32, z: -4 },
      { x: 26, z: -35 },
      { x: 25, z: -27 },
      { x: 24, z: -19 }
    ];

    tiePositions.forEach(function(pos) {
      var tie = createBoxGeometry(6, 0.3, 0.6, railMaterial);
      tie.position.set(pos.x, 0.5, pos.z);
      addToScene(tie);
    });
  }

  function createCraneSkeletons() {
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: RUST_BROWN,
      roughness: 0.92,
      metalness: 0.6
    });

    var cranes = [
      { x: -15, z: -15 },
      { x: 28, z: 20 }
    ];

    cranes.forEach(function(crane) {
      var tower1 = createBoxGeometry(1.5, 18, 1.5, towerMaterial);
      tower1.position.set(crane.x, 9, crane.z);
      addToScene(tower1);

      var tower2 = createBoxGeometry(1.5, 18, 1.5, towerMaterial);
      tower2.position.set(crane.x + 8, 9, crane.z);
      addToScene(tower2);

      var crossbar = createBoxGeometry(8.5, 1, 1, towerMaterial);
      crossbar.position.set(crane.x + 4, 16, crane.z);
      addToScene(crossbar);

      var drum1 = createCylinderGeometry(2.2, 2.2, 3.5, 12, towerMaterial);
      drum1.position.set(crane.x + 4, 15.5, crane.z - 2);
      drum1.rotation.z = Math.PI / 2;
      addToScene(drum1);

      var drum2 = createCylinderGeometry(1.8, 1.8, 3, 12, towerMaterial);
      drum2.position.set(crane.x + 4, 15.5, crane.z + 2);
      drum2.rotation.z = Math.PI / 2;
      addToScene(drum2);

      for (var i = 0; i < 4; i++) {
        var support = createBoxGeometry(0.8, 15, 0.8, towerMaterial);
        support.position.set(
          crane.x + (i % 2) * 8,
          7.5,
          crane.z + ((i < 2) ? -6 : 6)
        );
        support.rotation.z = (Math.random() - 0.5) * 0.15;
        addToScene(support);
      }
    });
  }

  function createCorrodedPipelines() {
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: CORRODED_ORANGE,
      roughness: 0.88,
      metalness: 0.65
    });

    var pipelines = [
      { x: -20, z: -5, length: 35, angle: 0 },
      { x: 0, z: -30, length: 30, angle: Math.PI / 6 },
      { x: 25, z: 5, length: 25, angle: -Math.PI / 8 },
      { x: -30, z: 15, length: 28, angle: Math.PI / 4 }
    ];

    pipelines.forEach(function(pipeline) {
      var numSegments = Math.floor(pipeline.length / 4);
      for (var i = 0; i < numSegments; i++) {
        var pipe = createCylinderGeometry(1.2, 1.2, 4, 8, pipeMaterial);
        pipe.rotation.z = pipeline.angle;
        pipe.position.set(
          pipeline.x + i * 4 * Math.cos(pipeline.angle),
          2.5 + Math.sin(i * 0.5) * 0.5,
          pipeline.z + i * 4 * Math.sin(pipeline.angle)
        );
        addToScene(pipe);
      }
    });

    for (var j = 0; j < 12; j++) {
      var flange = createCylinderGeometry(1.8, 1.8, 0.4, 12, pipeMaterial);
      flange.position.set(
        -40 + Math.random() * 80,
        2,
        -40 + Math.random() * 80
      );
      addToScene(flange);
    }
  }

  function createRustBubblePockets() {
    var bubbleMaterial = new THREE.MeshStandardMaterial({
      color: BUBBLE_ORANGE,
      roughness: 0.5,
      metalness: 0.4,
      transparent: true,
      opacity: 0.7
    });

    var bubblePositions = [
      { x: -15, z: 5 },
      { x: 10, z: -15 },
      { x: -25, z: -10 },
      { x: 20, z: 20 },
      { x: 5, z: 25 },
      { x: -30, z: 20 },
      { x: 35, z: -5 },
      { x: 0, z: -25 }
    ];

    bubblePositions.forEach(function(pos) {
      for (var i = 0; i < 4; i++) {
        var bubble = createSphereGeometry(0.6 + Math.random() * 0.4, 6, 6, bubbleMaterial);
        var offsetX = pos.x + (Math.random() - 0.5) * 3;
        var offsetZ = pos.z + (Math.random() - 0.5) * 3;
        bubble.position.set(offsetX, 1 + Math.random() * 0.5, offsetZ);
        bubble.userData.bubbleData = {
          startY: bubble.position.y,
          startX: offsetX,
          startZ: offsetZ,
          velocity: 0.5 + Math.random() * 0.8,
          lifetime: 0,
          maxLifetime: 3 + Math.random() * 2
        };
        rustBubbles.push(bubble);
        addToScene(bubble);
      }
    });
  }

  function createIronBridgeRuins() {
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: RUST_BROWN,
      roughness: 0.9,
      metalness: 0.7
    });

    var bridgeSegments = [
      { x: -20, z: 10, w: 18, h: 2, d: 3, rot: 0.3 },
      { x: -5, z: 18, w: 14, h: 3, d: 3, rot: -0.2 },
      { x: 15, z: 25, w: 16, h: 2.5, d: 3, rot: 0.15 }
    ];

    bridgeSegments.forEach(function(segment) {
      var bridgeDeck = createBoxGeometry(segment.w, segment.h, segment.d, bridgeMaterial);
      bridgeDeck.position.set(segment.x, 2 + Math.random() * 1.5, segment.z);
      bridgeDeck.rotation.z = segment.rot;
      bridgeDeck.rotation.x = (Math.random() - 0.5) * 0.2;
      addToScene(bridgeDeck);

      var support1 = createBoxGeometry(2, 4, 2, bridgeMaterial);
      support1.position.set(segment.x - segment.w / 3, 2, segment.z - 2);
      addToScene(support1);

      var support2 = createBoxGeometry(2, 3.5, 2, bridgeMaterial);
      support2.position.set(segment.x + segment.w / 3, 1.75, segment.z + 2);
      addToScene(support2);
    });
  }

  function createDrainageCulverts() {
    var culvertMaterial = new THREE.MeshStandardMaterial({
      color: DECAY_BROWN,
      roughness: 0.92,
      metalness: 0.3
    });

    var culverts = [
      { x: -28, z: 5, angle: 0 },
      { x: 22, z: -18, angle: Math.PI / 4 },
      { x: -8, z: -28, angle: -Math.PI / 6 },
      { x: 18, z: 12, angle: Math.PI / 3 }
    ];

    culverts.forEach(function(culvert) {
      var numSegments = 5;
      for (var i = 0; i < numSegments; i++) {
        var culvertPipe = createCylinderGeometry(1.5, 1.5, 5, 10, culvertMaterial);
        culvertPipe.rotation.z = culvert.angle;
        culvertPipe.position.set(
          culvert.x + i * 5 * Math.cos(culvert.angle),
          1.8 + (numSegments - i) * 0.3,
          culvert.z + i * 5 * Math.sin(culvert.angle)
        );
        addToScene(culvertPipe);
      }
    });
  }

  function createCorrodedElectricalPylons() {
    var pylonMaterial = new THREE.MeshStandardMaterial({
      color: IRON_BLACK,
      roughness: 0.93,
      metalness: 0.8
    });

    var pylons = [
      { x: -32, z: 25 },
      { x: 30, z: -25 },
      { x: -5, z: -35 }
    ];

    pylons.forEach(function(pylon) {
      var legs = [
        { ox: -2, oz: -2 },
        { ox: 2, oz: -2 },
        { ox: -2, oz: 2 },
        { ox: 2, oz: 2 }
      ];

      legs.forEach(function(leg) {
        var legPole = createBoxGeometry(0.6, 20, 0.6, pylonMaterial);
        legPole.position.set(pylon.x + leg.ox, 10, pylon.z + leg.oz);
        legPole.rotation.z = (Math.random() - 0.5) * 0.1;
        addToScene(legPole);
      });

      var crossbeam1 = createBoxGeometry(5, 0.5, 0.5, pylonMaterial);
      crossbeam1.position.set(pylon.x, 15, pylon.z);
      addToScene(crossbeam1);

      var crossbeam2 = createBoxGeometry(0.5, 0.5, 5, pylonMaterial);
      crossbeam2.position.set(pylon.x, 15, pylon.z);
      addToScene(crossbeam2);

      var topPlatform = createBoxGeometry(4, 0.8, 4, pylonMaterial);
      topPlatform.position.set(pylon.x, 19, pylon.z);
      addToScene(topPlatform);

      var droop1X = pylon.x;
      var droop1Z = pylon.z - 30;
      var droop2X = pylon.x + 35;
      var droop2Z = pylon.z;

      var wirePoints = [
        pylon.x, 19, pylon.z,
        droop1X, 8, droop1Z,
        droop2X, 5, droop2Z
      ];
      var wireMat = new THREE.LineBasicMaterial({ color: IRON_BLACK, linewidth: 2 });
      var wireDropLine = createLineSegments(wirePoints, wireMat);
      addToScene(wireDropLine);

      var wirePoints2 = [
        pylon.x, 19, pylon.z,
        droop2X - 40, 10, droop2Z + 25,
        droop2X - 50, 6, droop2Z + 35
      ];
      var wireDropLine2 = createLineSegments(wirePoints2, wireMat);
      addToScene(wireDropLine2);
    });
  }

  function createMilitaryPatrolBoatWreck() {
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: RUST_RED,
      roughness: 0.95,
      metalness: 0.6
    });

    var hullBody = createBoxGeometry(12, 3, 6, hullMaterial);
    hullBody.position.set(-8, 1.8, 35);
    hullBody.rotation.z = 0.4;
    hullBody.rotation.x = -0.2;
    addToScene(hullBody);

    var turret1 = createCylinderGeometry(1.5, 1.5, 2, 8, hullMaterial);
    turret1.position.set(-12, 4, 33);
    turret1.rotation.x = 0.5;
    addToScene(turret1);

    var turret2 = createCylinderGeometry(1.2, 1.2, 1.8, 8, hullMaterial);
    turret2.position.set(0, 3.8, 36);
    turret2.rotation.x = -0.3;
    addToScene(turret2);

    var gunBarrel = createCylinderGeometry(0.4, 0.4, 6, 6, hullMaterial);
    gunBarrel.position.set(-12, 4.5, 33);
    gunBarrel.rotation.z = Math.PI / 3;
    addToScene(gunBarrel);

    var antenna = createCylinderGeometry(0.15, 0.15, 8, 4, hullMaterial);
    antenna.position.set(2, 6, 34);
    antenna.rotation.z = 0.6;
    addToScene(antenna);

    var controlRoom = createBoxGeometry(4, 2.5, 3, hullMaterial);
    controlRoom.position.set(-3, 3.5, 36);
    controlRoom.rotation.x = -0.15;
    addToScene(controlRoom);
  }

  function createMarshGrass() {
    var grassMaterial = new THREE.MeshStandardMaterial({
      color: DEAD_GRASS,
      roughness: 0.88,
      metalness: 0.1
    });

    var grassClumps = [];
    for (var i = 0; i < 35; i++) {
      var clumpX = -38 + Math.random() * 76;
      var clumpZ = -38 + Math.random() * 76;
      grassClumps.push({ x: clumpX, z: clumpZ });
    }

    grassClumps.forEach(function(clump) {
      for (var j = 0; j < 3; j++) {
        var grassBlade = createCylinderGeometry(0.08, 0.05, 1.2 + Math.random() * 0.8, 4, grassMaterial);
        grassBlade.position.set(
          clump.x + (Math.random() - 0.5) * 0.6,
          0.6 + j * 0.2,
          clump.z + (Math.random() - 0.5) * 0.6
        );
        grassBlade.rotation.x = (Math.random() - 0.5) * 0.3;
        grassBlade.rotation.z = Math.random() * Math.PI;
        addToScene(grassBlade);
      }
    });
  }

  function createWarningMarkers() {
    var signMaterial = new THREE.MeshStandardMaterial({
      color: RUST_ORANGE,
      roughness: 0.9,
      metalness: 0.7
    });

    var postMaterial = new THREE.MeshStandardMaterial({
      color: IRON_BLACK,
      roughness: 0.95,
      metalness: 0.6
    });

    var markerPositions = [
      { x: -30, z: -30 },
      { x: 35, z: 30 },
      { x: 0, z: -38 },
      { x: -35, z: 0 },
      { x: 30, z: -15 },
      { x: -15, z: 30 }
    ];

    markerPositions.forEach(function(pos) {
      var post = createCylinderGeometry(0.25, 0.25, 5, 6, postMaterial);
      post.position.set(pos.x, 2.5, pos.z);
      addToScene(post);

      var signBoard = createBoxGeometry(2.5, 1.8, 0.3, signMaterial);
      signBoard.position.set(pos.x, 5.2, pos.z - 0.5);
      signBoard.rotation.x = 0.3;
      addToScene(signBoard);

      var boltTop = createSphereGeometry(0.15, 4, 4, signMaterial);
      boltTop.position.set(pos.x - 0.8, 5.8, pos.z);
      addToScene(boltTop);

      var boltBottom = createSphereGeometry(0.15, 4, 4, signMaterial);
      boltBottom.position.set(pos.x + 0.8, 4.6, pos.z);
      addToScene(boltBottom);
    });
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    rustBubbles = [];
    dripDroplets = [];

    createMarchWater();
    createSunkenMachinery();
    createIronOreDeposits();
    createSubmergedRailroads();
    createCraneSkeletons();
    createCorrodedPipelines();
    createRustBubblePockets();
    createIronBridgeRuins();
    createDrainageCulverts();
    createCorrodedElectricalPylons();
    createMilitaryPatrolBoatWreck();
    createMarshGrass();
    createWarningMarkers();

    return true;
  }

  function update(delta) {
    var i;

    for (i = 0; i < rustBubbles.length; i++) {
      var bubble = rustBubbles[i];
      if (bubble.userData.bubbleData) {
        var bubbleData = bubble.userData.bubbleData;
        bubbleData.lifetime += delta;

        bubble.position.y += bubbleData.velocity * delta;
        bubble.position.x = bubbleData.startX + Math.sin(bubbleData.lifetime * 2) * 0.5;
        bubble.position.z = bubbleData.startZ + Math.cos(bubbleData.lifetime * 1.5) * 0.5;

        bubble.scale.x = 1 - (bubbleData.lifetime / bubbleData.maxLifetime) * 0.8;
        bubble.scale.y = bubble.scale.x;
        bubble.scale.z = bubble.scale.x;

        if (bubbleData.lifetime > bubbleData.maxLifetime) {
          bubbleData.lifetime = 0;
          bubble.position.y = bubbleData.startY;
          bubble.scale.set(1, 1, 1);
        }
      }
    }

    for (i = 0; i < dripDroplets.length; i++) {
      var droplet = dripDroplets[i];
      if (droplet.userData.dropData) {
        var dropData = droplet.userData.dropData;
        dropData.lifetime += delta;

        droplet.position.y -= dropData.velocity * delta;

        if (dropData.lifetime > dropData.maxLifetime || droplet.position.y < 0) {
          scene.remove(droplet);
          dripDroplets.splice(i, 1);
          i--;
        }
      }
    }

    if (Math.random() < 0.15) {
      var pipeX = -40 + Math.random() * 80;
      var pipeZ = -40 + Math.random() * 80;
      var dropMat = new THREE.MeshStandardMaterial({
        color: RUST_ORANGE,
        roughness: 0.7,
        metalness: 0.5
      });
      var drop = createSphereGeometry(0.15, 4, 4, dropMat);
      drop.position.set(pipeX, 3.5, pipeZ);
      drop.userData.dropData = {
        velocity: 2 + Math.random() * 3,
        lifetime: 0,
        maxLifetime: 2
      };
      dripDroplets.push(drop);
      scene.add(drop);
    }

    var waterMeshes = objects.filter(function(obj) {
      return obj.userData && obj.userData.isWater;
    });

    waterMeshes.forEach(function(water) {
      water.position.y = 0.75 + Math.sin(Date.now() * 0.0005 + water.position.x) * 0.1 +
                         Math.cos(Date.now() * 0.0003 + water.position.z) * 0.08;
    });
  }

  function reset() {
    if (scene) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    rustBubbles = [];
    dripDroplets = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
