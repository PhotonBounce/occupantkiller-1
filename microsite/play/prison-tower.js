window.PrisonTower = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animationState = {
    spotlightAngle: 0,
    waterCannonAngle: 0,
    barrierGateOpen: false,
    sensorPostBlink: 0
  };

  function init(sceneRef) {
    scene = sceneRef;
    objects = [];

    // Central panopticon tower - main surveillance structure
    var towerGeometry = new THREE.CylinderGeometry(8, 8, 20, 32);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.3 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 10;
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);

    // Tower top observation deck
    var deckGeometry = new THREE.CylinderGeometry(9, 9, 1, 32);
    var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.4 });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 20.5;
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    objects.push(deck);

    // Rotating spotlight on tower
    var spotlightPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 3, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    spotlightPole.position.set(7, 21.5, 0);
    spotlightPole.castShadow = true;
    scene.add(spotlightPole);
    objects.push(spotlightPole);

    var spotlightHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.8 })
    );
    spotlightHead.position.set(7, 23.5, 0);
    spotlightHead.castShadow = true;
    scene.add(spotlightHead);
    objects.push(spotlightHead);

    // Cell block wing 1 (north)
    var cellBlock1 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 12, 20),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a })
    );
    cellBlock1.position.set(18, 6, 0);
    cellBlock1.castShadow = true;
    cellBlock1.receiveShadow = true;
    scene.add(cellBlock1);
    objects.push(cellBlock1);

    // Cell block wing 2 (south)
    var cellBlock2 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 12, 20),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a })
    );
    cellBlock2.position.set(-18, 6, 0);
    cellBlock2.castShadow = true;
    cellBlock2.receiveShadow = true;
    scene.add(cellBlock2);
    objects.push(cellBlock2);

    // Cell block wing 3 (east)
    var cellBlock3 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 12, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a })
    );
    cellBlock3.position.set(0, 6, 18);
    cellBlock3.castShadow = true;
    cellBlock3.receiveShadow = true;
    scene.add(cellBlock3);
    objects.push(cellBlock3);

    // Cell block wing 4 (west)
    var cellBlock4 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 12, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a })
    );
    cellBlock4.position.set(0, 6, -18);
    cellBlock4.castShadow = true;
    cellBlock4.receiveShadow = true;
    scene.add(cellBlock4);
    objects.push(cellBlock4);

    // Exercise yard boundary wall with razor wire
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.7 });
    var walls = [];

    // North wall
    var wallN = new THREE.Mesh(new THREE.BoxGeometry(45, 8, 1), wallMaterial);
    wallN.position.set(0, 4, 32);
    wallN.castShadow = true;
    wallN.receiveShadow = true;
    scene.add(wallN);
    objects.push(wallN);
    walls.push(wallN);

    // South wall
    var wallS = new THREE.Mesh(new THREE.BoxGeometry(45, 8, 1), wallMaterial);
    wallS.position.set(0, 4, -32);
    wallS.castShadow = true;
    wallS.receiveShadow = true;
    scene.add(wallS);
    objects.push(wallS);
    walls.push(wallS);

    // East wall
    var wallE = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 62), wallMaterial);
    wallE.position.set(32, 4, 0);
    wallE.castShadow = true;
    wallE.receiveShadow = true;
    scene.add(wallE);
    objects.push(wallE);
    walls.push(wallE);

    // West wall
    var wallW = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 62), wallMaterial);
    wallW.position.set(-32, 4, 0);
    wallW.castShadow = true;
    wallW.receiveShadow = true;
    scene.add(wallW);
    objects.push(wallW);
    walls.push(wallW);

    // Razor wire on walls (using line segments)
    var razorWirePositions = [];
    for (var i = 0; i < 4; i++) {
      razorWirePositions.push(0, 8 + i * 0.3, 0);
      razorWirePositions.push(1, 8 + i * 0.3, 0);
    }
    var razorGeometry = new THREE.BufferGeometry();
    razorGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(razorWirePositions), 3));
    var razorMaterial = new THREE.LineBasicMaterial({ color: 0xaa0000, linewidth: 2 });
    var razorWire = new THREE.LineSegments(razorGeometry, razorMaterial);
    razorWire.position.set(32, 0, 0);
    scene.add(razorWire);
    objects.push(razorWire);

    // Sally port vehicle gate (sliding barrier)
    var gateGeometry = new THREE.BoxGeometry(8, 6, 0.5);
    var gateMaterial = new THREE.MeshStandardMaterial({ color: 0x330000, metalness: 0.6 });
    var sallieGate = new THREE.Mesh(gateGeometry, gateMaterial);
    sallieGate.position.set(32, 3, 0);
    sallieGate.userData.initialX = 32;
    sallieGate.castShadow = true;
    scene.add(sallieGate);
    objects.push(sallieGate);

    // Emergency lockdown barrier gates
    var barrier1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8 })
    );
    barrier1.position.set(15, 2.5, 25);
    barrier1.userData.initialZ = 25;
    barrier1.castShadow = true;
    scene.add(barrier1);
    objects.push(barrier1);

    var barrier2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8 })
    );
    barrier2.position.set(-15, 2.5, -25);
    barrier2.userData.initialZ = -25;
    barrier2.castShadow = true;
    scene.add(barrier2);
    objects.push(barrier2);

    // Water cannon truck
    var truckBase = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    truckBase.position.set(-20, 1.5, 25);
    truckBase.castShadow = true;
    scene.add(truckBase);
    objects.push(truckBase);

    // Water cannon turret
    var cannonBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    cannonBase.position.set(-20, 3.4, 25);
    cannonBase.castShadow = true;
    scene.add(cannonBase);
    objects.push(cannonBase);

    // Water cannon barrel
    var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 16);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x004488, metalness: 0.7 });
    var cannonBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    cannonBarrel.rotation.z = Math.PI / 4;
    cannonBarrel.position.set(-20, 4.5, 25);
    cannonBarrel.userData.initialRotationZ = Math.PI / 4;
    cannonBarrel.castShadow = true;
    scene.add(cannonBarrel);
    objects.push(cannonBarrel);

    // Riot response armory building
    var armoryGeometry = new THREE.BoxGeometry(8, 6, 10);
    var armoryMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.4 });
    var armory = new THREE.Mesh(armoryGeometry, armoryMaterial);
    armory.position.set(25, 3, -20);
    armory.castShadow = true;
    armory.receiveShadow = true;
    scene.add(armory);
    objects.push(armory);

    // Armory roof/turret
    var armoryRoof = new THREE.Mesh(
      new THREE.ConeGeometry(5, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    armoryRoof.position.set(25, 6, -20);
    armoryRoof.castShadow = true;
    scene.add(armoryRoof);
    objects.push(armoryRoof);

    // Warden command post
    var commandPost = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 })
    );
    commandPost.position.set(-25, 2.5, 20);
    commandPost.castShadow = true;
    commandPost.receiveShadow = true;
    scene.add(commandPost);
    objects.push(commandPost);

    // Command post antenna tower
    var antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(-25, 5.5, 20);
    antenna.castShadow = true;
    scene.add(antenna);
    objects.push(antenna);

    // Perimeter sensor posts (4 corners)
    var sensorPositions = [
      { x: 35, y: 3, z: 35, color: 0x00ff00 },
      { x: -35, y: 3, z: 35, color: 0x00ff00 },
      { x: 35, y: 3, z: -35, color: 0x00ff00 },
      { x: -35, y: 3, z: -35, color: 0x00ff00 }
    ];

    var sensorPosts = [];
    sensorPositions.forEach(function(pos) {
      var postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 12);
      var postMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(pos.x, pos.y, pos.z);
      post.castShadow = true;
      scene.add(post);
      objects.push(post);

      // Sensor light on top
      var sensorLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 12, 12),
        new THREE.MeshStandardMaterial({
          color: pos.color,
          emissive: pos.color,
          emissiveIntensity: 0.6
        })
      );
      sensorLight.position.set(pos.x, pos.y + 3.2, pos.z);
      sensorLight.userData.color = pos.color;
      sensorLight.userData.isSensor = true;
      scene.add(sensorLight);
      objects.push(sensorLight);
      sensorPosts.push(sensorLight);
    });

    // Guard tower at northeast
    var guardTower = new THREE.Mesh(
      new THREE.BoxGeometry(3, 8, 3),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    guardTower.position.set(30, 4, 30);
    guardTower.castShadow = true;
    guardTower.receiveShadow = true;
    scene.add(guardTower);
    objects.push(guardTower);

    // Guard tower searchlight
    var searchlightHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 0.7 })
    );
    searchlightHead.position.set(30, 8.5, 30);
    searchlightHead.castShadow = true;
    scene.add(searchlightHead);
    objects.push(searchlightHead);

    // Ground/yard surface
    var yardGeometry = new THREE.BoxGeometry(80, 0.2, 80);
    var yardMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
    var yard = new THREE.Mesh(yardGeometry, yardMaterial);
    yard.position.y = -0.1;
    yard.receiveShadow = true;
    scene.add(yard);
    objects.push(yard);

    return {
      objects: objects,
      spotlightHead: spotlightHead,
      cannonBarrel: cannonBarrel,
      sallieGate: sallieGate,
      barrier1: barrier1,
      barrier2: barrier2,
      sensorPosts: sensorPosts
    };
  }

  function update(deltaTime, refs) {
    if (!scene) return;

    // Update spotlight angle and rotation
    animationState.spotlightAngle += deltaTime * 0.5;
    if (refs.spotlightHead) {
      refs.spotlightHead.parent.rotation.y = animationState.spotlightAngle;
    }

    // Water cannon rotation
    animationState.waterCannonAngle += deltaTime * 0.3;
    if (refs.cannonBarrel) {
      refs.cannonBarrel.rotation.z = Math.PI / 4 + Math.sin(animationState.waterCannonAngle) * 0.3;
    }

    // Barrier gate open/close animation
    animationState.barrierGateOpen = (Math.sin(animationState.spotlightAngle * 0.5) > 0);
    if (refs.barrier1) {
      refs.barrier1.position.z = refs.barrier1.userData.initialZ + (animationState.barrierGateOpen ? 8 : 0);
    }
    if (refs.barrier2) {
      refs.barrier2.position.z = refs.barrier2.userData.initialZ - (animationState.barrierGateOpen ? 8 : 0);
    }

    // Sally port gate animation
    if (refs.sallieGate) {
      refs.sallieGate.position.x = refs.sallieGate.userData.initialX - (animationState.barrierGateOpen ? 10 : 0);
    }

    // Sensor post blinking
    animationState.sensorPostBlink = Math.sin(deltaTime * 3) > 0 ? 1 : 0.3;
    if (refs.sensorPosts) {
      refs.sensorPosts.forEach(function(sensor) {
        sensor.material.emissiveIntensity = 0.6 * animationState.sensorPostBlink;
      });
    }
  }

  function reset() {
    if (scene) {
      objects.forEach(function(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(function(m) { m.dispose(); });
          } else {
            obj.material.dispose();
          }
        }
        scene.remove(obj);
      });
    }
    objects = [];
    animationState = {
      spotlightAngle: 0,
      waterCannonAngle: 0,
      barrierGateOpen: false,
      sensorPostBlink: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
