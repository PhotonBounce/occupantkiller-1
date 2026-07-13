window.WartimeFactory = (function() {
  'use strict';

  var objects = [];
  var animationState = {};

  function init(scene, camera) {
    // Clear any previous state
    objects = [];
    animationState = {
      conveyorZ: 0,
      craneY: 0,
      rivetPress: 0,
      sparkBurst: 0,
      smokeRise: 0,
      aaGunRotation: 0,
      saboteurBlink: 0
    };

    // Factory hall - large industrial space with brick color
    var hallGeometry = new THREE.BoxGeometry(80, 40, 120);
    var hallMaterial = new THREE.MeshPhongMaterial({ color: 0x666655 });
    var hallMesh = new THREE.Mesh(hallGeometry, hallMaterial);
    hallMesh.position.set(0, 20, 0);
    hallMesh.castShadow = true;
    hallMesh.receiveShadow = true;
    scene.add(hallMesh);
    objects.push(hallMesh);

    // Assembly line conveyor belt - long moving platform
    var conveyorGeometry = new THREE.BoxGeometry(60, 2, 100);
    var conveyorMaterial = new THREE.MeshPhongMaterial({ color: 0x444433 });
    var conveyorMesh = new THREE.Mesh(conveyorGeometry, conveyorMaterial);
    conveyorMesh.position.set(0, 1, 0);
    conveyorMesh.castShadow = true;
    conveyorMesh.receiveShadow = true;
    scene.add(conveyorMesh);
    objects.push(conveyorMesh);

    // Tank parts riding on conveyor - 5 parts
    for (var i = 0; i < 5; i++) {
      var partGeometry = new THREE.BoxGeometry(8, 6, 12);
      var partMaterial = new THREE.MeshPhongMaterial({ color: 0x555544 });
      var partMesh = new THREE.Mesh(partGeometry, partMaterial);
      partMesh.position.set(-20 + i * 25, 4, 0);
      partMesh.castShadow = true;
      partMesh.receiveShadow = true;
      scene.add(partMesh);
      objects.push({ mesh: partMesh, type: 'tankPart', index: i });
    }

    // Industrial crane bridge - overhead girder
    var craneBeamGeometry = new THREE.BoxGeometry(70, 3, 3);
    var craneMaterial = new THREE.MeshPhongMaterial({ color: 0x665544 });
    var craneBeamMesh = new THREE.Mesh(craneBeamGeometry, craneMaterial);
    craneBeamMesh.position.set(0, 35, -20);
    craneBeamMesh.castShadow = true;
    craneBeamMesh.receiveShadow = true;
    scene.add(craneBeamMesh);
    objects.push(craneBeamMesh);

    // Crane hook - hanging cylinder
    var hookGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
    var hookMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var hookMesh = new THREE.Mesh(hookGeometry, hookMaterial);
    hookMesh.position.set(0, 25, -20);
    hookMesh.castShadow = true;
    hookMesh.receiveShadow = true;
    scene.add(hookMesh);
    objects.push({ mesh: hookMesh, type: 'craneHook' });

    // Tank production pit - deep rectangular hole
    var pitGeometry = new THREE.BoxGeometry(35, 12, 25);
    var pitMaterial = new THREE.MeshPhongMaterial({ color: 0x445533 });
    var pitMesh = new THREE.Mesh(pitGeometry, pitMaterial);
    pitMesh.position.set(25, -4, 30);
    pitMesh.castShadow = true;
    pitMesh.receiveShadow = true;
    scene.add(pitMesh);
    objects.push(pitMesh);

    // Half-built tank turret in pit - cylinder
    var turretGeometry = new THREE.CylinderGeometry(6, 6, 4, 16);
    var turretMaterial = new THREE.MeshPhongMaterial({ color: 0x336633 });
    var turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
    turretMesh.position.set(25, 5, 30);
    turretMesh.castShadow = true;
    turretMesh.receiveShadow = true;
    scene.add(turretMesh);
    objects.push(turretMesh);

    // Rivet press machine 1 - heavy press body
    var pressBdyGeometry = new THREE.BoxGeometry(10, 20, 10);
    var pressMaterial = new THREE.MeshPhongMaterial({ color: 0x554433 });
    var pressBdyMesh = new THREE.Mesh(pressBdyGeometry, pressMaterial);
    pressBdyMesh.position.set(-30, 10, 20);
    pressBdyMesh.castShadow = true;
    pressBdyMesh.receiveShadow = true;
    scene.add(pressBdyMesh);
    objects.push(pressBdyMesh);

    // Rivet press ram - pounding cylinder
    var ramGeometry = new THREE.CylinderGeometry(4, 4, 6, 16);
    var ramMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var ramMesh = new THREE.Mesh(ramGeometry, ramMaterial);
    ramMesh.position.set(-30, 18, 20);
    ramMesh.castShadow = true;
    ramMesh.receiveShadow = true;
    scene.add(ramMesh);
    objects.push({ mesh: ramMesh, type: 'rivetPress' });

    // Overhead skylights - glass panels with emissive light
    for (var j = 0; j < 4; j++) {
      var skyGeometry = new THREE.BoxGeometry(12, 0.5, 20);
      var skyMaterial = new THREE.MeshPhongMaterial({
        color: 0x334455,
        emissive: 0x4488FF,
        emissiveIntensity: 0.3
      });
      var skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
      skyMesh.position.set(-30 + j * 25, 38, 0);
      skyMesh.castShadow = true;
      skyMesh.receiveShadow = true;
      scene.add(skyMesh);
      objects.push(skyMesh);
    }

    // Propaganda poster board 1
    var posterGeometry = new THREE.BoxGeometry(8, 12, 1);
    var posterMaterial = new THREE.MeshPhongMaterial({ color: 0x884422 });
    var posterMesh = new THREE.Mesh(posterGeometry, posterMaterial);
    posterMesh.position.set(-35, 15, 55);
    posterMesh.castShadow = true;
    posterMesh.receiveShadow = true;
    scene.add(posterMesh);
    objects.push(posterMesh);

    // Poster text strip - emissive
    var textGeometry = new THREE.BoxGeometry(7, 2, 0.5);
    var textMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFDD00,
      emissive: 0xFFDD00,
      emissiveIntensity: 0.5
    });
    var textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-35, 10, 55.5);
    textMesh.castShadow = true;
    textMesh.receiveShadow = true;
    scene.add(textMesh);
    objects.push(textMesh);

    // Welding station - torch cylinder
    var torchGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 16);
    var torchMaterial = new THREE.MeshPhongMaterial({ color: 0x666644 });
    var torchMesh = new THREE.Mesh(torchGeometry, torchMaterial);
    torchMesh.position.set(20, 5, -40);
    torchMesh.castShadow = true;
    torchMesh.receiveShadow = true;
    scene.add(torchMesh);
    objects.push(torchMesh);

    // Welding sparks - burst of spheres
    for (var k = 0; k < 6; k++) {
      var sparkGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var sparkMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFAA00,
        emissive: 0xFFAA00,
        emissiveIntensity: 0.8
      });
      var sparkMesh = new THREE.Mesh(sparkGeometry, sparkMaterial);
      sparkMesh.position.set(20 + (Math.random() - 0.5) * 4, 8 + Math.random() * 3, -40 + (Math.random() - 0.5) * 4);
      sparkMesh.castShadow = true;
      sparkMesh.receiveShadow = true;
      scene.add(sparkMesh);
      objects.push({ mesh: sparkMesh, type: 'spark', index: k });
    }

    // Ammunition crate stacks - 9 crates in 3x3 arrangement
    for (var cx = 0; cx < 3; cx++) {
      for (var cy = 0; cy < 3; cy++) {
        var crateGeometry = new THREE.BoxGeometry(5, 5, 5);
        var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x554422 });
        var crateMesh = new THREE.Mesh(crateGeometry, crateMaterial);
        crateMesh.position.set(-50 + cx * 7, 2.5 + cy * 5, -50);
        crateMesh.castShadow = true;
        crateMesh.receiveShadow = true;
        scene.add(crateMesh);
        objects.push(crateMesh);
      }
    }

    // Industrial chimney smokestack - cylinder
    var chimneyGeometry = new THREE.CylinderGeometry(3, 3, 30, 16);
    var chimneyMaterial = new THREE.MeshPhongMaterial({ color: 0x555544 });
    var chimneyMesh = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimneyMesh.position.set(40, 15, -60);
    chimneyMesh.castShadow = true;
    chimneyMesh.receiveShadow = true;
    scene.add(chimneyMesh);
    objects.push(chimneyMesh);

    // Smoke top - sphere at chimney top
    var smokeGeometry = new THREE.SphereGeometry(3, 8, 8);
    var smokeMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6
    });
    var smokeMesh = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smokeMesh.position.set(40, 35, -60);
    smokeMesh.castShadow = true;
    smokeMesh.receiveShadow = true;
    scene.add(smokeMesh);
    objects.push({ mesh: smokeMesh, type: 'smoke' });

    // Worker locker room - large box with lockers
    var lockerRoomGeometry = new THREE.BoxGeometry(25, 12, 15);
    var lockerRoomMaterial = new THREE.MeshPhongMaterial({ color: 0x556655 });
    var lockerRoomMesh = new THREE.Mesh(lockerRoomGeometry, lockerRoomMaterial);
    lockerRoomMesh.position.set(-55, 6, 15);
    lockerRoomMesh.castShadow = true;
    lockerRoomMesh.receiveShadow = true;
    scene.add(lockerRoomMesh);
    objects.push(lockerRoomMesh);

    // Individual lockers - small boxes
    for (var l = 0; l < 4; l++) {
      var lockerGeometry = new THREE.BoxGeometry(3, 8, 2);
      var lockerMaterial = new THREE.MeshPhongMaterial({ color: 0x444455 });
      var lockerMesh = new THREE.Mesh(lockerGeometry, lockerMaterial);
      lockerMesh.position.set(-58 + l * 8, 6, 20);
      lockerMesh.castShadow = true;
      lockerMesh.receiveShadow = true;
      scene.add(lockerMesh);
      objects.push(lockerMesh);
    }

    // Anti-aircraft gun base on roof - box
    var aaBaseGeometry = new THREE.BoxGeometry(6, 4, 6);
    var aaBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var aaBaseMesh = new THREE.Mesh(aaBaseGeometry, aaBaseMaterial);
    aaBaseMesh.position.set(45, 38, 50);
    aaBaseMesh.castShadow = true;
    aaBaseMesh.receiveShadow = true;
    scene.add(aaBaseMesh);
    objects.push(aaBaseMesh);

    // AA gun barrel - long cylinder rotates
    var barrelGeometry = new THREE.CylinderGeometry(1, 1, 20, 16);
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.position.set(45, 45, 50);
    barrelMesh.rotation.z = Math.PI / 4;
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    scene.add(barrelMesh);
    objects.push({ mesh: barrelMesh, type: 'aaGun' });

    // Bomb storage vault - heavy metal box
    var vaultGeometry = new THREE.BoxGeometry(15, 10, 15);
    var vaultMaterial = new THREE.MeshPhongMaterial({ color: 0x554433 });
    var vaultMesh = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vaultMesh.position.set(30, 5, -35);
    vaultMesh.castShadow = true;
    vaultMesh.receiveShadow = true;
    scene.add(vaultMesh);
    objects.push(vaultMesh);

    // Bombs inside vault - cylinders
    for (var b = 0; b < 3; b++) {
      var bombGeometry = new THREE.CylinderGeometry(2, 2, 8, 16);
      var bombMaterial = new THREE.MeshPhongMaterial({ color: 0x332211 });
      var bombMesh = new THREE.Mesh(bombGeometry, bombMaterial);
      bombMesh.position.set(22 + b * 7, 5, -35);
      bombMesh.castShadow = true;
      bombMesh.receiveShadow = true;
      scene.add(bombMesh);
      objects.push(bombMesh);
    }

    // Enemy saboteur hiding spot - dark box with red indicator
    var hideoutGeometry = new THREE.BoxGeometry(8, 10, 8);
    var hideoutMaterial = new THREE.MeshPhongMaterial({ color: 0x333344 });
    var hideoutMesh = new THREE.Mesh(hideoutGeometry, hideoutMaterial);
    hideoutMesh.position.set(-45, 5, -45);
    hideoutMesh.castShadow = true;
    hideoutMesh.receiveShadow = true;
    scene.add(hideoutMesh);
    objects.push(hideoutMesh);

    // Saboteur indicator - blinking red sphere
    var indicatorGeometry = new THREE.SphereGeometry(1, 8, 8);
    var indicatorMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.8
    });
    var indicatorMesh = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicatorMesh.position.set(-45, 12, -45);
    indicatorMesh.castShadow = true;
    indicatorMesh.receiveShadow = true;
    scene.add(indicatorMesh);
    objects.push({ mesh: indicatorMesh, type: 'saboteur' });

    // Additional structural element - press machine 2
    var press2BdyGeometry = new THREE.BoxGeometry(10, 18, 10);
    var press2Material = new THREE.MeshPhongMaterial({ color: 0x554433 });
    var press2BdyMesh = new THREE.Mesh(press2BdyGeometry, press2Material);
    press2BdyMesh.position.set(-10, 9, 25);
    press2BdyMesh.castShadow = true;
    press2BdyMesh.receiveShadow = true;
    scene.add(press2BdyMesh);
    objects.push(press2BdyMesh);

    // Second press ram
    var ram2Geometry = new THREE.CylinderGeometry(4, 4, 6, 16);
    var ram2Material = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var ram2Mesh = new THREE.Mesh(ram2Geometry, ram2Material);
    ram2Mesh.position.set(-10, 16, 25);
    ram2Mesh.castShadow = true;
    ram2Mesh.receiveShadow = true;
    scene.add(ram2Mesh);
    objects.push({ mesh: ram2Mesh, type: 'rivetPress', index: 1 });
  }

  function update(delta) {
    // Update animation state
    animationState.conveyorZ = (animationState.conveyorZ || 0) + delta * 2;
    animationState.craneY = (animationState.craneY || 0) + delta * 1.5;
    animationState.rivetPress = (animationState.rivetPress || 0) + delta * 8;
    animationState.sparkBurst = (animationState.sparkBurst || 0) + delta * 3;
    animationState.smokeRise = (animationState.smokeRise || 0) + delta * 0.5;
    animationState.aaGunRotation = (animationState.aaGunRotation || 0) + delta * 1;
    animationState.saboteurBlink = (animationState.saboteurBlink || 0) + delta * 3;

    // Animate all objects
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      if (typeof obj === 'object' && obj.mesh) {
        var mesh = obj.mesh;
        var type = obj.type;

        // Tank parts on conveyor - oscillate position along Z
        if (type === 'tankPart') {
          mesh.position.z = Math.sin(animationState.conveyorZ + obj.index) * 8;
        }

        // Crane hook - swing and lower
        if (type === 'craneHook') {
          mesh.position.y = 25 + Math.sin(animationState.craneY) * 3;
          mesh.position.x = Math.cos(animationState.craneY * 0.7) * 5;
        }

        // Rivet press rams - pound rapidly
        if (type === 'rivetPress') {
          var pressOffset = Math.abs(Math.sin(animationState.rivetPress + obj.index * 0.5)) * 4;
          mesh.position.y = (obj.index === 0 ? 18 : 16) - pressOffset;
        }

        // Welding sparks - burst animation
        if (type === 'spark') {
          var sparkBase = obj.index === 0 ? 0 : 1;
          mesh.position.x = 20 + (Math.sin(animationState.sparkBurst + obj.index) * 3);
          mesh.position.y = 8 + Math.sin(animationState.sparkBurst + obj.index * 0.3) * 2;
          mesh.position.z = -40 + (Math.cos(animationState.sparkBurst + obj.index) * 2);
          mesh.material.emissiveIntensity = 0.5 + Math.sin(animationState.sparkBurst * 3) * 0.3;
        }

        // Smoke - rises upward
        if (type === 'smoke') {
          mesh.position.y = 35 + Math.sin(animationState.smokeRise) * 2;
          mesh.position.z = -60 + Math.sin(animationState.smokeRise * 0.5) * 1;
        }

        // AA gun - rotates tracking
        if (type === 'aaGun') {
          mesh.rotation.y = Math.sin(animationState.aaGunRotation * 0.5) * Math.PI / 3;
        }

        // Saboteur indicator - blinks
        if (type === 'saboteur') {
          var blinkIntensity = Math.max(0.3, Math.sin(animationState.saboteurBlink * 2) * 0.5 + 0.5);
          mesh.material.emissiveIntensity = blinkIntensity;
        }
      }
    }
  }

  function reset() {
    // Remove all objects from scene
    for (var i = objects.length - 1; i >= 0; i--) {
      var obj = objects[i];
      if (typeof obj === 'object' && obj.mesh) {
        obj.mesh.geometry.dispose();
        obj.mesh.material.dispose();
      } else if (obj.geometry && obj.material) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    }
    objects = [];
    animationState = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
