window.HauntedHotel = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var clock = null;

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedObjects = [];
    clock = { elapsedTime: 0 };

    // Hotel building exterior - large BoxGeometry structure 0x887766 aged brick, 6 floors
    var buildingGeometry = new THREE.BoxGeometry(80, 120, 60);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x887766 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(0, 60, -100);
    scene.add(building);
    objects.push(building);

    // Grand lobby with reception desk - BoxGeometry counter 0x5C3D1F dark wood
    var deskGeometry = new THREE.BoxGeometry(20, 3, 8);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D1F });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(0, 1.5, 0);
    scene.add(desk);
    objects.push(desk);

    // Crystal chandeliers - CylinderGeometry frame + SphereGeometry crystals, flickering 0xFFEEAA
    var chandelierGroup = new THREE.Group();
    var frameGeometry = new THREE.CylinderGeometry(3, 3, 2, 16);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.8 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 0, 0);
    chandelierGroup.add(frame);

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var crystalGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFEEAA,
        emissive: 0xFFEEAA,
        emissiveIntensity: 0.5
      });
      var crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      crystal.position.set(Math.cos(angle) * 2.5, -1.5, Math.sin(angle) * 2.5);
      chandelierGroup.add(crystal);
    }

    chandelierGroup.position.set(0, 20, 0);
    scene.add(chandelierGroup);
    objects.push(chandelierGroup);
    animatedObjects.push({ object: chandelierGroup, type: 'chandelier' });

    // Crumbling staircase - BoxGeometry steps 0x888877 gray marble, cracked
    for (var s = 0; s < 8; s++) {
      var stepGeometry = new THREE.BoxGeometry(15, 1.5, 3);
      var stepMaterial = new THREE.MeshStandardMaterial({ color: 0x888877 });
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(-20, 2 + s * 2, 5 + s * 1.5);
      scene.add(step);
      objects.push(step);
    }

    // Hotel room doors along corridor - BoxGeometry doors 0x6B4226 wood, some swinging
    for (var d = 0; d < 5; d++) {
      var doorGeometry = new THREE.BoxGeometry(2.5, 4, 0.3);
      var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(20, 2, -30 - d * 8);
      scene.add(door);
      objects.push(door);
      animatedObjects.push({ object: door, type: 'door' });
    }

    // Ballroom with broken mirrors - BoxGeometry large room, LineSegments mirror frames
    var ballroomGeometry = new THREE.BoxGeometry(50, 15, 40);
    var ballroomMaterial = new THREE.MeshStandardMaterial({ color: 0x3D3D3D });
    var ballroom = new THREE.Mesh(ballroomGeometry, ballroomMaterial);
    ballroom.position.set(-50, 7.5, 20);
    scene.add(ballroom);
    objects.push(ballroom);

    // Mirror frames as LineSegments
    for (var m = 0; m < 4; m++) {
      var mirrorPoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(8, 0, 0),
        new THREE.Vector3(8, 0, 0),
        new THREE.Vector3(8, 10, 0),
        new THREE.Vector3(8, 10, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 0)
      ];
      var mirrorGeometry = new THREE.BufferGeometry().setFromPoints(mirrorPoints);
      var mirrorMaterial = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
      var mirrorFrame = new THREE.LineSegments(mirrorGeometry, mirrorMaterial);
      mirrorFrame.position.set(-50 + m * 12, 5, 20);
      scene.add(mirrorFrame);
      objects.push(mirrorFrame);
    }

    // Swimming pool drained/cracked - BoxGeometry basin 0x446644 with stagnant water
    var poolBasinGeometry = new THREE.BoxGeometry(40, 8, 25);
    var poolBasinMaterial = new THREE.MeshStandardMaterial({ color: 0x446644 });
    var poolBasin = new THREE.Mesh(poolBasinGeometry, poolBasinMaterial);
    poolBasin.position.set(60, -4, 0);
    scene.add(poolBasin);
    objects.push(poolBasin);

    // Kitchen with gas stoves - BoxGeometry appliances 0x666666, flickering blue flame
    var stoveGeometry = new THREE.BoxGeometry(3, 4, 2);
    var stoveMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    for (var st = 0; st < 3; st++) {
      var stove = new THREE.Mesh(stoveGeometry, stoveMaterial);
      stove.position.set(-30 + st * 5, 2, -50);
      scene.add(stove);
      objects.push(stove);
      animatedObjects.push({ object: stove, type: 'stove' });
    }

    // Boiler room machinery - CylinderGeometry boilers 0x553322, steam pipes
    var boilerGeometry = new THREE.CylinderGeometry(3, 3, 10, 16);
    var boilerMaterial = new THREE.MeshStandardMaterial({ color: 0x553322 });
    var boiler = new THREE.Mesh(boilerGeometry, boilerMaterial);
    boiler.position.set(40, 5, -80);
    scene.add(boiler);
    objects.push(boiler);
    animatedObjects.push({ object: boiler, type: 'boiler' });

    // Ghost apparition zones - SphereGeometry translucent white 0xFFFFFF, pulsing
    for (var g = 0; g < 3; g++) {
      var ghostGeometry = new THREE.SphereGeometry(2, 16, 16);
      var ghostMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.4
      });
      var ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
      ghost.position.set(-20 + g * 30, 10, 40 - g * 20);
      scene.add(ghost);
      objects.push(ghost);
      animatedObjects.push({ object: ghost, type: 'ghost' });
    }

    // Elevator shaft - BoxGeometry cage visible, slowly moving up/down
    var elevatorGeometry = new THREE.BoxGeometry(4, 6, 4);
    var elevatorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
    var elevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
    elevator.position.set(50, 30, 50);
    scene.add(elevator);
    objects.push(elevator);
    animatedObjects.push({ object: elevator, type: 'elevator' });

    // Penthouse suite - BoxGeometry ornate 0x8B7355, broken luxury furniture
    var penthouseGeometry = new THREE.BoxGeometry(30, 8, 25);
    var penthouseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    var penthouse = new THREE.Mesh(penthouseGeometry, penthouseMaterial);
    penthouse.position.set(0, 100, -100);
    scene.add(penthouse);
    objects.push(penthouse);

    // Furniture in penthouse
    var sofaGeometry = new THREE.BoxGeometry(8, 3, 4);
    var sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
    var sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
    sofa.position.set(-5, 104, -95);
    scene.add(sofa);
    objects.push(sofa);

    // Attic with bats - SphereGeometry small dark 0x221122, circling
    var atticGeometry = new THREE.BoxGeometry(35, 10, 30);
    var atticMaterial = new THREE.MeshStandardMaterial({ color: 0x2C2C2C });
    var attic = new THREE.Mesh(atticGeometry, atticMaterial);
    attic.position.set(20, 115, -80);
    scene.add(attic);
    objects.push(attic);

    for (var b = 0; b < 4; b++) {
      var batGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var batMaterial = new THREE.MeshStandardMaterial({ color: 0x221122 });
      var bat = new THREE.Mesh(batGeometry, batMaterial);
      bat.position.set(20, 115, -80);
      scene.add(bat);
      objects.push(bat);
      animatedObjects.push({ object: bat, type: 'bat', index: b });
    }

    // Cellar wine storage - BoxGeometry racks 0x4A2C0A with CylinderGeometry bottles
    var rackGeometry = new THREE.BoxGeometry(20, 8, 4);
    var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x4A2C0A });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(-60, 2, -60);
    scene.add(rack);
    objects.push(rack);

    // Wine bottles
    for (var w = 0; w < 8; w++) {
      var bottleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
      var bottleMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5016 });
      var bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
      bottle.position.set(-60 + (w % 4) * 3 - 4.5, 3 + Math.floor(w / 4) * 3, -60);
      scene.add(bottle);
      objects.push(bottle);
    }

    // Additional atmospheric elements
    // Torch/lantern post
    var torchGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    var torchMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var torch = new THREE.Mesh(torchGeometry, torchMaterial);
    torch.position.set(30, 1, 30);
    scene.add(torch);
    objects.push(torch);

    // Rubble pile
    var rubbleGeometry = new THREE.BoxGeometry(8, 3, 6);
    var rubbleMaterial = new THREE.MeshStandardMaterial({ color: 0x665544 });
    var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
    rubble.position.set(-40, 1.5, 60);
    scene.add(rubble);
    objects.push(rubble);
  };

  var update = function(delta) {
    if (!clock) return;
    clock.elapsedTime += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];
      var obj = anim.object;

      if (anim.type === 'chandelier') {
        // Sway and flicker
        obj.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.1;
        var children = obj.children;
        for (var c = 0; c < children.length; c++) {
          if (children[c].material && children[c].material.emissiveIntensity !== undefined) {
            children[c].material.emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.3;
          }
        }
      }
      else if (anim.type === 'door') {
        // Swing
        obj.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.3;
      }
      else if (anim.type === 'ghost') {
        // Fade in/out
        if (obj.material) {
          obj.material.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 1.5) * 0.3;
          obj.material.opacity = 0.2 + Math.sin(clock.elapsedTime * 1.2) * 0.2;
        }
      }
      else if (anim.type === 'elevator') {
        // Move up and down
        obj.position.y = 30 + Math.sin(clock.elapsedTime * 0.3) * 20;
      }
      else if (anim.type === 'bat') {
        // Orbit
        var angle = clock.elapsedTime * 1.5 + (anim.index * Math.PI / 2);
        obj.position.x = 20 + Math.cos(angle) * 10;
        obj.position.z = -80 + Math.sin(angle) * 10;
        obj.position.y = 115 + Math.sin(clock.elapsedTime * 2) * 3;
      }
      else if (anim.type === 'boiler') {
        // Steam pulse
        obj.scale.y = 1 + Math.sin(clock.elapsedTime * 2.5) * 0.15;
      }
      else if (anim.type === 'stove') {
        // Flicker
        if (obj.material && obj.material.emissive) {
          obj.material.emissiveIntensity = Math.sin(clock.elapsedTime * 3) * 0.5;
        }
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    clock = null;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
