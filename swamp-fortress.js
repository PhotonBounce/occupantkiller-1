window.SwampFortress = (function() {
  'use strict';

  var swampObjects = [];
  var waterMeshes = [];
  var ropeSegments = [];
  var fireMeshes = [];
  var mistMeshes = [];
  var leafParticles = [];
  var bridgeSwayOffsets = {};
  var fireFlickerStates = {};
  var mistDriftOffsets = {};
  var elapsedTime = 0;
  var time = 0;

  function createSwampWater(scene) {
    var waterGeometry = new THREE.BoxGeometry(200, 5, 200);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a4620,
      roughness: 0.6,
      metalness: 0.1
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, -2.5, 0);
    water.receiveShadow = true;
    scene.add(water);
    waterMeshes.push(water);
    swampObjects.push(water);
    return water;
  }

  function createCypressTree(scene, x, z, scale) {
    var trunkGeometry = new THREE.CylinderGeometry(1.2 * scale, 1.5 * scale, 12 * scale, 8);
    var trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.8
    });
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 6 * scale, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    swampObjects.push(trunk);

    var foliageGeometry = new THREE.SphereGeometry(3.5 * scale, 6, 6);
    var foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.7
    });
    var foliage1 = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage1.position.set(x, 10 * scale, z);
    foliage1.scale.set(1.2, 1.5, 1.2);
    foliage1.castShadow = true;
    foliage1.receiveShadow = true;
    scene.add(foliage1);
    swampObjects.push(foliage1);

    var foliage2 = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage2.position.set(x, 14 * scale, z);
    foliage2.castShadow = true;
    foliage2.receiveShadow = true;
    scene.add(foliage2);
    swampObjects.push(foliage2);
  }

  function createWoodenPlatform(scene, x, y, z, width, depth, height) {
    var platformGeometry = new THREE.BoxGeometry(width, height, depth);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, y, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    swampObjects.push(platform);
    return platform;
  }

  function createStiltLegs(scene, x, y, z) {
    var stiltGeometry = new THREE.CylinderGeometry(0.4, 0.5, 15, 6);
    var stiltMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a3d2a,
      roughness: 0.9
    });
    var offsets = [
      { dx: 3, dz: 3 },
      { dx: -3, dz: 3 },
      { dx: 3, dz: -3 },
      { dx: -3, dz: -3 }
    ];
    offsets.forEach(function(offset) {
      var stilt = new THREE.Mesh(stiltGeometry, stiltMaterial);
      stilt.position.set(x + offset.dx, y - 7.5, z + offset.dz);
      stilt.castShadow = true;
      stilt.receiveShadow = true;
      scene.add(stilt);
      swampObjects.push(stilt);
    });
  }

  function createRopeBridge(scene, x1, y1, z1, x2, y2, z2, bridgeId) {
    var distance = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
    );
    var segments = Math.ceil(distance / 2);
    var planksGeometry = new THREE.BoxGeometry(3, 0.3, 0.5);
    var plankMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.8
    });

    var points = [];
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      points.push(new THREE.Vector3(
        x1 + (x2 - x1) * t,
        y1 + (y2 - y1) * t,
        z1 + (z2 - z1) * t
      ));
    }

    points.forEach(function(point, index) {
      var plank = new THREE.Mesh(planksGeometry, plankMaterial);
      plank.position.copy(point);
      plank.castShadow = true;
      plank.receiveShadow = true;
      scene.add(plank);
      swampObjects.push(plank);
    });

    var ropeGeometry = new THREE.BoxGeometry(0.15, distance, 0.15);
    var ropeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9
    });
    var rope1 = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope1.position.set(x1 + (x2 - x1) * 0.5 - 1.2, y1 + (y2 - y1) * 0.5, z1 + (z2 - z1) * 0.5);
    rope1.rotation.z = Math.atan2(y2 - y1, distance);
    rope1.castShadow = true;
    scene.add(rope1);
    ropeSegments.push(rope1);
    swampObjects.push(rope1);

    var rope2 = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope2.position.set(x1 + (x2 - x1) * 0.5 + 1.2, y1 + (y2 - y1) * 0.5, z1 + (z2 - z1) * 0.5);
    rope2.rotation.z = Math.atan2(y2 - y1, distance);
    rope2.castShadow = true;
    scene.add(rope2);
    ropeSegments.push(rope2);
    swampObjects.push(rope2);

    bridgeSwayOffsets[bridgeId] = 0;
  }

  function createWatchPlatform(scene, x, z) {
    createWoodenPlatform(scene, x, 15, z, 4, 4, 0.4);
    var railGeometry = new THREE.BoxGeometry(0.3, 2, 4);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8
    });
    var rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(x - 1.85, 16.5, z);
    rail1.castShadow = true;
    scene.add(rail1);
    swampObjects.push(rail1);

    var rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(x + 1.85, 16.5, z);
    rail2.castShadow = true;
    scene.add(rail2);
    swampObjects.push(rail2);
  }

  function createBoatPen(scene, x, z) {
    var shedGeometry = new THREE.BoxGeometry(8, 4, 6);
    var shedMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.8
    });
    var shed = new THREE.Mesh(shedGeometry, shedMaterial);
    shed.position.set(x, 5, z);
    shed.castShadow = true;
    shed.receiveShadow = true;
    scene.add(shed);
    swampObjects.push(shed);

    var boatGeometry = new THREE.BoxGeometry(5, 1.5, 2.5);
    var boatMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.7
    });
    var boat = new THREE.Mesh(boatGeometry, boatMaterial);
    boat.position.set(x, 0.5, z);
    boat.castShadow = true;
    boat.receiveShadow = true;
    scene.add(boat);
    swampObjects.push(boat);
  }

  function createSupplyCache(scene, x, z) {
    var crateGeometry = new THREE.BoxGeometry(1, 1, 1);
    var crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.8
    });

    var positions = [
      { x: 0, y: 1, z: 0 },
      { x: 1.2, y: 1, z: 0 },
      { x: -1.2, y: 1, z: 0 },
      { x: 0, y: 2.2, z: 0 },
      { x: 0, y: 0, z: 0 }
    ];

    positions.forEach(function(pos) {
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(x + pos.x, 8 + pos.y, z + pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      swampObjects.push(crate);
    });

    var tarpGeometry = new THREE.BoxGeometry(4, 0.1, 3);
    var tarpMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a4a2a,
      roughness: 0.9
    });
    var tarp = new THREE.Mesh(tarpGeometry, tarpMaterial);
    tarp.position.set(x, 10.5, z);
    tarp.receiveShadow = true;
    scene.add(tarp);
    swampObjects.push(tarp);
  }

  function createWeaponsRack(scene, x, z) {
    var rackGeometry = new THREE.BoxGeometry(3, 4, 0.8);
    var rackMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.8
    });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(x, 8, z);
    rack.castShadow = true;
    scene.add(rack);
    swampObjects.push(rack);

    for (var i = 0; i < 6; i++) {
      var gunGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.1);
      var gunMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8
      });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(x - 1 + i * 0.4, 6 + i * 0.5, z - 0.3);
      gun.castShadow = true;
      scene.add(gun);
      swampObjects.push(gun);
    }
  }

  function createHammock(scene, x, z) {
    var clothGeometry = new THREE.BoxGeometry(4, 0.3, 1.5);
    var clothMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.7
    });
    var cloth = new THREE.Mesh(clothGeometry, clothMaterial);
    cloth.position.set(x, 7, z);
    cloth.rotation.z = 0.2;
    cloth.castShadow = true;
    cloth.receiveShadow = true;
    scene.add(cloth);
    swampObjects.push(cloth);

    var ropeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9
    });
    var ropeGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
    var rope1 = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope1.position.set(x - 2, 8.8, z);
    rope1.castShadow = true;
    scene.add(rope1);
    swampObjects.push(rope1);

    var rope2 = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope2.position.set(x + 2, 8.8, z);
    rope2.castShadow = true;
    scene.add(rope2);
    swampObjects.push(rope2);
  }

  function createFirePit(scene, x, z) {
    var ringGeometry = new THREE.CylinderGeometry(2, 2.2, 0.5, 16);
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9
    });
    var ring = new THREE.Mesh(ringGeometry, stoneMaterial);
    ring.position.set(x, 6.8, z);
    ring.castShadow = true;
    ring.receiveShadow = true;
    scene.add(ring);
    swampObjects.push(ring);

    for (var i = 0; i < 6; i++) {
      var fireGeometry = new THREE.SphereGeometry(0.8, 6, 6);
      var fireMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff3300,
        emissiveIntensity: 0.5,
        roughness: 0.6
      });
      var fire = new THREE.Mesh(fireGeometry, fireMaterial);
      fire.position.set(
        x + Math.cos(i * Math.PI / 3) * 0.8,
        7.5 + Math.random() * 0.5,
        z + Math.sin(i * Math.PI / 3) * 0.8
      );
      fire.castShadow = true;
      scene.add(fire);
      fireMeshes.push(fire);
      fireFlickerStates[i] = Math.random() * Math.PI * 2;
      swampObjects.push(fire);
    }
  }

  function createFiltrationBarrel(scene, x, z) {
    var barrelGeometry = new THREE.CylinderGeometry(1, 1.1, 2, 8);
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a5a4a,
      roughness: 0.8
    });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(x, 7, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);
    swampObjects.push(barrel);

    var lidGeometry = new THREE.CylinderGeometry(1.15, 1.15, 0.2, 8);
    var lidMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a4a3a,
      roughness: 0.9
    });
    var lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(x, 8.1, z);
    lid.castShadow = true;
    scene.add(lid);
    swampObjects.push(lid);
  }

  function createBoobyTrapIndicators(scene) {
    var trapPositions = [
      { x: -15, z: 10 },
      { x: 15, z: -15 },
      { x: 5, z: 20 }
    ];

    trapPositions.forEach(function(pos) {
      var skullGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      var skullMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.4
      });
      var skull = new THREE.Mesh(skullGeometry, skullMaterial);
      skull.position.set(pos.x, 6.5, pos.z);
      skull.castShadow = true;
      scene.add(skull);
      swampObjects.push(skull);

      var markerGeometry = new THREE.BoxGeometry(1, 0.2, 1);
      var markerMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        roughness: 0.7
      });
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(pos.x, 6, pos.z);
      marker.receiveShadow = true;
      scene.add(marker);
      swampObjects.push(marker);
    });
  }

  function createLookoutChair(scene, x, z) {
    var seatGeometry = new THREE.BoxGeometry(1.2, 0.3, 1.2);
    var woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8
    });
    var seat = new THREE.Mesh(seatGeometry, woodMaterial);
    seat.position.set(x, 7.5, z);
    seat.castShadow = true;
    scene.add(seat);
    swampObjects.push(seat);

    var legGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    var legPositions = [
      { x: -0.5, z: -0.5 },
      { x: 0.5, z: -0.5 },
      { x: -0.5, z: 0.5 },
      { x: 0.5, z: 0.5 }
    ];

    legPositions.forEach(function(offset) {
      var leg = new THREE.Mesh(legGeometry, woodMaterial);
      leg.position.set(x + offset.x, 6.75, z + offset.z);
      leg.castShadow = true;
      scene.add(leg);
      swampObjects.push(leg);
    });

    var backGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.2);
    var back = new THREE.Mesh(backGeometry, woodMaterial);
    back.position.set(x, 8.5, z - 0.7);
    back.castShadow = true;
    scene.add(back);
    swampObjects.push(back);
  }

  function createFishingEquipment(scene, x, z) {
    var poleGeometry = new THREE.BoxGeometry(0.1, 0.1, 4);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.8
    });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 5, z);
    pole.rotation.z = 0.4;
    pole.castShadow = true;
    scene.add(pole);
    swampObjects.push(pole);

    var floatGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    var floatMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.6
    });
    var floats = [
      { x: -2, z: 3 },
      { x: 0, z: 5 },
      { x: 2, z: 4 }
    ];

    floats.forEach(function(offset) {
      var float = new THREE.Mesh(floatGeometry, floatMaterial);
      float.position.set(x + offset.x, -0.5, z + offset.z);
      float.castShadow = true;
      scene.add(float);
      swampObjects.push(float);
    });
  }

  function createDuckweedPatches(scene) {
    var patchGeometry = new THREE.BoxGeometry(15, 0.05, 12);
    var duckweedMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4a1a,
      roughness: 0.9
    });

    var positions = [
      { x: -30, z: -30 },
      { x: 30, z: 40 },
      { x: -40, z: 20 },
      { x: 40, z: -20 }
    ];

    positions.forEach(function(pos) {
      var patch = new THREE.Mesh(patchGeometry, duckweedMaterial);
      patch.position.set(pos.x, 0, pos.z);
      patch.receiveShadow = true;
      scene.add(patch);
      swampObjects.push(patch);
    });
  }

  function createMistWisps(scene) {
    for (var i = 0; i < 8; i++) {
      var mistGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 4, 4);
      var mistMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.15,
        roughness: 0.9
      });
      var mist = new THREE.Mesh(mistGeometry, mistMaterial);
      mist.position.set(
        (Math.random() - 0.5) * 100,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 100
      );
      scene.add(mist);
      mistMeshes.push(mist);
      mistDriftOffsets[i] = { x: 0, z: 0 };
      swampObjects.push(mist);
    }
  }

  function init(scene, camera) {
    createSwampWater(scene);
    createDuckweedPatches(scene);

    createCypressTree(scene, -40, -30, 1);
    createCypressTree(scene, 35, 35, 0.8);
    createCypressTree(scene, -20, 25, 0.9);
    createCypressTree(scene, 25, -20, 1.1);

    createWoodenPlatform(scene, 0, 8, 0, 8, 6, 0.4);
    createStiltLegs(scene, 0, 8, 0);

    createWoodenPlatform(scene, 20, 9, -15, 6, 5, 0.4);
    createStiltLegs(scene, 20, 9, -15);

    createWoodenPlatform(scene, -18, 10, 15, 7, 5, 0.4);
    createStiltLegs(scene, -18, 10, 15);

    createRopeBridge(scene, 0, 8, 0, 20, 9, -15, 0);
    createRopeBridge(scene, 0, 8, 0, -18, 10, 15, 1);
    createRopeBridge(scene, 20, 9, -15, -18, 10, 15, 2);

    createWatchPlatform(scene, 30, 30);
    createBoatPen(scene, 0, -25);
    createSupplyCache(scene, -15, 8);
    createWeaponsRack(scene, 10, 10);
    createHammock(scene, -10, 5);
    createFirePit(scene, 5, 20);
    createFiltrationBarrel(scene, 15, 8);
    createBoobyTrapIndicators(scene);
    createLookoutChair(scene, 25, 10);
    createFishingEquipment(scene, -30, -20);
    createMistWisps(scene);
  }

  function update(delta) {
    time += delta;
    elapsedTime += delta;

    waterMeshes.forEach(function(water) {
      water.position.y = -2.5 + Math.sin(time * 0.5) * 0.1;
    });

    ropeSegments.forEach(function(rope, index) {
      rope.position.x += Math.sin(time * 1.2 + index * 0.5) * 0.02;
    });

    fireMeshes.forEach(function(fire, index) {
      fireFlickerStates[index] += delta * 3;
      var flicker = 0.5 + Math.sin(fireFlickerStates[index]) * 0.3;
      fire.position.y = 7.5 + flicker * 0.3;
      fire.scale.set(
        1 + Math.sin(fireFlickerStates[index]) * 0.1,
        1 + Math.sin(fireFlickerStates[index]) * 0.1,
        1 + Math.sin(fireFlickerStates[index]) * 0.1
      );
    });

    mistMeshes.forEach(function(mist, index) {
      mistDriftOffsets[index].x += Math.sin(time * 0.3 + index) * delta * 0.5;
      mistDriftOffsets[index].z += Math.cos(time * 0.4 + index * 0.7) * delta * 0.5;
      mist.position.x += mistDriftOffsets[index].x * 0.1;
      mist.position.z += mistDriftOffsets[index].z * 0.1;
    });

    if (leafParticles.length < 50) {
      var leafGeometry = new THREE.BoxGeometry(0.05, 0.08, 0.02);
      var leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b6f47,
        roughness: 0.7
      });
      var leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.set(
        (Math.random() - 0.5) * 80,
        20 + Math.random() * 10,
        (Math.random() - 0.5) * 80
      );
      leaf.rotation.x = Math.random() * Math.PI;
      leaf.rotation.y = Math.random() * Math.PI;
      leaf.userData.velocity = {
        x: (Math.random() - 0.5) * 2,
        y: -1 - Math.random() * 0.5,
        z: (Math.random() - 0.5) * 2
      };
      var scene = swampObjects[0].parent;
      if (scene) {
        scene.add(leaf);
        leafParticles.push(leaf);
      }
    }

    leafParticles = leafParticles.filter(function(leaf) {
      if (leaf.position.y < -5) {
        if (leaf.parent) {
          leaf.parent.remove(leaf);
        }
        return false;
      }
      leaf.position.x += leaf.userData.velocity.x * delta;
      leaf.position.y += leaf.userData.velocity.y * delta;
      leaf.position.z += leaf.userData.velocity.z * delta;
      leaf.rotation.x += delta * 1.5;
      leaf.rotation.y += delta * 0.8;
      return true;
    });
  }

  function reset() {
    swampObjects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });
    swampObjects = [];
    waterMeshes = [];
    ropeSegments = [];
    fireMeshes = [];
    mistMeshes = [];
    leafParticles = [];
    bridgeSwayOffsets = {};
    fireFlickerStates = {};
    mistDriftOffsets = {};
    elapsedTime = 0;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
