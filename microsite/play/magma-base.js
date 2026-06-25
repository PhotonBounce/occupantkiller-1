window.MagmaBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var lavaBubbles = [];
  var steamParticles = [];
  var heatShimmers = [];
  var powerGenerators = [];
  var craterCenterPos = new THREE.Vector3(0, -50, 0);
  var ambientLight = null;
  var lavaSurfaceY = -45;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Set up lighting for volcanic environment
    ambientLight = new THREE.AmbientLight(0xffa500, 0.4);
    scene.add(ambientLight);

    var pointLight1 = new THREE.PointLight(0xff4500, 2, 200);
    pointLight1.position.set(0, -30, 0);
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0xff6347, 1.5, 150);
    pointLight2.position.set(40, -35, -40);
    scene.add(pointLight2);

    // Build volcanic crater center
    buildCrater();

    // Build lava flow channels
    buildLavaFlows();

    // Build military platforms over lava
    buildMilitaryPlatforms();

    // Build cooling vents system
    buildCoolingVents();

    // Build volcanic rock bunkers
    buildBunkers();

    // Build obsidian pillars
    buildObsidianPillars();

    // Build power generators
    buildPowerGenerators();

    // Build fire suppression system
    buildSuppressionsystem();

    // Initialize particle effects
    createLavaBubbles();
    createSteamClouds();
  };

  var buildCrater = function() {
    // Large crater pit walls
    var craterWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(100, 40, 100),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    craterWall1.position.copy(craterCenterPos);
    craterWall1.position.y -= 20;
    craterWall1.castShadow = true;
    craterWall1.receiveShadow = true;
    scene.add(craterWall1);

    // Glowing lava blocks at crater bottom
    var lavaCount = 8;
    for (var i = 0; i < lavaCount; i++) {
      var angle = (i / lavaCount) * Math.PI * 2;
      var radius = 25;
      var lavaBlock = new THREE.Mesh(
        new THREE.BoxGeometry(12, 8, 12),
        new THREE.MeshStandardMaterial({
          color: 0xff4500,
          emissive: 0xff6347,
          emissiveIntensity: 0.8,
          metalness: 0.3,
          roughness: 0.4
        })
      );
      lavaBlock.position.set(
        Math.cos(angle) * radius,
        lavaSurfaceY,
        Math.sin(angle) * radius
      );
      lavaBlock.castShadow = true;
      lavaBlock.receiveShadow = true;
      scene.add(lavaBlock);
    }

    // Central crater glow sphere (invisible but provides ambient glow reference)
    var glowGeometry = new THREE.SphereGeometry(15, 16, 16);
    var glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0
    });
    var glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    glowSphere.position.copy(craterCenterPos);
    glowSphere.position.y = lavaSurfaceY;
    scene.add(glowSphere);
  };

  var buildLavaFlows = function() {
    // Multiple branching lava flow channels
    var flowDirections = [
      { x: 1, z: 0 },
      { x: 0.7, z: 0.7 },
      { x: 0, z: 1 },
      { x: -0.7, z: 0.7 },
      { x: -1, z: 0 },
      { x: -0.7, z: -0.7 },
      { x: 0, z: -1 },
      { x: 0.7, z: -0.7 }
    ];

    for (var d = 0; d < flowDirections.length; d++) {
      var direction = flowDirections[d];

      // Main flow channel
      for (var i = 0; i < 5; i++) {
        var distance = (i + 1) * 25;
        var flowBlock = new THREE.Mesh(
          new THREE.BoxGeometry(8, 4, 14),
          new THREE.MeshStandardMaterial({
            color: 0xdd5500,
            emissive: 0xff4500,
            emissiveIntensity: 0.6,
            metalness: 0.2,
            roughness: 0.5
          })
        );
        flowBlock.position.set(
          direction.x * distance,
          lavaSurfaceY + 1,
          direction.z * distance
        );
        flowBlock.castShadow = true;
        flowBlock.receiveShadow = true;
        scene.add(flowBlock);
      }

      // Secondary branching flows
      if (d % 2 === 0) {
        var branchDir = { x: -direction.z, z: direction.x };
        for (var j = 0; j < 3; j++) {
          var mainDist = 30;
          var branchDist = (j + 1) * 15;
          var branchBlock = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3, 10),
            new THREE.MeshStandardMaterial({
              color: 0xcc4400,
              emissive: 0xff3300,
              emissiveIntensity: 0.5
            })
          );
          branchBlock.position.set(
            direction.x * mainDist + branchDir.x * branchDist,
            lavaSurfaceY + 0.5,
            direction.z * mainDist + branchDir.z * branchDist
          );
          branchBlock.castShadow = true;
          scene.add(branchBlock);
        }
      }
    }
  };

  var buildMilitaryPlatforms = function() {
    // Large command platform over crater
    var commandPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(40, 2, 40),
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    commandPlatform.position.set(0, -15, -50);
    commandPlatform.castShadow = true;
    commandPlatform.receiveShadow = true;
    scene.add(commandPlatform);

    // Support pillars for command platform
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 30, 8),
        new THREE.MeshStandardMaterial({
          color: 0x555555,
          metalness: 0.6
        })
      );
      pillar.position.set(
        Math.cos(angle) * 15,
        -30,
        Math.sin(angle) * 15 - 50
      );
      pillar.castShadow = true;
      scene.add(pillar);
    }

    // Suspended walkway platforms over lava flows
    var walkways = [
      { x: 40, z: 0 },
      { x: -40, z: 0 },
      { x: 0, z: 40 },
      { x: 0, z: -40 }
    ];

    for (var w = 0; w < walkways.length; w++) {
      var walkway = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.5, 35),
        new THREE.MeshStandardMaterial({
          color: 0x444444,
          metalness: 0.8
        })
      );
      walkway.position.set(walkways[w].x, -20, walkways[w].z);
      walkway.castShadow = true;
      walkway.receiveShadow = true;
      scene.add(walkway);
    }

    // Guard tower platform
    var towerBase = new THREE.Mesh(
      new THREE.BoxGeometry(15, 1.5, 15),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    towerBase.position.set(50, -10, 50);
    towerBase.castShadow = true;
    scene.add(towerBase);

    var towerPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 25, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    towerPillar.position.set(50, 2.5, 50);
    towerPillar.castShadow = true;
    scene.add(towerPillar);
  };

  var buildCoolingVents = function() {
    var ventPositions = [
      { x: 30, z: 30 },
      { x: -30, z: 30 },
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: 0, z: 35 }
    ];

    for (var v = 0; v < ventPositions.length; v++) {
      var pos = ventPositions[v];
      var vent = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      vent.position.set(pos.x, -15, pos.z);
      vent.castShadow = true;
      vent.receiveShadow = true;
      scene.add(vent);

      // Vent cap
      var cap = new THREE.Mesh(
        new THREE.ConeGeometry(5.5, 3, 12),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      cap.position.set(pos.x, -3, pos.z);
      scene.add(cap);

      // Store vent position for steam particles
      steamParticles.push({
        x: pos.x,
        y: -3,
        z: pos.z,
        age: 0,
        maxAge: 3,
        particles: []
      });
    }
  };

  var buildBunkers = function() {
    var bunkerPositions = [
      { x: -60, z: 0 },
      { x: 60, z: 0 },
      { x: 0, z: 60 },
      { x: 0, z: -60 }
    ];

    for (var b = 0; b < bunkerPositions.length; b++) {
      var pos = bunkerPositions[b];

      // Bunker main structure
      var bunker = new THREE.Mesh(
        new THREE.BoxGeometry(20, 15, 25),
        new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
      );
      bunker.position.set(pos.x, -7, pos.z);
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      scene.add(bunker);

      // Bunker roof reinforcement
      var roof = new THREE.Mesh(
        new THREE.BoxGeometry(22, 2, 27),
        new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
      );
      roof.position.set(pos.x, 8, pos.z);
      roof.castShadow = true;
      scene.add(roof);

      // Entrance ramp
      var ramp = new THREE.Mesh(
        new THREE.BoxGeometry(18, 1, 15),
        new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
      );
      var angle = Math.atan2(pos.z, pos.x);
      ramp.position.set(
        pos.x + Math.cos(angle) * 20,
        -15,
        pos.z + Math.sin(angle) * 20
      );
      ramp.rotation.z = angle;
      scene.add(ramp);
    }
  };

  var buildObsidianPillars = function() {
    var pillarCount = 12;
    for (var p = 0; p < pillarCount; p++) {
      var angle = (p / pillarCount) * Math.PI * 2;
      var radius = 35;
      var height = 25 + Math.random() * 15;

      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 4, height, 6),
        new THREE.MeshStandardMaterial({
          color: 0x0a0a0a,
          metalness: 0.5,
          roughness: 0.8
        })
      );
      pillar.position.set(
        Math.cos(angle) * radius,
        -40 + height / 2,
        Math.sin(angle) * radius
      );
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    }
  };

  var buildPowerGenerators = function() {
    var generatorPositions = [
      { x: 45, z: -45 },
      { x: -45, z: 45 }
    ];

    for (var g = 0; g < generatorPositions.length; g++) {
      var pos = generatorPositions[g];

      // Generator main unit
      var genUnit = new THREE.Mesh(
        new THREE.BoxGeometry(12, 18, 12),
        new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.7,
          roughness: 0.3
        })
      );
      genUnit.position.set(pos.x, 0, pos.z);
      genUnit.castShadow = true;
      genUnit.receiveShadow = true;
      scene.add(genUnit);

      // Generator turbine shaft
      var shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 20, 8),
        new THREE.MeshStandardMaterial({
          color: 0x555555,
          metalness: 0.8
        })
      );
      shaft.position.set(pos.x, 10, pos.z);
      shaft.rotation.z = Math.PI / 2;
      shaft.castShadow = true;
      scene.add(shaft);

      // Warning lights
      var lightColor = 0xff0000;
      var warningLight = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 8),
        new THREE.MeshStandardMaterial({
          color: lightColor,
          emissive: lightColor,
          emissiveIntensity: 0.8
        })
      );
      warningLight.position.set(pos.x, 20, pos.z);
      scene.add(warningLight);

      // Store generator for animation
      powerGenerators.push({
        x: pos.x,
        y: 10,
        z: pos.z,
        shaft: shaft,
        light: warningLight
      });
    }
  };

  var buildSuppressionsystem = function() {
    // Main header pipe running across ceiling
    var headerPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 200, 8),
      new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7
      })
    );
    headerPipe.position.set(0, 25, 0);
    headerPipe.rotation.z = Math.PI / 2;
    headerPipe.castShadow = true;
    scene.add(headerPipe);

    // Branch pipes with sprinkler heads
    var sprinklerCount = 8;
    for (var s = 0; s < sprinklerCount; s++) {
      var angle = (s / sprinklerCount) * Math.PI * 2;
      var distance = 50;

      // Vertical branch pipe
      var branchPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 15, 6),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      branchPipe.position.set(
        Math.cos(angle) * distance,
        15,
        Math.sin(angle) * distance
      );
      branchPipe.castShadow = true;
      scene.add(branchPipe);

      // Sprinkler head
      var sprinklerHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 0.8
        })
      );
      sprinklerHead.position.set(
        Math.cos(angle) * distance,
        7.5,
        Math.sin(angle) * distance
      );
      scene.add(sprinklerHead);
    }
  };

  var createLavaBubbles = function() {
    var bubbleCount = 15;
    for (var b = 0; b < bubbleCount; b++) {
      var bubble = new THREE.Mesh(
        new THREE.SphereGeometry(2 + Math.random() * 3, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff5500,
          emissive: 0xff3300,
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.8
        })
      );
      var angle = Math.random() * Math.PI * 2;
      var radius = Math.random() * 20;
      bubble.position.set(
        Math.cos(angle) * radius,
        lavaSurfaceY,
        Math.sin(angle) * radius
      );
      bubble.userData.vx = (Math.random() - 0.5) * 0.5;
      bubble.userData.vy = 2 + Math.random() * 1;
      bubble.userData.vz = (Math.random() - 0.5) * 0.5;
      bubble.userData.age = 0;
      bubble.userData.maxAge = 2 + Math.random();
      bubble.castShadow = true;
      scene.add(bubble);
      lavaBubbles.push(bubble);
    }
  };

  var createSteamClouds = function() {
    for (var s = 0; s < steamParticles.length; s++) {
      var vent = steamParticles[s];
      var cloudParticles = [];

      for (var p = 0; p < 8; p++) {
        var particle = new THREE.Mesh(
          new THREE.SphereGeometry(2, 6, 6),
          new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            transparent: true,
            opacity: 0.4
          })
        );
        particle.position.set(vent.x, vent.y, vent.z);
        particle.userData.vx = (Math.random() - 0.5) * 1.5;
        particle.userData.vy = 2 + Math.random() * 2;
        particle.userData.vz = (Math.random() - 0.5) * 1.5;
        particle.userData.age = 0;
        particle.userData.maxAge = 3;
        scene.add(particle);
        cloudParticles.push(particle);
      }

      vent.particles = cloudParticles;
    }
  };

  var update = function(delta) {
    // Update lava bubbles
    for (var b = 0; b < lavaBubbles.length; b++) {
      var bubble = lavaBubbles[b];
      bubble.position.x += bubble.userData.vx * delta;
      bubble.position.y += bubble.userData.vy * delta;
      bubble.position.z += bubble.userData.vz * delta;
      bubble.userData.age += delta;

      // Fade out and pop
      var lifeRatio = bubble.userData.age / bubble.userData.maxAge;
      bubble.material.opacity = 0.8 * (1 - lifeRatio);
      bubble.scale.x = 1 - lifeRatio * 0.3;
      bubble.scale.y = 1 - lifeRatio * 0.3;
      bubble.scale.z = 1 - lifeRatio * 0.3;

      // Reset bubble when done
      if (bubble.userData.age >= bubble.userData.maxAge) {
        var angle = Math.random() * Math.PI * 2;
        var radius = Math.random() * 20;
        bubble.position.set(
          Math.cos(angle) * radius,
          lavaSurfaceY,
          Math.sin(angle) * radius
        );
        bubble.userData.age = 0;
        bubble.material.opacity = 0.8;
        bubble.scale.set(1, 1, 1);
      }
    }

    // Update steam particles
    for (var s = 0; s < steamParticles.length; s++) {
      var vent = steamParticles[s];
      for (var p = 0; p < vent.particles.length; p++) {
        var particle = vent.particles[p];
        particle.position.x += particle.userData.vx * delta;
        particle.position.y += particle.userData.vy * delta;
        particle.position.z += particle.userData.vz * delta;
        particle.userData.age += delta;

        // Fade and rise
        var steamLife = particle.userData.age / particle.userData.maxAge;
        particle.material.opacity = 0.4 * (1 - steamLife);
        particle.scale.x = 1 + steamLife * 2;
        particle.scale.y = 1 + steamLife * 2;
        particle.scale.z = 1 + steamLife * 2;

        // Reset particle
        if (particle.userData.age >= particle.userData.maxAge) {
          particle.position.set(vent.x, vent.y, vent.z);
          particle.userData.age = 0;
          particle.userData.vx = (Math.random() - 0.5) * 1.5;
          particle.userData.vy = 2 + Math.random() * 2;
          particle.userData.vz = (Math.random() - 0.5) * 1.5;
          particle.material.opacity = 0.4;
          particle.scale.set(1, 1, 1);
        }
      }
    }

    // Animate power generators
    for (var g = 0; g < powerGenerators.length; g++) {
      var gen = powerGenerators[g];
      gen.shaft.rotation.y += delta * 5;
      gen.light.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    }

    // Pulsing lava glow in ambient light
    var pulseIntensity = 0.4 + Math.sin(Date.now() * 0.001) * 0.1;
    if (ambientLight) {
      ambientLight.intensity = pulseIntensity;
    }

    // Heat shimmer effect (subtle oscillation of ground platforms)
    var shimmerObjects = scene.children.filter(function(obj) {
      return obj.geometry && obj.geometry instanceof THREE.BoxGeometry &&
             obj.material && obj.material.color &&
             (obj.material.color.getHex() === 0x333333 || obj.material.color.getHex() === 0x444444);
    });

    for (var h = 0; h < shimmerObjects.length; h++) {
      var shimmerObj = shimmerObjects[h];
      if (shimmerObj.userData.originalY === undefined) {
        shimmerObj.userData.originalY = shimmerObj.position.y;
      }
      shimmerObj.position.y = shimmerObj.userData.originalY + Math.sin(Date.now() * 0.002 + h) * 0.3;
    }
  };

  var reset = function() {
    // Reset lava bubbles
    for (var b = 0; b < lavaBubbles.length; b++) {
      scene.remove(lavaBubbles[b]);
    }
    lavaBubbles = [];

    // Reset steam particles
    for (var s = 0; s < steamParticles.length; s++) {
      for (var p = 0; p < steamParticles[s].particles.length; p++) {
        scene.remove(steamParticles[s].particles[p]);
      }
    }
    steamParticles = [];

    // Reset power generators
    powerGenerators = [];

    // Reinitialize particles
    createLavaBubbles();
    createSteamClouds();
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
