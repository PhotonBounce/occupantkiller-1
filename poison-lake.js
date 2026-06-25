window.PoisonLake = (function() {
  'use strict';

  var scene;
  var camera;
  var waterMesh;
  var bubbleParticles = [];
  var buoys = [];
  var pipes = [];
  var platformMeshes = [];

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    bubbleParticles = [];
    buoys = [];
    pipes = [];
    platformMeshes = [];

    buildWater();
    buildTrees();
    buildPipes();
    buildPlatforms();
    buildBuoys();
    buildFactory();
    initializeBubbles();
  }

  function buildWater() {
    var geometry = new THREE.BoxGeometry(400, 8, 400);
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8
    });
    waterMesh = new THREE.Mesh(geometry, material);
    waterMesh.position.y = -5;
    waterMesh.name = 'poisonWater';
    scene.add(waterMesh);
  }

  function buildTrees() {
    var treePositions = [
      [-80, 0, -90],
      [-70, 0, 50],
      [85, 0, -75],
      [90, 0, 60],
      [-100, 0, 30],
      [75, 0, -45]
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];
      var trunkGeo = new THREE.CylinderGeometry(3, 4, 35, 8);
      var trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(pos[0], pos[1] + 15, pos[2]);
      scene.add(trunk);
    }
  }

  function buildPipes() {
    var pipeConfigs = [
      { pos: [-50, 15, -100], rot: [0.3, 0, 0] },
      { pos: [60, 12, -95], rot: [0.25, 0, 0] },
      { pos: [-70, 18, 80], rot: [0.35, 0, 0] }
    ];

    for (var i = 0; i < pipeConfigs.length; i++) {
      var config = pipeConfigs[i];
      var pipeGeo = new THREE.CylinderGeometry(2, 2, 50, 12);
      var pipeMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.7,
        metalness: 0.3
      });
      var pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(config.pos[0], config.pos[1], config.pos[2]);
      pipe.rotation.set(config.rot[0], config.rot[1], config.rot[2]);
      scene.add(pipe);
      pipes.push(pipe);
    }
  }

  function buildPlatforms() {
    var platformPositions = [
      [-40, 5, 20],
      [50, 8, -30],
      [10, 3, 60]
    ];

    for (var i = 0; i < platformPositions.length; i++) {
      var pos = platformPositions[i];

      var pillarGeo = new THREE.CylinderGeometry(2.5, 2.5, Math.abs(pos[1]) + 8, 10);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8
      });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pos[0], (Math.abs(pos[1]) + 8) / 2 - 5, pos[2]);
      scene.add(pillar);

      var platformGeo = new THREE.BoxGeometry(25, 1.5, 25);
      var platformMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.6,
        metalness: 0.5
      });
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(pos[0], pos[1], pos[2]);
      scene.add(platform);
      platformMeshes.push(platform);
    }
  }

  function buildBuoys() {
    var buoyPositions = [
      [-120, 2, 0],
      [120, 2, 50],
      [-100, 2, -120],
      [110, 2, -80]
    ];

    for (var i = 0; i < buoyPositions.length; i++) {
      var pos = buoyPositions[i];

      var sphereGeo = new THREE.SphereGeometry(3, 16, 16);
      var sphereMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0xff6600,
        emissiveIntensity: 0.4,
        roughness: 0.4
      });
      var buoySphere = new THREE.Mesh(sphereGeo, sphereMat);
      buoySphere.position.set(pos[0], pos[1], pos[2]);
      scene.add(buoySphere);

      var antennaGeo = new THREE.ConeGeometry(1, 8, 8);
      var antennaMat = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xff9900,
        emissiveIntensity: 0.5
      });
      var antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.set(pos[0], pos[1] + 7, pos[2]);
      scene.add(antenna);

      buoys.push({ sphere: buoySphere, antenna: antenna });
    }
  }

  function buildFactory() {
    var factoryGeo = new THREE.BoxGeometry(60, 45, 80);
    var factoryMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.1
    });
    var factoryBuilding = new THREE.Mesh(factoryGeo, factoryMat);
    factoryBuilding.position.set(-150, 20, 0);
    scene.add(factoryBuilding);

    var roofGeo = new THREE.ConeGeometry(50, 15, 8);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95
    });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(-150, 50, 0);
    scene.add(roof);

    var smokeStackGeo = new THREE.CylinderGeometry(4, 5, 35, 12);
    var smokeStackMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    });
    var smokeStack = new THREE.Mesh(smokeStackGeo, smokeStackMat);
    smokeStack.position.set(-170, 65, 25);
    scene.add(smokeStack);
  }

  function initializeBubbles() {
    var bubbleCount = 120;
    for (var i = 0; i < bubbleCount; i++) {
      var bubble = {
        x: Math.random() * 400 - 200,
        y: Math.random() * 30 - 5,
        z: Math.random() * 400 - 200,
        radius: Math.random() * 0.4 + 0.15,
        speed: Math.random() * 2 + 1.5,
        age: Math.random() * 5
      };
      bubbleParticles.push(bubble);
    }
  }

  function updateBubbles(delta) {
    for (var i = 0; i < bubbleParticles.length; i++) {
      var bubble = bubbleParticles[i];
      bubble.y += bubble.speed * delta;
      bubble.age += delta;

      if (bubble.y > 8 || bubble.age > 6) {
        bubble.y = -10;
        bubble.x = Math.random() * 400 - 200;
        bubble.z = Math.random() * 400 - 200;
        bubble.age = 0;
      }
    }
  }

  function update(delta) {
    updateBubbles(delta);

    for (var i = 0; i < buoys.length; i++) {
      var buoy = buoys[i];
      buoy.sphere.rotation.y += 0.3 * delta;
      buoy.antenna.rotation.x += 0.5 * delta;
    }

    for (var j = 0; j < platformMeshes.length; j++) {
      platformMeshes[j].rotation.z += 0.05 * delta;
    }

    if (waterMesh) {
      waterMesh.material.emissiveIntensity = 0.7 + Math.sin(Date.now() * 0.0015) * 0.15;
    }
  }

  function reset() {
    bubbleParticles = [];
    buoys = [];
    pipes = [];
    platformMeshes = [];
    initializeBubbles();

    for (var i = 0; i < buoys.length; i++) {
      buoys[i].sphere.rotation.y = 0;
      buoys[i].antenna.rotation.x = 0;
    }

    for (var j = 0; j < platformMeshes.length; j++) {
      platformMeshes[j].rotation.z = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
