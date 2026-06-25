window.NeonCity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var raindrops = [];
  var puddles = [];
  var flyingCars = [];
  var billboards = [];
  var dataStreamPillars = [];
  var securityDrone = null;
  var droneTarget = null;

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 300, 800);

    createCityBlocks();
    createNeonSigns();
    createHolographicBillboards();
    createRainEffect();
    createPuddles();
    createFlyingVehicles();
    createAlleyBarricades();
    createCorporateTowerHQ();
    createStreetVendors();
    createSecurityDrone();
    createDataStreamPillars();
    createLighting();
  };

  var createCityBlocks = function() {
    var buildingHeights = [120, 150, 180, 130, 160, 140, 170, 155, 125, 145];
    var positions = [
      {x: -200, z: -150}, {x: -100, z: -150}, {x: 0, z: -150}, {x: 100, z: -150},
      {x: -200, z: -50}, {x: -100, z: -50}, {x: 100, z: -50}, {x: 200, z: -50},
      {x: -200, z: 50}, {x: 200, z: 50}
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var height = buildingHeights[i];
      var geometry = new THREE.BoxGeometry(80, height, 80);
      var material = new THREE.MeshStandardMaterial({
        color: 0x1a2a4a,
        metalness: 0.7,
        roughness: 0.3
      });
      var building = new THREE.Mesh(geometry, material);
      building.position.set(positions[i].x, height / 2, positions[i].z);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);

      createWindowLights(building, height);
    }
  };

  var createWindowLights = function(building, height) {
    var windowSize = 6;
    var spacing = 12;
    var x, z, y;

    for (x = -30; x <= 30; x += spacing) {
      for (z = -30; z <= 30; z += spacing) {
        for (y = 20; y < height - 20; y += spacing) {
          if (Math.random() > 0.3) {
            var windowGeom = new THREE.BoxGeometry(windowSize, windowSize, 2);
            var colors = [0x00ffff, 0xff00ff, 0xffff00];
            var color = colors[Math.floor(Math.random() * colors.length)];
            var windowMat = new THREE.MeshStandardMaterial({
              color: color,
              emissive: color,
              emissiveIntensity: 0.8
            });
            var window = new THREE.Mesh(windowGeom, windowMat);
            window.position.set(x, y, 41);
            building.add(window);
          }
        }
      }
    }
  };

  var createNeonSigns = function() {
    var signPositions = [
      {x: -160, y: 100, z: -130, color: 0xff0080},
      {x: 160, y: 110, z: -130, color: 0x00ffff},
      {x: -220, y: 95, z: 60, color: 0xffff00},
      {x: 220, y: 105, z: 30, color: 0xff6600},
      {x: -80, y: 85, z: -180, color: 0x00ff88}
    ];

    var i;
    for (i = 0; i < signPositions.length; i++) {
      var pos = signPositions[i];
      var signGeometry = new THREE.BoxGeometry(40, 15, 1);
      var signMaterial = new THREE.MeshStandardMaterial({
        color: pos.color,
        emissive: pos.color,
        emissiveIntensity: 0.9
      });
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(pos.x, pos.y, pos.z);
      scene.add(sign);

      var glowGeometry = new THREE.BoxGeometry(42, 17, 0.5);
      var glowMaterial = new THREE.MeshStandardMaterial({
        color: pos.color,
        emissive: pos.color,
        emissiveIntensity: 0.3
      });
      var glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(sign.position);
      glow.position.z -= 2;
      scene.add(glow);
    }
  };

  var createHolographicBillboards = function() {
    var billboardPositions = [
      {x: 0, y: 140, z: 180},
      {x: -180, y: 130, z: 100},
      {x: 180, y: 135, z: -100}
    ];

    var i;
    for (i = 0; i < billboardPositions.length; i++) {
      var pos = billboardPositions[i];
      var bbGeometry = new THREE.BoxGeometry(60, 40, 2);
      var bbMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.6
      });
      var billboard = new THREE.Mesh(bbGeometry, bbMaterial);
      billboard.position.set(pos.x, pos.y, pos.z);
      billboard.userData.colorCycle = 0;
      scene.add(billboard);
      billboards.push(billboard);
    }
  };

  var createRainEffect = function() {
    var rainCount = 300;
    var i;
    for (i = 0; i < rainCount; i++) {
      var raindropGeometry = new THREE.BoxGeometry(0.3, 8, 0.1);
      var raindropMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        emissive: 0x4488ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.6
      });
      var raindrop = new THREE.Mesh(raindropGeometry, raindropMaterial);
      raindrop.position.set(
        Math.random() * 400 - 200,
        Math.random() * 300 + 50,
        Math.random() * 400 - 200
      );
      raindrop.userData.initialY = raindrop.position.y;
      raindrop.userData.speed = Math.random() * 80 + 60;
      raindrop.castShadow = false;
      scene.add(raindrop);
      raindrops.push(raindrop);
    }
  };

  var createPuddles = function() {
    var puddlePositions = [
      {x: -100, z: 80}, {x: 50, z: -100}, {x: 120, z: 60},
      {x: -150, z: -80}, {x: 80, z: 120}, {x: -60, z: 40}
    ];

    var i;
    for (i = 0; i < puddlePositions.length; i++) {
      var pos = puddlePositions[i];
      var puddleGeometry = new THREE.BoxGeometry(40, 0.5, 40);
      var puddleMaterial = new THREE.MeshStandardMaterial({
        color: 0x001a4d,
        metalness: 0.8,
        roughness: 0.1,
        emissive: 0x0044ff,
        emissiveIntensity: 0.2
      });
      var puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
      puddle.position.set(pos.x, 0.3, pos.z);
      puddle.userData.scale = 1;
      puddle.receiveShadow = true;
      scene.add(puddle);
      puddles.push(puddle);
    }
  };

  var createFlyingVehicles = function() {
    var vehicleCount = 4;
    var i;
    for (i = 0; i < vehicleCount; i++) {
      var vehicleGroup = new THREE.Group();

      var carGeometry = new THREE.BoxGeometry(12, 6, 20);
      var carMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        metalness: 0.6,
        roughness: 0.2,
        emissive: 0xff00ff,
        emissiveIntensity: 0.3
      });
      var carBody = new THREE.Mesh(carGeometry, carMaterial);
      carBody.position.y = 3;
      carBody.castShadow = true;
      vehicleGroup.add(carBody);

      var discGeometry = new THREE.CylinderGeometry(8, 8, 1, 16);
      var discMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5
      });
      var disc = new THREE.Mesh(discGeometry, discMaterial);
      disc.position.y = 0.5;
      vehicleGroup.add(disc);

      var startX = (Math.random() - 0.5) * 400;
      var startZ = (Math.random() - 0.5) * 400;
      var height = 60 + Math.random() * 80;
      vehicleGroup.position.set(startX, height, startZ);
      vehicleGroup.userData.pathT = Math.random();
      vehicleGroup.userData.height = height;
      vehicleGroup.userData.centerX = startX;
      vehicleGroup.userData.centerZ = startZ;
      vehicleGroup.userData.radius = 100 + Math.random() * 100;

      scene.add(vehicleGroup);
      flyingCars.push(vehicleGroup);
    }
  };

  var createAlleyBarricades = function() {
    var barricadePositions = [
      {x: -140, z: 0}, {x: 0, z: 140}, {x: 140, z: -140}
    ];

    var i, j;
    for (i = 0; i < barricadePositions.length; i++) {
      var pos = barricadePositions[i];
      for (j = 0; j < 3; j++) {
        var debrisGeometry = new THREE.BoxGeometry(20, 15, 20);
        var debrisMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a3a2a,
          metalness: 0.5,
          roughness: 0.8
        });
        var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        debris.position.set(
          pos.x + (j - 1) * 25,
          8,
          pos.z
        );
        debris.castShadow = true;
        debris.receiveShadow = true;
        scene.add(debris);
      }
    }
  };

  var createCorporateTowerHQ = function() {
    var towerGeometry = new THREE.BoxGeometry(100, 220, 100);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f1f3f,
      metalness: 0.8,
      roughness: 0.2
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 110, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    var logoGroup = new THREE.Group();
    logoGroup.position.set(0, 220, 0);

    var letterPositions = [-15, 0, 15];
    var letterLabels = ['C', 'O', 'R'];
    var i;
    for (i = 0; i < letterLabels.length; i++) {
      var letterGeometry = new THREE.BoxGeometry(8, 12, 2);
      var letterMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.7
      });
      var letter = new THREE.Mesh(letterGeometry, letterMaterial);
      letter.position.x = letterPositions[i];
      logoGroup.add(letter);
    }

    logoGroup.userData.rotation = 0;
    scene.add(logoGroup);
  };

  var createStreetVendors = function() {
    var vendorPositions = [
      {x: -120, z: 120}, {x: 120, z: -120}, {x: -80, z: 80}, {x: 80, z: -80}
    ];

    var i, j;
    for (i = 0; i < vendorPositions.length; i++) {
      var pos = vendorPositions[i];
      var boothGeometry = new THREE.BoxGeometry(25, 20, 25);
      var boothMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        metalness: 0.4,
        roughness: 0.6
      });
      var booth = new THREE.Mesh(boothGeometry, boothMaterial);
      booth.position.set(pos.x, 10, pos.z);
      booth.castShadow = true;
      booth.receiveShadow = true;
      scene.add(booth);

      for (j = 0; j < 3; j++) {
        var displayGeometry = new THREE.BoxGeometry(6, 8, 6);
        var colors = [0xff0080, 0x00ffff, 0xffff00];
        var displayMaterial = new THREE.MeshStandardMaterial({
          color: colors[j],
          emissive: colors[j],
          emissiveIntensity: 0.6
        });
        var display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.set(
          pos.x + (j - 1) * 10,
          18,
          pos.z
        );
        scene.add(display);
      }
    }
  };

  var createSecurityDrone = function() {
    var droneGroup = new THREE.Group();

    var bodyGeometry = new THREE.CylinderGeometry(4, 5, 8, 8);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    droneGroup.add(body);

    var noseGeometry = new THREE.ConeGeometry(3, 6, 8);
    var noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.7
    });
    var nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.z = -5;
    droneGroup.add(nose);

    var searchlightGeometry = new THREE.SphereGeometry(2, 8, 8);
    var searchlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.9
    });
    var searchlight = new THREE.Mesh(searchlightGeometry, searchlightMaterial);
    searchlight.position.z = -4;
    searchlight.position.y = 3;
    droneGroup.add(searchlight);

    droneGroup.position.set(150, 80, 150);
    droneGroup.userData.angle = 0;
    droneGroup.userData.radius = 120;
    droneGroup.userData.centerX = 0;
    droneGroup.userData.centerZ = 0;
    droneGroup.userData.speed = 0.5;
    droneGroup.castShadow = true;

    scene.add(droneGroup);
    securityDrone = droneGroup;
  };

  var createDataStreamPillars = function() {
    var pillarPositions = [
      {x: -100, z: -100}, {x: 100, z: -100}, {x: -100, z: 100}, {x: 100, z: 100}
    ];

    var i;
    for (i = 0; i < pillarPositions.length; i++) {
      var pos = pillarPositions[i];
      var pillarGeometry = new THREE.CylinderGeometry(8, 8, 150, 12);
      var pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.7
      });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 75, pos.z);
      pillar.receiveShadow = true;
      scene.add(pillar);

      var particleCount = 20;
      var j;
      for (j = 0; j < particleCount; j++) {
        var particleGeometry = new THREE.SphereGeometry(0.5, 4, 4);
        var particleMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ff88,
          emissive: 0x00ff88,
          emissiveIntensity: 0.8
        });
        var particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(pos.x, j * 8, pos.z);
        particle.userData.height = j * 8;
        particle.userData.pillarX = pos.x;
        particle.userData.pillarZ = pos.z;
        scene.add(particle);
      }
    }
  };

  var createLighting = function() {
    var ambientLight = new THREE.AmbientLight(0x0066ff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    var neonLight1 = new THREE.PointLight(0xff00ff, 1, 300);
    neonLight1.position.set(-200, 100, -150);
    scene.add(neonLight1);

    var neonLight2 = new THREE.PointLight(0x00ffff, 1, 300);
    neonLight2.position.set(200, 100, 150);
    scene.add(neonLight2);

    var neonLight3 = new THREE.PointLight(0xffff00, 0.8, 250);
    neonLight3.position.set(-200, 80, 100);
    scene.add(neonLight3);
  };

  var update = function(delta) {
    updateRain(delta);
    updatePuddles(delta);
    updateBillboards(delta);
    updateFlyingCars(delta);
    updateSecurityDrone(delta);
    updateDataStreamParticles(delta);
  };

  var updateRain = function(delta) {
    var i;
    for (i = 0; i < raindrops.length; i++) {
      var raindrop = raindrops[i];
      raindrop.position.y -= raindrop.userData.speed * delta;

      if (raindrop.position.y < 0) {
        raindrop.position.y = raindrop.userData.initialY;
        raindrop.position.x = Math.random() * 400 - 200;
        raindrop.position.z = Math.random() * 400 - 200;
      }
    }
  };

  var updatePuddles = function(delta) {
    var i;
    for (i = 0; i < puddles.length; i++) {
      var puddle = puddles[i];
      puddle.userData.scale += Math.sin(Date.now() * 0.002 + i) * delta * 0.5;
      puddle.userData.scale = Math.max(0.8, Math.min(1.3, puddle.userData.scale));
      puddle.scale.x = puddle.userData.scale;
      puddle.scale.z = puddle.userData.scale;
    }
  };

  var updateBillboards = function(delta) {
    var i;
    for (i = 0; i < billboards.length; i++) {
      var billboard = billboards[i];
      billboard.userData.colorCycle += delta;

      var cycle = billboard.userData.colorCycle % 3;
      var colors = [0x00ffff, 0xff00ff, 0xffff00];
      var nextColor;

      if (cycle < 1) {
        var t = cycle;
        nextColor = colors[0];
      } else if (cycle < 2) {
        nextColor = colors[1];
      } else {
        nextColor = colors[2];
      }

      billboard.material.emissive.setHex(nextColor);
      billboard.material.color.setHex(nextColor);
    }
  };

  var updateFlyingCars = function(delta) {
    var i;
    for (i = 0; i < flyingCars.length; i++) {
      var car = flyingCars[i];
      car.userData.pathT += delta * 0.15;

      var angle = car.userData.pathT * Math.PI * 2;
      car.position.x = car.userData.centerX + Math.cos(angle) * car.userData.radius;
      car.position.z = car.userData.centerZ + Math.sin(angle) * car.userData.radius;

      car.lookAt(
        car.userData.centerX,
        car.position.y,
        car.userData.centerZ
      );
    }
  };

  var updateSecurityDrone = function(delta) {
    if (!securityDrone) return;

    securityDrone.userData.angle += securityDrone.userData.speed * delta;
    var x = securityDrone.userData.centerX + Math.cos(securityDrone.userData.angle) * securityDrone.userData.radius;
    var z = securityDrone.userData.centerZ + Math.sin(securityDrone.userData.angle) * securityDrone.userData.radius;

    securityDrone.position.x = x;
    securityDrone.position.z = z;

    securityDrone.rotation.z += delta * 0.3;
  };

  var updateDataStreamParticles = function(delta) {
    var particles = scene.children.filter(function(obj) {
      return obj.userData.height !== undefined && obj.userData.pillarX !== undefined;
    });

    var i;
    for (i = 0; i < particles.length; i++) {
      var particle = particles[i];
      particle.position.y += delta * 40;

      if (particle.position.y > particle.userData.height + 150) {
        particle.position.y = particle.userData.height;
      }
    }
  };

  var reset = function() {
    raindrops.forEach(function(raindrop) {
      raindrop.position.set(
        Math.random() * 400 - 200,
        Math.random() * 300 + 50,
        Math.random() * 400 - 200
      );
    });

    flyingCars.forEach(function(car) {
      car.userData.pathT = Math.random();
    });

    if (securityDrone) {
      securityDrone.userData.angle = 0;
      securityDrone.position.set(150, 80, 150);
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
