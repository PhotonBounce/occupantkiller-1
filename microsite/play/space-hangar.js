window.SpaceHangar = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var time = 0;

  // Object references for animation
  var objects = {
    fighterEngines: [],
    fuelLoadingArms: [],
    forceFieldDoor: null,
    antiGravitySphere: null,
    repairDrones: [],
    launchSled: null
  };

  function init(scene_ref, camera_ref) {
    scene = scene_ref;
    camera = camera_ref;
    time = 0;

    // Hangar bay structure - large dark metal box
    var hangarGeometry = new THREE.BoxGeometry(400, 250, 600);
    var hangarMaterial = new THREE.MeshPhongMaterial({ color: 0x333344 });
    var hangarBay = new THREE.Mesh(hangarGeometry, hangarMaterial);
    hangarBay.position.set(0, 0, 0);
    hangarBay.receiveShadow = true;
    hangarBay.castShadow = true;
    scene.add(hangarBay);

    // Fighter spacecraft 1
    var fighter1Body = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 30),
      new THREE.MeshPhongMaterial({ color: 0x445566 })
    );
    fighter1Body.position.set(-80, 40, -150);
    fighter1Body.castShadow = true;
    scene.add(fighter1Body);

    var fighter1Engine1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 15, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF6644, emissive: 0xFF3300 })
    );
    fighter1Engine1.position.set(-90, 35, -150);
    fighter1Engine1.rotation.z = Math.PI / 2;
    fighter1Engine1.castShadow = true;
    scene.add(fighter1Engine1);

    var fighter1Engine2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 15, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF6644, emissive: 0xFF3300 })
    );
    fighter1Engine2.position.set(-70, 35, -150);
    fighter1Engine2.rotation.z = Math.PI / 2;
    fighter1Engine2.castShadow = true;
    scene.add(fighter1Engine2);

    objects.fighterEngines.push(fighter1Engine1);
    objects.fighterEngines.push(fighter1Engine2);

    // Fighter spacecraft 2
    var fighter2Body = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 30),
      new THREE.MeshPhongMaterial({ color: 0x445566 })
    );
    fighter2Body.position.set(0, 40, -150);
    fighter2Body.castShadow = true;
    scene.add(fighter2Body);

    var fighter2Engine1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 15, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF6644, emissive: 0xFF3300 })
    );
    fighter2Engine1.position.set(-10, 35, -150);
    fighter2Engine1.rotation.z = Math.PI / 2;
    fighter2Engine1.castShadow = true;
    scene.add(fighter2Engine1);

    var fighter2Engine2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 15, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF6644, emissive: 0xFF3300 })
    );
    fighter2Engine2.position.set(10, 35, -150);
    fighter2Engine2.rotation.z = Math.PI / 2;
    fighter2Engine2.castShadow = true;
    scene.add(fighter2Engine2);

    objects.fighterEngines.push(fighter2Engine1);
    objects.fighterEngines.push(fighter2Engine2);

    // Fighter spacecraft 3
    var fighter3Body = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 30),
      new THREE.MeshPhongMaterial({ color: 0x445566 })
    );
    fighter3Body.position.set(80, 40, -150);
    fighter3Body.castShadow = true;
    scene.add(fighter3Body);

    var fighter3Engine1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 15, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF6644, emissive: 0xFF3300 })
    );
    fighter3Engine1.position.set(70, 35, -150);
    fighter3Engine1.rotation.z = Math.PI / 2;
    fighter3Engine1.castShadow = true;
    scene.add(fighter3Engine1);

    var fighter3Engine2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 15, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF6644, emissive: 0xFF3300 })
    );
    fighter3Engine2.position.set(90, 35, -150);
    fighter3Engine2.rotation.z = Math.PI / 2;
    fighter3Engine2.castShadow = true;
    scene.add(fighter3Engine2);

    objects.fighterEngines.push(fighter3Engine1);
    objects.fighterEngines.push(fighter3Engine2);

    // Fuel loading arm 1 - articulated cylinder
    var fuelArm1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 40, 16),
      new THREE.MeshPhongMaterial({ color: 0x666644 })
    );
    fuelArm1.position.set(-80, 60, -100);
    fuelArm1.rotation.z = 0.3;
    fuelArm1.castShadow = true;
    scene.add(fuelArm1);
    objects.fuelLoadingArms.push(fuelArm1);

    // Fuel loading arm 2
    var fuelArm2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 40, 16),
      new THREE.MeshPhongMaterial({ color: 0x666644 })
    );
    fuelArm2.position.set(0, 60, -100);
    fuelArm2.rotation.z = -0.2;
    fuelArm2.castShadow = true;
    scene.add(fuelArm2);
    objects.fuelLoadingArms.push(fuelArm2);

    // Fuel loading arm 3
    var fuelArm3 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 40, 16),
      new THREE.MeshPhongMaterial({ color: 0x666644 })
    );
    fuelArm3.position.set(80, 60, -100);
    fuelArm3.rotation.z = 0.25;
    fuelArm3.castShadow = true;
    scene.add(fuelArm3);
    objects.fuelLoadingArms.push(fuelArm3);

    // Launch catapult track - line segments for rails
    var trackGeometry = new THREE.BufferGeometry();
    var trackPositions = new Float32Array([
      -100, 20, 200, 100, 20, 200,
      -100, 20, 250, 100, 20, 250,
      -100, 20, 200, -100, 20, 250,
      100, 20, 200, 100, 20, 250
    ]);
    trackGeometry.setAttribute('position', new THREE.BufferAttribute(trackPositions, 3));
    var trackLine = new THREE.LineSegments(
      trackGeometry,
      new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 3 })
    );
    scene.add(trackLine);

    // Launch catapult sled
    var sledGeometry = new THREE.BoxGeometry(150, 8, 12);
    var sledMaterial = new THREE.MeshPhongMaterial({ color: 0x777755 });
    var launchSled = new THREE.Mesh(sledGeometry, sledMaterial);
    launchSled.position.set(0, 20, 220);
    launchSled.castShadow = true;
    scene.add(launchSled);
    objects.launchSled = launchSled;

    // Orbital docking clamps 1
    var clamp1 = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 8, 16),
      new THREE.MeshPhongMaterial({ color: 0x556655 })
    );
    clamp1.position.set(-120, 80, 100);
    clamp1.castShadow = true;
    scene.add(clamp1);

    // Orbital docking clamps 2
    var clamp2 = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 8, 16),
      new THREE.MeshPhongMaterial({ color: 0x556655 })
    );
    clamp2.position.set(0, 80, 100);
    clamp2.castShadow = true;
    scene.add(clamp2);

    // Orbital docking clamps 3
    var clamp3 = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 8, 16),
      new THREE.MeshPhongMaterial({ color: 0x556655 })
    );
    clamp3.position.set(120, 80, 100);
    clamp3.castShadow = true;
    scene.add(clamp3);

    // Maintenance catwalk - elevated platform
    var catwalkGeometry = new THREE.BoxGeometry(300, 4, 40);
    var catwalkMaterial = new THREE.MeshPhongMaterial({ color: 0x555544 });
    var catwalk = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk.position.set(0, 120, -200);
    catwalk.castShadow = true;
    scene.add(catwalk);

    // Catwalk railings - line segments
    var railingGeometry = new THREE.BufferGeometry();
    var railingPositions = new Float32Array([
      -150, 125, -180, 150, 125, -180,
      -150, 125, -220, 150, 125, -220,
      -150, 125, -180, -150, 125, -220,
      150, 125, -180, 150, 125, -220
    ]);
    railingGeometry.setAttribute('position', new THREE.BufferAttribute(railingPositions, 3));
    var railingLine = new THREE.LineSegments(
      railingGeometry,
      new THREE.LineBasicMaterial({ color: 0x666655, linewidth: 2 })
    );
    scene.add(railingLine);

    // Anti-gravity generator - pulsing sphere
    var agGeometry = new THREE.SphereGeometry(15, 32, 32);
    var agMaterial = new THREE.MeshPhongMaterial({
      color: 0x0055FF,
      emissive: 0x0033CC,
      wireframe: false
    });
    var antiGravitySphere = new THREE.Mesh(agGeometry, agMaterial);
    antiGravitySphere.position.set(0, 60, 0);
    antiGravitySphere.castShadow = true;
    scene.add(antiGravitySphere);
    objects.antiGravitySphere = antiGravitySphere;

    // Weapons loading bay
    var weaponsBayGeometry = new THREE.BoxGeometry(80, 60, 50);
    var weaponsBayMaterial = new THREE.MeshPhongMaterial({ color: 0x445544 });
    var weaponsBay = new THREE.Mesh(weaponsBayGeometry, weaponsBayMaterial);
    weaponsBay.position.set(-160, 40, 0);
    weaponsBay.castShadow = true;
    scene.add(weaponsBay);

    // Missiles in weapons bay
    var missile1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 25, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF4455 })
    );
    missile1.position.set(-160, 50, -10);
    missile1.castShadow = true;
    scene.add(missile1);

    var missile2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 25, 16),
      new THREE.MeshPhongMaterial({ color: 0xFF4455 })
    );
    missile2.position.set(-160, 50, 10);
    missile2.castShadow = true;
    scene.add(missile2);

    // Force field bay door - shimmering emissive box
    var doorGeometry = new THREE.BoxGeometry(100, 120, 2);
    var doorMaterial = new THREE.MeshPhongMaterial({
      color: 0x0044AA,
      emissive: 0x0066FF,
      transparent: true,
      opacity: 0.7
    });
    var forceFieldDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    forceFieldDoor.position.set(160, 60, 0);
    forceFieldDoor.castShadow = true;
    scene.add(forceFieldDoor);
    objects.forceFieldDoor = forceFieldDoor;

    // Crew ready room
    var crewRoomGeometry = new THREE.BoxGeometry(70, 50, 60);
    var crewRoomMaterial = new THREE.MeshPhongMaterial({ color: 0x334455 });
    var crewRoom = new THREE.Mesh(crewRoomGeometry, crewRoomMaterial);
    crewRoom.position.set(-160, 100, 150);
    crewRoom.castShadow = true;
    scene.add(crewRoom);

    // Emissive screens in crew room
    var screen1 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 15, 2),
      new THREE.MeshPhongMaterial({
        color: 0x00AAFF,
        emissive: 0x0088FF
      })
    );
    screen1.position.set(-160, 105, 188);
    scene.add(screen1);

    var screen2 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 15, 2),
      new THREE.MeshPhongMaterial({
        color: 0x00AAFF,
        emissive: 0x0088FF
      })
    );
    screen2.position.set(-140, 105, 188);
    scene.add(screen2);

    // Repair drones - orbiting spheres
    var droneGeometry = new THREE.SphereGeometry(3, 16, 16);
    var droneMaterial = new THREE.MeshPhongMaterial({ color: 0x555566 });

    var drone1 = new THREE.Mesh(droneGeometry, droneMaterial);
    drone1.position.set(-80, 60, -150);
    drone1.castShadow = true;
    scene.add(drone1);
    objects.repairDrones.push(drone1);

    var drone2 = new THREE.Mesh(droneGeometry, droneMaterial);
    drone2.position.set(0, 60, -150);
    drone2.castShadow = true;
    scene.add(drone2);
    objects.repairDrones.push(drone2);

    var drone3 = new THREE.Mesh(droneGeometry, droneMaterial);
    drone3.position.set(80, 60, -150);
    drone3.castShadow = true;
    scene.add(drone3);
    objects.repairDrones.push(drone3);

    // Emergency evacuation pods
    var pod1 = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0x334455 })
    );
    pod1.position.set(180, 30, -100);
    pod1.castShadow = true;
    scene.add(pod1);

    var pod2 = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0x334455 })
    );
    pod2.position.set(180, 30, 0);
    pod2.castShadow = true;
    scene.add(pod2);

    var pod3 = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0x334455 })
    );
    pod3.position.set(180, 30, 100);
    pod3.castShadow = true;
    scene.add(pod3);

    // Power conduit grid - glowing line segments
    var conduitGeometry = new THREE.BufferGeometry();
    var conduitPositions = new Float32Array([
      -150, 10, -150, 150, 10, -150,
      -150, 10, 150, 150, 10, 150,
      -150, 10, -150, -150, 10, 150,
      150, 10, -150, 150, 10, 150,
      -150, 50, -150, 150, 50, -150,
      -150, 50, 150, 150, 50, 150,
      -150, 50, -150, -150, 50, 150,
      150, 50, -150, 150, 50, 150
    ]);
    conduitGeometry.setAttribute('position', new THREE.BufferAttribute(conduitPositions, 3));
    var conduitLine = new THREE.LineSegments(
      conduitGeometry,
      new THREE.LineBasicMaterial({ color: 0x0088FF, linewidth: 2 })
    );
    scene.add(conduitLine);

    // Command balcony - elevated platform overlooking hangar
    var balconyGeometry = new THREE.BoxGeometry(120, 8, 40);
    var balconyMaterial = new THREE.MeshPhongMaterial({ color: 0x334455 });
    var commandBalcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
    commandBalcony.position.set(0, 130, 250);
    commandBalcony.castShadow = true;
    scene.add(commandBalcony);

    // Balcony railings
    var balconyRailingGeometry = new THREE.BufferGeometry();
    var balconyRailingPositions = new Float32Array([
      -60, 135, 250, 60, 135, 250,
      -60, 135, 270, 60, 135, 270
    ]);
    balconyRailingGeometry.setAttribute('position', new THREE.BufferAttribute(balconyRailingPositions, 3));
    var balconyRailingLine = new THREE.LineSegments(
      balconyRailingGeometry,
      new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 })
    );
    scene.add(balconyRailingLine);
  }

  function update(delta) {
    time += delta;

    // Fighter engine pods glow - emissive intensity oscillates
    var engineGlow = 0.5 + 0.5 * Math.sin(time * 3);
    for (var i = 0; i < objects.fighterEngines.length; i++) {
      objects.fighterEngines[i].material.emissiveIntensity = engineGlow;
    }

    // Fuel loading arms extend/retract - rotation oscillates
    var armRotation = 0.3 + 0.2 * Math.sin(time * 1.5);
    for (var j = 0; j < objects.fuelLoadingArms.length; j++) {
      if (j === 0) {
        objects.fuelLoadingArms[j].rotation.z = armRotation;
      } else if (j === 1) {
        objects.fuelLoadingArms[j].rotation.z = -armRotation;
      } else {
        objects.fuelLoadingArms[j].rotation.z = armRotation;
      }
    }

    // Force field bay door shimmers - emissive intensity
    if (objects.forceFieldDoor) {
      var doorGlow = 0.3 + 0.4 * Math.sin(time * 2);
      objects.forceFieldDoor.material.emissiveIntensity = doorGlow;
    }

    // Anti-gravity sphere pulses - emissive + scale
    if (objects.antiGravitySphere) {
      var pulseFactor = 1 + 0.3 * Math.sin(time * 2.5);
      objects.antiGravitySphere.scale.set(pulseFactor, pulseFactor, pulseFactor);
      var agGlow = 0.4 + 0.6 * Math.sin(time * 2.5);
      objects.antiGravitySphere.material.emissiveIntensity = agGlow;
    }

    // Repair drones orbit - position.x/z circular
    for (var k = 0; k < objects.repairDrones.length; k++) {
      var drone = objects.repairDrones[k];
      var baseX = drone.position.x;
      var baseZ = drone.position.z;
      var orbitRadius = 20;
      var orbitSpeed = 1.5 + k * 0.3;

      var angle = time * orbitSpeed + (k * 2 * Math.PI / objects.repairDrones.length);
      drone.position.x = baseX + orbitRadius * Math.cos(angle);
      drone.position.z = baseZ + orbitRadius * Math.sin(angle);
    }

    // Launch sled slides on track - position.x oscillates
    if (objects.launchSled) {
      var sledPosition = 60 * Math.sin(time * 0.8);
      objects.launchSled.position.x = sledPosition;
    }
  }

  function reset() {
    if (scene) {
      var objectsToRemove = [];
      scene.traverse(function(child) {
        if (child !== scene) {
          objectsToRemove.push(child);
        }
      });

      for (var i = objectsToRemove.length - 1; i >= 0; i--) {
        scene.remove(objectsToRemove[i]);
      }
    }

    objects.fighterEngines = [];
    objects.fuelLoadingArms = [];
    objects.forceFieldDoor = null;
    objects.antiGravitySphere = null;
    objects.repairDrones = [];
    objects.launchSled = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
