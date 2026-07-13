var DuneFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var fortressObjects = [];
  var windmillRotation = 0;
  var sandParticles = [];
  var waterShimmer = 0;
  var heatHazeObjects = [];
  var particleSystem = null;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    fortressObjects = [];
    heatHazeObjects = [];
    sandParticles = [];
    waterShimmer = 0;
    windmillRotation = 0;

    // Sand dune mounds - rolling golden landscape
    var duneMaterial = new THREE.MeshLambertMaterial({ color: 0xD4AF8B });
    var dune1Geom = new THREE.BoxGeometry(100, 30, 60);
    var dune1 = new THREE.Mesh(dune1Geom, duneMaterial);
    dune1.position.set(-40, 8, 0);
    dune1.rotation.z = Math.PI / 12;
    scene.add(dune1);
    fortressObjects.push(dune1);

    var dune2Geom = new THREE.BoxGeometry(80, 25, 50);
    var dune2 = new THREE.Mesh(dune2Geom, duneMaterial);
    dune2.position.set(30, 6, -30);
    dune2.rotation.z = -Math.PI / 16;
    scene.add(dune2);
    fortressObjects.push(dune2);

    var dune3Geom = new THREE.BoxGeometry(70, 20, 45);
    var dune3 = new THREE.Mesh(dune3Geom, duneMaterial);
    dune3.position.set(10, 5, 35);
    dune3.rotation.z = Math.PI / 18;
    scene.add(dune3);
    fortressObjects.push(dune3);

    // Adobe fortress walls - sand-colored thick walls
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0xC9A876 });

    // Main north wall
    var northWallGeom = new THREE.BoxGeometry(120, 18, 3);
    var northWall = new THREE.Mesh(northWallGeom, wallMaterial);
    northWall.position.set(0, 12, -40);
    scene.add(northWall);
    fortressObjects.push(northWall);
    heatHazeObjects.push(northWall);

    // Main south wall
    var southWallGeom = new THREE.BoxGeometry(120, 18, 3);
    var southWall = new THREE.Mesh(southWallGeom, wallMaterial);
    southWall.position.set(0, 12, 40);
    scene.add(southWall);
    fortressObjects.push(southWall);
    heatHazeObjects.push(southWall);

    // East wall
    var eastWallGeom = new THREE.BoxGeometry(3, 18, 85);
    var eastWall = new THREE.Mesh(eastWallGeom, wallMaterial);
    eastWall.position.set(60, 12, 0);
    scene.add(eastWall);
    fortressObjects.push(eastWall);
    heatHazeObjects.push(eastWall);

    // West wall
    var westWallGeom = new THREE.BoxGeometry(3, 18, 85);
    var westWall = new THREE.Mesh(westWallGeom, wallMaterial);
    westWall.position.set(-60, 12, 0);
    scene.add(westWall);
    fortressObjects.push(westWall);
    heatHazeObjects.push(westWall);

    // Watchtower - crenelated top
    var towerBaseGeom = new THREE.BoxGeometry(12, 25, 12);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0xB89968 });
    var towerBase = new THREE.Mesh(towerBaseGeom, towerMaterial);
    towerBase.position.set(-45, 14, -35);
    scene.add(towerBase);
    fortressObjects.push(towerBase);
    heatHazeObjects.push(towerBase);

    // Tower top crenellations
    var crenel1Geom = new THREE.BoxGeometry(3, 5, 12);
    var crenel1 = new THREE.Mesh(crenel1Geom, towerMaterial);
    crenel1.position.set(-49, 27, -35);
    scene.add(crenel1);
    fortressObjects.push(crenel1);

    var crenel2Geom = new THREE.BoxGeometry(3, 5, 12);
    var crenel2 = new THREE.Mesh(crenel2Geom, towerMaterial);
    crenel2.position.set(-41, 27, -35);
    scene.add(crenel2);
    fortressObjects.push(crenel2);

    // Gate arch - side pillars + top lintel
    var pillarGeom = new THREE.BoxGeometry(4, 20, 4);
    var pillarMaterial = new THREE.MeshPhongMaterial({ color: 0xA0825B });
    var pillarLeft = new THREE.Mesh(pillarGeom, pillarMaterial);
    pillarLeft.position.set(-8, 12, -40);
    scene.add(pillarLeft);
    fortressObjects.push(pillarLeft);

    var pillarRight = new THREE.Mesh(pillarGeom, pillarMaterial);
    pillarRight.position.set(8, 12, -40);
    scene.add(pillarRight);
    fortressObjects.push(pillarRight);

    var lintelGeom = new THREE.BoxGeometry(20, 3, 4);
    var lintel = new THREE.Mesh(lintelGeom, pillarMaterial);
    lintel.position.set(0, 22, -40);
    scene.add(lintel);
    fortressObjects.push(lintel);

    // Date palm trees - trunk + frond clusters
    var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var frondMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });

    // Oasis location
    var oasisX = 35;
    var oasisZ = 20;

    for (var i = 0; i < 4; i++) {
      var trunkGeom = new THREE.CylinderGeometry(1.5, 2, 15, 8);
      var trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
      trunk.position.set(oasisX + (i % 2) * 5, 8, oasisZ + Math.floor(i / 2) * 5);
      scene.add(trunk);
      fortressObjects.push(trunk);

      var frondGeom = new THREE.ConeGeometry(4, 8, 8);
      var frond = new THREE.Mesh(frondGeom, frondMaterial);
      frond.position.set(trunk.position.x, 18, trunk.position.z);
      scene.add(frond);
      fortressObjects.push(frond);
      heatHazeObjects.push(frond);
    }

    // Oasis water pool - blue-green flat
    var poolGeom = new THREE.BoxGeometry(18, 0.3, 18);
    var poolMaterial = new THREE.MeshPhongMaterial({ color: 0x20B2AA });
    var pool = new THREE.Mesh(poolGeom, poolMaterial);
    pool.position.set(oasisX, 0.3, oasisZ);
    scene.add(pool);
    fortressObjects.push(pool);

    // Underground cistern access hatch
    var hatchGeom = new THREE.BoxGeometry(6, 0.5, 6);
    var hatchMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var hatch = new THREE.Mesh(hatchGeom, hatchMaterial);
    hatch.position.set(-25, 0.5, 15);
    scene.add(hatch);
    fortressObjects.push(hatch);

    // Cistern shaft - descending
    var shaftGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 8);
    var shaftMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A4A });
    var shaft = new THREE.Mesh(shaftGeom, shaftMaterial);
    shaft.position.set(-25, -3, 15);
    scene.add(shaft);
    fortressObjects.push(shaft);

    // Camel pen enclosure - fence + camel shapes
    var fenceGeom = new THREE.BoxGeometry(30, 2, 0.5);
    var fenceMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

    var fenceNorth = new THREE.Mesh(fenceGeom, fenceMaterial);
    fenceNorth.position.set(40, 1.2, -20);
    scene.add(fenceNorth);
    fortressObjects.push(fenceNorth);

    var fenceSouth = new THREE.Mesh(fenceGeom, fenceMaterial);
    fenceSouth.position.set(40, 1.2, 5);
    scene.add(fenceSouth);
    fortressObjects.push(fenceSouth);

    var fenceEast = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 25), fenceMaterial);
    fenceEast.position.set(55, 1.2, -7.5);
    scene.add(fenceEast);
    fortressObjects.push(fenceEast);

    var fenceWest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 25), fenceMaterial);
    fenceWest.position.set(25, 1.2, -7.5);
    scene.add(fenceWest);
    fortressObjects.push(fenceWest);

    // Camel shapes
    var camelMaterial = new THREE.MeshPhongMaterial({ color: 0xB8860B });
    for (var c = 0; c < 3; c++) {
      var bodyGeom = new THREE.BoxGeometry(4, 3, 2);
      var body = new THREE.Mesh(bodyGeom, camelMaterial);
      body.position.set(40, 2, -12 + c * 4);
      scene.add(body);
      fortressObjects.push(body);

      var headGeom = new THREE.SphereGeometry(1.2, 6, 6);
      var head = new THREE.Mesh(headGeom, camelMaterial);
      head.position.set(42, 3.5, -12 + c * 4);
      scene.add(head);
      fortressObjects.push(head);
    }

    // Buried vehicle - half-submerged in dune
    var vehicleGeom = new THREE.BoxGeometry(8, 4, 3);
    var vehicleMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A4A });
    var vehicle = new THREE.Mesh(vehicleGeom, vehicleMaterial);
    vehicle.position.set(-50, 2, 10);
    scene.add(vehicle);
    fortressObjects.push(vehicle);

    // Weapon cache - crates in hidden area
    var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    for (var cr = 0; cr < 6; cr++) {
      var crateGeom = new THREE.BoxGeometry(3, 3, 3);
      var crate = new THREE.Mesh(crateGeom, crateMaterial);
      crate.position.set(-55 + (cr % 3) * 4, 2, 25 + Math.floor(cr / 3) * 4);
      scene.add(crate);
      fortressObjects.push(crate);
    }

    // Carpet merchant display - rolled carpets
    var carpetMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6347 });
    for (var cp = 0; cp < 4; cp++) {
      var carpetGeom = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
      var carpet = new THREE.Mesh(carpetGeom, carpetMaterial);
      carpet.position.set(-30 + cp * 2, 3, -15);
      carpet.rotation.z = Math.PI / 2;
      scene.add(carpet);
      fortressObjects.push(carpet);
    }

    // Clay pot storage - ceramic jugs
    var potMaterial = new THREE.MeshPhongMaterial({ color: 0xCD853F });
    for (var pt = 0; pt < 8; pt++) {
      var potGeom = new THREE.CylinderGeometry(1, 1.2, 2, 8);
      var pot = new THREE.Mesh(potGeom, potMaterial);
      pot.position.set(-40 + (pt % 4) * 2.5, 1.2, -20 + Math.floor(pt / 4) * 3);
      scene.add(pot);
      fortressObjects.push(pot);
    }

    // Windmill - tower + rotating cylinder arms
    var millTowerGeom = new THREE.BoxGeometry(6, 20, 6);
    var millMaterial = new THREE.MeshPhongMaterial({ color: 0xA0825B });
    var millTower = new THREE.Mesh(millTowerGeom, millMaterial);
    millTower.position.set(45, 12, -40);
    scene.add(millTower);
    fortressObjects.push(millTower);

    var armsGeom = new THREE.CylinderGeometry(3, 3, 0.5, 4);
    var armsMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var millArms = new THREE.Mesh(armsGeom, armsMaterial);
    millArms.position.set(45, 22, -40);
    scene.add(millArms);
    fortressObjects.push(millArms);
    heatHazeObjects.push(millTower);

    // Sand drift dunes - angled surfaces
    var driftMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C });
    var drift1Geom = new THREE.BoxGeometry(40, 8, 20);
    var drift1 = new THREE.Mesh(drift1Geom, driftMaterial);
    drift1.position.set(-35, 2, -60);
    drift1.rotation.z = Math.PI / 20;
    scene.add(drift1);
    fortressObjects.push(drift1);

    var drift2Geom = new THREE.BoxGeometry(35, 6, 18);
    var drift2 = new THREE.Mesh(drift2Geom, driftMaterial);
    drift2.position.set(50, 1.5, 50);
    drift2.rotation.z = -Math.PI / 25;
    scene.add(drift2);
    fortressObjects.push(drift2);

    // Defensive earthwork berms
    var bermMaterial = new THREE.MeshPhongMaterial({ color: 0xBDB76B });
    var berm1Geom = new THREE.BoxGeometry(50, 3, 2);
    var berm1 = new THREE.Mesh(berm1Geom, bermMaterial);
    berm1.position.set(0, 1.5, -55);
    berm1.rotation.z = Math.PI / 30;
    scene.add(berm1);
    fortressObjects.push(berm1);

    var berm2Geom = new THREE.BoxGeometry(50, 3, 2);
    var berm2 = new THREE.Mesh(berm2Geom, bermMaterial);
    berm2.position.set(0, 1.5, 55);
    berm2.rotation.z = -Math.PI / 30;
    scene.add(berm2);
    fortressObjects.push(berm2);

    // Merchant stall ruins - collapsed structures
    var ruinMaterial = new THREE.MeshPhongMaterial({ color: 0x9B8B7E });
    var ruin1Geom = new THREE.BoxGeometry(8, 4, 6);
    var ruin1 = new THREE.Mesh(ruin1Geom, ruinMaterial);
    ruin1.position.set(-20, 2.5, 35);
    ruin1.rotation.z = Math.PI / 6;
    scene.add(ruin1);
    fortressObjects.push(ruin1);

    var ruin2Geom = new THREE.BoxGeometry(7, 3, 5);
    var ruin2 = new THREE.Mesh(ruin2Geom, ruinMaterial);
    ruin2.position.set(-8, 2, 38);
    ruin2.rotation.z = -Math.PI / 7;
    scene.add(ruin2);
    fortressObjects.push(ruin2);

    // Rope bridge over dry gulch - LineSegments
    var bridgeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
    var bridgePoints = new Float32Array([
      -15, 10, 0,
      -10, 8, 5,
      -5, 6, 10,
      0, 5, 15,
      5, 6, 10,
      10, 8, 5,
      15, 10, 0
    ]);
    var bridgeGeom = new THREE.BufferGeometry();
    bridgeGeom.setAttribute('position', new THREE.BufferAttribute(bridgePoints, 3));
    var bridge = new THREE.LineSegments(bridgeGeom, bridgeMaterial);
    scene.add(bridge);
    fortressObjects.push(bridge);

    // Sand particle emitters - SphereGeometry tiny particles
    initializeSandParticles();
  };

  var initializeSandParticles = function() {
    var particleCount = 200;
    var particleMaterial = new THREE.MeshBasicMaterial({ color: 0xD4AF8B });

    for (var i = 0; i < particleCount; i++) {
      var particleGeom = new THREE.SphereGeometry(0.1, 3, 3);
      var particle = new THREE.Mesh(particleGeom, particleMaterial);
      particle.position.set(
        Math.random() * 100 - 50,
        Math.random() * 20,
        Math.random() * 100 - 50
      );
      particle.velocity = {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.3) * 0.2,
        z: (Math.random() - 0.5) * 0.3
      };
      particle.lifetime = Math.random() * 5 + 2;
      particle.age = 0;
      scene.add(particle);
      sandParticles.push(particle);
      fortressObjects.push(particle);
    }
  };

  var update = function(delta) {
    windmillRotation += delta * 0.5;
    waterShimmer += delta;

    // Windmill rotation
    var millArms = scene.getObjectByProperty('position', new THREE.Vector3(45, 22, -40));
    if (millArms) {
      millArms.rotation.y = windmillRotation;
    }

    // Oasis water shimmer
    var allObjects = scene.children;
    for (var i = 0; i < allObjects.length; i++) {
      var obj = allObjects[i];
      if (obj.material && obj.material.color &&
          obj.material.color.getHex &&
          obj.material.color.getHex() === 0x20B2AA) {
        obj.position.y = 0.3 + Math.sin(waterShimmer * 2) * 0.02;
      }
    }

    // Sand particle drift
    for (var p = 0; p < sandParticles.length; p++) {
      var particle = sandParticles[p];
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.position.z += particle.velocity.z;
      particle.age += delta;

      if (particle.age >= particle.lifetime) {
        particle.position.set(
          Math.random() * 100 - 50,
          Math.random() * 20,
          Math.random() * 100 - 50
        );
        particle.age = 0;
      }
    }

    // Heat haze shimmer on tall objects
    for (var h = 0; h < heatHazeObjects.length; h++) {
      var obj = heatHazeObjects[h];
      var hazeAmount = Math.sin(waterShimmer * 3 + h) * 0.015;
      obj.position.x += hazeAmount;
    }
  };

  var reset = function() {
    for (var i = 0; i < fortressObjects.length; i++) {
      scene.remove(fortressObjects[i]);
    }
    fortressObjects = [];
    sandParticles = [];
    heatHazeObjects = [];
    windmillRotation = 0;
    waterShimmer = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
