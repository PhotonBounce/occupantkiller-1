window.TankerShip = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animationState = {
    fireSpread: 0,
    helicopterAngle: 0,
    zodiacBoatPositions: [0, 0],
    grapplingRopesAngle: 0,
    time: 0
  };

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];

    // 1. Main Hull - Large Box
    var hullGeometry = new THREE.BoxGeometry(80, 40, 200);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(0, 0, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    objects.push(hull);

    // 2. Bridge Superstructure - Tower
    var bridgeGeometry = new THREE.BoxGeometry(20, 50, 25);
    var bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(20, 30, -70);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    objects.push(bridge);

    // 3. Cargo Pipe Manifold #1 - Cylinder
    var pipeGeometry1 = new THREE.CylinderGeometry(3, 3, 40, 16);
    var pipeMaterial = new THREE.MeshPhongMaterial({ color: 0xe74c3c });
    var pipe1 = new THREE.Mesh(pipeGeometry1, pipeMaterial);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(-15, 5, -30);
    pipe1.castShadow = true;
    scene.add(pipe1);
    objects.push(pipe1);

    // 4. Cargo Pipe Manifold #2 - Cylinder
    var pipeGeometry2 = new THREE.CylinderGeometry(3, 3, 45, 16);
    var pipe2 = new THREE.Mesh(pipeGeometry2, pipeMaterial);
    pipe2.rotation.z = Math.PI / 2;
    pipe2.position.set(-15, 8, 0);
    pipe2.castShadow = true;
    scene.add(pipe2);
    objects.push(pipe2);

    // 5. Cargo Pipe Manifold #3 - Cylinder
    var pipeGeometry3 = new THREE.CylinderGeometry(3, 3, 42, 16);
    var pipe3 = new THREE.Mesh(pipeGeometry3, pipeMaterial);
    pipe3.rotation.z = Math.PI / 2;
    pipe3.position.set(-15, 11, 30);
    pipe3.castShadow = true;
    scene.add(pipe3);
    objects.push(pipe3);

    // 6. Engine Room Dome - Sphere
    var engineRoomGeometry = new THREE.SphereGeometry(12, 16, 12);
    var engineRoomMaterial = new THREE.MeshPhongMaterial({ color: 0x16a085 });
    var engineRoom = new THREE.Mesh(engineRoomGeometry, engineRoomMaterial);
    engineRoom.position.set(0, -5, 60);
    engineRoom.castShadow = true;
    engineRoom.receiveShadow = true;
    scene.add(engineRoom);
    objects.push(engineRoom);

    // 7. Lifeboat Davit #1 - Cone structure
    var davitGeometry1 = new THREE.ConeGeometry(2, 30, 8);
    var davitMaterial = new THREE.MeshPhongMaterial({ color: 0x95a5a6 });
    var davit1 = new THREE.Mesh(davitGeometry1, davitMaterial);
    davit1.rotation.z = Math.PI / 4;
    davit1.position.set(-35, 25, -50);
    davit1.castShadow = true;
    scene.add(davit1);
    objects.push(davit1);

    // 8. Lifeboat Davit #2 - Cone structure
    var davitGeometry2 = new THREE.ConeGeometry(2, 30, 8);
    var davit2 = new THREE.Mesh(davitGeometry2, davitMaterial);
    davit2.rotation.z = Math.PI / 4;
    davit2.position.set(35, 25, -50);
    davit2.castShadow = true;
    scene.add(davit2);
    objects.push(davit2);

    // 9. Lifeboat - Box hanging from davit
    var lifeBoatGeometry = new THREE.BoxGeometry(8, 5, 12);
    var lifeBoatMaterial = new THREE.MeshPhongMaterial({ color: 0xf39c12 });
    var lifeBoat = new THREE.Mesh(lifeBoatGeometry, lifeBoatMaterial);
    lifeBoat.position.set(-35, 5, -50);
    lifeBoat.castShadow = true;
    scene.add(lifeBoat);
    objects.push(lifeBoat);

    // 10. Anchor Winch - Cylinder
    var winchGeometry = new THREE.CylinderGeometry(6, 6, 15, 16);
    var winchMaterial = new THREE.MeshPhongMaterial({ color: 0x7f8c8d });
    var winch = new THREE.Mesh(winchGeometry, winchMaterial);
    winch.rotation.z = Math.PI / 2;
    winch.position.set(-35, 8, 80);
    winch.castShadow = true;
    scene.add(winch);
    objects.push(winch);

    // 11. Mooring Bollard #1 - Cylinder
    var bollardGeometry = new THREE.CylinderGeometry(2, 2.5, 8, 12);
    var bollardMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var bollard1 = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard1.position.set(-38, 1, -80);
    bollard1.castShadow = true;
    scene.add(bollard1);
    objects.push(bollard1);

    // 12. Mooring Bollard #2 - Cylinder
    var bollard2 = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard2.position.set(38, 1, -80);
    bollard2.castShadow = true;
    scene.add(bollard2);
    objects.push(bollard2);

    // 13. Mooring Bollard #3 - Cylinder
    var bollard3 = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard3.position.set(-38, 1, 80);
    bollard3.castShadow = true;
    scene.add(bollard3);
    objects.push(bollard3);

    // 14. Pirate Grappling Hook on Railing - Cone
    var grappleGeometry = new THREE.ConeGeometry(1.5, 5, 6);
    var grappleMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    var grapple = new THREE.Mesh(grappleGeometry, grappleMaterial);
    grapple.position.set(-38, 22, 0);
    grapple.castShadow = true;
    scene.add(grapple);
    objects.push(grapple);

    // 15. Oil Fire Sphere (ruptured tank)
    var fireGeometry = new THREE.SphereGeometry(8, 12, 12);
    var fireMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b35,
      emissive: 0xff4500,
      emissiveIntensity: 0.5
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(15, 8, 40);
    fire.castShadow = true;
    scene.add(fire);
    objects.push(fire);

    // 16. Coast Guard Helicopter Body - Box
    var heliBodyGeometry = new THREE.BoxGeometry(8, 4, 15);
    var heliMaterial = new THREE.MeshPhongMaterial({ color: 0xe74c3c });
    var heliBody = new THREE.Mesh(heliBodyGeometry, heliMaterial);
    heliBody.position.set(50, 60, 0);
    heliBody.castShadow = true;
    scene.add(heliBody);
    objects.push(heliBody);

    // 17. Helicopter Rotor - Cylinder rotating
    var rotorGeometry = new THREE.CylinderGeometry(15, 15, 0.5, 6);
    var rotorMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(50, 68, 0);
    rotor.castShadow = true;
    scene.add(rotor);
    objects.push(rotor);

    // 18. Zodiac Patrol Boat #1 - Box
    var zodiacGeometry = new THREE.BoxGeometry(8, 3, 12);
    var zodiacMaterial = new THREE.MeshPhongMaterial({ color: 0x2980b9 });
    var zodiac1 = new THREE.Mesh(zodiacGeometry, zodiacMaterial);
    zodiac1.position.set(-50, 1, -40);
    zodiac1.castShadow = true;
    scene.add(zodiac1);
    objects.push(zodiac1);

    // 19. Zodiac Patrol Boat #2 - Box
    var zodiac2 = new THREE.Mesh(zodiacGeometry, zodiacMaterial);
    zodiac2.position.set(50, 1, 40);
    zodiac2.castShadow = true;
    scene.add(zodiac2);
    objects.push(zodiac2);

    // 20. Grappling Rope Line Segments
    var ropePoints = [
      new THREE.Vector3(-38, 22, 0),
      new THREE.Vector3(-45, 15, -5),
      new THREE.Vector3(-50, 8, -10)
    ];
    var ropeGeometry = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x34495e, linewidth: 3 });
    var ropeLine = new THREE.Line(ropeGeometry, ropeMaterial);
    scene.add(ropeLine);
    objects.push(ropeLine);

    animationState.fireSpread = 0;
    animationState.helicopterAngle = 0;
    animationState.zodiacBoatPositions = [0, 0];
    animationState.grapplingRopesAngle = 0;
    animationState.time = 0;

    return objects;
  }

  function update(delta) {
    if (!scene || objects.length === 0) return;

    animationState.time += delta;

    // Animate oil fire spread (pulsing sphere at index 14)
    if (objects[14]) {
      animationState.fireSpread = Math.sin(animationState.time * 2) * 2;
      objects[14].scale.x = 1 + animationState.fireSpread * 0.15;
      objects[14].scale.y = 1 + animationState.fireSpread * 0.15;
      objects[14].scale.z = 1 + animationState.fireSpread * 0.15;
      objects[14].material.emissiveIntensity = 0.3 + Math.sin(animationState.time * 3) * 0.2;
    }

    // Animate helicopter circling (helicopter body at index 15, rotor at index 16)
    if (objects[15] && objects[16]) {
      animationState.helicopterAngle += delta * 0.3;
      var heliRadius = 70;
      var heliX = Math.cos(animationState.helicopterAngle) * heliRadius;
      var heliZ = Math.sin(animationState.helicopterAngle) * heliRadius;
      objects[15].position.set(heliX, 60, heliZ);
      objects[16].position.set(heliX, 68, heliZ);
      objects[16].rotation.y += delta * 20;
    }

    // Animate Zodiac patrol boats patrolling (boats at index 17, 18)
    if (objects[17]) {
      animationState.zodiacBoatPositions[0] += delta * 15;
      objects[17].position.z = -40 + Math.sin(animationState.zodiacBoatPositions[0] * 0.05) * 20;
      if (animationState.zodiacBoatPositions[0] > 200) {
        animationState.zodiacBoatPositions[0] = 0;
      }
    }

    if (objects[18]) {
      animationState.zodiacBoatPositions[1] += delta * 12;
      objects[18].position.z = 40 + Math.cos(animationState.zodiacBoatPositions[1] * 0.04) * 25;
      if (animationState.zodiacBoatPositions[1] > 250) {
        animationState.zodiacBoatPositions[1] = 0;
      }
    }

    // Animate grappling rope swinging
    if (objects[19]) {
      animationState.grapplingRopesAngle = Math.sin(animationState.time * 1.5) * 0.3;
      objects[19].rotation.z = animationState.grapplingRopesAngle;
    }

    // Slight sway of the ship from water movement
    if (objects[0]) {
      objects[0].rotation.z = Math.sin(animationState.time * 0.5) * 0.02;
    }

    // Bridge swaying slightly
    if (objects[1]) {
      objects[1].rotation.z = Math.sin(animationState.time * 0.4) * 0.015;
    }
  }

  function reset() {
    if (scene) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animationState = {
      fireSpread: 0,
      helicopterAngle: 0,
      zodiacBoatPositions: [0, 0],
      grapplingRopesAngle: 0,
      time: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
