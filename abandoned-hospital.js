window.AbandonedHospital = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var lights = [];
  var animationStates = {};

  var colors = {
    hospitalWhite: 0xDDDDDD,
    decayGray: 0x999999,
    bloodDark: 0x550000,
    rust: 0x8B4513,
    emergencyRed: 0xFF2200,
    horrorGreen: 0x2A4A2A,
    concrete: 0x444444,
    darkMetal: 0x222222,
    paleMetal: 0x888888
  };

  var spawnPoints = [];

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    objects = [];
    lights = [];
    animationStates = {
      lightFlickerTime: 0,
      generatorPulse: 0,
      dustParticles: [],
      guardPatrols: [],
      ratScurry: []
    };

    buildMainBuilding();
    buildCorridor();
    buildHospitalBeds();
    buildMedicalEquipment();
    buildPaddedCells();
    buildElectroshockRoom();
    buildBasementMorgue();
    buildOperatingTheater();
    buildCollapsedSection();
    buildLighting();
    initializeSpawnPoints();
  }

  function buildMainBuilding() {
    var geometry = new THREE.BoxGeometry(60, 40, 50);
    var material = new THREE.MeshStandardMaterial({
      color: colors.hospitalWhite,
      roughness: 0.8,
      metalness: 0.1
    });
    var building = new THREE.Mesh(geometry, material);
    building.position.set(0, 20, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    objects.push(building);

    var roofGeometry = new THREE.BoxGeometry(65, 2, 55);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: colors.decayGray,
      roughness: 0.9,
      metalness: 0.2
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 41, 0);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    for (var i = 0; i < 8; i++) {
      var windowGeometry = new THREE.BoxGeometry(3, 3, 0.3);
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        roughness: 0.3,
        metalness: 0.8
      });
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-20 + i * 5, 25 + (i % 2) * 5, -25.5);
      window.castShadow = true;
      scene.add(window);
      objects.push(window);
    }
  }

  function buildCorridor() {
    var corridorGeometry = new THREE.BoxGeometry(45, 5, 8);
    var corridorMaterial = new THREE.MeshStandardMaterial({
      color: colors.hospitalWhite,
      roughness: 0.85,
      metalness: 0
    });
    var corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor.position.set(0, 2.5, 20);
    corridor.castShadow = true;
    corridor.receiveShadow = true;
    scene.add(corridor);
    objects.push(corridor);

    var floorGeometry = new THREE.BoxGeometry(45, 0.5, 8);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: colors.bloodDark,
      roughness: 0.7,
      metalness: 0
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 0.25, 20);
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    for (var i = 0; i < 9; i++) {
      var crackGeometry = new THREE.BoxGeometry(2, 0.05, 0.5);
      var crackMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 1
      });
      var crack = new THREE.Mesh(crackGeometry, crackMaterial);
      crack.position.set(-20 + i * 5, 0.3, 20 + Math.sin(i) * 2);
      scene.add(crack);
      objects.push(crack);
    }
  }

  function buildHospitalBeds() {
    for (var i = 0; i < 4; i++) {
      var frameGeometry = new THREE.BoxGeometry(2.5, 1, 6);
      var frameMaterial = new THREE.MeshStandardMaterial({
        color: colors.darkMetal,
        roughness: 0.7,
        metalness: 0.9
      });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(-15 + i * 10, 1.5, -10 + i * 5);
      frame.rotation.z = 0.3 + (i * 0.15);
      frame.castShadow = true;
      scene.add(frame);
      objects.push(frame);

      var mattressGeometry = new THREE.BoxGeometry(2.3, 0.4, 5.8);
      var mattressMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.9,
        metalness: 0
      });
      var mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
      mattress.position.set(-15 + i * 10, 2.2, -10 + i * 5);
      mattress.rotation.z = 0.3 + (i * 0.15);
      mattress.castShadow = true;
      scene.add(mattress);
      objects.push(mattress);
    }
  }

  function buildMedicalEquipment() {
    for (var i = 0; i < 3; i++) {
      var standGeometry = new THREE.CylinderGeometry(0.3, 0.4, 5, 8);
      var standMaterial = new THREE.MeshStandardMaterial({
        color: colors.rust,
        roughness: 0.8,
        metalness: 0.6
      });
      var stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.set(-10 + i * 8, 2.5, 5);
      stand.castShadow = true;
      scene.add(stand);
      objects.push(stand);

      var hangGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
      var hangMaterial = new THREE.MeshStandardMaterial({
        color: colors.paleMetal,
        roughness: 0.6,
        metalness: 0.8
      });
      var hang = new THREE.Mesh(hangGeometry, hangMaterial);
      hang.position.set(-10 + i * 8, 7, 5);
      hang.castShadow = true;
      scene.add(hang);
      objects.push(hang);
    }

    var lampGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
    var lampMaterial = new THREE.MeshStandardMaterial({
      color: colors.emergencyRed,
      roughness: 0.4,
      metalness: 0.7,
      emissive: colors.emergencyRed,
      emissiveIntensity: 0.3
    });
    var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(5, 10, 8);
    lamp.castShadow = true;
    scene.add(lamp);
    objects.push(lamp);
  }

  function buildPaddedCells() {
    for (var i = 0; i < 2; i++) {
      var cellGeometry = new THREE.BoxGeometry(4, 4, 4);
      var cellMaterial = new THREE.MeshStandardMaterial({
        color: colors.horrorGreen,
        roughness: 0.85,
        metalness: 0.1
      });
      var cell = new THREE.Mesh(cellGeometry, cellMaterial);
      cell.position.set(-15 + i * 12, 2, -25);
      cell.castShadow = true;
      cell.receiveShadow = true;
      scene.add(cell);
      objects.push(cell);

      for (var j = 0; j < 12; j++) {
        var panelGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.05);
        var panelMaterial = new THREE.MeshStandardMaterial({
          color: colors.decayGray,
          roughness: 0.9,
          metalness: 0.1
        });
        var panel = new THREE.Mesh(panelGeometry, panelMaterial);
        var angle = (j / 12) * Math.PI * 2;
        panel.position.set(
          -15 + i * 12 + Math.cos(angle) * 1.8,
          2 + Math.sin(angle * 0.5) * 1.5,
          -25 + Math.sin(angle) * 1.8
        );
        scene.add(panel);
        objects.push(panel);
      }
    }
  }

  function buildElectroshockRoom() {
    var chairGeometry = new THREE.BoxGeometry(2, 3, 2);
    var chairMaterial = new THREE.MeshStandardMaterial({
      color: colors.darkMetal,
      roughness: 0.6,
      metalness: 0.9
    });
    var chair = new THREE.Mesh(chairGeometry, chairMaterial);
    chair.position.set(15, 1.5, -15);
    chair.castShadow = true;
    scene.add(chair);
    objects.push(chair);

    for (var i = 0; i < 2; i++) {
      var restraintGeometry = new THREE.BoxGeometry(0.3, 0.3, 2.5);
      var restraintMaterial = new THREE.MeshStandardMaterial({
        color: colors.rust,
        roughness: 0.7,
        metalness: 0.8
      });
      var restraint = new THREE.Mesh(restraintGeometry, restraintMaterial);
      restraint.position.set(15 + (i * 1.8 - 0.9), 2, -15);
      restraint.castShadow = true;
      scene.add(restraint);
      objects.push(restraint);
    }

    var generatorGeometry = new THREE.BoxGeometry(3, 2, 3);
    var generatorMaterial = new THREE.MeshStandardMaterial({
      color: colors.concrete,
      roughness: 0.85,
      metalness: 0.3
    });
    var generator = new THREE.Mesh(generatorGeometry, generatorMaterial);
    generator.position.set(20, 1, -10);
    generator.castShadow = true;
    scene.add(generator);
    objects.push(generator);
    animationStates.generatorMesh = generator;
  }

  function buildBasementMorgue() {
    var slabGeometry = new THREE.BoxGeometry(2, 0.3, 6);
    var slabMaterial = new THREE.MeshStandardMaterial({
      color: colors.paleMetal,
      roughness: 0.5,
      metalness: 0.9
    });

    for (var i = 0; i < 3; i++) {
      var slab = new THREE.Mesh(slabGeometry, slabMaterial);
      slab.position.set(10 + i * 3, 0.5, 30);
      slab.castShadow = true;
      slab.receiveShadow = true;
      scene.add(slab);
      objects.push(slab);
    }

    var flooring = new THREE.BoxGeometry(15, 0.3, 10);
    var flooringMaterial = new THREE.MeshStandardMaterial({
      color: colors.concrete,
      roughness: 0.9,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(flooring, flooringMaterial);
    floor.position.set(10, 0.15, 30);
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  }

  function buildOperatingTheater() {
    var wallGeometry = new THREE.BoxGeometry(12, 8, 0.5);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: colors.hospitalWhite,
      roughness: 0.8,
      metalness: 0
    });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(-20, 4, -20);
    wall.castShadow = true;
    scene.add(wall);
    objects.push(wall);

    var tableGeometry = new THREE.BoxGeometry(3, 1, 5);
    var tableMaterial = new THREE.MeshStandardMaterial({
      color: colors.paleMetal,
      roughness: 0.5,
      metalness: 0.85
    });
    var table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(-20, 1, -20);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    objects.push(table);

    var lightGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: colors.emergencyRed,
      roughness: 0.3,
      metalness: 0.6,
      emissive: colors.emergencyRed,
      emissiveIntensity: 0.4
    });
    var surgicalLight = new THREE.Mesh(lightGeometry, lightMaterial);
    surgicalLight.position.set(-20, 7, -20);
    surgicalLight.castShadow = true;
    scene.add(surgicalLight);
    objects.push(surgicalLight);
  }

  function buildCollapsedSection() {
    var debrisCount = 8;
    for (var i = 0; i < debrisCount; i++) {
      var debrisGeometry = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        1 + Math.random() * 2,
        2 + Math.random() * 3
      );
      var debrisMaterial = new THREE.MeshStandardMaterial({
        color: colors.concrete,
        roughness: 0.95,
        metalness: 0.1
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        -5 + Math.random() * 10,
        3 + Math.random() * 3,
        15 + Math.random() * 8
      );
      debris.rotation.x = Math.random() * Math.PI;
      debris.rotation.y = Math.random() * Math.PI;
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      objects.push(debris);
    }

    var dustGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var dustMaterial = new THREE.MeshStandardMaterial({
      color: colors.decayGray,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.6
    });

    for (var d = 0; d < 15; d++) {
      var dust = new THREE.Mesh(dustGeometry, dustMaterial);
      dust.position.set(
        -8 + Math.random() * 8,
        8 + Math.random() * 4,
        18 + Math.random() * 6
      );
      dust.castShadow = false;
      scene.add(dust);
      animationStates.dustParticles.push({
        mesh: dust,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          -0.05 - Math.random() * 0.05,
          (Math.random() - 0.5) * 0.05
        )
      });
    }
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var emergencyLight1 = new THREE.PointLight(colors.emergencyRed, 0.8, 40);
    emergencyLight1.position.set(-20, 8, -10);
    emergencyLight1.castShadow = true;
    emergencyLight1.shadow.mapSize.width = 512;
    emergencyLight1.shadow.mapSize.height = 512;
    scene.add(emergencyLight1);
    lights.push(emergencyLight1);
    animationStates.emergencyLight1 = emergencyLight1;

    var emergencyLight2 = new THREE.PointLight(colors.emergencyRed, 0.6, 30);
    emergencyLight2.position.set(15, 6, 15);
    emergencyLight2.castShadow = true;
    scene.add(emergencyLight2);
    lights.push(emergencyLight2);
    animationStates.emergencyLight2 = emergencyLight2;

    var dungeonLight = new THREE.PointLight(colors.horrorGreen, 0.4, 35);
    dungeonLight.position.set(10, 5, 30);
    scene.add(dungeonLight);
    lights.push(dungeonLight);
    animationStates.dungeonLight = dungeonLight;

    var horribleWhiteLight = new THREE.DirectionalLight(0xffffff, 0.5);
    horribleWhiteLight.position.set(30, 25, 20);
    horribleWhiteLight.castShadow = true;
    horribleWhiteLight.shadow.mapSize.width = 1024;
    horribleWhiteLight.shadow.mapSize.height = 1024;
    horribleWhiteLight.shadow.camera.near = 0.5;
    horribleWhiteLight.shadow.camera.far = 100;
    horribleWhiteLight.shadow.camera.left = -50;
    horribleWhiteLight.shadow.camera.right = 50;
    horribleWhiteLight.shadow.camera.top = 50;
    horribleWhiteLight.shadow.camera.bottom = -50;
    scene.add(horribleWhiteLight);
    lights.push(horribleWhiteLight);
    animationStates.mainDirectionalLight = horribleWhiteLight;
  }

  function initializeSpawnPoints() {
    spawnPoints = [
      { name: 'entrance', position: new THREE.Vector3(0, 1.5, -30) },
      { name: 'mainWard', position: new THREE.Vector3(0, 1.5, 20) },
      { name: 'paddedCellBlock', position: new THREE.Vector3(-15, 2, -25) },
      { name: 'operatingTheater', position: new THREE.Vector3(-20, 2, -20) },
      { name: 'morgue', position: new THREE.Vector3(10, 1, 30) }
    ];
  }

  function update(delta) {
    if (!scene || !camera) return;

    animationStates.lightFlickerTime += delta;

    if (animationStates.emergencyLight1) {
      var flicker1 = 0.8 + Math.sin(animationStates.lightFlickerTime * 12) * 0.3;
      if (Math.random() > 0.97) {
        flicker1 *= 0.4;
      }
      animationStates.emergencyLight1.intensity = Math.max(0.3, flicker1);
    }

    if (animationStates.emergencyLight2) {
      var flicker2 = 0.6 + Math.sin(animationStates.lightFlickerTime * 8 + 1) * 0.25;
      animationStates.emergencyLight2.intensity = Math.max(0.2, flicker2);
    }

    if (animationStates.mainDirectionalLight) {
      var dirFlicker = 0.5 + Math.sin(animationStates.lightFlickerTime * 4) * 0.15;
      animationStates.mainDirectionalLight.intensity = dirFlicker;
    }

    if (animationStates.generatorMesh) {
      animationStates.generatorPulse += delta;
      animationStates.generatorMesh.position.y = 1 + Math.sin(animationStates.generatorPulse * 8) * 0.15;
      animationStates.generatorMesh.rotation.x += delta * 0.5;
    }

    for (var i = 0; i < animationStates.dustParticles.length; i++) {
      var dustParticle = animationStates.dustParticles[i];
      dustParticle.mesh.position.add(dustParticle.velocity);
      dustParticle.mesh.rotation.x += Math.random() * 0.02;
      dustParticle.mesh.rotation.y += Math.random() * 0.02;

      if (dustParticle.mesh.position.y < 5) {
        dustParticle.velocity.y = Math.abs(dustParticle.velocity.y) * 0.8;
      }
    }

    for (var j = 0; j < objects.length; j++) {
      if (objects[j].receiveShadow) {
        objects[j].receiveShadow = true;
      }
    }
  }

  function reset() {
    objects.forEach(function(obj) {
      if (scene && obj.parent === scene) {
        scene.remove(obj);
      }
    });

    lights.forEach(function(light) {
      if (scene && light.parent === scene) {
        scene.remove(light);
      }
    });

    objects = [];
    lights = [];
    spawnPoints = [];
    animationStates = {};
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() {
      return spawnPoints;
    },
    getObjects: function() {
      return objects;
    }
  };
}());
