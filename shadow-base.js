window.ShadowBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var animations = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animations = [];

    buildBaseStructure();
    buildFloodlights();
    buildHelicopterPads();
    buildServerFarms();
    buildSoldierDecoys();
    buildCliffPanels();
    buildSatelliteArray();
    buildVaultAndLabs();
    buildDetailingElements();
  }

  function buildBaseStructure() {
    var materialBlack = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var materialDarkGrey = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    var baseGeometry = new THREE.BoxGeometry(120, 60, 80);
    var baseMesh = new THREE.Mesh(baseGeometry, materialBlack);
    baseMesh.position.set(0, 25, 0);
    baseMesh.castShadow = true;
    scene.add(baseMesh);
    objects.push(baseMesh);

    var roofGeometry = new THREE.BoxGeometry(130, 8, 90);
    var roofMesh = new THREE.Mesh(roofGeometry, materialDarkGrey);
    roofMesh.position.set(0, 86, 0);
    roofMesh.castShadow = true;
    scene.add(roofMesh);
    objects.push(roofMesh);

    var wallLeftGeometry = new THREE.BoxGeometry(8, 60, 80);
    var wallLeft = new THREE.Mesh(wallLeftGeometry, materialBlack);
    wallLeft.position.set(-56, 25, 0);
    wallLeft.castShadow = true;
    scene.add(wallLeft);
    objects.push(wallLeft);

    var wallRightGeometry = new THREE.BoxGeometry(8, 60, 80);
    var wallRight = new THREE.Mesh(wallRightGeometry, materialBlack);
    wallRight.position.set(56, 25, 0);
    wallRight.castShadow = true;
    scene.add(wallRight);
    objects.push(wallRight);

    var wallBackGeometry = new THREE.BoxGeometry(120, 60, 8);
    var wallBack = new THREE.Mesh(wallBackGeometry, materialDarkGrey);
    wallBack.position.set(0, 25, 36);
    wallBack.castShadow = true;
    scene.add(wallBack);
    objects.push(wallBack);

    var foundationGeometry = new THREE.BoxGeometry(140, 4, 100);
    var foundation = new THREE.Mesh(foundationGeometry, materialBlack);
    foundation.position.set(0, 2, 0);
    foundation.receiveShadow = true;
    scene.add(foundation);
    objects.push(foundation);
  }

  function buildFloodlights() {
    var supportGeometry = new THREE.CylinderGeometry(1.5, 2, 40, 8);
    var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });

    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i;
      var x = Math.cos(angle) * 70;
      var z = Math.sin(angle) * 70;

      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(x, 20, z);
      support.castShadow = true;
      scene.add(support);
      objects.push(support);

      var headGeometry = new THREE.BoxGeometry(4, 6, 8);
      var headMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(x, 65, z);
      head.rotation.x = Math.PI / 6;
      head.castShadow = true;
      scene.add(head);
      objects.push(head);

      var lightGeometry = new THREE.SphereGeometry(2, 8, 8);
      var lightMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      lightMesh.position.set(x, 72, z);
      lightMesh.castShadow = true;
      scene.add(lightMesh);
      objects.push(lightMesh);

      var floodlight = new THREE.Light();
      floodlight.position.set(x, 72, z);
      floodlight.intensity = 0.6;
      floodlight.userData.baseAngle = angle;
      floodlight.userData.type = 'floodlight';
      lights.push(floodlight);
      animations.push(floodlight);
    }
  }

  function buildHelicopterPads() {
    var padGeometry = new THREE.CylinderGeometry(25, 25, 1, 32);
    var padMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });

    var pad1 = new THREE.Mesh(padGeometry, padMaterial);
    pad1.position.set(-50, 88, 20);
    pad1.receiveShadow = true;
    scene.add(pad1);
    objects.push(pad1);

    var pad2 = new THREE.Mesh(padGeometry, padMaterial);
    pad2.position.set(50, 88, 20);
    pad2.receiveShadow = true;
    scene.add(pad2);
    objects.push(pad2);

    buildHelicopter(-50, 105, 20);
    buildHelicopter(50, 105, 20);
  }

  function buildHelicopter(posX, posY, posZ) {
    var fuselageGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 12);
    var helicopterMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var fuselage = new THREE.Mesh(fuselageGeometry, helicopterMaterial);
    fuselage.position.set(posX, posY, posZ);
    fuselage.castShadow = true;
    scene.add(fuselage);
    objects.push(fuselage);

    var rotorGeometry = new THREE.CylinderGeometry(12, 12, 0.5, 32);
    var rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(posX, posY + 8, posZ);
    rotor.castShadow = true;
    scene.add(rotor);
    objects.push(rotor);
    rotor.userData.type = 'rotor';
    animations.push(rotor);

    var tailBoomGeometry = new THREE.BoxGeometry(1, 1, 12);
    var boom = new THREE.Mesh(tailBoomGeometry, helicopterMaterial);
    boom.position.set(posX, posY - 2, posZ - 10);
    boom.castShadow = true;
    scene.add(boom);
    objects.push(boom);

    var tailRotorGeometry = new THREE.CylinderGeometry(5, 5, 0.3, 16);
    var tailRotor = new THREE.Mesh(tailRotorGeometry, rotorMaterial);
    tailRotor.position.set(posX, posY, posZ - 22);
    tailRotor.rotation.z = Math.PI / 2;
    tailRotor.castShadow = true;
    scene.add(tailRotor);
    objects.push(tailRotor);
    tailRotor.userData.type = 'tailrotor';
    animations.push(tailRotor);

    var skidGeometry = new THREE.CylinderGeometry(0.4, 0.4, 20, 8);
    var skid1 = new THREE.Mesh(skidGeometry, helicopterMaterial);
    skid1.position.set(posX - 4, posY - 6, posZ);
    skid1.rotation.z = Math.PI / 12;
    skid1.castShadow = true;
    scene.add(skid1);
    objects.push(skid1);

    var skid2 = new THREE.Mesh(skidGeometry, helicopterMaterial);
    skid2.position.set(posX + 4, posY - 6, posZ);
    skid2.rotation.z = -Math.PI / 12;
    skid2.castShadow = true;
    scene.add(skid2);
    objects.push(skid2);
  }

  function buildServerFarms() {
    var rackGeometry = new THREE.BoxGeometry(3, 20, 3);
    var rackMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });

    for (var i = 0; i < 12; i++) {
      var x = -40 + (i % 4) * 15;
      var z = 0 + Math.floor(i / 4) * 12;

      var rack = new THREE.Mesh(rackGeometry, rackMaterial);
      rack.position.set(x, 15, z - 20);
      rack.castShadow = true;
      scene.add(rack);
      objects.push(rack);

      for (var j = 0; j < 8; j++) {
        var ledGeometry = new THREE.BoxGeometry(2, 0.5, 2);
        var ledMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.set(x + 1, 5 + j * 2, z - 20);
        led.userData.type = 'led';
        led.userData.rackIndex = i;
        scene.add(led);
        objects.push(led);
        animations.push(led);
      }
    }

    var mainConsoleGeometry = new THREE.BoxGeometry(20, 4, 6);
    var consoleMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var console = new THREE.Mesh(mainConsoleGeometry, consoleMaterial);
    console.position.set(0, 2, -35);
    console.castShadow = true;
    scene.add(console);
    objects.push(console);

    var screenGeometry = new THREE.BoxGeometry(16, 3, 0.2);
    var screenMaterial = new THREE.MeshLambertMaterial({ color: 0x001a00 });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 4, -33);
    scene.add(screen);
    objects.push(screen);
  }

  function buildSoldierDecoys() {
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i;
      var x = Math.cos(angle) * 45;
      var z = Math.sin(angle) * 45;

      var headGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      var headMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(x, 28, z);
      head.castShadow = true;
      scene.add(head);
      objects.push(head);

      var torsoGeometry = new THREE.BoxGeometry(2, 6, 2.5);
      var torsoMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
      var torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
      torso.position.set(x, 21, z);
      torso.castShadow = true;
      scene.add(torso);
      objects.push(torso);

      var leftArmGeometry = new THREE.CylinderGeometry(0.6, 0.6, 5, 8);
      var armMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
      var leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
      leftArm.position.set(x - 2, 20, z);
      leftArm.rotation.z = Math.PI / 4;
      leftArm.castShadow = true;
      scene.add(leftArm);
      objects.push(leftArm);

      var rightArm = new THREE.Mesh(leftArmGeometry, armMaterial);
      rightArm.position.set(x + 2, 20, z);
      rightArm.rotation.z = -Math.PI / 4;
      rightArm.castShadow = true;
      scene.add(rightArm);
      objects.push(rightArm);

      var leftLegGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
      var legMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
      var leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
      leftLeg.position.set(x - 0.8, 15, z);
      leftLeg.castShadow = true;
      scene.add(leftLeg);
      objects.push(leftLeg);

      var rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
      rightLeg.position.set(x + 0.8, 15, z);
      rightLeg.castShadow = true;
      scene.add(rightLeg);
      objects.push(rightLeg);
    }
  }

  function buildCliffPanels() {
    var panelGeometry = new THREE.BoxGeometry(35, 50, 2);
    var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    for (var i = 0; i < 4; i++) {
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(-45 + i * 30, 30, 40);
      panel.castShadow = true;
      scene.add(panel);
      objects.push(panel);
      panel.userData.type = 'panel';
    }

    var doorFrameGeometry = new THREE.BoxGeometry(12, 35, 1);
    var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
    var doorFrame = new THREE.Mesh(doorFrameGeometry, frameMaterial);
    doorFrame.position.set(0, 28, 40.5);
    doorFrame.castShadow = true;
    scene.add(doorFrame);
    objects.push(doorFrame);

    var doorGeometry = new THREE.BoxGeometry(10, 33, 0.8);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x050505 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 28, 41);
    door.castShadow = true;
    scene.add(door);
    objects.push(door);

    var handleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var handleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(4, 28, 41.5);
    scene.add(handle);
    objects.push(handle);
  }

  function buildSatelliteArray() {
    var baseGeometry = new THREE.CylinderGeometry(8, 10, 2, 16);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-60, 88, -40);
    base.castShadow = true;
    scene.add(base);
    objects.push(base);

    var poleGeometry = new THREE.CylinderGeometry(1, 1.5, 30, 8);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(-60, 103, -40);
    pole.castShadow = true;
    scene.add(pole);
    objects.push(pole);

    for (var i = 0; i < 3; i++) {
      var dishGeometry = new THREE.CylinderGeometry(6, 6, 0.5, 32);
      var dishMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var dish = new THREE.Mesh(dishGeometry, dishMaterial);
      dish.position.set(-60 + i * 12, 120 - i * 4, -40);
      dish.rotation.x = Math.PI / 6 + i * 0.3;
      dish.castShadow = true;
      scene.add(dish);
      objects.push(dish);
    }

    var feedGeometry = new THREE.ConeGeometry(1.5, 6, 8);
    var feedMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var feed = new THREE.Mesh(feedGeometry, feedMaterial);
    feed.position.set(-60, 108, -40);
    feed.castShadow = true;
    scene.add(feed);
    objects.push(feed);
  }

  function buildVaultAndLabs() {
    var vaultGeometry = new THREE.CylinderGeometry(8, 8, 15, 16);
    var vaultMaterial = new THREE.MeshLambertMaterial({ color: 0x050505 });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(35, 35, -50);
    vault.castShadow = true;
    scene.add(vault);
    objects.push(vault);

    var doorGeometry = new THREE.CylinderGeometry(7.5, 7.5, 0.8, 16);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var vaultDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    vaultDoor.position.set(35, 35, -57.5);
    vaultDoor.castShadow = true;
    scene.add(vaultDoor);
    objects.push(vaultDoor);
    vaultDoor.userData.type = 'vaultdoor';

    var wheelGeometry = new THREE.CylinderGeometry(2, 2, 0.4, 16);
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(35, 35, -57.5);
    wheel.rotation.y = Math.PI / 4;
    scene.add(wheel);
    objects.push(wheel);

    var shaftGeometry = new THREE.CylinderGeometry(4, 4, 50, 12);
    var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(35, 0, -50);
    shaft.castShadow = true;
    scene.add(shaft);
    objects.push(shaft);

    var labDoorGeometry = new THREE.BoxGeometry(6, 8, 0.5);
    var labDoorMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
    var labDoor = new THREE.Mesh(labDoorGeometry, labDoorMaterial);
    labDoor.position.set(35, 15, -42);
    labDoor.castShadow = true;
    scene.add(labDoor);
    objects.push(labDoor);

    for (var i = 0; i < 4; i++) {
      var portGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 8);
      var portMaterial = new THREE.MeshLambertMaterial({ color: 0x001a00 });
      var port = new THREE.Mesh(portGeometry, portMaterial);
      port.position.set(35 + 3 - i * 2, 20 + i * 4, -41.8);
      scene.add(port);
      objects.push(port);
    }
  }

  function buildDetailingElements() {
    var ventGeometry = new THREE.BoxGeometry(4, 2, 2);
    var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });

    for (var i = 0; i < 8; i++) {
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(-50 + i * 15, 80, -38);
      vent.castShadow = true;
      scene.add(vent);
      objects.push(vent);
    }

    var catwalkGeometry = new THREE.BoxGeometry(80, 1, 4);
    var catwalkMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var catwalk = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk.position.set(0, 45, 0);
    catwalk.receiveShadow = true;
    scene.add(catwalk);
    objects.push(catwalk);

    var railGeometry = new THREE.CylinderGeometry(0.3, 0.3, 80, 6);
    var railMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var railLeft = new THREE.Mesh(railGeometry, railMaterial);
    railLeft.position.set(-40, 47, 0);
    railLeft.rotation.z = Math.PI / 2;
    railLeft.castShadow = true;
    scene.add(railLeft);
    objects.push(railLeft);

    var railRight = new THREE.Mesh(railGeometry, railMaterial);
    railRight.position.set(40, 47, 0);
    railRight.rotation.z = Math.PI / 2;
    railRight.castShadow = true;
    scene.add(railRight);
    objects.push(railRight);

    var pipeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 100, 8);
    var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
    var pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe1.position.set(50, 70, 0);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.castShadow = true;
    scene.add(pipe1);
    objects.push(pipe1);

    var pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe2.position.set(-50, 70, 0);
    pipe2.rotation.z = Math.PI / 2;
    pipe2.castShadow = true;
    scene.add(pipe2);
    objects.push(pipe2);

    var crateGeometry = new THREE.BoxGeometry(8, 8, 8);
    var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    for (var i = 0; i < 5; i++) {
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(-40 + i * 20, 50, -30);
      crate.castShadow = true;
      scene.add(crate);
      objects.push(crate);
    }

    var beaconGeometry = new THREE.SphereGeometry(1, 8, 8);
    var beaconMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.set(60, 90, 30);
    beacon.userData.type = 'beacon';
    scene.add(beacon);
    objects.push(beacon);
    animations.push(beacon);

    var scannerGeometry = new THREE.CylinderGeometry(3, 3, 2, 16);
    var scannerMaterial = new THREE.MeshLambertMaterial({ color: 0x001a00 });
    var scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
    scanner.position.set(-60, 50, 30);
    scanner.castShadow = true;
    scene.add(scanner);
    objects.push(scanner);
    scanner.userData.type = 'scanner';
    animations.push(scanner);

    var antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 4);
    var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(70, 100, -20);
    antenna.castShadow = true;
    scene.add(antenna);
    objects.push(antenna);
  }

  function update(delta) {
    var i;

    for (i = 0; i < animations.length; i++) {
      var obj = animations[i];

      if (obj.userData.type === 'rotor') {
        obj.rotation.x += delta * 8;
      }

      if (obj.userData.type === 'tailrotor') {
        obj.rotation.y += delta * 15;
      }

      if (obj.userData.type === 'led') {
        var intensity = (Math.sin(Date.now() * 0.002 + obj.userData.rackIndex) + 1) / 2;
        obj.material.color.setHex(Math.floor(intensity * 255) > 128 ? 0xff0000 : 0x660000);
      }

      if (obj.userData.type === 'beacon') {
        obj.scale.x = 1 + Math.sin(Date.now() * 0.004) * 0.3;
        obj.scale.y = obj.scale.x;
        obj.scale.z = obj.scale.x;
      }

      if (obj.userData.type === 'scanner') {
        obj.rotation.y += delta * 3;
      }

      if (obj.userData.baseAngle !== undefined) {
        var baseAngle = obj.userData.baseAngle;
        var time = Date.now() * 0.001;
        var sweepAngle = Math.sin(time) * Math.PI / 3;
        var finalAngle = baseAngle + sweepAngle;
        obj.position.x = Math.cos(finalAngle) * 70;
        obj.position.z = Math.sin(finalAngle) * 70;
      }
    }
  }

  function reset() {
    var i;

    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }

    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }

    objects = [];
    lights = [];
    animations = [];
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
