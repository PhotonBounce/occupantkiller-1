window.BurningCity = (function() {
  'use strict';

  var scene, camera;
  var objects = [];
  var lights = [];
  var buildings = [];
  var soldiers = [];
  var civilians = [];
  var vehicles = [];
  var explosionTimer = 0;
  var explosionInterval = 4000;
  var ashParticles = [];

  var COLORS = {
    fireOrange: 0xFF5500,
    ashGray: 0x666666,
    rubbleBrown: 0x7A5C3A,
    smokeBlack: 0x222222,
    skyRed: 0x882200,
    emberGlow: 0xFF2200,
    darkGray: 0x333333,
    lightGray: 0x888888,
    red: 0xFF0000,
    yellow: 0xFFFF00
  };

  function createStreetGrid() {
    var roadSections = [];
    var roadMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, roughness: 0.8 });

    for (var x = -100; x <= 100; x += 20) {
      var geometry = new THREE.BoxGeometry(20, 0.5, 200);
      var mesh = new THREE.Mesh(geometry, roadMaterial);
      mesh.position.set(x, 0, 0);
      scene.add(mesh);
      objects.push(mesh);
      roadSections.push(mesh);
    }

    for (var z = -100; z <= 100; z += 20) {
      var geometry = new THREE.BoxGeometry(200, 0.5, 20);
      var mesh = new THREE.Mesh(geometry, roadMaterial);
      mesh.position.set(0, 0, z);
      scene.add(mesh);
      objects.push(mesh);
      roadSections.push(mesh);
    }

    return roadSections;
  }

  function createBurningBuilding(x, z, width, height, depth) {
    var buildingGroup = {
      meshes: [],
      lights: [],
      fireIntensity: 0.5
    };

    var material = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: COLORS.fireOrange,
      emissiveIntensity: 0.3,
      roughness: 0.9
    });

    var geometry = new THREE.BoxGeometry(width, height, depth);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.userData.originalHeight = height;
    mesh.userData.crumbleAmount = 0;
    scene.add(mesh);
    objects.push(mesh);
    buildingGroup.meshes.push(mesh);

    var fireLight = new THREE.PointLight(COLORS.fireOrange, 2, 60);
    fireLight.position.set(x, height * 0.7, z);
    fireLight.userData.originalIntensity = 2;
    scene.add(fireLight);
    lights.push(fireLight);
    buildingGroup.lights.push(fireLight);

    for (var i = 0; i < 3; i++) {
      var smokeSphere = new THREE.Mesh(
        new THREE.SphereGeometry(8, 4, 4),
        new THREE.MeshStandardMaterial({ color: COLORS.smokeBlack, transparent: true, opacity: 0.3 })
      );
      smokeSphere.position.set(x, height + 15 + i * 8, z);
      smokeSphere.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        0.05,
        (Math.random() - 0.5) * 0.02
      );
      scene.add(smokeSphere);
      objects.push(smokeSphere);
      buildingGroup.meshes.push(smokeSphere);
    }

    buildings.push(buildingGroup);
    return buildingGroup;
  }

  function createBurningVehicle(x, z, rotationY) {
    var vehicleGroup = {
      meshes: [],
      lights: [],
      fireIntensity: 0.6
    };

    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: COLORS.fireOrange, emissiveIntensity: 0.4 });
    var bodyGeometry = new THREE.BoxGeometry(3, 2, 7);
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 1, z);
    body.rotation.y = rotationY;
    scene.add(body);
    objects.push(body);
    vehicleGroup.meshes.push(body);

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    var wheelPositions = [
      [-1.2, 0.8, -1.5],
      [1.2, 0.8, -1.5],
      [-1.2, 0.8, 1.5],
      [1.2, 0.8, 1.5]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(x + pos[0] * Math.cos(rotationY), pos[1], z + pos[0] * Math.sin(rotationY));
      wheel.rotation.z = Math.PI / 2;
      scene.add(wheel);
      objects.push(wheel);
      vehicleGroup.meshes.push(wheel);
    });

    var fireLight = new THREE.PointLight(COLORS.emberGlow, 1.5, 40);
    fireLight.position.set(x, 3, z);
    scene.add(fireLight);
    lights.push(fireLight);
    vehicleGroup.lights.push(fireLight);

    var flameGeometry = new THREE.SphereGeometry(1.5, 6, 6);
    var flameMaterial = new THREE.MeshStandardMaterial({ color: COLORS.fireOrange, emissive: COLORS.fireOrange, emissiveIntensity: 0.8 });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(x, 2.5, z);
    scene.add(flame);
    objects.push(flame);
    vehicleGroup.meshes.push(flame);

    vehicles.push(vehicleGroup);
    return vehicleGroup;
  }

  function createGasExplosionCrater(x, z) {
    var craterGeometry = new THREE.CylinderGeometry(15, 20, 3, 32);
    var craterMaterial = new THREE.MeshStandardMaterial({ color: COLORS.rubbleBrown });
    var crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.set(x, 0, z);
    scene.add(crater);
    objects.push(crater);

    var pipeGeometry = new THREE.CylinderGeometry(1, 1, 8, 16);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(x, 4, z);
    scene.add(pipe);
    objects.push(pipe);

    var rubblePile = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 12),
      new THREE.MeshStandardMaterial({ color: COLORS.rubbleBrown })
    );
    rubblePile.position.set(x - 8, 3, z - 8);
    rubblePile.rotation.z = 0.3;
    scene.add(rubblePile);
    objects.push(rubblePile);

    var explosionLight = new THREE.PointLight(COLORS.emberGlow, 1, 50);
    explosionLight.position.set(x, 8, z);
    explosionLight.userData.active = false;
    scene.add(explosionLight);
    lights.push(explosionLight);

    return { crater: crater, pipe: pipe, light: explosionLight };
  }

  function createFallenPowerLinePole(x, z) {
    var poleGeometry = new THREE.CylinderGeometry(0.3, 0.4, 25, 12);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 12.5, z);
    pole.rotation.z = 0.8;
    scene.add(pole);
    objects.push(pole);

    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      x - 10, 20, z - 5,
      x + 10, 15, z + 5
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    objects.push(wire);

    return pole;
  }

  function createCivilianRefugeeGroup(x, z) {
    var groupSize = 4;
    var refugeeGroup = [];

    for (var i = 0; i < groupSize; i++) {
      var offsetX = (Math.random() - 0.5) * 10;
      var offsetZ = (Math.random() - 0.5) * 10;

      var headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var skinMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
      var head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.set(x + offsetX, 1, z + offsetZ);
      scene.add(head);
      objects.push(head);
      refugeeGroup.push(head);

      var bodyGeometry = new THREE.BoxGeometry(0.4, 1, 0.3);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(x + offsetX, 0, z + offsetZ);
      scene.add(body);
      objects.push(body);
      refugeeGroup.push(body);
    }

    civilians.push({ meshes: refugeeGroup, position: new THREE.Vector3(x, 0, z), velocity: new THREE.Vector3(0, 0, 0) });
    return refugeeGroup;
  }

  function createEnemySoldierSquad(x, z) {
    var squadSize = 3;
    var squad = [];

    for (var i = 0; i < squadSize; i++) {
      var offsetX = i * 2;

      var headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xC0A080 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(x + offsetX, 1.2, z);
      scene.add(head);
      objects.push(head);
      squad.push(head);

      var uniformGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.3);
      var uniformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var uniform = new THREE.Mesh(uniformGeometry, uniformMaterial);
      uniform.position.set(x + offsetX, 0.6, z);
      scene.add(uniform);
      objects.push(uniform);
      squad.push(uniform);
    }

    soldiers.push({ meshes: squad, position: new THREE.Vector3(x, 0, z), velocity: new THREE.Vector3(0.05, 0, 0) });
    return squad;
  }

  function createWaterMainBurst(x, z) {
    var waterGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 16);
    var waterMaterial = new THREE.MeshStandardMaterial({ color: 0x4488CC, transparent: true, opacity: 0.6 });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(x, 0.5, z);
    scene.add(water);
    objects.push(water);

    var pipeGeometry = new THREE.CylinderGeometry(0.5, 0.6, 2, 12);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(x, 1.5, z);
    pipe.rotation.z = 0.5;
    scene.add(pipe);
    objects.push(pipe);

    return { water: water, pipe: pipe };
  }

  function createBurningTreeLine(x, z) {
    var treeGroup = [];

    for (var i = 0; i < 5; i++) {
      var offsetZ = i * 5;

      var trunkGeometry = new THREE.CylinderGeometry(0.8, 1, 12, 12);
      var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2A1810 });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, 6, z + offsetZ);
      scene.add(trunk);
      objects.push(trunk);
      treeGroup.push(trunk);

      var canopyGeometry = new THREE.SphereGeometry(5, 8, 8);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.fireOrange,
        emissive: COLORS.fireOrange,
        emissiveIntensity: 0.5
      });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(x, 13, z + offsetZ);
      scene.add(canopy);
      objects.push(canopy);
      treeGroup.push(canopy);

      var fireLight = new THREE.PointLight(COLORS.fireOrange, 1.5, 40);
      fireLight.position.set(x, 14, z + offsetZ);
      scene.add(fireLight);
      lights.push(fireLight);
    }

    return treeGroup;
  }

  function createChurchFacade(x, z) {
    var facadeGeometry = new THREE.BoxGeometry(12, 20, 2);
    var facadeMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    var facade = new THREE.Mesh(facadeGeometry, facadeMaterial);
    facade.position.set(x, 10, z);
    scene.add(facade);
    objects.push(facade);

    var crossGeometry = new THREE.BoxGeometry(1, 8, 0.2);
    var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    var horizontalCross = new THREE.Mesh(crossGeometry, crossMaterial);
    horizontalCross.position.set(x, 18, z - 1);
    scene.add(horizontalCross);
    objects.push(horizontalCross);

    var verticalCross = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 0.2), crossMaterial);
    verticalCross.position.set(x, 18, z - 1);
    scene.add(verticalCross);
    objects.push(verticalCross);

    for (var i = 0; i < 8; i++) {
      var bulletHoleGeometry = new THREE.SphereGeometry(0.3, 6, 6);
      var bulletHoleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      var bulletHole = new THREE.Mesh(bulletHoleGeometry, bulletHoleMaterial);
      bulletHole.position.set(x + (Math.random() - 0.5) * 10, 5 + Math.random() * 10, z - 1);
      scene.add(bulletHole);
      objects.push(bulletHole);
    }

    return facade;
  }

  function createBurntCarBarricade(x, z) {
    var barricadeGroup = [];

    for (var i = 0; i < 3; i++) {
      var offsetX = i * 3.5;

      var carBodyGeometry = new THREE.BoxGeometry(2.5, 1.5, 6);
      var carMaterial = new THREE.MeshStandardMaterial({ color: 0x1A0000, emissive: COLORS.fireOrange, emissiveIntensity: 0.2 });
      var carBody = new THREE.Mesh(carBodyGeometry, carMaterial);
      carBody.position.set(x + offsetX, 0.75, z);
      carBody.rotation.z = (i % 2) * 0.2;
      scene.add(carBody);
      objects.push(carBody);
      barricadeGroup.push(carBody);
    }

    return barricadeGroup;
  }

  function createAshParticles() {
    var particleCount = 20;
    for (var i = 0; i < particleCount; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);

      particle.position.set(
        (Math.random() - 0.5) * 200,
        50 + Math.random() * 50,
        (Math.random() - 0.5) * 200
      );

      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        -0.02,
        (Math.random() - 0.5) * 0.01
      );

      scene.add(particle);
      objects.push(particle);
      ashParticles.push(particle);
    }
  }

  function createRubblePiles() {
    var pilePositions = [
      [-60, -40],
      [60, 40],
      [-40, 60],
      [50, -60],
      [0, 80],
      [-80, 0]
    ];

    pilePositions.forEach(function(pos) {
      var rubbleGeometry = new THREE.BoxGeometry(15, 8, 15);
      var rubbleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.rubbleBrown });
      var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubble.position.set(pos[0], 4, pos[1]);
      rubble.rotation.x = (Math.random() - 0.5) * 0.3;
      rubble.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(rubble);
      objects.push(rubble);

      for (var i = 0; i < 3; i++) {
        var rockGeometry = new THREE.SphereGeometry(2 + Math.random() * 2, 6, 6);
        var rockMaterial = new THREE.MeshStandardMaterial({ color: COLORS.ashGray });
        var rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(
          pos[0] + (Math.random() - 0.5) * 8,
          8 + Math.random() * 4,
          pos[1] + (Math.random() - 0.5) * 8
        );
        scene.add(rock);
        objects.push(rock);
      }
    });
  }

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    scene.background = new THREE.Color(COLORS.skyRed);
    scene.fog = new THREE.Fog(COLORS.smokeBlack, 200, 500);

    var ambientLight = new THREE.AmbientLight(COLORS.fireOrange, 0.4);
    scene.add(ambientLight);

    createStreetGrid();

    createBurningBuilding(-50, -50, 20, 25, 18);
    createBurningBuilding(50, 50, 18, 22, 16);
    createBurningBuilding(-40, 60, 16, 20, 14);
    createBurningBuilding(60, -60, 22, 28, 20);
    createBurningBuilding(-70, 0, 18, 24, 16);
    createBurningBuilding(40, 20, 20, 26, 18);

    createBurningVehicle(-30, -80, 0.5);
    createBurningVehicle(30, 80, -0.5);
    createBurningVehicle(-75, 20, 0.3);

    createGasExplosionCrater(-20, 30);
    createGasExplosionCrater(70, -40);

    createFallenPowerLinePole(-60, 40);
    createFallenPowerLinePole(50, -50);

    createCivilianRefugeeGroup(-30, 0);
    createCivilianRefugeeGroup(35, -35);

    createEnemySoldierSquad(-80, -20);
    createEnemySoldierSquad(70, 50);

    createWaterMainBurst(0, 50);
    createWaterMainBurst(-50, -20);

    createBurningTreeLine(-90, -60);

    createChurchFacade(0, -80);

    createBurntCarBarricade(20, 70);

    createRubblePiles();

    createAshParticles();
  };

  var update = function(delta) {
    explosionTimer += delta;

    buildings.forEach(function(building) {
      building.lights.forEach(function(light) {
        var pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
        light.intensity = light.userData.originalIntensity * pulse;
      });

      building.meshes.forEach(function(mesh) {
        if (mesh.geometry instanceof THREE.BoxGeometry && mesh !== building.meshes[0]) {
          mesh.position.y += delta * 0.02;
          mesh.position.x += (Math.random() - 0.5) * 0.1;
        }
      });
    });

    vehicles.forEach(function(vehicle) {
      vehicle.lights.forEach(function(light) {
        light.intensity = 1.5 + Math.sin(Date.now() * 0.008) * 0.5;
      });
    });

    lights.forEach(function(light) {
      if (light.userData.active) {
        light.intensity = Math.max(0, light.intensity - delta * 2);
      }
    });

    if (explosionTimer > explosionInterval) {
      explosionTimer = 0;
      var explosionLight = lights[Math.floor(Math.random() * lights.length)];
      if (explosionLight && explosionLight.userData.active !== undefined) {
        explosionLight.userData.active = true;
        explosionLight.intensity = 5;
      }
    }

    ashParticles.forEach(function(particle) {
      particle.position.add(particle.userData.velocity);
      if (particle.position.y < -10) {
        particle.position.y = 100;
      }
    });

    soldiers.forEach(function(squad) {
      squad.position.add(squad.velocity);
      squad.meshes.forEach(function(mesh) {
        mesh.position.add(squad.velocity);
      });
    });

    civilians.forEach(function(group) {
      var targetX = group.position.x + 0.5;
      var targetZ = group.position.z + 1;
      group.velocity.x = (targetX - group.position.x) * 0.02;
      group.velocity.z = (targetZ - group.position.z) * 0.02;
      group.position.add(group.velocity);

      group.meshes.forEach(function(mesh) {
        mesh.position.add(group.velocity);
      });
    });

    objects.forEach(function(obj) {
      if (obj.material && obj.material.emissive) {
        var intensity = 0.2 + Math.sin(Date.now() * 0.003) * 0.2;
        obj.material.emissiveIntensity = intensity;
      }
    });
  };

  var reset = function() {
    objects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    lights.forEach(function(light) {
      scene.remove(light);
    });

    objects = [];
    lights = [];
    buildings = [];
    soldiers = [];
    civilians = [];
    vehicles = [];
    ashParticles = [];
    explosionTimer = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
